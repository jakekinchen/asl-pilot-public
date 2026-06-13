# Return-To-Form PopSign Fresh5 Region-Grid Local Smoke Goal Loop Prompt

Mission 3BU prompt for the Codex executor after Mission 3BT selected
`continue_capped_local_fresh5_region_grid_smoke`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded local/no-spend PopSign fresh5 region-grid classifier
smoke from the M3BT `rgb_regions_grid_v1` manifests and tensors, then record
whether the region-grid input contract changes the training signal enough to
justify a later compute receipt or another local design slice.

This is a local training-smoke mission, not a promotion or Brev mission. It may
run one capped local classifier training command against the existing generated
region-grid manifests/tensors and may edit narrow reporting/training helpers
only if needed to produce truthful evidence. It must not run remote Brev
training or spend, export/promote a model, activate browser recognition, change
final claims, expand to fresh10, import sources, or change source approvals.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BT evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
   - [`docs/session-logs/372-mission-3bt-popsign-fresh5-region-grid-materialization.md`](../session-logs/372-mission-3bt-popsign-fresh5-region-grid-materialization.md)
4. M3BS weak full-frame baseline:
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
5. Generated ignored M3BT artifacts:
   - `data/manifests/return-to-form-popsign-fresh5-region-grid/`
   - `data/tensors/return-to-form-popsign-fresh5-region-grid/`

## Current Evidence

M3BT materialized valid PopSign fresh5 region-grid manifests and tensors for
`thank_you`, `pen`, `home`, `who`, and `morning`. The receipt records 375
tensors, zero missing files, tensor SHA-256 evidence for every manifest clip,
and dry-run/check-files proof that `rgb_regions_grid_v1` is observed for all
375 clips.

M3BS remains the full-frame baseline: test top-1 `0.272`, test macro F1
`0.20170903619228636`, false-pass rate `0.104`, and zero test recall for
`morning` and `pen`. That weak full-frame result does not justify Brev.

The next useful project movement is one local capped region-grid smoke, with
metrics compared against the M3BS full-frame baseline and recorded before any
remote compute or wider vocabulary step.

## Required Slice

Complete exactly one smallest useful local smoke slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py
```

2. Verify the M3BT generated region-grid manifests/tensors are present and that
the training path still observes `rgb_regions_grid_v1` without falling back to
full-frame `rgb_frames`.

3. Run one capped local no-spend classifier smoke using only:

- train manifest:
  `data/manifests/return-to-form-popsign-fresh5-region-grid/train.json`
- validation manifest:
  `data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json`
- test manifest:
  `data/manifests/return-to-form-popsign-fresh5-region-grid/test.json`
- required input contract: `rgb_regions_grid_v1`
- labels: `thank_you`, `pen`, `home`, `who`, `morning`
- generated tensors under
  `data/tensors/return-to-form-popsign-fresh5-region-grid/`

Keep the command bounded and local. Record device, epoch/batch/sample caps,
random seed, command, output directory, and wall-clock/runtime if available.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`

The receipt must include:

- selected labels and M3BT manifest/tensor hashes;
- exact training command, local device, caps, seed, and output paths;
- proof the smoke consumed `rgb_regions_grid_v1`;
- training loss movement, train sanity, validation top-1/macro F1, test top-1
  and macro F1, false-pass rate or hard-negative/FPR status if supported,
  confusion/per-label recall, zero-recall labels, and comparison with the M3BS
  full-frame baseline;
- whether the result justifies a later Brev compute receipt, a local ablation,
  a Detector 0/crop contract, fresh10 materialization, or STOP;
- explicit no-Brev-spend/no-promotion/no-browser-activation boundaries;
- exactly one next action.

5. Select exactly one next action:

- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: local
  region-grid smoke is meaningfully stronger than the M3BS full-frame baseline
  and justifies a separate compute-receipt planning slice before any Brev run.
- `continue_local_model_data_design_ablation`: the smoke is valid but weak or
  inconclusive, and one bounded local model/input/data design ablation is the
  honest next step before remote compute.
- `continue_detector0_or_crop_contract_for_fresh5`: the smoke points to crop
  or region-target weakness rather than classifier budget.
- `continue_fresh10_region_grid_materialization`: the smoke is strong enough
  to justify widening only the same approved PopSign raw-source region-grid
  materialization path, still without Brev.
- `stop_for_human_training_budget_or_source_decision`: the next meaningful
  action needs human approval on budget, source, rights, crop, annotation, or
  scope.
- `stop_until_supported_training_signal_exists`: the region-grid smoke gives
  no supported local training signal from current evidence.

## Hard Boundaries

- Exactly one local classifier smoke. No second rerun, broad parameter sweep,
  local fresh10 training, or broad 75/95-label training.
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

1. `GOAL.md` points at this prompt and names Mission 3BU.
2. The M3BT receipt exists, is valid JSON, and selects
   `continue_capped_local_fresh5_region_grid_smoke`.
3. A tracked local-smoke receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`.
4. Exactly one capped local smoke either completes with metrics or records the
   precise local blocker that prevented it.
5. The receipt proves `rgb_regions_grid_v1` was consumed, or records a
   fail-closed contract blocker.
6. The receipt compares region-grid metrics against the M3BS full-frame
   baseline and records whether Brev is justified.
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

- CONTINUE only if the local region-grid smoke is bounded, evidence-backed,
  and selects one bounded next action.
- NUDGE if the receipt lacks input-contract proof, baseline comparison,
  per-label recall/zero-recall status, or a clear Brev-justification boundary.
- REDIRECT if the executor runs Brev, broadens labels, repeats unbounded local
  training, treats full-frame fallback as region-grid evidence, or promotes a
  model.
- ESCALATE if the local smoke fails in a way that makes the next architecture
  or input-representation decision high-risk.
- STOP if the next meaningful action requires human budget, source, rights,
  crop, annotation, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BU PopSign fresh5 region-grid local smoke.
Completed:            <local smoke result, blocker, receipt, optional code>.
Evidence:             <receipt, commands, metrics, input-contract proof>.
Remaining:            <single next action>.
Blockers:             <none or exact source/crop/schema/data/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
