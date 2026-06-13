import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatesPath = path.join(
  root,
  "docs",
  "research",
  "cira-negative-challenge-candidates.json",
);
const defaultDownloadsPath = path.join(
  root,
  "docs",
  "research",
  "cira-negative-challenge-downloads.json",
);
const defaultOutputPath = path.join(
  root,
  "docs",
  "review",
  "cira-negative-challenge-review-packet.json",
);
const schemaVersion = "asl-pilot-cira-negative-challenge-review-packet/v1";
const requiredTypes = ["empty_camera", "low_light", "off_center"];
const minApprovedPerType = 5;

function parseArgs(argv) {
  const args = {
    candidates: defaultCandidatesPath,
    downloads: defaultDownloadsPath,
    output: defaultOutputPath,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--candidates" || item === "--downloads" || item === "--output") {
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
  node scripts/export_cira_negative_challenge_review_packet.mjs [--candidates docs/research/cira-negative-challenge-candidates.json] [--downloads docs/research/cira-negative-challenge-downloads.json] [--output docs/review/cira-negative-challenge-review-packet.json]

Exports a visual-review packet for CIRA Satellite Library empty_camera,
low_light, and off_center negative challenge candidates. The packet is input to
review only; it is not final source approval or model evidence.
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

function countsByType(items, predicate) {
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const item of items) {
    if (requiredTypes.includes(item.challenge_type) && predicate(item)) {
      counts[item.challenge_type] += 1;
    }
  }
  return counts;
}

function buildPacket(args) {
  const candidates = readJson(args.candidates);
  const downloads = fs.existsSync(args.downloads) ? readJson(args.downloads) : null;
  const downloadByCandidate = new Map(
    Array.isArray(downloads?.downloads)
      ? downloads.downloads.map((download) => [download.candidate_id, download])
      : [],
  );
  const clips = (candidates.candidates ?? []).map((candidate) => {
    const download = downloadByCandidate.get(candidate.candidate_id) ?? null;
    const downloaded = download?.exists === true;
    return {
      candidate_id: candidate.candidate_id,
      challenge_type: candidate.challenge_type,
      expected_outcome: "reject",
      source_record_id: candidate.source_record_id,
      source_page_url: candidate.source_page_url,
      source_file_url: candidate.source_file_url,
      source_file_page_title: candidate.source_file_page_title,
      source_download_label: candidate.source_download_label,
      source_license_short_name: candidate.source_license_short_name,
      source_author: candidate.source_author,
      source_credit: candidate.source_credit ?? null,
      local_video_path: download?.local_video_path ?? candidate.suggested_local_video_path,
      downloaded,
      downloaded_sha256: download?.sha256 ?? null,
      source_file_metadata: download?.source_file_metadata ?? candidate.source_file_metadata,
      selection_rationale: candidate.selection_rationale,
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
  });
  const downloadedCounts = countsByType(clips, (clip) => clip.downloaded);
  const blockers = [];
  for (const type of requiredTypes) {
    if (downloadedCounts[type] < minApprovedPerType) {
      blockers.push(`review packet cannot be completed for ${type}: downloaded ${downloadedCounts[type]} of ${minApprovedPerType}`);
    }
  }
  return {
    schema_version: schemaVersion,
    status: "needs_visual_review",
    evidence_mode: "external_source_candidate_visual_review",
    finality: "not_final_model_evidence",
    exported_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_cira_negative_challenge_review_packet.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_cira_negative_challenge_review_packet.mjs")),
      },
    },
    candidates: {
      path: projectRelative(args.candidates),
      sha256: sha256File(args.candidates),
    },
    downloads: {
      path: projectRelative(args.downloads),
      exists: fs.existsSync(args.downloads),
      sha256: fs.existsSync(args.downloads) ? sha256File(args.downloads) : null,
      status: downloads?.status ?? null,
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
      "Approve a clip only if the downloaded raw video matches the assigned challenge_type.",
      "Approve a clip only if no prompted ASL sign is present and the expected outcome should be reject.",
      "Reject clips with visible prompt-like signing, ambiguous challenge type, unavailable local video, or unacceptable source metadata.",
      "Do not use this packet as final source-register approval; exact-file rights review and final manifest generation are separate gates.",
    ],
    required_counts: {
      min_approved_per_type: minApprovedPerType,
      required_types: requiredTypes,
    },
    candidate_count: clips.length,
    downloaded_counts_by_type: downloadedCounts,
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
  console.log(JSON.stringify({
    status: packet.status,
    output: projectRelative(args.output),
    candidate_count: packet.candidate_count,
    downloaded_counts_by_type: packet.downloaded_counts_by_type,
    blockers: packet.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`CIRA review packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
