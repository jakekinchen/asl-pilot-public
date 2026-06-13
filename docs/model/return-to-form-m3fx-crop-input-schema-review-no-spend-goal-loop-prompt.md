# Return-To-Form M3FX Crop/Input Schema Review No Spend Goal Loop Prompt

Mission 3FX prompt for the Codex executor after M3FW proved the fixed local
Tiny2 architecture/objective can fit train rows but still failed the held-out
noncollapse gate.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-spend/no-training crop/input schema review packet that
explains what the M3FW Tiny2 result does and does not support, compares the
smallest candidate crop/input directions using existing evidence only, and
selects exactly one bounded next action.

This mission is a review and steering slice, not an implementation slice. It
must not train, fit, rerun M3FW, rerun Detector 0 smoke/evaluation, mutate
manifests/tensors/vocabulary/source approvals, create model artifacts, change
crop/input code, export, promote, activate browser recognition, change claim
surfaces, run Brev, or push.

If the review concludes that the next useful move would actually change
architecture, input representation, target schema, source scope, training
budget, compute, or claim surfaces, record the needed approval/escalation as
the next action instead of performing the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the mutable tactical overlay, M3FV/M3FW results, and observer transition
   rules.
4. M3FW evidence:
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
   - [`docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`](../session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md)
   - [`scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py`](../../scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py)
5. M3FV contract and strategy evidence:
   - [`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json)
   - [`docs/validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json`](../validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json)
   - [`docs/session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md`](../session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md)
6. Prior Tiny2/Tiny3 and crop/input evidence:
   - [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
   - [`docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`](../validation/return-to-form-m3en-detector0-source-region-receipts-v1.json)
   - [`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`](../validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
   - [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
7. Existing strategy memos when relevant:
   - [`artifacts/research/observer-508-m3ef-model-input-strategy/response.md`](../../artifacts/research/observer-508-m3ef-model-input-strategy/response.md)
   - [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
   - [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
8. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-spend/no-training review slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Build a crop/input schema review matrix from existing files only. Include at
   least these candidate directions:

   - keep fixed `rgb_regions_grid_v1` region-grid input and do only error
     analysis next;
   - target-specific `table_two_hand_union_or_contact_region` contract review;
   - full-frame or motion-context contract review;
   - first-party or human-label protocol review;
   - future bounded compute proposal requiring human approval.

   For each candidate, record:

   - local evidence for and against;
   - source/label/input/model/evaluation implications;
   - whether it needs source, manifest, tensor, vocabulary, code, architecture,
     training-budget, Brev, runtime, or claim-surface mutation;
   - whether a current API/GPT strategy memo already covers the exact decision;
   - why it is safe or unsafe as an autonomous next slice.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3FW result summary and receipt path;
- evidence inspected;
- crop/input schema review matrix;
- rejected actions and why;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

4. Select exactly one next action:

- `continue_fixed_region_grid_error_analysis_no_spend`
- `continue_union_contact_region_schema_contract_no_spend`
- `continue_full_frame_or_motion_context_contract_no_spend`
- `continue_first_party_or_human_label_protocol_no_spend`
- `prepare_bounded_composable_brev_microexperiment_receipt_for_human_approval`
- `escalate_crop_input_strategy_research_with_local_evidence`
- `stop_for_human_ml_strategy_choice`

Do not select a training-style, Brev, source-mutation, input-implementation, or
promotion action unless the selected action is only a future proposal or
escalation and explicitly requires human approval before any lifecycle,
training, mutation, export, or activation command.

## Session Log

Write:

`docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md`

The session log must record commands, evidence inspected, M3FW result summary,
review matrix summary, Brev default-off status, claim surfaces, changed files,
and exactly one next action.

## Boundaries

- Local/no-spend/no-training only.
- No M3FW proof rerun, Tiny3 run, Fresh5/25/75/95-label run, broad recognizer
  training/evaluation, architecture sweep, objective sweep, Detector 0 smoke
  rerun, evaluator rerun, threshold tuning, export, model-card promotion,
  active-vocabulary promotion, browser recognition activation, product-runtime
  recognition mutation, runtime Detector 0 authority, final-readiness claim,
  trainability claim, or positive ASL correctness claim.
- No crop/input implementation change, source-register edit, source/media
  import, manifest/tensor/packet/vocabulary mutation, raw learner video/frame
  upload, push, amend, destructive reset, or no-verify commit.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FX.
2. Required local checks pass or record exact blockers.
3. The M3FW receipt/log/runner and M3FV contract are inspected.
4. A tracked M3FX receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes a crop/input schema review matrix from existing
   evidence only and records rejected actions.
6. Claim surfaces remain fail-closed.
7. No forbidden training, rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, runtime Detector 0
   authority, or unsupported claim work occurs.
8. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, preserves
  fail-closed claims, produces the scoped review receipt/log or records an
  exact blocker, and selects one allowed next action.
- NUDGE if it misses M3FW/M3FV accounting, candidate matrix fields,
  forbidden-action proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into training, proof reruns, Brev lifecycle/spend,
  source/data/crop/input mutation, export, promotion, browser activation, or
  claim expansion.
- ESCALATE if the selected next action would actually change architecture,
  input representation, target schema, training budget, or compute and no
  current strategy memo covers the exact decision.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
