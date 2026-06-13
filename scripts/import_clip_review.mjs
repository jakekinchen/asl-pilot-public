import fs from "node:fs";
import path from "node:path";
import {
  clipFileReference,
  defaultClipReviewerAuthorityPath,
  defaultClipReviewEvidencePath,
  defaultClipReviewReceiptPath,
  defaultStorePath,
  isSha256,
  isPostCollectionFinalStatus,
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
  writeJson,
} from "./clip_review_utils.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (item === "--input" || item === "--store" || item === "--evidence" || item === "--reviewer-receipt" || item === "--reviewer-authority") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/import_clip_review.mjs --input data/clip-review/asl-pilot-clip-review.json [--dry-run]
    [--reviewer-receipt data/clip-review/asl-pilot-clip-reviewer-receipt.json]
    [--reviewer-authority data/clip-review/asl-pilot-clip-reviewer-authority.json]

Validates a completed source-curated/operator QA packet, updates
data/asl-pilot-store.json clip review fields, and writes
docs/review/final-clip-review.json evidence. Packets with status "reviewed"
remain supported as an optional stronger external-review path and must include
matching signed Ed25519 reviewer receipt plus trusted reviewer authority.
`);
}

function validatePacket(packet, store, storePath) {
  const findings = [];
  if (packet.schema_version !== "asl-pilot-clip-review/v1") {
    findings.push("schema_version must be asl-pilot-clip-review/v1");
  }
  if (!isPostCollectionFinalStatus(packet.status)) {
    findings.push("status must be reviewed or qa_completed");
  }
  findings.push(...validatePostCollectionReviewerForPacket(packet, { requireAslQualificationForExternal: true }));
  if (packet.status === "qa_completed") {
    findings.push(...validateSourceCuratedOperatorQaDisclosure(packet, "packet"));
  }
  if (packet.store?.path !== projectRelative(storePath)) {
    findings.push(`packet store.path must be ${projectRelative(storePath)}`);
  }
  if (!isSha256(packet.store?.sha256)) {
    findings.push("packet store.sha256 must be the exported source-store SHA-256");
  } else if (packet.store.sha256 !== sha256File(storePath)) {
    findings.push("packet store.sha256 must match the current store before import");
  }
  if (!Array.isArray(packet.clips) || packet.clips.length === 0) {
    findings.push("clips must be a non-empty array");
    return findings;
  }
  const byId = new Map(store.datasetClips.map((clip) => [clip.id, clip]));
  const seen = new Set();
	for (const [index, item] of packet.clips.entries()) {
	  const context = `clips[${index}]`;
    if (typeof item.clip_id !== "string" || item.clip_id.trim().length === 0) {
      findings.push(`${context}.clip_id must be a non-empty string`);
      continue;
    }
    if (seen.has(item.clip_id)) findings.push(`Duplicate clip_id in packet: ${item.clip_id}`);
    seen.add(item.clip_id);
    const clip = byId.get(item.clip_id);
    if (!clip) {
      findings.push(`${context}.clip_id is not present in current store: ${item.clip_id}`);
      continue;
    }
    if (item.signer_alias !== clip.signerAlias) findings.push(`${context}.signer_alias does not match store`);
    if (item.vocabulary_id !== clip.vocabularyId) findings.push(`${context}.vocabulary_id does not match store`);
    findings.push(...validatePlanAssignmentProvenance(clip, { context: `store clip ${clip.id}` }));
    findings.push(...validateReviewPacketPlanReference(item, clip, context));
    findings.push(...validateCaptureConditionEvidence(clip, { context: `store clip ${clip.id}` }));
    findings.push(...validateReviewPacketCaptureCondition(item, clip, context));
    if (item.relative_video_path !== clip.relativeVideoPath) {
      findings.push(`${context}.relative_video_path does not match store`);
    }
    const currentVideo = clipFileReference(clip);
    if (item.video?.exists !== true) {
      findings.push(`${context}.video.exists must be true`);
    }
    if (!isSha256(item.video?.sha256)) {
      findings.push(`${context}.video.sha256 must be a lowercase SHA-256 digest`);
    }
    if (!currentVideo.exists) {
      findings.push(`${context}.video.path is missing from the current data directory`);
    }
    if (item.video?.sha256 !== currentVideo.sha256) {
      findings.push(`${context}.video.sha256 must match the current video file`);
    }
    const approved = item.approved === true;
    const rejected =
      item.approved === false &&
      typeof item.rejection_reason === "string" &&
      item.rejection_reason.trim().length > 0;
    if (!approved && !rejected) {
      findings.push(`${context}.approved must be true, or false with a non-empty rejection_reason`);
    }
    if (item.corrected_vocabulary_id !== clip.vocabularyId) {
      findings.push(`${context}.corrected_vocabulary_id must match the current vocabulary_id; recapture mislabeled clips instead`);
    }
  }
  if (seen.size !== store.datasetClips.length) {
    findings.push(`Review packet covers ${seen.size} clips, but store contains ${store.datasetClips.length} clips`);
  }
  return findings;
}

function writeStore(storePath, store) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.input) throw new Error("--input is required");
  const inputPath = resolveProjectPath(args.input, "--input");
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultClipReviewEvidencePath;
  const reviewerReceiptPath = args.reviewer_receipt
    ? resolveProjectPath(args.reviewer_receipt, "--reviewer-receipt")
    : defaultClipReviewReceiptPath;
  const reviewerAuthorityPath = args.reviewer_authority
    ? resolveProjectPath(args.reviewer_authority, "--reviewer-authority")
    : defaultClipReviewerAuthorityPath;
  if (!args.dryRun) {
    if (projectRelative(inputPath) !== "data/clip-review/asl-pilot-clip-review.json") {
      throw new Error("--input must be the canonical returned packet path for final import: data/clip-review/asl-pilot-clip-review.json");
    }
    if (projectRelative(storePath) !== "data/asl-pilot-store.json") {
      throw new Error("--store must be the canonical store path for final import: data/asl-pilot-store.json");
    }
    if (projectRelative(evidencePath) !== "docs/review/final-clip-review.json") {
      throw new Error("--evidence must be the canonical final evidence path: docs/review/final-clip-review.json");
    }
  }
  const packet = readJson(inputPath);
  if (!fs.existsSync(storePath)) throw new Error(`store does not exist: ${projectRelative(storePath)}`);
  const requiresExternalReceipt = postCollectionReviewRequiresExternalReceipt(packet);
  if (!args.dryRun && (requiresExternalReceipt || args.reviewer_receipt || args.reviewer_authority)) {
    if (projectRelative(reviewerReceiptPath) !== "data/clip-review/asl-pilot-clip-reviewer-receipt.json") {
      throw new Error("--reviewer-receipt must be the canonical signed receipt path: data/clip-review/asl-pilot-clip-reviewer-receipt.json");
    }
    if (projectRelative(reviewerAuthorityPath) !== "data/clip-review/asl-pilot-clip-reviewer-authority.json") {
      throw new Error("--reviewer-authority must be the canonical reviewer authority path: data/clip-review/asl-pilot-clip-reviewer-authority.json");
    }
  }
  const store = readStore(storePath);
  const findings = validatePacket(packet, store, storePath);
  if (requiresExternalReceipt) {
    findings.push(...validatePostCollectionReviewReceiptFile(reviewerReceiptPath, packet, inputPath, {
      kind: "clip",
      reviewerAuthorityPath,
    }).findings);
  }
  if (findings.length > 0) throw new Error(findings.join("; "));

  const importedAt = new Date().toISOString();
  const nextStore = structuredClone(store);
  const reviewedAt = packet.reviewer.reviewed_at;
  const reviewByClipId = new Map(packet.clips.map((item) => [item.clip_id, item]));
  for (const clip of nextStore.datasetClips) {
    const review = reviewByClipId.get(clip.id);
    if (!review) throw new Error(`validated packet lost clip review for ${clip.id}`);
    clip.labelReviewStatus = review.approved === true ? "approved" : "rejected";
    clip.labelReviewer = packet.reviewer.name;
    clip.labelReviewedAt = reviewedAt;
    clip.labelRejectionReason = review.approved === true ? null : review.rejection_reason.trim();
    clip.labelReviewNotes =
      typeof review.notes === "string" && review.notes.trim().length > 0 ? review.notes.trim() : null;
  }
  const approvedClips = nextStore.datasetClips.filter((clip) => clip.labelReviewStatus === "approved");
  const rejectedClips = nextStore.datasetClips.filter((clip) => clip.labelReviewStatus === "rejected");
  const evidence = {
    schema_version: "asl-pilot-clip-review-evidence/v1",
    status: packet.status,
    evidence_mode: packet.status === "qa_completed" ? packet.evidence_mode : "external_review",
    external_review: packet.status === "qa_completed"
      ? packet.external_review
      : {
          claimed: true,
          claim: "External clip review is claimed only because a signed reviewer receipt and trusted reviewer authority were validated.",
        },
    imported_at: importedAt,
    source_packet: {
      path: projectRelative(inputPath),
      sha256: sha256File(inputPath),
    },
    store: {
      path: projectRelative(storePath),
      sha256_before: sha256File(storePath),
      sha256_after: args.dryRun ? "dry-run-not-written" : null,
    },
    reviewer: packet.reviewer,
    clip_count: nextStore.datasetClips.length,
    reviewed_clip_ids: nextStore.datasetClips.map((clip) => clip.id),
    approved_clip_ids: approvedClips.map((clip) => clip.id),
    rejected_clip_ids: rejectedClips.map((clip) => clip.id),
    rejected_clips: rejectedClips.map((clip) => ({
      clip_id: clip.id,
      rejection_reason: clip.labelRejectionReason,
      notes: clip.labelReviewNotes,
    })),
  };
  if (requiresExternalReceipt) {
    evidence.reviewer_signed_receipt = {
      path: projectRelative(reviewerReceiptPath),
      sha256: sha256File(reviewerReceiptPath),
    };
    evidence.reviewer_authority = {
      path: projectRelative(reviewerAuthorityPath),
      sha256: sha256File(reviewerAuthorityPath),
    };
  }
  if (!args.dryRun) {
    writeStore(storePath, nextStore);
    evidence.store.sha256_after = sha256File(storePath);
    writeJson(evidencePath, evidence);
  }
  console.log(
    JSON.stringify(
      {
        status: args.dryRun ? "dry_run_valid" : "imported",
        clip_count: nextStore.datasetClips.length,
        approved_clip_count: approvedClips.length,
        rejected_clip_count: rejectedClips.length,
        evidence: projectRelative(evidencePath),
      },
      null,
      2,
    ),
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Clip review import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
