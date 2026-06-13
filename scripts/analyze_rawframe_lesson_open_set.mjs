#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const defaultMilestone = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const defaultSidecar = path.join(root, "artifacts", "rawframe-model-diagnostics", "lesson-open-set-full95", "prediction-sidecar.json");
const defaultOutput = path.join(root, "docs", "validation", "rawframe-lesson-open-set-diagnostic.json");
const targetFalsePassRate = 0.1;
const negativeFalsePassRate = 0.05;
const acceptedPredictionSidecarSchemas = new Set([
  "asl-pilot-rawframe-prediction-sidecar/v1",
  "asl-pilot-rawframe-prediction-sidecar/v2",
]);
const predictionSidecarV2Contract = "asl-pilot-rawframe-prediction-sidecar-contract/v2";

function usage() {
  return `
Usage:
  node scripts/analyze_rawframe_lesson_open_set.mjs [--write]

Options:
  --milestone <path>            Default: docs/validation/rawframe-lesson-milestone.json
  --prediction-sidecar <path>   Default: artifacts/rawframe-model-diagnostics/lesson-open-set-full95/prediction-sidecar.json
  --output <path>               Default: docs/validation/rawframe-lesson-open-set-diagnostic.json
  --write                       Write the diagnostic. Without --write, print it.
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
    predictionSidecar: defaultSidecar,
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
    } else if (item === "--prediction-sidecar") {
      args.predictionSidecar = resolveProjectPath(next(), item);
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function requireSidecarSchema(sidecar) {
  if (!acceptedPredictionSidecarSchemas.has(sidecar.schema_version)) {
    throw new Error(
      `prediction sidecar schema_version must be one of ${[...acceptedPredictionSidecarSchemas].join(", ")}`,
    );
  }
  if (
    sidecar.schema_version === "asl-pilot-rawframe-prediction-sidecar/v2" &&
    sidecar.sidecar_contract?.version !== predictionSidecarV2Contract
  ) {
    throw new Error(`prediction sidecar v2 requires sidecar_contract.version ${predictionSidecarV2Contract}`);
  }
  return sidecar.schema_version;
}

function requireExamples(sidecar, split, { requireTrueLabel }) {
  const examples = sidecar[split]?.examples;
  if (!Array.isArray(examples)) {
    throw new Error(`prediction sidecar ${split}.examples must be an array`);
  }
  for (const [index, item] of examples.entries()) {
    if (requireTrueLabel && typeof item.true_label !== "string") {
      throw new Error(`prediction sidecar ${split}.examples[${index}].true_label must be a string`);
    }
    if (typeof item.predicted_label !== "string") {
      throw new Error(`prediction sidecar ${split}.examples[${index}].predicted_label must be a string`);
    }
    if (typeof item.confidence !== "number" || !Number.isFinite(item.confidence)) {
      throw new Error(`prediction sidecar ${split}.examples[${index}].confidence must be a finite number`);
    }
  }
  return examples;
}

function lessonMetrics({ examples, targetSet, threshold, expectedOutcome }) {
  const selected = examples.filter((item) => targetSet.has(String(item.predicted_label)) && Number(item.confidence) >= threshold);
  if (expectedOutcome === "target") {
    const correctAccepted = selected.filter((item) => item.predicted_label === item.true_label);
    const falseAccepted = selected.filter((item) => item.predicted_label !== item.true_label);
    return {
      examples: examples.length,
      threshold,
      coverage: examples.length > 0 ? selected.length / examples.length : 0,
      accepted_count: selected.length,
      correct_accept_count: correctAccepted.length,
      false_pass_count: falseAccepted.length,
      correct_pass_rate: examples.length > 0 ? correctAccepted.length / examples.length : 0,
      false_pass_rate: examples.length > 0 ? falseAccepted.length / examples.length : 0,
      accepted_accuracy: selected.length > 0 ? correctAccepted.length / selected.length : 0,
      reject_count: examples.length - selected.length,
    };
  }
  return {
    examples: examples.length,
    threshold,
    false_pass_count: selected.length,
    false_pass_rate: examples.length > 0 ? selected.length / examples.length : 0,
    reject_count: examples.length - selected.length,
  };
}

function curve({ targetExamples, nearExamples, targetSet }) {
  const rows = [];
  for (let index = 0; index <= 100; index += 1) {
    const threshold = index / 100;
    const target = lessonMetrics({
      examples: targetExamples,
      targetSet,
      threshold,
      expectedOutcome: "target",
    });
    const near = lessonMetrics({
      examples: nearExamples,
      targetSet,
      threshold,
      expectedOutcome: "reject",
    });
    const falsePassDenominator = target.examples + near.examples;
    rows.push({
      threshold,
      target,
      near_confusable: near,
      combined_false_pass_rate:
        falsePassDenominator > 0
          ? (target.false_pass_count + near.false_pass_count) / falsePassDenominator
          : 0,
      combined_false_pass_count: target.false_pass_count + near.false_pass_count,
      combined_examples: falsePassDenominator,
    });
  }
  return rows;
}

function selectThreshold(rows) {
  const eligible = rows.filter((row) => row.combined_false_pass_rate < targetFalsePassRate);
  const pool = eligible.length > 0 ? eligible : rows;
  return pool.reduce((best, row) => {
    const currentKey = [
      row.target.correct_pass_rate,
      -row.combined_false_pass_rate,
      row.threshold,
    ];
    const bestKey = [
      best.target.correct_pass_rate,
      -best.combined_false_pass_rate,
      best.threshold,
    ];
    for (let index = 0; index < currentKey.length; index += 1) {
      if (currentKey[index] > bestKey[index]) return row;
      if (currentKey[index] < bestKey[index]) return best;
    }
    return best;
  }, pool[0]);
}

function bySignerTargetMetrics(examples, targetSet, threshold) {
  const bySigner = new Map();
  for (const item of examples) {
    const signerId = String(item.signer_id || "unknown");
    if (!bySigner.has(signerId)) bySigner.set(signerId, []);
    bySigner.get(signerId).push(item);
  }
  return [...bySigner.entries()]
    .map(([signer_id, rows]) => ({
      signer_id,
      ...lessonMetrics({
        examples: rows,
        targetSet,
        threshold,
        expectedOutcome: "target",
      }),
    }))
    .sort((left, right) => left.accepted_accuracy - right.accepted_accuracy || left.signer_id.localeCompare(right.signer_id));
}

function buildDiagnostic({ milestonePath, sidecarPath }) {
  const milestone = readJson(milestonePath);
  const sidecar = readJson(sidecarPath);
  if (milestone.schema_version !== "asl-pilot-rawframe-lesson-milestone/v1") {
    throw new Error("milestone schema_version must be asl-pilot-rawframe-lesson-milestone/v1");
  }
  requireSidecarSchema(sidecar);
  const validationExamples = requireExamples(sidecar, "validation", { requireTrueLabel: true });
  const testExamples = requireExamples(sidecar, "test", { requireTrueLabel: true });
  const negativeExamples = Array.isArray(sidecar.negative_challenge?.examples)
    ? requireExamples(sidecar, "negative_challenge", { requireTrueLabel: false })
    : [];
  const targetIds = milestone.lesson.target_signs.map((item) => String(item.label_id));
  const nearIds = milestone.lesson.near_confusable_signs.map((item) => String(item.label_id));
  const targetSet = new Set(targetIds);
  const nearSet = new Set(nearIds);
  const validationTarget = validationExamples.filter((item) => targetSet.has(String(item.true_label)));
  const validationNear = validationExamples.filter((item) => nearSet.has(String(item.true_label)));
  const testTarget = testExamples.filter((item) => targetSet.has(String(item.true_label)));
  const testNear = testExamples.filter((item) => nearSet.has(String(item.true_label)));
  const validationLabelCount = new Set(validationExamples.map((item) => String(item.true_label))).size;
  const sidecarScope =
    validationLabelCount === targetIds.length + nearIds.length
      ? "35-label target-plus-near-confusable candidate checkpoint"
      : `${validationLabelCount}-label checkpoint filtered to lesson target outputs`;
  const validationCurve = curve({ targetExamples: validationTarget, nearExamples: validationNear, targetSet });
  const selected = selectThreshold(validationCurve);
  const selectedThreshold = selected.threshold;
  const testTargetMetrics = lessonMetrics({
    examples: testTarget,
    targetSet,
    threshold: selectedThreshold,
    expectedOutcome: "target",
  });
  const testNearMetrics = lessonMetrics({
    examples: testNear,
    targetSet,
    threshold: selectedThreshold,
    expectedOutcome: "reject",
  });
  const negativeMetrics = lessonMetrics({
    examples: negativeExamples,
    targetSet,
    threshold: selectedThreshold,
    expectedOutcome: "reject",
  });
  const status =
    testTargetMetrics.accepted_accuracy >= 0.7 &&
    testNearMetrics.false_pass_rate < targetFalsePassRate &&
    negativeMetrics.false_pass_rate < negativeFalsePassRate
      ? "lesson_open_set_diagnostic_passed"
      : "lesson_open_set_diagnostic_failed";
  return {
    schema_version: "asl-pilot-rawframe-lesson-open-set-diagnostic/v1",
    status,
    generated_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/analyze_rawframe_lesson_open_set.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv.slice(1),
    },
    finality: "diagnostic_not_final_model_evidence",
    inputs: {
      milestone: {
        path: projectRelative(milestonePath),
        sha256: sha256File(milestonePath),
      },
      prediction_sidecar: {
        path: projectRelative(sidecarPath),
        sha256: sha256File(sidecarPath),
        evidence_mode: sidecar.evidence_mode,
      },
    },
    lesson_id: milestone.lesson.lesson_id,
    target_sign_ids: targetIds,
    near_confusable_sign_ids: nearIds,
    threshold_selection: {
      selected_threshold: selectedThreshold,
      selection_rule:
        "From validation target and near-confusable examples, maximize target correct pass rate subject to combined lesson false-pass below 0.10; tie-break lower false-pass then higher threshold.",
      selected_validation_metrics: selected,
      curve: validationCurve,
    },
    test_metrics: {
      target: testTargetMetrics,
      near_confusable: testNearMetrics,
      combined_false_pass_rate:
        (testTargetMetrics.false_pass_count + testNearMetrics.false_pass_count) /
        (testTargetMetrics.examples + testNearMetrics.examples),
    },
    negative_challenge_metrics: negativeMetrics,
    signer_metrics: {
      validation_target_lowest_accepted_accuracy: bySignerTargetMetrics(
        validationTarget,
        targetSet,
        selectedThreshold,
      ).slice(0, 5),
      test_target_lowest_accepted_accuracy: bySignerTargetMetrics(
        testTarget,
        targetSet,
        selectedThreshold,
      ).slice(0, 5),
    },
    blockers: [
      `Diagnostic uses a ${sidecarScope}; it is not final 75-100-label evidence.`,
      "Prediction sidecar was generated in smoke/diagnostic mode to avoid replacing final validation evidence.",
      "No first-party browser-domain hard negatives are included beyond the current external negative challenge manifest.",
    ],
  };
}

function main() {
  const args = parseArgs(process.argv);
  const diagnostic = buildDiagnostic({
    milestonePath: args.milestone,
    sidecarPath: args.predictionSidecar,
  });
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, stableJson(diagnostic));
  }
  const output = {
    ...diagnostic,
    output: {
      path: projectRelative(args.output),
      sha256: args.write ? sha256File(args.output) : null,
    },
  };
  console.log(stableJson(output));
  if (!args.write) {
    console.error("Dry run only. Re-run with --write to write the lesson open-set diagnostic.");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
