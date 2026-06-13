#!/usr/bin/env python3
"""Range-extract one raw clip per off-active-module ASL Citizen label.

Reads the existing zip-index probe at
``docs/research/asl-citizen-non-target-zip-index-probe.json`` and HTTP-range
extracts one ``.mp4`` per requested label from the published ASL Citizen ZIP.
Computes SHA-256 and verifies CRC-32 for each extracted clip and emits a
machine-readable provenance report.

This script is the negative-challenge ``non_target_asl_sign`` lane equivalent
of ``download_asl_citizen_selected_raw_clips.py``. It deliberately does NOT
consume the official train/val/test split CSVs because negative-challenge
clips are not assigned to training splits.

Hard limits:
- Does not download the full archive.
- Does not redistribute raw clips (raw videos remain outside git via
  ``data/external/asl-citizen/raw/*``).
- Does not introduce pretrained, pose, landmark, or feature artifacts.
- Source-register decision id ``approved_asl_citizen_school_assignment_raw_videos_2026_05_21``
  already covers this scope; this script does not add a new source.
"""

from __future__ import annotations

import argparse
import binascii
import hashlib
import json
import struct
import sys
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import probe_asl_citizen_zip_index as zip_probe


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROBE = ROOT / "docs" / "research" / "asl-citizen-non-target-zip-index-probe.json"
DEFAULT_OUTPUT = ROOT / "docs" / "research" / "asl-citizen-non-target-extracted-clips.json"
DEFAULT_RAW_ROOT = ROOT / "data" / "external" / "asl-citizen" / "raw" / "non-target"
DEFAULT_LABELS = ["computer", "door", "key", "money", "tree"]


class ExtractError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe", type=Path, default=DEFAULT_PROBE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--raw-root", type=Path, default=DEFAULT_RAW_ROOT)
    parser.add_argument(
        "--labels",
        default=",".join(DEFAULT_LABELS),
        help=(
            "Comma-separated labels to extract. Each label must have at least "
            "one match in --probe."
        ),
    )
    parser.add_argument("--write", action="store_true")
    return parser.parse_args()


def stable_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True) + "\n"


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_entry_bytes(url: str, entry: dict[str, Any]) -> bytes:
    header = zip_probe.fetch_range(
        url, entry["local_header_offset"], entry["local_header_offset"] + 4095
    )
    if header[:4] != b"PK\x03\x04":
        raise ExtractError(f"bad local header for {entry['path']}")
    fields = struct.unpack_from("<IHHHHHIIIHH", header, 0)
    name_len = fields[9]
    extra_len = fields[10]
    data_start = entry["local_header_offset"] + 30 + name_len + extra_len
    compressed = zip_probe.fetch_range(
        url, data_start, data_start + entry["compressed_size"] - 1
    )
    if entry["method"] == 0:
        data = compressed
    elif entry["method"] == 8:
        data = zlib.decompress(compressed, -15)
    else:
        raise ExtractError(
            f"unsupported ZIP compression method {entry['method']} for {entry['path']}"
        )
    if len(data) != entry["uncompressed_size"]:
        raise ExtractError(
            f"uncompressed size mismatch for {entry['path']}: expected "
            f"{entry['uncompressed_size']}, got {len(data)}"
        )
    crc32 = f"{binascii.crc32(data) & 0xFFFFFFFF:08x}"
    if crc32 != entry["crc32"]:
        raise ExtractError(
            f"CRC mismatch for {entry['path']}: expected {entry['crc32']}, got {crc32}"
        )
    return data


def select_smallest_clip(matches: list[dict[str, Any]]) -> dict[str, Any]:
    if not matches:
        raise ExtractError("no matches available")
    return min(matches, key=lambda m: (m["compressed_size"], m["path"]))


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    probe = json.loads(args.probe.read_text(encoding="utf-8"))
    archive_url = probe["archive"]["url"]
    zip_probe.args_url.set(archive_url)
    requested = [label.strip() for label in args.labels.split(",") if label.strip()]
    if len(requested) < 1:
        raise ExtractError("--labels is empty")

    extracted: list[dict[str, Any]] = []
    seen_sha256: set[str] = set()
    blockers: list[str] = []

    for label in requested:
        matches = probe.get("matches", {}).get(label)
        if not matches:
            blockers.append(f"label '{label}' has no matches in probe")
            continue
        clip = select_smallest_clip(matches)
        destination = args.raw_root / label / Path(clip["path"]).name

        if args.write:
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists() and destination.stat().st_size == clip["uncompressed_size"]:
                existing_sha = sha256_file(destination)
            else:
                data = extract_entry_bytes(archive_url, clip)
                destination.write_bytes(data)
                existing_sha = sha256_file(destination)
            size_bytes = destination.stat().st_size
            sha256 = existing_sha
        else:
            sha256 = None
            size_bytes = clip["uncompressed_size"]

        if sha256 and sha256 in seen_sha256:
            blockers.append(f"duplicate sha256 detected for {label}: {sha256}")
        if sha256:
            seen_sha256.add(sha256)

        extracted.append({
            "label": label,
            "challenge_type": "non_target_asl_sign",
            "source_archive_path": clip["path"],
            "source_archive_local_header_offset": clip["local_header_offset"],
            "source_archive_compressed_size": clip["compressed_size"],
            "source_archive_uncompressed_size": clip["uncompressed_size"],
            "source_archive_crc32": clip["crc32"],
            "source_archive_method": clip["method"],
            "relative_video_path": project_relative(destination) if args.write else None,
            "sha256": sha256,
            "size_bytes": size_bytes,
        })

    return {
        "schema_version": "asl-pilot-asl-citizen-non-target-extracted-clips/v1",
        "status": "extracted" if args.write and not blockers else (
            "dry_run" if not args.write else "failed"
        ),
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": {"path": project_relative(Path(__file__))},
            "command": sys.argv,
        },
        "archive": {
            "url": archive_url,
            "content_length": probe["archive"].get("content_length"),
            "etag": probe["archive"].get("etag"),
            "last_modified": probe["archive"].get("last_modified"),
        },
        "source_register": {
            "source_id": "asl-citizen-school-assignment-raw-videos",
            "decision_id": "approved_asl_citizen_school_assignment_raw_videos_2026_05_21",
        },
        "decision_boundary": {
            "downloads_full_archive": False,
            "downloads_selected_raw_clips": args.write,
            "extracts_media": args.write,
            "redistribute_raw_or_modified_data": False,
            "trains_weights": False,
            "promotes_model": False,
        },
        "probe_source": {
            "path": project_relative(args.probe),
            "sha256": sha256_file(args.probe),
        },
        "raw_root": project_relative(args.raw_root),
        "requested_labels": requested,
        "extracted_count": sum(1 for clip in extracted if clip["sha256"]),
        "selected_count": len(extracted),
        "clips": extracted,
        "blockers": blockers,
    }


def main() -> int:
    args = parse_args()
    if not args.output.resolve().is_relative_to(ROOT):
        raise ExtractError(f"--output escapes project root: {args.output}")
    if not args.raw_root.resolve().is_relative_to(ROOT):
        raise ExtractError(f"--raw-root escapes project root: {args.raw_root}")
    report = build_report(args)
    if args.write and not report["blockers"]:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(stable_json(report), encoding="utf-8")
    print(stable_json({
        "status": report["status"],
        "output": project_relative(args.output) if args.write else None,
        "selected_count": report["selected_count"],
        "extracted_count": report["extracted_count"],
        "blockers": report["blockers"],
    }))
    return 0 if not report["blockers"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
