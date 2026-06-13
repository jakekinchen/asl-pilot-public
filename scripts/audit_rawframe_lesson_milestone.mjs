import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultMilestone = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultOutput = path.join(root, "docs", "validation", "rawframe-lesson-milestone-audit.json");

function usage() {
  return `
Usage:
  node scripts/audit_rawframe_lesson_milestone.mjs [--write]

Options:
  --milestone <path>            Default: docs/validation/rawframe-lesson-milestone.json
  --validation-report <path>    Default: artifacts/rawframe-model/validation-report.json
  --output <path>               Default: docs/validation/rawframe-lesson-milestone-audit.json
  --write                       Write the audit artifact. Without --write, print it.
`;
}

function resolveProjectPath(value, flag) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error(`${flag} escapes project root: ${value}`);
  }
  return resolved;
}

function parseArgs(argv) {
  const args = {
    milestone: defaultMilestone,
    validationReport: defaultValidationReport,
    output: defaultOutput,
    write: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${item} requires a value`);
      return argv[index];
    };
    if (item === "--write") {
      args.write = true;
    } else if (item === "--milestone") {
      args.milestone = resolveProjectPath(next(), item);
    } else if (item === "--validation-report") {
      args.validationReport = resolveProjectPath(next(), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(next(), item);
    } else if (item === "--help" || item === "-h") {
      console.log(usage().trim());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}\n${usage()}`);
    }
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function metricFor(report, split, labelId) {
  const metrics = report?.[split]?.per_class?.[labelId];
  if (!metrics || typeof metrics !== "object") {
    return { precision: 0, recall: 0, f1: 0, support: 0 };
  }
  return {
    precision: Number(metrics.precision) || 0,
    recall: Number(metrics.recall) || 0,
    f1: Number(metrics.f1) || 0,
    support: Number(metrics.support) || 0,
  };
}

function splitMatrix(report, split) {
  const matrix = report?.[split]?.confusion_matrix;
  if (!matrix || !Array.isArray(matrix.labels) || !Array.isArray(matrix.rows_true_columns_predicted)) {
    throw new Error(`${split} confusion_matrix is missing or malformed`);
  }
  return matrix;
}

