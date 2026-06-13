#!/usr/bin/env python3
"""Download selected ASL Citizen raw clips from the remote ZIP by byte range."""

from __future__ import annotations

import argparse
import binascii
import csv
import hashlib
import io
import json
import re
import shutil
import struct
import sys
import zlib
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import probe_asl_citizen_zip_index as zip_probe


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "docs" / "research" / "asl-citizen-selected-raw-clip-import.json"
DEFAULT_RAW_ROOT = ROOT / "data" / "external" / "asl-citizen" / "raw" / "selected"
DEFAULT_SPLIT_ROOT = ROOT / "data" / "external" / "asl-citizen" / "raw" / "splits"
SPLIT_PATHS = {
    "train": "ASL_Citizen/splits/train.csv",
    "validation": "ASL_Citizen/splits/val.csv",
    "test": "ASL_Citizen/splits/test.csv",
}


class AslCitizenImportError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=zip_probe.DEFAULT_URL)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--raw-root", type=Path, default=DEFAULT_RAW_ROOT)
    parser.add_argument("--split-root", type=Path, default=DEFAULT_SPLIT_ROOT)
    parser.add_argument("--label-file", type=Path, default=ROOT / "docs" / "validation" / "prompt-verifier-subset-manifests.json")
    parser.add_argument("--labels", help="Comma-separated label ids to import instead of --label-file")
    parser.add_argument("--manifest-label-file", type=Path, help="Manifest JSON whose labels array supplies label ids")
    parser.add_argument("--max-train-per-label", type=int, default=12)
    parser.add_argument("--max-validation-per-label", type=int, default=4)
    parser.add_argument("--max-test-per-label", type=int, default=4)
    parser.add_argument("--tail-bytes", type=int, default=1024 * 1024)
    return parser.parse_args()


