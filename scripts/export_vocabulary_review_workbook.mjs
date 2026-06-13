import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewPacketPath,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyItems,
} from "./vocabulary_review_utils.mjs";

const defaultOutputPath = path.join(root, "docs", "review", "vocabulary-review-workbook.md");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--input" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_vocabulary_review_workbook.mjs [--input data/vocabulary-review/asl-pilot-vocabulary-review.json] [--output docs/review/vocabulary-review-workbook.md]

Creates a deterministic, human-readable workbook from the canonical vocabulary
review JSON packet. The workbook is for reviewer/operator convenience only; final
review evidence still comes from importing the completed JSON packet.
`);
}

function escapeCell(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function renderWorkbook(packet, inputPath) {
  const items = Array.isArray(packet.items) ? packet.items : [];
  const sourcePath = packet.vocabulary_source?.path ?? "web/src/lib/vocabulary.ts";
  const sourceHash = packet.vocabulary_source?.sha256 ?? "";
  const hintReviewKeys = [
    "beginnerAppropriate",
    "aslAppropriate",
    "relatesToHintKind",
    "avoidsUnmeasuredAttemptDiagnosis",
  ];
  const rows = items
    .map((item, index) => {
      const hintReview = item.hintReview && typeof item.hintReview === "object"
        ? item.hintReview
        : {};
      const hintReviewComplete = hintReviewKeys.every((key) => hintReview[key] === true);
      const hintReviewSummary = hintReviewKeys
        .map((key) => `${key}=${hintReview[key] === true}`)
        .join("<br>");
      return [
        String(index + 1),
        item.id,
        item.label,
        item.category,
        item.prompt,
        item.coachingHint,
        item.hintKind,
        item.reviewStatus,
        String(item.approved),
        String(hintReviewComplete),
        hintReviewSummary,
        "",
      ].map(escapeCell).join(" | ");
    })
    .map((row) => `| ${row} |`)
    .join("\n");

  return `# Vocabulary Review Workbook

This workbook is a reviewer-friendly companion to the canonical JSON packet. It is not final review evidence by itself.

## Canonical Packet

- JSON packet: \`${projectRelative(inputPath)}\`
- JSON packet SHA-256: \`${sha256File(inputPath)}\`
- Vocabulary source: \`${escapeCell(sourcePath)}\`
- Vocabulary source SHA-256: \`${escapeCell(sourceHash)}\`
- Item count: ${items.length}

## Reviewer Requirements

- Reviewer must be a Deaf educator or qualified ASL instructor.
- Reviewer must not be the project operator.
- Reviewer must complete the JSON packet, not only this workbook.
- Reviewer must return a matching Ed25519-signed reviewer receipt as \`data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json\`.
- Operator must stage a matching trusted reviewer key record as \`data/vocabulary-review/asl-pilot-reviewer-authority.json\` before import.
- Every item must end with \`reviewStatus: "reviewed"\` and \`approved: true\`.
- Every item must set \`hintReview.beginnerAppropriate\`, \`hintReview.aslAppropriate\`, \`hintReview.relatesToHintKind\`, and \`hintReview.avoidsUnmeasuredAttemptDiagnosis\` to \`true\` in the JSON packet.
- Reviewer identity, role, qualification, affiliation/context, contact or signed evidence, non-operator status, and a full non-future ISO reviewed timestamp with timezone must be filled in the JSON packet.
- If a prompt, label, category, coaching hint, or hint kind is corrected here, copy the same correction into the JSON packet before import.

If the reviewer needs an unsigned receipt payload to sign, run
\`node scripts/draft_vocabulary_reviewer_receipt.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json --write\`
after the JSON packet is complete. That unsigned draft is not final evidence;
replace it with the returned Ed25519-signed receipt before import.

If the reviewer cannot run repo-local scripts, first return the completed JSON
packet. The project operator will stage it at the canonical path, run
\`node scripts/prepare_vocabulary_review_signature_request.mjs\`, and send back
\`output/review-handoff/vocabulary-review-signature-request/\` for Ed25519
signing. Only the returned signed receipt is final evidence.

## Return Validation Commands

\`\`\`sh
cp /path/to/returned/asl-pilot-vocabulary-review.json data/vocabulary-review/asl-pilot-vocabulary-review.json
cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json
node scripts/report_vocabulary_review_status.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json
node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json
node scripts/process_returned_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json --apply
node scripts/audit_vocabulary_review.mjs
node scripts/audit_hint_pedagogy_review.mjs
\`\`\`

## Items

| # | ID | Label | Category | Prompt | Coaching Hint | Hint Kind | Current Review Status | Approved | Hint Review Complete | Hint Review Fields | Reviewer Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const inputPath = args.input
    ? resolveProjectPath(args.input, "--input")
    : defaultReviewPacketPath;
  const outputPath = args.output
    ? resolveProjectPath(args.output, "--output")
    : defaultOutputPath;
  const packet = readJson(inputPath);
  if (packet.schema_version !== "asl-pilot-vocabulary-review/v1") {
    throw new Error("input schema_version must be asl-pilot-vocabulary-review/v1");
  }
  const findings = validateVocabularyItems(packet.items);
  if (findings.length > 0) {
    throw new Error(`Cannot export workbook: ${findings.join("; ")}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderWorkbook(packet, inputPath), "utf8");
  console.log(JSON.stringify({
    status: "exported",
    input: projectRelative(inputPath),
    output: projectRelative(outputPath),
    item_count: packet.items.length,
    sha256: sha256File(outputPath),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review workbook export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
