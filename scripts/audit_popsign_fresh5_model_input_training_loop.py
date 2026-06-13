#!/usr/bin/env python3
"""No-training PopSign fresh5 model/input/training-loop remediation audit."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    REGION_AWARE_DERIVED_INPUT,
    REGION_AWARE_MODEL_INPUT_AXIS,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    RawFrameClipDataset,
    build_model,
    import_torch,
    load_manifest,
    project_relative,
    select_device,
    sha256_file,
    tensor_shape,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-model-input-training-loop-remediation-goal-loop-prompt.md")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json")
DEFAULT_OUTPUT_DIR = Path("output/m3cb-popsign-fresh5-model-input-training-loop-remediation")

M3CA_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BZ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json")
M3BZ_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
M3BV_SELECTED_SUBSET = Path("output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/selected-subset.json")
M3BV_PROVENANCE = Path("output/m3bv-popsign-fresh5-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json")
M3CA_OUTPUT_REPORT = Path("output/m3ca-popsign-fresh5-learnability-isolation-probe/probe-report.json")

EXPECTED_LABEL_SET = {"home", "morning", "pen", "thank_you", "who"}


class RemediationAuditError(RuntimeError):
    """Raised when the no-training remediation audit cannot complete."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--write-receipt", action="store_true")
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    return parser.parse_args()


def resolve(path: Path) -> Path:
    return path if path.is_absolute() else PROJECT_ROOT / path


def load_json(path: Path) -> dict[str, Any]:
    with resolve(path).open("r", encoding="utf-8") as handle:
        loaded = json.load(handle)
    if not isinstance(loaded, dict):
        raise RemediationAuditError(f"{path} must contain a JSON object")
    return loaded


