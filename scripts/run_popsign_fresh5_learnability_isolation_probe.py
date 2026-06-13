#!/usr/bin/env python3
"""Run the M3CA bounded PopSign fresh5 learnability-isolation probe."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import platform
import random
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    ManifestError,
    RawFrameClipDataset,
    TrainingError,
    build_model,
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


SCHEMA_VERSION = "asl-pilot-popsign-fresh5-learnability-isolation-probe/v1"
MODEL_ID = "asl-pilot-popsign-fresh5-learnability-isolation-v1"
DEFAULT_OUTPUT_DIR = Path("output/m3ca-popsign-fresh5-learnability-isolation-probe")
DEFAULT_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json")
DEFAULT_TRAIN_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json")
DEFAULT_SEED = 20260527

ACTIVE_PROMPT = Path("docs/model/return-to-form-popsign-fresh5-learnability-isolation-probe-goal-loop-prompt.md")
M3BZ_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json")
M3BZ_CONTRACT = Path("data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json")
M3BU_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json")
M3BV_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json")
M3BW_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json")
M3BY_RECEIPT = Path("docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json")

EXPECTED_LABEL_ORDER = ["thank_you", "pen", "home", "who", "morning"]
TRAIN_ALL_SUCCESS_ACCURACY = 0.95
RELAXED_SIGNAL_ACCURACY = 0.50
DISJOINT_MATERIAL_TOP1_DELTA = 0.10
DISJOINT_MATERIAL_MACRO_F1_DELTA = 0.05
PEN_RECALL_STOP_THRESHOLD = 0.20
THANK_YOU_PREDICTION_FRACTION_STOP_THRESHOLD = 0.40


class LearnabilityProbeError(RuntimeError):
    """Raised when the M3CA probe cannot complete."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT)
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--train-all-epochs", type=int, default=40)
    parser.add_argument("--relaxed-epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--check-files", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
    return parser.parse_args()


def project_path(path: Path, *, must_exist: bool = True) -> Path:
    resolved = path if path.is_absolute() else PROJECT_ROOT / path
    resolved = resolved.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise LearnabilityProbeError(f"path escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise LearnabilityProbeError(f"required path does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    resolved = project_path(path)
    return {"path": project_relative(resolved), "sha256": sha256_file(resolved)}


def load_json(path: Path) -> dict[str, Any]:
    resolved = project_path(path)
    with resolved.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise LearnabilityProbeError(f"JSON root must be an object: {project_relative(resolved)}")
    return data


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    if isinstance(value, set):
        return sorted(json_ready(item) for item in value)
    if isinstance(value, Path):
        return project_relative(value)
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    resolved = project_path(path, must_exist=False)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8") as handle:
        json.dump(json_ready(value), handle, indent=2, sort_keys=True)
        handle.write("\n")


def command_for_args(args: argparse.Namespace) -> list[str]:
    command = [
        sys.executable,
        "scripts/run_popsign_fresh5_learnability_isolation_probe.py",
        "--train-manifest",
        project_relative(project_path(args.train_manifest)),
        "--validation-manifest",
        project_relative(project_path(args.validation_manifest)),
        "--test-manifest",
        project_relative(project_path(args.test_manifest)),
        "--output-dir",
        project_relative(project_path(args.output_dir, must_exist=False)),
        "--receipt",
        project_relative(project_path(args.receipt, must_exist=False)),
        "--train-all-epochs",
        str(args.train_all_epochs),
        "--relaxed-epochs",
        str(args.relaxed_epochs),
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


def validate_args(args: argparse.Namespace) -> None:
    expected_paths = {
        project_path(args.train_manifest): DEFAULT_TRAIN_MANIFEST,
        project_path(args.validation_manifest): DEFAULT_VALIDATION_MANIFEST,
        project_path(args.test_manifest): DEFAULT_TEST_MANIFEST,
        project_path(args.output_dir, must_exist=False): DEFAULT_OUTPUT_DIR,
        project_path(args.receipt, must_exist=False): DEFAULT_RECEIPT,
    }
    for actual, expected_relative in expected_paths.items():
        expected = (PROJECT_ROOT / expected_relative).resolve()
        if actual != expected:
            raise LearnabilityProbeError(f"M3CA requires {expected_relative.as_posix()}, got {project_relative(actual)}")
    if not args.check_files:
        raise LearnabilityProbeError("M3CA requires --check-files")
    if args.frame_count != 16:
        raise LearnabilityProbeError("M3CA requires --frame-count 16")
    if args.image_size != 96:
        raise LearnabilityProbeError("M3CA requires --image-size 96")
    if args.num_workers != 0:
        raise LearnabilityProbeError("M3CA requires --num-workers 0")
    if args.batch_size <= 0 or args.batch_size > 16:
        raise LearnabilityProbeError("M3CA --batch-size must be between 1 and 16")
    if args.train_all_epochs <= 0 or args.train_all_epochs > 80:
        raise LearnabilityProbeError("M3CA --train-all-epochs must be between 1 and 80")
    if args.relaxed_epochs <= 0 or args.relaxed_epochs > 80:
        raise LearnabilityProbeError("M3CA --relaxed-epochs must be between 1 and 80")
    if args.learning_rate <= 0:
        raise LearnabilityProbeError("M3CA --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise LearnabilityProbeError("M3CA --weight-decay must be greater than or equal to zero")


def manifest_label_order(path: Path) -> list[str]:
    manifest = load_manifest(path)
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise LearnabilityProbeError(f"{path}: labels must be an array")
    return [str(label["label_id"]) for label in labels]


def input_artifacts() -> dict[str, Any]:
    return {
        "steering": {
            "goal": file_ref(Path("GOAL.md")),
            "active_prompt": file_ref(ACTIVE_PROMPT),
        },
        "m3bz": {
            "receipt": file_ref(M3BZ_RECEIPT),
            "manifest_contract": file_ref(M3BZ_CONTRACT),
        },
        "manifests": {
            "train": file_ref(DEFAULT_TRAIN_MANIFEST),
            "validation": file_ref(DEFAULT_VALIDATION_MANIFEST),
            "test": file_ref(DEFAULT_TEST_MANIFEST),
        },
        "comparison_receipts": {
            "m3bu_region_grid_mosaic_smoke": file_ref(M3BU_RECEIPT),
            "m3bv_preserved_region_tiny_overfit": file_ref(M3BV_RECEIPT),
            "m3bw_data_vocabulary_separability": file_ref(M3BW_RECEIPT),
            "m3by_repaired_manifest_contract": file_ref(M3BY_RECEIPT),
        },
        "scripts": {
            "probe": file_ref(Path(__file__)),
            "train_rawframe_model": file_reference(Path("scripts/train_rawframe_model.py")),
        },
    }


def make_label_order(train_manifest: Path) -> list[str]:
    labels = manifest_label_order(train_manifest)
    if labels != EXPECTED_LABEL_ORDER:
        raise LearnabilityProbeError(f"unexpected label order: {labels}")
    return labels


def build_dataset(torch: Any, manifest_path: Path, split: str, label_to_index: dict[str, int], args: argparse.Namespace) -> Any:
    return RawFrameClipDataset(
        torch,
        manifest_path,
        split,
        label_to_index,
        frame_count=args.frame_count,
        image_size=args.image_size,
        require_decode_provenance=False,
        training_augmentation="none",
        preserve_region_axis=True,
    )


def select_relaxed_signer_overlap_split(dataset: Any, label_order: list[str]) -> tuple[list[int], list[int], dict[str, Any]]:
    by_label: dict[str, list[int]] = defaultdict(list)
    for index, record in enumerate(dataset.records):
        by_label[str(record["label_id"])].append(index)

    relaxed_eval: list[int] = []
    relaxed_train: list[int] = []
    details: dict[str, Any] = {}
    for label in label_order:
        indexes = sorted(by_label[label], key=lambda item: str(dataset.records[item]["clip_id"]))
        signer_groups: dict[str, list[int]] = defaultdict(list)
        for index in indexes:
            signer_groups[str(dataset.records[index].get("signer_identity_hash") or dataset.records[index].get("signer_id"))].append(index)
        selected_eval: list[int] = []
        for _signer, signer_indexes in sorted(signer_groups.items()):
            if len(signer_indexes) >= 2 and len(selected_eval) < 5:
                selected_eval.append(signer_indexes[0])
        if len(selected_eval) < 5:
            for index in indexes:
                if index not in selected_eval and len(selected_eval) < 5:
                    selected_eval.append(index)
        selected_eval_set = set(selected_eval)
        selected_train = [index for index in indexes if index not in selected_eval_set]
        train_signers = {str(dataset.records[index].get("signer_identity_hash") or dataset.records[index].get("signer_id")) for index in selected_train}
        eval_signers = {str(dataset.records[index].get("signer_identity_hash") or dataset.records[index].get("signer_id")) for index in selected_eval}
        relaxed_eval.extend(selected_eval)
        relaxed_train.extend(selected_train)
        details[label] = {
            "train_count": len(selected_train),
            "eval_count": len(selected_eval),
            "train_signer_count": len(train_signers),
            "eval_signer_count": len(eval_signers),
            "shared_signer_count": len(train_signers & eval_signers),
            "shared_signers_present": bool(train_signers & eval_signers),
        }
    total_train_signers = {
        str(dataset.records[index].get("signer_identity_hash") or dataset.records[index].get("signer_id"))
        for index in relaxed_train
    }
    total_eval_signers = {
        str(dataset.records[index].get("signer_identity_hash") or dataset.records[index].get("signer_id"))
        for index in relaxed_eval
    }
    return (
        relaxed_train,
        relaxed_eval,
        {
            "strategy": (
                "within the repaired training split, hold out five clips per label while preferring signers "
                "that still have at least one clip in the relaxed training set"
            ),
            "train_count": len(relaxed_train),
            "eval_count": len(relaxed_eval),
            "shared_signer_count": len(total_train_signers & total_eval_signers),
            "per_label": details,
        },
    )


def subset_records(dataset: Any, indexes: list[int]) -> list[dict[str, Any]]:
    return [
        {
            "index": int(index),
            "clip_id": dataset.records[index]["clip_id"],
            "label_id": dataset.records[index]["label_id"],
            "signer_identity_hash": dataset.records[index].get("signer_identity_hash"),
            "source_split": dataset.records[index].get("source_split"),
            "source_record_id": dataset.records[index].get("source_record_id"),
            "tensor_path": project_relative(Path(dataset.records[index]["tensor_path"])),
        }
        for index in indexes
    ]


def evaluate_subset(
    torch: Any,
    model: Any,
    dataset: Any,
    indexes: list[int],
    batch_size: int,
    device: Any,
    criterion: Any,
    label_order: list[str],
) -> dict[str, Any]:
    subset = torch.utils.data.Subset(dataset, indexes)
    loader = torch.utils.data.DataLoader(subset, batch_size=batch_size, shuffle=False, num_workers=0)
    model.eval()
    total_loss = 0.0
    total_seen = 0
    confusion = [[0 for _ in label_order] for _ in label_order]
    prediction_counts: Counter[str] = Counter()
    examples: list[dict[str, Any]] = []
    with torch.no_grad():
        row_offset = 0
        for frames, labels in loader:
            frames = frames.to(device)
            labels = labels.to(device)
            logits = model(frames)
            loss = criterion(logits, labels)
            probabilities = torch.softmax(logits, dim=1).detach().cpu()
            predicted = logits.argmax(dim=1).detach().cpu()
            labels_cpu = labels.detach().cpu()
            total_loss += float(loss.detach().cpu().item()) * int(labels_cpu.shape[0])
            total_seen += int(labels_cpu.shape[0])
            for row_index in range(int(labels_cpu.shape[0])):
                true_index = int(labels_cpu[row_index].item())
                predicted_index = int(predicted[row_index].item())
                true_label = label_order[true_index]
                predicted_label = label_order[predicted_index]
                confusion[true_index][predicted_index] += 1
                prediction_counts[predicted_label] += 1
                if len(examples) < 20 or true_label in {"pen", "thank_you"}:
                    examples.append(
                        {
                            "row_index": row_offset + row_index,
                            "true_label": true_label,
                            "predicted_label": predicted_label,
                            "confidence": float(probabilities[row_index, predicted_index].item()),
                            "correct": true_index == predicted_index,
                        }
                    )
            row_offset += int(labels_cpu.shape[0])
    if total_seen == 0:
        raise LearnabilityProbeError("evaluation subset is empty")
    return metrics_from_confusion(confusion, label_order, total_loss / total_seen, examples, prediction_counts)


def metrics_from_confusion(
    confusion: list[list[int]],
    label_order: list[str],
    loss: float,
    examples: list[dict[str, Any]],
    prediction_counts: Counter[str],
) -> dict[str, Any]:
    total = sum(sum(row) for row in confusion)
    correct = sum(confusion[index][index] for index in range(len(label_order)))
    per_label: dict[str, Any] = {}
    f1_values = []
    zero_recall_labels = []
    for index, label in enumerate(label_order):
        true_positive = confusion[index][index]
        false_positive = sum(confusion[row][index] for row in range(len(label_order)) if row != index)
        false_negative = sum(confusion[index][col] for col in range(len(label_order)) if col != index)
        support = sum(confusion[index])
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / support if support else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0.0
        f1_values.append(f1)
        if support and recall <= 0.0:
            zero_recall_labels.append(label)
        per_label[label] = {
            "support": support,
            "predicted_count": prediction_counts.get(label, 0),
            "prediction_fraction": prediction_counts.get(label, 0) / total if total else 0.0,
            "correct": true_positive,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "confusion_row_true_label": {
                label_order[col]: confusion[index][col] for col in range(len(label_order))
            },
        }
    return {
        "loss": loss,
        "accuracy": correct / total if total else 0.0,
        "correct": correct,
        "examples": total,
        "macro_f1": sum(f1_values) / len(f1_values) if f1_values else 0.0,
        "zero_recall_labels": zero_recall_labels,
        "confusion_matrix": {
            "labels": label_order,
            "rows_true_columns_predicted": confusion,
        },
        "per_label": per_label,
        "prediction_counts": dict(sorted(prediction_counts.items())),
        "prediction_examples_sample": examples[:50],
    }


def train_probe_model(
    torch: Any,
    *,
    name: str,
    train_dataset: Any,
    train_indexes: list[int],
    eval_specs: dict[str, tuple[Any, list[int]]],
    args: argparse.Namespace,
    label_order: list[str],
    device: Any,
    epochs: int,
) -> dict[str, Any]:
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    generator = torch.Generator().manual_seed(args.seed)
    model = build_model(torch, len(label_order), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    initial_digest = model_state_digest(model.state_dict())
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    train_subset = torch.utils.data.Subset(train_dataset, train_indexes)
    loader = torch.utils.data.DataLoader(
        train_subset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        generator=generator,
    )
    history = []
    started = time.perf_counter()
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        total_correct = 0
        total_seen = 0
        for frames, labels in loader:
            frames = frames.to(device)
            labels = labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(frames)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu().item()) * int(labels.shape[0])
            total_correct += int((logits.argmax(dim=1) == labels).sum().detach().cpu().item())
            total_seen += int(labels.shape[0])
        if total_seen == 0:
            raise LearnabilityProbeError(f"{name}: no training examples")
        history.append(
            {
                "epoch": epoch,
                "train_loss": total_loss / total_seen,
                "train_accuracy": total_correct / total_seen,
            }
        )
    elapsed_seconds = time.perf_counter() - started
    evaluations = {
        split_name: evaluate_subset(
            torch,
            model,
            eval_dataset,
            eval_indexes,
            args.batch_size,
            device,
            criterion,
            label_order,
        )
        for split_name, (eval_dataset, eval_indexes) in eval_specs.items()
    }
    final_digest = model_state_digest(model.state_dict())
    return {
        "name": name,
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "initialization": "random",
        "seed": args.seed,
        "epochs": epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "weight_decay": args.weight_decay,
        "train_example_count": len(train_indexes),
        "runtime": {
            "elapsed_seconds": elapsed_seconds,
            "device": str(device),
            "python": platform.python_version(),
            "torch": torch.__version__,
        },
        "initial_model_state_digest": initial_digest,
        "final_model_state_digest": final_digest,
        "history": history,
        "history_tail": history[-10:],
        "evaluations": evaluations,
    }


def baseline_comparison() -> dict[str, Any]:
    m3bu = load_json(M3BU_RECEIPT)
    m3bv = load_json(M3BV_RECEIPT)
    m3bw = load_json(M3BW_RECEIPT)
    m3bu_test = m3bu["smoke_evaluation"]["test_metrics"]
    m3bu_validation = m3bu["smoke_evaluation"]["validation_metrics"]
    m3bv_mem = m3bv["ablation"]["memorization_metrics"]
    m3bw_error = m3bw.get("m3bu_error_concentration", {})
    return {
        "m3bu_region_grid_mosaic_smoke": {
            "status": m3bu.get("status"),
            "preserved_region_axis": False,
            "validation_top1_accuracy": m3bu_validation.get("top1_accuracy"),
            "validation_macro_f1": m3bu_validation.get("macro_f1"),
            "test_top1_accuracy": m3bu_test.get("top1_accuracy"),
            "test_macro_f1": m3bu_test.get("macro_f1"),
            "test_false_pass_rate": m3bu_test.get("false_pass_rate"),
            "pen_test_recall": m3bu_test["per_class"]["pen"]["recall"],
            "thank_you_prediction_fraction": (m3bw_error.get("predicted_label_fraction") or {}).get("thank_you"),
            "zero_recall_labels": m3bu_test.get("zero_recall_labels"),
        },
        "m3bv_preserved_region_tiny_overfit": {
            "status": m3bv.get("status"),
            "preserved_region_axis": True,
            "architecture": m3bv["ablation"]["architecture"],
            "final_accuracy": m3bv_mem.get("final_accuracy"),
            "zero_recall_labels": m3bv_mem.get("zero_recall_labels"),
            "clip_count": m3bv["ablation"]["subset"]["clip_count"],
        },
        "m3bw_separability": {
            "blocker_classification": (m3bw.get("conclusions") or {}).get("blocker_classification"),
            "pen_test_recall": ((m3bw_error.get("per_true_label") or {}).get("pen") or {}).get("recall"),
            "thank_you_prediction_fraction": (m3bw_error.get("predicted_label_fraction") or {}).get("thank_you"),
            "shared_signer_identity_hash_count": (
                (m3bw.get("split_overlap") or {}).get("aggregate") or {}
            ).get("shared_signer_identity_hash_count"),
        },
    }


def input_contract_proof(dataset: Any) -> dict[str, Any]:
    sample = dataset.input_contract_evidence(0)
    return {
        "required_contract": REGION_AWARE_DERIVED_INPUT,
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "preserve_region_axis": True,
        "status": "passed",
        "sample": sample,
        "batched_model_input_axis": "B,T,R,C,H,W",
        "no_m3bu_mosaic_path_for_decisive_result": True,
    }


def classify_next_action(
    train_all: dict[str, Any],
    relaxed: dict[str, Any],
    baseline: dict[str, Any],
) -> tuple[str, str, dict[str, Any]]:
    train_metrics = train_all["evaluations"]["train_all"]
    relaxed_metrics = relaxed["evaluations"]["relaxed_signer_overlap"]
    validation_metrics = train_all["evaluations"]["signer_disjoint_validation"]
    test_metrics = train_all["evaluations"]["signer_disjoint_test"]
    m3bu = baseline["m3bu_region_grid_mosaic_smoke"]

    train_all_sane = (
        train_metrics["accuracy"] >= TRAIN_ALL_SUCCESS_ACCURACY
        and not train_metrics["zero_recall_labels"]
    )
    relaxed_signal = relaxed_metrics["accuracy"] >= RELAXED_SIGNAL_ACCURACY
    materially_improved_test = (
        test_metrics["accuracy"] >= float(m3bu["test_top1_accuracy"]) + DISJOINT_MATERIAL_TOP1_DELTA
        and test_metrics["macro_f1"] >= float(m3bu["test_macro_f1"]) + DISJOINT_MATERIAL_MACRO_F1_DELTA
    )
    pen_recall = test_metrics["per_label"]["pen"]["recall"]
    thank_you_prediction_fraction = test_metrics["per_label"]["thank_you"]["prediction_fraction"]
    stop_conditions_clear = (
        pen_recall >= PEN_RECALL_STOP_THRESHOLD
        and thank_you_prediction_fraction <= THANK_YOU_PREDICTION_FRACTION_STOP_THRESHOLD
        and not test_metrics["zero_recall_labels"]
    )
    decision_facts = {
        "train_all_sane": train_all_sane,
        "relaxed_signal": relaxed_signal,
        "materially_improved_test_over_m3bu": materially_improved_test,
        "pen_recall": pen_recall,
        "thank_you_prediction_fraction": thank_you_prediction_fraction,
        "pen_stop_condition_clear": pen_recall >= PEN_RECALL_STOP_THRESHOLD,
        "thank_you_stop_condition_clear": thank_you_prediction_fraction <= THANK_YOU_PREDICTION_FRACTION_STOP_THRESHOLD,
        "test_zero_recall_labels": test_metrics["zero_recall_labels"],
    }

    if not train_all_sane:
        return (
            "continue_model_input_or_training_loop_remediation",
            "model_input_or_training_loop",
            decision_facts,
        )
    if relaxed_signal and materially_improved_test and stop_conditions_clear:
        return (
            "continue_bounded_compute_receipt_for_fresh5_repaired_region_grid",
            "supported_local_training_signal",
            decision_facts,
        )
    if relaxed_signal:
        return (
            "continue_fresh5_data_split_label_quality_remediation",
            "dataset_split_label_quality",
            decision_facts,
        )
    return (
        "stop_until_supported_training_signal_exists",
        "compute_budget_inconclusive",
        decision_facts,
    )


def build_receipt(
    args: argparse.Namespace,
    *,
    generated_at: str,
    train_summary: dict[str, Any],
    validation_summary: dict[str, Any],
    test_summary: dict[str, Any],
    label_order: list[str],
    relaxed_split: dict[str, Any],
    train_all: dict[str, Any],
    relaxed: dict[str, Any],
    contract_proof: dict[str, Any],
    baseline: dict[str, Any],
    report_ref: dict[str, str] | None,
) -> dict[str, Any]:
    next_action, blocker, facts = classify_next_action(train_all, relaxed, baseline)
    return {
        "schema_version": SCHEMA_VERSION,
        "mission": "Mission 3CA - PopSign fresh5 learnability isolation probe",
        "status": "completed_local_learnability_isolation_probe",
        "generated_at": generated_at,
        "generated_by": {
            "tool": "scripts/run_popsign_fresh5_learnability_isolation_probe.py",
            "command": command_for_args(args),
            "script": file_ref(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
        },
        "active_prompt": ACTIVE_PROMPT.as_posix(),
        "input_artifacts": input_artifacts(),
        "scope": {
            "bounded_local_probe": True,
            "diagnostic_fitting_only": True,
            "random_initialization_only": True,
            "repaired_manifest_package_only": True,
            "existing_verified_tensors_only": True,
            "no_brev_command_or_spend": True,
            "no_remote_training": True,
            "no_source_register_mutation": True,
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
        "source_manifests": {
            "train": train_summary,
            "validation": validation_summary,
            "test": test_summary,
            "label_order": label_order,
        },
        "caps": {
            "train_all_epochs": args.train_all_epochs,
            "relaxed_epochs": args.relaxed_epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "num_workers": args.num_workers,
            "seed": args.seed,
        },
        "input_contract": contract_proof,
        "baseline_comparison": baseline,
        "relaxed_split": relaxed_split,
        "probe_results": {
            "train_all_overfit": train_all,
            "relaxed_signer_overlap": relaxed,
            "signer_disjoint_validation_from_train_all": train_all["evaluations"]["signer_disjoint_validation"],
            "signer_disjoint_test_from_train_all": train_all["evaluations"]["signer_disjoint_test"],
        },
        "pen_and_thank_you_stop_conditions": {
            "pen": {
                "m3bu_test_recall": baseline["m3bu_region_grid_mosaic_smoke"]["pen_test_recall"],
                "m3ca_test_recall": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["pen"]["recall"],
                "required_recall_gte": PEN_RECALL_STOP_THRESHOLD,
                "cleared": facts["pen_stop_condition_clear"],
                "confusion_row_true_label": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["pen"]["confusion_row_true_label"],
            },
            "thank_you": {
                "m3bw_prediction_fraction": baseline["m3bw_separability"]["thank_you_prediction_fraction"],
                "m3ca_test_prediction_fraction": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["thank_you"]["prediction_fraction"],
                "required_prediction_fraction_lte": THANK_YOU_PREDICTION_FRACTION_STOP_THRESHOLD,
                "cleared": facts["thank_you_stop_condition_clear"],
                "confusion_row_true_label": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["thank_you"]["confusion_row_true_label"],
            },
        },
        "output_artifacts": {
            "probe_report": report_ref,
        },
        "decision": {
            "blocker_classification": blocker,
            "decision_facts": facts,
            "brev_training_receipt_justified_now": next_action
            == "continue_bounded_compute_receipt_for_fresh5_repaired_region_grid",
            "export_or_browser_promotion_justified_now": False,
            "exactly_one_next_action": next_action,
            "next_action_rationale": {
                "continue_bounded_compute_receipt_for_fresh5_repaired_region_grid": (
                    "Train-all, relaxed split, and signer-disjoint test behavior clear the local thresholds; "
                    "only a separate compute receipt could authorize Brev planning."
                ),
                "continue_fresh5_data_split_label_quality_remediation": (
                    "The preserved-region path can fit the training distribution and shows easier split signal, "
                    "but signer-disjoint behavior or pen/thank_you stop conditions remain the clearest blocker."
                ),
                "continue_model_input_or_training_loop_remediation": (
                    "The preserved-region train-all probe failed its sanity threshold, so the model/input/training "
                    "loop should be repaired before data or compute escalation."
                ),
                "stop_until_supported_training_signal_exists": (
                    "The bounded probe did not produce enough local training signal to support another autonomous step."
                ),
            }[next_action],
        },
        "validation_commands": [
            "git status --short --branch",
            "git log -10 --oneline --decorate",
            "node scripts/audit_loop_premise.mjs --json",
            "node scripts/audit_return_to_form_plan.mjs --json",
            "node scripts/audit_no_pretrained_deps.mjs",
            "node scripts/audit_no_pretrained_artifact_json.mjs",
            "node scripts/audit_source_register.mjs",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json >/dev/null",
            "python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null",
            "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py",
            "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json >/dev/null",
            "git diff --check",
        ],
        "tracked_files_changed": [
            "scripts/run_popsign_fresh5_learnability_isolation_probe.py",
            "docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json",
            "docs/session-logs/388-mission-3ca-popsign-fresh5-learnability-isolation-probe.md",
        ],
        "local_artifacts_written_or_updated": [
            "output/m3ca-popsign-fresh5-learnability-isolation-probe/probe-report.json",
        ],
        "exactly_one_next_action": next_action,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    validate_args(args)
    if should_verify_retained_local_ml_environment():
        require_current_local_ml_environment("M3CA PopSign fresh5 learnability isolation probe")
    generated_at = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    torch = import_torch()
    train_manifest = project_path(args.train_manifest)
    validation_manifest = project_path(args.validation_manifest)
    test_manifest = project_path(args.test_manifest)
    label_order = make_label_order(train_manifest)
    label_to_index = {label: index for index, label in enumerate(label_order)}

    train_summary = validate_manifest(train_manifest, "train", args.check_files, True, False, False, False)
    validation_summary = validate_manifest(validation_manifest, "validation", args.check_files, True, False, False, False)
    test_summary = validate_manifest(test_manifest, "test", args.check_files, True, False, False, False)
    device = select_device(torch)

    train_dataset = build_dataset(torch, train_manifest, "train", label_to_index, args)
    validation_dataset = build_dataset(torch, validation_manifest, "validation", label_to_index, args)
    test_dataset = build_dataset(torch, test_manifest, "test", label_to_index, args)
    contract_proof = input_contract_proof(train_dataset)
    train_all_indexes = list(range(len(train_dataset)))
    relaxed_train_indexes, relaxed_eval_indexes, relaxed_split_summary = select_relaxed_signer_overlap_split(
        train_dataset,
        label_order,
    )
    relaxed_split_summary["train_examples_sample"] = subset_records(train_dataset, relaxed_train_indexes[:10])
    relaxed_split_summary["eval_examples"] = subset_records(train_dataset, relaxed_eval_indexes)
    baseline = baseline_comparison()

    train_all = train_probe_model(
        torch,
        name="train_all_overfit",
        train_dataset=train_dataset,
        train_indexes=train_all_indexes,
        eval_specs={
            "train_all": (train_dataset, train_all_indexes),
            "signer_disjoint_validation": (validation_dataset, list(range(len(validation_dataset)))),
            "signer_disjoint_test": (test_dataset, list(range(len(test_dataset)))),
        },
        args=args,
        label_order=label_order,
        device=device,
        epochs=args.train_all_epochs,
    )
    relaxed = train_probe_model(
        torch,
        name="relaxed_signer_overlap",
        train_dataset=train_dataset,
        train_indexes=relaxed_train_indexes,
        eval_specs={
            "relaxed_train": (train_dataset, relaxed_train_indexes),
            "relaxed_signer_overlap": (train_dataset, relaxed_eval_indexes),
        },
        args=args,
        label_order=label_order,
        device=device,
        epochs=args.relaxed_epochs,
    )
    receipt = build_receipt(
        args,
        generated_at=generated_at,
        train_summary=train_summary,
        validation_summary=validation_summary,
        test_summary=test_summary,
        label_order=label_order,
        relaxed_split=relaxed_split_summary,
        train_all=train_all,
        relaxed=relaxed,
        contract_proof=contract_proof,
        baseline=baseline,
        report_ref=None,
    )
    output_dir = project_path(args.output_dir, must_exist=False)
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "probe-report.json"
    write_json(report_path, receipt)
    receipt["output_artifacts"]["probe_report"] = file_ref(report_path)
    write_json(report_path, receipt)
    if args.write_receipt:
        write_json(args.receipt, receipt)
    return {
        "status": receipt["status"],
        "receipt": project_relative(project_path(args.receipt, must_exist=False)) if args.write_receipt else None,
        "output_report": file_ref(report_path),
        "train_all_accuracy": train_all["evaluations"]["train_all"]["accuracy"],
        "relaxed_accuracy": relaxed["evaluations"]["relaxed_signer_overlap"]["accuracy"],
        "signer_disjoint_validation_accuracy": train_all["evaluations"]["signer_disjoint_validation"]["accuracy"],
        "signer_disjoint_test_accuracy": train_all["evaluations"]["signer_disjoint_test"]["accuracy"],
        "pen_test_recall": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["pen"]["recall"],
        "thank_you_test_prediction_fraction": train_all["evaluations"]["signer_disjoint_test"]["per_label"]["thank_you"]["prediction_fraction"],
        "blocker_classification": receipt["decision"]["blocker_classification"],
        "exactly_one_next_action": receipt["exactly_one_next_action"],
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, LearnabilityProbeError) as error:
        print(f"M3CA learnability isolation probe failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
