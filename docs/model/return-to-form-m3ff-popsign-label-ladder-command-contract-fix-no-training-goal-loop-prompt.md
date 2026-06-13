# Return-To-Form M3FF PopSign Label-Ladder Command Contract Fix No Training Goal Loop Prompt

Mission 3FF prompt for the Codex executor after M3FE recorded a no-spend
compute receipt and blocked fitting on missing command/evaluation contracts.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or precisely block the local PopSign label-ladder training command
contract so a future fitting route has a first-class, no-side-effect
dry-run/check-files validation path separate from
`--popsign-label-ladder-diagnostic`.

This mission is local/no-Brev/no-training. Its purpose is to turn M3FE's
command-compatibility blocker into an explicit source contract, or record the
exact source reason that cannot be done safely in one slice. It must not run
fitting, evaluation, Brev work, export, promotion, or browser activation.

## Current Evidence

- M3FD executor commit `f01feb0` added
  `--popsign-label-ladder-diagnostic`, which validates the refreshed PopSign
  label-ladder manifests in `--dry-run --check-files` mode without
  `--allow-small-label-set`.
- M3FE executor commit `9a1cda8` wrote
  `docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json`.
- M3FE receipt status is
  `blocked_pending_command_and_evaluation_contract`.
- M3FE command blocker: the only first-class PopSign label-ladder flag is
  `--popsign-label-ladder-diagnostic`; `validate_training_invocation` requires
  that mode to include `--dry-run` and to use the dry-run-only output
  directory `output/m3fd-popsign-label-ladder-diagnostic-dry-run`.
- M3FE evaluation blocker: `scripts/evaluate_rawframe_model.py` has
  `--popsign-fresh5-training-smoke` but no PopSign label-ladder evidence mode.
  M3FF should not fix evaluation unless the training command contract cannot
  be judged without inspecting it; the expected next slice after a command
  repair is an evaluation-contract fix.
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
python3 -m json.tool docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

Also run a structured local source-register check over all 15 refreshed PopSign
label-ladder manifests. `brev ls --json` is allowed only as read-only
no-spend state evidence; no Brev lifecycle, sync, exec, copy, or spend action
is allowed.

## Allowed Work

- Inspect `scripts/train_rawframe_model.py` and existing invocation-contract
  patterns.
- Add the smallest first-class PopSign label-ladder training/sanity command
  contract needed for no-side-effect `--dry-run --check-files` validation, or
  record the exact source blocker.
- Keep `--popsign-label-ladder-diagnostic` diagnostic-only. Do not relax its
  `--dry-run` requirement.
- Preserve existing final, lesson, ASL Citizen, region-grid TCN, PopSign
  fresh5, and controlled clip-heldout invocation behavior unless a narrow
  shared helper change is required and validated.
- Run only local no-training validation: dry-run/check-files, `--help`, JSON
  parsing, py-compile, source-register checks, and existing audits.
- Write one focused receipt and the numbered executor session log.

## Hard Boundaries

- No non-dry-run training/fitting, optimizer construction for fitting,
  backward pass, optimizer step, sweep, checkpoint creation, local evaluation
  rerun, threshold tuning, export, promotion, browser recognition activation,
  model-card promotion, active-vocabulary promotion, final-gate weakening,
  final-readiness claim, product readiness claim, or ASL correctness claim.
- No Brev start/exec/sync/copy/search/spend/stop/delete/reset, remote command,
  worker creation, worker lifecycle change, package install, or artifact
  copyback.
- No source-register edit, new source/media import, manifest write/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, push, amend, or
  no-verify.
- Do not claim PopSign trainability, promotability, browser readiness, product
  readiness, final readiness, or ASL correctness from command-contract repair.

## Receipt

Write:

`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`

The receipt must record:

- current commit and active prompt;
- M3FE receipt hash and selected blocker;
- exact files and symbols inspected;
- exact source contract changed, or exact blocker if unchanged;
- exact no-training validation command(s), including whether the future
  PopSign label-ladder training/sanity path validates without
  `--allow-small-label-set` and without using the diagnostic-only flag as the
  fitting authorization path;
- whether the command contract now supports a future non-dry-run fitting route,
  explicitly marked not run;
- whether evaluation compatibility remains blocked for a later mission;
- structured source-register check across all 15 label-ladder manifests;
- fail-closed claim-surface status before/after;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_evaluation_contract_fix_no_training`
- `continue_popsign_label_ladder_compute_receipt_refresh_no_training`
- `continue_popsign_label_ladder_local_validation_no_training`
- `continue_detector0_worktree_integration_review`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_training_budget_approval`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/568-mission-3ff-popsign-label-ladder-command-contract-fix-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FF prompt and names Mission 3FF.
2. Required local audits, JSON validations, py-compile checks,
   source-register checks, and fail-closed claim-surface checks pass or record
   exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`.
4. The PopSign label-ladder training command contract is repaired or precisely
   blocked without relying on `--allow-small-label-set` or the diagnostic-only
   flag as fitting authorization.
5. If repaired, a local no-training dry-run/check-files command proves the
   future training/sanity path without fitting, checkpoint creation, evaluation,
   Brev, export, promotion, or claim-surface mutation.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting, local evaluation rerun, threshold tuning, Brev
   lifecycle/exec/sync/copy/spend, export, promotion, browser recognition
   activation, source/data/manifest/tensor/vocabulary mutation, raw learner
   upload, push, or pretrained/generated-label path occurs.
8. A numbered session log records commands, evidence inspected, changed files,
   validations, blockers if any, and exactly one next action.

## Observer Guidance

- CONTINUE only if the command-contract repair/blocker is bounded,
  no-training/no-spend, preserves fail-closed claims, and selects one allowed
  next action.
- NUDGE if the receipt lacks exact command evidence, source-symbol evidence,
  source-register proof, forbidden-action proof, fail-closed claim proof, or
  exactly one next action.
- REDIRECT if the executor runs fitting/training, evaluation rerun, Brev
  lifecycle/copy/spend, source or tensor mutation, label expansion, export,
  browser activation, model-card promotion, final-gate changes, unsupported
  claim edits, push, amend, or no-verify.
- STOP if the receipt proves no non-wasteful autonomous next step remains
  without human budget, source, data, training, or scope approval.
