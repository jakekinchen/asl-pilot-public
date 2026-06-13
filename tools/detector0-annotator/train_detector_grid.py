#!/usr/bin/env python3
"""From-scratch Detector 0 with a SPATIAL GRID head (better small-object/hand
localization than the global-FC head in train_detector.py).

Body -> 12x12 feature map. Per target, per cell: objectness logit + an absolute
normalized box. The cell containing the GT box center is the positive cell
(objectness=1) and regresses the box; eval takes the argmax-objectness cell.
No pretrained weights. Reuses data/aug utils from train_detector.py.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_detector_grid.py \
      --data .cache/autolabel-big --epochs 140 --device mps
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from train_detector import load_data, make_xy, iou_xyxy, augment, TARGET_IDS

HERE = Path(__file__).resolve().parent
GRID = 12


class GridDetector(nn.Module):
    def __init__(self, n_targets=4, grid=GRID):
        super().__init__()
        self.nt = n_targets; self.grid = grid
        def blk(i, o): return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        self.body = nn.Sequential(blk(5, 32), blk(32, 64), blk(64, 128),
                                  nn.Conv2d(128, 128, 3, 1, 1), nn.BatchNorm2d(128), nn.ReLU(inplace=True))
        self.head = nn.Conv2d(128, n_targets * 5, 1)

    def forward(self, x):
        f = self.body(x)                                   # N,128,12,12 (for 96px)
        o = self.head(f)                                   # N, nt*5, g, g
        g = o.shape[-1]
        o = o.view(-1, self.nt, 5, g, g)
        obj = o[:, :, 0]                                   # N,nt,g,g
        box = torch.sigmoid(o[:, :, 1:])                   # N,nt,4,g,g  (abs xyxy per cell)
        return obj, box


def build_grid_targets(P, B, grid, dev):
    """P (N,nt), B (N,nt,4) -> obj_t (N,nt,g,g), pos_idx (N,nt) cell of GT center. Vectorized."""
    N, nt = P.shape
    cx = ((B[..., 0] + B[..., 2]) / 2).clamp(0, 0.999)
    cy = ((B[..., 1] + B[..., 3]) / 2).clamp(0, 0.999)
    gx = (cx * grid).long(); gy = (cy * grid).long()
    pos_idx = gy * grid + gx                               # N,nt
    obj_flat = torch.zeros(N, nt, grid * grid, device=dev)
    obj_flat.scatter_(2, pos_idx.unsqueeze(-1), P.unsqueeze(-1).float())  # 1 at center cell iff present
    return obj_flat.view(N, nt, grid, grid), pos_idx


def gather_cell(box, idx):
    """box (N,nt,4,g,g), idx (N,nt) -> (N,nt,4) box at the given flat cell."""
    N, nt, _, g, _ = box.shape
    bf = box.reshape(N, nt, 4, g * g)
    ii = idx.view(N, nt, 1, 1).expand(N, nt, 4, 1)
    return bf.gather(-1, ii).squeeze(-1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/autolabel-big")
    ap.add_argument("--epochs", type=int, default=140)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--augment", type=int, default=1)
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-grid-receipt.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    frames, pres, boxes, splits, meta = load_data(args.data)
    X = make_xy(frames, dev)
    P = torch.from_numpy(pres).to(dev); B = torch.from_numpy(boxes).to(dev)
    tr = np.where(splits == "train")[0]; te = splits == "test"; va = splits == "validation"
    grid = X.shape[-1] // 8
    print(f"data {len(frames)} | train {len(tr)} test {te.sum()} | grid {grid}x{grid} | device {dev}")

    fixed = torch.zeros(4, 4, device=dev)
    for ti in range(4):
        m = (pres[splits == "train", ti] == 1)
        if m.sum() > 0:
            fixed[ti] = torch.from_numpy(np.median(boxes[splits == "train"][m, ti], axis=0)).to(dev)

    model = GridDetector(grid=grid).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sl1 = nn.SmoothL1Loss(reduction="none")
    ncell = grid * grid

    def run_eval(mask):
        model.eval()
        ii = torch.as_tensor(np.where(mask)[0], device=dev)
        with torch.no_grad():
            obj, box = model(X[ii])
            pred = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))  # N,4,4
            Pi = P[ii]; Bi = B[ii]
            res = {"per_target": {}}; hi, hf = [], []
            for ti, t in enumerate(TARGET_IDS):
                m = Pi[:, ti] == 1; npres = int(m.sum())
                liou = iou_xyxy(pred[m, ti], Bi[m, ti]).mean().item() if npres else 0.0
                fiou = iou_xyxy(fixed[ti].expand(max(npres, 1), 4), Bi[m, ti]).mean().item() if npres else 0.0
                res["per_target"][t] = {"learned_iou": round(liou, 4), "fixed_iou": round(fiou, 4), "n_present": npres}
                if ti < 2 and npres:
                    hi.append(liou); hf.append(fiou)
            res["mean_hand_iou"] = round(float(np.mean(hi)) if hi else 0.0, 4)
            res["mean_hand_fixed_iou"] = round(float(np.mean(hf)) if hf else 0.0, 4)
        return res

    best_val = -1.0; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            Xb, Pb, Bb = augment(X[bi], P[bi], B[bi]) if args.augment else (X[bi], P[bi], B[bi])
            obj, box = model(Xb)
            obj_t, pos_idx = build_grid_targets(Pb, Bb, grid, dev)
            # objectness BCE, positive cells weighted ~= all negatives
            w = 1.0 + obj_t * (ncell - 1)
            obj_loss = (nn.functional.binary_cross_entropy_with_logits(obj, obj_t, reduction="none") * w).mean()
            # box loss at the GT positive cell, present targets only
            pbox = gather_cell(box, pos_idx)               # N,4,4
            mask = Pb.unsqueeze(-1)
            box_l1 = (sl1(pbox, Bb) * mask).sum() / (mask.sum() * 4 + 1e-6)
            iou = iou_xyxy(pbox, Bb)
            iou_l = ((1 - iou) * Pb).sum() / (Pb.sum() + 1e-6)
            loss = obj_loss + 5.0 * box_l1 + iou_l
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 5 == 0 or ep == args.epochs - 1:
            vh = run_eval(va)["mean_hand_iou"]             # select on validation, never test
            if vh > best_val:
                best_val = vh
                best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 20 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} loss {loss.item():.3f} val_hand_iou {vh:.3f} (best {best_val:.3f})")

    if best_state is not None:
        model.load_state_dict(best_state)                  # best-by-val checkpoint
    test = run_eval(te); val = run_eval(va)
    print("\n=== TEST (grid head) ===")
    for t in TARGET_IDS:
        pt = test["per_target"][t]
        print(f"  {t:30s} learned {pt['learned_iou']:.4f}  fixed {pt['fixed_iou']:.4f}  (n {pt['n_present']})")
    print(f"  HANDS learned {test['mean_hand_iou']:.4f} vs fixed {test['mean_hand_fixed_iou']:.4f}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save({"state_dict": model.state_dict(), "grid": grid, "image_px": meta.get("image_px"),
                "target_ids": TARGET_IDS, "input_channels": 5,
                "arch": "GridDetector(blk5-32-64-128 + conv128 + 1x1 head -> nt*5 per cell)"}, weights)
    args.out.write_text(json.dumps({
        "schema_version": "asl-pilot-detector0-grid-train-receipt/v1",
        "head": "spatial_grid", "grid": grid, "image_px": meta.get("image_px"),
        "data_stats": meta["stats"], "epochs": args.epochs, "best_val_hand_iou": round(best_val, 4),
        "device": str(dev), "label_source": meta["label_source"], "weights": str(weights),
        "test": test, "validation": val,
    }, indent=1))
    print(f"\nweights -> {weights}\nreceipt -> {args.out}")


if __name__ == "__main__":
    main()
