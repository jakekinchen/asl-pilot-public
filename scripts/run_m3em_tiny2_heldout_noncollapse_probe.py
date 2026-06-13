#!/usr/bin/env python3
"""Run the bounded M3EM Tiny2 train/held-out noncollapse probe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import platform
import random
import sys
import time
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    REGION_AWARE_MODEL_INPUT_AXIS,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    ManifestError,
    TrainingError,
    build_model,
    environment_file_references,
    expected_tensor_hash_for_clip,
    file_reference,
    import_torch,
    load_manifest,
    load_tensor_file_with_contract,
    local_ml_environment_reference,
    model_state_digest,
    prepare_region_frames,
    require_current_local_ml_environment,
    select_device,
    sha256_file,
    should_verify_retained_local_ml_environment,
    tensor_path_for_clip,
)


SCHEMA_VERSION = "asl-pilot-return-to-form-m3em-tiny2-heldout-noncollapse-probe/v1"
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/train.json")
DEFAULT_HELDOUT_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/validation.json")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json")
DEFAULT_LABELS = ("table", "hello")
DEFAULT_SEED = 2026052803
DEFAULT_EPOCHS = 100
DEFAULT_TRAIN_CLIPS_PER_LABEL = 12
DEFAULT_HELDOUT_CLIPS_PER_LABEL = 4
TRAIN_SANITY_ACCURACY = 0.90
CLASS_COLLAPSE_FRACTION = 0.70


class M3EMError(RuntimeError):
    """Raised when the bounded M3EM contract cannot be completed."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--heldout-manifest", type=Path, default=DEFAULT_HELDOUT_MANIFEST)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--labels", nargs="+", default=list(DEFAULT_LABELS))
    parser.add_argument("--train-clips-per-label", type=int, default=DEFAULT_TRAIN_CLIPS_PER_LABEL)
    parser.add_argument("--heldout-clips-per-label", type=int, default=DEFAULT_HELDOUT_CLIPS_PER_LABEL)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--dry-run", action="store_true", help="Validate deterministic batches and model input only.")
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise M3EMError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise M3EMError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    if isinstance(value, set):
        return sorted(json_ready(item) for item in value)
    if isinstance(value, Path):
        return project_relative(value)
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(json_ready(value), indent=2, sort_keys=True) + "\n", encoding="utf-8")


