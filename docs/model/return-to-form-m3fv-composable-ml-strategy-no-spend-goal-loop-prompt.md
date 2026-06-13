# Return-To-Form M3FV Composable ML Strategy No-Spend Goal Loop Prompt

Mission 3FV prompt for the Codex executor after M3FU found no single local
manifest, tensor, source, split, threshold, or command-contract repair that
would justify another blind recognizer training attempt.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Convert the M3FU stop into one composable, falsifiable ML recovery path and one
concrete local artifact that a later executor can implement. The goal is to
decide which subproblem should be tested next before spending GPU and leave the
repo with a usable source/label, crop/target-schema, architecture/objective,
annotation-protocol, or compute-receipt artifact.

This is a local/no-spend/no-training strategy-to-experiment slice, but it must
produce a concrete tracked output rather than another audit-only recap. It must
not run fitting, smoke/evaluation reruns, Brev lifecycle/exec/sync/copy/stop,
remote commands, source/media import, source-approval mutation, broad manifest/
tensor/vocabulary mutation, export, promotion, browser recognition activation,
final-readiness claims, ASL correctness claims, or push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the original fixed-crop/four-CNN/TCN spine, mutable overlay, and M3FM-M3FU
   results.
4. M3FU executor and observer evidence:
   - [`docs/validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json`](../validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json)
   - [`docs/session-logs/599-mission-3fu-dataset-training-root-cause-no-spend.md`](../session-logs/599-mission-3fu-dataset-training-root-cause-no-spend.md)
   - [`docs/session-logs/600-observer-stop-m3fu-human-dataset-compute-strategy-review.md`](../session-logs/600-observer-stop-m3fu-human-dataset-compute-strategy-review.md)
5. Recent ML receipts and research memos:
   - M3FM PopSign label-ladder triage and Observer 584 strategy memo.
   - M3EY ASL Citizen lesson-model result.
   - M3FP Fresh5 region-grid/TCN result.
   - M3FQ/M3FR/M3FS Detector 0 strict-gate receipts.
   - Observer 597 strategy memo.
