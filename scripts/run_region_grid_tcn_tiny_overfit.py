#!/usr/bin/env python3
"""Run one bounded tiny overfit probe for the region-grid true TCN path."""

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
    HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    REGION_AWARE_MODEL_INPUT_AXIS,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    ManifestError,
    RawFrameClipDataset,
    TrainingError,
    build_model,
    clone_state_dict_to_cpu,
    environment_file_references,
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
    validate_manifest,
)


OUTPUT_DIR = (PROJECT_ROOT / "output" / "m3ax-region-grid-tcn-tiny-overfit").resolve()
RECEIPT_PATH = PROJECT_ROOT / "docs" / "validation" / "return-to-form-region-grid-tcn-tiny-overfit-v1.json"
SCHEMA_VERSION = "asl-pilot-region-grid-tcn-tiny-overfit/v1"
MODEL_ID = "asl-pilot-asl-citizen-region-grid-tcn-tiny-overfit-v1"
DEFAULT_SEED = 20260527
DEFAULT_EPOCHS = 120
SUCCESS_THRESHOLD = 0.95


class TinyOverfitError(RuntimeError):
    """Raised when the M3AX tiny overfit contract cannot be run."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--train-manifest",
        type=Path,
        default=Path(HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE),
        help="Exact high-signal region-grid training manifest.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("output/m3ax-region-grid-tcn-tiny-overfit"),
        help="Exact ignored M3AX output directory.",
    )
    parser.add_argument(
        "--receipt",
        type=Path,
        default=Path("docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json"),
        help="Tracked receipt path to write with --write-receipt.",
    )
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--clips-per-label", type=int, choices=(1, 2), default=1)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch-size", type=int, default=7)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--check-files", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Run subset and model-input proof only.")
    parser.add_argument("--write-receipt", action="store_true", help="Write the tracked M3AX receipt.")
    parser.add_argument(
        "--recover-from-existing-output",
        action="store_true",
        help="Write receipt from the saved model/subset after a post-training receipt-write failure; does not train.",
    )
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise TinyOverfitError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise TinyOverfitError(f"{context} does not exist: {path}")
    return resolved


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    if isinstance(value, set):
        return sorted(json_ready(item) for item in value)
    if isinstance(value, Path):
        return value.as_posix()
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(json_ready(value), indent=2, sort_keys=True) + "\n", encoding="utf-8")


def command_for_args(
    args: argparse.Namespace,
    *,
    dry_run: bool,
    write_receipt: bool,
    recover_from_existing_output: bool = False,
) -> list[str]:
    command = [
        sys.executable,
        "scripts/run_region_grid_tcn_tiny_overfit.py",
        "--train-manifest",
        HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
        "--output-dir",
        "output/m3ax-region-grid-tcn-tiny-overfit",
        "--receipt",
        "docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json",
        "--clips-per-label",
        str(args.clips_per_label),
        "--epochs",
        str(args.epochs),
        "--batch-size",
        str(args.batch_size),
        "--learning-rate",
        str(args.learning_rate),
        "--weight-decay",
        str(args.weight_decay),
        "--frame-count",
        str(args.frame_count),
        "--image-size",
        str(args.image_size),
        "--num-workers",
        str(args.num_workers),
        "--check-files",
    ]
    if dry_run:
        command.append("--dry-run")
    if write_receipt:
        command.append("--write-receipt")
    if recover_from_existing_output:
        command.append("--recover-from-existing-output")
    return command


def validate_contract_args(args: argparse.Namespace) -> tuple[Path, Path, Path]:
    manifest_path = project_path(args.train_manifest, "train manifest")
    expected_manifest = (PROJECT_ROOT / HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE).resolve()
    if manifest_path != expected_manifest:
        raise TinyOverfitError(
            f"M3AX requires --train-manifest {HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE}"
        )
    output_dir = project_path(args.output_dir, "output dir", must_exist=False)
    if output_dir != OUTPUT_DIR:
        raise TinyOverfitError("M3AX requires --output-dir output/m3ax-region-grid-tcn-tiny-overfit")
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    if receipt_path != RECEIPT_PATH:
        raise TinyOverfitError(
            "M3AX requires --receipt docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json"
        )
    if not args.check_files:
        raise TinyOverfitError("M3AX requires --check-files")
    if args.frame_count != 16:
        raise TinyOverfitError("M3AX requires --frame-count 16")
    if args.image_size != 96:
        raise TinyOverfitError("M3AX requires --image-size 96")
    if args.num_workers != 0:
        raise TinyOverfitError("M3AX requires --num-workers 0")
    if args.epochs <= 0 or args.epochs > 200:
        raise TinyOverfitError("M3AX --epochs must be between 1 and 200")
    if args.learning_rate <= 0:
        raise TinyOverfitError("M3AX --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise TinyOverfitError("M3AX --weight-decay must be greater than or equal to zero")
    return manifest_path, output_dir, receipt_path


def select_subset(manifest: dict[str, Any], clips_per_label: int) -> list[dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list) or not clips:
        raise TinyOverfitError("train manifest clips must be a non-empty array")
    labels = manifest.get("labels")
    if not isinstance(labels, list) or not labels:
        raise TinyOverfitError("train manifest labels must be a non-empty array")
    label_names = {}
    for label in labels:
        if not isinstance(label, dict):
            raise TinyOverfitError("train manifest labels must be objects")
        label_id = str(label.get("label_id") or "")
        if not label_id:
            raise TinyOverfitError("train manifest label lacks label_id")
        label_names[label_id] = str(label.get("display_text") or label_id)
    by_label: dict[str, list[tuple[int, dict[str, Any]]]] = {}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise TinyOverfitError(f"train manifest clips[{index}] must be an object")
        label_id = str(clip.get("label_id") or "")
        clip_id = str(clip.get("clip_id") or "")
        if not label_id or not clip_id:
            raise TinyOverfitError(f"train manifest clips[{index}] lacks label_id or clip_id")
        by_label.setdefault(label_id, []).append((index, clip))
    selected: list[dict[str, Any]] = []
    for label_id in sorted(by_label):
        candidates = sorted(by_label[label_id], key=lambda item: str(item[1].get("clip_id")))
        if len(candidates) < clips_per_label:
            raise TinyOverfitError(f"label {label_id} has fewer than {clips_per_label} clips")
        for index, clip in candidates[:clips_per_label]:
            selected.append(
                {
                    "manifest_index": index,
                    "clip": clip,
                    "label_name": label_names.get(label_id, label_id),
                }
            )
    return selected


def subset_contract_evidence(
    torch: Any,
    dataset: RawFrameClipDataset,
    selected: list[dict[str, Any]],
    frame_count: int,
    image_size: int,
) -> tuple[list[dict[str, Any]], Any, Any]:
    samples = []
    labels = []
    rows = []
    for selected_item in selected:
        index = int(selected_item["manifest_index"])
        clip = selected_item["clip"]
        record = dataset.records[index]
        tensor_path = Path(record["tensor_path"])
        expected_hash = str(clip.get("frame_tensor_sha256") or "")
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_hash:
            raise TinyOverfitError(
                f"selected tensor hash mismatch for {record['clip_id']}: expected {expected_hash}, got {actual_hash}"
            )
        raw_regions, contract = load_tensor_file_with_contract(
            torch,
            tensor_path,
            preserve_region_axis=True,
        )
        observed_contract = contract.get("training_loader", {}).get("derived_input_name")
        if observed_contract != REGION_AWARE_DERIVED_INPUT:
            raise TinyOverfitError(
                f"selected clip {record['clip_id']} observed {observed_contract}, not {REGION_AWARE_DERIVED_INPUT}"
            )
        prepared = prepare_region_frames(
            torch,
            raw_regions,
            frame_count=frame_count,
            image_size=image_size,
            context=f"tiny subset clip {record['clip_id']}",
        )
        sample, label = dataset[index]
        if list(sample.shape) != list(prepared.shape):
            raise TinyOverfitError(f"dataset sample shape mismatch for {record['clip_id']}")
        samples.append(sample)
        labels.append(label)
        rows.append(
            {
                "clip_id": record["clip_id"],
                "label_id": record["label_id"],
                "label_name": str(selected_item["label_name"]),
                "label_index": int(label.item()),
                "manifest_index": index,
                "tensor_path": tensor_path.resolve().relative_to(PROJECT_ROOT).as_posix(),
                "tensor_sha256": actual_hash,
                "source_gloss": str(clip.get("source_gloss") or record["label_id"]),
                "raw_rgb_regions_shape": list(raw_regions.shape),
                "prepared_model_input_shape": list(prepared.shape),
                "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
                "region_ids": contract.get("region_ids"),
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
    return rows, torch.stack(samples, dim=0), torch.stack(labels, dim=0)


def metrics_for_logits(torch: Any, logits: Any, labels: Any, labels_by_index: list[str], loss: Any) -> dict[str, Any]:
    predictions = logits.argmax(dim=1)
    correct_mask = predictions == labels
    per_label = {}
    zero_recall_labels = []
    for label_index, label_id in enumerate(labels_by_index):
        mask = labels == label_index
        support = int(mask.sum().detach().cpu().item())
        if support == 0:
            continue
        correct = int((correct_mask & mask).sum().detach().cpu().item())
        recall = correct / support
        if recall <= 0:
            zero_recall_labels.append(label_id)
        per_label[label_id] = {
            "support": support,
            "correct": correct,
            "recall": recall,
        }
    rows = []
    probabilities = torch.softmax(logits, dim=1).detach().cpu()
    predictions_cpu = predictions.detach().cpu()
    labels_cpu = labels.detach().cpu()
    for index in range(int(labels_cpu.shape[0])):
        predicted_index = int(predictions_cpu[index].item())
        true_index = int(labels_cpu[index].item())
        rows.append(
            {
                "row_index": index,
                "true_label": labels_by_index[true_index],
                "predicted_label": labels_by_index[predicted_index],
                "confidence": float(probabilities[index, predicted_index].item()),
                "correct": predicted_index == true_index,
            }
        )
    return {
        "loss": float(loss.detach().cpu().item()),
        "accuracy": float(correct_mask.to(dtype=torch.float32).mean().detach().cpu().item()),
        "correct": int(correct_mask.sum().detach().cpu().item()),
        "examples": int(labels.shape[0]),
        "per_label": per_label,
        "zero_recall_labels": zero_recall_labels,
        "predictions": rows,
    }


def evaluate_batch(torch: Any, model: Any, criterion: Any, batch: Any, labels: Any, device: Any, labels_by_index: list[str]) -> dict[str, Any]:
    model.eval()
    with torch.no_grad():
        logits = model(batch.to(device))
        loss = criterion(logits, labels.to(device))
    return metrics_for_logits(torch, logits.detach().cpu(), labels.detach().cpu(), labels_by_index, loss.detach().cpu())


def train_tiny_overfit(
    torch: Any,
    args: argparse.Namespace,
    batch: Any,
    labels: Any,
    labels_by_index: list[str],
    device: Any,
) -> tuple[Any, dict[str, Any]]:
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    model = build_model(torch, len(labels_by_index), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    initial_digest = model_state_digest(model.state_dict())
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    generator = torch.Generator().manual_seed(args.seed)
    history = []
    best_metrics: dict[str, Any] | None = None
    start = time.perf_counter()

    for epoch in range(1, args.epochs + 1):
        model.train()
        permutation = torch.randperm(int(labels.shape[0]), generator=generator)
        total_loss = 0.0
        total_correct = 0
        total_seen = 0
        for start_index in range(0, int(labels.shape[0]), args.batch_size):
            indexes = permutation[start_index : start_index + args.batch_size]
            frames = batch.index_select(0, indexes).to(device)
            targets = labels.index_select(0, indexes).to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(frames)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu().item()) * int(targets.shape[0])
            total_correct += int((logits.argmax(dim=1) == targets).sum().detach().cpu().item())
            total_seen += int(targets.shape[0])
        eval_metrics = evaluate_batch(torch, model, criterion, batch, labels, device, labels_by_index)
        epoch_row = {
            "epoch": epoch,
            "train_mode_loss": total_loss / total_seen,
            "train_mode_accuracy": total_correct / total_seen,
            "eval_mode_loss": eval_metrics["loss"],
            "eval_mode_accuracy": eval_metrics["accuracy"],
            "zero_recall_labels": eval_metrics["zero_recall_labels"],
        }
        history.append(epoch_row)
        if best_metrics is None or eval_metrics["accuracy"] > best_metrics["accuracy"] or (
            eval_metrics["accuracy"] == best_metrics["accuracy"] and eval_metrics["loss"] < best_metrics["loss"]
        ):
            best_metrics = {"epoch": epoch, **eval_metrics}

    elapsed_seconds = time.perf_counter() - start
    final_metrics = evaluate_batch(torch, model, criterion, batch, labels, device, labels_by_index)
    final_digest = model_state_digest(model.state_dict())
    success = final_metrics["accuracy"] >= SUCCESS_THRESHOLD and not final_metrics["zero_recall_labels"]
    return model, {
        "status": "succeeded" if success else "failed",
        "success_threshold": {
            "accuracy_gte": SUCCESS_THRESHOLD,
            "no_zero_recall_selected_labels": True,
            "predeclared_before_run": True,
        },
        "success": success,
        "runtime": {
            "device": str(device),
            "elapsed_seconds": elapsed_seconds,
            "python": platform.python_version(),
            "torch": torch.__version__,
        },
        "initial_model_state_digest": initial_digest,
        "final_model_state_digest": final_digest,
        "history": history,
        "history_tail": history[-10:],
        "best_eval_metrics": best_metrics,
        "final_eval_metrics": final_metrics,
    }


def recover_tiny_overfit(
    torch: Any,
    args: argparse.Namespace,
    output_dir: Path,
    batch: Any,
    labels: Any,
    labels_by_index: list[str],
    device: Any,
) -> tuple[Any, dict[str, Any]]:
    model_path = output_dir / "model_state.pt"
    subset_path = output_dir / "selected-subset.json"
    if not model_path.exists():
        raise TinyOverfitError(f"cannot recover receipt; missing saved checkpoint: {model_path}")
    if not subset_path.exists():
        raise TinyOverfitError(f"cannot recover receipt; missing selected subset: {subset_path}")
    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    if not isinstance(checkpoint, dict) or "model_state" not in checkpoint:
        raise TinyOverfitError(f"cannot recover receipt; invalid checkpoint: {model_path}")
    subset_report = json.loads(subset_path.read_text(encoding="utf-8"))
    subset_clip_ids = list(checkpoint.get("subset_clip_ids") or [])
    expected_clip_ids = [str(row["clip_id"]) for row in subset_report.get("clips", [])]
    if subset_clip_ids != expected_clip_ids:
        raise TinyOverfitError("cannot recover receipt; checkpoint subset ids do not match selected-subset.json")

    model = build_model(torch, len(labels_by_index), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    model.load_state_dict(checkpoint["model_state"])
    criterion = torch.nn.CrossEntropyLoss()
    final_metrics = evaluate_batch(torch, model, criterion, batch, labels, device, labels_by_index)
    final_digest = model_state_digest(model.state_dict())
    success = final_metrics["accuracy"] >= SUCCESS_THRESHOLD and not final_metrics["zero_recall_labels"]
    return model, {
        "status": "succeeded" if success else "failed",
        "success_threshold": {
            "accuracy_gte": SUCCESS_THRESHOLD,
            "no_zero_recall_selected_labels": True,
            "predeclared_before_run": True,
        },
        "success": success,
        "runtime": {
            "device": str(device),
            "elapsed_seconds": None,
            "python": platform.python_version(),
            "torch": torch.__version__,
            "recovered_from_existing_output": True,
            "recovery_reason": (
                "The single authorized training command saved model_state.pt and selected-subset.json, "
                "then failed while serializing JSON provenance because manifest summary label ids were a set. "
                "This recovery path loads that saved checkpoint and evaluates it without another training run."
            ),
        },
        "initial_model_state_digest": checkpoint.get("initial_model_state_digest"),
        "final_model_state_digest": final_digest,
        "checkpoint_recorded_final_model_state_digest": checkpoint.get("final_model_state_digest"),
        "history": None,
        "history_unavailable_reason": "Original training history was not persisted before the receipt-write failure.",
        "history_tail": None,
        "best_eval_metrics": None,
        "final_eval_metrics": final_metrics,
    }


def build_receipt(
    args: argparse.Namespace,
    manifest_summary: dict[str, Any],
    subset_rows: list[dict[str, Any]],
    batch: Any,
    proof_logits_shape: list[int],
    training_result: dict[str, Any] | None,
    artifacts: list[dict[str, str]],
    generated_at: str,
) -> dict[str, Any]:
    success = bool(training_result and training_result["success"])
    return {
        "schema_version": SCHEMA_VERSION,
        "status": "tiny_overfit_succeeded" if success else "tiny_overfit_failed",
        "mission": "M3AX",
        "active_prompt": "docs/model/return-to-form-region-grid-tcn-tiny-overfit-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/run_region_grid_tcn_tiny_overfit.py",
            "command": [sys.executable, *sys.argv],
            "script": file_reference(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "changed_files": [
            file_reference(Path("scripts/run_region_grid_tcn_tiny_overfit.py")),
        ],
        "source_manifest": {
            "path": manifest_summary["path"],
            "sha256": manifest_summary["sha256"],
            "split": manifest_summary["split"],
            "dataset_id": manifest_summary["dataset_id"],
            "label_count": manifest_summary["label_count"],
            "clip_count": manifest_summary["clip_count"],
        },
        "subset": {
            "selection_rule": "sort labels lexicographically, sort clips within each label by clip_id, select first clips_per_label",
            "clips_per_label": args.clips_per_label,
            "clip_count": len(subset_rows),
            "labels": sorted(
                {
                    row["label_id"]: {
                        "label_id": row["label_id"],
                        "label_name": row["label_name"],
                    }
                    for row in subset_rows
                }.values(),
                key=lambda row: row["label_id"],
            ),
            "clips": subset_rows,
        },
        "commands": {
            "dry_run_input_contract_proof": command_for_args(args, dry_run=True, write_receipt=False),
            "single_local_overfit_probe": command_for_args(args, dry_run=False, write_receipt=True),
            "receipt_recovery": (
                [sys.executable, *sys.argv]
                if args.recover_from_existing_output
                else None
            ),
            "probe_evaluation": (
                "After each epoch and at the end, the script evaluates accuracy, loss, predictions, "
                "and per-label recall on the same deterministic tiny subset."
            ),
            "json_validation": [
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json",
                ],
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "output/m3ax-region-grid-tcn-tiny-overfit/selected-subset.json",
                ],
                [
                    "python3",
                    "-m",
                    "json.tool",
                    "output/m3ax-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json",
                ],
            ],
        },
        "input_contract": {
            "required_contract": REGION_AWARE_DERIVED_INPUT,
            "status": "passed",
            "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"] if subset_rows else None,
            "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"] if subset_rows else None,
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
            "batched_model_input_shape": list(batch.shape),
            "batched_model_input_axis": "B,T,R,C,H,W",
            "logits_shape": proof_logits_shape,
            "region_axis_preserved_until": "TrueTemporalConvNetRawFrameClassifier.region_attention",
            "no_mosaic_training_path": True,
        },
        "caps": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "num_workers": args.num_workers,
            "local_only": True,
        },
        "training_result": training_result,
        "output_artifacts": artifacts,
        "guardrails": {
            "initialization": "random",
            "pretrained_components": [],
            "brev_used": False,
            "external_media_imported": False,
            "model_exported": False,
            "model_promoted": False,
            "browser_or_final_claims_changed": False,
            "final_gates_changed": False,
            "normal_training_retry": False,
        },
        "conclusion": (
            "The current region-grid true TCN memorized the deterministic tiny subset within the predeclared threshold. "
            "This is diagnostic only and does not authorize broad training, export, promotion, or browser activation."
            if success
            else "The current region-grid true TCN did not memorize the deterministic tiny subset within the predeclared threshold. "
            "This is diagnostic only and stops the current training lane pending representation/data/crop/vocabulary backtrack."
        ),
        "exactly_one_next_action": (
            "continue_vocab_crop_separability_diagnosis_no_training"
            if success
            else "stop_training_lane_for_representation_backtrack"
        ),
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    manifest_path, output_dir, receipt_path = validate_contract_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3AX tiny overfit")
    torch = import_torch()
    manifest_summary = validate_manifest(
        manifest_path,
        "train",
        args.check_files,
        False,
        False,
        False,
        True,
    )
    manifest = load_manifest(manifest_path)
    selected = select_subset(manifest, args.clips_per_label)
    expected_subset_size = int(manifest_summary["label_count"]) * args.clips_per_label
    if len(selected) != expected_subset_size:
        raise TinyOverfitError(f"selected subset size {len(selected)} does not match {expected_subset_size}")
    if args.batch_size != len(selected):
        raise TinyOverfitError(f"M3AX requires full-subset --batch-size {len(selected)} for this selection")

    label_ids = sorted(str(label_id) for label_id in manifest_summary["label_ids"])
    label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
    dataset = RawFrameClipDataset(
        torch,
        manifest_path,
        "train",
        label_to_index,
        frame_count=args.frame_count,
        image_size=args.image_size,
        require_decode_provenance=False,
        preserve_region_axis=True,
    )
    subset_rows, batch, labels = subset_contract_evidence(
        torch,
        dataset,
        selected,
        args.frame_count,
        args.image_size,
    )
    device = select_device(torch)
    proof_model = build_model(torch, len(label_ids), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        proof_logits = proof_model(batch.to(device)).detach().cpu()
    if list(proof_logits.shape) != [len(selected), len(label_ids)]:
        raise TinyOverfitError(f"proof logits shape mismatch: {list(proof_logits.shape)}")

    proof_summary = {
        "status": "dry_run_only" if args.dry_run else "ready_for_single_probe",
        "subset_clip_count": len(selected),
        "labels": label_ids,
        "input_contract": {
            "required_contract": REGION_AWARE_DERIVED_INPUT,
            "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"],
            "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"],
            "batched_model_input_shape": list(batch.shape),
            "batched_model_input_axis": "B,T,R,C,H,W",
            "logits_shape": list(proof_logits.shape),
        },
        "command": [sys.executable, *sys.argv],
    }
    if args.dry_run:
        return proof_summary

    output_dir.mkdir(parents=True, exist_ok=True)
    if args.recover_from_existing_output:
        model, training_result = recover_tiny_overfit(
            torch,
            args,
            output_dir,
            batch,
            labels,
            label_ids,
            device,
        )
    else:
        model, training_result = train_tiny_overfit(torch, args, batch, labels, label_ids, device)
    model_path = output_dir / "model_state.pt"
    subset_path = output_dir / "selected-subset.json"
    provenance_path = output_dir / "tiny-overfit-provenance.json"
    if not args.recover_from_existing_output:
        checkpoint = {
            "model_state": clone_state_dict_to_cpu(model.state_dict()),
            "label_to_index": label_to_index,
            "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "model_id": args.model_id,
            "subset_clip_ids": [row["clip_id"] for row in subset_rows],
            "initial_model_state_digest": training_result["initial_model_state_digest"],
            "final_model_state_digest": training_result["final_model_state_digest"],
        }
        torch.save(checkpoint, model_path)
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    subset_report = {
        "schema_version": "asl-pilot-region-grid-tcn-tiny-overfit-subset/v1",
        "generated_at": generated_at,
        "selection_rule": "sort labels lexicographically, sort clips within each label by clip_id, select first clips_per_label",
        "source_manifest": manifest_summary["path"],
        "clips_per_label": args.clips_per_label,
        "clips": subset_rows,
    }
    write_json(subset_path, subset_report)
    provenance = {
        "schema_version": "asl-pilot-region-grid-tcn-tiny-overfit-provenance/v1",
        "generated_at": generated_at,
        "model_id": args.model_id,
        "command": [sys.executable, *sys.argv],
        "script": file_reference(Path(__file__)),
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "initialization": "random",
        "pretrained_components": [],
        "source_manifest": manifest_summary,
        "input_contract": proof_summary["input_contract"],
        "subset": subset_report,
        "training_result": training_result,
        "model_artifact": model_path.resolve().relative_to(PROJECT_ROOT).as_posix(),
    }
    write_json(provenance_path, provenance)
    artifacts = [
        file_reference(model_path),
        file_reference(subset_path),
        file_reference(provenance_path),
    ]
    receipt = build_receipt(
        args,
        manifest_summary,
        subset_rows,
        batch,
        list(proof_logits.shape),
        training_result,
        artifacts,
        generated_at,
    )
    if args.write_receipt:
        write_json(receipt_path, receipt)
        artifacts.append(file_reference(receipt_path))
    return {
        "status": receipt["status"],
        "success": training_result["success"],
        "final_accuracy": training_result["final_eval_metrics"]["accuracy"],
        "zero_recall_labels": training_result["final_eval_metrics"]["zero_recall_labels"],
        "next_action": receipt["exactly_one_next_action"],
        "output_dir": output_dir.resolve().relative_to(PROJECT_ROOT).as_posix(),
        "receipt": receipt_path.resolve().relative_to(PROJECT_ROOT).as_posix() if args.write_receipt else None,
        "artifacts": artifacts,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, TinyOverfitError) as error:
        print(f"M3AX tiny overfit failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
