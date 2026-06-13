import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatePath = path.join(root, "docs", "research", "ms-asl-pruned-vocabulary-candidate.json");
const defaultAvailabilityPath = path.join(root, "docs", "research", "ms-asl-pruned-vocabulary-availability-probe.json");
const defaultMetadataDir = path.join(root, "artifacts", "dataset-research", "ms-asl", "extracted", "MS-ASL");
const defaultOutputPath = path.join(root, "docs", "research", "ms-asl-availability-filtered-candidate.json");

function parseArgs(argv) {
  const args = {
    candidate: defaultCandidatePath,
    availability: defaultAvailabilityPath,
    metadataDir: defaultMetadataDir,
    output: defaultOutputPath,
    minTrain: 20,
    minValidation: 5,
    minTest: 5,
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
    } else if (item === "--availability") {
      args.availability = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--metadata-dir") {
      args.metadataDir = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--min-train") {
      args.minTrain = readPositiveInteger(argv, ++index, item);
    } else if (item === "--min-validation") {
      args.minValidation = readPositiveInteger(argv, ++index, item);
    } else if (item === "--min-test") {
      args.minTest = readPositiveInteger(argv, ++index, item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_msasl_availability_filtered_candidate.mjs [--write]

Builds a research-only MS-ASL candidate from labels that still meet the split
count floor after the full oEmbed public-availability probe.
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

function rowMatchesPublicSelected(row, selectedByMsaslLabel, publicVideoIds) {
  const selected = selectedByMsaslLabel.get(row.label);
  if (!selected) return null;
  const videoId = parseYouTubeId(row.url);
  if (!videoId || !publicVideoIds.has(videoId)) return null;
  return {
    ...selected,
    video_id: videoId,
    url: normalizeUrl(row.url),
    start_time: row.start_time,
    end_time: row.end_time,
    signer_id: row.signer_id,
    text: row.text,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const candidate = readJson(args.candidate);
  const availability = readJson(args.availability);
  if (candidate.schema_version !== "asl-pilot-msasl-pruned-vocabulary-candidate/v1") {
    throw new Error(`${projectRelative(args.candidate)} is not an MS-ASL pruned vocabulary candidate`);
  }
  if (availability.schema_version !== "asl-pilot-msasl-pruned-vocabulary-availability-probe/v1") {
    throw new Error(`${projectRelative(args.availability)} is not an MS-ASL availability probe`);
  }

  const selectedByLabel = new Map(candidate.selected.map((item) => [item.asl_pilot_label_id, item]));
  const passing = [];
  const rejected = [];
  for (const [labelId, summary] of Object.entries(availability.label_summary)) {
    const trainPublic = summary.splits?.train?.public_rows ?? 0;
    const validationPublic = summary.splits?.validation?.public_rows ?? 0;
    const testPublic = summary.splits?.test?.public_rows ?? 0;
    const base = selectedByLabel.get(labelId);
    const item = {
      asl_pilot_label_id: labelId,
      msasl_label: summary.msasl_label,
      msasl_text: base?.msasl_text ?? labelId,
      public_counts: {
        train: trainPublic,
        validation: validationPublic,
        test: testPublic,
      },
      original_counts: base?.counts ?? null,
      public_row_rate: summary.public_row_rate,
    };
    if (trainPublic >= args.minTrain && validationPublic >= args.minValidation && testPublic >= args.minTest) {
      passing.push(item);
    } else {
      rejected.push({
        ...item,
        rejection_reason: `below public-row floor train>=${args.minTrain}, validation>=${args.minValidation}, test>=${args.minTest}`,
      });
    }
  }
  passing.sort((a, b) => a.msasl_label - b.msasl_label || a.asl_pilot_label_id.localeCompare(b.asl_pilot_label_id));
  rejected.sort((a, b) => a.msasl_label - b.msasl_label || a.asl_pilot_label_id.localeCompare(b.asl_pilot_label_id));

  const publicRowsByLabel = new Map(passing.map((item) => [item.asl_pilot_label_id, []]));
  const publicVideos = new Map();
  const publicVideoIdsFromProbe = new Set(
    availability.video_probes
      .filter((probe) => probe.availability_status === "public_oembed")
      .map((probe) => probe.video_id),
  );
  for (const row of availability.invalid_url_rows ?? []) {
    if (publicRowsByLabel.has(row.asl_pilot_label_id)) {
      throw new Error(`Unexpected invalid URL row in passing label ${row.asl_pilot_label_id}`);
    }
  }
  const selectedByMsaslLabel = new Map(passing.map((item) => [item.msasl_label, item]));
  const splitFiles = {
    train: path.join(args.metadataDir, "MSASL_train.json"),
    validation: path.join(args.metadataDir, "MSASL_val.json"),
    test: path.join(args.metadataDir, "MSASL_test.json"),
  };
  const publicRows = [];
  for (const [split, file] of Object.entries(splitFiles)) {
    const rows = readJson(file);
    for (const [sourceIndex, row] of rows.entries()) {
      const match = rowMatchesPublicSelected(row, selectedByMsaslLabel, publicVideoIdsFromProbe);
      if (!match) continue;
      publicRows.push({
        split,
        source_index: sourceIndex,
        asl_pilot_label_id: match.asl_pilot_label_id,
        msasl_label: match.msasl_label,
        msasl_text: match.msasl_text,
        signer_id: match.signer_id,
        video_id: match.video_id,
        url: match.url,
        start_time: match.start_time,
        end_time: match.end_time,
        text: match.text,
      });
    }
  }
  const publicVideoIdsForSelectedRows = new Set(publicRows.map((row) => row.video_id));
  for (const probe of availability.video_probes) {
    if (probe.availability_status !== "public_oembed") continue;
    if (!publicVideoIdsForSelectedRows.has(probe.video_id)) continue;
    publicVideos.set(probe.video_id, {
      video_id: probe.video_id,
      canonical_url: probe.canonical_url,
      title: probe.title,
      author_name: probe.author_name,
      provider_name: probe.provider_name,
    });
  }
  for (const label of passing) {
    const labelSummary = availability.label_summary[label.asl_pilot_label_id];
    publicRowsByLabel.set(label.asl_pilot_label_id, {
      public_counts: label.public_counts,
      splits: labelSummary.splits,
    });
  }

  const output = {
    schema_version: "asl-pilot-msasl-availability-filtered-candidate/v1",
    created_at: new Date().toISOString(),
    evidence_mode: "research_only_not_training_data",
    finality: "candidate_not_source_register_approved",
    generated_by: "scripts/export_msasl_availability_filtered_candidate.mjs",
    inputs: {
      pruned_candidate: {
        path: projectRelative(args.candidate),
        sha256: sha256File(args.candidate),
      },
      availability_probe: {
        path: projectRelative(args.availability),
        sha256: sha256File(args.availability),
      },
      metadata_dir: projectRelative(args.metadataDir),
      msasl_splits: Object.fromEntries(
        Object.entries(splitFiles).map(([split, file]) => [split, { path: projectRelative(file), sha256: sha256File(file) }]),
      ),
    },
    selection_rule: {
      source_candidate_rule: candidate.selection_rule,
      availability_filter: "keep labels whose oEmbed-public rows meet the split floor",
      minimum_public_counts: {
        train: args.minTrain,
        validation: args.minValidation,
        test: args.minTest,
      },
    },
    summary: {
      source_candidate_labels: candidate.summary.selected_labels,
      selected_labels: passing.length,
      rejected_labels: rejected.length,
      selected_public_rows: {
        train: passing.reduce((total, item) => total + item.public_counts.train, 0),
        validation: passing.reduce((total, item) => total + item.public_counts.validation, 0),
        test: passing.reduce((total, item) => total + item.public_counts.test, 0),
      },
      probe_unique_public_video_ids: publicVideoIdsFromProbe.size,
      candidate_public_video_ids: publicVideoIdsForSelectedRows.size,
    },
    selected: passing,
    selected_label_public_row_summary: Object.fromEntries(publicRowsByLabel),
    selected_public_rows: publicRows,
    public_video_evidence: [...publicVideos.values()].sort((a, b) => a.video_id.localeCompare(b.video_id)),
    rejected,
    restrictions: [
      "This artifact does not approve MS-ASL for training.",
      "This artifact is not a train/validation/test manifest.",
      "Do not download or decode MS-ASL videos until source-register review approves the exact scope.",
      "Do not use pretrained models, extracted features, landmarks, detectors, or feature caches.",
    ],
    decision: {
      status: "candidate_too_small_for_current_goal_without_scope_approval",
      reason: "The availability-filtered MS-ASL candidate preserves only 14 labels. It may support a reduced-scope experiment, but it does not satisfy the current 95-label final model goal and still lacks source-register approval.",
    },
  };

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
  process.exitCode = main();
} catch (error) {
  console.error(`MS-ASL availability-filtered candidate export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
