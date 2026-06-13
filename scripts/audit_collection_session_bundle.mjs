import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateCollectionPlanMatchesFreshGeneration,
  validateCollectionPlanReviewGateFresh,
} from "./collection_plan_freshness_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultRemediationQueuePath = path.join(
  root,
  "data",
  "dataset",
  "canonical-verifier-010-collection-queue.json",
);
const canonicalCollectionPacketRelativePath = "docs/validation/canonical-verifier-collection-packet.json";
const defaultNegativeChallengeGapPacketPath = path.join(root, "docs", "validation", "final-negative-challenge-gap-packet.json");
const defaultBundlePath = path.join(root, "output", "collection-handoff", "collection-session-bundle");
const acceptedVocabularyGateStatuses = new Set(["reviewed", "source_curated"]);
const generatorDependencyPaths = [
  "scripts/prepare_collection_session_bundle.mjs",
  "scripts/collection_plan_freshness_utils.mjs",
];
const preCaptureAuditCommands = [
  "node scripts/audit_vocabulary_review.mjs",
  "node scripts/audit_hint_pedagogy_review.mjs",
  "node scripts/audit_reviewed_vocabulary_collection_gate.mjs",
  "node scripts/audit_collection_plan_freshness.mjs",
  "node scripts/audit_collection_plan_contract.mjs",
  "node scripts/audit_collection_session_bundle.mjs --require-ready",
];
const postCollectionOpeningCommands = [
  "node scripts/export_clip_review_packet.mjs",
  "node scripts/export_challenge_review_packet.mjs",
];
const postCollectionClosingCommands = [
  "node scripts/report_post_collection_evidence_status.mjs --write",
  "node scripts/audit_post_collection_evidence_status.mjs",
  "node scripts/process_collected_dataset_evidence.mjs",
  "node scripts/process_collected_dataset_evidence.mjs --apply",
];

