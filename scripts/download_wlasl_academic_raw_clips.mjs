import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pipeline } from "node:stream/promises";

const root = path.resolve(import.meta.dirname, "..");
const defaultProbePath = path.join(root, "docs", "research", "wlasl-academic-raw-url-probe.json");
const defaultOutputPath = path.join(root, "docs", "research", "wlasl-academic-selected-raw-clip-import.json");
const rawRoot = path.join(root, "data", "external", "wlasl", "raw");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const schemaVersion = "asl-pilot-wlasl-academic-selected-raw-clip-import/v1";

function parseArgs(argv) {
  const args = {
    write: false,
    probe: defaultProbePath,
    output: defaultOutputPath,
    maxClips: 58,
    timeoutMs: 30000,
    maxBytesPerClip: 150 * 1024 * 1024,
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
    if (item === "--probe") {
      args.probe = resolveProjectPath(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--output") {
      args.output = resolveProjectPath(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--max-clips") {
      args.maxClips = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--timeout-ms") {
      args.timeoutMs = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--max-bytes-per-clip") {
      args.maxBytesPerClip = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/download_wlasl_academic_raw_clips.mjs --write [--max-clips 58]

Downloads selected WLASL raw video candidates from the academic URL probe into
ignored data/external/wlasl/raw/. Writes a provenance manifest. This does not
write training manifests, train weights, promote a model, or redistribute media.
`);
}

function parsePositiveInteger(value, context) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${context}`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${context} must be a positive integer`);
  return parsed;
}

function resolveProjectPath(value, context) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${context}`);
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
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

function fileState(file) {
  if (!fs.existsSync(file)) {
    return { exists: false, path: projectRelative(file), size_bytes: 0, sha256: null };
  }
  const stats = fs.statSync(file);
  return {
    exists: true,
    path: projectRelative(file),
    size_bytes: stats.size,
    sha256: sha256File(file),
  };
}

function safeSegment(value) {
  return String(value ?? "unknown").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function extensionFromUrl(url) {
  const match = String(url).match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
  const ext = match?.[1]?.toLowerCase();
  return ["mp4", "mov", "webm", "m4v"].includes(ext) ? ext : "mp4";
}

function sourceDecision() {
  const register = readJson(sourceRegisterPath);
  const source = (register.sources ?? []).find((item) => item?.source_id === "wlasl-school-assignment-raw-videos");
  return source
    ? {
        source_id: source.source_id,
        decision_id: source.decision_id,
        license_review_status: source.license_review_status,
        allowed_for_model_training: source.allowed_for_model_training,
        allowed_for_validation: source.allowed_for_validation,
        allowed_for_pilot_submission: source.allowed_for_pilot_submission,
      }
    : null;
}

function selectedCandidates(probe, maxClips) {
  const seen = new Set();
  const selected = [];
  for (const candidate of probe.available_candidates ?? []) {
    if (!candidate?.url || seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    selected.push(candidate);
    if (selected.length >= maxClips) break;
  }
  return selected;
}

async function requestWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "asl-pilot-academic-raw-clip-import/1.0",
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadCandidate(candidate, args) {
  const labelDir = path.join(rawRoot, safeSegment(candidate.label_id));
  const ext = extensionFromUrl(candidate.url);
  const filename = `${safeSegment(candidate.label_id)}_${safeSegment(candidate.video_id)}_${safeSegment(candidate.source)}.${ext}`;
  const target = path.join(labelDir, filename);
  fs.mkdirSync(labelDir, { recursive: true });
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    return {
      ...candidate,
      local_file: fileState(target),
      download_status: "already_present",
    };
  }
  const response = await requestWithTimeout(candidate.url, { method: "GET" }, args.timeoutMs);
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
  if (!response.ok) {
    return {
      ...candidate,
      local_file: { exists: false, path: projectRelative(target), size_bytes: 0, sha256: null },
      download_status: "failed",
      failure: `HTTP ${response.status}`,
    };
  }
  if (Number.isFinite(contentLength) && contentLength > args.maxBytesPerClip) {
    return {
      ...candidate,
      local_file: { exists: false, path: projectRelative(target), size_bytes: 0, sha256: null },
      download_status: "skipped_too_large",
      content_length: contentLength,
      max_bytes_per_clip: args.maxBytesPerClip,
    };
  }
  const temp = `${target}.tmp`;
  await pipeline(response.body, fs.createWriteStream(temp, { flags: "w" }));
  fs.renameSync(temp, target);
  return {
    ...candidate,
    local_file: fileState(target),
    download_status: "downloaded",
    content_type: response.headers.get("content-type"),
    content_length: contentLength || null,
  };
}

async function buildManifest(args) {
  const probe = readJson(args.probe);
  const source = sourceDecision();
  const blockers = [];
  if (probe.status !== "available_raw_url_candidates_found") {
    blockers.push("WLASL academic raw URL probe has no available candidates");
  }
  if (!source) {
    blockers.push("source register is missing wlasl-school-assignment-raw-videos");
  } else if (
    source.allowed_for_model_training !== true ||
    source.allowed_for_validation !== true ||
    source.allowed_for_pilot_submission !== true
  ) {
    blockers.push("wlasl-school-assignment-raw-videos is not approved for the current academic path");
  }
  const candidates = blockers.length === 0 ? selectedCandidates(probe, args.maxClips) : [];
  const clips = [];
  for (const candidate of candidates) {
    clips.push(await downloadCandidate(candidate, args));
  }
  const importedClips = clips.filter((clip) => (
    (clip.download_status === "downloaded" || clip.download_status === "already_present") &&
    clip.local_file?.exists === true
  ));
  if (blockers.length === 0 && importedClips.length === 0) {
    blockers.push("no selected WLASL raw clips were downloaded or found locally");
  }
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "selected_raw_clips_imported" : "blocked",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/download_wlasl_academic_raw_clips.mjs",
        sha256: sha256File(path.join(root, "scripts", "download_wlasl_academic_raw_clips.mjs")),
      },
    },
    decision_boundary: {
      downloads_selected_raw_videos_to_ignored_external_path: true,
      changes_training_data_manifests: false,
      trains_or_promotes_model: false,
      redistributes_media: false,
    },
    assignment_scope: {
      mode: "noncommercial_school_assignment",
      source_id: "wlasl-school-assignment-raw-videos",
      raw_video_only: true,
      local_raw_root: projectRelative(rawRoot),
    },
    inputs: {
      probe: fileState(args.probe),
      source_register: fileState(sourceRegisterPath),
    },
    source_register_decision: source,
    config: {
      max_clips: args.maxClips,
      timeout_ms: args.timeoutMs,
      max_bytes_per_clip: args.maxBytesPerClip,
    },
    summary: {
      selected_candidate_count: candidates.length,
      imported_clip_count: importedClips.length,
      downloaded_count: clips.filter((clip) => clip.download_status === "downloaded").length,
      already_present_count: clips.filter((clip) => clip.download_status === "already_present").length,
      failed_count: clips.filter((clip) => clip.download_status === "failed").length,
      skipped_too_large_count: clips.filter((clip) => clip.download_status === "skipped_too_large").length,
      label_count: new Set(importedClips.map((clip) => clip.label_id)).size,
      total_bytes: importedClips.reduce((total, clip) => total + (clip.local_file?.size_bytes ?? 0), 0),
    },
    clips,
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const manifest = await buildManifest(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: manifest.status,
    wrote: args.write,
    output: projectRelative(args.output),
    imported_clip_count: manifest.summary.imported_clip_count,
    label_count: manifest.summary.label_count,
    total_bytes: manifest.summary.total_bytes,
    blockers: manifest.blockers,
  }, null, 2));
  return manifest.status === "selected_raw_clips_imported" ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`WLASL academic raw clip download failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
