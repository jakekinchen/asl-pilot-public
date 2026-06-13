import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "research", "noncommercial-academic-dataset-import-plan.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const wlaslMetadataPath = path.join(root, "data", "external", "wlasl", "metadata", "WLASL_v0.3.json");
const aslCitizenArchivePath = path.join(root, "data", "external", "asl-citizen", "raw", "ASL_Citizen.zip");
const schemaVersion = "asl-pilot-noncommercial-academic-dataset-import-plan/v1";
const aslCitizenDownloadUrl =
  "https://download.microsoft.com/download/b/8/8/b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip";
const aslCitizenCompressedBytes = 45_924_134_223;

function parseArgs(argv) {
  const args = { write: false, output: defaultOutputPath };
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
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = resolveProjectPath(value, "--output");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_academic_dataset_import_plan.mjs [--write] [--output docs/research/noncommercial-academic-dataset-import-plan.json]

Builds the noncommercial school-assignment import plan for ASL Citizen and
WLASL. It does not download raw video archives. Raw media stays under ignored
data/external/ paths and must be imported with source-register-approved raw RGB
only boundaries.
`);
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

function fileState(file) {
  if (!fs.existsSync(file)) {
    return { exists: false, path: projectRelative(file), size_bytes: 0, sha256: null };
  }
  const stats = fs.statSync(file);
  return {
    exists: true,
    path: projectRelative(file),
    size_bytes: stats.size,
    sha256: sha256File(file),
  };
}

function normalizeLabel(value) {
  return String(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    label_id: match[1],
    display_text: match[2],
    normalized: normalizeLabel(match[1]),
  }));
}

function readSourceDecision(register, sourceId) {
  const source = (register.sources ?? []).find((item) => item?.source_id === sourceId);
  return source
    ? {
        source_id: source.source_id,
        decision_id: source.decision_id,
        license_review_status: source.license_review_status,
        allowed_for_model_training: source.allowed_for_model_training,
        allowed_for_validation: source.allowed_for_validation,
        allowed_for_pilot_submission: source.allowed_for_pilot_submission,
      }
    : null;
}

function summarizeWlasl(vocabulary) {
  const state = fileState(wlaslMetadataPath);
  if (!state.exists) {
    return {
      metadata: state,
      status: "metadata_missing",
      class_count: 0,
      instance_count: 0,
      exact_overlap_label_count: 0,
      exact_overlap_instance_count: 0,
      exact_overlap_labels: [],
      next_step: "Download WLASL_v0.3.json into data/external/wlasl/metadata before raw-clip selection.",
    };
  }
  const rows = readJson(wlaslMetadataPath);
  const byGloss = new Map();
  for (const row of rows) {
    const normalized = normalizeLabel(row.gloss);
    if (!byGloss.has(normalized)) byGloss.set(normalized, []);
    byGloss.get(normalized).push(row);
  }
  const exactOverlap = [];
  for (const label of vocabulary) {
    const matches = byGloss.get(label.normalized) ?? [];
    if (matches.length === 0) continue;
    const instances = matches.flatMap((item) => Array.isArray(item.instances) ? item.instances : []);
    const split_counts = {};
    const source_counts = {};
    for (const instance of instances) {
      split_counts[instance.split ?? "unknown"] = (split_counts[instance.split ?? "unknown"] ?? 0) + 1;
      source_counts[instance.source ?? "unknown"] = (source_counts[instance.source ?? "unknown"] ?? 0) + 1;
    }
    exactOverlap.push({
      label_id: label.label_id,
      display_text: label.display_text,
      wlasl_glosses: matches.map((item) => item.gloss),
      instance_count: instances.length,
      split_counts,
      unique_signer_count: new Set(instances.map((item) => item.signer_id).filter((value) => value !== undefined)).size,
      source_counts,
      recommended_import_status: instances.length > 0 ? "candidate_probe_raw_urls" : "no_instances",
    });
  }
  exactOverlap.sort((a, b) => b.instance_count - a.instance_count || a.label_id.localeCompare(b.label_id));
  return {
    metadata: state,
    status: "metadata_loaded",
    class_count: rows.length,
    instance_count: rows.reduce((total, item) => total + (Array.isArray(item.instances) ? item.instances.length : 0), 0),
    exact_overlap_label_count: exactOverlap.length,
    exact_overlap_instance_count: exactOverlap.reduce((total, item) => total + item.instance_count, 0),
    exact_overlap_labels: exactOverlap,
    next_step: "Probe selected raw URLs and download only raw clips needed for controlled-pilot manifests; ignore bbox/pretrained/keypoint artifacts.",
  };
}

function buildPlan(outputPath) {
  const register = readJson(sourceRegisterPath);
  const vocabulary = readVocabularyLabels();
  const wlaslSummary = summarizeWlasl(vocabulary);
  const aslCitizenState = fileState(aslCitizenArchivePath);
  const blockers = [];
  for (const sourceId of ["asl-citizen-school-assignment-raw-videos", "wlasl-school-assignment-raw-videos"]) {
    const source = readSourceDecision(register, sourceId);
    if (!source) {
      blockers.push(`source register is missing ${sourceId}`);
      continue;
    }
    if (source.allowed_for_model_training !== true || source.allowed_for_validation !== true) {
      blockers.push(`${sourceId} must be allowed for local model training and validation`);
    }
  }
  if (!wlaslSummary.metadata.exists) blockers.push("WLASL metadata has not been loaded into data/external/wlasl/metadata/");
  if (aslCitizenState.exists && aslCitizenState.size_bytes !== aslCitizenCompressedBytes) {
    blockers.push("ASL Citizen archive exists locally but its byte size does not match the official HEAD probe");
  }
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "ready_for_raw_clip_selection" : "blocked",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_academic_dataset_import_plan.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_academic_dataset_import_plan.mjs")),
      },
    },
    output: projectRelative(outputPath),
    assignment_scope: {
      mode: "noncommercial_school_assignment",
      raw_video_only: true,
      normal_practice_uploads_raw_video: false,
      redistribute_raw_or_modified_data: false,
      no_pretrained_or_derived_cv_inputs: true,
    },
    source_register: {
      path: projectRelative(sourceRegisterPath),
      sha256: sha256File(sourceRegisterPath),
      decisions: {
        asl_citizen: readSourceDecision(register, "asl-citizen-school-assignment-raw-videos"),
        wlasl: readSourceDecision(register, "wlasl-school-assignment-raw-videos"),
        popsign_v1: readSourceDecision(register, "popsign-v1-original-videos"),
      },
    },
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      label_count: vocabulary.length,
    },
    local_dataset_state: {
      asl_citizen: {
        source_id: "asl-citizen-school-assignment-raw-videos",
        official_archive_url: aslCitizenDownloadUrl,
        expected_compressed_bytes: aslCitizenCompressedBytes,
        local_archive: aslCitizenState,
        local_extract_root: "data/external/asl-citizen/extracted/",
        status: aslCitizenState.exists ? "archive_downloaded_not_extracted" : "not_downloaded_disk_guard_required",
        disk_guard: "Do not download and extract the full ZIP unless at least 110 GiB free is available or a selected-clip extractor is used.",
      },
      wlasl: {
        source_id: "wlasl-school-assignment-raw-videos",
        metadata_url: "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json",
        local_raw_root: "data/external/wlasl/raw/",
        ...wlaslSummary,
      },
      popsign_v1: {
        source_id: "popsign-v1-original-videos",
        existing_import_plan: "docs/research/popsign-v1-import-plan.json",
        status: "already_project_supported",
      },
    },
    recommended_order: [
      "Keep PopSign v1 as the already wired baseline and fallback.",
      "Use ASL Citizen as the highest-value added real isolated-sign source if disk/runtime permits selected extraction.",
      "Use WLASL exact-overlap raw clips as a fast supplemental source, prioritizing currently available direct MP4 URLs and skipping derived artifacts.",
      "Keep any external validation split source-explicit; never mix ignored raw videos into final evidence without manifest/source-register binding.",
    ],
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const plan = buildPlan(args.output);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: plan.status,
    wrote: args.write,
    output: projectRelative(args.output),
    wlasl_metadata_status: plan.local_dataset_state.wlasl.status,
    wlasl_exact_overlap_label_count: plan.local_dataset_state.wlasl.exact_overlap_label_count,
    asl_citizen_status: plan.local_dataset_state.asl_citizen.status,
    blockers: plan.blockers,
  }, null, 2));
  return plan.status === "ready_for_raw_clip_selection" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Academic dataset import plan export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
