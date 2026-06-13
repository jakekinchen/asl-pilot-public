import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "review", "online-negative-challenge-review-packet.json");
const schemaVersion = "asl-pilot-online-negative-challenge-review-packet/v1";
const requiredTypes = [
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "non_target_asl_sign",
  "waving",
  "hand_clap",
  "hands_cropped_out",
];
const minClipsPerType = 5;

function parseArgs(argv) {
  const args = { packet: defaultPacketPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--packet") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --packet");
      args.packet = resolveProjectPath(value, "--packet");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_online_negative_challenge_review_packet.mjs [--packet docs/review/online-negative-challenge-review-packet.json]

Validates the combined online negative challenge review packet. Passing this
audit means the packet has a downloaded, hash-pinned 20-clip review candidate
set. It does not mean the clips are approved for the source register or final
manifest.
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

function validateClip(clip, index, counts, seenIds, blockers) {
  const context = `clips[${index}]`;
  if (!clip || typeof clip !== "object" || Array.isArray(clip)) {
    blockers.push(`${context} must be an object`);
    return;
  }
  for (const key of [
    "candidate_id",
    "source_id",
    "challenge_type",
    "expected_outcome",
    "source_record_id",
    "source_page_url",
    "source_file_url",
    "source_file_page_title",
    "source_license_short_name",
    "source_author",
    "local_video_path",
  ]) {
    if (typeof clip[key] !== "string" || clip[key].trim().length === 0) {
      blockers.push(`${context}.${key} must be a non-empty string`);
    }
  }
  if (seenIds.has(clip.candidate_id)) {
    blockers.push(`${context}.candidate_id is duplicated: ${clip.candidate_id}`);
  }
  seenIds.add(clip.candidate_id);
  if (!requiredTypes.includes(clip.challenge_type)) {
    blockers.push(`${context}.challenge_type must be one of ${requiredTypes.join(", ")}`);
  } else {
    counts[clip.challenge_type] += 1;
  }
  if (clip.expected_outcome !== "reject") {
    blockers.push(`${context}.expected_outcome must be reject`);
  }
  if (clip.downloaded !== true) {
    blockers.push(`${context}.downloaded must be true`);
  }
  if (!isSha256(clip.downloaded_sha256)) {
    blockers.push(`${context}.downloaded_sha256 must be a SHA-256 digest`);
  }
  if (!clip.upstream_review_packet || typeof clip.upstream_review_packet !== "object") {
    blockers.push(`${context}.upstream_review_packet must be an object`);
  } else {
    try {
      const upstream = resolveProjectPath(clip.upstream_review_packet.path, `${context}.upstream_review_packet.path`);
      if (!fs.existsSync(upstream)) {
        blockers.push(`${context}.upstream_review_packet.path is missing`);
      } else if (clip.upstream_review_packet.sha256 !== sha256File(upstream)) {
        blockers.push(`${context}.upstream_review_packet.sha256 mismatch`);
      }
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
  }
  let localPath;
  try {
    localPath = resolveProjectPath(clip.local_video_path, `${context}.local_video_path`);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    return;
  }
  if (!fs.existsSync(localPath)) {
    blockers.push(`${context}.local_video_path is missing: ${clip.local_video_path}`);
    return;
  }
  const actualSha256 = sha256File(localPath);
  if (clip.downloaded_sha256 !== actualSha256) {
    blockers.push(`${context}.downloaded_sha256 mismatch for ${clip.local_video_path}; expected ${clip.downloaded_sha256}, got ${actualSha256}`);
  }
  const metadata = clip.source_file_metadata;
  if (!metadata || typeof metadata !== "object") {
    blockers.push(`${context}.source_file_metadata must be an object`);
    return;
  }
  if (metadata.source_sha256 !== clip.downloaded_sha256) {
    blockers.push(`${context}.source_file_metadata.source_sha256 must match downloaded_sha256`);
  }
}

function validatePacket(data) {
  const blockers = [];
  if (data.schema_version !== schemaVersion) {
    blockers.push(`schema_version must be ${schemaVersion}`);
  }
  if (data.status !== "ready_for_visual_review") {
    blockers.push("status must be ready_for_visual_review");
  }
  if (data.evidence_mode !== "mixed_external_source_candidate_visual_review") {
    blockers.push("evidence_mode must be mixed_external_source_candidate_visual_review");
  }
  if (data.finality !== "not_final_model_evidence") {
    blockers.push("finality must be not_final_model_evidence");
  }
  if (Array.isArray(data.blockers) && data.blockers.length > 0) {
    blockers.push(`packet contains blockers: ${data.blockers.join("; ")}`);
  }
  if (!Array.isArray(data.clips) || data.clips.length === 0) {
    blockers.push("clips must be a non-empty array");
  }
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  const seenIds = new Set();
  for (const [index, clip] of (data.clips ?? []).entries()) {
    validateClip(clip, index, counts, seenIds, blockers);
  }
  for (const type of requiredTypes) {
    if (counts[type] < minClipsPerType) {
      blockers.push(`packet needs at least ${minClipsPerType} ${type} clips; found ${counts[type]}`);
    }
    if (data.downloaded_counts_by_type?.[type] !== counts[type]) {
      blockers.push(`downloaded_counts_by_type.${type} must equal ${counts[type]}`);
    }
  }
  if (data.selected_count !== (data.clips ?? []).length) {
    blockers.push("selected_count must match clips.length");
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
  if (!fs.existsSync(args.packet)) {
    blockers.push(`Review packet does not exist: ${projectRelative(args.packet)}`);
  } else {
    try {
      const validation = validatePacket(readJson(args.packet));
      blockers.push(...validation.blockers);
      counts = validation.counts;
    } catch (error) {
      blockers.push(`Review packet is not valid JSON: ${error.message}`);
    }
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    packet: {
      path: projectRelative(args.packet),
      exists: fs.existsSync(args.packet),
      sha256: fs.existsSync(args.packet) ? sha256File(args.packet) : null,
    },
    counts_by_type: counts,
    finality: "review_packet_only_not_final_model_evidence",
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Online negative challenge review packet audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge review packet audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
