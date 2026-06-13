#!/usr/bin/env python3
"""Extract PopSign fresh5 inference-only feature separability summaries."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import sys
from collections import Counter
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from evaluate_rawframe_model import load_checkpoint  # noqa: E402
from extract_popsign_fresh5_logit_distribution import (  # noqa: E402
    DEFAULT_CHECKPOINT,
    counter_dict,
    sha256_file,
    stats,
)
from train_rawframe_model import (  # noqa: E402
    POPSIGN_FRESH5_REPAIRED_TEST_MANIFEST_RELATIVE,
    POPSIGN_FRESH5_REPAIRED_TRAIN_MANIFEST_RELATIVE,
    POPSIGN_FRESH5_REPAIRED_VALIDATION_MANIFEST_RELATIVE,
    RawFrameClipDataset,
    build_model,
    checkpoint_architecture,
    import_torch,
    project_relative,
    select_device,
)


DEFAULT_OUTPUT = (
    PROJECT_ROOT
    / "output"
    / "m3cu-popsign-fresh5-train-split-feature-separability"
    / "feature-separability.json"
)

DIAGNOSTIC_FEATURE_KEYS = {
    "token_embedding_pre_interaction_flattened": "token_embedding_pre_interaction",
    "token_embedding_post_cross_region_flattened": "token_embedding_post_cross_region",
    "token_embedding_post_temporal_flattened": "token_embedding_post_temporal",
    "pre_pool_tokens_flattened": "pre_pool_tokens",
    "pooled_pre_head": "pooled_pre_head",
    "post_norm_head_input": "post_norm_head_input",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run bounded inference-only PopSign fresh5 feature separability extraction "
            "against an existing checkpoint. No optimizer, backward pass, auxiliary "
            "classifier fitting, or checkpoint write occurs."
        )
    )
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    parser.add_argument(
        "--train-manifest",
        type=Path,
        default=PROJECT_ROOT / POPSIGN_FRESH5_REPAIRED_TRAIN_MANIFEST_RELATIVE,
    )
    parser.add_argument(
        "--validation-manifest",
        type=Path,
        default=PROJECT_ROOT / POPSIGN_FRESH5_REPAIRED_VALIDATION_MANIFEST_RELATIVE,
    )
    parser.add_argument(
        "--test-manifest",
        type=Path,
        default=PROJECT_ROOT / POPSIGN_FRESH5_REPAIRED_TEST_MANIFEST_RELATIVE,
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--num-workers", type=int, default=0)
    return parser.parse_args()


def tensor_stats(torch: Any, values: Any) -> dict[str, float | None]:
    return stats([float(value) for value in values.detach().cpu().reshape(-1).tolist()])


def feature_matrix(values: Any) -> Any:
    matrix = values.detach().cpu()
    if int(matrix.ndim) > 2:
        matrix = matrix.flatten(start_dim=1)
    return matrix.float()


def centroid_distance_rows(labels: list[str], centroids: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for left_index, left_label in enumerate(labels):
        for right_label in labels[left_index + 1 :]:
            distance = float((centroids[left_label] - centroids[right_label]).norm(p=2).item())
            rows.append({"labels": [left_label, right_label], "l2_distance": distance})
    return rows


def nearest_centroid_diagnostic(
    torch: Any,
    features: Any,
    true_indexes: list[int],
    labels_by_index: list[str],
    leave_one_out: bool,
) -> dict[str, Any]:
    label_count = len(labels_by_index)
    index_tensor = torch.tensor(true_indexes, dtype=torch.long)
    sums = []
    counts = []
    for label_index in range(label_count):
        mask = index_tensor == label_index
        selected = features[mask]
        sums.append(selected.sum(dim=0))
        counts.append(int(selected.shape[0]))

    predictions: list[str] = []
    correct = 0
    confusion = [[0 for _ in labels_by_index] for _ in labels_by_index]
    for row_index in range(int(features.shape[0])):
        candidate_centroids = []
        true_index = true_indexes[row_index]
        for label_index in range(label_count):
            if leave_one_out and label_index == true_index:
                denominator = counts[label_index] - 1
                centroid = (sums[label_index] - features[row_index]) / max(denominator, 1)
            else:
                centroid = sums[label_index] / counts[label_index]
            candidate_centroids.append(centroid)
        centroid_tensor = torch.stack(candidate_centroids)
        distances = torch.norm(centroid_tensor - features[row_index].unsqueeze(0), p=2, dim=1)
        predicted_index = int(torch.argmin(distances).item())
        predictions.append(labels_by_index[predicted_index])
        confusion[true_index][predicted_index] += 1
        if predicted_index == true_index:
            correct += 1

    return {
        "method": "descriptive_nearest_centroid_no_training",
        "leave_one_out": leave_one_out,
        "accuracy": correct / len(true_indexes) if true_indexes else None,
        "prediction_distribution": counter_dict(predictions),
        "confusion_matrix": {
            "labels": labels_by_index,
            "rows_true_columns_predicted": confusion,
        },
    }


def summarize_feature_space(
    torch: Any,
    name: str,
    features: Any,
    true_indexes: list[int],
    labels_by_index: list[str],
    leave_one_out_nearest_centroid: bool,
) -> dict[str, Any]:
    if int(features.shape[0]) == 0:
        raise RuntimeError(f"{name} feature space has no examples")
    feature_dim = int(features.shape[1])
    feature_variance = features.var(dim=0, unbiased=False)
    centered = features - features.mean(dim=0, keepdim=True)
    centered_rank = int(torch.linalg.matrix_rank(centered).item())
    index_tensor = torch.tensor(true_indexes, dtype=torch.long)
    centroids: dict[str, Any] = {}
    per_label: dict[str, Any] = {}
    all_within_distances: list[float] = []

    for label_index, label in enumerate(labels_by_index):
        selected = features[index_tensor == label_index]
        centroid = selected.mean(dim=0)
        centroids[label] = centroid
        within_distances = torch.norm(selected - centroid.unsqueeze(0), p=2, dim=1)
        all_within_distances.extend(float(value) for value in within_distances.tolist())
        per_label[label] = {
            "examples": int(selected.shape[0]),
            "feature_norm": tensor_stats(torch, torch.norm(selected, p=2, dim=1)),
            "feature_dimension_variance": tensor_stats(torch, selected.var(dim=0, unbiased=False)),
            "centroid_norm": float(centroid.norm(p=2).item()),
            "distance_to_own_centroid": tensor_stats(torch, within_distances),
        }

    centroid_distances = centroid_distance_rows(labels_by_index, centroids)
    centroid_values = [row["l2_distance"] for row in centroid_distances]
    within_summary = stats(all_within_distances)
    between_summary = stats(centroid_values)
    between_mean = between_summary["mean"]
    within_mean = within_summary["mean"]
    return {
        "feature_space": name,
        "examples": int(features.shape[0]),
        "feature_dim": feature_dim,
        "feature_norm": tensor_stats(torch, torch.norm(features, p=2, dim=1)),
        "feature_dimension_variance": tensor_stats(torch, feature_variance),
        "rank_covariance_summary": {
            "centered_feature_rank": centered_rank,
            "max_centered_rank": min(int(features.shape[0]) - 1, feature_dim),
            "covariance_trace": float(feature_variance.sum().item()),
            "covariance_diagonal_summary": tensor_stats(torch, feature_variance),
            "covariance_matrix_materialized": False,
        },
        "per_true_label": per_label,
        "centroid_distances": centroid_distances,
        "between_centroid_distance": between_summary,
        "within_label_distance_to_centroid": within_summary,
        "between_to_within_mean_ratio": (
            float(between_mean) / float(within_mean)
            if between_mean is not None and within_mean not in {None, 0}
            else None
        ),
        "nearest_centroid_diagnostic": nearest_centroid_diagnostic(
            torch,
            features,
            true_indexes,
            labels_by_index,
            leave_one_out=leave_one_out_nearest_centroid,
        ),
    }


def summarize_logits(torch: Any, logits: Any, true_indexes: list[int], labels_by_index: list[str]) -> dict[str, Any]:
    probabilities = torch.softmax(logits, dim=1)
    top_values, top_indexes = torch.topk(probabilities, k=2, dim=1)
    predictions = [labels_by_index[int(index)] for index in top_indexes[:, 0].tolist()]
    top2 = [labels_by_index[int(index)] for index in top_indexes[:, 1].tolist()]
    correct = sum(1 for predicted, true_index in zip(predictions, true_indexes, strict=True) if predicted == labels_by_index[true_index])
    margins = top_values[:, 0] - top_values[:, 1]
    entropy = -(probabilities * torch.log(probabilities.clamp_min(1e-12))).sum(dim=1)
    logit_span = logits.max(dim=1).values - logits.min(dim=1).values
    class_means = {
        label: float(logits[:, index].mean().item())
        for index, label in enumerate(labels_by_index)
    }
    logit_order = [
        label
        for label, _value in sorted(class_means.items(), key=lambda item: (-item[1], item[0]))
    ]
    return {
        "accuracy": correct / len(true_indexes) if true_indexes else None,
        "top1_distribution": counter_dict(predictions),
        "top2_distribution": counter_dict(top2),
        "confidence": tensor_stats(torch, top_values[:, 0]),
        "probability_margin": tensor_stats(torch, margins),
        "entropy": tensor_stats(torch, entropy),
        "logit_span": tensor_stats(torch, logit_span),
        "aggregate_logit_order_desc": logit_order,
        "logit_mean_by_class": class_means,
    }


def extract_split(
    torch: Any,
    model: Any,
    manifest_path: Path,
    split: str,
    label_to_index: dict[str, int],
    frame_count: int,
    image_size: int,
    batch_size: int,
    num_workers: int,
    device: Any,
    capture: dict[str, list[Any]],
    labels_by_index: list[str],
    diagnostic_feature_keys: dict[str, str],
) -> dict[str, Any]:
    dataset = RawFrameClipDataset(
        torch,
        manifest_path,
        split,
        label_to_index,
        frame_count,
        image_size,
        require_decode_provenance=False,
        preserve_region_axis=True,
    )
    loader = torch.utils.data.DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
    )
    feature_batches: dict[str, list[Any]] = {}
    all_logits = []
    true_indexes: list[int] = []
    model.eval()
    with torch.no_grad():
        for frames, targets in loader:
            batch = frames.to(device)
            if diagnostic_feature_keys:
                logits, diagnostics = model.forward_with_diagnostics(batch)
                for feature_space, diagnostic_key in diagnostic_feature_keys.items():
                    if diagnostic_key in diagnostics:
                        feature_batches.setdefault(feature_space, []).append(feature_matrix(diagnostics[diagnostic_key]))
            else:
                capture["head_input"].clear()
                capture["linear_input"].clear()
                logits = model(batch)
                if not capture["head_input"] or not capture["linear_input"]:
                    raise RuntimeError("feature hook did not capture head input and linear input")
                feature_batches.setdefault("head_input_fused_pre_layernorm", []).append(capture["head_input"][-1])
                feature_batches.setdefault("linear_input_post_layernorm", []).append(capture["linear_input"][-1])
            all_logits.append(logits.detach().cpu())
            true_indexes.extend(int(value) for value in targets.detach().cpu().tolist())

    logits = torch.cat(all_logits, dim=0).to(dtype=torch.float32)
    leave_one_out = split == "train"
    features = {
        feature_space: summarize_feature_space(
            torch,
            feature_space,
            torch.cat(batches, dim=0).to(dtype=torch.float32),
            true_indexes,
            labels_by_index,
            leave_one_out_nearest_centroid=leave_one_out,
        )
        for feature_space, batches in feature_batches.items()
    }
    if not features:
        raise RuntimeError("feature extraction did not capture any feature spaces")
    return {
        "manifest": project_relative(manifest_path),
        "split": split,
        "examples": int(logits.shape[0]),
        "logits": summarize_logits(torch, logits, true_indexes, labels_by_index),
        "features": features,
    }


def main() -> int:
    args = parse_args()
    torch = import_torch()
    checkpoint_path = args.checkpoint.resolve()
    checkpoint = load_checkpoint(torch, checkpoint_path)
    label_to_index = {str(label): int(index) for label, index in checkpoint["label_to_index"].items()}
    labels_by_index = [label for label, _index in sorted(label_to_index.items(), key=lambda item: item[1])]
    frame_count = int(checkpoint["frame_count"])
    image_size = int(checkpoint["image_size"])
    architecture = checkpoint_architecture(checkpoint)
    device = select_device(torch)
    model = build_model(torch, len(label_to_index), architecture)
    model.load_state_dict(checkpoint["model_state"])
    model = model.to(device)

    capture: dict[str, list[Any]] = {"head_input": [], "linear_input": []}
    diagnostic_feature_keys: dict[str, str] = {}
    handle = None
    if hasattr(model, "forward_with_diagnostics"):
        diagnostic_feature_keys = DIAGNOSTIC_FEATURE_KEYS
    else:

        def layernorm_hook(_module: Any, inputs: tuple[Any, ...], output: Any) -> None:
            capture["head_input"].append(inputs[0].detach().cpu())
            capture["linear_input"].append(output.detach().cpu())

        handle = model.head[0].register_forward_hook(layernorm_hook)
    try:
        split_args = {
            "torch": torch,
            "model": model,
            "label_to_index": label_to_index,
            "frame_count": frame_count,
            "image_size": image_size,
            "batch_size": args.batch_size,
            "num_workers": args.num_workers,
            "device": device,
            "capture": capture,
            "labels_by_index": labels_by_index,
            "diagnostic_feature_keys": diagnostic_feature_keys,
        }
        splits = {
            "train": extract_split(manifest_path=args.train_manifest.resolve(), split="train", **split_args),
            "validation": extract_split(
                manifest_path=args.validation_manifest.resolve(),
                split="validation",
                **split_args,
            ),
            "test": extract_split(manifest_path=args.test_manifest.resolve(), split="test", **split_args),
        }
    finally:
        if handle is not None:
            handle.remove()

    primary_feature_space = (
        "linear_input_post_layernorm"
        if "linear_input_post_layernorm" in splits["train"]["features"]
        else "post_norm_head_input"
    )
    train_primary = splits["train"]["features"][primary_feature_space]
    train_between = train_primary["between_centroid_distance"]["mean"]
    train_within = train_primary["within_label_distance_to_centroid"]["mean"]
    train_ratio = train_primary["between_to_within_mean_ratio"]
    nearest_accuracy = train_primary["nearest_centroid_diagnostic"]["accuracy"]
    train_variance_mean = train_primary["feature_dimension_variance"]["mean"]
    train_features_nonseparable = (
        nearest_accuracy is not None
        and nearest_accuracy <= 0.3
        and train_ratio is not None
        and train_ratio < 1.0
    )
    train_features_nearly_constant = (
        train_features_nonseparable
        and train_variance_mean is not None
        and train_variance_mean < 1e-6
    )
    output = {
        "schema_version": "asl-pilot-popsign-fresh5-feature-separability-extraction/v1",
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "finality": "diagnostic_inference_only_not_final_evidence",
        "guardrails": {
            "training": False,
            "fitting": False,
            "optimizer": False,
            "backward": False,
            "checkpoint_created": False,
            "optimized_auxiliary_classifier": False,
            "brev": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "export": False,
            "promotion": False,
        },
        "command": [sys.executable, *sys.argv],
        "artifacts": {
            "checkpoint": {
                "path": project_relative(checkpoint_path),
                "sha256": sha256_file(checkpoint_path),
            },
            "train_manifest": {
                "path": project_relative(args.train_manifest.resolve()),
                "sha256": sha256_file(args.train_manifest.resolve()),
            },
            "validation_manifest": {
                "path": project_relative(args.validation_manifest.resolve()),
                "sha256": sha256_file(args.validation_manifest.resolve()),
            },
            "test_manifest": {
                "path": project_relative(args.test_manifest.resolve()),
                "sha256": sha256_file(args.test_manifest.resolve()),
            },
        },
        "device": str(device),
        "architecture": architecture,
        "frame_count": frame_count,
        "image_size": image_size,
        "label_to_index": label_to_index,
        "labels_by_index": labels_by_index,
        "feature_capture": (
            {
                "token_embedding_pre_interaction_flattened": "flattened token_embedding_pre_interaction from forward_with_diagnostics",
                "token_embedding_post_cross_region_flattened": "flattened token_embedding_post_cross_region from forward_with_diagnostics",
                "token_embedding_post_temporal_flattened": "flattened token_embedding_post_temporal from forward_with_diagnostics",
                "pre_pool_tokens_flattened": "flattened pre_pool_tokens from forward_with_diagnostics",
                "pooled_pre_head": "pooled_pre_head from forward_with_diagnostics",
                "post_norm_head_input": "post_norm_head_input from forward_with_diagnostics and input to model.classifier",
            }
            if diagnostic_feature_keys
            else {
                "head_input_fused_pre_layernorm": "input to model.head[0] LayerNorm",
                "linear_input_post_layernorm": "output of model.head[0] LayerNorm and input to model.head[1] Linear",
            }
        ),
        "splits": splits,
        "train_split_separability_summary": {
            "primary_feature_space": primary_feature_space,
            "primary_feature_between_centroid_distance_mean": train_between,
            "primary_feature_within_label_distance_mean": train_within,
            "primary_feature_between_to_within_mean_ratio": train_ratio,
            "primary_feature_leave_one_out_nearest_centroid_accuracy": nearest_accuracy,
            "logit_top1_distribution": splits["train"]["logits"]["top1_distribution"],
            "logit_top2_distribution": splits["train"]["logits"]["top2_distribution"],
        },
        "interpretation": {
            "features_nearly_constant_across_train": train_features_nearly_constant,
            "features_show_descriptive_train_label_separability": (
                nearest_accuracy is not None
                and nearest_accuracy > 0.5
                and train_ratio is not None
                and train_ratio > 1.0
            ),
            "features_nonseparable_by_descriptive_centroid_diagnostic": train_features_nonseparable,
            "logits_remain_collapsed": splits["train"]["logits"]["top1_distribution"] == {"morning": 125},
            "strongest_explanation": (
                "train_split_features_nonseparable_or_collapsed_before_classifier_head"
                if train_features_nonseparable
                else "inconclusive_train_split_feature_separability"
            ),
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"output": project_relative(args.output.resolve()), "sha256": sha256_file(args.output.resolve())}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
