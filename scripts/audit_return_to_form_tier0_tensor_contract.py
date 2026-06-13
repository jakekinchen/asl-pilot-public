#!/usr/bin/env python3
"""Validate the Tier 0 training/evaluation tensor input contract without training."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    REGION_AWARE_DERIVED_INPUT,
    RawFrameClipDataset,
    TrainingError,
    expected_tensor_hash_for_clip,
    import_torch,
    load_manifest,
    load_tensor_file_with_contract,
    prepare_frames,
    sha256_file,
    tensor_path_for_clip,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "asl-pilot-return-to-form-tier0-tensor-contract/v1"
DEFAULT_MANIFESTS = {
    "train": Path("data/manifests/return-to-form-tier0/train.json"),
    "validation": Path("data/manifests/return-to-form-tier0/validation.json"),
    "test": Path("data/manifests/return-to-form-tier0/test.json"),
}
REFERENCE_PATHS = {
    "source_register": Path("docs/model/dataset-source-register.json"),
    "source_coverage": Path("docs/research/return-to-form-tier0-source-coverage.json"),
    "crop_config": Path("docs/model/return-to-form-fixed-crop-config.json"),
    "pre_training_gates": Path("docs/validation/return-to-form-tier0-gates.json"),
    "decode_dataloader": Path("docs/validation/return-to-form-tier0-decode-dataloader.json"),
    "learnability_smoke": Path("docs/validation/return-to-form-tier0-learnability-smoke.json"),
    "remediation_diagnostic": Path("docs/validation/return-to-form-tier0-remediation-diagnostic.json"),
}
DEFAULT_OUTPUT = Path("docs/validation/return-to-form-tier0-tensor-contract.json")


class ContractAuditError(RuntimeError):
    """Raised when the tensor contract audit cannot run."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_MANIFESTS["train"])
    parser.add_argument("--validation-manifest", type=Path, default=DEFAULT_MANIFESTS["validation"])
    parser.add_argument("--test-manifest", type=Path, default=DEFAULT_MANIFESTS["test"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--samples-per-label-split", type=int, default=3)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--write", action="store_true")
    return parser.parse_args()


def project_path(path: Path) -> Path:
    resolved = (PROJECT_ROOT / path).resolve() if not path.is_absolute() else path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ContractAuditError(f"path escapes project root: {path}") from error
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def file_ref(path: Path) -> dict[str, str]:
    return {
        "path": project_relative(path),
        "sha256": sha256_file(path),
    }


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ContractAuditError(f"missing JSON file: {project_relative(path)}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ContractAuditError(f"JSON root must be an object: {project_relative(path)}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def labels_for_manifest(manifest: dict[str, Any]) -> list[str]:
    labels = manifest.get("labels")
    if not isinstance(labels, list) or not labels:
        raise ContractAuditError("manifest labels must be a non-empty array")
    result = []
    for item in labels:
        if not isinstance(item, dict) or not isinstance(item.get("label_id"), str):
            raise ContractAuditError("manifest labels must contain label_id strings")
        result.append(str(item["label_id"]))
    return result


def clips_by_label(manifest: dict[str, Any], manifest_path: Path) -> dict[str, list[dict[str, Any]]]:
    clips = manifest.get("clips")
    if not isinstance(clips, list):
        raise ContractAuditError(f"{project_relative(manifest_path)} clips must be an array")
    grouped: dict[str, list[dict[str, Any]]] = {}
    for clip in clips:
        if isinstance(clip, dict) and isinstance(clip.get("label_id"), str):
            grouped.setdefault(str(clip["label_id"]), []).append(clip)
    for items in grouped.values():
        items.sort(key=lambda clip: str(clip.get("clip_id", "")))
    return grouped


def sample_contracts(
    torch: Any,
    split: str,
    manifest_path: Path,
    manifest: dict[str, Any],
    labels: list[str],
    args: argparse.Namespace,
) -> tuple[list[dict[str, Any]], list[str]]:
    grouped = clips_by_label(manifest, manifest_path)
    samples = []
    blockers = []
    for label in labels:
        label_clips = grouped.get(label, [])
        if not label_clips:
            blockers.append(f"{split} has no clips for label {label}")
            continue
        for clip in label_clips[: args.samples_per_label_split]:
            context = f"{manifest_path}: clip {clip.get('clip_id', '<unknown>')}"
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            actual_hash = sha256_file(tensor_path)
            expected_hash = expected_tensor_hash_for_clip(clip, context)
            if actual_hash != expected_hash:
                blockers.append(
                    f"{context} tensor hash mismatch; expected {expected_hash}, got {actual_hash}"
                )
                continue
            loaded, contract = load_tensor_file_with_contract(torch, tensor_path)
            prepared = prepare_frames(
                torch,
                loaded,
                frame_count=args.frame_count,
                image_size=args.image_size,
                context=context,
            )
            training_loader = contract.get("training_loader", {})
            consumed_key = training_loader.get("consumed_key")
            derived_name = training_loader.get("derived_input_name")
            if contract.get("rgb_regions_present") and (
                consumed_key != "rgb_regions" or derived_name != REGION_AWARE_DERIVED_INPUT
            ):
                blockers.append(
                    f"{context} has rgb_regions but consumed {consumed_key!r} / {derived_name!r}"
                )
            if contract.get("fallback_to_rgb_frames"):
                blockers.append(f"{context} unexpectedly fell back to rgb_frames")
            samples.append(
                {
                    "split": split,
                    "clip_id": clip.get("clip_id"),
                    "label_id": clip.get("label_id"),
                    "tensor": {
                        "path": project_relative(tensor_path),
                        "sha256": actual_hash,
                    },
                    "contract": contract,
                    "prepared_shape": [int(value) for value in prepared.shape],
                }
            )
    return samples, blockers


def dataloader_batch_shape(
    torch: Any,
    manifest_path: Path,
    split: str,
    label_to_index: dict[str, int],
    args: argparse.Namespace,
) -> dict[str, Any]:
    dataset = RawFrameClipDataset(
        torch,
        manifest_path,
        split,
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=False,
    )
    loader = torch.utils.data.DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    batch_frames, batch_labels = next(iter(loader))
    return {
        "batch_size": args.batch_size,
        "frames_shape": [int(value) for value in batch_frames.shape],
        "labels_shape": [int(value) for value in batch_labels.shape],
        "labels": [int(value) for value in batch_labels.tolist()],
    }


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    if args.samples_per_label_split < 1:
        raise ContractAuditError("--samples-per-label-split must be at least 1")
    if args.frame_count < 1:
        raise ContractAuditError("--frame-count must be at least 1")
    if args.image_size < 16:
        raise ContractAuditError("--image-size must be at least 16")
    if args.batch_size < 1:
        raise ContractAuditError("--batch-size must be at least 1")

    torch = import_torch()
    manifest_paths = {
        "train": project_path(args.train_manifest),
        "validation": project_path(args.validation_manifest),
        "test": project_path(args.test_manifest),
    }
    manifests = {split: load_manifest(path) for split, path in manifest_paths.items()}
    labels = labels_for_manifest(manifests["train"])
    label_to_index = {label: index for index, label in enumerate(sorted(labels))}
    blockers = []
    split_reports = {}
    sample_count = 0
    fallback_to_rgb_frames_count = 0
    consumed_keys = set()
    derived_inputs = set()
    region_orders = set()
    for split, manifest_path in manifest_paths.items():
        samples, sample_blockers = sample_contracts(torch, split, manifest_path, manifests[split], labels, args)
        blockers.extend(sample_blockers)
        sample_count += len(samples)
        fallback_to_rgb_frames_count += sum(1 for sample in samples if sample["contract"].get("fallback_to_rgb_frames"))
        for sample in samples:
            loader_contract = sample["contract"].get("training_loader", {})
            consumed_keys.add(str(loader_contract.get("consumed_key")))
            derived_name = loader_contract.get("derived_input_name")
            if derived_name:
                derived_inputs.add(str(derived_name))
            derived = sample["contract"].get("derived_input")
            if isinstance(derived, dict) and isinstance(derived.get("region_order"), list):
                region_orders.add(tuple(str(item) for item in derived["region_order"]))
        split_reports[split] = {
            "manifest": file_ref(manifest_path),
            "sample_count": len(samples),
            "samples": samples,
            "dataloader_batch": dataloader_batch_shape(torch, manifest_path, split, label_to_index, args),
        }

    reference_paths = {name: project_path(path) for name, path in REFERENCE_PATHS.items()}
    references = {name: file_ref(path) for name, path in reference_paths.items() if path.exists()}
    status = "failed" if blockers else "passed"
    return {
        "schema_version": SCHEMA_VERSION,
        "status": status,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "generated_by": {
            "tool": sys.executable,
            "command": [sys.executable, *sys.argv],
            "script": file_ref(Path(__file__).resolve()),
        },
        "mission": "M3AE-F",
        "selected_labels": labels,
        "configuration": {
            "samples_per_label_split": args.samples_per_label_split,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "batch_size": args.batch_size,
        },
        "references": references,
        "summary": {
            "sample_count": sample_count,
            "consumed_tensor_keys": sorted(consumed_keys),
            "derived_inputs": sorted(derived_inputs),
            "region_orders": [list(order) for order in sorted(region_orders)],
            "fallback_to_rgb_frames_count": fallback_to_rgb_frames_count,
            "blocker_count": len(blockers),
        },
        "splits": split_reports,
        "blockers": blockers,
        "next_action": (
            "rerun_bounded_tier0_learnability_smoke"
            if status == "passed"
            else "stop_unresolved_tensor_contract"
        ),
        "non_actions": [
            "no_training_smoke",
            "no_label_expansion",
            "no_controlled_clip_heldout_evaluation",
            "no_source_approval",
            "no_onnx_export",
            "no_model_card_promotion",
            "no_brev_stop",
            "no_push",
        ],
    }


def main() -> int:
    args = parse_args()
    output_path = project_path(args.output)
    try:
        report = build_report(args)
    except (ContractAuditError, TrainingError) as error:
        print(f"Tier 0 tensor contract audit failed: {error}", file=sys.stderr)
        return 2
    if args.write:
        write_json(output_path, report)
    print(json.dumps({
        "status": report["status"],
        "wrote": args.write,
        "output": project_relative(output_path),
        "sample_count": report["summary"]["sample_count"],
        "consumed_tensor_keys": report["summary"]["consumed_tensor_keys"],
        "derived_inputs": report["summary"]["derived_inputs"],
        "fallback_to_rgb_frames_count": report["summary"]["fallback_to_rgb_frames_count"],
        "blocker_count": report["summary"]["blocker_count"],
        "next_action": report["next_action"],
    }, indent=2, sort_keys=True))
    return 1 if report["status"] != "passed" else 0


raise SystemExit(main())
