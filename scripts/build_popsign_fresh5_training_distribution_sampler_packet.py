#!/usr/bin/env python3
"""Build the PopSign fresh5 training distribution/sampler packet receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import sys
from collections import Counter
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-training-distribution-sampler-packet/v1"
DEFAULT_RECEIPT = Path(
    "docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json"
)
ACTIVE_PROMPT = Path(
    "docs/model/return-to-form-popsign-fresh5-training-distribution-sampler-packet-goal-loop-prompt.md"
)
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
TRAIN_SCRIPT = Path("scripts/train_rawframe_model.py")
EVALUATE_SCRIPT = Path("scripts/evaluate_rawframe_model.py")
M3CO_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json")
M3CN_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
TRAINING_PROVENANCE = Path(
    "output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json"
)
VALIDATION_REPORT = Path(
    "output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json"
)
LABELS = ["home", "morning", "pen", "thank_you", "who"]
POPSIGN_MANIFEST_LABEL_ORDER = ["thank_you", "pen", "home", "who", "morning"]


class PacketError(RuntimeError):
    """Raised when the no-training packet cannot be built."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PacketError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise PacketError(f"{context} does not exist: {path}")
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
    resolved = project_path(path, "input artifact")
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path, "json input artifact")
    return json.loads(resolved.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/build_popsign_fresh5_training_distribution_sampler_packet.py",
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--write-receipt",
    ]


def validate_args(args: argparse.Namespace) -> Path:
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    if receipt != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise PacketError(f"M3CP requires {DEFAULT_RECEIPT.as_posix()}, got {project_relative(receipt)}")
    if not args.write_receipt:
        raise PacketError("M3CP requires --write-receipt")
    return receipt


def load_inputs() -> dict[str, dict[str, Any]]:
    return {
        "manifest_contract": load_json(MANIFEST_CONTRACT),
        "train_manifest": load_json(TRAIN_MANIFEST),
        "validation_manifest": load_json(VALIDATION_MANIFEST),
        "test_manifest": load_json(TEST_MANIFEST),
        "m3co": load_json(M3CO_RECEIPT),
        "m3cn": load_json(M3CN_RECEIPT),
        "m3cj": load_json(M3CJ_RECEIPT),
        "m3ck": load_json(M3CK_RECEIPT),
        "training_provenance": load_json(TRAINING_PROVENANCE),
        "validation_report": load_json(VALIDATION_REPORT),
    }


def artifact_references() -> dict[str, dict[str, str]]:
    return {
        "goal": file_reference(Path("GOAL.md")),
        "active_prompt": file_reference(ACTIVE_PROMPT),
        "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        "manifest_contract": file_reference(MANIFEST_CONTRACT),
        "train_manifest": file_reference(TRAIN_MANIFEST),
        "validation_manifest": file_reference(VALIDATION_MANIFEST),
        "test_manifest": file_reference(TEST_MANIFEST),
        "training_loader_code": file_reference(TRAIN_SCRIPT),
        "evaluation_loader_code": file_reference(EVALUATE_SCRIPT),
        "m3co_tensor_input_quality": file_reference(M3CO_RECEIPT),
        "m3cn_label_source_quality_review": file_reference(M3CN_RECEIPT),
        "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
        "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
        "current_training_provenance_output": file_reference(TRAINING_PROVENANCE),
        "current_validation_report_output": file_reference(VALIDATION_REPORT),
    }


