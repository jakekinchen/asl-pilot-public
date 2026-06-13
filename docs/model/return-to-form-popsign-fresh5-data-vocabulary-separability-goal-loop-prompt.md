# Return-To-Form PopSign Fresh5 Data/Vocabulary Separability Goal Loop Prompt

Mission 3BW prompt for the Codex executor after Mission 3BV selected
`continue_data_vocabulary_separability_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training PopSign fresh5
data/vocabulary separability packet from existing artifacts. The goal is to
explain why the approved PopSign fresh5 tensors can be memorized by the
preserved-region model/input path, but the M3BU held-out region-grid smoke
remains weak.

This is not a training retry and not a Brev planning run. It should use
existing receipts, manifests, tensors, prediction artifacts, raw-source
metadata, and deterministic statistics to classify whether the current blocker
is label/vocabulary separability, split/source distribution, crop/region-target
quality, or unsupported training signal.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BV preserved-region tiny-overfit evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/session-logs/377-mission-3bv-popsign-fresh5-model-data-design-ablation.md`](../session-logs/377-mission-3bv-popsign-fresh5-model-data-design-ablation.md)
4. M3BU region-grid held-out smoke evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`docs/session-logs/374-mission-3bu-popsign-fresh5-region-grid-local-smoke.md`](../session-logs/374-mission-3bu-popsign-fresh5-region-grid-local-smoke.md)
5. M3BT materialization evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
6. M3BS full-frame baseline:
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
7. PopSign fresh5 manifests/tensors:
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/train.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/test.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/test.json)
   - [`data/tensors/return-to-form-popsign-fresh5-region-grid/`](../../data/tensors/return-to-form-popsign-fresh5-region-grid/)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BV completed one local preserved-region tiny-overfit/input-contract probe
against the M3BT generated PopSign fresh5 `rgb_regions_grid_v1` tensors. It
used `true_temporal_convnet_region_grid`, consumed `rgb_regions`, preserved the
model input as `B,T,R,C,H,W`, avoided the M3BU mosaic path, and memorized one
deterministic train clip per label with final tiny-subset accuracy `1.0` and
zero zero-recall selected labels.

That result rules out a total loader/model/input-contract break, but it is not
held-out success. The M3BU held-out smoke remains weak: test top-1 `0.288`,
test macro F1 `0.2593486590038314`, test false-pass rate `0.064`, and `pen`
test recall `0.04`. M3BV therefore selected
`continue_data_vocabulary_separability_packet` and explicitly did not justify
Brev, fresh10, export, promotion, browser activation, or final-claim changes.

## Required Slice

Complete exactly one smallest useful no-training diagnosis slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Inspect existing evidence only. At minimum, use:

- M3BV receipt and session log;
- M3BU receipt, metrics, and any available local prediction/report artifacts;
- M3BT materialization receipt and manifests;
- M3BS baseline receipt;
- PopSign fresh5 train/validation/test manifests and tensor metadata/hashes;
- source-register metadata for `popsign-v1-original-videos`.

3. Add the smallest analysis helper only if needed. Any helper must be
deterministic and no-training:

- no optimizer, backward pass, loss-driven update, checkpoint, sweep, model
  fitting, or feature learning;
- no tensor/manifest/source-register mutation;
- no new source import, pseudo-labeling, Detector 0 training, pretrained
  detector/landmark/model path, export, browser activation, or final-gate
  change.

4. Diagnose and record evidence for:

- per-label train/validation/test counts and clip/source distribution;
- whether `thank_you`, `pen`, `home`, `who`, and `morning` look separable from
  existing tensor statistics, motion/region summaries, or M3BU confusion;
- whether the M3BV tiny subset is representative or unusually easy;
- validation/test error concentration from existing reports or receipts;
- crop/region-target quality signals available without training, such as
  empty/low-motion regions, region intensity drift, frame availability, or
  label-specific crop weakness;
- whether the evidence points to vocabulary choice, split/source
  distribution, crop/region target, unsupported data signal, or a bounded
  compute-receipt planning slice.

5. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- deterministic diagnosis tables/summaries;
- explicit no-training/no-fitting/no-Brev/no-export/no-browser/no-promotion
  language;
- concrete conclusions and blocker classification;
- whether Brev, fresh10, Detector 0/crop work, vocabulary repair, or STOP is
  justified from current evidence;
- exactly one next action.

6. Select exactly one next action:

- `continue_fresh5_vocab_split_remediation_packet`: only if one bounded
  no-training vocabulary/split/source-quality remediation design is justified.
- `continue_detector0_or_crop_contract_for_fresh5`: only if crop or
  region-target weakness is the clearest next blocker.
- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: only if the
  packet finds the data/vocabulary/crop evidence strong enough to justify a
  separate compute-receipt planning slice before any Brev command.
- `continue_fresh10_region_grid_materialization`: only if the packet shows the
  fresh5 set is too narrow or fragile but the same approved PopSign raw-source
  path supports a local/no-spend fresh10 materialization slice.
- `stop_until_supported_training_signal_exists`: if the current evidence does
  not support another local/remote training or materialization step.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, crop target, or product scope.

## Hard Boundaries

- No training run, tiny-overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
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

1. `GOAL.md` points at this M3BW prompt and names Mission 3BW.
2. The M3BV receipt exists, is valid JSON, and selects
   `continue_data_vocabulary_separability_packet`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`
   or the session log records the exact blocker that prevented it.
4. The packet uses existing artifacts only, or records a precise blocker.
5. No training/fitting/checkpoint/Brev spend/source mutation/export/browser
   activation/model-card promotion/final-gate action occurs.
6. The receipt compares against M3BV, M3BU, M3BT, and M3BS and classifies the
   remaining blocker.
7. Required audits, receipt JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the packet is bounded, evidence-backed, no-training, and
  selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, split/count evidence,
  separability/crop classification, baseline comparison, or clear Brev and
  promotion boundaries.
- REDIRECT if the executor runs training, reruns M3BV tiny-overfit, treats
  memorization as held-out success, expands labels without a materialization
  prompt, runs Brev, promotes a model, or edits claim surfaces.
- ESCALATE if the packet proposes another training-style or compute step
  without strong current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BW PopSign fresh5 data/vocabulary separability.
Completed:            <diagnosis, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact data/vocab/split/crop/source/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
