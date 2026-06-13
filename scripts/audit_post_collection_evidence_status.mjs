import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultChallengeReviewEvidencePath,
  defaultChallengeReviewPacketPath,
  defaultChallengeReviewerAuthorityPath,
  defaultChallengeReviewReceiptPath,
  defaultClipReviewEvidencePath,
  defaultClipReviewPacketPath,
  defaultClipReviewerAuthorityPath,
  defaultClipReviewReceiptPath,
  defaultStorePath,
  projectRelative,
  readStore,
  resolveProjectPath,
  root,
} from "./clip_review_utils.mjs";

const defaultReportPath = path.join(root, "docs", "validation", "post-collection-evidence-status.json");
const defaultSignerIdentityPath = path.join(root, "data", "signer-identity", "signer-identity-evidence.json");
const defaultManifestPaths = [
  path.join(root, "data", "manifests", "train.json"),
  path.join(root, "data", "manifests", "validation.json"),
  path.join(root, "data", "manifests", "test.json"),
  path.join(root, "data", "manifests", "negative-challenge.json"),
];
const allowedStatuses = new Set([
  "blocked_missing_collection_store",
  "blocked_missing_collected_clips",
  "blocked_missing_returned_packets",
  "blocked_invalid_returned_packets",
  "dry_run_valid_awaiting_apply",
]);
const requiredSourceFiles = [
  "scripts/report_post_collection_evidence_status.mjs",
  "scripts/audit_post_collection_evidence_status.mjs",
  "scripts/process_collected_dataset_evidence.mjs",
  "scripts/clip_review_utils.mjs",
  "scripts/export_clip_review_packet.mjs",
  "scripts/export_challenge_review_packet.mjs",
  "scripts/draft_post_collection_review_receipt.mjs",
  "scripts/import_clip_review.mjs",
  "scripts/import_challenge_review.mjs",
  "scripts/import_signer_identity_evidence.mjs",
  "scripts/audit_dataset_collection_readiness.mjs",
  "scripts/signed_receipt_utils.mjs",
  "scripts/export_dataset_manifests.mjs",
  "scripts/audit_final_manifests.py",
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
  node scripts/audit_post_collection_evidence_status.mjs [--report docs/validation/post-collection-evidence-status.json]

Audits the retained post-collection operator-readiness report. This audit proves
the status report is current and explicitly non-final; it does not prove dataset
collection, QA, manifest, or model readiness.
`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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
  if (typeof reference.exists !== "boolean") {
    blockers.push(`${context}.exists must be boolean`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (fs.existsSync(file) !== reference.exists) {
    blockers.push(`${context}.exists does not match current filesystem state for ${reference.path}`);
    return file;
  }
  if (reference.exists) {
    if (!isSha256(reference.sha256)) {
      blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest when file exists`);
    } else {
      const actual = sha256File(file);
      if (actual !== reference.sha256) {
        blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
      }
    }
  } else if (reference.sha256 !== null) {
    blockers.push(`${context}.sha256 must be null when file does not exist`);
  }
  return file;
}

