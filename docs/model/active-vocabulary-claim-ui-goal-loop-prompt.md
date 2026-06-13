# Active-Vocabulary-Claim UI Plumbing Goal Loop Prompt

Interim mission 3e of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first.

## Mission

Plumb [`docs/model/active-vocabulary-claim.json`](../model/active-vocabulary-claim.json) through the browser so the practice UI is honest about which prompts are gradeable once a trained model lands. Today `activeLabels` is always `[]` (rawframe-not-trained), so the visible effect is "every prompt shows a `Content-only` badge". The plumbing future-proofs the UI for the trained-model handoff.

## Source Of Truth

1. [`GOAL.md`](../../GOAL.md) and `interim mission 3e` block.
2. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially [`#arch-active-module`](../../ARCHITECTURE.md#arch-active-module): "the UI must not ask the model to pass/fail a sign outside `ModelManifest.activeLabels`".
3. [`docs/model/active-vocabulary-claim.json`](../model/active-vocabulary-claim.json) — the file we are now exposing to the client.
4. [`scripts/audit_downstream_vocabulary_provenance.mjs`](../../scripts/audit_downstream_vocabulary_provenance.mjs) — already enforces schema_version + lane + modelVersion invariants; the new API route should serve a file that continues to pass this audit.
5. Existing client-model pattern: [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts) `loadModelCard()` — the new fetch should mirror its shape (default fallback when fetch fails).

## Acceptance Criteria

All four must be true:

1. **API route exists** at `web/src/app/api/model/active-vocabulary-claim/route.ts`. Returns the JSON contents of `docs/model/active-vocabulary-claim.json`, with `Cache-Control: no-store`. Errors return JSON `{ error: <message> }` with a 5xx status.
2. **PracticeApp boot fetches the claim** alongside `loadModelCard`. Result stored in component state as `activeVocabularyClaim`. `submitAttempt()` then derives `activeLabels` from `claim.activeLabels[]` (canonical source), with `[]` fallback when the fetch fails OR `modelVersion === "rawframe-not-trained"`. Old `deriveActiveLabels(modelCard)` path is deleted (or kept as a private fallback if a trained card lands before claim plumbing — but for now claim is authoritative).
3. **Content-only badge rendered** per vocabulary item in the prompt picker when `selectedItem.id` is not in `activeLabels`. Badge text passes the existing diagnostic-language regex in `audit_hint_pedagogy_review.mjs` (no "wrong", "incorrect", second-person verbs, etc.).
4. **Full no-regression chain green**: lint, typecheck, build, the four static audits, browser-onnx wiring smoke + audit, practice-progress smoke + audit, practice-camera-behavior smoke + audit.

## Forbidden Tactics

- No first-party collection, Brev work, training, or model-card promotion.
- No edits to `web/public/model/model-card.json`.
- No new dependencies; no parallel test runner.
- No diagnostic-language UI copy.

## Suggested Execution Order

1. Inspect the current `deriveActiveLabels` path in `PracticeApp.tsx` and the existing model-card-loading route at `web/src/app/api/ort/` for a Next.js pattern.
2. Add `web/src/app/api/model/active-vocabulary-claim/route.ts` (GET handler, reads the JSON, returns it).
3. Add `loadActiveVocabularyClaim()` helper alongside `loadModelCard()` in `client-model.ts` so PracticeApp doesn't `fetch()` directly.
4. Boot fetch in PracticeApp; thread `activeLabels` from the claim into `submitAttempt()`.
5. Add badge rendering in the prompt picker.
6. Run validation chain.
7. Write session log + commit.

## Handoff

When all four criteria are met, redirect GOAL.md `current mission` to interim mission 3f (`REASON_COPY` audit extension) and continue.
