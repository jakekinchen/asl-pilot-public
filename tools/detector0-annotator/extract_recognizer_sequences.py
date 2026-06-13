#!/usr/bin/env python3
"""Extract recognizer training sequences using ONLY our scratch models (Option A).

For each PopSign clip: decode F dense frames -> our scratch region detector finds
the signing-space crop -> our scratch hand-landmark model gives 21 crop-space
landmarks per hand. Writes rows.json in the SAME schema as the MediaPipe
crop-relabel cache, so train_recognizer.py reads it unchanged.

This makes the recognizer train on the exact landmark distribution it sees at
runtime (our models), not the cleaner offline MediaPipe labels. No MediaPipe here.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python extract_recognizer_sequences.py \
      --clips-per-word 60 --frames-per-clip 16 \
      --region output/detector0-grid-big2.pt --landmark output/detector0-hand-landmarks-big2.pt
"""
from __future__ import annotations

import argparse, json
from pathlib import Path
import numpy as np, torch, cv2

from train_detector import make_xy
from train_detector_grid import GridDetector, gather_cell
from train_hands_landmarks_heatmap import HeatmapNet, soft_argmax
from infer_end_to_end import expand_crop, order_box, HANDS

HERE = Path(__file__).resolve().parent
RAW = HERE.parents[1] / "data/external/popsign-v1/raw"   # worktree root
GAME = RAW / "popsign_v1_0/game"
SIGNING = 3  # index of upper_body_or_signing_space in the 4-region head


# inlined from autolabel.py (avoid importing it -- its module load pulls mediapipe)
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


