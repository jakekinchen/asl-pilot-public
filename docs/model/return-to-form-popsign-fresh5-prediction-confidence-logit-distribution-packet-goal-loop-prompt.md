# Return-To-Form PopSign Fresh5 Prediction Confidence Logit Distribution Packet Goal Loop Prompt

Mission 3CT prompt for the Codex executor after Mission 3CS selected
`continue_no_training_prediction_confidence_logit_distribution_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, inference-only prediction
confidence/logit distribution packet for the completed M3CR PopSign fresh5
checkpoint and repaired manifests.

The goal is to explain the near-uniform, low-margin `morning` argmax collapse
more directly before any more fitting, Brev compute, architecture/input change,
export, browser activation, or final claim change.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CS local train-all result diagnosis:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json)
   - [`docs/session-logs/426-mission-3cs-popsign-fresh5-local-train-all-result-diagnosis.md`](../session-logs/426-mission-3cs-popsign-fresh5-local-train-all-result-diagnosis.md)
4. M3CR bounded local train-all result:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json)
   - [`docs/session-logs/424-mission-3cr-popsign-fresh5-post-contract-train-all.md`](../session-logs/424-mission-3cr-popsign-fresh5-post-contract-train-all.md)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt)
5. M3CQ/M3CP/M3CO/M3CN/M3CJ/M3CK/M3CL/M3CM receipts and repaired manifest
   contract named in the M3CS receipt.
6. Training/evaluation/model code paths, read-only except for an optional
   no-training diagnostic helper:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Existing observer/API strategy research and design-review artifacts named in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), if the
   packet would otherwise point toward architecture, input-representation, or
   training-budget change.
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CS found no artifact, command, checkpoint-selection, manifest, region-axis, or
threshold-calibration root cause for the M3CR failure. The strongest current
signal is probability collapse: validation and test predictions are all
`morning`, top-2 is all `thank_you`, max confidence is about `0.21009`, entropy
is within about `0.00138` of `ln(5)`, and mean top-1/top-2 margin is about
`0.0026`.

The existing M3CR JSON artifacts preserve confidence summaries but do not retain
raw logits or full per-class probability vectors. This mission is only the next
bounded no-training evidence step. It does not authorize another fitting run,
Brev spend, architecture change, input-representation change, data-source
change, export, browser activation, model-card promotion, or final-claim change.

## Required Slice

Complete exactly one smallest useful no-training prediction confidence/logit
distribution packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/training-provenance.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/validation-report.json >/dev/null
python3 -m json.tool output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/prediction-sidecar.json >/dev/null
```

2. Inspect whether retained M3CR artifacts already contain raw logits or full
   per-class probability vectors. If they do, use them. If they do not, run only
   a bounded inference-only extraction against the existing M3CR `model_state.pt`
   and repaired train/validation/test manifests. If a helper is required, keep
   it scoped to diagnostic readout and record py-compile evidence.

3. The packet must answer, with hashes and exact commands:

- whether train-split predictions also collapse to the same near-uniform
  top-1/top-2 ranking, or whether collapse appears only on held-out splits;
- per split and per true label: top-1 distribution, top-2 distribution,
  confidence min/max/mean/std, entropy min/max/mean/std, probability margin
  min/max/mean/std, and any raw-logit span/mean/std that is available;
- full per-class probability or logit ordering for all five labels, summarized
  without dumping large arrays into tracked docs;
- whether the deterministic `morning` argmax is explained by a stable tiny
  class-wise offset, by split-specific behavior, by reporting/evaluation
  extraction, by model parameter state such as classifier bias/readout shape, or
  remains inconclusive;
- whether threshold calibration remains downstream after the direct logit/
  probability inspection;
- whether current evidence supports a next no-training train-split separability
  packet, a no-training last-layer/parameter packet, a no-training
  architecture/data-generalization packet, an escalation for strategy research,
  or a human training-scope/budget/code-path decision.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- any inference-only diagnostic output path and hash, if one is generated;
- proof that retained artifacts did or did not already include raw logits/full
  per-class vectors;
- train/validation/test confidence, entropy, margin, top-1/top-2, and raw-logit
  summaries when available;
- explicit classification of the current strongest explanation;
- whether another fitting run, Brev compute receipt, architecture/input change,
  source/manifest/tensor mutation, export-readiness review, browser activation,
  model promotion, or human decision is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
  manifest/tensor mutation, pretrained dependency, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_prediction_confidence_logit_distribution_packet`: if
  the packet is incomplete or blocked.
- `continue_no_training_train_split_logit_or_feature_separability_packet`: if
  train-split logits/probabilities also need no-training separability or feature
  review before any fitting decision.
- `continue_no_training_last_layer_bias_parameter_packet`: if the direct
  distributions point toward classifier readout, bias, parameter state, or
  update-path review without approving training.
- `continue_no_training_architecture_data_generalization_failure_packet`: if
  direct logits/probabilities support a model/data generalization failure that
  still needs no-training review before any scope change.
- `escalate_strategy_research_with_local_evidence`: if the next meaningful
  step would change architecture, input representation, or training budget and
  the current local evidence is not already covered by a current strategy memo.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, or 75/95
  label training.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, file copy, or remote planning beyond optional read-only visibility.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  media download, generated pseudo-label, or source approval mutation.
- No pretrained detector, landmark, backbone, embedding, model dependency, or
  generated-label dependency.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CT prompt and names Mission 3CT.
2. The M3CS and M3CR receipts and the M3CR provenance/report/sidecar JSON
   artifacts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records whether retained artifacts include raw logits/full
   per-class probabilities and, if not, records any bounded inference-only
   extraction path used to obtain them.
5. The receipt covers train/validation/test distribution behavior and directly
   states whether train also collapses or whether collapse is held-out specific.
6. The receipt classifies the strongest current explanation and names exactly
   one next action from this prompt.
7. The receipt proves no training/fitting/checkpoint/Brev spend or lifecycle/
   source mutation/manifest mutation/tensor mutation/export/browser activation/
   model-card promotion/final-gate action occurred.
8. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, inference-only,
  evidence-backed, no-Brev, and selects one bounded next action.
- NUDGE if the receipt lacks split-level confidence/logit/probability
  summaries, artifact hashes, train-vs-held-out comparison, threshold
  downstream check, no-training/Brev/export/promotion proof, or exactly one
  next action.
- REDIRECT if the executor trains, mutates manifests/tensors/source approvals,
  switches datasets, promotes a model, edits claim surfaces, runs a sweep, or
  performs a second local train-all attempt.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CT PopSign fresh5 prediction confidence/logit distribution packet.
Completed:            <distribution/logit result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
