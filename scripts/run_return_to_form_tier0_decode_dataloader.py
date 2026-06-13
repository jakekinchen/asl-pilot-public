#!/usr/bin/env python3
"""Generate and verify the M3AD Tier 0 fixed-crop data proof."""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from rawframe_decode_provenance import (
    ensure_ffmpeg,
    ffmpeg_filter,
    ffmpeg_version,
    run_ffmpeg_decode,
    sha256_bytes,
    tensor_from_raw_rgb,
)
from train_rawframe_model import ManifestError, validate_manifest


ROOT = Path(__file__).resolve().parents[1]
SELECTED_LABELS = ["please", "table", "dad", "grandpa", "hat"]
SOURCE_ID = "popsign-v1-original-videos"
SOURCE_REGISTER_PATH = Path("docs/model/dataset-source-register.json")
CROP_CONFIG_PATH = Path("docs/model/return-to-form-fixed-crop-config.json")
SOURCE_COVERAGE_PATH = Path("docs/research/return-to-form-tier0-source-coverage.json")
GATES_PATH = Path("docs/validation/return-to-form-tier0-gates.json")
OUTPUT_MANIFEST_DIR = Path("data/manifests/return-to-form-tier0")
OUTPUT_TENSOR_ROOT = Path("data/tensors/return-to-form-tier0")
OUTPUT_RECEIPT_PATH = Path("docs/validation/return-to-form-tier0-decode-dataloader.json")
SEED_MANIFESTS = {
    "train": Path("data/manifests/diagnostics/popsign-label-ladder/005-labels/train.json"),
    "validation": Path("data/manifests/diagnostics/popsign-label-ladder/005-labels/validation.json"),
    "test": Path("data/manifests/diagnostics/popsign-label-ladder/005-labels/test.json"),
}
TENSOR_SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-fixed-crop-tensor/v1"
PROVENANCE_SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-fixed-crop-provenance/v1"
RECEIPT_SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-decode-dataloader/v1"
MANIFEST_DATASET_ID = "asl-pilot-return-to-form-tier0-v0"


