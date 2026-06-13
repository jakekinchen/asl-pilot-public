import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "practice-camera-behavior-smoke.json");
const requiredChecks = [
  "authenticated_practice_ui",
  "camera_success_attempt_result_and_progress",
  "next_prompt_action",
  "camera_denied",
  "camera_missing",
  "camera_unsupported",
  "camera_generic_error",
];

function parseArgs(argv) {
  const args = { report: defaultReportPath };
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
  node scripts/audit_practice_camera_behavior_smoke.mjs [--report docs/validation/practice-camera-behavior-smoke.json]

Validates retained Playwright evidence for the real practice UI camera flow:
success, denied permission, missing device, unsupported camera API, generic
startup failure, result/hint rendering, next prompt, and progress refresh.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
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
  if (check.status !== "passed") blockers.push(`${id} status must be passed`);
  if (Array.isArray(check.blockers) && check.blockers.length > 0) {
    blockers.push(`${id} blockers must be empty`);
  }
  return check;
}

function validateSourceReferences(report) {
  const blockers = [];
  if (!Array.isArray(report.source_files) || report.source_files.length === 0) {
    return ["source_files must be a non-empty array"];
  }
  const refsByPath = new Map();
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
    refsByPath.set(ref.path, ref);
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
  for (const requiredPath of [
    "scripts/run_practice_camera_behavior_smoke.mjs",
    "scripts/audit_practice_camera_behavior_smoke.mjs",
    "web/src/components/PracticeApp.tsx",
    "web/src/lib/client-model.ts",
    "web/src/lib/server-store.ts",
    "web/src/lib/vocabulary.ts",
    "web/public/model/model-card.json",
    "docs/model/active-vocabulary-claim.json",
  ]) {
    if (!refsByPath.has(requiredPath)) blockers.push(`source_files must include ${requiredPath}`);
  }
  return blockers;
}

function validateCheckEvidence(report) {
  const blockers = [];
  const byId = checksById(report);
  for (const id of requiredChecks) requirePassedCheck(blockers, byId, id);

  const ui = byId.get("authenticated_practice_ui")?.evidence;
  for (const field of [
    "prompt_visible",
    "camera_idle_visible",
    "start_camera_visible",
    "next_prompt_visible",
    "history_visible",
    "empty_history_visible",
  ]) {
    if (ui?.[field] !== true) blockers.push(`authenticated_practice_ui evidence must set ${field}=true`);
  }

  const success = byId.get("camera_success_attempt_result_and_progress")?.evidence;
  for (const field of [
    "camera_ready_text_visible",
    "save_practice_action_visible",
    "result_visible",
    "fail_closed_hint_visible",
    "history_updated_visible",
  ]) {
    if (success?.[field] !== true) {
      blockers.push(`camera_success_attempt_result_and_progress evidence must set ${field}=true`);
    }
  }
  if (success?.submit_attempt_action_visible !== false) {
    blockers.push("camera_success_attempt_result_and_progress evidence must set submit_attempt_action_visible=false");
  }
  if (success?.check_attempt_action_visible !== false) {
    blockers.push("camera_success_attempt_result_and_progress evidence must set check_attempt_action_visible=false while no trained active checker exists");
  }

  const nextPrompt = byId.get("next_prompt_action")?.evidence;
  if (nextPrompt?.prompt_changed !== true) {
    blockers.push("next_prompt_action evidence must set prompt_changed=true");
  }
  const previousPrompt = String(nextPrompt?.previous_prompt_text ?? "");
  const nextPromptText = String(nextPrompt?.next_prompt_text_visible ?? "");
  if (!previousPrompt.startsWith("Sign ") || !nextPromptText.startsWith("Sign ") || nextPromptText === previousPrompt) {
    blockers.push("next_prompt_action evidence must prove the visible prompt advanced to a different ASL prompt");
  }

  const expectedErrors = {
    camera_denied: "Camera permission was denied. Enable camera access to use the practice screen.",
    camera_missing: "No camera was found on this device.",
    camera_unsupported: "This browser does not expose camera access for the practice screen.",
    camera_generic_error: "Camera could not start under the current browser/device settings.",
  };
  for (const [id, expectedText] of Object.entries(expectedErrors)) {
    const evidence = byId.get(id)?.evidence;
    if (evidence?.expected_text_visible !== expectedText) {
      blockers.push(`${id} evidence must show exact text: ${expectedText}`);
    }
  }

  return blockers;
}

function validateServerEvidence(report) {
  const blockers = [];
  if (!report.server || typeof report.server !== "object" || Array.isArray(report.server)) {
    return ["server evidence must be present"];
  }
  if (report.server.mode !== "next_start") blockers.push("server.mode must be next_start");
  if (!/^[a-f0-9]{64}$/.test(String(report.server.build_id_sha256 ?? ""))) {
    blockers.push("server.build_id_sha256 must be a SHA-256 digest");
  }
  const command = String(report.server.command ?? "");
  for (const snippet of [
    "ASL_PILOT_STORE_PATH=",
    "ENABLE_DATASET_COLLECTION=false",
    "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false",
    "npm --prefix web run start",
  ]) {
    if (!command.includes(snippet)) blockers.push(`server.command must include ${snippet}`);
  }
  const store = report.server.isolated_store;
  if (!store || typeof store !== "object" || Array.isArray(store)) {
    blockers.push("server.isolated_store must be present");
  } else {
    if (store.env_var !== "ASL_PILOT_STORE_PATH") {
      blockers.push("server.isolated_store.env_var must be ASL_PILOT_STORE_PATH");
    }
    if (store.existed_after_smoke !== true) {
      blockers.push("server.isolated_store.existed_after_smoke must be true");
    }
    if (store.removed_after_run !== true) {
      blockers.push("server.isolated_store.removed_after_run must be true");
    }
  }
  return blockers;
}

function validateReport(report) {
  const blockers = [];
  if (report.schema_version !== "asl-pilot-practice-camera-behavior-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-practice-camera-behavior-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push("report.blockers must be empty");
  }
  if (!isIsoDate(report.tested_at)) blockers.push("tested_at must be an ISO timestamp");
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(String(report.app_url ?? ""))) {
    blockers.push("app_url must be an isolated localhost URL");
  }
  if (report.browser?.automation !== "playwright") blockers.push("browser.automation must be playwright");
  if (report.browser?.browser_name !== "chromium") blockers.push("browser.browser_name must be chromium");
  if (report.browser?.fake_media_device !== true) blockers.push("browser.fake_media_device must be true");
  if (!Array.isArray(report.commands) || !report.commands.some((command) => command.includes("run_practice_camera_behavior_smoke.mjs --write"))) {
    blockers.push("commands must include the retained runner --write command");
  }
  blockers.push(...validateSourceReferences(report));
  blockers.push(...validateCheckEvidence(report));
  blockers.push(...validateServerEvidence(report));
  return blockers;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const reportPath = resolveProjectPath(args.report, "--report");
  const report = readJson(reportPath);
  const blockers = validateReport(report);
  const result = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    report: projectRelative(reportPath),
    required_checks: requiredChecks,
    blockers,
  };
  console.log(JSON.stringify(result, null, 2));
  if (blockers.length > 0) {
    console.error("Practice camera behavior smoke audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Practice camera behavior smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
