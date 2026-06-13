import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultTemplatePath = path.join(root, "docs", "review", "final-external-attestations.template.json");
const defaultOutputPath = path.join(root, "docs", "review", "final-external-attestations.draft.json");
const defaultReceiptDir = path.join(root, "output", "final-attestations-draft");

function parseArgs(argv) {
  const args = { write: false, writeReceiptTemplates: false };
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
    if (item === "--write-receipt-templates") {
      args.writeReceiptTemplates = true;
      continue;
    }
    if (item === "--template" || item === "--output" || item === "--receipt-dir") {
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
  node scripts/draft_external_attestations.mjs \\
    [--template docs/review/final-external-attestations.template.json] \\
    [--output docs/review/final-external-attestations.draft.json] \\
    [--receipt-dir output/final-attestations-draft] \\
    [--write] [--write-receipt-templates]

Creates a draft external-attestation JSON with current SHA-256 hashes for
evidence files that already exist, computes evidence digests, and can write
per-attestation unsigned receipt templates. It does not sign or verify human
claims.
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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stableJson(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalSignedReceiptPayload(receipt) {
  const reviewedEvidenceFiles = Array.isArray(receipt.reviewed_evidence_files)
    ? receipt.reviewed_evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  const payload = {
    schema_version: receipt.schema_version,
    status: receipt.status,
    attestation_id: receipt.attestation_id,
    attestation_snapshot: normalizedAttestationSnapshot(receipt.attestation_snapshot),
    evidence_digest: receipt.evidence_digest,
    signed_at: receipt.signed_at,
    signed_by: receipt.signed_by,
    reviewed_evidence_files: reviewedEvidenceFiles,
  };
  return stableJson(payload);
}

function normalizedAttestationSnapshot(attestation) {
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) return null;
  const evidenceFiles = Array.isArray(attestation.evidence_files)
    ? attestation.evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
        purpose: item?.purpose,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  const attestedBy = attestation.attested_by && typeof attestation.attested_by === "object" && !Array.isArray(attestation.attested_by)
    ? {
        name: attestation.attested_by.name,
        role: attestation.attested_by.role,
        affiliation_or_context: attestation.attested_by.affiliation_or_context,
        credential_or_authority: attestation.attested_by.credential_or_authority,
        contact_or_signed_evidence: attestation.attested_by.contact_or_signed_evidence,
        is_project_operator: attestation.attested_by.is_project_operator,
      }
    : null;
  return {
    id: attestation.id,
    statement: attestation.statement,
    attested_at: attestation.attested_at,
    attested_by: attestedBy,
    evidence_digest: attestation.evidence_digest,
    evidence_files: evidenceFiles,
  };
}

function evidenceDigest(evidenceFiles) {
  const payload = evidenceFiles
    .map((item) => ({ path: item.path, sha256: item.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function redactHumanFields(attestedBy) {
  if (!attestedBy || typeof attestedBy !== "object" || Array.isArray(attestedBy)) return;
  for (const key of ["name", "role", "affiliation_or_context", "credential_or_authority", "contact_or_signed_evidence"]) {
    if (typeof attestedBy[key] !== "string" || attestedBy[key].startsWith("replace-with-")) {
      attestedBy[key] = "";
    }
  }
  attestedBy.is_project_operator = false;
}

function receiptTemplate(attestation) {
  const receipt = {
    schema_version: "asl-pilot-signed-attestation-receipt/v1",
    status: "draft_needs_signature",
    attestation_id: attestation.id,
    attestation_snapshot: normalizedAttestationSnapshot(attestation),
    evidence_digest: attestation.evidence_digest,
    signed_at: "",
    signed_by: {
      name: "",
      role: "",
      affiliation_or_context: "",
      contact_or_signature_reference: "",
      is_project_operator: false,
    },
    reviewed_evidence_files: attestation.evidence_files.map((item) => ({
      path: item.path,
      sha256: item.sha256,
    })),
  };
  const payloadDigest = sha256Text(canonicalSignedReceiptPayload(receipt));
  receipt.signature_evidence = {
    algorithm: "ed25519",
    signed_payload_sha256: payloadDigest,
    public_key_pem: "",
    signer_key_fingerprint_sha256: "",
    signature_base64: "",
  };
  return receipt;
}

function updateSignedEvidenceFiles(attestation, receiptDir, writeReceiptTemplates, blockers) {
  if (!Array.isArray(attestation.signed_evidence_files)) attestation.signed_evidence_files = [];
  const receiptPath = path.join(receiptDir, `${attestation.id}-unsigned-receipt-template.json`);
  if (writeReceiptTemplates) {
    fs.mkdirSync(receiptDir, { recursive: true });
    writeJson(receiptPath, receiptTemplate(attestation));
  }
  if (fs.existsSync(receiptPath)) {
    attestation.signed_evidence_files = [
      {
        path: relative(receiptPath),
        sha256: sha256File(receiptPath),
        purpose: `Unsigned receipt template for ${attestation.id}; must be signed before final evidence`,
        signed_at: "",
      },
    ];
    return;
  }
  for (const [index, evidence] of attestation.signed_evidence_files.entries()) {
    const context = `attestation ${attestation.id} signed_evidence_files[${index}]`;
    if (typeof evidence.path !== "string" || evidence.path.trim().length === 0) {
      blockers.push(`${context}.path is missing`);
      continue;
    }
    const file = path.join(root, evidence.path);
    if (!file.startsWith(`${root}${path.sep}`)) {
      blockers.push(`${context}.path escapes project root: ${evidence.path}`);
      continue;
    }
    if (!fs.existsSync(file)) {
      evidence.sha256 = "missing-file";
      blockers.push(`${context}.path missing file: ${evidence.path}`);
      continue;
    }
    evidence.sha256 = sha256File(file);
    if (!evidence.signed_at || String(evidence.signed_at).includes("YYYY")) {
      evidence.signed_at = "";
    }
  }
}

function buildDraft(template, { receiptDir, writeReceiptTemplates }) {
  const blockers = [];
  const draft = JSON.parse(JSON.stringify(template));
  draft.status = "draft_needs_human_attestation";
  draft.generated_at = new Date().toISOString();
  for (const [index, attestation] of (draft.attestations ?? []).entries()) {
    attestation.status = "draft_needs_attestation";
    attestation.attested_at = "";
    redactHumanFields(attestation.attested_by);
    for (const [evidenceIndex, evidence] of (attestation.evidence_files ?? []).entries()) {
      const context = `attestations[${index}].evidence_files[${evidenceIndex}]`;
      if (typeof evidence.path !== "string" || evidence.path.trim().length === 0) {
        blockers.push(`${context}.path is missing`);
        continue;
      }
      const file = path.join(root, evidence.path);
      if (!file.startsWith(`${root}${path.sep}`)) {
        blockers.push(`${context}.path escapes project root: ${evidence.path}`);
        continue;
      }
      if (!fs.existsSync(file)) {
        evidence.sha256 = "missing-file";
        blockers.push(`${context}.path missing file: ${evidence.path}`);
        continue;
      }
      evidence.sha256 = sha256File(file);
    }
    if ((attestation.evidence_files ?? []).every((item) => isSha256(item.sha256))) {
      attestation.evidence_digest = evidenceDigest(attestation.evidence_files);
    } else {
      attestation.evidence_digest = "missing-evidence";
    }
    updateSignedEvidenceFiles(attestation, receiptDir, writeReceiptTemplates, blockers);
  }
  return { draft, blockers };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const templatePath = args.template ? resolveProjectPath(args.template, "--template") : defaultTemplatePath;
  const outputPath = args.output ? resolveProjectPath(args.output, "--output", false) : defaultOutputPath;
  const receiptDir = args.receipt_dir ? resolveProjectPath(args.receipt_dir, "--receipt-dir", false) : defaultReceiptDir;
  const { draft, blockers } = buildDraft(readJson(templatePath), {
    receiptDir,
    writeReceiptTemplates: args.writeReceiptTemplates,
  });
  if (args.write) writeJson(outputPath, draft);
  console.log(JSON.stringify({
    status: blockers.length === 0 ? "draft_ready_for_human_fields" : "draft_has_missing_evidence",
    output: args.write ? relative(outputPath) : null,
    receipt_dir: relative(receiptDir),
    receipt_templates_written: args.writeReceiptTemplates,
    missing_or_unresolved_evidence: blockers,
  }, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`External attestation draft failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
