#!/usr/bin/env python3
"""Run the M3AE-P local scratch Detector 0 training smoke."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from train_rawframe_model import TrainingError, import_torch, sha256_file


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-training-smoke/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-training-smoke-v1.json"
TARGET_IDS = [
    "left_or_first_hand",
    "right_or_second_hand",
    "head_or_face",
    "upper_body_or_signing_space",
]
ALLOWED_LABEL_SOURCES = {
    "manual_verified_from_fixed_crop_context",
    "project_manual_box_label",
}
ALLOWED_REVIEW_STATUSES = {"manual_verified", "manual_corrected"}
REFERENCE_PATHS = {
    "m3ae_o_followup": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-annotation-followup-v1.md",
    "m3ae_n_review": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-annotation-review-v1.md",
    "m3ae_m_packet_review": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-annotation-packet-v0-review.md",
    "m3ae_l_bootstrap": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "train_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test_manifest": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}


class Detector0SmokeError(RuntimeError):
    """Raised when the local Detector 0 smoke cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--feature-spatial-size", type=int, default=32)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--max-epochs", type=int, default=400)
    parser.add_argument("--early-stop-loss", type=float, default=0.0125)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--seed", type=int, default=141421)
    parser.add_argument("--device", choices=("auto", "cpu", "mps"), default="cpu")
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
        raise Detector0SmokeError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise Detector0SmokeError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise Detector0SmokeError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise Detector0SmokeError(f"missing reference artifact: {project_relative(path)}")
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def resolve_packet_tensor_path(packet_path: Path, row: dict[str, Any]) -> Path:
    value = row.get("frame_tensor_path")
    if not isinstance(value, str) or not value:
        raise Detector0SmokeError(f"{row.get('row_id')} missing frame_tensor_path")
    candidate = Path(value)
    if candidate.is_absolute():
        raise Detector0SmokeError(f"{row.get('row_id')} tensor path must be packet-relative")
    resolved = (packet_path.parent / candidate).resolve()
    try:
        resolved.relative_to(ROOT)
    except ValueError as error:
        raise Detector0SmokeError(f"{row.get('row_id')} tensor path escapes project root") from error
    return resolved


def validate_box(row_id: str, target_id: str, box: Any) -> list[float]:
    if not isinstance(box, list) or len(box) != 4:
        raise Detector0SmokeError(f"{row_id}:{target_id} box must be a length-4 array")
    coords = [float(value) for value in box]
    if any(value < 0.0 or value > 1.0 for value in coords):
        raise Detector0SmokeError(f"{row_id}:{target_id} box coordinates must be normalized")
    if coords[0] > coords[2] or coords[1] > coords[3]:
        raise Detector0SmokeError(f"{row_id}:{target_id} box must be xyxy ordered")
    return coords


def encode_targets(row: dict[str, Any]) -> tuple[list[float], list[list[float]]]:
    row_id = str(row.get("row_id"))
    targets = row.get("targets")
    if not isinstance(targets, dict):
        raise Detector0SmokeError(f"{row_id} missing targets")
    presence = []
    boxes = []
    for target_id in TARGET_IDS:
        target = targets.get(target_id)
        if not isinstance(target, dict):
            raise Detector0SmokeError(f"{row_id} missing target {target_id}")
        is_present = bool(target.get("presence"))
        presence.append(1.0 if is_present else 0.0)
        if is_present:
            boxes.append(validate_box(row_id, target_id, target.get("box_xyxy_norm")))
        else:
            boxes.append([0.0, 0.0, 0.0, 0.0])
    return presence, boxes


def choose_device(torch: Any, requested: str) -> Any:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "mps":
        if not torch.backends.mps.is_available():
            raise Detector0SmokeError("requested MPS device is not available")
        return torch.device("mps")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def load_tensor_payload(torch: Any, path: Path) -> dict[str, Any]:
    try:
        payload = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        payload = torch.load(path, map_location="cpu")
    if not isinstance(payload, dict):
        raise Detector0SmokeError(f"tensor payload must be a dict: {project_relative(path)}")
    return payload


def full_frame_feature(torch: Any, payload: dict[str, Any], frame_index: int, spatial_size: int, row_id: str) -> Any:
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
    image = frame.permute(2, 0, 1).unsqueeze(0)
    resized = torch.nn.functional.interpolate(
        image,
        size=(spatial_size, spatial_size),
        mode="bilinear",
        align_corners=False,
    )
    return resized.flatten()


