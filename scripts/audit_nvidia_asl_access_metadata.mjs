import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const defaultMetadataDir = path.join(root, "artifacts", "dataset-research", "nvidia-asl", "metadata");
const defaultAccessReceiptPath = path.join(root, "docs", "research", "nvidia-asl-access-receipt.json");
const defaultCandidateReceiptPath = path.join(root, "docs", "research", "nvidia-asl-external-rights-review-receipt.json");
const defaultOutputPath = path.join(root, "docs", "research", "nvidia-asl-metadata-audit.json");
const schemaVersion = "asl-pilot-nvidia-asl-metadata-audit/v1";
const requiredPublicSourceEvidence = [
  {
    id: "nvidia_access_page",
    path: "artifacts/dataset-research/nvidia-asl/access-page.html",
    url: "https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/",
  },
  {
    id: "aws_open_data_registry_asl_1000",
    path: "artifacts/dataset-research/nvidia-asl/aws-open-data-registry-asl-1000.html",
    url: "https://registry.opendata.aws/asl_1000/",
  },
  {
    id: "nvidia_data_license",
    path: "artifacts/dataset-research/nvidia-asl/NVIDIA-Data-License-for-ASL-Project-2025-02-04.pdf",
    url: "https://www.nvidia.com/content/dam/en-zz/Solutions/events/NVIDIA-Data-License-for-ASL-Project-%284Feb2025%29.pdf",
  },
  {
    id: "trustworthy_ai_terms",
    path: "artifacts/dataset-research/nvidia-asl/trustworthy-ai-terms.html",
    url: "https://www.nvidia.com/en-us/agreements/trustworthy-ai/terms/",
  },
  {
    id: "trustworthy_ai_asl_developer_readme",
    path: "artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-developer-community-readme.md",
    url: "https://github.com/NVIDIA/Trustworthy-AI/tree/main/ASL%20Developer%20Community",
  },
  {
    id: "trustworthy_ai_asl_data_directory",
    path: "artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-data-directory.json",
    url: "https://api.github.com/repos/NVIDIA/Trustworthy-AI/contents/ASL%20Developer%20Community/data?ref=main",
  },
  {
    id: "trustworthy_ai_superannotate_onboarding",
    path: "artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-superannotate-onboarding.md",
    url: "https://github.com/NVIDIA/Trustworthy-AI/blob/main/ASL%20Developer%20Community/get-onboarded-with-superannotate.md",
  },
];

const videoExtensions = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mpg", ".mpeg"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const modelOrTensorExtensions = new Set([".pt", ".pth", ".onnx", ".tflite", ".npy", ".npz", ".pkl", ".pickle"]);
const metadataExtensions = new Set([".json", ".jsonl", ".csv", ".tsv", ".txt", ".md"]);
const receiptEvidenceExtensions = new Set([".json", ".md", ".txt", ".html", ".htm", ".pdf", ".eml"]);
const derivedNamePattern = /\b(?:landmarks?|keypoints?|pose|poses|face|facial|mesh|meshes|hand|hands|body|bodies|frames?|images?|crop|crops|mediapipe|openpose)\b/i;
const labelFieldPattern = /^(?:label|labels|gloss|glosses|sign|signs|sign_label|sign_name|class|class_name|class_label|word)$/i;
const splitFieldPattern = /^(?:split|dataset_split|partition|fold)$/i;
const signerFieldPattern = /^(?:signer|signer_id|participant|participant_id|subject|subject_id|user|user_id|person_id|actor|actor_id)$/i;
const videoFieldPattern = /(?:video|clip|file|path|url|uri)$/i;
const splitValues = new Set(["train", "training", "val", "valid", "validation", "test", "testing"]);

function parseArgs(argv) {
  const args = {
    metadataDir: defaultMetadataDir,
    accessReceipt: defaultAccessReceiptPath,
    candidateReceipt: defaultCandidateReceiptPath,
    output: defaultOutputPath,
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
    } else if (item === "--access-receipt") {
      args.accessReceipt = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--candidate-receipt") {
      args.candidateReceipt = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_nvidia_asl_access_metadata.mjs [--write]
  node scripts/audit_nvidia_asl_access_metadata.mjs --metadata-dir artifacts/dataset-research/nvidia-asl/metadata --access-receipt docs/research/nvidia-asl-access-receipt.json --write

Audits only post-access NVIDIA ASL metadata and accepted access evidence. This
script does not approve NVIDIA for training and does not import media into
manifests. It fails closed until a human-retained access receipt and a
metadata-only staging directory exist.
`);
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
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

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validateHashPinnedProjectFile(reference, context, blockers, allowedExtensions = receiptEvidenceExtensions) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty project path`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  let file;
  try {
    file = resolveProjectPath(reference.path, `${context}.path`);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    return null;
  }
  const extension = path.extname(file).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    blockers.push(`${context}.path must use one of these evidence extensions: ${[...allowedExtensions].join(", ")}`);
    return null;
  }
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    label_id: match[1],
    display_text: match[2],
    normalized: normalizeLabel(match[1]),
  }));
}

