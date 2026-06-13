#!/usr/bin/env python3
"""Extract tight PER-HAND crops for the crop-pixel recognizer (handshape-resolved).

Per frame: region detector -> signing-space crop -> landmark model localizes each
hand -> map hand landmarks to the full-res frame -> crop a tight box around each
hand -> resize to PxP. Composites left|right into one Px(2P) image per frame, so
the CNN sees both hands' handshape at real resolution. Our-models-only at runtime.
Output schema matches extract_recognizer_crops (train_crop_recognizer reads it).

  python extract_hand_crops.py --nshards 6 --shard 0 --device cpu --px 64 \
      --clips-per-word 40 --frames-per-clip 16 --out .cache/hand-crops-sh0
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np, torch, cv2

from extract_recognizer_sequences import scan_raw_clips, sample_frames
from train_detector import make_xy
from train_detector_grid import GridDetector, gather_cell
from train_hands_landmarks_heatmap import HeatmapNet, soft_argmax
from infer_end_to_end import expand_crop, order_box, HANDS

HERE = Path(__file__).resolve().parent
RAW = HERE.parents[1] / "data/external/popsign-v1/raw"
SIGNING = 3


def hand_box_from_landmarks(lm, cb):
    """lm: (K,2) crop-norm [0,1] within the signing crop; cb: signing box (full-frame
    normalized). Returns a padded full-frame-normalized hand box around the landmarks."""
    fx = cb[0] + lm[:, 0] * (cb[2] - cb[0])
    fy = cb[1] + lm[:, 1] * (cb[3] - cb[1])
    x1, x2, y1, y2 = fx.min(), fx.max(), fy.min(), fy.max()
    w, h = max(x2 - x1, 1e-3), max(y2 - y1, 1e-3)
    s = 0.4 * max(w, h)                       # pad + squarish context around the hand
    cxm, cym = (x1 + x2) / 2, (y1 + y2) / 2
    half = max(w, h) / 2 + s
    return [max(0., cxm - half), max(0., cym - half), min(1., cxm + half), min(1., cym + half)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips-per-word", type=int, default=40)
    ap.add_argument("--frames-per-clip", type=int, default=16)
    ap.add_argument("--px", type=int, default=64)
    ap.add_argument("--region", type=Path, default=HERE / "output/detector0-grid-big2.pt")
    ap.add_argument("--landmark", type=Path, default=HERE / "output/detector0-hand-landmarks-big2.pt")
    ap.add_argument("--presence", type=float, default=0.3)
    ap.add_argument("--max-clips", type=int, default=0)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--nshards", type=int, default=1)
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--out", type=Path, default=HERE / ".cache/hand-crops")
    args = ap.parse_args()
    out = args.out; out.mkdir(parents=True, exist_ok=True)
    cv2.setNumThreads(1); P = args.px
    dev = torch.device("mps") if (args.device == "mps" and torch.backends.mps.is_available()) else torch.device("cpu")

    rck = torch.load(args.region, map_location="cpu", weights_only=False)
    region = GridDetector(n_targets=4, grid=rck["grid"]).to(dev); region.load_state_dict(rck["state_dict"]); region.eval()
    lck = torch.load(args.landmark, map_location="cpu", weights_only=False)
    K, GG = lck["k"], lck["g"]
    land = HeatmapNet(n_targets=2, k=K, g=GG).to(dev); land.load_state_dict(lck["state_dict"]); land.eval()

    entries = scan_raw_clips(args.clips_per_word)
    if args.max_clips:
        entries = entries[: args.max_clips]
    if args.nshards > 1:
        entries = entries[args.shard::args.nshards]
    print(f"shard {args.shard}/{args.nshards}: {len(entries)} clips | {args.frames_per_clip}f x {P}px per hand | dev {dev}", flush=True)

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
            rb = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))
            # signing crops -> landmark model
            sub128, cbs = [], []
            for j in range(len(rgb)):
                H0, W0 = rgb[j].shape[:2]
                cb = expand_crop(order_box(rb[j, SIGNING].clamp(0, 1).tolist())); cbs.append(cb)
                x1, y1, x2, y2 = int(cb[0]*W0), int(cb[1]*H0), int(cb[2]*W0), int(cb[3]*H0)
                s = rgb[j][max(0, y1):max(y1+1, y2), max(0, x1):max(x1+1, x2)]
                sub128.append(cv2.resize(s, (128, 128), interpolation=cv2.INTER_AREA))
            pl, hm = land(make_xy(np.stack(sub128).astype(np.uint8), dev))
            coords = soft_argmax(hm, GG, 2, K); prob = torch.sigmoid(pl)
            for j, (fi, _) in enumerate(frames):
                H0, W0 = rgb[j].shape[:2]
                comp = np.zeros((P, 2 * P, 3), np.uint8)            # left | right
                for hi in range(2):
                    if float(prob[j, hi]) < args.presence:
                        continue
                    hb = hand_box_from_landmarks(coords[j, hi].cpu().numpy(), cbs[j])
                    hx1, hy1, hx2, hy2 = int(hb[0]*W0), int(hb[1]*H0), int(hb[2]*W0), int(hb[3]*H0)
                    sub = rgb[j][max(0, hy1):max(hy1+1, hy2), max(0, hx1):max(hx1+1, hx2)]
                    if sub.size:
                        comp[:, hi*P:(hi+1)*P] = cv2.resize(sub, (P, P), interpolation=cv2.INTER_AREA)
                crops.append(comp)
                rows.append({"clip_id": clip["clip_id"], "label_id": clip["label_id"], "split": clip["split"],
                             "video_frame_index": int(fi), "idx": len(crops) - 1})
            if (ci + 1) % 200 == 0:
                print(f"  {ci+1}/{len(entries)} clips | {len(crops)} composites", flush=True)

    np.save(out / "crops.npy", np.stack(crops).astype(np.uint8) if crops else np.zeros((0, P, 2*P, 3), np.uint8))
    (out / "rows.json").write_text(json.dumps({"px": P, "composite": "left|right hand", "clips": len(entries) - miss,
                                               "missing": miss, "rows": rows}))
    print(f"shard {args.shard}: wrote {len(crops)} composites ({len(entries)-miss} clips, {miss} missing)", flush=True)


if __name__ == "__main__":
    main()
