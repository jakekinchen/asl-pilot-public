#!/usr/bin/env node
//
// build_active_module_snapshot.mjs — produce the frozen 95-label active
// recognition module snapshot files that the data/manifests/*.json bind to.
//
// Rationale: web/src/lib/vocabulary.ts is the content-vocabulary surface
// (100 items). The 95-label PopSign-v1 active recognition module is a strict
// subset (excludes the 5 classroom-category learn-only items: help, stop,
// finish, school, plus). The manifests need their vocabulary_review block to
// bind to evidence pinned at the 95-item snapshot, not at the live 100-item
// content evidence. See:
//   docs/session-logs/041-postmortem-first-party-misread.md (root cause)
//   docs/session-logs/043-mission-4d-framing-correction-and-resume.md (M4d framing)
//   GOAL.md `current mission` (active-vs-content split)
//
// Anchors: #arch-active-module, #arch-data-provenance, #arch-first-party-data
//
// Output:
//   data/active-module/vocabulary-active-module.snapshot.json
//   data/active-module/active-module-vocabulary-review.json
//
// Both files are DETERMINISTIC (no timestamps, no machine-local data) so the
// SHA is stable across runs. Re-running with --write should produce no diff
// unless the underlying inputs (manifest labels or live vocab item bodies)
// have changed.
//
// Usage:
//   node scripts/build_active_module_snapshot.mjs              # dry-run; prints SHAs
//   node scripts/build_active_module_snapshot.mjs --write      # writes both files

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseVocabularySource } from "./vocabulary_review_utils.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data", "active-module");
const SNAPSHOT_PATH = path.join(OUTPUT_DIR, "vocabulary-active-module.snapshot.json");
const EVIDENCE_PATH = path.join(OUTPUT_DIR, "active-module-vocabulary-review.json");
const MANIFEST_PATH_FOR_LABEL_ORDER = path.join(ROOT, "data", "manifests", "train.json");
const SOURCE_VOCAB_PATH = path.join(ROOT, "web", "src", "lib", "vocabulary.ts");
const SOURCE_MATERIALS = [
  {
    relativePath: "docs/source-materials/pdf-extracted-text.md",
    purpose: "Original extracted project text defining vocabulary, hint, documentation, and limitation obligations.",
    sourceRequirements: [
      "Requirement 2: 75-100 isolated beginner ASL vocabulary items appropriate for ASL 1 learners",
      "Requirement 10: targeted hints tied to observable or teachable aspects; rule-based hints allowed in the pilot",
      "Requirement 15: final docs must cover limitations and no-pretrained evidence",
    ],
  },
  {
    relativePath: "docs/source-materials/requirements-matrix.md",
    purpose: "Machine-readable project requirement matrix derived from the source PDF.",
    sourceRequirements: [
      "R9-R10: isolated beginner ASL vocabulary and 75-100 ASL 1 items",
      "R28-R29: targeted hints tied to observable or teachable aspects",
      "Acceptance notes: no-pretrained recognition path remains strict",
    ],
  },
];

function sha256OfFile(absolutePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

function sha256OfBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function projectRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

function readManifestLabelOrder() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH_FOR_LABEL_ORDER, "utf8"));
  if (!Array.isArray(manifest.labels)) {
    throw new Error(`${projectRelative(MANIFEST_PATH_FOR_LABEL_ORDER)}: labels must be an array`);
  }
  const labelIds = manifest.labels.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("label entry must be an object");
    if (typeof entry.label_id !== "string") throw new Error("label entry must include label_id");
    return entry.label_id;
  });
  if (new Set(labelIds).size !== labelIds.length) throw new Error("manifest labels contain duplicates");
  return labelIds;
}

function buildSnapshot(items, labelOrder) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const missing = labelOrder.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new Error(`live vocabulary missing ${missing.length} active-module label(s): ${missing.join(", ")}`);
  }
  const snapshotItems = labelOrder.map((id) => {
    const source = byId.get(id);
    return {
      id: source.id,
      label: source.label,
      category: source.category,
      prompt: source.prompt,
      coachingHint: source.coachingHint,
      hintKind: source.hintKind,
    };
  });
  const sourceVocabSha = sha256OfFile(SOURCE_VOCAB_PATH);
  const snapshot = {
    schema_version: "asl-pilot-active-module-vocabulary-snapshot/v1",
    module_id: "popsign-v1-95-label-active-recognition-module",
    snapshot_basis: {
      source_vocabulary: {
        path: projectRelative(SOURCE_VOCAB_PATH),
        sha256_at_snapshot_time: sourceVocabSha,
      },
      label_order_source: {
        path: projectRelative(MANIFEST_PATH_FOR_LABEL_ORDER),
        field: "labels[].label_id",
      },
      source_register_decision_id: "approved_popsign_v1_original_videos_2026_05_20",
      rationale:
        "The active recognition module is the 95-label PopSign-v1 vocabulary. The live web/src/lib/vocabulary.ts content surface includes 5 additional learn_only_labels (help, stop, finish, school, plus) in the classroom category that are NOT recognition targets. This snapshot freezes the 95 PopSign-bound entries so the data/manifests/*.json vocabulary_review block can be hash-pinned against an evidence file that mirrors the manifest label set, while the live vocabulary.ts content evolves independently.",
    },
    label_count: snapshotItems.length,
    items: snapshotItems,
  };
  return { snapshot, sourceVocabSha };
}

