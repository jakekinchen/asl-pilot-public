import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "final-browser-onnx-smoke.json");
const defaultModelCardPath = path.join(root, "web", "public", "model", "model-card.json");
const defaultExportReportPath = path.join(
  root,
  "web",
  "public",
  "model",
  "asl-pilot-rawframe-v0-export-provenance.json",
);
const ortWasmPrefix = "/api/ort/";
const finalBrowserSmokeRoute = "/smoke/browser-onnx?mode=final";
const ortDistPath = path.join(root, "web", "node_modules", "onnxruntime-web", "dist");
const allowedBrowserEvidenceTypes = new Set(["screenshot", "trace", "network_log", "har", "console_log"]);

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
  node scripts/audit_final_browser_onnx_smoke.mjs [--report docs/validation/final-browser-onnx-smoke.json]

Fails until retained browser evidence proves the exact final ONNX artifact loads
through the app client model path with onnxruntime-web WASM and returns logits
for the final model-card labels.
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
  return typeof value === "string" && /\b(replace|placeholder|todo|tbd|yyyy|not-run)\b/i.test(value);
}

function containsSmokeOrSyntheticText(value) {
  if (typeof value === "string") return /\b(smoke|synthetic|not-asl|not_asl)\b/i.test(value);
  if (Array.isArray(value)) return value.some((item) => containsSmokeOrSyntheticText(item));
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsSmokeOrSyntheticText(item));
  }
  return false;
}

function finalPreflightCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    command: [command, ...args].join(" "),
    output: (result.stderr || result.stdout || "").trim(),
  };
}

function containsCommandFlag(value, flag) {
  if (typeof value === "string") return value.includes(flag);
  if (Array.isArray(value)) return value.some((item) => containsCommandFlag(item, flag));
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsCommandFlag(item, flag));
  }
  return false;
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function browserUrlForPublicPath(projectPath) {
  const publicPrefix = "web/public";
  if (typeof projectPath !== "string" || !projectPath.startsWith(publicPrefix)) return null;
  return projectPath.slice(publicPrefix.length);
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
  if (typeof reference.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
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

function validateBrowserEvidence(report, blockers) {
  const refs = report.evidence?.browser_files;
  if (!Array.isArray(refs) || refs.length < 2) {
    blockers.push("evidence.browser_files must include at least screenshot/trace and network evidence");
    return;
  }
  const seen = new Set();
  let hasVisualEvidence = false;
  let hasNetworkEvidence = false;
  for (const [index, ref] of refs.entries()) {
    const context = `evidence.browser_files[${index}]`;
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
      blockers.push(`${context} must be an object`);
      continue;
    }
    if (!allowedBrowserEvidenceTypes.has(ref.type)) {
      blockers.push(`${context}.type must be one of ${[...allowedBrowserEvidenceTypes].join(", ")}`);
    }
    if (["screenshot", "trace"].includes(ref.type)) hasVisualEvidence = true;
    if (["network_log", "har"].includes(ref.type)) hasNetworkEvidence = true;
    const file = validateReference(ref, context, blockers);
    if (file) {
      const relativePath = projectRelative(file);
      if (seen.has(relativePath)) {
        blockers.push(`${context}.path duplicates an earlier browser evidence path: ${relativePath}`);
      }
      seen.add(relativePath);
    }
    if (typeof ref.purpose !== "string" || ref.purpose.trim().length < 12 || hasPlaceholderText(ref.purpose)) {
      blockers.push(`${context}.purpose must describe the retained browser evidence`);
    }
  }
  if (!hasVisualEvidence) blockers.push("evidence.browser_files must include screenshot or trace evidence");
  if (!hasNetworkEvidence) blockers.push("evidence.browser_files must include network-log or HAR evidence");
}

function validateNetworkLogEntry(entry, context, appOrigin, blockers) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  let parsed = null;
  try {
    parsed = new URL(entry.url);
  } catch {
    blockers.push(`${context}.url must be a valid URL`);
  }
  if (entry.method !== "GET") blockers.push(`${context}.method must be GET`);
  if (typeof entry.resource_type !== "string" || entry.resource_type.trim().length === 0) {
    blockers.push(`${context}.resource_type must be a non-empty string`);
  }
  if (entry.status !== 200) blockers.push(`${context}.status must be 200`);
  if (entry.ok !== true) blockers.push(`${context}.ok must be true`);
  if (typeof entry.content_type !== "string" || entry.content_type.trim().length === 0) {
    blockers.push(`${context}.content_type must be a non-empty string`);
  }
  if (!Number.isInteger(entry.bytes) || entry.bytes <= 0) blockers.push(`${context}.bytes must be a positive integer`);
  if (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
  }
  if (entry.same_origin !== true) blockers.push(`${context}.same_origin must be true`);
  if (parsed && parsed.origin !== appOrigin) blockers.push(`${context}.url must be same-origin with runner.app_url`);
  return parsed;
}

