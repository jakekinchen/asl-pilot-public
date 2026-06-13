# Return-To-Form M3EV Bounded Brev TCN Training Smoke After M3EU Command Fix Goal Loop Prompt

Mission 3EV prompt for the Codex executor after Mission 3EU proved the local
training-command contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded retained-worker Brev training-smoke attempt for the
scratch `true_temporal_convnet_region_grid` path after the M3EU command fix.
This prompt authorizes only the explicit compute envelope and command sequence
below. It is a training-smoke attempt, not a broad training campaign,
architecture search, product promotion, browser activation, final readiness
claim, or ASL-correctness claim.

The corrected command contract is:

- remote dry-run/check-files audit keeps
  `--dry-run --require-input-contract rgb_regions_grid_v1`;
- the single non-dry-run timed training command omits
  `--require-input-contract`.

## Starting Evidence

- M3EU executor commit `ea6ba11` wrote
  [`docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json`](../validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json)
  and
  [`docs/session-logs/542-mission-3eu-local-tcn-training-command-contract-diagnosis.md`](../session-logs/542-mission-3eu-local-tcn-training-command-contract-diagnosis.md).
- M3EU proved locally that `--require-input-contract` is intentionally a
  no-training dry-run/check-files audit guard. Source policy is correct; the
  repair is prompt/command steering only.
- M3EU proved both required local dry-run shapes:
  - with `--dry-run --require-input-contract rgb_regions_grid_v1`, input
    contract passed;
  - without `--require-input-contract`, the timed-command shape passed in
    dry-run form.
- M3EU ran no Brev start/exec/sync/copy, remote dry-run, remote training,
  package install, non-dry-run local training, fitting, checkpoint creation,
  evaluation, copyback, export, promotion, browser activation, source/data/
  dependency mutation, worker creation/delete/reset, push, or pretrained/
  generated-label path.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- Read-only provider state remains default-off:
  `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` is `STOPPED` / `COMPLETED` /
  `NOT READY` / `HEALTHY`.

## Authorization And Compute Envelope

This prompt authorizes at most one retained-worker Brev training-smoke attempt
on the existing worker:

- worker name: `asl-pilot-m3eh-l40s-001`;
- worker id: `3d58wpy9o`;
- instance type: `l40s-48gb.1x`;
- GPU: one `L40S`;
- current listed price evidence: `brev search --stoppable --min-vram 40 --sort price --json`
  first result at `2026-05-28T19:26:06Z` was `l40s-48gb.1x` at
  `1.74 USD/hour`;
- maximum training runtime: 2700 seconds;
- maximum wall time after first start: 60 minutes;
- maximum expected spend: 4 USD;
- exactly one timed training command;
- stop the worker and verify stopped state after the attempt, including failure
  paths.

Abort before `brev start` if read-only `brev ls --json` no longer reports only
the retained worker in a stopped/healthy safe state, if the current price check
is unavailable, if the selected instance no longer has a current listed price
at or below 2 USD/hour, or if local audits/fail-closed claim checks fail.

Do not create a duplicate worker. Do not delete or reset the worker. Do not
install packages. Do not mutate source, dependencies, source register,
manifests, tensors, vocabulary, or packets.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3EU receipt:
   [`docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json`](../validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json).
4. M3EU session log:
   [`docs/session-logs/542-mission-3eu-local-tcn-training-command-contract-diagnosis.md`](../session-logs/542-mission-3eu-local-tcn-training-command-contract-diagnosis.md).
5. M3ET receipt:
   [`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`](../validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json).
6. Current training implementation:
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
7. Current evaluation implementation:
   [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py).
8. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Complete exactly one bounded retained-worker packet:

1. Verify local state, active prompt, local audits, M3EU receipt, fail-closed
   claim surfaces, read-only Brev state, and current price evidence.
2. Start only `asl-pilot-m3eh-l40s-001` if the local/provider checks remain
   safe.
3. Prove no unexpected GPU training process is active and verify remote
   `/home/ubuntu/asl-pilot/.venv/bin/python` CUDA status.
4. Run `bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001` at most once.
5. Verify remote hashes for `GOAL.md`, this prompt, M3EU receipt,
   `scripts/train_rawframe_model.py`, and `scripts/evaluate_rawframe_model.py`.
6. Run the remote dry-run/check-files audit with
   `--dry-run --require-input-contract rgb_regions_grid_v1`.
7. Run exactly one timed non-dry-run training command with the same M3ER output
   namespace and without `--require-input-contract`.
8. If checkpoint and training provenance exist, run the scoped evaluation once.
   If either is absent, skip evaluation and record the exact reason.
9. If remote output files exist, copy back only
   `output/m3er-high-signal-region-grid-tcn-brev` and list/hashes of copied
   files. If absent, skip copyback and record the exact reason.
10. Stop the worker and verify final `STOPPED` provider state.
11. Write the tracked M3EV receipt and numbered session log.
12. Commit only scoped receipt/session-log artifacts and any prompt/doc
    evidence required by the slice.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json >/dev/null
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
timeout 3000s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && timeout 2700 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
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

`docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`

The receipt must include:

- M3EU command-contract proof summary;
- authorization and compute envelope, including current price evidence;
- local checks and fail-closed claim surfaces;
- initial Brev provider state, start result, process safety, and CUDA probe;
- sync command/result and remote file freshness hashes;
- dry-run command/status;
- timed training command/status, runtime, timeout status, printed training plan,
  training history if present, selected epoch if present, checkpoint/provenance
  paths and hashes if present, and exact failure if any;
- explicit proof that the timed training command omitted
  `--require-input-contract`;
- evaluation command/status or explicit skip reason;
- copyback command/status or explicit no-artifact reason;
- final Brev stop attempts and provider state;
- `pretrained_components: []`;
- all negative authorizations from this prompt;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_m3ev_artifact_audit_no_remote` if training, evaluation, and
  copyback complete and metrics justify a local artifact/claim audit.
- `continue_m3ev_metric_triage_no_remote` if training/evaluation complete but
  metrics are weak, collapsed, or fail the next gate.
- `continue_m3ev_eval_or_copyback_no_training` if training writes artifacts but
  evaluation or copyback is incomplete for an environmental reason.
- `continue_local_tcn_failure_diagnosis_after_m3ev` if training fails before
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
  inside M3EV.
- No `--require-input-contract` on the timed non-dry-run training command.
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

1. `GOAL.md` points at this prompt and names Mission 3EV.
2. Required local checks pass or exact blockers are recorded.
3. The retained worker identity, price, start/safety/CUDA/sync/dry-run state,
   corrected timed command, and default-off teardown are recorded.
4. Exactly one timed training command is run, or the receipt records the exact
   pre-training blocker that prevented it.
5. Evaluation and copyback either run from existing checkpoint/provenance
   artifacts or record precise skip reasons.
6. The receipt exists at
   `docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`.
7. No forbidden source, dependency, product, worker, promotion, broad-label, or
   pretrained/generated-label action occurs.
8. A numbered session log records commands, evidence, metrics or exact failure,
   artifact locations or no-artifact reason, Brev status, changed files,
   blockers, and exactly one next action.