function buildEvidence({ snapshotSha, snapshotItems, snapshotBuffer }) {
  const scriptPath = path.join(ROOT, "scripts", "build_active_module_snapshot.mjs");
  const evidence = {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "source_curated",
    evidence_mode: "active_module_snapshot",
    module_id: "popsign-v1-95-label-active-recognition-module",
    rationale:
      "Active-module evidence pinned to the 95-label snapshot at data/active-module/vocabulary-active-module.snapshot.json. The manifests' vocabulary_review block binds to this evidence file (not docs/review/final-vocabulary-review.json, which mirrors the 100-item content vocabulary). The 5 learn_only_labels (help, stop, finish, school, plus) are part of the content vocabulary but not the active recognition module; they have no recognition claim.",
    generated_by: {
      tool: "scripts/build_active_module_snapshot.mjs",
      script: {
        path: projectRelative(scriptPath),
        sha256: sha256OfFile(scriptPath),
      },
      determinism_note:
        "This evidence file omits per-run metadata (no generated_at, no command-array). Output is a pure function of the snapshot file + source materials, so SHA is stable across runs.",
    },
    vocabulary_source: {
      path: projectRelative(SNAPSHOT_PATH),
      sha256: snapshotSha,
    },
    item_count: snapshotItems.length,
    approved_item_ids: snapshotItems.map((item) => item.id),
    source_basis: SOURCE_MATERIALS.map(({ relativePath, purpose, sourceRequirements }) => ({
      path: relativePath,
      sha256: sha256OfFile(path.join(ROOT, relativePath)),
      purpose,
      source_requirements: sourceRequirements,
    })),
    external_review: {
      required_for_source_aligned_pilot: false,
      completed: false,
      claim:
        "No external Deaf educator, ASL instructor, or reviewer approval is claimed by this source-curated active-module snapshot evidence.",
      optional_stronger_evidence:
        "The external review packet and Ed25519 receipt workflow may be used later to upgrade this snapshot to reviewed status without changing the bound snapshot SHA.",
    },
    limitations: [
      "Qualified ASL instructor or Deaf educator review is pending and is not claimed by this evidence.",
      "Snapshot scope is the 95-label PopSign-v1 active recognition module; the 5 learn_only_labels in the content vocabulary are explicitly out of scope.",
      "Regional sign variation and signer-specific production differences remain known limitations for final documentation and validation.",
    ],
  };
  return evidence;
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const write = process.argv.includes("--write");
  const { items: liveItems } = parseVocabularySource();
  const labelOrder = readManifestLabelOrder();
  if (labelOrder.length !== 95) {
    console.warn(`note: manifest label_order length is ${labelOrder.length} (expected 95).`);
  }
  const { snapshot, sourceVocabSha } = buildSnapshot(liveItems, labelOrder);
  const snapshotBuffer = Buffer.from(serializeJson(snapshot), "utf8");
  const snapshotSha = sha256OfBuffer(snapshotBuffer);
  const evidence = buildEvidence({
    snapshotSha,
    snapshotItems: snapshot.items,
    snapshotBuffer,
  });
  const evidenceBuffer = Buffer.from(serializeJson(evidence), "utf8");
  const evidenceSha = sha256OfBuffer(evidenceBuffer);

  if (write) {
    ensureOutputDir();
    fs.writeFileSync(SNAPSHOT_PATH, snapshotBuffer);
    fs.writeFileSync(EVIDENCE_PATH, evidenceBuffer);
  }

  const report = {
    mode: write ? "wrote" : "dry_run",
    inputs: {
      live_vocabulary: {
        path: projectRelative(SOURCE_VOCAB_PATH),
        sha256: sourceVocabSha,
        item_count: liveItems.length,
      },
      label_order_source: {
        path: projectRelative(MANIFEST_PATH_FOR_LABEL_ORDER),
        label_count: labelOrder.length,
      },
    },
    outputs: {
      snapshot: { path: projectRelative(SNAPSHOT_PATH), sha256: snapshotSha, item_count: snapshot.items.length },
      evidence: { path: projectRelative(EVIDENCE_PATH), sha256: evidenceSha, item_count: evidence.item_count },
    },
    manifest_update_required: {
      "vocabulary_review.evidence.path": projectRelative(EVIDENCE_PATH),
      "vocabulary_review.evidence.sha256": evidenceSha,
      "vocabulary_review.vocabulary_source.path": projectRelative(SNAPSHOT_PATH),
      "vocabulary_review.vocabulary_source.sha256": snapshotSha,
      "vocabulary_review.vocabulary_source.item_count": snapshot.items.length,
    },
  };
  console.log(JSON.stringify(report, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    `build_active_module_snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
}
