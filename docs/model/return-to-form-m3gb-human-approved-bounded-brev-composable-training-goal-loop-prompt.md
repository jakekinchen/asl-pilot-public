# Return-To-Form M3GB Human-Approved Bounded Brev Composable Training Goal Loop Prompt

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded retained-worker Brev training/evaluation/copyback slice
for the existing ASL Citizen high-signal region-grid TCN route, then shut the
worker back down and record the evidence. This mission exists because the
latest supervising-user instruction explicitly supersedes the M3GA no-spend
metadata paperwork path and asks to unblock Brev usage while keeping the pair
on the composable ML completion track.

This is not a model-card promotion, browser recognition activation, Detector 0
training lane, broad vocabulary run, hyperparameter search, final-readiness
claim, or ASL-correctness claim.

## Source Of Truth

1. Latest supervising-user instruction in the active thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3GB.
3. This prompt.
4. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
5. Recent evidence:
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
   - [`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](../validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`](../validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json)
   - [`output/m3er-high-signal-region-grid-tcn-brev/validation-report.json`](../../output/m3er-high-signal-region-grid-tcn-brev/validation-report.json), if present locally.
6. Brev state from `brev ls --json` and price evidence from
   `brev search --stoppable --min-vram 40 --sort price --json`.
7. Existing repo audits and receipts. Do not create a parallel audit system.

## Starting Evidence

- M3FZ completed a local/no-spend error-pattern contract and selected M3GA
  metadata-gap paperwork, but the latest human instruction now selects a more
  direct supervised compute path.
- M3FY found a concrete residual: `hello` held-out recall was `1.0`, `table`
  held-out recall was `0.5`, and two `table` examples collapsed to confident
  `hello`.
- Earlier M3ER/M3EV evidence proved the retained worker can run the region-grid
  TCN path, but that route stayed diagnostic and unpromoted.
- The supervisor activation commit adds the M3GB output namespace to the local
  `--region-grid-tcn-training-smoke` output-dir guard. Do not patch the
  training script again inside this mission.
- Browser/model claim surfaces remain fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Authorization And Compute Envelope

```json
{
  "brev_spend_authorized": true,
  "approval_source": "latest supervising-user instruction to get the pair going again, continue the work, and unblock Brev under oversight",
  "workspace": "asl-pilot-m3eh-l40s-001",
  "workspace_id": "3d58wpy9o",
  "instance_type": "l40s-48gb.1x",
  "gpu": "L40S",
  "current_listed_price_per_hour_usd": 1.74,
  "price_command": "brev search --stoppable --min-vram 40 --sort price --json",
  "price_observed_at_utc": "2026-05-29T05:00:04Z",
  "max_training_runtime_seconds": 4800,
  "max_wall_time_after_first_start_minutes": 90,
  "max_expected_spend_usd": 5,
  "project_total_compute_budget_usd": 250,
  "timed_training_command_limit": 1,
  "new_workers": 0,
  "worker_delete_or_reset": 0,
  "package_install_commands": 0,
  "expected_metric_signal": "training provenance with epoch metrics, loss movement, selected checkpoint, validation/test report if checkpoint and provenance exist",
  "kill_conditions": [
    "GOAL.md does not point at this prompt",
    "retained worker name/id/type does not match",
    "CUDA unavailable or CPU fallback",
    "unexpected GPU training process already using memory",
    "duplicate training process",
    "remote checkout cannot be synced current with the existing helper",
    "remote dry-run/check-files fails after sync",
    "timed training command hits timeout",
    "no startup plan or metric output after launch",
    "Brev provider state cannot be safely stopped"
  ]
}
```

Use only the retained worker. Do not create, delete, reset, resize, or replace
any worker. Do not install packages or mutate dependency files.

## Required Slice

Complete one remote training attempt in this order:

1. Verify local state, local audits, claim surfaces, active prompt, and current
   Brev provider state.
2. Refresh price evidence and confirm `brev ls --json` still shows the
   retained worker as the only ASL Pilot worker for this mission.
3. Start only `asl-pilot-m3eh-l40s-001` if it is stopped. Abort and stop if it
   does not become ready/healthy within the envelope.
4. Run one remote safety probe for `nvidia-smi`, training-like processes, remote
   `$HOME`, and project-venv CUDA torch. A base Brev `jupyter-lab` process is
   not a blocker if it is not using the GPU and no training/torch process is
   active.
5. Run `bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001` exactly once
   before training. Verify local/remote hashes for `GOAL.md`, this prompt,
   `scripts/train_rawframe_model.py`, `scripts/evaluate_rawframe_model.py`,
   and the three high-signal region-grid manifests. Also verify that remote
   `output/m3gb-high-signal-region-grid-tcn-brev` does not already exist
   before the non-dry-run command.
6. Run the remote dry-run/check-files command once after sync.
7. Run exactly one timed non-dry-run training command.
8. If checkpoint and training provenance exist, run evaluation once.
9. Copy back the remote output directory only if it exists.
10. Stop the worker and verify final `brev ls --json` reports `STOPPED`.
    If normal stop returns but the worker still reports `RUNNING`, retry stop
    by workspace id and then `brev stop --all`. Do not delete or reset.
