import type { VocabularyItem } from "./vocabulary";
import type { InferenceResult } from "./inference-engine";

export type FrameSample = {
  width: number;
  height: number;
  meanLuma: number;
  contrast: number;
  sampledAt: number;
  rgb: Float32Array;
};

export type LocalInferenceResult = {
  passed: boolean;
  expectedId: string;
  predictedId: string | null;
  confidence: number;
  modelStatus: "not_trained" | "trained";
  modelId: string;
  hint: string;
  reason: string;
};

export type BrowserModelInferenceProbe = {
  ran_browser_inference: true;
  client_model_path: "web/src/lib/client-model.ts";
  app_wasm_route: "/api/ort/";
  model_id: string;
  artifact_path: string;
  browser_fetched_artifact_sha256: string;
  input_shape: number[];
  logits_shape: number[];
  latency_ms: number;
  session_input_names: string[];
  session_output_names: string[];
  output_type: string;
  predicted_id: string | null;
  confidence: number;
  frame_count: number;
  image_size: number;
  label_count: number;
  parity?: BrowserModelParityResult;
};

export type BrowserModelParityFixture = {
  schema_version: "asl-pilot-browser-parity-fixture/v1";
  input_tensor: {
    dtype: "float32";
    layout: "N,T,C,H,W";
    shape: number[];
    encoding: "base64_le_float32";
    sha256: string;
    base64: string;
  };
  expected_logits: {
    dtype: "float32";
    shape: number[];
    base64: string;
    sha256: string;
    values: number[];
  };
  model: {
    input_shape: number[];
    logits_shape: number[];
    label_count: number;
    expected_top_label_id: string;
  };
  tolerance: {
    max_abs_diff: number;
    max_rel_diff: number;
  };
};

export type BrowserModelParityResult = {
  status: "passed";
  fixture_schema_version: "asl-pilot-browser-parity-fixture/v1";
  fixture_sha256: string;
  input_tensor_sha256: string;
  expected_logits_sha256: string;
  actual_logits_sha256: string;
  max_abs_diff: number;
  max_rel_diff: number;
  tolerance: {
    max_abs_diff: number;
    max_rel_diff: number;
  };
  expected_top_label_id: string;
  actual_top_label_id: string | null;
};

export type ModelCard = {
  model_id: string;
  status: "not_trained" | "trained";
  export_format?: "onnx";
  browser_artifact?: {
    path?: string;
    sha256?: string;
  };
  model?: {
    frame_count?: number;
    image_size?: number;
    input_name?: string;
    output_name?: string;
    label_to_index?: Record<string, number>;
  };
  confidence_thresholds?: {
    default?: number;
    per_label?: Record<string, number>;
  };
  label_support_registry?: string;
  claim_matrix?: string;
  validation_route?: string;
  metric_frontier_summary?: string;
  academic_benchmarks?: Array<{
    id?: string;
    status?: string;
    role?: string;
    scope?: string;
    labels?: string[];
  }>;
};

type OrtModule = typeof import("onnxruntime-web/wasm");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

type BrowserModelSession = {
  artifactPath: string;
  artifactSha256: string;
  frameCount: number;
  imageSize: number;
  inputName: string;
  outputName: string;
  indexToLabel: string[];
  session: OrtSession;
};

const DEFAULT_MODEL_CARD: ModelCard = {
  model_id: "asl-pilot-rawframe-v0",
  status: "not_trained",
  confidence_thresholds: {
    default: 0.72,
  },
};
const DEFAULT_FRAME_COUNT = 16;
const DEFAULT_IMAGE_SIZE = 96;
const ORT_WASM_PATH = "/api/ort/";
let browserSessionPromise: Promise<BrowserModelSession> | null = null;
let browserSessionKey: string | null = null;

export type ActiveVocabularyClaim = {
  $schema_version?: string;
  modelVersion?: string;
  lane?: string;
  activeLabels?: string[];
  evidenceArtifacts?: unknown[];
  claim_disclaimer?: string;
};

