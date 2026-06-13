import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultFailureAnalysisPath = path.join(root, "docs", "validation", "rawframe-model-failure-analysis.json");
const defaultSplitShiftDiagnosticPath = path.join(root, "docs", "validation", "rawframe-split-shift-diagnostic.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultNvidiaMetadataAuditPath = path.join(root, "docs", "research", "nvidia-asl-metadata-audit.json");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-data-remediation-plan.json");
const schemaVersion = "asl-pilot-rawframe-data-remediation-plan/v1";

function parseArgs(argv) {
  const args = {
    failureAnalysis: defaultFailureAnalysisPath,
    splitShiftDiagnostic: defaultSplitShiftDiagnosticPath,
    collectionPlan: defaultCollectionPlanPath,
    nvidiaMetadataAudit: defaultNvidiaMetadataAuditPath,
    output: defaultOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--failure-analysis") {
      args.failureAnalysis = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--split-shift-diagnostic") {
      args.splitShiftDiagnostic = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--collection-plan") {
      args.collectionPlan = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--nvidia-metadata-audit") {
      args.nvidiaMetadataAudit = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/plan_rawframe_data_remediation.mjs [--write]

Builds an evidence-backed remediation plan from the current model failure
analysis, raw-frame split-shift diagnostic, and first-party collection plan.
The output does not approve any data source and does not change manifests; it
prioritizes approved future collection or post-access online metadata review.
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

function addSignal(row, signal, weight) {
  row.priority_score += weight;
  row.signals.push(signal);
}

function assignmentSummary(collectionPlan) {
  const byLabel = new Map();
  for (const assignment of collectionPlan.assignments ?? []) {
    const label = assignment.label_id;
    if (!label) continue;
    const row = byLabel.get(label) ?? {
      label_id: label,
      display_text: assignment.display_text ?? label,
      planned_captures_by_split: { train: 0, validation: 0, test: 0 },
      planned_signers_by_split: { train: new Set(), validation: new Set(), test: new Set() },
    };
    if (row.planned_captures_by_split[assignment.split] !== undefined) {
      row.planned_captures_by_split[assignment.split] += 1;
      if (assignment.signer_alias) row.planned_signers_by_split[assignment.split].add(assignment.signer_alias);
    }
    byLabel.set(label, row);
  }
  return byLabel;
}

function finalizeAssignmentSummary(row) {
  return {
    label_id: row.label_id,
    display_text: row.display_text,
    planned_captures_by_split: row.planned_captures_by_split,
    planned_signer_counts_by_split: Object.fromEntries(
      Object.entries(row.planned_signers_by_split).map(([split, signers]) => [split, signers.size]),
    ),
  };
}

function recallMap(summary) {
  const output = new Map();
  for (const item of summary.top_recall_labels ?? []) {
    output.set(item.label, item.recall);
  }
  for (const item of summary.lowest_nonzero_recall_labels ?? []) {
    output.set(item.label, item.recall);
  }
  for (const label of summary.recall_coverage?.zero_recall_labels ?? []) {
    output.set(label, 0);
  }
  return output;
}

function topConfusionTrueLabels(summary) {
  const counts = new Map();
  for (const item of summary.top_confusions ?? []) {
    counts.set(item.true_label, (counts.get(item.true_label) ?? 0) + Number(item.count ?? 0));
  }
  return counts;
}

function buildPriorityRows(failureAnalysis, collectionPlan) {
  const byLabel = assignmentSummary(collectionPlan);
  const validationZero = new Set(failureAnalysis.validation_summary?.recall_coverage?.zero_recall_labels ?? []);
  const testZero = new Set(failureAnalysis.test_summary?.recall_coverage?.zero_recall_labels ?? []);
  const validationRecall = recallMap(failureAnalysis.validation_summary ?? {});
  const testRecall = recallMap(failureAnalysis.test_summary ?? {});
  const validationConfusions = topConfusionTrueLabels(failureAnalysis.validation_summary ?? {});
  const testConfusions = topConfusionTrueLabels(failureAnalysis.test_summary ?? {});
  const rows = [];
  for (const [label, assignment] of byLabel.entries()) {
    const row = {
      label_id: label,
      display_text: assignment.display_text,
      priority_score: 0,
      signals: [],
      observed_recall: {
        validation: validationRecall.has(label) ? validationRecall.get(label) : null,
        test: testRecall.has(label) ? testRecall.get(label) : null,
      },
      top_confusion_misclassified_count: {
        validation: validationConfusions.get(label) ?? 0,
        test: testConfusions.get(label) ?? 0,
      },
      collection_plan: finalizeAssignmentSummary(assignment),
    };
    if (validationZero.has(label) && testZero.has(label)) {
      addSignal(row, "zero_recall_on_validation_and_test", 8);
    } else {
      if (validationZero.has(label)) addSignal(row, "zero_recall_on_validation", 4);
      if (testZero.has(label)) addSignal(row, "zero_recall_on_test", 5);
    }
    if ((validationConfusions.get(label) ?? 0) > 0) {
      addSignal(row, "appears_as_true_label_in_top_validation_confusions", Math.min(3, validationConfusions.get(label)));
    }
    if ((testConfusions.get(label) ?? 0) > 0) {
      addSignal(row, "appears_as_true_label_in_top_test_confusions", Math.min(4, testConfusions.get(label)));
    }
    if (row.observed_recall.validation !== null && row.observed_recall.validation > 0 && row.observed_recall.validation <= 1 / 19) {
      addSignal(row, "low_nonzero_validation_recall", 1);
    }
    if (row.observed_recall.test !== null && row.observed_recall.test > 0 && row.observed_recall.test <= 1 / 19) {
      addSignal(row, "low_nonzero_test_recall", 1);
    }
    rows.push(row);
  }
  rows.sort((a, b) => (
    b.priority_score - a.priority_score ||
    b.top_confusion_misclassified_count.test - a.top_confusion_misclassified_count.test ||
    b.top_confusion_misclassified_count.validation - a.top_confusion_misclassified_count.validation ||
    a.label_id.localeCompare(b.label_id)
  ));
  return rows;
}

function coverageSummary(rows) {
  const critical = rows.filter((row) => row.signals.includes("zero_recall_on_validation_and_test"));
  const validationZero = rows.filter((row) => row.signals.includes("zero_recall_on_validation"));
  const testZero = rows.filter((row) => row.signals.includes("zero_recall_on_test"));
  const confusion = rows.filter((row) => (
    row.signals.includes("appears_as_true_label_in_top_validation_confusions") ||
    row.signals.includes("appears_as_true_label_in_top_test_confusions")
  ));
  return {
    labels_total: rows.length,
    priority_labels_nonzero_score: rows.filter((row) => row.priority_score > 0).length,
    zero_recall_on_validation_and_test: critical.length,
    zero_recall_on_validation_only: validationZero.length,
    zero_recall_on_test_only: testZero.length,
    labels_in_top_confusions: confusion.length,
  };
}

function nvidiaStatus(nvidiaAuditPath) {
  if (!fs.existsSync(nvidiaAuditPath)) {
    return {
      path: projectRelative(nvidiaAuditPath),
      exists: false,
      status: "missing",
      blockers: [`Missing NVIDIA metadata audit: ${projectRelative(nvidiaAuditPath)}`],
    };
  }
  const audit = readJson(nvidiaAuditPath);
  return {
    path: projectRelative(nvidiaAuditPath),
    exists: true,
    sha256: sha256File(nvidiaAuditPath),
    status: audit.status,
    blockers: audit.blockers ?? [],
    metadata_dir: audit.inputs?.metadata_dir ?? null,
    access_receipt: audit.inputs?.access_receipt ?? null,
  };
}

function splitShiftStatus(splitShiftPath) {
  if (!fs.existsSync(splitShiftPath)) {
    return {
      path: projectRelative(splitShiftPath),
      exists: false,
      status: "missing",
      blockers: [`Missing raw-frame split-shift diagnostic: ${projectRelative(splitShiftPath)}`],
    };
  }
  const diagnostic = readJson(splitShiftPath);
  if (diagnostic.schema_version !== "asl-pilot-rawframe-split-shift-diagnostic/v1") {
    throw new Error("Split-shift diagnostic schema_version is not asl-pilot-rawframe-split-shift-diagnostic/v1");
  }
  return {
    path: projectRelative(splitShiftPath),
    exists: true,
    sha256: sha256File(splitShiftPath),
    status: diagnostic.status,
    sample_count: diagnostic.sampling?.sample_count ?? null,
    mean_nearest_own_split_rate: diagnostic.split_separability?.mean_nearest_own_split_rate ?? null,
    validation_nearest_train_label_centroid_accuracy:
      diagnostic.nearest_train_label_centroid?.validation?.nearest_train_label_centroid_accuracy ?? null,
    test_nearest_train_label_centroid_accuracy:
      diagnostic.nearest_train_label_centroid?.test?.nearest_train_label_centroid_accuracy ?? null,
    signals: diagnostic.interpretation?.signals ?? [],
  };
}

function buildPlan(args) {
  const failureAnalysis = readJson(args.failureAnalysis);
  const collectionPlan = readJson(args.collectionPlan);
  if (failureAnalysis.schema_version !== "asl-pilot-rawframe-model-failure-analysis/v1") {
    throw new Error("Failure analysis schema_version is not asl-pilot-rawframe-model-failure-analysis/v1");
  }
  if (collectionPlan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    throw new Error("Collection plan schema_version is not asl-pilot-dataset-collection-plan/v1");
  }
  const priorities = buildPriorityRows(failureAnalysis, collectionPlan);
  const splitShift = splitShiftStatus(args.splitShiftDiagnostic);
  const nvidia = nvidiaStatus(args.nvidiaMetadataAudit);
  const blockers = [];
  if (collectionPlan.store?.exists !== true) {
    blockers.push(`First-party collection store is absent: ${collectionPlan.store?.path ?? "data/asl-pilot-store.json"}`);
  }
  if (nvidia.status !== "metadata_review_ready_not_approved") {
    blockers.push("NVIDIA is not ready for source-register review; metadata audit is not metadata_review_ready_not_approved");
  }
  return {
    schema_version: schemaVersion,
    status: "remediation_plan_ready_not_training_data",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "plan_rawframe_data_remediation.mjs")),
    },
    inputs: {
      failure_analysis: fileReference(args.failureAnalysis),
      split_shift_diagnostic: splitShift,
      collection_plan: fileReference(args.collectionPlan),
      nvidia_metadata_audit: nvidia,
    },
    decision_boundary: {
      changes_manifests: false,
      approves_new_source: false,
      changes_vocabulary_scope: false,
      final_model_evidence: false,
    },
    current_failure_summary: {
      report_status: failureAnalysis.target_status?.report_status,
      failed_targets: failureAnalysis.target_status?.failed_targets ?? [],
      final_train_minus_selected_validation_accuracy: failureAnalysis.training_dynamics?.final_train_minus_selected_validation_accuracy,
      validation_zero_recall_labels: failureAnalysis.validation_summary?.recall_coverage?.zero_recall_labels?.length ?? null,
      test_zero_recall_labels: failureAnalysis.test_summary?.recall_coverage?.zero_recall_labels?.length ?? null,
      negative_challenge_false_pass_rate: failureAnalysis.threshold_summary?.negative_challenge_metrics?.false_pass_rate ?? null,
      split_shift_signals: splitShift.signals ?? [],
      validation_low_level_label_centroid_accuracy: splitShift.validation_nearest_train_label_centroid_accuracy ?? null,
      test_low_level_label_centroid_accuracy: splitShift.test_nearest_train_label_centroid_accuracy ?? null,
    },
    collection_overlay: {
      collection_plan_status: collectionPlan.review_gate?.status ?? null,
      store: collectionPlan.store ?? null,
      assignment_count: collectionPlan.assignment_count,
      planned_signer_counts: collectionPlan.planned_signer_counts,
      priority_summary: coverageSummary(priorities),
      priority_labels: priorities.filter((row) => row.priority_score > 0),
    },
    recommended_sequence: [
      "Keep all 95 labels in scope unless the user explicitly approves a reduced pilot.",
      "Collect or import only source-approved raw RGB videos; keep recognition inputs limited to raw frame tensors derived from those videos.",
      "Do not treat low-level RGB statistics as a remedy; the retained split-shift diagnostic shows train label centroids do not generalize to held-out validation/test samples.",
      "For first-party collection, prioritize labels with zero recall on both validation and test, then test-zero labels, then validation-zero labels and top-confusion true labels.",
      "For NVIDIA or any online source, run metadata-only review first and require source-register approval before media import.",
      "Retrain only after new approved raw-video evidence exists, then rerun evaluation, calibration, ONNX export, and browser parity from the final gates.",
    ],
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const plan = buildPlan(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: plan.status,
    wrote: args.write,
    output: projectRelative(args.output),
    priority_labels: plan.collection_overlay.priority_summary.priority_labels_nonzero_score,
    zero_recall_on_validation_and_test: plan.collection_overlay.priority_summary.zero_recall_on_validation_and_test,
    blockers: plan.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame data remediation planning failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
