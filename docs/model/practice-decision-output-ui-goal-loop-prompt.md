# Practice Decision Output UI Goal Loop Prompt

Interim mission 3c of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first for the operating contract; this file scopes the practice result UI rewire.

## Mission

While mission 3 (first Brev training round) is paused on human first-party clip collection, finish the task-017 / task-018 carry-forward that mission 3a intentionally deferred: migrate the real practice UI from the legacy `LocalInferenceResult` adapter to the typed `PassFailDecisionOutput` contract and expose structured feedback (`reasons[]`, `hintDimension`) to the learner/operator.

This mission is **browser practice UI / decision-contract integration**. Do not collect data, run Brev, train a model, promote a model card, edit `web/public/model/model-card.json`, add dependencies, or create a parallel validation lane.

## Source Of Truth

1. User's latest explicit instructions.
2. [`GOAL.md`](../../GOAL.md), especially `current mission`, `exit condition`, and hard requirements.
3. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially [`#arch-inference-contract`](../../ARCHITECTURE.md#arch-inference-contract), [`#arch-passfail-thresholds`](../../ARCHITECTURE.md#arch-passfail-thresholds), [`#arch-vocab-hints`](../../ARCHITECTURE.md#arch-vocab-hints), [`#arch-learner-flow`](../../ARCHITECTURE.md#arch-learner-flow), and [`#arch-camera-privacy`](../../ARCHITECTURE.md#arch-camera-privacy).
4. [`MVP_TASKS.md`](../../MVP_TASKS.md) `task-017`, `task-018`, and `task-019` rows + detailed sections.
5. Mission 3a close log: [`docs/session-logs/012-mission-3a-task-017-close.md`](../session-logs/012-mission-3a-task-017-close.md).
6. Current implementation: [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx), [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts), [`web/src/lib/inference-engine.ts`](../../web/src/lib/inference-engine.ts), [`web/src/lib/pass-fail-decision.ts`](../../web/src/lib/pass-fail-decision.ts), [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts).

## Current Blocker

Mission 3a created the typed inference and pass/fail modules, but the production UI still uses the legacy wrapper:

- `PracticeApp.tsx` imports `LocalInferenceResult` and `evaluateLocalAttempt()` from `client-model.ts`.
- `result` state is `LocalInferenceResult | null`.
- `AttemptResult` renders only `result.hint`, `confidence`, and model status; `PassFailDecisionOutput.reasons[]` and `hintDimension` are not visible.
- `client-model.ts` explicitly says `evaluateLocalAttempt()` stays for `PracticeApp.tsx` until the UI rewire lands.

Close that gap without changing the training/model claim.

## Intended Outcome

The learner-facing practice result is driven by the same typed decision object the architecture now defines. The UI can show why an attempt failed or stayed fail-closed, and can label a structured hint dimension when one exists, while persistence remains compatible with the existing `/api/attempts` schema.

## Acceptance Criteria

All criteria must be true:

1. `PracticeApp.tsx` no longer stores `LocalInferenceResult` as its result state and no longer calls `evaluateLocalAttempt()` as its primary attempt evaluator. It composes `browserInferenceEngine` + `decide()` directly, or uses a narrowly named helper that returns `PassFailDecisionOutput`.
2. The result panel displays:
   - pass/fail status,
   - selected vocabulary label,
   - `decision.hint`,
   - `decision.reasons[]` in readable, non-diagnostic copy,
   - `decision.hintDimension` when non-null.
3. Attempt persistence remains API-compatible. The `/api/attempts` POST body still includes `vocabularyId`, `passed`, `confidence`, `predictedId`, `modelId`, `modelStatus`, `hint`, `reason`, `durationMs`, and `frameCount`.
4. Privacy and claim boundaries are unchanged: raw frames/video are never uploaded; the model card remains `not_trained`; no model promotion occurs; `activeLabels` is empty while the model is `not_trained` and derives from trained model-card labels only when available.
5. Existing static checks pass:
   ```sh
   npm --prefix web run lint
   npm --prefix web run typecheck
   npm --prefix web run build
   node scripts/audit_practice_screen_contract.mjs
   node scripts/audit_hint_pedagogy_review.mjs
   node scripts/audit_no_raw_video_upload.mjs
   node scripts/audit_no_pretrained_deps.mjs
   node scripts/audit_no_pretrained_artifact_json.mjs
   ```
6. Existing runtime smokes pass after the UI change:
   ```sh
   node scripts/run_browser_onnx_wiring_smoke.mjs --write
   node scripts/audit_browser_onnx_wiring_smoke.mjs
   node scripts/run_practice_progress_smoke.mjs --write
   node scripts/audit_practice_progress_smoke.mjs
   node scripts/run_practice_camera_behavior_smoke.mjs --write
   node scripts/audit_practice_camera_behavior_smoke.mjs
   ```
7. `MVP_TASKS.md` is updated to reflect the new truth for task-017, task-018, and task-019, and a numbered session log under [`docs/session-logs/`](../session-logs/) records changed files, exact commands, exit statuses, refreshed report paths/hashes, and carry-forward blockers.

## Allowed Tactics

- Touch `web/src/components/PracticeApp.tsx`, `web/src/lib/client-model.ts`, `web/src/lib/inference-engine.ts`, and `web/src/lib/pass-fail-decision.ts` only as needed for the typed decision flow.
- Keep `evaluateLocalAttempt()` exported for compatibility if other callers still need it, but the practice UI should stop depending on it as the main path.
- Use `toLegacyResult()` or an explicit boundary mapper only for the persistence payload if that keeps `/api/attempts` stable.
- Extend an existing `scripts/audit_*.mjs` or `scripts/run_*_smoke.mjs` check if needed to retain evidence for the visible structured-feedback behavior. Do not add a new test framework.
- Keep UI changes small and work-focused: result panel copy, badges/labels, and typed state are in scope; broad redesign is not.

## Forbidden Tactics

- No first-party collection, Brev work, training, model-card promotion, or edits to `web/public/model/model-card.json`.
- No raw frame/video upload or persistence in normal practice.
- No pretrained CV/sign/landmark/model dependency.
- No diagnostic-language hints that claim what the learner did wrong.
- No new dependencies and no parallel test runner.
- No hard-coded active-label claim. Active labels must remain empty until a trained model card supplies label support.

## Suggested Execution Order

1. Inspect `PracticeApp.tsx` result state, `submitAttempt()`, and `AttemptResult`.
2. Add the smallest typed decision path so `submitAttempt()` produces `PassFailDecisionOutput` and enough model metadata for persistence.
3. Update `AttemptResult` to render structured reasons and optional hint-dimension copy without diagnostic phrasing.
4. Preserve the `/api/attempts` payload shape and privacy boundary.
5. Run lint/typecheck/build and the static audits.
6. Run the three retained runtime smoke/audit pairs: browser ONNX wiring, practice progress, and practice camera behavior.
7. Update `MVP_TASKS.md`, write the session log, and commit one reviewable slice using the standard heredoc template.

## Handoff

When all acceptance criteria are met, transition to awaiting-observer with reason `exit-condition-met` and observer_focus `roll-mission-forward`. The observer can then decide whether any non-training work remains or whether to STOP for human first-party collection.
