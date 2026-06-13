# Return-To-Form Fixed-Geometric Claim Reduction Goal Loop Prompt

Mission 3ED prompt for the Codex executor after M3EC found the exact M3EB ROI
is deterministic and locally applicable, but too narrow for unqualified
interaction-preservation claims.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev/no-training claim-reduction packet. The goal
is to turn M3EC evidence into a reviewer-grade claim boundary: what exact M3EB
fixed geometry can honestly claim, what the existing broader materialized
upper-body/head regions can honestly claim, and what remains blocked before any
model-input comparison, Detector 0 retry, recognizer work, browser activation,
or product claim.

This is not a training, crop-smoke rerun, Detector 0 training, recognizer
retraining, browser activation, export, model-card promotion, source import, or
product-runtime mission.

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
- M3EC hash-verified all 345 manifest-referenced region tensors, verified all
  32 packet rows against manifest tensor paths/hashes/frame bounds, and ran no
  classifier comparison because transform and inclusion accounting answered the
  smoke.
- Exact M3EB primary ROI `[0.2, 0.08, 0.82, 0.98]` kept all present target
  centers inside, but full containment was only `0.34375` for left hand and
  `0.15` for table union/contact.
- The existing materialized `upper_body_signing_space` region
  `[0.1, 0.1, 0.9, 0.96]` had table union/contact full containment rate
  `0.85` and right-hand full containment rate `1.0`.
- Fixed geometry is deterministic packet-derived geometry. It is not a runtime
  Detector 0 objectness model, not hand tracking, not landmark detection, not
  browser recognition, and not product authority.

## Required Slice

Complete exactly one smallest useful claim-reduction packet:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-detector0-objectness-repair-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect M3EB and M3EC receipts and current claim surfaces. Do not rerun the
   crop smoke unless a required field is missing and the rerun is read-only over
   the same evidence.

3. Write a tracked claim-reduction receipt:

`docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json`

The receipt must include:

- exact source evidence paths and hashes;
- allowed claims for exact M3EB ROI;
- allowed claims for broader materialized `upper_body_signing_space` and
  `head_context` regions;
- disallowed claims for runtime Detector 0 objectness, hand/contact
  preservation, hand landmarks, browser recognition, product authority, ASL
  correctness, and final readiness;
- current model-card and active-vocabulary claim state;
- whether one bounded no-Brev follow-up is justified, and what it may test;
- exactly one next action.

4. Update only the smallest relevant durable docs if needed so future executor
   turns cannot treat exact M3EB ROI as preserving all interaction evidence.
   Prefer `GOAL.md`/`docs/model/return-to-form-plan.md`/the new receipt over
   editing historical receipts. Do not hand-edit `web/public/model/model-card.json`
   or `docs/model/active-vocabulary-claim.json`.

5. Write a numbered session log:

`docs/session-logs/503-mission-3ed-fixed-geometric-claim-reduction.md`

6. Commit only scoped claim-boundary docs, receipt, and session-log files. Do
   not push.

## Allowed Next Actions

Select exactly one:

- `fixed_geometry_materialized_region_followup_no_brev`
- `return_to_detector0_after_annotation_budget`
- `escalate_crop_strategy_research`
- `stop_for_human_fixed_geometry_scope_review`
- `stop_reduced_claim`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, or reset.
- No training, fitting, classifier comparison, optimizer construction, backward
  pass, checkpoint, model artifact, ONNX export, model-card promotion, or
  product-runtime change.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion, or
  packet-row mutation.
- No hand-landmark source import or landmark detector training.
- No broad recognizer retraining, browser recognition activation, final
  readiness claim, ASL correctness claim, raw learner video upload, or push.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3ED.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The tracked claim-reduction receipt exists and is valid JSON.
4. The receipt defines allowed and disallowed fixed-geometry claims from M3EB
   and M3EC evidence, including the exact containment rates that forced the
   reduction.
5. Any durable doc edits preserve fail-closed model-card and active-vocabulary
   state.
6. No Brev/source import/source mutation/manifest mutation/tracked tensor
   mutation/vocabulary mutation/packet-row mutation/training/fitting/checkpoint
   or promoted model artifact/pretrained/generated-label path/export/promotion/
   browser activation/product runtime change/final readiness claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE if the receipt reduces the claim and selects a bounded local
  no-Brev follow-up or a clean stop/reduction action.
- NUDGE if the claim boundary is directionally correct but omits a key
  disallowed claim or source hash.
- REDIRECT if the executor re-expands exact M3EB ROI into product authority,
  mutates product/runtime state, or starts model training.
- ESCALATE if the next crop strategy remains ambiguous after claims are reduced.
- STOP if the reduced claim leaves no bounded local next action without human
  source, annotation, scope, or budget approval.
