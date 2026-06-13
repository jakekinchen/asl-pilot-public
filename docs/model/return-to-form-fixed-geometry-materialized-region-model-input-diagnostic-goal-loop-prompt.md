# Return-To-Form Fixed-Geometry Materialized-Region Model-Input Diagnostic Goal Loop Prompt

Mission 3EF prompt for the Codex executor after M3EE verified consistent
materialized upper-body/head/full-frame inputs and selected one bounded local
model-input diagnostic.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded local/no-Brev random-init model-input diagnostic comparing
the existing materialized `upper_body_signing_space`/`head_context` inputs
against `full_frame_reference` baseline inputs. The goal is to decide whether
the materialized regions have a useful train-sanity or model-input signal
relative to full-frame references, while preserving all fail-closed product
claims and the reduced exact-M3EB-ROI claim.

This is not a broad recognizer training mission, Detector 0 runtime objectness
mission, browser activation, export, model-card promotion, source import,
product-runtime mission, architecture search, hyperparameter sweep, or
final-readiness mission.

## Starting Evidence

Current repo truth:

- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- M3ED wrote
  `docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json`
  and selected `fixed_geometry_materialized_region_followup_no_brev`.
- M3ED reduced exact M3EB ROI `[0.2, 0.08, 0.82, 0.98]` to deterministic
  diagnostic/accounting evidence only. It must not be used as an unqualified
  interaction-preserving model input claim.
- M3EE wrote
  `docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json`
  and selected `materialized_region_model_input_diagnostic_no_brev`.
- M3EE hash-verified all 345 approved manifest tensors and found the expected
  region order:
  `viewer_left_hand_context,viewer_right_hand_context,upper_body_signing_space,head_context,full_frame_reference`.
- M3EE recorded nonblank/distinct read-only input statistics for
  `upper_body_signing_space`, `head_context`, and `full_frame_reference`.
- M3EE preserved the claim boundary: materialized regions may support a
  diagnostic input comparison, but they do not prove runtime Detector 0
  objectness, hand tracking, landmarks, browser recognition, ASL correctness,
  product authority, or final readiness.
- Existing strategy/research artifacts after repeated learning failures remain
  advisory context, especially
  `artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-response.md`
  and earlier observer strategy memos. This mission is narrower than those
  strategy packets: it is a single local diagnostic comparison authorized by
  M3EE accounting, not a new architecture/input implementation program.

## Required Slice

Complete exactly one smallest useful model-input diagnostic:

1. Verify state and required evidence:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

2. Inspect M3EE, M3ED, current approved manifests, and the available local
   training/diagnostic helpers before choosing the comparison shape.

3. Run at most one bounded local random-init diagnostic comparison command. The
   comparison may contain multiple arms inside that one command only if they
   share the same labels, splits, seed policy, epoch/step cap, and reporting
   schema. Required arms:

- materialized `upper_body_signing_space` plus optional `head_context`;
- `full_frame_reference` baseline.

4. The diagnostic must record:

- exact command and cap;
- labels/splits/tensor inputs consumed;
- random-init/no-pretrained proof;
- train loss movement and train sanity;
- validation/test top-1 or macro recall if evaluated;
- per-label recall/confusion or prediction distribution;
- materialized-region result versus full-frame baseline;
- whether any apparent signal is enough to justify another bounded local
  follow-up, or whether strategy escalation/stop is required.

5. The diagnostic must not save or commit a checkpoint, model weights, promoted
   model artifact, ONNX export, browser asset, model-card update, active
   vocabulary update, or product-runtime change. If the available training path
   cannot run without producing a model artifact, do not run it; write a
   blocker receipt instead.

6. If a helper is needed, it may write only the M3EF receipt and ignored local
   scratch metrics under `output/` if necessary. Do not mutate packet rows,
   source register, manifests, tracked tensor files, vocabulary, model card, or
   product runtime code.

7. Write a tracked receipt:

`docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json`

8. Write a numbered session log:

`docs/session-logs/507-mission-3ef-fixed-geometry-materialized-region-model-input-diagnostic.md`

9. Commit only scoped helper, receipt, and session-log files. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_materialized_region_input_path_if_diagnostic_passes_no_brev`
- `escalate_model_input_strategy_research`
- `return_to_detector0_after_annotation_budget`
- `stop_reduced_claim`
- `stop_for_human_model_input_strategy_review`
- `stop_for_human_fixed_geometry_scope_review`

## Hard Boundaries

- No Brev worker creation, sync, SSH, remote compute, remote training, stop,
  delete, reset, or spend.
- No source import, source-register mutation, media download, manifest
  mutation, tracked tensor mutation, vocabulary mutation, label expansion, or
  packet-row mutation.
- No hand-landmark source import or landmark detector training.
- No broad recognizer retraining, architecture search, hyperparameter sweep,
  repeated rerun, checkpoint/promoted model artifact, ONNX export, browser
  recognition activation, product runtime change, final readiness claim, ASL
  correctness claim, raw learner video upload, or push.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher model, generated label path, MediaPipe/OpenPose/YOLO/SAM/
  DINO/CLIP dependency, `from_pretrained`, `pretrained=True`, or model-weight
  shortcut in the promoted lane.
- Do not use the exact M3EB ROI as an unqualified interaction-preserving model
  input claim.
- No more than one local diagnostic command that performs training or fitting.
  The command must be diagnostic only, random-init only, and must not save a
  model artifact.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EF.
2. Required audits and local JSON validations pass or exact blockers are
   recorded.
3. The receipt compares materialized upper-body/head inputs against
   full-frame-reference baseline using existing approved manifests and tensors
   only, or records the exact blocker that prevented a no-artifact comparison.
4. The receipt records train-sanity and baseline-comparison evidence, not just
   command success.
5. The receipt preserves M3ED's reduced exact-ROI claim and keeps browser/model
   claim surfaces fail-closed.
6. No Brev/source import/source mutation/manifest mutation/tracked tensor
   mutation/vocabulary mutation/packet-row mutation/promoted model artifact/
   pretrained/generated-label path/export/promotion/browser activation/product
   runtime change/final readiness claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the diagnostic is bounded, local, no-artifact, and produces
  a concrete evidence-backed next action.
- NUDGE if the diagnostic is in scope but omits a key baseline, command cap,
  no-artifact proof, or claim-boundary detail.
- REDIRECT if the executor starts a broad training loop, changes architecture
  or product runtime, saves/promotes model artifacts, mutates data/source state,
  or re-expands exact M3EB ROI claims.
- ESCALATE if the diagnostic fails to show a clear bounded signal or proposes
  another training-style retry.
- STOP if human source, annotation, scope, model-input strategy, or budget
  approval is required before any bounded local progress remains possible.
