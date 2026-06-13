#!/usr/bin/env python3
"""Build the Mission 3BD no-training data quality contract receipt."""

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
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-data-quality-contract-v1.json"
SCHEMA_VERSION = "asl-pilot-data-quality-contract/v1"
MANIFESTS = {
    "train": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    "validation": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
}
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-subset-contract-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "336-mission-3bc-vocab-subset-contract.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-crop-region-contract-v1.json",
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
    """Raised when the data quality contract cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-data-quality-contract-v1.json"),
        help="Tracked M3BD receipt path.",
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


def manifest_summary(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    summary = {}
    for split, manifest in manifests.items():
        clips = manifest["clips"]
        labels = manifest_labels(manifest)
        split_signers = Counter(str(clip["signer_id"]) for clip in clips)
        summary[split] = {
            "clip_count": len(clips),
            "label_count": len(labels),
            "labels": labels,
            "signer_count": len(split_signers),
            "per_label_clip_counts": dict(sorted(Counter(str(clip["label_id"]) for clip in clips).items())),
            "per_label_signer_counts": {
                label_id: len({str(clip["signer_id"]) for clip in clips if str(clip["label_id"]) == label_id})
                for label_id in labels
            },
        }
    return summary


def by_label(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(row["label_id"]): row for row in rows}


def drift_failures_by_label(m3bb: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in m3bb["m3ay_drift_failure_decisions"]:
        rows[str(row["label_id"])].append(
            {
                "split": str(row["split"]),
                "nearest_other_train_label": str(row["nearest_other_train_label"]),
                "drift_ratio_same_to_nearest_other": row["drift_ratio_same_to_nearest_other"],
                "crop_region_contract_decision": row["crop_region_contract_decision"],
            }
        )
    return {label: sorted(values, key=lambda item: item["split"]) for label, values in rows.items()}


def compact_metric(metric: dict[str, Any]) -> dict[str, Any]:
    return {
        "count": metric.get("count"),
        "mean": metric.get("mean"),
        "min": metric.get("min"),
        "max": metric.get("max"),
    }


def crop_quality_digest(label_id: str, m3bb: dict[str, Any]) -> dict[str, Any]:
    digest = {}
    quality = m3bb["per_label_per_split_crop_region_quality"]
    for split in ("train", "validation", "test"):
        row = quality[split][label_id]
        overall = row["overall"]
        digest[split] = {
            "clip_count": row["clip_count"],
            "signer_count": row["signer_count"],
            "overall": {
                "hand_context_motion_mean": compact_metric(overall["hand_context_motion_mean"]),
                "hand_context_std_intensity": compact_metric(overall["hand_context_std_intensity"]),
                "temporal_motion_mean": compact_metric(overall["temporal_motion_mean"]),
                "std_intensity": compact_metric(overall["std_intensity"]),
                "dark_fraction_lte_10": compact_metric(overall["dark_fraction_lte_10"]),
                "bright_fraction_gte_245": compact_metric(overall["bright_fraction_gte_245"]),
            },
        }
    return digest


def low_signal_by_label(m3bb: dict[str, Any]) -> dict[str, dict[str, Any]]:
    labels: dict[str, dict[str, Any]] = defaultdict(dict)
    for category, rows in m3bb["low_signal_examples"].items():
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in rows:
            grouped[str(row["label_id"])].append(row)
        for label_id, label_rows in grouped.items():
            labels[label_id][category] = {
                "count_in_top_examples": len(label_rows),
                "examples": label_rows,
            }
    return labels


def support_ordered(label_id: str, m3bc: dict[str, Any]) -> dict[str, Any]:
    support = m3bc["per_label_support"][label_id]
    return {
        "splits": {
            split: support["splits"][split]
            for split in ("train", "validation", "test")
        },
        "signer_disjoint_implications": support["signer_disjoint_implications"],
    }


def repairability(
    label_id: str,
    subset_decision: dict[str, Any],
    crop_status: dict[str, Any],
    drift_rows: list[dict[str, Any]],
    low_signal: dict[str, Any],
) -> dict[str, Any]:
    reasons = list(subset_decision["reasons"])
    if low_signal:
        reasons.append("low_signal_top_examples_present")
    if subset_decision["candidate_training_ready"]:
        return {
            "repairability_decision": "retained_candidate",
            "existing_artifacts_can_repair_for_training": True,
            "would_require_human_repair_for_training": False,
            "rationale": "The label cleared the current artifact-only gates.",
            "blockers": [],
        }

    if subset_decision["decision"] == "defer":
        rationale = (
            "Existing artifacts show partial held-out signal, but unresolved crop/region drift or targeted "
            "gates mean the label can only be deferred or dropped from the next scope, not repaired without "
            "new review or a mutation/training prompt."
        )
    elif subset_decision["decision"] == "repair":
        rationale = (
            "Existing artifacts identify the repair need but do not contain an artifact-only correction for "
            "the zero-recall/crop-drift failure."
        )
    else:
        rationale = (
            "Existing artifacts justify holding the label out of the next training scope; they do not repair "
            "the never-predicted or zero-recall failure without manual review, source work, or data changes."
        )

    blockers = reasons + [
        f"m3bb_status:{crop_status['crop_region_contract_status']}",
        *[f"crop_drift_{row['split']}_nearest_{row['nearest_other_train_label']}" for row in drift_rows],
    ]
    return {
        "repairability_decision": "drop_or_defer",
        "existing_artifacts_can_repair_for_training": False,
        "would_require_human_repair_for_training": True,
        "rationale": rationale,
        "blockers": blockers,
    }


def per_label_data_quality(m3bc: dict[str, Any], m3bb: dict[str, Any]) -> list[dict[str, Any]]:
    subset_by_label = by_label(m3bc["per_label_subset_decisions"])
    crop_status_by_label = by_label(m3bb["label_contract_status"])
    drift_by_label = drift_failures_by_label(m3bb)
    low_signal = low_signal_by_label(m3bb)
    rows = []
    for label_id in [row["label_id"] for row in m3bc["per_label_subset_decisions"]]:
        subset_decision = subset_by_label[label_id]
        crop_status = crop_status_by_label[label_id]
        drift_rows = drift_by_label.get(label_id, [])
        low_signal_rows = low_signal.get(label_id, {})
        rows.append(
            {
                "label_id": label_id,
                "m3bc_vocab_decision": subset_decision["decision"],
                "m3ba_decision": subset_decision["m3ba_decision"],
                "m3bb_crop_region_status": crop_status["crop_region_contract_status"],
                "support": support_ordered(label_id, m3bc),
                "split_coverage_status": "present_all_splits",
                "prediction_facts": subset_decision["prediction_facts"],
                "crop_region_quality_reference": {
                    "source_receipt": "docs/validation/return-to-form-crop-region-contract-v1.json",
                    "m3ay_drift_failures": drift_rows,
                    "quality_digest": crop_quality_digest(label_id, m3bb),
                },
                "low_signal_indicators": low_signal_rows,
                "repairability": repairability(
                    label_id,
                    subset_decision,
                    crop_status,
                    drift_rows,
                    low_signal_rows,
                ),
            }
        )
    return rows


def candidate_subset(per_label_rows: list[dict[str, Any]]) -> dict[str, Any]:
    retained = [
        row["label_id"]
        for row in per_label_rows
        if row["repairability"]["repairability_decision"] == "retained_candidate"
    ]
    return {
        "status": "none_currently_training_ready" if not retained else "training_candidate_identified",
        "training_worthy_subset_identified": bool(retained),
        "paid_microexperiment_supported_now": bool(retained),
        "smallest_honest_candidate_subset": retained,
        "excluded_labels": [
            {
                "label_id": row["label_id"],
                "m3bc_vocab_decision": row["m3bc_vocab_decision"],
                "repairability_decision": row["repairability"]["repairability_decision"],
                "why_excluded": row["repairability"]["rationale"],
            }
            for row in per_label_rows
            if row["label_id"] not in retained
        ],
        "product_fallback_scope_seed": {
            "status": "requires_next_prompt_design",
            "constraint": (
                "Because no label is training-worthy from existing artifacts, the next bounded lane should design "
                "an honest fail-closed product fallback scope without browser trained-activation or runtime changes "
                "inside this contract."
            ),
        },
    }


def minimum_gates_before_future_training() -> list[dict[str, Any]]:
    return [
        {
            "gate": "artifact_only_data_quality_repair",
            "status": "failed_current_contract",
            "requirement": (
                "Each retained label must be repaired from existing artifacts or explicitly approved for new "
                "manual/source/data work before training."
            ),
        },
        {
            "gate": "candidate_subset_nonempty_minimum",
            "status": "failed_current_contract",
            "requirement": "At least two labels must be retained as training-worthy before any recognizer training prompt.",
        },
        {
            "gate": "manual_data_quality_repair_approval",
            "status": "human_approval_required_if_training_remains_goal",
            "requirement": (
                "Manual visual review, manual labels, manual data collection, source approval, or manifest/tensor "
                "mutation must be explicitly approved and scoped before it is used to unblock training."
            ),
        },
        {
            "gate": "compute_receipt_before_brev",
            "status": "blocked_until_training_worthy_subset",
            "requirement": (
                "Paid Brev work requires a nonempty training-worthy subset plus worker, price, command, max "
                "runtime/spend, kill condition, expected metric signal, and teardown receipt."
            ),
        },
        {
            "gate": "browser_claim_integrity",
            "status": "passed_current_contract",
            "requirement": "The browser model must remain not_trained/fail-closed until a promoted artifact clears final gates.",
        },
    ]


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute unless a bounded compute-receipt prompt is active and human approval is current.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, export, browser activation, final-readiness claim, or final-gate change.",
        "Stop before any source import, source-approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, product-runtime, or browser model changes.",
        "Stop if resolving data quality for training requires manual repair or source/data changes instead of a bounded no-training product fallback design.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ContractError("M3BD requires --receipt docs/validation/return-to-form-data-quality-contract-v1.json")
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    manifests = {split: load_json(path) for split, path in MANIFESTS.items()}
    m3bc = load_json(INPUT_ARTIFACTS[0])
    m3bb = load_json(INPUT_ARTIFACTS[2])
    m3ba = load_json(INPUT_ARTIFACTS[3])
    m3az = load_json(INPUT_ARTIFACTS[4])
    m3ay = load_json(INPUT_ARTIFACTS[5])
    m3aw_receipt = load_json(INPUT_ARTIFACTS[6])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[7])
    m3aw_report = load_json(INPUT_ARTIFACTS[8])
    m3aw_sidecar = load_json(INPUT_ARTIFACTS[9])

    if m3bc["candidate_subset"]["training_worthy_subset_identified"]:
        raise ContractError("M3BD expected M3BC to have no retained training-worthy subset")

    label_rows = per_label_data_quality(m3bc, m3bb)
    subset = candidate_subset(label_rows)
    next_action = "continue_product_fallback_scope_design_no_training"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BD",
        "active_prompt": "docs/model/return-to-form-data-quality-contract-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/audit_high_signal_data_quality_contract.py",
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
                    "docs/validation/return-to-form-data-quality-contract-v1.json",
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
                    "scripts/audit_high_signal_data_quality_contract.py",
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
                "Loaded existing receipts, reports, sidecars, and manifests; reused M3BB tensor inventory and "
                "crop/region quality summaries as metadata; selected artifact-only repairability decisions "
                "without training, mutation, Brev, source import, or product runtime changes."
            ),
        },
        "prior_evidence": {
            "m3bc": {
                "receipt_status": m3bc["status"],
                "selected_next_action": m3bc["exactly_one_next_action"],
                "candidate_subset_status": m3bc["candidate_subset"]["status"],
                "retained_labels": m3bc["candidate_subset"]["retained_labels"],
            },
            "m3bb": {
                "receipt_status": m3bb["status"],
                "selected_next_action": m3bb["exactly_one_next_action"],
                "preserved_input_contract_status": m3bb["preserved_input_contract_verification"]["status"],
                "tensor_inventory": m3bb["preserved_input_contract_verification"]["tensor_inventory"],
            },
            "m3ba": {
                "receipt_status": m3ba["status"],
                "generalization_target": m3ba["selected_generalization_target"]["target"],
                "train_validation_signer_overlap": m3ba["signer_overlap"]["overall"]["train_validation_overlap"],
                "train_test_signer_overlap": m3ba["signer_overlap"]["overall"]["train_test_overlap"],
            },
            "m3az": {
                "receipt_status": m3az["status"],
                "ranked_lanes": [row["lane"] for row in m3az["ranked_remediation_hypotheses"]],
            },
            "m3ay": {
                "receipt_status": m3ay["status"],
                "validation_labels_never_predicted": m3ay["prediction_patterns"]["validation"]["labels_never_predicted"],
                "test_labels_never_predicted": m3ay["prediction_patterns"]["test"]["labels_never_predicted"],
                "validation_zero_recall_labels": m3ay["prediction_patterns"]["validation"]["zero_recall_labels"],
                "test_zero_recall_labels": m3ay["prediction_patterns"]["test"]["zero_recall_labels"],
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
        "manifest_summary": manifest_summary(manifests),
        "per_label_data_quality": label_rows,
        "candidate_subset": subset,
        "minimum_gates_before_future_training": minimum_gates_before_future_training(),
        "contract_conclusions": [
            "Existing artifacts do not repair any held, deferred, or repair-required label into a training-worthy retained candidate.",
            "All seven high-signal labels remain excluded from future training until manual/source/data repair is approved or a later bounded contract changes the evidence.",
            "A paid Brev micro-experiment is not supported because the retained subset is empty.",
            "The honest next lane is a no-training product fallback scope design that preserves fail-closed browser claims.",
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
                "This data quality contract is not training, calibration, export, browser activation, final "
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
        print(f"M3BD data quality contract failed: {error}", file=sys.stderr)
        return 2
    result = {
        "status": receipt["status"],
        "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
        "candidate_subset_status": receipt["candidate_subset"]["status"],
        "training_worthy_subset_identified": receipt["candidate_subset"]["training_worthy_subset_identified"],
        "next_action": receipt["exactly_one_next_action"],
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
