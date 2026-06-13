# Return-To-Form M3ET Bounded Brev TCN Training Smoke After M3ES Contract Fix Goal Loop Prompt

Mission 3ET prompt for the Codex executor after Mission 3ES repaired the local
M3ER region-grid TCN output-dir contract and proved the intended local dry-run.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded remote `true_temporal_convnet_region_grid` training
smoke on the retained Brev worker after the M3ES local contract fix, then
evaluate and copy back artifacts only if they exist. This is a training-smoke
evidence slice, not a model-card promotion, browser activation, Detector 0
buildout, broad vocabulary run, final readiness claim, or ASL-correctness
claim.

## Starting Evidence

- M3ES executor commit `a9e5eba` wrote
  [`docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json`](../validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json)
  and selected `continue_bounded_brev_tcn_training_smoke_after_m3es_contract_fix`.
- M3ES added explicit local policy for
  `output/m3er-high-signal-region-grid-tcn-brev` in
  [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py),
  preserved the M3AW capped local branch and M3DM/M3DQ/M3EH full-split
  behavior, and proved local dry-run compatibility for M3AW, M3DM, M3DQ, M3EH,
  and M3ER.
- M3ER previously proved the retained worker can start, sync, run CUDA torch
  `2.12.0+cu126` on one `NVIDIA L40S`, and reach the remote dry-run gate, but
  stopped before training because the M3ER output namespace was not yet
  accepted.
- M3ES verified read-only Brev state as `STOPPED` / `COMPLETED` /
  `NOT READY` / `HEALTHY`.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Authorization And Compute Envelope

This prompt converts the supervising user's renewed overnight Brev objective,
the active `GOAL.md` handoff, the M3ES selected next action, and the still-unused
M3ER timed-training allowance into one narrow compute receipt. If `GOAL.md` no
longer points at this prompt or the retained worker identity differs, stop
before spending.

```json
{
  "brev_spend_authorized": true,
  "approval_source": "latest supervising-user overnight objective captured in GOAL.md plus M3ES selected next action after local dry-run contract fix",
  "workspace": "asl-pilot-m3eh-l40s-001",
  "workspace_id": "3d58wpy9o",
  "instance_type": "l40s-48gb.1x",
  "gpu": "L40S",
  "current_listed_price_per_hour_usd": 1.74,
  "price_command": "brev search --stoppable --min-vram 40 --sort price --json",
  "price_observed_at_utc": "2026-05-28T18:53:13Z",
  "max_training_runtime_seconds": 2700,
  "max_wall_time_after_first_start_minutes": 60,
  "max_expected_spend_usd": 4,
  "timed_training_command_limit": 1,
  "new_workers": 0,
  "worker_delete_or_reset": 0,
  "package_install_commands": 0,
  "expected_metric_signal": "training provenance with epoch metrics, loss movement, checkpoint selection, and evaluation metrics if checkpoint/provenance exist",
  "kill_conditions": [
    "GOAL.md does not point at this prompt",
    "retained worker name/id/type does not match",
    "CUDA unavailable or CPU fallback",
    "unexpected GPU training process already using memory",
    "duplicate training process",
    "remote checkout cannot be synced current with the existing helper",
    "remote hashes do not match after sync",
    "dry-run/check-files fails after sync",
    "timed training command hits timeout",
    "no startup plan or metric output after launch",
    "Brev provider state cannot be safely stopped"
  ]
}
```

Use only the retained worker. Do not create, delete, reset, or resize any
worker. Do not install packages or mutate dependency files during M3ET.

## Required Slice

Run one remote training-smoke attempt in this order:

1. Verify local state, local audits, claim surfaces, M3ES receipt, and current
   Brev provider state.
2. Confirm `brev ls --json` still shows only the retained ASL Pilot L40S worker
   for this mission and that it is safe to start.
3. Confirm current price evidence with
   `brev search --stoppable --min-vram 40 --sort price --json`.
4. Start only `asl-pilot-m3eh-l40s-001` if it is stopped. Abort and stop if the
   worker does not become ready/healthy inside the envelope.
5. Run one remote safety probe for `nvidia-smi`, training-like processes, and
   `/home/ubuntu/asl-pilot/.venv/bin/python` CUDA torch. A base Brev
   `jupyter-lab` process is not a blocker if it is not using the GPU and no
   training/torch process is active.
6. Run `bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001` exactly once
   before training so the M3ES source-policy change, this prompt, `GOAL.md`, and
   receipt paths are on the remote checkout. Verify hashes for `GOAL.md`, this
   prompt, the M3ES receipt, `scripts/train_rawframe_model.py`, and
   `scripts/evaluate_rawframe_model.py`.
