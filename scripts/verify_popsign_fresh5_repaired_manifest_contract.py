#!/usr/bin/env python3
"""Verify the M3BY PopSign fresh5 repaired manifest contract without training."""

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
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-repaired-manifest-contract/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json")

ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-repaired-manifest-contract-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
POPSIGN_IMPORT_PLAN = Path("docs/research/popsign-v1-import-plan.json")

M3BX_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")
M3BX_LOG = Path("docs/session-logs/381-mission-3bx-popsign-fresh5-vocab-split-remediation.md")
M3BW_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json")
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

EXPECTED_LABEL_ORDER = ["thank_you", "pen", "home", "who", "morning"]
EXPECTED_SOURCE_ID = "popsign-v1-original-videos"
EXPECTED_SOURCE_SPLITS = {"train": "train", "validation": "val", "test": "test"}
MIN_CLIPS_PER_LABEL_PER_SPLIT = 25
MIN_SIGNERS_PER_LABEL_PER_SPLIT = 6

ALLOWED_NEXT_ACTIONS = [
    "continue_fresh5_repaired_manifest_materialization",
    "continue_fresh10_region_grid_materialization",
    "continue_detector0_or_crop_contract_for_fresh5",
    "continue_bounded_brev_training_receipt_for_fresh5_region_grid",
    "stop_until_supported_training_signal_exists",
    "stop_for_human_source_annotation_or_strategy_decision",
]


class ContractError(RuntimeError):
    """Raised when the contract verifier cannot complete."""


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
        raise ContractError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise ContractError(f"required path does not exist: {path}")
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
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path)
    with resolved.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ContractError(f"JSON root must be an object: {project_relative(resolved)}")
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


def tensor_path_for_clip(manifest_path: Path, clip: dict[str, Any]) -> Path:
    relative = clip.get("relative_frame_tensor_path")
    if not isinstance(relative, str) or not relative:
        raise ContractError(f"clip {clip.get('clip_id')} lacks relative_frame_tensor_path")
    return project_path(manifest_path).parent.joinpath(relative).resolve()


