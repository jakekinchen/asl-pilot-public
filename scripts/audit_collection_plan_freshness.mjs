import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const planPath = path.join(root, "data", "dataset", "collection-plan.json");
const findings = [];
const checks = [];

function pass(id, label, evidence) {
  checks.push({ id, label, status: "passed", evidence, blockers: [] });
}

function fail(id, label, blocker) {
  checks.push({ id, label, status: "failed", evidence: null, blockers: [blocker] });
  findings.push(`${id}: ${blocker}`);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(label, `${label} is valid JSON`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function normalizedPlan(plan) {
  return JSON.stringify(
    {
      ...plan,
      generated_at: "<ignored>",
    },
    null,
    2,
  );
}

if (!fs.existsSync(planPath)) {
  fail(
    "collection_plan_exists",
    "Generated collection plan exists",
    "data/dataset/collection-plan.json is missing",
  );
} else {
  pass("collection_plan_exists", "Generated collection plan exists", "data/dataset/collection-plan.json");
}

const currentPlan = fs.existsSync(planPath) ? readJson(planPath, "current_collection_plan") : null;
const freshRun = spawnSync("node", [
  "scripts/plan_dataset_collection.mjs",
  "--allow-draft-unreviewed-vocabulary",
], {
  cwd: root,
  encoding: "utf8",
});
if (freshRun.status !== 0) {
  fail(
    "collection_plan_regenerates",
    "Collection plan regenerates without warnings",
    freshRun.stderr.trim() || freshRun.stdout.trim() || `process exited ${freshRun.status}`,
  );
} else {
  pass(
    "collection_plan_regenerates",
    "Collection plan regenerates as a reviewed or explicit draft artifact",
    "scripts/plan_dataset_collection.mjs --allow-draft-unreviewed-vocabulary",
  );
}

let freshPlan = null;
if (freshRun.stdout.trim()) {
  try {
    freshPlan = JSON.parse(freshRun.stdout);
  } catch (error) {
    fail(
      "fresh_collection_plan_json",
      "Fresh collection plan output is valid JSON",
      error instanceof Error ? error.message : String(error),
    );
  }
}

if (currentPlan && freshPlan) {
  const currentNormalized = normalizedPlan(currentPlan);
  const freshNormalized = normalizedPlan(freshPlan);
  if (currentNormalized === freshNormalized) {
    pass("collection_plan_fresh", "Collection plan matches current vocabulary/store state", {
      assignment_count: currentPlan.assignment_count,
      negative_challenge_assignment_count: currentPlan.negative_challenge_assignment_count,
      store: currentPlan.store,
    });
  } else {
    fail(
      "collection_plan_fresh",
      "Collection plan matches current vocabulary/store state",
      "data/dataset/collection-plan.json differs from a freshly generated plan after ignoring generated_at",
    );
  }
}

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Collection plan freshness audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
