import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultExportSummaryPath = path.join(root, "docs", "validation", "rawframe-lesson-first-party-manifest-export.json");
const defaultManifestDir = path.join(root, "data", "manifests", "lesson", "rawframe-milestone");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-lesson-post-export-preflight.json");
const schemaVersion = "asl-pilot-rawframe-lesson-post-export-preflight/v1";

function parseArgs(argv) {
  const args = {
    exportSummary: defaultExportSummaryPath,
    manifestDir: defaultManifestDir,
    output: defaultOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--export-summary") {
      args.exportSummary = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--manifest-dir") {
      args.manifestDir = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/run_rawframe_lesson_post_export_preflight.mjs
  node scripts/run_rawframe_lesson_post_export_preflight.mjs --write

Checks the real post-capture lesson manifest handoff. It requires the lesson
first-party manifest export summary to be green, requires train/validation/test
and negative-challenge manifests to exist, then runs the downstream Python
manifest validators and decode dry-run against those real lesson manifests.
This preflight is for the 25-sign lesson milestone and is not final 75-100 label
evidence.
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

function readJsonIfPresent(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function pythonExecutable() {
  const venvPython = path.join(root, ".venv", "bin", "python");
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function projectRelativeCommand(value) {
  if (!path.isAbsolute(value)) return value;
  return projectRelative(value);
}

function runPython(args) {
  const executable = pythonExecutable();
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONPATH: "scripts",
    },
  });
  return {
    command: [projectRelativeCommand(executable), ...args],
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function manifestFiles(manifestDir) {
  return {
    train: path.join(manifestDir, "train.json"),
    validation: path.join(manifestDir, "validation.json"),
    test: path.join(manifestDir, "test.json"),
    negativeChallenge: path.join(manifestDir, "negative-challenge.json"),
  };
}

function downstreamValidationScript(files) {
  return `
from pathlib import Path
from decode_raw_videos import validate_negative_challenge_manifest_for_decode
from train_rawframe_model import validate_manifest

train = validate_manifest(Path("${projectRelative(files.train)}"), "train", True, False, True)
validation = validate_manifest(Path("${projectRelative(files.validation)}"), "validation", True, False, True)
test = validate_manifest(Path("${projectRelative(files.test)}"), "test", True, False, True)
negative = validate_negative_challenge_manifest_for_decode(Path("${projectRelative(files.negativeChallenge)}"), False)
print({
    "status": "passed",
    "train_clip_count": train["clip_count"],
    "validation_clip_count": validation["clip_count"],
    "test_clip_count": test["clip_count"],
    "negative_challenge_clip_count": negative["clip_count"],
    "label_count": train["label_count"],
})
`;
}

function decodeDryRunArgs(files) {
  return [
    "scripts/decode_raw_videos.py",
    "--manifest",
    projectRelative(files.train),
    "--manifest",
    projectRelative(files.validation),
    "--manifest",
    projectRelative(files.test),
    "--manifest",
    projectRelative(files.negativeChallenge),
    "--dry-run",
    "--lesson-milestone",
  ];
}

function buildReport(args) {
  const files = manifestFiles(args.manifestDir);
  const exportSummary = readJsonIfPresent(args.exportSummary);
  const blockers = [];
  if (!exportSummary) {
    blockers.push(`${projectRelative(args.exportSummary)} is missing`);
  } else if (exportSummary.status !== "lesson_first_party_manifests_export_ready") {
    blockers.push(`lesson manifest export summary is not ready: ${exportSummary.status ?? "missing"}`);
    for (const blocker of exportSummary.blockers ?? []) blockers.push(blocker);
  }
  for (const [split, file] of Object.entries(files)) {
    if (!fs.existsSync(file)) blockers.push(`${split} lesson manifest is missing: ${projectRelative(file)}`);
  }

  let downstreamValidation = null;
  let decodeDryRun = null;
  if (blockers.length === 0) {
    downstreamValidation = runPython(["-c", downstreamValidationScript(files)]);
    if (downstreamValidation.exit_code !== 0) {
      blockers.push(`downstream manifest validation exited ${downstreamValidation.exit_code}`);
    }
    decodeDryRun = runPython(decodeDryRunArgs(files));
    if (decodeDryRun.exit_code !== 0) {
      blockers.push(`decode dry-run exited ${decodeDryRun.exit_code}`);
    }
  }

  return {
    schema_version: schemaVersion,
    status: blockers.length === 0
      ? "lesson_post_export_preflight_passed"
      : "blocked_lesson_post_export_preflight",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "run_rawframe_lesson_post_export_preflight.mjs")),
    },
    final_model_evidence: false,
    lesson_milestone_evidence_gate: true,
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      writes_tensors: false,
      trains_model: false,
      final_75_100_label_evidence: false,
      lesson_25_sign_preflight_only: true,
    },
    inputs: {
      export_summary: fileReference(args.exportSummary),
      manifest_dir: projectRelative(args.manifestDir),
      manifests: {
        train: fileReference(files.train),
        validation: fileReference(files.validation),
        test: fileReference(files.test),
        negative_challenge: fileReference(files.negativeChallenge),
      },
    },
    blockers: [...new Set(blockers)],
    export_summary_status: exportSummary?.status ?? null,
    expected_manifest_counts: exportSummary?.manifest_export?.counts ?? null,
    commands: {
      downstream_manifest_validation: downstreamValidation,
      decode_dry_run: decodeDryRun,
    },
    required_next_commands: [
      "node scripts/audit_rawframe_lesson_collection_readiness.mjs --write",
      "node scripts/export_rawframe_lesson_first_party_manifests.mjs --write",
      "node scripts/run_rawframe_lesson_post_export_preflight.mjs --write",
      "PYTHONPATH=scripts ./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/lesson/rawframe-milestone/train.json --manifest data/manifests/lesson/rawframe-milestone/validation.json --manifest data/manifests/lesson/rawframe-milestone/test.json --manifest data/manifests/lesson/rawframe-milestone/negative-challenge.json --lesson-milestone",
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
  if (args.write) writeJson(args.output, report);
  console.log(JSON.stringify({
    status: report.status,
    wrote: args.write,
    output: projectRelative(args.output),
    blockers: report.blockers,
    downstream_manifest_validation_exit: report.commands.downstream_manifest_validation?.exit_code ?? null,
    decode_dry_run_exit: report.commands.decode_dry_run?.exit_code ?? null,
  }, null, 2));
  return report.status === "lesson_post_export_preflight_passed" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame lesson post-export preflight failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
