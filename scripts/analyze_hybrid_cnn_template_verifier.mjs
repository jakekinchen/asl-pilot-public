#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const schemaVersion = "asl-pilot-hybrid-cnn-template-verifier-diagnostic/v1";

function usage() {
  return `
Usage:
  node scripts/analyze_hybrid_cnn_template_verifier.mjs --write

Options:
  --cnn-sidecar <path>          Default: artifacts/rawframe-model/controlled-pilot-prediction-sidecar.json
  --template-sidecar <path>     Default: artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-f16-k3-relaxed-20260521T190000Z/prediction-sidecar.json
  --output <path>               Default: docs/validation/hybrid-cnn-template-verifier-diagnostic.json
  --min-accepted-precision <n>  Default: 0.9
  --max-validation-false-pass <n> Default: 0.1
  --write                       Write the diagnostic JSON. Without --write, print only.
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
    cnnSidecar: path.join(root, "artifacts", "rawframe-model", "controlled-pilot-prediction-sidecar.json"),
    templateSidecar: path.join(
      root,
      "artifacts",
      "rawframe-model-diagnostics",
      "template-verifier-controlled-95-f16-k3-relaxed-20260521T190000Z",
      "prediction-sidecar.json",
    ),
    output: path.join(root, "docs", "validation", "hybrid-cnn-template-verifier-diagnostic.json"),
    minAcceptedPrecision: 0.9,
    maxValidationFalsePass: 0.1,
    write: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${item} requires a value`);
      return argv[index];
    };
    if (item === "--write") args.write = true;
    else if (item === "--cnn-sidecar") args.cnnSidecar = resolveProjectPath(next(), item);
    else if (item === "--template-sidecar") args.templateSidecar = resolveProjectPath(next(), item);
    else if (item === "--output") args.output = resolveProjectPath(next(), item);
    else if (item === "--min-accepted-precision") args.minAcceptedPrecision = Number.parseFloat(next());
    else if (item === "--max-validation-false-pass") args.maxValidationFalsePass = Number.parseFloat(next());
    else if (item === "--help" || item === "-h") {
      console.log(usage().trim());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}\n${usage()}`);
    }
  }
  for (const [name, value] of [
    ["--min-accepted-precision", args.minAcceptedPrecision],
    ["--max-validation-false-pass", args.maxValidationFalsePass],
  ]) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${name} must be a number between 0 and 1`);
    }
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function templateSplitMap(sidecar) {
  const output = new Map();
  for (const split of sidecar.splits ?? []) {
    const byClip = new Map();
    for (const prediction of split.predictions ?? []) {
      byClip.set(prediction.clip_id, prediction);
    }
    output.set(split.split, byClip);
  }
  return output;
}

function pairedExamples(cnnSidecar, templateSidecar) {
  const templateBySplit = templateSplitMap(templateSidecar);
  const paired = {};
  const splitMap = [
    ["validation", "validation"],
    ["test", "test"],
    ["negative_challenge", "negative_challenge"],
  ];
  for (const [key, splitName] of splitMap) {
    const templateByClip = templateBySplit.get(splitName);
    if (!templateByClip) throw new Error(`template sidecar missing split ${splitName}`);
    const cnnExamples = cnnSidecar[key]?.examples;
    if (!Array.isArray(cnnExamples)) throw new Error(`CNN sidecar missing ${key}.examples`);
    paired[key] = cnnExamples.map((cnn) => {
      const template = templateByClip.get(cnn.clip_id);
      if (!template) throw new Error(`template sidecar missing clip ${cnn.clip_id} in ${splitName}`);
      return { cnn, template };
    });
  }
  return paired;
}

function uniqueLabels(templateSidecar, paired) {
  if (Array.isArray(templateSidecar.labels) && templateSidecar.labels.length) {
    return templateSidecar.labels.map(String);
  }
  const labels = new Set();
  for (const split of [paired.validation, paired.test]) {
    for (const row of split) labels.add(String(row.cnn.true_label));
  }
  return [...labels].sort();
}

function scoreForPrompt(row, label) {
  const cnnMatchesPrompt = row.cnn.predicted_label === label;
  const cnnScore = cnnMatchesPrompt ? Number(row.cnn.confidence) || 0 : -Infinity;
  const templateScore = Number(row.template.scores?.[label]);
  return {
    cnnScore,
    templateScore: Number.isFinite(templateScore) ? templateScore : -Infinity,
  };
}

function isAccepted(row, label, thresholds) {
  const labelThreshold = thresholds[label];
  if (!labelThreshold) return false;
  const scores = scoreForPrompt(row, label);
  return scores.cnnScore >= labelThreshold.cnn_threshold && scores.templateScore >= labelThreshold.template_threshold;
}

