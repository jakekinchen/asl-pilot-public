#!/usr/bin/env python3
"""Run the M3AE-AH read-only union-target data/schema remediation diagnostic."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import statistics
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from train_rawframe_model import TrainingError, import_torch, sha256_file


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-data-schema-remediation/v1"
UNION_TARGET_ID = "table_two_hand_union_or_contact_region"
EXPECTED_PACKET_SHA256 = "6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d"
EXPECTED_SPLIT_COUNTS = {"train": 11, "validation": 11, "test": 10}
EXPECTED_UNION_SUPPORT_BY_SPLIT = {"train": 7, "validation": 7, "test": 6}
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json"
)
REFERENCE_PATHS = {
    "m3ae_ag_union_training_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json",
    "m3ae_ag_session_log": ROOT
    / "docs"
    / "session-logs"
    / "244-return-to-form-tier0-detector0-two-hand-union-training-smoke.md",
    "m3ae_ag_smoke_runner": ROOT / "scripts" / "run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py",
    "m3ae_af_union_margin_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json",
    "m3ae_ae_union_margin_schema_revision": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md",
    "m3ae_ad_union_target_remediation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-remediation-v1.json",
    "m3ae_ac_union_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json",
    "m3ae_ab_union_schema": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-schema-v1.md",
    "m3ae_aa_expanded_packet_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json",
    "m3ae_z_table_second_hand_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json",
    "m3ae_y_candidate_review": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md",
    "m3ae_p_detector0_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-training-smoke-v1.json",
    "m3ae_l_bootstrap": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
    "observer_strategy_memo": ROOT / "artifacts" / "research" / "observer-201-localization-strategy-api-response.md",
}


class RemediationDiagnosticError(RuntimeError):
    """Raised when the read-only diagnostic cannot produce a valid receipt."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RemediationDiagnosticError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise RemediationDiagnosticError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise RemediationDiagnosticError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise RemediationDiagnosticError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def resolve_packet_tensor_path(packet_path: Path, row: dict[str, Any]) -> Path:
    value = row.get("frame_tensor_path")
    if not isinstance(value, str) or not value:
        raise RemediationDiagnosticError(f"{row.get('row_id')} missing frame_tensor_path")
    candidate = Path(value)
    if candidate.is_absolute():
        raise RemediationDiagnosticError(f"{row.get('row_id')} tensor path must be packet-relative")
    resolved = (packet_path.parent / candidate).resolve()
    try:
        resolved.relative_to(ROOT)
    except ValueError as error:
        raise RemediationDiagnosticError(f"{row.get('row_id')} tensor path escapes project root") from error
    return resolved


def validate_box(row_id: str, target_id: str, box: Any) -> list[float]:
    if not isinstance(box, list) or len(box) != 4:
        raise RemediationDiagnosticError(f"{row_id}:{target_id} box must be a length-4 array")
    coords = [float(value) for value in box]
    if any(value < 0.0 or value > 1.0 for value in coords):
        raise RemediationDiagnosticError(f"{row_id}:{target_id} box coordinates must be normalized")
    if coords[0] > coords[2] or coords[1] > coords[3]:
        raise RemediationDiagnosticError(f"{row_id}:{target_id} box must be xyxy ordered")
    return coords


