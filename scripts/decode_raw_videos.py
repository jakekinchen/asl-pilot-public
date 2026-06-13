#!/usr/bin/env python3
"""Decode approved raw ASL videos into hash-pinned RGB frame tensors.

This script is a preprocessing bridge between the explicit-consent WebM
collection/export step and from-scratch model training. It uses FFmpeg only to
decode/resize/crop RGB frames, then saves PyTorch tensors for the training
script. It does not run detectors, landmarks, embeddings, pretrained feature
extractors, or pretrained model weights.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from rawframe_decode_provenance import (
    DecodeProvenanceError,
    build_decode_provenance,
    verify_manifest_decode_provenance,
)
from train_rawframe_model import (
    ALLOWED_NEGATIVE_CHALLENGE_TYPES,
    ALLOWED_FRAME_SOURCE,
    EXTERNAL_DATASET_SOURCE_MODE,
    ManifestError,
    TrainingError,
    dataset_source_mode_for,
    require_current_local_ml_environment,
    validate_capture_condition_evidence,
    validate_consent_form,
    validate_collection_plan,
    validate_collection_plan_assignment,
    validate_external_dataset_import,
    validate_manifest,
    validate_source_register,
    validate_vocabulary_review,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TENSOR_ROOT = Path("data/tensors")
EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION = "asl-pilot-negative-challenge-manifest/v1"
ALLOWED_CHALLENGE_TYPES = ALLOWED_NEGATIVE_CHALLENGE_TYPES


class DecodeError(RuntimeError):
    """Raised when a manifest clip cannot be decoded into raw RGB tensors."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Decode manifest raw videos into RGB tensors and add "
            "relative_frame_tensor_path/frame_tensor_sha256 fields."
        )
    )
    parser.add_argument(
        "--manifest",
        action="append",
        type=Path,
        required=True,
        help="Manifest JSON to decode. Repeat for train/validation/test manifests.",
    )
    parser.add_argument(
        "--tensor-root",
        type=Path,
        default=DEFAULT_TENSOR_ROOT,
        help="Project-relative directory for decoded tensor files.",
    )
    parser.add_argument(
        "--frame-count",
        type=int,
        default=16,
        help="Number of sampled frames to store per clip.",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        default=96,
        help="Square RGB frame size to store.",
    )
    parser.add_argument(
        "--decode-fps",
        type=float,
        default=12.0,
        help="Frame rate requested from FFmpeg before even sampling/padding.",
    )
    parser.add_argument(
        "--allow-small-label-set",
        action="store_true",
        help=(
            "Allow fewer than 75 labels for synthetic wiring tests only. "
            "Use --lesson-milestone for strict real-data 25-sign lesson evidence."
        ),
    )
    parser.add_argument(
        "--lesson-milestone",
        action="store_true",
        help=(
            "Decode the strict first-party 25-sign lesson milestone. This permits "
            "25-40 vocabulary labels while keeping all media, source, consent, "
            "review, and negative-challenge checks strict."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate manifests, FFmpeg, and PyTorch availability without writing tensors.",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Replay FFmpeg decode provenance for existing manifest tensor references without writing tensors.",
    )
    return parser.parse_args()


def import_torch() -> Any:
    try:
        import torch  # type: ignore[import-not-found]
    except ImportError as error:
        raise DecodeError(
            "PyTorch is required to save .pt frame tensors but is not installed. "
            "Install torch in the active Python environment before decoding."
        ) from error
    return torch


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DecodeError(f"manifest is not valid JSON: {path}: {error}") from error
    if not isinstance(data, dict):
        raise DecodeError(f"manifest root must be an object: {path}")
    return data


def write_json_atomic(path: Path, data: dict[str, Any]) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temp_path.replace(path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_project_path(path: Path) -> Path:
    resolved = path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DecodeError(f"path escapes project root: {path}") from error
    return resolved


def resolve_manifest_relative_path(manifest_path: Path, value: str, field: str) -> Path:
    relative_path = Path(value)
    if relative_path.is_absolute():
        raise DecodeError(f"{manifest_path}: {field} must be relative, got {value}")
    return resolve_project_path(manifest_path.parent / relative_path)


def validate_external_negative_challenge_clip_provenance(
    clip: dict[str, Any],
    context: str,
) -> None:
    for key in (
        "source_record_id",
        "source_page_url",
        "source_file_url",
        "source_file_page_title",
        "source_license_short_name",
        "source_author",
    ):
        if not isinstance(clip.get(key), str) or not str(clip.get(key)).strip():
            raise DecodeError(f"{context}: external challenge clip must include non-empty {key}")
    for key in ("source_page_url", "source_file_url"):
        value = str(clip[key])
        if not value.startswith("https://"):
            raise DecodeError(f"{context}: {key} must be an https URL")
    evidence = clip.get("source_file_metadata")
    if not isinstance(evidence, dict):
        raise DecodeError(f"{context}: source_file_metadata must be an object")
    for key in ("license_short_name", "mime", "source_sha256"):
        if not isinstance(evidence.get(key), str) or not str(evidence.get(key)).strip():
            raise DecodeError(f"{context}: source_file_metadata.{key} must be a non-empty string")
    if evidence.get("license_short_name") != clip.get("source_license_short_name"):
        raise DecodeError(f"{context}: source_file_metadata.license_short_name must match source_license_short_name")
    source_sha = str(evidence.get("source_sha256", "")).lower()
    if len(source_sha) != 64 or any(character not in "0123456789abcdef" for character in source_sha):
        raise DecodeError(f"{context}: source_file_metadata.source_sha256 must be a SHA-256 digest")
    if source_sha != str(clip.get("sha256", "")).lower():
        raise DecodeError(f"{context}: source_file_metadata.source_sha256 must match clip sha256")
    if evidence.get("mime") not in {"video/webm", "video/mp4", "application/ogg", "video/ogg"}:
        raise DecodeError(f"{context}: source_file_metadata.mime must identify a WebM, MP4, or Ogg video")


def validate_negative_challenge_manifest_for_decode(
    manifest_path: Path,
    allow_small_label_set: bool,
) -> dict[str, Any]:
    data = read_json(manifest_path)
    if data.get("schema_version") != EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION:
        raise DecodeError(
            f"{manifest_path}: schema_version must be {EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION!r}"
        )
    if data.get("split") != "negative_challenge":
        raise DecodeError(f"{manifest_path}: split must be negative_challenge")
    clips = data.get("clips")
    if not isinstance(clips, list) or not clips:
        raise DecodeError(f"{manifest_path}: clips must be a non-empty array")
    try:
        dataset_source_mode = dataset_source_mode_for(data, manifest_path)
        source_decisions = validate_source_register(data, manifest_path, allow_small_label_set)
        validate_external_dataset_import(
            data,
            manifest_path,
            source_decisions,
            allow_small_label_set,
            require_model_training=False,
        )
        validate_consent_form(data, manifest_path, allow_small_label_set)
        collection_plan = validate_collection_plan(data, manifest_path, allow_small_label_set)
        validate_vocabulary_review(data, manifest_path, allow_small_label_set)
    except ManifestError as error:
        raise DecodeError(str(error)) from error
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise DecodeError(f"{manifest_path}: clips[{index}] must be an object")
        context = f"{manifest_path}: clips[{index}]"
        for key in ("clip_id", "relative_video_path", "sha256", "frame_source", "expected_outcome", "challenge_type"):
            if not isinstance(clip.get(key), str) or not str(clip.get(key)).strip():
                raise DecodeError(f"{context}: {key} must be a non-empty string")
        if clip["frame_source"] != ALLOWED_FRAME_SOURCE:
            raise DecodeError(f"{context}: frame_source must be {ALLOWED_FRAME_SOURCE!r}")
        if clip["expected_outcome"] != "reject":
            raise DecodeError(f"{context}: expected_outcome must be reject")
        if clip["challenge_type"] not in ALLOWED_CHALLENGE_TYPES:
            raise DecodeError(f"{context}: unknown challenge_type {clip['challenge_type']}")
        if clip.get("allowed_for_validation") is not True:
            raise DecodeError(f"{context}: allowed_for_validation must be true")
        if clip.get("derived_features", []) not in ([], None):
            raise DecodeError(f"{context}: derived_features must be empty")
        video_path = resolve_manifest_relative_path(
            manifest_path,
            str(clip["relative_video_path"]),
            "relative_video_path",
        )
        if not video_path.exists():
            raise DecodeError(f"{context}: video file is missing: {video_path}")
        expected_hash = str(clip["sha256"]).lower()
        if len(expected_hash) != 64 or any(character not in "0123456789abcdef" for character in expected_hash):
            raise DecodeError(f"{context}: sha256 must be a lowercase SHA-256 digest")
        actual_hash = sha256_file(video_path)
        if actual_hash != expected_hash:
            raise DecodeError(f"{context}: raw video SHA-256 mismatch; expected {expected_hash}, got {actual_hash}")
        if not allow_small_label_set:
            source = source_decisions.get(str(clip.get("source_id")))
            if not source:
                raise DecodeError(f"{context}: source_id is not present in source register")
            if source.get("allowed_for_validation") is not True:
                raise DecodeError(f"{context}: source is not allowed for validation")
            if clip.get("source_license_decision") != source.get("decision_id"):
                raise DecodeError(f"{context}: source_license_decision does not match source register")
            if clip.get("source_license_review_status") != source.get("license_review_status"):
                raise DecodeError(f"{context}: source_license_review_status does not match source register")
            try:
                validate_capture_condition_evidence(clip, context, "negative_challenge")
                if dataset_source_mode == EXTERNAL_DATASET_SOURCE_MODE:
                    validate_external_negative_challenge_clip_provenance(clip, context)
                else:
                    validate_collection_plan_assignment(
                        clip,
                        context,
                        collection_plan,
                        "negative_challenge",
                    )
            except ManifestError as error:
                raise DecodeError(str(error)) from error
    return {
        "path": str(manifest_path),
        "split": "negative_challenge",
        "clip_count": len(clips),
    }


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def manifest_relative(manifest_path: Path, target_path: Path) -> str:
    return Path(os.path.relpath(target_path.resolve(), manifest_path.parent.resolve())).as_posix()


def ensure_ffmpeg() -> str:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise DecodeError("FFmpeg is required for raw video decoding but was not found on PATH.")
    return ffmpeg


def run_ffmpeg_decode(
    ffmpeg: str,
    video_path: Path,
    frame_count: int,
    image_size: int,
    decode_fps: float,
) -> bytes:
    if decode_fps <= 0:
        raise DecodeError("--decode-fps must be greater than zero")
    frame_limit = max(frame_count * 4, frame_count)
    video_filter = (
        f"fps={decode_fps},"
        f"scale={image_size}:{image_size}:force_original_aspect_ratio=increase,"
        f"crop={image_size}:{image_size},format=rgb24"
    )
    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(video_path),
        "-an",
        "-vf",
        video_filter,
        "-frames:v",
        str(frame_limit),
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "pipe:1",
    ]
    result = subprocess.run(command, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise DecodeError(
            f"FFmpeg failed for {video_path}: {result.stderr.decode('utf-8', errors='replace').strip()}"
        )
    if not result.stdout:
        raise DecodeError(f"FFmpeg decoded zero RGB frames from {video_path}")
    return result.stdout


def tensor_from_raw_rgb(
    torch: Any,
    raw: bytes,
    frame_count: int,
    image_size: int,
    context: str,
) -> Any:
    frame_bytes = image_size * image_size * 3
    if len(raw) % frame_bytes != 0:
        raise DecodeError(
            f"{context}: decoded byte count {len(raw)} is not divisible by RGB frame size {frame_bytes}"
        )
    decoded_frames = len(raw) // frame_bytes
    if decoded_frames <= 0:
        raise DecodeError(f"{context}: no decoded frames available")

    tensor = torch.frombuffer(bytearray(raw), dtype=torch.uint8)
    tensor = tensor.reshape(decoded_frames, image_size, image_size, 3)
    if decoded_frames >= frame_count:
        indices = torch.linspace(0, decoded_frames - 1, frame_count).round().to(dtype=torch.long)
        tensor = tensor.index_select(0, indices)
    else:
        padding = tensor[-1:].repeat(frame_count - decoded_frames, 1, 1, 1)
        tensor = torch.cat([tensor, padding], dim=0)
    return tensor.contiguous()


def decode_manifest(
    torch: Any,
    ffmpeg: str,
    manifest_path: Path,
    tensor_root: Path,
    frame_count: int,
    image_size: int,
    decode_fps: float,
    dry_run: bool,
) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    split = str(manifest.get("split"))
    tensor_dir = resolve_project_path(tensor_root / split)
    updated_clips = []

    for index, clip in enumerate(manifest.get("clips", [])):
        if not isinstance(clip, dict):
            raise DecodeError(f"{manifest_path}: clips[{index}] must be an object")
        context = f"{manifest_path}: clips[{index}]"
        clip_id = str(clip.get("clip_id") or "")
        if not clip_id:
            raise DecodeError(f"{context}: clip_id is required")
        relative_video_path = str(clip.get("relative_video_path") or "")
        if not relative_video_path:
            raise DecodeError(f"{context}: relative_video_path is required")

        video_path = resolve_manifest_relative_path(
            manifest_path,
            relative_video_path,
            "relative_video_path",
        )
        if not video_path.exists():
            raise DecodeError(f"{context}: video file is missing: {video_path}")
        expected_video_hash = str(clip.get("sha256") or "").lower()
        actual_video_hash = sha256_file(video_path)
        if actual_video_hash != expected_video_hash:
            raise DecodeError(
                f"{context}: raw video SHA-256 mismatch; expected {expected_video_hash}, got {actual_video_hash}"
            )

        tensor_path = tensor_dir / f"{clip_id}.pt"
        raw_rgb = run_ffmpeg_decode(ffmpeg, video_path, frame_count, image_size, decode_fps)
        tensor = tensor_from_raw_rgb(torch, raw_rgb, frame_count, image_size, context)

        updated_clip = dict(clip)
        if not dry_run:
            tensor_dir.mkdir(parents=True, exist_ok=True)
            torch.save({"rgb_frames": tensor}, tensor_path)
            updated_clip["relative_frame_tensor_path"] = manifest_relative(manifest_path, tensor_path)
            updated_clip["frame_tensor_sha256"] = sha256_file(tensor_path)
            updated_clip["frame_tensor_provenance"] = build_decode_provenance(
                torch,
                ffmpeg,
                manifest_path,
                clip,
                tensor,
                raw_rgb,
                frame_count,
                image_size,
                decode_fps,
            )
        updated_clips.append(updated_clip)

    if not dry_run:
        manifest["clips"] = updated_clips
        write_json_atomic(manifest_path, manifest)

    return {
        "manifest": str(manifest_path),
        "split": split,
        "clips_decoded": len(updated_clips),
        "tensor_root": project_relative(tensor_dir),
        "dry_run": dry_run,
    }


def main() -> int:
    args = parse_args()
    if args.frame_count <= 0:
        print("Decode failed: --frame-count must be greater than zero", file=sys.stderr)
        return 2
    if args.image_size <= 0:
        print("Decode failed: --image-size must be greater than zero", file=sys.stderr)
        return 2
    if args.dry_run and args.verify_only:
        print("Decode failed: --dry-run and --verify-only cannot be combined", file=sys.stderr)
        return 2
    if args.lesson_milestone and args.allow_small_label_set:
        print("Decode failed: --lesson-milestone cannot be combined with --allow-small-label-set", file=sys.stderr)
        return 2

    try:
        manifests = []
        for manifest_path in args.manifest:
            data = read_json(manifest_path)
            split = str(data.get("split"))
            if split == "negative_challenge":
                manifests.append(
                    validate_negative_challenge_manifest_for_decode(
                        manifest_path,
                        args.allow_small_label_set,
                    )
                )
            else:
                manifests.append(
                    validate_manifest(
                        manifest_path,
                        split,
                        check_files=True,
                        allow_small_label_set=args.allow_small_label_set,
                        allow_lesson_label_set=args.lesson_milestone,
                    )
                )
        if not args.dry_run and not args.allow_small_label_set:
            require_current_local_ml_environment(
                "lesson milestone decode" if args.lesson_milestone else "final decode"
            )
        ffmpeg = ensure_ffmpeg()
        torch = import_torch()
        if args.verify_only:
            summaries = [
                verify_manifest_decode_provenance(torch, manifest_path, ffmpeg)
                for manifest_path in args.manifest
            ]
        else:
            summaries = [
                decode_manifest(
                    torch,
                    ffmpeg,
                    manifest_path,
                    args.tensor_root,
                    args.frame_count,
                    args.image_size,
                    args.decode_fps,
                    args.dry_run,
                )
                for manifest_path in args.manifest
            ]
    except (ManifestError, DecodeError, DecodeProvenanceError, TrainingError) as error:
        print(f"Decode failed: {error}", file=sys.stderr)
        return 2

    print(
        json.dumps(
            {
                "status": "verified" if args.verify_only else ("validated" if args.dry_run else "decoded"),
                "manifests": summaries,
                "pretrained_components": [],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
