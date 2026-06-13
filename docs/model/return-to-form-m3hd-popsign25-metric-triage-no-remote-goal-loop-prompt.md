# Return-To-Form M3HD PopSign25 Metric Triage No Remote Goal Loop Prompt

Mission 3HD prompt for the Codex executor after M3HC completed one bounded
PopSign 25-label Brev training/evaluation attempt and selected
`continue_m3hd_popsign25_metric_triage_no_remote`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training metric-triage receipt that
interprets M3HC's PopSign 25-label Brev result without overclaiming it. This
mission must not train, evaluate, rerun, export, promote, activate browser
recognition, change implementation code, expand claims, or use Brev beyond
read-only/default-off state inspection.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HC evidence:
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
   - [`docs/session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md`](../session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md)
   - ignored `output/m3hb-popsign25-bounded-brev-contract/training-provenance.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/validation-report.json`, if present locally
   - ignored `output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json`, if present locally
5. M3HB route evidence:
   - [`docs/validation/return-to-form-m3hb-human-reopened-model-completion-route-v1.json`](../validation/return-to-form-m3hb-human-reopened-model-completion-route-v1.json)
   - [`docs/validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json`](../validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json)
   - [`docs/session-logs/671-mission-3hb-human-reopened-model-completion-bounded-brev.md`](../session-logs/671-mission-3hb-human-reopened-model-completion-bounded-brev.md)
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

Complete exactly one no-training metric-triage slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hb-human-reopened-model-completion-route-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect existing M3HC copied outputs only if they already exist locally. You
   may parse JSON reports/provenance, hash files, and prove the output directory
   is ignored by Git, but must not regenerate, rewrite, move, promote, or export
   any model artifact.

3. Build a triage table in the receipt:

   - proven by M3HC: the approved bounded Brev envelope executed once, the
     worker started and stopped, CUDA was available, repo/data sync completed,
     exactly one remote dry-run, one non-dry-run training command, one evaluator
     command, and one copyback occurred, and `pretrained_components: []` stayed
     true.
   - not proven by M3HC: held-out quality, threshold readiness, negative-
     challenge behavior, Detector 0 authority, crop-normalized recognition,
     browser activation, export eligibility, product readiness, broad-training
     viability, or any user-facing ASL correctness claim.
   - metrics: training accuracy/loss, capped validation accuracy/loss during
     training, validation/test top-1, macro-F1, predicted-label distribution,
     selected threshold, pass/fail status, probability margins, entropy, and
     chance baseline for 25 labels (`1/25 = 0.04`).
   - collapse interpretation: record that validation and test predictions
     collapsed to `uncle`, with validation/test top-1 exactly at 25-label chance
     and macro-F1 near zero.
   - compute and cost: record start/stop/default-off state, current `brev ls`
     state, and whether any remote job is queued or running.

4. Evaluate the next options without performing them:

   - `continue_m3he_popsign25_data_split_label_or_sampler_diagnosis_no_training`
   - `continue_m3he_popsign25_input_or_training_contract_preflight_no_remote`
   - `continue_m3he_detector0_crop_normalized_contract`
   - `continue_m3he_research_guided_strategy_adjustment`
   - `continue_m3he_interactive_fail_closed_product_hardening`
   - `stop_for_human_review`

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off state;
- M3HC command-cap, lifecycle, metric, artifact, and claim-surface summary;
- artifact hashes when ignored copied outputs are present;
- metric triage table and interpretation;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md`

7. Select exactly one next action:

- `continue_m3he_popsign25_data_split_label_or_sampler_diagnosis_no_training`
- `continue_m3he_popsign25_input_or_training_contract_preflight_no_remote`
- `continue_m3he_detector0_crop_normalized_contract`
- `continue_m3he_research_guided_strategy_adjustment`
- `continue_m3he_interactive_fail_closed_product_hardening`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HD.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3HC training/evaluation evidence is interpreted without rerunning
   training or evaluation.
4. The receipt separates what M3HC proves from what it does not prove and
   treats the result as diagnostic target-failure evidence, not readiness.
5. A tracked M3HD receipt and numbered session log exist.
6. Claim surfaces remain fail-closed and unpromoted.
7. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, final-gate change, implementation
   change, claim expansion, or pretrained shortcut occurs.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Existing approved local M3HC evidence only.
- Read ignored M3HC output JSON only if already present; do not regenerate,
  rewrite, move, promote, or export model artifacts.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor creates the no-training triage receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses metric interpretation, chance/collapse analysis,
  Brev default-off proof, forbidden-action proof, claim-surface proof, or
  exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, changes implementation,
  uses Brev lifecycle/remote commands, exports, promotes, activates browser
  recognition, imports source/media, expands claims, or treats M3HC metrics as
  readiness.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the next proposal changes architecture/input strategy or repeats
  training after failed metrics without a current strategy memo.

## Progress Ledger

Current state: M3HC completed one bounded PopSign 25 Brev training/evaluation
attempt, but metrics failed and predictions collapsed to `uncle`.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof.

Evidence: M3HC receipt/log, ignored copied M3HC output JSON if present, M3HB
route evidence, PopSign 25 manifests, fail-closed claim surfaces, and read-only
Brev state.

Remaining: interpret the weak M3HC metrics and choose the next no-remote action
without rerunning compute.

Blockers: do not continue to another fitting/evaluation route unless a later
prompt has explicit approval and evidence that the failure mode has been
diagnosed.

Next step: write the M3HD PopSign 25 metric-triage receipt and session log.
