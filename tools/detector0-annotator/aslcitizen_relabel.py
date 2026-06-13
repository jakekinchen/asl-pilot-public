#!/usr/bin/env python3
"""MediaPipe-relabel ASL Citizen clips into handcrop-lm format (clean landmark
targets) to augment the LANDMARK MODEL's training set.

Per frame: MediaPipe Holistic -> signing-space box -> crop -> MediaPipe Hands ->
21 crop-space landmarks per hand. Same schema as crop_relabel's output so it
merges with .cache/handcrop-lm2. Runs in .labelvenv (mediapipe). Offline only.

  .labelvenv/bin/python aslcitizen_relabel.py --nshards 6 --shard 0 \
      --manifest <ac>/asl_citizen_manifest.json --video-root <ac>/ASL_Citizen/videos \
      --out .cache/handcrop-ac-sh0
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import cv2, numpy as np
from mediapipe.python.solutions import holistic as mp_holistic, hands as mp_hands
from autolabel import derive_targets
from crop_relabel import expand_crop, hand_box

HERE = Path(__file__).resolve().parent


def seq_frames(cap, k):
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if n <= 0:
        return []
    keep = set(int(round(x)) for x in np.linspace(0, n - 1, min(k, n)))
    out, fi = [], 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if fi in keep:
            out.append((fi, fr))
        fi += 1
    return out


def lmxy(lms):
    return [[round(p.x, 4), round(p.y, 4)] for p in lms.landmark]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, required=True)
    ap.add_argument("--video-root", type=Path, required=True)
    ap.add_argument("--frames-per-clip", type=int, default=12)
    ap.add_argument("--crop-px", type=int, default=128)
    ap.add_argument("--mp-px", type=int, default=320)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--nshards", type=int, default=1)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    out = args.out if args.out.is_absolute() else (HERE / args.out)
    out.mkdir(parents=True, exist_ok=True)
    cv2.setNumThreads(1)

    man = json.loads(args.manifest.read_text())["rows"]
    if args.nshards > 1:
        man = man[args.shard::args.nshards]
    print(f"shard {args.shard}/{args.nshards}: {len(man)} AC clips | {args.frames_per_clip}f", flush=True)

    hol = mp_holistic.Holistic(static_image_mode=True, model_complexity=1, refine_face_landmarks=False)
    hnd = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.3, min_tracking_confidence=0.3)
    images, rows = [], []
    stats = {"frames": 0, "missing": 0, "no_pose": 0, "present_left": 0, "present_right": 0}

    for ci, clip in enumerate(man):
        mp4 = args.video_root / clip["video_file"]
        if not mp4.exists():
            stats["missing"] += 1; continue
        cap = cv2.VideoCapture(str(mp4)); frames = seq_frames(cap, args.frames_per_clip); cap.release()
        clip_id = Path(clip["video_file"]).stem
        for fi, bgr in frames:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            h0, w0 = rgb.shape[:2]
            scale = 1024.0 / max(h0, w0)
            mp_in = cv2.resize(rgb, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else rgb
            res = hol.process(mp_in)
            tg = derive_targets(res)
            ub = tg["upper_body_or_signing_space"]
            if not ub:
                stats["no_pose"] += 1; continue
            cb = expand_crop(ub)
            cx1, cy1, cx2, cy2 = int(cb[0]*w0), int(cb[1]*h0), int(cb[2]*w0), int(cb[3]*h0)
            if cx2 - cx1 < 8 or cy2 - cy1 < 8:
                stats["missing"] += 1; continue
            crop = rgb[cy1:cy2, cx1:cx2]
            up = cv2.resize(crop, (args.mp_px, args.mp_px), interpolation=cv2.INTER_LINEAR)
            r2 = hnd.process(up)
            hands = []
            if r2.multi_hand_landmarks:
                for lms in r2.multi_hand_landmarks:
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
            images.append(cv2.resize(crop, (args.crop_px, args.crop_px), interpolation=cv2.INTER_AREA).astype(np.uint8))
            rows.append({"split": "train", "clip_id": clip_id, "label_id": clip["label_id"],
                         "video_frame_index": int(fi), "crop_box_xyxy": [round(v, 4) for v in cb],
                         "hands_crop": tgt, "orig_full": {"left_or_first_hand": None, "right_or_second_hand": None}})
            stats["frames"] += 1
        if (ci + 1) % 200 == 0:
            print(f"  {ci+1}/{len(man)} clips | {stats['frames']} crops | L{stats['present_left']} R{stats['present_right']}", flush=True)
    hol.close(); hnd.close()

    np.save(out / "frames.npy", np.stack(images) if images else np.zeros((0, args.crop_px, args.crop_px, 3), np.uint8))
    (out / "rows.json").write_text(json.dumps({"schema_version": "asl-pilot-detector0-handcrop/v1",
        "label_source": "mediapipe_holistic+hands_on_asl_citizen_0_10_14_offline", "crop_px": args.crop_px,
        "stats": stats, "rows": rows}))
    print(f"shard {args.shard}: {stats['frames']} crops, L{stats['present_left']} R{stats['present_right']}, {stats['no_pose']} no-pose", flush=True)


if __name__ == "__main__":
    main()
