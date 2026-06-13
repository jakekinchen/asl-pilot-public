# Rawframe Manifest Schema

`scripts/train_rawframe_model.py` expects JSON manifests with one file per split:
train, validation, and optionally test. Validation and test signers must be
disjoint from training signers.

The manifest is intentionally raw-frame only. Do not include generated
landmarks, bounding boxes, embeddings, feature files, pretrained detector
outputs, pretrained checkpoints, or model-zoo weights.

## Required Root Fields

```json
{
  "schema_version": "asl-pilot-rawframe-manifest/v1",
  "dataset_id": "asl-pilot-first-party-v0",
  "dataset_source_mode": "first_party_consent_capture",
  "split": "train",
  "created_at": "2026-05-19T00:00:00Z",
  "provenance_owner": "asl-pilot team",
  "source_register": {
    "path": "docs/model/dataset-source-register.json",
    "sha256": "replace-with-current-source-register-sha256"
  },
  "consent_form": {
    "path": "docs/privacy/dataset-consent-form.md",
    "sha256": "replace-with-current-consent-form-sha256",
    "consent_version": "asl-pilot-dataset-consent-v1"
  },
  "vocabulary_review": {
    "status": "reviewed",
    "evidence": {
      "path": "docs/review/final-vocabulary-review.json",
      "sha256": "replace-with-current-review-evidence-sha256"
    },
    "vocabulary_source": {
      "path": "web/src/lib/vocabulary.ts",
      "sha256": "replace-with-current-vocabulary-source-sha256",
      "item_count": 83
    }
  },
  "collection_plan": {
    "path": "data/dataset/collection-plan.json",
    "sha256": "replace-with-current-reviewed-collection-plan-sha256",
    "generated_at": "2026-05-19T00:00:00Z",
    "review_gate_status": "reviewed",
    "assignment_count": 1245,
    "negative_challenge_assignment_count": 20
  },
  "preprocessing": {
    "allowed_steps": ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"]
  },
  "labels": [],
  "clips": []
}
```

For approved external raw-video sources, set:

```json
{
  "dataset_source_mode": "approved_external_raw_video_source",
  "external_dataset_import": {
    "source_id": "popsign-v1-original-videos",
    "source_audit": {
      "path": "docs/research/popsign-v1-source-audit.json",
      "sha256": "replace-with-current-source-audit-sha256"
    }
  }
}
```

External manifests still require `source_register`, `vocabulary_review`,
`preprocessing`, `labels`, and `clips`. They do not use the project first-party
`consent_form` or `collection_plan` roots; instead every clip must carry
source-level rights/provenance evidence from the approved source register entry.

`split` must be `train`, `validation`, or `test` and must match the file's role
in the training command.

## Required Label Fields

```json
{
  "label_id": "hello",
  "display_text": "Hello"
}
```

The final pilot target is 75-100 beginner ASL 1 labels. The training script
enforces that range by default. A smaller manifest may be used only for
synthetic wiring tests with `--allow-small-label-set`, and that flag must not be
used for final training.

## Required Clip Fields