function parseArgs(argv) {
  const args = {
    plan: defaultPlanPath,
    bundle: defaultBundlePath,
    requireReady: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--require-ready") {
      args.requireReady = true;
      continue;
    }
    if (item === "--plan" || item === "--bundle") {
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
  node scripts/audit_collection_session_bundle.mjs [--require-ready] [--plan data/dataset/collection-plan.json] [--bundle output/collection-handoff/collection-session-bundle]

Verifies that the ignored operator collection-session bundle matches the current
collection plan, that every manifest-listed file exists with the expected hash,
and that the bundle does not contain unmanifested stale files. With
--require-ready, draft_not_for_capture bundles fail even when their hashes are
fresh.
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

function sourceFileRecord(relativePath) {
  return {
    path: relativePath,
    sha256: sha256File(path.join(root, relativePath)),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return [fullPath];
  });
}

function sameStringList(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function validateSignerAliasForCommand(signerAlias) {
  if (!/^[A-Za-z0-9._-]+$/.test(signerAlias)) {
    throw new Error(`signer alias is not safe for generated shell commands: ${signerAlias}`);
  }
}

function signedConsentReceiptPath(signerAlias) {
  validateSignerAliasForCommand(signerAlias);
  return `data/signer-identity/${signerAlias}-signed-consent.json`;
}

function signedConsentReceiptCommands(signerAlias) {
  const output = signedConsentReceiptPath(signerAlias);
  return [
    `node scripts/draft_signed_consent_receipt.mjs --input data/signer-identity/signer-identity-evidence.json --signer-alias ${signerAlias} --output ${output} --write`,
    `node scripts/draft_signed_consent_receipt.mjs --input data/signer-identity/signer-identity-evidence.json --signer-alias ${signerAlias} --output ${output} --private-key path/to/signer-ed25519-private-key.pem --write --force --verify --update-packet`,
  ];
}

function doNotCaptureReason(plan) {
  if (acceptedVocabularyGateStatuses.has(plan.review_gate?.status)) return null;
  return `Collection plan review_gate.status is ${plan.review_gate?.status ?? "missing"}; import final vocabulary evidence and regenerate the plan before capture.`;
}

function expectedSignerAliases(plan) {
  const aliases = [];
  for (const splitAliases of Object.values(plan.planned_signers ?? {})) {
    if (Array.isArray(splitAliases)) aliases.push(...splitAliases);
  }
  if (Array.isArray(plan.planned_negative_challenge_signers)) {
    aliases.push(...plan.planned_negative_challenge_signers);
  }
  return aliases.sort((left, right) => left.localeCompare(right));
}

function expectedPostCollectionCommands(plan) {
  return [
    ...postCollectionOpeningCommands,
    ...expectedSignerAliases(plan).flatMap((signerAlias) => signedConsentReceiptCommands(signerAlias)),
    ...postCollectionClosingCommands,
  ];
}

function expectedManifestFilePaths(plan, bundlePath) {
  const paths = [
    path.join(bundlePath, "signer-roster.csv"),
    path.join(bundlePath, "vocabulary-assignments.csv"),
    path.join(bundlePath, "negative-challenge-assignments.csv"),
    ...expectedSignerAliases(plan).map((alias) => path.join(bundlePath, "signer-sheets", `${alias}.md`)),
  ];
  if (fs.existsSync(defaultRemediationQueuePath)) {
    paths.push(path.join(bundlePath, "remediation-collection-queue.csv"));
  }
  if (fs.existsSync(defaultNegativeChallengeGapPacketPath)) {
    paths.push(path.join(bundlePath, "negative-challenge-gap-assignments.csv"));
  }
  return paths.map(projectRelative);
}

function validateManifest(manifest, plan, planPath, bundlePath, options = {}) {
  const blockers = [];
  if (manifest.schema_version !== "asl-pilot-collection-session-bundle/v1") {
    blockers.push("MANIFEST.json schema_version must be asl-pilot-collection-session-bundle/v1");
  }
  if (manifest.bundle_root !== projectRelative(bundlePath)) {
    blockers.push(`MANIFEST.json bundle_root must be ${projectRelative(bundlePath)}`);
  }
  const expectedStatus = acceptedVocabularyGateStatuses.has(plan.review_gate?.status) ? "ready_for_capture" : "draft_not_for_capture";
  if (manifest.status !== expectedStatus) {
    blockers.push(`MANIFEST.json status must be ${expectedStatus}`);
  }
  const expectedCaptureReady = expectedStatus === "ready_for_capture";
  if (manifest.capture_ready !== expectedCaptureReady) {
    blockers.push(`MANIFEST.json capture_ready must be ${expectedCaptureReady}`);
  }
  const expectedDoNotCaptureReason = doNotCaptureReason(plan);
  if (manifest.do_not_capture_reason !== expectedDoNotCaptureReason) {
    blockers.push(`MANIFEST.json do_not_capture_reason must be ${JSON.stringify(expectedDoNotCaptureReason)}`);
  }
  blockers.push(...validateGeneratedBy(manifest.generated_by));
  if (options.requireReady && manifest.status !== "ready_for_capture") {
    blockers.push(`MANIFEST.json status must be ready_for_capture for pre-capture use; found ${manifest.status ?? "missing"}`);
  }
  if (options.requireReady && manifest.capture_ready !== true) {
    blockers.push(`MANIFEST.json capture_ready must be true for pre-capture use; found ${manifest.capture_ready ?? "missing"}`);
  }
  if (options.requireReady && !acceptedVocabularyGateStatuses.has(plan.review_gate?.status)) {
    blockers.push(`collection plan review_gate.status must be reviewed or source_curated for pre-capture use; found ${plan.review_gate?.status ?? "missing"}`);
  }
  if (options.requireReady && Array.isArray(plan.warnings) && plan.warnings.length > 0) {
    blockers.push(`collection plan warnings must be resolved for pre-capture use: ${plan.warnings.join("; ")}`);
  }
  if (options.requireReady) {
    blockers.push(...validateCollectionPlanReviewGateFresh(plan));
    blockers.push(...validateCollectionPlanMatchesFreshGeneration(plan));
  }
  if (manifest.collection_plan?.path !== projectRelative(planPath)) {
    blockers.push(`MANIFEST.json collection_plan.path must be ${projectRelative(planPath)}`);
  }
  if (manifest.collection_plan?.sha256 !== sha256File(planPath)) {
    blockers.push("MANIFEST.json collection_plan.sha256 must match the current collection plan");
  }
  if (manifest.collection_plan?.review_gate_status !== (plan.review_gate?.status ?? null)) {
    blockers.push("MANIFEST.json collection_plan.review_gate_status must match the current collection plan");
  }
  if (manifest.assignment_count !== plan.assignment_count) {
    blockers.push("MANIFEST.json assignment_count must match the current collection plan");
  }
  if (manifest.negative_challenge_assignment_count !== plan.negative_challenge_assignment_count) {
    blockers.push("MANIFEST.json negative_challenge_assignment_count must match the current collection plan");
  }
  if (JSON.stringify(manifest.targets ?? null) !== JSON.stringify(plan.targets ?? null)) {
    blockers.push("MANIFEST.json targets must match the current collection plan");
  }
  if (JSON.stringify(manifest.planned_signer_counts ?? null) !== JSON.stringify(plan.planned_signer_counts ?? null)) {
    blockers.push("MANIFEST.json planned_signer_counts must match the current collection plan");
  }
  if (JSON.stringify(manifest.warnings ?? []) !== JSON.stringify(Array.isArray(plan.warnings) ? plan.warnings : [])) {
    blockers.push("MANIFEST.json warnings must match the current collection plan");
  }
  blockers.push(...validateRemediationQueue(manifest, plan, planPath, bundlePath));
  blockers.push(...validateNegativeChallengeGapPacket(manifest, planPath, bundlePath));
  blockers.push(...validateOperatorRequirements(manifest.operator_requirements, plan));
  return blockers;
}

function validateRemediationQueue(manifest, plan, planPath, bundlePath) {
  const blockers = [];
  const priorityFile = projectRelative(path.join(bundlePath, "remediation-collection-queue.csv"));
  if (!fs.existsSync(defaultRemediationQueuePath)) {
    if (manifest.remediation_queue !== null && manifest.remediation_queue !== undefined) {
      blockers.push("MANIFEST.json remediation_queue must be null when no remediation queue exists");
    }
    if (manifest.operator_requirements?.require_capture_priority_queue !== false) {
      blockers.push("MANIFEST.json operator_requirements.require_capture_priority_queue must be false when no remediation queue exists");
    }
    if (manifest.operator_requirements?.capture_priority_file !== null) {
      blockers.push("MANIFEST.json operator_requirements.capture_priority_file must be null when no remediation queue exists");
    }
    return blockers;
  }
  const queue = readJson(defaultRemediationQueuePath);
  const planVocabularyKeys = new Set((plan.assignments ?? []).map((_, index) => `vocabulary:${index}`));
  const planChallengeKeys = new Set((plan.negative_challenge_assignments ?? []).map((_, index) => `negative_challenge:${index}`));
  const isCanonicalSubsetQueue = queue.inputs?.canonical_collection_packet?.path === canonicalCollectionPacketRelativePath;
  const expectedAssignmentCount = queue.queue_summary?.assignment_count ?? null;
  if (manifest.remediation_queue?.path !== projectRelative(defaultRemediationQueuePath)) {
    blockers.push(`MANIFEST.json remediation_queue.path must be ${projectRelative(defaultRemediationQueuePath)}`);
  }
  if (manifest.remediation_queue?.sha256 !== sha256File(defaultRemediationQueuePath)) {
    blockers.push("MANIFEST.json remediation_queue.sha256 must match the current remediation queue");
  }
  if (manifest.remediation_queue?.status !== "queue_ready_not_training_data") {
    blockers.push("MANIFEST.json remediation_queue.status must be queue_ready_not_training_data");
  }
  if (manifest.remediation_queue?.assignment_count !== expectedAssignmentCount) {
    blockers.push("MANIFEST.json remediation_queue.assignment_count must match the current remediation queue");
  }
  if (!isCanonicalSubsetQueue && expectedAssignmentCount !== ((plan.assignment_count ?? 0) + (plan.negative_challenge_assignment_count ?? 0))) {
    blockers.push("Full remediation queue assignment_count must match the current collection plan");
  }
  if (queue.inputs?.collection_plan?.path !== projectRelative(planPath)) {
    blockers.push("Remediation queue input collection_plan.path must match the current collection plan");
  }
  if (queue.inputs?.collection_plan?.sha256 !== sha256File(planPath)) {
    blockers.push("Remediation queue input collection_plan.sha256 must match the current collection plan");
  }
  if (!Array.isArray(queue.queue) || queue.queue.length === 0) {
    blockers.push("Remediation queue must include queue rows");
  } else {
    for (const row of queue.queue) {
      if (row.assignment_type === "vocabulary_capture" && !planVocabularyKeys.has(String(row.assignment_key ?? ""))) {
        blockers.push(`Remediation queue row ${row.queue_index ?? "(missing index)"} vocabulary assignment_key is not in the current collection plan`);
      }
      if (row.assignment_type === "negative_challenge_capture" && !planChallengeKeys.has(String(row.assignment_key ?? ""))) {
        blockers.push(`Remediation queue row ${row.queue_index ?? "(missing index)"} negative challenge assignment_key is not in the current collection plan`);
      }
    }
  }
  if (manifest.operator_requirements?.require_capture_priority_queue !== true) {
    blockers.push("MANIFEST.json operator_requirements.require_capture_priority_queue must be true when a remediation queue exists");
  }
  if (manifest.operator_requirements?.capture_priority_file !== priorityFile) {
    blockers.push(`MANIFEST.json operator_requirements.capture_priority_file must be ${priorityFile}`);
  }
  return blockers;
}

function validateNegativeChallengeGapPacket(manifest, planPath, bundlePath) {
  const blockers = [];
  const gapFile = projectRelative(path.join(bundlePath, "negative-challenge-gap-assignments.csv"));
  if (!fs.existsSync(defaultNegativeChallengeGapPacketPath)) {
    if (manifest.negative_challenge_gap_packet !== null && manifest.negative_challenge_gap_packet !== undefined) {
      blockers.push("MANIFEST.json negative_challenge_gap_packet must be null when no final gap packet exists");
    }
    if (manifest.operator_requirements?.require_negative_challenge_gap_packet !== false) {
      blockers.push("MANIFEST.json operator_requirements.require_negative_challenge_gap_packet must be false when no final gap packet exists");
    }
    if (manifest.operator_requirements?.negative_challenge_gap_file !== null) {
      blockers.push("MANIFEST.json operator_requirements.negative_challenge_gap_file must be null when no final gap packet exists");
    }
    return blockers;
  }
  const packet = readJson(defaultNegativeChallengeGapPacketPath);
  if (manifest.negative_challenge_gap_packet?.path !== projectRelative(defaultNegativeChallengeGapPacketPath)) {
    blockers.push(`MANIFEST.json negative_challenge_gap_packet.path must be ${projectRelative(defaultNegativeChallengeGapPacketPath)}`);
  }
  if (manifest.negative_challenge_gap_packet?.sha256 !== sha256File(defaultNegativeChallengeGapPacketPath)) {
    blockers.push("MANIFEST.json negative_challenge_gap_packet.sha256 must match the current gap packet");
  }
  if (manifest.negative_challenge_gap_packet?.status !== packet.status) {
    blockers.push("MANIFEST.json negative_challenge_gap_packet.status must match the current gap packet");
  }
  if (manifest.negative_challenge_gap_packet?.missing_clip_count !== packet.missing_clip_count) {
    blockers.push("MANIFEST.json negative_challenge_gap_packet.missing_clip_count must match the current gap packet");
  }
  if (manifest.negative_challenge_gap_packet?.selected_assignment_count !== packet.selected_assignment_count) {
    blockers.push("MANIFEST.json negative_challenge_gap_packet.selected_assignment_count must match the current gap packet");
  }
  if (JSON.stringify(manifest.negative_challenge_gap_packet?.selected_assignment_counts_by_type ?? null) !== JSON.stringify(packet.selected_assignment_counts_by_type ?? null)) {
    blockers.push("MANIFEST.json negative_challenge_gap_packet.selected_assignment_counts_by_type must match the current gap packet");
  }
  if (packet.inputs?.collection_plan?.path !== projectRelative(planPath)) {
    blockers.push("Final negative challenge gap packet input collection_plan.path must match the current collection plan");
  }
  if (packet.inputs?.collection_plan?.sha256 !== sha256File(planPath)) {
    blockers.push("Final negative challenge gap packet input collection_plan.sha256 must match the current collection plan");
  }
  if (!Array.isArray(packet.selected_assignments) || packet.selected_assignments.length !== packet.selected_assignment_count) {
    blockers.push("Final negative challenge gap packet selected_assignments must match selected_assignment_count");
  }
  if (manifest.operator_requirements?.require_negative_challenge_gap_packet !== true) {
    blockers.push("MANIFEST.json operator_requirements.require_negative_challenge_gap_packet must be true when a final gap packet exists");
  }
  if (manifest.operator_requirements?.negative_challenge_gap_file !== gapFile) {
    blockers.push(`MANIFEST.json operator_requirements.negative_challenge_gap_file must be ${gapFile}`);
  }
  return blockers;
}

function validateGeneratedBy(generatedBy) {
  const blockers = [];
  if (!generatedBy || typeof generatedBy !== "object" || Array.isArray(generatedBy)) {
    return ["MANIFEST.json generated_by must describe the current collection bundle generator"];
  }
  if (generatedBy.tool !== "scripts/prepare_collection_session_bundle.mjs") {
    blockers.push("MANIFEST.json generated_by.tool must be scripts/prepare_collection_session_bundle.mjs");
  }
  const expectedScript = sourceFileRecord("scripts/prepare_collection_session_bundle.mjs");
  if (generatedBy.script?.path !== expectedScript.path) {
    blockers.push(`MANIFEST.json generated_by.script.path must be ${expectedScript.path}`);
  }
  if (generatedBy.script?.sha256 !== expectedScript.sha256) {
    blockers.push("MANIFEST.json generated_by.script.sha256 must match the current bundle generator");
  }
  const expectedDependencies = generatorDependencyPaths
    .filter((relativePath) => relativePath !== "scripts/prepare_collection_session_bundle.mjs")
    .map(sourceFileRecord);
  const actualDependencies = Array.isArray(generatedBy.dependencies) ? generatedBy.dependencies : [];
  if (actualDependencies.length !== expectedDependencies.length) {
    blockers.push("MANIFEST.json generated_by.dependencies must include the current generator helper files");
  }
  for (const expected of expectedDependencies) {
    const actual = actualDependencies.find((item) => item?.path === expected.path);
    if (!actual) {
      blockers.push(`MANIFEST.json generated_by.dependencies must include ${expected.path}`);
      continue;
    }
    if (actual.sha256 !== expected.sha256) {
      blockers.push(`MANIFEST.json generated_by.dependencies ${expected.path} sha256 must match the current file`);
    }
  }
  return blockers;
}

function validateOperatorRequirements(requirements, plan) {
  const blockers = [];
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) {
    return ["MANIFEST.json operator_requirements must be an object"];
  }
  const expected = {
    required_ready_status: "ready_for_capture",
    draft_status: "draft_not_for_capture",
    app_url: "http://127.0.0.1:3025",
    require_accepted_vocabulary_evidence: true,
    require_current_collection_plan: true,
    require_assignment_keys: true,
    require_consent_checkboxes: true,
    require_signer_identity_for_each_planned_alias: true,
    require_signed_consent_receipt_for_each_planned_alias: true,
    require_vocabulary_signer_split_boundaries: true,
    require_negative_challenge_signer_disjointness: true,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (requirements[key] !== value) {
      blockers.push(`MANIFEST.json operator_requirements.${key} must be ${JSON.stringify(value)}`);
    }
  }
  if (!sameStringList(requirements.collection_mode_env, [
    "ENABLE_DATASET_COLLECTION=true",
    "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true",
  ])) {
    blockers.push("MANIFEST.json operator_requirements.collection_mode_env must include both collection-mode env vars");
  }
  if (!sameStringList(requirements.pre_capture_audit_commands, preCaptureAuditCommands)) {
    blockers.push("MANIFEST.json operator_requirements.pre_capture_audit_commands must include the canonical pre-capture audits");
  }
  const signerAliases = expectedSignerAliases(plan);
  if (!sameStringList(requirements.planned_consent_signer_aliases, signerAliases)) {
    blockers.push("MANIFEST.json operator_requirements.planned_consent_signer_aliases must match every planned signer alias");
  }
  if (!sameStringList(requirements.signed_consent_receipt_outputs, signerAliases.map((signerAlias) => signedConsentReceiptPath(signerAlias)))) {
    blockers.push("MANIFEST.json operator_requirements.signed_consent_receipt_outputs must include one output per planned signer alias");
  }
  if (!sameStringList(requirements.post_collection_commands, expectedPostCollectionCommands(plan))) {
    blockers.push("MANIFEST.json operator_requirements.post_collection_commands must include the canonical alias-complete post-collection intake commands");
  }
  return blockers;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (char !== "\r") cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function validateCsvCaptureReadyColumns(file, manifest) {
  const blockers = [];
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (rows.length < 2) {
    return [`${projectRelative(file)} must contain a header and at least one data row`];
  }
  const header = rows[0];
  for (const column of ["bundle_status", "capture_ready", "do_not_capture_reason"]) {
    if (!header.includes(column)) {
      blockers.push(`${projectRelative(file)} must include ${column} column`);
    }
  }
  const statusIndex = header.indexOf("bundle_status");
  const captureReadyIndex = header.indexOf("capture_ready");
  const reasonIndex = header.indexOf("do_not_capture_reason");
  for (const [rowIndex, row] of rows.slice(1).entries()) {
    const context = `${projectRelative(file)} row ${rowIndex + 2}`;
    if (statusIndex >= 0 && row[statusIndex] !== manifest.status) {
      blockers.push(`${context} bundle_status must be ${manifest.status}`);
    }
    if (captureReadyIndex >= 0 && row[captureReadyIndex] !== String(manifest.capture_ready)) {
      blockers.push(`${context} capture_ready must be ${String(manifest.capture_ready)}`);
    }
    if (reasonIndex >= 0 && row[reasonIndex] !== (manifest.do_not_capture_reason ?? "")) {
      blockers.push(`${context} do_not_capture_reason must match MANIFEST.json`);
    }
  }
  return blockers;
}

function validateFiles(manifest, plan, bundlePath) {
  const blockers = [];
  const records = Array.isArray(manifest.files) ? manifest.files : [];
  if (records.length === 0) {
    blockers.push("MANIFEST.json files must be a non-empty array");
    return blockers;
  }
  const manifestPath = path.join(bundlePath, "MANIFEST.json");
  const readmePath = path.join(bundlePath, "OPERATOR_README.md");
  if (!fs.existsSync(readmePath)) {
    blockers.push("OPERATOR_README.md is missing from the bundle");
  } else {
    blockers.push(...validateReadme(readmePath, manifest));
  }
  const recordPaths = new Set(records.map((record) => record?.path).filter((item) => typeof item === "string"));
  for (const expectedPath of expectedManifestFilePaths(plan, bundlePath)) {
    if (!recordPaths.has(expectedPath)) {
      blockers.push(`MANIFEST.json files must include required bundle file: ${expectedPath}`);
    }
  }
  const expectedFiles = new Set([
    projectRelative(manifestPath),
    projectRelative(readmePath),
  ]);
  for (const [index, record] of records.entries()) {
    const context = `MANIFEST.json files[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      blockers.push(`${context} must be an object`);
      continue;
    }
    if (typeof record.path !== "string" || record.path.trim().length === 0) {
      blockers.push(`${context}.path must be a non-empty string`);
      continue;
    }
    const file = resolveProjectPath(record.path, `${context}.path`);
    if (!file.startsWith(`${bundlePath}${path.sep}`)) {
      blockers.push(`${context}.path must stay inside the bundle root`);
      continue;
    }
    expectedFiles.add(projectRelative(file));
    if (!fs.existsSync(file)) {
      blockers.push(`${context}.path is missing: ${record.path}`);
      continue;
    }
    if (!/^[a-f0-9]{64}$/.test(String(record.sha256 ?? ""))) {
      blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    } else if (record.sha256 !== sha256File(file)) {
      blockers.push(`${context}.sha256 must match ${record.path}`);
    }
    if (typeof record.purpose !== "string" || record.purpose.trim().length === 0) {
      blockers.push(`${context}.purpose must be a non-empty string`);
    }
    if (
      record.path.endsWith("/signer-roster.csv") ||
      record.path.endsWith("/vocabulary-assignments.csv") ||
      record.path.endsWith("/negative-challenge-assignments.csv") ||
      record.path.endsWith("/negative-challenge-gap-assignments.csv")
    ) {
      blockers.push(...validateCsvCaptureReadyColumns(file, manifest));
    }
    if (manifest.status === "draft_not_for_capture" && record.path.includes("/signer-sheets/")) {
      const sheet = fs.readFileSync(file, "utf8");
      for (const snippet of draftOnlySnippets(manifest)) {
        if (!sheet.includes(snippet)) {
          blockers.push(`${record.path} must include ${snippet}`);
        }
      }
    }
  }
  for (const file of walkFiles(bundlePath)) {
    const relativePath = projectRelative(file);
    if (!expectedFiles.has(relativePath)) {
      blockers.push(`Bundle contains unmanifested file: ${relativePath}`);
    }
  }
  return blockers;
}

function draftOnlySnippets(manifest) {
  return [
    "DRAFT ONLY: DO NOT CAPTURE",
    "capture_ready: false",
    `do_not_capture_reason: ${manifest.do_not_capture_reason}`,
    "audit_collection_session_bundle.mjs --require-ready",
  ];
}

function validateReadme(readmePath, manifest) {
  const blockers = [];
  const readme = fs.readFileSync(readmePath, "utf8");
  const requiredSnippets = [
    "ENABLE_DATASET_COLLECTION=true",
    "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true",
    "http://127.0.0.1:3025",
    "Use only the assignment keys in this bundle.",
    "If present, follow `remediation-collection-queue.csv` for capture order",
    "If present, use `negative-challenge-gap-assignments.csv` as the exact",
    "Record raw clips only after every consent checkbox is checked.",
    "Vocabulary signers must stay in their assigned split.",
    "Negative challenge signers must stay disjoint from vocabulary signers.",
    "Signed consent receipt commands must be run for every planned signer alias in `signer-roster.csv`.",
    "The consent receipt commands below are expanded for every planned signer alias",
    "node scripts/audit_collection_session_bundle.mjs",
    "node scripts/report_post_collection_evidence_status.mjs --write",
    "node scripts/process_collected_dataset_evidence.mjs --apply",
    `Status: \`${manifest.status}\``,
    `Plan SHA-256: \`${manifest.collection_plan?.sha256}\``,
  ];
  if (manifest.negative_challenge_gap_packet) {
    requiredSnippets.push(`Negative challenge gap packet: \`${manifest.negative_challenge_gap_packet.path}\``);
  }
  if (manifest.operator_requirements?.negative_challenge_gap_file) {
    requiredSnippets.push(`Negative challenge gap assignments: \`${manifest.operator_requirements.negative_challenge_gap_file}\``);
  }
  if (manifest.status === "draft_not_for_capture") {
    requiredSnippets.push("This is a draft planning bundle. Do not use it for capture.");
    requiredSnippets.push(...draftOnlySnippets(manifest));
  }
  for (const command of preCaptureAuditCommands) requiredSnippets.push(command);
  if (Array.isArray(manifest.operator_requirements?.post_collection_commands)) {
    for (const command of manifest.operator_requirements.post_collection_commands) requiredSnippets.push(command);
  }
  for (const snippet of requiredSnippets) {
    if (!readme.includes(snippet)) {
      blockers.push(`OPERATOR_README.md must include ${snippet}`);
    }
  }
  return blockers;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const planPath = resolveProjectPath(args.plan, "--plan");
  const bundlePath = resolveProjectPath(args.bundle, "--bundle");
  const manifestPath = path.join(bundlePath, "MANIFEST.json");
  const blockers = [];
  if (!fs.existsSync(planPath)) blockers.push(`collection plan is missing: ${projectRelative(planPath)}`);
  if (!fs.existsSync(manifestPath)) blockers.push(`collection session bundle manifest is missing: ${projectRelative(manifestPath)}`);
  let plan = null;
  let manifest = null;
  if (blockers.length === 0) {
    plan = readJson(planPath);
    manifest = readJson(manifestPath);
    blockers.push(...validateManifest(manifest, plan, planPath, bundlePath, {
      requireReady: args.requireReady,
    }));
    blockers.push(...validateFiles(manifest, plan, bundlePath));
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    plan: projectRelative(planPath),
    bundle: projectRelative(bundlePath),
    manifest: projectRelative(manifestPath),
    require_ready: args.requireReady,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Collection session bundle audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Collection session bundle audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
