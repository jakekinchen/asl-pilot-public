import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireSnippet(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  const status = missing.length === 0 ? "passed" : "failed";
  checks.push({ id, label, path: relativePath, status, missing });
  for (const snippet of missing) {
    findings.push(`${id}: ${relativePath} is missing ${JSON.stringify(snippet)}`);
  }
}

requireSnippet(
  "camera_api",
  "Practice UI checks for browser camera API support before requesting access",
  "web/src/lib/use-camera-capture.ts",
  ["navigator.mediaDevices?.getUserMedia", "getUserMedia"],
);

requireSnippet(
  "camera_denied",
  "Practice UI handles camera permission denial",
  "web/src/lib/use-camera-capture.ts",
  ["NotAllowedError", "PermissionDeniedError", "Camera permission was denied"],
);

requireSnippet(
  "camera_missing",
  "Practice UI handles missing camera devices",
  "web/src/lib/use-camera-capture.ts",
  ["NotFoundError", "DevicesNotFoundError", "No camera was found"],
);

requireSnippet(
  "camera_unsupported",
  "Practice UI handles unsupported camera APIs",
  "web/src/lib/use-camera-capture.ts",
  ["unsupported", "This browser does not expose camera access"],
);

requireSnippet(
  "camera_generic_error",
  "Practice UI handles generic camera startup errors",
  "web/src/lib/use-camera-capture.ts",
  ["Camera could not start under the current browser/device settings"],
);

requireSnippet(
  "browser_wasm_inference",
  "Browser inference uses ONNX Runtime Web WASM execution provider",
  "web/src/lib/client-model.ts",
  ['onnxruntime-web/wasm', 'executionProviders: ["wasm"]', 'wasmPaths = ORT_WASM_PATH'],
);

requireSnippet(
  "browser_wasm_route",
  "App serves the ONNX Runtime Web WASM binary from a same-origin route",
  "web/src/app/api/ort/[file]/route.ts",
  ["onnxruntime-web", "application/wasm", "ALLOWED_ORT_FILE"],
);

requireSnippet(
  "dataset_collection_default_disabled",
  "Dataset collection UI/API are gated by explicit environment variables",
  "web/src/components/PracticeApp.tsx",
  ["NEXT_PUBLIC_ENABLE_DATASET_COLLECTION", "DATASET_COLLECTION_ENABLED"],
);

requireSnippet(
  "dataset_route_default_disabled",
  "Dataset route returns forbidden unless explicit collection is enabled",
  "web/src/app/api/dataset/clips/route.ts",
  [
    "ENABLE_DATASET_COLLECTION",
    "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION",
    "PRIVATE_DATASET_COLLECTION_ENABLED && PUBLIC_DATASET_COLLECTION_ENABLED",
    "Dataset collection is disabled by default",
    "status: DATASET_COLLECTION_ENABLED ? 400 : 403",
  ],
);

requireSnippet(
  "browser_matrix_doc",
  "Browser compatibility matrix documentation exists",
  "docs/validation/browser-compatibility-matrix.md",
  ["Camera denied", "Camera missing", "Secure origin", "WASM inference", "Latency"],
);

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};

console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Browser compatibility audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
