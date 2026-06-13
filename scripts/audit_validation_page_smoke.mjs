import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(root, "docs", "validation", "validation-page-smoke.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

const blockers = [];

if (!fs.existsSync(reportPath)) {
  blockers.push("docs/validation/validation-page-smoke.json is missing; run node scripts/run_validation_page_smoke.mjs --write");
} else {
  const report = readJson(reportPath);
  if (report.schema_version !== "asl-pilot-validation-page-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-validation-page-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("validation page smoke report status must be passed");
  const url = new URL(report.app_url ?? "http://invalid.invalid");
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "::1"].includes(url.hostname)) {
    blockers.push("app_url must be an isolated loopback URL");
  }
  if (report.browser?.automation !== "playwright") blockers.push("browser.automation must be playwright");
  if (report.browser?.browser_name !== "chromium") blockers.push("browser.browser_name must be chromium");
  if (report.browser?.fake_media !== false) blockers.push("browser.fake_media must be false");
  if (report.server?.mode !== "next_start") blockers.push("server.mode must be next_start");

  const checks = new Map((report.checks ?? []).map((check) => [check.id, check]));
  for (const id of [
    "validation_route_renders",
    "evidence_links_visible",
    "public_runtime_links_fetchable",
    "fail_closed_claims_visible",
    "no_camera_or_sample_controls",
    "no_promotion_claims_absent",
  ]) {
    const check = checks.get(id);
    if (!check) {
      blockers.push(`missing smoke check ${id}`);
    } else if (check.status !== "passed") {
      blockers.push(`smoke check ${id} did not pass`);
    }
  }

  const evidenceCheck = checks.get("evidence_links_visible");
  if (evidenceCheck) {
    if (evidenceCheck.evidence?.evidence_panel_visible !== true) {
      blockers.push("evidence links panel must be visible");
    }
    const expected = evidenceCheck.evidence?.expected_paths ?? [];
    const visible = evidenceCheck.evidence?.visible_paths ?? [];
    if (expected.length !== 7 || visible.length !== expected.length) {
      blockers.push("all expected evidence paths must be visible on /validation");
    }
  }

  const linkCheck = checks.get("public_runtime_links_fetchable");
  if (linkCheck) {
    const results = linkCheck.evidence?.public_link_results ?? [];
    if (results.length !== 3 || results.some((result) => result.ok !== true)) {
      blockers.push("all public runtime links must return ok");
    }
  }

  const controlCheck = checks.get("no_camera_or_sample_controls");
  if (controlCheck) {
    for (const [field, count] of Object.entries(controlCheck.evidence ?? {})) {
      if (count !== 0) blockers.push(`${field} must be 0 on /validation`);
    }
  }

  const claimCheck = checks.get("no_promotion_claims_absent");
  if (claimCheck && (claimCheck.evidence?.banned_claim_patterns_seen ?? []).length !== 0) {
    blockers.push("validation route rendered positive recognition or final-readiness claims");
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
  console.error("Validation page smoke audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
