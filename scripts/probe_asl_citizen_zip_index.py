#!/usr/bin/env python3
"""Probe the ASL Citizen ZIP central directory without downloading the archive."""

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_URL = "https://download.microsoft.com/download/b/8/8/b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip"
DEFAULT_OUTPUT = ROOT / "docs" / "research" / "asl-citizen-zip-index-probe.json"
EOCD_SIGNATURE = b"PK\x05\x06"
ZIP64_LOCATOR_SIGNATURE = b"PK\x06\x07"
ZIP64_EOCD_SIGNATURE = b"PK\x06\x06"
CD_SIGNATURE = 0x02014B50
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"}


class ZipProbeError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--label-file", type=Path, default=ROOT / "docs" / "validation" / "prompt-verifier-subset-manifests.json")
    parser.add_argument("--max-matches-per-label", type=int, default=40)
    parser.add_argument("--tail-bytes", type=int, default=1024 * 1024)
    return parser.parse_args()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def stable_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True) + "\n"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stable_json(value), encoding="utf-8")


def request(url: str, headers: dict[str, str] | None = None, method: str = "GET") -> urllib.response.addinfourl:
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}, method=method), timeout=120)


def head(url: str) -> dict[str, Any]:
    with request(url, method="HEAD") as response:
        headers = {key.lower(): value for key, value in response.headers.items()}
        length = int(headers.get("content-length", "0"))
        return {
            "status": response.status,
            "content_length": length,
            "accept_ranges": headers.get("accept-ranges"),
            "etag": headers.get("etag"),
            "last_modified": headers.get("last-modified"),
            "content_disposition": headers.get("content-disposition"),
        }


def fetch_range(url: str, start: int, end: int) -> bytes:
    if start < 0 or end < start:
        raise ZipProbeError(f"invalid byte range {start}-{end}")
    with request(url, headers={"Range": f"bytes={start}-{end}"}) as response:
        if response.status != 206:
            raise ZipProbeError(f"range request {start}-{end} returned HTTP {response.status}")
        return response.read()


def parse_eocd(tail: bytes, archive_size: int, tail_start: int) -> dict[str, Any]:
    index = tail.rfind(EOCD_SIGNATURE)
    if index < 0:
        raise ZipProbeError("EOCD signature not found in ZIP tail")
    if index + 22 > len(tail):
        raise ZipProbeError("truncated EOCD record")
    fields = struct.unpack_from("<IHHHHIIH", tail, index)
    comment_len = fields[-1]
    if index + 22 + comment_len > len(tail):
        raise ZipProbeError("EOCD comment extends beyond fetched tail")
    eocd_offset = tail_start + index
    locator_offset = eocd_offset - 20
    result = {
        "eocd_offset": eocd_offset,
        "entries_total": fields[4],
        "central_directory_size": fields[5],
        "central_directory_offset": fields[6],
        "comment_length": comment_len,
        "zip64": False,
    }
    if fields[4] != 0xFFFF and fields[5] != 0xFFFFFFFF and fields[6] != 0xFFFFFFFF:
        return result
    if locator_offset < tail_start:
        raise ZipProbeError("ZIP64 locator is outside fetched tail")
    locator_index = locator_offset - tail_start
    if tail[locator_index:locator_index + 4] != ZIP64_LOCATOR_SIGNATURE:
        raise ZipProbeError("ZIP64 locator signature not found")
    _sig, _disk, zip64_eocd_offset, _disks = struct.unpack_from("<IIQI", tail, locator_index)
    zip64_record = fetch_range(args_url.get(), zip64_eocd_offset, zip64_eocd_offset + 75)
    if zip64_record[:4] != ZIP64_EOCD_SIGNATURE:
        raise ZipProbeError("ZIP64 EOCD signature not found")
    (
        _sig,
        _size,
        _made_by,
        _needed,
        _disk,
        _cd_disk,
        _entries_disk,
        entries_total,
        cd_size,
        cd_offset,
    ) = struct.unpack_from("<IQHHIIQQQQ", zip64_record, 0)
    return {
        **result,
        "zip64": True,
        "zip64_eocd_offset": zip64_eocd_offset,
        "entries_total": entries_total,
        "central_directory_size": cd_size,
        "central_directory_offset": cd_offset,
    }


