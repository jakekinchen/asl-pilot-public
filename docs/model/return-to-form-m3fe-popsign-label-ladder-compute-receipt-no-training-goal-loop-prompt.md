# Return-To-Form M3FE PopSign Label-Ladder Compute Receipt No Training Goal Loop Prompt

Mission 3FE prompt for the Codex executor after M3FD added a first-class
PopSign label-ladder diagnostic no-training contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training compute receipt for a
future PopSign label-ladder fitting attempt, or precisely block that receipt.

This mission prepares a reviewable contract only. It must not execute fitting,
evaluation, Brev sync/exec/lifecycle, artifact copyback, export, promotion, or
browser recognition activation. If command compatibility, source evidence,
current Brev state, price, approval, or expected metric gates are not adequate,
record the blocker and select the appropriate no-spend or human-approval next
action.

## Current Evidence

- M3FB executor commit `eadfe34` refreshed all 15 PopSign diagnostic
  label-ladder manifests to the current source-register hash
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.
- M3FC executor commit `3905e5c` proved the 095-label diagnostic ladder can
  pass local dry-run/check-files, but only with `--allow-small-label-set`.
  That flag is diagnostic-only and not compute or training authorization.
- M3FD executor commit `f01feb0` added
  `--popsign-label-ladder-diagnostic` to `scripts/train_rawframe_model.py`.
  The 095-label PopSign ladder now validates with
  `--dry-run --check-files --popsign-label-ladder-diagnostic` and without
  `--allow-small-label-set`.
- M3FD also proved the new mode rejects `--allow-small-label-set`, creates no
  output directory during dry-run, keeps `pretrained_components: []`, and
  reports `evidence_mode: "popsign_label_ladder_diagnostic"`.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` has `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.
- The retained Brev worker observed by the M3FD observer pass was
  `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, `STOPPED` / `COMPLETED` /
  `NOT READY` / `HEALTHY`, instance type `l40s-48gb.1x`, GPU `L40S`.

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
python3 -m json.tool docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
brev ls --json
git diff --check
```

Also run a structured local source-register check over all refreshed PopSign
label-ladder manifests. If price evidence is needed and Brev auth permits it,
use only the read-only command:

```sh
brev search --stoppable --min-vram 40 --sort price --json
```

## Allowed Work

- Inspect, but do not execute for fitting, the relevant training and evaluation
  invocation surfaces in `scripts/train_rawframe_model.py` and
  `scripts/evaluate_rawframe_model.py`.
- Re-run or cite a fresh no-side-effect local dry-run/check-files command for
  the 095-label PopSign ladder using `--popsign-label-ladder-diagnostic` and
  without `--allow-small-label-set`.
- Determine the exact future local and/or remote command shape that would be
  proposed for fitting, explicitly marked not run.
- Record command-compatibility, evaluation-compatibility, Brev state, price or
  price blocker, budget caps, stop conditions, artifact/copyback/default-off
  plan, duplicate-worker avoidance, current approval status, and expected
  metric signal in a tracked receipt.
- Preserve fail-closed claim surfaces.

## Hard Boundaries

- No non-dry-run training/fitting, optimizer construction for fitting,
  backward pass, optimizer step, sweep, checkpoint creation, local evaluation
  rerun, threshold tuning, export, promotion, browser recognition activation,
  model-card promotion, active-vocabulary promotion, final-gate weakening,
  final-readiness claim, product readiness claim, or ASL correctness claim.
- No Brev start/exec/sync/copy/spend/stop/delete/reset, remote command, worker
  creation, worker lifecycle change, package install, or artifact copyback.
  Only read-only `brev ls --json` and optional read-only price search are
  allowed. If a worker is unexpectedly `RUNNING`, record the cost-control
  blocker and select a stop/human next action rather than doing remote work.
- No source-register edit, new source/media import, manifest write/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, push, amend, or
  no-verify.

## Receipt

