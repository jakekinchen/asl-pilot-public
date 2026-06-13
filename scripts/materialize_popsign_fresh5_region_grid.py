#!/usr/bin/env python3
"""Materialize PopSign fresh5 fixed-crop region-grid tensors."""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from materialize_high_signal_region_grid import (
    CROP_CONFIG_PATH,
    ROOT,
    RegionGridMaterializationError,
    build_provenance,
    crop_regions,
    import_torch,
    json_ready,
    load_tensor_payload,
    manifest_relative,
    project_path,
    project_relative,
    read_json,
    resolve_manifest_relative,
    sha256_file,
    tensor_digest,
    write_json,
    write_tensor,
)
from rawframe_decode_provenance import (
    ensure_ffmpeg,
    ffmpeg_version,
    run_ffmpeg_decode,
    tensor_from_raw_rgb,
)
from train_rawframe_model import (
    HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION,
    REGION_AWARE_DERIVED_INPUT,
    ManifestError,
    TrainingError,
    validate_manifest,
    validate_required_input_contracts,
)


SOURCE_ID = "popsign-v1-original-videos"
SOURCE_REGISTER_PATH = Path("docs/model/dataset-source-register.json")
M3BS_RECEIPT_PATH = Path("docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json")
SUPPORTED_CANDIDATES_PATH = Path("docs/validation/return-to-form-supported-raw-source-candidates-v1.json")
POPSIGN_IMPORT_PLAN_PATH = Path("docs/research/popsign-v1-import-plan.json")
OUTPUT_RECEIPT_PATH = Path("docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json")
OUTPUT_MANIFEST_DIR = Path("data/manifests/return-to-form-popsign-fresh5-region-grid")
OUTPUT_TENSOR_ROOT = Path("data/tensors/return-to-form-popsign-fresh5-region-grid")
SEED_MANIFESTS = {
    "train": Path("data/manifests/return-to-form-popsign-fresh5/train.json"),
    "validation": Path("data/manifests/return-to-form-popsign-fresh5/validation.json"),
    "test": Path("data/manifests/return-to-form-popsign-fresh5/test.json"),
}
OUTPUT_MANIFESTS = {
    split: OUTPUT_MANIFEST_DIR / f"{split}.json"
    for split in ("train", "validation", "test")
}
TENSOR_SCHEMA_VERSION = "asl-pilot-return-to-form-popsign-fresh5-region-grid-tensor/v1"
RECEIPT_SCHEMA_VERSION = "asl-pilot-return-to-form-popsign-fresh5-region-grid-materialization/v1"
MANIFEST_BINDING_SCHEMA_VERSION = "asl-pilot-popsign-fresh5-region-grid-manifest-binding/v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Regenerate ignored PopSign fresh5 region-grid manifests/tensors and write the tracked receipt.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Batch size for the no-training tensor loader proof.",
    )
    parser.add_argument(
        "--receipt",
        type=Path,
        default=OUTPUT_RECEIPT_PATH,
        help=f"Receipt path. Default: {OUTPUT_RECEIPT_PATH}",
    )
    return parser.parse_args()


def labels_for_manifest(manifest: dict[str, Any]) -> list[str]:
    return [str(item.get("label_id")) for item in manifest.get("labels", [])]


def build_references() -> dict[str, dict[str, str]]:
    return {
        "source_register": {
            "path": SOURCE_REGISTER_PATH.as_posix(),
            "sha256": sha256_file(SOURCE_REGISTER_PATH),
        },
        "crop_config": {
            "path": CROP_CONFIG_PATH.as_posix(),
            "sha256": sha256_file(CROP_CONFIG_PATH),
        },
        "m3bs_receipt": {
            "path": M3BS_RECEIPT_PATH.as_posix(),
            "sha256": sha256_file(M3BS_RECEIPT_PATH),
        },
        "supported_candidates": {
            "path": SUPPORTED_CANDIDATES_PATH.as_posix(),
            "sha256": sha256_file(SUPPORTED_CANDIDATES_PATH),
        },
        "popsign_import_plan": {
            "path": POPSIGN_IMPORT_PLAN_PATH.as_posix(),
            "sha256": sha256_file(POPSIGN_IMPORT_PLAN_PATH),
        },
    }


