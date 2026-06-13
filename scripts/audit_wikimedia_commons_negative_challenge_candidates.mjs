import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatePath = path.join(
  root,
  "docs",
  "research",
  "wikimedia-commons-negative-challenge-candidates.json",
);
const schemaVersion = "asl-pilot-wikimedia-commons-negative-challenge-candidates/v1";
const sourceId = "wikimedia-commons-negative-challenge-videos";
const requiredTypes = [
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "waving",
  "hand_clap",
  "hands_cropped_out",
];
const minCandidatesPerType = 5;
const allowedMimeTypes = new Set(["video/webm", "application/ogg", "video/ogg"]);

function parseArgs(argv) {
  const args = { candidates: defaultCandidatePath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--candidates") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --candidates");
      args.candidates = resolveProjectPath(value, "--candidates");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_wikimedia_commons_negative_challenge_candidates.mjs [--candidates docs/research/wikimedia-commons-negative-challenge-candidates.json]

Validates the Wikimedia Commons file-level candidate pool for negative challenge
source review. Passing this audit does not mean the files are final model
evidence; it means the pool is ready for visual review, download, and exact-file
source approval.
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

function isHttpUrl(value) {
  return typeof value === "string" && /^https:\/\//.test(value);
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateCandidate(candidate, index, seenTitles, seenUrls, blockers) {
  const context = `candidates[${index}]`;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    blockers.push(`${context} must be an object`);
    return;
  }
  for (const key of [
    "candidate_id",
    "challenge_type",
    "expected_outcome",
    "review_status",
    "rights_review_status",
    "source_record_id",
    "source_file_page_title",
    "source_page_url",
    "source_file_url",
    "source_license_short_name",
    "source_author",
    "selection_rationale",
    "suggested_local_video_path",
  ]) {
    if (typeof candidate[key] !== "string" || candidate[key].trim().length === 0) {
      blockers.push(`${context}.${key} must be a non-empty string`);
    }
  }
  if (!requiredTypes.includes(candidate.challenge_type)) {
    blockers.push(`${context}.challenge_type must be one of ${requiredTypes.join(", ")}`);
  }
  if (candidate.expected_outcome !== "reject") {
    blockers.push(`${context}.expected_outcome must be reject`);
  }
  if (candidate.review_status !== "needs_visual_review") {
    blockers.push(`${context}.review_status must remain needs_visual_review before final approval`);
  }
  if (candidate.rights_review_status !== "candidate_metadata_collected") {
    blockers.push(`${context}.rights_review_status must be candidate_metadata_collected`);
  }
  if (candidate.final_manifest_eligible !== false) {
    blockers.push(`${context}.final_manifest_eligible must be false before download/review/import`);
  }
  if (seenTitles.has(candidate.source_file_page_title)) {
    blockers.push(`${context}.source_file_page_title is duplicated`);
  }
  seenTitles.add(candidate.source_file_page_title);
  if (seenUrls.has(candidate.source_file_url)) {
    blockers.push(`${context}.source_file_url is duplicated`);
  }
  seenUrls.add(candidate.source_file_url);
  if (!isHttpUrl(candidate.source_page_url) || !candidate.source_page_url.includes("commons.wikimedia.org/wiki/File:")) {
    blockers.push(`${context}.source_page_url must be an https Commons file page URL`);
  }
  if (!isHttpUrl(candidate.source_file_url) || !candidate.source_file_url.includes("upload.wikimedia.org/")) {
    blockers.push(`${context}.source_file_url must be an https upload.wikimedia.org URL`);
  }
  const metadata = candidate.source_file_metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    blockers.push(`${context}.source_file_metadata must be an object`);
    return;
  }
  if (metadata.license_short_name !== candidate.source_license_short_name) {
    blockers.push(`${context}.source_file_metadata.license_short_name must match source_license_short_name`);
  }
  if (!allowedMimeTypes.has(metadata.mime)) {
    blockers.push(`${context}.source_file_metadata.mime must be WebM/Ogg`);
  }
  if (!isPositiveNumber(metadata.size_bytes)) {
    blockers.push(`${context}.source_file_metadata.size_bytes must be positive`);
  }
  if (typeof metadata.commons_sha1 !== "string" || !/^[a-f0-9]{40}$/.test(metadata.commons_sha1)) {
    blockers.push(`${context}.source_file_metadata.commons_sha1 must be a lowercase SHA-1 digest`);
  }
  if (metadata.source_sha256 !== null) {
    blockers.push(`${context}.source_file_metadata.source_sha256 must remain null until download/import`);
  }
  if (candidate.below_preferred_size_limit !== true) {
    blockers.push(`${context}.below_preferred_size_limit must be true for this candidate pool`);
  }
}

