#!/usr/bin/env python3
"""Run the M3AE-I Tier 0 crop-identity-preserving tiny overfit probe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    TrainingError,
    expected_tensor_hash_for_clip,
    import_torch,
    load_manifest,
    sha256_file,
    tensor_path_for_clip,
)


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-model-architecture-microprobe/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-model-architecture-microprobe.json"
DEFAULT_TRAIN_MANIFEST = ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json"
REFERENCE_PATHS = {
    "m3ae_h_triage": ROOT / "docs" / "validation" / "return-to-form-tier0-failure-remediation-triage.json",
    "m3ae_g_baseline": ROOT / "docs" / "validation" / "return-to-form-tier0-learnability-smoke-rerun.json",
    "m3ae_f_tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "api_strategy_memo": ROOT / "artifacts" / "research" / "observer-195-tier0-strategy-api-response.md",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
}
ALLOWED_NEXT_ACTIONS = {
    "rerun_tier0_smoke_with_microprobe_config",
    "input_adapter_remediation",
}


class MicroprobeError(RuntimeError):
    """Raised when the microprobe cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--samples-per-label", type=int, default=2)
    parser.add_argument("--feature-spatial-size", type=int, default=12)
    parser.add_argument("--hidden-dim", type=int, default=512)
    parser.add_argument("--max-epochs", type=int, default=600)
    parser.add_argument("--early-stop-loss", type=float, default=0.02)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--seed", type=int, default=314159)
    parser.add_argument("--device", choices=("auto", "cpu", "mps"), default="auto")
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
        raise MicroprobeError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise MicroprobeError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise MicroprobeError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise MicroprobeError(f"missing reference artifact: {project_relative(path)}")
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def labels_for_manifest(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list) or not labels:
        raise MicroprobeError("train manifest labels must be a non-empty array")
    result = []
    for item in labels:
        if not isinstance(item, dict) or not isinstance(item.get("label_id"), str):
            raise MicroprobeError("train manifest labels must contain label_id strings")
        result.append(str(item["label_id"]))
    return sorted(result)


