# Return-To-Form M3EL Tiny2 One-Batch Overfit And Shuffle Control Goal Loop Prompt

Mission 3EL prompt for the Codex executor after Mission 3EK selected
`continue_tiny2_one_batch_overfit_and_shuffle_control_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one local/no-Brev Tiny2 learnability diagnostic using only the M3EK-selected
`table` and `hello` ASL Citizen high-signal region-grid premise.

This is a bounded diagnostic fitting slice, not a training campaign,
checkpoint/model artifact, export, browser activation, product runtime change,
ASL-correctness claim, or final-readiness claim.

## Current Evidence

M3EK completed at commit `a33014f` with receipt
[`docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json`](../validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json)
and selected exactly one next action:
`continue_tiny2_one_batch_overfit_and_shuffle_control_no_brev`.

M3EK selected:

- Tiny2 labels: `table`, `hello`
- Reserve Tiny3 extension: `black`
- Source: `asl-citizen-school-assignment-raw-videos`
- Manifest family: `data/manifests/lesson/high-signal-region-grid`
- Input contract: `rgb_regions_grid_v1`

The browser product remains fail-closed: model card status is `not_trained`,
active labels are empty, and browser recognition is inactive.

## Required Slice

Complete exactly one smallest useful local diagnostic:

1. Verify state and boundaries:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

2. Inspect existing training/diagnostic helpers and manifests. Reuse existing
   code paths where practical. If a tiny local helper is needed, keep it scoped
   to this diagnostic and do not save checkpoints or model artifacts.

3. Build a deterministic one-batch Tiny2 diagnostic using only `table` and
   `hello` from the M3EK-selected ASL Citizen high-signal manifests. Record the
   exact clip ids, label order, tensor/input contract, seed, batch shape, and
   source/register hashes.

4. Run exactly one real-label one-batch overfit diagnostic locally. It must:

- use random-init scratch code only;
- save no checkpoint/model artifact;
- report train accuracy, loss trajectory, dominant predicted-class fraction,
  per-label recall on the fixed batch, and whether train accuracy reached
  `>= 0.95`;
- stop within a small local budget recorded in the receipt.

5. Run exactly one deterministic label-shuffle negative control on the same
   batch and local budget. It must fail the learnability/promotion premise: no
   held-out or generalized success claim may be made from it, and any leakage
   or suspicious success must stop the route.

6. Inspect fail-closed claim surfaces read-only and confirm they remain
   unchanged.

7. Write a tracked receipt:

`docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json`

The receipt must include state checks, selected labels, batch manifest, source
and claim-surface hashes, real-label metrics, shuffle-control metrics,
class-collapse check, leak/suspicious-success check, negative authorizations,
changed files, and exactly one next action.

8. Write a numbered session log and commit only scoped diagnostic/receipt/log
   files.

## Allowed Next Actions

Select exactly one:

- `continue_tiny2_heldout_noncollapse_probe_no_brev`
- `continue_tiny2_command_or_input_repair_no_brev`
- `continue_detector0_source_region_receipts_no_brev`
- `stop_for_tiny2_learnability_blocker`
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

- CONTINUE if the receipt proves a bounded local one-batch signal or a concrete
  local blocker, the shuffle control behaves as expected, fail-closed claims
  stay unchanged, and the next action is one bounded no-Brev step.
- NUDGE if metrics, batch ids, label order, source/claim hashes,
  class-collapse checks, shuffle-control interpretation, negative
  authorizations, or exactly one next action are missing.
- REDIRECT if the executor broadens labels, runs Brev, saves/promotes model
  artifacts, mutates sources/manifests/tensors/vocabulary, or treats this as
  product readiness.
- STOP if the selected next action needs human source, strategy, or product
  approval.
