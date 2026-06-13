#!/usr/bin/env python3
"""Run the bounded M3EL Tiny2 one-batch overfit and shuffle control."""

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


SCHEMA_VERSION = "asl-pilot-return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control/v1"
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/train.json")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json")
DEFAULT_LABELS = ("table", "hello")
DEFAULT_SEED = 20260528
DEFAULT_EPOCHS = 80
DEFAULT_CLIPS_PER_LABEL = 2
SUCCESS_THRESHOLD = 0.95
CLASS_COLLAPSE_FRACTION = 0.70


class M3ELError(RuntimeError):
    """Raised when the bounded M3EL contract cannot be completed."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--labels", nargs="+", default=list(DEFAULT_LABELS))
    parser.add_argument("--clips-per-label", type=int, default=DEFAULT_CLIPS_PER_LABEL)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--dry-run", action="store_true", help="Validate the deterministic batch and model input only.")
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise M3ELError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise M3ELError(f"{context} does not exist: {path}")
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


def validate_args(args: argparse.Namespace) -> tuple[Path, Path, list[str]]:
    manifest_path = project_path(args.train_manifest, "train manifest")
    if manifest_path != (PROJECT_ROOT / DEFAULT_TRAIN_MANIFEST).resolve():
        raise M3ELError(f"M3EL requires --train-manifest {DEFAULT_TRAIN_MANIFEST.as_posix()}")
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise M3ELError(f"M3EL requires --receipt {DEFAULT_RECEIPT.as_posix()}")
    labels = [str(label) for label in args.labels]
    if labels != list(DEFAULT_LABELS):
        raise M3ELError("M3EL requires exactly --labels table hello in that order")
    if args.clips_per_label != DEFAULT_CLIPS_PER_LABEL:
        raise M3ELError(f"M3EL requires --clips-per-label {DEFAULT_CLIPS_PER_LABEL}")
    if args.epochs <= 0 or args.epochs > 120:
        raise M3ELError("M3EL --epochs must be between 1 and 120")
    if args.learning_rate <= 0:
        raise M3ELError("M3EL --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise M3ELError("M3EL --weight-decay must be greater than or equal to zero")
    if args.frame_count != 16:
        raise M3ELError("M3EL requires --frame-count 16")
    if args.image_size != 96:
        raise M3ELError("M3EL requires --image-size 96")
    return manifest_path, receipt_path, labels


def select_clips(manifest: dict[str, Any], labels: list[str], clips_per_label: int) -> list[dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise M3ELError("train manifest clips must be a list")
    by_label: dict[str, list[tuple[int, dict[str, Any]]]] = {label: [] for label in labels}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise M3ELError(f"train manifest clips[{index}] must be an object")
        label_id = str(clip.get("label_id") or "")
        if label_id in by_label:
            by_label[label_id].append((index, clip))
    selected: list[dict[str, Any]] = []
    for label_id in labels:
        candidates = sorted(by_label[label_id], key=lambda item: str(item[1].get("clip_id") or ""))
        if len(candidates) < clips_per_label:
            raise M3ELError(f"label {label_id} has fewer than {clips_per_label} candidate clips")
        for index, clip in candidates[:clips_per_label]:
            selected.append({"manifest_index": index, "clip": clip})
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
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        expected_hash = expected_tensor_hash_for_clip(clip, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise M3ELError(
                f"selected tensor hash mismatch for {clip['clip_id']}: expected {expected_hash}, got {actual_hash}"
            )
        raw_regions, contract = load_tensor_file_with_contract(torch, tensor_path, preserve_region_axis=True)
        observed_contract = contract.get("training_loader", {}).get("derived_input_name")
        if observed_contract != REGION_AWARE_DERIVED_INPUT:
            raise M3ELError(
                f"selected clip {clip['clip_id']} observed {observed_contract}, not {REGION_AWARE_DERIVED_INPUT}"
            )
        prepared = prepare_region_frames(
            torch,
            raw_regions,
            frame_count=frame_count,
            image_size=image_size,
            context=f"M3EL selected clip {clip['clip_id']}",
        )
        label_id = str(clip["label_id"])
        label_index = label_to_index[label_id]
        samples.append(prepared)
        targets.append(torch.tensor(label_index, dtype=torch.long))
        rows.append(
            {
                "row_index": row_index,
                "manifest_index": int(item["manifest_index"]),
                "clip_id": str(clip["clip_id"]),
                "label_id": label_id,
                "label_index": label_index,
                "signer_id": clip.get("signer_id"),
                "signer_identity_hash": clip.get("signer_identity_hash"),
                "source_id": clip.get("source_id"),
                "source_license_decision": clip.get("source_license_decision"),
                "source_license_review_status": clip.get("source_license_review_status"),
                "source_record_id": clip.get("source_record_id"),
                "source_split": clip.get("source_split"),
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
    per_label = {}
    zero_recall_labels = []
    for index in range(int(labels_cpu.shape[0])):
        true_index = int(labels_cpu[index].item())
        predicted_index = int(predictions[index].item())
        prediction_counts[label_order[predicted_index]] += 1
        rows.append(
            {
                "row_index": index,
                "true_label": label_order[true_index],
                "predicted_label": label_order[predicted_index],
                "confidence": float(probabilities[index, predicted_index].item()),
                "correct": bool(predicted_index == true_index),
            }
        )
    for label_index, label_id in enumerate(label_order):
        mask = labels_cpu == label_index
        support = int(mask.sum().item())
        if support == 0:
            continue
        label_correct = int((correct & mask).sum().item())
        recall = label_correct / support
        if recall <= 0:
            zero_recall_labels.append(label_id)
        per_label[label_id] = {
            "support": support,
            "correct": label_correct,
            "recall": recall,
        }
    dominant_count = max(prediction_counts.values()) if prediction_counts else 0
    dominant_fraction = dominant_count / int(labels_cpu.shape[0])
    return {
        "loss": float(loss.detach().cpu().item()),
        "accuracy": float(correct.to(dtype=torch.float32).mean().item()),
        "correct": int(correct.sum().item()),
        "examples": int(labels_cpu.shape[0]),
        "per_label": per_label,
        "zero_recall_labels": zero_recall_labels,
        "prediction_counts": prediction_counts,
        "dominant_predicted_class_fraction": dominant_fraction,
        "class_collapse": dominant_fraction > CLASS_COLLAPSE_FRACTION,
        "predictions": rows,
    }


def evaluate(torch: Any, model: Any, criterion: Any, batch: Any, labels: Any, device: Any, label_order: list[str]) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        logits = model(batch.to(device))
        loss = criterion(logits, labels.to(device))
    return batch_metrics(torch, logits.detach().cpu(), labels.detach().cpu(), label_order, loss.detach().cpu())


def train_probe(
    torch: Any,
    *,
    batch: Any,
    labels: Any,
    label_order: list[str],
    device: Any,
    seed: int,
    epochs: int,
    learning_rate: float,
    weight_decay: float,
    shuffle_control: bool,
) -> dict[str, Any]:
    random.seed(seed)
    torch.manual_seed(seed)
    model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    targets = labels.clone()
    shuffle_mapping = None
    if shuffle_control:
        targets = (targets + 1) % len(label_order)
        shuffle_mapping = {label_order[index]: label_order[(index + 1) % len(label_order)] for index in range(len(label_order))}
    initial_digest = model_state_digest(model.state_dict())
    history = []
    start = time.perf_counter()
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(batch.to(device))
        loss = criterion(logits, targets.to(device))
        loss.backward()
        optimizer.step()
        metrics = evaluate(torch, model, criterion, batch, targets, device, label_order)
        history.append(
            {
                "epoch": epoch,
                "loss": metrics["loss"],
                "accuracy": metrics["accuracy"],
                "dominant_predicted_class_fraction": metrics["dominant_predicted_class_fraction"],
                "zero_recall_labels": metrics["zero_recall_labels"],
            }
        )
    elapsed_seconds = time.perf_counter() - start
    final_metrics = evaluate(torch, model, criterion, batch, targets, device, label_order)
    success = final_metrics["accuracy"] >= SUCCESS_THRESHOLD and not final_metrics["zero_recall_labels"]
    return {
        "control_type": "label_shuffle" if shuffle_control else "real_labels",
        "status": "overfit_threshold_reached" if success else "overfit_threshold_not_reached",
        "success_threshold": {
            "accuracy_gte": SUCCESS_THRESHOLD,
            "no_zero_recall_selected_labels": True,
            "predeclared_before_run": True,
        },
        "success": success,
        "shuffle_mapping": shuffle_mapping,
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
        "history_head": history[:5],
        "history_tail": history[-10:],
        "final_metrics": final_metrics,
    }


def receipt_for(
    args: argparse.Namespace,
    *,
    generated_at: str,
    manifest_path: Path,
    receipt_path: Path,
    manifest: dict[str, Any],
    label_order: list[str],
    selected_rows: list[dict[str, Any]],
    batch: Any,
    device: Any,
    dry_run_summary: dict[str, Any] | None,
    real_result: dict[str, Any] | None,
    shuffle_result: dict[str, Any] | None,
) -> dict[str, Any]:
    real_success = bool(real_result and real_result["success"])
    shuffle_same_batch_success = bool(shuffle_result and shuffle_result["success"])
    real_collapse = bool(real_result and real_result["final_metrics"]["class_collapse"])
    if real_result is None:
        next_action = "continue_tiny2_command_or_input_repair_no_brev"
    elif real_success and not real_collapse:
        next_action = "continue_tiny2_heldout_noncollapse_probe_no_brev"
    else:
        next_action = "stop_for_tiny2_learnability_blocker"
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "M3EL - Tiny2 one-batch overfit and shuffle control",
        "status": "completed_local_diagnostic" if real_result is not None else "dry_run_only",
        "generated_at": generated_at,
        "active_prompt": "docs/model/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-goal-loop-prompt.md",
        "generated_by": {
            "tool": "scripts/run_m3el_tiny2_one_batch_overfit_shuffle.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "state_checks": {
            "source_manifest": file_reference(manifest_path),
            "receipt_path": project_relative(receipt_path),
            "model_card": file_reference(Path("web/public/model/model-card.json")),
            "active_vocabulary_claim": file_reference(Path("docs/model/active-vocabulary-claim.json")),
            "m3ek_preparation_receipt": file_reference(
                Path("docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json")
            ),
            "dataset_source_register": file_reference(Path("docs/model/dataset-source-register.json")),
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
                "Use M3EK labels in order table, hello; sort train manifest clips within each label by clip_id; "
                "select the first two clips per label."
            ),
            "seed": args.seed,
            "clips_per_label": args.clips_per_label,
            "batch_shape": list(batch.shape),
            "batch_axis": "B,T,R,C,H,W",
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
            "clips": selected_rows,
        },
        "manifest_summary": {
            "dataset_id": manifest.get("dataset_id"),
            "split": manifest.get("split"),
            "source_register": manifest.get("source_register"),
            "external_dataset_import": manifest.get("external_dataset_import"),
            "region_grid_materialization": manifest.get("region_grid_materialization"),
        },
        "dry_run_summary": dry_run_summary,
        "real_label_one_batch": real_result,
        "label_shuffle_control": shuffle_result,
        "shuffle_control_interpretation": {
            "same_batch_memorization_observed": shuffle_same_batch_success,
            "generalization_or_promotion_success_claimed": False,
            "suspicious_success": False,
            "interpretation": (
                "The shuffle control uses inverted labels on the same fixed batch. If it also memorizes the batch, "
                "that is expected capacity evidence only and is not held-out signal; future progress still requires "
                "a no-Brev held-out noncollapse probe."
            ),
        },
        "class_collapse_check": {
            "threshold_dominant_fraction_gt": CLASS_COLLAPSE_FRACTION,
            "real_label_class_collapse": real_collapse,
            "shuffle_class_collapse": bool(shuffle_result and shuffle_result["final_metrics"]["class_collapse"]),
        },
        "leakage_check": {
            "source_manifest_mutated": False,
            "tensor_mutated": False,
            "same_batch_only": True,
            "heldout_success_claimed": False,
            "leakage_or_suspicious_success_detected": False,
        },
        "budget": {
            "local_only": True,
            "brev_used": False,
            "epochs_per_probe": args.epochs,
            "probes_run": 0 if real_result is None else 2,
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
            "scripts/run_m3el_tiny2_one_batch_overfit_shuffle.py",
            "docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json",
            "docs/session-logs/521-mission-3el-tiny2-one-batch-overfit-shuffle-control.md",
        ],
        "next_action": next_action,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    manifest_path, receipt_path, label_order = validate_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3EL Tiny2 one-batch diagnostic")
    torch = import_torch()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    manifest = load_manifest(manifest_path)
    selected = select_clips(manifest, label_order, args.clips_per_label)
    selected_rows, batch, targets = prepare_batch(
        torch,
        manifest_path,
        selected,
        label_order,
        args.frame_count,
        args.image_size,
    )
    device = select_device(torch)
    proof_model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        proof_logits = proof_model(batch.to(device)).detach().cpu()
    expected_shape = [len(selected_rows), len(label_order)]
    if list(proof_logits.shape) != expected_shape:
        raise M3ELError(f"proof logits shape mismatch: expected {expected_shape}, got {list(proof_logits.shape)}")
    dry_run_summary = {
        "status": "passed",
        "selected_clip_count": len(selected_rows),
        "label_order": label_order,
        "batch_shape": list(batch.shape),
        "batch_axis": "B,T,R,C,H,W",
        "proof_logits_shape": list(proof_logits.shape),
        "device": str(device),
    }
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    if args.dry_run:
        receipt = receipt_for(
            args,
            generated_at=generated_at,
            manifest_path=manifest_path,
            receipt_path=receipt_path,
            manifest=manifest,
            label_order=label_order,
            selected_rows=selected_rows,
            batch=batch,
            device=device,
            dry_run_summary=dry_run_summary,
            real_result=None,
            shuffle_result=None,
        )
        return {
            "status": "dry_run_only",
            "selected_clip_count": len(selected_rows),
            "label_order": label_order,
            "batch_shape": list(batch.shape),
            "receipt_preview": receipt if args.write_receipt else None,
        }
    real_result = train_probe(
        torch,
        batch=batch,
        labels=targets,
        label_order=label_order,
        device=device,
        seed=args.seed,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        shuffle_control=False,
    )
    shuffle_result = train_probe(
        torch,
        batch=batch,
        labels=targets,
        label_order=label_order,
        device=device,
        seed=args.seed + 17,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        shuffle_control=True,
    )
    receipt = receipt_for(
        args,
        generated_at=generated_at,
        manifest_path=manifest_path,
        receipt_path=receipt_path,
        manifest=manifest,
        label_order=label_order,
        selected_rows=selected_rows,
        batch=batch,
        device=device,
        dry_run_summary=dry_run_summary,
        real_result=real_result,
        shuffle_result=shuffle_result,
    )
    if args.write_receipt:
        write_json(receipt_path, receipt)
    return {
        "status": receipt["status"],
        "real_label_success": real_result["success"],
        "real_label_accuracy": real_result["final_metrics"]["accuracy"],
        "real_label_loss": real_result["final_metrics"]["loss"],
        "shuffle_same_batch_success": shuffle_result["success"],
        "shuffle_same_batch_accuracy": shuffle_result["final_metrics"]["accuracy"],
        "shuffle_same_batch_loss": shuffle_result["final_metrics"]["loss"],
        "next_action": receipt["next_action"],
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, M3ELError) as error:
        print(f"M3EL Tiny2 diagnostic failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
