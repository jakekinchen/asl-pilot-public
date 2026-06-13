# Return-To-Form Region-Grid TCN Tiny Overfit Goal Loop Prompt

Mission 3AX prompt for the Codex executor after Mission 3AW. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run, verify, or precisely block exactly one local/no-spend tiny memorization
sanity probe for `true_temporal_convnet_region_grid` on the existing generated
high-signal ASL Citizen `rgb_regions_grid_v1` tensors.

This is not a normal training retry. It answers one narrow question:

Can the preserved-region TCN path memorize a tiny deterministic subset of the
current seven-label region-grid data?

If it cannot memorize the tiny subset, the training lane should stop and
backtrack to crop/data/vocabulary/product-fallback diagnosis. If it can
memorize, the next step is still not broad training; it is a no-spend
vocabulary/crop separability diagnosis or a separately approved compute plan.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3AW evidence:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/session-logs/322-mission-3aw-region-grid-tcn-local-smoke.md`](../session-logs/322-mission-3aw-region-grid-tcn-local-smoke.md)
   - [`docs/session-logs/323-observer-stop-local-tcn-smoke-review.md`](../session-logs/323-observer-stop-local-tcn-smoke-review.md)
4. API strategy memo:
   - [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md)
5. Current implementation surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
6. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3AW proved:

- `rgb_regions_grid_v1` exists for `139/139` selected high-signal clips;
- the corrected training path preserves region identity to the model as
  `B,T,R,C,H,W` with observed batched shape `[2,16,5,3,96,96]`;
- one capped local MPS smoke completed from random initialization;
- target metrics failed: validation top-1 `0.037037037037037035`, validation
  macro F1 `0.015037593984962407`, test top-1
  `0.17857142857142858`, and test macro F1 `0.09166666666666666`;
- no Brev, source import, export, promotion, browser claim, or final-gate
  change occurred.

The post-M3AW API strategy memo says not to resume normal training or use Brev
yet. Its recommended next mission is a tiny deterministic overfit probe. That
memo is advisory, but its recommendation is now bound into this prompt.

## Required Slice

Complete exactly one smallest useful tiny memorization slice.

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

Do not run Brev commands in this mission.

2. Select a tiny deterministic subset from the existing high-signal
   `rgb_regions_grid_v1` training manifest only:

- prefer one or two clips per label for the current seven labels;
- total target size should be about 7-14 clips;
- record clip ids, label ids, label names, tensor paths, source manifest, and
  hashes in the tracked receipt;
- do not import media, sources, labels, pseudo-labels, or public datasets.

3. Re-run the no-training input-contract proof for the selected examples:

- selected examples must satisfy `rgb_regions_grid_v1`;
- raw shape, prepared shape, and batched model shape must preserve region
  identity through the model as `T,R,C,H,W` / `B,T,R,C,H,W`.

4. Add the smallest script-contract support needed for this mission if it does
   not already exist. Prefer a narrow flag or helper mode such as
   `--region-grid-tcn-tiny-overfit` that enforces:

- input manifest exactly under
  `data/manifests/lesson/high-signal-region-grid/`;
- output directory exactly
  `output/m3ax-region-grid-tcn-tiny-overfit`;
- architecture exactly `true_temporal_convnet_region_grid`;
- `--check-files`, `--frame-count 16`, `--image-size 96`, and
  `--num-workers 0`;
- scratch/random initialization and `pretrained_components: []`;
- tiny subset only;
- local-only execution.

Do not broaden final, lesson, reduced-smoke, or M3AW policies to make this
work. Add a narrow M3AX contract or record a blocker.

5. Run exactly one local overfit probe after the dry-run and script-contract
   checks pass. The run must train and evaluate memorization on the same tiny
   deterministic subset. It may use more epochs than M3AW only because it is a
   tiny memorization probe, but it must remain locally bounded and record its
   caps before the run.

Suggested success threshold, set before running:

- success: tiny-subset training accuracy `>=0.95` with no zero-recall selected
  labels, or a clearly equivalent near-perfect memorization metric recorded in
  the receipt;
- failure: anything materially below that threshold.

Do not reinterpret the threshold after seeing results.

6. Write a tracked receipt:

`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`

The receipt must include:

- subset definition with clip ids, labels, tensor paths, and hashes;
- exact validation/training/evaluation commands;
- dry-run input-contract proof for `rgb_regions_grid_v1`;
- raw `rgb_regions` shape, prepared shape, and batched model input shape;
- caps and observed runtime/device;
- final tiny-subset memorization metrics;
- explicit non-promotion language;
- no-pretrained/no-Brev/no-export/no-browser-claim boundaries;
- exactly one next action.

7. Select exactly one next action:

- `continue_vocab_crop_separability_diagnosis_no_training`: only if the tiny
  overfit succeeds and the next step is a non-training diagnosis of which
  labels/crops are separable enough for the product path.
- `stop_training_lane_for_representation_backtrack`: if tiny overfit fails.
- `stop_for_tiny_overfit_contract_blocker`: if the narrow contract cannot be
  added or run safely.

## Hard Boundaries

- Exactly one tiny local memorization probe is authorized by this prompt.
- No broad/full training run.
- No second run, hyperparameter sweep, longer rerun, or paid retry.
- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No source import, generated pseudo-labels, SemLex training use, public
  dataset expansion, Detector 0/landmark training revival, broad label run,
  ONNX export, model-card promotion, browser trained activation, final-readiness
  claim, threshold promotion, or final-gate weakening.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3AX prompt and `GOAL.md` names Mission 3AX.
2. The API memo artifact exists and is referenced by this prompt.
3. A deterministic tiny subset is selected only from existing high-signal
   region-grid training data, or the receipt records a precise blocker.
4. The selected examples pass `rgb_regions_grid_v1` immediately before the run,
   or the receipt records a fail-closed blocker.
5. The training/model path preserves region identity from `rgb_regions`, or the
   receipt records a precise blocker before training.
6. Exactly one capped local tiny overfit run executes, or the receipt records a
   script-contract/runtime blocker before training.
7. The receipt records the predeclared success threshold and whether the probe
   met it.
8. Outputs remain ignored under `output/m3ax-region-grid-tcn-tiny-overfit/` and
   are not promoted to browser/final model paths.
9. A tracked receipt under `docs/validation/` records the proof and exactly one
   next action.
10. Required audits and JSON validation pass or record exact blockers.
11. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only to a no-training vocabulary/crop separability diagnosis if the
  tiny overfit succeeds.
- STOP if the tiny overfit fails, because that means the current recognizer
  training lane is structurally suspect.
- STOP if the next action requires Brev auth, source approval, data collection,
  paid compute, another training attempt, export, browser activation, or
  final-gate change.
- ESCALATE only if the tiny overfit result conflicts with the receipt evidence
  or the next action changes architecture/input representation after failure.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3AX region-grid TCN tiny overfit sanity probe.
Completed:            <subset, one probe, blocker, receipt, optional code>.
Evidence:             <receipt, commands, metrics, input-contract proof>.
Remaining:            <single next action>.
Blockers:             <none or exact script/runtime/auth/source/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