class UrlBox:
    value: str = ""

    def set(self, value: str) -> None:
        self.value = value

    def get(self) -> str:
        return self.value


args_url = UrlBox()


def parse_zip64_extra(extra: bytes, compressed_size: int, uncompressed_size: int, offset: int) -> tuple[int, int, int]:
    cursor = 0
    while cursor + 4 <= len(extra):
        header_id, size = struct.unpack_from("<HH", extra, cursor)
        cursor += 4
        data = extra[cursor:cursor + size]
        cursor += size
        if header_id != 0x0001:
            continue
        data_cursor = 0
        if uncompressed_size == 0xFFFFFFFF:
            uncompressed_size = struct.unpack_from("<Q", data, data_cursor)[0]
            data_cursor += 8
        if compressed_size == 0xFFFFFFFF:
            compressed_size = struct.unpack_from("<Q", data, data_cursor)[0]
            data_cursor += 8
        if offset == 0xFFFFFFFF:
            offset = struct.unpack_from("<Q", data, data_cursor)[0]
        break
    return compressed_size, uncompressed_size, offset


def parse_central_directory(data: bytes, expected_entries: int) -> list[dict[str, Any]]:
    entries = []
    cursor = 0
    while cursor + 46 <= len(data):
        signature = struct.unpack_from("<I", data, cursor)[0]
        if signature != CD_SIGNATURE:
            raise ZipProbeError(f"unexpected central-directory signature at byte {cursor}: {signature:#x}")
        (
            _sig,
            _made_by,
            _needed,
            flags,
            method,
            _mtime,
            _mdate,
            crc32,
            compressed_size,
            uncompressed_size,
            name_len,
            extra_len,
            comment_len,
            _disk_start,
            _internal_attr,
            _external_attr,
            local_header_offset,
        ) = struct.unpack_from("<IHHHHHHIIIHHHHHII", data, cursor)
        cursor += 46
        name_bytes = data[cursor:cursor + name_len]
        cursor += name_len
        extra = data[cursor:cursor + extra_len]
        cursor += extra_len
        comment = data[cursor:cursor + comment_len]
        cursor += comment_len
        compressed_size, uncompressed_size, local_header_offset = parse_zip64_extra(
            extra,
            compressed_size,
            uncompressed_size,
            local_header_offset,
        )
        encoding = "utf-8" if flags & 0x800 else "cp437"
        filename = name_bytes.decode(encoding, errors="replace")
        entries.append({
            "path": filename,
            "method": method,
            "crc32": f"{crc32:08x}",
            "compressed_size": compressed_size,
            "uncompressed_size": uncompressed_size,
            "local_header_offset": local_header_offset,
            "is_dir": filename.endswith("/"),
            "extension": Path(filename).suffix.lower(),
        })
    if len(entries) != expected_entries:
        raise ZipProbeError(f"central-directory entry count mismatch: expected {expected_entries}, parsed {len(entries)}")
    return entries


def label_tokens(label: str) -> set[str]:
    normalized = label.lower().replace("_", " ")
    tokens = {normalized, normalized.replace(" ", "_"), normalized.replace(" ", "-")}
    tokens.add(re.sub(r"[^a-z0-9]+", "", normalized))
    return {token for token in tokens if token}


def entry_matches_label(entry: dict[str, Any], label: str) -> bool:
    path = entry["path"].lower()
    components = [component.lower() for component in re.split(r"[/\\\\]+", entry["path"])]
    stem = Path(entry["path"]).stem.lower()
    for token in label_tokens(label):
        if token in components or token == stem:
            return True
        if re.search(rf"(^|[^a-z0-9]){re.escape(token)}([^a-z0-9]|$)", path):
            return True
    return False


