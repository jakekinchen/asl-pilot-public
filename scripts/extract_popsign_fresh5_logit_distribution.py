#!/usr/bin/env python3
"""Extract PopSign fresh5 inference-only logit/probability summaries."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from evaluate_rawframe_model import load_checkpoint  # noqa: E402
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


DEFAULT_CHECKPOINT = (
    PROJECT_ROOT
    / "output"
    / "m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval"
    / "model_state.pt"
)
DEFAULT_OUTPUT = (
    PROJECT_ROOT
    / "output"
    / "m3ct-popsign-fresh5-confidence-logit-distribution"
    / "logit-distribution.json"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run bounded inference-only PopSign fresh5 logit/probability extraction "
            "against an existing checkpoint. No optimizer, backward pass, or checkpoint write occurs."
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


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stats(values: list[float]) -> dict[str, float | None]:
    if not values:
        return {"min": None, "max": None, "mean": None, "std": None}
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return {
        "min": min(values),
        "max": max(values),
        "mean": mean,
        "std": math.sqrt(variance),
    }


def counter_dict(values: list[str]) -> dict[str, int]:
    return dict(sorted(Counter(values).items()))


def ordering_desc(values: dict[str, float]) -> list[dict[str, float | str | int]]:
    ordered = sorted(values.items(), key=lambda item: (-item[1], item[0]))
    return [
        {
            "rank": rank,
            "label": label,
            "mean": value,
        }
        for rank, (label, value) in enumerate(ordered, start=1)
    ]


def classwise_stats(rows: list[dict[str, Any]], labels_by_index: list[str], key: str) -> dict[str, dict[str, float | None]]:
    values: dict[str, list[float]] = {label: [] for label in labels_by_index}
    for row in rows:
        for label, value in zip(labels_by_index, row[key], strict=True):
            values[label].append(float(value))
    return {label: stats(label_values) for label, label_values in values.items()}


def classwise_means(rows: list[dict[str, Any]], labels_by_index: list[str], key: str) -> dict[str, float]:
    per_label = classwise_stats(rows, labels_by_index, key)
    return {label: float(summary["mean"]) for label, summary in per_label.items() if summary["mean"] is not None}


def summarize_rows(rows: list[dict[str, Any]], labels_by_index: list[str]) -> dict[str, Any]:
    correct = sum(1 for row in rows if row["correct"])
    probability_means = classwise_means(rows, labels_by_index, "probabilities")
    logit_means = classwise_means(rows, labels_by_index, "logits")
    return {
        "examples": len(rows),
        "accuracy": correct / len(rows) if rows else None,
        "top1_distribution": counter_dict([row["predicted_label"] for row in rows]),
        "top2_distribution": counter_dict([row["top2_label"] for row in rows if row["top2_label"] is not None]),
        "confidence": stats([row["confidence"] for row in rows]),
        "entropy": stats([row["entropy"] for row in rows]),
        "probability_margin": stats([row["probability_margin"] for row in rows]),
        "logit_span": stats([row["logit_span"] for row in rows]),
        "logit_mean": stats([row["logit_mean"] for row in rows]),
        "logit_std": stats([row["logit_std"] for row in rows]),
        "probability_by_class": classwise_stats(rows, labels_by_index, "probabilities"),
        "logit_by_class": classwise_stats(rows, labels_by_index, "logits"),
        "aggregate_probability_order_desc": ordering_desc(probability_means),
        "aggregate_logit_order_desc": ordering_desc(logit_means),
        "sample_examples": [
            {
                "clip_id": row["clip_id"],
                "true_label": row["true_label"],
                "predicted_label": row["predicted_label"],
                "top2_label": row["top2_label"],
                "confidence": row["confidence"],
                "probability_margin": row["probability_margin"],
                "entropy": row["entropy"],
                "logit_span": row["logit_span"],
                "probability_order_desc": row["probability_order_desc"],
                "logit_order_desc": row["logit_order_desc"],
            }
            for row in rows[:5]
        ],
    }


def summarize_by_true_label(rows: list[dict[str, Any]], labels_by_index: list[str]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[str(row["true_label"])].append(row)
    return {
        label: summarize_rows(grouped.get(label, []), labels_by_index)
        for label in labels_by_index
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
    labels_by_index = [label for label, _index in sorted(label_to_index.items(), key=lambda item: item[1])]
    rows: list[dict[str, Any]] = []
    example_index = 0
    model.eval()
    with torch.no_grad():
        for frames, targets in loader:
            frames = frames.to(device)
            logits = model(frames).detach().cpu()
            probabilities = torch.softmax(logits, dim=1)
            top_values, top_indexes = torch.topk(probabilities, k=2, dim=1)
            for row_index in range(int(targets.shape[0])):
                record = dataset.records[example_index]
                example_index += 1
                true_index = int(targets[row_index].item())
                predicted_index = int(top_indexes[row_index][0].item())
                top2_index = int(top_indexes[row_index][1].item())
                row_probabilities = [float(value) for value in probabilities[row_index].tolist()]
                row_logits = [float(value) for value in logits[row_index].tolist()]
                confidence = float(top_values[row_index][0].item())
                top2_confidence = float(top_values[row_index][1].item())
                probability_margin = confidence - top2_confidence
                entropy = float(
                    -(probabilities[row_index] * torch.log(probabilities[row_index].clamp_min(1e-12))).sum().item()
                )
                logit_mean = sum(row_logits) / len(row_logits)
                logit_std = math.sqrt(sum((value - logit_mean) ** 2 for value in row_logits) / len(row_logits))
                rows.append(
                    {
                        "clip_id": record["clip_id"],
                        "true_index": true_index,
                        "true_label": labels_by_index[true_index],
                        "predicted_index": predicted_index,
                        "predicted_label": labels_by_index[predicted_index],
                        "top2_index": top2_index,
                        "top2_label": labels_by_index[top2_index],
                        "confidence": confidence,
                        "top2_confidence": top2_confidence,
                        "probability_margin": probability_margin,
                        "entropy": entropy,
                        "logit_span": max(row_logits) - min(row_logits),
                        "logit_mean": logit_mean,
                        "logit_std": logit_std,
                        "probabilities": row_probabilities,
                        "logits": row_logits,
                        "probability_order_desc": [
                            labels_by_index[index]
                            for index in sorted(
                                range(len(row_probabilities)),
                                key=lambda index: (-row_probabilities[index], labels_by_index[index]),
                            )
                        ],
                        "logit_order_desc": [
                            labels_by_index[index]
                            for index in sorted(
                                range(len(row_logits)),
                                key=lambda index: (-row_logits[index], labels_by_index[index]),
                            )
                        ],
                        "correct": predicted_index == true_index,
                    }
                )
    return {
        "manifest": project_relative(manifest_path),
        "split": split,
        "summary": summarize_rows(rows, labels_by_index),
        "by_true_label": summarize_by_true_label(rows, labels_by_index),
    }


def readout_summary(model: Any, labels_by_index: list[str]) -> dict[str, Any]:
    head = getattr(model, "head", None)
    linear = head[-1] if head is not None and hasattr(head, "__getitem__") else None
    bias = getattr(linear, "bias", None)
    weight = getattr(linear, "weight", None)
    result: dict[str, Any] = {
        "head_module": str(linear.__class__.__name__) if linear is not None else None,
    }
    if bias is not None:
        bias_values = [float(value) for value in bias.detach().cpu().tolist()]
        bias_by_label = dict(zip(labels_by_index, bias_values, strict=True))
        result["bias_by_label"] = bias_by_label
        result["bias_order_desc"] = ordering_desc(bias_by_label)
        result["bias_span"] = max(bias_values) - min(bias_values)
    if weight is not None:
        norms = [float(row.norm(p=2).detach().cpu().item()) for row in weight]
        norm_by_label = dict(zip(labels_by_index, norms, strict=True))
        result["weight_l2_norm_by_label"] = norm_by_label
        result["weight_l2_norm_order_desc"] = ordering_desc(norm_by_label)
        result["weight_shape"] = list(weight.shape)
    return result


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

    split_args = {
        "torch": torch,
        "model": model,
        "label_to_index": label_to_index,
        "frame_count": frame_count,
        "image_size": image_size,
        "batch_size": args.batch_size,
        "num_workers": args.num_workers,
        "device": device,
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
    top1_distributions = {split: payload["summary"]["top1_distribution"] for split, payload in splits.items()}
    top2_distributions = {split: payload["summary"]["top2_distribution"] for split, payload in splits.items()}
    train_top1 = top1_distributions["train"]
    heldout_top1 = [top1_distributions["validation"], top1_distributions["test"]]
    train_collapses_to_same_top1 = (
        train_top1 == heldout_top1[0] == heldout_top1[1] and len(train_top1) == 1 and train_top1.get("morning") == 125
    )
    train_collapses_to_same_top2 = (
        top2_distributions["train"] == top2_distributions["validation"] == top2_distributions["test"]
        and len(top2_distributions["train"]) == 1
        and top2_distributions["train"].get("thank_you") == 125
    )
    output = {
        "schema_version": "asl-pilot-popsign-fresh5-logit-distribution-extraction/v1",
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "finality": "diagnostic_inference_only_not_final_evidence",
        "guardrails": {
            "training": False,
            "fitting": False,
            "optimizer": False,
            "backward": False,
            "checkpoint_created": False,
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
        "readout": readout_summary(model, labels_by_index),
        "splits": splits,
        "cross_split": {
            "top1_distributions": top1_distributions,
            "top2_distributions": top2_distributions,
            "train_collapses_to_same_morning_top1_as_validation_and_test": train_collapses_to_same_top1,
            "train_collapses_to_same_thank_you_top2_as_validation_and_test": train_collapses_to_same_top2,
            "collapse_is_heldout_specific": not train_collapses_to_same_top1,
        },
        "interpretation": {
            "current_strongest_explanation": (
                "stable_tiny_classwise_logit_offset"
                if train_collapses_to_same_top1 and train_collapses_to_same_top2
                else "inconclusive_or_split_specific"
            ),
            "threshold_calibration_downstream": True,
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"output": project_relative(args.output.resolve()), "sha256": sha256_file(args.output.resolve())}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
