# Return-To-Form Region-Grid TCN Brev Smoke After 5D Fix Goal Loop Prompt

Mission 3DQ prompt for the Codex executor after Mission 3DP fixed the local
5D region-grid mild-augmentation failure that stopped the previous Brev smoke.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded remote high-signal region-grid
`true_temporal_convnet_region_grid` smoke on the existing Brev A100 worker after
the 5D augmentation fix.

This mission is a compute-approved retry of the M3DO smoke, not a broad
training campaign. It may spend Brev compute only within the envelope below,
and it must produce an evidence receipt whether training passes, fails,
times out, or cannot start.

This is not model-card promotion, ONNX export, browser activation, final
readiness, or an ASL-correctness claim.

## Authorization And Compute Envelope

Latest supervising-user instruction authorizes getting the pair moving again
after observer STOP 472. The larger overnight budget remains bounded by the
existing project budget, but this mission may spend only this slice:

```json
{
  "brev_spend_authorized": true,
  "workspace": "asl-pilot-rawframe-001",
  "workspace_id": "2hl1hytty",
  "max_training_runtime_seconds": 2700,
  "max_spend_usd": 25,
  "timed_training_command_limit": 1,
  "kill_conditions": [
    "CUDA unavailable",
    "existing worker unavailable after bounded start/wait",
    "duplicate training process",
    "GPU memory unexpectedly in use by another training process",
    "CPU-only training fallback",
    "timeout",
    "no startup plan or metric output after launch",
    "same 5D augmentation failure repeats before epoch metrics"
  ]
}
```

Use the existing worker. Do not create a duplicate worker. If `brev ls --json`
reports the existing worker as stopped or paused, you may run a bounded
`brev start asl-pilot-rawframe-001` / wait check for this existing worker only.
Do not delete or reset the worker without explicit human approval.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DP receipt:
   [`docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json`](../validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json).
4. Mission 3DP session log:
   [`docs/session-logs/471-mission-3dp-region-grid-tcn-5d-augmentation-diagnosis.md`](../session-logs/471-mission-3dp-region-grid-tcn-5d-augmentation-diagnosis.md).
5. Observer STOP 472:
   [`docs/session-logs/472-observer-stop-brev-smoke-approval.md`](../session-logs/472-observer-stop-brev-smoke-approval.md).
6. Mission 3DO receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json).
7. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Run one remote smoke attempt with this order:

1. Verify local state and no-pretrained/source boundaries.
2. Record Brev provider state.
3. Check the existing worker for CUDA and duplicate training processes.
4. Sync the current repo/data allowlist to the existing worker.
5. Run the remote full-split dry-run once.
6. Run exactly one timed remote training command.
7. If and only if checkpoint and training provenance exist, run evaluation.
8. Copy back remote output artifacts if they exist; otherwise record why none
   exist.
9. Run default-off Brev handling: process check, stop by name, stop by id,
   optionally `brev stop --all`, final `brev ls --json`, and record if the
   provider still reports `RUNNING`.
10. Write the receipt and session log, commit them, and do not push.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Remote safety check:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true"
```

Sync:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
```

Remote dry-run:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

Timed training command:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 2700 /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --require-input-contract rgb_regions_grid_v1"
```

Evaluation command, only when checkpoint and provenance exist:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3dq-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3dq-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3dq-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3dq-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3dq-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

Copyback command, only when remote output files exist:

```sh
brev copy asl-pilot-rawframe-001:/home/shadeform/asl-pilot/output/m3dq-high-signal-region-grid-tcn-brev output/
```

## Boundaries

- Exactly one timed training command. If it fails, do not patch source and
  retry inside this mission.
- No broad 75/80/95-label work.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, ONNX export, browser
  trained activation, threshold promotion, final-readiness claim, positive
  ASL-correctness claim, raw learner-video upload, push, amend, no-verify,
  duplicate worker, worker delete, or worker reset.
- No hand-editing promoted model cards or final claim matrices from this smoke.
- No evaluation unless checkpoint and training provenance are present.
- No copyback claim unless the copied local files are listed.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json`

The receipt must include:

- authorization and compute envelope;
- local checks;
- initial Brev provider state and process safety;
- sync status;
- remote dry-run command/status;
- timed training command/status, runtime, timeout status, printed plan,
  training history if present, selected epoch if present, and exact failure
  if any;
- evaluation command/status or explicit skip reason;
- copyback command/status or explicit no-artifact reason;
- final Brev process/provider state and stop attempts;
- `pretrained_components: []`;
- all negative authorizations from Boundaries;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_evaluate_or_package_m3dq_artifacts` if training completes,
  evaluation or copyback is incomplete for an environmental reason, and
  artifacts exist.
- `continue_tcn_metric_triage_after_m3dq` if training and evaluation complete
  but metrics fail the next gate or are weak.
- `continue_local_tcn_failure_diagnosis_after_m3dq` if training fails before
  usable epoch metrics again.
- `continue_product_or_reduced_claim_after_m3dq` if training/evaluation show
  the route is not promising and no immediate source/input bug remains.
- `escalate_strategy_research` if another audited learning failure repeats
  without a clear local repair.
- `stop_for_human_cost_control_review` if provider/cost state becomes the
  blocker.

## Session Log

Write:

`docs/session-logs/473-mission-3dq-region-grid-tcn-brev-smoke-after-5d-fix.md`

The log must include commands, evidence, metrics or exact failure, artifact
locations or no-artifact reason, Brev default-off result, blockers, changed
files, and exactly one next action.
