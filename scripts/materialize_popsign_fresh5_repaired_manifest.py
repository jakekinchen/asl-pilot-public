#!/usr/bin/env python3
"""Materialize the M3BZ PopSign fresh5 repaired manifest package without training."""

from __future__ import annotations

import argparse
import copy
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

SCHEMA_VERSION = "asl-pilot-popsign-fresh5-repaired-manifest-materialization/v1"
MANIFEST_BINDING_SCHEMA_VERSION = "asl-pilot-popsign-fresh5-repaired-manifest-binding/v1"
PACKAGE_CONTRACT_SCHEMA_VERSION = "asl-pilot-popsign-fresh5-repaired-manifest-package-contract/v1"

PACKAGE_ID = "return-to-form-popsign-fresh5-repaired-v1"
MISSION = "Mission 3BZ - PopSign fresh5 repaired manifest materialization"
EXPECTED_LABEL_ORDER = ["thank_you", "pen", "home", "who", "morning"]
EXPECTED_SOURCE_ID = "popsign-v1-original-videos"
EXPECTED_SOURCE_SPLITS = {"train": "train", "validation": "val", "test": "test"}
MIN_CLIPS_PER_LABEL_PER_SPLIT = 25
MIN_SIGNERS_PER_LABEL_PER_SPLIT = 6
REGION_GRID_INPUT_CONTRACT = "rgb_regions_grid_v1"
LATER_LEARNABILITY_ARCHITECTURE = "true_temporal_convnet_region_grid"

ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-repaired-manifest-materialization-goal-loop-prompt.md")
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
POPSIGN_IMPORT_PLAN = Path("docs/research/popsign-v1-import-plan.json")
M3BY_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json")
M3BX_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")
M3BW_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json")
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json")
M3BS_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json")

SOURCE_MANIFESTS = {
    "train": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/train.json"),
    "validation": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json"),
    "test": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/test.json"),
}
OUTPUT_DIR = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1")
OUTPUT_MANIFESTS = {split: OUTPUT_DIR / f"{split}.json" for split in ("train", "validation", "test")}
OUTPUT_CONTRACT = OUTPUT_DIR / "manifest-contract.json"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json")

REQUIRED_FIELDS_CARRIED = [
    "source_id",
    "source_split",
    "source_record_id",
    "sha256",
    "clip_id",
    "signer_identity_hash",
    "relative_frame_tensor_path",
    "frame_tensor_sha256",
    "frame_tensor_provenance",
]

ALLOWED_NEXT_ACTIONS = [
    "continue_bounded_fresh5_learnability_isolation_probe",
    "continue_fresh10_region_grid_materialization",
    "continue_detector0_or_crop_contract_for_fresh5",
    "continue_bounded_brev_training_receipt_for_fresh5_region_grid",
    "stop_until_supported_training_signal_exists",
    "stop_for_human_source_annotation_or_strategy_decision",
]


