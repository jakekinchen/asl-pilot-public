# Return-To-Form Lesson Interactive Integration No-Promotion Goal Loop Prompt

Mission 3BG prompt for the Codex executor after Mission 3BF completed the
practice-surface fail-closed product integration. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend lesson-surface interactive integration
slice that improves the learner experience while preserving all `not_trained`
and fail-closed claims.

This mission may implement one bounded `/lesson` product/runtime change only
inside the fail-closed product scope designed by M3BE. It must not train, fit,
run Brev, mutate manifests/tensors, import sources, export or promote a model,
change model-card/claim-matrix/active-vocabulary surfaces, activate browser
recognition, change final gates, enable Detector 0 tracking, or claim ASL
correctness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BF practice integration evidence:
   - [`docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-product-interactive-integration-no-promotion-v1.json)
   - [`docs/session-logs/342-mission-3bf-product-interactive-integration-no-promotion.md`](../session-logs/342-mission-3bf-product-interactive-integration-no-promotion.md)
4. M3BE product fallback scope evidence:
   - [`docs/validation/return-to-form-product-fallback-scope-design-v1.json`](../validation/return-to-form-product-fallback-scope-design-v1.json)
5. Current fail-closed product claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
6. Existing lesson validation receipts and audits:
   - [`docs/validation/lesson-page-smoke.json`](../validation/lesson-page-smoke.json)
   - `scripts/audit_lesson_fail_closed.mjs`
   - `scripts/audit_avatar_no_recognition_claims.mjs`

## Current Evidence

M3BF completed one bounded product surface: `practice`. It changed practice
history presentation so saved fail-closed practice history no longer looks like
pass-style progress while the browser model is `not_trained`.

The remaining M3BE product surface with high learner value is `lesson`:
authored timing scaffolds, prompt study flow, robot demo/timing poses with
`recognitionAuthority: false`, or camera preview ergonomics. Validation
transparency remains a later no-promotion option.

Training, Brev, export, model-card promotion, browser trained activation,
Detector 0 tracking, and final-readiness claims remain blocked.

## Required Slice

Complete exactly one smallest useful fail-closed lesson integration slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json
```

Do not run Brev commands in this mission.

2. Choose exactly one lesson-surface improvement from the M3BE allowed scope:

- authored timing scaffolds;
- prompt study flow;
- robot demo/timing poses with `recognitionAuthority: false`;
- camera preview ergonomics.

Do not bundle lesson and validation changes into one slice.

3. Implement the smallest scoped lesson change.

Allowed implementation properties:

- improves lesson interaction, clarity, recovery, study flow, or authored
  timing demo behavior;
- stores no raw learner camera frames;
- does not enable Detector 0 tracking, live recognition, or box-driven avatar
  authority;
- preserves `activeLabels: []`, `active_cv_claim: null`, recognition disabled,
  Detector 0 tracking disabled, box-driven avatar disabled, and final readiness
  blocked;
- keeps robot/avatar copy and metadata honest: authored timing/demo scaffold
  only, not live ASL tracking or correctness.

4. Produce a lesson integration receipt:

`docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json`

The receipt must include:

- selected lesson sub-surface and why it is the smallest useful slice;
- files changed and claim surfaces verified unchanged;
- exact input artifacts and hashes for M3BE/M3BF and claim surfaces;
- runtime/UX behavior added or changed;
- privacy and fail-closed proof;
- audit commands and results;
- browser QA evidence for `/lesson` if web runtime changed;
- explicit non-promotion language;
- stop conditions requiring human approval;
- exactly one next action.

5. Run validation appropriate to the touched surface. Minimum after any web
runtime change:

```sh
node scripts/audit_final_claim_matrix.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
npm --prefix web run typecheck
npm --prefix web run build
```

Also refresh or audit the relevant existing lesson smoke, and use browser
verification for user-visible runtime changes when practical.

6. Select exactly one next action:

- `continue_product_interactive_integration_no_promotion`: only if another
  clearly bounded fail-closed product surface remains and the current lesson
  slice passed all relevant audits.
- `continue_final_readiness_gap_audit_no_promotion`: only if practice and
  lesson surfaces are adequate and the next useful local step is a final-demo
  gap audit without changing claims or runtime.
- `stop_for_human_product_review`: if a human UX/content decision or live
  product review is needed before more product work.
- `stop_for_human_data_or_ml_repair`: if useful progress now requires source
  approval, manual labels, data collection, manifest/tensor mutation, training,
  Brev auth, paid compute, export, browser activation, or final-gate changes.
- `stop_for_lesson_integration_blocker`: if the lesson integration cannot be
  completed safely within fail-closed boundaries.

## Hard Boundaries

- No training run, model fitting, optimizer/backward pass, checkpoint creation,
  sweep, calibration, threshold promotion, export, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No manifest/tensor mutation, source import, generated pseudo-labels, public
  dataset expansion, Detector 0/landmark revival, broad label run, ONNX export,
  model-card promotion, browser trained activation, final-readiness claim,
  threshold promotion, or final-gate weakening.
- No edits to `web/public/model/model-card.json`,
  `web/public/model/claim-matrix.json`,
  `docs/model/active-vocabulary-claim.json`,
  `docs/validation/final-claim-matrix.json`,
  `web/public/model/browser-model-bundle.json`, or
  `web/public/model/detector0-card.json`.
- No positive recognition/pass/fail outcome while the model remains
  `not_trained`.
- No raw learner video or frame upload/persistence.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BG prompt and `GOAL.md` names Mission 3BG.
2. Exactly one lesson sub-surface is selected and implemented, or the receipt
   records a precise blocker.
3. Claim surfaces remain fail-closed and unchanged.
4. No training/fitting/checkpoint/Brev/source/export/browser-activation/final
   gate action occurs.
5. A tracked receipt under `docs/validation/` records the implementation scope,
   changed files, claim-surface hashes, privacy/fail-closed proof, validation,
   non-promotion language, stop conditions, and exactly one next action.
6. Required audits, web validation, browser QA when applicable, and
   `git diff --check` pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded fail-closed product surface or a
  no-promotion final-gap audit.
- STOP if the next action requires human product review, source approval,
  manual annotation/data collection, unsafe manifest mutation, Brev auth,
  training, export, browser activation, product overclaims, final-gate changes,
  or paid compute.
- REDIRECT if the executor changes model-card/claim surfaces, implements
  positive recognition outcomes, enables Detector 0/box-driven avatar authority,
  or combines multiple product surfaces into one broad slice.
- NUDGE if the implementation is in scope but lacks a receipt, relevant audit,
  browser evidence for visible changes, or exactly one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BG lesson interactive integration no-promotion.
Completed:            <one fail-closed lesson integration slice or blocker>.
Evidence:             <receipt, commands, browser/audit evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact product/data/model blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