function normalizeLabel(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function listFiles(dir) {
  const output = [];
  function visit(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        output.push(fullPath);
      }
    }
  }
  visit(dir);
  return output;
}

function classifyFile(file, metadataDir) {
  const relativePath = projectRelative(file);
  const localMetadataPath = path.relative(metadataDir, file).split(path.sep).join("/");
  const ext = path.extname(file).toLowerCase();
  const stats = fs.statSync(file);
  const classes = [];
  if (metadataExtensions.has(ext)) classes.push("metadata_text");
  if (videoExtensions.has(ext)) classes.push("video_media");
  if (imageExtensions.has(ext)) classes.push("image_or_extracted_frame");
  if (modelOrTensorExtensions.has(ext)) classes.push("model_tensor_or_feature_cache");
  if (derivedNamePattern.test(localMetadataPath)) classes.push("derived_artifact_name_hit");
  if (classes.length === 0) classes.push("unknown");
  return {
    path: relativePath,
    metadata_relative_path: localMetadataPath,
    sha256: sha256File(file),
    bytes: stats.size,
    extension: ext || null,
    classes,
  };
}

function collectJsonValues(value, sink, depth = 0) {
  if (depth > 8) return;
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 10000)) collectJsonValues(item, sink, depth + 1);
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" || typeof child === "number") {
      sink.push({ key, value: String(child) });
    } else {
      collectJsonValues(child, sink, depth + 1);
    }
  }
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function readTextValues(file) {
  const ext = path.extname(file).toLowerCase();
  const stats = fs.statSync(file);
  if (stats.size > 20 * 1024 * 1024) {
    return { values: [], skipped_reason: "metadata text file exceeds 20MB scan limit" };
  }
  const text = fs.readFileSync(file, "utf8");
  const values = [];
  try {
    if (ext === ".json") {
      collectJsonValues(JSON.parse(text), values);
      return { values };
    }
    if (ext === ".jsonl") {
      const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 10000);
      for (const line of lines) collectJsonValues(JSON.parse(line), values);
      return { values };
    }
    if (ext === ".csv" || ext === ".tsv") {
      const delimiter = ext === ".tsv" ? "\t" : ",";
      const rows = text.split(/\r?\n/).filter(Boolean);
      const headers = splitDelimitedLine(rows[0] ?? "", delimiter).map((header) => header.trim());
      for (const row of rows.slice(1, 10001)) {
        const cells = splitDelimitedLine(row, delimiter);
        for (const [index, cell] of cells.entries()) {
          values.push({ key: headers[index] || `column_${index}`, value: cell });
        }
      }
      return { values };
    }
  } catch (error) {
    return { values, skipped_reason: `parse failed: ${error instanceof Error ? error.message : String(error)}` };
  }
  return { values };
}

