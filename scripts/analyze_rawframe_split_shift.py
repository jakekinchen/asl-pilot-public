#!/usr/bin/env python3
"""Diagnose low-level raw-frame split shift without training a model.

This retained diagnostic reads approved manifest tensors, verifies their hashes,
runs the same frame preparation function used by training/evaluation, and
summarizes low-level RGB statistics by split and label. It does not train,
evaluate, calibrate, export, or mutate model artifacts.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    expected_tensor_hash_for_clip,
    import_torch,
    load_tensor_file,
    prepare_frames,
    tensor_path_for_clip,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-rawframe-split-shift-diagnostic/v1"
DEFAULT_OUTPUT = Path("docs/validation/rawframe-split-shift-diagnostic.json")
DEFAULT_FAILURE_ANALYSIS = Path("docs/validation/rawframe-model-failure-analysis.json")
DEFAULT_MANIFESTS = {
    "train": Path("data/manifests/train.json"),
    "validation": Path("data/manifests/validation.json"),
    "test": Path("data/manifests/test.json"),
}


class DiagnosticError(RuntimeError):
    """Raised when the split-shift diagnostic cannot complete."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Sample raw-frame tensors from train/validation/test manifests and "
            "retain low-level RGB split-shift diagnostics."
        )
    )
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--failure-analysis", type=Path, default=DEFAULT_FAILURE_ANALYSIS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--samples-per-label-split", type=int, default=6)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--write", action="store_true")
    return parser.parse_args()


