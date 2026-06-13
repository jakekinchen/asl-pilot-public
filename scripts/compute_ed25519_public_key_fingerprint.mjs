import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { sha256Bytes } from "./signed_receipt_utils.mjs";
import {
  fileAppearsToContainPrivateKey,
  projectRelative,
  root,
  writeJson,
} from "./vocabulary_review_utils.mjs";

function parseArgs(argv) {
  const args = { format: "json" };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--public-key" || item === "--private-key" || item === "--output" || item === "--format") {
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
  node scripts/compute_ed25519_public_key_fingerprint.mjs \\
    (--public-key /path/to/reviewer-ed25519-public-key.pem | --private-key /path/to/reviewer-ed25519-private-key.pem) \\
    [--output output/review-handoff/reviewer-key-fingerprint.json] \\
    [--format json|trusted-key]

Computes the SHA-256 fingerprint over the Ed25519 SPKI public key bytes used by
reviewer authority and receipt evidence. If --private-key is used, the public
key is derived in memory and the private key is never written.
`);
}

function resolveInputPath(value, flag) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${flag} must be a non-empty path`);
  }
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) {
    throw new Error(`${flag} does not exist: ${value}`);
  }
  return resolved;
}

function displayPath(file) {
  const relative = path.relative(root, file);
  return relative.startsWith("..") || path.isAbsolute(relative)
    ? file
    : relative.split(path.sep).join("/");
}

function publicKeyFromArgs(args) {
  const hasPublicKey = typeof args.public_key === "string";
  const hasPrivateKey = typeof args.private_key === "string";
  if (hasPublicKey === hasPrivateKey) {
    throw new Error("Provide exactly one of --public-key or --private-key");
  }
  if (hasPublicKey) {
    const inputPath = resolveInputPath(args.public_key, "--public-key");
    if (fileAppearsToContainPrivateKey(inputPath)) {
      throw new Error("--public-key must be a public key file, not private key material");
    }
    const publicKey = crypto.createPublicKey(fs.readFileSync(inputPath));
    return { inputType: "public_key", inputPath, publicKey };
  }
  const inputPath = resolveInputPath(args.private_key, "--private-key");
  const privateKey = crypto.createPrivateKey(fs.readFileSync(inputPath));
  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("--private-key must be an Ed25519 private key");
  }
  return {
    inputType: "private_key",
    inputPath,
    publicKey: crypto.createPublicKey(privateKey),
  };
}

function buildReport(args) {
  const { inputType, inputPath, publicKey } = publicKeyFromArgs(args);
  if (publicKey.asymmetricKeyType !== "ed25519") {
    throw new Error(`${inputType === "public_key" ? "--public-key" : "--private-key"} must resolve to an Ed25519 public key`);
  }
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const fingerprint = sha256Bytes(publicKey.export({ type: "spki", format: "der" }));
  return {
    schema_version: "asl-pilot-ed25519-public-key-fingerprint/v1",
    status: "computed",
    computed_at: new Date().toISOString(),
    input: {
      type: inputType,
      path: displayPath(inputPath),
    },
    trusted_key: {
      algorithm: "ed25519",
      public_key_pem: publicKeyPem,
      signer_key_fingerprint_sha256: fingerprint,
    },
    reviewer_authority_fields: {
      "trusted_key.algorithm": "ed25519",
      "trusted_key.public_key_pem": publicKeyPem,
      "trusted_key.signer_key_fingerprint_sha256": fingerprint,
    },
  };
}

function outputPayload(report, format) {
  if (format === "json") return report;
  if (format === "trusted-key") return report.trusted_key;
  throw new Error("--format must be json or trusted-key");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = buildReport(args);
  const payload = outputPayload(report, args.format);
  if (args.output) {
    const outputPath = path.isAbsolute(args.output) ? args.output : path.resolve(root, args.output);
    writeJson(outputPath, payload);
    console.log(JSON.stringify({
      status: "written",
      output: projectRelative(outputPath),
      format: args.format,
      signer_key_fingerprint_sha256: report.trusted_key.signer_key_fingerprint_sha256,
    }, null, 2));
    return 0;
  }
  console.log(JSON.stringify(payload, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Ed25519 fingerprint computation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
