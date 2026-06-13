# Return-To-Form PopSign Fresh5 Post-Scaffold Strategy/Downscope Decision Goal Loop Prompt

Mission 3DI prompt for the Codex executor after Mission 3DH selected
`escalate_post_scaffold_failure_strategy_research_with_local_evidence` and the
observer completed the post-scaffold API strategy memo.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-implementation
post-scaffold strategy/downscope decision packet for PopSign fresh5.

The goal is to convert the M3DD-M3DH scaffold-collapse evidence and observer
457 API strategy memo into one durable next-route decision. This mission must
not train, fit, tune, run Brev, change architecture or input representation,
write implementation code, mutate data, export, browser-activate, promote a
model, weaken final gates, or change product recognition claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Observer 457 escalation artifacts:
   - [`artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-response.md`](../../artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-response.md)
   - [`artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-prompt.md`](../../artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-prompt.md)
4. M3DH scaffold architecture/data generalization packet:
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-architecture-data-generalization-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-architecture-data-generalization-packet-v1.json)
   - [`docs/session-logs/456-mission-3dh-popsign-fresh5-scaffold-architecture-data-generalization.md`](../session-logs/456-mission-3dh-popsign-fresh5-scaffold-architecture-data-generalization.md)
5. M3DD-M3DG scaffold evidence cited by M3DH:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-local-fit-result-diagnosis-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-prediction-confidence-packet-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json`](../validation/return-to-form-popsign-fresh5-scaffold-feature-collapse-packet-v1.json)
6. M3DA-M3DC scaffold contract/readiness/invocation evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`](../validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json)
7. Earlier observer 435/M3CX-M3CZ strategy, design, and contract evidence.
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DH completed the no-training scaffold architecture/data generalization packet
at commit `308f1a1`. The tracked receipt hash is
`6de47568ec567711dabc0a0c9f24d86f7b357fe87404c0e1f2ac7536b52857b2`.

M3DH classified the strongest current explanation as
`post_scaffold_scratch_architecture_input_optimization_generalization_failure_under_existing_popsign_fresh5_envelope`.
It found that M3DA-M3DG reduce or rule out total scaffold registration/shape/
connectivity failure, invocation/output guard failure, successful scaffold
learning signal, artifact/reporting/checkpoint/threshold-only failure,
classifier-bias-only failure, and last-layer-only/LayerNorm/readout-only
failure.

The remaining plausible axes are scratch architecture capacity or inductive
bias, optimization/generalization under the current scaffold recipe, derived
motion/input signal sufficiency, approved dataset size/diversity, and lower
priority label/source semantic quality beyond mechanical slug review.

Observer 457 used `openai-api-research` and saved a strategy memo under
`artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-*`.
The memo recommends a bounded local/no-spend, no-training, no-implementation
Mission 3DI strategy/downscope decision packet before any further route change.
It explicitly does not authorize fitting, Brev, implementation, source/data
mutation, export, browser activation, model promotion, final-gate weakening,
or product recognition claims.

## Required Slice

Complete exactly one smallest useful post-scaffold strategy/downscope decision
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
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-scaffold-architecture-data-generalization-packet-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-request.json >/dev/null
python3 -m json.tool artifacts/research/observer-457-popsign-fresh5-post-scaffold-strategy-api-raw.json >/dev/null
```

2. Inspect only existing local docs, receipts, ignored diagnostic JSON, claim
   surfaces, and strategy artifacts. Do not add diagnostic helpers or run new
   extraction.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json`

The receipt must include:

- current HEAD and active prompt;
- exact artifacts inspected and hashes where practical;
- source-supported observations from M3DD-M3DH, plus relevant M3CX-M3CZ and
  observer 435/457 context;
- clear separation between source facts, inference, and unsupported claims;
- ruled-out explanations and remaining plausible explanations;
- recognition-track risk assessment under the no-pretrained, no-upload,
  browser-first, fail-closed constraints;
- product downscope options with recognition explicitly fail-closed;
- design-only future strategy options, without implementation or training
  approval;
- compute/source/dataset constraints, including that Brev/GPU use is not
  authorized by this packet;
