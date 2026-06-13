import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateCaptureConditionEvidence,
  validatePlanAssignmentProvenance,
} from "./clip_review_utils.mjs";
import {
  canonicalSignedConsentReceiptPayload,
  validateEd25519SignatureEvidence,
  validateSignedConsentReceiptTopLevelFields,
} from "./signed_receipt_utils.mjs";
import {
  firstSymlinkedProjectPathComponent,
} from "./vocabulary_review_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const CONSENT_VERSION = "asl-pilot-dataset-consent-v1";
const CONSENT_FORM_SHA256 = sha256File(consentFormPath);
const MIN_LABELS = 75;
const MAX_LABELS = 100;
const MIN_CLIPS_PER_LABEL_PER_SPLIT = 5;
const TARGET_SIGNERS = 20;
const TARGET_SIGNERS_BY_SPLIT = {
  train: 12,
  validation: 4,
  test: 4,
};
const REQUIRED_NEGATIVE_CHALLENGE_TYPES = [
  "idle_hands",
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "hands_cropped_out",
  "waving",
  "thumbs_up",
  "counting",
  "fingerspelling_like_motion",
  "wrong_location",
  "wrong_palm_orientation",
  "partial_sign",
  "non_target_asl_sign",
  "casual_non_asl_gesture",
  "mouth_touch",
  "hand_clap",
];
const SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION = "asl-pilot-signed-consent-identity-receipt/v1";
const MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE = 5;
const REQUIRED_CONSENT_FIELDS = [
  "ageEligible",
  "allowModelTraining",
  "allowValidation",
  "allowPilotUse",
  "allowDerivedArtifactRetention",
  "allowDeidentifiedMetadataRetention",
  "retentionAcknowledged",
  "withdrawalAcknowledged",
];
const REQUIRED_CONSENT_TEXT_FIELDS = [
  "consentVersion",
  "consentFormSha256",
  "signedAt",
  "operatorUserId",
  "rawClipStorageLocation",
  "rawClipAccess",
  "retentionPeriod",
];
const ALLOWED_CAMERA_SETTINGS = new Set([
  "aspectRatio",
  "facingMode",
  "frameRate",
  "height",
  "resizeMode",
  "width",
]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--store") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --store");
      args.store = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_dataset_collection_readiness.mjs [--store data/asl-pilot-store.json]

