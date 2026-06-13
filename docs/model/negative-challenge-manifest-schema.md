# Negative Challenge Manifest Schema

Final validation must include clips that should never be marked correct for any
prompt. This closes the empty-camera/no-hands/low-light/off-center loophole:
the model can pass signer-disjoint label metrics only if it also stays
fail-closed on reject-only challenge clips at the selected confidence threshold.

The default final path is:

```sh
python3 scripts/evaluate_rawframe_model.py \
  --checkpoint artifacts/rawframe-model/model_state.pt \
  --training-provenance artifacts/rawframe-model/training-provenance.json \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --challenge-manifest data/manifests/negative-challenge.json \
  --output-report artifacts/rawframe-model/validation-report.json \
  --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json
```

`--challenge-manifest` is required for final validation. It may be omitted only
with `--allow-smoke-eval`, which produces smoke-only evidence that cannot be
promoted to the final model card.

## Required Root Fields

```json
{
  "schema_version": "asl-pilot-negative-challenge-manifest/v1",
  "dataset_id": "asl-pilot-negative-challenge-v0",
  "dataset_source_mode": "first_party_consent_capture",
  "split": "negative_challenge",
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
  "external_dataset_import": null,
  "preprocessing": {
    "allowed_steps": ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"]
  },
  "clips": []
}
```

`dataset_source_mode` may be `first_party_consent_capture` or
`approved_external_raw_video_source`. First-party challenge manifests must bind
to `consent_form`, `collection_plan`, `collection_plan_assignment`, and
`signed_consent_evidence`. Approved external raw-video challenge manifests must
instead bind to `external_dataset_import` and a source-register entry with an
approved external rights review; they must still include source-register,
vocabulary-review, raw-video hash, decoded tensor hash, challenge-condition
attestation, and clip review evidence.

## Required Clip Fields

```json
{
  "clip_id": "challenge-000001",
  "source_id": "first-party-browser-consent-capture",
  "source_license_decision": "first_party_consent_required_v1",
  "source_license_review_status": "approved_after_clip_level_consent",
  "consent_record_id": "consent-challenge-001-v1",
  "signer_id": "challenge-signer-001",
  "signer_identity_hash": "replace-with-signed-signer-identity-hash",
  "signed_consent_evidence": {
    "path": "data/signer-identity/challenge-signer-001-signed-consent-receipt.json",
    "sha256": "replace-with-signed-consent-receipt-sha256",
    "purpose": "Signed consent and identity verification receipt for challenge-signer-001"
  },
  "collection_plan_assignment": {
    "assignment_key": "negative_challenge:0",
    "collection_plan_sha256": "replace-with-current-reviewed-collection-plan-sha256",
    "assignment": {
      "assignment_key": "negative_challenge:0",
      "split": "negative_challenge",
      "signer_alias": "challenge-signer-001",
      "challenge_type": "empty_camera",
      "expected_outcome": "reject",
      "capture_count_for_type": 1
    }
  },
  "relative_video_path": "../clips/challenge/empty-camera-001.webm",
  "sha256": "replace-with-real-video-sha256",
  "relative_frame_tensor_path": "../tensors/negative_challenge/challenge-000001.pt",
  "frame_tensor_sha256": "replace-with-real-tensor-sha256",
  "split": "negative_challenge",
  "frame_source": "raw_rgb_video",
  "allowed_for_validation": true,
  "expected_outcome": "reject",
  "challenge_type": "empty_camera",
  "derived_features": [],
  "capture": {
    "browser": "Chrome",
    "device": "MacBook webcam",
    "lighting_notes": "challenge condition documented by operator",
    "framing_notes": "operator-reviewed challenge condition",
    "capture_condition_evidence": {
      "schemaVersion": "asl-pilot-capture-conditions/v1",
      "captureEnvironment": "negative_challenge",
      "operatorAttestation": true,
      "operatorAttestedAt": "2026-05-19T00:00:00Z",
      "frontLightingConfirmed": false,
      "upperTorsoAndHandsVisibleConfirmed": false,
      "cameraDistanceWithinPilotRangeConfirmed": false,
      "isolatedPromptSignConfirmed": false,
      "challengeType": "empty_camera",
      "emptyCameraConfirmed": true,
      "noHandsVisibleConfirmed": false,
      "lowLightConfirmed": false,
      "offCenterConfirmed": false,
      "hardNegativeConditionConfirmed": false,
      "expectedRejectOutcomeConfirmed": true
    },
    "media_stream_track_settings": {}
  },
  "review": {
    "reviewer": "replace-with-reviewer-id",
    "challenge_review_status": "approved",
    "reviewed_at": "2026-05-19T00:00:00Z"
  }
}
```

For `approved_external_raw_video_source` challenge clips,
`consent_record_id`, `signed_consent_evidence`, and
`collection_plan_assignment` are not required. The clip must instead include
file-level external provenance:

```json
{
  "source_record_id": "commons-file-title-or-stable-id",
  "source_page_url": "https://commons.wikimedia.org/wiki/File:example.webm",
  "source_file_url": "https://upload.wikimedia.org/wikipedia/commons/example.webm",
  "source_file_page_title": "File:example.webm",
  "source_license_short_name": "CC BY 4.0",
  "source_author": "replace-with-file-author",
  "source_file_metadata": {
    "license_short_name": "CC BY 4.0",
    "mime": "video/webm",
    "source_sha256": "replace-with-downloaded-video-sha256"
  }
}
```

Final validators parse `signed_consent_evidence` as a JSON receipt, not just a
display reference. The receipt must match the current consent form hash/version,
the clip `signer_id`, `signer_identity_hash`, and include the clip
`consent_record_id` with all required consent flags confirmed. It must also
include machine-verifiable Ed25519 `signature_evidence` over the canonical
signed consent receipt payload.

Final first-party challenge manifests must include at least five clips for each
retained lesson hard-negative type:

- `idle_hands`
- `empty_camera`
- `no_hands_visible`
- `low_light`
- `off_center`
- `hands_cropped_out`
- `waving`
- `thumbs_up`
- `counting`
- `fingerspelling_like_motion`
- `wrong_location`
- `wrong_palm_orientation`
- `partial_sign`
- `non_target_asl_sign`
- `casual_non_asl_gesture`

The four core capture-condition types use their dedicated boolean fields in
`capture.capture_condition_evidence`. The remaining hard-negative types set
`challengeType` to the exact type and use
`hardNegativeConditionConfirmed: true` while all four core condition booleans
remain false.

External challenge clips may use raw video containers accepted by the decode
pipeline, currently WebM, MP4, or Ogg, as long as every file is hash-pinned and
bound to approved source provenance before final use.

Challenge clips must be hash-pinned raw RGB video plus decoded tensor artifacts,
must be bound to `docs/model/dataset-source-register.json`, to either
first-party consent/collection-plan evidence or approved external source-import
evidence, and to the final reviewed vocabulary evidence, must include
`capture.capture_condition_evidence` matching the exact negative challenge type,
must be explicitly allowed for validation, and must not include derived landmarks, boxes,
embeddings, pretrained detector outputs, or feature files. Final evaluation also
requires challenge signers to be disjoint from train, validation, and test
signers, or external source-subject hashes to be disjoint from those signer
hashes when the clip has no consenting signer.

The selected threshold comes from the validation split. The challenge set is
then evaluated at that same threshold. Final validation fails unless
`negative_challenge.metrics.false_pass_rate` is below `0.05`.