def select_subset(
    manifest: dict[str, Any],
    manifest_path: Path,
    labels: list[str],
    samples_per_label: int,
) -> list[dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise MicroprobeError("train manifest clips must be an array")
    grouped: dict[str, list[dict[str, Any]]] = {label: [] for label in labels}
    for clip in clips:
        if not isinstance(clip, dict):
            continue
        label_id = clip.get("label_id")
        if isinstance(label_id, str) and label_id in grouped:
            grouped[label_id].append(clip)
    selected: list[dict[str, Any]] = []
    for label in labels:
        grouped[label].sort(key=lambda clip: str(clip.get("clip_id", "")))
        if len(grouped[label]) < samples_per_label:
            raise MicroprobeError(
                f"{project_relative(manifest_path)} has only {len(grouped[label])} "
                f"train clips for {label}; need {samples_per_label}"
            )
        selected.extend(grouped[label][:samples_per_label])
    selected.sort(key=lambda clip: (str(clip.get("label_id")), str(clip.get("clip_id"))))
    return selected


def choose_device(torch: Any, requested: str) -> Any:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "mps":
        if not torch.backends.mps.is_available():
            raise MicroprobeError("requested MPS device is not available")
        return torch.device("mps")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def load_regions(torch: Any, tensor_path: Path, context: str) -> tuple[Any, list[str]]:
    try:
        loaded = torch.load(tensor_path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(tensor_path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - keep the artifact path visible.
        raise MicroprobeError(f"{context} could not load tensor payload: {tensor_path}: {error}") from error
    if not isinstance(loaded, dict):
        raise MicroprobeError(f"{context} tensor payload must be a dict with rgb_regions")
    regions = loaded.get("rgb_regions")
    region_ids = loaded.get("region_ids")
    if not torch.is_tensor(regions):
        raise MicroprobeError(f"{context} tensor payload is missing rgb_regions")
    if not isinstance(region_ids, list) or not all(isinstance(item, str) for item in region_ids):
        raise MicroprobeError(f"{context} tensor payload is missing region_ids")
    if regions.ndim != 5 or int(regions.shape[-1]) != 3:
        raise MicroprobeError(f"{context} rgb_regions must be T,R,H,W,C with 3 channels; got {tuple(regions.shape)}")
    if int(regions.shape[1]) != len(region_ids):
        raise MicroprobeError(f"{context} region_ids length does not match rgb_regions region axis")
    return regions, [str(item) for item in region_ids]


def feature_tensor(torch: Any, regions: Any, spatial_size: int) -> Any:
    # Keep the region axis explicit. No region mosaic/grid is built for this probe.
    regions = regions.to(dtype=torch.float32).div(255.0)
    time_count, region_count, height, width, channels = [int(value) for value in regions.shape]
    resized = regions.permute(1, 0, 4, 2, 3).reshape(region_count * time_count, channels, height, width)
    resized = torch.nn.functional.interpolate(
        resized,
        size=(spatial_size, spatial_size),
        mode="bilinear",
        align_corners=False,
    )
    return resized.reshape(region_count, time_count, channels, spatial_size, spatial_size).permute(1, 0, 2, 3, 4)


def build_dataset(
    torch: Any,
    manifest_path: Path,
    selected: list[dict[str, Any]],
    label_to_index: dict[str, int],
    spatial_size: int,
) -> tuple[Any, Any, list[dict[str, Any]], dict[str, Any]]:
    features = []
    targets = []
    subset_records = []
    region_orders = set()
    original_shapes = set()
    feature_shapes = set()
    source_ids = set()
    for index, clip in enumerate(selected):
        context = f"{project_relative(manifest_path)}: selected[{index}] {clip.get('clip_id')}"
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise MicroprobeError(
                f"{context} decoded tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
            )
        regions, region_ids = load_regions(torch, tensor_path, context)
        transformed = feature_tensor(torch, regions, spatial_size)
        label_id = str(clip["label_id"])
        features.append(transformed.flatten())
        targets.append(label_to_index[label_id])
        region_orders.add(tuple(region_ids))
        original_shapes.add(tuple(int(value) for value in regions.shape))
        feature_shapes.add(tuple(int(value) for value in transformed.shape))
        if isinstance(clip.get("source_id"), str):
            source_ids.add(str(clip["source_id"]))
        subset_records.append(
            {
                "clip_id": str(clip.get("clip_id")),
                "label_id": label_id,
                "source_id": str(clip.get("source_id")),
                "source_split": str(clip.get("source_split")),
                "source_record_id": str(clip.get("source_record_id")),
                "signer_identity_hash": str(clip.get("signer_identity_hash")),
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": actual_hash,
                "region_ids": region_ids,
                "rgb_regions_shape": [int(value) for value in regions.shape],
                "feature_shape": [int(value) for value in transformed.shape],
            }
        )
    x = torch.stack(features, dim=0)
    y = torch.tensor(targets, dtype=torch.long)
    mean = x.mean(dim=0, keepdim=True)
    std = x.std(dim=0, keepdim=True).clamp_min(1e-6)
    x = (x - mean) / std
    evidence = {
        "source_ids": sorted(source_ids),
        "region_orders": [list(items) for items in sorted(region_orders)],
        "original_rgb_regions_shapes": [list(items) for items in sorted(original_shapes)],
        "feature_tensor_shapes": [list(items) for items in sorted(feature_shapes)],
        "normalization": "per-feature z-score computed over the tiny train subset only",
    }
    return x, y, subset_records, evidence


def build_model(torch: Any, input_dim: int, hidden_dim: int, class_count: int) -> Any:
    return torch.nn.Sequential(
        torch.nn.Linear(input_dim, hidden_dim),
        torch.nn.GELU(),
        torch.nn.Linear(hidden_dim, class_count),
    )


def confusion_and_metrics(torch: Any, logits: Any, target: Any, labels: list[str]) -> dict[str, Any]:
    predictions = logits.argmax(dim=1).detach().cpu()
    target_cpu = target.detach().cpu()
    confusion = [[0 for _ in labels] for _ in labels]
    for actual, predicted in zip(target_cpu.tolist(), predictions.tolist(), strict=True):
        confusion[int(actual)][int(predicted)] += 1
    per_label = []
    recalls = []
    f1s = []
    correct = 0
    for index, label in enumerate(labels):
        true_positive = confusion[index][index]
        false_positive = sum(confusion[row][index] for row in range(len(labels)) if row != index)
        false_negative = sum(confusion[index][col] for col in range(len(labels)) if col != index)
        support = sum(confusion[index])
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        recalls.append(recall)
        f1s.append(f1)
        correct += true_positive
        per_label.append(
            {
                "label_id": label,
                "support": support,
                "true_positive": true_positive,
                "precision": precision,
                "recall": recall,
                "f1": f1,
            }
        )
    examples = int(target_cpu.numel())
    return {
        "examples": examples,
        "top1_accuracy": correct / examples if examples else 0.0,
        "macro_recall": sum(recalls) / len(recalls) if recalls else 0.0,
        "macro_f1": sum(f1s) / len(f1s) if f1s else 0.0,
        "per_label": per_label,
        "confusion_matrix_labels": labels,
        "confusion_matrix": confusion,
    }


def train_probe(torch: Any, args: argparse.Namespace, x: Any, y: Any, labels: list[str]) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    x = x.to(device)
    y = y.to(device)
    torch.manual_seed(args.seed)
    model = build_model(torch, int(x.shape[1]), args.hidden_dim, len(labels)).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.0)

    history = []
    model.eval()
    with torch.no_grad():
        initial_logits = model(x)
        initial_loss = float(criterion(initial_logits, y).detach().cpu().item())
        initial_metrics = confusion_and_metrics(torch, initial_logits, y, labels)
    history.append(
        {
            "epoch": 0,
            "loss": initial_loss,
            "top1_accuracy": initial_metrics["top1_accuracy"],
            "macro_recall": initial_metrics["macro_recall"],
        }
    )

    epochs_ran = 0
    final_logits = initial_logits
    final_loss = initial_loss
    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        epochs_ran = epoch

        model.eval()
        with torch.no_grad():
            final_logits = model(x)
            final_loss = float(criterion(final_logits, y).detach().cpu().item())
            metrics = confusion_and_metrics(torch, final_logits, y, labels)
        if epoch <= 5 or epoch % 25 == 0 or metrics["top1_accuracy"] == 1.0:
            history.append(
                {
                    "epoch": epoch,
                    "loss": final_loss,
                    "top1_accuracy": metrics["top1_accuracy"],
                    "macro_recall": metrics["macro_recall"],
                }
            )
        if metrics["top1_accuracy"] == 1.0 and metrics["macro_recall"] == 1.0 and final_loss <= args.early_stop_loss:
            break

    final_metrics = confusion_and_metrics(torch, final_logits, y, labels)
    final_metrics["loss"] = final_loss
    pass_gate = (
        final_metrics["top1_accuracy"] >= 0.95
        and final_metrics["macro_recall"] >= 0.95
        and all(float(item["recall"]) >= 0.95 for item in final_metrics["per_label"])
    )
    next_action = "rerun_tier0_smoke_with_microprobe_config" if pass_gate else "input_adapter_remediation"
    return {
        "model_parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
        "device": str(device),
        "history": history,
        "epochs_ran": epochs_ran,
        "initial_metrics": {
            "loss": initial_loss,
            "top1_accuracy": initial_metrics["top1_accuracy"],
            "macro_recall": initial_metrics["macro_recall"],
        },
        "final_metrics": final_metrics,
        "loss_movement": {
            "initial_loss": initial_loss,
            "final_loss": final_loss,
            "delta": final_loss - initial_loss,
            "relative_change": (final_loss - initial_loss) / initial_loss if initial_loss else None,
        },
        "train_fit_gate": "passed" if pass_gate else "failed",
        "next_action": next_action,
    }


def main() -> int:
    args = parse_args()
    if args.samples_per_label < 1:
        raise MicroprobeError("--samples-per-label must be positive")
    if args.feature_spatial_size < 4:
        raise MicroprobeError("--feature-spatial-size must be at least 4")
    if args.max_epochs < 1:
        raise MicroprobeError("--max-epochs must be positive")

    torch = import_torch()
    torch.manual_seed(args.seed)
    train_manifest_path = args.train_manifest.resolve()
    manifest = load_manifest(train_manifest_path)
    labels = labels_for_manifest(manifest)
    label_to_index = {label: index for index, label in enumerate(labels)}
    selected = select_subset(manifest, train_manifest_path, labels, args.samples_per_label)
    x, y, subset_records, input_evidence = build_dataset(
        torch,
        train_manifest_path,
        selected,
        label_to_index,
        args.feature_spatial_size,
    )
    result = train_probe(torch, args, x, y, labels)

    baseline = read_json(REFERENCE_PATHS["m3ae_g_baseline"])
    tensor_contract = read_json(REFERENCE_PATHS["m3ae_f_tensor_contract"])
    triage = read_json(REFERENCE_PATHS["m3ae_h_triage"])
    if result["next_action"] not in ALLOWED_NEXT_ACTIONS:
        raise MicroprobeError(f"unexpected next action: {result['next_action']}")

    counts = Counter(record["label_id"] for record in subset_records)
    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "passed" if result["train_fit_gate"] == "passed" else "failed",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "directory": project_relative(args.output.parent),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "diagnostic tiny-overfit probe embeds metrics and does not promote or export a model",
        },
        "mission": "M3AE-I Tier 0 model architecture microprobe",
        "model": {
            "model_id": "region_identity_mlp_v1",
            "description": (
                "Random-init MLP over downsampled per-region tensors. The region axis is kept explicit "
                "and flattened only after per-region spatial resizing; no rgb_regions_grid_v1 mosaic is used."
            ),
            "pretrained_components": [],
            "parameter_count": result["model_parameter_count"],
            "random_initialization": True,
        },
        "device": result["device"],
        "seed": args.seed,
        "configuration": {
            "samples_per_label": args.samples_per_label,
            "feature_spatial_size": args.feature_spatial_size,
            "hidden_dim": args.hidden_dim,
            "max_epochs": args.max_epochs,
            "epochs_ran": result["epochs_ran"],
            "early_stop_loss": args.early_stop_loss,
            "learning_rate": args.learning_rate,
            "optimizer": "AdamW(weight_decay=0.0)",
            "loss": "CrossEntropyLoss",
            "batching": "full tiny subset in one batch",
            "label_order": labels,
        },
        "source_artifacts": {
            name: file_ref(path) for name, path in REFERENCE_PATHS.items()
        },
        "baseline_comparison": {
            "random_top1_chance": 0.2,
            "m3ae_g_train_top1": baseline.get("metrics", {}).get("train", {}).get("top1_accuracy"),
            "m3ae_g_train_macro_recall": baseline.get("metrics", {}).get("train", {}).get("macro_recall"),
            "m3ae_g_zero_recall_labels": [
                item.get("label_id")
                for item in baseline.get("metrics", {}).get("train", {}).get("per_label", [])
                if item.get("recall") == 0
            ],
            "microprobe_train_top1": result["final_metrics"]["top1_accuracy"],
            "microprobe_train_macro_recall": result["final_metrics"]["macro_recall"],
        },
        "source_decision": {
            "allowed_source_ids": input_evidence["source_ids"],
            "expected_source_id": "popsign-v1-original-videos",
            "source_expansion": False,
            "label_expansion": False,
            "unapproved_media_import": False,
        },
        "tiny_subset": {
            "manifest": file_ref(train_manifest_path),
            "sample_count": len(subset_records),
            "per_label_counts": dict(sorted(counts.items())),
            "selection_rule": "first N clips per label after sorting train manifest records by clip_id",
            "records": subset_records,
        },
        "crop_identity_preservation": {
            "preserved": True,
            "method": (
                "Load rgb_regions directly as T,R,H,W,C, keep R as an explicit crop stream, "
                "resize each crop independently to the feature spatial size, then flatten the ordered "
                "T,R,C,H,W tensor for a random-init classifier."
            ),
            "does_not_use": ["rgb_regions_grid_v1", "rgb_frames compatibility tensor", "pretrained features"],
            "input_evidence": input_evidence,
        },
        "input_contract_evidence": {
            "m3ae_f_status": tensor_contract.get("status"),
            "sample_count": tensor_contract.get("summary", {}).get("sample_count"),
            "consumed_tensor_keys": tensor_contract.get("summary", {}).get("consumed_tensor_keys"),
            "derived_inputs_in_main_loader": tensor_contract.get("summary", {}).get("derived_inputs"),
            "fallback_to_rgb_frames_count": tensor_contract.get("summary", {}).get("fallback_to_rgb_frames_count"),
            "microprobe_consumed_tensor_key": "rgb_regions",
            "microprobe_derived_input": "region_identity_downsample_v1",
        },
        "triage_source": {
            "next_action_entering_microprobe": triage.get("next_action"),
            "selected_blocker": triage.get("blocker_classification", {}).get("selected_blocker"),
        },
        "training": {
            "loss_movement": result["loss_movement"],
            "history": result["history"],
            "initial_metrics": result["initial_metrics"],
            "tiny_subset_train_metrics": result["final_metrics"],
            "validation_metrics": None,
            "test_metrics": None,
            "validation_test_note": (
                "Not computed in this one-job tiny overfit probe; the gate here is train fit on "
                "the sampled subset only."
            ),
            "train_fit_gate": result["train_fit_gate"],
            "classification": (
                "tiny_identity_preserving_probe_overfit"
                if result["train_fit_gate"] == "passed"
                else "tiny_identity_preserving_probe_failed_train_fit"
            ),
        },
        "hard_negative_and_calibration_blockers": {
            "assessed_in_this_probe": False,
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this tiny overfit diagnostic",
            "calibration_blocker": "unchanged; no model promotion or ONNX export authorized",
        },
        "next_action": {
            "id": result["next_action"],
            "description": (
                "Run one bounded Tier 0 smoke using this crop-identity-preserving microprobe configuration "
                "before any product promotion."
                if result["next_action"] == "rerun_tier0_smoke_with_microprobe_config"
                else "Remediate the identity-preserving input adapter before another training-style run."
            ),
        },
        "boundaries": {
            "microprobe_training_jobs_run": 1,
            "second_microprobe_run": False,
            "full_train_set_parameter_tweak": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "brev_stop": False,
        },
    }
    write_json(args.output, report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "train_top1": result["final_metrics"]["top1_accuracy"],
                "train_macro_recall": result["final_metrics"]["macro_recall"],
                "epochs_ran": result["epochs_ran"],
                "next_action": result["next_action"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (MicroprobeError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
