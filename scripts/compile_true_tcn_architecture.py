#!/usr/bin/env python3
"""Compile-check the true TemporalConvNet scaffold without training."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from train_rawframe_model import (
    HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE,
    HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
    HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE,
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    ManifestError,
    RawFrameClipDataset,
    TrainingError,
    build_model,
    file_reference,
    import_torch,
    model_state_digest,
    validate_manifest,
    validate_required_input_contracts,
)


RECEIPT_PATH = Path("docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json")
RECEIPT_SCHEMA_VERSION = "asl-pilot-true-tcn-architecture-scaffold/v1"
MODEL_ID = "asl-pilot-asl-citizen-high-signal-true-tcn-compile-v1"
FRAME_COUNT = 16
IMAGE_SIZE = 96
SPLIT_MANIFESTS = {
    "train": Path(HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE),
    "validation": Path(HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE),
    "test": Path(HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE),
}


class TrueTcnCompileError(RuntimeError):
    """Raised when the compile-only true TCN scaffold check fails."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write the tracked receipt after the compile-only check passes.",
    )
    parser.add_argument(
        "--receipt",
        type=Path,
        default=RECEIPT_PATH,
        help=f"Receipt path. Default: {RECEIPT_PATH}",
    )
    return parser.parse_args()


def project_path(relative: Path) -> Path:
    resolved = (PROJECT_ROOT / relative).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise TrueTcnCompileError(f"path escapes project root: {relative}") from error
    return resolved


def write_json(relative: Path, value: dict[str, Any]) -> None:
    path = project_path(relative)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): json_ready(child) for key, child in value.items()}
    if isinstance(value, list):
        return [json_ready(child) for child in value]
    if isinstance(value, tuple):
        return [json_ready(child) for child in value]
    if isinstance(value, set):
        return sorted(json_ready(child) for child in value)
    if isinstance(value, Path):
        return value.as_posix()
    return value


def validate_region_grid_manifests() -> list[dict[str, Any]]:
    summaries = []
    for split, relative_path in SPLIT_MANIFESTS.items():
        try:
            summaries.append(
                validate_manifest(
                    project_path(relative_path),
                    split,
                    check_files=True,
                    allow_small_label_set=False,
                    allow_lesson_label_set=False,
                    allow_source_split_mismatch=False,
                    allow_reduced_real_data_label_set=True,
                )
            )
        except ManifestError as error:
            raise TrueTcnCompileError(str(error)) from error
    return summaries


def training_dry_run_command() -> list[str]:
    return [
        sys.executable,
        "scripts/train_rawframe_model.py",
        "--train-manifest",
        HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
        "--validation-manifest",
        HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE,
        "--test-manifest",
        HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE,
        "--output-dir",
        "artifacts/rawframe-high-signal-module",
        "--model-id",
        MODEL_ID,
        "--architecture",
        TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "--check-files",
        "--frame-count",
        str(FRAME_COUNT),
        "--image-size",
        str(IMAGE_SIZE),
        "--reduced-real-data-module",
        "--dry-run",
        "--require-input-contract",
        REGION_AWARE_DERIVED_INPUT,
    ]


