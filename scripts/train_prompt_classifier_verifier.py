#!/usr/bin/env python3
"""Train a from-scratch scoped classifier and evaluate it as a prompt verifier."""

from __future__ import annotations

import argparse
import copy
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import torch

from evaluate_rawframe_template_verifier import (
    build_sidecar,
    challenge_manifest_record,
    choose_thresholds,
    classification_metrics,
    clip_records,
    manifest_record,
    negative_challenge_metrics,
    project_relative,
    read_json,
    stable_json,
    threshold_stats,
    validate_label_sets,
    write_json,
)
from train_rawframe_model import (
    RawFrameClipDataset,
    build_model,
    load_manifest,
    load_tensor_file,
    prepare_frames,
    sha256_file,
)


SCHEMA_VERSION = "asl-pilot-prompt-classifier-verifier-diagnostic/v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, required=True)
    parser.add_argument("--validation-manifest", type=Path, required=True)
    parser.add_argument("--test-manifest", type=Path, required=True)
    parser.add_argument("--challenge-manifest", type=Path, required=True)
    parser.add_argument("--output-report", type=Path, required=True)
    parser.add_argument("--prediction-sidecar", type=Path)
    parser.add_argument("--model-state", type=Path)
    parser.add_argument("--architecture", default="motion_2d_temporal_cnn")
    parser.add_argument("--seed", type=int, default=20260522)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=7e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-3)
    parser.add_argument("--label-smoothing", type=float, default=0.05)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--training-augmentation", choices=["none", "mild", "basic", "strong"], default="mild")
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--require-decode-provenance", action="store_true")
    parser.add_argument("--train-negative-reject", action="store_true")
    parser.add_argument("--negative-reject-train-fraction", type=float, default=0.5)
    parser.add_argument("--reject-train-manifest", type=Path)
    parser.add_argument("--reject-validation-manifest", type=Path)
    parser.add_argument("--reject-eval-manifest", type=Path)
    parser.add_argument("--min-accepted-precision", type=float, default=0.0)
    parser.add_argument("--max-validation-false-pass-rate", type=float, default=0.1)
    parser.add_argument("--top1-target", type=float, default=0.7)
    parser.add_argument("--macro-f1-target", type=float, default=0.65)
    parser.add_argument("--test-false-pass-target", type=float, default=0.1)
    parser.add_argument("--negative-false-pass-target", type=float, default=0.05)
    return parser.parse_args()


def select_device() -> torch.device:
    return torch.device("mps" if torch.backends.mps.is_available() else "cpu")


class NegativeRejectDataset:
    def __init__(
        self,
        records: list[dict[str, Any]],
        manifest_path: Path,
        reject_label_index: int,
        frame_count: int,
        image_size: int,
    ) -> None:
        self.records = records
        self.manifest_path = manifest_path
        self.reject_label_index = reject_label_index
        self.frame_count = frame_count
        self.image_size = image_size

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        record = self.records[index]
        frames = load_tensor_file(torch, record["tensor_path"])
        frames = prepare_frames(
            torch,
            frames,
            frame_count=self.frame_count,
            image_size=self.image_size,
            context=f"{self.manifest_path}: negative challenge clip {record.get('clip_id')}",
        )
        return frames, torch.tensor(self.reject_label_index, dtype=torch.long)


def split_negative_records(records: list[dict[str, Any]], train_fraction: float) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if not 0.0 < train_fraction < 1.0:
        raise ValueError("--negative-reject-train-fraction must be between 0 and 1")
    train_count = max(1, min(len(records) - 1, round(len(records) * train_fraction)))
    return records[:train_count], records[train_count:]


def records_from_manifest(manifest_path: Path) -> list[dict[str, Any]]:
    return clip_records(manifest_path, read_json(manifest_path), None)


