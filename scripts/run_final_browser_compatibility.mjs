import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  stableJson,
  validateEd25519SignatureEvidence,
} from "./signed_receipt_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultAppUrl = "http://127.0.0.1:3025";
const defaultOutputPath = path.join(root, "docs", "validation", "final-browser-compatibility.json");
const defaultObservationsPath = path.join(root, "docs", "validation", "final-browser-compatibility.observations.json");
const modelCardRelativePath = "web/public/model/model-card.json";
const onnxSmokeRelativePath = "docs/validation/final-browser-onnx-smoke.json";
const requiredBrowsers = new Set([
  "chrome_desktop",
  "edge_desktop",
  "safari_desktop",
  "firefox_desktop",
]);
const allowedEvidenceTypes = new Set([
  "screenshot",
  "trace",
  "har",
  "network_log",
  "console_log",
  "command_log",
  "signed_review",
]);
const allowedVerificationModes = new Set(["automated_playwright", "manual_signed_review"]);
const commandLogSchemaVersion = "asl-pilot-browser-compatibility-command-log/v1";
const networkLogSchemaVersion = "asl-pilot-browser-compatibility-network-log/v1";
const signedReviewSchemaVersion = "asl-pilot-browser-compatibility-signed-review/v1";
const ortWasmPrefix = "/api/ort/";
const ortDistPath = path.join(root, "web", "node_modules", "onnxruntime-web", "dist");
const browserIdentityRequirements = {
  chrome_desktop: {
    browserName: /\b(chrome|chromium)\b/i,
    engine: /\bchromium\b/i,
    command: /\b(chrome|chromium)\b/i,
    commandLabel: "Chrome or Chromium",
  },
  edge_desktop: {
    browserName: /\b(edge|microsoft edge)\b/i,
    engine: /\bchromium\b/i,
    command: /\b(edge|msedge)\b/i,
    commandLabel: "Edge or msedge",
  },
  safari_desktop: {
    browserName: /\b(safari|webkit)\b/i,
    engine: /\bwebkit\b/i,
    command: /\b(safari|webkit)\b/i,
    commandLabel: "Safari or WebKit",
  },
  firefox_desktop: {
    browserName: /\bfirefox\b/i,
    engine: /\bgecko\b/i,
    command: /\bfirefox\b/i,
    commandLabel: "Firefox",
  },
};

