#!/usr/bin/env python3
"""Write a Tier 0 return-to-form learnability smoke receipt.

The training script intentionally keeps smoke provenance narrow. This reporter
loads that random-init checkpoint, evaluates the retained M3AD train,
validation, and test manifests, then compares the result to the pre-written
Tier 0 gates without changing final-promotion gates.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    REGION_AWARE_DERIVED_INPUT,
    RawFrameClipDataset,
    build_model,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "docs" / "validation" / "return-to-form-tier0-learnability-smoke.json"
DEFAULT_GATE_PATH = ROOT / "docs" / "validation" / "return-to-form-tier0-gates.json"
DEFAULT_DECODE_RECEIPT_PATH = ROOT / "docs" / "validation" / "return-to-form-tier0-decode-dataloader.json"
DEFAULT_TENSOR_CONTRACT_RECEIPT_PATH = (
    ROOT / "docs" / "validation" / "return-to-form-tier0-tensor-contract.json"
)


class LearnabilityReportError(RuntimeError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", required=True, type=Path)
    parser.add_argument("--validation-manifest", required=True, type=Path)
    parser.add_argument("--test-manifest", required=True, type=Path)
    parser.add_argument("--training-provenance", required=True, type=Path)
    parser.add_argument("--model-artifact", required=True, type=Path)
    parser.add_argument("--gates", default=DEFAULT_GATE_PATH, type=Path)
    parser.add_argument("--decode-dataloader-receipt", default=DEFAULT_DECODE_RECEIPT_PATH, type=Path)
    parser.add_argument("--tensor-contract-receipt", default=DEFAULT_TENSOR_CONTRACT_RECEIPT_PATH, type=Path)
    parser.add_argument("--output", default=DEFAULT_OUTPUT, type=Path)
    parser.add_argument("--mission", default="M3AE", type=str)
    parser.add_argument("--batch-size", default=8, type=int)
    parser.add_argument("--final-manifest-audit", default="./.venv/bin/python scripts/audit_final_manifests.py")
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise LearnabilityReportError(f"missing JSON file: {path}") from error
    except json.JSONDecodeError as error:
        raise LearnabilityReportError(f"invalid JSON file: {path}: {error}") from error
    if not isinstance(data, dict):
        raise LearnabilityReportError(f"JSON root must be an object: {path}")
    return data


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def import_torch() -> Any:
    try:
        import torch  # type: ignore
    except Exception as error:  # noqa: BLE001
        raise LearnabilityReportError(f"PyTorch is required for learnability reporting: {error}") from error
    return torch


def load_checkpoint(torch: Any, path: Path) -> dict[str, Any]:
    try:
        checkpoint = torch.load(path, map_location="cpu", weights_only=False)
    except TypeError:
        checkpoint = torch.load(path, map_location="cpu")
    except Exception as error:  # noqa: BLE001
        raise LearnabilityReportError(f"could not load model artifact {path}: {error}") from error
    if not isinstance(checkpoint, dict):
        raise LearnabilityReportError(f"model artifact must contain a checkpoint object: {path}")
    return checkpoint


def ordered_labels(label_to_index: dict[str, int]) -> list[str]:
    labels = ["" for _ in label_to_index]
    for label, index in label_to_index.items():
        if not isinstance(index, int) or index < 0 or index >= len(label_to_index):
            raise LearnabilityReportError(f"invalid label index in checkpoint: {label}={index!r}")
        labels[index] = str(label)
    if any(not label for label in labels):
        raise LearnabilityReportError("checkpoint label_to_index is not contiguous")
    return labels


def evaluate_split(
    torch: Any,
    model: Any,
    manifest_path: Path,
    split: str,
    label_to_index: dict[str, int],
    labels: list[str],
    frame_count: int,
    image_size: int,
    batch_size: int,
) -> dict[str, Any]:
    dataset = RawFrameClipDataset(
        torch,
        manifest_path,
        split,
        label_to_index,
        frame_count,
        image_size,
        require_decode_provenance=False,
    )
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    criterion = torch.nn.CrossEntropyLoss(reduction="sum")
    confusion = [[0 for _ in labels] for _ in labels]
    total_loss = 0.0
    total_seen = 0
    correct = 0

    model.eval()
    with torch.no_grad():
        for frames, target in loader:
            logits = model(frames)
            total_loss += float(criterion(logits, target).detach().cpu().item())
            predictions = logits.argmax(dim=1)
            correct += int((predictions == target).sum().detach().cpu().item())
            total_seen += int(target.shape[0])
            for actual, predicted in zip(target.tolist(), predictions.tolist(), strict=True):
                confusion[int(actual)][int(predicted)] += 1

    if total_seen == 0:
        raise LearnabilityReportError(f"{split} split has no examples")
    per_label = []
    recall_values = []
    f1_values = []
    for index, label in enumerate(labels):
        true_positive = confusion[index][index]
        false_positive = sum(confusion[row][index] for row in range(len(labels)) if row != index)
        false_negative = sum(confusion[index][col] for col in range(len(labels)) if col != index)
        support = sum(confusion[index])
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        recall_values.append(recall)
        f1_values.append(f1)
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

    return {
        "examples": total_seen,
        "loss": total_loss / total_seen,
        "top1_accuracy": correct / total_seen,
        "macro_recall": sum(recall_values) / len(recall_values),
        "macro_f1": sum(f1_values) / len(f1_values),
        "per_label": per_label,
        "confusion_matrix_labels": labels,
        "confusion_matrix": confusion,
        "top_confusions": top_confusions(confusion, labels),
    }


def top_confusions(confusion: list[list[int]], labels: list[str], limit: int = 20) -> list[dict[str, Any]]:
    rows = []
    for true_index, row in enumerate(confusion):
        for predicted_index, count in enumerate(row):
            if true_index == predicted_index or count <= 0:
                continue
            rows.append(
                {
                    "actual": labels[true_index],
                    "predicted": labels[predicted_index],
                    "count": count,
                }
            )
    return sorted(rows, key=lambda item: (-item["count"], item["actual"], item["predicted"]))[:limit]


def loss_movement(history: list[dict[str, Any]]) -> dict[str, Any]:
    if not history:
        raise LearnabilityReportError("training provenance history is empty")
    train_losses = [float(item["train"]["loss"]) for item in history]
    validation_losses = [float(item["validation"]["loss"]) for item in history]
    initial_train_loss = train_losses[0]
    best_train_loss = min(train_losses)
    final_train_loss = train_losses[-1]
    drop_fraction = (initial_train_loss - best_train_loss) / initial_train_loss if initial_train_loss > 0 else None
    return {
        "initial_train_loss": initial_train_loss,
        "best_train_loss": best_train_loss,
        "final_train_loss": final_train_loss,
        "initial_validation_loss": validation_losses[0],
        "best_validation_loss": min(validation_losses),
        "final_validation_loss": validation_losses[-1],
        "drop_fraction_initial_to_best_train": drop_fraction,
    }


def gate_status(
    gates: dict[str, Any],
    metrics: dict[str, Any],
    movement: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    train_targets = gates["training_sanity_gate"]["metric_targets"]
    validation_targets = gates["validation_gate"]["metric_targets"]

    zero_train_recall_labels = [
        item["label_id"]
        for item in metrics["train"]["per_label"]
        if float(item["recall"]) <= 0.0
    ]
    loss_drop = movement["drop_fraction_initial_to_best_train"]
    train_checks = {
        "train_top1_min": {
            "target": train_targets["train_top1_min"],
            "actual": metrics["train"]["top1_accuracy"],
            "passed": metrics["train"]["top1_accuracy"] >= train_targets["train_top1_min"],
        },
        "train_macro_recall_min": {
            "target": train_targets["train_macro_recall_min"],
            "actual": metrics["train"]["macro_recall"],
            "passed": metrics["train"]["macro_recall"] >= train_targets["train_macro_recall_min"],
        },
        "loss_drop_min_fraction_from_initial_to_best": {
            "target": train_targets["loss_drop_min_fraction_from_initial_to_best"],
            "actual": loss_drop,
            "passed": loss_drop is not None and loss_drop >= train_targets["loss_drop_min_fraction_from_initial_to_best"],
        },
        "no_zero_train_recall": {
            "target": "no selected label has zero train recall",
            "actual_zero_recall_labels": zero_train_recall_labels,
            "passed": not zero_train_recall_labels,
        },
    }
    train_gate = {
        "gate_id": gates["training_sanity_gate"]["gate_id"],
        "required": True,
        "status": "passed" if all(item["passed"] for item in train_checks.values()) else "failed",
        "checks": train_checks,
        "interpretation": gates["training_sanity_gate"]["interpretation"],
    }

    validation_checks = {
        "validation_top1_min": {
            "target": validation_targets["validation_top1_min"],
            "actual": metrics["validation"]["top1_accuracy"],
            "passed": metrics["validation"]["top1_accuracy"] >= validation_targets["validation_top1_min"],
        },
        "validation_macro_recall_min": {
            "target": validation_targets["validation_macro_recall_min"],
            "actual": metrics["validation"]["macro_recall"],
            "passed": metrics["validation"]["macro_recall"] >= validation_targets["validation_macro_recall_min"],
        },
    }
    validation_gate = {
        "gate_id": gates["validation_gate"]["gate_id"],
        "required": True,
        "status": "passed" if all(item["passed"] for item in validation_checks.values()) else "failed",
        "checks": validation_checks,
        "test_report_only": {
            "top1_accuracy": metrics["test"]["top1_accuracy"],
            "macro_recall": metrics["test"]["macro_recall"],
        },
        "interpretation": gates["validation_gate"]["interpretation"],
    }

    hard_negative_gate = {
        "gate_id": gates["hard_negative_gate"]["gate_id"],
        "required": True,
        "status": "blocked",
        "false_accept_rate": None,
        "blocker": (
            "No calibrated threshold or reviewed Tier 0 small-proof reject set is available for this smoke. "
            "The retained final-promotion negative-challenge gate also remains underfilled and must stay separate."
        ),
        "separation_from_final_gate": gates["hard_negative_gate"]["separation_from_final_gate"],
    }
    no_zero_gate = {
        "gate_id": gates["no_zero_accepted_true_class_rule"]["gate_id"],
        "required": True,
        "status": "blocked",
        "accepted_true_class_counts": None,
        "blocker": (
            "Training provenance threshold_policy is not_calibrated, so accepted true-class counts cannot "
            "be computed without a calibration/rejection slice."
        ),
        "uncalibrated_validation_true_positive_counts": {
            item["label_id"]: item["true_positive"] for item in metrics["validation"]["per_label"]
        },
    }
    return train_gate, validation_gate, hard_negative_gate, no_zero_gate


def run_final_manifest_audit(command: str) -> dict[str, Any]:
    if not command.strip():
        return {"status": "skipped", "reason": "no command provided"}
    result = subprocess.run(
        command,
        shell=True,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=120,
        check=False,
    )
    return {
        "command": command,
        "exit_code": result.returncode,
        "status": "passed" if result.returncode == 0 else "failed",
        "stdout_tail": result.stdout.strip().splitlines()[-20:],
        "stderr_tail": result.stderr.strip().splitlines()[-20:],
    }


def decode_dataloader_shapes(receipt: dict[str, Any]) -> dict[str, Any]:
    if isinstance(receipt.get("dataloader_batch_shapes"), dict):
        return receipt["dataloader_batch_shapes"]
    manifests = receipt.get("manifests")
    if not isinstance(manifests, dict):
        raise LearnabilityReportError("decode/dataloader receipt is missing manifests")
    shapes = {}
    for split in ("train", "validation", "test"):
        split_record = manifests.get(split)
        if not isinstance(split_record, dict):
            raise LearnabilityReportError(f"decode/dataloader receipt is missing {split} manifest record")
        dataloader_batch = split_record.get("dataloader_batch")
        if not isinstance(dataloader_batch, dict):
            raise LearnabilityReportError(f"decode/dataloader receipt is missing {split} dataloader_batch")
        shapes[split] = dataloader_batch.get("regions_shape")
    return shapes


def tensor_contract_summary(receipt: dict[str, Any]) -> dict[str, Any]:
    summary = receipt.get("summary")
    if not isinstance(summary, dict):
        raise LearnabilityReportError("tensor-contract receipt is missing summary")
    return {
        "status": receipt.get("status"),
        "mission": receipt.get("mission"),
        "sample_count": summary.get("sample_count"),
        "consumed_tensor_keys": summary.get("consumed_tensor_keys"),
        "derived_inputs": summary.get("derived_inputs"),
        "region_orders": summary.get("region_orders"),
        "fallback_to_rgb_frames_count": summary.get("fallback_to_rgb_frames_count"),
        "blocker_count": summary.get("blocker_count"),
    }


def next_action_for(train_gate: dict[str, Any], validation_gate: dict[str, Any]) -> dict[str, str]:
    if train_gate["status"] != "passed":
        return {
            "id": "m3ac_m3ad_remediation",
            "description": (
                "Return to M3AC/M3AD remediation: inspect fixed-crop contact sheets, "
                "region selection, tensor payload compatibility, and model architecture before any label expansion."
            ),
        }
    if validation_gate["status"] != "passed":
        return {
            "id": "m3ac_m3ad_remediation",
            "description": (
                "Return to M3AC/M3AD remediation: train sanity fit but held-out validation did not meet "
                "the Tier 0 signal gate, so diagnose split/source/crop failure before any label expansion."
            ),
        }
    return {
        "id": "m3ae_rejection_calibration_work",
        "description": (
            "Continue with a narrow rejection/calibration slice for Tier 0 hard negatives and accepted "
            "true-class counts before M3AF or any product claim."
        ),
    }


def main() -> int:
    args = parse_args()
    torch = import_torch()
    gates = load_json(args.gates)
    decode_receipt = load_json(args.decode_dataloader_receipt)
    tensor_contract_receipt = load_json(args.tensor_contract_receipt)
    training_provenance = load_json(args.training_provenance)
    checkpoint = load_checkpoint(torch, args.model_artifact)

    label_to_index = {str(label): int(index) for label, index in checkpoint["label_to_index"].items()}
    labels = ordered_labels(label_to_index)
    architecture = str(checkpoint["architecture"])
    frame_count = int(checkpoint["frame_count"])
    image_size = int(checkpoint["image_size"])
    model = build_model(torch, len(labels), architecture)
    model.load_state_dict(checkpoint["model_state"])

    metrics = {
        "train": evaluate_split(
            torch,
            model,
            args.train_manifest,
            "train",
            label_to_index,
            labels,
            frame_count,
            image_size,
            args.batch_size,
        ),
        "validation": evaluate_split(
            torch,
            model,
            args.validation_manifest,
            "validation",
            label_to_index,
            labels,
            frame_count,
            image_size,
            args.batch_size,
        ),
        "test": evaluate_split(
            torch,
            model,
            args.test_manifest,
            "test",
            label_to_index,
            labels,
            frame_count,
            image_size,
            args.batch_size,
        ),
    }
    movement = loss_movement(training_provenance["history"])
    train_gate, validation_gate, hard_negative_gate, no_zero_gate = gate_status(gates, metrics, movement)
    overall_status = (
        "failed"
        if train_gate["status"] != "passed" or validation_gate["status"] != "passed"
        else "blocked"
    )

    report = {
        "schema_version": "asl-pilot-return-to-form-tier0-learnability-smoke/v1",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mission": args.mission,
        "status": overall_status,
        "random_top1_chance": gates["applies_to"]["random_top1_chance"],
        "selected_labels": labels,
        "source_ids": sorted(
            set(
                source_id
                for manifest_path in (args.train_manifest, args.validation_manifest, args.test_manifest)
                for source_id in source_ids_for_manifest(manifest_path)
            )
        ),
        "training_input_contract": {
            "manifest_tensor_contract": {
                "region_axis": "T,R,H,W,C",
                "dataloader_batch_shape": decode_dataloader_shapes(decode_receipt),
            },
            "model_loader_region": (
                "RawFrameClipDataset consumes rgb_regions via "
                f"{REGION_AWARE_DERIVED_INPUT} when the fixed-crop stack is present; "
                "legacy rgb_frames fallback is only for payloads without rgb_regions."
            ),
            "tensor_contract_receipt": tensor_contract_summary(tensor_contract_receipt),
        },
        "artifacts": {
            "model_artifact": {
                "path": project_relative(args.model_artifact),
                "sha256": sha256_file(args.model_artifact),
            },
            "training_provenance": {
                "path": project_relative(args.training_provenance),
                "sha256": sha256_file(args.training_provenance),
            },
            "report_script": {
                "path": project_relative(Path(__file__)),
                "sha256": sha256_file(Path(__file__)),
            },
            "gates": {
                "path": project_relative(args.gates),
                "sha256": sha256_file(args.gates),
            },
            "decode_dataloader_receipt": {
                "path": project_relative(args.decode_dataloader_receipt),
                "sha256": sha256_file(args.decode_dataloader_receipt),
            },
            "tensor_contract_receipt": {
                "path": project_relative(args.tensor_contract_receipt),
                "sha256": sha256_file(args.tensor_contract_receipt),
            },
        },
        "training_summary": {
            "model_id": training_provenance.get("model_id"),
            "architecture": training_provenance.get("architecture"),
            "initialization": training_provenance.get("initialization"),
            "pretrained_components": training_provenance.get("pretrained_components"),
            "framework": training_provenance.get("framework"),
            "hyperparameters": training_provenance.get("hyperparameters"),
            "checkpoint_selection": training_provenance.get("checkpoint_selection"),
            "threshold_policy": training_provenance.get("threshold_policy"),
            "loss_movement": movement,
            "training_command": training_provenance.get("training_command"),
        },
        "metrics": metrics,
        "gate_results": {
            "tier0_train_sanity": train_gate,
            "tier0_validation_signal": validation_gate,
            "tier0_hard_negative_far": hard_negative_gate,
            "no_zero_accepted_true_class": no_zero_gate,
        },
        "negative_challenge_audit": run_final_manifest_audit(args.final_manifest_audit),
        "next_action": next_action_for(train_gate, validation_gate),
        "non_actions": [
            "No labels were expanded.",
            "No controlled clip-heldout checkpoint was evaluated or promoted.",
            "No ONNX export was produced.",
            "No model card or final claim matrix was promoted.",
            "No final-promotion gate was weakened.",
            "No Brev instance was created or stopped.",
        ],
    }
    write_json(args.output, report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "report": project_relative(args.output),
                "train_top1": metrics["train"]["top1_accuracy"],
                "validation_top1": metrics["validation"]["top1_accuracy"],
                "test_top1": metrics["test"]["top1_accuracy"],
                "next_action": report["next_action"]["id"],
            },
            sort_keys=True,
        )
    )
    return 0


def source_ids_for_manifest(path: Path) -> list[str]:
    manifest = load_json(path)
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        return []
    return [str(clip.get("source_id")) for clip in clips if isinstance(clip, dict) and clip.get("source_id")]


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except LearnabilityReportError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
