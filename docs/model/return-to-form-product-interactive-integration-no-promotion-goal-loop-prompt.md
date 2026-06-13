# Return-To-Form Product Interactive Integration No-Promotion Goal Loop Prompt

Mission 3BF prompt for the Codex executor after Mission 3BE selected a bounded
fail-closed product implementation lane. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend product interactive integration slice that
improves the learner experience while preserving all `not_trained` and
fail-closed claims.

This mission may implement one bounded product/runtime change only inside the
fail-closed product scope designed by M3BE. It must not train, fit, run Brev,
mutate manifests/tensors, import sources, export or promote a model, change
model-card/claim-matrix/active-vocabulary surfaces, activate browser
recognition, change final gates, or claim ASL correctness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BE evidence:
   - [`docs/validation/return-to-form-product-fallback-scope-design-v1.json`](../validation/return-to-form-product-fallback-scope-design-v1.json)
   - [`docs/session-logs/340-mission-3be-product-fallback-scope-design.md`](../session-logs/340-mission-3be-product-fallback-scope-design.md)
4. M3BD data quality evidence:
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
5. Current fail-closed product claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
6. Existing product validation receipts and audits under
   [`docs/validation/`](../validation/) and `scripts/audit_*.mjs`.

## Current Evidence

M3BE completed the no-training product fallback scope design. It records:

- browser model status `not_trained`;
- active labels `[]`;
- active CV claim `null`;
- browser recognition disabled;
- Detector 0 tracking disabled;
- box-driven avatar disabled;
- honest fallback scope: learn-only, local camera UX, metadata-only
  fail-closed attempts, progress/history, lesson timing/demo scaffold, and
  validation transparency;
- next action `continue_product_interactive_integration_no_promotion`.

Training, Brev, export, model-card promotion, browser trained activation,
Detector 0 tracking, and final-readiness claims remain blocked.

## Required Slice

Complete exactly one smallest useful fail-closed product integration slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-product-fallback-scope-design-v1.json
```

Do not run Brev commands in this mission.

2. Choose exactly one implementation surface from the M3BE allowed scope:

- `practice`: flow ergonomics, progress/history presentation, local camera
  state/recovery UX, or copy that reinforces learn-only/fail-closed status.
- `lesson`: authored timing scaffolds, prompt study flow, robot demo/timing
  poses with `recognitionAuthority: false`, or camera preview ergonomics.
- `validation`: reviewer-facing gap inventory, receipt links, or claim-matrix
  readability.

Default to `practice` if multiple surfaces look equally useful. Do not bundle
practice, lesson, and validation changes into one slice.

3. Implement the smallest scoped product change for that one surface.

Allowed implementation properties:

- improves interaction, clarity, recovery, history, or study flow;
- stores no raw learner camera frames;
- saves no positive recognition outcome while `model-card.status` is
  `not_trained`;
- preserves `activeLabels: []`, `active_cv_claim: null`, recognition disabled,
  Detector 0 tracking disabled, box-driven avatar disabled, and final readiness
  blocked.

4. Produce an integration receipt:

`docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json`

The receipt must include:

- selected product surface and why it is the smallest useful slice;
- files changed and claim surfaces verified unchanged;
- exact input artifacts and hashes for M3BE and claim surfaces;
- runtime/UX behavior added or changed;
- privacy and fail-closed proof;
- audit commands and results;
- browser QA evidence if web runtime changed;
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

Also run the relevant existing smoke/audit for the changed surface, and use
browser verification for user-visible runtime changes when practical.

6. Select exactly one next action:

- `continue_product_interactive_integration_no_promotion`: only if another
  clearly bounded fail-closed product surface remains and the current slice
  passed all relevant audits.
- `continue_final_readiness_gap_audit_no_promotion`: only if the product
  surface is now adequate and the next useful local step is a final-demo gap
  audit without changing claims or runtime.
- `stop_for_human_product_review`: if a human UX/content decision or live
  product review is needed before more product work.
- `stop_for_human_data_or_ml_repair`: if useful progress now requires source
  approval, manual labels, data collection, manifest/tensor mutation, training,
  Brev auth, paid compute, export, browser activation, or final-gate changes.
- `stop_for_product_integration_blocker`: if the product integration cannot be
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
  `web/public/model/detector0-card.json` unless the change is a receipt hash
  reference outside those files.
- No positive recognition/pass/fail outcome while the model remains
  `not_trained`.
- No raw learner video or frame upload/persistence.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BF prompt and `GOAL.md` names Mission 3BF.
2. Exactly one product surface is selected and implemented, or the receipt
   records a precise blocker.
3. Claim surfaces remain fail-closed and unchanged where required.
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
  positive recognition outcomes, or combines multiple product surfaces into one
  broad slice.
- NUDGE if the implementation is in scope but lacks a receipt, relevant audit,
  or exactly one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BF product interactive integration no-promotion.
Completed:            <one fail-closed product integration slice or blocker>.
Evidence:             <receipt, commands, browser/audit evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact product/data/model blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
