import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(root, "docs", "validation", "lesson-page-smoke.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

const blockers = [];
if (!fs.existsSync(reportPath)) {
  blockers.push("docs/validation/lesson-page-smoke.json is missing; run node scripts/run_lesson_page_smoke.mjs --write");
} else {
  const report = readJson(reportPath);
  if (report.schema_version !== "asl-pilot-lesson-page-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-lesson-page-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("lesson page smoke report status must be passed");
  const url = new URL(report.app_url ?? "http://invalid.invalid");
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "::1"].includes(url.hostname)) {
    blockers.push("app_url must be an isolated loopback URL");
  }
  if (report.browser?.automation !== "playwright") blockers.push("browser.automation must be playwright");
  if (report.browser?.browser_name !== "chromium") blockers.push("browser.browser_name must be chromium");
  if (report.browser?.fake_media !== true) blockers.push("browser.fake_media must be true");

  const checks = new Map((report.checks ?? []).map((check) => [check.id, check]));
  for (const id of [
    "unauthenticated_lesson_gate",
    "authenticated_lesson_ui",
    "lesson_prompt_study_flow",
    "practice_links_to_lesson",
    "robot_three_canvas",
    "fail_closed_claims_absent",
    "camera_local_sample",
    "avatar_demo_mode",
  ]) {
    const check = checks.get(id);
    if (!check) {
      blockers.push(`missing smoke check ${id}`);
    } else if (check.status !== "passed") {
      blockers.push(`smoke check ${id} did not pass`);
    }
  }

  const unauthenticatedGateCheck = checks.get("unauthenticated_lesson_gate");
  if (unauthenticatedGateCheck) {
    if (unauthenticatedGateCheck.evidence?.sign_in_copy_visible !== true) {
      blockers.push("unauthenticated lesson gate must show sign-in copy");
    }
    if (unauthenticatedGateCheck.evidence?.practice_workspace_link_visible !== true) {
      blockers.push("unauthenticated lesson gate must link back to practice workspace");
    }
    if (unauthenticatedGateCheck.evidence?.start_camera_button_count !== 0) {
      blockers.push("unauthenticated lesson gate must not expose the Start camera control");
    }
    if (unauthenticatedGateCheck.evidence?.save_sample_button_count !== 0) {
      blockers.push("unauthenticated lesson gate must not expose the Save practice sample control");
    }
  }

  const robotCheck = checks.get("robot_three_canvas");
  if (robotCheck) {
    if (robotCheck.evidence?.canvas_present !== true) blockers.push("robot canvas must be present");
    if (!(robotCheck.evidence?.non_blank_pixels > 20)) blockers.push("robot canvas non_blank_pixels must be > 20");
  }
  const studyFlowCheck = checks.get("lesson_prompt_study_flow");
  if (studyFlowCheck) {
    for (const field of [
      "study_flow_visible",
      "study_button_visible",
      "preview_button_visible",
      "sample_button_visible",
      "study_title_visible",
      "study_copy_visible",
      "preview_copy_visible",
      "sample_copy_visible",
    ]) {
      if (studyFlowCheck.evidence?.[field] !== true) {
        blockers.push(`lesson prompt study flow evidence must set ${field}=true`);
      }
    }
  }
  const sampleCheck = checks.get("camera_local_sample");
  if (sampleCheck) {
    if (sampleCheck.evidence?.passed !== false) blockers.push("lesson sample payload must save passed=false");
    if (sampleCheck.evidence?.model_status !== "not_trained") blockers.push("lesson sample model_status must be not_trained");
    if ((sampleCheck.evidence?.raw_payload_keys ?? []).length !== 0) {
      blockers.push("lesson sample payload contains raw media keys");
    }
  }

  if (report.server?.mode !== "next_start") blockers.push("server.mode must be next_start");
  if (report.server?.isolated_store?.removed_after_run !== true) {
    blockers.push("isolated smoke store must be removed after run");
  }
  for (const source of report.source_files ?? []) {
    const sourcePath = path.join(root, source.path ?? "");
    if (!fs.existsSync(sourcePath)) blockers.push(`source file missing: ${source.path}`);
    if (!/^[a-f0-9]{64}$/.test(source.sha256 ?? "")) {
      blockers.push(`source file hash missing or invalid: ${source.path}`);
    }
  }
}

const summary = {
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  path: projectRelative(reportPath),
  blockers,
};
console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  console.error("Lesson page smoke audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