function validateSourceFiles(report, blockers) {
  const refs = report.evidence?.source_files;
  if (!Array.isArray(refs)) {
    blockers.push("evidence.source_files must be an array");
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

function expectedStatus({ store, paths, dryRun }) {
  if (!paths.store.exists) return "blocked_missing_collection_store";
  if (store.datasetClips.length === 0 || store.datasetChallengeClips.length === 0) {
    return "blocked_missing_collected_clips";
  }
  if (
    !paths.clip_review_packet.exists ||
    !paths.challenge_review_packet.exists ||
    !paths.signer_identity_packet.exists
  ) {
    return "blocked_missing_returned_packets";
  }
  if (dryRun.status !== "passed") return "blocked_invalid_returned_packets";
  return "dry_run_valid_awaiting_apply";
}

function validateReport(report, reportPath) {
  const blockers = [];
  if (report.schema_version !== "asl-pilot-post-collection-evidence-status/v1") {
    blockers.push("schema_version must be asl-pilot-post-collection-evidence-status/v1");
  }
  if (!allowedStatuses.has(report.status)) blockers.push("status is not a recognized post-collection status");
  if (report.evidence_mode !== "operator_readiness") blockers.push("evidence_mode must be operator_readiness");
  if (report.finality !== "not_final_dataset_evidence") blockers.push("finality must be not_final_dataset_evidence");
  if (!isIsoDate(report.generated_at)) blockers.push("generated_at must be an ISO-compatible timestamp");
  const script = validateReference(report.runner?.script, "runner.script", blockers);
  if (script && projectRelative(script) !== "scripts/report_post_collection_evidence_status.mjs") {
    blockers.push("runner.script.path must be scripts/report_post_collection_evidence_status.mjs");
  }
  if (!Array.isArray(report.runner?.command) || !report.runner.command.some((item) => item.endsWith("scripts/report_post_collection_evidence_status.mjs"))) {
    blockers.push("runner.command must invoke scripts/report_post_collection_evidence_status.mjs");
  }

  const paths = report.paths ?? {};
  const storeFile = validateReference(paths.store, "paths.store", blockers);
  validateReference(paths.clip_review_packet, "paths.clip_review_packet", blockers);
  validateReference(paths.clip_reviewer_receipt, "paths.clip_reviewer_receipt", blockers);
  validateReference(paths.clip_reviewer_authority, "paths.clip_reviewer_authority", blockers);
  validateReference(paths.challenge_review_packet, "paths.challenge_review_packet", blockers);
  validateReference(paths.challenge_reviewer_receipt, "paths.challenge_reviewer_receipt", blockers);
  validateReference(paths.challenge_reviewer_authority, "paths.challenge_reviewer_authority", blockers);
  validateReference(paths.signer_identity_packet, "paths.signer_identity_packet", blockers);
  validateReference(paths.clip_review_evidence, "paths.clip_review_evidence", blockers);
  validateReference(paths.challenge_review_evidence, "paths.challenge_review_evidence", blockers);
  if (!Array.isArray(paths.manifests) || paths.manifests.length !== 4) {
    blockers.push("paths.manifests must contain the four final manifest paths");
  } else {
    paths.manifests.forEach((ref, index) => validateReference(ref, `paths.manifests[${index}]`, blockers));
  }
  if (paths.store?.path !== projectRelative(defaultStorePath)) {
    blockers.push(`paths.store.path must be ${projectRelative(defaultStorePath)}`);
  }
  if (paths.clip_review_packet?.path !== projectRelative(defaultClipReviewPacketPath)) {
    blockers.push(`paths.clip_review_packet.path must be ${projectRelative(defaultClipReviewPacketPath)}`);
  }
  if (paths.clip_reviewer_receipt?.path !== projectRelative(defaultClipReviewReceiptPath)) {
    blockers.push(`paths.clip_reviewer_receipt.path must be ${projectRelative(defaultClipReviewReceiptPath)}`);
  }
  if (paths.clip_reviewer_authority?.path !== projectRelative(defaultClipReviewerAuthorityPath)) {
    blockers.push(`paths.clip_reviewer_authority.path must be ${projectRelative(defaultClipReviewerAuthorityPath)}`);
  }
  if (paths.challenge_review_packet?.path !== projectRelative(defaultChallengeReviewPacketPath)) {
    blockers.push(`paths.challenge_review_packet.path must be ${projectRelative(defaultChallengeReviewPacketPath)}`);
  }
  if (paths.challenge_reviewer_receipt?.path !== projectRelative(defaultChallengeReviewReceiptPath)) {
    blockers.push(`paths.challenge_reviewer_receipt.path must be ${projectRelative(defaultChallengeReviewReceiptPath)}`);
  }
  if (paths.challenge_reviewer_authority?.path !== projectRelative(defaultChallengeReviewerAuthorityPath)) {
    blockers.push(`paths.challenge_reviewer_authority.path must be ${projectRelative(defaultChallengeReviewerAuthorityPath)}`);
  }
  if (paths.signer_identity_packet?.path !== projectRelative(defaultSignerIdentityPath)) {
    blockers.push(`paths.signer_identity_packet.path must be ${projectRelative(defaultSignerIdentityPath)}`);
  }
  if (paths.clip_review_evidence?.path !== projectRelative(defaultClipReviewEvidencePath)) {
    blockers.push(`paths.clip_review_evidence.path must be ${projectRelative(defaultClipReviewEvidencePath)}`);
  }
  if (paths.challenge_review_evidence?.path !== projectRelative(defaultChallengeReviewEvidencePath)) {
    blockers.push(`paths.challenge_review_evidence.path must be ${projectRelative(defaultChallengeReviewEvidencePath)}`);
  }
  if (Array.isArray(paths.manifests)) {
    paths.manifests.forEach((ref, index) => {
      const expectedPath = projectRelative(defaultManifestPaths[index]);
      if (ref?.path !== expectedPath) {
        blockers.push(`paths.manifests[${index}].path must be ${expectedPath}`);
      }
    });
  }

  const store = storeFile ? readStore(storeFile) : {
    datasetClips: [],
    datasetChallengeClips: [],
    consentRecords: [],
    datasetSigners: [],
  };
  const summary = report.collection_store_summary ?? {};
  if (summary.exists !== paths.store?.exists) blockers.push("collection_store_summary.exists must match paths.store.exists");
  if (summary.dataset_clip_count !== store.datasetClips.length) blockers.push("collection_store_summary.dataset_clip_count is stale");
  if (summary.challenge_clip_count !== store.datasetChallengeClips.length) blockers.push("collection_store_summary.challenge_clip_count is stale");
  if (summary.consent_record_count !== store.consentRecords.length) blockers.push("collection_store_summary.consent_record_count is stale");
  if (summary.signer_count !== store.datasetSigners.length) blockers.push("collection_store_summary.signer_count is stale");

  const packetReadiness = report.packet_readiness ?? {};
  const allInputsPresent = Boolean(
    paths.clip_review_packet?.exists &&
    paths.challenge_review_packet?.exists &&
    paths.signer_identity_packet?.exists,
  );
  if (packetReadiness.all_returned_inputs_present !== allInputsPresent) {
    blockers.push("packet_readiness.all_returned_inputs_present is stale");
  }
  if (packetReadiness.clip_review_packet_exportable !== Boolean(paths.store?.exists && store.datasetClips.length > 0)) {
    blockers.push("packet_readiness.clip_review_packet_exportable is stale");
  }
  if (packetReadiness.challenge_review_packet_exportable !== Boolean(paths.store?.exists && store.datasetChallengeClips.length > 0)) {
    blockers.push("packet_readiness.challenge_review_packet_exportable is stale");
  }
  if (packetReadiness.signer_identity_packet_required !== Boolean(paths.store?.exists && store.datasetSigners.length > 0)) {
    blockers.push("packet_readiness.signer_identity_packet_required is stale");
  }
  const dryRun = packetReadiness.dry_run ?? {};
  if (!["passed", "failed", "skipped_missing_inputs"].includes(dryRun.status)) {
    blockers.push("packet_readiness.dry_run.status must be passed, failed, or skipped_missing_inputs");
  }
  if (!Array.isArray(dryRun.command) || !dryRun.command.includes("scripts/process_collected_dataset_evidence.mjs")) {
    blockers.push("packet_readiness.dry_run.command must invoke scripts/process_collected_dataset_evidence.mjs");
  }
  if (dryRun.status === "skipped_missing_inputs" && dryRun.status_code !== null) {
    blockers.push("packet_readiness.dry_run.status_code must be null when skipped_missing_inputs");
  }
  if (dryRun.status !== "skipped_missing_inputs" && typeof dryRun.status_code !== "number") {
    blockers.push("packet_readiness.dry_run.status_code must be numeric when dry-run command executed");
  }
  const expected = expectedStatus({ store, paths, dryRun });
  if (report.status !== expected) {
    blockers.push(`status must be ${expected} for the current store and packet paths`);
  }
  if (report.final_readiness?.manifests_exist !== Boolean(Array.isArray(paths.manifests) && paths.manifests.every((item) => item.exists))) {
    blockers.push("final_readiness.manifests_exist is stale");
  }
  if (report.final_readiness?.dataset_collection_readiness?.status !== "failed" && report.status !== "dry_run_valid_awaiting_apply") {
    blockers.push("dataset collection readiness should remain failed until real QA collection evidence exists");
  }
  if (report.final_evidence_exclusion?.excluded_from_completion !== true) {
    blockers.push("final_evidence_exclusion.excluded_from_completion must be true");
  }
  if (!Array.isArray(report.next_required_steps) || report.next_required_steps.length === 0) {
    blockers.push("next_required_steps must be a non-empty array");
  }
  validateSourceFiles(report, blockers);
  if (projectRelative(reportPath) !== "docs/validation/post-collection-evidence-status.json") {
    blockers.push("report path must be docs/validation/post-collection-evidence-status.json");
  }

  return {
    status: blockers.length === 0 ? "passed" : "failed",
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
      status: "failed",
      checked_at: new Date().toISOString(),
      report: {
        path: projectRelative(reportPath),
        exists: false,
        sha256: null,
      },
      blockers: [`Post-collection evidence status report is missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Post-collection evidence status audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Post-collection evidence status audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Post-collection evidence status audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
