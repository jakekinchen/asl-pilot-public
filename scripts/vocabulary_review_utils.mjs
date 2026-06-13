import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  stableJson,
  validateEd25519SignatureEvidence,
} from "./signed_receipt_utils.mjs";

export const root = path.resolve(import.meta.dirname, "..");
export const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
export const defaultReviewPacketPath = path.join(
  root,
  "data",
  "vocabulary-review",
  "asl-pilot-vocabulary-review.json",
);
export const defaultReviewEvidencePath = path.join(
  root,
  "docs",
  "review",
  "final-vocabulary-review.json",
);
export const defaultReviewReceiptPath = path.join(
  root,
  "data",
  "vocabulary-review",
  "asl-pilot-vocabulary-reviewer-receipt.json",
);
export const defaultReviewerAuthorityPath = path.join(
  root,
  "data",
  "vocabulary-review",
  "asl-pilot-reviewer-authority.json",
);
const reviewerAuthorityEvidenceRoot = "data/vocabulary-review/evidence/";
const reviewerAuthorityEvidenceMaterialPathPattern = /(?:^|[/-])(?:replace[-_]?with|placeholder|todo|tbd|yyyy)(?:[._/-]|$)/i;
const reviewerAuthorityEvidenceRequestMaterialSnippets = [
  "ASL Pilot Reviewer Authority Request",
  "Reviewer Authority Intake Form",
  "request material only",
  "not reviewer authority evidence",
  "not review evidence",
  "vocabulary-reviewer-authority.template.json",
  "reference copies only",
  "DRAFT ONLY",
];
export const VALID_HINT_KINDS = new Set([
  "handshape",
  "movement",
  "location",
  "orientation",
  "timing",
  "framing",
]);
export const VOCABULARY_GATE_STATUSES = new Set(["reviewed", "source_curated"]);
export const SOURCE_CURATED_STATUS = "source_curated";
export const SOURCE_CURATED_SCHEMA_VERSION = "asl-pilot-vocabulary-review-evidence/v1";
export const SOURCE_CURATED_EVIDENCE_MODE = "source_curated_no_external_review";
export const requiredSourceCurationAssertions = [
  "beginner_asl1_scope",
  "isolated_vocabulary_only",
  "hints_are_rule_based_or_observable",
  "no_external_review_claimed",
];

export function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

export function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

export function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function fileAppearsToContainPrivateKey(file) {
  const bytes = fs.readFileSync(file);
  const text = bytes.toString("utf8");
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text) || text.includes("-----BEGIN OPENSSH PRIVATE KEY-----")) {
    return true;
  }
  for (const candidate of [
    { key: bytes, format: "der", type: "pkcs8" },
    { key: bytes, format: "der", type: "sec1" },
  ]) {
    try {
      crypto.createPrivateKey(candidate);
      return true;
    } catch {
      // Try the next common DER private-key encoding.
    }
  }
  return false;
}

export function reviewerAuthorityEvidenceMaterialFindings(file, context) {
  const findings = [];
  const relativePath = projectRelative(path.resolve(file));
  if (reviewerAuthorityEvidenceMaterialPathPattern.test(relativePath)) {
    findings.push(`${context}.path looks like placeholder/request material, not final reviewer authority evidence: ${relativePath}`);
  }
  const normalizedRelativePath = relativePath.toLowerCase();
  if (
    normalizedRelativePath.startsWith("output/review-handoff/reviewer-authority-request/") ||
    normalizedRelativePath.startsWith("output/review-handoff/vocabulary-review-bundle/") ||
    normalizedRelativePath.includes("/reviewer-authority-request/")
  ) {
    findings.push(`${context}.path must not point at generated request or handoff material: ${relativePath}`);
  }
  let text = "";
  try {
    text = fs.readFileSync(file).toString("utf8");
  } catch (error) {
    findings.push(`${context}.path could not be read for request-material checks: ${error instanceof Error ? error.message : String(error)}`);
    return findings;
  }
  for (const snippet of reviewerAuthorityEvidenceRequestMaterialSnippets) {
    if (text.includes(snippet)) {
      findings.push(`${context}.path appears to be reviewer-authority request/template material, not final evidence: matched ${JSON.stringify(snippet)}`);
      break;
    }
  }
  return findings;
}

