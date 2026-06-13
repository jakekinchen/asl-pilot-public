/**
 * Typed contract for browser-side ASL recognition inference.
 *
 * Anchored to ARCHITECTURE.md#arch-inference-contract: the browser must call
 * an InferenceEngine that accepts a local frame window and active model
 * manifest, then returns logits/probabilities, quality signals, and metadata
 * needed for pass/fail. Pass/fail itself lives in pass-fail-decision.ts
 * (slice 2). This module is purely the inference half — no thresholding, no
 * hint text, no fail-closed branches beyond surfacing a typed error.
 *
 * Mission 3a (task-017) slice 1 — extract from web/src/lib/client-model.ts.
 */

import {
  loadBrowserModelSession,
  runBrowserInferenceDetailed,
  expectedFrameCount,
  expectedImageSize,
  type BrowserModelSession,
  type FrameSample,
  type ModelCard,
} from "./client-model";

/** Opaque handle to a loaded ONNX session ready for repeated predictions. */
export type LoadedModel = BrowserModelSession;

/** Raw inference outcome — no pass/fail, no hint. */
export type InferenceResult = {
  modelId: string;
  modelStatus: "not_trained" | "trained";
  /** Float32 logits over the model's label set, or null when no model is loaded. */
  logits: Float32Array | null;
  /** Top-1 predicted label id, or null when no model is loaded. */
  predictedId: string | null;
  /** Softmax probability for the top-1 label, or 0 when no model is loaded. */
  confidence: number;
  /** Top-K labels with softmax probabilities. */
  predictedTopK: Array<{ labelId: string; confidence: number }>;
  /** Input tensor shape [N, T, C, H, W]. */
  inputShape: number[];
  /** Wall-clock latency in milliseconds (load excluded; predict only). */
  latencyMs: number;
};

export interface InferenceEngine {
  /** Resolve a loaded ONNX session for the given model card, or throw. */
  load(modelCard: ModelCard): Promise<LoadedModel>;
  /** Run inference and return logits + top-K predictions. */
  predict(
    loaded: LoadedModel,
    frames: FrameSample[],
    options?: { topK?: number },
  ): Promise<InferenceResult>;
}

const DEFAULT_TOP_K = 5;

/**
 * Default browser implementation. Delegates to the existing helpers in
 * client-model.ts so the ONNX session cache stays shared across the legacy
 * `evaluateLocalAttempt`, `runBrowserModelInferenceProbe`,
 * `runBrowserModelParityProbe`, and any new InferenceEngine callers.
 */
export const browserInferenceEngine: InferenceEngine = {
  async load(modelCard) {
    if (modelCard.status !== "trained") {
      throw new Error("InferenceEngine.load requires a trained model card");
    }
    return loadBrowserModelSession(modelCard);
  },
  async predict(loaded, frames, options = {}) {
    const started = performance.now();
    const inference = await runBrowserInferenceDetailed(loaded, frames);
    const topK = topKLabels(inference.logits, loaded.indexToLabel, options.topK ?? DEFAULT_TOP_K);
    const best = topK[0] ?? { labelId: null, confidence: 0 };
    return {
      modelId: loaded.artifactPath.includes("/") ? loaded.artifactPath.split("/").pop() ?? "" : loaded.artifactPath,
      modelStatus: "trained",
      logits: inference.logits,
      predictedId: best.labelId,
      confidence: best.confidence,
      predictedTopK: topK.filter((entry): entry is { labelId: string; confidence: number } => entry.labelId !== null),
      inputShape: inference.inputShape,
      latencyMs: performance.now() - started,
    };
  },
};

/** Convenience: report the inference-side frame count / image size a model expects. */
export function expectedInputShape(modelCard: ModelCard | null): {
  frameCount: number;
  imageSize: number;
} {
  return {
    frameCount: expectedFrameCount(modelCard),
    imageSize: expectedImageSize(modelCard),
  };
}

function topKLabels(
  logits: Float32Array,
  labels: string[],
  k: number,
): Array<{ labelId: string | null; confidence: number }> {
  if (logits.length !== labels.length) {
    throw new Error("InferenceEngine.predict logits/label mismatch");
  }
  const maxLogit = Math.max(...logits);
  const expValues = Array.from(logits, (value) => Math.exp(value - maxLogit));
  const total = expValues.reduce((sum, value) => sum + value, 0) || 1;
  const indexed = expValues.map((value, index) => ({
    labelId: labels[index] ?? null,
    confidence: value / total,
  }));
  indexed.sort((a, b) => b.confidence - a.confidence);
  return indexed.slice(0, Math.max(1, k));
}