def iterate(model: Any, loader: Any, device: torch.device, criterion: Any, optimizer: Any | None) -> dict[str, float]:
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    total_correct = 0
    total_seen = 0
    for frames, labels in loader:
        frames = frames.to(device)
        labels = labels.to(device)
        if training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            logits = model(frames)
            loss = criterion(logits, labels)
            if training:
                loss.backward()
                optimizer.step()
        total_loss += float(loss.detach().cpu()) * int(labels.shape[0])
        total_correct += int((logits.argmax(dim=1) == labels).sum().detach().cpu())
        total_seen += int(labels.shape[0])
    return {
        "loss": total_loss / total_seen,
        "accuracy": total_correct / total_seen,
        "examples": float(total_seen),
    }


def score_dataset(model: Any, loader: Any, device: torch.device) -> torch.Tensor:
    model.eval()
    rows = []
    with torch.no_grad():
        for frames, _labels in loader:
            logits = model(frames.to(device))
            rows.append(torch.softmax(logits, dim=1).cpu())
    return torch.cat(rows, dim=0)


def score_challenge(
    model: Any,
    records: list[dict[str, Any]],
    manifest_path: Path,
    frame_count: int,
    image_size: int,
    device: torch.device,
) -> torch.Tensor:
    rows = []
    model.eval()
    with torch.no_grad():
        for record in records:
            frames = load_tensor_file(torch, record["tensor_path"])
            frames = prepare_frames(
                torch,
                frames,
                frame_count=frame_count,
                image_size=image_size,
                context=f"{manifest_path}: clip {record.get('clip_id')}",
            ).unsqueeze(0)
            rows.append(torch.softmax(model(frames.to(device)), dim=1).cpu().squeeze(0))
    return torch.stack(rows, dim=0)


def reject_probabilities(full_scores: torch.Tensor, labels: list[str]) -> torch.Tensor | None:
    if full_scores.shape[1] <= len(labels):
        return None
    return full_scores[:, len(labels)]


def threshold_stats_with_reject_gate(
    scores: torch.Tensor,
    reject_scores: torch.Tensor | None,
    records: list[dict[str, Any]],
    labels: list[str],
    thresholds: dict[str, float],
    max_reject_probability: float | None,
) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    true_accepts = 0
    false_accepts = 0
    wrong_prompt_total = 0
    for row_index, record in enumerate(records):
        reject_allowed = (
            max_reject_probability is None
            or reject_scores is None
            or float(reject_scores[row_index]) <= max_reject_probability
        )
        true_label = str(record["label_id"])
        true_index = label_to_index[true_label]
        if reject_allowed and float(scores[row_index, true_index]) >= thresholds[true_label]:
            true_accepts += 1
        for label_index, label in enumerate(labels):
            if label == true_label:
                continue
            wrong_prompt_total += 1
            if reject_allowed and float(scores[row_index, label_index]) >= thresholds[label]:
                false_accepts += 1
    return {
        "true_accept_count": true_accepts,
        "positive_prompt_count": len(records),
        "true_accept_rate": true_accepts / len(records) if records else 0.0,
        "wrong_prompt_false_accept_count": false_accepts,
        "wrong_prompt_count": wrong_prompt_total,
        "wrong_prompt_false_pass_rate": false_accepts / wrong_prompt_total if wrong_prompt_total else 0.0,
        "max_reject_probability": max_reject_probability,
    }