function summarizeValues(fileEntries, metadataDir, vocabulary) {
  const labelCandidates = new Map();
  const signerCandidates = new Set();
  const splitCandidates = new Map();
  const videoPathCandidates = new Set();
  const parseWarnings = [];
  const vocabularyByNormalized = new Map(vocabulary.map((item) => [item.normalized, item]));

  for (const entry of fileEntries) {
    if (!entry.classes.includes("metadata_text")) continue;
    const file = path.join(root, entry.path);
    const { values, skipped_reason: skippedReason } = readTextValues(file, metadataDir);
    if (skippedReason) {
      parseWarnings.push(`${entry.path}: ${skippedReason}`);
      continue;
    }
    for (const item of values) {
      const key = String(item.key ?? "");
      const value = String(item.value ?? "").trim();
      if (!value) continue;
      if (labelFieldPattern.test(key)) {
        const normalized = normalizeLabel(value);
        if (!normalized) continue;
        const existing = labelCandidates.get(normalized) ?? {
          value,
          normalized,
          count: 0,
          asl_pilot_label_id: vocabularyByNormalized.get(normalized)?.label_id ?? null,
        };
        existing.count += 1;
        labelCandidates.set(normalized, existing);
      }
      if (signerFieldPattern.test(key)) signerCandidates.add(value);
      if (splitFieldPattern.test(key) || splitValues.has(value.toLowerCase())) {
        const normalizedSplit = normalizeSplit(value);
        if (normalizedSplit) splitCandidates.set(normalizedSplit, (splitCandidates.get(normalizedSplit) ?? 0) + 1);
      }
      if (videoFieldPattern.test(key) && videoExtensions.has(path.extname(value).toLowerCase())) {
        videoPathCandidates.add(value);
      }
    }
  }

  const labels = [...labelCandidates.values()].sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized));
  const overlappingLabels = labels.filter((item) => item.asl_pilot_label_id);
  return {
    parse_warnings: parseWarnings,
    label_candidates: labels.slice(0, 500),
    unique_label_candidate_count: labels.length,
    asl_pilot_overlap_count: overlappingLabels.length,
    asl_pilot_overlaps: overlappingLabels
      .map((item) => ({ asl_pilot_label_id: item.asl_pilot_label_id, metadata_label: item.value, count: item.count }))
      .sort((a, b) => a.asl_pilot_label_id.localeCompare(b.asl_pilot_label_id)),
    signer_candidate_count: signerCandidates.size,
    split_candidate_counts: Object.fromEntries([...splitCandidates.entries()].sort(([a], [b]) => a.localeCompare(b))),
    video_path_candidate_count: videoPathCandidates.size,
    sample_video_path_candidates: [...videoPathCandidates].sort().slice(0, 25),
  };
}

function normalizeSplit(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "train" || normalized === "training") return "train";
  if (normalized === "val" || normalized === "valid" || normalized === "validation") return "validation";
  if (normalized === "test" || normalized === "testing") return "test";
  return null;
}

function validateAccessReceipt(file, blockers) {
  if (!fs.existsSync(file)) {
    blockers.push(`Accepted NVIDIA access/license receipt is missing: ${projectRelative(file)}`);
    return null;
  }
  const receipt = readJson(file);
  if (receipt.schema_version !== "asl-pilot-nvidia-asl-access-receipt/v1") {
    blockers.push(`Access receipt ${projectRelative(file)} has an unexpected schema_version`);
  }
  if (receipt.source_id !== "nvidia-asl-dataset") {
    blockers.push(`Access receipt ${projectRelative(file)} source_id must be nvidia-asl-dataset`);
  }
  if (receipt.status !== "accepted_access_retained") {
    blockers.push(`Access receipt ${projectRelative(file)} status must be accepted_access_retained`);
  }
  const requiredBooleans = [
    "accepted_license_terms",
    "accepted_trustworthy_ai_terms",
    "raw_video_only_scope",
    "no_redistribution",
    "no_identity_or_biometric_processing",
    "no_pretrained_or_derived_recognition_components",
  ];
  for (const field of requiredBooleans) {
    if (receipt[field] !== true) blockers.push(`Access receipt ${projectRelative(file)} must set ${field}: true`);
  }
  if (typeof receipt.accepted_at !== "string" || Number.isNaN(Date.parse(receipt.accepted_at))) {
    blockers.push(`Access receipt ${projectRelative(file)} must include accepted_at`);
  }
  if (
    typeof receipt.access_request_submitted_at !== "string" ||
    Number.isNaN(Date.parse(receipt.access_request_submitted_at))
  ) {
    blockers.push(`Access receipt ${projectRelative(file)} must include access_request_submitted_at`);
  }
  if (typeof receipt.operator_name !== "string" || receipt.operator_name.trim().length === 0) {
    blockers.push(`Access receipt ${projectRelative(file)} must include operator_name`);
  }
  if (typeof receipt.operator_role !== "string" || receipt.operator_role.trim().length === 0) {
    blockers.push(`Access receipt ${projectRelative(file)} must include operator_role`);
  }
  if (typeof receipt.organization !== "string" || receipt.organization.trim().length === 0) {
    blockers.push(`Access receipt ${projectRelative(file)} must include organization`);
  }
  if (typeof receipt.access_request_reference !== "string" || receipt.access_request_reference.trim().length === 0) {
    blockers.push(`Access receipt ${projectRelative(file)} must include access_request_reference`);
  }
  if (typeof receipt.use_case !== "string" || receipt.use_case.trim().length < 40) {
    blockers.push(`Access receipt ${projectRelative(file)} must include a specific use_case`);
  }
  validateHashPinnedProjectFile(receipt.license_document, `Access receipt ${projectRelative(file)} license_document`, blockers);
  validateHashPinnedProjectFile(
    receipt.trustworthy_ai_terms,
    `Access receipt ${projectRelative(file)} trustworthy_ai_terms`,
    blockers,
  );
  if (!Array.isArray(receipt.evidence_attachments) || receipt.evidence_attachments.length === 0) {
    blockers.push(`Access receipt ${projectRelative(file)} must include at least one hash-pinned evidence_attachments item`);
  } else {
    receipt.evidence_attachments.forEach((attachment, index) => {
      const context = `Access receipt ${projectRelative(file)} evidence_attachments[${index}]`;
      validateHashPinnedProjectFile(attachment, context, blockers);
      if (typeof attachment.summary !== "string" || attachment.summary.trim().length === 0) {
        blockers.push(`${context}.summary must be a non-empty string`);
      }
    });
  }
  return receipt;
}

