import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalVocabularyReviewerReceiptPayload,
  defaultReviewPacketPath,
  defaultReviewReceiptPath,
  isFutureTimestamp,
  isIsoTimestamp,
  isSha256,
  parseVocabularySource,
  projectRelative,
  readJson,
  requiredHintReviewFields,
  resolveProjectPath,
  root,
  sha256File,
  validateReviewer,
  validateVocabularyItems,
  validateVocabularyReviewerReceipt,
  vocabularyPath,
  writeJson,
} from "./vocabulary_review_utils.mjs";
import {
  sha256Bytes,
  sha256Text,
} from "./signed_receipt_utils.mjs";

function parseArgs(argv) {
  const args = {
    input: defaultReviewPacketPath,
    output: defaultReviewReceiptPath,
    write: false,
    force: false,
    allowIncomplete: false,
    verify: false,
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
    if (item === "--allow-incomplete") {
      args.allowIncomplete = true;
      continue;
    }
    if (item === "--verify") {
      args.verify = true;
      continue;
    }
    if (item === "--input" || item === "--output" || item === "--private-key") {
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
  node scripts/draft_vocabulary_reviewer_receipt.mjs \\
    [--input data/vocabulary-review/asl-pilot-vocabulary-review.json] \\
    [--output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json] \\
    [--private-key /path/to/reviewer-ed25519-private-key.pem] \\
    [--write] [--force] [--verify] [--allow-incomplete]

Builds the deterministic reviewer receipt from a completed returned vocabulary
review packet. Without --private-key, it writes a draft with the canonical
payload SHA-256 and blank Ed25519 signature fields. With --private-key, it signs
the canonical payload. The private key is read only; it is never written.
`);
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

function buildReceipt(packet, inputPath) {
  const receipt = {
    schema_version: "asl-pilot-vocabulary-reviewer-receipt/v1",
    status: "signed",
    reviewer: reviewerForReceipt(packet.reviewer),
    signed_at: packet.reviewer?.reviewed_at ?? "",
    vocabulary_source: {
      path: packet.vocabulary_source?.path,
      sha256: packet.vocabulary_source?.sha256,
    },
    review_packet: {
      path: projectRelative(inputPath),
      sha256: sha256File(inputPath),
    },
    approved_item_ids: Array.isArray(packet.items) ? packet.items.map((item) => item.id) : [],
    hint_review_fields: requiredHintReviewFields,
  };
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: sha256Text(canonicalVocabularyReviewerReceiptPayload(receipt)),
    public_key_pem: "",
    signer_key_fingerprint_sha256: "",
    signature_base64: "",
  };
  return receipt;
}

function resolvePrivateKeyPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) throw new Error(`--private-key does not exist: ${value}`);
  return resolved;
}

function signReceipt(receipt, privateKeyPath) {
  const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("--private-key must be an Ed25519 private key");
  }
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const payload = canonicalVocabularyReviewerReceiptPayload(receipt);
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: sha256Text(payload),
    public_key_pem: publicKeyPem,
    signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
    signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
  };
  return receipt;
}

function packetCompletionFindings(packet, inputPath) {
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
  } else if (packet.vocabulary_source.sha256 !== sha256File(vocabularyPath)) {
    findings.push("review packet vocabulary_source.sha256 must match current vocabulary source before receipt signing");
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
  findings.push(...validateVocabularyItems(packet.items, { requireApproved: true }));
  const { items: currentItems } = parseVocabularySource();
  const currentIds = currentItems.map((item) => item.id).join("\n");
  const packetIds = Array.isArray(packet.items)
    ? packet.items.map((item) => item.id).join("\n")
    : "";
  if (currentIds !== packetIds) {
    findings.push("review packet item IDs must match current vocabulary order exactly");
  }
  if (!fs.existsSync(inputPath)) {
    findings.push(`review packet path does not exist: ${projectRelative(inputPath)}`);
  }
  return findings;
}

function statusFor({ signed, verified, packetFindings, receiptFindings }) {
  if (packetFindings.length > 0) return "blocked_incomplete_packet";
  if (verified && receiptFindings.length === 0) return signed ? "signed_verified" : "draft_verified";
  if (signed) return "signed_needs_import_validation";
  return "draft_needs_signature";
}

function printSummary({ args, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote }) {
  const signed = receipt.signature_evidence.signature_base64.trim().length > 0;
  const verified = args.verify && packetFindings.length === 0 && receiptFindings.length === 0;
  console.log(JSON.stringify({
    schema_version: "asl-pilot-vocabulary-reviewer-receipt-draft/v1",
    status: statusFor({ signed, verified, packetFindings, receiptFindings }),
    input: {
      path: projectRelative(inputPath),
      sha256: sha256File(inputPath),
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
      ? "Run node scripts/report_vocabulary_review_status.mjs, then process the returned review packet."
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
  const inputPath = resolveProjectPath(args.input, "--input");
  const outputPath = resolveProjectPath(args.output, "--output");
  if (!fs.existsSync(inputPath)) throw new Error(`--input does not exist: ${projectRelative(inputPath)}`);
  if (args.write && fs.existsSync(outputPath) && !args.force) {
    throw new Error(`--output already exists; pass --force to replace it: ${projectRelative(outputPath)}`);
  }

  const packet = readJson(inputPath);
  const packetFindings = packetCompletionFindings(packet, inputPath);
  if (args.private_key && packetFindings.length > 0) {
    printSummary({
      args,
      inputPath,
      outputPath,
      receipt: buildReceipt(packet, inputPath),
      packetFindings,
      receiptFindings: [],
      wrote: false,
    });
    console.error("Refusing to sign an incomplete vocabulary review packet.");
    return 1;
  }
  if (packetFindings.length > 0 && !args.allowIncomplete) {
    printSummary({
      args,
      inputPath,
      outputPath,
      receipt: buildReceipt(packet, inputPath),
      packetFindings,
      receiptFindings: [],
      wrote: false,
    });
    console.error("Vocabulary reviewer receipt draft blocked by incomplete returned packet.");
    return 1;
  }

  let receipt = buildReceipt(packet, inputPath);
  if (args.private_key) {
    receipt = signReceipt(receipt, resolvePrivateKeyPath(args.private_key));
  }
  const receiptFindings = validateVocabularyReviewerReceipt(receipt, packet, inputPath, outputPath);
  if (args.verify && (packetFindings.length > 0 || receiptFindings.length > 0)) {
    printSummary({ args, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote: false });
    console.error("Vocabulary reviewer receipt verification failed.");
    return 1;
  }

  let wrote = false;
  if (args.write) {
    writeJson(outputPath, receipt);
    wrote = true;
  }
  printSummary({ args, inputPath, outputPath, receipt, packetFindings, receiptFindings, wrote });
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary reviewer receipt draft failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
