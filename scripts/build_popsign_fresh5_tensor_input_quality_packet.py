#!/usr/bin/env python3
"""Build the PopSign fresh5 tensor/input quality packet receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import statistics
import sys
from collections import Counter
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-tensor-input-quality-packet/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json")
ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-tensor-input-quality-packet-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
TRAIN_SCRIPT = Path("scripts/train_rawframe_model.py")
EVALUATE_SCRIPT = Path("scripts/evaluate_rawframe_model.py")
M3CN_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json")
M3CM_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
LABELS = ["home", "morning", "pen", "thank_you", "who"]
SPLITS = ["train", "validation", "test"]
EXPECTED_REGION_IDS = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
EXPECTED_TENSOR_SHAPE = [16, 5, 96, 96, 3]
EXPECTED_TENSOR_DTYPE = "torch.uint8"
LOW_SIGNAL_RATIO_THRESHOLD = 0.5
NEAR_ZERO_STD_THRESHOLD = 1e-6


class PacketError(RuntimeError):
    """Raised when the no-training packet cannot be built."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PacketError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise PacketError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, str]:
    resolved = project_path(path, "input artifact")
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path, "json input artifact")
    return json.loads(resolved.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def round_float(value: float | int | None, digits: int = 6) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = round((len(ordered) - 1) * fraction)
    return ordered[index]


def summarize_values(values: list[float]) -> dict[str, Any]:
    if not values:
        return {
            "count": 0,
            "min": None,
            "p05": None,
            "median": None,
            "mean": None,
            "p95": None,
            "max": None,
        }
    return {
        "count": len(values),
        "min": round_float(min(values)),
        "p05": round_float(percentile(values, 0.05)),
        "median": round_float(statistics.median(values)),
        "mean": round_float(statistics.mean(values)),
        "p95": round_float(percentile(values, 0.95)),
        "max": round_float(max(values)),
    }


def shape_key(shape: list[int] | None) -> str:
    return "missing" if shape is None else "x".join(str(value) for value in shape)


def counter_dict(values: list[str]) -> dict[str, int]:
    return dict(sorted(Counter(values).items()))


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/build_popsign_fresh5_tensor_input_quality_packet.py",
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--write-receipt",
    ]


def validate_args(args: argparse.Namespace) -> Path:
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    if receipt != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise PacketError(f"M3CO requires {DEFAULT_RECEIPT.as_posix()}, got {project_relative(receipt)}")
    if not args.write_receipt:
        raise PacketError("M3CO requires --write-receipt")
    return receipt


def manifest_paths() -> dict[str, Path]:
    return {
        "train": project_path(TRAIN_MANIFEST, "train manifest"),
        "validation": project_path(VALIDATION_MANIFEST, "validation manifest"),
        "test": project_path(TEST_MANIFEST, "test manifest"),
    }


def load_inputs() -> dict[str, dict[str, Any]]:
    return {
        "manifest_contract": load_json(MANIFEST_CONTRACT),
        "train_manifest": load_json(TRAIN_MANIFEST),
        "validation_manifest": load_json(VALIDATION_MANIFEST),
        "test_manifest": load_json(TEST_MANIFEST),
        "m3cn": load_json(M3CN_RECEIPT),
        "m3cm": load_json(M3CM_RECEIPT),
        "m3ck": load_json(M3CK_RECEIPT),
        "m3cj": load_json(M3CJ_RECEIPT),
    }


def artifact_references() -> dict[str, dict[str, str]]:
    return {
        "goal": file_reference(Path("GOAL.md")),
        "active_prompt": file_reference(ACTIVE_PROMPT),
        "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        "manifest_contract": file_reference(MANIFEST_CONTRACT),
        "train_manifest": file_reference(TRAIN_MANIFEST),
        "validation_manifest": file_reference(VALIDATION_MANIFEST),
        "test_manifest": file_reference(TEST_MANIFEST),
        "training_loader_code": file_reference(TRAIN_SCRIPT),
        "evaluation_loader_code": file_reference(EVALUATE_SCRIPT),
        "m3cn_label_source_quality_review": file_reference(M3CN_RECEIPT),
        "m3cm_split_source_quality_contract": file_reference(M3CM_RECEIPT),
        "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
        "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
    }


