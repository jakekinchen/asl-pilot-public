# Rawframe WLASL Tensor Remediation And Brev Relaunch Goal Loop Prompt

Status: superseded by [`return-to-form-plan.md`](return-to-form-plan.md) and
[`return-to-form-small-proof-goal-loop-prompt.md`](return-to-form-small-proof-goal-loop-prompt.md).
Do not reactivate this controlled clip-heldout remediation prompt unless the
user explicitly approves a redirect away from the return-to-form milestone
ladder.

Mission 3Z prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first. This prompt starts after Mission 3Y commit `241185d` proved that the
controlled clip-heldout training launch now fails on WLASL supplement clips
without decoded raw RGB tensor references.

## Mission

Repair the WLASL selected-manifest tensor gap using the existing rawframe decode
and manifest-export tooling, then relaunch the controlled clip-heldout training
run on the existing Brev A100 worker.

This is not a final-promotion claim. It is still the
`retrain_from_approved_raw_video_only` step in the current source-remediation
chain. The split is a controlled-pilot fallback split and is not signer-disjoint
final evidence.

## Approval Record

Paid Brev training is already approved for this mission family. The generic
executor wrapper's no-spend guard is satisfied; do not repeat the session 175
approval blocker.

Use the existing `asl-pilot-rawframe-001` worker. Do not stop it; the user said
they will stop it when done.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: keep the goal loop
   moving, use the existing paid Brev worker, and do not stop it.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3Z.
3. [`docs/session-logs/177-mission-3y-controlled-clip-heldout-launch.md`](../session-logs/177-mission-3y-controlled-clip-heldout-launch.md).
4. Failed launch evidence:
   [`docs/validation/controlled-clip-heldout-20260525T180128Z.log`](../validation/controlled-clip-heldout-20260525T180128Z.log).
5. WLASL selected-manifest readiness:
   [`docs/session-logs/171-mission-3w-wlasl-selected-manifests.md`](../session-logs/171-mission-3w-wlasl-selected-manifests.md),
   [`docs/validation/wlasl-academic-selected-manifests.json`](../validation/wlasl-academic-selected-manifests.json), and
   `data/manifests/diagnostics/wlasl-academic-selected/{train,validation,test}.json`.
6. Controlled clip-heldout manifest summary:
   [`docs/validation/controlled-pilot-clip-heldout-manifests.json`](../validation/controlled-pilot-clip-heldout-manifests.json), and
   `data/manifests/controlled-pilot-clip-heldout/{train,validation,test}.json`.
7. Existing scripts:
   - `scripts/brev_sync_repo.sh`
   - `scripts/decode_raw_videos.py`
   - `scripts/export_controlled_pilot_clip_heldout_manifests.mjs`
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`

## First Reviewable Slice

Run the remediation and relaunch slice against the existing worker:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
brev ls --json
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && pwd && python3 --version && nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader && pgrep -af "[t]rain_rawframe_model.py" || true'
```

Quantify the exact WLASL tensor gap before editing anything:

```sh
jq '[.clips[] | select(.source_id=="wlasl-school-assignment-raw-videos" and (((.relative_frame_tensor_path // "") == "") or ((.frame_tensor_sha256 // "") == "") or (.frame_tensor_provenance == null)))] | length' \
  data/manifests/controlled-pilot-clip-heldout/train.json
jq '[.clips[] | select(.source_id=="wlasl-school-assignment-raw-videos" and (((.relative_frame_tensor_path // "") == "") or ((.frame_tensor_sha256 // "") == "") or (.frame_tensor_provenance == null)))] | length' \
  data/manifests/controlled-pilot-clip-heldout/validation.json
jq '[.clips[] | select(.source_id=="wlasl-school-assignment-raw-videos" and (((.relative_frame_tensor_path // "") == "") or ((.frame_tensor_sha256 // "") == "") or (.frame_tensor_provenance == null)))] | length' \
  data/manifests/controlled-pilot-clip-heldout/test.json
```

Sync the current checkout and approved raw-video roots. `scripts/brev_sync_repo.sh`
does not include WLASL raw videos in its allowlist, so sync that root explicitly:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'mkdir -p /home/shadeform/asl-pilot/data/external/wlasl/raw'
rsync -avz data/external/wlasl/raw/ \
  asl-pilot-rawframe-001:/home/shadeform/asl-pilot/data/external/wlasl/raw/
```

On the worker, decode only the WLASL selected diagnostic manifests first. Use
`--allow-small-label-set` only for these 25-label diagnostic supplement
manifests; the combined 95-label controlled training manifests must still pass
without that flag.

```sh
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && ./.venv/bin/python scripts/decode_raw_videos.py \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/train.json \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/validation.json \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/test.json \
    --tensor-root data/tensors \
    --allow-small-label-set'
