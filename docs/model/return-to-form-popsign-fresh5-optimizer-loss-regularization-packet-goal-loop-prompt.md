# Return-To-Form PopSign Fresh5 Optimizer/Loss/Regularization Packet Goal Loop Prompt

Mission 3CQ prompt for the Codex executor after Mission 3CP selected
`continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
optimizer/loss/regularization packet for the repaired PopSign fresh5 path, or
precisely block it.

The goal is to decide from existing receipts, current ignored output reports,
training provenance, and code paths whether the remaining train-all collapse is
explained by optimizer settings, learning rate, loss/target semantics, weight
decay, label smoothing, gradient clipping, scheduler or regularization
behavior, checkpoint selection, thresholding/reporting, or the M3CP
provenance caveat. This mission must not train, mutate manifests or tensors,
switch datasets, spend Brev, export, promote browser recognition, or change
final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CP training distribution/sampler packet:
   - [`docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`](../validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json)
   - [`docs/session-logs/418-mission-3cp-popsign-fresh5-training-distribution-sampler-packet.md`](../session-logs/418-mission-3cp-popsign-fresh5-training-distribution-sampler-packet.md)
4. M3CO tensor/input-quality packet:
   - [`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`](../validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json)
5. M3CN label/source-quality review packet:
   - [`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](../validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json)
6. M3CJ local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json)
7. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
8. Repaired manifest contract:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
9. Training/evaluation code paths, read-only inspection only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/build_popsign_fresh5_training_distribution_sampler_packet.py`](../../scripts/build_popsign_fresh5_training_distribution_sampler_packet.py)
10. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CP found no distribution/sampler blocker. Every split has `125` clips and
`25` examples per label, the train/eval class mapping is consistent, train batch
caps cover the full split each epoch, and `pen` is not overexposed or
underexposed. M3CO found no visible tensor/input quality blocker. M3CN cleared
mechanical source-label ambiguity. M3CK proved the same architecture/input
family can train-fit one deterministic balanced clip per label.

The remaining no-training question is whether optimizer/loss/regularization or
checkpoint/reporting behavior explains why the full repaired split still
collapses to one class under the current train-all settings. M3CP also records a
provenance caveat: M3CJ `train_all_lr001` summary says `best_validation` and
single-class `pen`, while current ignored output provenance/report says `final`
and single-class `morning`, despite matching output artifact hashes.

## Required Slice

Complete exactly one smallest useful no-training optimizer/loss/regularization
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
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Build the packet from existing receipts, output artifacts, provenance, and
code paths only. At minimum, record:

- optimizer type and settings, learning rate, weight decay, label smoothing,
  loss function, target dtype/shape assumptions, gradient clipping behavior,
  scheduler behavior, regularization/dropout/augmentation behavior, and seed or
  determinism assumptions used by the M3CJ train-all path;
- checkpoint selection and metric/reporting behavior for train, validation, and
  test, including how `best_validation` and `final` artifacts are selected or
  reported;
- whether the M3CP provenance caveat can be reconciled, superseded, or remains
  a blocker before any fitting retry;
- whether current optimizer/loss/regularization settings plausibly explain
  single-class collapse despite balanced data and tiny train-fit proof;
- what would justify one bounded local train-all rerun;
- what would block more training and require human training-scope, budget, or
  code-path review.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer construction for fitting,
training loop, backward pass, checkpoint write, model fitting, tensor rewrite,
manifest rewrite, source-register edit, pseudo-labeling, source import, export,
browser activation, or model-card promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- optimizer/loss/regularization/checkpoint/provenance rows covering the
  current PopSign fresh5 train/eval path;
- visible optimizer/loss/regularization/reporting blockers or a clear statement
  that none are visible;
- whether a bounded local train-all prompt is justified now;
- whether any compute receipt or Brev planning is justified now;
- whether human training-scope/budget/code-path review is required now;
- explicit no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion
  proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`:
  if the packet is incomplete or inconclusive.
- `prepare_bounded_local_train_all_after_optimizer_loss_packet`: if source,
  tensor, input, sampler/distribution, and optimizer/loss/regularization
  evidence are clean enough to justify one bounded local train-all prompt.
- `continue_no_training_checkpoint_selection_or_metric_reconciliation_packet`:
  if the M3CJ/current output provenance or metric-selection caveat must be
  reconciled before fitting.
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

1. `GOAL.md` points at this M3CQ prompt and names Mission 3CQ.
2. The M3CP, M3CO, M3CN, M3CJ, M3CK, and manifest-contract receipts exist and
   parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records optimizer/loss/regularization/checkpoint/provenance rows
   and explicitly covers the M3CP provenance caveat.
5. The receipt directly states whether the next prompt should be bounded local
   train-all, checkpoint/metric reconciliation, or STOP/human decision.
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
- NUDGE if the receipt lacks artifact hashes, optimizer/loss rows,
  checkpoint-selection handling, the M3CP provenance caveat, or Brev/export/
  promotion boundaries.
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
Current state:        Mission 3CQ PopSign fresh5 optimizer/loss/regularization packet.
Completed:            <packet result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact optimizer/loss/regularization/checkpoint/provenance/code-path/scope/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
