#!/usr/bin/env python3
"""Grid detector + ZOOM augmentation (random-resized-crop) on the existing
full-frame dataset. Research shows crop/zoom aug is a strong small-object lever;
this tests how far it pushes hands without the two-stage crop pipeline. Reuses
the grid model/eval. `--selftest` validates the box-transform math.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_grid_zoom.py --selftest
  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_grid_zoom.py --data .cache/autolabel-big --epochs 180 --device mps
"""
from __future__ import annotations

import argparse, json
from pathlib import Path
import numpy as np, torch, torch.nn as nn
import torch.nn.functional as F

from train_detector import load_data, iou_xyxy, TARGET_IDS
from train_detector_grid import GridDetector, gather_cell, build_grid_targets

HERE = Path(__file__).resolve().parent


def coordconv(rgb):
    n, _, H, W = rgb.shape
    ys = torch.linspace(0, 1, H, device=rgb.device).view(1, 1, H, 1).expand(n, 1, H, W)
    xs = torch.linspace(0, 1, W, device=rgb.device).view(1, 1, 1, W).expand(n, 1, H, W)
    return torch.cat([rgb, xs, ys], dim=1)


def zoom_aug(rgb, P, B, zmax=1.5, p=0.7):
    """rgb (N,3,H,W) in [0,1]; P (N,T); B (N,T,4) xyxy[0,1]. Returns 5ch X, P, B."""
    N, _, H, W = rgb.shape; dev = rgb.device
    do = torch.rand(N, device=dev) < p
    z = torch.where(do, 1.0 + torch.rand(N, device=dev) * (zmax - 1.0), torch.ones(N, device=dev))
    mt = (1.0 - 1.0 / z)
    tx = (torch.rand(N, device=dev) * 2 - 1) * mt
    ty = (torch.rand(N, device=dev) * 2 - 1) * mt
    theta = torch.zeros(N, 2, 3, device=dev)
    theta[:, 0, 0] = 1.0 / z; theta[:, 1, 1] = 1.0 / z
    theta[:, 0, 2] = tx; theta[:, 1, 2] = ty
    grid = F.affine_grid(theta, [N, 3, H, W], align_corners=False)
    rgb_z = F.grid_sample(rgb, grid, align_corners=False, padding_mode="border")
    # box transform: v_out = (z*((2v-1) - t) + 1)/2  (per x,y)
    zc = z.view(N, 1)
    tX = tx.view(N, 1); tY = ty.view(N, 1)
    bx = B.clone()
    bx[..., 0] = (zc * ((2 * B[..., 0] - 1) - tX) + 1) / 2
    bx[..., 2] = (zc * ((2 * B[..., 2] - 1) - tX) + 1) / 2
    bx[..., 1] = (zc * ((2 * B[..., 1] - 1) - tY) + 1) / 2
    bx[..., 3] = (zc * ((2 * B[..., 3] - 1) - tY) + 1) / 2
    # drop targets whose center left the frame after zoom
    cx = (bx[..., 0] + bx[..., 2]) / 2; cy = (bx[..., 1] + bx[..., 3]) / 2
    inside = (cx > 0) & (cx < 1) & (cy > 0) & (cy < 1)
    Pz = P * inside.float()
    bx = bx.clamp(0, 1)
    return coordconv(rgb_z), Pz, bx


