# Return-To-Form M3HF PopSign25 Input Training Contract Preflight No Remote Goal Loop Prompt

Mission 3HF prompt for the Codex executor after M3HE completed the PopSign 25
split/label/sampler diagnosis and selected
`continue_m3hf_popsign25_input_or_training_contract_preflight_no_remote`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training preflight receipt that turns the
M3HC/M3HD/M3HE PopSign 25 failure evidence into an explicit input, training
command, sampler metadata, and receipt-contract diagnosis before any further
training-style work. This mission must not train, fit, evaluate, rerun, export,
promote, activate browser recognition, change implementation code, expand
claims, mutate manifests/tensors/vocabulary, inspect raw media, or use Brev
beyond read-only/default-off state inspection.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HE evidence:
   - [`docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json`](../validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json)
   - [`docs/session-logs/677-mission-3he-popsign25-data-split-label-sampler-diagnosis-no-training.md`](../session-logs/677-mission-3he-popsign25-data-split-label-sampler-diagnosis-no-training.md)
5. M3HD evidence:
   - [`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json)
   - [`docs/session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md`](../session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md)
6. M3HC evidence:
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
   - [`docs/session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md`](../session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md)
   - ignored `output/m3hb-popsign25-bounded-brev-contract/training-provenance.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/validation-report.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json`, if present locally
7. PopSign 25 manifests:
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json`
8. Local training/evaluation contract surfaces, scripts, and docs needed to
   understand input mode, class-index mapping, sampler/shuffle/drop behavior,
   batch/epoch limits, output namespace, sidecar/report fields, and receipt
   command caps. Inspect read-only; do not patch implementation code.
9. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one no-training input/training-contract preflight slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect existing M3HC copied output JSON only if it already exists locally.
   You may parse JSON reports/provenance/sidecars, hash files, and prove the
   output directory is ignored by Git. Do not regenerate, rewrite, move,
   promote, export, or delete any model artifact.

3. Build a contract preflight table in the receipt covering:

   - PopSign 25 input mode and tensor/sequence contract used by M3HC, including
     raw-frame versus region/crop axis status and any recorded input-shape
     fields;
   - training command and evaluator command contract from M3HC, including
     command caps, output namespace, max batches, epochs, batch size, seeds,
     threshold, and command/result file paths;
   - class-index map and label-order propagation across manifests, training
     provenance, validation report, sidecar examples, and receipt evidence;
   - sampler/shuffle/drop-last/batch exposure metadata that is recorded,
     missing, or only inferable from scripts;
   - report/sidecar fields needed to distinguish unlearned near-uniform failure
     from class-index, sampler, threshold, or input-contract failure;
   - train/eval split and source/signer metadata available without reading raw
     media;
   - no-training checks that can be safely performed before any future compute;
   - approval-gated or forbidden checks that would require training, evaluator
     rerun, Brev lifecycle/remote commands, source/media work, manifest/tensor
     mutation, implementation change, export, promotion, or claim changes.

4. Interpret the preflight:

   - If a contract gap explains or could plausibly explain the M3HC collapse,
     select a no-training repair or receipt-refresh next action.
   - If the contract is adequate but the capped exposure is the main limitation,
     select a no-training compute-receipt next action rather than running
     compute directly.
   - If the next useful step would change input strategy, architecture, target
     schema, source scope, vocabulary, training budget, or compute after the
     failed metrics, select research-guided strategy adjustment unless a
     current strategy memo already covers the exact PopSign 25 evidence.
   - In all cases, state that M3HC remains diagnostic raw-frame evidence only,
     not held-out quality, Detector 0 authority, export eligibility, browser
     activation, product readiness, or a user-facing ASL correctness claim.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off state;
- M3HE/M3HD/M3HC evidence summary;
- input-contract table;
- training/evaluation command-contract table;
- class-index and label-order contract checks;
- sampler/shuffle/drop-last/batch-exposure metadata summary;
- report/sidecar contract gap summary;
- ignored copied output hashes when present;
- claim-surface proof that fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/679-mission-3hf-popsign25-input-training-contract-preflight-no-remote.md`

7. Select exactly one next action:

- `continue_m3hg_popsign25_label_sampler_contract_repair_no_training`
- `continue_m3hg_popsign25_training_receipt_or_command_repair_no_training`
- `continue_m3hg_bounded_popsign25_compute_receipt_no_training`
- `continue_m3hg_research_guided_strategy_adjustment`
- `continue_m3hg_detector0_crop_normalized_contract`
- `continue_m3hg_interactive_fail_closed_product_hardening`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HF.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3HC/M3HD/M3HE evidence is interpreted without rerunning training
   or evaluation.
4. The receipt records input mode, training/evaluation command contract,
   class-index propagation, sampler/shuffle/drop-last/batch exposure metadata,
   report/sidecar contract fields, and missing metadata.
5. The receipt states whether the contract accounting explains, partially
   explains, or does not explain the `uncle` collapse.
6. A tracked M3HF receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, final-gate change, implementation
   change, manifest/tensor/vocabulary mutation, claim expansion, or pretrained
   shortcut occurs.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Existing approved local M3HC/M3HD/M3HE evidence only.
- Read ignored M3HC output JSON only if already present; do not regenerate,
  rewrite, move, promote, export, or delete model artifacts.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, change implementation code, or change product/browser
  claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor creates the no-training preflight receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses input-contract accounting, command-contract
  accounting, class-index propagation, sampler/shuffle/drop-last metadata,
  report/sidecar gap accounting, Brev default-off proof, forbidden-action
  proof, claim-surface proof, or exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, changes implementation,
  mutates manifests/tensors/vocabulary, uses Brev lifecycle/remote commands,
  exports, promotes, activates browser recognition, imports source/media,
  expands claims, or treats M3HC metrics as readiness.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the next proposal changes architecture, input strategy, target
  schema, source scope, vocabulary, training budget, or compute after repeated
  failed metrics without a current strategy memo covering the exact PopSign 25
  evidence.

## Progress Ledger

Current state: M3HE completed split/label/sampler diagnosis for the failed M3HC
PopSign 25 Brev run and selected this no-remote input/training-contract
preflight.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof; M3HD metric triage; M3HE split,
label, class-index, true/predicted, sampler, and train/eval distribution
diagnosis.

Evidence: M3HE receipt/log, M3HD receipt/log, M3HC receipt/log, ignored copied
M3HC output JSON if present, PopSign 25 manifests, local training/evaluation
contract surfaces, fail-closed claim surfaces, and read-only Brev state.

Remaining: decide whether a concrete input, command, sampler, or report/sidecar
contract gap should be repaired before any further compute, or whether the next
safe action is a bounded compute receipt, research-guided strategy adjustment,
Detector 0 crop-normalized contract, fail-closed product hardening, or human
review.

Blockers: do not continue to another fitting/evaluation route unless a later
prompt has explicit approval, a compute receipt, a max-spend/kill-condition
envelope, and evidence that the current contract failure mode has been
diagnosed.

Next step: write the M3HF PopSign 25 input/training-contract preflight receipt
and session log.
