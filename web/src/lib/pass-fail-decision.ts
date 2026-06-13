/**
 * Pass/fail decision module: consumes the inference half plus thresholds,
 * active-module label set, and frame-quality signals, and returns a typed
 * verdict + reasons[] + a hint resolved from SIGN_HINT_METADATA when a
 * specific dimension applies.
 *
 * Anchored to ARCHITECTURE.md#arch-passfail-thresholds and #arch-vocab-hints.
 * Per the hard gate "Honest targeted hints", hints are DESCRIPTIVE (about the
 * canonical sign) not DIAGNOSTIC (never claim what the learner did wrong).
 *
 * Mission 3a (task-017) slice 2 — split out from
 * web/src/lib/client-model.ts::evaluateLocalAttempt.
 */

import type { FrameSample, LocalInferenceResult, ModelCard } from "./client-model";
import type { InferenceResult } from "./inference-engine";
import {
  type HintKind,
  type SignHintMetadata,
  type VocabularyItem,
  getSignHintMetadata,
} from "./vocabulary";

export type PassFailReason =
  | "model_not_trained"
  | "insufficient_frames"
  | "low_luma"
  | "low_contrast"
  | "inactive_label"
  | "class_mismatch"
  | "confidence_below_threshold"
  | "inference_error";

export type FrameQualitySummary = {
  sampleCount: number;
  averageLuma: number;
  averageContrast: number;
};

export type PassFailDecisionInput = {
  expected: VocabularyItem;
  frames: FrameSample[];
  modelCard: ModelCard;
  /** activeLabels[] from docs/model/active-vocabulary-claim.json. Empty array means "no active recognition module yet". */
  activeLabels: string[];
  /** InferenceResult from the engine, or null when we short-circuited before running inference. */
  inference: InferenceResult | null;
  /** Set when InferenceEngine.predict threw — passed in so the legacy fallback path can route it through reasons[]. */
  inferenceError?: unknown;
};

export type PassFailDecisionOutput = {
  passed: boolean;
  reasons: PassFailReason[];
  /** Effective threshold used for the pass/fail decision (0–1). */
  threshold: number;
  /** Resolved hint text — descriptive, never diagnostic. */
  hint: string;
  /** If a phonological dimension drove the hint, name it here for downstream UIs. Null when the hint came from coachingHint or a generic fallback. */
  hintDimension: HintKind | null;
  /** Frame quality summary used by the quality-gate branches. */
  quality: FrameQualitySummary;
  /** Convenience copy of the engine's top-1 prediction (for callers that want both the verdict and the model output in one object). */
  predictedId: string | null;
  confidence: number;
};

const MIN_FRAME_SAMPLES = 3;
const MIN_AVERAGE_LUMA = 35;
const MIN_AVERAGE_CONTRAST = 12;
const USABLE_FRAME_LUMA_FLOOR = 10;

/** Hints we return when no specific dimension fits. */
const MODEL_NOT_TRAINED_HINT =
  "Automatic sign checking is not ready for this pilot yet. Your attempt was saved to practice history.";
const INACTIVE_LABEL_HINT =
  "This sign is in the practice vocabulary but is not currently in the active recognition module. Practice it freely; the model will start grading it once it is promoted.";
const INFERENCE_ERROR_HINT =
  "We could not check this attempt in the browser. Try refreshing the page and practicing again.";

/**
 * Compute frame quality independent of the model card / threshold logic.
 * Pure function — useful for callers that want to short-circuit before paying
 * the InferenceEngine.load cost.
 */
export function summarizeFrameQuality(frames: FrameSample[]): FrameQualitySummary {
  const usable = frames.filter((frame) => frame.meanLuma > USABLE_FRAME_LUMA_FLOOR);
  const sampleCount = frames.length;
  const lumaSum = usable.reduce((total, frame) => total + frame.meanLuma, 0);
  const contrastSum = usable.reduce((total, frame) => total + frame.contrast, 0);
  const divisor = Math.max(1, usable.length);
  return {
    sampleCount,
    averageLuma: lumaSum / divisor,
    averageContrast: contrastSum / divisor,
  };
}