Audits first-party dataset collection progress before manifest export. The
script exits non-zero until enough consented, hash-verified clips exist for
signer-disjoint train/validation/test splits across all approved vocabulary labels.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  const labels = [];
  const rowPattern = /^\s*\["([^"]+)",\s*"([^"]+)"/gm;
  for (const match of text.matchAll(rowPattern)) {
    labels.push({
      label_id: match[1],
      display_text: match[2],
    });
  }
  return labels;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function nonPlaceholderString(value) {
  return typeof value === "string"
    && value.trim().length > 0
    && !/\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value);
}

function sameStringSet(left, right) {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function consentRecordIdsForSigner(consentById, signerAlias) {
  return Array.from(consentById.values())
    .filter((record) => record.signerAlias === signerAlias)
    .map((record) => record.id)
    .filter((value) => typeof value === "string" && value.trim().length > 0);
}

function validateSignedConsentReceipt(receipt, expected, context) {
  const findings = [];
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    findings.push(`${context}: signed consent receipt must be a JSON object`);
    return findings;
  }
  findings.push(...validateSignedConsentReceiptTopLevelFields(receipt, `${context}: signed consent receipt`));
  if (receipt.schema_version !== SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION) {
    findings.push(`${context}: signed consent receipt schema_version must be ${SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION}`);
  }
  if (receipt.status !== "signed") {
    findings.push(`${context}: signed consent receipt status must be signed`);
  }
  if (expected.signerAlias && receipt.signer_alias !== expected.signerAlias) {
    findings.push(`${context}: signed consent receipt signer_alias must match ${expected.signerAlias}`);
  }
  if (expected.signerIdentityHash && receipt.signer_identity_hash !== expected.signerIdentityHash) {
    findings.push(`${context}: signed consent receipt signer_identity_hash must match signer registry`);
  }
  const receiptConsentIds = Array.isArray(receipt.consent_record_ids)
    ? receipt.consent_record_ids.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [];
  if (!sameStringSet(receiptConsentIds, expected.consentRecordIds ?? [])) {
    findings.push(`${context}: signed consent receipt consent_record_ids must match store consent records for signer`);
  }
  if (!isIsoDate(receipt.signed_at)) {
    findings.push(`${context}: signed consent receipt signed_at must be an ISO-compatible date string`);
  }
  const signedBy = receipt.signed_by;
  if (!signedBy || typeof signedBy !== "object" || Array.isArray(signedBy)) {
    findings.push(`${context}: signed consent receipt signed_by must be an object`);
  } else {
    for (const key of ["name", "role", "affiliation_or_context", "contact_or_signature_reference"]) {
      if (!nonPlaceholderString(signedBy[key])) {
        findings.push(`${context}: signed consent receipt signed_by.${key} must be a non-placeholder string`);
      }
    }
    if (signedBy.is_project_operator !== false) {
      findings.push(`${context}: signed consent receipt signed_by.is_project_operator must be false`);
    }
  }
  findings.push(...validateEd25519SignatureEvidence({
    signedObject: receipt,
    payload: canonicalSignedConsentReceiptPayload(receipt),
    context: `${context}: signed consent receipt`,
  }));
  const consentForm = receipt.consent_form;
  if (!consentForm || typeof consentForm !== "object" || Array.isArray(consentForm)) {
    findings.push(`${context}: signed consent receipt consent_form must be an object`);
  } else {
    if (consentForm.path !== "docs/privacy/dataset-consent-form.md") {
      findings.push(`${context}: signed consent receipt consent_form.path must be docs/privacy/dataset-consent-form.md`);
    }
    if (consentForm.consent_version !== CONSENT_VERSION) {
      findings.push(`${context}: signed consent receipt consent_form.consent_version must be ${CONSENT_VERSION}`);
    }
    if (consentForm.sha256 !== CONSENT_FORM_SHA256) {
      findings.push(`${context}: signed consent receipt consent_form.sha256 must match docs/privacy/dataset-consent-form.md`);
    }
  }
  const flags = receipt.confirmed_consent_flags;
  if (!flags || typeof flags !== "object" || Array.isArray(flags)) {
    findings.push(`${context}: signed consent receipt confirmed_consent_flags must be an object`);
  } else {
    const requiredTrueFlags = [
      "age_eligible",
      "allow_model_training",
      "allow_validation",
      "allow_pilot_use",
      "allow_derived_artifact_retention",
      "allow_deidentified_metadata_retention",
      "retention_acknowledged",
      "withdrawal_acknowledged",
    ];
    for (const flag of requiredTrueFlags) {
      if (flags[flag] !== true) findings.push(`${context}: signed consent receipt confirmed_consent_flags.${flag} must be true`);
    }
    if (flags.raw_clip_redistribution_without_separate_permission !== false) {
      findings.push(`${context}: signed consent receipt confirmed_consent_flags.raw_clip_redistribution_without_separate_permission must be false`);
    }
  }
  return findings;
}

function validateSignedConsentEvidence(reference, context, expected = {}) {
  const findings = [];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context}: signedConsentEvidence must be a hash-pinned object`);
    return findings;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    findings.push(`${context}: signedConsentEvidence.path must be a non-empty string`);
    return findings;
  }
  if (!isSha256(reference.sha256)) {
    findings.push(`${context}: signedConsentEvidence.sha256 must be a lowercase SHA-256 digest`);
  }
  const evidencePath = resolveProjectPath(reference.path, `${context}: signedConsentEvidence.path`);
  if (!fs.existsSync(evidencePath)) {
    findings.push(`${context}: signed consent evidence file is missing at ${path.relative(root, evidencePath)}`);
  } else if (fs.lstatSync(evidencePath).isSymbolicLink()) {
    findings.push(`${context}: signedConsentEvidence.path must not be a symbolic link`);
  } else if (firstSymlinkedProjectPathComponent(evidencePath, { includeTarget: false })) {
    findings.push(`${context}: signedConsentEvidence.path must not include a symbolic link path component`);
  } else if (!fs.lstatSync(evidencePath).isFile()) {
    findings.push(`${context}: signedConsentEvidence.path must be a file`);
  } else if (reference.sha256 !== sha256File(evidencePath)) {
    findings.push(`${context}: signedConsentEvidence.sha256 does not match the referenced file`);
  } else if (path.extname(evidencePath) !== ".json") {
    findings.push(`${context}: signedConsentEvidence must reference a machine-readable JSON receipt`);
  } else {
    try {
      findings.push(...validateSignedConsentReceipt(readJson(evidencePath), expected, context));
    } catch (error) {
      findings.push(`${context}: signedConsentEvidence JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return findings;
}

function signerBucket(signerAlias) {
  const digest = crypto.createHash("sha256").update(String(signerAlias)).digest();
  return digest[0] % 5;
}

