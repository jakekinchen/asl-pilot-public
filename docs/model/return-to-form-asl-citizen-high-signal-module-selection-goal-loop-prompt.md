# Return-To-Form ASL Citizen High-Signal Module Selection Goal Loop Prompt

Mission prompt for the Codex executor after Mission 3AM. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Reduce the failed 25-label ASL Citizen lesson milestone to the smallest
defensible 5-10 sign module before any more classifier training or Brev work.
Use the M3AM diagnosis and existing ASL Citizen manifests to select labels with
held-out signal, reject labels that currently have no evidence, and write the
next gates needed for a later bounded smoke.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Mission 3AM diagnosis:
   [`docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`](../validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json).
5. Underlying M3AM evidence:
   - [`docs/validation/return-to-form-asl-citizen-brev-training-v1.json`](../validation/return-to-form-asl-citizen-brev-training-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json`](../validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json)
   - [`artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json`](../../artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json)
   - [`artifacts/rawframe-lesson-milestone/core-negative-diagnostic-prediction-sidecar.json`](../../artifacts/rawframe-lesson-milestone/core-negative-diagnostic-prediction-sidecar.json)
6. ASL Citizen source/manifest evidence:
   - [`docs/research/asl-citizen-selected-raw-clip-import.json`](../research/asl-citizen-selected-raw-clip-import.json)
   - [`docs/research/asl-citizen-academic-source-review.md`](../research/asl-citizen-academic-source-review.md)
   - [`data/manifests/lesson/rawframe-milestone/train.json`](../../data/manifests/lesson/rawframe-milestone/train.json)
   - [`data/manifests/lesson/rawframe-milestone/validation.json`](../../data/manifests/lesson/rawframe-milestone/validation.json)
   - [`data/manifests/lesson/rawframe-milestone/test.json`](../../data/manifests/lesson/rawframe-milestone/test.json)
7. Pair runbooks:
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)

## Current Evidence

Mission 3AM classified the 25-label failure as `data_split_support` with
secondary architecture/source-domain hypotheses. The model fit train
(`final_train_accuracy=0.9966666666666667`) but held-out performance remained
weak (`validation_top1_accuracy=0.20212765957446807`,
`test_top1_accuracy=0.21`, `test_macro_f1=0.16913707345286294`).

The core-negative diagnostic false-pass rate was `0.04` at threshold `0.99`,
so the dominant blocker is positive-class signer-disjoint generalization. The
diagnosis selected exactly one next action:
`reduce_to_high_signal_5_10_sign_module`.

Candidate labels with nonzero recall on both validation and test are:
`table`, `white`, `please`, `sad`, `black`, `hello`, and `uncle`. Treat this as
a starting evidence set, not an automatic final module. Reject labels that have
zero recall on either split unless a concrete evidence field justifies keeping
them for a later reviewed module.

## Required First Slice

Complete one local/no-spend selection slice.

1. Run quick state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Rank all 25 labels using only existing evidence:

- validation and test recall/F1;
- train/validation/test source support and signer coverage;
- high-confidence wrong-prediction conflicts;
- whether the label is useful in the learner-facing beginner module;
- whether the label would create a tiny but honest 5-10 sign curriculum.

3. Select a high-signal module of 5-10 labels. If fewer than five labels are
defensible from the evidence, do not pad the module. Record the blocker and
select the next local/no-spend remediation action instead.

4. Write
   `docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`
   with:

- selected labels and rationale;
- rejected labels and rejection reason;
- per-label train/validation/test support;
- per-label validation/test recall and F1;
- signer coverage summary for selected labels;
- known confusion risks from the M3AM sidecar;
- gates for the later smoke before any training command is allowed;
- no-spend/no-pretrained/no-promotion boundaries.

5. Update the tactical overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with the
   selected module and exactly one next action.

6. Write a numbered session log and commit only scoped evidence/prompt/doc
   files.

## Hard Boundaries

- No Brev sync, exec, training, stop spam, worker delete, worker reset,
  duplicate worker creation, or paid compute.
- Do not run classifier or Detector 0 training.
- Do not import sources, generate pseudo-labels, or use pretrained detectors,
  landmarks, backbones, embeddings, or generated-label dependencies.
- Do not export ONNX, promote thresholds, update the model card to trained,
  activate browser recognition, or claim final readiness.
- Do not weaken the full 17-type hard-negative gate.
- Do not select a label only because it is desirable for curriculum; it needs
  evidence or an explicit blocker entry.

## Acceptance Criteria

This milestone can close when:

1. The executor used the M3AM diagnosis rather than rerunning training.
2. A tracked module-selection artifact names selected and rejected labels with
   evidence-backed reasons.
3. The artifact records train/validation/test support, held-out metrics, signer
   coverage, confusion risks, gates, and hard boundaries.
4. The tactical overlay names the selected module and exactly one next action.
5. Required local audits and `git diff --check` pass.
6. A numbered session log records commands, evidence, blockers, and next step.

## Observer Guidance

- CONTINUE only if the selection artifact is missing required local evidence
  fields and the next step is still no-spend.
- NUDGE if the executor selects labels without using validation/test recall or
  source support.
- STOP if the selected next action requires Brev/provider auth, paid compute,
  source approval, human data collection, final-gate changes, or a user
  decision.
- REDIRECT only if the user explicitly changes the plan.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        ASL Citizen high-signal module selection.
Completed:            <module selection completed>.
Evidence:             <selection artifact and key selected labels>.
Remaining:            <single next action>.
Blockers:             <none or exact data/source/provider/user blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
