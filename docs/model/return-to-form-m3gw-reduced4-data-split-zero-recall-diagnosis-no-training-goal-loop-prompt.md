# Return-To-Form M3GW Reduced4 Data-Split Zero-Recall Diagnosis No Training Goal Loop Prompt

Mission 3GW prompt for the Codex executor after M3GV selected a local
no-training diagnosis of M3GU's zero-recall labels and prediction collapse.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training diagnosis receipt that explains
what the existing reduced4 manifests, source metadata, and M3GU sidecar/report
can and cannot say about validation/test zero-recall labels and prediction
collapse. This mission must not train, evaluate, rerun, regenerate outputs,
edit implementation code, mutate manifests/tensors/vocabulary, inspect raw
media, expand claims, or use Brev beyond read-only state inspection.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GV evidence:
   - [`docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json)
   - [`docs/session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md`](../session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md)
5. M3GU evidence:
   - [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
   - [`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`](../session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md)
   - ignored `output/m3gu-reduced4-local-training-smoke/training-provenance.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/validation-report.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/prediction-sidecar.json`, if present locally
6. M3GQ/M3GR/M3GS/M3GT evidence:
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](../validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`](../validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
7. Source-register and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one read-only zero-recall/data-split diagnosis slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect existing M3GU outputs only if they already exist locally. You may
   parse JSON reports/provenance/sidecars, hash/check-ignore ignored artifacts,
   and summarize manifest metadata. Do not regenerate, rewrite, move, export,
   promote, or copy any model artifacts.

3. Build diagnosis tables in the receipt:

   - reduced4 label counts by split;
   - source, signer, session, clip, tensor, and metadata fields available by
     split and label, recording missing fields explicitly;
   - validation/test true-label versus predicted-label counts from the sidecar;
   - zero-recall labels and whether each has train/validation/test examples;
   - train/validation/test source or signer overlap when fields exist;
   - any manifest/schema limitation that prevents a stronger conclusion;
   - whether the evidence supports split imbalance, source/signer mismatch,
     label coverage problems, sidecar/report contract limitations, or model
     collapse despite balanced visible counts.

4. Keep conclusions graded:

   - confirmed from current files;
   - plausible but not proven;
   - explicitly not knowable from current metadata;
   - unsafe to infer without source/media inspection, training, evaluation, or
     human/source approval.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off state;
- manifest and sidecar metadata diagnosis tables;
- zero-recall and prediction-collapse interpretation;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md`

7. Select exactly one next action:

- `continue_m3gx_reduced4_manifest_metadata_or_sidecar_diagnostic_repair_no_training`
- `continue_m3gx_reduced4_split_or_source_contract_repair_no_training`
- `escalate_openai_or_gpt_pro_strategy_with_m3gq_to_m3gw_evidence`
- `stop_for_human_source_vocab_split_or_training_budget_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GW.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3GQ/M3GU/M3GV evidence is inspected without training, evaluator
   reruns, output regeneration, source/media inspection, or implementation
   changes.
4. The receipt explains what current metadata can and cannot say about
   zero-recall labels and prediction collapse.
5. A tracked M3GW receipt and numbered session log exist.
6. Claim surfaces remain fail-closed and unpromoted.
7. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, output
   regeneration, export, browser activation, source/media work, source-register
   rights mutation, manifest/tensor/vocabulary mutation, research API call,
   final-gate change, implementation change, claim expansion, or pretrained
   shortcut occurs.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Existing approved local reduced4 artifacts only.
- Read ignored M3GU output JSON only if already present; do not regenerate,
  rewrite, move, promote, or export model artifacts.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor creates the no-training diagnosis receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses split/source metadata, zero-recall interpretation,
  sidecar/report limitations, forbidden-action proof, claim-surface proof, or
  exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, regenerates outputs,
  changes implementation, mutates manifests/tensors/vocabulary, exports,
  promotes, activates browser recognition, imports source/media, calls research
  APIs, expands claims, or treats M3GU/M3GV evidence as readiness.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if local metadata cannot answer the failure mode and the next
  proposal changes architecture/input strategy or repeats training without a
  current strategy memo.

## Progress Ledger

Current state: M3GV identified M3GU's dominant unresolved signal as zero-recall
labels and prediction collapse, not readiness.

Completed: M3GQ reduced4 manifests; M3GR local input/train-fit preflight; M3GS
trainability triage; M3GT command/cap receipt; M3GU guarded local smoke/eval;
M3GV metric triage.

Evidence: M3GV receipt/log, M3GU receipt/log and ignored output JSON if
present, M3GQ reduced4 manifests, fail-closed claim surfaces, source-register
metadata, and read-only Brev state.

Remaining: diagnose whether current metadata explains zero recall and
prediction collapse before any further compute or mutation.

Blockers: do not continue to training/evaluation, source/media, manifest
mutation, Brev, export, promotion, or claim work unless a later prompt records
explicit approval and evidence.

Next step: write the M3GW zero-recall/data-split diagnosis receipt and session
log.
