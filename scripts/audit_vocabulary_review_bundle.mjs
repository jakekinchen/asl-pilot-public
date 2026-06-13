import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewEvidencePath,
  defaultReviewPacketPath,
  defaultReviewerAuthorityPath,
  parseVocabularySource,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
  vocabularyPath,
} from "./vocabulary_review_utils.mjs";

const defaultBundlePath = path.join(root, "output", "review-handoff", "vocabulary-review-bundle");
const reviewStatusBundleName = "REVIEW_STATUS.json";
const reviewRequestBundleName = "REVIEW_REQUEST.md";

const requiredReviewerFields = [
  "name",
  "role",
  "qualification",
  "affiliation_or_context",
  "contact_or_signed_evidence",
  "is_project_operator",
  "reviewed_at",
];

const requiredHintReviewFields = [
  "beginnerAppropriate",
  "aslAppropriate",
  "relatesToHintKind",
  "avoidsUnmeasuredAttemptDiagnosis",
];

const requiredImportCommands = [
  "node scripts/audit_vocabulary_review_bundle.mjs",
  "cp /path/to/returned/asl-pilot-vocabulary-review.json data/vocabulary-review/asl-pilot-vocabulary-review.json",
  "cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
  "node scripts/report_vocabulary_review_status.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
  "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
  "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --apply",
  "node scripts/audit_vocabulary_review.mjs",
  "node scripts/audit_hint_pedagogy_review.mjs",
];