function parseArgs(argv) {
  const args = { appUrl: defaultAppUrl, write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (item === "--write-on-pass-only") {
      args.writeOnPassOnly = true;
      continue;
    }
    if (item === "--app-url" || item === "--output" || item === "--observations") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--app-url") args.appUrl = value;
      if (item === "--output") args.output = value;
      if (item === "--observations") args.observations = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/run_final_browser_compatibility.mjs \\
    [--app-url http://127.0.0.1:3025] \\
    [--observations docs/validation/final-browser-compatibility.observations.json] \\
    [--output docs/validation/final-browser-compatibility.json] [--write] [--write-on-pass-only]

Builds the retained final browser-compatibility report from hash-pinned model-card,
final browser ONNX smoke evidence, and real browser observation rows. This command
does not fabricate Chrome/Edge/Safari/Firefox checks; it fails until the final
trained model and all required browser observations exist.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context, mustExist = true) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  if (mustExist && !fs.existsSync(resolved)) {
    throw new Error(`${context} does not exist: ${projectRelative(resolved)}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function hasPlaceholderText(value) {
  return typeof value === "string" && /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value);
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function browserUrlForPublicPath(projectPath) {
  const publicPrefix = "web/public";
  if (typeof projectPath !== "string" || !projectPath.startsWith(publicPrefix)) return null;
  return projectPath.slice(publicPrefix.length);
}

function requestPath(entry) {
  if (typeof entry?.url_path === "string") return entry.url_path;
  if (typeof entry?.path === "string") return entry.path;
  if (typeof entry?.url === "string") {
    try {
      return new URL(entry.url).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

function requestDigest(entry) {
  return typeof entry?.response_sha256 === "string" ? entry.response_sha256 : entry?.sha256;
}

function requestSameOrigin(entry, appUrl) {
  if (typeof entry?.url !== "string") return true;
  try {
    return new URL(entry.url).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

function appUrlBlockers(appUrl) {
  const blockers = [];
  try {
    const url = new URL(appUrl);
    const localhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !localhost) {
      blockers.push("app_url must use HTTPS or localhost/loopback for camera access");
    }
    if (url.pathname.includes("/smoke/browser-onnx")) {
      blockers.push("app_url must target the real practice app root, not /smoke/browser-onnx");
    }
    if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
      blockers.push("app_url must target the real practice app root (/), with no alternate route, query, or hash");
    }
  } catch {
    blockers.push("app_url must be a valid URL");
  }
  return blockers;
}

function validateLatency(latency, context) {
  const blockers = [];
  if (!latency || typeof latency !== "object" || Array.isArray(latency)) {
    return [`${context}.latency_ms must be an object`];
  }
  for (const key of ["warmup", "p50", "p95", "max"]) {
    if (typeof latency[key] !== "number" || latency[key] < 0) {
      blockers.push(`${context}.latency_ms.${key} must be a non-negative number`);
    }
  }
  if (typeof latency.max === "number" && latency.max <= 0) {
    blockers.push(`${context}.latency_ms.max must be greater than zero`);
  }
  if (
    typeof latency.p50 === "number"
    && typeof latency.p95 === "number"
    && latency.p95 < latency.p50
  ) {
    blockers.push(`${context}.latency_ms.p95 must be greater than or equal to p50`);
  }
  if (
    typeof latency.p95 === "number"
    && typeof latency.max === "number"
    && latency.max < latency.p95
  ) {
    blockers.push(`${context}.latency_ms.max must be greater than or equal to p95`);
  }
  return blockers;
}

function validateReference(reference, context) {
  const blockers = [];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    return { file: null, blockers: [`${context} must be an object`] };
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return { file: null, blockers };
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
  }
  const file = resolveProjectPath(reference.path, `${context}.path`, false);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return { file: null, blockers };
  }
  const actual = sha256File(file);
  if (reference.sha256 !== actual) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return { file, blockers };
}

function validateVerifiedChecks(checks, context) {
  const blockers = [];
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
    return [`${context}.verified_checks must be an object`];
  }
  for (const key of ["secure_origin", "camera_access_checked", "wasm_inference_checked", "model_artifact_loaded"]) {
    if (checks[key] !== true) blockers.push(`${context}.verified_checks.${key} must be true`);
  }
  if (checks.normal_practice_raw_media_uploads_observed !== false) {
    blockers.push(`${context}.verified_checks.normal_practice_raw_media_uploads_observed must be false`);
  }
  return blockers;
}

function validateRequestsSummary(requestsSummary, expected, context) {
  const blockers = [];
  if (!Array.isArray(requestsSummary) || requestsSummary.length === 0) {
    return [`${context}.requests_summary must include model artifact and ORT WASM GET requests`];
  }
  const expectedArtifactPath = browserUrlForPublicPath(expected.browserArtifactPath);
  let hasArtifactFetch = false;
  let hasOrtWasmFetch = false;
  for (const [index, entry] of requestsSummary.entries()) {
    const entryContext = `${context}.requests_summary[${index}]`;
    const pathName = requestPath(entry);
    const digest = requestDigest(entry);
    if (entry?.method !== "GET") blockers.push(`${entryContext}.method must be GET`);
    if (entry?.status !== 200) blockers.push(`${entryContext}.status must be 200`);
    if (!pathName) blockers.push(`${entryContext}.url_path or url must identify the requested path`);
    if (!requestSameOrigin(entry, expected.appUrl)) {
      blockers.push(`${entryContext}.url must be same-origin with app_url`);
    }
    if (digest !== undefined && !isSha256(digest)) {
      blockers.push(`${entryContext}.response_sha256 or sha256 must be a lowercase SHA-256 digest`);
    }
    if (pathName === expectedArtifactPath) {
      if (digest !== expected.browserArtifactSha256) {
        blockers.push(`${entryContext}.response_sha256 must match browser_artifact_sha256`);
      }
      hasArtifactFetch = true;
    }
    if (pathName?.startsWith(ortWasmPrefix) && pathName.endsWith(".wasm")) {
      const wasmFile = path.join(ortDistPath, path.basename(pathName));
      if (!fs.existsSync(wasmFile)) {
        blockers.push(`${entryContext} local ORT WASM file is missing: ${path.basename(pathName)}`);
      } else if (digest !== sha256File(wasmFile)) {
        blockers.push(`${entryContext}.response_sha256 must match local onnxruntime-web dist asset ${path.basename(pathName)}`);
      }
      hasOrtWasmFetch = true;
    }
  }
  if (!hasArtifactFetch) {
    blockers.push(`${context}.requests_summary must include GET ${expectedArtifactPath} with browser_artifact_sha256`);
  }
  if (!hasOrtWasmFetch) {
    blockers.push(`${context}.requests_summary must include at least one GET ${ortWasmPrefix}*.wasm response`);
  }
  return blockers;
}

function evidenceDigest(evidenceFiles) {
  const payload = evidenceFiles
    .filter((item) => item && typeof item === "object" && typeof item.path === "string" && typeof item.sha256 === "string")
    .map((item) => ({ path: item.path, sha256: item.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function validateNetworkLog(log, expected, context) {
  const blockers = [];
  if (!log || typeof log !== "object" || Array.isArray(log)) {
    return [`${context} must be a JSON object`];
  }
  if (log.schema_version !== networkLogSchemaVersion) {
    blockers.push(`${context}.schema_version must be ${networkLogSchemaVersion}`);
  }
  for (const key of [
    "browser_id",
    "app_url",
    "model_card_sha256",
    "final_browser_onnx_smoke_sha256",
    "browser_artifact_path",
    "browser_artifact_sha256",
  ]) {
    if (typeof log[key] !== "string" || log[key].trim().length === 0 || hasPlaceholderText(log[key])) {
      blockers.push(`${context}.${key} must be a non-placeholder string`);
    }
  }
  if (log.browser_id !== expected.browser_id) blockers.push(`${context}.browser_id must match ${expected.browser_id}`);
  if (log.app_url !== expected.appUrl) blockers.push(`${context}.app_url must match runner --app-url`);
  if (log.model_card_sha256 !== expected.modelCardSha256) blockers.push(`${context}.model_card_sha256 must match current model card hash`);
  if (log.final_browser_onnx_smoke_sha256 !== expected.onnxSmokeSha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match current final browser ONNX smoke hash`);
  }
  if (log.browser_artifact_path !== expected.browserArtifactPath) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (log.browser_artifact_sha256 !== expected.browserArtifactSha256) {
    blockers.push(`${context}.browser_artifact_sha256 must match the trained browser artifact hash`);
  }
  if (!isIsoDate(log.captured_at) || String(log.captured_at).includes("YYYY")) {
    blockers.push(`${context}.captured_at must be a real ISO-compatible date string`);
  }
  if (log.normal_practice_raw_media_uploads_observed !== false) {
    blockers.push(`${context}.normal_practice_raw_media_uploads_observed must be false`);
  }
  for (const key of ["raw_media_upload_requests", "unexpected_external_requests"]) {
    if (!Array.isArray(log[key])) {
      blockers.push(`${context}.${key} must be an array`);
    } else if (log[key].length > 0) {
      blockers.push(`${context}.${key} must be empty`);
    }
  }
  blockers.push(...validateRequestsSummary(log.requests_summary, expected, context));
  return blockers;
}

function validateEvidenceFileContents(evidence, file, expected, context) {
  const blockers = [];
  const relativePath = projectRelative(file);
  if (evidence.type === "screenshot") {
    const header = fs.readFileSync(file).subarray(0, 8).toString("hex");
    const lowerPath = relativePath.toLowerCase();
    if (lowerPath.endsWith(".png") && header !== "89504e470d0a1a0a") {
      blockers.push(`${context}.path must be a valid PNG screenshot`);
    } else if ((lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) && !header.startsWith("ffd8")) {
      blockers.push(`${context}.path must be a valid JPEG screenshot`);
    } else if (!lowerPath.endsWith(".png") && !lowerPath.endsWith(".jpg") && !lowerPath.endsWith(".jpeg")) {
      blockers.push(`${context}.path must be a PNG or JPEG screenshot`);
    }
  }
  if (evidence.type === "network_log") {
    if (!relativePath.endsWith(".json")) {
      blockers.push(`${context}.path must be a machine-readable network-log JSON file`);
      return blockers;
    }
    try {
      blockers.push(...validateNetworkLog(readJson(file), expected, context));
    } catch (error) {
      blockers.push(`${context}.path must contain valid network-log JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (["command_log", "signed_review"].includes(evidence.type) && !relativePath.endsWith(".json")) {
    blockers.push(`${context}.path must be a machine-readable JSON receipt`);
  }
  if (evidence.type === "har") {
    try {
      const har = readJson(file);
      if (!har?.log || !Array.isArray(har.log.entries)) {
        blockers.push(`${context}.path must contain a HAR log with entries`);
      }
    } catch (error) {
      blockers.push(`${context}.path must contain valid HAR JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return blockers;
}

function validateEvidenceFiles(evidenceFiles, context, expected) {
  const blockers = [];
  if (!Array.isArray(evidenceFiles) || evidenceFiles.length < 2) {
    return [`${context}.evidence_files must include at least two hash-pinned browser evidence files`];
  }
  const seen = new Set();
  let hasVisualEvidence = false;
  let hasNetworkLogEvidence = false;
  for (const [evidenceIndex, evidence] of evidenceFiles.entries()) {
    const evidenceContext = `${context}.evidence_files[${evidenceIndex}]`;
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      blockers.push(`${evidenceContext} must be an object`);
      continue;
    }
    if (!allowedEvidenceTypes.has(evidence.type)) {
      blockers.push(`${evidenceContext}.type must be one of ${[...allowedEvidenceTypes].join(", ")}`);
    }
    if (["screenshot", "trace"].includes(evidence.type)) hasVisualEvidence = true;
    if (evidence.type === "network_log") hasNetworkLogEvidence = true;
    if (typeof evidence.path !== "string" || evidence.path.trim().length === 0) {
      blockers.push(`${evidenceContext}.path must be a non-empty string`);
      continue;
    }
    if (hasPlaceholderText(evidence.path)) {
      blockers.push(`${evidenceContext}.path must not contain placeholder text`);
    }
    if (!isSha256(evidence.sha256)) {
      blockers.push(`${evidenceContext}.sha256 must be a lowercase SHA-256 digest`);
    }
    if (typeof evidence.purpose !== "string" || evidence.purpose.trim().length < 12 || hasPlaceholderText(evidence.purpose)) {
      blockers.push(`${evidenceContext}.purpose must describe the browser evidence`);
    }
    const file = resolveProjectPath(evidence.path, `${evidenceContext}.path`, false);
    if (!fs.existsSync(file)) {
      blockers.push(`${evidenceContext}.path does not exist: ${evidence.path}`);
      continue;
    }
    const relativePath = projectRelative(file);
    if (seen.has(relativePath)) {
      blockers.push(`${evidenceContext}.path duplicates an earlier browser evidence path: ${relativePath}`);
    }
    seen.add(relativePath);
    const actualSha256 = sha256File(file);
    if (evidence.sha256 !== actualSha256) {
      blockers.push(`${evidenceContext}.sha256 mismatch for ${relativePath}; expected ${evidence.sha256}, got ${actualSha256}`);
    }
    blockers.push(...validateEvidenceFileContents(evidence, file, expected, evidenceContext));
  }
  if (!hasVisualEvidence) {
    blockers.push(`${context}.evidence_files must include screenshot or trace evidence`);
  }
  if (!hasNetworkLogEvidence) {
    blockers.push(`${context}.evidence_files must include schema-bound network_log evidence`);
  }
  return blockers;
}

function validateProcessOutput(output, context) {
  const blockers = [];
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return [`${context}.process_output must be an object`];
  }
  for (const key of ["stdout", "stderr"]) {
    const { file, blockers: referenceBlockers } = validateReference(output[key], `${context}.process_output.${key}`);
    blockers.push(...referenceBlockers);
    if (file && ![".log", ".txt", ".json"].some((extension) => projectRelative(file).endsWith(extension))) {
      blockers.push(`${context}.process_output.${key}.path must be a retained log, text, or JSON file`);
    }
  }
  return blockers;
}

function validateCommandLog(log, expected, context) {
  const blockers = [];
  if (!log || typeof log !== "object" || Array.isArray(log)) {
    return [`${context} must be a JSON object`];
  }
  if (log.schema_version !== commandLogSchemaVersion) {
    blockers.push(`${context}.schema_version must be ${commandLogSchemaVersion}`);
  }
  if (log.receipt_type !== "automated_playwright") {
    blockers.push(`${context}.receipt_type must be automated_playwright`);
  }
  for (const key of [
    "browser_id",
    "app_url",
    "command",
    "model_card_sha256",
    "final_browser_onnx_smoke_sha256",
    "browser_artifact_path",
    "browser_artifact_sha256",
    "evidence_digest",
  ]) {
    if (typeof log[key] !== "string" || log[key].trim().length === 0 || hasPlaceholderText(log[key])) {
      blockers.push(`${context}.${key} must be a non-placeholder string`);
    }
  }
  if (log.browser_id !== expected.browser_id) blockers.push(`${context}.browser_id must match ${expected.browser_id}`);
  if (log.app_url !== expected.appUrl) blockers.push(`${context}.app_url must match runner --app-url`);
  if (log.command !== expected.command) blockers.push(`${context}.command must match the browser row command`);
  if (log.model_card_sha256 !== expected.modelCardSha256) blockers.push(`${context}.model_card_sha256 must match current model card hash`);
  if (log.final_browser_onnx_smoke_sha256 !== expected.onnxSmokeSha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match current final browser ONNX smoke hash`);
  }
  if (log.browser_artifact_path !== expected.browserArtifactPath) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (log.browser_artifact_sha256 !== expected.browserArtifactSha256) {
    blockers.push(`${context}.browser_artifact_sha256 must match the trained browser artifact hash`);
  }
  if (log.evidence_digest !== expected.evidence_digest) {
    blockers.push(`${context}.evidence_digest must match the row evidence_files digest`);
  }
  if (log.exit_code !== 0) blockers.push(`${context}.exit_code must be 0`);
  if (!isIsoDate(log.tested_at) || String(log.tested_at).includes("YYYY")) {
    blockers.push(`${context}.tested_at must be a real ISO-compatible date string`);
  }
  blockers.push(...validateVerifiedChecks(log.verified_checks, context));
  blockers.push(...validateProcessOutput(log.process_output, context));
  return blockers;
}

function validateCommandLogEvidence(evidenceFiles, expected, context) {
  const blockers = [];
  const commandLogs = (evidenceFiles ?? []).filter((evidence) => evidence?.type === "command_log");
  if (commandLogs.length !== 1) {
    return [`${context} must include exactly one command_log evidence file`];
  }
  const [commandLog] = commandLogs;
  if (typeof commandLog.path !== "string" || commandLog.path.trim().length === 0) {
    return [`${context}.command_log.path must be a non-empty string`];
  }
  if (!isSha256(commandLog.sha256)) {
    blockers.push(`${context}.command_log.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof commandLog.purpose !== "string" || commandLog.purpose.trim().length < 12 || hasPlaceholderText(commandLog.purpose)) {
    blockers.push(`${context}.command_log.purpose must describe the command log evidence`);
  }
  const file = resolveProjectPath(commandLog.path, `${context}.command_log.path`, false);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.command_log.path does not exist: ${commandLog.path}`);
    return blockers;
  }
  const actualSha256 = sha256File(file);
  if (commandLog.sha256 !== actualSha256) {
    blockers.push(`${context}.command_log.sha256 mismatch for ${commandLog.path}; expected ${commandLog.sha256}, got ${actualSha256}`);
  }
  if (!projectRelative(file).endsWith(".json")) {
    blockers.push(`${context}.command_log.path must be a machine-readable JSON file`);
    return blockers;
  }
  try {
    blockers.push(...validateCommandLog(readJson(file), expected, `${context}.command_log`));
  } catch (error) {
    blockers.push(`${context}.command_log must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return blockers;
}

function validateReviewerIdentity(reviewer, expectedReviewer, context) {
  const blockers = [];
  if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
    return [`${context} must be an object`];
  }
  for (const key of ["name", "role", "contact_or_signed_evidence"]) {
    if (typeof reviewer[key] !== "string" || reviewer[key].trim().length === 0 || hasPlaceholderText(reviewer[key])) {
      blockers.push(`${context}.${key} must be a non-placeholder string`);
    } else if (expectedReviewer && reviewer[key] !== expectedReviewer[key]) {
      blockers.push(`${context}.${key} must match the browser row manual_reviewer.${key}`);
    }
  }
  if (reviewer.is_project_operator !== false) {
    blockers.push(`${context}.is_project_operator must be false`);
  }
  return blockers;
}

export function canonicalSignedBrowserReviewPayload(review) {
  return stableJson({
    schema_version: review.schema_version,
    review_status: review.review_status,
    browser_id: review.browser_id,
    app_url: review.app_url,
    command: review.command,
    model_card_sha256: review.model_card_sha256,
    final_browser_onnx_smoke_sha256: review.final_browser_onnx_smoke_sha256,
    browser_artifact_path: review.browser_artifact_path,
    browser_artifact_sha256: review.browser_artifact_sha256,
    reviewed_evidence_digest: review.reviewed_evidence_digest,
    reviewed_at: review.reviewed_at,
    signed_at: review.signed_at,
    verified_checks: review.verified_checks,
    reviewer: review.reviewer,
  });
}

function validateSignedReview(review, expected, context) {
  const blockers = [];
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    return [`${context} must be a JSON object`];
  }
  if (review.schema_version !== signedReviewSchemaVersion) {
    blockers.push(`${context}.schema_version must be ${signedReviewSchemaVersion}`);
  }
  if (review.review_status !== "passed") blockers.push(`${context}.review_status must be passed`);
  for (const key of [
    "browser_id",
    "app_url",
    "command",
    "model_card_sha256",
    "final_browser_onnx_smoke_sha256",
    "browser_artifact_path",
    "browser_artifact_sha256",
    "reviewed_evidence_digest",
  ]) {
    if (typeof review[key] !== "string" || review[key].trim().length === 0 || hasPlaceholderText(review[key])) {
      blockers.push(`${context}.${key} must be a non-placeholder string`);
    }
  }
  if (review.browser_id !== expected.browser_id) blockers.push(`${context}.browser_id must match ${expected.browser_id}`);
  if (review.app_url !== expected.appUrl) blockers.push(`${context}.app_url must match runner --app-url`);
  if (review.command !== expected.command) blockers.push(`${context}.command must match the browser row command`);
  if (review.model_card_sha256 !== expected.modelCardSha256) blockers.push(`${context}.model_card_sha256 must match current model card hash`);
  if (review.final_browser_onnx_smoke_sha256 !== expected.onnxSmokeSha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match current final browser ONNX smoke hash`);
  }
  if (review.browser_artifact_path !== expected.browserArtifactPath) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (review.browser_artifact_sha256 !== expected.browserArtifactSha256) {
    blockers.push(`${context}.browser_artifact_sha256 must match the trained browser artifact hash`);
  }
  if (review.reviewed_evidence_digest !== expected.evidence_digest) {
    blockers.push(`${context}.reviewed_evidence_digest must match the row evidence_files digest`);
  }
  for (const key of ["reviewed_at", "signed_at"]) {
    if (!isIsoDate(review[key]) || String(review[key]).includes("YYYY")) {
      blockers.push(`${context}.${key} must be a real ISO-compatible date string`);
    }
  }
  blockers.push(...validateVerifiedChecks(review.verified_checks, context));
  blockers.push(...validateReviewerIdentity(review.reviewer, expected.manualReviewer, `${context}.reviewer`));
  blockers.push(...validateEd25519SignatureEvidence({
    signedObject: review,
    payload: canonicalSignedBrowserReviewPayload(review),
    context,
  }));
  return blockers;
}

function validateSignedReviewEvidence(evidenceFiles, expected, context) {
  const blockers = [];
  if (!Array.isArray(evidenceFiles) || evidenceFiles.length !== 1) {
    return [`${context} must contain exactly one signed_review evidence file`];
  }
  const signedReviews = (evidenceFiles ?? []).filter((evidence) => evidence?.type === "signed_review");
  if (signedReviews.length !== 1) {
    return [`${context} must include exactly one signed_review evidence file`];
  }
  const [signedReview] = signedReviews;
  if (typeof signedReview.path !== "string" || signedReview.path.trim().length === 0) {
    return [`${context}.signed_review.path must be a non-empty string`];
  }
  if (!isSha256(signedReview.sha256)) {
    blockers.push(`${context}.signed_review.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof signedReview.purpose !== "string" || signedReview.purpose.trim().length < 12 || hasPlaceholderText(signedReview.purpose)) {
    blockers.push(`${context}.signed_review.purpose must describe the signed browser-review evidence`);
  }
  const file = resolveProjectPath(signedReview.path, `${context}.signed_review.path`, false);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.signed_review.path does not exist: ${signedReview.path}`);
    return blockers;
  }
  const actualSha256 = sha256File(file);
  if (signedReview.sha256 !== actualSha256) {
    blockers.push(`${context}.signed_review.sha256 mismatch for ${signedReview.path}; expected ${signedReview.sha256}, got ${actualSha256}`);
  }
  if (!projectRelative(file).endsWith(".json")) {
    blockers.push(`${context}.signed_review.path must be a machine-readable JSON file`);
    return blockers;
  }
  try {
    blockers.push(...validateSignedReview(readJson(file), expected, `${context}.signed_review`));
  } catch (error) {
    blockers.push(`${context}.signed_review must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return blockers;
}

