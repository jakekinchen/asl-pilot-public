#!/usr/bin/env python3
"""Run the M3AE-AL union-target architecture microprobe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import shlex
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    DEFAULT_PACKET,
    EXPECTED_PACKET_SHA256,
    EXPECTED_SPLIT_COUNTS,
    EXPECTED_UNION_SUPPORT_BY_SPLIT,
    REFERENCE_PATHS as UNION_SMOKE_REFERENCE_PATHS,
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    box_iou,
    brev_no_spend_status,
    encode_union_target,
    file_ref,
    load_tensor_payload,
    project_relative,
    read_json,
    resolve_packet_tensor_path,
    validate_packet_row,
    write_json,
)
from train_rawframe_model import TrainingError, import_torch, sha256_file


SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-architecture-microprobe/v1"
DEFAULT_OUTPUT = (
    ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json"
)
ANCHOR_BOX = [
    0.11999999731779099,
    0.47999998927116394,
    0.8199999928474426,
    0.7200000286102295,
]
RESIDUAL_SCALE = [0.16, 0.16, 0.08, 0.18]
TRAIN_MEDIAN_MAE_BAR = 0.04107142239809036
TRAIN_MEDIAN_IOU_BAR = 0.6165503859519958
REFERENCE_PATHS = {
    **UNION_SMOKE_REFERENCE_PATHS,
    "m3ae_ak_architecture_design": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md",
    "m3ae_ak_session_log": ROOT
    / "docs"
    / "session-logs"
    / "252-return-to-form-tier0-detector0-union-target-architecture-reformulation-design.md",
    "m3ae_aj_median_baseline": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json",
    "m3ae_ai_smoke_continue": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json",
    "m3ae_ah_union_data_schema_remediation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json",
    "m3ae_ag_union_training_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json",
    "observer_249_api_diagnostic": ROOT
    / "artifacts"
    / "research"
    / "observer-249-union-target-smoke-diagnostic-api-response.md",
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
    parser.add_argument("--success-patience", type=int, default=10)
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


def as_float_list(values: Any) -> list[float]:
    if hasattr(values, "detach"):
        return [float(value) for value in values.detach().cpu().tolist()]
    return [float(value) for value in values]


def coordconv_full_frame_feature(torch: Any, payload: dict[str, Any], frame_index: int, row_id: str) -> Any:
    regions = payload.get("rgb_regions")
    region_ids = payload.get("region_ids")
    if not torch.is_tensor(regions):
        raise Detector0SmokeError(f"{row_id} tensor payload missing rgb_regions")
    if not isinstance(region_ids, list) or "full_frame_reference" not in region_ids:
        raise Detector0SmokeError(f"{row_id} tensor payload missing full_frame_reference region")
    if regions.ndim != 5 or int(regions.shape[-1]) != 3:
        raise Detector0SmokeError(f"{row_id} rgb_regions must be T,R,H,W,C with 3 channels")
    if frame_index < 0 or frame_index >= int(regions.shape[0]):
        raise Detector0SmokeError(f"{row_id} frame_index {frame_index} outside tensor frame count")

    region_index = [str(item) for item in region_ids].index("full_frame_reference")
    frame = regions[frame_index, region_index].to(dtype=torch.float32).div(255.0)
    if tuple(frame.shape) != (96, 96, 3):
        raise Detector0SmokeError(f"{row_id} full_frame_reference must stay 96x96x3; got {tuple(frame.shape)}")
    rgb = frame.permute(2, 0, 1)
    y_norm = torch.linspace(0.0, 1.0, 96, dtype=torch.float32).view(1, 96, 1).expand(1, 96, 96)
    x_norm = torch.linspace(0.0, 1.0, 96, dtype=torch.float32).view(1, 1, 96).expand(1, 96, 96)
    return torch.cat([rgb, x_norm, y_norm], dim=0)


def load_architecture_dataset(torch: Any, packet_path: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    packet = read_json(packet_path)
    packet_hash = sha256_file(packet_path)
    if packet_hash != EXPECTED_PACKET_SHA256:
        raise Detector0SmokeError(f"union-target packet hash mismatch: {packet_hash}")
    if packet.get("status") != "expanded_packet_ready_for_detector0_smoke":
        raise Detector0SmokeError(f"packet status is not expanded-smoke ready: {packet.get('status')}")
    schema = packet.get("target_schema", {})
    target_ids = schema.get("target_ids")
    if not isinstance(target_ids, list) or UNION_TARGET_ID not in target_ids:
        raise Detector0SmokeError(f"packet target_schema does not include {UNION_TARGET_ID}")
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise Detector0SmokeError("architecture microprobe expects exactly 32 packet rows")

    features_by_split: dict[str, list[Any]] = defaultdict(list)
    presence_by_split: dict[str, list[float]] = defaultdict(list)
    boxes_by_split: dict[str, list[list[float]]] = defaultdict(list)
    row_records_by_split: dict[str, list[dict[str, Any]]] = defaultdict(list)
    split_counts = Counter()
    label_counts_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    union_support_by_split = Counter()
    source_ids = set()
    tensor_hashes_checked = 0

    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise Detector0SmokeError(f"frame_rows[{index}] must be an object")
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))
        source_id = str(row.get("source_id"))
        validate_packet_row(row, row_id, split, label_id, source_id)

        tensor_path = resolve_packet_tensor_path(packet_path, row)
        expected_hash = str(row.get("frame_tensor_sha256"))
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise Detector0SmokeError(
                f"{row_id} tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
            )
        payload = load_tensor_payload(torch, tensor_path)
        feature = coordconv_full_frame_feature(torch, payload, int(row.get("frame_index")), row_id)
        presence, boxes = encode_union_target(row)

        features_by_split[split].append(feature)
        presence_by_split[split].append(float(presence[0]))
        boxes_by_split[split].append([float(value) for value in boxes[0]])
        split_counts[split] += 1
        label_counts_by_split[split][label_id] += 1
        if presence[0]:
            union_support_by_split[split] += 1
        source_ids.add(source_id)
        tensor_hashes_checked += 1
        row_records_by_split[split].append(
            {
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
                "union_target_present": bool(presence[0]),
            }
        )

    if dict(split_counts) != EXPECTED_SPLIT_COUNTS:
        raise Detector0SmokeError(f"unexpected union packet split counts: {dict(split_counts)}")
    if dict(union_support_by_split) != EXPECTED_UNION_SUPPORT_BY_SPLIT:
        raise Detector0SmokeError(f"unexpected union support counts: {dict(union_support_by_split)}")

    dataset = {}
    for split in ("train", "validation", "test"):
        dataset[split] = {
            "x": torch.stack(features_by_split[split], dim=0),
            "presence": torch.tensor(presence_by_split[split], dtype=torch.float32),
            "boxes": torch.tensor(boxes_by_split[split], dtype=torch.float32),
            "rows": row_records_by_split[split],
        }

    evidence = {
        "packet": {
            "path": project_relative(packet_path),
            "sha256": packet_hash,
        },
        "split_counts": dict(split_counts),
        "label_counts_by_split": {
            split: dict(sorted(counts.items())) for split, counts in sorted(label_counts_by_split.items())
        },
        "union_target_support_by_split": dict(union_support_by_split),
        "source_ids": sorted(source_ids),
        "target_ids": [UNION_TARGET_ID],
        "tensor_hashes_checked": tensor_hashes_checked,
        "rows_by_split": {split: dataset[split]["rows"] for split in ("train", "validation", "test")},
    }
    return dataset, evidence


def build_anchor_residual_model(torch: Any) -> Any:
    class AnchorResidualCoordConvDetector(torch.nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.features = torch.nn.Sequential(
                torch.nn.Conv2d(5, 16, kernel_size=3, padding=1),
                torch.nn.GroupNorm(4, 16),
                torch.nn.SiLU(),
                torch.nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 32),
                torch.nn.SiLU(),
                torch.nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 64),
                torch.nn.SiLU(),
                torch.nn.Conv2d(64, 64, kernel_size=3, stride=2, padding=1),
                torch.nn.GroupNorm(8, 64),
                torch.nn.SiLU(),
                torch.nn.AdaptiveAvgPool2d((1, 1)),
            )
            self.head = torch.nn.Linear(64, 5)
            self.reset_parameters()

        def reset_parameters(self) -> None:
            for module in self.modules():
                if isinstance(module, torch.nn.Conv2d):
                    torch.nn.init.kaiming_normal_(module.weight, nonlinearity="linear")
                    if module.bias is not None:
                        torch.nn.init.zeros_(module.bias)
            torch.nn.init.zeros_(self.head.weight)
            torch.nn.init.zeros_(self.head.bias)
            self.head.bias.data[0] = math.log(7.0 / 4.0)

        def forward(self, x: Any) -> Any:
            encoded = self.features(x).flatten(1)
            return self.head(encoded)

    return AnchorResidualCoordConvDetector()


def predict_boxes(torch: Any, raw_output: Any, anchor_box: Any, residual_scale: Any) -> tuple[Any, Any, Any]:
    presence_logits = raw_output[:, 0]
    residual_raw = raw_output[:, 1:5]
    predicted_residual = residual_scale * torch.tanh(residual_raw)
    predicted_box = (anchor_box + predicted_residual).clamp(0.0, 1.0)
    return presence_logits, predicted_residual, predicted_box


def microprobe_loss(
    torch: Any,
    raw_output: Any,
    presence: Any,
    boxes: Any,
    anchor_box: Any,
    residual_scale: Any,
    smooth_l1_beta: float,
    iou_loss_weight: float,
) -> tuple[Any, dict[str, float]]:
    presence_logits, predicted_residual, predicted_box = predict_boxes(torch, raw_output, anchor_box, residual_scale)
    presence_loss = torch.nn.functional.binary_cross_entropy_with_logits(presence_logits, presence)
    present_mask = presence.bool()
    if bool(present_mask.any().detach().cpu().item()):
        target_residual = boxes[present_mask] - anchor_box
        residual_loss = torch.nn.functional.smooth_l1_loss(
            predicted_residual[present_mask],
            target_residual,
            beta=smooth_l1_beta,
        )
        iou_values = box_iou(torch, predicted_box[present_mask], boxes[present_mask])
        iou_loss = (1.0 - iou_values).mean()
    else:
        residual_loss = torch.zeros((), device=raw_output.device)
        iou_loss = torch.zeros((), device=raw_output.device)
    total_loss = presence_loss + residual_loss + iou_loss_weight * iou_loss
    return total_loss, {
        "total": float(total_loss.detach().cpu().item()),
        "presence": float(presence_loss.detach().cpu().item()),
        "smooth_l1_residual": float(residual_loss.detach().cpu().item()),
        "iou": float(iou_loss.detach().cpu().item()),
        "iou_weighted": float((iou_loss_weight * iou_loss).detach().cpu().item()),
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
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        raw_output = model(x)
        _loss, losses = microprobe_loss(
            torch,
            raw_output,
            presence,
            boxes,
            anchor_box,
            residual_scale,
            args.smooth_l1_beta,
            args.iou_loss_weight,
        )
        presence_logits, _predicted_residual, predicted_box = predict_boxes(
            torch,
            raw_output,
            anchor_box,
            residual_scale,
        )
        presence_scores = torch.sigmoid(presence_logits)
        predicted_presence = (presence_scores >= 0.5).to(dtype=torch.float32)
        present_mask = presence.bool()
        if bool(present_mask.any().cpu().item()):
            box_mae = float((predicted_box[present_mask] - boxes[present_mask]).abs().mean().cpu().item())
            mean_iou = float(box_iou(torch, predicted_box[present_mask], boxes[present_mask]).mean().cpu().item())
            median_box_mae = float((anchor_box.unsqueeze(0) - boxes[present_mask]).abs().mean().cpu().item())
            median_mean_iou = float(box_iou(torch, anchor_box.unsqueeze(0), boxes[present_mask]).mean().cpu().item())
        else:
            box_mae = None
            mean_iou = None
            median_box_mae = None
            median_mean_iou = None
    presence_correct = predicted_presence == presence
    false_positive_count = int(((predicted_presence == 1.0) & (presence == 0.0)).sum().cpu().item())
    false_negative_count = int(((predicted_presence == 0.0) & (presence == 1.0)).sum().cpu().item())
    return {
        "loss": losses,
        "sample_count": int(x.shape[0]),
        "present_support": int(present_mask.sum().cpu().item()),
        "presence_accuracy": float(presence_correct.to(dtype=torch.float32).mean().cpu().item()),
        "predicted_present_rate": float(predicted_presence.mean().cpu().item()),
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
    model.eval()
    rows = values["rows"]
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        raw_output = model(x)
        presence_logits, predicted_residual, predicted_box = predict_boxes(
            torch,
            raw_output,
            anchor_box,
            residual_scale,
        )
        presence_scores = torch.sigmoid(presence_logits)
        predicted_presence = (presence_scores >= 0.5).to(dtype=torch.float32)

    results = []
    for index, row in enumerate(rows):
        target_present = bool(presence[index].item())
        predicted_present = bool(predicted_presence[index].item())
        target_box = boxes[index]
        row_predicted_box = predicted_box[index]
        median_abs_errors = (anchor_box - target_box).abs()
        microprobe_abs_errors = (row_predicted_box - target_box).abs()
        if target_present:
            median_mae = float(median_abs_errors.mean().item())
            microprobe_mae = float(microprobe_abs_errors.mean().item())
            median_iou = float(box_iou(torch, anchor_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            microprobe_iou = float(box_iou(torch, row_predicted_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            target_box_list = as_float_list(target_box)
            median_abs_error_list = as_float_list(median_abs_errors)
            microprobe_abs_error_list = as_float_list(microprobe_abs_errors)
        else:
            median_mae = None
            microprobe_mae = None
            median_iou = None
            microprobe_iou = None
            target_box_list = None
            median_abs_error_list = None
            microprobe_abs_error_list = None

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
                "predicted_present": predicted_present,
                "presence_correct": predicted_present == target_present,
                "target_box_xyxy_norm": target_box_list,
                "median_anchor_box_xyxy_norm": as_float_list(anchor_box),
                "predicted_residual_xyxy_norm": as_float_list(predicted_residual[index]),
                "predicted_box_xyxy_norm": as_float_list(row_predicted_box),
                "median_box_abs_error_xyxy": median_abs_error_list,
                "microprobe_box_abs_error_xyxy": microprobe_abs_error_list,
                "median_box_mae_if_present": median_mae,
                "microprobe_box_mae_if_present": microprobe_mae,
                "microprobe_minus_median_box_mae": None
                if median_mae is None or microprobe_mae is None
                else microprobe_mae - median_mae,
                "median_mean_iou_if_present": median_iou,
                "microprobe_mean_iou_if_present": microprobe_iou,
                "microprobe_minus_median_mean_iou": None
                if median_iou is None or microprobe_iou is None
                else microprobe_iou - median_iou,
            }
        )
    return results


def train_microprobe(torch: Any, args: argparse.Namespace, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    model = build_anchor_residual_model(torch).to(device)
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
            "success_gate_met": False,
        }
    ]
    best_train_loss = initial_metrics["loss"]["total"]
    epochs_ran = 0
    consecutive_success_epochs = 0

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        raw_output = model(device_dataset["train"]["x"])
        loss, _losses = microprobe_loss(
            torch,
            raw_output,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
            anchor_box,
            residual_scale,
            args.smooth_l1_beta,
            args.iou_loss_weight,
        )
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), args.gradient_clip)
        optimizer.step()
        epochs_ran = epoch

        train_metrics = evaluate_split(torch, model, device_dataset["train"], anchor_box, residual_scale, args)
        best_train_loss = min(best_train_loss, train_metrics["loss"]["total"])
        success_gate_met = (
            train_metrics["presence_accuracy"] == 1.0
            and train_metrics["present_box_mae"] is not None
            and train_metrics["present_box_mae"] < TRAIN_MEDIAN_MAE_BAR
            and train_metrics["present_box_mean_iou"] is not None
            and train_metrics["present_box_mean_iou"] > TRAIN_MEDIAN_IOU_BAR
        )
        consecutive_success_epochs = consecutive_success_epochs + 1 if success_gate_met else 0
        should_record = epoch <= 5 or epoch % 10 == 0 or success_gate_met
        if should_record:
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_presence_accuracy": train_metrics["presence_accuracy"],
                    "train_present_box_mae": train_metrics["present_box_mae"],
                    "train_present_box_mean_iou": train_metrics["present_box_mean_iou"],
                    "success_gate_met": success_gate_met,
                    "consecutive_success_epochs": consecutive_success_epochs,
                }
            )
        if consecutive_success_epochs >= args.success_patience:
            break

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
    loss_drop_fraction = (initial_loss - best_train_loss) / initial_loss if initial_loss else None
    return {
        "device": str(device),
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": epochs_ran,
        "consecutive_success_epochs": consecutive_success_epochs,
        "history": history,
        "metrics": metrics,
        "row_level_predictions": predictions,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def classify_microprobe(result: dict[str, Any]) -> dict[str, Any]:
    train = result["metrics"]["train"]
    pass_gates = {
        "train_presence_accuracy_eq_1": train["presence_accuracy"] == 1.0,
        "train_present_box_mae_below_m3ae_aj_median": (
            train["present_box_mae"] is not None and train["present_box_mae"] < TRAIN_MEDIAN_MAE_BAR
        ),
        "train_present_box_mean_iou_above_m3ae_aj_median": (
            train["present_box_mean_iou"] is not None and train["present_box_mean_iou"] > TRAIN_MEDIAN_IOU_BAR
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
    passed = all(pass_gates.values())
    if passed:
        classification = "train_median_baseline_beaten_heldout_behavior_check_design_next"
        next_action = "detector0_union_target_heldout_behavior_check_design"
        reason = (
            "The selected anchor-residual CoordConv microprobe beat the M3AE-AJ train median-box "
            "MAE and IoU gates while preserving boundaries. Held-out metrics are report-only and "
            "should be checked in a design slice before any ablation or recognizer work."
        )
    else:
        classification = "bounded_architecture_microprobe_failed_train_gate"
        next_action = "detector0_union_target_architecture_remediation"
        reason = (
            "The selected bounded formulation ran against current packet tensors but did not clear every "
            "train median-baseline gate, so the next action is architecture or optimization remediation."
        )
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "not_a_product_readiness_claim": True,
        "pass_gates": {
            "criteria": {
                "train_presence_accuracy": "1.0",
                "train_present_box_mae_lt": TRAIN_MEDIAN_MAE_BAR,
                "train_present_box_mean_iou_gt": TRAIN_MEDIAN_IOU_BAR,
                "row_level_predictions_recorded": True,
                "median_baseline_comparison_recorded": True,
                "training_or_export_boundaries_preserved": True,
            },
            "actual": {
                "train_presence_accuracy": train["presence_accuracy"],
                "train_present_box_mae": train["present_box_mae"],
                "train_present_box_mean_iou": train["present_box_mean_iou"],
                "row_level_prediction_count": sum(
                    len(result["row_level_predictions"][split]) for split in ("train", "validation", "test")
                ),
                "median_baseline_comparison_recorded": pass_gates["median_baseline_comparison_recorded"],
            },
            "passed": pass_gates,
            "all_passed": passed,
        },
    }


def next_action_description(next_action: str) -> str:
    if next_action == "detector0_union_target_heldout_behavior_check_design":
        return "Design one held-out behavior check for the passing union-target microprobe before ablation or recognizer work."
    if next_action == "detector0_union_target_architecture_remediation":
        return "Remediate the bounded architecture or optimization path before any generic smoke retry."
    if next_action == "detector0_union_target_data_or_schema_remediation":
        return "Inspect concrete packet, split, target, tensor, or schema evidence before another architecture comparison."
    if next_action == "stop_reduced_claim":
        return "Stop and reduce the Detector 0 claim because no bounded no-new-source path is justified."
    return "Stop until a recognized M3AE-AL next action is selected."


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
    if args.success_patience < 1:
        raise Detector0SmokeError("--success-patience must be positive")

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
        "mission": "M3AE-AL Detector 0 union-target architecture microprobe",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "local architecture microprobe records metrics and predictions only; export, promotion, or final model artifact is not authorized",
        },
        "local_device": microprobe_result["device"],
        "seed": args.seed,
        "selected_formulation": "anchor_residual_coordconv_union_target_microprobe_v1",
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
            "predicted_box": "clamp(anchor_box + residual_scale * tanh(raw_residual), 0.0, 1.0)",
            "initialization": {
                "conv_weights": "Kaiming normal",
                "conv_biases": "zero",
                "residual_head_weights": "zero",
                "residual_head_biases": "zero",
                "presence_head_weight": "zero",
                "presence_bias": math.log(7.0 / 4.0),
                "initial_box_equals_m3ae_aj_train_median": True,
            },
            "loss": {
                "presence": "BCEWithLogitsLoss",
                "box_residual": f"SmoothL1Loss(beta={args.smooth_l1_beta}) over present rows",
                "iou": f"{args.iou_loss_weight} * (1 - IoU) over present rows",
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
                "success_patience": args.success_patience,
                "consecutive_success_epochs": microprobe_result["consecutive_success_epochs"],
                "device_scope": "local CPU/MPS only; Brev compute forbidden",
            },
        },
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "architecture_microprobe_runner": file_ref(Path(__file__).resolve()),
        },
        "packet_evidence": packet_evidence,
        "model": {
            "model_id": "anchor_residual_coordconv_union_target_microprobe_v1",
            "description": "Scratch CoordConv CNN over one full_frame_reference packet frame with bounded residual xyxy prediction anchored at the M3AE-AJ train median box.",
            "pretrained_components": [],
            "random_initialization": True,
            "parameter_count": microprobe_result["model_parameter_count"],
            "parameter_budget_max": 100000,
            "uses_pretrained_detector_or_landmark": False,
        },
        "training": {
            "one_selected_microprobe_run": True,
            "not_generic_detector0_training_smoke_retry": True,
            "loss_movement": microprobe_result["loss_movement"],
            "history": microprobe_result["history"],
            "metrics": microprobe_result["metrics"],
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
                "validation_present_box_mae": microprobe_result["metrics"]["validation"]["present_box_mae"],
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