def box_stats(boxes: list[list[float]]) -> dict[str, Any]:
    if not boxes:
        return {
            "count": 0,
            "width": None,
            "height": None,
            "area": None,
            "x1": None,
            "y1": None,
            "x2": None,
            "y2": None,
            "mean_box": None,
            "median_box": None,
            "mean_constant_box_mae": None,
            "median_constant_box_mae": None,
        }
    widths = [box[2] - box[0] for box in boxes]
    heights = [box[3] - box[1] for box in boxes]
    areas = [width * height for width, height in zip(widths, heights, strict=True)]
    mean_box = [sum(box[index] for box in boxes) / len(boxes) for index in range(4)]
    median_box = [statistics.median(box[index] for box in boxes) for index in range(4)]
    mean_mae = sum(abs(box[index] - mean_box[index]) for box in boxes for index in range(4)) / (len(boxes) * 4)
    median_mae = sum(abs(box[index] - median_box[index]) for box in boxes for index in range(4)) / (len(boxes) * 4)

    def summary(values: list[float]) -> dict[str, float]:
        return {
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / len(values),
            "median": statistics.median(values),
        }

    return {
        "count": len(boxes),
        "width": summary(widths),
        "height": summary(heights),
        "area": summary(areas),
        "x1": summary([box[0] for box in boxes]),
        "y1": summary([box[1] for box in boxes]),
        "x2": summary([box[2] for box in boxes]),
        "y2": summary([box[3] for box in boxes]),
        "mean_box": mean_box,
        "median_box": median_box,
        "mean_constant_box_mae": mean_mae,
        "median_constant_box_mae": median_mae,
    }


def derive_union_target(row: dict[str, Any]) -> dict[str, Any]:
    row_id = str(row.get("row_id"))
    targets = row.get("targets")
    if not isinstance(targets, dict):
        raise RemediationDiagnosticError(f"{row_id} missing targets")
    left = targets.get("left_or_first_hand")
    right = targets.get("right_or_second_hand")
    if not isinstance(left, dict) or not isinstance(right, dict):
        raise RemediationDiagnosticError(f"{row_id} missing left/right source targets")
    left_box = validate_box(row_id, "left_or_first_hand", left.get("box_xyxy_norm"))
    right_box = validate_box(row_id, "right_or_second_hand", right.get("box_xyxy_norm"))
    raw_box = [
        min(left_box[0], right_box[0]),
        min(left_box[1], right_box[1]),
        max(left_box[2], right_box[2]),
        max(left_box[3], right_box[3]),
    ]
    raw_width = raw_box[2] - raw_box[0]
    raw_height = raw_box[3] - raw_box[1]
    raw_area = raw_width * raw_height
    effective_margin_x = min(0.02, max(0.0, (0.85 - raw_width) / 2.0))
    effective_margin_y = min(0.02, max(0.0, (0.85 - raw_height) / 2.0))
    revised_box = [
        max(0.0, raw_box[0] - effective_margin_x),
        max(0.0, raw_box[1] - effective_margin_y),
        min(1.0, raw_box[2] + effective_margin_x),
        min(1.0, raw_box[3] + effective_margin_y),
    ]
    revised_width = revised_box[2] - revised_box[0]
    revised_height = revised_box[3] - revised_box[1]
    revised_area = revised_width * revised_height
    if raw_width > 0.85 or raw_height > 0.85 or raw_area > 0.55:
        raise RemediationDiagnosticError(f"{row_id} raw union violates M3AE-AE hard limits")
    if revised_area > 0.55:
        raise RemediationDiagnosticError(f"{row_id} revised union unexpectedly violates area cap")
    center = [(revised_box[0] + revised_box[2]) / 2.0, (revised_box[1] + revised_box[3]) / 2.0]
    visibility = round(
        max(0.0, min(float(left.get("visibility_confidence")), float(right.get("visibility_confidence"))) - 0.05),
        3,
    )
    overlap_x = min(left_box[2], right_box[2]) - max(left_box[0], right_box[0])
    overlap_y = min(left_box[3], right_box[3]) - max(left_box[1], right_box[1])
    return {
        "raw_box_xyxy_norm": raw_box,
        "raw_width": raw_width,
        "raw_height": raw_height,
        "raw_area": raw_area,
        "effective_margin_x": effective_margin_x,
        "effective_margin_y": effective_margin_y,
        "revised_box_xyxy_norm": revised_box,
        "revised_center_xy_norm": center,
        "revised_width": revised_width,
        "revised_height": revised_height,
        "revised_area": revised_area,
        "visibility_confidence": visibility,
        "occlusion_flag": bool(left.get("occlusion_flag")) or bool(right.get("occlusion_flag")),
        "truncation_flag": bool(left.get("truncation_flag")) or bool(right.get("truncation_flag")),
        "left_right_overlap_x": max(0.0, overlap_x),
        "left_right_overlap_y": max(0.0, overlap_y),
        "left_right_horizontal_gap": max(0.0, -overlap_x),
    }


