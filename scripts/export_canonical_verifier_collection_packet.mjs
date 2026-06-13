import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultCanonicalManifestPath = path.join(root, "docs", "validation", "canonical-verifier-manifests.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultOutputPath = path.join(root, "output", "collection-handoff", "canonical-verifier-010");
const defaultSummaryOutputPath = path.join(root, "docs", "validation", "canonical-verifier-collection-packet.json");
const schemaVersion = "asl-pilot-canonical-verifier-collection-packet/v1";
const tier1HandOnlyCollectionLabels = ["book", "car", "milk", "help", "stop", "finish", "school", "chair", "airplane", "plus"];

const preferredHardNegativeRequirements = [
  {
    requirement_id: "idle_hands",
    display_text: "idle hands",
    current_app_challenge_types: ["idle_hands"],
  },
  {
    requirement_id: "wave",
    display_text: "wave",
    current_app_challenge_types: ["waving"],
  },
  {
    requirement_id: "thumbs_up",
    display_text: "thumbs up",
    current_app_challenge_types: ["thumbs_up"],
  },
  {
    requirement_id: "random_hand_motion",
    display_text: "random hand motion",
    current_app_challenge_types: ["casual_non_asl_gesture"],
  },
  {
    requirement_id: "mouth_touch",
    display_text: "mouth touch",
    current_app_challenge_types: ["mouth_touch"],
  },
  {
    requirement_id: "hand_clap",
    display_text: "hand clap",
    current_app_challenge_types: ["hand_clap"],
  },
  {
    requirement_id: "wrong_location_imitation",
    display_text: "wrong-location imitation",
    current_app_challenge_types: ["wrong_location"],
  },
  {
    requirement_id: "near_confusable_signs",
    display_text: "near-confusable signs",
    current_app_challenge_types: ["non_target_asl_sign", "partial_sign"],
  },
];

function parseArgs(argv) {
  const args = {
    canonicalManifest: defaultCanonicalManifestPath,
    collectionPlan: defaultCollectionPlanPath,
    output: defaultOutputPath,
    summaryOutput: defaultSummaryOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--canonical-manifest") {
      args.canonicalManifest = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--collection-plan") {
      args.collectionPlan = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--summary-output") {
      args.summaryOutput = resolveProjectPath(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_canonical_verifier_collection_packet.mjs
  node scripts/export_canonical_verifier_collection_packet.mjs --write

Builds an operator-facing first-party collection packet for the current
10-sign Tier-1 hand-only target. The packet is a capture aid only: it does
not create clips, approve clips, export model manifests, train weights, or
promote browser model behavior.
`);
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
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

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function sourceFileRecord(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing JSON file: ${projectRelative(file)}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvRow(values) {
  return `${values.map(csvCell).join(",")}\n`;
}

function displayText(labelId) {
  return labelId.split("_").map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}

function selectedLabels(canonicalManifest, collectionPlan) {
  const priorCanonicalLabelsById = new Map(
    (canonicalManifest.selection?.selected_labels ?? []).map((label) => [label.label_id, label]),
  );
  const displayTextById = new Map(
    (collectionPlan.assignments ?? [])
      .filter((assignment) => typeof assignment.label_id === "string")
      .map((assignment) => [assignment.label_id, assignment.display_text ?? displayText(assignment.label_id)]),
  );
  return tier1HandOnlyCollectionLabels.map((labelId, index) => {
    const prior = priorCanonicalLabelsById.get(labelId) ?? {};
    return {
      canonical_rank: index + 1,
      label_id: labelId,
      display_text: displayTextById.get(labelId) ?? displayText(labelId),
      source_f1: prior.f1 ?? null,
      source_precision: prior.precision ?? null,
      source_recall: prior.recall ?? null,
      source_support: prior.support ?? null,
      target_source: "tier1_hand_only_goal_prompt",
    };
  });
}

function validateInputs(canonicalManifest, collectionPlan, labels) {
  const blockers = [];
  if (canonicalManifest.schema_version !== "asl-pilot-canonical-verifier-manifests/v1") {
    blockers.push("canonical manifest schema_version must be asl-pilot-canonical-verifier-manifests/v1");
  }
  if (canonicalManifest.status !== "written") {
    blockers.push(`canonical manifest status must be written; found ${canonicalManifest.status ?? "missing"}`);
  }
  if (labels.length < 8 || labels.length > 12) {
    blockers.push(`canonical selected label count must be 8-12; found ${labels.length}`);
  }
  if (collectionPlan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    blockers.push("collection plan schema_version must be asl-pilot-dataset-collection-plan/v1");
  }
  if (collectionPlan.review_gate?.status !== "reviewed" && collectionPlan.review_gate?.status !== "source_curated") {
    blockers.push(`collection plan review_gate.status must be reviewed or source_curated; found ${collectionPlan.review_gate?.status ?? "missing"}`);
  }
  if (Array.isArray(collectionPlan.warnings) && collectionPlan.warnings.length > 0) {
    blockers.push(`collection plan warnings must be resolved before capture: ${collectionPlan.warnings.join("; ")}`);
  }
  return blockers;
}

function buildVocabularyRows(collectionPlan, labels) {
  const labelsById = new Map(labels.map((label) => [label.label_id, label]));
  return (collectionPlan.assignments ?? [])
    .map((assignment, index) => {
      const label = labelsById.get(assignment.label_id);
      if (!label) return null;
      return {
        assignment_type: "canonical_vocabulary_capture",
        assignment_key: `vocabulary:${index}`,
        canonical_rank: label.canonical_rank,
        split: assignment.split,
        signer_alias: assignment.signer_alias,
        label_id: assignment.label_id,
        display_text: assignment.display_text,
        capture_count: assignment.capture_count_for_label_split,
        source_f1: label.source_f1,
        source_precision: label.source_precision,
        source_recall: label.source_recall,
        operator_action: "record_first_party_raw_video_clip",
      };
    })
    .filter(Boolean);
}

function buildHardNegativeRows(collectionPlan) {
  return (collectionPlan.negative_challenge_assignments ?? []).map((assignment, index) => ({
    assignment_type: "canonical_hard_negative_capture",
    assignment_key: `negative_challenge:${index}`,
    split: assignment.split,
    signer_alias: assignment.signer_alias,
    challenge_type: assignment.challenge_type,
    expected_outcome: assignment.expected_outcome,
    capture_count: assignment.capture_count_for_type,
    operator_action: "record_first_party_reject_only_clip",
  }));
}

function hardNegativeCoverage(negativeRows) {
  const plannedCounts = {};
  for (const row of negativeRows) {
    plannedCounts[row.challenge_type] = (plannedCounts[row.challenge_type] ?? 0) + 1;
  }
  return preferredHardNegativeRequirements.map((requirement) => {
    const plannedAssignmentCount = requirement.current_app_challenge_types
      .reduce((sum, challengeType) => sum + (plannedCounts[challengeType] ?? 0), 0);
    return {
      requirement_id: requirement.requirement_id,
      display_text: requirement.display_text,
      current_app_challenge_types: requirement.current_app_challenge_types,
      planned_assignment_count: plannedAssignmentCount,
      status: plannedAssignmentCount > 0 ? "covered_by_current_collection_plan" : "preferred_requirement_not_current_app_assignment",
    };
  });
}

function sortVocabularyRows(rows) {
  return [...rows]
    .sort((a, b) => (
      a.canonical_rank - b.canonical_rank ||
      String(a.split).localeCompare(String(b.split)) ||
      String(a.signer_alias).localeCompare(String(b.signer_alias)) ||
      Number(a.capture_count ?? 0) - Number(b.capture_count ?? 0)
    ))
    .map((row, index) => ({ canonical_queue_index: index + 1, ...row }));
}

function sortHardNegativeRows(rows) {
  return [...rows]
    .sort((a, b) => (
      String(a.challenge_type).localeCompare(String(b.challenge_type)) ||
      String(a.signer_alias).localeCompare(String(b.signer_alias)) ||
      Number(a.capture_count ?? 0) - Number(b.capture_count ?? 0)
    ))
    .map((row, index) => ({ hard_negative_queue_index: index + 1, ...row }));
}

function signerRows(vocabularyRows, hardNegativeRows) {
  const bySigner = new Map();
  for (const row of [...vocabularyRows, ...hardNegativeRows]) {
    const current = bySigner.get(row.signer_alias) ?? {
      signer_alias: row.signer_alias,
      assignment_count: 0,
      vocabulary_assignments: 0,
      hard_negative_assignments: 0,
      unique_labels: new Set(),
      unique_challenge_types: new Set(),
    };
    current.assignment_count += 1;
    if (row.assignment_type === "canonical_vocabulary_capture") {
      current.vocabulary_assignments += 1;
      current.unique_labels.add(row.label_id);
    }
    if (row.assignment_type === "canonical_hard_negative_capture") {
      current.hard_negative_assignments += 1;
      current.unique_challenge_types.add(row.challenge_type);
    }
    bySigner.set(row.signer_alias, current);
  }
  return [...bySigner.values()]
    .map((row) => ({
      ...row,
      unique_labels: row.unique_labels.size,
      unique_challenge_types: row.unique_challenge_types.size,
    }))
    .sort((a, b) => a.signer_alias.localeCompare(b.signer_alias));
}

function countsBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  }
  return counts;
}

function summarize(labels, vocabularyRows, hardNegativeRows, coverageRows) {
  return {
    selected_label_count: labels.length,
    vocabulary_assignment_count: vocabularyRows.length,
    hard_negative_assignment_count: hardNegativeRows.length,
    total_assignment_count: vocabularyRows.length + hardNegativeRows.length,
    vocabulary_assignments_by_split: countsBy(vocabularyRows, "split"),
    hard_negative_assignments_by_challenge_type: countsBy(hardNegativeRows, "challenge_type"),
    preferred_hard_negative_requirement_count: coverageRows.length,
    preferred_hard_negative_gap_count: coverageRows
      .filter((row) => row.status === "preferred_requirement_not_current_app_assignment").length,
  };
}

function writeVocabularyCsv(outputPath, rows) {
  const file = path.join(outputPath, "canonical-collection-queue.csv");
  let text = csvRow([
    "canonical_queue_index",
    "assignment_key",
    "assignment_type",
    "canonical_rank",
    "split",
    "signer_alias",
    "label_id",
    "display_text",
    "capture_count",
    "operator_action",
    "source_f1",
    "source_precision",
    "source_recall",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.canonical_queue_index,
      row.assignment_key,
      row.assignment_type,
      row.canonical_rank,
      row.split,
      row.signer_alias,
      row.label_id,
      row.display_text,
      row.capture_count,
      row.operator_action,
      row.source_f1 ?? "",
      row.source_precision ?? "",
      row.source_recall ?? "",
    ]);
  }
  writeText(file, text);
  return file;
}

function writeHardNegativeCsv(outputPath, rows) {
  const file = path.join(outputPath, "canonical-hard-negative-queue.csv");
  let text = csvRow([
    "hard_negative_queue_index",
    "assignment_key",
    "assignment_type",
    "split",
    "signer_alias",
    "challenge_type",
    "expected_outcome",
    "capture_count",
    "operator_action",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.hard_negative_queue_index,
      row.assignment_key,
      row.assignment_type,
      row.split,
      row.signer_alias,
      row.challenge_type,
      row.expected_outcome,
      row.capture_count,
      row.operator_action,
    ]);
  }
  writeText(file, text);
  return file;
}

function writeCoverageCsv(outputPath, rows) {
  const file = path.join(outputPath, "canonical-hard-negative-coverage.csv");
  let text = csvRow([
    "requirement_id",
    "display_text",
    "current_app_challenge_types",
    "planned_assignment_count",
    "status",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.requirement_id,
      row.display_text,
      row.current_app_challenge_types.join("|"),
      row.planned_assignment_count,
      row.status,
    ]);
  }
  writeText(file, text);
  return file;
}

function writeSignerRosterCsv(outputPath, rows) {
  const file = path.join(outputPath, "canonical-signer-roster.csv");
  let text = csvRow([
    "signer_alias",
    "assignment_count",
    "vocabulary_assignments",
    "hard_negative_assignments",
    "unique_labels",
    "unique_challenge_types",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.signer_alias,
      row.assignment_count,
      row.vocabulary_assignments,
      row.hard_negative_assignments,
      row.unique_labels,
      row.unique_challenge_types,
    ]);
  }
  writeText(file, text);
  return file;
}

function renderReadme(packet) {
  return `# Canonical Verifier Collection Packet

This packet filters the reviewed collection plan down to the current
10-sign Tier-1 hand-only target plus the current hard-negative challenge
assignments.

## Use

1. Use \`canonical-collection-queue.csv\` for prompted sign captures.
2. Use \`canonical-hard-negative-queue.csv\` for reject-only challenge captures.
3. Enter the original \`assignment_key\` in the collection UI.
4. Keep contributor/session split discipline intact for train/dev/test use.
5. Do not treat captured clips as training-ready until consent, clip review,
   challenge review, and dataset collection readiness audits pass.

## Summary

- Status: \`${packet.status}\`
- Final model evidence: \`${packet.final_model_evidence}\`
- Selected labels: ${packet.packet_summary.selected_label_count}
- Vocabulary assignments: ${packet.packet_summary.vocabulary_assignment_count}
- Hard-negative assignments: ${packet.packet_summary.hard_negative_assignment_count}
- Preferred hard-negative gaps: ${packet.packet_summary.preferred_hard_negative_gap_count}

## Important Boundary

This packet is not a manifest, not a model report, and not proof of validation.
It only makes focused first-party browser-domain collection actionable for the
Tier-1 10-sign hand-only collection path.
`;
}

function buildPacket(args) {
  const canonicalManifest = readJson(args.canonicalManifest);
  const collectionPlan = readJson(args.collectionPlan);
  const labels = selectedLabels(canonicalManifest, collectionPlan);
  const blockers = validateInputs(canonicalManifest, collectionPlan, labels);
  const missingLabels = labels
    .filter((label) => !(collectionPlan.assignments ?? []).some((assignment) => assignment.label_id === label.label_id))
    .map((label) => label.label_id);
  if (missingLabels.length > 0) {
    blockers.push(`collection plan is missing canonical label assignments: ${missingLabels.join(", ")}`);
  }

  const vocabularyRows = sortVocabularyRows(buildVocabularyRows(collectionPlan, labels));
  const hardNegativeRows = sortHardNegativeRows(buildHardNegativeRows(collectionPlan));
  const hardNegativeCoverageRows = hardNegativeCoverage(hardNegativeRows);
  const signerRoster = signerRows(vocabularyRows, hardNegativeRows);
  const packetSummary = summarize(labels, vocabularyRows, hardNegativeRows, hardNegativeCoverageRows);
  return {
    schema_version: schemaVersion,
    status: blockers.length > 0 ? "blocked" : "canonical_collection_packet_ready_not_training_data",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: sourceFileRecord("scripts/export_canonical_verifier_collection_packet.mjs"),
    },
    final_model_evidence: false,
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      creates_clips: false,
      trains_or_promotes_model: false,
      final_model_evidence: false,
      capture_aid_only: true,
    },
    inputs: {
      canonical_verifier_manifests: fileReference(args.canonicalManifest),
      collection_plan: fileReference(args.collectionPlan),
    },
    target_policy: {
      id: "tier1_hand_only_goal_prompt",
      label_ids: tier1HandOnlyCollectionLabels,
      note: "Active first-party collection queue follows the lowered Tier-1 hand-only label set, not the older canonical diagnostic label selection.",
    },
    blockers,
    selected_labels: labels,
    packet_summary: packetSummary,
    collection_requirements: {
      preferred_contributors: "8-10 contributors",
      preferred_positive_reps_per_sign_per_contributor: "8-12",
      split_discipline: "train/dev/test split by contributor when possible; otherwise held-out session with no threshold retuning",
      required_before_manifest_export: [
        "populate data/asl-pilot-store.json with signer, consent, clip, and challenge records",
        "run node scripts/audit_clip_review.mjs",
        "run node scripts/audit_challenge_review.mjs",
        "run node scripts/audit_dataset_collection_readiness.mjs",
      ],
    },
    hard_negative_coverage: hardNegativeCoverageRows,
    signer_roster: signerRoster,
    vocabulary_queue: vocabularyRows,
    hard_negative_queue: hardNegativeRows,
  };
}

function writeBundle(args, packet) {
  fs.rmSync(args.output, { recursive: true, force: true });
  fs.mkdirSync(args.output, { recursive: true });
  const generatedFiles = [
    {
      path: writeVocabularyCsv(args.output, packet.vocabulary_queue),
      purpose: "Canonical sign capture queue using original collection-plan assignment keys.",
    },
    {
      path: writeHardNegativeCsv(args.output, packet.hard_negative_queue),
      purpose: "Canonical reject-only hard-negative capture queue.",
    },
    {
      path: writeCoverageCsv(args.output, packet.hard_negative_coverage),
      purpose: "Preferred hard-negative requirement coverage against current app challenge types.",
    },
    {
      path: writeSignerRosterCsv(args.output, packet.signer_roster),
      purpose: "Canonical packet signer roster and assignment counts.",
    },
  ];
  const manifestPath = path.join(args.output, "MANIFEST.json");
  const readmePath = path.join(args.output, "OPERATOR_README.md");
  const manifest = {
    schema_version: "asl-pilot-canonical-verifier-collection-bundle/v1",
    status: packet.status,
    generated_at: packet.generated_at,
    summary_output: projectRelative(args.summaryOutput),
    packet_summary: packet.packet_summary,
    inputs: packet.inputs,
    files: generatedFiles.map((file) => ({
      path: projectRelative(file.path),
      sha256: sha256File(file.path),
      purpose: file.purpose,
    })),
  };
  writeJson(manifestPath, manifest);
  writeText(readmePath, renderReadme(packet));
  return {
    output: projectRelative(args.output),
    manifest: fileReference(manifestPath),
    readme: fileReference(readmePath),
    files: [
      ...manifest.files,
      { path: projectRelative(manifestPath), sha256: sha256File(manifestPath), purpose: "Bundle manifest." },
      { path: projectRelative(readmePath), sha256: sha256File(readmePath), purpose: "Operator readme." },
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const packet = buildPacket(args);
  let bundle = null;
  if (args.write) {
    bundle = writeBundle(args, packet);
    writeJson(args.summaryOutput, { ...packet, bundle });
  }
  console.log(JSON.stringify({
    status: packet.status,
    wrote: args.write,
    output: projectRelative(args.output),
    summary_output: projectRelative(args.summaryOutput),
    selected_label_count: packet.packet_summary.selected_label_count,
    vocabulary_assignment_count: packet.packet_summary.vocabulary_assignment_count,
    hard_negative_assignment_count: packet.packet_summary.hard_negative_assignment_count,
    preferred_hard_negative_gap_count: packet.packet_summary.preferred_hard_negative_gap_count,
    blockers: packet.blockers,
  }, null, 2));
  return packet.blockers.length > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Canonical verifier collection packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