```json
{
  "clip_id": "clip-000001",
  "source_id": "first-party-browser-consent-capture",
  "source_license_decision": "first_party_consent_required_v1",
  "source_license_review_status": "approved_after_clip_level_consent",
  "consent_record_id": "consent-signer-001-v1",
  "signer_id": "signer-001",
  "signer_identity_hash": "replace-with-signed-signer-identity-hash",
  "signed_consent_evidence": {
    "path": "data/signer-identity/signer-001-signed-consent-receipt.json",
    "sha256": "replace-with-signed-consent-receipt-sha256",
    "purpose": "Signed consent and identity verification receipt for signer-001"
  },
  "collection_plan_assignment": {
    "assignment_key": "vocabulary:0",
    "collection_plan_sha256": "replace-with-current-reviewed-collection-plan-sha256",
    "assignment": {
      "assignment_key": "vocabulary:0",
      "split": "train",
      "signer_alias": "signer-001",
      "label_id": "hello",
      "display_text": "Hello",
      "capture_count_for_label_split": 1
    }
  },
  "label_id": "hello",
  "relative_video_path": "clips/signer-001/hello-001.webm",
  "sha256": "replace-with-real-video-sha256",
  "relative_frame_tensor_path": "tensors/signer-001/hello-001.pt",
  "frame_tensor_sha256": "replace-with-real-tensor-sha256",
  "frame_tensor_provenance": {
    "schema_version": "asl-pilot-rawframe-decode-provenance/v1",
    "source_video": {
      "relative_video_path": "clips/signer-001/hello-001.webm",
      "path": "data/manifests/clips/signer-001/hello-001.webm",
      "sha256": "replace-with-real-video-sha256"
    },
    "decode": {
      "frame_count": 16,
      "image_size": 96,
      "decode_fps": 12,
      "frame_limit": 64,
      "video_filter": "fps=12,scale=96:96:force_original_aspect_ratio=increase,crop=96:96,format=rgb24",
      "pixel_format": "rgb24"
    },
    "ffmpeg": {
      "path": "/opt/homebrew/bin/ffmpeg",
      "sha256": "replace-with-current-ffmpeg-sha256",
      "version": "ffmpeg version ..."
    },
    "decoded_raw_rgb": {
      "bytes": 442368,
      "sha256": "replace-with-replayed-raw-rgb-sha256"
    },
    "tensor_digest": {
      "dtype": "uint8",
      "shape": [16, 96, 96, 3],
      "layout": "T,H,W,C",
      "sha256": "replace-with-canonical-tensor-payload-sha256"
    }
  },
  "split": "train",
  "frame_source": "raw_rgb_video",
  "allowed_for_model_training": true,
  "derived_features": [],
  "capture": {
    "browser": "Chrome",
    "device": "MacBook webcam",
    "lighting_notes": "face and hands visible",
    "framing_notes": "upper torso and both hands visible",
    "capture_condition_evidence": {
      "schemaVersion": "asl-pilot-capture-conditions/v1",
      "captureEnvironment": "controlled_vocabulary",
      "operatorAttestation": true,
      "operatorAttestedAt": "2026-05-19T00:00:00Z",
      "frontLightingConfirmed": true,
      "upperTorsoAndHandsVisibleConfirmed": true,
      "cameraDistanceWithinPilotRangeConfirmed": true,
      "isolatedPromptSignConfirmed": true,
      "challengeType": null,
      "emptyCameraConfirmed": false,
      "noHandsVisibleConfirmed": false,
      "lowLightConfirmed": false,
      "offCenterConfirmed": false,
      "hardNegativeConditionConfirmed": false,
      "expectedRejectOutcomeConfirmed": false
    },
    "media_stream_track_settings": {}
  },
  "review": {
    "label_reviewer": "replace-with-reviewer-id",
    "label_review_status": "approved",
    "reviewed_at": "2026-05-19T00:00:00Z"
  }
}
```

For approved external PopSign clips, replace first-party consent and collection
assignment fields with source provenance:

```json
{
  "clip_id": "popsign-v1-train-hello-000001",
  "source_id": "popsign-v1-original-videos",
  "source_license_decision": "approved_popsign_v1_original_videos_2026_05_20",
  "source_license_review_status": "approved_cc_by_4_raw_video_with_attribution",
  "source_record_id": "popsign_v1_0/game/train/hello/<source-file>.mp4",
  "source_split": "train",
  "source_category": "game",
  "source_sign_slug": "hello",
  "source_archive_url": "https://signdata.cc.gatech.edu/data/popsign_v1_0/game/train/hello.tar",
  "source_video_path": "<source-file>.mp4",
  "source_subject_rights_evidence": {
    "path": "docs/research/popsign-v1-source-review.md",
    "sha256": "replace-with-current-source-review-sha256"
  },
  "signer_id": "popsign-source-signer-alias",
  "signer_identity_hash": "replace-with-pseudonymous-source-signer-hash",
  "label_id": "hello",
  "relative_video_path": "../external/popsign-v1/raw/popsign_v1_0/game/train/hello/<source-file>.mp4",
  "sha256": "replace-with-real-video-sha256",
  "split": "train",
  "frame_source": "raw_rgb_video",
  "allowed_for_model_training": true,
  "derived_features": [],
  "review": {
    "label_reviewer": "popsign-source-label-plus-asl-pilot-import-audit",
    "label_review_status": "approved",
    "reviewed_at": "2026-05-20T00:00:00Z"
  }
}
```

