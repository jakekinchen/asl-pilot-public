#!/usr/bin/env python3
"""Run the M3CK PopSign fresh5 architecture/input tiny train-fit microprobe."""

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

from run_region_grid_tcn_tiny_overfit import (
    SUCCESS_THRESHOLD,
    TinyOverfitError,
    evaluate_batch,
    json_ready,
    select_subset,
    subset_contract_evidence,
    write_json,
)
from train_rawframe_model import (
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    REGION_AWARE_MODEL_INPUT_AXIS,
    SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
    ManifestError,
    RawFrameClipDataset,
    TrainingError,
    build_model,
    clone_state_dict_to_cpu,
    environment_file_references,
    file_reference,
    import_torch,
    load_manifest,
    local_ml_environment_reference,
    model_state_digest,
    require_current_local_ml_environment,
    select_device,
    should_verify_retained_local_ml_environment,
    validate_manifest,
)


SCHEMA_VERSION = "asl-pilot-popsign-fresh5-architecture-input-microprobe/v1"
MODEL_ID = "asl-pilot-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit-v1"
DEFAULT_SEED = 20260528
DEFAULT_EPOCHS = 120
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
DEFAULT_OUTPUT_DIR = Path("output/m3ck-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")

M3CE_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3CA_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--clips-per-label", type=int, default=1)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--check-files", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
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


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def command_for_args(args: argparse.Namespace) -> list[str]:
    command = [
        sys.executable,
        "scripts/run_popsign_fresh5_architecture_input_microprobe.py",
        "--train-manifest",
        project_relative(project_path(args.train_manifest, "train manifest")),
        "--validation-manifest",
        project_relative(project_path(args.validation_manifest, "validation manifest")),
        "--test-manifest",
        project_relative(project_path(args.test_manifest, "test manifest")),
        "--output-dir",
        project_relative(project_path(args.output_dir, "output dir", must_exist=False)),
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
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
        "--seed",
        str(args.seed),
        "--check-files",
        "--write-receipt",
    ]
    return command