def close_enough(values: list[float], expected: list[float], tolerance: float = 1e-9) -> bool:
    return all(abs(left - right) <= tolerance for left, right in zip(values, expected, strict=True))


def load_tensor_payload(torch: Any, path: Path) -> dict[str, Any]:
    try:
        payload = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        payload = torch.load(path, map_location="cpu")
    if not isinstance(payload, dict):
        raise RemediationDiagnosticError(f"tensor payload must be a dict: {project_relative(path)}")
    return payload


def smoke_rows_by_id(smoke_receipt: dict[str, Any]) -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    evidence = smoke_receipt.get("packet_evidence", {})
    rows_by_split = evidence.get("rows_by_split", {})
    if not isinstance(rows_by_split, dict):
        raise RemediationDiagnosticError("M3AE-AG smoke receipt missing rows_by_split")
    for split, split_rows in rows_by_split.items():
        if not isinstance(split_rows, list):
            raise RemediationDiagnosticError(f"M3AE-AG rows_by_split.{split} must be a list")
        for row in split_rows:
            if not isinstance(row, dict):
                raise RemediationDiagnosticError(f"M3AE-AG rows_by_split.{split} row must be an object")
            rows[str(row.get("row_id"))] = row
    return rows


def inspect_packet_and_tensors(
    torch: Any,
    packet_path: Path,
    smoke_receipt: dict[str, Any],
) -> dict[str, Any]:
    packet = read_json(packet_path)
    packet_hash = sha256_file(packet_path)
    if packet_hash != EXPECTED_PACKET_SHA256:
        raise RemediationDiagnosticError(f"current packet hash mismatch: {packet_hash}")
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise RemediationDiagnosticError("current packet must contain exactly 32 frame rows")
    target_schema = packet.get("target_schema", {})
    target_ids = target_schema.get("target_ids")
    if not isinstance(target_ids, list) or UNION_TARGET_ID not in target_ids:
        raise RemediationDiagnosticError(f"packet target schema missing {UNION_TARGET_ID}")

    smoke_rows = smoke_rows_by_id(smoke_receipt)
    split_counts = Counter()
    label_counts_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    union_support_by_split = Counter()
    source_ids = set()
    signer_hashes_by_split: dict[str, set[str]] = defaultdict(set)
    source_records_by_split: dict[str, set[str]] = defaultdict(set)
    present_union_boxes_by_split: dict[str, list[list[float]]] = defaultdict(list)
    all_present_union_boxes: list[list[float]] = []
    tensor_checks = []
    derivation_checks = []
    mismatches = []
    absent_non_table_count = 0
    smoke_alignment_mismatches = []
    reduced_context_margin_rows = []

    for row in rows:
        if not isinstance(row, dict):
            raise RemediationDiagnosticError("packet frame row must be an object")
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))
        if split not in EXPECTED_SPLIT_COUNTS:
            raise RemediationDiagnosticError(f"{row_id} unsupported split {split}")
        target = row.get("targets", {}).get(UNION_TARGET_ID) if isinstance(row.get("targets"), dict) else None
        if not isinstance(target, dict):
            raise RemediationDiagnosticError(f"{row_id} missing {UNION_TARGET_ID}")

        tensor_path = resolve_packet_tensor_path(packet_path, row)
        tensor_sha256 = sha256_file(tensor_path)
        expected_tensor_hash = str(row.get("frame_tensor_sha256"))
        payload = load_tensor_payload(torch, tensor_path)
        regions = payload.get("rgb_regions")
        region_ids = payload.get("region_ids")
        if not torch.is_tensor(regions):
            raise RemediationDiagnosticError(f"{row_id} tensor payload missing rgb_regions")
        if not isinstance(region_ids, list) or "full_frame_reference" not in [str(value) for value in region_ids]:
            raise RemediationDiagnosticError(f"{row_id} tensor payload missing full_frame_reference region")
        frame_index = int(row.get("frame_index"))
        frame_count = int(regions.shape[0])
        if frame_index < 0 or frame_index >= frame_count:
            raise RemediationDiagnosticError(f"{row_id} frame_index {frame_index} outside tensor frame count")

        split_counts[split] += 1
        label_counts_by_split[split][label_id] += 1
        source_ids.add(str(row.get("source_id")))
        signer_hashes_by_split[split].add(str(row.get("signer_identity_hash")))
        source_records_by_split[split].add(str(row.get("source_record_id")))
        tensor_checks.append(
            {
                "row_id": row_id,
                "split": split,
                "label_id": label_id,
                "frame_index": frame_index,
                "frame_count": frame_count,
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": tensor_sha256,
                "hash_matches_packet": tensor_sha256 == expected_tensor_hash,
                "rgb_regions_shape": [int(value) for value in regions.shape],
                "region_ids": [str(value) for value in region_ids],
                "full_frame_reference_present": True,
            }
        )
        if tensor_sha256 != expected_tensor_hash:
            mismatches.append({"row_id": row_id, "field": "frame_tensor_sha256", "expected": expected_tensor_hash, "actual": tensor_sha256})

        smoke_row = smoke_rows.get(row_id)
        if not smoke_row:
            smoke_alignment_mismatches.append({"row_id": row_id, "reason": "missing_from_m3ae_ag_smoke_receipt"})
        else:
            for field, actual in (
                ("label_id", label_id),
                ("tensor_sha256", tensor_sha256),
                ("frame_index", frame_index),
            ):
                if smoke_row.get(field) != actual:
                    smoke_alignment_mismatches.append(
                        {
                            "row_id": row_id,
                            "field": field,
                            "packet": actual,
                            "smoke_receipt": smoke_row.get(field),
                        }
                    )

        present = bool(target.get("presence"))
        if label_id == "table":
            if not present:
                mismatches.append({"row_id": row_id, "field": UNION_TARGET_ID, "expected": "present for table", "actual": "absent"})
                continue
            union_box = validate_box(row_id, UNION_TARGET_ID, target.get("box_xyxy_norm"))
            derived = derive_union_target(row)
            expected_box = derived["revised_box_xyxy_norm"]
            expected_center = derived["revised_center_xy_norm"]
            actual_center = [float(value) for value in target.get("center_xy_norm")]
            if not close_enough(union_box, expected_box):
                mismatches.append({"row_id": row_id, "field": "box_xyxy_norm", "expected": expected_box, "actual": union_box})
            if not close_enough(actual_center, expected_center):
                mismatches.append({"row_id": row_id, "field": "center_xy_norm", "expected": expected_center, "actual": actual_center})
            if float(target.get("visibility_confidence")) != derived["visibility_confidence"]:
                mismatches.append(
                    {
                        "row_id": row_id,
                        "field": "visibility_confidence",
                        "expected": derived["visibility_confidence"],
                        "actual": target.get("visibility_confidence"),
                    }
                )
            if derived["effective_margin_x"] < 0.02 or derived["effective_margin_y"] < 0.02:
                reduced_context_margin_rows.append(
                    {
                        "row_id": row_id,
                        "split": split,
                        "effective_margin_x": derived["effective_margin_x"],
                        "effective_margin_y": derived["effective_margin_y"],
                        "raw_union_box_xyxy_norm": derived["raw_box_xyxy_norm"],
                        "revised_box_xyxy_norm": derived["revised_box_xyxy_norm"],
                    }
                )
            union_support_by_split[split] += 1
            present_union_boxes_by_split[split].append(union_box)
            all_present_union_boxes.append(union_box)
            derivation_checks.append(
                {
                    "row_id": row_id,
                    "split": split,
                    "source_record_id": str(row.get("source_record_id")),
                    "signer_identity_hash": str(row.get("signer_identity_hash")),
                    "frame_index": frame_index,
                    "actual_box_xyxy_norm": union_box,
                    "derived_box_xyxy_norm": expected_box,
                    "box_matches_bounded_adaptive_margin": close_enough(union_box, expected_box),
                    "raw_union_width": derived["raw_width"],
                    "raw_union_height": derived["raw_height"],
                    "raw_union_area": derived["raw_area"],
                    "revised_width": derived["revised_width"],
                    "revised_height": derived["revised_height"],
                    "revised_area": derived["revised_area"],
                    "effective_margin_x": derived["effective_margin_x"],
                    "effective_margin_y": derived["effective_margin_y"],
                    "left_right_overlap_x": derived["left_right_overlap_x"],
                    "left_right_overlap_y": derived["left_right_overlap_y"],
                    "left_right_horizontal_gap": derived["left_right_horizontal_gap"],
                }
            )
        else:
            if present:
                mismatches.append({"row_id": row_id, "field": UNION_TARGET_ID, "expected": "absent for non-table", "actual": "present"})
            else:
                absent_non_table_count += 1

    if dict(split_counts) != EXPECTED_SPLIT_COUNTS:
        raise RemediationDiagnosticError(f"unexpected split counts: {dict(split_counts)}")
    if dict(union_support_by_split) != EXPECTED_UNION_SUPPORT_BY_SPLIT:
        raise RemediationDiagnosticError(f"unexpected union support counts: {dict(union_support_by_split)}")

    return {
        "packet": {"path": project_relative(packet_path), "sha256": packet_hash, "status": packet.get("status")},
        "target_schema": {"target_ids": target_ids, "contains_union_target": UNION_TARGET_ID in target_ids},
        "split_counts": dict(split_counts),
        "label_counts_by_split": {
            split: dict(sorted(counts.items())) for split, counts in sorted(label_counts_by_split.items())
        },
        "union_target_support_by_split": dict(union_support_by_split),
        "absent_non_table_count": absent_non_table_count,
        "source_ids": sorted(source_ids),
        "signer_hash_counts_by_split": {split: len(values) for split, values in sorted(signer_hashes_by_split.items())},
        "source_record_counts_by_split": {split: len(values) for split, values in sorted(source_records_by_split.items())},
        "tensor_frame_alignment": {
            "checked_row_count": len(tensor_checks),
            "hash_mismatch_count": sum(1 for item in tensor_checks if not item["hash_matches_packet"]),
            "frame_index_out_of_bounds_count": 0,
            "full_frame_reference_missing_count": 0,
            "rows": tensor_checks,
        },
        "smoke_packet_alignment": {
            "m3ae_ag_rows_matched_current_packet": len(smoke_alignment_mismatches) == 0,
            "mismatch_count": len(smoke_alignment_mismatches),
            "mismatches": smoke_alignment_mismatches,
            "smoke_receipt_row_count": len(smoke_rows),
        },
        "target_derivation_alignment": {
            "table_rows_checked": len(derivation_checks),
            "mismatch_count": len(mismatches),
            "mismatches": mismatches,
            "reduced_context_margin_rows": reduced_context_margin_rows,
            "rows": derivation_checks,
        },
        "geometry_summary": {
            "all_present_union_boxes": box_stats(all_present_union_boxes),
            "by_split": {
                split: box_stats(present_union_boxes_by_split[split])
                for split in ("train", "validation", "test")
            },
        },
    }


