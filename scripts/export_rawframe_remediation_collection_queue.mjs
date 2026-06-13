import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultRemediationPlanPath = path.join(root, "docs", "validation", "rawframe-data-remediation-plan.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultOutputPath = path.join(root, "data", "dataset", "rawframe-remediation-collection-queue.json");
const schemaVersion = "asl-pilot-rawframe-remediation-collection-queue/v1";
const splitOrder = new Map([
  ["train", 0],
  ["validation", 1],
  ["test", 2],
  ["negative_challenge", 3],
]);

function parseArgs(argv) {
  const args = {
    remediationPlan: defaultRemediationPlanPath,
    collectionPlan: defaultCollectionPlanPath,
    output: defaultOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--remediation-plan") {
      args.remediationPlan = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--collection-plan") {
      args.collectionPlan = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_rawframe_remediation_collection_queue.mjs [--write]

Exports exact first-party collection assignments sorted by the retained
raw-frame remediation plan. The queue is an operator aid only: it does not
create clips, alter manifests, approve sources, or serve as final evidence.
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

function fileReference(file) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
  };
}

function priorityByLabel(remediationPlan) {
  const rows = new Map();
  for (const item of remediationPlan.collection_overlay?.priority_labels ?? []) {
    rows.set(item.label_id, item);
  }
  return rows;
}

function bucketForPriority(priority) {
  const signals = new Set(priority?.signals ?? []);
  if (signals.has("zero_recall_on_validation_and_test")) return "zero_recall_validation_and_test";
  if (signals.has("zero_recall_on_test")) return "zero_recall_test";
  if (signals.has("zero_recall_on_validation")) return "zero_recall_validation";
  if (
    signals.has("appears_as_true_label_in_top_validation_confusions") ||
    signals.has("appears_as_true_label_in_top_test_confusions")
  ) return "top_confusion_true_label";
  if ((priority?.priority_score ?? 0) > 0) return "other_priority";
  return "standard";
}

function buildVocabularyRows(collectionPlan, priorities) {
  return (collectionPlan.assignments ?? []).map((assignment, index) => {
    const priority = priorities.get(assignment.label_id);
    return {
      assignment_type: "vocabulary_capture",
      assignment_key: `vocabulary:${index}`,
      priority_bucket: bucketForPriority(priority),
      priority_score: priority?.priority_score ?? 0,
      label_id: assignment.label_id,
      display_text: assignment.display_text,
      split: assignment.split,
      signer_alias: assignment.signer_alias,
      capture_count_for_label_split: assignment.capture_count_for_label_split,
      signals: priority?.signals ?? [],
      observed_recall: priority?.observed_recall ?? null,
      operator_action: "record_first_party_raw_video_clip",
    };
  });
}

function buildNegativeChallengeRows(collectionPlan) {
  return (collectionPlan.negative_challenge_assignments ?? []).map((assignment, index) => ({
    assignment_type: "negative_challenge_capture",
    assignment_key: `negative_challenge:${index}`,
    priority_bucket: "negative_challenge_required",
    priority_score: 0,
    challenge_type: assignment.challenge_type,
    expected_outcome: assignment.expected_outcome,
    split: assignment.split,
    signer_alias: assignment.signer_alias,
    capture_count_for_type: assignment.capture_count_for_type,
    operator_action: "record_first_party_reject_only_clip",
  }));
}

function sortRows(rows) {
  rows.sort((a, b) => (
    bucketRank(a.priority_bucket) - bucketRank(b.priority_bucket) ||
    b.priority_score - a.priority_score ||
    (splitOrder.get(a.split) ?? 99) - (splitOrder.get(b.split) ?? 99) ||
    String(a.label_id ?? a.challenge_type).localeCompare(String(b.label_id ?? b.challenge_type)) ||
    String(a.signer_alias).localeCompare(String(b.signer_alias)) ||
    Number(a.capture_count_for_label_split ?? a.capture_count_for_type ?? 0) -
      Number(b.capture_count_for_label_split ?? b.capture_count_for_type ?? 0)
  ));
  return rows.map((row, index) => ({ queue_index: index + 1, ...row }));
}

function bucketRank(bucket) {
  return {
    zero_recall_validation_and_test: 0,
    zero_recall_test: 1,
    zero_recall_validation: 2,
    top_confusion_true_label: 3,
    other_priority: 4,
    standard: 5,
    negative_challenge_required: 6,
  }[bucket] ?? 99;
}

function summarizeRows(rows) {
  const labels = new Set();
  const priorityLabels = new Set();
  const splits = {};
  const buckets = {};
  for (const row of rows) {
    buckets[row.priority_bucket] = (buckets[row.priority_bucket] ?? 0) + 1;
    splits[row.split] = (splits[row.split] ?? 0) + 1;
    if (row.label_id) labels.add(row.label_id);
    if (row.label_id && row.priority_score > 0) priorityLabels.add(row.label_id);
  }
  return {
    assignment_count: rows.length,
    vocabulary_assignment_count: rows.filter((row) => row.assignment_type === "vocabulary_capture").length,
    negative_challenge_assignment_count: rows.filter((row) => row.assignment_type === "negative_challenge_capture").length,
    label_count: labels.size,
    priority_label_count: priorityLabels.size,
    assignment_counts_by_split: splits,
    assignment_counts_by_bucket: buckets,
  };
}

function buildQueue(args) {
  const remediationPlan = readJson(args.remediationPlan);
  const collectionPlan = readJson(args.collectionPlan);
  if (remediationPlan.schema_version !== "asl-pilot-rawframe-data-remediation-plan/v1") {
    throw new Error("remediation plan schema_version is not asl-pilot-rawframe-data-remediation-plan/v1");
  }
  if (collectionPlan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    throw new Error("collection plan schema_version is not asl-pilot-dataset-collection-plan/v1");
  }
  const priorities = priorityByLabel(remediationPlan);
  const rows = sortRows([
    ...buildVocabularyRows(collectionPlan, priorities),
    ...buildNegativeChallengeRows(collectionPlan),
  ]);
  return {
    schema_version: schemaVersion,
    status: "queue_ready_not_training_data",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_rawframe_remediation_collection_queue.mjs")),
    },
    inputs: {
      remediation_plan: fileReference(args.remediationPlan),
      collection_plan: fileReference(args.collectionPlan),
    },
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      final_model_evidence: false,
    },
    queue_summary: summarizeRows(rows),
    queue: rows,
    blockers: remediationPlan.blockers ?? [],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const queue = buildQueue(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: queue.status,
    wrote: args.write,
    output: projectRelative(args.output),
    assignment_count: queue.queue_summary.assignment_count,
    priority_label_count: queue.queue_summary.priority_label_count,
    blockers: queue.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame remediation collection queue export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
