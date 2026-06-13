#!/usr/bin/env python3
"""Export a from-scratch raw-frame PyTorch checkpoint to ONNX for browser use."""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from evaluate_rawframe_model import EvaluationError, validate_negative_challenge_manifest
from train_rawframe_model import (
    EXTERNAL_DATASET_SOURCE_MODE,
    FIRST_PARTY_DATASET_SOURCE_MODE,
    LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE,
    ManifestError,
    TrainingError,
    assert_label_sets_match,
    assert_signer_disjoint,
    build_model,
    checkpoint_architecture,
    expected_tensor_hash_for_clip,
    local_ml_environment_reference,
    load_manifest,
    load_tensor_file,
    prepare_frames,
    require_current_local_ml_environment,
    tensor_path_for_clip,
    validate_manifest,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CHECKPOINT = Path("artifacts/rawframe-model/model_state.pt")
DEFAULT_PROVENANCE = Path("artifacts/rawframe-model/training-provenance.json")
DEFAULT_OUTPUT = Path("web/public/model/asl-pilot-rawframe-v0.onnx")
DEFAULT_PARITY_FIXTURE = Path("artifacts/rawframe-model/browser-parity-fixture.json")
TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE = 0.05
CALIBRATED_PROVENANCE_SCHEMA_VERSION = "asl-pilot-calibrated-provenance/v1"
ONNX_EXPORT_PROVENANCE_SCHEMA_VERSION = "asl-pilot-onnx-export-provenance/v1"
PARITY_FIXTURE_SCHEMA_VERSION = "asl-pilot-browser-parity-fixture/v1"


class ExportError(RuntimeError):
    """Raised when a PyTorch checkpoint cannot be exported to ONNX."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Export the project-trained raw-frame PyTorch model to a hash-pinned "
            "ONNX browser artifact. This does not mark the model-card trained."
        )
    )
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=DEFAULT_CHECKPOINT,
        help="Path to model_state.pt written by scripts/train_rawframe_model.py.",
    )
    parser.add_argument(
        "--training-provenance",
        type=Path,
        default=DEFAULT_PROVENANCE,
        help="Path to training-provenance.json written by scripts/train_rawframe_model.py.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output ONNX path, usually under web/public/model/ for browser serving.",
    )
    parser.add_argument(
        "--export-report",
        type=Path,
        help="Optional JSON export report path. Defaults next to the ONNX file.",
    )
    parser.add_argument(
        "--parity-fixture",
        type=Path,
        default=DEFAULT_PARITY_FIXTURE,
        help=(
            "JSON fixture written during export so the browser final smoke can compare "
            "ONNX Runtime Web logits against PyTorch logits for a hash-pinned manifest tensor."
        ),
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=18,
        help="ONNX opset version.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate inputs and print the export plan without writing files.",
    )
    parser.add_argument(
        "--allow-smoke-export",
        action="store_true",
        help="Allow synthetic/small/capped training artifacts for wiring tests only.",
    )
    return parser.parse_args()


def import_torch() -> Any:
    try:
        import torch  # type: ignore[import-not-found]
    except ImportError as error:
        raise ExportError("PyTorch is required to load and export model_state.pt.") from error
    return torch


def import_onnx() -> Any:
    try:
        import onnx  # type: ignore[import-not-found]
    except ImportError as error:
        raise ExportError("onnx is required to validate the exported browser artifact.") from error
    return onnx


def resolve_project_path(path: Path, context: str) -> Path:
    resolved = path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ExportError(f"{context} escapes the project root: {path}") from error
    return resolved


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ExportError(f"JSON file does not exist: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ExportError(f"JSON file is invalid: {path}: {error}") from error
    if not isinstance(data, dict):
        raise ExportError(f"JSON file root must be an object: {path}")
    return data


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def file_reference(path: Path) -> dict[str, str]:
    resolved = path.resolve()
    return {
        "path": project_relative(resolved),
        "sha256": sha256_file(resolved),
    }


def environment_file_references() -> list[dict[str, str]]:
    references: list[dict[str, str]] = []
    for relative_path in (
        Path("requirements.txt"),
        Path("web/package.json"),
        Path("web/package-lock.json"),
        Path(LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE),
    ):
        resolved = PROJECT_ROOT / relative_path
        if resolved.exists():
            references.append(file_reference(resolved))
    return references


def generated_by(allow_smoke_export: bool, evidence_mode: str | None = None) -> dict[str, Any]:
    resolved_evidence_mode = evidence_mode or ("smoke" if allow_smoke_export else "final")
    return {
        "tool": "scripts/export_onnx_model.py",
        "command": [sys.executable, *sys.argv],
        "script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "allow_smoke_export": allow_smoke_export,
        "evidence_mode": resolved_evidence_mode,
    }


def load_checkpoint(torch: Any, checkpoint_path: Path) -> dict[str, Any]:
    if not checkpoint_path.exists():
        raise ExportError(f"checkpoint does not exist: {checkpoint_path}")
    try:
        loaded = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(checkpoint_path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - preserve precise user-facing cause.
        raise ExportError(f"checkpoint could not be loaded: {checkpoint_path}: {error}") from error
    if not isinstance(loaded, dict):
        raise ExportError(f"checkpoint root must be a dict: {checkpoint_path}")
    for key in ("model_state", "label_to_index", "frame_count", "image_size"):
        if key not in loaded:
            raise ExportError(f"checkpoint missing required field: {key}")
    if not isinstance(loaded["label_to_index"], dict) or not loaded["label_to_index"]:
        raise ExportError("checkpoint label_to_index must be a non-empty object")
    try:
        checkpoint_architecture(loaded)
    except TrainingError as error:
        raise ExportError(str(error)) from error
    return loaded


def validate_training_provenance(provenance: dict[str, Any], checkpoint_path: Path, checkpoint: dict[str, Any]) -> None:
    if provenance.get("initialization") != "random":
        raise ExportError("training provenance initialization must be random")
    pretrained_components = provenance.get("pretrained_components")
    if pretrained_components != []:
        raise ExportError("training provenance pretrained_components must be an empty array")
    if provenance.get("evidence_mode") == "final":
        random_evidence = provenance.get("random_initialization_evidence")
        if not isinstance(random_evidence, dict):
            raise ExportError("final training provenance random_initialization_evidence is required")
        for key in ("initial_model_state_digest", "final_model_state_digest"):
            digest = random_evidence.get(key)
            if not isinstance(digest, dict):
                raise ExportError(f"final training provenance random_initialization_evidence.{key} must be an object")
            if digest.get("algorithm") != "canonical_state_dict_sha256_v1":
                raise ExportError(f"final training provenance random_initialization_evidence.{key}.algorithm is invalid")
            sha = digest.get("sha256")
            if not isinstance(sha, str) or len(sha) != 64 or any(character not in "0123456789abcdef" for character in sha):
                raise ExportError(f"final training provenance random_initialization_evidence.{key}.sha256 must be a SHA-256 digest")
            if digest != checkpoint.get(key):
                raise ExportError(f"final training provenance random_initialization_evidence.{key} must match checkpoint")
    try:
        checkpoint_arch = checkpoint_architecture(checkpoint)
    except TrainingError as error:
        raise ExportError(str(error)) from error
    if provenance.get("architecture") != checkpoint_arch:
        raise ExportError("training provenance architecture must match checkpoint architecture")
    artifact = provenance.get("model_artifact")
    if isinstance(artifact, str):
        artifact_path = resolve_project_path(Path(artifact), "training provenance model_artifact")
        if artifact_path != checkpoint_path.resolve():
            raise ExportError(
                f"training provenance model_artifact does not match checkpoint: {artifact_path} != {checkpoint_path}"
            )


def validate_reference(reference: Any, context: str) -> Path:
    if not isinstance(reference, dict):
        raise ExportError(f"{context} must be an object")
    path_value = reference.get("path")
    sha256_value = reference.get("sha256")
    if not isinstance(path_value, str) or not path_value.strip():
        raise ExportError(f"{context}.path must be a non-empty string")
    if not isinstance(sha256_value, str) or not all(character in "0123456789abcdef" for character in sha256_value) or len(sha256_value) != 64:
        raise ExportError(f"{context}.sha256 must be a lowercase SHA-256 digest")
    file = resolve_project_path(Path(path_value), f"{context}.path")
    if not file.exists():
        raise ExportError(f"{context}.path does not exist: {path_value}")
    actual = sha256_file(file)
    if actual != sha256_value:
        raise ExportError(f"{context}.sha256 mismatch for {path_value}; expected {sha256_value}, got {actual}")
    return file


def compare_manifest_summary(
    expected: dict[str, Any],
    actual: dict[str, Any],
    context: str,
) -> None:
    current = {
        "path": project_relative(Path(actual["path"])),
        "split": actual["split"],
        "dataset_id": actual["dataset_id"],
        "label_count": actual.get("label_count"),
        "clip_count": actual["clip_count"],
        "min_clips_per_label_per_split": actual.get("min_clips_per_label_per_split"),
        "sha256": actual["sha256"],
        "source_register": actual.get("source_register"),
        "dataset_source_mode": actual.get("dataset_source_mode"),
        "external_dataset_import": actual.get("external_dataset_import"),
        "collection_plan": actual.get("collection_plan"),
        "consent_form": actual.get("consent_form"),
        "vocabulary_review": actual.get("vocabulary_review"),
    }
    for key, value in current.items():
        if expected.get(key) != value:
            raise ExportError(f"{context}.{key} does not match strict manifest validation")


def compare_negative_challenge_summary(
    expected: dict[str, Any],
    actual: dict[str, Any],
) -> None:
    current = {
        "path": project_relative(Path(actual["path"])),
        "dataset_id": actual["dataset_id"],
        "split": actual["split"],
        "clip_count": actual["clip_count"],
        "sha256": actual["sha256"],
        "dataset_source_mode": actual.get("dataset_source_mode"),
        "external_dataset_import": actual.get("external_dataset_import"),
        "source_register": actual.get("source_register"),
        "collection_plan": actual.get("collection_plan"),
        "consent_form": actual.get("consent_form"),
        "vocabulary_review": actual.get("vocabulary_review"),
        "challenge_type_counts": actual["challenge_type_counts"],
    }
    for key, value in current.items():
        if expected.get(key) != value:
            raise ExportError(f"negative_challenge.manifest.{key} does not match strict validation")


def validate_strict_manifest_files(
    provenance: dict[str, Any],
    allow_smoke_export: bool,
) -> list[dict[str, Any]]:
    entries = provenance.get("manifests")
    if not isinstance(entries, list):
        raise ExportError("calibrated provenance manifests must be an array")
    by_split = {entry.get("split"): entry for entry in entries if isinstance(entry, dict)}
    manifests = []
    for split in ("train", "validation", "test"):
        entry = by_split.get(split)
        if not isinstance(entry, dict):
            raise ExportError(f"calibrated provenance is missing {split} manifest summary")
        manifest_path = validate_reference(entry, f"{split} manifest")
        if allow_smoke_export:
            try:
                manifest = validate_manifest(manifest_path, split, True, False)
            except ManifestError:
                manifest = validate_manifest(manifest_path, split, True, True)
        else:
            manifest = validate_manifest(manifest_path, split, True, False)
        compare_manifest_summary(entry, manifest, f"{split} manifest")
        manifests.append(manifest)
    assert_signer_disjoint(manifests)
    assert_label_sets_match(manifests)

    negative_challenge = provenance.get("negative_challenge")
    if not isinstance(negative_challenge, dict):
        raise ExportError("calibrated provenance lacks negative challenge evidence")
    challenge_entry = negative_challenge.get("manifest")
    if not isinstance(challenge_entry, dict):
        raise ExportError("negative_challenge.manifest must be an object")
    challenge_path = validate_reference(challenge_entry, "negative_challenge.manifest")
    challenge_manifest = validate_negative_challenge_manifest(
        challenge_path,
        manifests,
        allow_smoke_export,
    )
    compare_negative_challenge_summary(challenge_entry, challenge_manifest)
    return manifests


def validate_final_export_inputs(
    checkpoint: dict[str, Any],
    provenance: dict[str, Any],
    allow_smoke_export: bool,
) -> None:
    label_count = len(checkpoint["label_to_index"])
    hyperparameters = provenance.get("hyperparameters", {})
    manifests = provenance.get("manifests", [])
    splits = {item.get("split") for item in manifests if isinstance(item, dict)}
    dataset_ids = {
        str(item.get("dataset_id", "")).lower() for item in manifests if isinstance(item, dict)
    }

    smoke_reasons = []
    if provenance.get("schema_version") != CALIBRATED_PROVENANCE_SCHEMA_VERSION:
        smoke_reasons.append(
            f"calibrated provenance schema_version must be {CALIBRATED_PROVENANCE_SCHEMA_VERSION}"
        )
    evidence_mode = provenance.get("evidence_mode")
    if evidence_mode not in ("final", "controlled_pilot"):
        smoke_reasons.append("calibrated provenance evidence_mode must be final or controlled_pilot")
    expected_calibration_status = (
        "controlled_pilot_validation_passed"
        if evidence_mode == "controlled_pilot"
        else "candidate_final_validation_passed"
    )
    expected_evidence_flag = (
        "controlled_pilot_evidence"
        if evidence_mode == "controlled_pilot"
        else "final_model_evidence"
    )
    if provenance.get("calibration_status") != expected_calibration_status:
        smoke_reasons.append(
            f"calibrated provenance calibration_status must be {expected_calibration_status}"
        )
    if provenance.get(expected_evidence_flag) is not True:
        smoke_reasons.append(f"calibrated provenance {expected_evidence_flag} must be true")
    if not (75 <= label_count <= 100):
        smoke_reasons.append(f"label_count is {label_count}, not 75-100")
    if hyperparameters.get("max_train_batches") is not None:
        smoke_reasons.append("training was capped with max_train_batches")
    if hyperparameters.get("max_validation_batches") is not None:
        smoke_reasons.append("validation was capped with max_validation_batches")
    if not isinstance(provenance.get("training_command"), list) or not provenance.get("training_command"):
        smoke_reasons.append("calibrated provenance lacks training_command")
    try:
        validate_reference(provenance.get("training_script"), "training_script")
    except ExportError as error:
        smoke_reasons.append(str(error))
    if not isinstance(provenance.get("environment_files"), list) or not provenance.get("environment_files"):
        smoke_reasons.append("calibrated provenance lacks training environment file hashes")
    else:
        for index, reference in enumerate(provenance["environment_files"]):
            try:
                validate_reference(reference, f"environment_files[{index}]")
            except ExportError as error:
                smoke_reasons.append(str(error))
    try:
        validate_reference(provenance.get("local_ml_environment"), "local_ml_environment")
    except ExportError as error:
        smoke_reasons.append(str(error))
    if not isinstance(provenance.get("evaluation_command"), list) or not provenance.get("evaluation_command"):
        smoke_reasons.append("calibrated provenance lacks evaluation_command")
    try:
        validate_reference(provenance.get("evaluation_script"), "evaluation_script")
    except ExportError as error:
        smoke_reasons.append(str(error))
    if (
        not isinstance(provenance.get("evaluation_environment_files"), list)
        or not provenance.get("evaluation_environment_files")
    ):
        smoke_reasons.append("calibrated provenance lacks evaluation environment file hashes")
    else:
        for index, reference in enumerate(provenance["evaluation_environment_files"]):
            try:
                validate_reference(reference, f"evaluation_environment_files[{index}]")
            except ExportError as error:
                smoke_reasons.append(str(error))
    try:
        validate_reference(
            provenance.get("evaluation_local_ml_environment"),
            "evaluation_local_ml_environment",
        )
    except ExportError as error:
        smoke_reasons.append(str(error))
    if splits != {"train", "validation", "test"}:
        smoke_reasons.append(f"manifest splits are {sorted(splits)}, not train/validation/test")
    try:
        validate_strict_manifest_files(provenance, allow_smoke_export)
    except (ExportError, EvaluationError, ManifestError) as error:
        smoke_reasons.append(str(error))
    if any(not isinstance(item.get("source_register"), dict) for item in manifests if isinstance(item, dict)):
        smoke_reasons.append("one or more manifests lack source_register evidence")
    first_party_manifests = [
        item for item in manifests
        if isinstance(item, dict)
        and item.get("dataset_source_mode", FIRST_PARTY_DATASET_SOURCE_MODE) == FIRST_PARTY_DATASET_SOURCE_MODE
    ]
    external_manifests = [
        item for item in manifests
        if isinstance(item, dict)
        and item.get("dataset_source_mode") == EXTERNAL_DATASET_SOURCE_MODE
    ]
    collection_plans = [item.get("collection_plan") for item in first_party_manifests]
    if any(not isinstance(item, dict) for item in collection_plans):
        smoke_reasons.append("one or more first-party manifests lack collection_plan evidence")
    elif collection_plans and any(item != collection_plans[0] for item in collection_plans[1:]):
        smoke_reasons.append("first-party manifest collection_plan evidence does not match across splits")
    consent_forms = [item.get("consent_form") for item in first_party_manifests]
    if any(not isinstance(item, dict) for item in consent_forms):
        smoke_reasons.append("one or more first-party manifests lack consent_form evidence")
    elif consent_forms and any(item != consent_forms[0] for item in consent_forms[1:]):
        smoke_reasons.append("first-party manifest consent_form evidence does not match across splits")
    if any(not isinstance(item.get("external_dataset_import"), dict) for item in external_manifests):
        smoke_reasons.append("one or more external manifests lack external_dataset_import evidence")
    vocabulary_reviews = [
        item.get("vocabulary_review") for item in manifests if isinstance(item, dict)
    ]
    if any(not isinstance(item, dict) for item in vocabulary_reviews):
        smoke_reasons.append("one or more manifests lack vocabulary_review evidence")
    elif vocabulary_reviews and any(item != vocabulary_reviews[0] for item in vocabulary_reviews[1:]):
        smoke_reasons.append("manifest vocabulary_review evidence does not match across splits")
    if any("synthetic" in dataset_id or "smoke" in dataset_id or "not-asl" in dataset_id for dataset_id in dataset_ids):
        smoke_reasons.append("manifest dataset_id indicates synthetic/smoke/non-ASL data")
    negative_challenge = provenance.get("negative_challenge")
    if not isinstance(negative_challenge, dict):
        smoke_reasons.append("calibrated provenance lacks negative challenge evidence")
    else:
        try:
            validate_reference(negative_challenge.get("manifest"), "negative_challenge.manifest")
        except ExportError as error:
            smoke_reasons.append(str(error))
        false_pass_rate = negative_challenge.get("false_pass_rate")
        if not isinstance(false_pass_rate, (int, float)) or false_pass_rate >= TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE:
            smoke_reasons.append(
                "negative challenge false_pass_rate must be below "
                f"{TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE}"
            )

    if smoke_reasons and not allow_smoke_export:
        formatted = "; ".join(smoke_reasons)
        raise ExportError(
            "export input is not eligible for a final browser artifact: "
            f"{formatted}. Use --allow-smoke-export only for wiring tests."
        )


def export_onnx(
    torch: Any,
    onnx: Any,
    checkpoint: dict[str, Any],
    output_path: Path,
    opset: int,
) -> None:
    label_to_index = checkpoint["label_to_index"]
    frame_count = int(checkpoint["frame_count"])
    image_size = int(checkpoint["image_size"])
    if frame_count <= 0 or image_size <= 0:
        raise ExportError("checkpoint frame_count and image_size must be positive")

    architecture = checkpoint_architecture(checkpoint)
    model = build_model(torch, len(label_to_index), architecture)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    dummy = torch.zeros(1, frame_count, 3, image_size, image_size, dtype=torch.float32)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model,
        dummy,
        output_path,
        export_params=True,
        opset_version=opset,
        do_constant_folding=True,
        input_names=["clips"],
        output_names=["logits"],
        dynamic_axes={
            "clips": {0: "batch"},
            "logits": {0: "batch"},
        },
    )
    onnx_model = onnx.load(str(output_path))
    onnx.checker.check_model(onnx_model)


def float32_tensor_bytes(tensor: Any) -> bytes:
    array = tensor.detach().cpu().contiguous().numpy().astype("<f4", copy=False)
    return array.tobytes()


def label_for_index(label_to_index: dict[str, int], index: int) -> str:
    for label_id, label_index in label_to_index.items():
        if int(label_index) == index:
            return label_id
    raise ExportError(f"label_to_index does not contain index {index}")


def select_parity_clip(
    provenance: dict[str, Any],
    torch: Any,
    frame_count: int,
    image_size: int,
) -> tuple[Path, dict[str, Any], Path, Any]:
    entries = provenance.get("manifests")
    if not isinstance(entries, list):
        raise ExportError("calibrated provenance manifests must be an array before parity fixture generation")
    by_split = {entry.get("split"): entry for entry in entries if isinstance(entry, dict)}
    for split in ("validation", "test"):
        manifest_entry = by_split.get(split)
        if not isinstance(manifest_entry, dict):
            continue
        manifest_path = validate_reference(manifest_entry, f"browser parity {split} manifest")
        manifest = load_manifest(manifest_path)
        clips = manifest.get("clips")
        if not isinstance(clips, list) or not clips:
            continue
        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                continue
            context = f"{manifest_path}: parity clips[{index}]"
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            if not tensor_path.exists():
                continue
            expected_hash = expected_tensor_hash_for_clip(clip, context)
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise ExportError(
                    f"{context} decoded tensor hash mismatch for parity fixture; "
                    f"expected {expected_hash}, got {actual_hash}"
                )
            frames = prepare_frames(
                torch,
                load_tensor_file(torch, tensor_path),
                frame_count=frame_count,
                image_size=image_size,
                context=f"{manifest_path}: parity clip {clip.get('clip_id')}",
            )
            return manifest_path, clip, tensor_path, frames
    raise ExportError("unable to find a hash-pinned validation/test tensor for browser parity fixture")


def write_browser_parity_fixture(
    torch: Any,
    checkpoint: dict[str, Any],
    provenance: dict[str, Any],
    checkpoint_path: Path,
    provenance_path: Path,
    browser_artifact_path: Path,
    fixture_path: Path,
) -> dict[str, Any]:
    label_to_index = checkpoint["label_to_index"]
    frame_count = int(checkpoint["frame_count"])
    image_size = int(checkpoint["image_size"])
    manifest_path, clip, tensor_path, frames = select_parity_clip(
        provenance,
        torch,
        frame_count,
        image_size,
    )
    architecture = checkpoint_architecture(checkpoint)
    model = build_model(torch, len(label_to_index), architecture)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    input_tensor = frames.unsqueeze(0).contiguous().to(dtype=torch.float32)
    with torch.no_grad():
        logits = model(input_tensor).detach().cpu().contiguous()

    input_bytes = float32_tensor_bytes(input_tensor)
    logits_bytes = float32_tensor_bytes(logits)
    top_index = int(logits.reshape(-1).argmax().item())
    fixture = {
        "schema_version": PARITY_FIXTURE_SCHEMA_VERSION,
        "status": "ready",
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source_clip": {
            "manifest": file_reference(manifest_path),
            "split": clip.get("split"),
            "clip_id": clip.get("clip_id"),
            "label_id": clip.get("label_id"),
            "relative_frame_tensor_path": clip.get("relative_frame_tensor_path"),
            "frame_tensor_sha256": clip.get("frame_tensor_sha256"),
            "tensor_file": file_reference(tensor_path),
        },
        "checkpoint": file_reference(checkpoint_path),
        "training_provenance": file_reference(provenance_path),
        "browser_artifact": file_reference(browser_artifact_path),
        "model": {
            "input_name": "clips",
            "output_name": "logits",
            "input_shape": list(input_tensor.shape),
            "logits_shape": list(logits.shape),
            "label_count": len(label_to_index),
            "label_to_index": label_to_index,
            "expected_top_label_id": label_for_index(label_to_index, top_index),
        },
        "input_tensor": {
            "dtype": "float32",
            "layout": "N,T,C,H,W",
            "shape": list(input_tensor.shape),
            "encoding": "base64_le_float32",
            "sha256": sha256_bytes(input_bytes),
            "base64": base64.b64encode(input_bytes).decode("ascii"),
        },
        "expected_logits": {
            "dtype": "float32",
            "shape": list(logits.shape),
            "encoding": "array_and_base64_le_float32",
            "sha256": sha256_bytes(logits_bytes),
            "values": [float(value) for value in logits.reshape(-1).tolist()],
            "base64": base64.b64encode(logits_bytes).decode("ascii"),
        },
        "tolerance": {
            "max_abs_diff": 1e-4,
            "max_rel_diff": 1e-4,
        },
    }
    fixture_path.parent.mkdir(parents=True, exist_ok=True)
    fixture_path.write_text(json.dumps(fixture, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return fixture


def main() -> int:
    args = parse_args()
    try:
        torch = import_torch()
        onnx = import_onnx()
        checkpoint_path = resolve_project_path(args.checkpoint, "checkpoint")
        provenance_path = resolve_project_path(args.training_provenance, "training provenance")
        output_path = resolve_project_path(args.output, "ONNX output")
        parity_fixture_path = resolve_project_path(args.parity_fixture, "browser parity fixture")
        report_path = resolve_project_path(
            args.export_report
            if args.export_report
            else output_path.with_name(f"{output_path.stem}-export-provenance.json"),
            "export report",
        )
        if not args.dry_run and not args.allow_smoke_export:
            require_current_local_ml_environment("final ONNX export")

        checkpoint = load_checkpoint(torch, checkpoint_path)
        provenance = read_json(provenance_path)
        validate_training_provenance(provenance, checkpoint_path, checkpoint)
        validate_final_export_inputs(checkpoint, provenance, args.allow_smoke_export)
        frame_count = int(checkpoint["frame_count"])
        image_size = int(checkpoint["image_size"])
        architecture = checkpoint_architecture(checkpoint)
        export_evidence_mode = (
            "smoke"
            if args.allow_smoke_export
            else (
                provenance.get("evidence_mode")
                if provenance.get("evidence_mode") in ("final", "controlled_pilot")
                else "final"
            )
        )
        plan = {
            "schema_version": ONNX_EXPORT_PROVENANCE_SCHEMA_VERSION,
            "status": "dry_run" if args.dry_run else "exported",
            "finality": (
                "smoke_only"
                if args.allow_smoke_export
                else "controlled_pilot_browser_artifact"
                if export_evidence_mode == "controlled_pilot"
                else "candidate_final_artifact"
            ),
            "evidence_mode": export_evidence_mode,
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "generated_by": generated_by(args.allow_smoke_export, export_evidence_mode),
            "export_format": "onnx",
            "opset": args.opset,
            "export_command": [sys.executable, *sys.argv],
            "export_script": {
                "path": project_relative(Path(__file__)),
                "sha256": sha256_file(Path(__file__)),
            },
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
            "checkpoint": {
                "path": project_relative(checkpoint_path),
                "sha256": sha256_file(checkpoint_path),
            },
            "training_provenance": {
                "path": project_relative(provenance_path),
                "sha256": sha256_file(provenance_path),
            },
            "random_initialization_evidence": provenance.get("random_initialization_evidence"),
            "source_register": (
                provenance.get("manifests", [{}])[0].get("source_register")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "dataset_source_mode": (
                provenance.get("manifests", [{}])[0].get("dataset_source_mode")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "external_dataset_import": (
                provenance.get("manifests", [{}])[0].get("external_dataset_import")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "collection_plan": (
                provenance.get("manifests", [{}])[0].get("collection_plan")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "vocabulary_review": (
                provenance.get("manifests", [{}])[0].get("vocabulary_review")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "consent_form": (
                provenance.get("manifests", [{}])[0].get("consent_form")
                if isinstance(provenance.get("manifests"), list)
                and provenance.get("manifests")
                and isinstance(provenance.get("manifests", [{}])[0], dict)
                else None
            ),
            "browser_artifact": {
                "path": project_relative(output_path),
                "sha256": None,
            },
            "browser_parity_fixture": {
                "path": project_relative(parity_fixture_path),
                "sha256": None,
            },
            "model": {
                "architecture": architecture,
                "frame_count": frame_count,
                "image_size": image_size,
                "input_name": "clips",
                "input_shape": ["batch", frame_count, 3, image_size, image_size],
                "output_name": "logits",
                "label_count": len(checkpoint["label_to_index"]),
                "label_to_index": checkpoint["label_to_index"],
                "pretrained_components": [],
            },
            "negative_challenge": provenance.get("negative_challenge"),
        }

        if not args.dry_run:
            export_onnx(torch, onnx, checkpoint, output_path, args.opset)
            plan["browser_artifact"]["sha256"] = sha256_file(output_path)
            write_browser_parity_fixture(
                torch,
                checkpoint,
                provenance,
                checkpoint_path,
                provenance_path,
                output_path,
                parity_fixture_path,
            )
            plan["browser_parity_fixture"] = file_reference(parity_fixture_path)
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            plan["export_report"] = {
                "path": project_relative(report_path),
                "sha256": sha256_file(report_path),
            }

        print(json.dumps(plan, indent=2, sort_keys=True))
    except (ExportError, TrainingError) as error:
        print(f"ONNX export failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