def run_training_dry_run_validation() -> dict[str, Any]:
    command = training_dry_run_command()
    result = subprocess.run(
        command,
        check=False,
        cwd=PROJECT_ROOT,
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
        report["architecture"] = parsed_stdout.get("architecture")
    if result.returncode != 0:
        raise TrueTcnCompileError(
            "true TCN dry-run input-contract validation failed: "
            + (result.stderr.strip() or result.stdout.strip()[:1000])
        )
    return report


def compile_true_tcn(torch: Any, manifest_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    label_ids = sorted(str(label_id) for label_id in manifest_summaries[0]["label_ids"])
    label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
    dataset = RawFrameClipDataset(
        torch,
        project_path(SPLIT_MANIFESTS["train"]),
        "train",
        label_to_index,
        frame_count=FRAME_COUNT,
        image_size=IMAGE_SIZE,
        require_decode_provenance=False,
    )
    samples = [dataset[index][0] for index in range(2)]
    batch = torch.stack(samples, dim=0)
    model = build_model(torch, len(label_to_index), TRUE_TEMPORAL_CONVNET_ARCHITECTURE)
    model.eval()
    with torch.no_grad():
        logits = model(batch)
    if list(logits.shape) != [2, len(label_to_index)]:
        raise TrueTcnCompileError(
            f"true TCN logits shape must be [2, {len(label_to_index)}], got {list(logits.shape)}"
        )
    return {
        "status": "passed",
        "mode": "eval_no_grad_forward_only",
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "model_constructor": "scripts/train_rawframe_model.py::build_model",
        "model_class": "TrueTemporalConvNetRawFrameClassifier",
        "torch_version": torch.__version__,
        "input_batch_shape": list(batch.shape),
        "logits_shape": list(logits.shape),
        "frame_count": FRAME_COUNT,
        "image_size": IMAGE_SIZE,
        "label_count": len(label_to_index),
        "temporal_convnet": {
            "causal": True,
            "kernel_size": 3,
            "dilations": [1, 2, 4],
            "channels": [192, 192, 224, 256],
            "pooling": "adaptive_avg_pool_1d",
        },
        "state_dict_digest": model_state_digest(model.state_dict()),
        "optimizer_created": False,
        "loss_computed": False,
        "backward_called": False,
        "training_step_run": False,
    }


def build_receipt(
    manifest_summaries: list[dict[str, Any]],
    input_contract_report: dict[str, Any],
    compile_evidence: dict[str, Any],
    training_dry_run_validation: dict[str, Any],
    generated_at: str,
) -> dict[str, Any]:
    return {
        "schema_version": RECEIPT_SCHEMA_VERSION,
        "status": "passed",
        "mission": "M3AV",
        "active_prompt": "docs/model/return-to-form-true-tcn-architecture-scaffold-goal-loop-prompt.md",
        "generated_at": generated_at,
        "generated_by": {
            "script": file_reference(Path("scripts/compile_true_tcn_architecture.py")),
            "command": [sys.executable, *sys.argv],
        },
        "changed_files": [
            {
                "path": "scripts/train_rawframe_model.py",
                "sha256": file_reference(Path("scripts/train_rawframe_model.py"))["sha256"],
                "changes": [
                    "added true_temporal_convnet_region_grid architecture option",
                    "added residual causal dilated TemporalConvNet blocks",
                    "kept existing motion_2d_temporal_cnn and rgb_frames fallback paths intact",
                ],
            },
            {
                "path": "scripts/compile_true_tcn_architecture.py",
                "sha256": file_reference(Path("scripts/compile_true_tcn_architecture.py"))["sha256"],
                "changes": [
                    "adds compile-only no-grad true TCN scaffold proof",
                    "writes this tracked M3AV receipt",
                ],
            },
            {
                "path": RECEIPT_PATH.as_posix(),
                "changes": [
                    "records architecture scaffold, no-training compile evidence, input-contract proof, and next action",
                ],
            },
        ],
        "architecture": {
            "name": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
            "model_constructor": "scripts/train_rawframe_model.py::build_model",
            "input_contract": REGION_AWARE_DERIVED_INPUT,
            "input_shape_after_loader": compile_evidence["input_batch_shape"],
            "random_initialization": True,
            "pretrained_components": [],
        },
        "compile_evidence": compile_evidence,
        "manifests": json_ready(manifest_summaries),
        "input_contract_validation": json_ready(input_contract_report),
        "training_dry_run_validation": training_dry_run_validation,
        "validation_commands": [
            {
                "command": [sys.executable, *sys.argv],
                "exit_code": 0,
                "result": "compiled true TCN architecture with one eval/no-grad forward pass and wrote receipt",
            },
            training_dry_run_validation,
        ],
        "boundaries": {
            "training_run": False,
            "optimizer_step": False,
            "loss_or_backward": False,
            "brev_checked": False,
            "paid_compute": False,
            "source_import": False,
            "generated_labels": False,
            "detector_or_landmark_revival": False,
            "onnx_export": False,
            "model_card_or_browser_claim_change": False,
            "final_gate_change": False,
            "push": False,
        },
        "bounded_smoke_hypothesis": {
            "next_action": "run_capped_local_region_grid_tcn_smoke",
            "hypothesis": (
                "A capped no-spend local smoke can test whether the true TemporalConvNet scaffold "
                "fits the materialized rgb_regions_grid_v1 high-signal module better than the "
                "existing motion_2d_temporal_cnn path, without export or promotion claims."
            ),
            "must_precede_training": [
                "rerun dry-run/check-files input-contract validation for rgb_regions_grid_v1",
                "cap epochs, batches, runtime, and output directory in the next prompt",
                "record train-sanity and held-out metrics as non-promotional evidence only",
            ],
        },
        "exactly_one_next_action": "run_capped_local_region_grid_tcn_smoke",
        "next_action_rationale": (
            "The true TemporalConvNet architecture compiles on generated high-signal region-grid "
            "inputs, and the dry-run input-contract guard still observes rgb_regions_grid_v1 for "
            "all selected clips."
        ),
    }


def main() -> int:
    args = parse_args()
    generated_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    try:
        torch = import_torch()
        manifest_summaries = validate_region_grid_manifests()
        input_contract_report = validate_required_input_contracts(
            torch,
            REGION_AWARE_DERIVED_INPUT,
            manifest_summaries,
        )
        compile_evidence = compile_true_tcn(torch, manifest_summaries)
        training_dry_run_validation = run_training_dry_run_validation()
        receipt = build_receipt(
            manifest_summaries,
            input_contract_report,
            compile_evidence,
            training_dry_run_validation,
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
                    "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
                    "input_batch_shape": compile_evidence["input_batch_shape"],
                    "logits_shape": compile_evidence["logits_shape"],
                    "parameter_count": compile_evidence["state_dict_digest"]["parameter_count"],
                    "input_contract_counts": input_contract_report["total_observed_counts"],
                    "training_dry_run_exit_code": training_dry_run_validation["exit_code"],
                    "next_action": receipt["exactly_one_next_action"],
                },
                indent=2,
                sort_keys=True,
            )
        )
    except (TrueTcnCompileError, TrainingError) as error:
        print(f"M3AV true TCN compile check failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
