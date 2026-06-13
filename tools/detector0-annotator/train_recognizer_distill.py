#!/usr/bin/env python3
"""Distill clean-landmark recognizer structure into the runtime-landmark model.

Teacher: clean handcrop landmark recognizer from .cache/handcrop-lm2
Student: our-model landmark recognizer from .cache/recog-seq-w64-merged

Overlapping PopSign clips get hard-label CE plus teacher soft-logit KL. Clips
without a clean teacher view (ASL Citizen additions) get hard-label CE only.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_recognizer_distill.py \
      --student-data .cache/recog-seq-w64-merged --teacher-data .cache/handcrop-lm2 \
      --teacher-checkpoint output/recognizer-v1.pt --epochs 80 --device mps
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from train_recognizer import Recognizer, hand_feat, load

HERE = Path(__file__).resolve().parent
HAND_FEAT = len(hand_feat(None))


def torch_load(path: Path):
    try:
        return torch.load(path, map_location="cpu", weights_only=False)
    except TypeError:
        return torch.load(path, map_location="cpu")


def clip_ids_in_load_order(data_dir: Path):
    rows = json.loads((data_dir / "rows.json").read_text())["rows"]
    seen, ids = set(), []
    for r in rows:
        cid = r["clip_id"]
        if cid not in seen:
            seen.add(cid)
            ids.append(cid)
    return np.array(ids, dtype=object)


def load_named(data_dir: Path):
    X, L, y, sp, labels, T = load(data_dir)
    clip_ids = clip_ids_in_load_order(data_dir)
    if len(clip_ids) != len(X):
        raise RuntimeError(f"{data_dir}: load() returned {len(X)} clips but found {len(clip_ids)} clip ids")
    return {"X": X, "L": L, "y": y, "sp": sp, "labels": labels, "T": T, "clip_ids": clip_ids}


def resolve_device(name: str):
    if name == "mps" and not torch.backends.mps.is_available():
        return torch.device("cpu")
    return torch.device(name)


def split_student(sp, seed, batch, limit_train=0, limit_monitor=0, limit_test=0):
    pool = np.where((sp == "train") | (sp == "validation"))[0]
    rng = np.random.RandomState(seed)
    rng.shuffle(pool)
    n_mon = max(batch, int(0.12 * len(pool)))
    mon, tr = pool[:n_mon], pool[n_mon:]
    te = np.where(sp == "test")[0]
    if limit_train:
        tr = tr[:limit_train]
    if limit_monitor:
        mon = mon[:limit_monitor]
    if limit_test:
        te = te[:limit_test]
    return tr, mon, te


def split_teacher(sp, seed, batch, limit_train=0, limit_monitor=0):
    pool = np.where((sp == "train") | (sp == "validation"))[0]
    rng = np.random.RandomState(seed)
    rng.shuffle(pool)
    n_mon = max(batch, int(0.12 * len(pool)))
    mon, tr = pool[:n_mon], pool[n_mon:]
    if limit_train:
        tr = tr[:limit_train]
    if limit_monitor:
        mon = mon[:limit_monitor]
    return tr, mon


def infer_hidden(state_dict):
    return int(state_dict["gru.weight_hh_l0"].shape[1])


def load_teacher_checkpoint(path: Path, feat: int, dev):
    ck = torch_load(path)
    labels = ck["labels"]
    hidden = infer_hidden(ck["state_dict"])
    model = Recognizer(feat=int(ck.get("feat", feat)), hidden=hidden, n_classes=len(labels)).to(dev)
    model.load_state_dict(ck["state_dict"])
    model.eval()
    return model, labels, f"checkpoint:{path}"


def train_teacher(clean, args, dev):
    model = Recognizer(feat=clean["X"].shape[-1], hidden=args.teacher_hidden, n_classes=len(clean["labels"])).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.teacher_lr, weight_decay=1e-4)
    tr, mon = split_teacher(clean["sp"], args.seed, args.batch, args.limit_teacher_train, args.limit_teacher_monitor)
    Xt = torch.from_numpy(clean["X"]).to(dev)
    Lt = torch.from_numpy(clean["L"]).to(dev)
    yt = torch.from_numpy(clean["y"]).to(dev)

    def evaluate(idx):
        model.eval()
        with torch.no_grad():
            ii = torch.as_tensor(idx, device=dev)
            logits = model(Xt[ii], Lt[ii])
            return (logits.argmax(-1) == yt[ii]).float().mean().item()

    best, best_state = -1.0, None
    for ep in range(args.teacher_epochs):
        model.train()
        order = tr.copy()
        np.random.shuffle(order)
        losses = []
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            loss = F.cross_entropy(model(Xt[bi], Lt[bi]), yt[bi])
            opt.zero_grad()
            loss.backward()
            opt.step()
            losses.append(float(loss.detach().cpu()))
        val = evaluate(mon) if len(mon) else 0.0
        if val > best:
            best = val
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        print(f"teacher ep {ep:3d} loss {np.mean(losses):.3f} mon top1 {val:.3f} (best {best:.3f})")
    if best_state is not None:
        model.load_state_dict(best_state)
    model.eval()
    return model, clean["labels"], "trained-in-memory"


def load_or_train_teacher(clean, args, dev):
    if args.teacher_checkpoint and args.teacher_checkpoint.exists() and not args.force_train_teacher:
        return load_teacher_checkpoint(args.teacher_checkpoint, clean["X"].shape[-1], dev)
    return train_teacher(clean, args, dev)


def teacher_index_for_student(clean, student):
    clean_by_clip = {cid: i for i, cid in enumerate(clean["clip_ids"])}
    return np.array([clean_by_clip.get(cid, -1) for cid in student["clip_ids"]], dtype=np.int64)


def student_label_map(student_labels, teacher_labels):
    tmap = {lab: i for i, lab in enumerate(teacher_labels)}
    missing = [lab for lab in student_labels if lab not in tmap]
    if missing:
        raise RuntimeError(f"teacher lacks {len(missing)} student labels, first missing: {missing[:5]}")
    return torch.as_tensor([tmap[lab] for lab in student_labels], dtype=torch.long)


def precompute_teacher_logits(model, clean, teacher_idx, active_idx, label_map, dev, batch):
    logits = torch.zeros((len(teacher_idx), len(label_map)), dtype=torch.float32)
    covered = teacher_idx >= 0
    need = np.array([i for i in np.unique(active_idx) if covered[i]], dtype=np.int64)
    if not len(need):
        return logits, torch.from_numpy(covered)
    Xt = torch.from_numpy(clean["X"]).to(dev)
    Lt = torch.from_numpy(clean["L"]).to(dev)
    label_map = label_map.to(dev)
    model.eval()
    with torch.no_grad():
        for k in range(0, len(need), batch):
            si = need[k:k + batch]
            ti = torch.as_tensor(teacher_idx[si], device=dev)
            out = model(Xt[ti], Lt[ti]).index_select(1, label_map)
            logits[torch.as_tensor(si)] = out.detach().cpu()
    return logits, torch.from_numpy(covered)


def augment_student(x, lengths, jitter_std, frame_drop):
    if jitter_std <= 0 and frame_drop <= 0:
        return x
    x = x.clone()
    if jitter_std > 0:
        for base in (0, HAND_FEAT):
            if base + HAND_FEAT > x.shape[-1]:
                continue
            coords = slice(base, base + HAND_FEAT - 1)
            presence = x[..., base + HAND_FEAT - 1:base + HAND_FEAT]
            x[..., coords] += torch.randn_like(x[..., coords]) * jitter_std * (presence > 0).float()
    if frame_drop > 0:
        B, T = x.shape[:2]
        valid = torch.arange(T, device=x.device)[None, :] < lengths[:, None]
        drop = (torch.rand(B, T, device=x.device) < frame_drop) & valid
        all_drop = drop.sum(1) >= lengths.clamp(min=1)
        if all_drop.any():
            drop[all_drop, 0] = False
        x[drop] = 0
    return x


def evaluate(model, X, L, y, idx, batch, dev):
    model.eval()
    t1 = t5 = n = 0
    Xt = torch.from_numpy(X).to(dev)
    Lt = torch.from_numpy(L).to(dev)
    yt = torch.from_numpy(y).to(dev)
    with torch.no_grad():
        for k in range(0, len(idx), batch):
            bi = torch.as_tensor(idx[k:k + batch], device=dev)
            logits = model(Xt[bi], Lt[bi])
            yi = yt[bi]
            t1 += (logits.argmax(-1) == yi).sum().item()
            t5 += (logits.topk(min(5, logits.shape[-1]), -1).indices == yi[:, None]).any(-1).sum().item()
            n += len(bi)
    return (t1 / n if n else 0.0), (t5 / n if n else 0.0)


def train_student(student, teacher_logits, teacher_mask, tr, mon, te, args, dev):
    Xt = torch.from_numpy(student["X"]).to(dev)
    Lt = torch.from_numpy(student["L"]).to(dev)
    yt = torch.from_numpy(student["y"]).to(dev)
    tlog = teacher_logits.to(dev)
    tmask = teacher_mask.to(dev)
    model = Recognizer(feat=student["X"].shape[-1], hidden=args.student_hidden, n_classes=len(student["labels"])).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    best, best_state = -1.0, None
    history = []

    for ep in range(args.epochs):
        model.train()
        order = tr.copy()
        np.random.shuffle(order)
        sums = defaultdict(float)
        n_seen = 0
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            xb = augment_student(Xt[bi], Lt[bi], args.jitter_std, args.frame_drop)
            logits = model(xb, Lt[bi])
            ce_each = F.cross_entropy(logits, yt[bi], reduction="none")
            covered = tmask[bi]
            loss = logits.new_tensor(0.0)
            if covered.any():
                ce_cov = ce_each[covered].mean()
                kd = F.kl_div(
                    F.log_softmax(logits[covered] / args.temperature, dim=-1),
                    F.softmax(tlog[bi][covered] / args.temperature, dim=-1),
                    reduction="batchmean",
                ) * (args.temperature ** 2)
                loss = loss + covered.float().sum() * (args.alpha * ce_cov + (1.0 - args.alpha) * kd)
                sums["kd"] += float(kd.detach().cpu()) * int(covered.sum().item())
                sums["ce_teacher"] += float(ce_cov.detach().cpu()) * int(covered.sum().item())
            if (~covered).any():
                ce_plain = ce_each[~covered].mean()
                loss = loss + (~covered).float().sum() * ce_plain
                sums["ce_plain"] += float(ce_plain.detach().cpu()) * int((~covered).sum().item())
            loss = loss / len(bi)
            opt.zero_grad()
            loss.backward()
            opt.step()
            sums["loss"] += float(loss.detach().cpu()) * len(bi)
            n_seen += len(bi)

        train_loss = sums["loss"] / max(n_seen, 1)
        m1, m5 = evaluate(model, student["X"], student["L"], student["y"], mon, args.batch, dev)
        if m1 > best:
            best = m1
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        entry = {"epoch": ep, "loss": train_loss, "monitor_top1": m1, "monitor_top5": m5}
        history.append(entry)
        print(f"ep {ep:3d} loss {train_loss:.3f} mon top1 {m1:.3f} top5 {m5:.3f} (best {best:.3f})")

    if best_state is not None:
        model.load_state_dict(best_state)
    test_top1, test_top5 = evaluate(model, student["X"], student["L"], student["y"], te, args.batch, dev)
    return model, history, test_top1, test_top5


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--teacher-data", type=Path, default=HERE / ".cache/handcrop-lm2")
    ap.add_argument("--student-data", type=Path, default=HERE / ".cache/recog-seq-w64-merged")
    ap.add_argument("--teacher-checkpoint", type=Path, default=HERE / "output/recognizer-v1.pt")
    ap.add_argument("--force-train-teacher", action="store_true")
    ap.add_argument("--teacher-epochs", type=int, default=120)
    ap.add_argument("--teacher-hidden", type=int, default=128)
    ap.add_argument("--teacher-lr", type=float, default=2e-3)
    ap.add_argument("--epochs", type=int, default=80)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--student-hidden", type=int, default=128)
    ap.add_argument("--alpha", type=float, default=0.55)
    ap.add_argument("--temperature", type=float, default=3.0)
    ap.add_argument("--jitter-std", type=float, default=0.02)
    ap.add_argument("--frame-drop", type=float, default=0.10)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--limit-train", type=int, default=0)
    ap.add_argument("--limit-monitor", type=int, default=0)
    ap.add_argument("--limit-test", type=int, default=0)
    ap.add_argument("--limit-teacher-train", type=int, default=0)
    ap.add_argument("--limit-teacher-monitor", type=int, default=0)
    ap.add_argument("--no-save", action="store_true")
    ap.add_argument("--out", type=Path, default=HERE / "output/recognizer-distill.json")
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    dev = resolve_device(args.device)

    clean = load_named(args.teacher_data)
    student = load_named(args.student_data)
    teacher, teacher_labels, teacher_source = load_or_train_teacher(clean, args, dev)
    label_map = student_label_map(student["labels"], teacher_labels)
    tidx = teacher_index_for_student(clean, student)
    tr, mon, te = split_student(student["sp"], args.seed, args.batch, args.limit_train, args.limit_monitor, args.limit_test)
    active = np.concatenate([tr, mon, te])
    teacher_logits, teacher_mask = precompute_teacher_logits(teacher, clean, tidx, active, label_map, dev, args.batch)
    covered_train = int(teacher_mask[torch.as_tensor(tr)].sum().item())
    covered_total = int(teacher_mask.sum().item())
    print(
        f"student clips {len(student['X'])} | train {len(tr)} monitor {len(mon)} test {len(te)} | "
        f"classes {len(student['labels'])} | T {student['T']} | feat {student['X'].shape[-1]}"
    )
    print(
        f"teacher {teacher_source} | clean clips {len(clean['X'])} | overlap {covered_total} | "
        f"teacher-covered train {covered_train}/{len(tr)} | device {dev}"
    )
    model, history, t1, t5 = train_student(student, teacher_logits, teacher_mask, tr, mon, te, args, dev)
    print(f"\n=== DISTILLED RECOGNIZER TEST: top1 {t1:.3f}  top5 {t5:.3f}  (chance {1/len(student['labels']):.3f}) ===")

    if args.no_save:
        print("no-save: skipped checkpoint/receipt writes")
        return

    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save(
        {"state_dict": model.state_dict(), "labels": student["labels"], "T": student["T"],
         "feat": student["X"].shape[-1], "student_hidden": args.student_hidden},
        weights,
    )
    args.out.write_text(json.dumps({
        "schema_version": "asl-pilot-recognizer-distill/v1",
        "teacher": teacher_source,
        "teacher_data": str(args.teacher_data),
        "student_data": str(args.student_data),
        "classes": len(student["labels"]),
        "epochs": args.epochs,
        "alpha": args.alpha,
        "temperature": args.temperature,
        "jitter_std": args.jitter_std,
        "frame_drop": args.frame_drop,
        "teacher_covered_train": covered_train,
        "train_clips": len(tr),
        "monitor_clips": len(mon),
        "test_clips": len(te),
        "history": [{"epoch": h["epoch"], "loss": round(h["loss"], 4),
                     "monitor_top1": round(h["monitor_top1"], 4),
                     "monitor_top5": round(h["monitor_top5"], 4)} for h in history],
        "test_top1": round(t1, 4),
        "test_top5": round(t5, 4),
        "chance": round(1 / len(student["labels"]), 4),
        "weights": str(weights),
    }, indent=1))
    print(f"weights -> {weights}\nreceipt -> {args.out}")


if __name__ == "__main__":
    main()
