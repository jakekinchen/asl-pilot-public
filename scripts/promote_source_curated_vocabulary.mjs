import fs from "node:fs";
import path from "node:path";
import {
  SOURCE_CURATED_EVIDENCE_MODE,
  SOURCE_CURATED_STATUS,
  defaultReviewEvidencePath,
  parseVocabularySource,
  projectRelative,
  requiredHintReviewFields,
  requiredSourceCurationAssertions,
  resolveProjectPath,
  root,
  sha256File,
  validateSourceCuratedVocabularyEvidence,
  validateVocabularyItems,
  vocabularyPath,
  writeJson,
} from "./vocabulary_review_utils.mjs";

function parseArgs(argv) {
  const args = { write: false };
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
  node scripts/promote_source_curated_vocabulary.mjs [--write] [--evidence docs/review/final-vocabulary-review.json]

Promotes the current 75-100 item vocabulary to the source-curated pilot gate.
This does not claim Deaf educator, ASL instructor, or other external review.
It writes canonical vocabulary evidence that preserves that limitation and keeps
the stricter external-review packet path available as optional stronger evidence.
`);
}

function sourceReference(relativePath, sourceRequirements, purpose) {
  const file = resolveProjectPath(relativePath, relativePath);
  return {
    path: relativePath,
    sha256: sha256File(file),
    purpose,
    source_requirements: sourceRequirements,
  };
}

function sourceCuratedVocabularyText(source) {
  return source
    .replace(
      /reviewStatus:\s*"needs_deaf_educator_review"\s*\|\s*"reviewed"/,
      'reviewStatus: "source_curated" | "reviewed"',
    )
    .replace(
      /reviewStatus:\s*"needs_deaf_educator_review"/g,
      'reviewStatus: "source_curated"',
    );
}

function buildEvidence({ items, command }) {
  const sourceBasis = [
    sourceReference(
      "docs/source-materials/pdf-extracted-text.md",
      [
        "Requirement 2: 75-100 isolated beginner ASL vocabulary items appropriate for ASL 1 learners",
        "Requirement 10: targeted hints tied to observable or teachable aspects; rule-based hints allowed in the pilot",
        "Requirement 15: final docs must cover limitations and no-pretrained evidence",
      ],
      "Original extracted project text defining vocabulary, hint, documentation, and limitation obligations.",
    ),
    sourceReference(
      "docs/source-materials/requirements-matrix.md",
      [
        "R9-R10: isolated beginner ASL vocabulary and 75-100 ASL 1 items",
        "R28-R29: targeted hints tied to observable or teachable aspects",
        "Acceptance notes: no-pretrained recognition path remains strict",
      ],
      "Machine-readable project requirement matrix derived from the source PDF.",
    ),
  ];
  return {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: SOURCE_CURATED_STATUS,
    evidence_mode: SOURCE_CURATED_EVIDENCE_MODE,
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "scripts/promote_source_curated_vocabulary.mjs",
      command,
      script: {
        path: "scripts/promote_source_curated_vocabulary.mjs",
        sha256: sha256File(resolveProjectPath("scripts/promote_source_curated_vocabulary.mjs", "script")),
      },
    },
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
    },
    item_count: items.length,
    approved_item_ids: items.map((item) => item.id),
    source_basis: sourceBasis,
    curation_assertions: Object.fromEntries(requiredSourceCurationAssertions.map((key) => [key, true])),
    external_review: {
      required_for_source_aligned_pilot: false,
      completed: false,
      claim: "No external Deaf educator, ASL instructor, or reviewer approval is claimed by this source-curated evidence.",
      optional_stronger_evidence: "The external review packet and Ed25519 receipt workflow may still be used later, but it is not required for source-aligned pilot completion.",
    },
    hint_policy: {
      status: SOURCE_CURATED_STATUS,
      required_fields: requiredHintReviewFields,
      limitation: "Hints are source-curated, rule-based coaching text tied to expected signs or camera framing. They must not claim attempt-specific handshape, location, or movement diagnosis unless runtime evidence actually measures that feature.",
    },
    limitations: [
      "Qualified ASL instructor or Deaf educator review is pending and is not claimed by this evidence.",
      "Vocabulary and hints are source-curated for a controlled ASL 1 pilot, not a classroom-assessment-grade or research-grade product.",
      "Regional sign variation and signer-specific production differences remain known limitations for final documentation and validation.",
    ],
    items: items.map((item) => ({
      ...item,
      reviewStatus: SOURCE_CURATED_STATUS,
      approved: true,
      hintReview: Object.fromEntries(requiredHintReviewFields.map((key) => [key, true])),
      notes: "Source-curated for source-aligned pilot use; no external reviewer approval claimed.",
    })),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultReviewEvidencePath;
  const before = parseVocabularySource();
  const itemFindings = validateVocabularyItems(before.items);
  if (itemFindings.length > 0) {
    throw new Error(`Cannot promote source-curated vocabulary: ${itemFindings.join("; ")}`);
  }
  const nextSource = sourceCuratedVocabularyText(before.source);
  if (args.write && nextSource !== before.source) {
    fs.writeFileSync(vocabularyPath, nextSource, "utf8");
  }
  const after = parseVocabularySource();
  const evidence = buildEvidence({
    items: after.items,
    command: ["node", "scripts/promote_source_curated_vocabulary.mjs", ...process.argv.slice(2)],
  });
  const validation = validateSourceCuratedVocabularyEvidence(evidence);
  if (validation.findings.length > 0) {
    throw new Error(`Generated source-curated evidence did not validate: ${validation.findings.join("; ")}`);
  }
  if (args.write) {
    writeJson(evidencePath, evidence);
  }
  console.log(JSON.stringify({
    status: args.write ? SOURCE_CURATED_STATUS : "dry_run_valid",
    wrote: args.write,
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      item_count: after.items.length,
      review_status: after.items[0]?.reviewStatus ?? null,
    },
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
      sha256: fs.existsSync(evidencePath) ? sha256File(evidencePath) : null,
    },
    project: projectRelative(root) || ".",
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Source-curated vocabulary promotion failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