function splitForSigner(signerAlias) {
  const bucket = signerBucket(signerAlias);
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function emptyStore() {
  return {
    users: [],
    sessions: [],
    attempts: [],
    datasetSigners: [],
    consentRecords: [],
    datasetClips: [],
    datasetChallengeClips: [],
  };
}

function readStore(storePath) {
  if (!fs.existsSync(storePath)) return { exists: false, store: emptyStore() };
  const data = readJson(storePath);
  return {
    exists: true,
    store: {
      users: Array.isArray(data.users) ? data.users : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      datasetSigners: Array.isArray(data.datasetSigners) ? data.datasetSigners : [],
      consentRecords: Array.isArray(data.consentRecords) ? data.consentRecords : [],
      datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
      datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
    },
  };
}

function validateVocabulary(labels) {
  const findings = [];
  if (labels.length < MIN_LABELS || labels.length > MAX_LABELS) {
    findings.push(`Vocabulary must contain ${MIN_LABELS}-${MAX_LABELS} labels; found ${labels.length}`);
  }
  const seen = new Set();
  for (const label of labels) {
    if (seen.has(label.label_id)) findings.push(`Duplicate vocabulary label id: ${label.label_id}`);
    seen.add(label.label_id);
  }
  return findings;
}

function validateClip(clip, consentById, labelIds, signerByAlias) {
  const findings = [];
  const context = `clip ${clip.id ?? "(missing id)"}`;
  if (!clip.id) findings.push(`${context}: missing clip id`);
  findings.push(...validatePlanAssignmentProvenance(clip, { context }));
  findings.push(...validateCaptureConditionEvidence(clip, { context }));
  const reviewStatus = clip.labelReviewStatus ?? "needs_qa";
  if (reviewStatus === "rejected") {
    if (typeof clip.labelReviewer !== "string" || clip.labelReviewer.trim().length === 0) {
      findings.push(`${context}: rejected clip must identify the clip QA reviewer`);
    }
    if (
      typeof clip.labelReviewedAt !== "string" ||
      Number.isNaN(Date.parse(clip.labelReviewedAt))
    ) {
      findings.push(`${context}: rejected clip labelReviewedAt must be an ISO-compatible date string`);
    }
    if (typeof clip.labelRejectionReason !== "string" || clip.labelRejectionReason.trim().length === 0) {
      findings.push(`${context}: rejected clip must record labelRejectionReason`);
    }
    return findings;
  }
  if (reviewStatus !== "approved") {
    findings.push(`${context}: labelReviewStatus must be approved for export or rejected with a reason`);
    return findings;
  }
  if (!labelIds.has(clip.vocabularyId)) findings.push(`${context}: unknown vocabularyId ${clip.vocabularyId}`);
  if (typeof clip.labelReviewer !== "string" || clip.labelReviewer.trim().length === 0) {
    findings.push(`${context}: labelReviewer must identify the clip QA reviewer`);
  }
  if (
    typeof clip.labelReviewedAt !== "string" ||
    Number.isNaN(Date.parse(clip.labelReviewedAt))
  ) {
    findings.push(`${context}: labelReviewedAt must be an ISO-compatible date string`);
  }
  if (!clip.signerAlias || typeof clip.signerAlias !== "string") {
    findings.push(`${context}: missing signerAlias`);
  } else {
    const signer = signerByAlias.get(clip.signerAlias);
    if (!signer) {
      findings.push(`${context}: missing signer registry record for ${clip.signerAlias}`);
    } else {
      const expectedSplit = splitForSigner(clip.signerAlias);
      if (signer.split !== expectedSplit) {
        findings.push(`${context}: signer registry split ${signer.split} does not match ${expectedSplit}`);
      }
      if (signer.identityAttestation !== "signed_identity_verified") {
        findings.push(`${context}: signer registry identityAttestation must be signed_identity_verified for final readiness`);
      }
      if (!isSha256(signer.signerIdentityHash)) {
        findings.push(`${context}: signer registry signerIdentityHash must be a lowercase SHA-256 digest`);
      }
      findings.push(...validateSignedConsentEvidence(signer.signedConsentEvidence, context, {
        signerAlias: clip.signerAlias,
        signerIdentityHash: signer.signerIdentityHash,
        consentRecordIds: consentRecordIdsForSigner(consentById, clip.signerAlias),
      }));
      if (!isSha256(consentById.get(clip.consentRecordId)?.signerIdentityHash)) {
        findings.push(`${context}: consent record signerIdentityHash must be a lowercase SHA-256 digest`);
      } else if (consentById.get(clip.consentRecordId)?.signerIdentityHash !== signer.signerIdentityHash) {
        findings.push(`${context}: consent signerIdentityHash must match signer registry`);
      }
      if (signer.consentVersion !== CONSENT_VERSION) {
        findings.push(`${context}: signer registry consentVersion must be ${CONSENT_VERSION}`);
      }
      if (signer.consentFormSha256 !== CONSENT_FORM_SHA256) {
        findings.push(`${context}: signer registry consentFormSha256 must match docs/privacy/dataset-consent-form.md`);
      }
    }
  }
  const consent = consentById.get(clip.consentRecordId);
  if (!consent) {
    findings.push(`${context}: missing consent record ${clip.consentRecordId}`);
  } else {
    for (const field of REQUIRED_CONSENT_FIELDS) {
      if (consent[field] !== true) findings.push(`${context}: consent field is not true: ${field}`);
    }
    for (const field of REQUIRED_CONSENT_TEXT_FIELDS) {
      if (typeof consent[field] !== "string" || consent[field].trim().length === 0) {
        findings.push(`${context}: consent metadata field is missing: ${field}`);
      }
    }
    if (typeof consent.allowRawClipRedistribution !== "boolean") {
      findings.push(`${context}: consent must record allowRawClipRedistribution as a boolean`);
    }
    if (Number.isNaN(Date.parse(consent.signedAt ?? ""))) {
      findings.push(`${context}: consent signedAt must be an ISO-compatible date string`);
    }
    if (consent.signerAlias !== clip.signerAlias) {
      findings.push(`${context}: consent signerAlias does not match clip signerAlias`);
    }
    if (consent.userId !== clip.userId) {
      findings.push(`${context}: consent userId does not match clip userId`);
    }
    if (consent.consentVersion !== CONSENT_VERSION) {
      findings.push(`${context}: consentVersion must be ${CONSENT_VERSION}`);
    }
    if (consent.consentFormSha256 !== CONSENT_FORM_SHA256) {
      findings.push(`${context}: consentFormSha256 must match docs/privacy/dataset-consent-form.md`);
    }
    findings.push(...validateSignedConsentEvidence(consent.signedConsentEvidence, context, {
      signerAlias: consent.signerAlias,
      signerIdentityHash: consent.signerIdentityHash,
      consentRecordIds: consentRecordIdsForSigner(consentById, consent.signerAlias),
    }));
  }
  const mimeType = String(clip.mimeType ?? "").trim().toLowerCase();
  if (mimeType !== "video/webm" && !mimeType.startsWith("video/webm;")) {
    findings.push(`${context}: clip mimeType must be browser-recorded WebM`);
  }
  const durationMs = Number(clip.durationMs);
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > 10_000) {
    findings.push(`${context}: durationMs must be between 500 and 10000`);
  }
  if (!Number.isFinite(Number(clip.sizeBytes)) || Number(clip.sizeBytes) <= 0) {
    findings.push(`${context}: sizeBytes must be positive`);
  } else if (Number(clip.sizeBytes) < 1024) {
    findings.push(`${context}: sizeBytes must be at least 1024 bytes`);
  }
  const settings = clip.mediaStreamTrackSettings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    findings.push(`${context}: mediaStreamTrackSettings must be a sanitized object`);
  } else {
    for (const key of Object.keys(settings)) {
      if (!ALLOWED_CAMERA_SETTINGS.has(key)) {
        findings.push(`${context}: mediaStreamTrackSettings contains disallowed key ${key}`);
      }
    }
  }
  if (typeof clip.relativeVideoPath !== "string" || !clip.relativeVideoPath) {
    findings.push(`${context}: missing relativeVideoPath`);
  } else {
    const videoPath = path.resolve(root, "data", clip.relativeVideoPath);
    const dataRoot = path.resolve(root, "data");
    if (!videoPath.startsWith(`${dataRoot}${path.sep}`)) {
      findings.push(`${context}: relativeVideoPath escapes data root`);
    } else if (!fs.existsSync(videoPath)) {
      findings.push(`${context}: video file is missing at ${path.relative(root, videoPath)}`);
    } else {
      const actualSize = fs.statSync(videoPath).size;
      if (Number(clip.sizeBytes) !== actualSize) {
        findings.push(`${context}: sizeBytes does not match the video file size`);
      }
      const actualHash = sha256File(videoPath);
      if (actualHash !== clip.sha256) {
        findings.push(`${context}: video SHA-256 mismatch`);
      }
    }
  }
  return findings;
}

