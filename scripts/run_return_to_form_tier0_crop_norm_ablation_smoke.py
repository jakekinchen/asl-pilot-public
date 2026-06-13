#!/usr/bin/env python3
"""Run the M3AE-S local crop-normalization ablation smoke."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_detector0_training_smoke import (
    TARGET_IDS,
    build_model as build_detector_model,
    detector_loss,
    evaluate_split as evaluate_detector_split,
    load_packet_dataset,
    split_predictions,
)
from run_return_to_form_tier0_model_architecture_microprobe import (
    build_model as build_recognizer_model,
    confusion_and_metrics,
    feature_tensor as recognizer_feature_tensor,
    labels_for_manifest,
    load_regions,
)
from train_rawframe_model import (
    TrainingError,
    expected_tensor_hash_for_clip,
    import_torch,
    load_manifest,
    sha256_file,
    tensor_path_for_clip,
)


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-crop-normalization-ablation-smoke/v1"
DEFAULT_PACKET = ROOT / "data" / "annotations" / "detector0" / "return-to-form-tier0-localization-packet-v0.json"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-crop-normalization-ablation-smoke-v1.json"
DEFAULT_OUTPUT_DIR = ROOT / "output" / "return-to-form-tier0-crop-normalization-ablation-smoke"
DEFAULT_MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "m3ae_q_design": ROOT / "docs" / "validation" / "return-to-form-tier0-crop-normalization-ablation-design-v1.md",
    "m3ae_p_detector0_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-training-smoke-v1.json",
    "m3ae_l_bootstrap": ROOT / "docs" / "validation" / "return-to-form-tier0-detector0-crop-normalization-bootstrap.json",
    "detector0_packet": DEFAULT_PACKET,
    "m3ae_j_fixed_crop_smoke": ROOT / "docs" / "validation" / "return-to-form-tier0-microprobe-config-smoke.json",
    "m3ae_k_label_split_remediation": ROOT / "docs" / "validation" / "return-to-form-tier0-label-split-remediation.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
    "tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "train_manifest": DEFAULT_MANIFESTS["train"],
    "validation_manifest": DEFAULT_MANIFESTS["validation"],
    "test_manifest": DEFAULT_MANIFESTS["test"],
}
REGION_IDS = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
TARGET_TO_REGION = {
    "left_or_first_hand": "viewer_left_hand_context",
    "right_or_second_hand": "viewer_right_hand_context",
    "upper_body_or_signing_space": "upper_body_signing_space",
    "head_or_face": "head_context",
}
EXPANSION_BY_TARGET = {
    "left_or_first_hand": 0.18,
    "right_or_second_hand": 0.18,
    "head_or_face": 0.12,
    "upper_body_or_signing_space": 0.08,
}
ALLOWED_NEXT_ACTIONS = {
    "crop_normalization_ablation_smoke_continue",
    "detector0_data_or_target_remediation",
    "source_distribution_or_reduced_claim_triage",
    "crop_normalization_followup",
    "stop_reduced_claim",
}


class AblationSmokeError(RuntimeError):
    """Raised when the local ablation smoke cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--device", choices=("auto", "cpu", "mps"), default="auto")
    parser.add_argument("--detector-feature-spatial-size", type=int, default=32)
    parser.add_argument("--detector-hidden-dim", type=int, default=128)
    parser.add_argument("--detector-max-epochs", type=int, default=400)
    parser.add_argument("--detector-learning-rate", type=float, default=0.003)
    parser.add_argument("--detector-early-stop-loss", type=float, default=0.0125)
    parser.add_argument("--detector-seed", type=int, default=141421)
    parser.add_argument("--presence-threshold", type=float, default=0.5)
    parser.add_argument("--recognizer-feature-spatial-size", type=int, default=12)
    parser.add_argument("--recognizer-hidden-dim", type=int, default=512)
    parser.add_argument("--recognizer-max-epochs", type=int, default=600)
    parser.add_argument("--recognizer-learning-rate", type=float, default=0.003)
    parser.add_argument("--recognizer-early-stop-loss", type=float, default=0.02)
    parser.add_argument("--recognizer-seed", type=int, default=271828)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise AblationSmokeError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise AblationSmokeError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise AblationSmokeError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise AblationSmokeError(f"missing reference artifact: {project_relative(path)}")
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def split_paths(args: argparse.Namespace) -> dict[str, Path]:
    return {
        "train": args.train_manifest.resolve(),
        "validation": args.validation_manifest.resolve(),
        "test": args.test_manifest.resolve(),
    }


def choose_device(torch: Any, requested: str) -> Any:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "mps":
        if not torch.backends.mps.is_available():
            raise AblationSmokeError("requested MPS device is not available")
        return torch.device("mps")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def normalize_detector_splits(torch: Any, raw_dataset: dict[str, dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], Any, Any]:
    train_x = raw_dataset["train"]["x"]
    mean = train_x.mean(dim=0, keepdim=True)
    std = train_x.std(dim=0, keepdim=True, unbiased=False).clamp_min(1e-6)
    normalized = {}
    for split, values in raw_dataset.items():
        normalized[split] = dict(values)
        normalized[split]["x"] = (values["x"] - mean) / std
    return normalized, mean, std


