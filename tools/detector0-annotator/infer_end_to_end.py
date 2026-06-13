#!/usr/bin/env python3
"""End-to-end Detector 0 inference DEMO, using ONLY our scratch models.

frame -> scratch region detector (detector0-grid-final.pt) -> signing-space crop
-> scratch hand-landmark model (detector0-hand-landmarks-softargmax.pt) -> 21
hand keypoints mapped to the full frame. Renders region boxes + hand skeletons.

Imports torch + PIL + numpy only -- NO MediaPipe / no pretrained model in this
inference path (proves the runtime constraint). Reads the already-decoded eval
frames so it needs no cv2/mp4 decode.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python infer_end_to_end.py --n 10
"""
from __future__ import annotations

import argparse, json
from pathlib import Path
import numpy as np, torch
from PIL import Image, ImageDraw

from train_detector import make_xy
from train_detector_grid import GridDetector, gather_cell
from train_hands_landmarks_heatmap import HeatmapNet, soft_argmax, G

HERE = Path(__file__).resolve().parent
REGIONS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"]
RCOLOR = {"left_or_first_hand": (255, 77, 77), "right_or_second_hand": (77, 121, 255),
          "head_or_face": (46, 204, 113), "upper_body_or_signing_space": (241, 196, 15)}
HANDS = ["left_or_first_hand", "right_or_second_hand"]
# MediaPipe-style 21-landmark hand connections (for skeleton drawing only)
HAND_EDGES = [(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(0,9),(9,10),(10,11),(11,12),
              (0,13),(13,14),(14,15),(15,16),(0,17),(17,18),(18,19),(19,20),(5,9),(9,13),(13,17)]


def order_box(b):
    x1, y1, x2, y2 = [float(v) for v in b]
    return [min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)]


def expand_crop(b):
    x1, y1, x2, y2 = b; w, h = x2 - x1, y2 - y1
    return [max(0., x1-.25*w), max(0., y1-.35*h), min(1., x2+.25*w), min(1., y2+.12*h)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval", type=Path, default=HERE / ".cache-eval")
    ap.add_argument("--region", type=Path, default=HERE / "output/detector0-grid-final.pt")
    ap.add_argument("--landmark", type=Path, default=HERE / "output/detector0-hand-landmarks-softargmax.pt")
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--out", type=Path, default=HERE / "output/demo")
    args = ap.parse_args()
    out = args.out; (out).mkdir(parents=True, exist_ok=True)
    dev = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")

    idx = json.loads((args.eval / "index.json").read_text())["items"]
    f96 = np.load(args.eval / "frames96.npy")
    # prefer hand-present frames for a good demo
    order = sorted(range(len(idx)), key=lambda i: 0 if (idx[i]["existing_targets"]["left_or_first_hand"]["presence"] or idx[i]["existing_targets"]["right_or_second_hand"]["presence"]) else 1)
    pick = order[: args.n]

    rck = torch.load(args.region, map_location="cpu", weights_only=False)
    region = GridDetector(n_targets=4, grid=rck["grid"]).to(dev); region.load_state_dict(rck["state_dict"]); region.eval()
    lck = torch.load(args.landmark, map_location="cpu", weights_only=False)
    land = HeatmapNet(n_targets=2, k=lck["k"], g=lck["g"]).to(dev); land.load_state_dict(lck["state_dict"]); land.eval()

    results = []
    with torch.no_grad():
        Xr = make_xy(f96[pick], dev)
        obj, box = region(Xr)
        rboxes = gather_cell(box, obj.reshape(obj.size(0), 4, -1).argmax(-1))  # (n,4,4)
        for j, i in enumerate(pick):
            png = Image.open(args.eval / "frames" / idx[i]["png"]).convert("RGB")
            W, Himg = png.size
            sboxes = {REGIONS[t]: order_box(rboxes[j, t].clamp(0, 1)) for t in range(4)}
            cb = expand_crop(sboxes["upper_body_or_signing_space"])
            cx1, cy1, cx2, cy2 = int(cb[0]*W), int(cb[1]*Himg), int(cb[2]*W), int(cb[3]*Himg)
            crop = png.crop((cx1, cy1, max(cx1+1, cx2), max(cy1+1, cy2))).resize((128, 128), Image.BICUBIC)
            carr = np.asarray(crop, np.uint8)[None]
            pl, hm = land(make_xy(carr, dev)); coords = soft_argmax(hm, lck["g"], 2, lck["k"])[0]  # (2,K,2) crop coords
            pres = (torch.sigmoid(pl[0]) > 0.5).tolist()
            # draw
            d = ImageDraw.Draw(png)
            for t in REGIONS:
                bx = sboxes[t]; d.rectangle([bx[0]*W, bx[1]*Himg, bx[2]*W, bx[3]*Himg], outline=RCOLOR[t], width=3)
            cw, ch = cx2 - cx1, cy2 - cy1
            land_full = {}
            for hi, hname in enumerate(HANDS):
                if not pres[hi]:
                    continue
                kp = coords[hi].cpu().numpy()  # (K,2) crop-norm
                pts = [(cx1 + kx * cw, cy1 + ky * ch) for kx, ky in kp]
                land_full[hname] = [[round(cx1 + kx*cw), round(cy1 + ky*ch)] for kx, ky in kp]
                col = RCOLOR[hname]
                for a, b in HAND_EDGES:
                    d.line([pts[a], pts[b]], fill=col, width=2)
                for (px, py) in pts:
                    d.ellipse([px-3, py-3, px+3, py+3], fill=(255, 255, 255), outline=col)
            png.save(out / f"demo_{j:02d}_{idx[i]['label_id']}.png")
            results.append({"item": idx[i]["item_id"], "label": idx[i]["label_id"],
                            "regions": sboxes, "hand_present": {HANDS[k]: bool(pres[k]) for k in range(2)},
                            "hand_landmarks_px": land_full})
    (out / "demo_results.json").write_text(json.dumps({"runtime": "scratch region + scratch landmark models only; no MediaPipe at inference",
                                                        "n": len(results), "results": results}, indent=1))
    print(f"rendered {len(results)} end-to-end demo frames -> {out}")
    print("runtime models: detector0-grid-final.pt (region) + detector0-hand-landmarks-softargmax.pt (landmarks); NO mediapipe")
    for r in results[:6]:
        hp = [h for h, v in r["hand_present"].items() if v]
        print(f"  {r['label']:10s} hands_detected={hp}")


if __name__ == "__main__":
    main()
