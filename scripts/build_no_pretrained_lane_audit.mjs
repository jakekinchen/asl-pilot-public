import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

const paths = {
  depsAuditScript: "scripts/audit_no_pretrained_deps.mjs",
  artifactJsonAuditScript: "scripts/audit_no_pretrained_artifact_json.mjs",
  receipt: "docs/validation/no-pretrained-lane-audit.json",
};

function parseArgs(argv) {
  const args = { write: false };
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
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/build_no_pretrained_lane_audit.mjs [--write]

Runs the deps audit and the artifact-JSON audit, captures their stdout,
computes SHA-256 of each output and of each audit script, and writes the
combined receipt to docs/validation/no-pretrained-lane-audit.json (when
--write is passed). The receipt is the round-001 task-026 deliverable
that binds the post-vestige no-pretrained guarantee into the reviewer
claim chain.
`);
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256File(relativePath) {
  return sha256Bytes(fs.readFileSync(path.join(root, relativePath)));
}

function runNode(scriptRelativePath) {
  const result = spawnSync(process.execPath, [scriptRelativePath], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function buildReceipt() {
  const depsRun = runNode(paths.depsAuditScript);
  const artifactRun = runNode(paths.artifactJsonAuditScript);
  const generatedAt = new Date().toISOString();
  return {
    schema_version: "asl-pilot-no-pretrained-lane-audit/v1",
    audit: "no-pretrained-lane",
    round: "001-task-026",
    generated_at: generatedAt,
    generated_by: {
      script: paths.depsAuditScript.replace("audit_no_pretrained_deps.mjs", "build_no_pretrained_lane_audit.mjs"),
      command: process.argv,
    },
    deps_audit: {
      script: paths.depsAuditScript,
      script_sha256: sha256File(paths.depsAuditScript),
      passed: depsRun.status === 0,
      exit_status: depsRun.status,
      stdout_sha256: sha256Bytes(depsRun.stdout),
      stdout_preview: depsRun.stdout.trim().slice(0, 240),
    },
    artifact_json_audit: {
      script: paths.artifactJsonAuditScript,
      script_sha256: sha256File(paths.artifactJsonAuditScript),
      passed: artifactRun.status === 0,
      exit_status: artifactRun.status,
      stdout_sha256: sha256Bytes(artifactRun.stdout),
    },
    removed_vestige_summary: {
      round: "001",
      task: "task-026",
      brief: "docs/briefs/001-stage-a-vestige-removal.md",
      web_dependencies_dropped: ["@mediapipe/tasks-vision@0.10.35"],
      web_runtime_assets_removed_tree: ["web/public/models/mediapipe/"],
      web_verifier_jsons_removed_count: 12,
      web_source_dirs_removed: ["web/src/asl/"],
      scripts_removed_count: 43,
      artifact_dirs_untracked: ["artifacts/stage_a/", "artifacts/stage_b/"],
      docs_vestige_files_removed_count: 305,
      docs_reframed_to_post_vestige_state: [
        "docs/strategy-confidence-audit.md",
        "docs/execution-plan.md",
        "docs/acceptance-checklist.md",
        "docs/no-pretrained-audit.md",
        "docs/model/dataset-and-training-plan.md",
        "docs/model/goal.md",
        "docs/review/operator-handoff.md",
      ],
      web_public_model_card_excised: [
        "primary_relaxed_stage_a_lane",
        "academic_benchmarks",
        "failed_cv_expansions",
        "metric_frontier_summary",
      ],
      audit_no_pretrained_artifact_json_tightened: [
        "extractor.name rejects mediapipe_*, openpose_*, posenet_*, bodypix_*, handpose_*, movenet_*, blazepose_*, yolo_*, ultralytics_*",
        "extractor.tasks_vision_version and extractor.model_asset_sha256 rejected",
        "Stage A boundary-disclosure whitelist removed",
        "default scan roots narrowed to the promoted-lane claim chain",
      ],
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const receipt = buildReceipt();
  if (args.write) {
    const file = path.join(root, paths.receipt);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: receipt.deps_audit.passed && receipt.artifact_json_audit.passed ? "passed" : "failed",
    receipt_path: paths.receipt,
    deps_passed: receipt.deps_audit.passed,
    artifact_json_passed: receipt.artifact_json_audit.passed,
  }, null, 2));
  return receipt.deps_audit.passed && receipt.artifact_json_audit.passed ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`build_no_pretrained_lane_audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
