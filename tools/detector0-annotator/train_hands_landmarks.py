#!/usr/bin/env python3
"""Stage-2 scratch HAND LANDMARK model: predicts 21 hand keypoints per hand in
the zoomed signing-space crop (presence + 21 (x,y)). This is the recognizer-
facing target (finger positioning / handshape) and the box falls out as the
bbox of the landmarks. From scratch; MediaPipe labels are offline only.

Consumes .cache/handcrop-lm (crop_relabel.py with landmarks). Metrics: PCK@0.1
(fraction of keypoints within 0.1 crop-width of GT) + derived-box IoU.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_hands_landmarks.py \
      --data .cache/handcrop-lm --epochs 160 --device mps
"""
from __future__ import annotations

import argparse, json
from pathlib import Path
import numpy as np, torch, torch.nn as nn

from train_detector import make_xy, iou_xyxy

HERE = Path(__file__).resolve().parent
HANDS = ["left_or_first_hand", "right_or_second_hand"]
K = 21  # MediaPipe hand landmarks


def load(data_dir: Path):
    frames = np.load(data_dir / "frames.npy")
    rows = json.loads((data_dir / "rows.json").read_text())["rows"]
    N = len(rows)
    pres = np.zeros((N, 2), np.float32)
    lms = np.zeros((N, 2, K, 2), np.float32)
    splits = []
    for i, r in enumerate(rows):
        splits.append(r["split"])
        for ti, t in enumerate(HANDS):
            d = r["hands_crop"][t]
            if d and d.get("landmarks_xy"):
                pres[i, ti] = 1.0
                lms[i, ti] = np.array(d["landmarks_xy"], np.float32)
    return frames, pres, lms, np.array(splits)


class LandmarkNet(nn.Module):
    def __init__(self, n_targets=2, k=K):
        super().__init__()
        self.nt, self.k = n_targets, k
        def blk(i, o): return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        self.body = nn.Sequential(blk(5, 32), blk(32, 64), blk(64, 128), blk(128, 256), nn.AdaptiveAvgPool2d(1))
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(256, 256), nn.ReLU(inplace=True),
                                  nn.Linear(256, n_targets * (1 + 2 * k)))

    def forward(self, x):
        o = self.head(self.body(x)).view(-1, self.nt, 1 + 2 * self.k)
        pres = o[..., 0]
        lm = torch.sigmoid(o[..., 1:]).view(-1, self.nt, self.k, 2)
        return pres, lm


def augment(Xb, Pb, Lb):
    b = Xb.size(0); Xb = Xb.clone(); Pb = Pb.clone(); Lb = Lb.clone()
    f = torch.rand(b, 1, 1, 1, device=Xb.device) * 0.6 + 0.7
    Xb[:, 0:3] = (Xb[:, 0:3] * f).clamp(0, 1)
    fl = torch.rand(b, device=Xb.device) < 0.5; idx = fl.nonzero(as_tuple=True)[0]
    if idx.numel():
        Xb[idx] = torch.flip(Xb[idx], dims=[-1])
        Lb[idx, :, :, 0] = 1 - Lb[idx, :, :, 0]          # mirror x
        Pb[idx] = Pb[idx][:, [1, 0]]; Lb[idx] = Lb[idx][:, [1, 0]]
    return Xb, Pb, Lb


def lm_to_box(lm):  # (...,K,2) -> (...,4) xyxy
    return torch.cat([lm.min(-2).values, lm.max(-2).values], dim=-1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/handcrop-lm")
    ap.add_argument("--epochs", type=int, default=160)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--pck", type=float, default=0.1)
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-hand-landmarks.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    frames, pres, lms, splits = load(args.data)
    X = make_xy(frames, dev); P = torch.from_numpy(pres).to(dev); L = torch.from_numpy(lms).to(dev)
    tr = np.where(splits == "train")[0]; te = splits == "test"; va = splits == "validation"
    print(f"data {len(frames)} | train {len(tr)} test {te.sum()} | present L={int(pres[:,0].sum())} R={int(pres[:,1].sum())}")

    model = LandmarkNet().to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    bce = nn.BCEWithLogitsLoss(); sl1 = nn.SmoothL1Loss(reduction="none")

    def evaluate(mask):
        model.eval(); ii = torch.as_tensor(np.where(mask)[0], device=dev)
        with torch.no_grad():
            pl, lm = model(X[ii]); Pi = P[ii]; Li = L[ii]
            out = {}
            for ti, t in enumerate(HANDS):
                m = Pi[:, ti] == 1; n = int(m.sum())
                if n:
                    d = torch.linalg.norm(lm[m, ti] - Li[m, ti], dim=-1)  # (n,K) per-kp dist
                    pck = (d < args.pck).float().mean().item()
                    mpe = d.mean().item()
                    biou = iou_xyxy(lm_to_box(lm[m, ti]), lm_to_box(Li[m, ti])).mean().item()
                else:
                    pck = mpe = biou = 0.0
                out[t] = {"n": n, "PCK@%.2f" % args.pck: round(pck, 4), "mean_kp_err": round(mpe, 4),
                          "derived_box_iou": round(biou, 4)}
            out["hand_pck"] = round(np.mean([out[h]["PCK@%.2f" % args.pck] for h in HANDS]), 4)
        return out

    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            Xb, Pb, Lb = augment(X[bi], P[bi], L[bi])
            pl, lm = model(Xb)
            ploss = bce(pl, Pb)
            mask = Pb.unsqueeze(-1).unsqueeze(-1)
            lloss = (sl1(lm, Lb) * mask).sum() / (mask.sum() * 2 + 1e-6)
            (ploss + 10.0 * lloss).backward(); opt.step(); opt.zero_grad()
        if ep % 10 == 0 or ep == args.epochs - 1:
            vh = evaluate(va)["hand_pck"]
            if vh > best: best = vh; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 30 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} val_hand_PCK {vh:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)
    test = evaluate(te)
    print("\n=== HAND LANDMARK TEST ===")
    for t in HANDS:
        r = test[t]
        print(f"  {t:24s} n={r['n']:4d}  PCK@{args.pck}={r['PCK@%.2f'%args.pck]:.3f}  "
              f"mean_kp_err={r['mean_kp_err']:.3f}  derived_box_iou={r['derived_box_iou']:.3f}")
    print(f"  HAND PCK {test['hand_pck']:.3f}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save({"state_dict": model.state_dict(), "k": K, "targets": HANDS, "stage": 2, "kind": "landmarks"}, weights)
    args.out.write_text(json.dumps({"schema_version": "asl-pilot-detector0-hand-landmarks/v1",
                                    "epochs": args.epochs, "device": str(dev), "test": test, "weights": str(weights)}, indent=1))
    print(f"\nweights -> {weights}\nreceipt -> {args.out}")


if __name__ == "__main__":
    main()