For first-party manifests, final validators parse `signed_consent_evidence` as
a JSON receipt, not just a display reference. The receipt must match the current
consent form hash/version, the clip `signer_id`, `signer_identity_hash`, and
include the clip `consent_record_id` with all required consent flags confirmed.
It must also include machine-verifiable Ed25519 `signature_evidence` over the
canonical signed consent receipt payload.

`derived_features` must stay empty. If a clip or preprocessing record contains
tokens such as `pretrained`, `weights`, `checkpoint`, `mediapipe`, `openpose`,
`yolo`, `landmark`, `embedding`, `feature_extractor`, or `backbone`, the scaffold
fails closed.

`relative_frame_tensor_path`, `frame_tensor_sha256`, and
`frame_tensor_provenance` are required for actual final training. They may be
omitted for schema/provenance dry-runs, but a non-dry-run final training command
will fail clearly until every clip has a hash-pinned decoded frame tensor whose
FFmpeg decode can be replayed from the source video.

Final manifests must also provide at least five approved clips for every label
in each split. The manifest exporter and training script fail if a split claims
a label with fewer approved clips. The training script also rejects final
manifests unless they bind to the current machine-readable source register,
`docs/review/final-vocabulary-review.json`, the current
`web/src/lib/vocabulary.ts` hash, and every clip has
`review.label_review_status: "approved"`.

First-party manifests must also bind to
`docs/privacy/dataset-consent-form.md` and the reviewed
`data/dataset/collection-plan.json` hash. Each first-party exported clip must
carry the exact `collection_plan_assignment` key and assignment snapshot used
during capture, plus `capture.capture_condition_evidence` proving the operator
attested front lighting, upper-torso/hands framing, 0.8-1.5 meter distance, and
one isolated prompted sign for the exact recording. The first-party pilot
collection target is at least 20 signers overall, with at least 12 train
signers, 4 validation signers, and 4 test signers under the deterministic
signer-disjoint split function.

External PopSign manifests must instead bind to `external_dataset_import`, keep
source split boundaries, retain source-level rights/provenance evidence on each
clip, and use pseudonymous source signer hashes.

## Decoded Frame Tensor Contract

Training uses PyTorch `.pt` or `.pth` files created from raw RGB video after
only allowed preprocessing steps such as decode, frame sampling, resize, crop,
and RGB normalization. Each tensor file must contain either a tensor directly or
a dictionary with a tensor under `frames`, `tensor`, or `rgb_frames`.
`scripts/decode_raw_videos.py` writes `frame_tensor_provenance` next to each
tensor reference. Local Mac decode/preflight gates replay that provenance from
the raw video and compare the decoded RGB byte digest, the canonical tensor
payload digest, and the current tensor file hash. Brev/Linux training and
evaluation hosts verify the recorded source-video hash, current tensor-file
hash, and saved tensor payload digest, but do not require the Linux FFmpeg
binary to match the Mac FFmpeg binary that produced the tensors.

Accepted tensor layouts:

- `TCHW`: time, channel, height, width.
- `THWC`: time, height, width, channel.
- `CTHW`: channel, time, height, width.

