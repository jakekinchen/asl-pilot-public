import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatePath = path.join(root, "docs", "research", "ms-asl-pruned-vocabulary-candidate.json");
const defaultMetadataDir = path.join(root, "artifacts", "dataset-research", "ms-asl", "extracted", "MS-ASL");
const defaultOutputPath = path.join(root, "docs", "research", "ms-asl-pruned-vocabulary-availability-probe.json");

function parseArgs(argv) {
  const args = {
    candidate: defaultCandidatePath,
    metadataDir: defaultMetadataDir,
    output: defaultOutputPath,
    concurrency: 8,
    timeoutMs: 15000,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--candidate") {
      args.candidate = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--metadata-dir") {
      args.metadataDir = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--concurrency") {
      args.concurrency = readPositiveInteger(argv, ++index, item);
      if (args.concurrency < 1) throw new Error("--concurrency must be at least 1");
    } else if (item === "--timeout-ms") {
      args.timeoutMs = readPositiveInteger(argv, ++index, item);
      if (args.timeoutMs < 1000) throw new Error("--timeout-ms must be at least 1000");
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/probe_msasl_candidate_availability.mjs [--write]

Probes current public availability for every unique YouTube video ID referenced
by docs/research/ms-asl-pruned-vocabulary-candidate.json. This is a
research-only network probe and downloads no video bytes.
`);
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function readPositiveInteger(argv, index, flag) {
  const value = Number.parseInt(readValue(argv, index, flag), 10);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${flag} must be a non-negative integer`);
  return value;
}

function resolveProjectPath(value, context) {
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

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) return null;
  const trimmed = rawUrl.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function parseYouTubeId(rawUrl) {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host.endsWith(".youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const embedMatch = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
      if (embedMatch) return embedMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

function canonicalYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function pickRowsForCandidate(candidate, metadataDir) {
  const selectedByLabel = new Map(candidate.selected.map((item) => [item.msasl_label, item]));
  const splitFiles = {
    train: path.join(metadataDir, "MSASL_train.json"),
    validation: path.join(metadataDir, "MSASL_val.json"),
    test: path.join(metadataDir, "MSASL_test.json"),
  };
  const rows = [];
  for (const [split, file] of Object.entries(splitFiles)) {
    const splitRows = readJson(file);
    for (const [index, row] of splitRows.entries()) {
      const selected = selectedByLabel.get(row.label);
      if (!selected) continue;
      const videoId = parseYouTubeId(row.url);
      rows.push({
        split,
        source_index: index,
        asl_pilot_label_id: selected.asl_pilot_label_id,
        msasl_label: row.label,
        msasl_text: row.text,
        signer_id: row.signer_id,
        url: normalizeUrl(row.url),
        video_id: videoId,
        start_time: row.start_time,
        end_time: row.end_time,
      });
    }
  }
  return { rows, splitFiles };
}

async function probeVideo(videoId, timeoutMs) {
  if (!videoId) {
    return {
      availability_status: "invalid_url",
      downloaded_video_bytes: 0,
    };
  }
  const url = canonicalYouTubeUrl(videoId);
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(endpoint, {
      headers: { "user-agent": "asl-pilot-msasl-availability-probe/1.0" },
      signal: controller.signal,
    });
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        availability_status: "not_public_or_unavailable",
        http_status: response.status,
        elapsed_ms: elapsedMs,
        downloaded_video_bytes: 0,
      };
    }
    const body = await response.json();
    return {
      availability_status: "public_oembed",
      http_status: response.status,
      elapsed_ms: elapsedMs,
      title: body.title,
      author_name: body.author_name,
      provider_name: body.provider_name,
      downloaded_video_bytes: 0,
    };
  } catch (error) {
    return {
      availability_status: error?.name === "AbortError" ? "probe_timeout" : "probe_error",
      error_message: error instanceof Error ? error.message : String(error),
      elapsed_ms: Date.now() - startedAt,
      downloaded_video_bytes: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function loop() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, loop));
  return results;
}

function increment(map, key, amount = 1) {
  map[key] = (map[key] ?? 0) + amount;
}