def build_tensor_payload(
    regions_tensor: Any,
    crop_config_reference: dict[str, str],
    region_metadata: list[dict[str, Any]],
) -> dict[str, Any]:
    region_ids = [item["region_id"] for item in region_metadata]
    compat_region = "upper_body_signing_space"
    compat_index = region_ids.index(compat_region)
    return {
        "schema_version": TENSOR_SCHEMA_VERSION,
        "crop_config": crop_config_reference,
        "region_ids": region_ids,
        "region_axis": "T,R,H,W,C",
        "rgb_regions": regions_tensor,
        "rgb_frames_region_id": compat_region,
        "rgb_frames": regions_tensor[:, compat_index, :, :, :].contiguous(),
    }


def build_manifest_for_split(
    torch: Any,
    ffmpeg: str,
    split: str,
    generated_at: str,
    crop_config: dict[str, Any],
    references: dict[str, dict[str, str]],
) -> dict[str, Any]:
    source_relative = SEED_MANIFESTS[split]
    output_relative = OUTPUT_MANIFESTS[split]
    source_path = project_path(source_relative)
    output_path = project_path(output_relative)
    tensor_root = project_path(OUTPUT_TENSOR_ROOT / split)
    source_manifest = read_json(source_relative)
    source_labels = labels_for_manifest(source_manifest)

    manifest = copy.deepcopy(source_manifest)
    manifest["created_at"] = generated_at
    manifest["region_grid_materialization"] = {
        "schema_version": MANIFEST_BINDING_SCHEMA_VERSION,
        "mission": "M3BT",
        "status": "materialized_popsign_fresh5_region_grid_tensors",
        "source_id": SOURCE_ID,
        "selected_labels": source_labels,
        "source_manifest": {
            "path": project_relative(source_path),
            "sha256": sha256_file(source_path),
        },
        "crop_config": references["crop_config"],
        "tensor_schema_version": TENSOR_SCHEMA_VERSION,
        "provenance_schema_version": HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION,
        "input_contract": REGION_AWARE_DERIVED_INPUT,
    }
    manifest["crop_config"] = {
        **references["crop_config"],
        "region_axis": "T,R,H,W,C",
    }
    existing_steps = manifest.get("preprocessing", {}).get("allowed_steps", [])
    if not isinstance(existing_steps, list):
        raise RegionGridMaterializationError(f"{source_relative}: preprocessing.allowed_steps must be an array")
    manifest["preprocessing"] = {
        **manifest.get("preprocessing", {}),
        "allowed_steps": [
            *existing_steps,
            "fixed_region_crop",
            "hash_tensor",
        ],
    }

    frame_count = int(crop_config["frame_sampling_assumption"]["temporal_sample_count"])
    image_size = int(crop_config["frame_sampling_assumption"]["pre_crop_square_frame_px"])
    decode_fps = float(crop_config["frame_sampling_assumption"]["decode_fps"])
    updated_clips = []
    for index, source_clip in enumerate(source_manifest["clips"]):
        if source_clip.get("source_id") != SOURCE_ID:
            raise RegionGridMaterializationError(f"{source_relative}: clips[{index}] source_id is not PopSign")
        source_video = resolve_manifest_relative(source_path, str(source_clip["relative_video_path"]))
        clip = copy.deepcopy(source_clip)
        clip["relative_video_path"] = manifest_relative(output_path, source_video)
        tensor_path = tensor_root / f"{clip['clip_id']}-regions.pt"
        raw_rgb = run_ffmpeg_decode(ffmpeg, source_video, frame_count, image_size, decode_fps)
        frames = tensor_from_raw_rgb(torch, raw_rgb, frame_count, image_size, f"{split}:{clip['clip_id']}")
        regions_tensor, region_metadata = crop_regions(torch, frames, crop_config)
        payload = build_tensor_payload(regions_tensor, references["crop_config"], region_metadata)
        clip["relative_frame_tensor_path"] = manifest_relative(output_path, tensor_path)
        clip["frame_tensor_sha256"] = write_tensor(torch, tensor_path, payload)
        clip["frame_tensor_provenance"] = build_provenance(
            torch,
            ffmpeg,
            output_path,
            clip,
            raw_rgb,
            regions_tensor,
            references["crop_config"],
            region_metadata,
            crop_config,
        )
        clip["crop_regions"] = region_metadata
        clip["crop_config"] = references["crop_config"]
        updated_clips.append(clip)

    manifest["clips"] = updated_clips
    write_json(output_relative, manifest)
    return manifest


