# Return-To-Form M3GV Reduced4 Smoke Metric Triage No Brev Goal Loop Prompt

Mission 3GV prompt for the Codex executor after M3GU completed one guarded
local/no-Brev reduced4 diagnostic training smoke with failed target metrics.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training metric-triage receipt that
interprets M3GU's reduced4 smoke evidence without overclaiming it. This mission
must not train, evaluate, rerun, export, promote, activate browser recognition,
change implementation code, expand claims, or use Brev beyond read-only state
inspection.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GU evidence:
   - [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
   - [`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`](../session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md)
   - ignored `output/m3gu-reduced4-local-training-smoke/training-provenance.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/validation-report.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/prediction-sidecar.json`, if present locally
5. M3GT/M3GS/M3GR/M3GQ evidence:
   - [`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`](../validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](../validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
6. Earlier M3GP/M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB receipts and session logs when
   needed for strategy context.
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
python3 -m json.tool docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json >/dev/null
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
   parse JSON reports/provenance and hash/check-ignore ignored artifacts, but
   must not regenerate or rewrite them.

3. Build a triage table in the receipt:

   - proven by M3GU: reduced4 guard worked, `rgb_regions` was consumed,
     `B,T,R,C,H,W` region axis was preserved, `rgb_frames` fallback was not
     used, `pretrained_components: []`, one local MPS smoke completed, and one
     diagnostic report was written.
   - not proven by M3GU: held-out quality, threshold readiness, reduced4
     negative-challenge behavior, export eligibility, browser activation,
     product readiness, broad-training viability, or any user-facing ASL
     correctness claim.
   - metrics: validation/test top-1, macro-F1, per-label recall, zero-recall
     labels, confusion patterns, and whether the model collapsed toward a small
     subset of predictions.
   - evaluator exit nuance: M3GU's evaluation command exited `1` because
     `passes_targets: false`; the generated report remains valid diagnostic
     target-failure evidence, and M3GU did not rerun evaluation after fixing the
     smoke exit guard.
   - negative challenge: record that no reduced4 negative-challenge manifest
     exists, so closed-set false-pass values are not negative-challenge proof.

4. Evaluate the next options without performing them:

   - `continue_m3gw_reduced4_data_split_zero_recall_diagnosis_no_training`
   - `continue_m3gw_reduced4_guard_or_metric_contract_cleanup_no_training`
   - `escalate_openai_or_gpt_pro_strategy_with_m3gq_m3gr_m3gs_m3gt_m3gu_m3gv_evidence`
   - `stop_for_human_training_budget_source_or_claim_review`

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off state;
- M3GU guard/training/evaluation summary with artifact hashes when available;
- metric triage table;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md`

7. Select exactly one next action:

- `continue_m3gw_reduced4_data_split_zero_recall_diagnosis_no_training`
- `continue_m3gw_reduced4_guard_or_metric_contract_cleanup_no_training`
- `escalate_openai_or_gpt_pro_strategy_with_m3gq_m3gr_m3gs_m3gt_m3gu_m3gv_evidence`
- `stop_for_human_training_budget_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GV.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3GU guard, training, and diagnostic evaluation evidence is
   interpreted without rerunning training or evaluation.
4. The receipt separates what M3GU proves from what it does not prove and
   treats failed metrics as failed diagnostic targets, not readiness.
5. A tracked M3GV receipt and numbered session log exist.
6. Claim surfaces remain fail-closed and unpromoted.
7. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, research API call, final-gate change,
   implementation change, claim expansion, or pretrained shortcut occurs.
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

- CONTINUE if the executor creates the no-training triage receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses metric interpretation, evaluator exit nuance,
  negative-challenge absence, forbidden-action proof, claim-surface proof, or
  exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, changes implementation,
  exports, promotes, activates browser recognition, imports source/media, calls
  research APIs, expands claims, or treats M3GU metrics as readiness.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the next proposal changes architecture/input strategy or repeats
  training after failed metrics without a current strategy memo.

## Progress Ledger

Current state: M3GU completed the guarded local reduced4 smoke, but metrics
failed targets and remain diagnostic-only.

Completed: M3GQ reduced4 manifests; M3GR reduced4 local input wiring and tiny
train-fit preflight; M3GS trainability triage; M3GT command/cap receipt; M3GU
guarded local diagnostic smoke/evaluation.

Evidence: M3GU receipt/log and ignored output JSON if present, M3GT/M3GS/M3GR/
M3GQ receipts/logs, fail-closed claim surfaces, and read-only Brev state.

Remaining: interpret the weak M3GU metrics and choose the next no-spend
diagnostic action without rerunning compute.

Blockers: do not continue to another fitting/evaluation route unless a later
prompt has explicit approval and evidence that the failure mode has been
diagnosed.

Next step: write the M3GV reduced4 smoke metric-triage receipt and session log.
