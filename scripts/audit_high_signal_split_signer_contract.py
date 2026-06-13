#!/usr/bin/env python3
"""Build the Mission 3BA no-training split/signer contract receipt."""

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
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-split-signer-contract-v1.json"
SCHEMA_VERSION = "asl-pilot-split-signer-contract/v1"
MANIFESTS = {
    "train": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    "validation": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
}
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-remediation-design-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "329-mission-3az-vocab-crop-remediation-design.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-separability-diagnosis-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "327-mission-3ay-vocab-crop-separability-diagnosis.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "validation-report.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "prediction-sidecar.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    *MANIFESTS.values(),
]


class ContractError(RuntimeError):
    """Raised when the split/signer contract cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-split-signer-contract-v1.json"),
        help="Tracked M3BA receipt path.",
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


def signer_ids_for(clips: list[dict[str, Any]]) -> list[str]:
    return sorted({str(clip["signer_id"]) for clip in clips})


def summarize_split(split: str, manifest: dict[str, Any]) -> dict[str, Any]:
    clips = manifest["clips"]
    label_ids = manifest_labels(manifest)
    per_label: dict[str, Any] = {}
    for label_id in label_ids:
        label_clips = [clip for clip in clips if str(clip["label_id"]) == label_id]
        signer_counts = Counter(str(clip["signer_id"]) for clip in label_clips)
        per_label[label_id] = {
            "clip_count": len(label_clips),
            "signer_count": len(signer_counts),
            "signer_ids": sorted(signer_counts),
            "signer_clip_counts": dict(sorted(signer_counts.items())),
            "source_record_count": len({str(clip["source_record_id"]) for clip in label_clips}),
        }
    split_signer_counts = Counter(str(clip["signer_id"]) for clip in clips)
    return {
        "split": split,
        "clip_count": len(clips),
        "label_count": len(label_ids),
        "labels": label_ids,
        "signer_count": len(split_signer_counts),
        "signer_ids": sorted(split_signer_counts),
        "signer_clip_counts": dict(sorted(split_signer_counts.items())),
        "per_label": per_label,
    }


def split_signer_overlap(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    signer_sets = {
        split: {str(clip["signer_id"]) for clip in manifest["clips"]}
        for split, manifest in manifests.items()
    }
    labels = manifest_labels(manifests["train"])
    per_label: dict[str, Any] = {}
    for label_id in labels:
        label_sets = {
            split: {
                str(clip["signer_id"])
                for clip in manifest["clips"]
                if str(clip["label_id"]) == label_id
            }
            for split, manifest in manifests.items()
        }
        per_label[label_id] = {
            "train_validation_overlap": sorted(label_sets["train"] & label_sets["validation"]),
            "train_test_overlap": sorted(label_sets["train"] & label_sets["test"]),
            "validation_test_overlap": sorted(label_sets["validation"] & label_sets["test"]),
        }
    return {
        "overall": {
            "train_validation_overlap": sorted(signer_sets["train"] & signer_sets["validation"]),
            "train_test_overlap": sorted(signer_sets["train"] & signer_sets["test"]),
            "validation_test_overlap": sorted(signer_sets["validation"] & signer_sets["test"]),
            "train_only_count": len(signer_sets["train"] - signer_sets["validation"] - signer_sets["test"]),
            "validation_only_count": len(signer_sets["validation"] - signer_sets["train"] - signer_sets["test"]),
            "test_only_count": len(signer_sets["test"] - signer_sets["train"] - signer_sets["validation"]),
        },
        "per_label": per_label,
    }


def signer_support_matrix(manifests: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    for split, manifest in manifests.items():
        for clip in manifest["clips"]:
            signer_id = str(clip["signer_id"])
            label_id = str(clip["label_id"])
            row = rows.setdefault(
                signer_id,
                {
                    "signer_id": signer_id,
                    "splits": defaultdict(lambda: {"clip_count": 0, "label_clip_counts": Counter()}),
                    "total_clip_count": 0,
                },
            )
            row["splits"][split]["clip_count"] += 1
            row["splits"][split]["label_clip_counts"][label_id] += 1
            row["total_clip_count"] += 1

    normalized = []
    for signer_id in sorted(rows):
        split_rows = {}
        for split in ("train", "validation", "test"):
            split_row = rows[signer_id]["splits"].get(split, {"clip_count": 0, "label_clip_counts": Counter()})
            split_rows[split] = {
                "clip_count": split_row["clip_count"],
                "labels": sorted(split_row["label_clip_counts"]),
                "label_clip_counts": dict(sorted(split_row["label_clip_counts"].items())),
            }
        normalized.append(
            {
                "signer_id": signer_id,
                "total_clip_count": rows[signer_id]["total_clip_count"],
                "splits": split_rows,
            }
        )
    return normalized


def verify_tensor_inventory(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    rows = []
    missing = []
    mismatched = []
    for split, manifest in manifests.items():
        for clip in manifest["clips"]:
            manifest_path = MANIFESTS[split]
            tensor_path = (manifest_path.parent / str(clip["relative_frame_tensor_path"])).resolve()
            try:
                tensor_path.relative_to(PROJECT_ROOT)
            except ValueError as error:
                raise ContractError(f"tensor path escapes project root: {tensor_path}") from error
            expected_hash = str(clip["frame_tensor_sha256"])
            if not tensor_path.exists():
                missing.append(project_relative(tensor_path))
                continue
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                mismatched.append(
                    {
                        "clip_id": str(clip["clip_id"]),
                        "path": project_relative(tensor_path),
                        "expected_sha256": expected_hash,
                        "actual_sha256": actual_hash,
                    }
                )
            rows.append(
                {
                    "split": split,
                    "clip_id": str(clip["clip_id"]),
                    "label_id": str(clip["label_id"]),
                    "signer_id": str(clip["signer_id"]),
                    "path": project_relative(tensor_path),
                    "sha256": actual_hash,
                }
            )
    inventory_json = json.dumps(rows, sort_keys=True, separators=(",", ":")).encode("utf-8")
    by_split = Counter(row["split"] for row in rows)
    return {
        "tensor_file_count": len(rows),
        "split_counts": dict(sorted(by_split.items())),
        "all_expected_tensors_present": not missing,
        "all_manifest_hashes_verified": not mismatched and not missing,
        "missing": missing,
        "mismatched": mismatched,
        "inventory_sha256": hashlib.sha256(inventory_json).hexdigest(),
        "inventory_digest_algorithm": "sha256(sorted_json_rows_of_split_clip_label_signer_path_hash)",
    }


def drift_failures(diagnosis: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    result = {}
    drift = diagnosis["descriptive_feature_separation"]["split_centroid_drift"]
    for split, rows in drift.items():
        result[split] = [
            {
                "label_id": str(row["label_id"]),
                "nearest_other_train_label": str(row["nearest_other_train_centroid"]["label_id"]),
                "drift_ratio_same_to_nearest_other": row["drift_ratio_same_to_nearest_other"],
            }
            for row in rows
            if not row["same_label_closer_than_nearest_other"]
        ]
    return result


def label_decision(label_id: str, diagnosis: dict[str, Any]) -> dict[str, Any]:
    patterns = diagnosis["prediction_patterns"]
    validation_never = set(patterns["validation"]["labels_never_predicted"])
    test_never = set(patterns["test"]["labels_never_predicted"])
    validation_zero = set(patterns["validation"]["zero_recall_labels"])
    test_zero = set(patterns["test"]["zero_recall_labels"])
    drift = drift_failures(diagnosis)
    drift_splits = [split for split, rows in drift.items() if any(row["label_id"] == label_id for row in rows)]

    reasons = []
    if label_id in validation_never:
        reasons.append("never_predicted_validation")
    if label_id in test_never:
        reasons.append("never_predicted_test")
    if label_id in validation_zero:
        reasons.append("zero_recall_validation")
    if label_id in test_zero:
        reasons.append("zero_recall_test")
    if drift_splits:
        reasons.append(f"crop_stat_drift_{'_and_'.join(sorted(drift_splits))}")

    if label_id in validation_never and label_id in test_never:
        decision = "hold_and_repair_before_next_training"
        rationale = (
            "The label was never predicted on both held-out splits, so it must not be used in another "
            "training prompt until a crop/region or vocabulary contract explains the failure."
        )
    elif label_id in validation_zero and label_id in test_zero:
        decision = "repair_before_next_training"
        rationale = (
            "The label had zero recall on both held-out splits despite being predicted at least once; "
            "future work must explain whether this is split, crop, or label separability."
        )
    elif label_id in validation_zero or label_id in test_zero:
        decision = "retain_with_targeted_repair_gate"
        rationale = "The label has partial held-out signal but failed at least one split-level recall gate."
    elif drift_splits:
        decision = "retain_with_crop_region_gate"
        rationale = "Held-out prediction signal exists, but crop-stat drift must be cleared before training."
    else:
        decision = "retain"
        rationale = "No zero-recall, never-predicted, or crop-stat drift failure was recorded in M3AY."

    return {
        "label_id": label_id,
        "decision": decision,
        "drop_recommended": False,
        "reasons": reasons,
        "rationale": rationale,
    }


def label_decisions(diagnosis: dict[str, Any], manifests: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    return [label_decision(label_id, diagnosis) for label_id in manifest_labels(manifests["train"])]


def crop_region_gate_requirements(diagnosis: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": "required_before_future_training",
        "deferral_reason": None,
        "required_receipt": "docs/validation/return-to-form-crop-region-contract-v1.json",
        "minimum_requirements": [
            "Verify 100% of selected train/validation/test clips consume rgb_regions_grid_v1 with preserved region axis, expected region order, expected shape, and manifest-bound tensor hashes.",
            "Compute per-label and per-split region quality summaries for hand-context motion, intensity, dark/bright fractions, and frame-mean range.",
            "Resolve or explicitly hold labels for which held-out same-label crop-stat centroids are farther than another train-label centroid.",
            "Keep any manual visual review, source approval, manual annotation, paid compute, export, browser activation, or product-runtime change behind human approval.",
        ],
        "known_current_failures_from_m3ay": drift_failures(diagnosis),
    }


def stop_conditions() -> list[str]:
    return [
        "Stop for human approval before any Brev login, worker inspection, worker lifecycle action, or paid compute.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, export, browser activation, final-readiness claim, or final-gate change.",
        "Stop before any source import, source-approval expansion, generated pseudo-labels, manual labels, manual data collection, or manual annotation.",
        "Stop before Detector 0, landmark, broad-label, product-runtime, or browser model changes.",
        "Stop if the crop/region contract requires manual review or new data to resolve held-out drift.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ContractError("M3BA requires --receipt docs/validation/return-to-form-split-signer-contract-v1.json")
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    manifests = {split: load_json(path) for split, path in MANIFESTS.items()}
    design = load_json(INPUT_ARTIFACTS[0])
    diagnosis = load_json(INPUT_ARTIFACTS[2])
    m3aw_receipt = load_json(INPUT_ARTIFACTS[4])
    validation_report = load_json(INPUT_ARTIFACTS[5])
    prediction_sidecar = load_json(INPUT_ARTIFACTS[6])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[7])

    signer_support = {split: summarize_split(split, manifest) for split, manifest in manifests.items()}
    overlap = split_signer_overlap(manifests)
    tensor_inventory = verify_tensor_inventory(manifests)
    if not tensor_inventory["all_manifest_hashes_verified"]:
        raise ContractError("tensor inventory failed manifest hash verification")

    next_action = "continue_no_training_crop_region_contract_scaffold"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BA",
        "active_prompt": "docs/model/return-to-form-split-signer-contract-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/audit_high_signal_split_signer_contract.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "input_artifacts": [file_reference(path) for path in INPUT_ARTIFACTS],
        "tensor_inventory": tensor_inventory,
        "commands": {
            "contract_generation": [sys.executable, *sys.argv],
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-split-signer-contract-v1.json",
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
            "manifest_mutated": False,
            "product_runtime_changed": False,
            "browser_or_final_claim_changed": False,
            "description": (
                "Loaded existing M3AZ/M3AY/M3AW/M3AX evidence and high-signal region-grid manifests, "
                "verified manifest-bound tensor hashes, summarized signer support and overlap, selected one "
                "generalization target, and recorded gates before any future training."
            ),
        },
        "prior_evidence": {
            "m3az": {
                "receipt_status": design["status"],
                "selected_remediation_lane": design["selected_remediation_lane"]["lane"],
                "selected_next_action": design["exactly_one_next_action"],
            },
            "m3ay": {
                "receipt_status": diagnosis["status"],
                "selected_next_action": diagnosis["exactly_one_next_action"],
                "prediction_patterns": diagnosis["prediction_patterns"],
                "manifest_signer_overlap": diagnosis["manifest_distribution"]["signer_overlap"],
            },
            "m3aw": {
                "receipt_status": m3aw_receipt["status"],
                "evaluation_metrics": m3aw_receipt["evaluation_metrics"],
                "validation_report_status": validation_report["status"],
                "prediction_sidecar_threshold": prediction_sidecar["selected_threshold"],
            },
            "m3ax": {
                "receipt_status": m3ax_receipt["status"],
                "tiny_subset_accuracy": m3ax_receipt["training_result"]["final_eval_metrics"]["accuracy"],
                "tiny_subset_zero_recall_labels": m3ax_receipt["training_result"]["final_eval_metrics"][
                    "zero_recall_labels"
                ],
            },
        },
        "signer_support": signer_support,
        "signer_support_matrix": signer_support_matrix(manifests),
        "signer_overlap": overlap,
        "selected_generalization_target": {
            "target": "signer_disjoint",
            "contract_status": "allowed_as_diagnostic_only_until_crop_region_and_label_gates_pass",
            "rationale": (
                "The current train, validation, and test manifests are already signer-disjoint overall and per label. "
                "That is the right honest target for recognizer generalization, but the M3AW held-out failure means "
                "another training prompt is blocked until crop/region and label-level repair gates are satisfied."
            ),
            "not_selected": [
                {
                    "target": "signer_overlap_diagnostic",
                    "why_not": (
                        "A signer-overlap diagnostic could test memorization or signer-specific leakage, but M3AX "
                        "already proved tiny memorization and M3BA's first contract needs to preserve the current "
                        "honest held-out target."
                    ),
                },
                {
                    "target": "fail_closed_product_fallback",
                    "why_not": (
                        "The browser/product state remains fail-closed, but existing evidence still supports one "
                        "bounded crop/region contract before stopping recognizer remediation entirely."
                    ),
                },
            ],
        },
        "label_decisions": label_decisions(diagnosis, manifests),
        "crop_region_gate_requirements": crop_region_gate_requirements(diagnosis),
        "contract_conclusions": [
            "The high-signal region-grid manifests are signer-disjoint across train, validation, and test.",
            "Empty train-to-held-out signer overlap is not treated as a bug; it is the selected diagnostic target.",
            "M3AW held-out failure remains non-promotional and blocks any training retry until crop/region and label gates are explicit.",
            "Labels please, sad, table, and white are held for repair before any next training prompt because they were never predicted on both held-out splits.",
            "The next useful bounded slice is a no-training crop/region contract scaffold, not Brev, training, export, browser activation, or product-runtime implementation.",
        ],
        "stop_conditions_requiring_human_approval": stop_conditions(),
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
                "This contract is not training, calibration, export, browser activation, final readiness, or evidence "
                "that the M3AW recognizer generalizes. The browser model remains not_trained/fail-closed."
            ),
            "pretrained_components": [],
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "manifest_mutated": False,
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
        print(f"M3BA split/signer contract failed: {error}", file=sys.stderr)
        return 2
    result = {
        "status": receipt["status"],
        "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
        "generalization_target": receipt["selected_generalization_target"]["target"],
        "next_action": receipt["exactly_one_next_action"],
        "tensor_file_count": receipt["tensor_inventory"]["tensor_file_count"],
        "train_validation_overlap": receipt["signer_overlap"]["overall"]["train_validation_overlap"],
        "train_test_overlap": receipt["signer_overlap"]["overall"]["train_test_overlap"],
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
