# Return-To-Form ASL Citizen Local Lesson Smoke Goal Loop Prompt

Mission 3AK prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run the first strictly local, no-spend training smoke on the approved ASL
Citizen lesson-milestone manifests produced by Mission 3AJ. The goal is to
prove the actual PyTorch training path can load the reviewed raw-video-derived
tensors, complete a bounded one-epoch pass, and write honest metrics before
any Brev spend or longer training run is authorized.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AK.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AJ and M3AK.
4. Mission 3AJ evidence:
   - [`docs/session-logs/284-mission-3aj-approved-source-vocabulary-unblock.md`](../session-logs/284-mission-3aj-approved-source-vocabulary-unblock.md)
   - [`docs/validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json`](../validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json)
   - [`docs/validation/asl-citizen-selected-vocabulary-review-evidence.json`](../validation/asl-citizen-selected-vocabulary-review-evidence.json)
5. Training code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)

## Current Decision

The M3AJ strict dry-run passed. The next useful step is a local no-spend smoke,
not Brev. Do not use `--max-train-batches` or `--max-validation-batches` with
`--lesson-milestone`; the training script intentionally forbids that
combination. Keep the run bounded with one epoch, small batch size, and local
GPU/MPS if available.

## Required Command

Run this command from repo root unless local inspection proves one argument
must change to satisfy the current script contract:

```sh
python3 scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --output-dir artifacts/rawframe-lesson-milestone \
  --model-id asl-pilot-asl-citizen-lesson-local-smoke-v1 \
  --architecture motion_2d_temporal_cnn \
  --lesson-milestone \
  --check-files \
  --epochs 1 \
  --batch-size 4 \
  --frame-count 12 \
  --image-size 96 \
  --learning-rate 0.001
```

If the command fails because local PyTorch, MPS, CUDA, or frame tensor loading
is unavailable, do not fake success and do not switch to Brev in this mission.
Write the exact blocker and the smallest bounded next action.

## Acceptance Criteria

Mission 3AK is complete only when:

1. `GOAL.md` points at this prompt and names Mission 3AK.
2. The one-epoch local training command either completes successfully or
   produces a precise environment/data blocker.
3. If training completes, `artifacts/rawframe-lesson-milestone/training-provenance.json`
   exists, reports `training_status: "completed"`, `evidence_mode:
   "lesson_milestone"`, `pretrained_components: []`, and the expected ASL
   Citizen lesson manifests.
4. A receipt under `docs/validation/` records the command, device, metrics,
   output artifact paths and hashes, and explicitly states that no model card,
   thresholds, ONNX export, browser promotion, or final readiness claim was
   made.
5. A numbered session log records commands, metrics or blocker, no-Brev/no-push
   boundaries, and exactly one next action.
6. Required validation commands pass, or the session log records the exact
   failing command and blocker.

## Required Validation

Run from repo root unless noted:

```sh
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py
git diff --check
```

Also parse the training provenance JSON if it exists:

```sh
python3 -m json.tool artifacts/rawframe-lesson-milestone/training-provenance.json >/dev/null
```

## Hard Boundaries

- No Brev command, sync, spend, stop, reset, or duplicate worker creation.
- No source import, source approval shortcut, generated pseudo-labels, or
  pretrained detector/landmark/backbone use.
- No ONNX export, model-card edit, browser promotion, threshold selection,
  final-readiness claim, push, or broad 75/95-label run.
- Do not commit `artifacts/rawframe-lesson-milestone/model_state.pt`; record
  hashes in validation evidence instead.

## Observer Guidance

The observer should judge only the local no-spend smoke.

- CONTINUE only if a required local evidence field is missing and the next
  action remains no-spend.
- NUDGE if the receipt omits metrics, device, hashes, or the no-promotion
  boundary.
- REDIRECT if the executor tries Brev, promotion, export, thresholds, broad
  label expansion, or source shortcuts.
- STOP if the local smoke passes and the next action is a human-approved
  bounded Brev/full-training proposal, or if a local environment blocker makes
  Brev/local setup a human compute decision.
- ESCALATE only if the local smoke fails for a technical reason that may
  require changing the dataset route, model architecture, or training plan.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AK ASL Citizen local lesson smoke.
Completed:            <local command/artifact/evidence completed>.
Evidence:             <commands, metrics, hashes, audit outcomes>.
Remaining:            <bounded full training / blocker / human decision>.
Blockers:             <none or exact blocker>.
Next step:            <one next action>.
Checkpoint commit:    <commit hash>.
```