- browser fail-closed confirmation from `model-card.json` and
  `active-vocabulary-claim.json`;
- explicit negative authorizations for training/fitting, Brev, checkpoint
  creation/update, architecture/input implementation, source expansion/import,
  pseudo-labeling, manifest/tensor/label mutation, export, browser activation,
  model-card promotion, active-label promotion, final-gate weakening,
  product recognition claims, unsupported claims, and push;
- exactly one selected next action.

4. Select exactly one next action:

- `redirect_to_fail_closed_non_recognition_learning_mvp`: if the best
  school-project route is to stop spending executor effort on recognition and
  focus on a useful learning app with no live recognition claims.
- `pause_recognition_until_human_strategy_or_resource_approval`: if continued
  recognition work requires human scope, dataset/legal/source, budget,
  compute, architecture/input, or project-expectation approval.
- `continue_design_only_fresh_architecture_input_strategy_no_implementation`:
  only if one more no-training design packet is useful before any code,
  training, or compute.
- `stop_recognition_track_pending_new_approved_data_or_validated_artifact`: if
  the recognizer lane should be parked until materially new approved evidence,
  data, resources, or a validated artifact exists.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation/update, sweep, retry, new train/eval run, fresh10
  training, 75/95-label training, or training-recipe approval.
- No optimized auxiliary classifier, learned diagnostic model, architecture
  prototype, input-representation change, helper-script change, source-code
  implementation, export readiness route, or product fallback that implies live
  recognition.
- No Brev training, spend, lifecycle change, sync, remote command, teardown,
  file copy, or remote planning beyond optional read-only visibility.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  media download, generated pseudo-label, source approval, dataset approval, or
  public dataset training mutation.
- No pretrained detector, landmark, backbone, embedding, model dependency, or
  generated-label dependency.
- No ONNX export, browser model activation, active-label promotion, model-card
  promotion, final-readiness claim, final-gate weakening, ASL correctness claim,
  unsupported claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DI prompt and names Mission 3DI.
2. Observer 457 API prompt/request/raw/response artifacts exist and request/raw
   JSON parse.
3. The M3DH receipt exists and parses.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json`
   or the session log records the exact blocker that prevented it.
5. The receipt separates source-supported observations from inference and
   unsupported claims.
6. The receipt assesses recognition-track risk, product downscope, design-only
   future strategy, human approval needs, and STOP/parking conditions.
7. The receipt proves browser recognition remains fail-closed.
8. The receipt proves no training/fitting/checkpoint/Brev lifecycle/source
   mutation/manifest mutation/tensor mutation/implementation/export/browser
   activation/model-card promotion/final-gate action/unsupported claim/push
   occurred.
9. The receipt names exactly one next action from this prompt.
10. Required audits, API artifact JSON validation, receipt JSON validation, and
    `git diff --check` exit `0` or record exact blockers.
11. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, no-training,
  evidence-backed, fail-closed, no-Brev, no-implementation, and selects one
  bounded next action that can be routed durably.
- NUDGE if the receipt lacks source/inference separation, artifact references,
  recognition-risk assessment, product downscope analysis, design-only
  strategy constraints, fail-closed proof, negative authorization proof, or
  exactly one next action.
- REDIRECT if the executor trains, fits, runs Brev, mutates sources/data/
  manifests/tensors, prototypes architecture/input changes, edits product code,
  promotes a model, edits claim surfaces, runs a sweep, or writes
  implementation code.
- STOP if the receipt selects
  `pause_recognition_until_human_strategy_or_resource_approval` or
  `stop_recognition_track_pending_new_approved_data_or_validated_artifact`, or
  if continuing would require human approval before another bounded prompt.
- REDIRECT or CONTINUE to a fail-closed product plan if the receipt selects
  `redirect_to_fail_closed_non_recognition_learning_mvp`.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DI PopSign fresh5 post-scaffold strategy/downscope decision packet.
Completed:            <strategy/downscope decision result and receipt>.
Evidence:             <receipt path, API memo, and local audit commands>.
Remaining:            <exact next action>.
Blockers:             <none or exact blocker>.
Next step:            <exactly one next action from this prompt>.
Checkpoint commit:    <commit hash or pending>.
```