function validateFinalBrowserNetworkLog(report, blockers) {
  const networkRefs = (report.evidence?.browser_files ?? []).filter((ref) => ref?.type === "network_log");
  if (networkRefs.length !== 1) {
    blockers.push("evidence.browser_files must include exactly one final browser ONNX network_log");
    return;
  }
  const networkFile = validateReference(networkRefs[0], "final browser ONNX network_log", blockers);
  if (!networkFile) return;
  let log;
  try {
    log = readJson(networkFile);
  } catch (error) {
    blockers.push(`final browser ONNX network_log must be valid JSON: ${error.message}`);
    return;
  }
  if (log.schema_version !== "asl-pilot-final-browser-onnx-smoke-network-log/v2") {
    blockers.push("final browser ONNX network_log schema_version must be asl-pilot-final-browser-onnx-smoke-network-log/v2");
  }
  if (log.app_url !== report.runner?.app_url) {
    blockers.push("final browser ONNX network_log app_url must match runner.app_url");
  }
  let appOrigin = null;
  try {
    appOrigin = new URL(report.runner?.app_url).origin;
  } catch {
    blockers.push("runner.app_url must be valid before network log origin checks");
  }
  if (appOrigin && log.app_origin !== appOrigin) {
    blockers.push("final browser ONNX network_log app_origin must match runner.app_url origin");
  }
  if (log.browser !== report.runner?.browser) {
    blockers.push("final browser ONNX network_log browser must match runner.browser");
  }
  if (!isIsoDate(log.checked_at)) {
    blockers.push("final browser ONNX network_log checked_at must be an ISO-compatible timestamp");
  }
  if (!Array.isArray(log.unexpected_external_requests)) {
    blockers.push("final browser ONNX network_log unexpected_external_requests must be an array");
  } else if (log.unexpected_external_requests.length > 0) {
    blockers.push("final browser ONNX network_log unexpected_external_requests must be empty");
  }
  if (!Array.isArray(log.final_onnx_requests) || log.final_onnx_requests.length === 0) {
    blockers.push("final browser ONNX network_log must include at least one final_onnx_requests entry");
  }
  if (!Array.isArray(log.ort_wasm_requests) || log.ort_wasm_requests.length === 0) {
    blockers.push("final browser ONNX network_log must include at least one ort_wasm_requests entry");
  }
  const expectedArtifactUrl = browserUrlForPublicPath(report.browser_artifact?.path);
  let matchedArtifactFetch = false;
  if (Array.isArray(log.final_onnx_requests) && appOrigin) {
    for (const [index, entry] of log.final_onnx_requests.entries()) {
      const parsed = validateNetworkLogEntry(entry, `final_onnx_requests[${index}]`, appOrigin, blockers);
      if (parsed && parsed.pathname !== expectedArtifactUrl) {
        blockers.push(`final_onnx_requests[${index}].url must fetch ${expectedArtifactUrl}`);
      }
      if (entry.sha256 === report.browser_artifact?.sha256) matchedArtifactFetch = true;
    }
  }
  if (!matchedArtifactFetch) {
    blockers.push("final browser ONNX network_log must include a final ONNX fetch whose sha256 matches browser_artifact.sha256");
  }
  if (Array.isArray(log.ort_wasm_requests) && appOrigin) {
    for (const [index, entry] of log.ort_wasm_requests.entries()) {
      const parsed = validateNetworkLogEntry(entry, `ort_wasm_requests[${index}]`, appOrigin, blockers);
      if (!parsed) continue;
      if (!parsed.pathname.startsWith(ortWasmPrefix) || !parsed.pathname.endsWith(".wasm")) {
        blockers.push(`ort_wasm_requests[${index}].url must fetch an ORT WASM asset from ${ortWasmPrefix}`);
        continue;
      }
      const wasmFile = path.join(ortDistPath, path.basename(parsed.pathname));
      if (!wasmFile.startsWith(`${ortDistPath}${path.sep}`) || !fs.existsSync(wasmFile)) {
        blockers.push(`ort_wasm_requests[${index}] local ORT WASM file is missing: ${path.basename(parsed.pathname)}`);
      } else if (entry.sha256 !== sha256File(wasmFile)) {
        blockers.push(`ort_wasm_requests[${index}].sha256 must match local onnxruntime-web dist asset ${path.basename(parsed.pathname)}`);
      }
    }
  }
  if (report.network?.final_onnx_request_count !== log.final_onnx_requests?.length) {
    blockers.push("network.final_onnx_request_count must match network log final_onnx_requests length");
  }
  if (report.network?.ort_wasm_request_count !== log.ort_wasm_requests?.length) {
    blockers.push("network.ort_wasm_request_count must match network log ort_wasm_requests length");
  }
}

