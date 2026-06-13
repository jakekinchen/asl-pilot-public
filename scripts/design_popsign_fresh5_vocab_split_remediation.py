#!/usr/bin/env python3
"""Build the M3BX PopSign fresh5 no-training remediation design packet."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-vocab-split-remediation/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")

ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-vocab-split-remediation-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
POPSIGN_IMPORT_PLAN = Path("docs/research/popsign-v1-import-plan.json")
VOCABULARY_REVIEW = Path("data/active-module/active-module-vocabulary-review.json")
SUPPORTED_CANDIDATES = Path("docs/validation/return-to-form-supported-raw-source-candidates-v1.json")

M3BW_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json")
M3BW_LOG = Path("docs/session-logs/379-mission-3bw-popsign-fresh5-data-vocabulary-separability.md")
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json")
M3BS_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json")
M3BU_REPORT = Path("output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json")
M3BU_SIDECAR = Path("output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json")

MANIFESTS = {
    "train": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/train.json"),
    "validation": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json"),
    "test": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/test.json"),
}

ALLOWED_NEXT_ACTIONS = [
    "continue_fresh5_repaired_manifest_contract",
    "continue_fresh10_region_grid_materialization",
    "continue_detector0_or_crop_contract_for_fresh5",
    "continue_bounded_brev_training_receipt_for_fresh5_region_grid",
    "stop_until_supported_training_signal_exists",
    "stop_for_human_source_annotation_or_strategy_decision",
]

FRESH5_REPAIR_CONTRACT_ID = "popsign_fresh5_source_quality_split_contract_v1"


class RemediationError(RuntimeError):
    """Raised when the no-training design packet cannot be completed."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise RemediationError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise RemediationError(f"required path does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, Any]:
    resolved = project_path(path)
    return {
        "path": project_relative(resolved),
        "sha256": sha256_file(resolved),
    }


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path)
    with resolved.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise RemediationError(f"JSON root must be an object: {project_relative(resolved)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    resolved = project_path(path, must_exist=False)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8") as handle:
        json.dump(json_ready(value), handle, indent=2, sort_keys=True)
        handle.write("\n")


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    if isinstance(value, set):
        return sorted(json_ready(item) for item in value)
    if isinstance(value, Path):
        return project_relative(value)
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    return value


