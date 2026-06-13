#!/usr/bin/env python3
"""Replayable FFmpeg decode provenance for raw-frame ASL tensors."""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-rawframe-decode-provenance/v1"


class DecodeProvenanceError(RuntimeError):
    """Raised when decoded tensor provenance cannot be replay-verified."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def resolve_project_path(path: Path) -> Path:
    resolved = path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise DecodeProvenanceError(f"path escapes project root: {path}") from error
    return resolved


def resolve_manifest_relative_path(manifest_path: Path, value: str, field: str) -> Path:
    relative_path = Path(value)
    if relative_path.is_absolute():
        raise DecodeProvenanceError(f"{manifest_path}: {field} must be relative, got {value}")
    return resolve_project_path(manifest_path.parent / relative_path)


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def ensure_ffmpeg(ffmpeg: str | None = None) -> str:
    requested = ffmpeg or "ffmpeg"
    candidate = Path(requested)
    resolved = str(candidate.resolve()) if candidate.exists() else shutil.which(requested)
    if not resolved:
        raise DecodeProvenanceError("FFmpeg is required to verify raw-frame decode provenance")
    return str(Path(resolved).resolve())


def ffmpeg_filter(frame_count: int, image_size: int, decode_fps: float) -> dict[str, Any]:
    frame_limit = max(frame_count * 4, frame_count)
    video_filter = (
        f"fps={decode_fps},"
        f"scale={image_size}:{image_size}:force_original_aspect_ratio=increase,"
        f"crop={image_size}:{image_size},format=rgb24"
    )
    return {
        "frame_count": frame_count,
        "image_size": image_size,
        "decode_fps": decode_fps,
        "frame_limit": frame_limit,
        "video_filter": video_filter,
        "pixel_format": "rgb24",
    }


def ffmpeg_version(ffmpeg: str) -> str:
    result = subprocess.run(
        [ffmpeg, "-version"],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise DecodeProvenanceError(f"FFmpeg version probe failed: {result.stderr.strip()}")
    return result.stdout.splitlines()[0] if result.stdout else "unknown"


def run_ffmpeg_decode(
    ffmpeg: str,
    video_path: Path,
    frame_count: int,
    image_size: int,
    decode_fps: float,
) -> bytes:
    if decode_fps <= 0:
        raise DecodeProvenanceError("decode_fps must be greater than zero")
    decode = ffmpeg_filter(frame_count, image_size, decode_fps)
    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(video_path),
        "-an",
        "-vf",
        decode["video_filter"],
        "-frames:v",
        str(decode["frame_limit"]),
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "pipe:1",
    ]
    result = subprocess.run(command, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise DecodeProvenanceError(
            f"FFmpeg failed for {video_path}: {result.stderr.decode('utf-8', errors='replace').strip()}"
        )
    if not result.stdout:
        raise DecodeProvenanceError(f"FFmpeg decoded zero RGB frames from {video_path}")
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
        raise DecodeProvenanceError(
            f"{context}: decoded byte count {len(raw)} is not divisible by RGB frame size {frame_bytes}"
        )
    decoded_frames = len(raw) // frame_bytes
    if decoded_frames <= 0:
        raise DecodeProvenanceError(f"{context}: no decoded frames available")

    tensor = torch.frombuffer(bytearray(raw), dtype=torch.uint8)
    tensor = tensor.reshape(decoded_frames, image_size, image_size, 3)
    if decoded_frames >= frame_count:
        indices = torch.linspace(0, decoded_frames - 1, frame_count).round().to(dtype=torch.long)
        tensor = tensor.index_select(0, indices)
    else:
        padding = tensor[-1:].repeat(frame_count - decoded_frames, 1, 1, 1)
        tensor = torch.cat([tensor, padding], dim=0)
    return tensor.contiguous()


def load_tensor_file(torch: Any, path: Path) -> Any:
    try:
        loaded = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(path, map_location="cpu")
    if torch.is_tensor(loaded):
        return loaded
    if isinstance(loaded, dict):
        for key in ("frames", "tensor", "rgb_frames"):
            value = loaded.get(key)
            if torch.is_tensor(value):
                return value
    raise DecodeProvenanceError(f"decoded frame tensor file has no tensor payload: {path}")


def canonical_tensor_digest(torch: Any, tensor: Any) -> dict[str, Any]:
    if not torch.is_tensor(tensor):
        raise DecodeProvenanceError("decoded tensor payload is not a tensor")
    contiguous = tensor.detach().cpu().contiguous()
    payload = contiguous.numpy().tobytes()
    return {
        "dtype": str(contiguous.dtype).replace("torch.", ""),
        "shape": list(contiguous.shape),
        "layout": "T,H,W,C",
        "sha256": sha256_bytes(payload),
    }


def build_decode_provenance(
    torch: Any,
    ffmpeg: str,
    manifest_path: Path,
    clip: dict[str, Any],
    tensor: Any,
    raw_rgb: bytes,
    frame_count: int,
    image_size: int,
    decode_fps: float,
) -> dict[str, Any]:
    relative_video_path = str(clip.get("relative_video_path") or "")
    video_path = resolve_manifest_relative_path(manifest_path, relative_video_path, "relative_video_path")
    return {
        "schema_version": SCHEMA_VERSION,
        "source_video": {
            "relative_video_path": relative_video_path,
            "path": project_relative(video_path),
            "sha256": sha256_file(video_path),
        },
        "decode": ffmpeg_filter(frame_count, image_size, decode_fps),
        "ffmpeg": {
            "path": str(Path(ffmpeg).resolve()),
            "sha256": sha256_file(Path(ffmpeg).resolve()) if Path(ffmpeg).exists() else None,
            "version": ffmpeg_version(ffmpeg),
        },
        "decoded_raw_rgb": {
            "bytes": len(raw_rgb),
            "sha256": sha256_bytes(raw_rgb),
        },
        "tensor_digest": canonical_tensor_digest(torch, tensor),
    }


def verify_clip_decode_provenance(
    torch: Any,
    manifest_path: Path,
    clip: dict[str, Any],
    context: str,
    ffmpeg: str | None = None,
    replay_ffmpeg: bool = True,
) -> dict[str, Any]:
    provenance = clip.get("frame_tensor_provenance")
    if not isinstance(provenance, dict):
        raise DecodeProvenanceError(f"{context} is missing frame_tensor_provenance")
    if provenance.get("schema_version") != SCHEMA_VERSION:
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance schema_version must be {SCHEMA_VERSION}")
    decode = provenance.get("decode")
    if not isinstance(decode, dict):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.decode must be an object")
    frame_count = int(decode.get("frame_count") or 0)
    image_size = int(decode.get("image_size") or 0)
    decode_fps = float(decode.get("decode_fps") or 0)
    if frame_count <= 0 or image_size <= 0 or decode_fps <= 0:
        raise DecodeProvenanceError(f"{context} decode frame_count, image_size, and decode_fps must be positive")

    video_path = resolve_manifest_relative_path(
        manifest_path,
        str(clip.get("relative_video_path") or ""),
        "relative_video_path",
    )
    source_video = provenance.get("source_video")
    if not isinstance(source_video, dict):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.source_video must be an object")
    if source_video.get("relative_video_path") != clip.get("relative_video_path"):
        raise DecodeProvenanceError(f"{context} source_video.relative_video_path does not match clip")
    if source_video.get("path") != project_relative(video_path):
        raise DecodeProvenanceError(f"{context} source_video.path does not match current raw video path")
    if not is_sha256(source_video.get("sha256")):
        raise DecodeProvenanceError(f"{context} source_video.sha256 must be a SHA-256 digest")
    if source_video.get("sha256") != sha256_file(video_path):
        raise DecodeProvenanceError(f"{context} source_video.sha256 does not match current raw video")
    if clip.get("sha256") != source_video.get("sha256"):
        raise DecodeProvenanceError(f"{context} clip sha256 must match frame_tensor_provenance source video")

    ffmpeg_record = provenance.get("ffmpeg")
    if not isinstance(ffmpeg_record, dict):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.ffmpeg must be an object")
    if not isinstance(ffmpeg_record.get("path"), str) or not ffmpeg_record.get("path"):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.ffmpeg.path is required")
    if not isinstance(ffmpeg_record.get("version"), str) or not ffmpeg_record.get("version"):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.ffmpeg.version is required")
    expected_ffmpeg_sha = ffmpeg_record.get("sha256")
    if not is_sha256(expected_ffmpeg_sha):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.ffmpeg.sha256 must be a SHA-256 digest")

    raw_rgb = provenance.get("decoded_raw_rgb")
    if not isinstance(raw_rgb, dict):
        raise DecodeProvenanceError(f"{context} frame_tensor_provenance.decoded_raw_rgb must be an object")
    expected_raw_sha = raw_rgb.get("sha256")
    if not is_sha256(expected_raw_sha):
        raise DecodeProvenanceError(f"{context} decoded_raw_rgb.sha256 must be a SHA-256 digest")
    if replay_ffmpeg:
        ffmpeg_path = ensure_ffmpeg(ffmpeg)
        actual_ffmpeg_sha = sha256_file(Path(ffmpeg_path))
        if actual_ffmpeg_sha != expected_ffmpeg_sha:
            raise DecodeProvenanceError(
                f"{context} replay FFmpeg binary SHA-256 does not match frame_tensor_provenance.ffmpeg.sha256"
            )
        actual_ffmpeg_version = ffmpeg_version(ffmpeg_path)
        if actual_ffmpeg_version != ffmpeg_record.get("version"):
            raise DecodeProvenanceError(
                f"{context} replay FFmpeg version does not match frame_tensor_provenance.ffmpeg.version"
            )
        raw = run_ffmpeg_decode(ffmpeg_path, video_path, frame_count, image_size, decode_fps)
        expected_raw_bytes = raw_rgb.get("bytes")
        if expected_raw_bytes != len(raw):
            raise DecodeProvenanceError(f"{context} replayed FFmpeg raw RGB byte count does not match provenance")
        if expected_raw_sha != sha256_bytes(raw):
            raise DecodeProvenanceError(f"{context} replayed FFmpeg raw RGB SHA-256 does not match provenance")
        replay_tensor = tensor_from_raw_rgb(torch, raw, frame_count, image_size, context)
        replay_digest = canonical_tensor_digest(torch, replay_tensor)
        if replay_digest != provenance.get("tensor_digest"):
            raise DecodeProvenanceError(f"{context} replayed tensor digest does not match provenance")

    tensor_relative = clip.get("relative_frame_tensor_path")
    if not isinstance(tensor_relative, str) or not tensor_relative:
        raise DecodeProvenanceError(f"{context} relative_frame_tensor_path is required")
    tensor_path = resolve_manifest_relative_path(manifest_path, tensor_relative, "relative_frame_tensor_path")
    if not tensor_path.exists():
        raise DecodeProvenanceError(f"{context} decoded tensor file is missing: {tensor_path}")
    if clip.get("frame_tensor_sha256") != sha256_file(tensor_path):
        raise DecodeProvenanceError(f"{context} frame_tensor_sha256 does not match current tensor file")
    saved_digest = canonical_tensor_digest(torch, load_tensor_file(torch, tensor_path))
    if saved_digest != provenance.get("tensor_digest"):
        raise DecodeProvenanceError(f"{context} saved tensor payload does not match decode provenance")
    return {
        "clip_id": clip.get("clip_id"),
        "status": "passed",
        "ffmpeg_replay": "passed" if replay_ffmpeg else "skipped",
        "tensor_digest": saved_digest,
    }


def verify_manifest_decode_provenance(
    torch: Any,
    manifest_path: Path,
    ffmpeg: str | None = None,
) -> dict[str, Any]:
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise DecodeProvenanceError(f"{manifest_path} is invalid JSON: {error}") from error
    clips = manifest.get("clips")
    if not isinstance(clips, list) or not clips:
        raise DecodeProvenanceError(f"{manifest_path} clips must be a non-empty array")
    verified = []
    ffmpeg_path = ensure_ffmpeg(ffmpeg)
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise DecodeProvenanceError(f"{manifest_path}: clips[{index}] must be an object")
        verified.append(
            verify_clip_decode_provenance(
                torch,
                manifest_path,
                clip,
                f"{manifest_path}: clips[{index}]",
                ffmpeg_path,
            )
        )
    return {
        "manifest": project_relative(manifest_path),
        "status": "passed",
        "clips_verified": len(verified),
    }