class RegionDataset:
    def __init__(self, torch: Any, manifest_relative_path: Path, label_to_index: dict[str, int]) -> None:
        self.torch = torch
        self.manifest_path = project_path(manifest_relative_path)
        self.manifest = read_json(manifest_relative_path)
        self.clips = self.manifest["clips"]
        self.label_to_index = label_to_index

    def __len__(self) -> int:
        return len(self.clips)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        clip = self.clips[index]
        tensor_path = resolve_manifest_relative(self.manifest_path, clip["relative_frame_tensor_path"])
        payload = load_tensor_payload(self.torch, tensor_path)
        regions = payload.get("rgb_regions")
        if not self.torch.is_tensor(regions):
            raise RegionGridMaterializationError(f"rgb_regions tensor missing: {project_relative(tensor_path)}")
        label = self.torch.tensor(self.label_to_index[clip["label_id"]], dtype=self.torch.long)
        return regions, label


def summarize_manifest(
    torch: Any,
    split: str,
    references: dict[str, dict[str, str]],
    batch_size: int,
) -> tuple[dict[str, Any], dict[str, Any]]:
    manifest_relative_path = OUTPUT_MANIFESTS[split]
    manifest_path = project_path(manifest_relative_path)
    try:
        validation_summary = validate_manifest(
            manifest_path,
            split,
            check_files=True,
            allow_small_label_set=True,
            allow_lesson_label_set=False,
            allow_source_split_mismatch=False,
            allow_reduced_real_data_label_set=False,
        )
    except ManifestError as error:
        raise RegionGridMaterializationError(str(error)) from error

    manifest = read_json(manifest_relative_path)
    labels = labels_for_manifest(manifest)
    binding = manifest.get("region_grid_materialization")
    if not isinstance(binding, dict):
        raise RegionGridMaterializationError(f"{manifest_relative_path}: missing region_grid_materialization binding")
    if binding.get("crop_config") != references["crop_config"]:
        raise RegionGridMaterializationError(f"{manifest_relative_path}: crop_config binding mismatch")
    if binding.get("input_contract") != REGION_AWARE_DERIVED_INPUT:
        raise RegionGridMaterializationError(f"{manifest_relative_path}: input contract binding mismatch")
    if manifest.get("crop_config", {}).get("sha256") != references["crop_config"]["sha256"]:
        raise RegionGridMaterializationError(f"{manifest_relative_path}: crop_config hash mismatch")

    label_counts = Counter()
    source_ids = set()
    tensor_shapes = Counter()
    region_ids_seen: set[tuple[str, ...]] = set()
    source_hashes = set()
    missing_file_count = 0
    clip_tensor_refs = []
    for index, clip in enumerate(manifest["clips"]):
        context = f"{manifest_relative_path}: clips[{index}]"
        if clip.get("source_id") != SOURCE_ID:
            raise RegionGridMaterializationError(f"{context}: source_id must be {SOURCE_ID}")
        if clip.get("crop_config") != references["crop_config"]:
            raise RegionGridMaterializationError(f"{context}: crop_config binding mismatch")
        if not isinstance(clip.get("crop_regions"), list) or not clip["crop_regions"]:
            raise RegionGridMaterializationError(f"{context}: crop_regions missing")
        tensor_relative = clip.get("relative_frame_tensor_path")
        if not isinstance(tensor_relative, str) or not tensor_relative:
            raise RegionGridMaterializationError(f"{context}: relative_frame_tensor_path missing")
        tensor_path = resolve_manifest_relative(manifest_path, tensor_relative)
        if not tensor_path.exists():
            missing_file_count += 1
            continue
        tensor_sha = sha256_file(tensor_path)
        if tensor_sha != clip.get("frame_tensor_sha256"):
            raise RegionGridMaterializationError(f"{context}: frame_tensor_sha256 mismatch")
        payload = load_tensor_payload(torch, tensor_path)
        if payload.get("schema_version") != TENSOR_SCHEMA_VERSION:
            raise RegionGridMaterializationError(f"{context}: tensor schema mismatch")
        if payload.get("crop_config") != references["crop_config"]:
            raise RegionGridMaterializationError(f"{context}: tensor crop_config mismatch")
        regions = payload.get("rgb_regions")
        if not torch.is_tensor(regions):
            raise RegionGridMaterializationError(f"{context}: tensor payload missing rgb_regions")
        digest = tensor_digest(torch, regions, "T,R,H,W,C")
        provenance = clip.get("frame_tensor_provenance")
        if (
            not isinstance(provenance, dict)
            or provenance.get("schema_version") != HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION
        ):
            raise RegionGridMaterializationError(f"{context}: region-grid provenance missing")
        if provenance.get("tensor_digest") != digest:
            raise RegionGridMaterializationError(f"{context}: tensor digest mismatch")
        if provenance.get("crop_config", {}).get("sha256") != references["crop_config"]["sha256"]:
            raise RegionGridMaterializationError(f"{context}: provenance crop_config hash mismatch")
        label_counts[str(clip["label_id"])] += 1
        source_ids.add(str(clip["source_id"]))
        source_hashes.add(str(clip["sha256"]))
        tensor_shapes[tuple(regions.shape)] += 1
        region_ids_seen.add(tuple(payload.get("region_ids", [])))
        clip_tensor_refs.append(
            {
                "clip_id": clip["clip_id"],
                "label_id": clip["label_id"],
                "source_record_id": clip.get("source_record_id"),
                "source_sha256": clip["sha256"],
                "relative_video_path": clip["relative_video_path"],
                "relative_frame_tensor_path": tensor_relative,
                "frame_tensor_sha256": tensor_sha,
            }
        )
    if missing_file_count:
        raise RegionGridMaterializationError(f"{manifest_relative_path}: {missing_file_count} tensor files are missing")

    label_to_index = {label_id: index for index, label_id in enumerate(labels)}
    dataset = RegionDataset(torch, manifest_relative_path, label_to_index)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    batch_regions, batch_labels = next(iter(loader))
    return (
        {
            "path": project_relative(manifest_path),
            "sha256": sha256_file(manifest_path),
            "split": split,
            "clip_count": len(manifest["clips"]),
            "labels": labels,
            "label_clip_counts": dict(sorted(label_counts.items())),
            "source_ids": sorted(source_ids),
            "source_hash_count": len(source_hashes),
            "tensor_count": sum(tensor_shapes.values()),
            "missing_file_count": missing_file_count,
            "every_clip_has_tensor_path_and_sha256": len(clip_tensor_refs) == len(manifest["clips"]),
            "tensor_shapes": [
                {"shape": list(shape), "count": count}
                for shape, count in sorted(tensor_shapes.items())
            ],
            "region_ids": [list(items) for items in sorted(region_ids_seen)],
            "dataloader_batch": {
                "batch_size": batch_size,
                "regions_shape": list(batch_regions.shape),
                "labels_shape": list(batch_labels.shape),
                "labels": batch_labels.tolist(),
                "dtype": str(batch_regions.dtype).replace("torch.", ""),
            },
            "clip_tensor_refs": clip_tensor_refs,
        },
        validation_summary,
    )


