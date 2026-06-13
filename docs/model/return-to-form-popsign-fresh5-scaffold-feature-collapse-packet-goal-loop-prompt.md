# Return-To-Form PopSign Fresh5 Scaffold Feature Collapse Packet Goal Loop Prompt

Mission 3DG prompt for the Codex executor after Mission 3DF selected
`continue_no_training_scaffold_feature_collapse_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, inference-only
feature-collapse packet for the completed M3DD PopSign fresh5 scaffold
checkpoint and repaired manifests.

The goal is to localize the scaffold collapse now proven by M3DF across train,
validation, and test: determine whether the M3DD checkpoint's representation is
already nonseparable before the final classifier, whether LayerNorm/readout
state compresses or changes the signal, and whether any class-label structure
remains in descriptive representation statistics. This mission must not train,
fit, tune, spend Brev, change architecture/input representation, export,
browser-activate, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DF scaffold prediction-confidence packet:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json)
   - [`docs/session-logs/452-mission-3df-popsign-fresh5-scaffold-confidence.md`](../session-logs/452-mission-3df-popsign-fresh5-scaffold-confidence.md)
   - [`output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json`](../../output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json)
4. M3DE scaffold result diagnosis:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json)
   - [`docs/session-logs/450-mission-3de-popsign-fresh5-scaffold-result-diagnosis.md`](../session-logs/450-mission-3de-popsign-fresh5-scaffold-result-diagnosis.md)
5. M3DD scaffold bounded local fit result:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/model_state.pt`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/model_state.pt)
6. M3CT through M3CV prediction-confidence and feature-collapse receipts for
   the previous late-fusion TCN path.
7. M3DA through M3DF scaffold receipts, the repaired manifest contract, and
   train/validation/test manifests.
8. Training/evaluation/model code paths, read-only except for an optional
   no-training diagnostic helper:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/extract_popsign_fresh5_feature_separability.py`](../../scripts/extract_popsign_fresh5_feature_separability.py), if compatible with the scaffold checkpoint
9. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
10. The return-to-form spine and tactical overlay:
    - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DF found the retained M3DD artifacts did not include raw logits, full
per-class probability vectors, or train-split predictions, so it ran a bounded
inference-only extraction against the existing M3DD checkpoint. Train,
validation, and test all collapsed to `morning: 125` top-1 and
`thank_you: 125` top-2. The stable probability/logit order was
`morning > thank_you > who > pen > home` for every split, matching M3CT's
late-fusion ordering. The classifier bias order was
`pen > thank_you > who > home > morning`, so classifier bias alone does not
explain the deterministic `morning` argmax.

M3DF selected `continue_no_training_scaffold_feature_collapse_packet` as the
next smallest useful evidence step. Another fitting run, Brev compute,
architecture/input change, source/manifest/tensor mutation, export readiness,
browser activation, model promotion, product downscope, STOP, strategy
escalation, and human budget/scope/code-path decisions remain unjustified.

## Required Slice

Complete exactly one smallest useful no-training scaffold feature-collapse
packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json >/dev/null
python3 -m json.tool output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json >/dev/null
```

2. Inspect whether existing scaffold diagnostics already contain the needed
   feature spaces. If they do, write the receipt from existing artifacts. If
   not, run only bounded inference-only extraction against the existing M3DD
   `model_state.pt` and repaired train/validation/test manifests. If a helper
   is required, keep it scoped to diagnostic readout, do not fit an optimized
   auxiliary classifier, do not create or update a checkpoint, and record
   py-compile evidence.

3. The packet must answer, with hashes and exact commands:

- whether scaffold collapse is already visible before the final classifier;
- whether any available pre-readout, post-LayerNorm, pooled token, or fused-head
  representation space retains label structure;
- whether train-split feature variance, rank/covariance summaries, centroid
  distances, within-label distances, between/within ratios, and descriptive
  nearest-centroid behavior indicate near-constant features or merely weak
  label signal;
- whether validation/test summaries are used only as diagnostic context;
- whether the scaffold evidence matches, improves on, or differs from the
  M3CU/M3CV late-fusion representation-collapse diagnosis;
- whether the evidence points to a no-training last-layer/parameter packet,
  no-training scaffold architecture/data generalization packet, product
  downscope, strategy escalation, STOP, or a human training-scope/budget/
  code-path decision.

All diagnostics are descriptive statistics only. Do not train, optimize, tune,
fit a classifier, select thresholds for product, or write checkpoints.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- any inference-only diagnostic output path and hash, if one is generated;
- proof that no trained or optimized auxiliary classifier was fitted;
- train-split scaffold representation summaries by feature space;
- validation/test feature summaries only as diagnostic context when available;
- explicit comparison with M3DF and M3CU/M3CV;
- explicit classification of the current strongest explanation;
- whether another fitting run, Brev compute receipt, architecture/input change,
  source/manifest/tensor mutation, export-readiness review, browser activation,
  product downscope, model promotion, STOP, or human decision is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
  manifest/tensor mutation, pretrained dependency, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_no_training_scaffold_feature_collapse_packet`: if the packet is
  incomplete or blocked.
- `continue_no_training_scaffold_last_layer_parameter_packet`: if
  representation evidence is not collapsed enough to explain the logits and
  readout/parameter state still needs no-training review.
- `continue_no_training_scaffold_architecture_data_generalization_packet`: if
  representation collapse appears to be a scaffold architecture/data
  generalization failure that still needs no-training review before scope
  changes.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if the packet
  supports continuing product work only with recognition fail-closed.
- `escalate_post_scaffold_failure_strategy_research_with_local_evidence`: if
  the next meaningful step changes architecture, input representation, or
  training budget and cannot be reduced locally.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained, no-upload,
  browser-viable scratch route remains.

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
  fallback that implies live ASL recognition, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DG prompt and names Mission 3DG.
2. The M3DF, M3DE, and M3DD receipts and the M3DF diagnostic output JSON exist
   and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records whether scaffold collapse is visible before the final
   classifier and summarizes available feature spaces.
5. The receipt records train-split representation-collapse summaries and keeps
   validation/test feature summaries diagnostic-only.
6. The receipt compares scaffold representation evidence with M3DF and
   M3CU/M3CV and names exactly one next action from this prompt.
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
  evidence-backed, no-Brev, fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks representation-collapse summaries, artifact
  hashes, train-vs-context split distinction, M3CU/M3CV comparison,
  no-training/Brev/export/promotion proof, no-auxiliary-classifier proof, or
  exactly one next action.
- REDIRECT if the executor trains, fits an optimized classifier, mutates
  manifests/tensors/source approvals, switches datasets, promotes a model, edits
  claim surfaces, runs a sweep, or performs a second local fit attempt.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, scope, or final-claim approval,
  or if the receipt selects `stop_scratch_recognizer_lane`.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DG PopSign fresh5 scaffold feature-collapse packet.
Completed:            <feature-collapse result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
