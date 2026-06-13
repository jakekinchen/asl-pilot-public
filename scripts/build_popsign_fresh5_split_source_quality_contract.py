#!/usr/bin/env python3
"""Build the PopSign fresh5 split/source/signer quality contract receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-split-source-quality-contract/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json")
ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-split-source-quality-contract-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
ACTIVE_MODULE_VOCABULARY_REVIEW = Path("data/active-module/active-module-vocabulary-review.json")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
M3BX_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")
M3BY_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json")
M3BZ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json")
M3CA_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")
M3CI_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
M3CL_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json")
LABELS = ["home", "morning", "pen", "thank_you", "who"]


class ContractError(RuntimeError):
    """Raised when the read-only contract cannot be built."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ContractError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise ContractError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, str]:
    resolved = project_path(path, "input artifact")
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path, "json input artifact")
    return json.loads(resolved.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def gate_status(passed: bool) -> str:
    return "passed" if passed else "failed"


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/build_popsign_fresh5_split_source_quality_contract.py",
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--write-receipt",
    ]


def validate_args(args: argparse.Namespace) -> Path:
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    if receipt != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise ContractError(f"M3CM requires {DEFAULT_RECEIPT.as_posix()}, got {project_relative(receipt)}")
    if not args.write_receipt:
        raise ContractError("M3CM requires --write-receipt")
    return receipt


def source_register_entry(source_register: dict[str, Any], source_id: str) -> dict[str, Any]:
    for source in source_register.get("sources", []):
        if isinstance(source, dict) and source.get("source_id") == source_id:
            return source
    raise ContractError(f"source register entry not found for {source_id}")


def load_inputs() -> dict[str, dict[str, Any]]:
    return {
        "source_register": load_json(SOURCE_REGISTER),
        "active_module_vocabulary_review": load_json(ACTIVE_MODULE_VOCABULARY_REVIEW),
        "manifest_contract": load_json(MANIFEST_CONTRACT),
        "train_manifest": load_json(TRAIN_MANIFEST),
        "validation_manifest": load_json(VALIDATION_MANIFEST),
        "test_manifest": load_json(TEST_MANIFEST),
        "m3bx": load_json(M3BX_RECEIPT),
        "m3by": load_json(M3BY_RECEIPT),
        "m3bz": load_json(M3BZ_RECEIPT),
        "m3ca": load_json(M3CA_RECEIPT),
        "m3ci": load_json(M3CI_RECEIPT),
        "m3cj": load_json(M3CJ_RECEIPT),
        "m3ck": load_json(M3CK_RECEIPT),
        "m3cl": load_json(M3CL_RECEIPT),
    }


def artifact_references() -> dict[str, dict[str, str]]:
    return {
        "goal": file_reference(Path("GOAL.md")),
        "active_prompt": file_reference(ACTIVE_PROMPT),
        "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        "source_register": file_reference(SOURCE_REGISTER),
        "active_module_vocabulary_review": file_reference(ACTIVE_MODULE_VOCABULARY_REVIEW),
        "manifest_contract": file_reference(MANIFEST_CONTRACT),
        "train_manifest": file_reference(TRAIN_MANIFEST),
        "validation_manifest": file_reference(VALIDATION_MANIFEST),
        "test_manifest": file_reference(TEST_MANIFEST),
        "m3bx_vocab_split_remediation": file_reference(M3BX_RECEIPT),
        "m3by_repaired_manifest_contract": file_reference(M3BY_RECEIPT),
        "m3bz_repaired_manifest_materialization": file_reference(M3BZ_RECEIPT),
        "m3ca_learnability_isolation_probe": file_reference(M3CA_RECEIPT),
        "m3ci_evaluation_invocation_contract": file_reference(M3CI_RECEIPT),
        "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
        "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
        "m3cl_data_split_label_distribution_audit": file_reference(M3CL_RECEIPT),
    }


def label_slug_counts(split_distribution: dict[str, Any], label: str) -> dict[str, dict[str, int]]:
    result = {}
    for split in ["train", "validation", "test"]:
        result[split] = (
            split_distribution.get(split, {})
            .get("per_label", {})
            .get(label, {})
            .get("source_sign_slug_counts", {})
        )
    return result


def top_signer_fraction(split_distribution: dict[str, Any], label: str) -> dict[str, float | None]:
    result: dict[str, float | None] = {}
    for split in ["train", "validation", "test"]:
        per_label = split_distribution.get(split, {}).get("per_label", {}).get(label, {})
        counts = per_label.get("top_signer_clip_counts", {})
        clip_count = per_label.get("clip_count", 0)
        result[split] = (max(counts.values()) / clip_count) if counts and clip_count else None
    return result


