# Return-To-Form PopSign Fresh5 Scaffold Local Fit Result Diagnosis Goal Loop Prompt

Mission 3DE prompt for the Codex executor after Mission 3DD selected
`continue_no_training_local_fit_result_diagnosis_after_scaffold`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-mutation diagnosis of the
completed M3DD PopSign fresh5 scaffold fit result.

The goal is to explain the failed `scratch_motion_region_token_temporal_contract_v1`
bounded local fit from existing receipts, output artifacts, and code paths
before any further fitting, Brev compute, export, browser activation, product
recognition claim, or final-claim change.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DD bounded local fit result:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json)
   - [`docs/session-logs/448-mission-3dd-popsign-fresh5-bounded-local-fit.md`](../session-logs/448-mission-3dd-popsign-fresh5-bounded-local-fit.md)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json)
4. M3DC invocation/output guard fix:
   - [`docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`](../validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json)
5. M3DB fit-readiness review and M3DA scaffold receipt.
6. M3CJ/M3CR baselines and M3CS-M3CV collapse diagnostics.
7. Observer 435 strategy memo and M3CX-M3CY-M3CZ design/contract receipts.
8. Training/evaluation code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
9. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
10. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DD completed the single authorized local MPS fit/evaluation attempt for
`scratch_motion_region_token_temporal_contract_v1`. It used repaired PopSign
fresh5 train/validation/test manifests, AdamW, learning rate `0.001`, no
augmentation, 12 epochs, full 32 train/validation batches, explicit
`best_validation` checkpoint selection, and the ignored M3DC output directory.

The result did not beat M3CJ/M3CR: validation accuracy stayed flat at `0.2`,
test top-1 stayed `0.2`, macro F1 stayed `0.06666666666666668`, validation and
test predictions collapsed to `morning: 125`, top-2 collapsed to
`thank_you: 125`, and recall was zero for `home`, `pen`, `thank_you`, and
`who`. Brev compute, export, browser activation, model-card promotion,
active-label promotion, final-gate changes, and another fitting attempt remain
unjustified.

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
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json >/dev/null
```

2. Diagnose the completed M3DD result without fitting. Use structured reads of
   JSON artifacts and code paths where practical. The packet must cover:

- train and validation metric trajectory;
- selected checkpoint epoch versus final epoch;
- validation/test prediction distribution, top-2 distribution, confusion
  matrix, and per-label recall;
- threshold-selection behavior and whether calibration is downstream of top-1
  collapse;
- whether the output artifacts match the recorded command, manifests, seed,
  model id, architecture, checkpoint-selection policy, and artifact hashes;
- whether current evidence points most strongly to reporting/artifact mismatch,
  train/eval/checkpoint issue, logits/confidence collapse, data/split/source
  generalization failure, architecture/input limitation, or a code-path review
  need;
- how the M3DD result changes or confirms the M3CS-M3CV diagnosis from the
  previous late-fusion TCN path.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- source-supported observations separated from inference;
- diagnosis of metric trajectory, checkpoint selection, prediction
  distribution, top-2 distribution, per-label recall, threshold behavior,
  M3CJ/M3CR comparison, and M3CS-M3CV comparison;
- whether another fitting run, Brev compute receipt, export-readiness review,
  source/manifest/tensor mutation, browser activation, product downscope, STOP,
  or human training-scope/budget/code-path/source/label/tensor/final-claim
  review is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
  manifest/tensor mutation, pretrained dependency, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one selected next action.

4. Select exactly one next action:

- `continue_no_training_local_fit_result_diagnosis_after_scaffold`: if the
  diagnosis is incomplete or blocked.
- `continue_no_training_scaffold_prediction_confidence_packet`: if current
  artifacts show logits/confidence/probability or calibration behavior must be
  diagnosed before any more fitting.
- `continue_no_training_scaffold_feature_collapse_packet`: if current evidence
  requires inference-only feature/representation diagnostics for the M3DD
  checkpoint before strategy or STOP.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if the diagnosis
  supports continuing product work only with recognition fail-closed.
- `escalate_post_scaffold_failure_strategy_research_with_local_evidence`: if
  the next meaningful decision is architecture/input/training-budget strategy
  after the failed M3DD run and cannot be reduced locally.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained, no-upload,
  browser-viable scratch route remains.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, or 75/95
  label training.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  generated pseudo-label mutation, or source approval edit.
- No pretrained detector, landmark, backbone, embedding, model dependency,
  generated-label dependency, or pretrained-assisted data labeling.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback that implies live ASL recognition, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DE prompt and names Mission 3DE.
2. The M3DD receipt and M3DD output JSON artifacts parse, along with M3DC,
   M3DB, and M3DA receipts.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records artifact hashes, metric trajectory, checkpoint
   selection, prediction distribution, top-2 distribution, per-label recall,
   threshold behavior, M3CJ/M3CR comparison, and M3CS-M3CV comparison.
5. The receipt directly states whether another fitting run, Brev compute,
   export-readiness review, no-training follow-up, product downscope, STOP, or
   human decision is justified.
6. No training/fitting/checkpoint/Brev/source/manifest/tensor/export/browser
   activation/model-card promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE if the diagnosis is bounded, no-training, evidence-backed, no-Brev,
  fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, checkpoint comparison,
  prediction distribution, top-2 distribution, per-label recall, threshold
  behavior, M3CJ/M3CR comparison, M3CS-M3CV comparison, fail-closed proof, or
  Brev/export/promotion boundaries.
- REDIRECT if the executor trains, mutates manifests/tensors/source approvals,
  switches datasets, promotes a model, edits claim surfaces, runs a sweep, or
  performs a second local fit attempt.
- ESCALATE if the result proposes another training-style, compute, architecture,
  input-representation, or budget step after the repeated failed learning
  evidence without reducing it locally and without using current strategy
  evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, scope, or final-claim approval, or
  if the receipt selects `stop_scratch_recognizer_lane`.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DE PopSign fresh5 scaffold local fit result diagnosis.
Completed:            <diagnosis result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
