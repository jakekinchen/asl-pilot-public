# Return-To-Form M3FB PopSign Source-Register Manifest Repair Goal Loop Prompt

Mission 3FB prompt for the Codex executor after M3FA validated the no-model
practice browser flow and selected `continue_popsign_source_register_manifest_repair`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair the PopSign diagnostic label-ladder manifest/source-register binding
without training. The current PopSign label-ladder manifests were generated
against an older `docs/model/dataset-source-register.json` hash and fail the
local manifest validator with a stale `source_register.sha256` mismatch.

Do one smallest useful local/no-Brev/no-training manifest repair slice. The
target is to make the existing diagnostic PopSign label-ladder manifests bind
to the current source register and record the result in a tracked receipt.

## Current Evidence

- M3FA executor commit `1db4938` proved the fail-closed no-model browser flow
  and selected `continue_popsign_source_register_manifest_repair`.
- Current source register audit passes:
  `node scripts/audit_source_register.mjs`.
- Current `docs/model/dataset-source-register.json` SHA-256 is
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`.
- Existing PopSign label-ladder 095 train manifest records stale
  `source_register.sha256` value
  `692bda5f3f891462ab066539c4bcb8a0cc55a6358ed03972299b8742c6515b1f`.
- The relevant exporter is
  `scripts/export_popsign_label_ladder_manifests.mjs`; default outputs are:
  - `data/manifests/diagnostics/popsign-label-ladder/{005,010,025,050,095}-labels/{train,validation,test}.json`
  - `docs/validation/popsign-label-ladder-manifests.json`

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
python3 -m json.tool docs/validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
node scripts/export_popsign_label_ladder_manifests.mjs
git diff --check
```

If the dry-run confirms the intended diagnostic label-ladder outputs, run the
existing exporter with `--write` to refresh the manifests and summary. Then
validate every changed JSON file with `python3 -m json.tool` and use a
structured one-off check to prove each refreshed label-ladder manifest's
`source_register.sha256` matches the current `docs/model/dataset-source-register.json`
hash.

## Allowed Work

- Regenerate or update only the PopSign diagnostic label-ladder manifests and
  summary named above so their source-register metadata matches the current
  source register.
- Add a focused receipt recording before/after hashes, files changed, and the
  exact validator evidence.
- Record the stale-hash blocker and repair result in the session log.

## Hard Boundaries

- No Brev start/exec/sync/copy, remote work, training, evaluation rerun,
  threshold tuning, export, promotion, browser recognition activation, model
  card promotion, active-vocabulary promotion, or product/model readiness
  claim.
- No new source import, media import, tensor mutation, vocabulary mutation,
  packet mutation, PopSign training, Detector 0 training, architecture search,
  package install, dependency mutation, generated labels, pseudo-labels, or
  pretrained detector/landmark/backbone/embedding/teacher path.
- Do not edit `docs/model/dataset-source-register.json` unless the only
  outcome is a recorded blocker explaining why source-register content itself
  is stale. The expected repair is to refresh manifests against the current
  source register, not to weaken source policy.
- No raw learner video/frame upload during normal practice.
- No duplicate worker, worker delete/reset, push, amend, or no-verify.

## Receipt

Write:

`docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`

The receipt must record:

- current source-register hash and stale manifest hash evidence;
- files changed and why;
- validation commands/results;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_local_dry_run_no_training`
- `continue_detector0_worktree_integration_review`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/560-mission-3fb-popsign-source-register-manifest-repair.md`

## Acceptance Criteria

This mission can close when:

1. Required local checks pass or exact blockers are recorded.
2. PopSign diagnostic label-ladder manifest/source-register hash status is
   repaired or precisely blocked.
3. `web/public/model/model-card.json` remains `status: "not_trained"`.
4. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
5. The tracked receipt and numbered session log exist and select exactly one
   next action.
