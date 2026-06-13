# Return-To-Form PopSign Fresh5 Architecture Data Generalization Failure Packet Goal Loop Prompt

Mission 3CW prompt for the Codex executor after Mission 3CV selected
`continue_no_training_architecture_data_generalization_failure_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training architecture/data
generalization failure packet for the completed M3CR PopSign fresh5 checkpoint,
repaired manifests, and M3CT-M3CV diagnostics.

The goal is to classify the current strongest non-training explanation for the
collapsed PopSign fresh5 representation under the scratch
`scratch_region_temporal_late_fusion_tcn_contract_v1` lane. This mission must
not train, fit, tune, spend Brev, change architecture or input representation,
write implementation code, mutate data, export, browser-activate, or change
final claims. If the next meaningful step would change architecture, input
representation, training budget, compute route, sources, labels, tensors, or
claims, select escalation or STOP rather than drafting that change inside this
mission.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CV feature-collapse representation packet:
   - [`docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json`](../validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json)
   - [`docs/session-logs/432-mission-3cv-popsign-fresh5-representation-collapse.md`](../session-logs/432-mission-3cv-popsign-fresh5-representation-collapse.md)
   - [`output/m3cu-popsign-fresh5-train-split-feature-separability/feature-separability.json`](../../output/m3cu-popsign-fresh5-train-split-feature-separability/feature-separability.json)
4. M3CU train-split logit/feature separability packet:
   - [`docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json`](../validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json)
   - [`docs/session-logs/430-mission-3cu-popsign-fresh5-train-feature-separability.md`](../session-logs/430-mission-3cu-popsign-fresh5-train-feature-separability.md)
5. M3CT prediction confidence/logit distribution packet:
   - [`docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`](../validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json)
   - [`output/m3ct-popsign-fresh5-confidence-logit-distribution/logit-distribution.json`](../../output/m3ct-popsign-fresh5-confidence-logit-distribution/logit-distribution.json)
6. M3CS/M3CR train-all result receipts and retained checkpoint evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json)
   - [`output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt`](../../output/m3cr-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-lr003-20ep-bestval/model_state.pt)
7. Earlier PopSign fresh5 gating receipts, especially M3CK through M3CQ:
   - M3CK architecture/input microprobe
   - M3CL data/split/label distribution audit
   - M3CM split/source/signer quality contract
   - M3CN label/source quality review
   - M3CO tensor/input quality packet
   - M3CP training distribution/sampler packet
   - M3CQ optimizer/loss/regularization packet
8. Training/evaluation/model code paths, read-only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
9. Existing observer/API strategy research and design-review artifacts named in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), if the packet
   would otherwise point toward architecture, input-representation, training
   budget, or compute-route change.
10. The return-to-form spine and tactical overlay:
    - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CR ran the bounded post-contract 20-epoch LR `0.003` local train-all and did
not improve over M3CJ: validation accuracy stayed flat at `0.2`, test top-1
stayed `0.2`, macro F1 stayed `0.06666666666666668`, and validation/test
predictions collapsed to `morning: 125`.

M3CT showed the collapse is not held-out specific. Train, validation, and test
all collapse to `morning: 125` top-1 and `thank_you: 125` top-2, with stable
tiny class-wise ordering `morning > thank_you > who > pen > home`.

M3CU found train-split pre-head features are nonseparable/collapsed before the
classifier head. At `linear_input_post_layernorm`, feature variance mean is
`2.7852715663804345e-8`, between/within centroid ratio is
`0.3116968095914498`, and descriptive nearest-centroid accuracy is `0.224`.

M3CV localized the collapse to the fused head input. Train
`head_input_fused_pre_layernorm` feature variance mean is
`0.00017123778903535984`, between/within centroid ratio is
`0.3368962860376266`, and descriptive nearest-centroid accuracy is `0.176`.
LayerNorm/readout compresses absolute scale further, but does not introduce
the collapse alone and does not restore usable label separability.

Earlier PopSign fresh5 receipts cleared obvious data/split/tensor/sampler/loss
wiring blockers, while M3CK proved the same architecture/input path can
train-fit a deterministic balanced one-clip-per-label microprobe. The current
bounded question is not whether to run another fitting attempt. It is whether
the accumulated local evidence now classifies the failure as a scratch
architecture capacity/optimization/generalization limit, an input
representation/data-quality limitation that still needs no-training review, a
strategy-escalation case, or a human scope/budget/code-path decision.

## Required Slice

Complete exactly one smallest useful no-training architecture/data
generalization failure packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json >/dev/null
```

