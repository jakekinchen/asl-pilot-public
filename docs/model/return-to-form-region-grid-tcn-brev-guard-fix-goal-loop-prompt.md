# Return-To-Form Region-Grid TCN Brev Guard Fix Goal Loop Prompt

Mission 3DN prompt for the Codex executor after M3DM proved that the next
blocker is the invocation/source guard, not CUDA, Brev sync, or missing
high-signal region-grid tensors.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Fix the narrow source/prompt contract mismatch that blocked the M3DM dry-run.
The intended result is that the old capped M3AW local region-grid TCN smoke
still passes, while the M3DM full-split high-signal region-grid TCN dry-run
also passes without starting training.

This mission is local source-contract repair only. It is not Brev training,
model-card promotion, ONNX export, browser activation, or a final model claim.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread: continue the ML path
   and do not park on the narrow guard mismatch.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DM blocker evidence:
   - [`docs/validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json`](../validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json)
   - [`docs/session-logs/466-mission-3dm-resumed-brev-tcn-microexperiment.md`](../session-logs/466-mission-3dm-resumed-brev-tcn-microexperiment.md)
   - [`docs/session-logs/467-observer-stop-m3dm-source-prompt-contract.md`](../session-logs/467-observer-stop-m3dm-source-prompt-contract.md)
4. Existing source guards:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
5. Existing region-grid evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)

## Required Slice

Complete exactly one smallest useful guard-fix slice.

Recommended implementation shape:

- Keep `--region-grid-tcn-training-smoke` as the public mode unless inspection
  proves a separate flag is materially safer.
- Make the mode output-dir aware:
  - `output/m3aw-region-grid-tcn-local-smoke` keeps the old capped M3AW policy:
    `epochs <= 2`, `batch_size <= 4`, required `--max-train-batches`, required
    `--max-validation-batches`, `--num-workers 0`, and
    `--training-augmentation none`.
  - `output/m3dm-high-signal-region-grid-tcn-brev` gets an explicit bounded
    M3DM policy: exact high-signal region-grid manifests, `--check-files`,
    `--frame-count 16`, `--image-size 96`, `--epochs <= 12`,
    `--batch-size <= 8`, `--num-workers <= 2`, `--training-augmentation mild`,
    `--checkpoint-selection best_validation`, and no required batch caps.
- Preserve strict no-pretrained and source-provenance behavior. Do not loosen
  generic final-model gates.
- If you introduce a new mode or evidence name, update evaluation and
  provenance expectations consistently. If you keep the existing mode and only
  add output-specific policy, record why `evaluate_rawframe_model.py` did not
  need a source change.

Run these required checks:

```sh
git status --short --branch
git log -5 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Prove the old M3AW dry-run still passes:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/high-signal-region-grid/train.json \
  --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json \
  --test-manifest data/manifests/lesson/high-signal-region-grid/test.json \
  --output-dir output/m3aw-region-grid-tcn-local-smoke \
  --model-id asl-pilot-asl-citizen-high-signal-region-grid-tcn-smoke-v1 \
  --architecture true_temporal_convnet_region_grid \
  --check-files \
  --frame-count 16 \
  --image-size 96 \
  --num-workers 0 \
  --epochs 2 \
  --batch-size 4 \
  --max-train-batches 12 \
  --max-validation-batches 8 \
  --region-grid-tcn-training-smoke \
  --dry-run \
  --require-input-contract rgb_regions_grid_v1
```

Prove the M3DM dry-run now passes without starting training:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/high-signal-region-grid/train.json \
  --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json \
  --test-manifest data/manifests/lesson/high-signal-region-grid/test.json \
  --output-dir output/m3dm-high-signal-region-grid-tcn-brev \
  --model-id m3dm-high-signal-region-grid-tcn-brev \
  --architecture true_temporal_convnet_region_grid \
  --check-files \
  --frame-count 16 \
  --image-size 96 \
  --num-workers 2 \
  --epochs 12 \
  --batch-size 8 \
  --learning-rate 0.001 \
  --training-augmentation mild \
  --checkpoint-selection best_validation \
  --region-grid-tcn-training-smoke \
  --dry-run \
  --require-input-contract rgb_regions_grid_v1
```

Optional, only after the local M3DM dry-run passes and the worker is already
listed as running: sync the repo to `asl-pilot-rawframe-001` and run the same
remote dry-run. Do not run the timed training command in this mission.

## Boundaries

Allowed:

- scoped source changes to `scripts/train_rawframe_model.py`;
- scoped source changes to `scripts/evaluate_rawframe_model.py` only if needed;
- prompt/plan/session-log/receipt updates that explain the guard contract.

Forbidden:

- timed Brev training;
- broad 75/80/95-label training or evaluation;
- new dataset imports, source-register approvals, manifest changes, tensor
  changes, vocabulary changes, pseudo-labels, or raw learner-video upload;
- pretrained detectors, landmarks, backbones, embeddings, or generated labels;
- model-card promotion, ONNX export, browser recognition activation, threshold
  promotion, final-readiness claim, or positive ASL-correctness claim;
- duplicate worker creation, worker delete/reset, `git push`, `git add -A`,
  `--amend`, or `--no-verify`.

Brev handling: record `brev ls --json` if useful, but do not STOP or run
provider stop attempts merely because the existing worker still reports
`RUNNING`; the user has authorized the immediate follow-on bounded Brev run.
Stop only if an unexpected training process is active or the worker state is
unsafe.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json`

The receipt must include:

- source files changed and why;
- old M3AW dry-run command/status;
- new M3DM dry-run command/status;
- whether evaluation source changed and why;
- Brev state if inspected;
- negative authorizations from the Boundaries section;
- `pretrained_components: []`;
- exactly one next action.

Allowed next actions:

- `continue_bounded_brev_tcn_smoke_after_guard_fix` when both dry-runs pass.
- `continue_region_grid_tcn_guard_fix` when the source guard is still blocked
  but the blocker is local and actionable.
- `escalate_strategy_research` only if inspection shows the intended M3DM
  command is conceptually wrong rather than merely blocked by policy.

## Session Log

Write:

`docs/session-logs/468-mission-3dn-region-grid-tcn-brev-guard-fix.md`

The log must include commands, changed files, dry-run results, blockers, and
the single next action.

## Observer Handoff

If the receipt selects `continue_bounded_brev_tcn_smoke_after_guard_fix`, the
observer should redirect `GOAL.md` to:

[`docs/model/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md`](return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-goal-loop-prompt.md)

Do not STOP for the already-approved source-scope decision after the guard fix
passes.