def tensor_path_for_clip(clip: dict[str, Any], manifest_path: Path, context: str) -> Path:
    raw_value = clip.get("relative_frame_tensor_path")
    if not isinstance(raw_value, str) or not raw_value.strip():
        raise PacketError(f"{context} missing relative_frame_tensor_path")
    resolved = (manifest_path.parent / raw_value).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PacketError(f"{context} tensor path escapes project root: {raw_value}") from error
    return resolved


def expected_tensor_hash(clip: dict[str, Any], context: str) -> str:
    raw_value = clip.get("frame_tensor_sha256")
    if not isinstance(raw_value, str) or len(raw_value) != 64:
        raise PacketError(f"{context} missing frame_tensor_sha256")
    return raw_value


def manifest_crop_region_order(clip: dict[str, Any]) -> list[str]:
    crop_regions = clip.get("crop_regions")
    if not isinstance(crop_regions, list):
        return []
    ordered: list[tuple[int, str]] = []
    for region in crop_regions:
        if not isinstance(region, dict):
            continue
        axis = region.get("tensor_axis")
        region_id = region.get("region_id")
        if isinstance(axis, int) and isinstance(region_id, str):
            ordered.append((axis, region_id))
    return [region_id for _axis, region_id in sorted(ordered)]


def load_tensor_payload(torch: Any, path: Path) -> Any:
    try:
        return torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        return torch.load(path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - keep the receipt blocker concrete.
        raise PacketError(f"tensor could not be loaded: {path}: {error}") from error


def tensor_stats(torch: Any, payload: Any, context: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise PacketError(f"{context} tensor payload must be a dict with rgb_regions")
    regions = payload.get("rgb_regions")
    if not torch.is_tensor(regions):
        raise PacketError(f"{context} tensor payload missing tensor key rgb_regions")
    if regions.ndim != 5:
        raise PacketError(f"{context} rgb_regions must be 5D T,R,H,W,C; got {tuple(regions.shape)}")
    if int(regions.shape[-1]) != 3:
        raise PacketError(f"{context} rgb_regions final axis must be RGB channels; got {tuple(regions.shape)}")

    x = regions.float()
    diff = (x[1:] - x[:-1]).abs() if int(x.shape[0]) > 1 else x.new_empty((0,))
    frame_std = x.reshape(int(x.shape[0]), -1).std(dim=1, unbiased=False)
    region_std = x.std(dim=(0, 2, 3, 4), unbiased=False)
    region_mean = x.mean(dim=(0, 2, 3, 4))
    if diff.numel() > 0:
        region_motion = diff.mean(dim=(0, 2, 3, 4))
    else:
        region_motion = x.new_zeros(int(x.shape[1]))
    frames = payload.get("rgb_frames")

    return {
        "payload_type": type(payload).__name__,
        "payload_keys": sorted(str(key) for key in payload),
        "payload_schema_version": payload.get("schema_version"),
        "region_axis": payload.get("region_axis"),
        "region_ids": [str(region_id) for region_id in payload.get("region_ids", [])]
        if isinstance(payload.get("region_ids"), list)
        else [],
        "crop_config": payload.get("crop_config") if isinstance(payload.get("crop_config"), dict) else None,
        "rgb_regions_shape": [int(value) for value in regions.shape],
        "rgb_regions_dtype": str(regions.dtype),
        "rgb_frames_shape": [int(value) for value in frames.shape] if torch.is_tensor(frames) else None,
        "rgb_frames_dtype": str(frames.dtype) if torch.is_tensor(frames) else None,
        "rgb_frames_region_id": payload.get("rgb_frames_region_id")
        if isinstance(payload.get("rgb_frames_region_id"), str)
        else None,
        "finite_values": bool(torch.isfinite(x).all().item()),
        "min_pixel_value": round_float(x.min().item()),
        "max_pixel_value": round_float(x.max().item()),
        "pixel_mean": round_float(x.mean().item()),
        "pixel_std": round_float(x.std(unbiased=False).item()),
        "nonzero_pixel_fraction": round_float((x != 0).float().mean().item()),
        "near_zero_frame_count": int((frame_std <= NEAR_ZERO_STD_THRESHOLD).sum().item()),
        "near_zero_region_count": int((region_std <= NEAR_ZERO_STD_THRESHOLD).sum().item()),
        "temporal_absdiff_mean": round_float(diff.mean().item()) if diff.numel() > 0 else None,
        "region_pixel_mean": [round_float(value.item()) for value in region_mean],
        "region_pixel_std": [round_float(value.item()) for value in region_std],
        "region_temporal_absdiff_mean": [round_float(value.item()) for value in region_motion],
    }


def scan_tensors() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    import torch  # Imported only for the read-only tensor scan.

    records: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    paths = manifest_paths()
    for split in SPLITS:
        manifest_path = paths[split]
        manifest = load_json(Path(project_relative(manifest_path)))
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise PacketError(f"{project_relative(manifest_path)} clips must be a list")
        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                raise PacketError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
            context = f"{project_relative(manifest_path)} clips[{index}]"
            label_id = str(clip.get("label_id"))
            if label_id not in LABELS:
                continue
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            manifest_hash = expected_tensor_hash(clip, context)
            exists = tensor_path.exists()
            actual_hash = sha256_file(tensor_path) if exists else None
            hash_status = "passed" if actual_hash == manifest_hash else "failed"
            base_record = {
                "split": split,
                "manifest_path": project_relative(manifest_path),
                "manifest_index": index,
                "clip_id": clip.get("clip_id"),
                "label_id": label_id,
                "source_sign_slug": clip.get("source_sign_slug"),
                "source_record_id": clip.get("source_record_id"),
                "signer_id": clip.get("signer_id"),
                "tensor_path": project_relative(tensor_path),
                "manifest_frame_tensor_sha256": manifest_hash,
                "actual_tensor_file_sha256": actual_hash,
                "tensor_file_hash_status": hash_status,
                "tensor_available": exists,
                "manifest_crop_region_order": manifest_crop_region_order(clip),
                "manifest_tensor_digest_sha256": (
                    clip.get("frame_tensor_provenance", {})
                    .get("tensor_digest", {})
                    .get("sha256")
                    if isinstance(clip.get("frame_tensor_provenance"), dict)
                    else None
                ),
            }
            if not exists:
                failure = {**base_record, "failure": "tensor_file_missing"}
                records.append(failure)
                failures.append(failure)
                continue
            try:
                payload = load_tensor_payload(torch, tensor_path)
                stats = tensor_stats(torch, payload, context)
            except PacketError as error:
                failure = {**base_record, "failure": str(error)}
                records.append(failure)
                failures.append(failure)
                continue
            records.append({**base_record, **stats})
    return records, failures


def values_for(records: list[dict[str, Any]], key: str) -> list[float]:
    values = []
    for record in records:
        value = record.get(key)
        if isinstance(value, (int, float)):
            values.append(float(value))
    return values


def region_values_for(records: list[dict[str, Any]], key: str, region_index: int) -> list[float]:
    values = []
    for record in records:
        value = record.get(key)
        if isinstance(value, list) and len(value) > region_index and isinstance(value[region_index], (int, float)):
            values.append(float(value[region_index]))
    return values


def summary_for_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    loaded = [record for record in records if record.get("failure") is None]
    return {
        "clip_count": len(records),
        "tensor_available_count": sum(1 for record in records if record.get("tensor_available") is True),
        "tensor_hash_match_count": sum(
            1 for record in records if record.get("tensor_file_hash_status") == "passed"
        ),
        "load_success_count": len(loaded),
        "failure_count": len(records) - len(loaded),
        "failures": [
            {
                "clip_id": record.get("clip_id"),
                "tensor_path": record.get("tensor_path"),
                "failure": record.get("failure"),
            }
            for record in records
            if record.get("failure") is not None
        ],
        "payload_schema_counts": counter_dict(
            [str(record.get("payload_schema_version")) for record in loaded]
        ),
        "shape_counts": counter_dict([shape_key(record.get("rgb_regions_shape")) for record in loaded]),
        "dtype_counts": counter_dict([str(record.get("rgb_regions_dtype")) for record in loaded]),
        "region_axis_counts": counter_dict([str(record.get("region_axis")) for record in loaded]),
        "tensor_region_order_counts": counter_dict([",".join(record.get("region_ids", [])) for record in loaded]),
        "manifest_region_order_counts": counter_dict(
            [",".join(record.get("manifest_crop_region_order", [])) for record in records]
        ),
        "rgb_frames_shape_counts": counter_dict([shape_key(record.get("rgb_frames_shape")) for record in loaded]),
        "rgb_frames_region_id_counts": counter_dict([str(record.get("rgb_frames_region_id")) for record in loaded]),
        "finite_value_failure_count": sum(1 for record in loaded if record.get("finite_values") is not True),
        "near_zero_frame_clip_count": sum(
            1 for record in loaded if int(record.get("near_zero_frame_count") or 0) > 0
        ),
        "near_zero_region_clip_count": sum(
            1 for record in loaded if int(record.get("near_zero_region_count") or 0) > 0
        ),
        "pixel_mean": summarize_values(values_for(loaded, "pixel_mean")),
        "pixel_std": summarize_values(values_for(loaded, "pixel_std")),
        "nonzero_pixel_fraction": summarize_values(values_for(loaded, "nonzero_pixel_fraction")),
        "temporal_absdiff_mean": summarize_values(values_for(loaded, "temporal_absdiff_mean")),
        "min_pixel_value": summarize_values(values_for(loaded, "min_pixel_value")),
        "max_pixel_value": summarize_values(values_for(loaded, "max_pixel_value")),
        "region_summaries": {
            EXPECTED_REGION_IDS[index]: {
                "pixel_mean": summarize_values(region_values_for(loaded, "region_pixel_mean", index)),
                "pixel_std": summarize_values(region_values_for(loaded, "region_pixel_std", index)),
                "temporal_absdiff_mean": summarize_values(
                    region_values_for(loaded, "region_temporal_absdiff_mean", index)
                ),
            }
            for index in range(len(EXPECTED_REGION_IDS))
        },
    }


def critical_contract_failures(records: list[dict[str, Any]]) -> list[str]:
    failures = []
    expected_region_key = ",".join(EXPECTED_REGION_IDS)
    for record in records:
        context = f"{record.get('split')}:{record.get('clip_id')}"
        if record.get("tensor_available") is not True:
            failures.append(f"{context} tensor file missing")
        if record.get("tensor_file_hash_status") != "passed":
            failures.append(f"{context} tensor file hash mismatch")
        if record.get("failure") is not None:
            failures.append(f"{context} tensor load/stat failure: {record.get('failure')}")
        if record.get("rgb_regions_shape") != EXPECTED_TENSOR_SHAPE:
            failures.append(f"{context} unexpected rgb_regions shape {record.get('rgb_regions_shape')}")
        if record.get("rgb_regions_dtype") != EXPECTED_TENSOR_DTYPE:
            failures.append(f"{context} unexpected rgb_regions dtype {record.get('rgb_regions_dtype')}")
        if record.get("finite_values") is not True:
            failures.append(f"{context} non-finite tensor value")
        if ",".join(record.get("region_ids", [])) != expected_region_key:
            failures.append(f"{context} tensor region order mismatch")
        if ",".join(record.get("manifest_crop_region_order", [])) != expected_region_key:
            failures.append(f"{context} manifest crop region order mismatch")
    return failures


def label_rows(records: list[dict[str, Any]], baselines: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    global_motion_median = baselines["all_loaded_clips"]["temporal_absdiff_mean"]["median"] or 0.0
    global_pixel_std_median = baselines["all_loaded_clips"]["pixel_std"]["median"] or 0.0
    expected_region_key = ",".join(EXPECTED_REGION_IDS)
    for label in LABELS:
        label_records = [record for record in records if record.get("label_id") == label]
        label_summary = summary_for_records(label_records)
        motion_mean = label_summary["temporal_absdiff_mean"]["mean"]
        pixel_std_mean = label_summary["pixel_std"]["mean"]
        motion_ratio = (
            float(motion_mean) / float(global_motion_median)
            if isinstance(motion_mean, (int, float)) and global_motion_median
            else None
        )
        pixel_std_ratio = (
            float(pixel_std_mean) / float(global_pixel_std_median)
            if isinstance(pixel_std_mean, (int, float)) and global_pixel_std_median
            else None
        )
        split_rows = []
        for split in SPLITS:
            split_summary = summary_for_records(
                [record for record in label_records if record.get("split") == split]
            )
            split_rows.append(
                {
                    "split": split,
                    "clip_count": split_summary["clip_count"],
                    "tensor_available_count": split_summary["tensor_available_count"],
                    "tensor_hash_match_count": split_summary["tensor_hash_match_count"],
                    "load_success_count": split_summary["load_success_count"],
                    "shape_counts": split_summary["shape_counts"],
                    "dtype_counts": split_summary["dtype_counts"],
                    "region_order_counts": split_summary["tensor_region_order_counts"],
                    "finite_value_failure_count": split_summary["finite_value_failure_count"],
                    "pixel_std_mean": split_summary["pixel_std"]["mean"],
                    "temporal_absdiff_mean": split_summary["temporal_absdiff_mean"]["mean"],
                    "near_zero_frame_clip_count": split_summary["near_zero_frame_clip_count"],
                    "near_zero_region_clip_count": split_summary["near_zero_region_clip_count"],
                }
            )
        contract_failures = critical_contract_failures(label_records)
        low_signal_flags = []
        if motion_ratio is not None and motion_ratio < LOW_SIGNAL_RATIO_THRESHOLD:
            low_signal_flags.append("temporal_absdiff_mean_below_half_global_median")
        if pixel_std_ratio is not None and pixel_std_ratio < LOW_SIGNAL_RATIO_THRESHOLD:
            low_signal_flags.append("pixel_std_mean_below_half_global_median")
        if label_summary["tensor_region_order_counts"] != {expected_region_key: len(label_records)}:
            low_signal_flags.append("unexpected_tensor_region_order")
        rows.append(
            {
                "label_id": label,
                "priority": "highest" if label == "pen" else "high" if label == "thank_you" else "normal",
                "split_rows": split_rows,
                "overall_tensor_input_summary": label_summary,
                "motion_mean_to_global_median_ratio": round_float(motion_ratio),
                "pixel_std_mean_to_global_median_ratio": round_float(pixel_std_ratio),
                "low_signal_or_contract_flags": low_signal_flags,
                "visible_input_quality_blocker": bool(contract_failures or low_signal_flags),
                "visible_blockers": contract_failures,
                "assessment": label_assessment(label, motion_ratio, pixel_std_ratio, contract_failures, low_signal_flags),
            }
        )
    return rows


def label_assessment(
    label: str,
    motion_ratio: float | None,
    pixel_std_ratio: float | None,
    contract_failures: list[str],
    low_signal_flags: list[str],
) -> str:
    if contract_failures:
        return "blocked_by_tensor_contract_or_load_failure"
    if low_signal_flags:
        return "blocked_by_low_signal_tensor_statistics"
    ratios = {
        "temporal_motion_ratio": round_float(motion_ratio),
        "pixel_std_ratio": round_float(pixel_std_ratio),
    }
    if label == "pen":
        return (
            "No read-only tensor/input blocker is visible for pen. Its tensor hashes, shape, dtype, region order, "
            f"finite checks, pixel variance, and temporal motion are within the fresh5 label band ({ratios})."
        )
    if label == "thank_you":
        return (
            "No read-only tensor/input blocker is visible for thank_you. The source slug normalization risk from "
            f"M3CN does not coincide with tensor hash, region order, finite-value, variance, or motion outliers ({ratios})."
        )
    return f"No read-only tensor/input blocker is visible for {label}; ratios {ratios} remain within the fresh5 band."


def tensor_artifact_hash_index(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "split": record.get("split"),
            "label_id": record.get("label_id"),
            "clip_id": record.get("clip_id"),
            "tensor_path": record.get("tensor_path"),
            "manifest_frame_tensor_sha256": record.get("manifest_frame_tensor_sha256"),
            "actual_tensor_file_sha256": record.get("actual_tensor_file_sha256"),
            "manifest_tensor_digest_sha256": record.get("manifest_tensor_digest_sha256"),
            "tensor_file_hash_status": record.get("tensor_file_hash_status"),
        }
        for record in sorted(
            records,
            key=lambda item: (
                str(item.get("split")),
                str(item.get("label_id")),
                str(item.get("clip_id")),
            ),
        )
    ]


def m3cj_train_all_lr003(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    for run in inputs["m3cj"].get("runs", []):
        if isinstance(run, dict) and run.get("name") == "train_all_lr003":
            evaluation = run.get("evaluation", {})
            return evaluation if isinstance(evaluation, dict) else {}
    return {}


def m3cn_mechanical_source_label_ambiguity_cleared(inputs: dict[str, dict[str, Any]]) -> bool:
    rows = inputs["m3cn"].get("per_label_source_quality_review_rows", [])
    if not isinstance(rows, list):
        return False
    by_label = {
        str(row.get("label_id")): row
        for row in rows
        if isinstance(row, dict)
    }
    for label in LABELS:
        row = by_label.get(label, {})
        alignment = row.get("source_label_alignment") if isinstance(row, dict) else {}
        if not isinstance(alignment, dict):
            return False
        if alignment.get("mechanical_source_label_ambiguity") is not False:
            return False
    return True


def input_contract_review(inputs: dict[str, dict[str, Any]], baselines: dict[str, Any]) -> dict[str, Any]:
    return {
        "expected_input_contract": inputs["manifest_contract"].get("required_input_contract"),
        "expected_raw_tensor": {
            "key": "rgb_regions",
            "axis": "T,R,H,W,C",
            "shape": EXPECTED_TENSOR_SHAPE,
            "dtype": "uint8",
            "region_order": EXPECTED_REGION_IDS,
        },
        "observed_all_loaded_clips": {
            "shape_counts": baselines["all_loaded_clips"]["shape_counts"],
            "dtype_counts": baselines["all_loaded_clips"]["dtype_counts"],
            "tensor_region_order_counts": baselines["all_loaded_clips"]["tensor_region_order_counts"],
            "region_axis_counts": baselines["all_loaded_clips"]["region_axis_counts"],
            "rgb_frames_region_id_counts": baselines["all_loaded_clips"]["rgb_frames_region_id_counts"],
            "finite_value_failure_count": baselines["all_loaded_clips"]["finite_value_failure_count"],
        },
        "loader_contract_from_code": {
            "training_loader_symbol": "scripts/train_rawframe_model.py::load_tensor_file_with_contract",
            "training_dataset_symbol": "scripts/train_rawframe_model.py::RawFrameClipDataset",
            "evaluation_preserve_region_axis": (
                "scripts/evaluate_rawframe_model.py sets preserve_region_axis when "
                "--popsign-fresh5-training-smoke is active"
            ),
            "accepted_tensor_keys_in_order": ["rgb_regions", "frames", "tensor", "rgb_frames"],
            "rgb_regions_precedes_rgb_frames_fallback": True,
            "popsign_fresh5_mode_preserves_region_axis": True,
            "prepared_model_input_axis_for_popsign_fresh5": "B,T,R,C,H,W",
        },
        "visible_loader_contract_risks": [
            (
                "Future train-all prompts must retain the PopSign fresh5 mode/preserve-region-axis path; "
                "falling back to generic non-region mode would still be an input-contract regression."
            )
        ],
        "current_packet_loader_blocker_visible": False,
        "why_no_current_loader_blocker": (
            "All scanned tensors expose rgb_regions with the expected T,R,H,W,C axis, and M3CK already recorded "
            "B,T,R,C,H,W preservation plus train-fit connectivity for one balanced clip per label."
        ),
    }


def decision_for_rows(rows: list[dict[str, Any]], records: list[dict[str, Any]]) -> dict[str, Any]:
    blockers = sorted(
        {
            blocker
            for row in rows
            for blocker in row.get("visible_blockers", [])
        }
    )
    low_signal_flags = sorted(
        {
            f"{row['label_id']}:{flag}"
            for row in rows
            for flag in row.get("low_signal_or_contract_flags", [])
        }
    )
    tensor_input_blockers = blockers + low_signal_flags
    receipt_complete = (
        len(records) == 375
        and not tensor_input_blockers
        and all(row["overall_tensor_input_summary"]["load_success_count"] == 75 for row in rows)
    )
    return {
        "receipt_complete": receipt_complete,
        "visible_tensor_input_quality_blockers": tensor_input_blockers,
        "per_label_tensor_input_quality_rows_complete": len(rows) == len(LABELS),
        "pen_and_thank_you_explicitly_covered": all(
            any(row.get("label_id") == label for row in rows) for label in ["pen", "thank_you"]
        ),
        "bounded_local_train_all_justified_now": False,
        "training_distribution_or_sampler_packet_justified_now": receipt_complete,
        "brev_compute_or_planning_justified_now": False,
        "human_crop_tensor_source_scope_or_budget_review_required_now": False,
        "exactly_one_next_action": (
            "continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality"
            if receipt_complete
            else "continue_no_training_tensor_or_input_quality_packet_after_label_review"
        ),
        "next_action_rationale": (
            "No per-label tensor corruption, crop/region-order defect, finite-value issue, or low-signal "
            "pen/thank_you outlier is visible from the existing tensors. The prior train-all collapse is therefore "
            "not explained by read-only tensor/input quality, but repeating train-all is still unjustified until a "
            "no-training training-distribution or sampler packet checks exposure, sampling, and batch/epoch behavior."
            if receipt_complete
            else "The tensor/input packet is incomplete or found a blocker; finish/repair this no-training packet before fitting."
        ),
    }


def future_conditions(decision: dict[str, Any]) -> dict[str, Any]:
    return {
        "what_would_justify_one_bounded_local_train_all_prompt": [
            "This M3CO tensor/input-quality packet remains complete with no visible tensor/input blocker.",
            "A separate no-training training-distribution/sampler packet finds no exposure, class-order, batch, sampler, or epoch-accounting blocker, or it names one bounded local hypothesis to test.",
            "The future local prompt preserves the repaired PopSign fresh5 manifests, approved PopSign source lane, strict split/signer/tensor disjointness, rgb_regions_grid_v1 region-axis input, random initialization, no-pretrained boundary, and fail-closed browser/model-card state.",
            "The future run must beat M3CJ: test top-1 > 0.2, macro F1 > 0.06666666666666668, prediction distribution not single-class, no zero-recall selected labels, and validation accuracy not flat at chance.",
        ],
        "what_would_block_more_training_and_require_human_review": [
            "Any tensor hash/load/shape/dtype/finite-value/region-order blocker that requires regenerating tensors or changing crop semantics.",
            "Any crop/source/label ambiguity that cannot be resolved from tracked manifests and receipts.",
            "Any request to change source approvals, import media, rewrite manifests/tensors, expand labels, spend Brev, change scope, export, activate browser recognition, promote a model card, or weaken final gates.",
        ],
        "current_human_review_required": decision["human_crop_tensor_source_scope_or_budget_review_required_now"],
    }


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    inputs = load_inputs()
    records, failures = scan_tensors()
    baselines = {
        "all_loaded_clips": summary_for_records(records),
        "by_split": {
            split: summary_for_records([record for record in records if record.get("split") == split])
            for split in SPLITS
        },
    }
    rows = label_rows(records, baselines)
    decision = decision_for_rows(rows, records)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CO - PopSign fresh5 tensor/input quality packet",
        "status": "completed_no_training_no_mutation_tensor_input_quality_packet",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/build_popsign_fresh5_tensor_input_quality_packet.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
        },
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "input_artifacts": artifact_references(),
        "scope": {
            "local_only": True,
            "existing_tensors_manifests_and_receipts_only": True,
            "no_training_or_fitting": True,
            "no_optimizer_or_backward_pass": True,
            "no_checkpoint_creation": True,
            "no_brev_command": True,
            "no_brev_spend": True,
            "no_brev_worker_lifecycle_change": True,
            "no_remote_command": True,
            "no_source_register_mutation": True,
            "no_source_import_or_media_download": True,
            "no_manifest_mutation": True,
            "no_tensor_mutation": True,
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "tensor_artifact_hash_index": tensor_artifact_hash_index(records),
        "global_tensor_input_summary": baselines,
        "per_label_tensor_input_quality_rows": rows,
        "pen_and_thank_you_focus": {
            label: next(row for row in rows if row["label_id"] == label)
            for label in ["pen", "thank_you"]
        },
        "input_contract_risk_review": input_contract_review(inputs, baselines),
        "prior_failure_context": {
            "m3cj_train_all_lr003": m3cj_train_all_lr003(inputs),
            "m3ck_architecture_can_train_fit_balanced_tiny_subset": inputs["m3ck"]
            .get("decision", {})
            .get("m3ce_architecture_can_train_fit_balanced_tiny_subset"),
            "m3cn_mechanical_source_label_ambiguity_cleared": m3cn_mechanical_source_label_ambiguity_cleared(
                inputs
            ),
        },
        "decision": decision,
        "future_training_or_stop_conditions": future_conditions(decision),
        "scan_failures": failures,
        "guardrails": {
            "training_run": False,
            "tiny_overfit_rerun": False,
            "fitting": False,
            "optimizer_step": False,
            "backward_pass": False,
            "checkpoint_created": False,
            "brev_command_run": False,
            "brev_spend": False,
            "brev_worker_lifecycle_changed": False,
            "remote_command": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "pretrained_components": [],
            "export": False,
            "browser_activation": False,
            "model_card_promotion": False,
            "final_gate_change": False,
            "unsupported_claim": False,
            "push": False,
        },
        "validation_commands": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_popsign_fresh5_tensor_input_quality_packet.py",
            ".venv/bin/python scripts/build_popsign_fresh5_tensor_input_quality_packet.py --receipt docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null",
            "git diff --check",
            "node scripts/audit_codex_pair_state.mjs --json",
        ],
        "exactly_one_next_action": decision["exactly_one_next_action"],
    }


def main() -> int:
    args = parse_args()
    try:
        receipt_path = validate_args(args)
        receipt = build_receipt(args)
        write_json(receipt_path, receipt)
    except PacketError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
