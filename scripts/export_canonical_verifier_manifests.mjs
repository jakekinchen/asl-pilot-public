import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceManifests = {
  train: path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-high-coverage-025", "train.json"),
  validation: path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-high-coverage-025", "validation.json"),
  test: path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-high-coverage-025", "test.json"),
};
const hardNegativeManifests = {
  validation: path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-reject-ood", "validation.json"),
  test: path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-reject-ood", "test.json"),
};
const negativeChallengeManifest = path.join(root, "data", "manifests", "negative-challenge.json");
const selectionReport = path.join(
  root,
  "artifacts",
  "rawframe-model-diagnostics",
  "prompt-classifier-verifier-high-coverage-025-asl-citizen-reject-motion-e20",
  "validation-report.json",
);
const outputRoot = path.join(root, "data", "manifests", "diagnostics", "canonical-verifier-010");
const summaryPath = path.join(root, "docs", "validation", "canonical-verifier-manifests.json");

function parseArgs(argv) {
  const args = {
    write: false,
    labelCount: 10,
    templateClipsPerLabel: 8,
    wrongPromptsPerClip: 3,
    hardNegativeClipLimit: 80,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") args.help = true;
    else if (item === "--write") args.write = true;
    else if (item === "--label-count") args.labelCount = positiveInt(argv[++index], item);
    else if (item === "--template-clips-per-label") args.templateClipsPerLabel = positiveInt(argv[++index], item);
    else if (item === "--wrong-prompts-per-clip") args.wrongPromptsPerClip = positiveInt(argv[++index], item);
    else if (item === "--hard-negative-clip-limit") args.hardNegativeClipLimit = positiveInt(argv[++index], item);
    else throw new Error(`Unknown argument: ${item}`);
  }
  if (args.labelCount < 8 || args.labelCount > 12) {
    throw new Error("--label-count must stay in the prompt-scoped 8-12 range");
  }
  return args;
}