def classify_failure(packet_diagnostic: dict[str, Any], smoke_receipt: dict[str, Any]) -> dict[str, Any]:
    train_stats = packet_diagnostic["geometry_summary"]["by_split"]["train"]
    smoke_train = smoke_receipt["readiness_classification"]["detector0_local_smoke_path"]["actual"]
    m3ae_aa = read_json(REFERENCE_PATHS["m3ae_aa_expanded_packet_smoke"])
    table_right_behavior = m3ae_aa["readiness_classification"]["table_right_or_second_hand_behavior"]["actual"]
    packet_ok = (
        packet_diagnostic["target_derivation_alignment"]["mismatch_count"] == 0
        and packet_diagnostic["tensor_frame_alignment"]["hash_mismatch_count"] == 0
        and packet_diagnostic["smoke_packet_alignment"]["mismatch_count"] == 0
    )
    constant_train_mae = train_stats["median_constant_box_mae"]
    smoke_train_mae = smoke_train["train_present_box_mae"]
    smoke_gap = None if constant_train_mae is None else smoke_train_mae - constant_train_mae
    if packet_ok and constant_train_mae is not None and constant_train_mae <= 0.15 and smoke_train_mae > 0.15:
        classification = "smoke_implementation_instrumentation_issue"
        next_action = "detector0_union_target_training_smoke_continue"
        reason = (
            "Packet targets, tensor/frame alignment, and bounded-adaptive union derivation all check out, "
            "while a no-training median-box baseline over the train union targets has MAE below the train-path "
            "cap. The M3AE-AG smoke therefore failed to fit even a simple target-local box prior and needs "
            "smoke instrumentation or training-path repair before packet/schema changes."
        )
    elif not packet_ok:
        classification = "packet_data_issue"
        next_action = "detector0_two_hand_union_packet_mutation_continue"
        reason = "The diagnostic found packet, tensor, or smoke-row alignment mismatches that should be fixed in existing packet metadata."
    else:
        classification = "target_schema_issue"
        next_action = "detector0_two_hand_union_schema_revision"
        reason = "The diagnostic did not find an alignment bug, but the target geometry still fails the local train-path gate."
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "ruled_out": {
            "packet_data_issue": packet_diagnostic["target_derivation_alignment"]["mismatch_count"] == 0,
            "tensor_frame_alignment_issue": packet_diagnostic["tensor_frame_alignment"]["hash_mismatch_count"] == 0
            and packet_diagnostic["tensor_frame_alignment"]["frame_index_out_of_bounds_count"] == 0,
            "target_schema_issue": classification != "target_schema_issue",
            "insufficient_no_new_source_support": packet_diagnostic["union_target_support_by_split"]
            == EXPECTED_UNION_SUPPORT_BY_SPLIT,
            "stop_reduced_claim_condition": True,
        },
        "supporting_observations": {
            "m3ae_ag_train_present_box_mae": smoke_train_mae,
            "train_path_box_mae_cap": 0.15,
            "train_union_median_constant_box_mae": constant_train_mae,
            "smoke_minus_median_constant_mae": smoke_gap,
            "m3ae_ag_train_presence_accuracy": smoke_train["train_presence_accuracy"],
            "m3ae_ag_loss_drop_fraction": smoke_train["loss_drop_fraction_from_initial_to_best"],
            "m3ae_aa_table_right_train_box_mae": table_right_behavior["train"]["box_mae_if_present"],
            "m3ae_aa_table_right_validation_presence_accuracy": table_right_behavior["validation"][
                "presence_accuracy"
            ],
            "m3ae_aa_table_right_test_presence_accuracy": table_right_behavior["test"]["presence_accuracy"],
        },
    }


