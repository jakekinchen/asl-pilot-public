#!/usr/bin/env python3
"""Coarse-to-fine hand relabeling: crop the signing-space region at full res,
zoom in, and run MediaPipe HANDS on the crop where hands are 3-5x larger ->
cleaner + more hand boxes than the full-frame Holistic pass.

Reads an existing autolabel dataset (for the per-frame signing-space box + the
original full-frame hand boxes), re-decodes the source frame, crops+upscales,
re-detects hands, and writes a STAGE-2 dataset: crop images + hand boxes in crop
coords + the crop box (to map predictions back to full frame) + the original
full-frame hand boxes (for a comparable eval).

  .labelvenv/bin/python crop_relabel.py --src .cache/autolabel-big --out .cache/handcrop --crop-px 128
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np
from mediapipe.python.solutions import hands as mp_hands

ROOT = Path(__file__).resolve().parents[2]
GAME = ROOT / "data/external/popsign-v1/raw/popsign_v1_0/game"
SD = {"train": "train", "validation": "val", "test": "test"}


def expand_crop(box):
    """upper_body [x1,y1,x2,y2] -> generous crop (extra room up top for raised hands)."""
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    x1 -= 0.25 * w; x2 += 0.25 * w
    y1 -= 0.35 * h; y2 += 0.12 * h
    x1, y1 = max(0.0, x1), max(0.0, y1); x2, y2 = min(1.0, x2), min(1.0, y2)
    if x2 - x1 < 0.2:  # keep a sane minimum
        cx = (x1 + x2) / 2; x1, x2 = max(0, cx - 0.25), min(1, cx + 0.25)
    return [x1, y1, x2, y2]


def hand_box(lms, pad=0.12):
    xs = [p.x for p in lms.landmark]; ys = [p.y for p in lms.landmark]
    x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
    w, h = x2 - x1, y2 - y1
    return [float(np.clip(x1 - pad * w, 0, 1)), float(np.clip(y1 - pad * h, 0, 1)),
            float(np.clip(x2 + pad * w, 0, 1)), float(np.clip(y2 + pad * h, 0, 1))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=Path(__file__).resolve().parent / ".cache/autolabel-big")
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--crop-px", type=int, default=128)
    ap.add_argument("--mp-px", type=int, default=320, help="upscaled crop size fed to MediaPipe Hands")
    args = ap.parse_args()
    src = args.src if args.src.is_absolute() else (Path(__file__).resolve().parent / args.src)
    out = args.out if args.out.is_absolute() else (Path(__file__).resolve().parent / args.out)
    out.mkdir(parents=True, exist_ok=True)

    rows_in = json.loads((src / "rows.json").read_text())["rows"]
    by_clip = defaultdict(list)
    for r in rows_in:
        by_clip[(r["split"], r["label_id"], r["clip_id"])].append(r)

    hnd = mp_hands.Hands(static_image_mode=True, max_num_hands=2,
                         min_detection_confidence=0.3, min_tracking_confidence=0.3)
    images, rows = [], []
    stats = {"frames": 0, "missing": 0, "present_left": 0, "present_right": 0, "recovered": 0}

    for ci, ((split, label, clip_id), rs) in enumerate(by_clip.items()):
        mp4 = GAME / SD[split] / label / f"{clip_id}.mp4"
        if not mp4.exists():
            stats["missing"] += len(rs); continue
        cap = cv2.VideoCapture(str(mp4))
        for r in rs:
            ub = r["targets"]["upper_body_or_signing_space"]["box_xyxy_norm"]
            if not ub:
                stats["missing"] += 1; continue
            cap.set(cv2.CAP_PROP_POS_FRAMES, r["video_frame_index"])
            ok, bgr = cap.read()
            if not ok or bgr is None:
                stats["missing"] += 1; continue
            H, W = bgr.shape[:2]
            cb = expand_crop(ub)
            cx1, cy1, cx2, cy2 = int(cb[0] * W), int(cb[1] * H), int(cb[2] * W), int(cb[3] * H)
            if cx2 - cx1 < 8 or cy2 - cy1 < 8:
                stats["missing"] += 1; continue
            crop = cv2.cvtColor(bgr[cy1:cy2, cx1:cx2], cv2.COLOR_BGR2RGB)
            up = cv2.resize(crop, (args.mp_px, args.mp_px), interpolation=cv2.INTER_LINEAR)
            res = hnd.process(up)
            def lmxy(lms):
                return [[round(p.x, 4), round(p.y, 4)] for p in lms.landmark]  # 21 (x,y) crop-norm
            hands = []
            if res.multi_hand_landmarks:
                for lms in res.multi_hand_landmarks:
                    b = hand_box(lms)
                    hands.append((((b[0] + b[2]) / 2), {"box_xyxy_norm": b, "landmarks_xy": lmxy(lms)}))
            hands.sort(key=lambda h: h[0])
            tgt = {"left_or_first_hand": None, "right_or_second_hand": None}
            if len(hands) == 1:
                cxh, d = hands[0]
                tgt["left_or_first_hand" if cxh < 0.5 else "right_or_second_hand"] = d
            elif len(hands) >= 2:
                tgt["left_or_first_hand"] = hands[0][1]; tgt["right_or_second_hand"] = hands[-1][1]
            if tgt["left_or_first_hand"]: stats["present_left"] += 1
            if tgt["right_or_second_hand"]: stats["present_right"] += 1
            # did we recover a hand the full-frame pass missed?
            orig = {k: r["targets"][k]["box_xyxy_norm"] for k in ("left_or_first_hand", "right_or_second_hand")}
            for k in tgt:
                if tgt[k] and not orig[k]:
                    stats["recovered"] += 1
            images.append(cv2.resize(crop, (args.crop_px, args.crop_px), interpolation=cv2.INTER_AREA).astype(np.uint8))
            rows.append({"split": split, "clip_id": clip_id, "label_id": label,
                         "video_frame_index": r["video_frame_index"], "crop_box_xyxy": [round(v, 4) for v in cb],
                         "hands_crop": {k: tgt[k] for k in tgt},  # {box_xyxy_norm, landmarks_xy} or None
                         "orig_full": {k: orig[k] for k in orig}})
            stats["frames"] += 1
        cap.release()
        if (ci + 1) % 200 == 0:
            print(f"  ...{ci+1}/{len(by_clip)} clips, {stats['frames']} frames", flush=True)
    hnd.close()

    np.save(out / "frames.npy", np.stack(images) if images else np.zeros((0, args.crop_px, args.crop_px, 3), np.uint8))
    (out / "rows.json").write_text(json.dumps({
        "schema_version": "asl-pilot-detector0-handcrop/v1",
        "label_source": "mediapipe_hands_on_signing_space_crop_0_10_14_offline",
        "crop_px": args.crop_px, "mp_px": args.mp_px, "stats": stats, "rows": rows,
    }, indent=1))
    print(f"\nDONE: {stats['frames']} crops ({stats['missing']} missing) | "
          f"L={stats['present_left']} R={stats['present_right']} recovered={stats['recovered']}")
    print(f"-> {out}")


if __name__ == "__main__":
    main()
