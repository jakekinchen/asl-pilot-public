# Rawframe Controlled Clip-Heldout Brev Training Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this controlled clip-heldout Brev prompt unless the user
explicitly approves a redirect away from the return-to-form milestone ladder.

Mission 3Y prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3X refreshed the controlled clip-heldout
manifests at `8286d13`.

## Mission

Launch the controlled clip-heldout rawframe training run on the existing Brev
A100 worker, using only the refreshed approved-source manifests.

This mission is not a final-promotion claim. It is the `retrain_from_approved_raw_video_only`
step in the current source-remediation chain. The split is a controlled-pilot
fallback split and is not signer-disjoint final evidence.

## Approval Record

The generic executor wrapper says not to spend Brev money without explicit user
approval. That guard is satisfied for Mission 3Y.

The user explicitly approved paid Brev training and continued use of the
existing worker in this thread, including instructions that approval is not
needed again, cost is not the concern, the worker should not be stopped by the
agent, and the loop should keep moving into the remaining training runs.

Session 175 (`50e92ae`) stopped at this approval gate. Do not repeat that
blocker. Proceed with the existing `asl-pilot-rawframe-001` worker unless a
current command shows a real auth, sync, worker-health, or training failure.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: paid Brev training is
   approved; continue using the existing worker; do not stop it unless the user
   says so.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3Y.
3. [`docs/session-logs/173-mission-3x-controlled-clip-heldout-refresh.md`](../session-logs/173-mission-3x-controlled-clip-heldout-refresh.md).
4. Refreshed controlled clip-heldout manifest summary:
   [`docs/validation/controlled-pilot-clip-heldout-manifests.json`](../validation/controlled-pilot-clip-heldout-manifests.json).
5. Source/register and route status outputs:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/controlled-pilot-source-remediation-status.json`](../validation/controlled-pilot-source-remediation-status.json)
   - [`docs/validation/controlled-pilot-model-strategy-triage.json`](../validation/controlled-pilot-model-strategy-triage.json)
6. Existing Brev helper and training scripts:
   - `scripts/brev_sync_repo.sh`
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`
7. Approved local raw-video roots referenced by the refreshed manifests:
   - `data/external/popsign-v1/raw/` is synced by `scripts/brev_sync_repo.sh`.
   - `data/external/wlasl/raw/` must be synced explicitly for this controlled
     clip-heldout run.

## First Reviewable Slice

Run the launch slice against the existing worker:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
brev ls --json
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && pwd && python3 --version && nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader && pgrep -af "[t]rain_rawframe_model.py" || true'
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'mkdir -p /home/shadeform/asl-pilot/data/external/wlasl/raw'
rsync -avz data/external/wlasl/raw/ \
  asl-pilot-rawframe-001:/home/shadeform/asl-pilot/data/external/wlasl/raw/
```

Do not stop after the read-only preflight solely for approval. The approval
gate is already satisfied by `GOAL.md` and this prompt.

Then prepare the remote Python environment if needed and launch the training
command from the refreshed summary:

```sh
python3 scripts/train_rawframe_model.py \
  --controlled-clip-heldout \
  --check-files \
  --train-manifest data/manifests/controlled-pilot-clip-heldout/train.json \
  --validation-manifest data/manifests/controlled-pilot-clip-heldout/validation.json \
  --test-manifest data/manifests/controlled-pilot-clip-heldout/test.json \
  --output-dir artifacts/rawframe-model-clip-heldout \
  --architecture factorized_3d_cnn_spatiotemporal
```

Retain a remote log under `/home/shadeform/asl-pilot/logs/` and record the
remote PID. If the run finishes during this slice, copy back the resulting
artifacts and record SHA-256 hashes. If it is still running, do not wait
indefinitely; commit a numbered session log with the PID, log path, GPU/process
status, and the next monitor command.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and `node scripts/audit_loop_premise.mjs --json` exits 0.
2. `node scripts/audit_source_register.mjs` exits 0.
3. `brev ls --json` identifies the existing `asl-pilot-rawframe-001` worker as
   `RUNNING`, `READY`, and `HEALTHY`; no duplicate worker is created.
4. The approval gate is treated as satisfied; session 175's approval-only
   blocker is not repeated.
5. The current committed repo and allowlisted training data are synced to the
   worker, including `data/external/wlasl/raw/`, or the session log records the
   exact sync blocker.
6. The controlled clip-heldout training command is launched with retained
   remote stdout/stderr and a recorded PID, or completes with copied-back
   artifacts and local SHA-256 hashes.
7. The session log records the manual stop command
   `brev stop asl-pilot-rawframe-001`, but the command is not run.
8. No prohibited work occurs in this slice.

## Hard Limits

- Do not create a duplicate Brev worker.
- Do not stop the Brev worker; the user said they will stop it when done.
- Do not run browser-capture collection commands.
- Do not create, import, or commit unapproved media.
- Do not change source-register approvals.
- Do not export ONNX, promote a model card, or weaken final gates.
- Do not hand-edit `web/public/model/model-card.json`.
- Do not claim final-promotion readiness from this controlled clip-heldout
  training run.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3Y controlled clip-heldout Brev training launch.
Completed:            <training launched or completed evidence>.
Evidence:             <commands, remote log/PID, artifacts/hashes, Brev status, commit>.
Remaining:            <monitor/retrieve/evaluate, or exact blocker>.
Blockers:             <none, or exact worker/sync/training blocker>.
Next step:            <one concrete monitor/retrieve/evaluate action>.
Checkpoint commit:    <commit hash>.
```
