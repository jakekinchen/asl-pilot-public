# Return-To-Form Vocabulary Subset Contract Goal Loop Prompt

Mission 3BC prompt for the Codex executor after Mission 3BB. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training vocabulary subset contract
scaffold from the M3BB crop/region contract.

This mission must decide which high-signal labels are retained, held, dropped,
or deferred before any future recognizer training or Brev compute prompt. It
must not train, fit, mutate manifests/tensors, import sources, run Brev, change
browser claims, implement product runtime behavior, export, or promote a model.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BB evidence:
   - [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json)
   - [`docs/session-logs/334-mission-3bb-crop-region-contract.md`](../session-logs/334-mission-3bb-crop-region-contract.md)
4. M3BA and M3AZ evidence:
   - [`docs/validation/return-to-form-split-signer-contract-v1.json`](../validation/return-to-form-split-signer-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json)
5. M3AY/M3AW/M3AX evidence:
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/validation-report.json`](../../output/m3aw-region-grid-tcn-local-smoke/validation-report.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json`](../../output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json)
6. Current data surfaces:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BB verified all `139` selected manifest-bound tensors still expose preserved
`rgb_regions_grid_v1` input, but it did not clear the M3AY crop-stat drift
failures. It kept `please`, `sad`, `table`, and `white` held before any
training prompt, kept `uncle` in repair-required status, and retained `black`
and `hello` only with targeted/crop gates. M3BB did not identify a
training-worthy paid Brev micro-experiment, so the next useful bounded artifact
is a no-training vocabulary subset contract.

## Required Slice

Complete exactly one smallest useful no-training vocabulary subset contract.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/diagnose_vocab_crop_separability.py scripts/design_vocab_crop_remediation.py scripts/audit_high_signal_split_signer_contract.py scripts/audit_high_signal_crop_region_contract.py
python3 -m json.tool docs/validation/return-to-form-crop-region-contract-v1.json
```

Do not run Brev commands in this mission.

2. Inspect existing evidence only. At minimum, use:

- M3BB crop/region contract receipt;
- M3BA split/signer contract receipt;
- M3AZ remediation design receipt;
- M3AY vocabulary/crop separability diagnosis receipt;
- M3AW smoke receipt, validation report, and prediction sidecar;
- M3AX tiny-overfit receipt;
- high-signal region-grid train/validation/test manifests.

3. Produce a vocabulary subset contract receipt:

`docs/validation/return-to-form-vocab-subset-contract-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- per-label support across train/validation/test, including clip counts,
  signer counts, and signer-disjoint implications;
- per-label status from M3BA/M3BB: retain, hold, repair, drop, or defer;
- relationship to M3AY never-predicted labels and crop-stat drift failures;
- the smallest honest candidate subset, if any, and why each excluded label is
  excluded;
- minimum gates before any future local or Brev training prompt;
- stop conditions if resolving the subset requires source approval, manual
  labels, manual collection, manifest/tensor mutation, Brev auth, paid compute,
  export, product/runtime changes, or final-gate changes;
- explicit non-promotion language;
- exactly one next action.

4. Add the smallest deterministic audit helper only if needed, preferably at:

`scripts/audit_high_signal_vocab_subset_contract.py`

Any helper must be analysis-only:

- no manifest or tensor mutation;
- no model/training/runtime implementation changes;
- no optimizer, backward pass, model fitting, checkpoint creation, or sweep;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, or final-gate change.

5. Select exactly one next action:

- `continue_no_training_data_quality_contract_scaffold`: only if the subset
  contract is complete and the next bounded blocker is data quality or label
  repair evidence before any future training.
- `continue_bounded_brev_microexperiment_compute_receipt`: only if the subset
  contract identifies a training-worthy retained subset or ablation and the
  next step should be a paid micro-experiment governed by
  `docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`.
- `continue_product_fallback_scope_design_no_training`: only if the contract
  selects product fallback scope as the next bounded lane.
- `stop_for_brev_auth_required`: if the next useful step requires Brev but
  this shell remains blocked on NVIDIA/Brev login or human 2FA.
- `stop_for_human_ml_scope_decision`: if any useful next step requires source
  approval, manual data/annotation work, manifest mutation, export, browser
  activation, product-runtime changes, final-gate changes, or paid compute
  without a current compute-receipt prompt.
- `stop_for_vocab_subset_contract_blocker`: if the contract cannot be completed
  safely from existing artifacts.

## Hard Boundaries

- No training run, tiny overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, calibration, threshold promotion, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No manifest/tensor mutation, source import, generated pseudo-labels, public
  dataset expansion, Detector 0/landmark training revival, broad label run,
  ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No product-runtime implementation changes in this contract mission.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BC prompt and `GOAL.md` names Mission 3BC.
2. The contract references the M3BB crop/region contract, M3BA split/signer
   contract, M3AZ design, M3AY diagnosis, M3AW smoke evidence, and M3AX
   tiny-overfit receipt.
3. The contract uses existing manifests/tensors/receipts/reports only, or the
   receipt records a precise blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate action
   occurs.
5. A tracked receipt under `docs/validation/` records deterministic
   retain/hold/drop/repair/defer decisions, candidate subset evidence, gate
   requirements, non-promotion language, and exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded no-training contract/remediation/product
  scope prompt.
- CONTINUE to
  `docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`
  only if M3BC produces a training-worthy subset and the handoff requires a
  compute receipt before paid work.
- STOP if the next action requires unresolved Brev auth/2FA, source approval,
  manual annotation/data collection, unsafe manifest mutation, export, browser
  activation, product-runtime changes, final-gate changes, or paid compute
  without the bounded compute-receipt prompt.
- REDIRECT if the executor mutates manifests/tensors or implements model,
  training, runtime, browser, or final-gate behavior.
- NUDGE if the contract is in scope but has not selected exactly one next
  action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BC vocabulary subset contract scaffold.
Completed:            <contract receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
