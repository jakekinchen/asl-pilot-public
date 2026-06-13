# Return-To-Form Region-Grid TCN M3DS Input-Contract Command Diagnosis Goal Loop Prompt

Mission 3DT prompt for the Codex executor after Mission 3DS proved the fixed
M3DQ remote dry-run but failed before training because the timed training
command used `--require-input-contract` without `--dry-run`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose and repair the local prompt/source-policy contract for the M3DS timed
training command.

Mission 3DS proved the remote dry-run command, including:

```text
--dry-run --require-input-contract rgb_regions_grid_v1
```

but the timed training command reused:

```text
--require-input-contract rgb_regions_grid_v1
```

without `--dry-run`, and current `scripts/train_rawframe_model.py` rejects that
combination before training:

```text
Manifest validation failed: --require-input-contract is a no-training input-contract audit and requires --dry-run
```

This mission is local/no-spend and no-training. It should determine whether the
correct repair is to keep `--require-input-contract` on dry-runs only and remove
it from the future timed training command, or whether a narrow source/test
change is justified for an explicit training-time contract assertion.

Prefer a prompt-command repair unless code inspection proves the source policy
is wrong. The remote dry-run already proved every clip in the high-signal
region-grid manifests carries `rgb_regions_grid_v1`.

## Authorization

No fresh Brev spend is authorized by this prompt.

Do not run `brev exec`, `bash scripts/brev_sync_repo.sh`, `brev copy`,
`brev start`, `brev stop`, `brev stop --all`, remote dry-run, remote training,
or any Brev lifecycle command in this mission. A read-only `brev ls --json` is
allowed only if needed to keep the cost-control note current.

Do not run fitting, backward, optimizer, epoch training, checkpoint creation,
evaluation, copyback, export, promotion, browser trained activation, final
readiness, or an ASL-correctness claim.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DS receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json).
4. Mission 3DS session log:
   [`docs/session-logs/478-mission-3ds-region-grid-tcn-m3dq-brev-smoke-approved.md`](../session-logs/478-mission-3ds-region-grid-tcn-m3dq-brev-smoke-approved.md).
5. Mission 3DR receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json).
6. Mission 3DQ receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json).
7. Current train/eval command policy in
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).

## Required Slice

Complete one local command-policy diagnosis pass:

1. Verify local state and no-pretrained/source boundaries.
2. Parse the M3DS receipt and session log.
3. Inspect `--require-input-contract`, `--dry-run`, `validate_training_invocation`,
   and input-contract validation flow in `scripts/train_rawframe_model.py`.
4. Decide whether the timed training command should omit
   `--require-input-contract` after the dry-run proves the contract, or whether
   source support for a separate training-time contract assertion is justified.
5. If the source policy is correct, repair only the prompt/command contract for
   the follow-on Brev smoke; do not patch implementation source.
6. If the source policy is wrong, make the smallest source/test/doc change that
   preserves the no-training audit semantics and proves the training command
   cannot silently use the wrong tensor contract.
7. Record the exact future remote dry-run command and timed training command
   contract. The expected prompt-only repair is:
   - dry-run keeps `--dry-run --require-input-contract rgb_regions_grid_v1`;
   - timed training removes `--require-input-contract rgb_regions_grid_v1`.
8. Optionally create a corrected follow-on Brev smoke prompt only as a durable
   artifact; do not activate remote compute from this mission.
9. Write the tracked receipt and numbered session log.
10. Commit only scoped prompt, docs, receipt, test, and session-log changes.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-approved-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-output-guard-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-5d-fix-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Recommended local inspection commands:

```sh
rg -n "require_input_contract|require-input-contract|dry_run|dry-run|validate_training_invocation" scripts/train_rawframe_model.py
sed -n '430,470p' scripts/train_rawframe_model.py
sed -n '2390,2430p' scripts/train_rawframe_model.py
sed -n '4360,4410p' scripts/train_rawframe_model.py
```

M3DS dry-run command must remain conceptually equivalent to:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

Expected prompt-only repaired timed training command:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 3600 /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dq-high-signal-region-grid-tcn-brev --model-id m3dq-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

Do not execute either Brev command in this mission.

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

`docs/validation/return-to-form-region-grid-tcn-m3ds-input-contract-command-diagnosis-v1.json`

The receipt must include:

- M3DS failure classification and exact rejected command option;
- source/prompt-policy decision;
- changed files;
- local audit results;
- code inspection evidence for `--require-input-contract` and `--dry-run`;
- corrected dry-run command contract;
- corrected timed training command contract;
- Brev command avoidance or read-only provider state if checked;
- `pretrained_components: []`;
- all negative authorizations from Boundaries;
- exactly one next action.

Allowed next actions:

- `request_brev_smoke_approval_after_m3ds_input_contract_fix` if the local
  command contract is repaired and the only useful next step is a fresh bounded
  remote smoke prompt with human-visible compute envelope.
- `continue_bounded_brev_tcn_smoke_after_m3ds_input_contract_fix` if a corrected
  bounded remote prompt exists, the latest supervising approval is still deemed
  applicable by the observer, and the compute envelope remains unchanged.
- `continue_local_tcn_input_contract_policy_repair` if the prompt/source policy
  remains unresolved.
- `continue_product_or_reduced_claim_after_m3ds` if evidence says this route is
  not promising and no immediate source/input bug remains.
- `escalate_strategy_research` if repeated audited pre-training or learning
  failures make the route unclear.
- `stop_for_human_cost_control_review` if Brev provider/cost state becomes the
  blocker.

## Session Log

Write:

`docs/session-logs/480-mission-3dt-region-grid-tcn-m3ds-input-contract-command-diagnosis.md`

The log must include commands, evidence, contract decision, corrected command
contract, blockers, changed files, Brev command avoidance or read-only provider
state, and exactly one next action.
