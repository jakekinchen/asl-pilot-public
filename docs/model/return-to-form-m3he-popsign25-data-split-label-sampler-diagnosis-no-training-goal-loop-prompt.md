# Return-To-Form M3HE PopSign25 Data Split Label Sampler Diagnosis No Training Goal Loop Prompt

Mission 3HE prompt for the Codex executor after M3HD completed the PopSign 25
metric triage and selected
`continue_m3he_popsign25_data_split_label_or_sampler_diagnosis_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training diagnosis receipt that checks
whether the M3HC PopSign 25 single-label `uncle` collapse is explained by data
split balance, label mapping, class-index consistency, true/predicted label
accounting, sampler or batch exposure, or train/eval distribution. This mission
must not train, fit, evaluate, rerun, export, promote, activate browser
recognition, change implementation code, expand claims, or use Brev beyond
read-only/default-off state inspection.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HD evidence:
   - [`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json)
   - [`docs/session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md`](../session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md)
5. M3HC evidence:
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
   - [`docs/session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md`](../session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md)
   - ignored `output/m3hb-popsign25-bounded-brev-contract/training-provenance.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/validation-report.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json`, if present locally
6. PopSign 25 manifests:
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json`
7. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one no-training data/split/label/sampler diagnosis slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect existing M3HC copied output JSON only if it already exists locally.
   You may parse JSON reports/provenance/sidecars, hash files, and prove the
   output directory is ignored by Git. Do not regenerate, rewrite, move,
   promote, export, or delete any model artifact.

3. Build a diagnosis table in the receipt covering:

   - train/validation/test row counts per label and total split balance;
   - label set equality across train/validation/test manifests;
   - class-index or label-order consistency across manifests, training
     provenance, validation report, prediction sidecar, and receipt evidence;
   - true-label distribution versus predicted-label distribution, especially
     the balanced true `uncle` share versus every-example `uncle` prediction;
   - sampler/batch/epoch exposure recorded by M3HC: batch size, max batches,
     examples seen, shuffle/sampler settings if present, seed/config values,
     and whether exposure can plausibly explain the full collapse;
   - train/eval split or file/path duplication signals that can be checked
     without reading raw media;
   - any missing metadata that prevents a stronger conclusion.

4. Interpret the diagnosis:

   - If split/label/sampler accounting explains the collapse, name the exact
     blocker and select a repair/preflight next action that does not train.
   - If split/label/sampler accounting does not explain the collapse, say so
     explicitly and route to the next smallest no-remote input/training-contract
     preflight or research-guided strategy step.
   - In all cases, state that M3HC remains diagnostic raw-frame evidence only,
     not held-out quality, Detector 0 authority, export eligibility, browser
     activation, product readiness, or a user-facing ASL correctness claim.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off state;
- manifest row-count and label-balance tables;
- label/class-index consistency checks;
- sampler/batch/epoch exposure summary;
- ignored copied output hashes when present;
- claim-surface proof that fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/677-mission-3he-popsign25-data-split-label-sampler-diagnosis-no-training.md`

7. Select exactly one next action:

- `continue_m3hf_popsign25_input_or_training_contract_preflight_no_remote`
- `continue_m3hf_popsign25_label_sampler_contract_repair_no_training`
- `continue_m3hf_detector0_crop_normalized_contract`
- `continue_m3hf_research_guided_strategy_adjustment`
- `continue_m3hf_interactive_fail_closed_product_hardening`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HE.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3HC/M3HD evidence is interpreted without rerunning training or
   evaluation.
4. The receipt records split balance, label mapping, class-index consistency,
   sampler/batch exposure, and true-versus-predicted label accounting.
5. The receipt states whether those checks do or do not explain the `uncle`
   collapse.
6. A tracked M3HE receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, final-gate change, implementation
   change, claim expansion, or pretrained shortcut occurs.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Existing approved local M3HC/M3HD evidence only.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor creates the no-training diagnosis receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses split balance, label/class-index consistency,
  sampler/batch exposure, Brev default-off proof, forbidden-action proof,
  claim-surface proof, or exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, changes implementation,
  uses Brev lifecycle/remote commands, exports, promotes, activates browser
  recognition, imports source/media, expands claims, or treats M3HC metrics as
  readiness.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the next proposal changes architecture/input strategy or repeats
  training after failed metrics without a current strategy memo.

## Progress Ledger

Current state: M3HD completed metric triage for the failed M3HC PopSign 25
Brev run and selected this no-training split/label/sampler diagnosis.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof; M3HD metric triage.

Evidence: M3HD receipt/log, M3HC receipt/log, ignored copied M3HC output JSON if
present, PopSign 25 manifests, fail-closed claim surfaces, and read-only Brev
state.

Remaining: decide whether split/label/sampler accounting explains the PopSign
25 `uncle` collapse before any further compute or training-style route.

Blockers: do not continue to another fitting/evaluation route unless a later
prompt has explicit approval and evidence that the failure mode has been
diagnosed.

Next step: write the M3HE PopSign 25 data split label/sampler diagnosis receipt
and session log.
