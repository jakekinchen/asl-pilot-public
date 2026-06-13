# Return-To-Form M3FD PopSign Label-Ladder Training-Mode Contract Repair No Training Goal Loop Prompt

Mission 3FD prompt for the Codex executor after M3FC proved the refreshed
PopSign diagnostic label ladder can pass one local dry-run only by using
`--allow-small-label-set`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or precisely block the local PopSign label-ladder no-training/training-
mode contract so the 095-label diagnostic ladder no longer relies on
`--allow-small-label-set` as the path that makes it load.

This mission is local/no-Brev/no-training. Its purpose is to turn M3FC's
diagnostic harness finding into a first-class contract for future PopSign
label-ladder evidence, or to record the exact source/contract blocker if that
cannot be done safely in one slice.

## Current Evidence

- M3FB executor commit `eadfe34` refreshed the PopSign diagnostic label-ladder
  source-register binding.
- M3FC executor commit `3905e5c` ran exactly one 095-label PopSign
  label-ladder dry-run/check-files command.
- M3FC receipt:
  `docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json`.
- M3FC result: stale source-register hash blocker is cleared, the dry-run exits
  `0`, `training_status` is `dry_run_only`, `pretrained_components` is empty,
  no output directory is created, and claim surfaces remain fail-closed.
- M3FC remaining blocker: the only current no-training path loads the 095-label
  diagnostic ladder with `--allow-small-label-set`, whose help text limits it
  to synthetic wiring tests. That is useful harness evidence but not
  product-grade or compute/training authorization.
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
python3 -m json.tool docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git diff --check
```

Also re-run a structured local source-register check over all refreshed
PopSign label-ladder manifests before validating the repaired contract.

## Allowed Work

- Inspect the existing `scripts/train_rawframe_model.py` argument and manifest
  policy paths, plus any repo-native tests/audits covering training invocation
  contracts.
- Add the smallest first-class PopSign label-ladder diagnostic/training-mode
  contract needed for no-training dry-run/check-files validation without
  `--allow-small-label-set`, or record the exact reason a safe repair is
  blocked.
- Preserve all existing final, lesson, ASL Citizen, region-grid TCN, and
  PopSign fresh5 invocation behavior unless the active blocker proves a narrow
  shared helper must change.
- Run only local no-training validation: dry-run/check-files, unit tests, JSON
  parsing, source-register checks, and existing audits.
- Add one focused receipt recording the contract decision, command evidence,
  files changed, forbidden actions not run, fail-closed claim-surface status,
  and exactly one next action.
- Add the numbered executor session log.

## Hard Boundaries

- No Brev start/exec/sync/copy/search/spend, remote work, non-dry-run training,
  local fitting, evaluation rerun, threshold tuning, export, promotion, browser
  recognition activation, model-card promotion, active-vocabulary promotion,
  source-register edit, new source/media import, manifest writes/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, worker action, push,
  amend, or no-verify.
- Do not treat `--allow-small-label-set` as repaired evidence. The repaired
  validation must either run without that flag or record why a first-class
  label-ladder contract cannot be safely added in this slice.
- Do not claim PopSign trainability, promotability, product readiness, browser
  readiness, final readiness, or ASL correctness from contract repair.

## Receipt

Write:

`docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json`

The receipt must record:

- current source-register hash and label-ladder source-register check;
- M3FC dry-run result and why `--allow-small-label-set` is insufficient;
- exact source contract inspected and changed, or exact blocker if unchanged;
- exact no-training validation command(s), including whether the 095-label
  ladder now validates without `--allow-small-label-set`;
- fail-closed claim-surface status before/after;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_compute_receipt_no_training`
- `continue_popsign_label_ladder_local_validation_no_training`
- `continue_detector0_worktree_integration_review`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_dataset_scope_review`
- `stop_for_human_training_budget_approval`

## Session Log

Write:

`docs/session-logs/564-mission-3fd-popsign-label-ladder-training-mode-contract-repair-no-training.md`

## Acceptance Criteria

This mission can close when:

1. Required local checks pass or exact blockers are recorded.
2. The refreshed PopSign label-ladder manifests are checked against the current
   source register.
3. The PopSign label-ladder no-training/training-mode contract is repaired or
   precisely blocked.
4. If repaired, a local no-training validation command proves the 095-label
   ladder path without `--allow-small-label-set`.
5. `web/public/model/model-card.json` remains `status: "not_trained"`.
6. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. The tracked receipt and numbered session log exist and select exactly one
   next action.