function validateChallengeClip(clip, consentById, signerByAlias) {
  const findings = [];
  const context = `challenge clip ${clip.id ?? "(missing id)"}`;
  if (!clip.id) findings.push(`${context}: missing clip id`);
  findings.push(...validatePlanAssignmentProvenance(clip, { context, kind: "negative_challenge" }));
  findings.push(...validateCaptureConditionEvidence(clip, { context, kind: "negative_challenge" }));
  const reviewStatus = clip.challengeReviewStatus ?? "needs_review";
  if (reviewStatus === "rejected") {
    if (typeof clip.challengeReviewer !== "string" || clip.challengeReviewer.trim().length === 0) {
      findings.push(`${context}: rejected challenge clip must identify the reviewer`);
    }
    if (
      typeof clip.challengeReviewedAt !== "string" ||
      Number.isNaN(Date.parse(clip.challengeReviewedAt))
    ) {
      findings.push(`${context}: rejected challenge clip challengeReviewedAt must be an ISO-compatible date string`);
    }
    if (
      typeof clip.challengeRejectionReason !== "string" ||
      clip.challengeRejectionReason.trim().length === 0
    ) {
      findings.push(`${context}: rejected challenge clip must record challengeRejectionReason`);
    }
    return findings;
  }
  if (reviewStatus !== "approved") {
    findings.push(`${context}: challengeReviewStatus must be approved for export or rejected with a reason`);
    return findings;
  }
  if (!REQUIRED_NEGATIVE_CHALLENGE_TYPES.includes(clip.challengeType)) {
    findings.push(`${context}: unknown challengeType ${clip.challengeType}`);
  }
  if (typeof clip.challengeReviewer !== "string" || clip.challengeReviewer.trim().length === 0) {
    findings.push(`${context}: challengeReviewer must identify the reviewer`);
  }
  if (
    typeof clip.challengeReviewedAt !== "string" ||
    Number.isNaN(Date.parse(clip.challengeReviewedAt))
  ) {
    findings.push(`${context}: challengeReviewedAt must be an ISO-compatible date string`);
  }
  if (!clip.signerAlias || typeof clip.signerAlias !== "string") {
    findings.push(`${context}: missing signerAlias`);
  } else {
    const signer = signerByAlias.get(clip.signerAlias);
    if (!signer) {
      findings.push(`${context}: missing signer registry record for ${clip.signerAlias}`);
    } else {
      const expectedSplit = splitForSigner(clip.signerAlias);
      if (signer.split !== expectedSplit) {
        findings.push(`${context}: signer registry split ${signer.split} does not match ${expectedSplit}`);
      }
      if (signer.identityAttestation !== "signed_identity_verified") {
        findings.push(`${context}: signer registry identityAttestation must be signed_identity_verified for final readiness`);
      }
      if (!isSha256(signer.signerIdentityHash)) {
        findings.push(`${context}: signer registry signerIdentityHash must be a lowercase SHA-256 digest`);
      }
      findings.push(...validateSignedConsentEvidence(signer.signedConsentEvidence, context, {
        signerAlias: clip.signerAlias,
        signerIdentityHash: signer.signerIdentityHash,
        consentRecordIds: consentRecordIdsForSigner(consentById, clip.signerAlias),
      }));
      if (!isSha256(consentById.get(clip.consentRecordId)?.signerIdentityHash)) {
        findings.push(`${context}: consent record signerIdentityHash must be a lowercase SHA-256 digest`);
      } else if (consentById.get(clip.consentRecordId)?.signerIdentityHash !== signer.signerIdentityHash) {
        findings.push(`${context}: consent signerIdentityHash must match signer registry`);
      }
      if (signer.consentVersion !== CONSENT_VERSION) {
        findings.push(`${context}: signer registry consentVersion must be ${CONSENT_VERSION}`);
      }
      if (signer.consentFormSha256 !== CONSENT_FORM_SHA256) {
        findings.push(`${context}: signer registry consentFormSha256 must match docs/privacy/dataset-consent-form.md`);
      }
    }
  }
  const consent = consentById.get(clip.consentRecordId);
  if (!consent) {
    findings.push(`${context}: missing consent record ${clip.consentRecordId}`);
  } else {
    for (const field of REQUIRED_CONSENT_FIELDS) {
      if (consent[field] !== true) findings.push(`${context}: consent field is not true: ${field}`);
    }
    for (const field of REQUIRED_CONSENT_TEXT_FIELDS) {
      if (typeof consent[field] !== "string" || consent[field].trim().length === 0) {
        findings.push(`${context}: consent metadata field is missing: ${field}`);
      }
    }
    if (typeof consent.allowRawClipRedistribution !== "boolean") {
      findings.push(`${context}: consent must record allowRawClipRedistribution as a boolean`);
    }
    if (Number.isNaN(Date.parse(consent.signedAt ?? ""))) {
      findings.push(`${context}: consent signedAt must be an ISO-compatible date string`);
    }
    if (consent.signerAlias !== clip.signerAlias) {
      findings.push(`${context}: consent signerAlias does not match clip signerAlias`);
    }
    if (consent.userId !== clip.userId) {
      findings.push(`${context}: consent userId does not match clip userId`);
    }
    if (consent.consentVersion !== CONSENT_VERSION) {
      findings.push(`${context}: consentVersion must be ${CONSENT_VERSION}`);
    }
    if (consent.consentFormSha256 !== CONSENT_FORM_SHA256) {
      findings.push(`${context}: consentFormSha256 must match docs/privacy/dataset-consent-form.md`);
    }
    findings.push(...validateSignedConsentEvidence(consent.signedConsentEvidence, context, {
      signerAlias: consent.signerAlias,
      signerIdentityHash: consent.signerIdentityHash,
      consentRecordIds: consentRecordIdsForSigner(consentById, consent.signerAlias),
    }));
  }
  const mimeType = String(clip.mimeType ?? "").trim().toLowerCase();
  if (mimeType !== "video/webm" && !mimeType.startsWith("video/webm;")) {
    findings.push(`${context}: clip mimeType must be browser-recorded WebM`);
  }
  const durationMs = Number(clip.durationMs);
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > 10_000) {
    findings.push(`${context}: durationMs must be between 500 and 10000`);
  }
  if (!Number.isFinite(Number(clip.sizeBytes)) || Number(clip.sizeBytes) <= 0) {
    findings.push(`${context}: sizeBytes must be positive`);
  } else if (Number(clip.sizeBytes) < 1024) {
    findings.push(`${context}: sizeBytes must be at least 1024 bytes`);
  }
  const settings = clip.mediaStreamTrackSettings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    findings.push(`${context}: mediaStreamTrackSettings must be a sanitized object`);
  } else {
    for (const key of Object.keys(settings)) {
      if (!ALLOWED_CAMERA_SETTINGS.has(key)) {
        findings.push(`${context}: mediaStreamTrackSettings contains disallowed key ${key}`);
      }
    }
  }
  if (typeof clip.relativeVideoPath !== "string" || !clip.relativeVideoPath) {
    findings.push(`${context}: missing relativeVideoPath`);
  } else {
    const videoPath = path.resolve(root, "data", clip.relativeVideoPath);
    const dataRoot = path.resolve(root, "data");
    if (!videoPath.startsWith(`${dataRoot}${path.sep}`)) {
      findings.push(`${context}: relativeVideoPath escapes data root`);
    } else if (!fs.existsSync(videoPath)) {
      findings.push(`${context}: video file is missing at ${path.relative(root, videoPath)}`);
    } else {
      const actualSize = fs.statSync(videoPath).size;
      if (Number(clip.sizeBytes) !== actualSize) {
        findings.push(`${context}: sizeBytes does not match the video file size`);
      }
      const actualHash = sha256File(videoPath);
      if (actualHash !== clip.sha256) {
        findings.push(`${context}: video SHA-256 mismatch`);
      }
    }
  }
  return findings;
}

