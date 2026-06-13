import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  isSha256,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  writeJson,
} from "./clip_review_utils.mjs";
import {
  canonicalSignedConsentReceiptPayload,
  sha256Bytes,
  sha256Text,
  validateEd25519SignatureEvidence,
  validateSignedConsentReceiptTopLevelFields,
} from "./signed_receipt_utils.mjs";

const defaultInputPath = path.join(root, "data", "signer-identity", "signer-identity-evidence.json");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const consentFormRelativePath = "docs/privacy/dataset-consent-form.md";
const consentVersion = "asl-pilot-dataset-consent-v1";
const schemaVersion = "asl-pilot-signed-consent-identity-receipt/v1";
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

function parseArgs(argv) {
  const args = {
    input: defaultInputPath,
    write: false,
    force: false,
    verify: false,
    updatePacket: false,
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
    if (item === "--update-packet") {
      args.updatePacket = true;
      continue;
    }
    if (
      item === "--input" ||
      item === "--output" ||
      item === "--signer-alias" ||
      item === "--private-key" ||
      item === "--signed-at" ||
      item === "--signed-by-name" ||
      item === "--signed-by-role" ||
      item === "--affiliation-or-context" ||
      item === "--contact-or-signature-reference"
    ) {
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
  node scripts/draft_signed_consent_receipt.mjs \\
    --input data/signer-identity/signer-identity-evidence.json \\
    --signer-alias signer-001 \\
    [--output data/signer-identity/signer-001-signed-consent.json] \\
    [--signed-at 2026-05-20T00:00:00.000Z] \\
    [--signed-by-name "Signer One"] \\
    [--signed-by-role "Signer"] \\
    [--affiliation-or-context "Self"] \\
    [--contact-or-signature-reference "signed form reference"] \\
    [--private-key /path/to/signer-ed25519-private-key.pem] \\
    [--write] [--force] [--verify] [--update-packet]

Builds the deterministic signed consent/identity receipt for one signer row in
the private signer identity evidence packet. Without --private-key, it writes a
draft with the canonical payload SHA-256 and blank Ed25519 signature fields.
With --private-key, it signs the canonical payload. The private key is read only;
it is never written.
`);
}

function nonPlaceholder(value) {
  return typeof value === "string" && value.trim().length > 0 && !/\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value);
}

function isIsoTimestamp(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isFutureTimestamp(value) {
  return isIsoTimestamp(value) && Date.parse(value) > Date.now();
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function readExistingReceipt(outputPath) {
  if (!fs.existsSync(outputPath)) return null;
  try {
    return readJson(outputPath);
  } catch {
    return null;
  }
}

function resolvePrivateKeyPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) throw new Error(`--private-key does not exist: ${value}`);
  return resolved;
}

function selectSigner(packet, signerAlias) {
  const signers = Array.isArray(packet.signers) ? packet.signers : [];
  if (signerAlias) {
    const signer = signers.find((item) => item?.signer_alias === signerAlias);
    if (!signer) throw new Error(`No signer row found for --signer-alias ${signerAlias}`);
    return signer;
  }
  if (signers.length === 1) return signers[0];
  throw new Error("--signer-alias is required when the packet has zero or multiple signers");
}

function outputPathFor(args, signer) {
  if (args.output) return resolveProjectPath(args.output, "--output");
  const packetPath = signer?.signed_consent_evidence?.path;
  if (nonPlaceholder(packetPath)) return resolveProjectPath(packetPath, "signer.signed_consent_evidence.path");
  const alias = nonPlaceholder(signer?.signer_alias) ? signer.signer_alias : "replace-with-signer-alias";
  return resolveProjectPath(`data/signer-identity/${alias}-signed-consent.json`, "--output");
}

function valueFromArgsOrExisting(argsValue, existingValue) {
  if (nonPlaceholder(argsValue)) return argsValue.trim();
  if (nonPlaceholder(existingValue)) return existingValue.trim();
  return "";
}

function validateActor(actor, context) {
  const findings = [];
  if (!actor || typeof actor !== "object" || Array.isArray(actor)) {
    return [`${context} must be an object`];
  }
  for (const key of ["name", "role", "affiliation_or_context", "contact_or_signed_evidence"]) {
    if (!nonPlaceholder(actor[key])) findings.push(`${context}.${key} must be a non-placeholder string`);
  }
  if (actor.is_project_operator !== false) findings.push(`${context}.is_project_operator must be false`);
  return findings;
}

function validateSignerIdentityPacketForSigning(packet, selectedSigner) {
  const findings = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return ["signer identity packet must be an object"];
  }
  if (packet.schema_version !== "asl-pilot-signer-identity-evidence/v1") {
    findings.push("signer identity packet schema_version must be asl-pilot-signer-identity-evidence/v1");
  }
  if (packet.status !== "verified") {
    findings.push("signer identity packet status must be verified");
  }
  if (!isIsoTimestamp(packet.verified_at)) {
    findings.push("signer identity packet verified_at must be a full ISO timestamp with timezone");
  } else if (isFutureTimestamp(packet.verified_at)) {
    findings.push("signer identity packet verified_at must not be in the future");
  }
  findings.push(...validateActor(packet.verified_by, "signer identity packet verified_by"));

  if (!Array.isArray(packet.signers) || packet.signers.length === 0) {
    findings.push("signer identity packet signers must be a non-empty array");
    return findings;
  }

  const seenAliases = new Set();
  const seenIdentityHashes = new Map();
  for (const [index, signer] of packet.signers.entries()) {
    const context = `signer identity packet signers[${index}]`;
    if (!signer || typeof signer !== "object" || Array.isArray(signer)) {
      findings.push(`${context} must be an object`);
      continue;
    }
    const alias = nonPlaceholder(signer.signer_alias) ? signer.signer_alias.trim() : "";
    if (!alias) {
      findings.push(`${context}.signer_alias must be a non-placeholder string`);
    } else if (seenAliases.has(alias)) {
      findings.push(`${context}.signer_alias duplicates another row: ${alias}`);
    }
    if (alias) seenAliases.add(alias);
    if (!isSha256(signer.signer_identity_hash)) {
      findings.push(`${context}.signer_identity_hash must be a lowercase SHA-256 digest`);
    } else {
      const existingAlias = seenIdentityHashes.get(signer.signer_identity_hash);
      if (existingAlias && existingAlias !== alias) {
        findings.push(`${context}.signer_identity_hash duplicates ${existingAlias}; each final signer must map to one real person`);
      }
      seenIdentityHashes.set(signer.signer_identity_hash, alias);
    }
    if (!isIsoTimestamp(signer.verified_at)) {
      findings.push(`${context}.verified_at must be a full ISO timestamp with timezone`);
    } else if (isFutureTimestamp(signer.verified_at)) {
      findings.push(`${context}.verified_at must not be in the future`);
    }
  }

  if (!packet.signers.includes(selectedSigner)) {
    findings.push("selected signer row must come from the signer identity packet");
  }
  return findings;
}

function buildReceipt({ args, signer, existing }) {
  const receipt = {
    schema_version: schemaVersion,
    status: "signed",
    signer_alias: signer?.signer_alias ?? "",
    signer_identity_hash: signer?.signer_identity_hash ?? "",
    consent_record_ids: Array.isArray(signer?.consent_record_ids)
      ? signer.consent_record_ids.filter((value) => typeof value === "string")
      : [],
    consent_form: {
      path: consentFormRelativePath,
      sha256: sha256File(consentFormPath),
      consent_version: consentVersion,
    },
    confirmed_consent_flags: {
      age_eligible: true,
      allow_model_training: true,
      allow_validation: true,
      allow_pilot_use: true,
      allow_derived_artifact_retention: true,
      allow_deidentified_metadata_retention: true,
      retention_acknowledged: true,
      withdrawal_acknowledged: true,
      raw_clip_redistribution_without_separate_permission: false,
    },
    signed_at: valueFromArgsOrExisting(args.signed_at, existing?.signed_at),
    signed_by: {
      name: valueFromArgsOrExisting(args.signed_by_name, existing?.signed_by?.name),
      role: valueFromArgsOrExisting(args.signed_by_role, existing?.signed_by?.role),
      affiliation_or_context: valueFromArgsOrExisting(
        args.affiliation_or_context,
        existing?.signed_by?.affiliation_or_context,
      ),
      contact_or_signature_reference: valueFromArgsOrExisting(
        args.contact_or_signature_reference,
        existing?.signed_by?.contact_or_signature_reference,
      ),
      is_project_operator: false,
    },
  };
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: sha256Text(canonicalSignedConsentReceiptPayload(receipt)),
    public_key_pem: "",
    signer_key_fingerprint_sha256: "",
    signature_base64: "",
  };
  return receipt;
}

function validateReceipt(receipt, signer, { requireSignature }) {
  const findings = [];
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return ["signed consent receipt must be an object"];
  }
  findings.push(...validateSignedConsentReceiptTopLevelFields(receipt, "signed consent receipt"));
  if (receipt.schema_version !== schemaVersion) findings.push(`schema_version must be ${schemaVersion}`);
  if (receipt.status !== "signed") findings.push("status must be signed");
  if (!nonPlaceholder(receipt.signer_alias)) findings.push("signer_alias must be a non-placeholder string");
  if (receipt.signer_alias !== signer?.signer_alias) findings.push("signer_alias must match the signer identity packet");
  if (receipt.signer_identity_hash !== signer?.signer_identity_hash || !isSha256(receipt.signer_identity_hash)) {
    findings.push("signer_identity_hash must match the signer identity packet");
  }
  const signerConsentIds = Array.isArray(signer?.consent_record_ids) ? signer.consent_record_ids : [];
  const validSignerConsentIds = signerConsentIds.filter(nonPlaceholder);
  if (!Array.isArray(signer?.consent_record_ids) || validSignerConsentIds.length === 0) {
    findings.push("signer identity packet consent_record_ids must be a non-empty string array");
  } else if (validSignerConsentIds.length !== signerConsentIds.length) {
    findings.push("signer identity packet consent_record_ids must contain only non-placeholder strings");
  }
  const duplicateSignerConsentIds = findDuplicates(validSignerConsentIds);
  if (duplicateSignerConsentIds.length > 0) {
    findings.push(`signer identity packet consent_record_ids must not contain duplicates: ${duplicateSignerConsentIds.join(", ")}`);
  }
  const expectedConsentIds = [...validSignerConsentIds].sort();
  const receiptConsentIds = Array.isArray(receipt.consent_record_ids) ? receipt.consent_record_ids.filter(nonPlaceholder).sort() : [];
  if (!Array.isArray(receipt.consent_record_ids) || receiptConsentIds.length === 0) {
    findings.push("consent_record_ids must be a non-empty string array");
  } else if (receiptConsentIds.length !== receipt.consent_record_ids.length) {
    findings.push("consent_record_ids must contain only non-placeholder strings");
  }
  const duplicateReceiptConsentIds = findDuplicates(receiptConsentIds);
  if (duplicateReceiptConsentIds.length > 0) {
    findings.push(`consent_record_ids must not contain duplicates: ${duplicateReceiptConsentIds.join(", ")}`);
  }
  if (
    receiptConsentIds.length !== expectedConsentIds.length ||
    !receiptConsentIds.every((value, index) => value === expectedConsentIds[index])
  ) {
    findings.push("consent_record_ids must exactly match the signer identity packet");
  }
  if (!isIsoTimestamp(receipt.signed_at)) {
    findings.push("signed_at must be a full ISO timestamp with timezone");
  } else if (isFutureTimestamp(receipt.signed_at)) {
    findings.push("signed_at must not be in the future");
  }
  const signedBy = receipt.signed_by;
  if (!signedBy || typeof signedBy !== "object" || Array.isArray(signedBy)) {
    findings.push("signed_by must be an object");
  } else {
    for (const key of ["name", "role", "affiliation_or_context", "contact_or_signature_reference"]) {
      if (!nonPlaceholder(signedBy[key])) findings.push(`signed_by.${key} must be a non-placeholder string`);
    }
    if (signedBy.is_project_operator !== false) findings.push("signed_by.is_project_operator must be false");
  }
  if (
    receipt.consent_form?.path !== consentFormRelativePath ||
    receipt.consent_form?.sha256 !== sha256File(consentFormPath) ||
    receipt.consent_form?.consent_version !== consentVersion
  ) {
    findings.push("consent_form must bind the current dataset consent form path, SHA-256, and version");
  }
  const flags = receipt.confirmed_consent_flags;
  if (!flags || typeof flags !== "object" || Array.isArray(flags)) {
    findings.push("confirmed_consent_flags must be an object");
  } else {
    for (const flag of requiredTrueFlags) {
      if (flags[flag] !== true) findings.push(`confirmed_consent_flags.${flag} must be true`);
    }
    if (flags.raw_clip_redistribution_without_separate_permission !== false) {
      findings.push("confirmed_consent_flags.raw_clip_redistribution_without_separate_permission must be false");
    }
  }
  if (requireSignature) {
    findings.push(...validateEd25519SignatureEvidence({
      signedObject: receipt,
      payload: canonicalSignedConsentReceiptPayload(receipt),
      context: "signed consent receipt",
    }));
  }
  return findings;
}

function signReceipt(receipt, privateKeyPath) {
  const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("--private-key must be an Ed25519 private key");
  const publicKey = crypto.createPublicKey(privateKey);
  const payload = canonicalSignedConsentReceiptPayload(receipt);
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: sha256Text(payload),
    public_key_pem: publicKey.export({ type: "spki", format: "pem" }),
    signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
    signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
  };
  return receipt;
}

function updateSignerPacket(packet, signer, outputPath) {
  const nextPacket = structuredClone(packet);
  const row = nextPacket.signers.find((item) => item?.signer_alias === signer.signer_alias);
  row.signed_consent_evidence = {
    path: projectRelative(outputPath),
    sha256: sha256File(outputPath),
    purpose: `Signed consent and identity verification receipt for ${signer.signer_alias}`,
  };
  return nextPacket;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (args.updatePacket && !args.write) {
    throw new Error("--update-packet requires --write");
  }
  const inputPath = resolveProjectPath(args.input, "--input");
  if (!fs.existsSync(inputPath)) throw new Error(`--input does not exist: ${projectRelative(inputPath)}`);
  const packet = readJson(inputPath);
  const signer = selectSigner(packet, args.signer_alias);
  const outputPath = outputPathFor(args, signer);
  if (args.write && fs.existsSync(outputPath) && !args.force) {
    throw new Error(`--output already exists; pass --force to replace it: ${projectRelative(outputPath)}`);
  }
  const existing = readExistingReceipt(outputPath);
  let receipt = buildReceipt({ args, signer, existing });
  const packetFindings = validateSignerIdentityPacketForSigning(packet, signer);
  const completionFindings = [
    ...packetFindings,
    ...validateReceipt(receipt, signer, { requireSignature: false }),
  ];
  if (args.private_key && completionFindings.length > 0) {
    console.log(JSON.stringify({
      status: "blocked_incomplete_receipt",
      input: projectRelative(inputPath),
      output: projectRelative(outputPath),
      signer_alias: signer.signer_alias,
      blockers: completionFindings,
      packet_blockers: packetFindings,
      receipt,
    }, null, 2));
    console.error("Refusing to sign an incomplete signed consent receipt.");
    return 1;
  }
  if (args.private_key) receipt = signReceipt(receipt, resolvePrivateKeyPath(args.private_key));
  const receiptFindings = validateReceipt(receipt, signer, { requireSignature: true });
  const verificationFindings = [...packetFindings, ...receiptFindings];
  if (args.verify && verificationFindings.length > 0) {
    console.log(JSON.stringify({
      status: "verification_failed",
      input: projectRelative(inputPath),
      output: projectRelative(outputPath),
      signer_alias: signer.signer_alias,
      blockers: verificationFindings,
      packet_blockers: packetFindings,
      receipt_blockers: receiptFindings,
      receipt,
    }, null, 2));
    console.error("Signed consent receipt verification failed.");
    return 1;
  }
  if (args.updatePacket && verificationFindings.length > 0) {
    console.log(JSON.stringify({
      status: "update_packet_blocked",
      input: projectRelative(inputPath),
      output: projectRelative(outputPath),
      signer_alias: signer.signer_alias,
      blockers: verificationFindings,
      packet_blockers: packetFindings,
      receipt_blockers: receiptFindings,
      receipt,
    }, null, 2));
    console.error("Refusing to update signer identity packet with an unsigned or invalid consent receipt.");
    return 1;
  }

  let wrote = false;
  let updatedPacket = false;
  if (args.write) {
    writeJson(outputPath, receipt);
    wrote = true;
    if (args.updatePacket) {
      writeJson(inputPath, updateSignerPacket(packet, signer, outputPath));
      updatedPacket = true;
    }
  }

  const signed = receipt.signature_evidence.signature_base64.trim().length > 0;
  console.log(JSON.stringify({
    schema_version: "asl-pilot-signed-consent-receipt-draft/v1",
    status: verificationFindings.length === 0 ? "signed_verified" : signed ? "signed_needs_validation" : "draft_needs_signature",
    input: projectRelative(inputPath),
    output: {
      path: projectRelative(outputPath),
      wrote,
    },
    signer_alias: signer.signer_alias,
    signed,
    updated_packet: updatedPacket,
    signed_payload_sha256: receipt.signature_evidence.signed_payload_sha256,
    blockers: verificationFindings,
    packet_blockers: packetFindings,
    receipt_blockers: receiptFindings,
    next_required_action: signed
      ? "Run node scripts/import_signer_identity_evidence.mjs without --write, then process collected dataset evidence."
      : "Have the signer or authorized representative sign the canonical payload with Ed25519, or rerun this helper with --private-key and --verify.",
    receipt,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Signed consent receipt draft failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
