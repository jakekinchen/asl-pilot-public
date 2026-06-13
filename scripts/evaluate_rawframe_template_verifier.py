#!/usr/bin/env python3
"""Evaluate a prompt-conditioned raw-frame template verifier.

This diagnostic intentionally stays outside the trained-model promotion path.
It uses only decoded raw RGB tensors from approved manifests, extracts simple
project-local raw-frame features, and selects per-label thresholds from the
validation split.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from collections import defaultdict
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
SCHEMA_VERSION = "asl-pilot-rawframe-template-verifier-diagnostic/v1"


class TemplateVerifierError(Exception):
    pass


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def stable_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True) + "\n"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stable_json(value), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, required=True)
    parser.add_argument("--validation-manifest", type=Path, required=True)
    parser.add_argument("--test-manifest", type=Path, required=True)
    parser.add_argument("--challenge-manifest", type=Path, required=True)
    parser.add_argument("--output-report", type=Path, required=True)
    parser.add_argument("--prediction-sidecar", type=Path)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--feature-size", type=int, default=24)
    parser.add_argument("--neighbors", type=int, default=3)
    parser.add_argument("--min-accepted-precision", type=float, default=0.9)
    parser.add_argument("--max-validation-false-pass-rate", type=float, default=0.1)
    parser.add_argument("--top1-target", type=float, default=0.7)
    parser.add_argument("--macro-f1-target", type=float, default=0.65)
    parser.add_argument("--test-false-pass-target", type=float, default=0.1)
    parser.add_argument("--negative-false-pass-target", type=float, default=0.05)
    parser.add_argument("--max-eval-clips", type=int)
    return parser.parse_args()


def import_torch() -> Any:
    try:
        import torch  # type: ignore
    except Exception as error:  # noqa: BLE001
        raise TemplateVerifierError(f"PyTorch is required for template diagnostics: {error}") from error
    return torch


def manifest_record(path: Path, split: str) -> dict[str, Any]:
    data = load_manifest(path)
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
        "split": split,
        "dataset_id": data.get("dataset_id"),
        "label_count": len(data.get("labels", [])),
        "clip_count": len(data.get("clips", [])),
    }


def challenge_manifest_record(path: Path) -> dict[str, Any]:
    data = read_json(path)
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
        "split": "negative_challenge",
        "dataset_id": data.get("dataset_id"),
        "clip_count": len(data.get("clips", [])),
        "challenge_type_counts": data.get("challenge_type_counts"),
    }


def validate_label_sets(train: dict[str, Any], validation: dict[str, Any], test: dict[str, Any]) -> list[str]:
    labels = [str(label["label_id"]) for label in train.get("labels", [])]
    for split_name, manifest in (("validation", validation), ("test", test)):
        split_labels = [str(label["label_id"]) for label in manifest.get("labels", [])]
        if split_labels != labels:
            raise TemplateVerifierError(f"{split_name} label order does not match train label order")
    if not labels:
        raise TemplateVerifierError("train manifest has no labels")
    return labels


def clip_records(manifest_path: Path, manifest: dict[str, Any], max_clips: int | None) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    clips = manifest.get("clips", [])
    if max_clips is not None:
        clips = clips[:max_clips]
    for index, clip in enumerate(clips):
        context = f"{manifest_path}: clips[{index}]"
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise TemplateVerifierError(
                f"{context} tensor hash mismatch for {tensor_path}; expected {expected_hash}, got {actual_hash}"
            )
        records.append(
            {
                "clip_id": clip.get("clip_id"),
                "label_id": clip.get("label_id"),
                "challenge_type": clip.get("challenge_type"),
                "tensor_path": tensor_path,
            }
        )
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
    max_clips: int | None,
) -> tuple[Any, list[dict[str, Any]]]:
    records = clip_records(manifest_path, manifest, max_clips)
    if not records:
        raise TemplateVerifierError(f"{manifest_path} has no clips to evaluate")
    features = [
        extract_feature(torch, record["tensor_path"], frame_count, image_size, feature_size)
        for record in records
    ]
    return torch.stack(features, dim=0), records


def score_against_labels(torch: Any, eval_features: Any, train_by_label: dict[str, Any], labels: list[str], neighbors: int) -> Any:
    columns = []
    for label in labels:
        train_features = train_by_label[label]
        similarities = eval_features @ train_features.T
        k = min(neighbors, similarities.shape[1])
        values = torch.topk(similarities, k=k, dim=1).values.mean(dim=1)
        columns.append(values)
    return torch.stack(columns, dim=1)


def classification_metrics(scores: Any, records: list[dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    predictions = scores.argmax(dim=1).tolist()
    true_indices = [label_to_index[str(record["label_id"])] for record in records]
    confusion = [[0 for _ in labels] for _ in labels]
    for true_index, predicted_index in zip(true_indices, predictions, strict=True):
        confusion[true_index][predicted_index] += 1
    per_class: dict[str, dict[str, float]] = {}
    correct = 0
    f1_values: list[float] = []
    for index, label in enumerate(labels):
        tp = confusion[index][index]
        fp = sum(confusion[row][index] for row in range(len(labels)) if row != index)
        fn = sum(confusion[index][col] for col in range(len(labels)) if col != index)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        support = sum(confusion[index])
        correct += tp
        f1_values.append(f1)
        per_class[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": support,
        }
    return {
        "examples": len(records),
        "top1_accuracy": correct / len(records) if records else 0.0,
        "macro_f1": sum(f1_values) / len(f1_values) if f1_values else 0.0,
        "per_class": per_class,
        "confusion_matrix": {
            "labels": labels,
            "rows_true_columns_predicted": confusion,
        },
    }


def threshold_stats(scores: Any, records: list[dict[str, Any]], labels: list[str], thresholds: dict[str, float]) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    true_accepts = 0
    false_accepts = 0
    wrong_prompt_total = 0
    for row_index, record in enumerate(records):
        true_label = str(record["label_id"])
        true_index = label_to_index[true_label]
        if float(scores[row_index, true_index]) >= thresholds[true_label]:
            true_accepts += 1
        for label_index, label in enumerate(labels):
            if label == true_label:
                continue
            wrong_prompt_total += 1
            if float(scores[row_index, label_index]) >= thresholds[label]:
                false_accepts += 1
    return {
        "true_accept_count": true_accepts,
        "positive_prompt_count": len(records),
        "true_accept_rate": true_accepts / len(records) if records else 0.0,
        "wrong_prompt_false_accept_count": false_accepts,
        "wrong_prompt_count": wrong_prompt_total,
        "wrong_prompt_false_pass_rate": false_accepts / wrong_prompt_total if wrong_prompt_total else 0.0,
    }


def choose_thresholds(
    scores: Any,
    records: list[dict[str, Any]],
    labels: list[str],
    min_precision: float,
    max_false_pass_rate: float,
) -> tuple[dict[str, float], dict[str, Any]]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    thresholds: dict[str, float] = {}
    diagnostics: dict[str, Any] = {}
    for label in labels:
        label_index = label_to_index[label]
        positive_scores: list[float] = []
        negative_scores: list[float] = []
        for row_index, record in enumerate(records):
            score = float(scores[row_index, label_index])
            if str(record["label_id"]) == label:
                positive_scores.append(score)
            else:
                negative_scores.append(score)
        candidates = sorted(set(positive_scores + negative_scores), reverse=True)
        candidates.append(max(candidates[0] if candidates else 1.0, 1.0) + 1e-6)
        best: dict[str, Any] | None = None
        for threshold in candidates:
            tp = sum(1 for value in positive_scores if value >= threshold)
            fp = sum(1 for value in negative_scores if value >= threshold)
            precision = tp / (tp + fp) if tp + fp else 1.0
            recall = tp / len(positive_scores) if positive_scores else 0.0
            false_pass_rate = fp / len(negative_scores) if negative_scores else 0.0
            eligible = precision >= min_precision and false_pass_rate <= max_false_pass_rate
            candidate = {
                "threshold": threshold,
                "true_accept_count": tp,
                "false_accept_count": fp,
                "accepted_precision": precision,
                "true_accept_rate": recall,
                "false_pass_rate": false_pass_rate,
                "eligible": eligible,
            }
            if not eligible:
                continue
            if best is None:
                best = candidate
                continue
            if (candidate["true_accept_rate"], candidate["accepted_precision"], -candidate["threshold"]) > (
                best["true_accept_rate"],
                best["accepted_precision"],
                -best["threshold"],
            ):
                best = candidate
        if best is None:
            threshold = max(positive_scores + negative_scores + [1.0]) + 1e-6
            best = {
                "threshold": threshold,
                "true_accept_count": 0,
                "false_accept_count": 0,
                "accepted_precision": 1.0,
                "true_accept_rate": 0.0,
                "false_pass_rate": 0.0,
                "eligible": False,
            }
        thresholds[label] = float(best["threshold"])
        diagnostics[label] = best
    return thresholds, diagnostics


def negative_challenge_metrics(scores: Any, records: list[dict[str, Any]], labels: list[str], thresholds: dict[str, float]) -> dict[str, Any]:
    thresholds_vector = [thresholds[label] for label in labels]
    false_pass_count = 0
    by_type: dict[str, dict[str, Any]] = defaultdict(lambda: {"examples": 0, "false_pass_count": 0, "max_score": -math.inf})
    for row_index, record in enumerate(records):
        accepted = False
        max_score = -math.inf
        for label_index, label in enumerate(labels):
            score = float(scores[row_index, label_index])
            max_score = max(max_score, score)
            if score >= thresholds_vector[label_index]:
                accepted = True
        challenge_type = str(record.get("challenge_type"))
        by_type[challenge_type]["examples"] += 1
        by_type[challenge_type]["max_score"] = max(by_type[challenge_type]["max_score"], max_score)
        if accepted:
            false_pass_count += 1
            by_type[challenge_type]["false_pass_count"] += 1
    typed = {
        key: {
            **value,
            "false_pass_rate": value["false_pass_count"] / value["examples"] if value["examples"] else 0.0,
        }
        for key, value in sorted(by_type.items())
    }
    return {
        "examples": len(records),
        "false_pass_count": false_pass_count,
        "false_pass_rate": false_pass_count / len(records) if records else 0.0,
        "by_type": typed,
    }


def build_sidecar(scores: Any, records: list[dict[str, Any]], labels: list[str], split: str) -> dict[str, Any]:
    rows = []
    for row_index, record in enumerate(records):
        values = [float(value) for value in scores[row_index].tolist()]
        top_index = max(range(len(values)), key=values.__getitem__)
        rows.append(
            {
                "split": split,
                "clip_id": record.get("clip_id"),
                "label_id": record.get("label_id"),
                "challenge_type": record.get("challenge_type"),
                "top_label_id": labels[top_index],
                "top_score": values[top_index],
                "scores": dict(zip(labels, values, strict=True)),
            }
        )
    return {"split": split, "predictions": rows}


def main() -> int:
    args = parse_args()
    torch = import_torch()

    train_manifest = load_manifest(args.train_manifest)
    validation_manifest = load_manifest(args.validation_manifest)
    test_manifest = load_manifest(args.test_manifest)
    challenge_manifest = read_json(args.challenge_manifest)
    labels = validate_label_sets(train_manifest, validation_manifest, test_manifest)

    train_features, train_records = load_features(
        torch,
        args.train_manifest,
        train_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        args.max_eval_clips,
    )
    train_by_label: dict[str, Any] = {}
    for label in labels:
        indices = [index for index, record in enumerate(train_records) if str(record["label_id"]) == label]
        if not indices:
            raise TemplateVerifierError(f"no train clips for label {label}")
        train_by_label[label] = train_features[torch.tensor(indices, dtype=torch.long)]

    validation_features, validation_records = load_features(
        torch,
        args.validation_manifest,
        validation_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        args.max_eval_clips,
    )
    test_features, test_records = load_features(
        torch,
        args.test_manifest,
        test_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        args.max_eval_clips,
    )
    challenge_records = clip_records(args.challenge_manifest, challenge_manifest, args.max_eval_clips)
    challenge_features = torch.stack(
        [
            extract_feature(torch, record["tensor_path"], args.frame_count, args.image_size, args.feature_size)
            for record in challenge_records
        ],
        dim=0,
    )

    validation_scores = score_against_labels(torch, validation_features, train_by_label, labels, args.neighbors)
    test_scores = score_against_labels(torch, test_features, train_by_label, labels, args.neighbors)
    challenge_scores = score_against_labels(torch, challenge_features, train_by_label, labels, args.neighbors)

    thresholds, threshold_diagnostics = choose_thresholds(
        validation_scores,
        validation_records,
        labels,
        args.min_accepted_precision,
        args.max_validation_false_pass_rate,
    )
    validation_metrics = classification_metrics(validation_scores, validation_records, labels)
    test_metrics = classification_metrics(test_scores, test_records, labels)
    validation_threshold_metrics = threshold_stats(validation_scores, validation_records, labels, thresholds)
    test_threshold_metrics = threshold_stats(test_scores, test_records, labels, thresholds)
    challenge_metrics = negative_challenge_metrics(challenge_scores, challenge_records, labels, thresholds)

    pass_status = {
        "top1_accuracy": test_metrics["top1_accuracy"] >= args.top1_target,
        "macro_f1": test_metrics["macro_f1"] >= args.macro_f1_target,
        "false_pass_rate": test_threshold_metrics["wrong_prompt_false_pass_rate"] < args.test_false_pass_target,
        "negative_challenge_false_pass_rate": challenge_metrics["false_pass_rate"] < args.negative_false_pass_target,
    }

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "diagnostic_failed" if not all(pass_status.values()) else "diagnostic_passed_not_promotable",
        "finality": "diagnostic_not_final_model_evidence",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": {
                "path": project_relative(Path(__file__)),
                "sha256": sha256_file(Path(__file__)),
            },
            "command": sys.argv,
        },
        "method": {
            "name": "raw_frame_prompt_conditioned_knn_template",
            "pretrained_components": [],
            "feature_extraction": {
                "source": "decoded_raw_rgb_tensors_only",
                "frame_count": args.frame_count,
                "image_size": args.image_size,
                "feature_size": args.feature_size,
                "features": ["clip_standardized_grayscale_frames", "clip_standardized_frame_deltas"],
            },
            "neighbors": args.neighbors,
            "threshold_selection": {
                "source_split": "validation",
                "min_accepted_precision": args.min_accepted_precision,
                "max_validation_false_pass_rate": args.max_validation_false_pass_rate,
            },
        },
        "manifests": {
            "train": manifest_record(args.train_manifest, "train"),
            "validation": manifest_record(args.validation_manifest, "validation"),
            "test": manifest_record(args.test_manifest, "test"),
            "negative_challenge": challenge_manifest_record(args.challenge_manifest),
        },
        "labels": labels,
        "thresholds": thresholds,
        "threshold_diagnostics": threshold_diagnostics,
        "validation": {
            **validation_metrics,
            "threshold_metrics": validation_threshold_metrics,
        },
        "test": {
            **test_metrics,
            "threshold_metrics": test_threshold_metrics,
        },
        "negative_challenge": challenge_metrics,
        "targets": {
            "top1_accuracy": args.top1_target,
            "macro_f1": args.macro_f1_target,
            "test_false_pass_rate_below": args.test_false_pass_target,
            "negative_challenge_false_pass_rate_below": args.negative_false_pass_target,
        },
        "pass_status": pass_status,
        "known_limitations": [
            "Diagnostic raw-frame template verifier; no browser artifact or model card promotion.",
            "Per-label thresholds are selected from validation only and may not generalize.",
        ],
    }
    write_json(args.output_report, report)

    if args.prediction_sidecar:
        sidecar = {
            "schema_version": f"{SCHEMA_VERSION}-prediction-sidecar",
            "created_at": report["created_at"],
            "report": {
                "path": project_relative(args.output_report),
                "sha256": sha256_file(args.output_report),
            },
            "labels": labels,
            "thresholds": thresholds,
            "splits": [
                build_sidecar(validation_scores, validation_records, labels, "validation"),
                build_sidecar(test_scores, test_records, labels, "test"),
                build_sidecar(challenge_scores, challenge_records, labels, "negative_challenge"),
            ],
        }
        write_json(args.prediction_sidecar, sidecar)

    print(
        stable_json(
            {
                "status": report["status"],
                "output_report": project_relative(args.output_report),
                "output_report_sha256": sha256_file(args.output_report),
                "prediction_sidecar": project_relative(args.prediction_sidecar) if args.prediction_sidecar else None,
                "test_top1_accuracy": test_metrics["top1_accuracy"],
                "test_macro_f1": test_metrics["macro_f1"],
                "test_wrong_prompt_false_pass_rate": test_threshold_metrics["wrong_prompt_false_pass_rate"],
                "negative_challenge_false_pass_rate": challenge_metrics["false_pass_rate"],
                "pass_status": pass_status,
            }
        )
    )
    return 0 if all(pass_status.values()) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except TemplateVerifierError as error:
        print(f"Template verifier failed: {error}", file=sys.stderr)
        raise SystemExit(2)
