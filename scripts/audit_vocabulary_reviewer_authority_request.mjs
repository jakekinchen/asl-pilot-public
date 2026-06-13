import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewerAuthorityPath,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
} from "./vocabulary_review_utils.mjs";

const defaultBundlePath = path.join(root, "output", "review-handoff", "reviewer-authority-request");
const authorityRequestName = "REVIEWER_AUTHORITY_REQUEST.md";
const authorityFieldsName = "AUTHORITY_FIELDS.md";
const authorityIntakeName = "AUTHORITY_INTAKE.md";
const keyFingerprintInstructionsName = "KEY_FINGERPRINT_INSTRUCTIONS.md";
const authorityTemplatePath = "docs/review/vocabulary-reviewer-authority.template.json";
const authorityIntakeTemplatePath = "docs/review/vocabulary-reviewer-authority-intake.template.json";
const expectedCopiedSources = new Map([
  [authorityTemplatePath, "vocabulary-reviewer-authority.template.json"],
  [authorityIntakeTemplatePath, "vocabulary-reviewer-authority-intake.template.json"],
  ["docs/review/vocabulary-review-protocol.md", "vocabulary-review-protocol.md"],
  ["docs/review/operator-handoff.md", "operator-handoff.md"],
  ["docs/source-materials/requirements-matrix.md", "requirements-matrix.md"],
  ["scripts/stage_vocabulary_reviewer_authority_evidence.mjs", "stage_vocabulary_reviewer_authority_evidence.mjs"],
  ["scripts/prepare_vocabulary_reviewer_authority.mjs", "prepare_vocabulary_reviewer_authority.mjs"],
  ["scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs", "prepare_vocabulary_reviewer_authority_from_intake.mjs"],
  ["scripts/report_vocabulary_reviewer_authority_status.mjs", "report_vocabulary_reviewer_authority_status.mjs"],
  ["scripts/compute_ed25519_public_key_fingerprint.mjs", "compute_ed25519_public_key_fingerprint.mjs"],
]);
const expectedReferenceOnlySources = new Set([
  "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
  "scripts/prepare_vocabulary_reviewer_authority.mjs",
  "scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs",
  "scripts/report_vocabulary_reviewer_authority_status.mjs",
  "scripts/compute_ed25519_public_key_fingerprint.mjs",
]);
const requiredCommands = [
  "node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help",
  "node scripts/stage_vocabulary_reviewer_authority_evidence.mjs --help",
  "node scripts/report_vocabulary_reviewer_authority_status.mjs",
  "node scripts/prepare_vocabulary_reviewer_authority.mjs --help",
  "node scripts/compute_ed25519_public_key_fingerprint.mjs --public-key /path/to/reviewer-ed25519-public-key.pem --format trusted-key",
  "node scripts/prepare_vocabulary_review_bundle.mjs",
  "node scripts/audit_vocabulary_review_bundle.mjs",
];
const requiredReviewerFields = {
  name: true,
  role: true,
  qualification: true,
  affiliation_or_context: true,
  contact_or_signed_evidence: true,
  is_project_operator: false,
};
const requiredAuthorityFields = [
  "trusted_at",
  "pre_review_key_binding_confirmed",
  "trusted_key",
  "credential_evidence.summary",
  "credential_evidence.files",
  "key_binding_evidence.summary",
  "key_binding_evidence.files",
  "trusted_by",
  "trusted_by.evidence.summary",
  "trusted_by.evidence.files",
];
const trustedKeyRequirements = {
  algorithm: "ed25519",
  public_key_pem: true,
  signer_key_fingerprint_sha256: true,
};
const nonFabricationNotice = "This request bundle is not review evidence. Placeholders, fake credentials, private keys, and project-operator reviewer identity are invalid.";