function parseArgs(argv) {
  const args = { bundle: defaultBundlePath, allowDraft: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--allow-draft") {
      args.allowDraft = true;
      continue;
    }
    if (item === "--bundle") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --bundle");
      args.bundle = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_vocabulary_review_bundle.mjs [--allow-draft] [--bundle output/review-handoff/vocabulary-review-bundle]

Verifies that the ignored vocabulary-review handoff bundle matches the current
review packet, vocabulary source, bundled source files, and manifest hashes.
By default this is also a send-ready gate. Use --allow-draft only to check that
a draft_missing_reviewer_authority bundle is fresh without marking it send-ready.
`);
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function sameStringList(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function doNotSendReason(status, authorityPath) {
  if (status === "ready_for_external_reviewer") return null;
  if (status === "already_reviewed") {
    return "Final vocabulary review evidence already exists; this bundle is not a new reviewer send package.";
  }
  return `Missing valid pre-review trusted reviewer authority record at ${authorityPath}.`;
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return [fullPath];
  });
}

function validateManifest(manifest, packet, bundlePath, blockers, options = {}) {
  const { items } = parseVocabularySource();
  const vocabularyHash = sha256File(vocabularyPath);
  const reviewerAuthorityResult = validateVocabularyReviewerPreReviewAuthorityFile(defaultReviewerAuthorityPath);
  const reviewerAuthorityReady = reviewerAuthorityResult.findings.length === 0;
  const expectedStatus = fs.existsSync(defaultReviewEvidencePath)
    ? "already_reviewed"
    : reviewerAuthorityReady
      ? "ready_for_external_reviewer"
      : "draft_missing_reviewer_authority";
  if (manifest.schema_version !== "asl-pilot-vocabulary-review-bundle/v1") {
    blockers.push("MANIFEST.json schema_version must be asl-pilot-vocabulary-review-bundle/v1");
  }
  if (manifest.status !== expectedStatus) {
    blockers.push(`MANIFEST.json status must be ${expectedStatus}`);
  }
  const expectedSendReady = expectedStatus === "ready_for_external_reviewer";
  if (manifest.send_ready !== expectedSendReady) {
    blockers.push(`MANIFEST.json send_ready must be ${expectedSendReady}`);
  }
  const expectedDoNotSendReason = doNotSendReason(expectedStatus, projectRelative(defaultReviewerAuthorityPath));
  if (manifest.do_not_send_reason !== expectedDoNotSendReason) {
    blockers.push(`MANIFEST.json do_not_send_reason must be ${JSON.stringify(expectedDoNotSendReason)}`);
  }
  if (expectedStatus === "draft_missing_reviewer_authority" && options.allowDraft !== true) {
    blockers.push(
      "MANIFEST.json status is draft_missing_reviewer_authority; create a valid pre-review reviewer authority record before using this as a send-ready bundle",
    );
  }
  if (!isIsoDate(manifest.generated_at)) {
    blockers.push("MANIFEST.json generated_at must be an ISO-compatible timestamp");
  }
  if (manifest.bundle_root !== projectRelative(bundlePath)) {
    blockers.push(`MANIFEST.json bundle_root must be ${projectRelative(bundlePath)}`);
  }
  if (manifest.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    blockers.push("MANIFEST.json vocabulary_source.path must match current vocabulary source");
  }
  if (manifest.vocabulary_source?.sha256 !== vocabularyHash) {
    blockers.push("MANIFEST.json vocabulary_source.sha256 must match current vocabulary source");
  }
  if (manifest.vocabulary_source?.item_count !== items.length) {
    blockers.push("MANIFEST.json vocabulary_source.item_count must match current vocabulary source");
  }
  if (manifest.review_packet?.status !== packet.status) {
    blockers.push("MANIFEST.json review_packet.status must match the current review packet");
  }
  if (manifest.review_packet?.item_count !== (Array.isArray(packet.items) ? packet.items.length : 0)) {
    blockers.push("MANIFEST.json review_packet.item_count must match the current review packet");
  }
  if (manifest.review_packet?.source_hash_matches_current_vocabulary !== (packet.vocabulary_source?.sha256 === vocabularyHash)) {
    blockers.push("MANIFEST.json review_packet.source_hash_matches_current_vocabulary is stale");
  }
  if (packet.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    blockers.push("Canonical review packet vocabulary_source.path must match current vocabulary source");
  }
  if (packet.vocabulary_source?.sha256 !== vocabularyHash) {
    blockers.push("Canonical review packet vocabulary_source.sha256 must match current vocabulary source");
  }
  const sourceIds = items.map((item) => item.id).join("\n");
  const packetIds = Array.isArray(packet.items)
    ? packet.items.map((item) => item.id).join("\n")
    : "";
  if (packetIds !== sourceIds) {
    blockers.push("Canonical review packet item IDs must match current vocabulary order exactly");
  }
  if (manifest.review_packet?.source_hash_matches_current_vocabulary !== true) {
    blockers.push("MANIFEST.json review_packet.source_hash_matches_current_vocabulary must be true before sending the bundle");
  }
  validateReviewStatus(manifest.review_status, packet, bundlePath, blockers);
  validateReviewerAuthority(manifest.reviewer_authority, reviewerAuthorityResult, blockers);
  validateReviewRequest(manifest.review_request, bundlePath, blockers);
  if (manifest.final_review_evidence?.path !== projectRelative(defaultReviewEvidencePath)) {
    blockers.push("MANIFEST.json final_review_evidence.path must point to final vocabulary review evidence");
  }
  const finalReviewExists = fs.existsSync(defaultReviewEvidencePath);
  if (manifest.final_review_evidence?.exists !== finalReviewExists) {
    blockers.push("MANIFEST.json final_review_evidence.exists is stale");
  }
  const finalReviewHash = finalReviewExists ? sha256File(defaultReviewEvidencePath) : null;
  if (manifest.final_review_evidence?.sha256 !== finalReviewHash) {
    blockers.push("MANIFEST.json final_review_evidence.sha256 is stale");
  }
  validateReviewerRequirements(manifest.reviewer_requirements, blockers);
  if (!sameStringList(manifest.import_commands, requiredImportCommands)) {
    blockers.push("MANIFEST.json import_commands must use the status report, returned-review wrapper, vocabulary audit, and hint pedagogy audit");
  }
}

function validateReviewerAuthority(reference, reviewerAuthorityResult, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json reviewer_authority must be an object");
    return;
  }
  const exists = fs.existsSync(defaultReviewerAuthorityPath);
  const expectedPath = projectRelative(defaultReviewerAuthorityPath);
  if (reference.path !== expectedPath) {
    blockers.push(`MANIFEST.json reviewer_authority.path must be ${expectedPath}`);
  }
  if (reference.exists !== exists) {
    blockers.push("MANIFEST.json reviewer_authority.exists is stale");
  }
  const expectedHash = exists ? sha256File(defaultReviewerAuthorityPath) : null;
  if (reference.sha256 !== expectedHash) {
    blockers.push("MANIFEST.json reviewer_authority.sha256 is stale");
  }
  const expectedValid = reviewerAuthorityResult.findings.length === 0;
  if (reference.valid_for_pre_review !== expectedValid) {
    blockers.push("MANIFEST.json reviewer_authority.valid_for_pre_review is stale");
  }
  if (JSON.stringify(reference.first_findings ?? []) !== JSON.stringify(reviewerAuthorityResult.findings.slice(0, 10))) {
    blockers.push("MANIFEST.json reviewer_authority.first_findings must match current pre-review authority findings");
  }
  const authority = reviewerAuthorityResult.authority;
  if (authority?.reviewer) {
    for (const field of ["name", "role", "qualification", "affiliation_or_context", "contact_or_signed_evidence", "is_project_operator"]) {
      if (reference.reviewer?.[field] !== authority.reviewer[field]) {
        blockers.push(`MANIFEST.json reviewer_authority.reviewer.${field} must match the current authority record`);
      }
    }
  } else if (reference.reviewer !== null) {
    blockers.push("MANIFEST.json reviewer_authority.reviewer must be null when no authority reviewer is available");
  }
  if (authority?.trusted_key) {
    if (reference.trusted_key?.algorithm !== authority.trusted_key.algorithm) {
      blockers.push("MANIFEST.json reviewer_authority.trusted_key.algorithm must match the current authority record");
    }
    if (reference.trusted_key?.signer_key_fingerprint_sha256 !== authority.trusted_key.signer_key_fingerprint_sha256) {
      blockers.push("MANIFEST.json reviewer_authority.trusted_key.signer_key_fingerprint_sha256 must match the current authority record");
    }
  } else if (reference.trusted_key !== null) {
    blockers.push("MANIFEST.json reviewer_authority.trusted_key must be null when no authority key is available");
  }
  if (reference.trusted_at !== (authority?.trusted_at ?? null)) {
    blockers.push("MANIFEST.json reviewer_authority.trusted_at must match the current authority record");
  }
}

function validateReviewStatus(reference, packet, bundlePath, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json review_status must be an object");
    return;
  }
  const statusPath = path.join(bundlePath, reviewStatusBundleName);
  const expectedPath = projectRelative(statusPath);
  if (reference.path !== expectedPath) {
    blockers.push(`MANIFEST.json review_status.path must be ${expectedPath}`);
  }
  if (!isSha256(reference.sha256)) {
    blockers.push("MANIFEST.json review_status.sha256 must be a lowercase SHA-256 digest");
  }
  if (!fs.existsSync(statusPath)) {
    blockers.push(`${reviewStatusBundleName} is missing from the vocabulary review bundle`);
    return;
  }
  const actualHash = sha256File(statusPath);
  if (reference.sha256 !== actualHash) {
    blockers.push(`MANIFEST.json review_status.sha256 must match ${reviewStatusBundleName}`);
  }
  let statusReport;
  try {
    statusReport = readJson(statusPath);
  } catch (error) {
    blockers.push(`${reviewStatusBundleName} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  const packetHash = sha256File(defaultReviewPacketPath);
  const vocabularyHash = sha256File(vocabularyPath);
  const packetItemCount = Array.isArray(packet.items) ? packet.items.length : 0;
  const approvedItemCount = Array.isArray(packet.items)
    ? packet.items.filter((item) => item.approved === true).length
    : 0;
  const hintReviewIncomplete = Array.isArray(packet.items)
    ? packet.items.filter((item) => !(
        item.hintReview
        && typeof item.hintReview === "object"
        && !Array.isArray(item.hintReview)
        && requiredHintReviewFields.every((field) => item.hintReview[field] === true)
      )).length
    : 0;
  if (statusReport.schema_version !== "asl-pilot-vocabulary-review-status/v1") {
    blockers.push(`${reviewStatusBundleName} schema_version must be asl-pilot-vocabulary-review-status/v1`);
  }
  if (!["needs_review", "ready_for_import"].includes(statusReport.status)) {
    blockers.push(`${reviewStatusBundleName} status must be needs_review or ready_for_import`);
  }
  if (statusReport.input?.sha256 !== packetHash) {
    blockers.push(`${reviewStatusBundleName} input.sha256 must match the current canonical review packet`);
  }
  if (statusReport.input?.packet_status !== packet.status) {
    blockers.push(`${reviewStatusBundleName} input.packet_status must match the current canonical review packet`);
  }
  if (statusReport.vocabulary_source?.current_sha256 !== vocabularyHash) {
    blockers.push(`${reviewStatusBundleName} vocabulary_source.current_sha256 must match current vocabulary source`);
  }
  if (statusReport.vocabulary_source?.matches_current_source !== true) {
    blockers.push(`${reviewStatusBundleName} vocabulary_source.matches_current_source must be true`);
  }
  if (statusReport.vocabulary_source?.item_order_matches_current_source !== true) {
    blockers.push(`${reviewStatusBundleName} vocabulary_source.item_order_matches_current_source must be true`);
  }
  if (reference.status !== statusReport.status) {
    blockers.push(`MANIFEST.json review_status.status must match ${reviewStatusBundleName}`);
  }
  if (reference.packet_sha256 !== packetHash || reference.packet_sha256 !== statusReport.input?.sha256) {
    blockers.push("MANIFEST.json review_status.packet_sha256 must match the current canonical review packet");
  }
  if (reference.item_count !== packetItemCount || reference.item_count !== statusReport.items?.total) {
    blockers.push("MANIFEST.json review_status.item_count must match the current review packet");
  }
  if (reference.approved_item_count !== approvedItemCount || reference.approved_item_count !== statusReport.items?.approved) {
    blockers.push("MANIFEST.json review_status.approved_item_count must match the current review packet");
  }
  if (
    reference.hint_review_incomplete_count !== hintReviewIncomplete ||
    reference.hint_review_incomplete_count !== statusReport.items?.hint_review_incomplete
  ) {
    blockers.push("MANIFEST.json review_status.hint_review_incomplete_count must match the current review packet");
  }
  if (!Array.isArray(reference.missing_reviewer_fields)) {
    blockers.push("MANIFEST.json review_status.missing_reviewer_fields must be an array");
  } else if (JSON.stringify(reference.missing_reviewer_fields) !== JSON.stringify(statusReport.reviewer?.missing_fields ?? [])) {
    blockers.push("MANIFEST.json review_status.missing_reviewer_fields must match REVIEW_STATUS.json");
  }
  if (!Array.isArray(reference.invalid_reviewer_fields)) {
    blockers.push("MANIFEST.json review_status.invalid_reviewer_fields must be an array");
  } else if (JSON.stringify(reference.invalid_reviewer_fields) !== JSON.stringify(statusReport.reviewer?.invalid_fields ?? [])) {
    blockers.push("MANIFEST.json review_status.invalid_reviewer_fields must match REVIEW_STATUS.json");
  }
  if (reference.next_command !== statusReport.next_command) {
    blockers.push("MANIFEST.json review_status.next_command must match REVIEW_STATUS.json");
  }
}

