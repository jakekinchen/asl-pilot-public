# Return-To-Form PopSign Fresh5 Training Distribution/Sampler Packet Goal Loop Prompt

Mission 3CP prompt for the Codex executor after Mission 3CO selected
`continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
training-distribution/sampler packet for the repaired PopSign fresh5 path, or
precisely block it.

The goal is to decide from existing manifests, receipts, training provenance,
and code paths whether the remaining `pen` collapse is explained by exposure,
sampling, class-order, batch construction, epoch accounting, evaluation target,
or loader-distribution behavior. This mission must not train, mutate manifests
or tensors, switch datasets, spend Brev, export, promote browser recognition,
or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CO tensor/input-quality packet:
   - [`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`](../validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json)
   - [`docs/session-logs/416-mission-3co-popsign-fresh5-tensor-input-quality-packet.md`](../session-logs/416-mission-3co-popsign-fresh5-tensor-input-quality-packet.md)
4. M3CN label/source-quality review packet:
   - [`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](../validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json)
   - [`docs/session-logs/414-mission-3cn-popsign-fresh5-label-source-quality-review-packet.md`](../session-logs/414-mission-3cn-popsign-fresh5-label-source-quality-review-packet.md)
5. M3CJ local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json)
6. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
7. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
8. Training/distribution code paths, read-only inspection only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/build_popsign_fresh5_tensor_input_quality_packet.py`](../../scripts/build_popsign_fresh5_tensor_input_quality_packet.py)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CO scanned all `375` repaired PopSign fresh5 tensors and found no visible
tensor/input blocker: hash matches passed, shapes and region order were stable,
finite checks passed, no near-zero frame/region clips were visible, and `pen`
and `thank_you` were not low-signal outliers. M3CN also cleared mechanical
source-label ambiguity.

M3CK proves the same architecture/input family can train-fit a deterministic
balanced tiny subset. M3CJ still shows full repaired-split train-all at chance
accuracy with single-class `pen` prediction collapse. The remaining no-training
question is whether the train/eval exposure, sampler, batch, class-order, or
epoch accounting path explains the collapse before any fitting retry.

## Required Slice

Complete exactly one smallest useful no-training training-distribution/sampler
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
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Build the packet from existing manifests, receipts, provenance, and code
paths only. At minimum, record:

- train/validation/test label counts, source/signer-disjoint assumptions, and
  class-index mapping used by the train/eval path;
- train batch accounting, batch cap behavior, epoch count, sample exposure per
  label, and whether every train clip can be seen under the M3CJ configuration;
- sampler/shuffle behavior and any deterministic ordering risk that could favor
  or overexpose `pen`;
- validation/test evaluator label-target mapping and threshold/reporting
  assumptions;
- whether `pen` collapse is plausibly explained by exposure, sampler, batch,
  epoch, class-order, or evaluation distribution behavior;
- what would justify one bounded local train-all rerun;
- what would block more training and require human scope/budget or code-path
  review.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer, backward pass, checkpoint,
model fitting, tensor rewrite, manifest rewrite, source-register edit,
pseudo-labeling, source import, export, browser activation, or model-card
promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- train/eval distribution and sampler rows covering all five labels;
- visible distribution/sampler blockers or a clear statement that none are
  visible;
- whether a bounded local train-all prompt is justified now;
- whether any compute receipt or Brev planning is justified now;
- whether human training-scope/budget/code-path review is required now;
- explicit no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion
  proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`:
  if the packet is incomplete or inconclusive.
- `prepare_bounded_local_train_all_after_sampler_packet`: if source, tensor,
  input, and sampler/distribution evidence are clean enough to justify one
  local train-all prompt.
- `continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`:
  if sampler/distribution is not the blocker, but another no-training
  optimizer/loss/regularization contract is needed before fitting.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.

## Hard Boundaries

- No training run, tiny-overfit rerun, fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  or generated pseudo-label mutation.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy.
- No source-register approval change, unreviewed source import, public dataset
  training-use expansion, generated pseudo-labels, or pretrained detector,
  landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CP prompt and names Mission 3CP.
2. The M3CO, M3CN, M3CJ, and manifest-contract receipts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records train/eval distribution and sampler rows for all five
   labels and explicitly covers `pen` exposure/collapse risk.
5. The receipt directly states whether the next prompt should be bounded local
   train-all, a no-training optimizer/loss packet, or STOP/human decision.
6. No training/fitting/checkpoint/Brev spend or lifecycle/source mutation/
   manifest mutation/tensor mutation/export/browser activation/model-card
   promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE only if the packet is bounded, evidence-backed, no-training,
  no-mutation, and selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, per-label distribution rows,
  `pen` exposure handling, sampler/batch/epoch/class-index checks,
  collapsed-class criteria, or Brev/export/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, switches datasets, runs Brev, promotes a model, or edits claim
  surfaces.
- ESCALATE if the packet proposes another training-style or compute step
  without strong current local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CP PopSign fresh5 training distribution/sampler packet.
Completed:            <packet result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact sampler/distribution/code-path/scope/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
