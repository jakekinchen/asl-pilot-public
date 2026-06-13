# Return-To-Form Region-Grid TCN M3DQ Brev Smoke After Input-Contract Fix Goal Loop Prompt

Mission 3DU prompt for the Codex executor after Mission 3DT diagnosed the M3DS
timed-command input-contract failure.

This prompt is active only while `GOAL.md` points at it. The current
supervising user objective reauthorized unblocking Brev usage and continuing
the completion push, and `GOAL.md` records that approval for this exact bounded
compute slice.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded remote high-signal region-grid
`true_temporal_convnet_region_grid` smoke on the existing Brev A100 worker,
using the fixed M3DQ output directory:

`output/m3dq-high-signal-region-grid-tcn-brev`

This is the corrected follow-on to M3DS. The remote dry-run still performs the
input-contract audit with:

```text
--dry-run --require-input-contract rgb_regions_grid_v1
```

The timed training command must not pass `--require-input-contract`, because
`scripts/train_rawframe_model.py` treats that flag as a no-training dry-run
audit.

This mission is not a broad training campaign, detector buildout, model-card
promotion, ONNX export, browser activation, final-readiness claim, or
ASL-correctness claim.

## Authorization And Compute Envelope

Current status: `authorized_for_one_bounded_attempt`.

This prompt authorizes only the commands in this file, on the existing worker,
inside the following envelope. It does not authorize broad training, sweeps,
duplicate workers, worker delete/reset, promotion, export, browser activation,
raw learner upload, or final readiness claims.

Proposed bounded compute envelope:

```json
{
  "brev_spend_authorized": true,
  "authorization_source": "Current supervising user objective plus GOAL.md Mission 3DU activation on 2026-05-28.",
  "workspace": "asl-pilot-rawframe-001",
  "workspace_id": "2hl1hytty",
  "max_training_runtime_seconds": 3600,
  "max_spend_usd": 35,
  "timed_training_command_limit": 1,
  "kill_conditions": [
    "CUDA unavailable",
    "existing worker unavailable after bounded start/wait",
    "duplicate training process",
    "GPU memory unexpectedly in use by another training process",
    "CPU-only training fallback",
    "timeout",
    "no startup plan or metric output after launch",
    "M3DQ output-dir guard failure repeats after sync",
    "5D augmentation failure repeats before epoch metrics",
    "input-contract dry-run-only guard repeats in the timed command"
  ]
}
```

Use the existing worker only. If `brev ls --json` reports it stopped or paused
after approval is recorded, a future executor may run a bounded
`brev start asl-pilot-rawframe-001` and wait for that existing worker only. Do
not create a duplicate worker. Do not delete or reset the worker without
explicit human approval.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. `GOAL.md`, if it points at this prompt.
3. Mission 3DT receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json`](../validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json).
4. Mission 3DT session log:
   [`docs/session-logs/480-mission-3dt-region-grid-tcn-m3ds-input-contract-command-diagnosis.md`](../session-logs/480-mission-3dt-region-grid-tcn-m3ds-input-contract-command-diagnosis.md).
5. Mission 3DS receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json).
6. Mission 3DR receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json).
7. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

After fresh approval is recorded, run one remote smoke attempt in this order:

1. Verify local state and no-pretrained/source boundaries.
2. Record Brev provider state.
3. Check the existing worker for CUDA, GPU memory use, and duplicate training
   processes.
4. Sync the current repo/data allowlist to the existing worker.
5. Run the remote full-split M3DQ dry-run once.
6. Run exactly one timed remote training command without
   `--require-input-contract`.
7. If and only if checkpoint and training provenance exist, run evaluation.
8. Copy back remote output artifacts if they exist; otherwise record why none
   exist.
9. Run default-off Brev handling: process check, stop by name, stop by id,
   optionally `brev stop --all`, final `brev ls --json`, and record if the
   provider still reports `RUNNING`.
10. Write the tracked receipt and numbered session log.
11. Commit only scoped receipt/session-log artifacts plus any necessary
   evidence files. Do not push.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json >/dev/null
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
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 3600 /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
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
  retry inside the same remote mission.
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
- No copyback claim unless copied local files are listed.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json`

The receipt must include authorization and compute envelope, local checks,
initial Brev provider state and process safety, sync status, remote dry-run
status, timed training command status/runtime/failure or metrics, evaluation
and copyback status, final Brev state and stop attempts,
`pretrained_components: []`, negative authorizations, changed files, and
exactly one next action.

Allowed next actions:

- `continue_m3dq_artifact_audit_and_product_packaging_no_remote` if training,
  evaluation, and copyback complete and metrics are worth local product/audit
  follow-up.
- `continue_m3dq_metric_triage_no_remote` if training/evaluation complete but
  metrics are weak or fail a next gate.
- `continue_eval_or_copyback_m3dq_artifacts` if training completes but
  evaluation or copyback is incomplete for an environmental reason.
- `continue_local_tcn_failure_diagnosis_after_input_contract_fix` if training
  fails before usable epoch metrics again and a specific local repair is
  evident.
- `continue_product_or_reduced_claim_after_input_contract_fix` if evidence says
  this route is not promising and no immediate source/input bug remains.
- `escalate_strategy_research` if another audited learning failure repeats
  without a clear local repair.
- `stop_for_human_cost_control_review` if provider/cost state becomes the
  blocker.

## Session Log

Write:

`docs/session-logs/482-mission-3du-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix.md`

The log must include commands, evidence, metrics or exact failure, artifact
locations or no-artifact reason, Brev default-off result, blockers, changed
files, and exactly one next action.