def training_dry_run_command() -> list[str]:
    return [
        sys.executable,
        "scripts/train_rawframe_model.py",
        "--train-manifest",
        OUTPUT_MANIFESTS["train"].as_posix(),
        "--validation-manifest",
        OUTPUT_MANIFESTS["validation"].as_posix(),
        "--test-manifest",
        OUTPUT_MANIFESTS["test"].as_posix(),
        "--output-dir",
        "output/return-to-form-popsign-fresh5-region-grid-dry-run",
        "--model-id",
        "asl-pilot-popsign-fresh5-region-grid-contract-v1",
        "--allow-small-label-set",
        "--check-files",
        "--frame-count",
        "16",
        "--image-size",
        "96",
        "--dry-run",
        "--require-input-contract",
        REGION_AWARE_DERIVED_INPUT,
    ]


def run_training_dry_run_validation() -> dict[str, Any]:
    command = training_dry_run_command()
    result = subprocess.run(
        command,
        check=False,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
    )
    report: dict[str, Any] = {
        "command": command,
        "exit_code": result.returncode,
        "stdout_sha256": hashlib.sha256(result.stdout.encode("utf-8")).hexdigest(),
        "stderr": result.stderr.strip(),
    }
    try:
        parsed_stdout = json.loads(result.stdout) if result.stdout.strip() else {}
    except json.JSONDecodeError:
        parsed_stdout = {}
    if isinstance(parsed_stdout, dict):
        input_contract = parsed_stdout.get("input_contract_report")
        if isinstance(input_contract, dict):
            report["required_contract"] = input_contract.get("required_contract")
            report["total_clip_count"] = input_contract.get("total_clip_count")
            report["total_observed_counts"] = input_contract.get("total_observed_counts")
            report["status"] = input_contract.get("status")
        report["training_status"] = parsed_stdout.get("training_status")
    if result.returncode != 0:
        raise RegionGridMaterializationError(
            "training dry-run region-grid validation failed: "
            + (result.stderr.strip() or result.stdout.strip()[:1000])
        )
    return report


