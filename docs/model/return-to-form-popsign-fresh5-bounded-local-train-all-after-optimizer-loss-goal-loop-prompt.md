# Return-To-Form PopSign Fresh5 Bounded Local Train-All After Optimizer/Loss Packet Goal Loop Prompt

Mission 3CR prompt for the Codex executor after Mission 3CQ selected
`prepare_bounded_local_train_all_after_optimizer_loss_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run or precisely block exactly one bounded local/no-spend train-all attempt for
the repaired PopSign fresh5 path after the M3CQ optimizer/loss/regularization
packet.

The goal is to test one predeclared optimizer-schedule hypothesis from the
existing evidence without sweeping, switching data, spending Brev, mutating
source/manifests/tensors, exporting, promoting browser recognition, or changing
final claims. This is a local diagnostic training slice only.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CQ optimizer/loss/regularization packet:
   - [`docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`](../validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json)
   - [`docs/session-logs/420-mission-3cq-popsign-fresh5-optimizer-loss-regularization-packet.md`](../session-logs/420-mission-3cq-popsign-fresh5-optimizer-loss-regularization-packet.md)
4. M3CP training distribution/sampler packet:
   - [`docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`](../validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json)
5. M3CO tensor/input-quality packet:
   - [`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`](../validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json)
6. M3CN label/source-quality review packet:
   - [`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](../validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json)
7. M3CJ local train/eval sanity and current ignored output artifacts:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json)
   - [`output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json`](../../output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json)
8. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
9. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
10. Training/evaluation code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
11. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CN, M3CO, M3CP, and M3CQ cleared the no-training blockers that justified more
diagnosis before fitting: source-label mechanics, tensor/input quality,
distribution/sampler exposure, optimizer/loss/target wiring, and the
M3CJ/current-output checkpoint-reporting caveat. M3CK proved the same
architecture/input family can train-fit one deterministic balanced clip per
label after a longer tiny train-fit schedule.

M3CQ does not justify Brev. It does justify one bounded local train-all prompt
that preserves the repaired PopSign fresh5 manifests, predeclares exactly one
optimizer-schedule hypothesis, passes an explicit checkpoint-selection flag,
writes local outputs only under an ignored output directory, and records a
tracked receipt.

## Required Slice

Complete exactly one smallest useful bounded local train-all slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Predeclare one local optimizer-schedule hypothesis before running anything.
The preferred hypothesis from M3CQ is: same repaired PopSign fresh5 split and
same scratch region-temporal late-fusion TCN, explicit checkpoint selection,
longer bounded schedule than M3CJ, no data augmentation unless the command
already has an approved bounded flag, and no hyperparameter sweep.

3. Run at most one local/no-spend train-all command if the current training
contract allows the predeclared command. The command must:

- use only the repaired PopSign fresh5 train/validation/test manifests;
- preserve `scratch_region_temporal_late_fusion_tcn_contract_v1` and
  `--popsign-fresh5-training-smoke`;
- include an explicit `--checkpoint-selection` argument;
- cover the full train/validation splits unless the session log records the
  exact local blocker;
- write to an ignored local output directory named for M3CR;
- avoid Brev, remote commands, source/manifest/tensor mutation, export, browser
  activation, model-card promotion, final-gate changes, and push.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`

The receipt must include:

- exact command, output directory, device/backend, seed, optimizer settings,
  checkpoint-selection policy, and artifact hashes;
- train/validation/test metrics, training history, confusion/prediction
  distribution, per-label recall, threshold metrics, and pass/fail status;
- comparison against M3CJ baselines: test top-1 `0.2`, macro F1
  `0.06666666666666668`, single-class prediction collapse, zero-recall labels,
  and flat chance validation accuracy;
- whether local signal is strong enough to justify a later compute receipt or
  export-readiness review;
- whether only a no-training local train-all result diagnosis is justified;
- whether human training-scope/budget/code-path review is required now;
- explicit proof that no Brev/source/manifest/tensor/export/promotion/final
  claim/push action occurred;
- exactly one next action.

5. Select exactly one next action:

- `continue_bounded_local_train_all_after_optimizer_loss_packet`: if the run or
  receipt is incomplete, blocked by local contract, or inconclusive.
- `continue_no_training_local_train_all_result_diagnosis`: if the run completes
  but still fails or needs no-training diagnosis before any more fitting.
- `prepare_compute_receipt_or_export_readiness_review_after_local_signal`: if
  the run shows clear local signal above M3CJ but still needs a separate
  no-training receipt before Brev, export, browser activation, or promotion.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval on training scope, budget, code
  path, source, label, crop, tensor, or final claim.

## Hard Boundaries

- At most one bounded local/no-spend train-all run; no sweep, broad retry,
  second local retry, fresh10 training, or 75/95-label training.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy.
- No manifest, tensor, source-register, vocabulary, label-set, source import,
  or generated pseudo-label mutation.
- No source-register approval change, unreviewed source import, public dataset
  training-use expansion, generated pseudo-labels, or pretrained detector,
  landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CR prompt and names Mission 3CR.
2. The M3CQ, M3CP, M3CO, M3CN, M3CJ, M3CK, and manifest-contract receipts
   exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records the exact command, predeclared hypothesis,
   checkpoint-selection policy, output artifact hashes, metrics, confusion/
   prediction distribution, per-label recall, threshold metrics, and comparison
   against M3CJ.
5. The receipt directly states whether the next prompt should be no-training
   result diagnosis, compute/export-readiness review after local signal, or
   STOP/human decision.
6. No Brev/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE only if the local run is bounded, evidence-backed, no-Brev, and
  selects one bounded next action.
- NUDGE if the receipt lacks the explicit checkpoint-selection policy,
  predeclared hypothesis, artifact hashes, per-label recall/confusion,
  M3CJ comparison, or Brev/export/promotion boundaries.
- REDIRECT if the executor runs Brev, mutates manifests/tensors/source
  approvals, switches datasets, promotes a model, edits claim surfaces, runs a
  sweep, or performs more than one local train-all attempt.
- ESCALATE if the result proposes another training-style or compute step after
  failure without a current research diagnostic tied to local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, tensor, label, code-path, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CR PopSign fresh5 bounded local train-all after optimizer/loss packet.
Completed:            <local run result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, output artifact hashes, metrics>.
Remaining:            <single next action>.
Blockers:             <none or exact local-contract/training-signal/scope/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
