# Return-To-Form Crop/Region Contract Goal Loop Prompt

Mission 3BB prompt for the Codex executor after Mission 3BA. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training crop/region contract scaffold
from the M3BA split/signer contract.

This mission must define the crop/region gates that have to be satisfied before
any future recognizer training prompt. It must not train, fit, mutate
manifests, import sources, run Brev, change browser claims, implement product
runtime behavior, export, or promote a model.

The latest user objective renews the overnight completion push and approves
bounded Brev usage after the crop/region contract identifies a training-worthy
micro-experiment. This mission remains no-spend/no-training, but its next
action may hand off to a bounded Brev compute-receipt prompt instead of
stopping when the M3BB evidence supports remote training and Brev auth is
available.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BA evidence:
   - [`docs/validation/return-to-form-split-signer-contract-v1.json`](../validation/return-to-form-split-signer-contract-v1.json)
   - [`docs/session-logs/331-mission-3ba-split-signer-contract.md`](../session-logs/331-mission-3ba-split-signer-contract.md)
4. M3AZ and M3AY evidence:
   - [`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`](../validation/return-to-form-vocab-crop-remediation-design-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
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

M3BA selected signer-disjoint as the honest diagnostic target and blocked any
future training prompt until crop/region and label-level gates pass. Its
contract verified `139` manifest-bound tensors, found train/validation/test
signer overlap `[]`, and held `please`, `sad`, `table`, and `white` for repair
before any next training prompt.

M3BA's next action is `continue_no_training_crop_region_contract_scaffold`.
M3AY identified ten split-label descriptive crop-stat drift failures, so the
next useful artifact must state what crop/region evidence would clear or hold
each affected label before training.

## Required Slice

Complete exactly one smallest useful no-training crop/region contract slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/diagnose_vocab_crop_separability.py scripts/design_vocab_crop_remediation.py scripts/audit_high_signal_split_signer_contract.py
python3 -m json.tool docs/validation/return-to-form-split-signer-contract-v1.json
```

Do not run Brev commands in this mission.

2. Inspect existing evidence only. At minimum, use:

- M3BA split/signer contract receipt;
- M3AZ remediation design receipt;
- M3AY vocabulary/crop separability diagnosis receipt;
- M3AW smoke receipt, validation report, and prediction sidecar;
- M3AX tiny-overfit receipt;
- high-signal region-grid train/validation/test manifests and tensor metadata.

3. Produce a crop/region contract receipt:

`docs/validation/return-to-form-crop-region-contract-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- verification that existing manifest-bound tensors still expose preserved
  `rgb_regions_grid_v1` inputs, or a precise blocker;
- per-label/per-split region quality summaries from existing tensors or
  sidecars only;
- explicit resolution, hold, or deferral decisions for the M3AY crop-stat drift
  failures;
- minimum crop/region gates that must pass before any future training prompt;
- relationship to M3BA label decisions, including `please`, `sad`, `table`,
  and `white`;
- stop conditions if satisfying the crop/region contract requires new source
  approval, manual labels, manual data collection, manifest mutation, paid
  compute, Brev auth, export, product/runtime changes, or final-gate changes;
- explicit non-promotion language;
- exactly one next action.

4. Add the smallest deterministic audit helper only if needed, preferably at:

`scripts/audit_high_signal_crop_region_contract.py`

Any helper must be analysis-only:

- no manifest or tensor mutation;
- no model/training/runtime implementation changes;
- no optimizer, backward pass, model fitting, checkpoint creation, or sweep;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, or final-gate change.

5. Select exactly one next action:

- `continue_no_training_vocab_subset_contract_scaffold`: only if the
  crop/region contract is complete and the next bounded blocker is label
  retain/hold/drop policy before any future training.
- `continue_bounded_brev_microexperiment_compute_receipt`: only if the
  crop/region contract is complete, it identifies a training-worthy retained
  subset or crop/region ablation, and the next step should be a paid
  micro-experiment governed by
  `docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`.
- `continue_product_fallback_scope_design_no_training`: only if the contract
  selects product fallback scope as the next bounded lane.
- `stop_for_brev_auth_required`: if the next useful step requires Brev but
  this shell remains blocked on NVIDIA/Brev login or human 2FA.
- `stop_for_human_ml_scope_decision`: if any useful next step requires source
  approval, manual data/annotation work, manifest mutation, export, browser
  activation, product-runtime changes, final-gate changes, or paid compute
  without a current compute-receipt prompt.
- `stop_for_crop_region_contract_blocker`: if the contract cannot be completed
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

1. The active prompt is this M3BB prompt and `GOAL.md` names Mission 3BB.
2. The contract references the M3BA split/signer contract, M3AZ design, M3AY
   diagnosis, M3AW smoke evidence, and M3AX tiny-overfit receipt.
3. The contract uses existing manifests/tensors/receipts/reports only, or the
   receipt records a precise blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate action
   occurs.
5. A tracked receipt under `docs/validation/` records deterministic crop/region
   evidence, per-label/per-split quality summaries, drift-failure decisions,
   gate requirements, non-promotion language, and exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded no-training contract/remediation/product
  scope prompt.
- CONTINUE to
  `docs/model/return-to-form-bounded-brev-microexperiment-goal-loop-prompt.md`
  only if M3BB produces a training-worthy crop/region contract and the handoff
  requires a compute receipt before paid work.
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
Current state:        Mission 3BB crop/region contract scaffold.
Completed:            <contract receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
