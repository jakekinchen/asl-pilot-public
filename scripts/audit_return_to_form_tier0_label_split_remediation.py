#!/usr/bin/env python3
"""Audit the M3AE-K Tier 0 label/split/source-distribution blocker."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any
from hashlib import sha256


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-label-split-remediation/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-label-split-remediation.json"
DEFAULT_MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "source_triage_report": ROOT / "docs" / "validation" / "return-to-form-tier0-failure-remediation-triage.json",
    "api_strategy_memo": ROOT / "artifacts" / "research" / "observer-195-tier0-strategy-api-response.md",
    "m3ae_i_microprobe": ROOT / "docs" / "validation" / "return-to-form-tier0-model-architecture-microprobe.json",
    "m3ae_j_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-microprobe-config-smoke.json",
    "m3ae_g_baseline": ROOT / "docs" / "validation" / "return-to-form-tier0-learnability-smoke-rerun.json",
    "m3ae_f_tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
}
NEXT_ACTION = {
    "id": "source_distribution_remediation",
    "description": (
        "Remediate the Tier 0 source/signer distribution before any additional "
        "training: the current PopSign-preserved train split is learnable, but "
        "validation/test are signer-disjoint and still near random under the "
        "crop-identity-preserving configuration."
    ),
}


class AuditError(RuntimeError):
    """Raised when the label/split remediation audit cannot run."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def sha256_file(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise AuditError(f"missing reference artifact: {project_relative(path)}")
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise AuditError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise AuditError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise AuditError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sorted_counter(counter: Counter[str]) -> dict[str, int]:
    return {key: int(counter[key]) for key in sorted(counter)}


def labels_for_manifest(manifest: dict[str, Any], manifest_path: Path) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list) or not labels:
        raise AuditError(f"{project_relative(manifest_path)} labels must be a non-empty array")
    result: list[str] = []
    for item in labels:
        if not isinstance(item, dict) or not isinstance(item.get("label_id"), str):
            raise AuditError(f"{project_relative(manifest_path)} labels must contain label_id strings")
        result.append(str(item["label_id"]))
    return sorted(result)


def resolve_manifest_relative(manifest_path: Path, relative_path: Any) -> str:
    if not isinstance(relative_path, str) or not relative_path:
        return ""
    return project_relative((manifest_path.parent / relative_path).resolve())


def split_summary(split: str, manifest_path: Path, manifest: dict[str, Any], labels: list[str]) -> dict[str, Any]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise AuditError(f"{project_relative(manifest_path)} clips must be an array")

    label_counts: Counter[str] = Counter()
    source_ids: Counter[str] = Counter()
    source_splits: Counter[str] = Counter()
    source_categories: Counter[str] = Counter()
    archive_urls: Counter[str] = Counter()
    signer_sets_by_label: dict[str, set[str]] = {label: set() for label in labels}
    source_ids_by_label: dict[str, Counter[str]] = {label: Counter() for label in labels}
    source_splits_by_label: dict[str, Counter[str]] = {label: Counter() for label in labels}
    records_by_label: dict[str, set[str]] = {label: set() for label in labels}
    tensors_by_label: dict[str, set[str]] = {label: set() for label in labels}
    clip_ids: set[str] = set()
    source_record_ids: set[str] = set()
    signer_hashes: set[str] = set()
    tensor_paths: set[str] = set()
    examples_by_label: dict[str, list[str]] = {label: [] for label in labels}

    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise AuditError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
        label_id = str(clip.get("label_id", ""))
        if label_id not in labels:
            raise AuditError(f"{project_relative(manifest_path)} clips[{index}] unknown label_id={label_id}")
        clip_id = str(clip.get("clip_id", ""))
        source_record_id = str(clip.get("source_record_id", ""))
        signer_hash = str(clip.get("signer_identity_hash", ""))
        tensor_path = resolve_manifest_relative(manifest_path, clip.get("relative_frame_tensor_path"))
        source_id = str(clip.get("source_id", ""))
        source_split = str(clip.get("source_split", ""))
        source_category = str(clip.get("source_category", ""))
        archive_url = str(clip.get("source_archive_url", ""))

        label_counts[label_id] += 1
        source_ids[source_id] += 1
        source_splits[source_split] += 1
        source_categories[source_category] += 1
        archive_urls[archive_url] += 1
        clip_ids.add(clip_id)
        source_record_ids.add(source_record_id)
        signer_hashes.add(signer_hash)
        tensor_paths.add(tensor_path)
        signer_sets_by_label[label_id].add(signer_hash)
        source_ids_by_label[label_id][source_id] += 1
        source_splits_by_label[label_id][source_split] += 1
        records_by_label[label_id].add(source_record_id)
        tensors_by_label[label_id].add(tensor_path)
        if len(examples_by_label[label_id]) < 3:
            examples_by_label[label_id].append(clip_id)

    return {
        "split": split,
        "manifest": file_ref(manifest_path),
        "clip_count": len(clips),
        "label_counts": sorted_counter(label_counts),
        "source_ids": sorted_counter(source_ids),
        "source_splits": sorted_counter(source_splits),
        "source_categories": sorted_counter(source_categories),
        "source_archive_urls": sorted_counter(archive_urls),
        "unique_clip_ids": len(clip_ids),
        "unique_source_record_ids": len(source_record_ids),
        "unique_signer_identity_hashes": len(signer_hashes),
        "unique_tensor_paths": len(tensor_paths),
        "example_clip_ids_by_label": {label: examples_by_label[label] for label in labels},
        "_sets": {
            "clip_ids": clip_ids,
            "source_record_ids": source_record_ids,
            "signer_identity_hashes": signer_hashes,
            "tensor_paths": tensor_paths,
            "source_ids": set(source_ids),
            "signer_identity_hashes_by_label": signer_sets_by_label,
            "source_record_ids_by_label": records_by_label,
            "tensor_paths_by_label": tensors_by_label,
        },
        "_per_label_counters": {
            "source_ids": source_ids_by_label,
            "source_splits": source_splits_by_label,
        },
    }