function validateReviewRequest(reference, bundlePath, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json review_request must be an object");
    return;
  }
  const requestPath = path.join(bundlePath, reviewRequestBundleName);
  const expectedPath = projectRelative(requestPath);
  if (reference.path !== expectedPath) {
    blockers.push(`MANIFEST.json review_request.path must be ${expectedPath}`);
  }
  if (!isSha256(reference.sha256)) {
    blockers.push("MANIFEST.json review_request.sha256 must be a lowercase SHA-256 digest");
  }
  if (
    typeof reference.purpose !== "string" ||
    !(
      reference.purpose.includes("Ready-to-send external reviewer request") ||
      reference.purpose.includes("Draft external reviewer request blocked")
    )
  ) {
    blockers.push("MANIFEST.json review_request.purpose must describe the external reviewer request state");
  }
  if (!fs.existsSync(requestPath)) {
    blockers.push(`${reviewRequestBundleName} is missing from the vocabulary review bundle`);
    return;
  }
  if (reference.sha256 !== sha256File(requestPath)) {
    blockers.push(`MANIFEST.json review_request.sha256 must match ${reviewRequestBundleName}`);
  }
  const request = fs.readFileSync(requestPath, "utf8");
  const requiredSnippets = [
    "Subject: ASL Pilot vocabulary and coaching-hint review request",
    "Deaf educator or qualified ASL instructor",
    "`asl-pilot-vocabulary-review.json`",
    "`asl-pilot-vocabulary-reviewer-receipt.json`",
    "trusted reviewer key record",
    "data/vocabulary-review/asl-pilot-reviewer-authority.json",
    "`reviewStatus: \"reviewed\"`",
    "`hintReview.beginnerAppropriate: true`",
    "`hintReview.aslAppropriate: true`",
    "`hintReview.relatesToHintKind: true`",
    "`hintReview.avoidsUnmeasuredAttemptDiagnosis: true`",
    "node scripts/prepare_vocabulary_review_signature_request.mjs",
    "node scripts/prepare_vocabulary_reviewer_authority.mjs",
    "node scripts/compute_ed25519_public_key_fingerprint.mjs",
    "An unsigned draft is not final evidence",
    "Reviewer authority valid for pre-review:",
    "Only this pre-vetted reviewer/key may sign",
    "Reviewer authority name:",
    "Reviewer authority role:",
    "Reviewer authority qualification:",
    "Reviewer authority contact/evidence:",
  ];
  if (readJson(path.join(bundlePath, "MANIFEST.json")).status === "draft_missing_reviewer_authority") {
    requiredSnippets.push("DRAFT ONLY: DO NOT SEND");
    requiredSnippets.push("send_ready: false");
    requiredSnippets.push("do_not_send_reason: Missing valid pre-review trusted reviewer authority record");
    requiredSnippets.push("without `--allow-draft` before sending");
  }
  for (const snippet of requiredSnippets) {
    if (!request.includes(snippet)) {
      blockers.push(`${reviewRequestBundleName} must include ${snippet}`);
    }
  }
}

