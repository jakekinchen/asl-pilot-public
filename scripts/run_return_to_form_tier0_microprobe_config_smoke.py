#!/usr/bin/env python3
"""Run the M3AE-J full-split smoke using the M3AE-I region-identity config."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shlex
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from run_return_to_form_tier0_model_architecture_microprobe import (
    MicroprobeError,
    build_model,
    choose_device,
    confusion_and_metrics,
    feature_tensor,
    file_ref,
    labels_for_manifest,
    load_regions,
    project_relative,
    read_json,
    write_json,
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
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-microprobe-config-smoke/v1"
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-microprobe-config-smoke.json"
DEFAULT_MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "m3ae_h_triage": ROOT / "docs" / "validation" / "return-to-form-tier0-failure-remediation-triage.json",
    "api_strategy_memo": ROOT / "artifacts" / "research" / "observer-195-tier0-strategy-api-response.md",
    "m3ae_i_microprobe": ROOT / "docs" / "validation" / "return-to-form-tier0-model-architecture-microprobe.json",
    "m3ae_g_baseline": ROOT / "docs" / "validation" / "return-to-form-tier0-learnability-smoke-rerun.json",
    "m3ae_f_tensor_contract": ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json",
    "source_register": ROOT / "docs" / "model" / "dataset-source-register.json",
    "source_coverage": ROOT / "docs" / "research" / "return-to-form-tier0-source-coverage.json",
    "crop_config": ROOT / "docs" / "model" / "return-to-form-fixed-crop-config.json",
    "pre_training_gates": ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json",
    "decode_dataloader": ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json",
}


class SmokeError(RuntimeError):
    """Raised when the M3AE-J smoke cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--feature-spatial-size", type=int, default=12)
    parser.add_argument("--hidden-dim", type=int, default=512)
    parser.add_argument("--max-epochs", type=int, default=600)
    parser.add_argument("--early-stop-loss", type=float, default=0.02)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--seed", type=int, default=271828)
    parser.add_argument("--device", choices=("auto", "cpu", "mps"), default="auto")
    return parser.parse_args()


def split_paths(args: argparse.Namespace) -> dict[str, Path]:
    return {
        "train": args.train_manifest.resolve(),
        "validation": args.validation_manifest.resolve(),
        "test": args.test_manifest.resolve(),
    }


def split_feature_dataset(
    torch: Any,
    manifest_path: Path,
    labels: list[str],
    label_to_index: dict[str, int],
    spatial_size: int,
) -> tuple[Any, Any, dict[str, Any]]:
    manifest = load_manifest(manifest_path)
    manifest_labels = labels_for_manifest(manifest)
    if manifest_labels != labels:
        raise SmokeError(
            f"{project_relative(manifest_path)} label order mismatch; "
            f"expected {labels}, got {manifest_labels}"
        )
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise SmokeError(f"{project_relative(manifest_path)} clips must be an array")

    features = []
    targets = []
    source_ids = set()
    region_orders = set()
    original_shapes = set()
    feature_shapes = set()
    counts = Counter()
    example_clip_ids: dict[str, list[str]] = defaultdict(list)

    sorted_clips = sorted(
        [clip for clip in clips if isinstance(clip, dict)],
        key=lambda clip: (str(clip.get("label_id", "")), str(clip.get("clip_id", ""))),
    )
    for index, clip in enumerate(sorted_clips):
        context = f"{project_relative(manifest_path)}: clips[{index}] {clip.get('clip_id')}"
        label_id = str(clip.get("label_id", ""))
        if label_id not in label_to_index:
            raise SmokeError(f"{context} label is not selected for Tier 0: {label_id}")
        source_id = str(clip.get("source_id"))
        if source_id != "popsign-v1-original-videos":
            raise SmokeError(f"{context} uses unexpected source_id={source_id}")
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise SmokeError(
                f"{context} decoded tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
            )
        regions, region_ids = load_regions(torch, tensor_path, context)
        transformed = feature_tensor(torch, regions, spatial_size)
        features.append(transformed.flatten())
        targets.append(label_to_index[label_id])
        source_ids.add(source_id)
        region_orders.add(tuple(region_ids))
        original_shapes.add(tuple(int(value) for value in regions.shape))
        feature_shapes.add(tuple(int(value) for value in transformed.shape))
        counts[label_id] += 1
        if len(example_clip_ids[label_id]) < 3:
            example_clip_ids[label_id].append(str(clip.get("clip_id")))

    if not features:
        raise SmokeError(f"{project_relative(manifest_path)} has no usable clips")
    x = torch.stack(features, dim=0)
    y = torch.tensor(targets, dtype=torch.long)
    evidence = {
        "manifest": file_ref(manifest_path),
        "example_count": len(features),
        "per_label_counts": dict(sorted(counts.items())),
        "example_clip_ids_by_label": dict(sorted(example_clip_ids.items())),
        "source_ids": sorted(source_ids),
        "region_orders": [list(items) for items in sorted(region_orders)],
        "original_rgb_regions_shapes": [list(items) for items in sorted(original_shapes)],
        "feature_tensor_shapes": [list(items) for items in sorted(feature_shapes)],
    }
    return x, y, evidence


