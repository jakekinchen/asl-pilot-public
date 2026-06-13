import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultMilestonePath = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultRemediationQueuePath = path.join(root, "data", "dataset", "rawframe-remediation-collection-queue.json");
const defaultOutputPath = path.join(root, "output", "collection-handoff", "rawframe-lesson-milestone");
const defaultSummaryOutputPath = path.join(root, "docs", "validation", "rawframe-lesson-collection-packet.json");
const schemaVersion = "asl-pilot-rawframe-lesson-collection-packet/v1";

const hardNegativeToChallengeType = new Map([
  ["idle_hands", "idle_hands"],
  ["empty_camera", "empty_camera"],
  ["no_hands_visible", "no_hands_visible"],
  ["low_light", "low_light"],
  ["off_center_signer", "off_center"],
  ["hands_cropped_out", "hands_cropped_out"],
  ["waving", "waving"],
  ["thumbs_up", "thumbs_up"],
  ["counting", "counting"],
  ["fingerspelling_like_motion", "fingerspelling_like_motion"],
  ["wrong_location", "wrong_location"],
  ["wrong_palm_orientation", "wrong_palm_orientation"],
  ["partial_sign", "partial_sign"],
  ["non_target_asl_sign", "non_target_asl_sign"],
  ["casual_non_asl_gesture", "casual_non_asl_gesture"],
  ["mouth_touch", "mouth_touch"],
  ["hand_clap", "hand_clap"],
]);

