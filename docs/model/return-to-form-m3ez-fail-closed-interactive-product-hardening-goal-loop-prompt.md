# Return-To-Form M3EZ Fail-Closed Interactive Product Hardening Goal Loop Prompt

Mission 3EZ prompt for the Codex executor after M3EY completed one bounded
lesson-model train/evaluate/copyback slice and the artifact-status cleanup.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Improve the browser learner experience without recognition claims. M3EY proved
the retained Brev worker and ASL Citizen lesson-model command path can run, but
the trained model failed promotion gates. The product must therefore stay
fail-closed while still becoming more useful and honest for practice.

Do one smallest useful local/no-Brev product-hardening slice. Prefer surfaces
that reduce stale or ambiguous model-readiness/pass-fail wording and improve
the learner's no-model experience.

## Current Evidence

- M3EY executor commit `fa55035` ran exactly one bounded retained-worker
  lesson-model train/evaluate/copyback slice.
- M3EY cleanup commit `9f8d656` tracked the copied JSON sidecars and cleared
  `unstaged_copied_artifacts`.
- M3EY metrics are not promotable:
  - validation top-1 `0.19148936170212766`;
  - validation macro-F1 `0.1723174603174603`;
  - test top-1 `0.17`;
  - test macro-F1 `0.15166666666666667`;
  - diagnostic negative false-pass rate `0.4`;
  - 15 zero-recall labels on validation and 15 on test.
- `artifacts/rawframe-lesson-milestone/model_state.pt` is ignored and must not
  be promoted or committed.
- `web/public/model/model-card.json` remains `status: "not_trained"`.
- `docs/model/active-vocabulary-claim.json` still has `activeLabels: []`.

## Required Checks

Run or record blockers for:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git diff --check
```

If web source changes are made, run the repo-native web validation that is
already available and appropriate for the touched files. Do not invent a
parallel audit surface.

## Allowed Work

- Tighten stale or ambiguous public/docs/UI wording around recognition,
  pass/fail, model readiness, active vocabulary, and the M3EY non-promotable
  result.
- Improve the fail-closed learner flow, lesson flow, camera-local-only
  messaging, no-model state, or validation/status surfaces.
- Add or update focused tests only for touched product behavior.
- Update existing documentation and claim surfaces to say what is currently
  true.

## Hard Boundaries

- No Brev start/exec/sync/copy, remote work, training, evaluation rerun,
  threshold tuning, export, promotion, browser recognition activation, model
  card promotion, active-vocabulary promotion, or product/model readiness claim.
- No source import, media import, source-register/manifest/tensor/vocabulary/
  packet mutation, PopSign training, Detector 0 training, architecture search,
  package install, dependency mutation, generated labels, pseudo-labels, or
  pretrained detector/landmark/backbone/embedding/teacher path.
- No raw learner video/frame upload during normal practice.
- No duplicate worker, worker delete/reset, push, amend, or no-verify.
- Do not commit `artifacts/rawframe-lesson-milestone/model_state.pt`.

## Receipt

Write:

`docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json`

The receipt must record:

- M3EY metric/gate summary and non-promotion boundary;
- fail-closed claim surfaces before and after;
- files changed and why;
- validations run;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_fail_closed_product_polish_no_recognition`
- `continue_product_browser_validation_no_recognition`
- `continue_popsign_source_register_manifest_repair`
- `continue_detector0_worktree_integration_review`
- `continue_openai_or_gpt_pro_research`
- `stop_for_human_product_scope_review`

## Session Log

Write:

`docs/session-logs/556-mission-3ez-fail-closed-interactive-product-hardening.md`

## Acceptance Criteria

This mission can close when:

1. Required local checks pass or exact blockers are recorded.
2. A focused fail-closed product/docs/UI hardening slice is completed without
   recognition, promotion, or model-readiness claims.
3. `web/public/model/model-card.json` remains `status: "not_trained"`.
4. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []` unless a
   later authorized promotion chain changes it.
5. The tracked receipt and numbered session log exist and select exactly one
   next action.
