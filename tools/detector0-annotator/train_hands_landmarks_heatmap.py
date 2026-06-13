#!/usr/bin/env python3
"""Heatmap-head scratch hand-landmark model (the proper pose-estimation
approach). Predicts a Gaussian heatmap per keypoint (2 hands x 21) + soft-argmax
to coords -- far more accurate for keypoint localization than global coordinate
regression. From scratch; MediaPipe labels offline only.

Consumes .cache/handcrop-lm. Eval: PCK@0.1, mean kp err, derived-box IoU.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_hands_landmarks_heatmap.py \
      --data .cache/handcrop-lm --epochs 160 --device mps
"""
from __future__ import annotations

import argparse, json, math
from pathlib import Path
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F

from train_detector import make_xy, iou_xyxy
from train_hands_landmarks import load, HANDS, K, augment

HERE = Path(__file__).resolve().parent
G = 32  # heatmap grid


class HeatmapNet(nn.Module):
    def __init__(self, n_targets=2, k=K, g=G, width=32):
        super().__init__()
        self.nt, self.k, self.g, self.width = n_targets, k, g, width
        w = width
        def blk(i, o): return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        self.enc = nn.Sequential(blk(5, w), blk(w, 2 * w), blk(2 * w, 4 * w))   # 128->16, 4w ch
        self.enc2 = nn.Sequential(nn.Conv2d(4 * w, 4 * w, 3, 1, 1), nn.BatchNorm2d(4 * w), nn.ReLU(inplace=True))
        # upsample enc output (16x16) -> g x g via staged x2 (g=32:1 stage, g=64:2 stages)
        n_up = max(1, int(round(math.log2(g / 16))))
        ups, inc = [], 4 * w
        for i in range(n_up):
            outc = 2 * w if i == n_up - 1 else 4 * w
            ups += [nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False),
                    nn.Conv2d(inc, outc, 3, 1, 1), nn.BatchNorm2d(outc), nn.ReLU(inplace=True)]
            inc = outc
        self.up = nn.Sequential(*ups)
        self.hm = nn.Conv2d(2 * w, n_targets * k, 1)                       # nt*k heatmaps @ g x g
        self.pres = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(),
                                  nn.Linear(4 * w, 2 * w), nn.ReLU(inplace=True), nn.Linear(2 * w, n_targets))

    def forward(self, x):
        f = self.enc2(self.enc(x))           # B,128,16,16
        hm = self.hm(self.up(f))             # B, nt*k, 32, 32
        return self.pres(f), hm


def gaussian_targets(kp, g, sigma):
    # kp (B,T,K,2) in [0,1] -> (B, T*K, g, g)
    B, T, k, _ = kp.shape
    grid = torch.arange(g, device=kp.device).float()
    gy = grid.view(1, 1, g, 1); gx = grid.view(1, 1, 1, g)
    cx = (kp[..., 0] * g).reshape(B, T * k, 1, 1)
    cy = (kp[..., 1] * g).reshape(B, T * k, 1, 1)
    d2 = (gx - cx) ** 2 + (gy - cy) ** 2
    return torch.exp(-d2 / (2 * sigma * sigma))


