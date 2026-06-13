#!/usr/bin/env python3
"""Extract signing-space CROP pixels per frame for the crop-pixel recognizer.

For each PopSign clip: decode dense frames -> our scratch region detector finds
the signing-space box -> crop -> resize to PX. Saves crops.npy (uint8) + rows.json
(metadata aligned by index). Region model only (no landmark model). Our-models
only at runtime. Sharded for parallel CPU extraction.

  python extract_recognizer_crops.py --nshards 6 --shard 0 --device cpu --px 64 \
      --clips-per-word 40 --frames-per-clip 16 --out .cache/recog-crops-sh0
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np, torch, cv2

from extract_recognizer_sequences import scan_raw_clips, sample_frames
from train_detector import make_xy
from train_detector_grid import GridDetector, gather_cell
from infer_end_to_end import expand_crop, order_box

HERE = Path(__file__).resolve().parent
RAW = HERE.parents[1] / "data/external/popsign-v1/raw"
SIGNING = 3


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips-per-word", type=int, default=40)
    ap.add_argument("--frames-per-clip", type=int, default=16)
    ap.add_argument("--px", type=int, default=64)
    ap.add_argument("--region", type=Path, default=HERE / "output/detector0-grid-big2.pt")
    ap.add_argument("--max-clips", type=int, default=0)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--nshards", type=int, default=1)
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--out", type=Path, default=HERE / ".cache/recog-crops")
    args = ap.parse_args()
    out = args.out; out.mkdir(parents=True, exist_ok=True)
    cv2.setNumThreads(1)
    dev = torch.device("mps") if (args.device == "mps" and torch.backends.mps.is_available()) else torch.device("cpu")

    rck = torch.load(args.region, map_location="cpu", weights_only=False)
    region = GridDetector(n_targets=4, grid=rck["grid"]).to(dev); region.load_state_dict(rck["state_dict"]); region.eval()

    entries = scan_raw_clips(args.clips_per_word)
    if args.max_clips:
        entries = entries[: args.max_clips]
    if args.nshards > 1:
        entries = entries[args.shard::args.nshards]
    print(f"shard {args.shard}/{args.nshards}: {len(entries)} clips | {args.frames_per_clip}f x {args.px}px | dev {dev}", flush=True)

    crops, rows = [], []
    miss = 0
    with torch.no_grad():
        for ci, clip in enumerate(entries):
            mp4 = RAW / clip["source_record_id"]
            if not mp4.exists():
                miss += 1; continue
            cap = cv2.VideoCapture(str(mp4)); frames = sample_frames(cap, args.frames_per_clip); cap.release()
            if not frames:
                miss += 1; continue
            rgb = [cv2.cvtColor(b, cv2.COLOR_BGR2RGB) for _, b in frames]
            r96 = np.stack([cv2.resize(im, (96, 96), interpolation=cv2.INTER_AREA) for im in rgb]).astype(np.uint8)
            obj, box = region(make_xy(r96, dev))
            rb = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))  # (F,4,4)
            for j, (fi, _) in enumerate(frames):
                H0, W0 = rgb[j].shape[:2]
                cb = expand_crop(order_box(rb[j, SIGNING].clamp(0, 1).tolist()))
                x1, y1, x2, y2 = int(cb[0]*W0), int(cb[1]*H0), int(cb[2]*W0), int(cb[3]*H0)
                sub = rgb[j][max(0, y1):max(y1+1, y2), max(0, x1):max(x1+1, x2)]
                crops.append(cv2.resize(sub, (args.px, args.px), interpolation=cv2.INTER_AREA))
                rows.append({"clip_id": clip["clip_id"], "label_id": clip["label_id"], "split": clip["split"],
                             "video_frame_index": int(fi), "idx": len(crops) - 1})
            if (ci + 1) % 200 == 0:
                print(f"  {ci+1}/{len(entries)} clips | {len(crops)} crops", flush=True)

    np.save(out / "crops.npy", np.stack(crops).astype(np.uint8) if crops else np.zeros((0, args.px, args.px, 3), np.uint8))
    (out / "rows.json").write_text(json.dumps({"px": args.px, "frames_per_clip": args.frames_per_clip,
                                               "region_model": args.region.name, "clips": len(entries) - miss,
                                               "missing": miss, "rows": rows}))
    print(f"shard {args.shard}: wrote {len(crops)} crops ({len(entries)-miss} clips, {miss} missing)", flush=True)


if __name__ == "__main__":
    main()