function parseArgs(argv) {
  const args = {
    milestone: defaultMilestonePath,
    collectionPlan: defaultCollectionPlanPath,
    remediationQueue: defaultRemediationQueuePath,
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
    } else if (item === "--milestone") {
      args.milestone = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--collection-plan") {
      args.collectionPlan = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--remediation-queue") {
      args.remediationQueue = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/export_rawframe_lesson_collection_packet.mjs
  node scripts/export_rawframe_lesson_collection_packet.mjs --write

Builds a lesson-focused operator packet from the retained 25-sign milestone and
the current reviewed first-party collection plan. The packet is a capture aid
only: it does not create clips, approve clips, export manifests, or satisfy
model-quality gates.
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

function fileReference(file) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvRow(values) {
  return `${values.map(csvCell).join(",")}\n`;
}

function validateInputs(milestone, collectionPlan, remediationQueue) {
  const blockers = [];
  if (milestone.schema_version !== "asl-pilot-rawframe-lesson-milestone/v1") {
    blockers.push("lesson milestone schema_version must be asl-pilot-rawframe-lesson-milestone/v1");
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
  if (remediationQueue.schema_version !== "asl-pilot-rawframe-remediation-collection-queue/v1") {
    blockers.push("remediation queue schema_version must be asl-pilot-rawframe-remediation-collection-queue/v1");
  }
  if (remediationQueue.status !== "queue_ready_not_training_data") {
    blockers.push(`remediation queue status must be queue_ready_not_training_data; found ${remediationQueue.status ?? "missing"}`);
  }
  return blockers;
}

function lessonLabels(milestone) {
  const rows = [];
  for (const item of milestone.lesson?.target_signs ?? []) {
    rows.push({
      label_id: item.label_id,
      display_text: item.display_text,
      lesson_role: "target",
      confusion_evidence: null,
    });
  }
  for (const item of milestone.lesson?.near_confusable_signs ?? []) {
    rows.push({
      label_id: item.label_id,
      display_text: item.display_text,
      lesson_role: "near_confusable",
      confusion_evidence: item.confusion_evidence ?? null,
    });
  }
  return rows;
}

function buildVocabularyRows(collectionPlan, remediationQueue, labels) {
  const labelById = new Map(labels.map((label) => [label.label_id, label]));
  const queueByAssignmentKey = new Map((remediationQueue.queue ?? []).map((row) => [row.assignment_key, row]));
  return (collectionPlan.assignments ?? [])
    .map((assignment, index) => {
      const label = labelById.get(assignment.label_id);
      if (!label) return null;
      const assignmentKey = `vocabulary:${index}`;
      const queueRow = queueByAssignmentKey.get(assignmentKey);
      return {
        assignment_type: "vocabulary_capture",
        assignment_key: assignmentKey,
        lesson_role: label.lesson_role,
        lesson_role_rank: label.lesson_role === "target" ? 0 : 1,
        source_queue_index: queueRow?.queue_index ?? null,
        priority_bucket: queueRow?.priority_bucket ?? "standard",
        priority_score: queueRow?.priority_score ?? 0,
        split: assignment.split,
        signer_alias: assignment.signer_alias,
        label_id: assignment.label_id,
        display_text: assignment.display_text,
        capture_count: assignment.capture_count_for_label_split,
        signals: queueRow?.signals ?? [],
        operator_action: "record_first_party_raw_video_clip",
      };
    })
    .filter(Boolean);
}

function buildNegativeChallengeRows(collectionPlan, remediationQueue) {
  const queueByAssignmentKey = new Map((remediationQueue.queue ?? []).map((row) => [row.assignment_key, row]));
  const supportedChallengeTypes = new Set(hardNegativeToChallengeType.values());
  return (collectionPlan.negative_challenge_assignments ?? [])
    .map((assignment, index) => {
      const assignmentKey = `negative_challenge:${index}`;
      const queueRow = queueByAssignmentKey.get(assignmentKey);
      return {
        assignment_type: "negative_challenge_capture",
        assignment_key: assignmentKey,
        lesson_role: "current_app_hard_negative",
        lesson_role_rank: 2,
        source_queue_index: queueRow?.queue_index ?? null,
        priority_bucket: queueRow?.priority_bucket ?? "negative_challenge_required",
        priority_score: queueRow?.priority_score ?? 0,
        split: assignment.split,
        signer_alias: assignment.signer_alias,
        challenge_type: assignment.challenge_type,
        expected_outcome: assignment.expected_outcome,
        capture_count: assignment.capture_count_for_type,
        operator_action: "record_first_party_reject_only_clip",
      };
    })
    .filter((row) => supportedChallengeTypes.has(row.challenge_type));
}

function sortRows(rows) {
  return [...rows]
    .sort((a, b) => (
      a.lesson_role_rank - b.lesson_role_rank ||
      (a.source_queue_index ?? 999999) - (b.source_queue_index ?? 999999) ||
      String(a.label_id ?? a.challenge_type).localeCompare(String(b.label_id ?? b.challenge_type)) ||
      String(a.split).localeCompare(String(b.split)) ||
      String(a.signer_alias).localeCompare(String(b.signer_alias)) ||
      Number(a.capture_count ?? 0) - Number(b.capture_count ?? 0)
    ))
    .map((row, index) => ({ lesson_queue_index: index + 1, ...row }));
}

function hardNegativeCoverage(milestone, negativeRows) {
  const plannedChallengeCounts = {};
  for (const row of negativeRows) {
    plannedChallengeCounts[row.challenge_type] = (plannedChallengeCounts[row.challenge_type] ?? 0) + 1;
  }
  return (milestone.lesson?.hard_negative_taxonomy ?? []).map((taxonomyItem) => {
    const challengeType = hardNegativeToChallengeType.get(taxonomyItem) ?? null;
    return {
      taxonomy_item: taxonomyItem,
      current_app_challenge_type: challengeType,
      planned_assignment_count: challengeType ? plannedChallengeCounts[challengeType] ?? 0 : 0,
      status: challengeType ? "covered_by_current_collection_plan" : "taxonomy_only_not_current_app_assignment",
    };
  });
}

function summarize(rows, labels, hardNegativeRows) {
  const vocabularyRows = rows.filter((row) => row.assignment_type === "vocabulary_capture");
  const negativeRows = rows.filter((row) => row.assignment_type === "negative_challenge_capture");
  const byRole = {};
  const bySplit = {};
  const byChallengeType = {};
  for (const row of rows) {
    byRole[row.lesson_role] = (byRole[row.lesson_role] ?? 0) + 1;
    bySplit[row.split] = (bySplit[row.split] ?? 0) + 1;
    if (row.challenge_type) byChallengeType[row.challenge_type] = (byChallengeType[row.challenge_type] ?? 0) + 1;
  }
  return {
    lesson_label_count: labels.length,
    target_label_count: labels.filter((label) => label.lesson_role === "target").length,
    near_confusable_label_count: labels.filter((label) => label.lesson_role === "near_confusable").length,
    queue_assignment_count: rows.length,
    vocabulary_assignment_count: vocabularyRows.length,
    negative_challenge_assignment_count: negativeRows.length,
    assignment_counts_by_role: byRole,
    assignment_counts_by_split: bySplit,
    negative_challenge_assignment_counts_by_type: byChallengeType,
    hard_negative_taxonomy_count: hardNegativeRows.length,
    hard_negative_taxonomy_not_current_app_assignment_count: hardNegativeRows
      .filter((row) => row.status === "taxonomy_only_not_current_app_assignment").length,
  };
}

function signerRows(rows) {
  const bySigner = new Map();
  for (const row of rows) {
    const current = bySigner.get(row.signer_alias) ?? {
      signer_alias: row.signer_alias,
      split: row.split,
      assignment_count: 0,
      target_assignments: 0,
      near_confusable_assignments: 0,
      negative_challenge_assignments: 0,
      unique_labels_or_challenges: new Set(),
    };
    current.assignment_count += 1;
    if (row.lesson_role === "target") current.target_assignments += 1;
    if (row.lesson_role === "near_confusable") current.near_confusable_assignments += 1;
    if (row.assignment_type === "negative_challenge_capture") current.negative_challenge_assignments += 1;
    current.unique_labels_or_challenges.add(row.label_id ?? row.challenge_type);
    bySigner.set(row.signer_alias, current);
  }
  return [...bySigner.values()]
    .map((row) => ({ ...row, unique_labels_or_challenges: row.unique_labels_or_challenges.size }))
    .sort((a, b) => a.signer_alias.localeCompare(b.signer_alias));
}

function writeLessonQueueCsv(outputPath, rows) {
  const file = path.join(outputPath, "lesson-collection-queue.csv");
  let text = csvRow([
    "lesson_queue_index",
    "source_queue_index",
    "assignment_key",
    "assignment_type",
    "lesson_role",
    "priority_bucket",
    "priority_score",
    "split",
    "signer_alias",
    "label_id",
    "display_text",
    "challenge_type",
    "expected_outcome",
    "capture_count",
    "operator_action",
    "signals",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.lesson_queue_index,
      row.source_queue_index ?? "",
      row.assignment_key,
      row.assignment_type,
      row.lesson_role,
      row.priority_bucket,
      row.priority_score,
      row.split,
      row.signer_alias,
      row.label_id ?? "",
      row.display_text ?? "",
      row.challenge_type ?? "",
      row.expected_outcome ?? "",
      row.capture_count,
      row.operator_action,
      Array.isArray(row.signals) ? row.signals.join("|") : "",
    ]);
  }
  writeText(file, text);
  return file;
}

function writeSignerRosterCsv(outputPath, rows) {
  const file = path.join(outputPath, "lesson-signer-roster.csv");
  let text = csvRow([
    "signer_alias",
    "split",
    "assignment_count",
    "target_assignments",
    "near_confusable_assignments",
    "negative_challenge_assignments",
    "unique_labels_or_challenges",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.signer_alias,
      row.split,
      row.assignment_count,
      row.target_assignments,
      row.near_confusable_assignments,
      row.negative_challenge_assignments,
      row.unique_labels_or_challenges,
    ]);
  }
  writeText(file, text);
  return file;
}

function writeHardNegativeCoverageCsv(outputPath, rows) {
  const file = path.join(outputPath, "lesson-hard-negative-coverage.csv");
  let text = csvRow([
    "taxonomy_item",
    "current_app_challenge_type",
    "planned_assignment_count",
    "status",
  ]);
  for (const row of rows) {
    text += csvRow([
      row.taxonomy_item,
      row.current_app_challenge_type ?? "",
      row.planned_assignment_count,
      row.status,
    ]);
  }
  writeText(file, text);
  return file;
}

function renderReadme(packet) {
  return `# Raw-Frame Lesson Collection Packet

This packet filters the reviewed 95-label collection plan down to the retained
25-sign lesson milestone, its 10 near-confusable signs, and the current app's
supported negative challenge assignments.

## Use

1. Run the full collection-session bundle pre-capture audits.
2. Start collection mode with the command in
   \`output/collection-handoff/collection-session-bundle/OPERATOR_README.md\`.
3. Use \`lesson-collection-queue.csv\` in \`lesson_queue_index\` order.
4. Enter the original \`assignment_key\` in the collection UI.
5. Do not treat captured clips as training-ready until consent, clip review,
   challenge review, and dataset collection readiness audits pass.

## Summary

- Status: \`${packet.status}\`
- Final model evidence: \`${packet.final_model_evidence}\`
- Target labels: ${packet.packet_summary.target_label_count}
- Near-confusable labels: ${packet.packet_summary.near_confusable_label_count}
- Vocabulary assignments: ${packet.packet_summary.vocabulary_assignment_count}
- Negative challenge assignments: ${packet.packet_summary.negative_challenge_assignment_count}
- Taxonomy-only hard negatives not currently represented by app challenge types:
  ${packet.packet_summary.hard_negative_taxonomy_not_current_app_assignment_count}

## Important Boundary

This packet is not a manifest and not model evidence. It only makes the
first-party browser-domain collection step actionable for the 25-sign lesson
milestone.
`;
}

function buildPacket(args) {
  const milestone = readJson(args.milestone);
  const collectionPlan = readJson(args.collectionPlan);
  const remediationQueue = readJson(args.remediationQueue);
  const blockers = validateInputs(milestone, collectionPlan, remediationQueue);
  const labels = lessonLabels(milestone);
  const missingLabels = labels
    .filter((label) => !(collectionPlan.assignments ?? []).some((assignment) => assignment.label_id === label.label_id))
    .map((label) => label.label_id);
  if (missingLabels.length > 0) {
    blockers.push(`collection plan is missing lesson label assignments: ${missingLabels.join(", ")}`);
  }
  const vocabularyRows = buildVocabularyRows(collectionPlan, remediationQueue, labels);
  const negativeRows = buildNegativeChallengeRows(collectionPlan, remediationQueue);
  const queue = sortRows([...vocabularyRows, ...negativeRows]);
  const hardNegativeRows = hardNegativeCoverage(milestone, negativeRows);
  const packetSummary = summarize(queue, labels, hardNegativeRows);
  const packet = {
    schema_version: schemaVersion,
    status: blockers.length > 0 ? "blocked" : "lesson_collection_packet_ready_not_training_data",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_rawframe_lesson_collection_packet.mjs")),
    },
    final_model_evidence: false,
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      final_model_evidence: false,
      capture_aid_only: true,
    },
    inputs: {
      lesson_milestone: fileReference(args.milestone),
      collection_plan: fileReference(args.collectionPlan),
      remediation_queue: fileReference(args.remediationQueue),
    },
    blockers,
    packet_summary: packetSummary,
    collection_requirements: {
      store_path: collectionPlan.store?.path ?? "data/asl-pilot-store.json",
      store_exists: collectionPlan.store?.exists ?? false,
      required_before_manifest_export: [
        "populate data/asl-pilot-store.json with signer, consent, clip, and challenge records",
        "run node scripts/audit_clip_review.mjs",
        "run node scripts/audit_challenge_review.mjs",
        "run node scripts/audit_dataset_collection_readiness.mjs",
      ],
    },
    labels,
    hard_negative_coverage: hardNegativeRows,
    signer_roster: signerRows(queue),
    queue,
  };
  return packet;
}