function validateSourceReferences(report, blockers) {
  const refs = report.evidence?.source_files;
  if (!Array.isArray(refs) || refs.length === 0) {
    blockers.push("evidence.source_files must be a non-empty array");
    return;
  }
  const required = new Set([
    "scripts/run_final_browser_onnx_smoke.mjs",
    "web/src/lib/client-model.ts",
    "web/src/app/smoke/browser-onnx/page.tsx",
    "web/src/app/api/ort/[file]/route.ts",
    "web/public/model/model-card.json",
    "web/public/model/asl-pilot-rawframe-v0-export-provenance.json",
    "web/package-lock.json",
  ]);
  if (typeof report.browser_parity_fixture?.path === "string") {
    required.add(report.browser_parity_fixture.path);
  }
  const seen = new Set();
  for (const [index, ref] of refs.entries()) {
    const file = validateReference(ref, `evidence.source_files[${index}]`, blockers);
    if (file) seen.add(projectRelative(file));
  }
  for (const requiredPath of required) {
    if (!seen.has(requiredPath)) blockers.push(`evidence.source_files must include ${requiredPath}`);
  }
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function validateBase64Sha256(value, expectedSha256, context, blockers) {
  if (typeof value !== "string" || value.trim().length === 0) {
    blockers.push(`${context}.base64 must be a non-empty string`);
    return null;
  }
  let buffer;
  try {
    buffer = Buffer.from(value, "base64");
  } catch {
    blockers.push(`${context}.base64 must be valid base64`);
    return null;
  }
  if (buffer.length === 0) blockers.push(`${context}.base64 must decode to non-empty bytes`);
  const actual = sha256Buffer(buffer);
  if (actual !== expectedSha256) {
    blockers.push(`${context}.sha256 must match base64 payload; expected ${expectedSha256}, got ${actual}`);
  }
  return buffer;
}

function float32ValuesFromBuffer(buffer, context, blockers) {
  if (!buffer) return [];
  if (buffer.byteLength % 4 !== 0) {
    blockers.push(`${context}.base64 byte length must be float32-aligned`);
    return [];
  }
  return Array.from(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4));
}

function valuesMatchFloat32Payload(values, payloadValues) {
  return Array.isArray(values) &&
    values.length === payloadValues.length &&
    values.every((value, index) => typeof value === "number" && Math.abs(value - payloadValues[index]) <= 1e-7);
}

