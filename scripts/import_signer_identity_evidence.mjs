import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalSignedConsentReceiptPayload,
  validateEd25519SignatureEvidence,
  validateSignedConsentReceiptTopLevelFields,
} from "./signed_receipt_utils.mjs";
import {
  firstSymlinkedProjectPathComponent,
} from "./vocabulary_review_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultInputPath = path.join(root, "data", "signer-identity", "signer-identity-evidence.json");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const schemaVersion = "asl-pilot-signer-identity-evidence/v1";
const signedConsentReceiptSchemaVersion = "asl-pilot-signed-consent-identity-receipt/v1";
const consentFormRelativePath = "docs/privacy/dataset-consent-form.md";
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const consentVersion = "asl-pilot-dataset-consent-v1";

function parseArgs(argv) {
  const args = { write: false };
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
    if (item === "--input" || item === "--store") {
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
  node scripts/import_signer_identity_evidence.mjs \\
    --input data/signer-identity/signer-identity-evidence.json \\
    [--store data/asl-pilot-store.json] [--write]

Validates a private signer identity evidence packet, then stamps matching
dataset signer and consent records with signed real-person identity evidence.
Without --write, this is a dry run.
`);
}

function resolveProjectPath(value, context, mustExist = true) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  if (mustExist && !fs.existsSync(resolved)) {
    throw new Error(`${context} does not exist: ${relative(resolved)}`);
  }
  return resolved;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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

function validateTimestamp(value, context, blockers) {
  if (!isIsoTimestamp(value)) {
    blockers.push(`${context} must be a full ISO timestamp with timezone`);
    return;
  }
  if (isFutureTimestamp(value)) {
    blockers.push(`${context} must not be in the future`);
  }
}

function sameStringSet(left, right) {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
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

function requireString(value, context, blockers) {
  if (typeof value !== "string" || value.trim().length === 0 || /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value)) {
    blockers.push(`${context} must be a non-placeholder string`);
    return "";
  }
  return value.trim();
}

function validateVerifier(verifier, context, blockers) {
  if (!verifier || typeof verifier !== "object" || Array.isArray(verifier)) {
    blockers.push(`${context} must be an object`);
    return;
  }
  for (const key of ["name", "role", "affiliation_or_context", "contact_or_signed_evidence"]) {
    requireString(verifier[key], `${context}.${key}`, blockers);
  }
  if (verifier.is_project_operator !== false) {
    blockers.push(`${context}.is_project_operator must be false`);
  }
}

function validateSignedBy(signedBy, context, blockers) {
  if (!signedBy || typeof signedBy !== "object" || Array.isArray(signedBy)) {
    blockers.push(`${context}.signed_by must be an object`);
    return;
  }
  for (const key of ["name", "role", "affiliation_or_context", "contact_or_signature_reference"]) {
    requireString(signedBy[key], `${context}.signed_by.${key}`, blockers);
  }
  if (signedBy.is_project_operator !== false) {
    blockers.push(`${context}.signed_by.is_project_operator must be false`);
  }
}

function validateEvidenceReference(reference, context, blockers, options = {}) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  const evidencePath = requireString(reference.path, `${context}.path`, blockers);
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
  }
  if (typeof reference.purpose !== "string" || reference.purpose.trim().length < 20) {
    blockers.push(`${context}.purpose must describe the signed evidence`);
  }
  if (!evidencePath) return null;
  const file = resolveProjectPath(evidencePath, `${context}.path`, false);
  const relativePath = relative(file);
  const expectedPath = options.signerAlias
    ? `data/signer-identity/${options.signerAlias}-signed-consent.json`
    : null;
  if (expectedPath && relativePath !== expectedPath) {
    blockers.push(`${context}.path must be the canonical signed consent receipt path for ${options.signerAlias}: ${expectedPath}`);
  } else if (!relativePath.startsWith("data/signer-identity/")) {
    blockers.push(`${context}.path must be under data/signer-identity/`);
  }
  if (relativePath.startsWith("output/")) {
    blockers.push(`${context}.path must not point at output/ fixture or handoff material for final signer identity import`);
  }
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path missing file: ${relativePath}`);
    return null;
  }
  const stats = fs.lstatSync(file);
  if (stats.isSymbolicLink()) {
    blockers.push(`${context}.path must not be a symbolic link: ${relativePath}`);
    return null;
  }
  const symlinkedAncestor = firstSymlinkedProjectPathComponent(file, { includeTarget: false });
  if (symlinkedAncestor) {
    blockers.push(`${context}.path must not include a symbolic link path component: ${relative(symlinkedAncestor)}`);
    return null;
  }
  if (!stats.isFile()) {
    blockers.push(`${context}.path must be a file: ${relativePath}`);
    return null;
  }
  const actual = sha256File(file);
  if (reference.sha256 !== actual) {
    blockers.push(`${context}.sha256 mismatch for ${evidencePath}; expected ${reference.sha256}, got ${actual}`);
  }
  return {
    path: relativePath,
    sha256: reference.sha256,
    purpose: reference.purpose,
  };
}