def rounded(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def run_git(args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=PROJECT_ROOT,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout.strip()


def input_artifacts() -> dict[str, Any]:
    return {
        "steering": {
            "goal": file_reference(Path("GOAL.md")),
            "active_prompt": file_reference(ACTIVE_PROMPT),
            "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        },
        "m3bw": {
            "receipt": file_reference(M3BW_RECEIPT),
            "session_log": file_reference(M3BW_LOG),
        },
        "receipts": {
            "m3bv": file_reference(M3BV_RECEIPT),
            "m3bu": file_reference(M3BU_RECEIPT),
            "m3bt": file_reference(M3BT_RECEIPT),
            "m3bs": file_reference(M3BS_RECEIPT),
        },
        "m3bu_outputs": {
            "validation_report": file_reference(M3BU_REPORT),
            "prediction_sidecar": file_reference(M3BU_SIDECAR),
        },
        "manifests": {split: file_reference(path) for split, path in MANIFESTS.items()},
        "source_metadata": {
            "source_register": file_reference(SOURCE_REGISTER),
            "popsign_import_plan": file_reference(POPSIGN_IMPORT_PLAN),
            "active_module_vocabulary_review": file_reference(VOCABULARY_REVIEW),
            "supported_raw_source_candidates": file_reference(SUPPORTED_CANDIDATES),
        },
    }


def load_manifests() -> dict[str, dict[str, Any]]:
    return {split: load_json(path) for split, path in MANIFESTS.items()}


def manifest_label_ids(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise RemediationError("manifest lacks labels list")
    result = []
    for label in labels:
        if not isinstance(label, dict) or not label.get("label_id"):
            raise RemediationError("manifest label entry lacks label_id")
        result.append(str(label["label_id"]))
    return result


def manifest_profiles(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    profiles: dict[str, Any] = {}
    signer_hashes_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split_label: dict[tuple[str, str], set[str]] = {}
    source_records_by_split: dict[str, set[str]] = {}

    for split, manifest in manifests.items():
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise RemediationError(f"{split} manifest lacks clips list")
        labels = manifest_label_ids(manifest)
        label_counts: Counter[str] = Counter()
        source_split_counts: Counter[str] = Counter()
        signer_hashes: set[str] = set()
        source_records: set[str] = set()
        tensor_reference_count = 0
        tensor_sha_count = 0
        signer_hashes_by_label: dict[str, set[str]] = {label: set() for label in labels}
        source_records_by_label: dict[str, set[str]] = {label: set() for label in labels}
        duplicate_source_records: Counter[str] = Counter()
        record_counter: Counter[str] = Counter()

        for clip in clips:
            if not isinstance(clip, dict):
                raise RemediationError(f"{split} manifest contains non-object clip")
            label = str(clip.get("label_id") or "")
            signer_hash = str(clip.get("signer_identity_hash") or "")
            source_record_id = str(clip.get("source_record_id") or "")
            label_counts[label] += 1
            source_split_counts[str(clip.get("source_split") or "")] += 1
            if signer_hash:
                signer_hashes.add(signer_hash)
                signer_hashes_by_label.setdefault(label, set()).add(signer_hash)
            if source_record_id:
                source_records.add(source_record_id)
                source_records_by_label.setdefault(label, set()).add(source_record_id)
                record_counter[source_record_id] += 1
            if clip.get("relative_frame_tensor_path"):
                tensor_reference_count += 1
            if clip.get("frame_tensor_sha256"):
                tensor_sha_count += 1

        for record_id, count in record_counter.items():
            if count > 1:
                duplicate_source_records[record_id] = count

        signer_hashes_by_split[split] = signer_hashes
        source_records_by_split[split] = source_records
        for label, hashes in signer_hashes_by_label.items():
            signer_hashes_by_split_label[(split, label)] = hashes

        profiles[split] = {
            "clip_count": len(clips),
            "labels": labels,
            "label_counts": dict(sorted(label_counts.items())),
            "source_split_counts": dict(sorted(source_split_counts.items())),
            "signer_identity_hash_count": len(signer_hashes),
            "signer_identity_hash_count_by_label": {
                label: len(hashes) for label, hashes in sorted(signer_hashes_by_label.items())
            },
            "source_record_id_count": len(source_records),
            "source_record_id_count_by_label": {
                label: len(records) for label, records in sorted(source_records_by_label.items())
            },
            "duplicate_source_record_ids": dict(sorted(duplicate_source_records.items())),
            "tensor_reference_count": tensor_reference_count,
            "tensor_sha256_count": tensor_sha_count,
            "dataset_source_mode": manifest.get("dataset_source_mode"),
            "source_id": (manifest.get("external_dataset_import") or {}).get("source_id"),
        }

    labels = sorted({label for manifest in manifests.values() for label in manifest_label_ids(manifest)})
    overlaps: dict[str, Any] = {}
    for left, right in (("train", "validation"), ("train", "test"), ("validation", "test")):
        overlaps[f"{left}_vs_{right}"] = {
            "shared_signer_identity_hash_count": len(signer_hashes_by_split[left] & signer_hashes_by_split[right]),
            "shared_source_record_id_count": len(source_records_by_split[left] & source_records_by_split[right]),
            "label_shared_signer_identity_hash_count": {
                label: len(
                    signer_hashes_by_split_label.get((left, label), set())
                    & signer_hashes_by_split_label.get((right, label), set())
                )
                for label in labels
            },
        }

    min_signers_by_label = {
        label: min(
            profiles[split]["signer_identity_hash_count_by_label"].get(label, 0)
            for split in ("train", "validation", "test")
        )
        for label in labels
    }

    return {
        "selected_labels": labels,
        "splits": profiles,
        "split_overlaps": overlaps,
        "min_signer_identity_hashes_per_label_across_splits": dict(sorted(min_signers_by_label.items())),
        "source_split_boundaries_preserved": all(
            profiles[split]["source_split_counts"] == {("val" if split == "validation" else split): profiles[split]["clip_count"]}
            for split in profiles
        ),
        "all_clips_have_tensor_reference_and_sha256": all(
            profiles[split]["tensor_reference_count"] == profiles[split]["clip_count"]
            and profiles[split]["tensor_sha256_count"] == profiles[split]["clip_count"]
            for split in profiles
        ),
    }


def source_register_popsign_status(source_register: dict[str, Any]) -> dict[str, Any]:
    sources = source_register.get("sources")
    if not isinstance(sources, list):
        raise RemediationError("source register lacks sources list")
    for source in sources:
        if isinstance(source, dict) and source.get("source_id") == "popsign-v1-original-videos":
            return {
                "source_id": source.get("source_id"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "allowed_for_validation": source.get("allowed_for_validation"),
                "allowed_for_pilot_submission": source.get("allowed_for_pilot_submission"),
                "license_review_status": source.get("license_review_status"),
                "decision_id": source.get("decision_id"),
                "restrictions": source.get("restrictions", []),
            }
    raise RemediationError("source register lacks popsign-v1-original-videos")


def current_label_risk_table(
    selected_labels: list[str],
    manifest_profile: dict[str, Any],
    m3bw: dict[str, Any],
    m3bu: dict[str, Any],
) -> list[dict[str, Any]]:
    error_concentration = m3bw.get("m3bu_error_concentration", {})
    per_true_label = error_concentration.get("per_true_label", {})
    predicted_fraction = error_concentration.get("predicted_label_fraction", {})
    test_metrics = (((m3bu.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("per_class") or {})
    tensor_summary = m3bw.get("tensor_motion_region_summary", {})
    rows = []
    for label in selected_labels:
        split_signers = {
            split: manifest_profile["splits"][split]["signer_identity_hash_count_by_label"].get(label, 0)
            for split in ("train", "validation", "test")
        }
        split_counts = {
            split: manifest_profile["splits"][split]["label_counts"].get(label, 0)
            for split in ("train", "validation", "test")
        }
        true_row = per_true_label.get(label, {})
        dominant_wrong = true_row.get("dominant_wrong_prediction")
        tensor_low_motion = {
            split: (tensor_summary.get(f"{split}:{label}", {}) or {}).get("low_hand_motion_fraction")
            for split in ("train", "validation", "test")
        }
        recall = (test_metrics.get(label) or {}).get("recall", true_row.get("recall"))
        risk_flags = []
        if recall is not None and float(recall) < 0.2:
            risk_flags.append("low_test_recall")
        if isinstance(dominant_wrong, dict) and dominant_wrong.get("predicted_label") == "thank_you":
            risk_flags.append("thank_you_absorption")
        if label == "thank_you" and float(predicted_fraction.get(label, 0.0)) > 0.4:
            risk_flags.append("overpredicted_confuser")
        if min(split_signers.values()) < 6:
            risk_flags.append("low_min_signer_coverage")
        if any(value is not None and float(value) > 0.05 for value in tensor_low_motion.values()):
            risk_flags.append("low_hand_motion_quality_risk")
        rows.append(
            {
                "label_id": label,
                "split_clip_counts": split_counts,
                "split_signer_identity_hash_counts": split_signers,
                "m3bu_test_recall": recall,
                "m3bu_predicted_label_fraction": predicted_fraction.get(label),
                "dominant_wrong_prediction": dominant_wrong,
                "tensor_low_hand_motion_fraction": tensor_low_motion,
                "risk_flags": risk_flags,
                "contract_status": "repair_gate_required" if risk_flags else "covered_but_still_gate_required",
            }
        )
    return rows


def baseline_comparison(m3bw: dict[str, Any], m3bv: dict[str, Any], m3bu: dict[str, Any], m3bt: dict[str, Any], m3bs: dict[str, Any]) -> dict[str, Any]:
    return {
        "m3bs_full_frame": {
            "status": m3bs.get("status"),
            "test_top1_accuracy": (((m3bs.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("top1_accuracy")),
            "test_macro_f1": (((m3bs.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("macro_f1")),
            "test_false_pass_rate": (((m3bs.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("false_pass_rate")),
            "exactly_one_next_action": m3bs.get("exactly_one_next_action"),
        },
        "m3bt_region_grid_materialization": {
            "status": m3bt.get("status"),
            "input_contract": m3bt.get("input_contract"),
            "tensor_count": ((m3bt.get("aggregate") or {}).get("tensor_count")),
            "missing_file_count": ((m3bt.get("aggregate") or {}).get("missing_file_count")),
            "exactly_one_next_action": m3bt.get("exactly_one_next_action"),
        },
        "m3bu_region_grid_smoke": {
            "status": m3bu.get("status"),
            "test_top1_accuracy": (((m3bu.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("top1_accuracy")),
            "test_macro_f1": (((m3bu.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("macro_f1")),
            "test_false_pass_rate": (((m3bu.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("false_pass_rate")),
            "pen_test_recall": ((((m3bu.get("smoke_evaluation") or {}).get("test_metrics") or {}).get("per_class") or {}).get("pen") or {}).get("recall"),
            "exactly_one_next_action": m3bu.get("exactly_one_next_action"),
        },
        "m3bv_preserved_region_tiny_overfit": {
            "status": m3bv.get("status"),
            "final_accuracy": (((m3bv.get("ablation") or {}).get("memorization_metrics") or {}).get("final_accuracy")),
            "zero_recall_labels": (((m3bv.get("ablation") or {}).get("memorization_metrics") or {}).get("zero_recall_labels")),
            "preserve_region_axis": (((m3bv.get("ablation") or {}).get("input_contract") or {}).get("preserve_region_axis")),
            "exactly_one_next_action": m3bv.get("exactly_one_next_action"),
        },
        "m3bw_separability": {
            "status": m3bw.get("status"),
            "blocker_classification": (m3bw.get("decision") or {}).get("blocker_classification"),
            "thank_you_prediction_fraction": ((m3bw.get("m3bu_error_concentration") or {}).get("predicted_label_fraction") or {}).get("thank_you"),
            "pen_test_recall": ((m3bw.get("m3bu_error_concentration") or {}).get("per_true_label") or {}).get("pen", {}).get("recall"),
            "exactly_one_next_action": m3bw.get("exactly_one_next_action"),
        },
    }


def find_recommended_packet(candidates: dict[str, Any], packet_id: str) -> dict[str, Any] | None:
    packets = candidates.get("recommended_packets")
    if not isinstance(packets, list):
        return None
    for packet in packets:
        if isinstance(packet, dict) and packet.get("packet_id") == packet_id:
            return packet
    return None


def remediation_contract(
    selected_labels: list[str],
    manifest_profile: dict[str, Any],
    popsign_source: dict[str, Any],
) -> dict[str, Any]:
    return {
        "contract_id": FRESH5_REPAIR_CONTRACT_ID,
        "purpose": "Verify a same-label PopSign fresh5 manifest/split/source-quality contract before any further training or compute planning.",
        "labels": selected_labels,
        "source_policy": {
            "source_id": popsign_source["source_id"],
            "license_review_status": popsign_source["license_review_status"],
            "decision_id": popsign_source["decision_id"],
            "preserve_popsign_train_val_test_boundaries": True,
            "do_not_repair_by_cross_split_leakage": True,
            "no_new_source_import_or_source_register_change": True,
        },
        "manifest_gates_before_training": [
            {
                "gate": "same_labels_only",
                "requirement": "Keep thank_you, pen, home, who, and morning unchanged; do not widen or drop labels in the repaired fresh5 contract.",
            },
            {
                "gate": "source_split_boundaries",
                "requirement": "Preserve PopSign train/val/test source splits; signer-disjoint validation remains a hard evaluation property, not something to erase by overlap.",
            },
            {
                "gate": "per_label_counts",
                "requirement": "At least 25 hash-pinned clips per label in each source split, matching the current local evidence.",
                "current_status": {
                    split: manifest_profile["splits"][split]["label_counts"] for split in ("train", "validation", "test")
                },
            },
            {
                "gate": "signer_coverage",
                "requirement": "At least 6 pseudonymous signer hashes per label per split before any training command is considered.",
                "current_min_by_label": manifest_profile["min_signer_identity_hashes_per_label_across_splits"],
            },
            {
                "gate": "dedupe",
                "requirement": "No source_record_id duplication within or across train/validation/test.",
                "current_overlap": manifest_profile["split_overlaps"],
            },
            {
                "gate": "tensor_contract",
                "requirement": "Every retained clip must have rgb_regions_grid_v1 tensor evidence with frame tensor SHA-256 and no missing files; no fallback to rgb_frames.",
                "current_all_clips_have_tensor_reference_and_sha256": manifest_profile[
                    "all_clips_have_tensor_reference_and_sha256"
                ],
            },
            {
                "gate": "quality_and_confusion_risk",
                "requirement": "The next no-training contract must explicitly flag pen low recall and thank_you absorption as training stop conditions, not hide them.",
            },
        ],
        "training_stop_conditions_for_later_prompt": [
            "Do not train if any manifest gate above fails.",
            "Do not train if a future no-training contract cannot explain whether pen has adequate split/source quality.",
            "Do not plan Brev unless a later local region-axis-preserving smoke beats M3BU on top1, macro F1, pen recall, and prediction concentration.",
        ],
    }


def route_evaluation(
    fresh10_packet: dict[str, Any] | None,
    m3bw: dict[str, Any],
) -> dict[str, Any]:
    return {
        "continue_fresh5_repaired_manifest_contract": {
            "supported": True,
            "selected": True,
            "reason": "Current fresh5 is not cleared for training, but source approval, per-split coverage, tensor inventory, and M3BV train-fit evidence support one no-training manifest/split/source-quality repair contract before any more classifier work.",
        },
        "continue_fresh10_region_grid_materialization": {
            "supported_by_source_lane": fresh10_packet is not None,
            "selected": False,
            "candidate_packet": fresh10_packet,
            "reason": "The approved PopSign lane contains a fresh10 candidate, but M3BW did not show that widening labels is the immediate fix; scaling before repairing the fresh5 split/source-quality blocker would expand an unresolved failure mode.",
        },
        "continue_detector0_or_crop_contract_for_fresh5": {
            "supported": False,
            "selected": False,
            "reason": "M3BT/M3BV prove the region-grid tensor/input path exists, and M3BW tensor-motion summaries did not show a decisive empty hand-region failure.",
        },
        "continue_bounded_brev_training_receipt_for_fresh5_region_grid": {
            "supported": False,
            "selected": False,
            "reason": "M3BU held-out metrics remain weak and M3BW classified the blocker as data/vocabulary/split/source distribution, so compute planning would be premature.",
        },
        "stop_until_supported_training_signal_exists": {
            "supported": False,
            "selected": False,
            "reason": "A bounded local no-training repair-contract slice remains available from existing approved artifacts.",
        },
        "stop_for_human_source_annotation_or_strategy_decision": {
            "supported": False,
            "selected": False,
            "reason": "The next selected step uses the same approved PopSign raw-source lane and does not require new source approval, annotation approval, budget, label expansion, crop target, or product scope approval.",
        },
        "m3bw_reference": {
            "blocker_classification": (m3bw.get("decision") or {}).get("blocker_classification"),
            "m3bw_selected_next_action": m3bw.get("exactly_one_next_action"),
        },
    }


def conclusions() -> dict[str, Any]:
    return {
        "blocker_classification": "fresh5_manifest_split_source_quality_contract_needed",
        "current_fresh5_repairability": {
            "repairable_by_no_training_contract": True,
            "too_fragile_to_continue_as_is": True,
            "rationale": [
                "The same labels have complete approved source/tensor coverage, and M3BV proves the preserved-region path can fit a tiny train subset.",
                "The held-out failure is concentrated around pen recall and thank_you overprediction, so another blind training run or Brev receipt is unsupported.",
                "The current source-split signer-disjointness is real and should remain an evaluation property, but a future contract can verify source quality and label risk before training.",
            ],
        },
        "fresh10_assessment": {
            "same_approved_lane_supports_design_or_materialization_later": True,
            "selected_now": False,
            "rationale": "Fresh10 can be considered after the current fresh5 split/source-quality contract is verified or blocked; widening now would not explain the observed fresh5 failure.",
        },
        "crop_or_region_target_assessment": {
            "selected_now": False,
            "rationale": "No decisive crop/region-target defect is visible in M3BW, and the preserved-region input path is already proven for train-fit.",
        },
        "brev_or_browser_assessment": {
            "brev_compute_receipt_justified_now": False,
            "browser_promotion_justified_now": False,
            "evidence_required_before_brev": [
                "tracked fresh5 repaired manifest/source-quality contract passes without source or tensor mutation in the same mission that records it",
                "a later local region-axis-preserving smoke beats M3BU test top1 0.288 and macro F1 0.2593486590038314",
                "pen recall rises materially above M3BU 0.04, no label has zero recall, thank_you prediction concentration is bounded, and false-pass rate remains at or below the M3BU 0.064 smoke result",
                "a separate compute receipt records command, max runtime, max spend, kill condition, expected metric signal, artifact copyback, cleanup/default-off verification, duplicate-worker avoidance, and current human approval",
            ],
            "evidence_required_before_browser_promotion": [
                "validated trained browser artifact with no pretrained components",
                "model-card and active-label claim updates backed by final validation gates",
                "negative challenge, browser parity, calibration, and final readiness evidence pass without weakening gates",
            ],
        },
    }


def build_receipt() -> dict[str, Any]:
    manifests = load_manifests()
    manifest_profile = manifest_profiles(manifests)
    selected_labels = manifest_profile["selected_labels"]

    m3bw = load_json(M3BW_RECEIPT)
    m3bv = load_json(M3BV_RECEIPT)
    m3bu = load_json(M3BU_RECEIPT)
    m3bt = load_json(M3BT_RECEIPT)
    m3bs = load_json(M3BS_RECEIPT)
    source_register = load_json(SOURCE_REGISTER)
    candidates = load_json(SUPPORTED_CANDIDATES)
    popsign_source = source_register_popsign_status(source_register)
    fresh10_packet = find_recommended_packet(candidates, "popsign_fresh_10_v1")

    if m3bw.get("exactly_one_next_action") != "continue_fresh5_vocab_split_remediation_packet":
        raise RemediationError("M3BW receipt does not select continue_fresh5_vocab_split_remediation_packet")

    next_action = "continue_fresh5_repaired_manifest_contract"
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise RemediationError(f"unsupported next action: {next_action}")

    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BX - PopSign fresh5 vocabulary/split remediation design",
        "status": "completed_no_training_design_packet",
        "generated_at": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "tool": "scripts/design_popsign_fresh5_vocab_split_remediation.py",
            "command": [
                sys.executable,
                "scripts/design_popsign_fresh5_vocab_split_remediation.py",
                "--receipt",
                DEFAULT_RECEIPT.as_posix(),
                "--write-receipt",
            ],
            "script": file_reference(Path("scripts/design_popsign_fresh5_vocab_split_remediation.py")),
            "python_executable": sys.executable,
        },
        "git": {
            "head": run_git(["rev-parse", "HEAD"]),
            "head_short": run_git(["rev-parse", "--short", "HEAD"]),
            "status_short_branch": run_git(["status", "--short", "--branch"]),
        },
        "active_prompt": ACTIVE_PROMPT.as_posix(),
        "input_artifacts": input_artifacts(),
        "scope": {
            "local_only": True,
            "existing_artifacts_only": True,
            "no_training_run": True,
            "no_model_fitting": True,
            "no_optimizer_or_backward_pass": True,
            "no_checkpoint_created": True,
            "no_brev_command_or_spend": True,
            "no_manifest_mutation": True,
            "no_tensor_mutation": True,
            "no_source_register_mutation": True,
            "no_source_import_or_media_download": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_detector0_training": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "baseline_comparison": baseline_comparison(m3bw, m3bv, m3bu, m3bt, m3bs),
        "manifest_split_source_analysis": manifest_profile,
        "source_register_popsign_status": popsign_source,
        "current_label_risk_table": current_label_risk_table(selected_labels, manifest_profile, m3bw, m3bu),
        "remediation_contract": remediation_contract(selected_labels, manifest_profile, popsign_source),
        "route_evaluation": route_evaluation(fresh10_packet, m3bw),
        "conclusions": conclusions(),
        "decision": {
            "blocker_classification": "fresh5_manifest_split_source_quality_contract_needed",
            "fresh5_repaired_manifest_contract_justified_now": True,
            "fresh10_region_grid_materialization_justified_now": False,
            "detector0_or_crop_contract_justified_now": False,
            "brev_training_receipt_justified_now": False,
            "stop_justified_now": False,
            "human_source_annotation_or_strategy_decision_required_now": False,
            "exactly_one_next_action": next_action,
            "next_action_rationale": "Complete one local/no-spend no-training fresh5 repaired manifest/split/source-quality contract before any new training, fresh10 widening, Detector 0/crop work, Brev compute receipt, export, or promotion.",
        },
        "commands": {
            "design_packet": [
                ".venv/bin/python",
                "scripts/design_popsign_fresh5_vocab_split_remediation.py",
                "--receipt",
                DEFAULT_RECEIPT.as_posix(),
                "--write-receipt",
            ],
            "required_audits": [
                "git status --short --branch",
                "git log -10 --oneline --decorate",
                "node scripts/audit_loop_premise.mjs --json",
                "node scripts/audit_return_to_form_plan.mjs --json",
                "node scripts/audit_no_pretrained_deps.mjs",
                "node scripts/audit_no_pretrained_artifact_json.mjs",
                "node scripts/audit_source_register.mjs",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null",
                "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/design_popsign_fresh5_vocab_split_remediation.py",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json >/dev/null",
                "git diff --check",
            ],
        },
        "tracked_files_changed": [
            "scripts/design_popsign_fresh5_vocab_split_remediation.py",
            "docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json",
            "docs/session-logs/381-mission-3bx-popsign-fresh5-vocab-split-remediation.md",
        ],
        "exactly_one_next_action": next_action,
    }


def main() -> int:
    args = parse_args()
    try:
        receipt = build_receipt()
        if args.write_receipt:
            write_json(args.receipt, receipt)
            print(f"wrote {args.receipt}")
        else:
            print(json.dumps(json_ready(receipt), indent=2, sort_keys=True))
    except RemediationError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