11. Write the tracked M3GB receipt and numbered session log, then commit only
    scoped code, prompt/GOAL/plan, receipt/log, and intentionally tracked JSON
    evidence files. Do not push.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
```

Local dry-run guard for the new M3GB output namespace:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gb-high-signal-region-grid-tcn-brev --model-id m3gb-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

Remote safety check:

```sh
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && printf 'remote_home=%s\n' \"\$HOME\" && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true && .venv/bin/python - <<'PY'
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

Remote freshness and output-absence check:

```sh
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && git rev-parse --short HEAD && sha256sum GOAL.md docs/model/return-to-form-m3gb-human-approved-bounded-brev-composable-training-goal-loop-prompt.md scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py data/manifests/lesson/high-signal-region-grid/train.json data/manifests/lesson/high-signal-region-grid/validation.json data/manifests/lesson/high-signal-region-grid/test.json && test ! -e output/m3gb-high-signal-region-grid-tcn-brev"
```

Remote dry-run:

```sh
timeout 420s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gb-high-signal-region-grid-tcn-brev --model-id m3gb-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

Timed training command:

```sh
timeout 5400s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && timeout 4800 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gb-high-signal-region-grid-tcn-brev --model-id m3gb-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

The timed training command intentionally omits `--dry-run` and
`--require-input-contract`; the dry-run command above is the input-contract
gate.

Evaluation command, only when checkpoint and provenance exist:

```sh
timeout 1800s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3gb-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3gb-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

Copyback command, only after recording the remote home and confirming remote
output files exist:

```sh
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3gb-high-signal-region-grid-tcn-brev output/
```

If the remote safety check proves a different `$HOME`, use that exact absolute
path in the copyback command and record it in the receipt.

## Receipt

Write:

`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`

The receipt must include:

- authorization and compute envelope, including refreshed price evidence;
- local checks and fail-closed claim surfaces;
- initial Brev provider state, start result, process safety, and CUDA probe;
- sync command/result and file freshness hashes;
- dry-run command/status;
- exactly one timed training command/status, runtime, timeout status, printed
  training plan, training history if present, selected epoch if present,
  checkpoint/provenance paths and hashes if present, and exact failure if any;
- evaluation command/status or explicit skip reason;
- copyback command/status or explicit no-artifact reason;
- final Brev stop attempts and provider state;
- `pretrained_components: []`;
- all negative authorizations from this prompt;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_m3gb_artifact_audit_no_remote` if training, evaluation, and
  copyback complete and metrics justify a local artifact/claim audit.
- `continue_m3gb_metric_triage_no_remote` if training/evaluation complete but
  metrics are weak, collapsed, or fail the next gate.
- `continue_m3gb_eval_or_copyback_no_training` if training writes artifacts but
  evaluation or copyback is incomplete for an environmental reason.
- `continue_m3gb_local_contract_repair_no_remote` if training is blocked before
  the timed command by a precise local command/guard mismatch.
- `continue_detector0_or_crop_proxy_contract_after_m3gb` if metrics strengthen
  the crop/coverage-blind-spot hypothesis and the next useful move is Detector
  0 or crop-proxy work.
- `continue_fail_closed_interactive_product_hardening` if this route is not
  promising enough for another immediate ML slice and product interactivity is
  the best deadline move.
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence` if another audited
  learning failure repeats without a clear local repair.
- `stop_for_brev_provider_or_budget_blocker` if provider, stop verification, or
  budget state blocks safe continuation.

## Hard Boundaries

- Exactly one timed training command. If it fails, do not patch source and
  retry inside M3GB.
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

1. `GOAL.md` points at this prompt and names Mission 3GB.
2. Required local checks pass or exact blockers are recorded.
3. The retained worker identity, price, start/safety/CUDA/sync/dry-run state,
   and default-off teardown are recorded.
4. Exactly one timed training command is run, or the receipt records the exact
   pre-training blocker that prevented it.
5. Evaluation and copyback either run from existing checkpoint/provenance
   artifacts or record precise skip reasons.
6. The receipt exists at
   `docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`.
7. No forbidden source, dependency, product, worker, promotion, broad-label, or
   pretrained/generated-label action occurs.
8. A numbered session log records commands, evidence, metrics or exact failure,
   artifact locations or no-artifact reason, Brev status, changed files,
   blockers, and exactly one next action.

## Observer Guidance

- CONTINUE if M3GB stays inside the compute envelope, verifies default-off
  state, preserves fail-closed claims, and selects one bounded next action.
- NUDGE if the receipt misses compute-envelope, price, process-safety, sync,
  CUDA, dry-run, training/evaluation/copyback, claim-surface, teardown, or next
  action evidence.
- REDIRECT if the executor changes architecture/input/budget without evidence,
  patches source to retry inside the same remote slice, or drifts into product
  activation/promotion.
- STOP if Brev cannot be controlled safely, budget/provider state is unclear,
  or the next action needs fresh human approval.
- ESCALATE if another audited learning failure repeats and no current local
  evidence explains the failure.