const DEFAULT_ACTIVE_VOCABULARY_CLAIM: ActiveVocabularyClaim = {
  $schema_version: "asl-pilot-active-vocabulary-claim/v1",
  modelVersion: "rawframe-not-trained",
  lane: "rawframe",
  activeLabels: [],
  evidenceArtifacts: [],
  claim_disclaimer:
    "No labels are currently active for recognition. Fetch from /api/model/active-vocabulary-claim failed; defaulting to fail-closed empty active set.",
};

export async function loadActiveVocabularyClaim(): Promise<ActiveVocabularyClaim> {
  try {
    const response = await fetch("/api/model/active-vocabulary-claim", { cache: "no-store" });
    if (!response.ok) return DEFAULT_ACTIVE_VOCABULARY_CLAIM;
    const data = (await response.json()) as Partial<ActiveVocabularyClaim>;
    return {
      ...DEFAULT_ACTIVE_VOCABULARY_CLAIM,
      ...data,
    };
  } catch {
    return DEFAULT_ACTIVE_VOCABULARY_CLAIM;
  }
}

export async function loadModelCard(): Promise<ModelCard> {
  try {
    const response = await fetch("/model/model-card.json", {
      cache: "no-store",
    });
    if (!response.ok) return DEFAULT_MODEL_CARD;
    const data = (await response.json()) as Partial<ModelCard>;
    return {
      ...DEFAULT_MODEL_CARD,
      ...data,
      confidence_thresholds: {
        ...DEFAULT_MODEL_CARD.confidence_thresholds,
        ...data.confidence_thresholds,
      },
    };
  } catch {
    return DEFAULT_MODEL_CARD;
  }
}

export function sampleVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  imageSize = DEFAULT_IMAGE_SIZE,
): FrameSample {
  const size = Math.max(16, Math.min(224, Math.round(imageSize)));
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas is unavailable for local frame processing.");
  }
  const sourceWidth = video.videoWidth || size;
  const sourceHeight = video.videoHeight || size;
  const cropSize = Math.max(1, Math.min(sourceWidth, sourceHeight));
  const cropX = Math.max(0, (sourceWidth - cropSize) / 2);
  const cropY = Math.max(0, (sourceHeight - cropSize) / 2);
  context.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  let lumaTotal = 0;
  let lumaSquaredTotal = 0;
  const pixelCount = size * size;
  const rgb = new Float32Array(3 * pixelCount);

  for (let dataIndex = 0, pixelIndex = 0; dataIndex < data.length; dataIndex += 4, pixelIndex += 1) {
    const red = data[dataIndex];
    const green = data[dataIndex + 1];
    const blue = data[dataIndex + 2];
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    lumaTotal += luma;
    lumaSquaredTotal += luma * luma;
    rgb[pixelIndex] = red / 255;
    rgb[pixelCount + pixelIndex] = green / 255;
    rgb[2 * pixelCount + pixelIndex] = blue / 255;
  }

  const meanLuma = lumaTotal / pixelCount;
  const variance = Math.max(0, lumaSquaredTotal / pixelCount - meanLuma ** 2);

  return {
    width: size,
    height: size,
    meanLuma,
    contrast: Math.sqrt(variance),
    sampledAt: Date.now(),
    rgb,
  };
}

/**
 * Backward-compatible wrapper around the new InferenceEngine + PassFailDecision
 * modules (mission 3a / task-017). New callers should compose those two
 * directly; this signature stays for PracticeApp.tsx until task-017's UI
 * rewire slice lands.
 *
 * `activeLabels` defaults to [] (current state: modelVersion=rawframe-not-trained
 * in docs/model/active-vocabulary-claim.json). When the model card is
 * promoted, the call site should pass the active label set so the
 * inactive_label reason fires for content-only vocabulary items.
 */
