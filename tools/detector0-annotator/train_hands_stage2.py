#!/usr/bin/env python3
"""Stage-2 hand detector: trained on high-res signing-space CROPS (from
crop_relabel.py) where hands are 3-5x larger -> far better localization.

Evaluates END-TO-END in full-frame coords: map the predicted crop-box back to
the full frame via the crop box, then recall@IoU vs (a) the ORIGINAL full-frame
Holistic hand boxes (apples-to-apples with the single-stage 0.88/0.78) and (b)
the better crop labels. From scratch; MediaPipe was an offline labeler only.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_hands_stage2.py \
      --data .cache/handcrop --epochs 160 --device mps
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from train_detector import make_xy, iou_xyxy
from train_detector_grid import GridDetector, gather_cell, build_grid_targets

HERE = Path(__file__).resolve().parent
HANDS = ["left_or_first_hand", "right_or_second_hand"]


def load(data_dir: Path):
    frames = np.load(data_dir / "frames.npy")
    rows = json.loads((data_dir / "rows.json").read_text())["rows"]
    N = len(rows)
    pres = np.zeros((N, 2), np.float32); boxes = np.zeros((N, 2, 4), np.float32)
    cropb = np.zeros((N, 4), np.float32)
    opres = np.zeros((N, 2), np.float32); oboxes = np.zeros((N, 2, 4), np.float32)
    splits = []
    for i, r in enumerate(rows):
        splits.append(r["split"]); cropb[i] = r["crop_box_xyxy"]
        for ti, t in enumerate(HANDS):
            hc = r["hands_crop"][t]
            if hc: pres[i, ti] = 1.0; boxes[i, ti] = hc
            of = r["orig_full"][t]
            if of: opres[i, ti] = 1.0; oboxes[i, ti] = of
    return frames, pres, boxes, cropb, opres, oboxes, np.array(splits)


def augment2(Xb, Pb, Bb):
    """flip+swap for 2 hand targets + brightness."""
    b = Xb.size(0); Xb = Xb.clone(); Pb = Pb.clone(); Bb = Bb.clone()
    f = torch.rand(b, 1, 1, 1, device=Xb.device) * 0.6 + 0.7
    Xb[:, 0:3] = (Xb[:, 0:3] * f).clamp(0, 1)
    flip = torch.rand(b, device=Xb.device) < 0.5; idx = flip.nonzero(as_tuple=True)[0]
    if idx.numel():
        Xb[idx] = torch.flip(Xb[idx], dims=[-1])
        x1 = Bb[idx, :, 0].clone(); x2 = Bb[idx, :, 2].clone()
        Bb[idx, :, 0] = 1 - x2; Bb[idx, :, 2] = 1 - x1
        Pb[idx] = Pb[idx][:, [1, 0]]; Bb[idx] = Bb[idx][:, [1, 0]]
    return Xb, Pb, Bb


def map_to_full(box_crop, cropb):
    """box in crop-norm (...,4) + crop_box (...,4) -> full-frame norm box."""
    cw = (cropb[..., 2] - cropb[..., 0]).unsqueeze(-1)
    ch = (cropb[..., 3] - cropb[..., 1]).unsqueeze(-1)
    o = torch.stack([cropb[..., 0], cropb[..., 1], cropb[..., 0], cropb[..., 1]], dim=-1)
    s = torch.cat([cw, ch, cw, ch], dim=-1)
    return o.unsqueeze(1) + box_crop * s.unsqueeze(1)  # (N,1,4) broadcasts over targets


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/handcrop")
    ap.add_argument("--epochs", type=int, default=160)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", type=Path, default=HERE / "output/detector0-hands-stage2.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed)
    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")

    frames, pres, boxes, cropb, opres, oboxes, splits = load(args.data)
    X = make_xy(frames, dev)
    P = torch.from_numpy(pres).to(dev); B = torch.from_numpy(boxes).to(dev)
    CB = torch.from_numpy(cropb).to(dev); OP = torch.from_numpy(opres).to(dev); OB = torch.from_numpy(oboxes).to(dev)
    tr = np.where(splits == "train")[0]; te = splits == "test"
    grid = X.shape[-1] // 8; ncell = grid * grid
    print(f"data {len(frames)} | train {len(tr)} test {te.sum()} | grid {grid} | crop-present L={int(pres[:,0].sum())} R={int(pres[:,1].sum())}")

    model = GridDetector(n_targets=2, grid=grid).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sl1 = nn.SmoothL1Loss(reduction="none")

    def evaluate(mask):
        model.eval(); ii = torch.as_tensor(np.where(mask)[0], device=dev)
        with torch.no_grad():
            obj, box = model(X[ii])
            pred_crop = gather_cell(box, obj.reshape(obj.size(0), 2, -1).argmax(-1))  # N,2,4 crop coords
            pred_full = map_to_full(pred_crop, CB[ii]).clamp(0, 1)
            r = {"per_target": {}}
            for ti, t in enumerate(HANDS):
                # in-crop (vs crop labels)
                mc = P[ii][:, ti] == 1
                ic = iou_xyxy(pred_crop[mc, ti], B[ii][mc, ti]).mean().item() if mc.sum() else 0.0
                # end-to-end full-frame vs ORIGINAL Holistic GT (comparable to single-stage)
                mo = OP[ii][:, ti] == 1
                if mo.sum():
                    iouf = iou_xyxy(pred_full[mo, ti], OB[ii][mo, ti])
                    r["per_target"][t] = {"n_orig": int(mo.sum()), "crop_iou": round(ic, 4),
                                          "fullframe_iou_vs_orig": round(iouf.mean().item(), 4),
                                          "recall@.30": round((iouf > 0.30).float().mean().item(), 4),
                                          "recall@.50": round((iouf > 0.50).float().mean().item(), 4)}
                else:
                    r["per_target"][t] = {"n_orig": 0}
        return r

    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = torch.as_tensor(order[k:k + args.batch], device=dev)
            Xb, Pb, Bb = augment2(X[bi], P[bi], B[bi])
            obj, box = model(Xb)
            obj_t, pos_idx = build_grid_targets(Pb, Bb, grid, dev)
            w = 1.0 + obj_t * (ncell - 1)
            obj_loss = (nn.functional.binary_cross_entropy_with_logits(obj, obj_t, reduction="none") * w).mean()
            pbox = gather_cell(box, pos_idx); mask = Pb.unsqueeze(-1)
            box_l1 = (sl1(pbox, Bb) * mask).sum() / (mask.sum() * 4 + 1e-6)
            iou_l = ((1 - iou_xyxy(pbox, Bb)) * Pb).sum() / (Pb.sum() + 1e-6)
            loss = obj_loss + 5.0 * box_l1 + iou_l
            opt.zero_grad(); loss.backward(); opt.step()
        if ep % 10 == 0 or ep == args.epochs - 1:
            v = evaluate(splits == "validation")
            vh = np.mean([v["per_target"][t].get("recall@.30", 0) for t in HANDS])
            if vh > best:
                best = vh; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            if ep % 30 == 0 or ep == args.epochs - 1:
                print(f"ep {ep:3d} loss {loss.item():.3f} val_rec@.30 {vh:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)

    test = evaluate(te)
    print("\n=== STAGE-2 TEST (end-to-end full-frame vs original GT) ===")
    for t in HANDS:
        pt = test["per_target"][t]
        print(f"  {t:24s} n={pt['n_orig']:5d}  crop_iou={pt.get('crop_iou',0):.3f}  "
              f"full_iou={pt.get('fullframe_iou_vs_orig',0):.3f}  rec@.30={pt.get('recall@.30',0):.3f}  rec@.50={pt.get('recall@.50',0):.3f}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    weights = args.out.with_suffix(".pt")
    torch.save({"state_dict": model.state_dict(), "grid": grid, "targets": HANDS, "stage": 2}, weights)
    args.out.write_text(json.dumps({"schema_version": "asl-pilot-detector0-hands-stage2/v1",
                                    "epochs": args.epochs, "device": str(dev), "test": test, "weights": str(weights)}, indent=1))
    print(f"\nweights -> {weights}\nreceipt -> {args.out}")


if __name__ == "__main__":
    main()
