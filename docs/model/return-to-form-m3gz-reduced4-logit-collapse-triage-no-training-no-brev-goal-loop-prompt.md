# Return-To-Form M3GZ Reduced4 Logit Collapse Triage No Training No Brev Goal Loop Prompt

Mission 3GZ prompt for the Codex executor after M3GY selected
`continue_m3gz_reduced4_logit_collapse_triage_no_training_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one local/no-Brev/no-training triage of the M3GY reduced4 diagnostic
sidecar/report. Interpret what the new raw-logit evidence actually says about
the failed reduced4 model, record any contract metadata gap, and select one
next action that moves the project toward a compute-worthy or strategy-worthy
repair.

This mission must not train, fit, micro-overfit, rerun evaluation, overwrite or
regenerate ignored outputs, use Brev lifecycle/remote/sync/copy/exec commands,
inspect raw media, import source/media, mutate source-register rights, mutate
manifests/tensors/vocabulary, export, promote, activate browser recognition,
change final gates, expand claims, or use pretrained shortcuts.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GY evidence:
   - [`docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json`](../validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json)
   - [`docs/session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md`](../session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md)
   - `output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/validation-report.json` (read-only, ignored)
   - `output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/prediction-sidecar.json` (read-only, ignored)
5. M3GX/M3GW/M3GU evidence:
   - [`docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json`](../validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json)
   - [`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`](../validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json)
   - [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
6. M3GQ reduced4 manifests, read-only:
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
7. Fail-closed claim and source surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one no-training triage slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json >/dev/null
python3 -m json.tool output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/validation-report.json >/dev/null
python3 -m json.tool output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/prediction-sidecar.json >/dev/null
git diff --check
```

`brev ls --json` is optional and read-only. Do not run any Brev lifecycle,
remote, sync, copy, exec, training, or evaluation command.

2. Inspect the M3GY report/sidecar read-only and summarize:

- validation/test top-1, macro-F1, zero-recall classes, and no-predicted-label
  classes;
- predicted-label collapse to `sad`/`uncle`;
- logit-margin and entropy ranges/means;
- whether the model is showing high-confidence confusion or near-uniform weak
  separation;
- whether the sidecar examples contain `logits_by_label`,
  `predicted_label_logit`, `true_label_logit`, `top2_logit`,
  `top2_logit_label`, and `logit_margin`;
- whether `sidecar_contract.score_fields` still omits `top2_logit_label`;
- whether any result supports export, promotion, browser activation, or a
  product claim (expected answer: no).

3. Compare the evidence to the recent route:

- M3GR proved local input wiring and tiny same-subset train-fit only.
- M3GU failed held-out metrics after one capped local reduced4 smoke.
- M3GW ruled out obvious missing held-out label coverage or visible count
  imbalance.
- M3GX added raw-logit diagnostics.
- M3GY proves the failed model is near-uniform / weakly separated rather than a
  threshold-only or high-confidence class-confusion problem.

4. Decide whether another local no-training diagnostic can materially change
   the next compute decision. If not, prefer strategy escalation before another
   training-style attempt. The observer-pair process should not queue another
   fitting or Brev attempt merely because data plumbing is now less ambiguous.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- exact commands run;
- report/sidecar hashes inspected;
- score-field and example-field contract interpretation;
- metric and logit-collapse interpretation;
- claim-surface proof;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/667-mission-3gz-reduced4-logit-collapse-triage-no-training-no-brev.md`

7. Select exactly one next action:

- `escalate_gpt_pro_strategy_with_m3gy_logits_evidence_no_brev`
- `continue_m3ha_sidecar_score_fields_metadata_patch_no_training_no_brev`
- `continue_m3ha_specific_local_diagnostic_no_training_no_brev`
- `stop_for_human_strategy_compute_or_claim_review`

Prefer `escalate_gpt_pro_strategy_with_m3gy_logits_evidence_no_brev` if the
only remaining path to better training is a model/data strategy choice rather
than a narrow local contract bug. Prefer the metadata patch only if the missing
`top2_logit_label` score-field listing is judged to block future consumers.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GZ.
2. Baseline checks pass or exact blockers are recorded.
3. Existing ignored M3GY/M3GU outputs are read-only and not overwritten,
   regenerated, moved, deleted, copied into tracked files, exported, or
   promoted.
4. The M3GY result is interpreted from metrics, prediction counts, logit
   margins, entropy, and sidecar contract fields.
5. No training/fitting, evaluator rerun, Brev lifecycle/remote/sync/copy/exec,
   raw media inspection, source import, source rights mutation,
   manifest/tensor/vocabulary mutation, export, promotion, browser activation,
   final-gate change, claim expansion, broad-label run, or pretrained shortcut
   occurs.
6. A tracked M3GZ receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training/no-evaluator-rerun only.
- Do not patch model architecture, training, datasets, manifests, tensors,
  runtime, claim surfaces, or source-register rights in this mission.
- Do not use `git add -A`; stage only scoped files.
- Do not push, amend, use `--no-verify`, delete ignored output artifacts, or
  weaken any final-readiness gate.

## Observer Guidance

- CONTINUE if the executor produces a scoped M3GZ triage receipt/log, preserves
  ignored outputs and claim surfaces, and selects exactly one next action.
- NUDGE if the receipt omits raw-logit interpretation, the `top2_logit_label`
  score-field metadata gap, claim-surface proof, forbidden-action proof, or a
  single next action.
- REDIRECT if the executor trains, reruns evaluation, mutates manifests/tensors/
  vocabulary/source rights, inspects raw media, uses Brev lifecycle/remote
  commands, exports, promotes, activates browser recognition, broadens labels,
  or expands claims.
- STOP if the selected next action requires human budget, source/media, claim,
  promotion, or runtime approval.
- ESCALATE if the triage confirms weak class separation and the proposed next
  step is another training-style attempt without current strategy review.

## Progress Ledger

Current state: M3GY produced a fresh ignored diagnostic sidecar/report from the
existing M3GU checkpoint/provenance and M3GQ reduced4 manifests. The examples
contain raw-logit fields, metrics still fail, predictions collapse to `sad` and
`uncle`, margins are tiny, and entropy is near the four-class maximum.

Completed: M3GQ reduced4 manifests; M3GR local input/train-fit preflight; M3GS
triage; M3GT smoke contract; M3GU guarded local smoke/eval; M3GV metric triage;
M3GW zero-recall/data-split diagnosis; M3GX sidecar logit contract repair; M3GY
diagnostic evaluator rerun.

Evidence: M3GY receipt/log, ignored M3GY report/sidecar, M3GX/M3GW/M3GU
receipts, M3GQ manifests, fail-closed claim surfaces, source register, and
read-only/default-off Brev state.

Remaining: decide whether the next useful step is strategy escalation, a small
future-sidecar metadata patch, a concrete local no-training diagnostic, or a
human stop.

Blockers: do not run Brev, train, rerun evaluation, broaden labels, inspect raw
media, promote, or claim readiness from this diagnostic triage.

Next step: interpret the M3GY raw-logit evidence and record exactly one
strategy-aware next action.
