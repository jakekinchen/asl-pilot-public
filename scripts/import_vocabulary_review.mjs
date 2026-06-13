import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
  validateCompletedVocabularyReviewPacket,
  validateVocabularyItems,
  vocabularyPath,
  writeJson,
} from "./vocabulary_review_utils.mjs";

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (item === "--input" || item === "--evidence" || item === "--reviewer-receipt") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/import_vocabulary_review.mjs --input data/vocabulary-review/asl-pilot-vocabulary-review.json [--reviewer-receipt data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json] [--dry-run]

Validates the canonical completed review packet, updates
web/src/lib/vocabulary.ts, and writes docs/review/final-vocabulary-review.json
as final review evidence. The signed reviewer receipt must match the trusted
reviewer key record at data/vocabulary-review/asl-pilot-reviewer-authority.json.
`);
}

function quote(value) {
  return JSON.stringify(String(value));
}

function renderVocabularySource(items) {
  const rows = items
    .map(
      (item) =>
        `  [${quote(item.id)}, ${quote(item.label)}, ${quote(item.category)}, ${quote(item.prompt)}, ${quote(item.coachingHint)}, ${quote(item.hintKind)}],`,
    )
    .join("\n");
  return `export type HintKind =
  | "handshape"
  | "movement"
  | "location"
  | "orientation"
  | "timing"
  | "framing";

export type VocabularyItem = {
  id: string;
  label: string;
  category: string;
  prompt: string;
  coachingHint: string;
  hintKind: HintKind;
  reviewStatus: "needs_deaf_educator_review" | "reviewed";
};

type VocabularySeed = [
  id: string,
  label: string,
  category: string,
  prompt: string,
  coachingHint: string,
  hintKind: HintKind,
];

const VOCABULARY_REVIEW_STATUS: VocabularyItem["reviewStatus"] = "reviewed";

const VOCABULARY_SEEDS: VocabularySeed[] = [
${rows}
];

export const VOCABULARY: VocabularyItem[] = VOCABULARY_SEEDS.map(
  ([
    id,
    label,
    category,
    prompt,
    coachingHint,
    hintKind,
  ]): VocabularyItem => ({
    id,
    label,
    category,
    prompt,
    coachingHint,
    hintKind,
    reviewStatus: VOCABULARY_REVIEW_STATUS,
  }),
);

export const VOCABULARY_COUNT = VOCABULARY.length;

export function getVocabularyItem(id: string): VocabularyItem | undefined {
  return VOCABULARY.find((item) => item.id === id);
}

export function getNextVocabularyItem(currentId: string): VocabularyItem {
  const index = VOCABULARY.findIndex((item) => item.id === currentId);
  return VOCABULARY[(index + 1) % VOCABULARY.length];
}
`;
}

function validatePacket(packet, { inputPath, reviewerReceiptPath }) {
  const findings = [];
  findings.push(...validateCompletedVocabularyReviewPacket(packet, {
    reviewPacketPath: inputPath,
    reviewerReceiptPath,
  }));

  const current = parseVocabularySource();
  const currentIds = current.items.map((item) => item.id).join("\n");
  const packetIds = Array.isArray(packet.items)
    ? packet.items.map((item) => item.id).join("\n")
    : "";
  if (currentIds !== packetIds) {
    findings.push("review packet item IDs must match current vocabulary order exactly");
  }
  if (packet.vocabulary_source?.sha256 !== sha256File(vocabularyPath)) {
    findings.push("review packet vocabulary_source.sha256 must match current vocabulary source before import");
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.input) throw new Error("--input is required");
  const inputPath = resolveProjectPath(args.input, "--input");
  if (projectRelative(inputPath) !== projectRelative(defaultReviewPacketPath)) {
    throw new Error(`--input must be the canonical returned packet path: ${projectRelative(defaultReviewPacketPath)}`);
  }
  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultReviewEvidencePath;
  const reviewerReceiptPath = args.reviewer_receipt
    ? resolveProjectPath(args.reviewer_receipt, "--reviewer-receipt")
    : defaultReviewReceiptPath;
  if (!args.dryRun && projectRelative(evidencePath) !== projectRelative(defaultReviewEvidencePath)) {
    throw new Error(`--evidence must be the canonical final evidence path: ${projectRelative(defaultReviewEvidencePath)}`);
  }
  if (!args.dryRun && projectRelative(reviewerReceiptPath) !== projectRelative(defaultReviewReceiptPath)) {
    throw new Error(`--reviewer-receipt must be the canonical receipt path for final import: ${projectRelative(defaultReviewReceiptPath)}`);
  }
  const packet = readJson(inputPath);
  const findings = validatePacket(packet, { inputPath, reviewerReceiptPath });
  if (findings.length > 0) {
    throw new Error(findings.join("; "));
  }
  const nextSource = renderVocabularySource(packet.items);
  const evidence = {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "reviewed",
    imported_at: new Date().toISOString(),
    generated_by: {
      tool: "scripts/import_vocabulary_review.mjs",
      command: [
        "node",
        "scripts/import_vocabulary_review.mjs",
        "--input",
        projectRelative(inputPath),
        ...(args.evidence ? ["--evidence", projectRelative(evidencePath)] : []),
      ],
      script: {
        path: projectRelative(scriptPath),
        sha256: sha256File(scriptPath),
      },
    },
    source_packet: {
      path: projectRelative(inputPath),
      sha256: sha256File(inputPath),
    },
    reviewer_signed_receipt: {
      path: projectRelative(reviewerReceiptPath),
      sha256: sha256File(reviewerReceiptPath),
    },
    reviewer_authority: {
      path: projectRelative(defaultReviewerAuthorityPath),
      sha256: sha256File(defaultReviewerAuthorityPath),
    },
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: args.dryRun
        ? "dry-run-not-written"
        : cryptoHash(nextSource),
    },
    reviewer: packet.reviewer,
    item_count: packet.items.length,
    approved_item_ids: packet.items.map((item) => item.id),
    notes: packet.items
      .filter((item) => typeof item.notes === "string" && item.notes.trim().length > 0)
      .map((item) => ({ id: item.id, notes: item.notes.trim() })),
  };

  if (!args.dryRun) {
    fs.writeFileSync(vocabularyPath, nextSource, "utf8");
    evidence.vocabulary_source.sha256 = sha256File(vocabularyPath);
    writeJson(evidencePath, evidence);
  }

  console.log(
    JSON.stringify(
      {
        status: args.dryRun ? "dry_run_valid" : "imported",
        item_count: packet.items.length,
        evidence: projectRelative(evidencePath),
      },
      null,
      2,
    ),
  );
  return 0;
}

function cryptoHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
