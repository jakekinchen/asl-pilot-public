#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const defaultSplits = {
  train: path.join(root, "data", "manifests", "train.json"),
  validation: path.join(root, "data", "manifests", "validation.json"),
  test: path.join(root, "data", "manifests", "test.json"),
};
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultOutputRoot = path.join(root, "data", "manifests", "diagnostics", "popsign-label-ladder");
const defaultSummary = path.join(root, "docs", "validation", "popsign-label-ladder-manifests.json");
const defaultSizes = [5, 10, 25, 50, 95];

function usage() {
  return `
Usage:
  node scripts/export_popsign_label_ladder_manifests.mjs [--write]

Options:
  --train-manifest <path>       Default: data/manifests/train.json
  --validation-manifest <path>  Default: data/manifests/validation.json
  --test-manifest <path>        Default: data/manifests/test.json
  --validation-report <path>    Default: artifacts/rawframe-model/validation-report.json
  --output-root <path>          Default: data/manifests/diagnostics/popsign-label-ladder
  --summary <path>              Default: docs/validation/popsign-label-ladder-manifests.json
  --sizes <csv>                 Default: ${defaultSizes.join(",")}
  --write                       Write manifests and summary. Without --write, print the plan only.
`;
}

function resolveProjectPath(value, flag) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error(`${flag} escapes project root: ${value}`);
  }
  return resolved;
}

function parseArgs(argv) {
  const args = {
    manifests: { ...defaultSplits },
    validationReport: defaultValidationReport,
    outputRoot: defaultOutputRoot,
    summary: defaultSummary,
    sizes: defaultSizes,
    write: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${item} requires a value`);
      return argv[index];
    };
    if (item === "--write") {
      args.write = true;
    } else if (item === "--train-manifest") {
      args.manifests.train = resolveProjectPath(next(), item);
    } else if (item === "--validation-manifest") {
      args.manifests.validation = resolveProjectPath(next(), item);
    } else if (item === "--test-manifest") {
      args.manifests.test = resolveProjectPath(next(), item);
    } else if (item === "--validation-report") {
      args.validationReport = resolveProjectPath(next(), item);
    } else if (item === "--output-root") {
      args.outputRoot = resolveProjectPath(next(), item);
    } else if (item === "--summary") {
      args.summary = resolveProjectPath(next(), item);
    } else if (item === "--sizes") {
      args.sizes = next()
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isInteger(value) && value > 0);
      if (args.sizes.length === 0) throw new Error("--sizes must include at least one positive integer");
    } else if (item === "--help" || item === "-h") {
      console.log(usage().trim());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}\n${usage()}`);
    }
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveManifestRelativePath(manifestPath, value, field) {
  if (path.isAbsolute(value)) {
    throw new Error(`${manifestPath}: ${field} must be relative, got ${value}`);
  }
  const resolved = path.resolve(path.dirname(manifestPath), value);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error(`${manifestPath}: ${field} escapes project root: ${value}`);
  }
  return resolved;
}

function manifestRelative(manifestPath, targetPath) {
  return path.relative(path.dirname(manifestPath), targetPath).split(path.sep).join("/");
}

function rebaseClipPaths(clip, sourceManifestPath, outputManifestPath) {
  const output = structuredClone(clip);
  const videoPath = resolveManifestRelativePath(
    sourceManifestPath,
    String(clip.relative_video_path ?? ""),
    "relative_video_path",
  );
  output.relative_video_path = manifestRelative(outputManifestPath, videoPath);

  if (typeof clip.relative_frame_tensor_path === "string" && clip.relative_frame_tensor_path.trim()) {
    const tensorPath = resolveManifestRelativePath(
      sourceManifestPath,
      clip.relative_frame_tensor_path,
      "relative_frame_tensor_path",
    );
    output.relative_frame_tensor_path = manifestRelative(outputManifestPath, tensorPath);
  }

  const sourceVideo = output.frame_tensor_provenance?.source_video;
  if (sourceVideo && typeof sourceVideo === "object") {
    sourceVideo.relative_video_path = output.relative_video_path;
    sourceVideo.path = projectRelative(videoPath);
  }

  return output;
}

function assertActiveManifestShape(manifests) {
  const splitLabels = Object.fromEntries(
    Object.entries(manifests).map(([split, data]) => [
      split,
      data.labels.map((label) => String(label.label_id)),
    ]),
  );
  const trainLabels = splitLabels.train.join("\n");
  for (const [split, labels] of Object.entries(splitLabels)) {
    if (labels.join("\n") !== trainLabels) {
      throw new Error(`active ${split} labels do not match train label order`);
    }
  }
}

function metricFor(report, split, labelId) {
  const metrics = report?.[split]?.per_class?.[labelId];
  if (!metrics || typeof metrics !== "object") {
    return { recall: 0, f1: 0, precision: 0, support: 0 };
  }
  return {
    recall: Number(metrics.recall) || 0,
    f1: Number(metrics.f1) || 0,
    precision: Number(metrics.precision) || 0,
    support: Number(metrics.support) || 0,
  };
}

