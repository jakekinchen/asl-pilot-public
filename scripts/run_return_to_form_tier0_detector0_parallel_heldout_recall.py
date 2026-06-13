#!/usr/bin/env python3
"""Run bounded Detector 0 held-out presence-recall diagnostics."""

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

from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    box_iou,
    file_ref,
    project_relative,
    read_json,
    write_json,
)
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe import (
    ANCHOR_BOX,
    DEFAULT_PACKET,
    RESIDUAL_SCALE,
    as_float_list,
    load_architecture_dataset,
)
from run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2 import (
    FIXED_PRESENCE_THRESHOLD,
    GRID_SIZE,
    balanced_focal_bce,
    boxes_from_map,
    build_spatial_objectness_model,
    gather_at_cells,
    selected_cells,
    target_cells,
    target_heatmap,
)
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-parallel-heldout-recall/v1"
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-parallel-heldout-recall-v1.json"
)
TRAIN_MEDIAN_MAE_BAR = 0.04107142239809036
TRAIN_MEDIAN_IOU_BAR = 0.6165503859519958
NEXT_ACTION = "fix_detector0_presence_objectness_formulation_no_brev"

REFERENCE_PATHS = {
    "v2_architecture_microprobe": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json",
    "heldout_behavior_check": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json",
    "median_baseline": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json",
    "training_smoke_continue": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json",
    "two_hand_union_training_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json",
    "packet": DEFAULT_PACKET,
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "goal": ROOT / "GOAL.md",
    "runner": Path(__file__).resolve(),
}

COMMANDS_RUN = [
    "git status --short --branch",
    "git log -10 --oneline --decorate",
    "node scripts/audit_return_to_form_plan.mjs --json",
    "node scripts/audit_no_pretrained_deps.mjs",
    "node scripts/audit_no_pretrained_artifact_json.mjs",
    "node scripts/audit_source_register.mjs",
    "python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json >/dev/null",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py "
    "scripts/run_return_to_form_tier0_detector0_union_target_training_smoke_continue.py "
    "scripts/run_return_to_form_tier0_detector0_two_hand_union_training_smoke.py "
    "scripts/run_return_to_form_tier0_detector0_training_smoke.py",
    "node scripts/audit_loop_premise.mjs --json",
]

