# Return-To-Form PopSign Fresh5 Model/Input Training-Loop Remediation Goal Loop Prompt

Mission 3CB prompt for the Codex executor after Mission 3CA selected
`continue_model_input_or_training_loop_remediation`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training PopSign fresh5
model/input/training-loop remediation audit from existing M3CA evidence, or
precisely block it.

The goal is to decide whether the M3CA train-all failure is caused by a concrete
local implementation/input/training-loop defect, an architecture or optimization
research need, crop/region-target quality, or data/split/label quality. This is
not another fitting mission and not a production training, scaling, export, or
promotion mission.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CA learnability-isolation probe:
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/session-logs/388-mission-3ca-popsign-fresh5-learnability-isolation-probe.md`](../session-logs/388-mission-3ca-popsign-fresh5-learnability-isolation-probe.md)
   - [`scripts/run_popsign_fresh5_learnability_isolation_probe.py`](../../scripts/run_popsign_fresh5_learnability_isolation_probe.py)
4. M3BZ repaired manifest materialization:
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
5. M3BV/M3BU comparison evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
6. Existing training/input code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - related helpers only as needed.
7. Relevant prior strategy memos:
   - [`artifacts/research/observer-195-tier0-strategy-api-response.md`](../../artifacts/research/observer-195-tier0-strategy-api-response.md)
   - [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md)
   - [`artifacts/research/observer-324-post-m3aw-strategy-api-response.md`](../../artifacts/research/observer-324-post-m3aw-strategy-api-response.md)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CA proved the repaired fresh5 path did not clear train sanity under the local
cap:

- train-all accuracy: `0.464`;
- train-all macro F1: `0.4548505303760849`;
- relaxed signer-overlap accuracy: `0.32`;
- relaxed signer-overlap macro F1: `0.2977777777777778`;
- signer-disjoint validation/test accuracy: `0.256` / `0.328`;
- signer-disjoint validation/test macro F1:
  `0.18382858452371859` / `0.2682622937946276`;
- `pen` signer-disjoint test recall: `0.04`;
- `thank_you` signer-disjoint test prediction fraction: `0.048`;
- blocker classification: `model_input_or_training_loop`;
- selected next action: `continue_model_input_or_training_loop_remediation`.

M3BV proved the same preserved-region family can memorize a deterministic
five-clip subset with `true_temporal_convnet_region_grid`, `rgb_regions_grid_v1`,
and `B,T,R,C,H,W`. M3CA did not fit the full repaired training split. That
difference must be explained before any more fitting, compute planning, export,
or promotion.

## Required Slice

Complete exactly one smallest useful no-training remediation audit.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Inspect and classify, without fitting.

Review the M3CA helper and the existing training path for concrete evidence in
these categories:

- label order/index consistency between manifests, datasets, loss targets, and
  reported confusion matrices;
- `RawFrameClipDataset` output shape, dtype, normalization, region-axis order,
  and collate behavior for `rgb_regions_grid_v1`;
- `TRUE_TEMPORAL_CONVNET_ARCHITECTURE` / `REGION_AWARE_DERIVED_INPUT` build
  path, parameterization, loss, optimizer setup, device/dtype, and seed use;
- difference between the M3BV tiny subset setup and the M3CA train-all setup,
  especially sample count, batch behavior, class balance, augmentation or lack
  of it, model capacity, and cap sensitivity;
- whether M3CA failure can be explained by code/input/training-loop mechanics
  rather than data/split/label or crop/region-target quality;
- whether any proposed next fix would require architecture or optimization
  research before another fitting run.

Forward-only, dry-run, static-analysis, shape, label-index, and loss-contract
checks are allowed. Optimizer steps, backward passes, training/fitting, sweeps,
and checkpoint creation are not allowed in this mission.

3. Add a small deterministic audit helper only if needed.

Any helper must be no-training and must not mutate source data, manifests,
tensors, claim surfaces, model cards, or browser assets. It may write a tracked
receipt and ignored diagnostic JSON under `output/`.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- file/symbol evidence inspected;
- M3CA versus M3BV/M3BU comparison;
- label/index, tensor shape/order, normalization, model-build, optimizer/loss,
  device/dtype, and cap/class-balance findings;
- any ignored diagnostic output paths and hashes;
- blocker classification;
- explicit no-training/no-Brev/no-export/no-browser/no-promotion language;
- exactly one next action.

5. Select exactly one next action:

- `continue_concrete_model_input_training_loop_fix`: only if the audit names a
  concrete fixable implementation or configuration defect with file/symbol
  evidence and a bounded next validation plan.
- `continue_no_training_architecture_or_optimization_research`: only if no
  concrete local defect is found and the next move would otherwise change
  architecture, input representation, or training budget. The observer should
  treat this as an ESCALATE/research handoff before approving more fitting.
- `continue_crop_or_region_target_contract_for_fresh5`: only if crop/region
  target quality is the clearest blocker.
- `continue_fresh5_data_split_label_quality_remediation`: only if data/split/
  label quality is the clearest blocker.
- `stop_until_supported_training_signal_exists`: if the audit does not support
  another autonomous training, remediation, or research step.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, architecture, crop target, or product scope.

## Hard Boundaries

- No training/fitting run, optimizer step, backward pass, sweep, checkpoint
  creation, broad retry, fresh10 training, 75/95-label training, or compute
  receipt execution.
- No Brev training, spend, worker lifecycle change, or remote command beyond
  read-only `brev ls --json` for state visibility.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing M3BT/M3BS/M3BZ/M3CA artifacts.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CB prompt and names Mission 3CB.
2. The M3CA receipt exists, is valid JSON, and selects
   `continue_model_input_or_training_loop_remediation`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`
   or the session log records the exact blocker that prevented it.
4. The audit uses existing receipts, ignored diagnostics, repaired manifests,
   existing tensors, and source inspection only.
5. No training/fitting/backward/optimizer/checkpoint/Brev spend/source
   mutation/manifest mutation/tensor mutation/export/browser activation/
   model-card promotion/final-gate action occurs.
6. The receipt selects exactly one next action from this prompt.
7. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the audit is bounded, local/no-spend, no-training, and
  selects one bounded next action.
- NUDGE if the receipt lacks file/symbol evidence, M3CA/M3BV comparison,
  label/index, shape/order, model-build, optimizer/loss, device/dtype, or
  blocker-classification evidence.
- REDIRECT if the executor runs fitting/training, Brev, source or tensor
  mutation, label expansion, export, browser activation, model-card promotion,
  final-gate changes, unsupported claim edits, or push.
- ESCALATE if the audit concludes architecture, input representation, or
  training budget must change but no current research memo binds that change to
  the local evidence.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, architecture, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CB PopSign fresh5 model/input training-loop remediation audit.
Completed:            <audit, receipt, blocker, optional no-training helper>.
Evidence:             <receipt, diagnostic hashes, commands, file/symbol evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact code/input/model/data/crop/research/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