def negative_challenge_metrics_with_reject_gate(
    scores: torch.Tensor,
    reject_scores: torch.Tensor | None,
    records: list[dict[str, Any]],
    labels: list[str],
    thresholds: dict[str, float],
    max_reject_probability: float | None,
) -> dict[str, Any]:
    base = negative_challenge_metrics(scores, records, labels, thresholds)
    if max_reject_probability is None or reject_scores is None:
        return {**base, "max_reject_probability": max_reject_probability}
    thresholds_vector = [thresholds[label] for label in labels]
    false_pass_count = 0
    by_type: dict[str, dict[str, Any]] = {}
    for row_index, record in enumerate(records):
        accepted = False
        max_score = float(torch.max(scores[row_index]).item())
        reject_score = float(reject_scores[row_index])
        if reject_score <= max_reject_probability:
            for label_index, _label in enumerate(labels):
                if float(scores[row_index, label_index]) >= thresholds_vector[label_index]:
                    accepted = True
                    break
        challenge_type = str(record.get("challenge_type"))
        if challenge_type not in by_type:
            by_type[challenge_type] = {
                "examples": 0,
                "false_pass_count": 0,
                "max_score": -float("inf"),
                "max_reject_probability": -float("inf"),
            }
        by_type[challenge_type]["examples"] += 1
        by_type[challenge_type]["max_score"] = max(by_type[challenge_type]["max_score"], max_score)
        by_type[challenge_type]["max_reject_probability"] = max(
            by_type[challenge_type]["max_reject_probability"],
            reject_score,
        )
        if accepted:
            false_pass_count += 1
            by_type[challenge_type]["false_pass_count"] += 1
    typed = {
        key: {
            **value,
            "false_pass_rate": value["false_pass_count"] / value["examples"] if value["examples"] else 0.0,
        }
        for key, value in sorted(by_type.items())
    }
    return {
        "examples": len(records),
        "false_pass_count": false_pass_count,
        "false_pass_rate": false_pass_count / len(records) if records else 0.0,
        "by_type": typed,
        "max_reject_probability": max_reject_probability,
    }


def choose_reject_probability_gate(
    validation_scores: torch.Tensor,
    validation_reject_scores: torch.Tensor | None,
    validation_records: list[dict[str, Any]],
    reject_validation_scores: torch.Tensor | None,
    reject_validation_reject_scores: torch.Tensor | None,
    reject_validation_records: list[dict[str, Any]],
    labels: list[str],
    thresholds: dict[str, float],
    max_validation_false_pass_rate: float,
    negative_false_pass_target: float,
) -> dict[str, Any] | None:
    if (
        validation_reject_scores is None
        or reject_validation_scores is None
        or reject_validation_reject_scores is None
        or not reject_validation_records
    ):
        return None
    values = [
        float(value)
        for value in torch.cat([validation_reject_scores, reject_validation_reject_scores]).detach().cpu().tolist()
    ]
    candidates = sorted(set([min(values) - 1e-6, max(values) + 1e-6, *values]))
    best_eligible: dict[str, Any] | None = None
    best_tradeoff: dict[str, Any] | None = None
    for candidate_threshold in candidates:
        validation = threshold_stats_with_reject_gate(
            validation_scores,
            validation_reject_scores,
            validation_records,
            labels,
            thresholds,
            candidate_threshold,
        )
        hard_negative_validation = negative_challenge_metrics_with_reject_gate(
            reject_validation_scores,
            reject_validation_reject_scores,
            reject_validation_records,
            labels,
            thresholds,
            candidate_threshold,
        )
        eligible = (
            validation["wrong_prompt_false_pass_rate"] <= max_validation_false_pass_rate
            and hard_negative_validation["false_pass_rate"] < negative_false_pass_target
        )
        row = {
            "max_reject_probability": candidate_threshold,
            "eligible": eligible,
            "validation": validation,
            "hard_negative_validation": hard_negative_validation,
        }
        if eligible and (
            best_eligible is None
            or (
                validation["true_accept_rate"],
                -validation["wrong_prompt_false_pass_rate"],
                -candidate_threshold,
            )
            > (
                best_eligible["validation"]["true_accept_rate"],
                -best_eligible["validation"]["wrong_prompt_false_pass_rate"],
                -best_eligible["max_reject_probability"],
            )
        ):
            best_eligible = row
        if best_tradeoff is None or (
            -hard_negative_validation["false_pass_rate"],
            validation["true_accept_rate"],
            -validation["wrong_prompt_false_pass_rate"],
            -candidate_threshold,
        ) > (
            -best_tradeoff["hard_negative_validation"]["false_pass_rate"],
            best_tradeoff["validation"]["true_accept_rate"],
            -best_tradeoff["validation"]["wrong_prompt_false_pass_rate"],
            -best_tradeoff["max_reject_probability"],
        ):
            best_tradeoff = row
    selected = best_eligible or best_tradeoff
    if selected is None:
        return None
    return {
        **selected,
        "selection_rule": (
            "max_true_accept_among_validation_gates_with_hard_negative_validation_false_pass_below_target"
            if best_eligible is not None
            else "fallback_min_hard_negative_validation_false_pass_then_max_true_accept"
        ),
        "candidate_count": len(candidates),
    }


