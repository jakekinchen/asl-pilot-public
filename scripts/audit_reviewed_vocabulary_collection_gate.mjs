import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];
const acceptedVocabularyGateStatuses = new Set(["reviewed", "source_curated"]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pass(id, label, evidence) {
  checks.push({ id, label, status: "passed", evidence, blockers: [] });
}

function fail(id, label, blocker) {
  checks.push({ id, label, status: "failed", evidence: null, blockers: [blocker] });
  findings.push(`${id}: ${blocker}`);
}

function requireSnippets(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  if (missing.length === 0) {
    pass(id, label, relativePath);
  } else {
    fail(id, label, `${relativePath} is missing ${missing.map((item) => JSON.stringify(item)).join(", ")}`);
  }
}

const strictPlan = spawnSync("node", ["scripts/plan_dataset_collection.mjs"], {
  cwd: root,
  encoding: "utf8",
});
if (strictPlan.status === 0) {
  const plan = JSON.parse(strictPlan.stdout);
  if (acceptedVocabularyGateStatuses.has(plan.review_gate?.status)) {
    pass("strict_planner_review_gate", "Collection planner requires accepted vocabulary evidence by default", plan.review_gate.status);
  } else {
    fail("strict_planner_review_gate", "Collection planner requires accepted vocabulary evidence by default", "Strict planner succeeded without accepted vocabulary evidence status");
  }
} else if ((strictPlan.stderr || strictPlan.stdout).includes("Vocabulary evidence gate must pass")) {
  pass("strict_planner_review_gate", "Collection planner requires accepted vocabulary evidence by default", "pre-evidence planner fails closed");
} else {
  fail(
    "strict_planner_review_gate",
    "Collection planner requires accepted vocabulary evidence by default",
    strictPlan.stderr.trim() || strictPlan.stdout.trim() || `process exited ${strictPlan.status}`,
  );
}

const draftPlan = spawnSync("node", [
  "scripts/plan_dataset_collection.mjs",
  "--allow-draft-unreviewed-vocabulary",
], {
  cwd: root,
  encoding: "utf8",
});
if (draftPlan.status !== 0) {
  fail(
    "draft_planner_marks_review_gate",
    "Draft planner marks pre-review plans explicitly",
    draftPlan.stderr.trim() || draftPlan.stdout.trim() || `process exited ${draftPlan.status}`,
  );
} else {
  const plan = JSON.parse(draftPlan.stdout);
  if (acceptedVocabularyGateStatuses.has(plan.review_gate?.status) || plan.review_gate?.status === "draft_pre_review") {
    pass("draft_planner_marks_review_gate", "Draft planner marks pre-evidence plans explicitly", plan.review_gate.status);
  } else {
    fail("draft_planner_marks_review_gate", "Draft planner marks pre-evidence plans explicitly", "Missing review_gate status");
  }
}

requireSnippets(
  "plan_api_rejects_draft",
  "Collection plan API refuses draft pre-evidence plans",
  "web/src/app/api/dataset/plan/route.ts",
  [
    "review_gate",
    "Vocabulary evidence must pass before the collection plan can be used for capture",
    "status: 409",
  ],
);

requireSnippets(
  "plan_ui_surfaces_review_gate_blockers",
  "Collection plan UI shows review-gate blockers from the API",
  "web/src/components/DatasetCollectionPanel.tsx",
  [
    "readCollectionPlanResponse",
    "reviewGateBlockers",
    "planError",
    "planBlockers",
    "reviewGate",
    "collection-error",
  ],
);

requireSnippets(
  "server_capture_rejects_unreviewed_vocabulary",
  "Dataset clip capture refuses missing or shallow vocabulary evidence",
  "web/src/lib/server-store.ts",
  [
    "spawnSync",
    "scripts/audit_vocabulary_review.mjs",
    "Strict vocabulary review audit must pass before dataset collection can start.",
    "ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES",
    "Production dataset collection must use canonical strict review evidence.",
    "assertVocabularyReviewedForDatasetCollection",
    "final-vocabulary-review.json",
    "needs_deaf_educator_review",
    "approved_item_ids",
    "Vocabulary evidence must match the current vocabulary",
  ],
);

const currentPlan = JSON.parse(read("data/dataset/collection-plan.json"));
if (acceptedVocabularyGateStatuses.has(currentPlan.review_gate?.status) || currentPlan.review_gate?.status === "draft_pre_review") {
  pass("current_plan_has_review_gate", "Current collection plan declares vocabulary evidence gate status", currentPlan.review_gate.status);
} else {
  fail("current_plan_has_review_gate", "Current collection plan declares vocabulary evidence gate status", "data/dataset/collection-plan.json is missing review_gate.status");
}

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Reviewed vocabulary collection-gate audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
