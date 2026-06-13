# Web Lessons

Stable numeric lesson ids. Never reorder or reuse ids.

## template

```md
# 1. <lesson title>

date: YYYY-MM-DD
source slice: <brief/session>
source task: `MVP_TASKS.md#task-XXX`
anchors:
- `ARCHITECTURE.md#arch-...`

## context

## gotcha / pattern

## rule

## examples

## linked files
```

# 1. NEXT_PUBLIC_* env vars are baked at build time, not runtime

date: 2026-05-24
source slice: M2 slice 5 (task-007 collection-runtime smoke) + M3b (Playwright camera-behavior smoke refresh)
source task: `MVP_TASKS.md#task-007`, `MVP_TASKS.md#task-016`
anchors:
- `ARCHITECTURE.md#arch-camera-privacy`

## context

`web/src/components/PracticeApp.tsx` reads `process.env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION === "true"`. The `/api/dataset/*` routes also gate on the same flag. Both code paths get the value baked in at `npm --prefix web run build` time.

## gotcha / pattern

A smoke harness that spawns `next start` ignores the runtime env var if the build was made without the flag. Symptom: every `/api/dataset/*` request returns `{"error": "Dataset collection is disabled by default..."}` even though the spawn child has `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`.

Conversely, the camera-behavior smoke expects the DEFAULT-safe build (flag off). Running it against a collection-mode build doesn't necessarily fail, but renders different DOM (the dataset-collection panel appears) and may shift selector behavior.

## rule

Before any smoke that spans the dataset-collection feature flag, run the explicit rebuild — and document the rebuild command in the smoke harness OR the operator runbook so the next operator doesn't burn a cycle on the same gotcha:

```sh
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true \
ENABLE_DATASET_COLLECTION=true \
  npm --prefix web run build
```

After a collection-mode smoke, a plain `npm --prefix web run build` restores the safe-posture artifact.

## examples

`docs/runbooks/first-party-collection.md` step 4 carries this command. `docs/session-logs/006-mission-2-task-006-brev-scripts.md` slice 5 records the first time this gotcha bit. `docs/session-logs/014-mission-3b-task-016-close.md` records the second time (different smoke, same root cause).

## linked files

- [`web/src/components/PracticeApp.tsx`](src/components/PracticeApp.tsx)
- [`scripts/run_dataset_collection_runtime_smoke.mjs`](../scripts/run_dataset_collection_runtime_smoke.mjs)
- [`scripts/run_practice_camera_behavior_smoke.mjs`](../scripts/run_practice_camera_behavior_smoke.mjs)
- [`docs/runbooks/first-party-collection.md`](../docs/runbooks/first-party-collection.md)


# 2. Typed PassFailDecisionOutput must be threaded all the way to the UI

date: 2026-05-24
source slice: M3a slices 1-3 + M3c
source task: `MVP_TASKS.md#task-017`, `MVP_TASKS.md#task-018`
anchors:
- `ARCHITECTURE.md#arch-inference-contract`
- `ARCHITECTURE.md#arch-passfail-thresholds`
- `ARCHITECTURE.md#arch-vocab-hints`

## context

Mission 3a created `web/src/lib/inference-engine.ts` (typed inference) + `web/src/lib/pass-fail-decision.ts` (typed verdict with `PassFailReason` enum + `hintDimension`). Mission 3a intentionally kept `evaluateLocalAttempt` in `client-model.ts` as a backward-compat wrapper that adapts the typed output back to `LocalInferenceResult` for the UI. Mission 3c then realised the typed output was bottlenecked at that adapter and had to migrate `PracticeApp.tsx` to consume `PassFailDecisionOutput` directly so the structured `reasons[]` and `hintDimension` actually reach the learner.

## gotcha / pattern

It is tempting to keep the legacy adapter forever "for compatibility". But every UI improvement that depends on the new typed fields (structured reasons rendering, hint-dimension badge, threshold visibility) requires the migration anyway. The adapter shape was a transitional bridge, not a destination.

## rule

When you split a typed module out of a procedural function, plan the call-site migration in the SAME pass — even if you commit it as a separate slice. The adapter is fine as a temporary bridge but should not be the long-term path.

## examples

`docs/session-logs/012-mission-3a-task-017-close.md` carry-forward explicitly named "PracticeApp UI migration" as deferred; M3c (`docs/session-logs/016-mission-3c-practice-decision-ui-close.md`) executed it under user redirect.

## linked files

- [`web/src/lib/inference-engine.ts`](src/lib/inference-engine.ts)
- [`web/src/lib/pass-fail-decision.ts`](src/lib/pass-fail-decision.ts)
- [`web/src/components/PracticeApp.tsx`](src/components/PracticeApp.tsx)