class Tier0ProofError(RuntimeError):
    """Raised when the Tier 0 decode/dataloader proof cannot be produced."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Regenerate ignored manifests/tensors and write the tracked receipt.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Batch size for the dataloader smoke.",
    )
    parser.add_argument(
        "--receipt",
        type=Path,
        default=OUTPUT_RECEIPT_PATH,
        help=f"Receipt path. Default: {OUTPUT_RECEIPT_PATH}",
    )
    return parser.parse_args()


def project_path(relative: Path) -> Path:
    resolved = (ROOT / relative).resolve()
    try:
        resolved.relative_to(ROOT)
    except ValueError as error:
        raise Tier0ProofError(f"path escapes project root: {relative}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def manifest_relative(manifest_path: Path, target_path: Path) -> str:
    return Path(os.path.relpath(target_path.resolve(), manifest_path.resolve().parent)).as_posix()


def resolve_manifest_relative(manifest_path: Path, value: str) -> Path:
    candidate = Path(value)
    if candidate.is_absolute():
        raise Tier0ProofError(f"{manifest_path}: manifest-relative path must not be absolute: {value}")
    resolved = (manifest_path.parent / candidate).resolve()
    try:
        resolved.relative_to(ROOT)
    except ValueError as error:
        raise Tier0ProofError(f"{manifest_path}: path escapes project root: {value}") from error
    return resolved


def read_json(relative: Path) -> dict[str, Any]:
    path = project_path(relative)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise Tier0ProofError(f"{relative} is not valid JSON: {error}") from error
    if not isinstance(data, dict):
        raise Tier0ProofError(f"{relative} must be a JSON object")
    return data


def write_json(relative: Path, value: dict[str, Any]) -> None:
    path = project_path(relative)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_file(relative_or_absolute: Path) -> str:
    path = relative_or_absolute if relative_or_absolute.is_absolute() else project_path(relative_or_absolute)
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def import_torch() -> Any:
    try:
        import torch  # type: ignore[import-not-found]
    except ImportError as error:
        raise Tier0ProofError("PyTorch is required for the M3AD dataloader proof") from error
    return torch


def load_tensor_payload(torch: Any, path: Path) -> dict[str, Any]:
    try:
        payload = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        payload = torch.load(path, map_location="cpu")
    if not isinstance(payload, dict):
        raise Tier0ProofError(f"tensor payload must be a dict: {project_relative(path)}")
    return payload


def tensor_digest(torch: Any, tensor: Any, layout: str) -> dict[str, Any]:
    if not torch.is_tensor(tensor):
        raise Tier0ProofError("tensor digest input is not a tensor")
    contiguous = tensor.detach().cpu().contiguous()
    return {
        "dtype": str(contiguous.dtype).replace("torch.", ""),
        "layout": layout,
        "shape": list(contiguous.shape),
        "sha256": sha256_bytes(contiguous.numpy().tobytes()),
    }


def crop_regions(torch: Any, frames: Any, crop_config: dict[str, Any]) -> tuple[Any, list[dict[str, Any]]]:
    contract = crop_config.get("expected_tensor_contract")
    if not isinstance(contract, dict):
        raise Tier0ProofError("crop config is missing expected_tensor_contract")
    region_ids = [
        *contract.get("per_clip_regions", []),
        *contract.get("audit_reference_regions", []),
    ]
    regions_by_id = {
        str(region.get("region_id")): region
        for region in crop_config.get("regions", [])
        if isinstance(region, dict)
    }
    if not region_ids or any(region_id not in regions_by_id for region_id in region_ids):
        raise Tier0ProofError("crop config tensor contract references unknown regions")

    height = int(frames.shape[1])
    width = int(frames.shape[2])
    tensors = []
    metadata = []
    for axis, region_id in enumerate(region_ids):
        region = regions_by_id[region_id]
        xyxy = region.get("xyxy")
        output_size = region.get("output_size_px")
        if (
            not isinstance(xyxy, list)
            or len(xyxy) != 4
            or not isinstance(output_size, list)
            or len(output_size) != 2
        ):
            raise Tier0ProofError(f"invalid crop region config: {region_id}")
        x1 = max(0, min(width - 1, int(float(xyxy[0]) * width)))
        y1 = max(0, min(height - 1, int(float(xyxy[1]) * height)))
        x2 = max(x1 + 1, min(width, int(round(float(xyxy[2]) * width))))
        y2 = max(y1 + 1, min(height, int(round(float(xyxy[3]) * height))))
        output_width = int(output_size[0])
        output_height = int(output_size[1])
        crop = frames[:, y1:y2, x1:x2, :].permute(0, 3, 1, 2).to(dtype=torch.float32)
        resized = torch.nn.functional.interpolate(
            crop,
            size=(output_height, output_width),
            mode="bilinear",
            align_corners=False,
        )
        tensor = resized.round().clamp(0, 255).to(dtype=torch.uint8).permute(0, 2, 3, 1)
        tensors.append(tensor.contiguous())
        metadata.append(
            {
                "region_id": region_id,
                "semantic_role": region.get("semantic_role"),
                "xyxy": xyxy,
                "output_size_px": output_size,
                "tensor_axis": axis,
            }
        )
    return torch.stack(tensors, dim=1).contiguous(), metadata


def build_tensor_payload(
    torch: Any,
    regions_tensor: Any,
    crop_config_reference: dict[str, str],
    region_metadata: list[dict[str, Any]],
) -> dict[str, Any]:
    region_ids = [item["region_id"] for item in region_metadata]
    compat_region = "upper_body_signing_space"
    compat_index = region_ids.index(compat_region)
    return {
        "schema_version": TENSOR_SCHEMA_VERSION,
        "crop_config": crop_config_reference,
        "region_ids": region_ids,
        "region_axis": "T,R,H,W,C",
        "rgb_regions": regions_tensor,
        "rgb_frames_region_id": compat_region,
        "rgb_frames": regions_tensor[:, compat_index, :, :, :].contiguous(),
    }


def write_tensor(torch: Any, tensor_path: Path, payload: dict[str, Any]) -> str:
    tensor_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, tensor_path)
    return sha256_file(tensor_path)


def build_provenance(
    torch: Any,
    ffmpeg: str,
    manifest_path: Path,
    clip: dict[str, Any],
    raw_rgb: bytes,
    regions_tensor: Any,
    crop_config_reference: dict[str, str],
    region_metadata: list[dict[str, Any]],
    crop_config: dict[str, Any],
) -> dict[str, Any]:
    relative_video_path = str(clip["relative_video_path"])
    video_path = resolve_manifest_relative(manifest_path, relative_video_path)
    frame_count = int(crop_config["frame_sampling_assumption"]["temporal_sample_count"])
    image_size = int(crop_config["frame_sampling_assumption"]["pre_crop_square_frame_px"])
    decode_fps = float(crop_config["frame_sampling_assumption"]["decode_fps"])
    return {
        "schema_version": PROVENANCE_SCHEMA_VERSION,
        "source_video": {
            "relative_video_path": relative_video_path,
            "path": project_relative(video_path),
            "sha256": sha256_file(video_path),
        },
        "decode": {
            **ffmpeg_filter(frame_count, image_size, decode_fps),
            "pre_crop_square_frame_px": image_size,
        },
        "crop_config": {
            **crop_config_reference,
            "region_ids": [item["region_id"] for item in region_metadata],
            "region_axis": "T,R,H,W,C",
        },
        "ffmpeg": {
            "path": str(Path(ffmpeg).resolve()),
            "sha256": sha256_file(Path(ffmpeg).resolve()),
            "version": ffmpeg_version(ffmpeg),
        },
        "decoded_raw_rgb": {
            "bytes": len(raw_rgb),
            "sha256": sha256_bytes(raw_rgb),
        },
        "tensor_digest": tensor_digest(torch, regions_tensor, "T,R,H,W,C"),
    }


def labels_for_manifest(manifest: dict[str, Any]) -> list[str]:
    return [str(item.get("label_id")) for item in manifest.get("labels", [])]


def build_manifest_for_split(
    torch: Any,
    ffmpeg: str,
    split: str,
    generated_at: str,
    crop_config: dict[str, Any],
    references: dict[str, dict[str, str]],
) -> dict[str, Any]:
    source_relative = SEED_MANIFESTS[split]
    source_path = project_path(source_relative)
    output_relative = OUTPUT_MANIFEST_DIR / f"{split}.json"
    output_path = project_path(output_relative)
    tensor_root = project_path(OUTPUT_TENSOR_ROOT / split)
    source_manifest = read_json(source_relative)
    if labels_for_manifest(source_manifest) != SELECTED_LABELS:
        raise Tier0ProofError(f"{source_relative} labels do not match selected Tier 0 labels")

    manifest = copy.deepcopy(source_manifest)
    manifest["dataset_id"] = MANIFEST_DATASET_ID
    manifest["created_at"] = generated_at
    manifest["source_register"] = references["source_register"]
    manifest["return_to_form_tier0"] = {
        "schema_version": "asl-pilot-return-to-form-tier0-manifest-binding/v1",
        "mission": "M3AD",
        "status": "decode_dataloader_proof",
        "selected_labels": SELECTED_LABELS,
        "source_id": SOURCE_ID,
        "source_register": references["source_register"],
        "source_coverage": references["source_coverage"],
        "crop_config": references["crop_config"],
        "pre_training_gates": references["pre_training_gates"],
        "seed_manifest": {
            "path": project_relative(source_path),
            "sha256": sha256_file(source_path),
        },
    }
    manifest["crop_config"] = {
        **references["crop_config"],
        "region_axis": "T,R,H,W,C",
    }
    manifest["preprocessing"] = {
        **manifest.get("preprocessing", {}),
        "allowed_steps": [
            "decode_video",
            "sample_frames",
            "resize",
            "center_crop",
            "fixed_region_crop",
            "hash_tensor",
        ],
    }

    updated_clips = []
    frame_count = int(crop_config["frame_sampling_assumption"]["temporal_sample_count"])
    image_size = int(crop_config["frame_sampling_assumption"]["pre_crop_square_frame_px"])
    decode_fps = float(crop_config["frame_sampling_assumption"]["decode_fps"])
    for index, source_clip in enumerate(source_manifest["clips"]):
        if source_clip.get("label_id") not in SELECTED_LABELS:
            raise Tier0ProofError(f"{source_relative}: unexpected label in clips[{index}]")
        source_video = resolve_manifest_relative(source_path, str(source_clip["relative_video_path"]))
        clip = copy.deepcopy(source_clip)
        clip["relative_video_path"] = manifest_relative(output_path, source_video)
        tensor_path = tensor_root / f"{clip['clip_id']}-regions.pt"
        raw_rgb = run_ffmpeg_decode(ffmpeg, source_video, frame_count, image_size, decode_fps)
        frames = tensor_from_raw_rgb(torch, raw_rgb, frame_count, image_size, f"{split}:{clip['clip_id']}")
        regions_tensor, region_metadata = crop_regions(torch, frames, crop_config)
        payload = build_tensor_payload(torch, regions_tensor, references["crop_config"], region_metadata)
        clip["relative_frame_tensor_path"] = manifest_relative(output_path, tensor_path)
        clip["frame_tensor_sha256"] = write_tensor(torch, tensor_path, payload)
        clip["frame_tensor_provenance"] = build_provenance(
            torch,
            ffmpeg,
            output_path,
            clip,
            raw_rgb,
            regions_tensor,
            references["crop_config"],
            region_metadata,
            crop_config,
        )
        clip["crop_regions"] = region_metadata
        clip["crop_config"] = references["crop_config"]
        updated_clips.append(clip)

    manifest["clips"] = updated_clips
    write_json(output_relative, manifest)
    return manifest


class RegionDataset:
    def __init__(self, torch: Any, manifest_relative_path: Path, label_to_index: dict[str, int]) -> None:
        self.torch = torch
        self.manifest_path = project_path(manifest_relative_path)
        self.manifest = read_json(manifest_relative_path)
        self.clips = self.manifest["clips"]
        self.label_to_index = label_to_index

    def __len__(self) -> int:
        return len(self.clips)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        clip = self.clips[index]
        tensor_path = resolve_manifest_relative(self.manifest_path, clip["relative_frame_tensor_path"])
        payload = load_tensor_payload(self.torch, tensor_path)
        regions = payload.get("rgb_regions")
        if not self.torch.is_tensor(regions):
            raise Tier0ProofError(f"rgb_regions tensor missing: {project_relative(tensor_path)}")
        label = self.torch.tensor(self.label_to_index[clip["label_id"]], dtype=self.torch.long)
        return regions, label


def summarize_manifest(
    torch: Any,
    split: str,
    references: dict[str, dict[str, str]],
    batch_size: int,
) -> dict[str, Any]:
    manifest_relative_path = OUTPUT_MANIFEST_DIR / f"{split}.json"
    manifest_path = project_path(manifest_relative_path)
    try:
        validate_manifest(
            manifest_path,
            split,
            check_files=True,
            allow_small_label_set=True,
        )
    except ManifestError as error:
        raise Tier0ProofError(str(error)) from error

    manifest = read_json(manifest_relative_path)
    if labels_for_manifest(manifest) != SELECTED_LABELS:
        raise Tier0ProofError(f"{manifest_relative_path}: labels do not match selected Tier 0 labels")
    binding = manifest.get("return_to_form_tier0")
    if not isinstance(binding, dict):
        raise Tier0ProofError(f"{manifest_relative_path}: missing return_to_form_tier0 binding")
    for key, expected in references.items():
        if binding.get(key) != expected:
            raise Tier0ProofError(f"{manifest_relative_path}: {key} binding mismatch")
    if manifest.get("crop_config", {}).get("sha256") != references["crop_config"]["sha256"]:
        raise Tier0ProofError(f"{manifest_relative_path}: crop_config hash mismatch")

    label_counts = Counter()
    source_ids = set()
    tensor_shapes = Counter()
    region_ids_seen: set[tuple[str, ...]] = set()
    missing_file_count = 0
    for index, clip in enumerate(manifest["clips"]):
        context = f"{manifest_relative_path}: clips[{index}]"
        if clip.get("source_id") != SOURCE_ID:
            raise Tier0ProofError(f"{context}: source_id must be {SOURCE_ID}")
        if clip.get("crop_config") != references["crop_config"]:
            raise Tier0ProofError(f"{context}: crop_config binding mismatch")
        if not isinstance(clip.get("crop_regions"), list) or not clip["crop_regions"]:
            raise Tier0ProofError(f"{context}: crop_regions missing")
        tensor_relative = clip.get("relative_frame_tensor_path")
        if not isinstance(tensor_relative, str) or not tensor_relative:
            raise Tier0ProofError(f"{context}: relative_frame_tensor_path missing")
        tensor_path = resolve_manifest_relative(manifest_path, tensor_relative)
        if not tensor_path.exists():
            missing_file_count += 1
            continue
        if sha256_file(tensor_path) != clip.get("frame_tensor_sha256"):
            raise Tier0ProofError(f"{context}: frame_tensor_sha256 mismatch")
        payload = load_tensor_payload(torch, tensor_path)
        if payload.get("schema_version") != TENSOR_SCHEMA_VERSION:
            raise Tier0ProofError(f"{context}: tensor schema mismatch")
        if payload.get("crop_config") != references["crop_config"]:
            raise Tier0ProofError(f"{context}: tensor crop_config mismatch")
        regions = payload.get("rgb_regions")
        if not torch.is_tensor(regions):
            raise Tier0ProofError(f"{context}: tensor payload missing rgb_regions")
        digest = tensor_digest(torch, regions, "T,R,H,W,C")
        provenance = clip.get("frame_tensor_provenance")
        if not isinstance(provenance, dict) or provenance.get("schema_version") != PROVENANCE_SCHEMA_VERSION:
            raise Tier0ProofError(f"{context}: fixed-crop provenance missing")
        if provenance.get("tensor_digest") != digest:
            raise Tier0ProofError(f"{context}: tensor digest mismatch")
        if provenance.get("crop_config", {}).get("sha256") != references["crop_config"]["sha256"]:
            raise Tier0ProofError(f"{context}: provenance crop_config hash mismatch")
        label_counts[str(clip["label_id"])] += 1
        source_ids.add(str(clip["source_id"]))
        tensor_shapes[tuple(regions.shape)] += 1
        region_ids_seen.add(tuple(payload.get("region_ids", [])))
    if missing_file_count:
        raise Tier0ProofError(f"{manifest_relative_path}: {missing_file_count} tensor files are missing")

    label_to_index = {label_id: index for index, label_id in enumerate(SELECTED_LABELS)}
    dataset = RegionDataset(torch, manifest_relative_path, label_to_index)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    batch_regions, batch_labels = next(iter(loader))
    return {
        "path": project_relative(manifest_path),
        "sha256": sha256_file(manifest_path),
        "split": split,
        "clip_count": len(manifest["clips"]),
        "labels": SELECTED_LABELS,
        "label_clip_counts": dict(sorted(label_counts.items())),
        "source_ids": sorted(source_ids),
        "tensor_count": sum(tensor_shapes.values()),
        "missing_file_count": missing_file_count,
        "tensor_shapes": [
            {"shape": list(shape), "count": count}
            for shape, count in sorted(tensor_shapes.items())
        ],
        "region_ids": [list(items) for items in sorted(region_ids_seen)],
        "dataloader_batch": {
            "batch_size": batch_size,
            "regions_shape": list(batch_regions.shape),
            "labels_shape": list(batch_labels.shape),
            "labels": batch_labels.tolist(),
            "dtype": str(batch_regions.dtype).replace("torch.", ""),
        },
    }


def build_references() -> dict[str, dict[str, str]]:
    return {
        "source_register": {
            "path": SOURCE_REGISTER_PATH.as_posix(),
            "sha256": sha256_file(SOURCE_REGISTER_PATH),
        },
        "source_coverage": {
            "path": SOURCE_COVERAGE_PATH.as_posix(),
            "sha256": sha256_file(SOURCE_COVERAGE_PATH),
        },
        "crop_config": {
            "path": CROP_CONFIG_PATH.as_posix(),
            "sha256": sha256_file(CROP_CONFIG_PATH),
        },
        "pre_training_gates": {
            "path": GATES_PATH.as_posix(),
            "sha256": sha256_file(GATES_PATH),
        },
    }


def build_receipt(
    split_summaries: dict[str, dict[str, Any]],
    references: dict[str, dict[str, str]],
    ffmpeg: str,
    generated_at: str,
) -> dict[str, Any]:
    source_coverage = read_json(SOURCE_COVERAGE_PATH)
    crop_config = read_json(CROP_CONFIG_PATH)
    total_tensors = sum(summary["tensor_count"] for summary in split_summaries.values())
    total_missing = sum(summary["missing_file_count"] for summary in split_summaries.values())
    return {
        "schema_version": RECEIPT_SCHEMA_VERSION,
        "status": "passed",
        "generated_at": generated_at,
        "mission": "M3AD",
        "generated_by": {
            "script": {
                "path": "scripts/run_return_to_form_tier0_decode_dataloader.py",
                "sha256": sha256_file(Path("scripts/run_return_to_form_tier0_decode_dataloader.py")),
            },
            "command": [sys.executable, *sys.argv],
        },
        "selected_labels": SELECTED_LABELS,
        "class_count": len(SELECTED_LABELS),
        "source_ids": [SOURCE_ID],
        "references": references,
        "decode_ffmpeg_provenance": {
            "ffmpeg": {
                "path": str(Path(ffmpeg).resolve()),
                "sha256": sha256_file(Path(ffmpeg).resolve()),
                "version": ffmpeg_version(ffmpeg),
            },
            "frame_sampling": crop_config["frame_sampling_assumption"],
            "region_axis": "T,R,H,W,C",
        },
        "manifests": split_summaries,
        "aggregate": {
            "tensor_count": total_tensors,
            "missing_file_count": total_missing,
            "clips_by_split": {
                split: summary["clip_count"] for split, summary in split_summaries.items()
            },
        },
        "split_limitations": source_coverage.get("split_limitations", []),
        "final_promotion_negative_challenge_blocker": {
            "status": "separate_final_promotion_blocker",
            "validation_command": "./.venv/bin/python scripts/audit_final_manifests.py",
            "note": "The full final-promotion negative-challenge gate is intentionally separate from this Tier 0 decode/dataloader proof.",
        },
        "non_actions": [
            "no training",
            "no controlled clip-heldout evaluation",
            "no source approval",
            "no media import",
            "no ONNX export",
            "no model-card promotion",
            "no final-gate change",
            "no Brev stop",
            "no push",
        ],
        "next_milestone": "M3AE Tier 0 learnability smoke only after this proof passes.",
    }


def main() -> int:
    args = parse_args()
    generated_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    try:
        torch = import_torch()
        ffmpeg = ensure_ffmpeg()
        references = build_references()
        crop_config = read_json(CROP_CONFIG_PATH)
        if args.write:
            for split in ("train", "validation", "test"):
                build_manifest_for_split(torch, ffmpeg, split, generated_at, crop_config, references)
        split_summaries = {
            split: summarize_manifest(torch, split, references, args.batch_size)
            for split in ("train", "validation", "test")
        }
        receipt = build_receipt(split_summaries, references, ffmpeg, generated_at)
        if args.write:
            write_json(args.receipt, receipt)
        print(
            json.dumps(
                {
                    "status": receipt["status"],
                    "write": args.write,
                    "receipt": args.receipt.as_posix(),
                    "manifests": {
                        split: summary["path"] for split, summary in split_summaries.items()
                    },
                    "tensor_count": receipt["aggregate"]["tensor_count"],
                    "missing_file_count": receipt["aggregate"]["missing_file_count"],
                    "dataloader_batch_shapes": {
                        split: summary["dataloader_batch"]["regions_shape"]
                        for split, summary in split_summaries.items()
                    },
                },
                indent=2,
                sort_keys=True,
            )
        )
    except Tier0ProofError as error:
        print(f"M3AD proof failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