def resolve_project_path(path: Path, context: str) -> Path:
    resolved = (PROJECT_ROOT / path).resolve() if not path.is_absolute() else path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DiagnosticError(f"{context} escapes project root: {path}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise DiagnosticError(f"Missing JSON file: {project_relative(path)}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DiagnosticError(f"Invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise DiagnosticError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def validate_positive_int(value: int, name: str) -> None:
    if value <= 0:
        raise DiagnosticError(f"{name} must be greater than zero")


def clip_index_by_label(manifest: dict[str, Any], manifest_path: Path) -> dict[str, list[dict[str, Any]]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise DiagnosticError(f"{project_relative(manifest_path)} clips must be an array")
    by_label: dict[str, list[dict[str, Any]]] = {}
    for clip in clips:
        if not isinstance(clip, dict):
            continue
        label = clip.get("label_id")
        if isinstance(label, str):
            by_label.setdefault(label, []).append(clip)
    for label_clips in by_label.values():
        label_clips.sort(key=lambda item: str(item.get("clip_id", "")))
    return by_label


def evenly_spaced_sample(clips: list[dict[str, Any]], count: int) -> list[dict[str, Any]]:
    if len(clips) <= count:
        return list(clips)
    if count == 1:
        return [clips[0]]
    indexes = [round(index * (len(clips) - 1) / (count - 1)) for index in range(count)]
    deduped = []
    seen = set()
    for index in indexes:
        if index not in seen:
            deduped.append(clips[index])
            seen.add(index)
    cursor = 0
    while len(deduped) < count and cursor < len(clips):
        if cursor not in seen:
            deduped.append(clips[cursor])
            seen.add(cursor)
        cursor += 1
    return deduped


def load_failure_recall(failure_analysis: dict[str, Any], split: str) -> dict[str, float]:
    summary_key = f"{split}_summary"
    summary = failure_analysis.get(summary_key, {})
    recall: dict[str, float] = {}
    for label in summary.get("recall_coverage", {}).get("zero_recall_labels", []):
        if isinstance(label, str):
            recall[label] = 0.0
    for section in ("top_recall_labels", "lowest_nonzero_recall_labels"):
        for item in summary.get(section, []):
            if isinstance(item, dict) and isinstance(item.get("label"), str):
                value = item.get("recall")
                if isinstance(value, (int, float)):
                    recall[item["label"]] = float(value)
    return recall


def feature_names() -> list[str]:
    return [
        "mean_r",
        "mean_g",
        "mean_b",
        "std_r",
        "std_g",
        "std_b",
        "overall_mean",
        "overall_std",
        "luma_mean",
        "luma_std",
        "center_luma_mean",
        "edge_luma_mean",
        "center_edge_luma_delta",
        "temporal_abs_delta_mean",
        "first_last_abs_delta_mean",
        "frame_luma_mean_std",
    ]


def extract_features(torch: Any, prepared: Any) -> list[float]:
    channel_mean = prepared.mean(dim=(0, 2, 3))
    channel_std = prepared.std(dim=(0, 2, 3), unbiased=False)
    luma = (
        prepared[:, 0, :, :] * 0.2126
        + prepared[:, 1, :, :] * 0.7152
        + prepared[:, 2, :, :] * 0.0722
    )
    height = int(luma.shape[-2])
    width = int(luma.shape[-1])
    top = height // 4
    bottom = height - top
    left = width // 4
    right = width - left
    center = luma[:, top:bottom, left:right]
    edge_mask = torch.ones_like(luma, dtype=torch.bool)
    edge_mask[:, top:bottom, left:right] = False
    edge_values = luma[edge_mask]
    temporal_delta = (
        (prepared[1:] - prepared[:-1]).abs().mean()
        if int(prepared.shape[0]) > 1
        else torch.tensor(0.0)
    )
    first_last_delta = (
        (prepared[-1] - prepared[0]).abs().mean()
        if int(prepared.shape[0]) > 1
        else torch.tensor(0.0)
    )
    frame_luma_mean_std = luma.mean(dim=(1, 2)).std(unbiased=False)
    return [
        float(channel_mean[0].item()),
        float(channel_mean[1].item()),
        float(channel_mean[2].item()),
        float(channel_std[0].item()),
        float(channel_std[1].item()),
        float(channel_std[2].item()),
        float(prepared.mean().item()),
        float(prepared.std(unbiased=False).item()),
        float(luma.mean().item()),
        float(luma.std(unbiased=False).item()),
        float(center.mean().item()),
        float(edge_values.mean().item()),
        float((center.mean() - edge_values.mean()).item()),
        float(temporal_delta.item()),
        float(first_last_delta.item()),
        float(frame_luma_mean_std.item()),
    ]


def sampled_record(
    torch: Any,
    manifest_path: Path,
    clip: dict[str, Any],
    split: str,
    frame_count: int,
    image_size: int,
) -> dict[str, Any]:
    context = f"{manifest_path}: clip {clip.get('clip_id', '<unknown>')}"
    tensor_path = tensor_path_for_clip(clip, manifest_path, context)
    expected_hash = expected_tensor_hash_for_clip(clip, context)
    actual_hash = sha256_file(tensor_path)
    if actual_hash != expected_hash:
        raise DiagnosticError(
            f"{context} tensor hash mismatch for {project_relative(tensor_path)}; "
            f"expected {expected_hash}, got {actual_hash}"
        )
    loaded = load_tensor_file(torch, tensor_path)
    prepared = prepare_frames(
        torch,
        loaded,
        frame_count=frame_count,
        image_size=image_size,
        context=context,
    ).detach().cpu()
    return {
        "clip_id": clip.get("clip_id"),
        "label_id": clip.get("label_id"),
        "split": split,
        "signer_id": clip.get("signer_id"),
        "source_video_path": clip.get("source_video_path"),
        "tensor": {
            "path": project_relative(tensor_path),
            "sha256": actual_hash,
        },
        "features": extract_features(torch, prepared),
    }


def mean_vector(vectors: list[list[float]]) -> list[float]:
    if not vectors:
        raise DiagnosticError("Cannot average an empty vector set")
    return [sum(vector[index] for vector in vectors) / len(vectors) for index in range(len(vectors[0]))]


def standardizer(records: list[dict[str, Any]]) -> tuple[list[float], list[float]]:
    values = [record["features"] for record in records]
    means = mean_vector(values)
    stds = []
    for index, mean in enumerate(means):
        variance = sum((vector[index] - mean) ** 2 for vector in values) / len(values)
        stds.append(max(math.sqrt(variance), 1e-8))
    return means, stds


def standardized(vector: list[float], means: list[float], stds: list[float]) -> list[float]:
    return [(value - means[index]) / stds[index] for index, value in enumerate(vector)]


def euclidean(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((left[index] - right[index]) ** 2 for index in range(len(left))))


def centroid_by(records: list[dict[str, Any]], key: str, means: list[float], stds: list[float]) -> dict[str, list[float]]:
    grouped: dict[str, list[list[float]]] = {}
    for record in records:
        value = record.get(key)
        if isinstance(value, str):
            grouped.setdefault(value, []).append(standardized(record["features"], means, stds))
    return {value: mean_vector(vectors) for value, vectors in grouped.items()}


def nearest_centroid(vector: list[float], centroids: dict[str, list[float]]) -> tuple[str, float]:
    nearest_key = ""
    nearest_distance = math.inf
    for key, centroid in centroids.items():
        distance = euclidean(vector, centroid)
        if distance < nearest_distance:
            nearest_key = key
            nearest_distance = distance
    return nearest_key, nearest_distance


def split_separability(records: list[dict[str, Any]], means: list[float], stds: list[float]) -> dict[str, Any]:
    centroids = centroid_by(records, "split", means, stds)
    rows = []
    for split in sorted(centroids):
        split_records = [record for record in records if record["split"] == split]
        predictions: dict[str, int] = {key: 0 for key in sorted(centroids)}
        own = 0
        for record in split_records:
            predicted, _distance = nearest_centroid(standardized(record["features"], means, stds), centroids)
            predictions[predicted] = predictions.get(predicted, 0) + 1
            if predicted == split:
                own += 1
        rows.append(
            {
                "split": split,
                "sample_count": len(split_records),
                "nearest_own_split_rate": own / len(split_records) if split_records else 0.0,
                "nearest_split_counts": predictions,
            }
        )
    return {
        "centroid_feature_names": feature_names(),
        "by_split": rows,
        "mean_nearest_own_split_rate": (
            sum(row["nearest_own_split_rate"] for row in rows) / len(rows)
            if rows else 0.0
        ),
    }


def label_centroid_accuracy(
    records: list[dict[str, Any]],
    means: list[float],
    stds: list[float],
) -> dict[str, Any]:
    train_records = [record for record in records if record["split"] == "train"]
    centroids = centroid_by(train_records, "label_id", means, stds)
    output = {}
    for split in ("train", "validation", "test"):
        split_records = [record for record in records if record["split"] == split]
        correct = 0
        prediction_counts: dict[str, int] = {}
        for record in split_records:
            predicted, _distance = nearest_centroid(standardized(record["features"], means, stds), centroids)
            prediction_counts[predicted] = prediction_counts.get(predicted, 0) + 1
            if predicted == record.get("label_id"):
                correct += 1
        top_predictions = [
            {"label_id": label, "count": count}
            for label, count in sorted(prediction_counts.items(), key=lambda item: (-item[1], item[0]))[:10]
        ]
        output[split] = {
            "sample_count": len(split_records),
            "nearest_train_label_centroid_accuracy": correct / len(split_records) if split_records else 0.0,
            "correct": correct,
            "top_predicted_labels": top_predictions,
        }
    return output


def label_shift(
    records: list[dict[str, Any]],
    means: list[float],
    stds: list[float],
    validation_recall: dict[str, float],
    test_recall: dict[str, float],
) -> dict[str, Any]:
    by_label_split: dict[tuple[str, str], list[list[float]]] = {}
    for record in records:
        label = record.get("label_id")
        split = record.get("split")
        if isinstance(label, str) and isinstance(split, str):
            by_label_split.setdefault((label, split), []).append(standardized(record["features"], means, stds))
    rows = []
    labels = sorted({label for label, split in by_label_split if split == "train"})
    for label in labels:
        train_vectors = by_label_split.get((label, "train"), [])
        if not train_vectors:
            continue
        train_centroid = mean_vector(train_vectors)
        distances = {}
        for split in ("validation", "test"):
            vectors = by_label_split.get((label, split), [])
            if vectors:
                distances[f"{split}_distance_from_train"] = euclidean(train_centroid, mean_vector(vectors))
                distances[f"{split}_sample_count"] = len(vectors)
        if distances:
            rows.append(
                {
                    "label_id": label,
                    **distances,
                    "validation_recall": validation_recall.get(label),
                    "test_recall": test_recall.get(label),
                    "zero_recall_validation": validation_recall.get(label) == 0.0,
                    "zero_recall_test": test_recall.get(label) == 0.0,
                }
            )
    for row in rows:
        values = [
            value
            for key, value in row.items()
            if key.endswith("_distance_from_train") and isinstance(value, (int, float))
        ]
        row["mean_heldout_distance_from_train"] = sum(values) / len(values) if values else None
    rows.sort(key=lambda item: (-(item["mean_heldout_distance_from_train"] or 0.0), item["label_id"]))
    zero_both = [row for row in rows if row["zero_recall_validation"] and row["zero_recall_test"]]
    nonzero_both = [row for row in rows if not row["zero_recall_validation"] and not row["zero_recall_test"]]
    return {
        "top_shifted_labels": rows[:20],
        "zero_recall_both_count": len(zero_both),
        "mean_distance_zero_recall_both": mean_optional(row["mean_heldout_distance_from_train"] for row in zero_both),
        "mean_distance_nonzero_recall_both": mean_optional(row["mean_heldout_distance_from_train"] for row in nonzero_both),
    }


def mean_optional(values: Any) -> float | None:
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    if not numbers:
        return None
    return sum(numbers) / len(numbers)


def build_interpretation(split_report: dict[str, Any], label_report: dict[str, Any], shift_report: dict[str, Any]) -> dict[str, Any]:
    signals = []
    mean_own_split = split_report["mean_nearest_own_split_rate"]
    if mean_own_split >= 0.55:
        signals.append("low_level_rgb_statistics_are_split_separable")
    validation_accuracy = label_report.get("validation", {}).get("nearest_train_label_centroid_accuracy", 0.0)
    test_accuracy = label_report.get("test", {}).get("nearest_train_label_centroid_accuracy", 0.0)
    if validation_accuracy < 0.1 and test_accuracy < 0.1:
        signals.append("low_level_train_label_centroids_do_not_generalize_to_heldout_splits")
    zero_distance = shift_report.get("mean_distance_zero_recall_both")
    nonzero_distance = shift_report.get("mean_distance_nonzero_recall_both")
    if isinstance(zero_distance, float) and isinstance(nonzero_distance, float) and zero_distance > nonzero_distance:
        signals.append("zero_recall_labels_have_higher_low_level_shift_than_nonzero_recall_labels")
    return {
        "status": "diagnostic_only_not_training_evidence",
        "signals": signals,
        "notes": [
            "Uses only low-level RGB tensor statistics after the same frame preparation used by training/evaluation.",
            "Does not approve any source, change manifests, train a classifier, calibrate thresholds, or export browser artifacts.",
        ],
    }


def main() -> int:
    args = parse_args()
    validate_positive_int(args.samples_per_label_split, "--samples-per-label-split")
    validate_positive_int(args.frame_count, "--frame-count")
    validate_positive_int(args.image_size, "--image-size")

    manifests = {
        split: resolve_project_path(path, f"--{split}-manifest")
        for split, path in {
            "train": args.train_manifest,
            "validation": args.validation_manifest,
            "test": args.test_manifest,
        }.items()
    }
    output_path = resolve_project_path(args.output, "--output")
    failure_path = resolve_project_path(args.failure_analysis, "--failure-analysis")
    torch = import_torch()

    failure_analysis = read_json(failure_path)
    validation_recall = load_failure_recall(failure_analysis, "validation")
    test_recall = load_failure_recall(failure_analysis, "test")

    records = []
    manifest_inputs = {}
    for split, manifest_path in manifests.items():
        manifest = read_json(manifest_path)
        manifest_inputs[split] = {
            "path": project_relative(manifest_path),
            "sha256": sha256_file(manifest_path),
            "clip_count": len(manifest.get("clips", [])),
            "label_count": len(manifest.get("labels", [])),
            "dataset_source_mode": manifest.get("dataset_source_mode"),
        }
        by_label = clip_index_by_label(manifest, manifest_path)
        for label in sorted(by_label):
            for clip in evenly_spaced_sample(by_label[label], args.samples_per_label_split):
                records.append(sampled_record(torch, manifest_path, clip, split, args.frame_count, args.image_size))

    means, stds = standardizer(records)
    split_report = split_separability(records, means, stds)
    label_report = label_centroid_accuracy(records, means, stds)
    shift_report = label_shift(records, means, stds, validation_recall, test_recall)
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "split_shift_diagnostic_ready_not_training_data",
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": file_ref(Path(__file__).resolve()),
            "command": sys.argv,
        },
        "inputs": {
            "manifests": manifest_inputs,
            "failure_analysis": file_ref(failure_path),
        },
        "sampling": {
            "samples_per_label_split": args.samples_per_label_split,
            "sample_count": len(records),
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "sampled_label_count": len({record["label_id"] for record in records}),
            "sampled_split_counts": {
                split: len([record for record in records if record["split"] == split])
                for split in ("train", "validation", "test")
            },
        },
        "feature_contract": {
            "feature_names": feature_names(),
            "feature_count": len(feature_names()),
            "standardization": "zscore_across_sampled_train_validation_test_records",
            "source": "prepared_raw_rgb_tensors_only",
        },
        "split_separability": split_report,
        "nearest_train_label_centroid": label_report,
        "label_shift_from_train": shift_report,
        "interpretation": build_interpretation(split_report, label_report, shift_report),
        "blockers": [],
    }
    if args.write:
        write_json(output_path, report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "wrote": args.write,
                "output": project_relative(output_path),
                "sample_count": len(records),
                "mean_nearest_own_split_rate": split_report["mean_nearest_own_split_rate"],
                "validation_nearest_train_label_centroid_accuracy": label_report["validation"]["nearest_train_label_centroid_accuracy"],
                "test_nearest_train_label_centroid_accuracy": label_report["test"]["nearest_train_label_centroid_accuracy"],
                "signals": report["interpretation"]["signals"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except DiagnosticError as error:
        print(f"Raw-frame split-shift diagnostic failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