The channel count must be 3. Values may be normalized RGB floats or uint8-style
RGB values. The training script samples/pads to `--frame-count`, resizes to
`--image-size`, and trains a randomly initialized raw-frame classifier. Final
training uses `--architecture compact_3d_cnn_spatiotemporal`, currently a
from-scratch Conv3D/BatchNorm3D compact classifier,
`--architecture compact_3d_cnn_spatiotemporal_clip_norm`, the same compact
family with model-internal per-clip RGB standardization before the Conv3D stack,
or
`--architecture factorized_3d_cnn_spatiotemporal`, a stronger from-scratch
factorized Conv3D/BatchNorm3D candidate. The legacy
`small_2d_cnn_frame_encoder_with_temporal_mean_pooling` architecture is kept only
for smoke and wiring compatibility. Optional `--training-augmentation basic`
applies train-only raw RGB tensor transforms after decode and before the model
forward pass; `--training-augmentation mild` is a lighter variant for larger
final candidate runs. These options do not add or require any manifest feature
fields. `--checkpoint-selection best_validation` affects only which trained
epoch is saved into `model_state.pt`; it is recorded in training provenance and
does not alter manifest shape.

## Commands

Print help:

```sh
./.venv/bin/python scripts/train_rawframe_model.py --help
```

Validate manifests without training:

```sh
node scripts/export_dataset_manifests.mjs
node scripts/plan_dataset_collection.mjs --summary-only
./.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --dry-run
```

Import approved PopSign train/validation/test raw-video manifests without
storing complete tar archives:

```sh
node scripts/audit_popsign_v1_source.mjs --write
node scripts/audit_source_register.mjs
node scripts/export_popsign_v1_import_plan.mjs --write
./.venv/bin/python scripts/import_popsign_v1_raw_videos.py \
  --clips-per-label-split 19 \
  --download-missing stream \
  --stream-retries 4 \
  --write
./.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --dry-run \
  --check-files \
  --output-dir artifacts/rawframe-model
```

Decode raw videos into hash-pinned tensors after manifest export:

```sh
./.venv/bin/python scripts/decode_raw_videos.py \
  --manifest data/manifests/train.json \
  --manifest data/manifests/validation.json \
  --manifest data/manifests/test.json
```

Replay-verify decoded tensor provenance before training:

```sh
./.venv/bin/python scripts/decode_raw_videos.py \
  --manifest data/manifests/train.json \
  --manifest data/manifests/validation.json \
  --manifest data/manifests/test.json \
  --verify-only
```

Train from scratch with PyTorch if it is installed:

```sh
./.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --output-dir artifacts/rawframe-model \
  --architecture factorized_3d_cnn_spatiotemporal \
  --training-augmentation mild \
  --label-smoothing 0.05 \
  --checkpoint-selection best_validation \
  --check-files \
  --epochs 5 \
  --batch-size 8
```

Evaluate signer-disjoint validation/test metrics and create calibrated provenance:

```sh
./.venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint artifacts/rawframe-model/model_state.pt \
  --training-provenance artifacts/rawframe-model/training-provenance.json \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --challenge-manifest data/manifests/negative-challenge.json \
  --output-report artifacts/rawframe-model/validation-report.json \
  --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json
```

Export the calibrated checkpoint to an ONNX browser artifact:

```sh
./.venv/bin/python scripts/export_onnx_model.py \
  --checkpoint artifacts/rawframe-model/model_state.pt \
  --training-provenance artifacts/rawframe-model/calibrated-provenance.json \
  --output web/public/model/asl-pilot-rawframe-v0.onnx
```

`scripts/evaluate_rawframe_model.py` validates checkpoint/provenance/manifest
binding and fails real candidate models that miss the target metrics, select a
non-positive threshold, or exceed the negative challenge false-pass target.
Negative challenge manifests are documented in
`docs/model/negative-challenge-manifest-schema.md`. `scripts/export_onnx_model.py`
validates random-initialization provenance, empty pretrained components,
75-100 labels, uncapped training, train/validation/test manifests, and negative
challenge evidence before treating an export as a candidate final artifact.
Synthetic wiring checks must pass `--allow-smoke-eval` or
`--allow-smoke-export` explicitly.

The training command uses CUDA on Brev/Linux GPU workers, otherwise MPS on
supported Apple Silicon Macs. CPU is not accepted for real candidate training.
If PyTorch is unavailable, or if any decoded frame tensor path or hash is
missing, the command fails before writing a model artifact.

Require clip files to exist under the project root and match their recorded
SHA-256 hashes:

```sh
./.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --check-files \
  --dry-run
```