function positiveInt(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function usage() {
  console.log(`Usage:
  node scripts/export_canonical_verifier_manifests.mjs [--write]

Exports an 8-12 sign canonical-verifier planning bundle from approved current
diagnostic raw-video manifests. This does not extract helper features, train a
model, tune thresholds, or promote browser artifacts.
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function stableSortKey(clip) {
  return crypto.createHash("sha256").update([
    clip.label_id,
    clip.clip_id,
    clip.sha256,
    clip.signer_identity_hash,
  ].map((value) => String(value ?? "")).join("\t")).digest("hex");
}

function manifestRelative(outputManifestPath, sourceManifestPath, relativePath) {
  const absolute = path.resolve(path.dirname(sourceManifestPath), relativePath);
  return path.relative(path.dirname(outputManifestPath), absolute).split(path.sep).join("/") || ".";
}

function rewriteClip(clip, split, sourceManifestPath, outputManifestPath, role) {
  const next = structuredClone(clip);
  next.split = split;
  next.canonical_verifier_role = role;
  next.relative_video_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_video_path);
  if (clip.relative_frame_tensor_path) {
    next.relative_frame_tensor_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_frame_tensor_path);
  }
  if (next.frame_tensor_provenance?.source_video?.relative_video_path) {
    next.frame_tensor_provenance.source_video.relative_video_path = next.relative_video_path;
  }
  return next;
}

function selectLabels(report, labelCount) {
  const perClass = report?.test?.per_class ?? {};
  return Object.entries(perClass)
    .map(([labelId, metrics]) => ({
      label_id: labelId,
      f1: Number(metrics.f1 ?? 0),
      precision: Number(metrics.precision ?? 0),
      recall: Number(metrics.recall ?? 0),
      support: Number(metrics.support ?? 0),
    }))
    .filter((row) => row.support >= 15)
    .sort((left, right) => (
      right.f1 - left.f1 ||
      right.precision - left.precision ||
      right.recall - left.recall ||
      right.support - left.support ||
      left.label_id.localeCompare(right.label_id)
    ))
    .slice(0, labelCount);
}

function clipsByLabel(manifest, selectedIds) {
  const result = new Map(selectedIds.map((labelId) => [labelId, []]));
  for (const clip of manifest.clips ?? []) {
    if (!result.has(clip.label_id)) continue;
    result.get(clip.label_id).push(clip);
  }
  for (const clips of result.values()) {
    clips.sort((left, right) => stableSortKey(left).localeCompare(stableSortKey(right)));
  }
  return result;
}

function buildPositiveManifest(sourceManifest, sourcePath, outputPath, split, selectedIds, role, maxPerLabel = null) {
  const byLabel = clipsByLabel(sourceManifest, selectedIds);
  const clips = [];
  for (const labelId of selectedIds) {
    const labelClips = byLabel.get(labelId) ?? [];
    const selected = maxPerLabel ? labelClips.slice(0, maxPerLabel) : labelClips;
    clips.push(...selected.map((clip) => rewriteClip(clip, split, sourcePath, outputPath, role)));
  }
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-canonical-verifier-010-v0",
    dataset_source_mode: sourceManifest.dataset_source_mode,
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot team",
    source_register: sourceManifest.source_register,
    supplemental_external_dataset_imports: sourceManifest.supplemental_external_dataset_imports,
    external_dataset_import: sourceManifest.external_dataset_import,
    preprocessing: sourceManifest.preprocessing,
    diagnostic_evidence: {
      schema_version: "asl-pilot-canonical-verifier-manifests/v1",
      finality: "canonical_verifier_planning_not_model_evidence",
      role,
      source_manifest: fileReference(sourcePath),
      selection_report: fileReference(selectionReport),
    },
    labels: sourceManifest.labels.filter((label) => selectedIds.includes(label.label_id)),
    clips,
  };
}

function buildHardNegativeManifest(sourceManifest, sourcePath, outputPath, split, limit, role) {
  const clips = [...(sourceManifest.clips ?? [])]
    .sort((left, right) => stableSortKey(left).localeCompare(stableSortKey(right)))
    .slice(0, limit)
    .map((clip) => rewriteClip(clip, split, sourcePath, outputPath, role));
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-canonical-verifier-hard-negative-v0",
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot team",
    source_register: sourceManifest.source_register,
    supplemental_external_dataset_imports: sourceManifest.supplemental_external_dataset_imports,
    external_dataset_import: sourceManifest.external_dataset_import,
    preprocessing: sourceManifest.preprocessing,
    diagnostic_evidence: {
      schema_version: "asl-pilot-canonical-verifier-manifests/v1",
      finality: "canonical_verifier_hard_negative_planning_not_model_evidence",
      role,
      source_manifest: fileReference(sourcePath),
    },
    labels: [{ label_id: "__reject__", display_text: "Reject" }],
    clips,
  };
}

function buildWrongPromptPairs(manifest, selectedIds, wrongPromptsPerClip) {
  const pairs = [];
  for (const clip of manifest.clips) {
    const wrongLabels = selectedIds
      .filter((labelId) => labelId !== clip.label_id)
      .sort((left, right) => stablePairKey(clip, left).localeCompare(stablePairKey(clip, right)))
      .slice(0, wrongPromptsPerClip);
    for (const promptLabelId of wrongLabels) {
      pairs.push({
        clip_id: clip.clip_id,
        true_label_id: clip.label_id,
        prompted_label_id: promptLabelId,
        expected_outcome: "reject_wrong_prompt",
      });
    }
  }
  return pairs;
}

function stablePairKey(clip, labelId) {
  return crypto.createHash("sha256").update(`${clip.clip_id}\t${labelId}`).digest("hex");
}

function countBy(clips, key) {
  const counts = {};
  for (const clip of clips) {
    const value = clip[key] ?? null;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function summarizeManifest(file, manifest) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
    clip_count: manifest.clips.length,
    label_counts: countBy(manifest.clips, "label_id"),
    source_id_counts: countBy(manifest.clips, "source_id"),
  };
}

function build(args) {
  const report = readJson(selectionReport);
  const selectedLabels = selectLabels(report, args.labelCount);
  const selectedIds = selectedLabels.map((row) => row.label_id);
  const train = readJson(sourceManifests.train);
  const validation = readJson(sourceManifests.validation);
  const test = readJson(sourceManifests.test);
  const hardValidation = readJson(hardNegativeManifests.validation);
  const hardTest = readJson(hardNegativeManifests.test);
  const coreNegative = readJson(negativeChallengeManifest);

  const files = {
    templates: path.join(outputRoot, "templates.json"),
    calibration: path.join(outputRoot, "calibration.json"),
    test: path.join(outputRoot, "test.json"),
    hardNegativeCalibration: path.join(outputRoot, "hard_negative_calibration.json"),
    hardNegativeTest: path.join(outputRoot, "hard_negative_test.json"),
    coreNegative: path.join(outputRoot, "core_negative_challenge.json"),
    wrongPromptCalibration: path.join(outputRoot, "wrong_prompt_calibration.json"),
    wrongPromptTest: path.join(outputRoot, "wrong_prompt_test.json"),
  };
  const manifests = {
    templates: buildPositiveManifest(
      train,
      sourceManifests.train,
      files.templates,
      "canonical_templates",
      selectedIds,
      "source_templates",
      args.templateClipsPerLabel,
    ),
    calibration: buildPositiveManifest(
      validation,
      sourceManifests.validation,
      files.calibration,
      "canonical_calibration",
      selectedIds,
      "positive_calibration",
    ),
    test: buildPositiveManifest(
      test,
      sourceManifests.test,
      files.test,
      "canonical_test",
      selectedIds,
      "positive_test",
    ),
    hardNegativeCalibration: buildHardNegativeManifest(
      hardValidation,
      hardNegativeManifests.validation,
      files.hardNegativeCalibration,
      "canonical_hard_negative_calibration",
      args.hardNegativeClipLimit,
      "hard_negative_calibration",
    ),
    hardNegativeTest: buildHardNegativeManifest(
      hardTest,
      hardNegativeManifests.test,
      files.hardNegativeTest,
      "canonical_hard_negative_test",
      args.hardNegativeClipLimit,
      "hard_negative_test",
    ),
    coreNegative: buildHardNegativeManifest(
      coreNegative,
      negativeChallengeManifest,
      files.coreNegative,
      "canonical_core_negative_challenge",
      args.hardNegativeClipLimit,
      "core_negative_challenge",
    ),
  };
  const wrongPromptCalibration = {
    schema_version: "asl-pilot-canonical-verifier-wrong-prompt-pairs/v1",
    split: "canonical_calibration",
    positive_manifest: fileReference(files.calibration),
    selected_label_ids: selectedIds,
    pairs: buildWrongPromptPairs(manifests.calibration, selectedIds, args.wrongPromptsPerClip),
  };
  const wrongPromptTest = {
    schema_version: "asl-pilot-canonical-verifier-wrong-prompt-pairs/v1",
    split: "canonical_test",
    positive_manifest: fileReference(files.test),
    selected_label_ids: selectedIds,
    pairs: buildWrongPromptPairs(manifests.test, selectedIds, args.wrongPromptsPerClip),
  };
  const summary = {
    schema_version: "asl-pilot-canonical-verifier-manifests/v1",
    status: "written",
    finality: "canonical_verifier_planning_not_model_evidence",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_canonical_verifier_manifests.mjs")),
      command: process.argv,
    },
    selection: {
      policy: "top retained per-class F1 from failed augmented 25-label classifier-verifier, used only to choose a smaller canonical-verifier candidate set",
      source_report: fileReference(selectionReport),
      requested_label_count: args.labelCount,
      selected_label_count: selectedIds.length,
      selected_labels: selectedLabels,
    },
    helper_feature_boundary: {
      helper_feature_status: "not_extracted_yet",
      helper_pretrained_components: [],
      official_decision_model_status: "not_implemented",
      allowed_next_helper_role: "preprocessing_or_quality_gate_only_with_recorded_provenance",
      limitation: "This bundle exports source clips and evaluation structure only; it is not a helper-feature artifact, trained model, threshold set, or browser-promotable verifier.",
    },
    first_party_capture: {
      status: fs.existsSync(path.join(root, "data", "asl-pilot-store.json")) ? "store_present_not_exported_here" : "absent",
      included_clip_count: 0,
    },
    output_manifests: Object.fromEntries(Object.entries(manifests).map(([key, manifest]) => [key, summarizeManifest(files[key], manifest)])),
    wrong_prompt_pairs: {
      calibration: {
        path: projectRelative(files.wrongPromptCalibration),
        exists: fs.existsSync(files.wrongPromptCalibration),
        sha256: fs.existsSync(files.wrongPromptCalibration) ? sha256File(files.wrongPromptCalibration) : null,
        pair_count: wrongPromptCalibration.pairs.length,
      },
      test: {
        path: projectRelative(files.wrongPromptTest),
        exists: fs.existsSync(files.wrongPromptTest),
        sha256: fs.existsSync(files.wrongPromptTest) ? sha256File(files.wrongPromptTest) : null,
        pair_count: wrongPromptTest.pairs.length,
      },
    },
    validation_contract: {
      metric: "prompt_conditioned_balanced_accuracy",
      tune_only_on: ["templates", "calibration", "wrong_prompt_calibration", "hard_negative_calibration", "core_negative_challenge_if_used_for_gate_design"],
      final_test_inputs: ["test", "wrong_prompt_test", "hard_negative_test"],
      no_same_user_reference_capture: true,
      no_threshold_retuning_after_test: true,
    },
    blockers: [
      "helper feature extraction is not implemented",
      "project-owned canonical verifier decisions are not implemented",
      "no first-party clips are included",
      "no thresholds, validation metrics, model card, or browser wiring are produced by this exporter",
    ],
  };
  return { manifests, wrongPromptCalibration, wrongPromptTest, summary, files };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const { manifests, wrongPromptCalibration, wrongPromptTest, summary, files } = build(args);
  if (args.write) {
    for (const [key, manifest] of Object.entries(manifests)) {
      writeJson(files[key], manifest);
    }
    writeJson(files.wrongPromptCalibration, wrongPromptCalibration);
    writeJson(files.wrongPromptTest, wrongPromptTest);
    const rebuilt = build(args).summary;
    writeJson(summaryPath, rebuilt);
    console.log(JSON.stringify({
      status: rebuilt.status,
      summary: projectRelative(summaryPath),
      selected_label_ids: rebuilt.selection.selected_labels.map((row) => row.label_id),
      output_manifests: rebuilt.output_manifests,
      wrong_prompt_pairs: rebuilt.wrong_prompt_pairs,
      blockers: rebuilt.blockers,
    }, null, 2));
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main();
