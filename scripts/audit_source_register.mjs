import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const requiredSources = [
  "first-party-browser-consent-capture",
  "asl-citizen",
  "wlasl",
  "asl-lex",
  "kaggle-or-static-asl",
];
const blockedPublicSources = new Set([
  "asl-citizen",
  "wlasl",
  "asl-lex",
  "kaggle-or-static-asl",
]);
const firstPartyAllowedSources = new Set(["first-party-browser-consent-capture"]);
const allowedSourceKinds = new Set([
  "first_party_collection",
  "public_reference_dataset",
  "external_dataset_family",
]);
const allowedEvidenceExtensions = new Set([
  ".json",
  ".md",
  ".txt",
  ".html",
  ".htm",
  ".pdf",
]);
const documentedSourceIdFiles = [
  "docs/model/rawframe-manifest-schema.md",
];
const datasetSourceResearchAuditPath = "scripts/audit_dataset_source_research.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--register") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --register");
      args.register = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_source_register.mjs [--register docs/model/dataset-source-register.json]

Validates the machine-readable source/license decisions that final manifests
must bind to before training.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function hasAllowedEvidenceExtension(file) {
  return allowedEvidenceExtensions.has(path.extname(file).toLowerCase());
}

function verifyHashPinnedPath(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty project path`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  let file;
  try {
    file = resolveProjectPath(reference.path, `${context}.path`);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    return null;
  }
  if (!hasAllowedEvidenceExtension(file)) {
    blockers.push(`${context}.path must be a JSON, Markdown, text, HTML, or PDF evidence file`);
    return null;
  }
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function validateSource(source, index) {
  const findings = [];
  const context = `sources[${index}]`;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return [`${context} must be an object`];
  }
  for (const key of ["source_id", "display_name", "source_kind", "license_review_status", "decision_id"]) {
    if (typeof source[key] !== "string" || source[key].trim().length === 0) {
      findings.push(`${context}.${key} must be a non-empty string`);
    }
  }
  for (const key of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
    if (typeof source[key] !== "boolean") findings.push(`${context}.${key} must be boolean`);
  }
  if (!Array.isArray(source.restrictions) || source.restrictions.length === 0) {
    findings.push(`${context}.restrictions must be a non-empty array`);
  }
  if (typeof source.source_kind === "string" && !allowedSourceKinds.has(source.source_kind)) {
    findings.push(`${context}.source_kind must be one of ${[...allowedSourceKinds].join(", ")}`);
  }
  if (source.source_kind === "first_party_collection" && !firstPartyAllowedSources.has(source.source_id)) {
    findings.push(`${context}.source_id is not in the explicit first-party allowlist`);
  }
  if (source.source_kind === "public_reference_dataset") {
    if (typeof source.primary_source_url !== "string" || !/^https?:\/\//.test(source.primary_source_url)) {
      findings.push(`${context}.primary_source_url must be an http(s) URL`);
    }
  }
  if (source.source_kind !== "first_party_collection" && source.review_required_before_allowing !== true) {
    findings.push(`${context}.review_required_before_allowing must be true for non-first-party sources`);
  }
  if (Array.isArray(source.source_evidence)) {
    source.source_evidence.forEach((evidence, evidenceIndex) => {
      const evidenceContext = `${context}.source_evidence[${evidenceIndex}]`;
      if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
        findings.push(`${evidenceContext} must be an object`);
        return;
      }
      for (const key of ["evidence_type", "summary"]) {
        if (typeof evidence[key] !== "string" || evidence[key].trim().length === 0) {
          findings.push(`${evidenceContext}.${key} must be a non-empty string`);
        }
      }
      if (!isIsoDate(evidence.checked_at)) {
        findings.push(`${evidenceContext}.checked_at must be an ISO-compatible timestamp`);
      }
      if (evidence.supports_decision !== true) {
        findings.push(`${evidenceContext}.supports_decision must be true`);
      }
      const hasUrl = typeof evidence.url === "string" && evidence.url.trim().length > 0;
      const hasPath = typeof evidence.path === "string" && evidence.path.trim().length > 0;
      if (!hasUrl && !hasPath) {
        findings.push(`${evidenceContext} must include either url or path`);
      }
      if (hasUrl && !/^https?:\/\//.test(evidence.url)) {
        findings.push(`${evidenceContext}.url must be an http(s) URL`);
      }
      if (hasPath) {
        verifyHashPinnedPath(evidence, evidenceContext, findings);
      } else if ("sha256" in evidence && !isSha256(evidence.sha256)) {
        findings.push(`${evidenceContext}.sha256 must be a lowercase SHA-256 digest when present`);
      }
    });
  } else {
    findings.push(`${context}.source_evidence must be a non-empty array`);
  }
  if (Array.isArray(source.source_evidence) && source.source_evidence.length === 0) {
    findings.push(`${context}.source_evidence must be a non-empty array`);
  }
  return findings;
}

function hasExternalRightsReview(source, context, blockers) {
  const review = source.external_rights_review;
  const before = blockers.length;
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    blockers.push(`${context}.external_rights_review must be an approved review object`);
    return false;
  }
  if (review.status !== "approved_for_this_pilot") {
    blockers.push(`${context}.external_rights_review.status must be approved_for_this_pilot`);
  }
  if (!isIsoDate(review.reviewed_at)) {
    blockers.push(`${context}.external_rights_review.reviewed_at must be an ISO-compatible timestamp`);
  }
  for (const key of ["reviewer_name", "reviewer_role", "allowed_use_summary"]) {
    if (typeof review[key] !== "string" || review[key].trim().length === 0) {
      blockers.push(`${context}.external_rights_review.${key} must be a non-empty string`);
    }
  }
  if (review.is_project_operator !== false) {
    blockers.push(`${context}.external_rights_review.is_project_operator must be false`);
  }
  const scope = review.decision_scope;
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    blockers.push(`${context}.external_rights_review.decision_scope must be an object`);
  } else {
    for (const key of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
      if (scope[key] !== source[key]) {
        blockers.push(`${context}.external_rights_review.decision_scope.${key} must match source.${key}`);
      }
    }
  }
  const receiptFile = verifyHashPinnedPath(
    review.review_receipt,
    `${context}.external_rights_review.review_receipt`,
    blockers,
  );
  if (receiptFile && path.extname(receiptFile).toLowerCase() === ".json") {
    try {
      const receipt = readJson(receiptFile);
      if (receipt.schema_version !== "asl-pilot-external-rights-review-receipt/v1") {
        blockers.push(`${context}.external_rights_review.review_receipt schema_version is invalid`);
      }
      if (receipt.source_id !== source.source_id) {
        blockers.push(`${context}.external_rights_review.review_receipt source_id must match ${source.source_id}`);
      }
      if (receipt.decision_id !== source.decision_id) {
        blockers.push(`${context}.external_rights_review.review_receipt decision_id must match ${source.decision_id}`);
      }
      if (receipt.reviewer?.is_project_operator !== false) {
        blockers.push(`${context}.external_rights_review.review_receipt reviewer.is_project_operator must be false`);
      }
    } catch (error) {
      blockers.push(`${context}.external_rights_review.review_receipt is not valid JSON: ${error.message}`);
    }
  }
  if (!Array.isArray(review.license_evidence_files) || review.license_evidence_files.length === 0) {
    blockers.push(`${context}.external_rights_review.license_evidence_files must be a non-empty array`);
  } else {
    review.license_evidence_files.forEach((item, index) => {
      verifyHashPinnedPath(item, `${context}.external_rights_review.license_evidence_files[${index}]`, blockers);
    });
  }
  return blockers.length === before;
}

function validateRequiredFirstPartyEvidence(firstParty, blockers) {
  const required = [
    "clip-level consent record",
    "dataset consent form version and hash",
    "clip-level ASL label review approval",
  ];
  const evidence = Array.isArray(firstParty?.required_evidence) ? firstParty.required_evidence : [];
  for (const item of required) {
    if (!evidence.includes(item)) {
      blockers.push(`first-party-browser-consent-capture required_evidence must include ${item}`);
    }
  }
}

function validateDocumentedSourceIds(sourceIds, blockers) {
  for (const relativePath of documentedSourceIdFiles) {
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/"source_id"\s*:\s*"([^"]+)"/g)) {
      if (!sourceIds.has(match[1])) {
        blockers.push(`${relativePath} documents unknown source_id: ${match[1]}`);
      }
    }
  }
}

function validateResearchReceipts(reviewMethod, blockers) {
  const receipts = reviewMethod?.research_receipts;
  const receiptFile = verifyHashPinnedPath(receipts, "review_method.research_receipts", blockers);
  if (!receiptFile) return;
  if (projectRelative(receiptFile) !== "docs/research/dataset-source-research-receipts.json") {
    blockers.push("review_method.research_receipts.path must be docs/research/dataset-source-research-receipts.json");
  }
  if (receipts.generated_by !== "scripts/refresh_dataset_source_research.mjs") {
    blockers.push("review_method.research_receipts.generated_by must be scripts/refresh_dataset_source_research.mjs");
  }
  if (receipts.audited_by !== datasetSourceResearchAuditPath) {
    blockers.push(`review_method.research_receipts.audited_by must be ${datasetSourceResearchAuditPath}`);
  }
  if (!fs.existsSync(path.join(root, datasetSourceResearchAuditPath))) {
    blockers.push(`${datasetSourceResearchAuditPath} must exist`);
  }
  try {
    const receipt = readJson(receiptFile);
    if (receipt.schema_version !== "asl-pilot-dataset-source-research-receipts/v1") {
      blockers.push("dataset source research receipt schema_version is invalid");
    }
    if (receipt.status !== "passed") {
      blockers.push("dataset source research receipt status must be passed");
    }
    if (receipt.evidence_mode !== "research" || receipt.finality !== "not_training_data") {
      blockers.push("dataset source research receipt must be research evidence and not_training_data");
    }
    const sources = Array.isArray(receipt.sources) ? receipt.sources : [];
    for (const sourceId of ["asl-citizen", "wlasl", "asl-lex"]) {
      if (!sources.some((item) => item?.source_id === sourceId)) {
        blockers.push(`dataset source research receipt must include ${sourceId}`);
      }
    }
    for (const source of sources) {
      for (const key of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
        if (source?.decision?.[key] !== false) {
          blockers.push(`dataset source research receipt ${source?.source_id ?? "unknown"} decision.${key} must remain false`);
        }
      }
      if (source?.decision?.finality !== "research_reference_only") {
        blockers.push(`dataset source research receipt ${source?.source_id ?? "unknown"} must remain research_reference_only`);
      }
    }
  } catch (error) {
    blockers.push(`dataset source research receipt is invalid JSON: ${error.message}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const registerPath = args.register
    ? resolveProjectPath(args.register, "--register")
    : defaultRegisterPath;
  const blockers = [];
  if (!fs.existsSync(registerPath)) {
    blockers.push(`Source register does not exist: ${projectRelative(registerPath)}`);
  }
  let data = null;
  if (blockers.length === 0) {
    data = readJson(registerPath);
    if (data.schema_version !== "asl-pilot-dataset-source-register/v1") {
      blockers.push("Source register schema_version is invalid");
    }
    if (!isIsoDate(data.updated_at)) {
      blockers.push("Source register updated_at must be an ISO-compatible timestamp");
    }
    if (
      data.review_method?.default_public_dataset_policy !== "blocked_without_external_rights_review" ||
      data.review_method?.only_builtin_allowed_source_id !== "first-party-browser-consent-capture" ||
      !isIsoDate(data.review_method?.reviewed_at)
    ) {
      blockers.push("Source register review_method must declare blocked_without_external_rights_review and the first-party built-in source");
    }
    validateResearchReceipts(data.review_method, blockers);
    if (!Array.isArray(data.sources)) {
      blockers.push("Source register sources must be an array");
    } else {
      data.sources.forEach((source, index) => blockers.push(...validateSource(source, index)));
      const byId = new Map();
      const decisionIds = new Set();
      for (const [index, source] of data.sources.entries()) {
        if (!source || typeof source !== "object") continue;
        if (typeof source.source_id === "string") {
          if (byId.has(source.source_id)) blockers.push(`Duplicate source_id: ${source.source_id}`);
          byId.set(source.source_id, source);
        }
        if (typeof source.decision_id === "string") {
          if (decisionIds.has(source.decision_id)) blockers.push(`Duplicate decision_id: ${source.decision_id}`);
          decisionIds.add(source.decision_id);
        } else {
          blockers.push(`sources[${index}].decision_id must be a string`);
        }
      }
      for (const sourceId of requiredSources) {
        if (!byId.has(sourceId)) blockers.push(`Missing source decision: ${sourceId}`);
      }
      const firstParty = byId.get("first-party-browser-consent-capture");
      if (firstParty?.allowed_for_model_training !== true) {
        blockers.push("First-party browser consent capture must be allowed for model training after clip-level consent");
      }
      validateRequiredFirstPartyEvidence(firstParty, blockers);
      for (const sourceId of blockedPublicSources) {
        const source = byId.get(sourceId);
        if (!source) continue;
        if (
          source.allowed_for_model_training !== false ||
          source.allowed_for_validation !== false ||
          source.allowed_for_pilot_submission !== false
        ) {
          blockers.push(`${sourceId} must remain blocked unless a new reviewed source decision is added`);
        }
      }
      for (const source of data.sources) {
        if (!source || typeof source !== "object" || Array.isArray(source)) continue;
        const anyAllowed =
          source.allowed_for_model_training === true ||
          source.allowed_for_validation === true ||
          source.allowed_for_pilot_submission === true;
        if (anyAllowed && !firstPartyAllowedSources.has(source.source_id) && !hasExternalRightsReview(source, source.source_id, blockers)) {
          blockers.push(
            `${source.source_id} is marked allowed without hash-verified external_rights_review approved_for_this_pilot evidence`,
          );
        }
      }
      validateDocumentedSourceIds(new Set(byId.keys()), blockers);
    }
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    register: {
      path: projectRelative(registerPath),
      exists: fs.existsSync(registerPath),
      sha256: fs.existsSync(registerPath) ? sha256File(registerPath) : null,
    },
    source_count: Array.isArray(data?.sources) ? data.sources.length : 0,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Source register audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Source register audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