def selftest():
    # white square at a known box in an otherwise black image; verify the
    # transformed box still tightly encloses the square after zoom.
    H = 96; rgb = torch.zeros(1, 3, H, W := 96)
    gt = torch.tensor([[[0.30, 0.40, 0.50, 0.60], [0, 0, 0, 0]]], dtype=torch.float32)
    x1, y1, x2, y2 = [int(v * H) for v in [0.30, 0.40, 0.50, 0.60]]
    rgb[0, :, y1:y2, x1:x2] = 1.0
    P = torch.tensor([[1.0, 0.0]])
    torch.manual_seed(1)
    ok = True
    for _ in range(5):
        Xz, Pz, Bz = zoom_aug(rgb, P, gt, zmax=1.5, p=1.0)
        if Pz[0, 0] < 1:  # square left frame; skip
            continue
        b = Bz[0, 0]
        bx1, by1, bx2, by2 = [int(v.item() * H) for v in b]
        img = Xz[0, 0]
        inside_mean = img[by1:by2, bx1:bx2].mean().item() if (by2 > by1 and bx2 > bx1) else 0
        # white region should fall within predicted box -> high inside mean
        total_white = (img > 0.5).float().sum().item()
        white_in_box = (img[by1:by2, bx1:bx2] > 0.5).float().sum().item()
        frac = white_in_box / max(total_white, 1)
        print(f"  z-case: box=({b[0]:.2f},{b[1]:.2f},{b[2]:.2f},{b[3]:.2f}) inside_mean={inside_mean:.2f} white_captured={frac:.2f}")
        if frac < 0.9:
            ok = False
    print("SELFTEST", "PASS" if ok else "FAIL")
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--data", type=Path, default=HERE / ".cache/autolabel-big")
    ap.add_argument("--epochs", type=int, default=180)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-grid-zoom.json")
    args = ap.parse_args()
    if args.selftest:
        selftest(); return

    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")
    frames, pres, boxes, splits, meta = load_data(args.data)
    rgb = torch.from_numpy(frames).float().div(255).permute(0, 3, 1, 2).to(dev)
    P = torch.from_numpy(pres).to(dev); B = torch.from_numpy(boxes).to(dev)
    tr = np.where(splits == "train")[0]; te = splits == "test"; va = splits == "validation"
    grid = frames.shape[1] // 8; ncell = grid * grid
    print(f"data {len(frames)} | grid {grid} | zoom-aug")

    model = GridDetector(n_targets=4, grid=grid).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=2e-3, weight_decay=1e-4)
    sl1 = nn.SmoothL1Loss(reduction="none")

    def evaluate(mask):
        model.eval(); ii = torch.as_tensor(np.where(mask)[0], device=dev)
        with torch.no_grad():
            X = coordconv(rgb[ii]); obj, box = model(X)
            pred = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))
            out = {}
            for ti, t in enumerate(TARGET_IDS):
                m = P[ii][:, ti] == 1; n = int(m.sum())
                iou = iou_xyxy(pred[m, ti], B[ii][m, ti]) if n else torch.zeros(1, device=dev)
                out[t] = {"iou": round(iou.mean().item(), 4), "r30": round((iou > .3).float().mean().item(), 4),
                          "r50": round((iou > .5).float().mean().item(), 4), "n": n}
            out["hand_r30"] = round(np.mean([out[h]["r30"] for h in TARGET_IDS[:2]]), 4)
        return out

    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            Xb, Pb, Bb = zoom_aug(rgb[bi], P[bi], B[bi])
            # also random hflip with left/right swap
            fl = torch.rand(Xb.size(0), device=dev) < 0.5; fi = fl.nonzero(as_tuple=True)[0]
            if fi.numel():
                Xb[fi] = torch.flip(Xb[fi], dims=[-1])
                x1 = Bb[fi, :, 0].clone(); x2 = Bb[fi, :, 2].clone()
                Bb[fi, :, 0] = 1 - x2; Bb[fi, :, 2] = 1 - x1
                Pb[fi] = Pb[fi][:, [1, 0, 2, 3]]; Bb[fi] = Bb[fi][:, [1, 0, 2, 3]]
            obj, box = model(Xb)
            obj_t, pos_idx = build_grid_targets(Pb, Bb, grid, dev)
            w = 1.0 + obj_t * (ncell - 1)
            obj_loss = (F.binary_cross_entropy_with_logits(obj, obj_t, reduction="none") * w).mean()
            pbox = gather_cell(box, pos_idx); mask = Pb.unsqueeze(-1)
            box_l1 = (sl1(pbox, Bb) * mask).sum() / (mask.sum() * 4 + 1e-6)
            iou_l = ((1 - iou_xyxy(pbox, Bb)) * Pb).sum() / (Pb.sum() + 1e-6)
            (obj_loss + 5.0 * box_l1 + iou_l).backward(); opt.step(); opt.zero_grad()
        if ep % 15 == 0 or ep == args.epochs - 1:
            vh = evaluate(va)["hand_r30"]
            if vh > best: best = vh; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 30 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} val_hand_r30 {vh:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)
    test = evaluate(te)
    print("\n=== ZOOM-AUG TEST ===")
    for t in TARGET_IDS:
        print(f"  {t:30s} iou {test[t]['iou']:.3f}  r@.30 {test[t]['r30']:.3f}  r@.50 {test[t]['r50']:.3f}")
    print(f"  HAND rec@.30 {test['hand_r30']:.3f}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({"aug": "zoom+flip", "test": test}, indent=1))
    print(f"receipt -> {args.out}")


if __name__ == "__main__":
    main()
