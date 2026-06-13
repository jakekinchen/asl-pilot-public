import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultMetadataDir = path.join(root, "artifacts", "dataset-research", "ms-asl", "extracted", "MS-ASL");
const defaultManifestPath = path.join(root, "data", "manifests", "train.json");
const defaultOutputPath = path.join(root, "docs", "research", "ms-asl-pruned-vocabulary-candidate.json");

function parseArgs(argv) {
  const args = {
    metadataDir: defaultMetadataDir,
    manifest: defaultManifestPath,
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
    } else if (item === "--metadata-dir") {
      args.metadataDir = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--manifest") {
      args.manifest = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/export_msasl_pruned_vocabulary_candidate.mjs [--write]

Builds a research-only MS-ASL pruned vocabulary candidate by exact-normalized
overlap with the current ASL Pilot manifest labels. This does not approve MS-ASL
for training and does not download videos.
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

function normalizeLabel(value) {
  return String(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function uniqueCount(rows, key) {
  return new Set(rows.map((row) => row[key]).filter((value) => value !== undefined && value !== null)).size;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const manifest = readJson(args.manifest);
  const labels = (manifest.labels ?? [])
    .map((label) => (typeof label === "string" ? label : label?.label_id))
    .filter((label) => typeof label === "string" && label.length > 0);
  if (labels.length === 0) throw new Error(`${projectRelative(args.manifest)} has no labels`);

  const classPath = path.join(args.metadataDir, "MSASL_classes.json");
  const splitPaths = {
    train: path.join(args.metadataDir, "MSASL_train.json"),
    validation: path.join(args.metadataDir, "MSASL_val.json"),
    test: path.join(args.metadataDir, "MSASL_test.json"),
  };
  const classes = readJson(classPath);
  const splits = Object.fromEntries(Object.entries(splitPaths).map(([split, file]) => [split, readJson(file)]));

  const classByNormalized = new Map();
  classes.forEach((text, label) => {
    const normalized = normalizeLabel(text);
    if (!classByNormalized.has(normalized)) classByNormalized.set(normalized, []);
    classByNormalized.get(normalized).push({ label, text });
  });

  const selected = [];
  const overlapRejected = [];
  const missing = [];

  for (const labelId of labels) {
    const matches = classByNormalized.get(normalizeLabel(labelId)) ?? [];
    if (matches.length === 0) {
      missing.push(labelId);
      continue;
    }
    for (const match of matches) {
      const splitRows = Object.fromEntries(
        Object.entries(splits).map(([split, rows]) => [split, rows.filter((row) => row.label === match.label)]),
      );
      const counts = Object.fromEntries(Object.entries(splitRows).map(([split, rows]) => [split, rows.length]));
      const signerCounts = Object.fromEntries(
        Object.entries(splitRows).map(([split, rows]) => [split, uniqueCount(rows, "signer_id")]),
      );
      const urlCounts = Object.fromEntries(Object.entries(splitRows).map(([split, rows]) => [split, uniqueCount(rows, "url")]));
      const item = {
        asl_pilot_label_id: labelId,
        msasl_label: match.label,
        msasl_text: match.text,
        counts,
        signer_counts: signerCounts,
        url_counts: urlCounts,
      };
      if (counts.train >= args.minTrain && counts.validation >= args.minValidation && counts.test >= args.minTest) {
        selected.push(item);
      } else {
        overlapRejected.push({
          ...item,
          rejection_reason: `below minimum counts train>=${args.minTrain}, validation>=${args.minValidation}, test>=${args.minTest}`,
        });
      }
    }
  }

  selected.sort((a, b) => a.msasl_label - b.msasl_label || a.asl_pilot_label_id.localeCompare(b.asl_pilot_label_id));
  overlapRejected.sort((a, b) => a.msasl_label - b.msasl_label || a.asl_pilot_label_id.localeCompare(b.asl_pilot_label_id));
  missing.sort();

  const output = {
    schema_version: "asl-pilot-msasl-pruned-vocabulary-candidate/v1",
    created_at: new Date().toISOString(),
    evidence_mode: "research_only_not_training_data",
    finality: "candidate_not_source_register_approved",
    generated_by: "scripts/export_msasl_pruned_vocabulary_candidate.mjs",
    inputs: {
      current_manifest: {
        path: projectRelative(args.manifest),
        sha256: sha256File(args.manifest),
      },
      metadata_dir: projectRelative(args.metadataDir),
      msasl_classes: {
        path: projectRelative(classPath),
        sha256: sha256File(classPath),
      },
      msasl_splits: Object.fromEntries(
        Object.entries(splitPaths).map(([split, file]) => [split, { path: projectRelative(file), sha256: sha256File(file) }]),
      ),
    },
    selection_rule: {
      label_match: "exact match after lowercase alphanumeric normalization",
      minimum_counts: {
        train: args.minTrain,
        validation: args.minValidation,
        test: args.minTest,
      },
    },
    summary: {
      asl_pilot_labels: labels.length,
      msasl_classes: classes.length,
      selected_labels: selected.length,
      overlapping_labels_below_minimum: overlapRejected.length,
      asl_pilot_labels_without_exact_msasl_match: missing.length,
      selected_metadata_rows: {
        train: selected.reduce((total, item) => total + item.counts.train, 0),
        validation: selected.reduce((total, item) => total + item.counts.validation, 0),
        test: selected.reduce((total, item) => total + item.counts.test, 0),
      },
    },
    selected,
    overlap_rejected: overlapRejected,
    missing_asl_pilot_label_ids: missing,
    restrictions: [
      "This artifact does not approve MS-ASL for training.",
      "Do not import MS-ASL videos until source-register review approves the exact scope.",
      "Do not use pretrained models, extracted features, landmarks, detectors, or feature caches.",
    ],
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
  console.error(`MS-ASL candidate export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
