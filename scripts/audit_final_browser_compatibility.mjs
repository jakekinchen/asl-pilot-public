import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  stableJson,
  validateEd25519SignatureEvidence,
} from "./signed_receipt_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "final-browser-compatibility.json");
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
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--report") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --report");
      args.report = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_final_browser_compatibility.mjs [--report docs/validation/final-browser-compatibility.json]

Fails until retained final browser evidence covers Chrome, Edge, Safari, and
Firefox desktop with the exact trained model-card artifact, secure origin,
camera access, WASM inference, latency, and no normal-practice raw-media upload.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function validateReference(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function commandOptionValue(command, option) {
  if (!Array.isArray(command)) return null;
  const index = command.indexOf(option);
  if (index < 0) return null;
  const value = command[index + 1];
  return typeof value === "string" && !value.startsWith("--") ? value : null;
}

function validateLatency(latency, context, blockers) {
  if (!latency || typeof latency !== "object" || Array.isArray(latency)) {
    blockers.push(`${context}.latency_ms must be an object`);
    return;
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
}

function validateVerifiedChecks(checks, context, blockers) {
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
    blockers.push(`${context}.verified_checks must be an object`);
    return;
  }
  for (const key of ["secure_origin", "camera_access_checked", "wasm_inference_checked", "model_artifact_loaded"]) {
    if (checks[key] !== true) blockers.push(`${context}.verified_checks.${key} must be true`);
  }
  if (checks.normal_practice_raw_media_uploads_observed !== false) {
    blockers.push(`${context}.verified_checks.normal_practice_raw_media_uploads_observed must be false`);
  }
}

function validateRequestsSummary(requestsSummary, expected, context, blockers) {
  if (!Array.isArray(requestsSummary) || requestsSummary.length === 0) {
    blockers.push(`${context}.requests_summary must include model artifact and ORT WASM GET requests`);
    return;
  }
  const expectedArtifactPath = browserUrlForPublicPath(expected.browser_artifact_path);
  let hasArtifactFetch = false;
  let hasOrtWasmFetch = false;
  for (const [index, entry] of requestsSummary.entries()) {
    const entryContext = `${context}.requests_summary[${index}]`;
    const pathName = requestPath(entry);
    const digest = requestDigest(entry);
    if (entry?.method !== "GET") blockers.push(`${entryContext}.method must be GET`);
    if (entry?.status !== 200) blockers.push(`${entryContext}.status must be 200`);
    if (!pathName) blockers.push(`${entryContext}.url_path or url must identify the requested path`);
    if (!requestSameOrigin(entry, expected.app_url)) {
      blockers.push(`${entryContext}.url must be same-origin with app_url`);
    }
    if (digest !== undefined && !isSha256(digest)) {
      blockers.push(`${entryContext}.response_sha256 or sha256 must be a lowercase SHA-256 digest`);
    }
    if (pathName === expectedArtifactPath) {
      if (digest !== expected.browser_artifact_sha256) {
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
}

function evidenceDigest(evidenceFiles) {
  const payload = evidenceFiles
    .filter((item) => item && typeof item === "object" && typeof item.path === "string" && typeof item.sha256 === "string")
    .map((item) => ({ path: item.path, sha256: item.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function validateNetworkLog(log, expected, context, blockers) {
  if (!log || typeof log !== "object" || Array.isArray(log)) {
    blockers.push(`${context} must be a JSON object`);
    return;
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
  if (log.app_url !== expected.app_url) blockers.push(`${context}.app_url must match final app_url`);
  if (log.model_card_sha256 !== expected.model_card_sha256) blockers.push(`${context}.model_card_sha256 must match model_card.sha256`);
  if (log.final_browser_onnx_smoke_sha256 !== expected.final_browser_onnx_smoke_sha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match final_browser_onnx_smoke.sha256`);
  }
  if (log.browser_artifact_path !== expected.browser_artifact_path) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (log.browser_artifact_sha256 !== expected.browser_artifact_sha256) {
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
  validateRequestsSummary(log.requests_summary, expected, context, blockers);
}

function validateEvidenceFileContents(evidence, file, expected, context, blockers) {
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
      return;
    }
    try {
      validateNetworkLog(readJson(file), expected, context, blockers);
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
}

function validateEvidenceFiles(evidenceFiles, context, blockers, expected) {
  if (!Array.isArray(evidenceFiles) || evidenceFiles.length < 2) {
    blockers.push(`${context}.evidence_files must include at least two hash-pinned browser evidence files`);
    return;
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
    const file = resolveProjectPath(evidence.path, `${evidenceContext}.path`);
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
    validateEvidenceFileContents(evidence, file, expected, evidenceContext, blockers);
  }
  if (!hasVisualEvidence) {
    blockers.push(`${context}.evidence_files must include screenshot or trace evidence`);
  }
  if (!hasNetworkLogEvidence) {
    blockers.push(`${context}.evidence_files must include schema-bound network_log evidence`);
  }
}

function validateProcessOutput(output, context, blockers) {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    blockers.push(`${context}.process_output must be an object`);
    return;
  }
  for (const key of ["stdout", "stderr"]) {
    const file = validateReference(output[key], `${context}.process_output.${key}`, blockers);
    if (file && ![".log", ".txt", ".json"].some((extension) => projectRelative(file).endsWith(extension))) {
      blockers.push(`${context}.process_output.${key}.path must be a retained log, text, or JSON file`);
    }
  }
}

function validateCommandLog(log, expected, context, blockers) {
  if (!log || typeof log !== "object" || Array.isArray(log)) {
    blockers.push(`${context} must be a JSON object`);
    return;
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
  if (log.app_url !== expected.app_url) blockers.push(`${context}.app_url must match report app_url`);
  if (log.command !== expected.command) blockers.push(`${context}.command must match the browser row command`);
  if (log.model_card_sha256 !== expected.model_card_sha256) blockers.push(`${context}.model_card_sha256 must match report model_card.sha256`);
  if (log.final_browser_onnx_smoke_sha256 !== expected.final_browser_onnx_smoke_sha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match report final_browser_onnx_smoke.sha256`);
  }
  if (log.browser_artifact_path !== expected.browser_artifact_path) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (log.browser_artifact_sha256 !== expected.browser_artifact_sha256) {
    blockers.push(`${context}.browser_artifact_sha256 must match the trained browser artifact hash`);
  }
  if (log.evidence_digest !== expected.evidence_digest) {
    blockers.push(`${context}.evidence_digest must match the row evidence_files digest`);
  }
  if (log.exit_code !== 0) blockers.push(`${context}.exit_code must be 0`);
  if (!isIsoDate(log.tested_at) || String(log.tested_at).includes("YYYY")) {
    blockers.push(`${context}.tested_at must be a real ISO-compatible date string`);
  }
  validateVerifiedChecks(log.verified_checks, context, blockers);
  validateProcessOutput(log.process_output, context, blockers);
}

function validateCommandLogEvidence(evidenceFiles, expected, context, blockers) {
  const commandLogs = (evidenceFiles ?? []).filter((evidence) => evidence?.type === "command_log");
  if (commandLogs.length !== 1) {
    blockers.push(`${context} must include exactly one command_log evidence file`);
    return;
  }
  const [commandLog] = commandLogs;
  if (typeof commandLog.path !== "string" || commandLog.path.trim().length === 0) {
    blockers.push(`${context}.command_log.path must be a non-empty string`);
    return;
  }
  if (!isSha256(commandLog.sha256)) {
    blockers.push(`${context}.command_log.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof commandLog.purpose !== "string" || commandLog.purpose.trim().length < 12 || hasPlaceholderText(commandLog.purpose)) {
    blockers.push(`${context}.command_log.purpose must describe the command log evidence`);
  }
  const file = resolveProjectPath(commandLog.path, `${context}.command_log.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.command_log.path does not exist: ${commandLog.path}`);
    return;
  }
  const actualSha256 = sha256File(file);
  if (commandLog.sha256 !== actualSha256) {
    blockers.push(`${context}.command_log.sha256 mismatch for ${commandLog.path}; expected ${commandLog.sha256}, got ${actualSha256}`);
  }
  if (!projectRelative(file).endsWith(".json")) {
    blockers.push(`${context}.command_log.path must be a machine-readable JSON file`);
    return;
  }
  try {
    validateCommandLog(readJson(file), expected, `${context}.command_log`, blockers);
  } catch (error) {
    blockers.push(`${context}.command_log must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateReviewerIdentity(reviewer, expectedReviewer, context, blockers) {
  if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
    blockers.push(`${context} must be an object`);
    return;
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

function validateSignedReview(review, expected, context, blockers) {
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    blockers.push(`${context} must be a JSON object`);
    return;
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
  if (review.app_url !== expected.app_url) blockers.push(`${context}.app_url must match report app_url`);
  if (review.command !== expected.command) blockers.push(`${context}.command must match the browser row command`);
  if (review.model_card_sha256 !== expected.model_card_sha256) blockers.push(`${context}.model_card_sha256 must match report model_card.sha256`);
  if (review.final_browser_onnx_smoke_sha256 !== expected.final_browser_onnx_smoke_sha256) {
    blockers.push(`${context}.final_browser_onnx_smoke_sha256 must match report final_browser_onnx_smoke.sha256`);
  }
  if (review.browser_artifact_path !== expected.browser_artifact_path) {
    blockers.push(`${context}.browser_artifact_path must match the trained browser artifact path`);
  }
  if (review.browser_artifact_sha256 !== expected.browser_artifact_sha256) {
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
  validateVerifiedChecks(review.verified_checks, context, blockers);
  validateReviewerIdentity(review.reviewer, expected.manual_reviewer, `${context}.reviewer`, blockers);
  blockers.push(...validateEd25519SignatureEvidence({
    signedObject: review,
    payload: canonicalSignedBrowserReviewPayload(review),
    context,
  }));
}

function validateSignedReviewEvidence(evidenceFiles, expected, context, blockers) {
  if (!Array.isArray(evidenceFiles) || evidenceFiles.length !== 1) {
    blockers.push(`${context} must contain exactly one signed_review evidence file`);
    return;
  }
  const signedReviews = (evidenceFiles ?? []).filter((evidence) => evidence?.type === "signed_review");
  if (signedReviews.length !== 1) {
    blockers.push(`${context} must include exactly one signed_review evidence file`);
    return;
  }
  const [signedReview] = signedReviews;
  if (typeof signedReview.path !== "string" || signedReview.path.trim().length === 0) {
    blockers.push(`${context}.signed_review.path must be a non-empty string`);
    return;
  }
  if (!isSha256(signedReview.sha256)) {
    blockers.push(`${context}.signed_review.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof signedReview.purpose !== "string" || signedReview.purpose.trim().length < 12 || hasPlaceholderText(signedReview.purpose)) {
    blockers.push(`${context}.signed_review.purpose must describe the signed browser-review evidence`);
  }
  const file = resolveProjectPath(signedReview.path, `${context}.signed_review.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.signed_review.path does not exist: ${signedReview.path}`);
    return;
  }
  const actualSha256 = sha256File(file);
  if (signedReview.sha256 !== actualSha256) {
    blockers.push(`${context}.signed_review.sha256 mismatch for ${signedReview.path}; expected ${signedReview.sha256}, got ${actualSha256}`);
  }
  if (!projectRelative(file).endsWith(".json")) {
    blockers.push(`${context}.signed_review.path must be a machine-readable JSON file`);
    return;
  }
  try {
    validateSignedReview(readJson(file), expected, `${context}.signed_review`, blockers);
  } catch (error) {
    blockers.push(`${context}.signed_review must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateBrowserRow(row, index, blockers, evidenceContext) {
  const context = `browsers[${index}]`;
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    blockers.push(`${context} must be an object`);
    return null;
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
  validateBrowserIdentity(row, context, blockers);
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
    validateCommandLogEvidence(row.evidence_files, expected, `${context}.evidence_files`, blockers);
  } else if (row.verification_mode === "manual_signed_review") {
    const reviewer = row.manual_reviewer;
    if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
      blockers.push(`${context}.manual_reviewer must be an object for manual_signed_review rows`);
    } else {
      validateReviewerIdentity(reviewer, null, `${context}.manual_reviewer`, blockers);
    }
    const expected = {
      ...evidenceContext,
      browser_id: row.browser_id,
      command: row.command,
      evidence_digest: evidenceDigest(row.evidence_files ?? []),
      manual_reviewer: reviewer,
    };
    validateSignedReviewEvidence(row.signed_evidence_files, expected, `${context}.signed_evidence_files`, blockers);
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
  validateLatency(row.latency_ms, context, blockers);
  validateEvidenceFiles(row.evidence_files, context, blockers, {
    ...evidenceContext,
    browser_id: row.browser_id,
  });
  return row.browser_id;
}

function validateBrowserIdentity(row, context, blockers) {
  const requirement = browserIdentityRequirements[row.browser_id];
  if (!requirement) return;
  if (!requirement.browserName.test(row.browser_name ?? "")) {
    blockers.push(`${context}.browser_name must identify ${row.browser_id}`);
  }
  if (!requirement.engine.test(row.engine ?? "")) {
    blockers.push(`${context}.engine must match the expected engine for ${row.browser_id}`);
  }
  if (row.verification_mode === "automated_playwright" && !requirement.command.test(row.command ?? "")) {
    blockers.push(`${context}.command must bind Playwright to ${requirement.commandLabel} for ${row.browser_id}`);
  }
}

function validateObservationsSource(observationsFile, report, blockers) {
  const observations = readJson(observationsFile);
  if (observations.schema_version !== "asl-pilot-final-browser-compatibility-observations/v1") {
    blockers.push("observations_source schema_version must be asl-pilot-final-browser-compatibility-observations/v1");
  }
  if (observations.app_url !== report.app_url) {
    blockers.push("observations_source app_url must match report app_url");
  }
  if (JSON.stringify(observations.browsers ?? null) !== JSON.stringify(report.browsers ?? null)) {
    blockers.push("observations_source browsers must match report browsers exactly");
  }
}

function validateBrowserArtifactBinding(report, modelCard, onnxSmoke, blockers) {
  const modelArtifactFile = validateReference(modelCard?.browser_artifact, "model-card.browser_artifact", blockers);
  const smokeArtifactFile = validateReference(onnxSmoke?.browser_artifact, "final_browser_onnx_smoke.browser_artifact", blockers);
  if (modelArtifactFile && !projectRelative(modelArtifactFile).startsWith("web/public/")) {
    blockers.push("model-card browser_artifact.path must be under web/public/");
  }
  if (modelArtifactFile && !projectRelative(modelArtifactFile).endsWith(".onnx")) {
    blockers.push("model-card browser_artifact.path must end with .onnx");
  }
  if (smokeArtifactFile && !projectRelative(smokeArtifactFile).endsWith(".onnx")) {
    blockers.push("final_browser_onnx_smoke browser_artifact.path must end with .onnx");
  }
  if (onnxSmoke?.model_card?.path !== report.model_card?.path) {
    blockers.push("final_browser_onnx_smoke model_card.path must match report model_card.path");
  }
  if (onnxSmoke?.model_card?.sha256 !== report.model_card?.sha256) {
    blockers.push("final_browser_onnx_smoke model_card.sha256 must match report model_card.sha256");
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
}

function validateReport(report, reportPath) {
  const blockers = [];
  if (report.schema_version !== "asl-pilot-final-browser-compatibility/v1") {
    blockers.push("schema_version must be asl-pilot-final-browser-compatibility/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (!isIsoDate(report.tested_at) || String(report.tested_at).includes("YYYY")) {
    blockers.push("tested_at must be a real ISO-compatible date string");
  }
  if (!report.runner || typeof report.runner !== "object" || Array.isArray(report.runner)) {
    blockers.push("runner must be an object");
  } else {
    const command = report.runner.command;
    if (!Array.isArray(command) || command.length === 0) {
      blockers.push("runner.command must be a non-empty command array");
    } else if (!command.some((value) => typeof value === "string" && value.endsWith("scripts/run_final_browser_compatibility.mjs"))) {
      blockers.push("runner.command must invoke scripts/run_final_browser_compatibility.mjs");
    } else {
      if (!command.includes("--write")) {
        blockers.push("runner.command must include --write for retained final compatibility evidence");
      }
      if (commandOptionValue(command, "--app-url") !== report.app_url) {
        blockers.push("runner.command --app-url must match report app_url");
      }
      if (commandOptionValue(command, "--observations") !== report.observations_source?.path) {
        blockers.push("runner.command --observations must match observations_source.path");
      }
      if (commandOptionValue(command, "--output") !== projectRelative(reportPath)) {
        blockers.push("runner.command --output must match the retained final compatibility report path");
      }
    }
    const script = validateReference(report.runner.script, "runner.script", blockers);
    if (script && projectRelative(script) !== "scripts/run_final_browser_compatibility.mjs") {
      blockers.push("runner.script.path must be scripts/run_final_browser_compatibility.mjs");
    }
  }
  if (report.output !== projectRelative(reportPath)) {
    blockers.push("output must match the retained final compatibility report path");
  }
  if (typeof report.app_url !== "string" || report.app_url.trim().length === 0) {
    blockers.push("app_url must be a non-empty string");
  } else {
    try {
      const url = new URL(report.app_url);
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
  }
  const modelCardFile = validateReference(report.model_card, "model_card", blockers);
  if (modelCardFile && projectRelative(modelCardFile) !== "web/public/model/model-card.json") {
    blockers.push("model_card.path must be web/public/model/model-card.json");
  }
  const onnxSmokeFile = validateReference(report.final_browser_onnx_smoke, "final_browser_onnx_smoke", blockers);
  if (onnxSmokeFile && projectRelative(onnxSmokeFile) !== "docs/validation/final-browser-onnx-smoke.json") {
    blockers.push("final_browser_onnx_smoke.path must be docs/validation/final-browser-onnx-smoke.json");
  }
  const observationsFile = validateReference(report.observations_source, "observations_source", blockers);
  if (observationsFile) {
    validateObservationsSource(observationsFile, report, blockers);
  }
  let modelCard = null;
  let onnxSmoke = null;
  if (modelCardFile) {
    modelCard = readJson(modelCardFile);
    if (modelCard.status !== "trained") blockers.push("model-card status must be trained");
  }
  if (onnxSmokeFile) {
    onnxSmoke = readJson(onnxSmokeFile);
    if (onnxSmoke.status !== "passed") blockers.push("final browser ONNX smoke status must be passed");
    if (onnxSmoke.inference?.ran_browser_inference !== true) {
      blockers.push("final browser ONNX smoke must include browser inference");
    }
    if (onnxSmoke.runtime?.execution_provider !== "wasm") {
      blockers.push("final browser ONNX smoke runtime.execution_provider must be wasm");
    }
  }
  validateBrowserArtifactBinding(report, modelCard, onnxSmoke, blockers);
  const evidenceContext = {
    app_url: report.app_url,
    model_card_sha256: report.model_card?.sha256,
    final_browser_onnx_smoke_sha256: report.final_browser_onnx_smoke?.sha256,
    browser_artifact_path: modelCard?.browser_artifact?.path,
    browser_artifact_sha256: modelCard?.browser_artifact?.sha256,
  };
  const rows = Array.isArray(report.browsers) ? report.browsers : [];
  if (rows.length < requiredBrowsers.size) {
    blockers.push(`browsers must include ${requiredBrowsers.size} required desktop browser rows`);
  }
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const browserId = validateBrowserRow(row, index, blockers, evidenceContext);
    if (browserId) seen.add(browserId);
  }
  for (const browserId of requiredBrowsers) {
    if (!seen.has(browserId)) blockers.push(`browsers must include ${browserId}`);
  }
  if (!Array.isArray(report.blockers)) {
    blockers.push("blockers must be an array");
  } else if (report.blockers.length > 0) {
    blockers.push("blockers must be empty");
  }
  return {
    status: blockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    report: {
      path: projectRelative(reportPath),
      exists: fs.existsSync(reportPath),
      sha256: fs.existsSync(reportPath) ? sha256File(reportPath) : null,
    },
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const reportPath = args.report ? resolveProjectPath(args.report, "--report") : defaultReportPath;
  if (!fs.existsSync(reportPath)) {
    const summary = {
      status: "incomplete",
      checked_at: new Date().toISOString(),
      report: {
        path: projectRelative(reportPath),
        exists: false,
        sha256: null,
      },
      blockers: [`Final browser compatibility report is missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Final browser compatibility audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Final browser compatibility audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final browser compatibility audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
