# Return-To-Form High-Signal Region-Grid Materialization Goal Loop Prompt

Mission 3AU prompt for the Codex executor after Mission 3AT. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Materialize, verify, or precisely block the selected high-signal ASL Citizen
fixed-crop/region-grid tensors so the recognizer path can move from
`rgb_frames_fallback` to the intended composable `rgb_regions_grid_v1`
contract before any TCN, smoke training, Brev run, export, or browser claim.

This is a local/no-spend data-contract mission. It may edit scripts, ignored
generated manifests/tensors, tracked receipts, and docs. It must not run model
training, launch or log into Brev, import new sources, revive Detector 0 or
landmarks, export/promote a model, or change browser model claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AT evidence:
   - [`docs/validation/return-to-form-tcn-multistream-contract-scaffold-v1.json`](../validation/return-to-form-tcn-multistream-contract-scaffold-v1.json)
   - [`docs/session-logs/315-mission-3at-tcn-multistream-contract-scaffold.md`](../session-logs/315-mission-3at-tcn-multistream-contract-scaffold.md)
4. Current high-signal ASL Citizen manifests:
   - [`data/manifests/lesson/high-signal-module/train.json`](../../data/manifests/lesson/high-signal-module/train.json)
   - [`data/manifests/lesson/high-signal-module/validation.json`](../../data/manifests/lesson/high-signal-module/validation.json)
   - [`data/manifests/lesson/high-signal-module/test.json`](../../data/manifests/lesson/high-signal-module/test.json)
5. Region-grid references and reusable code:
   - [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json)
   - [`scripts/run_return_to_form_tier0_decode_dataloader.py`](../../scripts/run_return_to_form_tier0_decode_dataloader.py)
   - [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
6. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AT proved these facts:

- the selected high-signal ASL Citizen train/validation/test tensors expose
  only `rgb_frames`;
- `--require-input-contract rgb_frames_fallback` passes on all `139` selected
  clips;
- `--require-input-contract rgb_regions_grid_v1` fails before training on the
  same manifests;
- the loader can consume `rgb_regions` and derive `rgb_regions_grid_v1` when
  such tensors exist;
- true TCN was intentionally not added yet.

The next useful project movement is not training. It is to create or block the
region-grid data contract for the actual selected high-signal ASL Citizen
module.

## Required Slice

Complete exactly one smallest useful materialization slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Do not check Brev unless this prompt is explicitly replaced by a compute
prompt. This mission should stay local/no-spend.

2. Inspect the high-signal manifests and existing decode/crop code. Prefer
adapting the proven fixed-crop logic from
`scripts/run_return_to_form_tier0_decode_dataloader.py` over inventing a new
preprocessing system.

3. Implement the default materialization path unless inspection proves it is
unsafe:

- generate ASL Citizen high-signal region-grid tensors from existing approved
  raw videos and the fixed-crop config;
- store generated manifests/tensors under ignored `data/manifests/` and
  `data/tensors/` paths, but write a tracked receipt under `docs/validation/`;
- each generated tensor payload must include `rgb_regions`, `region_ids`,
  crop-config binding, and an honest `rgb_frames` compatibility region only as
  compatibility data, not as the intended input;
- generated manifests must bind source-register/source-review evidence,
  crop-config hash, tensor hashes, raw-video hashes, and decode/crop
  provenance;
- prove the generated manifests pass
  `--require-input-contract rgb_regions_grid_v1` in dry-run/check-files mode.

4. If materialization cannot be done safely in this slice, write a precise
blocker receipt instead of guessing. Acceptable blockers include missing raw
videos, source hash mismatch, crop-config unsuitability for ASL Citizen
framing, PyTorch/FFmpeg unavailability, or a manifest schema constraint that
requires a separate script-contract mission.

5. Write a tracked receipt:

`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`

The receipt must include:

- changed files and exact validation commands;
- generated ignored manifest/tensor paths or the precise blocker;
- tensor counts by split;
- input-contract proof for `rgb_regions_grid_v1` or fail-closed blocker proof;
- source, crop-config, and script hashes;
- sampled tensor payload metadata;
- explicit no-training/no-Brev/no-promotion boundaries;
- exactly one next action.

6. Select exactly one next action:

- `add_true_tcn_architecture_scaffold`: only if generated high-signal manifests
  now pass `--require-input-contract rgb_regions_grid_v1`.
- `run_capped_local_region_grid_smoke`: only if a bounded no-spend smoke now
  tests the new region-grid contract and the TCN scaffold is not yet necessary.
- `stop_for_region_grid_source_or_schema_decision`: only if materialization is
  blocked by source, schema, or crop-protocol constraints that require human
  judgment.
- `stop_for_brev_2fa`: only if the next useful action truly requires remote
  worker state after local materialization evidence exists.

## Hard Boundaries

- No model training, including local MPS smoke.
- No Brev login retry, worker create/delete/reset/stop, or paid compute.
- No new source import, SemLex training use, generated pseudo-labels, or public
  dataset training-use expansion.
- No Detector 0 or landmark training revival.
- No broad 75/80/95-label run.
- No ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3AU prompt and `GOAL.md` names Mission 3AU.
2. A local materialization path exists for high-signal ASL Citizen
   `rgb_regions` tensors, or a precise blocker explains why it cannot be added
   safely.
3. Generated manifests/tensors, if created, are ignored data artifacts but are
   hash-bound by a tracked receipt.
4. The generated manifests pass
   `--require-input-contract rgb_regions_grid_v1`, or the receipt records the
   fail-closed blocker.
5. Existing `rgb_frames_fallback` behavior remains honest and does not become a
   promoted multistream claim.
6. A tracked receipt under `docs/validation/` records the proof and exactly one
   next action.
7. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`,
   relevant JSON validation, any new script/audit check, and `git diff --check`
   exit 0 or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the selected next action is still local/no-spend and has a
  concrete architecture scaffold or smoke hypothesis.
- NUDGE if the executor treats `rgb_frames` compatibility as equivalent to the
  intended region-grid input.
- REDIRECT if the executor starts TCN or smoke work before the selected
  manifests can satisfy `rgb_regions_grid_v1`.
- STOP if the next action requires Brev auth, source approval, manual
  annotation/data collection, paid compute, or final-gate changes.
- ESCALATE before approving another speculative model-training retry if the
  receipt does not record a new testable hypothesis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AU high-signal region-grid materialization.
Completed:            <materialization path, blocker, receipt, optional code>.
Evidence:             <receipt, commands, sampled tensor proof>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/source/schema/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
