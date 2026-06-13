# Return-To-Form Final Readiness Gap Audit No-Promotion Goal Loop Prompt

Mission 3BI prompt for the Codex executor after Mission 3BH completed the
validation-surface fail-closed product integration. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend final readiness gap audit for the current
fail-closed product state, without changing runtime behavior, claim surfaces,
final gates, model artifacts, manifests, tensors, sources, or Brev state.

This mission is an audit and packaging step only. It should answer what is
still missing before a human reviews the learn-only product, while preserving
all `not_trained`, no-promotion, and fail-closed claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Product integration evidence:
   - [`docs/validation/return-to-form-product-fallback-scope-design-v1.json`](../validation/return-to-form-product-fallback-scope-design-v1.json)
   - [`docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-product-interactive-integration-no-promotion-v1.json)
   - [`docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json)
   - [`docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json`](../validation/return-to-form-validation-interactive-integration-no-promotion-v1.json)
4. Latest product session logs:
   - [`docs/session-logs/340-mission-3be-product-fallback-scope-design.md`](../session-logs/340-mission-3be-product-fallback-scope-design.md)
   - [`docs/session-logs/342-mission-3bf-product-interactive-integration-no-promotion.md`](../session-logs/342-mission-3bf-product-interactive-integration-no-promotion.md)
   - [`docs/session-logs/344-mission-3bg-lesson-interactive-integration-no-promotion.md`](../session-logs/344-mission-3bg-lesson-interactive-integration-no-promotion.md)
   - [`docs/session-logs/346-mission-3bh-validation-interactive-integration-no-promotion.md`](../session-logs/346-mission-3bh-validation-interactive-integration-no-promotion.md)
5. Current fail-closed product claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
6. Current product validation receipts:
   - [`docs/validation/practice-camera-behavior-smoke.json`](../validation/practice-camera-behavior-smoke.json)
   - [`docs/validation/practice-progress-smoke.json`](../validation/practice-progress-smoke.json)
   - [`docs/validation/practice-scope-copy-smoke.json`](../validation/practice-scope-copy-smoke.json)
   - [`docs/validation/lesson-page-smoke.json`](../validation/lesson-page-smoke.json)
   - [`docs/validation/validation-page-smoke.json`](../validation/validation-page-smoke.json)

## Current Evidence

M3BE designed the honest fallback product scope. M3BF completed the practice
surface, M3BG completed the lesson surface, and M3BH completed the validation
transparency surface. All three product integration receipts preserve:

- browser model status `not_trained`;
- active labels `[]`;
- active CV claim `null`;
- browser recognition disabled;
- Detector 0 tracking disabled;
- box-driven avatar authority disabled;
- no positive recognition/pass/fail outcome;
- no final validation promotion or final-readiness claim.

The next useful local/no-spend step is to audit the complete fail-closed
product package and classify exactly what remains before any human review,
data/ML repair, Brev auth/spend, export, browser activation, or final gate
change.

## Required Audit

Complete exactly one final readiness gap audit.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json
```

Do not run Brev commands in this mission.

2. Inspect the current product package without changing runtime behavior:

- `/` practice fail-closed state and history presentation;
- `/lesson` study flow, local camera/sample behavior, and avatar authority;
- `/validation` evidence links, claim matrix, and fail-closed copy;
- public runtime model/claim JSON surfaces;
- current product smoke receipts;
- final-readiness blockers that still require human, data/ML, Brev, export, or
  final-gate decisions.

3. Produce a tracked final gap audit receipt:

`docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json`

The receipt must include:

- inspected routes and artifacts;
- product surfaces classified as adequate, gap, or blocked;
- claim-surface hashes and fail-closed values;
- smoke/audit command evidence;
- privacy and no-raw-upload proof from current receipts;
- explicit non-promotion language;
- remaining blockers grouped by product, data/ML, Brev/auth, export/promotion,
  and human review;
- exactly one next action.

4. Run validation appropriate to an audit-only step:

```sh
node scripts/audit_final_claim_matrix.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
npm --prefix web run typecheck
npm --prefix web run build
```

Use existing practice, lesson, and validation smoke/audit receipts as evidence.
Refresh them only if the receipt needs current browser proof, and do not make
runtime changes.

5. Select exactly one next action:

- `continue_one_no_promotion_final_gap_fix`: only if the audit identifies one
  bounded local product/evidence gap that can be fixed without changing claim
  surfaces, final gates, model artifacts, manifests/tensors, sources, Brev
  state, browser activation, or final-readiness claims.
- `stop_for_human_product_review`: if the local fail-closed product package is
  ready for human review or needs a UX/content decision before more work.
- `stop_for_human_data_or_ml_repair`: if useful progress now requires source
  approval, manual labels, data collection, manifest/tensor mutation, training,
  export, browser activation, final validation promotion, or final-gate changes.
- `stop_for_brev_auth_required`: if useful progress now requires Brev login,
  worker inspection, paid compute, or cost-control decisions.
- `stop_for_final_gap_audit_blocker`: if the gap audit cannot be completed
  safely within no-promotion boundaries.

## Hard Boundaries

- No runtime product changes except audited evidence refreshes.
- No training run, model fitting, optimizer/backward pass, checkpoint creation,
  sweep, calibration, threshold promotion, export, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No manifest/tensor mutation, source import, generated pseudo-labels, public
  dataset expansion, Detector 0/landmark revival, broad label run, ONNX export,
  model-card promotion, browser trained activation, final-readiness claim,
  threshold promotion, final validation promotion, or final-gate weakening.
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

1. The active prompt is this M3BI prompt and `GOAL.md` names Mission 3BI.
2. The receipt audits the practice, lesson, and validation product package
   without changing runtime behavior or claims.
3. Claim surfaces remain fail-closed and unchanged.
4. No training/fitting/checkpoint/Brev/source/export/browser-activation/final
   validation promotion/final-gate action occurs.
5. A tracked receipt under `docs/validation/` records inspected artifacts,
   route status, claim-surface hashes, privacy/fail-closed proof, validation,
   non-promotion language, remaining blockers, and exactly one next action.
6. Required audits, web validation, evidence refreshes when applicable, and
   `git diff --check` pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the receipt selects exactly one bounded local no-promotion
  final-gap fix.
- STOP if the audit says the product is ready for human review, or if the next
  useful step requires source approval, manual data/labels, unsafe manifest
  mutation, Brev auth, paid compute, training, export, browser activation,
  product overclaims, final validation promotion, final-gate changes, or human
  product decisions.
- REDIRECT if the executor changes model-card/claim surfaces, implements
  positive recognition outcomes, enables Detector 0/box-driven avatar authority,
  or turns the audit into runtime/product implementation work.
- NUDGE if the audit is in scope but lacks a receipt, relevant audit, or
  exactly one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BI final readiness gap audit no-promotion.
Completed:            <one no-promotion final gap audit or blocker>.
Evidence:             <receipt, commands, browser/audit evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact product/data/model/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
