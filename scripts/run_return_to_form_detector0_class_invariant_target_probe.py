#!/usr/bin/env python3
"""Run the M3EA Detector 0 class-invariant target formulation probe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import shlex
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_training_smoke import (
    ROOT,
    Detector0SmokeError,
    box_iou,
    file_ref,
    load_tensor_payload,
    project_relative,
    read_json,
    resolve_packet_tensor_path,
    validate_box,
    write_json,
)
from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import brev_no_spend_status
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe import (
    as_float_list,
    coordconv_full_frame_feature,
)
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2 import (
    GRID_SIZE,
    balanced_focal_bce,
    boxes_from_map,
    gather_at_cells,
    selected_cells,
    target_cells,
    target_heatmap,
)
from train_rawframe_model import TrainingError, import_torch, sha256_file


SCHEMA_VERSION = "asl-pilot-return-to-form-detector0-class-invariant-target-probe/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-detector0-class-invariant-target-probe-v1.json"
)
SESSION_LOG = "docs/session-logs/496-mission-3ea-detector0-class-invariant-target-probe.md"
TARGET_IDS = [
    "left_or_first_hand",
    "head_or_face",
    "upper_body_or_signing_space",
    "right_or_second_hand",
    "table_two_hand_union_or_contact_region",
]
PRIMARY_PROBE_TARGET_IDS = [
    "left_or_first_hand",
    "head_or_face",
    "upper_body_or_signing_space",
]
ALLOWED_LABEL_SOURCES = {"manual_verified_from_fixed_crop_context"}
ALLOWED_ANNOTATION_SOURCES = {
    "manual_verified_from_fixed_crop_context",
    "manual_corrected_from_m3ae_y_candidate_review",
}
ALLOWED_REVIEW_STATUSES = {"manual_verified", "manual_corrected"}
FIXED_PRESENCE_THRESHOLD = 0.5
DEFAULT_SEED = 223607
REFERENCE_PATHS = {
    "active_prompt": ROOT
    / "docs"
    / "model"
    / "return-to-form-detector0-class-invariant-target-probe-goal-loop-prompt.md",
    "goal": ROOT / "GOAL.md",
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "m3dy_objectness_repair": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-objectness-repair-v1.json",
    "m3dz_packet_support_diagnosis": ROOT
    / "docs"
    / "validation"
    / "return-to-form-detector0-packet-support-diagnosis-v1.json",
    "packet": DEFAULT_PACKET,
    "model_card": ROOT / "web" / "public" / "model" / "model-card.json",
    "active_vocabulary_claim": ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    "runner": Path(__file__).resolve(),
}
COMMANDS_RUN = [
    "git status --short --branch",
    "git log -10 --oneline --decorate",
    "node scripts/audit_loop_premise.mjs --json",
    "node scripts/audit_return_to_form_plan.mjs --json",
    "node scripts/audit_no_pretrained_deps.mjs",
    "node scripts/audit_no_pretrained_artifact_json.mjs",
    "node scripts/audit_source_register.mjs",
    "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_detector0_class_invariant_target_probe.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_detector0_class_invariant_target_probe.py",
    "python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null",
    "git diff --check",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    parser.add_argument("--max-epochs", type=int, default=120)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--weight-decay", type=float, default=0.0001)
    parser.add_argument("--gradient-clip", type=float, default=1.0)
    parser.add_argument("--smooth-l1-beta", type=float, default=0.02)
    parser.add_argument("--iou-loss-weight", type=float, default=0.25)
    parser.add_argument("--focal-gamma", type=float, default=2.0)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    return parser.parse_args()


def choose_device(torch: Any, requested: str) -> Any:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "mps":
        if not torch.backends.mps.is_available():
            raise Detector0SmokeError("requested MPS device is not available")
        return torch.device("mps")
    raise Detector0SmokeError(f"unsupported device: {requested}")


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * fraction
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return float(ordered[lower])
    weight = index - lower
    return float(ordered[lower] * (1.0 - weight) + ordered[upper] * weight)


def distribution(values: list[float]) -> dict[str, Any]:
    if not values:
        return {
            "count": 0,
            "min": None,
            "p25": None,
            "median": None,
            "mean": None,
            "p75": None,
            "max": None,
        }
    return {
        "count": len(values),
        "min": min(values),
        "p25": percentile(values, 0.25),
        "median": statistics.median(values),
        "mean": statistics.fmean(values),
        "p75": percentile(values, 0.75),
        "max": max(values),
    }


def encode_target(row: dict[str, Any], target_id: str) -> tuple[float, list[float] | None]:
    row_id = str(row.get("row_id"))
    targets = row.get("targets")
    if not isinstance(targets, dict):
        raise Detector0SmokeError(f"{row_id} missing targets")
    target = targets.get(target_id)
    if not isinstance(target, dict):
        raise Detector0SmokeError(f"{row_id} missing target {target_id}")
    is_present = bool(target.get("presence"))
    if is_present:
        return 1.0, validate_box(row_id, target_id, target.get("box_xyxy_norm"))
    if target.get("box_xyxy_norm") is not None:
        raise Detector0SmokeError(f"{row_id}:{target_id} absent target should not have a box")
    return 0.0, None


def validate_row(row: dict[str, Any]) -> None:
    row_id = str(row.get("row_id"))
    split = str(row.get("split"))
    source_id = str(row.get("source_id"))
    if split not in {"train", "validation", "test"}:
        raise Detector0SmokeError(f"{row_id} has unsupported split={split}")
    if source_id != "popsign-v1-original-videos":
        raise Detector0SmokeError(f"{row_id} uses unexpected source_id={source_id}")
    if row.get("label_source") not in ALLOWED_LABEL_SOURCES:
        raise Detector0SmokeError(f"{row_id} uses unsupported label_source={row.get('label_source')}")
    if row.get("annotation_source") not in ALLOWED_ANNOTATION_SOURCES:
        raise Detector0SmokeError(f"{row_id} uses unsupported annotation_source={row.get('annotation_source')}")
    if row.get("review_status") not in ALLOWED_REVIEW_STATUSES:
        raise Detector0SmokeError(f"{row_id} uses unsupported review_status={row.get('review_status')}")


def target_support_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    labels = sorted({str(row.get("label_id")) for row in rows})
    splits = ["train", "validation", "test"]
    result: dict[str, Any] = {}
    for target_id in TARGET_IDS:
        counts_by_label: dict[str, dict[str, int]] = {
            label: {"present": 0, "absent": 0} for label in labels
        }
        counts_by_split: dict[str, dict[str, int]] = {
            split: {"present": 0, "absent": 0} for split in splits
        }
        counts_by_split_label: dict[str, dict[str, dict[str, int]]] = {
            split: {label: {"present": 0, "absent": 0} for label in labels} for split in splits
        }
        present_by_row: list[bool] = []
        boxes_by_split: dict[str, list[list[float]]] = defaultdict(list)

        for row in rows:
            split = str(row.get("split"))
            label = str(row.get("label_id"))
            presence, box = encode_target(row, target_id)
            bucket = "present" if presence else "absent"
            counts_by_label[label][bucket] += 1
            counts_by_split[split][bucket] += 1
            counts_by_split_label[split][label][bucket] += 1
            present_by_row.append(bool(presence))
            if box is not None:
                boxes_by_split[split].append(box)

        present_count = sum(1 for item in present_by_row if item)
        absent_count = len(present_by_row) - present_count
        present_labels = sorted(label for label, counts in counts_by_label.items() if counts["present"])
        absent_labels = sorted(label for label, counts in counts_by_label.items() if counts["absent"])
        labels_with_both = sorted(
            label for label, counts in counts_by_label.items() if counts["present"] and counts["absent"]
        )
        target_presence_equivalent_to_table = all(
            present == (str(row.get("label_id")) == "table")
            for present, row in zip(present_by_row, rows, strict=True)
        )
        if absent_count == 0 and set(present_labels) == set(labels):
            classification = "class_invariant_all_present_no_presence_contrast"
        elif target_presence_equivalent_to_table:
            classification = "label_confounded_table_presence"
        elif set(present_labels) == set(labels):
            classification = "class_invariant_with_some_absence_contrast"
        else:
            classification = "not_class_invariant_in_current_packet"

        result[target_id] = {
            "global": {"present": present_count, "absent": absent_count, "total": len(present_by_row)},
            "counts_by_label": counts_by_label,
            "counts_by_split": counts_by_split,
            "counts_by_split_label": counts_by_split_label,
            "present_labels": present_labels,
            "absent_labels": absent_labels,
            "labels_with_both_present_and_absent": labels_with_both,
            "has_presence_contrast": absent_count > 0 and present_count > 0,
            "has_within_label_presence_contrast": bool(labels_with_both),
            "target_presence_equivalent_to_label_id_table": target_presence_equivalent_to_table,
            "classification": classification,
            "primary_probe_candidate": target_id in PRIMARY_PROBE_TARGET_IDS and classification.startswith(
                "class_invariant"
            ),
            "box_count_by_split": {split: len(boxes_by_split[split]) for split in splits},
        }
    return result


def load_probe_dataset(torch: Any, packet_path: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    packet = read_json(packet_path)
    packet_hash = sha256_file(packet_path)
    if packet.get("status") != "expanded_packet_ready_for_detector0_smoke":
        raise Detector0SmokeError(f"packet status is not expanded-smoke ready: {packet.get('status')}")
    schema = packet.get("target_schema", {})
    schema_target_ids = schema.get("target_ids")
    if not isinstance(schema_target_ids, list) or any(target_id not in schema_target_ids for target_id in TARGET_IDS):
        raise Detector0SmokeError("packet target_schema does not include every M3EA target id")
    if schema.get("excluded") and any(
        item in schema.get("excluded", [])
        for item in ("pretrained_detector_outputs", "pretrained_generated_labels")
    ):
        excluded_pretrained_shortcuts = True
    else:
        excluded_pretrained_shortcuts = False
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise Detector0SmokeError("M3EA target probe expects exactly 32 packet rows")

    features_by_split: dict[str, list[Any]] = defaultdict(list)
    row_records_by_split: dict[str, list[dict[str, Any]]] = defaultdict(list)
    target_presence_by_split: dict[str, dict[str, list[float]]] = {
        target_id: defaultdict(list) for target_id in TARGET_IDS
    }
    target_boxes_by_split: dict[str, dict[str, list[list[float]]]] = {
        target_id: defaultdict(list) for target_id in TARGET_IDS
    }
    split_counts: Counter[str] = Counter()
    label_counts_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    source_ids = set()
    tensor_hashes_checked = 0

    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise Detector0SmokeError(f"frame_rows[{index}] must be an object")
        validate_row(row)
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))

        tensor_path = resolve_packet_tensor_path(packet_path, row)
        expected_hash = str(row.get("frame_tensor_sha256"))
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise Detector0SmokeError(
                f"{row_id} tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
            )
        payload = load_tensor_payload(torch, tensor_path)
        feature = coordconv_full_frame_feature(torch, payload, int(row.get("frame_index")), row_id)

        row_record = {
            "row_id": row_id,
            "clip_id": str(row.get("clip_id")),
            "split": split,
            "label_id": label_id,
            "source_record_id": str(row.get("source_record_id")),
            "signer_identity_hash": str(row.get("signer_identity_hash")),
            "frame_index": int(row.get("frame_index")),
            "tensor_path": project_relative(tensor_path),
            "tensor_sha256": actual_hash,
            "review_status": str(row.get("review_status")),
            "annotation_source": str(row.get("annotation_source")),
        }
        features_by_split[split].append(feature)
        row_records_by_split[split].append(row_record)
        split_counts[split] += 1
        label_counts_by_split[split][label_id] += 1
        source_ids.add(str(row.get("source_id")))
        tensor_hashes_checked += 1

        for target_id in TARGET_IDS:
            presence, box = encode_target(row, target_id)
            target_presence_by_split[target_id][split].append(presence)
            target_boxes_by_split[target_id][split].append(box if box is not None else [0.0, 0.0, 0.0, 0.0])

    if dict(split_counts) != {"train": 11, "validation": 11, "test": 10}:
        raise Detector0SmokeError(f"unexpected packet split counts: {dict(split_counts)}")

    base_by_split: dict[str, dict[str, Any]] = {}
    for split in ("train", "validation", "test"):
        base_by_split[split] = {
            "x": torch.stack(features_by_split[split], dim=0),
            "rows": row_records_by_split[split],
        }

    target_datasets: dict[str, dict[str, dict[str, Any]]] = {}
    for target_id in TARGET_IDS:
        target_datasets[target_id] = {}
        for split in ("train", "validation", "test"):
            rows_with_target = []
            for row_record, presence in zip(
                row_records_by_split[split],
                target_presence_by_split[target_id][split],
                strict=True,
            ):
                rows_with_target.append({**row_record, "target_id": target_id, "target_present": bool(presence)})
            target_datasets[target_id][split] = {
                **base_by_split[split],
                "presence": torch.tensor(target_presence_by_split[target_id][split], dtype=torch.float32),
                "boxes": torch.tensor(target_boxes_by_split[target_id][split], dtype=torch.float32),
                "rows": rows_with_target,
            }

    support = target_support_summary(rows)
    evidence = {
        "packet": {"path": project_relative(packet_path), "sha256": packet_hash},
        "packet_status": packet.get("status"),
        "schema_target_ids": schema_target_ids,
        "schema_excludes_pretrained_shortcuts": excluded_pretrained_shortcuts,
        "split_counts": dict(split_counts),
        "label_counts_by_split": {
            split: dict(sorted(counts.items())) for split, counts in sorted(label_counts_by_split.items())
        },
        "source_ids": sorted(source_ids),
        "target_ids_quantified": TARGET_IDS,
        "primary_probe_target_ids": PRIMARY_PROBE_TARGET_IDS,
        "tensor_hashes_checked": tensor_hashes_checked,
        "rows_by_split": {split: base_by_split[split]["rows"] for split in ("train", "validation", "test")},
        "target_support": support,
    }
    return target_datasets, evidence


def train_anchor_and_scale(torch: Any, train_presence: Any, train_boxes: Any) -> tuple[Any, Any]:
    present_boxes = train_boxes[train_presence.bool()]
    if int(present_boxes.shape[0]) == 0:
        raise Detector0SmokeError("cannot build anchor box without train present boxes")
    anchor = present_boxes.median(dim=0).values
    max_abs_deviation = (present_boxes - anchor).abs().max(dim=0).values
    residual_scale = (max_abs_deviation + 0.04).clamp(min=0.06, max=0.50)
    return anchor, residual_scale


def build_target_spatial_model(torch: Any, train_positive_count: int, train_sample_count: int) -> Any:
    class TargetSpatialObjectnessDetector(torch.nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.features = torch.nn.Sequential(
                torch.nn.Conv2d(5, 16, kernel_size=3, padding=1),
                torch.nn.GroupNorm(4, 16),
                torch.nn.SiLU(),
                torch.nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 32),
                torch.nn.SiLU(),
                torch.nn.Conv2d(32, 48, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 48),
                torch.nn.SiLU(),
                torch.nn.Conv2d(48, 64, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 64),
                torch.nn.SiLU(),
                torch.nn.Conv2d(64, 64, kernel_size=3, padding=1),
                torch.nn.GroupNorm(8, 64),
                torch.nn.SiLU(),
            )
            self.objectness_head = torch.nn.Conv2d(64, 1, kernel_size=1)
            self.box_head = torch.nn.Conv2d(64, 4, kernel_size=1)
            self.reset_parameters()

        def reset_parameters(self) -> None:
            for module in self.modules():
                if isinstance(module, torch.nn.Conv2d):
                    torch.nn.init.kaiming_normal_(module.weight, nonlinearity="linear")
                    if module.bias is not None:
                        torch.nn.init.zeros_(module.bias)
            positive_cell_prior = train_positive_count / max(1.0, train_sample_count * GRID_SIZE * GRID_SIZE)
            positive_cell_prior = min(max(positive_cell_prior, 1e-4), 1.0 - 1e-4)
            self.objectness_head.bias.data.fill_(math.log(positive_cell_prior / (1.0 - positive_cell_prior)))
            torch.nn.init.zeros_(self.box_head.weight)
            torch.nn.init.zeros_(self.box_head.bias)

        def forward(self, x: Any) -> tuple[Any, Any]:
            encoded = self.features(x)
            if tuple(encoded.shape[-2:]) != (GRID_SIZE, GRID_SIZE):
                raise Detector0SmokeError(f"spatial map must be {GRID_SIZE}x{GRID_SIZE}; got {tuple(encoded.shape)}")
            return self.objectness_head(encoded), self.box_head(encoded)

    return TargetSpatialObjectnessDetector()


def probe_loss(
    torch: Any,
    objectness_logits: Any,
    raw_residual_map: Any,
    presence: Any,
    boxes: Any,
    anchor_box: Any,
    residual_scale: Any,
    args: argparse.Namespace,
) -> tuple[Any, dict[str, float]]:
    cell_y, cell_x = target_cells(torch, presence, boxes)
    heatmap = target_heatmap(torch, presence, cell_y, cell_x)
    objectness_loss, objectness_parts = balanced_focal_bce(torch, objectness_logits, heatmap, args.focal_gamma)
    predicted_residual_map, predicted_box_map = boxes_from_map(torch, raw_residual_map, anchor_box, residual_scale)
    present_mask = presence.bool()
    if bool(present_mask.any().detach().cpu().item()):
        target_residual = boxes[present_mask] - anchor_box
        target_cell_residual = gather_at_cells(torch, predicted_residual_map, cell_y, cell_x)[present_mask]
        target_cell_box = gather_at_cells(torch, predicted_box_map, cell_y, cell_x)[present_mask]
        residual_loss = torch.nn.functional.smooth_l1_loss(
            target_cell_residual,
            target_residual,
            beta=args.smooth_l1_beta,
        )
        iou_loss = (1.0 - box_iou(torch, target_cell_box, boxes[present_mask])).mean()
    else:
        residual_loss = torch.zeros((), device=objectness_logits.device)
        iou_loss = torch.zeros((), device=objectness_logits.device)
    iou_weighted = args.iou_loss_weight * iou_loss
    total_loss = objectness_loss + residual_loss + iou_weighted
    return total_loss, {
        "total": float(total_loss.detach().cpu().item()),
        **objectness_parts,
        "smooth_l1_target_cell_residual": float(residual_loss.detach().cpu().item()),
        "iou": float(iou_loss.detach().cpu().item()),
        "iou_weighted": float(iou_weighted.detach().cpu().item()),
    }


def summarize_rows(torch: Any, rows: list[dict[str, Any]]) -> dict[str, Any]:
    if not rows:
        return {}
    present_rows = [row for row in rows if row["target_present"]]
    presence_targets = [bool(row["target_present"]) for row in rows]
    presence_predictions = [bool(row["predicted_present"]) for row in rows]
    true_positive_count = sum(1 for pred, target in zip(presence_predictions, presence_targets, strict=True) if pred and target)
    true_negative_count = sum(1 for pred, target in zip(presence_predictions, presence_targets, strict=True) if not pred and not target)
    false_positive_count = sum(1 for pred, target in zip(presence_predictions, presence_targets, strict=True) if pred and not target)
    false_negative_count = sum(1 for pred, target in zip(presence_predictions, presence_targets, strict=True) if not pred and target)

    if present_rows:
        selected_mae = [float(row["selected_cell_box_mae_if_present"]) for row in present_rows]
        selected_iou = [float(row["selected_cell_box_iou_if_present"]) for row in present_rows]
        target_cell_mae = [float(row["target_cell_box_mae_if_present"]) for row in present_rows]
        target_cell_iou = [float(row["target_cell_box_iou_if_present"]) for row in present_rows]
        median_mae = [float(row["median_box_mae_if_present"]) for row in present_rows]
        median_iou = [float(row["median_box_iou_if_present"]) for row in present_rows]
        selected_matches = [1.0 if row["selected_cell_matches_target_cell_if_present"] else 0.0 for row in present_rows]
        target_ranks = [float(row["target_cell_objectness_rank_if_present"]) for row in present_rows]
    else:
        selected_mae = []
        selected_iou = []
        target_cell_mae = []
        target_cell_iou = []
        median_mae = []
        median_iou = []
        selected_matches = []
        target_ranks = []

    row_level_presence_meaningful = any(not row["target_present"] for row in rows) and any(
        row["target_present"] for row in rows
    )
    return {
        "sample_count": len(rows),
        "present_support": len(present_rows),
        "absent_support": len(rows) - len(present_rows),
        "row_level_presence": {
            "fixed_threshold": FIXED_PRESENCE_THRESHOLD,
            "presence_accuracy": (true_positive_count + true_negative_count) / len(rows),
            "predicted_present_rate": sum(1 for pred in presence_predictions if pred) / len(rows),
            "true_positive_count": true_positive_count,
            "true_negative_count": true_negative_count,
            "false_positive_count": false_positive_count,
            "false_negative_count": false_negative_count,
            "meaningful_for_objectness": row_level_presence_meaningful,
            "interpretation": (
                "not meaningful for objectness when all rows are present"
                if not row_level_presence_meaningful
                else "contains both present and absent rows"
            ),
        },
        "spatial_objectness": {
            "max_map_score_distribution": distribution([float(row["max_map_objectness_score"]) for row in rows]),
            "target_cell_score_distribution_present_only": distribution(
                [float(row["target_cell_objectness_score_if_present"]) for row in present_rows]
            ),
            "selected_cell_matches_target_cell_rate_present_only": statistics.fmean(selected_matches)
            if selected_matches
            else None,
            "target_cell_rank_distribution_present_only": distribution(target_ranks),
            "target_cell_rank_1_rate_present_only": statistics.fmean(
                [1.0 if row["target_cell_objectness_rank_if_present"] == 1 else 0.0 for row in present_rows]
            )
            if present_rows
            else None,
        },
        "box_localization": {
            "selected_cell_box_mae": statistics.fmean(selected_mae) if selected_mae else None,
            "selected_cell_box_mean_iou": statistics.fmean(selected_iou) if selected_iou else None,
            "target_cell_box_mae": statistics.fmean(target_cell_mae) if target_cell_mae else None,
            "target_cell_box_mean_iou": statistics.fmean(target_cell_iou) if target_cell_iou else None,
            "median_constant_box_mae": statistics.fmean(median_mae) if median_mae else None,
            "median_constant_box_mean_iou": statistics.fmean(median_iou) if median_iou else None,
            "selected_cell_minus_median_box_mae": (
                None if not selected_mae or not median_mae else statistics.fmean(selected_mae) - statistics.fmean(median_mae)
            ),
            "target_cell_minus_median_box_mae": (
                None
                if not target_cell_mae or not median_mae
                else statistics.fmean(target_cell_mae) - statistics.fmean(median_mae)
            ),
        },
    }


def row_level_predictions(
    torch: Any,
    model: Any,
    values: dict[str, Any],
    anchor_box: Any,
    residual_scale: Any,
) -> list[dict[str, Any]]:
    model.eval()
    with torch.no_grad():
        objectness_logits, raw_residual_map = model(values["x"])
        predicted_residual_map, predicted_box_map = boxes_from_map(torch, raw_residual_map, anchor_box, residual_scale)
        max_scores, selected_y, selected_x = selected_cells(torch, objectness_logits)
        selected_box = gather_at_cells(torch, predicted_box_map, selected_y, selected_x)
        target_y, target_x = target_cells(torch, values["presence"], values["boxes"])
        target_cell_box = gather_at_cells(torch, predicted_box_map, target_y, target_x)
        objectness_map = torch.sigmoid(objectness_logits)
        target_cell_scores = gather_at_cells(torch, objectness_map, target_y, target_x)[:, 0]

    rows = []
    for index, row in enumerate(values["rows"]):
        target_present = bool(values["presence"][index].item())
        predicted_present = bool(max_scores[index].item() >= FIXED_PRESENCE_THRESHOLD)
        target_box = values["boxes"][index]
        row_selected_box = selected_box[index]
        row_target_cell_box = target_cell_box[index]

        if target_present:
            flat_scores = objectness_map[index, 0].flatten()
            target_flat_index = int((target_y[index] * GRID_SIZE + target_x[index]).item())
            target_score = flat_scores[target_flat_index]
            target_rank = int((flat_scores > target_score).sum().item()) + 1
            median_abs_errors = (anchor_box - target_box).abs()
            selected_abs_errors = (row_selected_box - target_box).abs()
            target_cell_abs_errors = (row_target_cell_box - target_box).abs()
            median_mae = float(median_abs_errors.mean().item())
            selected_mae = float(selected_abs_errors.mean().item())
            target_cell_mae = float(target_cell_abs_errors.mean().item())
            median_iou = float(box_iou(torch, anchor_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            selected_iou = float(box_iou(torch, row_selected_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            target_cell_iou = float(box_iou(torch, row_target_cell_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            target_box_list = as_float_list(target_box)
            target_cell_yx = [int(target_y[index].item()), int(target_x[index].item())]
            target_cell_score_value = float(target_cell_scores[index].item())
            selected_matches_target = [
                int(selected_y[index].item()),
                int(selected_x[index].item()),
            ] == target_cell_yx
        else:
            target_rank = None
            median_mae = None
            selected_mae = None
            target_cell_mae = None
            median_iou = None
            selected_iou = None
            target_cell_iou = None
            target_box_list = None
            target_cell_yx = None
            target_cell_score_value = None
            selected_matches_target = None

        rows.append(
            {
                "row_id": row["row_id"],
                "clip_id": row["clip_id"],
                "split": row["split"],
                "label_id": row["label_id"],
                "source_record_id": row["source_record_id"],
                "signer_identity_hash": row["signer_identity_hash"],
                "target_id": row["target_id"],
                "target_present": target_present,
                "fixed_presence_threshold": FIXED_PRESENCE_THRESHOLD,
                "max_map_objectness_score": float(max_scores[index].item()),
                "predicted_present": predicted_present,
                "presence_correct": predicted_present == target_present,
                "selected_cell_yx": [int(selected_y[index].item()), int(selected_x[index].item())],
                "target_cell_yx_if_present": target_cell_yx,
                "selected_cell_matches_target_cell_if_present": selected_matches_target,
                "target_cell_objectness_score_if_present": target_cell_score_value,
                "target_cell_objectness_rank_if_present": target_rank,
                "target_box_xyxy_norm": target_box_list,
                "median_anchor_box_xyxy_norm": as_float_list(anchor_box),
                "residual_scale_xyxy_norm": as_float_list(residual_scale),
                "selected_cell_predicted_box_xyxy_norm": as_float_list(row_selected_box),
                "target_cell_predicted_box_xyxy_norm_if_present": as_float_list(row_target_cell_box)
                if target_present
                else None,
                "median_box_mae_if_present": median_mae,
                "median_box_iou_if_present": median_iou,
                "selected_cell_box_mae_if_present": selected_mae,
                "selected_cell_box_iou_if_present": selected_iou,
                "target_cell_box_mae_if_present": target_cell_mae,
                "target_cell_box_iou_if_present": target_cell_iou,
            }
        )
    return rows


def evaluate_probe_split(
    torch: Any,
    model: Any,
    values: dict[str, Any],
    anchor_box: Any,
    residual_scale: Any,
    args: argparse.Namespace,
) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        objectness_logits, raw_residual_map = model(values["x"])
        _loss, losses = probe_loss(
            torch,
            objectness_logits,
            raw_residual_map,
            values["presence"],
            values["boxes"],
            anchor_box,
            residual_scale,
            args,
        )
    rows = row_level_predictions(torch, model, values, anchor_box, residual_scale)
    return {"loss": losses, **summarize_rows(torch, rows), "rows": rows}


def train_target_probe(torch: Any, args: argparse.Namespace, target_id: str, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    train_positive_count = int(dataset["train"]["presence"].sum().item())
    train_sample_count = int(dataset["train"]["presence"].shape[0])
    model = build_target_spatial_model(torch, train_positive_count, train_sample_count).to(device)
    anchor_box, residual_scale = train_anchor_and_scale(
        torch,
        dataset["train"]["presence"],
        dataset["train"]["boxes"],
    )
    anchor_box = anchor_box.to(device)
    residual_scale = residual_scale.to(device)
    device_dataset = {
        split: {
            **values,
            "x": values["x"].to(device),
            "presence": values["presence"].to(device),
            "boxes": values["boxes"].to(device),
        }
        for split, values in dataset.items()
    }
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    initial_metrics = evaluate_probe_split(torch, model, device_dataset["train"], anchor_box, residual_scale, args)
    history = [
        {
            "epoch": 0,
            "train_loss": initial_metrics["loss"],
            "train_row_level_presence_accuracy": initial_metrics["row_level_presence"]["presence_accuracy"],
            "train_selected_cell_box_mae": initial_metrics["box_localization"]["selected_cell_box_mae"],
            "train_target_cell_box_mae": initial_metrics["box_localization"]["target_cell_box_mae"],
            "train_median_constant_box_mae": initial_metrics["box_localization"]["median_constant_box_mae"],
        }
    ]
    best_train_loss = initial_metrics["loss"]["total"]

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        objectness_logits, raw_residual_map = model(device_dataset["train"]["x"])
        loss, _losses = probe_loss(
            torch,
            objectness_logits,
            raw_residual_map,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
            anchor_box,
            residual_scale,
            args,
        )
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), args.gradient_clip)
        optimizer.step()

        if epoch <= 5 or epoch % 20 == 0 or epoch == args.max_epochs:
            train_metrics = evaluate_probe_split(torch, model, device_dataset["train"], anchor_box, residual_scale, args)
            best_train_loss = min(best_train_loss, train_metrics["loss"]["total"])
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_row_level_presence_accuracy": train_metrics["row_level_presence"]["presence_accuracy"],
                    "train_selected_cell_box_mae": train_metrics["box_localization"]["selected_cell_box_mae"],
                    "train_target_cell_box_mae": train_metrics["box_localization"]["target_cell_box_mae"],
                    "train_median_constant_box_mae": train_metrics["box_localization"]["median_constant_box_mae"],
                }
            )

    metrics = {
        split: evaluate_probe_split(torch, model, values, anchor_box, residual_scale, args)
        for split, values in device_dataset.items()
    }
    final_train_loss = metrics["train"]["loss"]["total"]
    initial_loss = initial_metrics["loss"]["total"]
    return {
        "target_id": target_id,
        "device": str(device),
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": args.max_epochs,
        "anchor_box_source": "train_present_median_for_target",
        "anchor_box_xyxy_norm": as_float_list(anchor_box),
        "residual_scale_xyxy_norm": as_float_list(residual_scale),
        "history": history,
        "metrics": {split: {key: value for key, value in split_metrics.items() if key != "rows"} for split, split_metrics in metrics.items()},
        "row_level_predictions": {split: metrics[split]["rows"] for split in ("train", "validation", "test")},
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_recorded_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best_recorded": (initial_loss - best_train_loss) / initial_loss
            if initial_loss
            else None,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def split_dynamic_wins(metrics: dict[str, Any]) -> dict[str, Any]:
    wins: dict[str, Any] = {}
    for split in ("train", "validation", "test"):
        box = metrics[split]["box_localization"]
        selected_mae = box["selected_cell_box_mae"]
        selected_iou = box["selected_cell_box_mean_iou"]
        median_mae = box["median_constant_box_mae"]
        median_iou = box["median_constant_box_mean_iou"]
        target_cell_mae = box["target_cell_box_mae"]
        target_cell_iou = box["target_cell_box_mean_iou"]
        wins[split] = {
            "selected_cell_mae_lte_median": selected_mae is not None and median_mae is not None and selected_mae <= median_mae,
            "selected_cell_iou_gte_median": selected_iou is not None and median_iou is not None and selected_iou >= median_iou,
            "target_cell_mae_lte_median": target_cell_mae is not None and median_mae is not None and target_cell_mae <= median_mae,
            "target_cell_iou_gte_median": target_cell_iou is not None and median_iou is not None and target_cell_iou >= median_iou,
            "selected_cell_match_rate": metrics[split]["spatial_objectness"][
                "selected_cell_matches_target_cell_rate_present_only"
            ],
        }
    return wins


def classify_outcome(probe_results: dict[str, Any], packet_evidence: dict[str, Any]) -> dict[str, Any]:
    all_primary_all_present = all(
        packet_evidence["target_support"][target_id]["global"]["absent"] == 0 for target_id in PRIMARY_PROBE_TARGET_IDS
    )
    dynamic_spatial_candidates = []
    target_cell_only_candidates = []
    target_gate_results = {}
    for target_id, result in probe_results.items():
        wins = split_dynamic_wins(result["metrics"])
        selected_cell_heldout_win = all(
            wins[split]["selected_cell_mae_lte_median"] and wins[split]["selected_cell_iou_gte_median"]
            for split in ("validation", "test")
        )
        target_cell_heldout_win = all(
            wins[split]["target_cell_mae_lte_median"] and wins[split]["target_cell_iou_gte_median"]
            for split in ("validation", "test")
        )
        selected_cell_spatially_localized = all(
            (wins[split]["selected_cell_match_rate"] or 0.0) >= 0.50 for split in ("validation", "test")
        )
        target_gate_results[target_id] = {
            "per_split": wins,
            "selected_cell_heldout_box_beats_median": selected_cell_heldout_win,
            "target_cell_heldout_box_beats_median": target_cell_heldout_win,
            "selected_cell_match_rate_gte_0_50_on_heldout": selected_cell_spatially_localized,
        }
        if selected_cell_heldout_win and selected_cell_spatially_localized:
            dynamic_spatial_candidates.append(target_id)
        elif target_cell_heldout_win:
            target_cell_only_candidates.append(target_id)

    if dynamic_spatial_candidates:
        classification = "class_invariant_dynamic_spatial_signal_without_presence_contrast"
        next_action = "continue_detector0_class_invariant_probe_no_brev"
        reason = (
            "At least one all-present class-invariant packet target beat its train-median fixed box on held-out "
            "selected-cell box metrics and localized the selected objectness cell, but row-level objectness remains "
            "unproven because the target has no absent rows."
        )
    elif target_cell_only_candidates or all_primary_all_present:
        classification = "class_invariant_targets_support_fixed_geometry_more_than_runtime_objectness"
        next_action = "prepare_detector0_fixed_geometric_fallback_no_brev"
        reason = (
            "The class-invariant targets are present for every packet row, so row-level presence accuracy has no "
            "specificity. The probe did not produce a held-out selected-cell dynamic-localization win; the useful "
            "bounded path is an explicit fixed-geometric ROI fallback or claim reduction, not another objectness retry."
        )
    else:
        classification = "class_invariant_target_scope_still_ambiguous"
        next_action = "stop_for_human_detector0_scope_review"
        reason = (
            "Current packet target support does not give a clear local class-invariant Detector 0 formulation without "
            "human scope review."
        )
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "all_primary_targets_all_present": all_primary_all_present,
        "dynamic_spatial_candidates": dynamic_spatial_candidates,
        "target_cell_only_candidates": target_cell_only_candidates,
        "target_gate_results": target_gate_results,
        "not_a_product_readiness_claim": True,
    }


def main() -> int:
    args = parse_args()
    if args.max_epochs < 1 or args.max_epochs > 200:
        raise Detector0SmokeError("--max-epochs must be in [1, 200]")

    torch = import_torch()
    datasets_by_target, packet_evidence = load_probe_dataset(torch, args.packet.resolve())
    probe_results = {
        target_id: train_target_probe(torch, args, target_id, datasets_by_target[target_id])
        for target_id in PRIMARY_PROBE_TARGET_IDS
    }
    outcome = classify_outcome(probe_results, packet_evidence)

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3EA - Detector 0 class-invariant target probe",
        "active_prompt": "docs/model/return-to-form-detector0-class-invariant-target-probe-goal-loop-prompt.md",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, or reset.",
            "No source import, media download, source-register mutation, packet-row mutation, manifest mutation, tensor mutation, or vocabulary mutation.",
            "No recognizer retraining, hand-landmark training, export, model-card promotion, browser activation, product runtime change, final readiness claim, or push.",
        ],
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
        },
        "files_changed": [
            "scripts/run_return_to_form_detector0_class_invariant_target_probe.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "probe_bounds": {
            "local_only": True,
            "device": args.device,
            "seed": args.seed,
            "targets_quantified": TARGET_IDS,
            "targets_fit": PRIMARY_PROBE_TARGET_IDS,
            "targets_not_fit": {
                "right_or_second_hand": "label-confounded with table rows in current packet",
                "table_two_hand_union_or_contact_region": "table-specific target explicitly not the M3EA primary objectness target",
            },
            "max_epochs_per_target": args.max_epochs,
            "fit_runs": len(PRIMARY_PROBE_TARGET_IDS),
            "model_artifact_saved": False,
            "artifact_free_reason": "M3EA authorizes local diagnostic fitting only; the receipt records metrics and row predictions, not weights.",
        },
        "packet_and_target_support": packet_evidence,
        "formulation": {
            "id": "class_invariant_spatial_objectness_anchor_residual_probe_v1",
            "input_representation": {
                "source_tensor_key": "rgb_regions",
                "region": "full_frame_reference",
                "frame": "packet frame_index",
                "resolution": [96, 96],
                "channels": ["red", "green", "blue", "x_norm", "y_norm"],
                "normalization": "RGB float32 values in [0, 1]; x_norm/y_norm deterministic from pixel indices",
            },
            "target_cell": f"box center mapped to a {GRID_SIZE}x{GRID_SIZE} objectness heatmap",
            "row_level_presence_note": (
                "The primary M3EA targets are present on every packet row. Row-level presence accuracy is recorded "
                "for completeness but does not prove objectness specificity."
            ),
            "box_prediction": (
                "target-specific train-median anchor plus bounded tanh residual; selected-cell and target-cell box "
                "metrics are reported separately from median constant-box baselines"
            ),
            "loss": {
                "objectness": f"balanced focal BCE over {GRID_SIZE}x{GRID_SIZE} heatmap cells, gamma={args.focal_gamma}",
                "box_residual": f"SmoothL1Loss(beta={args.smooth_l1_beta}) over present target cells",
                "iou": f"{args.iou_loss_weight} * (1 - IoU) over present target cells",
                "absent_row_hard_negative": "not applicable for all-present primary targets",
            },
            "pretrained_components": [],
            "random_initialization": True,
        },
        "probe_results": probe_results,
        "outcome": outcome,
        "claim_boundary": {
            "browser_product_claim": "unchanged_fail_closed",
            "model_card_status": "not_trained",
            "active_labels": [],
            "detector0_browser_artifact": "not_promoted",
            "threshold_selected_or_promoted": False,
            "crop_normalization_ablation_approved": False,
            "final_readiness_claim": False,
            "asl_correctness_claim": False,
        },
        "no_brev_no_pretrained_no_import_proof": {
            "brev_boundary": brev_no_spend_status(),
            "remote_compute_used": False,
            "pretrained_detector_or_landmark_used": False,
            "pretrained_backbone_or_embedding_used": False,
            "generated_pseudo_labels_used": False,
            "source_import_or_approval_change": False,
            "packet_mutation": False,
            "rows_added": False,
            "tensor_mutation": False,
            "manifest_mutation": False,
            "vocabulary_mutation": False,
            "model_artifact_saved": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "browser_or_product_runtime_change": False,
            "final_gate_weakening": False,
        },
        "next_action": {
            "id": outcome["next_action"],
            "reason": outcome["reason"],
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "classification": outcome["classification"],
                "next_action": outcome["next_action"],
                "targets_fit": PRIMARY_PROBE_TARGET_IDS,
                "dynamic_spatial_candidates": outcome["dynamic_spatial_candidates"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Detector0SmokeError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
