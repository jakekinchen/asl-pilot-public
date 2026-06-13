#!/usr/bin/env python3
"""Auto-label PopSign frames with MediaPipe Holistic -> 4 region boxes.

Offline labeling only. Decodes full-resolution PopSign frames (good landmark
quality), runs MediaPipe Holistic, and converts per-region landmark clusters
into the 4 Detector 0 target boxes in normalized full-frame coords. Also emits
the 96x96 full-frame the detector trains on (same frame, resized) so boxes and
inputs are perfectly aligned. The MediaPipe model NEVER ships to runtime.

Two clip sources:
  default      : the 345-clip tier0 manifest (5 words, signer-disjoint splits)
  --scan-raw   : the full PopSign raw tree (95 words, native train/val/test) for
                 a large, position-diverse dataset.

Target assignment (viewer convention): hands assigned by image center-x
(<0.5 -> left_or_first, >=0.5 -> right_or_second); head/face = face hull;
upper_body/signing_space = visible pose (nose..hips) hull.

Run with the labeling venv:
  .labelvenv/bin/python autolabel.py --scan-raw --clips-per-word 8 --frames-per-clip 8 --out .cache/autolabel-big
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from mediapipe.python.solutions import holistic as mp_holistic

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data/external/popsign-v1/raw"
GAME = RAW / "popsign_v1_0/game"
MANIFESTS = {
    "train": ROOT / "data/manifests/return-to-form-tier0/train.json",
    "validation": ROOT / "data/manifests/return-to-form-tier0/validation.json",
    "test": ROOT / "data/manifests/return-to-form-tier0/test.json",
}
TARGET_IDS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"]
IMG = 96
POSE_UPPER = list(range(0, 25))


def pad_clip(b, frac):
    x1, y1, x2, y2 = b
    w, h = x2 - x1, y2 - y1
    x1 -= w * frac; x2 += w * frac; y1 -= h * frac; y2 += h * frac
    return [float(np.clip(x1, 0, 1)), float(np.clip(y1, 0, 1)),
            float(np.clip(x2, 0, 1)), float(np.clip(y2, 0, 1))]


def hull(landmarks, idxs=None, vis_min=None):
    xs, ys = [], []
    for i, p in enumerate(landmarks.landmark):
        if idxs is not None and i not in idxs:
            continue
        if vis_min is not None and getattr(p, "visibility", 1.0) < vis_min:
            continue
        xs.append(p.x); ys.append(p.y)
    if len(xs) < 2:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def derive_targets(res):
    out = {t: None for t in TARGET_IDS}
    hands = []
    for lms in (res.left_hand_landmarks, res.right_hand_landmarks):
        b = hull(lms) if lms else None
        if b:
            hands.append((((b[0] + b[2]) / 2), pad_clip(b, 0.12)))
    hands.sort(key=lambda h: h[0])
    if len(hands) == 1:
        cx, box = hands[0]
        out["left_or_first_hand" if cx < 0.5 else "right_or_second_hand"] = box
    elif len(hands) >= 2:
        out["left_or_first_hand"] = hands[0][1]
        out["right_or_second_hand"] = hands[-1][1]
    if res.face_landmarks:
        b = hull(res.face_landmarks)
        if b:
            out["head_or_face"] = pad_clip(b, 0.06)
    if res.pose_landmarks:
        b = hull(res.pose_landmarks, idxs=set(POSE_UPPER), vis_min=0.3)
        if b:
            out["upper_body_or_signing_space"] = pad_clip(b, 0.12)
    return out


def sample_frames(cap, k):
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if n <= 0:
        return []
    idxs = sorted(set(int(round(x)) for x in np.linspace(0, n - 1, min(k, n))))
    frames = []
    for fi in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ok, fr = cap.read()
        if ok and fr is not None:
            frames.append((fi, fr))
    return frames


def manifest_clips():
    entries = []
    for split, mpath in MANIFESTS.items():
        for clip in json.loads(mpath.read_text()).get("clips", []):
            entries.append({"clip_id": clip["clip_id"], "label_id": clip.get("label_id"),
                            "split": split, "source_record_id": clip.get("source_record_id"),
                            "signer_identity_hash": clip.get("signer_identity_hash")})
    return entries


def scan_raw_clips(clips_per_word):
    split_map = {"train": "train", "val": "validation", "test": "test"}
    entries = []
    for sd, split in split_map.items():
        sdir = GAME / sd
        if not sdir.is_dir():
            continue
        for word_dir in sorted(p for p in sdir.iterdir() if p.is_dir()):
            for m in sorted(word_dir.glob("*.mp4"))[:clips_per_word]:
                entries.append({"clip_id": m.stem, "label_id": word_dir.name, "split": split,
                                "source_record_id": str(m.relative_to(RAW)), "signer_identity_hash": None})
    return entries


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan-raw", action="store_true", help="scan full PopSign raw tree (95 words)")
    ap.add_argument("--clips-per-word", type=int, default=8)
    ap.add_argument("--frames-per-clip", type=int, default=10)
    ap.add_argument("--img-px", type=int, default=96, help="detector input resolution (bigger = more hand pixels)")
    ap.add_argument("--max-clips", type=int, default=0)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / ".cache/autolabel")
    args = ap.parse_args()
    out = args.out if args.out.is_absolute() else (Path(__file__).resolve().parent / args.out)
    out.mkdir(parents=True, exist_ok=True)

    entries = scan_raw_clips(args.clips_per_word) if args.scan_raw else manifest_clips()
    if args.max_clips:
        entries = entries[: args.max_clips]
    print(f"clips to process: {len(entries)} ({'raw-scan' if args.scan_raw else 'tier0-manifest'})")

    hol = mp_holistic.Holistic(static_image_mode=True, model_complexity=1, refine_face_landmarks=False)
    images, rows = [], []
    stats = {"clips": 0, "clips_missing": 0, "frames": 0, "no_pose": 0,
             "present": {t: 0 for t in TARGET_IDS}}

    for clip in entries:
        rec = clip.get("source_record_id")
        mp4 = RAW / rec if rec else None
        if not mp4 or not mp4.exists():
            stats["clips_missing"] += 1
            continue
        cap = cv2.VideoCapture(str(mp4))
        frames = sample_frames(cap, args.frames_per_clip)
        cap.release()
        if not frames:
            stats["clips_missing"] += 1
            continue
        stats["clips"] += 1
        for fi, bgr in frames:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            h0, w0 = rgb.shape[:2]
            scale = 1024.0 / max(h0, w0)
            mp_in = cv2.resize(rgb, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else rgb
            res = hol.process(mp_in)
            if res.pose_landmarks is None and res.face_landmarks is None:
                stats["no_pose"] += 1
                continue
            tgts = derive_targets(res)
            small = cv2.resize(rgb, (args.img_px, args.img_px), interpolation=cv2.INTER_AREA)
            images.append(small.astype(np.uint8))
            targets = {}
            for t in TARGET_IDS:
                b = tgts[t]
                if b:
                    stats["present"][t] += 1
                    targets[t] = {"presence": True, "box_xyxy_norm": [round(v, 4) for v in b]}
                else:
                    targets[t] = {"presence": False, "box_xyxy_norm": None}
            rows.append({"split": clip["split"], "clip_id": clip["clip_id"], "label_id": clip.get("label_id"),
                         "signer_identity_hash": clip.get("signer_identity_hash"),
                         "video_frame_index": fi, "targets": targets})
            stats["frames"] += 1
        if stats["clips"] % 50 == 0:
            print(f"  ...{stats['clips']} clips, {stats['frames']} frames", flush=True)
    hol.close()

    np.save(out / "frames.npy", np.stack(images) if images else np.zeros((0, args.img_px, args.img_px, 3), np.uint8))
    (out / "rows.json").write_text(json.dumps({
        "schema_version": "asl-pilot-detector0-autolabel/v1",
        "coordinate_space": "normalized_full_frame_xyxy_top_left_origin",
        "label_source": "mediapipe_holistic_0_10_14_offline",
        "target_ids": TARGET_IDS, "image_px": args.img_px, "stats": stats, "rows": rows,
    }, indent=1))
    print(f"\nDONE: {stats['frames']} frames from {stats['clips']} clips "
          f"({stats['clips_missing']} missing), no-detect {stats['no_pose']}")
    print("per-target present:", stats["present"])
    print(f"-> {out}/frames.npy, {out}/rows.json")


if __name__ == "__main__":
    main()