function writeBundle(args, packet) {
  fs.rmSync(args.output, { recursive: true, force: true });
  fs.mkdirSync(args.output, { recursive: true });
  const generatedFiles = [
    {
      path: writeLessonQueueCsv(args.output, packet.queue),
      purpose: "Lesson-filtered capture queue using original collection-plan assignment keys.",
    },
    {
      path: writeSignerRosterCsv(args.output, packet.signer_roster),
      purpose: "Lesson-filtered signer roster and assignment counts.",
    },
    {
      path: writeHardNegativeCoverageCsv(args.output, packet.hard_negative_coverage),
      purpose: "Hard-negative taxonomy coverage against current app challenge types.",
    },
  ];
  const manifestPath = path.join(args.output, "MANIFEST.json");
  const readmePath = path.join(args.output, "OPERATOR_README.md");
  const manifest = {
    schema_version: "asl-pilot-rawframe-lesson-collection-bundle/v1",
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
    queue_assignment_count: packet.packet_summary.queue_assignment_count,
    target_label_count: packet.packet_summary.target_label_count,
    near_confusable_label_count: packet.packet_summary.near_confusable_label_count,
    negative_challenge_assignment_count: packet.packet_summary.negative_challenge_assignment_count,
    hard_negative_taxonomy_not_current_app_assignment_count:
      packet.packet_summary.hard_negative_taxonomy_not_current_app_assignment_count,
    blockers: packet.blockers,
  }, null, 2));
  return packet.blockers.length > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame lesson collection packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
