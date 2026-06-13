# Return-To-Form M3EM Tiny2 Held-Out Noncollapse Probe Goal Loop Prompt

Mission 3EM prompt for the Codex executor after Mission 3EL selected
`continue_tiny2_heldout_noncollapse_probe_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one local/no-Brev Tiny2 held-out noncollapse probe using only the
M3EK/M3EL `table` and `hello` ASL Citizen high-signal region-grid premise.

This is a bounded diagnostic fitting slice. It is not a training campaign,
checkpoint/model artifact, export, browser activation, product runtime change,
ASL-correctness claim, or final-readiness claim.

## Current Evidence

M3EL completed at commit `72a22c3` with receipt
[`docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json`](../validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json)
and selected exactly one next action:
`continue_tiny2_heldout_noncollapse_probe_no_brev`.

M3EL proved that the scratch `true_temporal_convnet_region_grid` path can
memorize one deterministic `table`/`hello` batch:

- real-label one-batch accuracy `1.0`;
- real-label dominant predicted-class fraction `0.5`;
- real-label per-label recall `1.0` for both `table` and `hello`;
- inverted-label shuffle control also memorized the same batch, so the result
  is capacity-only evidence, not held-out or generalized signal.

The browser product remains fail-closed: model card status is `not_trained`,
active labels are empty, and browser recognition is inactive.

## Required Slice

Complete exactly one smallest useful local held-out diagnostic:

1. Verify state and boundaries:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

2. Inspect existing diagnostic helpers and high-signal region-grid manifests.
   Reuse existing code paths where practical. If a tiny local helper is needed,
   keep it scoped to this diagnostic and do not save checkpoints or model
   artifacts.

3. Build one deterministic Tiny2 train/held-out probe using only `table` and
   `hello` from the approved high-signal region-grid manifests. Record:

- train and held-out manifest paths;
- exact train and held-out clip ids;
- signer ids or signer identity hashes when present;
- label order;
- tensor/input contract;
- seed;
- batch shapes and axes;
- source/register and claim-surface hashes.

4. Run exactly one local random-init scratch held-out probe. It must:

- stay on `table` and `hello`;
- save no checkpoint/model artifact;
- run one bounded fitting budget recorded in the receipt;
- report train accuracy/loss movement, held-out accuracy, held-out macro recall
  or macro-F1, per-label held-out recall, dominant predicted-class fraction,
  prediction counts, zero-recall labels, and confidence range;
- compare held-out behavior to the `0.5` two-class chance baseline;
- report whether held-out predictions are non-collapsed, not whether the model
  is product-ready.

5. Interpret the result conservatively:

- Passing this probe may justify only another no-Brev diagnostic, not Brev,
  export, promotion, browser activation, or product claims.
- Class collapse, zero recall, or chance-level held-out behavior must route to
  repair, Detector 0/source-region evidence, or stop.
- If the available held-out split is not suitable, record the blocker and route
  to command/input repair or human strategy review.

6. Inspect fail-closed claim surfaces read-only and confirm they remain
   unchanged.

7. Write a tracked receipt:

`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`

The receipt must include state checks, selected labels, train/held-out batch
manifest, source and claim-surface hashes, metrics, class-collapse check,
chance-baseline comparison, conservative interpretation, negative
authorizations, changed files, and exactly one next action.

8. Write a numbered session log and commit only scoped diagnostic/receipt/log
   files.

## Allowed Next Actions

Select exactly one:

- `continue_tiny2_open_set_threshold_probe_no_brev`
- `continue_tiny2_command_or_input_repair_no_brev`
- `continue_detector0_source_region_receipts_no_brev`
- `stop_for_tiny2_heldout_learnability_blocker`
- `stop_for_human_strategy_review`

## Hard Boundaries

- No Brev command or spend.
- No broad Fresh5 run and no label expansion beyond `table`/`hello`.
- No source import, media download, source-register mutation, manifest
  mutation, tracked tensor mutation, vocabulary mutation, packet-row mutation,
  generated labels, pseudo-labels, or pretrained dependency.
- No checkpoint/model artifact, ONNX export, browser activation, product
  runtime change, model-card promotion, active-label promotion,
  ASL-correctness claim, final-readiness claim, or raw learner video upload.
- No push, amend, or no-verify.

## Observer Guidance

- CONTINUE if the receipt records a bounded local held-out signal or concrete
  local blocker, fail-closed claims stay unchanged, and the next action is one
  bounded no-Brev step.
- NUDGE if train/held-out clip ids, signer hashes, label order, metrics,
  class-collapse checks, chance comparison, negative authorizations, or exactly
  one next action are missing.
- REDIRECT if the executor broadens labels, runs Brev, saves/promotes model
  artifacts, mutates sources/manifests/tensors/vocabulary, or treats this as
  product readiness.
- STOP if the selected next action needs human source, strategy, product, or
  compute approval.
