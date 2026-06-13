#!/usr/bin/env python3
"""Prepare a local, ignored Detector 0 manual annotation cache.

This tool renders retained ``full_frame_reference`` tensor frames into PNGs and
writes a local index for the static workbench. It does not create authoritative
labels, import media, run inference, or call a network API.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TOOL_ROOT = Path(__file__).resolve().parent
DEFAULT_CACHE_DIR = TOOL_ROOT / ".cache"
ANNOTATION_PACKET = (
    PROJECT_ROOT
    / "data"
    / "annotations"
    / "detector0"
    / "return-to-form-tier0-localization-packet-v0.json"
)
MANIFEST_DIR = PROJECT_ROOT / "data" / "manifests" / "return-to-form-tier0"
SOURCE_REGISTER = PROJECT_ROOT / "docs" / "model" / "dataset-source-register.json"
SCHEMA_VERSION = "asl-pilot-detector0-annotation-workbench-index/v1"
FRAME_SCHEMA_VERSION = "asl-pilot-detector0-annotation-workbench-frame/v1"
FULL_FRAME_REGION_ID = "full_frame_reference"
COORDINATE_SPACE = "normalized_full_frame_top_left_xyxy"


class PrepareError(RuntimeError):
    """Raised when the local cache cannot be prepared safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--include-existing-only",
        action="store_true",
        help="Render only reviewed rows that already have V0 target annotations.",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=None,
        help="Optional cap on rendered frames for smoke checks.",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=DEFAULT_CACHE_DIR,
        help="Local ignored cache directory.",
    )
    return parser.parse_args()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def tool_relative(path: Path) -> str:
    return path.resolve().relative_to(TOOL_ROOT).as_posix()


