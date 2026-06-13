# Return-To-Form PopSign Fresh5 Label/Source Quality Review Packet Goal Loop Prompt

Mission 3CN prompt for the Codex executor after Mission 3CM selected
`continue_label_quality_review_packet_no_mutation`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
label/source-quality review packet for the repaired PopSign fresh5 path, or
precisely block it.

The goal is to use existing evidence to decide whether the `pen` and
`thank_you` source/label risks identified by M3CM block further training, clear
the route for one bounded local train-all prompt, or require human source,
label, annotation, scope, or budget review. This mission must not train, mutate
manifests or tensors, switch datasets, spend Brev, export, promote browser
recognition, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CM split/source quality contract:
   - [`docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`](../validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json)
   - [`docs/session-logs/412-mission-3cm-popsign-fresh5-split-source-quality-contract.md`](../session-logs/412-mission-3cm-popsign-fresh5-split-source-quality-contract.md)
4. M3CL data/split/label audit:
   - [`docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`](../validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json)
   - [`docs/session-logs/410-mission-3cl-popsign-fresh5-data-split-label-distribution-audit.md`](../session-logs/410-mission-3cl-popsign-fresh5-data-split-label-distribution-audit.md)
5. M3CJ local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
6. Earlier repaired-manifest and label-risk evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
7. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
8. Source and vocabulary truth:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`data/active-module/active-module-vocabulary-review.json`](../../data/active-module/active-module-vocabulary-review.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CM cleared the repaired PopSign fresh5 split/source/signer/tensor gates but
did not justify local train-all or Brev compute. It selected
`continue_label_quality_review_packet_no_mutation` because M3CJ still collapsed
to `pen` at chance accuracy (`0.2` top-1, `0.06666666666666668` macro F1),
while `pen` and `thank_you` remain the highest-priority source/label risks.

The browser model remains fail-closed and no final ASL correctness, browser
recognition, export, promotion, or readiness claim is active.

## Required Slice

Complete exactly one smallest useful no-training label/source-quality review
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
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Build the review packet from existing evidence only. At minimum, record:

- the `pen` and `thank_you` label/source risk chain from M3BX, M3CA, M3CJ,
  M3CL, and M3CM;
- per-label split counts, source sign slugs, signer support, and risk flags for
  all five labels, with `pen` and `thank_you` reviewed first;
- whether the available repo evidence can clear source-label ambiguity without
  external ASL educator review;
- whether `pen` collapse is more consistent with label/source ambiguity,
  training distribution behavior, tensor/input quality, or inconclusive
  evidence;
- the exact condition that would justify one bounded local train-all rerun;
- the exact condition that would block more training and require human source,
  label, annotation, scope, or budget review.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer, backward pass, checkpoint,
model fitting, tensor rewrite, manifest rewrite, source-register edit,
pseudo-labeling, source import, export, browser activation, or model-card
promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- per-label review rows for all five labels, with priority treatment for
  `pen` and `thank_you`;
- source-label ambiguity findings and limits;
- whether a bounded local train-all prompt is justified now;
- whether any compute receipt or Brev planning is justified now;
- whether human source/label/annotation/scope/budget review is required now;
- explicit no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion
  proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_label_quality_review_packet_no_mutation`: if the packet is
  incomplete or inconclusive.
- `prepare_bounded_local_train_all_after_label_quality_review`: if the packet
  clears label/source quality enough to justify one local train-all prompt.
- `continue_no_training_tensor_or_input_quality_packet_after_label_review`: if
  label/source quality is not the blocker, but training remains unjustified
  without another no-training tensor/input-quality packet.
- `stop_for_human_source_label_annotation_scope_or_budget_decision`: if the
  next meaningful action requires human approval on source, label choice,
  annotation, scope, or budget.

## Hard Boundaries

- No training run, tiny-overfit rerun, fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
- No manifest, tensor, source-register, vocabulary, label-set, or source import
  mutation.
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

1. `GOAL.md` points at this M3CN prompt and names Mission 3CN.
2. The M3CM, M3CL, and M3CJ receipts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records per-label source/quality review rows for all five labels
   and explicitly covers `pen` and `thank_you`.
5. The receipt directly states whether the next prompt should be bounded local
   train-all, a no-training tensor/input-quality packet, or STOP/human decision.
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
- NUDGE if the receipt lacks artifact hashes, per-label review rows,
  `pen` / `thank_you` handling, source-label ambiguity limits, collapsed-class
  criteria, or Brev/export/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, switches datasets, runs Brev, promotes a model, or edits claim
  surfaces.
- ESCALATE if the packet proposes another training-style or compute step
  without strong current local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CN PopSign fresh5 label/source quality review packet.
Completed:            <packet result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact label/source/annotation/scope/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
