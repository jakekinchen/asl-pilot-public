import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultInput = path.join(root, "artifacts", "rawframe-model", "controlled-pilot-prediction-sidecar.json");
const defaultOutput = path.join(root, "docs", "validation", "controlled-pilot-per-label-threshold-diagnostic.json");
const acceptedPredictionSidecarSchemas = new Set([
  "asl-pilot-rawframe-prediction-sidecar/v1",
  "asl-pilot-rawframe-prediction-sidecar/v2",
]);
const predictionSidecarV2Contract = "asl-pilot-rawframe-prediction-sidecar-contract/v2";

function parseArgs(argv) {
  const args = {
    input: defaultInput,
    output: defaultOutput,
    write: false,
    targetPrecision: 0.8,
    targetFalsePassRate: 0.05,
    targetNegativeFalsePassRate: 0.05,
  };
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
    if (["--input", "--output"].includes(item)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    if (["--target-precision", "--target-false-pass-rate", "--target-negative-false-pass-rate"].includes(item)) {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid value for ${item}`);
      if (item === "--target-precision") args.targetPrecision = value;
      if (item === "--target-false-pass-rate") args.targetFalsePassRate = value;
      if (item === "--target-negative-false-pass-rate") args.targetNegativeFalsePassRate = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/analyze_controlled_pilot_thresholds.mjs \\
    --input artifacts/rawframe-model/controlled-pilot-prediction-sidecar.json \\
    [--write] [--output docs/validation/controlled-pilot-per-label-threshold-diagnostic.json]

Derives prompt-conditioned per-label thresholds from retained prediction scores.
This script does not promote a model card; it reports whether the supplied
sidecar is final evidence or only diagnostic/smoke evidence.
`);
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function requireArray(value, context) {
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`);
  return value;
}

function requireSidecarSchema(sidecar) {
  if (!acceptedPredictionSidecarSchemas.has(sidecar.schema_version)) {
    throw new Error(`prediction sidecar schema_version must be one of ${[...acceptedPredictionSidecarSchemas].join(", ")}`);
  }
  if (
    sidecar.schema_version === "asl-pilot-rawframe-prediction-sidecar/v2" &&
    sidecar.sidecar_contract?.version !== predictionSidecarV2Contract
  ) {
    throw new Error(`prediction sidecar v2 requires sidecar_contract.version ${predictionSidecarV2Contract}`);
  }
}

function requirePredictionExamples(sidecar, split, { requireTrueLabel }) {
  const examples = requireArray(sidecar[split]?.examples, `${split}.examples`);
  for (const [index, item] of examples.entries()) {
    if (requireTrueLabel && typeof item.true_label !== "string") {
      throw new Error(`${split}.examples[${index}].true_label must be a string`);
    }
    if (typeof item.predicted_label !== "string") {
      throw new Error(`${split}.examples[${index}].predicted_label must be a string`);
    }
    if (typeof item.confidence !== "number" || !Number.isFinite(item.confidence)) {
      throw new Error(`${split}.examples[${index}].confidence must be a finite number`);
    }
  }
  return examples;
}

function uniqueLabels(validationExamples, testExamples) {
  const labels = new Set();
  for (const item of validationExamples) {
    labels.add(item.true_label);
    labels.add(item.predicted_label);
  }
  for (const item of testExamples) {
    labels.add(item.true_label);
    labels.add(item.predicted_label);
  }
  return [...labels].sort();
}

function scoreRowsForLabel(examples, label) {
  const positives = examples.filter((item) => item.true_label === label);
  const nonLabel = examples.filter((item) => item.true_label !== label);
  return {
    positives,
    nonLabel,
    positivePredictions: positives.filter((item) => item.predicted_label === label),
    falsePredictions: nonLabel.filter((item) => item.predicted_label === label),
  };
}

function negativeRowsForLabel(examples, label) {
  return examples.filter((item) => item.predicted_label === label);
}

function candidateThresholds(validationRows, negativeRows) {
  const values = new Set([1, 0]);
  for (const item of [...validationRows.positivePredictions, ...validationRows.falsePredictions, ...negativeRows]) {
    if (typeof item.confidence === "number" && Number.isFinite(item.confidence)) {
      values.add(roundThreshold(item.confidence));
      values.add(roundThreshold(Math.min(1, item.confidence + 0.000001)));
    }
  }
  return [...values].sort((a, b) => a - b);
}

function roundThreshold(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(6))));
}

function metricsAtThreshold(rows, negativeRows, threshold) {
  const trueAccepts = rows.positivePredictions.filter((item) => item.confidence >= threshold);
  const falseAccepts = rows.falsePredictions.filter((item) => item.confidence >= threshold);
  const negativeFalsePasses = negativeRows.filter((item) => item.confidence >= threshold);
  const acceptedCount = trueAccepts.length + falseAccepts.length;
  return {
    threshold,
    positive_examples: rows.positives.length,
    non_label_examples: rows.nonLabel.length,
    true_accept_count: trueAccepts.length,
    false_accept_count: falseAccepts.length,
    negative_false_pass_count: negativeFalsePasses.length,
    accepted_count: acceptedCount,
    correct_pass_rate: rows.positives.length > 0 ? trueAccepts.length / rows.positives.length : 0,
    validation_false_pass_rate: rows.nonLabel.length > 0 ? falseAccepts.length / rows.nonLabel.length : 0,
    accepted_precision: acceptedCount > 0 ? trueAccepts.length / acceptedCount : 0,
    negative_false_pass_rate: negativeRows.length > 0 ? negativeFalsePasses.length / negativeRows.length : 0,
  };
}

function selectThreshold(validationExamples, negativeExamples, label, args) {
  const validationRows = scoreRowsForLabel(validationExamples, label);
  const negativeRows = negativeRowsForLabel(negativeExamples, label);
  const rows = candidateThresholds(validationRows, negativeRows).map((threshold) =>
    metricsAtThreshold(validationRows, negativeRows, threshold),
  );
  const eligible = rows
    .filter((row) => row.true_accept_count > 0)
    .filter((row) => row.accepted_precision >= args.targetPrecision)
    .filter((row) => row.validation_false_pass_rate <= args.targetFalsePassRate)
    .filter((row) => row.negative_false_pass_rate <= args.targetNegativeFalsePassRate);
  if (eligible.length === 0) {
    return {
      label,
      status: "fail_closed_no_eligible_threshold",
      selected: metricsAtThreshold(validationRows, negativeRows, 1),
      best_available: rows.sort(compareThresholdRows)[0] ?? null,
    };
  }
  eligible.sort(compareThresholdRows);
  return {
    label,
    status: "threshold_selected",
    selected: eligible[0],
    best_available: rows.sort(compareThresholdRows)[0] ?? null,
  };
}

function compareThresholdRows(left, right) {
  return (
    right.correct_pass_rate - left.correct_pass_rate ||
    right.accepted_precision - left.accepted_precision ||
    left.validation_false_pass_rate - right.validation_false_pass_rate ||
    left.negative_false_pass_rate - right.negative_false_pass_rate ||
    right.threshold - left.threshold
  );
}

function applyThresholds(examples, thresholdsByLabel) {
  let trueAcceptCount = 0;
  let falseAcceptCount = 0;
  let positiveCount = 0;
  for (const item of examples) {
    if (typeof item.true_label !== "string") continue;
    positiveCount += 1;
    if (item.predicted_label === item.true_label) {
      const threshold = thresholdsByLabel[item.true_label] ?? 1;
      if (item.confidence >= threshold) trueAcceptCount += 1;
      continue;
    }
    const predictedThreshold = thresholdsByLabel[item.predicted_label] ?? 1;
    if (item.confidence >= predictedThreshold) falseAcceptCount += 1;
  }
  const acceptedCount = trueAcceptCount + falseAcceptCount;
  return {
    examples: positiveCount,
    true_accept_count: trueAcceptCount,
    false_accept_count: falseAcceptCount,
    accepted_count: acceptedCount,
    coverage: positiveCount > 0 ? trueAcceptCount / positiveCount : 0,
    accepted_precision: acceptedCount > 0 ? trueAcceptCount / acceptedCount : 0,
    false_pass_rate: positiveCount > 0 ? falseAcceptCount / positiveCount : 0,
  };
}

function applyNegativeThresholds(examples, thresholdsByLabel) {
  let falsePassCount = 0;
  for (const item of examples) {
    const threshold = thresholdsByLabel[item.predicted_label] ?? 1;
    if (item.confidence >= threshold) falsePassCount += 1;
  }
  return {
    examples: examples.length,
    false_pass_count: falsePassCount,
    false_pass_rate: examples.length > 0 ? falsePassCount / examples.length : 0,
  };
}

function globalThresholdCandidates(validationExamples, negativeExamples) {
  const values = new Set([1, 0]);
  for (const item of [...validationExamples, ...negativeExamples]) {
    if (typeof item.confidence === "number" && Number.isFinite(item.confidence)) {
      values.add(roundThreshold(item.confidence));
      values.add(roundThreshold(Math.min(1, item.confidence + 0.000001)));
    }
  }
  return [...values].sort((a, b) => a - b);
}

function applyGlobalThreshold(examples, threshold) {
  let trueAcceptCount = 0;
  let falseAcceptCount = 0;
  for (const item of examples) {
    if (typeof item.true_label !== "string") continue;
    if (item.confidence < threshold) continue;
    if (item.predicted_label === item.true_label) {
      trueAcceptCount += 1;
    } else {
      falseAcceptCount += 1;
    }
  }
  const acceptedCount = trueAcceptCount + falseAcceptCount;
  return {
    threshold,
    examples: examples.length,
    true_accept_count: trueAcceptCount,
    false_accept_count: falseAcceptCount,
    accepted_count: acceptedCount,
    coverage: examples.length > 0 ? trueAcceptCount / examples.length : 0,
    accepted_precision: acceptedCount > 0 ? trueAcceptCount / acceptedCount : 0,
    false_pass_rate: examples.length > 0 ? falseAcceptCount / examples.length : 0,
  };
}

function applyGlobalNegativeThreshold(examples, threshold) {
  const falsePassCount = examples.filter((item) => item.confidence >= threshold).length;
  return {
    threshold,
    examples: examples.length,
    false_pass_count: falsePassCount,
    false_pass_rate: examples.length > 0 ? falsePassCount / examples.length : 0,
  };
}

function selectGlobalThreshold(validationExamples, testExamples, negativeExamples, args) {
  const rows = globalThresholdCandidates(validationExamples, negativeExamples).map((threshold) => {
    const validation = applyGlobalThreshold(validationExamples, threshold);
    const negative = applyGlobalNegativeThreshold(negativeExamples, threshold);
    return {
      threshold,
      validation,
      negative_challenge: negative,
    };
  });
  const eligible = rows
    .filter((row) => row.validation.true_accept_count > 0)
    .filter((row) => row.validation.accepted_precision >= args.targetPrecision)
    .filter((row) => row.validation.false_pass_rate <= args.targetFalsePassRate)
    .filter((row) => row.negative_challenge.false_pass_rate <= args.targetNegativeFalsePassRate);
  const compare = (left, right) => (
    right.validation.coverage - left.validation.coverage ||
    right.validation.accepted_precision - left.validation.accepted_precision ||
    left.validation.false_pass_rate - right.validation.false_pass_rate ||
    left.negative_challenge.false_pass_rate - right.negative_challenge.false_pass_rate ||
    left.threshold - right.threshold
  );
  const selected = [...eligible].sort(compare)[0] ?? null;
  const bestAvailable = [...rows].sort(compare)[0] ?? null;
  const threshold = selected?.threshold ?? 1;
  return {
    status: selected ? "threshold_selected" : "fail_closed_no_eligible_threshold",
    selected: selected
      ? {
        threshold,
        validation: selected.validation,
        test: applyGlobalThreshold(testExamples, threshold),
        negative_challenge: selected.negative_challenge,
      }
      : {
        threshold: 1,
        validation: applyGlobalThreshold(validationExamples, 1),
        test: applyGlobalThreshold(testExamples, 1),
        negative_challenge: applyGlobalNegativeThreshold(negativeExamples, 1),
      },
    best_available: bestAvailable
      ? {
        threshold: bestAvailable.threshold,
        validation: bestAvailable.validation,
        test: applyGlobalThreshold(testExamples, bestAvailable.threshold),
        negative_challenge: bestAvailable.negative_challenge,
      }
      : null,
  };
}

function buildReport(args) {
  const sidecar = readJson(args.input);
  requireSidecarSchema(sidecar);
  const validationExamples = requirePredictionExamples(sidecar, "validation", { requireTrueLabel: true });
  const testExamples = requirePredictionExamples(sidecar, "test", { requireTrueLabel: true });
  const negativeExamples = Array.isArray(sidecar.negative_challenge?.examples)
    ? requirePredictionExamples(sidecar, "negative_challenge", { requireTrueLabel: false })
    : [];
  const labels = uniqueLabels(validationExamples, testExamples);
  const perLabel = labels.map((label) => selectThreshold(validationExamples, negativeExamples, label, args));
  const selectedThresholds = Object.fromEntries(
    perLabel.map((item) => [
      item.label,
      item.status === "threshold_selected" ? item.selected.threshold : 1,
    ]),
  );
  const selectedCount = perLabel.filter((item) => item.status === "threshold_selected").length;
  const globalThresholdDiagnostic = selectGlobalThreshold(
    validationExamples,
    testExamples,
    negativeExamples,
    args,
  );
  const finalEvidenceModes = new Set(["final", "controlled_pilot"]);
  const finalEvidence =
    finalEvidenceModes.has(sidecar.evidence_mode) &&
    sidecar.validation_report?.status !== "smoke_only";
  return {
    schema_version: "asl-pilot-controlled-pilot-per-label-threshold-diagnostic/v1",
    generated_at: new Date().toISOString(),
    status: finalEvidence
      ? selectedCount === labels.length
        ? `per_label_thresholds_selected_from_${sidecar.evidence_mode}_evidence`
        : `incomplete_per_label_thresholds_from_${sidecar.evidence_mode}_evidence`
      : "diagnostic_only_input_not_final_evidence",
    source: {
      prediction_sidecar: fileReference(args.input),
      evidence_mode: sidecar.evidence_mode ?? null,
      finality: sidecar.finality ?? null,
      validation_report: sidecar.validation_report ?? null,
    },
    targets: {
      accepted_precision_at_least: args.targetPrecision,
      validation_false_pass_rate_at_most: args.targetFalsePassRate,
      negative_false_pass_rate_at_most: args.targetNegativeFalsePassRate,
    },
    summary: {
      label_count: labels.length,
      selected_threshold_count: selectedCount,
      fail_closed_label_count: labels.length - selectedCount,
      validation: applyThresholds(validationExamples, selectedThresholds),
      test: applyThresholds(testExamples, selectedThresholds),
      negative_challenge: applyNegativeThresholds(negativeExamples, selectedThresholds),
      global_threshold: globalThresholdDiagnostic,
    },
    selected_thresholds: selectedThresholds,
    per_label: perLabel,
    promotion_notes: [
      "This diagnostic can inform a prompt-conditioned model card, but it does not promote the active browser model.",
      "Thresholds derived from smoke or diagnostic sidecars must not be claimed as final controlled-pilot validation evidence.",
      "Labels without an eligible threshold remain fail-closed at threshold 1.0.",
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = buildReport(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(args.output) : null,
    labels: report.summary.label_count,
    selected_thresholds: report.summary.selected_threshold_count,
    fail_closed_labels: report.summary.fail_closed_label_count,
    validation: report.summary.validation,
    test: report.summary.test,
    negative_challenge: report.summary.negative_challenge,
  }, null, 2));
  return report.status.startsWith("per_label_thresholds_selected_from_") ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Controlled pilot threshold analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
