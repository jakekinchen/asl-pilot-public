# Return-To-Form Product Fallback Scope Design Goal Loop Prompt

Mission 3BE prompt for the Codex executor after Mission 3BD found no
training-worthy high-signal subset from existing artifacts. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training product fallback scope design.

This mission must translate the M3BD data quality contract into an honest
fail-closed product scope for the current browser app while the recognizer
remains `not_trained`. It must not train, fit, run Brev, mutate
manifests/tensors, import sources, export or promote a model, change browser
claims, implement product runtime behavior, or change final gates.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BD evidence:
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
   - [`docs/session-logs/338-mission-3bd-data-quality-contract.md`](../session-logs/338-mission-3bd-data-quality-contract.md)
4. Prior return-to-form evidence:
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json)
   - [`docs/validation/return-to-form-split-signer-contract-v1.json`](../validation/return-to-form-split-signer-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
5. Current fail-closed product claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
6. Product/lesson validation evidence already present under
   [`docs/validation/`](../validation/) and the return-to-form tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BD completed the data quality contract from existing artifacts only. It found
no held, deferred, or repair-required label can be repaired into a
training-worthy retained candidate, recorded `retained_labels: []`, and
selected `continue_product_fallback_scope_design_no_training`. A paid Brev
micro-experiment is not supported because the retained subset is empty.

The browser model remains fail-closed and `not_trained`. Any learner-facing
scope must preserve that truth: practice can be interactive, local, and useful,
but it cannot claim ASL correctness, trained recognition, final readiness, or
active vocabulary support.

## Required Slice

Complete exactly one smallest useful product fallback design.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-data-quality-contract-v1.json
```

Do not run Brev commands in this mission.

2. Inspect existing product and claim evidence only. At minimum, use:

- M3BD data quality contract receipt and session log;
- current model card, claim matrix, active-vocabulary claim, and final-claim
  matrix;
- existing fail-closed lesson/practice/validation receipts or audits;
- the return-to-form tactical overlay.

3. Produce a product fallback scope design receipt:

`docs/validation/return-to-form-product-fallback-scope-design-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- current browser/model claim status;
- the honest learner-facing scope that can exist with `not_trained` recognition;
- product surfaces that may be improved without promotion, and surfaces that
  must remain unchanged until a trained artifact exists;
- copy/UX guardrails that prevent correctness, active-vocabulary, or final
  readiness overclaims;
- technical gates before any future product-runtime implementation prompt;
- technical gates before any future model export, browser activation, final
  readiness, or Brev/training prompt;
- explicit non-promotion language;
- stop conditions requiring human approval;
- exactly one next action.

4. Add the smallest deterministic audit helper only if needed, preferably at:

`scripts/audit_product_fallback_scope_design.py`

Any helper must be analysis-only:

- no web runtime edits;
- no manifest or tensor mutation;
- no model/training/runtime implementation changes;
- no optimizer, backward pass, model fitting, checkpoint creation, or sweep;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, product promotion, or final-gate change.

5. Select exactly one next action:

- `continue_product_interactive_integration_no_promotion`: only if the design
  identifies a bounded local product implementation prompt that preserves
  `not_trained` claims and requires no model/export/final-gate change.
- `continue_final_readiness_gap_audit_no_promotion`: only if the design shows
  the next useful local step is an audit of remaining final-demo gaps without
  changing runtime behavior or claims.
- `stop_for_human_product_scope_decision`: if the useful next step requires a
  human UX/content choice, product-runtime implementation not safely specified
  by the design, browser activation, final-gate changes, or final-readiness
  claims.
- `stop_for_human_data_or_ml_repair`: if the useful next step requires source
  approval, manual labels, manual data collection, manifest/tensor mutation,
  training, Brev auth, or paid compute.
- `stop_for_fallback_scope_design_blocker`: if the design cannot be completed
  safely from existing artifacts.

## Hard Boundaries

- No training run, model fitting, optimizer/backward pass, checkpoint creation,
  sweep, calibration, threshold promotion, export, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No manifest/tensor mutation, source import, generated pseudo-labels, public
  dataset expansion, Detector 0/landmark revival, broad label run, ONNX export,
  model-card promotion, browser trained activation, final-readiness claim,
  threshold promotion, or final-gate weakening.
- No product-runtime implementation changes in this design mission.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BE prompt and `GOAL.md` names Mission 3BE.
2. The design references M3BD and the current fail-closed product claim
   surfaces.
3. The design uses existing artifacts only, or the receipt records a precise
   blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate/product
   runtime action occurs.
5. A tracked receipt under `docs/validation/` records the honest fallback
   scope, claim guardrails, implementation gates, future ML/export gates,
   non-promotion language, stop conditions, and exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to a bounded no-training product/final-gap prompt that preserves
  fail-closed browser claims.
- STOP if the next action requires human UX/content choice, source approval,
  manual annotation/data collection, unsafe manifest mutation, Brev auth,
  training, export, browser activation, product overclaims, final-gate changes,
  or paid compute.
- REDIRECT if the executor implements product runtime behavior or changes
  browser/model claims inside this design mission.
- NUDGE if the design is in scope but has not selected exactly one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BE product fallback scope design.
Completed:            <design receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact scope/data/model blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
