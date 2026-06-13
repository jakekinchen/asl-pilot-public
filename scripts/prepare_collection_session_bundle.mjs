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
const defaultNegativeChallengeGapPacketPath = path.join(root, "docs", "validation", "final-negative-challenge-gap-packet.json");
const defaultOutputPath = path.join(root, "output", "collection-handoff", "collection-session-bundle");
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
    output: defaultOutputPath,
    allowDraft: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--allow-draft") {
      args.allowDraft = true;
      continue;
    }
    if (item === "--plan" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--plan") args.plan = value;
      if (item === "--output") args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/prepare_collection_session_bundle.mjs
  node scripts/prepare_collection_session_bundle.mjs --allow-draft

Builds operator-facing CSVs and per-signer capture sheets from an accepted
collection plan. Draft plans are refused unless --allow-draft is passed, and
draft output is marked not for capture.
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

function validateOutputPath(outputPath) {
  const relative = projectRelative(outputPath);
  const defaultRelative = projectRelative(defaultOutputPath);
  if (relative !== defaultRelative && !relative.startsWith(`${defaultRelative}/`)) {
    throw new Error(`--output must be ${defaultRelative} or a child path under it`);
  }
}

function resolveOutputPath(value) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`--output escapes project root: ${value}`);
  }
  validateOutputPath(resolved);
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sourceFileRecord(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: sha256File(file),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readFreshRemediationQueue(planPath, plan) {
  if (!fs.existsSync(defaultRemediationQueuePath)) return null;
  const queue = readJson(defaultRemediationQueuePath);
  const blockers = [];
  const planVocabularyKeys = new Set((plan.assignments ?? []).map((_, index) => `vocabulary:${index}`));
  const planChallengeKeys = new Set((plan.negative_challenge_assignments ?? []).map((_, index) => `negative_challenge:${index}`));
  const isCanonicalSubsetQueue = queue.inputs?.canonical_collection_packet?.path ===
    "docs/validation/canonical-verifier-collection-packet.json";
  if (queue.schema_version !== "asl-pilot-rawframe-remediation-collection-queue/v1") {
    blockers.push("rawframe remediation queue schema_version is invalid");
  }
  if (queue.status !== "queue_ready_not_training_data") {
    blockers.push("rawframe remediation queue status must be queue_ready_not_training_data");
  }
  if (queue.inputs?.collection_plan?.path !== projectRelative(planPath)) {
    blockers.push("rawframe remediation queue must reference the current collection plan path");
  }
  if (queue.inputs?.collection_plan?.sha256 !== sha256File(planPath)) {
    blockers.push("rawframe remediation queue collection plan SHA-256 must match the current collection plan");
  }
  if (
    !isCanonicalSubsetQueue &&
    queue.queue_summary?.assignment_count !== ((plan.assignment_count ?? 0) + (plan.negative_challenge_assignment_count ?? 0))
  ) {
    blockers.push("rawframe remediation queue assignment_count must match the current collection plan");
  }
  if (!Array.isArray(queue.queue) || queue.queue.length === 0) {
    blockers.push("rawframe remediation queue must include queue rows");
  } else {
    for (const row of queue.queue) {
      if (row.assignment_type === "vocabulary_capture" && !/^vocabulary:\d+$/.test(String(row.assignment_key ?? ""))) {
        blockers.push(`rawframe remediation queue row ${row.queue_index ?? "(missing index)"} has an invalid vocabulary assignment_key`);
      }
      if (row.assignment_type === "vocabulary_capture" && !planVocabularyKeys.has(String(row.assignment_key ?? ""))) {
        blockers.push(`rawframe remediation queue row ${row.queue_index ?? "(missing index)"} vocabulary assignment_key is not in the current collection plan`);
      }
      if (row.assignment_type === "negative_challenge_capture" && !/^negative_challenge:\d+$/.test(String(row.assignment_key ?? ""))) {
        blockers.push(`rawframe remediation queue row ${row.queue_index ?? "(missing index)"} has an invalid negative challenge assignment_key`);
      }
      if (row.assignment_type === "negative_challenge_capture" && !planChallengeKeys.has(String(row.assignment_key ?? ""))) {
        blockers.push(`rawframe remediation queue row ${row.queue_index ?? "(missing index)"} negative challenge assignment_key is not in the current collection plan`);
      }
    }
  }
  if (blockers.length > 0) {
    throw new Error(`rawframe remediation queue is stale or invalid: ${blockers.join("; ")}`);
  }
  return {
    path: defaultRemediationQueuePath,
    sha256: sha256File(defaultRemediationQueuePath),
    queue,
  };
}

function readFreshNegativeChallengeGapPacket(planPath) {
  if (!fs.existsSync(defaultNegativeChallengeGapPacketPath)) return null;
  const packet = readJson(defaultNegativeChallengeGapPacketPath);
  const blockers = [];
  if (packet.schema_version !== "asl-pilot-final-negative-challenge-gap-packet/v1") {
    blockers.push("final negative challenge gap packet schema_version is invalid");
  }
  if (packet.inputs?.collection_plan?.path !== projectRelative(planPath)) {
    blockers.push("final negative challenge gap packet must reference the current collection plan path");
  }
  if (packet.inputs?.collection_plan?.sha256 !== sha256File(planPath)) {
    blockers.push("final negative challenge gap packet collection plan SHA-256 must match the current collection plan");
  }
  if (packet.decision_boundary?.changes_store !== false || packet.decision_boundary?.changes_manifests !== false) {
    blockers.push("final negative challenge gap packet must remain non-mutating guidance");
  }
  if (packet.decision_boundary?.final_model_evidence !== false) {
    blockers.push("final negative challenge gap packet must not claim final model evidence");
  }
  if (!Array.isArray(packet.selected_assignments)) {
    blockers.push("final negative challenge gap packet must include selected_assignments");
  } else {
    if (packet.selected_assignment_count !== packet.selected_assignments.length) {
      blockers.push("final negative challenge gap packet selected_assignment_count is stale");
    }
    for (const assignment of packet.selected_assignments) {
      if (!/^negative_challenge:\d+$/.test(String(assignment.assignment_key ?? ""))) {
        blockers.push(`final negative challenge gap assignment has invalid assignment_key: ${assignment.assignment_key ?? "(missing)"}`);
      }
      if (assignment.operator_action !== "record_first_party_reject_only_clip") {
        blockers.push(`final negative challenge gap assignment ${assignment.assignment_key ?? "(missing)"} has invalid operator_action`);
      }
    }
  }
  if (blockers.length > 0) {
    throw new Error(`final negative challenge gap packet is stale or invalid: ${blockers.join("; ")}`);
  }
  return {
    path: defaultNegativeChallengeGapPacketPath,
    sha256: sha256File(defaultNegativeChallengeGapPacketPath),
    packet,
  };
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function validateSignerAliasForCommand(signerAlias) {
  if (!/^[A-Za-z0-9._-]+$/.test(signerAlias)) {
    throw new Error(`signer alias is not safe for generated shell commands: ${signerAlias}`);
  }
}

function plannedConsentSignerAliases(plan) {
  return signerRows(plan).map((row) => row.signer_alias);
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

function postCollectionCommandsForPlan(plan) {
  return [
    ...postCollectionOpeningCommands,
    ...plannedConsentSignerAliases(plan).flatMap((signerAlias) => signedConsentReceiptCommands(signerAlias)),
    ...postCollectionClosingCommands,
  ];
}

function doNotCaptureReason(plan) {
  if (acceptedVocabularyGateStatuses.has(plan.review_gate?.status)) return null;
  return `Collection plan review_gate.status is ${plan.review_gate?.status ?? "missing"}; import final vocabulary evidence and regenerate the plan before capture.`;
}

function bundleState(plan) {
  const isDraft = !acceptedVocabularyGateStatuses.has(plan.review_gate?.status);
  return {
    status: isDraft ? "draft_not_for_capture" : "ready_for_capture",
    capture_ready: !isDraft,
    do_not_capture_reason: isDraft ? doNotCaptureReason(plan) : null,
  };
}

function draftOnlyWarning(manifest) {
  if (manifest.capture_ready === true) return "";
  return `> DRAFT ONLY: DO NOT CAPTURE
> capture_ready: false
> do_not_capture_reason: ${manifest.do_not_capture_reason}
> Regenerate and run \`node scripts/audit_collection_session_bundle.mjs --require-ready\` before capture.

`;
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvRow(values) {
  return `${values.map(csvCell).join(",")}\n`;
}

function validatePlan(plan, planPath, allowDraft) {
  const blockers = [];
  if (plan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    blockers.push("collection plan schema_version must be asl-pilot-dataset-collection-plan/v1");
  }
  if (!acceptedVocabularyGateStatuses.has(plan.review_gate?.status)) {
    blockers.push(`collection plan review_gate.status must be reviewed or source_curated before capture; found ${plan.review_gate?.status ?? "missing"}`);
  }
  if (Array.isArray(plan.warnings) && plan.warnings.length > 0) {
    blockers.push(`collection plan warnings must be resolved before capture: ${plan.warnings.join("; ")}`);
  }
  if (!Array.isArray(plan.assignments) || plan.assignments.length === 0) {
    blockers.push("collection plan must include vocabulary assignments");
  }
  if (!Array.isArray(plan.negative_challenge_assignments) || plan.negative_challenge_assignments.length === 0) {
    blockers.push("collection plan must include negative challenge assignments");
  }
  if (plan.assignment_count !== plan.assignments?.length) {
    blockers.push("collection plan assignment_count must match assignments length");
  }
  if (plan.negative_challenge_assignment_count !== plan.negative_challenge_assignments?.length) {
    blockers.push("collection plan negative_challenge_assignment_count must match negative_challenge_assignments length");
  }
  blockers.push(...validateCollectionPlanReviewGateFresh(plan));
  if (!allowDraft) {
    blockers.push(...validateCollectionPlanMatchesFreshGeneration(plan));
  }
  if (!allowDraft && blockers.length > 0) {
    return blockers;
  }
  if (allowDraft) {
    return blockers.filter((blocker) => (
      !blocker.includes("review_gate.status must be reviewed or source_curated") &&
      !blocker.includes("review_gate.status is stale")
    ));
  }
  return blockers;
}

function signerRows(plan) {
  const rows = [];
  for (const [split, aliases] of Object.entries(plan.planned_signers ?? {})) {
    for (const signerAlias of aliases) {
      const assignments = plan.assignments.filter((item) => item.signer_alias === signerAlias);
      rows.push({
        signer_alias: signerAlias,
        signer_type: "vocabulary",
        split,
        assignment_count: assignments.length,
        unique_labels: new Set(assignments.map((item) => item.label_id)).size,
      });
    }
  }
  for (const signerAlias of plan.planned_negative_challenge_signers ?? []) {
    const assignments = plan.negative_challenge_assignments.filter((item) => item.signer_alias === signerAlias);
    rows.push({
      signer_alias: signerAlias,
      signer_type: "negative_challenge",
      split: "negative_challenge",
      assignment_count: assignments.length,
      unique_labels: new Set(assignments.map((item) => item.challenge_type)).size,
    });
  }
  return rows.sort((a, b) => a.signer_alias.localeCompare(b.signer_alias));
}

function writeSignerRoster(outputPath, rows, state) {
  const file = path.join(outputPath, "signer-roster.csv");
  let text = csvRow([
    "bundle_status",
    "capture_ready",
    "do_not_capture_reason",
    "signer_alias",
    "signer_type",
    "split",
    "assignment_count",
    "unique_label_or_challenge_count",
  ]);
  for (const row of rows) {
    text += csvRow([
      state.status,
      String(state.capture_ready),
      state.do_not_capture_reason ?? "",
      row.signer_alias,
      row.signer_type,
      row.split,
      row.assignment_count,
      row.unique_labels,
    ]);
  }
  writeText(file, text);
  return file;
}

function writeVocabularyAssignments(outputPath, assignments, state) {
  const file = path.join(outputPath, "vocabulary-assignments.csv");
  let text = csvRow([
    "bundle_status",
    "capture_ready",
    "do_not_capture_reason",
    "assignment_key",
    "split",
    "signer_alias",
    "label_id",
    "display_text",
    "capture_count_for_label_split",
  ]);
  assignments.forEach((assignment, index) => {
    text += csvRow([
      state.status,
      String(state.capture_ready),
      state.do_not_capture_reason ?? "",
      `vocabulary:${index}`,
      assignment.split,
      assignment.signer_alias,
      assignment.label_id,
      assignment.display_text,
      assignment.capture_count_for_label_split,
    ]);
  });
  writeText(file, text);
  return file;
}

function writeChallengeAssignments(outputPath, assignments, state) {
  const file = path.join(outputPath, "negative-challenge-assignments.csv");
  let text = csvRow([
    "bundle_status",
    "capture_ready",
    "do_not_capture_reason",
    "assignment_key",
    "split",
    "signer_alias",
    "challenge_type",
    "expected_outcome",
    "capture_count_for_type",
  ]);
  assignments.forEach((assignment, index) => {
    text += csvRow([
      state.status,
      String(state.capture_ready),
      state.do_not_capture_reason ?? "",
      `negative_challenge:${index}`,
      assignment.split,
      assignment.signer_alias,
      assignment.challenge_type,
      assignment.expected_outcome,
      assignment.capture_count_for_type,
    ]);
  });
  writeText(file, text);
  return file;
}

function writeRemediationQueue(outputPath, remediationQueue, state) {
  if (!remediationQueue) return null;
  const file = path.join(outputPath, "remediation-collection-queue.csv");
  let text = csvRow([
    "bundle_status",
    "capture_ready",
    "do_not_capture_reason",
    "queue_index",
    "assignment_key",
    "assignment_type",
    "priority_bucket",
    "priority_score",
    "split",
    "signer_alias",
    "label_id",
    "display_text",
    "challenge_type",
    "expected_outcome",
    "capture_count",
    "signals",
  ]);
  for (const row of remediationQueue.queue.queue ?? []) {
    text += csvRow([
      state.status,
      String(state.capture_ready),
      state.do_not_capture_reason ?? "",
      row.queue_index,
      row.assignment_key,
      row.assignment_type,
      row.priority_bucket,
      row.priority_score,
      row.split,
      row.signer_alias,
      row.label_id ?? "",
      row.display_text ?? "",
      row.challenge_type ?? "",
      row.expected_outcome ?? "",
      row.capture_count_for_label_split ?? row.capture_count_for_type ?? "",
      Array.isArray(row.signals) ? row.signals.join("|") : "",
    ]);
  }
  writeText(file, text);
  return file;
}

function writeNegativeChallengeGapAssignments(outputPath, gapPacket, state) {
  if (!gapPacket) return null;
  const file = path.join(outputPath, "negative-challenge-gap-assignments.csv");
  let text = csvRow([
    "bundle_status",
    "capture_ready",
    "do_not_capture_reason",
    "assignment_key",
    "split",
    "signer_alias",
    "challenge_type",
    "expected_outcome",
    "capture_count_for_type",
    "operator_action",
    "required_review_before_manifest",
  ]);
  for (const assignment of gapPacket.packet.selected_assignments ?? []) {
    text += csvRow([
      state.status,
      String(state.capture_ready),
      state.do_not_capture_reason ?? "",
      assignment.assignment_key,
      assignment.split,
      assignment.signer_alias,
      assignment.challenge_type,
      assignment.expected_outcome,
      assignment.capture_count_for_type,
      assignment.operator_action,
      Array.isArray(assignment.required_review_before_manifest)
        ? assignment.required_review_before_manifest.join("|")
        : "",
    ]);
  }
  writeText(file, text);
  return file;
}

function writeSignerSheets(outputPath, plan, manifest) {
  const directory = path.join(outputPath, "signer-sheets");
  fs.mkdirSync(directory, { recursive: true });
  const files = [];
  for (const row of signerRows(plan)) {
    const file = path.join(directory, `${row.signer_alias}.md`);
    const assignments = row.signer_type === "vocabulary"
      ? plan.assignments
        .map((assignment, index) => ({ ...assignment, assignment_key: `vocabulary:${index}` }))
        .filter((assignment) => assignment.signer_alias === row.signer_alias)
      : plan.negative_challenge_assignments
        .map((assignment, index) => ({ ...assignment, assignment_key: `negative_challenge:${index}` }))
        .filter((assignment) => assignment.signer_alias === row.signer_alias);
    writeText(file, renderSignerSheet(row, assignments, manifest));
    files.push(file);
  }
  return files;
}

function renderSignerSheet(row, assignments, manifest) {
  const table = row.signer_type === "vocabulary"
    ? [
      "| Assignment Key | Label ID | Display Text | Capture # |",
      "| --- | --- | --- | --- |",
      ...assignments.map((assignment) =>
        `| \`${assignment.assignment_key}\` | \`${assignment.label_id}\` | ${assignment.display_text} | ${assignment.capture_count_for_label_split} |`,
      ),
    ].join("\n")
    : [
      "| Assignment Key | Challenge Type | Expected Outcome | Capture # |",
      "| --- | --- | --- | --- |",
      ...assignments.map((assignment) =>
        `| \`${assignment.assignment_key}\` | \`${assignment.challenge_type}\` | ${assignment.expected_outcome} | ${assignment.capture_count_for_type} |`,
      ),
    ].join("\n");
  return `# ${row.signer_alias}

${draftOnlyWarning(manifest)}
- Signer type: ${row.signer_type}
- Split: ${row.split}
- Assignment count: ${assignments.length}

## Capture Checklist

- Confirm the operator is logged in.
- Confirm collection mode is explicitly enabled.
- Confirm the signer has completed every consent checkbox before each recording.
- Load the matching assignment key in the collection UI.
- Keep this signer alias unchanged in signer identity and signed consent receipt evidence.
- Keep upper torso and signing space visible unless this is a negative challenge assignment.
- Save rejected or unusable captures for review rather than counting them as approved data.

## Assignments

${table}
`;
}

function renderOperatorReadme(plan, manifest, isDraft) {
  const statusLine = isDraft
    ? "This is a draft planning bundle. Do not use it for capture."
    : "This bundle is ready for supervised collection sessions.";
  return `# ASL Pilot Collection Session Bundle

${draftOnlyWarning(manifest)}${statusLine}

## Start Collection Mode

\`\`\`sh
cd web
ENABLE_DATASET_COLLECTION=true \\
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true \\
npm run dev -- --hostname 127.0.0.1 --port 3025
\`\`\`

Open \`http://127.0.0.1:3025\`, sign in as the operator, load the collection
panel, and select assignments from the reviewed plan.

## Required Rules

- Run the pre-capture audit commands below before using this bundle for real capture.
- Use only the assignment keys in this bundle.
- If present, follow \`remediation-collection-queue.csv\` for capture order and
  use its \`assignment_key\` values in the collection UI.
- If present, use \`negative-challenge-gap-assignments.csv\` as the exact
  remaining hard-negative capture subset required by the strict final manifest
  audit.
- Do not capture from a draft plan.
- Record raw clips only after every consent checkbox is checked.
- Vocabulary signers must stay in their assigned split.
- Negative challenge signers must stay disjoint from vocabulary signers.
- Do not treat captured clips as training-ready until clip review imports mark them approved.
- Signed consent receipt commands must be run for every planned signer alias in \`signer-roster.csv\`.

## Pre-Capture Audits

\`\`\`sh
${preCaptureAuditCommands.join("\n")}
\`\`\`

## Post-Collection Intake

The consent receipt commands below are expanded for every planned signer alias
in \`signer-roster.csv\`; do not collapse them to a single signer.

\`\`\`sh
${manifest.operator_requirements.post_collection_commands.join("\n")}
\`\`\`

## Bundle Summary

- Status: \`${manifest.status}\`
- Plan: \`${manifest.collection_plan.path}\`
- Plan SHA-256: \`${manifest.collection_plan.sha256}\`
- Vocabulary assignments: ${plan.assignment_count}
- Negative challenge assignments: ${plan.negative_challenge_assignment_count}
- Remediation queue: ${manifest.remediation_queue ? `\`${manifest.remediation_queue.path}\`` : "not present"}
- Negative challenge gap packet: ${manifest.negative_challenge_gap_packet ? `\`${manifest.negative_challenge_gap_packet.path}\`` : "not present"}
- Negative challenge gap assignments: ${manifest.operator_requirements.negative_challenge_gap_file ? `\`${manifest.operator_requirements.negative_challenge_gap_file}\`` : "not present"}
- Vocabulary labels: ${plan.targets?.vocabulary_labels}
- Clips per label per split: ${plan.targets?.clips_per_label_per_split}

## Files

${manifest.files.map((file) => `- \`${file.path}\`: ${file.purpose}`).join("\n")}
`;
}

function fileRecord(file, purpose) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
    purpose,
  };
}

function buildManifest({ plan, planPath, outputPath, generatedFiles, isDraft, remediationQueue, negativeChallengeGapPacket }) {
  const signerAliases = plannedConsentSignerAliases(plan);
  const postCollectionCommands = postCollectionCommandsForPlan(plan);
  const state = bundleState(plan);
  return {
    schema_version: "asl-pilot-collection-session-bundle/v1",
    status: state.status,
    capture_ready: state.capture_ready,
    do_not_capture_reason: state.do_not_capture_reason,
    generated_by: {
      tool: "scripts/prepare_collection_session_bundle.mjs",
      script: sourceFileRecord("scripts/prepare_collection_session_bundle.mjs"),
      dependencies: generatorDependencyPaths
        .filter((relativePath) => relativePath !== "scripts/prepare_collection_session_bundle.mjs")
        .map(sourceFileRecord),
    },
    generated_at: new Date().toISOString(),
    bundle_root: projectRelative(outputPath),
    collection_plan: {
      path: projectRelative(planPath),
      sha256: sha256File(planPath),
      review_gate_status: plan.review_gate?.status ?? null,
    },
    remediation_queue: remediationQueue
      ? {
        path: projectRelative(remediationQueue.path),
        sha256: remediationQueue.sha256,
        status: remediationQueue.queue.status,
        assignment_count: remediationQueue.queue.queue_summary?.assignment_count ?? null,
      }
      : null,
    negative_challenge_gap_packet: negativeChallengeGapPacket
      ? {
        path: projectRelative(negativeChallengeGapPacket.path),
        sha256: negativeChallengeGapPacket.sha256,
        status: negativeChallengeGapPacket.packet.status,
        missing_clip_count: negativeChallengeGapPacket.packet.missing_clip_count,
        selected_assignment_count: negativeChallengeGapPacket.packet.selected_assignment_count,
        selected_assignment_counts_by_type: negativeChallengeGapPacket.packet.selected_assignment_counts_by_type,
      }
      : null,
    targets: plan.targets,
    planned_signer_counts: plan.planned_signer_counts,
    assignment_count: plan.assignment_count,
    negative_challenge_assignment_count: plan.negative_challenge_assignment_count,
    warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
    operator_requirements: {
      required_ready_status: "ready_for_capture",
      draft_status: "draft_not_for_capture",
      collection_mode_env: [
        "ENABLE_DATASET_COLLECTION=true",
        "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true",
      ],
      app_url: "http://127.0.0.1:3025",
      require_accepted_vocabulary_evidence: true,
      require_current_collection_plan: true,
      require_assignment_keys: true,
      require_consent_checkboxes: true,
      require_signer_identity_for_each_planned_alias: true,
      require_signed_consent_receipt_for_each_planned_alias: true,
      require_vocabulary_signer_split_boundaries: true,
      require_negative_challenge_signer_disjointness: true,
      require_capture_priority_queue: Boolean(remediationQueue),
      capture_priority_file: remediationQueue
        ? projectRelative(path.join(outputPath, "remediation-collection-queue.csv"))
        : null,
      require_negative_challenge_gap_packet: Boolean(negativeChallengeGapPacket),
      negative_challenge_gap_file: negativeChallengeGapPacket
        ? projectRelative(path.join(outputPath, "negative-challenge-gap-assignments.csv"))
        : null,
      planned_consent_signer_aliases: signerAliases,
      signed_consent_receipt_outputs: signerAliases.map((signerAlias) => signedConsentReceiptPath(signerAlias)),
      pre_capture_audit_commands: preCaptureAuditCommands,
      post_collection_commands: postCollectionCommands,
    },
    files: generatedFiles.map(({ file, purpose }) => fileRecord(file, purpose)),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const planPath = resolveProjectPath(args.plan, "--plan");
  const outputPath = resolveOutputPath(args.output);
  if (!fs.existsSync(planPath)) {
    throw new Error(`collection plan is missing: ${projectRelative(planPath)}`);
  }
  const plan = readJson(planPath);
  const blockers = validatePlan(plan, planPath, args.allowDraft);
  if (blockers.length > 0) {
    console.log(JSON.stringify({
      status: "blocked",
      plan: projectRelative(planPath),
      output: projectRelative(outputPath),
      blockers,
    }, null, 2));
    console.error("Collection session bundle preparation failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }

  const remediationQueue = readFreshRemediationQueue(planPath, plan);
  const negativeChallengeGapPacket = readFreshNegativeChallengeGapPacket(planPath);
  const isDraft = !acceptedVocabularyGateStatuses.has(plan.review_gate?.status);
  const state = bundleState(plan);
  fs.rmSync(outputPath, { recursive: true, force: true });
  fs.mkdirSync(outputPath, { recursive: true });
  const generatedFiles = [
    {
      file: writeSignerRoster(outputPath, signerRows(plan), state),
      purpose: "Signer roster with split and assignment counts.",
    },
    {
      file: writeVocabularyAssignments(outputPath, plan.assignments, state),
      purpose: "All vocabulary capture assignments with UI assignment keys.",
    },
    {
      file: writeChallengeAssignments(outputPath, plan.negative_challenge_assignments, state),
      purpose: "All reject-only negative challenge assignments with UI assignment keys.",
    },
  ];
  const remediationQueueFile = writeRemediationQueue(outputPath, remediationQueue, state);
  if (remediationQueueFile) {
    generatedFiles.push({
      file: remediationQueueFile,
      purpose: "Failure-analysis-prioritized capture order with UI assignment keys.",
    });
  }
  const negativeChallengeGapFile = writeNegativeChallengeGapAssignments(outputPath, negativeChallengeGapPacket, state);
  if (negativeChallengeGapFile) {
    generatedFiles.push({
      file: negativeChallengeGapFile,
      purpose: "Exact remaining strict-final hard-negative capture subset.",
    });
  }
  const initialManifest = buildManifest({ plan, planPath, outputPath, generatedFiles, isDraft, remediationQueue, negativeChallengeGapPacket });
  for (const file of writeSignerSheets(outputPath, plan, initialManifest)) {
    generatedFiles.push({
      file,
      purpose: "Per-signer capture sheet.",
    });
  }
  const manifest = buildManifest({ plan, planPath, outputPath, generatedFiles, isDraft, remediationQueue, negativeChallengeGapPacket });
  const manifestPath = path.join(outputPath, "MANIFEST.json");
  writeJson(manifestPath, manifest);
  const readmePath = path.join(outputPath, "OPERATOR_README.md");
  writeText(readmePath, renderOperatorReadme(plan, manifest, isDraft));

  console.log(JSON.stringify({
    status: manifest.status,
    capture_ready: manifest.capture_ready,
    do_not_capture_reason: manifest.do_not_capture_reason,
    output: projectRelative(outputPath),
    plan: projectRelative(planPath),
    signer_sheets: generatedFiles.filter((item) => item.file.includes(`${path.sep}signer-sheets${path.sep}`)).length,
    files: generatedFiles.length + 2,
    manifest_sha256: sha256File(manifestPath),
    remediation_queue: remediationQueue ? projectRelative(remediationQueue.path) : null,
    negative_challenge_gap_packet: negativeChallengeGapPacket ? projectRelative(negativeChallengeGapPacket.path) : null,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Collection session bundle preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
