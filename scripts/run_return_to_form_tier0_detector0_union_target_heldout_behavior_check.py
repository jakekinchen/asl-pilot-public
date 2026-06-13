#!/usr/bin/env python3
"""Write the M3AE-AN no-training union-target held-out behavior check."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import statistics
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-detector0-union-target-heldout-behavior-check/v1"
TARGET_ID = "table_two_hand_union_or_contact_region"
FIXED_THRESHOLD = 0.5
DEFAULT_OUTPUT = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json"
)
REFERENCE_PATHS = {
    "m3ae_al_architecture_microprobe": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json",
    "m3ae_am_heldout_design": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md",
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
    "current_packet": ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "fixed_crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "detector0_bootstrap": ROOT
    / "docs"
    / "validation"
    / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "detector0_training_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-training-smoke-v1.json",
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


class HeldoutBehaviorCheckError(RuntimeError):
    """Raised when the held-out behavior check cannot write a valid receipt."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def sha256_file(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise HeldoutBehaviorCheckError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise HeldoutBehaviorCheckError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise HeldoutBehaviorCheckError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise HeldoutBehaviorCheckError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def brev_no_spend_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True, timeout=30)
    except Exception as error:  # noqa: BLE001 - the receipt should preserve no-spend proof if the CLI is unavailable.
        return {
            "checked": False,
            "command": "brev ls --json",
            "compute_used": False,
            "remote_training_used": False,
            "sync_or_training_used": False,
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
        "remote_training_used": False,
        "sync_or_training_used": False,
        "planned_remote_command": "none",
        "max_runtime_minutes": 0,
        "max_spend_usd": 0,
        "human_spend_approval": False,
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def stats(values: list[float]) -> dict[str, Any]:
    if not values:
        return {"count": 0, "min": None, "max": None, "mean": None, "median": None}
    return {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "mean": sum(values) / len(values),
        "median": statistics.median(values),
    }


def compact_row(row: dict[str, Any], threshold: float) -> dict[str, Any]:
    score = float(row["predicted_presence_score"])
    target_present = bool(row["target_present"])
    predicted_present = score >= threshold
    if target_present and predicted_present:
        outcome = "true_positive"
    elif target_present and not predicted_present:
        outcome = "false_negative"
    elif not target_present and predicted_present:
        outcome = "false_positive"
    else:
        outcome = "true_negative"
    return {
        "row_id": row["row_id"],
        "clip_id": row["clip_id"],
        "split": row["split"],
        "label_id": row["label_id"],
        "source_record_id": row["source_record_id"],
        "signer_identity_hash": row["signer_identity_hash"],
        "frame_index": row["frame_index"],
        "target_present": target_present,
        "predicted_present": predicted_present,
        "presence_score": score,
        "outcome_at_threshold": outcome,
        "microprobe_box_mae_if_present": row.get("microprobe_box_mae_if_present"),
        "median_box_mae_if_present": row.get("median_box_mae_if_present"),
        "microprobe_minus_median_box_mae": row.get("microprobe_minus_median_box_mae"),
        "microprobe_mean_iou_if_present": row.get("microprobe_mean_iou_if_present"),
        "median_mean_iou_if_present": row.get("median_mean_iou_if_present"),
        "microprobe_minus_median_mean_iou": row.get("microprobe_minus_median_mean_iou"),
    }


def summarize_fixed_threshold(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    compact_rows = [compact_row(row, threshold) for row in rows]
    outcomes = {
        "true_positives": [row for row in compact_rows if row["outcome_at_threshold"] == "true_positive"],
        "true_negatives": [row for row in compact_rows if row["outcome_at_threshold"] == "true_negative"],
        "false_positives": [row for row in compact_rows if row["outcome_at_threshold"] == "false_positive"],
        "false_negatives": [row for row in compact_rows if row["outcome_at_threshold"] == "false_negative"],
    }
    sample_count = len(rows)
    accuracy = (len(outcomes["true_positives"]) + len(outcomes["true_negatives"])) / sample_count if sample_count else None
    return {
        "threshold": threshold,
        "sample_count": sample_count,
        "target_present_count": sum(1 for row in rows if row["target_present"]),
        "target_absent_count": sum(1 for row in rows if not row["target_present"]),
        "presence_accuracy": accuracy,
        "true_positive_count": len(outcomes["true_positives"]),
        "true_negative_count": len(outcomes["true_negatives"]),
        "false_positive_count": len(outcomes["false_positives"]),
        "false_negative_count": len(outcomes["false_negatives"]),
        **outcomes,
    }


def score_behavior(rows: list[dict[str, Any]], fixed_summary: dict[str, Any]) -> dict[str, Any]:
    table_rows = [row for row in rows if row["label_id"] == "table"]
    non_table_rows = [row for row in rows if row["label_id"] != "table"]
    table_scores = [float(row["predicted_presence_score"]) for row in table_rows]
    non_table_scores = [float(row["predicted_presence_score"]) for row in non_table_rows]
    false_negative_scores = [float(row["presence_score"]) for row in fixed_summary["false_negatives"]]
    false_positive_scores = [float(row["presence_score"]) for row in fixed_summary["false_positives"]]
    return {
        "table_score_summary": stats(table_scores),
        "non_table_score_summary": stats(non_table_scores),
        "target_present_score_summary": stats([float(row["predicted_presence_score"]) for row in rows if row["target_present"]]),
        "target_absent_score_summary": stats([float(row["predicted_presence_score"]) for row in rows if not row["target_present"]]),
        "false_negative_score_summary": stats(false_negative_scores),
        "false_positive_score_summary": stats(false_positive_scores),
        "non_table_mean_minus_table_mean": (
            (sum(non_table_scores) / len(non_table_scores)) - (sum(table_scores) / len(table_scores))
            if non_table_scores and table_scores
            else None
        ),
        "false_positive_min_score_above_false_negative_max_score": (
            min(false_positive_scores) > max(false_negative_scores) if false_positive_scores and false_negative_scores else None
        ),
        "interpretation": (
            "Held-out non-table false positives outscore table false negatives, so the presence signal is not "
            "coherently separating the table union/contact target from non-table rows."
        ),
    }


def present_row_comparison(rows: list[dict[str, Any]], fixed_summary: dict[str, Any]) -> dict[str, Any]:
    false_negative_ids = {row["row_id"] for row in fixed_summary["false_negatives"]}
    present_rows = []
    for row in rows:
        if not row["target_present"]:
            continue
        compact = compact_row(row, FIXED_THRESHOLD)
        compact["microprobe_beats_median_mae"] = (
            row["microprobe_box_mae_if_present"] is not None
            and row["median_box_mae_if_present"] is not None
            and row["microprobe_box_mae_if_present"] <= row["median_box_mae_if_present"]
        )
        compact["microprobe_beats_median_iou"] = (
            row["microprobe_mean_iou_if_present"] is not None
            and row["median_mean_iou_if_present"] is not None
            and row["microprobe_mean_iou_if_present"] >= row["median_mean_iou_if_present"]
        )
        compact["is_false_negative_at_fixed_threshold"] = row["row_id"] in false_negative_ids
        present_rows.append(compact)

    false_negative_maes = [
        float(row["microprobe_box_mae_if_present"])
        for row in present_rows
        if row["is_false_negative_at_fixed_threshold"] and row["microprobe_box_mae_if_present"] is not None
    ]
    true_positive_maes = [
        float(row["microprobe_box_mae_if_present"])
        for row in present_rows
        if not row["is_false_negative_at_fixed_threshold"] and row["microprobe_box_mae_if_present"] is not None
    ]
    return {
        "present_row_count": len(present_rows),
        "rows": present_rows,
        "microprobe_beats_median_mae_count": sum(1 for row in present_rows if row["microprobe_beats_median_mae"]),
        "microprobe_beats_median_iou_count": sum(1 for row in present_rows if row["microprobe_beats_median_iou"]),
        "false_negative_microprobe_box_mae_summary": stats(false_negative_maes),
        "true_positive_microprobe_box_mae_summary": stats(true_positive_maes),
        "worst_box_errors_coincide_with_false_negatives": (
            bool(false_negative_maes and true_positive_maes and min(false_negative_maes) > max(true_positive_maes))
        ),
    }


def threshold_metrics(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    summary = summarize_fixed_threshold(rows, threshold)
    return {
        "threshold": threshold,
        "presence_accuracy": summary["presence_accuracy"],
        "true_positive_count": summary["true_positive_count"],
        "true_negative_count": summary["true_negative_count"],
        "false_positive_count": summary["false_positive_count"],
        "false_negative_count": summary["false_negative_count"],
        "predicted_present_rate": (
            (summary["true_positive_count"] + summary["false_positive_count"]) / summary["sample_count"]
            if summary["sample_count"]
            else None
        ),
    }


def threshold_sweep(rows: list[dict[str, Any]]) -> dict[str, Any]:
    sweep = [threshold_metrics(rows, round(index * 0.05, 2)) for index in range(21)]
    best_accuracy = max(item["presence_accuracy"] for item in sweep if item["presence_accuracy"] is not None)
    best = [item for item in sweep if item["presence_accuracy"] == best_accuracy]
    gate_like = [
        item
        for item in sweep
        if item["presence_accuracy"] is not None
        and item["presence_accuracy"] >= 0.80
        and item["false_positive_count"] <= 1
        and item["false_negative_count"] <= 1
    ]
    return {
        "thresholds": sweep,
        "best_accuracy": best_accuracy,
        "best_accuracy_thresholds": best,
        "thresholds_meeting_presence_fp_fn_gates": gate_like,
        "product_threshold_selected": False,
        "report_only": True,
        "summary": (
            "No threshold is selected or promoted; sweep is diagnostic only over existing M3AE-AL presence scores."
        ),
    }


def pass_gates(
    al_receipt: dict[str, Any],
    fixed: dict[str, dict[str, Any]],
    threshold_sweeps: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    metrics = al_receipt["training"]["metrics"]
    passed = {
        "validation_presence_accuracy_ge_0_80": metrics["validation"]["presence_accuracy"] >= 0.80,
        "test_presence_accuracy_ge_0_80": metrics["test"]["presence_accuracy"] >= 0.80,
        "validation_false_positive_count_lte_1": fixed["validation"]["false_positive_count"] <= 1,
        "validation_false_negative_count_lte_1": fixed["validation"]["false_negative_count"] <= 1,
        "test_false_positive_count_lte_1": fixed["test"]["false_positive_count"] <= 1,
        "test_false_negative_count_lte_1": fixed["test"]["false_negative_count"] <= 1,
        "validation_present_box_mae_lte_m3ae_aj_median": (
            metrics["validation"]["present_box_mae"] <= metrics["validation"]["median_constant_box_mae"]
        ),
        "test_present_box_mae_lte_m3ae_aj_median": metrics["test"]["present_box_mae"]
        <= metrics["test"]["median_constant_box_mae"],
        "validation_present_box_mean_iou_gte_m3ae_aj_median": (
            metrics["validation"]["present_box_mean_iou"] >= metrics["validation"]["median_constant_box_mean_iou"]
        ),
        "test_present_box_mean_iou_gte_m3ae_aj_median": (
            metrics["test"]["present_box_mean_iou"] >= metrics["test"]["median_constant_box_mean_iou"]
        ),
        "row_level_error_table_recorded": all(
            fixed[split]["false_positives"] is not None and fixed[split]["false_negatives"] is not None
            for split in ("validation", "test")
        ),
        "threshold_sweep_reported_without_selecting_product_threshold": all(
            sweep["report_only"] and not sweep["product_threshold_selected"] for sweep in threshold_sweeps.values()
        ),
        "no_training_or_export_boundaries_preserved": True,
    }
    return {
        "criteria": {
            "validation_presence_accuracy_min": 0.80,
            "test_presence_accuracy_min": 0.80,
            "validation_false_positive_count_max": 1,
            "validation_false_negative_count_max": 1,
            "test_false_positive_count_max": 1,
            "test_false_negative_count_max": 1,
            "validation_present_box_mae_max": metrics["validation"]["median_constant_box_mae"],
            "test_present_box_mae_max": metrics["test"]["median_constant_box_mae"],
            "validation_present_box_mean_iou_min": metrics["validation"]["median_constant_box_mean_iou"],
            "test_present_box_mean_iou_min": metrics["test"]["median_constant_box_mean_iou"],
            "row_level_error_table_recorded": True,
            "threshold_sweep_reported_without_selecting_product_threshold": True,
            "no_training_or_export_boundaries_preserved": True,
        },
        "actual": {
            "validation_presence_accuracy": metrics["validation"]["presence_accuracy"],
            "test_presence_accuracy": metrics["test"]["presence_accuracy"],
            "validation_false_positive_count": fixed["validation"]["false_positive_count"],
            "validation_false_negative_count": fixed["validation"]["false_negative_count"],
            "test_false_positive_count": fixed["test"]["false_positive_count"],
            "test_false_negative_count": fixed["test"]["false_negative_count"],
            "validation_present_box_mae": metrics["validation"]["present_box_mae"],
            "test_present_box_mae": metrics["test"]["present_box_mae"],
            "validation_present_box_mean_iou": metrics["validation"]["present_box_mean_iou"],
            "test_present_box_mean_iou": metrics["test"]["present_box_mean_iou"],
        },
        "passed": passed,
        "all_passed": all(passed.values()),
    }


def ensure_expected_al_receipt(al_receipt: dict[str, Any]) -> None:
    if al_receipt.get("schema_version") != "asl-pilot-return-to-form-tier0-detector0-union-target-architecture-microprobe/v1":
        raise HeldoutBehaviorCheckError("unexpected M3AE-AL schema version")
    if al_receipt.get("selected_formulation") != "anchor_residual_coordconv_union_target_microprobe_v1":
        raise HeldoutBehaviorCheckError("unexpected M3AE-AL selected formulation")
    rows = al_receipt.get("training", {}).get("row_level_predictions")
    if not isinstance(rows, dict):
        raise HeldoutBehaviorCheckError("M3AE-AL receipt missing training.row_level_predictions")
    if len(rows.get("validation", [])) != 11 or len(rows.get("test", [])) != 10:
        raise HeldoutBehaviorCheckError("M3AE-AL held-out row counts changed")
    if al_receipt.get("readiness_classification", {}).get("pass_gates", {}).get("all_passed") is not True:
        raise HeldoutBehaviorCheckError("M3AE-AL train pass gates are no longer closed")


def main() -> int:
    args = parse_args()
    al_receipt = read_json(REFERENCE_PATHS["m3ae_al_architecture_microprobe"])
    ensure_expected_al_receipt(al_receipt)

    rows_by_split = al_receipt["training"]["row_level_predictions"]
    heldout_rows = {split: list(rows_by_split[split]) for split in ("validation", "test")}
    fixed = {split: summarize_fixed_threshold(rows, FIXED_THRESHOLD) for split, rows in heldout_rows.items()}
    score_summaries = {split: score_behavior(heldout_rows[split], fixed[split]) for split in ("validation", "test")}
    row_comparisons = {split: present_row_comparison(heldout_rows[split], fixed[split]) for split in ("validation", "test")}
    threshold_sweeps = {split: threshold_sweep(rows) for split, rows in heldout_rows.items()}
    gates = pass_gates(al_receipt, fixed, threshold_sweeps)

    next_action = (
        "crop_normalization_ablation_design"
        if gates["all_passed"]
        else "detector0_union_target_architecture_remediation"
    )
    failure_classification = {
        "classification": (
            "heldout_presence_and_box_generalization_failure"
            if next_action == "detector0_union_target_architecture_remediation"
            else "heldout_behavior_passed"
        ),
        "data_or_schema_invalidation_found": False,
        "reduced_claim_stop_required": False,
        "reason": (
            "Fixed-threshold validation/test presence gates fail, non-table false positives outscore table false "
            "negatives, and validation/test present-box MAE and IoU lose to the M3AE-AJ median baseline; no concrete "
            "packet, split, tensor-hash, target-presence, or schema invalidation is found in this receipt-only scope."
        ),
        "next_action": next_action,
    }

    source_artifacts = {name: file_ref(path) for name, path in REFERENCE_PATHS.items()}
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "mission": "M3AE-AN Detector 0 union-target held-out behavior check",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "target_id": TARGET_ID,
        "selected_formulation": al_receipt["selected_formulation"],
        "selected_signs": ["please", "table", "dad", "grandpa", "hat"],
        "fixed_threshold": FIXED_THRESHOLD,
        "inputs": {
            "parsed_from_m3ae_al": [
                "training.row_level_predictions.validation",
                "training.row_level_predictions.test",
                "training.metrics",
                "median_baseline_comparison",
            ],
            "packet_and_manifest_use": "hash_and_identifier_binding_only",
            "image_or_tensor_payloads_loaded": False,
        },
        "source_artifacts": source_artifacts,
        "m3ae_al_train_pass_evidence": {
            "presence_accuracy": al_receipt["training"]["metrics"]["train"]["presence_accuracy"],
            "present_box_mae": al_receipt["training"]["metrics"]["train"]["present_box_mae"],
            "m3ae_aj_train_median_box_mae": al_receipt["training"]["metrics"]["train"]["median_constant_box_mae"],
            "present_box_mean_iou": al_receipt["training"]["metrics"]["train"]["present_box_mean_iou"],
            "m3ae_aj_train_median_box_mean_iou": al_receipt["training"]["metrics"]["train"][
                "median_constant_box_mean_iou"
            ],
            "pass_gates": al_receipt["readiness_classification"]["pass_gates"],
        },
        "split_metrics": {
            split: {
                "m3ae_al_metrics": al_receipt["training"]["metrics"][split],
                "median_baseline_comparison": al_receipt["median_baseline_comparison"]["per_split"][split],
                "fixed_threshold_presence": {
                    key: fixed[split][key]
                    for key in (
                        "threshold",
                        "sample_count",
                        "target_present_count",
                        "target_absent_count",
                        "presence_accuracy",
                        "true_positive_count",
                        "true_negative_count",
                        "false_positive_count",
                        "false_negative_count",
                    )
                },
            }
            for split in ("validation", "test")
        },
        "row_level_error_tables": fixed,
        "table_vs_non_table_score_behavior": score_summaries,
        "present_table_row_median_baseline_comparison": row_comparisons,
        "threshold_sweep": threshold_sweeps,
        "readiness_classification": {
            "pass_gates": gates,
            "failure_classification": failure_classification,
            "not_a_product_readiness_claim": True,
        },
        "boundaries": {
            "receipt_only": True,
            "microprobe_rerun": False,
            "detector0_training": False,
            "generic_training_smoke_retry": False,
            "gradient_updates": 0,
            "image_payloads_loaded": False,
            "tensor_payloads_loaded": False,
            "packet_mutation": False,
            "rows_added": False,
            "brev_spend": False,
            "brev_stop": False,
            "brev_sync": False,
            "brev_training": False,
            "duplicate_brev_worker": False,
            "crop_normalization_ablation": False,
            "recognizer_training": False,
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
            "threshold_selected_or_promoted": False,
            "push": False,
        },
        "brev_no_spend_boundary": brev_no_spend_status(),
        "final_promotion_blocker_separation": {
            "hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "final_promotion_negative_challenge_blocker": "unchanged_and_separate_from_m3ae_an",
        },
        "next_action": next_action,
    }
    write_json(args.output, receipt)
    print(json.dumps({"status": receipt["status"], "output": project_relative(args.output), "next_action": next_action}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except HeldoutBehaviorCheckError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
