#!/usr/bin/env python3
"""Run the M3AE-AG local scratch Detector 0 two-hand union smoke."""

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

from run_return_to_form_tier0_detector0_training_smoke import (
    Detector0SmokeError,
    box_iou,
    build_model,
    file_ref,
    full_frame_feature,
    load_tensor_payload,
    normalize_splits,
    project_relative,
    read_json,
    resolve_packet_tensor_path,
    validate_box,
    write_json,
)
from train_rawframe_model import TrainingError, import_torch, sha256_file


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-two-hand-union-training-smoke/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json"
)
EXPECTED_PACKET_SHA256 = "6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d"
EXPECTED_SPLIT_COUNTS = {"train": 11, "validation": 11, "test": 10}
EXPECTED_UNION_SUPPORT_BY_SPLIT = {"train": 7, "validation": 7, "test": 6}
UNION_TARGET_ID = "table_two_hand_union_or_contact_region"
ALLOWED_LABEL_SOURCES = {"manual_verified_from_fixed_crop_context"}
ALLOWED_ANNOTATION_SOURCES = {
    "manual_verified_from_fixed_crop_context",
    "manual_corrected_from_m3ae_y_candidate_review",
}
ALLOWED_REVIEW_STATUSES = {"manual_verified", "manual_corrected"}
REFERENCE_PATHS = {
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--feature-spatial-size", type=int, default=32)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--max-epochs", type=int, default=400)
    parser.add_argument("--early-stop-loss", type=float, default=0.0125)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--seed", type=int, default=223607)
    parser.add_argument("--device", choices=("auto", "cpu", "mps"), default="cpu")
    return parser.parse_args()


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


def encode_union_target(row: dict[str, Any]) -> tuple[list[float], list[list[float]]]:
    row_id = str(row.get("row_id"))
    targets = row.get("targets")
    if not isinstance(targets, dict):
        raise Detector0SmokeError(f"{row_id} missing targets")
    target = targets.get(UNION_TARGET_ID)
    if not isinstance(target, dict):
        raise Detector0SmokeError(f"{row_id} missing target {UNION_TARGET_ID}")
    is_present = bool(target.get("presence"))
    if is_present:
        box = validate_box(row_id, UNION_TARGET_ID, target.get("box_xyxy_norm"))
    else:
        box = [0.0, 0.0, 0.0, 0.0]
    return [1.0 if is_present else 0.0], [box]


def validate_packet_row(row: dict[str, Any], row_id: str, split: str, label_id: str, source_id: str) -> None:
    if split not in EXPECTED_SPLIT_COUNTS:
        raise Detector0SmokeError(f"{row_id} has unsupported split={split}")
    if source_id != "popsign-v1-original-videos":
        raise Detector0SmokeError(f"{row_id} uses unexpected source_id={source_id}")
    if row.get("label_source") not in ALLOWED_LABEL_SOURCES:
        raise Detector0SmokeError(f"{row_id} uses unsupported label_source={row.get('label_source')}")
    if row.get("annotation_source") not in ALLOWED_ANNOTATION_SOURCES:
        raise Detector0SmokeError(f"{row_id} uses unsupported annotation_source={row.get('annotation_source')}")
    if row.get("review_status") not in ALLOWED_REVIEW_STATUSES:
        raise Detector0SmokeError(f"{row_id} uses unsupported review_status={row.get('review_status')}")
    target = row.get("targets", {}).get(UNION_TARGET_ID) if isinstance(row.get("targets"), dict) else None
    if not isinstance(target, dict):
        raise Detector0SmokeError(f"{row_id} missing union/contact target")
    if label_id == "table" and not bool(target.get("presence")):
        raise Detector0SmokeError(f"{row_id} table row missing present union/contact target")
    if label_id != "table" and bool(target.get("presence")):
        raise Detector0SmokeError(f"{row_id} non-table row unexpectedly has present union/contact target")