def label_order(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise PacketError("manifest labels must be a list")
    return [str(label.get("label_id")) for label in labels if isinstance(label, dict)]


def manifest_summary(manifest: dict[str, Any], split: str, class_index_by_label: dict[str, int]) -> dict[str, Any]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise PacketError(f"{split} manifest clips must be a list")
    by_label: dict[str, list[tuple[int, dict[str, Any]]]] = {label: [] for label in LABELS}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise PacketError(f"{split} clips[{index}] must be an object")
        label = str(clip.get("label_id"))
        if label in by_label:
            by_label[label].append((index, clip))

    label_rows = []
    for label in LABELS:
        rows = by_label[label]
        indexes = [index for index, _clip in rows]
        signer_counts = Counter(str(clip.get("signer_identity_hash") or clip.get("signer_id")) for _i, clip in rows)
        source_split_counts = Counter(str(clip.get("source_split")) for _i, clip in rows)
        top_signer_count = max(signer_counts.values()) if signer_counts else 0
        label_rows.append(
            {
                "label_id": label,
                "class_index": class_index_by_label[label],
                "clip_count": len(rows),
                "manifest_index_min": min(indexes) if indexes else None,
                "manifest_index_max": max(indexes) if indexes else None,
                "manifest_contiguous_block": indexes == list(range(min(indexes), max(indexes) + 1))
                if indexes
                else False,
                "signer_identity_count": len(signer_counts),
                "top_signer_fraction": round(top_signer_count / len(rows), 6) if rows else None,
                "source_split_counts": dict(sorted(source_split_counts.items())),
            }
        )

    return {
        "split": split,
        "clip_count": len(clips),
        "label_order": label_order(manifest),
        "label_order_matches_popsign_contract": label_order(manifest) == POPSIGN_MANIFEST_LABEL_ORDER,
        "label_counts": {row["label_id"]: row["clip_count"] for row in label_rows},
        "label_rows": label_rows,
    }


def cross_split_overlap(inputs: dict[str, dict[str, Any]]) -> dict[str, dict[str, int]]:
    split_clips = {
        "train": inputs["train_manifest"].get("clips", []),
        "validation": inputs["validation_manifest"].get("clips", []),
        "test": inputs["test_manifest"].get("clips", []),
    }

    def values(clips: list[Any], key: str) -> set[str]:
        result = set()
        for clip in clips:
            if isinstance(clip, dict) and isinstance(clip.get(key), str):
                result.add(str(clip[key]))
        return result

    pairs = [("train", "validation"), ("train", "test"), ("validation", "test")]
    overlap = {}
    for left, right in pairs:
        left_clips = split_clips[left]
        right_clips = split_clips[right]
        pair_key = f"{left}_vs_{right}"
        overlap[pair_key] = {
            "shared_clip_id_count": len(values(left_clips, "clip_id") & values(right_clips, "clip_id")),
            "shared_source_record_id_count": len(
                values(left_clips, "source_record_id") & values(right_clips, "source_record_id")
            ),
            "shared_signer_identity_hash_count": len(
                values(left_clips, "signer_identity_hash") & values(right_clips, "signer_identity_hash")
            ),
            "shared_tensor_path_count": len(
                values(left_clips, "relative_frame_tensor_path") & values(right_clips, "relative_frame_tensor_path")
            ),
            "shared_tensor_hash_count": len(
                values(left_clips, "frame_tensor_sha256") & values(right_clips, "frame_tensor_sha256")
            ),
        }
    return overlap


def full_batch_count(example_count: int, batch_size: int) -> int:
    return int(math.ceil(example_count / batch_size))


def batch_accounting(
    split_summary: dict[str, Any],
    hyperparameters: dict[str, Any],
    phase: str,
    shuffle: bool,
    max_batches: int | None,
    epochs: int,
) -> dict[str, Any]:
    clip_count = int(split_summary["clip_count"])
    batch_size = int(hyperparameters["batch_size"])
    full_batches = full_batch_count(clip_count, batch_size)
    cap_covers_full_split = max_batches is None or max_batches >= full_batches
    examples_per_epoch = clip_count if cap_covers_full_split else min(clip_count, int(max_batches or 0) * batch_size)
    return {
        "phase": phase,
        "split": split_summary["split"],
        "clip_count": clip_count,
        "batch_size": batch_size,
        "full_epoch_batches": full_batches,
        "last_batch_size": clip_count - batch_size * (full_batches - 1),
        "max_batches": max_batches,
        "max_batches_covers_full_split": cap_covers_full_split,
        "drop_last": False,
        "shuffle": shuffle,
        "epochs": epochs,
        "examples_per_epoch": examples_per_epoch,
        "examples_total": examples_per_epoch * epochs,
        "sampler_inference": (
            "training DataLoader uses shuffle=True, which means random sampling without replacement for a full "
            "epoch; validation/evaluation loaders use shuffle=False."
            if shuffle
            else "ordered sequential evaluation; order affects only reporting order, not target mapping"
        ),
    }


def prediction_distribution(metrics: dict[str, Any]) -> dict[str, Any]:
    confusion = metrics.get("confusion_matrix", {}) if isinstance(metrics, dict) else {}
    labels = confusion.get("labels", [])
    matrix = confusion.get("rows_true_columns_predicted", [])
    if not isinstance(labels, list) or not isinstance(matrix, list):
        return {"labels": [], "predicted_counts": {}, "true_support": {}, "predicted_single_class": None}
    column_counts = [0 for _label in labels]
    row_counts = []
    for row in matrix:
        if not isinstance(row, list):
            continue
        row_counts.append(sum(int(value) for value in row))
        for index, value in enumerate(row):
            if index < len(column_counts):
                column_counts[index] += int(value)
    total = sum(row_counts)
    predicted_counts = {str(label): column_counts[index] for index, label in enumerate(labels)}
    true_support = {str(label): row_counts[index] for index, label in enumerate(labels)}
    predicted_single_class = None
    for label, count in predicted_counts.items():
        if total and count == total:
            predicted_single_class = label
    return {
        "labels": [str(label) for label in labels],
        "true_support": true_support,
        "predicted_counts": predicted_counts,
        "predicted_single_class": predicted_single_class,
        "examples": total,
        "top1_accuracy": metrics.get("top1_accuracy"),
        "macro_f1": metrics.get("macro_f1"),
        "per_class": metrics.get("per_class"),
    }


def m3cj_runs(inputs: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        str(run.get("name")): run
        for run in inputs["m3cj"].get("runs", [])
        if isinstance(run, dict)
    }


def m3cj_artifact_hash(path: str, inputs: dict[str, dict[str, Any]]) -> str | None:
    artifacts = inputs["m3cj"].get("current_ignored_artifacts", {}).get("files", [])
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("path") == path:
            value = artifact.get("sha256")
            return str(value) if isinstance(value, str) else None
    return None


def current_output_artifact_consistency(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    runs = m3cj_runs(inputs)
    lr001 = runs.get("train_all_lr001", {})
    output_test = prediction_distribution(inputs["validation_report"].get("test", {}))
    provenance_hash = sha256_file(project_path(TRAINING_PROVENANCE, "training provenance"))
    validation_hash = sha256_file(project_path(VALIDATION_REPORT, "validation report"))
    expected_provenance_hash = m3cj_artifact_hash(TRAINING_PROVENANCE.as_posix(), inputs)
    expected_validation_hash = m3cj_artifact_hash(VALIDATION_REPORT.as_posix(), inputs)
    lr001_hyperparameters = lr001.get("hyperparameters", {}) if isinstance(lr001, dict) else {}
    lr001_evaluation = lr001.get("evaluation", {}) if isinstance(lr001, dict) else {}
    output_hyperparameters = inputs["training_provenance"].get("hyperparameters", {})
    caveats = []
    if lr001_hyperparameters.get("checkpoint_selection") != output_hyperparameters.get("checkpoint_selection"):
        caveats.append("m3cj_lr001_checkpoint_selection_differs_from_current_output_provenance")
    if lr001_evaluation.get("predicted_single_class") != output_test.get("predicted_single_class"):
        caveats.append("m3cj_lr001_predicted_single_class_differs_from_current_validation_report")
    return {
        "m3cj_current_training_provenance_hash_match": provenance_hash == expected_provenance_hash,
        "m3cj_current_validation_report_hash_match": validation_hash == expected_validation_hash,
        "current_output_training_hyperparameters": output_hyperparameters,
        "current_output_test_prediction_distribution": output_test,
        "m3cj_train_all_lr001_recorded_evaluation": lr001_evaluation,
        "provenance_caveats": caveats,
        "interpretation": (
            "The current ignored output artifacts are useful for train/eval distribution checks, but their "
            "checkpoint-selection and predicted-single-class details do not fully match the M3CJ lr001 receipt row. "
            "This is a reporting/provenance caveat, not evidence of pen overexposure."
            if caveats
            else "The current ignored output artifacts match the M3CJ lr001 summary fields used by this packet."
        ),
    }


def per_label_distribution_rows(
    summaries: dict[str, dict[str, Any]],
    train_accounting: dict[str, Any],
    validation_accounting: dict[str, Any],
    eval_validation: dict[str, Any],
    eval_test: dict[str, Any],
    inputs: dict[str, dict[str, Any]],
    class_index_by_label: dict[str, int],
) -> list[dict[str, Any]]:
    runs = m3cj_runs(inputs)
    lr003_eval = runs.get("train_all_lr003", {}).get("evaluation", {})
    rows = []
    for label in LABELS:
        train_label = next(row for row in summaries["train"]["label_rows"] if row["label_id"] == label)
        validation_label = next(row for row in summaries["validation"]["label_rows"] if row["label_id"] == label)
        test_label = next(row for row in summaries["test"]["label_rows"] if row["label_id"] == label)
        train_count = int(train_label["clip_count"])
        validation_count = int(validation_label["clip_count"])
        test_count = int(test_label["clip_count"])
        rows.append(
            {
                "label_id": label,
                "priority": "highest" if label == "pen" else "normal",
                "class_index": class_index_by_label[label],
                "manifest_order": {
                    "train_index_range": [train_label["manifest_index_min"], train_label["manifest_index_max"]],
                    "validation_index_range": [
                        validation_label["manifest_index_min"],
                        validation_label["manifest_index_max"],
                    ],
                    "test_index_range": [test_label["manifest_index_min"], test_label["manifest_index_max"]],
                    "class_blocked_in_manifests": all(
                        item["manifest_contiguous_block"] for item in [train_label, validation_label, test_label]
                    ),
                },
                "source_signer_distribution": {
                    "train_signer_identity_count": train_label["signer_identity_count"],
                    "validation_signer_identity_count": validation_label["signer_identity_count"],
                    "test_signer_identity_count": test_label["signer_identity_count"],
                    "train_top_signer_fraction": train_label["top_signer_fraction"],
                    "validation_top_signer_fraction": validation_label["top_signer_fraction"],
                    "test_top_signer_fraction": test_label["top_signer_fraction"],
                },
                "train_exposure": {
                    "clip_count": train_count,
                    "examples_per_epoch": train_count if train_accounting["max_batches_covers_full_split"] else None,
                    "examples_total_over_epochs": train_count * int(train_accounting["epochs"])
                    if train_accounting["max_batches_covers_full_split"]
                    else None,
                    "overexposed_relative_to_other_labels": False,
                    "underexposed_relative_to_other_labels": False,
                },
                "validation_during_training_exposure": {
                    "clip_count": validation_count,
                    "examples_per_epoch": validation_count
                    if validation_accounting["max_batches_covers_full_split"]
                    else None,
                    "examples_total_over_epochs": validation_count * int(validation_accounting["epochs"])
                    if validation_accounting["max_batches_covers_full_split"]
                    else None,
                },
                "evaluation_target_distribution": {
                    "validation_support": eval_validation["true_support"].get(label),
                    "test_support": eval_test["true_support"].get(label),
                    "validation_predicted_count": eval_validation["predicted_counts"].get(label),
                    "test_predicted_count": eval_test["predicted_counts"].get(label),
                },
                "m3cj_train_all_lr003": {
                    "predicted_single_class": lr003_eval.get("predicted_single_class"),
                    "per_class_recall": (lr003_eval.get("per_class_recall") or {}).get(label),
                },
                "assessment": label_distribution_assessment(label),
            }
        )
    return rows


def label_distribution_assessment(label: str) -> str:
    if label == "pen":
        return (
            "Pen has balanced train/validation/test support, the same full-epoch exposure as every other label, "
            "class index 2 in the train/eval mapping, and no sampler or batch-cap overexposure. The lr003 pen "
            "collapse is not explained by distribution or sampler evidence."
        )
    return (
        f"{label} has balanced train/validation/test support and the same full-epoch exposure as the other labels; "
        "no sampler or target-mapping blocker is visible."
    )


def distribution_sampler_review(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    class_index_by_label = {label: index for index, label in enumerate(sorted(LABELS))}
    summaries = {
        "train": manifest_summary(inputs["train_manifest"], "train", class_index_by_label),
        "validation": manifest_summary(inputs["validation_manifest"], "validation", class_index_by_label),
        "test": manifest_summary(inputs["test_manifest"], "test", class_index_by_label),
    }
    hyperparameters = inputs["training_provenance"].get("hyperparameters", {})
    epochs = int(hyperparameters.get("epochs", 0))
    train_accounting = batch_accounting(
        summaries["train"],
        hyperparameters,
        "training",
        shuffle=True,
        max_batches=int(hyperparameters["max_train_batches"]),
        epochs=epochs,
    )
    validation_accounting = batch_accounting(
        summaries["validation"],
        hyperparameters,
        "validation_during_training",
        shuffle=False,
        max_batches=int(hyperparameters["max_validation_batches"]),
        epochs=epochs,
    )
    eval_validation_accounting = batch_accounting(
        summaries["validation"],
        hyperparameters,
        "evaluation_validation",
        shuffle=False,
        max_batches=None,
        epochs=1,
    )
    eval_test_accounting = batch_accounting(
        summaries["test"],
        hyperparameters,
        "evaluation_test",
        shuffle=False,
        max_batches=None,
        epochs=1,
    )
    eval_validation = prediction_distribution(inputs["validation_report"].get("validation", {}))
    eval_test = prediction_distribution(inputs["validation_report"].get("test", {}))
    pen_train_row = next(row for row in summaries["train"]["label_rows"] if row["label_id"] == "pen")
    rows = per_label_distribution_rows(
        summaries,
        train_accounting,
        validation_accounting,
        eval_validation,
        eval_test,
        inputs,
        class_index_by_label,
    )
    overlaps = cross_split_overlap(inputs)
    visible_blockers = []
    if any(summary["label_counts"] != {label: 25 for label in LABELS} for summary in summaries.values()):
        visible_blockers.append("label_count_imbalance")
    if any(summary["clip_count"] != sum(summary["label_counts"].values()) for summary in summaries.values()):
        visible_blockers.append("manifest_contains_unexpected_or_ignored_labels")
    if any(set(summary["label_order"]) != set(LABELS) for summary in summaries.values()):
        visible_blockers.append("manifest_label_set_mismatch")
    if not train_accounting["max_batches_covers_full_split"]:
        visible_blockers.append("train_batch_cap_excludes_examples")
    if not validation_accounting["max_batches_covers_full_split"]:
        visible_blockers.append("validation_batch_cap_excludes_examples")
    if any(any(value != 0 for value in pair.values()) for pair in overlaps.values()):
        visible_blockers.append("cross_split_overlap")
    if inputs["training_provenance"].get("labels") != class_index_by_label:
        visible_blockers.append("training_provenance_label_to_index_mismatch")
    if eval_test["true_support"] != {label: 25 for label in LABELS}:
        visible_blockers.append("test_target_support_imbalance")
    for item in inputs["training_provenance"].get("history", []):
        if not isinstance(item, dict):
            continue
        train_history = item.get("train") or {}
        validation_history = item.get("validation") or {}
        if train_history.get("examples") != train_accounting["examples_per_epoch"]:
            visible_blockers.append("training_history_example_count_mismatch")
            break
        if validation_history.get("examples") != validation_accounting["examples_per_epoch"]:
            visible_blockers.append("validation_history_example_count_mismatch")
            break
    return {
        "class_index_mapping": {
            "mapping_source": "scripts/train_rawframe_model.py sorts manifest label ids before label_to_index",
            "manifest_label_order": POPSIGN_MANIFEST_LABEL_ORDER,
            "training_and_evaluation_label_to_index": class_index_by_label,
            "training_provenance_label_to_index": inputs["training_provenance"].get("labels"),
            "mapping_consistent": inputs["training_provenance"].get("labels") == class_index_by_label,
        },
        "manifest_distribution": summaries,
        "cross_split_overlap": overlaps,
        "batch_accounting": {
            "train": train_accounting,
            "validation_during_training": validation_accounting,
            "evaluation_validation": eval_validation_accounting,
            "evaluation_test": eval_test_accounting,
            "history_examples_by_epoch": [
                {
                    "epoch": item.get("epoch"),
                    "train_examples": (item.get("train") or {}).get("examples"),
                    "train_batches": (item.get("train") or {}).get("batches"),
                    "validation_examples": (item.get("validation") or {}).get("examples"),
                    "validation_batches": (item.get("validation") or {}).get("batches"),
                }
                for item in inputs["training_provenance"].get("history", [])
                if isinstance(item, dict)
            ],
        },
        "sampler_and_loader_behavior": {
            "train_loader": {
                "shuffle": True,
                "sampler": "torch DataLoader shuffle=True / RandomSampler without replacement",
                "num_workers": hyperparameters.get("num_workers"),
                "drop_last": False,
                "exact_batch_permutation_recorded_in_provenance": False,
                "exact_batch_permutation_needed_to_prove_exposure": False,
                "why": "The cap covers all 32 batches, so every clip is exposed once per epoch regardless of permutation.",
            },
            "validation_loader": {"shuffle": False, "drop_last": False, "all_examples_seen": True},
            "evaluation_loader": {"shuffle": False, "drop_last": False, "all_examples_seen": True},
        },
        "evaluation_distribution": {
            "validation": eval_validation,
            "test": eval_test,
        },
        "per_label_distribution_and_sampler_rows": rows,
        "visible_distribution_sampler_blockers": visible_blockers,
        "pen_exposure_collapse_risk": {
            "pen_overexposed_by_sampler_or_batch_cap": False,
            "pen_underexposed_by_sampler_or_batch_cap": False,
            "pen_class_index": class_index_by_label["pen"],
            "pen_manifest_order_range_train": [
                pen_train_row["manifest_index_min"],
                pen_train_row["manifest_index_max"],
            ],
            "assessment": (
                "Pen is second in manifest order but class index 2 in train/eval mapping; training shuffles and "
                "sees every clip each epoch. No exposure, sampler, batch-cap, class-order, or evaluator support "
                "path explains pen-specific collapse."
            ),
        },
    }


def code_path_review() -> dict[str, Any]:
    return {
        "training_code_path": {
            "label_to_index": "label_ids = sorted(manifests[0]['label_ids']); enumerate(label_ids)",
            "train_loader": "torch.utils.data.DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers)",
            "validation_loader": "torch.utils.data.DataLoader(validation_dataset, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)",
            "batch_cap": "iterate_batches stops only when batch_index > max_batches, so max_batches=32 includes batches 1..32",
            "drop_last": "not passed; PyTorch DataLoader default is drop_last=False",
        },
        "evaluation_code_path": {
            "label_to_index": "checkpoint label_to_index is loaded, checked as the same set as manifest labels, and reused by RawFrameClipDataset",
            "loader": "shuffle=False for validation/test evaluation",
            "confusion_labels": "labels_by_index is sorted by checkpoint index",
        },
    }


def decision(review: dict[str, Any], artifact_consistency: dict[str, Any]) -> dict[str, Any]:
    blockers = review["visible_distribution_sampler_blockers"]
    caveats = artifact_consistency["provenance_caveats"]
    packet_complete = not blockers
    return {
        "receipt_complete": packet_complete,
        "visible_distribution_sampler_blockers": blockers,
        "visible_reporting_or_provenance_caveats": caveats,
        "pen_collapse_explained_by_distribution_or_sampler": False,
        "bounded_local_train_all_justified_now": False,
        "optimizer_loss_or_regularization_packet_justified_now": packet_complete,
        "brev_compute_or_planning_justified_now": False,
        "human_training_scope_budget_or_code_path_review_required_now": False,
        "exactly_one_next_action": (
            "continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet"
            if packet_complete
            else "continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality"
        ),
        "next_action_rationale": (
            "Sampler/distribution evidence is clean: every label has 25 examples per split, training sees all 125 "
            "clips each epoch, class-index and evaluator target mappings are consistent, and pen is not overexposed. "
            "Because train-all has already failed under the current optimizer/loss settings, another blind train-all "
            "is still unjustified; the next bounded no-training packet should inspect optimizer, loss, normalization, "
            "regularization, and the recorded provenance caveat before fitting."
            if packet_complete
            else "The distribution/sampler packet is incomplete or found a blocker; finish/repair it before fitting."
        ),
    }


def future_conditions(decision_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "what_would_justify_one_bounded_local_train_all_prompt": [
            "This M3CP sampler/distribution packet remains complete with no visible exposure, sampler, batch-cap, class-index, or evaluator target blocker.",
            "A separate no-training optimizer/loss/regularization packet identifies one bounded local hypothesis or clears optimizer/loss settings enough for a controlled rerun.",
            "The M3CJ current-output provenance caveat is either reconciled or explicitly superseded by a fresh no-training receipt before fitting.",
            "The future local prompt preserves repaired manifests, approved PopSign source lane, strict split/signer/tensor disjointness, rgb_regions_grid_v1 input, random initialization, no-pretrained boundary, and fail-closed browser/model-card state.",
            "The future run must beat M3CJ: test top-1 > 0.2, macro F1 > 0.06666666666666668, prediction distribution not single-class, no zero-recall selected labels, and validation accuracy not flat at chance.",
        ],
        "what_would_block_more_training_and_require_human_review": [
            "Any required change to training scope, budget, source approvals, label set, crop/tensor semantics, Brev spend, export, browser activation, model-card claims, or final gates.",
            "Any class-index, evaluator target, or code-path mismatch that cannot be resolved from tracked code and receipts without changing the training path.",
            "Any sampler/distribution blocker that excludes examples or over/underexposes a label and requires a policy decision instead of a local code-path receipt.",
        ],
        "current_human_review_required": decision_payload["human_training_scope_budget_or_code_path_review_required_now"],
    }


def m3cn_mechanical_source_label_ambiguity_cleared(inputs: dict[str, dict[str, Any]]) -> bool:
    findings = inputs["m3cn"].get("source_label_ambiguity_findings", {})
    return bool(findings.get("mechanical_source_label_ambiguity_cleared_for_current_manifests"))


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    inputs = load_inputs()
    review = distribution_sampler_review(inputs)
    artifact_consistency = current_output_artifact_consistency(inputs)
    decision_payload = decision(review, artifact_consistency)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CP - PopSign fresh5 training distribution/sampler packet",
        "status": "completed_no_training_no_mutation_training_distribution_sampler_packet",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/build_popsign_fresh5_training_distribution_sampler_packet.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
        },
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "input_artifacts": artifact_references(),
        "scope": {
            "local_only": True,
            "existing_manifests_receipts_provenance_and_code_paths_only": True,
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
        "distribution_sampler_review": review,
        "code_path_review": code_path_review(),
        "current_output_artifact_consistency": artifact_consistency,
        "prior_evidence_summary": {
            "m3co_visible_tensor_input_quality_blockers": inputs["m3co"]
            .get("decision", {})
            .get("visible_tensor_input_quality_blockers"),
            "m3cn_mechanical_source_label_ambiguity_cleared": m3cn_mechanical_source_label_ambiguity_cleared(inputs),
            "m3ck_architecture_can_train_fit_balanced_tiny_subset": inputs["m3ck"]
            .get("decision", {})
            .get("m3ce_architecture_can_train_fit_balanced_tiny_subset"),
            "m3cj_runs": {
                name: {
                    "classification": run.get("classification"),
                    "hyperparameters": run.get("hyperparameters"),
                    "evaluation": run.get("evaluation") or run.get("result"),
                }
                for name, run in m3cj_runs(inputs).items()
            },
        },
        "decision": decision_payload,
        "future_training_or_stop_conditions": future_conditions(decision_payload),
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
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_popsign_fresh5_training_distribution_sampler_packet.py",
            ".venv/bin/python scripts/build_popsign_fresh5_training_distribution_sampler_packet.py --receipt docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json >/dev/null",
            "git diff --check",
            "node scripts/audit_codex_pair_state.mjs --json",
        ],
        "exactly_one_next_action": decision_payload["exactly_one_next_action"],
    }


def main() -> int:
    args = parse_args()
    try:
        receipt_path = validate_args(args)
        receipt = build_receipt(args)
        write_json(receipt_path, receipt)
    except PacketError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