function validateObservationRow(row, index, evidenceContext) {
  const context = `observations.browsers[${index}]`;
  const blockers = [];
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return { browserId: null, blockers: [`${context} must be an object`] };
  }
  if (!requiredBrowsers.has(row.browser_id)) {
    blockers.push(`${context}.browser_id must be one of ${[...requiredBrowsers].join(", ")}`);
  }
  if (row.status !== "passed") blockers.push(`${context}.status must be passed`);
  if (!isIsoDate(row.tested_at) || String(row.tested_at).includes("YYYY")) {
    blockers.push(`${context}.tested_at must be a real ISO-compatible date string`);
  }
  for (const key of ["browser_name", "browser_version", "engine"]) {
    if (typeof row[key] !== "string" || row[key].trim().length === 0) {
      blockers.push(`${context}.${key} must be a non-empty string`);
    } else if (hasPlaceholderText(row[key])) {
      blockers.push(`${context}.${key} must not contain placeholder text`);
    }
  }
  if (typeof row.notes !== "string" || row.notes.trim().length < 20 || hasPlaceholderText(row.notes)) {
    blockers.push(`${context}.notes must contain real final observation notes`);
  }
  if (typeof row.command !== "string" || row.command.trim().length < 8 || hasPlaceholderText(row.command)) {
    blockers.push(`${context}.command must contain the exact browser verification command or workflow`);
  }
  blockers.push(...validateBrowserIdentity(row, context));
  if (!allowedVerificationModes.has(row.verification_mode)) {
    blockers.push(`${context}.verification_mode must be automated_playwright or manual_signed_review`);
  } else if (row.verification_mode === "automated_playwright" && !/\bplaywright\b/i.test(row.command ?? "")) {
    blockers.push(`${context}.command must include the Playwright command used for automated browser evidence`);
  } else if (row.verification_mode === "automated_playwright") {
    const expected = {
      ...evidenceContext,
      browser_id: row.browser_id,
      command: row.command,
      evidence_digest: evidenceDigest((row.evidence_files ?? []).filter((evidence) => evidence?.type !== "command_log")),
    };
    blockers.push(...validateCommandLogEvidence(row.evidence_files, expected, `${context}.evidence_files`));
  } else if (row.verification_mode === "manual_signed_review") {
    const reviewer = row.manual_reviewer;
    if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
      blockers.push(`${context}.manual_reviewer must be an object for manual_signed_review rows`);
    } else {
      blockers.push(...validateReviewerIdentity(reviewer, null, `${context}.manual_reviewer`));
    }
    const expected = {
      ...evidenceContext,
      browser_id: row.browser_id,
      command: row.command,
      evidence_digest: evidenceDigest(row.evidence_files ?? []),
      manualReviewer: reviewer,
    };
    blockers.push(...validateSignedReviewEvidence(row.signed_evidence_files, expected, `${context}.signed_evidence_files`));
  }
  if (
    typeof row.operator_notes !== "string"
    || row.operator_notes.trim().length < 20
    || hasPlaceholderText(row.operator_notes)
  ) {
    blockers.push(`${context}.operator_notes must contain real operator notes for the retained evidence`);
  }
  for (const key of [
    "secure_origin",
    "camera_access_checked",
    "wasm_inference_checked",
    "model_artifact_loaded",
  ]) {
    if (row[key] !== true) blockers.push(`${context}.${key} must be true`);
  }
  if (row.normal_practice_raw_media_uploads_observed !== false) {
    blockers.push(`${context}.normal_practice_raw_media_uploads_observed must be false`);
  }
  blockers.push(...validateLatency(row.latency_ms, context));
  blockers.push(...validateEvidenceFiles(row.evidence_files, context, {
    ...evidenceContext,
    browser_id: row.browser_id,
  }));
  return { browserId: row.browser_id, blockers };
}

