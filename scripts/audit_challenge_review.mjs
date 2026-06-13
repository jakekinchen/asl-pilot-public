import fs from "node:fs";
import {
  challengeIsReviewApproved,
  challengeIsReviewRejected,
  challengeIsReviewResolved,
  clipFileReference,
  defaultChallengeReviewerAuthorityPath,
  defaultChallengeReviewEvidencePath,
  defaultChallengeReviewReceiptPath,
  defaultStorePath,
  isPostCollectionFinalStatus,
  isSha256,
  postCollectionReviewRequiresExternalReceipt,
  projectRelative,
  readJson,
  readStore,
  resolveProjectPath,
  sha256File,
  validateCaptureConditionEvidence,
  validatePlanAssignmentProvenance,
  validateReviewPacketCaptureCondition,
  validateReviewPacketPlanReference,
  validatePostCollectionReviewReceiptFile,
  validatePostCollectionReviewerForPacket,
  validateSourceCuratedOperatorQaDisclosure,
} from "./clip_review_utils.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--store" || item === "--evidence") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_challenge_review.mjs [--store data/asl-pilot-store.json] [--evidence docs/review/final-negative-challenge-review.json]

	Fails until every collected negative challenge clip has resolved review metadata
	(approved or rejected) and final review evidence matches the current local store.
		`);
}

function normalizeReviewNotes(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function validateSourcePacket(packet, evidence, store, storePath, blockers) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    blockers.push("Negative challenge review source packet must be a JSON object");
    return;
  }
  if (packet.schema_version !== "asl-pilot-negative-challenge-review/v1") {
    blockers.push("Negative challenge review source packet schema_version is invalid");
  }
  if (!isPostCollectionFinalStatus(packet.status)) {
    blockers.push("Negative challenge review source packet status must be reviewed or qa_completed");
  }
  blockers.push(...validatePostCollectionReviewerForPacket(packet));
  if (packet.status === "qa_completed") {
    blockers.push(...validateSourceCuratedOperatorQaDisclosure(packet, "Negative challenge review source packet"));
  }
  for (const key of ["name", "role", "reviewed_at", "qualification", "affiliation_or_context", "contact_or_signed_evidence"]) {
    if (packet.reviewer?.[key] !== evidence.reviewer?.[key]) {
      blockers.push(`Negative challenge review source packet reviewer.${key} must match final evidence`);
    }
  }
  if (packet.reviewer?.is_project_operator !== evidence.reviewer?.is_project_operator) {
    blockers.push("Negative challenge review source packet reviewer.is_project_operator must match final evidence");
  }
  if (packet.store?.path !== projectRelative(storePath)) {
    blockers.push(`Negative challenge review source packet store.path must be ${projectRelative(storePath)}`);
  }
  if (!isSha256(packet.store?.sha256)) {
    blockers.push("Negative challenge review source packet store.sha256 must be the exported source-store SHA-256");
  }
  if (!Array.isArray(packet.clips) || packet.clips.length === 0) {
    blockers.push("Negative challenge review source packet clips must be a non-empty array");
    return;
  }
  const byId = new Map(store.datasetChallengeClips.map((clip) => [clip.id, clip]));
  const seen = new Set();
  for (const [index, item] of packet.clips.entries()) {
    const context = `Negative challenge review source packet clips[${index}]`;
    if (typeof item.clip_id !== "string" || item.clip_id.trim().length === 0) {
      blockers.push(`${context}.clip_id must be a non-empty string`);
      continue;
    }
    if (seen.has(item.clip_id)) blockers.push(`${context}.clip_id is duplicated: ${item.clip_id}`);
    seen.add(item.clip_id);
    const clip = byId.get(item.clip_id);
    if (!clip) {
      blockers.push(`${context}.clip_id is not present in current store: ${item.clip_id}`);
      continue;
    }
    if (item.signer_alias !== clip.signerAlias) blockers.push(`${context}.signer_alias does not match current store`);
    if (item.challenge_type !== clip.challengeType) blockers.push(`${context}.challenge_type does not match current store`);
    if (item.expected_outcome !== "reject") blockers.push(`${context}.expected_outcome must be reject`);
    blockers.push(...validatePlanAssignmentProvenance(clip, {
      context: `current store challenge clip ${clip.id}`,
      kind: "negative_challenge",
    }));
    blockers.push(...validateReviewPacketPlanReference(item, clip, context));
    blockers.push(...validateCaptureConditionEvidence(clip, {
      context: `current store challenge clip ${clip.id}`,
      kind: "negative_challenge",
    }));
    blockers.push(...validateReviewPacketCaptureCondition(item, clip, context));
    if (item.relative_video_path !== clip.relativeVideoPath) blockers.push(`${context}.relative_video_path does not match current store`);
    const currentVideo = clipFileReference(clip);
    if (item.video?.exists !== true) {
      blockers.push(`${context}.video.exists must be true`);
    }
    if (!isSha256(item.video?.sha256)) {
      blockers.push(`${context}.video.sha256 must be a lowercase SHA-256 digest`);
    }
    if (!currentVideo.exists) {
      blockers.push(`${context}.video.path is missing from the current data directory`);
    }
    if (item.video?.sha256 !== currentVideo.sha256) {
      blockers.push(`${context}.video.sha256 does not match the current video file`);
    }
    let expectedStatus = null;
    if (item.approved === true) {
      expectedStatus = "approved";
    } else if (item.approved === false) {
      expectedStatus = "rejected";
    } else {
      blockers.push(`${context}.approved must be true or false`);
      continue;
    }
    if (clip.challengeReviewStatus !== expectedStatus) {
      blockers.push(`${context}.approved does not match current store challengeReviewStatus`);
    }
    if (clip.challengeReviewer !== evidence.reviewer?.name) {
      blockers.push(`${context} current challengeReviewer must match final evidence reviewer.name`);
    }
    if (clip.challengeReviewedAt !== evidence.reviewer?.reviewed_at) {
      blockers.push(`${context} current challengeReviewedAt must match final evidence reviewer.reviewed_at`);
    }
    if (expectedStatus === "rejected") {
      const reason = typeof item.rejection_reason === "string" ? item.rejection_reason.trim() : "";
      if (!reason) blockers.push(`${context}.rejection_reason must be non-empty for rejected clips`);
      if (clip.challengeRejectionReason !== reason) {
        blockers.push(`${context} current challengeRejectionReason must match source packet`);
      }
    } else if (clip.challengeRejectionReason !== null) {
      blockers.push(`${context} approved challenge clip challengeRejectionReason must be null`);
    }
    if ((clip.challengeReviewNotes ?? null) !== normalizeReviewNotes(item.notes)) {
      blockers.push(`${context} current challengeReviewNotes must match source packet`);
    }
  }
  if (seen.size !== store.datasetChallengeClips.length) {
    blockers.push(`Negative challenge review source packet covers ${seen.size} clips, but current store contains ${store.datasetChallengeClips.length}`);
  }
}

function validateHashPinnedEvidenceReference(evidence, key, expectedPath, context, blockers) {
  const reference = evidence[key];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be a hash-pinned object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (reference.path !== expectedPath) {
    blockers.push(`${context}.path must be ${expectedPath}`);
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${key}.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context} is missing: ${projectRelative(file)}`);
    return null;
  }
  if (reference.sha256 !== sha256File(file)) {
    blockers.push(`${context}.sha256 does not match the current file`);
    return null;
  }
  return file;
}