def soft_argmax(hm, g, nt, k):
    # hm (B, nt*k, g, g) -> coords (B, nt, k, 2) in [0,1]
    B, C, _, _ = hm.shape
    p = torch.softmax(hm.reshape(B, C, -1), dim=-1).reshape(B, C, g, g)
    idx = torch.arange(g, device=hm.device).float()
    ex = (p.sum(dim=2) * idx).sum(-1) / g     # marginal over rows -> x
    ey = (p.sum(dim=3) * idx).sum(-1) / g
    return torch.stack([ex, ey], dim=-1).reshape(B, nt, k, 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/handcrop-lm")
    ap.add_argument("--epochs", type=int, default=160)
    ap.add_argument("--batch", type=int, default=96)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--sigma", type=float, default=1.5)
    ap.add_argument("--pck", type=float, default=0.1)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--oversample-right", type=int, default=1, help="repeat right-hand-present frames Nx")
    ap.add_argument("--width", type=int, default=32, help="channel width (32=baseline; bigger=more capacity)")
    ap.add_argument("--heatmap-g", type=int, default=G, help="heatmap resolution (32=baseline; 64=finer localization)")
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-hand-landmarks-heatmap.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    g = args.heatmap_g
    frames, pres, lms, splits = load(args.data)
    P = torch.from_numpy(pres).to(dev); L = torch.from_numpy(lms).to(dev)
    # keep frames on CPU (uint8); move each batch to MPS on demand. Holding all ~66k
    # crops as one float tensor on MPS exhausts memory at g=64 (4x heatmap activations).
    tr = np.where(splits == "train")[0]; te = splits == "test"; va = splits == "validation"
    nt = len(HANDS)
    print(f"data {len(frames)} | train {len(tr)} test {te.sum()} | heatmap {g}x{g} | present L={int(pres[:,0].sum())} R={int(pres[:,1].sum())}")

    model = HeatmapNet(g=g, width=args.width).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    bce = nn.BCEWithLogitsLoss()

    def evaluate(mask):
        model.eval(); idx = np.where(mask)[0]
        with torch.no_grad():
            chunks = [soft_argmax(model(make_xy(frames[idx[c:c+256]], dev))[1], g, nt, K) for c in range(0, len(idx), 256)]
            coord = torch.cat(chunks, 0)
            ii = torch.as_tensor(idx, device=dev)
            Pi = P[ii]; Li = L[ii]; out = {}
            for ti, t in enumerate(HANDS):
                m = Pi[:, ti] == 1; n = int(m.sum())
                if n:
                    d = torch.linalg.norm(coord[m, ti] - Li[m, ti], dim=-1)
                    pck = (d < args.pck).float().mean().item(); mpe = d.mean().item()
                    biou = iou_xyxy(torch.cat([coord[m, ti].min(1).values, coord[m, ti].max(1).values], -1),
                                    torch.cat([Li[m, ti].min(1).values, Li[m, ti].max(1).values], -1)).mean().item()
                else:
                    pck = mpe = biou = 0.0
                out[t] = {"n": n, "PCK": round(pck, 4), "mean_kp_err": round(mpe, 4), "derived_box_iou": round(biou, 4)}
            out["hand_pck"] = round(np.mean([out[h]["PCK"] for h in HANDS]), 4)
        return out

    rp = tr[pres[tr, 1] == 1]  # right-hand-present train indices (the starved class)
    if args.oversample_right > 1:
        print(f"oversampling {len(rp)} right-present frames {args.oversample_right}x")
    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train()
        order = tr.copy()
        if args.oversample_right > 1 and len(rp):
            order = np.concatenate([order, np.repeat(rp, args.oversample_right - 1)])
        np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            ob = order[k:k + args.batch]
            bi = torch.as_tensor(ob, device=dev)
            Xb, Pb, Lb = augment(make_xy(frames[ob], dev), P[bi], L[bi])
            pl, hm = model(Xb)
            # Integral/soft-argmax regression: supervise the soft-argmax COORDS
            # directly (avoids the Gaussian-MSE trivial-zero collapse). A light
            # peak-concentration aux keeps heatmaps unimodal.
            coords = soft_argmax(hm, g, nt, K)                   # B, nt, K, 2
            cmask = Pb.unsqueeze(-1).unsqueeze(-1)               # B, nt, 1, 1
            closs = (F.smooth_l1_loss(coords, Lb, reduction="none") * cmask).sum() / (cmask.sum() * 2 + 1e-6)
            p = torch.softmax(hm.reshape(hm.size(0), nt * K, -1), dim=-1)
            peak_aux = (1.0 - p.max(dim=-1).values).mean()       # encourage a sharp peak
            loss = bce(pl, Pb) + 10.0 * closs + 0.1 * peak_aux
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 10 == 0 or ep == args.epochs - 1:
            vh = evaluate(va)["hand_pck"]
            if vh > best: best = vh; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 30 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} loss {loss.item():.3f} val_hand_PCK {vh:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)
    test = evaluate(te)
    print("\n=== HEATMAP HAND LANDMARK TEST ===")
    for t in HANDS:
        r = test[t]
        print(f"  {t:24s} n={r['n']:4d}  PCK@{args.pck}={r['PCK']:.3f}  mean_kp_err={r['mean_kp_err']:.3f}  derived_box_iou={r['derived_box_iou']:.3f}")
    print(f"  HAND PCK {test['hand_pck']:.3f}  (global-regression baseline was 0.299)")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save({"state_dict": model.state_dict(), "k": K, "g": g, "width": args.width, "targets": HANDS, "head": "heatmap"}, weights)
    args.out.write_text(json.dumps({"schema_version": "asl-pilot-detector0-hand-landmarks-heatmap/v1",
                                    "epochs": args.epochs, "device": str(dev), "test": test, "weights": str(weights)}, indent=1))
    print(f"\nweights -> {weights}\nreceipt -> {args.out}")


if __name__ == "__main__":
    main()
