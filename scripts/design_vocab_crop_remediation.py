#!/usr/bin/env python3
"""Build the Mission 3AZ no-training vocabulary/crop remediation design receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-remediation-design-v1.json"
SCHEMA_VERSION = "asl-pilot-vocab-crop-remediation-design/v1"
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-separability-diagnosis-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "327-mission-3ay-vocab-crop-separability-diagnosis.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "validation-report.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "prediction-sidecar.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    PROJECT_ROOT / "output" / "m3ax-region-grid-tcn-tiny-overfit" / "selected-subset.json",
    PROJECT_ROOT / "output" / "m3ax-region-grid-tcn-tiny-overfit" / "tiny-overfit-provenance.json",
    PROJECT_ROOT / "artifacts" / "research" / "observer-324-post-m3aw-strategy-api-response.md",
    PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
]


class DesignError(RuntimeError):
    """Raised when the M3AZ design cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-vocab-crop-remediation-design-v1.json"),
        help="Tracked M3AZ receipt path.",
    )
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DesignError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise DesignError(f"{context} missing: {path}")
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
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def drift_failure_count(diagnosis: dict[str, Any]) -> int:
    return sum(
        1
        for rows in diagnosis["descriptive_feature_separation"]["split_centroid_drift"].values()
        for row in rows
        if not row["same_label_closer_than_nearest_other"]
    )


def drift_failure_labels(diagnosis: dict[str, Any]) -> list[str]:
    failures = []
    for split, rows in diagnosis["descriptive_feature_separation"]["split_centroid_drift"].items():
        for row in rows:
            if not row["same_label_closer_than_nearest_other"]:
                failures.append(f"{split}:{row['label_id']}")
    return failures


def extract_design_facts(diagnosis: dict[str, Any]) -> dict[str, Any]:
    validation = diagnosis["prediction_patterns"]["validation"]
    test = diagnosis["prediction_patterns"]["test"]
    overlap = diagnosis["manifest_distribution"]["signer_overlap"]
    return {
        "m3ax_tiny_subset_accuracy": diagnosis["prior_evidence"]["m3ax"]["tiny_subset_accuracy"],
        "m3ax_tiny_subset_zero_recall_labels": diagnosis["prior_evidence"]["m3ax"][
            "tiny_subset_zero_recall_labels"
        ],
        "m3aw_validation_top1": diagnosis["prior_evidence"]["m3aw"]["validation_top1_accuracy"],
        "m3aw_validation_macro_f1": diagnosis["prior_evidence"]["m3aw"]["validation_macro_f1"],
        "m3aw_test_top1": diagnosis["prior_evidence"]["m3aw"]["test_top1_accuracy"],
        "m3aw_test_macro_f1": diagnosis["prior_evidence"]["m3aw"]["test_macro_f1"],
        "validation_prediction_label_coverage": validation["prediction_label_coverage"],
        "test_prediction_label_coverage": test["prediction_label_coverage"],
        "validation_labels_never_predicted": validation["labels_never_predicted"],
        "test_labels_never_predicted": test["labels_never_predicted"],
        "validation_zero_recall_labels": validation["zero_recall_labels"],
        "test_zero_recall_labels": test["zero_recall_labels"],
        "train_validation_signer_overlap": overlap["train_validation_overlap"],
        "train_test_signer_overlap": overlap["train_test_overlap"],
        "descriptive_crop_stat_drift_failure_count": drift_failure_count(diagnosis),
        "descriptive_crop_stat_drift_failures": drift_failure_labels(diagnosis),
    }