export async function evaluateLocalAttempt(
  expected: VocabularyItem,
  frameSamples: FrameSample[],
  modelCard: ModelCard,
  activeLabels: string[] = [],
): Promise<LocalInferenceResult> {
  const { browserInferenceEngine } = await import("./inference-engine");
  const { decide, toLegacyResult } = await import("./pass-fail-decision");

  let inference: InferenceResult | null = null;
  let inferenceError: unknown;
  if (modelCard.status === "trained") {
    try {
      const loaded = await browserInferenceEngine.load(modelCard);
      inference = await browserInferenceEngine.predict(loaded, frameSamples);
    } catch (error) {
      inferenceError = error;
    }
  }

  const decision = decide({
    expected,
    frames: frameSamples,
    modelCard,
    activeLabels,
    inference,
    inferenceError,
  });
  return toLegacyResult(expected, modelCard, decision);
}

export async function runBrowserModelInferenceProbe(
  modelCard: ModelCard,
  frameSamples: FrameSample[],
): Promise<BrowserModelInferenceProbe> {
  if (modelCard.status !== "trained") {
    throw new Error("Browser model inference probe requires a trained model card.");
  }
  const started = performance.now();
  const browserModel = await loadBrowserModelSession(modelCard);
  const inference = await runBrowserInferenceDetailed(browserModel, frameSamples);
  const { labelId, confidence } = predictedLabel(inference.logits, browserModel.indexToLabel);
  return {
    ran_browser_inference: true,
    client_model_path: "web/src/lib/client-model.ts",
    app_wasm_route: ORT_WASM_PATH,
    model_id: modelCard.model_id,
    artifact_path: browserModel.artifactPath,
    browser_fetched_artifact_sha256: browserModel.artifactSha256,
    input_shape: inference.inputShape,
    logits_shape: inference.logitsShape,
    latency_ms: performance.now() - started,
    session_input_names: [...browserModel.session.inputNames],
    session_output_names: [...browserModel.session.outputNames],
    output_type: inference.outputType,
    predicted_id: labelId,
    confidence,
    frame_count: browserModel.frameCount,
    image_size: browserModel.imageSize,
    label_count: browserModel.indexToLabel.length,
  };
}

export async function runBrowserModelParityProbe(
  modelCard: ModelCard,
  fixture: BrowserModelParityFixture,
  fixtureSha256: string,
): Promise<BrowserModelInferenceProbe> {
  validateParityFixture(fixture);
  if (!isSha256(fixtureSha256)) {
    throw new Error("Browser parity fixture file SHA-256 must be injected by the runner.");
  }
  if (modelCard.status !== "trained") {
    throw new Error("Browser model parity probe requires a trained model card.");
  }
  const started = performance.now();
  const browserModel = await loadBrowserModelSession(modelCard);
  const inputTensor = decodeBase64Float32(fixture.input_tensor.base64);
  const inputTensorSha256 = await sha256Hex(arrayBufferForView(inputTensor));
  if (inputTensorSha256 !== fixture.input_tensor.sha256) {
    throw new Error("Browser parity fixture input tensor SHA-256 does not match its payload.");
  }
  const expectedLogitsTensor = decodeBase64Float32(fixture.expected_logits.base64);
  const expectedLogitsSha256 = await sha256Hex(arrayBufferForView(expectedLogitsTensor));
  if (expectedLogitsSha256 !== fixture.expected_logits.sha256) {
    throw new Error("Browser parity fixture expected-logits SHA-256 does not match its payload.");
  }
  const expectedLogits = Array.from(expectedLogitsTensor);
  if (!sameFloatArray(expectedLogits, fixture.expected_logits.values, 1e-7)) {
    throw new Error("Browser parity fixture expected-logits JSON values do not match the hash-pinned payload.");
  }
  if (!sameArray(fixture.input_tensor.shape, [
    1,
    browserModel.frameCount,
    3,
    browserModel.imageSize,
    browserModel.imageSize,
  ])) {
    throw new Error("Browser parity fixture input shape does not match the model card.");
  }
  const inference = await runBrowserInferenceTensor(browserModel, inputTensor);
  const { labelId, confidence } = predictedLabel(inference.logits, browserModel.indexToLabel);
  const diffs = compareLogits(inference.logits, expectedLogits);
  if (diffs.maxAbsDiff > fixture.tolerance.max_abs_diff || diffs.maxRelDiff > fixture.tolerance.max_rel_diff) {
    throw new Error(
      `Browser parity logits mismatch: max_abs_diff=${diffs.maxAbsDiff}, max_rel_diff=${diffs.maxRelDiff}`,
    );
  }
  if (labelId !== fixture.model.expected_top_label_id) {
    throw new Error("Browser parity top label does not match PyTorch fixture top label.");
  }
  return {
    ran_browser_inference: true,
    client_model_path: "web/src/lib/client-model.ts",
    app_wasm_route: ORT_WASM_PATH,
    model_id: modelCard.model_id,
    artifact_path: browserModel.artifactPath,
    browser_fetched_artifact_sha256: browserModel.artifactSha256,
    input_shape: inference.inputShape,
    logits_shape: inference.logitsShape,
    latency_ms: performance.now() - started,
    session_input_names: [...browserModel.session.inputNames],
    session_output_names: [...browserModel.session.outputNames],
    output_type: inference.outputType,
    predicted_id: labelId,
    confidence,
    frame_count: browserModel.frameCount,
    image_size: browserModel.imageSize,
    label_count: browserModel.indexToLabel.length,
    parity: {
      status: "passed",
      fixture_schema_version: fixture.schema_version,
      fixture_sha256: fixtureSha256,
      input_tensor_sha256: inputTensorSha256,
      expected_logits_sha256: expectedLogitsSha256,
      actual_logits_sha256: await sha256Hex(arrayBufferForView(inference.logits)),
      max_abs_diff: diffs.maxAbsDiff,
      max_rel_diff: diffs.maxRelDiff,
      tolerance: {
        max_abs_diff: fixture.tolerance.max_abs_diff,
        max_rel_diff: fixture.tolerance.max_rel_diff,
      },
      expected_top_label_id: fixture.model.expected_top_label_id,
      actual_top_label_id: labelId,
    },
  };
}