def train_detector(
    torch: Any,
    args: argparse.Namespace,
    raw_dataset: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    dataset, mean, std = normalize_detector_splits(torch, raw_dataset)
    device = choose_device(torch, args.device)
    torch.manual_seed(args.detector_seed)
    model = build_detector_model(
        torch,
        input_dim=int(dataset["train"]["x"].shape[1]),
        hidden_dim=args.detector_hidden_dim,
        output_dim=len(TARGET_IDS) * 5,
    ).to(device)
    device_dataset = {
        split: {
            **values,
            "x": values["x"].to(device),
            "presence": values["presence"].to(device),
            "boxes": values["boxes"].to(device),
        }
        for split, values in dataset.items()
    }
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.detector_learning_rate, weight_decay=0.0)
    initial_metrics = evaluate_detector_split(torch, model, device_dataset["train"])
    history = [
        {
            "epoch": 0,
            "train_total_loss": initial_metrics["loss"]["total"],
            "train_presence_loss": initial_metrics["loss"]["presence"],
            "train_box_loss": initial_metrics["loss"]["box"],
            "train_presence_accuracy": initial_metrics["presence_accuracy"],
            "train_present_box_mae": initial_metrics["present_box_mae"],
        }
    ]
    best_train_loss = initial_metrics["loss"]["total"]
    epochs_ran = 0

    for epoch in range(1, args.detector_max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        output = model(device_dataset["train"]["x"])
        loss, _losses = detector_loss(
            torch,
            output,
            device_dataset["train"]["presence"],
            device_dataset["train"]["boxes"],
        )
        loss.backward()
        optimizer.step()
        epochs_ran = epoch

        train_metrics = evaluate_detector_split(torch, model, device_dataset["train"])
        best_train_loss = min(best_train_loss, train_metrics["loss"]["total"])
        if epoch <= 5 or epoch % 25 == 0 or train_metrics["presence_accuracy"] == 1.0:
            history.append(
                {
                    "epoch": epoch,
                    "train_total_loss": train_metrics["loss"]["total"],
                    "train_presence_loss": train_metrics["loss"]["presence"],
                    "train_box_loss": train_metrics["loss"]["box"],
                    "train_presence_accuracy": train_metrics["presence_accuracy"],
                    "train_present_box_mae": train_metrics["present_box_mae"],
                }
            )
        if (
            train_metrics["loss"]["total"] <= args.detector_early_stop_loss
            and train_metrics["presence_accuracy"] == 1.0
            and train_metrics["present_box_mae"] is not None
            and train_metrics["present_box_mae"] <= 0.035
        ):
            break

    metrics = {
        split: evaluate_detector_split(torch, model, values)
        for split, values in device_dataset.items()
    }
    initial_loss = initial_metrics["loss"]["total"]
    final_train_loss = metrics["train"]["loss"]["total"]
    loss_drop_fraction = (initial_loss - best_train_loss) / initial_loss if initial_loss else None
    return {
        "device": str(device),
        "model": model,
        "feature_mean": mean,
        "feature_std": std,
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": epochs_ran,
        "history": history,
        "metrics": metrics,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def detector_train_gate(detector_result: dict[str, Any], tensor_hashes_checked: int) -> dict[str, Any]:
    train_metrics = detector_result["metrics"]["train"]
    train_box_mae = train_metrics.get("present_box_mae")
    loss_drop = detector_result["loss_movement"].get("loss_drop_fraction_from_initial_to_best")
    passed = (
        train_metrics.get("presence_accuracy") == 1.0
        and train_box_mae is not None
        and float(train_box_mae) <= 0.15
        and loss_drop is not None
        and float(loss_drop) >= 0.75
        and tensor_hashes_checked == 15
    )
    return {
        "status": "passed" if passed else "failed",
        "criteria": {
            "train_presence_accuracy": 1.0,
            "train_present_box_mae_max": 0.15,
            "loss_drop_fraction_from_initial_to_best_min": 0.75,
            "tensor_hashes_checked": 15,
        },
        "actual": {
            "train_presence_accuracy": train_metrics.get("presence_accuracy"),
            "train_present_box_mae": train_box_mae,
            "loss_drop_fraction_from_initial_to_best": loss_drop,
            "tensor_hashes_checked": tensor_hashes_checked,
            "train_present_box_mean_iou": train_metrics.get("present_box_mean_iou"),
        },
    }


def full_frame_features(torch: Any, regions: Any, region_ids: list[str], spatial_size: int, context: str) -> Any:
    if "full_frame_reference" not in region_ids:
        raise AblationSmokeError(f"{context} missing full_frame_reference")
    full_index = region_ids.index("full_frame_reference")
    frames = regions[:, full_index].to(dtype=torch.float32).div(255.0)
    if frames.ndim != 4 or int(frames.shape[-1]) != 3:
        raise AblationSmokeError(f"{context} full_frame_reference must be T,H,W,C")
    image_batch = frames.permute(0, 3, 1, 2)
    resized = torch.nn.functional.interpolate(
        image_batch,
        size=(spatial_size, spatial_size),
        mode="bilinear",
        align_corners=False,
    )
    return resized.reshape(int(frames.shape[0]), -1)


def canonical_box(box: list[float]) -> list[float]:
    x1 = min(float(box[0]), float(box[2]))
    y1 = min(float(box[1]), float(box[3]))
    x2 = max(float(box[0]), float(box[2]))
    y2 = max(float(box[1]), float(box[3]))
    return [x1, y1, x2, y2]


def expand_box(box: list[float], margin: float) -> list[float]:
    x1, y1, x2, y2 = canonical_box(box)
    return [
        max(0.0, x1 - margin),
        max(0.0, y1 - margin),
        min(1.0, x2 + margin),
        min(1.0, y2 + margin),
    ]


def valid_box(box: list[float]) -> bool:
    x1, y1, x2, y2 = canonical_box(box)
    return 0.0 <= x1 < x2 <= 1.0 and 0.0 <= y1 < y2 <= 1.0 and (x2 - x1) >= 0.01 and (y2 - y1) >= 0.01


def crop_from_full_frame(torch: Any, full_frame: Any, box: list[float], output_size: int = 96) -> Any:
    height = int(full_frame.shape[0])
    width = int(full_frame.shape[1])
    x1, y1, x2, y2 = canonical_box(box)
    left = max(0, min(width - 1, int(x1 * width)))
    top = max(0, min(height - 1, int(y1 * height)))
    right = max(left + 1, min(width, int(x2 * width + 0.999999)))
    bottom = max(top + 1, min(height, int(y2 * height + 0.999999)))
    crop = full_frame[top:bottom, left:right].to(dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
    resized = torch.nn.functional.interpolate(
        crop,
        size=(output_size, output_size),
        mode="bilinear",
        align_corners=False,
    )
    return resized.squeeze(0).permute(1, 2, 0).round().clamp(0, 255).to(dtype=torch.uint8).contiguous()


def predict_detector_for_clip(
    torch: Any,
    detector_result: dict[str, Any],
    regions: Any,
    region_ids: list[str],
    spatial_size: int,
    context: str,
) -> tuple[Any, Any]:
    model = detector_result["model"]
    device = next(model.parameters()).device
    features = full_frame_features(torch, regions, region_ids, spatial_size, context)
    normalized = (features - detector_result["feature_mean"]) / detector_result["feature_std"]
    model.eval()
    with torch.no_grad():
        output = model(normalized.to(device))
        presence_logits, box_predictions = split_predictions(torch, output)
    return torch.sigmoid(presence_logits).detach().cpu(), box_predictions.detach().cpu()


def transform_regions(
    torch: Any,
    detector_result: dict[str, Any],
    regions: Any,
    region_ids: list[str],
    args: argparse.Namespace,
    split: str,
    label_id: str,
    clip_id: str,
) -> tuple[Any, dict[str, Any]]:
    if region_ids != REGION_IDS:
        raise AblationSmokeError(f"{clip_id} region order mismatch: {region_ids}")
    presence_prob, boxes = predict_detector_for_clip(
        torch,
        detector_result,
        regions,
        region_ids,
        args.detector_feature_spatial_size,
        clip_id,
    )
    output = torch.empty_like(regions)
    output[:, REGION_IDS.index("full_frame_reference")] = regions[:, REGION_IDS.index("full_frame_reference")]
    fallback_counts = Counter()
    used_counts = Counter()
    low_confidence_examples = []
    invalid_box_examples = []
    frame_count = int(regions.shape[0])

    for frame_index in range(frame_count):
        full_frame = regions[frame_index, REGION_IDS.index("full_frame_reference")]
        for target_index, target_id in enumerate(TARGET_IDS):
            region_id = TARGET_TO_REGION[target_id]
            region_index = REGION_IDS.index(region_id)
            probability = float(presence_prob[frame_index, target_index].item())
            raw_box = [float(value) for value in boxes[frame_index, target_index].tolist()]
            expanded = expand_box(raw_box, EXPANSION_BY_TARGET[target_id])
            if probability < args.presence_threshold:
                output[frame_index, region_index] = regions[frame_index, region_index]
                fallback_counts[(target_id, "below_presence_threshold")] += 1
                if len(low_confidence_examples) < 8:
                    low_confidence_examples.append(
                        {
                            "frame_index": frame_index,
                            "target_id": target_id,
                            "presence_probability": probability,
                        }
                    )
                continue
            if not valid_box(expanded):
                output[frame_index, region_index] = regions[frame_index, region_index]
                fallback_counts[(target_id, "invalid_or_degenerate_box")] += 1
                if len(invalid_box_examples) < 8:
                    invalid_box_examples.append(
                        {
                            "frame_index": frame_index,
                            "target_id": target_id,
                            "presence_probability": probability,
                            "predicted_box_xyxy_norm": raw_box,
                            "expanded_box_xyxy_norm": expanded,
                        }
                    )
                continue
            output[frame_index, region_index] = crop_from_full_frame(torch, full_frame, expanded)
            used_counts[target_id] += 1

    target_denominator = frame_count
    fallback_by_target = {
        target_id: sum(count for (current_target, _reason), count in fallback_counts.items() if current_target == target_id)
        for target_id in TARGET_IDS
    }
    return output.contiguous(), {
        "split": split,
        "label_id": label_id,
        "clip_id": clip_id,
        "frame_count": frame_count,
        "target_decision_count": frame_count * len(TARGET_IDS),
        "presence_threshold": args.presence_threshold,
        "used_detector_crop_counts_by_target": {target_id: int(used_counts[target_id]) for target_id in TARGET_IDS},
        "fallback_counts_by_target": {target_id: int(fallback_by_target[target_id]) for target_id in TARGET_IDS},
        "fallback_rates_by_target": {
            target_id: fallback_by_target[target_id] / target_denominator for target_id in TARGET_IDS
        },
        "fallback_counts_by_target_and_reason": [
            {
                "target_id": target_id,
                "reason": reason,
                "count": int(count),
            }
            for (target_id, reason), count in sorted(fallback_counts.items())
        ],
        "low_confidence_examples": low_confidence_examples,
        "invalid_box_examples": invalid_box_examples,
    }


def sorted_manifest_clips(manifest: dict[str, Any], manifest_path: Path) -> list[dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise AblationSmokeError(f"{project_relative(manifest_path)} clips must be an array")
    return sorted(
        [clip for clip in clips if isinstance(clip, dict)],
        key=lambda clip: (str(clip.get("label_id", "")), str(clip.get("clip_id", ""))),
    )


def transform_splits(
    torch: Any,
    args: argparse.Namespace,
    detector_result: dict[str, Any],
    labels: list[str],
    label_to_index: dict[str, int],
) -> tuple[dict[str, tuple[Any, Any, dict[str, Any]]], dict[str, Any]]:
    manifests = split_paths(args)
    raw_splits = {}
    transform_records_by_split = {}
    fallback_totals = Counter()
    fallback_by_split = defaultdict(Counter)
    fallback_by_label = defaultdict(Counter)
    fallback_by_reason = Counter()
    shape_mismatches = []
    source_ids = set()
    generated_tensor_count = 0
    generated_bytes = 0

    for split, manifest_path in manifests.items():
        manifest = load_manifest(manifest_path)
        manifest_labels = labels_for_manifest(manifest)
        if manifest_labels != labels:
            raise AblationSmokeError(
                f"{project_relative(manifest_path)} label order mismatch; expected {labels}, got {manifest_labels}"
            )
        features = []
        targets = []
        records = []
        counts = Counter()
        region_orders = set()
        input_shapes = set()
        output_shapes = set()
        output_dir = args.output_dir.resolve() / split
        output_dir.mkdir(parents=True, exist_ok=True)

        for index, clip in enumerate(sorted_manifest_clips(manifest, manifest_path)):
            context = f"{project_relative(manifest_path)}: clips[{index}] {clip.get('clip_id')}"
            label_id = str(clip.get("label_id"))
            if label_id not in label_to_index:
                raise AblationSmokeError(f"{context} label is not selected for Tier 0: {label_id}")
            source_id = str(clip.get("source_id"))
            if source_id != "popsign-v1-original-videos":
                raise AblationSmokeError(f"{context} uses unexpected source_id={source_id}")
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            expected_hash = expected_tensor_hash_for_clip(clip, context)
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise AblationSmokeError(
                    f"{context} decoded tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
                )
            regions, region_ids = load_regions(torch, tensor_path, context)
            normalized_regions, transform_evidence = transform_regions(
                torch,
                detector_result,
                regions,
                region_ids,
                args,
                split,
                label_id,
                str(clip.get("clip_id")),
            )
            if tuple(int(value) for value in normalized_regions.shape) != tuple(int(value) for value in regions.shape):
                shape_mismatches.append(str(clip.get("clip_id")))
            output_path = output_dir / f"{clip.get('clip_id')}-detector-normalized.pt"
            output_payload = {
                "schema_version": "asl-pilot-return-to-form-tier0-detector-normalized-tensor/v1",
                "source_clip_id": str(clip.get("clip_id")),
                "source_label_id": label_id,
                "source_split": split,
                "source_tensor_path": project_relative(tensor_path),
                "source_tensor_sha256": actual_hash,
                "region_ids": REGION_IDS,
                "rgb_regions": normalized_regions,
                "transform_evidence": transform_evidence,
            }
            torch.save(output_payload, output_path)
            output_hash = sha256_file(output_path)
            output_size = output_path.stat().st_size
            generated_tensor_count += 1
            generated_bytes += output_size
            transformed_feature = recognizer_feature_tensor(
                torch,
                normalized_regions,
                args.recognizer_feature_spatial_size,
            )
            features.append(transformed_feature.flatten())
            targets.append(label_to_index[label_id])
            counts[label_id] += 1
            source_ids.add(source_id)
            region_orders.add(tuple(region_ids))
            input_shapes.add(tuple(int(value) for value in regions.shape))
            output_shapes.add(tuple(int(value) for value in normalized_regions.shape))
            for item in transform_evidence["fallback_counts_by_target_and_reason"]:
                key = (item["target_id"], item["reason"])
                count = int(item["count"])
                fallback_totals[key] += count
                fallback_by_split[split][key] += count
                fallback_by_label[label_id][key] += count
                fallback_by_reason[item["reason"]] += count
            records.append(
                {
                    "clip_id": str(clip.get("clip_id")),
                    "label_id": label_id,
                    "source_id": source_id,
                    "source_record_id": str(clip.get("source_record_id")),
                    "signer_identity_hash": str(clip.get("signer_identity_hash")),
                    "input_tensor_path": project_relative(tensor_path),
                    "input_tensor_sha256": actual_hash,
                    "output_tensor_path": project_relative(output_path),
                    "output_tensor_sha256": output_hash,
                    "output_tensor_bytes": output_size,
                    "rgb_regions_input_shape": [int(value) for value in regions.shape],
                    "detector_normalized_output_shape": [int(value) for value in normalized_regions.shape],
                    "region_order": REGION_IDS,
                    "fallback_counts_by_target": transform_evidence["fallback_counts_by_target"],
                    "fallback_rates_by_target": transform_evidence["fallback_rates_by_target"],
                }
            )

        if not features:
            raise AblationSmokeError(f"{project_relative(manifest_path)} has no usable clips")
        raw_splits[split] = (
            torch.stack(features, dim=0),
            torch.tensor(targets, dtype=torch.long),
            {
                "manifest": file_ref(manifest_path),
                "example_count": len(features),
                "per_label_counts": dict(sorted(counts.items())),
                "source_ids": sorted(source_ids),
                "region_orders": [list(items) for items in sorted(region_orders)],
                "original_rgb_regions_shapes": [list(items) for items in sorted(input_shapes)],
                "detector_normalized_rgb_regions_shapes": [list(items) for items in sorted(output_shapes)],
            },
        )
        transform_records_by_split[split] = records

    total_target_decisions = generated_tensor_count * 16 * len(TARGET_IDS)
    fallback_count_total = sum(fallback_totals.values())
    fallback_by_target = {
        target_id: sum(count for (current_target, _reason), count in fallback_totals.items() if current_target == target_id)
        for target_id in TARGET_IDS
    }
    target_decision_denominator = generated_tensor_count * 16
    transform_summary = {
        "output_dir": project_relative(args.output_dir),
        "generated_tensor_count": generated_tensor_count,
        "generated_tensor_bytes": generated_bytes,
        "records_by_split": transform_records_by_split,
        "shape_mismatches": shape_mismatches,
        "source_ids": sorted(source_ids),
        "fallback_counts_by_target_and_reason": [
            {"target_id": target_id, "reason": reason, "count": int(count)}
            for (target_id, reason), count in sorted(fallback_totals.items())
        ],
        "fallback_counts_by_split": format_nested_counter(fallback_by_split),
        "fallback_counts_by_label": format_nested_counter(fallback_by_label),
        "fallback_counts_by_reason": dict(sorted((reason, int(count)) for reason, count in fallback_by_reason.items())),
        "fallback_count_total": int(fallback_count_total),
        "fallback_rate_overall": fallback_count_total / total_target_decisions if total_target_decisions else None,
        "fallback_counts_by_target": {target_id: int(count) for target_id, count in fallback_by_target.items()},
        "fallback_rates_by_target": {
            target_id: fallback_by_target[target_id] / target_decision_denominator
            if target_decision_denominator
            else None
            for target_id in TARGET_IDS
        },
    }
    return raw_splits, transform_summary


def format_nested_counter(value: dict[str, Counter[tuple[str, str]]]) -> dict[str, list[dict[str, Any]]]:
    return {
        outer_key: [
            {"target_id": target_id, "reason": reason, "count": int(count)}
            for (target_id, reason), count in sorted(counter.items())
        ]
        for outer_key, counter in sorted(value.items())
    }


def normalize_recognizer_splits(torch: Any, raw_splits: dict[str, tuple[Any, Any, dict[str, Any]]]) -> dict[str, tuple[Any, Any, dict[str, Any]]]:
    train_x = raw_splits["train"][0]
    mean = train_x.mean(dim=0, keepdim=True)
    std = train_x.std(dim=0, keepdim=True).clamp_min(1e-6)
    normalized = {}
    for split, (x, y, evidence) in raw_splits.items():
        updated = dict(evidence)
        updated["normalization"] = "per-feature z-score fitted on detector-normalized train split"
        normalized[split] = ((x - mean) / std, y, updated)
    return normalized


def evaluate_recognizer_split(torch: Any, model: Any, criterion: Any, x: Any, y: Any, labels: list[str]) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        logits = model(x)
        loss = float(criterion(logits, y).detach().cpu().item())
        metrics = confusion_and_metrics(torch, logits, y, labels)
    metrics["loss"] = loss
    return metrics


def train_recognizer(
    torch: Any,
    args: argparse.Namespace,
    splits: dict[str, tuple[Any, Any, dict[str, Any]]],
    labels: list[str],
) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.recognizer_seed)
    train_x, train_y, _train_evidence = splits["train"]
    train_x = train_x.to(device)
    train_y = train_y.to(device)
    eval_splits = {
        split: (x.to(device), y.to(device))
        for split, (x, y, _evidence) in splits.items()
    }
    model = build_recognizer_model(torch, int(train_x.shape[1]), args.recognizer_hidden_dim, len(labels)).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.recognizer_learning_rate, weight_decay=0.0)
    initial_metrics = evaluate_recognizer_split(torch, model, criterion, train_x, train_y, labels)
    history = [
        {
            "epoch": 0,
            "train_loss": initial_metrics["loss"],
            "train_top1": initial_metrics["top1_accuracy"],
            "train_macro_recall": initial_metrics["macro_recall"],
        }
    ]
    best_train_loss = initial_metrics["loss"]
    epochs_ran = 0

    for epoch in range(1, args.recognizer_max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(train_x)
        loss = criterion(logits, train_y)
        loss.backward()
        optimizer.step()
        epochs_ran = epoch
        train_metrics = evaluate_recognizer_split(torch, model, criterion, train_x, train_y, labels)
        best_train_loss = min(best_train_loss, float(train_metrics["loss"]))
        if epoch <= 5 or epoch % 25 == 0 or train_metrics["top1_accuracy"] >= 0.8:
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_top1": train_metrics["top1_accuracy"],
                    "train_macro_recall": train_metrics["macro_recall"],
                }
            )
        if (
            train_metrics["top1_accuracy"] == 1.0
            and train_metrics["macro_recall"] == 1.0
            and train_metrics["loss"] <= args.recognizer_early_stop_loss
        ):
            break

    metrics = {
        split: evaluate_recognizer_split(torch, model, criterion, x, y, labels)
        for split, (x, y) in eval_splits.items()
    }
    initial_loss = float(initial_metrics["loss"])
    final_train_loss = float(metrics["train"]["loss"])
    loss_drop_fraction = (initial_loss - best_train_loss) / initial_loss if initial_loss else None
    return {
        "device": str(device),
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "epochs_ran": epochs_ran,
        "history": history,
        "metrics": metrics,
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "best_train_loss": best_train_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_from_initial_to_best": loss_drop_fraction,
            "final_minus_initial": final_train_loss - initial_loss,
        },
    }


