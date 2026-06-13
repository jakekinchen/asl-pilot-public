# Return-To-Form PopSign Fresh5 Data/Split/Label Distribution Audit Goal Loop Prompt

Mission 3CL prompt for the Codex executor after Mission 3CK selected
`continue_data_split_label_distribution_audit_no_mutation`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training, no-mutation
data/split/label distribution audit for the repaired PopSign fresh5 path, or
precisely block it.

The goal is to determine why the M3CE architecture can train-fit a tiny
balanced subset but train-all/generalization over the repaired split remains
near chance with collapsed predictions. This mission must not run another
classifier, spend Brev, alter manifests or tensors, switch datasets, export,
promote browser recognition, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CK architecture/input microprobe:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json)
   - [`docs/session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md`](../session-logs/408-mission-3ck-popsign-fresh5-architecture-input-microprobe.md)
4. Local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
5. M3CI evaluation contract fix:
   - [`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json)
   - [`docs/session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md`](../session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md)
6. Earlier PopSign fresh5 data/split evidence:
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

M3CK answered the architecture/input connectivity question: the M3CE scratch
region-temporal late-fusion TCN can train-fit one deterministic balanced clip
per label. The receipt reports final tiny-subset accuracy `1.0`, `5/5`
correct, zero zero-recall labels, balanced prediction distribution, nonzero
gradient norm, and parameter movement.

M3CJ still shows the repaired PopSign fresh5 train-all path failing to learn:
lr `0.001` and `0.003` local train-all runs stayed near chance, validation/test
top-1 stayed `0.2`, macro F1 stayed `0.06666666666666668`, and predictions
collapsed to one class.

Therefore the next useful question is not "can the M3CE model receive tensors
and update parameters?" It can. The next useful question is whether the
remaining blocker is split/source/signer distribution, label distribution,
per-label data quality, or a stop condition before more training.

## Required Slice

Complete exactly one smallest useful local no-training audit.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
```

2. Audit existing evidence only. At minimum, answer:

- per-split and per-label counts for train, validation, and test;
- source, signer, clip, tensor-path, and tensor-hash overlap or disjointness;
- whether split construction is intentionally signer/source-disjoint and
  whether that is now the most plausible generalization blocker;
- whether `pen`, `thank_you`, or any collapsed prediction target has label-risk,
  source-quality, support, or tensor-quality evidence that should block more
  training;
- whether M3BX/M3BY/M3BZ repaired-manifest gates still explain the current
  failure, or whether M3CK changed the likely blocker;
- whether a longer local or Brev train-all run is justified now, or still
  wasteful before a concrete split/label/source-quality remediation contract.

3. Add the smallest deterministic analysis helper only if needed. Any helper
must be no-training and no-mutation: no optimizer, backward pass, checkpoint,
model fitting, tensor rewrite, manifest rewrite, source-register edit,
pseudo-labeling, source import, export, browser activation, or model-card
promotion.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- per-split/per-label/source/signer/tensor coverage tables;
- overlap/leakage/disjointness conclusions;
- `pen`, `thank_you`, and collapsed-class evidence;
- comparison against M3CK tiny train-fit and M3CJ train-all failure;
- no-training/no-fitting/no-Brev/no-mutation/no-export/no-promotion proof;
- exactly one next action.

5. Select exactly one next action:

- `continue_data_split_label_distribution_audit_no_mutation`: if the audit is
  incomplete or inconclusive.
- `continue_split_source_quality_contract_no_mutation`: if the audit identifies
  a concrete split/source/signer quality contract that should be verified before
  training.
- `continue_label_quality_review_packet_no_mutation`: if per-label ambiguity,
  especially `pen` / `thank_you`, is the clearest blocker.
- `prepare_bounded_local_train_all_after_data_audit`: if the audit shows the
  data/split/label evidence is strong enough to justify one local train-all run.
- `prepare_training_compute_receipt_after_data_audit`: if the audit shows local
  evidence is strong enough to justify a separate compute-receipt planning
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

1. `GOAL.md` points at this M3CL prompt and names Mission 3CL.
2. The M3CI, M3CJ, and M3CK receipts exist and parse.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt directly answers whether the remaining train-all/generalization
   failure is more likely split/source/signer distribution, label distribution,
   per-label data quality, or a human decision blocker.
5. The receipt records per-split/per-label/source/signer/tensor coverage and
   overlap or disjointness evidence.
6. No training/fitting/checkpoint/Brev spend or lifecycle/source mutation/
   manifest mutation/tensor mutation/export/browser activation/model-card
   promotion/final-gate action occurs.
7. Required audits, receipt JSON validation, relevant py-compile checks if a
   helper is added, and `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Observer Guidance

- CONTINUE only if the audit is bounded, evidence-backed, no-training,
  no-mutation, and selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, overlap/disjointness evidence,
  per-label support, `pen` / `thank_you` analysis, blocker classification, or
  Brev/export/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, switches datasets, runs Brev, promotes a model, or edits claim
  surfaces.
- ESCALATE if the audit proposes another training-style or compute step without
  strong current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CL PopSign fresh5 data/split/label distribution audit.
Completed:            <audit result, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact split/source/signer/label/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
