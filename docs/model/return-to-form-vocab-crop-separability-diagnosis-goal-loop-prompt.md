# Return-To-Form Vocabulary/Crop Separability Diagnosis Goal Loop Prompt

Mission 3AY prompt for the Codex executor after Mission 3AX. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run, verify, or precisely block exactly one local/no-spend, no-training
diagnosis of why the current high-signal region-grid recognizer can memorize a
tiny subset but did not generalize in the M3AW smoke.

This is not a training mission. It should use existing manifests, tensors,
receipts, reports, prediction sidecars, and source metadata to separate:

- model/input/training-path viability;
- vocabulary/label separability;
- crop/region signal quality;
- signer/split distribution issues;
- product-scope implications for the browser-first fail-closed app.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AX evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`docs/session-logs/325-mission-3ax-region-grid-tcn-tiny-overfit.md`](../session-logs/325-mission-3ax-region-grid-tcn-tiny-overfit.md)
   - [`output/m3ax-region-grid-tcn-tiny-overfit/selected-subset.json`](../../output/m3ax-region-grid-tcn-tiny-overfit/selected-subset.json)
   - [`output/m3ax-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json`](../../output/m3ax-region-grid-tcn-tiny-overfit/tiny-overfit-provenance.json)
4. M3AW evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/session-logs/322-mission-3aw-region-grid-tcn-local-smoke.md`](../session-logs/322-mission-3aw-region-grid-tcn-local-smoke.md)
   - [`output/m3aw-region-grid-tcn-local-smoke/validation-report.json`](../../output/m3aw-region-grid-tcn-local-smoke/validation-report.json)
   - [`output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json`](../../output/m3aw-region-grid-tcn-local-smoke/prediction-sidecar.json)
5. Post-M3AW API strategy memo:
   - [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md)
6. Current data surfaces:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
   - [`data/tensors/asl-citizen-high-signal-region-grid/`](../../data/tensors/asl-citizen-high-signal-region-grid/)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AW proved the corrected region-grid path can run a bounded local smoke with
region identity preserved to the model, but target metrics failed badly:
validation top-1 `0.037037037037037035`, validation macro F1
`0.015037593984962407`, test top-1 `0.17857142857142858`, and test macro F1
`0.09166666666666666`.

M3AX then proved the same model/input path can memorize a deterministic
seven-clip subset: final subset accuracy `1.0`, loss
`1.7881354779092362e-06`, and zero-recall labels `[]`.

The next useful work is not another training run. It is a deterministic
diagnosis of the current data/vocabulary/crop evidence.

## Required Slice

Complete exactly one smallest useful no-training diagnosis slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py
```

Do not run Brev commands in this mission.

2. Inspect existing evidence only. At minimum, use:

- M3AW receipt, validation report, and prediction sidecar;
- M3AX receipt, selected subset, and provenance;
- high-signal region-grid train/validation/test manifests;
- tensor metadata/hashes already referenced by those manifests and receipts.

3. Add the smallest analysis helper only if needed. Any helper must be
deterministic and no-training:

- no optimizer, backward pass, loss-driven update, or checkpoint creation;
- no new model fitting or feature learning;
- no Brev, source import, pseudo-label generation, Detector 0/landmark work,
  export, browser activation, or final-gate change.

4. Diagnose and record evidence for:

- per-label train/validation/test counts and signer/source distribution;
- whether M3AX's tiny subset is representative or unusually easy;
- M3AW confusion/concentration patterns from existing prediction artifacts;
- region/crop tensor quality signals available without training, such as
  region availability, basic intensity/motion statistics, empty/low-signal
  crops, or obvious label-specific crop weaknesses;
- whether the evidence points to vocabulary choice, crop/region extraction,
  split/signer generalization, or product-scope/fallback work as the next
  bounded lane.

5. Write a tracked receipt:

`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`

The receipt must include:

- exact input artifacts and their hashes;
- exact commands;
- deterministic diagnosis tables/summaries;
- explicit statement that no training, fitting, Brev, export, browser claim,
  or final-gate change occurred;
- concrete conclusions;
- exactly one next action.

6. Select exactly one next action:

- `continue_no_training_vocab_or_crop_remediation_design`: only if the
  diagnosis identifies one bounded no-training remediation/design follow-up.
- `continue_product_fallback_scope_design_no_training`: only if the evidence
  points away from more recognizer work and toward fail-closed product scope.
- `stop_for_human_ml_scope_decision`: if any useful next step requires
  training, Brev, paid compute, source approval, manual data/annotation work,
  export, browser activation, or final-gate changes.
- `stop_for_separability_diagnosis_blocker`: if the diagnosis cannot be
  completed safely from existing artifacts.

## Hard Boundaries

- No training run, tiny overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No source import, generated pseudo-labels, SemLex training use, public
  dataset expansion, Detector 0/landmark training revival, broad label run,
  ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3AY prompt and `GOAL.md` names Mission 3AY.
2. The diagnosis references the M3AW smoke receipt, M3AX tiny-overfit receipt,
   and post-M3AW API memo.
3. The diagnosis uses existing manifests/tensors/receipts/reports only, or the
   receipt records a precise blocker.
4. No training/fitting/checkpoint/Brev/source/export/browser/final-gate action
   occurs.
5. A tracked receipt under `docs/validation/` records deterministic evidence,
   conclusions, non-promotion language, and exactly one next action.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded no-training design/remediation or product
  scope prompt.
- STOP if the next action requires any training attempt, Brev auth, paid
  compute, source approval, manual annotation/data collection, export, browser
  activation, or final-gate changes.
- REDIRECT if the executor treats M3AX memorization as held-out success or
  promotion evidence.
- NUDGE if the diagnosis is in scope but needs a narrower no-training question.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AY vocabulary/crop separability diagnosis.
Completed:            <diagnosis, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
