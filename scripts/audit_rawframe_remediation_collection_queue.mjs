import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultQueuePath = path.join(root, "data", "dataset", "rawframe-remediation-collection-queue.json");
const defaultRemediationPlanPath = path.join(root, "docs", "validation", "rawframe-data-remediation-plan.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-remediation-collection-queue-audit.json");
const schemaVersion = "asl-pilot-rawframe-remediation-collection-queue-audit/v1";
const queueSchemaVersion = "asl-pilot-rawframe-remediation-collection-queue/v1";
const remediationPlanSchemaVersion = "asl-pilot-rawframe-data-remediation-plan/v1";
const collectionPlanSchemaVersion = "asl-pilot-dataset-collection-plan/v1";

const splitOrder = new Map([
  ["train", 0],
  ["validation", 1],
  ["test", 2],
  ["negative_challenge", 3],
]);

const expectedBoundary = {
  changes_store: false,
  changes_manifests: false,
  approves_source: false,
  final_model_evidence: false,
};

function parseArgs(argv) {
  const args = {
    queue: defaultQueuePath,
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
    } else if (item === "--queue") {
      args.queue = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/audit_rawframe_remediation_collection_queue.mjs [--write]

Audits the retained raw-frame remediation collection queue against the current
collection plan and remediation plan. The audit verifies queue coverage,
ordering, hashes, and non-final decision-boundary fields.
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
  const priorities = new Map();
  for (const item of remediationPlan.collection_overlay?.priority_labels ?? []) {
    priorities.set(item.label_id, item);
  }
  return priorities;
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

function rowSortKeyName(row) {
  return String(row.label_id ?? row.challenge_type ?? "");
}

function rowCaptureIndex(row) {
  return Number(row.capture_count_for_label_split ?? row.capture_count_for_type ?? 0);
}

function compareQueueRows(a, b) {
  return (
    bucketRank(a.priority_bucket) - bucketRank(b.priority_bucket) ||
    Number(b.priority_score ?? 0) - Number(a.priority_score ?? 0) ||
    (splitOrder.get(a.split) ?? 99) - (splitOrder.get(b.split) ?? 99) ||
    rowSortKeyName(a).localeCompare(rowSortKeyName(b)) ||
    String(a.signer_alias ?? "").localeCompare(String(b.signer_alias ?? "")) ||
    rowCaptureIndex(a) - rowCaptureIndex(b)
  );
}

function vocabularyKey(row) {
  return [
    "vocabulary_capture",
    row.split,
    row.signer_alias,
    row.label_id,
    row.capture_count_for_label_split,
  ].join("|");
}

function negativeKey(row) {
  return [
    "negative_challenge_capture",
    row.split,
    row.signer_alias,
    row.challenge_type,
    row.expected_outcome,
    row.capture_count_for_type,
  ].join("|");
}

function queueRowKey(row) {
  if (row.assignment_type === "vocabulary_capture") return vocabularyKey(row);
  if (row.assignment_type === "negative_challenge_capture") return negativeKey(row);
  return `unknown|${JSON.stringify(row)}`;
}

function expectedVocabularyRow(assignment, priority) {
  const assignmentKey = String(assignment.assignment_key ?? "");
  return {
    assignment_type: "vocabulary_capture",
    assignment_key: assignmentKey,
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
}

function expectedNegativeRow(assignment) {
  const assignmentKey = String(assignment.assignment_key ?? "");
  return {
    assignment_type: "negative_challenge_capture",
    assignment_key: assignmentKey,
    priority_bucket: "negative_challenge_required",
    priority_score: 0,
    challenge_type: assignment.challenge_type,
    expected_outcome: assignment.expected_outcome,
    split: assignment.split,
    signer_alias: assignment.signer_alias,
    capture_count_for_type: assignment.capture_count_for_type,
    operator_action: "record_first_party_reject_only_clip",
  };
}

function summarizeRows(rows) {
  const labels = new Set();
  const priorityLabels = new Set();
  const assignmentCountsBySplit = {};
  const assignmentCountsByBucket = {};
  for (const row of rows) {
    assignmentCountsBySplit[row.split] = (assignmentCountsBySplit[row.split] ?? 0) + 1;
    assignmentCountsByBucket[row.priority_bucket] = (assignmentCountsByBucket[row.priority_bucket] ?? 0) + 1;
    if (row.label_id) labels.add(row.label_id);
    if (row.label_id && Number(row.priority_score ?? 0) > 0) priorityLabels.add(row.label_id);
  }
  return {
    assignment_count: rows.length,
    vocabulary_assignment_count: rows.filter((row) => row.assignment_type === "vocabulary_capture").length,
    negative_challenge_assignment_count: rows.filter((row) => row.assignment_type === "negative_challenge_capture").length,
    label_count: labels.size,
    priority_label_count: priorityLabels.size,
    assignment_counts_by_split: assignmentCountsBySplit,
    assignment_counts_by_bucket: assignmentCountsByBucket,
  };
}

function addFinding(findings, code, detail) {
  findings.push({ code, detail });
}

function isEqualJson(a, b) {
  return JSON.stringify(canonicalJson(a)) === JSON.stringify(canonicalJson(b));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalJson(nested)]),
  );
}

