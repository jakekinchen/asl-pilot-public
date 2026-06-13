# Return-To-Form M3FC PopSign Label-Ladder Local Dry-Run No Training Goal Loop Prompt

Mission 3FC prompt for the Codex executor after M3FB repaired the PopSign
diagnostic label-ladder source-register hash binding and selected
`continue_popsign_label_ladder_local_dry_run_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one smallest useful local/no-Brev/no-training dry-run or check-files
validation against the refreshed PopSign diagnostic label-ladder manifests.

The target is to prove that the M3FB source-register repair removed the stale
manifest-hash blocker from the next PopSign path, or to record the next precise
local command/contract blocker. This mission is dry-run evidence only; it is
not a training, evaluation, promotion, or readiness slice.

## Current Evidence

- M3FB executor commit `eadfe34` refreshed the PopSign diagnostic label-ladder
  source-register binding and selected
  `continue_popsign_label_ladder_local_dry_run_no_training`.
- Current source-register hash:
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.
- M3FB receipt:
  `docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`.
- PopSign diagnostic label-ladder summary:
  `docs/validation/popsign-label-ladder-manifests.json`.
- Local diagnostic manifests:
  `data/manifests/diagnostics/popsign-label-ladder/{005,010,025,050,095}-labels/{train,validation,test}.json`.
- Observer verification after M3FB found all 15 local diagnostic manifests bind
  to the current source-register hash and zero still match the stale hash.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` has `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.

## Required Checks

Run or record blockers for:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json >/dev/null
python3 -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git diff --check
```

Also run a structured local check proving the refreshed label-ladder manifest
`source_register.sha256` values still match the current
`docs/model/dataset-source-register.json` hash before attempting the dry-run.

## Dry-Run Target

Inspect the current local training/dry-run invocation contract before running
the command. Prefer an existing repo-native dry-run/check-files command over
new source changes.

Default target:

- Prefer the 095-label PopSign diagnostic label-ladder manifests because that
  was the explicit stale-hash blocker observed before M3FB, but treat this as
  no-training manifest/harness evidence only, not authorization for a broad
  PopSign training run.
- If inspection before the command proves the existing local dry-run policy
  does not support 095 labels, run the single smallest policy-valid PopSign
  ladder dry-run instead and record why.
- If the only runnable path uses `--allow-small-label-set`, record that as a
  diagnostic-only harness finding. That flag must not be used as product-grade
  evidence and must steer to no-training contract repair before any real
  training or Brev spend.
- If the chosen local dry-run rejects the refreshed manifests for a non-hash
  reason before any training starts, record that exact blocker and stop.

The command must be no-training only. It must include an existing dry-run or
check-files flag, must not write checkpoints or model artifacts, and must not
rerun evaluation.

## Allowed Work

- Inspect existing scripts/help text to identify the correct local no-training
  dry-run/check-files command.
- Run exactly one smallest useful local no-training dry-run/check-files attempt
  against refreshed PopSign diagnostic label-ladder manifests, plus the
  preflight/source/hash/JSON/audit checks above.
- Add one focused receipt recording command shape, target ladder size(s),
  pass/blocker status, source-register hash evidence, claim-surface status,
  forbidden actions not run, and exactly one next action.
- Add the numbered executor session log.

## Hard Boundaries

- No Brev start/exec/sync/copy/search/spend, remote work, non-dry-run training,
  local fitting, evaluation rerun, threshold tuning, export, promotion, browser
  recognition activation, model-card promotion, active-vocabulary promotion,
  source-register edit, new source/media import, manifest writes, tensor
  mutation, vocabulary mutation, packet mutation, package/dependency mutation,
  generated labels, pseudo-labels, pretrained detector/landmark/backbone/
  embedding/teacher path, raw learner upload, worker action, push, amend, or
  no-verify.
- Do not edit `data/manifests/diagnostics/popsign-label-ladder/**` or
  `docs/validation/popsign-label-ladder-manifests.json` in M3FC. M3FB already
  performed the manifest repair; this slice validates the next no-training
  command surface.
- Do not claim the PopSign ladder is trainable, promotable, product-ready, or
  ASL-correct from a dry-run.

## Receipt

Write:

`docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json`

The receipt must record:

- current source-register hash and label-ladder source-register check;
- exact command(s), target ladder size(s), and dry-run/check-files result;
- whether the prior stale-hash blocker is cleared from the local dry-run path
  or the exact next blocker if it is not;
- fail-closed claim-surface status before/after;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_compute_receipt_no_training`
- `continue_popsign_label_ladder_contract_repair_no_training`
- `continue_popsign_label_ladder_training_mode_contract_repair_no_training`
- `continue_detector0_worktree_integration_review`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_dataset_scope_review`

Prefer a no-training contract-repair next action if the dry-run depends on
`--allow-small-label-set`, a synthetic-only guard, or any other diagnostic
escape hatch that would be inappropriate for real PopSign label-ladder model
evidence.

## Session Log

Write:

`docs/session-logs/562-mission-3fc-popsign-label-ladder-local-dry-run-no-training.md`

## Acceptance Criteria

This mission can close when:

1. Required local checks pass or exact blockers are recorded.
2. The refreshed PopSign label-ladder manifests are checked against the current
   source register.
3. Exactly one local no-training dry-run/check-files result is recorded, either
   passing or blocked with the next precise command/contract issue.
4. Any `--allow-small-label-set` use is explicitly labeled diagnostic-only and
   not real training authorization.
5. `web/public/model/model-card.json` remains `status: "not_trained"`.
6. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. The tracked receipt and numbered session log exist and select exactly one
   next action.
