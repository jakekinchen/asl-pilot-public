# Return-To-Form True TCN Architecture Scaffold Goal Loop Prompt

Mission 3AV prompt for the Codex executor after Mission 3AU. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Add, verify, or precisely block the smallest compile-only true
TCN/TemporalConvNet architecture scaffold for the high-signal ASL Citizen
`rgb_regions_grid_v1` recognizer path. This is a local/no-spend architecture
contract mission, not a training mission.

It may edit training/model code, tests/audits, tracked receipts, and docs. It
must not run model training, launch or log into Brev, import sources, revive
Detector 0 or landmarks, export/promote a model, or change browser model
claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AU evidence:
   - [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json)
   - [`docs/session-logs/317-mission-3au-high-signal-region-grid-materialization.md`](../session-logs/317-mission-3au-high-signal-region-grid-materialization.md)
4. M3AT/M3AS contract evidence:
   - [`docs/validation/return-to-form-tcn-multistream-contract-scaffold-v1.json`](../validation/return-to-form-tcn-multistream-contract-scaffold-v1.json)
   - [`docs/validation/return-to-form-composable-recognizer-contract-v1.json`](../validation/return-to-form-composable-recognizer-contract-v1.json)
5. Current implementation surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
6. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AU proved these facts:

- ignored high-signal ASL Citizen region-grid manifests/tensors exist under
  `data/manifests/lesson/high-signal-region-grid/` and
  `data/tensors/asl-citizen-high-signal-region-grid/`;
- tensor counts are train `84`, validation `27`, and test `28`;
- explicit dry-run/check-files validation observed `rgb_regions_grid_v1` for
  `139/139` selected clips;
- payloads include `rgb_regions`, `region_ids`, crop-config binding, and an
  `rgb_frames` compatibility region, while the loader consumes `rgb_regions`
  first;
- no true named TCN/TemporalConvNet architecture is implemented.

The next useful project movement is not training. It is to make the true TCN
architecture option explicit and compile-checked against the now-available
region-grid input contract before any capped smoke or remote compute decision.

## Required Slice

Complete exactly one smallest useful scaffold slice.

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

2. Inspect existing architecture patterns in
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py),
   especially `motion_2d_temporal_cnn`, model construction, allowed
   architecture constants, dry-run behavior, and input-contract validation.

3. Implement the default scaffold unless inspection proves it is unsafe:

- add a named true TCN/TemporalConvNet architecture option or module that is
  random-initialized and has no pretrained dependency;
- keep it compile-only in this mission: no optimizer step, no local MPS smoke,
  no remote run, and no metric claim;
- bind the intended input to `rgb_regions_grid_v1` or document precisely why
  the current region-grid shape must first be adapted;
- preserve existing `motion_2d_temporal_cnn` and `rgb_frames_fallback`
  behavior for current callers;
- keep the `--require-input-contract rgb_regions_grid_v1` guard fail-closed
  before any future smoke/training command.

4. If a true TCN scaffold cannot be added safely in this slice, write a precise
   blocker receipt instead of guessing. Acceptable blockers include shape
   ambiguity, model-constructor coupling that needs a separate refactor, missing
   compile-test affordance, or a need for human architecture scope review.

5. Write a tracked receipt:

`docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json`

The receipt must include:

- changed files and exact validation commands;
- architecture name, model-constructor path, and no-pretrained proof;
- compile/dry-run evidence that does not train;
- confirmation that generated high-signal region-grid manifests still pass
  `--require-input-contract rgb_regions_grid_v1`;
- explicit no-training/no-Brev/no-promotion boundaries;
- exactly one next action.

6. Select exactly one next action:

- `run_capped_local_region_grid_tcn_smoke`: only if a compile-only true TCN
  scaffold exists and the receipt records a bounded no-spend smoke hypothesis.
- `run_capped_local_region_grid_motion_cnn_smoke`: only if true TCN is blocked
  or unnecessary and the receipt records a bounded no-spend comparison
  hypothesis for the existing temporal model.
- `stop_for_architecture_scope_decision`: only if true TCN shape/scope needs
  human judgment before code proceeds.
- `stop_for_brev_2fa`: only if the next useful action truly requires remote
  worker state after local scaffold evidence exists.

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

1. The active prompt is this M3AV prompt and `GOAL.md` names Mission 3AV.
2. A compile-only true TCN/TemporalConvNet architecture scaffold exists for the
   high-signal `rgb_regions_grid_v1` path, or a precise blocker explains why it
   cannot be added safely.
3. The scaffold is random-initialized/no-pretrained and does not run training.
4. The generated high-signal region-grid manifests still pass
   `--require-input-contract rgb_regions_grid_v1`.
5. Existing fallback behavior remains honest and does not become a promoted
   multistream or trained-browser claim.
6. A tracked receipt under `docs/validation/` records the proof and exactly one
   next action.
7. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`,
   relevant JSON validation, any new compile/audit check, and `git diff --check`
   exit 0 or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the selected next action is still local/no-spend and has a
  concrete bounded smoke hypothesis or a non-training scaffold follow-up.
- NUDGE if the executor claims TCN progress without a named compile-checked
  architecture option or no-pretrained proof.
- REDIRECT if the executor starts smoke/training before the TCN scaffold and
  `rgb_regions_grid_v1` guard are both proven.
- STOP if the next action requires Brev auth, source approval, manual
  annotation/data collection, paid compute, or final-gate changes.
- ESCALATE before approving another speculative model-training retry if the
  receipt does not record a new testable hypothesis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AV true TCN architecture scaffold.
Completed:            <compile-only TCN scaffold, blocker, receipt, optional code>.
Evidence:             <receipt, commands, input-contract proof>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/source/schema/architecture blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
