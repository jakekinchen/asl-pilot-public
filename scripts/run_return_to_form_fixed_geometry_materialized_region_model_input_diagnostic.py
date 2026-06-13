#!/usr/bin/env python3
"""Run the M3EF materialized-region model-input diagnostic."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import shlex
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-fixed-geometry-materialized-region-model-input-diagnostic/v1"
DEFAULT_OUTPUT = (
    ROOT
    / "docs"
    / "validation"
    / "return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json"
)
ACTIVE_PROMPT = (
    ROOT
    / "docs"
    / "model"
    / "return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-goal-loop-prompt.md"
)
SESSION_LOG = "docs/session-logs/507-mission-3ef-fixed-geometry-materialized-region-model-input-diagnostic.md"
MANIFESTS = {
    "train": ROOT / "data" / "manifests" / "return-to-form-tier0" / "train.json",
    "validation": ROOT / "data" / "manifests" / "return-to-form-tier0" / "validation.json",
    "test": ROOT / "data" / "manifests" / "return-to-form-tier0" / "test.json",
}
REFERENCE_PATHS = {
    "goal": ROOT / "GOAL.md",
    "active_prompt": ACTIVE_PROMPT,
    "return_to_form_plan": ROOT / "docs" / "model" / "return-to-form-plan.md",
    "m3ee_materialized_region_followup": ROOT
    / "docs"
    / "validation"
    / "return-to-form-fixed-geometry-materialized-region-followup-v1.json",
    "m3ed_claim_reduction": ROOT
    / "docs"
    / "validation"
    / "return-to-form-fixed-geometric-claim-reduction-v1.json",
    "model_card": ROOT / "web" / "public" / "model" / "model-card.json",
    "active_vocabulary_claim": ROOT / "docs" / "model" / "active-vocabulary-claim.json",
    "runner": Path(__file__).resolve(),
    **{f"{split}_manifest": path for split, path in MANIFESTS.items()},
}
COMMANDS_RUN = [
    "git status --short --branch",
    "git log -10 --oneline --decorate",
    "node scripts/audit_loop_premise.mjs --json",
    "node scripts/audit_return_to_form_plan.mjs --json",
    "node scripts/audit_no_pretrained_deps.mjs",
    "node scripts/audit_no_pretrained_artifact_json.mjs",
    "node scripts/audit_source_register.mjs",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json >/dev/null",
    "python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null",
    "python3 -m json.tool web/public/model/model-card.json >/dev/null",
    "python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null",
    "brev ls --json",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile "
    "scripts/run_return_to_form_fixed_geometry_materialized_region_model_input_diagnostic.py",
    "PYTHONDONTWRITEBYTECODE=1 .venv/bin/python "
    "scripts/run_return_to_form_fixed_geometry_materialized_region_model_input_diagnostic.py",
    "python3 -m json.tool "
    "docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json >/dev/null",
    "git diff --check",
]
REQUIRED_REGION_IDS = [
    "viewer_left_hand_context",
    "viewer_right_hand_context",
    "upper_body_signing_space",
    "head_context",
    "full_frame_reference",
]
ARM_DEFINITIONS = {
    "materialized_upper_body_head": ["upper_body_signing_space", "head_context"],
    "full_frame_reference": ["full_frame_reference"],
}
ALLOWED_NEXT_ACTIONS = {
    "continue_materialized_region_input_path_if_diagnostic_passes_no_brev",
    "escalate_model_input_strategy_research",
    "return_to_detector0_after_annotation_budget",
    "stop_reduced_claim",
    "stop_for_human_model_input_strategy_review",
    "stop_for_human_fixed_geometry_scope_review",
}


class ModelInputDiagnosticError(RuntimeError):
    """Raised when the M3EF diagnostic cannot produce valid evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--seed", type=int, default=20260528)
    parser.add_argument("--max-epochs", type=int, default=18)
    parser.add_argument("--batch-size", type=int, default=25)
    parser.add_argument("--spatial-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument("--device", choices=("cpu",), default="cpu")
    return parser.parse_args()


def project_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(ROOT).as_posix()
    except ValueError:
        return str(resolved)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    if not path.exists():
        raise ModelInputDiagnosticError(f"missing reference artifact: {project_relative(path)}")
    return {"path": project_relative(path), "sha256": sha256_file(path)}


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ModelInputDiagnosticError(f"missing JSON file: {project_relative(path)}") from error
    except json.JSONDecodeError as error:
        raise ModelInputDiagnosticError(f"invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(value, dict):
        raise ModelInputDiagnosticError(f"JSON root must be an object: {project_relative(path)}")
    return value


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def round_float(value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), 12)


def nested(data: dict[str, Any], path: list[str], context: str) -> Any:
    value: Any = data
    for key in path:
        if not isinstance(value, dict) or key not in value:
            raise ModelInputDiagnosticError(f"{context} missing {'.'.join(path)}")
        value = value[key]
    return value


def import_torch() -> Any:
    try:
        import torch  # type: ignore
    except Exception as error:  # noqa: BLE001 - include environment failure in receipt path.
        raise ModelInputDiagnosticError(f"could not import torch: {error}") from error
    return torch


def load_regions(torch: Any, tensor_path: Path, context: str) -> tuple[Any, list[str]]:
    try:
        loaded = torch.load(tensor_path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(tensor_path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - keep tensor path visible.
        raise ModelInputDiagnosticError(f"{context} could not load tensor payload {project_relative(tensor_path)}: {error}") from error
    if not isinstance(loaded, dict):
        raise ModelInputDiagnosticError(f"{context} tensor payload must be a dict")
    regions = loaded.get("rgb_regions")
    region_ids = loaded.get("region_ids")
    if not torch.is_tensor(regions):
        raise ModelInputDiagnosticError(f"{context} tensor payload missing rgb_regions")
    if not isinstance(region_ids, list) or not all(isinstance(item, str) for item in region_ids):
        raise ModelInputDiagnosticError(f"{context} tensor payload missing region_ids")
    if regions.ndim != 5 or int(regions.shape[-1]) != 3:
        raise ModelInputDiagnosticError(f"{context} rgb_regions must be T,R,H,W,C with 3 channels")
    return regions, [str(item) for item in region_ids]


def labels_for_manifest(manifest: dict[str, Any], context: str) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list) or not labels:
        raise ModelInputDiagnosticError(f"{context} labels must be a non-empty array")
    result = []
    for item in labels:
        if not isinstance(item, dict) or not isinstance(item.get("label_id"), str):
            raise ModelInputDiagnosticError(f"{context} labels must contain label_id strings")
        result.append(str(item["label_id"]))
    return result


def tensor_path_for_clip(clip: dict[str, Any], manifest_path: Path, context: str) -> Path:
    value = clip.get("relative_frame_tensor_path")
    if not isinstance(value, str):
        raise ModelInputDiagnosticError(f"{context} missing relative_frame_tensor_path")
    return (manifest_path.parent / value).resolve()


def expected_tensor_hash(clip: dict[str, Any], context: str) -> str:
    value = clip.get("frame_tensor_sha256")
    if not isinstance(value, str):
        raise ModelInputDiagnosticError(f"{context} missing frame_tensor_sha256")
    digest = value.strip().lower()
    if len(digest) != 64 or any(character not in "0123456789abcdef" for character in digest):
        raise ModelInputDiagnosticError(f"{context} frame_tensor_sha256 must be a SHA-256 digest")
    return digest


def prepare_split(
    torch: Any,
    manifest: dict[str, Any],
    manifest_path: Path,
    label_to_index: dict[str, int],
    region_ids_for_arm: list[str],
    spatial_size: int,
) -> tuple[Any, Any, dict[str, Any]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise ModelInputDiagnosticError(f"{project_relative(manifest_path)} clips must be an array")
    features = []
    targets = []
    label_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()
    tensor_hash_verified = 0
    shape_counts: Counter[str] = Counter()

    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise ModelInputDiagnosticError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
        clip_id = str(clip.get("clip_id"))
        label_id = str(clip.get("label_id"))
        if label_id not in label_to_index:
            raise ModelInputDiagnosticError(f"{project_relative(manifest_path)}:{clip_id} unknown label_id {label_id}")
        context = f"{project_relative(manifest_path)}:{clip_id}"
        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        actual_hash = sha256_file(tensor_path)
        if actual_hash != expected_tensor_hash(clip, context):
            raise ModelInputDiagnosticError(f"{context} tensor hash mismatch")
        tensor_hash_verified += 1
        regions, region_ids = load_regions(torch, tensor_path, context)
        if region_ids != REQUIRED_REGION_IDS:
            raise ModelInputDiagnosticError(f"{context} region order mismatch: {region_ids}")
        selected_indices = [region_ids.index(region_id) for region_id in region_ids_for_arm]
        selected = regions[:, selected_indices].to(dtype=torch.float32).div(255.0)
        time_count, region_count, height, width, channels = [int(value) for value in selected.shape]
        frames = selected.permute(0, 1, 4, 2, 3).reshape(time_count * region_count, channels, height, width)
        resized = torch.nn.functional.interpolate(
            frames,
            size=(spatial_size, spatial_size),
            mode="bilinear",
            align_corners=False,
        )
        transformed = resized.reshape(time_count, region_count, channels, spatial_size, spatial_size).contiguous()
        features.append(transformed)
        targets.append(label_to_index[label_id])
        label_counts[label_id] += 1
        source_counts[str(clip.get("source_id"))] += 1
        shape_counts["x".join(str(value) for value in transformed.shape)] += 1

    return (
        torch.stack(features, dim=0),
        torch.tensor(targets, dtype=torch.long),
        {
            "clip_count": len(clips),
            "label_counts": dict(sorted(label_counts.items())),
            "source_id_counts": dict(sorted(source_counts.items())),
            "tensor_hash_verified_count": tensor_hash_verified,
            "input_shape_counts": dict(sorted(shape_counts.items())),
        },
    )


def build_model(torch: Any, label_count: int) -> Any:
    class TinyRegionTemporalClassifier(torch.nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.encoder = torch.nn.Sequential(
                torch.nn.Conv2d(3, 8, kernel_size=3, padding=1),
                torch.nn.ReLU(),
                torch.nn.MaxPool2d(kernel_size=2),
                torch.nn.Conv2d(8, 16, kernel_size=3, padding=1),
                torch.nn.ReLU(),
                torch.nn.AdaptiveAvgPool2d((1, 1)),
            )
            self.classifier = torch.nn.Linear(16, label_count)

        def forward(self, inputs: Any) -> Any:
            batch, time_count, region_count, channels, height, width = [int(value) for value in inputs.shape]
            frames = inputs.reshape(batch * time_count * region_count, channels, height, width)
            encoded = self.encoder(frames).reshape(batch, time_count, region_count, 16)
            pooled = encoded.mean(dim=(1, 2))
            return self.classifier(pooled)

    return TinyRegionTemporalClassifier()


def parameter_count(model: Any) -> int:
    return int(sum(parameter.numel() for parameter in model.parameters()))


def evaluate(torch: Any, model: Any, loss_fn: Any, x: Any, y: Any, labels: list[str], batch_size: int) -> dict[str, Any]:
    model.eval()
    loss_sum = 0.0
    correct = 0
    confusion = [[0 for _ in labels] for _ in labels]
    prediction_counts = Counter()
    with torch.no_grad():
        for start in range(0, int(y.shape[0]), batch_size):
            batch_x = x[start : start + batch_size]
            batch_y = y[start : start + batch_size]
            logits = model(batch_x)
            loss = loss_fn(logits, batch_y)
            predictions = logits.argmax(dim=1)
            loss_sum += float(loss.item()) * int(batch_y.shape[0])
            correct += int((predictions == batch_y).sum().item())
            for true_index, predicted_index in zip(batch_y.tolist(), predictions.tolist(), strict=True):
                confusion[int(true_index)][int(predicted_index)] += 1
                prediction_counts[labels[int(predicted_index)]] += 1
    per_label_recall = {}
    recalls = []
    for index, label in enumerate(labels):
        total = sum(confusion[index])
        recall = confusion[index][index] / total if total else 0.0
        per_label_recall[label] = round_float(recall)
        recalls.append(recall)
    total_count = int(y.shape[0])
    return {
        "loss": round_float(loss_sum / total_count if total_count else None),
        "top1": round_float(correct / total_count if total_count else None),
        "macro_recall": round_float(sum(recalls) / len(recalls) if recalls else None),
        "per_label_recall": per_label_recall,
        "prediction_distribution": dict(sorted(prediction_counts.items())),
        "confusion_matrix": {
            "labels": labels,
            "rows_true_columns_predicted": confusion,
        },
    }


def train_arm(
    torch: Any,
    arm_id: str,
    datasets: dict[str, tuple[Any, Any, dict[str, Any]]],
    labels: list[str],
    args: argparse.Namespace,
) -> dict[str, Any]:
    torch.manual_seed(args.seed)
    model = build_model(torch, len(labels))
    loss_fn = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.learning_rate)
    train_x, train_y, train_summary = datasets["train"]
    initial_train = evaluate(torch, model, loss_fn, train_x, train_y, labels, args.batch_size)
    epoch_losses = []

    generator = torch.Generator()
    generator.manual_seed(args.seed)
    for _epoch in range(args.max_epochs):
        model.train()
        permutation = torch.randperm(int(train_y.shape[0]), generator=generator)
        epoch_loss_sum = 0.0
        for start in range(0, int(train_y.shape[0]), args.batch_size):
            indices = permutation[start : start + args.batch_size]
            batch_x = train_x[indices]
            batch_y = train_y[indices]
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(model(batch_x), batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss_sum += float(loss.item()) * int(batch_y.shape[0])
        epoch_losses.append(round_float(epoch_loss_sum / int(train_y.shape[0])))

    final_metrics = {
        split: evaluate(torch, model, loss_fn, split_x, split_y, labels, args.batch_size)
        for split, (split_x, split_y, _summary) in datasets.items()
    }
    initial_loss = initial_train["loss"]
    final_train_loss = final_metrics["train"]["loss"]
    loss_drop_fraction = None
    if initial_loss is not None and final_train_loss is not None and initial_loss:
        loss_drop_fraction = (float(initial_loss) - float(final_train_loss)) / float(initial_loss)
    train_top1 = final_metrics["train"]["top1"] or 0.0
    chance_top1 = 1.0 / len(labels)
    train_sanity_passed = bool(
        loss_drop_fraction is not None and loss_drop_fraction >= 0.1 and train_top1 >= chance_top1 + 0.1
    )
    return {
        "arm_id": arm_id,
        "regions": ARM_DEFINITIONS[arm_id],
        "model": {
            "family": "tiny_region_temporal_classifier",
            "random_initialization": True,
            "pretrained_components": [],
            "parameter_count": parameter_count(model),
            "checkpoint_saved": False,
            "model_artifact_saved": False,
        },
        "train_cap": {
            "seed": args.seed,
            "max_epochs": args.max_epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "spatial_size": args.spatial_size,
            "device": args.device,
        },
        "input_summary": {
            split: summary for split, (_x, _y, summary) in datasets.items()
        },
        "loss_movement": {
            "initial_train_loss": initial_loss,
            "final_train_loss": final_train_loss,
            "loss_drop_fraction_initial_to_final": round_float(loss_drop_fraction),
            "epoch_train_losses": epoch_losses,
        },
        "train_sanity": {
            "passed": train_sanity_passed,
            "chance_top1": round_float(chance_top1),
            "final_train_top1": final_metrics["train"]["top1"],
            "final_train_macro_recall": final_metrics["train"]["macro_recall"],
        },
        "metrics": final_metrics,
    }


def compare_arms(arms: dict[str, dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    candidate = arms["materialized_upper_body_head"]
    baseline = arms["full_frame_reference"]
    chance_top1 = 1.0 / len(labels)
    candidate_validation = float(candidate["metrics"]["validation"]["top1"] or 0.0)
    candidate_test = float(candidate["metrics"]["test"]["top1"] or 0.0)
    baseline_validation = float(baseline["metrics"]["validation"]["top1"] or 0.0)
    baseline_test = float(baseline["metrics"]["test"]["top1"] or 0.0)
    candidate_train_sanity = bool(candidate["train_sanity"]["passed"])
    baseline_train_sanity = bool(baseline["train_sanity"]["passed"])
    candidate_not_materially_worse = candidate_validation >= baseline_validation - 0.05 and candidate_test >= baseline_test - 0.05
    candidate_above_chance = candidate_validation >= chance_top1 + 0.05 or candidate_test >= chance_top1 + 0.05
    diagnostic_passed = candidate_train_sanity and candidate_above_chance and candidate_not_materially_worse
    if diagnostic_passed:
        classification = "materialized_region_input_path_has_bounded_signal"
        next_action = "continue_materialized_region_input_path_if_diagnostic_passes_no_brev"
        reason = (
            "The materialized upper-body/head arm passed train sanity, exceeded chance on a held-out split, "
            "and was not materially worse than the full-frame baseline under the shared cap."
        )
    else:
        classification = "materialized_region_input_signal_not_clear_enough"
        next_action = "escalate_model_input_strategy_research"
        reason = (
            "The bounded local diagnostic did not show a clear materialized-region advantage strong enough to justify "
            "another training-style retry without strategy review."
        )
    return {
        "classification": classification,
        "next_action": next_action,
        "reason": reason,
        "chance_top1": round_float(chance_top1),
        "candidate_train_sanity_passed": candidate_train_sanity,
        "baseline_train_sanity_passed": baseline_train_sanity,
        "candidate_validation_top1": round_float(candidate_validation),
        "baseline_validation_top1": round_float(baseline_validation),
        "candidate_test_top1": round_float(candidate_test),
        "baseline_test_top1": round_float(baseline_test),
        "candidate_validation_minus_baseline": round_float(candidate_validation - baseline_validation),
        "candidate_test_minus_baseline": round_float(candidate_test - baseline_test),
        "candidate_not_materially_worse_than_full_frame": candidate_not_materially_worse,
        "candidate_above_chance": candidate_above_chance,
    }


def main() -> int:
    args = parse_args()
    if args.max_epochs <= 0 or args.batch_size <= 0 or args.spatial_size <= 0:
        raise ModelInputDiagnosticError("max-epochs, batch-size, and spatial-size must be positive")
    torch = import_torch()
    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))
    torch.use_deterministic_algorithms(True)

    m3ee = read_json(REFERENCE_PATHS["m3ee_materialized_region_followup"])
    m3ed = read_json(REFERENCE_PATHS["m3ed_claim_reduction"])
    model_card = read_json(REFERENCE_PATHS["model_card"])
    active_vocabulary = read_json(REFERENCE_PATHS["active_vocabulary_claim"])
    if nested(m3ee, ["next_action", "id"], "M3EE receipt") != "materialized_region_model_input_diagnostic_no_brev":
        raise ModelInputDiagnosticError("M3EE receipt does not select materialized_region_model_input_diagnostic_no_brev")
    if nested(m3ed, ["claim_reduction", "exact_m3eb_primary_roi", "allowed_claims"], "M3ED receipt") is None:
        raise ModelInputDiagnosticError("M3ED reduced exact ROI claim is missing")

    manifests = {split: read_json(path) for split, path in MANIFESTS.items()}
    labels = labels_for_manifest(manifests["train"], "train manifest")
    for split, manifest in manifests.items():
        if labels_for_manifest(manifest, f"{split} manifest") != labels:
            raise ModelInputDiagnosticError(f"{split} labels differ from train labels")
    label_to_index = {label: index for index, label in enumerate(labels)}
    split_label_counts = {
        split: dict(sorted(Counter(str(clip.get("label_id")) for clip in manifest["clips"]).items()))
        for split, manifest in manifests.items()
    }

    arm_results: dict[str, dict[str, Any]] = {}
    for arm_id, region_ids in ARM_DEFINITIONS.items():
        datasets = {
            split: prepare_split(torch, manifest, MANIFESTS[split], label_to_index, region_ids, args.spatial_size)
            for split, manifest in manifests.items()
        }
        arm_results[arm_id] = train_arm(torch, arm_id, datasets, labels, args)

    comparison = compare_arms(arm_results, labels)
    next_action = comparison["next_action"]
    if next_action not in ALLOWED_NEXT_ACTIONS:
        raise ModelInputDiagnosticError(f"internal next action is not allowed: {next_action}")

    report = {
        "schema_version": SCHEMA_VERSION,
        "status": "action_selected",
        "checked_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": "M3EF - Fixed-geometry materialized-region model-input diagnostic",
        "active_prompt": project_relative(ACTIVE_PROMPT),
        "command": " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv]),
        "commands_run": COMMANDS_RUN,
        "commands_intentionally_not_run": [
            "No Brev worker creation, sync, SSH, remote compute, remote training, stop, delete, reset, or spend.",
            "No source import, source-register mutation, media download, manifest mutation, tracked tensor mutation, vocabulary mutation, label expansion, or packet-row mutation.",
            "No hand-landmark source import or landmark detector training.",
            "No broad recognizer retraining, architecture search, hyperparameter sweep, repeated rerun, checkpoint/promoted model artifact, ONNX export, browser recognition activation, product runtime change, final readiness claim, ASL correctness claim, raw learner video upload, or push.",
            "No exact-M3EB-ROI unqualified interaction-preserving model-input claim and no pretrained/generated-label path.",
        ],
        "source_artifacts": {name: file_ref(path) for name, path in REFERENCE_PATHS.items()},
        "files_changed": [
            "scripts/run_return_to_form_fixed_geometry_materialized_region_model_input_diagnostic.py",
            project_relative(args.output),
            SESSION_LOG,
        ],
        "diagnostic_scope": {
            "one_training_or_fitting_command": True,
            "command_cap": {
                "seed": args.seed,
                "max_epochs": args.max_epochs,
                "batch_size": args.batch_size,
                "learning_rate": args.learning_rate,
                "spatial_size": args.spatial_size,
                "device": args.device,
            },
            "labels": labels,
            "split_label_counts": split_label_counts,
            "arms": ARM_DEFINITIONS,
            "same_labels_splits_seed_cap_and_reporting_schema": True,
            "current_approved_manifests_and_tensors_only": True,
        },
        "random_init_no_artifact_proof": {
            "torch_manual_seed": args.seed,
            "model_family": "tiny_region_temporal_classifier",
            "pretrained_components": [],
            "checkpoint_loaded": False,
            "checkpoint_saved": False,
            "model_artifact_saved": False,
            "onnx_exported": False,
            "browser_asset_written": False,
            "model_card_updated": False,
            "active_vocabulary_updated": False,
            "product_runtime_changed": False,
        },
        "arm_results": arm_results,
        "baseline_comparison": comparison,
        "claim_boundaries": {
            "exact_m3eb_roi": {
                "status": "reduced_claim_preserved",
                "may_claim": "deterministic diagnostic/accounting geometry only",
                "must_not_claim": "unqualified interaction-preserving model input or product authority",
            },
            "current_product_claim_surface": {
                "model_card_status": model_card.get("status"),
                "active_labels": active_vocabulary.get("activeLabels"),
                "browser_recognition": "fail_closed_inactive",
                "claim_surface_mutated": False,
            },
        },
        "boundaries": {
            "local_only": True,
            "brev_lifecycle_or_spend": False,
            "remote_compute": False,
            "source_import": False,
            "source_register_mutation": False,
            "media_download": False,
            "manifest_mutation": False,
            "tracked_tensor_mutation": False,
            "vocabulary_mutation": False,
            "label_expansion": False,
            "packet_row_mutation": False,
            "hand_landmark_training": False,
            "pretrained_or_generated_label_path": False,
            "checkpoint_or_model_artifact": False,
            "onnx_export": False,
            "browser_activation": False,
            "model_card_mutation": False,
            "active_vocabulary_mutation": False,
            "product_runtime_change": False,
            "final_readiness_claim": False,
            "push": False,
        },
        "outcome": {
            "classification": comparison["classification"],
            "next_action": next_action,
            "reason": comparison["reason"],
        },
        "next_action": {
            "id": next_action,
            "reason": comparison["reason"],
        },
    }
    write_json(args.output.resolve(), report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "output": project_relative(args.output),
                "classification": comparison["classification"],
                "next_action": next_action,
                "candidate_validation_top1": comparison["candidate_validation_top1"],
                "baseline_validation_top1": comparison["baseline_validation_top1"],
                "candidate_test_top1": comparison["candidate_test_top1"],
                "baseline_test_top1": comparison["baseline_test_top1"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ModelInputDiagnosticError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
