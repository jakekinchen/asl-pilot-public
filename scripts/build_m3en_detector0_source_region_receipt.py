#!/usr/bin/env python3
"""Build the M3EN Detector 0/source-region evidence receipt from existing artifacts."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = Path("docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json")
SESSION_LOG_PATH = Path("docs/session-logs/525-mission-3en-detector0-source-region-receipts.md")
SCHEMA_VERSION = "asl-pilot-return-to-form-m3en-detector0-source-region-receipts/v1"


ARTIFACTS = {
    "goal": Path("GOAL.md"),
    "active_prompt": Path("docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md"),
    "return_to_form_plan": Path("docs/model/return-to-form-plan.md"),
    "dataset_source_register": Path("docs/model/dataset-source-register.json"),
    "m3ek_receipt": Path("docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json"),
    "m3el_receipt": Path("docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json"),
    "m3em_receipt": Path("docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json"),
    "detector0_objectness_repair": Path("docs/validation/return-to-form-detector0-objectness-repair-v1.json"),
    "detector0_packet_support": Path("docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json"),
    "detector0_class_invariant": Path("docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json"),
    "detector0_fixed_geometric_fallback": Path("docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json"),
    "fixed_geometric_claim_reduction": Path("docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json"),
    "materialized_region_followup": Path(
        "docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json"
    ),
    "materialized_region_model_input_diagnostic": Path(
        "docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json"
    ),
    "model_card": Path("web/public/model/model-card.json"),
    "active_vocabulary_claim": Path("docs/model/active-vocabulary-claim.json"),
    "high_signal_train_manifest": Path("data/manifests/lesson/high-signal-region-grid/train.json"),
    "high_signal_validation_manifest": Path("data/manifests/lesson/high-signal-region-grid/validation.json"),
    "high_signal_test_manifest": Path("data/manifests/lesson/high-signal-region-grid/test.json"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=RECEIPT_PATH)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise RuntimeError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise RuntimeError(f"path does not exist: {path}")
    return resolved


def rel(path: Path, *, must_exist: bool = True) -> str:
    return project_path(path, must_exist=must_exist).relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with project_path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    with project_path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def file_ref(path: Path) -> dict[str, str]:
    return {"path": rel(path), "sha256": sha256_file(path)}


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    if isinstance(value, set):
        return sorted(json_ready(item) for item in value)
    if isinstance(value, Path):
        return rel(value)
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    resolved = project_path(path, must_exist=False)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(json.dumps(json_ready(value), indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_by_id(register: dict[str, Any], source_id: str) -> dict[str, Any]:
    for source in register.get("sources", []):
        if source.get("source_id") == source_id:
            return {
                "source_id": source.get("source_id"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "license_review_status": source.get("license_review_status"),
                "decision_id": source.get("decision_id"),
            }
    return {"source_id": source_id, "found": False}


def manifest_label_summary(manifest_path: Path) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    rows = [clip for clip in manifest.get("clips", []) if clip.get("label_id") in {"table", "hello"}]
    by_label: dict[str, dict[str, Any]] = {}
    for clip in rows:
        label = str(clip.get("label_id"))
        bucket = by_label.setdefault(
            label,
            {
                "clip_count": 0,
                "signer_identity_hashes": set(),
                "all_allowed_for_model_training": True,
                "source_ids": set(),
                "input_contract": manifest.get("region_grid_materialization", {}).get("input_contract"),
            },
        )
        bucket["clip_count"] += 1
        if clip.get("signer_identity_hash"):
            bucket["signer_identity_hashes"].add(clip.get("signer_identity_hash"))
        bucket["all_allowed_for_model_training"] = (
            bucket["all_allowed_for_model_training"] and clip.get("allowed_for_model_training") is True
        )
        if clip.get("source_id"):
            bucket["source_ids"].add(clip.get("source_id"))
    return {
        "path": rel(manifest_path),
        "sha256": sha256_file(manifest_path),
        "split": manifest.get("split"),
        "source_register": manifest.get("source_register"),
        "region_grid_materialization": manifest.get("region_grid_materialization"),
        "table_hello": {
            label: {
                "clip_count": item["clip_count"],
                "signer_count": len(item["signer_identity_hashes"]),
                "all_allowed_for_model_training": item["all_allowed_for_model_training"],
                "source_ids": sorted(item["source_ids"]),
                "input_contract": item["input_contract"],
            }
            for label, item in sorted(by_label.items())
        },
    }


def build_receipt() -> dict[str, Any]:
    data = {name: read_json(path) for name, path in ARTIFACTS.items() if path.suffix == ".json"}
    m3em = data["m3em_receipt"]
    m3el = data["m3el_receipt"]
    m3ek = data["m3ek_receipt"]
    objectness = data["detector0_objectness_repair"]
    support = data["detector0_packet_support"]
    class_invariant = data["detector0_class_invariant"]
    fixed_fallback = data["detector0_fixed_geometric_fallback"]
    claim_reduction = data["fixed_geometric_claim_reduction"]
    materialized_followup = data["materialized_region_followup"]
    model_input = data["materialized_region_model_input_diagnostic"]
    register = data["dataset_source_register"]
    model_card = data["model_card"]
    active_vocabulary = data["active_vocabulary_claim"]

    m3em_heldout = m3em["probe"]["final_heldout_metrics"]
    m3em_train = m3em["probe"]["final_train_metrics"]
    support_outcome = support["outcome"]
    next_action = "stop_for_human_detector0_annotation_budget"
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "M3EN - Detector 0 source-region receipts",
        "status": "completed_read_only_evidence_packet",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "active_prompt": rel(ARTIFACTS["active_prompt"]),
        "generated_by": {
            "tool": rel(Path(__file__)),
            "command": [sys.executable, *sys.argv],
        },
        "commands_run": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json >/dev/null",
            "python3 -m json.tool web/public/model/model-card.json >/dev/null",
            "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
            "brev ls --json",
            "jq receipt and manifest summary inspections recorded in session log 525",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_m3en_detector0_source_region_receipt.py",
            ".venv/bin/python scripts/build_m3en_detector0_source_region_receipt.py --write-receipt",
        ],
        "commands_intentionally_not_run": [
            "No Brev lifecycle, sync, SSH, exec, stop, delete, reset, or remote compute command.",
            "No recognizer training, fitting, evaluation rerun, sweep, or optimizer step.",
            "No Detector 0 training or packet-row mutation.",
            "No source import, media download, manifest/tensor/vocabulary mutation, export, model-card promotion, active-label promotion, browser activation, or product runtime change.",
        ],
        "files_inspected": {name: file_ref(path) for name, path in ARTIFACTS.items()},
        "state_checks": {
            "goal_points_at_m3en": True,
            "required_audits_passed": True,
            "required_json_validations_passed": True,
            "brev_ls_read_only": {
                "workspace": "asl-pilot-m3eh-l40s-001",
                "status": "STOPPED",
                "shell_status": "NOT READY",
                "health_status": "HEALTHY",
                "spend_or_lifecycle_action": False,
            },
            "claim_surfaces_fail_closed": model_card.get("status") == "not_trained"
            and active_vocabulary.get("activeLabels") == [],
        },
        "m3ek_m3el_m3em_tiny_proof_summary": {
            "m3ek_selection": {
                "selected_tiny2_labels": m3ek["selected_label_set"]["selected_tiny2_labels"],
                "reserve_tiny3_extension": m3ek["selected_label_set"]["reserve_tiny3_extension"],
                "source_id": m3ek["selected_label_set"]["source_id"],
                "manifest_family": m3ek["selected_label_set"]["manifest_family"],
                "input_contract": m3ek["selected_label_set"]["input_contract"],
                "broad_fresh5_rejected": True,
            },
            "m3el_capacity_only": {
                "real_label_accuracy": m3el["real_label_one_batch"]["final_metrics"]["accuracy"],
                "shuffle_control_accuracy": m3el["label_shuffle_control"]["final_metrics"]["accuracy"],
                "interpretation": "same-batch memorization capacity only, not held-out signal",
            },
            "m3em_failure": {
                "train_accuracy": m3em_train["accuracy"],
                "train_loss": m3em_train["loss"],
                "heldout_accuracy": m3em_heldout["accuracy"],
                "heldout_macro_recall": m3em_heldout["macro_recall"],
                "heldout_macro_f1": m3em_heldout["macro_f1"],
                "heldout_prediction_counts": m3em_heldout["prediction_counts"],
                "heldout_zero_recall_labels": m3em_heldout["zero_recall_labels"],
                "heldout_dominant_predicted_class_fraction": m3em_heldout[
                    "dominant_predicted_class_fraction"
                ],
                "chance_baseline": m3em["chance_baseline_comparison"]["chance_accuracy"],
                "official_validation_split_heldout": True,
                "train_heldout_signer_identity_hash_overlap": m3em["batch"]["signer_summary"][
                    "train_heldout_signer_identity_hash_overlap"
                ],
                "open_set_threshold_probe_justified": False,
                "what_it_says": (
                    "Tiny2 command mechanics and memorization capacity are present, but current region-grid "
                    "representation did not produce non-collapsed held-out table/hello signal."
                ),
                "what_it_does_not_say": (
                    "It does not prove ASL correctness, product readiness, Detector 0 target support, or Brev authorization."
                ),
            },
        },
        "detector0_support_summary": {
            "objectness_packet_label_confounding": {
                "classification": objectness["outcome"]["classification"],
                "target_presence_equivalent_to_label_id_table": objectness["packet_and_split_evidence"][
                    "objectness_support_diagnostics"
                ]["target_presence_equivalent_to_label_id_table"],
                "global_counts_by_label": objectness["packet_and_split_evidence"][
                    "objectness_support_diagnostics"
                ]["global_counts_by_label"],
                "labels_with_present_absent_contrast": objectness["packet_and_split_evidence"][
                    "objectness_support_diagnostics"
                ]["global_labels_with_both_present_and_absent"],
            },
            "packet_support": {
                "classification": support_outcome["classification"],
                "candidate_clips_exist": support["candidate_rows_vs_objectness_support"]["candidate_clips_exist"],
                "candidate_rows_are_not_training_support_yet": support["candidate_rows_vs_objectness_support"][
                    "candidate_rows_are_not_training_support_yet"
                ],
                "objectness_training_supportable_now": support_outcome["objectness_training_supportable_now"],
                "requires_human_annotation_or_scope_approval": support_outcome[
                    "requires_human_annotation_or_scope_approval"
                ],
                "would_require_packet_row_mutation": support["no_source_local_packet_mutation_assessment"][
                    "would_require_packet_row_mutation"
                ],
                "target_support_global": support["target_support_global"],
            },
            "class_invariant_probe": {
                "classification": class_invariant["outcome"]["classification"],
                "all_primary_targets_all_present": class_invariant["outcome"].get("all_primary_targets_all_present"),
                "dynamic_spatial_candidates": class_invariant["outcome"].get("dynamic_spatial_candidates"),
                "target_cell_only_candidates": class_invariant["outcome"].get("target_cell_only_candidates"),
                "reason": class_invariant["outcome"].get("reason"),
            },
            "supportable_now": False,
            "blocked_by": "annotation_target_scope_not_command_mechanics",
        },
        "source_register_and_manifest_posture": {
            "sources": {
                "asl_citizen": source_by_id(register, "asl-citizen-school-assignment-raw-videos"),
                "popsign": source_by_id(register, "popsign-v1-original-videos"),
            },
            "table_hello_region_grid_manifests": {
                "train": manifest_label_summary(ARTIFACTS["high_signal_train_manifest"]),
                "validation": manifest_label_summary(ARTIFACTS["high_signal_validation_manifest"]),
                "test": manifest_label_summary(ARTIFACTS["high_signal_test_manifest"]),
            },
            "supports_another_no_source_local_review": True,
            "supports_detector0_target_schema_now": False,
            "source_or_media_import_needed_for_this_packet": False,
        },
        "region_crop_claim_boundaries": {
            "fixed_geometric_fallback": {
                "classification": fixed_fallback["outcome"]["classification"],
                "upper_body_train_median_heldout_ok": fixed_fallback["outcome"].get(
                    "upper_body_train_median_heldout_ok"
                ),
                "head_train_median_heldout_ok": fixed_fallback["outcome"].get("head_train_median_heldout_ok"),
                "primary_roi_policy": fixed_fallback["recommended_fallback_policy"]["primary_roi"],
                "hand_roi_policy": fixed_fallback["recommended_fallback_policy"]["hand_roi"],
                "separation_from_detector0": fixed_fallback["recommended_fallback_policy"][
                    "separation_from_detector0"
                ],
            },
            "claim_reduction": {
                "classification": claim_reduction["outcome"]["classification"],
                "exact_m3eb_primary_roi_disallowed_claims": claim_reduction["claim_reduction"][
                    "exact_m3eb_primary_roi"
                ]["disallowed_claims"],
                "materialized_upper_body_allowed_claims": claim_reduction["claim_reduction"][
                    "materialized_upper_body_signing_space"
                ]["allowed_claims"],
                "materialized_upper_body_disallowed_claims": claim_reduction["claim_reduction"][
                    "materialized_upper_body_signing_space"
                ]["disallowed_claims"],
            },
            "materialized_regions": {
                "classification": materialized_followup["outcome"]["classification"],
                "tensor_file_count": materialized_followup["materialized_region_behavior"]["tensor_file_count"],
                "regions_checked": materialized_followup["materialized_region_behavior"]["regions_checked"],
                "upper_body_table_union_contact_full_containment_rate": materialized_followup[
                    "materialized_region_behavior"
                ]["materialized_upper_body_vs_reduced_exact_roi"][
                    "materialized_upper_body_table_union_contact_full_containment_rate"
                ],
                "exact_m3eb_table_union_contact_full_containment_rate": materialized_followup[
                    "materialized_region_behavior"
                ]["materialized_upper_body_vs_reduced_exact_roi"][
                    "exact_m3eb_primary_roi_table_union_contact_full_containment_rate"
                ],
            },
            "model_input_diagnostic": {
                "classification": model_input["outcome"]["classification"],
                "candidate_train_sanity_passed": model_input["baseline_comparison"][
                    "candidate_train_sanity_passed"
                ],
                "baseline_train_sanity_passed": model_input["baseline_comparison"]["baseline_train_sanity_passed"],
                "candidate_validation_top1": model_input["baseline_comparison"]["candidate_validation_top1"],
                "baseline_validation_top1": model_input["baseline_comparison"]["baseline_validation_top1"],
                "candidate_test_top1": model_input["baseline_comparison"]["candidate_test_top1"],
                "baseline_test_top1": model_input["baseline_comparison"]["baseline_test_top1"],
                "reason": model_input["outcome"]["reason"],
            },
            "fixed_materialized_region_authority": "diagnostic_accounting_only_not_runtime_detector_or_product_authority",
        },
        "m3em_to_detector0_routing": {
            "table_collapse_lines_up_with": [
                "Tiny2 train mechanics worked, so the failure is not a simple command/dataloader inability to fit train data.",
                "Held-out table had zero recall under the current region-grid representation.",
                "Existing Detector 0 packet evidence is table-confounded and cannot supply class-invariant objectness support now.",
                "Fixed/materialized regions are diagnostic accounting evidence only and did not yield enough model-input signal to justify another training-style retry.",
            ],
            "does_not_line_up_with": [
                "No evidence that a threshold/open-set probe on the collapsed Tiny2 recognizer is useful.",
                "No evidence that the current Detector 0 packet can be trained or promoted as a supportable target schema.",
                "No evidence authorizing source import, packet mutation, Brev, export, browser activation, or final claims.",
            ],
            "routing_decision": (
                "Candidate source/region evidence exists, but the current Detector 0 target schema is not supportable "
                "without human annotation/scope approval; command mechanics are not the primary blocker."
            ),
        },
        "claim_surfaces": {
            "model_card": {
                "path": rel(ARTIFACTS["model_card"]),
                "sha256": sha256_file(ARTIFACTS["model_card"]),
                "status": model_card.get("status"),
            },
            "active_vocabulary_claim": {
                "path": rel(ARTIFACTS["active_vocabulary_claim"]),
                "sha256": sha256_file(ARTIFACTS["active_vocabulary_claim"]),
                "active_labels": active_vocabulary.get("activeLabels"),
            },
            "browser_recognition_remains_inactive": True,
            "claim_surfaces_mutated": False,
        },
        "negative_authorizations": {
            "brev_spend_or_lifecycle": False,
            "recognizer_training_fitting_or_evaluation_rerun": False,
            "detector0_training": False,
            "source_import_or_media_download": False,
            "source_register_manifest_tensor_vocabulary_packet_mutation": False,
            "label_expansion": False,
            "generated_labels_or_pseudo_labels": False,
            "pretrained_dependency": False,
            "checkpoint_or_model_artifact": False,
            "onnx_export": False,
            "browser_activation": False,
            "product_runtime_change": False,
            "model_card_promotion": False,
            "active_label_promotion": False,
            "asl_correctness_claim": False,
            "final_readiness_claim": False,
            "raw_learner_video_upload": False,
            "push": False,
            "amend_or_no_verify": False,
        },
        "changed_files": [
            rel(Path(__file__)),
            rel(RECEIPT_PATH, must_exist=False),
            rel(SESSION_LOG_PATH, must_exist=False),
        ],
        "next_action": next_action,
        "next_action_reason": (
            "Existing candidate source/region evidence can support review, but the current Detector 0 packet target "
            "schema remains table-confounded and not supportable without packet-row annotation/scope approval."
        ),
    }


def main() -> int:
    args = parse_args()
    receipt_path = project_path(args.receipt, must_exist=False)
    if receipt_path != project_path(RECEIPT_PATH, must_exist=False):
        print(f"M3EN receipt path must be {RECEIPT_PATH.as_posix()}", file=sys.stderr)
        return 2
    try:
        receipt = build_receipt()
    except Exception as error:
        print(f"M3EN receipt build failed: {error}", file=sys.stderr)
        return 2
    if args.write_receipt:
        write_json(RECEIPT_PATH, receipt)
    summary = {
        "status": receipt["status"],
        "next_action": receipt["next_action"],
        "receipt": rel(RECEIPT_PATH, must_exist=False) if args.write_receipt else None,
        "m3em_heldout_accuracy": receipt["m3ek_m3el_m3em_tiny_proof_summary"]["m3em_failure"][
            "heldout_accuracy"
        ],
        "detector0_supportable_now": receipt["detector0_support_summary"]["supportable_now"],
        "claim_surfaces_fail_closed": receipt["state_checks"]["claim_surfaces_fail_closed"],
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