function parseArgs(argv) {
  const args = { bundle: defaultBundlePath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
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
  node scripts/audit_vocabulary_reviewer_authority_request.mjs [--bundle output/review-handoff/reviewer-authority-request]

Verifies that the ignored reviewer-authority request bundle is current and
contains the commands, field checklist, and warnings needed to gather a real
pre-review reviewer authority record without fabricating evidence.
`);
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function sameStringList(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return [fullPath];
  });
}

function validateManifest(manifest, bundlePath, blockers) {
  if (manifest.schema_version !== "asl-pilot-reviewer-authority-request-bundle/v1") {
    blockers.push("MANIFEST.json schema_version must be asl-pilot-reviewer-authority-request-bundle/v1");
  }
  if (manifest.bundle_root !== projectRelative(bundlePath)) {
    blockers.push(`MANIFEST.json bundle_root must be ${projectRelative(bundlePath)}`);
  }
  if (manifest.status !== "request_ready") {
    blockers.push("MANIFEST.json status must be request_ready");
  }
  if ("canonical_authority" in manifest) {
    blockers.push("MANIFEST.json must use target_authority, not canonical_authority");
  }
  validateTargetAuthority(manifest.target_authority, blockers);
  validateAuthorityTemplate(manifest.authority_template, blockers);
  validateAuthorityIntakeTemplate(manifest.authority_intake_template, blockers);
  validateGeneratedDoc(manifest.request, bundlePath, authorityRequestName, "request", [
    "ASL Pilot Reviewer Authority Request",
    "Do not send any private key",
    "actual Deaf educator or qualified ASL instructor qualification",
    "Ed25519 public key PEM",
    "evidence that the Ed25519 public key belongs to this reviewer",
    "operator trust attestation evidence",
    "copied example",
    "credential evidence file(s)",
    "key-binding evidence file(s)",
    "operator trust-attestation evidence file(s)",
    "node scripts/compute_ed25519_public_key_fingerprint.mjs",
    "cp docs/review/vocabulary-reviewer-authority-intake.template.json",
    "data/vocabulary-review/evidence/reviewer-authority-intake.json",
    "node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs",
    "node scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "node scripts/report_vocabulary_reviewer_authority_status.mjs",
    "node scripts/prepare_vocabulary_reviewer_authority.mjs",
    "--credential-evidence-file data/vocabulary-review/evidence/reviewer-credential.txt",
    "--key-binding-evidence-file data/vocabulary-review/evidence/reviewer-key-binding.txt",
    "--trusted-by-evidence-file data/vocabulary-review/evidence/operator-trust-attestation.txt",
    "node scripts/audit_vocabulary_review_bundle.mjs",
    "draft_missing_reviewer_authority",
    "Run these commands from the repository root",
    "AUTHORITY_INTAKE.md",
    "vocabulary-reviewer-authority-intake.template.json",
    "request material only",
    "not reviewer authority evidence",
    "not review evidence",
    "bundled `.mjs` files are reference copies only",
    "Do not execute the copied",
    "use the canonical `node scripts/...` commands from the repository root",
  ], blockers);
  validateGeneratedDoc(manifest.authority_fields, bundlePath, authorityFieldsName, "authority_fields", [
    "Reviewer Authority Fields",
    "reviewer.name",
    "reviewer.qualification",
    "reviewer.is_project_operator: false",
    "pre_review_key_binding_confirmed: true",
    "credential_evidence.summary",
    "credential_evidence.files[]",
    "key_binding_evidence.summary",
    "key_binding_evidence.files[]",
    "trusted_by.evidence.summary",
    "trusted_by.evidence.files[]",
    "data/vocabulary-review/evidence/",
    "trusted_key.algorithm: \"ed25519\"",
    "Placeholders, generic credential prompts, project-operator reviewer identity",
  ], blockers);
  validateGeneratedDoc(manifest.authority_intake, bundlePath, authorityIntakeName, "authority_intake", [
    "Reviewer Authority Intake Form",
    "request material only",
    "not reviewer authority evidence",
    "not review evidence",
    "Reviewer Returns To Operator",
    "machine-readable intake template",
    "Operator Verification Before Canonical Staging",
    "Evidence File Checklist",
    "Ed25519 public key PEM file",
    "Do not return a private key",
    "Verified reviewer is not the project operator",
    "Verified Ed25519 public key fingerprint matches the reviewer key",
    "data/vocabulary-review/evidence/reviewer-credential.",
    "data/vocabulary-review/evidence/reviewer-key-binding.",
    "data/vocabulary-review/evidence/operator-trust-attestation.",
    "data/vocabulary-review/evidence/reviewer-authority-intake.json",
    "node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help",
    "node scripts/stage_vocabulary_reviewer_authority_evidence.mjs --help",
    "node scripts/report_vocabulary_reviewer_authority_status.mjs",
    "node scripts/prepare_vocabulary_reviewer_authority.mjs --help",
    "real, non-empty evidence files",
    "rejects symlinks, symlinked output directories, empty files,",
    "hash-pins the copied evidence files",
    "Run those helper commands from the repository root",
    "reference copies only, not standalone",
  ], blockers);
  validateGeneratedDoc(manifest.key_fingerprint_instructions, bundlePath, keyFingerprintInstructionsName, "key_fingerprint_instructions", [
    "Ed25519 Key Fingerprint Instructions",
    "Never request or store",
    "node scripts/compute_ed25519_public_key_fingerprint.mjs",
    "--public-key /path/to/reviewer-ed25519-public-key.pem",
    "The returned public key fingerprint must later match the signed reviewer receipt",
  ], blockers);
  validateBundledFiles(manifest.bundled_files, bundlePath, blockers);
  if (!sameJson(manifest.required_reviewer_fields, requiredReviewerFields)) {
    blockers.push("MANIFEST.json required_reviewer_fields must match the reviewer identity checklist");
  }
  if (!sameStringList(manifest.required_authority_fields, requiredAuthorityFields)) {
    blockers.push("MANIFEST.json required_authority_fields must list authority, credential, key-binding, trusted-key, and trusted-by fields");
  }
  if (!sameJson(manifest.trusted_key_requirements, trustedKeyRequirements)) {
    blockers.push("MANIFEST.json trusted_key_requirements must require Ed25519 public key PEM and SHA-256 fingerprint");
  }
  if (manifest.non_fabrication_notice !== nonFabricationNotice) {
    blockers.push("MANIFEST.json non_fabrication_notice must reject fake credentials, private keys, placeholders, and project-operator reviewer identity");
  }
  if (!sameStringList(manifest.commands, requiredCommands)) {
    blockers.push("MANIFEST.json commands must include authority preparation, fingerprint, bundle preparation, and send-ready audit commands");
  }
}

function validateTargetAuthority(reference, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json target_authority must be an object");
    return;
  }
  const authorityResult = validateVocabularyReviewerPreReviewAuthorityFile(defaultReviewerAuthorityPath);
  const exists = fs.existsSync(defaultReviewerAuthorityPath);
  if (reference.path !== projectRelative(defaultReviewerAuthorityPath)) {
    blockers.push(`MANIFEST.json target_authority.path must be ${projectRelative(defaultReviewerAuthorityPath)}`);
  }
  if (reference.exists !== exists) {
    blockers.push("MANIFEST.json target_authority.exists is stale");
  }
  const expectedHash = exists ? sha256File(defaultReviewerAuthorityPath) : null;
  if (reference.sha256 !== expectedHash) {
    blockers.push("MANIFEST.json target_authority.sha256 is stale");
  }
  const expectedValid = authorityResult.findings.length === 0;
  if (reference.valid_for_pre_review !== expectedValid) {
    blockers.push("MANIFEST.json target_authority.valid_for_pre_review is stale");
  }
  if (!sameJson(reference.first_findings ?? [], authorityResult.findings.slice(0, 10))) {
    blockers.push("MANIFEST.json target_authority.first_findings must match current authority findings");
  }
}

function validateAuthorityTemplate(reference, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json authority_template must be an object");
    return;
  }
  if (reference.path !== authorityTemplatePath) {
    blockers.push(`MANIFEST.json authority_template.path must be ${authorityTemplatePath}`);
  }
  const templateFile = resolveProjectPath(authorityTemplatePath, "authority_template.path");
  if (!isSha256(reference.sha256)) {
    blockers.push("MANIFEST.json authority_template.sha256 must be a lowercase SHA-256 digest");
  } else if (sha256File(templateFile) !== reference.sha256) {
    blockers.push("MANIFEST.json authority_template.sha256 is stale");
  }
}

function validateAuthorityIntakeTemplate(reference, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("MANIFEST.json authority_intake_template must be an object");
    return;
  }
  if (reference.path !== authorityIntakeTemplatePath) {
    blockers.push(`MANIFEST.json authority_intake_template.path must be ${authorityIntakeTemplatePath}`);
  }
  const templateFile = resolveProjectPath(authorityIntakeTemplatePath, "authority_intake_template.path");
  if (!isSha256(reference.sha256)) {
    blockers.push("MANIFEST.json authority_intake_template.sha256 must be a lowercase SHA-256 digest");
  } else if (sha256File(templateFile) !== reference.sha256) {
    blockers.push("MANIFEST.json authority_intake_template.sha256 is stale");
  }
  const template = readJson(templateFile);
  const requiredVerificationFlags = [
    "reviewer_not_project_operator",
    "ed25519_public_key_fingerprint_checked",
    "credential_supports_asl_pedagogy_review",
    "key_binding_checked_before_review",
    "trusted_by_is_distinct_from_reviewer",
    "evidence_files_are_real_and_non_empty",
    "no_private_keys_included",
  ];
  if (template.schema_version !== "asl-pilot-reviewer-authority-intake/v1") {
    blockers.push("vocabulary-reviewer-authority-intake.template.json schema_version must be asl-pilot-reviewer-authority-intake/v1");
  }
  if (template.public_key_file !== "/path/to/reviewer-ed25519-public-key.pem") {
    blockers.push("vocabulary-reviewer-authority-intake.template.json must show a public-key file path placeholder");
  }
  for (const flag of requiredVerificationFlags) {
    if (template.operator_verification?.[flag] !== false) {
      blockers.push(`vocabulary-reviewer-authority-intake.template.json operator_verification.${flag} must default to false`);
    }
  }
}

function validateGeneratedDoc(reference, bundlePath, fileName, manifestField, requiredSnippets, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`MANIFEST.json ${manifestField} must be an object`);
    return;
  }
  const filePath = path.join(bundlePath, fileName);
  if (reference.path !== projectRelative(filePath)) {
    blockers.push(`MANIFEST.json ${manifestField}.path must be ${projectRelative(filePath)}`);
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`MANIFEST.json ${manifestField}.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof reference.purpose !== "string" || reference.purpose.trim().length === 0) {
    blockers.push(`MANIFEST.json ${manifestField}.purpose must be a non-empty string`);
  }
  if (reference.request_material_only !== true) {
    blockers.push(`MANIFEST.json ${manifestField}.request_material_only must be true`);
  }
  if (!fs.existsSync(filePath)) {
    blockers.push(`${fileName} is missing`);
    return;
  }
  const text = fs.readFileSync(filePath, "utf8");
  if (isSha256(reference.sha256) && reference.sha256 !== sha256Text(text)) {
    blockers.push(`MANIFEST.json ${manifestField}.sha256 must match ${fileName}`);
  }
  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) {
      blockers.push(`${fileName} must include ${snippet}`);
    }
  }
}

