#!/usr/bin/env python3
"""Train a from-scratch LSTM diagnostic for the canonical verifier bundle."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import torch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FEATURE_SUMMARY = PROJECT_ROOT / "docs" / "validation" / "canonical-verifier-helper-features.json"
FEATURE_RECORDS = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-features.json"
WRONG_PROMPT_CALIBRATION = PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "wrong_prompt_calibration.json"
WRONG_PROMPT_TEST = PROJECT_ROOT / "data" / "manifests" / "diagnostics" / "canonical-verifier-010" / "wrong_prompt_test.json"
DEFAULT_REPORT = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-lstm-verifier-report.json"
DEFAULT_MODEL_STATE = PROJECT_ROOT / "artifacts" / "rawframe-model-diagnostics" / "canonical-verifier-010" / "helper-lstm-verifier-state.pt"

SEQUENCE_FEATURE_NAMES = [
    "brightness_mean",
    "brightness_std",
    "motion_energy",
    "motion_peak",
    "motion_centroid_x",
    "motion_centroid_y",
    "motion_bbox_width",
    "motion_bbox_height",
    "motion_bbox_area",
    "motion_velocity_from_previous",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--model-state", type=Path, default=DEFAULT_MODEL_STATE)
    parser.add_argument("--seed", type=int, default=20260522)
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--hidden-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--weight-decay", type=float, default=0.001)
    parser.add_argument("--dropout", type=float, default=0.15)
    parser.add_argument("--wrong-prompt-false-pass-target", type=float, default=0.10)
    parser.add_argument("--hard-negative-false-pass-target", type=float, default=0.05)
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(value, indent=2, sort_keys=True)}\n", encoding="utf-8")


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_reference(path: Path) -> dict[str, Any]:
    return {
        "path": project_relative(path),
        "exists": path.exists(),
        "sha256": sha256_file(path) if path.exists() else None,
    }


def select_device() -> torch.device:
    return torch.device("mps" if torch.backends.mps.is_available() else "cpu")


def feature_tensor(record: dict[str, Any], means: torch.Tensor, stds: torch.Tensor) -> torch.Tensor:
    rows = [
        [float(frame[name]) for name in SEQUENCE_FEATURE_NAMES]
        for frame in record["features"]["frame_sequence"]
    ]
    tensor = torch.tensor(rows, dtype=torch.float32)
    return (tensor - means) / stds


def build_scale(records: list[dict[str, Any]]) -> tuple[torch.Tensor, torch.Tensor]:
    frames = []
    for record in records:
        for frame in record["features"]["frame_sequence"]:
            frames.append([float(frame[name]) for name in SEQUENCE_FEATURE_NAMES])
    tensor = torch.tensor(frames, dtype=torch.float32)
    means = tensor.mean(dim=0)
    stds = tensor.std(dim=0, unbiased=False).clamp_min(1e-6)
    return means, stds


class SequenceDataset(torch.utils.data.Dataset):
    def __init__(self, records: list[dict[str, Any]], labels: list[str], means: torch.Tensor, stds: torch.Tensor) -> None:
        self.records = records
        self.label_to_index = {label: index for index, label in enumerate(labels)}
        self.means = means
        self.stds = stds

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        record = self.records[index]
        return (
            feature_tensor(record, self.means, self.stds),
            torch.tensor(self.label_to_index[record["label_id"]], dtype=torch.long),
        )


class LstmVerifier(torch.nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_classes: int, dropout: float) -> None:
        super().__init__()
        self.lstm = torch.nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.head = torch.nn.Sequential(
            torch.nn.LayerNorm(hidden_size * 2),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden_size * 2, num_classes),
        )

    def forward(self, sequences: torch.Tensor) -> torch.Tensor:
        output, _state = self.lstm(sequences)
        return self.head(output[:, -1, :])


def iterate(model: torch.nn.Module, loader: Any, device: torch.device, criterion: Any, optimizer: Any | None) -> dict[str, float]:
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    correct = 0
    seen = 0
    for sequences, labels in loader:
        sequences = sequences.to(device)
        labels = labels.to(device)
        if training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            logits = model(sequences)
            loss = criterion(logits, labels)
            if training:
                loss.backward()
                optimizer.step()
        total_loss += float(loss.detach().cpu()) * int(labels.shape[0])
        correct += int((logits.argmax(dim=1) == labels).sum().detach().cpu())
        seen += int(labels.shape[0])
    return {
        "loss": total_loss / seen if seen else 0.0,
        "accuracy": correct / seen if seen else 0.0,
        "examples": float(seen),
    }


def score_records(
    model: torch.nn.Module,
    records: list[dict[str, Any]],
    means: torch.Tensor,
    stds: torch.Tensor,
    device: torch.device,
) -> torch.Tensor:
    model.eval()
    rows = []
    with torch.no_grad():
        for record in records:
            sequence = feature_tensor(record, means, stds).unsqueeze(0).to(device)
            rows.append(torch.softmax(model(sequence), dim=1).cpu().squeeze(0))
    return torch.stack(rows, dim=0) if rows else torch.empty((0, 0))


def choose_thresholds(
    labels: list[str],
    calibration_scores: torch.Tensor,
    calibration_records: list[dict[str, Any]],
    wrong_pairs: list[dict[str, Any]],
    hard_scores: torch.Tensor,
    hard_records: list[dict[str, Any]],
    wrong_target: float,
    hard_target: float,
) -> tuple[dict[str, float], dict[str, Any]]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    records_by_clip = {record["clip_id"]: index for index, record in enumerate(calibration_records)}
    thresholds: dict[str, float] = {}
    diagnostics: dict[str, Any] = {}
    for label in labels:
        label_index = label_to_index[label]
        positive_scores = [
            float(calibration_scores[index, label_index])
            for index, record in enumerate(calibration_records)
            if record["label_id"] == label and record["features"]["quality_gate_passed"]
        ]
        wrong_scores = [
            float(calibration_scores[records_by_clip[pair["clip_id"]], label_index])
            for pair in wrong_pairs
            if pair["prompted_label_id"] == label
            and calibration_records[records_by_clip[pair["clip_id"]]]["features"]["quality_gate_passed"]
        ]
        hard_scores_for_label = [
            float(hard_scores[index, label_index])
            for index, record in enumerate(hard_records)
            if record["features"]["quality_gate_passed"]
        ]
        candidates = sorted(set([*positive_scores, *wrong_scores, *hard_scores_for_label]), reverse=True)
        candidates.append(max(candidates[0] if candidates else 1.0, 1.0) + 1e-6)
        best_eligible = None
        best_tradeoff = None
        for threshold in candidates:
            true_accept = sum(1 for value in positive_scores if value >= threshold)
            wrong_false = sum(1 for value in wrong_scores if value >= threshold)
            hard_false = sum(1 for value in hard_scores_for_label if value >= threshold)
            row = {
                "threshold": threshold,
                "positive_count": len(positive_scores),
                "wrong_prompt_count": len(wrong_scores),
                "hard_negative_count": len(hard_scores_for_label),
                "true_accept_rate": true_accept / len(positive_scores) if positive_scores else 0.0,
                "wrong_prompt_false_pass_rate": wrong_false / len(wrong_scores) if wrong_scores else 0.0,
                "hard_negative_false_pass_rate": hard_false / len(hard_scores_for_label) if hard_scores_for_label else 0.0,
            }
            row["eligible"] = row["wrong_prompt_false_pass_rate"] < wrong_target and row["hard_negative_false_pass_rate"] < hard_target
            if row["eligible"] and (
                best_eligible is None
                or (
                    row["true_accept_rate"],
                    -row["wrong_prompt_false_pass_rate"],
                    -row["hard_negative_false_pass_rate"],
                    -row["threshold"],
                )
                > (
                    best_eligible["true_accept_rate"],
                    -best_eligible["wrong_prompt_false_pass_rate"],
                    -best_eligible["hard_negative_false_pass_rate"],
                    -best_eligible["threshold"],
                )
            ):
                best_eligible = row
            if best_tradeoff is None or (
                -row["hard_negative_false_pass_rate"],
                -row["wrong_prompt_false_pass_rate"],
                row["true_accept_rate"],
                -row["threshold"],
            ) > (
                -best_tradeoff["hard_negative_false_pass_rate"],
                -best_tradeoff["wrong_prompt_false_pass_rate"],
                best_tradeoff["true_accept_rate"],
                -best_tradeoff["threshold"],
            ):
                best_tradeoff = row
        selected = best_eligible or best_tradeoff
        thresholds[label] = float(selected["threshold"])
        diagnostics[label] = {
            **selected,
            "selection_rule": "max_true_accept_under_calibration_false_pass_targets" if best_eligible else "fallback_lowest_calibration_false_pass_tradeoff",
        }
    return thresholds, diagnostics


def score_positive(records: list[dict[str, Any]], scores: torch.Tensor, labels: list[str], thresholds: dict[str, float]) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    true_accepts = 0
    total = 0
    by_label: dict[str, dict[str, Any]] = {}
    for index, record in enumerate(records):
        label = record["label_id"]
        if label not in label_to_index:
            continue
        total += 1
        accepted = record["features"]["quality_gate_passed"] and float(scores[index, label_to_index[label]]) >= thresholds[label]
        true_accepts += 1 if accepted else 0
        row = by_label.setdefault(label, {"examples": 0, "true_accept_count": 0})
        row["examples"] += 1
        row["true_accept_count"] += 1 if accepted else 0
    for row in by_label.values():
        row["true_accept_rate"] = row["true_accept_count"] / row["examples"] if row["examples"] else 0.0
    return {
        "examples": total,
        "true_accept_count": true_accepts,
        "true_accept_rate": true_accepts / total if total else 0.0,
        "by_label": by_label,
    }


def score_wrong_prompts(
    pairs: list[dict[str, Any]],
    records: list[dict[str, Any]],
    scores: torch.Tensor,
    labels: list[str],
    thresholds: dict[str, float],
) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    records_by_clip = {record["clip_id"]: index for index, record in enumerate(records)}
    false_passes = 0
    by_prompt: dict[str, dict[str, Any]] = {}
    for pair in pairs:
        row_index = records_by_clip[pair["clip_id"]]
        prompt = pair["prompted_label_id"]
        accepted = records[row_index]["features"]["quality_gate_passed"] and float(scores[row_index, label_to_index[prompt]]) >= thresholds[prompt]
        false_passes += 1 if accepted else 0
        row = by_prompt.setdefault(prompt, {"examples": 0, "false_pass_count": 0})
        row["examples"] += 1
        row["false_pass_count"] += 1 if accepted else 0
    for row in by_prompt.values():
        row["false_pass_rate"] = row["false_pass_count"] / row["examples"] if row["examples"] else 0.0
    return {
        "examples": len(pairs),
        "false_pass_count": false_passes,
        "false_pass_rate": false_passes / len(pairs) if pairs else 0.0,
        "by_prompt_label": by_prompt,
    }


def score_hard_negative(records: list[dict[str, Any]], scores: torch.Tensor, labels: list[str], thresholds: dict[str, float]) -> dict[str, Any]:
    false_passes = 0
    quality_rejects = 0
    for row_index, record in enumerate(records):
        if not record["features"]["quality_gate_passed"]:
            quality_rejects += 1
            continue
        accepted = any(float(scores[row_index, label_index]) >= thresholds[label] for label_index, label in enumerate(labels))
        false_passes += 1 if accepted else 0
    return {
        "examples": len(records),
        "false_pass_count": false_passes,
        "quality_gate_reject_count": quality_rejects,
        "false_pass_rate": false_passes / len(records) if records else 0.0,
    }


def main() -> int:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    features = read_json(FEATURE_RECORDS)
    feature_summary = read_json(FEATURE_SUMMARY)
    split_records = features["splits"]
    templates = [record for record in split_records["templates"] if record["features"]["quality_gate_passed"]]
    calibration = split_records["calibration"]
    test = split_records["test"]
    hard_calibration = split_records["hard_negative_calibration"]
    hard_test = split_records["hard_negative_test"]
    core_negative = split_records["core_negative_challenge"]
    labels = sorted({record["label_id"] for record in templates if record.get("label_id")})
    means, stds = build_scale(templates)
    device = select_device()
    train_dataset = SequenceDataset(templates, labels, means, stds)
    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    model = LstmVerifier(
        input_size=len(SEQUENCE_FEATURE_NAMES),
        hidden_size=args.hidden_size,
        num_classes=len(labels),
        dropout=args.dropout,
    ).to(device)
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=0.02)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    history = []
    best_state: dict[str, Any] | None = None
    best_train_accuracy = -1.0
    for epoch in range(1, args.epochs + 1):
        train_metrics = iterate(model, train_loader, device, criterion, optimizer)
        history.append({"epoch": epoch, "train": train_metrics})
        if train_metrics["accuracy"] > best_train_accuracy:
            best_train_accuracy = train_metrics["accuracy"]
            best_state = copy.deepcopy({key: value.detach().cpu() for key, value in model.state_dict().items()})
    if best_state is not None:
        model.load_state_dict(best_state)
        model.to(device)
    calibration_scores = score_records(model, calibration, means, stds, device)
    test_scores = score_records(model, test, means, stds, device)
    hard_calibration_scores = score_records(model, hard_calibration, means, stds, device)
    hard_test_scores = score_records(model, hard_test, means, stds, device)
    core_negative_scores = score_records(model, core_negative, means, stds, device)
    wrong_calibration = read_json(WRONG_PROMPT_CALIBRATION)["pairs"]
    wrong_test = read_json(WRONG_PROMPT_TEST)["pairs"]
    thresholds, threshold_diagnostics = choose_thresholds(
        labels,
        calibration_scores,
        calibration,
        wrong_calibration,
        hard_calibration_scores,
        hard_calibration,
        args.wrong_prompt_false_pass_target,
        args.hard_negative_false_pass_target,
    )
    calibration_positive = score_positive(calibration, calibration_scores, labels, thresholds)
    test_positive = score_positive(test, test_scores, labels, thresholds)
    calibration_wrong = score_wrong_prompts(wrong_calibration, calibration, calibration_scores, labels, thresholds)
    test_wrong = score_wrong_prompts(wrong_test, test, test_scores, labels, thresholds)
    calibration_hard = score_hard_negative(hard_calibration, hard_calibration_scores, labels, thresholds)
    test_hard = score_hard_negative(hard_test, hard_test_scores, labels, thresholds)
    core_metrics = score_hard_negative(core_negative, core_negative_scores, labels, thresholds)
    test_tnr = ((1.0 - test_wrong["false_pass_rate"]) + (1.0 - test_hard["false_pass_rate"])) / 2
    test_balanced_accuracy = (test_positive["true_accept_rate"] + test_tnr) / 2
    pass_status = {
        "balanced_accuracy": test_balanced_accuracy >= 0.70,
        "true_accept_rate": test_positive["true_accept_rate"] >= 0.70,
        "wrong_prompt_false_pass_rate": test_wrong["false_pass_rate"] < args.wrong_prompt_false_pass_target,
        "hard_negative_false_pass_rate": test_hard["false_pass_rate"] < args.hard_negative_false_pass_target,
    }
    args.model_state.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "schema_version": "asl-pilot-canonical-lstm-verifier-state/v1",
        "labels": labels,
        "sequence_feature_names": SEQUENCE_FEATURE_NAMES,
        "means": means.cpu(),
        "stds": stds.cpu(),
        "state_dict": {key: value.detach().cpu() for key, value in model.state_dict().items()},
    }, args.model_state)
    report = {
        "schema_version": "asl-pilot-canonical-lstm-verifier/v1",
        "status": "diagnostic_failed" if not all(pass_status.values()) else "diagnostic_passed_not_promotable",
        "finality": "diagnostic_not_browser_promotable_model_evidence",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": file_reference(Path(__file__).resolve()),
            "command": ["python", *[str(arg) for arg in sys.argv]],
        },
        "inputs": {
            "feature_summary": file_reference(FEATURE_SUMMARY),
            "feature_records": file_reference(FEATURE_RECORDS),
            "wrong_prompt_calibration": file_reference(WRONG_PROMPT_CALIBRATION),
            "wrong_prompt_test": file_reference(WRONG_PROMPT_TEST),
        },
        "method": {
            "name": "canonical_helper_sequence_lstm_verifier",
            "pretrained_components": [],
            "landmark_components": [],
            "detector_components": [],
            "sign_classifier_components": [],
            "model": "single-layer bidirectional torch.nn.LSTM over project-owned per-frame raw-tensor helper features",
            "sequence_feature_names": SEQUENCE_FEATURE_NAMES,
            "training_source": "canonical template split only",
            "threshold_source": "calibration positives plus calibration wrong-prompt and hard-negative clips only",
            "decision": "accept prompted label when helper quality gate passes and prompted label probability is above the calibration-selected label threshold",
            "device": str(device),
        },
        "model_state": {
            "path": project_relative(args.model_state),
            "exists": args.model_state.exists(),
            "sha256": sha256_file(args.model_state),
        },
        "labels": labels,
        "thresholds": thresholds,
        "threshold_diagnostics": threshold_diagnostics,
        "training_history": history,
        "calibration": {
            "positive": calibration_positive,
            "wrong_prompt": calibration_wrong,
            "hard_negative": calibration_hard,
        },
        "test": {
            "positive": test_positive,
            "wrong_prompt": test_wrong,
            "hard_negative": test_hard,
            "true_negative_rate": test_tnr,
            "balanced_accuracy": test_balanced_accuracy,
        },
        "core_negative_challenge": core_metrics,
        "targets": {
            "balanced_accuracy": 0.70,
            "true_accept_rate": 0.70,
            "wrong_prompt_false_pass_below": args.wrong_prompt_false_pass_target,
            "hard_negative_false_pass_below": args.hard_negative_false_pass_target,
        },
        "pass_status": pass_status,
        "known_limitations": [
            "Trained only on public/source-approved canonical template clips; no first-party clips are included.",
            "Uses coarse raw-tensor helper sequence features, not hand/face/torso geometry.",
            "This diagnostic does not produce a browser model, model card promotion, or validated sign set.",
        ],
        "helper_feature_summary": feature_summary,
    }
    write_json(args.output_report, report)
    print(json.dumps({
        "status": report["status"],
        "output_report": project_relative(args.output_report),
        "output_report_sha256": sha256_file(args.output_report),
        "model_state": project_relative(args.model_state),
        "model_state_sha256": sha256_file(args.model_state),
        "test_balanced_accuracy": test_balanced_accuracy,
        "test_true_accept_rate": test_positive["true_accept_rate"],
        "test_wrong_prompt_false_pass_rate": test_wrong["false_pass_rate"],
        "test_hard_negative_false_pass_rate": test_hard["false_pass_rate"],
        "core_negative_false_pass_rate": core_metrics["false_pass_rate"],
        "pass_status": pass_status,
    }, indent=2, sort_keys=True))
    return 0 if all(pass_status.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
