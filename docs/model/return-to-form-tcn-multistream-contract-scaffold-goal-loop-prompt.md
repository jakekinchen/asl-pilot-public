# Return-To-Form TCN/Multistream Contract Scaffold Goal Loop Prompt

Mission 3AT prompt for the Codex executor after Mission 3AS. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Turn the M3AS contract finding into one concrete no-spend scaffold: make the
training/input contract explicit enough that the next recognizer step cannot
accidentally train on `rgb_frames` fallback while claiming a composable
fixed-crop or multistream path.

This is a code-contract and evidence mission. It may edit training/audit code,
docs, and validation receipts. It must not run training, launch Brev, promote a
model, export trained ONNX, or change browser model claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AS evidence:
   - [`docs/validation/return-to-form-composable-recognizer-contract-v1.json`](../validation/return-to-form-composable-recognizer-contract-v1.json)
   - [`docs/session-logs/312-mission-3as-composable-recognizer-contract.md`](../session-logs/312-mission-3as-composable-recognizer-contract.md)
   - [`docs/session-logs/313-correct-m3as-receipt-sample-hashes.md`](../session-logs/313-correct-m3as-receipt-sample-hashes.md)
4. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine and Mutable Tactical Overlay.
5. Current implementation surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`data/manifests/lesson/high-signal-module/train.json`](../../data/manifests/lesson/high-signal-module/train.json)
   - [`data/manifests/lesson/high-signal-module/validation.json`](../../data/manifests/lesson/high-signal-module/validation.json)
   - [`data/manifests/lesson/high-signal-module/test.json`](../../data/manifests/lesson/high-signal-module/test.json)
   - [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json)

## Current Evidence

M3AS proved these facts:

- high-signal ASL Citizen tensors sampled from train/validation/test expose
  `rgb_frames` only;
- the current loader can consume `rgb_regions` and derive
  `rgb_regions_grid_v1` when region tensors exist;
- the current ASL Citizen high-signal route therefore uses full-frame fallback,
  not the original fixed-crop/multistream contract;
- no true named TCN/TemporalConvNet architecture is implemented;
- `motion_2d_temporal_cnn` is the closest existing temporal architecture;
- Brev remains logged out at EOF/human auth, so remote worker state and paid
  compute are unavailable.

The highest-value next move is not training. It is to make the intended input
contract fail closed before any future smoke, Brev run, TCN addition, or
promotion claim.

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

Do not check Brev unless the selected next action would require remote worker
state; this mission should stay local/no-spend by default.

2. Inspect the current loader and CLI gates in
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py),
   especially `load_tensor_file_with_contract`, `--check-files`, `--dry-run`,
   `--reduced-real-data-module`, and `--reduced-real-data-training-smoke`.

3. Implement the default scaffold unless inspection proves a smaller equivalent
   local pattern already exists:

- add an explicit no-training input-contract requirement or audit path for the
  high-signal/reduced-real-data manifests;
- it must be able to distinguish at least:
  - `rgb_frames` fallback;
  - `rgb_regions_grid_v1` derived from `rgb_regions`;
- when the caller requires `rgb_regions_grid_v1` but sampled tensors only have
  `rgb_frames`, the check must fail clearly before training;
- when the caller allows/documentedly expects `rgb_frames`, the check must pass
  and record that fallback honestly;
- preserve existing loader behavior for current callers unless the new guard is
  explicitly requested.

Use the repo's existing argparse/check-files/dry-run style. Avoid a new
framework or broad refactor.

4. Write a tracked receipt:

`docs/validation/return-to-form-tcn-multistream-contract-scaffold-v1.json`

The receipt must include:

- changed files and exact validation commands;
- input-contract names and pass/fail behavior;
- a high-signal ASL Citizen proof showing `rgb_frames` fallback is detected;
- a retained-region proof or reference showing `rgb_regions_grid_v1` remains
  the intended region-grid contract when region tensors exist;
- the true-TCN decision for this slice: `not_added_yet`,
  `scaffolded_no_training`, or `blocked`;
- explicit no-training/no-Brev/no-promotion boundaries;
- exactly one next action.

5. Select exactly one next action:

- `materialize_high_signal_region_grid_tensors`: only if the guard proves the
  next blocker is that selected ASL Citizen tensors lack fixed-crop/region-grid
  tensors.
- `add_true_tcn_architecture_scaffold`: only if the input contract is now clear
  and the smallest useful next code slice is a compile-only TCN module/option.
- `run_capped_local_contract_smoke`: only if a bounded no-spend smoke now tests
  a new hypothesis rather than re-testing fallback.
- `stop_for_source_or_region_annotation_decision`: only if region-grid tensors
  require a source/annotation/manual-review choice.
- `stop_for_brev_2fa`: only if the next useful action truly requires remote
  worker state.

## Hard Boundaries

- No training run, including local MPS smoke, unless this prompt is first
  replaced by a bounded smoke prompt.
- No paid Brev compute, worker create/delete/reset/stop, or login retry.
- No source import, SemLex training use, generated pseudo-labels, or new public
  dataset training use.
- No Detector 0 or landmark training revival.
- No broad 75/80/95-label run.
- No ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3AT prompt and `GOAL.md` names Mission 3AT.
2. A no-training input-contract scaffold or equivalent audit exists, or a
   precise blocker explains why it cannot be added safely.
3. The scaffold can distinguish `rgb_frames` fallback from
   `rgb_regions_grid_v1` and fails clearly when a required contract is absent.
4. Existing allowed fallback behavior remains honest and does not become a
   promoted multistream claim.
5. A tracked receipt under `docs/validation/` records the proof and exactly one
   next action.
6. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`,
   relevant JSON validation, any new audit/check command, and
   `git diff --check` exit 0 or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE only if the selected next action is still local/no-spend and has a
  concrete hypothesis or scaffold target.
- REDIRECT if the executor tries to train before the input contract is fail
  closed.
- STOP if the next action requires Brev auth, source approval, manual
  annotation/data collection, paid compute, or final-gate changes.
- ESCALATE before approving another speculative training-style retry if the
  receipt does not record a new testable hypothesis.
- NUDGE if the executor treats full-frame `rgb_frames` fallback as equivalent
  to fixed-crop/multistream input.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AT TCN/multistream contract scaffold.
Completed:            <input-contract scaffold, audit, receipt, optional code>.
Evidence:             <receipt, commands, sampled tensor proof>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/source/annotation/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