7. Run the remote dry-run/check-files command once after sync.
8. Run exactly one timed training command.
9. If checkpoint and training provenance exist, run evaluation once.
10. Copy back the remote output directory only if it exists.
11. Stop the worker and verify final `brev ls --json` reports it as
    `STOPPED`. If a normal stop returns but the worker still reports
    `RUNNING`, retry stop by workspace id and then `brev stop --all`; do not
    delete or reset.
12. Write the tracked M3ET receipt and numbered session log, then commit only
    scoped receipt/session-log files plus any copied evidence files that are
    intentionally tracked. Do not push.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
```

Remote safety check:

```sh
timeout 240s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true && .venv/bin/python - <<'PY'
import torch
print('torch', torch.__version__)
print('cuda_available', torch.cuda.is_available())
print('device_count', torch.cuda.device_count())
print('device_name', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')
PY"
```

Sync:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

Remote dry-run:

```sh
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

Timed training command:

```sh
timeout 3000s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && timeout 2700 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --require-input-contract rgb_regions_grid_v1"
```

Evaluation command, only when checkpoint and provenance exist:

```sh
timeout 1500s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3er-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3er-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3er-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3er-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3er-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

Copyback command, only when remote output files exist:

```sh
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3er-high-signal-region-grid-tcn-brev output/
```

## Receipt

Write:

`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`

The receipt must include:

- authorization and compute envelope, including price evidence;
- local checks and fail-closed claim surfaces;
- initial Brev provider state, start result, process safety, and CUDA probe;
- sync command/result and file freshness hashes;
- dry-run command/status;
- timed training command/status, runtime, timeout status, printed training plan,
  training history if present, selected epoch if present, checkpoint/provenance
  paths and hashes if present, and exact failure if any;
- evaluation command/status or explicit skip reason;
- copyback command/status or explicit no-artifact reason;
- final Brev stop attempts and provider state;
- `pretrained_components: []`;
- all negative authorizations from this prompt;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_m3et_artifact_audit_no_remote` if training, evaluation, and
  copyback complete and metrics justify a local artifact/claim audit.
- `continue_m3et_metric_triage_no_remote` if training/evaluation complete but
  metrics are weak, collapsed, or fail the next gate.
- `continue_m3et_eval_or_copyback_no_training` if training writes artifacts but
  evaluation or copyback is incomplete for an environmental reason.
- `continue_local_tcn_failure_diagnosis_after_m3et` if training fails before
  usable epoch metrics and a specific local contract repair is evident.
- `continue_fail_closed_interactive_product_hardening` if this route is not
  promising enough for another immediate ML slice and product interactivity is
  the best deadline move.
- `continue_openai_or_gpt_pro_research` if another audited learning failure
  repeats without a clear local repair.
- `stop_for_brev_provider_or_budget_blocker` if provider, stop verification, or
  budget state blocks safe continuation.

## Hard Boundaries

- Exactly one timed training command. If it fails, do not patch source and retry
  inside M3ET.
- No broad 75/80/95-label run, label expansion, architecture search,
  hyperparameter sweep, repeated retry, or Detector 0 training.
- No source/media import, source-register mutation, manifest/tensor/vocabulary/
  packet mutation, dependency-file mutation, generated labels, pseudo-labels,
  or raw learner video upload.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, duplicate worker, worker delete/reset, push, amend,
  or `--no-verify`.
- No evaluation unless checkpoint and training provenance are present.
- No copyback claim unless copied local files are listed and hashed.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3ET.
2. Required local checks pass or exact blockers are recorded.
3. The retained worker identity, price, start/safety/CUDA/sync/dry-run state,
   and default-off teardown are recorded.
4. Exactly one timed training command is run, or the receipt records the exact
   pre-training blocker that prevented it.
5. Evaluation and copyback either run from existing checkpoint/provenance
   artifacts or record precise skip reasons.
6. The receipt exists at
   `docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`.
7. No forbidden source, dependency, product, worker, promotion, broad-label, or
   pretrained/generated-label action occurs.
8. A numbered session log records commands, evidence, metrics or exact failure,
   artifact locations or no-artifact reason, Brev status, changed files,
   blockers, and exactly one next action.

## Session Log

Write:

`docs/session-logs/540-mission-3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix.md`

The log must include commands, evidence, metrics or exact failure, artifact
locations or no-artifact reason, Brev status, changed files, blockers, and
exactly one next action.
