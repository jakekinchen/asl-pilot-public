#!/usr/bin/env python3
"""Strict final manifest audit for the ASL pilot dataset."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

from evaluate_rawframe_model import EvaluationError, validate_negative_challenge_manifest
from train_rawframe_model import (
    ManifestError,
    TrainingError,
    assert_label_sets_match,
    assert_signer_disjoint,
    validate_manifest,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate final train/validation/test and negative challenge manifests "
            "with the same strict validators used by decode, training, and evaluation."
        )
    )
    parser.add_argument("--train-manifest", type=Path, default=Path("data/manifests/train.json"))
    parser.add_argument("--validation-manifest", type=Path, default=Path("data/manifests/validation.json"))
    parser.add_argument("--test-manifest", type=Path, default=Path("data/manifests/test.json"))
    parser.add_argument(
        "--negative-challenge-manifest",
        type=Path,
        default=Path("data/manifests/negative-challenge.json"),
    )
    parser.add_argument(
        "--write-report",
        type=Path,
        help="Write the successful strict final manifest audit JSON to this project-relative path.",
    )
    return parser.parse_args()


def resolve_project_path(path: Path, context: str) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{context} escapes the project root: {path}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def validate(args: argparse.Namespace) -> dict[str, Any]:
    train_path = resolve_project_path(args.train_manifest, "train manifest")
    validation_path = resolve_project_path(args.validation_manifest, "validation manifest")
    test_path = resolve_project_path(args.test_manifest, "test manifest")
    challenge_path = resolve_project_path(
        args.negative_challenge_manifest,
        "negative challenge manifest",
    )
    required_paths = [
        ("train", train_path),
        ("validation", validation_path),
        ("test", test_path),
        ("negative_challenge", challenge_path),
    ]
    missing_paths = [f"{split}: {project_relative(path)}" for split, path in required_paths if not path.exists()]
    if missing_paths:
        raise ManifestError(f"missing final manifest files: {', '.join(missing_paths)}")
    manifests = [
        validate_manifest(train_path, "train", True, False),
        validate_manifest(validation_path, "validation", True, False),
        validate_manifest(test_path, "test", True, False),
    ]
    assert_signer_disjoint(manifests)
    assert_label_sets_match(manifests)
    challenge_manifest = validate_negative_challenge_manifest(challenge_path, manifests, False)
    return {
        "schema_version": "asl-pilot-final-manifest-audit/v1",
        "status": "passed",
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "manifests": [
            {
                "path": project_relative(Path(item["path"])),
                "split": item["split"],
                "dataset_id": item["dataset_id"],
                "label_count": item["label_count"],
                "clip_count": item["clip_count"],
                "min_clips_per_label_per_split": item["min_clips_per_label_per_split"],
                "sha256": item["sha256"],
                "source_register": item.get("source_register"),
                "dataset_source_mode": item.get("dataset_source_mode"),
                "external_dataset_import": item.get("external_dataset_import"),
                "collection_plan": item.get("collection_plan"),
                "consent_form": item.get("consent_form"),
                "vocabulary_review": item.get("vocabulary_review"),
            }
            for item in manifests
        ],
        "negative_challenge": {
            "path": project_relative(Path(challenge_manifest["path"])),
            "dataset_id": challenge_manifest["dataset_id"],
            "split": challenge_manifest["split"],
            "clip_count": challenge_manifest["clip_count"],
            "sha256": challenge_manifest["sha256"],
            "challenge_type_counts": challenge_manifest["challenge_type_counts"],
            "source_register": challenge_manifest.get("source_register"),
            "collection_plan": challenge_manifest.get("collection_plan"),
            "consent_form": challenge_manifest.get("consent_form"),
            "vocabulary_review": challenge_manifest.get("vocabulary_review"),
        },
        "signer_disjoint": True,
        "label_sets_match": True,
    }


def main() -> int:
    args = parse_args()
    try:
        summary = validate(args)
    except (ManifestError, EvaluationError, TrainingError) as error:
        summary = {
            "schema_version": "asl-pilot-final-manifest-audit/v1",
            "status": "failed",
            "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "blockers": [str(error)],
        }
        if args.write_report:
            report_path = resolve_project_path(args.write_report, "write report")
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(f"{json.dumps(summary, indent=2, sort_keys=True)}\n", encoding="utf-8")
        print(json.dumps(summary, indent=2, sort_keys=True))
        print(f"Final manifest audit failed: {error}", file=sys.stderr)
        return 1
    if args.write_report:
        report_path = resolve_project_path(args.write_report, "write report")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(f"{json.dumps(summary, indent=2, sort_keys=True)}\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
