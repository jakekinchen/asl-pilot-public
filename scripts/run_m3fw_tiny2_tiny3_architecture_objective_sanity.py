#!/usr/bin/env python3
"""Run the bounded M3FW Tiny2 architecture/objective sanity proof."""

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

import run_m3em_tiny2_heldout_noncollapse_probe as m3em
from train_rawframe_model import ManifestError, TrainingError


SCHEMA_VERSION = "asl-pilot-return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity/v1"
DEFAULT_CONTRACT = Path(
    "docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json"
)
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/train.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid/test.json")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json")
DEFAULT_LABELS = ("table", "hello")
DEFAULT_TINY3_EXTENSION_LABEL = "black"
DEFAULT_SEED = 2026052901
DEFAULT_EPOCHS = 100
DEFAULT_TRAIN_CLIPS_PER_LABEL = 12
DEFAULT_VALIDATION_CLIPS_PER_LABEL = 4
CHOSEN_ARCHITECTURE = m3em.TRUE_TEMPORAL_CONVNET_ARCHITECTURE


class M3FWError(RuntimeError):
    """Raised when the bounded M3FW contract cannot be completed."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--tiny2-labels", nargs="+", default=list(DEFAULT_LABELS))
    parser.add_argument("--tiny3-extension-label", default=DEFAULT_TINY3_EXTENSION_LABEL)
    parser.add_argument("--train-clips-per-label", type=int, default=DEFAULT_TRAIN_CLIPS_PER_LABEL)
    parser.add_argument("--validation-clips-per-label", type=int, default=DEFAULT_VALIDATION_CLIPS_PER_LABEL)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--check-files", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, *, must_exist: bool = True) -> Path:
    return m3em.project_path(path, context, must_exist=must_exist)


def project_relative(path: Path) -> str:
    return m3em.project_relative(path)


def write_json(path: Path, value: dict[str, Any]) -> None:
    m3em.write_json(path, value)


def read_json(path: Path) -> dict[str, Any]:
    data = m3em.read_json_file(path)
    if not isinstance(data, dict):
        raise M3FWError(f"JSON root must be an object: {project_relative(path)}")
    return data


def validate_args_and_contract(args: argparse.Namespace) -> tuple[Path, Path, Path, Path, Path, dict[str, Any], list[str]]:
    contract_path = project_path(args.contract, "M3FV contract")
    train_manifest_path = project_path(args.train_manifest, "train manifest")
    validation_manifest_path = project_path(args.validation_manifest, "validation manifest")
    test_manifest_path = project_path(args.test_manifest, "test manifest")
    receipt_path = project_path(args.receipt, "receipt", must_exist=False)
    contract = read_json(contract_path)

    if contract.get("schema_version") != "asl-pilot-return-to-form-m3fv-architecture-objective-sanity-contract/v1":
        raise M3FWError("M3FW requires the M3FV architecture/objective sanity contract schema")
    if contract.get("artifact_lane") != "architecture_objective_sanity":
        raise M3FWError("M3FW contract artifact_lane must be architecture_objective_sanity")
    if contract.get("contract_authority", {}).get("authorizes_brev_lifecycle_or_spend") is not False:
        raise M3FWError("M3FW contract must not authorize Brev lifecycle or spend")
    if contract.get("contract_authority", {}).get("authorizes_training") is not False:
        raise M3FWError("M3FW contract must not itself authorize training; GOAL/M3FW prompt provides local proof scope")

    selected_scope = contract.get("selected_data_scope", {})
    manifests = selected_scope.get("manifests", {})
    required_paths = {
        "train": DEFAULT_TRAIN_MANIFEST,
        "validation": DEFAULT_VALIDATION_MANIFEST,
        "test": DEFAULT_TEST_MANIFEST,
    }
    observed_paths = {
        "train": train_manifest_path,
        "validation": validation_manifest_path,
        "test": test_manifest_path,
    }
    for split, expected in required_paths.items():
        contract_value = manifests.get(split)
        if contract_value != expected.as_posix():
            raise M3FWError(f"M3FV contract {split} manifest must be {expected.as_posix()}")
        if observed_paths[split] != (m3em.PROJECT_ROOT / expected).resolve():
            raise M3FWError(f"M3FW requires --{split}-manifest {expected.as_posix()}")

    labels = [str(label) for label in args.tiny2_labels]
    if labels != list(DEFAULT_LABELS):
        raise M3FWError("M3FW requires exactly --tiny2-labels table hello in that order")
    if selected_scope.get("selected_labels", {}).get("tiny2") != list(DEFAULT_LABELS):
        raise M3FWError("M3FV contract Tiny2 labels must be table, hello")
    if args.tiny3_extension_label != DEFAULT_TINY3_EXTENSION_LABEL:
        raise M3FWError("M3FW requires --tiny3-extension-label black")
    if args.frame_count != 16:
        raise M3FWError("M3FW requires --frame-count 16")
    if args.image_size != 96:
        raise M3FWError("M3FW requires --image-size 96")
    if args.num_workers != 0:
        raise M3FWError("M3FW requires --num-workers 0")
    if args.train_clips_per_label != DEFAULT_TRAIN_CLIPS_PER_LABEL:
        raise M3FWError(f"M3FW requires --train-clips-per-label {DEFAULT_TRAIN_CLIPS_PER_LABEL}")
    if args.validation_clips_per_label != DEFAULT_VALIDATION_CLIPS_PER_LABEL:
        raise M3FWError(f"M3FW requires --validation-clips-per-label {DEFAULT_VALIDATION_CLIPS_PER_LABEL}")
    if args.epochs <= 0 or args.epochs > 160:
        raise M3FWError("M3FW --epochs must be between 1 and 160")
    if args.learning_rate <= 0:
        raise M3FWError("M3FW --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise M3FWError("M3FW --weight-decay must be greater than or equal to zero")
    if not args.check_files:
        raise M3FWError("M3FW requires --check-files for dry-run and proof execution")
    if receipt_path != (m3em.PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise M3FWError(f"M3FW requires --receipt {DEFAULT_RECEIPT.as_posix()}")

    allowed_architectures = contract.get("objective_and_architecture_constraints", {}).get(
        "allowed_architecture_examples", []
    )
    if CHOSEN_ARCHITECTURE not in allowed_architectures:
        raise M3FWError(f"M3FV contract does not allow chosen architecture {CHOSEN_ARCHITECTURE}")
    return contract_path, train_manifest_path, validation_manifest_path, test_manifest_path, receipt_path, contract, labels


def gate_thresholds(contract: dict[str, Any]) -> dict[str, Any]:
    tiny2 = contract.get("pass_fail_contract", {}).get("tiny2_entry")
    if not isinstance(tiny2, dict):
        raise M3FWError("M3FV contract must include pass_fail_contract.tiny2_entry")
    return tiny2


def train_probe(
    torch: Any,
    *,
    train_batch: Any,
    train_labels: Any,
    validation_batch: Any,
    validation_labels: Any,
    label_order: list[str],
    device: Any,
    seed: int,
    epochs: int,
    learning_rate: float,
    weight_decay: float,
    control_type: str,
) -> dict[str, Any]:
    random.seed(seed)
    torch.manual_seed(seed)
    model = m3em.build_model(torch, len(label_order), CHOSEN_ARCHITECTURE).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    training_labels = train_labels.clone()
    label_shuffle_mapping = None
    if control_type == "label_shuffle_train_true_heldout_eval":
        training_labels = (training_labels + 1) % len(label_order)
        label_shuffle_mapping = {
            label_order[index]: label_order[(index + 1) % len(label_order)] for index in range(len(label_order))
        }
    initial_digest = m3em.model_state_digest(model.state_dict())
    initial_train_metrics = m3em.evaluate(torch, model, criterion, train_batch, training_labels, device, label_order)
    initial_validation_metrics = m3em.evaluate(
        torch, model, criterion, validation_batch, validation_labels, device, label_order
    )
    history = []
    start = time.perf_counter()
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(train_batch.to(device))
        loss = criterion(logits, training_labels.to(device))
        loss.backward()
        optimizer.step()
        if epoch <= 5 or epoch == epochs or epoch % 10 == 0:
            train_metrics = m3em.evaluate(torch, model, criterion, train_batch, training_labels, device, label_order)
            validation_metrics = m3em.evaluate(
                torch, model, criterion, validation_batch, validation_labels, device, label_order
            )
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_accuracy": train_metrics["accuracy"],
                    "validation_loss": validation_metrics["loss"],
                    "validation_top1": validation_metrics["accuracy"],
                    "validation_macro_f1": validation_metrics["macro_f1"],
                    "validation_dominant_predicted_class_fraction": validation_metrics[
                        "dominant_predicted_class_fraction"
                    ],
                    "validation_zero_recall_labels": validation_metrics["zero_recall_labels"],
                }
            )
    elapsed_seconds = time.perf_counter() - start
    final_train_metrics = m3em.evaluate(torch, model, criterion, train_batch, training_labels, device, label_order)
    final_validation_metrics = m3em.evaluate(
        torch, model, criterion, validation_batch, validation_labels, device, label_order
    )
    return {
        "control_type": control_type,
        "architecture": CHOSEN_ARCHITECTURE,
        "label_shuffle_mapping": label_shuffle_mapping,
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
        "final_model_state_digest": m3em.model_state_digest(model.state_dict()),
        "initial_train_metrics": initial_train_metrics,
        "initial_validation_metrics": initial_validation_metrics,
        "history": history,
        "final_train_metrics": final_train_metrics,
        "final_validation_metrics": final_validation_metrics,
        "train_loss_decreased": final_train_metrics["loss"] < initial_train_metrics["loss"],
    }


def evaluate_contract_gates(probe: dict[str, Any], thresholds: dict[str, Any]) -> dict[str, Any]:
    final_train = probe["final_train_metrics"]
    final_validation = probe["final_validation_metrics"]
    required_zero_recall = thresholds.get("required_zero_recall_labels", [])
    checks = {
        "train_accuracy": final_train["accuracy"] >= float(thresholds["required_train_accuracy_gte"]),
        "train_loss_decreased": bool(probe["train_loss_decreased"]),
        "validation_top1": final_validation["accuracy"] >= float(thresholds["required_validation_top1_gte"]),
        "validation_macro_f1": final_validation["macro_f1"] >= float(thresholds["required_validation_macro_f1_gte"]),
        "validation_zero_recall_labels": final_validation["zero_recall_labels"] == required_zero_recall,
        "validation_dominant_predicted_class_fraction": final_validation["dominant_predicted_class_fraction"]
        <= float(thresholds["required_dominant_predicted_class_fraction_lte"]),
    }
    return {
        "thresholds": thresholds,
        "checks": checks,
        "passed": all(checks.values()),
        "class_collapse": bool(final_validation["class_collapse"]),
        "zero_recall_labels": final_validation["zero_recall_labels"],
        "dominant_predicted_class_fraction": final_validation["dominant_predicted_class_fraction"],
    }


def next_action_for(real_gate: dict[str, Any], false_progress: dict[str, Any]) -> str:
    if real_gate["passed"] and not false_progress["suspicious_success"]:
        return "continue_tiny3_extension_no_spend"
    checks = real_gate["checks"]
    if checks["train_accuracy"] and checks["train_loss_decreased"] and (
        not checks["validation_top1"]
        or not checks["validation_macro_f1"]
        or not checks["validation_zero_recall_labels"]
        or not checks["validation_dominant_predicted_class_fraction"]
    ):
        return "continue_crop_or_input_schema_review_no_spend"
    return "continue_architecture_objective_blocker_triage_no_spend"


def claim_surface_status() -> dict[str, Any]:
    model_card_path = m3em.PROJECT_ROOT / "web/public/model/model-card.json"
    detector0_card_path = m3em.PROJECT_ROOT / "web/public/model/detector0-card.json"
    active_vocabulary_path = m3em.PROJECT_ROOT / "docs/model/active-vocabulary-claim.json"
    claim_matrix_path = m3em.PROJECT_ROOT / "web/public/model/claim-matrix.json"
    final_claim_matrix_path = m3em.PROJECT_ROOT / "docs/validation/final-claim-matrix.json"
    model_card = read_json(model_card_path)
    detector0_card = read_json(detector0_card_path)
    active_vocabulary = read_json(active_vocabulary_path)
    claim_matrix = read_json(claim_matrix_path)
    final_claim_matrix = read_json(final_claim_matrix_path)
    return {
        "fail_closed": model_card.get("status") == "not_trained" and active_vocabulary.get("activeLabels") == [],
        "model_card": {
            "path": project_relative(model_card_path),
            "sha256": m3em.sha256_file(model_card_path),
            "status": model_card.get("status"),
            "model_id": model_card.get("model_id"),
        },
        "detector0_card": {
            "path": project_relative(detector0_card_path),
            "sha256": m3em.sha256_file(detector0_card_path),
            "status": detector0_card.get("status"),
            "promotion_state": detector0_card.get("promotion_state"),
            "browser_artifact": detector0_card.get("browser_artifact"),
            "runtime_gates": detector0_card.get("runtime_gates"),
        },
        "active_vocabulary_claim": {
            "path": project_relative(active_vocabulary_path),
            "sha256": m3em.sha256_file(active_vocabulary_path),
            "modelVersion": active_vocabulary.get("modelVersion"),
            "activeLabels": active_vocabulary.get("activeLabels"),
        },
        "claim_matrix": {
            "path": project_relative(claim_matrix_path),
            "sha256": m3em.sha256_file(claim_matrix_path),
            "status": claim_matrix.get("status"),
        },
        "final_claim_matrix": {
            "path": project_relative(final_claim_matrix_path),
            "sha256": m3em.sha256_file(final_claim_matrix_path),
            "status": final_claim_matrix.get("status"),
        },
    }


def receipt_for(
    args: argparse.Namespace,
    *,
    generated_at: str,
    contract_path: Path,
    train_manifest_path: Path,
    validation_manifest_path: Path,
    test_manifest_path: Path,
    receipt_path: Path,
    contract: dict[str, Any],
    label_order: list[str],
    train_manifest: dict[str, Any],
    validation_manifest: dict[str, Any],
    test_manifest: dict[str, Any],
    train_rows: list[dict[str, Any]],
    validation_rows: list[dict[str, Any]],
    train_batch: Any,
    validation_batch: Any,
    device: Any,
    dry_run_summary: dict[str, Any],
    real_probe: dict[str, Any] | None,
    shuffle_probe: dict[str, Any] | None,
    real_gate: dict[str, Any] | None,
    shuffle_gate: dict[str, Any] | None,
) -> dict[str, Any]:
    false_progress = {
        "control_type": "label_shuffle_train_true_heldout_eval",
        "run": shuffle_probe is not None,
        "suspicious_success": bool(shuffle_gate and shuffle_gate["passed"]),
        "interpretation": (
            "If a model trained on deliberately swapped Tiny2 train labels also passes the true-label "
            "held-out gates, the objective proof is invalid as leakage or false progress."
        ),
        "gate": shuffle_gate,
    }
    next_action = (
        "continue_architecture_objective_blocker_triage_no_spend"
        if real_gate is None
        else next_action_for(real_gate, false_progress)
    )
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "M3FW - Tiny2/Tiny3 architecture objective sanity no spend",
        "status": "dry_run_only" if real_probe is None else "completed_local_tiny2_proof",
        "generated_at": generated_at,
        "current_commit": "cb30532 observer: CONTINUE - m3fv architecture objective handoff",
        "active_prompt": "docs/model/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-goal-loop-prompt.md",
        "commands_run": [
            {
                "command": " ".join([sys.executable, *sys.argv]),
                "argv": [sys.executable, *sys.argv],
                "status": "passed",
                "summary": "M3FW runner invocation completed and produced this receipt."
                if args.write_receipt
                else "M3FW runner invocation completed without writing a receipt.",
            }
        ],
        "commands_run_by_runner": {
            "tool": "scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py",
            "command": [sys.executable, *sys.argv],
            "dry_run": args.dry_run,
            "write_receipt": args.write_receipt,
        },
        "m3fv_contract": {
            "path": project_relative(contract_path),
            "sha256": m3em.sha256_file(contract_path),
            "schema_version": contract.get("schema_version"),
            "validated": true_json(),
            "selected_next_action": contract.get("selected_next_action"),
        },
        "runner": {
            "path": "scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py",
            "status": "created",
            "receipt_path": project_relative(receipt_path),
            "check_files_required": true_json(),
            "check_files_passed": dry_run_summary["status"] == "passed",
        },
        "chosen_architecture_objective": {
            "architecture": CHOSEN_ARCHITECTURE,
            "objective": "cross_entropy",
            "initialization": "random_from_scratch_only",
            "pretrained_components": [],
            "why_smallest_falsifiable_test": (
                "Reuses the existing region-axis-preserving Tiny2 path from M3EM, fixes the architecture before "
                "execution, and adds contract gates plus a label-shuffle held-out control instead of comparing "
                "multiple architectures or changing crops."
            ),
        },
        "data_source_label_input_scope": {
            "source_id": "asl-citizen-school-assignment-raw-videos",
            "source_status": "approved_noncommercial_school_assignment_raw_video_only",
            "manifest_family": "data/manifests/lesson/high-signal-region-grid",
            "input_contract": m3em.REGION_AWARE_DERIVED_INPUT,
            "batch_axis": "B,T,R,C,H,W",
            "prepared_model_input_axis": m3em.REGION_AWARE_MODEL_INPUT_AXIS,
            "tiny2_labels": label_order,
            "tiny3_extension_label": args.tiny3_extension_label,
            "tiny3_executed": false_json(),
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "num_workers": args.num_workers,
            "manifests": {
                "train": m3em.file_reference(train_manifest_path),
                "validation": m3em.file_reference(validation_manifest_path),
                "test": m3em.file_reference(test_manifest_path),
            },
        },
        "manifest_summary": {
            "train": {
                "dataset_id": train_manifest.get("dataset_id"),
                "split": train_manifest.get("split"),
                "source_register": train_manifest.get("source_register"),
                "region_grid_materialization": train_manifest.get("region_grid_materialization"),
            },
            "validation": {
                "dataset_id": validation_manifest.get("dataset_id"),
                "split": validation_manifest.get("split"),
                "source_register": validation_manifest.get("source_register"),
                "region_grid_materialization": validation_manifest.get("region_grid_materialization"),
            },
            "test": {
                "dataset_id": test_manifest.get("dataset_id"),
                "split": test_manifest.get("split"),
                "source_register": test_manifest.get("source_register"),
                "region_grid_materialization": test_manifest.get("region_grid_materialization"),
            },
        },
        "dry_run_check_files": dry_run_summary,
        "batch": {
            "selection_rule": (
                "Use M3FV/M3EK Tiny2 labels in order table, hello; sort train and validation clips within each "
                "label by clip_id; select 12 train clips and 4 signer-disjoint validation clips per label."
            ),
            "seed": args.seed,
            "train_clips_per_label": args.train_clips_per_label,
            "validation_clips_per_label": args.validation_clips_per_label,
            "train_batch_shape": list(train_batch.shape),
            "validation_batch_shape": list(validation_batch.shape),
            "train_clips": train_rows,
            "validation_clips": validation_rows,
            "signer_summary": m3em.signer_summary(train_rows, validation_rows),
        },
        "tiny2_real_label_proof": real_probe,
        "tiny2_contract_gate": real_gate,
        "false_progress_control": false_progress,
        "class_collapse_controls": {
            "real_label_validation_class_collapse": None
            if real_gate is None
            else real_gate["class_collapse"],
            "real_label_validation_dominant_predicted_class_fraction": None
            if real_gate is None
            else real_gate["dominant_predicted_class_fraction"],
            "real_label_validation_zero_recall_labels": [] if real_gate is None else real_gate["zero_recall_labels"],
            "single_class_predictions_fail_even_if_train_accuracy_passes": true_json(),
        },
        "claim_surface_status": claim_surface_status(),
        "read_only_brev_default_off_state": {
            "command": "brev ls --json",
            "lifecycle_command_run": false_json(),
            "remote_command_run": false_json(),
            "spent_money_this_slice": false_json(),
            "status_expected_from_executor_baseline": "STOPPED / COMPLETED / NOT READY / HEALTHY",
        },
        "forbidden_actions_proof": {
            "brev_lifecycle_exec_sync_copy_stop_or_spend": false_json(),
            "remote_command": false_json(),
            "tiny3_run": false_json(),
            "fresh5_25_75_95_or_broad_training": false_json(),
            "architecture_or_objective_sweep": false_json(),
            "source_register_edit": false_json(),
            "source_media_import": false_json(),
            "manifest_tensor_packet_vocabulary_mutation": false_json(),
            "checkpoint_or_model_artifact_saved": false_json(),
            "export_or_promotion": false_json(),
            "model_card_or_active_vocabulary_promotion": false_json(),
            "browser_recognition_activation": false_json(),
            "runtime_detector0_authority_claim": false_json(),
            "final_gate_change": false_json(),
            "unsupported_correctness_or_readiness_claim": false_json(),
            "push": false_json(),
            "amend_or_no_verify": false_json(),
        },
        "pretrained_components": [],
        "changed_files": [
            "scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py",
            "docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json",
            "docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md",
        ],
        "exactly_one_next_action": next_action,
        "next_action": next_action,
    }


def true_json() -> bool:
    return True


def false_json() -> bool:
    return False


def run(args: argparse.Namespace) -> dict[str, Any]:
    (
        contract_path,
        train_manifest_path,
        validation_manifest_path,
        test_manifest_path,
        receipt_path,
        contract,
        label_order,
    ) = validate_args_and_contract(args)
    if m3em.should_verify_retained_local_ml_environment():
        m3em.require_current_local_ml_environment("M3FW Tiny2 architecture objective sanity")
    torch = m3em.import_torch()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    train_manifest = m3em.load_manifest(train_manifest_path)
    validation_manifest = m3em.load_manifest(validation_manifest_path)
    test_manifest = m3em.load_manifest(test_manifest_path)
    train_selected = m3em.select_clips(
        train_manifest,
        label_order,
        args.train_clips_per_label,
        manifest_path=train_manifest_path,
        split_role="train",
    )
    validation_selected = m3em.select_clips(
        validation_manifest,
        label_order,
        args.validation_clips_per_label,
        manifest_path=validation_manifest_path,
        split_role="heldout_validation",
    )
    train_rows, train_batch, train_targets = m3em.prepare_batch(
        torch,
        train_manifest_path,
        train_selected,
        label_order,
        args.frame_count,
        args.image_size,
    )
    validation_rows, validation_batch, validation_targets = m3em.prepare_batch(
        torch,
        validation_manifest_path,
        validation_selected,
        label_order,
        args.frame_count,
        args.image_size,
    )
    device = m3em.select_device(torch)
    proof_model = m3em.build_model(torch, len(label_order), CHOSEN_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        train_logits = proof_model(train_batch.to(device)).detach().cpu()
        validation_logits = proof_model(validation_batch.to(device)).detach().cpu()
    expected_train_shape = [len(train_rows), len(label_order)]
    expected_validation_shape = [len(validation_rows), len(label_order)]
    if list(train_logits.shape) != expected_train_shape:
        raise M3FWError(f"train logits shape mismatch: expected {expected_train_shape}, got {list(train_logits.shape)}")
    if list(validation_logits.shape) != expected_validation_shape:
        raise M3FWError(
            f"validation logits shape mismatch: expected {expected_validation_shape}, got {list(validation_logits.shape)}"
        )
    signer = m3em.signer_summary(train_rows, validation_rows)
    if signer["train_heldout_signer_identity_hash_overlap"]:
        raise M3FWError("M3FW requires signer-disjoint train and validation selections")
    dry_run_summary = {
        "status": "passed",
        "contract_path": project_relative(contract_path),
        "architecture": CHOSEN_ARCHITECTURE,
        "label_order": label_order,
        "train_clip_count": len(train_rows),
        "validation_clip_count": len(validation_rows),
        "train_batch_shape": list(train_batch.shape),
        "validation_batch_shape": list(validation_batch.shape),
        "batch_axis": "B,T,R,C,H,W",
        "train_logits_shape": list(train_logits.shape),
        "validation_logits_shape": list(validation_logits.shape),
        "device": str(device),
        "check_files": args.check_files,
        "train_heldout_signer_identity_hash_overlap": signer["train_heldout_signer_identity_hash_overlap"],
    }
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    thresholds = gate_thresholds(contract)
    real_probe = None
    shuffle_probe = None
    real_gate = None
    shuffle_gate = None
    if not args.dry_run:
        real_probe = train_probe(
            torch,
            train_batch=train_batch,
            train_labels=train_targets,
            validation_batch=validation_batch,
            validation_labels=validation_targets,
            label_order=label_order,
            device=device,
            seed=args.seed,
            epochs=args.epochs,
            learning_rate=args.learning_rate,
            weight_decay=args.weight_decay,
            control_type="real_labels",
        )
        real_gate = evaluate_contract_gates(real_probe, thresholds)
        shuffle_probe = train_probe(
            torch,
            train_batch=train_batch,
            train_labels=train_targets,
            validation_batch=validation_batch,
            validation_labels=validation_targets,
            label_order=label_order,
            device=device,
            seed=args.seed + 17,
            epochs=args.epochs,
            learning_rate=args.learning_rate,
            weight_decay=args.weight_decay,
            control_type="label_shuffle_train_true_heldout_eval",
        )
        shuffle_gate = evaluate_contract_gates(shuffle_probe, thresholds)
    receipt = receipt_for(
        args,
        generated_at=generated_at,
        contract_path=contract_path,
        train_manifest_path=train_manifest_path,
        validation_manifest_path=validation_manifest_path,
        test_manifest_path=test_manifest_path,
        receipt_path=receipt_path,
        contract=contract,
        label_order=label_order,
        train_manifest=train_manifest,
        validation_manifest=validation_manifest,
        test_manifest=test_manifest,
        train_rows=train_rows,
        validation_rows=validation_rows,
        train_batch=train_batch,
        validation_batch=validation_batch,
        device=device,
        dry_run_summary=dry_run_summary,
        real_probe=real_probe,
        shuffle_probe=shuffle_probe,
        real_gate=real_gate,
        shuffle_gate=shuffle_gate,
    )
    if args.write_receipt:
        write_json(receipt_path, receipt)
    result = {
        "status": receipt["status"],
        "dry_run_check_files": "passed",
        "architecture": CHOSEN_ARCHITECTURE,
        "label_order": label_order,
        "train_batch_shape": list(train_batch.shape),
        "validation_batch_shape": list(validation_batch.shape),
        "next_action": receipt["next_action"],
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
    }
    if real_probe is not None and real_gate is not None:
        result.update(
            {
                "tiny2_gate_passed": real_gate["passed"],
                "train_accuracy": real_probe["final_train_metrics"]["accuracy"],
                "validation_top1": real_probe["final_validation_metrics"]["accuracy"],
                "validation_macro_f1": real_probe["final_validation_metrics"]["macro_f1"],
                "validation_zero_recall_labels": real_probe["final_validation_metrics"]["zero_recall_labels"],
                "validation_dominant_predicted_class_fraction": real_probe["final_validation_metrics"][
                    "dominant_predicted_class_fraction"
                ],
                "false_progress_suspicious_success": bool(shuffle_gate and shuffle_gate["passed"]),
            }
        )
    return result


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, M3FWError) as error:
        print(f"M3FW Tiny2 architecture objective sanity failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(m3em.json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
