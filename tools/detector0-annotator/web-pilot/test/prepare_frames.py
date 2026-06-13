#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path


HERE = Path(__file__).resolve().parent
ANNOTATOR = HERE.parents[1]
CACHE = ANNOTATOR / ".cache-eval"


def main() -> None:
    index = json.loads((CACHE / "index.json").read_text())["items"]
    frames_dir = HERE / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    selected = []
    for cache_index, item in enumerate(index):
        left = bool(item["existing_targets"]["left_or_first_hand"]["presence"])
        right = bool(item["existing_targets"]["right_or_second_hand"]["presence"])
        if not (left or right):
            continue
        selected.append((cache_index, item))
        if len(selected) == 5:
            break

    if len(selected) < 5:
        raise SystemExit(f"expected at least 5 hand-present frames, found {len(selected)}")

    manifest_items = []
    for out_index, (cache_index, item) in enumerate(selected):
        label = item["label_id"].replace("/", "_")
        out_name = f"{out_index:02d}_{label}.png"
        src = CACHE / "frames" / item["png"]
        dst = frames_dir / out_name
        shutil.copyfile(src, dst)
        manifest_items.append({
            "index": out_index,
            "cache_eval_index": cache_index,
            "item_id": item["item_id"],
            "clip_id": item["clip_id"],
            "label_id": item["label_id"],
            "frame_index": item["frame_index"],
            "png": f"frames/{out_name}",
            "source_png": str(src.relative_to(ANNOTATOR)),
            "hand_presence_source": {
                "left_or_first_hand": left,
                "right_or_second_hand": right,
            },
        })

    payload = {
        "schema_version": "asl-pilot-web-pilot-fixed-frames/v1",
        "source": str(CACHE.relative_to(ANNOTATOR)),
        "items": manifest_items,
    }
    (HERE / "frames_manifest.json").write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {len(manifest_items)} fixed frames -> {frames_dir}")


if __name__ == "__main__":
    main()