export function firstSymlinkedProjectPathComponent(file, { includeTarget = true } = {}) {
  const resolved = path.resolve(file);
  const relative = path.relative(root, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  const parts = relative.split(path.sep).filter(Boolean);
  const limit = includeTarget ? parts.length : Math.max(parts.length - 1, 0);
  let current = root;
  for (let index = 0; index < limit; index += 1) {
    current = path.join(current, parts[index]);
    if (!fs.existsSync(current)) break;
    if (fs.lstatSync(current).isSymbolicLink()) return current;
  }
  return null;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function isVocabularyGateStatus(value) {
  return VOCABULARY_GATE_STATUSES.has(value);
}

export function isIsoTimestamp(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export function isFutureTimestamp(value) {
  return isIsoTimestamp(value) && Date.parse(value) > Date.now();
}

export const requiredHintReviewFields = [
  "beginnerAppropriate",
  "aslAppropriate",
  "relatesToHintKind",
  "avoidsUnmeasuredAttemptDiagnosis",
];

export function verifyHashPinnedProjectFile(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be a hash-pinned object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    findings.push(`${context}.path must be a non-empty project path`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    findings.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  let file;
  try {
    file = resolveProjectPath(reference.path, `${context}.path`);
  } catch (error) {
    findings.push(error instanceof Error ? error.message : String(error));
    return null;
  }
  if (!fs.existsSync(file)) {
    findings.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const linkStats = fs.lstatSync(file);
  if (linkStats.isSymbolicLink()) {
    findings.push(`${context}.path must not be a symbolic link: ${reference.path}`);
    return null;
  }
  const symlinkedAncestor = firstSymlinkedProjectPathComponent(file, { includeTarget: false });
  if (symlinkedAncestor) {
    findings.push(`${context}.path must not include a symbolic link path component: ${projectRelative(symlinkedAncestor)}`);
    return null;
  }
  if (!linkStats.isFile()) {
    findings.push(`${context}.path must be a file: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    findings.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

export function canonicalVocabularyReviewerReceiptPayload(receipt) {
  const approvedItemIds = Array.isArray(receipt.approved_item_ids)
    ? receipt.approved_item_ids.filter((value) => typeof value === "string")
    : [];
  const hintReviewFields = Array.isArray(receipt.hint_review_fields)
    ? receipt.hint_review_fields.filter((value) => typeof value === "string")
    : [];
  return stableJson({
    schema_version: receipt.schema_version,
    status: receipt.status,
    reviewer: receipt.reviewer,
    signed_at: receipt.signed_at,
    vocabulary_source: receipt.vocabulary_source,
    review_packet: receipt.review_packet,
    approved_item_ids: approvedItemIds,
    hint_review_fields: hintReviewFields,
  });
}

function reviewerIdentityForAuthority(packet) {
  return {
    name: packet?.reviewer?.name,
    role: packet?.reviewer?.role,
    qualification: packet?.reviewer?.qualification,
    affiliation_or_context: packet?.reviewer?.affiliation_or_context,
    contact_or_signed_evidence: packet?.reviewer?.contact_or_signed_evidence,
    is_project_operator: packet?.reviewer?.is_project_operator,
  };
}

const reviewerAuthorityIdentityFields = [
  "name",
  "role",
  "qualification",
  "affiliation_or_context",
  "contact_or_signed_evidence",
  "is_project_operator",
];

const reviewerAuthorityTopLevelFields = [
  "schema_version",
  "status",
  "trusted_at",
  "pre_review_key_binding_confirmed",
  "reviewer",
  "trusted_key",
  "credential_evidence",
  "key_binding_evidence",
  "trusted_by",
];

const reviewerAuthorityTrustedKeyFields = [
  "algorithm",
  "public_key_pem",
  "signer_key_fingerprint_sha256",
];

const reviewerAuthorityTrustedByFields = [
  "name",
  "role",
  "contact_or_signed_evidence",
  "evidence",
];
const reviewerAuthorityEvidenceFields = [
  "summary",
  "files",
];
const reviewerAuthorityEvidenceFileFields = [
  "path",
  "sha256",
  "purpose",
];
const placeholderPattern = /\b(replace|placeholder|todo|tbd|yyyy)\b/i;
const examplePlaceholderPhrases = new Set([
  "reviewer name",
  "operator name",
  "operator role",
  "qualified asl instructor",
  "actual asl qualification",
  "school, program, or independent context",
  "contact or credential reference",
  "operator contact or signature reference",
  "credential evidence summary",
  "key-binding evidence summary",
  "operator trust attestation summary",
  "contact or signature reference",
]);

function normalizedPlaceholderCandidate(value) {
  return value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isPlaceholderString(value) {
  if (typeof value !== "string" || value.trim().length === 0) return true;
  if (placeholderPattern.test(value)) return true;
  return examplePlaceholderPhrases.has(normalizedPlaceholderCandidate(value));
}

function validateNoUnexpectedFields(record, allowedFields, context, findings) {
  for (const field of Object.keys(record)) {
    if (!allowedFields.includes(field)) {
      findings.push(`${context} contains unexpected field: ${field}`);
    }
  }
}

function validateReviewerAuthorityIdentity(authorityReviewer, packet, context, findings) {
  if (!authorityReviewer || typeof authorityReviewer !== "object" || Array.isArray(authorityReviewer)) {
    findings.push(`${context}.reviewer must be an object`);
    return;
  }
  const expected = reviewerIdentityForAuthority(packet);
  for (const field of reviewerAuthorityIdentityFields) {
    if (authorityReviewer[field] !== expected[field]) {
      findings.push(`${context}.reviewer.${field} must match the returned packet reviewer identity`);
    }
  }
  validateNoUnexpectedFields(authorityReviewer, reviewerAuthorityIdentityFields, `${context}.reviewer`, findings);
}

function validateReviewerAuthorityIdentityShape(authorityReviewer, context, findings) {
  if (!authorityReviewer || typeof authorityReviewer !== "object" || Array.isArray(authorityReviewer)) {
    findings.push(`${context}.reviewer must be an object`);
    return;
  }
  for (const field of reviewerAuthorityIdentityFields) {
    if (!(field in authorityReviewer)) {
      findings.push(`${context}.reviewer.${field} must be present`);
    }
  }
  validateNoUnexpectedFields(authorityReviewer, reviewerAuthorityIdentityFields, `${context}.reviewer`, findings);
}

function publicKeyFingerprint(publicKeyPem, context, findings) {
  const trimmed = typeof publicKeyPem === "string" ? publicKeyPem.trim() : "";
  if (!trimmed.includes("BEGIN PUBLIC KEY")) {
    findings.push(`${context}.public_key_pem must be a PEM public key`);
    return null;
  }
  try {
    const publicKey = crypto.createPublicKey(trimmed);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      findings.push(`${context}.public_key_pem must be an Ed25519 public key`);
    }
    return crypto.createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
  } catch (error) {
    findings.push(`${context}.public_key_pem is invalid: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function nonPlaceholderString(value, context, findings) {
  if (isPlaceholderString(value)) {
    findings.push(`${context} must be a non-placeholder string`);
  }
}

function validateReviewerAuthorityEvidence(evidence, context, findings) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    findings.push(`${context} must be a hash-pinned evidence object with summary and files`);
    return;
  }
  validateNoUnexpectedFields(evidence, reviewerAuthorityEvidenceFields, context, findings);
  nonPlaceholderString(evidence.summary, `${context}.summary`, findings);
  if (!Array.isArray(evidence.files) || evidence.files.length === 0) {
    findings.push(`${context}.files must be a non-empty array of hash-pinned evidence files`);
    return;
  }
  for (const [index, fileReference] of evidence.files.entries()) {
    const fileContext = `${context}.files[${index}]`;
    if (!fileReference || typeof fileReference !== "object" || Array.isArray(fileReference)) {
      findings.push(`${fileContext} must be a hash-pinned object`);
      continue;
    }
    validateNoUnexpectedFields(fileReference, reviewerAuthorityEvidenceFileFields, fileContext, findings);
    nonPlaceholderString(fileReference.purpose, `${fileContext}.purpose`, findings);
    if (typeof fileReference.path !== "string") {
      findings.push(`${fileContext}.path must be under ${reviewerAuthorityEvidenceRoot}`);
    } else {
      try {
        const normalizedRelativePath = projectRelative(resolveProjectPath(fileReference.path, `${fileContext}.path`));
        if (!normalizedRelativePath.startsWith(reviewerAuthorityEvidenceRoot)) {
          findings.push(`${fileContext}.path must be under ${reviewerAuthorityEvidenceRoot}`);
        }
      } catch (error) {
        findings.push(error instanceof Error ? error.message : String(error));
      }
    }
    const verifiedFile = verifyHashPinnedProjectFile(fileReference, fileContext, findings);
    if (verifiedFile && fs.statSync(verifiedFile).size === 0) {
      findings.push(`${fileContext}.path must not be an empty evidence file`);
    }
    if (verifiedFile && fileAppearsToContainPrivateKey(verifiedFile)) {
      findings.push(`${fileContext}.path must not contain private key material`);
    }
    if (verifiedFile) {
      findings.push(...reviewerAuthorityEvidenceMaterialFindings(verifiedFile, fileContext));
    }
  }
}

function normalizedIdentityValue(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function validateTrustedByDistinctFromReviewer(authorityReviewer, trustedBy, context, findings) {
  if (
    !authorityReviewer ||
    typeof authorityReviewer !== "object" ||
    Array.isArray(authorityReviewer) ||
    !trustedBy ||
    typeof trustedBy !== "object" ||
    Array.isArray(trustedBy)
  ) {
    return;
  }
  if (
    normalizedIdentityValue(authorityReviewer.name) &&
    normalizedIdentityValue(authorityReviewer.name) === normalizedIdentityValue(trustedBy.name)
  ) {
    findings.push(`${context}.trusted_by.name must identify a person distinct from reviewer.name`);
  }
  if (
    normalizedIdentityValue(authorityReviewer.contact_or_signed_evidence) &&
    normalizedIdentityValue(authorityReviewer.contact_or_signed_evidence) ===
      normalizedIdentityValue(trustedBy.contact_or_signed_evidence)
  ) {
    findings.push(`${context}.trusted_by.contact_or_signed_evidence must be distinct from reviewer.contact_or_signed_evidence`);
  }
}

function validateReviewerAuthorityEvidenceUniqueness(authority, context, findings) {
  const evidenceGroups = [
    ["credential_evidence", authority?.credential_evidence],
    ["key_binding_evidence", authority?.key_binding_evidence],
    ["trusted_by.evidence", authority?.trusted_by?.evidence],
  ];
  const seenPaths = new Map();
  const seenHashes = new Map();
  for (const [groupName, evidence] of evidenceGroups) {
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || !Array.isArray(evidence.files)) {
      continue;
    }
    for (const [index, fileReference] of evidence.files.entries()) {
      if (!fileReference || typeof fileReference !== "object" || Array.isArray(fileReference)) continue;
      const label = `${groupName}.files[${index}]`;
      if (typeof fileReference.path === "string" && fileReference.path.trim()) {
        let normalizedPath = fileReference.path;
        try {
          normalizedPath = projectRelative(resolveProjectPath(fileReference.path, `${context}.${label}.path`));
        } catch {
          // The local evidence validator reports invalid paths separately.
        }
        const previous = seenPaths.get(normalizedPath);
        if (previous) {
          findings.push(`${context} evidence file path is reused by ${previous} and ${label}: ${normalizedPath}`);
        } else {
          seenPaths.set(normalizedPath, label);
        }
      }
      if (isSha256(fileReference.sha256)) {
        const previous = seenHashes.get(fileReference.sha256);
        if (previous) {
          findings.push(`${context} evidence file sha256 is reused by ${previous} and ${label}: ${fileReference.sha256}`);
        } else {
          seenHashes.set(fileReference.sha256, label);
        }
      }
    }
  }
}

export function validateVocabularyReviewerAuthorityFile(authorityPath, packet, receipt) {
  const findings = [];
  if (!fs.existsSync(authorityPath)) {
    return {
      findings: [`Reviewer authority record is missing: ${projectRelative(authorityPath)}`],
      authority: null,
    };
  }
  let authority = null;
  try {
    authority = readJson(authorityPath);
  } catch (error) {
    return {
      findings: [`Reviewer authority record is not valid JSON: ${error instanceof Error ? error.message : String(error)}`],
      authority: null,
    };
  }
  const context = "Reviewer authority record";
  if (!authority || typeof authority !== "object" || Array.isArray(authority)) {
    return { findings: [`${context} must be an object`], authority };
  }
  validateNoUnexpectedFields(authority, reviewerAuthorityTopLevelFields, context, findings);
  if (authority.schema_version !== "asl-pilot-reviewer-authority/v1") {
    findings.push(`${context} schema_version must be asl-pilot-reviewer-authority/v1`);
  }
  if (authority.status !== "trusted_reviewer_key") {
    findings.push(`${context} status must be trusted_reviewer_key`);
  }
  validateReviewerAuthorityIdentity(authority.reviewer, packet, context, findings);
  findings.push(...validateReviewer({
    ...(authority.reviewer ?? {}),
    reviewed_at: authority.trusted_at,
  }, {
    requireAslQualification: true,
    requireIndependentReviewer: true,
  }).map((finding) => `${context} ${finding}`));
  if (!isIsoTimestamp(authority.trusted_at)) {
    findings.push(`${context}.trusted_at must be a full ISO timestamp with timezone`);
  } else if (isFutureTimestamp(authority.trusted_at)) {
    findings.push(`${context}.trusted_at must not be in the future`);
  } else if (isIsoTimestamp(packet?.reviewer?.reviewed_at) && Date.parse(authority.trusted_at) > Date.parse(packet.reviewer.reviewed_at)) {
    findings.push(`${context}.trusted_at must be no later than reviewer.reviewed_at`);
  }
  if (authority.pre_review_key_binding_confirmed !== true) {
    findings.push(`${context}.pre_review_key_binding_confirmed must be true`);
  }
  validateReviewerAuthorityEvidence(authority.credential_evidence, `${context}.credential_evidence`, findings);
  validateReviewerAuthorityEvidence(authority.key_binding_evidence, `${context}.key_binding_evidence`, findings);
  const trustedBy = authority.trusted_by;
  if (!trustedBy || typeof trustedBy !== "object" || Array.isArray(trustedBy)) {
    findings.push(`${context}.trusted_by must be an object`);
  } else {
    validateNoUnexpectedFields(trustedBy, reviewerAuthorityTrustedByFields, `${context}.trusted_by`, findings);
    for (const field of ["name", "role", "contact_or_signed_evidence"]) {
      nonPlaceholderString(trustedBy[field], `${context}.trusted_by.${field}`, findings);
    }
    validateTrustedByDistinctFromReviewer(authority.reviewer, trustedBy, context, findings);
    validateReviewerAuthorityEvidence(trustedBy.evidence, `${context}.trusted_by.evidence`, findings);
  }
  validateReviewerAuthorityEvidenceUniqueness(authority, context, findings);

  const trustedKey = authority.trusted_key;
  if (!trustedKey || typeof trustedKey !== "object" || Array.isArray(trustedKey)) {
    findings.push(`${context}.trusted_key must be an object`);
  } else {
    validateNoUnexpectedFields(trustedKey, reviewerAuthorityTrustedKeyFields, `${context}.trusted_key`, findings);
    if (trustedKey.algorithm !== "ed25519") {
      findings.push(`${context}.trusted_key.algorithm must be ed25519`);
    }
    const keyFingerprint = publicKeyFingerprint(trustedKey.public_key_pem, `${context}.trusted_key`, findings);
    if (!isSha256(trustedKey.signer_key_fingerprint_sha256)) {
      findings.push(`${context}.trusted_key.signer_key_fingerprint_sha256 must be a lowercase SHA-256 digest`);
    } else if (keyFingerprint && trustedKey.signer_key_fingerprint_sha256 !== keyFingerprint) {
      findings.push(`${context}.trusted_key.signer_key_fingerprint_sha256 must match public_key_pem`);
    }
    if (trustedKey.public_key_pem?.trim() !== receipt?.signature_evidence?.public_key_pem?.trim()) {
      findings.push(`${context}.trusted_key.public_key_pem must match reviewer receipt signature_evidence.public_key_pem`);
    }
    if (trustedKey.signer_key_fingerprint_sha256 !== receipt?.signature_evidence?.signer_key_fingerprint_sha256) {
      findings.push(`${context}.trusted_key.signer_key_fingerprint_sha256 must match reviewer receipt signer_key_fingerprint_sha256`);
    }
  }
  return { findings, authority };
}

export function validateVocabularyReviewerPreReviewAuthorityFile(authorityPath) {
  const findings = [];
  if (!fs.existsSync(authorityPath)) {
    return {
      findings: [`Reviewer authority record is missing before external review: ${projectRelative(authorityPath)}`],
      authority: null,
    };
  }
  let authority = null;
  try {
    authority = readJson(authorityPath);
  } catch (error) {
    return {
      findings: [`Reviewer authority record is not valid JSON: ${error instanceof Error ? error.message : String(error)}`],
      authority: null,
    };
  }
  const context = "Reviewer pre-review authority record";
  if (!authority || typeof authority !== "object" || Array.isArray(authority)) {
    return { findings: [`${context} must be an object`], authority };
  }
  validateNoUnexpectedFields(authority, reviewerAuthorityTopLevelFields, context, findings);
  if (authority.schema_version !== "asl-pilot-reviewer-authority/v1") {
    findings.push(`${context} schema_version must be asl-pilot-reviewer-authority/v1`);
  }
  if (authority.status !== "trusted_reviewer_key") {
    findings.push(`${context} status must be trusted_reviewer_key`);
  }
  validateReviewerAuthorityIdentityShape(authority.reviewer, context, findings);
  findings.push(...validateReviewer({
    ...(authority.reviewer ?? {}),
    reviewed_at: authority.trusted_at,
  }, {
    requireAslQualification: true,
    requireIndependentReviewer: true,
  }).map((finding) => `${context} ${finding}`));
  if (!isIsoTimestamp(authority.trusted_at)) {
    findings.push(`${context}.trusted_at must be a full ISO timestamp with timezone`);
  } else if (isFutureTimestamp(authority.trusted_at)) {
    findings.push(`${context}.trusted_at must not be in the future`);
  }
  if (authority.pre_review_key_binding_confirmed !== true) {
    findings.push(`${context}.pre_review_key_binding_confirmed must be true`);
  }
  validateReviewerAuthorityEvidence(authority.credential_evidence, `${context}.credential_evidence`, findings);
  validateReviewerAuthorityEvidence(authority.key_binding_evidence, `${context}.key_binding_evidence`, findings);
  const trustedBy = authority.trusted_by;
  if (!trustedBy || typeof trustedBy !== "object" || Array.isArray(trustedBy)) {
    findings.push(`${context}.trusted_by must be an object`);
  } else {
    validateNoUnexpectedFields(trustedBy, reviewerAuthorityTrustedByFields, `${context}.trusted_by`, findings);
    for (const field of ["name", "role", "contact_or_signed_evidence"]) {
      nonPlaceholderString(trustedBy[field], `${context}.trusted_by.${field}`, findings);
    }
    validateTrustedByDistinctFromReviewer(authority.reviewer, trustedBy, context, findings);
    validateReviewerAuthorityEvidence(trustedBy.evidence, `${context}.trusted_by.evidence`, findings);
  }
  validateReviewerAuthorityEvidenceUniqueness(authority, context, findings);
  const trustedKey = authority.trusted_key;
  if (!trustedKey || typeof trustedKey !== "object" || Array.isArray(trustedKey)) {
    findings.push(`${context}.trusted_key must be an object`);
  } else {
    validateNoUnexpectedFields(trustedKey, reviewerAuthorityTrustedKeyFields, `${context}.trusted_key`, findings);
    if (trustedKey.algorithm !== "ed25519") {
      findings.push(`${context}.trusted_key.algorithm must be ed25519`);
    }
    const keyFingerprint = publicKeyFingerprint(trustedKey.public_key_pem, `${context}.trusted_key`, findings);
    if (!isSha256(trustedKey.signer_key_fingerprint_sha256)) {
      findings.push(`${context}.trusted_key.signer_key_fingerprint_sha256 must be a lowercase SHA-256 digest`);
    } else if (keyFingerprint && trustedKey.signer_key_fingerprint_sha256 !== keyFingerprint) {
      findings.push(`${context}.trusted_key.signer_key_fingerprint_sha256 must match public_key_pem`);
    }
  }
  return { findings, authority };
}

export function validateVocabularyReviewerReceiptFile(receiptPath, packet, reviewPacketPath, options = {}) {
  const findings = [];
  if (!fs.existsSync(receiptPath)) {
    return {
      findings: [`Reviewer signed receipt is missing: ${projectRelative(receiptPath)}`],
      receipt: null,
    };
  }
  let receipt = null;
  try {
    receipt = readJson(receiptPath);
  } catch (error) {
    return {
      findings: [`Reviewer signed receipt is not valid JSON: ${error instanceof Error ? error.message : String(error)}`],
      receipt: null,
    };
  }
  findings.push(...validateVocabularyReviewerReceipt(receipt, packet, reviewPacketPath, receiptPath));
  const reviewerAuthorityPath = options.reviewerAuthorityPath ?? defaultReviewerAuthorityPath;
  findings.push(...validateVocabularyReviewerAuthorityFile(reviewerAuthorityPath, packet, receipt).findings);
  return { findings, receipt };
}

export function validateVocabularyReviewerReceipt(receipt, packet, reviewPacketPath, receiptPath = defaultReviewReceiptPath) {
  const findings = [];
  const context = "Reviewer signed receipt";
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return [`${context} must be an object`];
  }
  const allowedTopLevelFields = new Set([
    "schema_version",
    "status",
    "reviewer",
    "signed_at",
    "vocabulary_source",
    "review_packet",
    "approved_item_ids",
    "hint_review_fields",
    "signature_evidence",
  ]);
  for (const key of Object.keys(receipt)) {
    if (!allowedTopLevelFields.has(key)) {
      findings.push(`${context} contains unexpected unsigned field: ${key}`);
    }
  }
  if (receipt.schema_version !== "asl-pilot-vocabulary-reviewer-receipt/v1") {
    findings.push(`${context} schema_version must be asl-pilot-vocabulary-reviewer-receipt/v1`);
  }
  if (receipt.status !== "signed") {
    findings.push(`${context} status must be signed`);
  }
  if (!isIsoTimestamp(receipt.signed_at)) {
    findings.push(`${context} signed_at must be a full ISO timestamp with timezone`);
  } else if (isFutureTimestamp(receipt.signed_at)) {
    findings.push(`${context} signed_at must not be in the future`);
  }
  if (receipt.signed_at !== packet?.reviewer?.reviewed_at) {
    findings.push(`${context} signed_at must match reviewer.reviewed_at`);
  }

  const expectedReviewer = {
    name: packet?.reviewer?.name,
    role: packet?.reviewer?.role,
    qualification: packet?.reviewer?.qualification,
    affiliation_or_context: packet?.reviewer?.affiliation_or_context,
    contact_or_signed_evidence: packet?.reviewer?.contact_or_signed_evidence,
    is_project_operator: packet?.reviewer?.is_project_operator,
    reviewed_at: packet?.reviewer?.reviewed_at,
  };
  if (JSON.stringify(receipt.reviewer ?? null) !== JSON.stringify(expectedReviewer)) {
    findings.push(`${context} reviewer must match the returned packet reviewer exactly`);
  }

  const expectedPacketReference = {
    path: projectRelative(reviewPacketPath),
    sha256: fs.existsSync(reviewPacketPath) ? sha256File(reviewPacketPath) : null,
  };
  if (JSON.stringify(receipt.review_packet ?? null) !== JSON.stringify(expectedPacketReference)) {
    findings.push(`${context} review_packet must match the returned packet path and SHA-256`);
  }

  const expectedVocabularyReference = {
    path: packet?.vocabulary_source?.path,
    sha256: packet?.vocabulary_source?.sha256,
  };
  if (JSON.stringify(receipt.vocabulary_source ?? null) !== JSON.stringify(expectedVocabularyReference)) {
    findings.push(`${context} vocabulary_source must match the returned packet vocabulary_source`);
  }

  const expectedIds = Array.isArray(packet?.items) ? packet.items.map((item) => item.id) : [];
  if (JSON.stringify(receipt.approved_item_ids ?? null) !== JSON.stringify(expectedIds)) {
    findings.push(`${context} approved_item_ids must match the returned packet item IDs in order`);
  }
  if (JSON.stringify(receipt.hint_review_fields ?? null) !== JSON.stringify(requiredHintReviewFields)) {
    findings.push(`${context} hint_review_fields must list every required hint review field in order`);
  }

  findings.push(...validateEd25519SignatureEvidence({
    signedObject: receipt,
    payload: canonicalVocabularyReviewerReceiptPayload(receipt),
    context,
  }));

  if (!receiptPath.startsWith(`${root}${path.sep}`)) {
    findings.push(`${context} path escapes project root`);
  }
  return findings;
}

export function validateCompletedVocabularyReviewPacket(packet, options = {}) {
  const findings = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return ["review packet must be an object"];
  }
  if (packet.schema_version !== "asl-pilot-vocabulary-review/v1") {
    findings.push("review packet schema_version must be asl-pilot-vocabulary-review/v1");
  }
  if (packet.status !== "reviewed") {
    findings.push("review packet status must be reviewed");
  }
  if (packet.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    findings.push("review packet vocabulary_source.path must match current vocabulary path");
  }
  if (!isSha256(packet.vocabulary_source?.sha256)) {
    findings.push("review packet vocabulary_source.sha256 must be a lowercase SHA-256 digest");
  }
  if (!isIsoTimestamp(packet.created_at)) {
    findings.push("review packet created_at must be a full ISO timestamp with timezone");
  } else if (isFutureTimestamp(packet.created_at)) {
    findings.push("review packet created_at must not be in the future");
  }
  findings.push(...validateReviewer(packet.reviewer, {
    requireAslQualification: true,
    requireIndependentReviewer: true,
  }));
  const reviewPacketPath = options.reviewPacketPath ?? defaultReviewPacketPath;
  const reviewerReceiptPath = options.reviewerReceiptPath ?? defaultReviewReceiptPath;
  const reviewerAuthorityPath = options.reviewerAuthorityPath ?? defaultReviewerAuthorityPath;
  findings.push(...validateVocabularyReviewerReceiptFile(reviewerReceiptPath, packet, reviewPacketPath, {
    reviewerAuthorityPath,
  }).findings);
  findings.push(...validateVocabularyItems(packet.items, { requireApproved: true }));
  return findings;
}

export function validateVocabularyReviewEvidence(evidence, options = {}) {
  const { source, items } = parseVocabularySource();
  const findings = [];
  findings.push(...validateVocabularyItems(items));
  if (source.includes("needs_deaf_educator_review")) {
    findings.push("Vocabulary source still contains needs_deaf_educator_review");
  }
  const sourceHash = sha256File(vocabularyPath);
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    findings.push("Review evidence must be an object");
    return { findings, source, items, sourceHash };
  }
  if (evidence.status === SOURCE_CURATED_STATUS) {
    findings.push(...validateSourceCuratedVocabularyEvidence(evidence, { source, items, sourceHash }).findings);
    return { findings, source, items, sourceHash };
  }
  if (evidence.schema_version !== "asl-pilot-vocabulary-review-evidence/v1") {
    findings.push("Review evidence schema_version is invalid");
  }
  if (evidence.status !== "reviewed") {
    findings.push("Review evidence status must be reviewed");
  }
  blockersPushReviewGeneratedBy(evidence, findings);
  findings.push(...validateReviewer(evidence.reviewer, {
    requireAslQualification: true,
    requireIndependentReviewer: true,
  }));
  if (evidence.item_count !== items.length) {
    findings.push(`Review evidence item_count ${evidence.item_count} does not match vocabulary count ${items.length}`);
  }
  if (evidence.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    findings.push("Review evidence vocabulary_source.path does not match current vocabulary source");
  }
  if (evidence.vocabulary_source?.sha256 !== sourceHash) {
    findings.push("Review evidence vocabulary_source.sha256 does not match current vocabulary source");
  }
  const approved = Array.isArray(evidence.approved_item_ids)
    ? evidence.approved_item_ids
    : [];
  const sourceIds = items.map((item) => item.id);
  if (approved.join("\n") !== sourceIds.join("\n")) {
    findings.push("Review evidence approved_item_ids must match current vocabulary item IDs in order");
  }
  const packetFile = verifyHashPinnedProjectFile(evidence.source_packet, "Review evidence source_packet", findings);
  const reviewerReceiptFile = verifyHashPinnedProjectFile(
    evidence.reviewer_signed_receipt,
    "Review evidence reviewer_signed_receipt",
    findings,
  );
  const reviewerAuthorityFile = verifyHashPinnedProjectFile(
    evidence.reviewer_authority,
    "Review evidence reviewer_authority",
    findings,
  );
  if (packetFile) {
    try {
      const packet = readJson(packetFile);
      findings.push(...validateCompletedVocabularyReviewPacket(packet, {
        reviewPacketPath: packetFile,
        reviewerReceiptPath: reviewerReceiptFile ?? defaultReviewReceiptPath,
        reviewerAuthorityPath: reviewerAuthorityFile ?? defaultReviewerAuthorityPath,
      }));
      if (packet.vocabulary_source?.sha256 !== sourceHash) {
        findings.push("Review evidence source_packet vocabulary_source.sha256 must match current vocabulary source");
      }
      const packetIds = Array.isArray(packet.items)
        ? packet.items.map((item) => item.id)
        : [];
      if (packetIds.join("\n") !== sourceIds.join("\n")) {
        findings.push("Review evidence source_packet item IDs must match current vocabulary item IDs in order");
      }
      if (approved.join("\n") !== packetIds.join("\n")) {
        findings.push("Review evidence approved_item_ids must match source_packet item IDs in order");
      }
      if (JSON.stringify(evidence.reviewer ?? null) !== JSON.stringify(packet.reviewer ?? null)) {
        findings.push("Review evidence reviewer must match source_packet reviewer");
      }
    } catch (error) {
      findings.push(`Review evidence source_packet is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (options.requireSourcePacketPath && evidence.source_packet?.path !== options.requireSourcePacketPath) {
    findings.push(`Review evidence source_packet.path must be ${options.requireSourcePacketPath}`);
  }
  if (options.requireReviewerReceiptPath && evidence.reviewer_signed_receipt?.path !== options.requireReviewerReceiptPath) {
    findings.push(`Review evidence reviewer_signed_receipt.path must be ${options.requireReviewerReceiptPath}`);
  }
  if (options.requireReviewerAuthorityPath && evidence.reviewer_authority?.path !== options.requireReviewerAuthorityPath) {
    findings.push(`Review evidence reviewer_authority.path must be ${options.requireReviewerAuthorityPath}`);
  }
  return { findings, source, items, sourceHash };
}

export function validateSourceCuratedVocabularyEvidence(evidence, options = {}) {
  const { source, items } = options.items ? options : parseVocabularySource();
  const sourceHash = options.sourceHash ?? sha256File(vocabularyPath);
  const findings = [];
  findings.push(...validateVocabularyItems(items, { requireSourceCurated: true }));
  if (source.includes("needs_deaf_educator_review")) {
    findings.push("Vocabulary source still contains needs_deaf_educator_review");
  }
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return { findings: [...findings, "Source-curated vocabulary evidence must be an object"] };
  }
  if (evidence.schema_version !== SOURCE_CURATED_SCHEMA_VERSION) {
    findings.push(`Source-curated vocabulary evidence schema_version must be ${SOURCE_CURATED_SCHEMA_VERSION}`);
  }
  if (evidence.status !== SOURCE_CURATED_STATUS) {
    findings.push(`Source-curated vocabulary evidence status must be ${SOURCE_CURATED_STATUS}`);
  }
  if (evidence.evidence_mode !== SOURCE_CURATED_EVIDENCE_MODE) {
    findings.push(`Source-curated vocabulary evidence evidence_mode must be ${SOURCE_CURATED_EVIDENCE_MODE}`);
  }
  blockersPushSourceCuratedGeneratedBy(evidence, findings);
  if (evidence.item_count !== items.length) {
    findings.push(`Source-curated vocabulary evidence item_count ${evidence.item_count} does not match vocabulary count ${items.length}`);
  }
  if (evidence.vocabulary_source?.path !== projectRelative(vocabularyPath)) {
    findings.push("Source-curated vocabulary evidence vocabulary_source.path does not match current vocabulary source");
  }
  if (evidence.vocabulary_source?.sha256 !== sourceHash) {
    findings.push("Source-curated vocabulary evidence vocabulary_source.sha256 does not match current vocabulary source");
  }
  const approved = Array.isArray(evidence.approved_item_ids) ? evidence.approved_item_ids : [];
  const sourceIds = items.map((item) => item.id);
  if (approved.join("\n") !== sourceIds.join("\n")) {
    findings.push("Source-curated vocabulary evidence approved_item_ids must match current vocabulary item IDs in order");
  }
  const assertions = evidence.curation_assertions;
  if (!assertions || typeof assertions !== "object" || Array.isArray(assertions)) {
    findings.push("Source-curated vocabulary evidence curation_assertions must be an object");
  } else {
    for (const key of requiredSourceCurationAssertions) {
      if (assertions[key] !== true) findings.push(`Source-curated vocabulary evidence curation_assertions.${key} must be true`);
    }
  }
  const externalReview = evidence.external_review;
  if (!externalReview || typeof externalReview !== "object" || Array.isArray(externalReview)) {
    findings.push("Source-curated vocabulary evidence external_review must be an object");
  } else {
    if (externalReview.required_for_source_aligned_pilot !== false) {
      findings.push("Source-curated vocabulary evidence external_review.required_for_source_aligned_pilot must be false");
    }
    if (externalReview.completed !== false) {
      findings.push("Source-curated vocabulary evidence external_review.completed must be false");
    }
    if (!String(externalReview.claim ?? "").toLowerCase().includes("no external")) {
      findings.push("Source-curated vocabulary evidence external_review.claim must explicitly say no external review is claimed");
    }
  }
  if (!Array.isArray(evidence.source_basis) || evidence.source_basis.length === 0) {
    findings.push("Source-curated vocabulary evidence source_basis must list hash-pinned source documents");
  } else {
    for (const [index, reference] of evidence.source_basis.entries()) {
      const file = verifyHashPinnedProjectFile(reference, `Source-curated vocabulary evidence source_basis[${index}]`, findings);
      if (file && ![
        "docs/source-materials/pdf-extracted-text.md",
        "docs/source-materials/requirements-matrix.md",
      ].includes(projectRelative(file))) {
        findings.push(`Source-curated vocabulary evidence source_basis[${index}].path must be a source-materials document`);
      }
      if (!Array.isArray(reference.source_requirements) || reference.source_requirements.length === 0) {
        findings.push(`Source-curated vocabulary evidence source_basis[${index}].source_requirements must be a non-empty array`);
      }
    }
  }
  if (!Array.isArray(evidence.items) || evidence.items.length !== items.length) {
    findings.push("Source-curated vocabulary evidence items must mirror every current vocabulary item");
  } else {
    const currentById = new Map(items.map((item) => [item.id, item]));
    for (const [index, item] of evidence.items.entries()) {
      const context = `Source-curated vocabulary evidence items[${index}]`;
      const current = currentById.get(item?.id);
      if (!current) {
        findings.push(`${context}.id is not present in current vocabulary`);
        continue;
      }
      for (const field of ["label", "category", "prompt", "coachingHint", "hintKind"]) {
        if (item[field] !== current[field]) findings.push(`${context}.${field} must match current vocabulary`);
      }
      if (item.reviewStatus !== SOURCE_CURATED_STATUS) findings.push(`${context}.reviewStatus must be ${SOURCE_CURATED_STATUS}`);
      if (item.approved !== true) findings.push(`${context}.approved must be true for source-curated pilot vocabulary`);
      const hintReview = item.hintReview;
      if (!hintReview || typeof hintReview !== "object" || Array.isArray(hintReview)) {
        findings.push(`${context}.hintReview must be an object`);
      } else {
        for (const key of requiredHintReviewFields) {
          if (hintReview[key] !== true) findings.push(`${context}.hintReview.${key} must be true`);
        }
      }
    }
    const evidenceIds = evidence.items.map((item) => item?.id);
    if (evidenceIds.join("\n") !== sourceIds.join("\n")) {
      findings.push("Source-curated vocabulary evidence item IDs must match current vocabulary order");
    }
  }
  if (!Array.isArray(evidence.limitations) || evidence.limitations.length === 0) {
    findings.push("Source-curated vocabulary evidence limitations must be a non-empty array");
  } else if (!evidence.limitations.some((item) => String(item).toLowerCase().includes("pending"))) {
    findings.push("Source-curated vocabulary evidence limitations must disclose pending qualified ASL review");
  }
  return { findings, source, items, sourceHash };
}

function blockersPushSourceCuratedGeneratedBy(evidence, findings) {
  const generatedBy = evidence.generated_by;
  if (!generatedBy || typeof generatedBy !== "object" || Array.isArray(generatedBy)) {
    findings.push("Source-curated vocabulary evidence generated_by must be an object from scripts/promote_source_curated_vocabulary.mjs");
    return;
  }
  if (generatedBy.tool !== "scripts/promote_source_curated_vocabulary.mjs") {
    findings.push("Source-curated vocabulary evidence generated_by.tool must be scripts/promote_source_curated_vocabulary.mjs");
  }
  if (!Array.isArray(generatedBy.command) || !generatedBy.command.includes("scripts/promote_source_curated_vocabulary.mjs")) {
    findings.push("Source-curated vocabulary evidence generated_by.command must include scripts/promote_source_curated_vocabulary.mjs");
  }
  const scriptFile = verifyHashPinnedProjectFile(generatedBy.script, "Source-curated vocabulary evidence generated_by.script", findings);
  if (scriptFile && projectRelative(scriptFile) !== "scripts/promote_source_curated_vocabulary.mjs") {
    findings.push("Source-curated vocabulary evidence generated_by.script.path must be scripts/promote_source_curated_vocabulary.mjs");
  }
}

function blockersPushReviewGeneratedBy(evidence, findings) {
  const generatedBy = evidence.generated_by;
  if (!generatedBy || typeof generatedBy !== "object" || Array.isArray(generatedBy)) {
    findings.push("Review evidence generated_by must be an object from scripts/import_vocabulary_review.mjs");
    return;
  }
  if (generatedBy.tool !== "scripts/import_vocabulary_review.mjs") {
    findings.push("Review evidence generated_by.tool must be scripts/import_vocabulary_review.mjs");
  }
  if (!Array.isArray(generatedBy.command) || generatedBy.command.length === 0) {
    findings.push("Review evidence generated_by.command must be a non-empty command array");
  } else if (!generatedBy.command.includes("scripts/import_vocabulary_review.mjs")) {
    findings.push("Review evidence generated_by.command must include scripts/import_vocabulary_review.mjs");
  }
  const scriptFile = verifyHashPinnedProjectFile(generatedBy.script, "Review evidence generated_by.script", findings);
  if (scriptFile && projectRelative(scriptFile) !== "scripts/import_vocabulary_review.mjs") {
    findings.push("Review evidence generated_by.script.path must be scripts/import_vocabulary_review.mjs");
  }
}

export function vocabularyReviewGate(evidencePath = defaultReviewEvidencePath) {
  const { source, items } = parseVocabularySource();
  const blockers = [];
  const sourceHash = sha256File(vocabularyPath);
  if (!fs.existsSync(evidencePath)) {
    blockers.push(...validateVocabularyItems(items));
    if (source.includes("needs_deaf_educator_review")) {
      blockers.push("Vocabulary source still contains needs_deaf_educator_review");
    }
    blockers.push(`Review evidence is missing: ${projectRelative(evidencePath)}`);
  } else {
    blockers.push(...validateVocabularyReviewEvidence(readJson(evidencePath)).findings);
  }
  return {
    status: blockers.length === 0 ? readJson(evidencePath).status : "draft_pre_review",
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sourceHash,
      item_count: items.length,
    },
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
      sha256: fs.existsSync(evidencePath) ? sha256File(evidencePath) : null,
    },
    blockers,
  };
}

export function parseVocabularySource() {
  const source = fs.readFileSync(vocabularyPath, "utf8");
  const rowPattern =
    /^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],/gm;
  const items = [];
  for (const match of source.matchAll(rowPattern)) {
    const statusMatch = source.match(/reviewStatus:\s*"([^"]+)"/);
    const reviewStatus = statusMatch?.[1] ?? "missing";
    items.push({
      id: match[1],
      label: match[2],
      category: match[3],
      prompt: match[4],
      coachingHint: match[5],
      hintKind: match[6],
      reviewStatus,
    });
  }
  return { source, items };
}

export function validateVocabularyItems(items, options = {}) {
  const findings = [];
  if (!Array.isArray(items) || items.length === 0) {
    return ["Vocabulary items must be a non-empty array"];
  }
  if (items.length < 75 || items.length > 100) {
    findings.push(`Vocabulary must contain 75-100 items; found ${items.length}`);
  }
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const context = `items[${index}]`;
    for (const key of ["id", "label", "category", "prompt", "coachingHint", "hintKind"]) {
      if (typeof item[key] !== "string" || item[key].trim().length === 0) {
        findings.push(`${context}.${key} must be a non-empty string`);
      }
    }
    if (typeof item.id === "string") {
      if (!/^[a-z0-9_]+$/.test(item.id)) findings.push(`${context}.id must be lowercase snake_case`);
      if (seen.has(item.id)) findings.push(`Duplicate vocabulary id: ${item.id}`);
      seen.add(item.id);
    }
    if (!VALID_HINT_KINDS.has(item.hintKind)) {
      findings.push(`${context}.hintKind must be one of ${[...VALID_HINT_KINDS].join(", ")}`);
    }
    if (options.requireApproved) {
      const hint = String(item.coachingHint ?? "").trim();
      if (hint.length < 24) findings.push(`${context}.coachingHint is too short to be a useful targeted hint`);
      if (/\b(incorrect|wrong|try again|not correct)\b/i.test(hint)) {
        findings.push(`${context}.coachingHint must be targeted, not only generic incorrect feedback`);
      }
      if (item.approved !== true) findings.push(`${context}.approved must be true`);
      if (item.reviewStatus !== "reviewed") findings.push(`${context}.reviewStatus must be reviewed`);
      const hintReview = item.hintReview;
      if (!hintReview || typeof hintReview !== "object" || Array.isArray(hintReview)) {
        findings.push(`${context}.hintReview must be an object`);
      } else {
        for (const key of [
          "beginnerAppropriate",
          "aslAppropriate",
          "relatesToHintKind",
          "avoidsUnmeasuredAttemptDiagnosis",
        ]) {
          if (hintReview[key] !== true) findings.push(`${context}.hintReview.${key} must be true`);
        }
      }
    }
    if (options.requireSourceCurated) {
      const hint = String(item.coachingHint ?? "").trim();
      if (hint.length < 24) findings.push(`${context}.coachingHint is too short to be a useful targeted hint`);
      if (/\b(incorrect|wrong|try again|not correct)\b/i.test(hint)) {
        findings.push(`${context}.coachingHint must be targeted, not only generic incorrect feedback`);
      }
      if (item.reviewStatus !== SOURCE_CURATED_STATUS) {
        findings.push(`${context}.reviewStatus must be ${SOURCE_CURATED_STATUS}`);
      }
    }
  }
  return findings;
}

export function validateReviewer(reviewer, options = {}) {
  const findings = [];
  if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
    return ["reviewer must be an object"];
  }
  for (const key of ["name", "role", "reviewed_at", "qualification", "affiliation_or_context", "contact_or_signed_evidence"]) {
    const value = reviewer[key];
    if (isPlaceholderString(value)) {
      findings.push(`reviewer.${key} must be a non-placeholder string`);
    }
  }
  if (options.requireAslQualification) {
    const role = String(reviewer.role ?? "").toLowerCase();
    const qualification = String(reviewer.qualification ?? "").toLowerCase();
    const allowed = [
      "deaf educator",
      "asl instructor",
      "qualified asl instructor",
      "certified asl instructor",
      "asl teacher",
    ];
    const genericDefault = "deaf educator or qualified asl instructor";
    if (role.trim() === genericDefault || qualification.trim() === genericDefault) {
      findings.push("reviewer.role or reviewer.qualification must name the reviewer's actual ASL qualification, not the generic prompt text");
    }
    if (!allowed.some((item) => role.includes(item) || qualification.includes(item))) {
      findings.push("reviewer.role or reviewer.qualification must identify a Deaf educator or qualified ASL instructor");
    }
  }
  if (options.requireIndependentReviewer && reviewer.is_project_operator !== false) {
    findings.push("reviewer.is_project_operator must be false");
  }
  if (!isIsoTimestamp(reviewer.reviewed_at)) {
    findings.push("reviewer.reviewed_at must be a full ISO timestamp with timezone");
  } else if (isFutureTimestamp(reviewer.reviewed_at)) {
    findings.push("reviewer.reviewed_at must not be in the future");
  }
  return findings;
}
