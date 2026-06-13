#!/usr/bin/env python3
"""Evaluate and calibrate a from-scratch raw-frame ASL checkpoint."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from rawframe_decode_provenance import (
    DecodeProvenanceError,
    verify_clip_decode_provenance,
)
from train_rawframe_model import (
    ALLOWED_NEGATIVE_CHALLENGE_TYPES,
    ALLOWED_FRAME_SOURCE,
    EXTERNAL_DATASET_SOURCE_MODE,
    FIRST_PARTY_DATASET_SOURCE_MODE,
    LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE,
    M3GQ_REDUCED4_LABEL_IDS,
    M3GU_REDUCED4_TRAINING_SMOKE_OUTPUT_DIR,
    MAX_LESSON_MILESTONE_LABELS,
    MAX_REDUCED_REAL_DATA_LABELS,
    MIN_LESSON_MILESTONE_LABELS,
    MIN_REDUCED_REAL_DATA_LABELS,
    ManifestError,
    POPSIGN_FRESH5_REPAIRED_LABEL_IDS,
    POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS,
    RawFrameClipDataset,
    TrainingError,
    assert_label_sets_match,
    assert_signer_disjoint,
    build_model,
    checkpoint_architecture,
    contains_prohibited_token,
    expected_tensor_hash_for_clip,
    import_torch,
    local_ml_environment_reference,
    load_tensor_file,
    prepare_frames,
    require_current_local_ml_environment,
    resolve_manifest_relative_path,
    select_device,
    should_verify_retained_local_ml_environment,
    tensor_path_for_clip,
    validate_external_dataset_import,
    validate_capture_condition_evidence,
    validate_collection_plan,
    validate_collection_plan_assignment,
    validate_consent_form,
    validate_manifest,
    validate_popsign_label_ladder_training_smoke_invocation,
    validate_signed_consent_evidence,
    validate_source_register,
    validate_vocabulary_review,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TARGET_TOP1 = 0.70
TARGET_MACRO_F1 = 0.65
TARGET_FALSE_PASS_RATE = 0.10
TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE = 0.05
EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION = "asl-pilot-negative-challenge-manifest/v1"
TRAINING_PROVENANCE_SCHEMA_VERSION = "asl-pilot-training-provenance/v1"
VALIDATION_REPORT_SCHEMA_VERSION = "asl-pilot-validation-report/v1"
CALIBRATED_PROVENANCE_SCHEMA_VERSION = "asl-pilot-calibrated-provenance/v1"
PREDICTION_SIDECAR_SCHEMA_VERSION = "asl-pilot-rawframe-prediction-sidecar/v2"
PREDICTION_SIDECAR_CONTRACT_VERSION = "asl-pilot-rawframe-prediction-sidecar-contract/v2"
M3GY_REDUCED4_DIAGNOSTIC_EVAL_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3gy-reduced4-diagnostic-eval-rerun-no-brev"
).resolve()
CONTROLLED_PILOT_REQUIRED_CHALLENGE_TYPES = {
    "empty_camera",
    "no_hands_visible",
    "low_light",
    "off_center",
}
LESSON_CORE_NEGATIVE_DIAGNOSTIC_REQUIRED_CHALLENGE_TYPES = (
    CONTROLLED_PILOT_REQUIRED_CHALLENGE_TYPES | {"non_target_asl_sign"}
)
REQUIRED_CHALLENGE_TYPES = {
    "idle_hands",
    "empty_camera",
    "no_hands_visible",
    "low_light",
    "off_center",
    "hands_cropped_out",
    "waving",
    "thumbs_up",
    "counting",
    "fingerspelling_like_motion",
    "wrong_location",
    "wrong_palm_orientation",
    "partial_sign",
    "non_target_asl_sign",
    "casual_non_asl_gesture",
    "mouth_touch",
    "hand_clap",
}
ALLOWED_CHALLENGE_TYPES = ALLOWED_NEGATIVE_CHALLENGE_TYPES
MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE = 5


class EvaluationError(RuntimeError):
    """Raised when a checkpoint cannot produce valid validation evidence."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate a trained raw-frame checkpoint on signer-disjoint validation/test "
            "manifests and select a fail-closed confidence threshold."
        )
    )
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=Path("artifacts/rawframe-model/model_state.pt"),
        help="Path to model_state.pt from scripts/train_rawframe_model.py.",
    )
    parser.add_argument(
        "--training-provenance",
        type=Path,
        default=Path("artifacts/rawframe-model/training-provenance.json"),
        help="Path to training-provenance.json from scripts/train_rawframe_model.py.",
    )
    parser.add_argument(
        "--train-manifest",
        type=Path,
        required=True,
        help="Training manifest, used for signer-disjoint and provenance checks.",
    )
    parser.add_argument(
        "--validation-manifest",
        type=Path,
        required=True,
        help="Validation manifest used for threshold calibration.",
    )
    parser.add_argument(
        "--test-manifest",
        type=Path,
        required=True,
        help="Signer-disjoint test manifest used for final held-out reporting.",
    )
    parser.add_argument(
        "--challenge-manifest",
        type=Path,
        help=(
            "Negative challenge manifest with empty-camera/no-hands/low-light/off-center "
            "clips expected to be rejected. Required for final validation."
        ),
    )
    parser.add_argument(
        "--output-report",
        type=Path,
        default=Path("artifacts/rawframe-model/validation-report.json"),
        help="Machine-readable validation report JSON output path.",
    )
    parser.add_argument(
        "--calibrated-provenance",
        type=Path,
        default=Path("artifacts/rawframe-model/calibrated-provenance.json"),
        help="Training provenance copy augmented with calibrated threshold evidence.",
    )
    parser.add_argument(
        "--prediction-sidecar",
        type=Path,
        help=(
            "Optional diagnostic JSON sidecar retaining per-example validation/test/"
            "negative-challenge prediction scores. The main validation report still "
            "omits predictions."
        ),
    )
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument(
        "--allow-smoke-eval",
        action="store_true",
        help="Allow small/synthetic/capped artifacts for wiring tests only.",
    )
    parser.add_argument(
        "--lesson-milestone",
        action="store_true",
        help=(
            "Evaluate the strict real-data 25-sign lesson milestone. This permits "
            "25-40 labels but still requires challenge data, strict provenance, "
            "decode evidence, and held-out signer-disjoint manifests."
        ),
    )
    parser.add_argument(
        "--lesson-core-negative-diagnostic",
        action="store_true",
        help=(
            "With --lesson-milestone, run a diagnostic-only evaluation using the "
            "current core negative-challenge taxonomy instead of the full 17-type "
            "hard-negative gate. This writes metrics but is never promotion or "
            "calibrated-threshold evidence."
        ),
    )
    parser.add_argument(
        "--controlled-pilot",
        action="store_true",
        help=(
            "Evaluate the 75-100-sign Superbuilders controlled-pilot target. This "
            "keeps strict source, no-pretrained, decode, and signer-disjoint checks "
            "but requires only the current core negative-challenge taxonomy; expanded "
            "hard negatives remain stretch-hardening evidence."
        ),
    )
    parser.add_argument(
        "--controlled-clip-heldout",
        action="store_true",
        help=(
            "Evaluate the documented 75-100-sign controlled-pilot clip-heldout "
            "fallback. This preserves strict source/no-pretrained/decode checks "
            "but does not claim signer-disjoint validation."
        ),
    )
    parser.add_argument(
        "--reduced-real-data-training-smoke",
        action="store_true",
        help=(
            "Evaluate the bounded seven-label ASL Citizen high-signal local "
            "training smoke. This keeps strict source/decode/no-pretrained checks "
            "but is not final, lesson milestone, or calibration evidence."
        ),
    )
    parser.add_argument(
        "--region-grid-tcn-training-smoke",
        action="store_true",
        help=(
            "Evaluate the bounded seven-label ASL Citizen high-signal region-grid "
            "true TemporalConvNet smoke with region-axis-preserving model input. "
            "This is not final, lesson milestone, or calibration evidence."
        ),
    )
    parser.add_argument(
        "--m3gu-reduced4-training-smoke",
        action="store_true",
        help=(
            "Evaluate the Mission 3GU four-label ASL Citizen reduced4 local "
            "diagnostic smoke. This is not final, lesson milestone, browser, "
            "promotion, or calibration evidence."
        ),
    )
    parser.add_argument(
        "--popsign-fresh5-training-smoke",
        action="store_true",
        help=(
            "Evaluate the bounded five-label PopSign fresh5 repaired-manifest "
            "training smoke with region-axis-preserving model input. This is "
            "not final, lesson milestone, or calibration evidence."
        ),
    )
    parser.add_argument(
        "--popsign-label-ladder-training-smoke",
        action="store_true",
        help=(
            "Evaluate the bounded PopSign label-ladder training smoke. This is "
            "not final, lesson milestone, promotion, browser, or calibration evidence."
        ),
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise EvaluationError(f"JSON file does not exist: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise EvaluationError(f"JSON file is invalid: {path}: {error}") from error
    if not isinstance(data, dict):
        raise EvaluationError(f"JSON file root must be an object: {path}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def resolve_project_path(path: Path, context: str, must_exist: bool = True) -> Path:
    resolved = path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise EvaluationError(f"{context} escapes the project root: {path}") from error
    if must_exist and not resolved.exists():
        raise EvaluationError(f"{context} does not exist: {path}")
    return resolved


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def file_reference(path: Path) -> dict[str, str]:
    resolved = path.resolve()
    return {
        "path": project_relative(resolved),
        "sha256": sha256_file(resolved),
    }


def validate_m3gu_reduced4_evaluation_outputs(
    output_report_path: Path,
    calibrated_provenance_path: Path,
    sidecar_path: Path | None,
) -> None:
    actual = {
        "output report": output_report_path.resolve(),
        "calibrated provenance": calibrated_provenance_path.resolve(),
    }
    if sidecar_path is not None:
        actual["prediction sidecar"] = sidecar_path.resolve()
    allowed_output_dirs = (
        M3GU_REDUCED4_TRAINING_SMOKE_OUTPUT_DIR,
        M3GY_REDUCED4_DIAGNOSTIC_EVAL_OUTPUT_DIR,
    )
    matched_output_dir: Path | None = None
    for output_dir in allowed_output_dirs:
        expected = {
            "output report": output_dir / "validation-report.json",
            "calibrated provenance": output_dir / "calibrated-provenance.json",
        }
        if sidecar_path is not None:
            expected["prediction sidecar"] = output_dir / "prediction-sidecar.json"
        if all(actual[label] == expected_path.resolve() for label, expected_path in expected.items()):
            matched_output_dir = output_dir.resolve()
            break
    else:
        allowed = ", ".join(project_relative(output_dir) for output_dir in allowed_output_dirs)
        raise EvaluationError(f"M3GU reduced4 evaluation requires outputs under one of: {allowed}")
    for path in actual.values():
        if path.exists():
            raise EvaluationError(f"M3GU reduced4 evaluation output already exists: {project_relative(path)}")


def tensor_value_as_float(value: Any) -> float:
    return float(value.item()) if hasattr(value, "item") else float(value)


def build_probability_by_label(row_probabilities: Any, labels_by_index: list[str]) -> dict[str, float]:
    return {
        label: tensor_value_as_float(row_probabilities[index])
        for index, label in enumerate(labels_by_index)
    }


def build_logit_by_label(row_logits: Any, labels_by_index: list[str]) -> dict[str, float]:
    return {
        label: tensor_value_as_float(row_logits[index])
        for index, label in enumerate(labels_by_index)
    }


def prediction_example_id(split: str, manifest_row_index: int, clip_id: str) -> str:
    return f"rawframe-eval:{split}:{manifest_row_index:06d}:{clip_id}"


def sidecar_manifest_metadata_for_clip(
    clip: dict[str, Any],
    manifest_path: Path,
    manifest_reference: dict[str, str],
    manifest_row_index: int,
    split: str,
) -> dict[str, Any]:
    context = f"{manifest_path}: clips[{manifest_row_index}]"
    clip_id = clip.get("clip_id")
    if not isinstance(clip_id, str) or not clip_id.strip():
        raise EvaluationError(f"{context} is missing non-empty clip_id")
    tensor_path = tensor_path_for_clip(clip, manifest_path, context)
    tensor_sha256 = expected_tensor_hash_for_clip(clip, context)
    return {
        "example_id": prediction_example_id(split, manifest_row_index, clip_id),
        "split": split,
        "manifest_path": manifest_reference["path"],
        "manifest_sha256": manifest_reference["sha256"],
        "manifest_row_index": manifest_row_index,
        "tensor_path": project_relative(tensor_path),
        "tensor_sha256": tensor_sha256,
        "tensor_hash_source": "manifest.frame_tensor_sha256",
        "source_id": clip.get("source_id"),
        "source_category": clip.get("source_category"),
        "source_license_decision": clip.get("source_license_decision"),
        "source_license_review_status": clip.get("source_license_review_status"),
        "source_subject_rights_evidence": clip.get("source_subject_rights_evidence"),
        "crop_config": clip.get("crop_config"),
        "crop_regions": clip.get("crop_regions"),
        "derived_features": clip.get("derived_features"),
        "review": clip.get("review"),
    }


def manifest_metadata_by_clip_id(manifest_path: Path, split: str) -> dict[str, dict[str, Any]]:
    data = read_json(manifest_path)
    clips = data.get("clips")
    if not isinstance(clips, list):
        raise EvaluationError(f"manifest clips must be an array: {manifest_path}")
    manifest_reference = file_reference(manifest_path)
    metadata_by_clip_id: dict[str, dict[str, Any]] = {}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise EvaluationError(f"{manifest_path}: clips[{index}] must be an object")
        metadata = sidecar_manifest_metadata_for_clip(
            clip,
            manifest_path,
            manifest_reference,
            index,
            split,
        )
        clip_id = str(clip["clip_id"])
        if clip_id in metadata_by_clip_id:
            raise EvaluationError(f"{manifest_path}: duplicate clip_id in manifest metadata: {clip_id}")
        metadata_by_clip_id[clip_id] = metadata
    return metadata_by_clip_id


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


def evaluation_evidence_mode(
    allow_smoke_eval: bool,
    lesson_milestone: bool,
    controlled_pilot: bool = False,
    controlled_clip_heldout: bool = False,
    lesson_core_negative_diagnostic: bool = False,
    reduced_real_data_training_smoke: bool = False,
    region_grid_tcn_training_smoke: bool = False,
    m3gu_reduced4_training_smoke: bool = False,
    popsign_fresh5_training_smoke: bool = False,
    popsign_label_ladder_training_smoke: bool = False,
) -> str:
    if allow_smoke_eval:
        return "smoke"
    if popsign_label_ladder_training_smoke:
        return "popsign_label_ladder_training_smoke"
    if popsign_fresh5_training_smoke:
        return "popsign_fresh5_training_smoke"
    if m3gu_reduced4_training_smoke:
        return "m3gu_reduced4_training_smoke"
    if region_grid_tcn_training_smoke:
        return "region_grid_tcn_training_smoke"
    if reduced_real_data_training_smoke:
        return "reduced_real_data_training_smoke"
    if lesson_core_negative_diagnostic:
        return "lesson_core_negative_diagnostic"
    if lesson_milestone:
        return "lesson_milestone"
    if controlled_clip_heldout:
        return "controlled_clip_heldout"
    if controlled_pilot:
        return "controlled_pilot"
    return "final"


def generated_by(
    allow_smoke_eval: bool,
    lesson_milestone: bool = False,
    controlled_pilot: bool = False,
    controlled_clip_heldout: bool = False,
    lesson_core_negative_diagnostic: bool = False,
    reduced_real_data_training_smoke: bool = False,
    region_grid_tcn_training_smoke: bool = False,
    m3gu_reduced4_training_smoke: bool = False,
    popsign_fresh5_training_smoke: bool = False,
    popsign_label_ladder_training_smoke: bool = False,
) -> dict[str, Any]:
    return {
        "tool": "scripts/evaluate_rawframe_model.py",
        "command": [sys.executable, *sys.argv],
        "script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "allow_smoke_eval": allow_smoke_eval,
        "lesson_milestone": lesson_milestone,
        "lesson_core_negative_diagnostic": lesson_core_negative_diagnostic,
        "controlled_pilot": controlled_pilot,
        "controlled_clip_heldout": controlled_clip_heldout,
        "reduced_real_data_training_smoke": reduced_real_data_training_smoke,
        "region_grid_tcn_training_smoke": region_grid_tcn_training_smoke,
        "m3gu_reduced4_training_smoke": m3gu_reduced4_training_smoke,
        "popsign_fresh5_training_smoke": popsign_fresh5_training_smoke,
        "popsign_label_ladder_training_smoke": popsign_label_ladder_training_smoke,
        "evidence_mode": evaluation_evidence_mode(
            allow_smoke_eval,
            lesson_milestone,
            controlled_pilot,
            controlled_clip_heldout,
            lesson_core_negative_diagnostic,
            reduced_real_data_training_smoke,
            region_grid_tcn_training_smoke,
            m3gu_reduced4_training_smoke,
            popsign_fresh5_training_smoke,
            popsign_label_ladder_training_smoke,
        ),
    }


def required_negative_challenge_types(args: argparse.Namespace) -> set[str]:
    if args.popsign_label_ladder_training_smoke:
        return set()
    if args.popsign_fresh5_training_smoke:
        return set()
    if args.m3gu_reduced4_training_smoke:
        return set()
    if args.region_grid_tcn_training_smoke:
        return set()
    if args.reduced_real_data_training_smoke:
        return set()
    if args.lesson_core_negative_diagnostic:
        return LESSON_CORE_NEGATIVE_DIAGNOSTIC_REQUIRED_CHALLENGE_TYPES
    if args.controlled_pilot or args.controlled_clip_heldout:
        return CONTROLLED_PILOT_REQUIRED_CHALLENGE_TYPES
    return REQUIRED_CHALLENGE_TYPES


def load_checkpoint(torch: Any, checkpoint_path: Path) -> dict[str, Any]:
    if not checkpoint_path.exists():
        raise EvaluationError(f"checkpoint does not exist: {checkpoint_path}")
    try:
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    except TypeError:
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - preserve concrete load error.
        raise EvaluationError(f"checkpoint could not be loaded: {checkpoint_path}: {error}") from error
    if not isinstance(checkpoint, dict):
        raise EvaluationError(f"checkpoint root must be a dict: {checkpoint_path}")
    for key in ("model_state", "label_to_index", "frame_count", "image_size"):
        if key not in checkpoint:
            raise EvaluationError(f"checkpoint missing required field: {key}")
    if not isinstance(checkpoint["label_to_index"], dict) or not checkpoint["label_to_index"]:
        raise EvaluationError("checkpoint label_to_index must be a non-empty object")
    return checkpoint


def validate_finality(
    checkpoint: dict[str, Any],
    provenance: dict[str, Any],
    checkpoint_path: Path,
    manifests: list[dict[str, Any]],
    allow_smoke_eval: bool,
    lesson_milestone: bool = False,
    controlled_pilot: bool = False,
    controlled_clip_heldout: bool = False,
    reduced_real_data_training_smoke: bool = False,
    region_grid_tcn_training_smoke: bool = False,
    m3gu_reduced4_training_smoke: bool = False,
    popsign_fresh5_training_smoke: bool = False,
    popsign_label_ladder_training_smoke: bool = False,
) -> list[str]:
    label_count = len(checkpoint["label_to_index"])
    hyperparameters = provenance.get("hyperparameters", {})
    dataset_ids = [
        str(item.get("dataset_id", "")).lower() for item in manifests if isinstance(item, dict)
    ]
    reasons = []
    blocking_reasons = []
    if popsign_label_ladder_training_smoke:
        expected_training_evidence_mode = "popsign_label_ladder_training_smoke"
    elif popsign_fresh5_training_smoke:
        expected_training_evidence_mode = "popsign_fresh5_training_smoke"
    elif m3gu_reduced4_training_smoke:
        expected_training_evidence_mode = "m3gu_reduced4_training_smoke"
    elif region_grid_tcn_training_smoke:
        expected_training_evidence_mode = "region_grid_tcn_training_smoke"
    elif reduced_real_data_training_smoke:
        expected_training_evidence_mode = "reduced_real_data_training_smoke"
    elif lesson_milestone:
        expected_training_evidence_mode = "lesson_milestone"
    elif controlled_clip_heldout:
        expected_training_evidence_mode = "controlled_clip_heldout"
    else:
        expected_training_evidence_mode = "final"

    def add_blocking_reason(reason: str) -> None:
        reasons.append(reason)
        blocking_reasons.append(reason)

    if provenance.get("schema_version") != TRAINING_PROVENANCE_SCHEMA_VERSION:
        add_blocking_reason(f"training provenance schema_version is not {TRAINING_PROVENANCE_SCHEMA_VERSION}")
    if provenance.get("evidence_mode") != expected_training_evidence_mode:
        add_blocking_reason(
            f"training provenance evidence_mode is not {expected_training_evidence_mode}"
        )
    generated = provenance.get("generated_by")
    if not isinstance(generated, dict):
        add_blocking_reason("training provenance lacks generated_by receipt")
    elif generated.get("tool") != "scripts/train_rawframe_model.py":
        add_blocking_reason("training provenance generated_by.tool is not scripts/train_rawframe_model.py")
    if provenance.get("initialization") != "random":
        raise EvaluationError("training provenance initialization must be random")
    if provenance.get("pretrained_components") != []:
        raise EvaluationError("training provenance pretrained_components must be an empty array")
    if provenance.get("training_status") != "completed":
        raise EvaluationError("training provenance training_status must be completed")
    checkpoint_arch = checkpoint_architecture(checkpoint)
    if provenance.get("architecture") != checkpoint_arch:
        raise EvaluationError("training provenance architecture must match checkpoint architecture")
    if provenance.get("labels") != checkpoint["label_to_index"]:
        raise EvaluationError("training provenance labels must match checkpoint label_to_index")
    random_evidence = provenance.get("random_initialization_evidence")
    if not allow_smoke_eval:
        if not isinstance(random_evidence, dict):
            raise EvaluationError("training provenance random_initialization_evidence is required for final evaluation")
        if random_evidence.get("seed") != provenance.get("seed"):
            raise EvaluationError("training provenance random_initialization_evidence.seed must match seed")
        for key in ("initial_model_state_digest", "final_model_state_digest"):
            digest = random_evidence.get(key)
            checkpoint_digest = checkpoint.get(key)
            if not isinstance(digest, dict):
                raise EvaluationError(f"training provenance random_initialization_evidence.{key} must be an object")
            if digest.get("algorithm") != "canonical_state_dict_sha256_v1":
                raise EvaluationError(f"training provenance random_initialization_evidence.{key}.algorithm is invalid")
            sha = digest.get("sha256")
            if not isinstance(sha, str) or len(sha) != 64 or any(character not in "0123456789abcdef" for character in sha):
                raise EvaluationError(f"training provenance random_initialization_evidence.{key}.sha256 must be a SHA-256 digest")
            if digest != checkpoint_digest:
                raise EvaluationError(f"training provenance random_initialization_evidence.{key} must match checkpoint")
    model_artifact = provenance.get("model_artifact")
    if not isinstance(model_artifact, str) or not model_artifact.strip():
        raise EvaluationError("training provenance model_artifact must be a non-empty string")
    artifact_path = resolve_project_path(Path(model_artifact), "training provenance model_artifact")
    if artifact_path != checkpoint_path.resolve():
        raise EvaluationError(
            f"training provenance model_artifact does not match checkpoint: {model_artifact}"
        )
    provenance_manifests = provenance.get("manifests")
    if not isinstance(provenance_manifests, list):
        raise EvaluationError("training provenance manifests must be an array")
    by_split = {
        item.get("split"): item for item in provenance_manifests if isinstance(item, dict)
    }
    for manifest in manifests:
        split = manifest["split"]
        provenance_manifest = by_split.get(split)
        if not isinstance(provenance_manifest, dict):
            raise EvaluationError(f"training provenance is missing manifest summary for split: {split}")
        current_manifest = {
            **manifest,
            "path": project_relative(Path(manifest["path"])),
        }
        provenance_path = provenance_manifest.get("path")
        if not isinstance(provenance_path, str) or not provenance_path.strip():
            raise EvaluationError(f"training provenance manifest {split}.path must be a non-empty string")
        current_provenance_manifest = {
            **provenance_manifest,
            "path": project_relative(Path(provenance_path)),
        }
        for key in (
            "path",
            "dataset_id",
            "label_count",
            "clip_count",
            "sha256",
            "source_register",
            "dataset_source_mode",
            "external_dataset_import",
            "supplemental_external_dataset_imports",
            "consent_form",
            "vocabulary_review",
            "min_clips_per_label_per_split",
        ):
            if current_provenance_manifest.get(key) != current_manifest.get(key):
                raise EvaluationError(
                    f"training provenance manifest {split}.{key} does not match current manifest"
                )
        if not isinstance(current_manifest.get("source_register"), dict):
            raise EvaluationError(f"current manifest {split} is missing source_register evidence")
        source_mode = current_manifest.get("dataset_source_mode", FIRST_PARTY_DATASET_SOURCE_MODE)
        if source_mode == FIRST_PARTY_DATASET_SOURCE_MODE and not isinstance(current_manifest.get("consent_form"), dict):
            raise EvaluationError(f"current manifest {split} is missing consent_form evidence")
        if source_mode == EXTERNAL_DATASET_SOURCE_MODE and not isinstance(current_manifest.get("external_dataset_import"), dict):
            raise EvaluationError(f"current manifest {split} is missing external_dataset_import evidence")
        if not isinstance(current_manifest.get("vocabulary_review"), dict):
            if allow_smoke_eval:
                reasons.append(f"current manifest {split} lacks full vocabulary_review evidence")
            elif popsign_label_ladder_training_smoke:
                reasons.append(
                    f"current manifest {split} lacks vocabulary_review evidence; "
                    "PopSign label-ladder training smoke remains diagnostic and not final, "
                    "product, browser, promotion, or ASL correctness evidence"
                )
            else:
                raise EvaluationError(f"current manifest {split} is missing vocabulary_review evidence")
    if popsign_label_ladder_training_smoke and not allow_smoke_eval:
        if label_count not in POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS:
            allowed = ", ".join(str(value) for value in POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS)
            add_blocking_reason(
                f"PopSign label-ladder training smoke label_count is {label_count}, not one of {allowed}"
            )
        reasons.append(
            "PopSign label-ladder training smoke is capped and not final 75-100-label, "
            "25-sign lesson, product, browser, promotion, or ASL correctness evidence"
        )
    elif popsign_fresh5_training_smoke and not allow_smoke_eval:
        if label_count != len(POPSIGN_FRESH5_REPAIRED_LABEL_IDS):
            add_blocking_reason(
                f"PopSign fresh5 training smoke label_count is {label_count}, not "
                f"{len(POPSIGN_FRESH5_REPAIRED_LABEL_IDS)}"
            )
        if hyperparameters.get("preserve_region_axis") is not True:
            add_blocking_reason("PopSign fresh5 training smoke did not preserve the region axis")
        reasons.append(
            "PopSign fresh5 training smoke is capped and not final 75-100-label or 25-sign lesson evidence"
        )
    elif m3gu_reduced4_training_smoke and not allow_smoke_eval:
        if label_count != len(M3GQ_REDUCED4_LABEL_IDS):
            add_blocking_reason(
                f"M3GU reduced4 training smoke label_count is {label_count}, not "
                f"{len(M3GQ_REDUCED4_LABEL_IDS)}"
            )
        if hyperparameters.get("preserve_region_axis") is not True:
            add_blocking_reason("M3GU reduced4 training smoke did not preserve the region axis")
        reasons.append(
            "M3GU reduced4 training smoke is capped and not final 75-100-label, "
            "25-sign lesson, product, browser, promotion, or ASL correctness evidence"
        )
    elif region_grid_tcn_training_smoke and not allow_smoke_eval:
        if not (MIN_REDUCED_REAL_DATA_LABELS <= label_count <= MAX_REDUCED_REAL_DATA_LABELS):
            add_blocking_reason(
                f"region-grid TCN training smoke label_count is {label_count}, not "
                f"{MIN_REDUCED_REAL_DATA_LABELS}-{MAX_REDUCED_REAL_DATA_LABELS}"
            )
        if hyperparameters.get("preserve_region_axis") is not True:
            add_blocking_reason("region-grid TCN training smoke did not preserve the region axis")
        reasons.append(
            "region-grid TCN training smoke is non-final and not 75-100-label or 25-sign lesson evidence"
        )
    elif reduced_real_data_training_smoke and not allow_smoke_eval:
        if not (MIN_REDUCED_REAL_DATA_LABELS <= label_count <= MAX_REDUCED_REAL_DATA_LABELS):
            add_blocking_reason(
                f"reduced real-data training smoke label_count is {label_count}, not "
                f"{MIN_REDUCED_REAL_DATA_LABELS}-{MAX_REDUCED_REAL_DATA_LABELS}"
            )
        reasons.append(
            "reduced real-data training smoke is not final 75-100-label or 25-sign lesson evidence"
        )
    elif lesson_milestone and not allow_smoke_eval:
        if not (MIN_LESSON_MILESTONE_LABELS <= label_count <= MAX_LESSON_MILESTONE_LABELS):
            add_blocking_reason(
                f"lesson milestone label_count is {label_count}, not "
                f"{MIN_LESSON_MILESTONE_LABELS}-{MAX_LESSON_MILESTONE_LABELS}"
            )
        reasons.append(f"lesson milestone label_count is {label_count}, not final 75-100 evidence")
    elif not (75 <= label_count <= 100):
        add_blocking_reason(f"label_count is {label_count}, not 75-100")
    if hyperparameters.get("max_train_batches") is not None and not (
        region_grid_tcn_training_smoke
        or m3gu_reduced4_training_smoke
        or popsign_fresh5_training_smoke
        or popsign_label_ladder_training_smoke
    ):
        add_blocking_reason("training was capped with max_train_batches")
    elif hyperparameters.get("max_train_batches") is not None and popsign_label_ladder_training_smoke:
        reasons.append("PopSign label-ladder training smoke was capped with max_train_batches by design")
    elif hyperparameters.get("max_train_batches") is not None and popsign_fresh5_training_smoke:
        reasons.append("PopSign fresh5 training smoke was capped with max_train_batches by design")
    elif hyperparameters.get("max_train_batches") is not None and m3gu_reduced4_training_smoke:
        reasons.append("M3GU reduced4 training smoke was capped with max_train_batches by design")
    elif hyperparameters.get("max_train_batches") is not None:
        reasons.append("region-grid TCN training smoke was capped with max_train_batches by design")
    if hyperparameters.get("max_validation_batches") is not None and not (
        region_grid_tcn_training_smoke
        or m3gu_reduced4_training_smoke
        or popsign_fresh5_training_smoke
        or popsign_label_ladder_training_smoke
    ):
        add_blocking_reason("validation was capped with max_validation_batches")
    elif hyperparameters.get("max_validation_batches") is not None and popsign_label_ladder_training_smoke:
        reasons.append("PopSign label-ladder training smoke was capped with max_validation_batches by design")
    elif hyperparameters.get("max_validation_batches") is not None and popsign_fresh5_training_smoke:
        reasons.append("PopSign fresh5 training smoke was capped with max_validation_batches by design")
    elif hyperparameters.get("max_validation_batches") is not None and m3gu_reduced4_training_smoke:
        reasons.append("M3GU reduced4 training smoke was capped with max_validation_batches by design")
    elif hyperparameters.get("max_validation_batches") is not None:
        reasons.append("region-grid TCN training smoke was capped with max_validation_batches by design")
    if any("synthetic" in dataset_id or "smoke" in dataset_id or "not-asl" in dataset_id for dataset_id in dataset_ids):
        add_blocking_reason("manifest dataset_id indicates synthetic/smoke/non-ASL data")
    if blocking_reasons and not allow_smoke_eval:
        guidance = (
            "Use --lesson-milestone only with strict real-data 25-sign lesson artifacts."
            if lesson_milestone
            else "Use --reduced-real-data-training-smoke only with the approved seven-label high-signal module."
            if reduced_real_data_training_smoke
            else "Use --popsign-label-ladder-training-smoke only with the approved PopSign label-ladder 25/50/95-label modules."
            if popsign_label_ladder_training_smoke
            else "Use --popsign-fresh5-training-smoke only with the approved five-label PopSign fresh5 repaired-manifest module."
            if popsign_fresh5_training_smoke
            else "Use --m3gu-reduced4-training-smoke only with the M3GQ reduced4 manifests."
            if m3gu_reduced4_training_smoke
            else "Use --region-grid-tcn-training-smoke only with the approved high-signal region-grid TCN smoke."
            if region_grid_tcn_training_smoke
            else "Use --controlled-clip-heldout only with documented 75-100-label clip-heldout artifacts."
            if controlled_clip_heldout
            else "Use --allow-smoke-eval only for wiring tests."
        )
        raise EvaluationError(
            "evaluation input is not eligible for "
            + (
                "lesson milestone evidence: "
                if lesson_milestone
                else "reduced real-data training smoke evidence: "
                if reduced_real_data_training_smoke
                else "PopSign label-ladder training smoke evidence: "
                if popsign_label_ladder_training_smoke
                else "PopSign fresh5 training smoke evidence: "
                if popsign_fresh5_training_smoke
                else "M3GU reduced4 training smoke evidence: "
                if m3gu_reduced4_training_smoke
                else "region-grid TCN training smoke evidence: "
                if region_grid_tcn_training_smoke
                else "controlled clip-heldout evidence: "
                if controlled_clip_heldout
                else "final validation evidence: "
            )
            + "; ".join(blocking_reasons)
            + f". {guidance}"
        )
    return reasons


def validate_evaluation_manifest(
    manifest_path: Path,
    expected_split: str,
    allow_smoke_eval: bool,
    lesson_milestone: bool = False,
    controlled_clip_heldout: bool = False,
    reduced_real_data_training_smoke: bool = False,
    region_grid_tcn_training_smoke: bool = False,
    m3gu_reduced4_training_smoke: bool = False,
    popsign_fresh5_training_smoke: bool = False,
    popsign_label_ladder_training_smoke: bool = False,
) -> dict[str, Any]:
    if popsign_label_ladder_training_smoke and not allow_smoke_eval:
        return validate_manifest(
            manifest_path,
            expected_split,
            check_files=True,
            allow_small_label_set=False,
            allow_popsign_label_ladder_set=True,
        )
    if popsign_fresh5_training_smoke and not allow_smoke_eval:
        return validate_manifest(
            manifest_path,
            expected_split,
            check_files=True,
            allow_small_label_set=False,
            allow_popsign_fresh5_label_set=True,
        )
    if m3gu_reduced4_training_smoke and not allow_smoke_eval:
        return validate_manifest(
            manifest_path,
            expected_split,
            check_files=True,
            allow_small_label_set=False,
            allow_m3gu_reduced4_label_set=True,
        )
    if region_grid_tcn_training_smoke and not allow_smoke_eval:
        return validate_manifest(manifest_path, expected_split, True, False, False, False, True)
    if reduced_real_data_training_smoke and not allow_smoke_eval:
        return validate_manifest(manifest_path, expected_split, True, False, False, False, True)
    if lesson_milestone and not allow_smoke_eval:
        return validate_manifest(manifest_path, expected_split, True, False, True)
    if controlled_clip_heldout and not allow_smoke_eval:
        return validate_manifest(manifest_path, expected_split, True, False, False, True)
    if not allow_smoke_eval:
        return validate_manifest(manifest_path, expected_split, True, False)
    try:
        return validate_manifest(manifest_path, expected_split, True, False)
    except ManifestError:
        return validate_manifest(manifest_path, expected_split, True, True)


def evaluate_split(
    torch: Any,
    model: Any,
    manifest_path: Path,
    split: str,
    label_to_index: dict[str, int],
    frame_count: int,
    image_size: int,
    batch_size: int,
    num_workers: int,
    device: Any,
    require_decode_provenance: bool,
    preserve_region_axis: bool = False,
) -> dict[str, Any]:
    dataset = RawFrameClipDataset(
        torch,
        manifest_path,
        split,
        label_to_index,
        frame_count,
        image_size,
        require_decode_provenance=require_decode_provenance,
        preserve_region_axis=preserve_region_axis,
    )
    loader = torch.utils.data.DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
    )
    labels_by_index = [label for label, _ in sorted(label_to_index.items(), key=lambda item: item[1])]
    manifest_metadata = manifest_metadata_by_clip_id(manifest_path, split)
    confusion = [[0 for _ in labels_by_index] for _ in labels_by_index]
    examples: list[dict[str, Any]] = []
    example_index = 0
    model.eval()
    with torch.no_grad():
        for frames, targets in loader:
            frames = frames.to(device)
            logits = model(frames)
            logits_cpu = logits.detach().cpu()
            probabilities = torch.softmax(logits, dim=1).detach().cpu()
            predictions = probabilities.argmax(dim=1)
            targets_cpu = targets.detach().cpu()
            for row_index in range(int(targets_cpu.shape[0])):
                record = dataset.records[example_index]
                example_index += 1
                manifest_context = manifest_metadata.get(record["clip_id"])
                if manifest_context is None:
                    raise EvaluationError(
                        f"{manifest_path}: missing manifest metadata for evaluated clip_id {record['clip_id']}"
                    )
                true_index = int(targets_cpu[row_index].item())
                predicted_index = int(predictions[row_index].item())
                row_logits = logits_cpu[row_index]
                row_probabilities = probabilities[row_index]
                logits_by_label = build_logit_by_label(row_logits, labels_by_index)
                probability_by_label = build_probability_by_label(row_probabilities, labels_by_index)
                predicted_label_logit = float(row_logits[predicted_index].item())
                true_label_logit = float(row_logits[true_index].item())
                confidence = float(row_probabilities[predicted_index].item())
                true_label_probability = float(row_probabilities[true_index].item())
                top_logit_values, top_logit_indexes = torch.topk(row_logits, k=min(2, int(row_logits.shape[0])))
                top_values, top_indexes = torch.topk(row_probabilities, k=min(2, int(row_probabilities.shape[0])))
                top2_logit = float(top_logit_values[1].item()) if int(top_logit_values.shape[0]) > 1 else 0.0
                top2_confidence = float(top_values[1].item()) if int(top_values.shape[0]) > 1 else 0.0
                logit_margin = predicted_label_logit - top2_logit
                probability_margin = confidence - top2_confidence
                entropy = float(
                    -(row_probabilities * torch.log(row_probabilities.clamp_min(1e-12))).sum().item()
                )
                confusion[true_index][predicted_index] += 1
                examples.append(
                    {
                        **manifest_context,
                        "clip_id": record["clip_id"],
                        "signer_id": record.get("signer_id"),
                        "signer_identity_hash": record.get("signer_identity_hash"),
                        "source_split": record.get("source_split"),
                        "source_record_id": record.get("source_record_id"),
                        "source_video_path": record.get("source_video_path"),
                        "true_index": true_index,
                        "true_label": labels_by_index[true_index],
                        "predicted_index": predicted_index,
                        "predicted_label": labels_by_index[predicted_index],
                        "predicted_label_logit": predicted_label_logit,
                        "true_label_logit": true_label_logit,
                        "confidence": confidence,
                        "true_label_probability": true_label_probability,
                        "top2_logit": top2_logit,
                        "top2_logit_label": labels_by_index[int(top_logit_indexes[1].item())]
                        if int(top_logit_indexes.shape[0]) > 1
                        else None,
                        "top2_confidence": top2_confidence,
                        "top2_label": labels_by_index[int(top_indexes[1].item())]
                        if int(top_indexes.shape[0]) > 1
                        else None,
                        "logit_margin": logit_margin,
                        "probability_margin": probability_margin,
                        "entropy": entropy,
                        "logits_by_label": logits_by_label,
                        "probability_by_label": probability_by_label,
                        "correct": predicted_index == true_index,
                    }
                )
    if not examples:
        raise EvaluationError(f"{split} split produced no evaluation examples")
    return metrics_from_examples(split, examples, labels_by_index, confusion)


def signer_metrics_from_examples(examples: list[dict[str, Any]]) -> dict[str, Any]:
    by_signer: dict[str, list[dict[str, Any]]] = {}
    for item in examples:
        signer_id = item.get("signer_id")
        key = signer_id if isinstance(signer_id, str) and signer_id.strip() else "unknown"
        by_signer.setdefault(key, []).append(item)

    rows = []
    for signer_id, signer_examples in by_signer.items():
        correct = sum(1 for item in signer_examples if item["correct"])
        confidences = [float(item["confidence"]) for item in signer_examples]
        labels = sorted({str(item["true_label"]) for item in signer_examples})
        rows.append(
            {
                "signer_id": signer_id,
                "examples": len(signer_examples),
                "correct": correct,
                "accuracy": correct / len(signer_examples),
                "label_count": len(labels),
                "mean_confidence": sum(confidences) / len(confidences),
                "max_confidence": max(confidences),
                "zero_correct": correct == 0,
                "labels": labels,
            }
        )
    rows.sort(key=lambda item: (item["accuracy"], -item["examples"], item["signer_id"]))
    return {
        "signer_count": len(rows),
        "zero_correct_signer_count": sum(1 for item in rows if item["zero_correct"]),
        "lowest_accuracy": rows[:5],
        "highest_accuracy": sorted(rows, key=lambda item: (-item["accuracy"], item["signer_id"]))[:5],
        "by_signer": rows,
    }


def metrics_from_examples(
    split: str,
    examples: list[dict[str, Any]],
    labels_by_index: list[str],
    confusion: list[list[int]],
) -> dict[str, Any]:
    total = len(examples)
    correct = sum(1 for item in examples if item["correct"])
    per_class = {}
    f1_values = []
    for index, label in enumerate(labels_by_index):
        true_positive = confusion[index][index]
        false_positive = sum(confusion[row][index] for row in range(len(labels_by_index)) if row != index)
        false_negative = sum(confusion[index][col] for col in range(len(labels_by_index)) if col != index)
        support = sum(confusion[index])
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        f1_values.append(f1)
        per_class[label] = {
            "support": support,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
    return {
        "split": split,
        "examples": total,
        "top1_accuracy": correct / total,
        "macro_f1": sum(f1_values) / len(f1_values),
        "confusion_matrix": {
            "labels": labels_by_index,
            "rows_true_columns_predicted": confusion,
        },
        "per_class": per_class,
        "signer_metrics": signer_metrics_from_examples(examples),
        "predictions": examples,
    }


def threshold_metrics(examples: list[dict[str, Any]], threshold: float) -> dict[str, float]:
    total = len(examples)
    accepted = [item for item in examples if item["confidence"] >= threshold]
    correct_accepts = [item for item in accepted if item["correct"]]
    false_passes = [item for item in accepted if not item["correct"]]
    accepted_count = len(accepted)
    return {
        "threshold": threshold,
        "coverage": accepted_count / total,
        "correct_pass_rate": len(correct_accepts) / total,
        "false_pass_rate": len(false_passes) / total,
        "accepted_accuracy": len(correct_accepts) / accepted_count if accepted_count else 0.0,
        "false_accept_rate": len(false_passes) / accepted_count if accepted_count else 0.0,
    }


def calibrate_threshold(validation_metrics: dict[str, Any]) -> dict[str, Any]:
    candidates = [index / 100 for index in range(0, 101)]
    rows = [threshold_metrics(validation_metrics["predictions"], threshold) for threshold in candidates]
    eligible = [row for row in rows if row["false_pass_rate"] < TARGET_FALSE_PASS_RATE]
    if not eligible:
        selected = rows[-1]
    else:
        selected = max(
            eligible,
            key=lambda row: (
                row["correct_pass_rate"],
                -row["false_pass_rate"],
                row["threshold"],
            ),
        )
    return {
        "selected_threshold": selected["threshold"],
        "selection_rule": (
            "maximize correct pass rate subject to validation false-pass rate below "
            f"{TARGET_FALSE_PASS_RATE}, then prefer lower false-pass rate and higher threshold"
        ),
        "selected_metrics": selected,
        "curve": rows,
    }


def strip_predictions(metrics: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in metrics.items() if key != "predictions"}


def build_prediction_sidecar(
    args: argparse.Namespace,
    report: dict[str, Any],
    validation_metrics: dict[str, Any],
    test_metrics: dict[str, Any],
    challenge_metrics: dict[str, Any] | None,
    selected_threshold: float,
) -> dict[str, Any]:
    return {
        "schema_version": PREDICTION_SIDECAR_SCHEMA_VERSION,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "finality": "diagnostic_prediction_sidecar_not_final_evidence",
        "evidence_mode": report["evidence_mode"],
        "generated_by": report["generated_by"],
        "evaluation_command": [sys.executable, *sys.argv],
        "evaluation_script": report["evaluation_script"],
        "validation_report": {
            "path": project_relative(args.output_report),
            "status": report["status"],
        },
        "sidecar_contract": {
            "version": PREDICTION_SIDECAR_CONTRACT_VERSION,
            "example_id_format": "rawframe-eval:<split>:<manifest_row_index>:<clip_id>",
            "row_identity_fields": [
                "example_id",
                "split",
                "manifest_path",
                "manifest_sha256",
                "manifest_row_index",
                "clip_id",
            ],
            "manifest_tensor_fields": [
                "tensor_path",
                "tensor_sha256",
                "tensor_hash_source",
                "crop_config",
                "crop_regions",
                "derived_features",
                "review",
            ],
            "score_fields": [
                "predicted_label_logit",
                "true_label_logit",
                "confidence",
                "true_label_probability",
                "top2_logit",
                "logit_margin",
                "top2_confidence",
                "probability_margin",
                "entropy",
                "logits_by_label",
                "probability_by_label",
            ],
            "probability_by_label_source": "current evaluator softmax output",
            "logits_by_label_source": "current evaluator raw model logits before softmax",
            "pretrained_components": [],
            "field_provenance": {
                "manifest_path": "evaluation manifest path",
                "manifest_sha256": "evaluation manifest file sha256",
                "manifest_row_index": "zero-based clips[] index in the evaluation manifest",
                "tensor_path": "manifest relative_frame_tensor_path resolved under project root",
                "tensor_sha256": "manifest frame_tensor_sha256, already verified by RawFrameClipDataset",
                "logits_by_label": "raw model logits from the current evaluator pass before torch.softmax",
                "predicted_label_logit": "logits_by_label[predicted_label]",
                "true_label_logit": "logits_by_label[true_label], or null for negative-challenge reject rows",
                "logit_margin": "predicted_label_logit minus the second-highest raw logit",
                "probability_by_label": "torch.softmax(logits, dim=1) from the current evaluator pass",
                "true_label_probability": (
                    "probability_by_label[true_label], or null for negative-challenge reject rows"
                ),
            },
        },
        "score_fields": [
            "predicted_label_logit",
            "true_label_logit",
            "confidence",
            "true_label_probability",
            "top2_logit",
            "logit_margin",
            "top2_confidence",
            "probability_margin",
            "entropy",
            "logits_by_label",
            "probability_by_label",
        ],
        "selected_threshold": selected_threshold,
        "threshold_calibration": report["threshold_calibration"],
        "validation": {
            "split": "validation",
            "examples": validation_metrics["predictions"],
        },
        "test": {
            "split": "test",
            "threshold_metrics": report["test"]["threshold_metrics"],
            "examples": test_metrics["predictions"],
        },
        "negative_challenge": (
            {
                "split": "negative_challenge",
                "metrics": strip_predictions(challenge_metrics),
                "examples": challenge_metrics["predictions"],
            }
            if challenge_metrics
            else None
        ),
        "limitations": [
            "This sidecar is for diagnostics and lesson-level analysis; final promotion still depends on the stripped validation report and calibrated provenance gates.",
            "Scores are produced by the current checkpoint and manifest scope; reduced-scope or smoke evaluations must not be claimed as final 75-100-label evidence.",
        ],
    }


def dataset_source_mode_for_challenge(data: dict[str, Any]) -> str:
    mode = data.get("dataset_source_mode", FIRST_PARTY_DATASET_SOURCE_MODE)
    if mode not in {FIRST_PARTY_DATASET_SOURCE_MODE, EXTERNAL_DATASET_SOURCE_MODE}:
        raise EvaluationError(
            "negative challenge manifest dataset_source_mode must be "
            f"{FIRST_PARTY_DATASET_SOURCE_MODE!r} or {EXTERNAL_DATASET_SOURCE_MODE!r}"
        )
    return str(mode)


def validate_external_negative_challenge_clip_provenance(
    clip: dict[str, Any],
    context: str,
) -> None:
    for key in (
        "source_record_id",
        "source_page_url",
        "source_file_url",
        "source_file_page_title",
        "source_license_short_name",
        "source_author",
    ):
        if not isinstance(clip.get(key), str) or not str(clip.get(key)).strip():
            raise EvaluationError(f"{context} external challenge clip must include non-empty {key}")
    for key in ("source_page_url", "source_file_url"):
        value = str(clip[key])
        if not value.startswith("https://"):
            raise EvaluationError(f"{context} {key} must be an https URL")
    evidence = clip.get("source_file_metadata")
    if not isinstance(evidence, dict):
        raise EvaluationError(f"{context} source_file_metadata must be an object")
    for key in ("license_short_name", "mime", "source_sha256"):
        if not isinstance(evidence.get(key), str) or not str(evidence.get(key)).strip():
            raise EvaluationError(f"{context} source_file_metadata.{key} must be a non-empty string")
    if evidence.get("license_short_name") != clip.get("source_license_short_name"):
        raise EvaluationError(f"{context} source_file_metadata.license_short_name must match source_license_short_name")
    source_sha = str(evidence.get("source_sha256", "")).lower()
    if len(source_sha) != 64 or any(character not in "0123456789abcdef" for character in source_sha):
        raise EvaluationError(f"{context} source_file_metadata.source_sha256 must be a SHA-256 digest")
    if source_sha != str(clip.get("sha256", "")).lower():
        raise EvaluationError(f"{context} source_file_metadata.source_sha256 must match clip sha256")
    if evidence.get("mime") not in {"video/webm", "video/mp4", "application/ogg", "video/ogg"}:
        raise EvaluationError(f"{context} source_file_metadata.mime must identify a WebM, MP4, or Ogg video")


def validate_negative_challenge_manifest(
    manifest_path: Path,
    split_manifests: list[dict[str, Any]],
    allow_smoke_eval: bool,
    required_challenge_types: set[str] | None = None,
) -> dict[str, Any]:
    data = read_json(manifest_path)
    if data.get("schema_version") != EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION:
        raise EvaluationError(
            f"{manifest_path}: schema_version must be {EXPECTED_NEGATIVE_CHALLENGE_SCHEMA_VERSION!r}"
        )
    if data.get("split") != "negative_challenge":
        raise EvaluationError(f"{manifest_path}: split must be 'negative_challenge'")
    for key in ("dataset_id", "created_at", "provenance_owner"):
        if not isinstance(data.get(key), str) or not str(data.get(key)).strip():
            raise EvaluationError(f"{manifest_path}: {key} must be a non-empty string")
    dataset_source_mode = dataset_source_mode_for_challenge(data)

    try:
        source_decisions = validate_source_register(data, manifest_path, allow_smoke_eval)
        external_dataset_import = validate_external_dataset_import(
            data,
            manifest_path,
            source_decisions,
            allow_smoke_eval,
            require_model_training=False,
        )
        consent_form = validate_consent_form(data, manifest_path, allow_smoke_eval)
        collection_plan = validate_collection_plan(data, manifest_path, allow_smoke_eval)
        vocabulary_review = validate_vocabulary_review(data, manifest_path, allow_smoke_eval)
    except ManifestError as error:
        raise EvaluationError(str(error)) from error

    preprocessing = data.get("preprocessing")
    if not isinstance(preprocessing, dict):
        raise EvaluationError(f"{manifest_path}: preprocessing must be an object")
    if not isinstance(preprocessing.get("allowed_steps"), list):
        raise EvaluationError(f"{manifest_path}: preprocessing.allowed_steps must be an array")
    token = contains_prohibited_token(preprocessing)
    if token:
        raise EvaluationError(f"{manifest_path}: preprocessing contains prohibited token: {token}")

    clips = data.get("clips")
    if not isinstance(clips, list) or not clips:
        raise EvaluationError(f"{manifest_path}: clips must be a non-empty array")

    clip_ids: set[str] = set()
    signer_ids: set[str] = set()
    challenge_type_counts = {challenge_type: 0 for challenge_type in sorted(ALLOWED_CHALLENGE_TYPES)}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise EvaluationError(f"{manifest_path}: clips[{index}] must be an object")
        context = f"{manifest_path}: clips[{index}]"
        for key in (
            "clip_id",
            "source_id",
            "source_license_decision",
            "source_license_review_status",
            "signer_id",
            "signer_identity_hash",
            "relative_video_path",
            "sha256",
            "split",
            "frame_source",
            "expected_outcome",
            "challenge_type",
        ):
            if not isinstance(clip.get(key), str) or not str(clip.get(key)).strip():
                raise EvaluationError(f"{context} must include non-empty string field: {key}")
        clip_id = str(clip["clip_id"])
        if clip_id in clip_ids:
            raise EvaluationError(f"{manifest_path}: duplicate challenge clip_id: {clip_id}")
        clip_ids.add(clip_id)
        if clip["split"] != "negative_challenge":
            raise EvaluationError(f"{context} split must be 'negative_challenge'")
        if clip["frame_source"] != ALLOWED_FRAME_SOURCE:
            raise EvaluationError(f"{context} frame_source must be {ALLOWED_FRAME_SOURCE!r}")
        if clip["expected_outcome"] != "reject":
            raise EvaluationError(f"{context} expected_outcome must be 'reject'")
        challenge_type = str(clip["challenge_type"])
        if challenge_type not in ALLOWED_CHALLENGE_TYPES:
            raise EvaluationError(
                f"{context} challenge_type must be one of {sorted(ALLOWED_CHALLENGE_TYPES)}"
            )
        challenge_type_counts[challenge_type] += 1
        signer_identity_hash = str(clip["signer_identity_hash"]).strip().lower()
        if len(signer_identity_hash) != 64 or any(character not in "0123456789abcdef" for character in signer_identity_hash):
            raise EvaluationError(f"{context} signer_identity_hash must be a lowercase SHA-256 digest")
        signer_ids.add(signer_identity_hash)

        video_path = resolve_manifest_relative_path(
            manifest_path,
            str(clip["relative_video_path"]),
            context,
            "relative_video_path",
        )
        if not video_path.exists():
            raise EvaluationError(f"{context} video file is missing: {video_path}")
        expected_video_hash = str(clip["sha256"]).lower()
        if not expected_video_hash or len(expected_video_hash) != 64:
            raise EvaluationError(f"{context} sha256 must be a lowercase SHA-256 digest")
        actual_video_hash = sha256_file(video_path)
        if actual_video_hash != expected_video_hash:
            raise EvaluationError(
                f"{context} video SHA-256 mismatch; expected {expected_video_hash}, got {actual_video_hash}"
            )

        tensor_path = tensor_path_for_clip(clip, manifest_path, context)
        if not tensor_path.exists():
            raise EvaluationError(f"{context} decoded frame tensor is unavailable: {tensor_path}")
        expected_tensor_hash = expected_tensor_hash_for_clip(clip, context)
        actual_tensor_hash = sha256_file(tensor_path)
        if actual_tensor_hash != expected_tensor_hash:
            raise EvaluationError(
                f"{context} decoded frame tensor hash mismatch for {tensor_path}; "
                f"expected {expected_tensor_hash}, got {actual_tensor_hash}"
            )

        if clip.get("allowed_for_validation") is not True:
            raise EvaluationError(f"{context} allowed_for_validation must be true")
        if clip.get("derived_features", []) not in ([], None):
            raise EvaluationError(f"{context} derived_features must be empty")
        token = contains_prohibited_token(clip)
        if token:
            raise EvaluationError(f"{context} contains prohibited pretrained-component token: {token}")

        if not allow_smoke_eval:
            source = source_decisions.get(str(clip["source_id"]))
            if not source:
                raise EvaluationError(f"{context} source_id is not present in source register")
            if source.get("allowed_for_validation") is not True:
                raise EvaluationError(f"{context} source is not allowed for validation")
            if clip["source_license_decision"] != source.get("decision_id"):
                raise EvaluationError(f"{context} source_license_decision does not match source register")
            if clip["source_license_review_status"] != source.get("license_review_status"):
                raise EvaluationError(f"{context} source_license_review_status does not match source register")
            try:
                validate_capture_condition_evidence(clip, context, "negative_challenge")
                if dataset_source_mode == FIRST_PARTY_DATASET_SOURCE_MODE:
                    consent_record_id = str(clip.get("consent_record_id", "")).strip()
                    if not consent_record_id:
                        raise EvaluationError(f"{context} first-party challenge clip must include consent_record_id")
                    validate_collection_plan_assignment(
                        clip,
                        context,
                        collection_plan,
                        "negative_challenge",
                    )
                    validate_signed_consent_evidence(
                        clip,
                        context,
                        signer_identity_hash,
                        consent_record_id,
                    )
                else:
                    validate_external_negative_challenge_clip_provenance(clip, context)
            except ManifestError as error:
                raise EvaluationError(str(error)) from error
            review = clip.get("review")
            if not isinstance(review, dict):
                raise EvaluationError(f"{context} review must be an object")
            if review.get("challenge_review_status") != "approved":
                raise EvaluationError(f"{context} review.challenge_review_status must be approved")
            for key in ("reviewer", "reviewed_at"):
                if not isinstance(review.get(key), str) or not str(review.get(key)).strip():
                    raise EvaluationError(f"{context} review.{key} must be a non-empty string")
            if is_invalid_iso_date(review["reviewed_at"]):
                raise EvaluationError(f"{context} review.reviewed_at must be an ISO-compatible date")

    required_types = required_challenge_types if required_challenge_types is not None else REQUIRED_CHALLENGE_TYPES
    missing_required_types = [
        challenge_type
        for challenge_type in sorted(required_types)
        if challenge_type_counts[challenge_type] < MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE
    ]
    if missing_required_types and not allow_smoke_eval:
        raise EvaluationError(
            f"{manifest_path}: negative challenge manifest needs at least "
            f"{MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE} clips for each required type; "
            f"missing/underfilled: {', '.join(missing_required_types)}"
        )

    if not allow_smoke_eval:
        split_signers = set().union(*(manifest["signer_ids"] for manifest in split_manifests))
        overlap = signer_ids & split_signers
        if overlap:
            raise EvaluationError(
                "negative challenge signers must be disjoint from train/validation/test signers: "
                + ", ".join(sorted(overlap))
            )

    return {
        "path": str(manifest_path),
        "dataset_id": data["dataset_id"],
        "split": "negative_challenge",
        "clip_count": len(clips),
        "sha256": sha256_file(manifest_path),
        "dataset_source_mode": dataset_source_mode,
        "external_dataset_import": external_dataset_import,
        "source_register": data.get("source_register"),
        "collection_plan": collection_plan,
        "consent_form": consent_form,
        "vocabulary_review": vocabulary_review,
        "signer_ids": signer_ids,
        "challenge_type_counts": challenge_type_counts,
    }


def is_invalid_iso_date(value: str) -> bool:
    try:
        dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return True
    return False


class RawFrameChallengeDataset:
    def __init__(
        self,
        torch: Any,
        manifest_path: Path,
        frame_count: int,
        image_size: int,
        require_decode_provenance: bool = False,
    ) -> None:
        self.torch = torch
        self.manifest_path = manifest_path
        self.frame_count = frame_count
        self.image_size = image_size
        manifest = load_challenge_manifest(manifest_path)
        self.records: list[dict[str, Any]] = []
        manifest_reference = file_reference(manifest_path)

        for index, clip in enumerate(manifest["clips"]):
            context = f"{manifest_path}: clips[{index}]"
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            if not tensor_path.exists():
                raise TrainingError(f"{context} decoded frame tensor is unavailable: {tensor_path}")
            expected_hash = expected_tensor_hash_for_clip(clip, context)
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise TrainingError(
                    f"{context} decoded frame tensor hash mismatch for {tensor_path}; "
                    f"expected {expected_hash}, got {actual_hash}"
                )
            if require_decode_provenance:
                try:
                    verify_clip_decode_provenance(
                        torch,
                        manifest_path,
                        clip,
                        context,
                        replay_ffmpeg=should_verify_retained_local_ml_environment(),
                    )
                except DecodeProvenanceError as error:
                    raise TrainingError(str(error)) from error
            self.records.append(
                {
                    **sidecar_manifest_metadata_for_clip(
                        clip,
                        manifest_path,
                        manifest_reference,
                        index,
                        "negative_challenge",
                    ),
                    "clip_id": clip["clip_id"],
                    "challenge_type": clip["challenge_type"],
                    "expected_outcome": clip["expected_outcome"],
                    "_tensor_path": tensor_path,
                }
            )

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        record = self.records[index]
        frames = load_tensor_file(self.torch, record["_tensor_path"])
        frames = prepare_frames(
            self.torch,
            frames,
            frame_count=self.frame_count,
            image_size=self.image_size,
            context=f"{self.manifest_path}: challenge clip {record['clip_id']}",
        )
        return frames, self.torch.tensor(index, dtype=self.torch.long)


def load_challenge_manifest(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise EvaluationError(f"challenge manifest is invalid JSON: {path}: {error}") from error
    if not isinstance(data, dict):
        raise EvaluationError(f"challenge manifest root must be an object: {path}")
    if not isinstance(data.get("clips"), list):
        raise EvaluationError(f"challenge manifest clips must be an array: {path}")
    return data


def evaluate_negative_challenge_set(
    torch: Any,
    model: Any,
    manifest_path: Path,
    label_to_index: dict[str, int],
    frame_count: int,
    image_size: int,
    batch_size: int,
    num_workers: int,
    device: Any,
    threshold: float,
    require_decode_provenance: bool,
) -> dict[str, Any]:
    dataset = RawFrameChallengeDataset(
        torch,
        manifest_path,
        frame_count,
        image_size,
        require_decode_provenance=require_decode_provenance,
    )
    loader = torch.utils.data.DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
    )
    labels_by_index = [label for label, _ in sorted(label_to_index.items(), key=lambda item: item[1])]
    examples: list[dict[str, Any]] = []
    model.eval()
    with torch.no_grad():
        for frames, record_indexes in loader:
            frames = frames.to(device)
            logits = model(frames)
            logits_cpu = logits.detach().cpu()
            probabilities = torch.softmax(logits, dim=1).detach().cpu()
            predictions = probabilities.argmax(dim=1)
            record_indexes_cpu = record_indexes.detach().cpu()
            for row_index in range(int(record_indexes_cpu.shape[0])):
                record = dataset.records[int(record_indexes_cpu[row_index].item())]
                predicted_index = int(predictions[row_index].item())
                row_logits = logits_cpu[row_index]
                row_probabilities = probabilities[row_index]
                logits_by_label = build_logit_by_label(row_logits, labels_by_index)
                probability_by_label = build_probability_by_label(row_probabilities, labels_by_index)
                predicted_label_logit = float(row_logits[predicted_index].item())
                confidence = float(row_probabilities[predicted_index].item())
                top_logit_values, top_logit_indexes = torch.topk(row_logits, k=min(2, int(row_logits.shape[0])))
                top_values, top_indexes = torch.topk(row_probabilities, k=min(2, int(row_probabilities.shape[0])))
                top2_logit = float(top_logit_values[1].item()) if int(top_logit_values.shape[0]) > 1 else 0.0
                top2_confidence = float(top_values[1].item()) if int(top_values.shape[0]) > 1 else 0.0
                logit_margin = predicted_label_logit - top2_logit
                probability_margin = confidence - top2_confidence
                entropy = float(
                    -(row_probabilities * torch.log(row_probabilities.clamp_min(1e-12))).sum().item()
                )
                examples.append(
                    {
                        "example_id": record["example_id"],
                        "clip_id": record["clip_id"],
                        "split": record["split"],
                        "manifest_path": record["manifest_path"],
                        "manifest_sha256": record["manifest_sha256"],
                        "manifest_row_index": record["manifest_row_index"],
                        "tensor_path": record["tensor_path"],
                        "tensor_sha256": record["tensor_sha256"],
                        "tensor_hash_source": record["tensor_hash_source"],
                        "challenge_type": record["challenge_type"],
                        "expected_outcome": "reject",
                        "predicted_index": predicted_index,
                        "predicted_label": labels_by_index[predicted_index],
                        "predicted_label_logit": predicted_label_logit,
                        "true_label_logit": None,
                        "confidence": confidence,
                        "true_label_probability": None,
                        "top2_logit": top2_logit,
                        "top2_logit_label": labels_by_index[int(top_logit_indexes[1].item())]
                        if int(top_logit_indexes.shape[0]) > 1
                        else None,
                        "top2_confidence": top2_confidence,
                        "top2_label": labels_by_index[int(top_indexes[1].item())]
                        if int(top_indexes.shape[0]) > 1
                        else None,
                        "logit_margin": logit_margin,
                        "probability_margin": probability_margin,
                        "entropy": entropy,
                        "logits_by_label": logits_by_label,
                        "probability_by_label": probability_by_label,
                        "false_pass": confidence >= threshold,
                    }
                )
    if not examples:
        raise EvaluationError("negative challenge manifest produced no evaluation examples")
    false_pass_count = sum(1 for item in examples if item["false_pass"])
    by_type: dict[str, dict[str, Any]] = {}
    for challenge_type in sorted({item["challenge_type"] for item in examples}):
        rows = [item for item in examples if item["challenge_type"] == challenge_type]
        type_false_pass_count = sum(1 for item in rows if item["false_pass"])
        by_type[challenge_type] = {
            "examples": len(rows),
            "false_pass_count": type_false_pass_count,
            "false_pass_rate": type_false_pass_count / len(rows),
            "max_confidence": max(float(item["confidence"]) for item in rows),
        }
    return {
        "split": "negative_challenge",
        "examples": len(examples),
        "threshold": threshold,
        "false_pass_count": false_pass_count,
        "false_pass_rate": false_pass_count / len(examples),
        "max_confidence": max(float(item["confidence"]) for item in examples),
        "by_type": by_type,
        "predictions": examples,
    }


def main() -> int:
    args = parse_args()
    if args.batch_size <= 0:
        print("Evaluation failed: --batch-size must be greater than zero", file=sys.stderr)
        return 2
    if args.num_workers < 0:
        print("Evaluation failed: --num-workers must be zero or greater", file=sys.stderr)
        return 2
    if args.lesson_milestone and args.allow_smoke_eval:
        print("Evaluation failed: --lesson-milestone cannot be combined with --allow-smoke-eval", file=sys.stderr)
        return 2
    if args.reduced_real_data_training_smoke and args.allow_smoke_eval:
        print(
            "Evaluation failed: --reduced-real-data-training-smoke cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.allow_smoke_eval:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.allow_smoke_eval:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.allow_smoke_eval:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.allow_smoke_eval:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.reduced_real_data_training_smoke and args.lesson_milestone:
        print(
            "Evaluation failed: --reduced-real-data-training-smoke cannot be combined with --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.lesson_milestone:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.lesson_milestone:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.lesson_milestone:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.lesson_milestone:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.reduced_real_data_training_smoke:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --reduced-real-data-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.reduced_real_data_training_smoke:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --reduced-real-data-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.reduced_real_data_training_smoke:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --reduced-real-data-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.reduced_real_data_training_smoke:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --reduced-real-data-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.region_grid_tcn_training_smoke:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --region-grid-tcn-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.region_grid_tcn_training_smoke:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --region-grid-tcn-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.popsign_fresh5_training_smoke:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --popsign-fresh5-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.popsign_label_ladder_training_smoke:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --popsign-label-ladder-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.region_grid_tcn_training_smoke:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --region-grid-tcn-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.popsign_fresh5_training_smoke:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --popsign-fresh5-training-smoke",
            file=sys.stderr,
        )
        return 2
    if args.lesson_core_negative_diagnostic and not args.lesson_milestone:
        print(
            "Evaluation failed: --lesson-core-negative-diagnostic requires --lesson-milestone",
            file=sys.stderr,
        )
        return 2
    if args.reduced_real_data_training_smoke and args.lesson_core_negative_diagnostic:
        print(
            "Evaluation failed: --reduced-real-data-training-smoke cannot be combined with --lesson-core-negative-diagnostic",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.lesson_core_negative_diagnostic:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --lesson-core-negative-diagnostic",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.lesson_core_negative_diagnostic:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --lesson-core-negative-diagnostic",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.lesson_core_negative_diagnostic:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --lesson-core-negative-diagnostic",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.lesson_core_negative_diagnostic:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --lesson-core-negative-diagnostic",
            file=sys.stderr,
        )
        return 2
    if args.lesson_core_negative_diagnostic and args.allow_smoke_eval:
        print(
            "Evaluation failed: --lesson-core-negative-diagnostic cannot be combined with --allow-smoke-eval",
            file=sys.stderr,
        )
        return 2
    if args.controlled_pilot and args.allow_smoke_eval:
        print("Evaluation failed: --controlled-pilot cannot be combined with --allow-smoke-eval", file=sys.stderr)
        return 2
    if args.controlled_clip_heldout and args.allow_smoke_eval:
        print("Evaluation failed: --controlled-clip-heldout cannot be combined with --allow-smoke-eval", file=sys.stderr)
        return 2
    if args.controlled_pilot and args.lesson_milestone:
        print("Evaluation failed: --controlled-pilot cannot be combined with --lesson-milestone", file=sys.stderr)
        return 2
    if args.controlled_clip_heldout and args.lesson_milestone:
        print("Evaluation failed: --controlled-clip-heldout cannot be combined with --lesson-milestone", file=sys.stderr)
        return 2
    if args.reduced_real_data_training_smoke and args.controlled_pilot:
        print(
            "Evaluation failed: --reduced-real-data-training-smoke cannot be combined with --controlled-pilot",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.controlled_pilot:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --controlled-pilot",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.controlled_pilot:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --controlled-pilot",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.controlled_pilot:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --controlled-pilot",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.controlled_pilot:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --controlled-pilot",
            file=sys.stderr,
        )
        return 2
    if args.reduced_real_data_training_smoke and args.controlled_clip_heldout:
        print(
            "Evaluation failed: --reduced-real-data-training-smoke cannot be combined with --controlled-clip-heldout",
            file=sys.stderr,
        )
        return 2
    if args.region_grid_tcn_training_smoke and args.controlled_clip_heldout:
        print(
            "Evaluation failed: --region-grid-tcn-training-smoke cannot be combined with --controlled-clip-heldout",
            file=sys.stderr,
        )
        return 2
    if args.m3gu_reduced4_training_smoke and args.controlled_clip_heldout:
        print(
            "Evaluation failed: --m3gu-reduced4-training-smoke cannot be combined with --controlled-clip-heldout",
            file=sys.stderr,
        )
        return 2
    if args.popsign_fresh5_training_smoke and args.controlled_clip_heldout:
        print(
            "Evaluation failed: --popsign-fresh5-training-smoke cannot be combined with --controlled-clip-heldout",
            file=sys.stderr,
        )
        return 2
    if args.popsign_label_ladder_training_smoke and args.controlled_clip_heldout:
        print(
            "Evaluation failed: --popsign-label-ladder-training-smoke cannot be combined with --controlled-clip-heldout",
            file=sys.stderr,
        )
        return 2
    if args.controlled_clip_heldout and args.controlled_pilot:
        print("Evaluation failed: --controlled-clip-heldout cannot be combined with --controlled-pilot", file=sys.stderr)
        return 2
    evidence_mode = evaluation_evidence_mode(
        args.allow_smoke_eval,
        args.lesson_milestone,
        args.controlled_pilot,
        args.controlled_clip_heldout,
        args.lesson_core_negative_diagnostic,
        args.reduced_real_data_training_smoke,
        args.region_grid_tcn_training_smoke,
        args.m3gu_reduced4_training_smoke,
        args.popsign_fresh5_training_smoke,
        args.popsign_label_ladder_training_smoke,
    )
    try:
        torch = import_torch()
        if args.popsign_label_ladder_training_smoke:
            validate_popsign_label_ladder_training_smoke_invocation(args)
        checkpoint_path = resolve_project_path(args.checkpoint, "checkpoint")
        provenance_path = resolve_project_path(args.training_provenance, "training provenance")
        train_manifest_path = resolve_project_path(args.train_manifest, "train manifest")
        validation_manifest_path = resolve_project_path(args.validation_manifest, "validation manifest")
        test_manifest_path = resolve_project_path(args.test_manifest, "test manifest")
        if args.challenge_manifest:
            challenge_manifest_path = resolve_project_path(
                args.challenge_manifest,
                "negative challenge manifest",
            )
        elif (
            args.allow_smoke_eval
            or args.reduced_real_data_training_smoke
            or args.region_grid_tcn_training_smoke
            or args.m3gu_reduced4_training_smoke
            or args.popsign_fresh5_training_smoke
            or args.popsign_label_ladder_training_smoke
        ):
            challenge_manifest_path = None
        else:
            raise EvaluationError(
                f"--challenge-manifest is required for {evidence_mode} evidence"
            )
        output_report_path = resolve_project_path(args.output_report, "output report", must_exist=False)
        calibrated_provenance_path = resolve_project_path(
            args.calibrated_provenance,
            "calibrated provenance",
            must_exist=False,
        )
        sidecar_path = (
            resolve_project_path(args.prediction_sidecar, "--prediction-sidecar", must_exist=False)
            if args.prediction_sidecar
            else None
        )
        if args.m3gu_reduced4_training_smoke:
            if args.batch_size > 4:
                raise EvaluationError("M3GU reduced4 evaluation is bounded to batch size 4")
            if args.num_workers != 0:
                raise EvaluationError("M3GU reduced4 evaluation requires --num-workers 0")
            validate_m3gu_reduced4_evaluation_outputs(
                output_report_path,
                calibrated_provenance_path,
                sidecar_path,
            )
        if not args.allow_smoke_eval and should_verify_retained_local_ml_environment():
            require_current_local_ml_environment(f"{evidence_mode} evaluation")
        checkpoint = load_checkpoint(torch, checkpoint_path)
        provenance = read_json(provenance_path)
        manifests = [
            validate_evaluation_manifest(
                train_manifest_path,
                "train",
                args.allow_smoke_eval,
                args.lesson_milestone,
                args.controlled_clip_heldout,
                args.reduced_real_data_training_smoke,
                args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_training_smoke,
            ),
            validate_evaluation_manifest(
                validation_manifest_path,
                "validation",
                args.allow_smoke_eval,
                args.lesson_milestone,
                args.controlled_clip_heldout,
                args.reduced_real_data_training_smoke,
                args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_training_smoke,
            ),
            validate_evaluation_manifest(
                test_manifest_path,
                "test",
                args.allow_smoke_eval,
                args.lesson_milestone,
                args.controlled_clip_heldout,
                args.reduced_real_data_training_smoke,
                args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_training_smoke,
            ),
        ]
        if not args.controlled_clip_heldout:
            assert_signer_disjoint(manifests)
        assert_label_sets_match(manifests)
        challenge_manifest = (
            validate_negative_challenge_manifest(
                challenge_manifest_path,
                manifests,
                args.allow_smoke_eval,
                required_negative_challenge_types(args),
            )
            if challenge_manifest_path
            else None
        )
        smoke_reasons = validate_finality(
            checkpoint,
            provenance,
            checkpoint_path,
            manifests,
            args.allow_smoke_eval,
            args.lesson_milestone,
            args.controlled_pilot,
            args.controlled_clip_heldout,
            args.reduced_real_data_training_smoke,
            args.region_grid_tcn_training_smoke,
            args.m3gu_reduced4_training_smoke,
            args.popsign_fresh5_training_smoke,
            args.popsign_label_ladder_training_smoke,
        )
        label_to_index = {
            str(label): int(index) for label, index in checkpoint["label_to_index"].items()
        }
        if set(label_to_index) != manifests[0]["label_ids"]:
            raise EvaluationError("checkpoint label map does not match manifest labels")
        frame_count = int(checkpoint["frame_count"])
        image_size = int(checkpoint["image_size"])
        if frame_count <= 0 or image_size <= 0:
            raise EvaluationError("checkpoint frame_count and image_size must be positive")
        require_decode_provenance = (
            not args.allow_smoke_eval
            and not args.region_grid_tcn_training_smoke
            and not args.m3gu_reduced4_training_smoke
            and not args.popsign_fresh5_training_smoke
            and not args.popsign_label_ladder_training_smoke
        )
        device = select_device(torch)
        if not args.allow_smoke_eval and str(device) not in {"cuda", "mps"}:
            raise EvaluationError(
                f"{evidence_mode} evaluation requires PyTorch GPU execution; current device is {device}"
            )
        architecture = checkpoint_architecture(checkpoint)
        model = build_model(torch, len(label_to_index), architecture)
        model.load_state_dict(checkpoint["model_state"])
        model = model.to(device)
        preserve_region_axis = (
            args.region_grid_tcn_training_smoke
            or args.m3gu_reduced4_training_smoke
            or args.popsign_fresh5_training_smoke
        )
        validation_metrics = evaluate_split(
            torch,
            model,
            validation_manifest_path,
            "validation",
            label_to_index,
            frame_count,
            image_size,
            args.batch_size,
            args.num_workers,
            device,
            require_decode_provenance,
            preserve_region_axis,
        )
        test_metrics = evaluate_split(
            torch,
            model,
            test_manifest_path,
            "test",
            label_to_index,
            frame_count,
            image_size,
            args.batch_size,
            args.num_workers,
            device,
            require_decode_provenance,
            preserve_region_axis,
        )
        calibration = calibrate_threshold(validation_metrics)
        selected_threshold = float(calibration["selected_threshold"])
        test_threshold_metrics = threshold_metrics(test_metrics["predictions"], selected_threshold)
        challenge_metrics = (
            evaluate_negative_challenge_set(
                torch,
                model,
                challenge_manifest_path,
                label_to_index,
                frame_count,
                image_size,
                args.batch_size,
                args.num_workers,
                device,
                selected_threshold,
                require_decode_provenance,
            )
            if challenge_manifest_path
            else None
        )
        negative_challenge_passed = (
            True
            if challenge_metrics is None and args.allow_smoke_eval
            else bool(
                challenge_metrics
                and challenge_metrics["false_pass_rate"] < TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE
            )
        )
        pass_status = {
            "top1_accuracy": test_metrics["top1_accuracy"] >= TARGET_TOP1,
            "macro_f1": test_metrics["macro_f1"] >= TARGET_MACRO_F1,
            "false_pass_rate": test_threshold_metrics["false_pass_rate"] < TARGET_FALSE_PASS_RATE,
            "negative_challenge_false_pass_rate": negative_challenge_passed,
            "confidence_threshold": 0 < selected_threshold < 1,
        }
        all_targets_pass = all(pass_status.values())
        final_model_evidence = evidence_mode == "final" and all_targets_pass
        lesson_milestone_evidence = evidence_mode == "lesson_milestone" and all_targets_pass
        lesson_core_negative_diagnostic_evidence = False
        controlled_pilot_evidence = evidence_mode == "controlled_pilot" and all_targets_pass
        controlled_clip_heldout_evidence = evidence_mode == "controlled_clip_heldout" and all_targets_pass
        reduced_real_data_training_smoke_evidence = False
        region_grid_tcn_training_smoke_evidence = False
        m3gu_reduced4_training_smoke_evidence = False
        popsign_fresh5_training_smoke_evidence = False
        popsign_label_ladder_training_smoke_evidence = False
        report = {
            "schema_version": VALIDATION_REPORT_SCHEMA_VERSION,
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "evidence_mode": evidence_mode,
            "final_model_evidence": final_model_evidence,
            "lesson_milestone_evidence": lesson_milestone_evidence,
            "lesson_core_negative_diagnostic_evidence": lesson_core_negative_diagnostic_evidence,
            "controlled_pilot_evidence": controlled_pilot_evidence,
            "controlled_clip_heldout_evidence": controlled_clip_heldout_evidence,
            "reduced_real_data_training_smoke_evidence": reduced_real_data_training_smoke_evidence,
            "region_grid_tcn_training_smoke_evidence": region_grid_tcn_training_smoke_evidence,
            "m3gu_reduced4_training_smoke_evidence": m3gu_reduced4_training_smoke_evidence,
            "popsign_fresh5_training_smoke_evidence": popsign_fresh5_training_smoke_evidence,
            "popsign_label_ladder_training_smoke_evidence": popsign_label_ladder_training_smoke_evidence,
            "finality": (
                "final_75_100_label_candidate_evidence"
                if evidence_mode == "final"
                else "popsign_label_ladder_training_smoke_not_final_or_lesson_evidence"
                if evidence_mode == "popsign_label_ladder_training_smoke"
                else "popsign_fresh5_training_smoke_not_final_or_lesson_evidence"
                if evidence_mode == "popsign_fresh5_training_smoke"
                else "m3gu_reduced4_training_smoke_not_final_or_lesson_evidence"
                if evidence_mode == "m3gu_reduced4_training_smoke"
                else "region_grid_tcn_training_smoke_not_final_or_lesson_evidence"
                if evidence_mode == "region_grid_tcn_training_smoke"
                else "reduced_real_data_training_smoke_not_final_or_lesson_evidence"
                if evidence_mode == "reduced_real_data_training_smoke"
                else "diagnostic_25_sign_lesson_core_negative_only_not_final_or_full_hard_negative_evidence"
                if evidence_mode == "lesson_core_negative_diagnostic"
                else "strict_25_sign_lesson_milestone_not_final_75_100_evidence"
                if evidence_mode == "lesson_milestone"
                else "controlled_pilot_75_100_label_candidate_evidence"
                if evidence_mode == "controlled_pilot"
                else "controlled_pilot_clip_heldout_candidate_evidence_not_signer_disjoint"
                if evidence_mode == "controlled_clip_heldout"
                else "smoke_or_wiring_only_not_model_evidence"
            ),
            "generated_by": generated_by(
                args.allow_smoke_eval,
                args.lesson_milestone,
                args.controlled_pilot,
                args.controlled_clip_heldout,
                args.lesson_core_negative_diagnostic,
                args.reduced_real_data_training_smoke,
                args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_training_smoke,
            ),
            "status": (
                "smoke_only"
                if args.allow_smoke_eval
                else "popsign_label_ladder_training_smoke_completed"
                if args.popsign_label_ladder_training_smoke
                else "popsign_fresh5_training_smoke_completed"
                if args.popsign_fresh5_training_smoke
                else "m3gu_reduced4_training_smoke_completed"
                if args.m3gu_reduced4_training_smoke
                else "region_grid_tcn_training_smoke_completed"
                if args.region_grid_tcn_training_smoke
                else "reduced_real_data_training_smoke_completed"
                if args.reduced_real_data_training_smoke
                else "lesson_core_negative_diagnostic_passed"
                if args.lesson_core_negative_diagnostic and all_targets_pass
                else "lesson_core_negative_diagnostic_failed"
                if args.lesson_core_negative_diagnostic
                else "lesson_milestone_validation_passed"
                if args.lesson_milestone and all_targets_pass
                else "lesson_milestone_validation_failed"
                if args.lesson_milestone
                else "controlled_pilot_validation_passed"
                if args.controlled_pilot and all_targets_pass
                else "controlled_pilot_validation_failed"
                if args.controlled_pilot
                else "controlled_clip_heldout_validation_passed"
                if args.controlled_clip_heldout and all_targets_pass
                else "controlled_clip_heldout_validation_failed"
                if args.controlled_clip_heldout
                else "candidate_final_validation_passed"
                if all_targets_pass
                else "candidate_final_validation_failed"
            ),
            "smoke_reasons": smoke_reasons,
            "evaluation_command": [sys.executable, *sys.argv],
            "evaluation_script": file_reference(Path(__file__)),
            "environment_files": environment_file_references(),
            "local_ml_environment": local_ml_environment_reference(),
            "model": {
                "checkpoint": {
                    "path": project_relative(checkpoint_path),
                    "sha256": sha256_file(checkpoint_path),
                },
                "training_provenance": {
                    "path": project_relative(provenance_path),
                    "sha256": sha256_file(provenance_path),
                },
                "initialization": provenance.get("initialization"),
                "random_initialization_evidence": provenance.get("random_initialization_evidence"),
                "pretrained_components": provenance.get("pretrained_components"),
                "architecture": architecture,
                "frame_count": frame_count,
                "image_size": image_size,
                "preserve_region_axis": preserve_region_axis,
                "label_count": len(label_to_index),
                "runtime_device": str(device),
            },
            "decode_provenance_verification": {
                "required": require_decode_provenance,
                "status": "passed"
                if require_decode_provenance
                else "not_required_for_popsign_label_ladder_training_smoke"
                if args.popsign_label_ladder_training_smoke
                else "not_required_for_popsign_fresh5_training_smoke"
                if args.popsign_fresh5_training_smoke
                else "not_required_for_m3gu_reduced4_training_smoke"
                if args.m3gu_reduced4_training_smoke
                else "not_required_for_region_grid_tcn_training_smoke"
                if args.region_grid_tcn_training_smoke
                else "not_required_for_smoke",
                "schema_version": "asl-pilot-rawframe-decode-provenance/v1",
            },
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
            "targets": {
                "top1_accuracy": TARGET_TOP1,
                "macro_f1": TARGET_MACRO_F1,
                "false_pass_rate_below": TARGET_FALSE_PASS_RATE,
                "negative_challenge_false_pass_rate_below": TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE,
                "negative_challenge_required_types": sorted(required_negative_challenge_types(args)),
                "negative_challenge_min_clips_per_required_type": MIN_CHALLENGE_CLIPS_PER_REQUIRED_TYPE,
            },
            "threshold_calibration": calibration,
            "validation": strip_predictions(validation_metrics),
            "test": {
                **strip_predictions(test_metrics),
                "threshold_metrics": test_threshold_metrics,
            },
            "negative_challenge": (
                {
                    "manifest": {
                        "path": project_relative(Path(challenge_manifest["path"])),
                        "dataset_id": challenge_manifest["dataset_id"],
                        "split": challenge_manifest["split"],
                        "clip_count": challenge_manifest["clip_count"],
                        "sha256": challenge_manifest["sha256"],
                        "dataset_source_mode": challenge_manifest.get("dataset_source_mode"),
                        "external_dataset_import": challenge_manifest.get("external_dataset_import"),
                        "source_register": challenge_manifest.get("source_register"),
                        "collection_plan": challenge_manifest.get("collection_plan"),
                        "consent_form": challenge_manifest.get("consent_form"),
                        "vocabulary_review": challenge_manifest.get("vocabulary_review"),
                        "challenge_type_counts": challenge_manifest["challenge_type_counts"],
                    },
                    "metrics": strip_predictions(challenge_metrics),
                }
                if challenge_manifest and challenge_metrics
                else None
            ),
            "pass_status": pass_status,
            "known_limitations": [
                "Metrics are valid only for the controlled pilot conditions represented by the manifests.",
                "Negative challenge results cover only the challenge types and capture conditions represented by the manifest.",
                "ASL vocabulary and hints are limited to the reviewed vocabulary evidence embedded in the manifests.",
                "Clip-heldout evidence is not signer-disjoint and must be described as a controlled-pilot limitation."
                if args.controlled_clip_heldout
                else "This reduced real-data training smoke uses only the approved seven-label high-signal module and is not final 75-100-label evidence."
                if args.reduced_real_data_training_smoke
                else "This PopSign label-ladder training smoke uses only the approved 25/50/95-label diagnostic ladder modules and is not final, lesson, product, browser, promotion, or ASL correctness evidence."
                if args.popsign_label_ladder_training_smoke
                else "This PopSign fresh5 training smoke uses only the approved five-label repaired-manifest module and is not final 75-100-label evidence."
                if args.popsign_fresh5_training_smoke
                else "This M3GU reduced4 training smoke uses only the approved four-label M3GQ reduced4 module and is not final 75-100-label, lesson, product, browser, promotion, or ASL correctness evidence."
                if args.m3gu_reduced4_training_smoke
                else "Held-out evidence is signer-disjoint for the supplied validation/test manifests.",
                "This lesson core-negative diagnostic uses only the current core negative challenge taxonomy; the full 17-type hard-negative gate remains unsatisfied and separate."
                if args.lesson_core_negative_diagnostic
                else "This reduced real-data training smoke has no negative-challenge manifest and is not threshold-calibration evidence."
                if args.reduced_real_data_training_smoke
                else "This PopSign label-ladder training smoke has no negative-challenge manifest and is not threshold-calibration evidence."
                if args.popsign_label_ladder_training_smoke
                else "This PopSign fresh5 training smoke has no negative-challenge manifest and is not threshold-calibration evidence."
                if args.popsign_fresh5_training_smoke
                else "This M3GU reduced4 training smoke has no negative-challenge manifest and is not threshold-calibration evidence."
                if args.m3gu_reduced4_training_smoke
                else "The configured negative challenge taxonomy is the gate for this evidence mode.",
            ],
        }
        if args.prediction_sidecar:
            assert sidecar_path is not None
            report["prediction_sidecar"] = {
                "path": project_relative(sidecar_path),
                "schema_version": PREDICTION_SIDECAR_SCHEMA_VERSION,
                "contract_version": PREDICTION_SIDECAR_CONTRACT_VERSION,
            }
        write_json(output_report_path, report)
        if sidecar_path:
            write_json(
                sidecar_path,
                build_prediction_sidecar(
                    args,
                    report,
                    validation_metrics,
                    test_metrics,
                    challenge_metrics,
                    selected_threshold,
                ),
            )
        calibrated_summary: dict[str, Any] | None = None
        if args.allow_smoke_eval or (all_targets_pass and not args.lesson_core_negative_diagnostic):
            calibrated = {
                **provenance,
                "schema_version": CALIBRATED_PROVENANCE_SCHEMA_VERSION,
                "evidence_mode": evidence_mode,
                "final_model_evidence": final_model_evidence,
                "lesson_milestone_evidence": lesson_milestone_evidence,
                "lesson_core_negative_diagnostic_evidence": lesson_core_negative_diagnostic_evidence,
                "controlled_pilot_evidence": controlled_pilot_evidence,
                "controlled_clip_heldout_evidence": controlled_clip_heldout_evidence,
                "reduced_real_data_training_smoke_evidence": reduced_real_data_training_smoke_evidence,
                "region_grid_tcn_training_smoke_evidence": region_grid_tcn_training_smoke_evidence,
                "m3gu_reduced4_training_smoke_evidence": m3gu_reduced4_training_smoke_evidence,
                "popsign_fresh5_training_smoke_evidence": popsign_fresh5_training_smoke_evidence,
                "popsign_label_ladder_training_smoke_evidence": popsign_label_ladder_training_smoke_evidence,
                "finality": report["finality"],
                "calibration_status": report["status"],
                "generated_by": generated_by(
                    args.allow_smoke_eval,
                    args.lesson_milestone,
                    args.controlled_pilot,
                    args.controlled_clip_heldout,
                    args.lesson_core_negative_diagnostic,
                    args.reduced_real_data_training_smoke,
                    args.region_grid_tcn_training_smoke,
                    args.m3gu_reduced4_training_smoke,
                    args.popsign_fresh5_training_smoke,
                    args.popsign_label_ladder_training_smoke,
                ),
                "source_training_provenance": {
                    "path": project_relative(provenance_path),
                    "sha256": sha256_file(provenance_path),
                },
                "evaluation_command": report["evaluation_command"],
                "evaluation_script": report["evaluation_script"],
                "evaluation_environment_files": report["environment_files"],
                "evaluation_local_ml_environment": report["local_ml_environment"],
                "threshold_policy": {
                    "type": "fail_closed",
                    "selected_threshold": selected_threshold,
                    "source": project_relative(output_report_path),
                    "source_sha256": sha256_file(output_report_path),
                    "selection_rule": calibration["selection_rule"],
                    "validation_false_pass_rate": calibration["selected_metrics"]["false_pass_rate"],
                    "negative_challenge_false_pass_rate": (
                        challenge_metrics["false_pass_rate"] if challenge_metrics else None
                    ),
                },
                "validation_report": {
                    "path": project_relative(output_report_path),
                    "sha256": sha256_file(output_report_path),
                },
                "negative_challenge": (
                    {
                        "manifest": report["negative_challenge"]["manifest"],
                        "false_pass_rate": challenge_metrics["false_pass_rate"],
                        "target_false_pass_rate_below": TARGET_NEGATIVE_CHALLENGE_FALSE_PASS_RATE,
                    }
                    if challenge_metrics and report["negative_challenge"]
                    else None
                ),
            }
            write_json(calibrated_provenance_path, calibrated)
            calibrated_summary = {
                "path": project_relative(calibrated_provenance_path),
                "sha256": sha256_file(calibrated_provenance_path),
            }
        print(
            json.dumps(
                {
                    "status": report["status"],
                    "output_report": project_relative(output_report_path),
                    "output_report_sha256": sha256_file(output_report_path),
                    "calibrated_provenance": calibrated_summary["path"] if calibrated_summary else None,
                    "calibrated_provenance_sha256": (
                        calibrated_summary["sha256"] if calibrated_summary else None
                    ),
                    "selected_threshold": selected_threshold,
                    "test_top1_accuracy": test_metrics["top1_accuracy"],
                    "test_macro_f1": test_metrics["macro_f1"],
                    "test_false_pass_rate": test_threshold_metrics["false_pass_rate"],
                    "negative_challenge_false_pass_rate": (
                        challenge_metrics["false_pass_rate"] if challenge_metrics else None
                    ),
                    "passes_targets": all_targets_pass,
                },
                indent=2,
                sort_keys=True,
            )
        )
        if (
            not args.allow_smoke_eval
            and not args.reduced_real_data_training_smoke
            and not args.popsign_fresh5_training_smoke
            and not args.popsign_label_ladder_training_smoke
            and not args.m3gu_reduced4_training_smoke
            and not all_targets_pass
        ):
            return 1
    except (ManifestError, TrainingError, EvaluationError) as error:
        message = str(error).replace("--allow-small-label-set", "--allow-smoke-eval")
        print(f"Evaluation failed: {message}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