function validateBundledFiles(records, bundlePath, blockers) {
  if (!Array.isArray(records) || records.length === 0) {
    blockers.push("MANIFEST.json bundled_files must be a non-empty array");
    return;
  }
  const expectedFiles = new Set([
    projectRelative(path.join(bundlePath, "MANIFEST.json")),
    projectRelative(path.join(bundlePath, authorityRequestName)),
    projectRelative(path.join(bundlePath, authorityFieldsName)),
    projectRelative(path.join(bundlePath, authorityIntakeName)),
    projectRelative(path.join(bundlePath, keyFingerprintInstructionsName)),
  ]);
  const seenSources = new Set();
  for (const [index, record] of records.entries()) {
    const context = `MANIFEST.json bundled_files[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      blockers.push(`${context} must be an object`);
      continue;
    }
    for (const field of ["source_path", "bundle_path", "purpose"]) {
      if (typeof record[field] !== "string" || record[field].trim().length === 0) {
        blockers.push(`${context}.${field} must be a non-empty string`);
      }
    }
    if (!isSha256(record.sha256)) {
      blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
      continue;
    }
    const expectedBundleName = expectedCopiedSources.get(record.source_path);
    if (!expectedBundleName) {
      blockers.push(`${context}.source_path is not an expected authority-request source: ${record.source_path}`);
      continue;
    }
    const expectedReferenceOnly = expectedReferenceOnlySources.has(record.source_path);
    if (record.reference_only !== expectedReferenceOnly) {
      blockers.push(`${context}.reference_only must be ${expectedReferenceOnly}`);
    }
    if (expectedReferenceOnly && !record.purpose.includes("Reference copy")) {
      blockers.push(`${context}.purpose must say the bundled helper is a reference copy`);
    }
    if (record.request_material_only !== true) {
      blockers.push(`${context}.request_material_only must be true`);
    }
    seenSources.add(record.source_path);
    let sourcePath;
    let bundleFilePath;
    try {
      sourcePath = resolveProjectPath(record.source_path, `${context}.source_path`);
      bundleFilePath = resolveProjectPath(record.bundle_path, `${context}.bundle_path`);
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    if (record.bundle_path !== projectRelative(path.join(bundlePath, expectedBundleName))) {
      blockers.push(`${context}.bundle_path must be ${projectRelative(path.join(bundlePath, expectedBundleName))}`);
    }
    if (!bundleFilePath.startsWith(`${bundlePath}${path.sep}`)) {
      blockers.push(`${context}.bundle_path must stay inside the authority request bundle root`);
      continue;
    }
    expectedFiles.add(projectRelative(bundleFilePath));
    if (!fs.existsSync(sourcePath)) {
      blockers.push(`${context}.source_path is missing: ${record.source_path}`);
    } else if (sha256File(sourcePath) !== record.sha256) {
      blockers.push(`${context}.sha256 must match current source_path ${record.source_path}`);
    }
    if (!fs.existsSync(bundleFilePath)) {
      blockers.push(`${context}.bundle_path is missing: ${record.bundle_path}`);
    } else if (sha256File(bundleFilePath) !== record.sha256) {
      blockers.push(`${context}.sha256 must match bundled file ${record.bundle_path}`);
    }
  }
  for (const sourcePath of expectedCopiedSources.keys()) {
    if (!seenSources.has(sourcePath)) {
      blockers.push(`MANIFEST.json bundled_files is missing copied source: ${sourcePath}`);
    }
  }
  for (const file of walkFiles(bundlePath)) {
    const relativePath = projectRelative(file);
    if (!expectedFiles.has(relativePath)) {
      blockers.push(`Authority request bundle contains unmanifested file: ${relativePath}`);
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
  let manifest = null;
  if (!fs.existsSync(manifestPath)) {
    blockers.push(`Authority request bundle manifest is missing: ${projectRelative(manifestPath)}`);
  } else {
    manifest = readJson(manifestPath);
    validateManifest(manifest, bundlePath, blockers);
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    bundle: projectRelative(bundlePath),
    manifest: projectRelative(manifestPath),
    manifest_status: manifest?.status ?? null,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Vocabulary reviewer authority request audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary reviewer authority request audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