class MaterializationError(RuntimeError):
    """Raised when the repaired manifest package cannot be materialized."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write the manifest package and receipt.")
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--generated-at", default=None)
    return parser.parse_args()


def project_path(path: Path, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise MaterializationError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise MaterializationError(f"required path does not exist: {path}")
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
    resolved = project_path(path)
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path)
    with resolved.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise MaterializationError(f"JSON root must be an object: {project_relative(resolved)}")
    return data


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


def write_json(path: Path, value: dict[str, Any]) -> None:
    resolved = project_path(path, must_exist=False)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8") as handle:
        json.dump(json_ready(value), handle, indent=2, sort_keys=True)
        handle.write("\n")


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


def manifest_label_ids(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise MaterializationError("manifest lacks labels array")
    label_ids = []
    for label in labels:
        if not isinstance(label, dict) or not label.get("label_id"):
            raise MaterializationError("manifest label entry lacks label_id")
        label_ids.append(str(label["label_id"]))
    return label_ids


def resolve_manifest_relative(manifest_path: Path, value: str) -> Path:
    relative_path = Path(value)
    if relative_path.is_absolute():
        raise MaterializationError(f"manifest-relative path must not be absolute: {value}")
    resolved = (project_path(manifest_path).parent / relative_path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise MaterializationError(f"manifest-relative path escapes project root: {value}") from error
    return resolved


def tensor_path_for_clip(manifest_path: Path, clip: dict[str, Any]) -> Path:
    relative = clip.get("relative_frame_tensor_path")
    if not isinstance(relative, str) or not relative:
        raise MaterializationError(f"clip {clip.get('clip_id')} lacks relative_frame_tensor_path")
    return resolve_manifest_relative(manifest_path, relative)


def source_manifest_refs() -> dict[str, dict[str, str]]:
    return {split: file_reference(path) for split, path in SOURCE_MANIFESTS.items()}


def input_artifacts() -> dict[str, Any]:
    return {
        "steering": {
            "goal": file_reference(Path("GOAL.md")),
            "active_prompt": file_reference(ACTIVE_PROMPT),
            "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        },
        "source_metadata": {
            "source_register": file_reference(SOURCE_REGISTER),
            "popsign_import_plan": file_reference(POPSIGN_IMPORT_PLAN),
        },
        "source_manifests": source_manifest_refs(),
        "receipts": {
            "m3by_contract": file_reference(M3BY_RECEIPT),
            "m3bx_remediation": file_reference(M3BX_RECEIPT),
            "m3bw_separability": file_reference(M3BW_RECEIPT),
            "m3bv_preserved_region_ablation": file_reference(M3BV_RECEIPT),
            "m3bu_region_grid_smoke": file_reference(M3BU_RECEIPT),
            "m3bt_region_grid_materialization": file_reference(M3BT_RECEIPT),
            "m3bs_materialization_local_smoke": file_reference(M3BS_RECEIPT),
        },
    }


def training_stop_conditions(m3by: dict[str, Any]) -> dict[str, str]:
    conditions = ((m3by.get("repaired_manifest_contract") or {}).get("training_stop_conditions") or {})
    required = ["pen", "thank_you", "compute", "browser"]
    missing = [key for key in required if not isinstance(conditions.get(key), str) or not conditions[key]]
    if missing:
        raise MaterializationError(f"M3BY receipt lacks training stop condition(s): {missing}")
    return {key: str(conditions[key]) for key in required}


def repaired_binding(
    split: str,
    generated_at: str,
    source_manifest_ref: dict[str, str],
    m3by_ref: dict[str, str],
    stop_conditions: dict[str, str],
) -> dict[str, Any]:
    return {
        "schema_version": MANIFEST_BINDING_SCHEMA_VERSION,
        "mission": "M3BZ",
        "package_id": PACKAGE_ID,
        "status": "materialized_from_existing_verified_region_grid_manifest",
        "split": split,
        "generated_at": generated_at,
        "source_manifest": source_manifest_ref,
        "m3by_repaired_manifest_contract": m3by_ref,
        "selected_labels": EXPECTED_LABEL_ORDER,
        "source_id": EXPECTED_SOURCE_ID,
        "source_split_policy": "preserve PopSign train/val/test source split boundaries exactly",
        "existing_tensor_references_only": True,
        "no_tensor_written": True,
        "no_source_import_or_media_download": True,
        "no_training_or_model_fitting": True,
        "required_input_contract": REGION_GRID_INPUT_CONTRACT,
        "later_learnability_architecture": LATER_LEARNABILITY_ARCHITECTURE,
        "training_stop_conditions": stop_conditions,
    }


def materialize_manifests(output_dir: Path, generated_at: str, m3by: dict[str, Any]) -> None:
    source_refs = source_manifest_refs()
    m3by_ref = file_reference(M3BY_RECEIPT)
    stop_conditions = training_stop_conditions(m3by)
    for split, source_path in SOURCE_MANIFESTS.items():
        source_manifest = load_json(source_path)
        if manifest_label_ids(source_manifest) != EXPECTED_LABEL_ORDER:
            raise MaterializationError(f"{source_path}: label order does not match repaired contract")
        manifest = copy.deepcopy(source_manifest)
        manifest["dataset_id"] = PACKAGE_ID
        manifest["created_at"] = generated_at
        manifest["repaired_manifest_materialization"] = repaired_binding(
            split,
            generated_at,
            source_refs[split],
            m3by_ref,
            stop_conditions,
        )
        write_json(output_dir / f"{split}.json", manifest)


def duplicate_counts(values: list[str]) -> dict[str, int]:
    return {value: count for value, count in sorted(Counter(values).items()) if count > 1}


def analyze_package(output_dir: Path) -> dict[str, Any]:
    split_rows: dict[str, Any] = {}
    source_records_by_split: dict[str, set[str]] = {}
    tensor_paths_by_split: dict[str, set[str]] = {}
    clip_ids_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split_label: dict[tuple[str, str], set[str]] = {}
    tensor_failures: list[dict[str, Any]] = []
    source_identity_mismatches: list[dict[str, Any]] = []

    for split in ("train", "validation", "test"):
        output_path = output_dir / f"{split}.json"
        source_path = SOURCE_MANIFESTS[split]
        output_manifest = load_json(output_path)
        source_manifest = load_json(source_path)
        labels = manifest_label_ids(output_manifest)
        source_labels = manifest_label_ids(source_manifest)
        clips = output_manifest.get("clips")
        source_clips = source_manifest.get("clips")
        if not isinstance(clips, list) or not isinstance(source_clips, list):
            raise MaterializationError(f"{output_path}: clips must be arrays")
        if len(clips) != len(source_clips):
            raise MaterializationError(f"{output_path}: output/source clip count mismatch")

        label_counts: Counter[str] = Counter()
        source_split_counts: Counter[str] = Counter()
        source_hashes_by_label: dict[str, set[str]] = {label: set() for label in EXPECTED_LABEL_ORDER}
        source_records_by_label: dict[str, set[str]] = {label: set() for label in EXPECTED_LABEL_ORDER}
        signer_hashes_by_label: dict[str, set[str]] = {label: set() for label in EXPECTED_LABEL_ORDER}
        source_records: list[str] = []
        tensor_paths: list[str] = []
        clip_ids: list[str] = []
        signer_hashes: list[str] = []
        carried_field_counts: Counter[str] = Counter()
        tensor_hash_match_count = 0
        tensor_file_count = 0
        tensor_reference_count = 0
        tensor_sha256_count = 0
        tensor_contract_field_count = 0
        tensor_hash_samples = []

        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                raise MaterializationError(f"{output_path}: clips[{index}] must be an object")
            source_clip = source_clips[index]
            if not isinstance(source_clip, dict):
                raise MaterializationError(f"{source_path}: clips[{index}] must be an object")
            for field in REQUIRED_FIELDS_CARRIED:
                if field in clip and clip.get(field) not in (None, ""):
                    carried_field_counts[field] += 1
            for field in REQUIRED_FIELDS_CARRIED:
                if clip.get(field) != source_clip.get(field):
                    source_identity_mismatches.append(
                        {
                            "split": split,
                            "index": index,
                            "clip_id": clip.get("clip_id"),
                            "field": field,
                            "expected": source_clip.get(field),
                            "actual": clip.get(field),
                        }
                    )

            label = str(clip.get("label_id") or "")
            clip_id = str(clip.get("clip_id") or "")
            source_split = str(clip.get("source_split") or "")
            source_record_id = str(clip.get("source_record_id") or "")
            signer_hash = str(clip.get("signer_identity_hash") or "")
            source_sha256 = str(clip.get("sha256") or "")
            label_counts[label] += 1
            source_split_counts[source_split] += 1
            if clip_id:
                clip_ids.append(clip_id)
            if source_record_id:
                source_records.append(source_record_id)
                source_records_by_label.setdefault(label, set()).add(source_record_id)
            if signer_hash:
                signer_hashes.append(signer_hash)
                signer_hashes_by_label.setdefault(label, set()).add(signer_hash)
            if source_sha256:
                source_hashes_by_label.setdefault(label, set()).add(source_sha256)

            relative_tensor = clip.get("relative_frame_tensor_path")
            expected_hash = str(clip.get("frame_tensor_sha256") or "")
            if isinstance(relative_tensor, str) and relative_tensor:
                tensor_reference_count += 1
                tensor_path = tensor_path_for_clip(output_path, clip)
                tensor_relative = project_relative(tensor_path)
                tensor_paths.append(tensor_relative)
                if not tensor_relative.startswith(f"data/tensors/return-to-form-popsign-fresh5-region-grid/{split}/"):
                    tensor_failures.append(
                        {
                            "split": split,
                            "clip_id": clip_id,
                            "tensor_path": tensor_relative,
                            "not_existing_region_grid_tensor": True,
                        }
                    )
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

            provenance = clip.get("frame_tensor_provenance")
            if isinstance(provenance, dict) and isinstance(provenance.get("tensor_digest"), dict):
                tensor_contract_field_count += 1

        source_records_by_split[split] = set(source_records)
        tensor_paths_by_split[split] = set(tensor_paths)
        clip_ids_by_split[split] = set(clip_ids)
        signer_hashes_by_split[split] = set(signer_hashes)
        for label, hashes in signer_hashes_by_label.items():
            signer_hashes_by_split_label[(split, label)] = hashes

        split_rows[split] = {
            "manifest": file_reference(output_path),
            "source_manifest": file_reference(source_path),
            "labels": labels,
            "source_labels": source_labels,
            "clip_count": len(clips),
            "label_counts": dict(sorted(label_counts.items())),
            "source_split_counts": dict(sorted(source_split_counts.items())),
            "dataset_id": output_manifest.get("dataset_id"),
            "dataset_source_mode": output_manifest.get("dataset_source_mode"),
            "source_id": (output_manifest.get("external_dataset_import") or {}).get("source_id"),
            "binding": output_manifest.get("repaired_manifest_materialization"),
            "source_record_id_count": len(set(source_records)),
            "source_record_id_count_by_label": {
                label: len(records) for label, records in sorted(source_records_by_label.items())
            },
            "source_sha256_count_by_label": {
                label: len(hashes) for label, hashes in sorted(source_hashes_by_label.items())
            },
            "signer_identity_hash_count": len(set(signer_hashes)),
            "signer_identity_hash_count_by_label": {
                label: len(hashes) for label, hashes in sorted(signer_hashes_by_label.items())
            },
            "tensor_reference_count": tensor_reference_count,
            "tensor_sha256_count": tensor_sha256_count,
            "tensor_file_count": tensor_file_count,
            "tensor_hash_match_count": tensor_hash_match_count,
            "tensor_contract_field_count": tensor_contract_field_count,
            "tensor_hash_samples": tensor_hash_samples,
            "duplicate_source_record_ids": duplicate_counts(source_records),
            "duplicate_clip_ids": duplicate_counts(clip_ids),
            "duplicate_tensor_paths": duplicate_counts(tensor_paths),
            "carried_field_counts": dict(sorted(carried_field_counts.items())),
        }

    cross_split_leakage: dict[str, Any] = {}
    for left, right in (("train", "validation"), ("train", "test"), ("validation", "test")):
        cross_split_leakage[f"{left}_vs_{right}"] = {
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
        "cross_split_leakage": cross_split_leakage,
        "tensor_failures": tensor_failures,
        "source_identity_mismatches": source_identity_mismatches[:10],
        "source_identity_mismatch_count": len(source_identity_mismatches),
    }


def gate_results(analysis: dict[str, Any], m3by: dict[str, Any]) -> dict[str, Any]:
    splits = analysis["splits"]
    same_label_order = all(splits[split]["labels"] == EXPECTED_LABEL_ORDER for split in splits)
    source_label_order_preserved = all(
        splits[split]["source_labels"] == EXPECTED_LABEL_ORDER and splits[split]["source_labels"] == splits[split]["labels"]
        for split in splits
    )
    same_source_lane = all(splits[split]["source_id"] == EXPECTED_SOURCE_ID for split in splits)
    split_boundaries = all(
        splits[split]["source_split_counts"] == {EXPECTED_SOURCE_SPLITS[split]: splits[split]["clip_count"]}
        for split in splits
    )
    per_label_counts = all(
        splits[split]["label_counts"].get(label) == MIN_CLIPS_PER_LABEL_PER_SPLIT
        for split in splits
        for label in EXPECTED_LABEL_ORDER
    )
    signer_coverage = all(
        splits[split]["signer_identity_hash_count_by_label"].get(label, 0) >= MIN_SIGNERS_PER_LABEL_PER_SPLIT
        for split in splits
        for label in EXPECTED_LABEL_ORDER
    )
    source_record_coverage = all(
        splits[split]["source_record_id_count_by_label"].get(label, 0) >= MIN_CLIPS_PER_LABEL_PER_SPLIT
        for split in splits
        for label in EXPECTED_LABEL_ORDER
    )
    source_sha256_coverage = all(
        splits[split]["source_sha256_count_by_label"].get(label, 0) >= MIN_CLIPS_PER_LABEL_PER_SPLIT
        for split in splits
        for label in EXPECTED_LABEL_ORDER
    )
    no_internal_dupes = all(
        not splits[split]["duplicate_source_record_ids"]
        and not splits[split]["duplicate_clip_ids"]
        and not splits[split]["duplicate_tensor_paths"]
        for split in splits
    )
    no_cross_split_source_clip_tensor_leakage = all(
        row["shared_source_record_id_count"] == 0
        and row["shared_tensor_path_count"] == 0
        and row["shared_clip_id_count"] == 0
        for row in analysis["cross_split_leakage"].values()
    )
    no_cross_split_signer_leakage = all(
        row["shared_signer_identity_hash_count"] == 0
        for row in analysis["cross_split_leakage"].values()
    )
    tensor_coverage = all(
        splits[split]["tensor_reference_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_sha256_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_file_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_hash_match_count"] == splits[split]["clip_count"]
        and splits[split]["tensor_contract_field_count"] == splits[split]["clip_count"]
        for split in splits
    ) and not analysis["tensor_failures"]
    required_fields_carried = all(
        splits[split]["carried_field_counts"].get(field, 0) == splits[split]["clip_count"]
        for split in splits
        for field in REQUIRED_FIELDS_CARRIED
    )
    bindings_present = all(
        isinstance(splits[split]["binding"], dict)
        and splits[split]["binding"].get("existing_tensor_references_only") is True
        and splits[split]["binding"].get("no_tensor_written") is True
        and splits[split]["binding"].get("required_input_contract") == REGION_GRID_INPUT_CONTRACT
        for split in splits
    )
    m3by_selected = m3by.get("exactly_one_next_action") == "continue_fresh5_repaired_manifest_materialization"
    m3by_gates_passed = (m3by.get("gate_results") or {}).get("all_materialization_contract_gates_pass") is True
    source_identity_preserved = analysis["source_identity_mismatch_count"] == 0
    stop_conditions_carried = all(
        isinstance((splits[split]["binding"] or {}).get("training_stop_conditions", {}).get(label), str)
        for split in splits
        for label in ("pen", "thank_you")
    )
    manifest_contract_written = project_path(OUTPUT_CONTRACT, must_exist=False).exists()

    gates = {
        "m3by_selected_materialization": m3by_selected,
        "m3by_contract_gates_passed": m3by_gates_passed,
        "manifest_package_written": all(project_path(OUTPUT_MANIFESTS[split]).exists() for split in splits),
        "manifest_contract_written": manifest_contract_written,
        "same_label_order": same_label_order,
        "source_label_order_preserved": source_label_order_preserved,
        "same_source_lane": same_source_lane,
        "source_split_boundaries_preserved": split_boundaries,
        "per_label_clip_counts": per_label_counts,
        "signer_coverage": signer_coverage,
        "source_record_coverage": source_record_coverage,
        "source_sha256_coverage": source_sha256_coverage,
        "no_internal_dedupe_failures": no_internal_dupes,
        "no_cross_split_source_clip_tensor_leakage": no_cross_split_source_clip_tensor_leakage,
        "no_cross_split_signer_identity_leakage": no_cross_split_signer_leakage,
        "tensor_files_exist_and_hash_match": tensor_coverage,
        "required_dataloader_fields_carried": required_fields_carried,
        "source_manifest_identity_preserved": source_identity_preserved,
        "existing_tensor_references_only_binding": bindings_present,
        "pen_and_thank_you_stop_conditions_carried": stop_conditions_carried,
    }
    return {"gates": gates, "all_materialization_gates_pass": all(gates.values())}


def build_manifest_contract(
    output_dir: Path,
    generated_at: str,
    analysis: dict[str, Any],
    gates: dict[str, Any],
    m3by: dict[str, Any],
) -> dict[str, Any]:
    contract_gates = copy.deepcopy(gates)
    contract_gates["gates"]["manifest_contract_written"] = True
    contract_gates["all_materialization_gates_pass"] = all(contract_gates["gates"].values())
    return {
        "schema_version": PACKAGE_CONTRACT_SCHEMA_VERSION,
        "package_id": PACKAGE_ID,
        "mission": "M3BZ",
        "generated_at": generated_at,
        "status": "ready_for_bounded_local_learnability_isolation_probe"
        if contract_gates["all_materialization_gates_pass"]
        else "blocked_manifest_materialization_gate_failure",
        "source_contract": {
            "receipt": file_reference(M3BY_RECEIPT),
            "contract_id": ((m3by.get("repaired_manifest_contract") or {}).get("contract_id")),
            "contract_status": ((m3by.get("repaired_manifest_contract") or {}).get("contract_status")),
            "selected_next_action": m3by.get("exactly_one_next_action"),
        },
        "label_order": EXPECTED_LABEL_ORDER,
        "source_id": EXPECTED_SOURCE_ID,
        "split_strategy": "preserve PopSign train/val/test source split boundaries exactly",
        "required_input_contract": REGION_GRID_INPUT_CONTRACT,
        "later_learnability_architecture": LATER_LEARNABILITY_ARCHITECTURE,
        "manifest_files": {split: file_reference(output_dir / f"{split}.json") for split in ("train", "validation", "test")},
        "source_manifest_files": source_manifest_refs(),
        "training_stop_conditions": training_stop_conditions(m3by),
        "gate_results": contract_gates,
        "summary": {
            "total_clip_count": sum(row["clip_count"] for row in analysis["splits"].values()),
            "total_tensor_file_count": sum(row["tensor_file_count"] for row in analysis["splits"].values()),
            "split_counts": {
                split: {
                    "clip_count": row["clip_count"],
                    "label_counts": row["label_counts"],
                    "signer_identity_hash_count_by_label": row["signer_identity_hash_count_by_label"],
                }
                for split, row in analysis["splits"].items()
            },
            "cross_split_leakage": analysis["cross_split_leakage"],
        },
        "boundaries": {
            "no_training_run": True,
            "no_model_fitting": True,
            "no_optimizer_or_backward_pass": True,
            "no_checkpoint_created": True,
            "no_brev_command_or_spend": True,
            "no_tensor_write_or_rewrite": True,
            "no_source_import_or_media_download": True,
            "no_source_register_change": True,
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "next_action_if_gates_pass": "continue_bounded_fresh5_learnability_isolation_probe",
    }


def validate_manifest_contract(output_dir: Path, analysis: dict[str, Any]) -> dict[str, Any]:
    contract = load_json(output_dir / "manifest-contract.json")
    manifest_files = contract.get("manifest_files")
    if not isinstance(manifest_files, dict):
        raise MaterializationError("manifest-contract.json lacks manifest_files")
    mismatches = []
    for split in ("train", "validation", "test"):
        expected = file_reference(output_dir / f"{split}.json")
        if manifest_files.get(split) != expected:
            mismatches.append({"split": split, "expected": expected, "actual": manifest_files.get(split)})
    if contract.get("label_order") != EXPECTED_LABEL_ORDER:
        mismatches.append({"field": "label_order", "actual": contract.get("label_order")})
    if contract.get("source_id") != EXPECTED_SOURCE_ID:
        mismatches.append({"field": "source_id", "actual": contract.get("source_id")})
    total_count = sum(row["clip_count"] for row in analysis["splits"].values())
    return {
        "manifest_contract": file_reference(output_dir / "manifest-contract.json"),
        "manifest_file_references_match": not mismatches,
        "mismatches": mismatches,
        "total_clip_count": total_count,
    }


def decide_next_action(gates: dict[str, Any], contract_validation: dict[str, Any]) -> tuple[str, str]:
    if gates["all_materialization_gates_pass"] and contract_validation["manifest_file_references_match"]:
        return (
            "continue_bounded_fresh5_learnability_isolation_probe",
            "The repaired-v1 package is same-label, same-source, leakage-free, hash-bound to existing tensors, and carries pen/thank_you stop conditions into the next bounded local diagnostic.",
        )
    return (
        "stop_until_supported_training_signal_exists",
        "The repaired-v1 manifest package failed one or more materialization or contract-reference gates.",
    )


def build_receipt(
    output_dir: Path,
    generated_at: str,
    analysis: dict[str, Any],
    gates: dict[str, Any],
    contract_validation: dict[str, Any],
    m3by: dict[str, Any],
) -> dict[str, Any]:
    next_action, rationale = decide_next_action(gates, contract_validation)
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise MaterializationError(f"unsupported next action: {next_action}")
    materialization_command = [
        sys.executable,
        "scripts/materialize_popsign_fresh5_repaired_manifest.py",
        "--write",
        "--receipt",
        DEFAULT_RECEIPT.as_posix(),
    ]
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": MISSION,
        "status": "completed_no_training_manifest_materialization"
        if next_action == "continue_bounded_fresh5_learnability_isolation_probe"
        else "blocked_manifest_materialization_gate_failure",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/materialize_popsign_fresh5_repaired_manifest.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path("scripts/materialize_popsign_fresh5_repaired_manifest.py")),
            "python_executable": sys.executable,
        },
        "git": {
            "head": run_git(["rev-parse", "HEAD"]),
            "head_short": run_git(["rev-parse", "--short", "HEAD"]),
            "status_short_branch": run_git(["status", "--short", "--branch"]),
        },
        "active_prompt": ACTIVE_PROMPT.as_posix(),
        "input_artifacts": input_artifacts(),
        "commands": {
            "materialization": materialization_command,
            "dataloader_contract_dry_run": [
                sys.executable,
                "scripts/train_rawframe_model.py",
                "--train-manifest",
                "data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json",
                "--validation-manifest",
                "data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json",
                "--test-manifest",
                "data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json",
                "--output-dir",
                "output/return-to-form-popsign-fresh5-repaired-v1-dry-run",
                "--model-id",
                "asl-pilot-popsign-fresh5-repaired-v1-contract",
                "--allow-small-label-set",
                "--check-files",
                "--frame-count",
                "16",
                "--image-size",
                "96",
                "--dry-run",
                "--require-input-contract",
                REGION_GRID_INPUT_CONTRACT,
            ],
            "required_audits": [
                "git status --short --branch",
                "git log -10 --oneline --decorate",
                "node scripts/audit_loop_premise.mjs --json",
                "node scripts/audit_return_to_form_plan.mjs --json",
                "node scripts/audit_no_pretrained_deps.mjs",
                "node scripts/audit_no_pretrained_artifact_json.mjs",
                "node scripts/audit_source_register.mjs",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json >/dev/null",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null",
                "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/materialize_popsign_fresh5_repaired_manifest.py scripts/verify_popsign_fresh5_repaired_manifest_contract.py scripts/design_popsign_fresh5_vocab_split_remediation.py scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json >/dev/null",
                "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
                "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json >/dev/null",
                "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json >/dev/null",
                "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json >/dev/null",
                "git diff --check",
            ],
        },
        "scope": {
            "local_only": True,
            "existing_artifacts_only": True,
            "no_training_run": True,
            "no_model_fitting": True,
            "no_optimizer_or_backward_pass": True,
            "no_checkpoint_created": True,
            "no_brev_command_or_spend": True,
            "no_tensor_write_or_rewrite": True,
            "no_existing_m3bt_or_m3bs_manifest_overwrite": True,
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
        "m3by_contract_source": {
            "status": m3by.get("status"),
            "selected_next_action": m3by.get("exactly_one_next_action"),
            "all_materialization_contract_gates_pass": (m3by.get("gate_results") or {}).get(
                "all_materialization_contract_gates_pass"
            ),
            "contract": m3by.get("repaired_manifest_contract"),
        },
        "manifest_package": {
            "package_id": PACKAGE_ID,
            "path": output_dir.as_posix(),
            "files": {
                "train": file_reference(output_dir / "train.json"),
                "validation": file_reference(output_dir / "validation.json"),
                "test": file_reference(output_dir / "test.json"),
                "manifest_contract": file_reference(output_dir / "manifest-contract.json"),
            },
            "tracked_in_git": True,
            "tensor_policy": "references existing data/tensors/return-to-form-popsign-fresh5-region-grid/*.pt files only",
        },
        "materialization_summary": analysis,
        "manifest_contract_validation": contract_validation,
        "gate_results": gates,
        "training_stop_conditions": training_stop_conditions(m3by),
        "decision": {
            "exactly_one_next_action": next_action,
            "next_action_rationale": rationale,
            "bounded_fresh5_learnability_isolation_probe_justified_now": (
                next_action == "continue_bounded_fresh5_learnability_isolation_probe"
            ),
            "fresh10_region_grid_materialization_justified_now": False,
            "detector0_or_crop_contract_justified_now": False,
            "brev_training_receipt_justified_now": False,
            "human_source_annotation_or_strategy_decision_required_now": False,
        },
        "non_actions": [
            "no training/fitting/optimizer/backward pass/checkpoint",
            "no Brev command or paid compute",
            "no tensor write or rewrite",
            "no source import or source-register change",
            "no new labels or pseudo-labels",
            "no pretrained detector, landmark, backbone, embedding, or model path",
            "no export, browser activation, model-card promotion, final-gate change, or push",
        ],
        "tracked_files_changed": [
            "scripts/materialize_popsign_fresh5_repaired_manifest.py",
            "data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json",
            "data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json",
            "data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json",
            "data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json",
            "docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json",
            "docs/session-logs/386-mission-3bz-popsign-fresh5-repaired-manifest-materialization.md",
        ],
        "exactly_one_next_action": next_action,
    }


def generated_at_value(value: str | None) -> str:
    if value:
        dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main() -> int:
    args = parse_args()
    generated_at = generated_at_value(args.generated_at)
    try:
        output_dir = args.output_dir
        m3by = load_json(M3BY_RECEIPT)
        if args.write:
            materialize_manifests(output_dir, generated_at, m3by)
            preliminary_analysis = analyze_package(output_dir)
            preliminary_gates = gate_results(preliminary_analysis, m3by)
            contract = build_manifest_contract(output_dir, generated_at, preliminary_analysis, preliminary_gates, m3by)
            write_json(output_dir / "manifest-contract.json", contract)
        analysis = analyze_package(output_dir)
        gates = gate_results(analysis, m3by)
        contract_validation = validate_manifest_contract(output_dir, analysis)
        receipt = build_receipt(output_dir, generated_at, analysis, gates, contract_validation, m3by)
        if args.write:
            write_json(args.receipt, receipt)
        print(
            json.dumps(
                {
                    "status": receipt["status"],
                    "write": args.write,
                    "receipt": args.receipt.as_posix(),
                    "package": output_dir.as_posix(),
                    "manifest_files": receipt["manifest_package"]["files"],
                    "total_clip_count": sum(row["clip_count"] for row in analysis["splits"].values()),
                    "total_tensor_file_count": sum(row["tensor_file_count"] for row in analysis["splits"].values()),
                    "all_materialization_gates_pass": gates["all_materialization_gates_pass"],
                    "exactly_one_next_action": receipt["exactly_one_next_action"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except (MaterializationError, ValueError) as error:
        print(f"M3BZ materialization failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
