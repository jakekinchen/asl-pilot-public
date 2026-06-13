import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(root, "docs", "validation", "practice-scope-copy-smoke.json");
const runnerPath = path.join(root, "scripts", "run_practice_scope_copy_smoke.mjs");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(readText(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function vocabularyCount() {
  const source = readText(vocabularyPath);
  return [...source.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",/gm)].length;
}

const blockers = [];

if (!fs.existsSync(reportPath)) {
  blockers.push("docs/validation/practice-scope-copy-smoke.json is missing; run node scripts/run_practice_scope_copy_smoke.mjs --write");
} else {
  const report = readJson(reportPath);
  const expectedCatalogCopy = `CATALOG ${vocabularyCount()}`;

  if (report.schema_version !== "asl-pilot-practice-scope-copy-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-practice-scope-copy-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("practice scope copy smoke status must be passed");
  if (report.generated_by?.script?.path !== "scripts/run_practice_scope_copy_smoke.mjs") {
    blockers.push("generated_by.script.path must point at scripts/run_practice_scope_copy_smoke.mjs");
  }
  if (report.generated_by?.script?.sha256 !== sha256File(runnerPath)) {
    blockers.push("generated_by.script.sha256 must match the current runner");
  }

  const url = new URL(report.server?.app_url ?? "http://invalid.invalid");
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "::1"].includes(url.hostname)) {
    blockers.push("server.app_url must be an isolated loopback URL");
  }
  if (report.server?.mode !== "next_start") blockers.push("server.mode must be next_start");
  if (report.server?.isolated_store?.removed_after_run !== true) {
    blockers.push("isolated smoke store must be removed after run");
  }
  if (report.boundary?.not_model_evidence !== true) blockers.push("boundary.not_model_evidence must be true");
  if (report.boundary?.not_training_evidence !== true) blockers.push("boundary.not_training_evidence must be true");
  if (report.boundary?.verifies_copy_only !== true) blockers.push("boundary.verifies_copy_only must be true");
  if (report.boundary?.canonical_store_mutated !== false) blockers.push("boundary.canonical_store_mutated must be false");
  if (!(report.practice_excerpt ?? []).includes(expectedCatalogCopy)) {
    blockers.push(`practice_excerpt must include current catalog copy: ${expectedCatalogCopy}`);
  }

  const checks = new Map((report.checks ?? []).map((check) => [check.id, check]));
  const authCheck = checks.get("auth_prompt_catalog_boundary");
  if (!authCheck) {
    blockers.push("missing smoke check auth_prompt_catalog_boundary");
  } else {
    if (authCheck.status !== "passed") blockers.push("auth_prompt_catalog_boundary must pass");
    if (authCheck.evidence?.has_prompt_catalog !== true) {
      blockers.push("auth prompt catalog evidence must be true");
    }
    if (authCheck.evidence?.has_curated_prompts !== false) {
      blockers.push("auth screen must not use old curated prompts copy");
    }
  }

  const practiceCheck = checks.get("practice_prompt_catalog_boundary");
  if (!practiceCheck) {
    blockers.push("missing smoke check practice_prompt_catalog_boundary");
  } else {
    if (practiceCheck.status !== "passed") blockers.push("practice_prompt_catalog_boundary must pass");
    if (practiceCheck.evidence?.has_prompt_catalog !== true) {
      blockers.push("practice prompt catalog evidence must be true");
    }
    if (practiceCheck.evidence?.has_practice_ledger !== true) {
      blockers.push("practice ledger copy must be visible");
    }
    if (practiceCheck.evidence?.has_not_trained_copy !== true) {
      blockers.push("not-trained checker scope copy must be visible");
    }
    if (practiceCheck.evidence?.has_old_ready_overclaim !== false) {
      blockers.push("old full-vocabulary ready overclaim must be absent");
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
  console.error("Practice scope copy smoke audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