def load_packet_dataset(torch: Any, packet_path: Path, spatial_size: int) -> tuple[dict[str, Any], dict[str, Any]]:
    packet = read_json(packet_path)
    if packet.get("status") != "reviewed_packet_ready_for_detector0_smoke":
        raise Detector0SmokeError(f"packet status is not ready for detector smoke: {packet.get('status')}")
    schema = packet.get("target_schema", {})
    if schema.get("target_ids") != TARGET_IDS:
        raise Detector0SmokeError("packet target_schema target_ids do not match Detector 0 smoke target order")
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 15:
        raise Detector0SmokeError("packet must contain exactly 15 frame rows")

    features_by_split: dict[str, list[Any]] = defaultdict(list)
    presence_by_split: dict[str, list[list[float]]] = defaultdict(list)
    boxes_by_split: dict[str, list[list[list[float]]]] = defaultdict(list)
    row_records_by_split: dict[str, list[dict[str, Any]]] = defaultdict(list)
    split_counts = Counter()
    label_counts_by_split: dict[str, Counter[str]] = defaultdict(Counter)
    source_ids = set()
    tensor_hashes_checked = 0

    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise Detector0SmokeError(f"frame_rows[{index}] must be an object")
        row_id = str(row.get("row_id"))
        split = str(row.get("split"))
        label_id = str(row.get("label_id"))
        source_id = str(row.get("source_id"))
        if split not in {"train", "validation", "test"}:
            raise Detector0SmokeError(f"{row_id} has unsupported split={split}")
        if source_id != "popsign-v1-original-videos":
            raise Detector0SmokeError(f"{row_id} uses unexpected source_id={source_id}")
        if row.get("label_source") not in ALLOWED_LABEL_SOURCES:
            raise Detector0SmokeError(f"{row_id} uses unsupported label_source={row.get('label_source')}")
        if row.get("annotation_source") not in ALLOWED_LABEL_SOURCES:
            raise Detector0SmokeError(f"{row_id} uses unsupported annotation_source={row.get('annotation_source')}")
        if row.get("review_status") not in ALLOWED_REVIEW_STATUSES:
            raise Detector0SmokeError(f"{row_id} uses unsupported review_status={row.get('review_status')}")

        tensor_path = resolve_packet_tensor_path(packet_path, row)
        expected_hash = str(row.get("frame_tensor_sha256"))
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise Detector0SmokeError(
                f"{row_id} tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
            )
        payload = load_tensor_payload(torch, tensor_path)
        feature = full_frame_feature(torch, payload, int(row.get("frame_index")), spatial_size, row_id)
        presence, boxes = encode_targets(row)

        features_by_split[split].append(feature)
        presence_by_split[split].append(presence)
        boxes_by_split[split].append(boxes)
        split_counts[split] += 1
        label_counts_by_split[split][label_id] += 1
        source_ids.add(source_id)
        tensor_hashes_checked += 1
        row_records_by_split[split].append(
            {
                "row_id": row_id,
                "clip_id": str(row.get("clip_id")),
                "label_id": label_id,
                "source_record_id": str(row.get("source_record_id")),
                "signer_identity_hash": str(row.get("signer_identity_hash")),
                "frame_index": int(row.get("frame_index")),
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": actual_hash,
                "review_status": str(row.get("review_status")),
            }
        )

    if dict(split_counts) != {"train": 5, "validation": 5, "test": 5}:
        raise Detector0SmokeError(f"unexpected split counts: {dict(split_counts)}")

    dataset = {}
    for split in ("train", "validation", "test"):
        dataset[split] = {
            "x": torch.stack(features_by_split[split], dim=0),
            "presence": torch.tensor(presence_by_split[split], dtype=torch.float32),
            "boxes": torch.tensor(boxes_by_split[split], dtype=torch.float32),
            "rows": row_records_by_split[split],
        }

    evidence = {
        "packet": file_ref(packet_path),
        "split_counts": dict(split_counts),
        "label_counts_by_split": {
            split: dict(sorted(counts.items())) for split, counts in sorted(label_counts_by_split.items())
        },
        "source_ids": sorted(source_ids),
        "target_ids": TARGET_IDS,
        "tensor_hashes_checked": tensor_hashes_checked,
        "rows_by_split": {split: dataset[split]["rows"] for split in ("train", "validation", "test")},
    }
    return dataset, evidence


