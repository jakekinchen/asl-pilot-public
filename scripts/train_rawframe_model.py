#!/usr/bin/env python3
"""Compliant raw-frame ASL model training.

Dry-run validation intentionally uses the Python standard library plus system
OpenSSL for Ed25519 consent receipt verification. Actual training optionally
uses PyTorch when it is installed. Dataset manifests and provenance guardrails
are always validated before any ML backend is allowed to train. The recognition
model is initialized randomly and trained from raw RGB clip tensors; pretrained
detectors, landmarks, feature extractors, backbones, checkpoints, or weights are
rejected.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import datetime as dt
import hashlib
import json
import math
import platform
import random
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from audit_local_ml_environment import (
    DEFAULT_REPORT_PATH as DEFAULT_LOCAL_ML_ENVIRONMENT_REPORT,
    validate_retained_report as validate_retained_local_ml_environment_report,
)
from rawframe_decode_provenance import (
    DecodeProvenanceError,
    verify_clip_decode_provenance,
)


EXPECTED_SCHEMA_VERSION = "asl-pilot-rawframe-manifest/v1"
EXPECTED_SOURCE_REGISTER_SCHEMA = "asl-pilot-dataset-source-register/v1"
EXPECTED_VOCABULARY_REVIEW_SCHEMA = "asl-pilot-vocabulary-review-evidence/v1"
ACCEPTED_VOCABULARY_REVIEW_STATUSES = {"reviewed", "source_curated"}
ALLOWED_FRAME_SOURCE = "raw_rgb_video"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
FIRST_PARTY_SOURCE_IDS = {"first-party-browser-consent-capture"}
ASL_CITIZEN_SOURCE_ID = "asl-citizen-school-assignment-raw-videos"
POPSIGN_SOURCE_ID = "popsign-v1-original-videos"
ASL_CITIZEN_SOURCE_FILE_URL = (
    "https://download.microsoft.com/download/b/8/8/"
    "b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip"
)
FIRST_PARTY_DATASET_SOURCE_MODE = "first_party_consent_capture"
EXTERNAL_DATASET_SOURCE_MODE = "approved_external_raw_video_source"
DATASET_SOURCE_MODES = {
    FIRST_PARTY_DATASET_SOURCE_MODE,
    EXTERNAL_DATASET_SOURCE_MODE,
}
ALLOWED_SOURCE_KINDS = {
    "first_party_collection",
    "public_reference_dataset",
    "external_dataset_family",
}
EXTERNAL_SOURCE_KINDS = {
    "public_reference_dataset",
    "external_dataset_family",
}
MIN_LABELS = 75
MAX_LABELS = 100
MIN_LESSON_MILESTONE_LABELS = 25
MAX_LESSON_MILESTONE_LABELS = 40
MIN_REDUCED_REAL_DATA_LABELS = 5
MAX_REDUCED_REAL_DATA_LABELS = 10
MIN_CLIPS_PER_LABEL_PER_SPLIT = 5
MIN_LESSON_MILESTONE_CLIPS_PER_LABEL_PER_SPLIT = 3
MIN_REDUCED_REAL_DATA_CLIPS_PER_LABEL_PER_SPLIT = 3
EXPECTED_CONSENT_FORM_PATH = "docs/privacy/dataset-consent-form.md"
EXPECTED_CONSENT_VERSION = "asl-pilot-dataset-consent-v1"
EXPECTED_SIGNED_CONSENT_RECEIPT_SCHEMA = "asl-pilot-signed-consent-identity-receipt/v1"
EXPECTED_RECEIPT_SIGNATURE_ALGORITHM = "ed25519"
EXPECTED_SIGNED_CONSENT_RECEIPT_FIELDS = {
    "schema_version",
    "status",
    "signer_alias",
    "signer_identity_hash",
    "consent_record_ids",
    "consent_form",
    "confirmed_consent_flags",
    "signed_at",
    "signed_by",
    "signature_evidence",
}
LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE = "docs/validation/local-ml-environment.json"
EXPECTED_COLLECTION_PLAN_PATH = "data/dataset/collection-plan.json"
EXPECTED_CAPTURE_CONDITION_SCHEMA = "asl-pilot-capture-conditions/v1"
CORE_NEGATIVE_CHALLENGE_FIELDS = {
    "empty_camera": "emptyCameraConfirmed",
    "no_hands_visible": "noHandsVisibleConfirmed",
    "low_light": "lowLightConfirmed",
    "off_center": "offCenterConfirmed",
}
EXTENDED_HARD_NEGATIVE_TYPES = {
    "idle_hands",
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
ALLOWED_NEGATIVE_CHALLENGE_TYPES = set(CORE_NEGATIVE_CHALLENGE_FIELDS) | EXTENDED_HARD_NEGATIVE_TYPES
TRAINING_PROVENANCE_SCHEMA_VERSION = "asl-pilot-training-provenance/v1"
FINAL_OUTPUT_DIR = (PROJECT_ROOT / "artifacts" / "rawframe-model").resolve()
FINAL_TRAIN_MANIFEST_RELATIVE = "data/manifests/train.json"
FINAL_VALIDATION_MANIFEST_RELATIVE = "data/manifests/validation.json"
FINAL_TEST_MANIFEST_RELATIVE = "data/manifests/test.json"
LESSON_MILESTONE_OUTPUT_DIR = (PROJECT_ROOT / "artifacts" / "rawframe-lesson-milestone").resolve()
LESSON_MILESTONE_TRAIN_MANIFEST_RELATIVE = "data/manifests/lesson/rawframe-milestone/train.json"
LESSON_MILESTONE_VALIDATION_MANIFEST_RELATIVE = "data/manifests/lesson/rawframe-milestone/validation.json"
LESSON_MILESTONE_TEST_MANIFEST_RELATIVE = "data/manifests/lesson/rawframe-milestone/test.json"
REDUCED_REAL_DATA_OUTPUT_DIR = (PROJECT_ROOT / "artifacts" / "rawframe-high-signal-module").resolve()
REDUCED_REAL_DATA_TRAINING_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3aq-reduced-module-local-smoke"
).resolve()
REGION_GRID_TCN_TRAINING_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3aw-region-grid-tcn-local-smoke"
).resolve()
REGION_GRID_TCN_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3dm-high-signal-region-grid-tcn-brev"
).resolve()
REGION_GRID_TCN_M3DQ_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3dq-high-signal-region-grid-tcn-brev"
).resolve()
REGION_GRID_TCN_M3EH_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3eh-high-signal-region-grid-tcn-brev"
).resolve()
REGION_GRID_TCN_M3ER_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3er-high-signal-region-grid-tcn-brev"
).resolve()
REGION_GRID_TCN_M3GB_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3gb-high-signal-region-grid-tcn-brev"
).resolve()
REGION_GRID_TCN_M3GK_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3gk-high-signal-region-grid-tcn-brev-seed20260529"
).resolve()
REGION_GRID_TCN_M3GL_BREV_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3gl-high-signal-region-grid-tcn-brev-seed20260530"
).resolve()
M3GU_REDUCED4_TRAINING_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / "output" / "m3gu-reduced4-local-training-smoke"
).resolve()
REGION_GRID_TCN_FULL_SPLIT_BREV_SMOKE_OUTPUT_DIRS = (
    REGION_GRID_TCN_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3DQ_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3EH_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3ER_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3GB_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3GK_BREV_SMOKE_OUTPUT_DIR,
    REGION_GRID_TCN_M3GL_BREV_SMOKE_OUTPUT_DIR,
)
POPSIGN_FRESH5_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES = (
    "output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity",
    "output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval",
    "output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit",
    "output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit",
)
POPSIGN_FRESH5_TRAINING_SMOKE_OUTPUT_DIRS = tuple(
    (PROJECT_ROOT / relative).resolve()
    for relative in POPSIGN_FRESH5_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES
)
REDUCED_REAL_DATA_TRAIN_MANIFEST_RELATIVE = "data/manifests/lesson/high-signal-module/train.json"
REDUCED_REAL_DATA_VALIDATION_MANIFEST_RELATIVE = "data/manifests/lesson/high-signal-module/validation.json"
REDUCED_REAL_DATA_TEST_MANIFEST_RELATIVE = "data/manifests/lesson/high-signal-module/test.json"
HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE = "data/manifests/lesson/high-signal-region-grid/train.json"
HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE = (
    "data/manifests/lesson/high-signal-region-grid/validation.json"
)
HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE = "data/manifests/lesson/high-signal-region-grid/test.json"
M3GQ_REDUCED4_REGION_GRID_TRAIN_MANIFEST_RELATIVE = (
    "data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json"
)
M3GQ_REDUCED4_REGION_GRID_VALIDATION_MANIFEST_RELATIVE = (
    "data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json"
)
M3GQ_REDUCED4_REGION_GRID_TEST_MANIFEST_RELATIVE = (
    "data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json"
)
M3GQ_REDUCED4_REGION_GRID_MANIFEST_SHA256S = {
    "train": "aab52f670b9dbf6d219521a8ebf84d1af1a798ec5f1c8a54cbe126222ffe0f11",
    "validation": "03f4d1e391146ab98bbb1aea9936396b82a09cbb09d5e783b6a147292140f13b",
    "test": "c02486e4a50cb2894e8e1bf9ac848871368702371311c9b62b519ac8ce9b6920",
}
M3GQ_REDUCED4_REGION_GRID_MANIFEST_RELATIVES = {
    "train": M3GQ_REDUCED4_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
    "validation": M3GQ_REDUCED4_REGION_GRID_VALIDATION_MANIFEST_RELATIVE,
    "test": M3GQ_REDUCED4_REGION_GRID_TEST_MANIFEST_RELATIVE,
}
M3GQ_REDUCED4_DATASET_ID = "asl-pilot-asl-citizen-high-signal-region-grid-reduced4-m3gq-v1"
M3GQ_REDUCED4_LABEL_IDS = ("hello", "uncle", "white", "sad")
M3GQ_REDUCED4_PARENT_LABEL_IDS = ("table", "please", "black", "hello", "uncle", "white", "sad")
POPSIGN_FRESH5_REPAIRED_TRAIN_MANIFEST_RELATIVE = (
    "data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json"
)
POPSIGN_FRESH5_REPAIRED_VALIDATION_MANIFEST_RELATIVE = (
    "data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json"
)
POPSIGN_FRESH5_REPAIRED_TEST_MANIFEST_RELATIVE = (
    "data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json"
)
POPSIGN_FRESH5_REPAIRED_DATASET_ID = "return-to-form-popsign-fresh5-repaired-v1"
POPSIGN_FRESH5_REPAIRED_LABEL_IDS = ("thank_you", "pen", "home", "who", "morning")
POPSIGN_LABEL_LADDER_MANIFEST_ROOT_RELATIVE = "data/manifests/diagnostics/popsign-label-ladder"
POPSIGN_LABEL_LADDER_OUTPUT_DIR_RELATIVE = "output/m3fd-popsign-label-ladder-diagnostic-dry-run"
POPSIGN_LABEL_LADDER_OUTPUT_DIR = (PROJECT_ROOT / POPSIGN_LABEL_LADDER_OUTPUT_DIR_RELATIVE).resolve()
POPSIGN_LABEL_LADDER_LABEL_COUNTS = (5, 10, 25, 50, 95)
POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS = (25, 50, 95)
POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVE = (
    "output/m3ff-popsign-label-ladder-local-sanity"
)
POPSIGN_LABEL_LADDER_M3HB_TRAINING_SMOKE_OUTPUT_DIR_RELATIVE = (
    "output/m3hb-popsign25-bounded-brev-contract"
)
POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR_RELATIVE = (
    "output/m3hh-popsign25-full-exposure-bounded-brev-contract"
)
POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR = (
    PROJECT_ROOT / POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVE
).resolve()
POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR = (
    PROJECT_ROOT / POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR_RELATIVE
).resolve()
POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES = (
    POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVE,
    POPSIGN_LABEL_LADDER_M3HB_TRAINING_SMOKE_OUTPUT_DIR_RELATIVE,
    POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR_RELATIVE,
)
POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIRS = tuple(
    (PROJECT_ROOT / relative).resolve()
    for relative in POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES
)
MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_EPOCHS = 3
MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_BATCH_SIZE = 8
MAX_REGION_GRID_TCN_TRAINING_SMOKE_EPOCHS = 2
MAX_REGION_GRID_TCN_TRAINING_SMOKE_BATCH_SIZE = 4
MAX_REGION_GRID_TCN_TRAINING_SMOKE_TRAIN_BATCHES = 12
MAX_REGION_GRID_TCN_TRAINING_SMOKE_VALIDATION_BATCHES = 8
MAX_M3GU_REDUCED4_TRAINING_SMOKE_EPOCHS = 3
MAX_M3GU_REDUCED4_TRAINING_SMOKE_BATCH_SIZE = 4
MAX_M3GU_REDUCED4_TRAINING_SMOKE_TRAIN_BATCHES = 12
MAX_M3GU_REDUCED4_TRAINING_SMOKE_VALIDATION_BATCHES = 4
MAX_REGION_GRID_TCN_BREV_SMOKE_EPOCHS = 12
MAX_REGION_GRID_TCN_BREV_SMOKE_BATCH_SIZE = 8
MAX_REGION_GRID_TCN_BREV_SMOKE_NUM_WORKERS = 2
# Mission 3CR keeps this local-only and bounded, but tests the predeclared
# longer schedule after the five-epoch M3CJ train-all failed to learn.
MAX_POPSIGN_FRESH5_TRAINING_SMOKE_EPOCHS = 20
MAX_POPSIGN_FRESH5_TRAINING_SMOKE_BATCH_SIZE = 4
MAX_POPSIGN_FRESH5_TRAINING_SMOKE_TRAIN_BATCHES = 32
MAX_POPSIGN_FRESH5_TRAINING_SMOKE_VALIDATION_BATCHES = 32
MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_EPOCHS = 1
MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_BATCH_SIZE = 4
MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_TRAIN_BATCHES = 16
MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_VALIDATION_BATCHES = 16
M3HH_POPSIGN25_FULL_EXPOSURE_LABEL_COUNT = 25
M3HH_POPSIGN25_FULL_EXPOSURE_BATCHES = 157
CONTROLLED_CLIP_HELDOUT_OUTPUT_DIR = (PROJECT_ROOT / "artifacts" / "rawframe-model-clip-heldout").resolve()
CONTROLLED_CLIP_HELDOUT_TRAIN_MANIFEST_RELATIVE = "data/manifests/controlled-pilot-clip-heldout/train.json"
CONTROLLED_CLIP_HELDOUT_VALIDATION_MANIFEST_RELATIVE = "data/manifests/controlled-pilot-clip-heldout/validation.json"
CONTROLLED_CLIP_HELDOUT_TEST_MANIFEST_RELATIVE = "data/manifests/controlled-pilot-clip-heldout/test.json"
FINAL_TRAIN_MANIFEST_REQUIRED_MESSAGE = "final training requires --train-manifest data/manifests/train.json"
FINAL_VALIDATION_MANIFEST_REQUIRED_MESSAGE = "final training requires --validation-manifest data/manifests/validation.json"
FINAL_TEST_MANIFEST_REQUIRED_MESSAGE = "final training requires --test-manifest data/manifests/test.json"
FRAME_MEAN_CNN_ARCHITECTURE = "small_2d_cnn_frame_encoder_with_temporal_mean_pooling"
COMPACT_3D_CNN_ARCHITECTURE = "compact_3d_cnn_spatiotemporal"
COMPACT_3D_CNN_CLIP_NORM_ARCHITECTURE = "compact_3d_cnn_spatiotemporal_clip_norm"
FACTORIZED_3D_CNN_ARCHITECTURE = "factorized_3d_cnn_spatiotemporal"
MOTION_2D_TEMPORAL_CNN_ARCHITECTURE = "motion_2d_temporal_cnn"
TRUE_TEMPORAL_CONVNET_ARCHITECTURE = "true_temporal_convnet_region_grid"
SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE = "scratch_region_temporal_late_fusion_tcn_contract_v1"
SCRATCH_MOTION_REGION_TOKEN_TEMPORAL_ARCHITECTURE = "scratch_motion_region_token_temporal_contract_v1"
DEFAULT_TRAINING_ARCHITECTURE = COMPACT_3D_CNN_ARCHITECTURE
ALLOWED_MODEL_ARCHITECTURES = (
    COMPACT_3D_CNN_ARCHITECTURE,
    COMPACT_3D_CNN_CLIP_NORM_ARCHITECTURE,
    FACTORIZED_3D_CNN_ARCHITECTURE,
    MOTION_2D_TEMPORAL_CNN_ARCHITECTURE,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
    SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
    SCRATCH_MOTION_REGION_TOKEN_TEMPORAL_ARCHITECTURE,
    FRAME_MEAN_CNN_ARCHITECTURE,
)
FINAL_MODEL_ARCHITECTURES = (
    COMPACT_3D_CNN_ARCHITECTURE,
    COMPACT_3D_CNN_CLIP_NORM_ARCHITECTURE,
    FACTORIZED_3D_CNN_ARCHITECTURE,
    MOTION_2D_TEMPORAL_CNN_ARCHITECTURE,
    TRUE_TEMPORAL_CONVNET_ARCHITECTURE,
)
REGION_AWARE_DERIVED_INPUT = "rgb_regions_grid_v1"
POPSIGN_FRESH5_DERIVED_MOTION_TOKENS_INPUT = "popsign_fresh5_rgb_regions_plus_derived_motion_tokens_v1"
REGION_AWARE_DERIVED_INPUT_AXIS = "T,H,W,C"
REGION_AWARE_PRESERVED_INPUT_AXIS = "T,R,H,W,C"
REGION_AWARE_MODEL_INPUT_AXIS = "T,R,C,H,W"
POPSIGN_FRESH5_MOTION_TOKEN_MODEL_INPUT_AXIS = "T,R,C_motion,H,W"
RGB_FRAMES_FALLBACK_INPUT_CONTRACT = "rgb_frames_fallback"
RAWFRAME_DECODE_PROVENANCE_SCHEMA_VERSION = "asl-pilot-rawframe-decode-provenance/v1"
HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION = (
    "asl-pilot-return-to-form-high-signal-region-grid-provenance/v1"
)
ALLOWED_INPUT_CONTRACT_REQUIREMENTS = (
    REGION_AWARE_DERIVED_INPUT,
    RGB_FRAMES_FALLBACK_INPUT_CONTRACT,
)
PROHIBITED_TOKENS = (
    "pretrained",
    "weights",
    "checkpoint",
    "mediapipe",
    "openpose",
    "posenet",
    "bodypix",
    "handpose",
    "yolo",
    "ultralytics",
    "tensorflow-models",
    "mobilenet",
    "resnet",
    "efficientnet",
    "vit",
    "clip",
    "landmark",
    "embedding",
    "feature_extractor",
    "backbone",
)
SAFE_PROVENANCE_KEYS = {
    "allowed_for_model_training",
    "allowed_steps",
    "capture",
    "capture_condition_evidence",
    "capture_count_for_label_split",
    "clip_id",
    "clips",
    "collection_plan",
    "collection_plan_assignment",
    "collection_plan_sha256",
    "consent_record_id",
    "created_at",
    "dataset_id",
    "dataset_source_mode",
    "derived_features",
    "display_text",
    "external_dataset_import",
    "frame_source",
    "frame_tensor_sha256",
    "framing_notes",
    "label_id",
    "label_reviewer",
    "label_review_status",
    "labels",
    "lighting_notes",
    "media_stream_track_settings",
    "evidence",
    "exists",
    "item_count",
    "name",
    "negative_challenge_assignment_count",
    "preprocessing",
    "provenance_owner",
    "relative_frame_tensor_path",
    "relative_video_path",
    "review",
    "reviewer",
    "reviewed_at",
    "role",
    "schema_version",
    "sha256",
    "signer_id",
    "signer_identity_hash",
    "signed_consent_evidence",
    "source_id",
    "source_archive_crc32",
    "source_archive_local_header_offset",
    "source_archive_path",
    "source_gloss",
    "source_license_decision",
    "source_license_review_status",
    "source_record_id",
    "source_register",
    "source_subject_rights_evidence",
    "source_archive_url",
    "source_category",
    "source_file_url",
    "source_host",
    "source_sign_slug",
    "source_split",
    "source_video_path",
    "split",
    "status",
    "assignment",
    "assignment_count",
    "assignment_key",
    "collection_plan_assignment",
    "generated_at",
    "plan_assignment_snapshot",
    "review_gate_status",
    "vocabulary_review",
    "vocabulary_source",
}


class ManifestError(ValueError):
    """Raised when a dataset manifest cannot be used for compliant training."""


class TrainingError(RuntimeError):
    """Raised when validated manifests cannot be trained."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate raw-frame ASL dataset manifests before from-scratch "
            "training. No pretrained components are permitted."
        )
    )
    parser.add_argument(
        "--train-manifest",
        type=Path,
        required=True,
        help="Path to the training split manifest JSON.",
    )
    parser.add_argument(
        "--validation-manifest",
        type=Path,
        required=True,
        help="Path to the signer-disjoint validation split manifest JSON.",
    )
    parser.add_argument(
        "--test-manifest",
        type=Path,
        help="Optional path to a signer-disjoint test split manifest JSON.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/rawframe-model"),
        help="Directory for future model outputs and provenance reports.",
    )
    parser.add_argument(
        "--model-id",
        default="asl-pilot-rawframe-v0",
        help="Model version identifier to include in provenance output.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=20260519,
        help="Random seed for future random initialization.",
    )
    parser.add_argument(
        "--check-files",
        action="store_true",
        help="Also require every relative_video_path to exist and match its SHA-256 hash.",
    )
    parser.add_argument(
        "--allow-small-label-set",
        action="store_true",
        help=(
            "Allow fewer than 75 labels for synthetic wiring tests only. "
            "Use --lesson-milestone for strict real-data 25-sign lesson evidence."
        ),
    )
    parser.add_argument(
        "--lesson-milestone",
        action="store_true",
        help=(
            "Train/evaluate the strict approved-source 25-sign lesson milestone. "
            "This permits 25-40 labels but keeps source, rights review, media, "
            "signer-disjoint, and decode-provenance gates strict."
        ),
    )
    parser.add_argument(
        "--reduced-real-data-module",
        action="store_true",
        help=(
            "Validate the approved seven-label ASL Citizen high-signal module for "
            "no-training --dry-run/--check-files use. This is distinct from "
            "--allow-small-label-set, --lesson-milestone, and final evidence."
        ),
    )
    parser.add_argument(
        "--reduced-real-data-training-smoke",
        action="store_true",
        help=(
            "Run the approved seven-label ASL Citizen high-signal module as a "
            "bounded local training smoke. This preserves strict source, raw media, "
            "tensor/decode, and no-pretrained checks, writes only under output/, "
            "and is not final or lesson milestone evidence."
        ),
    )
    parser.add_argument(
        "--region-grid-tcn-training-smoke",
        action="store_true",
        help=(
            "Run the approved seven-label ASL Citizen high-signal region-grid module "
            "as a bounded true TemporalConvNet smoke. This preserves the rgb_regions "
            "region axis into model input, writes only under output/, and is not final "
            "or lesson milestone evidence."
        ),
    )
    parser.add_argument(
        "--m3gu-reduced4-training-smoke",
        action="store_true",
        help=(
            "Run the Mission 3GU four-label ASL Citizen reduced4 region-grid module "
            "as one capped local true TemporalConvNet diagnostic smoke. This accepts "
            "only the M3GQ reduced4 manifests and output/m3gu-reduced4-local-training-smoke."
        ),
    )
    parser.add_argument(
        "--popsign-fresh5-training-smoke",
        action="store_true",
        help=(
            "Run the approved PopSign fresh5 repaired-manifest module as a tightly "
            "capped scratch region-temporal smoke. This preserves the rgb_regions "
            "region axis into model input, writes only under output/, and is not final "
            "or lesson milestone evidence."
        ),
    )
    parser.add_argument(
        "--popsign-label-ladder-diagnostic",
        action="store_true",
        help=(
            "Validate the existing PopSign diagnostic label-ladder manifests in a "
            "no-training --dry-run/--check-files mode. This is not final, product, "
            "or training authorization evidence."
        ),
    )
    parser.add_argument(
        "--popsign-label-ladder-training-smoke",
        action="store_true",
        help=(
            "Run the approved PopSign label-ladder manifests as a tightly capped "
            "local training/sanity smoke. This keeps the diagnostic flag dry-run-only, "
            "writes only under output/, and is not final, product, or promotion evidence."
        ),
    )
    parser.add_argument(
        "--require-input-contract",
        choices=ALLOWED_INPUT_CONTRACT_REQUIREMENTS,
        help=(
            "No-training audit guard for decoded tensor inputs. Requires --dry-run "
            "and --check-files, then verifies every selected split tensor is either "
            "explicit rgb_frames fallback or the derived rgb_regions_grid_v1 input."
        ),
    )
    parser.add_argument(
        "--controlled-clip-heldout",
        action="store_true",
        help=(
            "Train the documented controlled-pilot clip-heldout fallback. This keeps "
            "75-100 labels, strict source/no-pretrained/decode gates, and approved raw "
            "video provenance, but does not claim signer-disjoint validation."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate manifests and print the training plan without starting training.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Training epochs to run after manifest validation.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=8,
        help="Training batch size.",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=1e-3,
        help="Adam learning rate.",
    )
    parser.add_argument(
        "--optimizer",
        choices=("adam", "adamw"),
        default="adamw",
        help="Optimizer for from-scratch training.",
    )
    parser.add_argument(
        "--weight-decay",
        type=float,
        default=1e-2,
        help="Weight decay used when --optimizer adamw is selected.",
    )
    parser.add_argument(
        "--label-smoothing",
        type=float,
        default=0.0,
        help="Cross-entropy label smoothing for from-scratch training.",
    )
    parser.add_argument(
        "--frame-count",
        type=int,
        default=16,
        help="Number of frames sampled from each decoded clip tensor.",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        default=96,
        help="Square image size used by the raw-frame classifier.",
    )
    parser.add_argument(
        "--training-augmentation",
        choices=("none", "mild", "basic", "strong"),
        default="none",
        help="Raw RGB train-time augmentation policy. Validation and test data are never augmented.",
    )
    parser.add_argument(
        "--checkpoint-selection",
        choices=("final", "best_validation"),
        default="final",
        help="Persist the terminal epoch or the epoch with highest validation accuracy.",
    )
    parser.add_argument(
        "--architecture",
        choices=ALLOWED_MODEL_ARCHITECTURES,
        default=DEFAULT_TRAINING_ARCHITECTURE,
        help=(
            "From-scratch model architecture. Compact, compact clip-normalized, "
            "factorized 3D, motion-temporal 2D CNN, true TemporalConvNet, and "
            "scratch region-temporal late-fusion TCN paths are available; the 2D "
            "temporal-mean baseline remains available for old smoke checkpoints "
            "and wiring comparisons."
        ),
    )
    parser.add_argument(
        "--num-workers",
        type=int,
        default=0,
        help="PyTorch DataLoader worker count.",
    )
    parser.add_argument(
        "--max-train-batches",
        type=int,
        help="Optional training batch cap for smoke runs.",
    )
    parser.add_argument(
        "--max-validation-batches",
        type=int,
        help="Optional validation batch cap for smoke runs.",
    )
    return parser.parse_args()


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ManifestError(f"manifest does not exist: {path}")
    if not path.is_file():
        raise ManifestError(f"manifest path is not a file: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ManifestError(f"manifest is not valid JSON: {path}: {error}") from error
    if not isinstance(data, dict):
        raise ManifestError(f"manifest root must be a JSON object: {path}")
    return data


def require_string(record: dict[str, Any], key: str, context: str) -> str:
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{context} must include non-empty string field: {key}")
    return value


def require_bool(record: dict[str, Any], key: str, context: str) -> bool:
    value = record.get(key)
    if not isinstance(value, bool):
        raise ManifestError(f"{context} must include boolean field: {key}")
    return value


def require_sha256(record: dict[str, Any], key: str, context: str) -> str:
    value = require_string(record, key, context).strip().lower()
    if len(value) != 64 or any(character not in "0123456789abcdef" for character in value):
        raise ManifestError(f"{context} {key} must be a lowercase SHA-256 hex digest")
    return value


def require_crc32(record: dict[str, Any], key: str, context: str) -> str:
    value = require_string(record, key, context).strip().lower()
    if len(value) != 8 or any(character not in "0123456789abcdef" for character in value):
        raise ManifestError(f"{context} {key} must be a lowercase CRC-32 hex digest")
    return value


def require_iso_datetime(value: Any, context: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{context} must be a non-empty ISO-compatible date string")
    try:
        dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ManifestError(f"{context} must be an ISO-compatible date string") from error
    return value


def first_symlinked_project_path_component(path: Path, include_target: bool = True) -> Path | None:
    try:
        relative = path.relative_to(PROJECT_ROOT)
    except ValueError:
        return None
    parts = relative.parts if include_target else relative.parts[:-1]
    current = PROJECT_ROOT
    for part in parts:
        current = current / part
        if current.is_symlink():
            return current
        if not current.exists():
            break
    return None


def verify_project_hash_reference(record: Any, context: str) -> dict[str, Any]:
    if not isinstance(record, dict):
        raise ManifestError(f"{context} must be an object")
    path_value = require_string(record, "path", context)
    expected_hash = require_sha256(record, "sha256", context)
    raw_path = PROJECT_ROOT / path_value
    try:
        raw_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{context}.path escapes project root: {path_value}") from error
    symlinked_ancestor = first_symlinked_project_path_component(raw_path, include_target=False)
    if symlinked_ancestor is not None:
        raise ManifestError(
            f"{context}.path must not include a symbolic link path component: "
            f"{symlinked_ancestor.relative_to(PROJECT_ROOT)}"
        )
    resolved = raw_path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{context}.path escapes project root: {path_value}") from error
    if raw_path.is_symlink():
        raise ManifestError(f"{context}.path must not be a symbolic link: {path_value}")
    if not resolved.exists():
        raise ManifestError(f"{context}.path does not exist: {path_value}")
    if not resolved.is_file():
        raise ManifestError(f"{context}.path must be a file: {path_value}")
    actual_hash = sha256_file(resolved)
    if actual_hash != expected_hash:
        raise ManifestError(
            f"{context}.sha256 mismatch for {path_value}; expected {expected_hash}, got {actual_hash}"
        )
    return {"path": path_value, "sha256": expected_hash, "resolved": resolved}


def validate_external_rights_review(source: dict[str, Any], context: str) -> None:
    review = source.get("external_rights_review")
    if not isinstance(review, dict):
        raise ManifestError(f"{context} is marked allowed without external_rights_review")
    if review.get("status") != "approved_for_this_pilot":
        raise ManifestError(f"{context} external_rights_review.status must be approved_for_this_pilot")
    if review.get("is_project_operator") is not False:
        raise ManifestError(f"{context} external_rights_review.is_project_operator must be false")
    scope = review.get("decision_scope")
    if not isinstance(scope, dict):
        raise ManifestError(f"{context} external_rights_review.decision_scope must be an object")
    for key in [
        "allowed_for_model_training",
        "allowed_for_validation",
        "allowed_for_pilot_submission",
    ]:
        if scope.get(key) != source.get(key):
            raise ManifestError(f"{context} external_rights_review.decision_scope.{key} must match source.{key}")
    receipt = verify_project_hash_reference(
        review.get("review_receipt"),
        f"{context} external_rights_review.review_receipt",
    )
    if receipt["resolved"].suffix.lower() == ".json":
        try:
            receipt_json = json.loads(receipt["resolved"].read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise ManifestError(f"{context} external_rights_review.review_receipt is not valid JSON: {error}") from error
        if receipt_json.get("schema_version") != "asl-pilot-external-rights-review-receipt/v1":
            raise ManifestError(f"{context} external_rights_review.review_receipt schema_version is invalid")
        if receipt_json.get("source_id") != source.get("source_id"):
            raise ManifestError(f"{context} external_rights_review.review_receipt source_id must match source_id")
        if receipt_json.get("decision_id") != source.get("decision_id"):
            raise ManifestError(f"{context} external_rights_review.review_receipt decision_id must match decision_id")
    evidence_files = review.get("license_evidence_files")
    if not isinstance(evidence_files, list) or not evidence_files:
        raise ManifestError(f"{context} external_rights_review.license_evidence_files must be non-empty")
    for index, evidence in enumerate(evidence_files):
        verify_project_hash_reference(
            evidence,
            f"{context} external_rights_review.license_evidence_files[{index}]",
        )


def resolve_manifest_relative_path(manifest_path: Path, value: str, context: str, field: str) -> Path:
    relative_path = Path(value)
    if relative_path.is_absolute():
        raise ManifestError(f"{context} {field} must be relative, got absolute path: {value}")
    resolved = (manifest_path.parent / relative_path).resolve()
    try:
        resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{context} {field} escapes the project root: {value}") from error
    return resolved


def resolve_training_relative_path(manifest_path: Path, value: str, context: str, field: str) -> Path:
    try:
        return resolve_manifest_relative_path(manifest_path, value, context, field)
    except ManifestError as error:
        raise TrainingError(str(error)) from error


def validate_source_register(
    data: dict[str, Any],
    manifest_path: Path,
    allow_small_label_set: bool,
) -> dict[str, dict[str, Any]]:
    reference = data.get("source_register")
    if allow_small_label_set and reference is None:
        return {}
    if not isinstance(reference, dict):
        raise ManifestError(f"{manifest_path}: source_register must be an object")
    register_path_value = require_string(reference, "path", f"{manifest_path}: source_register")
    expected_hash = require_sha256(reference, "sha256", f"{manifest_path}: source_register")
    register_path = (PROJECT_ROOT / register_path_value).resolve()
    try:
        register_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{manifest_path}: source_register.path escapes project root") from error
    if not register_path.exists():
        raise ManifestError(f"{manifest_path}: source register does not exist: {register_path_value}")
    actual_hash = sha256_file(register_path)
    if actual_hash != expected_hash:
        raise ManifestError(
            f"{manifest_path}: source_register.sha256 mismatch; expected {expected_hash}, got {actual_hash}"
        )
    try:
        register = json.loads(register_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ManifestError(f"{manifest_path}: source register is invalid JSON: {error}") from error
    if register.get("schema_version") != EXPECTED_SOURCE_REGISTER_SCHEMA:
        raise ManifestError(
            f"{manifest_path}: source register schema_version must be {EXPECTED_SOURCE_REGISTER_SCHEMA!r}"
        )
    sources = register.get("sources")
    if not isinstance(sources, list):
        raise ManifestError(f"{manifest_path}: source register sources must be an array")
    decisions: dict[str, dict[str, Any]] = {}
    decision_ids: set[str] = set()
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            raise ManifestError(f"{manifest_path}: source register sources[{index}] must be an object")
        source_id = require_string(source, "source_id", f"{manifest_path}: source register sources[{index}]")
        if source_id in decisions:
            raise ManifestError(f"{manifest_path}: duplicate source register source_id: {source_id}")
        decision_id = require_string(source, "decision_id", f"{manifest_path}: source register sources[{index}]")
        if decision_id in decision_ids:
            raise ManifestError(f"{manifest_path}: duplicate source register decision_id: {decision_id}")
        decision_ids.add(decision_id)
        source_kind = require_string(source, "source_kind", f"{manifest_path}: source register sources[{index}]")
        if source_kind not in ALLOWED_SOURCE_KINDS:
            raise ManifestError(
                f"{manifest_path}: source register source_kind for {source_id} must be one of "
                f"{sorted(ALLOWED_SOURCE_KINDS)}"
            )
        if source_kind == "first_party_collection" and source_id not in FIRST_PARTY_SOURCE_IDS:
            raise ManifestError(
                f"{manifest_path}: source register {source_id} is not in the explicit first-party allowlist"
            )
        any_allowed = any(
            source.get(key) is True
            for key in [
                "allowed_for_model_training",
                "allowed_for_validation",
                "allowed_for_pilot_submission",
            ]
        )
        if any_allowed and source_id not in FIRST_PARTY_SOURCE_IDS:
            validate_external_rights_review(source, f"{manifest_path}: source register {source_id}")
        decisions[source_id] = source
    return decisions


def dataset_source_mode_for(data: dict[str, Any], manifest_path: Path) -> str:
    mode = data.get("dataset_source_mode", FIRST_PARTY_DATASET_SOURCE_MODE)
    if mode not in DATASET_SOURCE_MODES:
        raise ManifestError(
            f"{manifest_path}: dataset_source_mode must be one of {sorted(DATASET_SOURCE_MODES)}"
        )
    return str(mode)


def validate_external_dataset_import(
    data: dict[str, Any],
    manifest_path: Path,
    source_decisions: dict[str, dict[str, Any]],
    allow_small_label_set: bool,
    require_model_training: bool = True,
) -> dict[str, Any] | None:
    if dataset_source_mode_for(data, manifest_path) != EXTERNAL_DATASET_SOURCE_MODE:
        return None
    reference = data.get("external_dataset_import")
    if allow_small_label_set and reference is None:
        return None
    if not isinstance(reference, dict):
        raise ManifestError(f"{manifest_path}: external_dataset_import must be an object")
    source_id = require_string(reference, "source_id", f"{manifest_path}: external_dataset_import")
    source = source_decisions.get(source_id)
    if not source:
        raise ManifestError(f"{manifest_path}: external_dataset_import.source_id is not present in source register")
    if source.get("source_kind") not in EXTERNAL_SOURCE_KINDS:
        raise ManifestError(f"{manifest_path}: external_dataset_import.source_id must be an external/public source")
    if source.get("allowed_for_validation") is not True:
        raise ManifestError(f"{manifest_path}: external_dataset_import.source_id must be allowed for validation")
    if require_model_training and source.get("allowed_for_model_training") is not True:
        raise ManifestError(f"{manifest_path}: external_dataset_import.source_id must be allowed for model training")
    source_audit = verify_project_hash_reference(
        reference.get("source_audit"),
        f"{manifest_path}: external_dataset_import.source_audit",
    )
    if source_audit["resolved"].suffix.lower() == ".json":
        try:
            audit_json = json.loads(source_audit["resolved"].read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise ManifestError(f"{manifest_path}: external_dataset_import.source_audit is not valid JSON: {error}") from error
        if audit_json.get("source_id") != source_id:
            raise ManifestError(f"{manifest_path}: external_dataset_import.source_audit source_id mismatch")
        if audit_json.get("status") not in {"passed", "ready_to_download"}:
            raise ManifestError(f"{manifest_path}: external_dataset_import.source_audit status is not accepted")
    return reference


def validate_consent_form(
    data: dict[str, Any],
    manifest_path: Path,
    allow_small_label_set: bool,
) -> dict[str, Any] | None:
    if dataset_source_mode_for(data, manifest_path) == EXTERNAL_DATASET_SOURCE_MODE:
        return None
    reference = data.get("consent_form")
    if allow_small_label_set and reference is None:
        return None
    if not isinstance(reference, dict):
        raise ManifestError(f"{manifest_path}: consent_form must be an object")
    consent_path_value = require_string(reference, "path", f"{manifest_path}: consent_form")
    if consent_path_value != EXPECTED_CONSENT_FORM_PATH:
        raise ManifestError(
            f"{manifest_path}: consent_form.path must be {EXPECTED_CONSENT_FORM_PATH!r}"
        )
    consent_version = require_string(reference, "consent_version", f"{manifest_path}: consent_form")
    if consent_version != EXPECTED_CONSENT_VERSION:
        raise ManifestError(
            f"{manifest_path}: consent_form.consent_version must be {EXPECTED_CONSENT_VERSION!r}"
        )
    expected_hash = require_sha256(reference, "sha256", f"{manifest_path}: consent_form")
    consent_path = (PROJECT_ROOT / consent_path_value).resolve()
    try:
        consent_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{manifest_path}: consent_form.path escapes project root") from error
    if not consent_path.exists():
        raise ManifestError(f"{manifest_path}: consent form does not exist: {consent_path_value}")
    actual_hash = sha256_file(consent_path)
    if actual_hash != expected_hash:
        raise ManifestError(
            f"{manifest_path}: consent_form.sha256 mismatch; expected {expected_hash}, got {actual_hash}"
        )
    return reference


def validate_signed_by(record: Any, context: str) -> None:
    if not isinstance(record, dict):
        raise ManifestError(f"{context} must be an object")
    for key in ("name", "role", "affiliation_or_context", "contact_or_signature_reference"):
        value = record.get(key)
        if (
            not isinstance(value, str)
            or not value.strip()
            or re.search(r"\b(replace|placeholder|todo|tbd|yyyy)\b", value, re.IGNORECASE)
        ):
            raise ManifestError(f"{context}.{key} must be a non-placeholder string")
    if record.get("is_project_operator") is not False:
        raise ManifestError(f"{context}.is_project_operator must be false")


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def canonical_signed_consent_receipt_payload(receipt: dict[str, Any]) -> str:
    consent_record_ids = receipt.get("consent_record_ids")
    return stable_json({
        "schema_version": receipt.get("schema_version"),
        "status": receipt.get("status"),
        "signer_alias": receipt.get("signer_alias"),
        "signer_identity_hash": receipt.get("signer_identity_hash"),
        "consent_record_ids": sorted(consent_record_ids) if isinstance(consent_record_ids, list) else [],
        "consent_form": receipt.get("consent_form"),
        "confirmed_consent_flags": receipt.get("confirmed_consent_flags"),
        "signed_at": receipt.get("signed_at"),
        "signed_by": receipt.get("signed_by"),
    })


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def openssl_public_key_der(public_key_pem: str, context: str) -> bytes:
    result = subprocess.run(
        ["openssl", "pkey", "-pubin", "-outform", "DER"],
        input=public_key_pem.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0 or not result.stdout:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise ManifestError(f"{context}.signature_evidence.public_key_pem is invalid: {stderr or 'openssl pkey failed'}")
    return result.stdout


def verify_ed25519_signature(payload: str, public_key_pem: str, signature_base64: str, context: str) -> None:
    try:
        signature = base64.b64decode(signature_base64, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ManifestError(f"{context}.signature_evidence.signature_base64 must be base64") from error
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        payload_path = tmp_path / "payload.txt"
        public_key_path = tmp_path / "public-key.pem"
        signature_path = tmp_path / "signature.bin"
        payload_path.write_text(payload, encoding="utf-8")
        public_key_path.write_text(public_key_pem, encoding="utf-8")
        signature_path.write_bytes(signature)
        result = subprocess.run(
            [
                "openssl",
                "pkeyutl",
                "-verify",
                "-pubin",
                "-inkey",
                str(public_key_path),
                "-rawin",
                "-in",
                str(payload_path),
                "-sigfile",
                str(signature_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise ManifestError(f"{context}.signature_evidence signature verification failed: {stderr or 'openssl pkeyutl failed'}")


def validate_signed_receipt_signature(receipt: dict[str, Any], context: str) -> None:
    signature = receipt.get("signature_evidence")
    if not isinstance(signature, dict):
        raise ManifestError(f"{context}.signature_evidence must be an object")
    if signature.get("algorithm") != EXPECTED_RECEIPT_SIGNATURE_ALGORITHM:
        raise ManifestError(
            f"{context}.signature_evidence.algorithm must be {EXPECTED_RECEIPT_SIGNATURE_ALGORITHM}"
        )
    public_key_pem = signature.get("public_key_pem")
    if not isinstance(public_key_pem, str) or "BEGIN PUBLIC KEY" not in public_key_pem:
        raise ManifestError(f"{context}.signature_evidence.public_key_pem must be a PEM public key")
    public_key_der = openssl_public_key_der(public_key_pem, context)
    expected_key_fingerprint = hashlib.sha256(public_key_der).hexdigest()
    if signature.get("signer_key_fingerprint_sha256") != expected_key_fingerprint:
        raise ManifestError(f"{context}.signature_evidence.signer_key_fingerprint_sha256 must match public_key_pem")
    signature_base64 = signature.get("signature_base64")
    if not isinstance(signature_base64, str) or not signature_base64.strip():
        raise ManifestError(f"{context}.signature_evidence.signature_base64 must be base64")
    payload = canonical_signed_consent_receipt_payload(receipt)
    if signature.get("signed_payload_sha256") != sha256_text(payload):
        raise ManifestError(
            f"{context}.signature_evidence.signed_payload_sha256 must match the canonical signed consent receipt payload"
        )
    verify_ed25519_signature(payload, public_key_pem, signature_base64, context)


def validate_signed_consent_evidence(
    clip: dict[str, Any],
    context: str,
    signer_identity_hash: str,
    consent_record_id: str,
) -> dict[str, Any]:
    reference = verify_project_hash_reference(
        clip.get("signed_consent_evidence"),
        f"{context} signed_consent_evidence",
    )
    if reference["resolved"].suffix.lower() != ".json":
        raise ManifestError(f"{context} signed_consent_evidence.path must point to a JSON receipt")
    try:
        receipt = json.loads(reference["resolved"].read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ManifestError(f"{context} signed_consent_evidence receipt is not valid JSON: {error}") from error
    if not isinstance(receipt, dict):
        raise ManifestError(f"{context} signed_consent_evidence receipt must be a JSON object")
    unexpected_fields = sorted(set(receipt) - EXPECTED_SIGNED_CONSENT_RECEIPT_FIELDS)
    if unexpected_fields:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt contains unexpected unsigned field: "
            f"{unexpected_fields[0]}"
        )
    if receipt.get("schema_version") != EXPECTED_SIGNED_CONSENT_RECEIPT_SCHEMA:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt schema_version must be "
            f"{EXPECTED_SIGNED_CONSENT_RECEIPT_SCHEMA!r}"
        )
    if receipt.get("status") != "signed":
        raise ManifestError(f"{context} signed_consent_evidence receipt status must be signed")
    if receipt.get("signer_alias") != clip.get("signer_id"):
        raise ManifestError(f"{context} signed_consent_evidence receipt signer_alias must match signer_id")
    if receipt.get("signer_identity_hash") != signer_identity_hash:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt signer_identity_hash must match clip signer_identity_hash"
        )
    consent_record_ids = receipt.get("consent_record_ids")
    if not isinstance(consent_record_ids, list) or not all(isinstance(item, str) and item.strip() for item in consent_record_ids):
        raise ManifestError(f"{context} signed_consent_evidence receipt consent_record_ids must be a non-empty string array")
    if len(set(consent_record_ids)) != len(consent_record_ids):
        raise ManifestError(f"{context} signed_consent_evidence receipt consent_record_ids must not contain duplicates")
    if consent_record_id not in consent_record_ids:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt consent_record_ids must include {consent_record_id}"
        )
    consent_form = receipt.get("consent_form")
    if not isinstance(consent_form, dict):
        raise ManifestError(f"{context} signed_consent_evidence receipt consent_form must be an object")
    if consent_form.get("path") != EXPECTED_CONSENT_FORM_PATH:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt consent_form.path must be {EXPECTED_CONSENT_FORM_PATH!r}"
        )
    if consent_form.get("consent_version") != EXPECTED_CONSENT_VERSION:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt consent_form.consent_version must be {EXPECTED_CONSENT_VERSION!r}"
        )
    expected_hash = require_sha256(consent_form, "sha256", f"{context} signed_consent_evidence receipt consent_form")
    actual_hash = sha256_file(PROJECT_ROOT / EXPECTED_CONSENT_FORM_PATH)
    if actual_hash != expected_hash:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt consent_form.sha256 mismatch; "
            f"expected {expected_hash}, got {actual_hash}"
        )
    confirmed = receipt.get("confirmed_consent_flags")
    if not isinstance(confirmed, dict):
        raise ManifestError(f"{context} signed_consent_evidence receipt confirmed_consent_flags must be an object")
    for key in (
        "age_eligible",
        "allow_model_training",
        "allow_validation",
        "allow_pilot_use",
        "allow_derived_artifact_retention",
        "allow_deidentified_metadata_retention",
        "retention_acknowledged",
        "withdrawal_acknowledged",
    ):
        if confirmed.get(key) is not True:
            raise ManifestError(f"{context} signed_consent_evidence receipt confirmed_consent_flags.{key} must be true")
    if confirmed.get("raw_clip_redistribution_without_separate_permission") is not False:
        raise ManifestError(
            f"{context} signed_consent_evidence receipt confirmed_consent_flags."
            "raw_clip_redistribution_without_separate_permission must be false"
        )
    require_iso_datetime(receipt.get("signed_at"), f"{context} signed_consent_evidence receipt signed_at")
    validate_signed_by(receipt.get("signed_by"), f"{context} signed_consent_evidence receipt signed_by")
    validate_signed_receipt_signature(receipt, f"{context} signed_consent_evidence receipt")
    return {
        "path": reference["path"],
        "sha256": reference["sha256"],
    }


def validate_vocabulary_review(
    data: dict[str, Any],
    manifest_path: Path,
    allow_small_label_set: bool,
    ordered_label_ids: list[str] | None = None,
    allow_reviewed_label_subset: bool = False,
    allow_missing_for_popsign_label_ladder: bool = False,
) -> dict[str, Any] | None:
    reference = data.get("vocabulary_review")
    if (allow_small_label_set or allow_missing_for_popsign_label_ladder) and reference is None:
        return None
    if not isinstance(reference, dict):
        raise ManifestError(f"{manifest_path}: vocabulary_review must be an object")
    status = require_string(reference, "status", f"{manifest_path}: vocabulary_review")
    if status not in ACCEPTED_VOCABULARY_REVIEW_STATUSES:
        raise ManifestError(
            f"{manifest_path}: vocabulary_review.status must be reviewed or source_curated"
        )

    evidence = reference.get("evidence")
    if not isinstance(evidence, dict):
        raise ManifestError(f"{manifest_path}: vocabulary_review.evidence must be an object")
    evidence_path_value = require_string(
        evidence,
        "path",
        f"{manifest_path}: vocabulary_review.evidence",
    )
    expected_evidence_hash = require_sha256(
        evidence,
        "sha256",
        f"{manifest_path}: vocabulary_review.evidence",
    )
    evidence_path = (PROJECT_ROOT / evidence_path_value).resolve()
    try:
        evidence_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{manifest_path}: vocabulary_review.evidence.path escapes project root") from error
    if not evidence_path.exists():
        raise ManifestError(
            f"{manifest_path}: vocabulary review evidence does not exist: {evidence_path_value}"
        )
    actual_evidence_hash = sha256_file(evidence_path)
    if actual_evidence_hash != expected_evidence_hash:
        raise ManifestError(
            f"{manifest_path}: vocabulary_review.evidence.sha256 mismatch; "
            f"expected {expected_evidence_hash}, got {actual_evidence_hash}"
        )

    vocabulary_source = reference.get("vocabulary_source")
    if not isinstance(vocabulary_source, dict):
        raise ManifestError(f"{manifest_path}: vocabulary_review.vocabulary_source must be an object")
    source_path_value = require_string(
        vocabulary_source,
        "path",
        f"{manifest_path}: vocabulary_review.vocabulary_source",
    )
    expected_source_hash = require_sha256(
        vocabulary_source,
        "sha256",
        f"{manifest_path}: vocabulary_review.vocabulary_source",
    )
    item_count = vocabulary_source.get("item_count")
    if not isinstance(item_count, int) or item_count <= 0:
        raise ManifestError(
            f"{manifest_path}: vocabulary_review.vocabulary_source.item_count must be a positive integer"
        )
    source_path = (PROJECT_ROOT / source_path_value).resolve()
    try:
        source_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(
            f"{manifest_path}: vocabulary_review.vocabulary_source.path escapes project root"
        ) from error
    if not source_path.exists():
        raise ManifestError(
            f"{manifest_path}: vocabulary source does not exist: {source_path_value}"
        )
    actual_source_hash = sha256_file(source_path)
    if actual_source_hash != expected_source_hash:
        raise ManifestError(
            f"{manifest_path}: vocabulary_review.vocabulary_source.sha256 mismatch; "
            f"expected {expected_source_hash}, got {actual_source_hash}"
        )

    try:
        evidence_data = json.loads(evidence_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ManifestError(f"{manifest_path}: vocabulary review evidence is invalid JSON: {error}") from error
    if not isinstance(evidence_data, dict):
        raise ManifestError(f"{manifest_path}: vocabulary review evidence root must be an object")
    if evidence_data.get("schema_version") != EXPECTED_VOCABULARY_REVIEW_SCHEMA:
        raise ManifestError(
            f"{manifest_path}: vocabulary review evidence schema_version must be "
            f"{EXPECTED_VOCABULARY_REVIEW_SCHEMA!r}"
        )
    if evidence_data.get("status") not in ACCEPTED_VOCABULARY_REVIEW_STATUSES:
        raise ManifestError(
            f"{manifest_path}: vocabulary review evidence status must be reviewed or source_curated"
        )
    if evidence_data.get("item_count") != item_count:
        raise ManifestError(f"{manifest_path}: vocabulary review evidence item_count mismatch")
    if evidence_data.get("vocabulary_source", {}).get("sha256") != expected_source_hash:
        raise ManifestError(
            f"{manifest_path}: vocabulary review evidence vocabulary_source.sha256 mismatch"
        )
    approved_ids = evidence_data.get("approved_item_ids")
    if not isinstance(approved_ids, list) or not all(isinstance(item, str) for item in approved_ids):
        raise ManifestError(f"{manifest_path}: vocabulary review approved_item_ids must be a string array")
    if ordered_label_ids is not None and approved_ids != ordered_label_ids:
        labels_are_reviewed_subset = (allow_small_label_set or allow_reviewed_label_subset) and all(
            label_id in approved_ids for label_id in ordered_label_ids
        )
        if not labels_are_reviewed_subset:
            raise ManifestError(
                f"{manifest_path}: vocabulary review approved_item_ids must match manifest labels in order"
            )
    if len(approved_ids) != item_count:
        raise ManifestError(f"{manifest_path}: vocabulary review approved_item_ids count mismatch")

    return reference


def validate_collection_plan(
    data: dict[str, Any],
    manifest_path: Path,
    allow_small_label_set: bool,
) -> dict[str, Any] | None:
    if dataset_source_mode_for(data, manifest_path) == EXTERNAL_DATASET_SOURCE_MODE:
        return None
    reference = data.get("collection_plan")
    if allow_small_label_set and reference is None:
        return None
    if not isinstance(reference, dict):
        raise ManifestError(f"{manifest_path}: collection_plan must be an object")
    plan_path_value = require_string(reference, "path", f"{manifest_path}: collection_plan")
    if plan_path_value != EXPECTED_COLLECTION_PLAN_PATH:
        raise ManifestError(
            f"{manifest_path}: collection_plan.path must be {EXPECTED_COLLECTION_PLAN_PATH!r}"
        )
    expected_hash = require_sha256(reference, "sha256", f"{manifest_path}: collection_plan")
    plan_path = (PROJECT_ROOT / plan_path_value).resolve()
    try:
        plan_path.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"{manifest_path}: collection_plan.path escapes project root") from error
    if not plan_path.exists():
        raise ManifestError(f"{manifest_path}: collection plan does not exist: {plan_path_value}")
    actual_hash = sha256_file(plan_path)
    if actual_hash != expected_hash:
        raise ManifestError(
            f"{manifest_path}: collection_plan.sha256 mismatch; expected {expected_hash}, got {actual_hash}"
        )
    try:
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ManifestError(f"{manifest_path}: collection plan is invalid JSON: {error}") from error
    if plan.get("schema_version") != "asl-pilot-dataset-collection-plan/v1":
        raise ManifestError(f"{manifest_path}: collection plan schema_version is invalid")
    if plan.get("review_gate", {}).get("status") not in ACCEPTED_VOCABULARY_REVIEW_STATUSES:
        raise ManifestError(
            f"{manifest_path}: collection plan review_gate.status must be reviewed or source_curated"
        )
    if plan.get("warnings") not in ([], None):
        raise ManifestError(f"{manifest_path}: collection plan warnings must be resolved")
    if reference.get("review_gate_status") not in ACCEPTED_VOCABULARY_REVIEW_STATUSES:
        raise ManifestError(
            f"{manifest_path}: collection_plan.review_gate_status must be reviewed or source_curated"
        )
    for key in ("assignment_count", "negative_challenge_assignment_count"):
        if not isinstance(reference.get(key), int) or reference[key] < 0:
            raise ManifestError(f"{manifest_path}: collection_plan.{key} must be a non-negative integer")
    return reference


def validate_collection_plan_assignment(
    clip: dict[str, Any],
    context: str,
    collection_plan: dict[str, Any] | None,
    kind: str,
) -> None:
    reference = clip.get("collection_plan_assignment")
    if not isinstance(reference, dict):
        raise ManifestError(f"{context} collection_plan_assignment must be an object")
    assignment_key = require_string(reference, "assignment_key", f"{context}.collection_plan_assignment")
    expected_prefix = "negative_challenge:" if kind == "negative_challenge" else "vocabulary:"
    if not assignment_key.startswith(expected_prefix):
        raise ManifestError(
            f"{context} collection_plan_assignment.assignment_key must start with {expected_prefix!r}"
        )
    plan_hash = require_sha256(
        reference,
        "collection_plan_sha256",
        f"{context}.collection_plan_assignment",
    )
    if collection_plan is not None and plan_hash != collection_plan.get("sha256"):
        raise ManifestError(
            f"{context} collection_plan_assignment.collection_plan_sha256 must match collection_plan.sha256"
        )
    snapshot = reference.get("assignment")
    if not isinstance(snapshot, dict):
        raise ManifestError(f"{context} collection_plan_assignment.assignment must be an object")
    if snapshot.get("assignment_key") != assignment_key:
        raise ManifestError(
            f"{context} collection_plan_assignment.assignment.assignment_key must match assignment_key"
        )
    if snapshot.get("signer_alias") != clip.get("signer_id"):
        raise ManifestError(
            f"{context} collection_plan_assignment.assignment.signer_alias must match signer_id"
        )
    if kind == "vocabulary":
        if snapshot.get("split") != clip.get("split"):
            raise ManifestError(f"{context} collection plan assignment split must match clip split")
        if snapshot.get("label_id") != clip.get("label_id"):
            raise ManifestError(f"{context} collection plan assignment label_id must match clip label_id")
        if not isinstance(snapshot.get("display_text"), str) or not snapshot["display_text"].strip():
            raise ManifestError(f"{context} collection plan assignment display_text must be non-empty")
        if not isinstance(snapshot.get("capture_count_for_label_split"), int):
            raise ManifestError(
                f"{context} collection plan assignment capture_count_for_label_split must be an integer"
            )
    else:
        if snapshot.get("split") != "negative_challenge":
            raise ManifestError(f"{context} collection plan assignment split must be negative_challenge")
        if snapshot.get("challenge_type") != clip.get("challenge_type"):
            raise ManifestError(
                f"{context} collection plan assignment challenge_type must match clip challenge_type"
            )
        if snapshot.get("expected_outcome") != "reject":
            raise ManifestError(f"{context} collection plan assignment expected_outcome must be reject")
        if not isinstance(snapshot.get("capture_count_for_type"), int):
            raise ManifestError(
                f"{context} collection plan assignment capture_count_for_type must be an integer"
            )


def validate_capture_condition_evidence(
    clip: dict[str, Any],
    context: str,
    kind: str,
) -> None:
    capture = clip.get("capture")
    if not isinstance(capture, dict):
        raise ManifestError(f"{context} capture must be an object")
    evidence = capture.get("capture_condition_evidence")
    if not isinstance(evidence, dict):
        raise ManifestError(f"{context} capture.capture_condition_evidence must be an object")
    if evidence.get("schemaVersion") != EXPECTED_CAPTURE_CONDITION_SCHEMA:
        raise ManifestError(
            f"{context} capture.capture_condition_evidence.schemaVersion must be "
            f"{EXPECTED_CAPTURE_CONDITION_SCHEMA!r}"
        )
    if evidence.get("operatorAttestation") is not True:
        raise ManifestError(f"{context} capture.capture_condition_evidence.operatorAttestation must be true")
    operator_attested_at = evidence.get("operatorAttestedAt")
    if not isinstance(operator_attested_at, str) or not operator_attested_at.strip():
        raise ManifestError(f"{context} capture.capture_condition_evidence.operatorAttestedAt must be non-empty")
    try:
        dt.datetime.fromisoformat(operator_attested_at.replace("Z", "+00:00"))
    except ValueError as error:
        raise ManifestError(
            f"{context} capture.capture_condition_evidence.operatorAttestedAt must be ISO-compatible"
        ) from error

    vocabulary_fields = (
        "frontLightingConfirmed",
        "upperTorsoAndHandsVisibleConfirmed",
        "cameraDistanceWithinPilotRangeConfirmed",
        "isolatedPromptSignConfirmed",
    )
    challenge_fields = CORE_NEGATIVE_CHALLENGE_FIELDS
    for key in (
        *vocabulary_fields,
        *challenge_fields.values(),
        "expectedRejectOutcomeConfirmed",
    ):
        if not isinstance(evidence.get(key), bool):
            raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be boolean")

    if kind == "vocabulary":
        if evidence.get("captureEnvironment") != "controlled_vocabulary":
            raise ManifestError(
                f"{context} capture.capture_condition_evidence.captureEnvironment must be controlled_vocabulary"
            )
        for key in vocabulary_fields:
            if evidence.get(key) is not True:
                raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be true")
        for key in challenge_fields.values():
            if evidence.get(key) is not False:
                raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be false")
        if evidence.get("challengeType") is not None:
            raise ManifestError(f"{context} capture.capture_condition_evidence.challengeType must be null")
        if evidence.get("expectedRejectOutcomeConfirmed") is not False:
            raise ManifestError(
                f"{context} capture.capture_condition_evidence.expectedRejectOutcomeConfirmed must be false"
            )
        return

    challenge_type = clip.get("challenge_type")
    challenge_field = challenge_fields.get(str(challenge_type))
    is_extended_hard_negative = str(challenge_type) in EXTENDED_HARD_NEGATIVE_TYPES
    if challenge_field is None and not is_extended_hard_negative:
        raise ManifestError(f"{context} challenge_type is not supported for capture-condition evidence")
    if evidence.get("captureEnvironment") != "negative_challenge":
        raise ManifestError(
            f"{context} capture.capture_condition_evidence.captureEnvironment must be negative_challenge"
        )
    if evidence.get("challengeType") != challenge_type:
        raise ManifestError(f"{context} capture.capture_condition_evidence.challengeType must match challenge_type")
    if evidence.get("expectedRejectOutcomeConfirmed") is not True:
        raise ManifestError(
            f"{context} capture.capture_condition_evidence.expectedRejectOutcomeConfirmed must be true"
        )
    for key in vocabulary_fields:
        if evidence.get(key) is not False:
            raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be false")
    if challenge_field is not None:
        if evidence.get("hardNegativeConditionConfirmed") is not False:
            raise ManifestError(
                f"{context} capture.capture_condition_evidence.hardNegativeConditionConfirmed must be false"
            )
        for expected_type, key in challenge_fields.items():
            expected = expected_type == challenge_type
            if evidence.get(key) is not expected:
                raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be {expected}")
    else:
        if evidence.get("hardNegativeConditionConfirmed") is not True:
            raise ManifestError(
                f"{context} capture.capture_condition_evidence.hardNegativeConditionConfirmed must be true"
            )
        for key in challenge_fields.values():
            if evidence.get(key) is not False:
                raise ManifestError(f"{context} capture.capture_condition_evidence.{key} must be false")


def contains_token(text: str, token: str) -> bool:
    if token == "clip":
        return (
            re.search(
                r"(^|[^a-z0-9])(openai[-_ ]*)?clip([^a-z0-9]*(vit|model|encoder|backbone|pretrained|weights)|$)",
                text,
            )
            is not None
        )
    return token in text


def contains_prohibited_token(value: Any) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if isinstance(key, str) and key not in SAFE_PROVENANCE_KEYS:
                lowered_key = key.lower()
                for token in PROHIBITED_TOKENS:
                    if contains_token(lowered_key, token):
                        return token
            child_token = contains_prohibited_token(child)
            if child_token:
                return child_token
        return None
    if isinstance(value, list):
        for child in value:
            child_token = contains_prohibited_token(child)
            if child_token:
                return child_token
        return None
    if not isinstance(value, str):
        return None
    text = value.lower()
    for token in PROHIBITED_TOKENS:
        if contains_token(text, token):
            return token
    return None


def validate_labels(
    labels: Any,
    path: Path,
    allow_small_label_set: bool,
    allow_lesson_label_set: bool = False,
    allow_reduced_real_data_label_set: bool = False,
    allow_m3gu_reduced4_label_set: bool = False,
    allow_popsign_fresh5_label_set: bool = False,
    allow_popsign_label_ladder_set: bool = False,
) -> set[str]:
    if not isinstance(labels, list) or not labels:
        raise ManifestError(f"{path}: labels must be a non-empty array")
    if allow_popsign_label_ladder_set and not allow_small_label_set:
        if len(labels) not in POPSIGN_LABEL_LADDER_LABEL_COUNTS:
            allowed = ", ".join(str(value) for value in POPSIGN_LABEL_LADDER_LABEL_COUNTS)
            raise ManifestError(
                f"{path}: PopSign label-ladder diagnostic manifests must include one of "
                f"{allowed} labels; found {len(labels)}."
            )
    elif allow_popsign_fresh5_label_set and not allow_small_label_set:
        if len(labels) != len(POPSIGN_FRESH5_REPAIRED_LABEL_IDS):
            raise ManifestError(
                f"{path}: PopSign fresh5 repaired manifests must include exactly "
                f"{len(POPSIGN_FRESH5_REPAIRED_LABEL_IDS)} labels; found {len(labels)}."
            )
    elif allow_m3gu_reduced4_label_set and not allow_small_label_set:
        if len(labels) != len(M3GQ_REDUCED4_LABEL_IDS):
            raise ManifestError(
                f"{path}: M3GU reduced4 manifests must include exactly "
                f"{len(M3GQ_REDUCED4_LABEL_IDS)} labels; found {len(labels)}."
            )
    elif allow_reduced_real_data_label_set and not allow_small_label_set:
        if not (MIN_REDUCED_REAL_DATA_LABELS <= len(labels) <= MAX_REDUCED_REAL_DATA_LABELS):
            raise ManifestError(
                f"{path}: reduced real-data manifests must include "
                f"{MIN_REDUCED_REAL_DATA_LABELS}-{MAX_REDUCED_REAL_DATA_LABELS} labels; "
                f"found {len(labels)}. This mode is distinct from --allow-small-label-set."
            )
    elif allow_lesson_label_set and not allow_small_label_set:
        if not (MIN_LESSON_MILESTONE_LABELS <= len(labels) <= MAX_LESSON_MILESTONE_LABELS):
            raise ManifestError(
                f"{path}: lesson milestone manifests must include "
                f"{MIN_LESSON_MILESTONE_LABELS}-{MAX_LESSON_MILESTONE_LABELS} labels; "
                f"found {len(labels)}. Use --allow-small-label-set only for synthetic wiring tests."
            )
    elif not allow_small_label_set and not (MIN_LABELS <= len(labels) <= MAX_LABELS):
        raise ManifestError(
            f"{path}: final manifests must include {MIN_LABELS}-{MAX_LABELS} labels; "
            f"found {len(labels)}. Use --lesson-milestone for strict 25-sign lesson evidence "
            "or --allow-small-label-set only for synthetic wiring tests."
        )
    label_ids: set[str] = set()
    for index, label in enumerate(labels):
        if not isinstance(label, dict):
            raise ManifestError(f"{path}: labels[{index}] must be an object")
        label_id = require_string(label, "label_id", f"{path}: labels[{index}]")
        require_string(label, "display_text", f"{path}: labels[{index}]")
        if label_id in label_ids:
            raise ManifestError(f"{path}: duplicate label_id: {label_id}")
        label_ids.add(label_id)
    return label_ids


def validate_external_clip_provenance(
    clip: dict[str, Any],
    context: str,
    allow_source_split_mismatch: bool = False,
) -> None:
    source_id = require_string(clip, "source_id", context)
    require_string(clip, "source_record_id", context)
    source_split = require_string(clip, "source_split", context)
    if source_split not in {"train", "val", "validation", "test"}:
        raise ManifestError(f"{context} source_split must be train, val, validation, or test")
    if source_split == "validation":
        source_split = "val"
    if source_id == POPSIGN_SOURCE_ID:
        manifest_split = require_string(clip, "split", context)
        source_split_matches_manifest = source_split == manifest_split or (
            source_split == "val" and manifest_split == "validation"
        )
        if not source_split_matches_manifest and not allow_source_split_mismatch:
            raise ManifestError(f"{context} source_split must align with manifest split")
        source_category = require_string(clip, "source_category", context)
        if source_category != "game":
            raise ManifestError(f"{context} source_category must be game for approved PopSign v1 imports")
        source_archive_url = require_string(clip, "source_archive_url", context)
        if not source_archive_url.startswith("https://signdata.cc.gatech.edu/data/popsign_v1_0/game/"):
            raise ManifestError(f"{context} source_archive_url must use the official PopSign v1 game archive API")
        require_string(clip, "source_sign_slug", context)
        require_string(clip, "source_video_path", context)
    elif source_id == "wlasl-school-assignment-raw-videos":
        source_category = require_string(clip, "source_category", context)
        if source_category != "wlasl_original_url":
            raise ManifestError(f"{context} source_category must be wlasl_original_url for WLASL imports")
        source_file_url = require_string(clip, "source_file_url", context)
        if not (source_file_url.startswith("https://") or source_file_url.startswith("http://")):
            raise ManifestError(f"{context} source_file_url must be an HTTP(S) original source URL")
        require_string(clip, "source_host", context)
        require_string(clip, "source_sign_slug", context)
        require_string(clip, "source_video_path", context)
    elif source_id == ASL_CITIZEN_SOURCE_ID:
        manifest_split = require_string(clip, "split", context)
        source_split_matches_manifest = source_split == manifest_split or (
            source_split == "val" and manifest_split == "validation"
        )
        if not source_split_matches_manifest and not allow_source_split_mismatch:
            raise ManifestError(f"{context} source_split must align with manifest split")
        source_category = require_string(clip, "source_category", context)
        if source_category != "asl_citizen_official_zip_range_selected_raw_video":
            raise ManifestError(
                f"{context} source_category must be "
                "asl_citizen_official_zip_range_selected_raw_video for ASL Citizen imports"
            )
        source_file_url = require_string(clip, "source_file_url", context)
        if source_file_url != ASL_CITIZEN_SOURCE_FILE_URL:
            raise ManifestError(f"{context} source_file_url must be the official ASL Citizen archive URL")
        source_archive_path = require_string(clip, "source_archive_path", context)
        if not source_archive_path.startswith("ASL_Citizen/videos/"):
            raise ManifestError(f"{context} source_archive_path must reference ASL_Citizen/videos/")
        if clip.get("source_record_id") != source_archive_path:
            raise ManifestError(f"{context} source_record_id must match source_archive_path")
        require_crc32(clip, "source_archive_crc32", context)
        source_archive_local_header_offset = clip.get("source_archive_local_header_offset")
        if not isinstance(source_archive_local_header_offset, int) or source_archive_local_header_offset < 0:
            raise ManifestError(f"{context} source_archive_local_header_offset must be a non-negative integer")
        require_string(clip, "source_sign_slug", context)
        source_video_path = require_string(clip, "source_video_path", context)
        if not source_video_path.startswith("data/external/asl-citizen/raw/selected/"):
            raise ManifestError(
                f"{context} source_video_path must reference the selected local ASL Citizen raw-video import"
            )
    else:
        raise ManifestError(f"{context} unsupported approved external source_id for raw-video provenance: {source_id}")
    verify_project_hash_reference(
        clip.get("source_subject_rights_evidence"),
        f"{context} source_subject_rights_evidence",
    )


def validate_clip_tensor_decode_evidence(clip: dict[str, Any], manifest_path: Path, context: str) -> None:
    tensor_relative = require_string(clip, "relative_frame_tensor_path", context)
    tensor_path = resolve_manifest_relative_path(
        manifest_path,
        tensor_relative,
        context,
        "relative_frame_tensor_path",
    )
    if not tensor_path.exists():
        raise ManifestError(f"{context} decoded frame tensor is unavailable: {tensor_path}")
    expected_tensor_hash = require_sha256(clip, "frame_tensor_sha256", context)
    actual_tensor_hash = sha256_file(tensor_path)
    if actual_tensor_hash != expected_tensor_hash:
        raise ManifestError(
            f"{context} decoded frame tensor hash mismatch for {tensor_path}; "
            f"expected {expected_tensor_hash}, got {actual_tensor_hash}"
        )

    provenance = clip.get("frame_tensor_provenance")
    if not isinstance(provenance, dict):
        raise ManifestError(f"{context} frame_tensor_provenance must be an object")
    provenance_schema = require_string(provenance, "schema_version", f"{context} frame_tensor_provenance")
    if provenance_schema not in {
        RAWFRAME_DECODE_PROVENANCE_SCHEMA_VERSION,
        HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION,
    }:
        raise ManifestError(
            f"{context} frame_tensor_provenance.schema_version must be one of "
            f"{RAWFRAME_DECODE_PROVENANCE_SCHEMA_VERSION!r}, "
            f"{HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION!r}"
        )

    video_path = resolve_manifest_relative_path(
        manifest_path,
        str(clip.get("relative_video_path") or ""),
        context,
        "relative_video_path",
    )
    source_video = provenance.get("source_video")
    if not isinstance(source_video, dict):
        raise ManifestError(f"{context} frame_tensor_provenance.source_video must be an object")
    if source_video.get("relative_video_path") != clip.get("relative_video_path"):
        raise ManifestError(f"{context} frame_tensor_provenance source video path does not match clip")
    if source_video.get("path") != project_relative(video_path):
        raise ManifestError(f"{context} frame_tensor_provenance source video project path does not match")
    if require_sha256(source_video, "sha256", f"{context} frame_tensor_provenance.source_video") != clip.get("sha256"):
        raise ManifestError(f"{context} frame_tensor_provenance source video hash must match clip sha256")

    decode = provenance.get("decode")
    if not isinstance(decode, dict):
        raise ManifestError(f"{context} frame_tensor_provenance.decode must be an object")
    for key in ("frame_count", "image_size", "frame_limit"):
        value = decode.get(key)
        if not isinstance(value, int) or value <= 0:
            raise ManifestError(f"{context} frame_tensor_provenance.decode.{key} must be a positive integer")
    decode_fps = decode.get("decode_fps")
    if not isinstance(decode_fps, (int, float)) or decode_fps <= 0:
        raise ManifestError(f"{context} frame_tensor_provenance.decode.decode_fps must be positive")
    if require_string(decode, "pixel_format", f"{context} frame_tensor_provenance.decode") != "rgb24":
        raise ManifestError(f"{context} frame_tensor_provenance.decode.pixel_format must be rgb24")
    require_string(decode, "video_filter", f"{context} frame_tensor_provenance.decode")

    ffmpeg_record = provenance.get("ffmpeg")
    if not isinstance(ffmpeg_record, dict):
        raise ManifestError(f"{context} frame_tensor_provenance.ffmpeg must be an object")
    require_string(ffmpeg_record, "path", f"{context} frame_tensor_provenance.ffmpeg")
    require_sha256(ffmpeg_record, "sha256", f"{context} frame_tensor_provenance.ffmpeg")
    require_string(ffmpeg_record, "version", f"{context} frame_tensor_provenance.ffmpeg")

    raw_rgb = provenance.get("decoded_raw_rgb")
    if not isinstance(raw_rgb, dict):
        raise ManifestError(f"{context} frame_tensor_provenance.decoded_raw_rgb must be an object")
    raw_bytes = raw_rgb.get("bytes")
    if not isinstance(raw_bytes, int) or raw_bytes <= 0:
        raise ManifestError(f"{context} frame_tensor_provenance.decoded_raw_rgb.bytes must be a positive integer")
    require_sha256(raw_rgb, "sha256", f"{context} frame_tensor_provenance.decoded_raw_rgb")

    tensor_digest = provenance.get("tensor_digest")
    if not isinstance(tensor_digest, dict):
        raise ManifestError(f"{context} frame_tensor_provenance.tensor_digest must be an object")
    require_string(tensor_digest, "dtype", f"{context} frame_tensor_provenance.tensor_digest")
    tensor_layout = require_string(tensor_digest, "layout", f"{context} frame_tensor_provenance.tensor_digest")
    shape = tensor_digest.get("shape")
    if provenance_schema == RAWFRAME_DECODE_PROVENANCE_SCHEMA_VERSION:
        if tensor_layout != "T,H,W,C":
            raise ManifestError(f"{context} frame_tensor_provenance.tensor_digest.layout must be T,H,W,C")
        if (
            not isinstance(shape, list)
            or len(shape) != 4
            or not all(isinstance(value, int) and value > 0 for value in shape)
        ):
            raise ManifestError(
                f"{context} frame_tensor_provenance.tensor_digest.shape must be four positive integers"
            )
        if (
            shape[0] != decode["frame_count"]
            or shape[1] != decode["image_size"]
            or shape[2] != decode["image_size"]
            or shape[3] != 3
        ):
            raise ManifestError(f"{context} frame_tensor_provenance tensor_digest.shape must match decode settings")
    elif provenance_schema == HIGH_SIGNAL_REGION_GRID_PROVENANCE_SCHEMA_VERSION:
        if tensor_layout != "T,R,H,W,C":
            raise ManifestError(f"{context} frame_tensor_provenance.tensor_digest.layout must be T,R,H,W,C")
        if (
            not isinstance(shape, list)
            or len(shape) != 5
            or not all(isinstance(value, int) and value > 0 for value in shape)
        ):
            raise ManifestError(
                f"{context} frame_tensor_provenance.tensor_digest.shape must be five positive integers"
            )
        if shape[0] != decode["frame_count"] or shape[-1] != 3:
            raise ManifestError(
                f"{context} frame_tensor_provenance tensor_digest.shape must match region-grid decode settings"
            )
        crop_reference = provenance.get("crop_config")
        if not isinstance(crop_reference, dict):
            raise ManifestError(f"{context} frame_tensor_provenance.crop_config must be an object")
        verify_project_hash_reference(crop_reference, f"{context} frame_tensor_provenance.crop_config")
        region_ids = crop_reference.get("region_ids")
        if (
            not isinstance(region_ids, list)
            or len(region_ids) != shape[1]
            or not all(isinstance(region_id, str) and region_id for region_id in region_ids)
        ):
            raise ManifestError(
                f"{context} frame_tensor_provenance.crop_config.region_ids must match tensor region axis"
            )
        if crop_reference.get("region_axis") != "T,R,H,W,C":
            raise ManifestError(f"{context} frame_tensor_provenance.crop_config.region_axis must be T,R,H,W,C")
        clip_crop_reference = clip.get("crop_config")
        if not isinstance(clip_crop_reference, dict):
            raise ManifestError(f"{context} crop_config must be an object for region-grid tensors")
        if clip_crop_reference.get("path") != crop_reference.get("path"):
            raise ManifestError(f"{context} crop_config.path must match frame_tensor_provenance.crop_config.path")
        if clip_crop_reference.get("sha256") != crop_reference.get("sha256"):
            raise ManifestError(f"{context} crop_config.sha256 must match frame_tensor_provenance.crop_config.sha256")
        crop_regions = clip.get("crop_regions")
        if not isinstance(crop_regions, list) or len(crop_regions) != shape[1]:
            raise ManifestError(f"{context} crop_regions must match tensor region axis")
    require_sha256(tensor_digest, "sha256", f"{context} frame_tensor_provenance.tensor_digest")


def validate_clip(
    clip: dict[str, Any],
    index: int,
    path: Path,
    split: str,
    label_ids: set[str],
    check_files: bool,
    source_decisions: dict[str, dict[str, Any]],
    collection_plan: dict[str, Any] | None,
    dataset_source_mode: str,
    allow_small_label_set: bool,
    allow_source_split_mismatch: bool = False,
    require_tensor_decode_evidence: bool = False,
) -> str:
    context = f"{path}: clips[{index}]"
    clip_id = require_string(clip, "clip_id", context)
    signer_id = require_string(clip, "signer_id", context)
    signer_identity_hash = str(clip.get("signer_identity_hash", "")).strip().lower()
    source_id = require_string(clip, "source_id", context)
    label_id = require_string(clip, "label_id", context)
    relative_video_path = require_string(clip, "relative_video_path", context)
    expected_video_sha256 = require_sha256(clip, "sha256", context)
    clip_split = require_string(clip, "split", context)
    frame_source = require_string(clip, "frame_source", context)
    resolve_manifest_relative_path(path, relative_video_path, context, "relative_video_path")

    if label_id not in label_ids:
        raise ManifestError(f"{context} references unknown label_id: {label_id}")
    if clip_split != split:
        raise ManifestError(f"{context} split {clip_split!r} does not match manifest split {split!r}")
    if frame_source != ALLOWED_FRAME_SOURCE:
        raise ManifestError(
            f"{context} frame_source must be {ALLOWED_FRAME_SOURCE!r}, got {frame_source!r}"
        )
    if not require_bool(clip, "allowed_for_model_training", context):
        raise ManifestError(f"{context} is not cleared for model training")
    if not allow_small_label_set:
        signer_identity_hash = require_sha256(clip, "signer_identity_hash", context)
        source = source_decisions.get(source_id)
        if not source:
            raise ManifestError(f"{context} source_id is not present in source register: {source_id}")
        if source.get("allowed_for_model_training") is not True:
            raise ManifestError(f"{context} source_id is not allowed for model training: {source_id}")
        source_decision = require_string(clip, "source_license_decision", context)
        if source_decision != source.get("decision_id"):
            raise ManifestError(
                f"{context} source_license_decision does not match source register decision_id"
            )
        source_review_status = require_string(clip, "source_license_review_status", context)
        if source_review_status != source.get("license_review_status"):
            raise ManifestError(
                f"{context} source_license_review_status does not match source register"
            )
        source_kind = source.get("source_kind")
        if dataset_source_mode == FIRST_PARTY_DATASET_SOURCE_MODE:
            if source_id not in FIRST_PARTY_SOURCE_IDS or source_kind != "first_party_collection":
                raise ManifestError(f"{context} first-party manifest clip must use the first-party source")
            consent_record_id = require_string(clip, "consent_record_id", context)
            validate_signed_consent_evidence(clip, context, signer_identity_hash, consent_record_id)
            validate_collection_plan_assignment(clip, context, collection_plan, "vocabulary")
            validate_capture_condition_evidence(clip, context, "vocabulary")
        elif dataset_source_mode == EXTERNAL_DATASET_SOURCE_MODE:
            if source_kind not in EXTERNAL_SOURCE_KINDS or source_id in FIRST_PARTY_SOURCE_IDS:
                raise ManifestError(f"{context} external manifest clip must use an approved external source")
            validate_external_clip_provenance(clip, context, allow_source_split_mismatch)
        else:
            raise ManifestError(f"{context} unsupported dataset_source_mode: {dataset_source_mode}")
        review = clip.get("review")
        if not isinstance(review, dict):
            raise ManifestError(f"{context} review must be an object")
        if require_string(review, "label_review_status", f"{context}.review") != "approved":
            raise ManifestError(f"{context} review.label_review_status must be approved before training")
        reviewer = require_string(review, "label_reviewer", f"{context}.review")
        if reviewer == "needs-review":
            raise ManifestError(f"{context} review.label_reviewer must identify the reviewer")
        reviewed_at = review.get("reviewed_at")
        if not isinstance(reviewed_at, str) or not reviewed_at.strip():
            raise ManifestError(f"{context} review.reviewed_at must be a non-empty string")

    derived_features = clip.get("derived_features", [])
    if derived_features not in ([], None):
        raise ManifestError(
            f"{context} derived_features must be empty; generated landmarks/features are not allowed"
        )

    token = contains_prohibited_token(clip)
    if token:
        raise ManifestError(f"{context} contains prohibited pretrained-component token: {token}")

    if check_files:
        video_path = resolve_manifest_relative_path(path, relative_video_path, context, "relative_video_path")
        if not video_path.exists():
            raise ManifestError(f"{context} video file is missing: {video_path}")
        actual_video_sha256 = sha256_file(video_path)
        if actual_video_sha256 != expected_video_sha256:
            raise ManifestError(
                f"{context} video SHA-256 mismatch for {video_path}; "
                f"expected {expected_video_sha256}, got {actual_video_sha256}"
            )

    if require_tensor_decode_evidence:
        validate_clip_tensor_decode_evidence(clip, path, context)

    return signer_identity_hash if not allow_small_label_set else signer_id


def validate_reduced_real_data_module_manifest_evidence(
    data: dict[str, Any],
    path: Path,
    split: str,
    ordered_label_ids: list[str],
) -> dict[str, Any]:
    if data.get("dataset_id") != "asl-pilot-asl-citizen-high-signal-module-v0":
        raise ManifestError(f"{path}: reduced real-data module requires ASL Citizen high-signal dataset_id")
    if dataset_source_mode_for(data, path) != EXTERNAL_DATASET_SOURCE_MODE:
        raise ManifestError(f"{path}: reduced real-data module must use approved external raw-video source mode")
    external_import = data.get("external_dataset_import")
    if not isinstance(external_import, dict) or external_import.get("source_id") != ASL_CITIZEN_SOURCE_ID:
        raise ManifestError(f"{path}: reduced real-data module must bind external_dataset_import to ASL Citizen")

    clips = data.get("clips")
    if not isinstance(clips, list):
        raise ManifestError(f"{path}: clips must be an array before reduced real-data evidence validation")
    source_ids = {clip.get("source_id") for clip in clips if isinstance(clip, dict)}
    if source_ids != {ASL_CITIZEN_SOURCE_ID}:
        raise ManifestError(f"{path}: reduced real-data module clips must all use ASL Citizen source_id")

    evidence = data.get("high_signal_module_evidence")
    if not isinstance(evidence, dict):
        raise ManifestError(f"{path}: high_signal_module_evidence must be an object")
    if evidence.get("schema_version") != "asl-pilot-asl-citizen-high-signal-module-manifest/v1":
        raise ManifestError(f"{path}: high_signal_module_evidence schema_version is invalid")
    if evidence.get("finality") != "reduced_module_manifest_not_training_or_model_promotion":
        raise ManifestError(f"{path}: high_signal_module_evidence must reject training/model promotion finality")
    if evidence.get("selected_labels") != ordered_label_ids:
        raise ManifestError(f"{path}: high_signal_module_evidence.selected_labels must match manifest labels")
    if evidence.get("split_policy") != "filtered_from_official_asl_citizen_train_validation_test_splits":
        raise ManifestError(f"{path}: high_signal_module_evidence.split_policy is invalid")

    verify_project_hash_reference(evidence.get("selection"), f"{path}: high_signal_module_evidence.selection")
    parent_manifest = verify_project_hash_reference(
        evidence.get("parent_manifest"),
        f"{path}: high_signal_module_evidence.parent_manifest",
    )
    if evidence.get("parent_manifest", {}).get("split") != split:
        raise ManifestError(f"{path}: high_signal_module_evidence.parent_manifest.split must match manifest split")
    parent_lesson = evidence.get("parent_lesson_milestone_evidence")
    if not isinstance(parent_lesson, dict):
        raise ManifestError(f"{path}: high_signal_module_evidence.parent_lesson_milestone_evidence must be an object")
    if parent_lesson.get("finality") != "lesson_milestone_manifest_not_training_or_model_promotion":
        raise ManifestError(f"{path}: parent lesson evidence finality must reject model promotion")
    if parent_lesson.get("schema_version") != "asl-pilot-asl-citizen-lesson-milestone-manifests/v1":
        raise ManifestError(f"{path}: parent lesson evidence schema_version is invalid")
    verify_project_hash_reference(
        parent_lesson.get("selected_import"),
        f"{path}: high_signal_module_evidence.parent_lesson_milestone_evidence.selected_import",
    )
    verify_project_hash_reference(
        parent_lesson.get("source_review"),
        f"{path}: high_signal_module_evidence.parent_lesson_milestone_evidence.source_review",
    )
    return {
        "schema_version": evidence["schema_version"],
        "finality": evidence["finality"],
        "selection": evidence["selection"],
        "parent_manifest": {
            "path": parent_manifest["path"],
            "sha256": parent_manifest["sha256"],
            "split": split,
        },
        "selected_labels": ordered_label_ids,
        "source_id": ASL_CITIZEN_SOURCE_ID,
    }


def validate_m3gu_reduced4_manifest_evidence(
    data: dict[str, Any],
    path: Path,
    split: str,
    ordered_label_ids: list[str],
) -> dict[str, Any]:
    if data.get("dataset_id") != M3GQ_REDUCED4_DATASET_ID:
        raise ManifestError(f"{path}: M3GU reduced4 requires dataset_id {M3GQ_REDUCED4_DATASET_ID}")
    if dataset_source_mode_for(data, path) != EXTERNAL_DATASET_SOURCE_MODE:
        raise ManifestError(f"{path}: M3GU reduced4 must use approved external raw-video source mode")
    external_import = data.get("external_dataset_import")
    if not isinstance(external_import, dict) or external_import.get("source_id") != ASL_CITIZEN_SOURCE_ID:
        raise ManifestError(f"{path}: M3GU reduced4 must bind external_dataset_import to ASL Citizen")
    if tuple(ordered_label_ids) != M3GQ_REDUCED4_LABEL_IDS:
        raise ManifestError(
            f"{path}: M3GU reduced4 labels must be {list(M3GQ_REDUCED4_LABEL_IDS)}, got {ordered_label_ids}"
        )

    clips = data.get("clips")
    if not isinstance(clips, list):
        raise ManifestError(f"{path}: clips must be an array before M3GU reduced4 validation")
    source_ids = {clip.get("source_id") for clip in clips if isinstance(clip, dict)}
    if source_ids != {ASL_CITIZEN_SOURCE_ID}:
        raise ManifestError(f"{path}: M3GU reduced4 clips must all use ASL Citizen source_id")
    license_statuses = {
        clip.get("source_license_review_status") for clip in clips if isinstance(clip, dict)
    }
    if license_statuses != {"approved_noncommercial_school_assignment_raw_video_only"}:
        raise ManifestError(f"{path}: M3GU reduced4 clips must retain the approved ASL Citizen license status")

    evidence = data.get("high_signal_module_evidence")
    if not isinstance(evidence, dict):
        raise ManifestError(f"{path}: M3GU reduced4 high_signal_module_evidence must be an object")
    if evidence.get("schema_version") != "asl-pilot-asl-citizen-high-signal-module-manifest/v1":
        raise ManifestError(f"{path}: M3GU reduced4 high_signal_module_evidence schema_version is invalid")
    if evidence.get("finality") != "reduced_module_manifest_not_training_or_model_promotion":
        raise ManifestError(f"{path}: M3GU reduced4 high_signal_module_evidence finality must reject promotion")
    if evidence.get("selected_labels") != list(M3GQ_REDUCED4_PARENT_LABEL_IDS):
        raise ManifestError(f"{path}: M3GU reduced4 must retain the parent seven-label selected_labels contract")
    if evidence.get("split_policy") != "filtered_from_official_asl_citizen_train_validation_test_splits":
        raise ManifestError(f"{path}: M3GU reduced4 split_policy is invalid")

    verify_project_hash_reference(evidence.get("selection"), f"{path}: high_signal_module_evidence.selection")
    parent_manifest = verify_project_hash_reference(
        evidence.get("parent_manifest"),
        f"{path}: high_signal_module_evidence.parent_manifest",
    )
    if evidence.get("parent_manifest", {}).get("split") != split:
        raise ManifestError(f"{path}: high_signal_module_evidence.parent_manifest.split must match manifest split")
    return {
        "schema_version": evidence["schema_version"],
        "finality": evidence["finality"],
        "dataset_id": M3GQ_REDUCED4_DATASET_ID,
        "label_ids": list(M3GQ_REDUCED4_LABEL_IDS),
        "parent_selected_labels": list(M3GQ_REDUCED4_PARENT_LABEL_IDS),
        "parent_manifest": {
            "path": parent_manifest["path"],
            "sha256": parent_manifest["sha256"],
            "split": split,
        },
        "source_id": ASL_CITIZEN_SOURCE_ID,
        "source_license_review_status": "approved_noncommercial_school_assignment_raw_video_only",
    }


def validate_popsign_fresh5_repaired_manifest_evidence(
    data: dict[str, Any],
    path: Path,
    split: str,
    ordered_label_ids: list[str],
) -> dict[str, Any]:
    if data.get("dataset_id") != POPSIGN_FRESH5_REPAIRED_DATASET_ID:
        raise ManifestError(f"{path}: PopSign fresh5 smoke requires {POPSIGN_FRESH5_REPAIRED_DATASET_ID}")
    if dataset_source_mode_for(data, path) != EXTERNAL_DATASET_SOURCE_MODE:
        raise ManifestError(f"{path}: PopSign fresh5 smoke must use approved external raw-video source mode")
    external_import = data.get("external_dataset_import")
    if not isinstance(external_import, dict) or external_import.get("source_id") != POPSIGN_SOURCE_ID:
        raise ManifestError(f"{path}: PopSign fresh5 smoke must bind external_dataset_import to PopSign")
    if tuple(ordered_label_ids) != POPSIGN_FRESH5_REPAIRED_LABEL_IDS:
        expected = ", ".join(POPSIGN_FRESH5_REPAIRED_LABEL_IDS)
        actual = ", ".join(ordered_label_ids)
        raise ManifestError(
            f"{path}: PopSign fresh5 repaired labels must be [{expected}], got [{actual}]"
        )

    clips = data.get("clips")
    if not isinstance(clips, list):
        raise ManifestError(f"{path}: clips must be an array before PopSign fresh5 validation")
    source_ids = {clip.get("source_id") for clip in clips if isinstance(clip, dict)}
    if source_ids != {POPSIGN_SOURCE_ID}:
        raise ManifestError(f"{path}: PopSign fresh5 clips must all use {POPSIGN_SOURCE_ID}")

    return {
        "dataset_id": POPSIGN_FRESH5_REPAIRED_DATASET_ID,
        "label_ids": list(POPSIGN_FRESH5_REPAIRED_LABEL_IDS),
        "source_id": POPSIGN_SOURCE_ID,
        "split": split,
    }


def validate_popsign_label_ladder_diagnostic_evidence(
    data: dict[str, Any],
    path: Path,
    split: str,
    ordered_label_ids: list[str],
) -> dict[str, Any]:
    label_count = len(ordered_label_ids)
    expected_dataset_id = f"asl-pilot-popsign-v1-game-rawframe-v0-diagnostic-label-ladder-{label_count}"
    if data.get("dataset_id") != expected_dataset_id:
        raise ManifestError(f"{path}: PopSign label-ladder diagnostic requires dataset_id {expected_dataset_id}")
    if dataset_source_mode_for(data, path) != EXTERNAL_DATASET_SOURCE_MODE:
        raise ManifestError(f"{path}: PopSign label-ladder diagnostic must use approved external raw-video source mode")
    external_import = data.get("external_dataset_import")
    if not isinstance(external_import, dict) or external_import.get("source_id") != POPSIGN_SOURCE_ID:
        raise ManifestError(f"{path}: PopSign label-ladder diagnostic must bind external_dataset_import to PopSign")

    evidence = data.get("diagnostic_evidence")
    if not isinstance(evidence, dict):
        raise ManifestError(f"{path}: diagnostic_evidence must be an object for PopSign label-ladder diagnostic")
    if evidence.get("schema_version") != "asl-pilot-popsign-label-ladder-diagnostic/v1":
        raise ManifestError(f"{path}: diagnostic_evidence schema_version is invalid")
    if evidence.get("finality") != "diagnostic_not_final_model_evidence":
        raise ManifestError(f"{path}: diagnostic_evidence finality must reject final model evidence")
    if evidence.get("source_manifest_split") != split:
        raise ManifestError(f"{path}: diagnostic_evidence.source_manifest_split must match manifest split")
    if evidence.get("label_count") != label_count:
        raise ManifestError(f"{path}: diagnostic_evidence.label_count must match manifest labels")
    require_sha256(evidence, "source_manifest_sha256", f"{path}: diagnostic_evidence")

    clips = data.get("clips")
    if not isinstance(clips, list):
        raise ManifestError(f"{path}: clips must be an array before PopSign label-ladder validation")
    source_ids = {clip.get("source_id") for clip in clips if isinstance(clip, dict)}
    if source_ids != {POPSIGN_SOURCE_ID}:
        raise ManifestError(f"{path}: PopSign label-ladder clips must all use {POPSIGN_SOURCE_ID}")

    return {
        "schema_version": evidence["schema_version"],
        "finality": evidence["finality"],
        "label_count": label_count,
        "source_id": POPSIGN_SOURCE_ID,
        "split": split,
        "source_manifest_sha256": evidence["source_manifest_sha256"],
    }


def validate_manifest(
    path: Path,
    expected_split: str,
    check_files: bool,
    allow_small_label_set: bool,
    allow_lesson_label_set: bool = False,
    allow_source_split_mismatch: bool = False,
    allow_reduced_real_data_label_set: bool = False,
    allow_m3gu_reduced4_label_set: bool = False,
    allow_popsign_fresh5_label_set: bool = False,
    allow_popsign_label_ladder_set: bool = False,
) -> dict[str, Any]:
    data = load_manifest(path)
    schema_version = require_string(data, "schema_version", str(path))
    if schema_version != EXPECTED_SCHEMA_VERSION:
        raise ManifestError(
            f"{path}: schema_version must be {EXPECTED_SCHEMA_VERSION!r}, got {schema_version!r}"
        )
    split = require_string(data, "split", str(path))
    if split != expected_split:
        raise ManifestError(f"{path}: expected split {expected_split!r}, got {split!r}")
    require_string(data, "dataset_id", str(path))
    require_string(data, "created_at", str(path))
    require_string(data, "provenance_owner", str(path))
    dataset_source_mode = dataset_source_mode_for(data, path)
    source_decisions = validate_source_register(data, path, allow_small_label_set)
    external_dataset_import = validate_external_dataset_import(
        data,
        path,
        source_decisions,
        allow_small_label_set,
    )
    consent_form = validate_consent_form(data, path, allow_small_label_set)
    collection_plan = validate_collection_plan(data, path, allow_small_label_set)

    preprocessing = data.get("preprocessing")
    if not isinstance(preprocessing, dict):
        raise ManifestError(f"{path}: preprocessing must be an object")
    allowed_steps = preprocessing.get("allowed_steps")
    if not isinstance(allowed_steps, list):
        raise ManifestError(f"{path}: preprocessing.allowed_steps must be an array")
    token = contains_prohibited_token(preprocessing)
    if token:
        raise ManifestError(f"{path}: preprocessing contains prohibited token: {token}")

    labels = data.get("labels")
    label_ids = validate_labels(
        labels,
        path,
        allow_small_label_set,
        allow_lesson_label_set,
        allow_reduced_real_data_label_set,
        allow_m3gu_reduced4_label_set,
        allow_popsign_fresh5_label_set,
        allow_popsign_label_ladder_set,
    )
    ordered_label_ids = [str(label["label_id"]) for label in labels]
    vocabulary_review = validate_vocabulary_review(
        data,
        path,
        allow_small_label_set,
        ordered_label_ids,
        allow_popsign_fresh5_label_set or allow_m3gu_reduced4_label_set,
        allow_popsign_label_ladder_set,
    )
    clips = data.get("clips")
    if not isinstance(clips, list) or not clips:
        raise ManifestError(f"{path}: clips must be a non-empty array")

    signer_ids: set[str] = set()
    clip_ids: set[str] = set()
    label_clip_counts = {label_id: 0 for label_id in label_ids}
    for index, clip in enumerate(clips):
        if not isinstance(clip, dict):
            raise ManifestError(f"{path}: clips[{index}] must be an object")
        clip_id = require_string(clip, "clip_id", f"{path}: clips[{index}]")
        if clip_id in clip_ids:
            raise ManifestError(f"{path}: duplicate clip_id: {clip_id}")
        clip_ids.add(clip_id)
        label_id = require_string(clip, "label_id", f"{path}: clips[{index}]")
        if label_id not in label_clip_counts:
            raise ManifestError(f"{path}: clips[{index}] references unknown label_id: {label_id}")
        label_clip_counts[label_id] += 1
        signer_ids.add(
            validate_clip(
                clip,
                index,
                path,
                split,
                label_ids,
                check_files,
                source_decisions,
                collection_plan,
                dataset_source_mode,
                allow_small_label_set,
                allow_source_split_mismatch,
                allow_reduced_real_data_label_set
                or allow_m3gu_reduced4_label_set
                or allow_popsign_fresh5_label_set,
            )
        )

    if allow_small_label_set:
        required_clip_count = 1
    elif allow_popsign_fresh5_label_set or allow_popsign_label_ladder_set:
        required_clip_count = MIN_REDUCED_REAL_DATA_CLIPS_PER_LABEL_PER_SPLIT
    elif allow_m3gu_reduced4_label_set:
        required_clip_count = MIN_REDUCED_REAL_DATA_CLIPS_PER_LABEL_PER_SPLIT
    elif allow_reduced_real_data_label_set:
        required_clip_count = MIN_REDUCED_REAL_DATA_CLIPS_PER_LABEL_PER_SPLIT
    elif allow_lesson_label_set:
        required_clip_count = MIN_LESSON_MILESTONE_CLIPS_PER_LABEL_PER_SPLIT
    else:
        required_clip_count = MIN_CLIPS_PER_LABEL_PER_SPLIT
    underfilled_labels = [
        (label_id, count)
        for label_id, count in sorted(label_clip_counts.items())
        if count < required_clip_count
    ]
    if underfilled_labels:
        formatted = ", ".join(f"{label_id} ({count})" for label_id, count in underfilled_labels)
        raise ManifestError(
            f"{path}: every label must have at least {required_clip_count} approved {split} "
            f"clip(s); underfilled: {formatted}"
        )

    reduced_real_data_module_evidence = None
    m3gu_reduced4_manifest_evidence = None
    popsign_fresh5_repaired_evidence = None
    popsign_label_ladder_diagnostic_evidence = None
    if allow_reduced_real_data_label_set:
        reduced_real_data_module_evidence = validate_reduced_real_data_module_manifest_evidence(
            data,
            path,
            split,
            ordered_label_ids,
        )
    if allow_m3gu_reduced4_label_set:
        m3gu_reduced4_manifest_evidence = validate_m3gu_reduced4_manifest_evidence(
            data,
            path,
            split,
            ordered_label_ids,
        )
    if allow_popsign_fresh5_label_set:
        popsign_fresh5_repaired_evidence = validate_popsign_fresh5_repaired_manifest_evidence(
            data,
            path,
            split,
            ordered_label_ids,
        )
    if allow_popsign_label_ladder_set:
        popsign_label_ladder_diagnostic_evidence = validate_popsign_label_ladder_diagnostic_evidence(
            data,
            path,
            split,
            ordered_label_ids,
        )

    return {
        "path": str(path),
        "split": split,
        "dataset_id": data["dataset_id"],
        "label_ids": label_ids,
        "label_count": len(label_ids),
        "clip_count": len(clips),
        "min_clips_per_label_per_split": required_clip_count,
        "label_clip_counts": label_clip_counts,
        "signer_ids": signer_ids,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "source_register": data.get("source_register"),
        "dataset_source_mode": dataset_source_mode,
        "external_dataset_import": external_dataset_import,
        "supplemental_external_dataset_imports": data.get("supplemental_external_dataset_imports"),
        "collection_plan": collection_plan,
        "consent_form": consent_form,
        "vocabulary_review": vocabulary_review,
        "reduced_real_data_module_evidence": reduced_real_data_module_evidence,
        "m3gu_reduced4_manifest_evidence": m3gu_reduced4_manifest_evidence,
        "popsign_fresh5_repaired_evidence": popsign_fresh5_repaired_evidence,
        "popsign_label_ladder_diagnostic_evidence": popsign_label_ladder_diagnostic_evidence,
    }


def assert_signer_disjoint(manifests: list[dict[str, Any]]) -> None:
    for left_index, left in enumerate(manifests):
        for right in manifests[left_index + 1 :]:
            overlap = left["signer_ids"] & right["signer_ids"]
            if overlap:
                names = ", ".join(sorted(overlap))
                raise ManifestError(
                    f"signer-disjoint split violation between {left['split']} and "
                    f"{right['split']}: {names}"
                )


def assert_label_sets_match(manifests: list[dict[str, Any]]) -> None:
    expected = manifests[0]["label_ids"]
    for item in manifests[1:]:
        if item["label_ids"] != expected:
            missing = ", ".join(sorted(expected - item["label_ids"])) or "none"
            extra = ", ".join(sorted(item["label_ids"] - expected)) or "none"
            raise ManifestError(
                f"label set mismatch for {item['split']} manifest; missing: {missing}; extra: {extra}"
            )


def validate_training_args(args: argparse.Namespace) -> None:
    numeric_fields = {
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "frame_count": args.frame_count,
        "image_size": args.image_size,
    }
    for name, value in numeric_fields.items():
        if value <= 0:
            raise TrainingError(f"--{name.replace('_', '-')} must be greater than zero")
    if args.learning_rate <= 0:
        raise TrainingError("--learning-rate must be greater than zero")
    if args.weight_decay < 0:
        raise TrainingError("--weight-decay must be greater than or equal to zero")
    if args.label_smoothing < 0 or args.label_smoothing >= 1:
        raise TrainingError("--label-smoothing must be greater than or equal to zero and less than one")
    if args.architecture not in ALLOWED_MODEL_ARCHITECTURES:
        raise TrainingError(f"--architecture must be one of: {', '.join(ALLOWED_MODEL_ARCHITECTURES)}")
    if args.num_workers < 0:
        raise TrainingError("--num-workers must be zero or greater")
    if args.max_train_batches is not None and args.max_train_batches <= 0:
        raise TrainingError("--max-train-batches must be greater than zero when provided")
    if args.max_validation_batches is not None and args.max_validation_batches <= 0:
        raise TrainingError("--max-validation-batches must be greater than zero when provided")


def loader_contract_for_manifest(args: argparse.Namespace, manifest: dict[str, Any]) -> dict[str, Any]:
    split = str(manifest["split"])
    row_count = int(manifest["clip_count"])
    batch_size = int(args.batch_size)
    drop_last = False
    is_train = split == "train"
    is_validation = split == "validation"
    max_batches = args.max_train_batches if is_train else args.max_validation_batches if is_validation else None
    full_epoch_batches = math.floor(row_count / batch_size) if drop_last else math.ceil(row_count / batch_size)
    if max_batches is None or max_batches >= full_epoch_batches:
        row_visit_count = row_count
        all_rows_visited = True
    else:
        row_visit_count = min(row_count, max_batches * batch_size)
        all_rows_visited = row_visit_count == row_count

    contract: dict[str, Any] = {
        "loader_role": "training" if is_train else "validation" if is_validation else "not_loaded_by_training_loop",
        "dataset_row_count": row_count,
        "batch_size": batch_size,
        "drop_last": drop_last,
        "shuffle": is_train,
        "sampler_type": "RandomSampler" if is_train else "SequentialSampler" if is_validation else None,
        "num_workers": args.num_workers if is_train or is_validation else None,
        "max_batches": max_batches,
        "full_epoch_batches": full_epoch_batches,
        "row_visit_count_under_cap": row_visit_count if is_train or is_validation else None,
        "all_rows_visited_under_cap": all_rows_visited if is_train or is_validation else None,
    }
    if (
        is_train
        and resolve_output_dir_for_policy(args.output_dir) == POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR
        and all_rows_visited
    ):
        contract["row_index_set_under_cap"] = list(range(row_count))
        contract["row_index_set_semantics"] = (
            "all manifest row indexes are visited exactly once in one DataLoader epoch; "
            "RandomSampler determines order at runtime from the recorded seed"
        )
    return contract


def data_loading_contract(args: argparse.Namespace, manifests: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        str(item["split"]): loader_contract_for_manifest(args, item)
        for item in manifests
    }


def print_plan(
    args: argparse.Namespace,
    manifests: list[dict[str, Any]],
    input_contract_report: dict[str, Any] | None = None,
) -> None:
    plan = {
        "model_id": args.model_id,
        "training_command": [sys.executable, *sys.argv],
        "training_script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "initialization": "random",
        "architecture": args.architecture,
        "evidence_mode": training_evidence_mode(args),
        "pretrained_components": [],
        "seed": args.seed,
        "output_dir": str(args.output_dir),
        "training_status": "dry_run_only" if args.dry_run else "ready_for_pytorch_backend",
        "runtime": {
            "backend": "pytorch_optional",
            "device_preference": ["cuda", "mps", "cpu"],
            "requires_decoded_frame_tensors": True,
        },
        "hyperparameters": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "optimizer": args.optimizer,
            "weight_decay": args.weight_decay if args.optimizer == "adamw" else 0.0,
            "label_smoothing": args.label_smoothing,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "architecture": args.architecture,
            "training_augmentation": args.training_augmentation,
            "checkpoint_selection": args.checkpoint_selection,
            "num_workers": args.num_workers,
            "max_train_batches": args.max_train_batches,
            "max_validation_batches": args.max_validation_batches,
            "preserve_region_axis": training_evidence_mode(args)
            in {
                "region_grid_tcn_training_smoke",
                "m3gu_reduced4_training_smoke",
                "popsign_fresh5_training_smoke",
            },
        },
        "data_loading_contract": data_loading_contract(args, manifests),
        "input_contract_requirement": args.require_input_contract,
        "manifests": [
            {
                "path": item["path"],
                "split": item["split"],
                "dataset_id": item["dataset_id"],
                "label_count": item["label_count"],
                "clip_count": item["clip_count"],
                "min_clips_per_label_per_split": item["min_clips_per_label_per_split"],
                "sha256": item["sha256"],
                "source_register": item.get("source_register"),
                "dataset_source_mode": item.get("dataset_source_mode"),
                "external_dataset_import": item.get("external_dataset_import"),
                "supplemental_external_dataset_imports": item.get("supplemental_external_dataset_imports"),
                "collection_plan": item.get("collection_plan"),
                "consent_form": item.get("consent_form"),
                "vocabulary_review": item.get("vocabulary_review"),
                "reduced_real_data_module_evidence": item.get("reduced_real_data_module_evidence"),
                "m3gu_reduced4_manifest_evidence": item.get("m3gu_reduced4_manifest_evidence"),
                "popsign_fresh5_repaired_evidence": item.get("popsign_fresh5_repaired_evidence"),
                "popsign_label_ladder_diagnostic_evidence": item.get(
                    "popsign_label_ladder_diagnostic_evidence"
                ),
            }
            for item in manifests
        ],
        "prohibited_components_policy": {
            "pretrained_weights": "rejected",
            "pretrained_backbones": "rejected",
            "pretrained_detectors": "rejected",
            "generated_landmarks_or_embeddings": "rejected",
        },
    }
    if input_contract_report is not None:
        plan["input_contract_report"] = input_contract_report
    print(json.dumps(plan, indent=2, sort_keys=True))


def import_torch() -> Any:
    try:
        import torch  # type: ignore[import-not-found]
    except ImportError as error:
        raise TrainingError(
            "PyTorch is required for training but is not installed. "
            "Dry-run validation still works without it. To train, install torch in the active "
            "Python environment, then rerun the same command without --dry-run."
        ) from error
    return torch


def select_device(torch: Any) -> Any:
    cuda = getattr(torch, "cuda", None)
    if cuda is not None and cuda.is_available():
        return torch.device("cuda")
    mps = getattr(getattr(torch, "backends", None), "mps", None)
    if mps is not None and mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def model_state_digest(state_dict: dict[str, Any]) -> dict[str, Any]:
    digest = hashlib.sha256()
    parameter_count = 0
    for key in sorted(state_dict):
        value = state_dict[key]
        if not hasattr(value, "detach"):
            continue
        tensor = value.detach().cpu().contiguous()
        payload = tensor.numpy().tobytes()
        digest.update(key.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(tensor.dtype).encode("utf-8"))
        digest.update(b"\0")
        digest.update(json.dumps(list(tensor.shape), separators=(",", ":")).encode("utf-8"))
        digest.update(b"\0")
        digest.update(payload)
        digest.update(b"\0")
        parameter_count += int(tensor.numel())
    return {
        "algorithm": "canonical_state_dict_sha256_v1",
        "parameter_count": parameter_count,
        "sha256": digest.hexdigest(),
    }


def clone_state_dict_to_cpu(state_dict: dict[str, Any]) -> dict[str, Any]:
    output = {}
    for key, value in state_dict.items():
        if hasattr(value, "detach"):
            output[key] = value.detach().cpu().clone()
        else:
            output[key] = value
    return output


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_relative(path: Path) -> str:
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()


def file_reference(path: Path) -> dict[str, str]:
    resolved = path.resolve()
    return {
        "path": project_relative(resolved),
        "sha256": sha256_file(resolved),
    }


def local_ml_environment_report_path() -> Path:
    return PROJECT_ROOT / LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE


def local_ml_environment_reference() -> dict[str, str] | None:
    report_path = local_ml_environment_report_path()
    if report_path.exists():
        return file_reference(report_path)
    return None


def require_current_local_ml_environment(context: str) -> dict[str, str]:
    report_path = local_ml_environment_report_path()
    findings = validate_retained_local_ml_environment_report(report_path)
    if findings:
        raise TrainingError(
            f"{context} requires a current local ML/GPU environment receipt at "
            f"{LOCAL_ML_ENVIRONMENT_REPORT_RELATIVE}: " + "; ".join(findings)
        )
    return file_reference(report_path)


def should_verify_retained_local_ml_environment() -> bool:
    return platform.system() == "Darwin"


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


def training_evidence_mode(args: argparse.Namespace) -> str:
    if args.popsign_fresh5_training_smoke:
        return "popsign_fresh5_training_smoke"
    if args.popsign_label_ladder_training_smoke:
        return "popsign_label_ladder_training_smoke"
    if args.popsign_label_ladder_diagnostic:
        return "popsign_label_ladder_diagnostic"
    if args.m3gu_reduced4_training_smoke:
        return "m3gu_reduced4_training_smoke"
    if args.region_grid_tcn_training_smoke:
        return "region_grid_tcn_training_smoke"
    if args.reduced_real_data_training_smoke:
        return "reduced_real_data_training_smoke"
    if args.allow_small_label_set or args.max_train_batches is not None or args.max_validation_batches is not None:
        return "smoke"
    if args.lesson_milestone:
        return "lesson_milestone"
    if args.reduced_real_data_module:
        return "reduced_real_data_module"
    if args.controlled_clip_heldout:
        return "controlled_clip_heldout"
    return "final"


def checkpoint_architecture(checkpoint: dict[str, Any]) -> str:
    architecture = checkpoint.get("architecture", FRAME_MEAN_CNN_ARCHITECTURE)
    if architecture not in ALLOWED_MODEL_ARCHITECTURES:
        raise TrainingError(
            f"checkpoint architecture must be one of {', '.join(ALLOWED_MODEL_ARCHITECTURES)}; "
            f"found {architecture!r}"
        )
    return str(architecture)


def generated_by(args: argparse.Namespace) -> dict[str, Any]:
    return {
        "tool": "scripts/train_rawframe_model.py",
        "command": [sys.executable, *sys.argv],
        "script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "allow_small_label_set": args.allow_small_label_set,
        "lesson_milestone": args.lesson_milestone,
        "reduced_real_data_module": args.reduced_real_data_module,
        "reduced_real_data_training_smoke": args.reduced_real_data_training_smoke,
        "region_grid_tcn_training_smoke": args.region_grid_tcn_training_smoke,
        "m3gu_reduced4_training_smoke": args.m3gu_reduced4_training_smoke,
        "popsign_fresh5_training_smoke": args.popsign_fresh5_training_smoke,
        "popsign_label_ladder_diagnostic": args.popsign_label_ladder_diagnostic,
        "popsign_label_ladder_training_smoke": args.popsign_label_ladder_training_smoke,
        "require_input_contract": args.require_input_contract,
        "controlled_clip_heldout": args.controlled_clip_heldout,
        "evidence_mode": training_evidence_mode(args),
    }


def resolve_output_dir_for_policy(output_dir: Path) -> Path:
    if output_dir.is_absolute():
        return output_dir.resolve()
    return (PROJECT_ROOT / output_dir).resolve()


def resolve_path_for_invocation_policy(value: Path) -> Path:
    if value.is_absolute():
        return value.resolve()
    return (PROJECT_ROOT / value).resolve()


def require_final_invocation_path(actual: Path | None, expected_relative: str, message: str) -> None:
    if actual is None:
        raise ManifestError(message)
    expected = (PROJECT_ROOT / expected_relative).resolve()
    if resolve_path_for_invocation_policy(actual) != expected:
        raise ManifestError(message)


def require_m3gu_reduced4_manifest_path(actual: Path | None, split: str) -> None:
    expected_relative = M3GQ_REDUCED4_REGION_GRID_MANIFEST_RELATIVES[split]
    require_final_invocation_path(
        actual,
        expected_relative,
        f"M3GU reduced4 training smoke requires --{split}-manifest {expected_relative}",
    )
    assert actual is not None
    actual_hash = sha256_file(resolve_path_for_invocation_policy(actual))
    expected_hash = M3GQ_REDUCED4_REGION_GRID_MANIFEST_SHA256S[split]
    if actual_hash != expected_hash:
        raise ManifestError(
            f"M3GU reduced4 {split} manifest SHA-256 mismatch; expected {expected_hash}, got {actual_hash}"
        )


def require_m3gu_reduced4_unused_output_dir(output_dir: Path) -> None:
    resolved = resolve_output_dir_for_policy(output_dir)
    if resolved != M3GU_REDUCED4_TRAINING_SMOKE_OUTPUT_DIR:
        raise ManifestError(
            "M3GU reduced4 training smoke requires --output-dir "
            "output/m3gu-reduced4-local-training-smoke"
        )
    if resolved.exists():
        raise ManifestError(
            "M3GU reduced4 training smoke requires output/m3gu-reduced4-local-training-smoke "
            "to be absent before the guarded dry-run and single fitting attempt"
        )
    for filename in ("model_state.pt", "training-provenance.json"):
        if (resolved / filename).exists():
            raise ManifestError(f"M3GU reduced4 expected output already exists: {resolved / filename}")


def validate_m3gu_reduced4_training_smoke_invocation(args: argparse.Namespace) -> None:
    if args.architecture != TRUE_TEMPORAL_CONVNET_ARCHITECTURE:
        raise ManifestError(
            "M3GU reduced4 training smoke requires "
            f"--architecture {TRUE_TEMPORAL_CONVNET_ARCHITECTURE}"
        )
    require_m3gu_reduced4_manifest_path(args.train_manifest, "train")
    require_m3gu_reduced4_manifest_path(args.validation_manifest, "validation")
    require_m3gu_reduced4_manifest_path(args.test_manifest, "test")
    require_m3gu_reduced4_unused_output_dir(args.output_dir)
    if not args.check_files:
        raise ManifestError("M3GU reduced4 training smoke requires --check-files")
    if args.frame_count != 16:
        raise ManifestError("M3GU reduced4 training smoke requires --frame-count 16")
    if args.image_size != 96:
        raise ManifestError("M3GU reduced4 training smoke requires --image-size 96")
    if args.epochs > MAX_M3GU_REDUCED4_TRAINING_SMOKE_EPOCHS:
        raise ManifestError(
            "M3GU reduced4 training smoke is bounded to "
            f"{MAX_M3GU_REDUCED4_TRAINING_SMOKE_EPOCHS} epochs"
        )
    if args.batch_size > MAX_M3GU_REDUCED4_TRAINING_SMOKE_BATCH_SIZE:
        raise ManifestError(
            "M3GU reduced4 training smoke is bounded to batch size "
            f"{MAX_M3GU_REDUCED4_TRAINING_SMOKE_BATCH_SIZE}"
        )
    if args.max_train_batches is None:
        raise ManifestError("M3GU reduced4 training smoke requires --max-train-batches")
    if args.max_train_batches > MAX_M3GU_REDUCED4_TRAINING_SMOKE_TRAIN_BATCHES:
        raise ManifestError(
            "M3GU reduced4 training smoke is bounded to max train batches "
            f"{MAX_M3GU_REDUCED4_TRAINING_SMOKE_TRAIN_BATCHES}"
        )
    if args.max_validation_batches is None:
        raise ManifestError("M3GU reduced4 training smoke requires --max-validation-batches")
    if args.max_validation_batches > MAX_M3GU_REDUCED4_TRAINING_SMOKE_VALIDATION_BATCHES:
        raise ManifestError(
            "M3GU reduced4 training smoke is bounded to max validation batches "
            f"{MAX_M3GU_REDUCED4_TRAINING_SMOKE_VALIDATION_BATCHES}"
        )
    if args.num_workers != 0:
        raise ManifestError("M3GU reduced4 training smoke requires --num-workers 0")
    if args.training_augmentation != "none":
        raise ManifestError("M3GU reduced4 training smoke requires --training-augmentation none")
    if args.checkpoint_selection != "best_validation":
        raise ManifestError("M3GU reduced4 training smoke requires --checkpoint-selection best_validation")
    if args.dry_run and args.require_input_contract != REGION_AWARE_DERIVED_INPUT:
        raise ManifestError(
            "M3GU reduced4 dry-run guard requires --require-input-contract rgb_regions_grid_v1"
        )


def reduced_real_data_module_manifest_policy(args: argparse.Namespace) -> tuple[str, str, str]:
    if args.require_input_contract == REGION_AWARE_DERIVED_INPUT:
        return (
            HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
            HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE,
            HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE,
        )
    return (
        REDUCED_REAL_DATA_TRAIN_MANIFEST_RELATIVE,
        REDUCED_REAL_DATA_VALIDATION_MANIFEST_RELATIVE,
        REDUCED_REAL_DATA_TEST_MANIFEST_RELATIVE,
    )


def popsign_label_ladder_size_for_manifest(actual: Path | None, split: str) -> int:
    if actual is None:
        raise ManifestError(f"PopSign label-ladder diagnostic requires --{split}-manifest")
    resolved = resolve_path_for_invocation_policy(actual)
    try:
        relative = resolved.relative_to(PROJECT_ROOT)
    except ValueError as error:
        raise ManifestError(f"PopSign label-ladder diagnostic manifest path escapes project root: {actual}") from error
    try:
        ladder_relative = relative.relative_to(Path(POPSIGN_LABEL_LADDER_MANIFEST_ROOT_RELATIVE))
    except ValueError as error:
        raise ManifestError(
            "PopSign label-ladder diagnostic requires manifests under "
            f"{POPSIGN_LABEL_LADDER_MANIFEST_ROOT_RELATIVE}"
        ) from error
    expected_file = f"{split}.json"
    if len(ladder_relative.parts) != 2 or ladder_relative.parts[1] != expected_file:
        raise ManifestError(
            f"PopSign label-ladder diagnostic requires {split} manifest path "
            f"{POPSIGN_LABEL_LADDER_MANIFEST_ROOT_RELATIVE}/NNN-labels/{expected_file}"
        )
    match = re.fullmatch(r"(\d{3})-labels", ladder_relative.parts[0])
    if not match:
        raise ManifestError("PopSign label-ladder diagnostic manifest directory must be NNN-labels")
    label_count = int(match.group(1))
    if label_count not in POPSIGN_LABEL_LADDER_LABEL_COUNTS:
        allowed = ", ".join(f"{value:03d}-labels" for value in POPSIGN_LABEL_LADDER_LABEL_COUNTS)
        raise ManifestError(f"PopSign label-ladder diagnostic supports only {allowed}")
    return label_count


def validate_popsign_label_ladder_invocation(args: argparse.Namespace) -> int:
    train_count = popsign_label_ladder_size_for_manifest(args.train_manifest, "train")
    validation_count = popsign_label_ladder_size_for_manifest(args.validation_manifest, "validation")
    test_count = popsign_label_ladder_size_for_manifest(args.test_manifest, "test")
    if len({train_count, validation_count, test_count}) != 1:
        raise ManifestError("PopSign label-ladder train/validation/test manifests must use one label count")
    return train_count


def validate_popsign_label_ladder_training_smoke_invocation(args: argparse.Namespace) -> int:
    label_count = validate_popsign_label_ladder_invocation(args)
    if label_count not in POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS:
        allowed = ", ".join(f"{value:03d}-labels" for value in POPSIGN_LABEL_LADDER_TRAINING_LABEL_COUNTS)
        raise ManifestError(f"PopSign label-ladder training smoke supports only {allowed}")
    return label_count


def require_popsign_label_ladder_absent_output_dir(output_dir: Path) -> None:
    resolved = resolve_output_dir_for_policy(output_dir)
    if resolved.exists():
        raise ManifestError(
            "PopSign label-ladder training smoke requires output directory to be absent "
            f"before dry-run and fitting attempt: {project_relative(resolved)}"
        )


def validate_m3hh_popsign25_full_exposure_invocation(
    args: argparse.Namespace,
    label_count: int,
) -> None:
    if label_count != M3HH_POPSIGN25_FULL_EXPOSURE_LABEL_COUNT:
        raise ManifestError("M3HH PopSign full-exposure contract requires the 025-labels manifests")
    if args.model_id != "m3hh-popsign25-full-exposure-bounded-brev-contract":
        raise ManifestError(
            "M3HH PopSign full-exposure contract requires "
            "--model-id m3hh-popsign25-full-exposure-bounded-brev-contract"
        )
    if args.architecture != TRUE_TEMPORAL_CONVNET_ARCHITECTURE:
        raise ManifestError(
            "M3HH PopSign full-exposure contract requires "
            f"--architecture {TRUE_TEMPORAL_CONVNET_ARCHITECTURE}"
        )
    if args.epochs != 1:
        raise ManifestError("M3HH PopSign full-exposure contract requires --epochs 1")
    if args.batch_size != MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_BATCH_SIZE:
        raise ManifestError(
            "M3HH PopSign full-exposure contract requires "
            f"--batch-size {MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_BATCH_SIZE}"
        )
    if args.learning_rate != 0.001:
        raise ManifestError("M3HH PopSign full-exposure contract requires --learning-rate 0.001")
    if args.max_train_batches != M3HH_POPSIGN25_FULL_EXPOSURE_BATCHES:
        raise ManifestError(
            "M3HH PopSign full-exposure contract requires "
            f"--max-train-batches {M3HH_POPSIGN25_FULL_EXPOSURE_BATCHES}"
        )
    if args.max_validation_batches != M3HH_POPSIGN25_FULL_EXPOSURE_BATCHES:
        raise ManifestError(
            "M3HH PopSign full-exposure contract requires "
            f"--max-validation-batches {M3HH_POPSIGN25_FULL_EXPOSURE_BATCHES}"
        )


def validate_training_invocation(args: argparse.Namespace) -> None:
    if args.require_input_contract and not args.dry_run:
        raise ManifestError("--require-input-contract is a no-training input-contract audit and requires --dry-run")
    if args.require_input_contract and not args.check_files:
        raise ManifestError("--require-input-contract requires --check-files so tensor hashes are verified")
    if args.lesson_milestone and args.allow_small_label_set:
        raise ManifestError("--lesson-milestone cannot be combined with --allow-small-label-set")
    if args.reduced_real_data_module and args.allow_small_label_set:
        raise ManifestError("--reduced-real-data-module cannot be combined with --allow-small-label-set")
    if args.reduced_real_data_training_smoke and args.allow_small_label_set:
        raise ManifestError("--reduced-real-data-training-smoke cannot be combined with --allow-small-label-set")
    if args.region_grid_tcn_training_smoke and args.allow_small_label_set:
        raise ManifestError("--region-grid-tcn-training-smoke cannot be combined with --allow-small-label-set")
    if args.popsign_fresh5_training_smoke and args.allow_small_label_set:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --allow-small-label-set")
    if args.popsign_label_ladder_diagnostic and args.allow_small_label_set:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --allow-small-label-set")
    if args.popsign_label_ladder_training_smoke and args.allow_small_label_set:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --allow-small-label-set")
    if args.reduced_real_data_module and args.lesson_milestone:
        raise ManifestError("--reduced-real-data-module cannot be combined with --lesson-milestone")
    if args.reduced_real_data_training_smoke and args.lesson_milestone:
        raise ManifestError("--reduced-real-data-training-smoke cannot be combined with --lesson-milestone")
    if args.region_grid_tcn_training_smoke and args.lesson_milestone:
        raise ManifestError("--region-grid-tcn-training-smoke cannot be combined with --lesson-milestone")
    if args.popsign_fresh5_training_smoke and args.lesson_milestone:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --lesson-milestone")
    if args.popsign_label_ladder_diagnostic and args.lesson_milestone:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --lesson-milestone")
    if args.popsign_label_ladder_training_smoke and args.lesson_milestone:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --lesson-milestone")
    if args.reduced_real_data_training_smoke and args.reduced_real_data_module:
        raise ManifestError("--reduced-real-data-training-smoke cannot be combined with --reduced-real-data-module")
    if args.region_grid_tcn_training_smoke and args.reduced_real_data_module:
        raise ManifestError("--region-grid-tcn-training-smoke cannot be combined with --reduced-real-data-module")
    if args.popsign_fresh5_training_smoke and args.reduced_real_data_module:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --reduced-real-data-module")
    if args.popsign_label_ladder_diagnostic and args.reduced_real_data_module:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --reduced-real-data-module")
    if args.popsign_label_ladder_training_smoke and args.reduced_real_data_module:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --reduced-real-data-module")
    if args.region_grid_tcn_training_smoke and args.reduced_real_data_training_smoke:
        raise ManifestError("--region-grid-tcn-training-smoke cannot be combined with --reduced-real-data-training-smoke")
    if args.popsign_fresh5_training_smoke and args.reduced_real_data_training_smoke:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --reduced-real-data-training-smoke")
    if args.popsign_label_ladder_diagnostic and args.reduced_real_data_training_smoke:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --reduced-real-data-training-smoke")
    if args.popsign_label_ladder_training_smoke and args.reduced_real_data_training_smoke:
        raise ManifestError(
            "--popsign-label-ladder-training-smoke cannot be combined with --reduced-real-data-training-smoke"
        )
    if args.popsign_fresh5_training_smoke and args.region_grid_tcn_training_smoke:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --region-grid-tcn-training-smoke")
    if args.popsign_label_ladder_diagnostic and args.region_grid_tcn_training_smoke:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --region-grid-tcn-training-smoke")
    if args.popsign_label_ladder_training_smoke and args.region_grid_tcn_training_smoke:
        raise ManifestError(
            "--popsign-label-ladder-training-smoke cannot be combined with --region-grid-tcn-training-smoke"
        )
    if args.popsign_label_ladder_diagnostic and args.popsign_fresh5_training_smoke:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --popsign-fresh5-training-smoke")
    if args.popsign_label_ladder_training_smoke and args.popsign_fresh5_training_smoke:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --popsign-fresh5-training-smoke")
    if args.popsign_label_ladder_training_smoke and args.popsign_label_ladder_diagnostic:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --popsign-label-ladder-diagnostic")
    if args.reduced_real_data_module and args.controlled_clip_heldout:
        raise ManifestError("--reduced-real-data-module cannot be combined with --controlled-clip-heldout")
    if args.reduced_real_data_training_smoke and args.controlled_clip_heldout:
        raise ManifestError("--reduced-real-data-training-smoke cannot be combined with --controlled-clip-heldout")
    if args.region_grid_tcn_training_smoke and args.controlled_clip_heldout:
        raise ManifestError("--region-grid-tcn-training-smoke cannot be combined with --controlled-clip-heldout")
    if args.popsign_fresh5_training_smoke and args.controlled_clip_heldout:
        raise ManifestError("--popsign-fresh5-training-smoke cannot be combined with --controlled-clip-heldout")
    if args.popsign_label_ladder_diagnostic and args.controlled_clip_heldout:
        raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with --controlled-clip-heldout")
    if args.popsign_label_ladder_training_smoke and args.controlled_clip_heldout:
        raise ManifestError("--popsign-label-ladder-training-smoke cannot be combined with --controlled-clip-heldout")
    if args.controlled_clip_heldout and args.allow_small_label_set:
        raise ManifestError("--controlled-clip-heldout cannot be combined with --allow-small-label-set")
    if args.m3gu_reduced4_training_smoke:
        conflicting_modes = (
            ("--allow-small-label-set", args.allow_small_label_set),
            ("--lesson-milestone", args.lesson_milestone),
            ("--reduced-real-data-module", args.reduced_real_data_module),
            ("--reduced-real-data-training-smoke", args.reduced_real_data_training_smoke),
            ("--region-grid-tcn-training-smoke", args.region_grid_tcn_training_smoke),
            ("--popsign-fresh5-training-smoke", args.popsign_fresh5_training_smoke),
            ("--popsign-label-ladder-diagnostic", args.popsign_label_ladder_diagnostic),
            ("--popsign-label-ladder-training-smoke", args.popsign_label_ladder_training_smoke),
            ("--controlled-clip-heldout", args.controlled_clip_heldout),
        )
        for flag_name, enabled in conflicting_modes:
            if enabled:
                raise ManifestError(f"--m3gu-reduced4-training-smoke cannot be combined with {flag_name}")
    if args.controlled_clip_heldout and args.lesson_milestone:
        raise ManifestError("--controlled-clip-heldout cannot be combined with --lesson-milestone")
    if args.lesson_milestone and (
        args.max_train_batches is not None or args.max_validation_batches is not None
    ):
        raise ManifestError("--lesson-milestone cannot be combined with capped batch smoke options")
    if args.controlled_clip_heldout and (
        args.max_train_batches is not None or args.max_validation_batches is not None
    ):
        raise ManifestError("--controlled-clip-heldout cannot be combined with capped batch smoke options")
    if args.reduced_real_data_module and (
        args.max_train_batches is not None or args.max_validation_batches is not None
    ):
        raise ManifestError("--reduced-real-data-module cannot be combined with capped batch smoke options")
    if args.reduced_real_data_training_smoke and (
        args.max_train_batches is not None or args.max_validation_batches is not None
    ):
        raise ManifestError("--reduced-real-data-training-smoke cannot be combined with capped batch smoke options")
    mode = training_evidence_mode(args)
    if mode == "popsign_label_ladder_diagnostic":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                "PopSign label-ladder diagnostic requires "
                f"--architecture one of {', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        validate_popsign_label_ladder_invocation(args)
        if resolve_output_dir_for_policy(args.output_dir) != POPSIGN_LABEL_LADDER_OUTPUT_DIR:
            raise ManifestError(
                "PopSign label-ladder diagnostic requires --output-dir "
                f"{POPSIGN_LABEL_LADDER_OUTPUT_DIR_RELATIVE}"
            )
        if not args.check_files:
            raise ManifestError("PopSign label-ladder diagnostic requires --check-files so raw video hashes are verified")
        if not args.dry_run:
            raise ManifestError("PopSign label-ladder diagnostic is no-training and requires --dry-run")
        if args.max_train_batches is not None or args.max_validation_batches is not None:
            raise ManifestError("--popsign-label-ladder-diagnostic cannot be combined with capped batch smoke options")
        return
    if mode == "popsign_label_ladder_training_smoke":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                "PopSign label-ladder training smoke requires "
                f"--architecture one of {', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        label_count = validate_popsign_label_ladder_training_smoke_invocation(args)
        output_dir = resolve_output_dir_for_policy(args.output_dir)
        if output_dir not in POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIRS:
            allowed_output_dirs = ", ".join(POPSIGN_LABEL_LADDER_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES)
            raise ManifestError(
                "PopSign label-ladder training smoke requires --output-dir "
                f"one of: {allowed_output_dirs}"
            )
        require_popsign_label_ladder_absent_output_dir(args.output_dir)
        is_m3hh_full_exposure = output_dir == POPSIGN_LABEL_LADDER_M3HH_FULL_EXPOSURE_OUTPUT_DIR
        if not args.check_files:
            raise ManifestError(
                "PopSign label-ladder training smoke requires --check-files so raw video and tensor hashes are verified"
            )
        if args.frame_count != 16:
            raise ManifestError("PopSign label-ladder training smoke requires --frame-count 16")
        if args.image_size != 96:
            raise ManifestError("PopSign label-ladder training smoke requires --image-size 96")
        if args.epochs > MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_EPOCHS:
            raise ManifestError(
                "PopSign label-ladder training smoke is bounded to "
                f"{MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_EPOCHS} epoch"
            )
        if args.batch_size > MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_BATCH_SIZE:
            raise ManifestError(
                "PopSign label-ladder training smoke is bounded to batch size "
                f"{MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_BATCH_SIZE}"
            )
        if is_m3hh_full_exposure:
            validate_m3hh_popsign25_full_exposure_invocation(args, label_count)
        else:
            if args.max_train_batches is None:
                raise ManifestError("PopSign label-ladder training smoke requires --max-train-batches")
            if args.max_train_batches > MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_TRAIN_BATCHES:
                raise ManifestError(
                    "PopSign label-ladder training smoke is bounded to max train batches "
                    f"{MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_TRAIN_BATCHES}"
                )
            if args.max_validation_batches is None:
                raise ManifestError("PopSign label-ladder training smoke requires --max-validation-batches")
            if args.max_validation_batches > MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_VALIDATION_BATCHES:
                raise ManifestError(
                    "PopSign label-ladder training smoke is bounded to max validation batches "
                    f"{MAX_POPSIGN_LABEL_LADDER_TRAINING_SMOKE_VALIDATION_BATCHES}"
                )
        if args.num_workers != 0:
            raise ManifestError("PopSign label-ladder training smoke requires --num-workers 0")
        if args.training_augmentation != "none":
            raise ManifestError("PopSign label-ladder training smoke requires --training-augmentation none")
        if args.checkpoint_selection != "best_validation":
            raise ManifestError("PopSign label-ladder training smoke requires --checkpoint-selection best_validation")
        return
    if mode == "final":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                f"final training requires --architecture one of {', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        require_final_invocation_path(
            args.train_manifest,
            FINAL_TRAIN_MANIFEST_RELATIVE,
            FINAL_TRAIN_MANIFEST_REQUIRED_MESSAGE,
        )
        require_final_invocation_path(
            args.validation_manifest,
            FINAL_VALIDATION_MANIFEST_RELATIVE,
            FINAL_VALIDATION_MANIFEST_REQUIRED_MESSAGE,
        )
        require_final_invocation_path(
            args.test_manifest,
            FINAL_TEST_MANIFEST_RELATIVE,
            FINAL_TEST_MANIFEST_REQUIRED_MESSAGE,
        )
        if resolve_output_dir_for_policy(args.output_dir) != FINAL_OUTPUT_DIR:
            raise ManifestError("final training requires --output-dir artifacts/rawframe-model")
        if not args.check_files:
            raise ManifestError("final training requires --check-files so raw video paths and hashes are verified")
        return
    if mode == "lesson_milestone":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                f"lesson milestone training requires --architecture one of {', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        require_final_invocation_path(
            args.train_manifest,
            LESSON_MILESTONE_TRAIN_MANIFEST_RELATIVE,
            f"lesson milestone training requires --train-manifest {LESSON_MILESTONE_TRAIN_MANIFEST_RELATIVE}",
        )
        require_final_invocation_path(
            args.validation_manifest,
            LESSON_MILESTONE_VALIDATION_MANIFEST_RELATIVE,
            f"lesson milestone training requires --validation-manifest {LESSON_MILESTONE_VALIDATION_MANIFEST_RELATIVE}",
        )
        require_final_invocation_path(
            args.test_manifest,
            LESSON_MILESTONE_TEST_MANIFEST_RELATIVE,
            f"lesson milestone training requires --test-manifest {LESSON_MILESTONE_TEST_MANIFEST_RELATIVE}",
        )
        if resolve_output_dir_for_policy(args.output_dir) != LESSON_MILESTONE_OUTPUT_DIR:
            raise ManifestError("lesson milestone training requires --output-dir artifacts/rawframe-lesson-milestone")
        if not args.check_files:
            raise ManifestError("lesson milestone training requires --check-files so raw video paths and hashes are verified")
        return
    if mode == "reduced_real_data_module":
        train_manifest, validation_manifest, test_manifest = reduced_real_data_module_manifest_policy(args)
        require_final_invocation_path(
            args.train_manifest,
            train_manifest,
            f"reduced real-data module validation requires --train-manifest {train_manifest}",
        )
        require_final_invocation_path(
            args.validation_manifest,
            validation_manifest,
            (
                "reduced real-data module validation requires --validation-manifest "
                f"{validation_manifest}"
            ),
        )
        require_final_invocation_path(
            args.test_manifest,
            test_manifest,
            f"reduced real-data module validation requires --test-manifest {test_manifest}",
        )
        if resolve_output_dir_for_policy(args.output_dir) != REDUCED_REAL_DATA_OUTPUT_DIR:
            raise ManifestError(
                "reduced real-data module validation requires --output-dir artifacts/rawframe-high-signal-module"
            )
        if not args.check_files:
            raise ManifestError(
                "reduced real-data module validation requires --check-files so raw video and tensor hashes are verified"
            )
        if not args.dry_run:
            raise ManifestError("reduced real-data module validation is no-training and requires --dry-run")
        return
    if mode == "reduced_real_data_training_smoke":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                "reduced real-data training smoke requires --architecture one of "
                f"{', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        require_final_invocation_path(
            args.train_manifest,
            REDUCED_REAL_DATA_TRAIN_MANIFEST_RELATIVE,
            (
                "reduced real-data training smoke requires --train-manifest "
                f"{REDUCED_REAL_DATA_TRAIN_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.validation_manifest,
            REDUCED_REAL_DATA_VALIDATION_MANIFEST_RELATIVE,
            (
                "reduced real-data training smoke requires --validation-manifest "
                f"{REDUCED_REAL_DATA_VALIDATION_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.test_manifest,
            REDUCED_REAL_DATA_TEST_MANIFEST_RELATIVE,
            (
                "reduced real-data training smoke requires --test-manifest "
                f"{REDUCED_REAL_DATA_TEST_MANIFEST_RELATIVE}"
            ),
        )
        if resolve_output_dir_for_policy(args.output_dir) != REDUCED_REAL_DATA_TRAINING_SMOKE_OUTPUT_DIR:
            raise ManifestError(
                "reduced real-data training smoke requires "
                "--output-dir output/m3aq-reduced-module-local-smoke"
            )
        if not args.check_files:
            raise ManifestError(
                "reduced real-data training smoke requires --check-files so raw video and tensor hashes are verified"
            )
        if args.epochs > MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_EPOCHS:
            raise ManifestError(
                "reduced real-data training smoke is bounded to "
                f"{MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_EPOCHS} epochs"
            )
        if args.batch_size > MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_BATCH_SIZE:
            raise ManifestError(
                "reduced real-data training smoke is bounded to batch size "
                f"{MAX_REDUCED_REAL_DATA_TRAINING_SMOKE_BATCH_SIZE}"
            )
        if args.num_workers != 0:
            raise ManifestError("reduced real-data training smoke requires --num-workers 0")
        return
    if mode == "m3gu_reduced4_training_smoke":
        validate_m3gu_reduced4_training_smoke_invocation(args)
        return
    if mode == "region_grid_tcn_training_smoke":
        if args.architecture != TRUE_TEMPORAL_CONVNET_ARCHITECTURE:
            raise ManifestError(
                "region-grid TCN training smoke requires "
                f"--architecture {TRUE_TEMPORAL_CONVNET_ARCHITECTURE}"
            )
        require_final_invocation_path(
            args.train_manifest,
            HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE,
            (
                "region-grid TCN training smoke requires --train-manifest "
                f"{HIGH_SIGNAL_REGION_GRID_TRAIN_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.validation_manifest,
            HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE,
            (
                "region-grid TCN training smoke requires --validation-manifest "
                f"{HIGH_SIGNAL_REGION_GRID_VALIDATION_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.test_manifest,
            HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE,
            (
                "region-grid TCN training smoke requires --test-manifest "
                f"{HIGH_SIGNAL_REGION_GRID_TEST_MANIFEST_RELATIVE}"
            ),
        )
        output_dir = resolve_output_dir_for_policy(args.output_dir)
        if output_dir not in (
            REGION_GRID_TCN_TRAINING_SMOKE_OUTPUT_DIR,
            *REGION_GRID_TCN_FULL_SPLIT_BREV_SMOKE_OUTPUT_DIRS,
        ):
            raise ManifestError(
                "region-grid TCN training smoke requires "
                "--output-dir output/m3aw-region-grid-tcn-local-smoke "
                "or one of output/m3dm-high-signal-region-grid-tcn-brev, "
                "output/m3dq-high-signal-region-grid-tcn-brev, "
                "output/m3eh-high-signal-region-grid-tcn-brev, "
                "output/m3er-high-signal-region-grid-tcn-brev, "
                "output/m3gb-high-signal-region-grid-tcn-brev, "
                "output/m3gk-high-signal-region-grid-tcn-brev-seed20260529, "
                "output/m3gl-high-signal-region-grid-tcn-brev-seed20260530"
            )
        if not args.check_files:
            raise ManifestError(
                "region-grid TCN training smoke requires --check-files so raw video and tensor hashes are verified"
            )
        if args.frame_count != 16:
            raise ManifestError("region-grid TCN training smoke requires --frame-count 16")
        if args.image_size != 96:
            raise ManifestError("region-grid TCN training smoke requires --image-size 96")
        if output_dir == REGION_GRID_TCN_TRAINING_SMOKE_OUTPUT_DIR:
            if args.epochs > MAX_REGION_GRID_TCN_TRAINING_SMOKE_EPOCHS:
                raise ManifestError(
                    "M3AW region-grid TCN training smoke is bounded to "
                    f"{MAX_REGION_GRID_TCN_TRAINING_SMOKE_EPOCHS} epochs"
                )
            if args.batch_size > MAX_REGION_GRID_TCN_TRAINING_SMOKE_BATCH_SIZE:
                raise ManifestError(
                    "M3AW region-grid TCN training smoke is bounded to batch size "
                    f"{MAX_REGION_GRID_TCN_TRAINING_SMOKE_BATCH_SIZE}"
                )
            if args.max_train_batches is None:
                raise ManifestError("M3AW region-grid TCN training smoke requires --max-train-batches")
            if args.max_train_batches > MAX_REGION_GRID_TCN_TRAINING_SMOKE_TRAIN_BATCHES:
                raise ManifestError(
                    "M3AW region-grid TCN training smoke is bounded to max train batches "
                    f"{MAX_REGION_GRID_TCN_TRAINING_SMOKE_TRAIN_BATCHES}"
                )
            if args.max_validation_batches is None:
                raise ManifestError("M3AW region-grid TCN training smoke requires --max-validation-batches")
            if args.max_validation_batches > MAX_REGION_GRID_TCN_TRAINING_SMOKE_VALIDATION_BATCHES:
                raise ManifestError(
                    "M3AW region-grid TCN training smoke is bounded to max validation batches "
                    f"{MAX_REGION_GRID_TCN_TRAINING_SMOKE_VALIDATION_BATCHES}"
                )
            if args.num_workers != 0:
                raise ManifestError("M3AW region-grid TCN training smoke requires --num-workers 0")
            if args.training_augmentation != "none":
                raise ManifestError("M3AW region-grid TCN training smoke requires --training-augmentation none")
            return
        if args.epochs > MAX_REGION_GRID_TCN_BREV_SMOKE_EPOCHS:
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke is bounded to "
                f"{MAX_REGION_GRID_TCN_BREV_SMOKE_EPOCHS} epochs"
            )
        if args.batch_size > MAX_REGION_GRID_TCN_BREV_SMOKE_BATCH_SIZE:
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke is bounded to batch size "
                f"{MAX_REGION_GRID_TCN_BREV_SMOKE_BATCH_SIZE}"
            )
        if args.max_train_batches is not None:
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke requires full train split without --max-train-batches"
            )
        if args.max_validation_batches is not None:
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke requires full validation split without --max-validation-batches"
            )
        if args.num_workers > MAX_REGION_GRID_TCN_BREV_SMOKE_NUM_WORKERS:
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke is bounded to --num-workers "
                f"{MAX_REGION_GRID_TCN_BREV_SMOKE_NUM_WORKERS}"
            )
        if args.training_augmentation != "mild":
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke requires --training-augmentation mild"
            )
        if args.checkpoint_selection != "best_validation":
            raise ManifestError(
                "M3DM/M3DQ/M3EH/M3ER/M3GB/M3GK region-grid TCN Brev smoke requires --checkpoint-selection best_validation"
            )
        return
    if mode == "popsign_fresh5_training_smoke":
        allowed_popsign_architectures = (
            SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE,
            SCRATCH_MOTION_REGION_TOKEN_TEMPORAL_ARCHITECTURE,
        )
        if args.architecture not in allowed_popsign_architectures:
            raise ManifestError(
                "PopSign fresh5 training smoke requires "
                "--architecture one of " + ", ".join(allowed_popsign_architectures)
            )
        require_final_invocation_path(
            args.train_manifest,
            POPSIGN_FRESH5_REPAIRED_TRAIN_MANIFEST_RELATIVE,
            (
                "PopSign fresh5 training smoke requires --train-manifest "
                f"{POPSIGN_FRESH5_REPAIRED_TRAIN_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.validation_manifest,
            POPSIGN_FRESH5_REPAIRED_VALIDATION_MANIFEST_RELATIVE,
            (
                "PopSign fresh5 training smoke requires --validation-manifest "
                f"{POPSIGN_FRESH5_REPAIRED_VALIDATION_MANIFEST_RELATIVE}"
            ),
        )
        require_final_invocation_path(
            args.test_manifest,
            POPSIGN_FRESH5_REPAIRED_TEST_MANIFEST_RELATIVE,
            (
                "PopSign fresh5 training smoke requires --test-manifest "
                f"{POPSIGN_FRESH5_REPAIRED_TEST_MANIFEST_RELATIVE}"
            ),
        )
        if resolve_output_dir_for_policy(args.output_dir) not in POPSIGN_FRESH5_TRAINING_SMOKE_OUTPUT_DIRS:
            raise ManifestError(
                "PopSign fresh5 training smoke requires --output-dir "
                + " or ".join(POPSIGN_FRESH5_TRAINING_SMOKE_OUTPUT_DIR_RELATIVES)
            )
        if not args.check_files:
            raise ManifestError(
                "PopSign fresh5 training smoke requires --check-files so raw video and tensor hashes are verified"
            )
        if args.frame_count != 16:
            raise ManifestError("PopSign fresh5 training smoke requires --frame-count 16")
        if args.image_size != 96:
            raise ManifestError("PopSign fresh5 training smoke requires --image-size 96")
        if args.epochs > MAX_POPSIGN_FRESH5_TRAINING_SMOKE_EPOCHS:
            raise ManifestError(
                "PopSign fresh5 training smoke is bounded to "
                f"{MAX_POPSIGN_FRESH5_TRAINING_SMOKE_EPOCHS} epochs"
            )
        if args.batch_size > MAX_POPSIGN_FRESH5_TRAINING_SMOKE_BATCH_SIZE:
            raise ManifestError(
                "PopSign fresh5 training smoke is bounded to batch size "
                f"{MAX_POPSIGN_FRESH5_TRAINING_SMOKE_BATCH_SIZE}"
            )
        if args.max_train_batches is None:
            raise ManifestError("PopSign fresh5 training smoke requires --max-train-batches")
        if args.max_train_batches > MAX_POPSIGN_FRESH5_TRAINING_SMOKE_TRAIN_BATCHES:
            raise ManifestError(
                "PopSign fresh5 training smoke is bounded to max train batches "
                f"{MAX_POPSIGN_FRESH5_TRAINING_SMOKE_TRAIN_BATCHES}"
            )
        if args.max_validation_batches is None:
            raise ManifestError("PopSign fresh5 training smoke requires --max-validation-batches")
        if args.max_validation_batches > MAX_POPSIGN_FRESH5_TRAINING_SMOKE_VALIDATION_BATCHES:
            raise ManifestError(
                "PopSign fresh5 training smoke is bounded to max validation batches "
                f"{MAX_POPSIGN_FRESH5_TRAINING_SMOKE_VALIDATION_BATCHES}"
            )
        if args.num_workers != 0:
            raise ManifestError("PopSign fresh5 training smoke requires --num-workers 0")
        if args.training_augmentation != "none":
            raise ManifestError("PopSign fresh5 training smoke requires --training-augmentation none")
        return
    if mode == "controlled_clip_heldout":
        if args.architecture not in FINAL_MODEL_ARCHITECTURES:
            raise ManifestError(
                f"controlled clip-heldout training requires --architecture one of {', '.join(FINAL_MODEL_ARCHITECTURES)}; "
                f"{FRAME_MEAN_CNN_ARCHITECTURE} is smoke/wiring-only"
            )
        require_final_invocation_path(
            args.train_manifest,
            CONTROLLED_CLIP_HELDOUT_TRAIN_MANIFEST_RELATIVE,
            f"controlled clip-heldout training requires --train-manifest {CONTROLLED_CLIP_HELDOUT_TRAIN_MANIFEST_RELATIVE}",
        )
        require_final_invocation_path(
            args.validation_manifest,
            CONTROLLED_CLIP_HELDOUT_VALIDATION_MANIFEST_RELATIVE,
            f"controlled clip-heldout training requires --validation-manifest {CONTROLLED_CLIP_HELDOUT_VALIDATION_MANIFEST_RELATIVE}",
        )
        require_final_invocation_path(
            args.test_manifest,
            CONTROLLED_CLIP_HELDOUT_TEST_MANIFEST_RELATIVE,
            f"controlled clip-heldout training requires --test-manifest {CONTROLLED_CLIP_HELDOUT_TEST_MANIFEST_RELATIVE}",
        )
        if resolve_output_dir_for_policy(args.output_dir) != CONTROLLED_CLIP_HELDOUT_OUTPUT_DIR:
            raise ManifestError("controlled clip-heldout training requires --output-dir artifacts/rawframe-model-clip-heldout")
        if not args.check_files:
            raise ManifestError("controlled clip-heldout training requires --check-files so raw video paths and hashes are verified")
        return
    if not args.dry_run and resolve_output_dir_for_policy(args.output_dir) == FINAL_OUTPUT_DIR:
        raise ManifestError(
            "smoke training runs must not write to the final artifact directory "
            "artifacts/rawframe-model; pass a smoke-only --output-dir or use --dry-run"
        )


def tensor_shape(torch: Any, value: Any) -> list[int] | None:
    if torch.is_tensor(value):
        return [int(dimension) for dimension in value.shape]
    return None


def derive_region_grid_frames(
    torch: Any,
    regions: Any,
    region_ids: list[str],
    context: str,
) -> tuple[Any, dict[str, Any]]:
    if not torch.is_tensor(regions):
        raise TrainingError(f"{context} rgb_regions payload is not a tensor")
    if regions.ndim != 5:
        raise TrainingError(
            f"{context} rgb_regions tensor must be 5D as T,R,H,W,C; got {tuple(regions.shape)}"
        )
    if int(regions.shape[-1]) != 3:
        raise TrainingError(
            f"{context} rgb_regions tensor must end with 3 RGB channels; got {tuple(regions.shape)}"
        )
    region_count = int(regions.shape[1])
    if region_count <= 0:
        raise TrainingError(f"{context} rgb_regions tensor has no region axis entries")
    if len(region_ids) != region_count:
        raise TrainingError(
            f"{context} region_ids length {len(region_ids)} does not match rgb_regions region axis {region_count}"
        )

    columns = int(math.ceil(math.sqrt(region_count)))
    rows = int(math.ceil(region_count / columns))
    time_count, _, height, width, channels = [int(value) for value in regions.shape]
    grid = regions.new_zeros((time_count, rows, height, columns, width, channels))
    for region_index in range(region_count):
        row = region_index // columns
        column = region_index % columns
        grid[:, row, :, column, :, :] = regions[:, region_index, :, :, :]
    derived = grid.reshape(time_count, rows * height, columns * width, channels).contiguous()
    return derived, {
        "name": REGION_AWARE_DERIVED_INPUT,
        "source_tensor_key": "rgb_regions",
        "source_region_axis": "T,R,H,W,C",
        "output_axis": REGION_AWARE_DERIVED_INPUT_AXIS,
        "region_order": region_ids,
        "grid_layout": {
            "rows": rows,
            "columns": columns,
            "empty_cells": rows * columns - region_count,
        },
        "source_shape": [time_count, region_count, height, width, channels],
        "output_shape": [int(value) for value in derived.shape],
    }


def load_tensor_file_with_contract(
    torch: Any,
    path: Path,
    preserve_region_axis: bool = False,
) -> tuple[Any, dict[str, Any]]:
    try:
        loaded = torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        loaded = torch.load(path, map_location="cpu")
    except Exception as error:  # noqa: BLE001 - keep the user-facing error precise.
        raise TrainingError(f"decoded frame tensor could not be loaded: {path}: {error}") from error

    contract: dict[str, Any] = {
        "training_loader": {
            "source": "scripts/train_rawframe_model.py::load_tensor_file_with_contract",
            "accepted_tensor_keys_in_order": ["rgb_regions", "frames", "tensor", "rgb_frames"],
            "rgb_regions_in_loader_key_order": True,
        },
        "payload_type": type(loaded).__name__,
        "fallback_to_rgb_frames": False,
    }
    if torch.is_tensor(loaded):
        if preserve_region_axis:
            raise TrainingError(
                f"{path} is a root tensor and does not contain rgb_regions required for region-axis-preserving input"
            )
        contract["training_loader"]["consumed_key"] = "tensor_file_root"
        contract["training_loader"]["consumed_shape"] = tensor_shape(torch, loaded)
        contract["rgb_regions_present"] = False
        contract["rgb_frames_present"] = False
        return loaded, contract
    if isinstance(loaded, dict):
        contract["payload_keys"] = sorted(str(key) for key in loaded)
        contract["payload_schema_version"] = loaded.get("schema_version")
        regions = loaded.get("rgb_regions")
        frames = loaded.get("rgb_frames")
        region_ids_raw = loaded.get("region_ids")
        region_ids = [str(region_id) for region_id in region_ids_raw] if isinstance(region_ids_raw, list) else []
        contract["rgb_regions_present"] = torch.is_tensor(regions)
        contract["rgb_regions_shape"] = tensor_shape(torch, regions)
        contract["rgb_frames_present"] = torch.is_tensor(frames)
        contract["rgb_frames_shape"] = tensor_shape(torch, frames)
        contract["region_axis"] = loaded.get("region_axis")
        contract["region_ids"] = region_ids
        if isinstance(loaded.get("rgb_frames_region_id"), str):
            contract["rgb_frames_region_id"] = loaded["rgb_frames_region_id"]

        if torch.is_tensor(regions):
            if preserve_region_axis:
                contract["training_loader"]["consumed_key"] = "rgb_regions"
                contract["training_loader"]["derived_input_name"] = REGION_AWARE_DERIVED_INPUT
                contract["training_loader"]["consumed_shape"] = tensor_shape(torch, regions)
                contract["training_loader"]["region_axis_preserved"] = True
                contract["training_loader"]["model_input_axis_before_prepare"] = REGION_AWARE_PRESERVED_INPUT_AXIS
                contract["derived_input"] = {
                    "name": REGION_AWARE_DERIVED_INPUT,
                    "source_tensor_key": "rgb_regions",
                    "source_region_axis": REGION_AWARE_PRESERVED_INPUT_AXIS,
                    "output_axis": REGION_AWARE_PRESERVED_INPUT_AXIS,
                    "region_order": region_ids,
                    "source_shape": tensor_shape(torch, regions),
                    "output_shape": tensor_shape(torch, regions),
                    "region_axis_preserved": True,
                }
                return regions, contract
            derived, derived_contract = derive_region_grid_frames(
                torch,
                regions,
                region_ids,
                str(path),
            )
            contract["training_loader"]["consumed_key"] = "rgb_regions"
            contract["training_loader"]["derived_input_name"] = REGION_AWARE_DERIVED_INPUT
            contract["training_loader"]["consumed_shape"] = tensor_shape(torch, derived)
            contract["derived_input"] = derived_contract
            return derived, contract

        for key in ("frames", "tensor", "rgb_frames"):
            value = loaded.get(key)
            if torch.is_tensor(value):
                if preserve_region_axis:
                    raise TrainingError(
                        f"{path} does not contain rgb_regions required for region-axis-preserving input"
                    )
                contract["training_loader"]["consumed_key"] = key
                contract["training_loader"]["consumed_shape"] = tensor_shape(torch, value)
                contract["fallback_to_rgb_frames"] = key == "rgb_frames"
                return value, contract
    raise TrainingError(
        f"decoded frame tensor file must contain a Tensor or a dict key named "
        f"'rgb_regions', 'frames', 'tensor', or 'rgb_frames': {path}"
    )


def load_tensor_file(torch: Any, path: Path, preserve_region_axis: bool = False) -> Any:
    frames, _contract = load_tensor_file_with_contract(torch, path, preserve_region_axis=preserve_region_axis)
    return frames


def tensor_path_for_clip(clip: dict[str, Any], manifest_path: Path, clip_context: str) -> Path:
    value = clip.get("relative_frame_tensor_path")
    if not isinstance(value, str) or not value.strip():
        raise TrainingError(
            f"{clip_context} is missing relative_frame_tensor_path; training requires "
            "pre-decoded raw RGB frame tensors. Run --dry-run to validate manifests only."
        )
    return resolve_training_relative_path(
        manifest_path,
        value,
        clip_context,
        "relative_frame_tensor_path",
    )


def expected_tensor_hash_for_clip(clip: dict[str, Any], clip_context: str) -> str:
    value = clip.get("frame_tensor_sha256")
    if not isinstance(value, str) or not value.strip():
        raise TrainingError(
            f"{clip_context} is missing frame_tensor_sha256; decoded frame tensors must be "
            "hash-pinned before training."
        )
    normalized = value.strip().lower()
    if len(normalized) != 64 or any(character not in "0123456789abcdef" for character in normalized):
        raise TrainingError(f"{clip_context} frame_tensor_sha256 must be a lowercase SHA-256 hex digest")
    return normalized


def observed_input_contract_name(contract: dict[str, Any]) -> str:
    training_loader = contract.get("training_loader")
    if not isinstance(training_loader, dict):
        return "unknown"
    consumed_key = training_loader.get("consumed_key")
    derived_input_name = training_loader.get("derived_input_name")
    if consumed_key == "rgb_regions" and derived_input_name == REGION_AWARE_DERIVED_INPUT:
        return REGION_AWARE_DERIVED_INPUT
    if consumed_key == "rgb_frames" and contract.get("fallback_to_rgb_frames") is True:
        return RGB_FRAMES_FALLBACK_INPUT_CONTRACT
    if isinstance(consumed_key, str) and consumed_key:
        return consumed_key
    return "unknown"


def input_contract_example(
    contract: dict[str, Any],
    clip: dict[str, Any],
    tensor_path: Path,
    observed_contract: str,
) -> dict[str, Any]:
    training_loader = contract.get("training_loader") if isinstance(contract.get("training_loader"), dict) else {}
    return {
        "clip_id": clip.get("clip_id"),
        "label_id": clip.get("label_id"),
        "tensor_path": project_relative(tensor_path),
        "observed_contract": observed_contract,
        "payload_type": contract.get("payload_type"),
        "payload_keys": contract.get("payload_keys"),
        "rgb_regions_present": contract.get("rgb_regions_present"),
        "rgb_regions_shape": contract.get("rgb_regions_shape"),
        "rgb_frames_present": contract.get("rgb_frames_present"),
        "rgb_frames_shape": contract.get("rgb_frames_shape"),
        "region_ids": contract.get("region_ids"),
        "training_loader": {
            "consumed_key": training_loader.get("consumed_key"),
            "derived_input_name": training_loader.get("derived_input_name"),
            "consumed_shape": training_loader.get("consumed_shape"),
            "region_axis_preserved": training_loader.get("region_axis_preserved"),
            "model_input_axis_before_prepare": training_loader.get("model_input_axis_before_prepare"),
            "fallback_to_rgb_frames": contract.get("fallback_to_rgb_frames"),
        },
    }


def validate_required_input_contracts(
    torch: Any,
    required_contract: str,
    manifests: list[dict[str, Any]],
    preserve_region_axis: bool = False,
    frame_count: int = 16,
    image_size: int = 96,
    batch_size: int = 4,
    num_workers: int = 0,
    forward_probe_architecture: str | None = None,
    seed: int | None = None,
) -> dict[str, Any]:
    report: dict[str, Any] = {
        "schema_version": "asl-pilot-input-contract-audit/v1",
        "source": "scripts/train_rawframe_model.py::validate_required_input_contracts",
        "required_contract": required_contract,
        "allowed_contracts": list(ALLOWED_INPUT_CONTRACT_REQUIREMENTS),
        "preserve_region_axis": preserve_region_axis,
        "pretrained_components": [],
        "splits": {},
        "total_clip_count": 0,
        "total_observed_counts": {},
        "status": "passed",
    }
    mismatches: list[str] = []

    for manifest in manifests:
        manifest_path = Path(str(manifest["path"]))
        manifest_data = load_manifest(manifest_path)
        split = str(manifest["split"])
        split_report: dict[str, Any] = {
            "manifest_path": str(manifest_path),
            "manifest_sha256": manifest["sha256"],
            "clip_count": 0,
            "observed_counts": {},
            "examples": {},
        }
        clips = manifest_data.get("clips")
        if not isinstance(clips, list):
            raise TrainingError(f"{manifest_path}: clips must be an array for input-contract audit")
        for index, clip in enumerate(clips):
            if not isinstance(clip, dict):
                raise TrainingError(f"{manifest_path}: clips[{index}] must be an object for input-contract audit")
            context = f"{manifest_path}: clips[{index}]"
            tensor_path = tensor_path_for_clip(clip, manifest_path, context)
            expected_hash = expected_tensor_hash_for_clip(clip, context)
            actual_hash = sha256_file(tensor_path)
            if actual_hash != expected_hash:
                raise TrainingError(
                    f"{context} decoded frame tensor hash mismatch for {tensor_path}; "
                    f"expected {expected_hash}, got {actual_hash}"
                )
            _, contract = load_tensor_file_with_contract(
                torch,
                tensor_path,
                preserve_region_axis=preserve_region_axis,
            )
            observed_contract = observed_input_contract_name(contract)
            split_report["clip_count"] += 1
            report["total_clip_count"] += 1
            split_report["observed_counts"][observed_contract] = (
                split_report["observed_counts"].get(observed_contract, 0) + 1
            )
            report["total_observed_counts"][observed_contract] = (
                report["total_observed_counts"].get(observed_contract, 0) + 1
            )
            if observed_contract not in split_report["examples"]:
                split_report["examples"][observed_contract] = input_contract_example(
                    contract,
                    clip,
                    tensor_path,
                    observed_contract,
                )
            if observed_contract != required_contract:
                mismatches.append(
                    f"{context} requires {required_contract} but observed {observed_contract} "
                    f"for {project_relative(tensor_path)}"
                )
        report["splits"][split] = split_report

        if preserve_region_axis:
            label_ids = sorted(str(label_id) for label_id in manifest["label_ids"])
            label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
            dataset = RawFrameClipDataset(
                torch,
                manifest_path,
                split,
                label_to_index,
                frame_count,
                image_size,
                require_decode_provenance=False,
                preserve_region_axis=True,
            )
            loader = torch.utils.data.DataLoader(
                dataset,
                batch_size=min(batch_size, len(dataset)),
                shuffle=False,
                num_workers=num_workers,
            )
            frames, labels = next(iter(loader))
            split_report["region_axis_batch_probe"] = {
                "batched_model_input_shape": tensor_shape(torch, frames),
                "batched_model_input_axis": "B,T,R,C,H,W",
                "labels_shape": tensor_shape(torch, labels),
            }
            if forward_probe_architecture:
                if seed is not None:
                    random.seed(seed)
                    torch.manual_seed(seed)
                model = build_model(torch, len(label_ids), forward_probe_architecture)
                model.eval()
                initial_model_state_digest = model_state_digest(model.state_dict())
                with torch.no_grad():
                    logits = model(frames)
                split_report["region_axis_forward_probe"] = {
                    "architecture": forward_probe_architecture,
                    "initialization": "random",
                    "random_initialization_evidence": {
                        "seed": seed,
                        "initial_model_state_digest": initial_model_state_digest,
                    },
                    "pretrained_components": [],
                    "logits_shape": tensor_shape(torch, logits),
                    "region_axis_preserved_until": "TrueTemporalConvNetRawFrameClassifier.region_attention",
                }

    if mismatches:
        report["status"] = "failed"
        report["first_mismatches"] = mismatches[:5]
        counts = json.dumps(report["total_observed_counts"], sort_keys=True)
        raise TrainingError(
            f"required input contract {required_contract} not satisfied; observed counts {counts}; "
            "first mismatches: " + "; ".join(mismatches[:5])
        )
    return report


class RawFrameClipDataset:
    def __init__(
        self,
        torch: Any,
        manifest_path: Path,
        split: str,
        label_to_index: dict[str, int],
        frame_count: int,
        image_size: int,
        require_decode_provenance: bool = False,
        training_augmentation: str = "none",
        preserve_region_axis: bool = False,
    ) -> None:
        self.torch = torch
        self.manifest_path = manifest_path
        self.split = split
        self.label_to_index = label_to_index
        self.frame_count = frame_count
        self.image_size = image_size
        self.training_augmentation = training_augmentation
        self.preserve_region_axis = preserve_region_axis
        if self.preserve_region_axis and self.training_augmentation not in {"none", "mild"}:
            raise TrainingError(
                "region-axis-preserving training currently supports training_augmentation=none or mild"
            )
        manifest = load_manifest(manifest_path)
        self.records: list[dict[str, Any]] = []

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
            label_id = clip["label_id"]
            if label_id not in label_to_index:
                raise TrainingError(f"{context} label_id is not in training label map: {label_id}")
            self.records.append(
                {
                    "clip_id": clip["clip_id"],
                    "label_id": label_id,
                    "label_index": label_to_index[label_id],
                    "signer_id": clip.get("signer_id"),
                    "signer_identity_hash": clip.get("signer_identity_hash"),
                    "source_split": clip.get("source_split"),
                    "source_record_id": clip.get("source_record_id"),
                    "source_video_path": clip.get("source_video_path"),
                    "tensor_path": tensor_path,
                }
            )

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        record = self.records[index]
        frames = load_tensor_file(
            self.torch,
            record["tensor_path"],
            preserve_region_axis=self.preserve_region_axis,
        )
        context = f"{self.manifest_path}: clip {record['clip_id']}"
        if self.preserve_region_axis:
            frames = prepare_region_frames(
                self.torch,
                frames,
                frame_count=self.frame_count,
                image_size=self.image_size,
                context=context,
            )
        else:
            frames = prepare_frames(
                self.torch,
                frames,
                frame_count=self.frame_count,
                image_size=self.image_size,
                context=context,
            )
        if self.training_augmentation == "basic":
            frames = augment_raw_rgb_frames(self.torch, frames, self.image_size)
        elif self.training_augmentation == "mild":
            frames = augment_raw_rgb_frames_mild(self.torch, frames, self.image_size)
        elif self.training_augmentation == "strong":
            frames = augment_raw_rgb_frames_strong(self.torch, frames, self.image_size)
        return frames, self.torch.tensor(record["label_index"], dtype=self.torch.long)

    def input_contract_evidence(self, index: int = 0) -> dict[str, Any]:
        record = self.records[index]
        frames, contract = load_tensor_file_with_contract(
            self.torch,
            record["tensor_path"],
            preserve_region_axis=self.preserve_region_axis,
        )
        context = f"{self.manifest_path}: clip {record['clip_id']}"
        prepared = (
            prepare_region_frames(
                self.torch,
                frames,
                frame_count=self.frame_count,
                image_size=self.image_size,
                context=context,
            )
            if self.preserve_region_axis
            else prepare_frames(
                self.torch,
                frames,
                frame_count=self.frame_count,
                image_size=self.image_size,
                context=context,
            )
        )
        training_loader = contract.get("training_loader") if isinstance(contract.get("training_loader"), dict) else {}
        return {
            "clip_id": record["clip_id"],
            "label_id": record["label_id"],
            "tensor_path": project_relative(record["tensor_path"]),
            "preserve_region_axis": self.preserve_region_axis,
            "raw_rgb_regions_shape": contract.get("rgb_regions_shape"),
            "prepared_model_input_shape": tensor_shape(self.torch, prepared),
            "prepared_model_input_axis": REGION_AWARE_MODEL_INPUT_AXIS
            if self.preserve_region_axis
            else "T,C,H,W",
            "training_loader": {
                "consumed_key": training_loader.get("consumed_key"),
                "derived_input_name": training_loader.get("derived_input_name"),
                "consumed_shape": training_loader.get("consumed_shape"),
                "region_axis_preserved": training_loader.get("region_axis_preserved"),
                "model_input_axis_before_prepare": training_loader.get("model_input_axis_before_prepare"),
            },
            "derived_input": contract.get("derived_input"),
        }


def prepare_frames(torch: Any, frames: Any, frame_count: int, image_size: int, context: str) -> Any:
    if not torch.is_tensor(frames):
        raise TrainingError(f"{context} decoded frame payload is not a tensor")
    if frames.ndim != 4:
        raise TrainingError(
            f"{context} decoded frame tensor must be 4D as TCHW, THWC, or CTHW; got {tuple(frames.shape)}"
        )
    if frames.numel() == 0:
        raise TrainingError(f"{context} decoded frame tensor is empty")

    if frames.shape[-1] == 3:
        frames = frames.permute(0, 3, 1, 2)
    elif frames.shape[1] == 3:
        pass
    elif frames.shape[0] == 3:
        frames = frames.permute(1, 0, 2, 3)
    else:
        raise TrainingError(
            f"{context} decoded frame tensor must have exactly 3 RGB channels; got {tuple(frames.shape)}"
        )

    frames = frames.contiguous().to(dtype=torch.float32)
    max_value = float(frames.max().item())
    min_value = float(frames.min().item())
    if min_value < -1.5 or max_value > 255.0:
        raise TrainingError(
            f"{context} decoded frame values must look like normalized RGB or uint8 RGB; "
            f"observed range [{min_value}, {max_value}]"
        )
    if max_value > 1.5:
        frames = frames / 255.0

    total_frames = frames.shape[0]
    if total_frames >= frame_count:
        indices = torch.linspace(0, total_frames - 1, frame_count).round().to(dtype=torch.long)
        frames = frames.index_select(0, indices)
    else:
        pad_count = frame_count - total_frames
        padding = frames[-1:].repeat(pad_count, 1, 1, 1)
        frames = torch.cat([frames, padding], dim=0)

    if frames.shape[-2:] != (image_size, image_size):
        frames = torch.nn.functional.interpolate(
            frames,
            size=(image_size, image_size),
            mode="bilinear",
            align_corners=False,
        )
    return frames


def prepare_region_frames(torch: Any, regions: Any, frame_count: int, image_size: int, context: str) -> Any:
    if not torch.is_tensor(regions):
        raise TrainingError(f"{context} decoded region-grid payload is not a tensor")
    if regions.ndim != 5:
        raise TrainingError(
            f"{context} decoded region-grid tensor must be 5D as T,R,H,W,C; got {tuple(regions.shape)}"
        )
    if regions.numel() == 0:
        raise TrainingError(f"{context} decoded region-grid tensor is empty")
    if int(regions.shape[1]) <= 0:
        raise TrainingError(f"{context} decoded region-grid tensor has no region axis entries")
    if int(regions.shape[-1]) != 3:
        raise TrainingError(
            f"{context} decoded region-grid tensor must end with 3 RGB channels; got {tuple(regions.shape)}"
        )

    regions = regions.permute(0, 1, 4, 2, 3).contiguous().to(dtype=torch.float32)
    max_value = float(regions.max().item())
    min_value = float(regions.min().item())
    if min_value < -1.5 or max_value > 255.0:
        raise TrainingError(
            f"{context} decoded region-grid values must look like normalized RGB or uint8 RGB; "
            f"observed range [{min_value}, {max_value}]"
        )
    if max_value > 1.5:
        regions = regions / 255.0

    total_frames = regions.shape[0]
    if total_frames >= frame_count:
        indices = torch.linspace(0, total_frames - 1, frame_count).round().to(dtype=torch.long)
        regions = regions.index_select(0, indices)
    else:
        pad_count = frame_count - total_frames
        padding = regions[-1:].repeat(pad_count, 1, 1, 1, 1)
        regions = torch.cat([regions, padding], dim=0)

    if regions.shape[-2:] != (image_size, image_size):
        time_count, region_count, channels, height, width = [int(value) for value in regions.shape]
        flattened = regions.reshape(time_count * region_count, channels, height, width)
        resized = torch.nn.functional.interpolate(
            flattened,
            size=(image_size, image_size),
            mode="bilinear",
            align_corners=False,
        )
        regions = resized.reshape(time_count, region_count, channels, image_size, image_size)
    return regions.contiguous()


def augment_raw_rgb_frames(torch: Any, frames: Any, image_size: int) -> Any:
    if torch.rand(()) < 0.9:
        pad = max(1, min(10, image_size // 12))
        padded = torch.nn.functional.pad(frames, (pad, pad, pad, pad), mode="replicate")
        top = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        left = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        frames = padded[..., top : top + image_size, left : left + image_size]

    if torch.rand(()) < 0.85:
        brightness = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.14
        contrast = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.18
        mean = frames.mean(dim=(-2, -1), keepdim=True)
        frames = (frames - mean) * contrast + mean
        frames = frames * brightness

    if torch.rand(()) < 0.35:
        frames = frames + torch.randn_like(frames) * 0.012

    return frames.clamp(0.0, 1.0).contiguous()


def spatial_replicate_pad_for_augmentation(torch: Any, frames: Any, pad: int) -> Any:
    if frames.ndim == 4:
        padding = (pad, pad, pad, pad)
    elif frames.ndim == 5:
        padding = (pad, pad, pad, pad, 0, 0)
    else:
        raise TrainingError(
            "spatial replicate augmentation supports 4D T,C,H,W or 5D T,R,C,H,W input; "
            f"got {tuple(frames.shape)}"
        )
    return torch.nn.functional.pad(frames, padding, mode="replicate")


def augment_raw_rgb_frames_mild(torch: Any, frames: Any, image_size: int) -> Any:
    if torch.rand(()) < 0.75:
        pad = max(1, min(6, image_size // 18))
        padded = spatial_replicate_pad_for_augmentation(torch, frames, pad)
        top = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        left = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        frames = padded[..., top : top + image_size, left : left + image_size]

    if torch.rand(()) < 0.65:
        brightness = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.08
        contrast = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.10
        mean = frames.mean(dim=(-2, -1), keepdim=True)
        frames = (frames - mean) * contrast + mean
        frames = frames * brightness

    if torch.rand(()) < 0.2:
        frames = frames + torch.randn_like(frames) * 0.006

    return frames.clamp(0.0, 1.0).contiguous()


def augment_raw_rgb_frames_strong(torch: Any, frames: Any, image_size: int) -> Any:
    if torch.rand(()) < 0.95:
        pad = max(2, min(14, image_size // 8))
        padded = torch.nn.functional.pad(frames, (pad, pad, pad, pad), mode="replicate")
        top = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        left = int(torch.randint(0, 2 * pad + 1, (1,)).item())
        frames = padded[..., top : top + image_size, left : left + image_size]

    if torch.rand(()) < 0.55 and frames.shape[0] > 3:
        shift = int(torch.randint(-2, 3, (1,)).item())
        if shift > 0:
            frames = torch.cat([frames[:1].repeat(shift, 1, 1, 1), frames[:-shift]], dim=0)
        elif shift < 0:
            amount = abs(shift)
            frames = torch.cat([frames[amount:], frames[-1:].repeat(amount, 1, 1, 1)], dim=0)

    if torch.rand(()) < 0.9:
        brightness = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.22
        contrast = 1.0 + float((torch.rand(()) * 2.0 - 1.0).item()) * 0.28
        channel_scale = 1.0 + (torch.rand((1, frames.shape[1], 1, 1), device=frames.device) * 2.0 - 1.0) * 0.08
        mean = frames.mean(dim=(-2, -1), keepdim=True)
        frames = (frames - mean) * contrast + mean
        frames = frames * brightness * channel_scale

    if torch.rand(()) < 0.45:
        frames = frames + torch.randn_like(frames) * 0.018

    if torch.rand(()) < 0.35:
        erase_height = int(torch.randint(max(3, image_size // 12), max(4, image_size // 5), (1,)).item())
        erase_width = int(torch.randint(max(3, image_size // 12), max(4, image_size // 5), (1,)).item())
        top = int(torch.randint(0, max(1, image_size - erase_height + 1), (1,)).item())
        left = int(torch.randint(0, max(1, image_size - erase_width + 1), (1,)).item())
        fill = frames.mean(dim=(-2, -1), keepdim=True)
        frames[..., top : top + erase_height, left : left + erase_width] = fill

    return frames.clamp(0.0, 1.0).contiguous()


def build_model(
    torch: Any,
    num_classes: int,
    architecture: str = FRAME_MEAN_CNN_ARCHITECTURE,
) -> Any:
    nn = torch.nn
    if architecture not in ALLOWED_MODEL_ARCHITECTURES:
        raise TrainingError(f"unsupported raw-frame architecture: {architecture}")

    class FrameMeanRawFrameClassifier(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Conv2d(3, 16, kernel_size=3, stride=2, padding=1),
                nn.ReLU(),
                nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),
                nn.ReLU(),
                nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
                nn.ReLU(),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
            )
            self.classifier = nn.Linear(64, num_classes)

        def forward(self, clips: Any) -> Any:
            batch_size, frame_count, channels, height, width = clips.shape
            encoded = self.encoder(clips.reshape(batch_size * frame_count, channels, height, width))
            encoded = encoded.reshape(batch_size, frame_count, -1).mean(dim=1)
            return self.classifier(encoded)

    class Compact3DRawFrameClassifier(nn.Module):
        def __init__(self, clip_standardization: bool = False) -> None:
            super().__init__()
            self.clip_standardization = clip_standardization
            self.features = nn.Sequential(
                nn.Conv3d(3, 32, kernel_size=(3, 5, 5), stride=(1, 2, 2), padding=(1, 2, 2), bias=False),
                nn.BatchNorm3d(32),
                nn.ReLU(inplace=True),
                nn.Conv3d(32, 64, kernel_size=3, stride=(2, 2, 2), padding=1, bias=False),
                nn.BatchNorm3d(64),
                nn.ReLU(inplace=True),
                nn.Conv3d(64, 128, kernel_size=3, stride=(2, 2, 2), padding=1, bias=False),
                nn.BatchNorm3d(128),
                nn.ReLU(inplace=True),
                nn.Conv3d(128, 192, kernel_size=3, stride=(2, 2, 2), padding=1, bias=False),
                nn.BatchNorm3d(192),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool3d((1, 1, 1)),
                nn.Flatten(),
            )
            self.classifier = nn.Linear(192, num_classes)

        def forward(self, clips: Any) -> Any:
            if self.clip_standardization:
                mean = clips.mean(dim=(1, 3, 4), keepdim=True)
                std = clips.std(dim=(1, 3, 4), keepdim=True, unbiased=False).clamp_min(1e-4)
                clips = ((clips - mean) / std).clamp(-4.0, 4.0)
            clips = clips.permute(0, 2, 1, 3, 4).contiguous()
            encoded = self.features(clips)
            return self.classifier(encoded)

    class Factorized3DRawFrameClassifier(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.stem = nn.Sequential(
                nn.Conv3d(3, 48, kernel_size=(3, 5, 5), stride=(1, 2, 2), padding=(1, 2, 2), bias=False),
                nn.BatchNorm3d(48),
                nn.ReLU(inplace=True),
            )
            self.blocks = nn.Sequential(
                self._block(48, 96, spatial_stride=2, temporal_stride=1),
                self._block(96, 144, spatial_stride=2, temporal_stride=2),
                self._block(144, 208, spatial_stride=2, temporal_stride=2),
                self._block(208, 288, spatial_stride=2, temporal_stride=2),
            )
            self.head = nn.Sequential(
                nn.AdaptiveAvgPool3d((1, 1, 1)),
                nn.Flatten(),
                nn.Dropout(p=0.25),
                nn.Linear(288, num_classes),
            )

        def _block(
            self,
            in_channels: int,
            out_channels: int,
            spatial_stride: int,
            temporal_stride: int,
        ) -> Any:
            return nn.Sequential(
                nn.Conv3d(
                    in_channels,
                    out_channels,
                    kernel_size=(1, 3, 3),
                    stride=(1, spatial_stride, spatial_stride),
                    padding=(0, 1, 1),
                    bias=False,
                ),
                nn.BatchNorm3d(out_channels),
                nn.ReLU(inplace=True),
                nn.Conv3d(
                    out_channels,
                    out_channels,
                    kernel_size=(3, 1, 1),
                    stride=(temporal_stride, 1, 1),
                    padding=(1, 0, 0),
                    bias=False,
                ),
                nn.BatchNorm3d(out_channels),
                nn.ReLU(inplace=True),
            )

        def forward(self, clips: Any) -> Any:
            clips = clips.permute(0, 2, 1, 3, 4).contiguous()
            encoded = self.blocks(self.stem(clips))
            return self.head(encoded)

    class Motion2DTemporalRawFrameClassifier(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.appearance_encoder = self._make_frame_encoder()
            self.motion_encoder = self._make_frame_encoder()
            self.temporal = nn.Sequential(
                nn.Conv1d(256, 256, kernel_size=3, padding=1, bias=False),
                nn.BatchNorm1d(256),
                nn.ReLU(inplace=True),
                nn.Conv1d(256, 256, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm1d(256),
                nn.ReLU(inplace=True),
                nn.Conv1d(256, 320, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm1d(320),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool1d(1),
                nn.Flatten(),
                nn.Dropout(p=0.25),
            )
            self.classifier = nn.Linear(320, num_classes)

        def _make_frame_encoder(self) -> Any:
            return nn.Sequential(
                nn.Conv2d(3, 32, kernel_size=5, stride=2, padding=2, bias=False),
                nn.BatchNorm2d(32),
                nn.ReLU(inplace=True),
                nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                nn.Conv2d(128, 128, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
            )

        def _encode_sequence(self, encoder: Any, clips: Any) -> Any:
            batch_size, frame_count, channels, height, width = clips.shape
            encoded = encoder(clips.reshape(batch_size * frame_count, channels, height, width))
            return encoded.reshape(batch_size, frame_count, -1)

        def forward(self, clips: Any) -> Any:
            mean = clips.mean(dim=(1, 3, 4), keepdim=True)
            std = clips.std(dim=(1, 3, 4), keepdim=True, unbiased=False).clamp_min(1e-4)
            normalized = ((clips - mean) / std).clamp(-4.0, 4.0)
            deltas = normalized[:, 1:] - normalized[:, :-1]
            first_delta = torch.zeros_like(deltas[:, :1])
            deltas = torch.cat([first_delta, deltas], dim=1).clamp(-4.0, 4.0)
            appearance = self._encode_sequence(self.appearance_encoder, normalized)
            motion = self._encode_sequence(self.motion_encoder, deltas)
            temporal_input = torch.cat([appearance, motion], dim=2).transpose(1, 2).contiguous()
            encoded = self.temporal(temporal_input)
            return self.classifier(encoded)

    class CausalConv1d(nn.Module):
        def __init__(self, in_channels: int, out_channels: int, kernel_size: int, dilation: int) -> None:
            super().__init__()
            self.left_padding = (kernel_size - 1) * dilation
            self.conv = nn.Conv1d(
                in_channels,
                out_channels,
                kernel_size=kernel_size,
                dilation=dilation,
                padding=0,
                bias=False,
            )

        def forward(self, sequence: Any) -> Any:
            padded = torch.nn.functional.pad(sequence, (self.left_padding, 0))
            return self.conv(padded)

    class TemporalConvNetBlock(nn.Module):
        def __init__(self, in_channels: int, out_channels: int, dilation: int, dropout: float = 0.15) -> None:
            super().__init__()
            self.net = nn.Sequential(
                CausalConv1d(in_channels, out_channels, kernel_size=3, dilation=dilation),
                nn.BatchNorm1d(out_channels),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
                CausalConv1d(out_channels, out_channels, kernel_size=3, dilation=dilation),
                nn.BatchNorm1d(out_channels),
            )
            self.residual = (
                nn.Identity()
                if in_channels == out_channels
                else nn.Conv1d(in_channels, out_channels, kernel_size=1, bias=False)
            )
            self.activation = nn.ReLU(inplace=True)

        def forward(self, sequence: Any) -> Any:
            return self.activation(self.net(sequence) + self.residual(sequence))

    class TrueTemporalConvNetRawFrameClassifier(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.frame_encoder = nn.Sequential(
                nn.Conv2d(3, 32, kernel_size=5, stride=2, padding=2, bias=False),
                nn.BatchNorm2d(32),
                nn.ReLU(inplace=True),
                nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                nn.Conv2d(128, 192, kernel_size=3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(192),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
            )
            self.temporal_convnet = nn.Sequential(
                TemporalConvNetBlock(192, 192, dilation=1),
                TemporalConvNetBlock(192, 224, dilation=2),
                TemporalConvNetBlock(224, 256, dilation=4),
            )
            self.region_attention = nn.Linear(192, 1)
            self.head = nn.Sequential(
                nn.AdaptiveAvgPool1d(1),
                nn.Flatten(),
                nn.Dropout(p=0.20),
                nn.Linear(256, num_classes),
            )

        def _encode_flat_frames(self, frames: Any, batch_size: int, frame_count: int) -> Any:
            channels, height, width = [int(value) for value in frames.shape[-3:]]
            encoded = self.frame_encoder(frames.reshape(batch_size * frame_count, channels, height, width))
            return encoded.reshape(batch_size, frame_count, -1)

        def forward(self, clips: Any) -> Any:
            if clips.ndim == 6:
                batch_size, frame_count, region_count, channels, height, width = clips.shape
                mean = clips.mean(dim=(1, 2, 4, 5), keepdim=True)
                std = clips.std(dim=(1, 2, 4, 5), keepdim=True, unbiased=False).clamp_min(1e-4)
                normalized = ((clips - mean) / std).clamp(-4.0, 4.0)
                encoded = self.frame_encoder(
                    normalized.reshape(batch_size * frame_count * region_count, channels, height, width)
                )
                region_sequence = encoded.reshape(batch_size, frame_count, region_count, -1)
                region_weights = torch.softmax(self.region_attention(region_sequence).squeeze(-1), dim=2)
                sequence = (region_sequence * region_weights.unsqueeze(-1)).sum(dim=2)
            elif clips.ndim == 5:
                batch_size, frame_count, _channels, _height, _width = clips.shape
                mean = clips.mean(dim=(1, 3, 4), keepdim=True)
                std = clips.std(dim=(1, 3, 4), keepdim=True, unbiased=False).clamp_min(1e-4)
                normalized = ((clips - mean) / std).clamp(-4.0, 4.0)
                sequence = self._encode_flat_frames(normalized, batch_size, frame_count)
            else:
                raise TrainingError(
                    "true TemporalConvNet input must be 5D B,T,C,H,W or 6D B,T,R,C,H,W; "
                    f"got {tuple(clips.shape)}"
                )
            sequence = sequence.transpose(1, 2).contiguous()
            temporal = self.temporal_convnet(sequence)
            return self.head(temporal)

    class ConvGroupNormAct2d(nn.Module):
        def __init__(self, in_channels: int, out_channels: int, kernel_size: int, stride: int) -> None:
            super().__init__()
            padding = kernel_size // 2
            self.net = nn.Sequential(
                nn.Conv2d(
                    in_channels,
                    out_channels,
                    kernel_size=kernel_size,
                    stride=stride,
                    padding=padding,
                    bias=False,
                ),
                nn.GroupNorm(8, out_channels),
                nn.ReLU(inplace=True),
            )

        def forward(self, frames: Any) -> Any:
            return self.net(frames)

    class RegionTemporalLateFusionBlock(nn.Module):
        def __init__(self, in_channels: int, out_channels: int, dilation: int) -> None:
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv1d(
                    in_channels,
                    out_channels,
                    kernel_size=3,
                    dilation=dilation,
                    padding=dilation,
                    bias=False,
                ),
                nn.GroupNorm(8, out_channels),
                nn.ReLU(inplace=True),
                nn.Conv1d(
                    out_channels,
                    out_channels,
                    kernel_size=3,
                    dilation=dilation,
                    padding=dilation,
                    bias=False,
                ),
                nn.GroupNorm(8, out_channels),
            )
            self.residual = (
                nn.Identity()
                if in_channels == out_channels
                else nn.Conv1d(in_channels, out_channels, kernel_size=1, bias=False)
            )
            self.activation = nn.ReLU(inplace=True)

        def forward(self, sequence: Any) -> Any:
            return self.activation(self.net(sequence) + self.residual(sequence))

    class ScratchRegionTemporalLateFusionTCNClassifier(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.frame_encoder = nn.Sequential(
                ConvGroupNormAct2d(3, 24, kernel_size=5, stride=2),
                ConvGroupNormAct2d(24, 48, kernel_size=3, stride=2),
                ConvGroupNormAct2d(48, 96, kernel_size=3, stride=2),
                ConvGroupNormAct2d(96, 128, kernel_size=3, stride=2),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
            )
            self.temporal = nn.Sequential(
                RegionTemporalLateFusionBlock(128, 160, dilation=1),
                RegionTemporalLateFusionBlock(160, 192, dilation=2),
                RegionTemporalLateFusionBlock(192, 192, dilation=4),
            )
            self.region_attention = nn.Linear(192, 1)
            self.head = nn.Sequential(
                nn.LayerNorm(192),
                nn.Linear(192, num_classes),
            )

        def forward(self, clips: Any) -> Any:
            if clips.ndim != 6:
                raise TrainingError(
                    "scratch region-temporal late-fusion TCN input must be 6D B,T,R,C,H,W; "
                    f"got {tuple(clips.shape)}"
                )
            batch_size, frame_count, region_count, channels, height, width = clips.shape
            mean = clips.mean(dim=(1, 2, 4, 5), keepdim=True)
            std = clips.std(dim=(1, 2, 4, 5), keepdim=True, unbiased=False).clamp_min(1e-4)
            normalized = ((clips - mean) / std).clamp(-4.0, 4.0)
            encoded = self.frame_encoder(
                normalized.reshape(batch_size * frame_count * region_count, channels, height, width)
            )
            region_sequence = (
                encoded.reshape(batch_size, frame_count, region_count, -1)
                .permute(0, 2, 3, 1)
                .contiguous()
                .reshape(batch_size * region_count, -1, frame_count)
            )
            temporal = self.temporal(region_sequence)
            region_features = temporal.mean(dim=2).reshape(batch_size, region_count, -1)
            region_weights = torch.softmax(self.region_attention(region_features).squeeze(-1), dim=1)
            fused = (region_features * region_weights.unsqueeze(-1)).sum(dim=1)
            return self.head(fused)

    class ScratchMotionRegionTokenTemporalClassifier(nn.Module):
        diagnostic_keys = (
            "derived_motion_input",
            "token_embedding_pre_interaction",
            "token_embedding_post_cross_region",
            "token_embedding_post_temporal",
            "pre_pool_tokens",
            "pooled_pre_head",
            "post_norm_head_input",
            "logits",
        )

        def __init__(self) -> None:
            super().__init__()
            self.input_contract_id = POPSIGN_FRESH5_DERIVED_MOTION_TOKENS_INPUT
            self.expected_axis = POPSIGN_FRESH5_MOTION_TOKEN_MODEL_INPUT_AXIS
            self.frame_encoder = nn.Sequential(
                ConvGroupNormAct2d(9, 24, kernel_size=5, stride=2),
                ConvGroupNormAct2d(24, 48, kernel_size=3, stride=2),
                ConvGroupNormAct2d(48, 96, kernel_size=3, stride=2),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
            )
            self.time_embedding = nn.Parameter(torch.zeros(1, 16, 1, 96))
            self.region_embedding = nn.Parameter(torch.zeros(1, 1, 5, 96))
            self.cross_region = nn.MultiheadAttention(96, num_heads=4, batch_first=True)
            self.cross_region_norm = nn.LayerNorm(96)
            self.temporal = nn.Sequential(
                RegionTemporalLateFusionBlock(96, 128, dilation=1),
                RegionTemporalLateFusionBlock(128, 128, dilation=2),
            )
            self.pre_pool_norm = nn.LayerNorm(128)
            self.pool_attention = nn.Linear(128, 1)
            self.head_norm = nn.LayerNorm(128)
            self.classifier = nn.Linear(128, num_classes)

        def _derive_motion_input(self, clips: Any) -> Any:
            if clips.ndim != 6:
                raise TrainingError(
                    "scratch motion-region token temporal input must be 6D B,T,R,C,H,W; "
                    f"got {tuple(clips.shape)}"
                )
            channels = int(clips.shape[3])
            clips = clips.to(dtype=torch.float32)
            if channels == 9:
                return clips.contiguous()
            if channels != 3:
                raise TrainingError(
                    "scratch motion-region token temporal input must have 3 RGB channels "
                    f"or 9 derived motion channels; got {tuple(clips.shape)}"
                )
            deltas = clips[:, 1:] - clips[:, :-1]
            first_delta = torch.zeros_like(deltas[:, :1])
            signed_delta = torch.cat([first_delta, deltas], dim=1).clamp(-1.0, 1.0)
            absolute_delta = signed_delta.abs()
            return torch.cat([clips, signed_delta, absolute_delta], dim=3).contiguous()

        def _compute(self, clips: Any) -> tuple[Any, dict[str, Any]]:
            motion_input = self._derive_motion_input(clips)
            batch_size, frame_count, region_count, channels, height, width = motion_input.shape
            if frame_count != 16 or region_count != 5:
                raise TrainingError(
                    "scratch motion-region token temporal scaffold is bound to PopSign fresh5 "
                    f"B,16,5,C,H,W input; got {tuple(motion_input.shape)}"
                )
            encoded = self.frame_encoder(
                motion_input.reshape(batch_size * frame_count * region_count, channels, height, width)
            )
            tokens = (
                encoded.reshape(batch_size, frame_count, region_count, -1)
                + self.time_embedding[:, :frame_count]
                + self.region_embedding[:, :, :region_count]
            )
            region_input = tokens.reshape(batch_size * frame_count, region_count, -1)
            region_mixed, _weights = self.cross_region(
                region_input,
                region_input,
                region_input,
                need_weights=False,
            )
            region_mixed = self.cross_region_norm(region_mixed + region_input)
            region_tokens = region_mixed.reshape(batch_size, frame_count, region_count, -1)
            temporal_input = (
                region_tokens.permute(0, 2, 3, 1)
                .contiguous()
                .reshape(batch_size * region_count, -1, frame_count)
            )
            temporal = self.temporal(temporal_input)
            temporal_tokens = temporal.reshape(batch_size, region_count, -1, frame_count).permute(0, 3, 1, 2)
            pre_pool_tokens = self.pre_pool_norm(temporal_tokens.reshape(batch_size, frame_count * region_count, -1))
            pool_weights = torch.softmax(self.pool_attention(pre_pool_tokens).squeeze(-1), dim=1)
            pooled = (pre_pool_tokens * pool_weights.unsqueeze(-1)).sum(dim=1)
            post_norm = self.head_norm(pooled)
            logits = self.classifier(post_norm)
            diagnostics = {
                "derived_motion_input": motion_input,
                "token_embedding_pre_interaction": tokens,
                "token_embedding_post_cross_region": region_tokens,
                "token_embedding_post_temporal": temporal_tokens,
                "pre_pool_tokens": pre_pool_tokens,
                "pooled_pre_head": pooled,
                "post_norm_head_input": post_norm,
                "logits": logits,
            }
            return logits, diagnostics

        def forward_with_diagnostics(self, clips: Any) -> tuple[Any, dict[str, Any]]:
            return self._compute(clips)

        def forward(self, clips: Any) -> Any:
            logits, _diagnostics = self._compute(clips)
            return logits

    if architecture == FRAME_MEAN_CNN_ARCHITECTURE:
        return FrameMeanRawFrameClassifier()
    if architecture == FACTORIZED_3D_CNN_ARCHITECTURE:
        return Factorized3DRawFrameClassifier()
    if architecture == MOTION_2D_TEMPORAL_CNN_ARCHITECTURE:
        return Motion2DTemporalRawFrameClassifier()
    if architecture == TRUE_TEMPORAL_CONVNET_ARCHITECTURE:
        return TrueTemporalConvNetRawFrameClassifier()
    if architecture == SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE:
        return ScratchRegionTemporalLateFusionTCNClassifier()
    if architecture == SCRATCH_MOTION_REGION_TOKEN_TEMPORAL_ARCHITECTURE:
        return ScratchMotionRegionTokenTemporalClassifier()
    if architecture == COMPACT_3D_CNN_CLIP_NORM_ARCHITECTURE:
        return Compact3DRawFrameClassifier(clip_standardization=True)
    return Compact3DRawFrameClassifier()


def iterate_batches(
    torch: Any,
    model: Any,
    loader: Any,
    device: Any,
    criterion: Any,
    optimizer: Any | None,
    max_batches: int | None,
) -> dict[str, float]:
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    total_correct = 0
    total_seen = 0
    total_batches = 0

    for batch_index, (frames, labels) in enumerate(loader, start=1):
        if max_batches is not None and batch_index > max_batches:
            break
        frames = frames.to(device)
        labels = labels.to(device)
        if training:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(training):
            logits = model(frames)
            loss = criterion(logits, labels)
            if training:
                loss.backward()
                optimizer.step()

        total_loss += float(loss.detach().cpu().item()) * int(labels.shape[0])
        total_correct += int((logits.argmax(dim=1) == labels).sum().detach().cpu().item())
        total_seen += int(labels.shape[0])
        total_batches += 1

    if total_seen == 0:
        raise TrainingError("no batches were available for training or validation")
    return {
        "loss": total_loss / total_seen,
        "accuracy": total_correct / total_seen,
        "examples": float(total_seen),
        "batches": float(total_batches),
    }


def run_training(args: argparse.Namespace, manifests: list[dict[str, Any]]) -> dict[str, Any]:
    validate_training_args(args)
    torch = import_torch()
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = select_device(torch)
    if training_evidence_mode(args) != "smoke" and str(device) not in {"cuda", "mps"}:
        raise TrainingError(
            f"{training_evidence_mode(args)} training requires PyTorch GPU execution; "
            f"current device is {device}"
        )

    label_ids = sorted(manifests[0]["label_ids"])
    label_to_index = {label_id: index for index, label_id in enumerate(label_ids)}
    preserve_region_axis = training_evidence_mode(args) in {
        "region_grid_tcn_training_smoke",
        "m3gu_reduced4_training_smoke",
        "popsign_fresh5_training_smoke",
    }
    require_decode_provenance = training_evidence_mode(args) != "smoke" and not preserve_region_axis
    train_dataset = RawFrameClipDataset(
        torch,
        args.train_manifest,
        "train",
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=require_decode_provenance,
        training_augmentation=args.training_augmentation,
        preserve_region_axis=preserve_region_axis,
    )
    validation_dataset = RawFrameClipDataset(
        torch,
        args.validation_manifest,
        "validation",
        label_to_index,
        args.frame_count,
        args.image_size,
        require_decode_provenance=require_decode_provenance,
        preserve_region_axis=preserve_region_axis,
    )
    input_contract_evidence = {
        "preserve_region_axis": preserve_region_axis,
        "region_axis_contract": (
            "rgb_regions preserved as T,R,H,W,C by the loader, prepared as T,R,C,H,W, "
            "and batched as B,T,R,C,H,W before the selected region-preserving model"
            if preserve_region_axis
            else "standard raw-frame input"
        ),
        "train_sample": train_dataset.input_contract_evidence(0),
        "validation_sample": validation_dataset.input_contract_evidence(0),
    }

    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
    )
    validation_loader = torch.utils.data.DataLoader(
        validation_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
    )

    model = build_model(torch, len(label_ids), args.architecture).to(device)
    initial_model_state_digest = model_state_digest(model.state_dict())
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    if args.optimizer == "adamw":
        optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    else:
        optimizer = torch.optim.Adam(model.parameters(), lr=args.learning_rate)

    history = []
    best_validation: dict[str, Any] | None = None
    best_state_dict: dict[str, Any] | None = None
    for epoch in range(1, args.epochs + 1):
        train_metrics = iterate_batches(
            torch,
            model,
            train_loader,
            device,
            criterion,
            optimizer,
            args.max_train_batches,
        )
        validation_metrics = iterate_batches(
            torch,
            model,
            validation_loader,
            device,
            criterion,
            None,
            args.max_validation_batches,
        )
        history.append(
            {
                "epoch": epoch,
                "train": train_metrics,
                "validation": validation_metrics,
            }
        )
        if (
            best_validation is None
            or validation_metrics["accuracy"] > best_validation["metrics"]["accuracy"]
            or (
                validation_metrics["accuracy"] == best_validation["metrics"]["accuracy"]
                and validation_metrics["loss"] < best_validation["metrics"]["loss"]
            )
        ):
            best_validation = {"epoch": epoch, "metrics": dict(validation_metrics)}
            if args.checkpoint_selection == "best_validation":
                best_state_dict = clone_state_dict_to_cpu(model.state_dict())
        print(
            json.dumps(
                {
                    "epoch": epoch,
                    "train_loss": train_metrics["loss"],
                    "train_accuracy": train_metrics["accuracy"],
                    "validation_loss": validation_metrics["loss"],
                    "validation_accuracy": validation_metrics["accuracy"],
                },
                sort_keys=True,
            )
        )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    model_path = args.output_dir / "model_state.pt"
    report_path = args.output_dir / "training-provenance.json"
    terminal_state_dict = clone_state_dict_to_cpu(model.state_dict())
    if args.checkpoint_selection == "best_validation":
        if best_state_dict is None or best_validation is None:
            raise TrainingError("best validation checkpoint selection did not capture a validation state")
        selected_state_dict = best_state_dict
        selected_epoch = int(best_validation["epoch"])
        selected_validation_metrics = best_validation["metrics"]
    else:
        selected_state_dict = terminal_state_dict
        selected_epoch = args.epochs
        selected_validation_metrics = history[-1]["validation"]
    final_model_state_digest = model_state_digest(selected_state_dict)
    torch.save(
        {
            "model_state": selected_state_dict,
            "label_to_index": label_to_index,
            "architecture": args.architecture,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "checkpoint_selection": args.checkpoint_selection,
            "selected_epoch": selected_epoch,
            "initial_model_state_digest": initial_model_state_digest,
            "final_model_state_digest": final_model_state_digest,
        },
        model_path,
    )

    report = {
        "schema_version": TRAINING_PROVENANCE_SCHEMA_VERSION,
        "model_id": args.model_id,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "evidence_mode": training_evidence_mode(args),
        "generated_by": generated_by(args),
        "training_status": "completed",
        "training_command": [sys.executable, *sys.argv],
        "training_script": file_reference(Path(__file__)),
        "environment_files": environment_file_references(),
        "local_ml_environment": local_ml_environment_reference(),
        "initialization": "random",
        "random_initialization_evidence": {
            "seed": args.seed,
            "initial_model_state_digest": initial_model_state_digest,
            "final_model_state_digest": final_model_state_digest,
        },
        "pretrained_components": [],
        "architecture": args.architecture,
        "model_artifact": str(model_path),
        "seed": args.seed,
        "framework": {
            "name": "pytorch",
            "version": torch.__version__,
            "device": str(device),
            "python": platform.python_version(),
        },
        "hyperparameters": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "optimizer": args.optimizer,
            "weight_decay": args.weight_decay if args.optimizer == "adamw" else 0.0,
            "label_smoothing": args.label_smoothing,
            "frame_count": args.frame_count,
            "image_size": args.image_size,
            "architecture": args.architecture,
            "training_augmentation": args.training_augmentation,
            "checkpoint_selection": args.checkpoint_selection,
            "num_workers": args.num_workers,
            "max_train_batches": args.max_train_batches,
            "max_validation_batches": args.max_validation_batches,
            "preserve_region_axis": preserve_region_axis,
        },
        "data_loading_contract": data_loading_contract(args, manifests),
        "input_contract_evidence": input_contract_evidence,
        "checkpoint_selection": {
            "policy": args.checkpoint_selection,
            "selected_epoch": selected_epoch,
            "selected_validation_metrics": selected_validation_metrics,
        },
        "labels": label_to_index,
        "manifests": [
            {
                "path": item["path"],
                "split": item["split"],
                "dataset_id": item["dataset_id"],
                "label_count": item["label_count"],
                "clip_count": item["clip_count"],
                "min_clips_per_label_per_split": item["min_clips_per_label_per_split"],
                "sha256": item["sha256"],
                "source_register": item.get("source_register"),
                "dataset_source_mode": item.get("dataset_source_mode"),
                "external_dataset_import": item.get("external_dataset_import"),
                "supplemental_external_dataset_imports": item.get("supplemental_external_dataset_imports"),
                "collection_plan": item.get("collection_plan"),
                "consent_form": item.get("consent_form"),
                "vocabulary_review": item.get("vocabulary_review"),
                "reduced_real_data_module_evidence": item.get("reduced_real_data_module_evidence"),
                "m3gu_reduced4_manifest_evidence": item.get("m3gu_reduced4_manifest_evidence"),
                "popsign_fresh5_repaired_evidence": item.get("popsign_fresh5_repaired_evidence"),
                "popsign_label_ladder_diagnostic_evidence": item.get(
                    "popsign_label_ladder_diagnostic_evidence"
                ),
            }
            for item in manifests
        ],
        "history": history,
        "threshold_policy": "not_calibrated",
        "decode_provenance_verification": {
            "required": require_decode_provenance,
            "status": "passed"
            if require_decode_provenance
            else "not_required_for_region_axis_preserving_training_smoke"
            if preserve_region_axis
            else "not_required_for_smoke",
            "schema_version": "asl-pilot-rawframe-decode-provenance/v1",
        },
        "known_limitations": (
            [
                "Compact 3D architecture is intended for final candidate runs; "
                "no production quality claim until held-out signer validation is documented."
            ]
            if args.architecture == COMPACT_3D_CNN_ARCHITECTURE
            else [
                "Compact clip-normalized 3D architecture is intended for final candidate runs; "
                "input standardization is model-internal and no production quality claim is allowed "
                "until held-out signer validation is documented."
            ]
            if args.architecture == COMPACT_3D_CNN_CLIP_NORM_ARCHITECTURE
            else [
                "Factorized 3D architecture is intended for final candidate runs; "
                "no production quality claim until held-out signer validation is documented."
            ]
            if args.architecture == FACTORIZED_3D_CNN_ARCHITECTURE
            else [
                "Motion-temporal 2D architecture is intended for final candidate runs; "
                "frame-delta features are computed inside the model from raw RGB tensors, and no "
                "production quality claim is allowed until held-out signer validation is documented."
            ]
            if args.architecture == MOTION_2D_TEMPORAL_CNN_ARCHITECTURE
            else [
                "True TemporalConvNet architecture is intended for future region-grid candidate runs; "
                "dilated temporal convolutions are randomly initialized and no production quality claim "
                "is allowed until held-out signer validation is documented."
            ]
            if args.architecture == TRUE_TEMPORAL_CONVNET_ARCHITECTURE
            else [
                "Scratch region-temporal late-fusion TCN architecture is a compile-only scaffold "
                "until a separate receipt authorizes fitting; it preserves region streams before "
                "fusion and avoids BatchNorm, Dropout, and running statistics in favor of "
                "GroupNorm and LayerNorm."
            ]
            if args.architecture == SCRATCH_REGION_TEMPORAL_LATE_FUSION_TCN_ARCHITECTURE
            else [
                "Scratch motion-region token temporal architecture is a research smoke scaffold "
                "until a separate receipt authorizes fitting; it derives motion channels inside "
                "the model from preserved region tensors and is not final or lesson milestone evidence."
            ]
            if args.architecture == SCRATCH_MOTION_REGION_TOKEN_TEMPORAL_ARCHITECTURE
            else [
                "Frame-mean 2D baseline is smoke/wiring-only and is not accepted for final training.",
                "No production quality claim until held-out signer validation is documented.",
            ]
        ),
    }
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "training_status": "completed",
                "model_artifact": str(model_path),
                "provenance_report": str(report_path),
                "device": str(device),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return report


def main() -> int:
    args = parse_args()
    try:
        validate_training_invocation(args)
        manifests = [
            validate_manifest(
                args.train_manifest,
                "train",
                args.check_files,
                args.allow_small_label_set,
                args.lesson_milestone,
                args.controlled_clip_heldout,
                args.reduced_real_data_module
                or args.reduced_real_data_training_smoke
                or args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_diagnostic
                or args.popsign_label_ladder_training_smoke,
            ),
            validate_manifest(
                args.validation_manifest,
                "validation",
                args.check_files,
                args.allow_small_label_set,
                args.lesson_milestone,
                args.controlled_clip_heldout,
                args.reduced_real_data_module
                or args.reduced_real_data_training_smoke
                or args.region_grid_tcn_training_smoke,
                args.m3gu_reduced4_training_smoke,
                args.popsign_fresh5_training_smoke,
                args.popsign_label_ladder_diagnostic
                or args.popsign_label_ladder_training_smoke,
            ),
        ]
        if args.test_manifest:
            manifests.append(
                validate_manifest(
                    args.test_manifest,
                    "test",
                    args.check_files,
                    args.allow_small_label_set,
                    args.lesson_milestone,
                    args.controlled_clip_heldout,
                    args.reduced_real_data_module
                    or args.reduced_real_data_training_smoke
                    or args.region_grid_tcn_training_smoke,
                    args.m3gu_reduced4_training_smoke,
                    args.popsign_fresh5_training_smoke,
                    args.popsign_label_ladder_diagnostic
                    or args.popsign_label_ladder_training_smoke,
                )
            )
        if not args.controlled_clip_heldout:
            assert_signer_disjoint(manifests)
        assert_label_sets_match(manifests)
        input_contract_report = None
        if args.require_input_contract:
            torch = import_torch()
            input_contract_report = validate_required_input_contracts(
                torch,
                args.require_input_contract,
                manifests,
                preserve_region_axis=args.m3gu_reduced4_training_smoke,
                frame_count=args.frame_count,
                image_size=args.image_size,
                batch_size=args.batch_size,
                num_workers=args.num_workers,
                forward_probe_architecture=args.architecture
                if args.m3gu_reduced4_training_smoke
                else None,
                seed=args.seed,
            )
        if (
            not args.dry_run
            and training_evidence_mode(args) != "smoke"
            and should_verify_retained_local_ml_environment()
        ):
            require_current_local_ml_environment(f"{training_evidence_mode(args)} training")
    except (ManifestError, TrainingError) as error:
        print(f"Manifest validation failed: {error}", file=sys.stderr)
        return 2

    print_plan(args, manifests, input_contract_report)
    if args.dry_run:
        return 0

    try:
        run_training(args, manifests)
    except TrainingError as error:
        print(f"Training failed: {error}", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
