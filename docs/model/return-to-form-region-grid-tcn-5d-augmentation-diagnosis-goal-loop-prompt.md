# Return-To-Form Region-Grid TCN 5D Augmentation Diagnosis Goal Loop Prompt

Mission 3DP prompt for the Codex executor after Mission 3DO proved the remote
high-signal region-grid TCN dry-run but failed before epoch metrics in the
first DataLoader batch.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend diagnosis and repair slice for the
region-grid TCN `training_augmentation=mild` path.

The immediate blocker is:

```text
NotImplementedError: Padding size 4 is not supported for 5D input tensor.
```

Mission 3DP should make the next remote TCN smoke safe to attempt by proving,
locally and without fitting, that the high-signal region-grid DataLoader path
can load an augmented 5D batch, or by recording a narrower supported training
policy if mild augmentation is not the right local repair.

This is not model training, Brev execution, model-card promotion, ONNX export,
browser activation, or an ASL-correctness claim.

## Source Of Truth

1. Latest user instruction in the supervising Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DO receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json).
4. Mission 3DO session log:
   [`docs/session-logs/469-mission-3do-region-grid-tcn-brev-smoke-after-guard-fix.md`](../session-logs/469-mission-3do-region-grid-tcn-brev-smoke-after-guard-fix.md).
5. Mission 3DN receipt:
   [`docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json`](../validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json).
6. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Run one local source/policy diagnosis and no-fit preflight.

Required local checks:

```sh
git status --short --branch
git log -8 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-smoke-after-guard-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-brev-guard-fix-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Then inspect the M3DO failure path in `scripts/train_rawframe_model.py`,
including the call from the region-grid dataset path into
`augment_raw_rgb_frames_mild` and the tensor dimensions passed to
`torch.nn.functional.pad`.

The implementation scope is narrow:

- Prefer a small repair that makes mild augmentation explicitly support 5D
  region-grid tensors while preserving region axis semantics.
- If evidence shows mild augmentation is the wrong policy for this tensor
  contract, record and implement the smallest bounded policy downselect needed
  for the high-signal region-grid TCN smoke path.
- Preserve the older M3AW capped local dry-run contract and the M3DM full-split
  dry-run contract.
- Add or update focused local validation only for this contract. Do not create
  a parallel audit system.

Required proof after any source/policy change:

1. `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`
2. The old M3AW capped local dry-run still passes.
3. The M3DM high-signal full-split dry-run still passes.
4. A local no-fit preflight exercises the actual high-signal region-grid
   DataLoader path far enough to load at least one `training_augmentation=mild`
   train batch, or proves the selected no-mild policy batch path. This preflight
   must not run optimizer, backward, epoch training, checkpoint writes, or
   evaluation.

## Boundaries

- No Brev `exec`, `sync`, training, start, stop, copy, or lifecycle command in
  this mission. Read-only `brev ls --json` may be recorded only as provider
  state.
- No fitting, backward pass, optimizer step, epoch training, checkpoint creation
  or update, evaluation, copyback, or model artifact promotion.
- No broad 75/80/95-label work.
- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, vocabulary expansion, model-card promotion, ONNX export, browser
  trained activation, threshold promotion, final-readiness claim, positive
  ASL-correctness claim, raw learner-video upload, push, amend, no-verify, or
  duplicate worker.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-5d-augmentation-diagnosis-v1.json`

The receipt must include:

- local checks;
- the M3DO failure summary and exact root-cause classification;
- files inspected and any source/policy changes;
- proof that M3AW and M3DM dry-run contracts still pass;
- the no-fit one-batch preflight command/status;
- `pretrained_components: []` and no new source/register/data/model promotion;
- all negative authorizations from the Boundaries section;
- read-only Brev provider state if checked, including any known stop-mismatch
  blocker;
- exactly one next action.

Allowed next actions:

- `continue_bounded_brev_tcn_smoke_after_5d_augmentation_fix` if the local
  5D augmentation or policy repair is proven and the only useful next slice is
  a new bounded remote M3DO-style smoke with fresh compute receipt.
- `continue_local_tcn_augmentation_or_contract_repair` if the local diagnosis
  narrows the issue but does not yet prove the one-batch no-fit path.
- `continue_training_policy_downselect_no_remote` if the evidence shows mild
  augmentation should be removed or replaced before another Brev run.
- `escalate_strategy_research` if the local source/input evidence shows a
  repeated model-input/training-policy failure without a clear local repair.
- `stop_for_human_cost_control_review` if Brev provider/cost state, rather than
  local source repair, becomes the blocking issue.

## Session Log

Write:

`docs/session-logs/471-mission-3dp-region-grid-tcn-5d-augmentation-diagnosis.md`

The log must include commands, evidence, root-cause classification, any scoped
source/policy changes, local no-fit proof, blockers, changed files, Brev
provider state if checked, and exactly one next action.