def normalize_splits(torch: Any, dataset: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    train_x = dataset["train"]["x"]
    mean = train_x.mean(dim=0, keepdim=True)
    std = train_x.std(dim=0, keepdim=True, unbiased=False).clamp_min(1e-6)
    result = {}
    for split, values in dataset.items():
        result[split] = dict(values)
        result[split]["x"] = (values["x"] - mean) / std
    return result


def build_model(torch: Any, input_dim: int, hidden_dim: int, output_dim: int) -> Any:
    return torch.nn.Sequential(
        torch.nn.Linear(input_dim, hidden_dim),
        torch.nn.GELU(),
        torch.nn.Linear(hidden_dim, output_dim),
    )


def split_predictions(torch: Any, output: Any) -> tuple[Any, Any]:
    target_count = len(TARGET_IDS)
    values = output.reshape(output.shape[0], target_count, 5)
    presence_logits = values[:, :, 0]
    box_predictions = torch.sigmoid(values[:, :, 1:5])
    return presence_logits, box_predictions


def detector_loss(torch: Any, output: Any, presence: Any, boxes: Any) -> tuple[Any, dict[str, float]]:
    presence_logits, box_predictions = split_predictions(torch, output)
    presence_loss = torch.nn.functional.binary_cross_entropy_with_logits(presence_logits, presence)
    present_mask = presence.unsqueeze(-1).expand_as(box_predictions)
    if float(present_mask.sum().detach().cpu().item()) > 0.0:
        box_loss = torch.nn.functional.l1_loss(
            box_predictions[present_mask.bool()],
            boxes[present_mask.bool()],
        )
    else:
        box_loss = torch.zeros((), device=output.device)
    total_loss = presence_loss + box_loss
    return total_loss, {
        "total": float(total_loss.detach().cpu().item()),
        "presence": float(presence_loss.detach().cpu().item()),
        "box": float(box_loss.detach().cpu().item()),
    }


def canonicalize_boxes(torch: Any, boxes: Any) -> Any:
    x1 = torch.minimum(boxes[..., 0], boxes[..., 2])
    y1 = torch.minimum(boxes[..., 1], boxes[..., 3])
    x2 = torch.maximum(boxes[..., 0], boxes[..., 2])
    y2 = torch.maximum(boxes[..., 1], boxes[..., 3])
    return torch.stack([x1, y1, x2, y2], dim=-1)


def box_iou(torch: Any, predicted: Any, target: Any) -> Any:
    predicted = canonicalize_boxes(torch, predicted)
    target = canonicalize_boxes(torch, target)
    x1 = torch.maximum(predicted[..., 0], target[..., 0])
    y1 = torch.maximum(predicted[..., 1], target[..., 1])
    x2 = torch.minimum(predicted[..., 2], target[..., 2])
    y2 = torch.minimum(predicted[..., 3], target[..., 3])
    intersection = (x2 - x1).clamp_min(0) * (y2 - y1).clamp_min(0)
    predicted_area = (predicted[..., 2] - predicted[..., 0]).clamp_min(0) * (
        predicted[..., 3] - predicted[..., 1]
    ).clamp_min(0)
    target_area = (target[..., 2] - target[..., 0]).clamp_min(0) * (
        target[..., 3] - target[..., 1]
    ).clamp_min(0)
    union = predicted_area + target_area - intersection
    return torch.where(union > 0, intersection / union.clamp_min(1e-8), torch.zeros_like(union))


def evaluate_split(torch: Any, model: Any, values: dict[str, Any]) -> dict[str, Any]:
    model.eval()
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        output = model(x)
        _loss, losses = detector_loss(torch, output, presence, boxes)
        presence_logits, box_predictions = split_predictions(torch, output)
        predicted_presence = (torch.sigmoid(presence_logits) >= 0.5).to(dtype=torch.float32)
        presence_accuracy = float((predicted_presence == presence).to(dtype=torch.float32).mean().cpu().item())
        present_mask = presence.bool()
        if bool(present_mask.any().cpu().item()):
            box_mae = float((box_predictions[present_mask] - boxes[present_mask]).abs().mean().cpu().item())
            mean_iou = float(box_iou(torch, box_predictions[present_mask], boxes[present_mask]).mean().cpu().item())
        else:
            box_mae = None
            mean_iou = None
        per_target = []
        for target_index, target_id in enumerate(TARGET_IDS):
            target_presence = presence[:, target_index]
            target_pred_presence = predicted_presence[:, target_index]
            target_present_mask = target_presence.bool()
            if bool(target_present_mask.any().cpu().item()):
                target_box_mae = float(
                    (
                        box_predictions[:, target_index, :][target_present_mask]
                        - boxes[:, target_index, :][target_present_mask]
                    )
                    .abs()
                    .mean()
                    .cpu()
                    .item()
                )
                target_iou = float(
                    box_iou(
                        torch,
                        box_predictions[:, target_index, :][target_present_mask],
                        boxes[:, target_index, :][target_present_mask],
                    )
                    .mean()
                    .cpu()
                    .item()
                )
            else:
                target_box_mae = None
                target_iou = None
            per_target.append(
                {
                    "target_id": target_id,
                    "present_support": int(target_present_mask.sum().cpu().item()),
                    "presence_accuracy": float(
                        (target_pred_presence == target_presence).to(dtype=torch.float32).mean().cpu().item()
                    ),
                    "box_mae_if_present": target_box_mae,
                    "mean_iou_if_present": target_iou,
                }
            )
    return {
        "loss": losses,
        "presence_accuracy": presence_accuracy,
        "present_box_mae": box_mae,
        "present_box_mean_iou": mean_iou,
        "per_target": per_target,
        "sample_count": int(x.shape[0]),
    }


def train_smoke(torch: Any, args: argparse.Namespace, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    model = build_model(
        torch,
        input_dim=int(dataset["train"]["x"].shape[1]),
        hidden_dim=args.hidden_dim,
        output_dim=len(TARGET_IDS) * 5,
    ).to(device)
    device_dataset = {
        split: {
            **values,
            "x": values["x"].to(device),
            "presence": values["presence"].to(device),
            "boxes": values["boxes"].to(device),
        }
        for split, values in dataset.items()
    }
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.0)
    initial_metrics = evaluate_split(torch, model, device_dataset["train"])
    history = [
        {
            "epoch": 0,
            "train_total_loss": initial_metrics["loss"]["total"],
            "train_presence_loss": initial_metrics["loss"]["presence"],
            "train_box_loss": initial_metrics["loss"]["box"],
            "train_presence_accuracy": initial_metrics["presence_accuracy"],
            "train_present_box_mae": initial_metrics["present_box_mae"],
        }
    ]
    best_train_loss = initial_metrics["loss"]["total"]
    epochs_ran = 0

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        output = model(device_dataset["train"]["x"])
        loss, _losses = detector_loss(
            torch,
            output,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
        )
        loss.backward()
        optimizer.step()
        epochs_ran = epoch

        train_metrics = evaluate_split(torch, model, device_dataset["train"])
        best_train_loss = min(best_train_loss, train_metrics["loss"]["total"])
        should_record = (
            epoch <= 5
            or epoch % 25 == 0
            or (
                train_metrics["presence_accuracy"] == 1.0
                and (train_metrics["present_box_mae"] is not None and train_metrics["present_box_mae"] <= 0.05)
            )
        )
        if should_record:
            history.append(
                {
                    "epoch": epoch,
                    "train_total_loss": train_metrics["loss"]["total"],
                    "train_presence_loss": train_metrics["loss"]["presence"],
                    "train_box_loss": train_metrics["loss"]["box"],
                    "train_presence_accuracy": train_metrics["presence_accuracy"],
                    "train_present_box_mae": train_metrics["present_box_mae"],
                }
            )
        if (
            train_metrics["loss"]["total"] <= args.early_stop_loss
            and train_metrics["presence_accuracy"] == 1.0
            and train_metrics["present_box_mae"] is not None
            and train_metrics["present_box_mae"] <= 0.035
        ):
            break

    metrics = {
        split: evaluate_split(torch, model, values)
        for split, values in device_dataset.items()
    }
    initial_loss = initial_metrics["loss"]["total"]
    final_train_loss = metrics["train"]["loss"]["total"]
    loss_drop_fraction = (initial_loss - best_train_loss) / initial_loss if initial_loss else None
    return {
        "device": str(device),
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": epochs_ran,
        "history": history,
        "metrics": metrics,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def classify_smoke(result: dict[str, Any]) -> dict[str, Any]:
    train_metrics = result["metrics"]["train"]
    loss_drop = float(result["loss_movement"].get("loss_drop_fraction_from_initial_to_best") or 0.0)
    train_box_mae = train_metrics.get("present_box_mae")
    passed = (
        train_metrics.get("presence_accuracy") == 1.0
        and train_box_mae is not None
        and float(train_box_mae) <= 0.15
        and loss_drop >= 0.75
    )
    return {
        "status": "passed" if passed else "failed",
        "criteria": {
            "train_presence_accuracy": "1.0",
            "train_present_box_mae_max": 0.15,
            "loss_drop_fraction_from_initial_to_best_min": 0.75,
        },
        "actual": {
            "train_presence_accuracy": train_metrics.get("presence_accuracy"),
            "train_present_box_mae": train_box_mae,
            "loss_drop_fraction_from_initial_to_best": result["loss_movement"].get(
                "loss_drop_fraction_from_initial_to_best"
            ),
            "train_present_box_mean_iou": train_metrics.get("present_box_mean_iou"),
        },
    }


def next_action_for_classification(classification: dict[str, Any]) -> tuple[str, str]:
    if classification["status"] == "passed":
        return (
            "crop_normalization_ablation_design",
            "Local Detector 0 smoke proved packet loading, target encoding, scratch loss, and metrics are usable enough to design the crop-normalization comparison.",
        )
    return (
        "detector0_data_or_target_remediation",
        "Local Detector 0 smoke did not satisfy train-path sanity; inspect packet targets, tensor frames, or the scratch detector target encoding before ablation design.",
    )


def brev_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except Exception as error:  # noqa: BLE001 - preserve no-spend status even if brev is unavailable.
        return {
            "checked": False,
            "command": "brev ls --json",
            "compute_used": False,
            "sync_or_training_used": False,
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
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def main() -> int:
    args = parse_args()
    if args.feature_spatial_size < 8:
        raise Detector0SmokeError("--feature-spatial-size must be at least 8")
    if args.max_epochs < 1:
        raise Detector0SmokeError("--max-epochs must be positive")

    torch = import_torch()
    raw_dataset, packet_evidence = load_packet_dataset(torch, args.packet.resolve(), args.feature_spatial_size)
    dataset = normalize_splits(torch, raw_dataset)
    smoke_result = train_smoke(torch, args, dataset)
    classification = classify_smoke(smoke_result)
    next_action_id, next_action_description = next_action_for_classification(classification)

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-P Detector 0 local training smoke",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "local smoke records metrics only; no export, promotion, or final model artifact is authorized",
        },
        "local_device": smoke_result["device"],
        "seed": args.seed,
        "configuration": {
            "feature_source": "rgb_regions full_frame_reference at each packet row frame_index",
            "feature_spatial_size": args.feature_spatial_size,
            "hidden_dim": args.hidden_dim,
            "max_epochs": args.max_epochs,
            "epochs_ran": smoke_result["epochs_ran"],
            "early_stop_loss": args.early_stop_loss,
            "learning_rate": args.learning_rate,
            "optimizer": "AdamW(weight_decay=0.0)",
            "loss": "BCEWithLogits presence loss plus L1 normalized xyxy box loss for present targets",
            "batching": "full train split in one local batch",
            "target_ids": TARGET_IDS,
        },
        "source_artifacts": {
            name: file_ref(path) for name, path in REFERENCE_PATHS.items()
        },
        "packet_evidence": packet_evidence,
        "model": {
            "model_id": "detector0_full_frame_mlp_v1_local_smoke",
            "description": "Random-init MLP over one downsampled full-frame reference image per packet row; predicts target presence plus normalized xyxy boxes.",
            "pretrained_components": [],
            "random_initialization": True,
            "parameter_count": smoke_result["model_parameter_count"],
            "uses_pretrained_detector_or_landmark": False,
        },
        "split_counts": packet_evidence["split_counts"],
        "selected_labels": sorted(
            {
                row["label_id"]
                for rows in packet_evidence["rows_by_split"].values()
                for row in rows
            }
        ),
        "training": {
            "loss_movement": smoke_result["loss_movement"],
            "history": smoke_result["history"],
            "metrics": smoke_result["metrics"],
        },
        "readiness_classification": {
            "detector0_local_smoke_path": classification,
            "classification": (
                "ready_for_crop_normalization_ablation_design"
                if classification["status"] == "passed"
                else "needs_detector0_data_or_target_remediation"
            ),
            "not_a_product_readiness_claim": True,
        },
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
        "brev_no_spend_boundary": brev_status(),
        "final_promotion_blocker_separation": {
            "hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this local Detector 0 smoke",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "local_detector0_smoke_jobs_run": 1,
            "device_scope": "local CPU/MPS only",
            "brev_sync": False,
            "brev_training": False,
            "brev_spend": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "recognizer_training": False,
            "crop_normalization_ablation": False,
            "classifier_microprobe_or_smoke": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "push": False,
            "broad_run_redirect": False,
        },
        "next_action": {
            "id": next_action_id,
            "description": next_action_description,
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "local_device": smoke_result["device"],
                "epochs_ran": smoke_result["epochs_ran"],
                "train_loss_initial": smoke_result["loss_movement"]["initial_train_loss"],
                "train_loss_best": smoke_result["loss_movement"]["best_train_loss"],
                "train_presence_accuracy": smoke_result["metrics"]["train"]["presence_accuracy"],
                "train_present_box_mae": smoke_result["metrics"]["train"]["present_box_mae"],
                "validation_presence_accuracy": smoke_result["metrics"]["validation"]["presence_accuracy"],
                "test_presence_accuracy": smoke_result["metrics"]["test"]["presence_accuracy"],
                "next_action": next_action_id,
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
