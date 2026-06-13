import fs from "node:fs";
import path from "node:path";
import {
  VALID_HINT_KINDS,
  defaultReviewEvidencePath,
  defaultReviewPacketPath,
  defaultReviewReceiptPath,
  defaultReviewerAuthorityPath,
  parseVocabularySource,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  validateVocabularyReviewEvidence,
} from "./vocabulary_review_utils.mjs";

const STRUCTURED_HINT_METADATA_PATH = "web/src/lib/sign-hint-metadata.json";
const STRUCTURED_HINT_METADATA_SCHEMA_VERSION = "asl-pilot-sign-hint-metadata/v1";
const MIN_POPULATED_HINT_METADATA_ENTRIES = 10;
const STRUCTURED_HINT_DIMENSIONS = [
  "handshape",
  "movement",
  "location",
  "orientation",
  "timing",
  "framing",
];
const MIN_HINT_METADATA_DIMENSION_LENGTH = 10;
const DIAGNOSTIC_LANGUAGE_PATTERNS = [
  /\b(wrong|incorrect|inaccurate|sloppy)\b/i,
  /\bnot\s+correct\b/i,
  /\btry\s+again\b/i,
  /\bwas\s+(off|incorrect|wrong)\b/i,
  /\byou\s+(did|made|signed|moved|placed|held|started|finished|forgot|missed)\b/i,
  /\byour\s+\w+\s+(was|is|did|made|moved)\b/i,
];

const PRACTICE_REASON_COPY_PATH = "web/src/components/PracticeApp.tsx";
const PRACTICE_REASON_COPY_MIN_LENGTH = 10;
const EXPECTED_REASON_COPY_KEYS = [
  "model_not_trained",
  "insufficient_frames",
  "low_luma",
  "low_contrast",
  "inactive_label",
  "class_mismatch",
  "confidence_below_threshold",
  "inference_error",
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--evidence") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --evidence");
      args.evidence = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_hint_pedagogy_review.mjs [--evidence docs/review/final-vocabulary-review.json]

