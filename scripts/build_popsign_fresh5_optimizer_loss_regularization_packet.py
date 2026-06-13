#!/usr/bin/env python3
"""Build the PopSign fresh5 optimizer/loss/regularization packet receipt."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-popsign-fresh5-optimizer-loss-regularization-packet/v1"
DEFAULT_RECEIPT = Path(
    "docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json"
)
ACTIVE_PROMPT = Path(
    "docs/model/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-goal-loop-prompt.md"
)
RETURN_TO_FORM_PLAN = Path("docs/model/return-to-form-plan.md")
MANIFEST_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_SCRIPT = Path("scripts/train_rawframe_model.py")
EVALUATE_SCRIPT = Path("scripts/evaluate_rawframe_model.py")
SAMPLER_PACKET_SCRIPT = Path("scripts/build_popsign_fresh5_training_distribution_sampler_packet.py")
M3CP_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json")
M3CO_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json")
M3CN_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json")
M3CJ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json")
M3CK_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json")
TRAINING_PROVENANCE = Path(
    "output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json"
)
VALIDATION_REPORT = Path(
    "output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json"
)
MODEL_STATE = Path("output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/model_state.pt")
LABELS = ["home", "morning", "pen", "thank_you", "who"]


class PacketError(RuntimeError):
    """Raised when the no-training packet cannot be built."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise PacketError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise PacketError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, str]:
    resolved = project_path(path, "input artifact")
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path, "json input artifact")
    return json.loads(resolved.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def command_for_args(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        "scripts/build_popsign_fresh5_optimizer_loss_regularization_packet.py",
        "--receipt",
        project_relative(project_path(args.receipt, "receipt", must_exist=False)),
        "--write-receipt",
    ]


def validate_args(args: argparse.Namespace) -> Path:
    receipt = project_path(args.receipt, "receipt", must_exist=False)
    if receipt != (PROJECT_ROOT / DEFAULT_RECEIPT).resolve():
        raise PacketError(f"M3CQ requires {DEFAULT_RECEIPT.as_posix()}, got {project_relative(receipt)}")
    if not args.write_receipt:
        raise PacketError("M3CQ requires --write-receipt")
    return receipt


def load_inputs() -> dict[str, dict[str, Any]]:
    return {
        "m3cp": load_json(M3CP_RECEIPT),
        "m3co": load_json(M3CO_RECEIPT),
        "m3cn": load_json(M3CN_RECEIPT),
        "m3cj": load_json(M3CJ_RECEIPT),
        "m3ck": load_json(M3CK_RECEIPT),
        "manifest_contract": load_json(MANIFEST_CONTRACT),
        "training_provenance": load_json(TRAINING_PROVENANCE),
        "validation_report": load_json(VALIDATION_REPORT),
    }


def artifact_references() -> dict[str, dict[str, str]]:
    return {
        "goal": file_reference(Path("GOAL.md")),
        "active_prompt": file_reference(ACTIVE_PROMPT),
        "return_to_form_plan": file_reference(RETURN_TO_FORM_PLAN),
        "manifest_contract": file_reference(MANIFEST_CONTRACT),
        "training_code": file_reference(TRAIN_SCRIPT),
        "evaluation_code": file_reference(EVALUATE_SCRIPT),
        "sampler_packet_helper": file_reference(SAMPLER_PACKET_SCRIPT),
        "m3cp_training_distribution_sampler": file_reference(M3CP_RECEIPT),
        "m3co_tensor_input_quality": file_reference(M3CO_RECEIPT),
        "m3cn_label_source_quality_review": file_reference(M3CN_RECEIPT),
        "m3cj_local_train_eval_sanity": file_reference(M3CJ_RECEIPT),
        "m3ck_architecture_input_microprobe": file_reference(M3CK_RECEIPT),
        "current_model_state_output": file_reference(MODEL_STATE),
        "current_training_provenance_output": file_reference(TRAINING_PROVENANCE),
        "current_validation_report_output": file_reference(VALIDATION_REPORT),
    }


def m3cj_runs(inputs: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        str(run.get("name")): run
        for run in inputs["m3cj"].get("runs", [])
        if isinstance(run, dict)
    }


def artifact_hash_from_m3cj(path: Path, inputs: dict[str, dict[str, Any]]) -> str | None:
    for artifact in inputs["m3cj"].get("current_ignored_artifacts", {}).get("files", []):
        if isinstance(artifact, dict) and artifact.get("path") == path.as_posix():
            value = artifact.get("sha256")
            return str(value) if isinstance(value, str) else None
    return None


def prediction_distribution(metrics: dict[str, Any]) -> dict[str, Any]:
    confusion = metrics.get("confusion_matrix", {}) if isinstance(metrics, dict) else {}
    labels = confusion.get("labels", [])
    matrix = confusion.get("rows_true_columns_predicted", [])
    if not isinstance(labels, list) or not isinstance(matrix, list):
        return {"labels": [], "predicted_counts": {}, "true_support": {}, "predicted_single_class": None}
    column_counts = [0 for _label in labels]
    row_counts = []
    for row in matrix:
        if not isinstance(row, list):
            continue
        row_counts.append(sum(int(value) for value in row))
        for index, value in enumerate(row):
            if index < len(column_counts):
                column_counts[index] += int(value)
    total = sum(row_counts)
    predicted_counts = {str(label): column_counts[index] for index, label in enumerate(labels)}
    true_support = {str(label): row_counts[index] for index, label in enumerate(labels)}
    predicted_single_class = None
    for label, count in predicted_counts.items():
        if total and count == total:
            predicted_single_class = label
    return {
        "labels": [str(label) for label in labels],
        "true_support": true_support,
        "predicted_counts": predicted_counts,
        "predicted_single_class": predicted_single_class,
        "examples": total,
        "top1_accuracy": metrics.get("top1_accuracy"),
        "macro_f1": metrics.get("macro_f1"),
        "per_class": metrics.get("per_class"),
    }


def current_artifact_hash_matches(inputs: dict[str, dict[str, Any]]) -> dict[str, bool]:
    return {
        "model_state": sha256_file(project_path(MODEL_STATE, "model state")) == artifact_hash_from_m3cj(MODEL_STATE, inputs),
        "training_provenance": sha256_file(project_path(TRAINING_PROVENANCE, "training provenance"))
        == artifact_hash_from_m3cj(TRAINING_PROVENANCE, inputs),
        "validation_report": sha256_file(project_path(VALIDATION_REPORT, "validation report"))
        == artifact_hash_from_m3cj(VALIDATION_REPORT, inputs),
    }


def command_contains(command: Any, option: str) -> bool:
    return isinstance(command, list) and option in [str(item) for item in command]


def command_option_value(command: Any, option: str) -> str | None:
    if not isinstance(command, list):
        return None
    values = [str(item) for item in command]
    try:
        return values[values.index(option) + 1]
    except (ValueError, IndexError):
        return None


def training_run_rows(inputs: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for name, run in m3cj_runs(inputs).items():
        hyperparameters = run.get("hyperparameters", {}) if isinstance(run, dict) else {}
        history = run.get("history", []) if isinstance(run, dict) else []
        evaluation = run.get("evaluation") or run.get("result") or {}
        rows.append(
            {
                "name": name,
                "classification": run.get("classification"),
                "hyperparameters": hyperparameters,
                "history_summary": {
                    "epoch_count": len(history) if isinstance(history, list) else 0,
                    "best_train_accuracy": max(
                        (float(item.get("train_accuracy", 0.0)) for item in history if isinstance(item, dict)),
                        default=evaluation.get("train_accuracy"),
                    ),
                    "best_validation_accuracy": max(
                        (float(item.get("validation_accuracy", 0.0)) for item in history if isinstance(item, dict)),
                        default=evaluation.get("validation_accuracy_during_training"),
                    ),
                    "final_train_loss": history[-1].get("train_loss")
                    if isinstance(history, list) and history and isinstance(history[-1], dict)
                    else None,
                    "final_validation_loss": history[-1].get("validation_loss")
                    if isinstance(history, list) and history and isinstance(history[-1], dict)
                    else None,
                },
                "evaluation": evaluation,
            }
        )
    return rows


def checkpoint_provenance_review(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    runs = m3cj_runs(inputs)
    lr001 = runs.get("train_all_lr001", {})
    lr001_hyperparameters = lr001.get("hyperparameters", {}) if isinstance(lr001, dict) else {}
    lr001_evaluation = lr001.get("evaluation", {}) if isinstance(lr001, dict) else {}
    provenance = inputs["training_provenance"]
    report = inputs["validation_report"]
    current_test_distribution = prediction_distribution(report.get("test", {}))
    command = provenance.get("training_command")
    hash_matches = current_artifact_hash_matches(inputs)
    current_checkpoint_policy = (provenance.get("checkpoint_selection") or {}).get("policy")
    m3cj_checkpoint_policy = lr001_hyperparameters.get("checkpoint_selection")
    m3cj_predicted_single_class = lr001_evaluation.get("predicted_single_class")
    current_predicted_single_class = current_test_distribution.get("predicted_single_class")
    caveat_reconciled = (
        all(hash_matches.values())
        and current_checkpoint_policy == "final"
        and not command_contains(command, "--checkpoint-selection")
        and current_predicted_single_class == "morning"
    )
    visible_blockers = []
    if not all(hash_matches.values()):
        visible_blockers.append("m3cj_current_artifact_hash_reference_mismatch")
    return {
        "m3cj_artifact_hash_matches_current_outputs": hash_matches,
        "m3cj_train_all_lr001_summary": {
            "hyperparameters": lr001_hyperparameters,
            "evaluation": lr001_evaluation,
        },
        "current_output_truth": {
            "training_command": command,
            "training_command_passed_checkpoint_selection_flag": command_contains(command, "--checkpoint-selection"),
            "checkpoint_selection_default_in_train_script": "final",
            "best_validation_selection_if_requested": (
                "highest validation accuracy, with lower validation loss as tie-break"
            ),
            "training_provenance_checkpoint_selection": provenance.get("checkpoint_selection"),
            "current_test_prediction_distribution": current_test_distribution,
            "current_validation_metrics": {
                "top1_accuracy": (report.get("validation") or {}).get("top1_accuracy"),
                "macro_f1": (report.get("validation") or {}).get("macro_f1"),
                "prediction_distribution": prediction_distribution(report.get("validation", {})),
            },
            "current_test_metrics": {
                "top1_accuracy": (report.get("test") or {}).get("top1_accuracy"),
                "macro_f1": (report.get("test") or {}).get("macro_f1"),
                "threshold_metrics": (report.get("test") or {}).get("threshold_metrics"),
            },
            "threshold_calibration": {
                "selected_threshold": (report.get("threshold_calibration") or {}).get("selected_threshold"),
                "selected_metrics": (report.get("threshold_calibration") or {}).get("selected_metrics"),
                "selection_rule": (report.get("threshold_calibration") or {}).get("selection_rule"),
                "assessment": (
                    "Threshold calibration is downstream of top-1/macro-F1 reporting. The current selected "
                    "threshold rejects every test example, but that fail-closed threshold does not cause the "
                    "underlying single-class top-1 confusion matrix."
                ),
            },
            "validation_report_status": report.get("status"),
            "pass_status": report.get("pass_status"),
        },
        "reconciliation": {
            "m3cj_summary_checkpoint_policy": m3cj_checkpoint_policy,
            "current_artifact_checkpoint_policy": current_checkpoint_policy,
            "m3cj_summary_predicted_single_class": m3cj_predicted_single_class,
            "current_artifact_predicted_single_class": current_predicted_single_class,
            "caveat_reconciled_or_superseded_by_current_artifacts": caveat_reconciled,
            "separate_checkpoint_metric_reconciliation_packet_needed_before_local_train_all": False
            if caveat_reconciled
            else True,
            "interpretation": (
                "The M3CJ lr001 summary row is inconsistent with the current ignored artifacts it references. "
                "Those artifacts hash-match the M3CJ artifact list and show an implicit default-final checkpoint "
                "with single-class morning predictions, so this packet supersedes the M3CP caveat for future "
                "local prompt construction."
                if caveat_reconciled
                else "The M3CJ/current-output caveat remains unresolved and should be reconciled before fitting."
            ),
        },
        "visible_checkpoint_or_metric_reporting_blockers": visible_blockers,
    }


def optimizer_loss_regularization_review(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    provenance = inputs["training_provenance"]
    hyperparameters = provenance.get("hyperparameters", {})
    m3ck_command = inputs["m3ck"].get("generated_by", {}).get("command", [])
    m3ck_diagnostic = inputs["m3ck"].get("diagnostic", {})
    m3ck_train_fit_metrics = m3ck_diagnostic.get("train_fit_metrics", {}) if isinstance(m3ck_diagnostic, dict) else {}
    m3ck_first_update = (
        m3ck_diagnostic.get("gradient_logit_parameter_sanity", {}).get("first_update")
        if isinstance(m3ck_diagnostic, dict)
        else {}
    )
    visible_blockers = []
    if hyperparameters.get("optimizer") not in {"adamw", "adam"}:
        visible_blockers.append("unsupported_optimizer_in_current_provenance")
    if hyperparameters.get("label_smoothing", 0) < 0 or hyperparameters.get("label_smoothing", 0) >= 1:
        visible_blockers.append("invalid_label_smoothing")
    if hyperparameters.get("weight_decay", 0) < 0:
        visible_blockers.append("invalid_weight_decay")
    if hyperparameters.get("training_augmentation") != "none":
        visible_blockers.append("unexpected_region_axis_training_augmentation")
    return {
        "current_training_hyperparameters": hyperparameters,
        "current_training_history": provenance.get("history", []),
        "m3cj_training_run_rows": training_run_rows(inputs),
        "optimizer_loss_target_rows": {
            "optimizer": {
                "type": hyperparameters.get("optimizer"),
                "learning_rate": hyperparameters.get("learning_rate"),
                "weight_decay": hyperparameters.get("weight_decay"),
                "construction": (
                    "torch.optim.AdamW(model.parameters(), lr=args.learning_rate, "
                    "weight_decay=args.weight_decay)"
                ),
                "zero_grad": "optimizer.zero_grad(set_to_none=True)",
                "step": "optimizer.step() after loss.backward() during training batches",
            },
            "loss": {
                "function": "torch.nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)",
                "label_smoothing": hyperparameters.get("label_smoothing"),
                "class_weights": None,
                "target_dtype": "torch.long",
                "target_shape": "one scalar class index per clip; DataLoader batches to [batch]",
                "logit_shape": "[batch, 5]",
                "evidence": "RawFrameClipDataset.__getitem__ returns torch.tensor(label_index, dtype=torch.long)",
            },
            "scheduler": {
                "present": False,
                "evidence": "No scheduler is constructed or stepped in run_training.",
            },
            "gradient_clipping": {
                "present": False,
                "evidence": "No clip_grad_norm_ or clip_grad_value_ call exists in the current train path.",
            },
            "regularization": {
                "weight_decay": hyperparameters.get("weight_decay"),
                "label_smoothing": hyperparameters.get("label_smoothing"),
                "training_augmentation": hyperparameters.get("training_augmentation"),
                "dropout_in_current_architecture": False,
                "normalization_in_current_architecture": ["GroupNorm", "LayerNorm"],
                "known_limitation": next(
                    (
                        item
                        for item in provenance.get("known_limitations", [])
                        if isinstance(item, str) and "GroupNorm and LayerNorm" in item
                    ),
                    None,
                ),
            },
            "seed_and_determinism": {
                "seed": provenance.get("seed"),
                "random_seed_set": "random.seed(args.seed)",
                "torch_seed_set": "torch.manual_seed(args.seed)",
                "dataloader_generator_recorded": False,
                "num_workers": hyperparameters.get("num_workers"),
                "exact_batch_permutation_recorded": False,
                "assessment": (
                    "Exact permutations are not retained, but M3CP proves the batch caps cover all examples; "
                    "the missing permutation record is not an exposure or target-semantics blocker."
                ),
            },
        },
        "tiny_trainfit_optimizer_comparison": {
            "m3ck_command": m3ck_command,
            "learning_rate": float(command_option_value(m3ck_command, "--learning-rate") or 0.0),
            "weight_decay": float(command_option_value(m3ck_command, "--weight-decay") or 0.0),
            "epochs": int(command_option_value(m3ck_command, "--epochs") or 0),
            "first_update": m3ck_first_update,
            "final_accuracy": m3ck_train_fit_metrics.get("final_accuracy"),
            "success": m3ck_train_fit_metrics.get("success"),
            "interpretation": (
                "M3CK used the same scratch architecture/input family and an AdamW/CrossEntropy-style update "
                "with lr 0.003 and weight decay 0.0, and proved gradients, logits, and parameters can move "
                "enough to fit one balanced clip per label. That makes a total optimizer/loss/target wiring "
                "break unlikely."
            ),
        },
        "visible_optimizer_loss_regularization_blockers": visible_blockers,
        "collapse_assessment": {
            "current_settings_plausibly_explain_collapse": True,
            "explanation": (
                "No loss/target code defect is visible. The stronger explanation is that the current full-split "
                "train-all recipe is under-optimized for the repaired split: only five epochs, no scheduler, no "
                "augmentation, no label smoothing, no explicit checkpoint-selection flag in the retained command, "
                "and train accuracy never rises above chance-like levels, while M3CK needed a much longer tiny "
                "train-fit schedule to separate five examples."
            ),
            "not_explained_by": [
                "class-index mismatch",
                "target dtype mismatch",
                "label smoothing",
                "weight decay",
                "scheduler behavior",
                "gradient clipping behavior",
                "dropout or BatchNorm state in the current architecture",
                "threshold calibration",
            ],
        },
    }


def prior_receipt_summary(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        "m3cp_sampler_distribution_blockers": inputs["m3cp"]
        .get("decision", {})
        .get("visible_distribution_sampler_blockers"),
        "m3co_tensor_input_quality_blockers": inputs["m3co"]
        .get("decision", {})
        .get("visible_tensor_input_quality_blockers"),
        "m3cn_mechanical_source_label_ambiguity_cleared": inputs["m3cn"]
        .get("source_label_ambiguity_findings", {})
        .get("mechanical_source_label_ambiguity_cleared_for_current_manifests"),
        "m3ck_architecture_can_train_fit_balanced_tiny_subset": inputs["m3ck"]
        .get("decision", {})
        .get("m3ce_architecture_can_train_fit_balanced_tiny_subset"),
    }


def decision(
    review: dict[str, Any],
    checkpoint_review: dict[str, Any],
) -> dict[str, Any]:
    optimizer_blockers = review["visible_optimizer_loss_regularization_blockers"]
    reporting_blockers = checkpoint_review["visible_checkpoint_or_metric_reporting_blockers"]
    reconciliation = checkpoint_review["reconciliation"]
    packet_complete = not optimizer_blockers and not reporting_blockers
    checkpoint_packet_needed = not bool(reconciliation["caveat_reconciled_or_superseded_by_current_artifacts"])
    train_all_justified = packet_complete and not checkpoint_packet_needed
    if checkpoint_packet_needed:
        next_action = "continue_no_training_checkpoint_selection_or_metric_reconciliation_packet"
    elif train_all_justified:
        next_action = "prepare_bounded_local_train_all_after_optimizer_loss_packet"
    else:
        next_action = "continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet"
    return {
        "receipt_complete": packet_complete,
        "visible_optimizer_loss_regularization_blockers": optimizer_blockers,
        "visible_checkpoint_or_metric_reporting_blockers": reporting_blockers,
        "m3cp_provenance_caveat_reconciled_or_superseded": bool(
            reconciliation["caveat_reconciled_or_superseded_by_current_artifacts"]
        ),
        "checkpoint_selection_or_metric_reconciliation_packet_needed_first": checkpoint_packet_needed,
        "bounded_local_train_all_prompt_justified_now": train_all_justified,
        "compute_receipt_or_brev_planning_justified_now": False,
        "human_training_scope_budget_or_code_path_review_required_now": False,
        "optimizer_loss_regularization_defect_found": False,
        "current_optimizer_loss_regularization_settings_plausibly_explain_single_class_collapse": True,
        "exactly_one_next_action": next_action,
        "next_action_rationale": (
            "Optimizer/loss/regularization wiring is clean enough and the M3CP provenance caveat is superseded "
            "by current output artifacts. The next bounded step can prepare one local train-all prompt that "
            "predeclares the optimizer-schedule hypothesis and artifact/reporting contract; Brev remains "
            "unjustified."
            if train_all_justified
            else "Checkpoint/metric provenance remains unresolved; reconcile it before any fitting retry."
            if checkpoint_packet_needed
            else "The optimizer/loss packet is incomplete or has visible blockers; finish it before fitting."
        ),
    }


def future_conditions(decision_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "what_would_justify_one_bounded_local_train_all_prompt": [
            "Use the repaired PopSign fresh5 train/validation/test manifests and preserve M3CN/M3CO/M3CP evidence without source, label, manifest, tensor, or claim changes.",
            "Predeclare exactly one local/no-spend optimizer-schedule hypothesis rather than a sweep or blind retry.",
            "Pass an explicit --checkpoint-selection value in the future command so retained artifacts and receipt summaries cannot diverge.",
            "Write outputs only under an ignored local output directory plus a tracked receipt; no export, browser activation, model-card promotion, final-gate change, Brev command, or remote copy.",
            "Future success must beat M3CJ: test top-1 > 0.2, macro F1 > 0.06666666666666668, prediction distribution not single-class, no zero-recall selected labels, and validation accuracy not flat at chance.",
        ],
        "what_would_block_more_training_and_require_human_review": [
            "Any change to training scope, source approvals, label set, crop/tensor semantics, model architecture contract, budget, Brev spend, export, browser activation, model-card claims, final gates, or ASL correctness claims.",
            "Any future prompt that proposes a sweep, broad retry, fresh10/75/95-label training, or remote compute without a current compute receipt and explicit approval.",
            "Any unreconciled artifact/provenance mismatch in the exact checkpoint/output directory selected for a future run.",
        ],
        "current_human_review_required": decision_payload["human_training_scope_budget_or_code_path_review_required_now"],
    }


def build_receipt(args: argparse.Namespace) -> dict[str, Any]:
    inputs = load_inputs()
    optimizer_review = optimizer_loss_regularization_review(inputs)
    checkpoint_review = checkpoint_provenance_review(inputs)
    decision_payload = decision(optimizer_review, checkpoint_review)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CQ - PopSign fresh5 optimizer/loss/regularization packet",
        "status": "completed_no_training_no_mutation_optimizer_loss_regularization_packet",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": "scripts/build_popsign_fresh5_optimizer_loss_regularization_packet.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
        },
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "input_artifacts": artifact_references(),
        "scope": {
            "local_only": True,
            "existing_receipts_provenance_reports_and_code_paths_only": True,
            "no_training_or_fitting": True,
            "no_optimizer_construction_for_fitting": True,
            "no_optimizer_step": True,
            "no_backward_pass": True,
            "no_checkpoint_creation": True,
            "no_sweep_or_broad_retry": True,
            "no_brev_command": True,
            "no_brev_spend": True,
            "no_brev_worker_lifecycle_change": True,
            "no_remote_command": True,
            "no_source_register_mutation": True,
            "no_source_import_or_media_download": True,
            "no_manifest_mutation": True,
            "no_tensor_mutation": True,
            "no_label_expansion": True,
            "no_pseudo_labels": True,
            "no_pretrained_dependency": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
            "no_push": True,
        },
        "prior_receipt_summary": prior_receipt_summary(inputs),
        "optimizer_loss_regularization_review": optimizer_review,
        "checkpoint_metric_provenance_review": checkpoint_review,
        "decision": decision_payload,
        "future_training_or_stop_conditions": future_conditions(decision_payload),
        "guardrails": {
            "training_run": False,
            "tiny_overfit_rerun": False,
            "fitting": False,
            "optimizer_constructed_for_fitting": False,
            "optimizer_step": False,
            "backward_pass": False,
            "checkpoint_created": False,
            "sweep_or_broad_retry": False,
            "brev_command_run": False,
            "brev_spend": False,
            "brev_worker_lifecycle_changed": False,
            "remote_command": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "manifest_mutation": False,
            "tensor_mutation": False,
            "pretrained_components": [],
            "export": False,
            "browser_activation": False,
            "model_card_promotion": False,
            "final_gate_change": False,
            "unsupported_claim": False,
            "push": False,
        },
        "validation_commands": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/build_popsign_fresh5_optimizer_loss_regularization_packet.py",
            ".venv/bin/python scripts/build_popsign_fresh5_optimizer_loss_regularization_packet.py --receipt docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json >/dev/null",
            "git diff --check",
            "node scripts/audit_codex_pair_state.mjs --json",
        ],
        "exactly_one_next_action": decision_payload["exactly_one_next_action"],
    }


def main() -> int:
    args = parse_args()
    try:
        receipt_path = validate_args(args)
        receipt = build_receipt(args)
        write_json(receipt_path, receipt)
    except PacketError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