VARIANTS = [
    {
        "id": "v2_reproduction_target_cell_audit",
        "description": "Reproduce v2 max-map presence while adding target-cell objectness, PR/AUC, and validation-threshold diagnostics.",
        "model_kind": "spatial_map",
        "presence_score_source": "max_map_objectness",
        "spatial_objectness_loss_weight": 1.0,
        "hard_negative_weight": 1.0,
        "global_presence_loss_weight": 0.0,
    },
    {
        "id": "v3_low_hard_negative_max_map",
        "description": "Keep max-map presence but reduce absent-row hard-negative pressure to test over-suppression.",
        "model_kind": "spatial_map",
        "presence_score_source": "max_map_objectness",
        "spatial_objectness_loss_weight": 1.0,
        "hard_negative_weight": 0.1,
        "global_presence_loss_weight": 0.0,
    },
    {
        "id": "v3_separated_global_presence",
        "description": "Separate runtime presence from localization by training a global presence head alongside target-cell heatmap/box losses.",
        "model_kind": "global_presence",
        "presence_score_source": "global_presence_head",
        "spatial_objectness_loss_weight": 0.5,
        "hard_negative_weight": 0.1,
        "global_presence_loss_weight": 1.0,
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    parser.add_argument("--target-id", default=UNION_TARGET_ID)
    parser.add_argument("--max-epochs", type=int, default=300)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--weight-decay", type=float, default=0.0001)
    parser.add_argument("--gradient-clip", type=float, default=1.0)
    parser.add_argument("--smooth-l1-beta", type=float, default=0.02)
    parser.add_argument("--iou-loss-weight", type=float, default=0.25)
    parser.add_argument("--focal-gamma", type=float, default=2.0)
    parser.add_argument("--seed", type=int, default=223607)
    return parser.parse_args()


def choose_device(torch: Any, requested: str) -> Any:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "mps":
        if not torch.backends.mps.is_available():
            raise Detector0SmokeError("requested MPS device is not available")
        return torch.device("mps")
    raise Detector0SmokeError(f"unsupported device: {requested}")


def build_global_presence_model(torch: Any) -> Any:
    class SpatialObjectnessGlobalPresenceDetector(torch.nn.Module):
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
            self.presence_head = torch.nn.Linear(64, 1)
            self.reset_parameters()

        def reset_parameters(self) -> None:
            for module in self.modules():
                if isinstance(module, torch.nn.Conv2d):
                    torch.nn.init.kaiming_normal_(module.weight, nonlinearity="linear")
                    if module.bias is not None:
                        torch.nn.init.zeros_(module.bias)
                if isinstance(module, torch.nn.Linear):
                    torch.nn.init.kaiming_normal_(module.weight, nonlinearity="linear")
                    torch.nn.init.zeros_(module.bias)
            positive_cell_prior = 7.0 / (11.0 * GRID_SIZE * GRID_SIZE)
            self.objectness_head.bias.data.fill_(math.log(positive_cell_prior / (1.0 - positive_cell_prior)))
            train_presence_prior = 7.0 / 11.0
            self.presence_head.bias.data.fill_(math.log(train_presence_prior / (1.0 - train_presence_prior)))
            torch.nn.init.zeros_(self.box_head.weight)
            torch.nn.init.zeros_(self.box_head.bias)

        def forward(self, x: Any) -> tuple[Any, Any, Any]:
            encoded = self.features(x)
            if tuple(encoded.shape[-2:]) != (GRID_SIZE, GRID_SIZE):
                raise Detector0SmokeError(f"spatial map must be {GRID_SIZE}x{GRID_SIZE}; got {tuple(encoded.shape)}")
            pooled = encoded.mean(dim=(2, 3))
            return self.objectness_head(encoded), self.box_head(encoded), self.presence_head(pooled).squeeze(1)

    return SpatialObjectnessGlobalPresenceDetector()


def build_variant_model(torch: Any, variant: dict[str, Any]) -> Any:
    if variant["model_kind"] == "spatial_map":
        return build_spatial_objectness_model(torch)
    if variant["model_kind"] == "global_presence":
        return build_global_presence_model(torch)
    raise Detector0SmokeError(f"unsupported variant model kind: {variant['model_kind']}")


def run_model(torch: Any, model: Any, x: Any) -> tuple[Any, Any, Any | None]:
    output = model(x)
    if len(output) == 2:
        objectness_logits, raw_residual_map = output
        return objectness_logits, raw_residual_map, None
    objectness_logits, raw_residual_map, global_presence_logits = output
    return objectness_logits, raw_residual_map, global_presence_logits


def variant_loss(
    torch: Any,
    variant: dict[str, Any],
    objectness_logits: Any,
    raw_residual_map: Any,
    global_presence_logits: Any | None,
    presence: Any,
    boxes: Any,
    anchor_box: Any,
    residual_scale: Any,
    args: argparse.Namespace,
) -> tuple[Any, dict[str, float]]:
    cell_y, cell_x = target_cells(torch, presence, boxes)
    heatmap = target_heatmap(torch, presence, cell_y, cell_x)
    objectness_loss, objectness_parts = balanced_focal_bce(torch, objectness_logits, heatmap, args.focal_gamma)
    objectness_weighted = float(variant["spatial_objectness_loss_weight"]) * objectness_loss

    absent_mask = ~presence.bool()
    if bool(absent_mask.any().detach().cpu().item()):
        absent_max_logits = objectness_logits[absent_mask].flatten(1).max(dim=1).values
        hard_negative_loss = torch.nn.functional.binary_cross_entropy_with_logits(
            absent_max_logits,
            torch.zeros_like(absent_max_logits),
        )
    else:
        hard_negative_loss = torch.zeros((), device=objectness_logits.device)
    hard_negative_weighted = float(variant["hard_negative_weight"]) * hard_negative_loss

    global_presence_loss = torch.zeros((), device=objectness_logits.device)
    if global_presence_logits is not None:
        global_presence_loss = torch.nn.functional.binary_cross_entropy_with_logits(global_presence_logits, presence)
    global_presence_weighted = float(variant["global_presence_loss_weight"]) * global_presence_loss

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
    total_loss = objectness_weighted + hard_negative_weighted + global_presence_weighted + residual_loss + iou_weighted
    return total_loss, {
        "total": float(total_loss.detach().cpu().item()),
        **objectness_parts,
        "spatial_objectness_weighted": float(objectness_weighted.detach().cpu().item()),
        "hard_negative_max_objectness": float(hard_negative_loss.detach().cpu().item()),
        "hard_negative_max_objectness_weighted": float(hard_negative_weighted.detach().cpu().item()),
        "global_presence_bce": float(global_presence_loss.detach().cpu().item()),
        "global_presence_bce_weighted": float(global_presence_weighted.detach().cpu().item()),
        "smooth_l1_target_cell_residual": float(residual_loss.detach().cpu().item()),
        "iou": float(iou_loss.detach().cpu().item()),
        "iou_weighted": float(iou_weighted.detach().cpu().item()),
    }


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


def confusion_at_threshold(scores: list[float], targets: list[bool], threshold: float) -> dict[str, Any]:
    predicted = [score >= threshold for score in scores]
    tp = sum(1 for pred, target in zip(predicted, targets, strict=True) if pred and target)
    tn = sum(1 for pred, target in zip(predicted, targets, strict=True) if not pred and not target)
    fp = sum(1 for pred, target in zip(predicted, targets, strict=True) if pred and not target)
    fn = sum(1 for pred, target in zip(predicted, targets, strict=True) if not pred and target)
    precision = None if tp + fp == 0 else tp / (tp + fp)
    recall = None if tp + fn == 0 else tp / (tp + fn)
    f1 = None if precision is None or recall is None or precision + recall == 0 else 2 * precision * recall / (precision + recall)
    return {
        "threshold": threshold,
        "presence_accuracy": (tp + tn) / len(targets) if targets else None,
        "true_positive_count": tp,
        "true_negative_count": tn,
        "false_positive_count": fp,
        "false_negative_count": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def auroc(scores: list[float], targets: list[bool]) -> dict[str, Any]:
    positive_count = sum(1 for target in targets if target)
    negative_count = len(targets) - positive_count
    if positive_count == 0 or negative_count == 0:
        return {"value": None, "reason": "requires at least one positive and one negative"}

    ordered = sorted(enumerate(scores), key=lambda item: item[1])
    ranks = [0.0] * len(scores)
    index = 0
    while index < len(ordered):
        next_index = index + 1
        while next_index < len(ordered) and ordered[next_index][1] == ordered[index][1]:
            next_index += 1
        average_rank = (index + 1 + next_index) / 2.0
        for rank_index in range(index, next_index):
            ranks[ordered[rank_index][0]] = average_rank
        index = next_index
    positive_rank_sum = sum(rank for rank, target in zip(ranks, targets, strict=True) if target)
    value = (positive_rank_sum - positive_count * (positive_count + 1) / 2.0) / (positive_count * negative_count)
    return {"value": value, "reason": None}


def average_precision(scores: list[float], targets: list[bool]) -> dict[str, Any]:
    positive_count = sum(1 for target in targets if target)
    if positive_count == 0:
        return {"value": None, "reason": "requires at least one positive"}
    ordered = sorted(zip(scores, targets, strict=True), key=lambda item: item[0], reverse=True)
    true_positives = 0
    precision_sum = 0.0
    for rank, (_score, target) in enumerate(ordered, start=1):
        if target:
            true_positives += 1
            precision_sum += true_positives / rank
    return {"value": precision_sum / positive_count, "reason": None}


def select_validation_threshold(scores: list[float], targets: list[bool]) -> dict[str, Any]:
    candidates = sorted(set([0.0, FIXED_PRESENCE_THRESHOLD, 1.0, *scores]))
    best: dict[str, Any] | None = None
    for threshold in candidates:
        metrics = confusion_at_threshold(scores, targets, threshold)
        f1 = -1.0 if metrics["f1"] is None else metrics["f1"]
        accuracy = -1.0 if metrics["presence_accuracy"] is None else metrics["presence_accuracy"]
        key = (f1, accuracy, -metrics["false_negative_count"], -metrics["false_positive_count"], -threshold)
        if best is None or key > best["_key"]:
            best = {**metrics, "_key": key}
    assert best is not None
    best.pop("_key")
    best["selection_rule"] = (
        "diagnostic only: maximize validation F1, then accuracy, then lower false negatives, "
        "then lower false positives, then lower threshold"
    )
    best["threshold_selected_or_promoted"] = False
    return best


def score_metrics(rows: list[dict[str, Any]], score_key: str, threshold: float) -> dict[str, Any]:
    scores = [float(row[score_key]) for row in rows]
    targets = [bool(row["target_present"]) for row in rows]
    positives = [score for score, target in zip(scores, targets, strict=True) if target]
    negatives = [score for score, target in zip(scores, targets, strict=True) if not target]
    return {
        "score_key": score_key,
        "positive_distribution": distribution(positives),
        "negative_distribution": distribution(negatives),
        "fixed_threshold": confusion_at_threshold(scores, targets, threshold),
        "threshold_free": {
            "auroc": auroc(scores, targets),
            "average_precision": average_precision(scores, targets),
        },
    }


def box_metrics(torch: Any, rows: list[dict[str, Any]]) -> dict[str, Any]:
    present_rows = [row for row in rows if row["target_present"]]
    if not present_rows:
        return {
            "present_support": 0,
            "selected_cell_box_mae": None,
            "selected_cell_box_mean_iou": None,
            "target_cell_box_mae": None,
            "target_cell_box_mean_iou": None,
            "median_constant_box_mae": None,
            "median_constant_box_mean_iou": None,
        }
    selected_mae = [float(row["selected_cell_box_mae_if_present"]) for row in present_rows]
    selected_iou = [float(row["selected_cell_box_iou_if_present"]) for row in present_rows]
    target_mae = [float(row["target_cell_box_mae_if_present"]) for row in present_rows]
    target_iou = [float(row["target_cell_box_iou_if_present"]) for row in present_rows]
    median_mae = [float(row["median_box_mae_if_present"]) for row in present_rows]
    median_iou = [float(row["median_box_iou_if_present"]) for row in present_rows]
    return {
        "present_support": len(present_rows),
        "selected_cell_box_mae": statistics.fmean(selected_mae),
        "selected_cell_box_mean_iou": statistics.fmean(selected_iou),
        "target_cell_box_mae": statistics.fmean(target_mae),
        "target_cell_box_mean_iou": statistics.fmean(target_iou),
        "median_constant_box_mae": statistics.fmean(median_mae),
        "median_constant_box_mean_iou": statistics.fmean(median_iou),
    }


def evaluate_variant_split(
    torch: Any,
    model: Any,
    variant: dict[str, Any],
    values: dict[str, Any],
    anchor_box: Any,
    residual_scale: Any,
    args: argparse.Namespace,
) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        objectness_logits, raw_residual_map, global_presence_logits = run_model(torch, model, values["x"])
        _loss, losses = variant_loss(
            torch,
            variant,
            objectness_logits,
            raw_residual_map,
            global_presence_logits,
            values["presence"],
            values["boxes"],
            anchor_box,
            residual_scale,
            args,
        )
        predicted_residual_map, predicted_box_map = boxes_from_map(torch, raw_residual_map, anchor_box, residual_scale)
        max_map_scores, selected_y, selected_x = selected_cells(torch, objectness_logits)
        objectness_heatmap = torch.sigmoid(objectness_logits)
        target_y, target_x = target_cells(torch, values["presence"], values["boxes"])
        target_cell_scores = gather_at_cells(torch, objectness_heatmap, target_y, target_x)[:, 0]
        selected_box = gather_at_cells(torch, predicted_box_map, selected_y, selected_x)
        target_cell_box = gather_at_cells(torch, predicted_box_map, target_y, target_x)
        if global_presence_logits is None:
            global_scores = None
            presence_scores = max_map_scores
        else:
            global_scores = torch.sigmoid(global_presence_logits)
            presence_scores = global_scores if variant["presence_score_source"] == "global_presence_head" else max_map_scores

    rows: list[dict[str, Any]] = []
    for index, row in enumerate(values["rows"]):
        target_present = bool(values["presence"][index].item())
        target_box = values["boxes"][index]
        row_selected_box = selected_box[index]
        row_target_cell_box = target_cell_box[index]
        if target_present:
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
        else:
            median_mae = None
            selected_mae = None
            target_cell_mae = None
            median_iou = None
            selected_iou = None
            target_cell_iou = None
            target_box_list = None
        rows.append(
            {
                "row_id": row["row_id"],
                "clip_id": row["clip_id"],
                "split": row["split"],
                "label_id": row["label_id"],
                "source_record_id": row["source_record_id"],
                "signer_identity_hash": row["signer_identity_hash"],
                "frame_index": row["frame_index"],
                "target_present": target_present,
                "presence_score": float(presence_scores[index].item()),
                "max_map_objectness_score": float(max_map_scores[index].item()),
                "target_cell_objectness_score": None
                if not target_present
                else float(target_cell_scores[index].item()),
                "global_presence_score": None if global_scores is None else float(global_scores[index].item()),
                "fixed_presence_threshold": FIXED_PRESENCE_THRESHOLD,
                "fixed_predicted_present": bool(float(presence_scores[index].item()) >= FIXED_PRESENCE_THRESHOLD),
                "selected_cell_yx": [int(selected_y[index].item()), int(selected_x[index].item())],
                "target_cell_yx_if_present": None
                if not target_present
                else [int(target_y[index].item()), int(target_x[index].item())],
                "target_box_xyxy_norm": target_box_list,
                "median_anchor_box_xyxy_norm": as_float_list(anchor_box),
                "selected_cell_predicted_box_xyxy_norm": as_float_list(row_selected_box),
                "target_cell_predicted_box_xyxy_norm_if_present": None
                if not target_present
                else as_float_list(row_target_cell_box),
                "median_box_mae_if_present": median_mae,
                "median_box_iou_if_present": median_iou,
                "selected_cell_box_mae_if_present": selected_mae,
                "selected_cell_box_iou_if_present": selected_iou,
                "target_cell_box_mae_if_present": target_cell_mae,
                "target_cell_box_iou_if_present": target_cell_iou,
            }
        )

    validation_threshold = None
    return {
        "loss": losses,
        "sample_count": len(rows),
        "positive_count": sum(1 for row in rows if row["target_present"]),
        "negative_count": sum(1 for row in rows if not row["target_present"]),
        "presence_score_metrics": score_metrics(rows, "presence_score", FIXED_PRESENCE_THRESHOLD),
        "max_map_objectness_metrics": score_metrics(rows, "max_map_objectness_score", FIXED_PRESENCE_THRESHOLD),
        "target_cell_objectness_metrics_present_only": {
            "score_key": "target_cell_objectness_score",
            "positive_distribution": distribution(
                [float(row["target_cell_objectness_score"]) for row in rows if row["target_present"]]
            ),
            "note": "target cell is only defined for present rows and is diagnostic, not a runtime presence score",
        },
        "box_quality": box_metrics(torch, rows),
        "rows": rows,
        "validation_threshold": validation_threshold,
    }


def add_diagnostic_thresholds(result: dict[str, Any]) -> None:
    validation_rows = result["splits"]["validation"]["rows"]
    validation_scores = [float(row["presence_score"]) for row in validation_rows]
    validation_targets = [bool(row["target_present"]) for row in validation_rows]
    selected = select_validation_threshold(validation_scores, validation_targets)
    threshold = float(selected["threshold"])
    result["diagnostic_validation_threshold"] = selected
    for split in ("train", "validation", "test"):
        rows = result["splits"][split]["rows"]
        split_scores = [float(row["presence_score"]) for row in rows]
        split_targets = [bool(row["target_present"]) for row in rows]
        result["splits"][split]["presence_score_metrics"]["validation_selected_threshold"] = confusion_at_threshold(
            split_scores,
            split_targets,
            threshold,
        )


def train_variant(
    torch: Any,
    args: argparse.Namespace,
    variant: dict[str, Any],
    dataset: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    model = build_variant_model(torch, variant).to(device)
    anchor_box = torch.tensor(ANCHOR_BOX, dtype=torch.float32, device=device)
    residual_scale = torch.tensor(RESIDUAL_SCALE, dtype=torch.float32, device=device)
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
    initial = evaluate_variant_split(torch, model, variant, device_dataset["train"], anchor_box, residual_scale, args)
    history = [
        {
            "epoch": 0,
            "train_loss": initial["loss"],
            "train_fixed_presence_accuracy": initial["presence_score_metrics"]["fixed_threshold"][
                "presence_accuracy"
            ],
            "train_selected_cell_box_mae": initial["box_quality"]["selected_cell_box_mae"],
            "train_target_cell_box_mae": initial["box_quality"]["target_cell_box_mae"],
        }
    ]
    best_train_loss = initial["loss"]["total"]

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        objectness_logits, raw_residual_map, global_presence_logits = run_model(torch, model, device_dataset["train"]["x"])
        loss, _losses = variant_loss(
            torch,
            variant,
            objectness_logits,
            raw_residual_map,
            global_presence_logits,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
            anchor_box,
            residual_scale,
            args,
        )
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), args.gradient_clip)
        optimizer.step()
        if epoch <= 5 or epoch % 25 == 0 or epoch == args.max_epochs:
            train_eval = evaluate_variant_split(
                torch,
                model,
                variant,
                device_dataset["train"],
                anchor_box,
                residual_scale,
                args,
            )
            best_train_loss = min(best_train_loss, train_eval["loss"]["total"])
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_eval["loss"],
                    "train_fixed_presence_accuracy": train_eval["presence_score_metrics"]["fixed_threshold"][
                        "presence_accuracy"
                    ],
                    "train_selected_cell_box_mae": train_eval["box_quality"]["selected_cell_box_mae"],
                    "train_target_cell_box_mae": train_eval["box_quality"]["target_cell_box_mae"],
                }
            )

    splits = {
        split: evaluate_variant_split(torch, model, variant, values, anchor_box, residual_scale, args)
        for split, values in device_dataset.items()
    }
    result = {
        "variant_id": variant["id"],
        "description": variant["description"],
        "model_kind": variant["model_kind"],
        "presence_score_source": variant["presence_score_source"],
        "configuration": {
            "spatial_objectness_loss_weight": variant["spatial_objectness_loss_weight"],
            "hard_negative_weight": variant["hard_negative_weight"],
            "global_presence_loss_weight": variant["global_presence_loss_weight"],
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "gradient_clip": args.gradient_clip,
            "smooth_l1_beta": args.smooth_l1_beta,
            "iou_loss_weight": args.iou_loss_weight,
            "focal_gamma": args.focal_gamma,
            "epochs_ran": args.max_epochs,
        },
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "history": history,
        "loss_movement": {
            "initial_train_loss": initial["loss"]["total"],
            "best_recorded_train_loss": best_train_loss,
            "final_train_loss": splits["train"]["loss"]["total"],
            "loss_drop_fraction_from_initial_to_best_recorded": (
                (initial["loss"]["total"] - best_train_loss) / initial["loss"]["total"]
                if initial["loss"]["total"]
                else None
            ),
        },
        "splits": splits,
    }
    add_diagnostic_thresholds(result)
    return result