function validateBrowserIdentity(row, context) {
  const blockers = [];
  const requirement = browserIdentityRequirements[row.browser_id];
  if (!requirement) return blockers;
  if (!requirement.browserName.test(row.browser_name ?? "")) {
    blockers.push(`${context}.browser_name must identify ${row.browser_id}`);
  }
  if (!requirement.engine.test(row.engine ?? "")) {
    blockers.push(`${context}.engine must match the expected engine for ${row.browser_id}`);
  }
  if (row.verification_mode === "automated_playwright" && !requirement.command.test(row.command ?? "")) {
    blockers.push(`${context}.command must bind Playwright to ${requirement.commandLabel} for ${row.browser_id}`);
  }
  return blockers;
}

function loadObservationRows(observationsPath, blockers, evidenceContext) {
  if (!fs.existsSync(observationsPath)) {
    blockers.push(`Browser observation file is missing: ${projectRelative(observationsPath)}`);
    return [];
  }
  const observations = readJson(observationsPath);
  if (observations.schema_version !== "asl-pilot-final-browser-compatibility-observations/v1") {
    blockers.push("browser observations schema_version must be asl-pilot-final-browser-compatibility-observations/v1");
  }
  const rows = Array.isArray(observations.browsers) ? observations.browsers : [];
  if (rows.length === 0) blockers.push("browser observations must include browser rows");
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const { browserId, blockers: rowBlockers } = validateObservationRow(row, index, evidenceContext);
    blockers.push(...rowBlockers);
    if (browserId) seen.add(browserId);
  }
  for (const browserId of requiredBrowsers) {
    if (!seen.has(browserId)) blockers.push(`browser observations must include ${browserId}`);
  }
  return rows;
}

