# Dataset And Training Plan

Status: aligned to Mission 3AC small-proof selection and gates.

The durable steering source for the current model plan is
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md). This file
summarizes the dataset/training consequences of that plan.

## Removed Historical Path

The pre-round-001 version of this document described a two-stage plan:
Stage A (DTW templates over MediaPipe Hand Landmarker keypoint sequences) and
Stage B (rawframe student trained on Stage A saved signals). After
[`task-026`](../../MVP_TASKS.md#task-026), that path is obsolete. No promoted
lane may use MediaPipe, pretrained landmarks, cached keypoints, pretrained
features, or pretrained weights.

## Current Dataset Policy

- First-party consented browser recordings remain the default policy and future
  collection lane.
- External/public sources may be used only when
  [`dataset-source-register.json`](dataset-source-register.json) contains an
  exact `allowed_for_model_training: true` decision for the source id and the
  manifest binds to that source-register snapshot.
- PopSign-v1 original raw game videos are approved for the pilot through
  `popsign-v1-original-videos`.
- Narrow school-assignment raw-video ids exist for ASL Citizen and WLASL; the
  broad `asl-citizen` and `wlasl` ids remain blocked.
- SemLex / ASL-LEX phonology is a candidate original-plan route, not an assumed
  approval. Before use, write source-register evidence and a vocabulary overlap
  artifact under `docs/research/`.

## Current Training Policy

- The broad 75/95-label rawframe route is paused. Recent broad runs did not show
  useful learning, so the next valid proof is smaller.
- The next ML target is a 5-sign Tier 0 fixed-crop learnability proof:
  1. select signs;
  2. verify source and optional phonology coverage;
  3. commit a fixed crop config;
  4. write validation gates before training;
  5. run only a small learnability smoke.
- HandBoxNet / Detector 0 is a robustness lane, not a prerequisite. Build it
  only after the fixed-crop proof exists or a crop-quality failure justifies it.
- Promotion remains gated on signer-disjoint or honestly disclosed split
  evidence, calibrated thresholds, hard-negative false-accept checks, ONNX
  parity/browser smoke, and model-card promotion through
  [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs).

## Validation Entry Points

```sh
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
```

Final-promotion validation remains stricter than the small proof. Do not weaken
final gates to make a small guided module look complete.
