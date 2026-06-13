import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceManifests = {
  train: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "train.json"),
  validation: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "validation.json"),
  test: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "test.json"),
};
const aslCitizenSelectedManifests = {
  train: path.join(root, "data", "manifests", "diagnostics", "asl-citizen-selected", "train.json"),
  validation: path.join(root, "data", "manifests", "diagnostics", "asl-citizen-selected", "validation.json"),
  test: path.join(root, "data", "manifests", "diagnostics", "asl-citizen-selected", "test.json"),
};
const outputRoot = path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-high-coverage-025");
const summaryPath = path.join(root, "docs", "validation", "prompt-verifier-subset-manifests.json");
const subsetVocabularyReviewPath = path.join(root, "docs", "validation", "prompt-verifier-subset-vocabulary-review.json");

function parseArgs(argv) {
  const args = {
    write: false,
    labelCount: 25,
    minTrainClips: 5,
    minValidationClips: 3,
    minTestClips: 3,
    labels: null,
    includeAslCitizenSelected: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--label-count") {
      args.labelCount = Number(argv[++index]);
    } else if (item === "--min-train-clips") {
      args.minTrainClips = Number(argv[++index]);
    } else if (item === "--min-validation-clips") {
      args.minValidationClips = Number(argv[++index]);
    } else if (item === "--min-test-clips") {
      args.minTestClips = Number(argv[++index]);
    } else if (item === "--labels") {
      args.labels = argv[++index].split(",").map((label) => label.trim()).filter(Boolean);
    } else if (item === "--include-asl-citizen-selected") {
      args.includeAslCitizenSelected = true;
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_prompt_verifier_subset_manifests.mjs [--write]

Exports a 25-40 label prompt-conditioned verifier subset from the controlled
clip-heldout manifests. The subset is for the emergency verifier lane and keeps
the parent manifest provenance intact.

Options:
  --label-count <n>          Number of high-coverage labels to select. Default: 25
  --labels <a,b,c>           Explicit comma-separated label ids to export.
  --include-asl-citizen-selected
                             Append selected ASL Citizen academic raw clips for
                             matching labels using official ASL Citizen splits.
  --min-train-clips <n>      Minimum train clips per selected label. Default: 5
  --min-validation-clips <n> Minimum validation clips per selected label. Default: 3
  --min-test-clips <n>       Minimum test clips per selected label. Default: 3
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function countByLabel(clips) {
  const counts = new Map();
  for (const clip of clips) {
    counts.set(clip.label_id, (counts.get(clip.label_id) ?? 0) + 1);
  }
  return counts;
}

function countBy(clips, key) {
  const counts = {};
  for (const clip of clips) {
    const value = clip[key] ?? null;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function selectLabels(args, manifests) {
  const labelsById = new Map(manifests.train.labels.map((label) => [label.label_id, label]));
  const counts = Object.fromEntries(
    Object.entries(manifests).map(([split, manifest]) => [split, countByLabel(manifest.clips)]),
  );
  const candidates = [...labelsById.keys()]
    .map((labelId) => {
      const train = counts.train.get(labelId) ?? 0;
      const validation = counts.validation.get(labelId) ?? 0;
      const test = counts.test.get(labelId) ?? 0;
      return {
        label_id: labelId,
        display_text: labelsById.get(labelId).display_text,
        train_clips: train,
        validation_clips: validation,
        test_clips: test,
        total_clips: train + validation + test,
      };
    })
    .filter((item) => (
      item.train_clips >= args.minTrainClips
      && item.validation_clips >= args.minValidationClips
      && item.test_clips >= args.minTestClips
    ));

  if (args.labels) {
    const candidateIds = new Set(candidates.map((item) => item.label_id));
    const missing = args.labels.filter((label) => !candidateIds.has(label));
    if (missing.length > 0) {
      throw new Error(`explicit labels do not satisfy coverage requirements: ${missing.join(", ")}`);
    }
    return args.labels.map((labelId) => candidates.find((item) => item.label_id === labelId));
  }

  return candidates
    .sort((left, right) => (
      right.total_clips - left.total_clips
      || right.test_clips - left.test_clips
      || left.label_id.localeCompare(right.label_id)
    ))
    .slice(0, args.labelCount);
}

function manifestRelative(outputManifestPath, sourceManifestPath, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim().length === 0) return relativePath;
  const absolute = path.resolve(path.dirname(sourceManifestPath), relativePath);
  return path.relative(path.dirname(outputManifestPath), absolute).split(path.sep).join("/") || ".";
}

function rewriteClipForOutput(clip, sourceManifestPath, outputPath) {
  const next = structuredClone(clip);
  next.relative_video_path = manifestRelative(outputPath, sourceManifestPath, clip.relative_video_path);
  if (clip.relative_frame_tensor_path) {
    next.relative_frame_tensor_path = manifestRelative(outputPath, sourceManifestPath, clip.relative_frame_tensor_path);
  }
  if (next.frame_tensor_provenance?.source_video?.relative_video_path) {
    next.frame_tensor_provenance.source_video.relative_video_path = next.relative_video_path;
  }
  return next;
}

function subsetVocabularyReview(selectedLabels, parentReview) {
  return {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: parentReview.status,
    item_count: selectedLabels.length,
    vocabulary_source: parentReview.vocabulary_source,
    approved_item_ids: selectedLabels.map((label) => label.label_id),
    selection_policy: "prompt-verifier high-coverage subset selected from reviewed controlled-pilot vocabulary",
    parent_vocabulary_review: parentReview.evidence,
  };
}

function manifestVocabularyReview(parentReview) {
  return {
    ...parentReview,
    evidence: fileReference(subsetVocabularyReviewPath),
    vocabulary_source: {
      ...parentReview.vocabulary_source,
      item_count: undefined,
    },
  };
}

function clipsFromSupplement(split, selectedIds, outputPath, args) {
  if (!args.includeAslCitizenSelected) return [];
  const supplementPath = aslCitizenSelectedManifests[split];
  if (!fs.existsSync(supplementPath)) {
    throw new Error(`missing ASL Citizen selected manifest: ${projectRelative(supplementPath)}`);
  }
  const supplement = readJson(supplementPath);
  return supplement.clips
    .filter((clip) => selectedIds.has(clip.label_id))
    .map((clip) => rewriteClipForOutput(clip, supplementPath, outputPath));
}

function buildManifest(source, split, selectedLabels, sourceManifestPath, outputPath, args) {
  const selectedIds = new Set(selectedLabels.map((label) => label.label_id));
  const sourceLabelsById = new Map(source.labels.map((label) => [label.label_id, label]));
  const vocabularyReview = manifestVocabularyReview(source.vocabulary_review);
  vocabularyReview.vocabulary_source.item_count = selectedLabels.length;
  return {
    ...source,
    dataset_id: `${source.dataset_id}-prompt-verifier-high-coverage-025`,
    split,
    created_at: new Date().toISOString(),
    verifier_subset: {
      purpose: "emergency_prompt_conditioned_verifier_high_coverage_subset",
      label_count: selectedLabels.length,
      selection_policy: "highest total clip coverage across controlled clip-heldout train/validation/test after minimum split coverage filters",
      split_policy: source.split_policy,
      includes_asl_citizen_selected: args.includeAslCitizenSelected,
      limitation: "Controlled clip-heldout subset; this does not prove signer-disjoint generalization or global 95-way recognition.",
    },
    vocabulary_review: vocabularyReview,
    labels: selectedLabels.map((label) => sourceLabelsById.get(label.label_id) ?? {
      label_id: label.label_id,
      display_text: label.display_text,
    }),
    clips: source.clips
      .filter((clip) => selectedIds.has(clip.label_id))
      .map((clip) => rewriteClipForOutput(clip, sourceManifestPath, outputPath))
      .concat(clipsFromSupplement(split, selectedIds, outputPath, args)),
  };
}

function build(args) {
  const manifests = Object.fromEntries(
    Object.entries(sourceManifests).map(([split, file]) => [split, readJson(file)]),
  );
  const selectedLabels = selectLabels(args, manifests);
  const selectedIds = new Set(selectedLabels.map((label) => label.label_id));
  const outputs = Object.fromEntries(
    Object.entries(manifests).map(([split, manifest]) => {
      const outputPath = path.join(outputRoot, `${split}.json`);
      return [split, buildManifest(manifest, split, selectedLabels, sourceManifests[split], outputPath, args)];
    }),
  );
  const splitSummaries = Object.fromEntries(
    Object.entries(outputs).map(([split, manifest]) => [
      split,
      {
        manifest: args.write ? fileReference(path.join(outputRoot, `${split}.json`)) : { path: projectRelative(path.join(outputRoot, `${split}.json`)) },
        label_count: manifest.labels.length,
        clip_count: manifest.clips.length,
        source_id_counts: countBy(manifest.clips, "source_id"),
        min_clips_per_label: Math.min(...selectedLabels.map((label) => label[`${split}_clips`])),
        max_clips_per_label: Math.max(...selectedLabels.map((label) => label[`${split}_clips`])),
      },
    ]),
  );

  return {
    schema_version: "asl-pilot-prompt-verifier-subset-manifests/v1",
    status: "exported",
    finality: "emergency_verifier_subset_not_model_promotion",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_prompt_verifier_subset_manifests.mjs")),
      command: process.argv,
    },
    inputs: Object.fromEntries(Object.entries(sourceManifests).map(([split, file]) => [split, fileReference(file)])),
    supplements: {
      asl_citizen_selected: args.includeAslCitizenSelected
        ? Object.fromEntries(Object.entries(aslCitizenSelectedManifests).map(([split, file]) => [split, fileReference(file)]))
        : null,
    },
    vocabulary_review: args.write
      ? fileReference(subsetVocabularyReviewPath)
      : { path: projectRelative(subsetVocabularyReviewPath), exists: false, sha256: null },
    output_root: projectRelative(outputRoot),
    selection: {
      label_count: selectedLabels.length,
      requested_label_count: args.labelCount,
      explicit_labels: args.labels,
      minimum_split_coverage: {
        train: args.minTrainClips,
        validation: args.minValidationClips,
        test: args.minTestClips,
      },
      labels: selectedLabels,
      selected_label_ids: [...selectedIds],
      policy: "highest total clip coverage across controlled clip-heldout train/validation/test",
      split_policy: manifests.train.split_policy,
      limitation: "This verifier subset is controlled clip-heldout, not signer-disjoint, and may only support a scoped prompt-conditioned claim.",
    },
    splits: splitSummaries,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  if (!Number.isInteger(args.labelCount) || args.labelCount < 1) throw new Error("--label-count must be a positive integer");
  const summary = build(args);
  if (args.write) {
    const manifests = Object.fromEntries(
      Object.entries(sourceManifests).map(([split, file]) => [split, readJson(file)]),
    );
    const selectedLabels = summary.selection.labels;
    writeJson(subsetVocabularyReviewPath, subsetVocabularyReview(selectedLabels, manifests.train.vocabulary_review));
    for (const [split, manifest] of Object.entries(manifests)) {
      writeJson(
        path.join(outputRoot, `${split}.json`),
        buildManifest(manifest, split, selectedLabels, sourceManifests[split], path.join(outputRoot, `${split}.json`), args),
      );
    }
    const writtenSummary = build(args);
    writeJson(summaryPath, writtenSummary);
    console.log(JSON.stringify({
      status: writtenSummary.status,
      summary: projectRelative(summaryPath),
      label_count: writtenSummary.selection.label_count,
      selected_label_ids: writtenSummary.selection.selected_label_ids,
      splits: writtenSummary.splits,
    }, null, 2));
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main();
