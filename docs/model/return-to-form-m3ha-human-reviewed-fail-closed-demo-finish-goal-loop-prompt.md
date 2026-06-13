# Return-To-Form M3HA Human-Reviewed Fail-Closed Demo Finish Goal Loop Prompt

Mission 3HA prompt for the Codex executor after observer STOP commit `13d6795`
parked the model loop for human model-strategy review and the user explicitly
authorized this thread to perform that review.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend/no-training fail-closed deadline demo
slice. The immediate goal is not another recognizer attempt; it is to make the
browser-first ASL learning app honestly shippable with recognition locked,
current validation evidence, and one bounded product/claim blocker fixed if
current smoke/audit work exposes one.

## Human Review Decision

The human review gate is satisfied by the latest user instruction in the
current thread. The decision is:

- Stop the current autonomous recognizer/model loop for the deadline path.
- Treat M3GQ-M3GZ reduced4 work as diagnostic failure evidence only.
- Keep browser recognition fail-closed.
- Redirect executor work to the deadline fail-closed product/demo package.

This does not permanently ban future ML research. Any future model/data/input/
architecture/compute/source/promotion route requires a new explicit
human-approved strategy prompt that names the hypothesis not already falsified
by M3GQ-M3GZ.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Human review decision receipt:
   [`docs/validation/return-to-form-m3ha-human-review-decision-v1.json`](../validation/return-to-form-m3ha-human-review-decision-v1.json)
4. M3GZ stop/escalation evidence:
   - [`docs/session-logs/668-observer-stop-m3gz-human-model-strategy-review.md`](../session-logs/668-observer-stop-m3gz-human-model-strategy-review.md)
   - [`artifacts/research/observer-668-m3gz-reduced4-logit-strategy/response.md`](../../artifacts/research/observer-668-m3gz-reduced4-logit-strategy/response.md)
   - [`docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json`](../validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json)
5. Current product and claim surfaces:
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
6. Existing repo audits and smoke scripts under [`scripts/`](../../scripts/).

## Current Evidence

- M3GR proved local input wiring and tiny same-subset train-fit only.
- M3GU ran exactly one local/no-Brev reduced4 diagnostic smoke.
- M3GY reran exactly one local/no-Brev/no-training diagnostic evaluator path
  with raw-logit sidecar fields.
- M3GU/M3GY held-out metrics remained poor:
  - validation top-1 `0.26666666666666666`
  - validation macro-F1 `0.11111111111111112`
  - test top-1 `0.25`
  - test macro-F1 `0.1678321678321678`
- M3GY/M3GZ showed prediction collapse to `sad`/`uncle`, no `hello` or `white`
  predictions in validation/test, tiny logit margins, and entropy near
  four-class maximum entropy.
- The `top2_logit_label` score-field listing gap is real metadata cleanup, but
  it is not a model-quality repair and does not justify another training-style
  attempt.
- Browser/model claim surfaces remain fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"`;
  `web/public/model/detector0-card.json` is `status: "not_trained"`;
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.

## Required Slice

Complete exactly one smallest useful deadline product-finish slice.

1. Run baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3ha-human-review-decision-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git diff --check
```

2. Inspect current product and validation surfaces, then run the strongest
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

If a browser smoke cannot run because of local browser, auth, camera, or
permission state, record the exact blocker and run the adjacent static audit.
Do not hide runtime blockers.

3. If the checks expose one small product blocker, fix exactly one bounded
   fail-closed issue, such as stale no-recognition copy, validation status
   mismatch, broken route/navigation affordance, local camera state issue, or
   obvious lesson/practice layout issue. Keep the fix scoped.

4. Write a receipt:

`docs/validation/return-to-form-m3ha-human-reviewed-fail-closed-demo-finish-v1.json`

The receipt must record:

- current HEAD and active prompt;
- exact commands run and results;
- any smoke/audit blockers;
- files changed and why;
- fail-closed claim surfaces before and after;
- current product claim boundary;
- confirmation that ignored model outputs remain diagnostic only;
- read-only Brev default-off state if inspected;
- forbidden actions intentionally not run;
- exactly one next action.

Allowed next actions:

- `continue_deadline_fail_closed_demo_finish_after_m3gz`
- `continue_single_deadline_product_blocker_fix_after_m3gz`
- `draft_final_fail_closed_demo_evidence_package_after_m3gz`
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

1. `GOAL.md` points at this M3HA prompt and no stop sentinel is present.
2. The required baseline checks pass or record exact blockers.
3. The strongest available fail-closed product smoke/audit set has run or
   recorded exact blockers.
4. Any implementation change is limited to one bounded fail-closed product or
   validation blocker.
5. `web/public/model/model-card.json` remains `status: "not_trained"`.
6. `web/public/model/detector0-card.json` remains `status: "not_trained"`.
7. `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
8. The receipt and session log exist and select exactly one next action.
9. No forbidden ML, Brev, source, export, promotion, browser activation, or
   unsupported claim work occurred.

## Observer Guidance

- CONTINUE if the executor advances deadline demo evidence or fixes one scoped
  fail-closed product blocker and selects one allowed next action.
- NUDGE if required smoke/audit evidence, claim-surface proof, receipt detail,
  or next-action selection is missing.
- REDIRECT if the executor drifts back into ML/data/Brev/export/promotion work
  without a new explicit human strategy approval.
- STOP only when the final fail-closed demo evidence package is complete or a
  real human demo-acceptance decision is unavoidable.
- ESCALATE only for a claim, privacy, or architecture decision that materially
  changes what the app may honestly present.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3HA human-reviewed fail-closed demo finish.
Completed:            <smallest useful slice>.
Evidence:             <commands, artifacts, smoke/audit outcomes>.
Remaining:            <next deadline finish item>.
Blockers:             <none, or exact product/runtime blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
