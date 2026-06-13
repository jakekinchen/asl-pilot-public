import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const selectedImportPath = path.join(root, "docs", "research", "asl-citizen-selected-raw-clip-import.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const sourceReviewPath = path.join(root, "docs", "research", "asl-citizen-academic-source-review.md");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const diagnosticOutputRoot = path.join(root, "data", "manifests", "diagnostics", "asl-citizen-selected");
const lessonMilestoneOutputRoot = path.join(root, "data", "manifests", "lesson", "rawframe-milestone");
const diagnosticSummaryPath = path.join(root, "docs", "validation", "asl-citizen-selected-manifests.json");
const lessonMilestoneSummaryPath = path.join(root, "docs", "validation", "return-to-form-asl-citizen-lesson-milestone-manifests-v1.json");
const vocabularyReviewEvidencePath = path.join(root, "docs", "validation", "asl-citizen-selected-vocabulary-review-evidence.json");
const schemaVersion = "asl-pilot-asl-citizen-selected-manifests/v1";
const lessonMilestoneSchemaVersion = "asl-pilot-asl-citizen-lesson-milestone-manifests/v1";
const splitNames = ["train", "validation", "test"];

function parseArgs(argv) {
  const args = { write: false, lessonMilestone: false };
  for (const item of argv) {
    if (item === "--help") args.help = true;
    else if (item === "--write") args.write = true;
    else if (item === "--lesson-milestone") args.lessonMilestone = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_asl_citizen_selected_manifests.mjs [--write] [--lesson-milestone]

Builds source-bound diagnostic manifests from the selected ASL Citizen raw clip
import. These manifests use official ASL Citizen train/validation/test splits
and are limited to the noncommercial school-assignment raw-video scope.

Use --lesson-milestone with --write to also write the strict lesson milestone
manifests under data/manifests/lesson/rawframe-milestone/.
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

function sha256Json(value) {
  return sha256Text(`${JSON.stringify(value, null, 2)}\n`);
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

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return new Map([...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => [
    match[1],
    { label_id: match[1], display_text: match[2] },
  ]));
}

function sourceDecision(register) {
  const source = (register.sources ?? []).find((item) => item?.source_id === "asl-citizen-school-assignment-raw-videos");
  if (!source) throw new Error("source register is missing asl-citizen-school-assignment-raw-videos");
  return source;
}

function makeSignerIdentityHash(participantId) {
  return sha256Text(`asl-citizen-school-assignment-raw-videos participant ${participantId}`);
}

function makeClipId(clip) {
  const base = path.basename(clip.source_archive_path, path.extname(clip.source_archive_path));
  return `asl-citizen-${clip.split}-${clip.label_id}-${base}`.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function buildVocabularyReviewEvidence(labels, source) {
  return {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "source_curated",
    evidence_mode: "asl_citizen_selected_raw_clip_import",
    source_id: source.source_id,
    rationale: "The 25 lesson-milestone labels are the reviewed ASL Pilot vocabulary items that have selected ASL Citizen raw-video clips in the approved noncommercial school-assignment source scope.",
    vocabulary_source: {
      path: projectRelative(selectedImportPath),
      sha256: sha256File(selectedImportPath),
    },
    item_count: labels.length,
    approved_item_ids: labels.map((label) => label.label_id),
    source_basis: [
      {
        path: projectRelative(selectedImportPath),
        sha256: sha256File(selectedImportPath),
        purpose: "Selected ASL Citizen raw-video clip import and label set.",
      },
      {
        path: projectRelative(sourceReviewPath),
        sha256: sha256File(sourceReviewPath),
        purpose: "Approved noncommercial school-assignment raw-video source review.",
      },
      {
        path: projectRelative(vocabularyPath),
        sha256: sha256File(vocabularyPath),
        purpose: "ASL Pilot vocabulary display labels.",
      },
    ],
    external_review: {
      required_for_this_source_curated_manifest: false,
      completed: false,
      claim: "No external Deaf educator, ASL instructor, or reviewer approval is claimed by this evidence.",
    },
    limitations: [
      "This evidence selects source-curated labels for a local lesson-milestone dry-run only.",
      "It does not promote a browser model, thresholds, final readiness, or redistributed ASL Citizen media.",
    ],
  };
}

function vocabularyReviewReference(labels, evidence) {
  return {
    status: evidence.status,
    evidence: {
      path: projectRelative(vocabularyReviewEvidencePath),
      sha256: sha256Json(evidence),
    },
    vocabulary_source: {
      path: projectRelative(selectedImportPath),
      sha256: sha256File(selectedImportPath),
      item_count: labels.length,
    },
  };
}

function buildClip(clip, split, outputManifestPath, source) {
  const sourceVideoPath = path.join(root, clip.relative_video_path);
  return {
    allowed_for_model_training: true,
    clip_id: makeClipId(clip),
    derived_features: [],
    frame_source: "raw_rgb_video",
    label_id: clip.label_id,
    relative_video_path: manifestRelative(outputManifestPath, sourceVideoPath),
    review: {
      label_review_status: "approved",
      label_reviewer: "asl-citizen-source-label-plus-asl-pilot-import-audit",
      reviewed_at: "2026-05-22T01:40:00Z",
    },
    sha256: clip.sha256,
    signer_id: `asl-citizen-participant-${clip.participant_id}`,
    signer_identity_hash: makeSignerIdentityHash(clip.participant_id),
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
    source_split: split,
    source_subject_rights_evidence: {
      path: projectRelative(sourceReviewPath),
      sha256: sha256File(sourceReviewPath),
    },
    source_video_path: clip.relative_video_path,
    split,
  };
}

function buildManifest({
  split,
  labels,
  clips,
  outputManifestPath,
  source,
  datasetId,
  evidenceKey,
  evidenceSchemaVersion,
  finality,
  vocabularyReview = null,
}) {
  const manifest = {
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
    },
    [evidenceKey]: {
      schema_version: evidenceSchemaVersion,
      finality,
      split_policy: "official_asl_citizen_train_validation_test_splits",
      selected_import: {
        path: projectRelative(selectedImportPath),
        sha256: sha256File(selectedImportPath),
      },
      source_review: {
        path: projectRelative(sourceReviewPath),
        sha256: sha256File(sourceReviewPath),
      },
    },
    labels,
    clips: clips.map((clip) => buildClip(clip, split, outputManifestPath, source)),
  };
  if (vocabularyReview) manifest.vocabulary_review = vocabularyReview;
  return manifest;
}

function buildManifests({ outputRoot, labels, clipsBySplit, source, lessonMilestone, vocabularyReview }) {
  return Object.fromEntries(splitNames.map((split) => {
    const outputManifestPath = path.join(outputRoot, `${split}.json`);
    return [split, buildManifest({
      split,
      labels,
      clips: clipsBySplit[split],
      outputManifestPath,
      source,
      datasetId: lessonMilestone
        ? "asl-pilot-asl-citizen-lesson-milestone-v0"
        : "asl-pilot-asl-citizen-selected-diagnostic-v0",
      evidenceKey: lessonMilestone ? "lesson_milestone_evidence" : "diagnostic_evidence",
      evidenceSchemaVersion: lessonMilestone ? lessonMilestoneSchemaVersion : schemaVersion,
      finality: lessonMilestone
        ? "lesson_milestone_manifest_not_training_or_model_promotion"
        : "diagnostic_not_final_evidence",
      vocabularyReview,
    })];
  }));
}

function summarizeOutputManifests({ outputRoot, manifests, args }) {
  return Object.fromEntries(splitNames.map((split) => {
    const manifestPath = path.join(outputRoot, `${split}.json`);
    const manifest = args.write && fs.existsSync(manifestPath) ? readJson(manifestPath) : manifests[split];
    return [split, {
      path: projectRelative(manifestPath),
      exists: fs.existsSync(manifestPath),
      sha256: fs.existsSync(manifestPath) ? sha256File(manifestPath) : null,
      label_count: manifest.labels.length,
      clip_count: manifest.clips.length,
      participant_count: new Set(manifest.clips.map((clip) => clip.signer_id)).size,
      min_clips_per_label: Math.min(...manifest.labels.map((label) => manifest.clips.filter((clip) => clip.label_id === label.label_id).length)),
    }];
  }));
}

function build(args) {
  const selectedImport = readJson(selectedImportPath);
  if (selectedImport.status !== "selected_raw_clips_imported") {
    throw new Error(`ASL Citizen selected import is not ready: ${selectedImport.status}`);
  }
  const register = readJson(sourceRegisterPath);
  const source = sourceDecision(register);
  const vocabularyLabels = readVocabularyLabels();
  const selectedLabelIds = Object.keys(selectedImport.selected_counts ?? {});
  const labels = selectedLabelIds.map((labelId) => {
    const label = vocabularyLabels.get(labelId);
    if (!label) throw new Error(`selected label is absent from vocabulary: ${labelId}`);
    return label;
  });
  const clipsBySplit = Object.fromEntries(splitNames.map((split) => [split, []]));
  for (const clip of selectedImport.clips ?? []) {
    if (!splitNames.includes(clip.split)) throw new Error(`unknown ASL Citizen split: ${clip.split}`);
    const file = path.join(root, clip.relative_video_path);
    if (!fs.existsSync(file)) throw new Error(`selected ASL Citizen clip is missing: ${clip.relative_video_path}`);
    const actualSha = sha256File(file);
    if (actualSha !== clip.sha256) {
      throw new Error(`selected ASL Citizen clip hash mismatch for ${clip.relative_video_path}`);
    }
    clipsBySplit[clip.split].push(clip);
  }
  const diagnosticManifests = buildManifests({
    outputRoot: diagnosticOutputRoot,
    labels,
    clipsBySplit,
    source,
    lessonMilestone: false,
    vocabularyReview: null,
  });
  const vocabularyReviewEvidence = buildVocabularyReviewEvidence(labels, source);
  const lessonManifests = buildManifests({
    outputRoot: lessonMilestoneOutputRoot,
    labels,
    clipsBySplit,
    source,
    lessonMilestone: true,
    vocabularyReview: vocabularyReviewReference(labels, vocabularyReviewEvidence),
  });
  const diagnosticSummary = {
    schema_version: schemaVersion,
    status: "written",
    finality: "diagnostic_manifests_not_model_promotion",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_asl_citizen_selected_manifests.mjs")),
      command: process.argv,
    },
    inputs: {
      selected_import: fileReference(selectedImportPath),
      source_register: fileReference(sourceRegisterPath),
      source_review: fileReference(sourceReviewPath),
      vocabulary: fileReference(vocabularyPath),
    },
    split_policy: {
      source: "official_asl_citizen_train_validation_test_splits",
      limitation: "Noncommercial school-assignment diagnostic raw-video import; do not redistribute raw clips.",
    },
    label_count: labels.length,
    selected_clip_count: selectedImport.selected_clip_count,
    output_manifests: summarizeOutputManifests({
      outputRoot: diagnosticOutputRoot,
      manifests: diagnosticManifests,
      args,
    }),
    blockers: [],
  };
  const lessonSummary = {
    schema_version: lessonMilestoneSchemaVersion,
    status: "written",
    finality: "lesson_milestone_manifests_not_training_or_model_promotion",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_asl_citizen_selected_manifests.mjs")),
      command: process.argv,
    },
    inputs: {
      selected_import: fileReference(selectedImportPath),
      source_register: fileReference(sourceRegisterPath),
      source_review: fileReference(sourceReviewPath),
      vocabulary: fileReference(vocabularyPath),
      vocabulary_review_evidence: fs.existsSync(vocabularyReviewEvidencePath)
        ? fileReference(vocabularyReviewEvidencePath)
        : {
          path: projectRelative(vocabularyReviewEvidencePath),
          exists: false,
          sha256: sha256Json(vocabularyReviewEvidence),
        },
    },
    split_policy: {
      source: "official_asl_citizen_train_validation_test_splits",
      limitation: "Noncommercial school-assignment lesson-milestone raw-video manifest; do not redistribute raw clips.",
    },
    dataset_source_mode: "approved_external_raw_video_source",
    source_id: source.source_id,
    label_count: labels.length,
    selected_clip_count: selectedImport.selected_clip_count,
    diagnostic_manifest_refresh: diagnosticSummary.output_manifests,
    output_manifests: summarizeOutputManifests({
      outputRoot: lessonMilestoneOutputRoot,
      manifests: lessonManifests,
      args,
    }),
    no_training_boundary: {
      writes_manifests_only: true,
      starts_training: false,
      promotes_model: false,
      spends_brev: false,
      imports_media: false,
    },
    blockers: [],
  };
  return {
    diagnosticManifests,
    lessonManifests,
    vocabularyReviewEvidence,
    diagnosticSummary,
    lessonSummary,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const { diagnosticManifests, lessonManifests, vocabularyReviewEvidence } = build(args);
  if (args.write) {
    for (const [split, manifest] of Object.entries(diagnosticManifests)) {
      writeJson(path.join(diagnosticOutputRoot, `${split}.json`), manifest);
    }
    if (args.lessonMilestone) {
      writeJson(vocabularyReviewEvidencePath, vocabularyReviewEvidence);
      for (const [split, manifest] of Object.entries(lessonManifests)) {
        writeJson(path.join(lessonMilestoneOutputRoot, `${split}.json`), manifest);
      }
    }
    const { diagnosticSummary, lessonSummary } = build(args);
    writeJson(diagnosticSummaryPath, diagnosticSummary);
    if (args.lessonMilestone) writeJson(lessonMilestoneSummaryPath, lessonSummary);
    const output = {
      status: diagnosticSummary.status,
      summary: projectRelative(diagnosticSummaryPath),
      label_count: diagnosticSummary.label_count,
      selected_clip_count: diagnosticSummary.selected_clip_count,
      output_manifests: diagnosticSummary.output_manifests,
      blockers: diagnosticSummary.blockers,
    };
    if (args.lessonMilestone) {
      output.lesson_milestone = {
        status: lessonSummary.status,
        summary: projectRelative(lessonMilestoneSummaryPath),
        vocabulary_review_evidence: lessonSummary.inputs.vocabulary_review_evidence,
        output_manifests: lessonSummary.output_manifests,
        blockers: lessonSummary.blockers,
      };
    }
    console.log(JSON.stringify(output, null, 2));
  } else {
    const { diagnosticSummary, lessonSummary } = build(args);
    console.log(JSON.stringify(args.lessonMilestone ? lessonSummary : diagnosticSummary, null, 2));
  }
}

main();