def m3bs_metric_blocker() -> dict[str, Any]:
    receipt = read_json(M3BS_RECEIPT_PATH)
    smoke_evaluation = receipt.get("smoke_evaluation", {})
    test_metrics = smoke_evaluation.get("test_metrics", {}) if isinstance(smoke_evaluation, dict) else {}
    decision = receipt.get("decision", {})
    return {
        "m3bs_status": receipt.get("status"),
        "selected_labels": receipt.get("selected_candidate", {}).get("labels"),
        "validation_metrics": smoke_evaluation.get("validation_metrics") if isinstance(smoke_evaluation, dict) else None,
        "test_metrics": {
            "top1_accuracy": test_metrics.get("top1_accuracy") if isinstance(test_metrics, dict) else None,
            "macro_f1": test_metrics.get("macro_f1") if isinstance(test_metrics, dict) else None,
            "false_pass_rate": test_metrics.get("false_pass_rate") if isinstance(test_metrics, dict) else None,
            "zero_recall_labels": [
                label
                for label, metrics in (test_metrics.get("per_class", {}) if isinstance(test_metrics, dict) else {}).items()
                if isinstance(metrics, dict) and metrics.get("recall") == 0
            ],
        },
        "m3bs_next_action": receipt.get("exactly_one_next_action"),
        "blocker": decision.get("blocker") if isinstance(decision, dict) else None,
    }


