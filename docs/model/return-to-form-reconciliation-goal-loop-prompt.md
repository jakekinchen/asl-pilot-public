# Return-To-Form Reconciliation Goal Loop Prompt

Mission 3AB prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Reconcile the repository around the return-to-form plan before any more model
work. The broad 75/95-label rawframe route is paused because it has not shown
useful learning. The next valid project direction is a small, fixed-crop,
source-reviewed learnability proof.

This is a steering/documentation/audit mission only. Do not train, evaluate the
controlled clip-heldout checkpoint, import media, approve sources, export ONNX,
or promote a model card in this slice.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AB.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. [`docs/session-logs/179-mission-3z-wlasl-tensor-remediation-relaunch.md`](../session-logs/179-mission-3z-wlasl-tensor-remediation-relaunch.md).
5. [`docs/session-logs/180-observer-redirect.md`](../session-logs/180-observer-redirect.md).
6. [`README.md`](../../README.md), [`MVP_TASKS.md`](../../MVP_TASKS.md), and
   [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md).

## First Reviewable Slice

Start with read-only state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_return_to_form_plan.mjs --json
```

If any steering doc still frames Mission 3R, broad 95-label rawframe training,
or controlled clip-heldout evaluation as the active next action, fix the doc
before continuing.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AB.
2. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) contains both
   the stable Original Plan Spine and the Mutable Tactical Overlay.
3. `README.md`, `MVP_TASKS.md`, and
   `docs/model/dataset-and-training-plan.md` no longer identify Mission 3R,
   broad 95-label rawframe training, or controlled clip-heldout evaluation as
   the active next action.
4. `node scripts/audit_return_to_form_plan.mjs --json` exits 0.
5. `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_source_register.mjs`,
   `node scripts/audit_no_pretrained_deps.mjs`, and
   `node scripts/audit_no_pretrained_artifact_json.mjs` exit 0.
6. A numbered session log records the branch diagnosis, docs updated, commands
   run, and the next concrete ML slice: 5-10 sign fixed-crop source/coverage
   proof.
7. No training, evaluation of the controlled clip-heldout checkpoint, source
   approval, media import, ONNX export, model-card promotion, final-readiness
   claim, broad-run redirect, Brev stop, or push occurs.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AB return-to-form reconciliation.
Completed:            <docs/audits reconciled>.
Evidence:             <audit commands and hashes/statuses>.
Remaining:            5-10 sign fixed-crop source/coverage proof.
Blockers:             <none, or exact stale-doc/audit blocker>.
Next step:            Select the smallest sign set and write source/crop/gate evidence before training.
Checkpoint commit:    <commit hash>.
```