function signerIdentityFor(signerAlias, signerByAlias) {
  return signerByAlias.get(signerAlias)?.signerIdentityHash ?? signerAlias;
}

function coverageFor(clips, labels, signerByAlias) {
  const labelsById = new Map(labels.map((label) => [label.label_id, label.display_text]));
  const bySplit = {
    train: new Map(labels.map((label) => [label.label_id, 0])),
    validation: new Map(labels.map((label) => [label.label_id, 0])),
    test: new Map(labels.map((label) => [label.label_id, 0])),
  };
  const signersBySplit = {
    train: new Set(),
    validation: new Set(),
    test: new Set(),
  };
  for (const clip of clips) {
    if (!labelsById.has(clip.vocabularyId) || !clip.signerAlias) continue;
    const split = splitForSigner(clip.signerAlias);
    bySplit[split].set(clip.vocabularyId, (bySplit[split].get(clip.vocabularyId) ?? 0) + 1);
    signersBySplit[split].add(signerIdentityFor(clip.signerAlias, signerByAlias));
  }
  const missingBySplit = Object.fromEntries(
    Object.entries(bySplit).map(([split, counts]) => [
      split,
      [...counts.entries()]
        .filter(([, count]) => count < MIN_CLIPS_PER_LABEL_PER_SPLIT)
        .map(([labelId]) => labelId),
    ]),
  );
  const coveredLabelsBySplit = Object.fromEntries(
    Object.entries(bySplit).map(([split, counts]) => [
      split,
      [...counts.values()].filter((count) => count >= MIN_CLIPS_PER_LABEL_PER_SPLIT).length,
    ]),
  );
  const clipCountsBySplit = Object.fromEntries(
    Object.entries(bySplit).map(([split, counts]) => [
      split,
      [...counts.values()].reduce((total, count) => total + count, 0),
    ]),
  );
  const signers = new Set(clips.map((clip) => clip.signerAlias).filter(Boolean).map((alias) => signerIdentityFor(alias, signerByAlias)));
  return {
    clipCountsBySplit,
    coveredLabelsBySplit,
    missingBySplit,
    signerCountsBySplit: Object.fromEntries(
      Object.entries(signersBySplit).map(([split, signersForSplit]) => [split, signersForSplit.size]),
    ),
    totalSignerCount: signers.size,
  };
}

