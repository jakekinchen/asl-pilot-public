# Return-To-Form M3GS Reduced4 Trainability Result Triage No Brev Goal Loop Prompt

Mission 3GS prompt for the Codex executor after M3GR proved the M3GQ reduced4
local dataloader path and exactly one tiny train-fit preflight.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training triage receipt that interprets
the M3GR reduced4 train-fit result without overclaiming it. The goal is to
decide the next smallest evidence-producing step for the reduced4 lane while
preserving fail-closed product claims and avoiding another broad or paid run.

This mission is analysis/triage only. It must not train, fit, evaluate a
checkpoint, export, promote, activate browser recognition, change final gates,
or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GR train-fit evidence:
   - [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
   - [`docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md`](../session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md)
   - `scripts/run_m3gr_reduced4_micro_overfit_preflight.py`
   - `output/m3gr-reduced4-local-micro-overfit-preflight/selected-subset.json`, if present locally
   - `output/m3gr-reduced4-local-micro-overfit-preflight/tiny-overfit-provenance.json`, if present locally
5. M3GQ reduced4 evidence:
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - [`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`](../session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
6. Prior metric and strategy evidence from M3GP/M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB.
7. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one local/no-Brev/no-training result-triage slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

2. Build a compact trainability interpretation table:

   - what M3GR proves: reduced4 tensors load, `rgb_regions_grid_v1` is used,
     region axis is preserved, the 4-clip deterministic subset can be
     memorized from scratch locally;
   - what M3GR does not prove: validation/test generalization, product
     readiness, threshold readiness, browser activation, export eligibility, or
     broad training viability;
   - remaining evidence gaps for the reduced4 lane;
   - risk of overfitting to the selected deterministic subset;
   - why M3GL/M3GJ seven-label held-out failures remain relevant context.

3. Evaluate next-step options without performing them:

   - `bounded_reduced4_local_training_smoke`: a future local/no-Brev train/
     validation/test smoke on the M3GQ reduced4 manifests with strict caps and
     no promotion meaning.
   - `receipt_only_before_training`: prepare a future command/kill-condition
     receipt before any non-tiny fitting.
   - `data_or_split_diagnosis_no_training`: inspect reduced4 split/signer/
     source balance and failure hypotheses before any more fitting.
   - `external_strategy_research`: ask whether to authorize OpenAI/GPT-Pro
     strategy review using M3GP/M3GQ/M3GR evidence.
   - `human_review`: stop for human training budget, source/privacy, claim, or
     final-submission choice.

4. Do not run any future training, evaluator, research, product, source/media,
   export, promotion, browser, final-gate, or claim work identified by the
   triage. Record the required approval or next prompt boundary instead.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- Brev read-only/default-off state;
- M3GR train-fit evidence and ignored output hashes if available;
- M3GQ reduced4 manifest hashes;
- what M3GR proves and does not prove;
- remaining evidence gaps;
- evaluated next-step options and tradeoffs;
- selected recommended next action;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Write the session log:

`docs/session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md`

7. Select exactly one next action:

- `continue_m3gt_reduced4_local_training_smoke_receipt_no_brev`
- `continue_m3gt_reduced4_data_or_split_diagnosis_no_training`
- `escalate_openai_or_gpt_pro_strategy_with_m3gp_m3gq_m3gr_m3gs_evidence`
- `stop_for_human_training_budget_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GS.
2. Required baseline checks pass or exact blockers are recorded.
3. M3GR train-fit evidence and M3GQ reduced4 manifest evidence are inspected.
4. The receipt separates what M3GR proves from what it does not prove.
5. Future options are evaluated without performing them.
6. A tracked M3GS receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   promotion, browser activation, source/media import, research API call,
   final-gate change, or pretrained shortcut occurs.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training triage only.
- Existing approved local artifacts only.
- Do not run another micro-overfit, local training smoke, evaluator, browser
  smoke, export, or research call in this mission.
- Do not inspect raw learner media, import new datasets, broaden labels, or
  mutate source-register rights.
- Do not promote a model card, activate browser recognition, or claim final
  readiness.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor writes the scoped result triage, preserves
  fail-closed claims, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses the proves/does-not-prove split, ignored-output
  hashes, option tradeoffs, forbidden-action proof, claim-surface proof, or
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
memorization, but not held-out quality or product readiness.

Completed: M3GQ reduced4 manifests; M3GR dataloader and tiny train-fit
preflight.

Evidence: M3GQ receipt/log, M3GR receipt/log, ignored M3GR output JSON if
present, fail-closed claim surfaces, and read-only Brev state.

Remaining: decide the next smallest evidence step without overclaiming the
tiny train-fit result.

Blockers: stop if the next action requires human budget, source/privacy, claim,
promotion, final-submission, or broad-scope approval.

Next step: write the M3GS reduced4 trainability result triage.