def split_distribution(packet_evidence: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for split, rows in packet_evidence["rows_by_split"].items():
        positives = [row for row in rows if row["union_target_present"]]
        negatives = [row for row in rows if not row["union_target_present"]]
        signer_counts = Counter(row["signer_identity_hash"] for row in rows)
        source_counts = Counter(row["source_record_id"].split("/", 1)[0] for row in rows)
        result[split] = {
            "sample_count": len(rows),
            "positive_count": len(positives),
            "negative_count": len(negatives),
            "label_counts": dict(Counter(row["label_id"] for row in rows)),
            "signer_count": len(signer_counts),
            "signer_row_counts": dict(sorted(signer_counts.items())),
            "source_record_prefix_counts": dict(sorted(source_counts.items())),
        }
    return result


def summarize_variant_for_table(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "variant_id": result["variant_id"],
        "presence_score_source": result["presence_score_source"],
        "fixed_threshold_presence": {
            split: result["splits"][split]["presence_score_metrics"]["fixed_threshold"]
            for split in ("train", "validation", "test")
        },
        "validation_selected_threshold_presence": {
            split: result["splits"][split]["presence_score_metrics"]["validation_selected_threshold"]
            for split in ("train", "validation", "test")
        },
        "threshold_free": {
            split: result["splits"][split]["presence_score_metrics"]["threshold_free"]
            for split in ("train", "validation", "test")
        },
        "box_quality": {split: result["splits"][split]["box_quality"] for split in ("train", "validation", "test")},
    }


def classify_outcome(variant_results: list[dict[str, Any]]) -> dict[str, Any]:
    credible_variants = []
    for result in variant_results:
        validation = result["splits"]["validation"]["presence_score_metrics"]["threshold_free"]
        test = result["splits"]["test"]["presence_score_metrics"]["threshold_free"]
        selected_validation = result["splits"]["validation"]["presence_score_metrics"]["validation_selected_threshold"]
        selected_test = result["splits"]["test"]["presence_score_metrics"]["validation_selected_threshold"]
        validation_auc = validation["auroc"]["value"]
        test_auc = test["auroc"]["value"]
        if (
            validation_auc is not None
            and test_auc is not None
            and validation_auc >= 0.75
            and test_auc >= 0.75
            and selected_validation["false_positive_count"] <= 1
            and selected_test["false_positive_count"] <= 1
            and selected_validation["recall"] is not None
            and selected_test["recall"] is not None
            and selected_validation["recall"] >= 0.5
            and selected_test["recall"] >= 0.5
        ):
            credible_variants.append(result["variant_id"])
    if credible_variants:
        return {
            "classification": "credible_heldout_presence_signal_found_but_not_product_ready",
            "credible_variants": credible_variants,
            "next_action": "prepare_detector0_crop_normalization_ablation_after_heldout_presence_signal",
            "reason": (
                "At least one bounded variant ranked held-out positives above negatives on validation and test "
                "without more than one diagnostic-threshold false positive per held-out split."
            ),
        }

    return {
        "classification": "target_objectness_formulation_deficiency_remains",
        "credible_variants": [],
        "next_action": NEXT_ACTION,
        "reason": (
            "The variants either keep held-out positives below negatives/ranking gates or require a diagnostic "
            "threshold with too much split-specific behavior. The next useful no-Brev action is to fix the "
            "presence/objectness formulation before crop-normalization ablation."
        ),
    }


def main() -> int:
    args = parse_args()
    if args.target_id != UNION_TARGET_ID:
        raise Detector0SmokeError(f"--target-id must be {UNION_TARGET_ID}")
    if args.max_epochs < 1 or args.max_epochs > 300:
        raise Detector0SmokeError("--max-epochs must be in [1, 300]")
    torch = import_torch()
    raw_dataset, packet_evidence = load_architecture_dataset(torch, args.packet.resolve())
    variant_results = [train_variant(torch, args, variant, raw_dataset) for variant in VARIANTS]
    baseline_receipt = read_json(REFERENCE_PATHS["median_baseline"])
    v2_receipt = read_json(REFERENCE_PATHS["v2_architecture_microprobe"])
    outcome = classify_outcome(variant_results)
    commands_run = [
        *COMMANDS_RUN,
        "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
        "scripts/run_return_to_form_tier0_detector0_parallel_heldout_recall.py",
        "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
        f"scripts/run_return_to_form_tier0_detector0_parallel_heldout_recall.py --output {project_relative(args.output)}",
    ]
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "Parallel Detector 0 held-out presence recall risk lane",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": commands_run,
        "commands_intentionally_not_run": [
            "No Brev CLI command, Brev sync, Brev exec, remote training, worker lifecycle action, or stop command was run.",
            "No source import, tensor mutation, manifest mutation, model export, model-card promotion, browser activation, final-gate weakening, or active M3CK prompt edit was run.",
        ],
        "files_symbols_inspected": {
            name: file_ref(path) for name, path in REFERENCE_PATHS.items()
        },
        "files_changed": [
            "scripts/run_return_to_form_tier0_detector0_parallel_heldout_recall.py",
            project_relative(args.output),
            "docs/session-logs/409-return-to-form-tier0-detector0-parallel-heldout-recall.md",
        ],
        "experiment_bounds": {
            "variant_count": len(VARIANTS),
            "max_variants_allowed": 3,
            "local_only": True,
            "device": args.device,
            "epochs_per_variant": args.max_epochs,
            "batching": "full 11-row train split batch",
            "packet_rows": 32,
            "no_brev": True,
            "no_pretrained": True,
            "no_export": True,
            "no_promotion": True,
            "no_runtime_change": True,
        },
        "packet_and_split_evidence": {
            "packet": packet_evidence["packet"],
            "target_id": UNION_TARGET_ID,
            "split_counts": packet_evidence["split_counts"],
            "label_counts_by_split": packet_evidence["label_counts_by_split"],
            "union_target_support_by_split": packet_evidence["union_target_support_by_split"],
            "source_ids": packet_evidence["source_ids"],
            "split_distribution": split_distribution(packet_evidence),
            "rows_by_split": packet_evidence["rows_by_split"],
        },
        "variant_summaries": [summarize_variant_for_table(result) for result in variant_results],
        "variant_details": variant_results,
        "heldout_score_distributions": {
            result["variant_id"]: {
                split: {
                    "presence_score": result["splits"][split]["presence_score_metrics"],
                    "max_map_objectness": result["splits"][split]["max_map_objectness_metrics"],
                    "target_cell_objectness_present_only": result["splits"][split][
                        "target_cell_objectness_metrics_present_only"
                    ],
                }
                for split in ("validation", "test")
            }
            for result in variant_results
        },
        "box_quality_separate_from_presence": {
            result["variant_id"]: {
                split: result["splits"][split]["box_quality"] for split in ("train", "validation", "test")
            }
            for result in variant_results
        },
        "comparison_to_v2_and_median_baseline": {
            "v2_receipt": file_ref(REFERENCE_PATHS["v2_architecture_microprobe"]),
            "v2_selected_formulation": v2_receipt.get("selected_formulation"),
            "v2_fixed_threshold_presence": v2_receipt.get("training", {}).get("fixed_threshold_presence_behavior"),
            "v2_box_quality": {
                split: {
                    "present_box_mae": v2_receipt.get("training", {}).get("metrics", {}).get(split, {}).get(
                        "present_box_mae"
                    ),
                    "present_box_mean_iou": v2_receipt.get("training", {}).get("metrics", {}).get(split, {}).get(
                        "present_box_mean_iou"
                    ),
                    "median_constant_box_mae": v2_receipt.get("training", {}).get("metrics", {}).get(split, {}).get(
                        "median_constant_box_mae"
                    ),
                    "median_constant_box_mean_iou": v2_receipt.get("training", {})
                    .get("metrics", {})
                    .get(split, {})
                    .get("median_constant_box_mean_iou"),
                }
                for split in ("train", "validation", "test")
            },
            "median_baseline_receipt": file_ref(REFERENCE_PATHS["median_baseline"]),
            "median_constant_box_metrics": baseline_receipt["baseline_metrics"]["median_constant_box"],
            "minimum_future_detector0_bar": baseline_receipt["minimum_future_detector0_bar"],
            "note": (
                "Median baseline is a geometry-only target-local reference and not a runtime detector; "
                "presence comparisons are therefore reported separately from box quality."
            ),
        },
        "outcome": outcome,
        "no_brev_no_pretrained_no_export_no_promotion_no_runtime_change_proof": {
            "brev_commands_run": [],
            "remote_compute_used": False,
            "pretrained_detector_or_landmark_used": False,
            "pretrained_backbone_or_embedding_used": False,
            "generated_pseudo_labels_used": False,
            "source_import_or_approval_change": False,
            "packet_mutation": False,
            "tensor_mutation": False,
            "manifest_mutation": False,
            "model_artifact_saved": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "active_label_promotion": False,
            "browser_or_product_runtime_change": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "goal_md_edit": False,
            "active_m3ck_prompt_edit": False,
            "supervised_pair_process_touched": False,
        },
        "next_action": {
            "id": outcome["next_action"],
            "description": (
                "Fix Detector 0 presence/objectness formulation locally with no Brev before any crop-normalization "
                "ablation."
                if outcome["next_action"] == NEXT_ACTION
                else "Prepare a crop-normalization ablation only after the recorded held-out presence signal is accepted."
            ),
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "variant_count": len(variant_results),
                "classification": outcome["classification"],
                "next_action": outcome["next_action"],
                "fixed_threshold_presence": {
                    result["variant_id"]: {
                        split: result["splits"][split]["presence_score_metrics"]["fixed_threshold"][
                            "presence_accuracy"
                        ]
                        for split in ("train", "validation", "test")
                    }
                    for result in variant_results
                },
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