def source_review_summary(manifest: dict[str, Any]) -> dict[str, Any]:
    clips = manifest.get("clips", [])
    if not isinstance(clips, list):
        raise ContractError("manifest clips must be a list")
    review_statuses = []
    for clip in clips:
        review = clip.get("review") if isinstance(clip, dict) else {}
        review_statuses.append(str(review.get("label_review_status", "")) if isinstance(review, dict) else "")
    review_status_values = sorted(set(review_statuses))
    allowed_values = sorted({bool(clip.get("allowed_for_model_training")) for clip in clips})
    license_statuses = sorted({str(clip.get("source_license_review_status", "")) for clip in clips})
    decision_ids = sorted({str(clip.get("source_license_decision", "")) for clip in clips})
    return {
        "clip_count": len(clips),
        "all_label_reviews_approved": review_status_values == ["approved"],
        "all_allowed_for_model_training": allowed_values == [True],
        "source_license_review_statuses": license_statuses,
        "source_license_decision_ids": decision_ids,
        "label_review_statuses": review_status_values,
    }


def train_all_lr003(m3cj: dict[str, Any]) -> dict[str, Any]:
    for run in m3cj.get("runs", []):
        if isinstance(run, dict) and run.get("name") == "train_all_lr003":
            evaluation = run.get("evaluation", {})
            return evaluation if isinstance(evaluation, dict) else {}
    return {}