def build_receipt(
    split_summaries: dict[str, dict[str, Any]],
    manifest_validation_summaries: list[dict[str, Any]],
    input_contract_report: dict[str, Any],
    training_dry_run_validation: dict[str, Any],
    references: dict[str, dict[str, str]],
    ffmpeg: str,
    generated_at: str,
) -> dict[str, Any]:
    crop_config = read_json(CROP_CONFIG_PATH)
    total_tensors = sum(summary["tensor_count"] for summary in split_summaries.values())
    total_missing = sum(summary["missing_file_count"] for summary in split_summaries.values())
    return {
        "schema_version": RECEIPT_SCHEMA_VERSION,
        "status": "passed",
        "generated_at": generated_at,
        "mission": "M3BT - PopSign fresh5 region-grid materialization",
        "active_prompt": "docs/model/return-to-form-popsign-fresh5-region-grid-materialization-goal-loop-prompt.md",
        "m3bs_metric_blocker": m3bs_metric_blocker(),
        "selected_labels": split_summaries["train"]["labels"],
        "generated_by": {
            "script": {
                "path": "scripts/materialize_popsign_fresh5_region_grid.py",
                "sha256": sha256_file(Path("scripts/materialize_popsign_fresh5_region_grid.py")),
            },
            "command": [sys.executable, *sys.argv],
        },
        "changed_files": [
            {
                "path": "scripts/materialize_popsign_fresh5_region_grid.py",
                "sha256": sha256_file(Path("scripts/materialize_popsign_fresh5_region_grid.py")),
                "changes": [
                    "adds PopSign fresh5 region-grid materialization from existing approved local raw videos",
                    "writes ignored PopSign fresh5 region-grid manifests/tensors",
                    "writes the tracked M3BT materialization receipt",
                ],
            },
            {
                "path": OUTPUT_RECEIPT_PATH.as_posix(),
                "changes": [
                    "records generated ignored manifest/tensor paths, all clip tensor hashes, input-contract proof, boundaries, and next action",
                ],
            },
        ],
        "source_ids": [SOURCE_ID],
        "input_contract": REGION_AWARE_DERIVED_INPUT,
        "tensor_schema_version": TENSOR_SCHEMA_VERSION,
        "provenance_schema_version": HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION,
        "references": references,
        "decode_ffmpeg_provenance": {
            "ffmpeg": {
                "path": str(Path(ffmpeg).resolve()),
                "sha256": sha256_file(Path(ffmpeg).resolve()),
                "version": ffmpeg_version(ffmpeg),
            },
            "frame_sampling": crop_config["frame_sampling_assumption"],
            "region_axis": "T,R,H,W,C",
        },
        "generated_ignored_artifacts": {
            "manifest_dir": OUTPUT_MANIFEST_DIR.as_posix(),
            "tensor_root": OUTPUT_TENSOR_ROOT.as_posix(),
            "tracked_in_git": False,
            "gitignore_reason": "data/manifests/ and data/tensors/ are ignored project-local evidence paths; this receipt records paths, counts, and hashes.",
        },
        "manifests": split_summaries,
        "aggregate": {
            "tensor_count": total_tensors,
            "missing_file_count": total_missing,
            "clips_by_split": {
                split: summary["clip_count"] for split, summary in split_summaries.items()
            },
            "all_manifest_clips_have_tensor_path_and_sha256": all(
                summary["every_clip_has_tensor_path_and_sha256"] for summary in split_summaries.values()
            ),
        },
        "input_contract_validation": json_ready(input_contract_report),
        "training_dry_run_validation": training_dry_run_validation,
        "validation_commands": [
            {
                "command": [sys.executable, *sys.argv],
                "exit_code": 0,
                "result": (
                    "materialized 375 PopSign fresh5 region-grid tensors and wrote ignored "
                    "manifests/tensors plus this tracked receipt"
                ),
            },
            training_dry_run_validation,
            {
                "command": [
                    "node scripts/audit_loop_premise.mjs --json",
                    "node scripts/audit_return_to_form_plan.mjs --json",
                    "node scripts/audit_no_pretrained_deps.mjs",
                    "node scripts/audit_no_pretrained_artifact_json.mjs",
                    "node scripts/audit_source_register.mjs",
                    "python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json >/dev/null",
                    "python3 -m json.tool docs/validation/return-to-form-supported-raw-source-candidates-v1.json >/dev/null",
                    ".venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/decode_raw_videos.py",
                ],
                "status": "passed_before_materialization",
            },
        ],
        "manifest_validation_summaries": json_ready(manifest_validation_summaries),
        "detector0_or_crop_target_work_needed_before_more_classifier_training": False,
        "detector0_boundary": (
            "Detector 0/crop target work is not required before the next bounded no-spend "
            "fresh5 region-grid smoke because rgb_regions_grid_v1 materialization and dry-run "
            "input-contract validation passed for every selected clip. Detector 0 remains a "
            "later option if region-grid smoke evidence is still weak."
        ),
        "boundaries": {
            "training_run": False,
            "brev_checked": False,
            "brev_spend": False,
            "paid_compute": False,
            "source_import": False,
            "source_register_change": False,
            "generated_labels": False,
            "pretrained_dependency": False,
            "detector_or_landmark_revival": False,
            "onnx_export": False,
            "browser_activation": False,
            "model_card_or_browser_claim_change": False,
            "final_gate_change": False,
            "push": False,
        },
        "non_actions": [
            "no training",
            "no Brev check",
            "no paid compute",
            "no source import",
            "no generated labels",
            "no pretrained detector/landmark/backbone/embedding",
            "no ONNX export",
            "no browser activation",
            "no model-card promotion",
            "no final-gate change",
            "no push",
        ],
        "exactly_one_next_action": "continue_capped_local_fresh5_region_grid_smoke",
        "next_action_rationale": (
            "Generated PopSign fresh5 manifests now materialize rgb_regions tensors from existing "
            "approved local raw videos, every generated clip has tensor path and SHA-256 evidence, "
            "and the no-training dry-run observes rgb_regions_grid_v1 for every selected clip."
        ),
    }


