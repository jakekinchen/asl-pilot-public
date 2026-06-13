import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultTrainingProvenancePath = path.join(root, "artifacts", "rawframe-model", "training-provenance.json");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-model-failure-analysis.json");
const schemaVersion = "asl-pilot-rawframe-model-failure-analysis/v1";

function parseArgs(argv) {
  const args = {
    report: defaultReportPath,
    trainingProvenance: defaultTrainingProvenancePath,
    output: defaultOutputPath,
    topN: 15,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--report") {
      args.report = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--training-provenance") {
      args.trainingProvenance = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--top-n") {
      args.topN = readPositiveInteger(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/analyze_rawframe_model_failure.mjs [--write]
  node scripts/analyze_rawframe_model_failure.mjs --report artifacts/rawframe-model/validation-report.json --training-provenance artifacts/rawframe-model/training-provenance.json --write

Builds a retained diagnostic report from the current validation report,
training provenance, and manifest references. It does not train, evaluate, or
change model artifacts.
`);
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function readPositiveInteger(value, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} must be a positive integer`);
  return parsed;
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

function fileRef(file) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
  };
}

function confusionSummary(splitMetrics, topN) {
  const matrix = splitMetrics.confusion_matrix;
  if (!matrix || !Array.isArray(matrix.labels) || !Array.isArray(matrix.rows_true_columns_predicted)) {
    throw new Error(`${splitMetrics.split ?? "split"} metrics are missing confusion_matrix`);
  }
  const labels = matrix.labels;
  const rows = matrix.rows_true_columns_predicted;
  const predictedCounts = labels.map((label, predictedIndex) => ({
    label,
    predicted_count: rows.reduce((total, row) => total + Number(row[predictedIndex] ?? 0), 0),
  }));
  const recallRows = labels.map((label, index) => {
    const support = rows[index].reduce((total, value) => total + Number(value ?? 0), 0);
    const correct = Number(rows[index][index] ?? 0);
    return {
      label,
      support,
      correct,
      recall: support > 0 ? correct / support : 0,
      f1: splitMetrics.per_class?.[label]?.f1 ?? 0,
      precision: splitMetrics.per_class?.[label]?.precision ?? 0,
    };
  });
  const confusionPairs = [];
  for (const [trueIndex, row] of rows.entries()) {
    for (const [predictedIndex, value] of row.entries()) {
      const count = Number(value ?? 0);
      if (trueIndex === predictedIndex || count <= 0) continue;
      confusionPairs.push({
        true_label: labels[trueIndex],
        predicted_label: labels[predictedIndex],
        count,
      });
    }
  }
  predictedCounts.sort((a, b) => b.predicted_count - a.predicted_count || a.label.localeCompare(b.label));
  recallRows.sort((a, b) => b.recall - a.recall || b.correct - a.correct || a.label.localeCompare(b.label));
  confusionPairs.sort((a, b) => b.count - a.count || a.true_label.localeCompare(b.true_label) || a.predicted_label.localeCompare(b.predicted_label));
  return {
    split: splitMetrics.split,
    examples: splitMetrics.examples,
    top1_accuracy: splitMetrics.top1_accuracy,
    macro_f1: splitMetrics.macro_f1,
    predicted_label_coverage: {
      predicted_nonzero_count: predictedCounts.filter((item) => item.predicted_count > 0).length,
      total_labels: labels.length,
      zero_prediction_labels: predictedCounts
        .filter((item) => item.predicted_count === 0)
        .map((item) => item.label),
    },
    recall_coverage: {
      labels_with_nonzero_recall: recallRows.filter((item) => item.correct > 0).length,
      total_labels: labels.length,
      zero_recall_labels: recallRows
        .filter((item) => item.correct === 0)
        .map((item) => item.label)
        .sort(),
    },
    top_predicted_labels: predictedCounts.slice(0, topN),
    top_recall_labels: recallRows.slice(0, topN),
    lowest_nonzero_recall_labels: recallRows
      .filter((item) => item.correct > 0)
      .sort((a, b) => a.recall - b.recall || a.label.localeCompare(b.label))
      .slice(0, topN),
    top_confusions: confusionPairs.slice(0, topN),
  };
}

