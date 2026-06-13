#!/usr/bin/env python3
"""No-training vocabulary/crop separability diagnosis for Mission 3AY."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-vocab-crop-separability-diagnosis-v1.json"
SCHEMA_VERSION = "asl-pilot-vocab-crop-separability-diagnosis/v1"
MANIFESTS = {
    "train": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "train.json",
    "validation": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "validation.json",
    "test": PROJECT_ROOT / "data" / "manifests" / "lesson" / "high-signal-region-grid" / "test.json",
}
INPUT_ARTIFACTS = [
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-local-smoke-v1.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "validation-report.json",
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke" / "prediction-sidecar.json",
    PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json",
    PROJECT_ROOT / "output" / "m3ax-region-grid-tcn-tiny-overfit" / "selected-subset.json",
    PROJECT_ROOT / "output" / "m3ax-region-grid-tcn-tiny-overfit" / "tiny-overfit-provenance.json",
    PROJECT_ROOT / "artifacts" / "research" / "observer-324-post-m3aw-strategy-api-response.md",
    *MANIFESTS.values(),
]
REGION_ORDER = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]


class DiagnosisError(RuntimeError):
    """Raised when the no-training diagnosis cannot be produced safely."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json"),
        help="Tracked M3AY receipt path.",
    )
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DiagnosisError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise DiagnosisError(f"{context} missing: {path}")
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


def percentile_rank(values: list[float], value: float) -> float | None:
    if not values:
        return None
    below_or_equal = sum(1 for item in values if item <= value)
    return float(below_or_equal / len(values))


def euclidean(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right, strict=True)))


def summarize_manifest(split: str, manifest: dict[str, Any]) -> dict[str, Any]:
    clips = manifest["clips"]
    labels = [str(label["label_id"]) for label in manifest["labels"]]
    per_label: dict[str, dict[str, Any]] = {}
    for label_id in labels:
        label_clips = [clip for clip in clips if clip["label_id"] == label_id]
        signers = Counter(str(clip["signer_id"]) for clip in label_clips)
        source_records = [str(clip["source_record_id"]) for clip in label_clips]
        per_label[label_id] = {
            "clip_count": len(label_clips),
            "signer_count": len(signers),
            "top_signers": [{"signer_id": signer, "clips": count} for signer, count in signers.most_common(5)],
            "source_record_count": len(set(source_records)),
        }
    split_signers = Counter(str(clip["signer_id"]) for clip in clips)
    return {
        "split": split,
        "clip_count": len(clips),
        "label_count": len(labels),
        "labels": labels,
        "signer_count": len(split_signers),
        "top_signers": [{"signer_id": signer, "clips": count} for signer, count in split_signers.most_common(10)],
        "per_label": per_label,
    }


