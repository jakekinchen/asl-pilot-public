import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultChallengeReviewEvidencePath,
  defaultChallengeReviewPacketPath,
  defaultChallengeReviewerAuthorityPath,
  defaultChallengeReviewReceiptPath,
  defaultClipReviewEvidencePath,
  defaultClipReviewPacketPath,
  defaultClipReviewerAuthorityPath,
  defaultClipReviewReceiptPath,
  defaultStorePath,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  postCollectionReviewRequiresExternalReceipt,
  validatePostCollectionReviewReceiptFile,
  writeJson,
} from "./clip_review_utils.mjs";

const defaultSignerIdentityPath = path.join(root, "data", "signer-identity", "signer-identity-evidence.json");
const manifestPaths = [
  path.join(root, "data", "manifests", "train.json"),
  path.join(root, "data", "manifests", "validation.json"),
  path.join(root, "data", "manifests", "test.json"),
  path.join(root, "data", "manifests", "negative-challenge.json"),
];
const finalManifestAuditPath = path.join(root, "docs", "validation", "final-manifest-audit.json");
const applyMutationPaths = [
  defaultStorePath,
  defaultClipReviewEvidencePath,
  defaultChallengeReviewEvidencePath,
  ...manifestPaths,
  finalManifestAuditPath,
];

