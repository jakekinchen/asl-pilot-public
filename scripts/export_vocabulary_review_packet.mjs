import {
  defaultReviewPacketPath,
  parseVocabularySource,
  projectRelative,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyItems,
  vocabularyPath,
  writeJson,
} from "./vocabulary_review_utils.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_vocabulary_review_packet.mjs [--output data/vocabulary-review/asl-pilot-vocabulary-review.json]

Creates a JSON packet for Deaf educator or qualified ASL instructor review.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output
    ? resolveProjectPath(args.output, "--output")
    : defaultReviewPacketPath;
  const { items } = parseVocabularySource();
  const findings = validateVocabularyItems(items);
  if (findings.length > 0) {
    throw new Error(`Cannot export review packet: ${findings.join("; ")}`);
  }
  const packet = {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "needs_review",
    created_at: new Date().toISOString(),
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
    },
    reviewer: {
      name: "",
      role: "",
      qualification: "",
      affiliation_or_context: "",
      contact_or_signed_evidence: "",
      is_project_operator: false,
      reviewed_at: "",
    },
    instructions: [
      "Review every ASL prompt, display label, and coaching hint for ASL 1 appropriateness.",
      "Set reviewStatus to reviewed and approved to true only after the item is acceptable.",
      "Set every hintReview field to true only after the coaching hint is beginner-appropriate, ASL-appropriate, matched to hintKind, and not pretending to diagnose unmeasured attempt details.",
      "Edit label, prompt, coachingHint, category, or hintKind directly in this packet when corrections are needed.",
      "Use notes for concerns, regional variation, or signs that should be replaced before collection/training.",
      "Return the completed JSON packet for import with scripts/import_vocabulary_review.mjs; reviewer.reviewed_at must be a full non-future ISO timestamp with timezone.",
      "Also return data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json with Ed25519 signature_evidence binding the reviewer to this completed packet.",
    ],
    items: items.map((item) => ({
      ...item,
      reviewStatus: "needs_deaf_educator_review",
      approved: false,
      hintReview: {
        beginnerAppropriate: false,
        aslAppropriate: false,
        relatesToHintKind: false,
        avoidsUnmeasuredAttemptDiagnosis: false,
      },
      notes: "",
    })),
  };
  writeJson(outputPath, packet);
  console.log(
    JSON.stringify(
      {
        status: "exported",
        output: projectRelative(outputPath),
        item_count: packet.items.length,
        project: projectRelative(root),
      },
      null,
      2,
    ),
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