def ranked_hypotheses(facts: dict[str, Any]) -> list[dict[str, Any]]:
    never_predicted_both = sorted(
        set(facts["validation_labels_never_predicted"]) & set(facts["test_labels_never_predicted"])
    )
    return [
        {
            "rank": 1,
            "lane": "split_signer_contract",
            "confidence": "high",
            "evidence": [
                "train/validation signer overlap is empty",
                "train/test signer overlap is empty",
                f"held-out prediction label coverage is {facts['validation_prediction_label_coverage']} validation labels "
                f"and {facts['test_prediction_label_coverage']} test labels",
                f"same-label descriptive crop-stat drift loses to another train label in "
                f"{facts['descriptive_crop_stat_drift_failure_count']} split-label rows",
            ],
            "design_implication": (
                "Before any future training, add a split/signer contract that makes the intended generalization target "
                "explicit and gates any training prompt on per-label signer/split support and held-out coverage evidence."
            ),
        },
        {
            "rank": 2,
            "lane": "crop_region_contract",
            "confidence": "medium_high",
            "evidence": [
                f"descriptive crop-stat drift failures: {facts['descriptive_crop_stat_drift_failures']}",
                "M3AX memorization succeeded with the same region-grid path, so crop-region statistics are a likely generalization surface rather than a total input-path break",
            ],
            "design_implication": (
                "A crop-region contract should follow the split/signer contract or be folded into it, requiring explicit "
                "per-region quality thresholds and label-level drift checks before training."
            ),
        },
        {
            "rank": 3,
            "lane": "vocab_subset_contract",
            "confidence": "medium",
            "evidence": [
                f"labels never predicted on both held-out splits: {never_predicted_both}",
                f"validation zero-recall labels: {facts['validation_zero_recall_labels']}",
                f"test zero-recall labels: {facts['test_zero_recall_labels']}",
            ],
            "design_implication": (
                "The next contract should preserve these labels as hold/drop/split candidates, but choosing a narrower "
                "vocabulary without first documenting signer/split support would hide the main generalization weakness."
            ),
        },
        {
            "rank": 4,
            "lane": "data_quality_contract",
            "confidence": "medium",
            "evidence": [
                "M3AY low-signal and crop-stat tables identify candidate outlier clips",
                "Current manifests and tensors are usable for diagnostics but not enough to explain generalization by accuracy alone",
            ],
            "design_implication": (
                "Data-quality checks are useful acceptance criteria, but this prompt should not import sources, collect data, "
                "or manually relabel clips."
            ),
        },
        {
            "rank": 5,
            "lane": "product_fallback_scope",
            "confidence": "medium",
            "evidence": [
                "browser model remains fail-closed",
                "M3AW held-out smoke is not promotable",
                "M3AX tiny memorization is diagnostic only",
            ],
            "design_implication": (
                "Product fallback remains the honest runtime state, but the evidence still supports one bounded no-training "
                "contract scaffold before stopping recognizer remediation entirely."
            ),
        },
    ]


def acceptance_criteria() -> list[dict[str, Any]]:
    return [
        {
            "criterion": "tracked_split_signer_contract_receipt",
            "required_before_training": True,
            "description": (
                "A tracked receipt must enumerate train/validation/test signer ids, signer counts, per-label signer "
                "support, and train-to-held-out overlap for the high-signal region-grid manifests."
            ),
        },
        {
            "criterion": "explicit_generalization_target",
            "required_before_training": True,
            "description": (
                "The contract must state whether the next evaluation target is signer-disjoint generalization, "
                "signer-overlap diagnostic learning, or product fallback, and why that target is acceptable."
            ),
        },
        {
            "criterion": "label_level_hold_drop_or_repair_table",
            "required_before_training": True,
            "description": (
                "The contract must carry per-label decisions for held-out zero-recall and never-predicted labels, "
                "including whether each label is retained, held out, dropped from the next diagnostic, or routed to crop QA."
            ),
        },
        {
            "criterion": "crop_region_quality_gate",
            "required_before_training": True,
            "description": (
                "The contract must include a deterministic per-region quality summary or explicitly defer crop work with "
                "a reason. A future training prompt cannot rely only on tiny memorization."
            ),
        },
        {
            "criterion": "no_new_source_or_manual_annotation_without_human_approval",
            "required_before_training": True,
            "description": (
                "If satisfying the contract requires new source approval, manual labels, data collection, paid compute, "
                "or Brev auth, the loop must stop for human scope approval instead of training."
            ),
        },
    ]


