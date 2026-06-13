import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "privacy", "final-privacy-smoke.json");

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
  node scripts/audit_final_privacy_smoke.mjs [--report docs/privacy/final-privacy-smoke.json]

Validates final static/source plus live HTTP privacy smoke evidence for normal practice. This
separate audit intentionally fails until a current report has been generated.
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

function validateSourceReferences(report) {
  const blockers = [];
  const refs = report.evidence?.source_files;
  if (!Array.isArray(refs) || refs.length === 0) {
    return ["evidence.source_files must be a non-empty array"];
  }
  for (const [index, ref] of refs.entries()) {
    const context = `evidence.source_files[${index}]`;
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
      blockers.push(`${context} must be an object`);
      continue;
    }
    if (typeof ref.path !== "string" || ref.path.trim().length === 0) {
      blockers.push(`${context}.path must be a non-empty string`);
      continue;
    }
    if (typeof ref.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256)) {
      blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    }
    const file = resolveProjectPath(ref.path, `${context}.path`);
    if (!fs.existsSync(file)) {
      blockers.push(`${context}.path does not exist: ${ref.path}`);
      continue;
    }
    const actual = sha256File(file);
    if (ref.sha256 !== actual) {
      blockers.push(`${context}.sha256 mismatch for ${ref.path}; expected ${ref.sha256}, got ${actual}`);
    }
  }
  return blockers;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const reportPath = args.report ? resolveProjectPath(args.report, "--report") : defaultReportPath;
  const blockers = [];
  if (!fs.existsSync(reportPath)) {
    blockers.push(`Final privacy smoke report is missing: ${projectRelative(reportPath)}`);
  }
  let report = null;
  if (blockers.length === 0) {
    report = readJson(reportPath);
    if (report.schema_version !== "asl-pilot-final-privacy-smoke/v1") {
      blockers.push("Final privacy smoke schema_version is invalid");
    }
    if (report.status !== "passed") blockers.push("Final privacy smoke status must be passed");
    if (!isIsoDate(report.tested_at) || String(report.tested_at).includes("YYYY")) {
      blockers.push("Final privacy smoke tested_at must be a real ISO-compatible date string");
    }
    const findings = report.normal_practice_findings;
    for (const key of [
      "raw_video_uploads_observed",
      "raw_frame_uploads_observed",
      "image_or_blob_payloads_observed",
      "analytics_or_session_replay_observed",
    ]) {
      if (findings?.[key] !== false) blockers.push(`normal_practice_findings.${key} must be false`);
    }
    if (report.evidence?.static_audit?.ok !== true) {
      blockers.push("evidence.static_audit.ok must be true");
    }
    if (report.evidence?.live_http?.app_reachable !== true) {
      blockers.push("evidence.live_http.app_reachable must be true");
    }
    if (report.evidence?.live_http?.normal_practice_raw_payload_rejected !== true) {
      blockers.push("evidence.live_http.normal_practice_raw_payload_rejected must be true");
    }
    if (report.evidence?.live_http?.dataset_collection_default_disabled !== true) {
      blockers.push("evidence.live_http.dataset_collection_default_disabled must be true");
    }
    blockers.push(...validateSourceReferences(report));
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    report: {
      path: projectRelative(reportPath),
      exists: fs.existsSync(reportPath),
      sha256: fs.existsSync(reportPath) ? sha256File(reportPath) : null,
    },
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Final privacy smoke audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final privacy smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