function validateBrowserParityFixture(report, exportReport, modelCard, fixtureFile, blockers) {
  if (!fixtureFile) return null;
  let fixture;
  try {
    fixture = readJson(fixtureFile);
  } catch (error) {
    blockers.push(`browser_parity_fixture must be valid JSON: ${error.message}`);
    return null;
  }
  if (fixture.schema_version !== "asl-pilot-browser-parity-fixture/v1") {
    blockers.push("browser_parity_fixture schema_version must be asl-pilot-browser-parity-fixture/v1");
  }
  if (fixture.status !== "ready") blockers.push("browser_parity_fixture status must be ready");
  if (!isIsoDate(fixture.created_at)) blockers.push("browser_parity_fixture created_at must be an ISO-compatible timestamp");
  for (const [key, context] of [
    ["checkpoint", "browser_parity_fixture.checkpoint"],
    ["training_provenance", "browser_parity_fixture.training_provenance"],
    ["browser_artifact", "browser_parity_fixture.browser_artifact"],
  ]) {
    validateReference(fixture[key], context, blockers);
  }
  validateReference(fixture.source_clip?.manifest, "browser_parity_fixture.source_clip.manifest", blockers);
  validateReference(fixture.source_clip?.tensor_file, "browser_parity_fixture.source_clip.tensor_file", blockers);
  if (fixture.source_clip?.frame_tensor_sha256 !== fixture.source_clip?.tensor_file?.sha256) {
    blockers.push("browser_parity_fixture source_clip.frame_tensor_sha256 must match source_clip.tensor_file.sha256");
  }
  if (exportReport?.checkpoint && fixture.checkpoint?.sha256 !== exportReport.checkpoint.sha256) {
    blockers.push("browser_parity_fixture checkpoint must match ONNX export provenance checkpoint");
  }
  if (exportReport?.training_provenance && fixture.training_provenance?.sha256 !== exportReport.training_provenance.sha256) {
    blockers.push("browser_parity_fixture training_provenance must match ONNX export provenance training_provenance");
  }
  if (fixture.browser_artifact?.path !== report.browser_artifact?.path) {
    blockers.push("browser_parity_fixture browser_artifact.path must match final report browser_artifact.path");
  }
  if (fixture.browser_artifact?.sha256 !== report.browser_artifact?.sha256) {
    blockers.push("browser_parity_fixture browser_artifact.sha256 must match final report browser_artifact.sha256");
  }
  const labelCount = modelCard ? Object.keys(modelCard.model?.label_to_index ?? {}).length : null;
  if (!Array.isArray(fixture.model?.input_shape) || fixture.model.input_shape.length !== 5) {
    blockers.push("browser_parity_fixture model.input_shape must be 5D");
  }
  if (!Array.isArray(fixture.model?.logits_shape) || fixture.model.logits_shape.length !== 2) {
    blockers.push("browser_parity_fixture model.logits_shape must be 2D");
  }
  if (Number.isInteger(labelCount) && fixture.model?.label_count !== labelCount) {
    blockers.push("browser_parity_fixture model.label_count must match model-card label count");
  }
  if (Number.isInteger(labelCount) && !sameArray(fixture.model?.logits_shape, [1, labelCount])) {
    blockers.push("browser_parity_fixture model.logits_shape must be [1, model-card label count]");
  }
  if (!sameArray(fixture.input_tensor?.shape, fixture.model?.input_shape ?? [])) {
    blockers.push("browser_parity_fixture input_tensor.shape must match model.input_shape");
  }
  if (!sameArray(fixture.expected_logits?.shape, fixture.model?.logits_shape ?? [])) {
    blockers.push("browser_parity_fixture expected_logits.shape must match model.logits_shape");
  }
  if (fixture.input_tensor?.dtype !== "float32" || fixture.input_tensor?.layout !== "N,T,C,H,W") {
    blockers.push("browser_parity_fixture input_tensor must be float32 N,T,C,H,W");
  }
  if (fixture.input_tensor?.encoding !== "base64_le_float32") {
    blockers.push("browser_parity_fixture input_tensor.encoding must be base64_le_float32");
  }
  if (typeof fixture.input_tensor?.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(fixture.input_tensor.sha256)) {
    blockers.push("browser_parity_fixture input_tensor.sha256 must be a SHA-256 digest");
  } else {
    validateBase64Sha256(fixture.input_tensor.base64, fixture.input_tensor.sha256, "browser_parity_fixture.input_tensor", blockers);
  }
  if (fixture.expected_logits?.dtype !== "float32") {
    blockers.push("browser_parity_fixture expected_logits.dtype must be float32");
  }
  if (typeof fixture.expected_logits?.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(fixture.expected_logits.sha256)) {
    blockers.push("browser_parity_fixture expected_logits.sha256 must be a SHA-256 digest");
  } else {
    const logitsBytes = validateBase64Sha256(
      fixture.expected_logits.base64,
      fixture.expected_logits.sha256,
      "browser_parity_fixture.expected_logits",
      blockers,
    );
    const payloadValues = float32ValuesFromBuffer(
      logitsBytes,
      "browser_parity_fixture.expected_logits",
      blockers,
    );
    if (payloadValues.length > 0 && !valuesMatchFloat32Payload(fixture.expected_logits.values, payloadValues)) {
      blockers.push("browser_parity_fixture expected_logits.values must match the hash-pinned base64 payload");
    }
  }
  if (!Array.isArray(fixture.expected_logits?.values)) {
    blockers.push("browser_parity_fixture expected_logits.values must be an array");
  } else if (Number.isInteger(labelCount) && fixture.expected_logits.values.length !== labelCount) {
    blockers.push("browser_parity_fixture expected_logits.values length must match model-card label count");
  }
  if (typeof fixture.model?.expected_top_label_id !== "string" || !fixture.model.expected_top_label_id.trim()) {
    blockers.push("browser_parity_fixture model.expected_top_label_id must be a non-empty string");
  } else if (modelCard && !Object.prototype.hasOwnProperty.call(modelCard.model?.label_to_index ?? {}, fixture.model.expected_top_label_id)) {
    blockers.push("browser_parity_fixture model.expected_top_label_id must exist in model-card labels");
  }
  for (const key of ["max_abs_diff", "max_rel_diff"]) {
    const value = fixture.tolerance?.[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 0.001) {
      blockers.push(`browser_parity_fixture tolerance.${key} must be a finite number between 0 and 0.001`);
    }
  }
  return fixture;
}