def zero_recall_labels(metrics: dict[str, Any]) -> list[str]:
    return [
        str(item.get("label_id"))
        for item in metrics.get("per_label", [])
        if float(item.get("recall", 0.0)) == 0.0
    ]


def compare_gates(
    detector_gate: dict[str, Any],
    transform_summary: dict[str, Any],
    candidate: dict[str, Any],
    baseline_report: dict[str, Any],
) -> dict[str, Any]:
    baseline_metrics = baseline_report.get("training", {}).get("metrics", {})
    baseline_validation = baseline_metrics.get("validation", {})
    candidate_train = candidate["metrics"]["train"]
    candidate_validation = candidate["metrics"]["validation"]
    candidate_loss_drop = candidate["loss_movement"].get("loss_drop_fraction_from_initial_to_best")
    candidate_train_passed = (
        float(candidate_train.get("top1_accuracy", 0.0)) >= 0.8
        and float(candidate_train.get("macro_recall", 0.0)) >= 0.8
        and candidate_loss_drop is not None
        and float(candidate_loss_drop) >= 0.4
    )
    baseline_validation_zero = zero_recall_labels(baseline_validation)
    candidate_validation_zero = zero_recall_labels(candidate_validation)
    validation_top1_improvement = float(candidate_validation.get("top1_accuracy", 0.0)) - float(
        baseline_validation.get("top1_accuracy", 0.0)
    )
    validation_macro_improvement = float(candidate_validation.get("macro_recall", 0.0)) - float(
        baseline_validation.get("macro_recall", 0.0)
    )
    validation_improved = (
        validation_top1_improvement >= 0.05
        or validation_macro_improvement >= 0.05
        or len(candidate_validation_zero) < len(baseline_validation_zero)
    )
    fallback_rates = transform_summary["fallback_rates_by_target"]
    fallback_gate_passed = (
        transform_summary["fallback_rate_overall"] is not None
        and float(transform_summary["fallback_rate_overall"]) <= 0.40
        and all(rate is not None and float(rate) <= 0.60 for rate in fallback_rates.values())
    )
    transform_integrity_passed = (
        not transform_summary["shape_mismatches"]
        and transform_summary["source_ids"] == ["popsign-v1-original-videos"]
        and transform_summary["generated_tensor_count"] == 345
    )
    return {
        "detector_localization_sanity": detector_gate,
        "transform_integrity": {
            "status": "passed" if transform_integrity_passed else "failed",
            "criteria": {
                "generated_tensor_count": 345,
                "source_ids": ["popsign-v1-original-videos"],
                "shape_mismatches": [],
            },
            "actual": {
                "generated_tensor_count": transform_summary["generated_tensor_count"],
                "source_ids": transform_summary["source_ids"],
                "shape_mismatches": transform_summary["shape_mismatches"],
            },
        },
        "fallback_rate_gate": {
            "status": "passed" if fallback_gate_passed else "failed",
            "criteria": {
                "fallback_rate_overall_max": 0.40,
                "fallback_rate_per_target_max": 0.60,
            },
            "actual": {
                "fallback_rate_overall": transform_summary["fallback_rate_overall"],
                "fallback_rates_by_target": fallback_rates,
            },
        },
        "candidate_train_sanity": {
            "status": "passed" if candidate_train_passed else "failed",
            "criteria": {
                "train_top1_min": 0.8,
                "train_macro_recall_min": 0.8,
                "loss_drop_fraction_from_initial_to_best_min": 0.4,
            },
            "actual": {
                "train_top1": candidate_train.get("top1_accuracy"),
                "train_macro_recall": candidate_train.get("macro_recall"),
                "loss_drop_fraction_from_initial_to_best": candidate_loss_drop,
                "zero_recall_labels": zero_recall_labels(candidate_train),
            },
        },
        "validation_comparison": {
            "status": "passed" if validation_improved else "failed",
            "criteria": {
                "validation_top1_improvement_min": 0.05,
                "validation_macro_recall_improvement_min": 0.05,
                "or_zero_recall_labels_decrease": True,
            },
            "actual": {
                "baseline_validation_top1": baseline_validation.get("top1_accuracy"),
                "candidate_validation_top1": candidate_validation.get("top1_accuracy"),
                "validation_top1_improvement": validation_top1_improvement,
                "baseline_validation_macro_recall": baseline_validation.get("macro_recall"),
                "candidate_validation_macro_recall": candidate_validation.get("macro_recall"),
                "validation_macro_recall_improvement": validation_macro_improvement,
                "baseline_zero_recall_labels": baseline_validation_zero,
                "candidate_zero_recall_labels": candidate_validation_zero,
            },
        },
    }


