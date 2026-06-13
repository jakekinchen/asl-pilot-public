import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultSidecarPath = path.join(root, "artifacts", "rawframe-model", "controlled-pilot-prediction-sidecar.json");
const defaultOutputPath = path.join(root, "docs", "validation", "controlled-pilot-reject-score-grid-diagnostic.json");
const targetFalsePassRate = 0.1;
const targetNegativeFalsePassRate = 0.05;

function parseArgs(argv) {
  const args = {
    sidecar: defaultSidecarPath,
    output: defaultOutputPath,
    write: false,
    quantileStep: 0.01,
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
    if (item === "--prediction-sidecar" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item === "--prediction-sidecar" ? "sidecar" : "output"] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    if (item === "--quantile-step") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0 || value > 0.25) {
        throw new Error("--quantile-step must be a number in (0, 0.25]");
      }
      args.quantileStep = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/analyze_controlled_pilot_reject_score_grid.mjs [--write]

Searches validation-selected reject-score gates over confidence, probability
margin, and entropy using the retained controlled-pilot prediction sidecar.
This is diagnostic only and does not change thresholds, model artifacts, or
model-card status.
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

function readJson(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${projectRelative(file)} root must be an object`);
  }
  return data;
}

function examplesAt(sidecar, split) {
  const examples = sidecar?.[split]?.examples;
  if (!Array.isArray(examples) || examples.length === 0) {
    throw new Error(`prediction sidecar ${split}.examples must be a non-empty array`);
  }
  return examples;
}

function quantileThresholds(rows, key, step) {
  const values = [...new Set(rows.map((row) => Number(row[key])).filter(Number.isFinite))]
    .sort((left, right) => left - right);
  if (values.length === 0) throw new Error(`No finite values for ${key}`);
  const result = new Set([values[0], values[values.length - 1]]);
  for (let quantile = 0; quantile <= 1 + 1e-9; quantile += step) {
    const index = Math.min(values.length - 1, Math.floor(quantile * (values.length - 1)));
    result.add(values[index]);
  }
  return [...result].sort((left, right) => left - right);
}

function passesGate(row, gate) {
  return (
    Number(row.confidence) >= gate.min_confidence &&
    Number(row.probability_margin) >= gate.min_probability_margin &&
    Number(row.entropy) <= gate.max_entropy
  );
}

function scoreExamples(rows, gate) {
  let accepted = 0;
  let correct = 0;
  let falsePass = 0;
  for (const row of rows) {
    if (!passesGate(row, gate)) continue;
    accepted += 1;
    if (row.correct === true) correct += 1;
    else falsePass += 1;
  }
  return {
    examples: rows.length,
    accepted_count: accepted,
    correct_accept_count: correct,
    false_pass_count: falsePass,
    accepted_coverage: accepted / rows.length,
    accepted_precision: accepted > 0 ? correct / accepted : 0,
    false_pass_rate: falsePass / rows.length,
  };
}

function scoreNegative(rows, gate) {
  const falsePassRows = rows.filter((row) => passesGate(row, gate));
  const byType = {};
  for (const challengeType of [...new Set(rows.map((row) => row.challenge_type))].sort()) {
    const subset = rows.filter((row) => row.challenge_type === challengeType);
    const subsetFalsePass = subset.filter((row) => passesGate(row, gate));
    byType[challengeType] = {
      examples: subset.length,
      false_pass_count: subsetFalsePass.length,
      false_pass_rate: subset.length > 0 ? subsetFalsePass.length / subset.length : 0,
    };
  }
  return {
    examples: rows.length,
    false_pass_count: falsePassRows.length,
    false_pass_rate: falsePassRows.length / rows.length,
    by_type: byType,
  };
}

function betterScore(candidate, incumbent, oracle = false) {
  if (!incumbent) return true;
  const values = oracle
    ? [
        candidate.validation.correct_accept_count,
        candidate.validation.accepted_precision,
        candidate.validation.accepted_coverage,
        candidate.test.accepted_precision,
        -candidate.test.false_pass_rate,
        candidate.gate.min_confidence,
        candidate.gate.min_probability_margin,
        -candidate.gate.max_entropy,
      ]
    : [
        candidate.validation.correct_accept_count,
        candidate.validation.accepted_precision,
        candidate.validation.accepted_coverage,
        -candidate.validation.false_pass_rate,
        candidate.gate.min_confidence,
        candidate.gate.min_probability_margin,
        -candidate.gate.max_entropy,
      ];
  const incumbentValues = oracle
    ? [
        incumbent.validation.correct_accept_count,
        incumbent.validation.accepted_precision,
        incumbent.validation.accepted_coverage,
        incumbent.test.accepted_precision,
        -incumbent.test.false_pass_rate,
        incumbent.gate.min_confidence,
        incumbent.gate.min_probability_margin,
        -incumbent.gate.max_entropy,
      ]
    : [
        incumbent.validation.correct_accept_count,
        incumbent.validation.accepted_precision,
        incumbent.validation.accepted_coverage,
        -incumbent.validation.false_pass_rate,
        incumbent.gate.min_confidence,
        incumbent.gate.min_probability_margin,
        -incumbent.gate.max_entropy,
      ];
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] > incumbentValues[index]) return true;
    if (values[index] < incumbentValues[index]) return false;
  }
  return false;
}

function candidate(gate, validationRows, testRows, negativeRows) {
  return {
    gate,
    validation: scoreExamples(validationRows, gate),
    test: scoreExamples(testRows, gate),
    negative_challenge: scoreNegative(negativeRows, gate),
  };
}

function buildReport(args) {
  const sidecar = readJson(args.sidecar);
  const validationRows = examplesAt(sidecar, "validation");
  const testRows = examplesAt(sidecar, "test");
  const negativeRows = examplesAt(sidecar, "negative_challenge");
  const confidenceThresholds = quantileThresholds(validationRows, "confidence", args.quantileStep);
  const marginThresholds = quantileThresholds(validationRows, "probability_margin", args.quantileStep);
  const entropyThresholds = quantileThresholds(validationRows, "entropy", args.quantileStep);
  let searched = 0;
  let validationSelected = null;
  let negativeOracle = null;
  for (const minConfidence of confidenceThresholds) {
    for (const minProbabilityMargin of marginThresholds) {
      for (const maxEntropy of entropyThresholds) {
        searched += 1;
        const gate = { min_confidence: minConfidence, min_probability_margin: minProbabilityMargin, max_entropy: maxEntropy };
        const current = candidate(gate, validationRows, testRows, negativeRows);
        if (current.validation.false_pass_rate < targetFalsePassRate && betterScore(current, validationSelected)) {
          validationSelected = current;
        }
        if (
          current.validation.false_pass_rate < targetFalsePassRate &&
          current.negative_challenge.false_pass_rate < targetNegativeFalsePassRate &&
          betterScore(current, negativeOracle, true)
        ) {
          negativeOracle = current;
        }
      }
    }
  }
  const baselineGate = {
    min_confidence: Number(sidecar.selected_threshold),
    min_probability_margin: Number.NEGATIVE_INFINITY,
    max_entropy: Number.POSITIVE_INFINITY,
  };
  return {
    schema_version: "asl-pilot-controlled-pilot-reject-score-grid-diagnostic/v1",
    status: "diagnostic_not_final_model_evidence",
    created_at: new Date().toISOString(),
    inputs: {
      prediction_sidecar: fileReference(args.sidecar),
    },
    score_fields: {
      selected_by_validation_only: ["confidence", "probability_margin", "entropy"],
      min_confidence: "accept only when confidence is at or above the threshold",
      min_probability_margin: "accept only when top1 probability margin over top2 is at or above the threshold",
      max_entropy: "accept only when predictive entropy is at or below the threshold",
    },
    search: {
      quantile_step: args.quantileStep,
      candidate_count: searched,
      target_validation_false_pass_rate_below: targetFalsePassRate,
      target_negative_false_pass_rate_below: targetNegativeFalsePassRate,
    },
    baseline_confidence_only: candidate(baselineGate, validationRows, testRows, negativeRows),
    validation_selected_gate: validationSelected,
    negative_challenge_oracle_gate: {
      ...negativeOracle,
      selection_warning: (
        "Uses negative-challenge outcomes to show the best possible grid point; "
        + "not a deployable threshold-selection rule."
      ),
    },
    decision: {
      changes_model_weights: false,
      changes_thresholds: false,
      changes_model_card: false,
      final_evidence: false,
      result: negativeOracle?.test?.accepted_count <= 1
        ? "reject_scores_can_clear_negatives_only_at_near_zero_coverage"
        : "reject_score_grid_diagnostic_complete",
    },
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
    candidate_count: report.search.candidate_count,
    baseline_negative_false_pass_rate: report.baseline_confidence_only.negative_challenge.false_pass_rate,
    validation_selected_test_precision: report.validation_selected_gate.test.accepted_precision,
    validation_selected_negative_false_pass_rate: report.validation_selected_gate.negative_challenge.false_pass_rate,
    oracle_test_accepted_count: report.negative_challenge_oracle_gate.test.accepted_count,
    oracle_negative_false_pass_rate: report.negative_challenge_oracle_gate.negative_challenge.false_pass_rate,
    result: report.decision.result,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Reject-score grid diagnostic failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
