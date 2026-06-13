#!/usr/bin/env python3
"""Train a FROM-SCRATCH Detector 0 on the MediaPipe-auto-labeled dataset.

Consumes .cache/autolabel/{frames.npy,rows.json}. Predicts, per 96x96 frame,
presence + a normalized box for each of the 4 target regions. No pretrained
weights anywhere — a small CNN trained from random init. Evaluates held-out box
IoU per target vs the fixed-box (median) baseline (the bake-off gate).

Run with the PROJECT venv (torch + MPS):
  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_detector.py --epochs 120 --device mps
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

HERE = Path(__file__).resolve().parent
TARGET_IDS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"]
IMG = 96


def load_data(data_dir: Path):
    frames = np.load(data_dir / "frames.npy")  # N,96,96,3 uint8
    meta = json.loads((data_dir / "rows.json").read_text())
    rows = meta["rows"]
    N = len(rows)
    pres = np.zeros((N, 4), np.float32)
    boxes = np.zeros((N, 4, 4), np.float32)
    splits = []
    for i, r in enumerate(rows):
        splits.append(r["split"])
        for ti, t in enumerate(TARGET_IDS):
            tt = r["targets"][t]
            if tt["presence"] and tt["box_xyxy_norm"]:
                pres[i, ti] = 1.0
                boxes[i, ti] = tt["box_xyxy_norm"]
    return frames, pres, boxes, np.array(splits), meta


def make_xy(frames, device):
    x = torch.from_numpy(frames).float().div(255.0).permute(0, 3, 1, 2)  # N,3,H,W
    H, W = x.shape[-2], x.shape[-1]  # resolution-agnostic coordconv
    ys = torch.linspace(0, 1, H).view(1, 1, H, 1).expand(x.size(0), 1, H, W)
    xs = torch.linspace(0, 1, W).view(1, 1, 1, W).expand(x.size(0), 1, H, W)
    return torch.cat([x, xs, ys], dim=1).to(device)  # N,5,H,W


class Detector(nn.Module):
    def __init__(self):
        super().__init__()
        def blk(i, o): return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        self.body = nn.Sequential(blk(5, 32), blk(32, 64), blk(64, 128), blk(128, 128), nn.AdaptiveAvgPool2d(1))
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(128, 128), nn.ReLU(inplace=True), nn.Linear(128, 4 * 5))

    def forward(self, x):
        o = self.head(self.body(x)).view(-1, 4, 5)
        return o[..., 0], torch.sigmoid(o[..., 1:])  # presence_logit (N,4), box (N,4,4)


def augment(Xb, Pb, Bb):
    """On-the-fly aug: per-sample brightness + horizontal flip with left/right-hand swap."""
    b = Xb.size(0)
    Xb = Xb.clone(); Pb = Pb.clone(); Bb = Bb.clone()
    # brightness on RGB channels only
    f = torch.rand(b, 1, 1, 1, device=Xb.device) * 0.6 + 0.7
    Xb[:, 0:3] = (Xb[:, 0:3] * f).clamp(0, 1)
    # horizontal flip on a random subset
    flip = torch.rand(b, device=Xb.device) < 0.5
    idx = flip.nonzero(as_tuple=True)[0]
    if idx.numel():
        Xb[idx] = torch.flip(Xb[idx], dims=[-1])  # flips RGB + x-coordconv ramp -> 1-x
        x1 = Bb[idx, :, 0].clone(); x2 = Bb[idx, :, 2].clone()
        Bb[idx, :, 0] = 1 - x2; Bb[idx, :, 2] = 1 - x1  # mirror x; y unchanged
        Pb[idx] = Pb[idx][:, [1, 0, 2, 3]]               # swap left<->right hand slots
        Bb[idx] = Bb[idx][:, [1, 0, 2, 3]]
    return Xb, Pb, Bb


def iou_xyxy(a, b):
    ax1 = torch.min(a[..., 0], a[..., 2]); ay1 = torch.min(a[..., 1], a[..., 3])
    ax2 = torch.max(a[..., 0], a[..., 2]); ay2 = torch.max(a[..., 1], a[..., 3])
    bx1 = torch.min(b[..., 0], b[..., 2]); by1 = torch.min(b[..., 1], b[..., 3])
    bx2 = torch.max(b[..., 0], b[..., 2]); by2 = torch.max(b[..., 1], b[..., 3])
    ix1 = torch.max(ax1, bx1); iy1 = torch.max(ay1, by1)
    ix2 = torch.min(ax2, bx2); iy2 = torch.min(ay2, by2)
    iw = (ix2 - ix1).clamp(min=0); ih = (iy2 - iy1).clamp(min=0)
    inter = iw * ih
    area_a = (ax2 - ax1).clamp(min=0) * (ay2 - ay1).clamp(min=0)
    area_b = (bx2 - bx1).clamp(min=0) * (by2 - by1).clamp(min=0)
    return inter / (area_a + area_b - inter + 1e-6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/autolabel")
    ap.add_argument("--epochs", type=int, default=120)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--augment", type=int, default=1)
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-train-receipt.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    frames, pres, boxes, splits, meta = load_data(args.data)
    X = make_xy(frames, dev)
    P = torch.from_numpy(pres).to(dev); B = torch.from_numpy(boxes).to(dev)
    tr = splits == "train"; va = splits == "validation"; te = splits == "test"
    idx_tr = np.where(tr)[0]
    print(f"data: {len(frames)} frames | train {tr.sum()} val {va.sum()} test {te.sum()}")
    print("per-target present (train):", {TARGET_IDS[i]: int(pres[tr, i].sum()) for i in range(4)})

    # fixed-box baseline: median box over TRAIN present examples, per target
    fixed = torch.zeros(4, 4, device=dev)
    for ti in range(4):
        m = (pres[tr, ti] == 1)
        if m.sum() > 0:
            fixed[ti] = torch.from_numpy(np.median(boxes[tr][m, ti], axis=0)).to(dev)

    model = Detector().to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    bce = nn.BCEWithLogitsLoss()
    sl1 = nn.SmoothL1Loss(reduction="none")

    def batches(ii):
        ii = ii.copy(); np.random.shuffle(ii)
        for k in range(0, len(ii), args.batch):
            yield ii[k:k + args.batch]

    for ep in range(args.epochs):
        model.train()
        for bi in batches(idx_tr):
            bi = torch.as_tensor(bi, device=dev)
            Xb, Pb, Bb = augment(X[bi], P[bi], B[bi]) if args.augment else (X[bi], P[bi], B[bi])
            pl, bx = model(Xb)
            ploss = bce(pl, Pb)
            mask = Pb.unsqueeze(-1)
            box_l1 = (sl1(bx, Bb) * mask).sum() / (mask.sum() * 4 + 1e-6)
            iou = iou_xyxy(bx, Bb)
            iou_l = ((1 - iou) * Pb).sum() / (Pb.sum() + 1e-6)
            loss = ploss + 5.0 * box_l1 + iou_l
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 20 == 0 or ep == args.epochs - 1:
            tr_iou = eval_split(model, X, P, B, idx_tr, dev)["mean_hand_iou"]
            print(f"ep {ep:3d} loss {loss.item():.3f} train_hand_iou {tr_iou:.3f}")

    # evaluation
    def report(split_mask, name):
        ii = np.where(split_mask)[0]
        r = eval_split(model, X, P, B, ii, dev, fixed=fixed)
        return {"split": name, "n": int(len(ii)), **r}

    model.eval()
    test = report(te, "test"); val = report(va, "validation")
    print("\n=== TEST ===")
    for ti, t in enumerate(TARGET_IDS):
        print(f"  {t:30s} learned IoU {test['per_target'][t]['learned_iou']:.4f}  "
              f"fixed {test['per_target'][t]['fixed_iou']:.4f}  (n_present {test['per_target'][t]['n_present']})")
    print(f"  HANDS learned {test['mean_hand_iou']:.4f} vs fixed {test['mean_hand_fixed_iou']:.4f}")

    gate = {
        "left_or_first_hand": {"learned": test["per_target"]["left_or_first_hand"]["learned_iou"],
                               "beats_fixed": test["per_target"]["left_or_first_hand"]["learned_iou"] > test["per_target"]["left_or_first_hand"]["fixed_iou"]},
        "right_or_second_hand": {"learned": test["per_target"]["right_or_second_hand"]["learned_iou"],
                                 "beats_fixed": test["per_target"]["right_or_second_hand"]["learned_iou"] > test["per_target"]["right_or_second_hand"]["fixed_iou"]},
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({
        "schema_version": "asl-pilot-detector0-scratch-train-receipt/v1",
        "data_stats": meta["stats"], "epochs": args.epochs, "seed": args.seed, "device": str(dev),
        "label_source": meta["label_source"], "test": test, "validation": val, "gate": gate,
    }, indent=1))
    print(f"\nreceipt -> {args.out}")


def eval_split(model, X, P, B, ii, dev, fixed=None):
    model.eval()
    out = {"per_target": {}}
    with torch.no_grad():
        bi = torch.as_tensor(ii, device=dev)
        _, bx = model(X[bi])
        Pi = P[bi]; Bi = B[bi]
        hand_ious, hand_fixed = [], []
        for ti, t in enumerate(TARGET_IDS):
            m = Pi[:, ti] == 1
            npres = int(m.sum().item())
            if npres > 0:
                liou = iou_xyxy(bx[m, ti], Bi[m, ti]).mean().item()
                fiou = iou_xyxy(fixed[ti].expand(npres, 4), Bi[m, ti]).mean().item() if fixed is not None else None
            else:
                liou, fiou = 0.0, 0.0
            out["per_target"][t] = {"learned_iou": round(liou, 4),
                                    "fixed_iou": round(fiou, 4) if fiou is not None else None,
                                    "n_present": npres}
            if ti < 2 and npres > 0:
                hand_ious.append(liou); hand_fixed.append(fiou if fiou is not None else 0.0)
    out["mean_hand_iou"] = round(float(np.mean(hand_ious)) if hand_ious else 0.0, 4)
    out["mean_hand_fixed_iou"] = round(float(np.mean(hand_fixed)) if hand_fixed else 0.0, 4)
    return out


if __name__ == "__main__":
    main()