def choose_next_action(gates: dict[str, Any]) -> tuple[str, str]:
    if gates["detector_localization_sanity"]["status"] != "passed":
        return (
            "detector0_data_or_target_remediation",
            "Detector 0 did not reproduce the local train-path sanity threshold for the packet.",
        )
    if gates["transform_integrity"]["status"] != "passed" or gates["fallback_rate_gate"]["status"] != "passed":
        return (
            "detector0_data_or_target_remediation",
            "The detector-normalized transform failed the shape/source/fallback gate before promotion-worthy comparison.",
        )
    if gates["candidate_train_sanity"]["status"] != "passed":
        return (
            "detector0_data_or_target_remediation",
            "The detector-normalized recognizer arm failed train sanity, so the normalization path needs data, target, or transform remediation.",
        )
    if gates["validation_comparison"]["status"] != "passed":
        return (
            "source_distribution_or_reduced_claim_triage",
            "The detector-normalized arm trains locally but does not improve signer-disjoint validation enough to clear the source-distribution blocker.",
        )
    return (
        "crop_normalization_followup",
        "The detector-normalized arm met the local smoke gates and justifies one bounded follow-up without source, label, gate, or product-claim changes.",
    )


def brev_status() -> dict[str, Any]:
    command = ["brev", "ls", "--json"]
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except Exception as error:  # noqa: BLE001 - preserve no-spend status even if brev is unavailable.
        return {
            "checked": False,
            "command": "brev ls --json",
            "compute_used": False,
            "sync_or_training_used": False,
            "remote_training_used": False,
            "error": str(error),
            "manual_stop_command": "brev stop asl-pilot-rawframe-001",
            "manual_stop_command_run": False,
        }
    parsed: Any = None
    if result.stdout.strip():
        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError:
            parsed = {"raw_stdout": result.stdout.strip()}
    return {
        "checked": result.returncode == 0,
        "command": "brev ls --json",
        "returncode": result.returncode,
        "compute_used": False,
        "sync_or_training_used": False,
        "remote_training_used": False,
        "status": parsed,
        "manual_stop_command": "brev stop asl-pilot-rawframe-001",
        "manual_stop_command_run": False,
    }