function validateBrowserArtifactBinding(modelCard, onnxSmoke) {
  const blockers = [];
  const { file: modelArtifactFile, blockers: modelArtifactBlockers } = validateReference(
    modelCard?.browser_artifact,
    "model-card.browser_artifact",
  );
  const { file: smokeArtifactFile, blockers: smokeArtifactBlockers } = validateReference(
    onnxSmoke?.browser_artifact,
    "final_browser_onnx_smoke.browser_artifact",
  );
  blockers.push(...modelArtifactBlockers, ...smokeArtifactBlockers);
  if (modelArtifactFile && !projectRelative(modelArtifactFile).startsWith("web/public/")) {
    blockers.push("model-card browser_artifact.path must be under web/public/");
  }
  if (modelArtifactFile && !projectRelative(modelArtifactFile).endsWith(".onnx")) {
    blockers.push("model-card browser_artifact.path must end with .onnx");
  }
  if (smokeArtifactFile && !projectRelative(smokeArtifactFile).endsWith(".onnx")) {
    blockers.push("final_browser_onnx_smoke browser_artifact.path must end with .onnx");
  }
  if (onnxSmoke?.model_card?.path !== modelCardRelativePath) {
    blockers.push("final_browser_onnx_smoke model_card.path must be web/public/model/model-card.json");
  }
  if (onnxSmoke?.model_card?.sha256 !== fileReference(modelCardRelativePath).sha256) {
    blockers.push("final_browser_onnx_smoke model_card.sha256 must match the current model card hash");
  }
  if (modelCard?.browser_artifact?.path !== onnxSmoke?.browser_artifact?.path) {
    blockers.push("model-card browser_artifact.path must match final browser ONNX smoke");
  }
  if (modelCard?.browser_artifact?.sha256 !== onnxSmoke?.browser_artifact?.sha256) {
    blockers.push("model-card browser_artifact.sha256 must match final browser ONNX smoke");
  }
  if (onnxSmoke?.inference?.browser_fetched_artifact_sha256 !== modelCard?.browser_artifact?.sha256) {
    blockers.push("final browser ONNX smoke browser-fetched artifact hash must match model-card browser_artifact.sha256");
  }
  return blockers;
}