Fails until the final vocabulary review source packet proves every coaching
hint is covered by canonical vocabulary evidence for beginner appropriateness,
ASL appropriateness, hint-kind alignment, and avoidance of unmeasured
attempt-diagnosis claims. Source-curated pilot evidence is accepted when it
explicitly says no external ASL reviewer approval is claimed.
`);
}

function blockedHintText(item, context) {
  const blockers = [];
  const hint = String(item.coachingHint ?? "").trim();
  if (hint.length < 24) blockers.push(`${context}.coachingHint is too short to be a useful targeted hint`);
  if (/\b(incorrect|wrong|try again|not correct)\b/i.test(hint)) {
    blockers.push(`${context}.coachingHint must be targeted, not only generic incorrect feedback`);
  }
  if (!VALID_HINT_KINDS.has(item.hintKind)) {
    blockers.push(`${context}.hintKind must be one of ${[...VALID_HINT_KINDS].join(", ")}`);
  }
  const hintReview = item.hintReview;
  if (!hintReview || typeof hintReview !== "object" || Array.isArray(hintReview)) {
    blockers.push(`${context}.hintReview must be an object`);
    return blockers;
  }
  for (const key of [
    "beginnerAppropriate",
    "aslAppropriate",
    "relatesToHintKind",
    "avoidsUnmeasuredAttemptDiagnosis",
  ]) {
    if (hintReview[key] !== true) blockers.push(`${context}.hintReview.${key} must be true`);
  }
  return blockers;
}

function reviewEvidence(args) {
  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultReviewEvidencePath;
  const blockers = [];
  if (!fs.existsSync(evidencePath)) {
    blockers.push(`Review evidence is missing: ${projectRelative(evidencePath)}`);
    return { evidencePath, evidence: null, packet: null, blockers };
  }
  const evidence = readJson(evidencePath);
  blockers.push(...validateVocabularyReviewEvidence(evidence, {
    requireSourcePacketPath: projectRelative(defaultReviewPacketPath),
    requireReviewerReceiptPath: projectRelative(defaultReviewReceiptPath),
    requireReviewerAuthorityPath: projectRelative(defaultReviewerAuthorityPath),
  }).findings);
  if (evidence?.status === "source_curated") {
    return {
      evidencePath,
      evidence,
      packet: {
        items: Array.isArray(evidence.items) ? evidence.items : [],
      },
      blockers,
    };
  }
  let packet = null;
  if (evidence?.source_packet?.path) {
    const packetPath = resolveProjectPath(evidence.source_packet.path, "source_packet.path");
    if (fs.existsSync(packetPath)) packet = readJson(packetPath);
  }
  if (!packet) blockers.push("Review evidence source_packet must point to the returned review packet");
  return { evidencePath, evidence, packet, blockers };
}

function validateSignHintMetadata(vocabularyIds) {
  const findings = [];
  let vocabTotal = 0;
  try {
    const { items } = parseVocabularySource();
    vocabTotal = items.length;
  } catch {
    vocabTotal = vocabularyIds.length;
  }
  const summary = {
    path: STRUCTURED_HINT_METADATA_PATH,
    exists: false,
    populated_entries: 0,
    required_populated_entries: MIN_POPULATED_HINT_METADATA_ENTRIES,
    vocab_total: vocabTotal,
    coverage_percent: 0,
  };
  const filePath = path.join(root, STRUCTURED_HINT_METADATA_PATH);
  if (!fs.existsSync(filePath)) {
    findings.push(`Structured hint metadata file is missing: ${STRUCTURED_HINT_METADATA_PATH}`);
    return { findings, summary };
  }
  summary.exists = true;
  let document;
  try {
    document = readJson(filePath);
  } catch (error) {
    findings.push(
      `Structured hint metadata is not valid JSON (${STRUCTURED_HINT_METADATA_PATH}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { findings, summary };
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    findings.push(`Structured hint metadata must be a JSON object: ${STRUCTURED_HINT_METADATA_PATH}`);
    return { findings, summary };
  }
  if (document.$schema_version !== STRUCTURED_HINT_METADATA_SCHEMA_VERSION) {
    findings.push(
      `Structured hint metadata $schema_version must be ${STRUCTURED_HINT_METADATA_SCHEMA_VERSION}`,
    );
  }
  const items = document.items;
  if (!items || typeof items !== "object" || Array.isArray(items)) {
    findings.push(`Structured hint metadata items must be a JSON object keyed by vocabulary id`);
    return { findings, summary };
  }
  const vocabularyIdSet = new Set(vocabularyIds);
  let populatedCount = 0;
  for (const [id, value] of Object.entries(items)) {
    const context = `sign-hint-metadata.items["${id}"]`;
    if (!vocabularyIdSet.has(id)) {
      findings.push(`${context} key is not present in the current vocabulary`);
      continue;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      findings.push(`${context} must be a JSON object`);
      continue;
    }
    let populatedDimensions = 0;
    for (const dimension of STRUCTURED_HINT_DIMENSIONS) {
      if (!(dimension in value)) continue;
      const text = value[dimension];
      if (typeof text !== "string") {
        findings.push(`${context}.${dimension} must be a string`);
        continue;
      }
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        findings.push(`${context}.${dimension} must not be empty`);
        continue;
      }
      if (trimmed.length < MIN_HINT_METADATA_DIMENSION_LENGTH) {
        findings.push(
          `${context}.${dimension} is too short to be a useful cue (need >= ${MIN_HINT_METADATA_DIMENSION_LENGTH} chars)`,
        );
      }
      for (const pattern of DIAGNOSTIC_LANGUAGE_PATTERNS) {
        if (pattern.test(trimmed)) {
          findings.push(
            `${context}.${dimension} uses diagnostic language; cues must describe the canonical sign or runtime framing, never claim what the learner did wrong`,
          );
          break;
        }
      }
      populatedDimensions += 1;
    }
    for (const key of Object.keys(value)) {
      if (!STRUCTURED_HINT_DIMENSIONS.includes(key)) {
        findings.push(
          `${context} contains unexpected dimension '${key}'; allowed: ${STRUCTURED_HINT_DIMENSIONS.join(", ")}`,
        );
      }
    }
    if (populatedDimensions > 0) populatedCount += 1;
  }
  summary.populated_entries = populatedCount;
  summary.coverage_percent =
    vocabTotal > 0 ? Math.round((populatedCount / vocabTotal) * 100) : 0;
  if (populatedCount < MIN_POPULATED_HINT_METADATA_ENTRIES) {
    findings.push(
      `Structured hint metadata must populate >= ${MIN_POPULATED_HINT_METADATA_ENTRIES} vocabulary entries with at least one dimension (found ${populatedCount})`,
    );
  }
  return { findings, summary };
}