function validateReviewerRequirements(requirements, blockers) {
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) {
    blockers.push("MANIFEST.json reviewer_requirements must be an object");
    return;
  }
  const expected = {
    reviewer_must_be_deaf_educator_or_qualified_asl_instructor: true,
    reviewer_must_not_be_project_operator: true,
    returned_file: "asl-pilot-vocabulary-review.json",
    required_signed_receipt: "data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
    required_packet_status: "reviewed",
    required_reviewer_reviewed_at_format: "full_non_future_iso_timestamp_with_timezone",
    required_reviewer_is_project_operator: false,
    required_item_status: "reviewed",
    required_item_approval: true,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (requirements[key] !== value) {
      blockers.push(`MANIFEST.json reviewer_requirements.${key} must be ${JSON.stringify(value)}`);
    }
  }
  if (!sameStringList(requirements.required_reviewer_fields, requiredReviewerFields)) {
    blockers.push("MANIFEST.json reviewer_requirements.required_reviewer_fields is missing required reviewer fields");
  }
  if (!sameStringList(requirements.required_hint_review_fields, requiredHintReviewFields)) {
    blockers.push("MANIFEST.json reviewer_requirements.required_hint_review_fields is missing required hintReview fields");
  }
}

function validateFiles(manifest, bundlePath, blockers) {
  const records = Array.isArray(manifest.bundled_files) ? manifest.bundled_files : [];
  if (records.length === 0) {
    blockers.push("MANIFEST.json bundled_files must be a non-empty array");
    return;
  }
  const manifestPath = path.join(bundlePath, "MANIFEST.json");
  const readmePath = path.join(bundlePath, "REVIEWER_README.md");
  const reviewStatusPath = path.join(bundlePath, reviewStatusBundleName);
  const reviewRequestPath = path.join(bundlePath, reviewRequestBundleName);
  const expectedFiles = new Set([
    projectRelative(manifestPath),
    projectRelative(readmePath),
    projectRelative(reviewStatusPath),
    projectRelative(reviewRequestPath),
  ]);
  if (!fs.existsSync(readmePath)) {
    blockers.push("REVIEWER_README.md is missing from the vocabulary review bundle");
  } else {
    validateReviewerReadme(readmePath, manifestPath, manifest, blockers);
  }
  let includesReviewPacket = false;
  for (const [index, record] of records.entries()) {
    const context = `MANIFEST.json bundled_files[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      blockers.push(`${context} must be an object`);
      continue;
    }
    for (const key of ["source_path", "bundle_path", "purpose"]) {
      if (typeof record[key] !== "string" || record[key].trim().length === 0) {
        blockers.push(`${context}.${key} must be a non-empty string`);
      }
    }
    if (typeof record.required_for_return !== "boolean") {
      blockers.push(`${context}.required_for_return must be boolean`);
    }
    if (!isSha256(record.sha256)) {
      blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
      continue;
    }
    let sourcePath;
    let bundledPath;
    try {
      sourcePath = resolveProjectPath(record.source_path, `${context}.source_path`);
      bundledPath = resolveProjectPath(record.bundle_path, `${context}.bundle_path`);
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    if (!bundledPath.startsWith(`${bundlePath}${path.sep}`)) {
      blockers.push(`${context}.bundle_path must stay inside the bundle root`);
      continue;
    }
    expectedFiles.add(projectRelative(bundledPath));
    if (!fs.existsSync(sourcePath)) {
      blockers.push(`${context}.source_path is missing: ${record.source_path}`);
    } else if (sha256File(sourcePath) !== record.sha256) {
      blockers.push(`${context}.sha256 must match current source_path ${record.source_path}`);
    }
    if (!fs.existsSync(bundledPath)) {
      blockers.push(`${context}.bundle_path is missing: ${record.bundle_path}`);
    } else if (sha256File(bundledPath) !== record.sha256) {
      blockers.push(`${context}.sha256 must match bundled file ${record.bundle_path}`);
    }
    if (record.source_path === projectRelative(defaultReviewPacketPath)) {
      includesReviewPacket = true;
      if (record.required_for_return !== true) {
        blockers.push(`${context}.required_for_return must be true for the canonical JSON review packet`);
      }
    }
  }
  if (!includesReviewPacket) {
    blockers.push("MANIFEST.json bundled_files must include the canonical vocabulary review packet");
  }
  for (const file of walkFiles(bundlePath)) {
    const relativePath = projectRelative(file);
    if (!expectedFiles.has(relativePath)) {
      blockers.push(`Vocabulary review bundle contains unmanifested file: ${relativePath}`);
    }
  }
}

function validateReviewerReadme(readmePath, manifestPath, manifest, blockers) {
  const readme = fs.readFileSync(readmePath, "utf8");
  const manifestHash = sha256File(manifestPath);
  const requiredSnippets = [
    "Edit and return only:",
    "`asl-pilot-vocabulary-review.json`",
    "`asl-pilot-vocabulary-reviewer-receipt.json`",
    "vocabulary-reviewer-authority.template.json",
    "data/vocabulary-review/asl-pilot-reviewer-authority.json",
    "vocabulary-reviewer-receipt.template.json",
    "`reviewStatus: \"reviewed\"`",
    "`approved: true`",
    "`reviewer.is_project_operator: false`",
    "signature_evidence",
    "operator trust-attestation evidence",
    "full non-future ISO timestamp with timezone",
    reviewStatusBundleName,
    "Current packet status:",
    "Approved items:",
    "Incomplete hint reviews:",
    "Reviewer authority valid for pre-review:",
    "node scripts/prepare_vocabulary_review_bundle.mjs",
    "node scripts/report_vocabulary_review_status.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
    "node scripts/draft_vocabulary_reviewer_receipt.mjs",
    "node scripts/draft_vocabulary_reviewer_receipt.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json --write",
    "node scripts/prepare_vocabulary_reviewer_authority.mjs",
    "node scripts/compute_ed25519_public_key_fingerprint.mjs",
    "node scripts/prepare_vocabulary_review_signature_request.mjs",
    "output/review-handoff/vocabulary-review-signature-request/",
    "Only the returned signed receipt is final evidence",
    "unsigned draft for reviewer signature only",
    "do not treat that draft as final evidence",
    "cp /path/to/returned/asl-pilot-vocabulary-review.json data/vocabulary-review/asl-pilot-vocabulary-review.json",
    "cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
    "--private-key /path/to/reviewer-ed25519-private-key.pem --verify",
    "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
    "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --apply",
    "node scripts/audit_hint_pedagogy_review.mjs",
    manifestHash,
  ];
  if (manifest.send_ready !== true) {
    requiredSnippets.push("DRAFT ONLY: DO NOT SEND");
    requiredSnippets.push("send_ready: false");
    requiredSnippets.push(`do_not_send_reason: ${manifest.do_not_send_reason}`);
    requiredSnippets.push("without `--allow-draft` before sending");
  }
  for (const field of requiredReviewerFields) {
    if (field === "is_project_operator") continue;
    requiredSnippets.push(`reviewer.${field}`);
  }
  for (const field of requiredHintReviewFields) {
    requiredSnippets.push(`hintReview.${field}: true`);
  }
  for (const snippet of requiredSnippets) {
    if (!readme.includes(snippet)) {
      blockers.push(`REVIEWER_README.md must include ${snippet}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const bundlePath = resolveProjectPath(args.bundle, "--bundle");
  const manifestPath = path.join(bundlePath, "MANIFEST.json");
  const blockers = [];
  if (!fs.existsSync(manifestPath)) {
    blockers.push(`Vocabulary review bundle manifest is missing: ${projectRelative(manifestPath)}`);
  }
  if (!fs.existsSync(defaultReviewPacketPath)) {
    blockers.push(`Vocabulary review packet is missing: ${projectRelative(defaultReviewPacketPath)}`);
  }
  let manifest = null;
  let packet = null;
  if (blockers.length === 0) {
    manifest = readJson(manifestPath);
    packet = readJson(defaultReviewPacketPath);
    validateManifest(manifest, packet, bundlePath, blockers, { allowDraft: args.allowDraft });
    validateFiles(manifest, bundlePath, blockers);
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    bundle: projectRelative(bundlePath),
    manifest: projectRelative(manifestPath),
    manifest_status: manifest?.status ?? null,
    manifest_send_ready: manifest?.send_ready ?? null,
    send_ready: blockers.length === 0 && manifest?.status === "ready_for_external_reviewer" && manifest?.send_ready === true,
    already_reviewed: blockers.length === 0 && manifest?.status === "already_reviewed",
    allow_draft: args.allowDraft,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Vocabulary review bundle audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review bundle audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
