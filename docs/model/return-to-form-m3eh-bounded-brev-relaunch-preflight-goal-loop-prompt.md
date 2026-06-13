# Return-To-Form M3EH Bounded Brev Relaunch Preflight Goal Loop Prompt

Mission 3EH prompt for the Codex executor after M3EG stopped for human
model-input strategy review. Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Relaunch the completion push with one bounded Brev preflight, not another blind
training retry. The user has now explicitly approved continuing the pair and
unblocking Brev usage under supervision. This mission should prove a fresh
stoppable GPU worker, repo/data sync, CUDA Python environment, and the exact
next training dry-runs before any timed fitting command.

This is not a timed training mission, source-import mission, model-card
promotion, ONNX export, browser activation, or final-readiness mission.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt and names M3EH.
3. M3EG receipt:
   [`docs/validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json`](../validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json).
4. M3EF receipt:
   [`docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json`](../validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json).
5. Existing CUDA/TCN evidence:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json)
   and
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json).
6. Current training script policy:
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
7. Pre-authored follow-on prompt:
   [`docs/model/return-to-form-m3ei-popsign-fresh5-bounded-brev-fit-goal-loop-prompt.md`](return-to-form-m3ei-popsign-fresh5-bounded-brev-fit-goal-loop-prompt.md).

## Current Approval And Compute Envelope

Current status: `authorized_for_bounded_brev_preflight`.

The user explicitly approved restarting the pair and unblocking Brev usage, with
the previously discussed project ceiling of 250 USD total. For M3EH, use only
this first tranche:

```text
workspace name: asl-pilot-m3eh-l40s-001
preferred type: l40s-48gb.1x
provider from current search: crusoe
stoppable: true
price observed by supervisor search: 1.74 USD/hour
M3EH max wall time after create: 90 minutes
M3EH max spend: 12 USD
timed training commands: 0
```

Allowed Brev commands in this mission:

```sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
brev create asl-pilot-m3eh-l40s-001 --type l40s-48gb.1x --stoppable --min-disk 128 --timeout 900
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
brev exec asl-pilot-m3eh-l40s-001 "<bounded setup/check/dry-run command>"
brev stop asl-pilot-m3eh-l40s-001
```

Do not create any second worker. Do not use a non-stoppable worker unless the
prompt is edited by a supervisor/human with a new delete/default-off rule. Do
not run `brev delete` or `brev reset` in M3EH. If stop fails, record the exact
provider state and select a cost-control next action.

## Required Slice

Complete exactly one preflight slice:

1. Verify local state:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Prove the two fresh local dry-runs still pass. These are preflight evidence
   only; they must not create model artifacts.

PopSign Fresh5 dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --output-dir output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit --model-id m3eh-popsign-fresh5-motion-region-token-brev-preflight --architecture scratch_motion_region_token_temporal_contract_v1 --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 20 --batch-size 4 --learning-rate 0.003 --optimizer adamw --weight-decay 0.01 --label-smoothing 0.05 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 32 --max-validation-batches 32 --popsign-fresh5-training-smoke --dry-run
```

High-signal region-grid TCN dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3eh-high-signal-region-grid-tcn-brev --model-id m3eh-high-signal-region-grid-tcn-brev-preflight --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

3. Record current Brev state with `brev ls --json`. If any workspace already
   exists, do not create a duplicate; inspect it and select a safe next action.

4. Create the single stoppable M3EH worker only if no workspace exists:

```sh
brev create asl-pilot-m3eh-l40s-001 --type l40s-48gb.1x --stoppable --min-disk 128 --timeout 900
```

5. Sync the repo/data allowlist:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

6. On the worker, create or validate `.venv`, install only what is needed, and
   prove CUDA. If CUDA is unavailable, stop the worker and record the blocker.
   Prefer preserving a system CUDA torch install:

```sh
brev exec asl-pilot-m3eh-l40s-001 "cd /home/shadeform/asl-pilot && python3 -m venv .venv --system-site-packages && .venv/bin/python -m pip install -U pip && .venv/bin/python -m pip install onnx==1.21.0 onnxscript==0.7.0 && .venv/bin/python - <<'PY'
import json
import torch
print(json.dumps({
  'torch': torch.__version__,
  'cuda_available': bool(torch.cuda.is_available()),
  'device_count': int(torch.cuda.device_count()),
  'device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
}))
raise SystemExit(0 if torch.cuda.is_available() else 2)
PY"
```

7. Run the same two remote dry-runs from step 2 using
   `/home/shadeform/asl-pilot/.venv/bin/python`.

8. Stop the worker after dry-runs unless a timed M3EI run is immediately
   started by a separate prompt in the same supervised cycle. Default behavior:

```sh
brev stop asl-pilot-m3eh-l40s-001
brev ls --json
```

9. Write the receipt:

`docs/validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json`

The receipt must include local dry-run status, Brev search/price evidence,
workspace lifecycle events, CUDA proof, sync status, remote dry-run statuses,
final Brev state, `pretrained_components: []`, commands intentionally not run,
negative authorizations, and exactly one next action.

10. Write a numbered session log and commit only scoped files.

## Allowed Next Actions

Select exactly one:

- `continue_m3ei_popsign_fresh5_bounded_brev_fit`
- `continue_remote_environment_repair_no_training`
- `continue_local_command_contract_repair_no_brev`
- `stop_for_brev_provider_cost_control`
- `escalate_strategy_research_before_training`

## Hard Boundaries

- No timed training command in M3EH.
- No broad 75/80/95/100-label run.
- No source import, media download, source-register mutation, manifest
  mutation, tensor mutation, vocabulary mutation, packet-row mutation,
  generated pseudo-labels, or SemLex media use.
- No pretrained detector, landmark, backbone, embedding, feature extractor,
  teacher-logit, YOLO, MediaPipe, OpenPose, CLIP, SAM, DINO,
  `from_pretrained`, `pretrained=True`, or similar shortcut.
- No checkpoint/model artifact, evaluation, copyback of model artifacts, ONNX
  export, model-card promotion, browser activation, final-readiness claim,
  ASL-correctness claim, raw learner video upload, push, amend, no-verify,
  duplicate worker, non-stoppable worker, worker delete, or worker reset.

## Observer Guidance

- CONTINUE to the pre-authored M3EI prompt only if local dry-runs, worker
  setup, CUDA proof, sync, remote dry-runs, and final Brev state are recorded.
- NUDGE if the receipt omits command output, price/worker state, CUDA proof,
  dry-run status, or final Brev state.
- REDIRECT if the executor starts timed training, creates a duplicate worker,
  overwrites old outputs, weakens no-pretrained/source boundaries, or proposes
  broad training.
- STOP if Brev provider/cost-control state is unsafe.
- ESCALATE before approving a training-style retry if remote dry-runs pass but
  the executor cannot state why the M3EI run tests a bounded premise rather
  than repeating failed local evidence.
