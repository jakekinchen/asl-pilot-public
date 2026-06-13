# Return-To-Form PopSign Fresh5 Scaffold Architecture/Data Generalization Packet Goal Loop Prompt

Mission 3DH prompt for the Codex executor after Mission 3DG selected
`continue_no_training_scaffold_architecture_data_generalization_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-implementation scaffold
architecture/data generalization packet for the completed M3DD PopSign fresh5
scaffold checkpoint and the M3DF-M3DG diagnostics.

The goal is to classify what the scaffold collapse now rules out, what remains
plausible under the current scratch architecture/input/data envelope, and
whether the next meaningful step is still a local no-training packet, strategy
escalation, product downscope, STOP, or a human scope/budget/code-path
decision. This mission must not train, fit, tune, spend Brev, change
architecture or input representation, write implementation code, mutate data,
export, browser-activate, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DG scaffold feature-collapse packet:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json)
   - [`docs/session-logs/454-mission-3dg-popsign-fresh5-scaffold-feature-collapse.md`](../session-logs/454-mission-3dg-popsign-fresh5-scaffold-feature-collapse.md)
   - [`output/m3dg-popsign-fresh5-scaffold-feature-collapse/feature-separability.json`](../../output/m3dg-popsign-fresh5-scaffold-feature-collapse/feature-separability.json)
4. M3DF scaffold prediction-confidence packet:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json)
   - [`docs/session-logs/452-mission-3df-popsign-fresh5-scaffold-confidence.md`](../session-logs/452-mission-3df-popsign-fresh5-scaffold-confidence.md)
   - [`output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json`](../../output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json)
5. M3DD-M3DE scaffold fit/result diagnosis:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json)
6. M3DA-M3DC scaffold contract/readiness/invocation evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`](../validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json)
7. Earlier late-fusion collapse and strategy/downscope evidence, especially
   M3CU, M3CV, M3CW, observer 435, M3CX, M3CY, and M3CZ.
8. Training/evaluation/model code paths, read-only only if needed:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/extract_popsign_fresh5_feature_separability.py`](../../scripts/extract_popsign_fresh5_feature_separability.py)
9. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
10. The return-to-form spine and tactical overlay:
    - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DG ran a bounded inference-only extraction against the existing M3DD scaffold
checkpoint because existing scaffold diagnostics did not include the required
feature spaces. The diagnostic output hash is
`b6d9b3be8cae75106e40f675d3184b0cce9a3c07c8de81e15779938df18348b5`.

M3DG found scaffold collapse is already visible before the final classifier.
At train `post_norm_head_input`, feature-dimension variance mean is
`3.3134213325565313e-7`, covariance trace is
`0.00004241179340169765`, between/within centroid ratio is
`0.352565828783245`, and descriptive leave-one-out nearest-centroid accuracy is
`0.216`, while logits remain collapsed to `morning: 125` top-1 and
`thank_you: 125` top-2.

Earlier scaffold feature spaces retain more absolute variance, but still do
not retain usable class-label structure: train nearest-centroid accuracy is
near chance across token/pre-pool/pooled spaces, and between-label centroids are
closer than within-label spread. M3DG therefore concluded a last-layer-only
packet is not the next best step.

M3DF proved train, validation, and test all collapse to `morning: 125` top-1
and `thank_you: 125` top-2, with stable probability/logit ordering
`morning > thank_you > who > pen > home`. Classifier bias alone does not
explain the deterministic `morning` argmax.

M3DD completed the single authorized local/no-spend scaffold fit and failed to
improve over prior PopSign fresh5 attempts: validation/test top-1 stayed
`0.2`, macro F1 stayed `0.06666666666666668`, predictions collapsed to
`morning: 125`, and four of five labels had zero recall. M3DE found no visible
artifact/reporting, checkpoint-selection, or threshold-only explanation.

The revised scaffold was itself justified by observer 435 and M3CX-M3CZ after
the prior late-fusion path reached the same qualitative representation-collapse
failure. M3DH must decide whether that prior strategy evidence is current
enough for the M3DD-M3DG scaffold failure, or whether the next action requires
fresh strategy escalation, downscope, STOP, or human decision.

## Required Slice

Complete exactly one smallest useful no-training scaffold architecture/data
generalization packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json >/dev/null
python3 -m json.tool output/m3dg-popsign-fresh5-scaffold-feature-collapse/feature-separability.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json >/dev/null
python3 -m json.tool output/m3df-popsign-fresh5-scaffold-confidence-logit-distribution/logit-distribution.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json >/dev/null
```

2. Inspect existing receipts, ignored diagnostic JSON, prompts, strategy memos,
   and code contracts read-only. Do not add or edit implementation code, do not
   add a diagnostic helper, and do not run new extraction unless the session
   log records a missing-artifact blocker and the observer later authorizes a
   redirected prompt.