function validateBrowserParityResult(report, fixture, blockers) {
  const parity = report.inference?.parity;
  if (!parity || typeof parity !== "object" || Array.isArray(parity)) {
    blockers.push("inference.parity must be present");
    return;
  }
  if (parity.status !== "passed") blockers.push("inference.parity.status must be passed");
  if (parity.fixture_schema_version !== "asl-pilot-browser-parity-fixture/v1") {
    blockers.push("inference.parity.fixture_schema_version must be asl-pilot-browser-parity-fixture/v1");
  }
  if (parity.fixture_sha256 !== report.browser_parity_fixture?.sha256) {
    blockers.push("inference.parity.fixture_sha256 must match browser_parity_fixture.sha256");
  }
  if (fixture) {
    if (parity.input_tensor_sha256 !== fixture.input_tensor?.sha256) {
      blockers.push("inference.parity.input_tensor_sha256 must match browser parity fixture input tensor");
    }
    if (parity.expected_logits_sha256 !== fixture.expected_logits?.sha256) {
      blockers.push("inference.parity.expected_logits_sha256 must match browser parity fixture expected logits");
    }
    if (parity.expected_top_label_id !== fixture.model?.expected_top_label_id) {
      blockers.push("inference.parity.expected_top_label_id must match browser parity fixture top label");
    }
    if (parity.actual_top_label_id !== fixture.model?.expected_top_label_id) {
      blockers.push("inference.parity.actual_top_label_id must match PyTorch fixture top label");
    }
    if (typeof parity.max_abs_diff === "number" && parity.max_abs_diff > fixture.tolerance?.max_abs_diff) {
      blockers.push("inference.parity.max_abs_diff exceeds fixture tolerance");
    }
    if (typeof parity.max_rel_diff === "number" && parity.max_rel_diff > fixture.tolerance?.max_rel_diff) {
      blockers.push("inference.parity.max_rel_diff exceeds fixture tolerance");
    }
  }
  if (typeof parity.actual_logits_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(parity.actual_logits_sha256)) {
    blockers.push("inference.parity.actual_logits_sha256 must be a SHA-256 digest");
  }
  for (const key of ["max_abs_diff", "max_rel_diff"]) {
    if (typeof parity[key] !== "number" || !Number.isFinite(parity[key]) || parity[key] < 0) {
      blockers.push(`inference.parity.${key} must be a non-negative finite number`);
    }
  }
}

function validateRunnerReceipt(report, blockers) {
  const command = report.runner?.command;
  if (!Array.isArray(command) || command.length === 0) {
    blockers.push("runner.command must be a non-empty command array written by the runner");
  } else {
    for (const [index, value] of command.entries()) {
      if (typeof value !== "string" || value.trim().length === 0 || hasPlaceholderText(value)) {
        blockers.push(`runner.command[${index}] must be a non-placeholder string`);
      }
    }
    if (!command.some((value) => value.endsWith("scripts/run_final_browser_onnx_smoke.mjs"))) {
      blockers.push("runner.command must invoke scripts/run_final_browser_onnx_smoke.mjs");
    }
    if (!command.includes("--write")) {
      blockers.push("runner.command must include --write for retained final evidence");
    }
  }
  const script = validateReference(report.runner?.script, "runner.script", blockers);
  if (script && projectRelative(script) !== "scripts/run_final_browser_onnx_smoke.mjs") {
    blockers.push("runner.script.path must be scripts/run_final_browser_onnx_smoke.mjs");
  }
}