export function expectedFrameCount(modelCard: ModelCard | null): number {
  return positiveInteger(modelCard?.model?.frame_count, DEFAULT_FRAME_COUNT);
}

export function expectedImageSize(modelCard: ModelCard | null): number {
  return positiveInteger(modelCard?.model?.image_size, DEFAULT_IMAGE_SIZE);
}

export type { BrowserModelSession };

export async function loadBrowserModelSession(modelCard: ModelCard): Promise<BrowserModelSession> {
  const artifactPath = modelCard.browser_artifact?.path;
  if (!artifactPath) {
    throw new Error("The trained model card does not include a browser ONNX artifact path.");
  }
  if (modelCard.export_format !== "onnx" || !artifactPath.endsWith(".onnx")) {
    throw new Error("The trained model card is not an ONNX browser artifact.");
  }
  const expectedArtifactSha256 = modelCard.browser_artifact?.sha256;
  if (!isSha256(expectedArtifactSha256)) {
    throw new Error("The trained model card must include a lowercase SHA-256 for the browser ONNX artifact.");
  }
  const labelToIndex = modelCard.model?.label_to_index;
  if (!labelToIndex || Object.keys(labelToIndex).length === 0) {
    throw new Error("The trained model card does not include the label index mapping required for browser inference.");
  }

  const artifactUrl = browserArtifactUrl(artifactPath);
  const key = `${artifactUrl}:${expectedArtifactSha256}`;
  if (browserSessionPromise && browserSessionKey === key) return browserSessionPromise;

  browserSessionKey = key;
  browserSessionPromise = (async () => {
    const ort = await import("onnxruntime-web/wasm");
    configureOrtWasm(ort);
    const artifactBytes = await fetchVerifiedBrowserArtifact(artifactUrl, expectedArtifactSha256);
    const session = await ort.InferenceSession.create(artifactBytes, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    const inputName = modelCard.model?.input_name ?? session.inputNames[0] ?? "clips";
    const outputName = modelCard.model?.output_name ?? session.outputNames[0] ?? "logits";
    return {
      artifactPath,
      artifactSha256: expectedArtifactSha256,
      frameCount: expectedFrameCount(modelCard),
      imageSize: expectedImageSize(modelCard),
      inputName,
      outputName,
      indexToLabel: indexToLabel(labelToIndex),
      session,
    };
  })();
  return browserSessionPromise;
}

export async function runBrowserInferenceDetailed(
  browserModel: BrowserModelSession,
  frames: FrameSample[],
): Promise<{
  logits: Float32Array;
  inputShape: number[];
  logitsShape: number[];
  outputType: string;
}> {
  return runBrowserInferenceTensor(
    browserModel,
    buildInputTensor(frames, browserModel.frameCount, browserModel.imageSize),
  );
}

async function runBrowserInferenceTensor(
  browserModel: BrowserModelSession,
  tensorData: Float32Array,
): Promise<{
  logits: Float32Array;
  inputShape: number[];
  logitsShape: number[];
  outputType: string;
}> {
  const ort = await import("onnxruntime-web/wasm");
  configureOrtWasm(ort);
  const inputShape = [1, browserModel.frameCount, 3, browserModel.imageSize, browserModel.imageSize];
  const expectedLength = inputShape.reduce((total, value) => total * value, 1);
  if (tensorData.length !== expectedLength) {
    throw new Error(`Browser ONNX input tensor length ${tensorData.length} does not match expected ${expectedLength}.`);
  }
  const input = new ort.Tensor("float32", tensorData, inputShape);
  const outputs = await browserModel.session.run({ [browserModel.inputName]: input });
  const output = outputs[browserModel.outputName];
  if (!output || !(output.data instanceof Float32Array)) {
    throw new Error("Browser ONNX inference did not return float32 logits.");
  }
  return {
    logits: output.data,
    inputShape,
    logitsShape: Array.from(output.dims),
    outputType: output.type,
  };
}

function configureOrtWasm(ort: OrtModule) {
  ort.env.wasm.wasmPaths = ORT_WASM_PATH;
  ort.env.wasm.numThreads = 1;
}

function buildInputTensor(
  frames: FrameSample[],
  frameCount: number,
  imageSize: number,
): Float32Array {
  const pixelCount = imageSize * imageSize;
  const frameStride = 3 * pixelCount;
  const input = new Float32Array(frameCount * frameStride);
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const sourceIndex =
      frames.length >= frameCount
        ? Math.round((frameIndex * (frames.length - 1)) / Math.max(1, frameCount - 1))
        : Math.min(frameIndex, frames.length - 1);
    const source = frames[sourceIndex];
    if (!source || source.width !== imageSize || source.height !== imageSize) {
      throw new Error("Sampled browser frame shape does not match the model card input size.");
    }
    input.set(source.rgb, frameIndex * frameStride);
  }
  return input;
}

