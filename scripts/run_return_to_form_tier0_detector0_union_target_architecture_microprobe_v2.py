#!/usr/bin/env python3
"""Run the M3AE-AP spatial objectness union-target architecture microprobe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import shlex
import sys
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    box_iou,
    brev_no_spend_status,
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
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-architecture-microprobe-v2/v1"
DEFAULT_OUTPUT = (
    ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json"
)
SELECTED_FORMULATION = "spatial_objectness_anchor_residual_union_target_microprobe_v2"
GRID_SIZE = 12
FIXED_PRESENCE_THRESHOLD = 0.5
TRAIN_MEDIAN_MAE_BAR = 0.04107142239809036
TRAIN_MEDIAN_IOU_BAR = 0.6165503859519958
VALIDATION_MEDIAN_MAE_BAR = 0.02607143111526966
TEST_MEDIAN_MAE_BAR = 0.03791666775941849
VALIDATION_MEDIAN_IOU_BAR = 0.7486294507980347
TEST_MEDIAN_IOU_BAR = 0.6775339245796204
REFERENCE_PATHS = {
    "m3ae_ao_architecture_remediation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md",
    "m3ae_an_heldout_behavior": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json",
    "m3ae_al_architecture_microprobe_v1": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json",
    "m3ae_ak_architecture_design": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md",
    "m3ae_aj_median_baseline": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json",
    "observer_249_api_diagnostic": ROOT
    / "artifacts"
    / "research"
    / "observer-249-union-target-smoke-diagnostic-api-response.md",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "detector0_bootstrap": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "detector0_training_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-training-smoke-v1.json",
    "m3ae_aa_expanded_packet_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json",
    "m3ae_ab_union_schema": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-schema-v1.md",
    "m3ae_ac_union_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json",
    "m3ae_ad_union_target_remediation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-remediation-v1.json",
    "m3ae_ae_union_margin_schema_revision": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md",
    "m3ae_af_union_margin_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json",
    "m3ae_y_candidate_review": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md",
    "m3ae_z_table_second_hand_packet_mutation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json",
    "observer_localization_memo": ROOT
    / "artifacts"
    / "research"
    / "observer-201-localization-strategy-api-response.md",
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    parser.add_argument("--target-id", default=UNION_TARGET_ID)
    parser.add_argument("--anchor-box-source", default="m3ae_aj_train_median")
    parser.add_argument("--max-epochs", type=int, default=300)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--weight-decay", type=float, default=0.0001)
    parser.add_argument("--gradient-clip", type=float, default=1.0)
    parser.add_argument("--smooth-l1-beta", type=float, default=0.02)
    parser.add_argument("--iou-loss-weight", type=float, default=0.25)
    parser.add_argument("--focal-gamma", type=float, default=2.0)
    parser.add_argument("--hard-negative-weight", type=float, default=1.0)
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


def build_spatial_objectness_model(torch: Any) -> Any:
    class SpatialObjectnessAnchorResidualDetector(torch.nn.Module):
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
            train_positive_cells = 7.0
            train_total_cells = 11.0 * GRID_SIZE * GRID_SIZE
            objectness_prior = train_positive_cells / train_total_cells
            self.objectness_head.bias.data.fill_(math.log(objectness_prior / (1.0 - objectness_prior)))
            torch.nn.init.zeros_(self.box_head.weight)
            torch.nn.init.zeros_(self.box_head.bias)

        def forward(self, x: Any) -> tuple[Any, Any]:
            encoded = self.features(x)
            if tuple(encoded.shape[-2:]) != (GRID_SIZE, GRID_SIZE):
                raise Detector0SmokeError(f"spatial map must be {GRID_SIZE}x{GRID_SIZE}; got {tuple(encoded.shape)}")
            return self.objectness_head(encoded), self.box_head(encoded)

    return SpatialObjectnessAnchorResidualDetector()


def target_cells(torch: Any, presence: Any, boxes: Any) -> tuple[Any, Any]:
    centers_x = ((boxes[:, 0] + boxes[:, 2]) * 0.5).clamp(0.0, 0.999999)
    centers_y = ((boxes[:, 1] + boxes[:, 3]) * 0.5).clamp(0.0, 0.999999)
    cell_x = torch.floor(centers_x * GRID_SIZE).to(dtype=torch.long).clamp(0, GRID_SIZE - 1)
    cell_y = torch.floor(centers_y * GRID_SIZE).to(dtype=torch.long).clamp(0, GRID_SIZE - 1)
    absent = ~presence.bool()
    cell_x = torch.where(absent, torch.zeros_like(cell_x), cell_x)
    cell_y = torch.where(absent, torch.zeros_like(cell_y), cell_y)
    return cell_y, cell_x


def target_heatmap(torch: Any, presence: Any, cell_y: Any, cell_x: Any) -> Any:
    heatmap = torch.zeros((int(presence.shape[0]), 1, GRID_SIZE, GRID_SIZE), dtype=torch.float32, device=presence.device)
    present_indices = torch.nonzero(presence.bool(), as_tuple=False).flatten()
    if int(present_indices.numel()):
        heatmap[present_indices, 0, cell_y[present_indices], cell_x[present_indices]] = 1.0
    return heatmap


def boxes_from_map(torch: Any, raw_residual_map: Any, anchor_box: Any, residual_scale: Any) -> tuple[Any, Any]:
    residual_scale_map = residual_scale.view(1, 4, 1, 1)
    anchor_map = anchor_box.view(1, 4, 1, 1)
    predicted_residual_map = residual_scale_map * torch.tanh(raw_residual_map)
    predicted_box_map = (anchor_map + predicted_residual_map).clamp(0.0, 1.0)
    return predicted_residual_map, predicted_box_map


def gather_at_cells(torch: Any, value_map: Any, cell_y: Any, cell_x: Any) -> Any:
    batch_indices = torch.arange(int(value_map.shape[0]), device=value_map.device)
    return value_map[batch_indices, :, cell_y, cell_x]


def selected_cells(torch: Any, objectness_logits: Any) -> tuple[Any, Any, Any]:
    scores_flat = torch.sigmoid(objectness_logits).flatten(1)
    presence_scores, selected_flat = scores_flat.max(dim=1)
    cell_y = torch.div(selected_flat, GRID_SIZE, rounding_mode="floor")
    cell_x = selected_flat.remainder(GRID_SIZE)
    return presence_scores, cell_y, cell_x


def balanced_focal_bce(torch: Any, logits: Any, targets: Any, gamma: float) -> tuple[Any, dict[str, float]]:
    bce = torch.nn.functional.binary_cross_entropy_with_logits(logits, targets, reduction="none")
    probabilities = torch.sigmoid(logits)
    pt = torch.where(targets == 1.0, probabilities, 1.0 - probabilities)
    focal = (1.0 - pt).pow(gamma) * bce
    positive_mask = targets == 1.0
    negative_mask = ~positive_mask
    positive_loss = focal[positive_mask].mean() if bool(positive_mask.any().detach().cpu().item()) else torch.zeros((), device=logits.device)
    negative_loss = focal[negative_mask].mean() if bool(negative_mask.any().detach().cpu().item()) else torch.zeros((), device=logits.device)
    total = positive_loss + negative_loss
    return total, {
        "balanced_focal_bce": float(total.detach().cpu().item()),
        "positive_cell_focal_bce": float(positive_loss.detach().cpu().item()),
        "negative_cell_focal_bce": float(negative_loss.detach().cpu().item()),
    }


def microprobe_loss(
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

    absent_mask = ~presence.bool()
    if bool(absent_mask.any().detach().cpu().item()):
        absent_max_logits = objectness_logits[absent_mask].flatten(1).max(dim=1).values
        hard_negative_loss = torch.nn.functional.binary_cross_entropy_with_logits(
            absent_max_logits,
            torch.zeros_like(absent_max_logits),
        )
    else:
        hard_negative_loss = torch.zeros((), device=objectness_logits.device)

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

    hard_negative_weighted = args.hard_negative_weight * hard_negative_loss
    iou_weighted = args.iou_loss_weight * iou_loss
    total_loss = objectness_loss + hard_negative_weighted + residual_loss + iou_weighted
    return total_loss, {
        "total": float(total_loss.detach().cpu().item()),
        **objectness_parts,
        "hard_negative_max_objectness": float(hard_negative_loss.detach().cpu().item()),
        "hard_negative_max_objectness_weighted": float(hard_negative_weighted.detach().cpu().item()),
        "smooth_l1_target_cell_residual": float(residual_loss.detach().cpu().item()),
        "iou": float(iou_loss.detach().cpu().item()),
        "iou_weighted": float(iou_weighted.detach().cpu().item()),
    }


def predict_split(torch: Any, model: Any, values: dict[str, Any], anchor_box: Any, residual_scale: Any) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        objectness_logits, raw_residual_map = model(values["x"])
        predicted_residual_map, predicted_box_map = boxes_from_map(torch, raw_residual_map, anchor_box, residual_scale)
        presence_scores, selected_y, selected_x = selected_cells(torch, objectness_logits)
        predicted_presence = (presence_scores >= FIXED_PRESENCE_THRESHOLD).to(dtype=torch.float32)
        selected_residual = gather_at_cells(torch, predicted_residual_map, selected_y, selected_x)
        selected_box = gather_at_cells(torch, predicted_box_map, selected_y, selected_x)
        target_y, target_x = target_cells(torch, values["presence"], values["boxes"])
        target_cell_residual = gather_at_cells(torch, predicted_residual_map, target_y, target_x)
        target_cell_box = gather_at_cells(torch, predicted_box_map, target_y, target_x)
        objectness_heatmap = torch.sigmoid(objectness_logits)
    return {
        "presence_scores": presence_scores,
        "predicted_presence": predicted_presence,
        "selected_cell_y": selected_y,
        "selected_cell_x": selected_x,
        "selected_residual": selected_residual,
        "selected_box": selected_box,
        "target_cell_y": target_y,
        "target_cell_x": target_x,
        "target_cell_residual": target_cell_residual,
        "target_cell_box": target_cell_box,
        "objectness_heatmap_max": objectness_heatmap.flatten(1).max(dim=1).values,
    }


def evaluate_split(
    torch: Any,
    model: Any,
    values: dict[str, Any],
    anchor_box: Any,
    residual_scale: Any,
    args: argparse.Namespace,
) -> dict[str, Any]:
    model.eval()
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        objectness_logits, raw_residual_map = model(values["x"])
        _loss, losses = microprobe_loss(
            torch,
            objectness_logits,
            raw_residual_map,
            presence,
            boxes,
            anchor_box,
            residual_scale,
            args,
        )
        predictions = predict_split(torch, model, values, anchor_box, residual_scale)
        predicted_presence = predictions["predicted_presence"]
        selected_box = predictions["selected_box"]
        present_mask = presence.bool()
        if bool(present_mask.any().cpu().item()):
            box_mae = float((selected_box[present_mask] - boxes[present_mask]).abs().mean().cpu().item())
            mean_iou = float(box_iou(torch, selected_box[present_mask], boxes[present_mask]).mean().cpu().item())
            median_box_mae = float((anchor_box.unsqueeze(0) - boxes[present_mask]).abs().mean().cpu().item())
            median_mean_iou = float(box_iou(torch, anchor_box.unsqueeze(0), boxes[present_mask]).mean().cpu().item())
        else:
            box_mae = None
            mean_iou = None
            median_box_mae = None
            median_mean_iou = None
    true_positive_count = int(((predicted_presence == 1.0) & (presence == 1.0)).sum().cpu().item())
    true_negative_count = int(((predicted_presence == 0.0) & (presence == 0.0)).sum().cpu().item())
    false_positive_count = int(((predicted_presence == 1.0) & (presence == 0.0)).sum().cpu().item())
    false_negative_count = int(((predicted_presence == 0.0) & (presence == 1.0)).sum().cpu().item())
    presence_correct = predicted_presence == presence
    return {
        "loss": losses,
        "sample_count": int(values["x"].shape[0]),
        "present_support": int(present_mask.sum().cpu().item()),
        "presence_accuracy": float(presence_correct.to(dtype=torch.float32).mean().cpu().item()),
        "predicted_present_rate": float(predicted_presence.mean().cpu().item()),
        "true_positive_count": true_positive_count,
        "true_negative_count": true_negative_count,
        "false_positive_count": false_positive_count,
        "false_negative_count": false_negative_count,
        "present_box_mae": box_mae,
        "present_box_mean_iou": mean_iou,
        "median_constant_box_mae": median_box_mae,
        "median_constant_box_mean_iou": median_mean_iou,
        "microprobe_minus_median_box_mae": None if box_mae is None or median_box_mae is None else box_mae - median_box_mae,
        "microprobe_minus_median_mean_iou": None
        if mean_iou is None or median_mean_iou is None
        else mean_iou - median_mean_iou,
    }


def row_level_predictions(
    torch: Any,
    model: Any,
    values: dict[str, Any],
    anchor_box: Any,
    residual_scale: Any,
) -> list[dict[str, Any]]:
    predictions = predict_split(torch, model, values, anchor_box, residual_scale)
    rows = values["rows"]
    presence = values["presence"]
    boxes = values["boxes"]
    predicted_presence = predictions["predicted_presence"]
    presence_scores = predictions["presence_scores"]
    selected_box = predictions["selected_box"]
    selected_residual = predictions["selected_residual"]
    target_cell_box = predictions["target_cell_box"]
    target_cell_residual = predictions["target_cell_residual"]

    results = []
    for index, row in enumerate(rows):
        target_present = bool(presence[index].item())
        predicted_present = bool(predicted_presence[index].item())
        target_box = boxes[index]
        row_selected_box = selected_box[index]
        median_abs_errors = (anchor_box - target_box).abs()
        microprobe_abs_errors = (row_selected_box - target_box).abs()
        if target_present:
            median_mae = float(median_abs_errors.mean().item())
            microprobe_mae = float(microprobe_abs_errors.mean().item())
            median_iou = float(box_iou(torch, anchor_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            microprobe_iou = float(box_iou(torch, row_selected_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            target_cell_iou = float(box_iou(torch, target_cell_box[index].unsqueeze(0), target_box.unsqueeze(0)).item())
            target_box_list = as_float_list(target_box)
            median_abs_error_list = as_float_list(median_abs_errors)
            microprobe_abs_error_list = as_float_list(microprobe_abs_errors)
            target_cell_box_list = as_float_list(target_cell_box[index])
            target_cell_residual_list = as_float_list(target_cell_residual[index])
        else:
            median_mae = None
            microprobe_mae = None
            median_iou = None
            microprobe_iou = None
            target_cell_iou = None
            target_box_list = None
            median_abs_error_list = None
            microprobe_abs_error_list = None
            target_cell_box_list = None
            target_cell_residual_list = None

        results.append(
            {
                "row_id": row["row_id"],
                "clip_id": row["clip_id"],
                "split": row["split"],
                "label_id": row["label_id"],
                "source_record_id": row["source_record_id"],
                "signer_identity_hash": row["signer_identity_hash"],
                "frame_index": row["frame_index"],
                "target_present": target_present,
                "predicted_presence_score": float(presence_scores[index].item()),
                "fixed_presence_threshold": FIXED_PRESENCE_THRESHOLD,
                "predicted_present": predicted_present,
                "presence_correct": predicted_present == target_present,
                "selected_cell_yx": [
                    int(predictions["selected_cell_y"][index].item()),
                    int(predictions["selected_cell_x"][index].item()),
                ],
                "target_cell_yx_if_present": None
                if not target_present
                else [
                    int(predictions["target_cell_y"][index].item()),
                    int(predictions["target_cell_x"][index].item()),
                ],
                "target_box_xyxy_norm": target_box_list,
                "median_anchor_box_xyxy_norm": as_float_list(anchor_box),
                "selected_cell_predicted_residual_xyxy_norm": as_float_list(selected_residual[index]),
                "selected_cell_predicted_box_xyxy_norm": as_float_list(row_selected_box),
                "target_cell_predicted_residual_xyxy_norm_if_present": target_cell_residual_list,
                "target_cell_predicted_box_xyxy_norm_if_present": target_cell_box_list,
                "median_box_abs_error_xyxy": median_abs_error_list,
                "microprobe_box_abs_error_xyxy": microprobe_abs_error_list,
                "median_box_mae_if_present": median_mae,
                "microprobe_box_mae_if_present": microprobe_mae,
                "microprobe_minus_median_box_mae": None
                if median_mae is None or microprobe_mae is None
                else microprobe_mae - median_mae,
                "median_mean_iou_if_present": median_iou,
                "microprobe_mean_iou_if_present": microprobe_iou,
                "target_cell_microprobe_iou_if_present": target_cell_iou,
                "microprobe_minus_median_mean_iou": None
                if median_iou is None or microprobe_iou is None
                else microprobe_iou - median_iou,
            }
        )
    return results


def threshold_sweep(torch: Any, result: dict[str, Any]) -> dict[str, Any]:
    sweep = {}
    for split, predictions in result["row_level_predictions"].items():
        presence_scores = torch.tensor([row["predicted_presence_score"] for row in predictions], dtype=torch.float32)
        targets = torch.tensor([1.0 if row["target_present"] else 0.0 for row in predictions], dtype=torch.float32)
        split_sweep = []
        for threshold in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
            predicted = (presence_scores >= threshold).to(dtype=torch.float32)
            split_sweep.append(
                {
                    "threshold": threshold,
                    "presence_accuracy": float((predicted == targets).to(dtype=torch.float32).mean().item()),
                    "false_positive_count": int(((predicted == 1.0) & (targets == 0.0)).sum().item()),
                    "false_negative_count": int(((predicted == 0.0) & (targets == 1.0)).sum().item()),
                    "diagnostic_only": True,
                }
            )
        sweep[split] = split_sweep
    return {
        "diagnostic_only": True,
        "threshold_selected_or_promoted": False,
        "selected_threshold": None,
        "per_split": sweep,
    }


def train_microprobe(torch: Any, args: argparse.Namespace, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    model = build_spatial_objectness_model(torch).to(device)
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
    initial_metrics = evaluate_split(torch, model, device_dataset["train"], anchor_box, residual_scale, args)
    history = [
        {
            "epoch": 0,
            "train_loss": initial_metrics["loss"],
            "train_presence_accuracy": initial_metrics["presence_accuracy"],
            "train_present_box_mae": initial_metrics["present_box_mae"],
            "train_present_box_mean_iou": initial_metrics["present_box_mean_iou"],
        }
    ]
    best_train_loss = initial_metrics["loss"]["total"]

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        objectness_logits, raw_residual_map = model(device_dataset["train"]["x"])
        loss, _losses = microprobe_loss(
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

        if epoch <= 5 or epoch % 10 == 0 or epoch == args.max_epochs:
            train_metrics = evaluate_split(torch, model, device_dataset["train"], anchor_box, residual_scale, args)
            best_train_loss = min(best_train_loss, train_metrics["loss"]["total"])
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_presence_accuracy": train_metrics["presence_accuracy"],
                    "train_present_box_mae": train_metrics["present_box_mae"],
                    "train_present_box_mean_iou": train_metrics["present_box_mean_iou"],
                }
            )

    metrics = {
        split: evaluate_split(torch, model, values, anchor_box, residual_scale, args)
        for split, values in device_dataset.items()
    }
    predictions = {
        split: row_level_predictions(torch, model, values, anchor_box, residual_scale)
        for split, values in device_dataset.items()
    }
    final_train_loss = metrics["train"]["loss"]["total"]
    initial_loss = initial_metrics["loss"]["total"]
    return {
        "device": str(device),
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": args.max_epochs,
        "history": history,
        "metrics": metrics,
        "row_level_predictions": predictions,
        "threshold_sweep": threshold_sweep(torch, {"row_level_predictions": predictions}),
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


def classify_microprobe(result: dict[str, Any]) -> dict[str, Any]:
    train = result["metrics"]["train"]
    validation = result["metrics"]["validation"]
    test = result["metrics"]["test"]
    pass_gates = {
        "train_presence_accuracy_eq_1": train["presence_accuracy"] == 1.0,
        "train_present_box_mae_below_m3ae_aj_median": (
            train["present_box_mae"] is not None and train["present_box_mae"] < TRAIN_MEDIAN_MAE_BAR
        ),
        "train_present_box_mean_iou_above_m3ae_aj_median": (
            train["present_box_mean_iou"] is not None and train["present_box_mean_iou"] > TRAIN_MEDIAN_IOU_BAR
        ),
        "validation_presence_accuracy_gte_0_80": validation["presence_accuracy"] >= 0.80,
        "test_presence_accuracy_gte_0_80": test["presence_accuracy"] >= 0.80,
        "validation_false_positives_lte_1": validation["false_positive_count"] <= 1,
        "validation_false_negatives_lte_1": validation["false_negative_count"] <= 1,
        "test_false_positives_lte_1": test["false_positive_count"] <= 1,
        "test_false_negatives_lte_1": test["false_negative_count"] <= 1,
        "validation_present_box_mae_lte_m3ae_aj_median": (
            validation["present_box_mae"] is not None and validation["present_box_mae"] <= VALIDATION_MEDIAN_MAE_BAR
        ),
        "test_present_box_mae_lte_m3ae_aj_median": (
            test["present_box_mae"] is not None and test["present_box_mae"] <= TEST_MEDIAN_MAE_BAR
        ),
        "validation_present_box_mean_iou_gte_m3ae_aj_median": (
            validation["present_box_mean_iou"] is not None
            and validation["present_box_mean_iou"] >= VALIDATION_MEDIAN_IOU_BAR
        ),
        "test_present_box_mean_iou_gte_m3ae_aj_median": (
            test["present_box_mean_iou"] is not None and test["present_box_mean_iou"] >= TEST_MEDIAN_IOU_BAR
        ),
        "row_level_predictions_recorded": all(
            len(result["row_level_predictions"][split]) == result["metrics"][split]["sample_count"]
            for split in ("train", "validation", "test")
        ),
        "median_baseline_comparison_recorded": all(
            result["metrics"][split]["median_constant_box_mae"] is not None
            for split in ("train", "validation", "test")
        ),
        "training_or_export_boundaries_preserved": True,
    }
    train_gates_passed = all(
        pass_gates[key]
        for key in (
            "train_presence_accuracy_eq_1",
            "train_present_box_mae_below_m3ae_aj_median",
            "train_present_box_mean_iou_above_m3ae_aj_median",
        )
    )
    all_gates_passed = all(pass_gates.values())
    data_or_schema_invalidation_found = False
    if all_gates_passed:
        classification = "spatial_objectness_v2_passed_train_and_heldout_gates"
        next_action = "crop_normalization_ablation_design"
        reason = (
            "The selected v2 spatial objectness microprobe passed all train and held-out gates without "
            "packet, tensor, source, or schema invalidation."
        )
    elif data_or_schema_invalidation_found:
        classification = "data_or_schema_invalidation_found"
        next_action = "detector0_union_target_data_or_schema_remediation"
        reason = "A concrete packet, split, target, tensor, or schema issue invalidated the architecture comparison."
    elif train_gates_passed:
        classification = "train_fit_but_heldout_failure_repeated"
        next_action = "stop_reduced_claim"
        reason = (
            "The selected v2 model fit the train gates but did not clear every held-out presence and box gate, "
            "and no concrete data/schema invalidation was found."
        )
    else:
        classification = "bounded_v2_microprobe_failed_train_gate"
        next_action = "stop_reduced_claim"
        reason = (
            "The selected v2 model ran against current packet tensors but did not clear every train gate; "
            "the active prompt routes this to stop_reduced_claim."
        )
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "data_or_schema_invalidation_found": data_or_schema_invalidation_found,
        "not_a_product_readiness_claim": True,
        "pass_gates": {
            "criteria": {
                "train_presence_accuracy": "1.0",
                "train_present_box_mae_lt": TRAIN_MEDIAN_MAE_BAR,
                "train_present_box_mean_iou_gt": TRAIN_MEDIAN_IOU_BAR,
                "validation_presence_accuracy_gte": 0.80,
                "test_presence_accuracy_gte": 0.80,
                "validation_false_positives_lte": 1,
                "validation_false_negatives_lte": 1,
                "test_false_positives_lte": 1,
                "test_false_negatives_lte": 1,
                "validation_present_box_mae_lte": VALIDATION_MEDIAN_MAE_BAR,
                "test_present_box_mae_lte": TEST_MEDIAN_MAE_BAR,
                "validation_present_box_mean_iou_gte": VALIDATION_MEDIAN_IOU_BAR,
                "test_present_box_mean_iou_gte": TEST_MEDIAN_IOU_BAR,
                "row_level_predictions_recorded": True,
                "median_baseline_comparison_recorded": True,
                "training_or_export_boundaries_preserved": True,
            },
            "actual": {
                "train_presence_accuracy": train["presence_accuracy"],
                "train_present_box_mae": train["present_box_mae"],
                "train_present_box_mean_iou": train["present_box_mean_iou"],
                "validation_presence_accuracy": validation["presence_accuracy"],
                "validation_false_positive_count": validation["false_positive_count"],
                "validation_false_negative_count": validation["false_negative_count"],
                "validation_present_box_mae": validation["present_box_mae"],
                "validation_present_box_mean_iou": validation["present_box_mean_iou"],
                "test_presence_accuracy": test["presence_accuracy"],
                "test_false_positive_count": test["false_positive_count"],
                "test_false_negative_count": test["false_negative_count"],
                "test_present_box_mae": test["present_box_mae"],
                "test_present_box_mean_iou": test["present_box_mean_iou"],
                "row_level_prediction_count": sum(
                    len(result["row_level_predictions"][split]) for split in ("train", "validation", "test")
                ),
                "median_baseline_comparison_recorded": pass_gates["median_baseline_comparison_recorded"],
            },
            "passed": pass_gates,
            "train_gates_passed": train_gates_passed,
            "all_passed": all_gates_passed,
        },
    }


def next_action_description(next_action: str) -> str:
    if next_action == "crop_normalization_ablation_design":
        return "Design the next bounded crop-normalization ablation only after all v2 train and held-out gates passed."
    if next_action == "detector0_union_target_data_or_schema_remediation":
        return "Inspect concrete packet, split, target, tensor, or schema evidence before another architecture comparison."
    if next_action == "stop_reduced_claim":
        return "Stop and reduce the Detector 0 claim because no bounded no-new-source Detector 0 path remains justified."
    return "Stop until a recognized M3AE-AP next action is selected."


def baseline_comparison(result: dict[str, Any], baseline_receipt: dict[str, Any]) -> dict[str, Any]:
    baseline = baseline_receipt["baseline_metrics"]["median_constant_box"]
    comparison = {}
    for split in ("train", "validation", "test"):
        metrics = result["metrics"][split]
        comparison[split] = {
            "m3ae_aj_median_box_mae": baseline[split]["box_mae_if_present"],
            "microprobe_present_box_mae": metrics["present_box_mae"],
            "microprobe_minus_m3ae_aj_median_mae": None
            if metrics["present_box_mae"] is None
            else metrics["present_box_mae"] - baseline[split]["box_mae_if_present"],
            "m3ae_aj_median_mean_iou": baseline[split]["mean_iou_if_present"],
            "microprobe_present_box_mean_iou": metrics["present_box_mean_iou"],
            "microprobe_minus_m3ae_aj_median_iou": None
            if metrics["present_box_mean_iou"] is None
            else metrics["present_box_mean_iou"] - baseline[split]["mean_iou_if_present"],
            "microprobe_presence_accuracy": metrics["presence_accuracy"],
            "microprobe_false_positive_count": metrics["false_positive_count"],
            "microprobe_false_negative_count": metrics["false_negative_count"],
            "presence_note": "Microprobe predicts runtime presence; M3AE-AJ median box was not a detector.",
        }
    return {
        "source_receipt": file_ref(REFERENCE_PATHS["m3ae_aj_median_baseline"]),
        "anchor_box_matches_m3ae_aj_train_median": ANCHOR_BOX
        == baseline_receipt["baseline_metrics"]["median_constant_box"]["train"]["constant_box_xyxy_norm"],
        "minimum_future_detector0_bar": baseline_receipt["minimum_future_detector0_bar"],
        "per_split": comparison,
    }


def main() -> int:
    args = parse_args()
    if args.target_id != UNION_TARGET_ID:
        raise Detector0SmokeError(f"--target-id must be {UNION_TARGET_ID}")
    if args.anchor_box_source != "m3ae_aj_train_median":
        raise Detector0SmokeError("--anchor-box-source must be m3ae_aj_train_median")
    if args.max_epochs < 1 or args.max_epochs > 300:
        raise Detector0SmokeError("--max-epochs must be in [1, 300]")

    torch = import_torch()
    raw_dataset, packet_evidence = load_architecture_dataset(torch, args.packet.resolve())
    microprobe_result = train_microprobe(torch, args, raw_dataset)
    classification = classify_microprobe(microprobe_result)
    next_action = classification["next_action"]
    baseline_receipt = read_json(REFERENCE_PATHS["m3ae_aj_median_baseline"])

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-AP Detector 0 union-target architecture microprobe v2",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "local architecture microprobe records metrics and predictions only; export, promotion, or final model artifact is not authorized",
        },
        "local_device": microprobe_result["device"],
        "seed": args.seed,
        "selected_formulation": SELECTED_FORMULATION,
        "configuration": {
            "input_representation": {
                "source_tensor_key": "rgb_regions",
                "region": "full_frame_reference",
                "frame": "packet frame_index",
                "resolution": [96, 96],
                "channels": ["red", "green", "blue", "x_norm", "y_norm"],
                "normalization": "RGB float32 values in [0, 1]; x_norm/y_norm deterministic from pixel indices",
                "does_not_use": [
                    "rgb_regions_grid_v1",
                    "rgb_frames compatibility tensor",
                    "pretrained detector outputs",
                    "pretrained landmarks",
                    "generated pseudo-labels",
                ],
            },
            "target_id": UNION_TARGET_ID,
            "anchor_box_source": args.anchor_box_source,
            "anchor_box_xyxy_norm": ANCHOR_BOX,
            "residual_scale_xyxy_norm": RESIDUAL_SCALE,
            "spatial_objectness_map": [GRID_SIZE, GRID_SIZE],
            "presence_score": "max sigmoid(objectness logits) over 12x12 map",
            "fixed_presence_threshold": FIXED_PRESENCE_THRESHOLD,
            "box_prediction": "selected-cell residual plus M3AE-AJ median anchor; target-cell residual used for present-row box loss",
            "predicted_box": "clamp(anchor_box + residual_scale * tanh(raw_residual_at_cell), 0.0, 1.0)",
            "initialization": {
                "conv_weights": "Kaiming normal",
                "conv_biases": "zero",
                "objectness_bias": "train positive-cell prior logit",
                "box_head_weights": "zero",
                "box_head_biases": "zero",
                "initial_box_equals_m3ae_aj_train_median": True,
            },
            "loss": {
                "objectness": f"balanced focal BCE over {GRID_SIZE}x{GRID_SIZE} heatmap cells, gamma={args.focal_gamma}",
                "hard_negative": f"{args.hard_negative_weight} * BCE(max absent-row objectness logit, 0)",
                "box_residual": f"SmoothL1Loss(beta={args.smooth_l1_beta}) over present target cells",
                "iou": f"{args.iou_loss_weight} * (1 - IoU) over present target cells",
            },
            "optimizer": {
                "name": "AdamW",
                "learning_rate": args.learning_rate,
                "weight_decay": args.weight_decay,
                "gradient_clip_max_norm": args.gradient_clip,
            },
            "bounds": {
                "max_epochs": args.max_epochs,
                "epochs_ran": microprobe_result["epochs_ran"],
                "batching": "full train split batch",
                "device_scope": "local CPU/MPS only; Brev compute forbidden",
            },
        },
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "architecture_microprobe_v2_runner": file_ref(Path(__file__).resolve()),
        },
        "packet_evidence": packet_evidence,
        "model": {
            "model_id": SELECTED_FORMULATION,
            "description": "Scratch CNN retaining a 12x12 objectness map and bounded xyxy residuals anchored at the M3AE-AJ train median box.",
            "pretrained_components": [],
            "random_initialization": True,
            "parameter_count": microprobe_result["model_parameter_count"],
            "uses_pretrained_detector_or_landmark": False,
        },
        "training": {
            "one_selected_microprobe_run": True,
            "not_generic_detector0_training_smoke_retry": True,
            "loss_movement": microprobe_result["loss_movement"],
            "history": microprobe_result["history"],
            "metrics": microprobe_result["metrics"],
            "fixed_threshold_presence_behavior": {
                "threshold": FIXED_PRESENCE_THRESHOLD,
                "per_split": {
                    split: {
                        "presence_accuracy": microprobe_result["metrics"][split]["presence_accuracy"],
                        "true_positive_count": microprobe_result["metrics"][split]["true_positive_count"],
                        "true_negative_count": microprobe_result["metrics"][split]["true_negative_count"],
                        "false_positive_count": microprobe_result["metrics"][split]["false_positive_count"],
                        "false_negative_count": microprobe_result["metrics"][split]["false_negative_count"],
                    }
                    for split in ("train", "validation", "test")
                },
            },
            "diagnostic_threshold_sweep": microprobe_result["threshold_sweep"],
            "row_level_predictions": microprobe_result["row_level_predictions"],
        },
        "median_baseline_comparison": baseline_comparison(microprobe_result, baseline_receipt),
        "readiness_classification": classification,
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
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this local Detector 0 architecture microprobe",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "local_architecture_microprobe_jobs_run": 1,
            "generic_detector0_training_smoke_retry": False,
            "device_scope": "local CPU/MPS only",
            "packet_mutation": False,
            "rows_added": False,
            "brev_sync": False,
            "brev_training": False,
            "brev_spend": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "recognizer_training": False,
            "crop_normalization_ablation": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "label_expansion": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "product_runtime_code_change": False,
            "pretrained_detector_or_landmark_use": False,
            "generated_pseudo_label_use": False,
            "threshold_selected_or_promoted": False,
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
                "local_device": microprobe_result["device"],
                "epochs_ran": microprobe_result["epochs_ran"],
                "classification": classification["classification"],
                "train_presence_accuracy": microprobe_result["metrics"]["train"]["presence_accuracy"],
                "train_present_box_mae": microprobe_result["metrics"]["train"]["present_box_mae"],
                "train_median_constant_box_mae": TRAIN_MEDIAN_MAE_BAR,
                "train_present_box_mean_iou": microprobe_result["metrics"]["train"]["present_box_mean_iou"],
                "train_median_constant_box_mean_iou": TRAIN_MEDIAN_IOU_BAR,
                "validation_presence_accuracy": microprobe_result["metrics"]["validation"]["presence_accuracy"],
                "validation_false_positive_count": microprobe_result["metrics"]["validation"]["false_positive_count"],
                "validation_false_negative_count": microprobe_result["metrics"]["validation"]["false_negative_count"],
                "validation_present_box_mae": microprobe_result["metrics"]["validation"]["present_box_mae"],
                "test_presence_accuracy": microprobe_result["metrics"]["test"]["presence_accuracy"],
                "test_false_positive_count": microprobe_result["metrics"]["test"]["false_positive_count"],
                "test_false_negative_count": microprobe_result["metrics"]["test"]["false_negative_count"],
                "test_present_box_mae": microprobe_result["metrics"]["test"]["present_box_mae"],
                "row_level_predictions_recorded": sum(
                    len(microprobe_result["row_level_predictions"][split])
                    for split in ("train", "validation", "test")
                ),
                "next_action": next_action,
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