function chooseThresholds(validationRows, labels, minAcceptedPrecision, maxValidationFalsePass) {
  const thresholds = {};
  const perLabel = {};
  for (const label of labels) {
    const positives = [];
    const negatives = [];
    for (const row of validationRows) {
      const scores = scoreForPrompt(row, label);
      if (!Number.isFinite(scores.cnnScore) || !Number.isFinite(scores.templateScore)) continue;
      if (row.cnn.true_label === label) positives.push(scores);
      else negatives.push(scores);
    }
    const cnnCandidates = [...new Set([...positives, ...negatives].map((item) => item.cnnScore))].sort((a, b) => b - a);
    const templateCandidates = [...new Set([...positives, ...negatives].map((item) => item.templateScore))].sort(
      (a, b) => b - a,
    );
    if (!cnnCandidates.length) cnnCandidates.push(1 + 1e-6);
    if (!templateCandidates.length) templateCandidates.push(1 + 1e-6);
    cnnCandidates.push(Math.max(...cnnCandidates, 1) + 1e-6);
    templateCandidates.push(Math.max(...templateCandidates, 1) + 1e-6);

    let best = null;
    for (const cnnThreshold of cnnCandidates) {
      for (const templateThreshold of templateCandidates) {
        const tp = positives.filter(
          (item) => item.cnnScore >= cnnThreshold && item.templateScore >= templateThreshold,
        ).length;
        const fp = negatives.filter(
          (item) => item.cnnScore >= cnnThreshold && item.templateScore >= templateThreshold,
        ).length;
        const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
        const trueAcceptRate = positives.length ? tp / positives.length : 0;
        const falsePassRate = negatives.length ? fp / negatives.length : 0;
        const eligible = precision >= minAcceptedPrecision && falsePassRate <= maxValidationFalsePass;
        if (!eligible) continue;
        const candidate = {
          cnn_threshold: cnnThreshold,
          template_threshold: templateThreshold,
          true_accept_count: tp,
          false_accept_count: fp,
          accepted_precision: precision,
          true_accept_rate: trueAcceptRate,
          false_pass_rate: falsePassRate,
          eligible: true,
        };
        if (
          !best ||
          candidate.true_accept_rate > best.true_accept_rate ||
          (candidate.true_accept_rate === best.true_accept_rate &&
            candidate.accepted_precision > best.accepted_precision) ||
          (candidate.true_accept_rate === best.true_accept_rate &&
            candidate.accepted_precision === best.accepted_precision &&
            candidate.cnn_threshold + candidate.template_threshold < best.cnn_threshold + best.template_threshold)
        ) {
          best = candidate;
        }
      }
    }
    if (!best) {
      best = {
        cnn_threshold: Math.max(...cnnCandidates, 1) + 1e-6,
        template_threshold: Math.max(...templateCandidates, 1) + 1e-6,
        true_accept_count: 0,
        false_accept_count: 0,
        accepted_precision: 1,
        true_accept_rate: 0,
        false_pass_rate: 0,
        eligible: false,
      };
    }
    thresholds[label] = {
      cnn_threshold: best.cnn_threshold,
      template_threshold: best.template_threshold,
    };
    perLabel[label] = {
      positive_candidate_count: positives.length,
      negative_candidate_count: negatives.length,
      ...best,
    };
  }
  return { thresholds, perLabel };
}

function promptMetrics(rows, labels, thresholds) {
  let trueAccepts = 0;
  let truePromptCount = 0;
  let wrongAccepts = 0;
  let wrongPromptCount = 0;
  const acceptedByLabel = Object.fromEntries(labels.map((label) => [label, { true_accepts: 0, wrong_accepts: 0 }]));
  for (const row of rows) {
    const trueLabel = row.cnn.true_label;
    if (typeof trueLabel === "string") {
      truePromptCount += 1;
      if (isAccepted(row, trueLabel, thresholds)) {
        trueAccepts += 1;
        acceptedByLabel[trueLabel].true_accepts += 1;
      }
    }
    for (const label of labels) {
      if (label === trueLabel) continue;
      wrongPromptCount += 1;
      if (isAccepted(row, label, thresholds)) {
        wrongAccepts += 1;
        acceptedByLabel[label].wrong_accepts += 1;
      }
    }
  }
  return {
    examples: rows.length,
    true_prompt_count: truePromptCount,
    true_accept_count: trueAccepts,
    true_accept_rate: truePromptCount ? trueAccepts / truePromptCount : 0,
    wrong_prompt_count: wrongPromptCount,
    wrong_prompt_false_accept_count: wrongAccepts,
    wrong_prompt_false_pass_rate: wrongPromptCount ? wrongAccepts / wrongPromptCount : 0,
    accepted_precision: trueAccepts + wrongAccepts > 0 ? trueAccepts / (trueAccepts + wrongAccepts) : 1,
    accepted_label_count: Object.values(acceptedByLabel).filter((item) => item.true_accepts || item.wrong_accepts).length,
  };
}

