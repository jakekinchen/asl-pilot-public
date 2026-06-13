#!/usr/bin/env python3
"""Score the trained detector against the HUMAN-VERIFIED hand eval set.

Loads .cache-eval/frames96.npy (model input, aligned to index) + the human
packet (corrected boxes) + the trained grid detector, and reports TRUE
recall@IoU0.30/0.50, mean IoU, and false-trigger rate vs human ground truth.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python eval_vs_human.py \
      --eval .cache-eval --packet output/eval-human-v1.json --weights output/detector0-grid-final.pt
"""
from __future__ import annotations

import argparse, json
from pathlib import Path
import numpy as np, torch
from train_detector import make_xy, iou_xyxy, TARGET_IDS
from train_detector_grid import GridDetector, gather_cell

HERE = Path(__file__).resolve().parent
HANDS = ["left_or_first_hand", "right_or_second_hand"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval", type=Path, default=HERE / ".cache-eval")
    ap.add_argument("--packet", type=Path, default=HERE / "output/eval-human-v1.json")
    ap.add_argument("--weights", type=Path, default=HERE / "output/detector0-grid-final.pt")
    args = ap.parse_args()
    ev = args.eval if args.eval.is_absolute() else (HERE / args.eval)
    pk = args.packet if args.packet.is_absolute() else (HERE / args.packet)

    idx = json.loads((ev / "index.json").read_text())["items"]
    frames = np.load(ev / "frames96.npy")
    human = {}
    if pk.exists():
        for r in json.loads(pk.read_text()).get("frame_rows", []):
            rid = r.get("row_id", "")
            human[rid[len("det0-h1-"):] if rid.startswith("det0-h1-") else rid] = r["targets"]
    print(f"eval frames {len(idx)} | human-verified {len(human)}")
    if not human:
        print("No human packet yet — annotate first."); return

    ck = torch.load(args.weights, map_location="cpu", weights_only=False)
    dev = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
    model = GridDetector(n_targets=4, grid=ck["grid"]).to(dev); model.load_state_dict(ck["state_dict"]); model.eval()
    X = make_xy(frames, dev)
    with torch.no_grad():
        obj, box = model(X)
        pred = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))  # N,4,4
        present = torch.sigmoid(obj.reshape(obj.size(0), 4, -1).max(-1).values) > 0.5  # N,4

    res = {}
    for ti, t in enumerate(HANDS):
        ious, n_present, fp, n_absent = [], 0, 0, 0
        for i, it in enumerate(idx):
            h = human.get(it["item_id"])
            if h is None:
                continue
            hp = h[t]["presence"] and h[t]["box_xyxy_norm"]
            if hp:
                n_present += 1
                gt = torch.tensor(h[t]["box_xyxy_norm"], dtype=torch.float32, device=dev)
                if bool(present[i, ti]):
                    ious.append(iou_xyxy(pred[i, ti].unsqueeze(0), gt.unsqueeze(0))[0].item())
                else:
                    ious.append(0.0)  # missed detection -> IoU 0 (counts against recall)
            else:
                n_absent += 1
                if bool(present[i, ti]):
                    fp += 1
        ious = np.array(ious) if ious else np.array([0.0])
        res[t] = {"n_present": n_present, "mean_iou": round(float(ious.mean()), 4),
                  "recall@.30": round(float((ious > .3).mean()), 4), "recall@.50": round(float((ious > .5).mean()), 4),
                  "n_absent": n_absent, "false_trigger_rate": round(fp / max(n_absent, 1), 4)}
    print("\n=== TRUE hand accuracy vs HUMAN ground truth ===")
    for t in HANDS:
        r = res[t]
        print(f"  {t:24s} n={r['n_present']:3d}  meanIoU={r['mean_iou']:.3f}  rec@.30={r['recall@.30']:.3f}  "
              f"rec@.50={r['recall@.50']:.3f}  | false-trigger={r['false_trigger_rate']:.3f} (n_absent={r['n_absent']})")
    (HERE / "output/eval-vs-human-result.json").write_text(json.dumps(res, indent=1))
    print("\n-> output/eval-vs-human-result.json")


if __name__ == "__main__":
    main()