function parseArgs(argv) {
  const args = {
    clipReview: defaultClipReviewPacketPath,
    clipReviewerReceipt: defaultClipReviewReceiptPath,
    clipReviewerAuthority: defaultClipReviewerAuthorityPath,
    challengeReview: defaultChallengeReviewPacketPath,
    challengeReviewerReceipt: defaultChallengeReviewReceiptPath,
    challengeReviewerAuthority: defaultChallengeReviewerAuthorityPath,
    signerIdentity: defaultSignerIdentityPath,
    apply: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--apply") {
      args.apply = true;
      continue;
    }
    if (
      item === "--clip-review" ||
      item === "--clip-reviewer-receipt" ||
      item === "--clip-reviewer-authority" ||
      item === "--challenge-review" ||
      item === "--challenge-reviewer-receipt" ||
      item === "--challenge-reviewer-authority" ||
      item === "--signer-identity"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--clip-review") args.clipReview = value;
      if (item === "--clip-reviewer-receipt") args.clipReviewerReceipt = value;
      if (item === "--clip-reviewer-authority") args.clipReviewerAuthority = value;
      if (item === "--challenge-review") args.challengeReview = value;
      if (item === "--challenge-reviewer-receipt") args.challengeReviewerReceipt = value;
      if (item === "--challenge-reviewer-authority") args.challengeReviewerAuthority = value;
      if (item === "--signer-identity") args.signerIdentity = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/process_collected_dataset_evidence.mjs

  node scripts/process_collected_dataset_evidence.mjs --apply

  node scripts/process_collected_dataset_evidence.mjs \\
    --clip-review data/clip-review/asl-pilot-clip-review.json \\
    --clip-reviewer-receipt data/clip-review/asl-pilot-clip-reviewer-receipt.json \\
    --clip-reviewer-authority data/clip-review/asl-pilot-clip-reviewer-authority.json \\
    --challenge-review data/clip-review/asl-pilot-negative-challenge-review.json \\
    --challenge-reviewer-receipt data/clip-review/asl-pilot-negative-challenge-reviewer-receipt.json \\
    --challenge-reviewer-authority data/clip-review/asl-pilot-negative-challenge-reviewer-authority.json \\
    --signer-identity data/signer-identity/signer-identity-evidence.json \\
    --apply

Validates returned post-collection evidence packets. Without --apply, this
dry-runs clip QA, negative challenge QA, and signer identity evidence. Source-
curated/operator QA packets do not require external reviewer receipts or
reviewer authority. Packets with status "reviewed" remain supported as optional
stronger external-review evidence and must validate their signed reviewer
receipts and trusted reviewer authority records. With --apply, the wrapper
imports evidence in order, reruns review/readiness audits, and only then exports
and audits final dataset manifests.
`);
}

function runStep(id, command, args) {
  const commandArgv = [command, ...args];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  const output = {
    id,
    command: commandArgv.join(" "),
    command_argv: commandArgv,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
  if (result.status !== 0) {
    const error = new Error(`${id} failed`);
    error.step = output;
    throw error;
  }
  return output;
}

function summarizeText(text) {
  if (!text) return "";
  if (text.length <= 4000) return text;
  return `${text.slice(0, 4000)}\n...truncated...`;
}

function parseJsonOutput(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeStep(step) {
  const parsed = parseJsonOutput(step.stdout);
  return {
    id: step.id,
    command: step.command,
    command_argv: Array.isArray(step.command_argv) ? step.command_argv : null,
    status: step.status,
    parsed_status: parsed?.status ?? null,
    parsed_blockers: Array.isArray(parsed?.blockers) ? parsed.blockers : null,
    stdout: summarizeText(step.stdout),
    stderr: summarizeText(step.stderr),
  };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function snapshotFiles(files) {
  return files.map((file) => {
    if (!fs.existsSync(file)) {
      return {
        path: file,
        existed: false,
        content: null,
        mode: null,
        sha256: null,
      };
    }
    const stats = fs.statSync(file);
    return {
      path: file,
      existed: true,
      content: fs.readFileSync(file),
      mode: stats.mode,
      sha256: sha256File(file),
    };
  });
}

function restoreFileSnapshot(snapshot) {
  const restored = [];
  const removed = [];
  const unchangedMissing = [];
  const errors = [];
  for (const record of snapshot) {
    try {
      if (record.existed) {
        fs.mkdirSync(path.dirname(record.path), { recursive: true });
        fs.writeFileSync(record.path, record.content);
        if (record.mode !== null) fs.chmodSync(record.path, record.mode);
        restored.push({
          path: projectRelative(record.path),
          sha256: record.sha256,
        });
      } else if (fs.existsSync(record.path)) {
        fs.rmSync(record.path, { force: true, recursive: true });
        removed.push(projectRelative(record.path));
      } else {
        unchangedMissing.push(projectRelative(record.path));
      }
    } catch (error) {
      errors.push({
        path: projectRelative(record.path),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    status: errors.length === 0 ? "restored" : "restore_failed",
    restored,
    removed,
    unchanged_missing: unchangedMissing,
    errors,
  };
}

function resolveInputs(args) {
  const inputs = {
    clip_review: resolveProjectPath(args.clipReview, "--clip-review"),
    clip_reviewer_receipt: resolveProjectPath(args.clipReviewerReceipt, "--clip-reviewer-receipt"),
    clip_reviewer_authority: resolveProjectPath(args.clipReviewerAuthority, "--clip-reviewer-authority"),
    challenge_review: resolveProjectPath(args.challengeReview, "--challenge-review"),
    challenge_reviewer_receipt: resolveProjectPath(args.challengeReviewerReceipt, "--challenge-reviewer-receipt"),
    challenge_reviewer_authority: resolveProjectPath(args.challengeReviewerAuthority, "--challenge-reviewer-authority"),
    signer_identity: resolveProjectPath(args.signerIdentity, "--signer-identity"),
  };
  const requiredInputIds = new Set(["clip_review", "challenge_review", "signer_identity"]);
  const missing = Object.entries(inputs)
    .filter(([id, file]) => requiredInputIds.has(id) && !fs.existsSync(file))
    .map(([id, file]) => ({ id, path: projectRelative(file) }));
  return { inputs, missing };
}

function manifestSummary() {
  return manifestPaths.map((file) => ({
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  }));
}

function wrapperCommandArgv(inputSummary, { apply = false } = {}) {
  return [
    "node",
    "scripts/process_collected_dataset_evidence.mjs",
    "--clip-review",
    inputSummary.clip_review,
    "--challenge-review",
    inputSummary.challenge_review,
    "--signer-identity",
    inputSummary.signer_identity,
    ...(apply ? ["--apply"] : []),
  ];
}

function nextBlockedStep(error, steps) {
  const stepId = error?.step?.id ?? steps.at(-1)?.id ?? "preflight";
  if (stepId.includes("clip_review")) {
    return "Fix or re-export the completed ASL clip review packet, then rerun this wrapper.";
  }
  if (stepId.includes("challenge_review")) {
    return "Fix or re-export the completed negative challenge review packet, then rerun this wrapper.";
  }
  if (stepId.includes("signer_identity")) {
    return "Fix the private signer identity and signed consent receipt evidence, then rerun this wrapper.";
  }
  if (stepId.includes("dataset_collection_readiness")) {
    return "Resolve collection coverage, consent, identity, review, media hash, or camera-metadata blockers before manifest export.";
  }
  if (stepId.includes("manifest")) {
    return "Resolve final manifest validator blockers before training or completion claims.";
  }
  return "Resolve the failed step, then rerun this wrapper from the dry-run mode first.";
}

function internalStep(id, payload) {
  return {
    id,
    command: "internal transaction",
    command_argv: null,
    status: 0,
    stdout: JSON.stringify(payload, null, 2),
    stderr: "",
  };
}

function applyClipReviewRows(store, packet) {
  const nextStore = structuredClone(store);
  const reviewByClipId = new Map(packet.clips.map((item) => [item.clip_id, item]));
  for (const clip of nextStore.datasetClips) {
    const review = reviewByClipId.get(clip.id);
    if (!review) throw new Error(`validated packet lost clip review for ${clip.id}`);
    clip.labelReviewStatus = review.approved === true ? "approved" : "rejected";
    clip.labelReviewer = packet.reviewer.name;
    clip.labelReviewedAt = packet.reviewer.reviewed_at;
    clip.labelRejectionReason = review.approved === true ? null : review.rejection_reason.trim();
    clip.labelReviewNotes =
      typeof review.notes === "string" && review.notes.trim().length > 0 ? review.notes.trim() : null;
  }
  return nextStore;
}

function applyChallengeReviewRows(store, packet) {
  const nextStore = structuredClone(store);
  const reviewByClipId = new Map(packet.clips.map((item) => [item.clip_id, item]));
  for (const clip of nextStore.datasetChallengeClips) {
    const review = reviewByClipId.get(clip.id);
    if (!review) throw new Error(`validated packet lost challenge review for ${clip.id}`);
    clip.challengeReviewStatus = review.approved === true ? "approved" : "rejected";
    clip.challengeReviewer = packet.reviewer.name;
    clip.challengeReviewedAt = packet.reviewer.reviewed_at;
    clip.challengeRejectionReason = review.approved === true ? null : review.rejection_reason.trim();
    clip.challengeReviewNotes =
      typeof review.notes === "string" && review.notes.trim().length > 0 ? review.notes.trim() : null;
  }
  return nextStore;
}

function clipReviewEvidence({
  packet,
  inputPath,
  reviewerReceiptPath,
  reviewerAuthorityPath,
  storeBeforeSha256,
  storeAfterSha256,
  importedAt,
  store,
}) {
  const approved = store.datasetClips.filter((clip) => clip.labelReviewStatus === "approved");
  const rejected = store.datasetClips.filter((clip) => clip.labelReviewStatus === "rejected");
  return {
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
      path: projectRelative(defaultStorePath),
      sha256_before: storeBeforeSha256,
      sha256_after: storeAfterSha256,
    },
    reviewer: packet.reviewer,
    clip_count: store.datasetClips.length,
    reviewed_clip_ids: store.datasetClips.map((clip) => clip.id),
    approved_clip_ids: approved.map((clip) => clip.id),
    rejected_clip_ids: rejected.map((clip) => clip.id),
    rejected_clips: rejected.map((clip) => ({
      clip_id: clip.id,
      rejection_reason: clip.labelRejectionReason,
      notes: clip.labelReviewNotes,
    })),
    ...(postCollectionReviewRequiresExternalReceipt(packet)
      ? {
          reviewer_signed_receipt: {
            path: projectRelative(reviewerReceiptPath),
            sha256: sha256File(reviewerReceiptPath),
          },
          reviewer_authority: {
            path: projectRelative(reviewerAuthorityPath),
            sha256: sha256File(reviewerAuthorityPath),
          },
        }
      : {}),
  };
}

function challengeReviewEvidence({
  packet,
  inputPath,
  reviewerReceiptPath,
  reviewerAuthorityPath,
  storeBeforeSha256,
  storeAfterSha256,
  importedAt,
  store,
}) {
  const approved = store.datasetChallengeClips.filter((clip) => clip.challengeReviewStatus === "approved");
  const rejected = store.datasetChallengeClips.filter((clip) => clip.challengeReviewStatus === "rejected");
  return {
    schema_version: "asl-pilot-negative-challenge-review-evidence/v1",
    status: packet.status,
    evidence_mode: packet.status === "qa_completed" ? packet.evidence_mode : "external_review",
    external_review: packet.status === "qa_completed"
      ? packet.external_review
      : {
          claimed: true,
          claim: "External negative challenge review is claimed only because a signed reviewer receipt and trusted reviewer authority were validated.",
        },
    imported_at: importedAt,
    source_packet: {
      path: projectRelative(inputPath),
      sha256: sha256File(inputPath),
    },
    store: {
      path: projectRelative(defaultStorePath),
      sha256_before: storeBeforeSha256,
      sha256_after: storeAfterSha256,
    },
    reviewer: packet.reviewer,
    clip_count: store.datasetChallengeClips.length,
    reviewed_clip_ids: store.datasetChallengeClips.map((clip) => clip.id),
    approved_clip_ids: approved.map((clip) => clip.id),
    rejected_clip_ids: rejected.map((clip) => clip.id),
    rejected_clips: rejected.map((clip) => ({
      clip_id: clip.id,
      rejection_reason: clip.challengeRejectionReason,
      notes: clip.challengeReviewNotes,
    })),
    ...(postCollectionReviewRequiresExternalReceipt(packet)
      ? {
          reviewer_signed_receipt: {
            path: projectRelative(reviewerReceiptPath),
            sha256: sha256File(reviewerReceiptPath),
          },
          reviewer_authority: {
            path: projectRelative(reviewerAuthorityPath),
            sha256: sha256File(reviewerAuthorityPath),
          },
        }
      : {}),
  };
}

function inputPacketHashes(inputs) {
  const hashes = {};
  for (const key of [
    "clip_review",
    "clip_reviewer_receipt",
    "clip_reviewer_authority",
    "challenge_review",
    "challenge_reviewer_receipt",
    "challenge_reviewer_authority",
    "signer_identity",
  ]) {
    if (inputs[key] && fs.existsSync(inputs[key])) hashes[key] = sha256File(inputs[key]);
  }
  return hashes;
}

function assertPacketHashesUnchanged(inputs, expectedHashes) {
  const current = inputPacketHashes(inputs);
  for (const key of Object.keys(expectedHashes ?? {})) {
    if (expectedHashes?.[key] !== current[key]) {
      throw new Error(`${key} evidence changed after dry-run validation; rerun the wrapper from dry-run mode`);
    }
  }
}

function applyReviewPacketsTransactionally(inputs, expectedPacketHashes) {
  if (!fs.existsSync(defaultStorePath)) {
    throw new Error(`Store does not exist: ${projectRelative(defaultStorePath)}`);
  }
  assertPacketHashesUnchanged(inputs, expectedPacketHashes);
  const storeBeforeSha256 = sha256File(defaultStorePath);
  const clipPacket = readJson(inputs.clip_review);
  const challengePacket = readJson(inputs.challenge_review);
  if (clipPacket.store?.sha256 !== storeBeforeSha256) {
    throw new Error("clip review packet no longer matches the current store; re-export and review the packet");
  }
  if (challengePacket.store?.sha256 !== storeBeforeSha256) {
    throw new Error("negative challenge review packet no longer matches the current store; re-export and review the packet");
  }
  if (postCollectionReviewRequiresExternalReceipt(clipPacket)) {
    const clipReceiptFindings = validatePostCollectionReviewReceiptFile(inputs.clip_reviewer_receipt, clipPacket, inputs.clip_review, {
      kind: "clip",
      reviewerAuthorityPath: inputs.clip_reviewer_authority,
    }).findings;
    if (clipReceiptFindings.length > 0) {
      throw new Error(`clip reviewer receipt validation failed: ${clipReceiptFindings.join("; ")}`);
    }
  }
  if (postCollectionReviewRequiresExternalReceipt(challengePacket)) {
    const challengeReceiptFindings = validatePostCollectionReviewReceiptFile(inputs.challenge_reviewer_receipt, challengePacket, inputs.challenge_review, {
      kind: "challenge",
      reviewerAuthorityPath: inputs.challenge_reviewer_authority,
    }).findings;
    if (challengeReceiptFindings.length > 0) {
      throw new Error(`negative challenge reviewer receipt validation failed: ${challengeReceiptFindings.join("; ")}`);
    }
  }
  const baseStore = readJson(defaultStorePath);
  let nextStore = applyClipReviewRows(baseStore, clipPacket);
  nextStore = applyChallengeReviewRows(nextStore, challengePacket);
  const importedAt = new Date().toISOString();
  writeJson(defaultStorePath, nextStore);
  const storeAfterSha256 = sha256File(defaultStorePath);
  writeJson(defaultClipReviewEvidencePath, clipReviewEvidence({
    packet: clipPacket,
    inputPath: inputs.clip_review,
    reviewerReceiptPath: inputs.clip_reviewer_receipt,
    reviewerAuthorityPath: inputs.clip_reviewer_authority,
    storeBeforeSha256,
    storeAfterSha256,
    importedAt,
    store: nextStore,
  }));
  writeJson(defaultChallengeReviewEvidencePath, challengeReviewEvidence({
    packet: challengePacket,
    inputPath: inputs.challenge_review,
    reviewerReceiptPath: inputs.challenge_reviewer_receipt,
    reviewerAuthorityPath: inputs.challenge_reviewer_authority,
    storeBeforeSha256,
    storeAfterSha256,
    importedAt,
    store: nextStore,
  }));
  return {
    status: "imported",
    store: {
      path: projectRelative(defaultStorePath),
      sha256_before: storeBeforeSha256,
      sha256_after: storeAfterSha256,
    },
    clip_review_evidence: projectRelative(defaultClipReviewEvidencePath),
    challenge_review_evidence: projectRelative(defaultChallengeReviewEvidencePath),
  };
}

function runDryRuns(inputs, steps) {
  steps.push(runStep("clip_review_dry_run", "node", [
    "scripts/import_clip_review.mjs",
    "--input",
    projectRelative(inputs.clip_review),
    "--dry-run",
  ]));
  steps.push(runStep("challenge_review_dry_run", "node", [
    "scripts/import_challenge_review.mjs",
    "--input",
    projectRelative(inputs.challenge_review),
    "--dry-run",
  ]));
  steps.push(runStep("signer_identity_dry_run", "node", [
    "scripts/import_signer_identity_evidence.mjs",
    "--input",
    projectRelative(inputs.signer_identity),
  ]));
}

function runApplySteps(inputs, steps) {
  const packetHashesBeforeDryRun = inputPacketHashes(inputs);
  steps.push(runStep("clip_review_dry_run", "node", [
    "scripts/import_clip_review.mjs",
    "--input",
    projectRelative(inputs.clip_review),
    "--dry-run",
  ]));
  steps.push(runStep("challenge_review_dry_run", "node", [
    "scripts/import_challenge_review.mjs",
    "--input",
    projectRelative(inputs.challenge_review),
    "--dry-run",
  ]));
  steps.push(runStep("signer_identity_dry_run", "node", [
    "scripts/import_signer_identity_evidence.mjs",
    "--input",
    projectRelative(inputs.signer_identity),
  ]));

  steps.push(internalStep("review_packets_transaction_apply", applyReviewPacketsTransactionally(inputs, packetHashesBeforeDryRun)));
  steps.push(runStep("clip_review_audit_after_review_transaction", "node", ["scripts/audit_clip_review.mjs"]));
  steps.push(runStep("challenge_review_audit_after_review_transaction", "node", ["scripts/audit_challenge_review.mjs"]));
  assertPacketHashesUnchanged(inputs, packetHashesBeforeDryRun);
  steps.push(internalStep("post_review_packet_hash_lock", {
    status: "validated",
    input_hashes: packetHashesBeforeDryRun,
  }));

  steps.push(runStep("signer_identity_apply", "node", [
    "scripts/import_signer_identity_evidence.mjs",
    "--input",
    projectRelative(inputs.signer_identity),
    "--write",
  ]));
  steps.push(runStep("clip_review_audit_after_identity_import", "node", ["scripts/audit_clip_review.mjs"]));
  steps.push(runStep("challenge_review_audit_after_identity_import", "node", ["scripts/audit_challenge_review.mjs"]));
  steps.push(runStep("dataset_collection_readiness", "node", ["scripts/audit_dataset_collection_readiness.mjs"]));
  steps.push(runStep("manifest_export", "node", ["scripts/export_dataset_manifests.mjs"]));
  steps.push(runStep("final_manifest_audit", "./.venv/bin/python", [
    "scripts/audit_final_manifests.py",
    "--write-report",
    "docs/validation/final-manifest-audit.json",
  ]));
}

function runApply(inputs, steps) {
  const mutationSnapshot = snapshotFiles(applyMutationPaths);
  try {
    runApplySteps(inputs, steps);
    steps.push(internalStep("post_collection_apply_transaction_commit", {
      status: "committed",
      mutation_paths: applyMutationPaths.map(projectRelative),
    }));
  } catch (error) {
    if (error?.step) {
      steps.push(error.step);
      error.step_recorded = true;
    }
    steps.push(internalStep("post_collection_apply_transaction_rollback", {
      reason: error instanceof Error ? error.message : String(error),
      ...restoreFileSnapshot(mutationSnapshot),
    }));
    throw error;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const steps = [];
  const { inputs, missing } = resolveInputs(args);
  const inputSummary = Object.fromEntries(
    Object.entries(inputs).map(([id, file]) => [id, projectRelative(file)]),
  );
  const canonicalInputs = {
    clip_review: projectRelative(defaultClipReviewPacketPath),
    challenge_review: projectRelative(defaultChallengeReviewPacketPath),
    signer_identity: projectRelative(defaultSignerIdentityPath),
  };
  if (args.apply) {
    const noncanonical = Object.entries(canonicalInputs)
      .filter(([id, expected]) => inputSummary[id] !== expected)
      .map(([id, expected]) => `${id} must be ${expected}`);
    if (noncanonical.length > 0) {
      console.log(JSON.stringify({
        status: "blocked",
        apply_requested: true,
        inputs: inputSummary,
        blocker: `Final apply requires canonical returned evidence paths: ${noncanonical.join("; ")}`,
        next_required_human_step: "Copy completed QA packets and signer identity evidence to canonical data paths, then rerun dry-run and apply. Optional external-reviewed packets must also stage canonical signed reviewer receipts and reviewer authority records.",
        manifests: manifestSummary(),
        steps: [],
      }, null, 2));
      return 1;
    }
  }
  if (missing.length > 0) {
    const nextCommandArgv = wrapperCommandArgv(inputSummary);
    console.log(JSON.stringify({
      status: "blocked",
      apply_requested: args.apply,
      inputs: inputSummary,
      missing_inputs: missing,
      next_required_human_step: "Complete or export the missing post-collection QA packets and signer identity evidence before running this wrapper. Optional external-reviewed packets must also stage signed reviewer receipts and reviewer authority records.",
      next_command: nextCommandArgv.join(" "),
      next_command_argv: nextCommandArgv,
      steps: [],
    }, null, 2));
    return 1;
  }

  try {
    if (args.apply) {
      runApply(inputs, steps);
      console.log(JSON.stringify({
        status: "final_manifests_ready",
        apply_requested: true,
        inputs: inputSummary,
        manifests: manifestSummary(),
        next_required_human_step: "Proceed to decode/train/evaluate only after final manifests remain passing.",
        steps: steps.map(normalizeStep),
      }, null, 2));
      return 0;
    }

    runDryRuns(inputs, steps);
    const nextCommandArgv = wrapperCommandArgv(inputSummary, { apply: true });
    console.log(JSON.stringify({
      status: "dry_run_valid",
      apply_requested: false,
      inputs: inputSummary,
      apply_required_for_next_state: true,
      next_command: nextCommandArgv.join(" "),
      next_command_argv: nextCommandArgv,
      steps: steps.map(normalizeStep),
    }, null, 2));
    return 0;
  } catch (error) {
    if (error?.step && !error.step_recorded) steps.push(error.step);
    console.log(JSON.stringify({
      status: "blocked",
      apply_requested: args.apply,
      inputs: inputSummary,
      blocker: error instanceof Error ? error.message : String(error),
      next_required_human_step: nextBlockedStep(error, steps),
      manifests: manifestSummary(),
      steps: steps.map(normalizeStep),
    }, null, 2));
    console.error(`Collected dataset evidence processing failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Collected dataset evidence processing failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