function negativeMetrics(rows, labels, thresholds) {
  let falsePasses = 0;
  const byType = {};
  for (const row of rows) {
    let accepted = false;
    for (const label of labels) {
      if (isAccepted(row, label, thresholds)) {
        accepted = true;
        break;
      }
    }
    const type = row.cnn.challenge_type ?? "unknown";
    byType[type] ??= { examples: 0, false_pass_count: 0 };
    byType[type].examples += 1;
    if (accepted) {
      falsePasses += 1;
      byType[type].false_pass_count += 1;
    }
  }
  return {
    examples: rows.length,
    false_pass_count: falsePasses,
    false_pass_rate: rows.length ? falsePasses / rows.length : 0,
    by_type: Object.fromEntries(
      Object.entries(byType)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([type, value]) => [
          type,
          {
            ...value,
            false_pass_rate: value.examples ? value.false_pass_count / value.examples : 0,
          },
        ]),
    ),
  };
}

function classificationMetrics(rows) {
  const correct = rows.filter((row) => row.cnn.correct).length;
  return {
    examples: rows.length,
    top1_accuracy: rows.length ? correct / rows.length : 0,
    note: "Top-1 remains the CNN closed-set prediction; hybrid gating only affects prompt-conditioned pass/fail acceptance.",
  };
}

function main() {
  const args = parseArgs(process.argv);
  const cnnSidecar = readJson(args.cnnSidecar);
  const templateSidecar = readJson(args.templateSidecar);
  const paired = pairedExamples(cnnSidecar, templateSidecar);
  const labels = uniqueLabels(templateSidecar, paired);
  const { thresholds, perLabel } = chooseThresholds(
    paired.validation,
    labels,
    args.minAcceptedPrecision,
    args.maxValidationFalsePass,
  );

  const validationPrompt = promptMetrics(paired.validation, labels, thresholds);
  const testPrompt = promptMetrics(paired.test, labels, thresholds);
  const negative = negativeMetrics(paired.negative_challenge, labels, thresholds);
  const passStatus = {
    accepted_precision: testPrompt.accepted_precision >= args.minAcceptedPrecision,
    false_pass_rate: testPrompt.wrong_prompt_false_pass_rate < 0.1,
    negative_challenge_false_pass_rate: negative.false_pass_rate < 0.05,
    true_accept_rate: testPrompt.true_accept_rate >= 0.5,
  };
  const output = {
    schema_version: schemaVersion,
    status: Object.values(passStatus).every(Boolean) ? "diagnostic_passed_not_promotable" : "diagnostic_failed",
    finality: "diagnostic_not_final_model_evidence",
    created_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/analyze_hybrid_cnn_template_verifier.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv.slice(1),
    },
    inputs: {
      cnn_sidecar: {
        path: projectRelative(args.cnnSidecar),
        sha256: sha256File(args.cnnSidecar),
      },
      template_sidecar: {
        path: projectRelative(args.templateSidecar),
        sha256: sha256File(args.templateSidecar),
      },
    },
    method: {
      name: "cnn_top_label_confidence_and_template_prompt_score_gate",
      threshold_selection_split: "validation",
      min_accepted_precision: args.minAcceptedPrecision,
      max_validation_false_pass_rate: args.maxValidationFalsePass,
      pass_rule:
        "For prompted label L, pass only when CNN top prediction is L, CNN confidence >= per-label CNN threshold, and template score[L] >= per-label template threshold.",
    },
    labels,
    thresholds,
    threshold_diagnostics: perLabel,
    validation: {
      classification: classificationMetrics(paired.validation),
      prompt_acceptance: validationPrompt,
    },
    test: {
      classification: classificationMetrics(paired.test),
      prompt_acceptance: testPrompt,
    },
    negative_challenge: negative,
    pass_status: passStatus,
    blockers:
      testPrompt.true_accept_rate < 0.5
        ? ["Hybrid gating preserves rejection behavior but accepts too few true prompted attempts for a usable pilot."]
        : [],
  };
  if (args.write) writeJson(args.output, output);
  console.log(stableJson({ ...output, thresholds: undefined, threshold_diagnostics: undefined }));
  if (!args.write) console.error("Dry run only. Re-run with --write to write the diagnostic JSON.");
  if (!Object.values(passStatus).every(Boolean)) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
