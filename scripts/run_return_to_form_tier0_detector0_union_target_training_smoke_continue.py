#!/usr/bin/env python3
"""Run the M3AE-AI instrumented union-target Detector 0 smoke continue."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import statistics
import sys
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
    build_model,
    detector_union_loss,
    evaluate_table_union_target,
    evaluate_union_split,
    file_ref,
    load_union_packet_dataset,
    normalize_splits,
    project_relative,
    read_json,
    split_union_predictions,
    write_json,
)
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-training-smoke-continue/v1"
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json"
)
REFERENCE_PATHS = {
    **UNION_SMOKE_REFERENCE_PATHS,
    "m3ae_ag_union_training_smoke": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json",
    "m3ae_ah_union_data_schema_remediation": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json",
    "m3ae_ah_session_log": ROOT
    / "docs"
    / "session-logs"
    / "246-return-to-form-tier0-detector0-union-target-data-schema-remediation.md",
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


def as_float_list(values: Any) -> list[float]:
    return [float(value) for value in values.detach().cpu().tolist()]


def constant_box_from_train(torch: Any, dataset: dict[str, dict[str, Any]], method: str) -> Any:
    presence = dataset["train"]["presence"][:, 0].bool()
    train_boxes = dataset["train"]["boxes"][:, 0, :][presence]
    if not bool(presence.any().item()):
        raise Detector0SmokeError("cannot compute constant baseline without present train union targets")
    if method == "mean":
        return train_boxes.mean(dim=0)
    if method == "median":
        return train_boxes.median(dim=0).values
    raise Detector0SmokeError(f"unsupported baseline method: {method}")


def evaluate_constant_box_baseline(torch: Any, dataset: dict[str, dict[str, Any]], constant_box: Any) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for split in ("train", "validation", "test"):
        values = dataset[split]
        presence = values["presence"][:, 0].bool()
        boxes = values["boxes"][:, 0, :]
        rows = values["rows"]
        table_indices = [index for index, row in enumerate(rows) if row["label_id"] == "table"]
        if not bool(presence.any().item()):
            box_mae = None
            mean_iou = None
        else:
            predictions = constant_box.unsqueeze(0).expand(int(presence.sum().item()), -1)
            selected_boxes = boxes[presence]
            box_mae = float((predictions - selected_boxes).abs().mean().item())
            mean_iou = float(box_iou(torch, predictions, selected_boxes).mean().item())
        result[split] = {
            "sample_count": int(values["x"].shape[0]),
            "table_row_count": len(table_indices),
            "present_support": int(presence.sum().item()),
            "constant_box_xyxy_norm": as_float_list(constant_box),
            "box_mae_if_present": box_mae,
            "mean_iou_if_present": mean_iou,
            "presence_note": "box-only baseline over present union/contact targets; not a runtime detector or recognition claim",
        }
    return result


def target_local_baselines(torch: Any, dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    mean_box = constant_box_from_train(torch, dataset, "mean")
    median_box = constant_box_from_train(torch, dataset, "median")
    train_present_boxes = dataset["train"]["boxes"][:, 0, :][dataset["train"]["presence"][:, 0].bool()]
    return {
        "source": "present train table_two_hand_union_or_contact_region targets only",
        "not_a_model": True,
        "train_present_support": int(train_present_boxes.shape[0]),
        "train_box_coordinate_ranges": {
            "x1": {
                "min": float(train_present_boxes[:, 0].min().item()),
                "max": float(train_present_boxes[:, 0].max().item()),
                "median": float(statistics.median(train_present_boxes[:, 0].tolist())),
            },
            "y1": {
                "min": float(train_present_boxes[:, 1].min().item()),
                "max": float(train_present_boxes[:, 1].max().item()),
                "median": float(statistics.median(train_present_boxes[:, 1].tolist())),
            },
            "x2": {
                "min": float(train_present_boxes[:, 2].min().item()),
                "max": float(train_present_boxes[:, 2].max().item()),
                "median": float(statistics.median(train_present_boxes[:, 2].tolist())),
            },
            "y2": {
                "min": float(train_present_boxes[:, 3].min().item()),
                "max": float(train_present_boxes[:, 3].max().item()),
                "median": float(statistics.median(train_present_boxes[:, 3].tolist())),
            },
        },
        "mean_constant_box": evaluate_constant_box_baseline(torch, dataset, mean_box),
        "median_constant_box": evaluate_constant_box_baseline(torch, dataset, median_box),
    }


def row_level_predictions(torch: Any, model: Any, values: dict[str, Any]) -> list[dict[str, Any]]:
    model.eval()
    rows = values["rows"]
    x = values["x"]
    presence = values["presence"]
    boxes = values["boxes"]
    with torch.no_grad():
        output = model(x)
        presence_logits, box_predictions = split_union_predictions(torch, output)
        presence_scores = torch.sigmoid(presence_logits)[:, 0]
        predicted_presence = (presence_scores >= 0.5).to(dtype=torch.float32)
    result = []
    for index, row in enumerate(rows):
        target_present = bool(presence[index, 0].item())
        predicted_present = bool(predicted_presence[index].item())
        predicted_box = box_predictions[index, 0, :]
        target_box = boxes[index, 0, :]
        if target_present:
            abs_errors = (predicted_box - target_box).abs()
            box_mae = float(abs_errors.mean().item())
            mean_iou = float(box_iou(torch, predicted_box.unsqueeze(0), target_box.unsqueeze(0)).item())
            target_box_list = as_float_list(target_box)
            abs_error_list = as_float_list(abs_errors)
        else:
            box_mae = None
            mean_iou = None
            target_box_list = None
            abs_error_list = None
        result.append(
            {
                "row_id": row["row_id"],
                "clip_id": row["clip_id"],
                "split": str(row.get("split", "")) or None,
                "label_id": row["label_id"],
                "source_record_id": row["source_record_id"],
                "signer_identity_hash": row["signer_identity_hash"],
                "frame_index": row["frame_index"],
                "target_present": target_present,
                "predicted_presence_score": float(presence_scores[index].item()),
                "predicted_present": predicted_present,
                "presence_correct": predicted_present == target_present,
                "target_box_xyxy_norm": target_box_list,
                "predicted_box_xyxy_norm": as_float_list(predicted_box),
                "box_abs_error_xyxy": abs_error_list,
                "box_mae_if_present": box_mae,
                "mean_iou_if_present": mean_iou,
            }
        )
    return result


def add_split_to_rows(dataset: dict[str, dict[str, Any]]) -> None:
    for split, values in dataset.items():
        for row in values["rows"]:
            row["split"] = split


def train_instrumented_union_smoke(
    torch: Any,
    args: argparse.Namespace,
    dataset: dict[str, dict[str, Any]],
) -> dict[str, Any]:
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
                and train_metrics["present_box_mae"] is not None
                and train_metrics["present_box_mae"] <= 0.05
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
    row_predictions = {
        split: row_level_predictions(torch, model, values)
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
        "table_two_hand_union_or_contact_region_metrics": table_union_metrics,
        "row_level_predictions": row_predictions,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def classify_smoke_continue(result: dict[str, Any], baselines: dict[str, Any]) -> dict[str, Any]:
    train_metrics = result["metrics"]["train"]
    loss_drop = float(result["loss_movement"].get("loss_drop_fraction_from_initial_to_best") or 0.0)
    train_box_mae = train_metrics.get("present_box_mae")
    median_baseline_mae = baselines["median_constant_box"]["train"]["box_mae_if_present"]
    train_path_passed = (
        train_metrics.get("presence_accuracy") == 1.0
        and train_box_mae is not None
        and float(train_box_mae) <= 0.15
        and loss_drop >= 0.75
    )
    table = result["table_two_hand_union_or_contact_region_metrics"]
    validation_table = table["validation"]
    test_table = table["test"]
    table_union_behavior_passed = (
        table["train"]["presence_accuracy"] == 1.0
        and table["train"]["box_mae_if_present"] is not None
        and table["train"]["box_mae_if_present"] <= 0.20
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
    if train_path_passed and table_union_behavior_passed:
        classification = "ready_for_union_target_crop_normalization_ablation_design"
        next_action = "crop_normalization_union_target_ablation_design"
        reason = "Instrumented union-target smoke passed train-path sanity and held-out table union/contact checks."
    elif (
        not train_path_passed
        and median_baseline_mae is not None
        and median_baseline_mae <= 0.15
        and train_box_mae is not None
        and train_box_mae > median_baseline_mae
    ):
        classification = "instrumentation_complete_training_path_still_unrepaired"
        next_action = "detector0_union_target_training_smoke_continue"
        reason = (
            "Row-level predictions and target-local baselines are now recorded, but the scratch smoke still "
            "does not fit the train union boxes as well as a no-training median constant-box baseline."
        )
    else:
        classification = "needs_union_target_data_or_schema_remediation"
        next_action = "detector0_union_target_data_or_schema_remediation"
        reason = "The repaired smoke exposed a target, split, or schema issue that should be diagnosed before ablation."
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "not_a_product_readiness_claim": True,
        "instrumentation": {
            "row_level_predictions_recorded": True,
            "target_local_constant_baselines_recorded": True,
            "per_row_error_summaries_recorded": True,
        },
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
                "train_median_constant_box_mae": median_baseline_mae,
                "loss_drop_fraction_from_initial_to_best": result["loss_movement"].get(
                    "loss_drop_fraction_from_initial_to_best"
                ),
                "train_present_box_mean_iou": train_metrics.get("present_box_mean_iou"),
            },
        },
        "table_two_hand_union_or_contact_region_behavior": {
            "status": "passed" if table_union_behavior_passed else "failed",
            "criteria": {
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
        return "Design one bounded local fixed-crop versus Detector 0 union-target crop-normalization comparison."
    if next_action == "detector0_union_target_training_smoke_continue":
        return "Continue the local no-spend union-target smoke repair because instrumentation is complete but the training path still does not fit the target-local baseline."
    if next_action == "detector0_union_target_data_or_schema_remediation":
        return "Inspect concrete packet, tensor, split, target, or schema evidence exposed by the repaired smoke before ablation."
    if next_action == "stop_reduced_claim":
        return "Stop and reduce the Detector 0 claim because no bounded no-new-source path is justified."
    return "Stop until a recognized M3AE-AI next action is selected."


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
    add_split_to_rows(raw_dataset)
    baselines = target_local_baselines(torch, raw_dataset)
    dataset = normalize_splits(torch, raw_dataset)
    smoke_result = train_instrumented_union_smoke(torch, args, dataset)
    classification = classify_smoke_continue(smoke_result, baselines)
    next_action = classification["next_action"]
    remediation_receipt = read_json(REFERENCE_PATHS["m3ae_ah_union_data_schema_remediation"])
    previous_smoke = read_json(REFERENCE_PATHS["m3ae_ag_union_training_smoke"])

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-AI Detector 0 union-target training smoke continue",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "local smoke continue records metrics and predictions only; no export, promotion, or final model artifact is authorized",
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
            "instrumentation_repair": [
                "target-local mean and median constant-box baselines",
                "row-level presence scores, predicted boxes, box MAE, and IoU",
                "per-split table union/contact metrics retained for comparison",
            ],
        },
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "smoke_continue_runner": file_ref(Path(__file__).resolve()),
        },
        "failure_classification_source": {
            "receipt": file_ref(REFERENCE_PATHS["m3ae_ah_union_data_schema_remediation"]),
            "classification": remediation_receipt["classification"]["classification"],
            "next_action": remediation_receipt["next_action"]["id"],
            "supporting_observations": remediation_receipt["classification"]["supporting_observations"],
        },
        "packet_evidence": packet_evidence,
        "target_local_baselines": baselines,
        "model": {
            "model_id": "detector0_full_frame_mlp_v1_two_hand_union_local_smoke_continue",
            "description": "Random-init MLP over one downsampled full-frame reference image per packet row; predicts union/contact target presence plus normalized xyxy box.",
            "pretrained_components": [],
            "random_initialization": True,
            "parameter_count": smoke_result["model_parameter_count"],
            "uses_pretrained_detector_or_landmark": False,
        },
        "training": {
            "loss_movement": smoke_result["loss_movement"],
            "history": smoke_result["history"],
            "metrics": smoke_result["metrics"],
            "row_level_predictions": smoke_result["row_level_predictions"],
        },
        "table_two_hand_union_or_contact_region_metrics": {
            "table_slice": smoke_result["table_two_hand_union_or_contact_region_metrics"],
            "comparison_to_m3ae_ag": {
                "m3ae_ag_train_present_box_mae": previous_smoke["training"]["metrics"]["train"][
                    "present_box_mae"
                ],
                "m3ae_ai_train_present_box_mae": smoke_result["metrics"]["train"]["present_box_mae"],
                "m3ae_ag_validation_presence_accuracy": previous_smoke["training"]["metrics"]["validation"][
                    "presence_accuracy"
                ],
                "m3ae_ai_validation_presence_accuracy": smoke_result["metrics"]["validation"][
                    "presence_accuracy"
                ],
                "m3ae_ag_test_presence_accuracy": previous_smoke["training"]["metrics"]["test"][
                    "presence_accuracy"
                ],
                "m3ae_ai_test_presence_accuracy": smoke_result["metrics"]["test"]["presence_accuracy"],
            },
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
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this local union-target smoke continue",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "local_detector0_smoke_reruns": 1,
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
                "local_device": smoke_result["device"],
                "epochs_ran": smoke_result["epochs_ran"],
                "classification": classification["classification"],
                "train_present_box_mae": smoke_result["metrics"]["train"]["present_box_mae"],
                "train_median_constant_box_mae": baselines["median_constant_box"]["train"][
                    "box_mae_if_present"
                ],
                "validation_presence_accuracy": smoke_result["metrics"]["validation"][
                    "presence_accuracy"
                ],
                "test_presence_accuracy": smoke_result["metrics"]["test"]["presence_accuracy"],
                "row_level_predictions_recorded": sum(
                    len(rows) for rows in smoke_result["row_level_predictions"].values()
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
