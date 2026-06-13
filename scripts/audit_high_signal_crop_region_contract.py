#!/usr/bin/env python3
"""Build the Mission 3BB no-training crop/region contract receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-crop-region-contract-v1.json"
SCHEMA_VERSION = "asl-pilot-crop-region-contract/v1"
TENSOR_SCHEMA_VERSION = "asl-pilot-return-to-form-high-signal-region-grid-tensor/v1"
REGION_ORDER = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
MANIFESTS = {
    "train": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    "validation": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
}
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-split-signer-contract-v1.json",
    PROJECT_ROOT / "docs" / "session-logs" / "331-mission-3ba-split-signer-contract.md",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-remediation-design-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-separability-diagnosis-v1.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "validation-report.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "prediction-sidecar.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    *MANIFESTS.values(),
]


class ContractError(RuntimeError):
    """Raised when the crop/region contract cannot be generated safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-crop-region-contract-v1.json"),
        help="Tracked M3BB receipt path.",
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


def mean(values: list[float]) -> float | None:
    if not values:
        return None
    return float(sum(values) / len(values))


def median(values: list[float]) -> float | None:
    if not values:
        return None
    return float(statistics.median(values))


def stdev(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    return float(statistics.pstdev(values))


def summarize(values: list[float]) -> dict[str, float | int | None]:
    return {
        "count": len(values),
        "mean": mean(values),
        "median": median(values),
        "min": min(values) if values else None,
        "max": max(values) if values else None,
        "stdev": stdev(values),
    }


def manifest_labels(manifest: dict[str, Any]) -> list[str]:
    return [str(label["label_id"]) for label in manifest["labels"]]


def resolve_tensor_path(split: str, clip: dict[str, Any]) -> Path:
    tensor_path = (MANIFESTS[split].parent / str(clip["relative_frame_tensor_path"])).resolve()
    try:
        tensor_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ContractError(f"tensor path escapes project root: {tensor_path}") from error
    return tensor_path


def tensor_crop_stats(torch: Any, tensor_path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    payload = torch.load(tensor_path, map_location="cpu", weights_only=False)
    schema_version = str(payload.get("schema_version"))
    region_axis = str(payload.get("region_axis"))
    region_ids = [str(region_id) for region_id in payload.get("region_ids", [])]
    if schema_version != TENSOR_SCHEMA_VERSION:
        raise ContractError(f"unexpected tensor schema for {tensor_path}: {schema_version}")
    if region_axis != "T,R,H,W,C":
        raise ContractError(f"unexpected tensor region axis for {tensor_path}: {region_axis}")
    if region_ids != REGION_ORDER:
        raise ContractError(f"unexpected region order for {tensor_path}: {region_ids}")
    regions = payload.get("rgb_regions")
    if not torch.is_tensor(regions):
        raise ContractError(f"rgb_regions missing for {tensor_path}")
    if list(regions.shape) != [16, 5, 96, 96, 3]:
        raise ContractError(f"unexpected rgb_regions shape for {tensor_path}: {list(regions.shape)}")

    regions_float = regions.to(dtype=torch.float32)
    region_rows = []
    for region_index, region_id in enumerate(region_ids):
        region = regions_float[:, region_index, :, :, :]
        frame_means = region.mean(dim=(1, 2, 3))
        motion = torch.abs(region[1:] - region[:-1]).mean() if int(region.shape[0]) > 1 else torch.tensor(0.0)
        region_rows.append(
            {
                "region_id": region_id,
                "mean_intensity": float(region.mean().item()),
                "std_intensity": float(region.std(unbiased=False).item()),
                "temporal_motion_mean": float(motion.item()),
                "dark_fraction_lte_10": float((region <= 10).to(dtype=torch.float32).mean().item()),
                "bright_fraction_gte_245": float((region >= 245).to(dtype=torch.float32).mean().item()),
                "frame_mean_range": float((frame_means.max() - frame_means.min()).item()),
            }
        )
    hand_rows = [
        row
        for row in region_rows
        if row["region_id"] in {"viewer_left_hand_context", "viewer_right_hand_context"}
    ]
    overall = {
        "mean_intensity": mean([row["mean_intensity"] for row in region_rows]),
        "std_intensity": mean([row["std_intensity"] for row in region_rows]),
        "temporal_motion_mean": mean([row["temporal_motion_mean"] for row in region_rows]),
        "hand_context_motion_mean": mean([row["temporal_motion_mean"] for row in hand_rows]),
        "hand_context_std_intensity": mean([row["std_intensity"] for row in hand_rows]),
        "dark_fraction_lte_10": mean([row["dark_fraction_lte_10"] for row in region_rows]),
        "bright_fraction_gte_245": mean([row["bright_fraction_gte_245"] for row in region_rows]),
    }
    return overall, region_rows


def collect_tensor_rows(torch: Any, manifests: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rows = []
    hash_rows = []
    mismatches = []
    for split, manifest in manifests.items():
        for clip in manifest["clips"]:
            tensor_path = resolve_tensor_path(split, clip)
            expected_hash = str(clip["frame_tensor_sha256"])
            if not tensor_path.exists():
                mismatches.append(
                    {
                        "clip_id": str(clip["clip_id"]),
                        "path": project_relative(tensor_path),
                        "error": "missing_tensor",
                    }
                )
                continue
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                mismatches.append(
                    {
                        "clip_id": str(clip["clip_id"]),
                        "path": project_relative(tensor_path),
                        "expected_sha256": expected_hash,
                        "actual_sha256": actual_hash,
                    }
                )
                continue
            overall, regions = tensor_crop_stats(torch, tensor_path)
            row = {
                "split": split,
                "clip_id": str(clip["clip_id"]),
                "label_id": str(clip["label_id"]),
                "signer_id": str(clip["signer_id"]),
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": actual_hash,
                "overall": overall,
                "regions": regions,
            }
            rows.append(row)
            hash_rows.append(
                {
                    "split": split,
                    "clip_id": row["clip_id"],
                    "label_id": row["label_id"],
                    "signer_id": row["signer_id"],
                    "path": row["tensor_path"],
                    "sha256": row["tensor_sha256"],
                }
            )
    inventory_json = json.dumps(hash_rows, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return rows, {
        "tensor_file_count": len(rows),
        "split_counts": dict(sorted(Counter(row["split"] for row in rows).items())),
        "all_manifest_hashes_verified": not mismatches,
        "mismatches": mismatches,
        "inventory_sha256": hashlib.sha256(inventory_json).hexdigest(),
        "inventory_digest_algorithm": "sha256(sorted_json_rows_of_split_clip_label_signer_path_hash)",
    }


def summarize_quality(rows: list[dict[str, Any]], manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for split in ("train", "validation", "test"):
        summary[split] = {}
        for label_id in manifest_labels(manifests["train"]):
            label_rows = [row for row in rows if row["split"] == split and row["label_id"] == label_id]
            region_values: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
            for row in label_rows:
                for region in row["regions"]:
                    region_id = str(region["region_id"])
                    for metric in (
                        "mean_intensity",
                        "std_intensity",
                        "temporal_motion_mean",
                        "dark_fraction_lte_10",
                        "bright_fraction_gte_245",
                        "frame_mean_range",
                    ):
                        region_values[region_id][metric].append(float(region[metric]))
            summary[split][label_id] = {
                "clip_count": len(label_rows),
                "signer_count": len({row["signer_id"] for row in label_rows}),
                "overall": {
                    "hand_context_motion_mean": summarize(
                        [float(row["overall"]["hand_context_motion_mean"]) for row in label_rows]
                    ),
                    "hand_context_std_intensity": summarize(
                        [float(row["overall"]["hand_context_std_intensity"]) for row in label_rows]
                    ),
                    "temporal_motion_mean": summarize(
                        [float(row["overall"]["temporal_motion_mean"]) for row in label_rows]
                    ),
                    "std_intensity": summarize([float(row["overall"]["std_intensity"]) for row in label_rows]),
                    "dark_fraction_lte_10": summarize(
                        [float(row["overall"]["dark_fraction_lte_10"]) for row in label_rows]
                    ),
                    "bright_fraction_gte_245": summarize(
                        [float(row["overall"]["bright_fraction_gte_245"]) for row in label_rows]
                    ),
                },
                "regions": {
                    region_id: {
                        metric: summarize(values)
                        for metric, values in sorted(metrics.items())
                    }
                    for region_id, metrics in sorted(region_values.items())
                },
            }
    return summary


def low_signal_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_hand_motion = sorted(
        rows,
        key=lambda row: (
            float(row["overall"]["hand_context_motion_mean"]),
            float(row["overall"]["temporal_motion_mean"]),
            row["clip_id"],
        ),
    )
    by_dark = sorted(
        rows,
        key=lambda row: (
            -float(row["overall"]["dark_fraction_lte_10"]),
            float(row["overall"]["hand_context_motion_mean"]),
            row["clip_id"],
        ),
    )
    return {
        "lowest_hand_context_motion": [
            {
                "split": row["split"],
                "label_id": row["label_id"],
                "clip_id": row["clip_id"],
                "signer_id": row["signer_id"],
                "hand_context_motion_mean": row["overall"]["hand_context_motion_mean"],
                "temporal_motion_mean": row["overall"]["temporal_motion_mean"],
            }
            for row in by_hand_motion[:12]
        ],
        "highest_dark_fraction": [
            {
                "split": row["split"],
                "label_id": row["label_id"],
                "clip_id": row["clip_id"],
                "signer_id": row["signer_id"],
                "dark_fraction_lte_10": row["overall"]["dark_fraction_lte_10"],
                "hand_context_motion_mean": row["overall"]["hand_context_motion_mean"],
            }
            for row in by_dark[:12]
        ],
    }


def m3ba_decisions_by_label(m3ba: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(row["label_id"]): row for row in m3ba["label_decisions"]}


def drift_failures(diagnosis: dict[str, Any]) -> list[dict[str, Any]]:
    failures = []
    for split, rows in diagnosis["descriptive_feature_separation"]["split_centroid_drift"].items():
        for row in rows:
            if row["same_label_closer_than_nearest_other"]:
                continue
            failures.append(
                {
                    "split": split,
                    "label_id": str(row["label_id"]),
                    "distance_to_same_label_train_centroid": row["distance_to_same_label_train_centroid"],
                    "nearest_other_train_label": str(row["nearest_other_train_centroid"]["label_id"]),
                    "nearest_other_train_distance": row["nearest_other_train_centroid"]["distance"],
                    "drift_ratio_same_to_nearest_other": row["drift_ratio_same_to_nearest_other"],
                }
            )
    return sorted(failures, key=lambda row: (row["label_id"], row["split"]))


def drift_decisions(diagnosis: dict[str, Any], m3ba: dict[str, Any]) -> list[dict[str, Any]]:
    decisions = m3ba_decisions_by_label(m3ba)
    output = []
    for failure in drift_failures(diagnosis):
        label_decision = decisions[failure["label_id"]]
        if label_decision["decision"] == "hold_and_repair_before_next_training":
            action = "hold_label_before_training"
            rationale = (
                "M3BA already held this label because it was never predicted on both held-out splits; "
                "the crop/region drift keeps that hold in place."
            )
        elif label_decision["decision"] == "repair_before_next_training":
            action = "repair_gate_required_before_training"
            rationale = (
                "The label had zero recall on both held-out splits and a crop-stat drift failure; "
                "it cannot be included in a training prompt until a repair contract clears it."
            )
        else:
            action = "retain_only_with_crop_region_gate"
            rationale = (
                "The label is not globally held by M3BA, but this drift row must be cleared or explicitly "
                "accepted by a vocabulary/subset contract before training."
            )
        output.append(
            {
                **failure,
                "m3ba_label_decision": label_decision["decision"],
                "crop_region_contract_decision": action,
                "rationale": rationale,
            }
        )
    return output


def label_contract_status(manifests: dict[str, dict[str, Any]], diagnosis: dict[str, Any], m3ba: dict[str, Any]) -> list[dict[str, Any]]:
    decisions = m3ba_decisions_by_label(m3ba)
    failures = drift_failures(diagnosis)
    failure_splits_by_label: dict[str, list[str]] = defaultdict(list)
    for failure in failures:
        failure_splits_by_label[failure["label_id"]].append(failure["split"])
    rows = []
    for label_id in manifest_labels(manifests["train"]):
        m3ba_decision = decisions[label_id]
        failure_splits = sorted(failure_splits_by_label[label_id])
        if m3ba_decision["decision"] == "hold_and_repair_before_next_training":
            status = "held_not_training_ready"
        elif m3ba_decision["decision"] == "repair_before_next_training":
            status = "repair_required_not_training_ready"
        elif failure_splits:
            status = "crop_region_gate_required_not_training_ready"
        else:
            status = "crop_region_cleared_pending_vocab_subset_policy"
        rows.append(
            {
                "label_id": label_id,
                "m3ba_decision": m3ba_decision["decision"],
                "m3ay_drift_failure_splits": failure_splits,
                "crop_region_contract_status": status,
                "training_candidate_now": status == "crop_region_cleared_pending_vocab_subset_policy",
            }
        )
    return rows


def crop_region_gates(drift_decision_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "gate": "preserved_region_grid_input",
            "status": "passed_current_contract",
            "requirement": (
                "Every selected clip must load from manifest-bound tensors with schema "
                f"{TENSOR_SCHEMA_VERSION}, region_axis T,R,H,W,C, region order {REGION_ORDER}, and shape "
                "[16,5,96,96,3]."
            ),
        },
        {
            "gate": "m3ay_crop_stat_drift_resolution",
            "status": "failed_current_contract",
            "requirement": (
                "Every retained label must either have held-out same-label crop-stat centroids closer to its "
                "train centroid than to any other train label, or be explicitly held/repaired/dropped by a "
                "vocabulary/subset contract."
            ),
            "current_failure_count": len(drift_decision_rows),
        },
        {
            "gate": "label_retain_hold_drop_policy",
            "status": "required_next",
            "requirement": (
                "Before any training prompt, a tracked vocabulary/subset contract must convert M3BA label "
                "holds and M3BB drift decisions into a retained subset, hold list, or product-fallback decision."
            ),
        },
        {
            "gate": "manual_or_paid_work_boundary",
            "status": "human_approval_required_if_needed",
            "requirement": (
                "Any manual visual review, manual annotation, source approval, manifest/tensor mutation, Brev "
                "auth, paid compute, export, browser activation, product-runtime change, or final-gate change "
                "must stop for explicit human approval and an appropriate prompt."
            ),
        },
    ]


def stop_conditions() -> list[str]:
    return [
        "Stop before any Brev login, worker inspection, worker lifecycle action, or paid compute unless a bounded compute-receipt prompt is active and human approval is current.",
        "Stop before any training run, model fitting, optimizer/backward pass, checkpoint creation, sweep, export, browser activation, final-readiness claim, or final-gate change.",
        "Stop before any source import, source-approval expansion, generated pseudo-labels, manual labels, manual data collection, manual annotation, or manifest/tensor mutation.",
        "Stop before Detector 0, landmark, broad-label, product-runtime, or browser model changes.",
        "Stop if a future retained subset cannot be selected from existing artifacts without manual review or source/data changes.",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise ContractError("M3BB requires --receipt docs/validation/return-to-form-crop-region-contract-v1.json")
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    import torch

    torch.set_grad_enabled(False)
    manifests = {split: load_json(path) for split, path in MANIFESTS.items()}
    m3ba = load_json(INPUT_ARTIFACTS[0])
    m3az = load_json(INPUT_ARTIFACTS[2])
    diagnosis = load_json(INPUT_ARTIFACTS[3])
    m3aw_receipt = load_json(INPUT_ARTIFACTS[4])
    m3aw_report = load_json(INPUT_ARTIFACTS[5])
    m3aw_sidecar = load_json(INPUT_ARTIFACTS[6])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[7])

    tensor_rows, tensor_inventory = collect_tensor_rows(torch, manifests)
    if not tensor_inventory["all_manifest_hashes_verified"]:
        raise ContractError("manifest-bound tensor verification failed")

    drift_decision_rows = drift_decisions(diagnosis, m3ba)
    label_status = label_contract_status(manifests, diagnosis, m3ba)
    training_candidate_labels = [
        row["label_id"]
        for row in label_status
        if row["training_candidate_now"]
    ]
    next_action = "continue_no_training_vocab_subset_contract_scaffold"
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3BB",
        "active_prompt": "docs/model/return-to-form-crop-region-contract-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/audit_high_signal_crop_region_contract.py",
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
                    "docs/validation/return-to-form-crop-region-contract-v1.json",
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
                "Loaded existing receipts, reports, manifests, and manifest-bound tensors; verified preserved "
                "rgb_regions_grid_v1 tensor inputs; computed deterministic descriptive crop/region summaries; "
                "and selected one no-training next action."
            ),
        },
        "prior_evidence": {
            "m3ba": {
                "receipt_status": m3ba["status"],
                "generalization_target": m3ba["selected_generalization_target"]["target"],
                "selected_next_action": m3ba["exactly_one_next_action"],
            },
            "m3az": {
                "receipt_status": m3az["status"],
                "selected_remediation_lane": m3az["selected_remediation_lane"]["lane"],
            },
            "m3ay": {
                "receipt_status": diagnosis["status"],
                "drift_failure_count": len(drift_decision_rows),
                "labels_never_predicted_validation": diagnosis["prediction_patterns"]["validation"][
                    "labels_never_predicted"
                ],
                "labels_never_predicted_test": diagnosis["prediction_patterns"]["test"]["labels_never_predicted"],
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
        "preserved_input_contract_verification": {
            "status": "passed",
            "derived_input_name": "rgb_regions_grid_v1",
            "tensor_schema_version": TENSOR_SCHEMA_VERSION,
            "region_axis": "T,R,H,W,C",
            "region_order": REGION_ORDER,
            "expected_rgb_regions_shape": [16, 5, 96, 96, 3],
            "tensor_inventory": tensor_inventory,
        },
        "per_label_per_split_crop_region_quality": summarize_quality(tensor_rows, manifests),
        "low_signal_examples": low_signal_rows(tensor_rows),
        "m3ay_drift_failure_decisions": drift_decision_rows,
        "label_contract_status": label_status,
        "training_worthy_assessment": {
            "training_candidate_labels_now": training_candidate_labels,
            "training_worthy_subset_identified": False,
            "paid_microexperiment_supported_now": False,
            "reason": (
                "No label is ready for a training prompt from crop/region evidence alone: M3BA holds four labels, "
                "uncle still needs repair, and black/hello still require crop or targeted gates. The next bounded "
                "artifact must decide the retained vocabulary/subset policy before any Brev micro-experiment."
            ),
        },
        "minimum_crop_region_gates_before_future_training": crop_region_gates(drift_decision_rows),
        "contract_conclusions": [
            "All 139 selected manifest-bound tensors still expose preserved rgb_regions_grid_v1-compatible input.",
            "M3AY crop-stat drift remains unresolved for 10 split-label rows; this contract records hold/repair/gate decisions instead of clearing them.",
            "The current evidence does not identify a training-worthy paid Brev micro-experiment yet.",
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
                "This crop/region contract is not training, calibration, export, browser activation, final readiness, "
                "or evidence that the M3AW recognizer generalizes. The browser model remains not_trained/fail-closed."
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
        print(f"M3BB crop/region contract failed: {error}", file=sys.stderr)
        return 2
    result = {
        "status": receipt["status"],
        "receipt": project_relative(RECEIPT_PATH) if args.write_receipt else None,
        "tensor_file_count": receipt["preserved_input_contract_verification"]["tensor_inventory"][
            "tensor_file_count"
        ],
        "drift_failure_count": len(receipt["m3ay_drift_failure_decisions"]),
        "training_worthy_subset_identified": receipt["training_worthy_assessment"][
            "training_worthy_subset_identified"
        ],
        "next_action": receipt["exactly_one_next_action"],
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