6. Dataset/source and vocabulary surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/research/semlex-asl-lex-overlap-source-review-v1.json`](../research/semlex-asl-lex-overlap-source-review-v1.json)
   - manifests under [`data/manifests/`](../../data/manifests/)
7. Training, evaluation, tensor, and audit scripts under [`scripts/`](../../scripts/).
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Strategy Constraint

Do not propose another broad end-to-end recognizer run as the next step. The
next ML move must be composable and falsifiable, such as:

- source/label binding inventory for handshape, location, motion, NMM, boxes,
  or region targets;
- a small architecture/objective sanity contract that distinguishes "model can
  fit this subproblem" from "held-out ASL generalization works";
- a crop/Detector 0 target-schema decision that distinguishes independent-hand
  boxes from union/contact-region targets;
- a future compute receipt for one bounded micro-experiment with an explicit
  expected signal and stop condition.

Landmark detectors are not a promoted-lane dependency. They may be considered
only as a future scratch-trained or provenance-tagged auxiliary subproblem.

## Required Slice

Complete one local strategy-to-experiment review that creates or repairs one
concrete artifact:

1. Verify live state and baseline no-spend checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Build a composable-subproblem decision table and choose one artifact lane.
   Cover at least:
   - source/media route: PopSign, ASL Citizen, SemLex/ASL-LEX, first-party;
   - label route: gloss, handshape, location, movement, NMM, boxes, landmarks,
     hard negatives;
   - input route: fixed crops, detector crops, union/contact-region crops,
     full-frame context, motion-energy scalars;
   - model route: tiny CNN/TCN/GRU/MLP sanity, frozen embeddings, auxiliary
     phonology heads, abstention;
   - evaluation route: train sanity, signer-disjoint validation, hard-negative
     false accept, calibration;
   - compute route: local-only versus future Brev micro-experiment, current
     default-off worker state, max spend needed for the next proof.

3. Create or repair exactly one tracked artifact for the selected lane. Valid
   artifact lanes:
   - `source_label_inventory`: a Tiny2/Tiny3 candidate source/label inventory
     with source status, allowed use, labels, counts, signer/split evidence,
     known confusion risks, and why it is better than a blind Fresh5 retry.
   - `crop_target_schema`: a target-schema/crop packet that says whether the
     next proof uses fixed crop, motion crop, union/contact region, Detector 0
     diagnostic crops, or full-frame context, with exact blockers and file
     paths.
   - `architecture_objective_sanity`: a local command contract for the next
     tiny train-sanity proof, including expected signal, failure condition, and
     how it prevents class-collapse false progress.
   - `first_party_annotation_protocol`: a small annotation/review protocol for
     hand/head/upper-body or label-source review if the next unlock requires
     human-provided labels.
   - `future_compute_receipt`: a Brev/local compute receipt proposal only,
     with max spend, timeout, kill condition, copyback/default-off plan, and
     explicit "not authorized to run" status.

4. Select exactly one next action. Prefer a no-spend local contract if it can
   unblock a future training attempt. If compute is selected, prepare only a
   future receipt and explicitly mark it as requiring human approval before
   any Brev lifecycle or training command.

Allowed next actions:

- `continue_subtask_label_inventory_no_spend`
- `continue_crop_target_schema_contract_no_spend`
- `continue_architecture_objective_sanity_contract_no_spend`
- `prepare_bounded_composable_brev_microexperiment_receipt_for_human_approval`
- `continue_first_party_annotation_protocol_no_spend`
- `stop_for_human_ml_strategy_choice`

Do not choose STOP merely because M3FU stopped. STOP is appropriate only if no
next falsifiable subproblem can be stated without violating project constraints.

## Receipt

Write:

`docs/validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- claim-surface status;
- M3FU conclusion and how this slice resolves the human strategy decision;
- composable-subproblem decision table;
- selected artifact lane and artifact paths;
- rejected next actions and why;
- selected next action and why it is the smallest useful next move;
- whether any future compute receipt is recommended, with max spend only as a
  proposal and not authorization;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

## Session Log

Write:

`docs/session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md`

The session log must record commands, evidence inspected, the decision table,
selected next action, Brev default-off status, changed files, and any exact
blockers.

## Boundaries

- Local/no-spend/no-training only.
- No Detector 0 smoke rerun, recognizer smoke, evaluator run, local or remote
  training command, fitting, backward pass, optimizer step, checkpoint
  creation, architecture search, threshold tuning for promotion, export,
  model-card promotion, active-vocabulary promotion, browser recognition
  activation, product-runtime recognition mutation, runtime Detector 0
  authority, final-readiness claim, trainability claim, or positive ASL
  correctness claim.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No source-register edit, source/media import, manifest/tensor/packet/
  vocabulary mutation, raw learner video/frame upload, push, amend,
  destructive reset, or no-verify commit.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FV.
2. Required local checks pass or record exact blockers.
3. A composable-subproblem decision table exists and is grounded in tracked
   receipts/docs/scripts/manifests.
4. One concrete tracked artifact or artifact repair exists for the selected
   lane, unless the session log records an exact blocker that prevented it.
5. The next action is one of the allowed actions and is not a broad blind
   recognizer rerun.
6. Claim surfaces remain fail-closed.
7. No forbidden ML, Brev, source, export, promotion, browser activation,
   runtime Detector 0 authority, or unsupported claim work occurred.
8. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, produces
  a useful composable decision table plus one concrete artifact or artifact
  repair, preserves fail-closed claims, and selects one allowed next action
  that can be implemented as another bounded prompt.
- NUDGE if it misses one subproblem route, rejected-action accounting,
  forbidden-action proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into broad recognizer training, product polish as a
  substitute for ML strategy, Brev lifecycle/spend, source import, data
  mutation, promotion, browser activation, or claim expansion.
- ESCALATE if the local evidence is insufficient to choose among the
  composable next actions and no current API/GPT strategy memo covers the
  exact decision.
- STOP only if the next meaningful step still requires human source, compute,
  privacy, claim, or final-submission approval.
