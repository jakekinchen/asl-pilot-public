# Return-To-Form M3EK Tiny2/Tiny3 Gated Proof Preparation Goal Loop Prompt

Mission 3EK prompt for the Codex executor after Mission 3EJ records the GPT Pro
strategy redirect. This mission prepares the tiny recognizer proof without
spending Brev or training.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Prepare a Tiny2/Tiny3 gated signal proof that can decide whether the promoted
no-pretrained, browser-first recognizer lane can learn anything reliable under
the real constraints.

This mission is local/no-spend/no-training. It may write source/label/gate
receipts and helper checks, but it must not run a training or fitting command.

## Strategy

The next recognizer proof is not broad Fresh5. It is a tiny, deliberately
separable label-set proof with gates that fail before spending GPU time if the
pipeline cannot learn a toy signal.

The default product lane remains fail-closed. Recognition remains inactive
unless a later browser artifact passes explicit promotion gates.

## Required Slice

Complete one preparation slice:

1. Verify current repo, claim surfaces, and source boundaries.
2. Inventory candidate labels for a Tiny2/Tiny3 proof, including source,
   rights/approval status, clip counts, signer/split support, visual
   separability, known near-confusions, and whether the sign depends on
   face/body-relative context.
3. Write or update a tracked label-selection/source receipt.
4. Define the exact entry gates before any future training:
   - source/licensing receipt for every active label;
   - signer-separated split policy where applicable;
   - one-batch overfit target at least `0.95` train accuracy;
   - label-shuffle negative control must fail;
   - class-collapse detector;
   - open-set/hard-negative plan;
   - browser export/parity instrumentation plan.
5. Define abort and promotion gates.
6. Select exactly one next action.

## Receipt

Write:

`docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json`

The receipt must include candidate labels, source/licensing status, selection
rationale, entry gates, abort gates, promotion gates, negative authorizations,
fail-closed claim boundary, changed files, and exactly one next action.

## Allowed Next Actions

Select exactly one:

- `continue_tiny2_one_batch_overfit_and_shuffle_control_no_brev`
- `continue_detector0_source_region_receipts_no_brev`
- `continue_fail_closed_mvp_package_refresh`
- `stop_for_source_or_label_scope_review`
- `stop_for_human_product_scope_review`

## Hard Boundaries

- No Brev command or spend.
- No training, fitting, evaluation rerun, checkpoint/model artifact, ONNX
  export, browser activation, product runtime change, model-card promotion,
  active-label promotion, ASL-correctness claim, or final-readiness claim.
- No source import, source-register mutation, media download, manifest/tensor/
  vocabulary/packet-row mutation, generated labels, pseudo-labels, pretrained
  dependency, or broad label expansion unless this prompt is explicitly
  replaced by a source-import prompt.
- No push, amend, or no-verify.

## Observer Guidance

- CONTINUE only if the receipt creates a stricter gate than prior Fresh5
  attempts and preserves fail-closed product claims.
- NUDGE if source/licensing, label separability, one-batch overfit,
  label-shuffle, class-collapse, open-set, browser parity, abort, or promotion
  gates are missing.
- REDIRECT if the executor turns this into broad Fresh5 training or tries to
  spend Brev.
- STOP if the selected next action requires human source, product, or budget
  approval.
