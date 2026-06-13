# Return-To-Form Human Demo Review Goal Loop Prompt

Mission 3AG prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run a focused human-demo review pass over the reduced-claim app. The goal is to
make the current learn-only `/`, `/lesson`, and `/validation` paths coherent,
reviewable, and honest for a deadline demo without restarting ML work.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AG.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AF/M3AG and the Original Plan Spine.
4. Reduced-claim evidence:
   [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md).
5. Observer stop for human demo review:
   [`docs/session-logs/267-observer-stop-human-demo-review.md`](../session-logs/267-observer-stop-human-demo-review.md).
6. Product surfaces:
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
   - [`web/src/app/globals.css`](../../web/src/app/globals.css)
7. Model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. Existing lesson/practice audits and smoke scripts under [`scripts/`](../../scripts/).

## Intended Outcome

The repo can support a human demo review with clear boundaries:

- `/` presents practice as learn-only/local when the recognizer is not trained.
- `/lesson` is reachable and usable for demo review without suggesting live
  recognition, live tracking, or ASL correctness.
- `/validation` remains the evidence/status route.
- Camera behavior remains local-only.
- Model/tracker surfaces remain fail-closed.
- A tracked demo-review artifact records what was inspected, what changed, what
  passed, and what still requires human/content/data/cost-control action.

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_codex_pair_state.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
cd web && npm run typecheck
cd ..
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_lesson_page_smoke.mjs
brev ls --json
```

If a local smoke report is stale or missing after product edits, run the
existing smoke script rather than inventing a parallel proof. Browser or
Playwright verification is allowed for `/`, `/lesson?auth=dev`, and
`/validation`.

Then complete exactly one smallest useful demo-review slice:

1. Inspect the product paths and existing smoke evidence for demo blockers:
   misleading claim copy, unreachable routes, auth/demo friction, viewport
   layout issues, missing route links, broken local camera states, or
   validation-status confusion.
2. Make only scoped product/copy/test/doc changes needed to remove one real
   demo blocker or clarify one review surface.
3. Do not change model/tracker truth, final gates, source approvals, thresholds,
   or training state.
4. Write
   [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md)
   with the paths inspected, commands run, browser/smoke evidence, screenshots
   or smoke artifacts if available, remaining blockers, Brev state, and exactly
   one next action.
5. Write a numbered session log and commit only scoped files.

## Allowed Changes

- Copy, route affordances, lightweight UI state, or CSS fixes needed for the
  learn-only demo path.
- Audit/smoke updates that keep existing contracts aligned after scoped product
  changes.
- Validation or session-log artifacts.

## Hard Boundaries

- Do not run Detector 0 training, recognizer training, crop-normalization
  ablation, model microprobes, controlled clip-heldout evaluation, or any broad
  training/evaluation route.
- Do not use Brev for sync, SSH compute, remote training, or paid model work.
- Do not create a duplicate Brev worker.
- Do not import or approve sources.
- Do not use pretrained detectors, landmarks, backbones, embeddings,
  generated pseudo-labels, or pretrained outputs.
- Do not export ONNX, promote a model card, select product thresholds, weaken
  gates, or claim final readiness.
- Do not push.

## Technical Blocker Escalation

If a technical blocker prevents the human-demo path from being reviewed or
verified after a concrete local attempt, use `gpt-pro-research` or
`openai-api-research` before continuing with speculative implementation. Save
any research artifact under `artifacts/research/observer-*` or
`artifacts/research/mission-3ag-*`, then reduce it to one concrete local next
action.

Do not use GPT Pro merely because the project is stopped or because ML remains
unready. Use it only for a blocker that prevents this demo-review mission from
moving.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AG.
2. Return-to-form and loop-premise audits pass.
3. Lesson/practice fail-closed and no-recognition audits pass.
4. A tracked human-demo review artifact exists at
   [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md).
5. The artifact records inspected paths, commands, pass/fail evidence,
   remaining blockers, Brev state, and exactly one next action.
6. Any product changes preserve fail-closed behavior, local-only camera
   semantics, and no-pretrained boundaries.
7. No training, export, source approval, final-readiness claim, threshold
   promotion, Brev compute, duplicate worker, or push occurs.

## Next-Action Choices

Choose exactly one:

- `continue_human_demo_review`: if this slice found and fixed one bounded demo
  blocker and another bounded demo blocker remains.
- `stop_for_live_demo`: if the app is ready for the user to live-review the
  reduced demo path.
- `content_or_ux_scope_required`: if remaining work requires human-authored ASL
  content, lesson copy, demo narrative, or visual preference decisions.
- `new_data_or_source_review_required`: if further useful progress requires
  new consented data, source approval, or a changed research budget.
- `escalate_strategy_research`: if a technical blocker or plan conflict remains
  after a concrete local attempt and needs GPT/API research.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AG human demo review.
Completed:            <demo-review slice>.
Evidence:             <artifact path/hash, commands, smoke/browser evidence>.
Remaining:            <single next action>.
Blockers:             <none, or exact demo/technical/source/cost blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
