import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "browser-onnx-wiring-smoke.json");
const allowedBrowserEvidenceTypes = new Set(["screenshot", "trace", "network_log", "har", "console_log"]);
const expectedPublicArtifactPath =
  "web/public/model/browser-onnx-wiring-smoke/asl-pilot-browser-onnx-wiring-smoke.onnx";

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
  node scripts/audit_browser_onnx_wiring_smoke.mjs [--report docs/validation/browser-onnx-wiring-smoke.json]

Audits the retained smoke-only browser ONNX wiring proof. This audit rejects
any report that tries to claim final trained-model evidence.
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

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function validateBrowserEvidence(report, blockers) {
  const refs = report.evidence?.browser_files;
  if (!Array.isArray(refs) || refs.length < 2) {
    blockers.push("evidence.browser_files must include screenshot/trace and network evidence");
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
      if (seen.has(relativePath)) blockers.push(`${context}.path duplicates an earlier browser evidence path`);
      seen.add(relativePath);
    }
    if (typeof ref.purpose !== "string" || ref.purpose.trim().length < 12 || hasPlaceholderText(ref.purpose)) {
      blockers.push(`${context}.purpose must describe the retained browser evidence`);
    }
  }
  if (!hasVisualEvidence) blockers.push("evidence.browser_files must include screenshot or trace evidence");
  if (!hasNetworkEvidence) blockers.push("evidence.browser_files must include network-log or HAR evidence");
}

function validateSourceReferences(report, blockers) {
  const refs = report.evidence?.source_files;
  if (!Array.isArray(refs) || refs.length === 0) {
    blockers.push("evidence.source_files must be a non-empty array");
    return;
  }
  const required = new Set([
    "scripts/run_browser_onnx_wiring_smoke.mjs",
    "scripts/audit_browser_onnx_wiring_smoke.mjs",
    "web/src/app/smoke/browser-onnx/page.tsx",
    "web/src/app/api/ort/[file]/route.ts",
    "web/src/lib/client-model.ts",
    "web/package-lock.json",
  ]);
  const seen = new Set();
  for (const [index, ref] of refs.entries()) {
    const file = validateReference(ref, `evidence.source_files[${index}]`, blockers);
    if (file) seen.add(projectRelative(file));
  }
  for (const requiredPath of required) {
    if (!seen.has(requiredPath)) blockers.push(`evidence.source_files must include ${requiredPath}`);
  }
}

function validateSmokeModelCard(modelCard, artifactReference, blockers) {
  if (modelCard.model_id !== "asl-pilot-browser-onnx-wiring-smoke-v0") {
    blockers.push("smoke model-card model_id must be asl-pilot-browser-onnx-wiring-smoke-v0");
  }
  if (modelCard.status !== "trained") blockers.push("smoke model-card status must be trained for client wiring only");
  if (modelCard.export_format !== "onnx") blockers.push("smoke model-card export_format must be onnx");
  if (modelCard.evidence_mode !== "smoke") blockers.push("smoke model-card evidence_mode must be smoke");
  if (modelCard.finality !== "smoke_only") blockers.push("smoke model-card finality must be smoke_only");
  if (modelCard.browser_artifact?.path !== expectedPublicArtifactPath) {
    blockers.push(`smoke model-card browser_artifact.path must be ${expectedPublicArtifactPath}`);
  }
  if (modelCard.browser_artifact?.sha256 !== artifactReference.sha256) {
    blockers.push("smoke model-card browser_artifact.sha256 must match smoke_browser_artifact.sha256");
  }
  const labels = modelCard.model?.label_to_index ?? {};
  if (modelCard.model?.frame_count !== 3) blockers.push("smoke model-card model.frame_count must be 3");
  if (modelCard.model?.image_size !== 16) blockers.push("smoke model-card model.image_size must be 16");
  if (modelCard.model?.input_name !== "clips") blockers.push("smoke model-card model.input_name must be clips");
  if (modelCard.model?.output_name !== "logits") blockers.push("smoke model-card model.output_name must be logits");
  if (labels.hello !== 0 || labels.goodbye !== 1 || Object.keys(labels).length !== 2) {
    blockers.push("smoke model-card label_to_index must be exactly hello=0, goodbye=1");
  }
  if (modelCard.confidence_thresholds?.default !== 0.5) {
    blockers.push("smoke model-card confidence_thresholds.default must be 0.5");
  }
}

function validateRunnerReceipt(report, blockers) {
  const command = report.runner?.command;
  if (!Array.isArray(command) || command.length === 0) {
    blockers.push("runner.command must be a non-empty command array written by the runner");
  } else if (!command.some((value) => value.endsWith("scripts/run_browser_onnx_wiring_smoke.mjs"))) {
    blockers.push("runner.command must invoke scripts/run_browser_onnx_wiring_smoke.mjs");
  }
  const script = validateReference(report.runner?.script, "runner.script", blockers);
  if (script && projectRelative(script) !== "scripts/run_browser_onnx_wiring_smoke.mjs") {
    blockers.push("runner.script.path must be scripts/run_browser_onnx_wiring_smoke.mjs");
  }
}