2. Inspect existing receipts, diagnostic JSON, and model/train/eval code only.
   Do not add a helper unless a read-only local evidence extraction is required
   to finish this packet; if a helper is required, keep it no-training,
   read-only, and record py-compile evidence.

3. The packet must answer, with hashes and exact commands:

- what failure explanations are already ruled out by M3CK-M3CV;
- what explanation remains strongest for the M3CR checkpoint collapse under
  `scratch_region_temporal_late_fusion_tcn_contract_v1`;
- whether the evidence points primarily to scratch architecture capacity,
  optimization/generalization limits, compressed input representation, dataset
  size/diversity, label/source quality, crop/tensor evidence, or inconclusive
  factors;
- whether any existing observer/API strategy memo is current enough for this
  specific PopSign fresh5 representation-collapse evidence;
- whether another fitting run, Brev compute, architecture/input change,
  source/manifest/tensor mutation, export readiness, browser activation, model
  promotion, or human decision is justified now;
- whether the next meaningful action is still a no-training local packet, a
  required strategy escalation, or STOP for human scope/budget/code-path review.

This packet may compare local evidence and code contracts. It may not prototype
an architecture, alter inputs, draft a training recipe as an approved route,
create checkpoints, fit auxiliary classifiers, or run compute.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-architecture-data-generalization-failure-v1.json`

The receipt must include:

- exact artifacts inspected and their hashes;
- a compact evidence matrix from M3CK through M3CV;
- failure explanations ruled out, still plausible, and unsupported;
- explicit classification of the current strongest explanation;
- strategy-memo coverage status for this exact local evidence;
- whether another fitting run, Brev compute receipt, architecture/input change,
  source/manifest/tensor mutation, export-readiness review, browser activation,
  model promotion, or human decision is justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, optimized auxiliary classifier, Brev command/spend/
  lifecycle, source/register mutation, manifest/tensor mutation, pretrained
  dependency, export, browser activation, model-card promotion, final-gate
  change, unsupported claim, implementation-code change, or push occurred;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_architecture_data_generalization_failure_packet`: if
  the packet is incomplete or blocked.
- `continue_no_training_input_representation_or_data_quality_packet`: if the
  evidence points to a no-mutation input/data-quality review before any scope
  change.
- `escalate_strategy_research_with_local_evidence`: if the next meaningful
  step would change architecture, input representation, training budget,
  compute route, or training strategy and there is no current strategy memo
  tied to the M3CR-M3CV local evidence.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, architecture/input, compute, or final
  claim.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, or 75/95
  label training.
- No optimized auxiliary classifier, threshold-tuning route, learned diagnostic
  model, architecture prototype, input-representation change, or implementation
  code change unless only a scoped no-training diagnostic helper is required.
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

1. `GOAL.md` points at this M3CW prompt and names Mission 3CW.
2. The M3CV, M3CU, M3CT, M3CS, M3CR, and key M3CK-M3CQ receipts exist and
   parse, or the session log records the exact missing-artifact blocker.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-architecture-data-generalization-failure-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records a compact evidence matrix of ruled-out and still
   plausible explanations from M3CK through M3CV.
5. The receipt classifies the current strongest explanation without approving
   architecture, input, training, Brev, source, tensor, export, promotion, or
   claim changes.
6. The receipt records whether any current strategy memo covers this exact
   PopSign fresh5 representation-collapse evidence.
7. The receipt proves no training/fitting/checkpoint/optimized auxiliary
   classifier/Brev spend or lifecycle/source mutation/manifest mutation/tensor
   mutation/pretrained dependency/export/browser activation/model-card
   promotion/final-gate action/unsupported claim/push occurred.
8. The receipt names exactly one next action from this prompt.
9. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, no-training,
  evidence-backed, no-Brev, and selects one bounded next action.
- NUDGE if the receipt lacks an evidence matrix, artifact hashes, strategy-memo
  coverage status, no-training/Brev/export/promotion proof, no-implementation
  proof, or exactly one next action.
- REDIRECT if the executor trains, fits, mutates manifests/tensors/source
  approvals, switches datasets, prototypes an architecture/input change,
  promotes a model, edits claim surfaces, runs a sweep, performs a second local
  train-all attempt, or writes implementation code beyond a scoped read-only
  diagnostic helper.
- ESCALATE if the result proposes a training-style, compute, architecture,
  input-representation, or budget step after the repeated failed-learning
  evidence without a current strategy diagnostic tied to M3CR-M3CV local
  evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, or scope
  approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CW PopSign fresh5 architecture/data generalization failure packet.
Completed:            <failure-classification result and receipt>.
Evidence:             <receipt, artifacts, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