function validateCandidateReceipt(file, blockers) {
  if (!fs.existsSync(file)) {
    blockers.push(`Candidate NVIDIA external-rights receipt is missing: ${projectRelative(file)}`);
    return null;
  }
  const receipt = readJson(file);
  if (receipt.schema_version !== "asl-pilot-external-rights-review-receipt/v1") {
    blockers.push(`Candidate receipt ${projectRelative(file)} has an unexpected schema_version`);
  }
  if (receipt.source_id !== "nvidia-asl-dataset") {
    blockers.push(`Candidate receipt ${projectRelative(file)} source_id must be nvidia-asl-dataset`);
  }
  if (receipt.status !== "candidate_not_approved_for_training") {
    blockers.push(`Candidate receipt ${projectRelative(file)} must remain candidate_not_approved_for_training`);
  }
  for (const field of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
    if (receipt.decision_scope?.[field] !== false) {
      blockers.push(`Candidate receipt ${projectRelative(file)} decision_scope.${field} must remain false`);
    }
  }
  return receipt;
}

function publicSourceEvidence(blockers) {
  return requiredPublicSourceEvidence.map((source) => {
    const file = path.join(root, source.path);
    const exists = fs.existsSync(file);
    if (!exists) blockers.push(`Required NVIDIA public source evidence is missing: ${source.path}`);
    return {
      id: source.id,
      url: source.url,
      path: source.path,
      exists,
      sha256: exists ? sha256File(file) : null,
    };
  });
}

