import fs from "node:fs";
import {
  defaultReviewPacketPath,
  defaultReviewEvidencePath,
  defaultReviewReceiptPath,
  defaultReviewerAuthorityPath,
  parseVocabularySource,
  projectRelative,
  readJson,
  resolveProjectPath,
  sha256File,
  validateVocabularyReviewEvidence,
  vocabularyPath,
} from "./vocabulary_review_utils.mjs";

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
  node scripts/audit_vocabulary_review.mjs [--evidence docs/review/final-vocabulary-review.json]

Fails until the ASL vocabulary source and canonical vocabulary evidence prove
that all 75-100 prompts and coaching hints are either source-curated for the
source-aligned pilot or covered by stronger external review evidence.
`);
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
  const { source, items } = parseVocabularySource();
  const blockers = [];
  if (!fs.existsSync(evidencePath)) {
    const evidenceProbe = validateVocabularyReviewEvidence(null);
    blockers.push(...evidenceProbe.findings.filter((finding) => finding !== "Review evidence must be an object"));
    blockers.push(`Review evidence is missing: ${projectRelative(evidencePath)}`);
  } else {
    blockers.push(...validateVocabularyReviewEvidence(readJson(evidencePath), {
      requireSourcePacketPath: projectRelative(defaultReviewPacketPath),
      requireReviewerReceiptPath: projectRelative(defaultReviewReceiptPath),
      requireReviewerAuthorityPath: projectRelative(defaultReviewerAuthorityPath),
    }).findings);
  }
  const summary = {
    status: blockers.length === 0 ? (fs.existsSync(evidencePath) ? readJson(evidencePath).status : "passed") : "incomplete",
    checked_at: new Date().toISOString(),
    vocabulary: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      item_count: items.length,
      source_contains_unreviewed_marker: source.includes("needs_deaf_educator_review"),
    },
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
    },
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Vocabulary review audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
