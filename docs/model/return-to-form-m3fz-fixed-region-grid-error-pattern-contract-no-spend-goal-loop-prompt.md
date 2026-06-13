# Return-To-Form M3FZ Fixed Region-Grid Error Pattern Contract No Spend Goal Loop Prompt

Mission 3FZ prompt for the Codex executor after M3FY identified a confident
asymmetric `table` to `hello` error pattern in the fixed `rgb_regions_grid_v1`
Tiny2 evidence.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-spend/no-training fixed region-grid error-pattern contract
that defines what evidence would discriminate the currently plausible
explanations for the M3FY pattern before any schema, source, architecture,
training-budget, compute, runtime, or claim-surface decision.

This mission is contract-only. It must not train, fit, rerun M3FW, rerun
Detector 0 smoke/evaluation, run an evaluator, inspect raw videos, generate
tensors or crops, mutate manifests/tensors/vocabulary/source approvals, create
model artifacts, change crop/input code, export, promote, activate browser
recognition, change claim surfaces, run Brev, or push.

If the contract concludes that the next useful move would actually change
architecture, input representation, target schema, source scope, training
budget, compute, runtime behavior, privacy posture, or claim surfaces, record
the needed approval/escalation as the next action instead of performing the
change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the mutable tactical overlay and M3FW/M3FX/M3FY results.
4. M3FY error-analysis evidence:
   - [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
   - [`docs/session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md`](../session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md)
5. M3FX review evidence:
   - [`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](../validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
   - [`docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md`](../session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md)
6. M3FW proof evidence:
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
   - [`docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`](../session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md)
7. M3FV contract and prior Tiny2 comparison:
   - [`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json)
   - [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
8. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-spend/no-training contract slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Build an error-pattern contract table from existing evidence only. Include
   at least these candidate explanations:

   - signer-conditioned `table` weakness;
   - row-order or split artifact;
   - fixed-region crop/coverage blind spot;
   - temporal/motion ambiguity in `table`;
   - model-bias or objective confidence pathology;
   - source/label/protocol quality gap;
   - insufficient metadata in current receipts.

   For each explanation, record:

   - current evidence for and against;
   - the smallest future evidence field or no-mutation check that would
     discriminate it;
   - whether that future check needs raw video inspection, tensor generation,
     crop/input implementation, source/manifest mutation, training, Brev,
     runtime changes, or human approval;
   - whether it is safe as an autonomous next slice;
   - what claim boundary remains in force.

3. Do not perform the future checks in this slice. This mission only defines
   the contract and approval gates. If a future check would require raw video
   inspection, generated crops/tensors, a model run, Brev, source mutation, or
   human privacy/source approval, mark that clearly.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3FW, M3FX, and M3FY receipt paths and summaries;
- evidence inspected;
- error-pattern contract table;
- approval/escalation gates;
- rejected actions and why;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_fixed_region_grid_metadata_gap_receipt_no_spend`
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

`docs/session-logs/610-mission-3fz-fixed-region-grid-error-pattern-contract-no-spend.md`

The session log must record commands, evidence inspected, contract summary,
approval/escalation gates, Brev default-off status, claim surfaces, changed
files, and exactly one next action.

## Boundaries

- Local/no-spend/no-training contract only.
- No M3FW proof rerun, Tiny3 run, Fresh5/25/75/95-label run, broad recognizer
  training/evaluation, architecture sweep, objective sweep, Detector 0 smoke
  rerun, evaluator rerun, threshold tuning, raw-video inspection/upload, tensor
  generation, crop generation, export, model-card promotion, active-vocabulary
  promotion, browser recognition activation, product-runtime recognition
  mutation, runtime Detector 0 authority, final-readiness claim, trainability
  claim, or positive ASL correctness claim.
- No crop/input implementation change, source-register edit, source/media
  import, manifest/tensor/packet/vocabulary mutation, push, amend, destructive
  reset, or no-verify commit.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FZ.
2. Required local checks pass or record exact blockers.
3. The M3FW, M3FX, and M3FY receipts/logs are inspected.
4. A tracked M3FZ receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes a fixed region-grid error-pattern contract table from
   existing evidence only and records approval/escalation gates.
6. Claim surfaces remain fail-closed.
7. No forbidden training, rerun, Brev, raw-video inspection, source, data,
   crop/input implementation, export, promotion, browser activation, runtime
   Detector 0 authority, or unsupported claim work occurs.
8. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, preserves
  fail-closed claims, produces the scoped contract receipt/log or records an
  exact blocker, and selects one allowed next action.
- NUDGE if it misses M3FW/M3FX/M3FY accounting, candidate-explanation
  accounting, approval/escalation gates, forbidden-action proof, changed-file
  accounting, or exactly one next action.
- REDIRECT if it drifts into training, proof reruns, Brev lifecycle/spend,
  raw-video inspection/upload, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action would actually change architecture,
  input representation, target schema, training budget, or compute and no
  current strategy memo covers the exact decision.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
