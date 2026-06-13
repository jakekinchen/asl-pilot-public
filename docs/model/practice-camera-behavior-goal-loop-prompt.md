# Practice Camera Behavior Goal Loop Prompt

Interim mission 3b of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first for the operating contract; this file scopes the camera behavior evidence gate.

## Mission

Close `task-016`'s retained Playwright evidence gap for the real practice UI camera flow while mission 3 remains paused on human first-party clip collection. The goal is a current, passing `docs/validation/practice-camera-behavior-smoke.json` plus audits that prove camera success, permission/error states, result/hint/retry controls, next prompt, and saved progress.

This is browser behavior and evidence hardening. Do not collect data, train a model, promote a model card, add a new test framework, or create a parallel validation lane.

## Source Of Truth

1. User's latest explicit instructions.
2. [`GOAL.md`](../../GOAL.md), especially `current mission`, `exit condition`, and hard requirements.
3. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially [`#arch-camera-privacy`](../../ARCHITECTURE.md#arch-camera-privacy), [`#arch-learner-flow`](../../ARCHITECTURE.md#arch-learner-flow), [`#arch-inference-contract`](../../ARCHITECTURE.md#arch-inference-contract), and [`#arch-passfail-thresholds`](../../ARCHITECTURE.md#arch-passfail-thresholds).
4. [`MVP_TASKS.md`](../../MVP_TASKS.md) `task-016` row and detailed section.
5. [`docs/strategy-confidence-audit.md`](../strategy-confidence-audit.md) hard gate "Runtime camera UI drift".
6. Existing validation lane: [`scripts/run_practice_camera_behavior_smoke.mjs`](../../scripts/run_practice_camera_behavior_smoke.mjs), [`scripts/audit_practice_camera_behavior_smoke.mjs`](../../scripts/audit_practice_camera_behavior_smoke.mjs), [`scripts/audit_browser_compatibility.mjs`](../../scripts/audit_browser_compatibility.mjs), [`scripts/audit_practice_screen_contract.mjs`](../../scripts/audit_practice_screen_contract.mjs).
7. Practice UI and browser model path: [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx), [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts), [`web/src/lib/pass-fail-decision.ts`](../../web/src/lib/pass-fail-decision.ts).

## Current Blocker

The observer found the retained report stale and failing:

- `docs/validation/practice-camera-behavior-smoke.json` has `status: "failed"` from 2026-05-22, empty `checks`, empty `source_files`, and a Playwright timeout waiting for `getByRole("button", { name: "Create account" })`.
- `node scripts/audit_practice_camera_behavior_smoke.mjs` fails against that retained report.
- `node scripts/run_practice_camera_behavior_smoke.mjs` currently fails in non-writing mode with the same Create account button timeout.

Start there. Determine whether the problem is stale selectors, authentication UI drift, server/store setup, or a real practice-flow regression. Fix the smallest surface that makes the existing smoke lane truthful.

## Intended Outcome

`task-016` is no longer "DONE; Playwright evidence missing." The repo has a current retained camera behavior report, an audit that verifies it, static camera/browser audits that still pass, and a session log that records exact commands, hashes, and blockers.

## Acceptance Criteria

All criteria must be true:

1. `node scripts/run_practice_camera_behavior_smoke.mjs --write` exits 0 and refreshes [`docs/validation/practice-camera-behavior-smoke.json`](../validation/practice-camera-behavior-smoke.json) with `status: "passed"`.
2. The retained report contains passed checks for `authenticated_practice_ui`, `camera_success_attempt_result_and_progress`, `next_prompt_action`, `camera_denied`, `camera_missing`, `camera_unsupported`, and `camera_generic_error`.
3. `node scripts/audit_practice_camera_behavior_smoke.mjs` exits 0 and validates exact camera-state copy, source-file hashes, Playwright metadata, and isolated-store evidence.
4. `node scripts/audit_browser_compatibility.mjs` and `node scripts/audit_practice_screen_contract.mjs` exit 0.
5. No regression chain passes:
   - `npm --prefix web run lint`
   - `npm --prefix web run typecheck`
   - `npm --prefix web run build`
   - `node scripts/run_browser_onnx_wiring_smoke.mjs --write && node scripts/audit_browser_onnx_wiring_smoke.mjs`
   - `node scripts/run_practice_progress_smoke.mjs --write && node scripts/audit_practice_progress_smoke.mjs`
   - `node scripts/audit_no_raw_video_upload.mjs`
   - `node scripts/audit_no_pretrained_deps.mjs`
   - `node scripts/audit_no_pretrained_artifact_json.mjs`
6. [`MVP_TASKS.md`](../../MVP_TASKS.md) `task-016` top row and detailed section reflect the current truth: evidence complete, or a concrete blocker if completion fails.
7. A numbered session log under [`docs/session-logs/`](../session-logs/) records changed files, command exits, report path + SHA-256, and any carry-forward.

## Allowed Tactics

- Update the existing camera behavior smoke script if selectors or setup no longer match the real UI.
- Update `PracticeApp.tsx` only if the smoke reveals a real user-facing camera-state or auth/practice-flow regression.
- Keep changes focused on `task-016` evidence. If `PassFailDecisionOutput` UI migration or active-label plumbing becomes tempting, record it as carry-forward instead of expanding this mission.
- Use the existing `node scripts/audit_*.mjs` / `node scripts/run_*_smoke.mjs` validation lane.

## Forbidden Tactics

- No new dependencies and no parallel test runner.
- No first-party collection, Brev work, training, model-card promotion, or edits to `web/public/model/model-card.json`.
- No raw video upload or persistence in normal practice.
- No pretrained CV/sign/landmark/model dependency.
- No broad UI redesign. Fix evidence and real camera-flow regressions only.

## Suggested Execution Order

1. Reproduce the current blocker with `node scripts/run_practice_camera_behavior_smoke.mjs` and inspect the actual auth/practice UI selectors.
2. Fix the smallest stale-selector, setup, or UI regression behind the Create account timeout.
3. Run `node scripts/run_practice_camera_behavior_smoke.mjs --write`.
4. Run `node scripts/audit_practice_camera_behavior_smoke.mjs`, then the static browser/practice audits.
5. Run the no-regression chain from the acceptance criteria.
6. Update `MVP_TASKS.md` and write the session log.
7. Commit the reviewable slice using the standard heredoc template.

## Handoff

When all acceptance criteria are met, transition to awaiting-observer with reason `exit-condition-met` and observer_focus `roll-mission-forward`. The observer can then pick the next non-training move or stop for human first-party collection.