def stable_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True) + "\n"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stable_json(value), encoding="utf-8")


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_gloss(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def load_labels(args: argparse.Namespace) -> list[str]:
    if args.labels:
        return [label.strip() for label in args.labels.split(",") if label.strip()]
    if args.manifest_label_file:
        data = json.loads(args.manifest_label_file.read_text(encoding="utf-8"))
        labels = data.get("labels")
        if not isinstance(labels, list) or not all(isinstance(item, dict) for item in labels):
            raise AslCitizenImportError(f"could not load labels array from {args.manifest_label_file}")
        return [str(item["label_id"]) for item in labels]
    path = args.label_file
    data = json.loads(path.read_text(encoding="utf-8"))
    labels = data.get("selection", {}).get("selected_label_ids")
    if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
        raise AslCitizenImportError(f"could not load selection.selected_label_ids from {path}")
    return labels


def central_directory_entries(url: str, tail_bytes: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    zip_probe.args_url.set(url)
    archive = zip_probe.head(url)
    archive_size = archive["content_length"]
    tail_size = min(tail_bytes, archive_size)
    tail_start = archive_size - tail_size
    tail = zip_probe.fetch_range(url, tail_start, archive_size - 1)
    eocd = zip_probe.parse_eocd(tail, archive_size, tail_start)
    cd = zip_probe.fetch_range(
        url,
        eocd["central_directory_offset"],
        eocd["central_directory_offset"] + eocd["central_directory_size"] - 1,
    )
    return {**archive, **eocd}, zip_probe.parse_central_directory(cd, eocd["entries_total"])


def extract_entry_bytes(url: str, entry: dict[str, Any]) -> bytes:
    header = zip_probe.fetch_range(url, entry["local_header_offset"], entry["local_header_offset"] + 4095)
    if header[:4] != b"PK\x03\x04":
        raise AslCitizenImportError(f"bad local header for {entry['path']}")
    fields = struct.unpack_from("<IHHHHHIIIHH", header, 0)
    name_len = fields[9]
    extra_len = fields[10]
    data_start = entry["local_header_offset"] + 30 + name_len + extra_len
    compressed = zip_probe.fetch_range(url, data_start, data_start + entry["compressed_size"] - 1)
    if entry["method"] == 0:
        data = compressed
    elif entry["method"] == 8:
        data = zlib.decompress(compressed, -15)
    else:
        raise AslCitizenImportError(f"unsupported ZIP compression method {entry['method']} for {entry['path']}")
    if len(data) != entry["uncompressed_size"]:
        raise AslCitizenImportError(
            f"uncompressed size mismatch for {entry['path']}: expected {entry['uncompressed_size']}, got {len(data)}"
        )
    crc32 = f"{binascii.crc32(data) & 0xFFFFFFFF:08x}"
    if crc32 != entry["crc32"]:
        raise AslCitizenImportError(f"CRC mismatch for {entry['path']}: expected {entry['crc32']}, got {crc32}")
    return data


def parse_split_csv(data: bytes) -> list[dict[str, str]]:
    text = data.decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def load_split_rows(url: str, entries_by_path: dict[str, dict[str, Any]], split_root: Path, write: bool) -> dict[str, list[dict[str, str]]]:
    output: dict[str, list[dict[str, str]]] = {}
    for split, zip_path in SPLIT_PATHS.items():
        data = extract_entry_bytes(url, entries_by_path[zip_path])
        if write:
            destination = split_root / Path(zip_path).name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
        output[split] = parse_split_csv(data)
    return output


def select_rows(
    labels: list[str],
    split_rows: dict[str, list[dict[str, str]]],
    entries_by_video_file: dict[str, dict[str, Any]],
    limits: dict[str, int],
) -> dict[str, dict[str, list[dict[str, Any]]]]:
    selected: dict[str, dict[str, list[dict[str, Any]]]] = {label: {split: [] for split in SPLIT_PATHS} for label in labels}
    normalized_to_label = {normalize_gloss(label): label for label in labels}
    for split, rows in split_rows.items():
        by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in rows:
            label = normalized_to_label.get(normalize_gloss(row.get("Gloss", "")))
            if label is None:
                continue
            video_file = row.get("Video file", "")
            entry = entries_by_video_file.get(video_file)
            if entry is None:
                continue
            by_label[label].append({
                "split": split,
                "participant_id": row.get("Participant ID"),
                "video_file": video_file,
                "gloss": row.get("Gloss"),
                "asl_lex_code": row.get("ASL-LEX Code"),
                "entry": entry,
            })
        for label, candidates in by_label.items():
            candidates.sort(key=lambda item: (item["entry"]["uncompressed_size"], item["video_file"]))
            selected[label][split] = candidates[: limits[split]]
    return selected


def destination_for(raw_root: Path, label: str, split: str, video_file: str) -> Path:
    return raw_root / label / split / video_file


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    labels = load_labels(args)
    archive, entries = central_directory_entries(args.url, args.tail_bytes)
    entries_by_path = {entry["path"]: entry for entry in entries}
    missing_splits = [path for path in SPLIT_PATHS.values() if path not in entries_by_path]
    if missing_splits:
        raise AslCitizenImportError(f"missing split CSV entries in archive: {missing_splits}")
    split_rows = load_split_rows(args.url, entries_by_path, args.split_root, args.write)
    video_entries = [
        entry
        for entry in entries
        if entry["path"].startswith("ASL_Citizen/videos/") and entry["extension"] in zip_probe.VIDEO_EXTENSIONS
    ]
    entries_by_video_file = {Path(entry["path"]).name: entry for entry in video_entries}
    limits = {
        "train": args.max_train_per_label,
        "validation": args.max_validation_per_label,
        "test": args.max_test_per_label,
    }
    selected = select_rows(labels, split_rows, entries_by_video_file, limits)
    imported = []
    selected_counts: dict[str, dict[str, int]] = {}
    total_bytes = 0
    for label in labels:
        selected_counts[label] = {}
        for split in SPLIT_PATHS:
            rows = selected[label][split]
            selected_counts[label][split] = len(rows)
            for row in rows:
                entry = row["entry"]
                destination = destination_for(args.raw_root, label, split, row["video_file"])
                if args.write:
                    if not destination.exists() or destination.stat().st_size != entry["uncompressed_size"]:
                        data = extract_entry_bytes(args.url, entry)
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        destination.write_bytes(data)
                    sha256 = sha256_file(destination)
                    size_bytes = destination.stat().st_size
                else:
                    sha256 = None
                    size_bytes = entry["uncompressed_size"]
                total_bytes += size_bytes
                imported.append({
                    "label_id": label,
                    "split": split,
                    "participant_id": row["participant_id"],
                    "gloss": row["gloss"],
                    "asl_lex_code": row["asl_lex_code"],
                    "source_archive_path": entry["path"],
                    "source_archive_local_header_offset": entry["local_header_offset"],
                    "source_archive_compressed_size": entry["compressed_size"],
                    "source_archive_uncompressed_size": entry["uncompressed_size"],
                    "source_archive_crc32": entry["crc32"],
                    "relative_video_path": project_relative(destination),
                    "sha256": sha256,
                    "size_bytes": size_bytes,
                })
    labels_missing = [
        label
        for label, counts in selected_counts.items()
        if any(counts[split] == 0 for split in SPLIT_PATHS)
    ]
    return {
        "schema_version": "asl-pilot-asl-citizen-selected-raw-clip-import/v1",
        "status": "selected_raw_clips_imported" if args.write else "dry_run_selected_raw_clips_not_imported",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": {
                "path": project_relative(Path(__file__)),
            },
            "command": sys.argv,
        },
        "archive": {
            "url": args.url,
            "content_length": archive["content_length"],
            "accept_ranges": archive["accept_ranges"],
            "etag": archive["etag"],
            "last_modified": archive["last_modified"],
            "central_directory_size": archive["central_directory_size"],
            "entries_total": archive["entries_total"],
        },
        "assignment_scope": {
            "source_id": "asl-citizen-school-assignment-raw-videos",
            "raw_video_only": True,
            "noncommercial_school_assignment": True,
            "redistribute_raw_or_modified_data": False,
            "no_pretrained_or_derived_cv_inputs": True,
        },
        "decision_boundary": {
            "downloads_full_archive": False,
            "downloads_selected_raw_clips": args.write,
            "uses_official_splits": True,
            "trains_weights": False,
            "promotes_model": False,
        },
        "label_source": (
            {"type": "explicit_labels", "labels": labels}
            if args.labels
            else {"type": "manifest_labels", "path": project_relative(args.manifest_label_file)}
            if args.manifest_label_file
            else {"type": "prompt_verifier_subset", "path": project_relative(args.label_file)}
        ),
        "raw_root": project_relative(args.raw_root),
        "split_root": project_relative(args.split_root),
        "selection_limits": limits,
        "label_count": len(labels),
        "selected_clip_count": len(imported),
        "selected_total_bytes": total_bytes,
        "selected_counts": selected_counts,
        "labels_missing_any_split": labels_missing,
        "split_csv_rows": {split: len(rows) for split, rows in split_rows.items()},
        "clips": imported,
        "blockers": [
            f"labels missing at least one official split: {', '.join(labels_missing)}"
        ] if labels_missing else [],
    }


def main() -> int:
    args = parse_args()
    if args.output.resolve().is_relative_to(ROOT) is False:
        raise AslCitizenImportError(f"--output escapes project root: {args.output}")
    if args.raw_root.resolve().is_relative_to(ROOT) is False:
        raise AslCitizenImportError(f"--raw-root escapes project root: {args.raw_root}")
    report = build_report(args)
    if args.write:
        write_json(args.output, report)
    print(stable_json({
        "status": report["status"],
        "output": project_relative(args.output) if args.write else None,
        "label_count": report["label_count"],
        "selected_clip_count": report["selected_clip_count"],
        "selected_total_bytes": report["selected_total_bytes"],
        "labels_missing_any_split": report["labels_missing_any_split"],
        "blockers": report["blockers"],
    }))
    return 0 if not report["blockers"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
