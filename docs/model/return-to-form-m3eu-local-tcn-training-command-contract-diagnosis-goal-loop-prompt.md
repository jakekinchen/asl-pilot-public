# Return-To-Form M3EU Local TCN Training-Command Contract Diagnosis Goal Loop Prompt

Mission 3EU prompt for the Codex executor after Mission 3ET reached the
single timed training command and failed before training.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or decisively downselect the local region-grid TCN training-command
contract that blocked M3ET before fitting. This is a local/no-remote,
no-spend, no-training contract slice. The likely fix is prompt/command
steering: keep `--require-input-contract rgb_regions_grid_v1` on dry-run audit
commands, and remove it from any future non-dry-run timed training command
unless code inspection proves a different local policy is intended.

This is not a Brev retry, remote dry-run, remote training run, model-card
promotion, ONNX export, browser activation, final readiness claim, or
ASL-correctness claim.

## Starting Evidence

- M3ET executor commit `45775cf` wrote
  [`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`](../validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json)
  and
  [`docs/session-logs/540-mission-3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix.md`](../session-logs/540-mission-3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix.md).
- M3ET started only `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, proved the
  remote CUDA surface, synced once, verified remote hashes, and passed the
  required remote dry-run/check-files command for
  `output/m3er-high-signal-region-grid-tcn-brev`, model id
  `m3er-high-signal-region-grid-tcn-brev`, input contract
  `rgb_regions_grid_v1`, and 139 high-signal region-grid clips.
- M3ET then ran exactly one timed training command. It failed before training
  because it included `--require-input-contract rgb_regions_grid_v1` without
  `--dry-run`.
- Exact M3ET failure:

```text
Manifest validation failed: --require-input-contract is a no-training input-contract audit and requires --dry-run
exit status 2
```

- M3ET classification:
  `timed_training_command_includes_dry_run_only_input_contract_flag`.
- M3ET performed no training and wrote no checkpoint, provenance, evaluation,
  copyback artifact, export, promotion, browser activation, product-runtime
  change, source/media import, source-register/manifest/tensor/vocabulary/
  packet mutation, dependency mutation, label expansion, worker creation,
  worker delete/reset, push, or pretrained/generated-label path.
- M3ET verified final Brev state as `STOPPED` / `COMPLETED` / `NOT READY` /
  `HEALTHY`.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Authorization

No fresh Brev spend or remote execution is authorized by this prompt.

Do not run `brev start`, `brev exec`, `bash scripts/brev_sync_repo.sh`,
`brev copy`, remote dry-run, remote training, package install, or any Brev
lifecycle command in M3EU. A read-only `brev ls --json` is required for
default-off visibility. If read-only state unexpectedly reports the retained
worker as `RUNNING`, stop only that existing worker as a cost-control action,
verify stopped state, record the blocker, and do not continue into remote work.

Do not run a non-dry-run training command locally or remotely. Do not run
fitting, backward, optimizer, epoch training, checkpoint creation, evaluation
from a checkpoint, copyback, export, promotion, browser trained activation, or
final-readiness claim.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3ET receipt:
   [`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`](../validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json).
4. M3ET session log:
   [`docs/session-logs/540-mission-3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix.md`](../session-logs/540-mission-3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix.md).
5. M3ET prompt:
   [`docs/model/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-goal-loop-prompt.md`](return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-goal-loop-prompt.md).
6. Current training-policy implementation:
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
7. Current evaluation implementation:
   [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py).
8. Prior input-contract command diagnosis:
   [`docs/session-logs/480-mission-3dt-region-grid-tcn-m3ds-input-contract-command-diagnosis.md`](../session-logs/480-mission-3dt-region-grid-tcn-m3ds-input-contract-command-diagnosis.md).
9. M3ES local output-dir contract receipt:
   [`docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json`](../validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json).

## Required Slice

Complete one local command-contract pass:

1. Verify local state, active prompt, local audits, fail-closed claim surfaces,
   M3ET receipt, and Brev default-off visibility.
2. Inspect the current `--require-input-contract` implementation and record why
   it is dry-run-only.
3. Inspect the M3ET dry-run command and timed training command, then decide
   whether the next bounded remote prompt should remove
   `--require-input-contract` only from the non-dry-run timed command while
   preserving it on dry-run/check-files audit commands.
4. If the blocker is only prompt/command steering, make the smallest prompt or
   documentation change needed. Do not edit source code just to work around a
   correct dry-run-only guard.
5. If code inspection proves the implementation contradicts the intended local
   policy, make the smallest source/test/doc change needed to make that policy
   explicit, but do not weaken the no-training input-contract audit semantics.
6. Prove locally that the M3ET dry-run style with
   `--dry-run --require-input-contract rgb_regions_grid_v1` still passes.
7. Prove locally that the same M3ET command shape without
   `--require-input-contract` passes manifest/argument validation in dry-run
   form. Do not run a non-dry-run training command as proof.
8. Write the tracked M3EU receipt and numbered session log.
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
python3 -m json.tool docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
brev ls --json
git diff --check
```