function rowTotal(row) {
  return row.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evaluateSplit(report, split, targetLabels, nearConfusableLabels) {
  const matrix = splitMatrix(report, split);
  const labelIndex = new Map(matrix.labels.map((label, index) => [label, index]));
  const targetSet = new Set(targetLabels);
  const nearSet = new Set(nearConfusableLabels);
  const missingTargets = targetLabels.filter((label) => !labelIndex.has(label));
  const missingNearConfusables = nearConfusableLabels.filter((label) => !labelIndex.has(label));
  const targetIndexes = targetLabels.map((label) => labelIndex.get(label)).filter((index) => index !== undefined);
  const nearIndexes = nearConfusableLabels.map((label) => labelIndex.get(label)).filter((index) => index !== undefined);

  let targetExamples = 0;
  let targetTop1Correct = 0;
  let targetPredictedAsNearConfusable = 0;
  const targetPerClass = {};
  for (const label of targetLabels) {
    const index = labelIndex.get(label);
    if (index === undefined) continue;
    const row = matrix.rows_true_columns_predicted[index] ?? [];
    const total = rowTotal(row);
    const correct = Number(row[index]) || 0;
    const nearPredictions = nearIndexes.reduce((sum, nearIndex) => sum + (Number(row[nearIndex]) || 0), 0);
    targetExamples += total;
    targetTop1Correct += correct;
    targetPredictedAsNearConfusable += nearPredictions;
    targetPerClass[label] = {
      examples: total,
      top1_correct: correct,
      top1_accuracy: total > 0 ? correct / total : 0,
      predicted_as_near_confusable: nearPredictions,
      predicted_as_near_confusable_rate: total > 0 ? nearPredictions / total : 0,
      global_precision: metricFor(report, split, label).precision,
      global_recall: metricFor(report, split, label).recall,
      global_f1: metricFor(report, split, label).f1,
    };
  }

  let nearExamples = 0;
  let nearPredictedAsTarget = 0;
  const nearPerClass = {};
  for (const label of nearConfusableLabels) {
    const index = labelIndex.get(label);
    if (index === undefined) continue;
    const row = matrix.rows_true_columns_predicted[index] ?? [];
    const total = rowTotal(row);
    const targetPredictions = targetIndexes.reduce((sum, targetIndex) => sum + (Number(row[targetIndex]) || 0), 0);
    nearExamples += total;
    nearPredictedAsTarget += targetPredictions;
    nearPerClass[label] = {
      examples: total,
      predicted_as_target: targetPredictions,
      predicted_as_target_rate: total > 0 ? targetPredictions / total : 0,
      global_precision: metricFor(report, split, label).precision,
      global_recall: metricFor(report, split, label).recall,
      global_f1: metricFor(report, split, label).f1,
    };
  }

  const targetMacroF1 = average(targetLabels.map((label) => metricFor(report, split, label).f1));
  return {
    split,
    missing_targets: missingTargets,
    missing_near_confusables: missingNearConfusables,
    target_examples: targetExamples,
    target_top1_correct: targetTop1Correct,
    target_top1_accuracy: targetExamples > 0 ? targetTop1Correct / targetExamples : 0,
    target_macro_f1_from_global_report: targetMacroF1,
    target_predicted_as_near_confusable: targetPredictedAsNearConfusable,
    target_predicted_as_near_confusable_rate:
      targetExamples > 0 ? targetPredictedAsNearConfusable / targetExamples : 0,
    near_confusable_examples: nearExamples,
    near_confusable_predicted_as_target: nearPredictedAsTarget,
    near_confusable_false_pass_rate: nearExamples > 0 ? nearPredictedAsTarget / nearExamples : 0,
    target_per_class: targetPerClass,
    near_confusable_per_class: nearPerClass,
    note:
      "Computed from retained top-1 confusion matrices only. Thresholded coverage and accepted-clip accuracy still require per-example scores or a fresh evaluator run.",
    target_labels_present: targetLabels.every((label) => targetSet.has(label)),
    near_confusable_labels_present: nearConfusableLabels.every((label) => nearSet.has(label)),
  };
}

function buildAudit({ milestonePath, validationReportPath }) {
  const milestone = readJson(milestonePath);
  const report = readJson(validationReportPath);
  const targetLabels = milestone.lesson?.target_signs?.map((item) => item.label_id) ?? [];
  const nearConfusableLabels = milestone.lesson?.near_confusable_signs?.map((item) => item.label_id) ?? [];
  const blockers = [];
  if (milestone.schema_version !== "asl-pilot-rawframe-lesson-milestone/v1") {
    blockers.push("milestone schema_version is not asl-pilot-rawframe-lesson-milestone/v1");
  }
  if (targetLabels.length !== 25) blockers.push(`expected 25 target signs; found ${targetLabels.length}`);
  if (nearConfusableLabels.length !== 10) {
    blockers.push(`expected 10 near-confusable signs; found ${nearConfusableLabels.length}`);
  }
  const overlap = targetLabels.filter((label) => nearConfusableLabels.includes(label));
  if (overlap.length > 0) blockers.push(`target/near-confusable overlap: ${overlap.join(", ")}`);

  const validation = evaluateSplit(report, "validation", targetLabels, nearConfusableLabels);
  const test = evaluateSplit(report, "test", targetLabels, nearConfusableLabels);
  for (const split of [validation, test]) {
    if (split.missing_targets.length > 0) {
      blockers.push(`${split.split} missing target labels: ${split.missing_targets.join(", ")}`);
    }
    if (split.missing_near_confusables.length > 0) {
      blockers.push(`${split.split} missing near-confusable labels: ${split.missing_near_confusables.join(", ")}`);
    }
  }

  const targets = milestone.evaluation_contract?.success_targets ?? {};
  const negativeFalsePass = report.negative_challenge?.metrics?.false_pass_rate;
  const passStatus = {
    validation_target_top1: validation.target_top1_accuracy >= targets.signer_disjoint_target_top1_at_least,
    validation_target_macro_f1:
      validation.target_macro_f1_from_global_report >= targets.macro_f1_at_least,
    test_near_confusable_false_pass:
      test.near_confusable_false_pass_rate < targets.test_false_pass_below,
    negative_challenge_false_pass:
      typeof negativeFalsePass === "number" &&
      negativeFalsePass < targets.negative_challenge_false_pass_below,
  };
  const status =
    blockers.length === 0 && Object.values(passStatus).every(Boolean)
      ? "lesson_baseline_passed"
      : "lesson_baseline_failed";

  return {
    schema_version: "asl-pilot-rawframe-lesson-milestone-audit/v1",
    status,
    checked_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/audit_rawframe_lesson_milestone.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv,
    },
    finality: "diagnostic_not_final_model_evidence",
    inputs: {
      milestone: {
        path: projectRelative(milestonePath),
        sha256: sha256File(milestonePath),
      },
      validation_report: {
        path: projectRelative(validationReportPath),
        sha256: sha256File(validationReportPath),
        status: report.status,
      },
    },
    pass_status: passStatus,
    success_targets: targets,
    validation,
    test,
    negative_challenge: report.negative_challenge?.metrics ?? null,
    blockers,
    next_required_evidence: [
      "fresh lesson-level manifests that separate target signs, near-confusable wrong-prompt clips, and hard negatives",
      "per-example score export or evaluator support for lesson-level coverage and accepted-clip accuracy",
      "validation-selected reject thresholds tested on held-out lesson test and hard-negative challenge clips",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const audit = buildAudit({
    milestonePath: args.milestone,
    validationReportPath: args.validationReport,
  });
  const serialized = `${JSON.stringify(audit, null, 2)}\n`;
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, serialized);
    console.log(
      JSON.stringify(
        {
          status: audit.status,
          output: projectRelative(args.output),
          sha256: sha256File(args.output),
          validation_target_top1: audit.validation.target_top1_accuracy,
          test_near_confusable_false_pass_rate: audit.test.near_confusable_false_pass_rate,
          negative_challenge_false_pass_rate: audit.negative_challenge?.false_pass_rate,
        },
        null,
        2,
      ),
    );
  } else {
    process.stdout.write(serialized);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
