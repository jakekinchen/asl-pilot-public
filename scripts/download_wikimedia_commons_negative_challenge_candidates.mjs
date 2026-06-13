import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pipeline } from "node:stream/promises";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatePath = path.join(
  root,
  "docs",
  "research",
  "wikimedia-commons-negative-challenge-candidates.json",
);
const defaultOutputPath = path.join(
  root,
  "docs",
  "research",
  "wikimedia-commons-negative-challenge-downloads.json",
);
const candidateSchemaVersion = "asl-pilot-wikimedia-commons-negative-challenge-candidates/v1";
const schemaVersion = "asl-pilot-wikimedia-commons-negative-challenge-downloads/v1";
const sourceId = "wikimedia-commons-negative-challenge-videos";

function parseArgs(argv) {
  const args = {
    candidates: defaultCandidatePath,
    output: defaultOutputPath,
    write: false,
    dryRun: false,
    delayMs: 1500,
    retries: 5,
    maxNewDownloads: null,
    maxRetryAfterMs: 15000,
  };
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
    if (item === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (item === "--candidates" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    if (item === "--delay-ms" || item === "--retries" || item === "--max-new-downloads" || item === "--max-retry-after-ms") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${item} must be a non-negative integer`);
      if (item === "--delay-ms") args.delayMs = parsed;
      if (item === "--retries") args.retries = parsed;
      if (item === "--max-new-downloads") args.maxNewDownloads = parsed;
      if (item === "--max-retry-after-ms") args.maxRetryAfterMs = parsed;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/download_wikimedia_commons_negative_challenge_candidates.mjs --write [--max-new-downloads 3] [--candidates docs/research/wikimedia-commons-negative-challenge-candidates.json] [--output docs/research/wikimedia-commons-negative-challenge-downloads.json]

Downloads the current Wikimedia Commons negative-challenge candidate files into
ignored local raw-video storage and writes SHA-256 download evidence. This does
not approve the files for the final manifest.
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
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(file);
  hash.update(data);
  return hash.digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpsUrl(value) {
  return typeof value === "string" && value.startsWith("https://");
}

function validateCandidateFile(data) {
  const blockers = [];
  if (data.schema_version !== candidateSchemaVersion) {
    blockers.push(`candidate schema_version must be ${candidateSchemaVersion}`);
  }
  if (data.status !== "ready_for_visual_review") {
    blockers.push("candidate status must be ready_for_visual_review");
  }
  if (data.finality !== "not_final_model_evidence") {
    blockers.push("candidate finality must be not_final_model_evidence");
  }
  if (data.source_id !== sourceId) {
    blockers.push(`candidate source_id must be ${sourceId}`);
  }
  if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
    blockers.push("candidate file must include candidates");
  }
  for (const [index, candidate] of (data.candidates ?? []).entries()) {
    const context = `candidates[${index}]`;
    if (candidate.review_status !== "needs_visual_review") {
      blockers.push(`${context}.review_status must be needs_visual_review before download`);
    }
    if (candidate.final_manifest_eligible !== false) {
      blockers.push(`${context}.final_manifest_eligible must be false before final review`);
    }
    if (!isHttpsUrl(candidate.source_file_url)) {
      blockers.push(`${context}.source_file_url must be an https URL`);
    }
    if (typeof candidate.suggested_local_video_path !== "string" || !candidate.suggested_local_video_path.trim()) {
      blockers.push(`${context}.suggested_local_video_path must be a non-empty project path`);
      continue;
    }
    try {
      resolveProjectPath(candidate.suggested_local_video_path, `${context}.suggested_local_video_path`);
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
  }
  return blockers;
}

async function downloadFileOnce(url, destination) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "asl-pilot-wikimedia-negative-challenge-downloader/1.0",
    },
  });
  if (!response.ok || !response.body) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null;
    throw error;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const tempPath = `${destination}.tmp`;
  await pipeline(response.body, fs.createWriteStream(tempPath));
  fs.renameSync(tempPath, destination);
}

async function downloadFile(url, destination, retries, maxRetryAfterMs) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await downloadFileOnce(url, destination);
      return;
    } catch (error) {
      if (fs.existsSync(`${destination}.tmp`)) fs.rmSync(`${destination}.tmp`, { force: true });
      const retryable = error?.status === 429 || (error?.status >= 500 && error?.status <= 599);
      if (!retryable || attempt === retries) throw error;
      const backoffMs = Math.min(
        maxRetryAfterMs,
        error.retryAfterMs ?? Math.min(60000, 5000 * (attempt + 1)),
      );
      await sleep(backoffMs);
    }
  }
}

async function ensureDownloaded(candidate, dryRun, retries, maxRetryAfterMs) {
  const localPath = resolveProjectPath(candidate.suggested_local_video_path, "suggested_local_video_path");
  if (!dryRun && !fs.existsSync(localPath)) {
    await downloadFile(candidate.source_file_url, localPath, retries, maxRetryAfterMs);
  }
  const exists = fs.existsSync(localPath);
  const sizeBytes = exists ? fs.statSync(localPath).size : null;
  const sha256 = exists ? sha256File(localPath) : null;
  return {
    candidate_id: candidate.candidate_id,
    challenge_type: candidate.challenge_type,
    expected_outcome: candidate.expected_outcome,
    review_status: candidate.review_status,
    final_manifest_eligible: false,
    source_record_id: candidate.source_record_id,
    source_file_page_title: candidate.source_file_page_title,
    source_page_url: candidate.source_page_url,
    source_file_url: candidate.source_file_url,
    source_license_short_name: candidate.source_license_short_name,
    source_author: candidate.source_author,
    local_video_path: projectRelative(localPath),
    exists,
    size_bytes: sizeBytes,
    sha256,
    source_file_metadata: {
      ...candidate.source_file_metadata,
      source_sha256: sha256,
    },
  };
}

async function buildDownloadEvidence(args) {
  const blockers = [];
  const candidates = readJson(args.candidates);
  blockers.push(...validateCandidateFile(candidates));
  const downloads = [];
  let newDownloads = 0;
  let newDownloadAttempts = 0;
  if (blockers.length === 0) {
    for (const [index, candidate] of candidates.candidates.entries()) {
      try {
        const localPath = resolveProjectPath(candidate.suggested_local_video_path, "suggested_local_video_path");
        const existedBefore = fs.existsSync(localPath);
        const shouldDownload =
          !args.dryRun
          && !existedBefore
          && (
            args.maxNewDownloads === null
            || newDownloadAttempts < args.maxNewDownloads
          );
        if (shouldDownload) newDownloadAttempts += 1;
        const download = await ensureDownloaded(
          candidate,
          args.dryRun || !shouldDownload,
          args.retries,
          args.maxRetryAfterMs,
        );
        downloads.push(download);
        if (!download.exists) {
          blockers.push(`${candidate.candidate_id} was not downloaded`);
        } else if (download.size_bytes !== candidate.source_file_metadata?.size_bytes) {
          blockers.push(
            `${candidate.candidate_id} downloaded size mismatch; expected ${candidate.source_file_metadata?.size_bytes}, got ${download.size_bytes}`,
          );
        }
        if (!existedBefore && download.exists) newDownloads += 1;
      } catch (error) {
        blockers.push(`${candidate.candidate_id} download failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (!args.dryRun && args.delayMs > 0 && index < candidates.candidates.length - 1) {
        await sleep(args.delayMs);
      }
    }
  }
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "downloaded" : "blocked",
    evidence_mode: "source_download_hashes",
    finality: "not_final_model_evidence",
    downloaded_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/download_wikimedia_commons_negative_challenge_candidates.mjs",
        sha256: sha256File(path.join(root, "scripts", "download_wikimedia_commons_negative_challenge_candidates.mjs")),
      },
    },
    candidate_pool: {
      path: projectRelative(args.candidates),
      sha256: sha256File(args.candidates),
    },
    source_id: sourceId,
    source_scope: "negative_challenge_validation_candidates_only",
    downloaded_count: downloads.filter((item) => item.exists).length,
    downloads,
    blockers,
    next_steps: [
      "Visually review each downloaded video for the assigned challenge type.",
      "Reject or replace weak candidates before source-register approval.",
      "Create an exact-file source-rights review receipt for approved downloads.",
      "Generate data/manifests/negative-challenge.json only from approved downloads.",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.write && !args.dryRun) {
    throw new Error("Use --write to download files and write evidence, or --dry-run to validate only");
  }
  const evidence = await buildDownloadEvidence(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: evidence.status,
    wrote: args.write,
    output: projectRelative(args.output),
    source_id: evidence.source_id,
    downloaded_count: evidence.downloaded_count,
    blockers: evidence.blockers,
  }, null, 2));
  return evidence.status === "downloaded" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Wikimedia Commons candidate download failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
