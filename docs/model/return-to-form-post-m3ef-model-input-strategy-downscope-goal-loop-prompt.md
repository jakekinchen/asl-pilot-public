# Return-To-Form Post-M3EF Model-Input Strategy Downscope Goal Loop Prompt

Mission 3EG prompt for the Codex executor after M3EF compared materialized
upper-body/head inputs against full-frame references and selected strategy
escalation.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one local/no-Brev/no-training model-input strategy downscope packet
from the M3EF evidence and observer 508 API memo. The goal is to make the next
claim boundary and human-decision surface explicit after repeated local
learnability/model-input slices failed to show a clear train-sanity signal.

This is not a recognizer training mission, Detector 0 training mission,
architecture search, hyperparameter sweep, source import, browser activation,
export, model-card promotion, product-runtime mission, or final-readiness
mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3EF wrote
  `docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json`
  and selected `escalate_model_input_strategy_research`.
- M3EF compared `materialized_upper_body_head` against `full_frame_reference`
  using the same five labels, splits, seed, epoch cap, and reporting schema.
- Neither M3EF arm passed train sanity. The materialized arm was slightly above
  the full-frame baseline on held-out top-1, but predictions remained
  collapsed and the receipt classified the result as
  `materialized_region_input_signal_not_clear_enough`.
- Observer 508 used the local `openai-api-research` flow and saved artifacts
  under `artifacts/research/observer-508-m3ef-model-input-strategy/`. The API
  memo recommended `redirect_to_downscope`: a no-training strategy/downscope
  packet instead of another autonomous training-style retry.
- M3ED's reduced exact-M3EB-ROI boundary remains binding: exact ROI geometry is
  deterministic diagnostic/accounting evidence only, not an unqualified
  interaction-preserving model input or product-authority claim.

## Required Slice

Complete exactly one smallest useful no-training strategy packet:

1. Verify current state and evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-508-m3ef-model-input-strategy/request.json >/dev/null
python3 -m json.tool artifacts/research/observer-508-m3ef-model-input-strategy/raw.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect M3EF, observer 508, and the retained return-to-form evidence enough
   to separate observed metrics from inference. Do not rerun M3EF fitting.

3. Write a tracked strategy/downscope receipt:

`docs/validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json`

The receipt must record:

- the local evidence reviewed;
- the API memo as advisory only;
- why another autonomous training-style retry is blocked;
- which claims remain allowed and forbidden;
- which human approvals or new evidence would be required to restart training,
  data/source mutation, Brev/GPU work, export, promotion, or browser
  activation;
- exactly one selected next action.

4. Write a numbered session log:

`docs/session-logs/509-mission-3eg-post-m3ef-model-input-strategy-downscope.md`

5. Commit only scoped receipt and session-log files. If a tiny helper is needed
   only to assemble the receipt from existing JSON, it must not train, fit,
   mutate data/source/model/product state, or create a parallel audit system.
   Prefer direct receipt authoring from the inspected evidence.

## Allowed Next Actions

Select exactly one:

- `stop_for_human_model_input_strategy_review`
- `stop_for_human_training_or_resource_approval`
- `return_to_detector0_after_annotation_budget`
- `redirect_to_fail_closed_non_recognition_mvp`
- `continue_no_training_product_claim_cleanup`
- `stop_reduced_claim`

## Hard Boundaries

- No local training-style retry, architecture search, hyperparameter sweep, or
  repeated fitting command.
- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, reset, or spend.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion, or
  packet-row mutation.
- No hand-landmark source import or landmark detector training.
- No checkpoint/promoted model artifact, ONNX export, browser recognition
  activation, model-card mutation, active-vocabulary update, product runtime
  change, final-readiness claim, ASL-correctness claim, raw learner video
  upload, or push.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- Do not use the exact M3EB ROI as an unqualified interaction-preserving model
  input claim.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EG.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt reviews M3EF and observer 508 evidence, treats the API memo as
   advisory, and binds the next action to local files.
4. The receipt explicitly blocks another autonomous training-style retry unless
   a human approval or new evidence changes the premise.
5. The receipt preserves fail-closed model/browser claims and M3ED's reduced
   exact-ROI claim.
6. No Brev/source import/source mutation/manifest mutation/tracked tensor
   mutation/vocabulary mutation/packet-row mutation/training/fitting/promoted
   model artifact/pretrained/generated-label path/export/promotion/browser
   activation/product runtime change/final readiness claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the packet is no-training, evidence-bound, preserves the
  claim boundaries, and selects a conservative next action.
- NUDGE if the packet omits an evidence path, API-advisory caveat, claim
  boundary, or human-approval gate.
- REDIRECT if the executor proposes another autonomous training-style retry,
  architecture search, product/runtime work, or data/source mutation.
- STOP if the selected next action requires human strategy, annotation,
  resource, source, scope, or budget approval.
- ESCALATE only if the no-training downscope decision remains unclear after
  binding observer 508 to local evidence.
