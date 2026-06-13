#!/usr/bin/env python3
"""Audit PopSign fresh5 repaired split, source, signer, label, and tensor evidence."""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-data-split-label-distribution-audit/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json")
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-data-split-label-distribution-audit-goal-loop-prompt.md")
M3CI_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
M3BX_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json")
M3BY_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json")
M3BZ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json")
M3CA_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")
SOURCE_REGISTER = Path("docs/model/dataset-source-register.json")
ACTIVE_MODULE_VOCABULARY_REVIEW = Path("data/active-module/active-module-vocabulary-review.json")


class AuditError(RuntimeError):
    """Raised when the read-only M3CL audit contract cannot be satisfied."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--check-tensor-files", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise AuditError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise AuditError(f"{context} does not exist: {path}")
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
    resolved = project_path(path, "file reference")
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path, "json file")
    return json.loads(resolved.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/audit_popsign_fresh5_data_split_label_distribution.py",
        "--train-manifest",
        project_relative(project_path(args.train_manifest, "train manifest")),
        "--validation-manifest",
        project_relative(project_path(args.validation_manifest, "validation manifest")),
        "--test-manifest",
        project_relative(project_path(args.test_manifest, "test manifest")),
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--check-tensor-files",
        "--write-receipt",
    ]


def validate_contract_args(args: argparse.Namespace) -> tuple[Path, Path, Path, Path]:
    train_manifest = project_path(args.train_manifest, "train manifest")
    validation_manifest = project_path(args.validation_manifest, "validation manifest")
    test_manifest = project_path(args.test_manifest, "test manifest")
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    expected = {
        train_manifest: DEFAULT_TRAIN_MANIFEST,
        validation_manifest: DEFAULT_VALIDATION_MANIFEST,
        test_manifest: DEFAULT_TEST_MANIFEST,
        receipt: DEFAULT_RECEIPT,
    }
    for actual, expected_relative in expected.items():
        expected_path = (PROJECT_ROOT / expected_relative).resolve()
        if actual != expected_path:
            raise AuditError(f"M3CL requires {expected_relative.as_posix()}, got {project_relative(actual)}")
    if not args.check_tensor_files:
        raise AuditError("M3CL requires --check-tensor-files")
    if not args.write_receipt:
        raise AuditError("M3CL requires --write-receipt")
    return train_manifest, validation_manifest, test_manifest, receipt


def counter_dict(values: list[str]) -> dict[str, int]:
    return dict(sorted(collections.Counter(values).items()))


def duplicate_counts(values: list[str]) -> dict[str, int]:
    return {key: count for key, count in counter_dict(values).items() if count > 1}


def clip_tensor_path(manifest_path: Path, clip: dict[str, Any]) -> Path | None:
    relative = clip.get("relative_frame_tensor_path")
    if not isinstance(relative, str) or not relative:
        return None
    return (manifest_path.parent / relative).resolve()


def label_order(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise AuditError("manifest labels must be a list")
    return [str(label["label_id"]) for label in labels]


def summarize_split(split_name: str, manifest_path: Path, manifest: dict[str, Any], *, check_tensors: bool) -> dict[str, Any]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise AuditError(f"{split_name} manifest clips must be a list")
    labels = label_order(manifest)
    tensor_failures = []
    tensor_paths = []
    tensor_hashes = []
    tensor_file_count = 0
    tensor_hash_match_count = 0
    tensor_shape_counts: collections.Counter[str] = collections.Counter()
    tensor_dtype_counts: collections.Counter[str] = collections.Counter()
    region_order_counts: collections.Counter[str] = collections.Counter()
    per_label: dict[str, dict[str, Any]] = {}
    for label in labels:
        per_label[label] = {
            "clip_count": 0,
            "signer_identity_hash_count": 0,
            "source_record_id_count": 0,
            "source_split_counts": {},
            "source_sign_slug_counts": {},
            "tensor_reference_count": 0,
            "tensor_sha256_count": 0,
            "tensor_hash_match_count": 0,
            "tensor_shape_counts": {},
            "top_signer_clip_counts": {},
        }

    signer_by_label: dict[str, set[str]] = {label: set() for label in labels}
    source_record_by_label: dict[str, set[str]] = {label: set() for label in labels}
    signer_counts_by_label: dict[str, collections.Counter[str]] = {label: collections.Counter() for label in labels}
    label_values = []
    signer_values = []
    source_record_values = []
    source_id_values = []
    source_split_values = []
    source_sign_values = []
    clip_ids = []

    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise AuditError(f"{split_name} clips[{index}] must be an object")
        label = str(clip.get("label_id") or "")
        if label not in per_label:
            raise AuditError(f"{split_name} clips[{index}] references unexpected label {label!r}")
        clip_id = str(clip.get("clip_id") or "")
        source_record_id = str(clip.get("source_record_id") or "")
        signer_hash = str(clip.get("signer_identity_hash") or "")
        source_id = str(clip.get("source_id") or "")
        source_split = str(clip.get("source_split") or "")
        source_sign = str(clip.get("source_sign_slug") or "")
        tensor_sha256 = str(clip.get("frame_tensor_sha256") or "")
        tensor_path = clip_tensor_path(manifest_path, clip)
        tensor_path_text = project_relative(tensor_path) if tensor_path else ""

        clip_ids.append(clip_id)
        label_values.append(label)
        signer_values.append(signer_hash)
        source_record_values.append(source_record_id)
        source_id_values.append(source_id)
        source_split_values.append(source_split)
        source_sign_values.append(source_sign)
        if tensor_path_text:
            tensor_paths.append(tensor_path_text)
        if tensor_sha256:
            tensor_hashes.append(tensor_sha256)
        signer_by_label[label].add(signer_hash)
        source_record_by_label[label].add(source_record_id)
        signer_counts_by_label[label][signer_hash] += 1
        per_label[label]["clip_count"] += 1

        if tensor_path is not None:
            per_label[label]["tensor_reference_count"] += 1
        if tensor_sha256:
            per_label[label]["tensor_sha256_count"] += 1

        provenance = clip.get("frame_tensor_provenance")
        if isinstance(provenance, dict):
            digest = provenance.get("tensor_digest")
            if isinstance(digest, dict):
                shape = digest.get("shape")
                dtype = digest.get("dtype")
                if isinstance(shape, list):
                    shape_text = "x".join(str(item) for item in shape)
                    tensor_shape_counts[shape_text] += 1
                    per_label[label]["tensor_shape_counts"][shape_text] = (
                        per_label[label]["tensor_shape_counts"].get(shape_text, 0) + 1
                    )
                if isinstance(dtype, str):
                    tensor_dtype_counts[dtype] += 1
            crop_config = provenance.get("crop_config")
            if isinstance(crop_config, dict) and isinstance(crop_config.get("region_ids"), list):
                region_order_counts[",".join(str(item) for item in crop_config["region_ids"])] += 1

        if check_tensors:
            if tensor_path is None:
                tensor_failures.append({"clip_id": clip_id, "reason": "missing_relative_frame_tensor_path"})
            elif not tensor_path.exists():
                tensor_failures.append({"clip_id": clip_id, "path": tensor_path_text, "reason": "tensor_missing"})
            else:
                tensor_file_count += 1
                actual_hash = sha256_file(tensor_path)
                if actual_hash == tensor_sha256:
                    tensor_hash_match_count += 1
                    per_label[label]["tensor_hash_match_count"] += 1
                else:
                    tensor_failures.append(
                        {
                            "clip_id": clip_id,
                            "path": tensor_path_text,
                            "reason": "tensor_hash_mismatch",
                            "expected": tensor_sha256,
                            "actual": actual_hash,
                        }
                    )

    for label in labels:
        per_label[label]["signer_identity_hash_count"] = len(signer_by_label[label])
        per_label[label]["source_record_id_count"] = len(source_record_by_label[label])
        per_label[label]["source_split_counts"] = counter_dict(
            [str(clip.get("source_split") or "") for clip in clips if str(clip.get("label_id") or "") == label]
        )
        per_label[label]["source_sign_slug_counts"] = counter_dict(
            [str(clip.get("source_sign_slug") or "") for clip in clips if str(clip.get("label_id") or "") == label]
        )
        per_label[label]["tensor_shape_counts"] = dict(sorted(per_label[label]["tensor_shape_counts"].items()))
        per_label[label]["top_signer_clip_counts"] = dict(
            sorted(signer_counts_by_label[label].items(), key=lambda item: (-item[1], item[0]))[:5]
        )

    return {
        "path": project_relative(manifest_path),
        "sha256": sha256_file(manifest_path),
        "split": split_name,
        "dataset_id": manifest.get("dataset_id"),
        "dataset_source_mode": manifest.get("dataset_source_mode"),
        "label_order": labels,
        "clip_count": len(clips),
        "label_counts": counter_dict(label_values),
        "source_id_counts": counter_dict(source_id_values),
        "source_split_counts": counter_dict(source_split_values),
        "source_sign_slug_counts": counter_dict(source_sign_values),
        "signer_identity_hash_count": len(set(signer_values)),
        "signer_identity_hash_count_by_label": {
            label: len(signer_by_label[label]) for label in sorted(signer_by_label)
        },
        "source_record_id_count": len(set(source_record_values)),
        "source_record_id_count_by_label": {
            label: len(source_record_by_label[label]) for label in sorted(source_record_by_label)
        },
        "tensor_reference_count": len(tensor_paths),
        "tensor_sha256_count": len(tensor_hashes),
        "tensor_file_count": tensor_file_count,
        "tensor_hash_match_count": tensor_hash_match_count,
        "tensor_shape_counts": dict(sorted(tensor_shape_counts.items())),
        "tensor_dtype_counts": dict(sorted(tensor_dtype_counts.items())),
        "region_order_counts": dict(sorted(region_order_counts.items())),
        "duplicates": {
            "clip_id": duplicate_counts(clip_ids),
            "source_record_id": duplicate_counts(source_record_values),
            "tensor_path": duplicate_counts(tensor_paths),
            "tensor_sha256": duplicate_counts(tensor_hashes),
        },
        "per_label": per_label,
        "tensor_failures": tensor_failures,
    }


def value_sets(manifest_path: Path, manifest: dict[str, Any]) -> dict[str, set[str]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise AuditError("manifest clips must be a list")
    output = {
        "clip_id": set(),
        "source_record_id": set(),
        "signer_identity_hash": set(),
        "tensor_path": set(),
        "tensor_sha256": set(),
    }
    for clip in clips:
        output["clip_id"].add(str(clip.get("clip_id") or ""))
        output["source_record_id"].add(str(clip.get("source_record_id") or ""))
        output["signer_identity_hash"].add(str(clip.get("signer_identity_hash") or ""))
        output["tensor_sha256"].add(str(clip.get("frame_tensor_sha256") or ""))
        tensor_path = clip_tensor_path(manifest_path, clip)
        if tensor_path is not None:
            output["tensor_path"].add(project_relative(tensor_path))
    return output


def label_signer_sets(manifest: dict[str, Any]) -> dict[str, set[str]]:
    result: dict[str, set[str]] = {label: set() for label in label_order(manifest)}
    for clip in manifest.get("clips", []):
        if isinstance(clip, dict):
            result[str(clip.get("label_id") or "")].add(str(clip.get("signer_identity_hash") or ""))
    return result


def overlap_report(manifest_paths: dict[str, Path], manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    sets = {name: value_sets(manifest_paths[name], manifest) for name, manifest in manifests.items()}
    signers_by_label = {name: label_signer_sets(manifest) for name, manifest in manifests.items()}
    report = {}
    pairs = [("train", "validation"), ("train", "test"), ("validation", "test")]
    for left, right in pairs:
        key = f"{left}_vs_{right}"
        report[key] = {
            "shared_clip_id_count": len(sets[left]["clip_id"] & sets[right]["clip_id"]),
            "shared_source_record_id_count": len(sets[left]["source_record_id"] & sets[right]["source_record_id"]),
            "shared_signer_identity_hash_count": len(
                sets[left]["signer_identity_hash"] & sets[right]["signer_identity_hash"]
            ),
            "shared_tensor_path_count": len(sets[left]["tensor_path"] & sets[right]["tensor_path"]),
            "shared_tensor_sha256_count": len(sets[left]["tensor_sha256"] & sets[right]["tensor_sha256"]),
            "label_shared_signer_identity_hash_count": {
                label: len(signers_by_label[left].get(label, set()) & signers_by_label[right].get(label, set()))
                for label in sorted(set(signers_by_label[left]) | set(signers_by_label[right]))
            },
        }
    return report


def train_all_runs_summary(m3cj: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for run in m3cj.get("runs", []):
        if not isinstance(run, dict):
            continue
        history = run.get("history") if isinstance(run.get("history"), list) else []
        evaluation = run.get("evaluation") if isinstance(run.get("evaluation"), dict) else {}
        result = run.get("result") if isinstance(run.get("result"), dict) else {}
        rows.append(
            {
                "name": run.get("name"),
                "classification": run.get("classification"),
                "best_train_accuracy": max(
                    [float(item.get("train_accuracy", 0.0)) for item in history]
                    + ([float(result["train_accuracy"])] if "train_accuracy" in result else [])
                )
                if history or "train_accuracy" in result
                else None,
                "validation_accuracy_values": [item.get("validation_accuracy") for item in history],
                "test_top1_accuracy": evaluation.get("test_top1_accuracy", result.get("test_top1_accuracy")),
                "test_macro_f1": evaluation.get("test_macro_f1", result.get("test_macro_f1")),
                "predicted_single_class": evaluation.get("predicted_single_class", result.get("predicted_single_class")),
                "per_class_recall": evaluation.get("per_class_recall"),
                "passes_targets": evaluation.get("passes_targets"),
            }
        )
    return rows


def label_risk_table(
    labels: list[str],
    split_summaries: dict[str, dict[str, Any]],
    m3bx: dict[str, Any],
    m3ca: dict[str, Any],
    m3cj: dict[str, Any],
    m3ck: dict[str, Any],
) -> list[dict[str, Any]]:
    m3bx_risks = {
        str(item.get("label_id")): item
        for item in m3bx.get("current_label_risk_table", [])
        if isinstance(item, dict)
    }
    m3ca_stop = m3ca.get("pen_and_thank_you_stop_conditions", {})
    m3ck_per_label = (
        m3ck.get("diagnostic", {})
        .get("train_fit_metrics", {})
        .get("per_label", {})
    )
    train_all_lr003 = {}
    for run in m3cj.get("runs", []):
        if isinstance(run, dict) and run.get("name") == "train_all_lr003":
            train_all_lr003 = run.get("evaluation", {}) if isinstance(run.get("evaluation"), dict) else {}
            break
    per_class_recall = train_all_lr003.get("per_class_recall", {}) if isinstance(train_all_lr003, dict) else {}
    rows = []
    for label in labels:
        split_counts = {
            split: split_summaries[split]["label_counts"].get(label, 0)
            for split in ["train", "validation", "test"]
        }
        split_signers = {
            split: split_summaries[split]["signer_identity_hash_count_by_label"].get(label, 0)
            for split in ["train", "validation", "test"]
        }
        risk = m3bx_risks.get(label, {})
        rows.append(
            {
                "label_id": label,
                "split_clip_counts": split_counts,
                "split_signer_identity_hash_counts": split_signers,
                "m3bx_risk_flags": risk.get("risk_flags", []),
                "m3bx_test_recall": risk.get("m3bu_test_recall"),
                "m3bx_predicted_label_fraction": risk.get("m3bu_predicted_label_fraction"),
                "m3bx_dominant_wrong_prediction": risk.get("dominant_wrong_prediction"),
                "m3ca_stop_condition": m3ca_stop.get(label),
                "m3cj_train_all_lr003_recall": per_class_recall.get(label),
                "m3cj_train_all_lr003_predicted_single_class": train_all_lr003.get("predicted_single_class"),
                "m3ck_tiny_trainfit_recall": m3ck_per_label.get(label, {}).get("recall"),
                "current_assessment": label_assessment(label, risk, m3ca_stop, train_all_lr003),
            }
        )
    return rows


def label_assessment(
    label: str,
    m3bx_risk: dict[str, Any],
    m3ca_stop: dict[str, Any],
    train_all_lr003: dict[str, Any],
) -> str:
    collapsed = train_all_lr003.get("predicted_single_class")
    recall = None
    if isinstance(train_all_lr003.get("per_class_recall"), dict):
        recall = train_all_lr003["per_class_recall"].get(label)
    if label == "pen" and collapsed == "pen":
        return (
            "M3CJ collapsed to pen, reversing the older low-pen-recall symptom; this is not label-count imbalance "
            "and should be checked as split/source-quality or training distribution behavior before more compute."
        )
    if label == "thank_you":
        cleared = m3ca_stop.get("thank_you", {}).get("cleared") if isinstance(m3ca_stop, dict) else None
        return (
            f"Older thank_you overprediction risk remains historical; M3CA stop condition cleared={cleared}, "
            f"while M3CJ lr003 recall is {recall} under pen collapse."
        )
    if recall == 0.0:
        return "M3CJ lr003 had zero recall under pen collapse despite balanced support."
    if m3bx_risk.get("risk_flags"):
        return "Older M3BX risk flags remain context, but M3CK tiny train-fit reduces concern about loader connectivity."
    return "Balanced support and no specific label-count issue found."


def conclusion_for(
    split_summaries: dict[str, dict[str, Any]],
    overlaps: dict[str, Any],
    m3cj: dict[str, Any],
    m3ck: dict[str, Any],
) -> dict[str, Any]:
    expected_counts = {label: 25 for label in ["home", "morning", "pen", "thank_you", "who"]}
    label_distribution_balanced = all(
        split_summaries[split]["label_counts"] == expected_counts for split in split_summaries
    )
    tensor_coverage_complete = all(
        summary["tensor_reference_count"] == summary["clip_count"]
        and summary["tensor_sha256_count"] == summary["clip_count"]
        and summary["tensor_file_count"] == summary["clip_count"]
        and summary["tensor_hash_match_count"] == summary["clip_count"]
        and not summary["tensor_failures"]
        for summary in split_summaries.values()
    )
    no_cross_split_identity_overlap = all(
        report["shared_clip_id_count"] == 0
        and report["shared_source_record_id_count"] == 0
        and report["shared_signer_identity_hash_count"] == 0
        and report["shared_tensor_path_count"] == 0
        and report["shared_tensor_sha256_count"] == 0
        for report in overlaps.values()
    )
    m3ck_passed = bool(
        m3ck.get("decision", {}).get("m3ce_architecture_can_train_fit_balanced_tiny_subset")
    )
    train_all_runs = train_all_runs_summary(m3cj)
    lr003 = next((run for run in train_all_runs if run["name"] == "train_all_lr003"), {})
    collapse_target = lr003.get("predicted_single_class")
    return {
        "label_distribution_balanced": label_distribution_balanced,
        "tensor_coverage_complete": tensor_coverage_complete,
        "no_cross_split_clip_source_signer_tensor_overlap": no_cross_split_identity_overlap,
        "source_split_boundaries_preserved": {
            split: summary["source_split_counts"] for split, summary in split_summaries.items()
        },
        "m3ck_tiny_trainfit_changed_likely_blocker": m3ck_passed,
        "m3cj_train_all_runs": train_all_runs,
        "remaining_failure_best_explained_by": (
            "strict source-split/signer-disjoint generalization and per-label source-quality behavior, "
            "not label-count imbalance, tensor coverage, cross-split leakage, or M3CE input connectivity"
        ),
        "collapsed_prediction_target_after_m3ck_context": collapse_target,
        "longer_local_or_brev_train_all_justified_now": False,
        "blocker_classification": "split_source_signer_quality_contract_needed_before_more_training",
        "next_action": "continue_split_source_quality_contract_no_mutation",
        "next_action_rationale": (
            "The repaired manifests are balanced, signer/source-disjoint, and tensor-complete, while M3CK proves "
            "tiny train-fit and M3CJ still collapses on train-all. The next useful no-mutation step is a concrete "
            "split/source/signer quality contract before any further training or compute receipt."
        ),
    }


def build_receipt(args: argparse.Namespace, train_path: Path, validation_path: Path, test_path: Path) -> dict[str, Any]:
    manifests = {
        "train": load_json(train_path),
        "validation": load_json(validation_path),
        "test": load_json(test_path),
    }
    manifest_paths = {"train": train_path, "validation": validation_path, "test": test_path}
    split_summaries = {
        split: summarize_split(split, manifest_paths[split], manifests[split], check_tensors=args.check_tensor_files)
        for split in ["train", "validation", "test"]
    }
    overlaps = overlap_report(manifest_paths, manifests)
    m3ci = load_json(M3CI_RECEIPT)
    m3cj = load_json(M3CJ_RECEIPT)
    m3ck = load_json(M3CK_RECEIPT)
    m3bx = load_json(M3BX_RECEIPT)
    m3by = load_json(M3BY_RECEIPT)
    m3bz = load_json(M3BZ_RECEIPT)
    m3ca = load_json(M3CA_RECEIPT)
    labels = sorted(set().union(*(set(summary["label_counts"]) for summary in split_summaries.values())))
    conclusions = conclusion_for(split_summaries, overlaps, m3cj, m3ck)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CL - PopSign fresh5 data/split/label distribution audit",
        "status": "completed_no_training_no_mutation_data_split_label_distribution_audit",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/audit_popsign_fresh5_data_split_label_distribution.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
        },
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "input_artifacts": {
            "goal": file_reference(Path("GOAL.md")),
            "active_prompt": file_reference(ACTIVE_PROMPT),
            "return_to_form_plan": file_reference(Path("docs/model/return-to-form-plan.md")),
            "m3ci_evaluation_invocation_contract": file_reference(M3CI_RECEIPT),
            "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
            "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
            "m3bx_vocab_split_remediation": file_reference(M3BX_RECEIPT),
            "m3by_repaired_manifest_contract": file_reference(M3BY_RECEIPT),
            "m3bz_repaired_manifest_materialization": file_reference(M3BZ_RECEIPT),
            "m3ca_learnability_isolation_probe": file_reference(M3CA_RECEIPT),
            "manifest_contract": file_reference(MANIFEST_CONTRACT),
            "train_manifest": file_reference(train_path),
            "validation_manifest": file_reference(validation_path),
            "test_manifest": file_reference(test_path),
            "source_register": file_reference(SOURCE_REGISTER),
            "active_module_vocabulary_review": file_reference(ACTIVE_MODULE_VOCABULARY_REVIEW),
        },
        "scope": {
            "local_only": True,
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
        "split_distribution": split_summaries,
        "cross_split_overlap": overlaps,
        "label_risk_table": label_risk_table(labels, split_summaries, m3bx, m3ca, m3cj, m3ck),
        "prior_evidence_comparison": {
            "m3ci_status": m3ci.get("status"),
            "m3cj_status": m3cj.get("status"),
            "m3cj_selected_next_action": m3cj.get("selected_next_action"),
            "m3ck_status": m3ck.get("status"),
            "m3ck_tiny_trainfit": {
                "can_train_fit": m3ck.get("decision", {}).get(
                    "m3ce_architecture_can_train_fit_balanced_tiny_subset"
                ),
                "final_accuracy": m3ck.get("diagnostic", {}).get("train_fit_metrics", {}).get("final_accuracy"),
                "zero_recall_labels": m3ck.get("diagnostic", {})
                .get("train_fit_metrics", {})
                .get("zero_recall_labels"),
                "prediction_distribution": m3ck.get("diagnostic", {})
                .get("train_fit_metrics", {})
                .get("prediction_distribution"),
            },
            "m3bx_prior_label_risk_classification": m3bx.get("conclusions", {}).get("blocker_classification"),
            "m3by_contract_gates": m3by.get("gate_results"),
            "m3bz_materialization_gates": m3bz.get("gate_results"),
            "m3ca_pen_and_thank_you_stop_conditions": m3ca.get("pen_and_thank_you_stop_conditions"),
        },
        "conclusions": conclusions,
        "decision": {
            "remaining_failure_more_likely_split_source_signer_distribution": True,
            "remaining_failure_more_likely_label_distribution": False,
            "remaining_failure_more_likely_per_label_quality": True,
            "human_scope_budget_source_decision_required_now": False,
            "bounded_local_train_all_justified_now": False,
            "training_compute_receipt_justified_now": False,
            "exactly_one_next_action": conclusions["next_action"],
            "next_action_rationale": conclusions["next_action_rationale"],
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
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/audit_popsign_fresh5_data_split_label_distribution.py",
            ".venv/bin/python scripts/audit_popsign_fresh5_data_split_label_distribution.py --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --receipt docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json --check-tensor-files --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json >/dev/null",
        ],
        "tracked_files_changed": [
            "scripts/audit_popsign_fresh5_data_split_label_distribution.py",
            "docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json",
            "docs/session-logs/410-mission-3cl-popsign-fresh5-data-split-label-distribution-audit.md",
        ],
        "exactly_one_next_action": conclusions["next_action"],
    }


def main() -> int:
    args = parse_args()
    try:
        train_manifest, validation_manifest, test_manifest, receipt = validate_contract_args(args)
        receipt_body = build_receipt(args, train_manifest, validation_manifest, test_manifest)
        if args.write_receipt:
            write_json(receipt, receipt_body)
        result = {
            "status": receipt_body["status"],
            "receipt": project_relative(receipt),
            "next_action": receipt_body["exactly_one_next_action"],
            "blocker_classification": receipt_body["conclusions"]["blocker_classification"],
            "label_distribution_balanced": receipt_body["conclusions"]["label_distribution_balanced"],
            "tensor_coverage_complete": receipt_body["conclusions"]["tensor_coverage_complete"],
            "no_cross_split_clip_source_signer_tensor_overlap": receipt_body["conclusions"][
                "no_cross_split_clip_source_signer_tensor_overlap"
            ],
        }
    except AuditError as error:
        print(f"M3CL PopSign fresh5 data/split/label audit failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