def load_labels(label_file: Path) -> list[str]:
    data = read_json(label_file)
    labels = data.get("selection", {}).get("selected_label_ids")
    if isinstance(labels, list) and all(isinstance(label, str) for label in labels):
        return labels
    raise ZipProbeError(f"could not load selection.selected_label_ids from {label_file}")


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    args_url.set(args.url)
    archive = head(args.url)
    if archive["accept_ranges"] != "bytes":
        raise ZipProbeError("ASL Citizen archive does not advertise byte-range support")
    archive_size = archive["content_length"]
    tail_size = min(args.tail_bytes, archive_size)
    tail_start = archive_size - tail_size
    tail = fetch_range(args.url, tail_start, archive_size - 1)
    eocd = parse_eocd(tail, archive_size, tail_start)
    cd_start = eocd["central_directory_offset"]
    cd_size = eocd["central_directory_size"]
    cd = fetch_range(args.url, cd_start, cd_start + cd_size - 1)
    entries = parse_central_directory(cd, eocd["entries_total"])
    labels = load_labels(args.label_file)
    video_entries = [entry for entry in entries if entry["extension"] in VIDEO_EXTENSIONS and not entry["is_dir"]]
    by_label: dict[str, list[dict[str, Any]]] = {}
    for label in labels:
        matches = [entry for entry in video_entries if entry_matches_label(entry, label)]
        matches.sort(key=lambda entry: (entry["uncompressed_size"], entry["path"]))
        by_label[label] = matches[: args.max_matches_per_label]
    label_counts = {label: len(matches) for label, matches in by_label.items()}
    return {
        "schema_version": "asl-pilot-asl-citizen-zip-index-probe/v1",
        "status": "range_index_probe_completed",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generated_by": {
            "script": {
                "path": project_relative(Path(__file__)),
            },
            "command": sys.argv,
        },
        "archive": {
            "url": args.url,
            **archive,
        },
        "range_probe": {
            "tail_bytes_requested": args.tail_bytes,
            "tail_bytes_fetched": len(tail),
            "central_directory_bytes_fetched": len(cd),
            **eocd,
        },
        "inventory": {
            "entry_count": len(entries),
            "video_entry_count": len(video_entries),
            "extension_counts": dict(sorted({
                extension: sum(1 for entry in entries if entry["extension"] == extension)
                for extension in {entry["extension"] for entry in entries}
            }.items())),
            "sample_paths": [entry["path"] for entry in entries[:30]],
            "sample_video_paths": [entry["path"] for entry in video_entries[:30]],
        },
        "label_file": {
            "path": project_relative(args.label_file),
        },
        "labels": labels,
        "label_match_counts": label_counts,
        "labels_with_matches": [label for label, count in label_counts.items() if count > 0],
        "labels_without_matches": [label for label, count in label_counts.items() if count == 0],
        "matches": by_label,
        "decision_boundary": {
            "downloads_full_archive": False,
            "downloads_raw_clips": False,
            "extracts_media": False,
            "changes_training_manifests": False,
        },
    }


def main() -> int:
    args = parse_args()
    try:
        report = build_report(args)
    except ZipProbeError as error:
        print(f"ASL Citizen ZIP probe failed: {error}", file=sys.stderr)
        return 2
    if args.write:
        write_json(args.output, report)
    print(stable_json({
        "status": report["status"],
        "output": project_relative(args.output) if args.write else None,
        "entry_count": report["inventory"]["entry_count"],
        "video_entry_count": report["inventory"]["video_entry_count"],
        "labels_with_matches": len(report["labels_with_matches"]),
        "labels_without_matches": report["labels_without_matches"],
        "central_directory_bytes_fetched": report["range_probe"]["central_directory_bytes_fetched"],
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
