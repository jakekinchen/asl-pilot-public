# Return-To-Form M3GK Bounded Brev Completion Route After Regenerated Evidence Goal Loop Prompt

Mission 3GK prompt for the Codex executor after M3GJ regenerated usable v2
diagnostic output and selected a bounded Brev continuation.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one bounded retained-worker Brev completion route, or record the exact
preflight blocker before any paid remote training occurs.

The route is authorized only because:

- the latest supervising-user instruction approved continuing the overnight
  completion push, unblocking bounded Brev usage under oversight, and using the
  project budget intentionally;
- M3GJ regenerated a usable v2 diagnostic sidecar/report for the copied-back
  M3GB checkpoint; and
- the retained worker is currently default-off.

This is not a broad retry, not a sweep, not model-card promotion, not browser
recognition activation, and not final readiness. It is exactly one independent
seed on the existing ASL Citizen high-signal region-grid TCN route so the
receipt can tell whether the weak M3GB result was stable or seed-sensitive.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GJ evidence:
   - [`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](../validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
   - [`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`](../session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md)
5. M3GB Brev baseline:
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
6. Existing strategy/evidence packets, especially M3FV-M3FZ and M3GC-M3GJ.
7. Training/evaluation and sync code:
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`
   - `scripts/brev_sync_repo.sh`
8. High-signal region-grid manifests:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
9. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Authorization And Compute Envelope

```json
{
  "brev_spend_authorized": true,
  "approval_source": "latest supervising-user instruction plus M3GJ receipt",
  "workspace": "asl-pilot-m3eh-l40s-001",
  "workspace_id": "3d58wpy9o",
  "instance_type": "l40s-48gb.1x",
  "gpu": "L40S",
  "price_command": "brev search --stoppable --min-vram 40 --sort price --json",
  "price_guard_usd_per_hour": 5,
  "max_training_runtime_seconds": 4800,
  "max_wall_time_after_first_start_minutes": 100,
  "max_expected_spend_usd": 6,
  "project_total_compute_budget_context_usd": 250,
  "timed_training_command_limit": 1,
  "evaluation_command_limit": 1,
  "new_workers": 0,
  "worker_delete_or_reset": 0,
  "package_install_commands": 0,
  "output_dir": "output/m3gk-high-signal-region-grid-tcn-brev-seed20260529",
  "model_id": "m3gk-high-signal-region-grid-tcn-brev-seed20260529",
  "seed": 20260529,
  "expected_metric_signal": "training history, selected checkpoint, validation/test report, v2 prediction sidecar, and comparison against M3GB metrics",
  "kill_conditions": [
    "GOAL.md does not point at this prompt",
    "retained worker name/id/type does not match",
    "refreshed listed price exceeds 5 USD/hour",
    "CUDA unavailable or CPU fallback",
    "unexpected GPU training process already using memory",
    "duplicate training process",
    "local dry-run/check-files fails",
    "remote sync or required file hash check fails",
    "remote output directory already exists before training",
    "timed training command hits timeout",
    "Brev provider state cannot be safely stopped"
  ]
}
```

Use only the retained worker. Do not create, delete, reset, resize, or replace
any worker. Do not install packages or mutate dependency files.

## Required Slice

Complete exactly one M3GK slice in this order.

1. Verify local state:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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
   `output/m3gk-high-signal-region-grid-tcn-brev-seed20260529` is an allowed
   `--region-grid-tcn-training-smoke` output directory. Do not change the
   training architecture, data loading, evaluator math, final/promoted output
   policy, claim surfaces, dependencies, manifests, tensors, or vocabulary.

3. Run the local dry-run/check-files guard:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gk-high-signal-region-grid-tcn-brev-seed20260529 --model-id m3gk-high-signal-region-grid-tcn-brev-seed20260529 --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

If this dry-run fails, do not start Brev. Record the blocker, preserve
default-off state, write the M3GK receipt/log, and select a non-Brev next
action.

4. Refresh provider state and price. Start only `asl-pilot-m3eh-l40s-001` if
   it is stopped and the refreshed listed price is at or below `$5/hour`.

5. Run one remote safety check:

```sh
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && printf 'remote_home=%s\n' \"\$HOME\" && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true && .venv/bin/python - <<'PY'
import torch
print('torch', torch.__version__)
print('cuda_available', torch.cuda.is_available())
print('device_count', torch.cuda.device_count())
print('device_name', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')
PY"
```

A base Brev `jupyter-lab` process is not a blocker if it is not using GPU and
no training/torch process is active.

6. Sync once:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

7. Run remote hash and output-absence checks. Use `$HOME/asl-pilot` as reported
   by the safety check:

```sh
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && sha256sum GOAL.md docs/model/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-goal-loop-prompt.md scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py data/manifests/lesson/high-signal-region-grid/train.json data/manifests/lesson/high-signal-region-grid/validation.json data/manifests/lesson/high-signal-region-grid/test.json && test ! -e output/m3gk-high-signal-region-grid-tcn-brev-seed20260529"
```

8. Run exactly one remote dry-run/check-files command:

```sh
timeout 420s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gk-high-signal-region-grid-tcn-brev-seed20260529 --model-id m3gk-high-signal-region-grid-tcn-brev-seed20260529 --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

9. Run exactly one timed non-dry-run training command:

```sh
timeout 5400s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && timeout 4800 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3gk-high-signal-region-grid-tcn-brev-seed20260529 --model-id m3gk-high-signal-region-grid-tcn-brev-seed20260529 --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

10. If checkpoint and training provenance exist, run evaluation once:

```sh
timeout 1800s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3gk-high-signal-region-grid-tcn-brev-seed20260529/model_state.pt --training-provenance output/m3gk-high-signal-region-grid-tcn-brev-seed20260529/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3gk-high-signal-region-grid-tcn-brev-seed20260529/validation-report.json --calibrated-provenance output/m3gk-high-signal-region-grid-tcn-brev-seed20260529/calibrated-provenance.json --prediction-sidecar output/m3gk-high-signal-region-grid-tcn-brev-seed20260529/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

An evaluator exit of `1` because targets fail is useful diagnostic evidence,
not a reason to retry.

11. Copy back the remote output directory only if it exists:

```sh
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3gk-high-signal-region-grid-tcn-brev-seed20260529 output/
```

If the remote safety check proves a different `$HOME`, use that exact absolute
path in the copyback command and record it in the receipt.

12. Stop the worker and verify default-off:

```sh
brev stop asl-pilot-m3eh-l40s-001
sleep 10
brev ls --json
```

If the workspace still reports `RUNNING`, retry:

```sh
brev stop 3d58wpy9o
sleep 10
brev ls --json
```

If it still reports `RUNNING`, run `brev stop --all`, verify again, and record
the cost-control blocker. Do not delete or reset any worker.

## Receipt

Write:

`docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json`

The receipt must include:

- current commit and active prompt;
- user approval summary and compute envelope;
- M3GJ regenerated sidecar/report baseline;
- M3GB metric baseline for comparison;
- local output-guard patch summary, if any;
- commands run and exit statuses;
- refreshed price evidence and Brev provider states before/start/after/stop;
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

- `continue_m3gl_regenerated_evidence_metric_triage_no_remote` if M3GK
  produces diagnostic model/evaluator evidence but gates do not justify
  promotion.
- `continue_m3gl_export_promotion_readiness_receipt_no_activation` only if all
  promotion-quality gates pass and the next slice remains a receipt/review
  before any browser activation.
- `continue_fail_closed_interactive_product_hardening` if model gates fail and
  the best deadline path is product value without recognition claims.
- `continue_openai_or_gpt_pro_research_with_m3gk_evidence` if another ML move
  would be speculative after this run.
- `stop_for_brev_provider_budget_or_claim_review` if provider safety, budget,
  claims, or final-gate changes require human review.

## Session Log

Write:

`docs/session-logs/635-mission-3gk-bounded-brev-completion-route-after-regenerated-evidence.md`

The log must summarize local checks, Brev price/state, exact remote commands,
metrics or blocker, copied hashes, default-off verification, claim boundary,
changed files, and selected next action.

## Boundaries

- Exactly one timed non-dry-run training command. No retry, no second seed, no
  architecture search, no hyperparameter sweep, no broad label run, no
  Detector 0 training, no source/media import, no generated labels, no
  pseudo-labels, no source-register mutation, no manifest/tensor/vocabulary
  mutation, no raw-video inspection/upload, no dependency mutation, no package
  install, no new worker, no worker delete/reset/resize, no push, no amend, and
  no `--no-verify`.
- Do not export ONNX, promote a model card, activate browser recognition,
  promote thresholds, change final gates, or claim ASL correctness/final
  readiness inside M3GK.
- If gates fail, keep all copied outputs ignored diagnostic evidence only.
- Claim surfaces must remain fail-closed.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GK.
2. Baseline checks pass or exact blockers are recorded.
3. The M3GK output namespace is guarded, local dry-run/check-files passes, or a
   blocker is recorded before Brev starts.
4. Brev price, worker identity, CUDA/process safety, sync, remote hashes, and
   output absence are recorded before training.
5. Exactly one timed non-dry-run training command runs, or the exact blocker
   preventing it is recorded.
6. Evaluation and copyback run at most once and only when artifacts exist.
7. Final Brev state is verified default-off or a human-visible cost-control
   blocker is recorded.
8. Receipt and numbered session log exist.
9. Claim surfaces remain fail-closed and `pretrained_components` is `[]`.
10. Exactly one allowed next action is selected.

## Observer Guidance

- CONTINUE if M3GK stays inside the compute envelope, verifies default-off
  state, records exact evidence, preserves fail-closed claims, and selects one
  allowed next action.
- NUDGE if it misses output-guard accounting, price evidence, process safety,
  sync/freshness hashes, dry-run result, one-command accounting, metric
  comparison, copyback hashes, default-off proof, claim-surface proof, changed
  files, or exactly one next action.
- REDIRECT if it starts a different worker, broadens labels, changes
  architecture/input/source/policy, adds dependencies, or tries to promote or
  activate browser recognition inside M3GK.
- STOP if provider/budget/claim safety requires human review or Brev cannot be
  stopped safely.
- ESCALATE if the next proposed action after M3GK changes architecture, input
  representation, source policy, budget, privacy posture, or claim policy
  without a current strategy/evidence memo.
