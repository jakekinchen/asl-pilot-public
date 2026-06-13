# Return-To-Form PopSign Fresh5 Model/Data Design Ablation Goal Loop Prompt

Mission 3BV prompt for the Codex executor after Mission 3BU selected
`continue_local_model_data_design_ablation`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run or precisely block exactly one bounded local/no-spend model/input/data
design ablation for the approved PopSign fresh5 region-grid lane. The goal is
to distinguish "the current local model/input recipe is the bottleneck" from
"the selected data/vocabulary/splits remain too weak" before any Brev,
fresh10, export, browser activation, or claim change.

This is not a blind training retry. It may run one local diagnostic ablation
only after stating the hypothesis, baseline, command, caps, and pass/fail
thresholds up front. It must use the existing M3BT generated
`rgb_regions_grid_v1` manifests/tensors for `thank_you`, `pen`, `home`, `who`,
and `morning`. It must not run Brev, expand the vocabulary, import sources,
mutate source approvals, generate pseudo-labels, export/promote a model,
activate browser recognition, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BU local smoke evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`docs/session-logs/374-mission-3bu-popsign-fresh5-region-grid-local-smoke.md`](../session-logs/374-mission-3bu-popsign-fresh5-region-grid-local-smoke.md)
4. M3BT materialization evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
5. M3BS full-frame baseline:
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
6. Anti-loop strategy references:
   - [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md)
   - [`artifacts/research/observer-364-post-roi-strategy-api-response.md`](../../artifacts/research/observer-364-post-roi-strategy-api-response.md)

## Current Evidence

M3BU completed one capped local region-grid smoke against the M3BT manifests.
It proved the actual smoke consumed `rgb_regions` / `rgb_regions_grid_v1` and
did not fall back to full-frame `rgb_frames`. Important nuance: the M3BU
training path did **not** preserve the region axis. Its provenance recorded
`preserve_region_axis=false`, derived the five regional crops into a
`[T,192,288,3]` mosaic, and then resized that mosaic to `[T,3,96,96]` for the
`motion_2d_temporal_cnn`. That is valid smoke evidence, but it does not answer
whether the PopSign fresh5 labels/tensors can be learned by the intended
identity-preserving region model. It improved the M3BS full-frame baseline but
remained weak:

- validation top-1: `0.224`;
- validation macro F1: `0.15837302833380346`;
- test top-1: `0.288`;
- test macro F1: `0.2593486590038314`;
- test false-pass rate: `0.064`;
- test zero-recall labels: none;
- `pen` test recall: `0.04`;
- capped train signal was partial, not decisive: train loss fell and capped
  train accuracy rose from `0.171875` to `0.578125`.

The M3BU receipt explicitly says Brev, fresh10, export, promotion, and browser
activation are premature. It selected `continue_local_model_data_design_ablation`.

## Required Slice

Complete exactly one smallest useful local design-ablation slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py
```

2. Define the one ablation before running it. The receipt must record:

- hypothesis;
- why this ablation distinguishes model/input design from data/vocabulary/split
  weakness;
- exact baseline metrics from M3BU and M3BS;
- command and local device;
- caps and random seed;
- pass/fail thresholds;
- what result would justify a later compute receipt, and what result would
  instead route to data/vocabulary/split/crop diagnosis or STOP.

3. Run at most one bounded local ablation. Acceptable examples include one
tiny memorization/overfit sanity probe, one architecture/input-adapter variant,
or one data-sampling variant, but only if it uses the same approved fresh5
region-grid manifests/tensors and only if the hypothesis is recorded before
execution. Do not run a sweep.

   Preferred diagnostic, unless it is precisely blocked: run a PopSign fresh5
   tiny memorization/input-contract probe that preserves region identity as
   `B,T,R,C,H,W` and uses the `true_temporal_convnet_region_grid` path or a
   narrowly adapted equivalent. This may adapt existing local diagnostic code
   if it is hardcoded to a prior ASL Citizen manifest, but it must stay scoped
   to the existing PopSign fresh5 M3BT manifests/tensors. The probe should
   select a deterministic tiny subset from the training split, prove
   `rgb_regions_grid_v1` with `preserve_region_axis=true`, then answer one
   question: can the current PopSign fresh5 tensors and labels be memorized at
   all by the intended region-aware path? If yes, the dataset/loader is not the
   primary blocker and the next route should diagnose generalization, split,
   vocabulary, crop/region target, or data quality. If no, stop or route to a
   model/input-contract repair before any Brev or wider-label work.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`