function validateServingPreflight(report, blockers) {
  const serving = report.serving_preflight;
  if (!serving || typeof serving !== "object" || Array.isArray(serving)) {
    blockers.push("serving_preflight must be an object");
    return;
  }
  if (typeof serving.command !== "string" || !serving.command.includes("scripts/audit_final_browser_serving_preflight.mjs")) {
    blockers.push("serving_preflight.command must invoke scripts/audit_final_browser_serving_preflight.mjs");
  }
  if (serving.status !== "passed") {
    blockers.push("serving_preflight.status must be passed");
  }
  if (typeof serving.output_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(serving.output_sha256)) {
    blockers.push("serving_preflight.output_sha256 must be a lowercase SHA-256 digest");
  }
  const preflightReport = serving.report;
  if (!preflightReport || typeof preflightReport !== "object" || Array.isArray(preflightReport)) {
    blockers.push("serving_preflight.report must be the parsed serving preflight JSON report");
    return;
  }
  if (preflightReport.schema_version !== "asl-pilot-final-browser-serving-preflight/v1") {
    blockers.push("serving_preflight.report.schema_version must be asl-pilot-final-browser-serving-preflight/v1");
  }
  if (preflightReport.status !== "passed") {
    blockers.push("serving_preflight.report.status must be passed");
  }
  if (Array.isArray(preflightReport.blockers) && preflightReport.blockers.length > 0) {
    blockers.push("serving_preflight.report.blockers must be empty");
  }
  if (preflightReport.model_card?.path !== "web/public/model/model-card.json") {
    blockers.push("serving_preflight.report.model_card.path must be web/public/model/model-card.json");
  }
  const currentModelCardSha256 = fs.existsSync(defaultModelCardPath) ? sha256File(defaultModelCardPath) : null;
  if (preflightReport.model_card?.sha256 !== currentModelCardSha256) {
    blockers.push("serving_preflight.report.model_card.sha256 must match the current model card hash");
  }
  if (preflightReport.model_card?.status !== "trained") {
    blockers.push("serving_preflight.report.model_card.status must be trained");
  }
  const checks = new Map(
    Array.isArray(preflightReport.checks)
      ? preflightReport.checks.map((check) => [check?.id, check])
      : [],
  );
  for (const id of ["practice_root", "served_model_card", "dataset_plan_disabled"]) {
    if (checks.get(id)?.ok !== true) {
      blockers.push(`serving_preflight.report check ${id} must pass`);
    }
  }
}