function manifestSummaries(report) {
  return (report.manifests ?? []).map((item) => {
    const manifestPath = resolveProjectPath(item.path, "manifest path");
    const manifest = readJson(manifestPath);
    const signerIds = new Set();
    const labelCounts = new Map();
    for (const clip of manifest.clips ?? []) {
      if (clip.signer_id) signerIds.add(clip.signer_id);
      if (clip.label_id) labelCounts.set(clip.label_id, (labelCounts.get(clip.label_id) ?? 0) + 1);
    }
    const counts = [...labelCounts.values()];
    return {
      split: manifest.split,
      path: item.path,
      sha256: sha256File(manifestPath),
      dataset_source_mode: manifest.dataset_source_mode,
      clip_count: Array.isArray(manifest.clips) ? manifest.clips.length : 0,
      label_count: Array.isArray(manifest.labels) ? manifest.labels.length : labelCounts.size,
      signer_count: signerIds.size,
      min_clips_per_label: counts.length ? Math.min(...counts) : 0,
      max_clips_per_label: counts.length ? Math.max(...counts) : 0,
    };
  });
}

function signerOverlap(manifests) {
  const bySplit = new Map();
  for (const item of manifests) {
    const manifest = readJson(resolveProjectPath(item.path, "manifest path"));
    bySplit.set(manifest.split, new Set((manifest.clips ?? []).map((clip) => clip.signer_id).filter(Boolean)));
  }
  const pairs = [];
  const entries = [...bySplit.entries()];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const [leftSplit, leftSet] = entries[left];
      const [rightSplit, rightSet] = entries[right];
      const overlap = [...leftSet].filter((signer) => rightSet.has(signer));
      pairs.push({
        left_split: leftSplit,
        right_split: rightSplit,
        overlap_count: overlap.length,
      });
    }
  }
  return pairs;
}

function trainingDynamics(provenance, report) {
  const history = Array.isArray(provenance.history) ? provenance.history : [];
  const bestTrain = maxBy(history, (item) => item.train?.accuracy ?? -Infinity);
  const bestValidation = maxBy(history, (item) => item.validation?.accuracy ?? -Infinity);
  const finalEpoch = history.at(-1) ?? null;
  const selectedEpoch = provenance.checkpoint_selection?.selected_epoch ?? null;
  const selectedValidationAccuracy = provenance.checkpoint_selection?.selected_validation_metrics?.accuracy ?? null;
  return {
    epoch_count: history.length,
    selected_epoch: selectedEpoch,
    selected_validation_accuracy: selectedValidationAccuracy,
    best_train_accuracy: bestTrain ? {
      epoch: bestTrain.epoch,
      accuracy: bestTrain.train?.accuracy,
      loss: bestTrain.train?.loss,
    } : null,
    best_validation_accuracy: bestValidation ? {
      epoch: bestValidation.epoch,
      accuracy: bestValidation.validation?.accuracy,
      loss: bestValidation.validation?.loss,
    } : null,
    final_epoch: finalEpoch ? {
      epoch: finalEpoch.epoch,
      train_accuracy: finalEpoch.train?.accuracy,
      train_loss: finalEpoch.train?.loss,
      validation_accuracy: finalEpoch.validation?.accuracy,
      validation_loss: finalEpoch.validation?.loss,
    } : null,
    final_train_minus_selected_validation_accuracy: (
      typeof finalEpoch?.train?.accuracy === "number" &&
      typeof selectedValidationAccuracy === "number"
    ) ? finalEpoch.train.accuracy - selectedValidationAccuracy : null,
    test_accuracy_minus_chance: (
      typeof report.test?.top1_accuracy === "number" &&
      typeof report.model?.label_count === "number" &&
      report.model.label_count > 0
    ) ? report.test.top1_accuracy - (1 / report.model.label_count) : null,
  };
}

function signerGeneralizationSummary(splitMetrics, topN) {
  const metrics = splitMetrics.signer_metrics;
  if (!metrics || !Array.isArray(metrics.by_signer)) {
    return {
      split: splitMetrics.split,
      available: false,
      reason: "validation report does not include signer_metrics",
    };
  }
  const rows = metrics.by_signer
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      signer_id: item.signer_id ?? "unknown",
      examples: Number(item.examples ?? 0),
      correct: Number(item.correct ?? 0),
      accuracy: Number(item.accuracy ?? 0),
      label_count: Number(item.label_count ?? 0),
      mean_confidence: Number(item.mean_confidence ?? 0),
      max_confidence: Number(item.max_confidence ?? 0),
      zero_correct: item.zero_correct === true,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.examples - a.examples || String(a.signer_id).localeCompare(String(b.signer_id)));
  return {
    split: splitMetrics.split,
    available: true,
    signer_count: Number(metrics.signer_count ?? rows.length),
    zero_correct_signer_count: Number(metrics.zero_correct_signer_count ?? rows.filter((item) => item.zero_correct).length),
    lowest_accuracy_signers: rows.slice(0, topN),
    highest_accuracy_signers: [...rows]
      .sort((a, b) => b.accuracy - a.accuracy || String(a.signer_id).localeCompare(String(b.signer_id)))
      .slice(0, topN),
  };
}

