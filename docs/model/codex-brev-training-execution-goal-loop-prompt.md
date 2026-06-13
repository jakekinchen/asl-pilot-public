# Codex Brev Training Execution Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this broad 95-label Brev prompt unless the user explicitly
approves a redirect away from the return-to-form milestone ladder.

Mission 3S prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md) first. This prompt starts after Mission 3R proved local PopSign pre-Brev readiness and after the user explicitly approved paid Brev provisioning and training in this session.

## Mission

Run the 95-label PopSign-v1 rawframe training workflow on Brev, retrieve the trained artifacts, stop paid compute, and continue into local evaluation/export gates without weakening the no-pretrained or final-promotion requirements.

The user approval recorded in [`GOAL.md`](../../GOAL.md) is the explicit approval required by [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md). Do not pause only to re-ask for Brev spend approval. Still do not push, change final gates, add pretrained components, upload raw learner video, or hand-edit the model card.

## Source Of Truth

Authority order:

1. Latest user instruction: paid Brev provisioning and the remaining training runs are approved.
2. [`GOAL.md`](../../GOAL.md), especially the Mission 3S current mission and exit condition.
3. [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md).
4. [`DECISIONS.md`](../../DECISIONS.md): strict no-pretrained lane, Brev for heavy GPU, existing audit chain, 95-label PopSign active module.
5. [`ARCHITECTURE.md`](../../ARCHITECTURE.md): `#arch-no-pretrained`, `#arch-gpu-execution`, `#arch-active-module`, `#arch-data-provenance`, `#arch-browser-export`.
6. Existing pipeline scripts: `scripts/brev_create_48h.sh`, `scripts/brev_sync_repo.sh`, `scripts/brev_stop_all_training.sh`, `scripts/train_rawframe_model.py`, `scripts/evaluate_rawframe_model.py`, `scripts/export_onnx_model.py`, `scripts/promote_trained_model_card.mjs`, and `scripts/audit_*.mjs`.
7. Recent session logs, especially sessions 127-131 and 156.

## Intended Outcome

The repo has returned Brev-trained rawframe artifacts plus local evidence for what those artifacts do and do not prove. If metrics or final-promotion gates fail, preserve the failure evidence and continue with the next safe training/evaluation variant rather than claiming success.

## Current Resume State

As of observer session 163, `brev ls --json` succeeds and `asl-pilot-rawframe-001` already exists as a RUNNING / READY / HEALTHY A100 worker. The repo and allowlisted PopSign training data are synced to `/home/shadeform/asl-pilot`; remote training has not started. Resume from that worker instead of provisioning another one.

The local worktree has dirty executor implementation edits in the Brev helper and rawframe training/evaluation scripts. The observer must not commit implementation code. The executor's next slice must either commit those edits with normal scoped validation, or record a blocker if the edits are not safe to keep. After that, sync the committed script state to the existing worker and start the remote training command with a retained log.

## Acceptance Criteria

All must be true before this mission closes:

1. **Brev approval is durable.**
   - `GOAL.md` has no `<stop-orchestrator/>` sentinel.
   - `GOAL.md` records the user's approval for paid Brev provisioning and training.
   - `node scripts/audit_loop_premise.mjs --json` passes.

2. **Brev worker lifecycle is controlled.**
   - Re-run the local preconditions from [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md).
   - Provision exactly one tagged worker for the active run, using `BREV_INSTANCE_NAME=asl-pilot-rawframe-001` unless that name is already occupied.
   - Sync the repo and the allowlisted training data with `scripts/brev_sync_repo.sh`.
   - Record instance name, GPU, disk, auto-stop, sync command, and any Brev CLI quirks in a numbered session log.

3. **Remote training completes or fails with actionable evidence.**
   - On the Brev worker, run `scripts/train_rawframe_model.py` against `data/manifests/{train,validation,test}.json` with `--check-files`, `--model-id asl-pilot-rawframe-v0`, and a from-scratch architecture.
   - Retain stdout/stderr or a remote log path.
   - If the first run fails, classify the blocker and choose the next smallest safe training variant or script fix. Do not hide failed evidence.

4. **Artifacts are copied back and paid compute is stopped.**
   - Copy back `artifacts/rawframe-model/model_state.pt` and `artifacts/rawframe-model/training-provenance.json`.
   - Record SHA-256 hashes locally.
   - Run `bash scripts/brev_stop_all_training.sh` and verify the tagged worker is stopped or record the exact manual stop command still needed.

5. **Local post-training gates run from current artifacts.**
   - Run `scripts/evaluate_rawframe_model.py` with the returned checkpoint/provenance and active manifests.
   - Run `scripts/export_onnx_model.py` only if evaluation produces an artifact worth browser export.
   - Run `scripts/promote_trained_model_card.mjs` only if its required evidence exists and the claim boundary is truthful. Do not hand-edit `web/public/model/model-card.json`.
   - If final negative-challenge coverage remains red, record it as a final-promotion blocker rather than silently weakening the gate.

## First Reviewable Slice

Resume from the current Brev worker; do not create another `asl-pilot-rawframe-001` while `brev ls --json` reports it RUNNING / READY / HEALTHY. Start with:

```sh
git status --short
node scripts/audit_loop_premise.mjs --json
brev ls --json
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && pwd && python3 --version && nvidia-smi'
```

Then resolve the dirty executor implementation edits. If keeping them, commit them as a normal executor slice with scoped validation and sync the committed scripts to the worker. If rejecting them, write a numbered blocker log and stop for observer review. After the scripts are resolved and synced, run the remote training command from [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md), adjusted to the actual remote path `/home/shadeform/asl-pilot`.

Only use the original launch-and-sync commands below if `brev ls --json` proves no active worker exists:

```sh
bash scripts/storage_budget_check.sh
./.venv/bin/python scripts/audit_local_ml_environment.py \
  --write-report docs/validation/local-ml-environment.json \
  --report docs/validation/local-ml-environment.json
./.venv/bin/python scripts/decode_raw_videos.py \
  --manifest data/manifests/train.json \
  --manifest data/manifests/validation.json \
  --manifest data/manifests/test.json \
  --tensor-root data/tensors \
  --verify-only

BREV_INSTANCE_NAME=asl-pilot-rawframe-001 BREV_GPU=a100 bash scripts/brev_create_48h.sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
```

## Evidence Standard

For every training/evaluation slice, surface:

- current `git status --short`;
- exact local and remote commands;
- Brev instance name, GPU, disk, auto-stop, and stop status;
- manifest paths and clip counts;
- script hash or committed script path for training/evaluation/export;
- artifact paths and SHA-256 hashes;
- training provenance fields including `pretrained_components: []`;
- validation metrics and threshold/calibration evidence;
- final-promotion blockers kept separate from training execution.

## Hard Limits

- No pretrained CV/sign/landmark/model dependencies in the promoted lane.
- No raw learner video upload.
- No `git push`.
- No `--no-verify`, no `--amend`, no `git add -A`.
- No model-card hand edit.
- No final-gate weakening unless the user explicitly changes the gate in writing.
- Stop paid compute after artifact retrieval or when a blocker prevents progress.
