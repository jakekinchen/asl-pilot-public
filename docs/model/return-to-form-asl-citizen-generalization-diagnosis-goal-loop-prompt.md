# Return-To-Form ASL Citizen Generalization Diagnosis Goal Loop Prompt

Mission 3AM prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Turn the M3AL/M3AM evidence into one concrete no-spend next action. The A100
run fit the train split but failed signer-disjoint validation/test, and the
local core-negative diagnostic shows the current blocker is generalization, not
GPU availability. Diagnose the failure from the existing reports and write a
small, bounded next-step plan before any more training or Brev work.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: keep the pair moving,
   be wise with compute, and use GPT Pro/OpenAI API research if a technical
   blocker requires it.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AM.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AL and M3AM.
4. Bounded training and diagnostic evidence:
   - [`docs/session-logs/291-mission-3al-bounded-brev-training.md`](../session-logs/291-mission-3al-bounded-brev-training.md)
   - [`docs/session-logs/292-observer-stop-bounded-brev-training.md`](../session-logs/292-observer-stop-bounded-brev-training.md)
   - [`docs/session-logs/293-mission-3am-core-negative-diagnostic.md`](../session-logs/293-mission-3am-core-negative-diagnostic.md)
   - [`docs/validation/return-to-form-asl-citizen-brev-training-v1.json`](../validation/return-to-form-asl-citizen-brev-training-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json`](../validation/return-to-form-asl-citizen-core-negative-diagnostic-v1.json)
   - [`artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json`](../../artifacts/rawframe-lesson-milestone/core-negative-diagnostic-report.json)
   - [`artifacts/rawframe-lesson-milestone/core-negative-diagnostic-prediction-sidecar.json`](../../artifacts/rawframe-lesson-milestone/core-negative-diagnostic-prediction-sidecar.json)
5. Evaluation and training scripts:
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
6. Pair runbooks:
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)

## Current Evidence

M3AL trained `motion_2d_temporal_cnn` from random initialization for 40 CUDA
epochs on the approved ASL Citizen 25-label lesson split. It fit train
(`final_train_accuracy=0.9966666666666667`) but weak validation remained:

```text
best_validation_accuracy:  0.20212765957446807
final_validation_accuracy: 0.1595744680851064
```

M3AM then ran a local strict diagnostic against the copied-back checkpoint:

```text
validation_top1_accuracy:       0.20212765957446807
validation_macro_f1:            0.1803867243867244
test_top1_accuracy:             0.21
test_macro_f1:                  0.16913707345286294
selected_threshold:             0.99
test_threshold_coverage:        0.06
core_negative_false_pass_rate:  0.04
```

The result is not promotable. Do not export, calibrate, activate browser
recognition, or run another training job from this evidence.

## Required First Slice

Complete one local/no-spend diagnostic slice.

1. Run quick state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Analyze the diagnostic report and prediction sidecar. Produce a compact
   evidence artifact under `docs/validation/`, preferably
   `docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`,
   that includes:

- train/validation/test metric gap;
- per-class zero/low-recall classes on validation and test;
- highest-confidence wrong predictions;
- signer-level accuracy spread;
- whether the core negative gate or positive-class generalization is the
  blocking issue;
- a failure classification: `data_split_support`, `crop_or_region_information`,
  `architecture_capacity_or_regularization`, `label_semantics`, `source_domain`,
  or `inconclusive`.

3. If the local evidence does not clearly select a next action, use
   `openai-api-research` or `gpt-pro-research` for a short strategy memo. The
   memo should answer: given a no-pretrained browser ASL learner, tiny
   signer-disjoint data, and a full-frame temporal CNN that overfits train but
   fails held-out signers, what is the next smallest robust composable step?
   Save any memo under `artifacts/research/` or `docs/research/`. If the skill
   or credential path is unavailable, record that blocker and continue from
   local evidence.

4. Select exactly one next action and write it into the diagnosis artifact and
   the tactical overlay. Allowed next actions:

- `reduce_to_high_signal_5_10_sign_module`
- `detector0_or_region_crop_diagnostic_design`
- `first_party_capture_or_user_calibration_packet`
- `phonology_or_label_semantics_review`
- `park_ml_and_ship_reduced_fail_closed_product`

Prefer the smallest action that can change expected model behavior. Do not
choose another broad training retry.

5. If the next action needs a new executor milestone, write a new
   `docs/model/return-to-form-*-goal-loop-prompt.md` with bounded acceptance
   criteria. Otherwise update `GOAL.md` to continue Mission 3AM with the next
   local subtask.

6. Write a numbered session log and commit only scoped evidence/prompt/script
   files.

## Hard Boundaries

- No Brev sync, Brev exec, Brev training, duplicate worker creation, worker
  delete, or worker reset.
- Do not run classifier/detector training.
- Do not import new datasets, generate pseudo-labels, or use pretrained
  detectors/landmarks/backbones/embeddings.
- Do not export ONNX, promote thresholds, update the model card to trained,
  activate browser recognition, or claim final readiness.
- Do not weaken the full 17-type hard-negative gate. The
  `--lesson-core-negative-diagnostic` mode is diagnostic only.

## Acceptance Criteria

Mission 3AM can close when:

1. The executor has analyzed the M3AL/M3AM diagnostic outputs instead of
   rerunning training.
2. A tracked diagnosis artifact records failure classification, evidence,
   selected next action, no-spend boundaries, and residual blockers.
3. The tactical overlay in [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)
   names the selected next action.
4. Any new prompt written for the selected next action has bounded acceptance
   criteria and hard stops.
5. Required local audits and `git diff --check` pass.
6. A numbered session log records commands, evidence, and the exact next
   action.

## Observer Guidance

- CONTINUE only if the diagnosis artifact is missing required evidence fields
  and the next step is local/no-spend.
- NUDGE if the executor jumps to a favorite architecture without using the
  diagnostic report/sidecar.
- ESCALATE if the evidence is inconclusive or the executor proposes another
  training-style retry without a strategy memo.
- STOP if the next selected action requires Brev/provider auth, paid compute,
  source approval, human data collection, or a user decision.
- REDIRECT only if the user explicitly changes the plan.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AM ASL Citizen generalization diagnosis.
Completed:            <diagnostic analysis completed>.
Evidence:             <report/sidecar/diagnosis paths and key metrics>.
Remaining:            <single next action>.
Blockers:             <none or exact data/source/architecture/provider blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