function rankLabels(labels, report) {
  const originalIndex = new Map(labels.map((label, index) => [label.label_id, index]));
  return labels
    .map((label) => {
      const validation = metricFor(report, "validation", label.label_id);
      const test = metricFor(report, "test", label.label_id);
      return {
        label_id: label.label_id,
        display_text: label.display_text,
        original_index: originalIndex.get(label.label_id),
        validation,
        test,
        score:
          validation.recall +
          test.recall +
          0.5 * validation.f1 +
          0.5 * test.f1 +
          0.01 * Math.min(validation.support, test.support),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.original_index - right.original_index;
    });
}

function clipCountsByLabel(clips) {
  const counts = {};
  for (const clip of clips) counts[clip.label_id] = (counts[clip.label_id] ?? 0) + 1;
  return counts;
}

function buildManifest(source, selectedSet, size, split, sourceManifestPath, outputManifestPath) {
  const labels = source.labels.filter((label) => selectedSet.has(label.label_id));
  const clips = source.clips
    .filter((clip) => selectedSet.has(clip.label_id))
    .map((clip) => rebaseClipPaths(clip, sourceManifestPath, outputManifestPath));
  return {
    ...source,
    dataset_id: `${source.dataset_id}-diagnostic-label-ladder-${size}`,
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    diagnostic_evidence: {
      schema_version: "asl-pilot-popsign-label-ladder-diagnostic/v1",
      finality: "diagnostic_not_final_model_evidence",
      source_manifest_split: split,
      source_manifest_sha256: sha256File(sourceManifestPath),
      label_count: size,
      note:
        "Reduced-label PopSign learning-curve manifest. Use --allow-small-label-set/--allow-smoke-eval; never promote as final evidence.",
    },
    labels,
    clips,
    vocabulary_review: undefined,
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value));
}

function main() {
  const args = parseArgs(process.argv);
  const manifests = Object.fromEntries(
    Object.entries(args.manifests).map(([split, file]) => [split, readJson(file)]),
  );
  assertActiveManifestShape(manifests);
  const report = readJson(args.validationReport);
  const ranked = rankLabels(manifests.train.labels, report);
  const maxSize = manifests.train.labels.length;
  const sizes = [...new Set(args.sizes)].sort((a, b) => a - b);
  for (const size of sizes) {
    if (size > maxSize) throw new Error(`requested size ${size} exceeds active label count ${maxSize}`);
  }

  const output = {
    schema_version: "asl-pilot-popsign-label-ladder-manifests/v1",
    status: args.write ? "written" : "dry_run",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/export_popsign_label_ladder_manifests.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv.slice(1),
    },
    finality: "diagnostic_not_final_model_evidence",
    inputs: {
      manifests: Object.fromEntries(
        Object.entries(args.manifests).map(([split, file]) => [
          split,
          { path: projectRelative(file), sha256: sha256File(file) },
        ]),
      ),
      validation_report: {
        path: projectRelative(args.validationReport),
        sha256: sha256File(args.validationReport),
      },
    },
    selection_method:
      "Labels are ranked by current validation/test recall and F1 as an upper-bound reduced-scope diagnostic; manifests preserve original PopSign split boundaries and original vocabulary order within each selected set.",
    ranked_labels: ranked,
    ladders: [],
    blockers: [],
  };

  for (const size of sizes) {
    const selectedRanked = ranked.slice(0, size);
    const selectedSet = new Set(selectedRanked.map((item) => item.label_id));
    const outputDir = path.join(args.outputRoot, `${String(size).padStart(3, "0")}-labels`);
    const ladder = {
      label_count: size,
      selected_label_ids_by_rank: selectedRanked.map((item) => item.label_id),
      selected_labels_manifest_order: manifests.train.labels
        .filter((label) => selectedSet.has(label.label_id))
        .map((label) => label.label_id),
      output_dir: projectRelative(outputDir),
      manifests: {},
    };
    for (const [split, source] of Object.entries(manifests)) {
      const file = path.join(outputDir, `${split}.json`);
      const manifest = buildManifest(source, selectedSet, size, split, args.manifests[split], file);
      const counts = clipCountsByLabel(manifest.clips);
      if (Object.values(counts).some((count) => count < 1)) {
        throw new Error(`ladder ${size} ${split} has an underfilled selected label`);
      }
      if (args.write) writeJson(file, manifest);
      ladder.manifests[split] = {
        path: projectRelative(file),
        sha256: args.write ? sha256File(file) : null,
        clip_count: manifest.clips.length,
        clips_per_label_min: Math.min(...Object.values(counts)),
        clips_per_label_max: Math.max(...Object.values(counts)),
      };
    }
    output.ladders.push(ladder);
  }

  if (args.write) writeJson(args.summary, output);
  output.summary = { path: projectRelative(args.summary), sha256: args.write ? sha256File(args.summary) : null };
  console.log(stableJson(output));
  if (!args.write) {
    console.error("Dry run only. Re-run with --write to write diagnostic ladder manifests.");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
