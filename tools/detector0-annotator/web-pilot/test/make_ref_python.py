#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


HERE = Path(__file__).resolve().parent
ANNOTATOR = HERE.parents[1]
ONNX_DIR = ANNOTATOR / "output" / "onnx"
CACHE = ANNOTATOR / ".cache-eval"
REGION_TARGETS = [
    "left_or_first_hand",
    "right_or_second_hand",
    "head_or_face",
    "upper_body_or_signing_space",
]
HANDS = ["left_or_first_hand", "right_or_second_hand"]
LABELS = [
    "TV", "after", "airplane", "all", "animal", "another", "any", "apple",
    "aunt", "bad", "bed", "before", "bird", "black", "blue", "book", "boy",
    "brother", "brown", "bye", "callonphone", "can", "car", "carrot", "cat",
    "cereal", "chair", "child", "dad", "dog", "drink", "every", "find",
    "fine", "fish", "food", "frog", "girl", "give", "go", "grandma",
    "grandpa", "green", "happy", "hat", "have", "hello", "home", "horse",
    "hot", "hungry", "later", "like", "listen", "look", "mad", "make",
    "man", "milk", "mom", "morning", "night", "no", "not", "now", "open",
    "orange", "pen", "pencil", "person", "please", "read", "red", "room",
    "sad", "say", "see", "shoe", "sick", "table", "talk", "thankyou",
    "think", "thirsty", "time", "tomorrow", "uncle", "water", "where",
    "white", "who", "why", "yellow", "yes", "yesterday",
]
REGION_PX = 96
CROP_PX = 128
GRID = 12
LANDMARK_GRID = 32
KEYPOINTS = 21
HAND_FEAT = 2 + KEYPOINTS * 2 + 1
FEAT = HAND_FEAT * 2
SIGNING_SPACE_INDEX = 3


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


def order_box(box: np.ndarray | list[float]) -> list[float]:
    x1, y1, x2, y2 = [clamp(v) for v in box]
    return [min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)]


def expand_crop(box: list[float]) -> list[float]:
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    return [
        max(0.0, x1 - 0.25 * w),
        max(0.0, y1 - 0.35 * h),
        min(1.0, x2 + 0.25 * w),
        min(1.0, y2 + 0.12 * h),
    ]


def make_xy(frames: np.ndarray) -> np.ndarray:
    x = frames.astype(np.float32) / 255.0
    x = np.transpose(x, (0, 3, 1, 2))
    n, _, h, w = x.shape
    xs = np.linspace(0.0, 1.0, w, dtype=np.float32).reshape(1, 1, 1, w)
    ys = np.linspace(0.0, 1.0, h, dtype=np.float32).reshape(1, 1, h, 1)
    xs = np.broadcast_to(xs, (n, 1, h, w))
    ys = np.broadcast_to(ys, (n, 1, h, w))
    return np.concatenate([x, xs, ys], axis=1).astype(np.float32)


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.maximum(np.sum(e, axis=axis, keepdims=True), 1e-12)


def soft_argmax_heatmaps(hm: np.ndarray, g: int, hand_count: int, keypoints: int) -> np.ndarray:
    b, c, _, _ = hm.shape
    p = softmax(hm.reshape(b, c, -1), axis=-1).reshape(b, c, g, g)
    idx = np.arange(g, dtype=np.float32)
    ex = (p.sum(axis=2) * idx).sum(axis=-1) / g
    ey = (p.sum(axis=3) * idx).sum(axis=-1) / g
    return np.stack([ex, ey], axis=-1).reshape(b, hand_count, keypoints, 2)


def decode_region_boxes(objectness: np.ndarray, boxes: np.ndarray) -> list[dict[str, dict[str, object]]]:
    decoded = []
    for b in range(objectness.shape[0]):
        frame_regions: dict[str, dict[str, object]] = {}
        for t, target in enumerate(REGION_TARGETS):
            flat = objectness[b, t].reshape(-1)
            best = int(np.argmax(flat))
            gy, gx = divmod(best, GRID)
            box = boxes[b, t, :, gy, gx]
            frame_regions[target] = {
                "box": order_box(box),
                "score": float(flat[best]),
                "cell": [int(gx), int(gy)],
            }
        decoded.append(frame_regions)
    return decoded


def hand_feat(hand: dict[str, object] | None) -> list[float]:
    if not hand or not hand.get("landmarks"):
        return [0.0] * HAND_FEAT
    pts = np.asarray(hand["landmarks"], dtype=np.float32)
    wrist = pts[0].copy()
    rel = pts - wrist
    scale = float(np.sqrt((rel ** 2).sum(axis=1)).mean()) + 1e-6
    rel = rel / scale
    return [float(wrist[0]), float(wrist[1])] + rel.reshape(-1).astype(float).tolist() + [float(hand["probability"])]


