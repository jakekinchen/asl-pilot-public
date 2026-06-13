#!/usr/bin/env python3
"""Train a from-scratch prompt-conditioned raw-frame verifier.

This is the emergency verifier lane for the 25-40 sign scoped claim. It uses
decoded raw RGB tensors, a small project-local feature extractor, a learned
prompt embedding, and validation-only per-label thresholds. It does not use
pretrained models, detectors, landmarks, keypoints, crops, or synthetic media.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from collections import defaultdict
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
    extract_feature,
    load_features,
    manifest_record,
    negative_challenge_metrics,
    project_relative,
    read_json,
    stable_json,
    threshold_stats,
    validate_label_sets,
    write_json,
)
from train_rawframe_model import load_manifest, sha256_file


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-prompt-conditioned-verifier/v1"


class PromptConditionedVerifier(torch.nn.Module):
    def __init__(self, feature_dim: int, label_count: int, hidden_size: int, label_embedding_size: int) -> None:
        super().__init__()
        self.label_embedding = torch.nn.Embedding(label_count, label_embedding_size)
        self.network = torch.nn.Sequential(
            torch.nn.Linear(feature_dim + label_embedding_size, hidden_size),
            torch.nn.LayerNorm(hidden_size),
            torch.nn.GELU(),
            torch.nn.Dropout(0.15),
            torch.nn.Linear(hidden_size, hidden_size),
            torch.nn.LayerNorm(hidden_size),
            torch.nn.GELU(),
            torch.nn.Dropout(0.15),
            torch.nn.Linear(hidden_size, 1),
        )

    def forward(self, features: torch.Tensor, label_indices: torch.Tensor) -> torch.Tensor:
        embeddings = self.label_embedding(label_indices)
        return self.network(torch.cat([features, embeddings], dim=1)).squeeze(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, required=True)
    parser.add_argument("--validation-manifest", type=Path, required=True)
    parser.add_argument("--test-manifest", type=Path, required=True)
    parser.add_argument("--challenge-manifest", type=Path, required=True)
    parser.add_argument("--output-report", type=Path, required=True)
    parser.add_argument("--prediction-sidecar", type=Path)
    parser.add_argument("--model-state", type=Path)
    parser.add_argument("--seed", type=int, default=20260522)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--feature-size", type=int, default=24)
    parser.add_argument("--hidden-size", type=int, default=256)
    parser.add_argument("--label-embedding-size", type=int, default=32)
    parser.add_argument("--epochs", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=1024)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-3)
    parser.add_argument("--min-accepted-precision", type=float, default=0.0)
    parser.add_argument("--max-validation-false-pass-rate", type=float, default=0.1)
    parser.add_argument("--top1-target", type=float, default=0.7)
    parser.add_argument("--macro-f1-target", type=float, default=0.65)
    parser.add_argument("--test-false-pass-target", type=float, default=0.1)
    parser.add_argument("--negative-false-pass-target", type=float, default=0.05)
    return parser.parse_args()


def standardize(train: torch.Tensor, *others: torch.Tensor) -> tuple[torch.Tensor, ...]:
    mean = train.mean(dim=0)
    std = train.std(dim=0).clamp_min(1e-4)
    return tuple((item - mean) / std for item in (train, *others))


def labels_for(records: list[dict[str, Any]], label_to_index: dict[str, int]) -> torch.Tensor:
    return torch.tensor([label_to_index[str(record["label_id"])] for record in records], dtype=torch.long)


def all_prompt_pairs(true_labels: torch.Tensor, label_count: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    clip_indices = torch.arange(true_labels.shape[0], dtype=torch.long).repeat_interleave(label_count)
    prompt_indices = torch.arange(label_count, dtype=torch.long).repeat(true_labels.shape[0])
    targets = (prompt_indices == true_labels.repeat_interleave(label_count)).to(dtype=torch.float32)
    return clip_indices, prompt_indices, targets


def scores_for_all_labels(
    model: PromptConditionedVerifier,
    features: torch.Tensor,
    label_count: int,
    batch_size: int,
    device: torch.device,
) -> torch.Tensor:
    model.eval()
    rows = []
    with torch.no_grad():
        for start in range(0, features.shape[0], batch_size):
            batch = features[start:start + batch_size].to(device)
            columns = []
            for label_index in range(label_count):
                prompt = torch.full((batch.shape[0],), label_index, dtype=torch.long, device=device)
                columns.append(torch.sigmoid(model(batch, prompt)).cpu())
            rows.append(torch.stack(columns, dim=1))
    return torch.cat(rows, dim=0)


def train_model(
    model: PromptConditionedVerifier,
    train_features: torch.Tensor,
    train_true_labels: torch.Tensor,
    validation_features: torch.Tensor,
    validation_true_labels: torch.Tensor,
    args: argparse.Namespace,
    device: torch.device,
) -> list[dict[str, float]]:
    label_count = int(train_true_labels.max().item()) + 1
    clip_indices, prompt_indices, targets = all_prompt_pairs(train_true_labels, label_count)
    pos_weight = torch.tensor([(targets == 0).sum().item() / max((targets == 1).sum().item(), 1)], device=device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=args.weight_decay,
    )
    history: list[dict[str, float]] = []
    features_on_device = train_features.to(device)
    validation_features_on_device = validation_features.to(device)
    validation_true_labels_on_device = validation_true_labels.to(device)
    pair_count = targets.shape[0]
    for epoch in range(1, args.epochs + 1):
        model.train()
        permutation = torch.randperm(pair_count)
        total_loss = 0.0
        for start in range(0, pair_count, args.batch_size):
            indices = permutation[start:start + args.batch_size]
            clip_batch = clip_indices[indices].to(device)
            prompt_batch = prompt_indices[indices].to(device)
            target_batch = targets[indices].to(device)
            logits = model(features_on_device[clip_batch], prompt_batch)
            loss = torch.nn.functional.binary_cross_entropy_with_logits(
                logits,
                target_batch,
                pos_weight=pos_weight,
            )
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(indices)
        if epoch == 1 or epoch % 10 == 0 or epoch == args.epochs:
            with torch.no_grad():
                validation_scores = scores_for_all_labels(
                    model,
                    validation_features_on_device.cpu(),
                    label_count,
                    args.batch_size,
                    device,
                )
                validation_accuracy = (
                    validation_scores.argmax(dim=1) == validation_true_labels_on_device.cpu()
                ).to(dtype=torch.float32).mean().item()
            history.append({
                "epoch": float(epoch),
                "train_loss": total_loss / pair_count,
                "validation_top1_accuracy": validation_accuracy,
            })
            print(stable_json(history[-1]).strip(), flush=True)
    return history


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

    train_features, train_records = load_features(
        torch,
        args.train_manifest,
        train_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        None,
    )
    validation_features, validation_records = load_features(
        torch,
        args.validation_manifest,
        validation_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        None,
    )
    test_features, test_records = load_features(
        torch,
        args.test_manifest,
        test_manifest,
        args.frame_count,
        args.image_size,
        args.feature_size,
        None,
    )
    challenge_records = clip_records(args.challenge_manifest, challenge_manifest, None)
    challenge_features = torch.stack(
        [
            extract_feature(torch, record["tensor_path"], args.frame_count, args.image_size, args.feature_size)
            for record in challenge_records
        ],
        dim=0,
    )
    train_features, validation_features, test_features, challenge_features = standardize(
        train_features,
        validation_features,
        test_features,
        challenge_features,
    )
    train_true_labels = labels_for(train_records, label_to_index)
    validation_true_labels = labels_for(validation_records, label_to_index)
    test_true_labels = labels_for(test_records, label_to_index)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = PromptConditionedVerifier(
        feature_dim=train_features.shape[1],
        label_count=len(labels),
        hidden_size=args.hidden_size,
        label_embedding_size=args.label_embedding_size,
    ).to(device)
    history = train_model(
        model,
        train_features,
        train_true_labels,
        validation_features,
        validation_true_labels,
        args,
        device,
    )
    validation_scores = scores_for_all_labels(model, validation_features, len(labels), args.batch_size, device)
    test_scores = scores_for_all_labels(model, test_features, len(labels), args.batch_size, device)
    challenge_scores = scores_for_all_labels(model, challenge_features, len(labels), args.batch_size, device)
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
    challenge_metrics = negative_challenge_metrics(challenge_scores, challenge_records, labels, thresholds)

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
                "model_config": {
                    "feature_dim": train_features.shape[1],
                    "hidden_size": args.hidden_size,
                    "label_embedding_size": args.label_embedding_size,
                    "feature_size": args.feature_size,
                    "frame_count": args.frame_count,
                    "image_size": args.image_size,
                },
                "state_dict": model.cpu().state_dict(),
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
            "name": "raw_frame_prompt_conditioned_shared_binary_verifier",
            "pretrained_components": [],
            "feature_extraction": {
                "source": "decoded_raw_rgb_tensors_only",
                "frame_count": args.frame_count,
                "image_size": args.image_size,
                "feature_size": args.feature_size,
                "features": ["clip_standardized_grayscale_frames", "clip_standardized_frame_deltas"],
            },
            "training": {
                "seed": args.seed,
                "epochs": args.epochs,
                "batch_size": args.batch_size,
                "learning_rate": args.learning_rate,
                "weight_decay": args.weight_decay,
                "device": str(device),
                "pair_policy": "all train clips paired with true prompt plus every wrong prompt label",
                "threshold_selection": {
                    "source_split": "validation",
                    "min_accepted_precision": args.min_accepted_precision,
                    "max_validation_false_pass_rate": args.max_validation_false_pass_rate,
                },
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
        "labels": labels,
        "thresholds": thresholds,
        "threshold_diagnostics": threshold_diagnostics,
        "training_history": history,
        "validation": {
            **validation_metrics,
            "threshold_metrics": validation_threshold_metrics,
        },
        "test": {
            **test_metrics,
            "threshold_metrics": test_threshold_metrics,
        },
        "negative_challenge": challenge_metrics,
        "targets": {
            "top1_accuracy": args.top1_target,
            "macro_f1": args.macro_f1_target,
            "test_false_pass_rate_below": args.test_false_pass_target,
            "negative_challenge_false_pass_rate_below": args.negative_false_pass_target,
        },
        "pass_status": pass_status,
        "known_limitations": [
            "Diagnostic prompt-conditioned verifier; no browser artifact or model card promotion.",
            "Per-label thresholds are selected from validation only and may not generalize.",
            "Current subset is controlled clip-heldout and not signer-disjoint.",
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
                build_sidecar(validation_scores, validation_records, labels, "validation"),
                build_sidecar(test_scores, test_records, labels, "test"),
                build_sidecar(challenge_scores, challenge_records, labels, "negative_challenge"),
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
        "pass_status": pass_status,
    }))
    return 0 if all(pass_status.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