function summarizeRows(rows, probesByVideoId) {
  const bySplit = {};
  const byLabel = {};
  for (const row of rows) {
    const probe = probesByVideoId.get(row.video_id) ?? { availability_status: "invalid_url" };
    const isPublic = probe.availability_status === "public_oembed";
    if (!bySplit[row.split]) {
      bySplit[row.split] = {
        rows: 0,
        public_rows: 0,
        not_public_or_unavailable_rows: 0,
        invalid_or_error_rows: 0,
        unique_video_ids: new Set(),
        public_video_ids: new Set(),
      };
    }
    const splitSummary = bySplit[row.split];
    splitSummary.rows += 1;
    if (row.video_id) splitSummary.unique_video_ids.add(row.video_id);
    if (isPublic) {
      splitSummary.public_rows += 1;
      splitSummary.public_video_ids.add(row.video_id);
    } else if (probe.availability_status === "not_public_or_unavailable") {
      splitSummary.not_public_or_unavailable_rows += 1;
    } else {
      splitSummary.invalid_or_error_rows += 1;
    }

    const labelKey = row.asl_pilot_label_id;
    if (!byLabel[labelKey]) {
      byLabel[labelKey] = {
        msasl_label: row.msasl_label,
        rows: 0,
        public_rows: 0,
        splits: {},
      };
    }
    const labelSummary = byLabel[labelKey];
    labelSummary.rows += 1;
    if (isPublic) labelSummary.public_rows += 1;
    if (!labelSummary.splits[row.split]) {
      labelSummary.splits[row.split] = { rows: 0, public_rows: 0 };
    }
    labelSummary.splits[row.split].rows += 1;
    if (isPublic) labelSummary.splits[row.split].public_rows += 1;
  }
  for (const summary of Object.values(bySplit)) {
    summary.unique_video_ids = summary.unique_video_ids.size;
    summary.public_video_ids = summary.public_video_ids.size;
  }
  for (const summary of Object.values(byLabel)) {
    summary.public_row_rate = summary.rows === 0 ? 0 : summary.public_rows / summary.rows;
  }
  return { bySplit, byLabel };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const candidate = readJson(args.candidate);
  if (candidate.schema_version !== "asl-pilot-msasl-pruned-vocabulary-candidate/v1") {
    throw new Error(`${projectRelative(args.candidate)} is not an MS-ASL pruned vocabulary candidate`);
  }
  const { rows, splitFiles } = pickRowsForCandidate(candidate, args.metadataDir);
  const uniqueVideoIds = [...new Set(rows.map((row) => row.video_id).filter(Boolean))].sort();
  const invalidUrlRows = rows.filter((row) => !row.video_id);
  const probeResults = await runPool(
    uniqueVideoIds,
    async (videoId) => ({
      video_id: videoId,
      canonical_url: canonicalYouTubeUrl(videoId),
      ...(await probeVideo(videoId, args.timeoutMs)),
    }),
    args.concurrency,
  );
  const probesByVideoId = new Map(probeResults.map((item) => [item.video_id, item]));
  const statusCounts = {};
  for (const item of probeResults) increment(statusCounts, item.availability_status);
  if (invalidUrlRows.length > 0) increment(statusCounts, "invalid_url", invalidUrlRows.length);
  const rowSummary = summarizeRows(rows, probesByVideoId);
  const output = {
    schema_version: "asl-pilot-msasl-pruned-vocabulary-availability-probe/v1",
    checked_at: new Date().toISOString(),
    evidence_mode: "research_only_not_training_data",
    finality: "availability_probe_not_source_register_approval",
    generated_by: "scripts/probe_msasl_candidate_availability.mjs",
    probe_method: {
      name: "youtube_oembed_no_video_download",
      endpoint: "https://www.youtube.com/oembed",
      timeout_ms: args.timeoutMs,
      concurrency: args.concurrency,
      downloaded_video_bytes: 0,
      limitation: "oEmbed confirms currently public embeddable metadata, not final downloadable clip rights or full media integrity.",
    },
    inputs: {
      candidate: {
        path: projectRelative(args.candidate),
        sha256: sha256File(args.candidate),
      },
      metadata_dir: projectRelative(args.metadataDir),
      msasl_splits: Object.fromEntries(
        Object.entries(splitFiles).map(([split, file]) => [split, { path: projectRelative(file), sha256: sha256File(file) }]),
      ),
    },
    summary: {
      selected_labels: candidate.summary.selected_labels,
      candidate_rows: rows.length,
      invalid_url_rows: invalidUrlRows.length,
      unique_video_ids: uniqueVideoIds.length,
      unique_video_status_counts: statusCounts,
      row_coverage: {
        public_rows: rows.filter((row) => probesByVideoId.get(row.video_id)?.availability_status === "public_oembed").length,
        total_rows: rows.length,
      },
      downloaded_video_bytes: 0,
    },
    split_summary: rowSummary.bySplit,
    label_summary: rowSummary.byLabel,
    video_probes: probeResults,
    invalid_url_rows: invalidUrlRows,
    decision: {
      status: "candidate_not_approved_for_training",
      reason: "This probe establishes current oEmbed visibility for the pruned MS-ASL candidate, but does not approve source rights, raw-video downloadability, clip integrity, or manifest import.",
    },
  };
  output.summary.row_coverage.public_row_rate =
    output.summary.row_coverage.total_rows === 0
      ? 0
      : output.summary.row_coverage.public_rows / output.summary.row_coverage.total_rows;

  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, serialized);
    console.log(JSON.stringify({ status: "written", output: projectRelative(args.output), sha256: sha256File(args.output), summary: output.summary }, null, 2));
  } else {
    process.stdout.write(serialized);
  }
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`MS-ASL availability probe failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
