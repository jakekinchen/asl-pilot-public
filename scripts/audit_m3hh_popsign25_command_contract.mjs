import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const m3hhOutputDir = "output/m3hh-popsign25-full-exposure-bounded-brev-contract";
const m3hbOutputDir = "output/m3hb-popsign25-bounded-brev-contract";
const trainManifest = "data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json";
const validationManifest = "data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json";
const testManifest = "data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json";

function pythonCommand() {
  const venvPython = path.join(root, ".venv", "bin", "python");
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status,
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function baseM3hhArgs(overrides = {}) {
  return [
    "scripts/train_rawframe_model.py",
    "--train-manifest",
    overrides.trainManifest ?? trainManifest,
    "--validation-manifest",
    overrides.validationManifest ?? validationManifest,
    "--test-manifest",
    overrides.testManifest ?? testManifest,
    "--output-dir",
    overrides.outputDir ?? m3hhOutputDir,
    "--model-id",
    overrides.modelId ?? "m3hh-popsign25-full-exposure-bounded-brev-contract",
    "--seed",
    String(overrides.seed ?? 20260529),
    "--architecture",
    overrides.architecture ?? "true_temporal_convnet_region_grid",
    "--check-files",
    "--frame-count",
    String(overrides.frameCount ?? 16),
    "--image-size",
    String(overrides.imageSize ?? 96),
    "--num-workers",
    String(overrides.numWorkers ?? 0),
    "--epochs",
    String(overrides.epochs ?? 1),
    "--batch-size",
    String(overrides.batchSize ?? 4),
    "--learning-rate",
    String(overrides.learningRate ?? 0.001),
    "--training-augmentation",
    overrides.trainingAugmentation ?? "none",
    "--checkpoint-selection",
    overrides.checkpointSelection ?? "best_validation",
    "--max-train-batches",
    String(overrides.maxTrainBatches ?? 157),
    "--max-validation-batches",
    String(overrides.maxValidationBatches ?? 157),
    "--popsign-label-ladder-training-smoke",
    "--dry-run",
  ];
}

function parseJson(stdout, blockers, label) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    blockers.push(`${label} did not emit parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function requireEqual(blockers, label, actual, expected) {
  if (actual !== expected) {
    blockers.push(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const blockers = [];
const outputPath = path.join(root, m3hhOutputDir);
if (fs.existsSync(outputPath)) {
  blockers.push(`${m3hhOutputDir} must be absent before the M3HH dry-run contract proof`);
}

const positive = run(pythonCommand(), baseM3hhArgs());
if (!positive.ok) {
  blockers.push(
    `M3HH full-exposure dry-run command failed with status ${positive.status}: ${positive.stderr || positive.stdout}`,
  );
} else {
  const plan = parseJson(positive.stdout, blockers, "M3HH dry-run plan");
  if (plan) {
    requireEqual(blockers, "training_status", plan.training_status, "dry_run_only");
    requireEqual(blockers, "evidence_mode", plan.evidence_mode, "popsign_label_ladder_training_smoke");
    requireEqual(blockers, "output_dir", plan.output_dir, m3hhOutputDir);
    requireEqual(blockers, "hyperparameters.epochs", plan.hyperparameters?.epochs, 1);
    requireEqual(blockers, "hyperparameters.batch_size", plan.hyperparameters?.batch_size, 4);
    requireEqual(blockers, "hyperparameters.max_train_batches", plan.hyperparameters?.max_train_batches, 157);
    requireEqual(blockers, "hyperparameters.max_validation_batches", plan.hyperparameters?.max_validation_batches, 157);
    requireEqual(blockers, "hyperparameters.preserve_region_axis", plan.hyperparameters?.preserve_region_axis, false);
    const train = plan.data_loading_contract?.train;
    requireEqual(blockers, "data_loading_contract.train.dataset_row_count", train?.dataset_row_count, 625);
    requireEqual(blockers, "data_loading_contract.train.batch_size", train?.batch_size, 4);
    requireEqual(blockers, "data_loading_contract.train.drop_last", train?.drop_last, false);
    requireEqual(blockers, "data_loading_contract.train.shuffle", train?.shuffle, true);
    requireEqual(blockers, "data_loading_contract.train.sampler_type", train?.sampler_type, "RandomSampler");
    requireEqual(blockers, "data_loading_contract.train.full_epoch_batches", train?.full_epoch_batches, 157);
    requireEqual(blockers, "data_loading_contract.train.row_visit_count_under_cap", train?.row_visit_count_under_cap, 625);
    requireEqual(blockers, "data_loading_contract.train.all_rows_visited_under_cap", train?.all_rows_visited_under_cap, true);
    if (!Array.isArray(train?.row_index_set_under_cap) || train.row_index_set_under_cap.length !== 625) {
      blockers.push("data_loading_contract.train.row_index_set_under_cap must list all 625 train row indexes");
    }
  }
}
if (fs.existsSync(outputPath)) {
  blockers.push("M3HH dry-run command must not create the future output namespace");
}

const m3hbOverwriteProbe = run(pythonCommand(), baseM3hhArgs({ outputDir: m3hbOutputDir }));
if (m3hbOverwriteProbe.ok) {
  blockers.push("M3HB copied-output namespace dry-run probe unexpectedly passed");
} else if (!`${m3hbOverwriteProbe.stdout}\n${m3hbOverwriteProbe.stderr}`.includes("output directory to be absent")) {
  blockers.push("M3HB copied-output namespace probe must fail on the absent-output guard");
}

const wrongCapProbe = run(pythonCommand(), baseM3hhArgs({ maxTrainBatches: 16 }));
if (wrongCapProbe.ok) {
  blockers.push("M3HH wrong train-batch cap probe unexpectedly passed");
} else if (!`${wrongCapProbe.stdout}\n${wrongCapProbe.stderr}`.includes("--max-train-batches 157")) {
  blockers.push("M3HH wrong train-batch cap probe must require --max-train-batches 157");
}

const report = {
  schema_version: "asl-pilot-m3hh-popsign25-command-contract-audit/v1",
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  positive_command: {
    command: positive.command,
    status: positive.status,
  },
  negative_probes: [
    {
      id: "m3hb_copied_output_namespace_rejected",
      command: m3hbOverwriteProbe.command,
      status: m3hbOverwriteProbe.status,
    },
    {
      id: "m3hh_requires_157_train_batches",
      command: wrongCapProbe.command,
      status: wrongCapProbe.status,
    },
  ],
  blockers,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = blockers.length === 0 ? 0 : 1;
