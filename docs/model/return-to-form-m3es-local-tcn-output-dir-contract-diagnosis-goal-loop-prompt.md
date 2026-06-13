# Return-To-Form M3ES Local TCN Output-Dir Contract Diagnosis Goal Loop Prompt

Mission 3ES prompt for the Codex executor after Mission 3ER stopped at the
required post-sync dry-run/check-files gate before training.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or decisively downselect the local region-grid TCN smoke output-dir
contract that blocked M3ER before training. This is a local/no-remote,
no-spend, no-training contract slice. It may make the smallest source, prompt,
or doc repair needed to make the intended next dry-run policy explicit, while
preserving all existing M3AW, M3DM, M3DQ, and M3EH output-dir constraints.

This is not a Brev retry, remote dry-run, model-card promotion, ONNX export,
browser activation, final readiness claim, or ASL-correctness claim.

## Starting Evidence

- M3ER executor commit `32f731c` wrote
  [`docs/validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json`](../validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json)
  and
  [`docs/session-logs/536-mission-3er-bounded-brev-tcn-training-smoke.md`](../session-logs/536-mission-3er-bounded-brev-tcn-training-smoke.md).
- M3ER started only `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, proved the
  remote CUDA surface, synced once, then stopped at the required remote dry-run
  because `output/m3er-high-signal-region-grid-tcn-brev` is not accepted by
  the current `--region-grid-tcn-training-smoke` output-dir allowlist.
- M3ER ran no timed training command, evaluation, copyback, package install,
  source/media import, source-register/manifest/tensor/vocabulary/packet
  mutation, dependency mutation, export, promotion, browser activation,
  product-runtime mutation, worker creation, worker delete/reset, push, or
  pretrained/generated-label path.
- M3ER verified final Brev state as `STOPPED` / `COMPLETED` / `NOT READY` /
  `HEALTHY`.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Authorization

No fresh Brev spend or remote execution is authorized by this prompt.

Do not run `brev start`, `brev exec`, `bash scripts/brev_sync_repo.sh`,
`brev copy`, remote dry-run, remote training, package install, or any Brev
lifecycle command in M3ES. A read-only `brev ls --json` is required for
default-off visibility. If read-only state unexpectedly reports the retained
worker as `RUNNING`, stop only that existing worker as a cost-control action,
verify stopped state, record the blocker, and do not continue into remote work.

Do not run fitting, backward, optimizer, epoch training, checkpoint creation,
evaluation from a checkpoint, copyback, export, promotion, browser trained
activation, or final-readiness claim.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3ER receipt:
   [`docs/validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json`](../validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json).
4. M3ER session log:
   [`docs/session-logs/536-mission-3er-bounded-brev-tcn-training-smoke.md`](../session-logs/536-mission-3er-bounded-brev-tcn-training-smoke.md).
5. Current training-policy implementation:
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
6. Current evaluation implementation:
   [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py).
7. Prior analogous guard-fix prompt:
   [`docs/model/return-to-form-region-grid-tcn-m3dq-output-guard-fix-goal-loop-prompt.md`](return-to-form-region-grid-tcn-m3dq-output-guard-fix-goal-loop-prompt.md).
8. M3EQ recovery/readiness receipt:
   [`docs/validation/return-to-form-m3eq-brev-recovery-readiness-v1.json`](../validation/return-to-form-m3eq-brev-recovery-readiness-v1.json).
9. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Complete one local source/prompt-contract pass:

1. Verify local state, active prompt, local audits, fail-closed claim surfaces,
   M3ER receipt, and Brev default-off visibility.
2. Inspect the current `region_grid_tcn_training_smoke` output-dir policy, the
   M3ER rejected output namespace, and the prior M3DQ output-guard fix pattern.
3. Decide whether the next remote training-smoke attempt should have its own
   explicit M3ER full-split output directory, or whether the next prompt should
   reuse an already allowed full-split output directory such as the M3EH
   namespace. Record the decision and reason.
4. If the local source policy is the blocker, make the smallest source/test/doc
   change needed to make the intended M3ER policy explicit without weakening
   M3AW/M3DM/M3DQ/M3EH constraints.
5. If prompt reuse is the safer decision, make the smallest prompt/doc steering
   change and do not add a new output-dir policy.
6. Prove locally that existing allowed dry-runs still pass.
7. Prove locally that the selected M3ER follow-on contract passes as a
   `--dry-run`, or record the exact remaining local blocker.
8. Write the tracked M3ES receipt and numbered session log.
9. Commit only scoped source, prompt, doc, receipt, and session-log changes.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
brev ls --json
git diff --check
```

M3AW compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3aw-region-grid-tcn-local-smoke --model-id m3aw-region-grid-tcn-local-smoke --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 2 --max-train-batches 1 --max-validation-batches 1 --training-augmentation none --checkpoint-selection final --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3DM compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3DQ compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3EH compatibility dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3eh-high-signal-region-grid-tcn-brev --model-id m3eh-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3ER intended dry-run, only if the local policy now explicitly allows the M3ER
namespace:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

If local dry-run commands would write output metadata, inspect the script first
and keep artifacts out of the commit unless a repo convention already tracks
them.

## Boundaries

- Local/no-spend only.
- No Brev start/exec/sync/copy, remote dry-run, remote training, or worker
  lifecycle command except stopping the existing worker if read-only state
  unexpectedly shows it running.
- No fitting, backward, optimizer, epoch training, checkpoint creation,
  evaluation from checkpoint, copyback, export, promotion, browser activation,
  final-readiness claim, or positive ASL-correctness claim.
- No broad 75/80/95-label work.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, threshold promotion,
  final-gate weakening, raw learner-video upload, push, amend, no-verify,
  duplicate worker, worker delete, or worker reset.

## Receipt

Write:

`docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json`

The receipt must include:

- M3ER failure classification and exact rejected output directory;
- local source/prompt-contract decision;
- changed files;
- local audit results;
- M3AW, M3DM, M3DQ, and M3EH dry-run compatibility status;
- selected M3ER follow-on dry-run status or exact remaining blocker;
- Brev read-only provider state and any default-off stop action if needed;
- fail-closed claim-surface status;
- `pretrained_components: []`;
- all negative authorizations from Boundaries;
- exactly one next action.

Allowed next actions:

- `continue_bounded_brev_tcn_training_smoke_after_m3es_contract_fix` if the
  local contract is repaired, compatibility dry-runs pass, fail-closed claims
  remain unchanged, and Brev remains stopped.
- `continue_prompt_reuse_existing_output_dir_no_remote` if the best decision is
  to reuse an already allowed output namespace and the next prompt still needs
  local steering.
- `continue_local_tcn_contract_triage_no_remote` if the guard or prompt
  contract remains unresolved.
- `continue_openai_or_gpt_pro_research` if the local policy decision exposes a
  higher-cost strategy question.
- `stop_for_brev_provider_or_budget_blocker` if Brev read-only state is not
  stopped/healthy or cost-control cannot be verified.

## Session Log

Write:

`docs/session-logs/538-mission-3es-local-tcn-output-dir-contract-diagnosis.md`

The log must include commands, evidence, contract decision, compatibility
results, blockers, changed files, Brev read-only/default-off state, and exactly
one next action.