function validateReport(report, reportPath) {
  const blockers = [];
  for (const check of [
    finalPreflightCommand("node", ["scripts/audit_model_artifacts.mjs", "--require-trained"]),
    finalPreflightCommand("node", ["scripts/promote_trained_model_card.mjs", "--dry-run"]),
  ]) {
    if (!check.ok) {
      blockers.push(`${check.command} must pass before accepting final browser ONNX evidence: ${check.output}`);
    }
  }
  if (report.schema_version !== "asl-pilot-final-browser-onnx-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-final-browser-onnx-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push("blockers must be empty when status is passed");
  }
  if (!isIsoDate(report.tested_at) || String(report.tested_at).includes("YYYY")) {
    blockers.push("tested_at must be a real ISO-compatible date string");
  }
  if (!report.runner || typeof report.runner !== "object" || Array.isArray(report.runner)) {
    blockers.push("runner must be an object");
  } else {
    for (const key of ["tool", "browser", "app_url"]) {
      if (typeof report.runner[key] !== "string" || report.runner[key].trim().length === 0) {
        blockers.push(`runner.${key} must be a non-empty string`);
      } else if (hasPlaceholderText(report.runner[key])) {
        blockers.push(`runner.${key} must not contain placeholder text`);
      }
    }
    if (report.runner.tool !== "playwright") {
      blockers.push("runner.tool must be playwright");
    }
    try {
      const url = new URL(report.runner.app_url);
      const localhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      if (url.protocol !== "https:" && !localhost) {
        blockers.push("runner.app_url must use HTTPS or localhost/loopback");
      }
    } catch {
      blockers.push("runner.app_url must be a valid URL");
    }
  }
  validateRunnerReceipt(report, blockers);
  validateServingPreflight(report, blockers);

  const modelCardFile = validateReference(report.model_card, "model_card", blockers);
  const exportReportFile = validateReference(report.onnx_export_provenance, "onnx_export_provenance", blockers);
  const parityFixtureFile = validateReference(report.browser_parity_fixture, "browser_parity_fixture", blockers);
  const browserArtifactFile = validateReference(report.browser_artifact, "browser_artifact", blockers);

  const modelCardPath = defaultModelCardPath;
  const exportReportPath = defaultExportReportPath;
  if (modelCardFile && modelCardFile !== modelCardPath) {
    blockers.push("model_card.path must be web/public/model/model-card.json");
  }
  if (exportReportFile && exportReportFile !== exportReportPath) {
    blockers.push("onnx_export_provenance.path must be web/public/model/asl-pilot-rawframe-v0-export-provenance.json");
  }

  let modelCard = null;
  let exportReport = null;
  if (fs.existsSync(modelCardPath)) modelCard = readJson(modelCardPath);
  if (fs.existsSync(exportReportPath)) exportReport = readJson(exportReportPath);
  if (modelCard?.status !== "trained") blockers.push("model-card status must be trained");
  if (exportReport?.status !== "exported") blockers.push("ONNX export provenance status must be exported");
  if (exportReport?.evidence_mode !== "final") {
    blockers.push("ONNX export provenance evidence_mode must be final");
  }
  if (exportReport?.generated_by?.evidence_mode !== "final") {
    blockers.push("ONNX export provenance generated_by.evidence_mode must be final");
  }
  if (exportReport?.generated_by?.allow_smoke_export !== false) {
    blockers.push("ONNX export provenance generated_by.allow_smoke_export must be false");
  }
  if (containsCommandFlag(exportReport, "--allow-smoke-export")) {
    blockers.push("ONNX export provenance must not include --allow-smoke-export");
  }
  if (containsSmokeOrSyntheticText(exportReport)) {
    blockers.push("ONNX export provenance must not contain smoke, synthetic, or not-ASL markers");
  }
  if (exportReport?.finality !== "candidate_final_artifact") {
    blockers.push("ONNX export provenance finality must be candidate_final_artifact");
  }
  if (!exportReport?.browser_parity_fixture) {
    blockers.push("ONNX export provenance must include browser_parity_fixture");
  } else {
    if (report.browser_parity_fixture?.path !== exportReport.browser_parity_fixture.path) {
      blockers.push("browser_parity_fixture.path must match ONNX export provenance");
    }
    if (report.browser_parity_fixture?.sha256 !== exportReport.browser_parity_fixture.sha256) {
      blockers.push("browser_parity_fixture.sha256 must match ONNX export provenance");
    }
  }
  if (
    exportReport?.browser_artifact?.path &&
    report.browser_artifact?.path !== exportReport.browser_artifact.path
  ) {
    blockers.push("browser_artifact.path must match ONNX export provenance");
  }
  if (
    exportReport?.browser_artifact?.sha256 &&
    report.browser_artifact?.sha256 !== exportReport.browser_artifact.sha256
  ) {
    blockers.push("browser_artifact.sha256 must match ONNX export provenance");
  }
  if (
    modelCard?.browser_artifact?.path &&
    report.browser_artifact?.path !== modelCard.browser_artifact.path
  ) {
    blockers.push("browser_artifact.path must match model-card browser_artifact");
  }
  if (
    modelCard?.browser_artifact?.sha256 &&
    report.browser_artifact?.sha256 !== modelCard.browser_artifact.sha256
  ) {
    blockers.push("browser_artifact.sha256 must match model-card browser_artifact");
  }
  if (browserArtifactFile && !String(report.browser_artifact?.path ?? "").endsWith(".onnx")) {
    blockers.push("browser_artifact.path must end with .onnx");
  }

  if (report.runtime?.package !== "onnxruntime-web") {
    blockers.push("runtime.package must be onnxruntime-web");
  }
  if (typeof report.runtime?.version !== "string" || report.runtime.version.trim().length === 0) {
    blockers.push("runtime.version must be a non-empty string");
  }
  if (report.runtime?.execution_provider !== "wasm") {
    blockers.push("runtime.execution_provider must be wasm");
  }
  if (report.inference?.ran_browser_inference !== true) {
    blockers.push("inference.ran_browser_inference must be true");
  }
  if (report.inference?.client_model_path !== "web/src/lib/client-model.ts") {
    blockers.push("inference.client_model_path must be web/src/lib/client-model.ts");
  }
  if (report.inference?.app_route !== finalBrowserSmokeRoute) {
    blockers.push(`inference.app_route must be ${finalBrowserSmokeRoute}`);
  }
  if (report.inference?.mode !== "final_artifact") {
    blockers.push("inference.mode must be final_artifact");
  }
  if (report.inference?.app_wasm_route !== ortWasmPrefix) {
    blockers.push(`inference.app_wasm_route must be ${ortWasmPrefix}`);
  }
  if (!Array.isArray(report.inference?.input_shape) || report.inference.input_shape.length !== 5) {
    blockers.push("inference.input_shape must be a 5D ONNX input shape");
  }
  if (!Array.isArray(report.inference?.logits_shape) || report.inference.logits_shape.length !== 2) {
    blockers.push("inference.logits_shape must be a 2D logits shape");
  }
  const labelCount = modelCard ? Object.keys(modelCard.model?.label_to_index ?? {}).length : null;
  if (Number.isInteger(labelCount) && (labelCount < 75 || labelCount > 100)) {
    blockers.push(`model-card label count must be 75-100; found ${labelCount}`);
  }
  if (modelCard && report.inference?.model_id !== modelCard.model_id) {
    blockers.push("inference.model_id must match model-card model_id");
  }
  if (report.inference?.artifact_path !== report.browser_artifact?.path) {
    blockers.push("inference.artifact_path must match browser_artifact.path");
  }
  if (modelCard && report.inference?.frame_count !== modelCard.model?.frame_count) {
    blockers.push("inference.frame_count must match model-card frame_count");
  }
  if (modelCard && report.inference?.image_size !== modelCard.model?.image_size) {
    blockers.push("inference.image_size must match model-card image_size");
  }
  if (Number.isInteger(labelCount) && report.inference?.label_count !== labelCount) {
    blockers.push("inference.label_count must match model-card label count");
  }
  if (typeof report.inference?.predicted_id !== "string" || report.inference.predicted_id.trim().length === 0) {
    blockers.push("inference.predicted_id must be a non-empty string from the app client probe");
  }
  if (typeof report.inference?.confidence !== "number" || report.inference.confidence < 0 || report.inference.confidence > 1) {
    blockers.push("inference.confidence must be a probability from the app client probe");
  }
  if (modelCard && !sameArray(report.inference?.input_shape, [
    1,
    modelCard.model?.frame_count,
    3,
    modelCard.model?.image_size,
    modelCard.model?.image_size,
  ])) {
    blockers.push("inference.input_shape must match model-card frame_count and image_size");
  }
  if (Number.isInteger(labelCount) && !sameArray(report.inference?.logits_shape, [1, labelCount])) {
    blockers.push("inference.logits_shape must be [1, model-card label count]");
  }
  if (
    Number.isInteger(labelCount) &&
    Array.isArray(report.inference?.logits_shape) &&
    report.inference.logits_shape[1] !== labelCount
  ) {
    blockers.push(`inference.logits_shape[1] must match model-card label count ${labelCount}`);
  }
  if (typeof report.inference?.latency_ms !== "number" || report.inference.latency_ms <= 0) {
    blockers.push("inference.latency_ms must be greater than zero");
  }
  if (!Array.isArray(report.inference?.session_input_names) || report.inference.session_input_names.length === 0) {
    blockers.push("inference.session_input_names must be a non-empty array");
  }
  if (!Array.isArray(report.inference?.session_output_names) || report.inference.session_output_names.length === 0) {
    blockers.push("inference.session_output_names must be a non-empty array");
  }
  if (typeof report.inference?.output_type !== "string" || report.inference.output_type.trim().length === 0) {
    blockers.push("inference.output_type must be a non-empty string");
  }
  if (typeof report.inference?.browser_fetched_artifact_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(report.inference.browser_fetched_artifact_sha256)) {
    blockers.push("inference.browser_fetched_artifact_sha256 must be a lowercase SHA-256 digest");
  } else if (report.browser_artifact?.sha256 && report.inference.browser_fetched_artifact_sha256 !== report.browser_artifact.sha256) {
    blockers.push("inference.browser_fetched_artifact_sha256 must match the final browser artifact hash");
  }
  const parityFixture = validateBrowserParityFixture(report, exportReport, modelCard, parityFixtureFile, blockers);
  validateBrowserParityResult(report, parityFixture, blockers);
  if (!Array.isArray(report.network?.unexpected_external_requests)) {
    blockers.push("network.unexpected_external_requests must be an array");
  } else if (report.network.unexpected_external_requests.length > 0) {
    blockers.push("network.unexpected_external_requests must be empty");
  }
  if (!Number.isInteger(report.network?.final_onnx_request_count) || report.network.final_onnx_request_count < 1) {
    blockers.push("network.final_onnx_request_count must be a positive integer");
  }
  if (!Number.isInteger(report.network?.ort_wasm_request_count) || report.network.ort_wasm_request_count < 1) {
    blockers.push("network.ort_wasm_request_count must be a positive integer");
  }
  validateBrowserEvidence(report, blockers);
  validateFinalBrowserNetworkLog(report, blockers);
  validateSourceReferences(report, blockers);

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
      blockers: [`Final browser ONNX smoke report is missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Final browser ONNX smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Final browser ONNX smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final browser ONNX smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
