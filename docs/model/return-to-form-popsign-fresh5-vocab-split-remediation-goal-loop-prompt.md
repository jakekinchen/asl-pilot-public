# Return-To-Form PopSign Fresh5 Vocabulary/Split Remediation Goal Loop Prompt

Mission 3BX prompt for the Codex executor after Mission 3BW selected
`continue_fresh5_vocab_split_remediation_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training PopSign fresh5
vocabulary/split/source-quality remediation design packet from existing
artifacts. The goal is to convert the M3BW diagnosis into a concrete bounded
next route without running another classifier, changing manifests, spending
Brev, or promoting browser claims.

This is not a training mission and not a source-import mission. It should use
the M3BW evidence to decide whether the current fresh5 set can be repaired by a
manifest/split/vocabulary contract, whether widening the same approved PopSign
raw-source lane is the better local step, whether a crop/region-target contract
is actually needed, or whether the loop should stop for human strategy/source
approval.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BW separability packet:
   - [`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](../validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json)
   - [`docs/session-logs/379-mission-3bw-popsign-fresh5-data-vocabulary-separability.md`](../session-logs/379-mission-3bw-popsign-fresh5-data-vocabulary-separability.md)
4. M3BV preserved-region tiny-overfit evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
5. M3BU region-grid held-out smoke evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
   - [`output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json`](../../output/return-to-form-popsign-fresh5-region-grid-local-smoke/validation-report.json)
   - [`output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json`](../../output/return-to-form-popsign-fresh5-region-grid-local-smoke/prediction-sidecar.json)
6. M3BT materialization evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json)
7. M3BS full-frame baseline:
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
8. PopSign fresh5 manifests/tensors:
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/train.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-region-grid/test.json`](../../data/manifests/return-to-form-popsign-fresh5-region-grid/test.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3BW completed a no-training diagnosis from existing artifacts and classified
the blocker as `data_vocabulary_split_source_distribution`. It found:

- M3BV proved the intended preserved-region path can memorize the tiny train
  subset, so the blocker is not a total loader/model break.
- M3BU held-out signal remains weak: test top-1 `0.288`, macro F1
  `0.2593486590038314`, false-pass rate `0.064`, and `pen` test recall
  `0.04`.
- Test predictions are biased toward `thank_you`: `thank_you` absorbs `0.568`
  of test predictions, while `pen` is predicted only `0.032`.
- Splits are balanced by label count, but train/validation/test signer overlap
  is zero.
- Tensor inventory is complete, and tensor-motion summaries did not show a
  decisive empty hand-region failure.

M3BW selected `continue_fresh5_vocab_split_remediation_packet`. It did not
justify Brev, fresh10 materialization, Detector 0/crop contract work, export,
browser activation, model-card promotion, or final claim changes.

## Required Slice

Complete exactly one smallest useful no-training remediation-design slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/diagnose_popsign_fresh5_data_vocabulary_separability.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for observer/state visibility.

2. Inspect existing evidence only. At minimum, use:

- M3BW receipt and session log;
- M3BV receipt;
- M3BU report/sidecar and receipt;
- M3BT/M3BS receipts;
- PopSign fresh5 manifests and source-register metadata.

3. Add the smallest analysis helper only if needed. Any helper must be
deterministic and no-training:

- no optimizer, backward pass, loss-driven update, checkpoint, sweep, model
  fitting, feature learning, training receipt, or compute receipt;
- no manifest/tensor/source-register mutation;
- no new source import, pseudo-labeling, Detector 0 training, pretrained
  detector/landmark/model path, export, browser activation, or final-gate
  change.

4. Design and record the smallest honest remediation route. The packet must
   answer:

- Can the current `thank_you`, `pen`, `home`, `who`, `morning` set be repaired
  by a no-training manifest/split/source-quality contract, or is the fresh5
  vocabulary itself too fragile?
- If a repaired fresh5 contract is plausible, what exact contract would the
  next mission materialize or verify, and what data gates would prevent
  training?
- If fresh5 is too fragile, does the same approved PopSign raw-source lane
  support a local/no-spend fresh10 materialization/design step, or does that
  require human label/source approval?
- Is the evidence actually pointing to crop/region-target work despite M3BW's
  tensor-motion finding?
- What evidence would be required before any Brev compute receipt or browser
  promotion could be considered?

5. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- deterministic remediation analysis or design tables;
- explicit no-training/no-fitting/no-Brev/no-export/no-browser/no-promotion
  language;
- concrete conclusions and blocker classification;
- one recommended bounded next route with gates and stop conditions;
- exactly one next action.

6. Select exactly one next action:

- `continue_fresh5_repaired_manifest_contract`: only if the current fresh5 set
  has a concrete local/no-spend manifest/split/source-quality repair contract
  that can be verified before training.
- `continue_fresh10_region_grid_materialization`: only if fresh5 is too narrow
  or fragile but the same approved PopSign raw-source lane supports widening in
  a local/no-spend materialization step.
- `continue_detector0_or_crop_contract_for_fresh5`: only if crop or
  region-target weakness is the clearest next blocker after M3BW.
- `continue_bounded_brev_training_receipt_for_fresh5_region_grid`: only if the
  packet finds the data/vocabulary/split/crop evidence strong enough to justify
  a separate compute-receipt planning slice before any Brev command.
- `stop_until_supported_training_signal_exists`: if current evidence does not
  support another local/remote training, materialization, or repair step.
- `stop_for_human_source_annotation_or_strategy_decision`: if the next
  meaningful action requires human approval on source, annotation, budget,
  label choice, crop target, or product scope.

## Hard Boundaries

- No training run, tiny-overfit rerun, model fitting, optimizer/backward pass,
  checkpoint creation, sweep, broad retry, fresh10 training, or 75/95-label
  training.
- No manifest/tensor/source-register mutation in this mission. This is a design
  packet; any materialization or repair must be a later prompt.
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

1. `GOAL.md` points at this M3BX prompt and names Mission 3BX.
2. The M3BW receipt exists, is valid JSON, and selects
   `continue_fresh5_vocab_split_remediation_packet`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`
   or the session log records the exact blocker that prevented it.
4. The packet uses existing artifacts only, or records a precise blocker.
5. No training/fitting/checkpoint/Brev spend/source mutation/manifest
   mutation/tensor mutation/export/browser activation/model-card
   promotion/final-gate action occurs.
6. The receipt compares against M3BW, M3BV, M3BU, M3BT, and M3BS and selects
   exactly one next action.
7. Required audits, receipt JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the packet is bounded, evidence-backed, no-training, and
  selects one bounded next action.
- NUDGE if the receipt lacks artifact hashes, explicit repair gates, blocker
  classification, baseline comparison, or clear Brev and promotion boundaries.
- REDIRECT if the executor runs training, mutates manifests/tensors/source
  approvals, expands labels without a materialization prompt, runs Brev,
  promotes a model, or edits claim surfaces.
- ESCALATE if the packet proposes another training-style or compute step
  without strong current local evidence and a separate compute receipt.
- STOP if the next meaningful action requires human budget, source, rights,
  annotation, crop, label, or scope approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BX PopSign fresh5 vocabulary/split remediation.
Completed:            <design packet, blocker, receipt, optional helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact data/vocab/split/crop/source/budget blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
