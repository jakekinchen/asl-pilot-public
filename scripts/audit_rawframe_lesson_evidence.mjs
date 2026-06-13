import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultMilestone = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const defaultPostExportPreflight = path.join(root, "docs", "validation", "rawframe-lesson-post-export-preflight.json");
const defaultTrainingProvenance = path.join(root, "artifacts", "rawframe-lesson-milestone", "training-provenance.json");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-lesson-milestone", "validation-report.json");
const defaultCalibratedProvenance = path.join(root, "artifacts", "rawframe-lesson-milestone", "calibrated-provenance.json");
const defaultOutput = path.join(root, "docs", "validation", "rawframe-lesson-evidence-audit.json");

function usage() {
  return `
Usage:
  node scripts/audit_rawframe_lesson_evidence.mjs [--write]

Options:
  --milestone <path>              Default: docs/validation/rawframe-lesson-milestone.json
  --post-export-preflight <path>  Default: docs/validation/rawframe-lesson-post-export-preflight.json
  --training-provenance <path>    Default: artifacts/rawframe-lesson-milestone/training-provenance.json
  --validation-report <path>      Default: artifacts/rawframe-lesson-milestone/validation-report.json
  --calibrated-provenance <path>  Default: artifacts/rawframe-lesson-milestone/calibrated-provenance.json
  --output <path>                 Default: docs/validation/rawframe-lesson-evidence-audit.json
  --write                         Write the audit artifact. Without --write, print it.
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
    postExportPreflight: defaultPostExportPreflight,
    trainingProvenance: defaultTrainingProvenance,
    validationReport: defaultValidationReport,
    calibratedProvenance: defaultCalibratedProvenance,
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
    if (item === "--write") args.write = true;
    else if (item === "--milestone") args.milestone = resolveProjectPath(next(), item);
    else if (item === "--post-export-preflight") args.postExportPreflight = resolveProjectPath(next(), item);
    else if (item === "--training-provenance") args.trainingProvenance = resolveProjectPath(next(), item);
    else if (item === "--validation-report") args.validationReport = resolveProjectPath(next(), item);
    else if (item === "--calibrated-provenance") args.calibratedProvenance = resolveProjectPath(next(), item);
    else if (item === "--output") args.output = resolveProjectPath(next(), item);
    else if (item === "--help" || item === "-h") {
      console.log(usage().trim());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}\n${usage()}`);
    }
  }
  return args;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJsonIfPresent(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileReceipt(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function countLessonLabels(milestone) {
  const targets = milestone?.lesson?.target_signs;
  const near = milestone?.lesson?.near_confusable_signs;
  return {
    target_count: Array.isArray(targets) ? targets.length : 0,
    near_confusable_count: Array.isArray(near) ? near.length : 0,
    total_vocabulary_label_count: (Array.isArray(targets) ? targets.length : 0) + (Array.isArray(near) ? near.length : 0),
  };
}

function hasLessonCommand(command) {
  return Array.isArray(command) && command.includes("--lesson-milestone");
}

function buildAudit(args) {
  const milestone = readJsonIfPresent(args.milestone);
  const postExportPreflight = readJsonIfPresent(args.postExportPreflight);
  const trainingProvenance = readJsonIfPresent(args.trainingProvenance);
  const validationReport = readJsonIfPresent(args.validationReport);
  const calibratedProvenance = readJsonIfPresent(args.calibratedProvenance);
  const blockers = [];

  if (!milestone) blockers.push(`${projectRelative(args.milestone)} is missing`);
  if (!postExportPreflight) blockers.push(`${projectRelative(args.postExportPreflight)} is missing`);
  if (!trainingProvenance) blockers.push(`${projectRelative(args.trainingProvenance)} is missing`);
  if (!validationReport) blockers.push(`${projectRelative(args.validationReport)} is missing`);
  if (!calibratedProvenance) blockers.push(`${projectRelative(args.calibratedProvenance)} is missing`);

  const labelCounts = countLessonLabels(milestone);
  if (milestone) {
    if (milestone.schema_version !== "asl-pilot-rawframe-lesson-milestone/v1") {
      blockers.push("lesson milestone schema_version is invalid");
    }
    if (labelCounts.target_count !== 25) blockers.push(`expected 25 lesson target signs; found ${labelCounts.target_count}`);
    if (labelCounts.near_confusable_count !== 10) {
      blockers.push(`expected 10 near-confusable signs; found ${labelCounts.near_confusable_count}`);
    }
  }

  if (postExportPreflight?.status !== "lesson_post_export_preflight_passed") {
    blockers.push(`post-export preflight is not passed: ${postExportPreflight?.status ?? "missing"}`);
  }
  for (const blocker of postExportPreflight?.blockers ?? []) blockers.push(blocker);

  if (trainingProvenance) {
    if (trainingProvenance.evidence_mode !== "lesson_milestone") {
      blockers.push(`training provenance evidence_mode is ${trainingProvenance.evidence_mode ?? "missing"}, not lesson_milestone`);
    }
    if (trainingProvenance.generated_by?.lesson_milestone !== true) {
      blockers.push("training provenance generated_by.lesson_milestone is not true");
    }
    if (trainingProvenance.generated_by?.allow_small_label_set === true) {
      blockers.push("training provenance used allow_small_label_set");
    }
    if (!hasLessonCommand(trainingProvenance.training_command)) {
      blockers.push("training command does not include --lesson-milestone");
    }
    const labelCount = Object.keys(trainingProvenance.labels ?? {}).length;
    if (labelCount < 25 || labelCount > 40) {
      blockers.push(`training provenance label count is ${labelCount}, not 25-40`);
    }
    const manifestPaths = new Set((trainingProvenance.manifests ?? []).map((item) => item?.path));
    for (const required of [
      "data/manifests/lesson/rawframe-milestone/train.json",
      "data/manifests/lesson/rawframe-milestone/validation.json",
      "data/manifests/lesson/rawframe-milestone/test.json",
    ]) {
      if (!manifestPaths.has(required)) blockers.push(`training provenance is missing manifest path ${required}`);
    }
  }

  if (validationReport) {
    if (validationReport.evidence_mode !== "lesson_milestone") {
      blockers.push(`validation report evidence_mode is ${validationReport.evidence_mode ?? "missing"}, not lesson_milestone`);
    }
    if (validationReport.final_model_evidence === true) {
      blockers.push("validation report incorrectly marks final_model_evidence true");
    }
    if (validationReport.generated_by?.lesson_milestone !== true) {
      blockers.push("validation report generated_by.lesson_milestone is not true");
    }
    if (!hasLessonCommand(validationReport.evaluation_command)) {
      blockers.push("evaluation command does not include --lesson-milestone");
    }
    if (validationReport.model?.label_count < 25 || validationReport.model?.label_count > 40) {
      blockers.push(`validation report label count is ${validationReport.model?.label_count ?? "missing"}, not 25-40`);
    }
    if (validationReport.status !== "lesson_milestone_validation_passed") {
      blockers.push(`lesson milestone validation did not pass: ${validationReport.status ?? "missing"}`);
    }
    if (validationReport.pass_status && Object.values(validationReport.pass_status).some((value) => value !== true)) {
      blockers.push("one or more lesson milestone pass_status checks failed");
    }
  }

  if (calibratedProvenance) {
    if (calibratedProvenance.evidence_mode !== "lesson_milestone") {
      blockers.push(`calibrated provenance evidence_mode is ${calibratedProvenance.evidence_mode ?? "missing"}, not lesson_milestone`);
    }
    if (calibratedProvenance.final_model_evidence === true) {
      blockers.push("calibrated provenance incorrectly marks final_model_evidence true");
    }
    if (calibratedProvenance.generated_by?.lesson_milestone !== true) {
      blockers.push("calibrated provenance generated_by.lesson_milestone is not true");
    }
  }

  const report = {
    schema_version: "asl-pilot-rawframe-lesson-evidence-audit/v1",
    status: blockers.length === 0 ? "lesson_milestone_evidence_passed" : "blocked_lesson_milestone_evidence",
    checked_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/audit_rawframe_lesson_evidence.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv,
    },
    final_model_evidence: false,
    lesson_milestone_evidence_gate: true,
    inputs: {
      milestone: fileReceipt(args.milestone),
      post_export_preflight: fileReceipt(args.postExportPreflight),
      training_provenance: fileReceipt(args.trainingProvenance),
      validation_report: fileReceipt(args.validationReport),
      calibrated_provenance: fileReceipt(args.calibratedProvenance),
    },
    lesson_label_counts: labelCounts,
    observed_statuses: {
      post_export_preflight: postExportPreflight?.status ?? null,
      training_evidence_mode: trainingProvenance?.evidence_mode ?? null,
      validation_report_status: validationReport?.status ?? null,
      validation_evidence_mode: validationReport?.evidence_mode ?? null,
      calibrated_evidence_mode: calibratedProvenance?.evidence_mode ?? null,
    },
    pass_status: validationReport?.pass_status ?? null,
    metrics: {
      validation_top1: validationReport?.validation?.top1_accuracy ?? null,
      validation_macro_f1: validationReport?.validation?.macro_f1 ?? null,
      test_top1: validationReport?.test?.top1_accuracy ?? null,
      test_macro_f1: validationReport?.test?.macro_f1 ?? null,
      test_false_pass_rate: validationReport?.test?.threshold_metrics?.false_pass_rate ?? null,
      negative_challenge_false_pass_rate: validationReport?.negative_challenge?.metrics?.false_pass_rate ?? null,
    },
    blockers: [...new Set(blockers)],
    required_next_commands: [
      "node scripts/audit_rawframe_lesson_collection_readiness.mjs --write",
      "node scripts/export_rawframe_lesson_first_party_manifests.mjs --write",
      "node scripts/run_rawframe_lesson_post_export_preflight.mjs --write",
      "PYTHONPATH=scripts ./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/lesson/rawframe-milestone/train.json --manifest data/manifests/lesson/rawframe-milestone/validation.json --manifest data/manifests/lesson/rawframe-milestone/test.json --manifest data/manifests/lesson/rawframe-milestone/negative-challenge.json --lesson-milestone",
      "PYTHONPATH=scripts ./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/rawframe-milestone/train.json --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json --test-manifest data/manifests/lesson/rawframe-milestone/test.json --output-dir artifacts/rawframe-lesson-milestone --lesson-milestone --check-files",
      "PYTHONPATH=scripts ./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-lesson-milestone/model_state.pt --training-provenance artifacts/rawframe-lesson-milestone/training-provenance.json --train-manifest data/manifests/lesson/rawframe-milestone/train.json --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json --test-manifest data/manifests/lesson/rawframe-milestone/test.json --challenge-manifest data/manifests/lesson/rawframe-milestone/negative-challenge.json --output-report artifacts/rawframe-lesson-milestone/validation-report.json --calibrated-provenance artifacts/rawframe-lesson-milestone/calibrated-provenance.json --lesson-milestone",
      "node scripts/audit_rawframe_lesson_evidence.mjs --write",
    ],
  };
  return report;
}

async function main() {
  const args = parseArgs(process.argv);
  const audit = buildAudit(args);
  const serialized = `${JSON.stringify(audit, null, 2)}\n`;
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, serialized);
    console.log(
      JSON.stringify(
        {
          status: audit.status,
          wrote: true,
          output: projectRelative(args.output),
          blockers: audit.blockers,
        },
        null,
        2,
      ),
    );
  } else {
    process.stdout.write(serialized);
  }
  return audit.status === "lesson_milestone_evidence_passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
