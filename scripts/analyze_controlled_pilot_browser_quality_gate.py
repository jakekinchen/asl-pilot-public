#!/usr/bin/env python3
"""Measure the browser-local quality gate against retained prediction sidecars."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    TrainingError,
    load_tensor_file,
    prepare_frames,
    tensor_path_for_clip,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SIDECAR = Path("artifacts/rawframe-model/controlled-pilot-prediction-sidecar.json")
DEFAULT_VALIDATION_MANIFEST = Path("data/manifests/validation.json")
DEFAULT_TEST_MANIFEST = Path("data/manifests/test.json")
DEFAULT_CHALLENGE_MANIFEST = Path("data/manifests/negative-challenge.json")
DEFAULT_OUTPUT = Path("docs/validation/controlled-pilot-browser-quality-gate-diagnostic.json")
LUMA_MIN = 35.0
CONTRAST_MIN = 12.0
USABLE_FRAME_LUMA_MIN = 10.0


class DiagnosticError(RuntimeError):
    """Raised when the diagnostic cannot be computed."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Simulate the browser evaluateLocalAttempt() luma/contrast quality "
            "gate on retained validation/test/negative prediction examples."
        )
    )
    parser.add_argument("--prediction-sidecar", type=Path, default=DEFAULT_SIDECAR)
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_VALIDATION_MANIFEST)
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_TEST_MANIFEST)
    parser.add_argument("--challenge-manifest", type=Path, default=DEFAULT_CHALLENGE_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--write", action="store_true")
    return parser.parse_args()


def resolve_project_path(value: Path, context: str, must_exist: bool = True) -> Path:
    resolved = value.resolve() if value.is_absolute() else (PROJECT_ROOT / value).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DiagnosticError(f"{context} escapes project root: {value}") from error
    if must_exist and not resolved.exists():
        raise DiagnosticError(f"{context} does not exist: {project_relative(resolved)}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DiagnosticError(f"Invalid JSON: {project_relative(path)}: {error}") from error
    if not isinstance(data, dict):
        raise DiagnosticError(f"JSON root must be an object: {project_relative(path)}")
    return data


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


def manifest_clips_by_id(manifest_path: Path) -> dict[str, dict[str, Any]]:
    manifest = read_json(manifest_path)
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise DiagnosticError(f"{project_relative(manifest_path)} clips must be an array")
    by_id: dict[str, dict[str, Any]] = {}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise DiagnosticError(f"{project_relative(manifest_path)} clips[{index}] must be an object")
        clip_id = clip.get("clip_id")
        if not isinstance(clip_id, str) or not clip_id:
            raise DiagnosticError(f"{project_relative(manifest_path)} clips[{index}].clip_id is invalid")
        by_id[clip_id] = clip
    return by_id


def quality_for_clip(torch: Any, manifest_path: Path, clip: dict[str, Any], frame_count: int, image_size: int) -> dict[str, Any]:
    clip_id = str(clip.get("clip_id", "unknown"))
    tensor_path = tensor_path_for_clip(clip, manifest_path, f"{project_relative(manifest_path)}:{clip_id}")
    if not tensor_path.exists():
        raise DiagnosticError(f"Decoded tensor missing for {clip_id}: {project_relative(tensor_path)}")
    frames = prepare_frames(
        torch,
        load_tensor_file(torch, tensor_path),
        frame_count=frame_count,
        image_size=image_size,
        context=f"{project_relative(manifest_path)}:{clip_id}",
    ).detach().cpu().float()
    scale = 255.0 if float(frames.max().item()) <= 1.5 else 1.0
    luma = (0.2126 * frames[:, 0] + 0.7152 * frames[:, 1] + 0.0722 * frames[:, 2]) * scale
    flat = luma.flatten(1)
    frame_luma = flat.mean(dim=1)
    frame_contrast = flat.std(dim=1, unbiased=False)
    usable = frame_luma > USABLE_FRAME_LUMA_MIN
    if bool(usable.any()):
        average_luma = float(frame_luma[usable].mean().item())
        average_contrast = float(frame_contrast[usable].mean().item())
    else:
        average_luma = 0.0
        average_contrast = 0.0
    reject_reasons = []
    if average_luma < LUMA_MIN:
        reject_reasons.append("too_dark")
    if average_contrast < CONTRAST_MIN:
        reject_reasons.append("low_contrast")
    return {
        "clip_id": clip_id,
        "tensor": file_reference(tensor_path),
        "frame_count": int(frames.shape[0]),
        "image_size": int(frames.shape[-1]),
        "average_luma": average_luma,
        "average_contrast": average_contrast,
        "quality_pass": len(reject_reasons) == 0,
        "reject_reasons": reject_reasons,
    }


def summarize_quality(rows: list[dict[str, Any]], *, negative: bool = False, threshold: float | None = None) -> dict[str, Any]:
    total = len(rows)
    quality_rejects = [row for row in rows if not row["quality"]["quality_pass"]]
    summary: dict[str, Any] = {
        "examples": total,
        "quality_reject_count": len(quality_rejects),
        "quality_reject_rate": len(quality_rejects) / total if total else 0.0,
        "luma_min": min((row["quality"]["average_luma"] for row in rows), default=None),
        "luma_max": max((row["quality"]["average_luma"] for row in rows), default=None),
        "contrast_min": min((row["quality"]["average_contrast"] for row in rows), default=None),
        "contrast_max": max((row["quality"]["average_contrast"] for row in rows), default=None),
    }
    if negative:
        false_before = [row for row in rows if row.get("model_false_pass_before_quality_gate")]
        false_after = [row for row in rows if row.get("false_pass_after_quality_gate")]
        summary.update(
            {
                "threshold": threshold,
                "model_false_pass_count_before_quality_gate": len(false_before),
                "model_false_pass_rate_before_quality_gate": len(false_before) / total if total else 0.0,
                "false_pass_count_after_quality_gate": len(false_after),
                "false_pass_rate_after_quality_gate": len(false_after) / total if total else 0.0,
            }
        )
    else:
        accepted_before = [row for row in rows if row.get("accepted_before_quality_gate")]
        accepted_after = [row for row in rows if row.get("accepted_after_quality_gate")]
        correct_after = [row for row in accepted_after if row.get("correct")]
        summary.update(
            {
                "threshold": threshold,
                "accepted_count_before_quality_gate": len(accepted_before),
                "accepted_count_after_quality_gate": len(accepted_after),
                "accepted_coverage_after_quality_gate": len(accepted_after) / total if total else 0.0,
                "accepted_precision_after_quality_gate": len(correct_after) / len(accepted_after) if accepted_after else 0.0,
            }
        )
    return summary


def grouped_negative_summary(rows: list[dict[str, Any]], threshold: float | None) -> dict[str, Any]:
    by_type: dict[str, Any] = {}
    for challenge_type in sorted({str(row.get("challenge_type")) for row in rows}):
        subset = [row for row in rows if row.get("challenge_type") == challenge_type]
        by_type[challenge_type] = summarize_quality(subset, negative=True, threshold=threshold)
    return by_type


def enrich_examples(
    torch: Any,
    examples: list[dict[str, Any]],
    manifest_path: Path,
    clips_by_id: dict[str, dict[str, Any]],
    frame_count: int,
    image_size: int,
    threshold: float,
    negative: bool = False,
) -> list[dict[str, Any]]:
    enriched = []
    for example in examples:
        clip_id = example.get("clip_id")
        if not isinstance(clip_id, str) or clip_id not in clips_by_id:
            raise DiagnosticError(f"Prediction sidecar clip_id not found in manifest: {clip_id}")
        quality = quality_for_clip(torch, manifest_path, clips_by_id[clip_id], frame_count, image_size)
        confidence = float(example.get("confidence", 0.0))
        if negative:
            model_false_pass = bool(example.get("false_pass", confidence >= threshold))
            enriched.append(
                {
                    "clip_id": clip_id,
                    "challenge_type": example.get("challenge_type"),
                    "predicted_label": example.get("predicted_label"),
                    "confidence": confidence,
                    "quality": quality,
                    "model_false_pass_before_quality_gate": model_false_pass,
                    "false_pass_after_quality_gate": model_false_pass and quality["quality_pass"],
                }
            )
        else:
            accepted_before = confidence >= threshold
            enriched.append(
                {
                    "clip_id": clip_id,
                    "true_label": example.get("true_label"),
                    "predicted_label": example.get("predicted_label"),
                    "confidence": confidence,
                    "correct": bool(example.get("correct")),
                    "quality": quality,
                    "accepted_before_quality_gate": accepted_before,
                    "accepted_after_quality_gate": accepted_before and quality["quality_pass"],
                }
            )
    return enriched


def main() -> int:
    args = parse_args()
    try:
        import torch  # type: ignore[import-not-found]

        sidecar_path = resolve_project_path(args.prediction_sidecar, "--prediction-sidecar")
        validation_manifest_path = resolve_project_path(args.validation_manifest, "--validation-manifest")
        test_manifest_path = resolve_project_path(args.test_manifest, "--test-manifest")
        challenge_manifest_path = resolve_project_path(args.challenge_manifest, "--challenge-manifest")
        output_path = resolve_project_path(args.output, "--output", must_exist=False)

        sidecar = read_json(sidecar_path)
        threshold = float(sidecar.get("selected_threshold"))
        frame_count = int(sidecar.get("model", {}).get("frame_count", 16) if isinstance(sidecar.get("model"), dict) else 16)
        image_size = int(sidecar.get("model", {}).get("image_size", 96) if isinstance(sidecar.get("model"), dict) else 96)

        validation_rows = enrich_examples(
            torch,
            sidecar.get("validation", {}).get("examples", []),
            validation_manifest_path,
            manifest_clips_by_id(validation_manifest_path),
            frame_count,
            image_size,
            threshold,
        )
        test_rows = enrich_examples(
            torch,
            sidecar.get("test", {}).get("examples", []),
            test_manifest_path,
            manifest_clips_by_id(test_manifest_path),
            frame_count,
            image_size,
            threshold,
        )
        negative_rows = enrich_examples(
            torch,
            sidecar.get("negative_challenge", {}).get("examples", []),
            challenge_manifest_path,
            manifest_clips_by_id(challenge_manifest_path),
            frame_count,
            image_size,
            threshold,
            negative=True,
        )
        report = {
            "schema_version": "asl-pilot-controlled-pilot-browser-quality-gate-diagnostic/v1",
            "status": "diagnostic_not_final_model_evidence",
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "quality_gate": {
                "source": "web/src/lib/client-model.ts evaluateLocalAttempt",
                "usable_frame_luma_min": USABLE_FRAME_LUMA_MIN,
                "average_luma_min": LUMA_MIN,
                "average_contrast_min": CONTRAST_MIN,
                "raw_rgb_quality_statistics": "luma/contrast computed directly from decoded raw RGB frames; no pretrained detector",
            },
            "inputs": {
                "prediction_sidecar": file_reference(sidecar_path),
                "validation_manifest": file_reference(validation_manifest_path),
                "test_manifest": file_reference(test_manifest_path),
                "negative_challenge_manifest": file_reference(challenge_manifest_path),
            },
            "threshold": threshold,
            "validation": summarize_quality(validation_rows, threshold=threshold),
            "test": summarize_quality(test_rows, threshold=threshold),
            "negative_challenge": {
                **summarize_quality(negative_rows, negative=True, threshold=threshold),
                "by_type": grouped_negative_summary(negative_rows, threshold),
            },
            "decision": {
                "changes_model_weights": False,
                "changes_thresholds": False,
                "changes_model_card": False,
                "final_evidence": False,
                "result": "quality_gate_reduces_some_negative_false_passes_but_current_candidate_still_fails",
            },
        }
        if args.write:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(
            json.dumps(
                {
                    "status": report["status"],
                    "output": project_relative(output_path) if args.write else None,
                    "validation_quality_reject_rate": report["validation"]["quality_reject_rate"],
                    "test_quality_reject_rate": report["test"]["quality_reject_rate"],
                    "negative_false_pass_rate_before": report["negative_challenge"][
                        "model_false_pass_rate_before_quality_gate"
                    ],
                    "negative_false_pass_rate_after": report["negative_challenge"][
                        "false_pass_rate_after_quality_gate"
                    ],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except (DiagnosticError, TrainingError) as error:
        print(f"Browser quality-gate diagnostic failed: {error}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
