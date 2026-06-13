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
  "internet-archive-negative-challenge-candidates.json",
);
const defaultOutputPath = path.join(
  root,
  "docs",
  "research",
  "internet-archive-negative-challenge-downloads.json",
);
const candidateSchemaVersion = "asl-pilot-internet-archive-negative-challenge-candidates/v1";
const schemaVersion = "asl-pilot-internet-archive-negative-challenge-downloads/v1";
const sourceId = "internet-archive-negative-challenge-videos";
const expectedRawDirRelative = "data/external/internet-archive-negative-challenge-videos/raw/";

function parseArgs(argv) {
  const args = {
    candidates: defaultCandidatePath,
    output: defaultOutputPath,
    write: false,
    dryRun: false,
    delayMs: 3000,
    retries: 6,
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
  node scripts/download_internet_archive_negative_challenge_candidates.mjs --write [--max-new-downloads 1] [--candidates docs/research/internet-archive-negative-challenge-candidates.json] [--output docs/research/internet-archive-negative-challenge-downloads.json]

Downloads the approved Internet Archive negative-challenge candidate files into
ignored local raw-video storage and writes SHA-256 download evidence after
cross-checking each file against the IA-supplied source_md5. This does not
approve the files for the final manifest; visual review is still required.
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

function md5File(file) {
  const hash = crypto.createHash("md5");
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
  if (data.status !== "ready_for_download") {
    blockers.push("candidate status must be ready_for_download");
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
    if (candidate.rights_review_status !== "approved_pending_download") {
      blockers.push(`${context}.rights_review_status must be approved_pending_download`);
    }
    if (candidate.final_manifest_eligible !== false) {
      blockers.push(`${context}.final_manifest_eligible must be false before visual review`);
    }
    if (!isHttpsUrl(candidate.source_file_url)) {
      blockers.push(`${context}.source_file_url must be an https URL`);
    }
    if (typeof candidate.local_video_path_planned !== "string" || !candidate.local_video_path_planned.trim()) {
      blockers.push(`${context}.local_video_path_planned must be a non-empty project path`);
      continue;
    }
    if (!candidate.local_video_path_planned.startsWith(expectedRawDirRelative)) {
      blockers.push(`${context}.local_video_path_planned must live under ${expectedRawDirRelative}`);
    }
    try {
      resolveProjectPath(candidate.local_video_path_planned, `${context}.local_video_path_planned`);
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
    const expectedMd5 = candidate.source_file_metadata?.source_md5;
    if (typeof expectedMd5 !== "string" || !/^[0-9a-f]{32}$/i.test(expectedMd5)) {
      blockers.push(`${context}.source_file_metadata.source_md5 must be a 32-char hex digest from IA metadata`);
    }
  }
  return blockers;
}

async function downloadFileOnce(url, destination) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "asl-pilot-internet-archive-negative-challenge-downloader/1.0",
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
  const localPath = resolveProjectPath(candidate.local_video_path_planned, "local_video_path_planned");
  const expectedMd5 = candidate.source_file_metadata?.source_md5?.toLowerCase() ?? null;
  const expectedSize = candidate.source_file_metadata?.size_bytes ?? null;
  const blockers = [];

  if (!dryRun && !fs.existsSync(localPath)) {
    process.stdout.write(`download: ${candidate.candidate_id} -> ${projectRelative(localPath)} ... `);
    await downloadFile(candidate.source_file_url, localPath, retries, maxRetryAfterMs);
    process.stdout.write("ok\n");
  } else if (!dryRun) {
    process.stdout.write(`skip:     ${candidate.candidate_id} already exists at ${projectRelative(localPath)}\n`);
  }

  const exists = fs.existsSync(localPath);
  const sizeBytes = exists ? fs.statSync(localPath).size : null;
  let localMd5 = null;
  let localSha256 = null;
  let md5Match = null;
  if (exists) {
    localMd5 = md5File(localPath);
    localSha256 = sha256File(localPath);
    md5Match = expectedMd5 !== null && localMd5.toLowerCase() === expectedMd5;
    if (!md5Match) {
      blockers.push(
        `${candidate.candidate_id} md5 mismatch; expected ${expectedMd5}, got ${localMd5}; deleting local file so a retry can re-download`,
      );
      try {
        fs.rmSync(localPath, { force: true });
      } catch {
        // ignore cleanup failures; the blocker is already recorded
      }
    }
    if (expectedSize !== null && sizeBytes !== expectedSize) {
      blockers.push(
        `${candidate.candidate_id} downloaded size mismatch; expected ${expectedSize}, got ${sizeBytes}`,
      );
    }
  }

  return {
    record: {
      candidate_id: candidate.candidate_id,
      challenge_type: candidate.challenge_type,
      expected_outcome: candidate.expected_outcome,
      review_status: candidate.review_status,
      rights_review_status: candidate.rights_review_status,
      final_manifest_eligible: false,
      source_record_id: candidate.source_record_id,
      source_page_url: candidate.source_page_url,
      source_file_url: candidate.source_file_url,
      source_license_short_name: candidate.source_license_short_name,
      source_licenseurl: candidate.source_licenseurl,
      source_author: candidate.source_author,
      source_credit: candidate.source_credit,
      local_video_path: projectRelative(localPath),
      exists: exists && md5Match !== false,
      size_bytes: sizeBytes,
      md5: localMd5,
      md5_match: md5Match,
      sha256: md5Match === false ? null : localSha256,
      source_file_metadata: {
        ...candidate.source_file_metadata,
        source_sha256: md5Match === false ? null : localSha256,
      },
    },
    blockers,
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
        const localPath = resolveProjectPath(candidate.local_video_path_planned, "local_video_path_planned");
        const existedBefore = fs.existsSync(localPath);
        const sourceSha256Already = typeof candidate.source_file_metadata?.source_sha256 === "string"
          && candidate.source_file_metadata.source_sha256.length > 0;
        if (sourceSha256Already && existedBefore) {
          process.stdout.write(`skip:     ${candidate.candidate_id} source_sha256 already populated and file exists; recording current evidence\n`);
        }
        const shouldDownload =
          !args.dryRun
          && !existedBefore
          && (
            args.maxNewDownloads === null
            || newDownloadAttempts < args.maxNewDownloads
          );
        if (shouldDownload) newDownloadAttempts += 1;
        const result = await ensureDownloaded(
          candidate,
          args.dryRun || !shouldDownload,
          args.retries,
          args.maxRetryAfterMs,
        );
        downloads.push(result.record);
        blockers.push(...result.blockers);
        if (!result.record.exists) {
          blockers.push(`${candidate.candidate_id} was not downloaded or failed integrity check`);
        }
        if (!existedBefore && result.record.exists) newDownloads += 1;
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
        path: "scripts/download_internet_archive_negative_challenge_candidates.mjs",
        sha256: sha256File(path.join(root, "scripts", "download_internet_archive_negative_challenge_candidates.mjs")),
      },
    },
    candidate_pool: {
      path: projectRelative(args.candidates),
      sha256: sha256File(args.candidates),
    },
    source_id: sourceId,
    source_scope: "negative_challenge_validation_candidates_only",
    new_downloads: newDownloads,
    downloaded_count: downloads.filter((item) => item.exists).length,
    downloads,
    blockers,
    next_steps: [
      "Run this script with --max-new-downloads 1 per attempt until all 7 IA candidates have md5_match true.",
      "Update docs/research/internet-archive-negative-challenge-candidates.json source_sha256 fields from this evidence in a follow-up slice.",
      "Update docs/research/internet-archive-negative-challenge-external-rights-review-receipt.json local_sha256 entries from this evidence in the same follow-up slice.",
      "Add docs/model/dataset-source-register.json entry decision_id=approved_internet_archive_negative_challenge_exact_files_2026_05_25 only after local SHA-256 evidence exists.",
      "Generate contact sheets and visual observations before any IA clip enters data/manifests/negative-challenge.json.",
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
    new_downloads: evidence.new_downloads,
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
    console.error(`Internet Archive candidate download failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
