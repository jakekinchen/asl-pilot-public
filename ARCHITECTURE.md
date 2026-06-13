# ARCHITECTURE

Status: **finalized for round 1** after gap audit on 2026-05-23.
See [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) for the gap analysis this round is built on.
See [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md) for the 95+ hard gates this file references.

## architecture principles {#arch-principles}

### rule

The system is a controlled browser-based ASL 1 vocabulary practice pilot. It optimizes for honest scope, privacy, beginner usability, and traceable model provenance.

### invariants

- Every implementation task cites one or more architecture anchors.
- No task invents architecture silently.
- If a public model/interface changes, this file must change in the same round.
- No learner raw video upload occurs during normal practice.
- The promoted recognition path is scratch-trained with random initialization.
- This file does not duplicate `docs/strategy-confidence-audit.md`; it references its hard gates by name.

### validation

Run `/check-arch` for every slice and require task anchors in commit messages.

---

## product scope {#arch-product-scope}

### rule

Build a browser app where a learner logs in, practices prompted beginner ASL vocabulary, uses the camera to sign, receives pass/fail feedback and targeted hints, retries, and saves progress.

### affected models/interfaces

- `LearnerAccount` — implemented via Supabase Auth (see [`web/src/lib/supabase-server.ts`](web/src/lib/supabase-server.ts), [`web/src/lib/supabase-store.ts`](web/src/lib/supabase-store.ts))
- `VocabularyItem` — currently TS module at [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts)
- `PracticeSession` — implicit; each attempt is currently standalone
- `PracticeAttempt` — `attempts` table in [`supabase/migrations/`](supabase/migrations/); API at [`web/src/app/api/attempts/route.ts`](web/src/app/api/attempts/route.ts)
- `PassFailDecision` — see [`#arch-passfail-thresholds`](#arch-passfail-thresholds)
- `Hint` — currently a verifier-returned `reason` string (gap; see [`#arch-vocab-hints`](#arch-vocab-hints))

### invariant

The app must remain a pilot for isolated ASL vocabulary signs; it must not present itself as sentence translation, open-ended interpretation, or classroom assessment. Enforced by [`scripts/audit_scope_boundaries.mjs`](scripts/audit_scope_boundaries.mjs) (existing).

### validation

Final demo shows login, practice session, camera permission handling, inference/pass-fail, hint, retry, next sign, and saved progress. Enforced live by [`scripts/run_practice_progress_smoke.mjs`](scripts/run_practice_progress_smoke.mjs) and [`scripts/audit_practice_screen_contract.mjs`](scripts/audit_practice_screen_contract.mjs) (existing).

---

## ASL-only isolated vocabulary {#arch-asl-vocabulary-scope}

### rule

The product supports American Sign Language only. The learning unit is one isolated beginner vocabulary item.

### affected models/interfaces

- `VocabularyItem.gloss`
- `VocabularyItem.language = "ASL"`
- `ActiveSignModule`

### invariant

No BSL/multilingual sign translation abstractions in pilot code paths unless explicitly marked deferred/out of scope.

### validation

Vocabulary manifest contains ASL-only beginner glosses, and UI copy does not claim multi-language or sentence support. Enforced by existing [`scripts/audit_vocabulary_review.mjs`](scripts/audit_vocabulary_review.mjs) and [`scripts/audit_scope_boundaries.mjs`](scripts/audit_scope_boundaries.mjs).

---

## active recognition module vs content vocabulary {#arch-active-module}

### rule

The app contains 100 content vocabulary items (already implemented at [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts)), but recognition pass/fail is enabled only for signs present in the active validated model module.

### affected models/interfaces

- `VocabularyItem.recognitionStatus`: `active | content_only | disabled`
- `ActiveSignModule`
- `ModelManifest.activeLabels`
- `PracticePrompt`

### invariant

The UI must not ask the model to pass/fail a sign outside `ModelManifest.activeLabels`. Unsupported signs must be content-only or disabled for camera evaluation.

### validation

Tests verify that unsupported vocabulary cannot produce a correct/pass result from the recognizer. Existing enforcement: the fail-closed branch in [`web/src/lib/client-model.ts`](web/src/lib/client-model.ts) returns `{passed: false}` when the model card status is `not_trained`. Per-vocab gating to be added under [`#arch-passfail-thresholds`](#arch-passfail-thresholds).

---

## no-pretrained clean lane {#arch-no-pretrained}

### rule

The promoted recognition path uses team-trained architecture and weights only.
Pretrained sign classifiers, pretrained hand/pose landmark detectors, pretrained feature extractors, and pretrained general-purpose CV backbones are **forbidden** in the promoted path.

This includes MediaPipe Hand Landmarker / Pose Landmarker / Holistic, OpenPose, YOLO, ResNet, EfficientNet, ViT, CLIP, SAM, DINO, MMPose, MMDet, and any `from_pretrained` / `torch.hub` / `weights=` / pretrained `timm` load.

### training-label fallback clarification

Runtime dependency and training-label provenance are separate decisions.
MediaPipe/OpenPose/YOLO or other pretrained landmark systems remain forbidden
as browser/runtime dependencies, feature extractors, active model components,
or promoted model prerequisites.

For future hand-landmark source work only, generated labels may be considered
as offline weak supervision after all of these are true:

- manual or human-in-loop public keypoint sources have been reviewed first and
  documented as insufficient for the exact training need;
- the user explicitly approves the source, license posture, partitions, import
  envelope, and generated-label provenance;
- the student model starts from random initialization and does not load or call
  the teacher system at runtime;
- validation is performed against held-out manual/human labels where available,
  not solely against the generated-label source;
- manifests and receipts label the data as `generated` or `weak_supervision`,
  not `manual`, and keep it out of browser/product authority until the normal
  promotion gates pass.

This fallback does not revive the deprecated Stage A MediaPipe runtime path.
It only allows a separately approved offline training-label source if human
labels are not enough.

### Stage A vestige

The previous demo implementation (Stage A: DTW templates over MediaPipe Hand Landmarker normalized landmarks) is a **vestige slated for removal**. It was a transparency-disclosed academic lane while no first-party raw-video dataset existed. Now that the plan locks the strict no-pretrained invariant for the promoted path, Stage A and all of its assets must be removed:

- `web/package.json` → drop `@mediapipe/tasks-vision`
- `web/src/asl/extract/mediapipeHandExtractor.ts` → delete
- `web/src/asl/stageARecognizer.ts` → delete (or rewrite to fail-closed only)
- `web/src/asl/verifier/templateVerifier.ts` → delete unless reused without pretrained inputs
- `web/public/models/mediapipe/` → delete (pretrained `.task` + WASM)
- `web/public/model/stage-a-*.verifier.json` → archive/delete (DTW templates over pretrained landmarks)
- `artifacts/stage_a/feature_cache_v0/*.landmarks.json` → archive out of tree (pretrained-extracted; 1321 tracked + 1398 untracked)
- `artifacts/stage_a/teacher_*/`, `smoke_*label_v0/`, `probe_*` → archive out of tree
- `artifacts/stage_b/supervision_*_v*/manifest.json` → archive (declare pretrained `extractor` field)
- Stage-A-specific scripts (`audit_stage_a_*.mjs`, `analyze_stage_a_*.py`, `train_manifest_keypoint_lstm_sequence_classifier.py`, etc.) → archive
- `docs/model/mediapipe_tasks_vision_disclosure.md` → archive (no longer needed; promoted path forbids pretrained)
- `docs/validation/academic-benchmark-summary.json` → reframe as "deprecated demo evidence" or archive

Removal is tracked as `task-026` in [`MVP_TASKS.md`](MVP_TASKS.md) and briefed in [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md).

### affected models/interfaces

- `ModelManifest.training.initialization` = `"random"` only
- `DatasetProvenance.labelSource` = first-party consented or explicitly cleared
- `NoPretrainedAudit`
- `TrainingRunManifest`

### invariant

No promoted model artifact may depend on pretrained weights, runtime
pretrained landmarks, or pretrained feature embeddings. Manifests must not
contain an `extractor` field referencing a pretrained model as an active
runtime or feature-extraction dependency. If a future approved dataset uses
generated labels as offline weak supervision, that provenance must be explicit
and separately gated from runtime dependency and product promotion.

### validation

Existing: [`scripts/audit_no_pretrained_deps.mjs`](scripts/audit_no_pretrained_deps.mjs) (import/dep scan), [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs) (artifact JSON scan).

**Required addition** (post Stage A removal): the artifact JSON scan must be tightened so any new `extractor: { name: "mediapipe_*" }` field fails the audit. The current passing state relied on MediaPipe being a disclosed boundary; with Stage A removed, any reappearance is a regression.

`docs/validation/no-pretrained-lane-audit.json` becomes a new required artifact summarizing both audits after Stage A removal.

---

## camera capture and browser privacy {#arch-camera-privacy}

### rule

During normal practice, camera frames stay in the browser. Progress persistence stores attempts/outcomes/metadata, not raw video or frame images.

### affected models/interfaces

- `CameraCaptureController` — currently inline in [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx)
- `FrameWindow`
- `InferenceEngine` — see [`#arch-inference-contract`](#arch-inference-contract)
- `ProgressRepository` — at [`web/src/lib/supabase-store.ts`](web/src/lib/supabase-store.ts)
- `PracticeAttempt` — `attempts` table

### invariant

No `PracticeAttempt` persistence schema contains raw frame blobs, video URLs, or base64 image fields.

### validation

Existing: [`scripts/audit_no_raw_video_upload.mjs`](scripts/audit_no_raw_video_upload.mjs), [`scripts/audit_attempt_integrity.mjs`](scripts/audit_attempt_integrity.mjs), [`scripts/audit_final_privacy_smoke.mjs`](scripts/audit_final_privacy_smoke.mjs), [`scripts/run_practice_progress_smoke.mjs`](scripts/run_practice_progress_smoke.mjs). Network inspection during demo confirms no video upload (see `docs/strategy-confidence-audit.md` hard gates "Browser-default inference", "No raw-video upload by default", "Final privacy smoke drift", "Runtime practice/progress drift").

---

## learner accounts and progress {#arch-accounts-progress}

### rule

Learners can log in and return to saved practice history.

### affected models/interfaces

- `LearnerAccount` — Supabase Auth
- `ProgressRecord` — `attempt_progress` view in [`supabase/migrations/`](supabase/migrations/)
- `PracticeSession` — implicit (gap: no explicit session table; each attempt is standalone)
- `PracticeAttempt` — `attempts` table
- `MasteryState` — inferred from `attempt_progress` view (status = "mastered" when passes ≥ 2)
- `AuthRepository` — direct Supabase use today (no explicit interface); reachable via [`web/src/app/api/auth/{login,logout,register}/route.ts`](web/src/app/api/auth/)
- `ProgressRepository` — [`web/src/lib/supabase-store.ts`](web/src/lib/supabase-store.ts) + [`web/src/app/api/progress/route.ts`](web/src/app/api/progress/route.ts) + [`web/src/app/api/attempts/route.ts`](web/src/app/api/attempts/route.ts)

### invariant

Progress records must include vocabulary attempted, pass/fail outcomes, attempt count, mastery/completion status, and recent history. They must not include raw video.

### validation

Existing: [`scripts/audit_progress_contract.mjs`](scripts/audit_progress_contract.mjs), [`scripts/audit_practice_progress_smoke.mjs`](scripts/audit_practice_progress_smoke.mjs).

---

## web app learner flow {#arch-learner-flow}

### rule

The learner flow is login → session start → prompt → camera permission → capture → evaluation → result/hint → retry/next → progress saved.

### affected models/interfaces

- `PracticeRoute` — currently single-component [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) on `/`
- `PracticePrompt`
- `CameraPermissionState` — `cameraStatus` state machine in PracticeApp
- `AttemptStateMachine`
- `ResultPanel`

### invariant

Every camera failure state has a clear UI path: denied, unavailable, unsupported, loading, low quality, and retry. Per `strategy-confidence-audit.md` hard gate "Runtime camera UI drift", retained Playwright evidence is required.

### validation

Existing: [`scripts/audit_practice_screen_contract.mjs`](scripts/audit_practice_screen_contract.mjs), [`scripts/audit_browser_compatibility.mjs`](scripts/audit_browser_compatibility.mjs). Playwright camera-state evidence required by hard gate; current Playwright dependency declared in [`web/package.json`](web/package.json) but no spec files exist yet.

---

## vocabulary and hint metadata {#arch-vocab-hints}

### rule

Each vocabulary item has metadata sufficient for beginner feedback: gloss, display prompt, active recognition status, allowed module, and hint cues for handshape/movement/location/orientation/timing/framing.

### affected models/interfaces

- `VocabularyItem` — current at [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) has `{id, label, gloss, notes}` (gap: no phonological metadata)
- `SignHintMetadata` — to be added
- `HintEngine`
- `Hint`
- Existing reviewer authority chain: [`docs/review/final-vocabulary-review.json`](docs/review/final-vocabulary-review.json) + [`docs/privacy/dataset-consent-form.md`](docs/privacy/dataset-consent-form.md) + Ed25519 signed reviewer evidence under `data/vocabulary-review/evidence/`

### invariant

An incorrect or abstained attempt produces a targeted hint, not only `incorrect`. Per `strategy-confidence-audit.md` hard gates "Honest targeted hints" and "Hint pedagogy review ambiguity": hints must be either vocabulary-level coaching or runtime-observable, never fake phonology diagnosis.

### validation

Unit-style: a hint test fixture (see `task-018` validation). Reviewer-level: [`scripts/audit_hint_pedagogy_review.mjs`](scripts/audit_hint_pedagogy_review.mjs) (existing per hard gate row).

---

## inference runtime contract {#arch-inference-contract}

### rule

The browser calls an `InferenceEngine` interface that accepts a local frame window and active model manifest, then returns logits/probabilities, quality signals, and metadata needed for pass/fail.

### affected models/interfaces

```ts
interface InferenceEngine {
  load(manifest: ModelManifest): Promise<void>;
  predict(input: FrameWindow, promptGloss: string): Promise<InferenceResult>;
}

interface InferenceResult {
  top1: string;
  top1Probability: number;
  top2?: string;
  top2Probability?: number;
  entropy?: number;
  quality: CaptureQuality;
  logitsRef?: string;
  modelVersion: string;
}
```

Current implementation: procedural chain at [`web/src/lib/client-model.ts`](web/src/lib/client-model.ts) (`evaluateLocalAttempt`, `sampleVideoFrame`, `loadModelCard`). Refactor to the typed interface above is `task-017`. The current `evaluateStageAAttempt` path is part of the Stage A vestige and is removed by `task-026`.

### invariant

UI components do not directly inspect raw model internals; they consume `PassFailDecision` and `Hint` outputs.

### validation

Mock inference engine tests can drive practice UI without a real model; browser smoke test uses exported model via [`scripts/run_browser_onnx_wiring_smoke.mjs`](scripts/run_browser_onnx_wiring_smoke.mjs), [`scripts/audit_browser_onnx_wiring_smoke.mjs`](scripts/audit_browser_onnx_wiring_smoke.mjs), [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs). Per `strategy-confidence-audit.md` "Browser ONNX semantic parity gap": PyTorch ↔ ONNX logit parity fixture is mandatory.

---

## pass/fail decision engine {#arch-passfail-thresholds}

### rule

Use documented thresholds. Accept a sign as pass only if all gates pass:

- prompt gloss equals predicted top1;
- top1 is in active module;
- top1 probability ≥ class threshold;
- top1−top2 margin ≥ margin threshold;
- entropy ≤ entropy threshold if available;
- capture quality passed;
- hard-negative/open-set score passed if available.

### affected models/interfaces

- `PassFailDecision` — currently binary in [`web/src/lib/client-model.ts`](web/src/lib/client-model.ts); refactor target
- `ThresholdConfig` — currently inside `model-card.json` (`confidence_thresholds.default: 0.72`) and per-verifier JSON
- `CaptureQuality`
- `HardNegativeReport` — see [`data/guardrail-negative-fixtures/`](data/guardrail-negative-fixtures/), [`scripts/audit_guardrail_negative_fixtures.mjs`](scripts/audit_guardrail_negative_fixtures.mjs)

### invariant

Plain argmax is never sufficient for `pass`. Per `strategy-confidence-audit.md` hard gate "Calibrated fail-closed thresholds": fail below threshold even if expected class is top ranked.

### validation

Unit tests cover threshold boundary cases, unsupported signs, uncertain predictions, wrong top1, poor capture quality, and hard negatives. Plus existing chain analyzers: [`scripts/analyze_controlled_pilot_reject_score_grid.mjs`](scripts/analyze_controlled_pilot_reject_score_grid.mjs), [`scripts/analyze_controlled_pilot_thresholds.mjs`](scripts/analyze_controlled_pilot_thresholds.mjs).

---

## dataset provenance and source rights {#arch-data-provenance}

### rule

Every clip, label, annotation, and metadata field used for training/evaluation has recorded provenance and lane eligibility.

### affected models/interfaces

- `DatasetClip`
- `DatasetSubsetManifest` — many under [`data/manifests/`](data/manifests/)
- `SourceRightsMatrix` — [`docs/model/dataset-source-register.json`](docs/model/dataset-source-register.json) (existing, hash-bound)
- `AnnotationProvenancePolicy`
- Reviewer authority chain: `data/vocabulary-review/evidence/` (Ed25519, hash-pinned)
- Signer identity: [`data/signer-identity/`](data/signer-identity/) (Ed25519 + signed consent receipt)

### invariant

Unknown or pretrained-generated labels are excluded from promoted clean-lane training/evaluation. After Stage A removal, no `extractor` field referencing a pretrained model may appear in any active manifest.

### validation

Existing chain: [`scripts/audit_source_register.mjs`](scripts/audit_source_register.mjs), [`scripts/audit_dataset_source_research.mjs`](scripts/audit_dataset_source_research.mjs), [`scripts/refresh_dataset_source_research.mjs`](scripts/refresh_dataset_source_research.mjs) `--write`, [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs). Per `strategy-confidence-audit.md` hard gates "Source register binding", "URL-only source research drift", "Source review bypass", "Hand-authored vocabulary review evidence".

---

## first-party consented collection {#arch-first-party-data}

### rule

The dataset policy is **first-party consented collection** as the default. Public ASL datasets (ASL Citizen, WLASL, MS-ASL, NVIDIA ASL, PopSign) are research references only unless explicit rights review clears the exact use.

The browser collection UI/API is **disabled by default** behind `ENABLE_DATASET_COLLECTION=true` + `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true` env vars.

### affected models/interfaces

- `CollectionPlan` — [`data/dataset/collection-plan.json`](data/dataset/) (gitignored at the raw clip level)
- `SignerRoster` — `output/collection-handoff/collection-session-bundle/`
- `SignerIdentity` — [`data/signer-identity/`](data/signer-identity/), Ed25519
- `ConsentReceipt` — [`docs/privacy/dataset-consent-form.md`](docs/privacy/dataset-consent-form.md), Ed25519-signed signature evidence

### invariant

Default browser path **must not** upload raw clips. Per-split signer targets: ≥12 train, ≥4 validation, ≥4 test signers (hard gate "Per-split signer coverage"). Every label ≥5 approved train/validation/test clips (hard gate "Complete label coverage").

### validation

Existing chain: [`scripts/audit_dataset_collection_readiness.mjs`](scripts/audit_dataset_collection_readiness.mjs), [`scripts/audit_collection_plan_contract.mjs`](scripts/audit_collection_plan_contract.mjs), [`scripts/audit_collection_plan_freshness.mjs`](scripts/audit_collection_plan_freshness.mjs), [`scripts/audit_reviewed_vocabulary_collection_gate.mjs`](scripts/audit_reviewed_vocabulary_collection_gate.mjs), [`scripts/run_dataset_collection_runtime_smoke.mjs`](scripts/run_dataset_collection_runtime_smoke.mjs).

---

## local storage and dataset pull policy {#arch-storage-policy}

### rule

Use bounded local storage. Do not download full PopSign or full native HaGRID. Pull only selected signs/subsets required for active modules and detector experiments. First-party collection clips count toward the local budget.

### affected models/interfaces

- `StorageBudgetReport`
- `SourceAccessVerification`
- `DatasetSubsetManifest`
- `BrevShardManifest` — only when heavy GPU work runs on Brev (see [`#arch-gpu-execution`](#arch-gpu-execution))

### invariant

Before major data pull/build: local free space ≥ 250 GB and project data ≤ 650 GB. Per `strategy-confidence-audit.md` hard gate "Local GPU/open-source environment drift", the local environment receipt at [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json) requires 40 GiB minimum / 100 GiB recommended project-volume headroom.

### validation

`configs/storage-budget.json` (newly seeded) plus a `scripts/storage_budget_check.sh` to be authored under `task-006`. Reuse [`scripts/audit_local_ml_environment.py`](scripts/audit_local_ml_environment.py) for environment receipt.

---

## training pipeline {#arch-training-pipeline}

### rule

Training proceeds smoke-first: 2-epoch 10-clips/class smoke, 5/10-sign sanity, full 10-sign run, 20-sign expansion only after gates pass.

### affected models/interfaces

- `TrainingRunManifest`
- `RawFrameRecognizer` — current entrypoint [`scripts/train_rawframe_model.py`](scripts/train_rawframe_model.py); state at [`artifacts/rawframe-model/`](artifacts/rawframe-model/)
- `GuidedCropSignNet` — renamed alias for the promoted candidate; same entrypoint family
- `ModelManifest` — [`web/public/model/model-card.json`](web/public/model/model-card.json)

### invariant

No large GPU run starts until source access, active module, storage, dataloader smoke, loss-decrease smoke, and run manifest gates pass. Per `strategy-confidence-audit.md` hard gate "Direct training entrypoint bypass": `train_rawframe_model.py` rejects final training without `--test-manifest` and `--check-files`, and rejects non-dry-run smoke training that targets `artifacts/rawframe-model`.

### validation

Every GPU run writes start/end manifest, config, metrics, and artifact paths. Per `strategy-confidence-audit.md` "From-scratch provenance overclaim": bind to command arrays, script hashes, manifest hashes, canonical pre-/post-training state digests, and `requirements.txt` / `web/package-lock.json` hashes.

---

## GPU execution policy {#arch-gpu-execution}

### rule

- **Light work** (smoke runs, dataloader checks, evaluation, ONNX export, browser smoke, audits) runs on the **local Mac Studio (Apple MPS, PyTorch 2.12.0)**. Receipt: [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json) (existing).
- **Heavy GPU training** (full rawframe runs, large batch training, multi-epoch promoted-candidate training, ablation studies, hard-negative training) runs on **Brev remote GPU workers**.
- **Do not reduce final training/evaluation scope for local convenience.** The user explicitly authorized effectively unconstrained Brev/NVIDIA compute through the CLI for model work, so row caps, tiny batches, smaller batches, smaller datasets, or shortened final runs are allowed only as smoke/proof stages, not as substitutes for gate evidence.
- Local machine is the storage/cache/control plane: repo, data shards, artifact collection, audit runs.
- Stop Brev workers aggressively after artifact collection.

### affected models/interfaces

- `BrevShardManifest`
- `BrevRunManifest`
- `LocalEnvironmentReceipt` — [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json)

### invariant

Final training and evaluation **must record MPS or Brev GPU execution, not CPU fallback** (`strategy-confidence-audit.md` hard gate "Local GPU/open-source environment drift"). If the local Mac would force an artificial row cap, batch reduction, shortened schedule, smaller dataset, or any model-quality concession for a model-candidate run, use Brev instead.

### validation

`scripts/brev_create_48h.sh`, `scripts/brev_sync_repo.sh`, `scripts/brev_stop_all_training.sh` to be authored under `task-006`. Local environment receipt regenerated and audited every final non-smoke run.

---

## scratch detector lane: HandBoxNet {#arch-handboxnet}

### rule

HandBoxNet is a **scratch-trained** detector/cropper. It outputs boxes and quality signals, **not detailed pretrained landmarks**. It replaces the role MediaPipe played in the deprecated Stage A path.

### affected models/interfaces

- `HandBoxNet`
- `HandBoxPrediction`
- `CropQuality`
- `DetectorCropConfig`

### invariant

The return-to-form proof does not block on HandBoxNet. Fixed controlled crops
are primary until a 5-10 sign proof learns or until crop quality is proven to be
the blocker. Detector crops become primary only after fixed-vs-detector
ablation evidence. **No pretrained backbone or weights may be used.**

### validation

Detector report includes recall, false no-hand rate, false hand-trigger rate, latency estimate, and provenance audit.

---

## crop and frame pipeline {#arch-crop-pipeline}

### rule

Frame extraction and crops are reproducible and manifest-backed. Fixed crops
are the baseline path for the first 5-10 sign proof; detector crops are promoted
only after ablation evidence.

### affected models/interfaces

- `FrameWindow`
- `CropConfigFixed`
- `CropConfigDetector`
- `CropShardManifest`
- Current decode entrypoint: [`scripts/decode_raw_videos.py`](scripts/decode_raw_videos.py)
- Current manifest export: [`scripts/export_dataset_manifests.mjs`](scripts/export_dataset_manifests.mjs)

### invariant

Every training/evaluation shard has source clip ids, split, sign labels, signer/session/source grouping, and crop config hash. Per `strategy-confidence-audit.md` hard gates "Hash-pinned raw media", "Raw-frame decode replay gap", "FFmpeg replay binary drift": final preflight replays FFmpeg from source video and compares decoded RGB bytes, canonical tensor payload, and current tensor-file hashes.

### validation

Dataloader smoke verifies decode, crop shape, labels, and split integrity. Per `strategy-confidence-audit.md` "Missing retained final-manifest receipt": final raw-frame preflight requires [`docs/validation/final-manifest-audit.json`](docs/validation/final-manifest-audit.json).

---

## GuidedCropSignNet {#arch-guidedcrop-signnet}

### rule

GuidedCropSignNet is the promoted candidate recognizer architecture. It uses
scratch TinyCNN crop encoders plus temporal modeling over 16–24 frames. The
current rawframe pipeline is an implementation entrypoint for small fixed-crop
proofs, but broad 75/95-label training is gated by the return-to-form downscope
ladder.

### affected models/interfaces

- `GuidedCropSignNet`
- `SignClassifierHead`
- `RejectHead`
- `ModelManifest` — [`web/public/model/model-card.json`](web/public/model/model-card.json)

### invariant

All weights are randomly initialized and trained for this project. No pretrained backbones or feature extractors. Per `strategy-confidence-audit.md` hard gate "Trained-model claim integrity": a trained model card must carry artifact hashes, random-initialization provenance, signer-disjoint validation, and calibrated thresholds.

### validation

Model report includes active labels, split method, macro recall, per-class metrics, confusion matrix, hard-negative FAR, thresholds, artifact size, and browser export status. Promotion via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs) (existing); hand-edits forbidden per hard gate "Hand-edited trained model card".

---

## post-processing, abstention, and active modules {#arch-postprocess}

### rule

Post-processing converts logits into an honest product decision using active module, thresholds, margin, entropy, capture quality, and hard-negative gates.

### affected models/interfaces

- `ActiveSignModule`
- `ThresholdConfig`
- `AbstentionCalibration`
- `PassFailDecision`

### invariant

Unsupported, uncertain, low-quality, or hard-negative attempts are fail/abstain with retry guidance, not pass.

### validation

`abstention-calibration.json`, `hard-negative-report.json`, and `active-vocabulary-claim.json` exist before final demo. Existing analyzers: [`scripts/analyze_controlled_pilot_reject_score_grid.mjs`](scripts/analyze_controlled_pilot_reject_score_grid.mjs), [`scripts/analyze_controlled_pilot_thresholds.mjs`](scripts/analyze_controlled_pilot_thresholds.mjs), [`scripts/audit_guardrail_negative_fixtures.mjs`](scripts/audit_guardrail_negative_fixtures.mjs). Per `strategy-confidence-audit.md` hard gate "Negative challenge rejection": require false-pass rate < 0.05 on hash-pinned negative challenge manifest at calibrated threshold.

---

## browser model export {#arch-browser-export}

### rule

The final promoted artifact exports to a browser-loadable model plus manifest.

### affected models/interfaces

- [`web/public/model/asl-pilot-rawframe-v0.onnx`](web/public/model/) (existing; current model card status `not_trained`)
- [`web/public/model/asl-pilot-rawframe-v0.onnx.data`](web/public/model/) (external initializers)
- [`web/public/model/model-card.json`](web/public/model/model-card.json) (existing; serves the role plan called `model-manifest.json`)
- [`web/public/model/asl-pilot-rawframe-v0-export-provenance.json`](web/public/model/) (existing)
- `BrowserRuntimeReport`

### invariant

The app loads model metadata from `model-card.json`, not hard-coded class lists. Per `strategy-confidence-audit.md` hard gates "Browser ONNX proof gap" and "Browser ONNX semantic parity gap": SHA-256 hash check between client and card, plus PyTorch ↔ ONNX logit parity fixture, both required for final evidence.

### validation

Existing chain: [`scripts/run_browser_onnx_wiring_smoke.mjs`](scripts/run_browser_onnx_wiring_smoke.mjs), [`scripts/audit_browser_onnx_wiring_smoke.mjs`](scripts/audit_browser_onnx_wiring_smoke.mjs), [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs), [`scripts/export_onnx_model.py`](scripts/export_onnx_model.py).

---

## app persistence and database schema {#arch-persistence}

### rule

Persistence stores account/profile/progress/session/attempt metadata and model/version ids. It does not store raw video by default.

### affected models/interfaces

Current schema (in [`supabase/migrations/`](supabase/migrations/)):

- `profiles` — uuid PK, FK auth.users; email, display_name, created_at, updated_at
- `attempts` — id, user_id, vocabulary_id, passed, confidence, predicted_id, predicted_label, model_id, model_status, hint, reason, duration_ms, frame_count, created_at
- `attempt_progress` — view aggregating per (user_id, vocabulary_id): attempts, passes, fails, last_attempt_at, derived mastery status

Plan's expected additions:

- `vocabulary_items` — currently TS module; migration tracked in `task-015a` (new)
- `practice_sessions` — currently implicit; migration tracked in `task-015b` (new, optional)
- `mastery_states` — currently view-derived; promote to table only if reviewer needs hand-edit, otherwise keep as view

### invariant

Attempt persistence contains prompt gloss, model version, decision, confidence summary, hint id, timestamps, and capture quality flags only. No raw video. RLS policy enforces per-user isolation (`20260521204656_attempt_progress_security_invoker.sql`).

### validation

Existing: [`scripts/audit_attempt_integrity.mjs`](scripts/audit_attempt_integrity.mjs), [`scripts/audit_progress_contract.mjs`](scripts/audit_progress_contract.mjs), [`scripts/run_practice_progress_smoke.mjs`](scripts/run_practice_progress_smoke.mjs). Database migration review per [`docs/database-schema.md`](docs/database-schema.md).

---

## downscope ladder {#arch-downscope-ladder}

### rule

If time/metrics fail, downscope honestly in this order:

1. Full 75–100 recognition → active 20-sign recognition + 100 content prompts.
2. Active 20-sign → active 10-sign recognition + 100 content prompts.
3. Detector crops → fixed crops.
4. Phonology reranker → thresholds and hard negatives only.
5. Avatar/canonical playback → static sign tips and camera overlays.
6. Full deployment polish → local/demo deployment with full docs.

**Note:** the plan's 48-hour H0–H48 window is not the team's actual cadence. The repo's existing `docs/execution-plan.md` and the iterative teacher-frontier promotion commits are the actual cadence. Treat the downscope ladder as time-pressure guidance, not as a literal 48-hour budget.

### invariant

Every downscope writes a decision artifact and updates `MVP_TASKS.md`, active module claim, and model card. Per `strategy-confidence-audit.md` hard gate "Trained-model claim integrity": no `trained` model card without artifact hashes, random-init provenance, signer-disjoint validation, calibrated thresholds.

### validation

Final claim matrix matches implemented behavior. Existing: [`docs/validation/final-claim-matrix.json`](docs/validation/final-claim-matrix.json), [`scripts/audit_final_claim_matrix.mjs`](scripts/audit_final_claim_matrix.mjs).

---

## cross-doc invariants {#arch-cross-doc-invariants}

| invariant id | model/interface | defining section | downstream docs | existing validation |
|---|---|---|---|---|
| inv-001 | `VocabularyItem` | `#arch-active-module`, `#arch-vocab-hints` | `MVP_TASKS.md`, `docs/vocabulary-plan.md`, `web/src/lib/vocabulary.ts`, `docs/review/final-vocabulary-review.json` | [`scripts/audit_vocabulary_review.mjs`](scripts/audit_vocabulary_review.mjs), [`scripts/audit_vocabulary_review_bundle.mjs`](scripts/audit_vocabulary_review_bundle.mjs), [`scripts/audit_downstream_vocabulary_provenance.mjs`](scripts/audit_downstream_vocabulary_provenance.mjs) |
| inv-002 | `PracticeAttempt` | `#arch-camera-privacy`, `#arch-accounts-progress`, `#arch-persistence` | `docs/database-schema.md`, `docs/privacy-video-handling.md`, `supabase/migrations/` | [`scripts/audit_attempt_integrity.mjs`](scripts/audit_attempt_integrity.mjs), [`scripts/audit_no_raw_video_upload.mjs`](scripts/audit_no_raw_video_upload.mjs) |
| inv-003 | `InferenceEngine` | `#arch-inference-contract` | `docs/browser-runtime-contract.md`, `web/CLAUDE.md`, `web/src/lib/client-model.ts` | [`scripts/run_browser_onnx_wiring_smoke.mjs`](scripts/run_browser_onnx_wiring_smoke.mjs), [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs) |
| inv-004 | `PassFailDecision` | `#arch-passfail-thresholds`, `#arch-postprocess` | `docs/validation-report-template.md`, `docs/hint-authoring-guide.md` | [`scripts/analyze_controlled_pilot_reject_score_grid.mjs`](scripts/analyze_controlled_pilot_reject_score_grid.mjs), [`scripts/audit_guardrail_negative_fixtures.mjs`](scripts/audit_guardrail_negative_fixtures.mjs) |
| inv-005 | `DatasetClip` | `#arch-data-provenance`, `#arch-storage-policy`, `#arch-first-party-data` | `docs/source-access-and-storage.md`, `data/CLAUDE.md`, `docs/model/dataset-source-register.json` | [`scripts/audit_source_register.mjs`](scripts/audit_source_register.mjs), [`scripts/audit_dataset_source_research.mjs`](scripts/audit_dataset_source_research.mjs), [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs) |
| inv-006 | `TrainingRunManifest` | `#arch-training-pipeline`, `#arch-no-pretrained`, `#arch-gpu-execution` | `models/CLAUDE.md`, `docs/no-pretrained-audit.md` | [`scripts/audit_no_pretrained_deps.mjs`](scripts/audit_no_pretrained_deps.mjs), [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs), [`scripts/audit_local_ml_environment.py`](scripts/audit_local_ml_environment.py) |
| inv-007 | `HandBoxNet` | `#arch-handboxnet` | `MVP_TASKS.md#task-009`, `models/CLAUDE.md` | detector report (new) |
| inv-008 | `GuidedCropSignNet` | `#arch-guidedcrop-signnet` | `MVP_TASKS.md#task-011`, `models/CLAUDE.md` | [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs), [`scripts/audit_model_artifacts.mjs`](scripts/audit_model_artifacts.mjs) |
| inv-009 | `ModelManifest` | `#arch-active-module`, `#arch-browser-export` | `docs/browser-runtime-contract.md`, `configs/model-manifest.example.json`, `web/public/model/model-card.json` | [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs), [`scripts/audit_final_browser_onnx_smoke.mjs`](scripts/audit_final_browser_onnx_smoke.mjs) |
| inv-010 | `StorageBudgetReport` | `#arch-storage-policy` | `scripts/storage_budget_check.sh` (new), `docs/48h-execution-playbook.md`, `configs/storage-budget.json` | local guardrail check (new) |
| inv-011 | `ConsentReceipt` / `SignerIdentity` | `#arch-first-party-data` | `docs/privacy/dataset-consent-form.md`, `data/signer-identity/` | [`scripts/audit_final_manifests.py`](scripts/audit_final_manifests.py), [`scripts/audit_dataset_collection_runtime_smoke.mjs`](scripts/audit_dataset_collection_runtime_smoke.mjs) |
| inv-012 | `NoPretrainedAudit` | `#arch-no-pretrained` | `docs/no-pretrained-audit.md`, `docs/validation/no-pretrained-lane-audit.json` (new) | [`scripts/audit_no_pretrained_deps.mjs`](scripts/audit_no_pretrained_deps.mjs) + [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs), tightened post-Stage-A removal |

## forbidden shortcuts {#arch-forbidden-shortcuts}

- Do not re-add MediaPipe / OpenPose / YOLO / pretrained CV backbones as a dependency, runtime asset, or feature extractor.
- Do not use pretrained CV backbones and claim scratch training.
- Do not upload raw learner video in normal practice.
- Do not mark an uncertain sign correct.
- Do not claim all 75–100 signs are recognized unless validation proves it (signer-disjoint, calibrated, hard-negative-bounded).
- Do not let detector training block the product shell or fixed-crop recognizer.
- Do not start large GPU jobs before smoke gates pass.
- Do not run heavy training on the local Mac Studio; route to Brev.
- Do not shrink final model-candidate training/evaluation scope merely to fit local runtime; use Brev.
- Do not merge architecture drift without updating this file.
- Do not create a parallel audit system; extend the existing `scripts/audit_*.mjs` chain.
- Do not hand-edit `web/public/model/model-card.json`; use [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs).
