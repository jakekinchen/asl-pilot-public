import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultReportPath = path.join(root, "docs", "research", "dataset-source-research-receipts.json");
const schemaVersion = "asl-pilot-dataset-source-research-receipts/v1";
const requiredReceipts = [
  {
    source_id: "nvidia-asl-1000-access",
    url: "https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/",
    decision: "candidate_controlled_access_not_approved",
    constraints: [
      "raw_video_access_claim",
      "license_and_use_case_gate",
      "derived_artifacts_documented",
    ],
  },
  {
    source_id: "nvidia-asl-1000-aws",
    url: "https://registry.opendata.aws/asl_1000/",
    decision: "candidate_controlled_access_not_approved",
    constraints: [
      "controlled_access_s3",
      "license_reference",
      "video_dataset_claim",
    ],
  },
  {
    source_id: "popsign-v2",
    url: "https://signdata.cc.gatech.edu/view/datasets/popsign_v2/index.html",
    decision: "blocked_unreleased_underlying_videos_unavailable",
    constraints: [
      "dataset_not_released",
      "underlying_videos_unavailable",
    ],
  },
  {
    source_id: "asl-citizen",
    url: "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/",
    decision: "blocked_noncommercial_research_only",
    constraints: [
      "noncommercial_research_only",
      "data_distribution_barred",
      "personal_data_restricted",
    ],
  },
  {
    source_id: "asllvd",
    url: "https://www.bu.edu/asllrp/av/dai-asllvd.html",
    decision: "blocked_permission_required_commercial_redistribution",
    constraints: [
      "research_education_only",
      "redistribution_permission_required",
      "commercial_permission_required",
    ],
  },
  {
    source_id: "how2sign",
    url: "https://how2sign.github.io/",
    decision: "blocked_noncommercial_continuous_sentence_data",
    constraints: [
      "continuous_asl_dataset",
      "research_only",
      "noncommercial_license",
    ],
  },
  {
    source_id: "openasl",
    url: "https://raw.githubusercontent.com/chevalierNoir/OpenASL/main/README.md",
    decision: "blocked_noncommercial_noderivatives_web_video",
    constraints: [
      "open_domain_translation",
      "web_video_availability_risk",
      "cc_by_nc_nd_license",
    ],
  },
  {
    source_id: "purdue-rvl-slll-asl",
    url: "https://engineering.purdue.edu/RVL/Database/ASL/asl-database-front.htm.bk.htm",
    decision: "candidate_signed_license_required",
    constraints: [
      "image_video_database",
      "username_password_required",
      "signed_license_required",
    ],
  },
  {
    source_id: "huggingface-zahid-asl",
    url: "https://huggingface.co/datasets/ZahidYasinMittha/American-Sign-Language-Dataset/raw/main/README.md",
    decision: "blocked_scraped_multi_source_provenance_missing",
    constraints: [
      "large_raw_video_claim",
      "scraped_multi_source",
      "research_education_scope",
    ],
  },
  {
    source_id: "wlasl",
    url: "https://github.com/dxli94/WLASL",
    decision: "blocked_academic_computational_only",
    constraints: [
      "c_uda_license",
      "academic_computational_only",
      "commercial_usage_not_allowed",
    ],
  },
  {
    source_id: "wlasl",
    url: "https://raw.githubusercontent.com/dxli94/WLASL/master/README.md",
    decision: "blocked_external_cv_artifact_boundary",
    constraints: [
      "pretrained_weights_documented",
      "derived_pose_artifacts_documented",
      "bounding_box_metadata_documented",
    ],
  },
  {
    source_id: "asl-lex",
    url: "https://asl-lex.org/download.html",
    decision: "blocked_video_permission_required",
    constraints: [
      "noncommercial_database_license",
      "reference_videos_excluded",
      "reference_videos_permission_required",
      "commercial_use_prohibited",
    ],
  },
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--report") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --report");
      args.report = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_dataset_source_research.mjs [--report docs/research/dataset-source-research-receipts.json]

