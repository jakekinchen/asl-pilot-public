import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "research", "wlasl-academic-raw-url-probe.json");
const importPlanPath = path.join(root, "docs", "research", "noncommercial-academic-dataset-import-plan.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const wlaslMetadataPath = path.join(root, "data", "external", "wlasl", "metadata", "WLASL_v0.3.json");
const schemaVersion = "asl-pilot-wlasl-academic-raw-url-probe/v1";

function parseArgs(argv) {
  const args = {
    write: false,
    output: defaultOutputPath,
    maxLabels: 20,
    candidatesPerLabel: 3,
    timeoutMs: 6000,
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
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = resolveProjectPath(value, "--output");
      index += 1;
      continue;
    }
    if (item === "--max-labels") {
      args.maxLabels = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--candidates-per-label") {
      args.candidatesPerLabel = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--timeout-ms") {
      args.timeoutMs = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/probe_wlasl_academic_raw_urls.mjs [--write] [--output docs/research/wlasl-academic-raw-url-probe.json] [--max-labels 20] [--candidates-per-label 3]

Probes WLASL exact-overlap direct video URLs for the noncommercial school
assignment path. This script does not download clips, import media, write
manifests, train weights, or use WLASL metadata fields as recognition inputs.
It performs HEAD requests and, when needed, a one-byte range probe.
`);
}

function parsePositiveInteger(value, context) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${context}`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${context} must be a positive integer`);
  return parsed;
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

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
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

function normalizeLabel(value) {
  return String(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    label_id: match[1],
    display_text: match[2],
    normalized: normalizeLabel(match[1]),
  }));
}

function sourceDecision(register) {
  const source = (register?.sources ?? []).find((item) => item?.source_id === "wlasl-school-assignment-raw-videos");
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

function classifyUrl(url) {
  const lower = String(url).toLowerCase();
  if (/\.(mp4|mov|webm|m4v)(?:[?#]|$)/.test(lower)) return "direct_video";
  if (/(youtube\.com|youtu\.be)/.test(lower)) return "youtube_probe_later";
  if (/\.swf(?:[?#]|$)/.test(lower)) return "skip_flash";
  return "unknown_probe_later";
}

function extensionRank(url) {
  const lower = String(url).toLowerCase();
  if (/\.mp4(?:[?#]|$)/.test(lower)) return 0;
  if (/\.mov(?:[?#]|$)/.test(lower)) return 1;
  if (/\.webm(?:[?#]|$)/.test(lower)) return 2;
  if (/\.m4v(?:[?#]|$)/.test(lower)) return 3;
  return 4;
}

function splitRank(split) {
  if (split === "train") return 0;
  if (split === "val") return 1;
  if (split === "test") return 2;
  return 3;
}

function buildExactOverlap(rows, vocabulary, importPlan) {
  const byGloss = new Map();
  for (const row of rows) {
    const normalized = normalizeLabel(row.gloss);
    if (!byGloss.has(normalized)) byGloss.set(normalized, []);
    byGloss.get(normalized).push(row);
  }
  const planOrder = new Map(
    (importPlan?.local_dataset_state?.wlasl?.exact_overlap_labels ?? [])
      .map((label, index) => [label.label_id, index]),
  );
  const labels = [];
  for (const label of vocabulary) {
    const matches = byGloss.get(label.normalized) ?? [];
    const instances = matches.flatMap((row) => (
      Array.isArray(row.instances)
        ? row.instances.map((instance) => ({ ...instance, gloss: row.gloss }))
        : []
    ));
    if (instances.length === 0) continue;
    labels.push({
      label_id: label.label_id,
      display_text: label.display_text,
      normalized: label.normalized,
      instance_count: instances.length,
      plan_order: planOrder.get(label.label_id) ?? Number.MAX_SAFE_INTEGER,
      instances,
    });
  }
  labels.sort((a, b) => (
    a.plan_order - b.plan_order ||
    b.instance_count - a.instance_count ||
    a.label_id.localeCompare(b.label_id)
  ));
  return labels;
}

function candidatesForLabel(label, candidatesPerLabel) {
  const seen = new Set();
  return label.instances
    .map((instance) => ({
      label_id: label.label_id,
      display_text: label.display_text,
      wlasl_gloss: instance.gloss,
      video_id: instance.video_id ?? null,
      split: instance.split ?? "unknown",
      signer_id: instance.signer_id ?? null,
      source: instance.source ?? "unknown",
      url: instance.url ?? "",
      url_kind: classifyUrl(instance.url ?? ""),
      probe_status: "not_probed",
    }))
    .filter((candidate) => candidate.url_kind === "direct_video")
    .filter((candidate) => {
      if (!candidate.url || seen.has(candidate.url)) return false;
      seen.add(candidate.url);
      return true;
    })
    .sort((a, b) => (
      extensionRank(a.url) - extensionRank(b.url) ||
      splitRank(a.split) - splitRank(b.split) ||
      String(a.video_id).localeCompare(String(b.video_id))
    ))
    .slice(0, candidatesPerLabel);
}

function summarizeSkipped(label) {
  const counts = {};
  for (const instance of label.instances) {
    const kind = classifyUrl(instance.url ?? "");
    if (kind === "direct_video") continue;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  return counts;
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
        "user-agent": "asl-pilot-academic-url-probe/1.0",
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function responseSummary(response, method) {
  return {
    method,
    ok: response.ok,
    status_code: response.status,
    final_url: response.url,
    content_type: response.headers.get("content-type"),
    content_length: response.headers.get("content-length"),
    accept_ranges: response.headers.get("accept-ranges"),
  };
}

function isUsableVideoResponse(summary) {
  if (!summary.ok && summary.status_code !== 206) return false;
  const contentType = String(summary.content_type ?? "").toLowerCase();
  if (contentType.startsWith("video/")) return true;
  if (summary.content_length && Number.parseInt(summary.content_length, 10) > 0) return true;
  return /\.(mp4|mov|webm|m4v)(?:[?#]|$)/i.test(summary.final_url ?? "");
}

async function probeCandidate(candidate, timeoutMs) {
  const attempts = [];
  try {
    const head = await requestWithTimeout(candidate.url, { method: "HEAD" }, timeoutMs);
    const headSummary = responseSummary(head, "HEAD");
    attempts.push(headSummary);
    if (isUsableVideoResponse(headSummary)) {
      return {
        ...candidate,
        probe_status: "available",
        usable: true,
        attempts,
      };
    }
  } catch (error) {
    attempts.push({
      method: "HEAD",
      ok: false,
      status_code: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  try {
    const range = await requestWithTimeout(candidate.url, {
      method: "GET",
      headers: { range: "bytes=0-0" },
    }, timeoutMs);
    const rangeSummary = responseSummary(range, "GET_RANGE_0_0");
    attempts.push(rangeSummary);
    return {
      ...candidate,
      probe_status: isUsableVideoResponse(rangeSummary) ? "available" : "unavailable",
      usable: isUsableVideoResponse(rangeSummary),
      attempts,
    };
  } catch (error) {
    attempts.push({
      method: "GET_RANGE_0_0",
      ok: false,
      status_code: null,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ...candidate,
      probe_status: "probe_error",
      usable: false,
      attempts,
    };
  }
}

async function buildProbe(args) {
  const register = readJsonIfExists(sourceRegisterPath);
  const importPlan = readJsonIfExists(importPlanPath);
  if (!fs.existsSync(wlaslMetadataPath)) {
    throw new Error(`Missing WLASL metadata: ${projectRelative(wlaslMetadataPath)}`);
  }
  const vocabulary = readVocabularyLabels();
  const rows = readJsonIfExists(wlaslMetadataPath);
  const exactOverlap = buildExactOverlap(rows, vocabulary, importPlan);
  const selectedLabels = exactOverlap.slice(0, args.maxLabels);
  const perLabel = [];
  for (const label of selectedLabels) {
    const candidates = candidatesForLabel(label, args.candidatesPerLabel);
    const probed = [];
    for (const candidate of candidates) {
      probed.push(await probeCandidate(candidate, args.timeoutMs));
    }
    perLabel.push({
      label_id: label.label_id,
      display_text: label.display_text,
      instance_count: label.instance_count,
      direct_candidate_count: label.instances.filter((instance) => classifyUrl(instance.url ?? "") === "direct_video").length,
      skipped_url_kind_counts: summarizeSkipped(label),
      probed_candidates: probed,
      usable_candidate_count: probed.filter((candidate) => candidate.usable).length,
    });
  }
  const availableCandidates = perLabel.flatMap((label) => (
    label.probed_candidates
      .filter((candidate) => candidate.usable)
      .map((candidate) => ({
        label_id: label.label_id,
        display_text: label.display_text,
        video_id: candidate.video_id,
        split: candidate.split,
        signer_id: candidate.signer_id,
        source: candidate.source,
        url: candidate.url,
        probe_status: candidate.probe_status,
      }))
  ));
  const source = sourceDecision(register);
  const blockers = [];
  if (!source) blockers.push("source register is missing wlasl-school-assignment-raw-videos");
  if (source && (
    source.allowed_for_model_training !== true ||
    source.allowed_for_validation !== true ||
    source.allowed_for_pilot_submission !== true
  )) {
    blockers.push("wlasl-school-assignment-raw-videos is not approved for the current school-assignment path");
  }
  if (availableCandidates.length === 0) {
    blockers.push("no currently usable direct WLASL raw URL candidates were found in this probe window");
  }
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "available_raw_url_candidates_found" : "blocked",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/probe_wlasl_academic_raw_urls.mjs",
        sha256: sha256File(path.join(root, "scripts", "probe_wlasl_academic_raw_urls.mjs")),
      },
    },
    decision_boundary: {
      changes_training_data: false,
      downloads_or_imports_media: false,
      changes_manifests: false,
      trains_or_promotes_model: false,
      probe_fetches_headers_and_at_most_one_byte_per_range_attempt: true,
      uses_wlasl_metadata_for_source_selection_only: true,
    },
    assignment_scope: {
      mode: "noncommercial_school_assignment",
      source_id: "wlasl-school-assignment-raw-videos",
      raw_video_candidates_only: true,
      redistribute_raw_or_modified_data: false,
    },
    inputs: {
      source_register: fileState(sourceRegisterPath),
      import_plan: fileState(importPlanPath),
      vocabulary: fileState(vocabularyPath),
      wlasl_metadata: fileState(wlaslMetadataPath),
    },
    source_register_decision: source,
    config: {
      max_labels: args.maxLabels,
      candidates_per_label: args.candidatesPerLabel,
      timeout_ms: args.timeoutMs,
    },
    summary: {
      exact_overlap_label_count: exactOverlap.length,
      probed_label_count: perLabel.length,
      probed_candidate_count: perLabel.reduce((total, label) => total + label.probed_candidates.length, 0),
      usable_candidate_count: availableCandidates.length,
      labels_with_usable_candidate_count: perLabel.filter((label) => label.usable_candidate_count > 0).length,
    },
    available_candidates: availableCandidates,
    per_label: perLabel,
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const probe = await buildProbe(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(probe, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: probe.status,
    wrote: args.write,
    output: projectRelative(args.output),
    probed_label_count: probe.summary.probed_label_count,
    probed_candidate_count: probe.summary.probed_candidate_count,
    usable_candidate_count: probe.summary.usable_candidate_count,
    labels_with_usable_candidate_count: probe.summary.labels_with_usable_candidate_count,
    blockers: probe.blockers,
  }, null, 2));
  return probe.status === "available_raw_url_candidates_found" ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`WLASL academic raw URL probe failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