function validateParityFixture(fixture: BrowserModelParityFixture) {
  if (fixture?.schema_version !== "asl-pilot-browser-parity-fixture/v1") {
    throw new Error("Browser parity fixture schema_version is invalid.");
  }
  if (fixture.input_tensor?.dtype !== "float32" || fixture.input_tensor.layout !== "N,T,C,H,W") {
    throw new Error("Browser parity fixture input tensor metadata is invalid.");
  }
  if (fixture.input_tensor.encoding !== "base64_le_float32" || !isSha256(fixture.input_tensor.sha256)) {
    throw new Error("Browser parity fixture input tensor must be base64_le_float32 with SHA-256.");
  }
  if (!Array.isArray(fixture.input_tensor.shape) || fixture.input_tensor.shape.length !== 5) {
    throw new Error("Browser parity fixture input tensor shape must be 5D.");
  }
  if (fixture.expected_logits?.dtype !== "float32" || !isSha256(fixture.expected_logits.sha256)) {
    throw new Error("Browser parity fixture expected logits metadata is invalid.");
  }
  if (!Array.isArray(fixture.expected_logits.values) || fixture.expected_logits.values.length === 0) {
    throw new Error("Browser parity fixture expected logits values must be present.");
  }
  if (typeof fixture.expected_logits.base64 !== "string" || fixture.expected_logits.base64.length === 0) {
    throw new Error("Browser parity fixture expected logits base64 payload must be present.");
  }
  if (!Array.isArray(fixture.expected_logits.shape) || fixture.expected_logits.shape.length !== 2) {
    throw new Error("Browser parity fixture expected logits shape must be 2D.");
  }
  if (!sameArray(fixture.model.input_shape, fixture.input_tensor.shape)) {
    throw new Error("Browser parity fixture model input shape must match input tensor shape.");
  }
  if (!sameArray(fixture.model.logits_shape, fixture.expected_logits.shape)) {
    throw new Error("Browser parity fixture model logits shape must match expected logits shape.");
  }
  if (fixture.expected_logits.values.length !== fixture.model.label_count) {
    throw new Error("Browser parity fixture expected logits length must match label count.");
  }
  if (
    typeof fixture.tolerance?.max_abs_diff !== "number" ||
    typeof fixture.tolerance?.max_rel_diff !== "number" ||
    fixture.tolerance.max_abs_diff < 0 ||
    fixture.tolerance.max_rel_diff < 0
  ) {
    throw new Error("Browser parity fixture tolerance must be non-negative numbers.");
  }
}

