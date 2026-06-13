# Return-To-Form Fixed-Geometric Crop-Normalization Smoke Goal Loop Prompt

Mission 3EC prompt for the Codex executor after M3EB defined a transparent
fixed-geometric ROI fallback.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev fixed-geometric crop-normalization smoke.
The goal is to test what the M3EB fixed upper-body/head geometry can honestly
support as a diagnostic crop-normalization fallback, while keeping it separate
from Detector 0 runtime objectness, browser recognition, product readiness, and
ASL-correctness claims.

This is not a Detector 0 training, broad recognizer retraining, browser
activation, export, model-card promotion, source import, or product-runtime
mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3DY and M3DZ showed the table union/contact objectness target is
  label-confounded, and packet-row mutation needs explicit target-scope and
  annotation-budget approval.
- M3EA showed class-invariant targets are all-present, so row-level presence is
  not objectness, and selected fixed geometry over another runtime objectness
  retry.
- M3EB wrote
  `docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json`
  and selected `prepare_fixed_geometric_crop_normalization_smoke_no_brev`.
- M3EB recommended `upper_body_or_signing_space` train-median box
  `[0.2, 0.08, 0.82, 0.98]` as the primary transparent fixed ROI, with
  `head_or_face` `[0.32, 0.06, 0.68, 0.44]` as optional context. It marked
  `left_or_first_hand` diagnostic-only and not a precise fixed hand detector.
- Fixed geometry is deterministic packet-derived geometry. It is not a runtime
  Detector 0 objectness model, not hand tracking, not landmark detection, and
  not product authority.

## Required Slice

Complete exactly one smallest useful fixed-geometric crop-normalization smoke:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect the M3EB receipt, current approved Detector 0 packet, existing Tier
   0 manifests/tensors, and prior crop-normalization or fixed-crop evidence
   before choosing the smoke shape.

3. Prefer a local transform/inclusion/accounting smoke that uses the M3EB fixed
   `upper_body_or_signing_space` and optional `head_or_face` geometry to answer:

- whether fixed ROI crop windows can be applied consistently to existing
  approved tensors/manifests;
- whether transform metadata, frame coverage, fallback counts, and split
  accounting are clean enough for a future model-input comparison;
- whether the fixed geometry would hide hand/interaction evidence for any of
  the current Tier 0 signs;
- whether this fallback reduces the claim honestly or supports one bounded
  no-Brev follow-up.

4. If a focused local classifier comparison is needed to make the smoke
   meaningful, it must be exactly one bounded diagnostic comparison with random
   initialization, no pretrained components, no saved checkpoint/model artifact,
   no ONNX export, no model-card promotion, and no browser/product runtime
   change. Record why transform-only accounting was insufficient.

5. If a helper is needed, it may write only the M3EC receipt and ignored local
   scratch outputs under `output/` if necessary. Do not mutate packet rows,
   source register, manifests, tracked tensor files, vocabulary, model card, or
   product runtime code.

6. The receipt must separate:

- fixed geometric crop behavior;
- any optional local diagnostic metric;
- Detector 0 runtime objectness behavior that remains unproven;
- fixed hand/landmark behavior that remains unavailable;
- product/browser/final-readiness claims that remain fail-closed.

7. Write a tracked receipt:

`docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json`

8. Write a numbered session log:

`docs/session-logs/500-mission-3ec-fixed-geometric-crop-normalization-smoke.md`

9. Commit only scoped helper, receipt, and session-log files. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_fixed_geometric_crop_smoke_no_brev`
- `fixed_geometry_crop_normalization_followup_no_brev`
- `fixed_geometry_claim_reduction`
- `return_to_detector0_after_annotation_budget`
- `escalate_crop_strategy_research`
- `stop_for_human_fixed_geometry_scope_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, or reset.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion, or
  packet-row mutation.
- No hand-landmark source import or landmark detector training.
- No broad recognizer retraining, checkpoint/model artifact, ONNX export,
  model-card promotion, browser recognition activation, product runtime change,
  final readiness claim, ASL correctness claim, raw learner video upload, or
  push.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- No more than one local smoke command that performs training or classifier
  fitting. If it is needed, it must be diagnostic only and must not save a model
  artifact.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EC.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt uses M3EB fixed geometry and existing approved evidence only.
4. The receipt records transform/inclusion/accounting evidence and any optional
   diagnostic metric without creating product authority.
5. The receipt states whether a future no-Brev follow-up is justified, whether
   fixed-geometry claims should be reduced, or whether human scope/source/
   annotation/budget review is required.
6. No Brev/source import/source mutation/manifest mutation/tracked tensor
   mutation/vocabulary mutation/packet-row mutation/checkpoint or promoted model
   artifact/pretrained/generated-label path/export/promotion/browser activation/
   product runtime change/final readiness claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt produces a concrete local no-Brev next action and
  keeps fixed geometry clearly separate from Detector 0 runtime and product
  claims.
- NUDGE if the smoke is in scope but omits a key claim-boundary or transform
  accounting detail that can be corrected tactically.
- REDIRECT if the executor treats fixed geometry as a promoted Detector 0
  model, mutates product/runtime state, or starts broad recognizer work.
- ESCALATE if the fixed-geometric crop strategy versus architecture pivot choice
  remains ambiguous after this receipt.
- STOP if human source, annotation, scope, or budget approval is required before
  any bounded local progress remains possible.