def run(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise DesignError(
            "M3AZ requires --receipt docs/validation/return-to-form-vocab-crop-remediation-design-v1.json"
        )
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    diagnosis = load_json(INPUT_ARTIFACTS[0])
    m3aw_receipt = load_json(INPUT_ARTIFACTS[2])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[5])
    facts = extract_design_facts(diagnosis)
    hypotheses = ranked_hypotheses(facts)
    selected_lane = "split_signer_contract"
    next_action = "continue_no_training_remediation_contract_scaffold"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3AZ",
        "active_prompt": "docs/model/return-to-form-vocab-crop-remediation-design-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/design_vocab_crop_remediation.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "input_artifacts": [file_reference(path) for path in INPUT_ARTIFACTS],
        "commands": {
            "design": [sys.executable, *sys.argv],
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-vocab-crop-remediation-design-v1.json",
                ]
            ],
            "required_audits": [
                ["node", "scripts/audit_loop_premise.mjs", "--json"],
                ["node", "scripts/audit_return_to_form_plan.mjs", "--json"],
                ["node", "scripts/audit_no_pretrained_deps.mjs"],
                ["node", "scripts/audit_no_pretrained_artifact_json.mjs"],
                [
                    "python3",
                    "-m",
                    "py_compile",
                    "scripts/train_rawframe_model.py",
                    "scripts/evaluate_rawframe_model.py",
                    "scripts/compile_true_tcn_architecture.py",
                    "scripts/run_region_grid_tcn_tiny_overfit.py",
                    "scripts/diagnose_vocab_crop_separability.py",
                    "scripts/design_vocab_crop_remediation.py",
                ],
                ["git", "diff", "--check"],
            ],
        },
        "method": {
            "training_or_fitting_performed": False,
            "model_loaded_or_checkpoint_created": False,
            "optimizer_or_backward_used": False,
            "brev_used": False,
            "source_imported": False,
            "product_runtime_changed": False,
            "browser_or_final_claim_changed": False,
            "description": (
                "Loaded existing JSON/Markdown artifacts, extracted deterministic M3AY/M3AW/M3AX facts, "
                "ranked remediation lanes, and selected one no-training contract scaffold."
            ),
        },
        "prior_evidence": {
            "m3ay_receipt_status": diagnosis["status"],
            "m3ay_next_action": diagnosis["exactly_one_next_action"],
            "m3aw_receipt_status": m3aw_receipt["status"],
            "m3ax_receipt_status": m3ax_receipt["status"],
        },
        "design_facts": facts,
        "ranked_remediation_hypotheses": hypotheses,
        "selected_remediation_lane": {
            "lane": selected_lane,
            "why_selected": (
                "Empty train-to-held-out signer overlap plus prediction collapse means the next useful no-training "
                "artifact is a split/signer contract. Crop and vocabulary decisions should be recorded inside that "
                "contract rather than launching another training attempt."
            ),
            "why_not_training_now": (
                "M3AW failed held-out metrics and M3AY shows unresolved split/crop/vocabulary drift. Training, Brev, "
                "export, or browser activation would be ungrounded until a contract defines what evidence must change."
            ),
        },
        "acceptance_criteria_before_future_training": acceptance_criteria(),
        "future_artifacts_allowed_in_next_prompt": [
            "docs/validation/return-to-form-split-signer-contract-v1.json",
            "scripts/audit_high_signal_split_signer_contract.py",
            "docs/session-logs/<next>-mission-3ba-split-signer-contract.md",
        ],
        "blocked_actions_requiring_human_approval": [
            "Brev login, worker inspection, worker lifecycle changes, or paid compute",
            "any training run, model fitting, optimizer/backward pass, checkpoint creation, or sweep",
            "source import, source approval expansion, generated pseudo-labels, or manual annotation/data collection",
            "Detector 0 or landmark revival",
            "ONNX export, model-card promotion, browser trained activation, final-readiness claim, or final-gate changes",
            "product-runtime implementation changes",
            "push",
        ],
        "guardrails": {
            "non_promotion": (
                "This design is not training, calibration, export, browser activation, final readiness, or evidence "
                "that the M3AW recognizer generalizes."
            ),
            "pretrained_components": [],
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "final_gates_changed": False,
            "product_runtime_changed": False,
        },
        "exactly_one_next_action": next_action,
    }
    if args.write_receipt:
        write_json(receipt_path, receipt)
    return {
        "status": receipt["status"],
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
        "selected_lane": selected_lane,
        "next_action": next_action,
        "top_ranked_lane": hypotheses[0]["lane"],
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except DesignError as error:
        print(f"M3AZ design failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
