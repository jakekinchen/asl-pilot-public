# Return-To-Form M3GT Reduced4 Local Training Smoke Receipt No Brev Goal Loop Prompt

Mission 3GT prompt for the Codex executor after M3GS selected a bounded
reduced4 local training-smoke receipt as the next smallest evidence step.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training receipt that specifies the
future reduced4 local training smoke before any non-tiny fitting happens. The
receipt must turn the M3GS recommendation into a reviewable command plan with
strict caps, output namespace guards, kill conditions, interpretation rules,
and fail-closed claim boundaries.

This mission is receipt/planning only. It must not train, fit, evaluate a
checkpoint, export, promote, activate browser recognition, change final gates,
or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GS triage evidence:
   - [`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](../validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
   - [`docs/session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md`](../session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md)
5. M3GR train-fit evidence:
   - [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
   - [`docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md`](../session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md)
   - `scripts/run_m3gr_reduced4_micro_overfit_preflight.py`
   - ignored `output/m3gr-reduced4-local-micro-overfit-preflight/*.json`, if present locally
6. M3GQ reduced4 evidence:
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - [`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`](../session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
7. Prior metric and strategy evidence from M3GP/M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB.
8. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one local/no-Brev/no-training reduced4 training-smoke receipt.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

If ignored M3GR output JSON exists locally, validate it with
`python3 -m json.tool` and record hashes. Do not require ignored outputs to be
tracked.

2. Inspect the current train/eval command surfaces only enough to draft a
future local reduced4 smoke command. Record the exact files inspected. Do not
modify implementation code.

3. Write a future-command plan that includes:

   - exact candidate command or command template for a future local/no-Brev
     reduced4 train/validation/test smoke;
   - manifest paths, input representation, label vocabulary, and model family;
   - max runtime, epoch/step/sample caps, random seed policy, and output
     namespace;
   - pre-run absence/freshness guards for output files;
   - kill conditions for loss/metric stagnation, runtime overrun, wrong input
     contract, source mismatch, or claim-surface drift;
   - expected diagnostic signals before the run: train sanity, validation/test
     top-1 or macro-F1, per-label recall, zero-recall labels, confusion, and
     negative/false-pass fields if available;
   - interpretation rules that prevent promotion or claim expansion from any
     single local smoke result;
   - explicit distinction between M3GR tiny same-subset train-fit proof and
     the future held-out reduced4 signal.

4. Do not run the planned command. Do not run training, fitting, another
micro-overfit, checkpoint evaluator reruns, validation/test readiness
evaluation, export, browser/product smoke, browser activation, research,
source/media work, or claim changes.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- Brev read-only/default-off state;
- M3GS selected next action and M3GR/M3GQ evidence summary;
- files inspected to draft the future command;
- future local-smoke command plan, caps, output namespace, guards, and kill
  conditions;
- planned success/failure interpretation before the run;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Write the session log:

`docs/session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md`

7. Select exactly one next action:

- `continue_m3gu_reduced4_local_training_smoke_no_brev`
- `continue_m3gu_reduced4_data_or_split_diagnosis_no_training`
- `escalate_openai_or_gpt_pro_strategy_with_m3gp_m3gq_m3gr_m3gs_m3gt_evidence`
- `stop_for_human_training_budget_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GT.
2. Required baseline checks pass or exact blockers are recorded.
3. M3GS, M3GR, and M3GQ evidence is inspected.
4. A future local/no-Brev reduced4 smoke command plan is recorded with strict
   caps, output guards, kill conditions, and interpretation rules.
5. No training/fitting, evaluator rerun, export, promotion, browser activation,
   source/media work, research API call, final-gate change, Brev lifecycle/
   remote/spend, or claim expansion occurs.
6. A tracked M3GT receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training receipt only.
- Existing approved local artifacts only.
- Do not run the future smoke command in this mission.
- Do not inspect raw learner media, import new datasets, broaden labels, or
  mutate source-register rights.
- Do not promote a model card, activate browser recognition, or claim final
  readiness.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor writes the scoped receipt, preserves fail-closed
  claims, keeps Brev read-only/default-off, avoids fitting/evaluation, and
  selects one bounded next action.
- NUDGE if the receipt misses command caps, output guards, kill conditions,
  planned interpretation rules, forbidden-action proof, claim-surface proof, or
  exactly one next action.
- REDIRECT if the executor trains, evaluates, exports, promotes, activates
  browser recognition, imports source/media, calls research APIs, or expands
  claims.
- STOP if the selected next action requires human training budget, source,
  privacy, claim, promotion, final-submission, or scope approval.
- ESCALATE if the next action changes architecture/input strategy after failure
  and no current strategy memo covers that decision.

## Progress Ledger

Current state: M3GR proved reduced4 local input wiring and tiny same-subset
memorization; M3GS interpreted that result without overclaiming and selected a
future local/no-Brev reduced4 training-smoke receipt.

Completed: M3GQ reduced4 manifests; M3GR dataloader and tiny train-fit
preflight; M3GS result triage.

Evidence: M3GQ receipt/log, M3GR receipt/log and ignored output JSON if
present, M3GS receipt/log, fail-closed claim surfaces, and read-only Brev
state.

Remaining: record the exact future local-smoke command contract before any
non-tiny fitting happens.

Blockers: stop if the next action requires human budget, source/privacy, claim,
promotion, final-submission, Brev, or broad-scope approval.

Next step: write the M3GT reduced4 local training smoke receipt.
