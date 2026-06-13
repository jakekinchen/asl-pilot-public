# Return-To-Form PopSign Fresh5 Repaired Manifest Contract Goal Loop Prompt

Mission 3BY prompt for the Codex executor after Mission 3BX selected
`continue_fresh5_repaired_manifest_contract`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training PopSign fresh5 repaired
manifest/split/source-quality contract from existing artifacts. The goal is to
verify or precisely block whether the same five labels (`thank_you`, `pen`,
`home`, `who`, `morning`) can enter a later materialization or training-planning
step without hiding the M3BW/M3BX split and label-risk failures.

This is not a training mission and not a manifest/tensor mutation mission. It
must write a contract/verification receipt, not a new trainable manifest set.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BX remediation design:
   - [`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json)
   - [`docs/session-logs/381-mission-3bx-popsign-fresh5-vocab-split-remediation.md`](../session-logs/381-mission-3bx-popsign-fresh5-vocab-split-remediation.md)
4. M3BW separability packet:
   - [`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](../validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json)
5. M3BV preserved-region tiny-overfit evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
6. M3BU region-grid held-out smoke evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json`](../../output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json)
   - [`output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json`](../../output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json)
7. M3BT/M3BS materialization and smoke evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
8. PopSign fresh5 manifests/tensors and source metadata:
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/train.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/test.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/test.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/popsign-v1-import-plan.json`](../research/popsign-v1-import-plan.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BX completed a no-training remediation design packet and classified the next
blocker as `fresh5_manifest_split_source_quality_contract_needed`.

The evidence now says:

- M3BV proved the preserved-region input path can memorize a tiny train subset.
- M3BU/M3BW held-out signal remains weak: test top-1 `0.288`, macro F1
  `0.2593486590038314`, false-pass rate `0.064`, `pen` recall `0.04`, and
  `thank_you` absorbing `0.568` of test predictions.
- Train/validation/test signer overlap is zero. This remains a hard evaluation
  property, but the next contract must check that source quality, label support,
  dedupe, and tensor availability are strong enough before any training prompt.
- M3BX rejected Brev, fresh10 widening, Detector 0/crop work, export, browser
  activation, model-card promotion, final-gate change, and unsupported claims
  for the immediate next step.

## Required Slice

Complete exactly one smallest useful no-training repaired-manifest contract
slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/design_popsign_fresh5_vocab_split_remediation.py scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Inspect existing evidence only. At minimum, verify:

- M3BX receipt selected `continue_fresh5_repaired_manifest_contract`.
- The five labels stay unchanged: `thank_you`, `pen`, `home`, `who`, `morning`.
- Source-register status remains approved for the same PopSign lane.
- PopSign train/validation/test source boundaries remain preserved.
- No `source_record_id`, clip identity, or tensor path crosses train,
  validation, and test.
- Per-label/per-split source counts, signer or pseudonymous signer coverage,
  tensor coverage, and dedupe evidence are explicit.
- The `pen` low-recall and `thank_you` absorption risks are carried forward as
  gates, not normalized away.

3. Add the smallest analysis helper only if needed. Any helper must be
deterministic and no-training:

- no optimizer, backward pass, loss-driven update, checkpoint, sweep, model
  fitting, feature learning, training receipt, or compute receipt;
- no manifest/tensor/source-register mutation;
- no source import, media download, pseudo-labeling, Detector 0 training,
  pretrained detector/landmark/model path, export, browser activation, or final
  claim change.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- label set, split set, source-register status, and source/import-plan hashes;
- per-label/per-split counts, signer/source coverage, dedupe checks,
  tensor-path coverage, and cross-split leakage checks;
- the repaired manifest contract that a later mission may materialize, or the
  exact gate that blocks materialization;
- training stop conditions for `pen` and `thank_you`;
- explicit no-training/no-fitting/no-Brev/no-manifest-mutation/no-export/
  no-browser/no-promotion language;
- exactly one next action.

5. Select exactly one next action:

- `continue_fresh5_repaired_manifest_materialization`: only if the contract is
  concrete, leakage-free, same-label, same-source-lane, and ready for a later
  local/no-spend materialization prompt.
- `continue_fresh10_region_grid_materialization`: only if the same five-label
  contract is blocked by label fragility and the same approved PopSign lane
  supports a better local/no-spend fresh10 materialization step.
- `continue_detector0_or_crop_contract_for_fresh5`: only if manifest/split/
  source-quality checks are clean enough that crop or region-target weakness is
  now the clearest blocker.
- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: only if the
  contract plus prior local evidence is strong enough to justify a separate
  compute-receipt planning slice before any Brev command.
- `stop_until_supported_training_signal_exists`: if current evidence does not
  support manifest materialization, fresh10 widening, crop/Detector 0 work, or
  compute planning.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, crop target, or product scope.

## Hard Boundaries

- No training run, tiny-overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
- No manifest/tensor/source-register mutation in this mission. This prompt
  writes a contract/verification receipt only; any materialization or repair
  must be a later prompt.
- No Brev training, spend, worker lifecycle change, or remote command beyond
  read-only `brev ls --json` for state visibility.
- No source-register approval change, unreviewed source import, public dataset
  training-use expansion, generated pseudo-labels, or pretrained detector,
  landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3BY prompt and names Mission 3BY.
2. The M3BX receipt exists, is valid JSON, and selects
   `continue_fresh5_repaired_manifest_contract`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`
   or the session log records the exact blocker that prevented it.
4. The packet uses existing artifacts only, or records a precise blocker.
5. No training/fitting/checkpoint/Brev spend/source mutation/manifest
   mutation/tensor mutation/export/browser activation/model-card
   promotion/final-gate action occurs.
6. The receipt verifies or precisely blocks the M3BX contract gates: label set,
   source approval, split boundaries, cross-split leakage, dedupe, signer/source
   coverage, tensor availability, `pen` risk, and `thank_you` risk.
7. The receipt selects exactly one next action from this prompt.
8. Required audits, receipt JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the contract is bounded, evidence-backed, no-training, and
  selects one bounded next action.
- NUDGE if the receipt lacks hashes, split/leakage checks, signer/source
  coverage, tensor availability, explicit `pen`/`thank_you` gates, or clear
  Brev/promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, expands labels without a materialization prompt, runs Brev,
  promotes a model, or edits claim surfaces.
- ESCALATE if the packet proposes training-style or compute work without strong
  current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BY PopSign fresh5 repaired manifest contract.
Completed:            <contract receipt, blocker, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact split/source/tensor/label/crop/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
