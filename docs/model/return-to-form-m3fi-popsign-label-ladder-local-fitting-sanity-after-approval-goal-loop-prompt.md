# Return-To-Form M3FI PopSign Label-Ladder Local Fitting Sanity After Approval Goal Loop Prompt

Mission 3FI prompt for the Codex executor after M3FH recorded that the
PopSign label-ladder command/evaluator contracts are compatible but needed
human approval before any non-dry-run fitting route.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded local/no-spend PopSign label-ladder fitting sanity
attempt and, only if that attempt writes the expected checkpoint and
provenance, run the matching local evaluation once. Record the result as
diagnostic evidence only. This is not a Brev mission and not a promotion
mission.

## Current Approval And Envelope

The latest human instruction in the active thread was to get the pair going
again and oversee it. For this mission, that is recorded as approval only for
the local/no-spend bounded envelope below:

- route: local Mac only;
- max spend: `$0`;
- max runtime: 20 minutes for the fitting command;
- output directory: `output/m3ff-popsign-label-ladder-local-sanity`;
- fitting scope: one command, one epoch, at most 16 train batches and 16
  validation batches;
- evaluation scope: one local evaluation command if the expected checkpoint
  exists;
- Brev scope: no Brev lifecycle, exec, sync, copy, stop/delete/reset, remote
  command, or spend is approved by this prompt.

If the output directory already exists before this mission starts, stop and
record the exact blocker instead of deleting or reusing it.

## Current Evidence

- M3FF executor commit `bb99378` added the first-class
  `--popsign-label-ladder-training-smoke` command contract.
- M3FG executor commit `8323825` added the matching evaluator evidence mode.
- M3FH executor commit `c10467b` wrote
  [`docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json),
  proving the command/evaluator contract is compatible for a future bounded
  fitting attempt while preserving fail-closed claim surfaces.
- Observer commit `7173f4e` stopped the autonomous loop until the next bounded
  compute envelope was explicit. This prompt is that local/no-spend envelope;
  it does not approve Brev spend.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` has `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.

## Required Checks

Run or record blockers for:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
test ! -e output/m3ff-popsign-label-ladder-local-sanity
git diff --check
```

Also run a structured local source-register/finality check over all 15 PopSign
label-ladder manifests, matching the M3FH check. `brev ls --json` is allowed
only as read-only default-off evidence; do not run any Brev lifecycle or remote
command.

## Allowed Commands

Run this fitting command at most once:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --popsign-label-ladder-training-smoke --train-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/test.json --output-dir output/m3ff-popsign-label-ladder-local-sanity --check-files --architecture compact_3d_cnn_spatiotemporal --epochs 1 --batch-size 4 --max-train-batches 16 --max-validation-batches 16 --checkpoint-selection best_validation --num-workers 0 --training-augmentation none
```

If the checkpoint and training provenance exist, run this evaluator command at
most once:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3ff-popsign-label-ladder-local-sanity/model_state.pt --training-provenance output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/test.json --output-report output/m3ff-popsign-label-ladder-local-sanity/validation-report.json --calibrated-provenance output/m3ff-popsign-label-ladder-local-sanity/calibrated-provenance.json --batch-size 4 --num-workers 0 --popsign-label-ladder-training-smoke
```

## Result Inspection

After the run, inspect the produced JSON evidence without promoting it:

- whether loss moved in the expected direction;
- validation/test top-1 and macro-F1 if available;
- zero-recall labels and never-predicted labels if available;
- prediction concentration or collapse;
- whether validation/evaluation wrote only under the scoped output directory;
- whether fail-closed claim surfaces stayed unchanged.

If the fitting command fails before writing a checkpoint, do not run the
evaluator. Record the failure, stderr/stdout path or hash, and exact blocker.

## Hard Boundaries

- No Brev start/exec/sync/copy/spend/stop/delete/reset, remote command, worker
  lifecycle change, package install, or artifact copyback.
- No second fitting attempt, hyperparameter sweep, label expansion, broad
  training run, or retry with different architecture/batch/epoch settings.
- No export, ONNX conversion, quantization, promotion, browser recognition
  activation, model-card promotion, active-vocabulary promotion, final-gate
  weakening, final-readiness claim, product-readiness claim, or ASL correctness
  claim.
- No source-register edit, new source/media import, manifest write/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, push, amend, or
  no-verify.
- Keep artifacts under `output/m3ff-popsign-label-ladder-local-sanity`
  untracked unless a later prompt explicitly decides otherwise.

## Receipt

Write:

`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`

The receipt must record:

- current commit and active prompt;
- approval envelope and explicit Brev non-approval;
- M3FH receipt hash and selected stop action;
- exact commands run, exit codes, durations, and output hashes or paths;
- whether fitting created the expected checkpoint and training provenance;
- whether evaluation ran and what reports/provenance it wrote;
- structured result inspection: loss movement, metric availability, zero-recall
  or never-predicted labels if available, prediction concentration/collapse,
  and artifact directory scope;
- `brev ls --json` default-off state if run;
- fail-closed claim-surface status before/after;
- proof that no forbidden action ran;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_result_diagnosis_no_training`
- `continue_detector0_crop_normalization_integration_review_no_training`
- `prepare_bounded_brev_popsign_label_ladder_training_after_current_approval_and_default_off_plan`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_brev_spend_approval`
- `stop_for_human_training_strategy_review`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/574-mission-3fi-popsign-label-ladder-local-fitting-sanity-after-approval.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FI prompt and names Mission 3FI.
2. Required local audits, JSON validations, py-compile checks,
   source-register/finality checks, output-directory preflight, read-only Brev
   default-off check if run, and fail-closed claim-surface checks pass or
   record exact blockers.
3. The fitting command either runs exactly once under the scoped envelope or is
   blocked before execution for a concrete reason.
4. If the expected checkpoint and training provenance exist, the matching
   evaluator command runs exactly once; otherwise the evaluator is skipped with
   the exact reason.
5. A tracked receipt exists at
   `docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`
   or the session log records the exact blocker that prevented it.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No Brev command, export, promotion, browser activation, source/data/
   manifest/tensor/vocabulary mutation, raw learner upload, push, or
   pretrained/generated-label path occurs.
8. A numbered session log records commands, evidence inspected, changed files,
   validations, blockers if any, and exactly one next action.

## Observer Guidance

- CONTINUE only if the local/no-spend fitting sanity stayed within the explicit
  envelope, preserved fail-closed claims, recorded results in the receipt, and
  selected one allowed next action.
- NUDGE if the receipt lacks command evidence, duration/exit/output evidence,
  artifact-scope proof, result inspection, forbidden-action proof,
  fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor runs Brev lifecycle/remote work, more than one
  fitting/evaluation attempt, source or tensor mutation, label expansion,
  export, browser activation, model-card promotion, final-gate changes,
  unsupported claim edits, push, amend, or no-verify.
- ESCALATE if the run fails in a way that suggests the PopSign label-ladder
  path is not learning despite compatible commands and clean data contracts.
- STOP if the next meaningful step requires Brev spend, new data/source scope,
  or a strategy decision that is not currently approved.