def main() -> int:
    args = parse_args()
    if args.detector_feature_spatial_size < 8:
        raise AblationSmokeError("--detector-feature-spatial-size must be at least 8")
    if args.recognizer_feature_spatial_size < 4:
        raise AblationSmokeError("--recognizer-feature-spatial-size must be at least 4")
    if args.detector_max_epochs < 1 or args.recognizer_max_epochs < 1:
        raise AblationSmokeError("epoch counts must be positive")
    if not 0.0 <= args.presence_threshold <= 1.0:
        raise AblationSmokeError("--presence-threshold must be between 0 and 1")

    torch = import_torch()
    packet_path = args.packet.resolve()
    raw_packet_dataset, packet_evidence = load_packet_dataset(
        torch,
        packet_path,
        args.detector_feature_spatial_size,
    )
    detector_result = train_detector(torch, args, raw_packet_dataset)
    detector_gate = detector_train_gate(detector_result, packet_evidence["tensor_hashes_checked"])

    train_manifest = load_manifest(args.train_manifest.resolve())
    labels = labels_for_manifest(train_manifest)
    label_to_index = {label: index for index, label in enumerate(labels)}
    raw_candidate_splits, transform_summary = transform_splits(
        torch,
        args,
        detector_result,
        labels,
        label_to_index,
    )
    candidate_splits = normalize_recognizer_splits(torch, raw_candidate_splits)
    candidate_result = train_recognizer(torch, args, candidate_splits, labels)
    baseline_report = read_json(REFERENCE_PATHS["m3ae_j_fixed_crop_smoke"])
    gates = compare_gates(detector_gate, transform_summary, candidate_result, baseline_report)
    next_action, next_action_description = choose_next_action(gates)
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise AblationSmokeError(f"unexpected next action: {next_action}")

    del detector_result["model"]
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-S crop-normalization ablation smoke",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "generated_output_dir": project_relative(args.output_dir),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "diagnostic smoke records metrics and generated ignored tensors only; no export or promotion is authorized",
        },
        "local_device": {
            "detector": detector_result["device"],
            "recognizer": candidate_result["device"],
        },
        "seeds": {
            "detector": args.detector_seed,
            "recognizer": args.recognizer_seed,
        },
        "configuration": {
            "detector_feature_source": "rgb_regions full_frame_reference",
            "detector_feature_spatial_size": args.detector_feature_spatial_size,
            "detector_hidden_dim": args.detector_hidden_dim,
            "detector_max_epochs": args.detector_max_epochs,
            "detector_epochs_ran": detector_result["epochs_ran"],
            "detector_learning_rate": args.detector_learning_rate,
            "detector_loss": "BCEWithLogits presence loss plus L1 normalized xyxy box loss for present targets",
            "presence_threshold": args.presence_threshold,
            "recognizer_feature_spatial_size": args.recognizer_feature_spatial_size,
            "recognizer_hidden_dim": args.recognizer_hidden_dim,
            "recognizer_max_epochs": args.recognizer_max_epochs,
            "recognizer_epochs_ran": candidate_result["epochs_ran"],
            "recognizer_learning_rate": args.recognizer_learning_rate,
            "recognizer_loss": "CrossEntropyLoss",
            "optimizer": "AdamW(weight_decay=0.0)",
            "label_order": labels,
            "target_ids": TARGET_IDS,
            "region_order": REGION_IDS,
        },
        "source_artifacts": {
            name: file_ref(path) for name, path in REFERENCE_PATHS.items()
        },
        "selected_labels": labels,
        "split_counts": {
            split: evidence["example_count"]
            for split, (_x, _y, evidence) in candidate_splits.items()
        },
        "packet_evidence": packet_evidence,
        "detector0_training": {
            "model": {
                "model_id": "detector0_full_frame_mlp_v1_local_ablation_smoke",
                "pretrained_components": [],
                "random_initialization": True,
                "parameter_count": detector_result["model_parameter_count"],
                "model_artifact_saved": False,
            },
            "loss_movement": detector_result["loss_movement"],
            "history": detector_result["history"],
            "metrics": detector_result["metrics"],
        },
        "transform_integrity": {
            "candidate_transform": {
                "source_frame": "existing rgb_regions full_frame_reference only",
                "coordinate_space": "normalized full-frame xyxy, top-left origin",
                "box_expansion_by_target": EXPANSION_BY_TARGET,
                "fallback_source": "same clip fixed-crop rgb_regions target region",
                "full_frame_reference_unchanged": True,
            },
            "split_inputs": {
                split: evidence for split, (_x, _y, evidence) in candidate_splits.items()
            },
            "summary": transform_summary,
        },
        "fixed_crop_baseline": {
            "source": "retained_m3ae_j_metrics",
            "receipt": file_ref(REFERENCE_PATHS["m3ae_j_fixed_crop_smoke"]),
            "model_id": baseline_report.get("model", {}).get("model_id"),
            "configuration": baseline_report.get("configuration"),
            "metrics": baseline_report.get("training", {}).get("metrics"),
            "loss_movement": baseline_report.get("training", {}).get("loss_movement"),
            "rerun_in_this_slice": False,
        },
        "detector_normalized_candidate": {
            "model": {
                "model_id": "region_identity_mlp_v1_detector_normalized_arm",
                "base_model_id": baseline_report.get("model", {}).get("base_model_id", "region_identity_mlp_v1"),
                "pretrained_components": [],
                "random_initialization": True,
                "parameter_count": candidate_result["model_parameter_count"],
                "model_artifact_saved": False,
            },
            "loss_movement": candidate_result["loss_movement"],
            "history": candidate_result["history"],
            "metrics": candidate_result["metrics"],
        },
        "gate_classifications": gates,
        "readiness_classification": {
            "classification": (
                "ready_for_crop_normalization_followup"
                if next_action == "crop_normalization_followup"
                else (
                    "source_distribution_blocker_preserved"
                    if next_action == "source_distribution_or_reduced_claim_triage"
                    else "detector0_transform_remediation_needed"
                )
            ),
            "not_a_product_readiness_claim": True,
            "final_promotion_blockers_unchanged": True,
        },
        "no_pretrained_provenance": {
            "allowed_source_ids": ["popsign-v1-original-videos"],
            "source_expansion": False,
            "label_expansion": False,
            "unapproved_media_import": False,
            "pretrained_detector_outputs": False,
            "pretrained_landmarks": False,
            "pretrained_backbones_or_embeddings": False,
            "generated_pseudo_labels": False,
        },
        "brev_no_spend_boundary": brev_status(),
        "final_promotion_blocker_separation": {
            "tier0_hard_negative_far_assessed": False,
            "no_zero_accepted_true_class_assessed": False,
            "full_17_type_negative_challenge_gate": "unchanged and separate from this smoke",
            "threshold_selected": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
        },
        "boundaries": {
            "ablation_smoke_jobs_run": 1,
            "device_scope": "local CPU/MPS only",
            "brev_sync": False,
            "brev_training": False,
            "brev_spend": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "label_expansion": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "push": False,
            "broad_run_redirect": False,
        },
        "next_action": {
            "id": next_action,
            "description": next_action_description,
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "detector_device": detector_result["device"],
                "recognizer_device": candidate_result["device"],
                "generated_tensor_count": transform_summary["generated_tensor_count"],
                "fallback_rate_overall": transform_summary["fallback_rate_overall"],
                "candidate_train_top1": candidate_result["metrics"]["train"]["top1_accuracy"],
                "candidate_validation_top1": candidate_result["metrics"]["validation"]["top1_accuracy"],
                "candidate_test_top1": candidate_result["metrics"]["test"]["top1_accuracy"],
                "next_action": next_action,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AblationSmokeError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
