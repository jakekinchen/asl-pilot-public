#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np


HERE = Path(__file__).resolve().parent


def arr(x: Any) -> np.ndarray:
    return np.asarray(x, dtype=np.float64)


def max_abs(a: Any, b: Any) -> float:
    delta = np.abs(arr(a) - arr(b))
    return float(delta.max(initial=0.0))


def hand_landmark_diff(ref_frame: dict[str, Any], js_frame: dict[str, Any]) -> float:
    ref = {h["name"]: h["landmarks"] for h in ref_frame["hands"]}
    js = {h["name"]: h["landmarks"] for h in js_frame["hands"]}
    return max(max_abs(ref[name], js[name]) for name in ref)


def compare_pair(ref: dict[str, Any], js: dict[str, Any], label: str) -> dict[str, Any]:
    labels = ref["labels"]
    rows = []
    landmark_max = 0.0
    feature_max = 0.0
    prob_max = 0.0
    signing_box_max = 0.0
    crop_box_max = 0.0
    top1_matches = 0
    top5_set_matches = 0
    top5_order_matches = 0
    for rf, jf in zip(ref["frames"], js["frames"]):
      if rf["item_id"] != jf["item_id"]:
          raise SystemExit(f"frame mismatch: {rf['item_id']} != {jf['item_id']}")
      lmd = hand_landmark_diff(rf, jf)
      fd = max_abs(rf["feature"], jf["feature"])
      pd = max_abs(rf["probs"], jf["probs"])
      sd = max_abs(rf["signing_space_box"], jf["signing_space_box"])
      cd = max_abs(rf["crop_box"], jf["crop_box"])
      rtop = [int(x["index"]) for x in rf["top5"]]
      jtop = [int(x["index"]) for x in jf["top5"]]
      top1_match = rtop[0] == jtop[0]
      top5_set_match = set(rtop) == set(jtop)
      top5_order_match = rtop == jtop
      top1_matches += int(top1_match)
      top5_set_matches += int(top5_set_match)
      top5_order_matches += int(top5_order_match)
      landmark_max = max(landmark_max, lmd)
      feature_max = max(feature_max, fd)
      prob_max = max(prob_max, pd)
      signing_box_max = max(signing_box_max, sd)
      crop_box_max = max(crop_box_max, cd)
      rows.append({
          "item_id": rf["item_id"],
          "label_id": rf["label_id"],
          "landmark_max_abs_diff": lmd,
          "feature_max_abs_diff": fd,
          "prob_max_abs_diff": pd,
          "signing_space_box_max_abs_diff": sd,
          "crop_box_max_abs_diff": cd,
          "python_top1": labels[rtop[0]],
          "js_top1": labels[jtop[0]],
          "python_top5": [labels[i] for i in rtop],
          "js_top5": [labels[i] for i in jtop],
          "top1_match": top1_match,
          "top5_set_match": top5_set_match,
          "top5_order_match": top5_order_match,
      })
    n = max(1, len(rows))
    return {
        "label": label,
        "runtime": js.get("runtime"),
        "resize_mode": js.get("resize_mode"),
        "sequence_length": js.get("sequence_length"),
        "frames": len(rows),
        "max_abs": {
            "signing_space_box": signing_box_max,
            "crop_box": crop_box_max,
            "landmarks": landmark_max,
            "feature": feature_max,
            "recognizer_probs": prob_max,
        },
        "agreement": {
            "top1": top1_matches / n,
            "top5_set": top5_set_matches / n,
            "top5_order": top5_order_matches / n,
            "top1_matches": top1_matches,
            "top5_set_matches": top5_set_matches,
            "top5_order_matches": top5_order_matches,
        },
        "per_frame": rows,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", type=Path, default=HERE / "ref_python.json")
    ap.add_argument("--js", type=Path, default=HERE / "out_js.json")
    ap.add_argument("--extra-js", type=Path, action="append", default=[])
    ap.add_argument("--out", type=Path, default=HERE / "parity_summary.json")
    args = ap.parse_args()

    ref = json.loads(args.ref.read_text())
    reports = []
    primary = json.loads(args.js.read_text())
    reports.append(compare_pair(ref, primary, "primary"))
    for p in args.extra_js:
        reports.append(compare_pair(ref, json.loads(p.read_text()), p.stem))

    payload = {
        "schema_version": "asl-pilot-web-pilot-parity-summary/v1",
        "reference": str(args.ref),
        "reports": reports,
    }
    args.out.write_text(json.dumps(payload, indent=2) + "\n")
    for report in reports:
        m = report["max_abs"]
        a = report["agreement"]
        print(
            f"{report['label']} resize={report.get('resize_mode')} "
            f"landmark={m['landmarks']:.6g} feature={m['feature']:.6g} "
            f"prob={m['recognizer_probs']:.6g} top1={a['top1_matches']}/{report['frames']} "
            f"top5set={a['top5_set_matches']}/{report['frames']} top5order={a['top5_order_matches']}/{report['frames']}"
        )
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