def split_source_gates(inputs: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    m3cl = inputs["m3cl"]
    split_distribution = m3cl.get("split_distribution", {})
    overlaps = m3cl.get("cross_split_overlap", {})
    source = source_register_entry(inputs["source_register"], "popsign-v1-original-videos")
    source_reviews = {
        "train": source_review_summary(inputs["train_manifest"]),
        "validation": source_review_summary(inputs["validation_manifest"]),
        "test": source_review_summary(inputs["test_manifest"]),
    }
    expected_label_counts = {label: 25 for label in LABELS}
    expected_source_splits = {"train": {"train": 125}, "validation": {"val": 125}, "test": {"test": 125}}
    observed_source_splits = {split: summary.get("source_split_counts") for split, summary in split_distribution.items()}
    no_overlap = all(
        pair.get("shared_clip_id_count") == 0
        and pair.get("shared_source_record_id_count") == 0
        and pair.get("shared_signer_identity_hash_count") == 0
        and pair.get("shared_tensor_path_count") == 0
        and pair.get("shared_tensor_sha256_count") == 0
        for pair in overlaps.values()
    )
    signer_minima = {
        split: min(summary.get("signer_identity_hash_count_by_label", {}).values())
        for split, summary in split_distribution.items()
    }
    top_signer_max_fraction = max(
        fraction
        for label in LABELS
        for fraction in top_signer_fraction(split_distribution, label).values()
        if fraction is not None
    )
    source_passed = (
        source.get("source_id") == "popsign-v1-original-videos"
        and source.get("allowed_for_model_training") is True
        and source.get("license_review_status") == "approved_cc_by_4_raw_video_with_attribution"
    )
    label_support_passed = all(
        summary.get("label_counts") == expected_label_counts for summary in split_distribution.values()
    )
    signer_support_passed = (
        signer_minima.get("train", 0) >= 10
        and signer_minima.get("validation", 0) >= 5
        and signer_minima.get("test", 0) >= 5
        and top_signer_max_fraction <= 0.4
    )
    expected_region_order = (
        "viewer_left_hand_context,viewer_right_hand_context,upper_body_signing_space,"
        "head_context,full_frame_reference"
    )
    tensor_passed = all(
        summary.get("clip_count") == 125
        and summary.get("tensor_hash_match_count") == 125
        and summary.get("tensor_shape_counts") == {"16x5x96x96x3": 125}
        and summary.get("tensor_dtype_counts") == {"uint8": 125}
        and summary.get("region_order_counts") == {expected_region_order: 125}
        and summary.get("tensor_failures") == []
        for summary in split_distribution.values()
    )
    source_review_passed = all(
        review["all_label_reviews_approved"] and review["all_allowed_for_model_training"]
        for review in source_reviews.values()
    )
    return [
        {
            "gate_id": "approved_single_source_lane",
            "status": gate_status(source_passed),
            "required": {
                "source_id": "popsign-v1-original-videos",
                "allowed_for_model_training": True,
                "license_review_status": "approved_cc_by_4_raw_video_with_attribution",
                "no_source_register_mutation": True,
            },
            "observed": {
                "source_id": source.get("source_id"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "license_review_status": source.get("license_review_status"),
                "decision_id": source.get("decision_id"),
            },
        },
        {
            "gate_id": "split_boundaries_preserved",
            "status": gate_status(observed_source_splits == expected_source_splits),
            "required": expected_source_splits,
            "observed": observed_source_splits,
        },
        {
            "gate_id": "balanced_label_support_per_split",
            "status": gate_status(label_support_passed),
            "required": {"clip_count_per_label_per_split": 25, "labels": LABELS},
            "observed": {split: summary.get("label_counts") for split, summary in split_distribution.items()},
        },
        {
            "gate_id": "strict_cross_split_disjointness",
            "status": gate_status(no_overlap),
            "required": {
                "shared_clip_id_count": 0,
                "shared_source_record_id_count": 0,
                "shared_signer_identity_hash_count": 0,
                "shared_tensor_path_count": 0,
                "shared_tensor_sha256_count": 0,
            },
            "observed": overlaps,
            "interpretation": (
                "The repaired route is a strict source-split/signer-disjoint generalization test. Passing this "
                "gate prevents leakage but does not prove the labels are visually/semantically learnable."
            ),
        },
        {
            "gate_id": "per_label_signer_support_floor",
            "status": gate_status(signer_support_passed),
            "required": {
                "minimum_signer_identity_hashes_per_label": {"train": 10, "validation": 5, "test": 5},
                "maximum_single_signer_fraction_per_label_split_lte": 0.4,
            },
            "observed": {
                "minimum_signer_identity_hashes_per_label": signer_minima,
                "maximum_single_signer_fraction_per_label_split": round(top_signer_max_fraction, 4),
            },
        },
        {
            "gate_id": "tensor_contract_complete",
            "status": gate_status(tensor_passed),
            "required": {
                "tensor_hash_matches_equal_clip_count": True,
                "tensor_shape": "16x5x96x96x3",
                "dtype": "uint8",
                "region_order": expected_region_order,
            },
            "observed": {
                split: {
                    "clip_count": summary.get("clip_count"),
                    "tensor_hash_match_count": summary.get("tensor_hash_match_count"),
                    "tensor_shape_counts": summary.get("tensor_shape_counts"),
                    "tensor_dtype_counts": summary.get("tensor_dtype_counts"),
                    "region_order_counts": summary.get("region_order_counts"),
                    "tensor_failures": summary.get("tensor_failures"),
                }
                for split, summary in split_distribution.items()
            },
        },
        {
            "gate_id": "source_clip_label_review_carried",
            "status": gate_status(source_review_passed),
            "required": {
                "all_manifest_clips_allowed_for_model_training": True,
                "all_manifest_clip_label_review_statuses": ["approved"],
                "active_module_external_review_claimed": False,
            },
            "observed": {
                "manifest_clip_source_reviews": source_reviews,
                "active_module_external_review": inputs["active_module_vocabulary_review"].get("external_review"),
            },
            "interpretation": (
                "Clip-level source label review is carried, but external ASL educator review for the active "
                "module is still pending and cannot be claimed from this contract."
            ),
        },
    ]


def per_label_contract(inputs: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    m3cl = inputs["m3cl"]
    split_distribution = m3cl.get("split_distribution", {})
    risk_rows = {
        row.get("label_id"): row
        for row in m3cl.get("label_risk_table", [])
        if isinstance(row, dict)
    }
    rows = []
    for label in LABELS:
        risk = risk_rows.get(label, {})
        priority = "normal"
        review_required = False
        stop_conditions = []
        if label == "pen":
            priority = "highest"
            review_required = True
            stop_conditions.extend(
                [
                    "Stop before local rerun/Brev/export if pen remains the single predicted class while non-pen recall is zero.",
                    "Stop before local rerun/Brev/export if pen recall remains near historical 0.04 on held-out evaluation.",
                    "Review pen source clips and annotations because it moved from historical under-recognition to M3CJ collapse target.",
                ]
            )
        elif label == "thank_you":
            priority = "high"
            review_required = True
            stop_conditions.extend(
                [
                    "Stop before local rerun/Brev/export if thank_you again absorbs more than 0.4 of held-out predictions.",
                    "Review thank_you source slug normalization because manifests use source slug thankyou for label thank_you.",
                    "Carry the M3BW overprediction risk even though the M3CA thank_you stop condition was cleared.",
                ]
            )
        else:
            stop_conditions.append(
                "Stop before local rerun/Brev/export if this label has zero recall under any repeated single-class collapse."
            )
        rows.append(
            {
                "label_id": label,
                "priority": priority,
                "source_sign_slug_counts_by_split": label_slug_counts(split_distribution, label),
                "split_clip_counts": risk.get("split_clip_counts"),
                "split_signer_identity_hash_counts": risk.get("split_signer_identity_hash_counts"),
                "top_signer_fraction_by_split": top_signer_fraction(split_distribution, label),
                "m3bx_risk_flags": risk.get("m3bx_risk_flags", []),
                "m3ca_stop_condition": risk.get("m3ca_stop_condition"),
                "m3cj_train_all_lr003_recall": risk.get("m3cj_train_all_lr003_recall"),
                "m3cj_train_all_lr003_predicted_single_class": risk.get(
                    "m3cj_train_all_lr003_predicted_single_class"
                ),
                "m3ck_tiny_trainfit_recall": risk.get("m3ck_tiny_trainfit_recall"),
                "label_quality_review_required_before_more_training": review_required,
                "contract_stop_conditions": stop_conditions,
                "current_assessment": risk.get("current_assessment"),
            }
        )
    return rows


def collapsed_class_stop_conditions(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    lr003 = train_all_lr003(inputs["m3cj"])
    return {
        "source_evidence": {
            "m3cj_train_all_lr003": {
                "test_top1_accuracy": lr003.get("test_top1_accuracy"),
                "test_macro_f1": lr003.get("test_macro_f1"),
                "predicted_single_class": lr003.get("predicted_single_class"),
                "per_class_recall": lr003.get("per_class_recall"),
                "passes_targets": lr003.get("passes_targets"),
            },
            "m3ck_tiny_trainfit_final_accuracy": inputs["m3ck"]
            .get("diagnostic", {})
            .get("train_fit_metrics", {})
            .get("final_accuracy"),
        },
        "stop_if_any_future_train_all": [
            {
                "condition": "test_top1_accuracy_lte_chance_and_macro_f1_lte_m3cj",
                "threshold": {"test_top1_accuracy_lte": 0.2, "test_macro_f1_lte": 0.06666666666666668},
                "required_action": "stop_for_label_source_quality_review_before_brev_or_export",
            },
            {
                "condition": "single_class_prediction_collapse",
                "threshold": {"predicted_single_class_present": True, "non_collapsed_label_recall_equals": 0.0},
                "required_action": "stop_for_label_source_quality_review_before_brev_or_export",
            },
            {
                "condition": "pen_collapse_repeats",
                "threshold": {"predicted_single_class": "pen", "home_morning_thank_you_who_recall_equals": 0.0},
                "required_action": "review_pen_and_non_pen_source_label_quality_before_more_training",
            },
            {
                "condition": "thank_you_absorption_repeats",
                "threshold": {"thank_you_prediction_fraction_gte": 0.4},
                "required_action": "review_thank_you_source_label_quality_before_more_training",
            },
        ],
    }


def future_training_contract(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    manifest_contract = inputs["manifest_contract"]
    m3cl_decision = inputs["m3cl"].get("decision", {})
    return {
        "bounded_local_train_all_justified_now": False,
        "brev_compute_receipt_justified_now": False,
        "label_quality_review_packet_justified_now": True,
        "reason": (
            "Current evidence clears label counts, tensor coverage, leakage, and tiny train-fit connectivity, but "
            "the only train-all evidence still collapses to pen at chance accuracy. The next useful slice is a "
            "no-mutation label/source-quality review packet, not another fitting run or Brev compute plan."
        ),
        "future_local_train_all_must_prove": {
            "same_manifest_package": manifest_contract.get("package_id"),
            "same_required_input_contract": manifest_contract.get("required_input_contract"),
            "same_architecture_lane": "scratch_region_temporal_late_fusion_tcn_contract_v1",
            "must_improve_over_m3cj": {
                "test_top1_accuracy_gt": 0.2,
                "test_macro_f1_gt": 0.06666666666666668,
                "prediction_distribution_not_single_class": True,
                "no_zero_recall_selected_labels": True,
                "validation_accuracy_not_flat_chance": True,
            },
            "must_preserve": [
                "approved PopSign source lane",
                "train/validation/test source split boundaries",
                "strict cross-split clip/source-record/signer/tensor disjointness",
                "rgb_regions_grid_v1 region-axis input",
                "random initialization with no pretrained CV/sign/landmark/model dependency",
                "fail-closed browser/model-card/final-claim state",
            ],
        },
        "evidence_for_label_quality_review_instead_of_more_training": {
            "m3cl_remaining_failure_more_likely_split_source_signer_distribution": m3cl_decision.get(
                "remaining_failure_more_likely_split_source_signer_distribution"
            ),
            "m3cl_remaining_failure_more_likely_per_label_quality": m3cl_decision.get(
                "remaining_failure_more_likely_per_label_quality"
            ),
            "m3cl_bounded_local_train_all_justified_now": m3cl_decision.get(
                "bounded_local_train_all_justified_now"
            ),
            "m3ck_tiny_trainfit_passed": inputs["m3ck"]
            .get("decision", {})
            .get("m3ce_architecture_can_train_fit_balanced_tiny_subset"),
            "m3cj_train_all_lr003": train_all_lr003(inputs["m3cj"]),
        },
        "human_decision_triggers": [
            "Any label-quality review that finds ambiguous ASL correctness, regional-variant mismatch, or source-label mismatch.",
            "Any source/register approval expansion, source import, label-set expansion, or annotation rewrite.",
            "Any Brev command, paid compute, remote lifecycle change, or max-spend change.",
            "Any export, browser activation, model-card promotion, final gate change, or ASL correctness claim.",
        ],
    }


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    inputs = load_inputs()
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CM - PopSign fresh5 split/source quality contract",
        "status": "completed_no_training_no_mutation_split_source_quality_contract",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/build_popsign_fresh5_split_source_quality_contract.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
        },
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "input_artifacts": artifact_references(),
        "scope": {
            "local_only": True,
            "existing_evidence_only": True,
            "no_training_or_fitting": True,
            "no_optimizer_or_backward_pass": True,
            "no_checkpoint_creation": True,
            "no_brev_command": True,
            "no_brev_spend": True,
            "no_brev_worker_lifecycle_change": True,
            "no_remote_command": True,
            "no_source_register_mutation": True,
            "no_source_import_or_media_download": True,
            "no_manifest_mutation": True,
            "no_tensor_mutation": True,
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "split_source_signer_quality_contract_gates": split_source_gates(inputs),
        "per_label_source_quality_contract": per_label_contract(inputs),
        "collapsed_class_stop_conditions": collapsed_class_stop_conditions(inputs),
        "future_training_or_compute_contract": future_training_contract(inputs),
        "decision": {
            "contract_complete": True,
            "bounded_local_train_all_justified_now": False,
            "training_compute_receipt_justified_now": False,
            "brev_compute_receipt_justified_now": False,
            "label_quality_review_packet_justified_now": True,
            "human_scope_budget_source_decision_required_now": False,
            "exactly_one_next_action": "continue_label_quality_review_packet_no_mutation",
            "next_action_rationale": (
                "The contract clears split/source/signer/tensor gates but preserves pen and thank_you as "
                "priority source-quality risks after M3CJ collapse. A no-mutation label-quality review packet is "
                "the smallest next action before any local train-all rerun or Brev compute receipt."
            ),
        },
        "guardrails": {
            "training_run": False,
            "tiny_overfit_rerun": False,
            "fitting": False,
            "optimizer_step": False,
            "backward_pass": False,
            "checkpoint_created": False,
            "brev_command_run": False,
            "brev_spend": False,
            "brev_worker_lifecycle_changed": False,
            "remote_command": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "pretrained_components": [],
            "export": False,
            "browser_activation": False,
            "model_card_promotion": False,
            "final_gate_change": False,
            "unsupported_claim": False,
            "push": False,
        },
        "validation_commands": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_popsign_fresh5_split_source_quality_contract.py",
            ".venv/bin/python scripts/build_popsign_fresh5_split_source_quality_contract.py --receipt docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json >/dev/null",
            "git diff --check",
        ],
        "tracked_files_changed": [
            "scripts/build_popsign_fresh5_split_source_quality_contract.py",
            "docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json",
            "docs/session-logs/412-mission-3cm-popsign-fresh5-split-source-quality-contract.md",
        ],
        "exactly_one_next_action": "continue_label_quality_review_packet_no_mutation",
    }


def main() -> int:
    args = parse_args()
    try:
        receipt = validate_args(args)
        receipt_body = build_receipt(args)
        if args.write_receipt:
            write_json(receipt, receipt_body)
        result = {
            "status": receipt_body["status"],
            "receipt": project_relative(receipt),
            "bounded_local_train_all_justified_now": receipt_body["decision"][
                "bounded_local_train_all_justified_now"
            ],
            "brev_compute_receipt_justified_now": receipt_body["decision"]["brev_compute_receipt_justified_now"],
            "next_action": receipt_body["exactly_one_next_action"],
        }
    except ContractError as error:
        print(f"M3CM split/source quality contract failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