def frame_feat(hands: list[dict[str, object]]) -> list[float]:
    by_name = {h["name"]: h for h in hands}
    return hand_feat(by_name.get(HANDS[0])) + hand_feat(by_name.get(HANDS[1]))


def top5(probs: np.ndarray) -> list[dict[str, object]]:
    order = np.argsort(-probs)[:5]
    return [{"index": int(i), "label": LABELS[int(i)], "probability": float(probs[int(i)])} for i in order]


def read_rgb(path: Path) -> np.ndarray:
    bgr = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(path)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def make_session(name: str) -> ort.InferenceSession:
    return ort.InferenceSession(str(ONNX_DIR / name), providers=["CPUExecutionProvider"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=HERE / "frames_manifest.json")
    ap.add_argument("--out", type=Path, default=HERE / "ref_python.json")
    ap.add_argument("--sequence-length", type=int, default=16)
    args = ap.parse_args()

    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    cv2.setNumThreads(1)
    manifest = json.loads(args.manifest.read_text())
    items = manifest["items"]
    cache_frames96 = np.load(CACHE / "frames96.npy")

    region = make_session("detector0-grid-big2.onnx")
    landmark = make_session("detector0-hand-landmarks-merged-w64.onnx")
    recognizer = make_session("recognizer-v4-w64.onnx")

    region_frames = []
    for item in items:
        if "cache_eval_index" in item:
            region_frames.append(cache_frames96[int(item["cache_eval_index"])])
        else:
            rgb = read_rgb(HERE / item["png"])
            region_frames.append(cv2.resize(rgb, (REGION_PX, REGION_PX), interpolation=cv2.INTER_AREA))
    region_frames_np = np.stack(region_frames).astype(np.uint8)
    obj, boxes = region.run(None, {"frames_xy": make_xy(region_frames_np)})
    regions_by_frame = decode_region_boxes(obj, boxes)

    results = []
    for item, regions in zip(items, regions_by_frame):
        rgb = read_rgb(HERE / item["png"])
        h0, w0 = rgb.shape[:2]
        signing_box = regions["upper_body_or_signing_space"]["box"]
        crop_box = expand_crop(signing_box)
        x1 = int(crop_box[0] * w0)
        y1 = int(crop_box[1] * h0)
        x2 = int(crop_box[2] * w0)
        y2 = int(crop_box[3] * h0)
        sub = rgb[max(0, y1):max(y1 + 1, y2), max(0, x1):max(x1 + 1, x2)]
        crop = cv2.resize(sub, (CROP_PX, CROP_PX), interpolation=cv2.INTER_AREA)
        presence_logits, heatmaps = landmark.run(None, {"crops_xy": make_xy(crop[None])})
        coords = soft_argmax_heatmaps(heatmaps, LANDMARK_GRID, len(HANDS), KEYPOINTS)[0]
        presence = sigmoid(presence_logits[0])
        hands = []
        for hi, name in enumerate(HANDS):
            hands.append({
                "name": name,
                "landmarks": coords[hi].astype(float).tolist(),
                "probability": float(presence[hi]),
                "present": bool(presence[hi] > 0.5),
            })
        feature = frame_feat(hands)
        seq = np.tile(np.asarray(feature, dtype=np.float32), (args.sequence_length, 1))[None, :, :]
        lengths = np.asarray([args.sequence_length], dtype=np.int64)
        logits = recognizer.run(None, {"sequence": seq, "lengths": lengths})[0][0]
        probs = softmax(logits)
        results.append({
            "item_id": item["item_id"],
            "label_id": item["label_id"],
            "png": item["png"],
            "image_size": [int(w0), int(h0)],
            "regions": regions,
            "signing_space_box": signing_box,
            "crop_box": crop_box,
            "hands": hands,
            "feature": feature,
            "probs": probs.astype(float).tolist(),
            "top5": top5(probs),
        })

    payload = {
        "schema_version": "asl-pilot-web-pilot-parity/v1",
        "runtime": "python-onnxruntime-cpu",
        "models": [p.name for p in sorted(ONNX_DIR.glob("*.onnx"))],
        "region_preprocess": "fixed .cache-eval/frames96.npy when cache index is present; otherwise cv2.INTER_AREA",
        "crop_preprocess": "cv2.INTER_AREA after int-normalized signing-space crop",
        "sequence_length": args.sequence_length,
        "labels": LABELS,
        "frames": results,
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote Python reference for {len(results)} frames -> {args.out}")


if __name__ == "__main__":
    main()
