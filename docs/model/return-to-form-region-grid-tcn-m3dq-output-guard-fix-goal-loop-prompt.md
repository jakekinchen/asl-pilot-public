# Return-To-Form Region-Grid TCN M3DQ Output Guard Fix Goal Loop Prompt

Mission 3DR prompt for the Codex executor after Mission 3DQ proved the remote
dry-run is blocked by a local source/prompt contract mismatch before training.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or decisively downselect the M3DQ region-grid TCN smoke output-dir
contract locally.

Mission 3DQ used:

`output/m3dq-high-signal-region-grid-tcn-brev`

but the current `--region-grid-tcn-training-smoke` policy in
`scripts/train_rawframe_model.py` only allows:

- `output/m3aw-region-grid-tcn-local-smoke`
- `output/m3dm-high-signal-region-grid-tcn-brev`

This mission is local/no-spend and no-training. It may make the smallest source
or prompt-contract repair needed to make the intended M3DQ dry-run policy
explicit, while preserving the older M3AW capped local dry-run and M3DM
full-split Brev dry-run contracts.

This is not a remote retry, model-card promotion, ONNX export, browser
activation, final readiness, or an ASL-correctness claim.

## Authorization

No fresh Brev spend is authorized by this prompt.

Do not run `brev exec`, `bash scripts/brev_sync_repo.sh`, `brev copy`,
`brev start`, `brev stop`, `brev stop --all`, remote training, remote dry-run,
or any Brev lifecycle command in this mission. The M3DQ executor already
attempted default-off handling and recorded the persistent provider
`RUNNING/READY/HEALTHY` mismatch. A read-only `brev ls --json` is allowed only
if needed to keep the receipt current.

Do not run fitting, backward, optimizer, epoch training, checkpoint creation,
evaluation, copyback, export, promotion, or browser trained activation.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DQ receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json).
4. Mission 3DQ session log:
   [`docs/session-logs/473-mission-3dq-region-grid-tcn-brev-smoke-after-5d-fix.md`](../session-logs/473-mission-3dq-region-grid-tcn-brev-smoke-after-5d-fix.md).
5. Mission 3DN guard-fix receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json).
6. Mission 3DP 5D augmentation receipt:
   [`docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json`](../validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json).
7. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Complete one local source/prompt-contract repair pass:

1. Verify local state and no-pretrained/source boundaries.
2. Inspect the `region_grid_tcn_training_smoke` output-dir policy and the M3DN
   guard-fix rationale.
3. Decide whether M3DQ should have its own explicit full-split Brev smoke
   output directory or whether the follow-on prompt should reuse the existing
   M3DM output directory.
4. If the source guard is the blocker, make the smallest source/test/doc change
   needed to allow the M3DQ policy without weakening M3AW/M3DM constraints.
5. Prove locally that the M3AW capped dry-run still passes.
6. Prove locally that the M3DM full-split dry-run still passes.
7. Prove locally that the M3DQ full-split dry-run with
   `output/m3dq-high-signal-region-grid-tcn-brev`, mild augmentation, and
   `checkpoint-selection best_validation` passes.
8. Write the tracked receipt and numbered session log.
9. Commit only scoped source, prompt, receipt, test, and session-log changes.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

M3AW compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3aw-region-grid-tcn-local-smoke --model-id m3aw-region-grid-tcn-local-smoke --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 2 --max-train-batches 1 --max-validation-batches 1 --training-augmentation none --checkpoint-selection final --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3DM compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3DQ intended dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

If local dry-run commands would write output metadata, inspect the script first
and keep artifacts out of the commit unless a repo convention already tracks
them.

## Boundaries

- Local/no-spend only.
- No Brev exec/sync/copy/lifecycle command and no remote dry-run or remote
  training.
- No fitting, backward, optimizer, epoch training, checkpoint creation,
  evaluation, copyback, export, promotion, browser activation, final-readiness
  claim, or positive ASL-correctness claim.
- No broad 75/80/95-label work.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, threshold promotion,
  final-gate weakening, raw learner-video upload, push, amend, no-verify,
  duplicate worker, worker delete, or worker reset.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json`

The receipt must include:

- M3DQ failure classification and exact rejected output directory;
- local source/prompt-contract decision;
- changed files;
- local audit results;
- M3AW dry-run compatibility status;
- M3DM dry-run compatibility status;
- M3DQ intended dry-run status;
- Brev command avoidance or read-only provider state if checked;
- `pretrained_components: []`;
- all negative authorizations from Boundaries;
- exactly one next action.

Allowed next actions:

- `request_brev_smoke_approval_after_m3dq_output_guard_fix` if the local M3DQ
  output-dir policy is repaired and the only useful next step is a fresh
  bounded remote smoke prompt with human-visible compute envelope.
- `continue_local_tcn_output_guard_or_prompt_contract_repair` if the guard or
  prompt contract remains unresolved.
- `continue_training_policy_downselect_no_remote` if evidence says the M3DQ
  prompt should reuse an existing output-dir policy rather than add a new one.
- `escalate_strategy_research` if repeated source/policy failures make the
  route unclear.
- `stop_for_human_cost_control_review` if Brev provider/cost state is the
  blocker.

## Session Log

Write:

`docs/session-logs/475-mission-3dr-region-grid-tcn-m3dq-output-guard-fix.md`

The log must include commands, evidence, contract decision, compatibility
results, blockers, changed files, Brev command avoidance or read-only provider
state, and exactly one next action.