function validateReviewerReceiptReference(evidence, packet, sourcePacketPath, blockers) {
  if (!postCollectionReviewRequiresExternalReceipt(packet)) return;
  const receiptPath = validateHashPinnedEvidenceReference(
    evidence,
    "reviewer_signed_receipt",
    projectRelative(defaultChallengeReviewReceiptPath),
    "Negative challenge review evidence reviewer_signed_receipt",
    blockers,
  );
  const authorityPath = validateHashPinnedEvidenceReference(
    evidence,
    "reviewer_authority",
    projectRelative(defaultChallengeReviewerAuthorityPath),
    "Negative challenge review evidence reviewer_authority",
    blockers,
  );
  if (receiptPath && authorityPath) {
    const result = validatePostCollectionReviewReceiptFile(receiptPath, packet, sourcePacketPath, {
      kind: "challenge",
      reviewerAuthorityPath: authorityPath,
    });
    blockers.push(...result.findings);
  }
}

function validateSourcePacketReference(evidence, store, storePath, blockers) {
  const reference = evidence.source_packet;
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push("Negative challenge review evidence source_packet must be a hash-pinned object");
    return;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push("Negative challenge review evidence source_packet.path must be a non-empty string");
    return;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push("Negative challenge review evidence source_packet.sha256 must be a lowercase SHA-256 digest");
  }
  if (reference.path !== "data/clip-review/asl-pilot-negative-challenge-review.json") {
    blockers.push("Negative challenge review evidence source_packet.path must be data/clip-review/asl-pilot-negative-challenge-review.json");
  }
  const sourcePacketPath = resolveProjectPath(reference.path, "source_packet.path");
  if (!fs.existsSync(sourcePacketPath)) {
    blockers.push(`Negative challenge review evidence source packet is missing: ${projectRelative(sourcePacketPath)}`);
    return;
  }
  if (reference.sha256 !== sha256File(sourcePacketPath)) {
    blockers.push("Negative challenge review evidence source_packet.sha256 does not match the current source packet file");
    return;
  }
  const packet = readJson(sourcePacketPath);
  if (packet.status !== evidence.status) {
    blockers.push("Negative challenge review evidence status must match source packet status");
  }
  validateSourcePacket(packet, evidence, store, storePath, blockers);
  validateReviewerReceiptReference(evidence, packet, sourcePacketPath, blockers);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultChallengeReviewEvidencePath;
  const blockers = [];
  const storeExists = fs.existsSync(storePath);
  const store = readStore(storePath);
  const currentStoreSha256 = storeExists ? sha256File(storePath) : null;
  if (!storeExists) blockers.push(`Store does not exist: ${projectRelative(storePath)}`);
  if (store.datasetChallengeClips.length === 0) blockers.push("No negative challenge clips found");
  const unresolved = store.datasetChallengeClips.filter((clip) => !challengeIsReviewResolved(clip));
  const approved = store.datasetChallengeClips.filter((clip) => challengeIsReviewApproved(clip));
  const rejected = store.datasetChallengeClips.filter((clip) => challengeIsReviewRejected(clip));
  if (unresolved.length > 0) {
    blockers.push(`${unresolved.length} negative challenge clip(s) lack resolved review`);
  }
  if (!fs.existsSync(evidencePath)) {
    blockers.push(`Negative challenge review evidence is missing: ${projectRelative(evidencePath)}`);
  } else {
    const evidence = readJson(evidencePath);
    if (evidence.schema_version !== "asl-pilot-negative-challenge-review-evidence/v1") {
      blockers.push("Negative challenge review evidence schema_version is invalid");
    }
    if (!isPostCollectionFinalStatus(evidence.status)) {
      blockers.push("Negative challenge review evidence status must be reviewed or qa_completed");
    }
    blockers.push(...validatePostCollectionReviewerForPacket(evidence));
    if (evidence.status === "qa_completed") {
      blockers.push(...validateSourceCuratedOperatorQaDisclosure(evidence, "Negative challenge review evidence"));
    }
    if (evidence.store?.path !== projectRelative(storePath)) {
      blockers.push(`Negative challenge review evidence store.path must be ${projectRelative(storePath)}`);
    }
    if (!isSha256(evidence.store?.sha256_before)) {
      blockers.push("Negative challenge review evidence store.sha256_before must be a lowercase SHA-256 digest");
    }
    if (!isSha256(evidence.store?.sha256_after)) {
      blockers.push("Negative challenge review evidence store.sha256_after must be a lowercase SHA-256 digest");
    }
    const reviewedIds = Array.isArray(evidence.reviewed_clip_ids) ? evidence.reviewed_clip_ids : [];
    const approvedIds = Array.isArray(evidence.approved_clip_ids) ? evidence.approved_clip_ids : [];
    const rejectedIds = Array.isArray(evidence.rejected_clip_ids) ? evidence.rejected_clip_ids : [];
    const currentReviewedIds = store.datasetChallengeClips.map((clip) => clip.id);
    const currentApprovedIds = approved.map((clip) => clip.id);
    const currentRejectedIds = rejected.map((clip) => clip.id);
    if (reviewedIds.join("\n") !== currentReviewedIds.join("\n")) {
      blockers.push("Negative challenge review evidence reviewed_clip_ids must match current store challenge clip IDs in order");
    }
    if (approvedIds.join("\n") !== currentApprovedIds.join("\n")) {
      blockers.push("Negative challenge review evidence approved_clip_ids must match current approved challenge clip IDs in order");
    }
    if (rejectedIds.join("\n") !== currentRejectedIds.join("\n")) {
      blockers.push("Negative challenge review evidence rejected_clip_ids must match current rejected challenge clip IDs in order");
    }
    validateSourcePacketReference(evidence, store, storePath, blockers);
  }
  const summary = {
    status: blockers.length === 0 ? "reviewed" : "incomplete",
    checked_at: new Date().toISOString(),
    store: {
      path: projectRelative(storePath),
      exists: storeExists,
      sha256: currentStoreSha256,
      clip_count: store.datasetChallengeClips.length,
      approved_clip_count: approved.length,
      rejected_clip_count: rejected.length,
      unresolved_clip_count: unresolved.length,
    },
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
    },
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Negative challenge review audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Negative challenge review audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
