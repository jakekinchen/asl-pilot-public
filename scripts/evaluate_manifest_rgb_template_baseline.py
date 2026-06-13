#!/usr/bin/env python3
"""Evaluate a closed-set same-split raw RGB template baseline."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    expected_tensor_hash_for_clip,
    load_manifest,
    load_tensor_file,
    prepare_frames,
    sha256_file,
    tensor_path_for_clip,
)


ROOT = Path(__file__).resolve().parents[1]


class TemplateBaselineError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", required=True, type=Path)
    parser.add_argument("--validation-manifest", required=True, type=Path)
    parser.add_argument("--test-manifest", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--feature-size", type=int, default=32)
    parser.add_argument("--neighbors", type=int, default=1)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def import_torch() -> Any:
    try:
        import torch  # type: ignore
    except Exception as error:  # noqa: BLE001
        raise TemplateBaselineError(f"PyTorch is required for template diagnostics: {error}") from error
    return torch


def label_ids(manifest: dict[str, Any]) -> list[str]:
    return [str(label["label_id"]) for label in manifest["labels"]]


def validate_label_sets(train: dict[str, Any], validation: dict[str, Any], test: dict[str, Any]) -> list[str]:
    labels = label_ids(train)
    if not labels:
        raise TemplateBaselineError("train manifest has no labels")
    for split_name, manifest in (("validation", validation), ("test", test)):
        if label_ids(manifest) != labels:
            raise TemplateBaselineError(f"{split_name} label order does not match train label order")
    return labels


def clip_records(manifest_path: Path, manifest: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for index, clip in enumerate(manifest["clips"]):
        context = f"{manifest_path}: clips[{index}]"
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise TemplateBaselineError(
                f"{context} tensor hash mismatch for {tensor_path}; expected {expected_hash}, got {actual_hash}"
            )
        records.append({
            "clip_id": clip.get("clip_id"),
            "label_id": str(clip.get("label_id")),
            "tensor_path": tensor_path,
        })
    if not records:
        raise TemplateBaselineError(f"{manifest_path} has no clips")
    return records


def extract_feature(torch: Any, tensor_path: Path, frame_count: int, image_size: int, feature_size: int) -> Any:
    frames = load_tensor_file(torch, tensor_path)
    frames = prepare_frames(
        torch,
        frames,
        frame_count=frame_count,
        image_size=image_size,
        context=str(tensor_path),
    )
    gray = frames.mean(dim=1, keepdim=True)
    gray = torch.nn.functional.interpolate(
        gray,
        size=(feature_size, feature_size),
        mode="bilinear",
        align_corners=False,
    ).squeeze(1)
    gray = gray - gray.mean()
    gray = gray / gray.std().clamp_min(1e-6)
    motion = gray[1:] - gray[:-1]
    motion = motion - motion.mean()
    motion = motion / motion.std().clamp_min(1e-6)
    feature = torch.cat([gray.flatten() * 0.5, motion.flatten()], dim=0)
    return torch.nn.functional.normalize(feature.to(dtype=torch.float32), dim=0)


def load_features(
    torch: Any,
    manifest_path: Path,
    manifest: dict[str, Any],
    frame_count: int,
    image_size: int,
    feature_size: int,
) -> tuple[Any, list[dict[str, Any]]]:
    records = clip_records(manifest_path, manifest)
    features = [
        extract_feature(torch, record["tensor_path"], frame_count, image_size, feature_size)
        for record in records
    ]
    return torch.stack(features, dim=0), records


def score_against_labels(torch: Any, eval_features: Any, train_by_label: dict[str, Any], labels: list[str], neighbors: int) -> Any:
    columns = []
    for label in labels:
        similarities = eval_features @ train_by_label[label].T
        k = min(neighbors, similarities.shape[1])
        columns.append(torch.topk(similarities, k=k, dim=1).values.mean(dim=1))
    return torch.stack(columns, dim=1)


def metrics(scores: Any, records: list[dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    predictions = scores.argmax(dim=1).tolist()
    true_indices = [label_to_index[record["label_id"]] for record in records]
    confusion = [[0 for _ in labels] for _ in labels]
    for true_index, predicted_index in zip(true_indices, predictions, strict=True):
        confusion[true_index][predicted_index] += 1
    per_class = []
    correct = 0
    recall_values = []
    f1_values = []
    for index, label in enumerate(labels):
        tp = confusion[index][index]
        fp = sum(confusion[row][index] for row in range(len(labels)) if row != index)
        fn = sum(confusion[index][col] for col in range(len(labels)) if col != index)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        support = sum(confusion[index])
        correct += tp
        recall_values.append(recall)
        f1_values.append(f1)
        per_class.append({
            "label_id": label,
            "support": support,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        })
    return {
        "examples": len(records),
        "top1_accuracy": correct / len(records) if records else 0.0,
        "macro_recall": sum(recall_values) / len(recall_values) if recall_values else 0.0,
        "macro_f1": sum(f1_values) / len(f1_values) if f1_values else 0.0,
        "per_class": per_class,
        "confusion_matrix_labels": labels,
        "confusion_matrix": confusion,
    }


def top_confusions(confusion: list[list[int]], labels: list[str], limit: int = 20) -> list[dict[str, Any]]:
    rows = []
    for true_index, row in enumerate(confusion):
        for predicted_index, count in enumerate(row):
            if true_index == predicted_index or count <= 0:
                continue
            rows.append({
                "actual": labels[true_index],
                "predicted": labels[predicted_index],
                "count": count,
            })
    return sorted(rows, key=lambda item: (-item["count"], item["actual"], item["predicted"]))[:limit]


def manifest_record(path: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
        "dataset_id": manifest.get("dataset_id"),
        "split": manifest.get("split"),
        "label_count": len(manifest.get("labels", [])),
        "clip_count": len(manifest.get("clips", [])),
    }


def main() -> int:
    args = parse_args()
    torch = import_torch()
    train_manifest = load_manifest(args.train_manifest)
    validation_manifest = load_manifest(args.validation_manifest)
    test_manifest = load_manifest(args.test_manifest)
    labels = validate_label_sets(train_manifest, validation_manifest, test_manifest)

    train_features, train_records = load_features(
        torch, args.train_manifest, train_manifest, args.frame_count, args.image_size, args.feature_size
    )
    train_by_label = {}
    for label in labels:
        indices = [index for index, record in enumerate(train_records) if record["label_id"] == label]
        if not indices:
            raise TemplateBaselineError(f"no train clips for label {label}")
        train_by_label[label] = train_features[torch.tensor(indices, dtype=torch.long)]

    validation_features, validation_records = load_features(
        torch, args.validation_manifest, validation_manifest, args.frame_count, args.image_size, args.feature_size
    )
    test_features, test_records = load_features(
        torch, args.test_manifest, test_manifest, args.frame_count, args.image_size, args.feature_size
    )
    validation_scores = score_against_labels(torch, validation_features, train_by_label, labels, args.neighbors)
    test_scores = score_against_labels(torch, test_features, train_by_label, labels, args.neighbors)
    validation_metrics = metrics(validation_scores, validation_records, labels)
    test_metrics = metrics(test_scores, test_records, labels)
    low_recall_classes = [
        {
            "label_id": row["label_id"],
            "support": row["support"],
            "recall": row["recall"],
        }
        for row in test_metrics["per_class"]
        if row["recall"] < 0.45
    ]
    passes_targets = (
        test_metrics["top1_accuracy"] >= 0.70
        and (test_metrics["macro_recall"] >= 0.65 or test_metrics["macro_f1"] >= 0.65)
        and not low_recall_classes
    )
    report_path = args.output_dir / "validation-report.json"
    report = {
        "schema_version": "asl-pilot-manifest-rgb-template-baseline-report/v1",
        "status": "passed_targets" if passes_targets else "failed_targets",
        "finality": "academic_online_dataset_raw_rgb_template_baseline_not_model_promotion",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "method": {
            "name": "same_split_raw_rgb_nearest_template",
            "neighbors": args.neighbors,
            "pretrained_components": [],
            "feature_extraction": {
                "source": "decoded_raw_rgb_tensors_only",
                "frame_count": args.frame_count,
                "image_size": args.image_size,
                "feature_size": args.feature_size,
                "features": ["clip_standardized_grayscale_frames", "clip_standardized_frame_deltas"],
            },
        },
        "labels": labels,
        "gate": {
            "heldout_accuracy_min": 0.70,
            "macro_recall_or_f1_min": 0.65,
            "min_per_class_recall_without_remediation": 0.45,
        },
        "manifests": {
            "train": manifest_record(args.train_manifest, train_manifest),
            "validation": manifest_record(args.validation_manifest, validation_manifest),
            "test": manifest_record(args.test_manifest, test_manifest),
        },
        "validation": validation_metrics,
        "test": test_metrics,
        "gate_failures": {
            "low_recall_classes": low_recall_classes,
        },
        "top_confusions": top_confusions(test_metrics["confusion_matrix"], labels),
        "passes_targets": passes_targets,
        "known_limitations": [
            "Closed-set raw RGB template baseline only; not a browser model-card promotion.",
            "Full-frame RGB ablation does not prove hand-only ROI or keypoint remediation.",
        ],
    }
    write_json(report_path, report)
    print(json.dumps({
        "status": report["status"],
        "output_report": project_relative(report_path),
        "test_top1_accuracy": test_metrics["top1_accuracy"],
        "test_macro_recall": test_metrics["macro_recall"],
        "test_macro_f1": test_metrics["macro_f1"],
        "low_recall_labels": [row["label_id"] for row in low_recall_classes],
    }, indent=2, sort_keys=True))
    return 0 if passes_targets else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except TemplateBaselineError as error:
        print(f"raw RGB template baseline failed: {error}", file=sys.stderr)
        raise SystemExit(2)
