#!/usr/bin/env python3
"""Generate retained raw-frame tensor visual and statistical diagnostics.

This is a pre-training/evaluation diagnostic. It reads the same manifest tensor
paths as the trainer, runs the same frame preparation function used by
training/evaluation, and writes contact sheets for sampled labels. It does not
train, evaluate, calibrate, export, or mutate model artifacts.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from train_rawframe_model import (
    TrainingError,
    expected_tensor_hash_for_clip,
    import_torch,
    load_tensor_file_with_contract,
    prepare_frames,
    tensor_path_for_clip,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-rawframe-tensor-visual-diagnostic/v1"
DEFAULT_MANIFESTS = {
    "train": Path("data/manifests/train.json"),
    "validation": Path("data/manifests/validation.json"),
    "test": Path("data/manifests/test.json"),
}
DEFAULT_FAILURE_ANALYSIS = Path("docs/validation/rawframe-model-failure-analysis.json")
DEFAULT_OUTPUT = Path("docs/validation/rawframe-tensor-visual-diagnostic.json")
DEFAULT_SHEET_DIR = Path("docs/validation/rawframe-tensor-visual-contact-sheets")
SUPPORTING_REFERENCE_PATHS = (
    Path("docs/model/dataset-source-register.json"),
    Path("docs/research/return-to-form-tier0-source-coverage.json"),
    Path("docs/model/return-to-form-fixed-crop-config.json"),
    Path("docs/validation/return-to-form-tier0-gates.json"),
    Path("docs/validation/return-to-form-tier0-decode-dataloader.json"),
)
PRIORITY_ZERO_RECALL_LABELS = ("apple", "before", "red", "water")


class DiagnosticError(RuntimeError):
    """Raised when tensor visual diagnostics cannot be generated."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Sample raw-frame tensors from train/validation/test manifests, run "
            "the same preprocessing as training/evaluation, and retain contact "
            "sheets plus machine-readable statistics."
        )
    )
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--failure-analysis", type=Path, default=DEFAULT_FAILURE_ANALYSIS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--sheet-dir", type=Path, default=DEFAULT_SHEET_DIR)
    parser.add_argument("--label", action="append", dest="labels", default=[])
    parser.add_argument("--max-zero-recall-labels", type=int, default=8)
    parser.add_argument("--include-top-recall-labels", type=int, default=4)
    parser.add_argument("--samples-per-label-split", type=int, default=2)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--write", action="store_true")
    return parser.parse_args()