def signer_overlap(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    signer_sets = {
        split: {str(clip["signer_id"]) for clip in manifest["clips"]}
        for split, manifest in manifests.items()
    }
    return {
        "train_validation_overlap": sorted(signer_sets["train"] & signer_sets["validation"]),
        "train_test_overlap": sorted(signer_sets["train"] & signer_sets["test"]),
        "validation_test_overlap": sorted(signer_sets["validation"] & signer_sets["test"]),
        "train_only_count": len(signer_sets["train"] - signer_sets["validation"] - signer_sets["test"]),
        "validation_only_count": len(signer_sets["validation"] - signer_sets["train"] - signer_sets["test"]),
        "test_only_count": len(signer_sets["test"] - signer_sets["train"] - signer_sets["validation"]),
    }


def tensor_stats(torch: Any, tensor_path: Path) -> dict[str, Any]:
    payload = torch.load(tensor_path, map_location="cpu", weights_only=False)
    if payload.get("schema_version") != "asl-pilot-return-to-form-high-signal-region-grid-tensor/v1":
        raise DiagnosisError(f"unexpected tensor schema for {tensor_path}")
    if payload.get("region_axis") != "T,R,H,W,C":
        raise DiagnosisError(f"unexpected tensor region axis for {tensor_path}")
    region_ids = [str(region_id) for region_id in payload.get("region_ids", [])]
    if region_ids != REGION_ORDER:
        raise DiagnosisError(f"unexpected region order for {tensor_path}: {region_ids}")
    regions = payload.get("rgb_regions")
    if not torch.is_tensor(regions):
        raise DiagnosisError(f"rgb_regions missing for {tensor_path}")
    if list(regions.shape) != [16, 5, 96, 96, 3]:
        raise DiagnosisError(f"unexpected rgb_regions shape for {tensor_path}: {list(regions.shape)}")
    regions_float = regions.to(dtype=torch.float32)
    region_rows = []
    feature_vector = []
    for region_index, region_id in enumerate(region_ids):
        region = regions_float[:, region_index, :, :, :]
        frame_means = region.mean(dim=(1, 2, 3))
        motion = torch.abs(region[1:] - region[:-1]).mean() if int(region.shape[0]) > 1 else torch.tensor(0.0)
        mean_intensity = float(region.mean().item())
        std_intensity = float(region.std(unbiased=False).item())
        motion_mean = float(motion.item())
        dark_fraction = float((region <= 10).to(dtype=torch.float32).mean().item())
        bright_fraction = float((region >= 245).to(dtype=torch.float32).mean().item())
        frame_mean_range = float((frame_means.max() - frame_means.min()).item())
        region_rows.append(
            {
                "region_id": region_id,
                "mean_intensity": mean_intensity,
                "std_intensity": std_intensity,
                "temporal_motion_mean": motion_mean,
                "dark_fraction_lte_10": dark_fraction,
                "bright_fraction_gte_245": bright_fraction,
                "frame_mean_range": frame_mean_range,
            }
        )
        feature_vector.extend([mean_intensity / 255.0, std_intensity / 255.0, motion_mean / 255.0])
    hand_motion = [
        row["temporal_motion_mean"]
        for row in region_rows
        if row["region_id"] in {"viewer_left_hand_context", "viewer_right_hand_context"}
    ]
    return {
        "region_ids": region_ids,
        "shape": [int(value) for value in regions.shape],
        "regions": region_rows,
        "feature_vector": feature_vector,
        "overall": {
            "mean_intensity": mean([row["mean_intensity"] for row in region_rows]),
            "std_intensity": mean([row["std_intensity"] for row in region_rows]),
            "temporal_motion_mean": mean([row["temporal_motion_mean"] for row in region_rows]),
            "hand_context_motion_mean": mean(hand_motion),
            "dark_fraction_lte_10": mean([row["dark_fraction_lte_10"] for row in region_rows]),
        },
    }


def collect_tensor_diagnostics(torch: Any, manifests: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rows = []
    label_split_region: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    for split, manifest in manifests.items():
        for clip in manifest["clips"]:
            tensor_path = (MANIFESTS[split].parent / str(clip["relative_frame_tensor_path"])).resolve()
            expected_hash = str(clip["frame_tensor_sha256"])
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise DiagnosisError(
                    f"tensor hash mismatch for {clip['clip_id']}: expected {expected_hash}, got {actual_hash}"
                )
            stats = tensor_stats(torch, tensor_path)
            row = {
                "split": split,
                "clip_id": str(clip["clip_id"]),
                "label_id": str(clip["label_id"]),
                "signer_id": str(clip["signer_id"]),
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": actual_hash,
                "overall": stats["overall"],
                "regions": stats["regions"],
                "feature_vector": stats["feature_vector"],
            }
            rows.append(row)
            for region_row in stats["regions"]:
                key = f"{region_row['region_id']}__temporal_motion_mean"
                label_split_region[split][str(clip["label_id"])][key].append(region_row["temporal_motion_mean"])
                std_key = f"{region_row['region_id']}__std_intensity"
                label_split_region[split][str(clip["label_id"])][std_key].append(region_row["std_intensity"])
    summary: dict[str, Any] = {}
    for split, per_label in label_split_region.items():
        summary[split] = {}
        for label_id, metrics in per_label.items():
            summary[split][label_id] = {
                metric: {
                    "mean": mean(values),
                    "median": median(values),
                    "min": min(values),
                    "max": max(values),
                }
                for metric, values in metrics.items()
            }
    return rows, summary


def vector_mean(vectors: list[list[float]]) -> list[float]:
    width = len(vectors[0])
    return [sum(vector[index] for vector in vectors) / len(vectors) for index in range(width)]


def centroid_diagnostics(rows: list[dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    by_split_label: dict[str, dict[str, list[list[float]]]] = defaultdict(lambda: defaultdict(list))
    for row in rows:
        by_split_label[row["split"]][row["label_id"]].append(row["feature_vector"])
    centroids = {
        split: {
            label_id: vector_mean(vectors)
            for label_id, vectors in per_label.items()
            if vectors
        }
        for split, per_label in by_split_label.items()
    }
    train_centroids = centroids["train"]
    train_nearest_pairs = []
    for label_id in labels:
        distances = [
            {"other_label": other_label, "distance": euclidean(train_centroids[label_id], other_vector)}
            for other_label, other_vector in train_centroids.items()
            if other_label != label_id
        ]
        train_nearest_pairs.append(
            {
                "label_id": label_id,
                "nearest_train_label": min(distances, key=lambda row: row["distance"]) if distances else None,
            }
        )
    split_drift = {}
    for split in ["validation", "test"]:
        split_drift[split] = []
        for label_id in labels:
            if label_id not in centroids.get(split, {}):
                continue
            own_distance = euclidean(centroids[split][label_id], train_centroids[label_id])
            other_distances = [
                {"label_id": other_label, "distance": euclidean(centroids[split][label_id], other_vector)}
                for other_label, other_vector in train_centroids.items()
                if other_label != label_id
            ]
            nearest_other = min(other_distances, key=lambda row: row["distance"])
            split_drift[split].append(
                {
                    "label_id": label_id,
                    "distance_to_same_label_train_centroid": own_distance,
                    "nearest_other_train_centroid": nearest_other,
                    "same_label_closer_than_nearest_other": own_distance < nearest_other["distance"],
                    "drift_ratio_same_to_nearest_other": own_distance / nearest_other["distance"]
                    if nearest_other["distance"]
                    else None,
                }
            )
    return {
        "feature_definition": "For each of five fixed regions: mean intensity, std intensity, temporal mean absolute frame difference, normalized by 255. Descriptive only; no model fitting.",
        "train_nearest_label_pairs": sorted(
            train_nearest_pairs,
            key=lambda row: row["nearest_train_label"]["distance"] if row["nearest_train_label"] else float("inf"),
        ),
        "split_centroid_drift": split_drift,
    }


def m3ax_subset_representativeness(rows: list[dict[str, Any]], selected_subset: dict[str, Any]) -> dict[str, Any]:
    train_rows = [row for row in rows if row["split"] == "train"]
    rows_by_clip = {row["clip_id"]: row for row in train_rows}
    by_label = defaultdict(list)
    for row in train_rows:
        by_label[row["label_id"]].append(row)
    selected_rows = []
    for selected in selected_subset["clips"]:
        clip_id = str(selected["clip_id"])
        row = rows_by_clip[clip_id]
        label_train_rows = by_label[row["label_id"]]
        motion_values = [float(item["overall"]["temporal_motion_mean"]) for item in label_train_rows]
        hand_motion_values = [float(item["overall"]["hand_context_motion_mean"]) for item in label_train_rows]
        std_values = [float(item["overall"]["std_intensity"]) for item in label_train_rows]
        selected_rows.append(
            {
                "clip_id": clip_id,
                "label_id": row["label_id"],
                "signer_id": row["signer_id"],
                "overall_temporal_motion_mean": row["overall"]["temporal_motion_mean"],
                "overall_motion_percentile_within_train_label": percentile_rank(
                    motion_values, float(row["overall"]["temporal_motion_mean"])
                ),
                "hand_context_motion_mean": row["overall"]["hand_context_motion_mean"],
                "hand_motion_percentile_within_train_label": percentile_rank(
                    hand_motion_values, float(row["overall"]["hand_context_motion_mean"])
                ),
                "std_intensity": row["overall"]["std_intensity"],
                "std_percentile_within_train_label": percentile_rank(std_values, float(row["overall"]["std_intensity"])),
            }
        )
    percentile_values = [
        value
        for item in selected_rows
        for value in [
            item["overall_motion_percentile_within_train_label"],
            item["hand_motion_percentile_within_train_label"],
            item["std_percentile_within_train_label"],
        ]
        if value is not None
    ]
    return {
        "selection_rule": selected_subset["selection_rule"],
        "selected_clip_count": len(selected_rows),
        "selected_rows": selected_rows,
        "median_selected_percentile_across_motion_and_std": median(percentile_values),
        "interpretation": (
            "The tiny subset is one deterministic clip per label and is useful for model/input memorization only. "
            "Its per-label percentile statistics are descriptive and do not prove held-out representativeness."
        ),
    }


def prediction_patterns(validation_report: dict[str, Any], prediction_sidecar: dict[str, Any]) -> dict[str, Any]:
    output = {}
    for split in ["validation", "test"]:
        report = validation_report[split]
        examples = prediction_sidecar[split]["examples"]
        predicted_counts = Counter(str(example["predicted_label"]) for example in examples)
        true_counts = Counter(str(example["true_label"]) for example in examples)
        zero_recall_labels = [
            label_id
            for label_id, row in report["per_class"].items()
            if float(row["recall"]) == 0.0 and int(row["support"]) > 0
        ]
        confidences = [float(example["confidence"]) for example in examples]
        margins = [float(example["probability_margin"]) for example in examples]
        entropies = [float(example["entropy"]) for example in examples]
        threshold = float(prediction_sidecar.get("selected_threshold", 1.0))
        accepted = [example for example in examples if float(example["confidence"]) >= threshold]
        output[split] = {
            "examples": len(examples),
            "top1_accuracy": report["top1_accuracy"],
            "macro_f1": report["macro_f1"],
            "true_label_counts": dict(sorted(true_counts.items())),
            "predicted_label_counts": dict(sorted(predicted_counts.items())),
            "prediction_label_coverage": len(predicted_counts),
            "labels_never_predicted": sorted(set(true_counts) - set(predicted_counts)),
            "zero_recall_labels": sorted(zero_recall_labels),
            "mean_confidence": mean(confidences),
            "max_confidence": max(confidences),
            "mean_probability_margin": mean(margins),
            "mean_entropy": mean(entropies),
            "accepted_at_selected_threshold": len(accepted),
            "accepted_correct_at_selected_threshold": sum(1 for example in accepted if example["correct"]),
        }
    output["selected_threshold"] = prediction_sidecar.get("selected_threshold")
    return output


def low_signal_examples(rows: list[dict[str, Any]]) -> dict[str, Any]:
    ranked_motion = sorted(
        rows,
        key=lambda row: (
            float(row["overall"]["hand_context_motion_mean"]),
            float(row["overall"]["temporal_motion_mean"]),
        ),
    )
    ranked_std = sorted(rows, key=lambda row: float(row["overall"]["std_intensity"]))
    return {
        "lowest_hand_motion_clips": [
            {
                "split": row["split"],
                "label_id": row["label_id"],
                "clip_id": row["clip_id"],
                "signer_id": row["signer_id"],
                "hand_context_motion_mean": row["overall"]["hand_context_motion_mean"],
                "overall_temporal_motion_mean": row["overall"]["temporal_motion_mean"],
            }
            for row in ranked_motion[:12]
        ],
        "lowest_std_intensity_clips": [
            {
                "split": row["split"],
                "label_id": row["label_id"],
                "clip_id": row["clip_id"],
                "signer_id": row["signer_id"],
                "std_intensity": row["overall"]["std_intensity"],
                "dark_fraction_lte_10": row["overall"]["dark_fraction_lte_10"],
            }
            for row in ranked_std[:12]
        ],
    }


def build_conclusions(
    m3aw_receipt: dict[str, Any],
    m3ax_receipt: dict[str, Any],
    predictions: dict[str, Any],
    centroids: dict[str, Any],
    overlap: dict[str, Any],
) -> tuple[list[str], str]:
    validation = predictions["validation"]
    test = predictions["test"]
    drift_rows = centroids["split_centroid_drift"]
    drift_failures = [
        f"{split}:{row['label_id']}"
        for split, rows in drift_rows.items()
        for row in rows
        if not row["same_label_closer_than_nearest_other"]
    ]
    conclusions = [
        (
            f"M3AX accuracy {m3ax_receipt['training_result']['final_eval_metrics']['accuracy']} shows the "
            "region-grid true TCN path can memorize a tiny subset, so M3AW failure is not explained by a total "
            "model-input or optimizer-path break."
        ),
        (
            f"M3AW held-out predictions collapsed to {validation['prediction_label_coverage']} validation labels "
            f"and {test['prediction_label_coverage']} test labels; labels never predicted include validation "
            f"{validation['labels_never_predicted']} and test {test['labels_never_predicted']}."
        ),
        (
            f"Confidence stayed weak: validation mean confidence {validation['mean_confidence']:.4f}, "
            f"test mean confidence {test['mean_confidence']:.4f}, selected threshold {predictions['selected_threshold']}."
        ),
        (
            "Train/held-out signer overlap is limited: "
            f"train-validation overlap {overlap['train_validation_overlap']}, train-test overlap "
            f"{overlap['train_test_overlap']}. This supports a signer/split generalization diagnosis."
        ),
        (
            f"Hand-engineered crop-stat centroids show same-label held-out drift losing to another train label for "
            f"{len(drift_failures)} split-label rows: {drift_failures[:12]}."
        ),
        (
            f"M3AW receipt status `{m3aw_receipt['status']}` and M3AX receipt status `{m3ax_receipt['status']}` "
            "must remain separate: tiny memorization is not browser readiness or held-out success."
        ),
    ]
    return conclusions, "continue_no_training_vocab_or_crop_remediation_design"


def run(args: argparse.Namespace) -> dict[str, Any]:
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise DiagnosisError(
            "M3AY requires --receipt docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json"
        )
    for path in INPUT_ARTIFACTS:
        project_path(path, f"input artifact {path}")

    import torch

    torch.set_grad_enabled(False)
    manifests = {split: load_json(path) for split, path in MANIFESTS.items()}
    manifest_summaries = {split: summarize_manifest(split, manifest) for split, manifest in manifests.items()}
    overlap = signer_overlap(manifests)
    tensor_rows, tensor_summary = collect_tensor_diagnostics(torch, manifests)

    labels = [str(label["label_id"]) for label in manifests["train"]["labels"]]
    m3aw_receipt = load_json(INPUT_ARTIFACTS[0])
    m3aw_report = load_json(INPUT_ARTIFACTS[1])
    m3aw_sidecar = load_json(INPUT_ARTIFACTS[2])
    m3ax_receipt = load_json(INPUT_ARTIFACTS[3])
    m3ax_subset = load_json(INPUT_ARTIFACTS[4])
    predictions = prediction_patterns(m3aw_report, m3aw_sidecar)
    centroids = centroid_diagnostics(tensor_rows, labels)
    m3ax_representation = m3ax_subset_representativeness(tensor_rows, m3ax_subset)
    low_signal = low_signal_examples(tensor_rows)
    conclusions, next_action = build_conclusions(m3aw_receipt, m3ax_receipt, predictions, centroids, overlap)

    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "status": "completed",
        "mission": "M3AY",
        "active_prompt": "docs/model/return-to-form-vocab-crop-separability-diagnosis-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/diagnose_vocab_crop_separability.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
        },
        "input_artifacts": [file_reference(path) for path in INPUT_ARTIFACTS],
        "commands": {
            "diagnosis": [sys.executable, *sys.argv],
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json",
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
            "browser_or_final_claim_changed": False,
            "description": (
                "Loaded existing JSON artifacts and existing region-grid tensors, verified tensor hashes, "
                "computed deterministic descriptive crop statistics and prediction summaries only."
            ),
        },
        "prior_evidence": {
            "m3aw": {
                "receipt_status": m3aw_receipt["status"],
                "validation_top1_accuracy": m3aw_report["validation"]["top1_accuracy"],
                "validation_macro_f1": m3aw_report["validation"]["macro_f1"],
                "test_top1_accuracy": m3aw_report["test"]["top1_accuracy"],
                "test_macro_f1": m3aw_report["test"]["macro_f1"],
            },
            "m3ax": {
                "receipt_status": m3ax_receipt["status"],
                "tiny_subset_accuracy": m3ax_receipt["training_result"]["final_eval_metrics"]["accuracy"],
                "tiny_subset_zero_recall_labels": m3ax_receipt["training_result"]["final_eval_metrics"][
                    "zero_recall_labels"
                ],
                "batched_model_input_shape": m3ax_receipt["input_contract"]["batched_model_input_shape"],
            },
        },
        "manifest_distribution": {
            "summaries": manifest_summaries,
            "signer_overlap": overlap,
        },
        "prediction_patterns": predictions,
        "crop_region_statistics": {
            "region_order": REGION_ORDER,
            "label_split_region_summary": tensor_summary,
            "low_signal_examples": low_signal,
        },
        "descriptive_feature_separation": centroids,
        "m3ax_tiny_subset_representativeness": m3ax_representation,
        "conclusions": conclusions,
        "guardrails": {
            "non_promotion": (
                "This diagnosis is not training, calibration, export, browser activation, final readiness, or a "
                "claim that the M3AW recognizer generalizes."
            ),
            "pretrained_components": [],
            "brev_used": False,
            "paid_compute_used": False,
            "external_media_imported": False,
            "pseudo_labels_generated": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "final_gates_changed": False,
        },
        "exactly_one_next_action": next_action,
    }
    if args.write_receipt:
        write_json(receipt_path, receipt)
    return {
        "status": receipt["status"],
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
        "next_action": next_action,
        "validation_prediction_label_coverage": predictions["validation"]["prediction_label_coverage"],
        "test_prediction_label_coverage": predictions["test"]["prediction_label_coverage"],
        "split_label_drift_failures": sum(
            1
            for rows in centroids["split_centroid_drift"].values()
            for row in rows
            if not row["same_label_closer_than_nearest_other"]
        ),
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except DiagnosisError as error:
        print(f"M3AY diagnosis failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
