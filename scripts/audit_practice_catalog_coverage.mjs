import fs from "node:fs";
import path from "node:path";

// Audits the graded practice catalog (web/src/lib/practice-catalog.ts):
// - every recognizer label has a curated vocabulary entry and study metadata
//   covering at least handshape/movement/location/framing;
// - the catalog size sits inside the assignment's 75-100 beginner-sign window;
// - every reference clip the catalog promises actually ships in web/public.

const root = path.resolve(import.meta.dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const pipelineSource = read("web", "src", "lib", "scratch-pipeline.ts");
const vocabularySource = read("web", "src", "lib", "vocabulary.ts");
const catalogSource = read("web", "src", "lib", "practice-catalog.ts");
const hintMetadata = JSON.parse(
  read("web", "src", "lib", "sign-hint-metadata.json"),
).items;

const labelsMatch = pipelineSource.match(
  /export const LABELS = \[([\s\S]*?)\]/,
);
const labels = labelsMatch
  ? [...labelsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

const vocabularyIds = [...vocabularySource.matchAll(/\["([a-z0-9_]+)",/g)].map(
  (m) => m[1],
);

const renames = {};
const renameBlock = catalogSource.match(
  /LABEL_TO_VOCABULARY_ID[^=]*= \{([\s\S]*?)\};/,
);
if (renameBlock) {
  for (const m of renameBlock[1].matchAll(/([A-Za-z0-9_]+): "([a-z0-9_]+)"/g)) {
    renames[m[1]] = m[2];
  }
}
const vocabularyIdForLabel = (label) => renames[label] ?? label;

const clipBlock = catalogSource.match(
  /REFERENCE_CLIP_LABELS = new Set\(\[([\s\S]*?)\]\)/,
);
const clipLabels = clipBlock
  ? [...clipBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

const REQUIRED_STUDY_DIMENSIONS = ["handshape", "movement", "location", "framing"];

const checks = [];

checks.push({
  id: "label_set_present",
  label: "Recognizer label set parsed from scratch-pipeline.ts",
  status: labels.length > 0 ? "passed" : "failed",
  detail: { label_count: labels.length },
});

checks.push({
  id: "catalog_size_window",
  label: "Graded catalog sits in the assignment's 75-100 sign window",
  status: labels.length >= 75 && labels.length <= 100 ? "passed" : "failed",
  detail: { label_count: labels.length, window: [75, 100] },
});

const vocabularyIdSet = new Set(vocabularyIds);
const labelsMissingVocabulary = labels.filter(
  (label) => !vocabularyIdSet.has(vocabularyIdForLabel(label)),
);
checks.push({
  id: "vocabulary_coverage",
  label: "Every recognizer label has a curated vocabulary entry",
  status: labelsMissingVocabulary.length === 0 ? "passed" : "failed",
  missing: labelsMissingVocabulary,
});

const labelsMissingStudy = labels.filter((label) => {
  const study = hintMetadata[vocabularyIdForLabel(label)];
  if (!study) return true;
  return REQUIRED_STUDY_DIMENSIONS.some(
    (dimension) => typeof study[dimension] !== "string" || !study[dimension],
  );
});
checks.push({
  id: "study_metadata_coverage",
  label:
    "Every recognizer label has study metadata with handshape/movement/location/framing",
  status: labelsMissingStudy.length === 0 ? "passed" : "failed",
  missing: labelsMissingStudy,
});

const clipLabelSet = new Set(labels);
const clipsOutsideLabels = clipLabels.filter((label) => !clipLabelSet.has(label));
const clipsMissingFiles = clipLabels.filter(
  (label) =>
    !fs.existsSync(path.join(root, "web", "public", "pilot", "clips", `${label}.mp4`)),
);
checks.push({
  id: "reference_clips_ship",
  label: "Every promised reference clip is a recognizer label and ships in web/public",
  status:
    clipsOutsideLabels.length === 0 && clipsMissingFiles.length === 0
      ? "passed"
      : "failed",
  detail: { clip_count: clipLabels.length },
  missing: [...clipsOutsideLabels, ...clipsMissingFiles],
});

const blockers = checks
  .filter((check) => check.status !== "passed")
  .map((check) => `${check.label}: ${JSON.stringify(check.missing ?? check.detail)}`);

console.log(
  JSON.stringify(
    {
      status: blockers.length === 0 ? "passed" : "failed",
      checked_at: new Date().toISOString(),
      checks,
      blockers,
    },
    null,
    2,
  ),
);

if (blockers.length > 0) {
  console.error("Practice catalog coverage audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exitCode = 1;
}
