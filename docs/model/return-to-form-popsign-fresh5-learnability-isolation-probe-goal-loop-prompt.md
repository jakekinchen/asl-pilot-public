# Return-To-Form PopSign Fresh5 Learnability Isolation Probe Goal Loop Prompt

Mission 3CA prompt for the Codex executor after Mission 3BZ selected
`continue_bounded_fresh5_learnability_isolation_probe`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend PopSign fresh5
learnability-isolation probe from the repaired M3BZ manifest package, or
precisely block it.

The goal is to explain why the current repaired PopSign fresh5 route can or
cannot learn before any compute receipt, Brev command, export, promotion, or
browser activation. This is a diagnostic fitting mission, not a production
training, scaling, export, or promotion mission.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BZ repaired manifest materialization:
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json)
   - [`docs/session-logs/386-mission-3bz-popsign-fresh5-repaired-manifest-materialization.md`](../session-logs/386-mission-3bz-popsign-fresh5-repaired-manifest-materialization.md)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
4. Supervisor steering:
   - [`docs/session-logs/385-supervisor-fresh5-learnability-isolation-steering.md`](../session-logs/385-supervisor-fresh5-learnability-isolation-steering.md)
5. M3BU/M3BV/M3BW/M3BX/M3BY evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](../validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`](../validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json)
6. Repaired PopSign fresh5 manifests:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
7. The training/evaluation scripts and model/input helpers already in the repo.
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BZ created a tracked repaired manifest package for the same five labels:

- labels: `thank_you`, `pen`, `home`, `who`, `morning`;
- approved source lane: `popsign-v1-original-videos`;
- train/validation/test source split boundaries preserved;
- no source-record, clip, tensor-path, or signer-identity leakage across
  train/validation/test;
- 125 clips and 125 existing tensor references per split, 375 total;
- every referenced tensor file exists and matches `frame_tensor_sha256`;
- each label has 25 clips per split;
- minimum pseudonymous signer coverage per label across splits is at least 6;
- the package carries `pen` low-recall and `thank_you` overprediction stop
  conditions.

M3BU is the held-out smoke baseline, but it used the region crops as a mosaic
before `motion_2d_temporal_cnn`; it did not preserve the region axis. M3BV
proved that the preserved-region `true_temporal_convnet_region_grid` path can
memorize a deterministic tiny subset with `B,T,R,C,H,W`, but that was not
held-out success. M3BW classified the live blocker as
`data_vocabulary_split_source_distribution`, with `pen` recall at `0.04`,
`thank_you` absorbing `0.568` of test predictions, and zero signer overlap
across train/validation/test.

M3BZ selected `continue_bounded_fresh5_learnability_isolation_probe`. It did
not justify Brev, fresh10 widening, Detector 0/crop work, export, browser
activation, model-card promotion, or final-gate changes.

## Required Slice

Complete exactly one smallest useful local/no-spend diagnostic fitting slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Inspect the existing training/evaluation path before adding anything.

Prefer existing repo helpers and scripts. Add the smallest diagnostic helper
only if the existing scripts cannot produce the required train-all, relaxed
split, signer-disjoint, and per-label confusion evidence while preserving the
region-axis input contract.

Any helper must be deterministic, local-only, capped, and diagnostic:

- random initialization only;
- no pretrained detector, landmark, backbone, embedding, or model path;
- no source import, source-register mutation, manifest mutation, tensor write,
  pseudo-label generation, export, browser activation, claim-surface edit, or
  final-gate change;
- diagnostic result artifacts may go under `output/` plus the required tracked
  receipt and session log. Tracked helper changes are allowed only when needed
  to produce the required probe evidence.

3. Run or precisely block one capped local probe that records all required
comparisons.

The receipt must include these diagnostic views:

- train-all overfit on
  `data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`;
- a relaxed/random or signer-overlap split comparison that tests whether the
  same clips/tensors/labels can generalize under an easier diagnostic split;
- signer-disjoint validation and test comparison using the repaired
  validation/test manifests;
- per-label recall/confusion for all labels, with explicit `pen` and
  `thank_you` stop-condition evaluation;
- preserved `true_temporal_convnet_region_grid` input evidence showing
  `rgb_regions_grid_v1` remains region-axis input (`B,T,R,C,H,W`) and is not
  converted into the M3BU mosaic path for the decisive result;
- explicit comparison to M3BU held-out smoke and M3BV preserved-region
  tiny-overfit evidence;
- capped runtime/epochs/config/seed/device evidence;
- a blocker classification:
  `dataset_split_label_quality`, `crop_or_region_target_quality`,
  `model_input_or_training_loop`, `compute_budget_inconclusive`, or
  `supported_local_training_signal`.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- output diagnostic paths and hashes, or exact blocker;
- train-all metrics, relaxed/signer-overlap metrics, signer-disjoint validation
  and test metrics, confusion matrices, and per-label recall;
- `pen` and `thank_you` stop-condition evaluation;
- region-axis input-contract proof;
- M3BU/M3BV comparison;
- explicit no-Brev/no-export/no-browser/no-promotion language;
- exactly one next action.

5. Select exactly one next action:

- `continue_bounded_compute_receipt_for_fresh5_repaired_region_grid`: only if
  the local probe shows train-all sanity, materially improves on M3BU under the
  preserved-region path, does not trip the `pen` / `thank_you` stop conditions,
  and justifies a separate compute-receipt planning slice before any Brev
  command.
- `continue_fresh5_data_split_label_quality_remediation`: only if train-all or
  relaxed/signer-overlap behavior works but signer-disjoint validation/test
  behavior, `pen`, `thank_you`, source split, or label-quality evidence remains
  the clearest blocker.
- `continue_model_input_or_training_loop_remediation`: only if train-all
  overfit fails, the region-axis input contract cannot be preserved, or the
  existing training loop/model path is the clearest blocker despite valid
  tensors and labels.
- `continue_crop_or_region_target_contract_for_fresh5`: only if the probe
  points to crop/region-target quality as the clearest blocker before further
  classifier work.
- `stop_until_supported_training_signal_exists`: if the probe does not produce
  local evidence that supports another training, remediation, or compute
  planning step.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, crop target, or product scope.

## Hard Boundaries

- No Brev training, spend, worker lifecycle change, or remote command beyond
  read-only `brev ls --json` for state visibility.
- No broad retry, fresh10 training, 75/95-label training, sweep, production
  training claim, or compute receipt execution.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing M3BT/M3BS/M3BZ manifests.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CA prompt and names Mission 3CA.
2. The M3BZ receipt exists, is valid JSON, and selects
   `continue_bounded_fresh5_learnability_isolation_probe`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`
   or the session log records the exact blocker that prevented it.
4. The probe uses the repaired manifest package and existing verified tensors
   only.
5. The receipt proves or precisely blocks train-all overfit, relaxed/random or
   signer-overlap behavior, signer-disjoint validation/test behavior,
   per-label confusion for `pen` and `thank_you`, preserved region-axis input,
   and M3BU/M3BV comparison.
6. No Brev spend/training, source mutation, manifest/tensor mutation, export,
   browser activation, model-card promotion, final-gate action, or unsupported
   claim occurs.
7. The receipt selects exactly one next action from this prompt.
8. Required audits, receipt JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the probe is bounded, local/no-spend, evidence-backed, and
  selects one bounded next action.
- NUDGE if the receipt lacks train-all, relaxed/signer-overlap,
  signer-disjoint, `pen` / `thank_you`, region-axis, M3BU/M3BV, command/cap,
  or blocker-classification evidence.
- REDIRECT if the executor runs Brev, broad training, source or tensor
  mutation, label expansion, export, browser activation, model-card promotion,
  final-gate changes, unsupported claim edits, or push.
- ESCALATE if the probe cannot distinguish data/split/label quality from
  crop/input and model/training-loop causes, or if it proposes compute work
  without strong local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CA PopSign fresh5 learnability isolation probe.
Completed:            <probe, receipt, blocker, optional helper>.
Evidence:             <receipt, diagnostic hashes, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact data/split/label/crop/model/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
