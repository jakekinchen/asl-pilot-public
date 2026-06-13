#!/usr/bin/env python3
"""Re-render an existing auto-labeled dataset at a higher resolution.

Reuses the MediaPipe boxes already in rows.json (they're normalized, so
resolution-independent) and only re-decodes + resizes the source frames. Far
cheaper than re-running MediaPipe. Hands are small at 96px; 128/160 gives the
detector more hand pixels.

  .labelvenv/bin/python rerender.py --src .cache/autolabel-big --img-px 128 --out .cache/autolabel-big-128
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
GAME = ROOT / "data/external/popsign-v1/raw/popsign_v1_0/game"
SD = {"train": "train", "validation": "val", "test": "test"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=Path(__file__).resolve().parent / ".cache/autolabel-big")
    ap.add_argument("--img-px", type=int, default=128)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    src = args.src if args.src.is_absolute() else (Path(__file__).resolve().parent / args.src)
    out = args.out if args.out.is_absolute() else (Path(__file__).resolve().parent / args.out)
    out.mkdir(parents=True, exist_ok=True)

    meta = json.loads((src / "rows.json").read_text())
    rows = meta["rows"]
    by_clip = defaultdict(list)
    for i, r in enumerate(rows):
        by_clip[(r["split"], r["label_id"], r["clip_id"])].append((i, r["video_frame_index"]))

    images = [None] * len(rows)
    miss = 0
    for ci, ((split, label, clip_id), items) in enumerate(by_clip.items()):
        mp4 = GAME / SD[split] / label / f"{clip_id}.mp4"
        if not mp4.exists():
            miss += len(items); continue
        cap = cv2.VideoCapture(str(mp4))
        for row_i, fidx in items:
            cap.set(cv2.CAP_PROP_POS_FRAMES, fidx)
            ok, bgr = cap.read()
            if not ok or bgr is None:
                miss += 1; continue
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            images[row_i] = cv2.resize(rgb, (args.img_px, args.img_px), interpolation=cv2.INTER_AREA).astype(np.uint8)
        cap.release()
        if (ci + 1) % 200 == 0:
            print(f"  ...{ci+1}/{len(by_clip)} clips", flush=True)

    # keep only rows that re-rendered; rewrite aligned frames + rows
    keep = [i for i, im in enumerate(images) if im is not None]
    frames = np.stack([images[i] for i in keep]) if keep else np.zeros((0, args.img_px, args.img_px, 3), np.uint8)
    new_rows = [rows[i] for i in keep]
    np.save(out / "frames.npy", frames)
    meta_out = dict(meta); meta_out["rows"] = new_rows; meta_out["image_px"] = args.img_px
    meta_out["rerendered_from"] = str(src)
    (out / "rows.json").write_text(json.dumps(meta_out, indent=1))
    print(f"DONE: re-rendered {len(keep)} frames at {args.img_px}px ({miss} missing) -> {out}")


if __name__ == "__main__":
    main()
