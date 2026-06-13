# Return-To-Form PopSign Fresh5 Local Train-All Result Diagnosis Goal Loop Prompt

Mission 3CS prompt for the Codex executor after Mission 3CR selected
`continue_no_training_local_train_all_result_diagnosis`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-mutation diagnosis of the
completed M3CR PopSign fresh5 train-all result.

The goal is to explain the failed post-contract 20-epoch LR `0.003`
best-validation result from existing receipts, output artifacts, and code paths
before any further fitting, Brev compute, export, browser activation, or final
claim change.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CR bounded local train-all result:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json)
   - [`docs/session-logs/424-mission-3cr-popsign-fresh5-post-contract-train-all.md`](../session-logs/424-mission-3cr-popsign-fresh5-post-contract-train-all.md)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json)
4. M3CQ optimizer/loss/regularization packet:
   - [`docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`](../validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json)
5. M3CP, M3CO, M3CN, M3CJ, M3CK, M3CL, M3CM, and repaired-manifest evidence
   named in the M3CR receipt.
6. Training/evaluation code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CR completed the predeclared post-contract local/no-spend train-all on MPS.
It used repaired PopSign fresh5 train/validation/test manifests, the scratch
region-temporal late-fusion TCN, learning rate `0.003`, AdamW, no augmentation,
20 epochs, full 32 train and validation batches, and explicit
`best_validation` checkpoint selection.

The result did not beat M3CJ: validation accuracy stayed flat at `0.2` for all
20 epochs, final train accuracy was `0.176`, test top-1 stayed `0.2`, test
macro F1 stayed `0.06666666666666668`, validation and test predictions
collapsed to `morning: 125`, and test recall was zero for `home`, `pen`,
`thank_you`, and `who`. Brev compute, export, browser activation, model-card
promotion, final-gate changes, and another fitting attempt remain unjustified.

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
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json >/dev/null
```

2. Diagnose the completed M3CR result without fitting. Use structured reads of
   JSON artifacts and code paths where practical. The packet must cover:

- train, validation, and test metric trajectory;
- selected checkpoint epoch and final epoch comparison;
- validation/test prediction distribution and per-label recall;
- logits/confidence/probability behavior when available from sidecars or
  reports;
- threshold-selection behavior and whether calibration is downstream of
  top-1 collapse;
- whether the output artifacts match the recorded command, manifests, seed,
  model id, architecture, checkpoint-selection policy, and artifact hashes;
- whether current evidence points most strongly to reporting/artifact mismatch,
  train/eval/checkpoint issue, logits/confidence collapse, data/split/source
  generalization failure, architecture/input limitation, or a code-path review
  need.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- diagnosis of metric trajectory, checkpoint selection, prediction
  distribution, per-label recall, threshold behavior, and M3CJ comparison;
- whether another fitting run, Brev compute receipt, export-readiness review,
  source/manifest/tensor mutation, or browser activation is justified now;
- whether human training-scope, budget, code-path, source, label, tensor, or
  final-claim review is required now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
  manifest/tensor mutation, pretrained dependency, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one next action.

4. Select exactly one next action:

- `continue_no_training_local_train_all_result_diagnosis`: if the diagnosis is
  incomplete or blocked.
- `continue_no_training_prediction_confidence_logit_distribution_packet`: if
  current artifacts show logits/confidence/probability or calibration behavior
  must be diagnosed before any more fitting.
- `continue_no_training_train_eval_artifact_reconciliation_packet`: if the
  selected checkpoint, output artifact, provenance, or evaluator-reporting
  contract is inconsistent.
- `continue_no_training_architecture_data_generalization_failure_packet`: if
  existing evidence points to a model/data generalization failure that still
  needs no-training review before scope changes.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, or 75/95
  label training.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  or generated pseudo-label mutation.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CS prompt and names Mission 3CS.
2. The M3CR receipt, M3CR output JSON artifacts, M3CQ receipt, M3CP/M3CO/M3CN/
   M3CJ/M3CK prerequisite receipts, and repaired manifest contract parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`.
4. The receipt records artifact hashes, metric trajectory, checkpoint
   selection, prediction distribution, per-label recall, threshold behavior,
   and M3CJ comparison.
5. The receipt directly states whether another fitting run, Brev compute,
   export-readiness review, no-training follow-up, or human decision is
   justified.
6. No training/fitting/checkpoint/Brev/source/manifest/tensor/export/browser
   activation/model-card promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE if the diagnosis is bounded, no-training, evidence-backed, no-Brev,
  and selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, checkpoint comparison,
  prediction distribution, per-label recall, threshold behavior, M3CJ
  comparison, or Brev/export/promotion boundaries.
- REDIRECT if the executor trains, mutates manifests/tensors/source approvals,
  switches datasets, promotes a model, edits claim surfaces, runs a sweep, or
  performs a second local train-all attempt.
- ESCALATE if the result proposes another training-style, compute, architecture,
  input-representation, or budget step after the repeated failed learning
  evidence without a current research diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CS PopSign fresh5 local train-all result diagnosis.
Completed:            <diagnosis result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
