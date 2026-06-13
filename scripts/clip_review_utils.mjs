import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  stableJson,
  validateEd25519SignatureEvidence,
} from "./signed_receipt_utils.mjs";
import {
  validateVocabularyReviewerAuthorityFile,
} from "./vocabulary_review_utils.mjs";

export const root = path.resolve(import.meta.dirname, "..");
export const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
export const defaultClipReviewPacketPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-clip-review.json",
);
export const defaultClipReviewEvidencePath = path.join(
  root,
  "docs",
  "review",
  "final-clip-review.json",
);
export const defaultClipReviewReceiptPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-clip-reviewer-receipt.json",
);
export const defaultClipReviewerAuthorityPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-clip-reviewer-authority.json",
);
export const defaultChallengeReviewPacketPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-negative-challenge-review.json",
);
export const defaultChallengeReviewEvidencePath = path.join(
  root,
  "docs",
  "review",
  "final-negative-challenge-review.json",
);
export const defaultChallengeReviewReceiptPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-negative-challenge-reviewer-receipt.json",
);
export const defaultChallengeReviewerAuthorityPath = path.join(
  root,
  "data",
  "clip-review",
  "asl-pilot-negative-challenge-reviewer-authority.json",
);
export const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
export const captureConditionSchemaVersion = "asl-pilot-capture-conditions/v1";
export const postCollectionExternalReviewStatus = "reviewed";
export const postCollectionOperatorQaStatus = "qa_completed";
export const sourceCuratedOperatorQaEvidenceMode = "source_curated_operator_qa";
export const postCollectionFinalStatuses = new Set([
  postCollectionExternalReviewStatus,
  postCollectionOperatorQaStatus,
]);
export const challengeConditionFields = {
  empty_camera: "emptyCameraConfirmed",
  no_hands_visible: "noHandsVisibleConfirmed",
  low_light: "lowLightConfirmed",
  off_center: "offCenterConfirmed",
};
export const extendedHardNegativeTypes = [
  "idle_hands",
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

export function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readStore(storePath) {
  if (!fs.existsSync(storePath)) {
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
  const data = readJson(storePath);
  return {
    users: Array.isArray(data.users) ? data.users : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    attempts: Array.isArray(data.attempts) ? data.attempts : [],
    datasetSigners: Array.isArray(data.datasetSigners) ? data.datasetSigners : [],
    consentRecords: Array.isArray(data.consentRecords) ? data.consentRecords : [],
    datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
    datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
  };
}

export function validateReviewer(reviewer, options = {}) {
  const findings = [];
  if (!reviewer || typeof reviewer !== "object" || Array.isArray(reviewer)) {
    return ["reviewer must be an object"];
  }
  for (const key of ["name", "role", "reviewed_at", "qualification", "affiliation_or_context", "contact_or_signed_evidence"]) {
    const value = reviewer[key];
    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value)
    ) {
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
  if (
    typeof reviewer.reviewed_at === "string" &&
    Number.isNaN(Date.parse(reviewer.reviewed_at))
  ) {
    findings.push("reviewer.reviewed_at must be an ISO-compatible date string");
  }
  return findings;
}

export function isPostCollectionFinalStatus(status) {
  return postCollectionFinalStatuses.has(status);
}

export function postCollectionReviewRequiresExternalReceipt(packet) {
  return packet?.status === postCollectionExternalReviewStatus;
}

export function validateSourceCuratedOperatorQaDisclosure(value, context) {
  const findings = [];
  if (value?.evidence_mode !== sourceCuratedOperatorQaEvidenceMode) {
    findings.push(`${context}.evidence_mode must be ${sourceCuratedOperatorQaEvidenceMode}`);
  }
  if (!value?.external_review || typeof value.external_review !== "object" || Array.isArray(value.external_review)) {
    findings.push(`${context}.external_review must disclose that no external review is claimed`);
    return findings;
  }
  if (value.external_review.claimed !== false) {
    findings.push(`${context}.external_review.claimed must be false for source-curated/operator QA evidence`);
  }
  const claim = String(value.external_review.claim ?? "");
  if (!/no external/i.test(claim)) {
    findings.push(`${context}.external_review.claim must state that no external review is claimed`);
  }
  return findings;
}

export function validatePostCollectionReviewerForPacket(packet, options = {}) {
  const findings = validateReviewer(packet?.reviewer, {
    requireAslQualification: postCollectionReviewRequiresExternalReceipt(packet) && options.requireAslQualificationForExternal === true,
    requireIndependentReviewer: postCollectionReviewRequiresExternalReceipt(packet),
  });
  if (typeof packet?.reviewer?.is_project_operator !== "boolean") {
    findings.push("reviewer.is_project_operator must be boolean");
  }
  return findings;
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

export function postCollectionReviewKindConfig(kind) {
  if (kind === "clip") {
    return {
      kind,
      reviewType: "clip_label_review",
      packetSchemaVersion: "asl-pilot-clip-review/v1",
      receiptSchemaVersion: "asl-pilot-clip-reviewer-receipt/v1",
      packetPath: defaultClipReviewPacketPath,
      receiptPath: defaultClipReviewReceiptPath,
      authorityPath: defaultClipReviewerAuthorityPath,
      requireAslQualification: true,
    };
  }
  if (kind === "challenge") {
    return {
      kind,
      reviewType: "negative_challenge_review",
      packetSchemaVersion: "asl-pilot-negative-challenge-review/v1",
      receiptSchemaVersion: "asl-pilot-negative-challenge-reviewer-receipt/v1",
      packetPath: defaultChallengeReviewPacketPath,
      receiptPath: defaultChallengeReviewReceiptPath,
      authorityPath: defaultChallengeReviewerAuthorityPath,
      requireAslQualification: true,
    };
  }
  throw new Error(`Unknown post-collection review kind: ${kind}`);
}

function reviewerForReceipt(reviewer) {
  return {
    name: reviewer?.name,
    role: reviewer?.role,
    qualification: reviewer?.qualification,
    affiliation_or_context: reviewer?.affiliation_or_context,
    contact_or_signed_evidence: reviewer?.contact_or_signed_evidence,
    is_project_operator: reviewer?.is_project_operator,
    reviewed_at: reviewer?.reviewed_at,
  };
}

function normalizedReviewNotes(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function postCollectionReceiptClipReviews(packet, kind) {
  const clips = Array.isArray(packet?.clips) ? packet.clips : [];
  return clips.map((item) => {
    const common = {
      clip_id: item.clip_id,
      signer_alias: item.signer_alias,
      relative_video_path: item.relative_video_path,
      video: {
        path: item.video?.path,
        sha256: item.video?.sha256,
      },
      approved: item.approved,
      rejection_reason: item.approved === true
        ? null
        : typeof item.rejection_reason === "string"
          ? item.rejection_reason.trim()
          : "",
      notes: normalizedReviewNotes(item.notes),
    };
    if (kind === "clip") {
      return {
        ...common,
        vocabulary_id: item.vocabulary_id,
        corrected_vocabulary_id: item.corrected_vocabulary_id,
      };
    }
    return {
      ...common,
      challenge_type: item.challenge_type,
      expected_outcome: item.expected_outcome,
    };
  });
}

export function canonicalPostCollectionReviewReceiptPayload(receipt) {
  return stableJson({
    schema_version: receipt.schema_version,
    status: receipt.status,
    review_type: receipt.review_type,
    reviewer: receipt.reviewer,
    signed_at: receipt.signed_at,
    store: receipt.store,
    review_packet: receipt.review_packet,
    clip_reviews: receipt.clip_reviews,
    approved_clip_ids: receipt.approved_clip_ids,
    rejected_clip_ids: receipt.rejected_clip_ids,
  });
}

export function buildPostCollectionReviewReceipt(packet, inputPath, kind) {
  const config = postCollectionReviewKindConfig(kind);
  const clipReviews = postCollectionReceiptClipReviews(packet, kind);
  const receipt = {
    schema_version: config.receiptSchemaVersion,
    status: "signed",
    review_type: config.reviewType,
    reviewer: reviewerForReceipt(packet?.reviewer),
    signed_at: packet?.reviewer?.reviewed_at ?? "",
    store: {
      path: packet?.store?.path,
      sha256: packet?.store?.sha256,
    },
    review_packet: {
      path: projectRelative(inputPath),
      sha256: fs.existsSync(inputPath) ? sha256File(inputPath) : null,
    },
    clip_reviews: clipReviews,
    approved_clip_ids: clipReviews.filter((item) => item.approved === true).map((item) => item.clip_id),
    rejected_clip_ids: clipReviews.filter((item) => item.approved === false).map((item) => item.clip_id),
  };
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: crypto.createHash("sha256").update(canonicalPostCollectionReviewReceiptPayload(receipt)).digest("hex"),
    public_key_pem: "",
    signer_key_fingerprint_sha256: "",
    signature_base64: "",
  };
  return receipt;
}

function validateExpectedReference(actual, expected, context, findings) {
  if (JSON.stringify(actual ?? null) !== JSON.stringify(expected)) {
    findings.push(`${context} must match the returned review packet`);
  }
}

export function validatePostCollectionReviewReceipt(receipt, packet, reviewPacketPath, receiptPath, kind) {
  const findings = [];
  const config = postCollectionReviewKindConfig(kind);
  const context = kind === "clip" ? "Clip reviewer signed receipt" : "Negative challenge reviewer signed receipt";
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return [`${context} must be an object`];
  }
  const allowedTopLevelFields = new Set([
    "schema_version",
    "status",
    "review_type",
    "reviewer",
    "signed_at",
    "store",
    "review_packet",
    "clip_reviews",
    "approved_clip_ids",
    "rejected_clip_ids",
    "signature_evidence",
  ]);
  for (const key of Object.keys(receipt)) {
    if (!allowedTopLevelFields.has(key)) {
      findings.push(`${context} contains unexpected unsigned field: ${key}`);
    }
  }
  if (receipt.schema_version !== config.receiptSchemaVersion) {
    findings.push(`${context} schema_version must be ${config.receiptSchemaVersion}`);
  }
  if (receipt.status !== "signed") {
    findings.push(`${context} status must be signed`);
  }
  if (receipt.review_type !== config.reviewType) {
    findings.push(`${context} review_type must be ${config.reviewType}`);
  }
  if (!isIsoTimestamp(receipt.signed_at)) {
    findings.push(`${context} signed_at must be a full ISO timestamp with timezone`);
  } else if (isFutureTimestamp(receipt.signed_at)) {
    findings.push(`${context} signed_at must not be in the future`);
  }
  if (receipt.signed_at !== packet?.reviewer?.reviewed_at) {
    findings.push(`${context} signed_at must match reviewer.reviewed_at`);
  }

  const expectedReviewer = reviewerForReceipt(packet?.reviewer);
  validateExpectedReference(receipt.reviewer, expectedReviewer, `${context} reviewer`, findings);
  validateExpectedReference(receipt.store, {
    path: packet?.store?.path,
    sha256: packet?.store?.sha256,
  }, `${context} store`, findings);
  validateExpectedReference(receipt.review_packet, {
    path: projectRelative(reviewPacketPath),
    sha256: fs.existsSync(reviewPacketPath) ? sha256File(reviewPacketPath) : null,
  }, `${context} review_packet`, findings);

  const expectedClipReviews = postCollectionReceiptClipReviews(packet, kind);
  validateExpectedReference(receipt.clip_reviews, expectedClipReviews, `${context} clip_reviews`, findings);
  validateExpectedReference(
    receipt.approved_clip_ids,
    expectedClipReviews.filter((item) => item.approved === true).map((item) => item.clip_id),
    `${context} approved_clip_ids`,
    findings,
  );
  validateExpectedReference(
    receipt.rejected_clip_ids,
    expectedClipReviews.filter((item) => item.approved === false).map((item) => item.clip_id),
    `${context} rejected_clip_ids`,
    findings,
  );

  findings.push(...validateEd25519SignatureEvidence({
    signedObject: receipt,
    payload: canonicalPostCollectionReviewReceiptPayload(receipt),
    context,
  }));

  if (!receiptPath.startsWith(`${root}${path.sep}`)) {
    findings.push(`${context} path escapes project root`);
  }
  return findings;
}

export function validatePostCollectionReviewReceiptFile(receiptPath, packet, reviewPacketPath, options = {}) {
  const kind = options.kind ?? "clip";
  const config = postCollectionReviewKindConfig(kind);
  const receiptLabel = kind === "clip" ? "Clip reviewer signed receipt" : "Negative challenge reviewer signed receipt";
  const findings = [];
  if (!fs.existsSync(receiptPath)) {
    return {
      findings: [`${receiptLabel} is missing: ${projectRelative(receiptPath)}`],
      receipt: null,
      authority: null,
    };
  }
  let receipt = null;
  try {
    receipt = readJson(receiptPath);
  } catch (error) {
    return {
      findings: [`${receiptLabel} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`],
      receipt: null,
      authority: null,
    };
  }
  findings.push(...validatePostCollectionReviewReceipt(receipt, packet, reviewPacketPath, receiptPath, kind));
  const authorityPath = options.reviewerAuthorityPath ?? config.authorityPath;
  const authorityResult = validateVocabularyReviewerAuthorityFile(authorityPath, packet, receipt);
  findings.push(...authorityResult.findings.map((finding) => `${receiptLabel}: ${finding}`));
  return {
    findings,
    receipt,
    authority: authorityResult.authority,
  };
}

export function clipVideoPath(clip) {
  return path.resolve(root, "data", clip.relativeVideoPath ?? "");
}

export function clipFileReference(clip) {
  const file = clipVideoPath(clip);
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

export function clipReviewStatus(clip) {
  return clip.labelReviewStatus ?? "needs_qa";
}

export function clipIsReviewApproved(clip) {
  return (
    clipReviewStatus(clip) === "approved" &&
    typeof clip.labelReviewer === "string" &&
    clip.labelReviewer.trim().length > 0 &&
    typeof clip.labelReviewedAt === "string" &&
    !Number.isNaN(Date.parse(clip.labelReviewedAt))
  );
}

export function clipIsReviewRejected(clip) {
  return (
    clipReviewStatus(clip) === "rejected" &&
    typeof clip.labelReviewer === "string" &&
    clip.labelReviewer.trim().length > 0 &&
    typeof clip.labelReviewedAt === "string" &&
    !Number.isNaN(Date.parse(clip.labelReviewedAt)) &&
    typeof clip.labelRejectionReason === "string" &&
    clip.labelRejectionReason.trim().length > 0
  );
}

export function clipIsReviewResolved(clip) {
  return clipIsReviewApproved(clip) || clipIsReviewRejected(clip);
}

export function challengeReviewStatus(clip) {
  return clip.challengeReviewStatus ?? "needs_review";
}

export function challengeIsReviewApproved(clip) {
  return (
    challengeReviewStatus(clip) === "approved" &&
    typeof clip.challengeReviewer === "string" &&
    clip.challengeReviewer.trim().length > 0 &&
    typeof clip.challengeReviewedAt === "string" &&
    !Number.isNaN(Date.parse(clip.challengeReviewedAt))
  );
}

export function challengeIsReviewRejected(clip) {
  return (
    challengeReviewStatus(clip) === "rejected" &&
    typeof clip.challengeReviewer === "string" &&
    clip.challengeReviewer.trim().length > 0 &&
    typeof clip.challengeReviewedAt === "string" &&
    !Number.isNaN(Date.parse(clip.challengeReviewedAt)) &&
    typeof clip.challengeRejectionReason === "string" &&
    clip.challengeRejectionReason.trim().length > 0
  );
}

export function challengeIsReviewResolved(clip) {
  return challengeIsReviewApproved(clip) || challengeIsReviewRejected(clip);
}

export function collectionPlanAssignmentReference(clip) {
  return {
    path: clip.collectionPlanPath ?? projectRelative(defaultCollectionPlanPath),
    sha256: clip.collectionPlanSha256 ?? null,
    assignment_key: clip.planAssignmentKey ?? null,
    assignment: clip.planAssignmentSnapshot ?? null,
  };
}

export function captureConditionReference(clip) {
  return clip.captureConditionEvidence ?? null;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function planAssignmentFromKey(plan, assignmentKey) {
  const [kind, rawIndex] = String(assignmentKey ?? "").split(":");
  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 0) return null;
  if (kind === "vocabulary") {
    const assignment = Array.isArray(plan.assignments) ? plan.assignments[index] : null;
    return assignment && typeof assignment === "object" && !Array.isArray(assignment)
      ? { kind, index, assignment }
      : null;
  }
  if (kind === "negative_challenge") {
    const assignment = Array.isArray(plan.negative_challenge_assignments)
      ? plan.negative_challenge_assignments[index]
      : null;
    return assignment && typeof assignment === "object" && !Array.isArray(assignment)
      ? { kind, index, assignment }
      : null;
  }
  return null;
}

export function expectedPlanAssignmentSnapshot(assignmentKey, assignment) {
  const [kind] = String(assignmentKey ?? "").split(":");
  if (kind === "vocabulary") {
    return {
      assignment_key: assignmentKey,
      split: assignment.split,
      signer_alias: assignment.signer_alias,
      label_id: assignment.label_id,
      display_text: assignment.display_text,
      capture_count_for_label_split: assignment.capture_count_for_label_split,
    };
  }
  if (kind === "negative_challenge") {
    return {
      assignment_key: assignmentKey,
      split: "negative_challenge",
      signer_alias: assignment.signer_alias,
      challenge_type: assignment.challenge_type,
      expected_outcome: "reject",
      capture_count_for_type: assignment.capture_count_for_type,
    };
  }
  return null;
}

export function validatePlanAssignmentProvenance(clip, options = {}) {
  const findings = [];
  const {
    context = `clip ${clip?.id ?? "(missing id)"}`,
    kind = "vocabulary",
    requireCurrentPlan = true,
  } = options;
  const expectedPrefix = kind === "negative_challenge" ? "negative_challenge:" : "vocabulary:";
  if (typeof clip?.planAssignmentKey !== "string" || !clip.planAssignmentKey.startsWith(expectedPrefix)) {
    findings.push(`${context}: planAssignmentKey must start with ${expectedPrefix}`);
  }
  if (clip?.collectionPlanPath !== projectRelative(defaultCollectionPlanPath)) {
    findings.push(`${context}: collectionPlanPath must be ${projectRelative(defaultCollectionPlanPath)}`);
  }
  if (!isSha256(clip?.collectionPlanSha256)) {
    findings.push(`${context}: collectionPlanSha256 must be a lowercase SHA-256 digest`);
  }
  if (!clip?.planAssignmentSnapshot || typeof clip.planAssignmentSnapshot !== "object" || Array.isArray(clip.planAssignmentSnapshot)) {
    findings.push(`${context}: planAssignmentSnapshot must be an object`);
    return findings;
  }
  if (clip.planAssignmentSnapshot.assignment_key !== clip.planAssignmentKey) {
    findings.push(`${context}: planAssignmentSnapshot.assignment_key must match planAssignmentKey`);
  }
  if (kind === "vocabulary") {
    if (clip.planAssignmentSnapshot.signer_alias !== clip.signerAlias) {
      findings.push(`${context}: planAssignmentSnapshot.signer_alias must match signerAlias`);
    }
    if (clip.planAssignmentSnapshot.label_id !== clip.vocabularyId) {
      findings.push(`${context}: planAssignmentSnapshot.label_id must match vocabularyId`);
    }
    if (typeof clip.planAssignmentSnapshot.display_text !== "string" || clip.planAssignmentSnapshot.display_text.trim().length === 0) {
      findings.push(`${context}: planAssignmentSnapshot.display_text must be a non-empty string`);
    }
    if (!Number.isInteger(Number(clip.planAssignmentSnapshot.capture_count_for_label_split))) {
      findings.push(`${context}: planAssignmentSnapshot.capture_count_for_label_split must be an integer`);
    }
  } else {
    if (clip.planAssignmentSnapshot.signer_alias !== clip.signerAlias) {
      findings.push(`${context}: planAssignmentSnapshot.signer_alias must match signerAlias`);
    }
    if (clip.planAssignmentSnapshot.challenge_type !== clip.challengeType) {
      findings.push(`${context}: planAssignmentSnapshot.challenge_type must match challengeType`);
    }
    if (clip.planAssignmentSnapshot.expected_outcome !== "reject") {
      findings.push(`${context}: planAssignmentSnapshot.expected_outcome must be reject`);
    }
    if (!Number.isInteger(Number(clip.planAssignmentSnapshot.capture_count_for_type))) {
      findings.push(`${context}: planAssignmentSnapshot.capture_count_for_type must be an integer`);
    }
  }
  if (!requireCurrentPlan || !fs.existsSync(defaultCollectionPlanPath)) return findings;
  const currentPlanSha256 = sha256File(defaultCollectionPlanPath);
  if (clip.collectionPlanSha256 !== currentPlanSha256) {
    findings.push(`${context}: collectionPlanSha256 must match the current collection plan`);
    return findings;
  }
  const plan = readJson(defaultCollectionPlanPath);
  if (plan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    findings.push(`${context}: current collection plan schema_version is invalid`);
  }
  if (plan.review_gate?.status !== "reviewed") {
    findings.push(`${context}: current collection plan review_gate.status must be reviewed`);
  }
  const planAssignment = planAssignmentFromKey(plan, clip.planAssignmentKey);
  if (!planAssignment) {
    findings.push(`${context}: planAssignmentKey is not present in the current collection plan`);
    return findings;
  }
  if (kind === "vocabulary" && planAssignment.kind !== "vocabulary") {
    findings.push(`${context}: planAssignmentKey must reference a vocabulary assignment`);
    return findings;
  }
  if (kind === "negative_challenge" && planAssignment.kind !== "negative_challenge") {
    findings.push(`${context}: planAssignmentKey must reference a negative challenge assignment`);
    return findings;
  }
  const expectedSnapshot = expectedPlanAssignmentSnapshot(clip.planAssignmentKey, planAssignment.assignment);
  if (!deepEqual(clip.planAssignmentSnapshot, expectedSnapshot)) {
    findings.push(`${context}: planAssignmentSnapshot must match the current collection plan assignment`);
  }
  return findings;
}

export function validateReviewPacketPlanReference(item, clip, context) {
  const findings = [];
  const reference = item.collection_plan;
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context}.collection_plan must be a hash-pinned assignment object`);
    return findings;
  }
  if (reference.path !== clip.collectionPlanPath) {
    findings.push(`${context}.collection_plan.path does not match store`);
  }
  if (reference.sha256 !== clip.collectionPlanSha256 || !isSha256(reference.sha256)) {
    findings.push(`${context}.collection_plan.sha256 does not match store`);
  }
  if (reference.assignment_key !== clip.planAssignmentKey) {
    findings.push(`${context}.collection_plan.assignment_key does not match store`);
  }
  if (!deepEqual(reference.assignment, clip.planAssignmentSnapshot)) {
    findings.push(`${context}.collection_plan.assignment does not match store`);
  }
  return findings;
}

export function validateCaptureConditionEvidence(clip, options = {}) {
  const findings = [];
  const {
    context = `clip ${clip?.id ?? "(missing id)"}`,
    kind = "vocabulary",
  } = options;
  const evidence = clip?.captureConditionEvidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    findings.push(`${context}: captureConditionEvidence must be an object`);
    return findings;
  }
  if (evidence.schemaVersion !== captureConditionSchemaVersion) {
    findings.push(`${context}: captureConditionEvidence.schemaVersion must be ${captureConditionSchemaVersion}`);
  }
  if (evidence.operatorAttestation !== true) {
    findings.push(`${context}: captureConditionEvidence.operatorAttestation must be true`);
  }
  if (typeof evidence.operatorAttestedAt !== "string" || Number.isNaN(Date.parse(evidence.operatorAttestedAt))) {
    findings.push(`${context}: captureConditionEvidence.operatorAttestedAt must be an ISO-compatible date string`);
  }
  const vocabularyBooleans = [
    "frontLightingConfirmed",
    "upperTorsoAndHandsVisibleConfirmed",
    "cameraDistanceWithinPilotRangeConfirmed",
    "isolatedPromptSignConfirmed",
  ];
  const challengeBooleans = [
    "emptyCameraConfirmed",
    "noHandsVisibleConfirmed",
    "lowLightConfirmed",
    "offCenterConfirmed",
  ];
  for (const key of [...vocabularyBooleans, ...challengeBooleans, "expectedRejectOutcomeConfirmed"]) {
    if (typeof evidence[key] !== "boolean") {
      findings.push(`${context}: captureConditionEvidence.${key} must be boolean`);
    }
  }
  if (
    evidence.hardNegativeConditionConfirmed !== undefined &&
    typeof evidence.hardNegativeConditionConfirmed !== "boolean"
  ) {
    findings.push(`${context}: captureConditionEvidence.hardNegativeConditionConfirmed must be boolean when present`);
  }
  if (kind === "vocabulary") {
    if (evidence.captureEnvironment !== "controlled_vocabulary") {
      findings.push(`${context}: captureConditionEvidence.captureEnvironment must be controlled_vocabulary`);
    }
    for (const key of vocabularyBooleans) {
      if (evidence[key] !== true) findings.push(`${context}: captureConditionEvidence.${key} must be true`);
    }
    for (const key of challengeBooleans) {
      if (evidence[key] !== false) findings.push(`${context}: captureConditionEvidence.${key} must be false`);
    }
    if (evidence.hardNegativeConditionConfirmed === true) {
      findings.push(`${context}: captureConditionEvidence.hardNegativeConditionConfirmed must be false`);
    }
    if (evidence.expectedRejectOutcomeConfirmed !== false) {
      findings.push(`${context}: captureConditionEvidence.expectedRejectOutcomeConfirmed must be false`);
    }
    if (evidence.challengeType !== null) {
      findings.push(`${context}: captureConditionEvidence.challengeType must be null`);
    }
    return findings;
  }

  if (evidence.captureEnvironment !== "negative_challenge") {
    findings.push(`${context}: captureConditionEvidence.captureEnvironment must be negative_challenge`);
  }
  if (!Object.prototype.hasOwnProperty.call(challengeConditionFields, clip?.challengeType)) {
    if (!extendedHardNegativeTypes.includes(clip?.challengeType)) {
      findings.push(`${context}: unknown challengeType ${clip?.challengeType}`);
      return findings;
    }
  }
  if (evidence.challengeType !== clip.challengeType) {
    findings.push(`${context}: captureConditionEvidence.challengeType must match challengeType`);
  }
  if (evidence.expectedRejectOutcomeConfirmed !== true) {
    findings.push(`${context}: captureConditionEvidence.expectedRejectOutcomeConfirmed must be true`);
  }
  for (const key of vocabularyBooleans) {
    if (evidence[key] !== false) findings.push(`${context}: captureConditionEvidence.${key} must be false`);
  }
  if (Object.prototype.hasOwnProperty.call(challengeConditionFields, clip?.challengeType)) {
    if (evidence.hardNegativeConditionConfirmed === true) {
      findings.push(`${context}: captureConditionEvidence.hardNegativeConditionConfirmed must be false`);
    }
    for (const [challengeType, field] of Object.entries(challengeConditionFields)) {
      const expected = challengeType === clip.challengeType;
      if (evidence[field] !== expected) {
        findings.push(`${context}: captureConditionEvidence.${field} must be ${expected}`);
      }
    }
  } else {
    if (evidence.hardNegativeConditionConfirmed !== true) {
      findings.push(`${context}: captureConditionEvidence.hardNegativeConditionConfirmed must be true`);
    }
    for (const field of Object.values(challengeConditionFields)) {
      if (evidence[field] !== false) {
        findings.push(`${context}: captureConditionEvidence.${field} must be false`);
      }
    }
  }
  return findings;
}

export function validateReviewPacketCaptureCondition(item, clip, context) {
  const findings = [];
  if (JSON.stringify(item.capture_condition ?? null) !== JSON.stringify(clip.captureConditionEvidence ?? null)) {
    findings.push(`${context}.capture_condition must match store captureConditionEvidence`);
  }
  return findings;
}
