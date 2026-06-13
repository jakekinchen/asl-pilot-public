# Return-To-Form Region-Grid TCN Brev Smoke After Guard Fix Goal Loop Prompt

Mission 3DO prompt for the Codex executor after Mission 3DN proves that the
M3DM high-signal region-grid true-TCN dry-run contract passes.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded Brev-backed high-signal region-grid
`true_temporal_convnet_region_grid` smoke using the existing A100 worker and the
source guard repaired in Mission 3DN.

This is non-promotion diagnostic evidence. It is not final training, model-card
promotion, ONNX export, browser activation, or an ASL-correctness claim.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DN receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json).
4. M3DM worker/dry-run blocker receipt:
   [`docs/validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json`](../validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json).
5. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
6. Prior comparison evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`output/m3ah-tier0-cuda-full-split-recognizer/training-provenance.json`](../../output/m3ah-tier0-cuda-full-split-recognizer/training-provenance.json)
   - [`output/m3ah-tier0-cuda-full-split-recognizer/validation-report.json`](../../output/m3ah-tier0-cuda-full-split-recognizer/validation-report.json)

## Required Slice

Run one bounded remote training smoke, then evaluate and copy back artifacts.

Required local checks:

```sh
git status --short --branch
git log -8 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Record Brev state and process safety:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true"
```

Kill condition: abort if CUDA is unavailable, GPU memory is unexpectedly in
use by another training process, a duplicate train process exists, the command
falls back to CPU-only training, timeout fires, or no metric output appears
after startup.

Sync current code/data to the existing worker:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
```

Run the remote dry-run first:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

Run exactly one timed remote training command only after the dry-run passes:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 2700 /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

Run remote evaluation. A nonzero exit caused by failed target metrics is still
useful if the report/provenance/sidecar files are written.

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3dm-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3dm-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3dm-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3dm-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3dm-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

Copy back:

```sh
brev copy asl-pilot-rawframe-001:/home/shadeform/asl-pilot/output/m3dm-high-signal-region-grid-tcn-brev output/
```

## Compute Envelope

- Existing worker only: `asl-pilot-rawframe-001` / `2hl1hytty`.
- Do not create a duplicate worker.
- Max timed training runtime: `2700` seconds.
- Max spend for this slice: `20 USD`.
- Stop the run if the kill condition triggers.
- Do not delete/reset the worker.
- After copyback and committed receipt, record Brev state. Do not STOP solely
  because provider stop attempts have historically left the worker listed as
  `RUNNING`; surface that as provider state if it persists.

## Boundaries

- No broad 75/80/95-label training.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, ONNX export, browser
  trained activation, threshold promotion, final-readiness claim, positive
  ASL-correctness claim, raw learner-video upload, push, amend, no-verify, or
  duplicate worker.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json`

The receipt must include:

- local checks;
- Brev workspace state, CUDA/process checks, timeout and spend cap;
- dry-run command/status;
- training command/status/history;
- evaluation command/status and metric summary;
- copyback file list and hashes;
- comparison to M3AW, M3AX, and M3AH;
- `pretrained_components: []` and random initialization evidence;
- all negative authorizations from the Boundaries section;
- exactly one next action.

Allowed next actions:

- `continue_tcn_result_diagnosis_or_small_ablation` if the run executes and
  metrics are weak or mixed but produce real artifacts.
- `continue_detector_or_crop_normalization_lane` if the result points back to
  crop/localization rather than classifier mechanics.
- `escalate_strategy_research` if the run executes but repeats the same
  learnability failure without a clear local next slice.
- `stop_for_provider_cost_control_only` only if Brev becomes unsafe or
  unavailable in a way that prevents continued bounded work.

## Session Log

Write:

`docs/session-logs/469-mission-3do-region-grid-tcn-brev-smoke-after-guard-fix.md`

The log must include commands, evidence, metrics, Brev state, blockers, changed
files, and exactly one next action.