function validatePracticeReasonCopy() {
  const findings = [];
  const summary = {
    path: PRACTICE_REASON_COPY_PATH,
    exists: false,
    found_keys: 0,
    required_keys: EXPECTED_REASON_COPY_KEYS.length,
  };
  const filePath = path.join(root, PRACTICE_REASON_COPY_PATH);
  if (!fs.existsSync(filePath)) {
    findings.push(`Practice REASON_COPY source is missing: ${PRACTICE_REASON_COPY_PATH}`);
    return { findings, summary };
  }
  summary.exists = true;
  const source = fs.readFileSync(filePath, "utf8");
  const blockMatch = source.match(
    /const\s+REASON_COPY\s*:\s*Record<PassFailReason,\s*string>\s*=\s*{([\s\S]*?)};/,
  );
  if (!blockMatch) {
    findings.push(
      `REASON_COPY block not found in ${PRACTICE_REASON_COPY_PATH}; expected 'const REASON_COPY: Record<PassFailReason, string> = { ... };'`,
    );
    return { findings, summary };
  }
  const block = blockMatch[1];
  const entries = new Map();
  const entryPattern = /(?:^|[\s,])([a-z_]+)\s*:\s*"((?:\\.|[^"\\])*)"\s*,?/g;
  for (const match of block.matchAll(entryPattern)) {
    entries.set(match[1], match[2]);
  }
  summary.found_keys = entries.size;
  for (const key of EXPECTED_REASON_COPY_KEYS) {
    if (!entries.has(key)) {
      findings.push(`REASON_COPY is missing required PassFailReason key '${key}'`);
      continue;
    }
    const value = entries.get(key);
    const context = `REASON_COPY["${key}"]`;
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      findings.push(`${context} must not be empty`);
      continue;
    }
    if (trimmed.length < PRACTICE_REASON_COPY_MIN_LENGTH) {
      findings.push(
        `${context} is too short to be useful (need >= ${PRACTICE_REASON_COPY_MIN_LENGTH} chars)`,
      );
    }
    for (const pattern of DIAGNOSTIC_LANGUAGE_PATTERNS) {
      if (pattern.test(trimmed)) {
        findings.push(
          `${context} uses diagnostic language; user-facing reason copy must describe the runtime state, never claim what the learner did wrong`,
        );
        break;
      }
    }
  }
  for (const key of entries.keys()) {
    if (!EXPECTED_REASON_COPY_KEYS.includes(key)) {
      findings.push(
        `REASON_COPY contains unexpected key '${key}'; allowed PassFailReason keys: ${EXPECTED_REASON_COPY_KEYS.join(", ")}`,
      );
    }
  }
  return { findings, summary };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const { evidencePath, packet, blockers } = reviewEvidence(args);
  const itemBlockers = [];
  const items = Array.isArray(packet?.items) ? packet.items : [];
  for (const [index, item] of items.entries()) {
    itemBlockers.push(...blockedHintText(item, `items[${index}]`));
  }
  if (items.length === 0) itemBlockers.push("source_packet.items must be a non-empty array");
  const vocabularyIds = items
    .map((item) => item?.id)
    .filter((id) => typeof id === "string" && id.length > 0);
  const structured = validateSignHintMetadata(vocabularyIds);
  const reasonCopy = validatePracticeReasonCopy();
  const allBlockers = [
    ...blockers,
    ...itemBlockers,
    ...structured.findings,
    ...reasonCopy.findings,
  ];
  const summary = {
    status: allBlockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
    },
    item_count: items.length,
    structured_hint_metadata: structured.summary,
    practice_reason_copy: reasonCopy.summary,
    blockers: allBlockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (allBlockers.length > 0) {
    console.error("Hint pedagogy review audit failed:");
    for (const blocker of allBlockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Hint pedagogy review audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
