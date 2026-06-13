# Return-To-Form PopSign Fresh5 Split/Source Quality Contract Goal Loop Prompt

Mission 3CM prompt for the Codex executor after Mission 3CL selected
`continue_split_source_quality_contract_no_mutation`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
split/source/signer quality contract for the repaired PopSign fresh5 path, or
precisely block it.

The goal is to turn the M3CL audit result into concrete gates and stop
conditions before any longer local training or Brev compute. This mission must
not train, mutate manifests or tensors, switch datasets, spend Brev, export,
promote browser recognition, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CL data/split/label audit:
   - [`docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`](../validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json)
   - [`docs/session-logs/410-mission-3cl-popsign-fresh5-data-split-label-distribution-audit.md`](../session-logs/410-mission-3cl-popsign-fresh5-data-split-label-distribution-audit.md)
4. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
   - [`docs/session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md`](../session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md)
5. Local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
6. Earlier repaired-manifest contract evidence:
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

M3CL found no label-count imbalance, tensor coverage failure, cross-split
leakage, or M3CE input-connectivity blocker. The repaired manifests are
balanced with `25` clips per label in train, validation, and test; tensor hash
matches are `125/125` per split; and cross-split shared clip/source-record/
signer/tensor-path/tensor-hash counts are all `0`.

M3CK proves the M3CE architecture can train-fit a deterministic balanced tiny
subset. M3CJ still shows full repaired-split train-all runs staying near chance
and collapsing to one class. The immediate failure is therefore best treated as
split/source/signer quality plus per-label source-quality behavior until a
contract says otherwise.

## Required Slice

Complete exactly one smallest useful no-training contract.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Define a contract from existing evidence only. At minimum, record:

- required split/source/signer assumptions for any next training-style prompt;
- required per-label support and source-quality gates, including `pen` and
  `thank_you` history;
- collapsed-class stop conditions carried from M3CJ and M3CL;
- what a future local train-all run must prove to avoid wasting Brev;
- what evidence would force a label-quality review instead of more training;
- what evidence would force human source, label, annotation, budget, or scope
  approval.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer, backward pass, checkpoint,
model fitting, tensor rewrite, manifest rewrite, source-register edit,
pseudo-labeling, source import, export, browser activation, or model-card
promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- split/source/signer quality contract gates;
- per-label source-quality and collapsed-class stop conditions;
- whether a bounded local train-all prompt is justified now;
- whether a Brev compute receipt is justified now;
- explicit no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion
  proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_split_source_quality_contract_no_mutation`: if the contract is
  incomplete or inconclusive.
- `continue_label_quality_review_packet_no_mutation`: if per-label ambiguity or
  source quality, especially `pen` / `thank_you`, is the clearest blocker.
- `prepare_bounded_local_train_all_after_split_source_contract`: if the
  contract is strong enough to justify one local train-all prompt.
- `prepare_training_compute_receipt_after_split_source_contract`: if the
  contract is strong enough to justify a separate compute-receipt planning
  slice before any Brev command.
- `stop_for_human_source_label_scope_or_budget_decision`: if the next meaningful
  action requires human approval on source, label choice, annotation, scope, or
  budget.

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

1. `GOAL.md` points at this M3CM prompt and names Mission 3CM.
2. The M3CL, M3CK, and M3CJ receipts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt defines split/source/signer quality gates and per-label
   stop conditions for the repaired PopSign fresh5 route.
5. The receipt directly states whether the next prompt should be bounded local
   train-all, label/source review, compute-receipt planning, or STOP/human
   decision.
6. No training/fitting/checkpoint/Brev spend or lifecycle/source mutation/
   manifest mutation/tensor mutation/export/browser activation/model-card
   promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE only if the contract is bounded, evidence-backed, no-training,
  no-mutation, and selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, source/signer gates, per-label
  stop conditions, `pen` / `thank_you` handling, collapsed-class criteria, or
  Brev/export/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, switches datasets, runs Brev, promotes a model, or edits claim
  surfaces.
- ESCALATE if the contract proposes another training-style or compute step
  without strong current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CM PopSign fresh5 split/source quality contract.
Completed:            <contract result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact split/source/signer/label/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
