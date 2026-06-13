import fs from "node:fs";
import path from "node:path";
import { parseVocabularySource } from "./vocabulary_review_utils.mjs";

/**
 * list_hint_metadata_gaps.mjs — report which vocabulary items still lack
 * structured `SIGN_HINT_METADATA` entries, grouped by vocabulary category.
 * The hint-pedagogy audit currently requires >= 10 populated entries; this
 * script gives a future ASL reviewer a concrete todo list of the rest.
 *
 * Anchors: #arch-vocab-hints
 *
 * Usage:
 *   node scripts/list_hint_metadata_gaps.mjs
 *   node scripts/list_hint_metadata_gaps.mjs --json   # machine-readable
 */

const root = path.resolve(import.meta.dirname, "..");
const hintPath = path.join(root, "web/src/lib/sign-hint-metadata.json");

const STRUCTURED_HINT_DIMENSIONS = [
  "handshape",
  "movement",
  "location",
  "orientation",
  "timing",
  "framing",
];

function parseVocab() {
  // Delegate to the strict parser in vocabulary_review_utils.mjs (single
  // source of truth for the vocabulary.ts row format). The shared parser
  // returns { id, label, category, prompt, coachingHint, hintKind,
  // reviewStatus } per item; this script only needs id/label/category.
  const { items } = parseVocabularySource();
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
  }));
}

function loadHintMetadata() {
  const text = fs.readFileSync(hintPath, "utf8");
  const data = JSON.parse(text);
  return data.items ?? {};
}

function countPopulatedDimensions(entry) {
  if (!entry || typeof entry !== "object") return 0;
  let n = 0;
  for (const dim of STRUCTURED_HINT_DIMENSIONS) {
    if (typeof entry[dim] === "string" && entry[dim].trim().length > 0) n += 1;
  }
  return n;
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");

  const vocab = parseVocab();
  const hints = loadHintMetadata();

  const covered = [];
  const missing = [];
  for (const item of vocab) {
    const populatedDims = countPopulatedDimensions(hints[item.id]);
    if (populatedDims > 0) {
      covered.push({ ...item, populatedDims });
    } else {
      missing.push(item);
    }
  }

  const byCategory = {};
  for (const item of missing) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }
  const categories = Object.keys(byCategory).sort();

  const report = {
    schema_version: "asl-pilot-hint-metadata-coverage/v1",
    generated_at: new Date().toISOString(),
    summary: {
      vocab_total: vocab.length,
      covered: covered.length,
      missing: missing.length,
      coverage_percent: Math.round((covered.length / vocab.length) * 100),
    },
    covered_ids: covered.map((item) => item.id),
    missing_by_category: categories.reduce((acc, cat) => {
      acc[cat] = byCategory[cat].map((item) => item.id);
      return acc;
    }, {}),
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Hint metadata coverage: ${report.summary.covered}/${report.summary.vocab_total} (${report.summary.coverage_percent}%)`);
  console.log("");
  console.log(`Covered (${covered.length}):`);
  for (const c of covered) {
    console.log(`  ${c.id.padEnd(16)} (${c.category}, ${c.populatedDims}/${STRUCTURED_HINT_DIMENSIONS.length} dimensions)`);
  }
  console.log("");
  console.log(`Missing by category (${missing.length} total):`);
  for (const cat of categories) {
    const ids = byCategory[cat].map((i) => i.id);
    console.log(`  ${cat.padEnd(16)} ${ids.length} items: ${ids.join(", ")}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`list_hint_metadata_gaps failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
