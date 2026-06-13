import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
  validateVocabularyItems,
  validateVocabularyReviewerPreReviewAuthorityFile,
  vocabularyPath,
  writeJson,
} from "./vocabulary_review_utils.mjs";

const defaultOutputPath = path.join(root, "output", "review-handoff", "vocabulary-review-bundle");
const workbookPath = path.join(root, "docs", "review", "vocabulary-review-workbook.md");
const protocolPath = path.join(root, "docs", "review", "vocabulary-review-protocol.md");
const reviewerReceiptTemplatePath = path.join(root, "docs", "review", "vocabulary-reviewer-receipt.template.json");
const reviewerAuthorityTemplatePath = path.join(root, "docs", "review", "vocabulary-reviewer-authority.template.json");
const handoffPath = path.join(root, "docs", "review", "operator-handoff.md");
const requirementsMatrixPath = path.join(root, "docs", "source-materials", "requirements-matrix.md");
const extractedPdfTextPath = path.join(root, "docs", "source-materials", "pdf-extracted-text.md");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
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

const filesToBundle = [
  {
    path: defaultReviewPacketPath,
    bundleName: "asl-pilot-vocabulary-review.json",
    purpose: "Canonical JSON packet the reviewer must edit and return.",
    requiredForReturn: true,
  },
  {
    path: workbookPath,
    bundleName: "vocabulary-review-workbook.md",
    purpose: "Reviewer-friendly reading copy generated from the canonical packet.",
    requiredForReturn: false,
  },
  {
    path: protocolPath,
    bundleName: "vocabulary-review-protocol.md",
    purpose: "Reviewer instructions and import requirements.",
    requiredForReturn: false,
  },
  {
    path: reviewerReceiptTemplatePath,
    bundleName: "vocabulary-reviewer-receipt.template.json",
    purpose: "Template for the Ed25519-signed reviewer receipt required with the returned JSON packet.",
    requiredForReturn: false,
  },
  {
    path: reviewerAuthorityTemplatePath,
    bundleName: "vocabulary-reviewer-authority.template.json",
    purpose: "Template for the trusted reviewer key record that must match the signed receipt before final import.",
    requiredForReturn: false,
  },
  {
    path: handoffPath,
    bundleName: "operator-handoff.md",
    purpose: "Current operator sequence and downstream blockers.",
    requiredForReturn: false,
  },
  {
    path: requirementsMatrixPath,
    bundleName: "requirements-matrix.md",
    purpose: "Extracted partner-brief requirements for reviewer context.",
    requiredForReturn: false,
  },
  {
    path: extractedPdfTextPath,
    bundleName: "pdf-extracted-text.md",
    purpose: "Extracted text from the source PDF for auditability.",
    requiredForReturn: false,
  },
  {
    path: consentFormPath,
    bundleName: "dataset-consent-form.md",
    purpose: "Consent language that will govern post-review data collection.",
    requiredForReturn: false,
  },
];

