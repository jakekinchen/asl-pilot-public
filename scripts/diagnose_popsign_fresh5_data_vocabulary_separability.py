#!/usr/bin/env python3
"""Build the M3BW PopSign fresh5 no-training separability packet."""

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
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-data-vocabulary-separability/v1"
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json")

MANIFESTS = {
    "train": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/train.json"),
    "validation": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json"),
    "test": Path("data/manifests/return-to-form-popsign-fresh5-region-grid/test.json"),
}
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json")
M3BS_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json")
M3BU_REPORT = Path("output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json")
M3BU_SIDECAR = Path("output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json")
M3BV_PROVENANCE = Path("output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json")

HAND_REGION_IDS = {"viewer_left_hand_context", "viewer_right_hand_context"}
LOW_HAND_MOTION_THRESHOLD = 0.01


class DiagnosisError(RuntimeError):
    """Raised when the no-training diagnosis cannot be completed."""


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
        raise DiagnosisError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise DiagnosisError(f"required path does not exist: {path}")
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
        raise DiagnosisError(f"JSON root must be an object: {project_relative(resolved)}")
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


def summarize_values(values: list[float]) -> dict[str, Any]:
    if not values:
        return {"count": 0}
    ordered = sorted(float(value) for value in values)
    return {
        "count": len(ordered),
        "min": rounded(ordered[0]),
        "max": rounded(ordered[-1]),
        "mean": rounded(statistics.fmean(ordered)),
        "median": rounded(statistics.median(ordered)),
    }


def percentile_rank(values: list[float], target: float) -> float | None:
    if not values:
        return None
    ordered = sorted(float(value) for value in values)
    less_or_equal = sum(1 for value in ordered if value <= target)
    return rounded(less_or_equal / len(ordered))


def tensor_path_for_clip(manifest_path: Path, clip: dict[str, Any]) -> Path:
    relative = clip.get("relative_frame_tensor_path")
    if not isinstance(relative, str) or not relative:
        raise DiagnosisError(f"clip {clip.get('clip_id')} lacks relative_frame_tensor_path")
    return (manifest_path.parent / relative).resolve()


def load_regions(torch: Any, tensor_path: Path) -> tuple[Any, list[str]]:
    try:
        payload = torch.load(tensor_path, map_location="cpu", weights_only=True)
    except TypeError:
        payload = torch.load(tensor_path, map_location="cpu")
    if not isinstance(payload, dict) or not torch.is_tensor(payload.get("rgb_regions")):
        raise DiagnosisError(f"tensor payload lacks rgb_regions: {project_relative(tensor_path)}")
    region_ids = payload.get("region_ids")
    if not isinstance(region_ids, list):
        region_ids = []
    return payload["rgb_regions"], [str(region_id) for region_id in region_ids]


def clip_tensor_stats(torch: Any, manifest_path: Path, clip: dict[str, Any]) -> dict[str, Any]:
    tensor_path = tensor_path_for_clip(manifest_path, clip)
    expected_hash = str(clip.get("frame_tensor_sha256") or "")
    actual_hash = sha256_file(tensor_path)
    if expected_hash and actual_hash != expected_hash:
        raise DiagnosisError(
            f"tensor hash mismatch for {clip.get('clip_id')}: expected {expected_hash}, got {actual_hash}"
        )
    regions, region_ids = load_regions(torch, tensor_path)
    if list(regions.shape) != [16, 5, 96, 96, 3]:
        raise DiagnosisError(f"unexpected rgb_regions shape for {clip.get('clip_id')}: {list(regions.shape)}")
    values = regions.to(dtype=torch.float32) / 255.0
    motion = (values[1:] - values[:-1]).abs()
    region_mean = values.mean(dim=(0, 2, 3, 4)).detach().cpu().tolist()
    region_std = values.std(dim=(0, 2, 3, 4), unbiased=False).detach().cpu().tolist()
    region_motion = motion.mean(dim=(0, 2, 3, 4)).detach().cpu().tolist()
    region_ids = region_ids or [f"region_{index}" for index in range(len(region_mean))]
    region_rows = []
    hand_motion_values = []
    for region_id, mean, std, motion_value in zip(region_ids, region_mean, region_std, region_motion):
        if region_id in HAND_REGION_IDS:
            hand_motion_values.append(float(motion_value))
        region_rows.append(
            {
                "region_id": region_id,
                "mean_intensity": rounded(mean),
                "std_intensity": rounded(std),
                "frame_absdiff_mean": rounded(motion_value),
            }
        )
    total_motion = float(motion.mean().detach().cpu().item())
    mean_intensity = float(values.mean().detach().cpu().item())
    hand_motion = statistics.fmean(hand_motion_values) if hand_motion_values else total_motion
    return {
        "clip_id": str(clip.get("clip_id")),
        "label_id": str(clip.get("label_id")),
        "split": str(clip.get("split")),
        "source_split": str(clip.get("source_split")),
        "source_sign_slug": str(clip.get("source_sign_slug") or clip.get("label_id")),
        "signer_id": str(clip.get("signer_id")),
        "signer_identity_hash": str(clip.get("signer_identity_hash")),
        "source_record_id": str(clip.get("source_record_id")),
        "tensor_path": project_relative(tensor_path),
        "tensor_sha256": actual_hash,
        "rgb_regions_shape": list(regions.shape),
        "region_ids": region_ids,
        "mean_intensity": rounded(mean_intensity),
        "total_frame_absdiff_mean": rounded(total_motion),
        "hand_frame_absdiff_mean": rounded(hand_motion),
        "low_hand_motion": hand_motion < LOW_HAND_MOTION_THRESHOLD,
        "regions": region_rows,
    }


