#!/usr/bin/env python3
"""Build a HUMAN-VERIFIED hand eval set for the annotation GUI.

Samples test-split frames (mostly hand-present, some no-hand for false-trigger),
decodes them sharp from the source mp4 for accurate human boxing, and pre-loads
the MediaPipe auto-labels so the user mostly nudges/confirms. Also writes a 96px
array (the detector's input) aligned to the index, so we can later score the
trained detector against the human boxes in the same coordinate space.

  .labelvenv/bin/python prepare_eval.py --src .cache/autolabel-big --n 240 --out .cache-eval
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
TARGET_IDS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=Path(__file__).resolve().parent / ".cache/autolabel-big")
    ap.add_argument("--n", type=int, default=240)
    ap.add_argument("--disp-px", type=int, default=480)
    ap.add_argument("--model-px", type=int, default=96)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / ".cache-eval")
    args = ap.parse_args()
    src = args.src if args.src.is_absolute() else (Path(__file__).resolve().parent / args.src)
    out = args.out if args.out.is_absolute() else (Path(__file__).resolve().parent / args.out)
    (out / "frames").mkdir(parents=True, exist_ok=True)

    rows = [r for r in json.loads((src / "rows.json").read_text())["rows"] if r["split"] == "test"]
    hand_present = [r for r in rows if r["targets"]["left_or_first_hand"]["presence"] or r["targets"]["right_or_second_hand"]["presence"]]
    no_hand = [r for r in rows if not (r["targets"]["left_or_first_hand"]["presence"] or r["targets"]["right_or_second_hand"]["presence"])]
    # stratify ~75% hand-present, ~25% no-hand; balance across labels
    def balanced(pool, k):
        by = defaultdict(list)
        for r in pool: by[r["label_id"]].append(r)
        order = sorted(by); out = []; i = 0
        while len(out) < k and any(by[l] for l in order):
            l = order[i % len(order)]; i += 1
            if by[l]: out.append(by[l].pop())
        return out[:k]
    n_h = int(args.n * 0.75)
    sel = balanced(hand_present, n_h) + balanced(no_hand, args.n - n_h)

    items, m96 = [], []
    for r in sel:
        mp4 = GAME / SD[r["split"]] / r["label_id"] / f"{r['clip_id']}.mp4"
        if not mp4.exists():
            continue
        cap = cv2.VideoCapture(str(mp4)); cap.set(cv2.CAP_PROP_POS_FRAMES, r["video_frame_index"])
        ok, bgr = cap.read(); cap.release()
        if not ok or bgr is None:
            continue
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        item_id = f"{r['clip_id']}__f{r['video_frame_index']:03d}"
        cv2.imwrite(str(out / "frames" / f"{item_id}.png"),
                    cv2.cvtColor(cv2.resize(rgb, (args.disp_px, args.disp_px), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR))
        m96.append(cv2.resize(rgb, (args.model_px, args.model_px), interpolation=cv2.INTER_AREA).astype(np.uint8))
        items.append({"item_id": item_id, "png": f"{item_id}.png", "clip_id": r["clip_id"],
                      "label_id": r["label_id"], "split": "test", "frame_index": r["video_frame_index"],
                      "source_id": "popsign-v1-original-videos", "source_split": "test",
                      "source_record_id": None, "source_video_sha256": None, "signer_identity_hash": None,
                      "frame_tensor_path": None, "frame_tensor_sha256": None,
                      "existing_targets": r["targets"]})  # pre-load auto-labels for correction
    np.save(out / "frames96.npy", np.stack(m96) if m96 else np.zeros((0, args.model_px, args.model_px, 3), np.uint8))
    (out / "index.json").write_text(json.dumps({
        "schema_version": "asl-pilot-detector0-annotator-index/v1",
        "coordinate_space": "normalized_full_frame_xyxy_top_left_origin",
        "target_ids": TARGET_IDS, "items": items,
        "note": "human-verified hand eval set; frames96.npy aligned to items for detector scoring",
    }, indent=2))
    print(f"wrote {len(items)} eval frames -> {out} (display {args.disp_px}px, model {args.model_px}px)")
    print(f"  {sum(1 for it in items if it['existing_targets']['left_or_first_hand']['presence'] or it['existing_targets']['right_or_second_hand']['presence'])} hand-present (auto)")


if __name__ == "__main__":
    main()