function pushMissingAndExtraFindings(findings, expectedRows, actualRows) {
  const expectedByKey = new Map();
  const actualByKey = new Map();
  for (const row of expectedRows) expectedByKey.set(queueRowKey(row), row);
  for (const row of actualRows) {
    const key = queueRowKey(row);
    if (actualByKey.has(key)) addFinding(findings, "duplicate_queue_assignment", key);
    actualByKey.set(key, row);
  }

  const missing = [];
  const extra = [];
  const mismatched = [];
  for (const [key, row] of expectedByKey.entries()) {
    const actual = actualByKey.get(key);
    if (!actual) {
      missing.push(key);
      continue;
    }
    const comparableActual = { ...actual };
    delete comparableActual.queue_index;
    if (!isEqualJson(comparableActual, row)) {
      mismatched.push({ key, expected: row, actual: comparableActual });
    }
  }
  for (const key of actualByKey.keys()) {
    if (!expectedByKey.has(key)) extra.push(key);
  }
  if (missing.length > 0) addFinding(findings, "missing_collection_assignments", missing.slice(0, 25));
  if (extra.length > 0) addFinding(findings, "extra_queue_assignments", extra.slice(0, 25));
  if (mismatched.length > 0) addFinding(findings, "mismatched_queue_assignments", mismatched.slice(0, 10));
}

