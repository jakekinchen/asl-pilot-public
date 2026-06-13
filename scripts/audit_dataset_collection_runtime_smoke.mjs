import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "validation", "dataset-collection-runtime-smoke.json");
const requiredSourceFiles = [
  "scripts/run_dataset_collection_runtime_smoke.mjs",
  "scripts/audit_dataset_collection_runtime_smoke.mjs",
  "web/src/lib/server-store.ts",
  "web/src/app/api/dataset/plan/route.ts",
  "web/src/app/api/dataset/clips/route.ts",
  "web/src/app/api/dataset/coverage/route.ts",
  "web/src/components/DatasetCollectionPanel.tsx",
  "docs/privacy/dataset-consent-form.md",
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
  node scripts/audit_dataset_collection_runtime_smoke.mjs [--report docs/validation/dataset-collection-runtime-smoke.json]

Audits the retained smoke-only explicit dataset collection runtime report. This
report proves collection API wiring only and must not be treated as final
dataset evidence.
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

function validateReference(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (typeof reference.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function validateSourceReferences(report, blockers) {
  const refs = report.evidence?.source_files;
  if (!Array.isArray(refs) || refs.length === 0) {
    blockers.push("evidence.source_files must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const [index, ref] of refs.entries()) {
    const file = validateReference(ref, `evidence.source_files[${index}]`, blockers);
    if (file) seen.add(projectRelative(file));
  }
  for (const requiredPath of requiredSourceFiles) {
    if (!seen.has(requiredPath)) blockers.push(`evidence.source_files must include ${requiredPath}`);
  }
}

function validateReport(report, reportPath) {
  const blockers = [];
  if (report.schema_version !== "asl-pilot-dataset-collection-runtime-smoke/v1") {
    blockers.push("schema_version must be asl-pilot-dataset-collection-runtime-smoke/v1");
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (report.evidence_mode !== "smoke") blockers.push("evidence_mode must be smoke");
  if (report.finality !== "smoke_only") blockers.push("finality must be smoke_only");
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push("blockers must be empty when status is passed");
  }
  if (!isIsoDate(report.tested_at)) blockers.push("tested_at must be a real ISO-compatible date string");
  if (report.runner?.tool !== "node-fetch") blockers.push("runner.tool must be node-fetch");
  const script = validateReference(report.runner?.script, "runner.script", blockers);
  if (script && projectRelative(script) !== "scripts/run_dataset_collection_runtime_smoke.mjs") {
    blockers.push("runner.script.path must be scripts/run_dataset_collection_runtime_smoke.mjs");
  }

  const fixtureRefs = [
    ["fixtures.store", report.fixtures?.store],
    ["fixtures.reviewed_vocabulary_source", report.fixtures?.reviewed_vocabulary_source],
    ["fixtures.vocabulary_review_evidence", report.fixtures?.vocabulary_review_evidence],
    ["fixtures.collection_plan", report.fixtures?.collection_plan],
  ];
  for (const [context, ref] of fixtureRefs) validateReference(ref, context, blockers);
  if (String(report.fixtures?.store?.path ?? "").includes("data/asl-pilot-store.json")) {
    blockers.push("fixtures.store must be isolated smoke output, not the final data/asl-pilot-store.json");
  }
  if (String(report.fixtures?.collection_plan?.path ?? "").includes("data/dataset/collection-plan.json")) {
    blockers.push("fixtures.collection_plan must be isolated smoke output, not the final collection plan");
  }
  if (!String(report.fixtures?.clip_root ?? "").startsWith("output/")) {
    blockers.push("fixtures.clip_root must be under ignored smoke output");
  }

  if (report.runtime_env?.ENABLE_DATASET_COLLECTION !== "true") {
    blockers.push("runtime_env.ENABLE_DATASET_COLLECTION must be true");
  }
  if (report.runtime_env?.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION !== "true") {
    blockers.push("runtime_env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION must be true");
  }
  if (report.runtime_env?.ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES !== "true") {
    blockers.push("runtime_env.ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES must be true for smoke-only reviewed-vocabulary fixtures");
  }
  for (const key of [
    "ASL_PILOT_STORE_PATH",
    "ASL_PILOT_DATASET_CLIP_ROOT",
    "ASL_PILOT_COLLECTION_PLAN_PATH",
    "ASL_PILOT_VOCABULARY_SOURCE_PATH",
    "ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH",
  ]) {
    if (typeof report.runtime_env?.[key] !== "string" || !report.runtime_env[key].startsWith("output/")) {
      blockers.push(`runtime_env.${key} must point to isolated output fixtures`);
    }
  }

  const collection = report.collection;
  if (collection?.ran_collection_mode !== true) blockers.push("collection.ran_collection_mode must be true");
  if (collection?.reviewed_plan_loaded !== true) blockers.push("collection.reviewed_plan_loaded must be true");
  if (collection?.saved_vocabulary_clip !== true) blockers.push("collection.saved_vocabulary_clip must be true");
  if (collection?.rejected_duplicate_vocabulary_assignment !== true) {
    blockers.push("collection.rejected_duplicate_vocabulary_assignment must be true");
  }
  if (collection?.saved_negative_challenge_clip !== true) blockers.push("collection.saved_negative_challenge_clip must be true");
  if (collection?.rejected_duplicate_challenge_assignment !== true) {
    blockers.push("collection.rejected_duplicate_challenge_assignment must be true");
  }
  if (collection?.coverage_separates_pending_from_exportable !== true) {
    blockers.push("collection.coverage_separates_pending_from_exportable must be true");
  }
  if (collection?.returned_rows?.vocabulary_clip?.labelReviewStatus !== "needs_qa") {
    blockers.push("returned vocabulary clip must remain pending clip QA");
  }
  if (collection?.returned_rows?.vocabulary_clip?.planAssignmentKey !== "vocabulary:0") {
    blockers.push("returned vocabulary clip must retain the selected vocabulary plan assignment key");
  }
  if (collection?.returned_rows?.vocabulary_clip?.collectionPlanReviewGateStatus !== "source_curated") {
    blockers.push("returned vocabulary clip must retain source-curated collection-plan gate provenance");
  }
  if (collection?.returned_rows?.vocabulary_clip?.captureConditionEvidence?.captureEnvironment !== "controlled_vocabulary") {
    blockers.push("returned vocabulary clip must retain controlled-vocabulary capture-condition evidence");
  }
  if (collection?.returned_rows?.challenge_clip?.challengeReviewStatus !== "needs_review") {
    blockers.push("returned challenge clip must remain pending challenge review");
  }
  if (collection?.returned_rows?.challenge_clip?.planAssignmentKey !== "negative_challenge:0") {
    blockers.push("returned challenge clip must retain the selected negative-challenge plan assignment key");
  }
  if (collection?.returned_rows?.challenge_clip?.collectionPlanReviewGateStatus !== "source_curated") {
    blockers.push("returned challenge clip must retain source-curated collection-plan gate provenance");
  }
  if (collection?.returned_rows?.challenge_clip?.captureConditionEvidence?.captureEnvironment !== "negative_challenge") {
    blockers.push("returned challenge clip must retain negative-challenge capture-condition evidence");
  }
  const selectedChallengeType =
    collection?.returned_rows?.challenge_clip?.challengeType ??
    collection?.returned_rows?.challenge_clip?.planAssignmentSnapshot?.challenge_type ??
    null;
  if (typeof selectedChallengeType !== "string" || selectedChallengeType.length === 0) {
    blockers.push("returned challenge clip must retain a selected challenge type");
  }
  if (collection?.returned_rows?.challenge_clip?.captureConditionEvidence?.challengeType !== selectedChallengeType) {
    blockers.push("returned challenge clip capture-condition evidence must match the selected challenge type");
  }
  if (collection?.returned_rows?.challenge_clip?.planAssignmentSnapshot?.challenge_type !== selectedChallengeType) {
    blockers.push("returned challenge clip plan assignment snapshot must match the selected challenge type");
  }
  if (collection?.coverage?.consentedClips !== 1 || collection?.coverage?.exportableClips !== 0) {
    blockers.push("coverage must count one consented but zero exportable vocabulary clips");
  }
  if (collection?.coverage?.consentedChallengeClips !== 1 || collection?.coverage?.exportableChallengeClips !== 0) {
    blockers.push("coverage must count one consented but zero exportable challenge clips");
  }
  if (collection?.coverage?.signerSplit !== "train") {
    blockers.push("coverage must resolve the selected signer to the train split");
  }
  if (collection?.coverage?.selectedLabelCoverage?.train !== 1) {
    blockers.push("coverage.selectedLabelCoverage.train must count the smoke vocabulary clip");
  }
  if (collection?.coverage?.selectedLabelExportableCoverage?.train !== 0) {
    blockers.push("coverage.selectedLabelExportableCoverage.train must remain zero");
  }
  if (
    typeof selectedChallengeType === "string" &&
    collection?.coverage?.consentedChallengeCountsByType?.[selectedChallengeType] !== 1
  ) {
    blockers.push(`coverage must count one consented ${selectedChallengeType} challenge clip`);
  }
  if (
    typeof selectedChallengeType === "string" &&
    collection?.coverage?.exportableChallengeCountsByType?.[selectedChallengeType] !== 0
  ) {
    blockers.push(`coverage must count zero exportable ${selectedChallengeType} challenge clips`);
  }
  if (!Array.isArray(collection?.saved_clip_files) || collection.saved_clip_files.length !== 2) {
    blockers.push("collection.saved_clip_files must contain two saved smoke clip files");
  } else {
    for (const [index, ref] of collection.saved_clip_files.entries()) {
      validateReference(ref, `collection.saved_clip_files[${index}]`, blockers);
    }
  }
  if (report.final_evidence_exclusion?.excluded_from_completion !== true) {
    blockers.push("final_evidence_exclusion.excluded_from_completion must be true");
  }
  validateSourceReferences(report, blockers);

  return {
    status: blockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    report: {
      path: projectRelative(reportPath),
      exists: fs.existsSync(reportPath),
      sha256: fs.existsSync(reportPath) ? sha256File(reportPath) : null,
    },
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const reportPath = args.report ? resolveProjectPath(args.report, "--report") : defaultReportPath;
  if (!fs.existsSync(reportPath)) {
    const summary = {
      status: "incomplete",
      checked_at: new Date().toISOString(),
      report: {
        path: projectRelative(reportPath),
        exists: false,
        sha256: null,
      },
      blockers: [`Dataset collection runtime smoke report is missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Dataset collection runtime smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Dataset collection runtime smoke audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Dataset collection runtime smoke audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
