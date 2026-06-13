# Return-To-Form M3FN Deadline Fail-Closed Demo Finish Goal Loop Prompt

Mission 3FN prompt for the Codex executor after observer 584 stopped the ML
lane for human model-strategy review and the user explicitly prioritized
finishing the project before the deadline.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Finish the strongest honest ASL Pilot demo package under the fail-closed
recognition constraint. The immediate goal is not another recognizer attempt;
it is a shippable browser-first learning app with current validation evidence,
clear no-recognition claims, and one bounded product blocker fixed if current
smoke/audit work exposes one.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Observer 584 stop/escalation evidence:
   - [`docs/session-logs/584-observer-escalate-m3fm-human-model-strategy-review.md`](../session-logs/584-observer-escalate-m3fm-human-model-strategy-review.md)
   - [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
4. M3FM metric-triage evidence:
   - [`docs/session-logs/583-mission-3fm-popsign-label-ladder-metric-triage-no-training.md`](../session-logs/583-mission-3fm-popsign-label-ladder-metric-triage-no-training.md)
   - [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json)
5. Current product routes and claim surfaces:
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
6. Existing repo audits and smoke scripts under [`scripts/`](../../scripts/).

## Current Decision

M3FM and observer 584 establish that the current ML route is stopped by weak
diagnostic model evidence, not by a missing local harness repair. The user has
now prioritized finishing the project before the deadline. Therefore this
mission is authorized to resume the executor loop for fail-closed product work
only.

Browser recognition must remain locked:

- `web/public/model/model-card.json` must remain `status: "not_trained"`;
- `docs/model/active-vocabulary-claim.json` must keep `activeLabels: []`;
- no browser recognition, Detector 0 tracking authority, ASL correctness
  grading, trained-label claim, export, promotion, or model-readiness claim may
  be introduced.

## Required Slice

Complete exactly one smallest useful deadline product-finish slice.

1. Run the baseline checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

2. Inspect the current product and validation surfaces, then run the strongest
   available local smoke/audit set for the fail-closed demo:

```sh
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_practice_scope_copy_smoke.mjs
node scripts/run_practice_progress_smoke.mjs --write
node scripts/audit_practice_progress_smoke.mjs
node scripts/run_practice_camera_behavior_smoke.mjs --write
node scripts/audit_practice_camera_behavior_smoke.mjs
node scripts/run_lesson_page_smoke.mjs --write
node scripts/audit_lesson_page_smoke.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_validation_page_smoke.mjs
node scripts/audit_final_claim_matrix.mjs
node scripts/audit_no_raw_video_upload.mjs
npm --prefix web run typecheck
npm --prefix web run lint
git diff --check
```

If a browser smoke cannot run because of local browser, auth, or permission
state, record the exact blocker and run the adjacent static audit. Do not hide
runtime blockers.

3. If the checks expose one small product blocker, fix exactly one bounded
   fail-closed issue, such as stale no-recognition copy, validation status
   mismatch, a broken route/navigation affordance, a local camera state issue,
   or an obvious lesson/practice layout problem. Keep the fix scoped.

4. Write a receipt:

`docs/validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json`

The receipt must record:

- current HEAD and active prompt;
- exact commands run and results;
- any smoke/audit blockers;
- files changed and why;
- fail-closed claim surfaces before and after;
- current product claim boundary;
- confirmation that ignored model outputs remain diagnostic only;
- forbidden actions intentionally not run;
- exactly one next action.

Allowed next actions:

- `continue_deadline_fail_closed_demo_finish`
- `continue_single_deadline_product_blocker_fix`
- `draft_final_fail_closed_demo_evidence_package`
- `stop_for_human_demo_acceptance_review`

5. Write a numbered session log under [`docs/session-logs/`](../session-logs/).
6. Commit only the scoped receipt, session log, and any narrow product/test
   changes from this slice.

## Hard Boundaries

- No recognizer training, fitting, evaluator rerun, checkpoint creation,
  architecture search, threshold tuning, export, model-card promotion,
  active-vocabulary promotion, or browser recognition activation.
- No Brev start/exec/sync/copy/lifecycle work and no GPU/cloud spend.
- No source-register edit, source/media import, manifest/tensor/vocabulary/
  packet mutation, generated labels, pseudo-labels, or pretrained detector/
  landmark/backbone/embedding/teacher path.
- No fake recognizer output, fake detector boxes, model confidence values,
  automatic correctness grading, ASL correctness claim, Detector 0 tracking
  claim, final-readiness claim, or product-readiness overclaim.
- No raw learner video/frame upload during normal practice.
- No push, amend, destructive reset, or broad unrelated refactor.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FN prompt and no stop sentinel is present.
2. The required baseline checks pass or record exact blockers.
3. The strongest available fail-closed product smoke/audit set has run or
   recorded exact blockers.
4. Any implementation change is limited to one bounded fail-closed product or
   validation blocker.
5. `web/public/model/model-card.json` remains `status: "not_trained"`.
6. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. The receipt and session log exist and select exactly one next action.
8. No forbidden ML, Brev, source, export, promotion, browser activation, or
   unsupported claim work occurred.

## Observer Guidance

- CONTINUE if the executor advances deadline demo evidence or fixes one
  scoped fail-closed product blocker and selects the next deadline finish
  action.
- NUDGE if required smoke/audit evidence, claim-surface proof, receipt detail,
  or next-action selection is missing.
- REDIRECT if the executor drifts back into ML/data/Brev/export/promotion work
  without a new explicit human compute/source approval.
- STOP only when the final fail-closed demo evidence package is complete or a
  real human demo-acceptance decision is unavoidable.
- ESCALATE only for a claim, privacy, or architecture decision that materially
  changes what the app may honestly present.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3FN deadline fail-closed demo finish.
Completed:            <smallest useful slice>.
Evidence:             <commands, artifacts, smoke/audit outcomes>.
Remaining:            <next deadline finish item>.
Blockers:             <none, or exact product/runtime blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
