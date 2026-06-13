# Return-To-Form M3GL Brev Provider Recovery And Completion Route Goal Loop Prompt

Mission 3GL prompt for the Codex executor after M3GK stopped before remote
sync/training because the retained Brev worker failed the SSH safety probe.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Recover safe Brev access and run one bounded high-signal region-grid TCN
completion attempt, or record the exact provider/setup blocker before any
training occurs.

The larger project goal remains a browser-first, interactive ASL lesson product
with a scratch-trained recognizer path and no pretrained promoted-lane model
dependencies. This mission is one infrastructure-and-model-evidence slice on
that path. It is not final readiness, not model-card promotion, not browser
recognition activation, and not permission to sweep architectures blindly.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GK provider blocker evidence:
   - [`docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json`](../validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json)
   - [`docs/session-logs/635-mission-3gk-bounded-brev-completion-route-after-regenerated-evidence.md`](../session-logs/635-mission-3gk-bounded-brev-completion-route-after-regenerated-evidence.md)
   - [`docs/session-logs/636-observer-stop-m3gk-brev-provider-safety-review.md`](../session-logs/636-observer-stop-m3gk-brev-provider-safety-review.md)
5. M3GJ regenerated evaluator evidence:
   - [`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](../validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
   - [`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`](../session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md)
6. M3GB Brev baseline:
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
7. Current strategy memos for repeated-learning and Detector 0 direction:
   - [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
   - [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
8. Training/evaluation/sync code:
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`
   - `scripts/brev_sync_repo.sh`
   - `requirements.txt`
9. High-signal region-grid manifests:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
10. Fail-closed claim surfaces:
    - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
    - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
    - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
    - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
    - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Authorization And Compute Envelope

```json
{
  "brev_spend_authorized": true,
  "approval_source": "latest supervising-user instruction plus M3GK human/provider review continuation",
  "primary_workspace": "asl-pilot-m3eh-l40s-001",
  "primary_workspace_id": "3d58wpy9o",
  "replacement_workspace": "asl-pilot-m3gl-l40s-001",
  "preferred_instance_types": [
    "l40s-48gb.1x",
    "gpu-l40s-a.1gpu-16vcpu-64gb",
    "gpu-l40s-a.1gpu-8vcpu-32gb",
    "g6e.2xlarge"
  ],
  "price_command": "brev search --stoppable --min-vram 40 --sort price --json",
  "price_guard_usd_per_hour": 5,
  "max_wall_time_after_first_start_minutes": 180,
  "max_training_runtime_seconds": 7200,
  "max_expected_spend_usd": 15,
  "project_total_compute_budget_context_usd": 250,
  "timed_training_command_limit": 1,
  "evaluation_command_limit": 1,
  "new_worker_limit": 1,
  "worker_reset_limit": 1,
  "remote_environment_bootstrap_limit": 2,
  "package_install_scope": "prefer python3 -m venv .venv --system-site-packages plus onnx/onnxscript only; run .venv/bin/python -m pip install -r requirements.txt at most once only if torch is missing",
  "output_dir": "output/m3gl-high-signal-region-grid-tcn-brev-seed20260530",
  "model_id": "m3gl-high-signal-region-grid-tcn-brev-seed20260530",
  "seed": 20260530,
  "expected_metric_signal": "training history, selected checkpoint, validation/test report, v2 prediction sidecar, and comparison against M3GB/M3GJ metrics"
}
```

## Hard Limits

- Do not push.
- Do not run more than one non-dry-run training command.
- Do not run a broad 75/80/95-label sweep.
- Do not train Detector 0 in this mission.
- Do not import sources/media, mutate source approvals, mutate manifests,
  mutate tensors, or mutate vocabulary.
- Do not inspect raw videos manually or send official frames/video/thumbnails to
  any GPT/VLM/API.
- Do not use pretrained detectors, landmarks, feature extractors, backbones,
  embeddings, generated labels, or pseudo-labels in the promoted lane.
- Do not export, promote, activate browser recognition, weaken final gates,
  edit final claim surfaces to claim readiness, or change product runtime.
- Do not create more than one replacement worker.
- Do not delete any worker unless a later human instruction explicitly says so.
- Always stop all ASL Pilot Brev workers you started before ending, unless a
  remote command is still actively running inside this exact approved envelope
  and you record its process evidence.

## Required Slice

Complete exactly one M3GL slice in this order.

1. Verify local state:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
git diff --check
```

2. Patch only the local smoke output namespace guard in
   `scripts/train_rawframe_model.py`, if needed, so
   `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530` is an allowed
   `--region-grid-tcn-training-smoke` output directory. Do not change
   architecture, data loading, evaluator math, final/promoted output policy,
   claim surfaces, dependencies, manifests, tensors, or vocabulary.

3. Run the local dry-run/check-files guard:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gl-high-signal-region-grid-tcn-brev-seed20260530 --model-id m3gl-high-signal-region-grid-tcn-brev-seed20260530 --seed 20260530 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

If this dry-run fails, do not start Brev. Record the blocker, preserve
default-off state, write the M3GL receipt/log, and select
`continue_m3gm_dataset_vocab_model_input_strategy_no_brev`.

4. Recover or replace Brev access:

   - Refresh price and current worker state.
   - If `asl-pilot-m3eh-l40s-001` is `STOPPED` and not `HEALTHY`, run exactly
     one reset:

```sh
brev reset 3d58wpy9o
```

   - Wait and poll `brev ls --json` until either the worker is `RUNNING` /
     `READY` or the command has consumed 15 minutes.
   - If reset does not make the retained worker SSH-ready, stop it and create
     exactly one replacement worker named `asl-pilot-m3gl-l40s-001` using only
     a currently listed instance type at or below `$5/hour`. Prefer the first
     available type from the compute envelope. Record the exact create command
     and price evidence.
   - If neither retained nor replacement worker becomes SSH-ready within the
     envelope, stop any worker you started, write the receipt/log, and select
     `stop_for_brev_provider_or_auth_repair`.

5. Run one remote safety check against the selected worker:

```sh
timeout 420s brev exec SELECTED_WORKER "cd \$HOME && printf 'remote_home=%s\n' \"\$HOME\" && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true && test -d asl-pilot || true && test -x asl-pilot/.venv/bin/python || true"
```

A base Brev `jupyter-lab` process is not a blocker if it is not using GPU and
no training/torch process is active.

6. Sync once:

```sh
bash scripts/brev_sync_repo.sh SELECTED_WORKER
```

7. Replace `SELECTED_WORKER` in the command templates below with the worker
   name actually selected in step 4. If `.venv/bin/python` is missing or cannot
   import `torch`, run the primary remote bootstrap first. This preserves any
   system CUDA-enabled torch install exposed by the Brev image.

```sh
timeout 1200s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && python3 -m venv .venv --system-site-packages && .venv/bin/python -m pip install --upgrade pip && .venv/bin/python -m pip install onnx==1.21.0 onnxscript==0.7.0 && .venv/bin/python - <<'PY'
import json, torch
payload = {
  'torch': torch.__version__,
  'cuda_available': bool(torch.cuda.is_available()),
  'device_count': int(torch.cuda.device_count()),
  'device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
}
print(json.dumps(payload, sort_keys=True))
raise SystemExit(0 if torch.cuda.is_available() else 2)
PY"
```

If the primary bootstrap fails because torch is missing, run the exact
requirements fallback once and then require CUDA proof again:

```sh
timeout 2400s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && .venv/bin/python -m pip install -r requirements.txt && .venv/bin/python - <<'PY'
import json, torch
payload = {
  'torch': torch.__version__,
  'cuda_available': bool(torch.cuda.is_available()),
  'device_count': int(torch.cuda.device_count()),
  'device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
}
print(json.dumps(payload, sort_keys=True))
raise SystemExit(0 if torch.cuda.is_available() else 2)
PY"
```

Do not install any package outside `requirements.txt`,
`onnx==1.21.0`, and `onnxscript==0.7.0`.

8. Run remote hash, CUDA, venv, and output-absence checks:

```sh
timeout 420s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && sha256sum GOAL.md docs/model/return-to-form-m3gl-brev-provider-recovery-and-completion-route-goal-loop-prompt.md scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py data/manifests/lesson/high-signal-region-grid/train.json data/manifests/lesson/high-signal-region-grid/validation.json data/manifests/lesson/high-signal-region-grid/test.json && .venv/bin/python - <<'PY'
import torch
print('torch', torch.__version__)
print('cuda_available', torch.cuda.is_available())
print('device_count', torch.cuda.device_count())
print('device_name', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')
raise SystemExit(0 if torch.cuda.is_available() else 3)
PY
test ! -e output/m3gl-high-signal-region-grid-tcn-brev-seed20260530"
```

9. Run exactly one remote dry-run/check-files command:

```sh
timeout 600s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gl-high-signal-region-grid-tcn-brev-seed20260530 --model-id m3gl-high-signal-region-grid-tcn-brev-seed20260530 --seed 20260530 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

10. Run exactly one timed non-dry-run training command:

```sh
timeout 7800s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && timeout 7200 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gl-high-signal-region-grid-tcn-brev-seed20260530 --model-id m3gl-high-signal-region-grid-tcn-brev-seed20260530 --seed 20260530 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

11. If checkpoint and training provenance exist, run evaluation once:

```sh
timeout 1800s brev exec SELECTED_WORKER "cd \$HOME/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/model_state.pt --training-provenance output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/validation-report.json --calibrated-provenance output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/calibrated-provenance.json --prediction-sidecar output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

An evaluator exit of `1` because targets fail is useful diagnostic evidence,
not a reason to retry.

12. Copy back the remote output directory only if it exists:

```sh
brev copy SELECTED_WORKER:/home/ubuntu/asl-pilot/output/m3gl-high-signal-region-grid-tcn-brev-seed20260530 output/
```

If the remote safety check proves a different `$HOME`, use that exact absolute
path in the copyback command and record it in the receipt.

13. Stop any ASL Pilot worker started by this mission and verify default-off:

```sh
brev stop SELECTED_WORKER
sleep 10
brev ls --json
```

If a worker still reports `RUNNING`, retry by workspace id, then `brev stop
--all`. Do not delete the worker.

## Receipt

Write:

`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`

The receipt must include:

- current commit and active prompt;
- user approval summary and compute envelope;
- M3GK provider blocker summary;
- M3GJ/M3GB metric baselines for comparison;
- local output-guard patch summary, if any;
- selected worker name/id/type/provider and whether it was retained, reset, or
  replacement;
- commands run and exit statuses;
- refreshed price evidence and Brev provider states before/reset/start/create/
  after/stop;
- remote CUDA/process/venv evidence;
- sync and remote file-hash evidence;
- local and remote dry-run results;
- exactly one timed training command/status, runtime, timeout status, selected
  epoch, training history, checkpoint/provenance hashes if present;
- one evaluation command/status or explicit skip reason;
- copied-back ignored output hashes if present;
- final stop/default-off proof;
- fail-closed claim-surface status;
- forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_m3gm_metric_triage_and_dataset_vocab_strategy_no_brev` if M3GL
  produces diagnostic model/evaluator evidence but gates do not justify
  promotion.
- `continue_m3gm_export_promotion_readiness_receipt_no_activation` only if all
  target gates pass and claim surfaces remain unmodified pending a separate
  human-reviewed promotion.
- `continue_m3gm_dataset_vocab_model_input_strategy_no_brev` if local or
  remote dry-run/setup evidence shows the current dataset/input route is the
  blocker.
- `stop_for_brev_provider_or_auth_repair` if Brev reset/replacement cannot
  reach a CUDA-ready SSH state inside the envelope.

Do not select a broad training retry, Detector 0 training, model-card
promotion, browser activation, or final readiness as the next action from this
mission.

## Acceptance Criteria

Mission 3GL is accepted only if:

1. The active prompt is this file and `GOAL.md` is not stopped at mission start.
2. Local audits and JSON checks are run and recorded.
3. The M3GK provider blocker is explicitly addressed by one reset-or-replace
   recovery path, not ignored.
4. No more than one worker reset and one replacement worker creation occur.
5. Remote training starts only after price, CUDA, venv, sync, hash, output
   absence, and remote dry-run guards pass.
6. No more than one non-dry-run training command runs.
7. Evaluation and copyback occur at most once and only if artifacts exist.
8. All workers touched by this mission are stopped/default-off before the
   executor exits unless an approved remote command is still running and has
   live process evidence in the receipt.
9. Claim surfaces remain fail-closed unless a later promotion receipt changes
   them.
10. A numbered session log and tracked receipt exist, or the exact blocker is
    recorded with enough evidence for the observer to choose STOP/REDIRECT.

## Observer Guidance

- CONTINUE only if the executor stayed inside the compute envelope, produced a
  receipt/log, and selected exactly one allowed next action.
- NUDGE if the receipt is missing worker state, price, setup, CUDA, command
  status, copyback, or default-off proof but the mission is otherwise in scope.
- REDIRECT if evidence shows the high-signal region-grid TCN route remains
  unproductive; route to dataset/vocabulary/model-input strategy before more
  compute.
- ESCALATE before another training-style spend if M3GL fails to learn and no
  current API/GPT strategy memo covers the exact failure evidence.
- STOP if Brev cannot be made safely controllable, a worker remains running
  outside the approved envelope, or a forbidden action occurs.