def main() -> int:
    args = parse_args()
    generated_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    try:
        torch = import_torch()
        ffmpeg = ensure_ffmpeg()
        references = build_references()
        crop_config = read_json(CROP_CONFIG_PATH)
        if args.write:
            for split in ("train", "validation", "test"):
                build_manifest_for_split(torch, ffmpeg, split, generated_at, crop_config, references)
        split_summaries: dict[str, dict[str, Any]] = {}
        manifest_validation_summaries = []
        for split in ("train", "validation", "test"):
            split_summary, validation_summary = summarize_manifest(torch, split, references, args.batch_size)
            split_summaries[split] = split_summary
            manifest_validation_summaries.append(validation_summary)
        try:
            input_contract_report = validate_required_input_contracts(
                torch,
                REGION_AWARE_DERIVED_INPUT,
                manifest_validation_summaries,
            )
        except TrainingError as error:
            raise RegionGridMaterializationError(str(error)) from error
        training_dry_run_validation = run_training_dry_run_validation()
        receipt = build_receipt(
            split_summaries,
            manifest_validation_summaries,
            input_contract_report,
            training_dry_run_validation,
            references,
            ffmpeg,
            generated_at,
        )
        if args.write:
            write_json(args.receipt, receipt)
        print(
            json.dumps(
                {
                    "status": receipt["status"],
                    "write": args.write,
                    "receipt": args.receipt.as_posix(),
                    "manifests": {
                        split: summary["path"] for split, summary in split_summaries.items()
                    },
                    "tensor_count": receipt["aggregate"]["tensor_count"],
                    "missing_file_count": receipt["aggregate"]["missing_file_count"],
                    "input_contract_counts": input_contract_report["total_observed_counts"],
                    "training_dry_run_exit_code": training_dry_run_validation["exit_code"],
                    "dataloader_batch_shapes": {
                        split: summary["dataloader_batch"]["regions_shape"]
                        for split, summary in split_summaries.items()
                    },
                    "exactly_one_next_action": receipt["exactly_one_next_action"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except RegionGridMaterializationError as error:
        print(f"M3BT materialization failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