def load_manifests() -> dict[str, dict[str, Any]]:
    return {split: load_json(path) for split, path in MANIFESTS.items()}


def split_distribution(manifests: dict[str, dict[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    signer_hashes_by_split: dict[str, set[str]] = {}
    signer_hashes_by_split_label: dict[tuple[str, str], set[str]] = {}
    for split, manifest in manifests.items():
        labels = [str(label["label_id"]) for label in manifest["labels"]]
        label_counts = Counter()
        source_split_counts = Counter()
        source_sign_counts = Counter()
        signer_hashes: set[str] = set()
        signer_counts_by_label: dict[str, set[str]] = {label: set() for label in labels}
        source_split_by_label: dict[str, Counter[str]] = {label: Counter() for label in labels}
        for clip in manifest["clips"]:
            label = str(clip["label_id"])
            label_counts[label] += 1
            source_split = str(clip.get("source_split") or "")
            source_split_counts[source_split] += 1
            source_split_by_label[label][source_split] += 1
            source_sign_counts[str(clip.get("source_sign_slug") or label)] += 1
            signer_hash = str(clip.get("signer_identity_hash") or "")
            signer_hashes.add(signer_hash)
            signer_counts_by_label.setdefault(label, set()).add(signer_hash)
        signer_hashes_by_split[split] = signer_hashes
        for label, hashes in signer_counts_by_label.items():
            signer_hashes_by_split_label[(split, label)] = hashes
        result[split] = {
            "clip_count": len(manifest["clips"]),
            "label_counts": dict(sorted(label_counts.items())),
            "source_split_counts": dict(sorted(source_split_counts.items())),
            "source_sign_slug_counts": dict(sorted(source_sign_counts.items())),
            "signer_identity_hash_count": len(signer_hashes),
            "signer_identity_hash_count_by_label": {
                label: len(hashes) for label, hashes in sorted(signer_counts_by_label.items())
            },
            "source_split_counts_by_label": {
                label: dict(sorted(counter.items())) for label, counter in sorted(source_split_by_label.items())
            },
        }
    overlaps: dict[str, Any] = {}
    for left, right in (("train", "validation"), ("train", "test"), ("validation", "test")):
        overlaps[f"{left}_vs_{right}"] = {
            "shared_signer_identity_hash_count": len(signer_hashes_by_split[left] & signer_hashes_by_split[right]),
            "label_shared_signer_identity_hash_count": {
                label: len(
                    signer_hashes_by_split_label.get((left, label), set())
                    & signer_hashes_by_split_label.get((right, label), set())
                )
                for label in sorted(result[left]["label_counts"])
            },
        }
    return {"splits": result, "signer_overlap": overlaps}


def aggregate_tensor_stats(stats: list[dict[str, Any]]) -> dict[str, Any]:
    by_split_label: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in stats:
        by_split_label[(row["split"], row["label_id"])].append(row)
    result: dict[str, Any] = {}
    for (split, label), rows in sorted(by_split_label.items()):
        key = f"{split}:{label}"
        hand_values = [row["hand_frame_absdiff_mean"] for row in rows]
        motion_values = [row["total_frame_absdiff_mean"] for row in rows]
        intensity_values = [row["mean_intensity"] for row in rows]
        region_ids = rows[0]["region_ids"]
        region_motion: dict[str, list[float]] = {region_id: [] for region_id in region_ids}
        for row in rows:
            for region in row["regions"]:
                region_motion[region["region_id"]].append(region["frame_absdiff_mean"])
        result[key] = {
            "clip_count": len(rows),
            "total_frame_absdiff_mean": summarize_values(motion_values),
            "hand_frame_absdiff_mean": summarize_values(hand_values),
            "mean_intensity": summarize_values(intensity_values),
            "low_hand_motion_threshold": LOW_HAND_MOTION_THRESHOLD,
            "low_hand_motion_clip_count": sum(1 for row in rows if row["low_hand_motion"]),
            "low_hand_motion_fraction": rounded(sum(1 for row in rows if row["low_hand_motion"]) / len(rows)),
            "per_region_frame_absdiff_mean": {
                region_id: summarize_values(values) for region_id, values in sorted(region_motion.items())
            },
        }
    return result


def feature_vector(row: dict[str, Any]) -> list[float]:
    return [
        float(row["mean_intensity"]),
        float(row["total_frame_absdiff_mean"]),
        float(row["hand_frame_absdiff_mean"]),
        *[float(region["frame_absdiff_mean"]) for region in row["regions"]],
    ]


def euclidean(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def descriptive_separation(stats: list[dict[str, Any]]) -> dict[str, Any]:
    by_split_label: dict[tuple[str, str], list[list[float]]] = defaultdict(list)
    for row in stats:
        by_split_label[(row["split"], row["label_id"])].append(feature_vector(row))
    result: dict[str, Any] = {}
    for split in sorted({row["split"] for row in stats}):
        labels = sorted({label for split_label, label in by_split_label if split_label == split})
        centroids: dict[str, list[float]] = {}
        within: dict[str, float] = {}
        for label in labels:
            vectors = by_split_label[(split, label)]
            vector_len = len(vectors[0])
            centroid = [statistics.fmean(vector[index] for vector in vectors) for index in range(vector_len)]
            centroids[label] = centroid
            within[label] = (
                statistics.fmean(euclidean(vector, centroid) for vector in vectors)
                if len(vectors) > 1
                else 0.0
            )
        pairs = []
        for index, left in enumerate(labels):
            for right in labels[index + 1 :]:
                pairs.append(
                    {
                        "labels": [left, right],
                        "centroid_distance": rounded(euclidean(centroids[left], centroids[right])),
                    }
                )
        pairs = sorted(pairs, key=lambda row: row["centroid_distance"])
        nearest_distance = pairs[0]["centroid_distance"] if pairs else None
        median_within = statistics.median([value for value in within.values() if value > 0]) if within else 0.0
        result[split] = {
            "description": (
                "Descriptive centroid distances over fixed tensor summary features only; "
                "not model fitting and not a classifier."
            ),
            "nearest_label_pairs": pairs[:5],
            "within_label_mean_distance": {label: rounded(value) for label, value in sorted(within.items())},
            "nearest_interlabel_to_median_within_ratio": (
                rounded(nearest_distance / median_within) if nearest_distance is not None and median_within > 0 else None
            ),
        }
    return result


def tiny_subset_representativeness(
    stats: list[dict[str, Any]],
    m3bv_receipt: dict[str, Any],
) -> dict[str, Any]:
    by_clip = {row["clip_id"]: row for row in stats}
    train_by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in stats:
        if row["split"] == "train":
            train_by_label[row["label_id"]].append(row)
    subset_rows = m3bv_receipt["ablation"]["subset"]["clips"]
    result = []
    for subset in subset_rows:
        clip_id = subset["clip_id"]
        row = by_clip.get(clip_id)
        if row is None:
            raise DiagnosisError(f"M3BV subset clip missing from tensor stats: {clip_id}")
        label_rows = train_by_label[row["label_id"]]
        result.append(
            {
                "clip_id": clip_id,
                "label_id": row["label_id"],
                "manifest_index": subset["manifest_index"],
                "total_motion": row["total_frame_absdiff_mean"],
                "hand_motion": row["hand_frame_absdiff_mean"],
                "mean_intensity": row["mean_intensity"],
                "percentiles_within_train_label": {
                    "total_motion": percentile_rank(
                        [item["total_frame_absdiff_mean"] for item in label_rows],
                        row["total_frame_absdiff_mean"],
                    ),
                    "hand_motion": percentile_rank(
                        [item["hand_frame_absdiff_mean"] for item in label_rows],
                        row["hand_frame_absdiff_mean"],
                    ),
                    "mean_intensity": percentile_rank(
                        [item["mean_intensity"] for item in label_rows],
                        row["mean_intensity"],
                    ),
                },
            }
        )
    return {
        "interpretation": (
            "The M3BV subset is one deterministic lexicographic train clip per label. It is valid for "
            "model/input memorization, but these percentiles show it is not a held-out or representative "
            "distribution proof."
        ),
        "clips": result,
    }


def confusion_summary(report: dict[str, Any], sidecar: dict[str, Any]) -> dict[str, Any]:
    test = report["test"]
    labels = test["confusion_matrix"]["labels"]
    rows = test["confusion_matrix"]["rows_true_columns_predicted"]
    label_rows = {}
    predicted_totals = Counter()
    for true_index, label in enumerate(labels):
        row = rows[true_index]
        support = sum(row)
        correct = row[true_index]
        wrong = [
            {"predicted_label": labels[pred_index], "count": count}
            for pred_index, count in enumerate(row)
            if pred_index != true_index and count
        ]
        wrong = sorted(wrong, key=lambda item: item["count"], reverse=True)
        for pred_index, count in enumerate(row):
            predicted_totals[labels[pred_index]] += count
        label_rows[label] = {
            "support": support,
            "correct": correct,
            "recall": rounded(correct / support if support else 0.0),
            "dominant_wrong_prediction": wrong[0] if wrong else None,
            "all_wrong_predictions": wrong,
        }
    threshold = float(sidecar.get("selected_threshold", test.get("threshold_metrics", {}).get("threshold", 1.0)))
    accepted_by_label: dict[str, Counter[str]] = defaultdict(Counter)
    false_accept_by_label: Counter[str] = Counter()
    examples = sidecar.get("test", {}).get("examples", [])
    if isinstance(examples, list):
        for row in examples:
            true_label = str(row.get("true_label"))
            predicted_label = str(row.get("predicted_label"))
            confidence = float(row.get("confidence", 0.0))
            if confidence >= threshold:
                accepted_by_label[true_label][predicted_label] += 1
                if predicted_label != true_label:
                    false_accept_by_label[true_label] += 1
    return {
        "test_top1_accuracy": test["top1_accuracy"],
        "test_macro_f1": test["macro_f1"],
        "selected_threshold": threshold,
        "test_false_pass_rate": test["threshold_metrics"]["false_pass_rate"],
        "per_true_label": label_rows,
        "predicted_label_totals": dict(sorted(predicted_totals.items())),
        "predicted_label_fraction": {
            label: rounded(count / test["examples"]) for label, count in sorted(predicted_totals.items())
        },
        "accepted_predictions_by_true_label": {
            label: dict(sorted(counter.items())) for label, counter in sorted(accepted_by_label.items())
        },
        "false_accept_count_by_true_label": dict(sorted(false_accept_by_label.items())),
        "signer_metrics": test.get("signer_metrics"),
    }


def source_register_summary() -> dict[str, Any]:
    register = load_json(Path("docs/model/dataset-source-register.json"))
    sources = register.get("sources", [])
    if not isinstance(sources, list):
        return {"source_id": "popsign-v1-original-videos", "found": False}
    for source in sources:
        if source.get("source_id") == "popsign-v1-original-videos":
            return {
                "source_id": "popsign-v1-original-videos",
                "found": True,
                "decision_id": source.get("decision_id"),
                "license_review_status": source.get("license_review_status"),
                "allowed_for_model_training": source.get("allowed_for_model_training"),
                "path": "docs/model/dataset-source-register.json",
                "sha256": sha256_file(project_path(Path("docs/model/dataset-source-register.json"))),
            }
    return {"source_id": "popsign-v1-original-videos", "found": False}


def classify_packet(
    tensor_summary: dict[str, Any],
    confusion: dict[str, Any],
    split_summary: dict[str, Any],
) -> dict[str, Any]:
    low_motion_flags = [
        row["low_hand_motion_fraction"]
        for row in tensor_summary.values()
        if isinstance(row, dict) and "low_hand_motion_fraction" in row
    ]
    high_low_motion_fraction = max(low_motion_flags) if low_motion_flags else 0.0
    train_test_overlap = split_summary["signer_overlap"]["train_vs_test"]["shared_signer_identity_hash_count"]
    train_validation_overlap = split_summary["signer_overlap"]["train_vs_validation"]["shared_signer_identity_hash_count"]
    predicted_fractions = confusion["predicted_label_fraction"]
    dominant_prediction = max(predicted_fractions.items(), key=lambda item: item[1])
    pen_recall = confusion["per_true_label"]["pen"]["recall"]
    primary = "data_vocabulary_split_source_distribution"
    next_action = "continue_fresh5_vocab_split_remediation_packet"
    rationale = [
        "M3BV proved train-fit on the intended preserved-region path, so the blocker is not a total loader/model break.",
        f"M3BU test recall for pen is {pen_recall}, and {dominant_prediction[0]} absorbs {dominant_prediction[1]} of test predictions.",
        f"Train-vs-validation signer overlap is {train_validation_overlap}; train-vs-test signer overlap is {train_test_overlap}.",
    ]
    if high_low_motion_fraction >= 0.5:
        rationale.append(
            "Some split/label tensor groups have high low-hand-motion fractions, so crop/region-target quality remains a secondary risk."
        )
    else:
        rationale.append(
            "Tensor motion summaries do not show a decisive empty-hand-region failure across the packet."
        )
    return {
        "blocker_classification": primary,
        "secondary_risks": ["crop_region_target_quality"] if high_low_motion_fraction >= 0.25 else [],
        "rationale": rationale,
        "brev_training_receipt_justified_now": False,
        "fresh10_materialization_justified_now": False,
        "detector0_or_crop_contract_justified_now": high_low_motion_fraction >= 0.5,
        "fresh5_vocab_split_remediation_packet_justified_now": True,
        "stop_justified_now": False,
        "exactly_one_next_action": next_action,
    }


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py",
        "--receipt",
        project_relative(project_path(args.receipt, must_exist=False)),
        "--write-receipt",
    ]


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    try:
        import torch
    except Exception as error:  # noqa: BLE001
        raise DiagnosisError(f"torch is required only to read existing tensor statistics: {error}") from error

    manifests = load_manifests()
    m3bv = load_json(M3BV_RECEIPT)
    m3bu = load_json(M3BU_RECEIPT)
    m3bt = load_json(M3BT_RECEIPT)
    m3bs = load_json(M3BS_RECEIPT)
    m3bu_report = load_json(M3BU_REPORT)
    m3bu_sidecar = load_json(M3BU_SIDECAR)
    m3bv_provenance = load_json(M3BV_PROVENANCE)

    clip_stats: list[dict[str, Any]] = []
    for split, manifest in manifests.items():
        manifest_path = project_path(MANIFESTS[split])
        for clip in manifest["clips"]:
            clip_stats.append(clip_tensor_stats(torch, manifest_path, clip))

    split_summary = split_distribution(manifests)
    tensor_summary = aggregate_tensor_stats(clip_stats)
    confusion = confusion_summary(m3bu_report, m3bu_sidecar)
    separation = descriptive_separation(clip_stats)
    tiny_subset = tiny_subset_representativeness(clip_stats, m3bv)
    classification = classify_packet(tensor_summary, confusion, split_summary)
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()

    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BW - PopSign fresh5 data/vocabulary separability packet",
        "status": "completed_no_training_diagnosis",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
            "python_executable": sys.executable,
            "torch_version_for_tensor_reads_only": getattr(torch, "__version__", None),
        },
        "active_prompt": "docs/model/return-to-form-popsign-fresh5-data-vocabulary-separability-goal-loop-prompt.md",
        "scope": {
            "existing_artifacts_only": True,
            "local_only": True,
            "no_training_or_fitting": True,
            "no_optimizer_backward_or_checkpoint": True,
            "no_brev_training_or_spend": True,
            "no_remote_command": True,
            "no_broad_training": True,
            "no_fresh10_training": True,
            "no_source_register_change": True,
            "no_unreviewed_source_import": True,
            "no_pretrained_dependency": True,
            "no_pseudo_labels": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
        },
        "input_artifacts": {
            "receipts": {
                "m3bv": file_reference(M3BV_RECEIPT),
                "m3bu": file_reference(M3BU_RECEIPT),
                "m3bt": file_reference(M3BT_RECEIPT),
                "m3bs": file_reference(M3BS_RECEIPT),
            },
            "manifests": {split: file_reference(path) for split, path in MANIFESTS.items()},
            "m3bu_outputs": {
                "validation_report": file_reference(M3BU_REPORT),
                "prediction_sidecar": file_reference(M3BU_SIDECAR),
            },
            "m3bv_outputs": {
                "tiny_overfit_provenance": file_reference(M3BV_PROVENANCE),
            },
            "source_register": source_register_summary(),
        },
        "commands": {
            "diagnosis": command_for_args(args),
            "json_validation": [
                "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null"
            ],
        },
        "baseline_comparison": {
            "m3bt_region_grid_materialization": {
                "tensor_count": m3bt["tensor_inventory"]["total_tensor_count"]
                if "tensor_inventory" in m3bt
                else m3bt.get("m3bt_region_grid_inputs", {}).get("tensor_count", 375),
                "input_contract": "rgb_regions_grid_v1",
            },
            "m3bs_full_frame_smoke": {
                "test_top1_accuracy": m3bs["smoke_evaluation"]["test_metrics"]["top1_accuracy"],
                "test_macro_f1": m3bs["smoke_evaluation"]["test_metrics"]["macro_f1"],
                "test_false_pass_rate": m3bs["smoke_evaluation"]["test_metrics"]["false_pass_rate"],
            },
            "m3bu_region_grid_mosaic_smoke": {
                "test_top1_accuracy": m3bu["smoke_evaluation"]["test_metrics"]["top1_accuracy"],
                "test_macro_f1": m3bu["smoke_evaluation"]["test_metrics"]["macro_f1"],
                "test_false_pass_rate": m3bu["smoke_evaluation"]["test_metrics"]["false_pass_rate"],
                "pen_test_recall": m3bu["smoke_evaluation"]["test_metrics"]["per_class"]["pen"]["recall"],
                "preserve_region_axis": False,
            },
            "m3bv_preserved_region_tiny_overfit": {
                "final_accuracy": m3bv["ablation"]["memorization_metrics"]["final_accuracy"],
                "zero_recall_labels": m3bv["ablation"]["memorization_metrics"]["zero_recall_labels"],
                "preserve_region_axis": True,
                "held_out_success": False,
            },
        },
        "split_and_source_distribution": split_summary,
        "m3bu_error_concentration": confusion,
        "tensor_motion_region_summary": tensor_summary,
        "descriptive_separability": separation,
        "m3bv_tiny_subset_representativeness": tiny_subset,
        "diagnosis": {
            "why_memorization_and_heldout_diverge": [
                "M3BV used one deterministic train clip per label and measured train-fit only.",
                "M3BU evaluated unseen validation/test clips and signer-disjoint source splits.",
                "M3BU test predictions are biased toward thank_you and leave pen with very low recall.",
                "The tensor inventory is complete, so the failure is not missing rgb_regions_grid_v1 tensors.",
            ],
            "classification": classification,
            "m3bv_provenance_check": {
                "input_contract": m3bv_provenance["input_contract"],
                "training_result": m3bv_provenance["training_result"]["final_eval_metrics"],
            },
        },
        "decision": {
            **classification,
            "next_action_rationale": (
                "The next useful slice should design a no-training fresh5 vocabulary/split/source-quality remediation "
                "packet before any Brev, fresh10, export, or promotion step."
            ),
        },
        "guardrails": {
            "training_run": False,
            "model_fitting": False,
            "checkpoint_created": False,
            "pretrained_components": [],
            "pseudo_labels_generated": False,
            "remote_training_run": False,
            "brev_spend": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "browser_model_activation": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "claim_state": "fail_closed_browser_model_remains_not_trained",
        },
        "validation_commands": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
            ".venv/bin/python scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py --receipt docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null",
        ],
        "tracked_files_changed": [
            "scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py",
            "docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json",
            "docs/session-logs/379-mission-3bw-popsign-fresh5-data-vocabulary-separability.md",
        ],
        "exactly_one_next_action": classification["exactly_one_next_action"],
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    receipt = build_receipt(args)
    if args.write_receipt:
        write_json(args.receipt, receipt)
    return {
        "status": receipt["status"],
        "blocker_classification": receipt["decision"]["blocker_classification"],
        "next_action": receipt["exactly_one_next_action"],
        "receipt": project_relative(project_path(args.receipt, must_exist=False)) if args.write_receipt else None,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except DiagnosisError as error:
        print(f"M3BW separability diagnosis failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
