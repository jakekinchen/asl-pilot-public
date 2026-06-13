# Browser Inference Refactor Goal Loop Prompt

Interim mission 3a of the autonomous workflow. Active per-milestone prompt referenced from [`GOAL.md`](../../GOAL.md). Read [`GOAL.md`](../../GOAL.md) first for the operating contract; this file scopes the refactor.

## Mission

While mission 3 (first Brev training round) is paused on human first-party clip collection, refactor the browser inference path so the next training pass lands into a clean typed contract, and so the `SIGN_HINT_METADATA` registry from mission 2 (`fc97d9e`) can be consumed by the hint engine.

This mission is **pure code refactor** in `web/src/lib/` — no first-party data, no Brev, no training. The current procedural `evaluateLocalAttempt()` in [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts) becomes a thin wrapper that composes a new `InferenceEngine` (raw inference) and a new `PassFailDecision` (verdict + hint).

## Source Of Truth

1. User's latest explicit instructions.
2. [`GOAL.md`](../../GOAL.md) operating contract.
3. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially [`#arch-inference-contract`](../../ARCHITECTURE.md#arch-inference-contract), [`#arch-passfail-thresholds`](../../ARCHITECTURE.md#arch-passfail-thresholds), [`#arch-vocab-hints`](../../ARCHITECTURE.md#arch-vocab-hints), [`#arch-active-module`](../../ARCHITECTURE.md#arch-active-module).
4. [`MVP_TASKS.md`](../../MVP_TASKS.md) `task-017` row.
5. Current file: [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts).
6. Mission 2 hint registry: [`web/src/lib/sign-hint-metadata.json`](../../web/src/lib/sign-hint-metadata.json), exported from [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts) as `SIGN_HINT_METADATA` and `getSignHintMetadata`.

## Refactor Scope

### New types and modules

- **`InferenceEngine`** — at `web/src/lib/inference-engine.ts`. Pure inference contract:
  ```ts
  interface InferenceEngine {
    load(modelCard: ModelCard): Promise<LoadedModel>;
    predict(loaded: LoadedModel, frames: FrameSample[]): Promise<InferenceResult>;
  }
  type InferenceResult = {
    modelId: string;
    modelStatus: "not_trained" | "trained";
    logits: Float32Array | null;          // null when modelStatus !== "trained"
    predictedId: string | null;
    confidence: number;
    predictedTopK: Array<{ labelId: string; confidence: number }>;
    inputShape: number[];
    latencyMs: number;
  };
  ```

- **`PassFailDecision`** — at `web/src/lib/pass-fail-decision.ts`. Pure decision module:
  ```ts
  type PassFailReason =
    | "model_not_trained"
    | "insufficient_frames"
    | "low_luma"
    | "low_contrast"
    | "inactive_label"
    | "class_mismatch"
    | "confidence_below_threshold"
    | "inference_error";
  type FrameQualitySummary = {
    sampleCount: number;
    averageLuma: number;
    averageContrast: number;
  };
  type PassFailDecisionInput = {
    expected: VocabularyItem;
    frames: FrameSample[];
    modelCard: ModelCard;
    activeLabels: string[]; // empty array means "no active model" (current state)
    inference: InferenceResult | null; // null when we short-circuit before inference
    inferenceError?: unknown;
  };
  type PassFailDecisionOutput = {
    passed: boolean;
    reasons: PassFailReason[];
    threshold: number;
    hint: string;
    quality: FrameQualitySummary;
  };
  function decide(input: PassFailDecisionInput): PassFailDecisionOutput;
  ```

- **Hint resolution** — inside `pass-fail-decision.ts`. When `reasons[]` contains a structured dimension (the six in [`#arch-vocab-hints`](../../ARCHITECTURE.md#arch-vocab-hints): handshape, movement, location, orientation, timing, framing), look up `getSignHintMetadata(expected.id)?.[dimension]`. If found, use it; otherwise fall back to `expected.coachingHint`. Never invent diagnostic text — hints are descriptive of the canonical sign, not the learner's attempt.

### Backward-compatibility wrapper

`evaluateLocalAttempt(expected, frameSamples, modelCard)` stays exported from `client-model.ts` with its current signature returning `LocalInferenceResult`. It internally:

1. Calls `InferenceEngine.load(modelCard)` (or skips when `modelCard.status !== "trained"`).
2. Calls `InferenceEngine.predict(loaded, frames)` when applicable.
3. Calls `decide(...)` with the result.
4. Adapts the `PassFailDecisionOutput` back to the legacy `LocalInferenceResult` shape so `PracticeApp.tsx` does not need to change in this slice.

## Exit Condition

All four (mirroring `GOAL.md`):

1. `InferenceEngine` interface and implementation exist at `web/src/lib/inference-engine.ts`.
2. `PassFailDecision` module exists at `web/src/lib/pass-fail-decision.ts`.
3. Hint metadata integration: structured-dimension reasons resolve to `SIGN_HINT_METADATA[id][dimension]` when available; fall back to `coachingHint`.
4. No regression in lint / typecheck / build / practice-progress smoke / no-pretrained audits / browser-onnx wiring smoke.

## Validation Chain

```sh
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/run_browser_onnx_wiring_smoke.mjs --write
node scripts/audit_browser_onnx_wiring_smoke.mjs
node scripts/run_practice_progress_smoke.mjs --write
node scripts/audit_practice_progress_smoke.mjs
```

## Tactics Allowed

- Touch only files under `web/src/lib/` and a tiny session-log + MVP_TASKS update per slice. Do not edit [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx) in this mission — the backward-compat wrapper keeps it working unchanged.
- Re-export new types from `client-model.ts` so future call sites can migrate incrementally.
- Keep the existing browser-parity / browser-inference-probe code paths in `client-model.ts` working; they share inference logic with the new engine.

## Tactics Forbidden

- No new dependencies. No new audit script. The existing audit chain validates the refactor.
- No diagnostic-language hints (rejected by `audit_hint_pedagogy_review.mjs` regex).
- No silent-fail catches that swallow real inference errors — propagate to the decision module as `inference_error`.
- No touching `web/public/model/model-card.json`.
- No regression in the no-pretrained chain.

## Suggested Execution Order

1. **Slice 1** — Extract the pure inference path. Create `inference-engine.ts` with `load` + `predict`. Move `loadBrowserModelSession` + `runBrowserInferenceTensor` + `runBrowserInferenceDetailed` + `buildInputTensor` + `predictedLabel` into it (or have it import them from `client-model.ts` to keep the diff tight). Export the `InferenceEngine` interface + the singleton implementation. Validation: lint + typecheck + build.

2. **Slice 2** — Create `pass-fail-decision.ts` with the typed reasons, the frame-quality summary, the threshold lookup, the hint-metadata resolution, and the legacy-adapter helper. Validation: lint + typecheck + build.

3. **Slice 3** — Rewire `evaluateLocalAttempt` in `client-model.ts` as the backward-compat wrapper. Validation: full chain — including browser-onnx wiring smoke + practice-progress smoke + no-pretrained audits. Confirm `LocalInferenceResult` shape unchanged for callers.

## Handoff

When the four exit conditions are met, transition to awaiting-observer (reason `exit-condition-met`, observer_focus `roll-mission-forward`) so the next observer pass picks the next non-training move — likely Playwright camera-state specs (task-016), or back to mission 3 if first-party clips have landed in the meantime.
