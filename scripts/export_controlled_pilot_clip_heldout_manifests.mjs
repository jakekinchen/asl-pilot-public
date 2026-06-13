import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceManifests = {
  train: path.join(root, "data", "manifests", "train.json"),
  validation: path.join(root, "data", "manifests", "validation.json"),
  test: path.join(root, "data", "manifests", "test.json"),
};
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const wlaslAcademicManifests = {
  train: path.join(root, "data", "manifests", "diagnostics", "wlasl-academic-selected", "train.json"),
  validation: path.join(root, "data", "manifests", "diagnostics", "wlasl-academic-selected", "validation.json"),
  test: path.join(root, "data", "manifests", "diagnostics", "wlasl-academic-selected", "test.json"),
};
const outputRoot = path.join(root, "data", "manifests", "controlled-pilot-clip-heldout");
const summaryPath = path.join(root, "docs", "validation", "controlled-pilot-clip-heldout-manifests.json");
const splitFractions = {
  train: 0.6,
  validation: 0.2,
  test: 0.2,
};

function parseArgs(argv) {
  const args = { write: false, includeWlaslAcademicSelected: false };
  for (const item of argv) {
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--include-wlasl-academic-selected") {
      args.includeWlaslAcademicSelected = true;
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_controlled_pilot_clip_heldout_manifests.mjs [--write]

Builds deterministic 75-100-label controlled-pilot clip-heldout manifests from
the approved PopSign raw-video manifests. The output is a documented fallback
training/evaluation path, not signer-disjoint final evidence and not a model
promotion.

  --include-wlasl-academic-selected
                            Append decoded WLASL academic selected clips for
                            overlapping labels. WLASL clips stay source-bound
                            to wlasl-school-assignment-raw-videos.
`);
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

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function sourceRegisterReference() {
  const register = readJson(sourceRegisterPath);
  return {
    path: projectRelative(sourceRegisterPath),
    sha256: sha256File(sourceRegisterPath),
    decision_id: null,
    license_review_status: null,
    source_count: Array.isArray(register.sources) ? register.sources.length : null,
  };
}

function labelsKey(labels) {
  return labels.map((label) => `${label.label_id}\t${label.display_text}`).join("\n");
}

function manifestRelative(outputManifestPath, sourceManifestPath, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim().length === 0) return relativePath;
  const absolute = path.resolve(path.dirname(sourceManifestPath), relativePath);
  const relative = path.relative(path.dirname(outputManifestPath), absolute).split(path.sep).join("/");
  return relative || ".";
}

function rewriteClipForSplit(clip, targetSplit, sourceSplit, sourceManifestPath, outputManifestPath) {
  const next = structuredClone(clip);
  next.split = targetSplit;
  next.relative_video_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_video_path);
  if (clip.relative_frame_tensor_path) {
    next.relative_frame_tensor_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_frame_tensor_path);
  }
  if (next.frame_tensor_provenance?.source_video?.relative_video_path) {
    next.frame_tensor_provenance.source_video.relative_video_path = next.relative_video_path;
  }
  next.controlled_clip_heldout_source = {
    source_manifest_split: sourceSplit,
    source_manifest_path: projectRelative(sourceManifestPath),
    source_manifest_sha256: sha256File(sourceManifestPath),
    original_clip_split: clip.split,
    original_source_split: clip.source_split ?? null,
    original_clip_id: clip.clip_id,
    split_policy: "deterministic_clip_heldout_not_signer_disjoint",
  };
  return next;
}

function deterministicSortKey(clip) {
  return crypto
    .createHash("sha256")
    .update([
      clip.label_id,
      clip.clip_id,
      clip.source_record_id,
      clip.sha256,
    ].map((value) => String(value ?? "")).join("\t"))
    .digest("hex");
}

function splitRows(rows) {
  const sorted = [...rows].sort((left, right) => deterministicSortKey(left.clip).localeCompare(deterministicSortKey(right.clip)));
  const trainCount = Math.floor(sorted.length * splitFractions.train);
  const validationCount = Math.floor(sorted.length * splitFractions.validation);
  return {
    train: sorted.slice(0, trainCount),
    validation: sorted.slice(trainCount, trainCount + validationCount),
    test: sorted.slice(trainCount + validationCount),
  };
}

function countBy(rows, keyFn) {
  const output = {};
  for (const row of rows) {
    const key = keyFn(row);
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}

function signerOverlap(manifests) {
  const bySplit = Object.fromEntries(
    Object.entries(manifests).map(([split, manifest]) => [
      split,
      new Set(manifest.clips.map((clip) => clip.signer_identity_hash).filter(Boolean)),
    ]),
  );
  const pairs = [];
  for (const [left, right] of [["train", "validation"], ["train", "test"], ["validation", "test"]]) {
    const overlap = [...bySplit[left]].filter((signer) => bySplit[right].has(signer)).sort();
    pairs.push({
      splits: [left, right],
      overlap_count: overlap.length,
      sample_signer_identity_hashes: overlap.slice(0, 10),
    });
  }
  return pairs;
}

function buildOutputManifest({ sourceTemplate, split, clips, outputManifestPath, supplementalExternalDatasetImports }) {
  return {
    ...sourceTemplate,
    dataset_id: "asl-pilot-popsign-v1-controlled-clip-heldout-academic-mixed-v0",
    split,
    created_at: new Date().toISOString(),
    source_register: sourceRegisterReference(),
    ...(supplementalExternalDatasetImports.length > 0
      ? { supplemental_external_dataset_imports: supplementalExternalDatasetImports }
      : {}),
    split_policy: {
      type: "controlled_clip_heldout_not_signer_disjoint",
      source: "approved PopSign v1 train/validation/test clips pooled by label and deterministically repartitioned at clip level, optionally augmented with WLASL academic selected raw clips for overlapping labels",
      train_fraction: splitFractions.train,
      validation_fraction: splitFractions.validation,
      test_fraction: splitFractions.test,
      limitation: "This is a controlled-pilot fallback split. It does not prove signer-disjoint generalization.",
    },
    labels: sourceTemplate.labels,
    clips: clips.map(({ clip, sourceSplit, sourceManifestPath }) => (
      rewriteClipForSplit(clip, split, sourceSplit, sourceManifestPath, outputManifestPath)
    )),
  };
}

function readWlaslSupplement(args, labelSet) {
  if (!args.includeWlaslAcademicSelected) return { clipsBySplit: { train: [], validation: [], test: [] }, inputs: {} };
  const clipsBySplit = { train: [], validation: [], test: [] };
  const inputs = {};
  for (const [split, file] of Object.entries(wlaslAcademicManifests)) {
    if (!fs.existsSync(file)) throw new Error(`missing WLASL academic manifest: ${projectRelative(file)}`);
    const manifest = readJson(file);
    inputs[split] = fileReference(file);
    for (const clip of manifest.clips ?? []) {
      if (!labelSet.has(clip.label_id)) continue;
      clipsBySplit[split].push({ clip, sourceSplit: split, sourceManifestPath: file, supplement: "wlasl-academic-selected" });
    }
  }
  return { clipsBySplit, inputs };
}

function build(args) {
  const sources = Object.fromEntries(
    Object.entries(sourceManifests).map(([split, file]) => [split, readJson(file)]),
  );
  const labelKey = labelsKey(sources.train.labels);
  for (const [split, manifest] of Object.entries(sources)) {
    if (manifest.schema_version !== "asl-pilot-rawframe-manifest/v1") {
      throw new Error(`${split} source manifest has unexpected schema_version`);
    }
    if (labelsKey(manifest.labels) !== labelKey) {
      throw new Error(`${split} source manifest labels do not match train labels`);
    }
  }

  const byLabel = new Map(sources.train.labels.map((label) => [label.label_id, []]));
  for (const [sourceSplit, manifest] of Object.entries(sources)) {
    const sourceManifestPath = sourceManifests[sourceSplit];
    for (const clip of manifest.clips) {
      if (!byLabel.has(clip.label_id)) throw new Error(`Unknown label in ${sourceSplit}: ${clip.label_id}`);
      byLabel.get(clip.label_id).push({ clip, sourceSplit, sourceManifestPath });
    }
  }
  const wlaslSupplement = readWlaslSupplement(args, new Set(sources.train.labels.map((label) => label.label_id)));

  const splitRowsByTarget = { train: [], validation: [], test: [] };
  const underfilled = [];
  for (const [labelId, rows] of byLabel.entries()) {
    const split = splitRows(rows);
    for (const targetSplit of Object.keys(splitRowsByTarget)) {
      if (split[targetSplit].length < 5) {
        underfilled.push(`${labelId}:${targetSplit}:${split[targetSplit].length}`);
      }
      splitRowsByTarget[targetSplit].push(...split[targetSplit]);
    }
  }
  for (const split of Object.keys(splitRowsByTarget)) {
    splitRowsByTarget[split].push(...wlaslSupplement.clipsBySplit[split]);
  }
  if (underfilled.length > 0) {
    throw new Error(`Clip-heldout split underfilled labels: ${underfilled.join(", ")}`);
  }

  const outputManifests = {};
  const supplementalExternalDatasetImports = args.includeWlaslAcademicSelected
    ? [
        {
          source_id: "wlasl-school-assignment-raw-videos",
          source_audit: {
            path: "docs/research/wlasl-academic-source-review.md",
            sha256: sha256File(path.join(root, "docs", "research", "wlasl-academic-source-review.md")),
          },
        },
      ]
    : [];
  for (const [split, rows] of Object.entries(splitRowsByTarget)) {
    const outputManifestPath = path.join(outputRoot, `${split}.json`);
    outputManifests[split] = buildOutputManifest({
      sourceTemplate: sources.train,
      split,
      clips: rows,
      outputManifestPath,
      supplementalExternalDatasetImports,
    });
    if (args.write) writeJson(outputManifestPath, outputManifests[split]);
  }

  const summary = {
    schema_version: "asl-pilot-controlled-pilot-clip-heldout-manifests/v1",
    status: "clip_heldout_manifests_ready_not_signer_disjoint_evidence",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_controlled_pilot_clip_heldout_manifests.mjs")),
    },
    decision_boundary: {
      imports_media: false,
      creates_or_modifies_clips: false,
      changes_source_register: false,
      trains_weights: false,
      promotes_model_card: false,
      claims_signer_disjoint_evidence: false,
    },
    include_wlasl_academic_selected: args.includeWlaslAcademicSelected,
    source_manifests: Object.fromEntries(Object.entries(sourceManifests).map(([split, file]) => [split, fileReference(file)])),
    source_register: fileReference(sourceRegisterPath),
    wlasl_academic_selected_manifests: wlaslSupplement.inputs,
    output_manifests: Object.fromEntries(
      Object.entries(outputManifests).map(([split, manifest]) => {
        const file = path.join(outputRoot, `${split}.json`);
        const rows = manifest.clips;
        return [
          split,
          {
            path: projectRelative(file),
            exists: fs.existsSync(file),
            sha256: fs.existsSync(file) ? sha256File(file) : null,
            label_count: manifest.labels.length,
            clip_count: rows.length,
            min_clips_per_label: Math.min(...Object.values(countBy(rows, (clip) => clip.label_id))),
            source_split_counts: countBy(rows, (clip) => clip.source_split),
            source_id_counts: countBy(rows, (clip) => clip.source_id),
          },
        ];
      }),
    ),
    label_count: sources.train.labels.length,
    split_policy: outputManifests.train.split_policy,
    signer_overlap: signerOverlap(outputManifests),
    training_path: {
      command: [
        "python3",
        "scripts/train_rawframe_model.py",
        "--controlled-clip-heldout",
        "--check-files",
        "--train-manifest",
        "data/manifests/controlled-pilot-clip-heldout/train.json",
        "--validation-manifest",
        "data/manifests/controlled-pilot-clip-heldout/validation.json",
        "--test-manifest",
        "data/manifests/controlled-pilot-clip-heldout/test.json",
        "--output-dir",
        "artifacts/rawframe-model-clip-heldout",
        "--architecture",
        "factorized_3d_cnn_spatiotemporal",
      ],
      evidence_mode: "controlled_clip_heldout",
      limitation: "Candidate can support the controlled pilot only if trained/evaluated metrics pass and docs state the split is not signer-disjoint.",
    },
  };
  if (args.write) writeJson(summaryPath, summary);
  return summary;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exitCode = 0;
  } else {
    const summary = build(args);
    console.log(JSON.stringify(summary, null, 2));
    if (!args.write) {
      console.error("Dry run only. Re-run with --write to write clip-heldout manifests and summary.");
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
