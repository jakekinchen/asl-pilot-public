#!/usr/bin/env python3
"""Run one bounded PopSign fresh5 region-grid tiny-overfit probe."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import platform
import sys
from pathlib import Path
from typing import Any

from run_region_grid_tcn_tiny_overfit import (
    SUCCESS_THRESHOLD,
    TinyOverfitError,
    json_ready,
    select_subset,
    subset_contract_evidence,
    train_tiny_overfit,
    write_json,
)
from train_rawframe_model import (
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
    local_ml_environment_reference,
    require_current_local_ml_environment,
    select_device,
    should_verify_retained_local_ml_environment,
    validate_manifest,
)


SCHEMA_VERSION = "asl-pilot-popsign-fresh5-model-data-design-ablation/v1"
MODEL_ID = "asl-pilot-popsign-fresh5-region-grid-tcn-tiny-overfit-v1"
DEFAULT_SEED = 20260527
DEFAULT_EPOCHS = 120
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-region-grid/train.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-region-grid/test.json")
DEFAULT_OUTPUT_DIR = Path("output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json")
M3BS_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--clips-per-label", type=int, choices=(1, 2), default=1)
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
        "scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
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
            raise TinyOverfitError(f"M3BV requires {expected_relative.as_posix()}, got {project_relative(actual)}")
    if not args.check_files:
        raise TinyOverfitError("M3BV requires --check-files")
    if args.frame_count != 16:
        raise TinyOverfitError("M3BV requires --frame-count 16")
    if args.image_size != 96:
        raise TinyOverfitError("M3BV requires --image-size 96")
    if args.num_workers != 0:
        raise TinyOverfitError("M3BV requires --num-workers 0")
    if args.epochs <= 0 or args.epochs > 200:
        raise TinyOverfitError("M3BV --epochs must be between 1 and 200")
    if args.learning_rate <= 0:
        raise TinyOverfitError("M3BV --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise TinyOverfitError("M3BV --weight-decay must be greater than or equal to zero")
    return train_manifest, validation_manifest, test_manifest, output_dir, receipt_path


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def manifest_label_order(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise TinyOverfitError("manifest labels must be a list")
    return [str(label["label_id"]) for label in labels]


def receipt_references() -> dict[str, Any]:
    return {
        "m3bu_region_grid_local_smoke": file_reference(M3BU_RECEIPT),
        "m3bt_region_grid_materialization": file_reference(M3BT_RECEIPT),
        "m3bs_full_frame_baseline": file_reference(M3BS_RECEIPT),
    }


def baseline_metrics(m3bu: dict[str, Any], m3bs: dict[str, Any]) -> dict[str, Any]:
    m3bu_eval = m3bu["smoke_evaluation"]
    m3bs_eval = m3bs["smoke_evaluation"]
    return {
        "m3bu_region_grid_mosaic_smoke": {
            "validation_top1_accuracy": m3bu_eval["validation_metrics"]["top1_accuracy"],
            "validation_macro_f1": m3bu_eval["validation_metrics"]["macro_f1"],
            "test_top1_accuracy": m3bu_eval["test_metrics"]["top1_accuracy"],
            "test_macro_f1": m3bu_eval["test_metrics"]["macro_f1"],
            "test_false_pass_rate": m3bu_eval["test_metrics"]["false_pass_rate"],
            "test_zero_recall_labels": m3bu_eval["test_metrics"]["zero_recall_labels"],
            "pen_test_recall": m3bu_eval["test_metrics"]["per_class"]["pen"]["recall"],
            "preserve_region_axis": False,
        },
        "m3bs_full_frame_smoke": {
            "validation_top1_accuracy": m3bs_eval["validation_metrics"]["top1_accuracy"],
            "validation_macro_f1": m3bs_eval["validation_metrics"]["macro_f1"],
            "test_top1_accuracy": m3bs_eval["test_metrics"]["top1_accuracy"],
            "test_macro_f1": m3bs_eval["test_metrics"]["macro_f1"],
            "test_false_pass_rate": m3bs_eval["test_metrics"]["false_pass_rate"],
            "test_zero_recall_labels": [
                label
                for label, metrics in m3bs_eval["test_metrics"]["per_class"].items()
                if float(metrics["recall"]) <= 0.0
            ],
            "preserve_region_axis": False,
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
    m3bu: dict[str, Any],
    m3bs: dict[str, Any],
) -> dict[str, Any]:
    success = bool(training_result["success"])
    next_action = (
        "continue_data_vocabulary_separability_packet"
        if success
        else "stop_until_supported_training_signal_exists"
    )
    blocker_classification = (
        "data_vocabulary_split_or_crop_generalization"
        if success
        else "model_input_design_or_training_signal"
    )
    baseline = baseline_metrics(m3bu, m3bs)
    final_metrics = training_result["final_eval_metrics"]
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3BV - PopSign fresh5 model/data design ablation",
        "status": "tiny_overfit_succeeded" if success else "tiny_overfit_failed",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
            "command": command_for_args(args),
            "script": file_reference(Path(__file__)),
            "base_helper": file_reference(Path("scripts/run_region_grid_tcn_tiny_overfit.py")),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "active_prompt": "docs/model/return-to-form-popsign-fresh5-model-data-design-ablation-goal-loop-prompt.md",
        "scope": {
            "exactly_one_local_design_ablation": True,
            "local_only": True,
            "no_brev_training_or_spend": True,
            "no_remote_command": True,
            "no_broad_training": True,
            "no_fresh10_training": True,
            "no_source_register_change": True,
            "no_unreviewed_source_import": True,
            "no_pretrained_dependency": True,
            "no_pseudo_labels": True,
            "no_export_or_browser_activation": True,
            "no_model_card_promotion": True,
            "no_final_gate_change": True,
        },
        "source_receipts": receipt_references(),
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
        "pre_run_plan": {
            "hypothesis": (
                "If the intended true_temporal_convnet_region_grid path preserves region identity and can memorize "
                "one deterministic train clip per PopSign fresh5 label, then the M3BU weakness is not primarily a "
                "total model/input-contract break. If it cannot memorize this tiny subset, Brev and wider-label work "
                "should stop pending model/input-contract or data-signal repair."
            ),
            "distinguishes": (
                "This ablation uses the same approved M3BT rgb_regions_grid_v1 tensors as M3BU but avoids the "
                "M3BU mosaic-and-resize path by preserving B,T,R,C,H,W into the true region-aware model. It isolates "
                "basic learnability of the tensors and labels from held-out generalization."
            ),
            "baseline_metrics": baseline,
            "command": command_for_args(args),
            "device": str(device),
            "seed": args.seed,
            "caps": {
                "clips_per_label": args.clips_per_label,
                "epochs": args.epochs,
                "batch_size": args.batch_size,
                "learning_rate": args.learning_rate,
                "weight_decay": args.weight_decay,
                "frame_count": args.frame_count,
                "image_size": args.image_size,
                "num_workers": args.num_workers,
            },
            "pass_fail_thresholds": {
                "tiny_subset_accuracy_gte": SUCCESS_THRESHOLD,
                "no_zero_recall_selected_labels": True,
                "preserve_region_axis": True,
                "required_input_contract": REGION_AWARE_DERIVED_INPUT,
                "predeclared_before_run": True,
            },
            "compute_receipt_trigger": (
                "This tiny memorization probe alone cannot justify Brev. A later compute receipt would require "
                "additional local evidence that improves held-out or separability signal beyond M3BU while preserving "
                "region identity and staying within approved source constraints."
            ),
            "route_if_passed": "continue_data_vocabulary_separability_packet",
            "route_if_failed": "stop_until_supported_training_signal_exists",
        },
        "ablation": {
            "ran": True,
            "type": "deterministic_tiny_overfit_input_contract_probe",
            "model_id": args.model_id,
            "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
            "initialization": "random",
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
                    "clips_per_label from the training split"
                ),
                "clip_count": len(subset_rows),
                "clips_per_label": args.clips_per_label,
                "clips": subset_rows,
            },
            "input_contract": {
                "required_contract": REGION_AWARE_DERIVED_INPUT,
                "status": "passed",
                "consumed_tensor_key": "rgb_regions",
                "derived_input_name": REGION_AWARE_DERIVED_INPUT,
                "preserve_region_axis": True,
                "no_mosaic_training_path": True,
                "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"] if subset_rows else None,
                "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"] if subset_rows else None,
                "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
                "batched_model_input_shape": list(batch.shape),
                "batched_model_input_axis": "B,T,R,C,H,W",
                "logits_shape": proof_logits_shape,
                "region_axis_preserved_until": "TrueTemporalConvNetRawFrameClassifier.region_attention",
            },
            "memorization_metrics": {
                "status": training_result["status"],
                "success": success,
                "success_threshold": training_result["success_threshold"],
                "final_accuracy": final_metrics["accuracy"],
                "final_loss": final_metrics["loss"],
                "final_correct": final_metrics["correct"],
                "final_examples": final_metrics["examples"],
                "zero_recall_labels": final_metrics["zero_recall_labels"],
                "per_label": final_metrics["per_label"],
                "predictions": final_metrics["predictions"],
                "best_eval_metrics": training_result["best_eval_metrics"],
                "history_tail": training_result["history_tail"],
            },
        },
        "comparison": {
            "baselines": baseline,
            "ablation_result": {
                "tiny_subset_accuracy": final_metrics["accuracy"],
                "tiny_subset_zero_recall_labels": final_metrics["zero_recall_labels"],
                "held_out_metrics_not_run": True,
                "held_out_metrics_note": (
                    "This one-job diagnostic measures train-fit only. It does not replace validation/test evidence "
                    "from M3BU or authorize model promotion."
                ),
            },
            "interpretation": (
                "The preserved-region model/input path can memorize the deterministic PopSign fresh5 tiny subset, "
                "so the current blocker is more likely held-out separability, split/vocabulary/data quality, or "
                "crop/region target weakness than a total rgb_regions_grid_v1 loader/model break."
                if success
                else "The preserved-region path could not memorize the deterministic PopSign fresh5 tiny subset, so "
                "the current evidence does not support Brev, fresh10, or promotion."
            ),
        },
        "decision": {
            "blocker_classification": blocker_classification,
            "local_ablation_supports_brev_training_receipt_now": False,
            "fresh10_region_grid_materialization_justified_now": False,
            "browser_activation_or_promotion_justified_now": False,
            "exactly_one_next_action": next_action,
            "next_action_rationale": (
                "Tiny memorization passed while held-out M3BU metrics remain weak, so the next useful no-spend "
                "artifact should characterize label/vocabulary/split/crop separability before any compute receipt."
                if success
                else "Tiny memorization failed, so the current evidence lacks supported local training signal."
            ),
        },
        "guardrails": {
            "pretrained_components": [],
            "pseudo_labels_generated": False,
            "remote_training_run": False,
            "brev_spend": False,
            "source_register_mutation": False,
            "source_import_or_media_download": False,
            "browser_model_activation": False,
            "model_card_promotion": False,
            "final_readiness_claim": False,
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
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py",
            ".venv/bin/python scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py --train-manifest data/manifests/return-to-form-popsign-fresh5-region-grid/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-region-grid/test.json --output-dir output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit --receipt docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json --clips-per-label 1 --epochs 120 --batch-size 5 --learning-rate 0.003 --weight-decay 0.0 --frame-count 16 --image-size 96 --num-workers 0 --seed 20260527 --check-files --write-receipt",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null",
        ],
        "tracked_files_changed": [
            "scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py",
            "docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json",
            "docs/session-logs/377-mission-3bv-popsign-fresh5-model-data-design-ablation.md",
        ],
        "local_artifacts_written_or_updated": [
            "output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/model_state.pt",
            "output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/selected-subset.json",
            "output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json",
        ],
        "exactly_one_next_action": next_action,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    train_manifest, validation_manifest, test_manifest, output_dir, receipt_path = validate_contract_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3BV PopSign fresh5 tiny overfit")
    torch = import_torch()
    train_summary = validate_manifest(train_manifest, "train", args.check_files, True, False, False, False)
    validation_summary = validate_manifest(validation_manifest, "validation", args.check_files, True, False, False, False)
    test_summary = validate_manifest(test_manifest, "test", args.check_files, True, False, False, False)
    manifest = load_manifest(train_manifest)
    selected = select_subset(manifest, args.clips_per_label)
    label_ids = sorted(str(label_id) for label_id in train_summary["label_ids"])
    expected_subset_size = len(label_ids) * args.clips_per_label
    if len(selected) != expected_subset_size:
        raise TinyOverfitError(f"selected subset size {len(selected)} does not match {expected_subset_size}")
    if args.batch_size != len(selected):
        raise TinyOverfitError(f"M3BV requires full-subset --batch-size {len(selected)} for this selection")

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
    proof_model = build_model(torch, len(label_ids), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        proof_logits = proof_model(batch.to(device)).detach().cpu()
    if list(proof_logits.shape) != [len(selected), len(label_ids)]:
        raise TinyOverfitError(f"proof logits shape mismatch: {list(proof_logits.shape)}")

    model, training_result = train_tiny_overfit(torch, args, batch, labels, label_ids, device)
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "model_state.pt"
    subset_path = output_dir / "selected-subset.json"
    provenance_path = output_dir / "tiny-overfit-provenance.json"
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
        "schema_version": "asl-pilot-popsign-fresh5-region-grid-tiny-overfit-subset/v1",
        "generated_at": generated_at,
        "selection_rule": "sort labels lexicographically, sort clips within each label by clip_id, select first clips_per_label",
        "source_manifest": project_relative(train_manifest),
        "clips_per_label": args.clips_per_label,
        "clips": subset_rows,
    }
    write_json(subset_path, subset_report)
    provenance = {
        "schema_version": "asl-pilot-popsign-fresh5-region-grid-tiny-overfit-provenance/v1",
        "generated_at": generated_at,
        "model_id": args.model_id,
        "command": command_for_args(args),
        "script": file_reference(Path(__file__)),
        "base_helper": file_reference(Path("scripts/run_region_grid_tcn_tiny_overfit.py")),
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
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
            "no_mosaic_training_path": True,
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
    m3bu = load_json(PROJECT_ROOT / M3BU_RECEIPT)
    m3bs = load_json(PROJECT_ROOT / M3BS_RECEIPT)
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
        m3bu=m3bu,
        m3bs=m3bs,
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
        "output_dir": project_relative(output_dir),
        "receipt": project_relative(receipt_path) if args.write_receipt else None,
        "artifacts": artifacts,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, TinyOverfitError) as error:
        print(f"M3BV PopSign fresh5 tiny overfit failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