3. The packet must answer, with hashes and exact commands:

- what scaffold failure explanations are already ruled out by M3DA-M3DG;
- what explanations remain plausible for the M3DD checkpoint collapse under
  `scratch_motion_region_token_temporal_contract_v1`;
- whether the evidence points primarily to architecture capacity/inductive
  bias, optimization/generalization, derived-motion/input representation signal
  sufficiency, dataset size/diversity, split/source/label/tensor quality, or an
  inconclusive mixture;
- whether prior strategy artifacts, especially observer 435 and M3CX-M3CZ, are
  current enough for the M3DD-M3DG scaffold evidence;
- whether another fitting run, Brev compute, architecture/input change,
  source/manifest/tensor mutation, export readiness, browser activation, model
  promotion, product downscope, STOP, or human decision is justified now;
- whether the next meaningful action is a local no-training packet, required
  strategy escalation, product downscope, STOP, or human scope/budget/code-path
  review.

This packet may compare existing local evidence and code contracts. It may not
prototype an architecture, alter inputs, draft a training recipe as an approved
route, create checkpoints, fit auxiliary classifiers, run compute, or change
claim surfaces.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-scaffold-architecture-data-generalization-packet-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- a compact evidence matrix from M3DA through M3DG, with relevant M3CU-M3CW and
  observer 435/M3CX-M3CZ context;
- failure explanations ruled out, still plausible, and unsupported;
- explicit classification of the current strongest explanation;
- strategy-memo coverage status for this exact scaffold evidence;
- whether another fitting run, Brev compute receipt, architecture/input change,
  source/manifest/tensor mutation, export-readiness review, browser activation,
  product downscope, model promotion, STOP, or human decision is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, optimized auxiliary classifier, Brev command/spend/
  lifecycle, source/register mutation, manifest/tensor mutation, pretrained
  dependency, implementation-code change, export, browser activation,
  model-card promotion, final-gate change, unsupported claim, or push occurred;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_no_training_scaffold_architecture_data_generalization_packet`: if
  the packet is incomplete or blocked.
- `continue_no_training_scaffold_input_representation_or_data_quality_packet`:
  if the evidence points to a no-mutation input/data-quality review before any
  strategy or scope change.
- `escalate_post_scaffold_failure_strategy_research_with_local_evidence`: if
  the next meaningful step changes architecture, input representation, training
  strategy, training budget, or compute route and there is no current strategy
  memo tied to the M3DD-M3DG scaffold evidence.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if product work
  should continue with recognition explicitly fail-closed.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, architecture/input, compute, or final
  claim.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained, no-upload,
  browser-viable scratch recognizer route remains.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, 75/95-label
  training, or training-recipe approval.
- No optimized auxiliary classifier, threshold-tuning route, learned diagnostic
  model, architecture prototype, input-representation change, implementation
  code change, or helper-script change.
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

1. `GOAL.md` points at this M3DH prompt and names Mission 3DH.
2. The M3DG receipt/output, M3DF receipt/output, and M3DD-M3DE receipts exist
   and parse, or the session log records the exact missing-artifact blocker.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-scaffold-architecture-data-generalization-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records a compact evidence matrix of ruled-out and still
   plausible explanations from M3DA through M3DG, with relevant prior
   M3CU-M3CW and observer 435/M3CX-M3CZ context.
5. The receipt classifies the current strongest explanation without approving
   architecture, input, training, Brev, source, tensor, export, promotion, or
   claim changes.
6. The receipt records whether any current strategy memo covers this exact
   scaffold evidence.
7. The receipt proves no training/fitting/checkpoint/optimized auxiliary
   classifier/Brev spend or lifecycle/source mutation/manifest mutation/tensor
   mutation/pretrained dependency/implementation change/export/browser
   activation/model-card promotion/final-gate action/unsupported claim/push
   occurred.
8. The receipt names exactly one next action from this prompt.
9. Required audits, receipt JSON validation, and `git diff --check` exit `0`
   or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, no-training,
  evidence-backed, no-Brev, fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks an evidence matrix, artifact hashes,
  strategy-memo coverage status, no-training/Brev/export/promotion proof,
  no-implementation proof, fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor trains, fits, mutates manifests/tensors/source
  approvals, switches datasets, prototypes an architecture/input change,
  promotes a model, edits claim surfaces, runs a sweep, performs another local
  fit attempt, or writes implementation code.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to M3DD-M3DG local
  evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, scope, or
  final-claim approval, or if the receipt selects `stop_scratch_recognizer_lane`.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DH PopSign fresh5 scaffold architecture/data generalization packet.
Completed:            <failure-classification result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