def resolve_project_path(path: Path, context: str) -> Path:
    resolved = (PROJECT_ROOT / path).resolve() if not path.is_absolute() else path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DiagnosticError(f"{context} escapes project root: {path}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise DiagnosticError(f"Missing JSON file: {project_relative(path)}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DiagnosticError(f"Invalid JSON file: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise DiagnosticError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_ref(path: Path) -> dict[str, str]:
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def tensor_shape(torch: Any, value: Any) -> list[int] | None:
    if torch.is_tensor(value):
        return [int(dimension) for dimension in value.shape]
    return None


def failure_metrics_by_label(failure_analysis: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    metrics = failure_analysis.get("metrics")
    if not isinstance(metrics, dict):
        return result
    for split, split_metrics in metrics.items():
        if not isinstance(split_metrics, dict):
            continue
        for item in split_metrics.get("per_label", []):
            if not isinstance(item, dict):
                continue
            label_id = item.get("label_id")
            if not isinstance(label_id, str):
                continue
            result.setdefault(label_id, {})[str(split)] = {
                "support": item.get("support"),
                "recall": item.get("recall"),
                "precision": item.get("precision"),
                "f1": item.get("f1"),
                "true_positive": item.get("true_positive"),
            }
    return result


def label_failure_observation(label_id: str, split_metrics: dict[str, Any]) -> str:
    train = split_metrics.get("train") if isinstance(split_metrics.get("train"), dict) else {}
    validation = split_metrics.get("validation") if isinstance(split_metrics.get("validation"), dict) else {}
    train_recall = train.get("recall")
    validation_recall = validation.get("recall")
    if train_recall == 0 and validation_recall == 0:
        return f"{label_id} had zero train and validation recall in the M3AE smoke."
    if train_recall == 0:
        return f"{label_id} had zero train recall in the M3AE smoke."
    if validation_recall == 0:
        return f"{label_id} had zero validation recall in the M3AE smoke."
    return f"{label_id} retained non-zero recall in the M3AE smoke and is used as a comparison label."


def supporting_references() -> dict[str, dict[str, str]]:
    refs = {}
    for relative_path in SUPPORTING_REFERENCE_PATHS:
        path = PROJECT_ROOT / relative_path
        if path.exists():
            refs[relative_path.as_posix()] = file_ref(path)
    return refs


def iter_tensor_contracts(label_reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    contracts = []
    for label_report in label_reports:
        for split_report in label_report.get("splits", []):
            for sample in split_report.get("samples", []):
                tensor = sample.get("tensor", {})
                contract = tensor.get("payload_contract")
                if isinstance(contract, dict):
                    contracts.append(contract)
    return contracts


def summarize_tensor_contract(label_reports: list[dict[str, Any]]) -> dict[str, Any]:
    contracts = iter_tensor_contracts(label_reports)
    consumed_keys = sorted({
        str(contract.get("training_loader", {}).get("consumed_key"))
        for contract in contracts
        if contract.get("training_loader", {}).get("consumed_key") is not None
    })
    rgb_regions_present_count = sum(1 for contract in contracts if contract.get("rgb_regions_present"))
    rgb_frames_present_count = sum(1 for contract in contracts if contract.get("rgb_frames_present"))
    rgb_frames_region_ids = sorted({
        str(contract.get("rgb_frames_region_id"))
        for contract in contracts
        if contract.get("rgb_frames_region_id")
    })
    matching_region_slice_count = sum(
        1
        for contract in contracts
        if contract.get("rgb_frames_matches_region_slice") is True
    )
    rgb_regions_consumed = any(
        contract.get("training_loader", {}).get("consumed_key") == "rgb_regions"
        for contract in contracts
    )
    mismatch = (
        bool(contracts)
        and rgb_regions_present_count == len(contracts)
        and not rgb_regions_consumed
        and consumed_keys == ["rgb_frames"]
    )
    return {
        "sample_count": len(contracts),
        "training_loader": {
            "source": "scripts/train_rawframe_model.py::load_tensor_file",
            "accepted_tensor_keys_in_order": ["frames", "tensor", "rgb_frames"],
            "rgb_regions_in_loader_key_order": False,
            "observed_consumed_keys": consumed_keys,
            "rgb_regions_consumed_by_training": rgb_regions_consumed,
        },
        "observed_payloads": {
            "rgb_regions_present_count": rgb_regions_present_count,
            "rgb_frames_present_count": rgb_frames_present_count,
            "rgb_frames_region_ids": rgb_frames_region_ids,
            "rgb_frames_matches_region_slice_count": matching_region_slice_count,
        },
        "mismatch_detected": mismatch,
        "interpretation": (
            "RawFrameClipDataset consumes the rgb_frames compatibility tensor while "
            "rgb_regions remains present but unused by the M3AE training/evaluation path."
            if mismatch
            else "No rgb_regions/rgb_frames consumption mismatch was proven by sampled payloads."
        ),
    }


def classify_failure(
    tensor_contract: dict[str, Any],
    blockers: list[str],
    warnings: list[str],
    contact_sheets_written: bool,
) -> dict[str, Any]:
    if blockers:
        return {
            "likely_failure_class": "inconclusive",
            "confidence": "medium",
            "rationale": [
                "The diagnostic encountered blockers before it could cleanly classify the failure surface.",
                *blockers[:5],
            ],
            "next_action": "Resolve diagnostic blockers, then rerun the tensor/contact-sheet diagnostic before another training smoke.",
        }
    if tensor_contract.get("mismatch_detected"):
        return {
            "likely_failure_class": "tensor_payload_preprocessing",
            "confidence": "high",
            "rationale": [
                "M3AD tensor payloads include rgb_regions fixed-crop stacks.",
                "The M3AE RawFrameClipDataset loader does not look for rgb_regions and instead consumes rgb_frames.",
                "The sampled rgb_frames tensors are the upper_body_signing_space compatibility slice, so the model did not consume the full fixed-region stack.",
            ],
            "crop_error_stop_rule": {
                "threshold": 0.15,
                "status": "not_adjudicated_after_first_concrete_tensor_contract_failure",
                "contact_sheets_written": contact_sheets_written,
                "automated_warning_count": len(warnings),
            },
            "next_action": (
                "Fix the training/evaluation tensor contract so M3AE consumes the intended rgb_regions fixed-crop stack "
                "or an explicitly region-aware derived input before any additional smoke training."
            ),
        }
    if warnings:
        return {
            "likely_failure_class": "crop_region_coverage",
            "confidence": "low",
            "rationale": [
                "No tensor payload mismatch was proven, but sampled tensors produced visual/statistical warnings.",
                *warnings[:5],
            ],
            "next_action": "Review contact sheets and revise crop config/manifests if more than 15 percent of reviewed crops per label are misaligned.",
        }
    return {
        "likely_failure_class": "model_architecture_fit",
        "confidence": "low",
        "rationale": [
            "Sampled tensors did not show gross hash, value-range, contrast, temporal, or tensor-contract blockers.",
            "A bounded architecture microprobe is only appropriate after explicit visual crop review confirms the sheets are aligned.",
        ],
        "next_action": "Run an architecture-bounded microprobe only after crop/contact-sheet review confirms the fixed crops are acceptable.",
    }


def select_labels(args: argparse.Namespace, failure_analysis: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
    explicit = [label.strip() for label in args.labels if label and label.strip()]
    if explicit:
        return sorted(dict.fromkeys(explicit)), {
            "mode": "explicit",
            "explicit_labels": sorted(dict.fromkeys(explicit)),
        }

    validation_zero = set(
        failure_analysis
        .get("validation_summary", {})
        .get("recall_coverage", {})
        .get("zero_recall_labels", [])
    )
    test_zero = set(
        failure_analysis
        .get("test_summary", {})
        .get("recall_coverage", {})
        .get("zero_recall_labels", [])
    )
    zero_both = sorted(validation_zero & test_zero)
    selected_zero: list[str] = []
    for label in PRIORITY_ZERO_RECALL_LABELS:
        if label in zero_both and label not in selected_zero:
            selected_zero.append(label)
    for label in zero_both:
        if len(selected_zero) >= args.max_zero_recall_labels:
            break
        if label not in selected_zero:
            selected_zero.append(label)

    comparison_labels = []
    for item in failure_analysis.get("validation_summary", {}).get("top_recall_labels", []):
        label = item.get("label") if isinstance(item, dict) else None
        if (
            isinstance(label, str)
            and label not in selected_zero
            and label not in comparison_labels
        ):
            comparison_labels.append(label)
        if len(comparison_labels) >= args.include_top_recall_labels:
            break

    labels = selected_zero + comparison_labels
    if not labels:
        raise DiagnosticError("Could not select labels from failure analysis; pass --label explicitly")
    return labels, {
        "mode": "failure_analysis_default",
        "zero_recall_in_validation_and_test_count": len(zero_both),
        "selected_zero_recall_labels": selected_zero,
        "selected_comparison_labels": comparison_labels,
    }


def manifest_clip_index(manifest: dict[str, Any], manifest_path: Path) -> dict[str, list[dict[str, Any]]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise DiagnosticError(f"{project_relative(manifest_path)} clips must be an array")
    by_label: dict[str, list[dict[str, Any]]] = {}
    for clip in clips:
        if not isinstance(clip, dict):
            continue
        label = clip.get("label_id")
        if isinstance(label, str):
            by_label.setdefault(label, []).append(clip)
    for label_clips in by_label.values():
        label_clips.sort(key=lambda clip: str(clip.get("clip_id", "")))
    return by_label


def tensor_to_image(torch: Any, frame: Any) -> Image.Image:
    frame = frame.detach().cpu().clamp(0.0, 1.0)
    array = (frame.permute(1, 2, 0).numpy() * 255.0).round().astype("uint8")
    return Image.fromarray(array, mode="RGB")


def choose_preview_indices(frame_count: int) -> list[int]:
    if frame_count <= 1:
        return [0]
    candidates = [0, round((frame_count - 1) / 3), round((frame_count - 1) * 2 / 3), frame_count - 1]
    return list(dict.fromkeys(int(index) for index in candidates))


def sample_tensor(
    torch: Any,
    manifest_path: Path,
    clip: dict[str, Any],
    frame_count: int,
    image_size: int,
) -> tuple[dict[str, Any], Any]:
    context = f"{manifest_path}: clip {clip.get('clip_id', '<unknown>')}"
    tensor_path = tensor_path_for_clip(clip, manifest_path, context)
    expected_hash = expected_tensor_hash_for_clip(clip, context)
    actual_hash = sha256_file(tensor_path)
    if actual_hash != expected_hash:
        raise DiagnosticError(
            f"{context} tensor hash mismatch for {project_relative(tensor_path)}; "
            f"expected {expected_hash}, got {actual_hash}"
        )
    loaded, payload_contract = load_tensor_file_with_contract(torch, tensor_path)
    prepared = prepare_frames(
        torch,
        loaded,
        frame_count=frame_count,
        image_size=image_size,
        context=context,
    )
    prepared = prepared.detach().cpu()
    temporal_delta = (
        (prepared[1:] - prepared[:-1]).abs().mean().item()
        if int(prepared.shape[0]) > 1
        else 0.0
    )
    channel_mean = prepared.mean(dim=(0, 2, 3)).tolist()
    channel_std = prepared.std(dim=(0, 2, 3), unbiased=False).tolist()
    prepared_std = float(prepared.std(unbiased=False).item())
    stats = {
        "clip_id": clip.get("clip_id"),
        "label_id": clip.get("label_id"),
        "source_split": clip.get("source_split"),
        "signer_id": clip.get("signer_id"),
        "source_video_path": clip.get("source_video_path") or clip.get("relative_video_path"),
        "tensor": {
            "path": project_relative(tensor_path),
            "sha256": actual_hash,
            "raw_shape": list(loaded.shape),
            "prepared_shape": list(prepared.shape),
            "prepared_min": float(prepared.min().item()),
            "prepared_max": float(prepared.max().item()),
            "prepared_mean": float(prepared.mean().item()),
            "prepared_std": prepared_std,
            "per_channel_mean": [float(value) for value in channel_mean],
            "per_channel_std": [float(value) for value in channel_std],
            "temporal_abs_delta_mean": float(temporal_delta),
            "payload_contract": payload_contract,
        },
    }
    return stats, prepared


def draw_contact_sheet(
    torch: Any,
    sheet_path: Path,
    label: str,
    samples: list[dict[str, Any]],
    frame_count: int,
    image_size: int,
) -> None:
    preview_indices = choose_preview_indices(frame_count)
    margin = 12
    gap = 8
    text_width = 250
    frame_w = image_size
    frame_h = image_size
    header_h = 34
    row_h = frame_h + 34
    width = margin * 2 + text_width + len(preview_indices) * frame_w + (len(preview_indices) - 1) * gap
    height = margin * 2 + header_h + max(1, len(samples)) * row_h
    sheet = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((margin, margin), f"Raw-frame tensor contact sheet: {label}", fill=(0, 0, 0), font=font)
    draw.text(
        (margin + text_width, margin),
        "frames " + ", ".join(str(index) for index in preview_indices),
        fill=(60, 60, 60),
        font=font,
    )
    y = margin + header_h
    for sample in samples:
        stats = sample["stats"]
        prepared = sample["prepared"]
        split = sample["split"]
        label_text = (
            f"{split} | {stats['clip_id']}\n"
            f"mean={stats['tensor']['prepared_mean']:.3f} "
            f"std={stats['tensor']['prepared_std']:.3f} "
            f"delta={stats['tensor']['temporal_abs_delta_mean']:.3f}"
        )
        draw.text((margin, y + 4), label_text, fill=(0, 0, 0), font=font)
        x = margin + text_width
        for index in preview_indices:
            image = tensor_to_image(torch, prepared[index])
            sheet.paste(image, (x, y))
            draw.rectangle((x, y, x + frame_w - 1, y + frame_h - 1), outline=(190, 190, 190))
            x += frame_w + gap
        y += row_h
    sheet_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(sheet_path)


def build_diagnostic(args: argparse.Namespace) -> dict[str, Any]:
    if args.max_zero_recall_labels < 0:
        raise DiagnosticError("--max-zero-recall-labels must be nonnegative")
    if args.include_top_recall_labels < 0:
        raise DiagnosticError("--include-top-recall-labels must be nonnegative")
    if args.samples_per_label_split < 1:
        raise DiagnosticError("--samples-per-label-split must be at least 1")
    if args.frame_count < 1:
        raise DiagnosticError("--frame-count must be at least 1")
    if args.image_size < 16:
        raise DiagnosticError("--image-size must be at least 16")

    torch = import_torch()
    manifest_paths = {
        "train": resolve_project_path(args.train_manifest, "--train-manifest"),
        "validation": resolve_project_path(args.validation_manifest, "--validation-manifest"),
        "test": resolve_project_path(args.test_manifest, "--test-manifest"),
    }
    failure_analysis_path = resolve_project_path(args.failure_analysis, "--failure-analysis")
    output_path = resolve_project_path(args.output, "--output")
    sheet_dir = resolve_project_path(args.sheet_dir, "--sheet-dir")
    failure_analysis = read_json(failure_analysis_path)
    labels, label_selection = select_labels(args, failure_analysis)
    failure_metrics = failure_metrics_by_label(failure_analysis)
    manifests = {
        split: read_json(manifest_path)
        for split, manifest_path in manifest_paths.items()
    }
    by_split_label = {
        split: manifest_clip_index(manifest, manifest_paths[split])
        for split, manifest in manifests.items()
    }

    blockers: list[str] = []
    warnings: list[str] = []
    label_reports = []
    sheet_refs = []
    for label in labels:
        sheet_samples = []
        split_reports = []
        for split, manifest_path in manifest_paths.items():
            clips = by_split_label[split].get(label, [])
            if not clips:
                blockers.append(f"{split} manifest has no clips for selected label {label}")
                split_reports.append({"split": split, "samples": []})
                continue
            samples = []
            for clip in clips[: args.samples_per_label_split]:
                try:
                    stats, prepared = sample_tensor(
                        torch,
                        manifest_path,
                        clip,
                        args.frame_count,
                        args.image_size,
                    )
                except (DiagnosticError, TrainingError) as error:
                    blockers.append(str(error))
                    continue
                tensor_stats = stats["tensor"]
                if tensor_stats["prepared_std"] < 0.02:
                    warnings.append(f"{split}/{label}/{stats['clip_id']} has low prepared tensor contrast")
                if tensor_stats["temporal_abs_delta_mean"] < 0.001:
                    warnings.append(f"{split}/{label}/{stats['clip_id']} has near-static sampled frames")
                samples.append(stats)
                sheet_samples.append({"split": split, "stats": stats, "prepared": prepared})
            split_reports.append({"split": split, "samples": samples})
        sheet_path = sheet_dir / f"{label}.png"
        if args.write and sheet_samples:
            draw_contact_sheet(
                torch,
                sheet_path,
                label,
                sheet_samples,
                args.frame_count,
                args.image_size,
            )
            sheet_refs.append(file_ref(sheet_path))
        else:
            sheet_refs.append({"path": project_relative(sheet_path)})
        label_metrics = failure_metrics.get(label, {})
        label_reports.append({
            "label_id": label,
            "contact_sheet": project_relative(sheet_path),
            "m3ae_failure_metrics": label_metrics,
            "failure_observation": label_failure_observation(label, label_metrics),
            "splits": split_reports,
        })

    tensor_contract = summarize_tensor_contract(label_reports)
    failure_classification = classify_failure(tensor_contract, blockers, warnings, args.write)
    status = (
        "attention_required"
        if blockers or tensor_contract.get("mismatch_detected")
        else "passed_with_warnings" if warnings
        else "passed_no_gross_tensor_issue"
    )
    return {
        "schema_version": SCHEMA_VERSION,
        "status": status,
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": sys.executable,
            "command": [sys.executable, *sys.argv],
            "script": file_ref(Path(__file__)),
        },
        "inputs": {
            "manifests": {split: file_ref(path) for split, path in manifest_paths.items()},
            "failure_analysis": file_ref(failure_analysis_path),
            "supporting_references": supporting_references(),
        },
        "configuration": {
            "samples_per_label_split": args.samples_per_label_split,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "contact_sheet_dir": project_relative(sheet_dir),
            "label_selection": label_selection,
        },
        "summary": {
            "labels_inspected": labels,
            "label_count": len(labels),
            "sampled_splits": sorted(manifest_paths),
            "sample_count": sum(
                len(split_report["samples"])
                for label_report in label_reports
                for split_report in label_report["splits"]
            ),
            "contact_sheets": sheet_refs,
            "blocker_count": len(blockers),
            "warning_count": len(warnings),
        },
        "blockers": blockers,
        "warnings": warnings,
        "tensor_contract": tensor_contract,
        "failure_classification": failure_classification,
        "labels": label_reports,
        "interpretation": [
            "This diagnostic checks tensor hashes, shapes, value ranges, preprocessing output, and retained contact sheets for sampled train/validation/test clips.",
            "It is not final model evidence and does not prove label correctness or source adequacy.",
            "A pass means the inspected samples did not show a gross tensor-path, crop, blank-frame, or value-range problem detectable by this script.",
        ],
    }


def main() -> int:
    args = parse_args()
    diagnostic = build_diagnostic(args)
    output_path = resolve_project_path(args.output, "--output")
    if args.write:
        write_json(output_path, diagnostic)
    print(json.dumps({
        "status": diagnostic["status"],
        "wrote": args.write,
        "output": project_relative(output_path),
        "label_count": diagnostic["summary"]["label_count"],
        "sample_count": diagnostic["summary"]["sample_count"],
        "blocker_count": diagnostic["summary"]["blocker_count"],
        "warning_count": diagnostic["summary"]["warning_count"],
        "contact_sheet_dir": diagnostic["configuration"]["contact_sheet_dir"],
    }, indent=2, sort_keys=True))
    return 2 if diagnostic["blockers"] else 0


try:
    raise SystemExit(main())
except (DiagnosticError, TrainingError) as error:
    print(f"Raw-frame tensor visual diagnostic failed: {error}", file=sys.stderr)
    raise SystemExit(2) from error
