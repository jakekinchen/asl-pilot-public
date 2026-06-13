# Return-To-Form Vocabulary/Crop Remediation Design Goal Loop Prompt

Mission 3AZ prompt for the Codex executor after Mission 3AY. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training remediation design slice from
the M3AY vocabulary/crop separability diagnosis.

This mission converts existing evidence into a bounded next contract before
any new training, Brev work, source import, browser activation, export, or
promotion. It must decide whether the next useful path is vocabulary/subset
remediation, crop/region remediation, signer/split remediation, or a
fail-closed product fallback scope.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AY evidence:
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
   - [`docs/session-logs/327-mission-3ay-vocab-crop-separability-diagnosis.md`](../session-logs/327-mission-3ay-vocab-crop-separability-diagnosis.md)
4. M3AW evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/validation-report.json`](../../output/m3aw-region-grid-tcn-local-smoke/validation-report.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json`](../../output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json)
5. M3AX evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`output/m3ax-region-grid-tcn-tiny-overfit/selected-subset.json`](../../output/m3ax-region-grid-tcn-tiny-overfit/selected-subset.json)
   - [`output/m3ax-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json`](../../output/m3ax-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json)
6. Post-M3AW API strategy memo:
   - [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md)
7. Current data surfaces:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
   - [`data/tensors/asl-citizen-high-signal-region-grid/`](../../data/tensors/asl-citizen-high-signal-region-grid/)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AX proved the current `true_temporal_convnet_region_grid` path can memorize a
deterministic seven-clip subset with final accuracy `1.0` and zero-recall
labels `[]`.

M3AW remains failed held-out evidence: validation top-1
`0.037037037037037035`, validation macro F1 `0.015037593984962407`, test
top-1 `0.17857142857142858`, and test macro F1
`0.09166666666666666`.

M3AY completed a no-training diagnosis at commit `5c8befd`. It found held-out
prediction collapse to only three predicted labels on validation and test;
`please`, `sad`, `table`, and `white` were never predicted on both held-out
splits; train/validation signer overlap and train/test signer overlap were
both `[]`; and descriptive crop-stat centroids showed same-label held-out
drift losing to another train label for ten split-label rows.

The next useful work is not another training run. It is a deterministic design
decision about what to remediate before any further learning attempt.

## Required Slice

Complete exactly one smallest useful no-training remediation design slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/diagnose_vocab_crop_separability.py
python3 -m json.tool docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json
```

Do not run Brev commands in this mission.

2. Inspect existing evidence only. At minimum, use:

- the M3AY diagnosis receipt and session log;
- the M3AW smoke receipt, validation report, and prediction sidecar;
- the M3AX tiny-overfit receipt and provenance;
- high-signal region-grid train/validation/test manifests and tensor metadata;
- the post-M3AW API strategy memo.

3. Produce a remediation design receipt:

`docs/validation/return-to-form-vocab-crop-remediation-design-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- the M3AY diagnosis facts the design depends on;
- ranked remediation hypotheses across vocabulary/subset choice, crop/region
  signal, signer/split generalization, data quality, and product fallback;
- exactly one selected remediation lane;
- the next lane's acceptance criteria before any training can be attempted;
- future artifacts that may be changed in the next prompt;
- blocked actions that require human approval;
- explicit non-promotion language;
- exactly one next action.

4. The selected remediation lane must be one of:

- `vocab_subset_contract`: narrow, hold, drop, or split labels before more
  recognizer training, based only on existing evidence.
- `crop_region_contract`: define crop/region data-contract or tensor
  generation requirements before more recognizer training.
- `split_signer_contract`: define split, signer, or evaluation-balance
  requirements before more recognizer training.
- `product_fallback_scope`: downscope to fail-closed learner/product behavior
  until recognizer evidence improves.

5. Add a deterministic helper only if needed to summarize existing JSON
artifacts. The helper must be analysis-only:

- no model/training/runtime implementation changes;
- no optimizer, backward pass, model fitting, or checkpoint creation;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, or final-gate change.

6. Select exactly one next action:

- `continue_no_training_remediation_contract_scaffold`: only if the design
  identifies one bounded no-training contract/audit/manifest-design scaffold
  that can be reviewed before training.
- `continue_product_fallback_scope_design_no_training`: only if the design
  selects product fallback scope as the next bounded lane.
- `stop_for_human_ml_scope_decision`: if any useful next step requires
  training, Brev, paid compute, source approval, manual data/annotation work,
  export, browser activation, or final-gate changes.
- `stop_for_remediation_design_blocker`: if the design cannot be completed
  safely from existing artifacts.

## Hard Boundaries

- No training run, tiny overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, calibration, threshold promotion, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No source import, generated pseudo-labels, SemLex training use, public
  dataset expansion, Detector 0/landmark training revival, broad label run,
  ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No product-runtime implementation changes in this design mission.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3AZ prompt and `GOAL.md` names Mission 3AZ.
2. The design references the M3AY diagnosis receipt, M3AW smoke receipt, M3AX
   tiny-overfit receipt, and post-M3AW API memo.
3. The design uses existing manifests/tensors/receipts/reports only, or the
   receipt records a precise blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate action
   occurs.
5. A tracked receipt under `docs/validation/` records deterministic design
   evidence, selected remediation lane, acceptance criteria, non-promotion
   language, and exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded no-training contract/remediation/product
  scope prompt.
- STOP if the next action requires any training attempt, Brev auth, paid
  compute, source approval, manual annotation/data collection, export, browser
  activation, or final-gate changes.
- REDIRECT if the executor uses this design mission to implement model,
  training, runtime, browser, or final-gate behavior.
- NUDGE if the design is in scope but has not selected exactly one lane.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AZ vocabulary/crop remediation design.
Completed:            <design receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