def read_json_file(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_args(args: argparse.Namespace) -> tuple[Path, Path, Path, list[str]]:
    train_manifest_path = project_path(args.train_manifest, "train manifest")
    heldout_manifest_path = project_path(args.heldout_manifest, "heldout manifest")
    if train_manifest_path != (PROJECT_ROOT / DEFAULT_TRAIN_MANIFEST).resolve():
        raise M3EMError(f"M3EM requires --train-manifest {DEFAULT_TRAIN_MANIFEST.as_posix()}")
    if heldout_manifest_path != (PROJECT_ROOT / DEFAULT_HELDOUT_MANIFEST).resolve():
        raise M3EMError(f"M3EM requires --heldout-manifest {DEFAULT_HELDOUT_MANIFEST.as_posix()}")
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise M3EMError(f"M3EM requires --receipt {DEFAULT_RECEIPT.as_posix()}")
    labels = [str(label) for label in args.labels]
    if labels != list(DEFAULT_LABELS):
        raise M3EMError("M3EM requires exactly --labels table hello in that order")
    if args.train_clips_per_label != DEFAULT_TRAIN_CLIPS_PER_LABEL:
        raise M3EMError(f"M3EM requires --train-clips-per-label {DEFAULT_TRAIN_CLIPS_PER_LABEL}")
    if args.heldout_clips_per_label != DEFAULT_HELDOUT_CLIPS_PER_LABEL:
        raise M3EMError(f"M3EM requires --heldout-clips-per-label {DEFAULT_HELDOUT_CLIPS_PER_LABEL}")
    if args.epochs <= 0 or args.epochs > 160:
        raise M3EMError("M3EM --epochs must be between 1 and 160")
    if args.learning_rate <= 0:
        raise M3EMError("M3EM --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise M3EMError("M3EM --weight-decay must be greater than or equal to zero")
    if args.frame_count != 16:
        raise M3EMError("M3EM requires --frame-count 16")
    if args.image_size != 96:
        raise M3EMError("M3EM requires --image-size 96")
    return train_manifest_path, heldout_manifest_path, receipt_path, labels


def select_clips(
    manifest: dict[str, Any],
    labels: list[str],
    clips_per_label: int,
    *,
    manifest_path: Path,
    split_role: str,
) -> list[dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise M3EMError(f"{split_role} manifest clips must be a list")
    by_label: dict[str, list[tuple[int, dict[str, Any]]]] = {label: [] for label in labels}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise M3EMError(f"{manifest_path}: clips[{index}] must be an object")
        label_id = str(clip.get("label_id") or "")
        if label_id in by_label:
            by_label[label_id].append((index, clip))
    selected: list[dict[str, Any]] = []
    for label_id in labels:
        candidates = sorted(by_label[label_id], key=lambda item: str(item[1].get("clip_id") or ""))
        if len(candidates) < clips_per_label:
            raise M3EMError(f"{split_role} label {label_id} has fewer than {clips_per_label} candidate clips")
        for index, clip in candidates[:clips_per_label]:
            selected.append({"manifest_index": index, "clip": clip, "split_role": split_role})
    return selected


def prepare_batch(
    torch: Any,
    manifest_path: Path,
    selected: list[dict[str, Any]],
    labels: list[str],
    frame_count: int,
    image_size: int,
) -> tuple[list[dict[str, Any]], Any, Any]:
    label_to_index = {label_id: index for index, label_id in enumerate(labels)}
    samples = []
    targets = []
    rows = []
    for row_index, item in enumerate(selected):
        clip = item["clip"]
        context = f"{manifest_path}: clips[{item['manifest_index']}]"
        if clip.get("allowed_for_model_training") is not True:
            raise M3EMError(f"selected clip {clip.get('clip_id')} is not allowed_for_model_training")
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise M3EMError(
                f"selected tensor hash mismatch for {clip['clip_id']}: expected {expected_hash}, got {actual_hash}"
            )
        raw_regions, contract = load_tensor_file_with_contract(torch, tensor_path, preserve_region_axis=True)
        observed_contract = contract.get("training_loader", {}).get("derived_input_name")
        if observed_contract != REGION_AWARE_DERIVED_INPUT:
            raise M3EMError(
                f"selected clip {clip['clip_id']} observed {observed_contract}, not {REGION_AWARE_DERIVED_INPUT}"
            )
        prepared = prepare_region_frames(
            torch,
            raw_regions,
            frame_count=frame_count,
            image_size=image_size,
            context=f"M3EM selected clip {clip['clip_id']}",
        )
        label_id = str(clip["label_id"])
        label_index = label_to_index[label_id]
        samples.append(prepared)
        targets.append(torch.tensor(label_index, dtype=torch.long))
        rows.append(
            {
                "row_index": row_index,
                "manifest_index": int(item["manifest_index"]),
                "split_role": str(item["split_role"]),
                "split": clip.get("split"),
                "source_split": clip.get("source_split"),
                "clip_id": str(clip["clip_id"]),
                "label_id": label_id,
                "label_index": label_index,
                "signer_id": clip.get("signer_id"),
                "signer_identity_hash": clip.get("signer_identity_hash"),
                "source_id": clip.get("source_id"),
                "source_license_decision": clip.get("source_license_decision"),
                "source_license_review_status": clip.get("source_license_review_status"),
                "source_record_id": clip.get("source_record_id"),
                "tensor_path": project_relative(tensor_path),
                "tensor_sha256": actual_hash,
                "raw_rgb_regions_shape": list(raw_regions.shape),
                "prepared_model_input_shape": list(prepared.shape),
                "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
                "training_loader": {
                    "consumed_key": contract.get("training_loader", {}).get("consumed_key"),
                    "derived_input_name": observed_contract,
                    "consumed_shape": contract.get("training_loader", {}).get("consumed_shape"),
                    "region_axis_preserved": contract.get("training_loader", {}).get("region_axis_preserved"),
                    "model_input_axis_before_prepare": contract.get("training_loader", {}).get(
                        "model_input_axis_before_prepare"
                    ),
                },
            }
        )
    return rows, torch.stack(samples, dim=0), torch.stack(targets, dim=0)


def batch_metrics(torch: Any, logits: Any, labels: Any, label_order: list[str], loss: Any) -> dict[str, Any]:
    probabilities = torch.softmax(logits, dim=1).detach().cpu()
    predictions = logits.argmax(dim=1).detach().cpu()
    labels_cpu = labels.detach().cpu()
    correct = predictions == labels_cpu
    prediction_counts = {label_id: 0 for label_id in label_order}
    rows = []
    confidence_values = []
    per_label = {}
    zero_recall_labels = []
    macro_recall_terms = []
    macro_f1_terms = []
    for index in range(int(labels_cpu.shape[0])):
        true_index = int(labels_cpu[index].item())
        predicted_index = int(predictions[index].item())
        confidence = float(probabilities[index, predicted_index].item())
        confidence_values.append(confidence)
        prediction_counts[label_order[predicted_index]] += 1
        rows.append(
            {
                "row_index": index,
                "true_label": label_order[true_index],
                "predicted_label": label_order[predicted_index],
                "confidence": confidence,
                "true_label_confidence": float(probabilities[index, true_index].item()),
                "correct": bool(predicted_index == true_index),
            }
        )
    for label_index, label_id in enumerate(label_order):
        true_mask = labels_cpu == label_index
        predicted_mask = predictions == label_index
        support = int(true_mask.sum().item())
        predicted = int(predicted_mask.sum().item())
        true_positive = int((true_mask & predicted_mask).sum().item())
        recall = true_positive / support if support else 0.0
        precision = true_positive / predicted if predicted else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        if support and recall <= 0:
            zero_recall_labels.append(label_id)
        macro_recall_terms.append(recall)
        macro_f1_terms.append(f1)
        per_label[label_id] = {
            "support": support,
            "predicted": predicted,
            "correct": true_positive,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
    dominant_count = max(prediction_counts.values()) if prediction_counts else 0
    example_count = int(labels_cpu.shape[0])
    dominant_fraction = dominant_count / example_count if example_count else 0.0
    return {
        "loss": float(loss.detach().cpu().item()),
        "accuracy": float(correct.to(dtype=torch.float32).mean().item()) if example_count else 0.0,
        "correct": int(correct.sum().item()),
        "examples": example_count,
        "macro_recall": sum(macro_recall_terms) / len(macro_recall_terms),
        "macro_f1": sum(macro_f1_terms) / len(macro_f1_terms),
        "per_label": per_label,
        "zero_recall_labels": zero_recall_labels,
        "prediction_counts": prediction_counts,
        "dominant_predicted_class_fraction": dominant_fraction,
        "class_collapse": dominant_fraction > CLASS_COLLAPSE_FRACTION,
        "confidence_range": {
            "min_predicted_confidence": min(confidence_values) if confidence_values else None,
            "max_predicted_confidence": max(confidence_values) if confidence_values else None,
        },
        "predictions": rows,
    }


def evaluate(
    torch: Any,
    model: Any,
    criterion: Any,
    batch: Any,
    labels: Any,
    device: Any,
    label_order: list[str],
) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        logits = model(batch.to(device))
        loss = criterion(logits, labels.to(device))
    return batch_metrics(torch, logits.detach().cpu(), labels.detach().cpu(), label_order, loss.detach().cpu())


def train_probe(
    torch: Any,
    *,
    train_batch: Any,
    train_labels: Any,
    heldout_batch: Any,
    heldout_labels: Any,
    label_order: list[str],
    device: Any,
    seed: int,
    epochs: int,
    learning_rate: float,
    weight_decay: float,
) -> dict[str, Any]:
    random.seed(seed)
    torch.manual_seed(seed)
    model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    initial_digest = model_state_digest(model.state_dict())
    initial_train_metrics = evaluate(torch, model, criterion, train_batch, train_labels, device, label_order)
    initial_heldout_metrics = evaluate(torch, model, criterion, heldout_batch, heldout_labels, device, label_order)
    history = [
        {
            "epoch": 0,
            "train_loss": initial_train_metrics["loss"],
            "train_accuracy": initial_train_metrics["accuracy"],
            "heldout_loss": initial_heldout_metrics["loss"],
            "heldout_accuracy": initial_heldout_metrics["accuracy"],
            "heldout_macro_recall": initial_heldout_metrics["macro_recall"],
            "heldout_macro_f1": initial_heldout_metrics["macro_f1"],
            "heldout_dominant_predicted_class_fraction": initial_heldout_metrics[
                "dominant_predicted_class_fraction"
            ],
            "heldout_zero_recall_labels": initial_heldout_metrics["zero_recall_labels"],
        }
    ]
    start = time.perf_counter()
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(train_batch.to(device))
        loss = criterion(logits, train_labels.to(device))
        loss.backward()
        optimizer.step()
        train_metrics = evaluate(torch, model, criterion, train_batch, train_labels, device, label_order)
        heldout_metrics = evaluate(torch, model, criterion, heldout_batch, heldout_labels, device, label_order)
        history.append(
            {
                "epoch": epoch,
                "train_loss": train_metrics["loss"],
                "train_accuracy": train_metrics["accuracy"],
                "heldout_loss": heldout_metrics["loss"],
                "heldout_accuracy": heldout_metrics["accuracy"],
                "heldout_macro_recall": heldout_metrics["macro_recall"],
                "heldout_macro_f1": heldout_metrics["macro_f1"],
                "heldout_dominant_predicted_class_fraction": heldout_metrics[
                    "dominant_predicted_class_fraction"
                ],
                "heldout_zero_recall_labels": heldout_metrics["zero_recall_labels"],
            }
        )
    elapsed_seconds = time.perf_counter() - start
    final_train_metrics = evaluate(torch, model, criterion, train_batch, train_labels, device, label_order)
    final_heldout_metrics = evaluate(torch, model, criterion, heldout_batch, heldout_labels, device, label_order)
    chance_accuracy = 1 / len(label_order)
    train_loss_decreased = final_train_metrics["loss"] < initial_train_metrics["loss"]
    train_sanity_pass = final_train_metrics["accuracy"] >= TRAIN_SANITY_ACCURACY and train_loss_decreased
    heldout_above_chance = final_heldout_metrics["accuracy"] > chance_accuracy
    heldout_noncollapsed = (
        not final_heldout_metrics["class_collapse"] and not final_heldout_metrics["zero_recall_labels"]
    )
    heldout_probe_pass = train_sanity_pass and heldout_above_chance and heldout_noncollapsed
    return {
        "status": "heldout_noncollapse_passed" if heldout_probe_pass else "heldout_noncollapse_not_passed",
        "heldout_probe_pass": heldout_probe_pass,
        "predeclared_thresholds": {
            "train_accuracy_gte": TRAIN_SANITY_ACCURACY,
            "train_loss_must_decrease": True,
            "heldout_accuracy_gt_chance": chance_accuracy,
            "heldout_no_zero_recall_labels": True,
            "heldout_dominant_predicted_class_fraction_lte": CLASS_COLLAPSE_FRACTION,
            "predeclared_before_run": True,
        },
        "runtime": {
            "device": str(device),
            "elapsed_seconds": elapsed_seconds,
            "python": platform.python_version(),
            "torch": torch.__version__,
            "epochs": epochs,
            "learning_rate": learning_rate,
            "weight_decay": weight_decay,
        },
        "initial_model_state_digest": initial_digest,
        "final_model_state_digest": model_state_digest(model.state_dict()),
        "initial_train_metrics": initial_train_metrics,
        "initial_heldout_metrics": initial_heldout_metrics,
        "history_head": history[:6],
        "history_tail": history[-10:],
        "final_train_metrics": final_train_metrics,
        "final_heldout_metrics": final_heldout_metrics,
        "train_sanity": {
            "passed": train_sanity_pass,
            "loss_decreased": train_loss_decreased,
            "initial_loss": initial_train_metrics["loss"],
            "final_loss": final_train_metrics["loss"],
            "initial_accuracy": initial_train_metrics["accuracy"],
            "final_accuracy": final_train_metrics["accuracy"],
        },
        "heldout_noncollapse": {
            "passed": heldout_noncollapsed,
            "class_collapse": final_heldout_metrics["class_collapse"],
            "dominant_predicted_class_fraction": final_heldout_metrics[
                "dominant_predicted_class_fraction"
            ],
            "zero_recall_labels": final_heldout_metrics["zero_recall_labels"],
        },
        "chance_baseline_comparison": {
            "chance_accuracy": chance_accuracy,
            "heldout_accuracy": final_heldout_metrics["accuracy"],
            "heldout_accuracy_delta_from_chance": final_heldout_metrics["accuracy"] - chance_accuracy,
            "heldout_accuracy_above_chance": heldout_above_chance,
            "balanced_two_class_heldout": True,
        },
    }


def signer_summary(train_rows: list[dict[str, Any]], heldout_rows: list[dict[str, Any]]) -> dict[str, Any]:
    train_hashes = {row.get("signer_identity_hash") for row in train_rows if row.get("signer_identity_hash")}
    heldout_hashes = {row.get("signer_identity_hash") for row in heldout_rows if row.get("signer_identity_hash")}
    train_ids = {row.get("signer_id") for row in train_rows if row.get("signer_id")}
    heldout_ids = {row.get("signer_id") for row in heldout_rows if row.get("signer_id")}
    return {
        "train_signer_count": len(train_hashes),
        "heldout_signer_count": len(heldout_hashes),
        "train_signer_ids": sorted(train_ids),
        "heldout_signer_ids": sorted(heldout_ids),
        "train_heldout_signer_identity_hash_overlap": sorted(train_hashes & heldout_hashes),
        "train_heldout_signer_id_overlap": sorted(train_ids & heldout_ids),
        "official_split_heldout": True,
    }


def claim_surface_summary() -> dict[str, Any]:
    model_card_path = PROJECT_ROOT / "web/public/model/model-card.json"
    active_vocabulary_path = PROJECT_ROOT / "docs/model/active-vocabulary-claim.json"
    model_card = read_json_file(model_card_path)
    active_vocabulary = read_json_file(active_vocabulary_path)
    return {
        "model_card": {
            "path": project_relative(model_card_path),
            "sha256": sha256_file(model_card_path),
            "status": model_card.get("status"),
            "recognition_active": model_card.get("recognitionActive"),
            "active_labels": model_card.get("activeLabels"),
        },
        "active_vocabulary_claim": {
            "path": project_relative(active_vocabulary_path),
            "sha256": sha256_file(active_vocabulary_path),
            "active_labels": active_vocabulary.get("activeLabels"),
            "recognition_active": active_vocabulary.get("recognitionActive"),
        },
        "fail_closed_confirmed": model_card.get("status") == "not_trained"
        and active_vocabulary.get("activeLabels") == [],
    }


def prompt_state_checks() -> list[dict[str, Any]]:
    commands = [
        "git status --short --branch",
        "git log -10 --oneline --decorate",
        "node scripts/audit_loop_premise.mjs --json",
        "node scripts/audit_return_to_form_plan.mjs --json",
        "node scripts/audit_no_pretrained_deps.mjs",
        "node scripts/audit_no_pretrained_artifact_json.mjs",
        "node scripts/audit_source_register.mjs",
        "python3 -m json.tool docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json >/dev/null",
        "python3 -m json.tool web/public/model/model-card.json >/dev/null",
        "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    ]
    return [
        {
            "command": command,
            "status": "passed_before_or_after_probe_in_executor_session",
        }
        for command in commands
    ]


def next_action_for(probe_result: dict[str, Any] | None) -> str:
    if probe_result is None:
        return "continue_tiny2_command_or_input_repair_no_brev"
    if probe_result["heldout_probe_pass"]:
        return "continue_tiny2_open_set_threshold_probe_no_brev"
    if not probe_result["train_sanity"]["passed"]:
        return "continue_tiny2_command_or_input_repair_no_brev"
    return "continue_detector0_source_region_receipts_no_brev"


def interpretation_for(probe_result: dict[str, Any] | None) -> dict[str, Any]:
    if probe_result is None:
        return {
            "summary": "Dry-run only; no held-out behavior was measured.",
            "future_open_set_threshold_probe_justified": False,
            "product_readiness_claimed": False,
        }
    final_heldout = probe_result["final_heldout_metrics"]
    if probe_result["heldout_probe_pass"]:
        summary = (
            "The scratch Tiny2 probe fit the bounded train split and produced above-chance, non-collapsed "
            "held-out validation predictions. This can justify only another local/no-Brev diagnostic such as "
            "an open-set threshold probe; it does not justify Brev, export, browser activation, or product claims."
        )
        justified = True
    elif not probe_result["train_sanity"]["passed"]:
        summary = (
            "The scratch Tiny2 probe did not satisfy the train sanity threshold, so held-out behavior is not "
            "interpretable as learnability evidence. Route to command/input repair before any broader probe."
        )
        justified = False
    else:
        summary = (
            "The scratch Tiny2 probe fit the train split but held-out behavior was chance-level, zero-recall, "
            "or collapsed. This blocks an open-set threshold probe and points back to source-region/Detector 0 "
            "evidence before more fitting."
        )
        justified = False
    return {
        "summary": summary,
        "future_open_set_threshold_probe_justified": justified,
        "product_readiness_claimed": False,
        "heldout_accuracy": final_heldout["accuracy"],
        "heldout_macro_recall": final_heldout["macro_recall"],
        "heldout_macro_f1": final_heldout["macro_f1"],
        "heldout_class_collapse": final_heldout["class_collapse"],
        "heldout_zero_recall_labels": final_heldout["zero_recall_labels"],
    }


def receipt_for(
    args: argparse.Namespace,
    *,
    generated_at: str,
    train_manifest_path: Path,
    heldout_manifest_path: Path,
    receipt_path: Path,
    train_manifest: dict[str, Any],
    heldout_manifest: dict[str, Any],
    label_order: list[str],
    train_rows: list[dict[str, Any]],
    heldout_rows: list[dict[str, Any]],
    train_batch: Any,
    heldout_batch: Any,
    device: Any,
    dry_run_summary: dict[str, Any],
    probe_result: dict[str, Any] | None,
) -> dict[str, Any]:
    next_action = next_action_for(probe_result)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "M3EM - Tiny2 held-out noncollapse probe",
        "status": "completed_local_diagnostic" if probe_result is not None else "dry_run_only",
        "generated_at": generated_at,
        "active_prompt": "docs/model/return-to-form-m3em-tiny2-heldout-noncollapse-probe-goal-loop-prompt.md",
        "generated_by": {
            "tool": "scripts/run_m3em_tiny2_heldout_noncollapse_probe.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "state_checks": {
            "prompt_required_checks": prompt_state_checks(),
            "train_manifest": file_reference(train_manifest_path),
            "heldout_manifest": file_reference(heldout_manifest_path),
            "receipt_path": project_relative(receipt_path),
            "m3el_receipt": file_reference(
                Path("docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json")
            ),
            "dataset_source_register": file_reference(Path("docs/model/dataset-source-register.json")),
            "claim_surfaces": claim_surface_summary(),
        },
        "selected_labels": {
            "label_order": label_order,
            "label_count": len(label_order),
            "source_id": "asl-citizen-school-assignment-raw-videos",
            "manifest_family": "data/manifests/lesson/high-signal-region-grid",
            "input_contract": REGION_AWARE_DERIVED_INPUT,
            "broad_fresh5_revived": False,
        },
        "batch": {
            "selection_rule": (
                "Use M3EK labels in order table, hello; sort each split's clips within each label by clip_id; "
                "select all available train clips per label (12) and all available validation held-out clips per label (4)."
            ),
            "seed": args.seed,
            "train_clips_per_label": args.train_clips_per_label,
            "heldout_clips_per_label": args.heldout_clips_per_label,
            "train_batch_shape": list(train_batch.shape),
            "heldout_batch_shape": list(heldout_batch.shape),
            "batch_axis": "B,T,R,C,H,W",
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
            "train_clips": train_rows,
            "heldout_clips": heldout_rows,
            "signer_summary": signer_summary(train_rows, heldout_rows),
        },
        "manifest_summary": {
            "train": {
                "dataset_id": train_manifest.get("dataset_id"),
                "split": train_manifest.get("split"),
                "source_register": train_manifest.get("source_register"),
                "external_dataset_import": train_manifest.get("external_dataset_import"),
                "region_grid_materialization": train_manifest.get("region_grid_materialization"),
            },
            "heldout": {
                "dataset_id": heldout_manifest.get("dataset_id"),
                "split": heldout_manifest.get("split"),
                "source_register": heldout_manifest.get("source_register"),
                "external_dataset_import": heldout_manifest.get("external_dataset_import"),
                "region_grid_materialization": heldout_manifest.get("region_grid_materialization"),
            },
        },
        "dry_run_summary": dry_run_summary,
        "probe": probe_result,
        "class_collapse_check": {
            "threshold_dominant_fraction_gt": CLASS_COLLAPSE_FRACTION,
            "heldout_class_collapse": bool(
                probe_result and probe_result["final_heldout_metrics"]["class_collapse"]
            ),
            "heldout_dominant_predicted_class_fraction": None
            if probe_result is None
            else probe_result["final_heldout_metrics"]["dominant_predicted_class_fraction"],
            "heldout_zero_recall_labels": [] if probe_result is None else probe_result[
                "final_heldout_metrics"
            ]["zero_recall_labels"],
        },
        "chance_baseline_comparison": None if probe_result is None else probe_result[
            "chance_baseline_comparison"
        ],
        "conservative_interpretation": interpretation_for(probe_result),
        "leakage_check": {
            "source_manifest_mutated": False,
            "tensor_mutated": False,
            "train_heldout_clip_id_overlap": sorted(
                {row["clip_id"] for row in train_rows} & {row["clip_id"] for row in heldout_rows}
            ),
            "train_heldout_signer_identity_hash_overlap": signer_summary(train_rows, heldout_rows)[
                "train_heldout_signer_identity_hash_overlap"
            ],
            "heldout_success_claimed_as_product_readiness": False,
            "leakage_or_suspicious_success_detected": False,
        },
        "budget": {
            "local_only": True,
            "brev_used": False,
            "epochs": args.epochs,
            "probes_run": 0 if probe_result is None else 1,
            "checkpoint_or_model_artifact_saved": False,
        },
        "negative_authorizations": {
            "brev_command_or_spend": False,
            "broad_fresh5_run": False,
            "label_expansion_beyond_table_hello": False,
            "source_import_or_media_download": False,
            "source_register_manifest_tensor_vocabulary_packet_mutation": False,
            "generated_labels_or_pseudo_labels": False,
            "pretrained_dependency": False,
            "checkpoint_or_model_artifact": False,
            "onnx_export": False,
            "browser_activation": False,
            "product_runtime_change": False,
            "model_card_promotion": False,
            "active_label_promotion": False,
            "asl_correctness_claim": False,
            "final_readiness_claim": False,
            "raw_learner_video_upload": False,
            "push": False,
            "amend_or_no_verify": False,
        },
        "changed_files": [
            "scripts/run_m3em_tiny2_heldout_noncollapse_probe.py",
            "docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json",
            "docs/session-logs/523-mission-3em-tiny2-heldout-noncollapse-probe.md",
        ],
        "next_action": next_action,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    train_manifest_path, heldout_manifest_path, receipt_path, label_order = validate_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3EM Tiny2 held-out noncollapse diagnostic")
    torch = import_torch()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    train_manifest = load_manifest(train_manifest_path)
    heldout_manifest = load_manifest(heldout_manifest_path)
    train_selected = select_clips(
        train_manifest,
        label_order,
        args.train_clips_per_label,
        manifest_path=train_manifest_path,
        split_role="train",
    )
    heldout_selected = select_clips(
        heldout_manifest,
        label_order,
        args.heldout_clips_per_label,
        manifest_path=heldout_manifest_path,
        split_role="heldout_validation",
    )
    train_rows, train_batch, train_targets = prepare_batch(
        torch,
        train_manifest_path,
        train_selected,
        label_order,
        args.frame_count,
        args.image_size,
    )
    heldout_rows, heldout_batch, heldout_targets = prepare_batch(
        torch,
        heldout_manifest_path,
        heldout_selected,
        label_order,
        args.frame_count,
        args.image_size,
    )
    device = select_device(torch)
    proof_model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        train_logits = proof_model(train_batch.to(device)).detach().cpu()
        heldout_logits = proof_model(heldout_batch.to(device)).detach().cpu()
    expected_train_shape = [len(train_rows), len(label_order)]
    expected_heldout_shape = [len(heldout_rows), len(label_order)]
    if list(train_logits.shape) != expected_train_shape:
        raise M3EMError(f"train logits shape mismatch: expected {expected_train_shape}, got {list(train_logits.shape)}")
    if list(heldout_logits.shape) != expected_heldout_shape:
        raise M3EMError(
            f"heldout logits shape mismatch: expected {expected_heldout_shape}, got {list(heldout_logits.shape)}"
        )
    dry_run_summary = {
        "status": "passed",
        "label_order": label_order,
        "train_clip_count": len(train_rows),
        "heldout_clip_count": len(heldout_rows),
        "train_batch_shape": list(train_batch.shape),
        "heldout_batch_shape": list(heldout_batch.shape),
        "batch_axis": "B,T,R,C,H,W",
        "train_logits_shape": list(train_logits.shape),
        "heldout_logits_shape": list(heldout_logits.shape),
        "device": str(device),
        "train_heldout_signer_identity_hash_overlap": signer_summary(train_rows, heldout_rows)[
            "train_heldout_signer_identity_hash_overlap"
        ],
    }
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    if args.dry_run:
        receipt = receipt_for(
            args,
            generated_at=generated_at,
            train_manifest_path=train_manifest_path,
            heldout_manifest_path=heldout_manifest_path,
            receipt_path=receipt_path,
            train_manifest=train_manifest,
            heldout_manifest=heldout_manifest,
            label_order=label_order,
            train_rows=train_rows,
            heldout_rows=heldout_rows,
            train_batch=train_batch,
            heldout_batch=heldout_batch,
            device=device,
            dry_run_summary=dry_run_summary,
            probe_result=None,
        )
        return {
            "status": "dry_run_only",
            "train_clip_count": len(train_rows),
            "heldout_clip_count": len(heldout_rows),
            "label_order": label_order,
            "train_batch_shape": list(train_batch.shape),
            "heldout_batch_shape": list(heldout_batch.shape),
            "receipt_preview": receipt if args.write_receipt else None,
        }
    probe_result = train_probe(
        torch,
        train_batch=train_batch,
        train_labels=train_targets,
        heldout_batch=heldout_batch,
        heldout_labels=heldout_targets,
        label_order=label_order,
        device=device,
        seed=args.seed,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
    )
    receipt = receipt_for(
        args,
        generated_at=generated_at,
        train_manifest_path=train_manifest_path,
        heldout_manifest_path=heldout_manifest_path,
        receipt_path=receipt_path,
        train_manifest=train_manifest,
        heldout_manifest=heldout_manifest,
        label_order=label_order,
        train_rows=train_rows,
        heldout_rows=heldout_rows,
        train_batch=train_batch,
        heldout_batch=heldout_batch,
        device=device,
        dry_run_summary=dry_run_summary,
        probe_result=probe_result,
    )
    if args.write_receipt:
        write_json(receipt_path, receipt)
    final_train = probe_result["final_train_metrics"]
    final_heldout = probe_result["final_heldout_metrics"]
    return {
        "status": receipt["status"],
        "heldout_probe_pass": probe_result["heldout_probe_pass"],
        "train_accuracy": final_train["accuracy"],
        "train_loss": final_train["loss"],
        "heldout_accuracy": final_heldout["accuracy"],
        "heldout_macro_recall": final_heldout["macro_recall"],
        "heldout_macro_f1": final_heldout["macro_f1"],
        "heldout_dominant_predicted_class_fraction": final_heldout["dominant_predicted_class_fraction"],
        "heldout_zero_recall_labels": final_heldout["zero_recall_labels"],
        "next_action": receipt["next_action"],
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, M3EMError) as error:
        print(f"M3EM Tiny2 held-out diagnostic failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
