import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const sourceReviewPath = path.join(root, "docs", "research", "asl-citizen-academic-source-review.md");
const defaultSelectedImportPath = path.join(root, "docs", "research", "asl-citizen-primarymath-remediation-raw-clip-import.json");
const defaultOutputRoot = path.join(root, "data", "manifests", "diagnostics", "asl-citizen-primarymath-remediation-raw");
const defaultSummaryPath = path.join(root, "docs", "validation", "asl-citizen-primarymath-remediation-manifests.json");
const defaultDatasetId = "asl-pilot-asl-citizen-primarymath-remediation-raw-v0";
const splitNames = ["train", "validation", "test"];

function parseArgs(argv) {
  const args = {
    write: false,
    selectedImportPath: defaultSelectedImportPath,
    outputRoot: defaultOutputRoot,
    summaryPath: defaultSummaryPath,
    datasetId: defaultDatasetId,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") args.help = true;
    else if (item === "--write") args.write = true;
    else if (item === "--selected-import") args.selectedImportPath = path.resolve(root, argv[++index] ?? "");
    else if (item === "--output-root") args.outputRoot = path.resolve(root, argv[++index] ?? "");
    else if (item === "--summary") args.summaryPath = path.resolve(root, argv[++index] ?? "");
    else if (item === "--dataset-id") args.datasetId = argv[++index] ?? "";
    else throw new Error(`Unknown argument: ${item}`);
  }
  if (!args.datasetId) throw new Error("--dataset-id must not be empty");
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_asl_citizen_selected_raw_clip_manifests.mjs [--write]
    [--selected-import <path>] [--output-root <path>] [--summary <path>]
    [--dataset-id <id>]

Builds source-bound raw RGB manifests from a selected ASL Citizen byte-range
clip import. This is for academic source remediation planning and does not
claim ROI crops, keypoints, or browser-domain model-card evidence.
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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function manifestRelative(manifestPath, targetPath) {
  return path.relative(path.dirname(manifestPath), targetPath).split(path.sep).join("/");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function sourceDecision(register) {
  const source = (register.sources ?? []).find((item) => item?.source_id === "asl-citizen-school-assignment-raw-videos");
  if (!source) throw new Error("source register is missing asl-citizen-school-assignment-raw-videos");
  return source;
}

function displayText(labelId) {
  return labelId
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function signerIdentityHash(participantId) {
  return sha256Text(`asl-citizen-school-assignment-raw-videos participant ${participantId}`);
}

function clipId(clip, datasetId) {
  const base = path.basename(clip.source_archive_path, path.extname(clip.source_archive_path));
  return `${datasetId}-${clip.split}-${clip.label_id}-${base}`.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function countBy(rows, keyFn) {
  const output = {};
  for (const row of rows) {
    const key = keyFn(row);
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}

function buildClip({ clip, outputManifestPath, source, datasetId, existingByClipId }) {
  const sourceVideoPath = path.join(root, clip.relative_video_path);
  const id = clipId(clip, datasetId);
  const existing = existingByClipId.get(id);
  const output = {
    allowed_for_model_training: true,
    clip_id: id,
    derived_features: [],
    frame_source: "raw_rgb_video",
    label_id: clip.label_id,
    relative_video_path: manifestRelative(outputManifestPath, sourceVideoPath),
    review: {
      label_review_status: "source_label_accepted_for_scoped_academic_remediation_benchmark",
      label_reviewer: "asl-citizen-primarymath-remediation-import-audit",
      reviewed_at: "2026-05-22T00:00:00Z",
    },
    sha256: clip.sha256,
    signer_id: `asl-citizen-participant-${clip.participant_id}`,
    signer_identity_hash: signerIdentityHash(clip.participant_id),
    source_archive_path: clip.source_archive_path,
    source_archive_crc32: clip.source_archive_crc32,
    source_archive_local_header_offset: clip.source_archive_local_header_offset,
    source_category: "asl_citizen_official_zip_range_selected_raw_video",
    source_file_url: "https://download.microsoft.com/download/b/8/8/b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip",
    source_gloss: clip.gloss,
    source_id: source.source_id,
    source_license_decision: source.decision_id,
    source_license_review_status: source.license_review_status,
    source_record_id: clip.source_archive_path,
    source_sign_slug: clip.label_id,
    source_split: clip.split,
    source_subject_rights_evidence: {
      path: projectRelative(sourceReviewPath),
      sha256: sha256File(sourceReviewPath),
    },
    source_video_path: clip.relative_video_path,
    split: clip.split,
  };
  for (const key of ["relative_frame_tensor_path", "frame_tensor_sha256", "frame_tensor_provenance"]) {
    if (existing?.[key]) output[key] = existing[key];
  }
  return output;
}

function buildManifest({ split, labels, clips, outputManifestPath, source, selectedImportPath, datasetId }) {
  const existingManifest = fs.existsSync(outputManifestPath) ? readJson(outputManifestPath) : null;
  const existingByClipId = new Map((existingManifest?.clips ?? []).map((clip) => [clip.clip_id, clip]));
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: datasetId,
    dataset_source_mode: "approved_external_raw_video_source",
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot team",
    source_register: {
      path: projectRelative(sourceRegisterPath),
      sha256: sha256File(sourceRegisterPath),
      decision_id: source.decision_id,
      license_review_status: source.license_review_status,
    },
    external_dataset_import: {
      source_id: source.source_id,
      source_audit: {
        path: projectRelative(sourceReviewPath),
        sha256: sha256File(sourceReviewPath),
      },
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
      current_manifest_inputs: ["raw_rgb_video"],
      planned_hand_only_steps: [
        "decode_video",
        "sample_frames_deterministically",
        "estimate_union_hand_roi_or_use_reviewed_keypoints",
        "crop_union_hand_roi",
        "resize",
        "normalize_rgb_or_normalize_keypoint_sequence",
      ],
      current_limitation: "This manifest is source-bound raw RGB for the ASL Citizen remediation lane; it does not claim ROI crops or keypoint tensors have been generated.",
    },
    diagnostic_evidence: {
      schema_version: "asl-pilot-asl-citizen-selected-raw-clip-manifests/v1",
      finality: "academic_online_dataset_remediation_manifest_not_model_promotion",
      split_policy: "official_asl_citizen_train_validation_test_splits",
      selected_import: {
        path: projectRelative(selectedImportPath),
        sha256: sha256File(selectedImportPath),
      },
    },
    labels,
    clips: clips.map((clip) => buildClip({ clip, outputManifestPath, source, datasetId, existingByClipId })),
  };
}

function build(args) {
  const selectedImport = readJson(args.selectedImportPath);
  if (selectedImport.status !== "selected_raw_clips_imported") {
    throw new Error(`selected ASL Citizen import is not ready: ${selectedImport.status}`);
  }
  const register = readJson(sourceRegisterPath);
  const source = sourceDecision(register);
  const labelIds = Object.keys(selectedImport.selected_counts ?? {}).sort();
  if (labelIds.length === 0) throw new Error("selected import has no labels");
  const labels = labelIds.map((labelId) => ({ label_id: labelId, display_text: displayText(labelId) }));
  const clipsBySplit = Object.fromEntries(splitNames.map((split) => [split, []]));
  let decodedTensorCount = 0;
  for (const clip of selectedImport.clips ?? []) {
    if (!splitNames.includes(clip.split)) throw new Error(`unknown ASL Citizen split: ${clip.split}`);
    if (!labelIds.includes(clip.label_id)) throw new Error(`clip label is missing from selected_counts: ${clip.label_id}`);
    const file = path.join(root, clip.relative_video_path);
    if (!fs.existsSync(file)) throw new Error(`selected ASL Citizen clip is missing: ${clip.relative_video_path}`);
    const actualSha = sha256File(file);
    if (actualSha !== clip.sha256) throw new Error(`selected ASL Citizen clip hash mismatch: ${clip.relative_video_path}`);
    clipsBySplit[clip.split].push(clip);
  }
  const manifests = Object.fromEntries(splitNames.map((split) => {
    const outputManifestPath = path.join(args.outputRoot, `${split}.json`);
    return [split, buildManifest({
      split,
      labels,
      clips: clipsBySplit[split],
      outputManifestPath,
      source,
      selectedImportPath: args.selectedImportPath,
      datasetId: args.datasetId,
    })];
  }));
  if (args.write) {
    for (const [split, manifest] of Object.entries(manifests)) {
      writeJson(path.join(args.outputRoot, `${split}.json`), manifest);
    }
  }
  const outputManifests = Object.fromEntries(splitNames.map((split) => {
    const manifestPath = path.join(args.outputRoot, `${split}.json`);
    const manifest = args.write && fs.existsSync(manifestPath) ? readJson(manifestPath) : manifests[split];
    decodedTensorCount += manifest.clips.filter((clip) => clip.relative_frame_tensor_path && clip.frame_tensor_sha256).length;
    const perLabel = countBy(manifest.clips, (clip) => clip.label_id);
    return [split, {
      path: projectRelative(manifestPath),
      exists: fs.existsSync(manifestPath),
      sha256: fs.existsSync(manifestPath) ? sha256File(manifestPath) : null,
      label_count: manifest.labels.length,
      clip_count: manifest.clips.length,
      participant_count: new Set(manifest.clips.map((clip) => clip.signer_id)).size,
      min_clips_per_label: Math.min(...labelIds.map((labelId) => perLabel[labelId] ?? 0)),
      clips_per_label: Object.fromEntries(labelIds.map((labelId) => [labelId, perLabel[labelId] ?? 0])),
    }];
  }));
  const summary = {
    schema_version: "asl-pilot-asl-citizen-selected-raw-clip-manifests/v1",
    status: args.write ? "written" : "dry_run",
    finality: "academic_online_dataset_remediation_manifest_not_model_promotion",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_asl_citizen_selected_raw_clip_manifests.mjs")),
      command: process.argv,
    },
    source_use_note: {
      source_id: source.source_id,
      license_review_status: source.license_review_status,
      allowed_use: "Noncommercial school-assignment academic benchmark using local ASL Citizen raw RGB videos only.",
      restrictions: [
        "Do not redistribute raw videos, modified videos, extracted frames, local mirrors, or substantial dataset excerpts.",
        "Do not use pretrained models, pose outputs, landmarks, feature caches, or derived CV artifacts in the raw-RGB recognition path unless a separate reviewed helper-feature lane is created.",
      ],
    },
    selection: {
      selected_label_ids: labelIds,
      selection_reason: "PrimaryMath high-support 25-label sparse-label remediation source coverage from ASL Citizen raw videos.",
      gate: {
        heldout_accuracy_min: 0.70,
        macro_recall_or_f1_min: 0.65,
        min_per_class_recall_without_remediation: 0.45,
      },
    },
    inputs: {
      selected_import: fileReference(args.selectedImportPath),
      source_register: fileReference(sourceRegisterPath),
      source_review: fileReference(sourceReviewPath),
    },
    split_policy: {
      source: "official_asl_citizen_train_validation_test_splits",
      signer_disjoint: true,
      limitation: "Academic online-dataset remediation benchmark only; does not prove PrimaryMath keypoint performance or first-party browser-domain generalization.",
    },
    preprocessing_provenance: {
      current_manifest_inputs: "source-bound raw RGB video references",
      decoded_full_frame_tensor_status: decodedTensorCount === selectedImport.selected_clip_count
        ? "decoded_full_frame_tensors_available"
        : "pending_full_frame_decode",
      hand_only_roi_status: "pending_roi_or_keypoint_extraction",
      planned_model_inputs: "union-hand ROI crops or reviewed hand-keypoint/ROI sequences",
    },
    label_count: labels.length,
    dataset_id: args.datasetId,
    selected_clip_count: selectedImport.selected_clip_count,
    output_manifests: outputManifests,
    blockers: [],
    next_action: decodedTensorCount === selectedImport.selected_clip_count
      ? "Full-frame raw RGB tensors are decoded. Next generate hand-focused ROI/keypoint tensors or improve preprocessing, then rerun the same project-owned trained model plus same-split template baseline gate."
      : "Decode these source-bound raw RGB manifests into hand-only ROI tensors or a documented raw-frame ablation, then run the same project-owned trained model plus same-split template baseline gate.",
  };
  if (args.write) writeJson(args.summaryPath, summary);
  return summary;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const summary = build(args);
  console.log(JSON.stringify({
    status: summary.status,
    summary: projectRelative(args.summaryPath),
    dataset_id: summary.dataset_id,
    label_count: summary.label_count,
    selected_clip_count: summary.selected_clip_count,
    output_manifests: summary.output_manifests,
    blockers: summary.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`ASL Citizen selected raw clip manifest export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