Audits retained source-research receipts for public ASL dataset/license
decisions. These receipts are research evidence only and cannot mark any public
dataset as training-allowed.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function validateReference(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function isNodeExecutableCommand(value) {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const baseName = path.basename(value).toLowerCase().replace(/\.(exe|cmd)$/, "");
  return baseName === "node";
}

function isRefreshScriptCommand(value) {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const normalized = value.split(path.sep).join("/");
  return normalized === "scripts/refresh_dataset_source_research.mjs" ||
    normalized.endsWith("/scripts/refresh_dataset_source_research.mjs");
}

function validateRunnerCommand(command, blockers) {
  if (!Array.isArray(command) || command.length === 0) {
    blockers.push("runner.command must be a non-empty argv array");
    return;
  }
  for (const [index, item] of command.entries()) {
    if (typeof item !== "string" || item.trim().length === 0) {
      blockers.push(`runner.command[${index}] must be a non-empty string`);
    }
  }
  if (!isNodeExecutableCommand(command[0])) {
    blockers.push("runner.command[0] must be the node executable");
  }
  if (command[1] && command[1] === command[0]) {
    blockers.push("runner.command must not duplicate the node executable as argv[1]");
  }
  if (command.slice(1).some((item) => item === command[0])) {
    blockers.push("runner.command must contain the node executable only once");
  }
  const scriptEntries = command.filter(isRefreshScriptCommand);
  if (scriptEntries.length !== 1) {
    blockers.push("runner.command must invoke scripts/refresh_dataset_source_research.mjs exactly once");
  } else if (!isRefreshScriptCommand(command[1])) {
    blockers.push("runner.command[1] must be scripts/refresh_dataset_source_research.mjs");
  }
  if (!command.includes("--write")) {
    blockers.push("runner.command must include --write for the retained canonical receipt");
  }
}

function receiptKey(item) {
  return `${item.source_id}|${item.url}`;
}

function validateReport(report, reportPath) {
  const blockers = [];
  if (report.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (report.status !== "passed") blockers.push("status must be passed");
  if (report.evidence_mode !== "research") blockers.push("evidence_mode must be research");
  if (report.finality !== "not_training_data") blockers.push("finality must be not_training_data");
  if (!isIsoDate(report.generated_at)) blockers.push("generated_at must be an ISO-compatible timestamp");
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push("blockers must be empty when status is passed");
  }
  if (report.runner?.tool !== "node-fetch") blockers.push("runner.tool must be node-fetch");
  const script = validateReference(report.runner?.script, "runner.script", blockers);
  if (script && projectRelative(script) !== "scripts/refresh_dataset_source_research.mjs") {
    blockers.push("runner.script.path must be scripts/refresh_dataset_source_research.mjs");
  }
  validateRunnerCommand(report.runner?.command, blockers);
  if (!Array.isArray(report.sources)) {
    blockers.push("sources must be an array");
  } else {
    const byKey = new Map(report.sources.map((item) => [receiptKey(item), item]));
    for (const required of requiredReceipts) {
      const item = byKey.get(receiptKey(required));
      if (!item) {
        blockers.push(`Missing source research receipt for ${required.source_id}: ${required.url}`);
        continue;
      }
      if (item.http_status < 200 || item.http_status >= 400) {
        blockers.push(`${required.source_id} ${required.url} must have a successful HTTP status`);
      }
      if (!isIsoDate(item.checked_at)) {
        blockers.push(`${required.source_id} ${required.url} checked_at must be an ISO-compatible timestamp`);
      }
      if (!isSha256(item.content_sha256)) {
        blockers.push(`${required.source_id} ${required.url} content_sha256 must be a SHA-256 digest`);
      }
      if (!isSha256(item.normalized_text_sha256)) {
        blockers.push(`${required.source_id} ${required.url} normalized_text_sha256 must be a SHA-256 digest`);
      }
      if (item.decision?.license_review_status !== required.decision) {
        blockers.push(`${required.source_id} ${required.url} decision.license_review_status must be ${required.decision}`);
      }
      for (const key of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
        if (item.decision?.[key] !== false) {
          blockers.push(`${required.source_id} ${required.url} decision.${key} must remain false`);
        }
      }
      if (item.decision?.finality !== "research_reference_only") {
        blockers.push(`${required.source_id} ${required.url} decision.finality must be research_reference_only`);
      }
      const constraints = Array.isArray(item.matched_constraints) ? item.matched_constraints : [];
      for (const constraintId of required.constraints) {
        const constraint = constraints.find((candidate) => candidate?.id === constraintId);
        if (!constraint) {
          blockers.push(`${required.source_id} ${required.url} missing constraint receipt ${constraintId}`);
        } else if (constraint.status !== "matched") {
          blockers.push(`${required.source_id} ${required.url} constraint ${constraintId} must be matched`);
        } else {
          if (typeof constraint.matched_text_excerpt !== "string" || constraint.matched_text_excerpt.trim().length === 0) {
            blockers.push(`${required.source_id} ${required.url} constraint ${constraintId} must retain a matched_text_excerpt`);
          } else if (constraint.matched_text_excerpt.split(/\s+/).filter(Boolean).length > 8) {
            blockers.push(`${required.source_id} ${required.url} constraint ${constraintId} matched_text_excerpt must be 8 words or fewer`);
          }
          if (!isSha256(constraint.matched_text_excerpt_sha256)) {
            blockers.push(`${required.source_id} ${required.url} constraint ${constraintId} matched_text_excerpt_sha256 must be a SHA-256 digest`);
          } else if (
            typeof constraint.matched_text_excerpt === "string" &&
            sha256Text(constraint.matched_text_excerpt) !== constraint.matched_text_excerpt_sha256
          ) {
            blockers.push(`${required.source_id} ${required.url} constraint ${constraintId} matched_text_excerpt_sha256 must match matched_text_excerpt`);
          }
        }
      }
    }
  }
  if (projectRelative(reportPath) !== "docs/research/dataset-source-research-receipts.json") {
    blockers.push("dataset source research receipts must use docs/research/dataset-source-research-receipts.json");
  }
  return {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    report: {
      path: projectRelative(reportPath),
      exists: fs.existsSync(reportPath),
      sha256: fs.existsSync(reportPath) ? sha256File(reportPath) : null,
    },
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const reportPath = args.report ? resolveProjectPath(args.report, "--report") : defaultReportPath;
  if (!fs.existsSync(reportPath)) {
    const summary = {
      status: "failed",
      checked_at: new Date().toISOString(),
      report: {
        path: projectRelative(reportPath),
        exists: false,
        sha256: null,
      },
      blockers: [`Dataset source research receipts are missing: ${projectRelative(reportPath)}`],
    };
    console.log(JSON.stringify(summary, null, 2));
    console.error("Dataset source research audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  const summary = validateReport(readJson(reportPath), reportPath);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.blockers.length > 0) {
    console.error("Dataset source research audit failed:");
    for (const blocker of summary.blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Dataset source research audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
