#!/usr/bin/env python3
"""Train a small from-scratch LSTM classifier from decoded manifest tensors."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import torch
import torch.nn.functional as F


ROOT = Path(__file__).resolve().parents[1]


class ManifestLstmError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", required=True, type=Path)
    parser.add_argument("--validation-manifest", required=True, type=Path)
    parser.add_argument("--test-manifest", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--feature-size", type=int, default=24)
    parser.add_argument("--hidden-size", type=int, default=64)
    parser.add_argument(
        "--architecture",
        choices=("flat_rgb_lstm", "cnn_lstm_rgb"),
        default="flat_rgb_lstm",
        help="Sequence classifier architecture. flat_rgb_lstm preserves the original flattened-pixel LSTM diagnostic; cnn_lstm_rgb adds a project-owned CNN frame encoder before the LSTM.",
    )
    parser.add_argument(
        "--input-note",
        default="Decoded full-frame RGB tensor sequence ablation; not hand-only ROI/keypoint evidence.",
        help="Short provenance note for the validation report model input.",
    )
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-2)
    parser.add_argument("--seed", type=int, default=20260522)
    parser.add_argument("--allow-small-label-set", action="store_true")
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def resolve_manifest_relative(manifest_path: Path, relative: str) -> Path:
    resolved = (manifest_path.parent / relative).resolve()
    if not str(resolved).startswith(str(ROOT.resolve()) + "/"):
        raise ManifestLstmError(f"manifest path escapes project root: {relative}")
    return resolved


def load_manifest(path: Path, allow_small_label_set: bool) -> dict[str, Any]:
    manifest = read_json(path)
    labels = manifest.get("labels")
    clips = manifest.get("clips")
    if not isinstance(labels, list) or not isinstance(clips, list):
        raise ManifestLstmError(f"{path} must contain labels and clips arrays")
    if len(labels) < 75 and not allow_small_label_set:
        raise ManifestLstmError(f"{path} has {len(labels)} labels; pass --allow-small-label-set for diagnostics")
    for index, clip in enumerate(clips):
        context = f"{path}: clips[{index}]"
        tensor_relative = clip.get("relative_frame_tensor_path")
        tensor_sha = clip.get("frame_tensor_sha256")
        if not isinstance(tensor_relative, str) or not tensor_relative:
            raise ManifestLstmError(f"{context} is missing relative_frame_tensor_path")
        if not isinstance(tensor_sha, str) or len(tensor_sha) != 64:
            raise ManifestLstmError(f"{context} is missing frame_tensor_sha256")
        tensor_path = resolve_manifest_relative(path, tensor_relative)
        if not tensor_path.exists():
            raise ManifestLstmError(f"{context} tensor file is missing: {project_relative(tensor_path)}")
        if sha256_file(tensor_path) != tensor_sha:
            raise ManifestLstmError(f"{context} tensor hash mismatch: {project_relative(tensor_path)}")
    return manifest


def label_ids(manifest: dict[str, Any]) -> list[str]:
    return [str(item["label_id"]) for item in manifest["labels"]]


def load_rgb_tensor(path: Path) -> torch.Tensor:
    payload = torch.load(path, map_location="cpu")
    frames = payload.get("rgb_frames") if isinstance(payload, dict) else payload
    if not isinstance(frames, torch.Tensor):
        raise ManifestLstmError(f"decoded tensor payload is not a torch.Tensor: {project_relative(path)}")
    if frames.ndim != 4:
        raise ManifestLstmError(f"decoded tensor must be 4D: {project_relative(path)}")
    if frames.shape[-1] == 3:
        frames = frames.permute(0, 3, 1, 2)
    elif frames.shape[1] != 3:
        raise ManifestLstmError(f"decoded tensor must have RGB channels: {project_relative(path)}")
    return frames.float().div(255.0)


def clip_to_sequence(manifest_path: Path, clip: dict[str, Any], feature_size: int, architecture: str) -> torch.Tensor:
    tensor_path = resolve_manifest_relative(manifest_path, clip["relative_frame_tensor_path"])
    frames = load_rgb_tensor(tensor_path)
    pooled = F.interpolate(frames, size=(feature_size, feature_size), mode="bilinear", align_corners=False)
    if architecture == "flat_rgb_lstm":
        return pooled.flatten(1)
    return pooled.contiguous()


class SequenceDataset(torch.utils.data.Dataset):
    def __init__(
        self,
        manifest_path: Path,
        manifest: dict[str, Any],
        label_to_index: dict[str, int],
        feature_size: int,
        architecture: str,
    ):
        self.manifest_path = manifest_path
        self.clips = manifest["clips"]
        self.label_to_index = label_to_index
        self.feature_size = feature_size
        self.architecture = architecture

    def __len__(self) -> int:
        return len(self.clips)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        clip = self.clips[index]
        sequence = clip_to_sequence(self.manifest_path, clip, self.feature_size, self.architecture)
        label = torch.tensor(self.label_to_index[clip["label_id"]], dtype=torch.long)
        return sequence, label


class LstmClassifier(torch.nn.Module):
    def __init__(self, input_size: int, hidden_size: int, class_count: int):
        super().__init__()
        self.lstm = torch.nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.dropout = torch.nn.Dropout(0.2)
        self.classifier = torch.nn.Linear(hidden_size * 2, class_count)

    def forward(self, sequence: torch.Tensor) -> torch.Tensor:
        output, _ = self.lstm(sequence)
        return self.classifier(self.dropout(output[:, -1, :]))


class CnnLstmClassifier(torch.nn.Module):
    def __init__(self, hidden_size: int, class_count: int):
        super().__init__()
        self.encoder = torch.nn.Sequential(
            torch.nn.Conv2d(3, 24, kernel_size=3, stride=1, padding=1, bias=False),
            torch.nn.BatchNorm2d(24),
            torch.nn.ReLU(inplace=True),
            torch.nn.Conv2d(24, 48, kernel_size=3, stride=2, padding=1, bias=False),
            torch.nn.BatchNorm2d(48),
            torch.nn.ReLU(inplace=True),
            torch.nn.Conv2d(48, 96, kernel_size=3, stride=2, padding=1, bias=False),
            torch.nn.BatchNorm2d(96),
            torch.nn.ReLU(inplace=True),
            torch.nn.AdaptiveAvgPool2d((1, 1)),
            torch.nn.Flatten(),
        )
        self.lstm = torch.nn.LSTM(
            input_size=96,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.dropout = torch.nn.Dropout(0.25)
        self.classifier = torch.nn.Linear(hidden_size * 2, class_count)

    def forward(self, sequence: torch.Tensor) -> torch.Tensor:
        batch_size, frame_count, channels, height, width = sequence.shape
        encoded = self.encoder(sequence.reshape(batch_size * frame_count, channels, height, width))
        encoded = encoded.reshape(batch_size, frame_count, -1)
        output, _ = self.lstm(encoded)
        return self.classifier(self.dropout(output[:, -1, :]))


def make_loader(dataset: SequenceDataset, batch_size: int, shuffle: bool, seed: int) -> torch.utils.data.DataLoader:
    generator = torch.Generator().manual_seed(seed)
    return torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, generator=generator, num_workers=0)


def choose_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def evaluate(model: torch.nn.Module, loader: torch.utils.data.DataLoader, device: torch.device, class_count: int) -> dict[str, Any]:
    model.eval()
    loss_total = 0.0
    count = 0
    correct = 0
    confusion = [[0 for _ in range(class_count)] for _ in range(class_count)]
    with torch.no_grad():
        for sequence, labels in loader:
            sequence = sequence.to(device)
            labels = labels.to(device)
            logits = model(sequence)
            loss = F.cross_entropy(logits, labels)
            predictions = logits.argmax(dim=1)
            loss_total += float(loss.item()) * labels.numel()
            count += labels.numel()
            correct += int((predictions == labels).sum().item())
            for actual, predicted in zip(labels.cpu().tolist(), predictions.cpu().tolist()):
                confusion[actual][predicted] += 1
    per_class = []
    f1_values = []
    recalls = []
    for label_index in range(class_count):
        true_positive = confusion[label_index][label_index]
        actual_total = sum(confusion[label_index])
        predicted_total = sum(row[label_index] for row in confusion)
        recall = true_positive / actual_total if actual_total else 0.0
        precision = true_positive / predicted_total if predicted_total else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        recalls.append(recall)
        f1_values.append(f1)
        per_class.append({
            "index": label_index,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": actual_total,
        })
    return {
        "accuracy": correct / count if count else 0.0,
        "loss": loss_total / count if count else math.inf,
        "macro_recall": sum(recalls) / len(recalls) if recalls else 0.0,
        "macro_f1": sum(f1_values) / len(f1_values) if f1_values else 0.0,
        "per_class": per_class,
        "confusion_matrix": confusion,
    }


def attach_label_names(metrics: dict[str, Any], labels: list[str]) -> dict[str, Any]:
    output = json.loads(json.dumps(metrics))
    for row in output["per_class"]:
        row["label_id"] = labels[row.pop("index")]
    output["confusion_matrix_labels"] = labels
    return output


def top_confusions(confusion: list[list[int]], labels: list[str]) -> list[dict[str, Any]]:
    pairs = []
    for actual_index, row in enumerate(confusion):
        for predicted_index, count in enumerate(row):
            if actual_index != predicted_index and count:
                pairs.append({
                    "actual": labels[actual_index],
                    "predicted": labels[predicted_index],
                    "count": count,
                })
    return sorted(pairs, key=lambda item: (-item["count"], item["actual"], item["predicted"]))[:20]


def main() -> int:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    train_manifest = load_manifest(args.train_manifest, args.allow_small_label_set)
    validation_manifest = load_manifest(args.validation_manifest, args.allow_small_label_set)
    test_manifest = load_manifest(args.test_manifest, args.allow_small_label_set)
    labels = label_ids(train_manifest)
    if label_ids(validation_manifest) != labels or label_ids(test_manifest) != labels:
        raise ManifestLstmError("train/validation/test label arrays must match exactly")
    label_to_index = {label: index for index, label in enumerate(labels)}
    input_size = args.feature_size * args.feature_size * 3 if args.architecture == "flat_rgb_lstm" else 96
    device = choose_device()
    train_dataset = SequenceDataset(args.train_manifest, train_manifest, label_to_index, args.feature_size, args.architecture)
    validation_dataset = SequenceDataset(args.validation_manifest, validation_manifest, label_to_index, args.feature_size, args.architecture)
    test_dataset = SequenceDataset(args.test_manifest, test_manifest, label_to_index, args.feature_size, args.architecture)
    train_loader = make_loader(train_dataset, args.batch_size, True, args.seed)
    validation_loader = make_loader(validation_dataset, args.batch_size, False, args.seed)
    test_loader = make_loader(test_dataset, args.batch_size, False, args.seed)
    if args.architecture == "flat_rgb_lstm":
        architecture_id = "single_layer_bidirectional_lstm_over_downsampled_decoded_rgb_sequence"
        model = LstmClassifier(input_size, args.hidden_size, len(labels)).to(device)
    else:
        architecture_id = "project_owned_cnn_frame_encoder_bidirectional_lstm_sequence_classifier"
        model = CnnLstmClassifier(args.hidden_size, len(labels)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    history = []
    best_state = None
    best_validation = -1.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        loss_total = 0.0
        train_count = 0
        train_correct = 0
        for sequence, batch_labels in train_loader:
            sequence = sequence.to(device)
            batch_labels = batch_labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(sequence)
            loss = F.cross_entropy(logits, batch_labels)
            loss.backward()
            optimizer.step()
            loss_total += float(loss.item()) * batch_labels.numel()
            train_count += batch_labels.numel()
            train_correct += int((logits.argmax(dim=1) == batch_labels).sum().item())
        validation_metrics = evaluate(model, validation_loader, device, len(labels))
        if validation_metrics["accuracy"] > best_validation:
            best_validation = validation_metrics["accuracy"]
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
        history.append({
            "epoch": epoch,
            "train_accuracy": train_correct / train_count if train_count else 0.0,
            "train_loss": loss_total / train_count if train_count else math.inf,
            "validation_accuracy": validation_metrics["accuracy"],
            "validation_macro_f1": validation_metrics["macro_f1"],
            "validation_loss": validation_metrics["loss"],
        })
        print(json.dumps(history[-1], sort_keys=True), flush=True)
    if best_state is not None:
        model.load_state_dict(best_state)
    validation_metrics = attach_label_names(evaluate(model, validation_loader, device, len(labels)), labels)
    test_metrics = attach_label_names(evaluate(model, test_loader, device, len(labels)), labels)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    model_path = args.output_dir / "model_state.pt"
    report_path = args.output_dir / "validation-report.json"
    provenance_path = args.output_dir / "training-provenance.json"
    torch.save({
        "model_state_dict": model.state_dict(),
        "labels": labels,
        "architecture": architecture_id,
        "input_size": input_size,
        "hidden_size": args.hidden_size,
        "feature_size": args.feature_size,
    }, model_path)
    report = {
        "schema_version": "asl-pilot-manifest-lstm-sequence-classifier-report/v1",
        "status": "failed_targets" if test_metrics["accuracy"] < 0.70 or test_metrics["macro_f1"] < 0.65 else "passed_targets",
        "finality": "academic_online_dataset_cnn_lstm_diagnostic_not_model_promotion",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "model": {
            "architecture": architecture_id,
            "project_owned": True,
            "initialization": "random",
            "pretrained_components": [],
            "input_note": args.input_note,
        },
        "labels": labels,
        "gate": {
            "heldout_accuracy_min": 0.70,
            "macro_recall_or_f1_min": 0.65,
            "min_per_class_recall_without_remediation": 0.45,
        },
        "validation": validation_metrics,
        "test": test_metrics,
        "top_confusions": top_confusions(test_metrics["confusion_matrix"], labels),
        "passes_targets": test_metrics["accuracy"] >= 0.70 and test_metrics["macro_f1"] >= 0.65,
        "artifacts": {
            "model_state": project_relative(model_path),
            "training_provenance": project_relative(provenance_path),
        },
    }
    provenance = {
        "schema_version": "asl-pilot-manifest-lstm-sequence-classifier-provenance/v1",
        "generated_at": report["generated_at"],
        "command": [
            str(Path(torch.__file__).resolve()),
        ],
        "training_script": {
            "path": project_relative(Path(__file__)),
            "sha256": sha256_file(Path(__file__)),
        },
        "manifests": {
            "train": {"path": project_relative(args.train_manifest), "sha256": sha256_file(args.train_manifest)},
            "validation": {"path": project_relative(args.validation_manifest), "sha256": sha256_file(args.validation_manifest)},
            "test": {"path": project_relative(args.test_manifest), "sha256": sha256_file(args.test_manifest)},
        },
        "hyperparameters": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "feature_size": args.feature_size,
            "hidden_size": args.hidden_size,
            "architecture": args.architecture,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "seed": args.seed,
        },
        "device": str(device),
        "history": history,
        "pretrained_components": [],
    }
    write_json(provenance_path, provenance)
    write_json(report_path, report)
    print(json.dumps({
        "status": report["status"],
        "passes_targets": report["passes_targets"],
        "test_accuracy": test_metrics["accuracy"],
        "test_macro_f1": test_metrics["macro_f1"],
        "output_report": project_relative(report_path),
        "model_state": project_relative(model_path),
    }, indent=2, sort_keys=True))
    return 0 if report["passes_targets"] else 1


try:
    raise SystemExit(main())
except ManifestLstmError as error:
    print(f"manifest LSTM training failed: {error}")
    raise SystemExit(2)
