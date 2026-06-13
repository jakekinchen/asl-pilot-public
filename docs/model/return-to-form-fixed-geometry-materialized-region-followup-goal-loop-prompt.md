# Return-To-Form Fixed-Geometry Materialized-Region Follow-Up Goal Loop Prompt

Mission 3EE prompt for the Codex executor after M3ED reduced the exact M3EB
ROI claim and selected one bounded local/no-Brev materialized-region follow-up.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev materialized-region follow-up over existing
approved tensors and manifests. The goal is to test what the already
materialized `upper_body_signing_space` and optional `head_context` regions can
honestly support versus full-frame references, while preserving the reduced
claim for the exact M3EB ROI.

This is not a Detector 0 runtime objectness mission, broad recognizer
retraining, browser activation, export, model-card promotion, source import,
product-runtime mission, or final-readiness mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3EB wrote
  `docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json`
  and selected `prepare_fixed_geometric_crop_normalization_smoke_no_brev`.
- M3EC wrote
  `docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json`
  and selected `fixed_geometry_claim_reduction`.
- M3ED wrote
  `docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json`
  and selected `fixed_geometry_materialized_region_followup_no_brev`.
- M3ED reduced exact M3EB ROI `[0.2, 0.08, 0.82, 0.98]` to deterministic
  diagnostic/accounting evidence only. It kept all present target centers
  inside, but left-hand full containment was `0.34375`, table union/contact
  full containment was `0.15`, and exact materialized tensor region count was
  `0`.
- M3ED found existing materialized `upper_body_signing_space`
  `[0.1, 0.1, 0.9, 0.96]` had table union/contact full containment `0.85`
  and right-hand full containment `1.0`. `head_context` is already
  materialized as optional context.
- Fixed geometry and materialized regions are transparent local evidence. They
  are not runtime Detector 0 objectness, hand tracking, landmark detection,
  browser recognition, ASL correctness, product authority, or final readiness.

## Required Slice

Complete exactly one smallest useful materialized-region follow-up:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect M3ED, M3EC, M3EB, the current approved manifests, and current tensor
   payload structure before choosing the follow-up shape.

3. Prefer a local transform/input-accounting comparison that answers:

- whether existing `upper_body_signing_space` and `head_context` tensors are
  present consistently enough across the current approved manifests;
- whether those materialized regions preserve more relevant interaction
  evidence than the reduced exact M3EB ROI claim;
- whether full-frame references remain the honest baseline for any diagnostic
  model-input comparison;
- whether one bounded local diagnostic comparison is justified, or whether the
  claim should remain reduced with no model-input follow-up.

4. If transform/input accounting alone cannot answer the mission, one focused
   local diagnostic model-input comparison is allowed. It must:

- use only current approved tensors/manifests and the current small sign set;
- compare materialized `upper_body_signing_space`/`head_context` inputs against
  full-frame references or another already-approved baseline;
- use random initialization and no pretrained components;
- save no checkpoint, promoted model artifact, ONNX export, model-card update,
  browser asset, or product-runtime change;
- record exact command, cap, metrics, and why accounting alone was insufficient.

5. If a helper is needed, it may write only the M3EE receipt and ignored local
   scratch outputs under `output/` if necessary. Do not mutate packet rows,
   source register, manifests, tracked tensor files, vocabulary, model card, or
   product runtime code.

6. The receipt must separate:

- exact M3EB ROI claim boundaries that remain reduced;
- materialized upper-body/head region behavior;
- any optional diagnostic metric;
- Detector 0 runtime objectness behavior that remains unproven;
- hand-landmark/tracking behavior that remains unavailable;
- product/browser/final-readiness claims that remain fail-closed.

7. Write a tracked receipt:

`docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json`

8. Write a numbered session log:

`docs/session-logs/505-mission-3ee-fixed-geometry-materialized-region-followup.md`

9. Commit only scoped helper, receipt, and session-log files. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_materialized_region_followup_no_brev`
- `materialized_region_model_input_diagnostic_no_brev`
- `return_to_detector0_after_annotation_budget`
- `escalate_crop_strategy_research`
- `stop_reduced_claim`
- `stop_for_human_fixed_geometry_scope_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, reset, or spend.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion, or
  packet-row mutation.
- No hand-landmark source import or landmark detector training.
- No broad recognizer retraining, checkpoint/promoted model artifact, ONNX
  export, model-card promotion, browser recognition activation, product runtime
  change, final readiness claim, ASL correctness claim, raw learner video
  upload, or push.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- Do not use the exact M3EB ROI as an unqualified interaction-preserving model
  input claim.
- No more than one local diagnostic command that performs training or fitting.
  If it is needed, it must be diagnostic only, random-init only, and must not
  save a model artifact.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EE.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt uses existing approved materialized regions, full-frame
   references, manifests, and tensors only.
4. The receipt preserves M3ED's reduced exact-ROI claim and records whether
   materialized upper-body/head inputs justify any further local follow-up.
5. Any optional diagnostic comparison is bounded, local, random-init,
   no-pretrained, no-artifact, and explicitly non-promotional.
6. No Brev/source import/source mutation/manifest mutation/tracked tensor
   mutation/vocabulary mutation/packet-row mutation/promoted model artifact/
   pretrained/generated-label path/export/promotion/browser activation/product
   runtime change/final readiness claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt gives a concrete bounded local no-Brev next action or
  cleanly parks the reduced claim with no product authority.
- NUDGE if the follow-up is in scope but omits a key claim-boundary, baseline,
  or command-cap detail.
- REDIRECT if the executor re-expands exact M3EB ROI into interaction
  preservation, mutates product/runtime state, starts broad recognizer work, or
  treats materialized regions as runtime Detector 0 objectness.
- ESCALATE if the crop/model-input strategy remains ambiguous after this
  follow-up.
- STOP if human source, annotation, scope, or budget approval is required
  before any bounded local progress remains possible.
