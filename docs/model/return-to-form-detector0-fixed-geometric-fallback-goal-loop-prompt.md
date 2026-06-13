# Return-To-Form Detector 0 Fixed-Geometric Fallback Goal Loop Prompt

Mission 3EB prompt for the Codex executor after M3EA found the current
class-invariant Detector 0 packet targets support fixed geometry more than a
runtime objectness detector.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev/no-training fixed-geometric ROI fallback
packet. The goal is to turn the M3EA finding into an explicit reviewer-grade
fallback policy: what fixed geometry can honestly do now, what it cannot claim,
and whether a future crop-normalization smoke can be run without pretending a
Detector 0 runtime objectness model exists.

This is not a Detector 0 training, recognizer retraining, browser activation,
or product-promotion mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3DY found the table union/contact objectness target is label-confounded.
- M3DZ found a no-source packet mutation is possible from existing approved
  local clips, but packet-row mutation requires explicit target-scope and
  annotation-budget approval.
- M3EA wrote
  `docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json`
  and selected `prepare_detector0_fixed_geometric_fallback_no_brev`.
- M3EA found `left_or_first_hand`, `head_or_face`, and
  `upper_body_or_signing_space` are all-present across the 32 packet rows.
  Row-level presence is therefore not an objectness signal.
- M3EA did not find a held-out selected-cell dynamic-localization win. The
  useful evidence is fixed/median geometry, especially for
  `upper_body_or_signing_space`, not a promotable runtime Detector 0 model.

## Required Slice

Complete exactly one smallest useful fixed-geometric fallback packet:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect the current approved Detector 0 packet and M3EA receipt. Quantify
   fixed geometry for the class-invariant targets that already exist across
   labels, especially:

- `upper_body_or_signing_space`;
- `left_or_first_hand`;
- `head_or_face`.

3. If a helper is needed, it must be read-only over existing packet/receipt
   data and may write only the M3EB receipt. Do not train, fit, export, mutate
   rows, or create model artifacts.

4. The receipt must separate:

- fixed geometry that can be used as a transparent fallback;
- dynamic Detector 0 objectness behavior that remains unproven;
- what a future crop-normalization smoke could test without product claims;
- when human annotation, source approval, or packet mutation would still be
  needed.

5. Write a tracked receipt:

`docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json`

6. Write a numbered session log:

`docs/session-logs/498-mission-3eb-detector0-fixed-geometric-fallback.md`

7. Commit only scoped diagnostic helper, receipt, and session-log files. Do not
   push.

## Allowed Next Actions

Select exactly one:

- `prepare_fixed_geometric_crop_normalization_smoke_no_brev`
- `continue_fixed_geometric_fallback_design_no_brev`
- `return_to_detector0_after_annotation_budget`
- `escalate_detector0_strategy_research`
- `stop_for_human_fixed_geometric_scope_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, or reset.
- No training, fitting, checkpoint, model artifact, ONNX export, or model-card
  promotion.
- No source import, source-register mutation, media download, manifest
  mutation, tensor mutation, vocabulary mutation, label expansion, or packet
  row mutation.
- No hand-landmark source import or landmark detector training.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- No recognizer retraining, browser recognition activation, product runtime
  change, final readiness claim, ASL correctness claim, raw learner video
  upload, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EB.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt defines fixed-geometric fallback candidates from existing packet
   evidence and states why they are not runtime Detector 0 objectness.
4. The receipt states whether a future no-Brev crop-normalization smoke is
   justified as a fallback experiment, or whether human scope review is needed.
5. No Brev/source import/source mutation/manifest mutation/tensor mutation/
   vocabulary mutation/packet-row mutation/training/fitting/model artifact/
   pretrained/generated-label path/export/promotion/browser activation/product
   runtime change/final readiness claim occurs.
6. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt produces a concrete local no-Brev next action and
  keeps fixed geometry clearly separate from Detector 0 runtime claims.
- REDIRECT if the executor treats fixed geometry as a promoted Detector 0
  model, starts crop-normalization training directly, or mutates product/runtime
  state.
- ESCALATE if the fixed-fallback versus strategy-pivot choice remains
  ambiguous.
- STOP if human scope, source, annotation, or budget approval is required
  before any bounded local progress remains possible.