function maxBy(items, selector) {
  let best = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const value = selector(item);
    if (value > bestValue) {
      best = item;
      bestValue = value;
    }
  }
  return best;
}

function buildAnalysis(args) {
  const report = readJson(args.report);
  const provenance = readJson(args.trainingProvenance);
  if (report.schema_version !== "asl-pilot-validation-report/v1") {
    throw new Error("validation report schema_version is not asl-pilot-validation-report/v1");
  }
  if (provenance.schema_version !== "asl-pilot-training-provenance/v1") {
    throw new Error("training provenance schema_version is not asl-pilot-training-provenance/v1");
  }
  const manifestSummary = manifestSummaries(report);
  const dynamics = trainingDynamics(provenance, report);
  const validationSummary = confusionSummary(report.validation, args.topN);
  const testSummary = confusionSummary(report.test, args.topN);
  const negativeMetrics = report.negative_challenge?.metrics ?? null;
  const passStatus = report.pass_status ?? {};
  const failedTargets = Object.entries(passStatus)
    .filter(([, passed]) => passed !== true)
    .map(([name]) => name);
  return {
    schema_version: schemaVersion,
    status: report.status === "candidate_final_validation_passed"
      ? "candidate_passed_unexpectedly"
      : "candidate_failed_analyzed",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileRef(path.join(root, "scripts", "analyze_rawframe_model_failure.mjs")),
    },
    inputs: {
      validation_report: fileRef(args.report),
      training_provenance: fileRef(args.trainingProvenance),
    },
    model: {
      architecture: report.model?.architecture ?? provenance.architecture ?? null,
      label_count: report.model?.label_count ?? null,
      runtime_device: report.model?.runtime_device ?? provenance.framework?.device ?? null,
      initialization: report.model?.initialization ?? provenance.initialization ?? null,
      pretrained_components: report.model?.pretrained_components ?? provenance.pretrained_components ?? null,
    },
    target_status: {
      report_status: report.status,
      failed_targets: failedTargets,
      targets: report.targets ?? null,
      pass_status: passStatus,
    },
    training_dynamics: dynamics,
    manifest_summary: manifestSummary,
    signer_overlap: signerOverlap(report.manifests ?? []),
    signer_generalization: {
      validation: signerGeneralizationSummary(report.validation, args.topN),
      test: signerGeneralizationSummary(report.test, args.topN),
    },
    validation_summary: validationSummary,
    test_summary: testSummary,
    threshold_summary: {
      selected_threshold: report.threshold_calibration?.selected_threshold ?? null,
      validation_selected_metrics: report.threshold_calibration?.selected_metrics ?? null,
      test_threshold_metrics: report.test?.threshold_metrics ?? null,
      negative_challenge_metrics: negativeMetrics,
    },
    interpretation: [
      "The selected checkpoint does not meet final model quality gates.",
      "The final training epoch memorized the training split far more than it generalized to signer-disjoint validation/test splits.",
      "Many held-out labels have zero recall, so additional approved signer/source diversity is more likely to matter than another small hyperparameter rerun.",
      "ONNX/browser final export should remain fail-closed until a later validation report reaches candidate_final_validation_passed.",
    ],
    next_evidence_needed: [
      "approved additional raw-video training data or consented first-party collection",
      "metadata/source-register approval before any NVIDIA or other online source import",
      "new training and evaluation report with substantially higher held-out top-1 and macro-F1",
      "negative challenge false-pass rate below the final target",
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const analysis = buildAnalysis(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: analysis.status,
    wrote: args.write,
    output: projectRelative(args.output),
    report_status: analysis.target_status.report_status,
    failed_targets: analysis.target_status.failed_targets,
    final_train_minus_selected_validation_accuracy: analysis.training_dynamics.final_train_minus_selected_validation_accuracy,
    validation_zero_recall_labels: analysis.validation_summary.recall_coverage.zero_recall_labels.length,
    test_zero_recall_labels: analysis.test_summary.recall_coverage.zero_recall_labels.length,
    negative_challenge_false_pass_rate: analysis.threshold_summary.negative_challenge_metrics?.false_pass_rate ?? null,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame model failure analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
