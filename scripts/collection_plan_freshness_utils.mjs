import { spawnSync } from "node:child_process";
import {
  root,
  vocabularyReviewGate,
} from "./vocabulary_review_utils.mjs";

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

export function validateCollectionPlanReviewGateFresh(plan, context = "collection plan") {
  const findings = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return [`${context} must be an object`];
  }
  const plannedGate = plan.review_gate;
  if (!plannedGate || typeof plannedGate !== "object" || Array.isArray(plannedGate)) {
    return [`${context}.review_gate must be an object`];
  }
  const currentGate = vocabularyReviewGate();
  if (plannedGate.status !== currentGate.status) {
    findings.push(`${context}.review_gate.status is stale; expected ${currentGate.status}, found ${plannedGate.status ?? "missing"}`);
  }
  if (JSON.stringify(plannedGate.vocabulary_source ?? null) !== JSON.stringify(currentGate.vocabulary_source)) {
    findings.push(`${context}.review_gate.vocabulary_source must match the current vocabulary source`);
  }
  if (JSON.stringify(plannedGate.evidence ?? null) !== JSON.stringify(currentGate.evidence)) {
    findings.push(`${context}.review_gate.evidence must match the current vocabulary review evidence`);
  }
  return findings;
}

export function validateCollectionPlanMatchesFreshGeneration(plan, context = "collection plan") {
  const result = spawnSync("node", ["scripts/plan_dataset_collection.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return [
      `${context} must regenerate with the strict planner before capture: ${
        (result.stderr || result.stdout || `process exited ${result.status}`).trim()
      }`,
    ];
  }
  let freshPlan;
  try {
    freshPlan = JSON.parse(result.stdout);
  } catch (error) {
    return [`${context} strict planner output must be valid JSON: ${error instanceof Error ? error.message : String(error)}`];
  }
  if (normalizedPlan(plan) !== normalizedPlan(freshPlan)) {
    return [`${context} must match a freshly generated strict collection plan before capture`];
  }
  return [];
}
