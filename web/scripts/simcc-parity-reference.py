#!/usr/bin/env python3
"""Python reference for the SimCC-w48 JS pipeline parity gate.

Runs the EXACT run10 training-extraction wiring
(/Users/kelly/ws1-recog-extract-ws/extract_simccw48.py: region grid
detector0-grid-big2 (torch) -> signing crop -> detector0-hands2 (ONNX) hand
boxes -> 256px hand crops -> SimCC w48 student (torch, the frozen extraction
checkpoint) -> decode_simcc_argmax -> project to signing-crop coords ->
wrist-x slot sort -> rounded rows -> 90-dim frame features) over the 8 bundled
sample clips (web/public/pilot/clips), saving:

  /tmp/simcc-parity/{word}/{j:02d}.png   the cv2-decoded sampled frames
                                          (lossless; the node side reads these
                                          same pixels so frame-decode is out of
                                          the comparison)
  /tmp/simcc-parity/py_simcc.json         per-frame signing pixel boxes, hand
                                          crop boxes, landmarks, presence,
                                          cache-dialect features, and the run10
                                          torch top-5 per clip

Pair with web/scripts/simcc-parity-check.mjs (the faithful node port of
src/lib/simcc-pipeline.ts).

Run (CPU, deterministic — extraction proved CPU/MPS rows bit-identical):
  /Users/kelly/Developer/asl-pilot/.venv/bin/python \
      web/scripts/simcc-parity-reference.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
import torch

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
CODE = "/Users/kelly/feasibility-rtmpose-ws/code"
ANNOT = "/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator"
sys.path.insert(0, CODE)
sys.path.insert(0, ANNOT)

import onnxruntime as ort  # noqa: E402

from train_detector import make_xy  # noqa: E402
from train_detector_grid import GridDetector, gather_cell  # noqa: E402
from infer_end_to_end import expand_crop, order_box, HANDS  # noqa: E402
from rtmpose_hand_teacher_runner import (  # noqa: E402
    detector_hands, crop_hand, project_crop_points_to_frame,
)
from simcc_hand_student import (  # noqa: E402
    SimCCConfig, ScratchSimCCHandLandmarkNet, imagenet_normalize, decode_simcc_argmax,
)
import feasibility_extract_both as FX  # noqa: E402
from train_recognizer import frame_feat  # noqa: E402  (annotator: run10 featurizer)
from seq_transformer import SeqTransformer  # noqa: E402

REGION_PT = Path("/Users/kelly/feasibility-rtmpose-ws/models/detector0-grid-big2.pt")
HANDS_ONNX = Path("/Users/kelly/feasibility-rtmpose-ws/models/detector0-hands2.onnx")
STUDENT_PT = Path("/Users/kelly/ws1-recog-extract-ws/ws1-hand-simcc-student-w48-v1-final.pt")
RECOG_PT = Path(ANNOT) / ("output/m3jb-recognizer-transformer-run10-simccw48-fulltrain-"
                          "e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt")
CLIPS = WEB / "public/pilot/clips"
OUT_DIR = Path("/tmp/simcc-parity")
WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"]
SIGNING = 3
KPTS = 21
FPC = 32


def main() -> None:
    cv2.setNumThreads(1)
    torch.set_num_threads(1)
    dev = torch.device("cpu")

    rck = torch.load(REGION_PT, map_location="cpu", weights_only=False)
    region = GridDetector(n_targets=4, grid=rck["grid"]).to(dev)
    region.load_state_dict(rck["state_dict"])
    region.eval()

    sck = torch.load(STUDENT_PT, map_location="cpu", weights_only=False)
    cfg = SimCCConfig(width=int(sck["width"]), dropout=float(sck.get("dropout", 0.0)))
    student = ScratchSimCCHandLandmarkNet(cfg).to(dev)
    student.load_state_dict(sck["state_dict"])
    student.eval()

    so = ort.SessionOptions()
    so.intra_op_num_threads = 1
    so.inter_op_num_threads = 1
    hands_sess = ort.InferenceSession(str(HANDS_ONNX), sess_options=so, providers=["CPUExecutionProvider"])

    rk = torch.load(RECOG_PT, map_location="cpu", weights_only=False)
    labels = list(rk["labels"])
    recog = SeqTransformer(feat=int(rk["feat"]), n_classes=len(labels),
                           d_model=int(rk["d_model"]), n_layers=int(rk["n_layers"]),
                           n_heads=int(rk["n_heads"]), dropout=float(rk["dropout"]))
    recog.load_state_dict(rk["state_dict"])
    recog.eval()

    out: dict = {"words": {}}
    with torch.no_grad():
        for word in WORDS:
            mp4 = CLIPS / f"{word}.mp4"
            cap = cv2.VideoCapture(str(mp4))
            keep, _n = FX.sample_frame_indices(cap, FPC)
            frames = FX.decode_at(cap, keep)
            cap.release()
            fidxs = [fi for fi in keep if fi in frames]
            wdir = OUT_DIR / word
            wdir.mkdir(parents=True, exist_ok=True)
            for j, fi in enumerate(fidxs):
                cv2.imwrite(str(wdir / f"{j:02d}.png"), frames[fi])

            rgb = [cv2.cvtColor(frames[fi], cv2.COLOR_BGR2RGB) for fi in fidxs]
            r96 = np.stack([cv2.resize(im, (96, 96), interpolation=cv2.INTER_AREA) for im in rgb]).astype(np.uint8)
            obj, box = region(make_xy(r96, dev))
            rb = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))

            sc_imgs, signing_px = [], []
            for j in range(len(rgb)):
                H0, W0 = rgb[j].shape[:2]
                cb = expand_crop(order_box(rb[j, SIGNING].clamp(0, 1).tolist()))
                x1, y1, x2, y2 = int(cb[0] * W0), int(cb[1] * H0), int(cb[2] * W0), int(cb[3] * H0)
                x1 = max(0, x1); y1 = max(0, y1); x2 = max(x1 + 1, x2); y2 = max(y1 + 1, y2)
                sub = rgb[j][y1:y2, x1:x2]
                if sub.size == 0:
                    sub = rgb[j]
                sc_imgs.append(sub)
                signing_px.append([x1, y1, x2, y2])

            per_frame_hands = []
            all_crops = []
            for j in range(len(fidxs)):
                hs_list = []
                for hand in detector_hands(hands_sess, sc_imgs[j])[:2]:
                    cr, cbb = crop_hand(sc_imgs[j], hand.box)
                    hs_list.append((cr, cbb))
                    all_crops.append(cr)
                per_frame_hands.append(hs_list)

            if all_crops:
                x = torch.from_numpy(np.stack(all_crops).astype(np.float32) / 255.0).permute(0, 3, 1, 2).to(dev)
                sx, sy = student(imagenet_normalize(x))
                dec = decode_simcc_argmax(sx, sy, cfg)
                xy = dec.normalized.cpu().numpy()
                conf = dec.scores.cpu().numpy()

            crop_ptr = 0
            frames_out = []
            rows = []
            for j, fi in enumerate(fidxs):
                hc = {h: {"landmarks_xy": [[0.0, 0.0]] * KPTS, "presence": 0.0} for h in HANDS}
                hs_list = per_frame_hands[j]
                crop_boxes = []
                if hs_list:
                    entries = []
                    for (_cr, cbb) in hs_list:
                        pts = project_crop_points_to_frame(xy[crop_ptr], cbb)
                        pres = float(np.clip(conf[crop_ptr].mean(), 0.0, 1.0))
                        entries.append((float(pts[0, 0]), pts, pres))
                        crop_boxes.append([float(v) for v in cbb])
                        crop_ptr += 1
                    entries.sort(key=lambda e: e[0])
                    for slot, (_wx, pts, pres) in zip(HANDS, entries):
                        hc[slot] = {"landmarks_xy": [[round(float(px), 5), round(float(py), 5)] for px, py in pts],
                                    "presence": round(pres, 4)}
                frames_out.append({"j": j, "video_frame_index": int(fi),
                                   "signing_px": signing_px[j],
                                   "hand_crop_boxes": crop_boxes,
                                   "hands": hc})
                rows.append(hc)

            feats = np.array([frame_feat(hc) for hc in rows], np.float32)  # (T,90), cache dialect
            seq = torch.from_numpy(feats[None])
            lengths = torch.tensor([feats.shape[0]], dtype=torch.long)
            logits = recog(seq, lengths)[0]
            probs = torch.softmax(logits, dim=-1).numpy()
            order = np.argsort(-probs)[:5]
            top5 = [{"label": labels[i], "prob": round(float(probs[i]), 6)} for i in order]
            out["words"][word] = {
                "frames": frames_out,
                "features": feats.tolist(),
                "torch_top5": top5,
                "torch_logits": [round(float(v), 6) for v in logits.numpy()],
            }
            print(f"{word:9s} frames {len(fidxs):2d} | torch top-5: "
                  + ", ".join(f"{t['label']} {t['prob']:.3f}" for t in top5), flush=True)

    (OUT_DIR / "py_simcc.json").write_text(json.dumps(out))
    print(f"wrote {OUT_DIR / 'py_simcc.json'}")


if __name__ == "__main__":
    main()
