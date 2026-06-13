import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceId = "popsign-v1-original-videos";
const sourceAuditPath = path.join(root, "docs", "research", "popsign-v1-source-audit.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
// Post-M5c (DECISIONS.md "95-label PopSign-v1 is the active recognition module"):
// the canonical vocabulary input is the frozen active-module snapshot pair, not
// the live 100-item web/src/lib/vocabulary.ts surface. The snapshot is the
// 95-label PopSign-bound subset of vocabulary.ts; the 5 classroom items
// (help, stop, finish, school, plus) are learn_only_labels in the UI and are
// NOT recognition-module entries, so they must not appear in the import plan.
// See: scripts/build_active_module_snapshot.mjs, DECISIONS.md, GOAL.md,
// docs/session-logs/044-mission-5a-active-module-snapshot-evidence.md,
// docs/session-logs/047-mission-5c-active-module-decision-lock.md.
const vocabularyPath = path.join(root, "data", "active-module", "vocabulary-active-module.snapshot.json");
const vocabularyReviewPath = path.join(root, "data", "active-module", "active-module-vocabulary-review.json");
const defaultOutputPath = path.join(root, "docs", "research", "popsign-v1-import-plan.json");
const schemaVersion = "asl-pilot-popsign-v1-import-plan/v1";
const splits = ["train", "val", "test"];

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
  node scripts/export_popsign_v1_import_plan.mjs [--write] [--output docs/research/popsign-v1-import-plan.json]

Builds the deterministic raw-video archive import plan for the current
PopSign-backed ASL Pilot vocabulary. It does not download archives or generate
final clip manifests; it records exactly which original PopSign tar archives
must be fetched before extraction, hashing, tensor decode, and final manifest
export.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
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

function readVocabularyLabels() {
  // vocabularyPath points at the active-module snapshot JSON since M5b. The
  // snapshot's `items[]` is the deterministic 95-label PopSign-bound subset.
  const snapshot = readJson(vocabularyPath);
  if (snapshot.schema_version !== "asl-pilot-active-module-vocabulary-snapshot/v1") {
    throw new Error(
      `${projectRelative(vocabularyPath)}: schema_version must be asl-pilot-active-module-vocabulary-snapshot/v1`,
    );
  }
  if (!Array.isArray(snapshot.items)) {
    throw new Error(`${projectRelative(vocabularyPath)}: items must be an array`);
  }
  return snapshot.items.map((item) => ({
    label_id: item.id,
    display_text: item.label,
  }));
}

function sourceRegisterDecision(register) {
  const sources = Array.isArray(register.sources) ? register.sources : [];
  return sources.find((source) => source?.source_id === sourceId);
}

function buildPlan(outputPath) {
  const blockers = [];
  const audit = readJson(sourceAuditPath);
  const register = readJson(sourceRegisterPath);
  const vocabularyReview = readJson(vocabularyReviewPath);
  const vocabulary = readVocabularyLabels();
  const source = sourceRegisterDecision(register);
  if (!source) {
    blockers.push(`source register is missing ${sourceId}`);
  } else {
    for (const field of ["allowed_for_model_training", "allowed_for_validation", "allowed_for_pilot_submission"]) {
      if (source[field] !== true) blockers.push(`source register ${sourceId}.${field} must be true`);
    }
  }
  if (audit.schema_version !== "asl-pilot-popsign-v1-source-audit/v1" || audit.status !== "passed") {
    blockers.push("PopSign source audit must exist and pass before exporting an import plan");
  }
  if (audit.source_id !== sourceId) {
    blockers.push(`PopSign source audit source_id must be ${sourceId}`);
  }
  // Post-M5b: the legacy hash check (audit.vocabulary_source.sha256 ==
  // sha256File(vocabulary.ts)) does not survive the M5a snapshot pivot — the
  // audit was performed when vocab.ts was the 95-item file, the snapshot was
  // built after vocab.ts grew to 100 items, and the snapshot's lineage to the
  // audited content is by `label_order_source = data/manifests/train.json`
  // rather than by raw file hash. The bidirectional label-set check below
  // (audit mapping count == snapshot label count + every snapshot label has a
  // mapped audit entry) preserves the integrity intent of the hash check.
  if (vocabularyReview.schema_version !== "asl-pilot-vocabulary-review-evidence/v1") {
    blockers.push("vocabulary review evidence schema_version is invalid");
  }
  if (!["reviewed", "source_curated"].includes(vocabularyReview.status)) {
    blockers.push("vocabulary review evidence must be reviewed or source_curated");
  }
  if (vocabularyReview.vocabulary_source?.sha256 !== sha256File(vocabularyPath)) {
    blockers.push("vocabulary review evidence must match current vocabulary hash");
  }
  const mapping = Array.isArray(audit.current_vocabulary_mapping) ? audit.current_vocabulary_mapping : [];
  const mappingByLabel = new Map(mapping.map((item) => [item.label_id, item]));
  for (const label of vocabulary) {
    const item = mappingByLabel.get(label.label_id);
    if (!item || item.status !== "mapped") {
      blockers.push(`missing PopSign mapping for ${label.label_id}`);
    }
  }
  if (mapping.length !== vocabulary.length) {
    blockers.push(
      `PopSign source audit mapping count (${mapping.length}) does not match active-module label count (${vocabulary.length})`,
    );
  }
  const archives = vocabulary.flatMap((label) => {
    const item = mappingByLabel.get(label.label_id);
    return splits.map((split) => ({
      split,
      label_id: label.label_id,
      display_text: label.display_text,
      popsign_dataset: "popsign_v1_0",
      popsign_category: "game",
      popsign_sign_slug: item?.popsign_sign_slug ?? null,
      popsign_display_name: item?.popsign_display_name ?? null,
      archive_url: item?.archive_urls?.[split] ?? null,
      local_archive_path: `data/external/popsign-v1/raw/popsign_v1_0/game/${split}/${item?.popsign_sign_slug ?? label.label_id}.tar`,
      local_extract_dir: `data/external/popsign-v1/raw/popsign_v1_0/game/${split}/${item?.popsign_sign_slug ?? label.label_id}/`,
      status: item?.status === "mapped" ? "planned" : "blocked_missing_mapping",
    }));
  });
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "ready_to_download" : "blocked",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_popsign_v1_import_plan.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_popsign_v1_import_plan.mjs")),
      },
    },
    output: projectRelative(outputPath),
    dataset_source_mode: "approved_external_raw_video_source",
    source_id: sourceId,
    source_register: {
      path: projectRelative(sourceRegisterPath),
      sha256: sha256File(sourceRegisterPath),
      decision_id: source?.decision_id ?? null,
      license_review_status: source?.license_review_status ?? null,
    },
    source_audit: {
      path: projectRelative(sourceAuditPath),
      sha256: sha256File(sourceAuditPath),
    },
    vocabulary_review: {
      status: vocabularyReview.status,
      evidence: {
        path: projectRelative(vocabularyReviewPath),
        sha256: sha256File(vocabularyReviewPath),
      },
      vocabulary_source: {
        path: projectRelative(vocabularyPath),
        sha256: sha256File(vocabularyPath),
        item_count: vocabulary.length,
      },
    },
    import_contract: {
      source_dataset: "popsign_v1_0",
      source_category: "game",
      source_splits: splits,
      archive_granularity: "one tar archive per sign per split",
      local_archive_root: "data/external/popsign-v1/raw/",
      preview_videos_allowed: false,
      derived_features_allowed: false,
      final_manifest_frame_source: "raw_rgb_video",
      final_manifest_derived_features: [],
      final_split_strategy: "preserve PopSign train/val/test signer-disjoint source splits",
    },
    archive_count: archives.length,
    label_count: vocabulary.length,
    archives,
    next_steps: [
      "Download only the planned original tar archives into local_archive_path.",
      "Extract archives into local_extract_dir without committing raw videos.",
      "Enumerate extracted videos, parse source signer IDs, hash every raw video, and preserve PopSign source splits.",
      "Decode RGB frame tensors from raw videos only; do not use pose, landmark, embedding, feature, detector, or pretrained artifacts.",
      "Export final train/validation/test raw-frame manifests bound to this source register and source audit.",
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
    source_id: plan.source_id,
    label_count: plan.label_count,
    archive_count: plan.archive_count,
    blockers: plan.blockers,
  }, null, 2));
  return plan.status === "ready_to_download" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`PopSign v1 import plan export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
