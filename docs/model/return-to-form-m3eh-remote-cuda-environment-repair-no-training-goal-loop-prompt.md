# Return-To-Form M3EH-R Remote CUDA Environment Repair Goal Loop Prompt

Mission 3EH-R prompt for the Codex executor after M3EH proved the worker/sync
path but blocked before remote dry-runs because CUDA was unavailable in the
remote Python environment.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair the remote PyTorch/CUDA compatibility path without timed training. The
goal is to prove the stopped M3EH L40S worker can run CUDA from the intended
repo Python environment, then run the two M3EH remote dry-runs if CUDA is
available. This is still preflight work, not fitting or promotion.

This is not a timed training mission, source-import mission, model-card
promotion, ONNX export, browser activation, product-runtime mission, or
final-readiness mission.

## Starting Evidence

- M3EH wrote
  `docs/validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json`
  and selected `continue_remote_environment_repair_no_training`.
- Local audits and both local dry-runs passed in M3EH.
- M3EH created exactly one stoppable L40S worker:
  `asl-pilot-m3eh-l40s-001`.
- Repo/data allowlist sync eventually passed to `/home/ubuntu/asl-pilot`.
- Remote CUDA proof failed after installing repo `requirements.txt` because
  the repo-pinned `torch==2.12.0+cu130` wheel required a newer NVIDIA driver.
- `nvidia-smi` showed an L40S with driver `565.57.01`.
- Remote PopSign Fresh5 and high-signal region-grid TCN dry-runs were
  intentionally not run because CUDA proof failed.
- M3EH stopped the worker. Latest Brev state should be verified before any
  repair attempt.
- The existing M3EI bounded fit prompt is not active because its preconditions
  require CUDA and remote dry-runs to pass.

## Compute Envelope

Current status: `authorized_for_remote_cuda_environment_repair_no_training`.

Use the existing worker only:

```text
workspace: asl-pilot-m3eh-l40s-001
expected type: l40s-48gb.1x
expected provider: crusoe
M3EH-R max wall time after start: 45 minutes
M3EH-R max spend: 8 USD
timed training commands: 0
new workers: 0
```

Allowed Brev commands in this mission:

```sh
brev ls --json
brev start asl-pilot-m3eh-l40s-001
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
brev exec asl-pilot-m3eh-l40s-001 "<bounded setup/check/dry-run command>"
brev stop asl-pilot-m3eh-l40s-001
```

Do not create a second worker. Do not run `brev delete` or `brev reset`. If
the stopped worker cannot be safely restarted, or if provider state becomes
unsafe, stop and record a cost-control blocker.

## Required Slice

Complete exactly one repair slice:

1. Verify local state:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Inspect current Brev state:

```sh
brev ls --json
```

If `asl-pilot-m3eh-l40s-001` is not `STOPPED`, record the exact state and do
not start a duplicate worker.

3. Start only the existing stopped worker:

```sh
brev start asl-pilot-m3eh-l40s-001
```

4. Sync the current repo/data allowlist:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

5. Repair the remote Python environment narrowly. Do not edit repo
`requirements.txt`. The repair should install a PyTorch CUDA wheel compatible
with the worker driver instead of the incompatible `+cu130` wheel, then record
the exact installed `torch` version, CUDA build, driver, and device result.

The repair command may use a temporary remote constraints file or explicit
`pip install` arguments inside `/home/ubuntu/asl-pilot/.venv`; it must not
commit dependency changes unless a later human-approved prompt asks for that.
Do not run `pip install -r requirements.txt` after this repair because that
would reinstall the default incompatible `torch==2.12.0+cu130` wheel.

Preferred first repair attempt, based on the observed `565.57.01` driver and
local PyPI index probe for Linux cp310 wheels:

```sh
brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && .venv/bin/python -m pip install --force-reinstall --no-cache-dir --index-url https://download.pytorch.org/whl/cu126 'torch==2.12.0+cu126' && .venv/bin/python -m pip install --force-reinstall --no-cache-dir onnx==1.21.0 onnxscript==0.7.0"
```