def sample_frames(cap, k):
    """Sequential decode (NO per-frame seeking): read straight through once and
    keep only the k evenly-spaced frames. ~5-10x faster than cap.set seeks, which
    re-decode from a keyframe every call."""
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if n > 0:
        keep = set(int(round(x)) for x in np.linspace(0, n - 1, min(k, n)))
        frames, fi = [], 0
        while True:
            ok, fr = cap.read()
            if not ok:
                break
            if fi in keep:
                frames.append((fi, fr))
            fi += 1
        return frames
    # unknown length: buffer all then subsample (PopSign clips are short)
    allf = []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        allf.append(fr)
    if not allf:
        return []
    idxs = sorted(set(int(round(x)) for x in np.linspace(0, len(allf) - 1, min(k, len(allf)))))
    return [(i, allf[i]) for i in idxs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips-per-word", type=int, default=60)
    ap.add_argument("--frames-per-clip", type=int, default=16)
    ap.add_argument("--region", type=Path, default=HERE / "output/detector0-grid-big2.pt")
    ap.add_argument("--landmark", type=Path, default=HERE / "output/detector0-hand-landmarks-big2.pt")
    ap.add_argument("--max-clips", type=int, default=0)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--nshards", type=int, default=1)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--manifest", type=Path, default=None, help="json {rows:[{video_file,label_id}]} -> relabel these clips instead of PopSign")
    ap.add_argument("--video-root", type=Path, default=None, help="dir holding the manifest's video_file paths")
    ap.add_argument("--out", type=Path, default=HERE / ".cache/recog-seq")
    args = ap.parse_args()
    out = args.out; out.mkdir(parents=True, exist_ok=True)
    cv2.setNumThreads(1)  # avoid oversubscription when many shards run in parallel
    dev = torch.device("mps") if (args.device == "mps" and torch.backends.mps.is_available()) else torch.device("cpu")

    rck = torch.load(args.region, map_location="cpu", weights_only=False)
    region = GridDetector(n_targets=4, grid=rck["grid"]).to(dev); region.load_state_dict(rck["state_dict"]); region.eval()
    lck = torch.load(args.landmark, map_location="cpu", weights_only=False)
    K, GG = lck["k"], lck["g"]
    land = HeatmapNet(n_targets=2, k=K, g=GG, width=lck.get("width", 32)).to(dev); land.load_state_dict(lck["state_dict"]); land.eval()

    if args.manifest:
        vroot = args.video_root or args.manifest.parent
        entries = [{"clip_id": Path(r["video_file"]).stem, "label_id": r["label_id"], "split": "train",
                    "abspath": str(vroot / r["video_file"])} for r in json.loads(args.manifest.read_text())["rows"]]
    else:
        entries = scan_raw_clips(args.clips_per_word)
    if args.max_clips:
        entries = entries[: args.max_clips]
    if args.nshards > 1:
        entries = entries[args.shard::args.nshards]   # strided -> even mix of words/splits per shard
    print(f"shard {args.shard}/{args.nshards}: {len(entries)} clips | frames/clip {args.frames_per_clip} | dev {dev} | region {args.region.name}", flush=True)

    rows = []
    stats = {"clips": 0, "missing": 0, "frames": 0, "hand_present": 0}
    with torch.no_grad():
        for ci, clip in enumerate(entries):
            mp4 = Path(clip["abspath"]) if "abspath" in clip else RAW / clip["source_record_id"]
            if not mp4.exists():
                stats["missing"] += 1; continue
            cap = cv2.VideoCapture(str(mp4)); frames = sample_frames(cap, args.frames_per_clip); cap.release()
            if not frames:
                stats["missing"] += 1; continue
            stats["clips"] += 1

            rgb = [cv2.cvtColor(b, cv2.COLOR_BGR2RGB) for _, b in frames]
            r96 = np.stack([cv2.resize(im, (96, 96), interpolation=cv2.INTER_AREA) for im in rgb]).astype(np.uint8)
            obj, box = region(make_xy(r96, dev))
            rb = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))  # (F,4,4)

            crops = []
            for j in range(len(rgb)):
                H0, W0 = rgb[j].shape[:2]
                cb = expand_crop(order_box(rb[j, SIGNING].clamp(0, 1).tolist()))
                x1, y1, x2, y2 = int(cb[0]*W0), int(cb[1]*H0), int(cb[2]*W0), int(cb[3]*H0)
                sub = rgb[j][max(0, y1):max(y1+1, y2), max(0, x1):max(x1+1, x2)]
                crops.append(cv2.resize(sub, (128, 128), interpolation=cv2.INTER_AREA))
            c128 = np.stack(crops).astype(np.uint8)
            pl, hm = land(make_xy(c128, dev))
            coords = soft_argmax(hm, GG, 2, K)            # (F,2,K,2) crop-norm
            prob = torch.sigmoid(pl)                      # (F,2) continuous presence

            for j, (fi, _) in enumerate(frames):
                hc = {}
                for hi, hname in enumerate(HANDS):
                    # always keep the predicted coords + presence prob (soft confidence,
                    # not a hard gate) so the recognizer keeps borderline-hand signal
                    hc[hname] = {"landmarks_xy": [[round(float(x), 5), round(float(y), 5)] for x, y in coords[j, hi].cpu().numpy()],
                                 "presence": round(float(prob[j, hi]), 4)}
                    if float(prob[j, hi]) > 0.5:
                        stats["hand_present"] += 1
                rows.append({"clip_id": clip["clip_id"], "label_id": clip["label_id"], "split": clip["split"],
                             "video_frame_index": int(fi), "hands_crop": hc})
                stats["frames"] += 1
            if (ci + 1) % 200 == 0:
                print(f"  {ci+1}/{len(entries)} clips | {stats['frames']} frames | {stats['hand_present']} hand-instances")

    (out / "rows.json").write_text(json.dumps({"source": "scratch region+landmark models (our-models-only, no mediapipe)",
                                               "region_model": args.region.name, "landmark_model": args.landmark.name,
                                               "frames_per_clip": args.frames_per_clip, "stats": stats, "rows": rows}))
    print(f"\nwrote {len(rows)} rows ({stats['clips']} clips, {stats['missing']} missing) -> {out/'rows.json'}")
    print(f"hand-instances: {stats['hand_present']}")


if __name__ == "__main__":
    main()
