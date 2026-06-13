# Return-To-Form PopSign Fresh5 Tensor/Input Quality Packet Goal Loop Prompt

Mission 3CO prompt for the Codex executor after Mission 3CN selected
`continue_no_training_tensor_or_input_quality_packet_after_label_review`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
tensor/input-quality packet for the repaired PopSign fresh5 path, or precisely
block it.

The goal is to decide from existing tensors, manifests, and receipts whether the
remaining `pen` collapse is explained by per-label tensor corruption,
crop/region ordering, low-signal input statistics, or another input-quality
blocker. This mission must not train, mutate manifests or tensors, switch
datasets, spend Brev, export, promote browser recognition, or change final
claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CN label/source-quality review packet:
   - [`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](../validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json)
   - [`docs/session-logs/414-mission-3cn-popsign-fresh5-label-source-quality-review-packet.md`](../session-logs/414-mission-3cn-popsign-fresh5-label-source-quality-review-packet.md)
4. M3CM split/source quality contract:
   - [`docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`](../validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json)
   - [`docs/session-logs/412-mission-3cm-popsign-fresh5-split-source-quality-contract.md`](../session-logs/412-mission-3cm-popsign-fresh5-split-source-quality-contract.md)
5. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
   - [`docs/session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md`](../session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md)
6. M3CJ local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
7. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
8. Tensor/input code paths, read-only inspection only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/build_popsign_fresh5_label_source_quality_review_packet.py`](../../scripts/build_popsign_fresh5_label_source_quality_review_packet.py)
   - [`scripts/build_popsign_fresh5_split_source_quality_contract.py`](../../scripts/build_popsign_fresh5_split_source_quality_contract.py)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CN cleared mechanical source-label ambiguity for the repaired manifests. It
did not claim external ASL educator correctness, and it did not justify another
local train-all or Brev compute step. The `pen` collapse is now classified as
more consistent with training-distribution behavior or unresolved tensor/input
quality than with source-label ambiguity.

M3CK proves the same architecture/input family can train-fit a deterministic
balanced tiny subset. M3CJ still shows full repaired-split train-all at chance
accuracy with single-class `pen` prediction collapse.

## Required Slice

Complete exactly one smallest useful no-training tensor/input-quality packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Build the packet from existing tensors and evidence only. At minimum,
record:

- tensor/input artifact paths, shapes, hashes, and expected input contract;
- per-label tensor availability and hash completeness for train, validation,
  and test;
- per-label input statistics that can be computed without training, such as
  finite-value checks, zero/near-zero frame or region rates, temporal variance,
  region variance, and rough motion/energy summaries;
- whether `pen` and `thank_you` differ materially from the other labels in
  read-only tensor/input quality;
- whether any crop/region ordering, region-axis handling, normalization, dtype,
  or loader-contract risk is visible from existing code and receipts;
- what would justify one bounded local train-all rerun;
- what would block more training and require human crop/tensor/input/source or
  scope review.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer, backward pass, checkpoint,
model fitting, tensor rewrite, manifest rewrite, source-register edit,
pseudo-labeling, source import, export, browser activation, or model-card
promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- per-label tensor/input quality rows for all five labels, with priority
  treatment for `pen` and `thank_you`;
- visible input-quality blockers or a clear statement that none are visible;
- whether a bounded local train-all prompt is justified now;
- whether any compute receipt or Brev planning is justified now;
- whether human crop/tensor/source/scope/budget review is required now;
- explicit no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion
  proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_tensor_or_input_quality_packet_after_label_review`: if
  the packet is incomplete or inconclusive.
- `prepare_bounded_local_train_all_after_tensor_input_quality_packet`: if the
  packet clears tensor/input quality enough to justify one local train-all
  prompt.
- `continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`:
  if tensor/input quality is not the blocker, but train-all remains unjustified
  without another no-training training-distribution or sampler packet.
- `stop_for_human_crop_tensor_source_scope_or_budget_decision`: if the next
  meaningful action requires human approval on crop, tensor, source, label,
  scope, or budget.

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

1. `GOAL.md` points at this M3CO prompt and names Mission 3CO.
2. The M3CN, M3CM, M3CK, and M3CJ receipts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records per-label tensor/input quality rows for all five labels
   and explicitly covers `pen` and `thank_you`.
5. The receipt directly states whether the next prompt should be bounded local
   train-all, a no-training training-distribution/sampler packet, or STOP/human
   decision.
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
- NUDGE if the receipt lacks artifact hashes, per-label tensor/input rows,
  `pen` / `thank_you` handling, loader-contract checks, collapsed-class
  criteria, or Brev/export/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, switches datasets, runs Brev, promotes a model, or edits claim
  surfaces.
- ESCALATE if the packet proposes another training-style or compute step
  without strong current local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CO PopSign fresh5 tensor/input quality packet.
Completed:            <packet result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact tensor/input/crop/source/scope/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
