#!/usr/bin/env python3
"""Build the Mission 3BC no-training vocabulary subset contract receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-subset-contract-v1.json"
SCHEMA_VERSION = "asl-pilot-vocab-subset-contract/v1"
MANIFESTS = {
    "train": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    "validation": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
}
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-crop-region-contract-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "334-mission-3bb-crop-region-contract.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-split-signer-contract-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-remediation-design-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-separability-diagnosis-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "validation-report.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "prediction-sidecar.json",
    *MANIFESTS.values(),
]


class ContractError(RuntimeError):
    """Raised when the vocabulary subset contract cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-vocab-subset-contract-v1.json"),
        help="Tracked M3BC receipt path.",
    )
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ContractError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise ContractError(f"{context} missing: {path}")
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


def manifest_labels(manifest: dict[str, Any]) -> list[str]:
    return [str(label["label_id"]) for label in manifest["labels"]]


def per_label_support(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    labels = manifest_labels(manifests["train"])
    support: dict[str, Any] = {}
    signer_sets: dict[str, dict[str, set[str]]] = defaultdict(dict)
    for label_id in labels:
        support[label_id] = {"splits": {}}
        for split, manifest in manifests.items():
            clips = [clip for clip in manifest["clips"] if str(clip["label_id"]) == label_id]
            signer_counts = Counter(str(clip["signer_id"]) for clip in clips)
            signer_sets[label_id][split] = set(signer_counts)
            support[label_id]["splits"][split] = {
                "clip_count": len(clips),
                "signer_count": len(signer_counts),
                "signer_ids": sorted(signer_counts),
                "signer_clip_counts": dict(sorted(signer_counts.items())),
                "source_record_count": len({str(clip["source_record_id"]) for clip in clips}),
            }
        support[label_id]["signer_disjoint_implications"] = {
            "train_validation_overlap": sorted(signer_sets[label_id]["train"] & signer_sets[label_id]["validation"]),
            "train_test_overlap": sorted(signer_sets[label_id]["train"] & signer_sets[label_id]["test"]),
            "validation_test_overlap": sorted(signer_sets[label_id]["validation"] & signer_sets[label_id]["test"]),
            "diagnostic_target": "signer_disjoint",
            "training_implication": (
                "Any future training/evaluation claim for this label must be judged as signer-disjoint "
                "generalization, not signer-overlap memorization."
            ),
        }
    return support


def label_status_by_id(m3bb: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(row["label_id"]): row for row in m3bb["label_contract_status"]}


def m3ba_decisions_by_id(m3ba: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(row["label_id"]): row for row in m3ba["label_decisions"]}


def m3bb_drift_by_label(m3bb: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in m3bb["m3ay_drift_failure_decisions"]:
        rows[str(row["label_id"])].append(row)
    return rows


def prediction_facts_by_label(labels: list[str], diagnosis: dict[str, Any]) -> dict[str, Any]:
    patterns = diagnosis["prediction_patterns"]
    facts = {}
    for label_id in labels:
        facts[label_id] = {
            "validation_never_predicted": label_id in patterns["validation"]["labels_never_predicted"],
            "test_never_predicted": label_id in patterns["test"]["labels_never_predicted"],
            "validation_zero_recall": label_id in patterns["validation"]["zero_recall_labels"],
            "test_zero_recall": label_id in patterns["test"]["zero_recall_labels"],
            "validation_true_count": patterns["validation"]["true_label_counts"].get(label_id, 0),
            "test_true_count": patterns["test"]["true_label_counts"].get(label_id, 0),
            "validation_predicted_count": patterns["validation"]["predicted_label_counts"].get(label_id, 0),
            "test_predicted_count": patterns["test"]["predicted_label_counts"].get(label_id, 0),
        }
    return facts


def classify_label(
    label_id: str,
    m3ba_decision: dict[str, Any],
    m3bb_status: dict[str, Any],
    prediction_facts: dict[str, Any],
    drift_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    reasons = []
    if prediction_facts["validation_never_predicted"]:
        reasons.append("never_predicted_validation")
    if prediction_facts["test_never_predicted"]:
        reasons.append("never_predicted_test")
    if prediction_facts["validation_zero_recall"]:
        reasons.append("zero_recall_validation")
    if prediction_facts["test_zero_recall"]:
        reasons.append("zero_recall_test")
    if drift_rows:
        reasons.append("crop_stat_drift_" + "_and_".join(sorted({str(row["split"]) for row in drift_rows})))

    m3ba_status = str(m3ba_decision["decision"])
    m3bb_contract_status = str(m3bb_status["crop_region_contract_status"])
    if m3ba_status == "hold_and_repair_before_next_training":
        decision = "hold"
        candidate_training_ready = False
        rationale = (
            "M3BA held this label before training, and M3BC preserves that hold because the held-out "
            "recognizer never predicted it on both splits or left crop/region drift unresolved."
        )
    elif m3ba_status == "repair_before_next_training":
        decision = "repair"
        candidate_training_ready = False
        rationale = (
            "The label has zero-recall failure on both held-out splits and remains repair-required "
            "before any subset can train on it."
        )
    elif m3bb_contract_status == "crop_region_gate_required_not_training_ready":
        decision = "defer"
        candidate_training_ready = False
        rationale = (
            "The label has some held-out prediction signal, but crop/region drift or targeted repair gates "
            "remain unresolved, so it is deferred rather than retained."
        )
    else:
        decision = "retain"
        candidate_training_ready = True
        rationale = "The label clears the current hold/repair/defer gates from M3BA and M3BB."

    return {
        "label_id": label_id,
        "decision": decision,
        "candidate_training_ready": candidate_training_ready,
        "drop_recommended": False,
        "m3ba_decision": m3ba_status,
        "m3bb_crop_region_status": m3bb_contract_status,
        "prediction_facts": prediction_facts,
        "drift_failure_splits": sorted({str(row["split"]) for row in drift_rows}),
        "reasons": reasons,
        "rationale": rationale,
    }


def label_decisions(
    manifests: dict[str, dict[str, Any]],
    m3ba: dict[str, Any],
    m3bb: dict[str, Any],
    diagnosis: dict[str, Any],
) -> list[dict[str, Any]]:
    labels = manifest_labels(manifests["train"])
    m3ba_decisions = m3ba_decisions_by_id(m3ba)
    m3bb_statuses = label_status_by_id(m3bb)
    prediction_facts = prediction_facts_by_label(labels, diagnosis)
    drift_by_label = m3bb_drift_by_label(m3bb)
    return [
        classify_label(
            label_id,
            m3ba_decisions[label_id],
            m3bb_statuses[label_id],
            prediction_facts[label_id],
            drift_by_label.get(label_id, []),
        )
        for label_id in labels
    ]


def candidate_subset(decisions: list[dict[str, Any]]) -> dict[str, Any]:
    retained = [row["label_id"] for row in decisions if row["candidate_training_ready"]]
    exclusions = [
        {
            "label_id": row["label_id"],
            "decision": row["decision"],
            "why_excluded": row["rationale"],
        }
        for row in decisions
        if not row["candidate_training_ready"]
    ]
    return {
        "status": "none_currently_training_ready" if not retained else "training_candidate_identified",
        "retained_labels": retained,
        "excluded_labels": exclusions,
        "smallest_honest_candidate_subset": retained,
        "training_worthy_subset_identified": bool(retained),
        "paid_microexperiment_supported_now": bool(retained),
        "rationale": (
            "No high-signal label clears the M3BA/M3BB gates yet; a training or paid Brev prompt would hide "
            "unresolved label/crop/data-quality failures."
            if not retained
            else "At least one label clears the current gates, but a compute receipt is still required before paid work."
        ),
    }


def subset_gates() -> list[dict[str, Any]]:
    return [
        {
            "gate": "candidate_subset_nonempty",
            "status": "failed_current_contract",
            "requirement": "At least two labels should clear hold/repair/defer gates before any recognizer training prompt.",
        },
        {
            "gate": "held_label_repair_or_drop_policy",
            "status": "required_next",
            "requirement": (
                "A data-quality or label-repair contract must decide whether held labels remain held, are repaired "
                "from existing evidence, or are explicitly dropped from the next product/training scope."
            ),
        },
        {
            "gate": "signer_disjoint_evaluation_language",
            "status": "passed_current_contract",
            "requirement": (
                "Any future subset must continue to label validation/test as signer-disjoint diagnostics, not "
                "promotion evidence."
            ),
        },
        {
            "gate": "compute_receipt_before_brev",
            "status": "blocked_until_training_worthy_subset",
            "requirement": (
                "Paid Brev work requires a nonempty training-worthy subset plus an active bounded compute-receipt "
                "prompt with worker, price, command, runtime, spend, kill-condition, and teardown details."
            ),
        },
    ]


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute unless a bounded compute-receipt prompt is active and human approval is current.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, export, browser activation, final-readiness claim, or final-gate change.",
        "Stop before any source import, source-approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, product-runtime, or browser model changes.",
        "Stop if a future data-quality or label-repair contract requires new source approval, manual review, or data changes from outside existing artifacts.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ContractError("M3BC requires --receipt docs/validation/return-to-form-vocab-subset-contract-v1.json")
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    manifests = {split: load_json(path) for split, path in MANIFESTS.items()}
    m3bb = load_json(INPUT_ARTIFACTS[0])
    m3ba = load_json(INPUT_ARTIFACTS[2])
    m3az = load_json(INPUT_ARTIFACTS[3])
    diagnosis = load_json(INPUT_ARTIFACTS[4])
    m3aw_receipt = load_json(INPUT_ARTIFACTS[5])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[6])
    m3aw_report = load_json(INPUT_ARTIFACTS[7])
    m3aw_sidecar = load_json(INPUT_ARTIFACTS[8])

    decisions = label_decisions(manifests, m3ba, m3bb, diagnosis)
    subset = candidate_subset(decisions)
    next_action = "continue_no_training_data_quality_contract_scaffold"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BC",
        "active_prompt": "docs/model/return-to-form-vocab-subset-contract-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/audit_high_signal_vocab_subset_contract.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "input_artifacts": [file_reference(path) for path in INPUT_ARTIFACTS],
        "commands": {
            "contract_generation": [sys.executable, *sys.argv],
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-vocab-subset-contract-v1.json",
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
                    "scripts/audit_high_signal_split_signer_contract.py",
                    "scripts/audit_high_signal_crop_region_contract.py",
                    "scripts/audit_high_signal_vocab_subset_contract.py",
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
            "manifest_or_tensor_mutated": False,
            "product_runtime_changed": False,
            "browser_or_final_claim_changed": False,
            "description": (
                "Loaded existing receipts, reports, sidecars, and manifests; summarized per-label support; "
                "combined M3BA/M3BB/M3AY failure states into deterministic vocabulary subset decisions."
            ),
        },
        "prior_evidence": {
            "m3bb": {
                "receipt_status": m3bb["status"],
                "selected_next_action": m3bb["exactly_one_next_action"],
                "training_worthy_subset_identified": m3bb["training_worthy_assessment"][
                    "training_worthy_subset_identified"
                ],
            },
            "m3ba": {
                "receipt_status": m3ba["status"],
                "generalization_target": m3ba["selected_generalization_target"]["target"],
            },
            "m3az": {
                "receipt_status": m3az["status"],
                "selected_remediation_lane": m3az["selected_remediation_lane"]["lane"],
            },
            "m3ay": {
                "receipt_status": diagnosis["status"],
                "validation_labels_never_predicted": diagnosis["prediction_patterns"]["validation"][
                    "labels_never_predicted"
                ],
                "test_labels_never_predicted": diagnosis["prediction_patterns"]["test"]["labels_never_predicted"],
            },
            "m3aw": {
                "receipt_status": m3aw_receipt["status"],
                "validation_top1_accuracy": m3aw_report["validation"]["top1_accuracy"],
                "validation_macro_f1": m3aw_report["validation"]["macro_f1"],
                "test_top1_accuracy": m3aw_report["test"]["top1_accuracy"],
                "test_macro_f1": m3aw_report["test"]["macro_f1"],
                "prediction_sidecar_threshold": m3aw_sidecar["selected_threshold"],
            },
            "m3ax": {
                "receipt_status": m3ax_receipt["status"],
                "tiny_subset_accuracy": m3ax_receipt["training_result"]["final_eval_metrics"]["accuracy"],
                "tiny_subset_zero_recall_labels": m3ax_receipt["training_result"]["final_eval_metrics"][
                    "zero_recall_labels"
                ],
            },
        },
        "per_label_support": per_label_support(manifests),
        "per_label_subset_decisions": decisions,
        "candidate_subset": subset,
        "minimum_gates_before_future_training": subset_gates(),
        "contract_conclusions": [
            "No high-signal label currently clears all M3BA and M3BB gates for training.",
            "M3AX tiny memorization remains useful input/model-path evidence but does not make any label held-out-ready.",
            "A paid Brev micro-experiment is not supported until a nonempty retained subset exists and a compute receipt is active.",
            "The browser model remains fail-closed and not_trained; this receipt is not promotion or readiness evidence.",
            f"The single next action is {next_action}.",
        ],
        "stop_conditions_requiring_human_approval": stop_conditions(),
        "blocked_actions_requiring_human_approval": [
            "Brev login, worker inspection, worker lifecycle changes, or paid compute without a compute-receipt prompt",
            "any training run, model fitting, optimizer/backward pass, checkpoint creation, or sweep",
            "source import, source approval expansion, generated pseudo-labels, or manual annotation/data collection",
            "manifest or tensor mutation",
            "Detector 0 or landmark revival",
            "ONNX export, model-card promotion, browser trained activation, final-readiness claim, or final-gate changes",
            "product-runtime implementation changes",
            "push",
        ],
        "guardrails": {
            "non_promotion": (
                "This vocabulary subset contract is not training, calibration, export, browser activation, final "
                "readiness, or evidence that the M3AW recognizer generalizes. The browser model remains "
                "not_trained/fail-closed."
            ),
            "pretrained_components": [],
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "manifest_or_tensor_mutated": False,
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
    return receipt


def main() -> int:
    args = parse_args()
    try:
        receipt = build_receipt(args)
    except ContractError as error:
        print(f"M3BC vocabulary subset contract failed: {error}", file=sys.stderr)
        return 2
    result = {
        "status": receipt["status"],
        "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
        "candidate_subset_status": receipt["candidate_subset"]["status"],
        "retained_labels": receipt["candidate_subset"]["retained_labels"],
        "next_action": receipt["exactly_one_next_action"],
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