def next_action_description(next_action: str) -> str:
    if next_action == "detector0_union_target_training_smoke_continue":
        return (
            "Fix the local union-target smoke instrumentation/training path so it records row-level predictions "
            "and target-local constant baselines, then rerun one bounded local no-spend smoke."
        )
    if next_action == "detector0_two_hand_union_packet_mutation_continue":
        return "Apply a bounded existing-row packet metadata correction without row additions or training."
    if next_action == "detector0_two_hand_union_schema_revision":
        return "Revise the union/contact target schema before any packet correction, ablation, or training."
    if next_action == "crop_normalization_union_target_ablation_design":
        return "Design a bounded fixed-crop versus Detector 0 union-target crop-normalization comparison."
    if next_action == "stop_reduced_claim":
        return "Stop and reduce the Detector 0 claim because no bounded no-new-source path is justified."
    return "Stop until a recognized M3AE-AH next action is selected."


def brev_no_spend_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True, timeout=30)
    except Exception as error:  # noqa: BLE001 - record no-spend proof even when the CLI is unavailable.
        return {
            "checked": False,
            "command": "brev ls --json",
            "compute_used": False,
            "sync_or_training_used": False,
            "remote_training_used": False,
            "planned_remote_command": "none",
            "max_runtime_minutes": 0,
            "max_spend_usd": 0,
            "human_spend_approval": False,
            "error": str(error),
            "manual_stop_command": "brev stop asl-pilot-rawframe-001",
            "manual_stop_command_run": False,
        }
    parsed: Any = None
    if result.stdout.strip():
        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError:
            parsed = {"raw_stdout": result.stdout.strip()}
    return {
        "checked": result.returncode == 0,
        "command": "brev ls --json",
        "returncode": result.returncode,
        "compute_used": False,
        "sync_or_training_used": False,
        "remote_training_used": False,
        "planned_remote_command": "none",
        "max_runtime_minutes": 0,
        "max_spend_usd": 0,
        "human_spend_approval": False,
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def main() -> int:
    args = parse_args()
    torch = import_torch()
    smoke_receipt = read_json(REFERENCE_PATHS["m3ae_ag_union_training_smoke"])
    packet_diagnostic = inspect_packet_and_tensors(torch, args.packet.resolve(), smoke_receipt)
    classification = classify_failure(packet_diagnostic, smoke_receipt)
    next_action = classification["next_action"]

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-AH Detector 0 union-target data/schema remediation",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {"path": project_relative(args.output)},
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "diagnostic_runner": file_ref(Path(__file__).resolve()),
        },
        "failure_source_of_truth": {
            "receipt": file_ref(REFERENCE_PATHS["m3ae_ag_union_training_smoke"]),
            "next_action": smoke_receipt["next_action"]["id"],
            "classification": smoke_receipt["readiness_classification"]["classification"],
            "train_path": smoke_receipt["readiness_classification"]["detector0_local_smoke_path"],
            "table_union_behavior": smoke_receipt["readiness_classification"][
                "table_two_hand_union_or_contact_region_behavior"
            ],
        },
        "packet_tensor_target_alignment": packet_diagnostic,
        "classification": classification,
        "no_pretrained_provenance": {
            "allowed_source_ids": ["popsign-v1-original-videos"],
            "source_expansion": False,
            "label_expansion": False,
            "unapproved_media_import": False,
            "pretrained_detector_outputs": False,
            "pretrained_landmarks": False,
            "pretrained_backbones_or_embeddings": False,
            "generated_pseudo_labels": False,
        },
        "brev_no_spend_boundary": brev_no_spend_status(),
        "final_promotion_blocker_separation": {
            "hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this read-only union-target diagnostic",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "detector0_training": False,
            "training_smoke_rerun": False,
            "crop_normalization_ablation": False,
            "recognizer_training": False,
            "packet_mutation": False,
            "rows_added": False,
            "brev_sync": False,
            "brev_training": False,
            "brev_spend": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "label_expansion": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "product_runtime_code_change": False,
            "pretrained_detector_or_landmark_use": False,
            "generated_pseudo_label_use": False,
            "push": False,
            "broad_run_redirect": False,
        },
        "next_action": {
            "id": next_action,
            "description": next_action_description(next_action),
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "classification": classification["classification"],
                "next_action": next_action,
                "packet_alignment_mismatches": packet_diagnostic["target_derivation_alignment"]["mismatch_count"],
                "smoke_packet_alignment_mismatches": packet_diagnostic["smoke_packet_alignment"]["mismatch_count"],
                "tensor_hash_mismatches": packet_diagnostic["tensor_frame_alignment"]["hash_mismatch_count"],
                "train_union_median_constant_box_mae": classification["supporting_observations"][
                    "train_union_median_constant_box_mae"
                ],
                "m3ae_ag_train_present_box_mae": classification["supporting_observations"][
                    "m3ae_ag_train_present_box_mae"
                ],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RemediationDiagnosticError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
