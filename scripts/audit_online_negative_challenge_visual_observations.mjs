import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultObservationsPath = path.join(
  root,
  "docs",
  "review",
  "online-negative-challenge-contact-sheet-observations.json",
);
const schemaVersion = "asl-pilot-online-negative-challenge-contact-sheet-observations/v1";
const allowedStatuses = new Set([
  "strong_visual_candidate",
  "needs_human_review",
  "replace_before_final_manifest",
]);

function parseArgs(argv) {
  const args = { observations: defaultObservationsPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--observations") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --observations");
      args.observations = resolveProjectPath(value, "--observations");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_online_negative_challenge_visual_observations.mjs [--observations docs/review/online-negative-challenge-contact-sheet-observations.json]

Validates the non-final visual observation file produced from contact sheets.
This audit intentionally rejects files that claim final approval.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function verifyReference(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a SHA-256 digest`);
    return;
  }
  let file;
  try {
    file = resolveProjectPath(reference.path, `${context}.path`);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    return;
  }
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path is missing: ${reference.path}`);
    return;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
}

function validateObservations(data) {
  const blockers = [];
  if (data.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (data.status !== "needs_curated_review") {
    blockers.push("status must be needs_curated_review");
  }
  if (data.finality !== "not_final_model_evidence") {
    blockers.push("finality must remain not_final_model_evidence");
  }
  if (data.reviewer?.is_final_source_approver !== false) {
    blockers.push("reviewer.is_final_source_approver must be false");
  }
  verifyReference(data.review_packet, "review_packet", blockers);
  verifyReference(data.contact_sheet_manifest, "contact_sheet_manifest", blockers);
  if (!Array.isArray(data.observations) || data.observations.length === 0) {
    blockers.push("observations must be a non-empty array");
  }
  const seenIds = new Set();
  const counts = {
    strong_visual_candidate: 0,
    needs_human_review: 0,
    replace_before_final_manifest: 0,
  };
  for (const [index, observation] of (data.observations ?? []).entries()) {
    const context = `observations[${index}]`;
    for (const key of ["candidate_id", "challenge_type", "visual_status", "reason", "recommended_action"]) {
      if (typeof observation?.[key] !== "string" || !observation[key].trim()) {
        blockers.push(`${context}.${key} must be a non-empty string`);
      }
    }
    if (seenIds.has(observation?.candidate_id)) {
      blockers.push(`${context}.candidate_id is duplicated`);
    }
    seenIds.add(observation?.candidate_id);
    if (!allowedStatuses.has(observation?.visual_status)) {
      blockers.push(`${context}.visual_status must be one of ${[...allowedStatuses].join(", ")}`);
    } else {
      counts[observation.visual_status] += 1;
    }
  }
  if (data.summary?.candidate_count !== data.observations?.length) {
    blockers.push("summary.candidate_count must match observations.length");
  }
  if (data.summary?.approved_for_final_manifest_count !== 0) {
    blockers.push("summary.approved_for_final_manifest_count must remain 0");
  }
  for (const [status, count] of Object.entries(counts)) {
    const summaryKey = {
      strong_visual_candidate: "strong_visual_candidates",
      needs_human_review: "needs_human_review_count",
      replace_before_final_manifest: "recommended_replacement_count",
    }[status];
    if (data.summary?.[summaryKey] !== count) {
      blockers.push(`summary.${summaryKey} must equal ${count}`);
    }
  }
  return { blockers, counts };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const blockers = [];
  let counts = {};
  if (!fs.existsSync(args.observations)) {
    blockers.push(`Observations file does not exist: ${projectRelative(args.observations)}`);
  } else {
    try {
      const validation = validateObservations(readJson(args.observations));
      blockers.push(...validation.blockers);
      counts = validation.counts;
    } catch (error) {
      blockers.push(`Observations file is not valid JSON: ${error.message}`);
    }
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    observations: {
      path: projectRelative(args.observations),
      exists: fs.existsSync(args.observations),
      sha256: fs.existsSync(args.observations) ? sha256File(args.observations) : null,
    },
    counts_by_visual_status: counts,
    finality: "visual_observations_only_not_final_model_evidence",
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Online negative challenge visual observation audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge visual observation audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