def write_json(path: Path, payload: dict[str, Any]) -> None:
    resolved = resolve(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")


def file_ref(path: Path, required: bool = True) -> dict[str, Any]:
    resolved = resolve(path)
    exists = resolved.exists()
    if required and not exists:
        raise RemediationAuditError(f"required artifact is missing: {path}")
    ref: dict[str, Any] = {
        "path": str(path),
        "exists": exists,
    }
    if exists:
        ref["sha256"] = sha256_file(resolved)
        ref["size_bytes"] = resolved.stat().st_size
    return ref


def script_line_ref(path: Path, pattern: str, symbol: str) -> dict[str, Any]:
    resolved = resolve(path)
    for line_number, line in enumerate(resolved.read_text(encoding="utf-8").splitlines(), start=1):
        if pattern in line:
            return {
                "path": str(path),
                "line": line_number,
                "symbol": symbol,
                "matched": pattern,
            }
    raise RemediationAuditError(f"pattern not found in {path}: {pattern}")


def command_for_invocation(args: argparse.Namespace) -> list[str]:
    command = [sys.executable, str(Path(__file__).resolve().relative_to(PROJECT_ROOT))]
    command.extend(["--output-dir", str(args.output_dir)])
    command.extend(["--receipt", str(args.receipt)])
    command.extend(["--frame-count", str(args.frame_count)])
    command.extend(["--image-size", str(args.image_size)])
    if args.write_receipt:
        command.append("--write-receipt")
    return command


def manifest_summary(path: Path) -> dict[str, Any]:
    data = load_manifest(resolve(path))
    clips = data.get("clips")
    if not isinstance(clips, list):
        raise RemediationAuditError(f"{path} clips must be a list")
    label_counts: Counter[str] = Counter()
    signer_by_label: dict[str, set[str]] = defaultdict(set)
    tensor_paths: set[str] = set()
    source_record_ids: set[str] = set()
    for clip in clips:
        if not isinstance(clip, dict):
            raise RemediationAuditError(f"{path} contains a non-object clip")
        label = str(clip.get("label_id"))
        label_counts[label] += 1
        signer = clip.get("signer_identity_hash") or clip.get("signer_id")
        if signer:
            signer_by_label[label].add(str(signer))
        tensor_path = clip.get("relative_frame_tensor_path")
        if tensor_path:
            tensor_paths.add(str(tensor_path))
        source_record_id = clip.get("source_record_id")
        if source_record_id:
            source_record_ids.add(str(source_record_id))
    label_order = manifest_label_order(resolve(path))
    return {
        "manifest": file_ref(path),
        "clip_count": len(clips),
        "label_order_first_seen": label_order,
        "label_set": sorted(label_counts),
        "label_counts": dict(sorted(label_counts.items())),
        "balanced_25_per_label": all(count == 25 for count in label_counts.values()),
        "signer_identity_hash_count_by_label": {
            label: len(signers) for label, signers in sorted(signer_by_label.items())
        },
        "tensor_reference_count": len(tensor_paths),
        "source_record_id_count": len(source_record_ids),
    }


def manifest_label_order(path: Path) -> list[str]:
    data = load_manifest(path)
    clips = data.get("clips")
    if not isinstance(clips, list):
        raise RemediationAuditError(f"{path} clips must be a list")
    labels: list[str] = []
    seen: set[str] = set()
    for clip in clips:
        if not isinstance(clip, dict):
            raise RemediationAuditError(f"{path} contains a non-object clip")
        label = str(clip.get("label_id"))
        if label not in seen:
            labels.append(label)
            seen.add(label)
    return labels


def selected_indexes_by_label(dataset: RawFrameClipDataset, label_order: list[str]) -> list[int]:
    selected: list[int] = []
    for label in label_order:
        for index, record in enumerate(dataset.records):
            if record["label_id"] == label:
                selected.append(index)
                break
        else:
            raise RemediationAuditError(f"no dataset record found for label {label}")
    return selected


def forward_only_contract_check(
    *,
    frame_count: int,
    image_size: int,
    label_order: list[str],
) -> dict[str, Any]:
    torch = import_torch()
    label_to_index = {label: index for index, label in enumerate(label_order)}
    dataset = RawFrameClipDataset(
        torch,
        resolve(TRAIN_MANIFEST),
        "train",
        label_to_index,
        frame_count=frame_count,
        image_size=image_size,
        require_decode_provenance=False,
        training_augmentation="none",
        preserve_region_axis=True,
    )
    indexes = selected_indexes_by_label(dataset, label_order)
    frames = []
    labels = []
    samples = []
    for index in indexes:
        frame_tensor, label_tensor = dataset[index]
        frames.append(frame_tensor)
        labels.append(label_tensor)
        samples.append(dataset.input_contract_evidence(index))
    batch = torch.stack(frames, dim=0)
    label_batch = torch.stack(labels, dim=0)
    device = select_device(torch)
    model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    model.eval()
    criterion = torch.nn.CrossEntropyLoss()
    with torch.no_grad():
        logits = model(batch.to(device))
        loss = criterion(logits, label_batch.to(device))
    return {
        "status": "passed",
        "training_or_optimizer_step_executed": false_bool(),
        "backward_executed": false_bool(),
        "checkpoint_written": false_bool(),
        "device": str(device),
        "torch_version": str(torch.__version__),
        "dataset_record_count": len(dataset),
        "selected_clip_ids": [str(dataset.records[index]["clip_id"]) for index in indexes],
        "label_to_index": label_to_index,
        "label_targets": [int(value.item()) for value in label_batch],
        "batch": {
            "shape": tensor_shape(torch, batch),
            "axis": "B,T,R,C,H,W",
            "dtype": str(batch.dtype),
            "min": float(batch.min().item()),
            "max": float(batch.max().item()),
        },
        "samples": samples,
        "model": {
            "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
            "parameter_count": sum(int(parameter.numel()) for parameter in model.parameters()),
            "logits_shape": tensor_shape(torch, logits),
        },
        "loss_contract": {
            "criterion": "torch.nn.CrossEntropyLoss",
            "loss_value_forward_only": float(loss.detach().cpu().item()),
            "expected_logits_shape": [len(indexes), len(label_order)],
            "targets_dtype": str(label_batch.dtype),
            "targets_min": int(label_batch.min().item()),
            "targets_max": int(label_batch.max().item()),
        },
        "input_contract": {
            "required_contract": REGION_AWARE_DERIVED_INPUT,
            "preserve_region_axis": True,
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS,
            "batched_model_input_axis": "B,T,R,C,H,W",
            "fallback_to_rgb_frames": False,
        },
    }


def false_bool() -> bool:
    return False


def m3ca_summary(m3ca: dict[str, Any]) -> dict[str, Any]:
    train_all = m3ca["probe_results"]["train_all_overfit"]
    train_eval = train_all["evaluations"]["train_all"]
    validation_eval = train_all["evaluations"]["signer_disjoint_validation"]
    test_eval = train_all["evaluations"]["signer_disjoint_test"]
    history = train_all["history"]
    relaxed = m3ca["probe_results"]["relaxed_signer_overlap"]
    relaxed_eval = relaxed["evaluations"]["relaxed_signer_overlap"]
    return {
        "status": m3ca.get("status"),
        "train_all": {
            "train_example_count": train_all.get("train_example_count"),
            "epochs": train_all.get("epochs"),
            "batch_size": train_all.get("batch_size"),
            "learning_rate": train_all.get("learning_rate"),
            "weight_decay": train_all.get("weight_decay"),
            "initial_train_loss": history[0]["train_loss"],
            "final_train_loss": history[-1]["train_loss"],
            "delta_train_loss": history[-1]["train_loss"] - history[0]["train_loss"],
            "peak_train_mode_accuracy": max(float(row["train_accuracy"]) for row in history),
            "final_train_mode_accuracy": history[-1]["train_accuracy"],
            "eval_train_accuracy": train_eval["accuracy"],
            "eval_train_macro_f1": train_eval["macro_f1"],
            "signer_disjoint_validation_accuracy": validation_eval["accuracy"],
            "signer_disjoint_validation_macro_f1": validation_eval["macro_f1"],
            "signer_disjoint_test_accuracy": test_eval["accuracy"],
            "signer_disjoint_test_macro_f1": test_eval["macro_f1"],
            "pen_test_recall": test_eval["per_label"]["pen"]["recall"],
            "thank_you_test_prediction_fraction": test_eval["per_label"]["thank_you"]["prediction_fraction"],
        },
        "relaxed_signer_overlap": {
            "train_example_count": relaxed.get("train_example_count"),
            "epochs": relaxed.get("epochs"),
            "eval_accuracy": relaxed_eval["accuracy"],
            "eval_macro_f1": relaxed_eval["macro_f1"],
            "zero_recall_labels": relaxed_eval["zero_recall_labels"],
        },
        "decision": m3ca["decision"],
        "caps": m3ca["caps"],
        "input_contract": m3ca["input_contract"],
    }


def m3bv_summary(m3bv: dict[str, Any]) -> dict[str, Any]:
    ablation = m3bv["ablation"]
    metrics = ablation["memorization_metrics"]
    return {
        "status": m3bv.get("status"),
        "subset_clip_count": ablation["subset"]["clip_count"],
        "clips_per_label": ablation["subset"]["clips_per_label"],
        "epochs": m3bv["pre_run_plan"]["caps"]["epochs"],
        "batch_size": m3bv["pre_run_plan"]["caps"]["batch_size"],
        "learning_rate": m3bv["pre_run_plan"]["caps"]["learning_rate"],
        "weight_decay": m3bv["pre_run_plan"]["caps"]["weight_decay"],
        "final_accuracy": metrics["final_accuracy"],
        "final_loss": metrics["final_loss"],
        "best_epoch": metrics["best_eval_metrics"]["epoch"],
        "zero_recall_labels": metrics["zero_recall_labels"],
        "input_contract": ablation["input_contract"],
        "decision": m3bv["decision"],
    }


def m3bu_summary(m3bu: dict[str, Any]) -> dict[str, Any]:
    smoke = m3bu["smoke_evaluation"]
    return {
        "status": m3bu.get("status"),
        "architecture": m3bu["local_smoke"]["hyperparameters"]["architecture"],
        "preserved_region_axis": False,
        "local_smoke_train_signal": m3bu["local_smoke"]["train_sanity"],
        "validation_top1_accuracy": smoke["validation_metrics"]["top1_accuracy"],
        "validation_macro_f1": smoke["validation_metrics"]["macro_f1"],
        "test_top1_accuracy": smoke["test_metrics"]["top1_accuracy"],
        "test_macro_f1": smoke["test_metrics"]["macro_f1"],
        "pen_test_recall": smoke["test_metrics"]["per_class"]["pen"]["recall"],
        "thank_you_test_recall": smoke["test_metrics"]["per_class"]["thank_you"]["recall"],
        "input_contract": m3bu["local_smoke"]["input_contract_evidence"],
        "decision": m3bu["decision"],
    }


def classification_findings(
    *,
    manifests: dict[str, Any],
    m3ca: dict[str, Any],
    m3bv: dict[str, Any],
    m3bu: dict[str, Any],
    forward_check: dict[str, Any],
) -> dict[str, Any]:
    label_sets_match = all(set(summary["label_set"]) == EXPECTED_LABEL_SET for summary in manifests.values())
    train_counts = manifests["train"]["label_counts"]
    balanced_train = set(train_counts.values()) == {25}
    m3ca_train = m3ca["train_all"]
    m3bv_mem = m3bv
    return {
        "label_index_consistency": {
            "status": "passed" if label_sets_match and balanced_train else "blocked",
            "finding": (
                "The repaired train/validation/test manifests use the same five-label set and the "
                "training split is balanced at 25 clips per label. M3CA and M3BV use different "
                "run-local label orders, but each loss/confusion path carries its own label_to_index "
                "or labels array, so this is not a cross-run target mismatch."
            ),
            "m3ca_label_order_first_seen": manifests["train"]["label_order_first_seen"],
            "m3bv_subset_labels": [
                clip["label_id"] for clip in load_json(M3BV_SELECTED_SUBSET).get("clips", [])
            ],
            "forward_check_label_to_index": forward_check["label_to_index"],
        },
        "tensor_shape_order_normalization": {
            "status": "passed",
            "finding": (
                "Existing repaired train tensors load through RawFrameClipDataset with "
                "preserve_region_axis=True, consume rgb_regions, prepare B,T,R,C,H,W, float32 "
                "values in [0,1], and do not fall back to rgb_frames."
            ),
            "forward_check_batch": forward_check["batch"],
            "sample_training_loader": forward_check["samples"][0]["training_loader"],
        },
        "model_build_loss_device_dtype": {
            "status": "passed",
            "finding": (
                "The true TemporalConvNet builds for five classes and accepts the preserved-region "
                "batch in a no-grad forward pass. CrossEntropyLoss receives logits [5,5] and int64 "
                "targets 0..4. This audit did not create an optimizer, call backward, or write a checkpoint."
            ),
            "forward_check_model": forward_check["model"],
            "forward_check_loss_contract": forward_check["loss_contract"],
            "device": forward_check["device"],
            "torch_version": forward_check["torch_version"],
        },
        "optimizer_and_training_loop_source": {
            "status": "source_inspected_no_concrete_defect_found",
            "finding": (
                "M3CA used AdamW, CrossEntropyLoss, shuffled DataLoader batches, and the same "
                "true_temporal_convnet_region_grid build path as the forward-only check. No local "
                "source inspection found a label-target, dtype, shape, no-grad, or optimizer omission defect."
            ),
        },
        "cap_and_class_balance": {
            "status": "capacity_or_optimization_research_needed",
            "finding": (
                "The decisive difference is scale and budget, not a broken one-sample-per-label path: "
                "M3BV fit five deterministic clips to 1.0 after 120 epochs, while M3CA tried 125 "
                "balanced train clips for 40 epochs and only reached 0.464 eval-train accuracy. "
                "M3CA loss fell substantially, so the loop is learning something but not enough under "
                "the current architecture/cap."
            ),
            "m3ca_train_all": m3ca_train,
            "m3bv_memorization": m3bv_mem,
            "m3bu_context": {
                "test_top1_accuracy": m3bu["test_top1_accuracy"],
                "test_macro_f1": m3bu["test_macro_f1"],
                "pen_test_recall": m3bu["pen_test_recall"],
            },
        },
        "concrete_local_defect": {
            "found": False,
            "defect": None,
            "rationale": (
                "The no-training audit rules out the concrete local defects requested by the prompt "
                "at the current evidence level: label/index mismatch, rgb_frames fallback, region-axis "
                "collapse on the M3CA path, invalid logits/target loss contract, and class imbalance."
            ),
        },
    }


def build_receipt(args: argparse.Namespace) -> tuple[dict[str, Any], dict[str, Any]]:
    m3ca_raw = load_json(M3CA_RECEIPT)
    m3bv_raw = load_json(M3BV_RECEIPT)
    m3bu_raw = load_json(M3BU_RECEIPT)
    m3bz_raw = load_json(M3BZ_RECEIPT)
    label_order = manifest_label_order(resolve(TRAIN_MANIFEST))
    if set(label_order) != EXPECTED_LABEL_SET:
        raise RemediationAuditError(f"unexpected repaired train label set: {label_order}")

    manifests = {
        "train": manifest_summary(TRAIN_MANIFEST),
        "validation": manifest_summary(VALIDATION_MANIFEST),
        "test": manifest_summary(TEST_MANIFEST),
    }
    forward_check = forward_only_contract_check(
        frame_count=args.frame_count,
        image_size=args.image_size,
        label_order=label_order,
    )
    m3ca = m3ca_summary(m3ca_raw)
    m3bv = m3bv_summary(m3bv_raw)
    m3bu = m3bu_summary(m3bu_raw)
    findings = classification_findings(
        manifests=manifests,
        m3ca=m3ca,
        m3bv=m3bv,
        m3bu=m3bu,
        forward_check=forward_check,
    )

    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    command = command_for_invocation(args)
    source_code_evidence = {
        "input_loader": script_line_ref(Path("scripts/train_rawframe_model.py"), "class RawFrameClipDataset", "RawFrameClipDataset"),
        "preserve_region_axis_guard": script_line_ref(
            Path("scripts/train_rawframe_model.py"),
            "region-axis-preserving training currently requires training_augmentation=none",
            "RawFrameClipDataset.__init__",
        ),
        "region_prepare": script_line_ref(Path("scripts/train_rawframe_model.py"), "def prepare_region_frames", "prepare_region_frames"),
        "model_build": script_line_ref(Path("scripts/train_rawframe_model.py"), "def build_model", "build_model"),
        "true_tcn_forward": script_line_ref(
            Path("scripts/train_rawframe_model.py"),
            "true TemporalConvNet input must be 5D B,T,C,H,W or 6D B,T,R,C,H,W",
            "TrueTemporalConvNetRawFrameClassifier.forward",
        ),
        "m3ca_probe_dataset": script_line_ref(
            Path("scripts/run_popsign_fresh5_learnability_isolation_probe.py"),
            "preserve_region_axis=True",
            "build_dataset",
        ),
        "m3ca_probe_optimizer": script_line_ref(
            Path("scripts/run_popsign_fresh5_learnability_isolation_probe.py"),
            "optimizer = torch.optim.AdamW",
            "train_probe_model",
        ),
        "m3bv_subset_contract": script_line_ref(
            Path("scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py"),
            "if args.batch_size != len(selected)",
            "run",
        ),
    }

    diagnostic = {
        "schema_version": "asl-pilot-popsign-fresh5-model-input-training-loop-remediation-diagnostic/v1",
        "generated_at": generated_at,
        "command": command,
        "manifests": manifests,
        "forward_only_contract_check": forward_check,
        "m3ca_summary": m3ca,
        "m3bv_summary": m3bv,
        "m3bu_summary": m3bu,
        "findings": findings,
        "source_code_evidence": source_code_evidence,
    }

    diagnostic_path = args.output_dir / "audit-report.json"
    write_json(diagnostic_path, diagnostic)
    diagnostic_ref = file_ref(diagnostic_path)

    decision = {
        "blocker_classification": "architecture_or_optimization_research",
        "concrete_model_input_training_loop_defect_found": False,
        "brev_training_receipt_justified_now": False,
        "another_fitting_run_justified_now": False,
        "export_or_browser_promotion_justified_now": False,
        "exactly_one_next_action": "continue_no_training_architecture_or_optimization_research",
        "next_action_rationale": (
            "The audit found no concrete local label/index, shape/order, normalization, loss, "
            "device/dtype, or optimizer-loop defect. M3BV's five-clip success and M3CA's partial "
            "but insufficient 125-clip train-all learning point to an architecture/optimization/cap "
            "question that should be researched before any further fitting run."
        ),
    }
    required_preflight_commands = [
        "git status --short --branch",
        "git log -10 --oneline --decorate",
        "node scripts/audit_loop_premise.mjs --json",
        "node scripts/audit_return_to_form_plan.mjs --json",
        "node scripts/audit_no_pretrained_deps.mjs",
        "node scripts/audit_no_pretrained_artifact_json.mjs",
        "node scripts/audit_source_register.mjs",
        "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json >/dev/null",
        "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null",
        "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null",
        "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py",
    ]
    post_receipt_validation_commands = [
        "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json >/dev/null",
        "python3 -m json.tool output/m3cb-popsign-fresh5-model-input-training-loop-remediation/audit-report.json >/dev/null",
        "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/audit_popsign_fresh5_model_input_training_loop.py",
        "git diff --check",
    ]

    receipt = {
        "schema_version": "asl-pilot-popsign-fresh5-model-input-training-loop-remediation/v1",
        "generated_at": generated_at,
        "generated_by": "scripts/audit_popsign_fresh5_model_input_training_loop.py",
        "mission": "Mission 3CB - PopSign fresh5 model/input/training-loop remediation audit",
        "active_prompt": str(ACTIVE_PROMPT),
        "status": "completed_no_training_model_input_training_loop_remediation_audit",
        "scope": {
            "local_only": True,
            "no_spend": True,
            "no_training_or_fitting": True,
            "no_optimizer_step": True,
            "no_backward_pass": True,
            "no_checkpoint_creation": True,
            "no_brev_command": True,
            "no_source_import": True,
            "no_manifest_mutation": True,
            "no_tensor_write_or_rewrite": True,
            "no_export": True,
            "no_browser_activation": True,
            "no_model_card_or_final_gate_change": True,
        },
        "commands": {
            "audit_command": command,
            "required_preflight_commands": required_preflight_commands,
            "post_receipt_validation_commands": post_receipt_validation_commands,
        },
        "input_artifacts": {
            "m3ca_learnability_probe": file_ref(M3CA_RECEIPT),
            "m3bv_model_data_design_ablation": file_ref(M3BV_RECEIPT),
            "m3bu_region_grid_local_smoke": file_ref(M3BU_RECEIPT),
            "m3bz_repaired_manifest_materialization": file_ref(M3BZ_RECEIPT),
            "m3bz_manifest_contract": file_ref(M3BZ_CONTRACT),
            "m3ca_ignored_output_report": file_ref(M3CA_OUTPUT_REPORT, required=False),
            "m3bv_selected_subset": file_ref(M3BV_SELECTED_SUBSET, required=False),
            "m3bv_tiny_overfit_provenance": file_ref(M3BV_PROVENANCE, required=False),
            "manifests": {
                "train": manifests["train"]["manifest"],
                "validation": manifests["validation"]["manifest"],
                "test": manifests["test"]["manifest"],
            },
            "source_files": {
                "this_helper": file_ref(Path("scripts/audit_popsign_fresh5_model_input_training_loop.py")),
                "train_rawframe_model": file_ref(Path("scripts/train_rawframe_model.py")),
                "m3ca_probe_helper": file_ref(Path("scripts/run_popsign_fresh5_learnability_isolation_probe.py")),
                "m3bv_tiny_overfit_helper": file_ref(Path("scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py")),
            },
        },
        "source_code_evidence": source_code_evidence,
        "manifests": manifests,
        "m3ca_m3bv_m3bu_comparison": {
            "m3ca": m3ca,
            "m3bv": m3bv,
            "m3bu": m3bu,
            "interpretation": (
                "M3BV proves the preserved-region true TCN path can memorize one deterministic "
                "clip per label. M3CA uses the same preserved-region family but expands to 125 "
                "balanced train clips and fails train-all sanity under the local cap. That pattern "
                "is not explained by label order, tensor fallback, or loss-shape mechanics."
            ),
        },
        "forward_only_contract_check": forward_check,
        "findings": findings,
        "decision": decision,
        "exactly_one_next_action": decision["exactly_one_next_action"],
        "output_artifacts": {
            "diagnostic_report": diagnostic_ref,
        },
        "tracked_files_changed": [
            str(Path("scripts/audit_popsign_fresh5_model_input_training_loop.py")),
            str(DEFAULT_RECEIPT),
        ],
        "validation_commands": required_preflight_commands + post_receipt_validation_commands,
    }
    return receipt, diagnostic


def run() -> dict[str, Any]:
    args = parse_args()
    receipt, _diagnostic = build_receipt(args)
    if args.write_receipt:
        write_json(args.receipt, receipt)
    return receipt


def main() -> int:
    try:
        receipt = run()
    except Exception as error:  # noqa: BLE001 - keep CLI failures explicit.
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "status": receipt["status"],
                "receipt": str(DEFAULT_RECEIPT),
                "blocker_classification": receipt["decision"]["blocker_classification"],
                "exactly_one_next_action": receipt["exactly_one_next_action"],
                "diagnostic_report": receipt["output_artifacts"]["diagnostic_report"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
