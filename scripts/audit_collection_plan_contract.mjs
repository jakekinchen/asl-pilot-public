import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireSnippets(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  const status = missing.length === 0 ? "passed" : "failed";
  checks.push({ id, label, path: relativePath, status, missing });
  for (const snippet of missing) {
    findings.push(`${id}: ${relativePath} is missing ${JSON.stringify(snippet)}`);
  }
}

requireSnippets(
  "plan_route_default_disabled",
  "Collection plan API is gated by explicit dataset collection mode",
  "web/src/app/api/dataset/plan/route.ts",
  [
    "ENABLE_DATASET_COLLECTION",
    "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION",
    "PRIVATE_DATASET_COLLECTION_ENABLED && PUBLIC_DATASET_COLLECTION_ENABLED",
    "review_gate",
    "Dataset collection is disabled by default",
    "collection-plan.json",
  ],
);

requireSnippets(
  "plan_route_requires_login",
  "Collection plan API requires an authenticated operator session",
  "web/src/app/api/dataset/plan/route.ts",
  ["getCurrentUser", "You must be logged in to view the collection plan"],
);

requireSnippets(
  "plan_route_exposes_remediation_queue",
  "Collection plan API returns the current remediation queue when it matches the active plan",
  "web/src/app/api/dataset/plan/route.ts",
  [
    "controlled-pilot-label-ladder-010-factorized-remediation-collection-queue.json",
    "rawframe-remediation-collection-queue.json",
    "resolveRemediationQueueCandidates",
    "readRemediationQueue",
    "queue_ready_not_training_data",
    "queue.inputs?.collection_plan?.sha256",
    "must reference the current collection plan",
    "remediationQueue",
  ],
);

requireSnippets(
  "collection_panel_loads_plan",
  "Dataset collection panel loads and applies plan assignments",
  "web/src/components/DatasetCollectionPanel.tsx",
  [
    "/api/dataset/plan",
    "CollectionPlan",
    "PlanPicker",
    "applyPlanAssignment",
    "Assignment key",
    "selectedAssignment.key",
    "vocabulary:${index}",
    "negative_challenge:${index}",
    "blockedPlanAssignmentKeys",
    "nextOpenPlanAssignmentAfter",
    "conditionMatchesCapture",
    "captureConditionPayload",
    "onSelectVocabulary",
  ],
);

requireSnippets(
  "collection_panel_uses_remediation_order",
  "Dataset collection panel orders assignments by remediation queue while keeping plan assignment keys",
  "web/src/components/DatasetCollectionPanel.tsx",
  [
    "RemediationQueue",
    "priorityByAssignmentKey",
    "comparePlanAssignments",
    "firstResponseAssignmentKey",
    "assignment_key",
    "Queue #",
  ],
);

requireSnippets(
  "collection_route_enforces_plan",
  "Dataset clip upload is bound to the reviewed collection plan on the server",
  "web/src/lib/server-store.ts",
  [
	    "COLLECTION_PLAN_PATH",
	    "planAssignmentKey",
	    "collectionPlanSha256",
	    "planAssignmentSnapshot",
	    "captureConditionEvidence",
	    "assertPlanAssignmentAvailableForCapture",
	    "currentReviewedCollectionPlanSha256",
	    "blockedPlanAssignmentKeys",
	    "validateCaptureConditionEvidence",
	    "assertCaptureMatchesCollectionPlan",
    "Collection plan must be generated after final vocabulary evidence",
    "Submitted vocabulary capture does not match the selected collection plan assignment",
    "Submitted challenge capture does not match the selected collection plan assignment",
    "already has a pending or approved clip",
  ],
);

requireSnippets(
  "planner_includes_negative_challenges",
  "Collection planner emits signer-disjoint negative challenge assignments",
  "scripts/plan_dataset_collection.mjs",
  [
	    "negative_challenge_assignments",
	    "challenge-signer-",
	    "signer_disjoint_from_vocabulary",
    "empty_camera",
    "no_hands_visible",
    "low_light",
    "off_center",
	  ],
	);

requireSnippets(
  "collection_plan_provenance_export",
  "Review packets, readiness, and manifests carry collection plan assignment and capture-condition evidence",
  "scripts/export_dataset_manifests.mjs",
  [
    "collection_plan: collectionPlan",
    "collection_plan_assignment: collectionPlanAssignmentFor(clip)",
    "capture_condition_evidence: captureConditionFor(clip)",
    "assertUniqueApprovedAssignmentKeys",
    "validatePlanAssignmentProvenance",
    "validateCaptureConditionEvidence",
  ],
);

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};

console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Collection plan contract audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
