# Return-To-Form Split/Signer Contract Goal Loop Prompt

Mission 3BA prompt for the Codex executor after Mission 3AZ. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training split/signer contract scaffold
from the M3AZ remediation design.

This mission must turn the selected `split_signer_contract` lane into a
reviewable contract before any new training, Brev work, source import, manual
annotation, browser activation, export, product-runtime implementation, or
promotion.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AZ evidence:
   - [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json)
   - [`docs/session-logs/329-mission-3az-vocab-crop-remediation-design.md`](../session-logs/329-mission-3az-vocab-crop-remediation-design.md)
4. M3AY evidence:
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
   - [`docs/session-logs/327-mission-3ay-vocab-crop-separability-diagnosis.md`](../session-logs/327-mission-3ay-vocab-crop-separability-diagnosis.md)
5. M3AW/M3AX evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/validation-report.json`](../../output/m3aw-region-grid-tcn-local-smoke/validation-report.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json`](../../output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json)
6. Current data surfaces:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
   - [`data/tensors/asl-citizen-high-signal-region-grid/`](../../data/tensors/asl-citizen-high-signal-region-grid/)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AZ selected `split_signer_contract` because M3AY showed empty
train/validation signer overlap and empty train/test signer overlap, while
M3AW held-out predictions collapsed to three predicted labels on both held-out
splits.

M3AZ also ranked `crop_region_contract`, `vocab_subset_contract`,
`data_quality_contract`, and `product_fallback_scope` as follow-up alternatives
that should remain subordinate until the split/signer contract states the
generalization target and pre-training stop conditions.

## Required Slice

Complete exactly one smallest useful no-training split/signer contract slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/diagnose_vocab_crop_separability.py scripts/design_vocab_crop_remediation.py
python3 -m json.tool docs/validation/return-to-form-vocab-crop-remediation-design-v1.json
```

Do not run Brev commands in this mission.

2. Inspect existing evidence only. At minimum, use:

- M3AZ design receipt and session log;
- M3AY diagnosis receipt;
- M3AW smoke receipt, validation report, and prediction sidecar;
- M3AX tiny-overfit receipt;
- high-signal region-grid train/validation/test manifests and tensor metadata.

3. Produce a split/signer contract receipt:

`docs/validation/return-to-form-split-signer-contract-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- train/validation/test signer ids, counts, per-label signer support, and
  train-to-held-out signer overlap;
- the intended generalization target: signer-disjoint, signer-overlap
  diagnostic, or fail-closed product fallback;
- per-label retain/hold/drop/repair decisions for zero-recall and
  never-predicted labels, including `please`, `sad`, `table`, and `white`;
- deterministic crop/region quality gates that must exist before any future
  training, or an explicit deferral reason;
- stop conditions if satisfying the contract requires new source approval,
  manual labels, manual data collection, paid compute, Brev auth, export, or
  product/runtime changes;
- explicit non-promotion language;
- exactly one next action.

4. Add the smallest deterministic audit helper only if needed, preferably at:

`scripts/audit_high_signal_split_signer_contract.py`

Any helper must be analysis-only:

- no manifest mutation;
- no model/training/runtime implementation changes;
- no optimizer, backward pass, model fitting, checkpoint creation, or sweep;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, or final-gate change.

5. Select exactly one next action:

- `continue_no_training_crop_region_contract_scaffold`: only if the split
  contract is complete and the next bounded blocker is crop/region quality
  gates before any future training.
- `continue_no_training_vocab_subset_contract_scaffold`: only if the split
  contract is complete and the next bounded blocker is label retain/hold/drop
  decisions before any future training.
- `continue_product_fallback_scope_design_no_training`: only if the contract
  selects product fallback scope as the next bounded lane.
- `stop_for_human_ml_scope_decision`: if any useful next step requires
  training, Brev, paid compute, source approval, manual data/annotation work,
  export, browser activation, product-runtime changes, or final-gate changes.
- `stop_for_split_signer_contract_blocker`: if the contract cannot be
  completed safely from existing artifacts.

## Hard Boundaries

- No training run, tiny overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, calibration, threshold promotion, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No manifest mutation, source import, generated pseudo-labels, public dataset
  expansion, Detector 0/landmark training revival, broad label run, ONNX
  export, model-card promotion, browser trained activation, final-readiness
  claim, threshold promotion, or final-gate weakening.
- No product-runtime implementation changes in this contract mission.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BA prompt and `GOAL.md` names Mission 3BA.
2. The contract references the M3AZ design receipt, M3AY diagnosis receipt,
   M3AW smoke receipt/report/sidecar, and M3AX tiny-overfit receipt.
3. The contract uses existing manifests/tensors/receipts/reports only, or the
   receipt records a precise blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate action
   occurs.
5. A tracked receipt under `docs/validation/` records deterministic
   split/signer evidence, selected generalization target, label decisions,
   crop/region gate requirements or deferral, non-promotion language, and
   exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded no-training contract/remediation/product
  scope prompt.
- STOP if the next action requires any training attempt, Brev auth, paid
  compute, source approval, manual annotation/data collection, export, browser
  activation, product-runtime changes, or final-gate changes.
- REDIRECT if the executor mutates manifests or implements model, training,
  runtime, browser, or final-gate behavior.
- NUDGE if the contract is in scope but has not selected exactly one
  generalization target and one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BA split/signer contract scaffold.
Completed:            <contract receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
