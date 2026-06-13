# Return-To-Form M3FJ PopSign Label-Ladder Result Diagnosis No Training Goal Loop Prompt

Mission 3FJ prompt for the Codex executor after M3FI completed the single
approved local/no-spend PopSign label-ladder fitting sanity attempt and then
hit a local evaluator/manifest evidence blocker.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-mutation diagnosis of the
M3FI PopSign label-ladder fitting/evaluation result.

The goal is to explain the M3FI evaluator failure and weak one-epoch fitting
signal from existing receipts, output artifacts, manifests, and code paths
before any further fitting, Brev compute, evaluator rerun, manifest mutation,
export, browser activation, or final/product claim change.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FI result:
   - [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](../validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json)
   - [`docs/session-logs/575-mission-3fi-popsign-label-ladder-local-fitting-sanity-after-approval.md`](../session-logs/575-mission-3fi-popsign-label-ladder-local-fitting-sanity-after-approval.md)
   - [`output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json`](../../output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json), if still present
4. M3FH/M3FG/M3FF/M3FB contract and manifest evidence:
   - [`docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json)
   - [`docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json)
   - [`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`](../validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json)
   - [`docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`](../validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json)
   - [`docs/validation/popsign-label-ladder-manifests.json`](../validation/popsign-label-ladder-manifests.json)
5. Current PopSign label-ladder manifests under
   [`data/manifests/diagnostics/popsign-label-ladder/`](../../data/manifests/diagnostics/popsign-label-ladder/).
6. Training/evaluation code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3FI executor commit `da52ecd` completed one bounded local Mac `$0` fitting
sanity attempt under the approved envelope. The fitting command ran once,
completed within the 20-minute cap, wrote
`output/m3ff-popsign-label-ladder-local-sanity/model_state.pt`, and wrote
`output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json`.

The one allowed evaluator command then ran once and failed before report
generation with:

```text
Evaluation failed: current manifest train is missing vocabulary_review evidence
```

No `validation-report.json` or `calibrated-provenance.json` was written.

The available one-epoch fitting metrics are weak and diagnostic only:
train loss `4.688845694065094`, train accuracy `0.015625`, validation loss
`4.71799424290657`, and validation accuracy `0.0` over 16 train and 16
validation batches. Loss movement, held-out top-1, macro-F1, zero-recall
labels, never-predicted labels, and prediction concentration remain
unavailable because the evaluator failed before report generation.

Browser recognition remains fail-closed:
`web/public/model/model-card.json` has `status: "not_trained"` and
`docs/model/active-vocabulary-claim.json` has `activeLabels: []`.

## Required Slice

Complete exactly one smallest useful no-training diagnosis slice.

Run or record blockers for:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

Also run a structured local source-register/finality/vocabulary-review check
over the 095-label train/validation/test manifests and, if useful, all 15
PopSign label-ladder manifests. `brev ls --json` is allowed only as read-only
default-off evidence; no Brev lifecycle or remote command is allowed.

Diagnose without fitting or rerunning the evaluator. Use structured reads of
JSON artifacts, manifests, and code paths where practical. The packet must
cover:

- whether M3FI output artifacts match the receipt hashes and scoped output
  directory;
- whether the `vocabulary_review` requirement is coming from evaluator code,
  manifest evidence policy, source-register/finality policy, or a mismatched
  invocation contract;
- which PopSign label-ladder manifests lack or carry `vocabulary_review`
  evidence, and whether that absence was already implied by M3FB/M3FG/M3FH;
- whether M3FG's no-checkpoint evaluator probe missed this later manifest
  evidence gate because it failed earlier at the missing-checkpoint check;
- whether the M3FI fitting signal is interpretable from a one-epoch 64-example
  diagnostic run, and whether it justifies any training-style next action;
- whether a local/no-training contract repair, source/manifest review packet,
  strategy research escalation, fail-closed product work, or STOP is the
  honest next step.

## Receipt

Write:

`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`

The receipt must include:

- exact artifacts, manifests, receipts, and code symbols inspected with hashes
  where practical;
- diagnosis of the evaluator failure and where the `vocabulary_review`
  requirement enters;
- structured status of `vocabulary_review` evidence across the inspected
  label-ladder manifests;
- M3FI fitting artifact/hash verification or exact blocker if ignored output
  artifacts are absent;
- one-epoch metric interpretation and whether the run shows train sanity,
  trainability, promotion readiness, or only diagnostic weak signal;
- whether another fitting run, evaluator rerun, Brev compute, source/manifest
  mutation, export-readiness review, browser activation, or human decision is
  justified now;
- explicit proof that no training, fitting, optimizer/backward pass,
  checkpoint creation, evaluator rerun, Brev command/spend/lifecycle,
  source/register mutation, manifest/tensor/vocabulary mutation, pretrained or
  generated-label dependency, export, browser activation, model-card
  promotion, final-gate change, unsupported claim, or push occurred;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_result_diagnosis_no_training`
- `continue_popsign_label_ladder_evaluation_manifest_evidence_contract_repair_no_training`
- `continue_popsign_label_ladder_source_manifest_review_no_training`
- `continue_detector0_crop_normalization_integration_review_no_training`
- `continue_fail_closed_product_polish_no_recognition`
- `escalate_popsign_label_ladder_training_strategy_research_with_local_evidence`
- `stop_for_human_brev_spend_approval`
- `stop_for_human_training_strategy_review`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/577-mission-3fj-popsign-label-ladder-result-diagnosis-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FJ prompt and names Mission 3FJ.
2. Required local audits, JSON validations, py-compile checks,
   source-register/finality/vocabulary-review checks, read-only Brev
   default-off check if run, and fail-closed claim-surface checks pass or
   record exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt explains the M3FI evaluator failure, distinguishes manifest
   evidence policy from evaluator invocation bugs, and records which local
   no-training next step is justified.
5. The receipt states whether the one-epoch M3FI fitting metrics are train
   sanity, trainability evidence, promotion evidence, or diagnostic weak signal
   only.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting/evaluator rerun/checkpoint/Brev lifecycle/exec/sync/
   copy/spend/source/manifest/tensor/vocabulary mutation/export/browser
   activation/model-card promotion/final-gate action occurs.
8. A numbered session log records evidence, blockers, changed files,
   validations, and exactly one next action.

## Observer Guidance

- CONTINUE if the diagnosis is bounded, no-training/no-spend, evidence-backed,
  preserves fail-closed claims, and selects one allowed next action.
- NUDGE if the receipt lacks artifact hashes, manifest `vocabulary_review`
  status, code-path diagnosis, one-epoch metric interpretation,
  forbidden-action proof, fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor trains, reruns the evaluator, mutates manifests or
  tensors, edits source approvals, runs Brev lifecycle/remote work, exports,
  activates browser recognition, promotes claim surfaces, changes final gates,
  pushes, amends, or bypasses hooks.
- ESCALATE if the diagnosis proposes another training-style, compute,
  architecture, input-representation, or budget step after the repeated weak
  learning evidence without a current research diagnostic tied to local
  evidence.
- STOP if the next meaningful action requires human Brev spend, source, rights,
  annotation, label, crop, tensor, code-path, training-strategy, or final-claim
  approval.