def resolve_project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PrepareError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise PrepareError(f"{context} missing: {path}")
    return resolved


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def tensor_path_from_row(row: dict[str, Any]) -> Path:
    raw_path = row.get("frame_tensor_path")
    if not isinstance(raw_path, str) or not raw_path:
        raise PrepareError(f"{row.get('row_id')} is missing frame_tensor_path")
    packet_dir = ANNOTATION_PACKET.parent
    resolved = (packet_dir / raw_path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PrepareError(f"{row.get('row_id')} tensor path escapes project root: {raw_path}") from error
    if not resolved.exists():
        raise PrepareError(f"{row.get('row_id')} tensor path missing: {project_relative(resolved)}")
    return resolved


def load_torch_payload(path: Path) -> dict[str, Any]:
    try:
        payload = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        payload = torch.load(path, map_location="cpu")
    if not isinstance(payload, dict):
        raise PrepareError(f"tensor payload is not a dict: {project_relative(path)}")
    return payload


def full_frame_from_tensor(path: Path, frame_index: int) -> tuple[np.ndarray, dict[str, Any]]:
    payload = load_torch_payload(path)
    region_ids = payload.get("region_ids")
    if not isinstance(region_ids, list) or FULL_FRAME_REGION_ID not in region_ids:
        raise PrepareError(f"{FULL_FRAME_REGION_ID} missing from {project_relative(path)}")
    region_index = region_ids.index(FULL_FRAME_REGION_ID)
    regions = payload.get("rgb_regions")
    if not torch.is_tensor(regions):
        raise PrepareError(f"rgb_regions tensor missing from {project_relative(path)}")
    if regions.ndim != 5:
        raise PrepareError(f"rgb_regions expected T,R,H,W,C, got {tuple(regions.shape)}")
    if frame_index < 0 or frame_index >= int(regions.shape[0]):
        raise PrepareError(
            f"frame_index {frame_index} outside tensor frame count {int(regions.shape[0])} for {project_relative(path)}"
        )
    frame = regions[frame_index, region_index].detach().cpu()
    if frame.shape[-1] != 3:
        raise PrepareError(f"full-frame reference is not RGB for {project_relative(path)}")
    if frame.dtype != torch.uint8:
        frame = frame.clamp(0, 255).to(torch.uint8)
    array = frame.numpy()
    tensor_info = {
        "schema_version": payload.get("schema_version"),
        "region_axis": payload.get("region_axis"),
        "region_ids": region_ids,
        "full_frame_region_axis_index": region_index,
        "rgb_regions_shape": list(regions.shape),
        "rgb_regions_dtype": str(regions.dtype).replace("torch.", ""),
    }
    return array, tensor_info


def load_manifest_index() -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for split in ("train", "validation", "test"):
        manifest_path = MANIFEST_DIR / f"{split}.json"
        manifest = load_json(manifest_path)
        for clip in manifest.get("clips", []):
            clip_id = clip.get("clip_id")
            if isinstance(clip_id, str):
                index[clip_id] = clip
    return index


def target_summary(targets: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for target_id, payload in targets.items():
        if not isinstance(payload, dict):
            continue
        summary[target_id] = {
            "presence": bool(payload.get("presence")),
            "box_xyxy_norm": payload.get("box_xyxy_norm"),
            "center_xy_norm": payload.get("center_xy_norm"),
            "visibility_confidence": payload.get("visibility_confidence"),
            "occlusion_flag": payload.get("occlusion_flag"),
            "truncation_flag": payload.get("truncation_flag"),
            "coordinate_space": payload.get("coordinate_space", COORDINATE_SPACE),
            "target_applicability": payload.get("target_applicability"),
            "diagnostic_only": bool(payload.get("diagnostic_only", False)),
        }
    return summary


def candidate_rows(include_existing_only: bool) -> list[dict[str, Any]]:
    packet = load_json(ANNOTATION_PACKET)
    rows = packet.get("frame_rows")
    if not isinstance(rows, list):
        raise PrepareError(f"frame_rows missing from {project_relative(ANNOTATION_PACKET)}")
    if include_existing_only:
        rows = [
            row
            for row in rows
            if isinstance(row.get("targets"), dict)
            and any(bool(target.get("presence")) for target in row["targets"].values() if isinstance(target, dict))
        ]
    return sorted(
        rows,
        key=lambda row: (
            str(row.get("split", "")),
            str(row.get("label_id", "")),
            str(row.get("clip_id", "")),
            int(row.get("frame_index", -1)),
            str(row.get("row_id", "")),
        ),
    )


def prepare_cache(args: argparse.Namespace) -> dict[str, Any]:
    if args.max_frames is not None and args.max_frames <= 0:
        raise PrepareError("--max-frames must be positive when provided")
    cache_dir = resolve_project_path(args.cache_dir, "--cache-dir", must_exist=False)
    image_dir = cache_dir / "images"
    image_dir.mkdir(parents=True, exist_ok=True)

    manifest_index = load_manifest_index()
    rows = candidate_rows(include_existing_only=args.include_existing_only)
    if args.max_frames is not None:
        rows = rows[: args.max_frames]
    if not rows:
        raise PrepareError("no candidate rows matched the requested filters")

    frames: list[dict[str, Any]] = []
    for row in rows:
        row_id = str(row.get("row_id"))
        frame_index = int(row.get("frame_index"))
        tensor_path = tensor_path_from_row(row)
        frame_array, tensor_info = full_frame_from_tensor(tensor_path, frame_index)
        image_path = image_dir / f"{row_id}.png"
        Image.fromarray(frame_array, mode="RGB").save(image_path)
        manifest_clip = manifest_index.get(str(row.get("clip_id")), {})
        frames.append(
            {
                "schema_version": FRAME_SCHEMA_VERSION,
                "row_id": row_id,
                "split": row.get("split"),
                "label_id": row.get("label_id"),
                "clip_id": row.get("clip_id"),
                "frame_index": frame_index,
                "timestamp_sec": row.get("timestamp_sec"),
                "source_id": row.get("source_id"),
                "source_split": row.get("source_split"),
                "source_record_id": row.get("source_record_id"),
                "signer_identity_hash": row.get("signer_identity_hash"),
                "tensor_path": project_relative(tensor_path),
                "tensor_file_sha256": sha256_file(tensor_path),
                "packet_frame_tensor_sha256": row.get("frame_tensor_sha256"),
                "packet_tensor_digest_sha256": row.get("tensor_digest_sha256"),
                "tensor_info": tensor_info,
                "image_path": tool_relative(image_path),
                "image_sha256": sha256_file(image_path),
                "image_width_px": int(frame_array.shape[1]),
                "image_height_px": int(frame_array.shape[0]),
                "coordinate_space": COORDINATE_SPACE,
                "existing_v0_targets": target_summary(row.get("targets", {})),
                "existing_v0_row": {
                    "annotation_source": row.get("annotation_source"),
                    "label_source": row.get("label_source"),
                    "review_status": row.get("review_status"),
                    "reviewer": row.get("reviewer"),
                    "reviewed_at": row.get("reviewed_at"),
                    "notes": row.get("notes"),
                },
                "manifest_clip": {
                    "allowed_for_model_training": manifest_clip.get("allowed_for_model_training"),
                    "source_license_decision": manifest_clip.get("source_license_decision"),
                    "source_license_review_status": manifest_clip.get("source_license_review_status"),
                    "crop_config": manifest_clip.get("crop_config"),
                },
            }
        )

    index = {
        "schema_version": SCHEMA_VERSION,
        "created_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "purpose": "local manual Detector 0 box-review workbench cache",
        "status": "draft_cache_only_not_authoritative_labels",
        "source_artifacts": {
            "annotation_packet": {
                "path": project_relative(ANNOTATION_PACKET),
                "sha256": sha256_file(ANNOTATION_PACKET),
            },
            "source_register": {
                "path": project_relative(SOURCE_REGISTER),
                "sha256": sha256_file(SOURCE_REGISTER),
            },
            "manifests": [
                {
                    "split": split,
                    "path": project_relative(MANIFEST_DIR / f"{split}.json"),
                    "sha256": sha256_file(MANIFEST_DIR / f"{split}.json"),
                }
                for split in ("train", "validation", "test")
            ],
        },
        "boundaries": {
            "uses_tracked_tensors_only": True,
            "imports_source_media": False,
            "uploads_raw_learner_video": False,
            "runs_inference_or_auto_labels": False,
            "uses_pretrained_or_generated_labels": False,
            "writes_authoritative_label_artifacts": False,
            "coordinate_space": COORDINATE_SPACE,
        },
        "cache": {
            "cache_dir": tool_relative(cache_dir),
            "image_dir": tool_relative(image_dir),
            "index_path": tool_relative(cache_dir / "index.json"),
            "ignored_by": "tools/detector0-annotator/.gitignore",
        },
        "selection": {
            "include_existing_only": bool(args.include_existing_only),
            "max_frames": args.max_frames,
            "rendered_frame_count": len(frames),
        },
        "frames": frames,
    }
    write_json(cache_dir / "index.json", index)
    return index


def main() -> int:
    args = parse_args()
    try:
        index = prepare_cache(args)
    except PrepareError as error:
        print(f"prepare.py: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "status": "prepared",
                "index_path": index["cache"]["index_path"],
                "rendered_frame_count": index["selection"]["rendered_frame_count"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