function challengeCoverageFor(challengeClips, signerByAlias) {
  const countsByType = Object.fromEntries(
    REQUIRED_NEGATIVE_CHALLENGE_TYPES.map((challengeType) => [challengeType, 0]),
  );
  const signers = new Set();
  for (const clip of challengeClips) {
    if (REQUIRED_NEGATIVE_CHALLENGE_TYPES.includes(clip.challengeType)) {
      countsByType[clip.challengeType] += 1;
    }
    if (clip.signerAlias) signers.add(signerIdentityFor(clip.signerAlias, signerByAlias));
  }
  const missingTypes = REQUIRED_NEGATIVE_CHALLENGE_TYPES.filter(
    (challengeType) => countsByType[challengeType] < MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE,
  );
  return {
    countsByType,
    missingTypes,
    signerCount: signers.size,
    signers,
  };
}

function validateSignerRegistry(signers) {
  const findings = [];
  const byIdentityHash = new Map();
  for (const signer of signers ?? []) {
    if (signer?.identityAttestation !== "signed_identity_verified") continue;
    if (!isSha256(signer.signerIdentityHash)) continue;
    const aliases = byIdentityHash.get(signer.signerIdentityHash) ?? [];
    aliases.push(signer.signerAlias);
    byIdentityHash.set(signer.signerIdentityHash, aliases);
  }
  for (const [identityHash, aliases] of byIdentityHash.entries()) {
    const uniqueAliases = [...new Set(aliases)];
    if (uniqueAliases.length > 1) {
      findings.push(`Signer identity hash ${identityHash} appears under multiple aliases: ${uniqueAliases.join(", ")}`);
    }
  }
  return findings;
}

