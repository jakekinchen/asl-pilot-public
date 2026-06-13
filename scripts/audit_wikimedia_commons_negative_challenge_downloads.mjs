import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultDownloadPath = path.join(
  root,
  "docs",
  "research",
  "wikimedia-commons-negative-challenge-downloads.json",
);
const schemaVersion = "asl-pilot-wikimedia-commons-negative-challenge-downloads/v1";
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
const minDownloadsPerType = 5;

function parseArgs(argv) {
  const args = { downloads: defaultDownloadPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--downloads") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --downloads");
      args.downloads = resolveProjectPath(value, "--downloads");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_wikimedia_commons_negative_challenge_downloads.mjs [--downloads docs/research/wikimedia-commons-negative-challenge-downloads.json]

Validates local SHA-256 download evidence for Wikimedia Commons negative
challenge candidates. This audit must pass before the downloaded files can be
used for exact-file source approval or final manifest generation.
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

function validateDownload(download, index, counts, blockers) {
  const context = `downloads[${index}]`;
  if (!download || typeof download !== "object" || Array.isArray(download)) {
    blockers.push(`${context} must be an object`);
    return;
  }
  for (const key of [
    "candidate_id",
    "challenge_type",
    "expected_outcome",
    "review_status",
    "source_record_id",
    "source_file_page_title",
    "source_page_url",
    "source_file_url",
    "source_license_short_name",
    "source_author",
    "local_video_path",
  ]) {
    if (typeof download[key] !== "string" || download[key].trim().length === 0) {
      blockers.push(`${context}.${key} must be a non-empty string`);
    }
  }
  if (!requiredTypes.includes(download.challenge_type)) {
    blockers.push(`${context}.challenge_type must be one of ${requiredTypes.join(", ")}`);
  }
  if (download.expected_outcome !== "reject") {
    blockers.push(`${context}.expected_outcome must be reject`);
  }
  if (download.review_status !== "needs_visual_review") {
    blockers.push(`${context}.review_status must remain needs_visual_review until review evidence is imported`);
  }
  if (download.final_manifest_eligible !== false) {
    blockers.push(`${context}.final_manifest_eligible must be false before final review/import`);
  }
  if (download.exists !== true) {
    blockers.push(`${context} is not downloaded: ${download.candidate_id ?? "unknown"}`);
    return;
  }
  if (!isSha256(download.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
  }
  let localPath;
  try {
    localPath = resolveProjectPath(download.local_video_path, `${context}.local_video_path`);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    return;
  }
  if (!fs.existsSync(localPath)) {
    blockers.push(`${context}.local_video_path is missing: ${download.local_video_path}`);
    return;
  }
  const stat = fs.statSync(localPath);
  if (download.size_bytes !== stat.size) {
    blockers.push(`${context}.size_bytes mismatch for ${download.local_video_path}; expected ${download.size_bytes}, got ${stat.size}`);
  }
  const actualSha256 = sha256File(localPath);
  if (download.sha256 !== actualSha256) {
    blockers.push(`${context}.sha256 mismatch for ${download.local_video_path}; expected ${download.sha256}, got ${actualSha256}`);
  }
  if (download.source_file_metadata?.source_sha256 !== download.sha256) {
    blockers.push(`${context}.source_file_metadata.source_sha256 must match download sha256`);
  }
  counts[download.challenge_type] += 1;
}

function validateDownloadFile(data) {
  const blockers = [];
  if (data.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (data.status !== "downloaded") {
    blockers.push("status must be downloaded before exact-file source approval");
  }
  if (data.evidence_mode !== "source_download_hashes") {
    blockers.push("evidence_mode must be source_download_hashes");
  }
  if (data.finality !== "not_final_model_evidence") {
    blockers.push("finality must be not_final_model_evidence");
  }
  if (data.source_id !== sourceId) {
    blockers.push(`source_id must be ${sourceId}`);
  }
  if (!data.candidate_pool || typeof data.candidate_pool !== "object") {
    blockers.push("candidate_pool must be a hash-pinned object");
  } else {
    try {
      const candidatePool = resolveProjectPath(data.candidate_pool.path, "candidate_pool.path");
      if (!fs.existsSync(candidatePool)) {
        blockers.push(`candidate_pool.path is missing: ${data.candidate_pool.path}`);
      } else if (data.candidate_pool.sha256 !== sha256File(candidatePool)) {
        blockers.push("candidate_pool.sha256 mismatch");
      }
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (Array.isArray(data.blockers) && data.blockers.length > 0) {
    blockers.push(`download evidence contains blockers: ${data.blockers.join("; ")}`);
  }
  if (!Array.isArray(data.downloads) || data.downloads.length === 0) {
    blockers.push("downloads must be a non-empty array");
  }
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const [index, download] of (data.downloads ?? []).entries()) {
    validateDownload(download, index, counts, blockers);
  }
  for (const type of requiredTypes) {
    if (counts[type] < minDownloadsPerType) {
      blockers.push(`download evidence needs at least ${minDownloadsPerType} ${type} downloads; found ${counts[type]}`);
    }
  }
  if (data.downloaded_count !== Object.values(counts).reduce((total, count) => total + count, 0)) {
    blockers.push("downloaded_count must match verified downloaded files");
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
  let counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  if (!fs.existsSync(args.downloads)) {
    blockers.push(`Download evidence does not exist: ${projectRelative(args.downloads)}`);
  }
  if (blockers.length === 0) {
    try {
      const data = readJson(args.downloads);
      const validation = validateDownloadFile(data);
      blockers.push(...validation.blockers);
      counts = validation.counts;
    } catch (error) {
      blockers.push(`Download evidence is not valid JSON: ${error.message}`);
    }
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    downloads: {
      path: projectRelative(args.downloads),
      exists: fs.existsSync(args.downloads),
      sha256: fs.existsSync(args.downloads) ? sha256File(args.downloads) : null,
    },
    counts_by_type: counts,
    finality: "download_hashes_only_not_final_model_evidence",
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Wikimedia Commons download audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Wikimedia Commons download audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