def load_union_packet_dataset(torch: Any, packet_path: Path, spatial_size: int) -> tuple[dict[str, Any], dict[str, Any]]:
    packet = read_json(packet_path)
    packet_hash = sha256_file(packet_path)
    if packet_hash != EXPECTED_PACKET_SHA256:
        raise Detector0SmokeError(f"two-hand union packet hash mismatch: {packet_hash}")
    if packet.get("status") != "expanded_packet_ready_for_detector0_smoke":
        raise Detector0SmokeError(f"packet status is not expanded-smoke ready: {packet.get('status')}")
    schema = packet.get("target_schema", {})
    target_ids = schema.get("target_ids")
    if not isinstance(target_ids, list) or UNION_TARGET_ID not in target_ids:
        raise Detector0SmokeError(f"packet target_schema does not include {UNION_TARGET_ID}")
    rows = packet.get("frame_rows")
    if not isinstance(rows, list) or len(rows) != 32:
        raise Detector0SmokeError("union packet smoke expects exactly 32 frame rows")

    features_by_split: dict[str, list[Any]] = defaultdict(list)
    presence_by_split: dict[str, list[list[float]]] = defaultdict(list)
    boxes_by_split: dict[str, list[list[list[float]]]] = defaultdict(list)
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
        feature = full_frame_feature(torch, payload, int(row.get("frame_index")), spatial_size, row_id)
        presence, boxes = encode_union_target(row)

        features_by_split[split].append(feature)
        presence_by_split[split].append(presence)
        boxes_by_split[split].append(boxes)
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
        "absent_non_table_count": sum(
            1
            for rows_for_split in row_records_by_split.values()
            for record in rows_for_split
            if record["label_id"] != "table" and not record["union_target_present"]
        ),
        "source_ids": sorted(source_ids),
        "target_ids": [UNION_TARGET_ID],
        "tensor_hashes_checked": tensor_hashes_checked,
        "rows_by_split": {split: dataset[split]["rows"] for split in ("train", "validation", "test")},
    }
    return dataset, evidence


def split_union_predictions(torch: Any, output: Any) -> tuple[Any, Any]:
    values = output.reshape(output.shape[0], 1, 5)
    presence_logits = values[:, :, 0]
    box_predictions = torch.sigmoid(values[:, :, 1:5])
    return presence_logits, box_predictions


def detector_union_loss(torch: Any, output: Any, presence: Any, boxes: Any) -> tuple[Any, dict[str, float]]:
    presence_logits, box_predictions = split_union_predictions(torch, output)
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


def evaluate_union_split(torch: Any, model: Any, values: dict[str, Any]) -> dict[str, Any]:
    model.eval()
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        output = model(x)
        _loss, losses = detector_union_loss(torch, output, presence, boxes)
        presence_logits, box_predictions = split_union_predictions(torch, output)
        predicted_presence = (torch.sigmoid(presence_logits) >= 0.5).to(dtype=torch.float32)
        presence_accuracy = float((predicted_presence == presence).to(dtype=torch.float32).mean().cpu().item())
        present_mask = presence.bool()
        if bool(present_mask.any().cpu().item()):
            box_mae = float((box_predictions[present_mask] - boxes[present_mask]).abs().mean().cpu().item())
            mean_iou = float(box_iou(torch, box_predictions[present_mask], boxes[present_mask]).mean().cpu().item())
        else:
            box_mae = None
            mean_iou = None
    return {
        "loss": losses,
        "presence_accuracy": presence_accuracy,
        "present_box_mae": box_mae,
        "present_box_mean_iou": mean_iou,
        "per_target": [
            {
                "target_id": UNION_TARGET_ID,
                "present_support": int(present_mask.sum().cpu().item()),
                "presence_accuracy": presence_accuracy,
                "box_mae_if_present": box_mae,
                "mean_iou_if_present": mean_iou,
            }
        ],
        "sample_count": int(x.shape[0]),
    }


def evaluate_table_union_target(torch: Any, model: Any, values: dict[str, Any]) -> dict[str, Any]:
    model.eval()
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    rows = values["rows"]
    table_indices = [index for index, row in enumerate(rows) if row["label_id"] == "table"]
    if not table_indices:
        return {
            "table_row_count": 0,
            "present_support": 0,
            "presence_accuracy": None,
            "predicted_present_rate": None,
            "box_mae_if_present": None,
            "mean_iou_if_present": None,
        }
    index_tensor = torch.tensor(table_indices, dtype=torch.long, device=x.device)
    with torch.no_grad():
        output = model(x)
        presence_logits, box_predictions = split_union_predictions(torch, output)
        target_presence = presence.index_select(0, index_tensor)[:, 0]
        predicted_presence = (torch.sigmoid(presence_logits.index_select(0, index_tensor)[:, 0]) >= 0.5).to(
            dtype=torch.float32
        )
        present_mask = target_presence.bool()
        if bool(present_mask.any().cpu().item()):
            selected_predictions = box_predictions.index_select(0, index_tensor)[:, 0, :][present_mask]
            selected_boxes = boxes.index_select(0, index_tensor)[:, 0, :][present_mask]
            box_mae = float((selected_predictions - selected_boxes).abs().mean().cpu().item())
            mean_iou = float(box_iou(torch, selected_predictions, selected_boxes).mean().cpu().item())
        else:
            box_mae = None
            mean_iou = None
    return {
        "table_row_count": len(table_indices),
        "present_support": int(present_mask.sum().cpu().item()),
        "presence_accuracy": float((predicted_presence == target_presence).to(dtype=torch.float32).mean().cpu().item()),
        "predicted_present_rate": float(predicted_presence.mean().cpu().item()),
        "box_mae_if_present": box_mae,
        "mean_iou_if_present": mean_iou,
    }


