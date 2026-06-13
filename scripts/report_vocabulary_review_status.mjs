import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  canonicalVocabularyReviewerReceiptPayload,
  defaultReviewPacketPath,
  defaultReviewReceiptPath,
  defaultReviewerAuthorityPath,
  parseVocabularySource,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  isPlaceholderString,
  isFutureTimestamp,
  isIsoTimestamp,
  validateCompletedVocabularyReviewPacket,
  validateVocabularyReviewerAuthorityFile,
  validateVocabularyReviewerReceipt,
  validateVocabularyReviewerReceiptFile,
  vocabularyPath,
} from "./vocabulary_review_utils.mjs";
import {
  sha256Text,
} from "./signed_receipt_utils.mjs";

const hintReviewKeys = [
  "beginnerAppropriate",
  "aslAppropriate",
  "relatesToHintKind",
  "avoidsUnmeasuredAttemptDiagnosis",
];

function parseArgs(argv) {
  const args = { input: defaultReviewPacketPath, limit: 25 };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--input" || item === "--reviewer-receipt" || item === "--reviewer-authority") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    if (item === "--limit") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      const limit = Number.parseInt(value, 10);
      if (!Number.isInteger(limit) || limit < 1) throw new Error("--limit must be a positive integer");
      args.limit = limit;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/report_vocabulary_review_status.mjs \\
    [--input data/vocabulary-review/asl-pilot-vocabulary-review.json] \\
    [--reviewer-receipt data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json] \\
    [--reviewer-authority data/vocabulary-review/asl-pilot-reviewer-authority.json] \\
    [--limit 25]

Prints a concise read-only status report for the returned vocabulary review
packet. This never imports review evidence or edits the vocabulary source.
`);
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    const key = typeof value === "string" && value.trim().length > 0 ? value : "missing";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function reviewerSummary(reviewer) {
  const required = [
    "name",
    "role",
    "reviewed_at",
    "qualification",
    "affiliation_or_context",
    "contact_or_signed_evidence",
  ];
  const missingFields = required.filter((key) => (
    isPlaceholderString(reviewer?.[key])
  ));
  const genericDefault = "deaf educator or qualified asl instructor";
  const placeholderQualificationFields = ["role", "qualification"].filter((key) => (
    String(reviewer?.[key] ?? "").trim().toLowerCase() === genericDefault
  ));
  const invalidFields = [];
  if (
    typeof reviewer?.reviewed_at === "string" &&
    reviewer.reviewed_at.trim().length > 0 &&
    !isPlaceholderString(reviewer.reviewed_at)
  ) {
    if (!isIsoTimestamp(reviewer.reviewed_at)) invalidFields.push("reviewed_at");
    if (isFutureTimestamp(reviewer.reviewed_at)) invalidFields.push("reviewed_at_future");
  }
  return {
    missing_fields: missingFields,
    invalid_fields: [...new Set(invalidFields)],
    placeholder_qualification_fields: placeholderQualificationFields,
    role: typeof reviewer?.role === "string" ? reviewer.role : null,
    is_project_operator: reviewer?.is_project_operator ?? null,
    reviewed_at: typeof reviewer?.reviewed_at === "string" ? reviewer.reviewed_at : null,
  };
}

function itemSummary(items, limit) {
  const rows = Array.isArray(items) ? items : [];
  const approvedItems = rows.filter((item) => item.approved === true);
  const reviewedStatusItems = rows.filter((item) => item.reviewStatus === "reviewed");
  const hintReviewCompleteItems = rows.filter((item) => (
    item.hintReview
    && typeof item.hintReview === "object"
    && !Array.isArray(item.hintReview)
    && hintReviewKeys.every((key) => item.hintReview[key] === true)
  ));
  const blockers = [];
  for (const [index, item] of rows.entries()) {
    const label = typeof item?.id === "string" ? item.id : `items[${index}]`;
    if (item?.approved !== true) blockers.push(`${label}: approved must be true`);
    if (item?.reviewStatus !== "reviewed") blockers.push(`${label}: reviewStatus must be reviewed`);
    if (!item?.hintReview || typeof item.hintReview !== "object" || Array.isArray(item.hintReview)) {
      blockers.push(`${label}: hintReview must be completed`);
    } else {
      for (const key of hintReviewKeys) {
        if (item.hintReview[key] !== true) blockers.push(`${label}: hintReview.${key} must be true`);
      }
    }
    if (blockers.length >= limit) break;
  }
  return {
    total: rows.length,
    approved: approvedItems.length,
    review_status_counts: countBy(rows.map((item) => item?.reviewStatus)),
    reviewed_status: reviewedStatusItems.length,
    hint_review_complete: hintReviewCompleteItems.length,
    hint_review_incomplete: rows.length - hintReviewCompleteItems.length,
    first_item_blockers: blockers,
  };
}

function importDryRun(inputRelativePath, reviewerReceiptRelativePath, limit) {
  const command = [
    process.execPath,
    "scripts/import_vocabulary_review.mjs",
    "--input",
    inputRelativePath,
    ...(reviewerReceiptRelativePath ? ["--reviewer-receipt", reviewerReceiptRelativePath] : []),
    "--dry-run",
  ];
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root,
    encoding: "utf8",
  });
  const text = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
  return {
    command: ["node", ...command.slice(1)],
    exit_code: result.status,
    ok: result.status === 0,
    first_messages: splitMessages(text).slice(0, limit),
  };
}

function splitMessages(text) {
  if (!text) return [];
  return text
    .replace(/^Vocabulary review import failed:\s*/i, "")
    .split(/;\s*|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function packetOnlyFindings(findings) {
  return findings.filter((finding) => (
    !finding.startsWith("Reviewer signed receipt") &&
    !finding.startsWith("Reviewer authority record")
  ));
}

function nextCommand({
  status,
  inputRelativePath,
  packetFindings,
  receiptSummary,
}) {
  if (packetFindings.length > 0) {
    return "Return the packet to the ASL reviewer until every reviewer field, item approval, reviewStatus, and hintReview checkbox is complete.";
  }
  const canonicalPacketPath = projectRelative(defaultReviewPacketPath);
  const canonicalReceiptPath = projectRelative(defaultReviewReceiptPath);
  const canonicalAuthorityPath = projectRelative(defaultReviewerAuthorityPath);
  if (status === "candidate_ready_for_canonical_staging") {
    return `Copy the validated returned packet to ${canonicalPacketPath}, signed reviewer receipt to ${canonicalReceiptPath}, and trusted reviewer key record to ${canonicalAuthorityPath}, then rerun the status report before applying.`;
  }
  if (status === "ready_for_import") {
    return `node scripts/process_returned_vocabulary_review.mjs --input ${inputRelativePath} --apply`;
  }
  if (!receiptSummary.exists) {
    if (inputRelativePath === canonicalPacketPath) {
      return `Run node scripts/prepare_vocabulary_review_signature_request.mjs, send the generated signature-request folder to the reviewer, then stage the signed receipt at ${canonicalReceiptPath} and trusted reviewer key record at ${canonicalAuthorityPath}.`;
    }
    return `Copy the completed packet to ${canonicalPacketPath}, run node scripts/prepare_vocabulary_review_signature_request.mjs, then stage the signed receipt at ${canonicalReceiptPath} and trusted reviewer key record at ${canonicalAuthorityPath}.`;
  }
  if (!receiptSummary.signature_verified) {
    return `Fix or regenerate the Ed25519 reviewer receipt, then stage it at ${canonicalReceiptPath}.`;
  }
  if (!receiptSummary.reviewer_authority.exists) {
    return `Stage a trusted reviewer key record at ${canonicalAuthorityPath} using docs/review/vocabulary-reviewer-authority.template.json, then rerun the status report.`;
  }
  if (!receiptSummary.reviewer_authority.valid) {
    return `Fix the trusted reviewer key record at ${canonicalAuthorityPath} until it matches the returned packet reviewer and signed receipt key.`;
  }
  return "Inspect import_dry_run.first_messages and fix the remaining import blocker before applying.";
}

function statusForReview({ validationFindings, dryRun, receiptSummary, inputRelativePath }) {
  const canonicalPacketPath = projectRelative(defaultReviewPacketPath);
  const canonicalReceiptPath = projectRelative(defaultReviewReceiptPath);
  const canonicalAuthorityPath = projectRelative(defaultReviewerAuthorityPath);
  const candidateReady = validationFindings.length === 0 &&
    receiptSummary.valid &&
    receiptSummary.reviewer_authority.valid;
  if (!candidateReady) return "needs_review";
  if (
    inputRelativePath === canonicalPacketPath &&
    receiptSummary.path === canonicalReceiptPath &&
    receiptSummary.reviewer_authority.path === canonicalAuthorityPath &&
    dryRun.ok
  ) {
    return "ready_for_import";
  }
  return "candidate_ready_for_canonical_staging";
}

function reviewerReceiptSummary(receiptPath, reviewerAuthorityPath, packet, inputPath, provided, authorityProvided, limit) {
  const exists = fs.existsSync(receiptPath);
  const authorityExists = fs.existsSync(reviewerAuthorityPath);
  const summary = {
    path: projectRelative(receiptPath),
    provided,
    exists,
    sha256: exists ? sha256File(receiptPath) : null,
    valid: false,
    signature_verified: false,
    algorithm: null,
    signer_key_fingerprint_sha256: null,
    signed_payload_sha256: null,
    expected_signed_payload_sha256: null,
    signed_payload_sha256_matches: false,
    review_packet_sha_matches: false,
    reviewer_authority: {
      path: projectRelative(reviewerAuthorityPath),
      provided: authorityProvided,
      exists: authorityExists,
      sha256: authorityExists ? sha256File(reviewerAuthorityPath) : null,
      valid: false,
      first_findings: [],
    },
    first_findings: [],
  };
  const { findings, receipt } = validateVocabularyReviewerReceiptFile(receiptPath, packet, inputPath, {
    reviewerAuthorityPath,
  });
  summary.first_findings = findings.slice(0, limit);
  summary.valid = exists && findings.length === 0;
  if (receipt) {
    const receiptOnlyFindings = validateVocabularyReviewerReceipt(receipt, packet, inputPath, receiptPath);
    const expectedPayloadDigest = sha256Text(canonicalVocabularyReviewerReceiptPayload(receipt));
    summary.signature_verified = receiptOnlyFindings.length === 0;
    summary.algorithm = receipt.signature_evidence?.algorithm ?? null;
    summary.signer_key_fingerprint_sha256 = receipt.signature_evidence?.signer_key_fingerprint_sha256 ?? null;
    summary.signed_payload_sha256 = receipt.signature_evidence?.signed_payload_sha256 ?? null;
    summary.expected_signed_payload_sha256 = expectedPayloadDigest;
    summary.signed_payload_sha256_matches = summary.signed_payload_sha256 === expectedPayloadDigest;
    summary.review_packet_sha_matches =
      receipt.review_packet?.path === projectRelative(inputPath) &&
      receipt.review_packet?.sha256 === sha256File(inputPath);
    const authorityResult = validateVocabularyReviewerAuthorityFile(reviewerAuthorityPath, packet, receipt);
    summary.reviewer_authority.valid = authorityResult.findings.length === 0;
    summary.reviewer_authority.first_findings = authorityResult.findings.slice(0, limit);
  }
  return summary;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const inputPath = resolveProjectPath(args.input, "--input");
  const reviewerReceiptPath = args.reviewer_receipt
    ? resolveProjectPath(args.reviewer_receipt, "--reviewer-receipt")
    : defaultReviewReceiptPath;
  const reviewerAuthorityPath = args.reviewer_authority
    ? resolveProjectPath(args.reviewer_authority, "--reviewer-authority")
    : defaultReviewerAuthorityPath;
  const packet = readJson(inputPath);
  const inputRelativePath = projectRelative(inputPath);
  const reviewerReceiptRelativePath = projectRelative(reviewerReceiptPath);
  const sourceHash = sha256File(vocabularyPath);
  const { items: currentItems } = parseVocabularySource();
  const packetItems = Array.isArray(packet.items) ? packet.items : [];
  const validationFindings = validateCompletedVocabularyReviewPacket(packet, {
    reviewPacketPath: inputPath,
    reviewerReceiptPath,
    reviewerAuthorityPath,
  });
  const currentIds = currentItems.map((item) => item.id).join("\n");
  const packetIds = packetItems.map((item) => item.id).join("\n");
  if (currentIds !== packetIds) {
    validationFindings.push("review packet item IDs must match current vocabulary order exactly");
  }
  if (packet.vocabulary_source?.sha256 !== sourceHash) {
    validationFindings.push("review packet vocabulary_source.sha256 must match current vocabulary source before import");
  }
  const receiptSummary = reviewerReceiptSummary(
    reviewerReceiptPath,
    reviewerAuthorityPath,
    packet,
    inputPath,
    Boolean(args.reviewer_receipt),
    Boolean(args.reviewer_authority),
    args.limit,
  );
  const dryRun = importDryRun(inputRelativePath, reviewerReceiptRelativePath, args.limit);
  const status = statusForReview({
    validationFindings,
    dryRun,
    receiptSummary,
    inputRelativePath,
  });
  const packetFindings = packetOnlyFindings(validationFindings);

  console.log(JSON.stringify({
    schema_version: "asl-pilot-vocabulary-review-status/v1",
    status,
    checked_at: new Date().toISOString(),
    input: {
      path: inputRelativePath,
      sha256: sha256File(inputPath),
      schema_version: packet.schema_version ?? null,
      packet_status: packet.status ?? null,
    },
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      current_sha256: sourceHash,
      packet_sha256: packet.vocabulary_source?.sha256 ?? null,
      matches_current_source: packet.vocabulary_source?.sha256 === sourceHash,
      current_item_count: currentItems.length,
      packet_item_count: packetItems.length,
      item_order_matches_current_source: currentIds === packetIds,
    },
    reviewer: reviewerSummary(packet.reviewer),
    reviewer_receipt: receiptSummary,
    items: itemSummary(packet.items, args.limit),
    blocker_count: validationFindings.length,
    first_blockers: validationFindings.slice(0, args.limit),
    import_dry_run: dryRun,
    next_command: nextCommand({
      status,
      inputRelativePath,
      packetFindings,
      receiptSummary,
    }),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review status report failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