Implementation inspection evidence:

```sh
rg -n "require_input_contract|--require-input-contract|dry-run|region_grid_tcn_training_smoke" scripts/train_rawframe_model.py
```

M3ET dry-run with input-contract audit, expected to remain allowed:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1
```

M3ET timed-command shape without the dry-run-only flag, validated only as a
dry-run command so no training occurs:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3er-high-signal-region-grid-tcn-brev --model-id m3er-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run
```

If local dry-run commands would write output metadata, inspect the script first
and keep artifacts out of the commit unless a repo convention already tracks
them.

## Boundaries

- Local/no-spend only.
- No Brev start/exec/sync/copy, remote dry-run, remote training, package
  install, or worker lifecycle command except stopping the existing worker if
  read-only state unexpectedly shows it running.
- No non-dry-run training command, fitting, backward, optimizer, epoch
  training, checkpoint creation, evaluation from checkpoint, copyback, export,
  promotion, browser activation, final-readiness claim, or positive
  ASL-correctness claim.
- No broad 75/80/95-label work.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, threshold promotion,
  final-gate weakening, raw learner-video upload, push, amend, no-verify,
  duplicate worker, worker delete, or worker reset.

## Receipt

Write:

`docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json`

The receipt must include:

- M3ET failure classification and exact rejected command policy;
- local source/prompt-command decision;
- changed files;
- local audit results;
- `--require-input-contract` implementation evidence;
- M3ET dry-run-with-input-contract status;
- M3ET dry-run-without-input-contract status;
- explicit statement that no non-dry-run training command was run;
- Brev read-only provider state and any default-off stop action if needed;
- fail-closed claim-surface status;
- `pretrained_components: []`;
- all negative authorizations from Boundaries;
- exactly one next action.

Allowed next actions:

- `continue_bounded_brev_tcn_training_smoke_after_m3eu_command_fix` if the
  local command contract is repaired/proven, fail-closed claims remain
  unchanged, no non-dry-run command ran, and Brev remains stopped.
- `continue_prompt_only_training_command_repair_no_remote` if the local
  decision is prompt-only but the durable next remote prompt still needs
  steering.
- `continue_local_tcn_training_command_contract_triage_no_remote` if the
  command contract remains unresolved.
- `continue_openai_or_gpt_pro_research` if the local policy decision exposes a
  higher-cost strategy question.
- `stop_for_brev_provider_or_budget_blocker` if Brev read-only state is not
  stopped/healthy or cost-control cannot be verified.

## Session Log

Write:

`docs/session-logs/542-mission-3eu-local-tcn-training-command-contract-diagnosis.md`

The log must include commands, evidence, contract decision, dry-run results,
blockers, changed files, Brev read-only/default-off state, and exactly one
next action.