function preflight(appUrl, observationsPath) {
  const blockers = [...appUrlBlockers(appUrl)];
  const modelCardPath = path.join(root, modelCardRelativePath);
  const onnxSmokePath = path.join(root, onnxSmokeRelativePath);
  const modelCard = fs.existsSync(modelCardPath) ? readJson(modelCardPath) : null;
  const onnxSmoke = fs.existsSync(onnxSmokePath) ? readJson(onnxSmokePath) : null;

  if (!modelCard) blockers.push(`${modelCardRelativePath} is missing`);
  if (!onnxSmoke) blockers.push(`${onnxSmokeRelativePath} is missing`);
  if (modelCard && modelCard.status !== "trained") {
    blockers.push(`model-card status must be trained; found ${modelCard.status}`);
  }
  if (onnxSmoke && onnxSmoke.status !== "passed") {
    blockers.push(`final browser ONNX smoke status must be passed; found ${onnxSmoke.status}`);
  }
  if (onnxSmoke && onnxSmoke.inference?.ran_browser_inference !== true) {
    blockers.push("final browser ONNX smoke must include browser inference");
  }
  if (onnxSmoke && onnxSmoke.runtime?.execution_provider !== "wasm") {
    blockers.push("final browser ONNX smoke runtime.execution_provider must be wasm");
  }
  blockers.push(...validateBrowserArtifactBinding(modelCard, onnxSmoke));

  const rows = loadObservationRows(observationsPath, blockers, {
    appUrl,
    modelCardSha256: fileReference(modelCardRelativePath).sha256,
    onnxSmokeSha256: fileReference(onnxSmokeRelativePath).sha256,
    browserArtifactPath: modelCard?.browser_artifact?.path,
    browserArtifactSha256: modelCard?.browser_artifact?.sha256,
  });
  if (fs.existsSync(observationsPath)) {
    const observations = readJson(observationsPath);
    if (observations.app_url !== appUrl) {
      blockers.push("browser observations app_url must match the runner --app-url");
    }
  }
  return { blockers, modelCard, onnxSmoke, rows };
}