function decodeBase64Float32(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  if (bytes.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error("Browser parity fixture input tensor byte length is not float32-aligned.");
  }
  return new Float32Array(bytes.buffer);
}

function compareLogits(actual: Float32Array, expected: number[]) {
  if (actual.length !== expected.length) {
    throw new Error("Browser parity logits length does not match PyTorch fixture logits length.");
  }
  let maxAbsDiff = 0;
  let maxRelDiff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    const absDiff = Math.abs(actual[index] - expected[index]);
    const relDiff = absDiff / Math.max(1e-8, Math.abs(expected[index]));
    maxAbsDiff = Math.max(maxAbsDiff, absDiff);
    maxRelDiff = Math.max(maxRelDiff, relDiff);
  }
  return { maxAbsDiff, maxRelDiff };
}

function sameArray(actual: unknown, expected: number[]) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function sameFloatArray(actual: number[], expected: number[], tolerance: number) {
  return actual.length === expected.length &&
    actual.every((value, index) => Math.abs(value - expected[index]) <= tolerance);
}

function predictedLabel(logits: Float32Array, labels: string[]) {
  if (logits.length !== labels.length) {
    throw new Error("Browser ONNX logits do not match the model card label mapping.");
  }
  const maxLogit = Math.max(...logits);
  const expValues = Array.from(logits, (value) => Math.exp(value - maxLogit));
  const total = expValues.reduce((sum, value) => sum + value, 0);
  let bestIndex = 0;
  for (let index = 1; index < expValues.length; index += 1) {
    if (expValues[index] > expValues[bestIndex]) bestIndex = index;
  }
  return {
    labelId: labels[bestIndex] ?? null,
    confidence: total > 0 ? expValues[bestIndex] / total : 0,
  };
}

function indexToLabel(labelToIndex: Record<string, number>) {
  const entries = Object.entries(labelToIndex);
  const labels: string[] = [];
  for (const [label, index] of entries) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error("Model card label index mapping contains an invalid index.");
    }
    labels[index] = label;
  }
  if (labels.length !== entries.length || labels.some((label) => !label)) {
    throw new Error("Model card label index mapping must be dense from zero.");
  }
  return labels;
}

function browserArtifactUrl(projectPath: string) {
  const publicPrefix = "web/public";
  if (!projectPath.startsWith(publicPrefix)) {
    throw new Error("Browser ONNX artifact must be served from web/public.");
  }
  return projectPath.slice(publicPrefix.length);
}

async function fetchVerifiedBrowserArtifact(artifactUrl: string, expectedSha256: string) {
  const response = await fetch(artifactUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Browser ONNX artifact fetch failed with HTTP ${response.status}.`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const actualSha256 = await sha256Hex(arrayBuffer);
  if (actualSha256 !== expectedSha256) {
    throw new Error("Browser ONNX artifact SHA-256 does not match the trained model card.");
  }
  return new Uint8Array(arrayBuffer);
}

async function sha256Hex(arrayBuffer: BufferSource) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Browser crypto.subtle is required to verify the ONNX artifact hash.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function arrayBufferForView(view: Float32Array) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function positiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