def train_union_smoke(torch: Any, args: argparse.Namespace, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    model = build_model(
        torch,
        input_dim=int(dataset["train"]["x"].shape[1]),
        hidden_dim=args.hidden_dim,
        output_dim=5,
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
    initial_metrics = evaluate_union_split(torch, model, device_dataset["train"])
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
        loss, _losses = detector_union_loss(
            torch,
            output,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
        )
        loss.backward()
        optimizer.step()
        epochs_ran = epoch

        train_metrics = evaluate_union_split(torch, model, device_dataset["train"])
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

    metrics = {split: evaluate_union_split(torch, model, values) for split, values in device_dataset.items()}
    table_union_metrics = {
        split: evaluate_table_union_target(torch, model, values) for split, values in device_dataset.items()
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
        "table_two_hand_union_or_contact_region_metrics": table_union_metrics,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def classify_union_smoke(result: dict[str, Any]) -> dict[str, Any]:
    train_metrics = result["metrics"]["train"]
    loss_drop = float(result["loss_movement"].get("loss_drop_fraction_from_initial_to_best") or 0.0)
    train_box_mae = train_metrics.get("present_box_mae")
    train_path_passed = (
        train_metrics.get("presence_accuracy") == 1.0
        and train_box_mae is not None
        and float(train_box_mae) <= 0.15
        and loss_drop >= 0.75
    )
    table = result["table_two_hand_union_or_contact_region_metrics"]
    train_table = table["train"]
    validation_table = table["validation"]
    test_table = table["test"]
    table_union_behavior_passed = (
        train_table["present_support"] >= 5
        and validation_table["present_support"] >= 5
        and test_table["present_support"] >= 5
        and train_table["presence_accuracy"] == 1.0
        and train_table["box_mae_if_present"] is not None
        and train_table["box_mae_if_present"] <= 0.20
        and validation_table["presence_accuracy"] is not None
        and validation_table["presence_accuracy"] >= 0.80
        and test_table["presence_accuracy"] is not None
        and test_table["presence_accuracy"] >= 0.80
        and validation_table["box_mae_if_present"] is not None
        and validation_table["box_mae_if_present"] <= 0.30
        and test_table["box_mae_if_present"] is not None
        and test_table["box_mae_if_present"] <= 0.30
        and validation_table["mean_iou_if_present"] is not None
        and validation_table["mean_iou_if_present"] > 0.05
        and test_table["mean_iou_if_present"] is not None
        and test_table["mean_iou_if_present"] > 0.05
    )
    if not train_path_passed:
        next_action = "detector0_union_target_data_or_schema_remediation"
        classification = "needs_union_target_data_or_schema_remediation"
        reason = "Union-target smoke did not pass local train-path sanity."
    elif table_union_behavior_passed:
        next_action = "crop_normalization_union_target_ablation_design"
        classification = "ready_for_union_target_crop_normalization_ablation_design"
        reason = "Union-target smoke passed local train sanity and held-out table union/contact slice checks."
    else:
        next_action = "detector0_union_target_data_or_schema_remediation"
        classification = "needs_union_target_data_or_schema_remediation"
        reason = (
            "Local train path passed, but held-out table union/contact behavior was still too weak "
            "for a crop-normalization ablation design."
        )
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "not_a_product_readiness_claim": True,
        "detector0_local_smoke_path": {
            "status": "passed" if train_path_passed else "failed",
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
        },
        "table_two_hand_union_or_contact_region_behavior": {
            "status": "passed" if table_union_behavior_passed else "failed",
            "criteria": {
                "per_split_present_support_min": 5,
                "train_presence_accuracy": "1.0",
                "train_box_mae_if_present_max": 0.20,
                "heldout_presence_accuracy_min": 0.80,
                "heldout_box_mae_if_present_max": 0.30,
                "heldout_mean_iou_if_present_min": 0.05,
            },
            "actual": table,
        },
    }


def next_action_description(next_action: str) -> str:
    if next_action == "crop_normalization_union_target_ablation_design":
        return (
            "Design one bounded local no-spend fixed-crop versus Detector 0 union-target crop-normalization "
            "comparison before any recognizer training."
        )
    if next_action == "detector0_two_hand_union_training_smoke_continue":
        return "Continue only the bounded local union-target smoke path because this run did not produce complete evidence."
    if next_action == "detector0_union_target_data_or_schema_remediation":
        return "Inspect union-target data, packet/tensor alignment, or schema semantics before any ablation rerun."
    if next_action == "stop_reduced_claim":
        return "Stop and reduce the Detector 0 claim because no bounded continuation is justified."
    return "Stop until a recognized M3AE-AG next action is selected."


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
            "kill_condition": "not_applicable_no_remote_training",
            "expected_metric_signal": "local detector0 two-hand union target smoke metrics only",
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
        "kill_condition": "not_applicable_no_remote_training",
        "expected_metric_signal": "local detector0 two-hand union target smoke metrics only",
        "human_spend_approval": False,
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def baseline_independent_hand_comparison() -> dict[str, Any]:
    baseline = read_json(REFERENCE_PATHS["m3ae_aa_expanded_packet_smoke"])
    table_slice = baseline["table_right_or_second_hand_metrics"]["table_slice"]
    return {
        "baseline_artifact": file_ref(REFERENCE_PATHS["m3ae_aa_expanded_packet_smoke"]),
        "definition_difference": (
            "M3AE-AA measured the independent right_or_second_hand box on table rows; M3AE-AG measures "
            "the derived two-hand union/contact target on the same approved packet rows."
        ),
        "m3ae_aa_table_right_or_second_hand_table_slice": table_slice,
    }


def main() -> int:
    args = parse_args()
    if args.feature_spatial_size < 8:
        raise Detector0SmokeError("--feature-spatial-size must be at least 8")
    if args.max_epochs < 1:
        raise Detector0SmokeError("--max-epochs must be positive")

    torch = import_torch()
    raw_dataset, packet_evidence = load_union_packet_dataset(
        torch,
        args.packet.resolve(),
        args.feature_spatial_size,
    )
    dataset = normalize_splits(torch, raw_dataset)
    smoke_result = train_union_smoke(torch, args, dataset)
    classification = classify_union_smoke(smoke_result)
    next_action_id = classification["next_action"]
    mutation_receipt = read_json(REFERENCE_PATHS["m3ae_af_union_margin_packet_mutation"])

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-AG Detector 0 two-hand union training smoke",
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
            "loss": "BCEWithLogits presence loss plus L1 normalized xyxy box loss for present union/contact targets",
            "batching": "full union-target train split in one local batch",
            "target_ids": [UNION_TARGET_ID],
        },
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "packet_evidence": packet_evidence,
        "model": {
            "model_id": "detector0_full_frame_mlp_v1_two_hand_union_local_smoke",
            "description": "Random-init MLP over one downsampled full-frame reference image per packet row; predicts union/contact target presence plus normalized xyxy box.",
            "pretrained_components": [],
            "random_initialization": True,
            "parameter_count": smoke_result["model_parameter_count"],
            "uses_pretrained_detector_or_landmark": False,
        },
        "split_counts": packet_evidence["split_counts"],
        "selected_labels": sorted(
            {row["label_id"] for rows in packet_evidence["rows_by_split"].values() for row in rows}
        ),
        "training": {
            "loss_movement": smoke_result["loss_movement"],
            "history": smoke_result["history"],
            "metrics": smoke_result["metrics"],
        },
        "table_two_hand_union_or_contact_region_metrics": {
            "table_slice": smoke_result["table_two_hand_union_or_contact_region_metrics"],
            "independent_hand_baseline_context": baseline_independent_hand_comparison(),
        },
        "m3ae_af_packet_interpretation": {
            "source_mutation_receipt": file_ref(REFERENCE_PATHS["m3ae_af_union_margin_packet_mutation"]),
            "packet_post_mutation_sha256": mutation_receipt["packet"]["post_mutation_sha256"],
            "changed_target_count": mutation_receipt["packet"]["changed_target_count"],
            "support_gate": mutation_receipt["derived_targets"]["support_gate"],
            "classification": classification["classification"],
            "interpretation": classification["reason"],
            "local_smoke_is_final_promotion_evidence": False,
        },
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
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this local Detector 0 union-target smoke",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "local_detector0_smoke_jobs_run": 1,
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
            "classifier_microprobe_or_smoke": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "product_runtime_code_change": False,
            "push": False,
            "broad_run_redirect": False,
        },
        "next_action": {
            "id": next_action_id,
            "description": next_action_description(next_action_id),
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
                "table_union_validation": smoke_result["table_two_hand_union_or_contact_region_metrics"][
                    "validation"
                ],
                "table_union_test": smoke_result["table_two_hand_union_or_contact_region_metrics"]["test"],
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