function runStaticAudits(blockers) {
  for (const [label, command, args] of [
    ["static browser compatibility", "node", ["scripts/audit_browser_compatibility.mjs"]],
    ["no raw video upload", "node", ["scripts/audit_no_raw_video_upload.mjs"]],
    ["final browser ONNX smoke", "node", ["scripts/audit_final_browser_onnx_smoke.mjs"]],
  ]) {
    const result = spawnSync(command, args, {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      blockers.push(`${label} audit failed: ${result.stderr.trim() || result.stdout.trim()}`);
    }
  }
}

function buildReport({ appUrl, blockers, rows, outputPath, observationsPath }) {
  return {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    tested_at: new Date().toISOString(),
    runner: {
      tool: "node",
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_final_browser_compatibility.mjs"),
    },
    app_url: appUrl,
    model_card: fileReference(modelCardRelativePath),
    final_browser_onnx_smoke: fileReference(onnxSmokeRelativePath),
    observations_source: fileReference(projectRelative(observationsPath)),
    browsers: rows,
    blockers,
    output: outputPath ? projectRelative(outputPath) : null,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output ? resolveProjectPath(args.output, "--output", false) : defaultOutputPath;
  const observationsPath = args.observations
    ? resolveProjectPath(args.observations, "--observations", false)
    : defaultObservationsPath;
  const { blockers, rows } = preflight(args.appUrl, observationsPath);
  runStaticAudits(blockers);
  const shouldWrite = args.write && (!args.writeOnPassOnly || blockers.length === 0);
  const report = buildReport({
    appUrl: args.appUrl,
    blockers,
    rows,
    outputPath: shouldWrite ? outputPath : null,
    observationsPath,
  });
  if (shouldWrite) writeJson(outputPath, report);
  console.log(JSON.stringify({
    status: report.status,
    output: shouldWrite ? projectRelative(outputPath) : null,
    app_url: args.appUrl,
    observations: projectRelative(observationsPath),
    blockers,
  }, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final browser compatibility runner failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