Write:

`docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json`

The receipt must record:

- current commit and active prompt;
- M3FD receipt hash and accepted diagnostic dry-run command;
- exact files and symbols inspected;
- exact commands run and exact commands intentionally not run;
- structured source-register check across all 15 label-ladder manifests;
- command-compatibility result for a future PopSign label-ladder fitting route;
- evaluation-compatibility result for the same evidence mode and artifact
  lineage, or an exact no-training blocker if evaluation compatibility is
  missing;
- exact planned local fitting command, explicitly marked not run, if any;
- exact planned Brev command, explicitly marked not run, only if a remote route
  is fully specified; otherwise record that no Brev command is selected;
- route selection: local no-spend sanity, Brev training, blocked pending
  command/evaluation contract, or blocked pending human approval;
- current `brev ls --json` state, worker name/id, status, build/shell/health,
  instance type, GPU, and duplicate-worker avoidance plan;
- current listed price or a precise price blocker;
- max runtime, max spend, kill condition, expected metric signal, artifacts,
  output directory, copyback paths, and default-off verification plan for any
  future fitting route;
- current human approval status and whether this receipt alone is sufficient to
  let a future prompt run the planned route;
- carried metric gates for a future 095-label diagnostic fitting attempt:
  no model-card promotion unless validation/test top-1 and macro-F1 pass
  predeclared gates, zero-recall labels are explicitly counted, prediction
  concentration is inspected, and negative/unsupported examples do not false
  pass at a product threshold;
- fail-closed claim-surface status before/after;
- proof that no forbidden action ran;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_local_validation_no_training`
- `continue_popsign_label_ladder_command_contract_fix_no_training`
- `continue_popsign_label_ladder_evaluation_contract_fix_no_training`
- `prepare_bounded_local_popsign_label_ladder_sanity_after_current_approval`
- `prepare_bounded_brev_popsign_label_ladder_training_after_current_approval_and_default_off_plan`
- `continue_detector0_worktree_integration_review`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_training_budget_approval`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/566-mission-3fe-popsign-label-ladder-compute-receipt-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FE prompt and names Mission 3FE.
2. Required local audits, JSON validations, py-compile checks, source-register
   checks, Brev read-only state checks, and fail-closed claim-surface checks
   pass or record exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records exact planned command(s), local vs Brev route, Brev
   state, instance type/GPU, price or price blocker, max runtime/spend, kill
   condition, expected metric signal, artifacts, output/copyback/default-off
   plan, duplicate-worker avoidance, and current human approval status.
5. The receipt verifies whether future training and evaluation invocation paths
   are compatible with the PopSign label-ladder evidence mode, and selects a
   no-training contract-fix action if either is not compatible.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting, evaluation rerun, threshold tuning, Brev lifecycle/
   exec/sync/copy/spend, source/data/manifest/tensor/vocabulary mutation,
   export, promotion, browser activation, push, or pretrained/generated-label
   path occurs.
8. A numbered session log records commands, evidence inspected, changed files,
   validations, blockers if any, and exactly one next action.

## Observer Guidance

- CONTINUE only if the receipt is bounded, no-training/no-spend, records all
  compute-envelope fields, and selects one bounded next action without running
  fitting or Brev work.
- NUDGE if the receipt lacks exact commands, compatibility proof, Brev state,
  price/cost/caps/kill condition, artifact/copyback/default-off fields,
  duplicate-worker avoidance, approval status, metric gates, fail-closed claim
  proof, or exactly one next action.
- REDIRECT if the executor runs fitting/training, evaluation rerun,
  Brev exec/sync/lifecycle/copy/spend, source or tensor mutation, label
  expansion, export, browser activation, model-card promotion, final-gate
  changes, unsupported claim edits, push, amend, or no-verify.
- STOP if the receipt proves no non-wasteful autonomous next step remains
  without human budget, source, data, training, or scope approval.
