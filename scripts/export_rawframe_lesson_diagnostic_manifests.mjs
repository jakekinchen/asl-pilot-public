#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const defaultMilestone = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const defaultSplits = {
  train: path.join(root, "data", "manifests", "train.json"),
  validation: path.join(root, "data", "manifests", "validation.json"),
  test: path.join(root, "data", "manifests", "test.json"),
};
const defaultOutputRoot = path.join(root, "data", "manifests", "diagnostics", "rawframe-lesson-milestone");
const defaultSummary = path.join(root, "docs", "validation", "rawframe-lesson-diagnostic-manifests.json");

function usage() {
  return `
Usage:
  node scripts/export_rawframe_lesson_diagnostic_manifests.mjs [--write]

Options:
  --milestone <path>            Default: docs/validation/rawframe-lesson-milestone.json
  --train-manifest <path>       Default: data/manifests/train.json
  --validation-manifest <path>  Default: data/manifests/validation.json
  --test-manifest <path>        Default: data/manifests/test.json
  --output-root <path>          Default: data/manifests/diagnostics/rawframe-lesson-milestone
  --summary <path>              Default: docs/validation/rawframe-lesson-diagnostic-manifests.json
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
    milestone: defaultMilestone,
    manifests: { ...defaultSplits },
    outputRoot: defaultOutputRoot,
    summary: defaultSummary,
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
    } else if (item === "--milestone") {
      args.milestone = resolveProjectPath(next(), item);
    } else if (item === "--train-manifest") {
      args.manifests.train = resolveProjectPath(next(), item);
    } else if (item === "--validation-manifest") {
      args.manifests.validation = resolveProjectPath(next(), item);
    } else if (item === "--test-manifest") {
      args.manifests.test = resolveProjectPath(next(), item);
    } else if (item === "--output-root") {
      args.outputRoot = resolveProjectPath(next(), item);
    } else if (item === "--summary") {
      args.summary = resolveProjectPath(next(), item);
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value));
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

function assertMatchingLabels(manifests) {
  const expected = manifests.train.labels.map((label) => String(label.label_id)).join("\n");
  for (const [split, manifest] of Object.entries(manifests)) {
    const actual = manifest.labels.map((label) => String(label.label_id)).join("\n");
    if (actual !== expected) throw new Error(`${split} manifest labels do not match train label order`);
  }
}

function clipCountsByLabel(clips) {
  const counts = {};
  for (const clip of clips) counts[clip.label_id] = (counts[clip.label_id] ?? 0) + 1;
  return counts;
}

function signerCount(clips) {
  return new Set(clips.map((clip) => String(clip.signer_id ?? "")).filter(Boolean)).size;
}

function buildManifest({
  source,
  sourceManifestPath,
  outputManifestPath,
  selectedSet,
  role,
  labelRoleById,
  milestone,
}) {
  const labels = source.labels
    .filter((label) => selectedSet.has(String(label.label_id)))
    .map((label) => ({
      ...label,
      lesson_milestone_role: labelRoleById.get(String(label.label_id)),
    }));
  const clips = source.clips
    .filter((clip) => selectedSet.has(String(clip.label_id)))
    .map((clip) => ({
      ...rebaseClipPaths(clip, sourceManifestPath, outputManifestPath),
      lesson_milestone_role: labelRoleById.get(String(clip.label_id)),
    }));
  return {
    ...source,
    dataset_id: `${source.dataset_id}-diagnostic-lesson-${milestone.lesson.lesson_id}-${role}`,
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    diagnostic_evidence: {
      schema_version: "asl-pilot-rawframe-lesson-diagnostic-manifest/v1",
      finality: "diagnostic_not_final_model_evidence",
      lesson_id: milestone.lesson.lesson_id,
      role,
      source_manifest_sha256: sha256File(sourceManifestPath),
      target_sign_count: milestone.lesson.target_signs.length,
      near_confusable_sign_count: milestone.lesson.near_confusable_signs.length,
      note:
        "Lesson-level diagnostic manifest. Use only with smoke/reduced-scope evaluation flags; do not promote as final 75-100-label evidence.",
    },
    labels,
    clips,
    vocabulary_review: undefined,
  };
}

function manifestSummary(file, manifest, write) {
  const counts = clipCountsByLabel(manifest.clips);
  return {
    path: projectRelative(file),
    sha256: write ? sha256File(file) : null,
    dataset_id: manifest.dataset_id,
    split: manifest.split,
    label_count: manifest.labels.length,
    clip_count: manifest.clips.length,
    signer_count: signerCount(manifest.clips),
    clips_per_label_min: Math.min(...Object.values(counts)),
    clips_per_label_max: Math.max(...Object.values(counts)),
    role_counts: manifest.labels.reduce((accumulator, label) => {
      const role = label.lesson_milestone_role ?? "unknown";
      accumulator[role] = (accumulator[role] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const milestone = readJson(args.milestone);
  if (milestone.schema_version !== "asl-pilot-rawframe-lesson-milestone/v1") {
    throw new Error("milestone schema_version must be asl-pilot-rawframe-lesson-milestone/v1");
  }
  const manifests = Object.fromEntries(
    Object.entries(args.manifests).map(([split, file]) => [split, readJson(file)]),
  );
  assertMatchingLabels(manifests);

  const targetIds = milestone.lesson.target_signs.map((label) => String(label.label_id));
  const nearIds = milestone.lesson.near_confusable_signs.map((label) => String(label.label_id));
  const targetSet = new Set(targetIds);
  const nearSet = new Set(nearIds);
  const candidateSet = new Set([...targetIds, ...nearIds]);
  const labelRoleById = new Map([
    ...targetIds.map((labelId) => [labelId, "target_sign"]),
    ...nearIds.map((labelId) => [labelId, "near_confusable_wrong_prompt"]),
  ]);

  const specs = [
    { key: "target_train", split: "train", role: "target_sign_train", selectedSet: targetSet },
    { key: "target_validation", split: "validation", role: "target_sign_validation", selectedSet: targetSet },
    { key: "target_test", split: "test", role: "target_sign_test", selectedSet: targetSet },
    { key: "near_confusable_validation", split: "validation", role: "near_confusable_validation", selectedSet: nearSet },
    { key: "near_confusable_test", split: "test", role: "near_confusable_test", selectedSet: nearSet },
    { key: "candidate_train", split: "train", role: "candidate_set_train", selectedSet: candidateSet },
    { key: "candidate_validation", split: "validation", role: "candidate_set_validation", selectedSet: candidateSet },
    { key: "candidate_test", split: "test", role: "candidate_set_test", selectedSet: candidateSet },
  ];

  const output = {
    schema_version: "asl-pilot-rawframe-lesson-diagnostic-manifests/v1",
    status: args.write ? "written" : "dry_run",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/export_rawframe_lesson_diagnostic_manifests.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv.slice(1),
    },
    finality: "diagnostic_not_final_model_evidence",
    inputs: {
      milestone: {
        path: projectRelative(args.milestone),
        sha256: sha256File(args.milestone),
      },
      manifests: Object.fromEntries(
        Object.entries(args.manifests).map(([split, file]) => [
          split,
          { path: projectRelative(file), sha256: sha256File(file) },
        ]),
      ),
    },
    lesson_id: milestone.lesson.lesson_id,
    target_sign_ids: targetIds,
    near_confusable_sign_ids: nearIds,
    hard_negative_taxonomy: milestone.lesson.hard_negative_taxonomy,
    manifest_roles: {},
    blockers: [
      "These manifests are reduced-scope diagnostics and are not final 75-100-label evidence.",
      "Near-confusable manifests support wrong-prompt/reject diagnostics; they do not by themselves provide calibrated open-set thresholds.",
      "Hard-negative taxonomy is defined, but first-party hard-negative clips are still absent.",
    ],
  };

  for (const spec of specs) {
    const source = manifests[spec.split];
    const file = path.join(args.outputRoot, `${spec.key}.json`);
    const manifest = buildManifest({
      source,
      sourceManifestPath: args.manifests[spec.split],
      outputManifestPath: file,
      selectedSet: spec.selectedSet,
      role: spec.role,
      labelRoleById,
      milestone,
    });
    const counts = clipCountsByLabel(manifest.clips);
    if (Object.keys(counts).length !== manifest.labels.length) {
      throw new Error(`${spec.key} has labels without clips`);
    }
    if (args.write) writeJson(file, manifest);
    output.manifest_roles[spec.key] = manifestSummary(file, manifest, args.write);
  }

  if (args.write) writeJson(args.summary, output);
  output.summary = {
    path: projectRelative(args.summary),
    sha256: args.write ? sha256File(args.summary) : null,
  };
  console.log(stableJson(output));
  if (!args.write) {
    console.error("Dry run only. Re-run with --write to write lesson diagnostic manifests.");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