The receipt must include:

- source receipt hashes for M3BU, M3BT, and M3BS;
- selected labels and manifest/tensor hashes;
- pre-run hypothesis, command, caps, device, seed, and pass/fail thresholds;
- proof the ablation consumed `rgb_regions_grid_v1`, or a fail-closed blocker;
- proof whether the region axis was preserved, including the model input axis
  and shape. A mosaic-only proof is insufficient for the preferred diagnostic;
- train sanity, validation/test metrics or memorization metrics as applicable;
- comparison against M3BU region-grid smoke and M3BS full-frame baseline;
- classification of the blocker as model/input design, data/vocabulary/split,
  crop/region-target, compute-budget, or inconclusive;
- explicit no-Brev/no-promotion/no-browser-activation boundaries;
- exactly one next action.

5. Select exactly one next action:

- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: the ablation
  gives a materially stronger local signal than M3BU and justifies a separate
  compute-receipt planning slice before any Brev run.
- `continue_data_vocabulary_separability_packet`: the ablation indicates the
  model/input path can learn locally, but the current fresh5 labels/splits are
  likely the bottleneck.
- `continue_detector0_or_crop_contract_for_fresh5`: the ablation points to
  crop or region-target weakness rather than model/input design.
- `continue_fresh10_region_grid_materialization`: the ablation is strong enough
  to justify widening only the same approved PopSign raw-source region-grid
  materialization path, still without Brev.
- `stop_until_supported_training_signal_exists`: the ablation fails to produce
  supported local training signal from current evidence.
- `stop_for_human_strategy_decision`: the next meaningful action requires
  human approval on strategy, budget, source, crop, annotation, or scope.

## Hard Boundaries

- Exactly one local design ablation. No second rerun, broad parameter sweep,
  repeated smoke, fresh10 training, or broad 75/95-label training.
- No Brev training, spend, worker lifecycle change, or remote command beyond a
  read-only `brev ls --json` if already needed for state visibility.
- No source-register approval change, unreviewed source import, public dataset
  training-use expansion, generated pseudo-labels, or pretrained detector,
  landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening,
  product-fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BV.
2. The M3BU receipt exists, is valid JSON, and selects
   `continue_local_model_data_design_ablation`.
3. A tracked receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`
   or the session log records the exact blocker that prevented it.
4. Exactly one local ablation either completes or records the precise local
   blocker that prevented it.
5. The receipt proves `rgb_regions_grid_v1` was consumed, or records a
   fail-closed input-contract blocker.
6. The receipt compares the ablation against M3BU and M3BS and classifies the
   remaining blocker.
7. No Brev spend/training, broad training, source-register approval change,
   pretrained dependency, pseudo-labeling, export, browser activation,
   model-card promotion, final-gate change, unsupported claim, or push occurs.
8. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `node scripts/audit_source_register.mjs`, receipt JSON validation,
   relevant py-compile checks, and `git diff --check` exit 0 or record exact
   blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the ablation is bounded, evidence-backed, and selects one
  bounded next action.
- NUDGE if the receipt lacks pre-run hypothesis, thresholds, input-contract
  proof, baseline comparison, blocker classification, or clear Brev boundary.
- REDIRECT if the executor runs Brev, broadens labels, performs multiple
  training retries, treats full-frame fallback as region-grid evidence, or
  promotes a model.
- REDIRECT if the executor repeats a mosaic-only region-grid run without
  explaining why the preserved-region PopSign tiny-overfit diagnostic is
  impossible in this slice.
- ESCALATE if the ablation changes architecture/input/training budget without
  a recorded hypothesis and current local evidence comparison, or if another
  training-style step is proposed after this ablation without a strategy memo.
- STOP if the next meaningful action requires human budget, source, rights,
  crop, annotation, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BV PopSign fresh5 model/data design ablation.
Completed:            <ablation result, blocker, receipt, optional code>.
Evidence:             <receipt, commands, metrics, input-contract proof>.
Remaining:            <single next action>.
Blockers:             <none or exact model/data/crop/source/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
