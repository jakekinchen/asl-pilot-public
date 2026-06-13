#!/usr/bin/env python3
"""From-scratch isolated-sign RECOGNIZER: hand-landmark sequence -> 95-way word.

Groups the per-frame hand landmarks (handcrop-lm2) into per-clip sequences and
trains a scratch BiGRU classifier over the 95 PopSign words. This is the product
capability the detector feeds. Runtime would use our scratch landmark model's
outputs; this baseline trains on the offline (MediaPipe-derived) landmark labels.
No pretrained weights.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_recognizer.py \
      --data .cache/handcrop-lm2 --epochs 120 --device mps
"""
from __future__ import annotations

import argparse, json
from collections import defaultdict
from pathlib import Path
import numpy as np, torch, torch.nn as nn

HERE = Path(__file__).resolve().parent
HANDS = ["left_or_first_hand", "right_or_second_hand"]
K = 21
HF = 2 + K * 2 + 1            # per hand: wrist xy + 21 wrist-relative xy + presence = 45
FEAT = 2 * HF                 # two hands = 90


def hand_feat(d):
    """Wrist abs position (location) + scale-normalized wrist-relative landmarks
    (handshape, translation+scale invariant across signers/crops) + presence.
    Presence is the continuous prob when available (our-model dataset), else 1.0
    for hard-gated absence-as-None (MediaPipe dataset)."""
    if not (d and d.get("landmarks_xy")):
        return [0.0] * HF
    pts = np.array(d["landmarks_xy"], np.float32)      # 21x2
    wrist = pts[0].copy()
    rel = pts - wrist
    scale = float(np.sqrt((rel ** 2).sum(1)).mean()) + 1e-6
    rel = rel / scale
    prob = float(d.get("presence", 1.0))
    return [float(wrist[0]), float(wrist[1])] + rel.flatten().tolist() + [prob]


def frame_feat(targets):
    return hand_feat(targets.get(HANDS[0])) + hand_feat(targets.get(HANDS[1]))


def load(data_dir: Path, velocity: bool = False):
    rows = json.loads((data_dir / "rows.json").read_text())["rows"]
    clips = defaultdict(lambda: {"label": None, "split": None, "frames": []})
    for r in rows:
        key = r["clip_id"]
        c = clips[key]; c["label"] = r["label_id"]; c["split"] = r["split"]
        c["frames"].append((r["video_frame_index"], frame_feat(r["hands_crop"])))
    labels = sorted({c["label"] for c in clips.values()})
    lab2i = {l: i for i, l in enumerate(labels)}
    T = max(len(c["frames"]) for c in clips.values())
    items = []
    for c in clips.values():
        fr = [f for _, f in sorted(c["frames"])]
        arr = np.array(fr, np.float32)                          # (n, FEAT)
        if velocity:
            vel = np.zeros_like(arr); vel[1:] = arr[1:] - arr[:-1]
            arr = np.concatenate([arr, vel], axis=1)            # (n, 2*FEAT)
        seq = np.zeros((T, arr.shape[1]), np.float32); seq[:len(fr)] = arr
        items.append((seq, len(fr), lab2i[c["label"]], c["split"]))
    X = np.stack([it[0] for it in items])
    L = np.array([it[1] for it in items]); y = np.array([it[2] for it in items])
    sp = np.array([it[3] for it in items])
    return X, L, y, sp, labels, T


class Recognizer(nn.Module):
    def __init__(self, feat=FEAT, hidden=128, n_classes=95):
        super().__init__()
        self.gru = nn.GRU(feat, hidden, num_layers=2, batch_first=True, bidirectional=True, dropout=0.2)
        self.head = nn.Sequential(nn.Linear(2 * hidden, hidden), nn.ReLU(inplace=True), nn.Dropout(0.3), nn.Linear(hidden, n_classes))

    def forward(self, x, lengths):
        out, _ = self.gru(x)                                  # B,T,2H
        mask = (torch.arange(x.size(1), device=x.device)[None, :] < lengths[:, None]).float().unsqueeze(-1)
        pooled = (out * mask).sum(1) / mask.sum(1).clamp(min=1)  # masked mean
        return self.head(pooled)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/handcrop-lm2")
    ap.add_argument("--epochs", type=int, default=120)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--velocity", action="store_true", help="append frame-to-frame motion (helps only with dense frames)")
    ap.add_argument("--out", type=Path, default=HERE / "output/recognizer-v1.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    X, L, y, sp, labels, T = load(args.data, velocity=args.velocity)
    Xt = torch.from_numpy(X).to(dev); Lt = torch.from_numpy(L).to(dev); yt = torch.from_numpy(y).to(dev)
    # PopSign train/validation/test are participant-disjoint. Fold validation into
    # the training pool (still disjoint from test), carve a small early-stop monitor,
    # and report the honest signer-disjoint test metric.
    pool = np.where((sp == "train") | (sp == "validation"))[0]
    rng = np.random.RandomState(args.seed); rng.shuffle(pool)
    n_mon = max(args.batch, int(0.12 * len(pool)))
    mon = pool[:n_mon]; tr = pool[n_mon:]; te = np.where(sp == "test")[0]
    print(f"clips {len(X)} | train {len(tr)} monitor {len(mon)} test {len(te)} | classes {len(labels)} | T {T} | feat {FEAT}")

    model = Recognizer(feat=X.shape[-1], n_classes=len(labels)).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    ce = nn.CrossEntropyLoss()

    def evaluate(idx):
        model.eval(); ii = torch.as_tensor(idx, device=dev)
        with torch.no_grad():
            logits = model(Xt[ii], Lt[ii]); yi = yt[ii]
            top1 = (logits.argmax(-1) == yi).float().mean().item()
            top5 = (logits.topk(5, -1).indices == yi[:, None]).any(-1).float().mean().item()
        return top1, top5

    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            loss = ce(model(Xt[bi], Lt[bi]), yt[bi])
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 10 == 0 or ep == args.epochs - 1:
            v1, v5 = evaluate(mon)
            if v1 > best: best = v1; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 30 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} loss {loss.item():.3f} val top1 {v1:.3f} top5 {v5:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)
    t1, t5 = evaluate(te)
    chance = 1.0 / len(labels)
    print(f"\n=== RECOGNIZER TEST: top1 {t1:.3f}  top5 {t5:.3f}  (chance {chance:.3f}, {len(labels)} classes) ===")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save({"state_dict": model.state_dict(), "labels": labels, "T": T, "feat": FEAT}, weights)
    args.out.write_text(json.dumps({"schema_version": "asl-pilot-recognizer/v1", "classes": len(labels),
                                    "test_top1": round(t1, 4), "test_top5": round(t5, 4), "chance": round(chance, 4),
                                    "epochs": args.epochs, "weights": str(weights)}, indent=1))
    print(f"weights -> {weights}")


if __name__ == "__main__":
    main()