```

Then replay-verify those WLASL decode outputs and regenerate the controlled
clip-heldout manifests so `rewriteClipForSplit()` propagates tensor fields into
the training manifests:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && ./.venv/bin/python scripts/decode_raw_videos.py \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/train.json \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/validation.json \
    --manifest data/manifests/diagnostics/wlasl-academic-selected/test.json \
    --tensor-root data/tensors \
    --allow-small-label-set \
    --verify-only'
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && node scripts/export_controlled_pilot_clip_heldout_manifests.mjs --write --include-wlasl-academic-selected'
```

Before any later repo sync can delete remote-only decode outputs, copy the
remediated ignored artifacts back to local:

```sh
rsync -avz asl-pilot-rawframe-001:/home/shadeform/asl-pilot/data/manifests/diagnostics/wlasl-academic-selected/ \
  data/manifests/diagnostics/wlasl-academic-selected/
rsync -avz asl-pilot-rawframe-001:/home/shadeform/asl-pilot/data/manifests/controlled-pilot-clip-heldout/ \
  data/manifests/controlled-pilot-clip-heldout/
rsync -avz --include='*/' --include='wlasl-*.pt' --exclude='*' \
  asl-pilot-rawframe-001:/home/shadeform/asl-pilot/data/tensors/ \
  data/tensors/
rsync -avz asl-pilot-rawframe-001:/home/shadeform/asl-pilot/docs/validation/wlasl-academic-selected-manifests.json \
  docs/validation/wlasl-academic-selected-manifests.json
rsync -avz asl-pilot-rawframe-001:/home/shadeform/asl-pilot/docs/validation/controlled-pilot-clip-heldout-manifests.json \
  docs/validation/controlled-pilot-clip-heldout-manifests.json
```

Run the controlled training preflight without `--allow-small-label-set`. This is
the gate that proves the remediated combined manifests are trainable before the
paid training relaunch:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=15 asl-pilot-rawframe-001 \
  'cd /home/shadeform/asl-pilot && ./.venv/bin/python scripts/train_rawframe_model.py \
    --controlled-clip-heldout \
    --check-files \
    --dry-run \
    --train-manifest data/manifests/controlled-pilot-clip-heldout/train.json \
    --validation-manifest data/manifests/controlled-pilot-clip-heldout/validation.json \
    --test-manifest data/manifests/controlled-pilot-clip-heldout/test.json \
    --output-dir artifacts/rawframe-model-clip-heldout \
    --architecture factorized_3d_cnn_spatiotemporal'
```

If the preflight passes, relaunch the same controlled clip-heldout training
command with a retained remote log under `/home/shadeform/asl-pilot/logs/`.
Record the PID. If it completes during the slice, copy back artifacts and
SHA-256 hashes. If it is still running, commit a numbered session log with the
PID, log path, GPU/process status, and the next monitor command.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and `node scripts/audit_loop_premise.mjs --json` exits 0.
2. `node scripts/audit_source_register.mjs` exits 0.
3. `brev ls --json` identifies the existing `asl-pilot-rawframe-001` worker as
   `RUNNING`, `READY`, and `HEALTHY`; no duplicate worker is created.
4. The approval gate is treated as satisfied; session 175's approval-only
   blocker is not repeated.
5. WLASL selected diagnostic manifests are decoded with existing
   no-pretrained raw RGB tooling and replay-verified.
6. The controlled clip-heldout train/validation/test manifests have zero WLASL
   supplement clips missing `relative_frame_tensor_path`, `frame_tensor_sha256`,
   or `frame_tensor_provenance`.
7. The remediated ignored `data/manifests` and WLASL `data/tensors` outputs are
   copied back locally before commit so future `scripts/brev_sync_repo.sh`
   invocations do not delete the worker's WLASL decode outputs.
8. The controlled clip-heldout dry-run/check-files preflight passes without
   `--allow-small-label-set`.
9. The controlled clip-heldout training command is relaunched with retained
   remote stdout/stderr and a recorded PID, or completes with copied-back
   artifacts and local SHA-256 hashes.
10. The session log records the manual stop command
    `brev stop asl-pilot-rawframe-001`, but the command is not run.
11. No prohibited work occurs in this slice.

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
- Do not treat the missing WLASL tensor fields as a human blocker; use the
  decode/export remediation path above unless a command reports a real
  undecodable file, sync failure, or worker failure.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3Z WLASL tensor remediation and Brev relaunch.
Completed:            <decode/re-export/preflight/relaunch evidence>.
Evidence:             <commands, before/after missing counts, copied-back paths, remote log/PID, artifacts/hashes, Brev status>.
Remaining:            <monitor/retrieve/evaluate, or exact remediation blocker>.
Blockers:             <none, or exact worker/sync/decode/training blocker>.
Next step:            <one concrete monitor/retrieve/evaluate action>.
Checkpoint commit:    <commit hash>.
```
