import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "practice-progress-smoke.json");
const requiredChecks = [
  "model_card_not_trained",
  "unauthenticated_progress_requires_login",
  "register_creates_session",
  "me_returns_registered_user",
  "initial_progress_empty",
  "raw_payload_rejected",
  "raw_payload_rejection_does_not_save",
  "metadata_attempt_fail_closed",
  "progress_updates_after_attempt",
  "logout_blocks_progress",
  "login_restores_persisted_progress",
  "dataset_collection_default_disabled",
];

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
  node scripts/audit_practice_progress_smoke.mjs [--report docs/validation/practice-progress-smoke.json]

Validates retained runtime evidence for account creation/login, authenticated
progress persistence, raw-camera payload rejection, not_trained fail-closed
attempt handling, and default-disabled dataset collection routes.
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

function checkSourceReferences(report) {
  const blockers = [];
  if (!Array.isArray(report.source_files) || report.source_files.length === 0) {
    return ["source_files must be a non-empty array"];
  }
  for (const [index, ref] of report.source_files.entries()) {
    const context = `source_files[${index}]`;
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

function checksById(report) {
  if (!Array.isArray(report.checks)) return new Map();
  return new Map(report.checks.map((check) => [check.id, check]));
}

function requirePassedCheck(blockers, byId, id) {
  const check = byId.get(id);
  if (!check) {
    blockers.push(`missing check: ${id}`);
    return null;
  }
  if (check.status !== "passed") {
    blockers.push(`${id} status must be passed`);
  }
  if (Array.isArray(check.blockers) && check.blockers.length > 0) {
    blockers.push(`${id} blockers must be empty`);
  }
  return check;
}

function validateCheckEvidence(report, blockers) {
  const byId = checksById(report);
  for (const id of requiredChecks) requirePassedCheck(blockers, byId, id);

  const model = byId.get("model_card_not_trained")?.evidence;
  if (model?.status !== 200 || model?.model_id !== "asl-pilot-rawframe-v0" || model?.model_status !== "not_trained") {
    blockers.push("model_card_not_trained evidence must prove model_id asl-pilot-rawframe-v0 and status not_trained");
  }

  const unauthenticated = byId.get("unauthenticated_progress_requires_login")?.evidence;
  if (unauthenticated?.status !== 401) blockers.push("unauthenticated progress evidence must be HTTP 401");

  const register = byId.get("register_creates_session")?.evidence;
  if (register?.status !== 200 || register?.has_cookie !== true || register?.returned_email_matches !== true) {
    blockers.push("registration evidence must show HTTP 200, a session cookie, and matching user email");
  }

  const me = byId.get("me_returns_registered_user")?.evidence;
  if (me?.status !== 200 || me?.returned_email_matches !== true || me?.has_user_id !== true) {
    blockers.push("/api/me evidence must show the registered authenticated user");
  }

  const initial = byId.get("initial_progress_empty")?.evidence;
  if (
    initial?.status !== 200 ||
    !(initial?.progress_count >= 75) ||
    initial?.progress_item?.attempts !== 0 ||
    initial?.progress_item?.passes !== 0 ||
    initial?.progress_item?.fails !== 0 ||
    initial?.progress_item?.status !== "not_started"
  ) {
    blockers.push("initial progress evidence must show at least 75 items and zeroed hello progress");
  }

  const raw = byId.get("raw_payload_rejected")?.evidence;
  if (raw?.status !== 400 || raw?.error_mentions_raw_camera !== true) {
    blockers.push("raw payload evidence must show HTTP 400 and raw camera wording");
  }

  const noSave = byId.get("raw_payload_rejection_does_not_save")?.evidence;
  if (
    noSave?.status !== 200 ||
    noSave?.progress_item?.attempts !== 0 ||
    noSave?.progress_item?.passes !== 0 ||
    noSave?.progress_item?.fails !== 0 ||
    noSave?.recent_attempts_count !== 0
  ) {
    blockers.push("raw payload rejection must leave progress and recent attempts unchanged");
  }

  const attempt = byId.get("metadata_attempt_fail_closed")?.evidence?.saved_attempt;
  if (
    !attempt ||
    attempt.vocabularyId !== "hello" ||
    attempt.passed !== false ||
    attempt.modelId !== "asl-pilot-rawframe-v0" ||
    attempt.modelStatus !== "not_trained" ||
    !/not_trained/i.test(String(attempt.reason ?? ""))
  ) {
    blockers.push("metadata attempt evidence must show a spoofed pass saved as not_trained fail-closed history");
  }

  const after = byId.get("progress_updates_after_attempt")?.evidence;
  if (
    after?.status !== 200 ||
    !after?.saved_attempt_id ||
    after?.progress_item?.attempts !== 1 ||
    after?.progress_item?.passes !== 0 ||
    after?.progress_item?.fails !== 1 ||
    after?.progress_item?.status !== "in_progress" ||
    after?.recent_attempt?.id !== after?.saved_attempt_id ||
    after?.recent_attempt?.passed !== false
  ) {
    blockers.push("progress-after-attempt evidence must bind progress and recentAttempts to the saved fail-closed attempt");
  }

  const logout = byId.get("logout_blocks_progress")?.evidence;
  if (logout?.logout_status !== 200 || logout?.progress_status_after_logout !== 401) {
    blockers.push("logout evidence must show HTTP 200 logout and HTTP 401 progress afterward");
  }

  const persisted = byId.get("login_restores_persisted_progress")?.evidence;
  if (
    persisted?.login_status !== 200 ||
    persisted?.has_cookie_after_login !== true ||
    persisted?.progress_status_after_login !== 200 ||
    persisted?.recent_attempt?.id !== persisted?.saved_attempt_id ||
    persisted?.progress_item?.attempts !== 1 ||
    persisted?.progress_item?.passes !== 0 ||
    persisted?.progress_item?.fails !== 1
  ) {
    blockers.push("login persistence evidence must show the same saved attempt after logout/login");
  }

  const dataset = byId.get("dataset_collection_default_disabled")?.evidence;
  if (dataset?.dataset_clip_post_status !== 403 || dataset?.dataset_coverage_get_status !== 403) {
    blockers.push("dataset default-disabled evidence must show 403 for clips and coverage routes");
  }
}

function validateReport(report) {
  const blockers = [];
  if (report.schema_version !== "asl-pilot-practice-progress-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-practice-progress-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (!isIsoDate(report.tested_at) || String(report.tested_at).includes("YYYY")) {
    blockers.push("tested_at must be a real ISO-compatible date string");
  }
  if (typeof report.app_url !== "string" || !/^http:\/\/127\.0\.0\.1:\d+$/.test(report.app_url)) {
    blockers.push("app_url must be an isolated 127.0.0.1 runtime URL");
  }
  if (typeof report.account_email_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(report.account_email_sha256)) {
    blockers.push("account_email_sha256 must be present instead of a raw email address");
  }
  if ("account_email" in report) blockers.push("report must not retain a raw account_email");
  if (!Array.isArray(report.blockers) || report.blockers.length !== 0) {
    blockers.push("blockers must be an empty array");
  }
  if (!Array.isArray(report.commands) || report.commands.length < 8) {
    blockers.push("commands must include the runtime endpoint sequence");
  }
  if (report.server?.isolated_store?.env_var !== "ASL_PILOT_STORE_PATH") {
    blockers.push("server.isolated_store.env_var must be ASL_PILOT_STORE_PATH");
  }
  if (report.server?.mode !== "next_start") {
    blockers.push("server.mode must be next_start so the smoke uses the current production build");
  }
  if (typeof report.server?.build_id_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(report.server.build_id_sha256)) {
    blockers.push("server.build_id_sha256 must be a lowercase SHA-256 digest");
  }
  if (report.server?.isolated_store?.existed_after_smoke !== true) {
    blockers.push("isolated store must exist after the smoke before cleanup");
  }
  if (report.server?.isolated_store?.removed_after_run !== true) {
    blockers.push("isolated store temp directory must be removed after the run");
  }
  blockers.push(...checkSourceReferences(report));
  validateCheckEvidence(report, blockers);
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
    blockers.push(`Practice/progress smoke report is missing: ${projectRelative(reportPath)}`);
  }
  let report = null;
  if (blockers.length === 0) {
    report = readJson(reportPath);
    blockers.push(...validateReport(report));
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
    console.error("Practice/progress smoke audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Practice/progress smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
