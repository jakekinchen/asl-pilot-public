# Return-To-Form Region-Grid TCN Local Smoke Goal Loop Prompt

Mission 3AW prompt for the Codex executor after Mission 3AV. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run, verify, or precisely block exactly one capped local/no-spend training
smoke for `true_temporal_convnet_region_grid` on the generated high-signal ASL
Citizen `rgb_regions_grid_v1` manifests. This is a bounded learning-signal
probe only; it is not a promotion, export, Brev, final-readiness, or browser
activation mission.

This mission may edit training/evaluation code only to add the smallest
explicit region-grid smoke contract needed to run the bounded local smoke
safely. It may write ignored smoke artifacts under `output/`, tracked receipts,
and docs. It must not run a second training attempt, launch or log into Brev,
import sources, revive Detector 0 or landmarks, export/promote a model, or
change browser model claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AV evidence:
   - [`docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json`](../validation/return-to-form-true-tcn-architecture-scaffold-v1.json)
   - [`docs/session-logs/319-mission-3av-true-tcn-architecture-scaffold.md`](../session-logs/319-mission-3av-true-tcn-architecture-scaffold.md)
4. M3AU evidence:
   - [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json)
   - [`docs/session-logs/317-mission-3au-high-signal-region-grid-materialization.md`](../session-logs/317-mission-3au-high-signal-region-grid-materialization.md)
5. Prior observer strategy context:
   - [`artifacts/research/observer-195-tier0-strategy-api-response.md`](../../artifacts/research/observer-195-tier0-strategy-api-response.md)
6. Current implementation surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/compile_true_tcn_architecture.py`](../../scripts/compile_true_tcn_architecture.py)
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AV proved these facts:

- `true_temporal_convnet_region_grid` exists and is random-initialized with no
  pretrained components;
- compile-only eval/no-grad proof passed with input shape `[2,16,3,96,96]`,
  logits shape `[2,7]`, and `1294321` parameters;
- generated high-signal region-grid manifests still pass
  `--require-input-contract rgb_regions_grid_v1` for `139/139` selected clips;
- no optimizer, loss, backward pass, training step, Brev action, source import,
  export, browser claim, final-gate change, or push occurred.

Important guardrail: the M3AV compile input shape is not proof that region
identity is preserved. Current code derives `rgb_regions_grid_v1` by tiling
`rgb_regions` into a `[T,192,288,3]` mosaic, then `prepare_frames` resizes it
back to `[T,3,96,96]`. The prior strategy memo specifically warned that this
kind of crop-identity/scale loss is a likely failure mode. M3AW must not spend
its one authorized smoke on that collapsed mosaic path.

The prior observer strategy memo warned not to keep repeating generic training
runs. This smoke is allowed only because it tests a new representation and
architecture hypothesis: materialized region-grid tensors plus a true TCN may
show a train-sanity/held-out signal that the prior full-frame and fallback
paths could not test. That hypothesis is valid only if the smoke preserves the
region axis or records a precise blocker explaining why the region-preserving
adapter cannot be added safely.

## Required Slice

Complete exactly one smallest useful smoke slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py
```

Do not check Brev unless this prompt is explicitly replaced by a compute
prompt. This mission should stay local/no-spend.

2. Re-run the no-training input-contract proof before any training command:

- the generated high-signal train/validation/test region-grid manifests must
  pass `--require-input-contract rgb_regions_grid_v1`;
- if the guard fails, stop and write a blocker receipt.

3. Before any training command, inspect and prove the model input
   representation. A valid M3AW smoke must preserve region identity from the
   `rgb_regions` tensor, for example as `[B,T,R,C,H,W]`, `[B,T,R,H,W,C]`, or a
   clearly documented equivalent that keeps region identity available to the
   model before spatial encoding. A training input that reaches the model only
   as a resized mosaic `[B,T,3,96,96]` does not satisfy this mission.

If the current `RawFrameClipDataset`/`prepare_frames` path would collapse the
region-grid payload into a mosaic, add the smallest region-axis-preserving
adapter and compile proof before running the one smoke. If that cannot be done
safely in this slice, stop and write `stop_for_region_grid_smoke_contract_blocker`.

4. Inspect the training invocation policy in
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
   If there is no safe region-grid training-smoke policy, add the smallest
   explicit script-contract support for this mission only. Prefer a named flag
   or equivalent narrow policy such as `region_grid_tcn_training_smoke` that
   enforces:

- train/validation/test manifests exactly under
  `data/manifests/lesson/high-signal-region-grid/`;
- output directory exactly `output/m3aw-region-grid-tcn-local-smoke`;
- architecture exactly `true_temporal_convnet_region_grid`;
- `--check-files`, `--frame-count 16`, `--image-size 96`, and `--num-workers 0`;
- max `2` epochs;
- max batch size `4`;
- max train batches `12` and max validation batches `8`, or stricter caps if
  the repo's existing training loop requires different cap wiring;
- a region-axis-preserving model input proof recorded before the training run;
- random initialization and `pretrained_components: []`.

Do not broaden final, lesson, or prior reduced-smoke policies to make this run
work. Add a narrow region-grid smoke contract or record a blocker.

5. Run exactly one local training smoke after the dry-run, region-axis
   preservation proof, and script-contract checks pass. The expected output
   root is:

`output/m3aw-region-grid-tcn-local-smoke/`

This output is ignored and non-promotional. Do not copy artifacts into
`artifacts/rawframe-model` or `web/public/model`.

6. Evaluate the resulting checkpoint if the training command produced one. Use
   the same train/validation/test region-grid manifests and write evaluation
   reports under the same ignored output root. If evaluation cannot run safely,
   record that as a blocker in the tracked receipt rather than guessing.

7. Write a tracked receipt:

`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`

The receipt must include:

- changed files and exact validation/training/evaluation commands;
- dry-run input-contract proof for `rgb_regions_grid_v1`;
- raw `rgb_regions` shape, model input shape, and proof that the region axis or
  an equivalent region identity signal reached the model;
- smoke caps and observed runtime/device;
- train loss/accuracy movement and validation/test top-1 or clear blocker;
- explicit non-promotion language;
- no-pretrained/no-Brev/no-export/no-browser-claim boundaries;
- exactly one next action.

8. Select exactly one next action:

- `continue_region_grid_tcn_smoke_evaluation_diagnosis`: only if the one smoke
  completed and a non-training diagnosis/report is needed to interpret metrics.
- `stop_for_local_tcn_smoke_review`: if the smoke completed and the next step
  is a human ML/scope decision or any second training attempt.
- `stop_for_region_grid_smoke_contract_blocker`: if a safe bounded local smoke
  contract cannot be added without broader refactor.
- `stop_for_brev_2fa`: only if the next useful action truly requires remote
  worker state.

## Hard Boundaries

- Exactly one local training smoke is authorized by this prompt.
- No second run, hyperparameter sweep, longer rerun, broad label expansion, or
  training retry after failure.
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

1. The active prompt is this M3AW prompt and `GOAL.md` names Mission 3AW.
2. The generated high-signal region-grid manifests pass
   `--require-input-contract rgb_regions_grid_v1` immediately before training,
   or the receipt records a fail-closed blocker.
3. The training/model path preserves region identity from `rgb_regions`, or the
   receipt records a precise blocker before any training run.
4. A narrow bounded local region-grid TCN smoke policy exists or a precise
   blocker explains why it cannot be added safely.
5. Exactly one capped local training smoke runs with the M3AW caps, or the
   receipt records the script-contract/runtime blocker before training.
6. Outputs remain ignored under `output/m3aw-region-grid-tcn-local-smoke/` and
   are not promoted to browser/final model paths.
7. A tracked receipt under `docs/validation/` records the proof and exactly one
   next action.
8. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py`,
   relevant JSON validation, relevant smoke/evaluation commands, and
   `git diff --check` exit 0 or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only for a non-training evaluation/diagnosis follow-up with concrete
  metric questions and no second training run.
- STOP if the next action is any second training attempt, Brev auth, source
  approval, manual annotation/data collection, paid compute, final-gate change,
  export, or browser activation.
- ESCALATE before approving another training-style retry unless the smoke
  receipt records a genuinely new, testable hypothesis and a current strategy
  memo.
- NUDGE if the executor treats train fit or local smoke artifacts as promotion
  evidence.
- REDIRECT if the executor broadens the smoke contract beyond the generated
  region-grid TCN path.
- REDIRECT if the executor attempts to spend the one smoke on the collapsed
  resized mosaic path instead of preserving region identity or recording a
  blocker.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AW capped region-grid TCN local smoke.
Completed:            <one bounded smoke, blocker, receipt, optional code>.
Evidence:             <receipt, commands, metrics, input-contract proof>.
Remaining:            <single next action>.
Blockers:             <none or exact script/runtime/auth/source/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
