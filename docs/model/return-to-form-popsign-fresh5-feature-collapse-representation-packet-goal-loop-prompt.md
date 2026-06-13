# Return-To-Form PopSign Fresh5 Feature Collapse Representation Packet Goal Loop Prompt

Mission 3CV prompt for the Codex executor after Mission 3CU selected
`continue_no_training_feature_collapse_representation_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training feature-collapse /
representation packet for the completed M3CR PopSign fresh5 checkpoint and
repaired manifests.

The goal is to localize the collapse that M3CU found before the classifier
head: determine whether the frozen checkpoint's representation is already
nearly constant at the fused head input, whether LayerNorm/readout state makes
the collapse worse, and whether any class-label signal remains in descriptive
representation statistics. This mission must not train, fit, tune, spend Brev,
change architecture/input representation, export, browser-activate, or change
final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CU train-split logit/feature separability packet:
   - [`docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json`](../validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json)
   - [`docs/session-logs/430-mission-3cu-popsign-fresh5-train-feature-separability.md`](../session-logs/430-mission-3cu-popsign-fresh5-train-feature-separability.md)
   - [`scripts/extract_popsign_fresh5_feature_separability.py`](../../scripts/extract_popsign_fresh5_feature_separability.py)
   - [`output/m3cu-popsign-fresh5-train-split-feature-separability/feature-separability.json`](../../output/m3cu-popsign-fresh5-train-split-feature-separability/feature-separability.json)
4. M3CT prediction confidence/logit distribution packet:
   - [`docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`](../validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json)
   - [`output/m3ct-popsign-fresh5-confidence-logit-distribution/logit-distribution.json`](../../output/m3ct-popsign-fresh5-confidence-logit-distribution/logit-distribution.json)
5. M3CS/M3CR result receipts and the completed M3CR checkpoint:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt)
6. M3CQ/M3CP/M3CO/M3CN/M3CJ/M3CK/M3CL/M3CM receipts and repaired manifest
   contract named in the M3CU receipt.
7. Training/evaluation/model code paths, read-only except for an optional
   no-training diagnostic helper:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
8. Existing observer/API strategy research and design-review artifacts named in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), if the packet
   would otherwise point toward architecture, input-representation, or
   training-budget change.
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CU found that the existing M3CR checkpoint's train features are not separable
before the classifier head. The train split still predicts `morning: 125`
top-1 and `thank_you: 125` top-2. At `linear_input_post_layernorm`, feature
dimension variance mean is `2.7852715663804345e-8`, mean between-label centroid
distance is `0.0005708143216907047`, mean within-label distance is
`0.0018313126863213256`, the between/within ratio is
`0.3116968095914498`, and descriptive leave-one-out nearest-centroid accuracy
is `0.224`. Validation/test feature summaries were recorded as diagnostic
context only.

The next bounded question is whether the representation collapse is already
present at the fused head input, whether it is introduced or amplified between
the fused head input and the linear readout, and whether the evidence points to
a no-training architecture/data generalization failure packet or strategy
escalation before any further fitting or compute route.

## Required Slice

Complete exactly one smallest useful no-training feature-collapse /
representation packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json >/dev/null
python3 -m json.tool output/m3cu-popsign-fresh5-train-split-feature-separability/feature-separability.json >/dev/null
```

2. Inspect the M3CU diagnostic output first. If it is sufficient, write the
   receipt from existing artifacts without adding a helper. If more localization
   is required, run only bounded inference-only extraction against the existing
   M3CR `model_state.pt` and repaired manifests. If a helper is required, keep
   it scoped to diagnostic readout and record py-compile evidence.

3. The packet must answer, with hashes and exact commands:

- whether collapse is already visible at `head_input_fused_pre_layernorm`;
- whether `linear_input_post_layernorm` reduces, preserves, or amplifies
  label separability relative to the fused head input;
- whether train-split feature variance, rank/covariance summaries, centroid
  distances, within-label distances, and descriptive nearest-centroid behavior
  indicate near-constant features or merely weak label signal;
- whether validation/test summaries were used only as diagnostic context;
- whether the evidence still supports feature-collapse/representation failure,
  or instead points to a last-layer/parameter-state issue, no-training
  architecture/data generalization packet, strategy escalation, or human
  training-scope/budget/code-path decision.

All diagnostics are descriptive statistics only. Do not train, optimize, tune,
fit a classifier, select thresholds for product, or write checkpoints.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- any inference-only diagnostic output path and hash, if one is generated;
- proof that no trained or optimized auxiliary classifier was fitted;
- train-split representation-collapse summaries by feature space;
- validation/test feature summaries only as diagnostic context when available;
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

- `continue_no_training_feature_collapse_representation_packet`: if the packet
  is incomplete or blocked.
- `continue_no_training_last_layer_or_parameter_state_packet`: if
  representation evidence is not collapsed enough to explain the logits and the
  readout/parameter state still needs no-training review.
- `continue_no_training_architecture_data_generalization_failure_packet`: if
  representation collapse appears to be a model/data generalization failure
  that still needs no-training review before scope changes.
- `escalate_strategy_research_with_local_evidence`: if the next meaningful
  step would change architecture, input representation, training budget, or
  compute route and the current local evidence is not already covered by a
  current strategy memo.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, or 75/95
  label training.
- No optimized auxiliary classifier, threshold-tuning route, or learned
  diagnostic model.
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

1. `GOAL.md` points at this M3CV prompt and names Mission 3CV.
2. The M3CU and M3CT receipts and diagnostic output JSON files exist and parse,
   or the session log records the exact missing-artifact blocker.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records train-split representation-collapse summaries and
   classifies whether collapse is already present at fused head input, introduced
   by the head/readout boundary, or inconclusive.
5. The receipt records whether any validation/test feature summaries were used
   and keeps them diagnostic-only.
6. The receipt classifies the strongest current explanation and names exactly
   one next action from this prompt.
7. The receipt proves no training/fitting/checkpoint/optimized auxiliary
   classifier/Brev spend or lifecycle/source mutation/manifest mutation/tensor
   mutation/export/browser activation/model-card promotion/final-gate action
   occurred.
8. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, inference-only,
  evidence-backed, no-Brev, and selects one bounded next action.
- NUDGE if the receipt lacks representation-collapse summaries, artifact
  hashes, train-vs-context split distinction, no-training/Brev/export/promotion
  proof, no-auxiliary-classifier proof, or exactly one next action.
- REDIRECT if the executor trains, fits an optimized classifier, mutates
  manifests/tensors/source approvals, switches datasets, promotes a model, edits
  claim surfaces, runs a sweep, or performs a second local train-all attempt.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CV PopSign fresh5 feature-collapse representation packet.
Completed:            <representation-collapse result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
