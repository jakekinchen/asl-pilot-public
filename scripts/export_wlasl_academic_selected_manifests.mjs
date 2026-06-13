import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const selectedImportPath = path.join(root, "docs", "research", "wlasl-academic-selected-raw-clip-import.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const vocabularyReviewPath = path.join(root, "docs", "review", "final-vocabulary-review.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const sourceReviewPath = path.join(root, "docs", "research", "wlasl-academic-source-review.md");
const outputRoot = path.join(root, "data", "manifests", "diagnostics", "wlasl-academic-selected");
const summaryPath = path.join(root, "docs", "validation", "wlasl-academic-selected-manifests.json");
const schemaVersion = "asl-pilot-wlasl-academic-selected-manifests/v1";
const splitNames = ["train", "validation", "test"];

function parseArgs(argv) {
  const args = { write: false, minLabels: 25, searchIterations: 20000 };
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
    if (item === "--min-labels") {
      args.minLabels = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    if (item === "--search-iterations") {
      args.searchIterations = parsePositiveInteger(argv[index + 1], item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_wlasl_academic_selected_manifests.mjs [--write] [--min-labels 25]

Builds source-bound diagnostic train/validation/test manifests from the selected
WLASL academic raw-video import. The split is signer-disjoint and intentionally
diagnostic: it is suitable for small-set pipeline checks, not final model
promotion.
`);
}

function parsePositiveInteger(value, context) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${context}`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${context} must be a positive integer`);
  return parsed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function isDecodableVideo(file) {
  const result = spawnSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nk=1:nw=1",
    file,
  ], { stdio: "ignore" });
  return result.status === 0;
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    label_id: match[1],
    display_text: match[2],
  }));
}

function sourceDecision(register) {
  const source = (register.sources ?? []).find((item) => item?.source_id === "wlasl-school-assignment-raw-videos");
  if (!source) throw new Error("source register is missing wlasl-school-assignment-raw-videos");
  return source;
}

function makeSignerIdentityHash(signerId) {
  return sha256Text(`wlasl-school-assignment-raw-videos signer ${signerId}`);
}

function makeClipId(split, clip) {
  return `wlasl-${split}-${clip.label_id}-${clip.video_id}`;
}

function hostFor(url) {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff);
  };
}

function candidateSignerAssignments(signers, iterations) {
  const assignments = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const random = seededRandom(0x5a17c0de ^ iteration);
    const assignment = {};
    for (const signer of signers) {
      assignment[signer] = splitNames[Math.floor(random() * splitNames.length)];
    }
    assignments.push(assignment);
  }
  return assignments;
}

function splitCountsForLabel(clips, assignment) {
  const counts = { train: 0, validation: 0, test: 0 };
  for (const clip of clips) {
    counts[assignment[String(clip.signer_id)]] += 1;
  }
  return counts;
}

function chooseSignerSplit(clipsByLabel, minLabels, iterations) {
  const signers = [...new Set(Object.values(clipsByLabel).flat().map((clip) => String(clip.signer_id)))].sort();
  let best = null;
  for (const assignment of candidateSignerAssignments(signers, iterations)) {
    const eligible = Object.entries(clipsByLabel)
      .map(([labelId, clips]) => ({ label_id: labelId, split_counts: splitCountsForLabel(clips, assignment) }))
      .filter((label) => splitNames.every((split) => label.split_counts[split] > 0));
    if (!best || eligible.length > best.eligible.length) {
      best = { assignment, eligible };
      if (eligible.length >= minLabels) break;
    }
  }
  if (!best || best.eligible.length < minLabels) {
    throw new Error(`Only found ${best?.eligible.length ?? 0} labels with signer-disjoint split coverage; need ${minLabels}`);
  }
  return best;
}

function buildClip(clip, split, outputManifestPath, source) {
  const localFile = clip.local_file;
  const sourceVideoPath = path.join(root, localFile.path);
  return {
    allowed_for_model_training: true,
    clip_id: makeClipId(split, clip),
    derived_features: [],
    frame_source: "raw_rgb_video",
    label_id: clip.label_id,
    relative_video_path: manifestRelative(outputManifestPath, sourceVideoPath),
    review: {
      label_review_status: "approved",
      label_reviewer: "wlasl-source-label-plus-asl-pilot-import-audit",
      reviewed_at: "2026-05-21T22:30:00Z",
    },
    sha256: localFile.sha256,
    signer_id: `wlasl-signer-${clip.signer_id}`,
    signer_identity_hash: makeSignerIdentityHash(clip.signer_id),
    source_category: "wlasl_original_url",
    source_file_url: clip.url,
    source_host: hostFor(clip.url),
    source_id: source.source_id,
    source_license_decision: source.decision_id,
    source_license_review_status: source.license_review_status,
    source_record_id: `WLASL_v0.3/${clip.label_id}/${clip.video_id}`,
    source_sign_slug: clip.label_id,
    source_split: clip.split,
    source_subject_rights_evidence: {
      path: projectRelative(sourceReviewPath),
      sha256: sha256File(sourceReviewPath),
    },
    source_video_path: localFile.path,
    split,
  };
}

function buildManifest({ split, labels, clips, outputManifestPath, source, sourceRegister }) {
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-wlasl-academic-selected-diagnostic-v0",
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
    diagnostic_evidence: {
      schema_version: schemaVersion,
      finality: "diagnostic_not_final_evidence",
      split_policy: "signer_disjoint_selected_wlasl_source_signers",
      selected_import: {
        path: projectRelative(selectedImportPath),
        sha256: sha256File(selectedImportPath),
      },
    },
    labels,
    clips: clips.map((clip) => buildClip(clip, split, outputManifestPath, source)),
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

function build(args) {
  const selectedImport = readJson(selectedImportPath);
  const sourceRegister = readJson(sourceRegisterPath);
  const source = sourceDecision(sourceRegister);
  const vocabularyById = new Map(readVocabularyLabels().map((label) => [label.label_id, label]));
  const usableClips = (selectedImport.clips ?? [])
    .filter((clip) => clip?.local_file?.exists === true && clip?.local_file?.sha256)
    .filter((clip) => vocabularyById.has(clip.label_id));
  const decodableClips = usableClips.filter((clip) => isDecodableVideo(path.join(root, clip.local_file.path)));
  const clipsByLabel = {};
  for (const clip of decodableClips) {
    (clipsByLabel[clip.label_id] ??= []).push(clip);
  }
  const splitPlan = chooseSignerSplit(clipsByLabel, args.minLabels, args.searchIterations);
  const selectedLabelIds = splitPlan.eligible.slice(0, args.minLabels).map((label) => label.label_id);
  const selectedLabels = selectedLabelIds.map((labelId) => vocabularyById.get(labelId));
  const splitClips = Object.fromEntries(splitNames.map((split) => [split, []]));
  for (const labelId of selectedLabelIds) {
    for (const clip of clipsByLabel[labelId]) {
      splitClips[splitPlan.assignment[String(clip.signer_id)]].push(clip);
    }
  }
  const manifests = {};
  for (const split of splitNames) {
    const outputManifestPath = path.join(outputRoot, `${split}.json`);
    manifests[split] = buildManifest({
      split,
      labels: selectedLabels,
      clips: splitClips[split],
      outputManifestPath,
      source,
      sourceRegister,
    });
    if (args.write) writeJson(outputManifestPath, manifests[split]);
  }
  const summary = {
    schema_version: schemaVersion,
    status: args.write ? "written" : "dry_run",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_wlasl_academic_selected_manifests.mjs")),
    },
    decision_boundary: {
      imports_media: false,
      creates_or_modifies_clips: false,
      changes_source_register: false,
      trains_weights: false,
      promotes_model_card: false,
      final_model_evidence: false,
    },
    inputs: {
      selected_import: fileReference(selectedImportPath),
      source_register: fileReference(sourceRegisterPath),
      vocabulary_review: fileReference(vocabularyReviewPath),
      vocabulary_source: fileReference(vocabularyPath),
      source_review: fileReference(sourceReviewPath),
    },
    split_policy: {
      type: "signer_disjoint_selected_wlasl_source_signers",
      selected_label_count: selectedLabelIds.length,
      eligible_label_count: splitPlan.eligible.length,
      source_clip_count: usableClips.length,
      decodable_source_clip_count: decodableClips.length,
      excluded_not_decodable_count: usableClips.length - decodableClips.length,
      signer_assignment: splitPlan.assignment,
      limitation: "Small academic WLASL diagnostic subset. Use --allow-small-label-set; do not promote as final pilot evidence.",
    },
    output_manifests: Object.fromEntries(splitNames.map((split) => {
      const file = path.join(outputRoot, `${split}.json`);
      const clips = manifests[split].clips;
      return [split, {
        path: projectRelative(file),
        exists: fs.existsSync(file),
        sha256: fs.existsSync(file) ? sha256File(file) : null,
        label_count: manifests[split].labels.length,
        clip_count: clips.length,
        min_clips_per_label: Math.min(...Object.values(countBy(clips, (clip) => clip.label_id))),
        signer_count: new Set(clips.map((clip) => clip.signer_identity_hash)).size,
      }];
    })),
    selected_labels: selectedLabelIds,
    blockers: [],
  };
  if (args.write) writeJson(summaryPath, summary);
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
    selected_label_count: summary.split_policy.selected_label_count,
    eligible_label_count: summary.split_policy.eligible_label_count,
    output_manifests: summary.output_manifests,
    blockers: summary.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`WLASL academic selected manifest export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