If this fails because the stopped worker/provider image cannot support the
CUDA 12.6 wheel, stop the worker and record the exact blocker. Do not keep
trying unrelated torch/CUDA versions in the same slice unless the failure is a
transient download or dependency-resolution error with an obvious one-command
retry.

6. Prove CUDA from `/home/ubuntu/asl-pilot/.venv/bin/python`:

```sh
brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && .venv/bin/python - <<'PY'
import json
import torch
result = {
  'torch': torch.__version__,
  'cuda_available': bool(torch.cuda.is_available()),
  'device_count': int(torch.cuda.device_count()),
  'device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
}
print(json.dumps(result, sort_keys=True))
raise SystemExit(0 if result['cuda_available'] else 2)
PY"
```

7. If CUDA proof passes, run the same two M3EH remote dry-runs. They must be
dry-runs only and must not save model artifacts.

PopSign Fresh5 remote dry-run:

```sh
brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && /home/ubuntu/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --output-dir output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit --model-id m3eh-popsign-fresh5-motion-region-token-brev-preflight --architecture scratch_motion_region_token_temporal_contract_v1 --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 20 --batch-size 4 --learning-rate 0.003 --optimizer adamw --weight-decay 0.01 --label-smoothing 0.05 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 32 --max-validation-batches 32 --popsign-fresh5-training-smoke --dry-run"
```

High-signal region-grid TCN remote dry-run:

```sh
brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && /home/ubuntu/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3eh-high-signal-region-grid-tcn-brev --model-id m3eh-high-signal-region-grid-tcn-brev-preflight --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

8. Stop the worker and verify provider state:

```sh
brev stop asl-pilot-m3eh-l40s-001
brev ls --json
```

If stop propagation is delayed, wait once and re-check. Do not delete or reset
without explicit human approval.

9. Write the receipt:

`docs/validation/return-to-form-m3eh-remote-cuda-environment-repair-v1.json`

The receipt must include start/stop state, CUDA repair commands, installed
torch/CUDA/driver proof, remote dry-run statuses or exact blockers, final Brev
state, `pretrained_components: []`, commands intentionally not run, negative
authorizations, and exactly one next action.

10. Write a numbered session log and commit only scoped receipt/session-log
files plus any necessary GOAL/plan handoff files if the next prompt is
selected by the observer. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_m3ei_popsign_fresh5_bounded_brev_fit`
- `continue_remote_environment_repair_no_training`
- `stop_for_brev_provider_cost_control`
- `stop_for_human_compute_provider_decision`
- `escalate_strategy_research_before_training`

## Hard Boundaries

- No timed training/fitting command.
- No checkpoint/model artifact, evaluation, copyback of model artifacts, ONNX
  export, model-card promotion, browser activation, product runtime change,
  final-readiness claim, ASL-correctness claim, raw learner video upload, push,
  amend, no-verify, duplicate worker, non-stoppable worker, worker delete, or
  worker reset.
- No broad 75/80/95/100-label run.
- No source import, media download, source-register mutation, manifest
  mutation, tensor mutation, vocabulary mutation, generated pseudo-labels,
  SemLex media use, or packet-row mutation.
- No pretrained detector, landmark, backbone, embedding, feature extractor,
  teacher-logit, YOLO, MediaPipe, OpenPose, CLIP, SAM, DINO,
  `from_pretrained`, `pretrained=True`, or similar shortcut.
- No repo dependency-file mutation unless a future prompt explicitly approves
  recording a successful compatibility fix in source.

## Observer Guidance

- CONTINUE to the pre-authored M3EI fit prompt only if CUDA proof, both remote
  dry-runs, final Brev state, and no-artifact boundaries are recorded.
- NUDGE for missing command output, missing CUDA proof detail, missing dry-run
  status, or missing default-off evidence.
- REDIRECT if the executor starts timed training, mutates dependencies in
  source, creates a duplicate worker, weakens no-pretrained/source boundaries,
  or proposes broad training.
- STOP if provider/cost-control state is unsafe or the next action needs human
  provider/resource approval.
- ESCALATE before approving any training-style retry if the repair succeeds
  but the executor cannot state why M3EI tests a bounded premise rather than
  repeating failed evidence.
