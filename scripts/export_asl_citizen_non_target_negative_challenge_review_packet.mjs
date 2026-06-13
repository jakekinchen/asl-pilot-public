import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultClipsPath = path.join(
  root,
  "docs",
  "research",
  "asl-citizen-non-target-extracted-clips.json",
);
const defaultOutputPath = path.join(
  root,
  "docs",
  "review",
  "asl-citizen-non-target-negative-challenge-review-packet.json",
);
const schemaVersion = "asl-pilot-asl-citizen-non-target-negative-challenge-review-packet/v1";
const challengeType = "non_target_asl_sign";
const sourceId = "asl-citizen-school-assignment-raw-videos";
const sourceDecisionId = "approved_asl_citizen_school_assignment_raw_videos_2026_05_21";
const sourcePageUrl = "https://www.microsoft.com/en-us/research/project/asl-citizen/";
const sourceLicenseShortName = "ASL Citizen noncommercial school-assignment license";
const sourceAuthor = "Microsoft Research ASL Citizen contributors";
const minDownloadedPerType = 5;

function parseArgs(argv) {
  const args = {
    clips: defaultClipsPath,
    output: defaultOutputPath,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--clips" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_asl_citizen_non_target_negative_challenge_review_packet.mjs [--clips docs/research/asl-citizen-non-target-extracted-clips.json] [--output docs/review/asl-citizen-non-target-negative-challenge-review-packet.json]

Exports a visual-review packet for ASL Citizen non_target_asl_sign clips that
were range-extracted under the existing source-register decision
${sourceDecisionId}. The packet is review input only;
final source-register approval already exists, and final manifest generation is
a downstream gate.
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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function archiveBasename(archivePath) {
  const parts = archivePath.split("/");
  const last = parts[parts.length - 1] ?? archivePath;
  const dot = last.lastIndexOf(".");
  return dot > 0 ? last.slice(0, dot) : last;
}

function buildSourceFileUrl(archiveBaseUrl, archivePath) {
  if (!archiveBaseUrl) return null;
  return `${archiveBaseUrl}#${encodeURIComponent(archivePath)}`;
}

function buildClip(rawClip, index, archive) {
  const localPath = resolveProjectPath(rawClip.relative_video_path, `clips[${index}].relative_video_path`);
  if (!fs.existsSync(localPath)) {
    throw new Error(`local video missing: ${rawClip.relative_video_path}`);
  }
  const actualSha = sha256File(localPath);
  if (actualSha !== rawClip.sha256) {
    throw new Error(`sha256 mismatch for ${rawClip.relative_video_path}: expected ${rawClip.sha256}, got ${actualSha}`);
  }
  const archivePath = rawClip.source_archive_path;
  const candidateId = `asl-citizen-non-target-asl-sign-${String(index + 1).padStart(2, "0")}`;
  return {
    candidate_id: candidateId,
    challenge_type: challengeType,
    expected_outcome: "reject",
    source_id: sourceId,
    source_record_id: archivePath,
    source_page_url: sourcePageUrl,
    source_file_url: buildSourceFileUrl(archive?.url ?? null, archivePath),
    source_file_page_title: archiveBasename(archivePath),
    source_license_short_name: sourceLicenseShortName,
    source_author: sourceAuthor,
    source_credit: rawClip.label ?? "",
    local_video_path: rawClip.relative_video_path,
    downloaded: true,
    downloaded_sha256: rawClip.sha256,
    source_file_metadata: {
      license_short_name: sourceLicenseShortName,
      mime: "video/mp4",
      size_bytes: rawClip.size_bytes,
      source_sha256: rawClip.sha256,
      asl_citizen_label: rawClip.label,
      source_archive_path: archivePath,
      source_archive_local_header_offset: rawClip.source_archive_local_header_offset,
      source_archive_compressed_size: rawClip.source_archive_compressed_size,
      source_archive_uncompressed_size: rawClip.source_archive_uncompressed_size,
      source_archive_method: rawClip.source_archive_method,
      source_archive_crc32: rawClip.source_archive_crc32,
      source_archive_etag: archive?.etag ?? null,
      source_archive_last_modified: archive?.last_modified ?? null,
      source_archive_url: archive?.url ?? null,
    },
    selection_rationale: `ASL Citizen off-active-module sign clip for ${challengeType}; gloss "${rawClip.label}" is provably outside the 95-label PopSign-v1 active recognition module per docs/research/asl-citizen-non-target-extracted-clips.json selection.`,
    review: {
      status: "needs_visual_review",
      approved: false,
      reviewer: "",
      reviewed_at: "",
      challenge_type_matches_video: false,
      no_prompt_sign_present: false,
      expected_reject_outcome_confirmed: false,
      source_metadata_acceptable: false,
      rejection_reason: "",
      notes: "",
    },
  };
}

function buildPacket(args) {
  const extraction = readJson(args.clips);
  const blockers = [];
  if (extraction.status !== "extracted") {
    blockers.push(`extraction status is ${extraction.status}; expected extracted`);
  }
  if (extraction.source_register?.decision_id !== sourceDecisionId) {
    blockers.push(
      `extraction source-register decision_id is ${extraction.source_register?.decision_id ?? "<missing>"}; expected ${sourceDecisionId}`,
    );
  }
  const rawClips = Array.isArray(extraction.clips) ? extraction.clips : [];
  const clips = rawClips.map((clip, index) => buildClip(clip, index, extraction.archive));
  for (const clip of clips) {
    if (clip.challenge_type !== challengeType) {
      blockers.push(`${clip.candidate_id} challenge_type is ${clip.challenge_type}; expected ${challengeType}`);
    }
  }
  if (clips.length < minDownloadedPerType) {
    blockers.push(`packet needs at least ${minDownloadedPerType} downloaded ${challengeType} clips; found ${clips.length}`);
  }
  const status = blockers.length === 0 ? "needs_visual_review" : "blocked";
  return {
    schema_version: schemaVersion,
    status,
    evidence_mode: "external_source_candidate_visual_review",
    finality: "not_final_model_evidence",
    exported_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_asl_citizen_non_target_negative_challenge_review_packet.mjs",
        sha256: sha256File(
          path.join(root, "scripts", "export_asl_citizen_non_target_negative_challenge_review_packet.mjs"),
        ),
      },
    },
    extraction: {
      path: projectRelative(args.clips),
      sha256: sha256File(args.clips),
    },
    source_register: {
      source_id: sourceId,
      decision_id: sourceDecisionId,
    },
    reviewer: {
      name: "",
      role: "",
      qualification: "",
      affiliation_or_context: "",
      contact_or_signed_evidence: "",
      is_project_operator: true,
      reviewed_at: "",
    },
    review_instructions: [
      "Approve a clip only if the downloaded raw video matches the assigned challenge_type non_target_asl_sign (an off-active-module ASL sign).",
      "Approve a clip only if the gloss is provably outside the 95-label PopSign-v1 active recognition module.",
      "Reject clips that depict an active-module sign, ambiguous content, unavailable local video, or unacceptable source metadata.",
      "Do not redistribute the raw ASL Citizen videos, modified videos, extracted frames, or local mirrors; the approved source-register decision is local raw-RGB use only.",
    ],
    required_counts: {
      min_downloaded_per_type: minDownloadedPerType,
      required_types: [challengeType],
    },
    candidate_count: clips.length,
    downloaded_counts_by_type: { [challengeType]: clips.length },
    clips,
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const packet = buildPacket(args);
  writeJson(args.output, packet);
  console.log(
    JSON.stringify(
      {
        status: packet.status,
        output: projectRelative(args.output),
        candidate_count: packet.candidate_count,
        downloaded_counts_by_type: packet.downloaded_counts_by_type,
        blockers: packet.blockers,
      },
      null,
      2,
    ),
  );
  return packet.status === "needs_visual_review" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    `ASL Citizen non_target review packet export failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
}