function buildAudit(args) {
  const blockers = [];
  const candidateReceipt = validateCandidateReceipt(args.candidateReceipt, blockers);
  const accessReceipt = validateAccessReceipt(args.accessReceipt, blockers);
  const retainedPublicSourceEvidence = publicSourceEvidence(blockers);
  const vocabulary = readVocabularyLabels();

  let fileEntries = [];
  let metadataSummary = {
    parse_warnings: [],
    label_candidates: [],
    unique_label_candidate_count: 0,
    asl_pilot_overlap_count: 0,
    asl_pilot_overlaps: [],
    signer_candidate_count: 0,
    split_candidate_counts: {},
    video_path_candidate_count: 0,
    sample_video_path_candidates: [],
  };
  if (!fs.existsSync(args.metadataDir)) {
    blockers.push(`NVIDIA metadata staging directory is missing: ${projectRelative(args.metadataDir)}`);
  } else if (!fs.statSync(args.metadataDir).isDirectory()) {
    blockers.push(`NVIDIA metadata staging path is not a directory: ${projectRelative(args.metadataDir)}`);
  } else {
    const files = listFiles(args.metadataDir);
    if (files.length === 0) blockers.push(`NVIDIA metadata staging directory is empty: ${projectRelative(args.metadataDir)}`);
    fileEntries = files.map((file) => classifyFile(file, args.metadataDir));
    metadataSummary = summarizeValues(fileEntries, args.metadataDir, vocabulary);

    const mediaFiles = fileEntries.filter((entry) => entry.classes.includes("video_media"));
    const imageFiles = fileEntries.filter((entry) => entry.classes.includes("image_or_extracted_frame"));
    const modelFiles = fileEntries.filter((entry) => entry.classes.includes("model_tensor_or_feature_cache"));
    const derivedNameHits = fileEntries.filter((entry) => entry.classes.includes("derived_artifact_name_hit"));
    if (mediaFiles.length > 0) blockers.push(`Metadata-only audit found media files; stage metadata first, not raw video: ${mediaFiles.map((entry) => entry.metadata_relative_path).slice(0, 5).join(", ")}`);
    if (imageFiles.length > 0) blockers.push(`Metadata-only audit found image/frame files, which are disallowed for the recognition path: ${imageFiles.map((entry) => entry.metadata_relative_path).slice(0, 5).join(", ")}`);
    if (modelFiles.length > 0) blockers.push(`Metadata-only audit found model/tensor/feature-cache files: ${modelFiles.map((entry) => entry.metadata_relative_path).slice(0, 5).join(", ")}`);
    if (derivedNameHits.length > 0) blockers.push(`Metadata-only audit found files whose names suggest derived landmarks/pose/face/frames/assets: ${derivedNameHits.map((entry) => entry.metadata_relative_path).slice(0, 5).join(", ")}`);
    if (metadataSummary.asl_pilot_overlap_count === 0) {
      blockers.push("Metadata scan found no exact-normalized overlap with the current ASL Pilot vocabulary");
    }
    if (metadataSummary.signer_candidate_count === 0) {
      blockers.push("Metadata scan found no signer/participant identifier candidates for split-leakage review");
    }
    for (const split of ["train", "validation", "test"]) {
      if (!metadataSummary.split_candidate_counts[split]) {
        blockers.push(`Metadata scan found no ${split} split candidate values`);
      }
    }
    if (metadataSummary.video_path_candidate_count === 0) {
      blockers.push("Metadata scan found no raw-video path candidates");
    }
  }

  const status = blockers.length === 0 ? "metadata_review_ready_not_approved" : "blocked";
  return {
    schema_version: schemaVersion,
    status,
    finality: "candidate_not_source_register_approved",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/audit_nvidia_asl_access_metadata.mjs",
        sha256: sha256File(path.join(root, "scripts", "audit_nvidia_asl_access_metadata.mjs")),
      },
    },
    inputs: {
      candidate_receipt: {
        path: projectRelative(args.candidateReceipt),
        exists: fs.existsSync(args.candidateReceipt),
        sha256: fs.existsSync(args.candidateReceipt) ? sha256File(args.candidateReceipt) : null,
        status: candidateReceipt?.status ?? null,
      },
      access_receipt: {
        path: projectRelative(args.accessReceipt),
        exists: fs.existsSync(args.accessReceipt),
        sha256: fs.existsSync(args.accessReceipt) ? sha256File(args.accessReceipt) : null,
        status: accessReceipt?.status ?? null,
        source_id: accessReceipt?.source_id ?? null,
        operator_name: accessReceipt?.operator_name ?? null,
        accepted_at: accessReceipt?.accepted_at ?? null,
        evidence_attachment_count: Array.isArray(accessReceipt?.evidence_attachments)
          ? accessReceipt.evidence_attachments.length
          : 0,
      },
      metadata_dir: {
        path: projectRelative(args.metadataDir),
        exists: fs.existsSync(args.metadataDir),
      },
      vocabulary_source: {
        path: projectRelative(vocabularyPath),
        sha256: sha256File(vocabularyPath),
        label_count: vocabulary.length,
      },
      public_source_evidence: retainedPublicSourceEvidence,
    },
    file_inventory: {
      file_count: fileEntries.length,
      files: fileEntries,
    },
    metadata_summary: metadataSummary,
    import_boundary: {
      training_allowed: false,
      validation_allowed: false,
      pilot_submission_allowed: false,
      next_allowed_action: status === "metadata_review_ready_not_approved"
        ? "manual_source_register_review_before_any_raw_video_import"
        : "resolve_blockers_before_metadata_review",
      prohibited_for_recognition_path: [
        "extracted images",
        "hand landmarks",
        "body poses",
        "facial meshes",
        "pretrained models",
        "detectors",
        "feature caches",
      ],
    },
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const audit = buildAudit(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: audit.status,
    wrote: args.write,
    output: projectRelative(args.output),
    metadata_dir: audit.inputs.metadata_dir,
    metadata_file_count: audit.file_inventory.file_count,
    asl_pilot_overlap_count: audit.metadata_summary.asl_pilot_overlap_count,
    signer_candidate_count: audit.metadata_summary.signer_candidate_count,
    video_path_candidate_count: audit.metadata_summary.video_path_candidate_count,
    blockers: audit.blockers,
  }, null, 2));
  return audit.status === "metadata_review_ready_not_approved" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`NVIDIA ASL metadata audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