function duplicateApprovedAssignmentKeyFindings(clips, context) {
  const findings = [];
  const byKey = new Map();
  for (const clip of clips) {
    const key = clip.planAssignmentKey;
    if (typeof key !== "string" || key.trim().length === 0) continue;
    const clipIds = byKey.get(key) ?? [];
    clipIds.push(clip.id);
    byKey.set(key, clipIds);
  }
  for (const [key, clipIds] of byKey.entries()) {
    if (clipIds.length > 1) {
      findings.push(`${context}: at most one approved clip may satisfy collection plan assignment ${key}; found ${clipIds.join(", ")}`);
    }
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const labels = readVocabularyLabels();
  const vocabularyFindings = validateVocabulary(labels);
  const { exists: storeExists, store } = readStore(storePath);
  const consentById = new Map(store.consentRecords.map((record) => [record.id, record]));
  const signerByAlias = new Map(
    (store.datasetSigners ?? []).map((record) => [record.signerAlias, record]),
  );
  const labelIds = new Set(labels.map((label) => label.label_id));
  const signerFindings = validateSignerRegistry(store.datasetSigners);
  const clipFindings = store.datasetClips.flatMap((clip) => validateClip(clip, consentById, labelIds, signerByAlias));
  const challengeFindings = store.datasetChallengeClips.flatMap((clip) => validateChallengeClip(clip, consentById, signerByAlias));
  const validClipIds = new Set(
    store.datasetClips
      .filter((clip) => (
        clip.labelReviewStatus === "approved" &&
        validateClip(clip, consentById, labelIds, signerByAlias).length === 0
      ))
      .map((clip) => clip.id),
  );
  const validClips = store.datasetClips.filter((clip) => validClipIds.has(clip.id));
  const validChallengeClipIds = new Set(
    store.datasetChallengeClips
      .filter((clip) => (
        clip.challengeReviewStatus === "approved" &&
        validateChallengeClip(clip, consentById, signerByAlias).length === 0
      ))
      .map((clip) => clip.id),
  );
  const validChallengeClips = store.datasetChallengeClips.filter((clip) => validChallengeClipIds.has(clip.id));
  const rejectedClips = store.datasetClips.filter((clip) => clip.labelReviewStatus === "rejected");
  const rejectedChallengeClips = store.datasetChallengeClips.filter((clip) => clip.challengeReviewStatus === "rejected");
  const unresolvedClips = store.datasetClips.filter((clip) => (
    clip.labelReviewStatus !== "approved" && clip.labelReviewStatus !== "rejected"
  ));
  const unresolvedChallengeClips = store.datasetChallengeClips.filter((clip) => (
    clip.challengeReviewStatus !== "approved" && clip.challengeReviewStatus !== "rejected"
  ));
  const coverage = coverageFor(validClips, labels, signerByAlias);
  const challengeCoverage = challengeCoverageFor(validChallengeClips, signerByAlias);
  const coverageFindings = [];
  if (!storeExists) coverageFindings.push(`Store does not exist: ${path.relative(root, storePath)}`);
  if (store.datasetClips.length === 0) coverageFindings.push("No dataset clips found");
  if (store.datasetChallengeClips.length === 0) coverageFindings.push("No negative challenge clips found");
  for (const split of ["train", "validation", "test"]) {
    const missing = coverage.missingBySplit[split];
    if (missing.length > 0) {
      coverageFindings.push(`${split} split lacks ${MIN_CLIPS_PER_LABEL_PER_SPLIT} approved clips for ${missing.length} labels`);
    }
    const signerTarget = TARGET_SIGNERS_BY_SPLIT[split];
    if (coverage.signerCountsBySplit[split] < signerTarget) {
      coverageFindings.push(
        `${split} split needs at least ${signerTarget} signer(s); found ${coverage.signerCountsBySplit[split]}`,
      );
    }
  }
  if (coverage.totalSignerCount < TARGET_SIGNERS) {
    coverageFindings.push(`Production pilot target is ${TARGET_SIGNERS} signers; found ${coverage.totalSignerCount}`);
  }
  if (challengeCoverage.missingTypes.length > 0) {
    coverageFindings.push(
      `Negative challenge set needs at least ${MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE} clip(s) for each required type; underfilled: ${challengeCoverage.missingTypes.join(", ")}`,
    );
  }
  const normalSigners = new Set(validClips.map((clip) => clip.signerAlias).filter(Boolean).map((alias) => signerIdentityFor(alias, signerByAlias)));
  const challengeOverlap = [...challengeCoverage.signers].filter((signer) => normalSigners.has(signer));
  if (challengeOverlap.length > 0) {
    coverageFindings.push(
      `Negative challenge signers must be disjoint from train/validation/test signers: ${challengeOverlap.join(", ")}`,
    );
  }
  coverageFindings.push(...duplicateApprovedAssignmentKeyFindings(validClips, "approved vocabulary clips"));
  coverageFindings.push(...duplicateApprovedAssignmentKeyFindings(validChallengeClips, "approved negative challenge clips"));
  const blockers = [...vocabularyFindings, ...signerFindings, ...clipFindings, ...challengeFindings, ...coverageFindings];
  const summary = {
    status: blockers.length === 0 ? "ready_for_manifest_export" : "incomplete",
    checked_at: new Date().toISOString(),
    store: {
      path: path.relative(root, storePath),
      exists: storeExists,
    },
    targets: {
      labels_min: MIN_LABELS,
      labels_max: MAX_LABELS,
      min_clips_per_label_per_split: MIN_CLIPS_PER_LABEL_PER_SPLIT,
      target_signers: TARGET_SIGNERS,
      target_signers_by_split: TARGET_SIGNERS_BY_SPLIT,
      consent_form: {
        path: path.relative(root, consentFormPath),
        sha256: CONSENT_FORM_SHA256,
      },
    },
    vocabulary: {
      label_count: labels.length,
    },
    collection: {
      total_clips: store.datasetClips.length,
      valid_clips: validClips.length,
      rejected_clips: rejectedClips.length,
      unresolved_review_clips: unresolvedClips.length,
      consent_records: store.consentRecords.length,
      signer_records: (store.datasetSigners ?? []).length,
      total_signers: coverage.totalSignerCount,
      signer_counts_by_split: coverage.signerCountsBySplit,
      clip_counts_by_split: coverage.clipCountsBySplit,
      covered_labels_by_split: coverage.coveredLabelsBySplit,
      missing_labels_by_split: coverage.missingBySplit,
    },
    negative_challenge: {
      total_clips: store.datasetChallengeClips.length,
      valid_clips: validChallengeClips.length,
      rejected_clips: rejectedChallengeClips.length,
      unresolved_review_clips: unresolvedChallengeClips.length,
      signer_count: challengeCoverage.signerCount,
      required_types: REQUIRED_NEGATIVE_CHALLENGE_TYPES,
      min_clips_per_type: MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE,
      counts_by_type: challengeCoverage.countsByType,
      missing_types: challengeCoverage.missingTypes,
    },
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Dataset collection readiness audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Dataset collection readiness audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