function validateReport(report, reportPath) {
  const blockers = [];
  if (projectRelative(reportPath) === "docs/validation/final-browser-onnx-smoke.json") {
    blockers.push("smoke-only browser ONNX wiring report must not use the final browser ONNX smoke path");
  }
  if (report.schema_version !== "asl-pilot-browser-onnx-wiring-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-browser-onnx-wiring-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (report.evidence_mode !== "smoke") blockers.push("evidence_mode must be smoke");
  if (report.finality !== "smoke_only") blockers.push("finality must be smoke_only");
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push("blockers must be empty when status is passed");
  }
  if (!isIsoDate(report.tested_at)) blockers.push("tested_at must be a real ISO-compatible date string");
  if (report.runner?.tool !== "playwright") blockers.push("runner.tool must be playwright");
  if (typeof report.runner?.browser !== "string" || hasPlaceholderText(report.runner.browser)) {
    blockers.push("runner.browser must be a non-placeholder browser version");
  }
  if (typeof report.runner?.app_url !== "string" || !report.runner.app_url.includes("/smoke/browser-onnx")) {
    blockers.push("runner.app_url must point to the browser ONNX smoke route");
  }
  validateRunnerReceipt(report, blockers);

  const modelCardFile = validateReference(report.smoke_model_card, "smoke_model_card", blockers);
  validateReference(report.smoke_browser_artifact, "smoke_browser_artifact", blockers);
  if (report.smoke_browser_artifact?.path === expectedPublicArtifactPath) {
    blockers.push("smoke_browser_artifact.path must reference the retained generated fixture, not a public final artifact");
  }
  if (modelCardFile) validateSmokeModelCard(readJson(modelCardFile), report.smoke_browser_artifact, blockers);

  if (report.runtime?.package !== "onnxruntime-web") blockers.push("runtime.package must be onnxruntime-web");
  if (typeof report.runtime?.version !== "string" || report.runtime.version.trim().length === 0) {
    blockers.push("runtime.version must be a non-empty string");
  }
  if (report.runtime?.execution_provider !== "wasm") blockers.push("runtime.execution_provider must be wasm");
  if (report.runtime?.app_wasm_route !== "/api/ort/") blockers.push("runtime.app_wasm_route must be /api/ort/");
  if (report.inference?.ran_browser_inference !== true) blockers.push("inference.ran_browser_inference must be true");
  if (report.inference?.result?.passed !== true) blockers.push("inference.result.passed must be true");
  if (report.inference?.expected_id !== "hello" || report.inference?.predicted_id !== "hello") {
    blockers.push("inference must predict hello for the smoke expected_id");
  }
  if (report.inference?.model_id !== "asl-pilot-browser-onnx-wiring-smoke-v0") {
    blockers.push("inference.model_id must be the smoke model id");
  }
  if (report.inference?.model_status !== "trained") {
    blockers.push("inference.model_status must be trained for the smoke-only fixture");
  }
  if (typeof report.inference?.confidence !== "number" || report.inference.confidence < 0.5) {
    blockers.push("inference.confidence must meet the smoke threshold");
  }
  if (!sameArray(report.inference?.input_shape, [1, 3, 3, 16, 16])) {
    blockers.push("inference.input_shape must be [1, 3, 3, 16, 16]");
  }
  if (!sameArray(report.inference?.logits_shape, [1, 2])) {
    blockers.push("inference.logits_shape must be [1, 2]");
  }
  if (report.inference?.client_validated_logits_against_label_count !== true) {
    blockers.push("inference.client_validated_logits_against_label_count must be true");
  }
  if (report.network?.fetched_smoke_model_card !== true) {
    blockers.push("network.fetched_smoke_model_card must be true");
  }
  if (report.network?.fetched_smoke_browser_artifact !== true) {
    blockers.push("network.fetched_smoke_browser_artifact must be true");
  }
  if (report.network?.fetched_ort_wasm_route !== true) {
    blockers.push("network.fetched_ort_wasm_route must be true");
  }
  if (!Array.isArray(report.network?.unexpected_external_requests)) {
    blockers.push("network.unexpected_external_requests must be an array");
  } else if (report.network.unexpected_external_requests.length > 0) {
    blockers.push("network.unexpected_external_requests must be empty");
  }
  if (report.final_evidence_exclusion?.excluded_from_completion !== true) {
    blockers.push("final_evidence_exclusion.excluded_from_completion must be true");
  }
  if (report.final_evidence_exclusion?.final_browser_smoke_report !== "docs/validation/final-browser-onnx-smoke.json") {
    blockers.push("final_evidence_exclusion must point to the separate final browser smoke report path");
  }
  validateBrowserEvidence(report, blockers);
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
      blockers: [`Browser ONNX wiring smoke report is missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Browser ONNX wiring smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Browser ONNX wiring smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Browser ONNX wiring smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
