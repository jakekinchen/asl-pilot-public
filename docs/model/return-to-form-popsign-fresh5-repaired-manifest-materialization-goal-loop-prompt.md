# Return-To-Form PopSign Fresh5 Repaired Manifest Materialization Goal Loop Prompt

Mission 3BZ prompt for the Codex executor after Mission 3BY selected
`continue_fresh5_repaired_manifest_materialization`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training PopSign fresh5 repaired
manifest materialization from the verified M3BY contract, or precisely block it.
The goal is to write a versioned same-label manifest package that carries
source, split, signer, tensor-path, tensor-hash, and label-risk provenance
forward before any later learnability-isolation probe or compute planning.

This is not a training mission and not a tensor-generation mission. It may
create a new tracked manifest package and receipt only. It must not overwrite
the existing M3BT/M3BS manifests or tensors.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BY repaired manifest contract:
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json)
   - [`docs/session-logs/383-mission-3by-popsign-fresh5-repaired-manifest-contract.md`](../session-logs/383-mission-3by-popsign-fresh5-repaired-manifest-contract.md)
4. M3BX remediation design:
   - [`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json)
5. M3BW/M3BV/M3BU/M3BT/M3BS evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](../validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
6. Existing PopSign fresh5 region-grid manifests and tensors:
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/train.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/test.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/test.json)
7. Source metadata:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/popsign-v1-import-plan.json`](../research/popsign-v1-import-plan.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BY verified the same five-label PopSign fresh5 contract:

- labels: `thank_you`, `pen`, `home`, `who`, `morning`;
- approved source lane: `popsign-v1-original-videos`;
- train/validation/test source split boundaries preserved;
- no cross-split source-record, clip, or tensor-path leakage;
- 125 clips and 125 manifest-bound tensors per split;
- every tensor file exists and matches `frame_tensor_sha256`;
- each label has 25 clips per split;
- minimum pseudonymous signer coverage per label across splits is at least 6;
- `pen` low recall and `thank_you` overprediction remain training stop
  conditions.

M3BY selected `continue_fresh5_repaired_manifest_materialization`. It did not
justify Brev, training, fresh10 widening, Detector 0/crop work, export, browser
activation, model-card promotion, or final-gate changes.

## Required Slice

Complete exactly one smallest useful no-training materialization slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/verify_popsign_fresh5_repaired_manifest_contract.py scripts/design_popsign_fresh5_vocab_split_remediation.py scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Materialize or precisely block a new versioned manifest package:

`data/manifests/return-to-form-popsign-fresh5-repaired-v1/`

Expected files if materialization succeeds:

- `train.json`
- `validation.json`
- `test.json`
- `manifest-contract.json`

The manifest package must:

- keep the same five labels and same label order unless the receipt records a
  precise blocker;
- preserve the PopSign train/validation/test source split boundaries;
- carry source id, source split, source record id, source sha256, clip id,
  signer identity hash, tensor path, tensor sha256, and frame/tensor contract
  fields needed by the existing dataloader path;
- reference existing tensor files only;
- reject any missing tensor, hash mismatch, duplicate source record, duplicate
  clip id, duplicate tensor path, or cross-split leakage;
- carry explicit `pen` and `thank_you` training stop conditions in
  `manifest-contract.json`;
- avoid adding generated pseudo-labels, source approvals, new labels, raw media,
  or generated tensors.

3. Add the smallest materialization helper only if needed. Any helper must be
deterministic and no-training:

- no optimizer, backward pass, loss-driven update, checkpoint, sweep, model
  fitting, feature learning, training receipt, or compute receipt;
- no existing manifest overwrite and no tensor write;
- no source import, media download, pseudo-labeling, Detector 0 training,
  pretrained detector/landmark/model path, export, browser activation, or final
  claim change.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- output manifest files and hashes, or exact blocker;
- row counts, per-label/per-split counts, signer/source coverage, dedupe
  checks, tensor-path coverage, tensor hash checks, and cross-split leakage
  checks;
- preserved `pen` and `thank_you` stop conditions;
- explicit no-training/no-fitting/no-Brev/no-tensor-write/no-export/no-browser/
  no-promotion language;
- exactly one next action.

5. Select exactly one next action:

- `continue_bounded_fresh5_learnability_isolation_probe`: only if the repaired
  manifest package is materialized, hash-bound, leakage-free, same-label, and
  ready for a later capped local/no-spend diagnostic that isolates whether the
  current failure is dataset/split/label quality, crop/input preprocessing, or
  model/training-loop learnability. That later prompt must require train-all
  overfit on the repaired train manifest, a diagnostic relaxed/random or
  signer-overlap split comparison, signer-disjoint validation/test comparison,
  per-label confusion for `pen` and `thank_you`, preserved
  `true_temporal_convnet_region_grid` region-axis input, explicit comparison to
  M3BU/M3BV evidence, capped runtime/epochs, and no Brev/export/promotion
  unless a separate compute or promotion receipt justifies it.
- `continue_fresh10_region_grid_materialization`: only if the repaired fresh5
  materialization is blocked by same-label fragility and the same approved
  PopSign lane supports a better local/no-spend fresh10 materialization step.
- `continue_detector0_or_crop_contract_for_fresh5`: only if materialization is
  clean enough that crop or region-target weakness is now the clearest blocker.
- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: only if the
  materialization plus current local evidence is strong enough to justify a
  separate compute-receipt planning slice before any Brev command.
- `stop_until_supported_training_signal_exists`: if materialization fails or
  does not support a later local smoke.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, crop target, or product scope.

## Hard Boundaries

- No training run, tiny-overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
- No tensor write or rewrite. Reference only existing verified tensors.
- No overwrite of the existing M3BT/M3BS manifests.
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

1. `GOAL.md` points at this M3BZ prompt and names Mission 3BZ.
2. The M3BY receipt exists, is valid JSON, and selects
   `continue_fresh5_repaired_manifest_materialization`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`
   or the session log records the exact blocker that prevented it.
4. If materialization succeeds, the repaired manifest package exists at
   `data/manifests/return-to-form-popsign-fresh5-repaired-v1/` with
   train/validation/test manifests plus `manifest-contract.json`.
5. The receipt proves or precisely blocks same-label, same-source, split
   preservation, no leakage, dedupe, signer/source coverage, tensor existence,
   tensor hash binding, and `pen`/`thank_you` stop-condition carry-forward.
6. No training/fitting/checkpoint/Brev spend/source mutation/tensor mutation/
   export/browser activation/model-card promotion/final-gate action occurs.
7. The receipt selects exactly one next action from this prompt.
8. Required audits, receipt JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the materialization is bounded, evidence-backed,
  no-training, and selects one bounded next action.
- NUDGE if the receipt lacks output hashes, split/leakage checks, signer/source
  coverage, tensor hash checks, explicit `pen`/`thank_you` stop conditions, or
  clear Brev/promotion boundaries.
- REDIRECT if the executor runs training, overwrites existing manifests/tensors,
  changes source approvals, expands labels without an explicit prompt, runs
  Brev, promotes a model, or edits claim surfaces.
- ESCALATE if the packet proposes training-style or compute work without strong
  current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BZ PopSign fresh5 repaired manifest materialization.
Completed:            <manifest package, receipt, blocker, optional helper>.
Evidence:             <receipt, manifest hashes, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact split/source/tensor/label/crop/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