function validateCandidateFile(data) {
  const blockers = [];
  if (data.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (data.status !== "ready_for_visual_review") {
    blockers.push("status must be ready_for_visual_review");
  }
  if (data.evidence_mode !== "source_discovery_file_level") {
    blockers.push("evidence_mode must be source_discovery_file_level");
  }
  if (data.finality !== "not_final_model_evidence") {
    blockers.push("finality must be not_final_model_evidence");
  }
  if (data.source_id !== sourceId) {
    blockers.push(`source_id must be ${sourceId}`);
  }
  if (data.source_scope !== "negative_challenge_validation_candidates_only") {
    blockers.push("source_scope must be negative_challenge_validation_candidates_only");
  }
  if (Array.isArray(data.blockers) && data.blockers.length > 0) {
    blockers.push(`candidate export contains blockers: ${data.blockers.join("; ")}`);
  }
  const requirements = data.candidate_requirements;
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) {
    blockers.push("candidate_requirements must be an object");
  } else {
    for (const type of requiredTypes) {
      if (!requirements.required_challenge_types?.includes(type)) {
        blockers.push(`candidate_requirements.required_challenge_types must include ${type}`);
      }
    }
    if (requirements.min_candidates_per_required_type !== minCandidatesPerType) {
      blockers.push(`candidate_requirements.min_candidates_per_required_type must be ${minCandidatesPerType}`);
    }
  }
  if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
    blockers.push("candidates must be a non-empty array");
  }
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  const seenTitles = new Set();
  const seenUrls = new Set();
  for (const [index, candidate] of (data.candidates ?? []).entries()) {
    if (requiredTypes.includes(candidate?.challenge_type)) counts[candidate.challenge_type] += 1;
    validateCandidate(candidate, index, seenTitles, seenUrls, blockers);
  }
  for (const type of requiredTypes) {
    if (counts[type] < minCandidatesPerType) {
      blockers.push(`candidate pool needs at least ${minCandidatesPerType} ${type} candidates; found ${counts[type]}`);
    }
    if (data.counts_by_type?.[type] !== counts[type]) {
      blockers.push(`counts_by_type.${type} must equal ${counts[type]}`);
    }
  }
  if (data.candidate_count !== data.candidates?.length) {
    blockers.push("candidate_count must match candidates.length");
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
  if (!fs.existsSync(args.candidates)) {
    blockers.push(`Candidate file does not exist: ${projectRelative(args.candidates)}`);
  }
  let counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  if (blockers.length === 0) {
    try {
      const data = readJson(args.candidates);
      const validation = validateCandidateFile(data);
      blockers.push(...validation.blockers);
      counts = validation.counts;
    } catch (error) {
      blockers.push(`Candidate file is not valid JSON: ${error.message}`);
    }
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    candidates: {
      path: projectRelative(args.candidates),
      exists: fs.existsSync(args.candidates),
      sha256: fs.existsSync(args.candidates) ? sha256File(args.candidates) : null,
    },
    counts_by_type: counts,
    finality: "candidate_pool_only_not_final_model_evidence",
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Wikimedia Commons candidate audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Wikimedia Commons candidate audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