def normalize_splits(torch: Any, raw_splits: dict[str, tuple[Any, Any, dict[str, Any]]]) -> dict[str, tuple[Any, Any, dict[str, Any]]]:
    train_x = raw_splits["train"][0]
    mean = train_x.mean(dim=0, keepdim=True)
    std = train_x.std(dim=0, keepdim=True).clamp_min(1e-6)
    normalized = {}
    for split, (x, y, evidence) in raw_splits.items():
        updated = dict(evidence)
        updated["normalization"] = "per-feature z-score fitted on the full Tier 0 train split"
        normalized[split] = ((x - mean) / std, y, updated)
    return normalized


def evaluate_split(torch: Any, model: Any, criterion: Any, x: Any, y: Any, labels: list[str]) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        logits = model(x)
        loss = float(criterion(logits, y).detach().cpu().item())
        metrics = confusion_and_metrics(torch, logits, y, labels)
    metrics["loss"] = loss
    return metrics


def train_smoke(
    torch: Any,
    args: argparse.Namespace,
    splits: dict[str, tuple[Any, Any, dict[str, Any]]],
    labels: list[str],
) -> dict[str, Any]:
    device = choose_device(torch, args.device)
    torch.manual_seed(args.seed)
    train_x, train_y, _train_evidence = splits["train"]
    train_x = train_x.to(device)
    train_y = train_y.to(device)
    eval_splits = {
        split: (x.to(device), y.to(device))
        for split, (x, y, _evidence) in splits.items()
    }
    model = build_model(torch, int(train_x.shape[1]), args.hidden_dim, len(labels)).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.0)

    initial_metrics = evaluate_split(torch, model, criterion, train_x, train_y, labels)
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

    for epoch in range(1, args.max_epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(train_x)
        loss = criterion(logits, train_y)
        loss.backward()
        optimizer.step()
        epochs_ran = epoch

        train_metrics = evaluate_split(torch, model, criterion, train_x, train_y, labels)
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
            and train_metrics["loss"] <= args.early_stop_loss
        ):
            break

    metrics = {
        split: evaluate_split(torch, model, criterion, x, y, labels)
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


def gate_classifications(report_result: dict[str, Any], gates: dict[str, Any]) -> dict[str, Any]:
    train_metrics = report_result["metrics"]["train"]
    validation_metrics = report_result["metrics"]["validation"]
    train_targets = gates.get("training_sanity_gate", {}).get("metric_targets", {})
    validation_targets = gates.get("validation_gate", {}).get("metric_targets", {})
    train_zero_recall = [
        item["label_id"]
        for item in train_metrics["per_label"]
        if float(item.get("recall", 0.0)) == 0.0
    ]
    validation_zero_recall = [
        item["label_id"]
        for item in validation_metrics["per_label"]
        if float(item.get("recall", 0.0)) == 0.0
    ]
    train_passed = (
        float(train_metrics["top1_accuracy"]) >= float(train_targets.get("train_top1_min", 0.8))
        and float(train_metrics["macro_recall"]) >= float(train_targets.get("train_macro_recall_min", 0.8))
        and float(report_result["loss_movement"].get("loss_drop_fraction_from_initial_to_best") or 0.0)
        >= float(train_targets.get("loss_drop_min_fraction_from_initial_to_best", 0.4))
        and not train_zero_recall
    )
    validation_passed = (
        float(validation_metrics["top1_accuracy"]) >= float(validation_targets.get("validation_top1_min", 0.6))
        and float(validation_metrics["macro_recall"]) >= float(validation_targets.get("validation_macro_recall_min", 0.5))
    )
    return {
        "tier0_train_sanity": {
            "status": "passed" if train_passed else "failed",
            "targets": train_targets,
            "actual": {
                "train_top1": train_metrics["top1_accuracy"],
                "train_macro_recall": train_metrics["macro_recall"],
                "loss_drop_fraction_from_initial_to_best": report_result["loss_movement"].get(
                    "loss_drop_fraction_from_initial_to_best"
                ),
                "zero_recall_labels": train_zero_recall,
            },
        },
        "tier0_validation_signal": {
            "status": "passed" if validation_passed else "failed",
            "targets": validation_targets,
            "actual": {
                "validation_top1": validation_metrics["top1_accuracy"],
                "validation_macro_recall": validation_metrics["macro_recall"],
                "zero_recall_labels": validation_zero_recall,
            },
        },
        "tier0_hard_negative_far": {
            "status": "blocked_not_assessed",
            "reason": "No calibrated threshold or reviewed Tier 0 reject set is evaluated in this smoke.",
        },
        "no_zero_accepted_true_class": {
            "status": "blocked_not_assessed",
            "reason": "No acceptance threshold is selected in this smoke.",
        },
    }


def choose_next_action(gates: dict[str, Any]) -> str:
    if gates["tier0_train_sanity"]["status"] != "passed":
        return "microprobe_config_remediation"
    if gates["tier0_validation_signal"]["status"] != "passed":
        return "label_or_split_remediation"
    return "rejection_calibration_before_promotion"


def next_action_description(next_action: str) -> str:
    descriptions = {
        "microprobe_config_remediation": (
            "Train sanity failed or the crop-identity configuration did not transfer cleanly to the full Tier 0 split."
        ),
        "label_or_split_remediation": (
            "Train sanity passed, but validation/test signal points to label, split, signer, or source distribution limits."
        ),
        "rejection_calibration_before_promotion": (
            "Train and validation signal passed; calibrate rejection/hard-negative evidence before any reduced claim."
        ),
    }
    return descriptions[next_action]


def main() -> int:
    args = parse_args()
    if args.feature_spatial_size < 4:
        raise SmokeError("--feature-spatial-size must be at least 4")
    if args.max_epochs < 1:
        raise SmokeError("--max-epochs must be positive")

    torch = import_torch()
    torch.manual_seed(args.seed)
    manifests = split_paths(args)
    train_manifest = load_manifest(manifests["train"])
    labels = labels_for_manifest(train_manifest)
    label_to_index = {label: index for index, label in enumerate(labels)}
    raw_splits = {
        split: split_feature_dataset(torch, manifest_path, labels, label_to_index, args.feature_spatial_size)
        for split, manifest_path in manifests.items()
    }
    splits = normalize_splits(torch, raw_splits)
    smoke_result = train_smoke(torch, args, splits, labels)

    baseline = read_json(REFERENCE_PATHS["m3ae_g_baseline"])
    microprobe = read_json(REFERENCE_PATHS["m3ae_i_microprobe"])
    tensor_contract = read_json(REFERENCE_PATHS["m3ae_f_tensor_contract"])
    gates = read_json(REFERENCE_PATHS["pre_training_gates"])
    gate_results = gate_classifications(smoke_result, gates)
    next_action = choose_next_action(gate_results)

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3AE-J Tier 0 microprobe-config smoke",
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "output": {
            "path": project_relative(args.output),
            "directory": project_relative(args.output.parent),
            "model_artifact_saved": False,
            "reason_model_artifact_not_saved": "diagnostic smoke records metrics only; no model promotion or export is authorized",
        },
        "model": {
            "model_id": "region_identity_mlp_v1_full_split_smoke",
            "base_model_id": "region_identity_mlp_v1",
            "description": (
                "Random-init MLP over full-split downsampled per-region tensors. The region axis is kept "
                "explicit before flattening; no rgb_regions_grid_v1 mosaic is used."
            ),
            "pretrained_components": [],
            "parameter_count": smoke_result["model_parameter_count"],
            "random_initialization": True,
        },
        "device": smoke_result["device"],
        "seed": args.seed,
        "configuration": {
            "feature_spatial_size": args.feature_spatial_size,
            "hidden_dim": args.hidden_dim,
            "max_epochs": args.max_epochs,
            "epochs_ran": smoke_result["epochs_ran"],
            "early_stop_loss": args.early_stop_loss,
            "learning_rate": args.learning_rate,
            "optimizer": "AdamW(weight_decay=0.0)",
            "loss": "CrossEntropyLoss",
            "batching": "full train split in one batch",
            "label_order": labels,
        },
        "source_artifacts": {
            name: file_ref(path) for name, path in REFERENCE_PATHS.items()
        },
        "split_inputs": {
            split: evidence for split, (_x, _y, evidence) in splits.items()
        },
        "selected_labels": labels,
        "source_decision": {
            "allowed_source_ids": ["popsign-v1-original-videos"],
            "source_expansion": False,
            "label_expansion": False,
            "unapproved_media_import": False,
        },
        "crop_identity_preservation": {
            "preserved": True,
            "derived_from_m3ae_i": file_ref(REFERENCE_PATHS["m3ae_i_microprobe"]),
            "method": (
                "Load rgb_regions directly as T,R,H,W,C, keep R as an explicit crop stream, "
                "resize each crop independently to the feature spatial size, fit train normalization, "
                "then flatten ordered T,R,C,H,W tensors for a random-init classifier."
            ),
            "does_not_use": ["rgb_regions_grid_v1", "rgb_frames compatibility tensor", "pretrained features"],
        },
        "input_contract_evidence": {
            "m3ae_f_status": tensor_contract.get("status"),
            "sample_count": tensor_contract.get("summary", {}).get("sample_count"),
            "consumed_tensor_keys": tensor_contract.get("summary", {}).get("consumed_tensor_keys"),
            "derived_inputs_in_main_loader": tensor_contract.get("summary", {}).get("derived_inputs"),
            "fallback_to_rgb_frames_count": tensor_contract.get("summary", {}).get("fallback_to_rgb_frames_count"),
            "smoke_consumed_tensor_key": "rgb_regions",
            "smoke_derived_input": "region_identity_downsample_v1",
        },
        "baseline_comparison": {
            "random_top1_chance": 0.2,
            "m3ae_g_train_top1": baseline.get("metrics", {}).get("train", {}).get("top1_accuracy"),
            "m3ae_g_train_macro_recall": baseline.get("metrics", {}).get("train", {}).get("macro_recall"),
            "m3ae_g_validation_top1": baseline.get("metrics", {}).get("validation", {}).get("top1_accuracy"),
            "m3ae_g_validation_macro_recall": baseline.get("metrics", {}).get("validation", {}).get("macro_recall"),
            "m3ae_i_tiny_train_top1": microprobe.get("training", {})
            .get("tiny_subset_train_metrics", {})
            .get("top1_accuracy"),
            "m3ae_i_tiny_train_macro_recall": microprobe.get("training", {})
            .get("tiny_subset_train_metrics", {})
            .get("macro_recall"),
            "smoke_train_top1": smoke_result["metrics"]["train"]["top1_accuracy"],
            "smoke_train_macro_recall": smoke_result["metrics"]["train"]["macro_recall"],
            "smoke_validation_top1": smoke_result["metrics"]["validation"]["top1_accuracy"],
            "smoke_validation_macro_recall": smoke_result["metrics"]["validation"]["macro_recall"],
            "smoke_test_top1": smoke_result["metrics"]["test"]["top1_accuracy"],
            "smoke_test_macro_recall": smoke_result["metrics"]["test"]["macro_recall"],
        },
        "training": {
            "loss_movement": smoke_result["loss_movement"],
            "history": smoke_result["history"],
            "metrics": smoke_result["metrics"],
            "validation_test_blocker": None,
        },
        "gate_classifications": gate_results,
        "hard_negative_and_calibration_blockers": {
            "assessed_in_this_smoke": False,
            "final_promotion_negative_challenge_blocker": "unchanged and separate from this smoke",
            "calibration_blocker": "unchanged; no threshold selection, ONNX export, or model promotion authorized",
        },
        "next_action": {
            "id": next_action,
            "description": next_action_description(next_action),
        },
        "boundaries": {
            "smoke_training_jobs_run": 1,
            "second_microprobe_run": False,
            "second_smoke_job": False,
            "label_expansion": False,
            "controlled_clip_heldout_evaluation": False,
            "source_approval": False,
            "unapproved_media_import": False,
            "onnx_export": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
            "final_gate_weakening": False,
            "brev_stop": False,
            "duplicate_brev_worker": False,
            "push": False,
            "broad_run_redirect": False,
        },
    }
    write_json(args.output, report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "epochs_ran": smoke_result["epochs_ran"],
                "train_top1": smoke_result["metrics"]["train"]["top1_accuracy"],
                "train_macro_recall": smoke_result["metrics"]["train"]["macro_recall"],
                "validation_top1": smoke_result["metrics"]["validation"]["top1_accuracy"],
                "validation_macro_recall": smoke_result["metrics"]["validation"]["macro_recall"],
                "test_top1": smoke_result["metrics"]["test"]["top1_accuracy"],
                "test_macro_recall": smoke_result["metrics"]["test"]["macro_recall"],
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
    except (MicroprobeError, SmokeError, TrainingError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
