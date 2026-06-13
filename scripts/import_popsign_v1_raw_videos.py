#!/usr/bin/env python3
"""Import PopSign v1 original videos into ASL Pilot raw-frame manifests."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tarfile
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IMPORT_PLAN = Path("docs/research/popsign-v1-import-plan.json")
DEFAULT_MANIFEST_DIR = Path("data/manifests")
DEFAULT_CLIPS_PER_LABEL_SPLIT = 5
SOURCE_ID = "popsign-v1-original-videos"
SOURCE_REVIEW_PATH = Path("docs/research/popsign-v1-source-review.md")
MANIFEST_SCHEMA_VERSION = "asl-pilot-rawframe-manifest/v1"
DATASET_SOURCE_MODE = "approved_external_raw_video_source"
DATASET_ID = "asl-pilot-popsign-v1-game-rawframe-v0"
PREPROCESSING_STEPS = [
    "decode_video",
    "sample_frames",
    "resize",
    "center_crop",
    "normalize_rgb",
]
VIDEO_SUFFIXES = {".mp4", ".mov", ".m4v", ".webm"}
SPLIT_TO_MANIFEST_SPLIT = {
    "train": "train",
    "val": "validation",
    "test": "test",
}


class ImportErrorForUser(RuntimeError):
    """Raised when the PopSign import cannot safely continue."""


@dataclass(frozen=True)
class ArchivePlan:
    source_split: str
    manifest_split: str
    label_id: str
    display_text: str
    sign_slug: str
    archive_url: str
    local_archive_path: Path
    local_extract_dir: Path


@dataclass(frozen=True)
class ImportedVideo:
    path: Path
    source_video_path: str
    source_signer_alias: str
    sha256: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract approved PopSign v1 original game videos and export "
            "train/validation/test raw-frame manifests."
        )
    )
    parser.add_argument(
        "--plan",
        type=Path,
        default=DEFAULT_IMPORT_PLAN,
        help="Project-relative PopSign import plan JSON.",
    )
    parser.add_argument(
        "--manifest-dir",
        type=Path,
        default=DEFAULT_MANIFEST_DIR,
        help="Project-relative output directory for train/validation/test manifests.",
    )
    parser.add_argument(
        "--clips-per-label-split",
        type=int,
        default=DEFAULT_CLIPS_PER_LABEL_SPLIT,
        help=(
            "Default minimum videos to import for each label in each source split. "
            "Split-specific options override this value."
        ),
    )
    parser.add_argument(
        "--train-clips-per-label",
        type=int,
        help="Minimum videos to import for each label from the PopSign train split.",
    )
    parser.add_argument(
        "--validation-clips-per-label",
        type=int,
        help="Minimum videos to import for each label from the PopSign val split.",
    )
    parser.add_argument(
        "--test-clips-per-label",
        type=int,
        help="Minimum videos to import for each label from the PopSign test split.",
    )
    parser.add_argument(
        "--split",
        action="append",
        choices=sorted(SPLIT_TO_MANIFEST_SPLIT),
        help="Limit import to one PopSign source split. Repeat as needed.",
    )
    parser.add_argument(
        "--label",
        action="append",
        help="Limit import to one ASL Pilot label_id. Repeat as needed.",
    )
    parser.add_argument(
        "--download-missing",
        choices=["none", "stream"],
        default="none",
        help=(
            "Use 'stream' to read missing videos directly from official tar URLs "
            "without saving complete archives."
        ),
    )
    parser.add_argument(
        "--request-timeout",
        type=float,
        default=120.0,
        help="HTTP timeout in seconds for streamed archive reads.",
    )
    parser.add_argument(
        "--stream-retries",
        type=int,
        default=3,
        help="Number of attempts for each streamed archive before reporting a download blocker.",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write manifest JSON files after import checks pass.",
    )
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Write/debug limited imports even when the full 75-100 label contract is not met.",
    )
    parser.add_argument(
        "--verbose-archives",
        action="store_true",
        help="Print every per-archive extraction summary instead of a compact sample.",
    )
    return parser.parse_args()


def resolve_project_path(path: Path, context: str) -> Path:
    resolved = (PROJECT_ROOT / path).resolve() if not path.is_absolute() else path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ImportErrorForUser(f"{context} escapes project root: {path}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def manifest_relative(manifest_path: Path, target_path: Path) -> str:
    return Path(os.path.relpath(target_path.resolve(), manifest_path.parent.resolve())).as_posix()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ImportErrorForUser(f"{path} is not valid JSON: {error}") from error
    if not isinstance(data, dict):
        raise ImportErrorForUser(f"{path} root must be an object")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    temp_path.replace(path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def require_sha_reference(reference: Any, context: str) -> Path:
    if not isinstance(reference, dict):
        raise ImportErrorForUser(f"{context} must be an object")
    path_value = reference.get("path")
    expected = reference.get("sha256")
    if not isinstance(path_value, str) or not path_value.strip():
        raise ImportErrorForUser(f"{context}.path must be a non-empty string")
    if not isinstance(expected, str) or not re.fullmatch(r"[a-f0-9]{64}", expected):
        raise ImportErrorForUser(f"{context}.sha256 must be a lowercase SHA-256")
    path = resolve_project_path(Path(path_value), f"{context}.path")
    if not path.exists():
        raise ImportErrorForUser(f"{context}.path does not exist: {path_value}")
    actual = sha256_file(path)
    if actual != expected:
        raise ImportErrorForUser(f"{context}.sha256 mismatch; expected {expected}, got {actual}")
    return path


def load_source_decision(source_register_path: Path) -> dict[str, Any]:
    register = read_json(source_register_path)
    sources = register.get("sources")
    if not isinstance(sources, list):
        raise ImportErrorForUser("dataset source register sources must be an array")
    for source in sources:
        if isinstance(source, dict) and source.get("source_id") == SOURCE_ID:
            return source
    raise ImportErrorForUser(f"dataset source register is missing {SOURCE_ID}")


def validate_plan(plan: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], Path]:
    if plan.get("schema_version") != "asl-pilot-popsign-v1-import-plan/v1":
        raise ImportErrorForUser("PopSign import plan schema_version is invalid")
    if plan.get("status") != "ready_to_download":
        raise ImportErrorForUser("PopSign import plan must have status ready_to_download")
    if plan.get("source_id") != SOURCE_ID:
        raise ImportErrorForUser(f"PopSign import plan source_id must be {SOURCE_ID}")
    source_register_path = require_sha_reference(plan.get("source_register"), "source_register")
    require_sha_reference(plan.get("source_audit"), "source_audit")
    vocabulary_review = plan.get("vocabulary_review")
    if not isinstance(vocabulary_review, dict):
        raise ImportErrorForUser("vocabulary_review must be an object")
    require_sha_reference(vocabulary_review.get("evidence"), "vocabulary_review.evidence")
    require_sha_reference(vocabulary_review.get("vocabulary_source"), "vocabulary_review.vocabulary_source")
    source_review_path = resolve_project_path(SOURCE_REVIEW_PATH, "source review")
    if not source_review_path.exists():
        raise ImportErrorForUser(f"source review is missing: {SOURCE_REVIEW_PATH.as_posix()}")
    source_decision = load_source_decision(source_register_path)
    if source_decision.get("allowed_for_model_training") is not True:
        raise ImportErrorForUser(f"{SOURCE_ID} is not allowed for model training")
    if source_decision.get("allowed_for_validation") is not True:
        raise ImportErrorForUser(f"{SOURCE_ID} is not allowed for validation")
    return source_decision, vocabulary_review, source_review_path


def archive_plans(plan: dict[str, Any], selected_splits: set[str], selected_labels: set[str]) -> list[ArchivePlan]:
    archives = plan.get("archives")
    if not isinstance(archives, list):
        raise ImportErrorForUser("PopSign import plan archives must be an array")
    output: list[ArchivePlan] = []
    for item in archives:
        if not isinstance(item, dict):
            continue
        source_split = str(item.get("split") or "")
        label_id = str(item.get("label_id") or "")
        if source_split not in selected_splits or (selected_labels and label_id not in selected_labels):
            continue
        if item.get("status") != "planned":
            raise ImportErrorForUser(f"archive for {source_split}/{label_id} is not planned")
        sign_slug = str(item.get("popsign_sign_slug") or "")
        archive_url = str(item.get("archive_url") or "")
        if not sign_slug or not archive_url:
            raise ImportErrorForUser(f"archive for {source_split}/{label_id} is missing PopSign mapping")
        output.append(
            ArchivePlan(
                source_split=source_split,
                manifest_split=SPLIT_TO_MANIFEST_SPLIT[source_split],
                label_id=label_id,
                display_text=str(item.get("display_text") or label_id),
                sign_slug=sign_slug,
                archive_url=archive_url,
                local_archive_path=resolve_project_path(
                    Path(str(item.get("local_archive_path") or "")),
                    f"local_archive_path for {source_split}/{label_id}",
                ),
                local_extract_dir=resolve_project_path(
                    Path(str(item.get("local_extract_dir") or "")),
                    f"local_extract_dir for {source_split}/{label_id}",
                ),
            )
        )
    if not output:
        raise ImportErrorForUser("no PopSign archives matched the requested split/label filters")
    return output


def labels_from_archives(archives: Iterable[ArchivePlan]) -> list[dict[str, str]]:
    labels: list[dict[str, str]] = []
    seen: set[str] = set()
    for archive in archives:
        if archive.label_id in seen:
            continue
        seen.add(archive.label_id)
        labels.append({"label_id": archive.label_id, "display_text": archive.display_text})
    return labels


def safe_member_inner_path(member_name: str, sign_slug: str) -> Path | None:
    raw = Path(member_name)
    if raw.is_absolute() or ".." in raw.parts:
        return None
    if raw.suffix.lower() not in VIDEO_SUFFIXES:
        return None
    parts = list(raw.parts)
    if parts and parts[0] == sign_slug:
        parts = parts[1:]
    if not parts:
        return None
    inner = Path(*parts)
    if inner.is_absolute() or ".." in inner.parts:
        return None
    return inner


def source_video_path_for(inner_path: Path, sign_slug: str) -> str:
    value = inner_path.as_posix()
    if value == sign_slug or value.startswith(f"{sign_slug}/"):
        return value
    return f"{sign_slug}/{value}"


def signer_alias_from_source_path(source_video_path: str) -> str:
    name = Path(source_video_path).name
    if "-" in name:
        return name.split("-", 1)[0]
    return Path(name).stem


def existing_videos(archive: ArchivePlan) -> list[ImportedVideo]:
    if not archive.local_extract_dir.exists():
        return []
    videos: list[ImportedVideo] = []
    for path in sorted(archive.local_extract_dir.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in VIDEO_SUFFIXES:
            continue
        try:
            inner = path.resolve().relative_to(archive.local_extract_dir.resolve())
        except ValueError:
            continue
        source_video_path = source_video_path_for(inner, archive.sign_slug)
        videos.append(
            ImportedVideo(
                path=path,
                source_video_path=source_video_path,
                source_signer_alias=signer_alias_from_source_path(source_video_path),
                sha256=sha256_file(path),
            )
        )
    return videos


def extract_member(member: tarfile.TarInfo, source: tarfile.TarFile, archive: ArchivePlan) -> bool:
    inner_path = safe_member_inner_path(member.name, archive.sign_slug)
    if inner_path is None:
        return False
    destination = (archive.local_extract_dir / inner_path).resolve()
    try:
        destination.relative_to(archive.local_extract_dir.resolve())
    except ValueError as error:
        raise ImportErrorForUser(f"tar member escapes extract dir: {member.name}") from error
    if destination.exists() and destination.stat().st_size == member.size:
        return True
    handle = source.extractfile(member)
    if handle is None:
        return False
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path = destination.with_suffix(destination.suffix + ".partial")
    with handle, temp_path.open("wb") as output:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            output.write(chunk)
    temp_path.replace(destination)
    return True


def extract_from_local_archive(archive: ArchivePlan, needed_count: int) -> int:
    if not archive.local_archive_path.exists():
        return 0
    extracted = 0
    try:
        with tarfile.open(archive.local_archive_path, mode="r:*") as source:
            for member in source:
                if len(existing_videos(archive)) >= needed_count:
                    break
                if not member.isfile():
                    continue
                if extract_member(member, source, archive):
                    extracted += 1
    except tarfile.TarError as error:
        raise ImportErrorForUser(f"unable to read local archive {archive.local_archive_path}: {error}") from error
    return extracted


def extract_from_streamed_archive(archive: ArchivePlan, needed_count: int, timeout: float) -> int:
    request = urllib.request.Request(
        archive.archive_url,
        headers={"User-Agent": "asl-pilot-popsign-import/1.0"},
    )
    extracted = 0
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = getattr(response, "status", 200)
            if status != 200:
                raise ImportErrorForUser(f"{archive.archive_url} returned HTTP {status}")
            with tarfile.open(fileobj=response, mode="r|*") as source:
                for member in source:
                    if len(existing_videos(archive)) >= needed_count:
                        break
                    if not member.isfile():
                        continue
                    if extract_member(member, source, archive):
                        extracted += 1
    except urllib.error.URLError as error:
        raise ImportErrorForUser(f"unable to stream {archive.archive_url}: {error}") from error
    except TimeoutError as error:
        if len(existing_videos(archive)) < needed_count:
            raise ImportErrorForUser(f"timed out while streaming tar {archive.archive_url}: {error}") from error
    except tarfile.TarError as error:
        if len(existing_videos(archive)) < needed_count:
            raise ImportErrorForUser(f"unable to stream tar {archive.archive_url}: {error}") from error
    return extracted


def ensure_imported_videos(
    archive: ArchivePlan,
    needed_count: int,
    download_missing: str,
    timeout: float,
    stream_retries: int,
) -> tuple[list[ImportedVideo], dict[str, Any]]:
    before = existing_videos(archive)
    extracted_from_local = 0
    extracted_from_stream = 0
    if len(before) < needed_count:
        extracted_from_local = extract_from_local_archive(archive, needed_count)
    after_local = existing_videos(archive)
    stream_retry_errors: list[str] = []
    if len(after_local) < needed_count and download_missing == "stream":
        attempts = max(1, stream_retries)
        for attempt in range(attempts):
            try:
                extracted_from_stream += extract_from_streamed_archive(archive, needed_count, timeout)
            except ImportErrorForUser as error:
                stream_retry_errors.append(str(error))
                if len(existing_videos(archive)) >= needed_count:
                    break
                if attempt + 1 >= attempts:
                    raise ImportErrorForUser(
                        f"unable to import {archive.source_split}/{archive.label_id} "
                        f"after {attempts} stream attempts: {error}"
                    ) from error
                time.sleep(min(30, 5 * (attempt + 1)))
                continue
            if len(existing_videos(archive)) >= needed_count:
                break
    final = existing_videos(archive)
    return final[:needed_count], {
        "source_split": archive.source_split,
        "manifest_split": archive.manifest_split,
        "label_id": archive.label_id,
        "sign_slug": archive.sign_slug,
        "available_videos": len(final),
        "selected_videos": min(len(final), needed_count),
        "local_archive_exists": archive.local_archive_path.exists(),
        "extracted_from_local_archive": extracted_from_local,
        "extracted_from_stream": extracted_from_stream,
        "stream_retry_errors": stream_retry_errors,
        "extract_dir": project_relative(archive.local_extract_dir),
    }


def source_review_reference(source_review_path: Path) -> dict[str, str]:
    return {
        "path": project_relative(source_review_path),
        "sha256": sha256_file(source_review_path),
    }


def clip_record(
    archive: ArchivePlan,
    video: ImportedVideo,
    index: int,
    manifest_path: Path,
    source_decision: dict[str, Any],
    source_review: dict[str, str],
    reviewed_at: str,
) -> dict[str, Any]:
    signer_hash = sha256_text(f"popsign-v1-source-signer:{video.source_signer_alias}")
    clip_index = str(index + 1).zfill(6)
    source_record_id = (
        f"popsign_v1_0/game/{archive.source_split}/"
        f"{video.source_video_path}"
    )
    return {
        "clip_id": f"popsign-v1-{archive.manifest_split}-{archive.label_id}-{clip_index}",
        "source_id": SOURCE_ID,
        "source_license_decision": source_decision["decision_id"],
        "source_license_review_status": source_decision["license_review_status"],
        "source_record_id": source_record_id,
        "source_split": archive.source_split,
        "source_category": "game",
        "source_sign_slug": archive.sign_slug,
        "source_archive_url": archive.archive_url,
        "source_video_path": video.source_video_path,
        "source_subject_rights_evidence": source_review,
        "signer_id": f"popsign-signer-{signer_hash[:16]}",
        "signer_identity_hash": signer_hash,
        "label_id": archive.label_id,
        "relative_video_path": manifest_relative(manifest_path, video.path),
        "sha256": video.sha256,
        "split": archive.manifest_split,
        "frame_source": "raw_rgb_video",
        "allowed_for_model_training": True,
        "derived_features": [],
        "review": {
            "label_reviewer": "popsign-source-label-plus-asl-pilot-import-audit",
            "label_review_status": "approved",
            "reviewed_at": reviewed_at,
        },
    }


def manifest_for_split(
    manifest_path: Path,
    manifest_split: str,
    labels: list[dict[str, str]],
    clips: list[dict[str, Any]],
    plan: dict[str, Any],
    vocabulary_review: dict[str, Any],
    created_at: str,
) -> dict[str, Any]:
    return {
        "schema_version": MANIFEST_SCHEMA_VERSION,
        "dataset_id": DATASET_ID,
        "dataset_source_mode": DATASET_SOURCE_MODE,
        "split": manifest_split,
        "created_at": created_at,
        "provenance_owner": "asl-pilot team",
        "source_register": plan["source_register"],
        "external_dataset_import": {
            "source_id": SOURCE_ID,
            "source_audit": plan["source_audit"],
        },
        "vocabulary_review": vocabulary_review,
        "preprocessing": {
            "allowed_steps": PREPROCESSING_STEPS,
        },
        "labels": labels,
        "clips": clips,
    }


def check_manifest_completeness(
    archives: list[ArchivePlan],
    selected: dict[tuple[str, str], list[ImportedVideo]],
    expected_counts: dict[str, int],
) -> list[str]:
    blockers: list[str] = []
    for archive in archives:
        expected_count = expected_counts[archive.source_split]
        count = len(selected.get((archive.source_split, archive.label_id), []))
        if count < expected_count:
            blockers.append(
                f"{archive.source_split}/{archive.label_id} has {count}/{expected_count} imported videos"
            )
    return blockers


def requested_clip_counts(args: argparse.Namespace) -> dict[str, int]:
    counts = {
        "train": args.train_clips_per_label or args.clips_per_label_split,
        "val": args.validation_clips_per_label or args.clips_per_label_split,
        "test": args.test_clips_per_label or args.clips_per_label_split,
    }
    for split, value in counts.items():
        if value <= 0:
            raise ImportErrorForUser(f"{split} clips per label must be greater than zero")
    return counts


def main() -> int:
    args = parse_args()
    if args.clips_per_label_split <= 0:
        print("PopSign import failed: --clips-per-label-split must be greater than zero", file=sys.stderr)
        return 2
    try:
        plan_path = resolve_project_path(args.plan, "--plan")
        manifest_dir = resolve_project_path(args.manifest_dir, "--manifest-dir")
        plan = read_json(plan_path)
        source_decision, vocabulary_review, source_review_path = validate_plan(plan)
        selected_splits = set(args.split or SPLIT_TO_MANIFEST_SPLIT)
        selected_labels = set(args.label or [])
        archives = archive_plans(plan, selected_splits, selected_labels)
        labels = labels_from_archives(archives)
        clips_per_label_by_source_split = requested_clip_counts(args)
        created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        selected: dict[tuple[str, str], list[ImportedVideo]] = {}
        archive_summaries: list[dict[str, Any]] = []

        for archive in archives:
            requested_count = clips_per_label_by_source_split[archive.source_split]
            videos, summary = ensure_imported_videos(
                archive,
                requested_count,
                args.download_missing,
                args.request_timeout,
                args.stream_retries,
            )
            summary["requested_videos"] = requested_count
            selected[(archive.source_split, archive.label_id)] = videos
            archive_summaries.append(summary)

        blockers = check_manifest_completeness(archives, selected, clips_per_label_by_source_split)
        if blockers and not args.allow_partial:
            raise ImportErrorForUser(
                "not enough PopSign videos imported for final manifests: "
                + "; ".join(blockers[:10])
                + ("; ..." if len(blockers) > 10 else "")
            )

        source_review = source_review_reference(source_review_path)
        manifest_paths = {
            "train": manifest_dir / "train.json",
            "validation": manifest_dir / "validation.json",
            "test": manifest_dir / "test.json",
        }
        clips_by_manifest_split: dict[str, list[dict[str, Any]]] = {
            "train": [],
            "validation": [],
            "test": [],
        }
        for archive in archives:
            manifest_path = manifest_paths[archive.manifest_split]
            videos = selected.get((archive.source_split, archive.label_id), [])
            start = len(clips_by_manifest_split[archive.manifest_split])
            for offset, video in enumerate(videos):
                clips_by_manifest_split[archive.manifest_split].append(
                    clip_record(
                        archive,
                        video,
                        start + offset,
                        manifest_path,
                        source_decision,
                        source_review,
                        created_at,
                    )
                )

        manifests = {}
        for manifest_split, clips in clips_by_manifest_split.items():
            if not clips and not args.allow_partial:
                continue
            manifests[manifest_split] = manifest_for_split(
                manifest_paths[manifest_split],
                manifest_split,
                labels,
                clips,
                plan,
                vocabulary_review,
                created_at,
            )

        if args.write:
            manifest_dir.mkdir(parents=True, exist_ok=True)
            for manifest_split, manifest in manifests.items():
                write_json(manifest_paths[manifest_split], manifest)

        print(
            json.dumps(
                {
                    "status": "partial" if blockers else "ready",
                    "wrote": args.write,
                    "download_missing": args.download_missing,
                    "plan": project_relative(plan_path),
                    "manifest_dir": project_relative(manifest_dir),
                    "label_count": len(labels),
                    "clips_per_label_split": args.clips_per_label_split,
                    "clips_per_label_by_source_split": clips_per_label_by_source_split,
                    "clips_per_label_by_manifest_split": {
                        SPLIT_TO_MANIFEST_SPLIT[split]: count
                        for split, count in clips_per_label_by_source_split.items()
                    },
                    "stream_retries": args.stream_retries,
                    "manifest_clip_counts": {
                        split: len(clips) for split, clips in clips_by_manifest_split.items()
                    },
                    "archive_count": len(archives),
                    "archive_summaries": archive_summaries if args.verbose_archives else archive_summaries[:10],
                    "archive_summaries_truncated": not args.verbose_archives and len(archive_summaries) > 10,
                    "blocker_count": len(blockers),
                    "blockers": blockers[:20],
                },
                indent=2,
            )
        )
        return 0 if not blockers or args.allow_partial else 1
    except ImportErrorForUser as error:
        print(f"PopSign import failed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
