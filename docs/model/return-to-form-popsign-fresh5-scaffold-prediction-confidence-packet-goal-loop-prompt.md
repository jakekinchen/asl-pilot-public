# Return-To-Form PopSign Fresh5 Scaffold Prediction Confidence Packet Goal Loop Prompt

Mission 3DF prompt for the Codex executor after Mission 3DE selected
`continue_no_training_scaffold_prediction_confidence_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, inference-only prediction
confidence packet for the completed M3DD PopSign fresh5 scaffold checkpoint and
repaired manifests.

The goal is to capture the raw-logit or full per-class probability evidence
missing from the M3DD sidecar, compare the scaffold collapse with M3CT, and
decide the next bounded no-training action before any more fitting, Brev
compute, export, browser activation, product recognition claim, or final-claim
change.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DE scaffold result diagnosis:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json)
   - [`docs/session-logs/450-mission-3de-popsign-fresh5-scaffold-result-diagnosis.md`](../session-logs/450-mission-3de-popsign-fresh5-scaffold-result-diagnosis.md)
4. M3DD scaffold bounded local fit result:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json)
   - [`docs/session-logs/448-mission-3dd-popsign-fresh5-bounded-local-fit.md`](../session-logs/448-mission-3dd-popsign-fresh5-bounded-local-fit.md)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json)
   - [`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/model_state.pt`](../../output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/model_state.pt)
5. M3CT through M3CV prediction-confidence and feature-collapse receipts for
   the previous late-fusion TCN path.
6. M3DA through M3DC scaffold/fit-readiness/invocation receipts.
7. Training/evaluation/model code paths, read-only except for an optional
   no-training diagnostic helper:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DE found the M3DD scaffold artifacts are command/artifact/checkpoint
consistent and are not explained by thresholding alone. The selected checkpoint
is epoch `11` under explicit `best_validation`; validation accuracy was flat at
`0.2` for all epochs, final train accuracy was `0.184`, validation/test
top-1 stayed `0.2`, macro F1 stayed `0.06666666666666668`, every validation
and test example predicted top-1 `morning` and top-2 `thank_you`, and
threshold `1.0` accepted no examples.

The M3DD sidecar preserves confidence, top-2 confidence, probability margin,
and entropy summaries, but not raw logits or full per-class probabilities.
M3DE selected `continue_no_training_scaffold_prediction_confidence_packet` as
the next smallest useful evidence step. Another fitting run, Brev compute,
export, browser activation, model-card promotion, active-label promotion,
source/manifest/tensor mutation, final-gate change, product recognition claim,
and push remain unjustified.

## Required Slice

Complete exactly one smallest useful no-training prediction-confidence packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json >/dev/null
python3 -m json.tool output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json >/dev/null
```

2. Inspect whether retained M3DD artifacts already contain raw logits or full
   per-class probability vectors. If they do, use them. If they do not, run
   only a bounded inference-only extraction against the existing M3DD
   `model_state.pt` and repaired train/validation/test manifests. If a helper
   is required, keep it scoped to diagnostic readout, do not create or update a
   checkpoint, and record py-compile evidence.

3. The packet must answer, with hashes and exact commands:

- whether train-split predictions also collapse to the same top-1/top-2
  ranking, or whether collapse appears only on held-out splits;
- per split and per true label: top-1 distribution, top-2 distribution,
  confidence min/max/mean/std, entropy min/max/mean/std, probability margin
  min/max/mean/std, and raw-logit span/mean/std when available;
- full per-class probability or logit ordering for all five labels, summarized
  without dumping large arrays into tracked docs;
- whether the deterministic `morning` argmax is explained by a stable tiny
  class-wise offset, split-specific behavior, reporting/evaluation extraction,
  model parameter state such as classifier bias/readout shape, or remains
  inconclusive;
- whether threshold calibration remains downstream after direct logit/
  probability inspection;
- how this scaffold-specific evidence compares with the M3CT late-fusion
  ordering `morning > thank_you > who > pen > home`;
- whether current evidence supports a no-training scaffold feature-collapse
  packet, a no-training last-layer/parameter packet, product downscope, strategy
  escalation, STOP, or a human training-scope/budget/code-path decision.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- any inference-only diagnostic output path and hash, if one is generated;
- proof that retained artifacts did or did not already include raw logits/full
  per-class probability vectors;
- train/validation/test confidence, entropy, margin, top-1/top-2, per-class
  probability, and raw-logit summaries when available;
- explicit comparison with the M3DE diagnosis and M3CT late-fusion packet;
- whether another fitting run, Brev compute receipt, architecture/input change,
  source/manifest/tensor mutation, export-readiness review, browser activation,
  product downscope, model promotion, STOP, or human decision is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
  manifest/tensor mutation, pretrained dependency, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_no_training_scaffold_prediction_confidence_packet`: if the packet
  is incomplete or blocked.
- `continue_no_training_scaffold_feature_collapse_packet`: if the scaffold
  train split also collapses and the next local evidence gap is
  representation/feature localization for this checkpoint.
- `continue_no_training_scaffold_last_layer_parameter_packet`: if direct
  distributions point toward classifier readout, bias, parameter state, or
  update-path review without approving training.
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

1. `GOAL.md` points at this M3DF prompt and names Mission 3DF.
2. The M3DE and M3DD receipts and the M3DD provenance/report/sidecar JSON
   artifacts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records whether retained artifacts include raw logits/full
   per-class probabilities and, if not, records any bounded inference-only
   extraction path used to obtain them.
5. The receipt covers train/validation/test distribution behavior and directly
   states whether train also collapses or whether collapse is held-out specific.
6. The receipt compares the scaffold result with M3DE and M3CT and names
   exactly one next action from this prompt.
7. The receipt proves no training/fitting/checkpoint/Brev spend or lifecycle/
   source mutation/manifest mutation/tensor mutation/export/browser activation/
   model-card promotion/final-gate action occurred.
8. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, inference-only,
  evidence-backed, no-Brev, fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks split-level confidence/logit/probability
  summaries, artifact hashes, train-vs-held-out comparison, M3CT comparison,
  threshold downstream check, no-training/Brev/export/promotion proof, or
  exactly one next action.
- REDIRECT if the executor trains, mutates manifests/tensors/source approvals,
  switches datasets, promotes a model, edits claim surfaces, runs a sweep, or
  performs a second local fit attempt.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, scope, or final-claim approval,
  or if the receipt selects `stop_scratch_recognizer_lane`.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DF PopSign fresh5 scaffold prediction confidence packet.
Completed:            <prediction-confidence result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
