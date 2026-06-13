#!/usr/bin/env python3
"""Run the M3GR reduced4 local micro-overfit preflight."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

from run_region_grid_tcn_tiny_overfit import (
    SUCCESS_THRESHOLD,
    TinyOverfitError,
    json_ready,
    select_subset,
    subset_contract_evidence,
    train_tiny_overfit,
    write_json,
)
from train_rawframe_model import (
    ASL_CITIZEN_SOURCE_ID,
    PROJECT_ROOT,
    REGION_AWARE_DERIVED_INPUT,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    ManifestError,
    RawFrameClipDataset,
    TrainingError,
    build_model,
    clone_state_dict_to_cpu,
    environment_file_references,
    file_reference,
    import_torch,
    load_manifest,
    local_ml_environment_reference,
    select_device,
    validate_manifest,
)


DEFAULT_TRAIN_MANIFEST = Path("data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json")
DEFAULT_OUTPUT_DIR = Path("output/m3gr-reduced4-local-micro-overfit-preflight")
MODEL_ID = "asl-pilot-m3gr-reduced4-local-micro-overfit-preflight-v1"
SCHEMA_VERSION = "asl-pilot-m3gr-reduced4-local-micro-overfit-preflight/v1"
SUBSET_SCHEMA_VERSION = "asl-pilot-m3gr-reduced4-local-micro-overfit-subset/v1"
EXPECTED_DATASET_ID = "asl-pilot-asl-citizen-high-signal-region-grid-reduced4-m3gq-v1"
EXPECTED_LABEL_IDS = ("hello", "sad", "uncle", "white")
DEFAULT_SEED = 20260529
DEFAULT_EPOCHS = 120


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-manifest", type=Path, default=DEFAULT_TRAIN_MANIFEST)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--clips-per-label", type=int, choices=(1, 2), default=1)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch-size", type=int, default=len(EXPECTED_LABEL_IDS))
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--weight-decay", type=float, default=0.0)
    parser.add_argument("--frame-count", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=96)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--check-files", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise TinyOverfitError(f"{context} escapes project root: {path}") from error
    if must_exist and not resolved.exists():
        raise TinyOverfitError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def command_for_args(args: argparse.Namespace, *, dry_run: bool) -> list[str]:
    command = [
        sys.executable,
        "scripts/run_m3gr_reduced4_micro_overfit_preflight.py",
        "--train-manifest",
        project_relative(project_path(args.train_manifest, "train manifest")),
        "--output-dir",
        project_relative(project_path(args.output_dir, "output dir", must_exist=False)),
        "--model-id",
        args.model_id,
        "--seed",
        str(args.seed),
        "--clips-per-label",
        str(args.clips_per_label),
        "--epochs",
        str(args.epochs),
        "--batch-size",
        str(args.batch_size),
        "--learning-rate",
        str(args.learning_rate),
        "--weight-decay",
        str(args.weight_decay),
        "--frame-count",
        str(args.frame_count),
        "--image-size",
        str(args.image_size),
        "--num-workers",
        str(args.num_workers),
        "--check-files",
    ]
    if dry_run:
        command.append("--dry-run")
    return command


def validate_contract_args(args: argparse.Namespace) -> tuple[Path, Path]:
    train_manifest = project_path(args.train_manifest, "train manifest")
    expected_manifest = (PROJECT_ROOT / DEFAULT_TRAIN_MANIFEST).resolve()
    if train_manifest != expected_manifest:
        raise TinyOverfitError(f"M3GR requires --train-manifest {DEFAULT_TRAIN_MANIFEST.as_posix()}")
    output_dir = project_path(args.output_dir, "output dir", must_exist=False)
    expected_output = (PROJECT_ROOT / DEFAULT_OUTPUT_DIR).resolve()
    if output_dir != expected_output:
        raise TinyOverfitError(f"M3GR requires --output-dir {DEFAULT_OUTPUT_DIR.as_posix()}")
    if not args.check_files:
        raise TinyOverfitError("M3GR requires --check-files")
    if args.frame_count != 16:
        raise TinyOverfitError("M3GR requires --frame-count 16")
    if args.image_size != 96:
        raise TinyOverfitError("M3GR requires --image-size 96")
    if args.num_workers != 0:
        raise TinyOverfitError("M3GR requires --num-workers 0")
    if args.epochs <= 0 or args.epochs > 160:
        raise TinyOverfitError("M3GR --epochs must be between 1 and 160")
    if args.learning_rate <= 0:
        raise TinyOverfitError("M3GR --learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise TinyOverfitError("M3GR --weight-decay must be greater than or equal to zero")
    return train_manifest, output_dir


def validate_reduced4_contract(manifest: dict[str, Any]) -> dict[str, Any]:
    if manifest.get("dataset_id") != EXPECTED_DATASET_ID:
        raise TinyOverfitError(f"M3GR requires dataset_id {EXPECTED_DATASET_ID}")
    if manifest.get("dataset_source_mode") != "approved_external_raw_video_source":
        raise TinyOverfitError("M3GR reduced4 manifest must remain approved_external_raw_video_source")
    external_import = manifest.get("external_dataset_import")
    if not isinstance(external_import, dict) or external_import.get("source_id") != ASL_CITIZEN_SOURCE_ID:
        raise TinyOverfitError("M3GR reduced4 manifest must bind external_dataset_import to ASL Citizen")
    labels = manifest.get("labels")
    if not isinstance(labels, list):
        raise TinyOverfitError("M3GR reduced4 manifest labels must be a list")
    label_ids = sorted(str(label.get("label_id")) for label in labels if isinstance(label, dict))
    if label_ids != list(EXPECTED_LABEL_IDS):
        raise TinyOverfitError(f"M3GR reduced4 labels must be {list(EXPECTED_LABEL_IDS)}, got {label_ids}")
    evidence = manifest.get("high_signal_module_evidence")
    if not isinstance(evidence, dict):
        raise TinyOverfitError("M3GR reduced4 manifest must retain high_signal_module_evidence")
    if evidence.get("finality") != "reduced_module_manifest_not_training_or_model_promotion":
        raise TinyOverfitError("M3GR reduced4 high_signal_module_evidence finality must reject promotion")

    clips = manifest.get("clips")
    if not isinstance(clips, list) or not clips:
        raise TinyOverfitError("M3GR reduced4 manifest clips must be a non-empty list")
    source_ids = sorted({str(clip.get("source_id")) for clip in clips if isinstance(clip, dict)})
    if source_ids != [ASL_CITIZEN_SOURCE_ID]:
        raise TinyOverfitError(f"M3GR reduced4 clips must all use {ASL_CITIZEN_SOURCE_ID}")
    license_statuses = sorted(
        {str(clip.get("source_license_review_status")) for clip in clips if isinstance(clip, dict)}
    )
    if license_statuses != ["approved_noncommercial_school_assignment_raw_video_only"]:
        raise TinyOverfitError("M3GR reduced4 clips must retain approved ASL Citizen license status")
    if any(clip.get("derived_features") not in ([], None) for clip in clips if isinstance(clip, dict)):
        raise TinyOverfitError("M3GR reduced4 clips must not contain derived feature shortcuts")
    return {
        "dataset_id": manifest["dataset_id"],
        "label_ids": label_ids,
        "source_ids": source_ids,
        "source_license_review_statuses": license_statuses,
        "high_signal_module_evidence": evidence,
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    train_manifest, output_dir = validate_contract_args(args)
    torch = import_torch()
    manifest_summary = validate_manifest(
        train_manifest,
        "train",
        args.check_files,
        True,
    )
    manifest = load_manifest(train_manifest)
    reduced4_contract = validate_reduced4_contract(manifest)
    selected = select_subset(manifest, args.clips_per_label)
    expected_subset_size = len(EXPECTED_LABEL_IDS) * args.clips_per_label
    if len(selected) != expected_subset_size:
        raise TinyOverfitError(f"selected subset size {len(selected)} does not match {expected_subset_size}")
    if args.batch_size != len(selected):
        raise TinyOverfitError(f"M3GR requires full-subset --batch-size {len(selected)} for this selection")

    label_ids = sorted(str(label_id) for label_id in manifest_summary["label_ids"])
    label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
    dataset = RawFrameClipDataset(
        torch,
        train_manifest,
        "train",
        label_to_index,
        frame_count=args.frame_count,
        image_size=args.image_size,
        require_decode_provenance=False,
        preserve_region_axis=True,
    )
    subset_rows, batch, labels = subset_contract_evidence(
        torch,
        dataset,
        selected,
        args.frame_count,
        args.image_size,
    )
    device = select_device(torch)
    proof_model = build_model(torch, len(label_ids), TRUE_TEMPORAL_CONVNET_ARCHITECTURE).to(device)
    proof_model.eval()
    with torch.no_grad():
        proof_logits = proof_model(batch.to(device)).detach().cpu()
    if list(proof_logits.shape) != [len(selected), len(label_ids)]:
        raise TinyOverfitError(f"proof logits shape mismatch: {list(proof_logits.shape)}")

    proof = {
        "status": "dry_run_only" if args.dry_run else "ready_for_single_probe",
        "source_manifest": {
            "path": project_relative(train_manifest),
            "sha256": manifest_summary["sha256"],
            "split": manifest_summary["split"],
            "dataset_id": manifest_summary["dataset_id"],
            "label_count": manifest_summary["label_count"],
            "clip_count": manifest_summary["clip_count"],
        },
        "reduced4_contract": reduced4_contract,
        "subset_clip_count": len(selected),
        "labels": label_ids,
        "input_contract": {
            "required_contract": REGION_AWARE_DERIVED_INPUT,
            "raw_rgb_regions_shape": subset_rows[0]["raw_rgb_regions_shape"],
            "prepared_model_input_shape": subset_rows[0]["prepared_model_input_shape"],
            "prepared_model_input_axis": subset_rows[0]["prepared_model_input_axis"],
            "batched_model_input_shape": list(batch.shape),
            "batched_model_input_axis": "B,T,R,C,H,W",
            "logits_shape": list(proof_logits.shape),
            "region_axis_preserved_until": "TrueTemporalConvNetRawFrameClassifier.region_attention",
            "region_order": subset_rows[0]["region_ids"],
        },
        "caps": {
            "clips_per_label": args.clips_per_label,
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "num_workers": args.num_workers,
            "success_threshold": {
                "accuracy_gte": SUCCESS_THRESHOLD,
                "no_zero_recall_selected_labels": True,
                "predeclared_before_run": True,
            },
        },
        "command": [sys.executable, *sys.argv],
    }
    if args.dry_run:
        return proof

    output_dir.mkdir(parents=True, exist_ok=True)
    model, training_result = train_tiny_overfit(torch, args, batch, labels, label_ids, device)
    model_path = output_dir / "model_state.pt"
    subset_path = output_dir / "selected-subset.json"
    provenance_path = output_dir / "tiny-overfit-provenance.json"
    checkpoint = {
        "model_state": clone_state_dict_to_cpu(model.state_dict()),
        "label_to_index": label_to_index,
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "frame_count": args.frame_count,
        "image_size": args.image_size,
        "model_id": args.model_id,
        "subset_clip_ids": [row["clip_id"] for row in subset_rows],
        "initial_model_state_digest": training_result["initial_model_state_digest"],
        "final_model_state_digest": training_result["final_model_state_digest"],
    }
    torch.save(checkpoint, model_path)

    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    subset_report = {
        "schema_version": SUBSET_SCHEMA_VERSION,
        "generated_at": generated_at,
        "selection_rule": "sort labels lexicographically, sort clips within each label by clip_id, select first clips_per_label",
        "source_manifest": proof["source_manifest"],
        "clips_per_label": args.clips_per_label,
        "clips": subset_rows,
    }
    write_json(subset_path, subset_report)
    provenance = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": generated_at,
        "mission": "M3GR",
        "model_id": args.model_id,
        "command": [sys.executable, *sys.argv],
        "script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "architecture": TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
        "initialization": "random",
        "pretrained_components": [],
        "source_manifest": proof["source_manifest"],
        "input_contract": proof["input_contract"],
        "subset": subset_report,
        "training_result": training_result,
        "model_artifact": project_relative(model_path),
        "finality": "diagnostic_train_fit_only_not_heldout_quality_not_promotion",
    }
    write_json(provenance_path, provenance)
    artifacts = [file_reference(model_path), file_reference(subset_path), file_reference(provenance_path)]
    return {
        "schema_version": SCHEMA_VERSION,
        "status": "tiny_overfit_succeeded" if training_result["success"] else "tiny_overfit_failed",
        "success": training_result["success"],
        "final_accuracy": training_result["final_eval_metrics"]["accuracy"],
        "zero_recall_labels": training_result["final_eval_metrics"]["zero_recall_labels"],
        "runtime": training_result["runtime"],
        "next_action": "continue_m3gs_reduced4_trainability_result_triage_no_brev",
        "output_dir": project_relative(output_dir),
        "artifacts": artifacts,
    }


def main() -> int:
    args = parse_args()
    try:
        result = run(args)
    except (ManifestError, TrainingError, TinyOverfitError) as error:
        print(f"M3GR reduced4 micro-overfit preflight failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(json_ready(result), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