def overlap_record(left: set[str], right: set[str]) -> dict[str, Any]:
    overlap = sorted(value for value in left.intersection(right) if value)
    return {
        "count": len(overlap),
        "examples": overlap[:10],
    }


def overlap_checks(summaries: dict[str, dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    pairs = [("train", "validation"), ("train", "test"), ("validation", "test")]
    fields = ["clip_ids", "source_record_ids", "signer_identity_hashes", "tensor_paths", "source_ids"]
    checks: dict[str, Any] = {}
    for field in fields:
        checks[field] = {
            f"{left}_{right}": overlap_record(summaries[left]["_sets"][field], summaries[right]["_sets"][field])
            for left, right in pairs
        }
    checks["source_ids"]["note"] = (
        "All splits share the same approved coarse source_id. This is expected and is not "
        "clip/source-record leakage by itself."
    )

    per_label: dict[str, Any] = {}
    for label in labels:
        per_label[label] = {}
        for field in ["signer_identity_hashes_by_label", "source_record_ids_by_label", "tensor_paths_by_label"]:
            public_name = field.replace("_by_label", "")
            per_label[label][public_name] = {
                f"{left}_{right}": overlap_record(
                    summaries[left]["_sets"][field][label],
                    summaries[right]["_sets"][field][label],
                )
                for left, right in pairs
            }
    checks["per_label"] = per_label
    return checks


def public_split_summary(summary: dict[str, Any], labels: list[str]) -> dict[str, Any]:
    per_label = {}
    for label in labels:
        per_label[label] = {
            "clip_count": summary["label_counts"].get(label, 0),
            "unique_signer_identity_hashes": len(summary["_sets"]["signer_identity_hashes_by_label"][label]),
            "unique_source_record_ids": len(summary["_sets"]["source_record_ids_by_label"][label]),
            "unique_tensor_paths": len(summary["_sets"]["tensor_paths_by_label"][label]),
            "source_ids": sorted_counter(summary["_per_label_counters"]["source_ids"][label]),
            "source_splits": sorted_counter(summary["_per_label_counters"]["source_splits"][label]),
        }
    return {
        "clip_count": summary["clip_count"],
        "label_counts": summary["label_counts"],
        "source_ids": summary["source_ids"],
        "source_splits": summary["source_splits"],
        "source_categories": summary["source_categories"],
        "unique_clip_ids": summary["unique_clip_ids"],
        "unique_source_record_ids": summary["unique_source_record_ids"],
        "unique_signer_identity_hashes": summary["unique_signer_identity_hashes"],
        "unique_tensor_paths": summary["unique_tensor_paths"],
        "example_clip_ids_by_label": summary["example_clip_ids_by_label"],
        "per_label": per_label,
    }


def top_confusions(labels: list[str], row: list[Any]) -> list[dict[str, Any]]:
    total = sum(int(value) for value in row)
    ranked = []
    for label, count_value in zip(labels, row):
        count = int(count_value)
        if count <= 0:
            continue
        ranked.append(
            {
                "predicted_label": label,
                "count": count,
                "fraction_of_true_label": (count / total) if total else 0.0,
            }
        )
    ranked.sort(key=lambda item: (-int(item["count"]), str(item["predicted_label"])))
    return ranked


def confusion_summary(smoke_report: dict[str, Any]) -> dict[str, Any]:
    training = smoke_report.get("training")
    if not isinstance(training, dict):
        raise AuditError("M3AE-J smoke report missing training object")
    metrics = training.get("metrics")
    if not isinstance(metrics, dict):
        raise AuditError("M3AE-J smoke report missing training.metrics object")

    result: dict[str, Any] = {}
    for split in ["train", "validation", "test"]:
        split_metrics = metrics.get(split)
        if not isinstance(split_metrics, dict):
            raise AuditError(f"M3AE-J smoke report missing training.metrics.{split}")
        labels = split_metrics.get("confusion_matrix_labels")
        matrix = split_metrics.get("confusion_matrix")
        per_label_values = split_metrics.get("per_label")
        if not isinstance(labels, list) or not all(isinstance(item, str) for item in labels):
            raise AuditError(f"M3AE-J {split} confusion_matrix_labels must be strings")
        if not isinstance(matrix, list) or len(matrix) != len(labels):
            raise AuditError(f"M3AE-J {split} confusion_matrix shape mismatch")
        prediction_totals = Counter()
        per_label = {}
        per_label_by_id = {
            str(item.get("label_id")): item
            for item in per_label_values
            if isinstance(item, dict) and isinstance(item.get("label_id"), str)
        } if isinstance(per_label_values, list) else {}

        for true_label, row in zip(labels, matrix):
            if not isinstance(row, list) or len(row) != len(labels):
                raise AuditError(f"M3AE-J {split} confusion row shape mismatch for {true_label}")
            for predicted_label, count_value in zip(labels, row):
                prediction_totals[predicted_label] += int(count_value)
            label_metrics = per_label_by_id.get(true_label, {})
            per_label[true_label] = {
                "support": int(label_metrics.get("support", sum(int(value) for value in row))),
                "true_positive": int(label_metrics.get("true_positive", 0)),
                "recall": float(label_metrics.get("recall", 0.0)),
                "precision": float(label_metrics.get("precision", 0.0)),
                "f1": float(label_metrics.get("f1", 0.0)),
                "confusions": top_confusions(labels, row),
                "dominant_wrong_predictions": [
                    item for item in top_confusions(labels, row) if item["predicted_label"] != true_label
                ][:3],
            }
        zero_recall = sorted(label for label, item in per_label.items() if item["recall"] == 0.0)
        result[split] = {
            "examples": int(split_metrics.get("examples", 0)),
            "top1_accuracy": float(split_metrics.get("top1_accuracy", 0.0)),
            "macro_recall": float(split_metrics.get("macro_recall", 0.0)),
            "macro_f1": float(split_metrics.get("macro_f1", 0.0)),
            "loss": float(split_metrics.get("loss", 0.0)),
            "confusion_matrix_labels": labels,
            "prediction_totals": sorted_counter(prediction_totals),
            "zero_recall_labels": zero_recall,
            "per_label": per_label,
        }
    return result


def source_signer_distribution(summaries: dict[str, dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    aggregate_unique_signers = {
        split: summaries[split]["unique_signer_identity_hashes"]
        for split in ["train", "validation", "test"]
    }
    per_label = {}
    for label in labels:
        per_label[label] = {
            split: {
                "clip_count": summaries[split]["label_counts"].get(label, 0),
                "unique_signer_identity_hashes": len(
                    summaries[split]["_sets"]["signer_identity_hashes_by_label"][label]
                ),
                "source_ids": sorted_counter(summaries[split]["_per_label_counters"]["source_ids"][label]),
                "source_splits": sorted_counter(summaries[split]["_per_label_counters"]["source_splits"][label]),
            }
            for split in ["train", "validation", "test"]
        }
    return {
        "aggregate_unique_signers_by_split": aggregate_unique_signers,
        "source_id_by_split": {
            split: summaries[split]["source_ids"]
            for split in ["train", "validation", "test"]
        },
        "source_split_by_split": {
            split: summaries[split]["source_splits"]
            for split in ["train", "validation", "test"]
        },
        "source_category_by_split": {
            split: summaries[split]["source_categories"]
            for split in ["train", "validation", "test"]
        },
        "per_label": per_label,
        "interpretation": (
            "The Tier 0 manifests preserve PopSign train/validation/test boundaries "
            "with no signer identity overlap between train and validation/test. "
            "The model can memorize train, but validation/test evaluate signer- and "
            "source-split transfer rather than a same-signer sanity split."
        ),
    }


def blocker_classification(
    confusion: dict[str, Any],
    overlaps: dict[str, Any],
    smoke_report: dict[str, Any],
) -> dict[str, Any]:
    validation_top1 = confusion["validation"]["top1_accuracy"]
    test_top1 = confusion["test"]["top1_accuracy"]
    train_top1 = confusion["train"]["top1_accuracy"]
    validation_zero = confusion["validation"]["zero_recall_labels"]
    test_zero = confusion["test"]["zero_recall_labels"]
    crop_identity = smoke_report.get("crop_identity_preservation")
    crop_preserved = isinstance(crop_identity, dict) and crop_identity.get("preserved") is True

    concrete_overlap_counts = []
    for field in ["clip_ids", "source_record_ids", "signer_identity_hashes", "tensor_paths"]:
        for pair, item in overlaps[field].items():
            if isinstance(item, dict):
                concrete_overlap_counts.append(int(item["count"]))

    if any(count > 0 for count in concrete_overlap_counts):
        classification = "split_manifest_construction_blocker"
        next_action = "split_manifest_remediation"
    elif not crop_preserved:
        classification = "input_adapter_or_crop_identity_blocker"
        next_action = "input_adapter_remediation"
    elif train_top1 == 1.0 and validation_top1 <= 0.25 and test_top1 <= 0.30:
        classification = "source_signer_distribution_gap"
        next_action = NEXT_ACTION["id"]
    else:
        classification = "unknown_no_new_source_blocker"
        next_action = "stop_reduced_claim"

    if next_action != NEXT_ACTION["id"]:
        raise AuditError(
            f"expected {NEXT_ACTION['id']} from current M3AE-K evidence, got {next_action}"
        )

    return {
        "id": classification,
        "most_likely_blocker": "source/signer distribution under the current PopSign-only preserved splits",
        "confidence": "medium",
        "next_action_id": next_action,
        "evidence": [
            "M3AE-J train sanity passed with train_top1=1.0 and train_macro_recall=1.0.",
            f"M3AE-J validation remained near chance at top1={validation_top1} with zero recall labels={validation_zero}.",
            f"M3AE-J test remained weak at top1={test_top1} with zero recall labels={test_zero}.",
            "No clip_id, source_record_id, signer_identity_hash, or tensor_path overlap exists between train and validation/test.",
            "All splits share the same coarse approved source_id, but preserve PopSign source_split boundaries.",
            "The crop-identity-preserving M3AE-J path consumed rgb_regions directly and did not use rgb_frames or pretrained features.",
        ],
        "ruled_down": {
            "split_manifest_remediation": (
                "No concrete clip/source-record/signer/tensor overlap was found; the manifest is not leaking train examples."
            ),
            "label_set_remediation": (
                "Label fragility is visible, but zero-recall labels rotate across validation and test rather than isolating one unusable label."
            ),
            "input_adapter_remediation": (
                "The current failed smoke used the crop-identity-preserving M3AE-I adapter and preserved rgb_regions."
            ),
            "stop_reduced_claim": (
                "One bounded source-distribution remediation remains identifiable before a product-claim stop decision."
            ),
        },
    }


def crop_and_input_observations(crop_config: dict[str, Any], smoke_report: dict[str, Any]) -> dict[str, Any]:
    regions = crop_config.get("regions")
    region_ids = [
        str(region.get("region_id"))
        for region in regions
        if isinstance(regions, list) and isinstance(region, dict)
    ] if isinstance(regions, list) else []
    limitations = crop_config.get("controlled_framing_limitations")
    return {
        "crop_config": file_ref(REFERENCE_PATHS["crop_config"]),
        "region_ids": region_ids,
        "head_region_stress_labels": ["dad", "grandpa", "hat"],
        "existing_crop_limitations": limitations if isinstance(limitations, list) else [],
        "m3ae_h_contact_sheet_observation": (
            "The retained M3AE-H triage reported no concrete crop cut-off in sampled contact sheets."
        ),
        "m3ae_j_crop_identity_preservation": smoke_report.get("crop_identity_preservation"),
    }


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    manifests = {
        "train": read_json(args.train_manifest.resolve()),
        "validation": read_json(args.validation_manifest.resolve()),
        "test": read_json(args.test_manifest.resolve()),
    }
    manifest_paths = {
        "train": args.train_manifest.resolve(),
        "validation": args.validation_manifest.resolve(),
        "test": args.test_manifest.resolve(),
    }

    labels = labels_for_manifest(manifests["train"], manifest_paths["train"])
    for split in ["validation", "test"]:
        split_labels = labels_for_manifest(manifests[split], manifest_paths[split])
        if split_labels != labels:
            raise AuditError(f"{split} manifest labels differ from train: {split_labels} != {labels}")

    summaries = {
        split: split_summary(split, manifest_paths[split], manifests[split], labels)
        for split in ["train", "validation", "test"]
    }
    overlaps = overlap_checks(summaries, labels)
    smoke_report = read_json(REFERENCE_PATHS["m3ae_j_smoke"])
    crop_config = read_json(REFERENCE_PATHS["crop_config"])
    confusion = confusion_summary(smoke_report)
    source_artifacts = {name: file_ref(path) for name, path in REFERENCE_PATHS.items()}
    source_artifacts.update({
        "train_manifest": file_ref(manifest_paths["train"]),
        "validation_manifest": file_ref(manifest_paths["validation"]),
        "test_manifest": file_ref(manifest_paths["test"]),
    })

    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "mission": "M3AE-K",
        "status": "passed",
        "command": " ".join(shlex.quote(value) for value in [sys.executable, *sys.argv]),
        "output": project_relative(args.output),
        "selected_labels": labels,
        "source_artifacts": source_artifacts,
        "m3ae_j_failure_evidence": {
            "source_report": source_artifacts["m3ae_j_smoke"],
            "command": smoke_report.get("command"),
            "model": smoke_report.get("model"),
            "baseline_comparison": smoke_report.get("baseline_comparison"),
            "gate_classifications": smoke_report.get("gate_classifications"),
            "m3ae_j_selected_remediation_input": "label_or_split_remediation",
        },
        "split_counts": {
            split: public_split_summary(summaries[split], labels)
            for split in ["train", "validation", "test"]
        },
        "m3ae_j_per_label_confusion_summary": confusion,
        "split_overlap_checks": overlaps,
        "source_signer_distribution": source_signer_distribution(summaries, labels),
        "crop_and_input_observations": crop_and_input_observations(crop_config, smoke_report),
        "blocker_classification": blocker_classification(confusion, overlaps, smoke_report),
        "hard_negative_and_calibration_blockers": {
            "assessed_in_this_slice": False,
            "status": "separate_not_addressed",
            "source": smoke_report.get("hard_negative_and_calibration_blockers"),
            "final_promotion_negative_challenge_blocker": (
                "unchanged and separate; this diagnostic does not select thresholds, "
                "evaluate hard negatives, export ONNX, promote a model card, or alter final gates"
            ),
        },
        "boundaries": {
            "training_jobs_run": 0,
            "microprobe_runs_run": 0,
            "smoke_jobs_run": 0,
            "label_expansion": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "controlled_clip_heldout_evaluation": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "push": False,
        },
        "next_action": NEXT_ACTION,
    }
    return report


def main() -> int:
    args = parse_args()
    try:
        report = build_report(args)
        write_json(args.output.resolve(), report)
    except AuditError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": report["output"],
                "next_action": report["next_action"]["id"],
                "blocker_classification": report["blocker_classification"]["id"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