def build_sidecar_with_reject_score(
    scores: torch.Tensor,
    full_scores: torch.Tensor,
    records: list[dict[str, Any]],
    labels: list[str],
    split: str,
) -> dict[str, Any]:
    sidecar = build_sidecar(scores, records, labels, split)
    reject_scores = reject_probabilities(full_scores, labels)
    if reject_scores is not None:
        for row_index, row in enumerate(sidecar["predictions"]):
            row["reject_score"] = float(reject_scores[row_index])
    return sidecar


def main() -> int:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    train_manifest = load_manifest(args.train_manifest)
    validation_manifest = load_manifest(args.validation_manifest)
    test_manifest = load_manifest(args.test_manifest)
    challenge_manifest = read_json(args.challenge_manifest)
    labels = validate_label_sets(train_manifest, validation_manifest, test_manifest)
    label_to_index = {label: index for index, label in enumerate(labels)}
    device = select_device()
    challenge_records = clip_records(args.challenge_manifest, challenge_manifest, None)
    negative_reject_train_records: list[dict[str, Any]] = []
    negative_challenge_eval_records = challenge_records
    if args.train_negative_reject:
        negative_reject_train_records, negative_challenge_eval_records = split_negative_records(
            challenge_records,
            args.negative_reject_train_fraction,
        )
    reject_train_records = records_from_manifest(args.reject_train_manifest) if args.reject_train_manifest else []
    reject_validation_records = records_from_manifest(args.reject_validation_manifest) if args.reject_validation_manifest else []
    reject_eval_records = records_from_manifest(args.reject_eval_manifest) if args.reject_eval_manifest else []
    train_reject_records = [*negative_reject_train_records, *reject_train_records]

    train_dataset = RawFrameClipDataset(
        torch,
        args.train_manifest,
        "train",
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=args.require_decode_provenance,
        training_augmentation=args.training_augmentation,
    )
    reject_label_index = len(labels)
    train_source_dataset: Any = train_dataset
    if args.train_negative_reject or reject_train_records:
        train_source_dataset = torch.utils.data.ConcatDataset([
            train_dataset,
            NegativeRejectDataset(
                train_reject_records,
                args.reject_train_manifest or args.challenge_manifest,
                reject_label_index,
                args.frame_count,
                args.image_size,
            ),
        ])
    validation_dataset = RawFrameClipDataset(
        torch,
        args.validation_manifest,
        "validation",
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=args.require_decode_provenance,
    )
    test_dataset = RawFrameClipDataset(
        torch,
        args.test_manifest,
        "test",
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=args.require_decode_provenance,
    )
    train_loader = torch.utils.data.DataLoader(
        train_source_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
    )
    validation_loader = torch.utils.data.DataLoader(
        validation_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
    )
    reject_enabled = args.train_negative_reject or bool(reject_train_records)
    model = build_model(torch, len(labels) + (1 if reject_enabled else 0), args.architecture).to(device)
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    history = []
    best_state: dict[str, Any] | None = None
    best_validation_accuracy = -1.0
    for epoch in range(1, args.epochs + 1):
        train_metrics = iterate(model, train_loader, device, criterion, optimizer)
        validation_metrics = iterate(model, validation_loader, device, criterion, None)
        history.append({"epoch": epoch, "train": train_metrics, "validation": validation_metrics})
        if validation_metrics["accuracy"] > best_validation_accuracy:
            best_validation_accuracy = validation_metrics["accuracy"]
            best_state = copy.deepcopy({key: value.detach().cpu() for key, value in model.state_dict().items()})
        print(stable_json(history[-1]).strip(), flush=True)
    if best_state is not None:
        model.load_state_dict(best_state)
        model.to(device)

    validation_scores_full = score_dataset(model, validation_loader, device)
    test_scores_full = score_dataset(model, test_loader, device)
    challenge_scores_full = score_challenge(
        model,
        negative_challenge_eval_records,
        args.challenge_manifest,
        args.frame_count,
        args.image_size,
        device,
    )
    reject_eval_scores_full = (
        score_challenge(
            model,
            reject_eval_records,
            args.reject_eval_manifest,
            args.frame_count,
            args.image_size,
            device,
        )
        if args.reject_eval_manifest and reject_eval_records
        else None
    )
    reject_validation_scores_full = (
        score_challenge(
            model,
            reject_validation_records,
            args.reject_validation_manifest,
            args.frame_count,
            args.image_size,
            device,
        )
        if args.reject_validation_manifest and reject_validation_records
        else None
    )
    validation_scores = validation_scores_full[:, : len(labels)]
    test_scores = test_scores_full[:, : len(labels)]
    challenge_scores = challenge_scores_full[:, : len(labels)]
    reject_eval_scores = reject_eval_scores_full[:, : len(labels)] if reject_eval_scores_full is not None else None
    reject_validation_scores = (
        reject_validation_scores_full[:, : len(labels)] if reject_validation_scores_full is not None else None
    )
    validation_reject_scores = reject_probabilities(validation_scores_full, labels)
    test_reject_scores = reject_probabilities(test_scores_full, labels)
    challenge_reject_scores = reject_probabilities(challenge_scores_full, labels)
    reject_validation_reject_scores = (
        reject_probabilities(reject_validation_scores_full, labels)
        if reject_validation_scores_full is not None
        else None
    )
    reject_eval_reject_scores = (
        reject_probabilities(reject_eval_scores_full, labels)
        if reject_eval_scores_full is not None
        else None
    )
    validation_records = validation_dataset.records
    test_records = test_dataset.records
    thresholds, threshold_diagnostics = choose_thresholds(
        validation_scores,
        validation_records,
        labels,
        args.min_accepted_precision,
        args.max_validation_false_pass_rate,
    )
    validation_metrics = classification_metrics(validation_scores, validation_records, labels)
    test_metrics = classification_metrics(test_scores, test_records, labels)
    validation_threshold_metrics = threshold_stats(validation_scores, validation_records, labels, thresholds)
    test_threshold_metrics = threshold_stats(test_scores, test_records, labels, thresholds)
    challenge_metrics = negative_challenge_metrics(challenge_scores, negative_challenge_eval_records, labels, thresholds)
    reject_eval_metrics = (
        negative_challenge_metrics(reject_eval_scores, reject_eval_records, labels, thresholds)
        if reject_eval_scores is not None
        else None
    )
    reject_gate_selection = choose_reject_probability_gate(
        validation_scores,
        validation_reject_scores,
        validation_records,
        reject_validation_scores,
        reject_validation_reject_scores,
        reject_validation_records,
        labels,
        thresholds,
        args.max_validation_false_pass_rate,
        args.negative_false_pass_target,
    )
    max_reject_probability = (
        float(reject_gate_selection["max_reject_probability"]) if reject_gate_selection is not None else None
    )
    if reject_gate_selection is not None:
        validation_threshold_metrics_single_stage = validation_threshold_metrics
        test_threshold_metrics_single_stage = test_threshold_metrics
        challenge_metrics_single_stage = challenge_metrics
        reject_eval_metrics_single_stage = reject_eval_metrics
        validation_threshold_metrics = threshold_stats_with_reject_gate(
            validation_scores,
            validation_reject_scores,
            validation_records,
            labels,
            thresholds,
            max_reject_probability,
        )
        test_threshold_metrics = threshold_stats_with_reject_gate(
            test_scores,
            test_reject_scores,
            test_records,
            labels,
            thresholds,
            max_reject_probability,
        )
        challenge_metrics = negative_challenge_metrics_with_reject_gate(
            challenge_scores,
            challenge_reject_scores,
            negative_challenge_eval_records,
            labels,
            thresholds,
            max_reject_probability,
        )
        reject_eval_metrics = (
            negative_challenge_metrics_with_reject_gate(
                reject_eval_scores,
                reject_eval_reject_scores,
                reject_eval_records,
                labels,
                thresholds,
                max_reject_probability,
            )
            if reject_eval_scores is not None
            else None
        )
    else:
        validation_threshold_metrics_single_stage = None
        test_threshold_metrics_single_stage = None
        challenge_metrics_single_stage = None
        reject_eval_metrics_single_stage = None
    pass_status = {
        "top1_accuracy": test_metrics["top1_accuracy"] >= args.top1_target,
        "macro_f1": test_metrics["macro_f1"] >= args.macro_f1_target,
        "false_pass_rate": test_threshold_metrics["wrong_prompt_false_pass_rate"] < args.test_false_pass_target,
        "negative_challenge_false_pass_rate": challenge_metrics["false_pass_rate"] < args.negative_false_pass_target,
    }
    if args.model_state:
        args.model_state.parent.mkdir(parents=True, exist_ok=True)
        torch.save(
            {
                "schema_version": f"{SCHEMA_VERSION}-state",
                "labels": labels,
                "reject_label": "__negative_reject__" if reject_enabled else None,
                "architecture": args.architecture,
                "state_dict": {key: value.detach().cpu() for key, value in model.state_dict().items()},
            },
            args.model_state,
        )

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "diagnostic_failed" if not all(pass_status.values()) else "diagnostic_passed_not_promotable",
        "finality": "diagnostic_not_final_model_evidence",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": {
                "path": project_relative(Path(__file__)),
                "sha256": sha256_file(Path(__file__)),
            },
            "command": sys.argv,
        },
        "method": {
            "name": "raw_frame_closed_set_classifier_as_prompt_verifier",
            "pretrained_components": [],
            "architecture": args.architecture,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "training_augmentation": args.training_augmentation,
            "tensor_validation": "relative_frame_tensor_path exists and frame_tensor_sha256 matches",
            "decode_provenance_rechecked": args.require_decode_provenance,
            "checkpoint_selection": "best_validation_accuracy",
            "prompt_decision": "pass if prompted label probability is at or above its validation-selected threshold",
            "threshold_selection": {
                "source_split": "validation",
                "min_accepted_precision": args.min_accepted_precision,
                "max_validation_false_pass_rate": args.max_validation_false_pass_rate,
            },
            "negative_reject_training": {
                "enabled": reject_enabled,
                "source_manifest": project_relative(args.challenge_manifest) if args.train_negative_reject else None,
                "hard_negative_train_manifest": project_relative(args.reject_train_manifest) if args.reject_train_manifest else None,
                "hard_negative_validation_manifest": (
                    project_relative(args.reject_validation_manifest) if args.reject_validation_manifest else None
                ),
                "hard_negative_eval_manifest": project_relative(args.reject_eval_manifest) if args.reject_eval_manifest else None,
                "train_clip_count": len(train_reject_records),
                "heldout_eval_clip_count": len(negative_challenge_eval_records),
                "hard_negative_validation_clip_count": len(reject_validation_records),
                "hard_negative_eval_clip_count": len(reject_eval_records),
                "split_policy": "deterministic_manifest_order_prefix_train_suffix_eval",
            },
        },
        "model_state": (
            {
                "path": project_relative(args.model_state),
                "sha256": sha256_file(args.model_state),
            }
            if args.model_state
            else None
        ),
        "manifests": {
            "train": manifest_record(args.train_manifest, "train"),
            "validation": manifest_record(args.validation_manifest, "validation"),
            "test": manifest_record(args.test_manifest, "test"),
            "negative_challenge": challenge_manifest_record(args.challenge_manifest),
        },
        "negative_reject_training": {
            "enabled": reject_enabled,
            "train_clip_ids": [record.get("clip_id") for record in negative_reject_train_records],
            "hard_negative_train_clip_count": len(reject_train_records),
            "hard_negative_validation_clip_count": len(reject_validation_records),
            "heldout_eval_clip_ids": [record.get("clip_id") for record in negative_challenge_eval_records],
            "hard_negative_eval_clip_count": len(reject_eval_records),
        },
        "second_stage_reject_gate": (
            {
                "enabled": True,
                "selected_on": "validation_plus_hard_negative_validation",
                "max_reject_probability": max_reject_probability,
                "selection": reject_gate_selection,
                "single_stage_validation_threshold_metrics": validation_threshold_metrics_single_stage,
                "single_stage_test_threshold_metrics": test_threshold_metrics_single_stage,
                "single_stage_negative_challenge": challenge_metrics_single_stage,
                "single_stage_hard_negative_reject_eval": reject_eval_metrics_single_stage,
            }
            if reject_gate_selection is not None
            else {
                "enabled": False,
                "reason": "requires a reject-enabled model and --reject-validation-manifest",
            }
        ),
        "labels": labels,
        "thresholds": thresholds,
        "threshold_diagnostics": threshold_diagnostics,
        "training_history": history,
        "validation": {**validation_metrics, "threshold_metrics": validation_threshold_metrics},
        "test": {**test_metrics, "threshold_metrics": test_threshold_metrics},
        "negative_challenge": challenge_metrics,
        "hard_negative_reject_eval": reject_eval_metrics,
        "targets": {
            "top1_accuracy": args.top1_target,
            "macro_f1": args.macro_f1_target,
            "test_false_pass_rate_below": args.test_false_pass_target,
            "negative_challenge_false_pass_rate_below": args.negative_false_pass_target,
        },
        "pass_status": pass_status,
        "known_limitations": [
            "Diagnostic scoped verifier; no browser artifact or model card promotion.",
            "Current subset is controlled clip-heldout and not signer-disjoint.",
            "The web app must not claim global 95-way recognition from this report.",
        ],
    }
    write_json(args.output_report, report)
    if args.prediction_sidecar:
        sidecar = {
            "schema_version": f"{SCHEMA_VERSION}-prediction-sidecar",
            "created_at": report["created_at"],
            "report": {
                "path": project_relative(args.output_report),
                "sha256": sha256_file(args.output_report),
            },
            "labels": labels,
            "thresholds": thresholds,
            "splits": [
                build_sidecar_with_reject_score(validation_scores, validation_scores_full, validation_records, labels, "validation"),
                build_sidecar_with_reject_score(test_scores, test_scores_full, test_records, labels, "test"),
                build_sidecar_with_reject_score(
                    challenge_scores,
                    challenge_scores_full,
                    negative_challenge_eval_records,
                    labels,
                    "negative_challenge",
                ),
                *(
                    [
                        build_sidecar_with_reject_score(
                            reject_validation_scores,
                            reject_validation_scores_full,
                            reject_validation_records,
                            labels,
                            "hard_negative_reject_validation",
                        )
                    ]
                    if reject_validation_scores is not None and reject_validation_scores_full is not None
                    else []
                ),
                *(
                    [
                        build_sidecar_with_reject_score(
                            reject_eval_scores,
                            reject_eval_scores_full,
                            reject_eval_records,
                            labels,
                            "hard_negative_reject_eval",
                        )
                    ]
                    if reject_eval_scores is not None
                    else []
                ),
            ],
        }
        write_json(args.prediction_sidecar, sidecar)
    print(stable_json({
        "status": report["status"],
        "output_report": project_relative(args.output_report),
        "output_report_sha256": sha256_file(args.output_report),
        "prediction_sidecar": project_relative(args.prediction_sidecar) if args.prediction_sidecar else None,
        "model_state": project_relative(args.model_state) if args.model_state else None,
        "test_top1_accuracy": test_metrics["top1_accuracy"],
        "test_macro_f1": test_metrics["macro_f1"],
        "test_true_accept_rate": test_threshold_metrics["true_accept_rate"],
        "test_wrong_prompt_false_pass_rate": test_threshold_metrics["wrong_prompt_false_pass_rate"],
        "negative_challenge_false_pass_rate": challenge_metrics["false_pass_rate"],
        "hard_negative_reject_false_pass_rate": (
            reject_eval_metrics["false_pass_rate"] if reject_eval_metrics else None
        ),
        "pass_status": pass_status,
    }))
    return 0 if all(pass_status.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
