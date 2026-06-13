# Return-To-Form M3FA Product Browser Validation No Recognition Goal Loop Prompt

Mission 3FA prompt for the Codex executor after M3EZ completed one local
fail-closed practice-copy hardening slice.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Validate the current browser learner flow without recognition claims. M3EZ
changed the camera-ready no-model action from a generic submission phrase to
`Save practice`, while preserving the trained-checker path as `Check attempt`.
This slice must prove the learner-facing behavior in the actual browser or
record exact blockers.

Do one smallest useful local/no-Brev browser-validation slice. Prefer existing
repo-native web validation, Playwright/browser tooling, or focused UI tests
that exercise the current fail-closed practice flow. Do not invent a parallel
audit system.

## Current Evidence

- M3EZ executor commit `153ef3f` changed only the practice UI copy plus its
  receipt and session log.
- M3EZ receipt:
  `docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json`.
- `web/public/model/model-card.json` remains `status: "not_trained"`.
- `docs/model/active-vocabulary-claim.json` still has `activeLabels: []`.
- With no trained active checker, the practice UI should offer `Save practice`,
  not recognition submission or correctness language.

## Required Checks

Run or record blockers for:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
npm --prefix web run typecheck
npm --prefix web run lint
git diff --check
```

Also inspect existing web validation scripts before choosing the browser check.
If a local dev server or browser automation is needed, use the repo's existing
tooling and record the URL, command, and result in the receipt/session log.

## Allowed Work

- Validate that the browser practice flow remains fail-closed and presents
  saved practice, not recognition/correctness, when no active trained checker
  exists.
- Add or update focused browser/UI tests only for the touched fail-closed
  behavior.
- Make a narrow fail-closed UI fix only if validation exposes a blocker in the
  current no-model flow.
- Update existing documentation/receipt surfaces to record what was verified.

## Hard Boundaries

- No Brev start/exec/sync/copy, remote work, training, evaluation rerun,
  threshold tuning, export, promotion, browser recognition activation, model
  card promotion, active-vocabulary promotion, or product/model readiness
  claim.
- No source import, media import, source-register/manifest/tensor/vocabulary/
  packet mutation, PopSign training, Detector 0 training, architecture search,
  package install, dependency mutation, generated labels, pseudo-labels, or
  pretrained detector/landmark/backbone/embedding/teacher path.
- No raw learner video/frame upload during normal practice.
- No duplicate worker, worker delete/reset, push, amend, or no-verify.
- Do not commit `artifacts/rawframe-lesson-milestone/model_state.pt`.

## Receipt

Write:

`docs/validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json`

The receipt must record:

- M3EZ behavior under validation;
- fail-closed claim surfaces before and after;
- browser or UI validation commands/results, including blockers if any;
- files changed and why;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_fail_closed_product_polish_no_recognition`
- `continue_product_browser_validation_no_recognition`
- `continue_popsign_source_register_manifest_repair`
- `continue_detector0_worktree_integration_review`
- `stop_for_human_product_scope_review`

If browser/UI validation passes without exposing a product blocker, prefer
`continue_popsign_source_register_manifest_repair` over additional product
polish. The current supervisor objective is to preserve the fail-closed product
surface, then return to the dataset/model unblock path instead of spinning on
cosmetic browser work.

## Session Log

Write:

`docs/session-logs/558-mission-3fa-product-browser-validation-no-recognition.md`

## Acceptance Criteria

This mission can close when:

1. Required local checks pass or exact blockers are recorded.
2. A focused browser/UI validation proves or precisely blocks the fail-closed
   no-model practice flow.
3. `web/public/model/model-card.json` remains `status: "not_trained"`.
4. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []` unless a
   later authorized promotion chain changes it.
5. The tracked receipt and numbered session log exist and select exactly one
   next action.