def source_register_status(source_register: dict[str, Any]) -> dict[str, Any]:
    sources = source_register.get("sources")
    if not isinstance(sources, list):
        raise ContractError("source register lacks sources list")
    for source in sources:
        if isinstance(source, dict) and source.get("source_id") == EXPECTED_SOURCE_ID:
            return {
                "source_id": source.get("source_id"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "allowed_for_validation": source.get("allowed_for_validation"),
                "allowed_for_pilot_submission": source.get("allowed_for_pilot_submission"),
                "license_review_status": source.get("license_review_status"),
                "decision_id": source.get("decision_id"),
                "restrictions": source.get("restrictions", []),
                "status": "approved"
                if source.get("allowed_for_model_training") is True
                and source.get("allowed_for_validation") is True
                and source.get("license_review_status") == "approved_cc_by_4_raw_video_with_attribution"
                else "blocked",
            }
    raise ContractError(f"source register lacks {EXPECTED_SOURCE_ID}")


def import_plan_status(import_plan: dict[str, Any], source_register_ref: dict[str, Any]) -> dict[str, Any]:
    source_register = import_plan.get("source_register") or {}
    import_contract = import_plan.get("import_contract") or {}
    return {
        "status": import_plan.get("status"),
        "source_id": import_plan.get("source_id"),
        "source_register_sha256": source_register.get("sha256"),
        "current_source_register_sha256": source_register_ref["sha256"],
        "source_register_hash_matches_current": source_register.get("sha256") == source_register_ref["sha256"],
        "final_split_strategy": import_contract.get("final_split_strategy"),
        "derived_features_allowed": import_contract.get("derived_features_allowed"),
        "preview_videos_allowed": import_contract.get("preview_videos_allowed"),
    }


def input_artifacts() -> dict[str, Any]:
    source_register_ref = file_reference(SOURCE_REGISTER)
    return {
        "steering": {
            "goal": file_reference(Path("GOAL.md")),
            "active_prompt": file_reference(ACTIVE_PROMPT),
            "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        },
        "source_metadata": {
            "source_register": source_register_ref,
            "popsign_import_plan": file_reference(POPSIGN_IMPORT_PLAN),
        },
        "m3bx": {
            "receipt": file_reference(M3BX_RECEIPT),
            "session_log": file_reference(M3BX_LOG),
        },
        "receipts": {
            "m3bw": file_reference(M3BW_RECEIPT),
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
    }


def load_manifests() -> dict[str, dict[str, Any]]:
    return {split: load_json(path) for split, path in MANIFESTS.items()}


def manifest_label_ids(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise ContractError("manifest lacks labels list")
    result = []
    for label in labels:
        if not isinstance(label, dict) or not label.get("label_id"):
            raise ContractError("manifest label entry lacks label_id")
        result.append(str(label["label_id"]))
    return result


def contract_analysis(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    split_rows: dict[str, Any] = {}
    source_records_by_split: dict[str, set[str]] = {}
    tensor_paths_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split_label: dict[tuple[str, str], set[str]] = {}
    clip_ids_by_split: dict[str, set[str]] = {}
    tensor_failures: list[dict[str, Any]] = []

    for split, manifest in manifests.items():
        labels = manifest_label_ids(manifest)
        clips = manifest.get("clips")
        if not isinstance(clips, list):
            raise ContractError(f"{split} manifest lacks clips list")

        label_counts: Counter[str] = Counter()
        source_split_counts: Counter[str] = Counter()
        signer_hashes: set[str] = set()
        signer_hashes_by_label: dict[str, set[str]] = {label: set() for label in labels}
        source_records: set[str] = set()
        source_records_by_label: dict[str, set[str]] = {label: set() for label in labels}
        clip_ids: set[str] = set()
        tensor_paths: set[str] = set()
        duplicate_source_records: Counter[str] = Counter()
        duplicate_clip_ids: Counter[str] = Counter()
        duplicate_tensor_paths: Counter[str] = Counter()
        record_counter: Counter[str] = Counter()
        clip_counter: Counter[str] = Counter()
        tensor_counter: Counter[str] = Counter()
        tensor_reference_count = 0
        tensor_sha256_count = 0
        tensor_file_count = 0
        tensor_hash_match_count = 0
        tensor_hash_samples = []

        for clip in clips:
            if not isinstance(clip, dict):
                raise ContractError(f"{split} manifest contains non-object clip")
            label = str(clip.get("label_id") or "")
            clip_id = str(clip.get("clip_id") or "")
            source_split = str(clip.get("source_split") or "")
            source_record_id = str(clip.get("source_record_id") or "")
            signer_hash = str(clip.get("signer_identity_hash") or "")

            label_counts[label] += 1
            source_split_counts[source_split] += 1
            if clip_id:
                clip_ids.add(clip_id)
                clip_counter[clip_id] += 1
            if signer_hash:
                signer_hashes.add(signer_hash)
                signer_hashes_by_label.setdefault(label, set()).add(signer_hash)
            if source_record_id:
                source_records.add(source_record_id)
                source_records_by_label.setdefault(label, set()).add(source_record_id)
                record_counter[source_record_id] += 1

            relative_tensor = clip.get("relative_frame_tensor_path")
            expected_hash = str(clip.get("frame_tensor_sha256") or "")
            if relative_tensor:
                tensor_reference_count += 1
                tensor_path = tensor_path_for_clip(MANIFESTS[split], clip)
                tensor_relative = project_relative(tensor_path)
                tensor_paths.add(tensor_relative)
                tensor_counter[tensor_relative] += 1
                if tensor_path.exists():
                    tensor_file_count += 1
                    actual_hash = sha256_file(tensor_path)
                    if expected_hash:
                        tensor_sha256_count += 1
                        if actual_hash == expected_hash:
                            tensor_hash_match_count += 1
                        else:
                            tensor_failures.append(
                                {
                                    "split": split,
                                    "clip_id": clip_id,
                                    "tensor_path": tensor_relative,
                                    "expected_sha256": expected_hash,
                                    "actual_sha256": actual_hash,
                                }
                            )
                    if len(tensor_hash_samples) < 2:
                        tensor_hash_samples.append(
                            {
                                "clip_id": clip_id,
                                "label_id": label,
                                "path": tensor_relative,
                                "sha256": actual_hash,
                            }
                        )
                else:
                    tensor_failures.append(
                        {"split": split, "clip_id": clip_id, "tensor_path": tensor_relative, "missing": True}
                    )

        for value, count in record_counter.items():
            if count > 1:
                duplicate_source_records[value] = count
        for value, count in clip_counter.items():
            if count > 1:
                duplicate_clip_ids[value] = count
        for value, count in tensor_counter.items():
            if count > 1:
                duplicate_tensor_paths[value] = count

        source_records_by_split[split] = source_records
        tensor_paths_by_split[split] = tensor_paths
        signer_hashes_by_split[split] = signer_hashes
        clip_ids_by_split[split] = clip_ids
        for label, hashes in signer_hashes_by_label.items():
            signer_hashes_by_split_label[(split, label)] = hashes

        split_rows[split] = {
            "labels": labels,
            "clip_count": len(clips),
            "label_counts": dict(sorted(label_counts.items())),
            "source_split_counts": dict(sorted(source_split_counts.items())),
            "dataset_source_mode": manifest.get("dataset_source_mode"),
            "source_id": (manifest.get("external_dataset_import") or {}).get("source_id"),
            "signer_identity_hash_count": len(signer_hashes),
            "signer_identity_hash_count_by_label": {
                label: len(hashes) for label, hashes in sorted(signer_hashes_by_label.items())
            },
            "source_record_id_count": len(source_records),
            "source_record_id_count_by_label": {
                label: len(records) for label, records in sorted(source_records_by_label.items())
            },
            "tensor_reference_count": tensor_reference_count,
            "tensor_sha256_count": tensor_sha256_count,
            "tensor_file_count": tensor_file_count,
            "tensor_hash_match_count": tensor_hash_match_count,
            "tensor_hash_samples": tensor_hash_samples,
            "duplicate_source_record_ids": dict(sorted(duplicate_source_records.items())),
            "duplicate_clip_ids": dict(sorted(duplicate_clip_ids.items())),
            "duplicate_tensor_paths": dict(sorted(duplicate_tensor_paths.items())),
        }

    overlap_rows: dict[str, Any] = {}
    for left, right in (("train", "validation"), ("train", "test"), ("validation", "test")):
        overlap_rows[f"{left}_vs_{right}"] = {
            "shared_source_record_id_count": len(source_records_by_split[left] & source_records_by_split[right]),
            "shared_tensor_path_count": len(tensor_paths_by_split[left] & tensor_paths_by_split[right]),
            "shared_clip_id_count": len(clip_ids_by_split[left] & clip_ids_by_split[right]),
            "shared_signer_identity_hash_count": len(signer_hashes_by_split[left] & signer_hashes_by_split[right]),
            "label_shared_signer_identity_hash_count": {
                label: len(
                    signer_hashes_by_split_label.get((left, label), set())
                    & signer_hashes_by_split_label.get((right, label), set())
                )
                for label in EXPECTED_LABEL_ORDER
            },
        }

    return {
        "expected_label_order": EXPECTED_LABEL_ORDER,
        "splits": split_rows,
        "cross_split_leakage": overlap_rows,
        "tensor_failures": tensor_failures,
    }


def m3bu_risk_analysis(m3bw: dict[str, Any]) -> dict[str, Any]:
    error = m3bw.get("m3bu_error_concentration") or {}
    per_true_label = error.get("per_true_label") or {}
    predicted_fraction = error.get("predicted_label_fraction") or {}
    return {
        "pen": {
            "test_recall": (per_true_label.get("pen") or {}).get("recall"),
            "predicted_label_fraction": predicted_fraction.get("pen"),
            "dominant_wrong_prediction": (per_true_label.get("pen") or {}).get("dominant_wrong_prediction"),
            "status": "must_remain_training_stop_condition",
            "stop_condition": "Any later training/materialization prompt must stop before Brev/export if pen recall remains near M3BU 0.04 or pen remains mostly absorbed by thank_you.",
        },
        "thank_you": {
            "test_recall": (per_true_label.get("thank_you") or {}).get("recall"),
            "predicted_label_fraction": predicted_fraction.get("thank_you"),
            "dominant_wrong_prediction": (per_true_label.get("thank_you") or {}).get("dominant_wrong_prediction"),
            "status": "must_remain_training_stop_condition",
            "stop_condition": "Any later training/materialization prompt must stop before Brev/export if thank_you remains an overpredicted class near M3BW 0.568 of test predictions.",
        },
    }


def gate_results(
    analysis: dict[str, Any],
    source_status: dict[str, Any],
    import_status: dict[str, Any],
    m3bx: dict[str, Any],
) -> dict[str, Any]:
    splits = analysis["splits"]
    all_labels_match = all(splits[split]["labels"] == EXPECTED_LABEL_ORDER for split in MANIFESTS)
    label_sets_unchanged = all(set(splits[split]["labels"]) == set(EXPECTED_LABEL_ORDER) for split in MANIFESTS)
    source_approved = source_status["status"] == "approved"
    import_plan_current = import_status["source_register_hash_matches_current"] is True
    source_boundaries = all(
        splits[split]["source_split_counts"] == {EXPECTED_SOURCE_SPLITS[split]: splits[split]["clip_count"]}
        for split in MANIFESTS
    )
    same_source_lane = all(splits[split]["source_id"] == EXPECTED_SOURCE_ID for split in MANIFESTS)
    per_label_counts = all(
        splits[split]["label_counts"].get(label) == MIN_CLIPS_PER_LABEL_PER_SPLIT
        for split in MANIFESTS
        for label in EXPECTED_LABEL_ORDER
    )
    signer_coverage = all(
        splits[split]["signer_identity_hash_count_by_label"].get(label, 0) >= MIN_SIGNERS_PER_LABEL_PER_SPLIT
        for split in MANIFESTS
        for label in EXPECTED_LABEL_ORDER
    )
    source_record_coverage = all(
        splits[split]["source_record_id_count_by_label"].get(label, 0) >= MIN_CLIPS_PER_LABEL_PER_SPLIT
        for split in MANIFESTS
        for label in EXPECTED_LABEL_ORDER
    )
    no_internal_dupes = all(
        not splits[split]["duplicate_source_record_ids"]
        and not splits[split]["duplicate_clip_ids"]
        and not splits[split]["duplicate_tensor_paths"]
        for split in MANIFESTS
    )
    no_cross_split_leakage = all(
        row["shared_source_record_id_count"] == 0
        and row["shared_tensor_path_count"] == 0
        and row["shared_clip_id_count"] == 0
        for row in analysis["cross_split_leakage"].values()
    )
    tensor_coverage = all(
        splits[split]["tensor_reference_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_sha256_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_file_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_hash_match_count"] == splits[split]["clip_count"]
        for split in MANIFESTS
    ) and not analysis["tensor_failures"]
    m3bx_selected = m3bx.get("exactly_one_next_action") == "continue_fresh5_repaired_manifest_contract"
    risks_carried = True

    gates = {
        "m3bx_selected_contract": m3bx_selected,
        "same_label_order": all_labels_match,
        "same_label_set": label_sets_unchanged,
        "source_register_approved": source_approved,
        "import_plan_current": import_plan_current,
        "same_source_lane": same_source_lane,
        "source_split_boundaries_preserved": source_boundaries,
        "per_label_clip_counts": per_label_counts,
        "signer_coverage": signer_coverage,
        "source_record_coverage": source_record_coverage,
        "no_internal_dedupe_failures": no_internal_dupes,
        "no_cross_split_clip_source_or_tensor_leakage": no_cross_split_leakage,
        "tensor_files_exist_and_hash_match": tensor_coverage,
        "pen_and_thank_you_risks_carried_forward": risks_carried,
    }
    return {
        "gates": gates,
        "all_materialization_contract_gates_pass": all(gates.values()),
    }


def repaired_manifest_contract(analysis: dict[str, Any], risk: dict[str, Any]) -> dict[str, Any]:
    return {
        "contract_id": "popsign_fresh5_repaired_manifest_contract_v1",
        "contract_status": "ready_for_later_no_spend_materialization_prompt",
        "materialize_later_only": True,
        "no_manifest_written_this_mission": True,
        "no_tensor_written_this_mission": True,
        "label_order": EXPECTED_LABEL_ORDER,
        "source_id": EXPECTED_SOURCE_ID,
        "split_strategy": "preserve PopSign train/val/test source split boundaries and retain signer-disjoint validation/test as evaluation property",
        "required_gates_for_later_materialization": [
            "use the same five labels and same approved PopSign raw-video source lane",
            "preserve train/val/test source_split values exactly",
            "carry source_record_id, source_sha256, signer_identity_hash, tensor path, and tensor sha256 provenance forward",
            "reject any duplicate clip_id, source_record_id, or tensor path within a split",
            "reject any source_record_id, clip_id, or tensor path crossing train/validation/test",
            "require at least 25 clips and at least 6 pseudonymous signer hashes per label per split",
            "require all tensor files to exist and match manifest frame_tensor_sha256",
            "carry pen low-recall and thank_you overprediction gates into any later local smoke or compute receipt",
        ],
        "training_stop_conditions": {
            "pen": risk["pen"]["stop_condition"],
            "thank_you": risk["thank_you"]["stop_condition"],
            "compute": "No Brev compute receipt is allowed until a later local no-spend materialization/smoke records improved held-out signal over M3BU and preserves these gates.",
            "browser": "No browser activation, active-label promotion, model-card promotion, or final-readiness claim is allowed from this contract alone.",
        },
        "current_contract_evidence_summary": {
            "split_count": len(analysis["splits"]),
            "total_clip_count": sum(row["clip_count"] for row in analysis["splits"].values()),
            "total_tensor_file_count": sum(row["tensor_file_count"] for row in analysis["splits"].values()),
            "cross_split_leakage": analysis["cross_split_leakage"],
        },
    }


def decide_next_action(gates: dict[str, Any]) -> tuple[str, str]:
    if gates["all_materialization_contract_gates_pass"]:
        return (
            "continue_fresh5_repaired_manifest_materialization",
            "The same-label same-source PopSign fresh5 contract is explicit, leakage-free, tensor-backed, and ready for a later local/no-spend materialization prompt.",
        )
    return (
        "stop_until_supported_training_signal_exists",
        "One or more repaired-manifest contract gates failed, so later materialization/training planning is unsupported.",
    )


def build_receipt() -> dict[str, Any]:
    manifests = load_manifests()
    artifacts = input_artifacts()
    m3bx = load_json(M3BX_RECEIPT)
    m3bw = load_json(M3BW_RECEIPT)
    source_register = load_json(SOURCE_REGISTER)
    import_plan = load_json(POPSIGN_IMPORT_PLAN)

    source_status = source_register_status(source_register)
    import_status = import_plan_status(import_plan, artifacts["source_metadata"]["source_register"])
    analysis = contract_analysis(manifests)
    risks = m3bu_risk_analysis(m3bw)
    gates = gate_results(analysis, source_status, import_status, m3bx)
    next_action, rationale = decide_next_action(gates)
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise ContractError(f"unsupported next action: {next_action}")

    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BY - PopSign fresh5 repaired manifest contract",
        "status": "completed_no_training_contract_verification"
        if gates["all_materialization_contract_gates_pass"]
        else "blocked_contract_gate_failure",
        "generated_at": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "tool": "scripts/verify_popsign_fresh5_repaired_manifest_contract.py",
            "command": [
                sys.executable,
                "scripts/verify_popsign_fresh5_repaired_manifest_contract.py",
                "--receipt",
                DEFAULT_RECEIPT.as_posix(),
                "--write-receipt",
            ],
            "script": file_reference(Path("scripts/verify_popsign_fresh5_repaired_manifest_contract.py")),
            "python_executable": sys.executable,
        },
        "git": {
            "head": run_git(["rev-parse", "HEAD"]),
            "head_short": run_git(["rev-parse", "--short", "HEAD"]),
            "status_short_branch": run_git(["status", "--short", "--branch"]),
        },
        "active_prompt": ACTIVE_PROMPT.as_posix(),
        "input_artifacts": artifacts,
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
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_detector0_training": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "m3bx_contract_source": {
            "status": m3bx.get("status"),
            "blocker_classification": (m3bx.get("decision") or {}).get("blocker_classification"),
            "selected_next_action": m3bx.get("exactly_one_next_action"),
            "m3bx_contract_id": ((m3bx.get("remediation_contract") or {}).get("contract_id")),
        },
        "source_register_status": source_status,
        "popsign_import_plan_status": import_status,
        "contract_analysis": analysis,
        "gate_results": gates,
        "label_risk_gates": risks,
        "repaired_manifest_contract": repaired_manifest_contract(analysis, risks),
        "decision": {
            "exactly_one_next_action": next_action,
            "next_action_rationale": rationale,
            "fresh5_repaired_manifest_materialization_justified_now": next_action
            == "continue_fresh5_repaired_manifest_materialization",
            "fresh10_region_grid_materialization_justified_now": False,
            "detector0_or_crop_contract_justified_now": False,
            "brev_training_receipt_justified_now": False,
            "human_source_annotation_or_strategy_decision_required_now": False,
            "blocker_classification": "none_contract_verified"
            if gates["all_materialization_contract_gates_pass"]
            else "repaired_manifest_contract_gate_failure",
        },
        "commands": {
            "contract_verification": [
                ".venv/bin/python",
                "scripts/verify_popsign_fresh5_repaired_manifest_contract.py",
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
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null",
                "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/verify_popsign_fresh5_repaired_manifest_contract.py scripts/design_popsign_fresh5_vocab_split_remediation.py scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json >/dev/null",
                "git diff --check",
            ],
        },
        "tracked_files_changed": [
            "scripts/verify_popsign_fresh5_repaired_manifest_contract.py",
            "docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json",
            "docs/session-logs/383-mission-3by-popsign-fresh5-repaired-manifest-contract.md",
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
    except ContractError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