function auditQueue(args) {
  const queue = readJson(args.queue);
  const remediationPlan = readJson(args.remediationPlan);
  const collectionPlan = readJson(args.collectionPlan);
  const findings = [];

  if (queue.schema_version !== queueSchemaVersion) {
    addFinding(findings, "queue_schema_version", queue.schema_version ?? null);
  }
  if (remediationPlan.schema_version !== remediationPlanSchemaVersion) {
    addFinding(findings, "remediation_plan_schema_version", remediationPlan.schema_version ?? null);
  }
  if (collectionPlan.schema_version !== collectionPlanSchemaVersion) {
    addFinding(findings, "collection_plan_schema_version", collectionPlan.schema_version ?? null);
  }
  if (queue.status !== "queue_ready_not_training_data") {
    addFinding(findings, "queue_status", queue.status ?? null);
  }

  const actualInputs = {
    remediation_plan: fileReference(args.remediationPlan),
    collection_plan: fileReference(args.collectionPlan),
  };
  if (!isEqualJson(queue.inputs?.remediation_plan, actualInputs.remediation_plan)) {
    addFinding(findings, "remediation_plan_input_reference", {
      expected: actualInputs.remediation_plan,
      actual: queue.inputs?.remediation_plan ?? null,
    });
  }
  if (!isEqualJson(queue.inputs?.collection_plan, actualInputs.collection_plan)) {
    addFinding(findings, "collection_plan_input_reference", {
      expected: actualInputs.collection_plan,
      actual: queue.inputs?.collection_plan ?? null,
    });
  }

  for (const [key, expectedValue] of Object.entries(expectedBoundary)) {
    if (queue.decision_boundary?.[key] !== expectedValue) {
      addFinding(findings, "decision_boundary", { key, expected: expectedValue, actual: queue.decision_boundary?.[key] });
    }
  }
  for (const [key, value] of Object.entries(queue.decision_boundary ?? {})) {
    if (value !== false) {
      addFinding(findings, "decision_boundary_non_false_value", { key, value });
    }
  }

  const priorities = priorityByLabel(remediationPlan);
  const expectedRows = [
    ...(collectionPlan.assignments ?? []).map((assignment, index) => (
      expectedVocabularyRow({ ...assignment, assignment_key: `vocabulary:${index}` }, priorities.get(assignment.label_id))
    )),
    ...(collectionPlan.negative_challenge_assignments ?? []).map((assignment, index) => (
      expectedNegativeRow({ ...assignment, assignment_key: `negative_challenge:${index}` })
    )),
  ];
  const actualRows = Array.isArray(queue.queue) ? queue.queue : [];

  pushMissingAndExtraFindings(findings, expectedRows, actualRows);

  actualRows.forEach((row, index) => {
    if (row.queue_index !== index + 1) {
      addFinding(findings, "queue_index", { expected: index + 1, actual: row.queue_index ?? null });
    }
    if (row.assignment_type === "vocabulary_capture" && !/^vocabulary:\d+$/.test(String(row.assignment_key ?? ""))) {
      addFinding(findings, "assignment_key", { queue_index: row.queue_index, assignment_key: row.assignment_key ?? null });
    }
    if (row.assignment_type === "negative_challenge_capture" && !/^negative_challenge:\d+$/.test(String(row.assignment_key ?? ""))) {
      addFinding(findings, "assignment_key", { queue_index: row.queue_index, assignment_key: row.assignment_key ?? null });
    }
    if (index > 0 && compareQueueRows(actualRows[index - 1], row) > 0) {
      addFinding(findings, "queue_order", {
        previous_queue_index: actualRows[index - 1].queue_index,
        current_queue_index: row.queue_index,
      });
    }
  });

  const computedSummary = summarizeRows(actualRows);
  if (!isEqualJson(queue.queue_summary, computedSummary)) {
    addFinding(findings, "queue_summary", {
      expected: computedSummary,
      actual: queue.queue_summary ?? null,
    });
  }
  if (!isEqualJson(computedSummary, summarizeRows(expectedRows))) {
    addFinding(findings, "expected_summary", {
      expected: summarizeRows(expectedRows),
      actual: computedSummary,
    });
  }

  const storePath = collectionPlan.store?.path ? path.join(root, collectionPlan.store.path) : path.join(root, "data", "asl-pilot-store.json");
  const storeExists = fs.existsSync(storePath);
  if (storeExists !== Boolean(collectionPlan.store?.exists)) {
    addFinding(findings, "collection_store_state", {
      path: projectRelative(storePath),
      expected_exists: Boolean(collectionPlan.store?.exists),
      actual_exists: storeExists,
    });
  }
  if (!storeExists && !(queue.blockers ?? []).some((item) => String(item).includes("First-party collection store is absent"))) {
    addFinding(findings, "missing_store_blocker", queue.blockers ?? []);
  }
  if (
    remediationPlan.inputs?.nvidia_metadata_audit?.status !== "metadata_review_ready_not_approved" &&
    !(queue.blockers ?? []).some((item) => String(item).includes("NVIDIA is not ready"))
  ) {
    addFinding(findings, "missing_external_metadata_blocker", queue.blockers ?? []);
  }

  const report = {
    schema_version: schemaVersion,
    status: findings.length === 0 ? "passed_nonfinal_queue_audit" : "failed",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "audit_rawframe_remediation_collection_queue.mjs")),
    },
    inputs: {
      queue: fileReference(args.queue),
      remediation_plan: actualInputs.remediation_plan,
      collection_plan: actualInputs.collection_plan,
    },
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      final_evidence: false,
    },
    queue_summary: computedSummary,
    expected_summary: summarizeRows(expectedRows),
    coverage: {
      all_collection_assignments_present: findings.every((finding) => finding.code !== "missing_collection_assignments"),
      no_extra_queue_assignments: findings.every((finding) => finding.code !== "extra_queue_assignments"),
      queue_index_continuous: findings.every((finding) => finding.code !== "queue_index"),
      assignment_keys_valid: findings.every((finding) => finding.code !== "assignment_key"),
      queue_order_valid: findings.every((finding) => finding.code !== "queue_order"),
    },
    collection_store: {
      path: projectRelative(storePath),
      exists: storeExists,
      counted_clips: collectionPlan.store?.counted_clips ?? null,
      counted_negative_challenge_clips: collectionPlan.store?.counted_negative_challenge_clips ?? null,
    },
    blockers: queue.blockers ?? [],
    findings,
  };

  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = auditQueue(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    wrote: args.write,
    output: projectRelative(args.output),
    assignment_count: report.queue_summary.assignment_count,
    label_count: report.queue_summary.label_count,
    priority_label_count: report.queue_summary.priority_label_count,
    findings: report.findings,
  }, null, 2));
  return report.status === "passed_nonfinal_queue_audit" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame remediation collection queue audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
