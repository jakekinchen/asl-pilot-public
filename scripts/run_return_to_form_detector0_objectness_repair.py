#!/usr/bin/env python3
"""Run the M3DY Detector 0 objectness repair diagnostic."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_parallel_heldout_recall import (
    REFERENCE_PATHS,
    VARIANTS,
    load_architecture_dataset,
    split_distribution,
    summarize_variant_for_table,
    train_variant,
)
from run_return_to_form_tier0_detector0_two_hand_union_training_smoke import (
    ROOT,
    UNION_TARGET_ID,
    Detector0SmokeError,
    file_ref,
    project_relative,
    read_json,
    write_json,
)
from train_rawframe_model import TrainingError, import_torch


SCHEMA_VERSION = "asl-pilot-return-to-form-detector0-objectness-repair/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-detector0-objectness-repair-v1.json"
DEFAULT_PACKET = REFERENCE_PATHS["packet"]
SESSION_LOG = "docs/session-logs/491-mission-3dy-detector0-objectness-repair.md"


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


def row_digest(row: dict[str, Any], threshold: float) -> dict[str, Any]:
    return {
        "row_id": row["row_id"],
        "clip_id": row["clip_id"],
        "split": row["split"],
        "label_id": row["label_id"],
        "source_record_id": row["source_record_id"],
        "signer_identity_hash": row["signer_identity_hash"],
        "target_present": row["target_present"],
        "presence_score": row["presence_score"],
        "max_map_objectness_score": row["max_map_objectness_score"],
        "global_presence_score": row["global_presence_score"],
        "threshold": threshold,
        "predicted_present": bool(row["presence_score"] >= threshold),
        "selected_cell_yx": row["selected_cell_yx"],
        "target_cell_yx_if_present": row["target_cell_yx_if_present"],
        "selected_cell_box_iou_if_present": row["selected_cell_box_iou_if_present"],
        "target_cell_box_iou_if_present": row["target_cell_box_iou_if_present"],
    }


def error_rows_at_threshold(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    false_positives: list[dict[str, Any]] = []
    false_negatives: list[dict[str, Any]] = []
    true_positives = 0
    true_negatives = 0
    for row in rows:
        predicted_present = bool(row["presence_score"] >= threshold)
        target_present = bool(row["target_present"])
        if predicted_present and target_present:
            true_positives += 1
        elif not predicted_present and not target_present:
            true_negatives += 1
        elif predicted_present and not target_present:
            false_positives.append(row_digest(row, threshold))
        else:
            false_negatives.append(row_digest(row, threshold))
    return {
        "threshold": threshold,
        "true_positive_count": true_positives,
        "true_negative_count": true_negatives,
        "false_positive_count": len(false_positives),
        "false_negative_count": len(false_negatives),
        "false_positive_rows": false_positives,
        "false_negative_rows": false_negatives,
    }


def variant_error_analysis(result: dict[str, Any]) -> dict[str, Any]:
    validation_threshold = float(result["diagnostic_validation_threshold"]["threshold"])
    return {
        "variant_id": result["variant_id"],
        "presence_score_source": result["presence_score_source"],
        "fixed_threshold": {
            split: error_rows_at_threshold(result["splits"][split]["rows"], 0.5)
            for split in ("train", "validation", "test")
        },
        "validation_selected_threshold": {
            split: error_rows_at_threshold(result["splits"][split]["rows"], validation_threshold)
            for split in ("train", "validation", "test")
        },
    }


def packet_support_diagnostics(packet_evidence: dict[str, Any]) -> dict[str, Any]:
    split_summaries: dict[str, Any] = {}
    all_rows: list[dict[str, Any]] = []
    for split, rows in packet_evidence["rows_by_split"].items():
        all_rows.extend(rows)
        counts_by_label: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
        for row in rows:
            bucket = "present" if row["union_target_present"] else "absent"
            counts_by_label[row["label_id"]][bucket] += 1
        labels_with_both = sorted(
            label for label, counts in counts_by_label.items() if counts["present"] and counts["absent"]
        )
        split_summaries[split] = {
            "sample_count": len(rows),
            "counts_by_label": dict(sorted(counts_by_label.items())),
            "present_labels": sorted(label for label, counts in counts_by_label.items() if counts["present"]),
            "absent_labels": sorted(label for label, counts in counts_by_label.items() if counts["absent"]),
            "labels_with_both_present_and_absent": labels_with_both,
            "has_within_label_presence_contrast": bool(labels_with_both),
        }

    global_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    for row in all_rows:
        bucket = "present" if row["union_target_present"] else "absent"
        global_counts[row["label_id"]][bucket] += 1
    labels_with_both_global = sorted(
        label for label, counts in global_counts.items() if counts["present"] and counts["absent"]
    )
    presence_equals_table = all(
        bool(row["union_target_present"]) == (row["label_id"] == "table") for row in all_rows
    )
    return {
        "split_summaries": split_summaries,
        "global_counts_by_label": dict(sorted(global_counts.items())),
        "global_present_labels": sorted(label for label, counts in global_counts.items() if counts["present"]),
        "global_absent_labels": sorted(label for label, counts in global_counts.items() if counts["absent"]),
        "global_labels_with_both_present_and_absent": labels_with_both_global,
        "has_global_within_label_presence_contrast": bool(labels_with_both_global),
        "target_presence_equivalent_to_label_id_table": presence_equals_table,
        "diagnosis": (
            "packet_presence_is_label_confounded"
            if presence_equals_table and not labels_with_both_global
            else "packet_has_some_presence_contrast"
        ),
        "implication": (
            "The current packet can test whether a tiny model memorizes table-vs-other-label cues, "
            "but it cannot by itself prove class-invariant Detector 0 objectness."
        ),
    }


def heldout_score_distributions(variant_results: list[dict[str, Any]]) -> dict[str, Any]:
    return {
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
    }


def box_quality_by_variant(variant_results: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        result["variant_id"]: {
            split: result["splits"][split]["box_quality"] for split in ("train", "validation", "test")
        }
        for result in variant_results
    }


def train_loss_movement(variant_results: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        result["variant_id"]: {
            "loss_movement": result["loss_movement"],
            "recorded_history_points": len(result["history"]),
        }
        for result in variant_results
    }


def classify_outcome(
    variant_results: list[dict[str, Any]],
    support_diagnostics: dict[str, Any],
) -> dict[str, Any]:
    if support_diagnostics["diagnosis"] == "packet_presence_is_label_confounded":
        return {
            "classification": "packet_presence_label_confounding_blocks_general_objectness_claim",
            "next_action": "continue_detector0_annotation_or_packet_support_no_brev",
            "reason": (
                "Every target-present row is label_id=table and every target-absent row is a different label, "
                "with no within-label present/absent contrast. More objectness formulations can still be tried, "
                "but this packet cannot prove class-invariant presence without additional approved packet support."
            ),
        }

    credible_variants: list[str] = []
    for result in variant_results:
        validation_auc = result["splits"]["validation"]["presence_score_metrics"]["threshold_free"]["auroc"]["value"]
        test_auc = result["splits"]["test"]["presence_score_metrics"]["threshold_free"]["auroc"]["value"]
        validation_threshold = result["splits"]["validation"]["presence_score_metrics"]["validation_selected_threshold"]
        test_threshold = result["splits"]["test"]["presence_score_metrics"]["validation_selected_threshold"]
        if (
            validation_auc is not None
            and test_auc is not None
            and validation_auc >= 0.75
            and test_auc >= 0.75
            and validation_threshold["false_positive_count"] <= 1
            and test_threshold["false_positive_count"] <= 1
            and validation_threshold["recall"] is not None
            and test_threshold["recall"] is not None
            and validation_threshold["recall"] >= 0.5
            and test_threshold["recall"] >= 0.5
        ):
            credible_variants.append(result["variant_id"])
    if credible_variants:
        return {
            "classification": "credible_heldout_presence_signal_found_but_not_product_ready",
            "credible_variants": credible_variants,
            "next_action": "prepare_detector0_crop_normalization_ablation_after_presence_signal",
            "reason": (
                "At least one bounded variant ranked held-out positives above negatives on validation and test "
                "without more than one diagnostic-threshold false positive per held-out split."
            ),
        }
    return {
        "classification": "target_objectness_formulation_deficiency_remains",
        "credible_variants": [],
        "next_action": "continue_detector0_objectness_repair_no_brev",
        "reason": (
            "No bounded variant produced credible validation and test presence ranking, so the next local action "
            "remains objectness formulation repair rather than crop-normalization ablation."
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

    prior_receipt = read_json(ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-parallel-heldout-recall-v1.json")
    support_diagnostics = packet_support_diagnostics(packet_evidence)
    outcome = classify_outcome(variant_results, support_diagnostics)
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3DY - Detector 0 objectness repair",
        "active_prompt": "docs/model/return-to-form-detector0-objectness-repair-goal-loop-prompt.md",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json >/dev/null",
            "python3 -m json.tool web/public/model/model-card.json >/dev/null",
            "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_return_to_form_tier0_detector0_parallel_heldout_recall.py",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_return_to_form_detector0_objectness_repair.py",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/run_return_to_form_detector0_objectness_repair.py",
        ],
        "commands_intentionally_not_run": [
            "No Brev command, remote compute, source import, media download, or source-register mutation.",
            "No manifest, tensor, vocabulary, model-card, browser runtime, export, promotion, or final-gate mutation.",
            "No hand-landmark detector training and no recognizer retraining.",
        ],
        "files_symbols_inspected": {
            "active_prompt": file_ref(ROOT / "docs" / "model" / "return-to-form-detector0-objectness-repair-goal-loop-prompt.md"),
            "goal": file_ref(ROOT / "GOAL.md"),
            "return_to_form_plan": file_ref(ROOT / "docs" / "model" / "return-to-form-plan.md"),
            "prior_parallel_heldout_receipt": file_ref(
                ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-parallel-heldout-recall-v1.json"
            ),
            "m3dx_source_feasibility_receipt": file_ref(
                ROOT / "docs" / "validation" / "return-to-form-hand-landmark-source-feasibility-v1.json"
            ),
            "packet": file_ref(DEFAULT_PACKET),
            "old_runner": file_ref(ROOT / "scripts" / "run_return_to_form_tier0_detector0_parallel_heldout_recall.py"),
            "new_runner": file_ref(Path(__file__).resolve()),
        },
        "files_changed": [
            "scripts/run_return_to_form_detector0_objectness_repair.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "experiment_bounds": {
            "variant_count": len(VARIANTS),
            "max_variants_allowed": 3,
            "variant_ids": [variant["id"] for variant in VARIANTS],
            "local_only": True,
            "device": args.device,
            "epochs_per_variant": args.max_epochs,
            "batching": "full 11-row train split batch",
            "packet_rows": 32,
            "no_brev": True,
            "no_source_import": True,
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
            "objectness_support_diagnostics": support_diagnostics,
        },
        "variant_summaries": [summarize_variant_for_table(result) for result in variant_results],
        "train_loss_movement": train_loss_movement(variant_results),
        "heldout_score_distributions": heldout_score_distributions(variant_results),
        "false_positive_false_negative_rows": {
            result["variant_id"]: variant_error_analysis(result) for result in variant_results
        },
        "presence_versus_box_quality": {
            "box_quality_separate_from_presence": box_quality_by_variant(variant_results),
            "interpretation": (
                "Box MAE/IoU can look acceptable on present rows while presence remains unreliable; "
                "therefore crop-normalization ablation should not proceed from box metrics alone."
            ),
        },
        "comparison_to_parallel_heldout_receipt": {
            "path": "docs/validation/return-to-form-tier0-detector0-parallel-heldout-recall-v1.json",
            "prior_outcome": prior_receipt.get("outcome"),
            "prior_next_action": prior_receipt.get("next_action"),
            "new_diagnostic_addition": (
                "This M3DY receipt adds explicit packet presence-vs-label confounding diagnostics and "
                "row-level false-positive/false-negative summaries under both fixed and validation-selected thresholds."
            ),
        },
        "claim_boundary": {
            "product_claim": "unchanged_fail_closed",
            "model_card_status": "not_trained",
            "active_labels": [],
            "detector0_status": "not_promoted",
            "hand_landmark_source_approval": "not_granted",
            "what_this_receipt_does_not_claim": [
                "No Detector 0 browser artifact is promoted.",
                "No crop-normalization ablation is approved.",
                "No source import or hand-landmark route is approved.",
                "No final readiness or ASL correctness claim is active."
            ],
        },
        "no_brev_no_pretrained_no_import_proof": {
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
        },
        "outcome": outcome,
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
                "support_diagnosis": support_diagnostics["diagnosis"],
                "variant_count": len(variant_results),
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
