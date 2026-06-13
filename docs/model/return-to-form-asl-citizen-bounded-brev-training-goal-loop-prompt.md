# Return-To-Form ASL Citizen Bounded Brev Training Goal Loop Prompt

Mission 3AL prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Use the already-running Brev A100 worker for one bounded full-training and
evaluation pass on the approved 25-sign ASL Citizen lesson milestone. The goal
is to find out whether the real tensor-backed ASL Citizen path can learn beyond
the local one-epoch smoke, with strict no-pretrained/source boundaries, copied
back artifacts, and explicit teardown/cost-control evidence.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread: the user reauthorized
   bounded Brev usage and wants the pair pushed forward overnight while being
   wise with compute.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AL.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AJ, M3AK, and M3AL.
4. M3AK evidence:
   - [`docs/session-logs/288-mission-3ak-local-training-smoke.md`](../session-logs/288-mission-3ak-local-training-smoke.md)
   - [`docs/session-logs/289-observer-stop-local-training-smoke.md`](../session-logs/289-observer-stop-local-training-smoke.md)
   - [`docs/validation/return-to-form-asl-citizen-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-local-training-smoke-v1.json)
   - [`artifacts/rawframe-lesson-milestone/training-provenance.json`](../../artifacts/rawframe-lesson-milestone/training-provenance.json)
5. Brev/runbook surfaces:
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md)
   - [`scripts/brev_sync_repo.sh`](../../scripts/brev_sync_repo.sh)
6. Training and evaluation scripts:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)

## Current Evidence

M3AK completed the local no-spend smoke at `39cedd0` and the observer STOP at
`e284e01`. The local smoke trained one epoch on MPS from random initialization
with `pretrained_components: []` and reached:

```text
train_accuracy:      0.03
validation_accuracy: 0.09574468085106383
```

This only proves the tensor/training path works. It does not justify
promotion, thresholds, ONNX export, browser activation, or final readiness.

The existing Brev worker is:

```text
workspace:     asl-pilot-rawframe-001
id:            2hl1hytty
instance type: massedcompute_A100_sxm4_80G_DGX
gpu:           A100 80GB
observed cost: 1.488 USD/hour from `brev search --gpu-name A100 --json`
status:        RUNNING / HEALTHY / READY as of observer session 289
```

The worker has repeatedly remained `RUNNING` after `brev stop` by name, by id,
and by `--all`. Treat that as a provider/cost-control constraint: use the
already-running worker if it is healthy, avoid idle time, but do not delete or
reset it without explicit human approval.

## Compute Envelope

This mission is human-approved for one bounded remote training/evaluation pass.

Rules:

- Use the existing worker first. Do not create a duplicate worker unless the
  existing worker is proven unusable and the user explicitly approves creation.
- Before remote training, record a compute receipt with `brev ls --json`,
  workspace name/id/type/status, observed hourly price, planned command, max
  runtime, max spend, expected signal, and kill condition.
- First remote run cap: `timeout 5400s` for training and `timeout 1800s` for
  evaluation. At 1.488 USD/hour, the active training cap is about 2.23 USD;
  record a conservative max spend of 5 USD for this slice.
- Kill the run if CUDA is unavailable, training falls back to CPU, loss becomes
  NaN, no epoch/progress output appears for 15 minutes, sync/preflight cannot
  verify the required ASL Citizen raw videos/tensors, or the timeout fires.
- Copy artifacts back before any teardown attempt.
- After artifacts are copied back or the run is abandoned, run the Brev
  default-off sequence. If `brev ls --json` still reports `RUNNING`, record the
  blocker and STOP for explicit human delete/reset/provider action.

## Required First Slice

Complete this as one executor slice if preflight passes.

1. Run local preflight:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
bash -n scripts/brev_sync_repo.sh
```

2. Record current compute state:

```sh
brev ls --json
brev search --gpu-name A100 --json
```

3. Sync the repo and data allowlist to the existing worker:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
```

The sync helper must include `data/manifests`, `data/tensors`,
`data/external/asl-citizen/raw`, `data/external/cira-negative-challenge-videos/raw`,
and `data/external/wikimedia-commons-negative-challenge-videos/raw`; those paths
are required by `--lesson-milestone --check-files` and the core negative
challenge evaluation.

4. Prove remote readiness:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && ./.venv/bin/python - <<'PY'
import torch
print({'torch': torch.__version__, 'cuda': torch.cuda.is_available(), 'device_count': torch.cuda.device_count(), 'device': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None})
PY"
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && ./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/rawframe-milestone/train.json --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json --test-manifest data/manifests/lesson/rawframe-milestone/test.json --output-dir artifacts/rawframe-lesson-milestone --model-id asl-pilot-asl-citizen-lesson-brev-full-v1 --architecture motion_2d_temporal_cnn --lesson-milestone --check-files --epochs 1 --batch-size 16 --frame-count 12 --image-size 96 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --num-workers 2 --dry-run"
```

5. Run bounded training:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 5400s ./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/rawframe-milestone/train.json --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json --test-manifest data/manifests/lesson/rawframe-milestone/test.json --output-dir artifacts/rawframe-lesson-milestone --model-id asl-pilot-asl-citizen-lesson-brev-full-v1 --architecture motion_2d_temporal_cnn --lesson-milestone --check-files --epochs 40 --batch-size 16 --frame-count 12 --image-size 96 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --num-workers 2"
```

6. If training completes, run lesson evaluation with the core negative
challenge manifest:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 1800s ./.venv/bin/python scripts/evaluate_rawframe_model.py --lesson-milestone --checkpoint artifacts/rawframe-lesson-milestone/model_state.pt --training-provenance artifacts/rawframe-lesson-milestone/training-provenance.json --train-manifest data/manifests/lesson/rawframe-milestone/train.json --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json --test-manifest data/manifests/lesson/rawframe-milestone/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-lesson-milestone/validation-report.json --calibrated-provenance artifacts/rawframe-lesson-milestone/calibrated-provenance.json --prediction-sidecar artifacts/rawframe-lesson-milestone/prediction-sidecar.json --batch-size 16 --num-workers 2"
```

7. Copy back artifacts:

```sh
mkdir -p artifacts/rawframe-lesson-milestone
rsync -avz asl-pilot-rawframe-001:/home/shadeform/asl-pilot/artifacts/rawframe-lesson-milestone/ artifacts/rawframe-lesson-milestone/
shasum -a 256 artifacts/rawframe-lesson-milestone/* 2>/dev/null || true
```

Do not commit `artifacts/rawframe-lesson-milestone/model_state.pt`.

8. Write:

- `docs/validation/return-to-form-asl-citizen-brev-training-v1.json`;
- a numbered session log under `docs/session-logs/`;
- any updated tracked JSON evidence under `artifacts/rawframe-lesson-milestone/`
  except the binary checkpoint.

9. Attempt teardown/default-off after artifacts are copied back:

```sh
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
brev stop asl-pilot-rawframe-001
sleep 10
brev ls --json
```

If it still reports `RUNNING`, retry by id and `--all`, then record the final
state. Do not delete/reset.

## Acceptance Criteria

Mission 3AL is complete when:

1. `GOAL.md` points at this prompt and names Mission 3AL.
2. The compute receipt records the existing worker, observed hourly price,
   planned command, max runtime, max spend, expected signal, and kill condition.
3. Remote sync/preflight proves ASL Citizen raw videos, decoded tensors,
   manifests, negative-challenge media, `.venv`, torch, and CUDA are available.
4. The bounded remote training command either completes or records a precise
   blocker under the compute cap.
5. If training completes, evaluation runs with `--lesson-milestone` and
   `data/manifests/negative-challenge.json`, or the exact evaluation blocker is
   recorded.
6. Artifacts are copied back before teardown, with SHA-256 hashes recorded.
7. No pretrained detector, landmark, backbone, embedding, generated pseudo-label,
   source approval shortcut, ONNX export, model-card promotion, threshold
   promotion, browser activation, broad 75/95-label run, destructive reset,
   worker delete, amend, push, or final-readiness claim occurs.
8. Required local audits pass after evidence is written:

```sh
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

## Observer Guidance

- CONTINUE only if a required M3AL evidence field is missing and the next action
  is still inside the approved compute envelope.
- NUDGE if the executor omits compute receipt fields, artifact hashes, negative
  challenge status, teardown state, or no-promotion boundaries.
- REDIRECT if sync/preflight shows the active command cannot run as written.
- ESCALATE to `openai-api-research` or `gpt-pro-research` before approving a
  second speculative training run if remote training finishes with weak
  held-out metrics, fails to fit train, or suggests an architecture/data
  decision.
- STOP if training/evaluation evidence is complete, if the worker remains
  `RUNNING` with no active training process and no approved next remote command,
  or if delete/reset/provider action is needed.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AL ASL Citizen bounded Brev training.
Completed:            <remote preflight/training/evaluation/copyback completed>.
Evidence:             <commands, metrics, hashes, Brev state, audits>.
Remaining:            <single next action>.
Blockers:             <none or exact compute/source/data/model blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
