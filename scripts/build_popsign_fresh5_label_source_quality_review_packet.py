#!/usr/bin/env python3
"""Build the PopSign fresh5 label/source quality review packet receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-label-source-quality-review-packet/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json")
ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-label-source-quality-review-packet-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
ACTIVE_MODULE_VOCABULARY_REVIEW = Path("data/active-module/active-module-vocabulary-review.json")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
M3BX_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")
M3CA_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
M3CL_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json")
M3CM_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json")
LABELS = ["home", "morning", "pen", "thank_you", "who"]
PRIORITY = {"pen": "highest", "thank_you": "high"}


class PacketError(RuntimeError):
    """Raised when the no-training packet cannot be built."""


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
        raise PacketError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise PacketError(f"{context} does not exist: {path}")
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


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/build_popsign_fresh5_label_source_quality_review_packet.py",
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--write-receipt",
    ]


def validate_args(args: argparse.Namespace) -> Path:
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    if receipt != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise PacketError(f"M3CN requires {DEFAULT_RECEIPT.as_posix()}, got {project_relative(receipt)}")
    if not args.write_receipt:
        raise PacketError("M3CN requires --write-receipt")
    return receipt


def load_inputs() -> dict[str, dict[str, Any]]:
    return {
        "source_register": load_json(SOURCE_REGISTER),
        "active_module_vocabulary_review": load_json(ACTIVE_MODULE_VOCABULARY_REVIEW),
        "manifest_contract": load_json(MANIFEST_CONTRACT),
        "train_manifest": load_json(TRAIN_MANIFEST),
        "validation_manifest": load_json(VALIDATION_MANIFEST),
        "test_manifest": load_json(TEST_MANIFEST),
        "m3bx": load_json(M3BX_RECEIPT),
        "m3ca": load_json(M3CA_RECEIPT),
        "m3cj": load_json(M3CJ_RECEIPT),
        "m3ck": load_json(M3CK_RECEIPT),
        "m3cl": load_json(M3CL_RECEIPT),
        "m3cm": load_json(M3CM_RECEIPT),
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
        "m3ca_learnability_isolation_probe": file_reference(M3CA_RECEIPT),
        "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
        "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
        "m3cl_data_split_label_distribution_audit": file_reference(M3CL_RECEIPT),
        "m3cm_split_source_quality_contract": file_reference(M3CM_RECEIPT),
    }


def manifest_review_summary(manifest: dict[str, Any], label: str) -> dict[str, Any]:
    clips = manifest.get("clips", [])
    if not isinstance(clips, list):
        raise PacketError("manifest clips must be a list")
    label_clips = [clip for clip in clips if isinstance(clip, dict) and clip.get("label_id") == label]
    review_statuses = sorted(
        {
            str((clip.get("review") if isinstance(clip.get("review"), dict) else {}).get("label_review_status", ""))
            for clip in label_clips
        }
    )
    source_slugs = sorted({str(clip.get("source_sign_slug", "")) for clip in label_clips})
    source_categories = sorted({str(clip.get("source_category", "")) for clip in label_clips})
    source_splits = sorted({str(clip.get("source_split", "")) for clip in label_clips})
    allowed_values = sorted({bool(clip.get("allowed_for_model_training")) for clip in label_clips})
    return {
        "clip_count": len(label_clips),
        "source_sign_slugs": source_slugs,
        "source_categories": source_categories,
        "source_splits": source_splits,
        "label_review_statuses": review_statuses,
        "all_label_reviews_approved": review_statuses == ["approved"],
        "all_allowed_for_model_training": allowed_values == [True],
    }


def train_all_lr003(m3cj: dict[str, Any]) -> dict[str, Any]:
    for run in m3cj.get("runs", []):
        if isinstance(run, dict) and run.get("name") == "train_all_lr003":
            evaluation = run.get("evaluation", {})
            return evaluation if isinstance(evaluation, dict) else {}
    return {}


def risk_table(m3bx: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row.get("label_id")): row
        for row in m3bx.get("current_label_risk_table", [])
        if isinstance(row, dict)
    }


def m3cm_rows(m3cm: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row.get("label_id")): row
        for row in m3cm.get("per_label_source_quality_contract", [])
        if isinstance(row, dict)
    }


def source_label_alignment_status(label: str, row: dict[str, Any], manifest_reviews: dict[str, Any]) -> dict[str, Any]:
    expected_slugs = {"thank_you": ["thankyou"]}.get(label, [label])
    slug_counts = row.get("source_sign_slug_counts_by_split", {})
    observed_slugs = sorted(
        {
            slug
            for split_counts in slug_counts.values()
            if isinstance(split_counts, dict)
            for slug in split_counts.keys()
        }
    )
    slugs_align = observed_slugs == expected_slugs
    reviews_approved = all(
        review["all_label_reviews_approved"] and review["all_allowed_for_model_training"]
        for review in manifest_reviews.values()
    )
    return {
        "expected_source_sign_slugs": expected_slugs,
        "observed_source_sign_slugs": observed_slugs,
        "source_slug_alignment": "passed" if slugs_align else "failed",
        "manifest_clip_review_alignment": "passed" if reviews_approved else "failed",
        "mechanical_source_label_ambiguity": not (slugs_align and reviews_approved),
        "external_asl_correctness_cleared": False,
        "external_asl_correctness_limit": (
            "Repo evidence can clear source-slug and manifest-review alignment, but it cannot claim external ASL "
            "educator correctness or regional-variant review."
        ),
    }


def label_interpretation(label: str, m3cm_row: dict[str, Any]) -> dict[str, Any]:
    if label == "pen":
        return {
            "review_priority": "highest",
            "label_source_finding": (
                "No mechanical source-label mismatch is visible: source slug is pen in all splits and clip-level "
                "source label review is approved. The risk is not cleared for ASL correctness because no external "
                "ASL educator review is claimed."
            ),
            "collapse_interpretation": (
                "The M3CJ pen collapse is more consistent with training distribution behavior or unresolved "
                "per-label tensor/input quality than with a source-slug mismatch: M3CL/M3CM support is balanced "
                "and disjoint, while M3CK tiny train-fit can learn pen."
            ),
            "blocks_bounded_local_train_all_now": True,
            "needs_human_decision_now": False,
        }
    if label == "thank_you":
        return {
            "review_priority": "high",
            "label_source_finding": (
                "The thank_you label consistently maps to the PopSign source slug thankyou; this is a known "
                "normalization, not a mixed-label source path in current manifests. Historical overprediction was "
                "cleared in M3CA, but M3CJ gives thank_you zero recall under pen collapse."
            ),
            "collapse_interpretation": (
                "Current thank_you behavior is dominated by the train-all collapse to pen, not by renewed "
                "thank_you absorption. Keep thank_you as a guardrail for any future run."
            ),
            "blocks_bounded_local_train_all_now": True,
            "needs_human_decision_now": False,
        }
    return {
        "review_priority": m3cm_row.get("priority", "normal"),
        "label_source_finding": (
            "Source slug and clip-level review alignment are mechanically clean in the repaired manifests, but "
            "external ASL educator correctness is not claimed."
        ),
        "collapse_interpretation": (
            "This label has zero recall only under the M3CJ single-class pen collapse; current evidence does not "
            "make it a standalone source-label blocker."
        ),
        "blocks_bounded_local_train_all_now": False,
        "needs_human_decision_now": False,
    }


def per_label_rows(inputs: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    m3bx = risk_table(inputs["m3bx"])
    m3cm = m3cm_rows(inputs["m3cm"])
    rows = []
    for label in LABELS:
        m3cm_row = m3cm[label]
        manifest_reviews = {
            "train": manifest_review_summary(inputs["train_manifest"], label),
            "validation": manifest_review_summary(inputs["validation_manifest"], label),
            "test": manifest_review_summary(inputs["test_manifest"], label),
        }
        interpretation = label_interpretation(label, m3cm_row)
        rows.append(
            {
                "label_id": label,
                "review_priority": PRIORITY.get(label, "normal"),
                "review_order": 0 if label == "pen" else 1 if label == "thank_you" else 2,
                "split_clip_counts": m3cm_row.get("split_clip_counts"),
                "split_signer_identity_hash_counts": m3cm_row.get("split_signer_identity_hash_counts"),
                "top_signer_fraction_by_split": m3cm_row.get("top_signer_fraction_by_split"),
                "source_sign_slug_counts_by_split": m3cm_row.get("source_sign_slug_counts_by_split"),
                "manifest_review_by_split": manifest_reviews,
                "source_label_alignment": source_label_alignment_status(label, m3cm_row, manifest_reviews),
                "m3bx_risk_flags": m3bx.get(label, {}).get("risk_flags", []),
                "m3bx_test_recall": m3bx.get(label, {}).get("m3bu_test_recall"),
                "m3bx_predicted_label_fraction": m3bx.get(label, {}).get("m3bu_predicted_label_fraction"),
                "m3bx_dominant_wrong_prediction": m3bx.get(label, {}).get("dominant_wrong_prediction"),
                "m3ca_stop_condition": m3cm_row.get("m3ca_stop_condition"),
                "m3cj_train_all_lr003_recall": m3cm_row.get("m3cj_train_all_lr003_recall"),
                "m3cj_train_all_lr003_predicted_single_class": m3cm_row.get(
                    "m3cj_train_all_lr003_predicted_single_class"
                ),
                "m3ck_tiny_trainfit_recall": m3cm_row.get("m3ck_tiny_trainfit_recall"),
                "m3cm_contract_stop_conditions": m3cm_row.get("contract_stop_conditions"),
                **interpretation,
            }
        )
    return sorted(rows, key=lambda row: (row["review_order"], row["label_id"]))


def source_label_ambiguity_findings(rows: list[dict[str, Any]], inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    mechanical_blockers = [
        row["label_id"]
        for row in rows
        if row["source_label_alignment"]["mechanical_source_label_ambiguity"]
    ]
    external_review = inputs["active_module_vocabulary_review"].get("external_review", {})
    return {
        "mechanical_source_label_ambiguity_labels": mechanical_blockers,
        "mechanical_source_label_ambiguity_cleared_for_current_manifests": not mechanical_blockers,
        "external_asl_educator_review_claimed": bool(external_review.get("completed")),
        "external_asl_educator_review_required_for_source_aligned_pilot": bool(
            external_review.get("required_for_source_aligned_pilot")
        ),
        "can_clear_asl_correctness_without_external_review": False,
        "interpretation": (
            "The current repo evidence clears source-slug, split, signer, tensor, and clip-review alignment for the "
            "source-aligned repaired manifests. It does not clear external ASL correctness, but that pending review "
            "is not a reason by itself to mutate data or spend Brev in M3CN."
        ),
    }


def classification(rows: list[dict[str, Any]], inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    lr003 = train_all_lr003(inputs["m3cj"])
    return {
        "pen_collapse_most_consistent_with": [
            "training_distribution_behavior",
            "unresolved_tensor_or_input_quality",
        ],
        "less_supported_explanations": [
            "label_count_imbalance",
            "source_slug_mismatch",
            "cross_split_leakage",
            "total_architecture_or_loader_connectivity_break",
        ],
        "why": [
            "M3CL/M3CM show balanced label support, clean source slugs, strict split/signer/tensor disjointness, and complete tensor hashes.",
            "M3CK proves the same architecture/input can train-fit a deterministic balanced tiny subset with all five labels.",
            "M3CJ train-all remains flat at chance and collapses to pen, so another blind train-all or Brev run is unjustified.",
            "M3CN did not inspect raw video semantics and cannot claim external ASL correctness.",
        ],
        "m3cj_train_all_lr003": {
            "test_top1_accuracy": lr003.get("test_top1_accuracy"),
            "test_macro_f1": lr003.get("test_macro_f1"),
            "predicted_single_class": lr003.get("predicted_single_class"),
            "per_class_recall": lr003.get("per_class_recall"),
            "passes_targets": lr003.get("passes_targets"),
        },
        "labels_blocking_blind_train_all": [
            row["label_id"] for row in rows if row["blocks_bounded_local_train_all_now"]
        ],
    }


def next_action_contract(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "bounded_local_train_all_justified_now": False,
        "compute_receipt_or_brev_planning_justified_now": False,
        "human_source_label_annotation_scope_or_budget_review_required_now": False,
        "no_training_tensor_or_input_quality_packet_justified_now": True,
        "exact_condition_to_justify_one_bounded_local_train_all_rerun": [
            "M3CN source-label alignment remains clean for all five labels.",
            "A separate no-training tensor/input quality packet finds no per-label tensor corruption, crop/region ordering defect, or pen/thank_you-specific input-quality blocker.",
            "The future local train-all prompt preserves the repaired manifests, approved PopSign source lane, strict split/signer disjointness, rgb_regions_grid_v1 input, random initialization, no-pretrained boundary, and fail-closed browser claim state.",
            "The run must beat M3CJ: test top-1 > 0.2, macro F1 > 0.06666666666666668, prediction distribution not single-class, no zero-recall selected labels, and validation accuracy not flat at chance.",
        ],
        "exact_condition_to_stop_for_human_decision": [
            "Any reviewed label has source slug mismatch, missing clip-level review, conflicting source path, or ambiguous annotation that cannot be resolved from tracked evidence.",
            "Any required next action changes source approvals, source imports, label set, annotations, crop semantics, budget, Brev spend, browser activation, model-card claims, final gates, or ASL correctness claims.",
            "External ASL educator review is needed before making a correctness claim or changing the active label/source scope.",
        ],
        "exactly_one_next_action": "continue_no_training_tensor_or_input_quality_packet_after_label_review",
        "next_action_rationale": (
            "The packet clears mechanical source-label ambiguity for the repaired manifests but does not justify "
            "another train-all run: pen collapse remains unexplained after source gates pass. The next smallest "
            "bounded step is a no-training tensor/input-quality packet before any fitting or compute planning."
        ),
    }


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    inputs = load_inputs()
    rows = per_label_rows(inputs)
    source_findings = source_label_ambiguity_findings(rows, inputs)
    next_contract = next_action_contract(rows)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CN - PopSign fresh5 label/source quality review packet",
        "status": "completed_no_training_no_mutation_label_source_quality_review_packet",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/build_popsign_fresh5_label_source_quality_review_packet.py",
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
        "per_label_source_quality_review_rows": rows,
        "source_label_ambiguity_findings": source_findings,
        "pen_and_thank_you_risk_chain": {
            "pen": next(row for row in rows if row["label_id"] == "pen"),
            "thank_you": next(row for row in rows if row["label_id"] == "thank_you"),
        },
        "collapse_classification": classification(rows, inputs),
        "next_action_contract": next_contract,
        "decision": {
            "bounded_local_train_all_justified_now": next_contract["bounded_local_train_all_justified_now"],
            "training_compute_receipt_justified_now": next_contract["compute_receipt_or_brev_planning_justified_now"],
            "brev_compute_receipt_justified_now": next_contract["compute_receipt_or_brev_planning_justified_now"],
            "human_source_label_annotation_scope_or_budget_review_required_now": next_contract[
                "human_source_label_annotation_scope_or_budget_review_required_now"
            ],
            "no_training_tensor_or_input_quality_packet_justified_now": next_contract[
                "no_training_tensor_or_input_quality_packet_justified_now"
            ],
            "exactly_one_next_action": next_contract["exactly_one_next_action"],
            "next_action_rationale": next_contract["next_action_rationale"],
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
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_popsign_fresh5_label_source_quality_review_packet.py",
            ".venv/bin/python scripts/build_popsign_fresh5_label_source_quality_review_packet.py --receipt docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null",
            "git diff --check",
        ],
        "tracked_files_changed": [
            "scripts/build_popsign_fresh5_label_source_quality_review_packet.py",
            "docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json",
            "docs/session-logs/414-mission-3cn-popsign-fresh5-label-source-quality-review-packet.md",
        ],
        "exactly_one_next_action": next_contract["exactly_one_next_action"],
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
            "human_decision_required_now": receipt_body["decision"][
                "human_source_label_annotation_scope_or_budget_review_required_now"
            ],
            "next_action": receipt_body["exactly_one_next_action"],
        }
    except PacketError as error:
        print(f"M3CN label/source quality packet failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
