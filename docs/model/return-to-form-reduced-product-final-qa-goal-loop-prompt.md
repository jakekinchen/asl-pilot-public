# Return-To-Form Reduced Product Final QA Goal Loop Prompt

Mission 3AI prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Finish the strongest honest reduced ASL Pilot demo package after Mission 3AH
proved that the current PopSign-only Tier 0 ML lane is not promotable. Continue
only product, claim, validation, and handoff work that preserves the
`not_trained` browser-model truth. Do not restart recognizer, Detector 0,
source-import, model-card-promotion, or Brev-training work unless the user
explicitly selects a new data/source scope.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AI.
3. Mission 3AH data decision:
   [`docs/validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json`](../validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json).
4. Mission 3AH CUDA recognizer evidence:
   [`docs/validation/return-to-form-overnight-tier0-cuda-recognizer-v1.json`](../validation/return-to-form-overnight-tier0-cuda-recognizer-v1.json).
5. Mission 3AH observer stop:
   [`docs/session-logs/278-observer-stop-human-data-source-scope-decision.md`](../session-logs/278-observer-stop-human-data-source-scope-decision.md).
6. Current reduced-product evidence:
   - [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md)
   - [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
7. Product routes:
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
8. Model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
9. Existing audit and smoke scripts under [`scripts/`](../../scripts/).

## Current Decision

The ML promotion lane is parked by evidence, not by process confusion:

- Mission 3AH trained a full-split Tier 0 CUDA recognizer from random
  initialization, but it did not clear held-out or negative-challenge gates.
- Mission 3AH selected `stop_with_reduced_claim` and
  `stop_for_human_data_source_scope_decision`.
- The current Tier 0 signs remain reduced-demo lesson vocabulary, not promoted
  recognizer evidence.
- The product may continue as a learn-only demo. It must not claim ASL
  correctness evaluation, live Detector 0 tracking, active CV-supported labels,
  final readiness, or browser recognition.

## Milestone Path

Follow these milestones in order. Do not invent a new milestone on the fly.

### 3AI-A Validation Status Refresh

Make `/validation` and both claim-matrix JSON files reflect the latest M3AH
state:

- latest state is Mission 3AI reduced product final QA;
- M3AH CUDA recognizer ran and failed promotion;
- M3AH data/vocabulary decision selected reduced claim plus data/source scope
  decision before any further ML;
- browser model remains `not_trained`;
- active CV labels remain empty;
- learn-only vocabulary remains available for demo/lesson scaffolding.

If the current generator already says all of this, write a receipt proving it.
Otherwise update the smallest generator/route/docs surface needed, then
regenerate claim matrices through the existing script.

### 3AI-B Product Smoke Refresh

Run or refresh the existing product checks for `/`, `/lesson`, and
`/validation`. Prefer existing scripts:

```sh
node scripts/run_lesson_page_smoke.mjs --write
node scripts/audit_lesson_page_smoke.mjs
node scripts/run_practice_progress_smoke.mjs --write
node scripts/audit_practice_progress_smoke.mjs
node scripts/run_practice_camera_behavior_smoke.mjs --write
node scripts/audit_practice_camera_behavior_smoke.mjs
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_final_claim_matrix.mjs
```

If a smoke is unavailable because local browser permissions or auth fixtures are
missing, record the exact blocker and run the adjacent static audit instead.

### 3AI-C One Demo Blocker Fix

If the smoke refresh or code inspection finds a bounded product blocker, fix
exactly one:

- stale or misleading copy;
- route navigation issue;
- local camera state issue;
- lesson/robot fail-closed wording issue;
- validation status mismatch;
- obvious mobile/desktop layout break visible in smoke or screenshots.

Do not add fake recognizer output, fake detector boxes, model-confidence
numbers, or avatar tracking claims.

### 3AI-D Final Reduced-Demo Evidence Package

Write a final reduced-demo receipt under `docs/validation/` with:

- inspected paths and hashes;
- exact commands run;
- smoke/audit outcomes;
- current unsupported model claims;
- current Brev status and the recorded stop blocker;
- the next human choices: accept reduced demo, choose data/source collection,
  authorize provider action for Brev, or change scope.

## First Reviewable Slice

Start with **3AI-A Validation Status Refresh**. Complete one smallest useful
slice:

1. Inspect `scripts/audit_final_claim_matrix.mjs`,
   `web/src/app/validation/page.tsx`, and the current claim matrices.
2. Update only the smallest claim/status surface needed so `/validation`
   reflects M3AH and Mission 3AI truth without changing model-card status.
3. Run:

```sh
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_final_claim_matrix.mjs --write
node scripts/audit_final_claim_matrix.mjs
npm run typecheck
npx eslint src/app/validation/page.tsx
```

Run commands from repo root except `npm`/`npx`, which should run from
[`web/`](../../web).

4. Write a numbered session log.
5. Commit only scoped files.

## Acceptance Criteria

Mission 3AI is complete only when:

1. `GOAL.md` points at this prompt and names Mission 3AI.
2. `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_source_register.mjs`,
   `node scripts/audit_no_pretrained_deps.mjs`, and
   `node scripts/audit_no_pretrained_artifact_json.mjs` exit 0.
3. `/validation` and both claim matrices reflect M3AH's failed-promotion
   evidence and Mission 3AI's reduced-product QA state.
4. The active browser model remains fail-closed:
   `model-card.status=not_trained`, browser recognition disabled, Detector 0
   tracking disabled, and active CV labels empty.
5. `/`, `/lesson`, and `/validation` have current smoke/static evidence or a
   precise recorded runtime blocker.
6. Any product changes preserve local-only camera semantics and do not upload
   raw learner video.
7. No pretrained CV/sign/landmark/model dependency is introduced.
8. No source approval/import, recognizer training, Detector 0 training, ONNX
   export, model-card promotion, threshold promotion, final-readiness claim,
   Brev spend, worker delete/reset, destructive reset, amend, push, or
   `git add -A` occurs.
9. Brev is treated as a recorded cost-control blocker unless the user
   explicitly approves provider-level action. Do not repeat stop attempts every
   loop just to rediscover the same `RUNNING` state; cite the latest recorded
   blocker unless a remote command is newly planned.
10. A final reduced-demo evidence package exists or the observer records the
    exact remaining product blocker.

## Observer Guidance

The observer should judge progress against the milestone path above. It should:

- CONTINUE when the executor advances the next listed milestone with evidence;
- NUDGE if a product check is missing but the slice is otherwise in scope;
- REDIRECT if the executor drifts back into ML/data/source work;
- STOP only when the final reduced-demo evidence package is complete or a real
  human decision is unavoidable;
- ESCALATE only for a concrete technical decision that could change the product
  claim or architecture.

Do not ask the observer to invent the next milestone. The next milestone is the
first incomplete item in the Milestone Path.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AI reduced product final QA.
Completed:            <smallest useful slice>.
Evidence:             <commands, artifacts, hashes, smoke/audit outcomes>.
Remaining:            <next milestone item>.
Blockers:             <none, or exact product/source/cost-control blocker>.
Next step:            <single next action from the Milestone Path>.
Checkpoint commit:    <commit hash>.
```
