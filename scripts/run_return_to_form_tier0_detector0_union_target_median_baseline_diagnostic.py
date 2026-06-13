#!/usr/bin/env python3
"""Write the M3AE-AJ no-training union-target median-box diagnostic."""

from __future__ import annotations

import argparse
import datetime as dt
import shlex
import sys
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    DEFAULT_PACKET,
    REFERENCE_PATHS as UNION_SMOKE_REFERENCE_PATHS,
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    box_iou,
    brev_no_spend_status,
    file_ref,
    load_union_packet_dataset,
    project_relative,
    read_json,
    write_json,
)
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-median-baseline-diagnostic/v1"
DEFAULT_OUTPUT = (
    ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json"
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
    "m3ae_ai_smoke_continue": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json",
    "observer_249_api_diagnostic": ROOT
    / "artifacts"
    / "research"
    / "observer-249-union-target-smoke-diagnostic-api-response.md",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--feature-spatial-size", type=int, default=32)
    return parser.parse_args()


def as_float_list(values: Any) -> list[float]:
    return [float(value) for value in values.detach().cpu().tolist()]


def constant_box_from_train(dataset: dict[str, dict[str, Any]], method: str) -> Any:
    presence = dataset["train"]["presence"][:, 0].bool()
    train_boxes = dataset["train"]["boxes"][:, 0, :][presence]
    if not bool(presence.any().item()):
        raise Detector0SmokeError("cannot compute baseline without present train union targets")
    if method == "mean":
        return train_boxes.mean(dim=0)
    if method == "median":
        return train_boxes.median(dim=0).values
    raise Detector0SmokeError(f"unsupported baseline method: {method}")


def summarize_train_boxes(dataset: dict[str, dict[str, Any]]) -> dict[str, Any]:
    train_boxes = dataset["train"]["boxes"][:, 0, :][dataset["train"]["presence"][:, 0].bool()]
    coords = {"x1": 0, "y1": 1, "x2": 2, "y2": 3}
    return {
        axis: {
            "min": float(train_boxes[:, index].min().item()),
            "max": float(train_boxes[:, index].max().item()),
            "median": float(train_boxes[:, index].median().item()),
            "mean": float(train_boxes[:, index].mean().item()),
        }
        for axis, index in coords.items()
    }


def presence_summary(values: dict[str, Any]) -> dict[str, Any]:
    presence = values["presence"][:, 0].bool()
    sample_count = int(presence.shape[0])
    present_count = int(presence.sum().item())
    return {
        "sample_count": sample_count,
        "present_support": present_count,
        "target_present_rate": present_count / sample_count if sample_count else None,
        "target_local_oracle_presence": {
            "predicted_present_rate": present_count / sample_count if sample_count else None,
            "presence_accuracy": 1.0,
            "false_positive_count": 0,
            "false_negative_count": 0,
            "not_a_detector": True,
            "note": "Uses packet target applicability only to isolate constant-box geometry.",
        },
        "always_present_constant_presence": {
            "predicted_present_rate": 1.0 if sample_count else None,
            "presence_accuracy": present_count / sample_count if sample_count else None,
            "false_positive_count": sample_count - present_count,
            "false_negative_count": 0,
            "not_a_detector": True,
            "note": "No-model presence reference; retained to avoid overclaiming oracle target-local presence.",
        },
    }


def evaluate_constant_box(torch: Any, dataset: dict[str, dict[str, Any]], constant_box: Any) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for split in ("train", "validation", "test"):
        values = dataset[split]
        rows = values["rows"]
        presence = values["presence"][:, 0].bool()
        boxes = values["boxes"][:, 0, :]
        table_row_count = sum(1 for row in rows if row["label_id"] == "table")
        if bool(presence.any().item()):
            predictions = constant_box.unsqueeze(0).expand(int(presence.sum().item()), -1)
            targets = boxes[presence]
            box_mae = float((predictions - targets).abs().mean().item())
            mean_iou = float(box_iou(torch, predictions, targets).mean().item())
        else:
            box_mae = None
            mean_iou = None
        result[split] = {
            **presence_summary(values),
            "table_row_count": table_row_count,
            "constant_box_xyxy_norm": as_float_list(constant_box),
            "box_mae_if_present": box_mae,
            "mean_iou_if_present": mean_iou,
        }
    return result


def row_metrics_for_constant_box(torch: Any, row: dict[str, Any], target_present: bool, target_box: Any, constant_box: Any) -> dict[str, Any]:
    if target_present:
        abs_errors = (constant_box - target_box).abs()
        return {
            "target_box_xyxy_norm": as_float_list(target_box),
            "predicted_box_xyxy_norm": as_float_list(constant_box),
            "box_abs_error_xyxy": as_float_list(abs_errors),
            "box_mae_if_present": float(abs_errors.mean().item()),
            "mean_iou_if_present": float(box_iou(torch, constant_box.unsqueeze(0), target_box.unsqueeze(0)).item()),
        }
    return {
        "target_box_xyxy_norm": None,
        "predicted_box_xyxy_norm": as_float_list(constant_box),
        "box_abs_error_xyxy": None,
        "box_mae_if_present": None,
        "mean_iou_if_present": None,
    }


def per_row_metrics(torch: Any, dataset: dict[str, dict[str, Any]], baselines: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    for split in ("train", "validation", "test"):
        values = dataset[split]
        rows = values["rows"]
        presence = values["presence"][:, 0].bool()
        boxes = values["boxes"][:, 0, :]
        split_rows = []
        for index, row in enumerate(rows):
            target_present = bool(presence[index].item())
            target_box = boxes[index, :]
            row_result = {
                "row_id": row["row_id"],
                "clip_id": row["clip_id"],
                "split": split,
                "label_id": row["label_id"],
                "source_record_id": row["source_record_id"],
                "signer_identity_hash": row["signer_identity_hash"],
                "frame_index": row["frame_index"],
                "target_present": target_present,
                "presence_behavior": {
                    "target_local_oracle_predicted_present": target_present,
                    "target_local_oracle_presence_correct": True,
                    "always_present_predicted_present": True,
                    "always_present_presence_correct": target_present,
                },
                "baselines": {},
            }
            for name, constant_box in baselines.items():
                row_result["baselines"][name] = row_metrics_for_constant_box(
                    torch,
                    row,
                    target_present,
                    target_box,
                    constant_box,
                )
            split_rows.append(row_result)
        result[split] = split_rows
    return result


def baseline_comparison(
    baseline_metrics: dict[str, dict[str, Any]],
    ag_receipt: dict[str, Any],
    ai_receipt: dict[str, Any],
) -> dict[str, Any]:
    ag_metrics = ag_receipt["training"]["metrics"]
    ai_metrics = ai_receipt["training"]["metrics"]
    ag_table = ag_receipt["table_two_hand_union_or_contact_region_metrics"]["table_slice"]
    ai_table = ai_receipt["table_two_hand_union_or_contact_region_metrics"]["table_slice"]
    comparisons = {}
    for split in ("train", "validation", "test"):
        median_mae = baseline_metrics["median_constant_box"][split]["box_mae_if_present"]
        mean_mae = baseline_metrics["mean_constant_box"][split]["box_mae_if_present"]
        ag_mae = ag_metrics[split]["present_box_mae"]
        ai_mae = ai_metrics[split]["present_box_mae"]
        comparisons[split] = {
            "median_constant_box_mae": median_mae,
            "mean_constant_box_mae": mean_mae,
            "m3ae_ag_present_box_mae": ag_mae,
            "m3ae_ai_present_box_mae": ai_mae,
            "median_minus_m3ae_ag_mae": median_mae - ag_mae if median_mae is not None and ag_mae is not None else None,
            "median_minus_m3ae_ai_mae": median_mae - ai_mae if median_mae is not None and ai_mae is not None else None,
            "median_box_better_than_m3ae_ag": median_mae is not None and ag_mae is not None and median_mae < ag_mae,
            "median_box_better_than_m3ae_ai": median_mae is not None and ai_mae is not None and median_mae < ai_mae,
            "m3ae_ag_presence_accuracy": ag_metrics[split]["presence_accuracy"],
            "m3ae_ai_presence_accuracy": ai_metrics[split]["presence_accuracy"],
            "m3ae_ag_table_presence_accuracy": ag_table[split]["presence_accuracy"],
            "m3ae_ai_table_presence_accuracy": ai_table[split]["presence_accuracy"],
        }
    return {
        "m3ae_ag_receipt": file_ref(REFERENCE_PATHS["m3ae_ag_union_training_smoke"]),
        "m3ae_ai_receipt": file_ref(REFERENCE_PATHS["m3ae_ai_smoke_continue"]),
        "comparison_by_split": comparisons,
        "train_box_gate": {
            "required_future_trainable_model_bar": "Any future trainable Detector 0 union-target formulation must beat the train-derived median constant-box MAE on train before crop-normalization ablation or recognizer training.",
            "train_median_constant_box_mae": baseline_metrics["median_constant_box"]["train"]["box_mae_if_present"],
            "m3ae_ag_train_present_box_mae": ag_metrics["train"]["present_box_mae"],
            "m3ae_ai_train_present_box_mae": ai_metrics["train"]["present_box_mae"],
            "m3ae_ag_failed_bar": ag_metrics["train"]["present_box_mae"]
            > baseline_metrics["median_constant_box"]["train"]["box_mae_if_present"],
            "m3ae_ai_failed_bar": ai_metrics["train"]["present_box_mae"]
            > baseline_metrics["median_constant_box"]["train"]["box_mae_if_present"],
        },
        "presence_caveat": "Median/mean constant boxes are geometry baselines, not runtime presence detectors; presence metrics are recorded separately with oracle and always-present no-model policies.",
    }


def classify_diagnostic(comparison: dict[str, Any]) -> dict[str, Any]:
    train_gate = comparison["train_box_gate"]
    if train_gate["m3ae_ag_failed_bar"] and train_gate["m3ae_ai_failed_bar"]:
        next_action = "detector0_union_target_architecture_reformulation_design"
        classification = "median_box_baseline_reproduced_training_path_reformulation_required"
        reason = (
            "The no-training train-derived median constant box remains much stronger than both M3AE-AG "
            "and M3AE-AI on train boxes; another training-smoke retry is not justified until the "
            "trainable formulation is redesigned against this baseline."
        )
    else:
        next_action = "detector0_union_target_data_or_schema_remediation"
        classification = "median_box_baseline_comparison_inconclusive"
        reason = "The baseline comparison did not reproduce the expected stronger train median-box reference."
    return {
        "classification": classification,
        "reason": reason,
        "next_action": next_action,
        "not_a_product_readiness_claim": True,
    }


def main() -> int:
    args = parse_args()
    torch = import_torch()
    dataset, packet_evidence = load_union_packet_dataset(torch, args.packet.resolve(), args.feature_spatial_size)
    constant_boxes = {
        "mean_constant_box": constant_box_from_train(dataset, "mean"),
        "median_constant_box": constant_box_from_train(dataset, "median"),
    }
    baseline_metrics = {
        name: evaluate_constant_box(torch, dataset, constant_box)
        for name, constant_box in constant_boxes.items()
    }
    ag_receipt = read_json(REFERENCE_PATHS["m3ae_ag_union_training_smoke"])
    ah_receipt = read_json(REFERENCE_PATHS["m3ae_ah_union_data_schema_remediation"])
    ai_receipt = read_json(REFERENCE_PATHS["m3ae_ai_smoke_continue"])
    comparison = baseline_comparison(baseline_metrics, ag_receipt, ai_receipt)
    classification = classify_diagnostic(comparison)
    next_action = classification["next_action"]

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-AJ Detector 0 union-target median-box baseline diagnostic",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {"path": project_relative(args.output)},
        "local_device": "cpu",
        "configuration": {
            "target_id": UNION_TARGET_ID,
            "feature_spatial_size_for_packet_tensor_verification": args.feature_spatial_size,
            "baseline_source": "present train table_two_hand_union_or_contact_region targets only",
            "no_training": True,
            "gradient_updates": 0,
            "model_artifact_saved": False,
            "model_inference_used": False,
        },
        "source_artifacts": {
            **{name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
            "current_packet": file_ref(args.packet.resolve()),
            "median_baseline_runner": file_ref(Path(__file__).resolve()),
        },
        "failure_evidence": {
            "observer_249_api_diagnostic": file_ref(REFERENCE_PATHS["observer_249_api_diagnostic"]),
            "m3ae_ai_receipt": file_ref(REFERENCE_PATHS["m3ae_ai_smoke_continue"]),
            "m3ae_ah_receipt": file_ref(REFERENCE_PATHS["m3ae_ah_union_data_schema_remediation"]),
            "m3ae_ag_receipt": file_ref(REFERENCE_PATHS["m3ae_ag_union_training_smoke"]),
            "m3ae_ah_classification": ah_receipt["classification"]["classification"],
            "m3ae_ai_classification": ai_receipt["readiness_classification"]["classification"],
        },
        "packet_evidence": packet_evidence,
        "baseline_definitions": {
            name: {
                "constant_box_xyxy_norm": as_float_list(constant_box),
                "derived_from_split": "train",
                "derived_from_present_target": UNION_TARGET_ID,
                "train_present_support": int(dataset["train"]["presence"][:, 0].sum().item()),
                "not_a_model": True,
            }
            for name, constant_box in constant_boxes.items()
        },
        "train_target_geometry": summarize_train_boxes(dataset),
        "baseline_metrics": baseline_metrics,
        "row_level_metrics": per_row_metrics(torch, dataset, constant_boxes),
        "comparison_to_training_smokes": comparison,
        "minimum_future_detector0_bar": {
            "bar": "beat train-derived median constant-box MAE on train before any crop-normalization ablation or recognizer training",
            "train_median_constant_box_mae": baseline_metrics["median_constant_box"]["train"]["box_mae_if_present"],
            "train_median_constant_box_mean_iou": baseline_metrics["median_constant_box"]["train"][
                "mean_iou_if_present"
            ],
            "applies_to_next_training_style_slice": True,
        },
        "readiness_classification": classification,
        "no_training_provenance": {
            "detector0_training": False,
            "training_smoke_retry": False,
            "gradient_updates": 0,
            "model_checkpoint_loaded": False,
            "model_checkpoint_saved": False,
            "model_artifact_exported": False,
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
        "brev_no_spend_boundary": brev_no_spend_status(),
        "final_promotion_blocker_separation": {
            "hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this no-training median-box diagnostic",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "detector0_training": False,
            "training_smoke_retry": False,
            "packet_mutation": False,
            "rows_added": False,
            "brev_spend": False,
            "brev_stop": False,
            "brev_sync": False,
            "brev_training": False,
            "duplicate_brev_worker": False,
            "crop_normalization_ablation": False,
            "recognizer_training": False,
            "broad_run_redirect": False,
            "label_expansion": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "generated_pseudo_label_use": False,
            "pretrained_detector_or_landmark_use": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "product_runtime_code_change": False,
            "push": False,
        },
        "next_action": {
            "id": next_action,
            "description": (
                "Design a trainable Detector 0 union-target formulation that must beat this median-box "
                "train baseline before any ablation or recognizer work."
                if next_action == "detector0_union_target_architecture_reformulation_design"
                else "Return to packet, tensor, split, or schema remediation before any training-style slice."
            ),
        },
    }
    write_json(args.output, report)
    print(
        {
            "status": report["status"],
            "classification": classification["classification"],
            "next_action": next_action,
            "output": project_relative(args.output),
            "train_median_constant_box_mae": baseline_metrics["median_constant_box"]["train"][
                "box_mae_if_present"
            ],
            "m3ae_ai_train_present_box_mae": comparison["train_box_gate"]["m3ae_ai_train_present_box_mae"],
        }
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Detector0SmokeError, TrainingError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