def validate_contract_args(args: argparse.Namespace) -> tuple[Path, Path, Path, Path, Path]:
    train_manifest = project_path(args.train_manifest, "train manifest")
    validation_manifest = project_path(args.validation_manifest, "validation manifest")
    test_manifest = project_path(args.test_manifest, "test manifest")
    output_dir = project_path(args.output_dir, "output dir", must_exist=False)
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    expected = {
        train_manifest: DEFAULT_TRAIN_MANIFEST,
        validation_manifest: DEFAULT_VALIDATION_MANIFEST,
        test_manifest: DEFAULT_TEST_MANIFEST,
        output_dir: DEFAULT_OUTPUT_DIR,
        receipt_path: DEFAULT_RECEIPT,
    }
    for actual, expected_relative in expected.items():
        expected_path = (PROJECT_ROOT / expected_relative).resolve()
        if actual != expected_path:
            raise TinyOverfitError(f"M3CK requires {expected_relative.as_posix()}, got {project_relative(actual)}")
    if not args.check_files:
        raise TinyOverfitError("M3CK requires --check-files")
    if not args.write_receipt:
        raise TinyOverfitError("M3CK requires --write-receipt")
    if not 1 <= args.clips_per_label <= 5:
        raise TinyOverfitError("M3CK --clips-per-label must be between 1 and 5")
    if args.frame_count != 16:
        raise TinyOverfitError("M3CK requires --frame-count 16")
    if args.image_size != 96:
        raise TinyOverfitError("M3CK requires --image-size 96")
    if args.num_workers != 0:
        raise TinyOverfitError("M3CK requires --num-workers 0")
    if args.epochs <= 0 or args.epochs > 200:
        raise TinyOverfitError("M3CK --epochs must be between 1 and 200")
    if args.learning_rate <= 0:
        raise TinyOverfitError("M3CK --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise TinyOverfitError("M3CK --weight-decay must be greater than or equal to zero")
    return train_manifest, validation_manifest, test_manifest, output_dir, receipt_path


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def manifest_label_order(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise TinyOverfitError("manifest labels must be a list")
    return [str(label["label_id"]) for label in labels]


def label_distribution(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        label_id = str(row["label_id"])
        counts[label_id] = counts.get(label_id, 0) + 1
    return dict(sorted(counts.items()))


def prediction_distribution(metrics: dict[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in metrics.get("predictions", []):
        predicted = str(row["predicted_label"])
        counts[predicted] = counts.get(predicted, 0) + 1
    return dict(sorted(counts.items()))


def logit_summary(torch: Any, logits: Any, labels: Any, labels_by_index: list[str]) -> dict[str, Any]:
    probabilities = torch.softmax(logits.detach().cpu(), dim=1)
    predictions = probabilities.argmax(dim=1)
    labels_cpu = labels.detach().cpu()
    rows = []
    margins = []
    for index in range(int(labels_cpu.shape[0])):
        true_index = int(labels_cpu[index].item())
        predicted_index = int(predictions[index].item())
        sorted_probs = probabilities[index].sort(descending=True).values
        top1 = float(sorted_probs[0].item())
        top2 = float(sorted_probs[1].item()) if int(sorted_probs.shape[0]) > 1 else 0.0
        margins.append(top1 - top2)
        rows.append(
            {
                "row_index": index,
                "true_label": labels_by_index[true_index],
                "predicted_label": labels_by_index[predicted_index],
                "top1_probability": top1,
                "top1_minus_top2_margin": top1 - top2,
                "correct": predicted_index == true_index,
            }
        )
    return {
        "mean_top1_minus_top2_margin": sum(margins) / len(margins) if margins else 0.0,
        "predicted_label_distribution": prediction_distribution({"predictions": rows}),
        "rows": rows,
    }


def total_gradient_l2_norm(parameters: Any) -> float:
    total = 0.0
    for parameter in parameters:
        if parameter.grad is None:
            continue
        grad = parameter.grad.detach().float()
        total += float((grad * grad).sum().cpu().item())
    return total**0.5


def parameter_delta_l2_norm(torch: Any, before: dict[str, Any], after: dict[str, Any]) -> float:
    total = 0.0
    for key, before_value in before.items():
        after_value = after.get(key)
        if not hasattr(before_value, "detach") or not hasattr(after_value, "detach"):
            continue
        delta = after_value.detach().cpu().float() - before_value.detach().cpu().float()
        total += float((delta * delta).sum().item())
    return total**0.5


def train_tiny_trainfit(
    torch: Any,
    args: argparse.Namespace,
    batch: Any,
    labels: Any,
    labels_by_index: list[str],
    device: Any,
) -> tuple[Any, dict[str, Any]]:
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    model = build_model(torch, len(labels_by_index), SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE).to(device)
    initial_state = clone_state_dict_to_cpu(model.state_dict())
    initial_digest = model_state_digest(initial_state)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    generator = torch.Generator().manual_seed(args.seed)

    model.eval()
    with torch.no_grad():
        initial_logits = model(batch.to(device)).detach().cpu()
        initial_loss = criterion(initial_logits, labels.detach().cpu())
    initial_metrics = evaluate_batch(torch, model, criterion, batch, labels, device, labels_by_index)
    initial_logit_summary = logit_summary(torch, initial_logits, labels, labels_by_index)

    history = []
    best_metrics: dict[str, Any] | None = None
    first_update: dict[str, Any] | None = None
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
            if first_update is None:
                first_update = {
                    "epoch": epoch,
                    "batch_start_index": start_index,
                    "loss": float(loss.detach().cpu().item()),
                    "gradient_l2_norm": total_gradient_l2_norm(model.parameters()),
                }
            optimizer.step()
            if first_update is not None and "parameter_delta_l2_from_initial" not in first_update:
                first_update["parameter_delta_l2_from_initial"] = parameter_delta_l2_norm(
                    torch,
                    initial_state,
                    clone_state_dict_to_cpu(model.state_dict()),
                )
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
    model.eval()
    with torch.no_grad():
        final_logits = model(batch.to(device)).detach().cpu()
    final_state = clone_state_dict_to_cpu(model.state_dict())
    final_digest = model_state_digest(final_state)
    final_logit_summary = logit_summary(torch, final_logits, labels, labels_by_index)
    success = final_metrics["accuracy"] >= SUCCESS_THRESHOLD and not final_metrics["zero_recall_labels"]
    return model, {
        "status": "succeeded" if success else "failed",
        "success": success,
        "success_threshold": {
            "accuracy_gte": SUCCESS_THRESHOLD,
            "no_zero_recall_selected_labels": True,
            "predeclared_before_run": True,
        },
        "runtime": {
            "device": str(device),
            "elapsed_seconds": elapsed_seconds,
            "python": platform.python_version(),
            "torch": torch.__version__,
        },
        "initial_model_state_digest": initial_digest,
        "final_model_state_digest": final_digest,
        "model_parameters_changed": initial_digest["sha256"] != final_digest["sha256"],
        "parameter_delta_l2_from_initial": parameter_delta_l2_norm(torch, initial_state, final_state),
        "first_update": first_update,
        "initial_eval_metrics": initial_metrics,
        "initial_loss_from_logits": float(initial_loss.detach().cpu().item()),
        "initial_logit_summary": initial_logit_summary,
        "final_logit_summary": final_logit_summary,
        "history": history,
        "history_tail": history[-10:],
        "best_eval_metrics": best_metrics,
        "final_eval_metrics": final_metrics,
        "final_prediction_distribution": prediction_distribution(final_metrics),
    }


def comparison_summary(m3bv: dict[str, Any], m3ca: dict[str, Any], m3cj: dict[str, Any]) -> dict[str, Any]:
    m3bv_memorization = m3bv.get("ablation", {}).get("memorization_metrics", {})
    m3ca_decision = m3ca.get("decision", {})
    train_all_runs = [
        {
            "name": run.get("name"),
            "classification": run.get("classification"),
            "best_train_accuracy": max(
                (float(row.get("train_accuracy", 0.0)) for row in run.get("history", [])),
                default=run.get("result", {}).get("train_accuracy"),
            ),
            "test_top1_accuracy": run.get("evaluation", {}).get(
                "test_top1_accuracy",
                run.get("result", {}).get("test_top1_accuracy"),
            ),
            "test_macro_f1": run.get("evaluation", {}).get(
                "test_macro_f1",
                run.get("result", {}).get("test_macro_f1"),
            ),
            "predicted_single_class": run.get("evaluation", {}).get(
                "predicted_single_class",
                run.get("result", {}).get("predicted_single_class"),
            ),
        }
        for run in m3cj.get("runs", [])
    ]
    return {
        "m3bv_prior_true_temporal_convnet_tiny_overfit": {
            "status": m3bv.get("status"),
            "architecture": m3bv.get("ablation", {}).get("architecture"),
            "success": m3bv_memorization.get("success"),
            "final_accuracy": m3bv_memorization.get("final_accuracy"),
            "zero_recall_labels": m3bv_memorization.get("zero_recall_labels"),
            "receipt": file_reference(M3BV_RECEIPT),
        },
        "m3ca_learnability_probe_decision": {
            "status": m3ca.get("status"),
            "exactly_one_next_action": m3ca.get("exactly_one_next_action")
            or m3ca_decision.get("exactly_one_next_action"),
            "receipt": file_reference(M3CA_RECEIPT),
        },
        "m3cj_scratch_architecture_train_all_context": {
            "status": m3cj.get("status"),
            "selected_next_action": m3cj.get("selected_next_action"),
            "runs": train_all_runs,
            "receipt": file_reference(M3CJ_RECEIPT),
        },
    }


def build_receipt(
    args: argparse.Namespace,
    *,
    generated_at: str,
    train_summary: dict[str, Any],
    validation_summary: dict[str, Any],
    test_summary: dict[str, Any],
    manifest: dict[str, Any],
    subset_rows: list[dict[str, Any]],
    batch: Any,
    proof_logits_shape: list[int],
    label_ids: list[str],
    label_to_index: dict[str, int],
    training_result: dict[str, Any],
    artifacts: list[dict[str, str]],
    device: Any,
    m3bv: dict[str, Any],
    m3ca: dict[str, Any],
    m3ce: dict[str, Any],
    m3cj: dict[str, Any],
) -> dict[str, Any]:
    success = bool(training_result["success"])
    next_action = (
        "continue_data_split_label_distribution_audit_no_mutation"
        if success
        else "fallback_to_prior_train_fitting_region_grid_tcn_family"
    )
    final_metrics = training_result["final_eval_metrics"]
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CK - PopSign fresh5 architecture/input microprobe",
        "status": "m3ce_tiny_trainfit_succeeded" if success else "m3ce_tiny_trainfit_failed",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/run_popsign_fresh5_architecture_input_microprobe.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "active_prompt": "docs/model/return-to-form-popsign-fresh5-architecture-input-microprobe-goal-loop-prompt.md",
        "scope": {
            "local_only": True,
            "no_spend": True,
            "no_brev_training_or_spend": True,
            "no_brev_worker_lifecycle_change": True,
            "no_remote_command": True,
            "no_source_register_change": True,
            "no_source_import_or_media_download": True,
            "no_manifest_mutation": True,
            "no_tensor_write_or_rewrite": True,
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "source_receipts": {
            "m3ce_architecture_scaffold_contract": file_reference(M3CE_RECEIPT),
            "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
            "m3bv_prior_tiny_overfit": file_reference(M3BV_RECEIPT),
            "m3ca_learnability_isolation_probe": file_reference(M3CA_RECEIPT),
        },
        "files_and_symbols_inspected": [
            {
                "path": "GOAL.md",
                "symbols": ["current mission", "Mission 3CK exit condition"],
            },
            {
                "path": "docs/model/return-to-form-popsign-fresh5-architecture-input-microprobe-goal-loop-prompt.md",
                "symbols": ["Required Slice", "Hard Boundaries", "Acceptance Criteria"],
            },
            {
                "path": "scripts/train_rawframe_model.py",
                "symbols": [
                    "RawFrameClipDataset",
                    "prepare_region_frames",
                    "build_model",
                    "ScratchRegionTemporalLateFusionTCNClassifier",
                ],
            },
            {
                "path": "scripts/run_region_grid_tcn_tiny_overfit.py",
                "symbols": [
                    "select_subset",
                    "subset_contract_evidence",
                    "evaluate_batch",
                    "SUCCESS_THRESHOLD",
                ],
            },
            {
                "path": "data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json",
                "symbols": ["labels", "clips", "rgb_regions tensor references"],
            },
        ],
        "files_and_symbols_changed": [
            {
                "path": "scripts/run_popsign_fresh5_architecture_input_microprobe.py",
                "changes": [
                    "added M3CK-only train-fit diagnostic for scratch_region_temporal_late_fusion_tcn_contract_v1",
                    "records gradient, logit, parameter-change, label, and prediction evidence",
                ],
            },
            {
                "path": "docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json",
                "changes": ["added tracked M3CK receipt"],
            },
        ],
        "source_manifests": {
            "train": train_summary,
            "validation": validation_summary,
            "test": test_summary,
        },
        "selected_labels": {
            "manifest_order": manifest_label_order(manifest),
            "training_label_order": label_ids,
            "labels_to_index": label_to_index,
        },
        "diagnostic": {
            "ran": True,
            "type": "deterministic_balanced_tiny_trainfit_architecture_input_probe",
            "model_id": args.model_id,
            "architecture": SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
            "m3ce_scaffold_parameter_count": m3ce.get("architecture_scaffold", {})
            .get("model_contract", {})
            .get("parameter_count"),
            "initialization": "random",
            "pretrained_components": [],
            "framework": {
                "name": "pytorch",
                "version": training_result["runtime"]["torch"],
                "python": platform.python_version(),
                "device": str(device),
            },
            "output_dir": project_relative(project_path(args.output_dir, "output dir", must_exist=False)),
            "artifacts": artifacts,
            "subset": {
                "selection_rule": (
                    "sort labels lexicographically, sort clips within each label by clip_id, select first "
                    "clips_per_label from the repaired training split"
                ),
                "clip_count": len(subset_rows),
                "clips_per_label": args.clips_per_label,
                "label_distribution": label_distribution(subset_rows),
                "clips": subset_rows,
            },
            "input_contract": {
                "required_contract": REGION_AWARE_DERIVED_INPUT,
                "status": "passed",
                "consumed_tensor_key": "rgb_regions",
                "derived_input_name": REGION_AWARE_DERIVED_INPUT,
                "preserve_region_axis": True,
                "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"] if subset_rows else None,
                "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"] if subset_rows else None,
                "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
                "batched_model_input_shape": list(batch.shape),
                "batched_model_input_axis": "B,T,R,C,H,W",
                "logits_shape": proof_logits_shape,
                "region_axis_preserved_until": "ScratchRegionTemporalLateFusionTCNClassifier.region_attention",
            },
            "train_fit_metrics": {
                "status": training_result["status"],
                "success": success,
                "success_threshold": training_result["success_threshold"],
                "initial_accuracy": training_result["initial_eval_metrics"]["accuracy"],
                "initial_loss": training_result["initial_eval_metrics"]["loss"],
                "final_accuracy": final_metrics["accuracy"],
                "final_loss": final_metrics["loss"],
                "final_correct": final_metrics["correct"],
                "final_examples": final_metrics["examples"],
                "zero_recall_labels": final_metrics["zero_recall_labels"],
                "per_label": final_metrics["per_label"],
                "prediction_distribution": training_result["final_prediction_distribution"],
                "predictions": final_metrics["predictions"],
                "best_eval_metrics": training_result["best_eval_metrics"],
                "history_tail": training_result["history_tail"],
            },
            "gradient_logit_parameter_sanity": {
                "initial_model_state_digest": training_result["initial_model_state_digest"],
                "final_model_state_digest": training_result["final_model_state_digest"],
                "model_parameters_changed": training_result["model_parameters_changed"],
                "parameter_delta_l2_from_initial": training_result["parameter_delta_l2_from_initial"],
                "first_update": training_result["first_update"],
                "initial_logit_summary": training_result["initial_logit_summary"],
                "final_logit_summary": training_result["final_logit_summary"],
            },
        },
        "comparison_to_previous_evidence": comparison_summary(m3bv, m3ca, m3cj),
        "interpretation": (
            "The M3CE scratch region-temporal late-fusion TCN can train-fit one deterministic balanced "
            "PopSign fresh5 clip per label while preserving B,T,R,C,H,W. The remaining train-all failure "
            "is therefore not a total loader, label-index, gradient, or architecture connectivity break; "
            "the next local/no-mutation slice should audit split, label distribution, signer/source, and "
            "per-label data quality before spending Brev."
            if success
            else "The M3CE scratch region-temporal late-fusion TCN did not train-fit the deterministic "
            "balanced tiny subset, so the prior train-fitting region-grid TCN family is currently the "
            "better evidenced path and Brev remains unjustified."
        ),
        "decision": {
            "m3ce_architecture_can_train_fit_balanced_tiny_subset": success,
            "local_microprobe_supports_brev_training_now": False,
            "browser_activation_or_promotion_justified_now": False,
            "exactly_one_next_action": next_action,
            "next_action_rationale": (
                "Tiny train-fit passed, but M3CJ train-all still collapsed to chance; inspect split and "
                "label distribution before any remote or longer train-all run."
                if success
                else "Tiny train-fit failed while earlier true TCN evidence did train-fit; fall back to the "
                "better evidenced family before any compute spend."
            ),
        },
        "guardrails": {
            "pretrained_components": [],
            "pseudo_labels_generated": False,
            "remote_training_run": False,
            "brev_command_run": False,
            "brev_spend": False,
            "brev_worker_lifecycle_changed": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "manifest_mutation": False,
            "tensor_write_or_rewrite": False,
            "browser_model_activation": False,
            "model_card_promotion": False,
            "final_gate_change": False,
            "final_readiness_claim": False,
            "pushed_to_remote": False,
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
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
            ".venv/bin/python scripts/run_popsign_fresh5_architecture_input_microprobe.py --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --output-dir output/m3ck-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit --receipt docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json --clips-per-label 1 --epochs 120 --batch-size 5 --learning-rate 0.003 --weight-decay 0.0 --frame-count 16 --image-size 96 --num-workers 0 --seed 20260528 --check-files --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null",
        ],
        "tracked_files_changed": [
            "scripts/run_popsign_fresh5_architecture_input_microprobe.py",
            "docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json",
            "docs/session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md",
        ],
        "local_artifacts_written_or_updated": [
            "output/m3ck-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit/model_state.pt",
            "output/m3ck-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit/selected-subset.json",
            "output/m3ck-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-tiny-trainfit/tiny-trainfit-provenance.json",
        ],
        "exactly_one_next_action": next_action,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    train_manifest, validation_manifest, test_manifest, output_dir, receipt_path = validate_contract_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3CK PopSign fresh5 architecture/input microprobe")
    torch = import_torch()
    train_summary = validate_manifest(train_manifest, "train", args.check_files, False, False, False, False, True)
    validation_summary = validate_manifest(
        validation_manifest,
        "validation",
        args.check_files,
        False,
        False,
        False,
        False,
        True,
    )
    test_summary = validate_manifest(test_manifest, "test", args.check_files, False, False, False, False, True)
    manifest = load_manifest(train_manifest)
    selected = select_subset(manifest, args.clips_per_label)
    label_ids = sorted(str(label_id) for label_id in train_summary["label_ids"])
    expected_subset_size = len(label_ids) * args.clips_per_label
    if len(selected) != expected_subset_size:
        raise TinyOverfitError(f"selected subset size {len(selected)} does not match {expected_subset_size}")
    if args.batch_size != len(selected):
        raise TinyOverfitError(f"M3CK requires full-subset --batch-size {len(selected)} for this selection")

    label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
    dataset = RawFrameClipDataset(
        torch,
        train_manifest,
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
    proof_model = build_model(torch, len(label_ids), SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        proof_logits = proof_model(batch.to(device)).detach().cpu()
    if list(proof_logits.shape) != [len(selected), len(label_ids)]:
        raise TinyOverfitError(f"proof logits shape mismatch: {list(proof_logits.shape)}")

    model, training_result = train_tiny_trainfit(torch, args, batch, labels, label_ids, device)
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "model_state.pt"
    subset_path = output_dir / "selected-subset.json"
    provenance_path = output_dir / "tiny-trainfit-provenance.json"
    checkpoint = {
        "model_state": clone_state_dict_to_cpu(model.state_dict()),
        "label_to_index": label_to_index,
        "architecture": SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
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
        "schema_version": "asl-pilot-popsign-fresh5-architecture-input-microprobe-subset/v1",
        "generated_at": generated_at,
        "selection_rule": (
            "sort labels lexicographically, sort clips within each label by clip_id, select first clips_per_label"
        ),
        "source_manifest": project_relative(train_manifest),
        "clips_per_label": args.clips_per_label,
        "label_distribution": label_distribution(subset_rows),
        "clips": subset_rows,
    }
    write_json(subset_path, subset_report)
    provenance = {
        "schema_version": "asl-pilot-popsign-fresh5-architecture-input-microprobe-provenance/v1",
        "generated_at": generated_at,
        "model_id": args.model_id,
        "command": command_for_args(args),
        "script": file_reference(Path(__file__)),
        "architecture": SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
        "initialization": "random",
        "pretrained_components": [],
        "source_manifest": train_summary,
        "input_contract": {
            "required_contract": REGION_AWARE_DERIVED_INPUT,
            "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"],
            "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"],
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
            "batched_model_input_shape": list(batch.shape),
            "batched_model_input_axis": "B,T,R,C,H,W",
            "logits_shape": list(proof_logits.shape),
        },
        "subset": subset_report,
        "training_result": training_result,
        "model_artifact": project_relative(model_path),
    }
    write_json(provenance_path, provenance)

    artifacts = [
        file_reference(model_path),
        file_reference(subset_path),
        file_reference(provenance_path),
    ]
    receipt = build_receipt(
        args,
        generated_at=generated_at,
        train_summary=train_summary,
        validation_summary=validation_summary,
        test_summary=test_summary,
        manifest=manifest,
        subset_rows=subset_rows,
        batch=batch,
        proof_logits_shape=list(proof_logits.shape),
        label_ids=label_ids,
        label_to_index=label_to_index,
        training_result=training_result,
        artifacts=artifacts,
        device=device,
        m3bv=load_json(PROJECT_ROOT / M3BV_RECEIPT),
        m3ca=load_json(PROJECT_ROOT / M3CA_RECEIPT),
        m3ce=load_json(PROJECT_ROOT / M3CE_RECEIPT),
        m3cj=load_json(PROJECT_ROOT / M3CJ_RECEIPT),
    )
    write_json(receipt_path, receipt)
    artifacts.append(file_reference(receipt_path))
    return {
        "status": receipt["status"],
        "success": training_result["success"],
        "final_accuracy": training_result["final_eval_metrics"]["accuracy"],
        "zero_recall_labels": training_result["final_eval_metrics"]["zero_recall_labels"],
        "prediction_distribution": training_result["final_prediction_distribution"],
        "next_action": receipt["exactly_one_next_action"],
        "output_dir": project_relative(output_dir),
        "receipt": project_relative(receipt_path),
        "artifacts": artifacts,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, TinyOverfitError) as error:
        print(f"M3CK PopSign fresh5 architecture/input microprobe failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
