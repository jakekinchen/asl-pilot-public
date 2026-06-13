# Return-To-Form M3GU Reduced4 Local Training Smoke No Brev Goal Loop Prompt

Mission 3GU prompt for the Codex executor after M3GT recorded the command
contract for a future reduced4 local training smoke.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run at most one local/no-remote/no-Brev reduced4 diagnostic training smoke, but
only after proving a reduced4-specific region-preserving train/eval guard.
If that guard cannot be added or verified with a small scoped change, do not
fit; record the blocker and route to no-training diagnosis or human review.

This mission may make minimal implementation/test changes needed for the
reduced4 guard and command surface. It must not use Brev, import source/media,
export, promote, activate browser recognition, change final gates, or expand
claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GT receipt:
   - [`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`](../validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json)
   - [`docs/session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md`](../session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md)
5. M3GS/M3GR/M3GQ evidence:
   - [`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](../validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](../validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
   - ignored `output/m3gr-reduced4-local-micro-overfit-preflight/*.json`, if present locally
6. Existing train/eval command surfaces and tests.
7. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one reduced4 local-smoke slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

2. Add or verify the reduced4 guard before fitting:

   - it accepts only the three M3GQ reduced4 manifest paths and hashes;
   - it requires `rgb_regions_grid_v1` and preserves the region axis through
     `B,T,R,C,H,W`;
   - it records `rgb_frames_fallback_used: false` or equivalent provenance;
   - it emits `pretrained_components: []` and random-initialization evidence;
   - it fails if `output/m3gu-reduced4-local-training-smoke` or expected output
     files already exist;
   - it keeps all outputs under the ignored namespace
     `output/m3gu-reduced4-local-training-smoke`;
   - the eval/report path accepts the four-label reduced4 diagnostic route
     without weakening final or lesson gates.

3. Run a no-training preflight/dry-run that proves the guard. If the guard
cannot be satisfied with a small scoped change, do not fit. Write the receipt
and select a no-training diagnosis, escalation, or stop action.

4. If and only if the guard passes, run exactly one capped local training smoke
using the M3GT caps:

   - local only; no Brev, no remote, max spend `$0`;
   - seed `20260529`;
   - max runtime 20 minutes total;
   - max epochs 3;
   - batch size 4;
   - max train batches 12;
   - max validation batches 4;
   - `num_workers: 0`;
   - augmentation `none`;
   - output namespace `output/m3gu-reduced4-local-training-smoke`.

5. If a checkpoint is produced by that single smoke, run at most one local
diagnostic evaluation/report over the same reduced4 train/validation/test
manifests. Do not rerun to improve metrics or recover missing fields.

6. Write the tracked receipt:

`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- guard proof before fitting, or exact guard blocker if no fitting occurred;
- Brev read-only/default-off state;
- M3GT command contract fields used;
- training command, caps, seed, runtime, output namespace, and hashes if run;
- evaluation/report command and diagnostic metrics if run;
- train sanity, validation/test top-1 and macro-F1, per-label recall,
  zero-recall labels, confusion matrices, and absent negative/false-pass
  evidence if no reduced4 negative challenge exists;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- `pretrained_components: []`;
- exactly one next action.

7. Write the session log:

`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`

8. Select exactly one next action:

- `continue_m3gv_reduced4_smoke_metric_triage_no_brev`
- `continue_m3gv_reduced4_guard_or_data_split_diagnosis_no_training`
- `escalate_openai_or_gpt_pro_strategy_with_m3gq_m3gr_m3gs_m3gt_m3gu_evidence`
- `stop_for_human_training_budget_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GU.
2. Required baseline checks pass or exact blockers are recorded.
3. The reduced4 region-preserving train/eval guard is proven before fitting, or
   the receipt records why fitting was not run.
4. If fitting occurs, exactly one local/no-Brev reduced4 smoke and at most one
   local diagnostic evaluation/report are run under the M3GT caps.
5. A tracked M3GU receipt and numbered session log exist.
6. Claim surfaces remain fail-closed and unpromoted.
7. No Brev lifecycle/remote/spend, source/media import, raw-video inspection,
   browser activation, export, promotion, final-gate change, claim expansion,
   broad-label run, second seed, rerun-for-metrics, or pretrained shortcut
   occurs.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev only.
- Existing approved local reduced4 artifacts only.
- Implementation changes must be the smallest guard/command-surface/test
  changes needed for this reduced4 smoke.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor proves the guard, runs at most one capped local
  diagnostic smoke/eval when authorized by the guard, preserves fail-closed
  claims, keeps Brev read-only/default-off, and selects one bounded next
  action.
- NUDGE if the receipt misses guard proof, command exit status, metrics,
  forbidden-action proof, claim-surface proof, or exactly one next action.
- REDIRECT if the executor fits without the guard, uses generic small-label
  `rgb_frames` authority, weakens gates, exports, promotes, activates browser
  recognition, imports source/media, calls research APIs, or expands claims.
- STOP if the selected next action requires human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the smoke fails after guard proof and the next proposal changes
  architecture/input strategy or repeats training without a current strategy
  memo.

## Progress Ledger

Current state: M3GT recorded the future reduced4 smoke contract and found that
existing generic small-label smoke authority is not acceptable for this route.

Completed: M3GQ reduced4 manifests; M3GR reduced4 local input wiring and tiny
train-fit preflight; M3GS trainability triage; M3GT command/cap receipt.

Evidence: M3GT receipt/log, M3GS receipt/log, M3GR receipt/log, M3GQ
receipt/log and manifests, fail-closed claim surfaces, and read-only Brev
state.

Remaining: prove the reduced4 region-preserving guard, then run at most one
local diagnostic smoke only if the guard passes.

Blockers: do not fit if the guard cannot be satisfied, if Brev/remote is
required, if outputs already exist, or if claim/source/pretrained boundaries
drift.

Next step: execute the M3GU reduced4 local training smoke route under the guard.