function validateSignedConsentReceipt(reference, { signerAlias, signerIdentityHash, consentRecordIds }, context, blockers) {
  if (!reference) return null;
  const file = path.join(root, reference.path);
  let receipt;
  try {
    receipt = readJson(file);
  } catch (error) {
    blockers.push(`${context} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  if (receipt.schema_version !== signedConsentReceiptSchemaVersion) {
    blockers.push(`${context}.schema_version must be ${signedConsentReceiptSchemaVersion}`);
  }
  blockers.push(...validateSignedConsentReceiptTopLevelFields(receipt, context));
  if (receipt.status !== "signed") {
    blockers.push(`${context}.status must be signed`);
  }
  if (receipt.signer_alias !== signerAlias) {
    blockers.push(`${context}.signer_alias must match ${signerAlias}`);
  }
  if (receipt.signer_identity_hash !== signerIdentityHash) {
    blockers.push(`${context}.signer_identity_hash must match the packet signer_identity_hash`);
  }
  const receiptConsentRecordIds = Array.isArray(receipt.consent_record_ids)
    ? receipt.consent_record_ids.map((value, index) => (
      requireString(value, `${context}.consent_record_ids[${index}]`, blockers)
    )).filter(Boolean)
    : [];
  if (findDuplicates(receiptConsentRecordIds).length > 0) {
    blockers.push(`${context}.consent_record_ids must not contain duplicates`);
  }
  if (!Array.isArray(receipt.consent_record_ids) || !sameStringSet(receiptConsentRecordIds, consentRecordIds)) {
    blockers.push(`${context}.consent_record_ids must exactly match the packet consent_record_ids`);
  }
  validateTimestamp(receipt.signed_at, `${context}.signed_at`, blockers);
  validateSignedBy(receipt.signed_by, context, blockers);
  blockers.push(...validateEd25519SignatureEvidence({
    signedObject: receipt,
    payload: canonicalSignedConsentReceiptPayload(receipt),
    context,
  }));

  const consentForm = receipt.consent_form;
  if (!consentForm || typeof consentForm !== "object" || Array.isArray(consentForm)) {
    blockers.push(`${context}.consent_form must be an object`);
  } else {
    if (consentForm.path !== consentFormRelativePath) {
      blockers.push(`${context}.consent_form.path must be ${consentFormRelativePath}`);
    }
    if (consentForm.consent_version !== consentVersion) {
      blockers.push(`${context}.consent_form.consent_version must be ${consentVersion}`);
    }
    if (consentForm.sha256 !== sha256File(consentFormPath)) {
      blockers.push(`${context}.consent_form.sha256 must match the current dataset consent form`);
    }
  }

  const confirmed = receipt.confirmed_consent_flags;
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
  if (!confirmed || typeof confirmed !== "object" || Array.isArray(confirmed)) {
    blockers.push(`${context}.confirmed_consent_flags must be an object`);
  } else {
    for (const flag of requiredTrueFlags) {
      if (confirmed[flag] !== true) blockers.push(`${context}.confirmed_consent_flags.${flag} must be true`);
    }
    if (confirmed.raw_clip_redistribution_without_separate_permission !== false) {
      blockers.push(`${context}.confirmed_consent_flags.raw_clip_redistribution_without_separate_permission must be false`);
    }
  }
  return receipt;
}

function validateStoreConsentAgainstReceipt(consent, row, context, blockers) {
  const receipt = row.signedConsentReceipt;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    blockers.push(`${context} cannot be stamped without a parsed signed consent receipt`);
    return;
  }
  if (consent.id && !row.consentRecordIds.includes(consent.id)) {
    blockers.push(`${context} is not included in the signed consent receipt consent_record_ids`);
  }
  if (consent.signerAlias !== row.signerAlias) {
    blockers.push(`${context}.signerAlias must match ${row.signerAlias}`);
  }
  if (consent.consentVersion !== consentVersion) {
    blockers.push(`${context}.consentVersion must be ${consentVersion}`);
  }
  if (consent.consentFormSha256 !== sha256File(consentFormPath)) {
    blockers.push(`${context}.consentFormSha256 must match the current dataset consent form`);
  }
  const confirmed = receipt.confirmed_consent_flags ?? {};
  const flagPairs = [
    ["ageEligible", "age_eligible"],
    ["allowModelTraining", "allow_model_training"],
    ["allowValidation", "allow_validation"],
    ["allowPilotUse", "allow_pilot_use"],
    ["allowDerivedArtifactRetention", "allow_derived_artifact_retention"],
    ["allowDeidentifiedMetadataRetention", "allow_deidentified_metadata_retention"],
    ["retentionAcknowledged", "retention_acknowledged"],
    ["withdrawalAcknowledged", "withdrawal_acknowledged"],
  ];
  for (const [storeField, receiptField] of flagPairs) {
    if (consent[storeField] !== confirmed[receiptField]) {
      blockers.push(`${context}.${storeField} must match signed receipt ${receiptField}`);
    }
  }
  if (consent.allowRawClipRedistribution !== confirmed.raw_clip_redistribution_without_separate_permission) {
    blockers.push(`${context}.allowRawClipRedistribution must match signed receipt raw_clip_redistribution_without_separate_permission`);
  }
}

function validatePacket(packet) {
  const blockers = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return { blockers: ["identity evidence packet root must be an object"], rows: [] };
  }
  if (packet.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (packet.status !== "verified") {
    blockers.push("status must be verified");
  }
  validateTimestamp(packet.verified_at, "verified_at", blockers);
  validateVerifier(packet.verified_by, "verified_by", blockers);
  const rows = [];
  const seenAliases = new Set();
  const seenIdentityHashes = new Map();
  if (!Array.isArray(packet.signers) || packet.signers.length === 0) {
    blockers.push("signers must be a non-empty array");
  } else {
    for (const [index, signer] of packet.signers.entries()) {
      const context = `signers[${index}]`;
      if (!signer || typeof signer !== "object" || Array.isArray(signer)) {
        blockers.push(`${context} must be an object`);
        continue;
      }
      const signerAlias = requireString(signer.signer_alias, `${context}.signer_alias`, blockers);
      if (signerAlias && seenAliases.has(signerAlias)) {
        blockers.push(`${context}.signer_alias duplicates another row: ${signerAlias}`);
      }
      if (signerAlias) seenAliases.add(signerAlias);
      if (!isSha256(signer.signer_identity_hash)) {
        blockers.push(`${context}.signer_identity_hash must be a lowercase SHA-256 digest`);
      } else {
        const existingAlias = seenIdentityHashes.get(signer.signer_identity_hash);
        if (existingAlias && existingAlias !== signerAlias) {
          blockers.push(`${context}.signer_identity_hash duplicates ${existingAlias}; each final signer must map to one real person`);
        }
        seenIdentityHashes.set(signer.signer_identity_hash, signerAlias);
      }
      validateTimestamp(signer.verified_at, `${context}.verified_at`, blockers);
      let consentRecordIds = [];
      if (!Array.isArray(signer.consent_record_ids) || signer.consent_record_ids.length === 0) {
        blockers.push(`${context}.consent_record_ids must be a non-empty array`);
      } else {
        consentRecordIds = signer.consent_record_ids.map((value, idIndex) => (
          requireString(value, `${context}.consent_record_ids[${idIndex}]`, blockers)
        )).filter(Boolean);
        const duplicateConsentIds = findDuplicates(consentRecordIds);
        if (duplicateConsentIds.length > 0) {
          blockers.push(`${context}.consent_record_ids must not contain duplicates: ${duplicateConsentIds.join(", ")}`);
        }
      }
      const signedConsentEvidence = validateEvidenceReference(
        signer.signed_consent_evidence,
        `${context}.signed_consent_evidence`,
        blockers,
        { signerAlias },
      );
      const signedConsentReceipt = validateSignedConsentReceipt(
        signedConsentEvidence,
        {
          signerAlias,
          signerIdentityHash: signer.signer_identity_hash,
          consentRecordIds,
        },
        `${context}.signed_consent_evidence receipt`,
        blockers,
      );
      if (signerAlias && isSha256(signer.signer_identity_hash) && signedConsentEvidence) {
        rows.push({
          signerAlias,
          signerIdentityHash: signer.signer_identity_hash,
          consentRecordIds,
          signedConsentEvidence,
          signedConsentReceipt,
        });
      }
    }
  }
  return { blockers, rows };
}

function normalizeStore(raw) {
  return {
    ...raw,
    datasetSigners: Array.isArray(raw.datasetSigners) ? raw.datasetSigners : [],
    consentRecords: Array.isArray(raw.consentRecords) ? raw.consentRecords : [],
  };
}

function applyRows(store, rows) {
  const blockers = [];
  const updates = [];
  const signerByAlias = new Map(store.datasetSigners.map((record) => [record.signerAlias, record]));
  const consentById = new Map(store.consentRecords.map((record) => [record.id, record]));
  for (const row of rows) {
    const signer = signerByAlias.get(row.signerAlias);
    if (!signer) {
      blockers.push(`No dataset signer record found for signer_alias ${row.signerAlias}`);
      continue;
    }
    const consentRecords = row.consentRecordIds.length > 0
      ? row.consentRecordIds.map((id) => consentById.get(id)).filter(Boolean)
      : store.consentRecords.filter((record) => record.signerAlias === row.signerAlias);
    const missingConsentIds = row.consentRecordIds.filter((id) => !consentById.has(id));
    for (const missing of missingConsentIds) {
      blockers.push(`No consent record found for ${row.signerAlias}: ${missing}`);
    }
    if (consentRecords.length === 0) {
      blockers.push(`No consent records found for signer_alias ${row.signerAlias}`);
      continue;
    }
    for (const consent of consentRecords) {
      if (consent.signerAlias !== row.signerAlias) {
        blockers.push(`Consent record ${consent.id} signerAlias does not match ${row.signerAlias}`);
      }
      validateStoreConsentAgainstReceipt(
        consent,
        row,
        `Consent record ${consent.id} for signer_alias ${row.signerAlias}`,
        blockers,
      );
    }
    signer.identityAttestation = "signed_identity_verified";
    signer.signerIdentityHash = row.signerIdentityHash;
    signer.signedConsentEvidence = row.signedConsentEvidence;
    signer.updatedAt = new Date().toISOString();
    for (const consent of consentRecords) {
      consent.signerIdentityHash = row.signerIdentityHash;
      consent.signedConsentEvidence = row.signedConsentEvidence;
    }
    updates.push({
      signer_alias: row.signerAlias,
      signer_identity_hash: row.signerIdentityHash,
      consent_records_updated: consentRecords.length,
    });
  }
  return { blockers, updates };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const inputPath = args.input ? resolveProjectPath(args.input, "--input") : defaultInputPath;
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  if (args.write) {
    if (relative(inputPath) !== "data/signer-identity/signer-identity-evidence.json") {
      throw new Error("--input must be the canonical signer identity packet path for final import: data/signer-identity/signer-identity-evidence.json");
    }
    if (relative(storePath) !== "data/asl-pilot-store.json") {
      throw new Error("--store must be the canonical store path for final import: data/asl-pilot-store.json");
    }
  }
  const packet = readJson(inputPath);
  const { blockers: packetBlockers, rows } = validatePacket(packet);
  const storeExists = fs.existsSync(storePath);
  const store = storeExists ? normalizeStore(readJson(storePath)) : normalizeStore({});
  const { blockers: applyBlockers, updates } = storeExists
    ? applyRows(store, rows)
    : { blockers: [`Store does not exist: ${relative(storePath)}`], updates: [] };
  const blockers = [...packetBlockers, ...applyBlockers];
  if (args.write && blockers.length === 0) writeJson(storePath, store);
  console.log(JSON.stringify({
    status: blockers.length === 0
      ? args.write ? "imported" : "dry_run_valid"
      : "incomplete",
    input: relative(inputPath),
    store: relative(storePath),
    write: args.write,
    updates,
    blockers,
  }, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Signer identity evidence import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