export function decide(input: PassFailDecisionInput): PassFailDecisionOutput {
  const quality = summarizeFrameQuality(input.frames);
  const reasons: PassFailReason[] = [];

  if (quality.sampleCount < MIN_FRAME_SAMPLES) reasons.push("insufficient_frames");
  if (quality.averageLuma < MIN_AVERAGE_LUMA) reasons.push("low_luma");
  if (quality.averageContrast < MIN_AVERAGE_CONTRAST) reasons.push("low_contrast");

  if (input.modelCard.status !== "trained") {
    reasons.push("model_not_trained");
  } else if (input.activeLabels.length > 0 && !input.activeLabels.includes(input.expected.id)) {
    reasons.push("inactive_label");
  }

  if (input.inferenceError !== undefined) reasons.push("inference_error");

  const threshold = thresholdForExpectedLabel(input.modelCard, input.expected.id);
  let predictedId: string | null = null;
  let confidence = 0;

  if (input.inference) {
    predictedId = input.inference.predictedId;
    confidence = input.inference.confidence;
    if (predictedId !== input.expected.id) reasons.push("class_mismatch");
    if (confidence < threshold) reasons.push("confidence_below_threshold");
  }

  const passed =
    reasons.length === 0 &&
    Boolean(input.inference) &&
    predictedId === input.expected.id &&
    confidence >= threshold;

  const { hint, hintDimension } = resolveHint(input.expected, reasons, passed, threshold);

  return {
    passed,
    reasons,
    threshold,
    hint,
    hintDimension,
    quality,
    predictedId,
    confidence,
  };
}

/** Map the decision back to the legacy `LocalInferenceResult` shape for callers like PracticeApp.tsx that haven't migrated yet. */
export function toLegacyResult(
  expected: VocabularyItem,
  modelCard: ModelCard,
  decision: PassFailDecisionOutput,
): LocalInferenceResult {
  const reason = decision.reasons.length === 0
    ? `prompted class was top prediction and met threshold ${decision.threshold.toFixed(3)}`
    : decision.reasons.join(",");
  return {
    passed: decision.passed,
    expectedId: expected.id,
    predictedId: decision.predictedId,
    confidence: decision.confidence,
    modelStatus: modelCard.status,
    modelId: modelCard.model_id,
    hint: decision.hint,
    reason,
  };
}

function resolveHint(
  expected: VocabularyItem,
  reasons: PassFailReason[],
  passed: boolean,
  threshold: number,
): { hint: string; hintDimension: HintKind | null } {
  if (passed) {
    return { hint: "Accepted under the calibrated pilot threshold.", hintDimension: null };
  }
  if (reasons.includes("model_not_trained")) {
    return { hint: MODEL_NOT_TRAINED_HINT, hintDimension: null };
  }
  if (reasons.includes("inference_error")) {
    return { hint: INFERENCE_ERROR_HINT, hintDimension: null };
  }
  if (reasons.includes("inactive_label")) {
    return { hint: INACTIVE_LABEL_HINT, hintDimension: null };
  }
  const metadata = getSignHintMetadata(expected.id);

  // Quality reasons resolve to specific phonological dimensions when the
  // canonical metadata covers them; otherwise fall back to coachingHint.
  if (reasons.includes("low_luma") || reasons.includes("low_contrast")) {
    return preferDimension(expected, metadata, "framing");
  }
  if (reasons.includes("insufficient_frames")) {
    return preferDimension(expected, metadata, "timing");
  }
  // Class mismatch / below-threshold do not name a specific dimension; the
  // model can't observe phonology in this lane. Use the reviewer-curated
  // coachingHint plus a one-line diagnostic-free addendum noting the predicted
  // class disagreement so the operator sees why the attempt did not pass.
  if (reasons.includes("class_mismatch")) {
    return {
      hint: `${expected.coachingHint} The model selected a different vocabulary item.`,
      hintDimension: null,
    };
  }
  if (reasons.includes("confidence_below_threshold")) {
    return {
      hint: `${expected.coachingHint} The model was not confident enough at the calibrated threshold ${threshold.toFixed(2)}.`,
      hintDimension: null,
    };
  }
  return { hint: expected.coachingHint, hintDimension: null };
}

function preferDimension(
  expected: VocabularyItem,
  metadata: SignHintMetadata | undefined,
  dimension: HintKind,
): { hint: string; hintDimension: HintKind | null } {
  const cue = metadata?.[dimension];
  if (cue && cue.trim().length > 0) {
    return { hint: cue, hintDimension: dimension };
  }
  return { hint: expected.coachingHint, hintDimension: null };
}

function thresholdForExpectedLabel(modelCard: ModelCard, expectedId: string): number {
  const perLabel = modelCard.confidence_thresholds?.per_label?.[expectedId];
  if (typeof perLabel === "number" && Number.isFinite(perLabel)) {
    return clamp01(perLabel);
  }
  const fallback = modelCard.confidence_thresholds?.default;
  if (typeof fallback === "number" && Number.isFinite(fallback)) {
    return clamp01(fallback);
  }
  return 1;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
