import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  buildPostCollectionReviewReceipt,
  canonicalPostCollectionReviewReceiptPayload,
  isFutureTimestamp,
  isIsoTimestamp,
  isSha256,
  postCollectionReviewKindConfig,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  validatePostCollectionReviewReceipt,
  validateReviewer,
  writeJson,
} from "./clip_review_utils.mjs";
import {
  sha256Bytes,
  sha256Text,
} from "./signed_receipt_utils.mjs";

function parseArgs(argv) {
  const args = {
    write: false,
    force: false,
    verify: false,
    allowIncomplete: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (item === "--dry-run") {
      args.write = false;
      continue;
    }
    if (item === "--force") {
      args.force = true;
      continue;
    }
    if (item === "--verify") {
      args.verify = true;
      continue;
    }
    if (item === "--allow-incomplete") {
      args.allowIncomplete = true;
      continue;
    }
    if (item === "--kind" || item === "--input" || item === "--output" || item === "--private-key") {
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
  node scripts/draft_post_collection_review_receipt.mjs --kind clip \\
    [--input data/clip-review/asl-pilot-clip-review.json] \\
    [--output data/clip-review/asl-pilot-clip-reviewer-receipt.json] \\
    [--private-key /path/to/reviewer-ed25519-private-key.pem] \\
    [--write] [--force] [--verify] [--allow-incomplete]

  node scripts/draft_post_collection_review_receipt.mjs --kind challenge \\
    [--input data/clip-review/asl-pilot-negative-challenge-review.json] \\
    [--output data/clip-review/asl-pilot-negative-challenge-reviewer-receipt.json] \\
    [--private-key /path/to/reviewer-ed25519-private-key.pem] \\
    [--write] [--force] [--verify] [--allow-incomplete]

Builds the deterministic reviewer receipt for returned post-collection clip or
negative-challenge review packets. Without --private-key, it writes a draft with
the canonical payload SHA-256 and blank Ed25519 signature fields. With
--private-key, it signs the canonical payload. The private key is read only; it
is never written.
`);
}

function resolvePrivateKeyPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) throw new Error(`--private-key does not exist: ${value}`);
  return resolved;
}

function packetCompletionFindings(packet, inputPath, kind) {
  const config = postCollectionReviewKindConfig(kind);
  const findings = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return ["review packet must be an object"];
  }
  if (packet.schema_version !== config.packetSchemaVersion) {
    findings.push(`review packet schema_version must be ${config.packetSchemaVersion}`);
  }
  if (packet.status !== "reviewed") {
    findings.push("review packet status must be reviewed");
  }
  findings.push(...validateReviewer(packet.reviewer, {
    requireAslQualification: config.requireAslQualification,
    requireIndependentReviewer: true,
  }));
  if (!isIsoTimestamp(packet.reviewer?.reviewed_at)) {
    findings.push("review packet reviewer.reviewed_at must be a full ISO timestamp with timezone");
  } else if (isFutureTimestamp(packet.reviewer.reviewed_at)) {
    findings.push("review packet reviewer.reviewed_at must not be in the future");
  }
  if (typeof packet.store?.path !== "string" || packet.store.path.trim().length === 0) {
    findings.push("review packet store.path must be a non-empty string");
  }
  if (!isSha256(packet.store?.sha256)) {
    findings.push("review packet store.sha256 must be a lowercase SHA-256 digest");
  }
  if (!Array.isArray(packet.clips) || packet.clips.length === 0) {
    findings.push("review packet clips must be a non-empty array");
    return findings;
  }
  const seen = new Set();
  for (const [index, item] of packet.clips.entries()) {
    const context = `review packet clips[${index}]`;
    if (typeof item.clip_id !== "string" || item.clip_id.trim().length === 0) {
      findings.push(`${context}.clip_id must be a non-empty string`);
    } else if (seen.has(item.clip_id)) {
      findings.push(`${context}.clip_id is duplicated: ${item.clip_id}`);
    } else {
      seen.add(item.clip_id);
    }
    if (typeof item.video?.path !== "string" || item.video.path.trim().length === 0) {
      findings.push(`${context}.video.path must be a non-empty string`);
    }
    if (!isSha256(item.video?.sha256)) {
      findings.push(`${context}.video.sha256 must be a lowercase SHA-256 digest`);
    }
    if (item.approved !== true && item.approved !== false) {
      findings.push(`${context}.approved must be true or false`);
    }
    if (item.approved === false && (typeof item.rejection_reason !== "string" || item.rejection_reason.trim().length === 0)) {
      findings.push(`${context}.rejection_reason must be non-empty when approved is false`);
    }
    if (kind === "clip" && item.corrected_vocabulary_id !== item.vocabulary_id) {
      findings.push(`${context}.corrected_vocabulary_id must match vocabulary_id; recapture mislabeled clips instead`);
    }
    if (kind === "challenge" && item.expected_outcome !== "reject") {
      findings.push(`${context}.expected_outcome must be reject`);
    }
  }
  if (!fs.existsSync(inputPath)) {
    findings.push(`review packet path does not exist: ${projectRelative(inputPath)}`);
  }
  return findings;
}

function signReceipt(receipt, privateKeyPath) {
  const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("--private-key must be an Ed25519 private key");
  }
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const payload = canonicalPostCollectionReviewReceiptPayload(receipt);
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: sha256Text(payload),
    public_key_pem: publicKeyPem,
    signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
    signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
  };
  return receipt;
}

function statusFor({ signed, verified, packetFindings, receiptFindings }) {
  if (packetFindings.length > 0) return "blocked_incomplete_packet";
  if (verified && receiptFindings.length === 0) return signed ? "signed_verified" : "draft_verified";
  if (signed) return "signed_needs_import_validation";
  return "draft_needs_signature";
}

function printSummary({ args, kind, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote }) {
  const signed = receipt.signature_evidence.signature_base64.trim().length > 0;
  const verified = args.verify && packetFindings.length === 0 && receiptFindings.length === 0;
  console.log(JSON.stringify({
    schema_version: "asl-pilot-post-collection-reviewer-receipt-draft/v1",
    status: statusFor({ signed, verified, packetFindings, receiptFindings }),
    kind,
    input: {
      path: projectRelative(inputPath),
      sha256: fs.existsSync(inputPath) ? crypto.createHash("sha256").update(fs.readFileSync(inputPath)).digest("hex") : null,
    },
    output: {
      path: projectRelative(outputPath),
      wrote,
    },
    signed,
    verified,
    signed_payload_sha256: receipt.signature_evidence.signed_payload_sha256,
    packet_blockers: packetFindings,
    receipt_blockers: receiptFindings,
    next_required_action: signed
      ? "Stage the matching reviewer authority record, then dry-run process_collected_dataset_evidence.mjs."
      : "Have the reviewer sign the canonical payload with Ed25519, or rerun this helper with --private-key and --verify.",
    receipt,
  }, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.kind) throw new Error("--kind is required and must be clip or challenge");
  const config = postCollectionReviewKindConfig(args.kind);
  const inputPath = args.input ? resolveProjectPath(args.input, "--input") : config.packetPath;
  const outputPath = args.output ? resolveProjectPath(args.output, "--output") : config.receiptPath;
  if (!fs.existsSync(inputPath)) throw new Error(`--input does not exist: ${projectRelative(inputPath)}`);
  if (args.write && fs.existsSync(outputPath) && !args.force) {
    throw new Error(`--output already exists; pass --force to replace it: ${projectRelative(outputPath)}`);
  }

  const packet = readJson(inputPath);
  const packetFindings = packetCompletionFindings(packet, inputPath, args.kind);
  if (args.private_key && packetFindings.length > 0) {
    printSummary({
      args,
      kind: args.kind,
      inputPath,
      outputPath,
      receipt: buildPostCollectionReviewReceipt(packet, inputPath, args.kind),
      packetFindings,
      receiptFindings: [],
      wrote: false,
    });
    console.error("Refusing to sign an incomplete post-collection review packet.");
    return 1;
  }
  if (packetFindings.length > 0 && !args.allowIncomplete) {
    printSummary({
      args,
      kind: args.kind,
      inputPath,
      outputPath,
      receipt: buildPostCollectionReviewReceipt(packet, inputPath, args.kind),
      packetFindings,
      receiptFindings: [],
      wrote: false,
    });
    console.error("Post-collection reviewer receipt draft blocked by incomplete returned packet.");
    return 1;
  }

  let receipt = buildPostCollectionReviewReceipt(packet, inputPath, args.kind);
  if (args.private_key) {
    receipt = signReceipt(receipt, resolvePrivateKeyPath(args.private_key));
  }
  const receiptFindings = validatePostCollectionReviewReceipt(receipt, packet, inputPath, outputPath, args.kind);
  if (args.verify && (packetFindings.length > 0 || receiptFindings.length > 0)) {
    printSummary({ args, kind: args.kind, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote: false });
    console.error("Post-collection reviewer receipt verification failed.");
    return 1;
  }

  let wrote = false;
  if (args.write) {
    writeJson(outputPath, receipt);
    wrote = true;
  }
  printSummary({ args, kind: args.kind, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote });
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Post-collection reviewer receipt draft failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
