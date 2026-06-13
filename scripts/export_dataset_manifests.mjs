import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  firstSymlinkedProjectPathComponent,
  isVocabularyGateStatus,
  vocabularyReviewGate,
} from "./vocabulary_review_utils.mjs";
import {
  validateCollectionPlanReviewGateFresh,
} from "./collection_plan_freshness_utils.mjs";
import {
  defaultCollectionPlanPath,
  validateCaptureConditionEvidence,
  validatePlanAssignmentProvenance,
} from "./clip_review_utils.mjs";
import {
  canonicalSignedConsentReceiptPayload,
  validateEd25519SignatureEvidence,
  validateSignedConsentReceiptTopLevelFields,
} from "./signed_receipt_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const storePath = path.join(root, "data", "asl-pilot-store.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const outputDir = path.join(root, "data", "manifests");
const FIRST_PARTY_SOURCE_ID = "first-party-browser-consent-capture";
const CONSENT_VERSION = "asl-pilot-dataset-consent-v1";
const CONSENT_FORM_SHA256 = sha256File(consentFormPath);
const SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION = "asl-pilot-signed-consent-identity-receipt/v1";
const MIN_LABELS = 75;
const MAX_LABELS = 100;
const MIN_CLIPS_PER_LABEL_PER_SPLIT = 5;
const MIN_DATASET_CLIP_BYTES = 1024;
const MIN_DATASET_CLIP_DURATION_MS = 500;
const MAX_DATASET_CLIP_DURATION_MS = 10_000;
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertReviewAuditsPass() {
  for (const script of ["scripts/audit_clip_review.mjs", "scripts/audit_challenge_review.mjs"]) {
    const result = spawnSync("node", [script], {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      console.error((result.stderr || result.stdout || `${script} failed`).trim());
      process.exit(2);
    }
  }
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

function assertNonPlaceholderString(value, context) {
  if (typeof value !== "string" || value.trim().length === 0 || /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value)) {
    console.error(`${context} must be a non-placeholder string.`);
    process.exit(2);
  }
}

function validateSignedBy(signedBy, context) {
  if (!signedBy || typeof signedBy !== "object" || Array.isArray(signedBy)) {
    console.error(`${context} must be an object.`);
    process.exit(2);
  }
  for (const field of ["name", "role", "affiliation_or_context", "contact_or_signature_reference"]) {
    assertNonPlaceholderString(signedBy[field], `${context}.${field}`);
  }
  if (signedBy.is_project_operator !== false) {
    console.error(`${context}.is_project_operator must be false.`);
    process.exit(2);
  }
}

function validateSignedConsentEvidence(reference, context, expected) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    console.error(`${context} signedConsentEvidence must be a hash-pinned object.`);
    process.exit(2);
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    console.error(`${context} signedConsentEvidence.path must be a non-empty string.`);
    process.exit(2);
  }
  if (!isSha256(reference.sha256)) {
    console.error(`${context} signedConsentEvidence.sha256 must be a lowercase SHA-256 digest.`);
    process.exit(2);
  }
  const evidencePath = path.resolve(root, reference.path);
  if (!evidencePath.startsWith(`${root}${path.sep}`)) {
    console.error(`${context} signedConsentEvidence.path escapes project root.`);
    process.exit(2);
  }
  if (!fs.existsSync(evidencePath)) {
    console.error(`${context} signed consent evidence file is missing: ${projectRelative(evidencePath)}.`);
    process.exit(2);
  }
  const evidenceStats = fs.lstatSync(evidencePath);
  if (evidenceStats.isSymbolicLink()) {
    console.error(`${context} signedConsentEvidence.path must not be a symbolic link.`);
    process.exit(2);
  }
  const symlinkedAncestor = firstSymlinkedProjectPathComponent(evidencePath, { includeTarget: false });
  if (symlinkedAncestor) {
    console.error(`${context} signedConsentEvidence.path must not include a symbolic link path component: ${projectRelative(symlinkedAncestor)}.`);
    process.exit(2);
  }
  if (!evidenceStats.isFile()) {
    console.error(`${context} signedConsentEvidence.path must be a file.`);
    process.exit(2);
  }
  if (reference.sha256 !== sha256File(evidencePath)) {
    console.error(`${context} signedConsentEvidence.sha256 does not match the referenced file.`);
    process.exit(2);
  }
  if (path.extname(evidencePath).toLowerCase() !== ".json") {
    console.error(`${context} signedConsentEvidence.path must point to a JSON receipt.`);
    process.exit(2);
  }
  let receipt;
  try {
    receipt = readJson(evidencePath);
  } catch (error) {
    console.error(`${context} signedConsentEvidence receipt must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    console.error(`${context} signedConsentEvidence receipt must be a JSON object.`);
    process.exit(2);
  }
  const topLevelFindings = validateSignedConsentReceiptTopLevelFields(receipt, `${context} signedConsentEvidence receipt`);
  if (topLevelFindings.length > 0) {
    console.error(topLevelFindings.join("\n"));
    process.exit(2);
  }
  if (receipt.schema_version !== SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION) {
    console.error(`${context} signedConsentEvidence receipt schema_version must be ${SIGNED_CONSENT_RECEIPT_SCHEMA_VERSION}.`);
    process.exit(2);
  }
  if (receipt.status !== "signed") {
    console.error(`${context} signedConsentEvidence receipt status must be signed.`);
    process.exit(2);
  }
  if (receipt.signer_alias !== expected.signerAlias) {
    console.error(`${context} signedConsentEvidence receipt signer_alias must match ${expected.signerAlias}.`);
    process.exit(2);
  }
  if (receipt.signer_identity_hash !== expected.signerIdentityHash) {
    console.error(`${context} signedConsentEvidence receipt signer_identity_hash must match the verified signer identity hash.`);
    process.exit(2);
  }
  const consentRecordIds = Array.isArray(receipt.consent_record_ids)
    ? receipt.consent_record_ids.filter((id) => typeof id === "string" && id.trim().length > 0)
    : [];
  if (consentRecordIds.length === 0 || consentRecordIds.length !== receipt.consent_record_ids?.length) {
    console.error(`${context} signedConsentEvidence receipt consent_record_ids must be a non-empty string array.`);
    process.exit(2);
  }
  if (new Set(consentRecordIds).size !== consentRecordIds.length) {
    console.error(`${context} signedConsentEvidence receipt consent_record_ids must not contain duplicates.`);
    process.exit(2);
  }
  if (!consentRecordIds.includes(expected.consentRecordId)) {
    console.error(`${context} signedConsentEvidence receipt consent_record_ids must include ${expected.consentRecordId}.`);
    process.exit(2);
  }
  const consentForm = receipt.consent_form;
  if (!consentForm || typeof consentForm !== "object" || Array.isArray(consentForm)) {
    console.error(`${context} signedConsentEvidence receipt consent_form must be an object.`);
    process.exit(2);
  }
  if (consentForm.path !== "docs/privacy/dataset-consent-form.md") {
    console.error(`${context} signedConsentEvidence receipt consent_form.path must be docs/privacy/dataset-consent-form.md.`);
    process.exit(2);
  }
  if (consentForm.consent_version !== CONSENT_VERSION) {
    console.error(`${context} signedConsentEvidence receipt consent_form.consent_version must be ${CONSENT_VERSION}.`);
    process.exit(2);
  }
  if (consentForm.sha256 !== CONSENT_FORM_SHA256) {
    console.error(`${context} signedConsentEvidence receipt consent_form.sha256 must match docs/privacy/dataset-consent-form.md.`);
    process.exit(2);
  }
  const confirmed = receipt.confirmed_consent_flags;
  if (!confirmed || typeof confirmed !== "object" || Array.isArray(confirmed)) {
    console.error(`${context} signedConsentEvidence receipt confirmed_consent_flags must be an object.`);
    process.exit(2);
  }
  for (const flag of [
    "age_eligible",
    "allow_model_training",
    "allow_validation",
    "allow_pilot_use",
    "allow_derived_artifact_retention",
    "allow_deidentified_metadata_retention",
    "retention_acknowledged",
    "withdrawal_acknowledged",
  ]) {
    if (confirmed[flag] !== true) {
      console.error(`${context} signedConsentEvidence receipt confirmed_consent_flags.${flag} must be true.`);
      process.exit(2);
    }
  }
  if (confirmed.raw_clip_redistribution_without_separate_permission !== false) {
    console.error(`${context} signedConsentEvidence receipt confirmed_consent_flags.raw_clip_redistribution_without_separate_permission must be false.`);
    process.exit(2);
  }
  if (Number.isNaN(Date.parse(receipt.signed_at ?? ""))) {
    console.error(`${context} signedConsentEvidence receipt signed_at must be an ISO-compatible date string.`);
    process.exit(2);
  }
  validateSignedBy(receipt.signed_by, `${context} signedConsentEvidence receipt signed_by`);
  const signatureFindings = validateEd25519SignatureEvidence({
    signedObject: receipt,
    payload: canonicalSignedConsentReceiptPayload(receipt),
    context: `${context} signedConsentEvidence receipt`,
  });
  if (signatureFindings.length > 0) {
    console.error(signatureFindings.join("\n"));
    process.exit(2);
  }
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function signerBucket(signerAlias) {
  const digest = crypto.createHash("sha256").update(signerAlias).digest();
  return digest[0] % 5;
}

function splitForSigner(signerAlias) {
  const bucket = signerBucket(signerAlias);
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function assertVocabularyLabels(labels) {
  if (labels.length < MIN_LABELS || labels.length > MAX_LABELS) {
    console.error(
      `Vocabulary must contain ${MIN_LABELS}-${MAX_LABELS} labels; found ${labels.length}.`,
    );
    process.exit(2);
  }
  const seen = new Set();
  for (const label of labels) {
    if (seen.has(label.label_id)) {
      console.error(`Duplicate vocabulary label id: ${label.label_id}`);
      process.exit(2);
    }
    seen.add(label.label_id);
  }
}

function loadSourceRegister() {
  if (!fs.existsSync(sourceRegisterPath)) {
    console.error(`Source register does not exist: ${sourceRegisterPath}`);
    process.exit(2);
  }
  const register = readJson(sourceRegisterPath);
  if (register.schema_version !== "asl-pilot-dataset-source-register/v1") {
    console.error("Source register schema_version is invalid.");
    process.exit(2);
  }
  const sources = Array.isArray(register.sources) ? register.sources : [];
  const seenSourceIds = new Set();
  const seenDecisionIds = new Set();
  for (const candidate of sources) {
    if (!candidate || typeof candidate !== "object") continue;
    if (seenSourceIds.has(candidate.source_id)) {
      console.error(`Duplicate source register source_id: ${candidate.source_id}`);
      process.exit(2);
    }
    seenSourceIds.add(candidate.source_id);
    if (seenDecisionIds.has(candidate.decision_id)) {
      console.error(`Duplicate source register decision_id: ${candidate.decision_id}`);
      process.exit(2);
    }
    seenDecisionIds.add(candidate.decision_id);
  }
  const source = sources.find((candidate) => candidate.source_id === FIRST_PARTY_SOURCE_ID);
  if (
    !source ||
    source.source_kind !== "first_party_collection" ||
    source.allowed_for_model_training !== true ||
    source.allowed_for_validation !== true
  ) {
    console.error(`${FIRST_PARTY_SOURCE_ID} must be allowed for model training and validation in the source register.`);
    process.exit(2);
  }
  return {
    path: projectRelative(sourceRegisterPath),
    sha256: sha256File(sourceRegisterPath),
    firstPartyDecision: source,
  };
}

function loadVocabularyReviewEvidence(labels) {
  const reviewGate = vocabularyReviewGate();
  if (!isVocabularyGateStatus(reviewGate.status)) {
    console.error(
      `Vocabulary evidence gate must pass before manifest export: ${reviewGate.blockers.join("; ")}`,
    );
    process.exit(2);
  }
  const labelIds = labels.map((label) => label.label_id);
  if (reviewGate.vocabulary_source.item_count !== labelIds.length) {
    console.error("Vocabulary evidence item_count does not match exported labels.");
    process.exit(2);
  }
  if (!reviewGate.evidence.sha256) {
    console.error("Vocabulary evidence hash is missing.");
    process.exit(2);
  }
  return {
    status: reviewGate.status,
    evidence: {
      path: reviewGate.evidence.path,
      sha256: reviewGate.evidence.sha256,
    },
    vocabulary_source: {
      path: reviewGate.vocabulary_source.path,
      sha256: reviewGate.vocabulary_source.sha256,
      item_count: reviewGate.vocabulary_source.item_count,
    },
  };
}

function consentFormReference() {
  return {
    path: projectRelative(consentFormPath),
    sha256: CONSENT_FORM_SHA256,
    consent_version: CONSENT_VERSION,
  };
}

function loadCollectionPlanReference() {
  if (!fs.existsSync(defaultCollectionPlanPath)) {
    console.error(`Collection plan does not exist: ${projectRelative(defaultCollectionPlanPath)}`);
    process.exit(2);
  }
  const plan = readJson(defaultCollectionPlanPath);
  if (plan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    console.error("Collection plan schema_version is invalid.");
    process.exit(2);
  }
  if (!isVocabularyGateStatus(plan.review_gate?.status)) {
    console.error("Collection plan review_gate.status must be reviewed or source_curated before manifest export.");
    process.exit(2);
  }
  if (Array.isArray(plan.warnings) && plan.warnings.length > 0) {
    console.error(`Collection plan warnings must be resolved before manifest export: ${plan.warnings.join("; ")}`);
    process.exit(2);
  }
  const freshnessFindings = validateCollectionPlanReviewGateFresh(plan);
  if (freshnessFindings.length > 0) {
    console.error(freshnessFindings.join("\n"));
    process.exit(2);
  }
  return {
    path: projectRelative(defaultCollectionPlanPath),
    sha256: sha256File(defaultCollectionPlanPath),
    generated_at: plan.generated_at,
    review_gate_status: plan.review_gate.status,
    assignment_count: plan.assignment_count,
    negative_challenge_assignment_count: plan.negative_challenge_assignment_count,
  };
}

function assertPlanAssignmentIsExportable(clip, collectionPlan, context, kind = "vocabulary") {
  const findings = validatePlanAssignmentProvenance(clip, { context, kind });
  if (clip.collectionPlanSha256 !== collectionPlan.sha256) {
    findings.push(`${context} collectionPlanSha256 must match the manifest collection_plan.sha256`);
  }
  if (findings.length > 0) {
    console.error(findings.join("\n"));
    process.exit(2);
  }
}

function collectionPlanAssignmentFor(clip) {
  return {
    assignment_key: clip.planAssignmentKey,
    collection_plan_sha256: clip.collectionPlanSha256,
    assignment: clip.planAssignmentSnapshot,
  };
}

function captureConditionFor(clip) {
  return clip.captureConditionEvidence;
}

function assertUniqueApprovedAssignmentKeys(clips, context) {
  const byKey = new Map();
  for (const clip of clips) {
    const key = clip.planAssignmentKey;
    const clipIds = byKey.get(key) ?? [];
    clipIds.push(clip.id);
    byKey.set(key, clipIds);
  }
  for (const [key, clipIds] of byKey.entries()) {
    if (clipIds.length > 1) {
      console.error(`${context} has more than one approved clip for collection plan assignment ${key}: ${clipIds.join(", ")}`);
      process.exit(2);
    }
  }
}

function assertSharedMediaIsExportable(clip, consentById, signerByAlias, collectionPlan, context, kind = "vocabulary") {
  assertPlanAssignmentIsExportable(clip, collectionPlan, context, kind);
  const captureConditionFindings = validateCaptureConditionEvidence(clip, { context, kind });
  if (captureConditionFindings.length > 0) {
    console.error(captureConditionFindings.join("\n"));
    process.exit(2);
  }
  const consent = consentById.get(clip.consentRecordId);
  if (!consent) {
    console.error(`${context} has no consent record: ${clip.consentRecordId}`);
    process.exit(2);
  }
  for (const field of REQUIRED_CONSENT_FIELDS) {
    if (consent[field] !== true) {
      console.error(`${context} consent field is not true: ${field}`);
      process.exit(2);
    }
  }
  for (const field of REQUIRED_CONSENT_TEXT_FIELDS) {
    if (typeof consent[field] !== "string" || consent[field].trim().length === 0) {
      console.error(`${context} consent metadata field is missing: ${field}`);
      process.exit(2);
    }
  }
  if (typeof consent.allowRawClipRedistribution !== "boolean") {
    console.error(`${context} consent must record allowRawClipRedistribution as a boolean.`);
    process.exit(2);
  }
  if (Number.isNaN(Date.parse(consent.signedAt ?? ""))) {
    console.error(`${context} consent signedAt must be an ISO-compatible date string.`);
    process.exit(2);
  }
  if (consent.signerAlias !== clip.signerAlias || consent.userId !== clip.userId) {
    console.error(`${context} consent record does not match signer/user metadata.`);
    process.exit(2);
  }
  if (consent.consentVersion !== CONSENT_VERSION) {
    console.error(`${context} consentVersion must be ${CONSENT_VERSION}.`);
    process.exit(2);
  }
  if (consent.consentFormSha256 !== CONSENT_FORM_SHA256) {
    console.error(`${context} consentFormSha256 must match docs/privacy/dataset-consent-form.md.`);
    process.exit(2);
  }
  const signer = signerByAlias.get(clip.signerAlias);
  if (!signer) {
    console.error(`${context} has no signer registry record for ${clip.signerAlias}.`);
    process.exit(2);
  }
  const expectedSplit = splitForSigner(clip.signerAlias);
  if (signer.split !== expectedSplit) {
    console.error(`${context} signer registry split ${signer.split} does not match ${expectedSplit}.`);
    process.exit(2);
  }
  if (signer.identityAttestation !== "signed_identity_verified") {
    console.error(`${context} signer registry identityAttestation must be signed_identity_verified for final export.`);
    process.exit(2);
  }
  if (!isSha256(signer.signerIdentityHash)) {
    console.error(`${context} signer registry signerIdentityHash must be a lowercase SHA-256 digest.`);
    process.exit(2);
  }
  if (!isSha256(consent.signerIdentityHash)) {
    console.error(`${context} consent signerIdentityHash must be a lowercase SHA-256 digest.`);
    process.exit(2);
  }
  if (consent.signerIdentityHash !== signer.signerIdentityHash) {
    console.error(`${context} consent signerIdentityHash must match signer registry.`);
    process.exit(2);
  }
  const expectedSignedConsent = {
    signerAlias: clip.signerAlias,
    signerIdentityHash: signer.signerIdentityHash,
    consentRecordId: clip.consentRecordId,
  };
  validateSignedConsentEvidence(signer.signedConsentEvidence, `${context} signer registry`, expectedSignedConsent);
  validateSignedConsentEvidence(consent.signedConsentEvidence, `${context} consent record`, expectedSignedConsent);
  if (signer.consentVersion !== CONSENT_VERSION) {
    console.error(`${context} signer registry consentVersion must be ${CONSENT_VERSION}.`);
    process.exit(2);
  }
  if (signer.consentFormSha256 !== CONSENT_FORM_SHA256) {
    console.error(`${context} signer registry consentFormSha256 must match docs/privacy/dataset-consent-form.md.`);
    process.exit(2);
  }
  const mimeType = String(clip.mimeType ?? "").toLowerCase();
  if (mimeType !== "video/webm" && !mimeType.startsWith("video/webm;")) {
    console.error(`${context} is not browser-recorded WebM video: ${clip.mimeType}`);
    process.exit(2);
  }
  if (
    !Number.isFinite(Number(clip.durationMs)) ||
    Number(clip.durationMs) < MIN_DATASET_CLIP_DURATION_MS ||
    Number(clip.durationMs) > MAX_DATASET_CLIP_DURATION_MS
  ) {
    console.error(`${context} duration must be between 0.5 and 10 seconds.`);
    process.exit(2);
  }
  if (!Number.isFinite(Number(clip.sizeBytes)) || Number(clip.sizeBytes) < MIN_DATASET_CLIP_BYTES) {
    console.error(`${context} sizeBytes must be at least ${MIN_DATASET_CLIP_BYTES}.`);
    process.exit(2);
  }
  const settings = clip.mediaStreamTrackSettings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    console.error(`${context} mediaStreamTrackSettings must be a sanitized object.`);
    process.exit(2);
  }
  for (const key of Object.keys(settings)) {
    if (!ALLOWED_CAMERA_SETTINGS.has(key)) {
      console.error(`${context} mediaStreamTrackSettings contains disallowed key: ${key}`);
      process.exit(2);
    }
  }
  const videoPath = path.resolve(root, "data", clip.relativeVideoPath);
  if (!videoPath.startsWith(path.resolve(root, "data") + path.sep)) {
    console.error(`${context} video path escapes data root: ${clip.relativeVideoPath}`);
    process.exit(2);
  }
  if (!fs.existsSync(videoPath)) {
    console.error(`${context} video file is missing: ${videoPath}`);
    process.exit(2);
  }
  const actualSize = fs.statSync(videoPath).size;
  if (actualSize !== Number(clip.sizeBytes)) {
    console.error(`${context} sizeBytes mismatch; expected ${clip.sizeBytes}, got ${actualSize}`);
    process.exit(2);
  }
  const actualHash = sha256File(videoPath);
  if (actualHash !== clip.sha256) {
    console.error(`${context} video hash mismatch; expected ${clip.sha256}, got ${actualHash}`);
    process.exit(2);
  }
}

function assertClipIsExportable(clip, consentById, signerByAlias, collectionPlan) {
  if (clip.labelReviewStatus !== "approved") {
    console.error(`Clip ${clip.id} labelReviewStatus must be approved before manifest export.`);
    process.exit(2);
  }
  if (typeof clip.labelReviewer !== "string" || clip.labelReviewer.trim().length === 0) {
    console.error(`Clip ${clip.id} labelReviewer must identify the clip QA reviewer.`);
    process.exit(2);
  }
  if (typeof clip.labelReviewedAt !== "string" || Number.isNaN(Date.parse(clip.labelReviewedAt))) {
    console.error(`Clip ${clip.id} labelReviewedAt must be an ISO-compatible date string.`);
    process.exit(2);
  }
  assertSharedMediaIsExportable(clip, consentById, signerByAlias, collectionPlan, `Clip ${clip.id}`);
}

function assertChallengeClipIsExportable(clip, consentById, signerByAlias, collectionPlan) {
  if (!REQUIRED_NEGATIVE_CHALLENGE_TYPES.includes(clip.challengeType)) {
    console.error(`Challenge clip ${clip.id} has unknown challengeType: ${clip.challengeType}`);
    process.exit(2);
  }
  if (clip.challengeReviewStatus !== "approved") {
    console.error(`Challenge clip ${clip.id} challengeReviewStatus must be approved before manifest export.`);
    process.exit(2);
  }
  if (typeof clip.challengeReviewer !== "string" || clip.challengeReviewer.trim().length === 0) {
    console.error(`Challenge clip ${clip.id} challengeReviewer must identify the reviewer.`);
    process.exit(2);
  }
  if (typeof clip.challengeReviewedAt !== "string" || Number.isNaN(Date.parse(clip.challengeReviewedAt))) {
    console.error(`Challenge clip ${clip.id} challengeReviewedAt must be an ISO-compatible date string.`);
    process.exit(2);
  }
  assertSharedMediaIsExportable(
    clip,
    consentById,
    signerByAlias,
    collectionPlan,
    `Challenge clip ${clip.id}`,
    "negative_challenge",
  );
}

function signerIdentityFor(clip) {
  const signer = signerByAlias.get(clip.signerAlias);
  return signer?.signerIdentityHash ?? clip.signerAlias;
}

function assertSignerDisjoint(trainClips, validationClips) {
  const trainSigners = new Set(trainClips.map((clip) => signerIdentityFor(clip)));
  const validationSigners = new Set(validationClips.map((clip) => signerIdentityFor(clip)));
  const overlap = [...trainSigners].filter((signer) => validationSigners.has(signer));
  if (overlap.length > 0) {
    console.error(`Signer-disjoint split violation: ${overlap.join(", ")}`);
    process.exit(2);
  }
}

function assertSignerCoverage(split, clips) {
  const signers = new Set(clips.map((clip) => signerIdentityFor(clip)).filter(Boolean));
  const target = TARGET_SIGNERS_BY_SPLIT[split];
  if (signers.size < target) {
    console.error(`${split} split needs at least ${target} signer(s); found ${signers.size}.`);
    process.exit(2);
  }
}

function assertLabelCoverage(split, clips, labels) {
  const counts = new Map(labels.map((label) => [label.label_id, 0]));
  for (const clip of clips) {
    if (!counts.has(clip.vocabularyId)) {
      console.error(`Clip ${clip.id} references unknown vocabulary label: ${clip.vocabularyId}`);
      process.exit(2);
    }
    counts.set(clip.vocabularyId, counts.get(clip.vocabularyId) + 1);
  }
  const missing = [...counts.entries()]
    .filter(([, count]) => count < MIN_CLIPS_PER_LABEL_PER_SPLIT)
    .map(([labelId]) => labelId);
  if (missing.length > 0) {
    console.error(
      `${split} split lacks at least ${MIN_CLIPS_PER_LABEL_PER_SPLIT} approved clips per label: ${missing.join(", ")}`,
    );
    process.exit(2);
  }
}

function assertChallengeCoverage(challengeClips) {
  const counts = new Map(REQUIRED_NEGATIVE_CHALLENGE_TYPES.map((challengeType) => [challengeType, 0]));
  for (const clip of challengeClips) {
    counts.set(clip.challengeType, (counts.get(clip.challengeType) ?? 0) + 1);
  }
  const underfilled = [...counts.entries()]
    .filter(([, count]) => count < MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE)
    .map(([challengeType]) => challengeType);
  if (underfilled.length > 0) {
    console.error(
      `Negative challenge set needs at least ${MIN_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE} clip(s) for each type; underfilled: ${underfilled.join(", ")}`,
    );
    process.exit(2);
  }
}

function manifestFor(split, clips, labels, sourceRegister, vocabularyReview, collectionPlan) {
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-first-party-local-v0",
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party collection",
    source_register: {
      path: sourceRegister.path,
      sha256: sourceRegister.sha256,
    },
    consent_form: consentFormReference(),
    vocabulary_review: vocabularyReview,
    collection_plan: collectionPlan,
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    labels,
    clips: clips.map((clip) => ({
      clip_id: clip.id,
      source_id: FIRST_PARTY_SOURCE_ID,
      source_license_decision: sourceRegister.firstPartyDecision.decision_id,
      source_license_review_status: sourceRegister.firstPartyDecision.license_review_status,
      consent_record_id: clip.consentRecordId,
      signer_id: clip.signerAlias,
      signer_identity_hash: signerByAlias.get(clip.signerAlias)?.signerIdentityHash,
      signed_consent_evidence: signerByAlias.get(clip.signerAlias)?.signedConsentEvidence,
      collection_plan_assignment: collectionPlanAssignmentFor(clip),
      label_id: clip.vocabularyId,
      relative_video_path: `../${clip.relativeVideoPath}`,
      sha256: clip.sha256,
      split,
      frame_source: "raw_rgb_video",
      allowed_for_model_training: true,
      derived_features: [],
      capture: {
        browser: "browser-camera",
        device: "local computer camera",
        lighting_notes: "operator-reviewed controlled pilot capture",
        framing_notes: "upper torso and hands should be visible",
        capture_condition_evidence: captureConditionFor(clip),
        media_stream_track_settings: clip.mediaStreamTrackSettings ?? {},
      },
      review: {
        label_reviewer: clip.labelReviewer ?? "needs-review",
        label_review_status: clip.labelReviewStatus ?? "needs_qa",
        reviewed_at: clip.labelReviewedAt ?? null,
      },
    })),
  };
}

function negativeChallengeManifestFor(challengeClips, sourceRegister, vocabularyReview, collectionPlan) {
  return {
    schema_version: "asl-pilot-negative-challenge-manifest/v1",
    dataset_id: "asl-pilot-negative-challenge-local-v0",
    split: "negative_challenge",
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party collection",
    source_register: {
      path: sourceRegister.path,
      sha256: sourceRegister.sha256,
    },
    consent_form: consentFormReference(),
    vocabulary_review: vocabularyReview,
    collection_plan: collectionPlan,
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    clips: challengeClips.map((clip) => ({
      clip_id: clip.id,
      source_id: FIRST_PARTY_SOURCE_ID,
      source_license_decision: sourceRegister.firstPartyDecision.decision_id,
      source_license_review_status: sourceRegister.firstPartyDecision.license_review_status,
      consent_record_id: clip.consentRecordId,
      signer_id: clip.signerAlias,
      signer_identity_hash: signerByAlias.get(clip.signerAlias)?.signerIdentityHash,
      signed_consent_evidence: signerByAlias.get(clip.signerAlias)?.signedConsentEvidence,
      collection_plan_assignment: collectionPlanAssignmentFor(clip),
      relative_video_path: `../${clip.relativeVideoPath}`,
      sha256: clip.sha256,
      split: "negative_challenge",
      frame_source: "raw_rgb_video",
      allowed_for_validation: true,
      expected_outcome: "reject",
      challenge_type: clip.challengeType,
      derived_features: [],
      capture: {
        browser: "browser-camera",
        device: "local computer camera",
        lighting_notes: "operator-reviewed negative challenge capture",
        framing_notes: "operator-reviewed challenge condition",
        capture_condition_evidence: captureConditionFor(clip),
        media_stream_track_settings: clip.mediaStreamTrackSettings ?? {},
      },
      review: {
        reviewer: clip.challengeReviewer ?? "needs-review",
        challenge_review_status: clip.challengeReviewStatus ?? "needs_review",
        reviewed_at: clip.challengeReviewedAt ?? null,
      },
    })),
  };
}

if (!fs.existsSync(storePath)) {
  console.error(`Store does not exist: ${storePath}`);
  process.exit(2);
}

assertReviewAuditsPass();

const store = readJson(storePath);
const clips = Array.isArray(store.datasetClips) ? store.datasetClips : [];
const challengeClips = Array.isArray(store.datasetChallengeClips) ? store.datasetChallengeClips : [];
if (clips.length === 0) {
  console.error("No dataset clips found. Capture explicit-consent clips first.");
  process.exit(2);
}
if (challengeClips.length === 0) {
  console.error("No negative challenge clips found. Capture explicit-consent challenge clips first.");
  process.exit(2);
}
const unresolvedClips = clips.filter((clip) => (
  clip.labelReviewStatus !== "approved" && clip.labelReviewStatus !== "rejected"
));
const unresolvedChallengeClips = challengeClips.filter((clip) => (
  clip.challengeReviewStatus !== "approved" && clip.challengeReviewStatus !== "rejected"
));
if (unresolvedClips.length > 0) {
  console.error(`${unresolvedClips.length} dataset clip(s) still need ASL label review or rejection before manifest export.`);
  process.exit(2);
}
if (unresolvedChallengeClips.length > 0) {
  console.error(`${unresolvedChallengeClips.length} negative challenge clip(s) still need review or rejection before manifest export.`);
  process.exit(2);
}
const approvedClips = clips.filter((clip) => clip.labelReviewStatus === "approved");
const rejectedClips = clips.filter((clip) => clip.labelReviewStatus === "rejected");
const approvedChallengeClips = challengeClips.filter((clip) => clip.challengeReviewStatus === "approved");
const rejectedChallengeClips = challengeClips.filter((clip) => clip.challengeReviewStatus === "rejected");
if (approvedClips.length === 0) {
  console.error("No approved dataset clips found. Recapture or approve clips before manifest export.");
  process.exit(2);
}
if (approvedChallengeClips.length === 0) {
  console.error("No approved negative challenge clips found. Recapture or approve challenge clips before manifest export.");
  process.exit(2);
}

const labels = readVocabularyLabels();
assertVocabularyLabels(labels);
const vocabularyReview = loadVocabularyReviewEvidence(labels);
const sourceRegister = loadSourceRegister();
const collectionPlan = loadCollectionPlanReference();
const consentRecords = Array.isArray(store.consentRecords) ? store.consentRecords : [];
const consentById = new Map(consentRecords.map((record) => [record.id, record]));
const signerRecords = Array.isArray(store.datasetSigners) ? store.datasetSigners : [];
const signerByAlias = new Map(signerRecords.map((record) => [record.signerAlias, record]));
const identityHashToAliases = new Map();
for (const signer of signerRecords) {
  if (signer?.identityAttestation !== "signed_identity_verified" || !isSha256(signer.signerIdentityHash)) continue;
  const aliases = identityHashToAliases.get(signer.signerIdentityHash) ?? [];
  aliases.push(signer.signerAlias);
  identityHashToAliases.set(signer.signerIdentityHash, aliases);
}
for (const [identityHash, aliases] of identityHashToAliases.entries()) {
  const uniqueAliases = [...new Set(aliases)];
  if (uniqueAliases.length > 1) {
    console.error(`Signer identity hash ${identityHash} appears under multiple aliases: ${uniqueAliases.join(", ")}`);
    process.exit(2);
  }
}
for (const clip of approvedClips) assertClipIsExportable(clip, consentById, signerByAlias, collectionPlan);
for (const clip of approvedChallengeClips) {
  assertChallengeClipIsExportable(clip, consentById, signerByAlias, collectionPlan);
}
assertUniqueApprovedAssignmentKeys(approvedClips, "Vocabulary manifest export");
assertUniqueApprovedAssignmentKeys(approvedChallengeClips, "Negative challenge manifest export");

const trainClips = approvedClips.filter((clip) => signerBucket(clip.signerAlias) > 1);
const validationClips = approvedClips.filter((clip) => signerBucket(clip.signerAlias) === 0);
const testClips = approvedClips.filter((clip) => signerBucket(clip.signerAlias) === 1);

if (trainClips.length === 0 || validationClips.length === 0 || testClips.length === 0) {
  console.error(
    "Need at least one training, validation, and test clip across signer-disjoint splits. Add more signers.",
  );
  process.exit(2);
}
const allSigners = new Set(approvedClips.map((clip) => signerIdentityFor(clip)).filter(Boolean));
const challengeSigners = new Set(approvedChallengeClips.map((clip) => signerIdentityFor(clip)).filter(Boolean));
const challengeOverlap = [...challengeSigners].filter((signer) => allSigners.has(signer));
if (challengeOverlap.length > 0) {
  console.error(`Negative challenge signers must be disjoint from train/validation/test signers: ${challengeOverlap.join(", ")}`);
  process.exit(2);
}
if (allSigners.size < TARGET_SIGNERS) {
  console.error(`Production pilot target is ${TARGET_SIGNERS} signers; found ${allSigners.size}.`);
  process.exit(2);
}
assertSignerDisjoint(trainClips, validationClips);
assertSignerDisjoint(trainClips, testClips);
assertSignerDisjoint(validationClips, testClips);
assertSignerCoverage("train", trainClips);
assertSignerCoverage("validation", validationClips);
assertSignerCoverage("test", testClips);
assertLabelCoverage("train", trainClips, labels);
assertLabelCoverage("validation", validationClips, labels);
assertLabelCoverage("test", testClips, labels);
assertChallengeCoverage(approvedChallengeClips);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
	  path.join(outputDir, "train.json"),
	  `${JSON.stringify(manifestFor("train", trainClips, labels, sourceRegister, vocabularyReview, collectionPlan), null, 2)}\n`,
	);
fs.writeFileSync(
	  path.join(outputDir, "validation.json"),
	  `${JSON.stringify(manifestFor("validation", validationClips, labels, sourceRegister, vocabularyReview, collectionPlan), null, 2)}\n`,
	);
fs.writeFileSync(
	  path.join(outputDir, "test.json"),
	  `${JSON.stringify(manifestFor("test", testClips, labels, sourceRegister, vocabularyReview, collectionPlan), null, 2)}\n`,
	);
fs.writeFileSync(
	  path.join(outputDir, "negative-challenge.json"),
	  `${JSON.stringify(negativeChallengeManifestFor(approvedChallengeClips, sourceRegister, vocabularyReview, collectionPlan), null, 2)}\n`,
	);

console.log(
  `Exported manifests: ${trainClips.length} training clips, ${validationClips.length} validation clips, ${testClips.length} test clips, ${approvedChallengeClips.length} negative challenge clips. Excluded rejected clips: ${rejectedClips.length} vocabulary, ${rejectedChallengeClips.length} negative challenge.`,
);
