# Return-To-Form M3GA Fixed Region-Grid Metadata Gap Receipt No Spend Goal Loop Prompt

Mission 3GA prompt for the Codex executor after M3FZ created the fixed
`rgb_regions_grid_v1` error-pattern contract and selected a metadata-gap
receipt as the smallest safe continuation.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-spend/no-training fixed region-grid metadata-gap receipt
that inventories which existing metadata fields are enough to discriminate the
M3FY `table` to `hello` pattern and which future evidence fields would require
approval, mutation, raw-video inspection, tensor/crop generation, training,
Brev, runtime work, or claim-surface changes.

This mission is inventory-only. It must not train, fit, rerun M3FW, rerun
Detector 0 smoke/evaluation, run an evaluator, inspect raw videos, generate
tensors or crops, mutate manifests/tensors/vocabulary/source approvals, create
model artifacts, change crop/input code, export, promote, activate browser
recognition, change claim surfaces, run Brev, or push.

If the metadata-gap receipt concludes that the next useful move would actually
change architecture, input representation, target schema, source scope,
training budget, compute, runtime behavior, privacy posture, or claim surfaces,
record the needed approval/escalation as the next action instead of performing
the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the mutable tactical overlay and M3FW/M3FX/M3FY/M3FZ results.
4. M3FZ contract evidence:
   - [`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`](../validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json)
   - [`docs/session-logs/610-mission-3fz-fixed-region-grid-error-pattern-contract-no-spend.md`](../session-logs/610-mission-3fz-fixed-region-grid-error-pattern-contract-no-spend.md)
5. M3FY error-analysis evidence:
   - [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
   - [`docs/session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md`](../session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md)
6. M3FX review evidence:
   - [`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](../validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
   - [`docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md`](../session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md)
7. M3FW proof evidence:
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
   - [`docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`](../session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md)
8. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-spend/no-training metadata-gap receipt slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Inventory existing metadata fields only. The inventory must cover at least:

   - prediction row id or manifest index;
   - true label and predicted label;
   - confidence or probability summary;
   - signer or signer-like identifier;
   - source id and source media path when already recorded;
   - split name;
   - tensor path and tensor hash when already recorded;
   - input representation and shape;
   - crop/region metadata already recorded in receipts or manifests;
   - whether raw visual evidence, temporal fields, per-frame coverage, hand
     contact, protocol notes, or label-quality notes are missing.

3. For each M3FZ candidate explanation, record:

   - available fields;
   - missing fields;
   - whether the missing field can be checked autonomously without mutation;
   - whether the missing field requires raw-video inspection, generated
     crops/tensors, source/manifest mutation, model/evaluator runs, Brev,
     runtime changes, or human approval;
   - what next route is justified or explicitly not justified.

4. Do not perform future checks in this slice. This mission only inventories
   current metadata and gap classes. If a future check would require raw video
   inspection, generated crops/tensors, a model run, Brev, source mutation, or
   human privacy/source approval, mark that clearly.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3ga-fixed-region-grid-metadata-gap-receipt-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3FW, M3FX, M3FY, and M3FZ receipt paths and summaries;
- evidence inspected;
- metadata availability matrix;
- per-explanation metadata gap table;
- approval/escalation gates;
- rejected actions and why;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Select exactly one next action:

- `continue_fixed_region_grid_existing_metadata_join_no_spend`
- `continue_crop_coverage_proxy_contract_no_spend`
- `continue_source_protocol_metadata_review_no_spend`
- `continue_motion_context_metadata_contract_no_spend`
- `escalate_fixed_region_grid_input_strategy_with_local_metadata`
- `prepare_bounded_composable_brev_microexperiment_receipt_for_human_approval`
- `stop_for_human_ml_strategy_choice`

Do not select a training-style, Brev, source-mutation, input-implementation, or
promotion action unless the selected action is only a future proposal or
escalation and explicitly requires human approval before any lifecycle,
training, mutation, export, or activation command.

## Session Log

Write:

`docs/session-logs/612-mission-3ga-fixed-region-grid-metadata-gap-receipt-no-spend.md`

The session log must record commands, evidence inspected, metadata-gap summary,
approval/escalation gates, Brev default-off status, claim surfaces, changed
files, and exactly one next action.

## Boundaries

- Local/no-spend/no-training metadata inventory only.
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

1. `GOAL.md` points at this prompt and names Mission 3GA.
2. Required local checks pass or record exact blockers.
3. The M3FW, M3FX, M3FY, and M3FZ receipts/logs are inspected.
4. A tracked M3GA receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes a metadata availability matrix and per-explanation
   metadata gap table from existing evidence only.
6. Approval/escalation gates are recorded.
7. Claim surfaces remain fail-closed.
8. No forbidden training, rerun, Brev, raw-video inspection, source, data,
   crop/input implementation, export, promotion, browser activation, runtime
   Detector 0 authority, or unsupported claim work occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, preserves
  fail-closed claims, produces the scoped metadata-gap receipt/log or records
  an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3FW/M3FX/M3FY/M3FZ accounting, metadata availability
  accounting, approval/escalation gates, forbidden-action proof,
  changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into training, proof reruns, Brev lifecycle/spend,
  raw-video inspection/upload, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action would actually change architecture,
  input representation, target schema, training budget, or compute and no
  current strategy memo covers the exact decision.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