function parseArgs(argv) {
  const args = { output: defaultOutputPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/prepare_vocabulary_review_bundle.mjs [--output output/review-handoff/vocabulary-review-bundle]

Copies the current vocabulary review packet, workbook, protocol, source context,
and a hash manifest into an ignored output directory for external ASL review.
This does not fabricate review evidence; the returned JSON packet must still be
imported with scripts/import_vocabulary_review.mjs.
`);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function removeAndCreateDir(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function validateOutputPath(outputPath) {
  const relative = projectRelative(outputPath);
  const defaultRelative = projectRelative(defaultOutputPath);
  if (relative !== defaultRelative && !relative.startsWith(`${defaultRelative}/`)) {
    throw new Error(`--output must be ${defaultRelative} or a child path under it`);
  }
}

function resolveOutputPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`--output escapes project root: ${value}`);
  }
  validateOutputPath(resolved);
  return resolved;
}

function copyBundleFile(file, outputPath) {
  const destination = path.join(outputPath, file.bundleName);
  fs.copyFileSync(file.path, destination);
  return {
    source_path: projectRelative(file.path),
    bundle_path: projectRelative(destination),
    sha256: sha256File(file.path),
    purpose: file.purpose,
    required_for_return: file.requiredForReturn,
  };
}

function buildReviewStatusReport() {
  const result = spawnSync(process.execPath, [
    "scripts/report_vocabulary_review_status.mjs",
    "--input",
    projectRelative(defaultReviewPacketPath),
    "--limit",
    "25",
  ], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || "review status report failed");
  }
  return JSON.parse(result.stdout);
}

function validateCurrentReviewPacket(packetPath) {
  const blockers = [];
  if (!fs.existsSync(packetPath)) {
    return { packet: null, blockers: [`Review packet is missing: ${projectRelative(packetPath)}`] };
  }
  const packet = readJson(packetPath);
  if (packet.schema_version !== "asl-pilot-vocabulary-review/v1") {
    blockers.push("Review packet schema_version must be asl-pilot-vocabulary-review/v1");
  }
  if (!["needs_review", "reviewed"].includes(packet.status)) {
    blockers.push("Review packet status must be needs_review or reviewed");
  }
  const { items } = parseVocabularySource();
  blockers.push(...validateVocabularyItems(items));
  blockers.push(...validateVocabularyItems(packet.items));
  const sourceHash = sha256File(vocabularyPath);
  if (packet.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    blockers.push("Review packet vocabulary_source.path must match current vocabulary source");
  }
  if (packet.vocabulary_source?.sha256 !== sourceHash) {
    blockers.push("Review packet vocabulary_source.sha256 must match current vocabulary source");
  }
  const sourceIds = items.map((item) => item.id).join("\n");
  const packetIds = Array.isArray(packet.items)
    ? packet.items.map((item) => item.id).join("\n")
    : "";
  if (packetIds !== sourceIds) {
    blockers.push("Review packet item IDs must match current vocabulary order exactly");
  }
  return { packet, blockers };
}

function validateWorkbook(packetPath, blockers) {
  if (!fs.existsSync(workbookPath)) {
    blockers.push(`Vocabulary review workbook is missing: ${projectRelative(workbookPath)}`);
    return;
  }
  const workbook = fs.readFileSync(workbookPath, "utf8");
  const packetHash = sha256File(packetPath);
  if (!workbook.includes(packetHash)) {
    blockers.push("Vocabulary review workbook does not include the current review-packet hash");
  }
  if (!workbook.includes("Reviewer must complete the JSON packet")) {
    blockers.push("Vocabulary review workbook must tell the reviewer to complete the JSON packet");
  }
  if (!workbook.includes("asl-pilot-vocabulary-reviewer-receipt.json")) {
    blockers.push("Vocabulary review workbook must mention the signed reviewer receipt");
  }
  for (const hintField of requiredHintReviewFields) {
    if (!workbook.includes(`hintReview.${hintField}`)) {
      blockers.push(`Vocabulary review workbook must mention hintReview.${hintField}`);
    }
  }
  if (!workbook.includes("node scripts/report_vocabulary_review_status.mjs")) {
    blockers.push("Vocabulary review workbook must include the read-only status report command");
  }
  if (!workbook.includes("node scripts/draft_vocabulary_reviewer_receipt.mjs")) {
    blockers.push("Vocabulary review workbook must include the deterministic reviewer receipt helper command");
  }
  if (!workbook.includes("node scripts/process_returned_vocabulary_review.mjs")) {
    blockers.push("Vocabulary review workbook must include the returned-review wrapper command");
  }
}

function validateRequiredFiles(blockers) {
  for (const file of filesToBundle) {
    if (!fs.existsSync(file.path)) {
      blockers.push(`Bundle source file is missing: ${projectRelative(file.path)}`);
    }
  }
}

function reviewerAuthorityManifest(authorityResult) {
  const exists = fs.existsSync(defaultReviewerAuthorityPath);
  const authority = authorityResult.authority;
  return {
    path: projectRelative(defaultReviewerAuthorityPath),
    exists,
    sha256: exists ? sha256File(defaultReviewerAuthorityPath) : null,
    valid_for_pre_review: authorityResult.findings.length === 0,
    first_findings: authorityResult.findings.slice(0, 10),
    reviewer: authority?.reviewer
      ? {
          name: authority.reviewer.name ?? null,
          role: authority.reviewer.role ?? null,
          qualification: authority.reviewer.qualification ?? null,
          affiliation_or_context: authority.reviewer.affiliation_or_context ?? null,
          contact_or_signed_evidence: authority.reviewer.contact_or_signed_evidence ?? null,
          is_project_operator: authority.reviewer.is_project_operator ?? null,
        }
      : null,
    trusted_key: authority?.trusted_key
      ? {
          algorithm: authority.trusted_key.algorithm ?? null,
          signer_key_fingerprint_sha256: authority.trusted_key.signer_key_fingerprint_sha256 ?? null,
        }
      : null,
    trusted_at: authority?.trusted_at ?? null,
  };
}

function doNotSendReason(status, authorityPath) {
  if (status === "ready_for_external_reviewer") return null;
  if (status === "already_reviewed") {
    return "Final vocabulary review evidence already exists; this bundle is not a new reviewer send package.";
  }
  return `Missing valid pre-review trusted reviewer authority record at ${authorityPath}.`;
}

function draftOnlyWarning(manifest) {
  if (manifest.send_ready === true) return "";
  return `> DRAFT ONLY: DO NOT SEND
> send_ready: false
> do_not_send_reason: ${manifest.do_not_send_reason}
> Regenerate and run \`node scripts/audit_vocabulary_review_bundle.mjs\` without \`--allow-draft\` before sending.

`;
}

function reviewerReadme(manifest) {
  const reviewerFieldLines = requiredReviewerFields
    .map((field) => {
      if (field === "is_project_operator") return "- `reviewer.is_project_operator: false`";
      if (field === "reviewed_at") return "- `reviewer.reviewed_at` as a full non-future ISO timestamp with timezone";
      return `- \`reviewer.${field}\``;
    })
    .join("\n");
  const hintFieldLines = requiredHintReviewFields
    .map((field) => `- \`hintReview.${field}: true\``)
    .join("\n");
  return `# ASL Pilot Vocabulary Review Bundle

${draftOnlyWarning(manifest)}This bundle is for external review by a Deaf educator or qualified ASL instructor.

## Return File

Edit and return only:

- \`asl-pilot-vocabulary-review.json\`
- a completed signed receipt saved as \`asl-pilot-vocabulary-reviewer-receipt.json\`

The Markdown files are context and reading copies. They are not final evidence by
themselves. The receipt template is \`vocabulary-reviewer-receipt.template.json\`.
The completed receipt must include Ed25519 \`signature_evidence\` over the
canonical receipt payload. The operator must also stage a matching trusted
reviewer key record from \`vocabulary-reviewer-authority.template.json\` at
\`data/vocabulary-review/asl-pilot-reviewer-authority.json\` before final import.
Use \`node scripts/prepare_vocabulary_reviewer_authority.mjs --help\` to build and
validate a candidate authority record before canonical staging. That authority
must hash-pin reviewer credential evidence, key-binding evidence, and operator trust-attestation evidence
files copied into ignored \`data/vocabulary-review/evidence/\`.
Use \`node scripts/compute_ed25519_public_key_fingerprint.mjs --public-key /path/to/reviewer-ed25519-public-key.pem --format trusted-key\`
to compute the exact \`trusted_key\` fields for that authority record.

## Current Status Snapshot

- Status snapshot: \`${reviewStatusBundleName}\`
- Current packet status: \`${manifest.review_status.status}\`
- Approved items: \`${manifest.review_status.approved_item_count}/${manifest.review_status.item_count}\`
- Incomplete hint reviews: \`${manifest.review_status.hint_review_incomplete_count}\`
- Reviewer authority valid for pre-review: \`${manifest.reviewer_authority.valid_for_pre_review}\`

The status snapshot is generated from the canonical JSON packet at bundle time.
If the JSON packet changes, rerun:

\`\`\`sh
node scripts/prepare_vocabulary_review_bundle.mjs
node scripts/audit_vocabulary_review_bundle.mjs
\`\`\`

After the reviewer completes the JSON packet, generate the deterministic receipt
payload from the project root only if the reviewer needs an unsigned payload to
sign:

\`\`\`sh
node scripts/draft_vocabulary_reviewer_receipt.mjs \\
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json \\
  --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json \\
  --write
\`\`\`

Without a private key this writes an unsigned draft for reviewer signature only;
do not treat that draft as final evidence or run final \`--apply\` import from
it. If the reviewer signs locally with an Ed25519 private key, keep the private
key outside the repository and add \`--private-key /path/to/reviewer-ed25519-private-key.pem --verify\`.
One-line unsigned payload command:
\`node scripts/draft_vocabulary_reviewer_receipt.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json --write\`.

If the reviewer cannot run repo-local scripts, first return the completed JSON
packet. The project operator will stage it at the canonical path and run:

\`\`\`sh
node scripts/prepare_vocabulary_review_signature_request.mjs
\`\`\`

The operator will send back the generated
\`output/review-handoff/vocabulary-review-signature-request/\` folder for
Ed25519 signing. Only the returned signed receipt is final evidence.

## Required Reviewer Fields

${reviewerFieldLines}

## Required Item Fields

Every item must end with:

- \`reviewStatus: "reviewed"\`
- \`approved: true\`
${hintFieldLines}

Set the \`hintReview\` fields to \`true\` only after the coaching hint is
beginner-appropriate, ASL-appropriate, aligned with its \`hintKind\`, and free
of unmeasured attempt-diagnosis claims. Corrections should be made directly in
the JSON packet.

## Bundle Manifest

- Manifest: \`MANIFEST.json\`
- Manifest SHA-256: \`${sha256Text(JSON.stringify(manifest, null, 2) + "\n")}\`

After the JSON packet is returned, import it from the project root with:

\`\`\`sh
node scripts/audit_vocabulary_review_bundle.mjs
cp /path/to/returned/asl-pilot-vocabulary-review.json data/vocabulary-review/asl-pilot-vocabulary-review.json
cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json
node scripts/report_vocabulary_review_status.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json
node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json
node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --apply
node scripts/audit_vocabulary_review.mjs
node scripts/audit_hint_pedagogy_review.mjs
\`\`\`
`;
}

function reviewRequest(manifest) {
  const isSendReady = manifest.status === "ready_for_external_reviewer";
  const authorityReviewer = manifest.reviewer_authority.reviewer;
  const statusWarning = isSendReady ? "\n" : `\n${draftOnlyWarning(manifest)}`;
  return `# ASL Pilot External Vocabulary Review Request

Subject: ASL Pilot vocabulary and coaching-hint review request
${statusWarning}Hello,

We are requesting external review by a Deaf educator or qualified ASL instructor
for the ASL Pilot beginner vocabulary packet in this bundle.

## What We Need Reviewed

- Confirm every prompt and display label is appropriate for beginner ASL 1 isolated-sign practice.
- Confirm each coaching hint is beginner-appropriate, ASL-appropriate, aligned with its \`hintKind\`, and free of unsupported attempt-diagnosis claims.
- Correct any prompt, label, category, coaching hint, or hint kind that should change before data collection.

## Files To Return

Please return only:

- \`asl-pilot-vocabulary-review.json\`
- \`asl-pilot-vocabulary-reviewer-receipt.json\`

The returned JSON packet must have:

- \`status: "reviewed"\`
- all reviewer identity, qualification, non-operator, and timestamp fields filled
- every item set to \`reviewStatus: "reviewed"\` and \`approved: true\`
- every item set to \`hintReview.beginnerAppropriate: true\`
- every item set to \`hintReview.aslAppropriate: true\`
- every item set to \`hintReview.relatesToHintKind: true\`
- every item set to \`hintReview.avoidsUnmeasuredAttemptDiagnosis: true\`

The receipt must include Ed25519 \`signature_evidence\` binding the reviewer to
the returned packet, current vocabulary source hash, approved item IDs, and
hint-review fields. Before final import, the project operator must also stage
\`data/vocabulary-review/asl-pilot-reviewer-authority.json\` so the receipt key
fingerprint matches a trusted reviewer key record. The exact key fields can be
prepared with \`node scripts/prepare_vocabulary_reviewer_authority.mjs --help\` or
computed with \`node scripts/compute_ed25519_public_key_fingerprint.mjs --public-key /path/to/reviewer-ed25519-public-key.pem --format trusted-key\`.
Only this pre-vetted reviewer/key may sign the receipt for this handoff.
If a signing payload is
needed, first return the completed JSON packet. The project operator can then
run:

\`\`\`sh
node scripts/prepare_vocabulary_review_signature_request.mjs
\`\`\`

That creates a send-back folder with the computed unsigned receipt and exact
canonical payload text to sign. An unsigned draft is not final evidence.

## Current Bundle Status

- Bundle status: \`${manifest.status}\`
- Current packet status: \`${manifest.review_status.status}\`
- Approved items now: \`${manifest.review_status.approved_item_count}/${manifest.review_status.item_count}\`
- Incomplete hint reviews now: \`${manifest.review_status.hint_review_incomplete_count}\`
- Reviewer authority valid for pre-review: \`${manifest.reviewer_authority.valid_for_pre_review}\`
- Reviewer authority path: \`${manifest.reviewer_authority.path}\`
- Reviewer authority name: \`${authorityReviewer?.name ?? "missing"}\`
- Reviewer authority role: \`${authorityReviewer?.role ?? "missing"}\`
- Reviewer authority qualification: \`${authorityReviewer?.qualification ?? "missing"}\`
- Reviewer authority contact/evidence: \`${authorityReviewer?.contact_or_signed_evidence ?? "missing"}\`
- Reviewer trusted key fingerprint: \`${manifest.reviewer_authority.trusted_key?.signer_key_fingerprint_sha256 ?? "missing"}\`
- Source packet hash: \`${manifest.review_status.packet_sha256}\`

The Markdown files in this bundle are context and reading copies. They are not
final review evidence. The canonical file to edit and return is
\`asl-pilot-vocabulary-review.json\`.
`;
}

function buildManifest(outputPath, packet, bundledFiles, reviewStatusReport, reviewStatusPath, reviewerAuthorityResult) {
  const { items } = parseVocabularySource();
  const finalReviewExists = fs.existsSync(defaultReviewEvidencePath);
  const reviewerAuthority = reviewerAuthorityManifest(reviewerAuthorityResult);
  const status = finalReviewExists
    ? "already_reviewed"
    : reviewerAuthority.valid_for_pre_review
      ? "ready_for_external_reviewer"
      : "draft_missing_reviewer_authority";
  const sendReady = status === "ready_for_external_reviewer";
  return {
    schema_version: "asl-pilot-vocabulary-review-bundle/v1",
    status,
    send_ready: sendReady,
    do_not_send_reason: doNotSendReason(status, reviewerAuthority.path),
    generated_at: new Date().toISOString(),
    bundle_root: projectRelative(outputPath),
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      item_count: items.length,
    },
    review_packet: {
      status: packet.status,
      item_count: Array.isArray(packet.items) ? packet.items.length : 0,
      source_hash_matches_current_vocabulary: packet.vocabulary_source?.sha256 === sha256File(vocabularyPath),
    },
    review_status: {
      path: projectRelative(reviewStatusPath),
      sha256: sha256Text(JSON.stringify(reviewStatusReport, null, 2) + "\n"),
      status: reviewStatusReport.status ?? null,
      packet_sha256: reviewStatusReport.input?.sha256 ?? null,
      item_count: reviewStatusReport.items?.total ?? null,
      approved_item_count: reviewStatusReport.items?.approved ?? null,
      hint_review_incomplete_count: reviewStatusReport.items?.hint_review_incomplete ?? null,
      missing_reviewer_fields: reviewStatusReport.reviewer?.missing_fields ?? [],
      invalid_reviewer_fields: reviewStatusReport.reviewer?.invalid_fields ?? [],
      next_command: reviewStatusReport.next_command ?? null,
    },
    reviewer_authority: reviewerAuthority,
    review_request: null,
    reviewer_requirements: {
      reviewer_must_be_deaf_educator_or_qualified_asl_instructor: true,
      reviewer_must_not_be_project_operator: true,
      returned_file: "asl-pilot-vocabulary-review.json",
      required_signed_receipt: "data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
      required_packet_status: "reviewed",
      required_reviewer_fields: requiredReviewerFields,
      required_reviewer_reviewed_at_format: "full_non_future_iso_timestamp_with_timezone",
      required_reviewer_is_project_operator: false,
      required_item_status: "reviewed",
      required_item_approval: true,
      required_hint_review_fields: requiredHintReviewFields,
    },
    bundled_files: bundledFiles,
    import_commands: [
      "node scripts/audit_vocabulary_review_bundle.mjs",
      "cp /path/to/returned/asl-pilot-vocabulary-review.json data/vocabulary-review/asl-pilot-vocabulary-review.json",
      "cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
      "node scripts/report_vocabulary_review_status.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
      "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json",
      "node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --apply",
      "node scripts/audit_vocabulary_review.mjs",
      "node scripts/audit_hint_pedagogy_review.mjs",
    ],
    final_review_evidence: {
      path: projectRelative(defaultReviewEvidencePath),
      exists: finalReviewExists,
      sha256: finalReviewExists ? sha256File(defaultReviewEvidencePath) : null,
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveOutputPath(args.output);
  const blockers = [];
  const { packet, blockers: packetBlockers } = validateCurrentReviewPacket(defaultReviewPacketPath);
  blockers.push(...packetBlockers);
  if (fs.existsSync(defaultReviewPacketPath)) validateWorkbook(defaultReviewPacketPath, blockers);
  validateRequiredFiles(blockers);
  if (blockers.length > 0 || !packet) {
    const summary = {
      status: "blocked",
      output: projectRelative(outputPath),
      blockers,
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Vocabulary review bundle preparation failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }

  removeAndCreateDir(outputPath);
  const bundledFiles = filesToBundle.map((file) => copyBundleFile(file, outputPath));
  const reviewStatusPath = path.join(outputPath, reviewStatusBundleName);
  const reviewRequestPath = path.join(outputPath, reviewRequestBundleName);
  const reviewStatusReport = buildReviewStatusReport();
  const reviewerAuthorityResult = validateVocabularyReviewerPreReviewAuthorityFile(defaultReviewerAuthorityPath);
  const manifest = buildManifest(
    outputPath,
    packet,
    bundledFiles,
    reviewStatusReport,
    reviewStatusPath,
    reviewerAuthorityResult,
  );
  const reviewRequestText = reviewRequest(manifest);
  manifest.review_request = {
    path: projectRelative(reviewRequestPath),
    sha256: sha256Text(reviewRequestText),
    purpose: manifest.status === "ready_for_external_reviewer"
      ? "Ready-to-send external reviewer request that names required return files and evidence boundaries."
      : "Draft external reviewer request blocked until the trusted reviewer authority record validates.",
  };
  writeJson(reviewStatusPath, reviewStatusReport);
  writeJson(path.join(outputPath, "MANIFEST.json"), manifest);
  fs.writeFileSync(path.join(outputPath, "REVIEWER_README.md"), reviewerReadme(manifest), "utf8");
  fs.writeFileSync(reviewRequestPath, reviewRequestText, "utf8");

  console.log(JSON.stringify({
    status: manifest.status,
    send_ready: manifest.send_ready,
    do_not_send_reason: manifest.do_not_send_reason,
    review_status: manifest.review_status.status,
    output: projectRelative(outputPath),
    files: bundledFiles.length + 4,
    review_request: projectRelative(reviewRequestPath),
    review_packet: projectRelative(defaultReviewPacketPath),
    manifest_sha256: sha256File(path.join(outputPath, "MANIFEST.json")),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review bundle preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
