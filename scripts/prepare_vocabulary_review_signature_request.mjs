import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalVocabularyReviewerReceiptPayload,
  defaultReviewPacketPath,
  defaultReviewReceiptPath,
  defaultReviewerAuthorityPath,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
  writeJson,
} from "./vocabulary_review_utils.mjs";
import {
  sha256Text,
} from "./signed_receipt_utils.mjs";

const defaultOutputPath = path.join(root, "output", "review-handoff", "vocabulary-review-signature-request");
const receiptFileName = "asl-pilot-vocabulary-reviewer-receipt.json";
const payloadFileName = "canonical-reviewer-receipt-payload.txt";
const instructionsFileName = "SIGNATURE_INSTRUCTIONS.md";

function parseArgs(argv) {
  const args = {
    input: defaultReviewPacketPath,
    output: defaultOutputPath,
  };
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
  node scripts/prepare_vocabulary_review_signature_request.mjs \\
    [--input data/vocabulary-review/asl-pilot-vocabulary-review.json] \\
    [--output output/review-handoff/vocabulary-review-signature-request]

Builds an operator-side send-back folder after a reviewer returns the completed
canonical vocabulary packet. The folder contains the computed unsigned reviewer
receipt, canonical payload text, payload hash, and signing instructions. It does
not create final evidence; the reviewer must return the Ed25519-signed receipt,
then the signed receipt must be staged at ${projectRelative(defaultReviewReceiptPath)}
before final import.
`);
}

function receiptDraftCommand(inputPath, receiptPath) {
  return [
    process.execPath,
    "scripts/draft_vocabulary_reviewer_receipt.mjs",
    "--input",
    projectRelative(inputPath),
    "--output",
    projectRelative(receiptPath),
    "--write",
  ];
}

function runReceiptDraft(inputPath, writeReceiptPath, finalReceiptPath = writeReceiptPath) {
  const commandArgs = [
    ...receiptDraftCommand(inputPath, writeReceiptPath).slice(1),
  ];
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error([
      "Unable to prepare signature request because the returned packet is not ready for receipt drafting.",
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join("\n"));
  }
  return receiptDraftCommand(inputPath, finalReceiptPath).join(" ");
}

function instructions({ inputPath, receiptPath, payloadPath, payloadSha256, reviewerAuthority }) {
  return `# Vocabulary Reviewer Receipt Signature Instructions

This folder is a send-back signing request for the completed ASL Pilot
vocabulary review packet.

## Files

- \`${path.basename(receiptPath)}\`: unsigned computed reviewer receipt to sign
- \`${path.basename(payloadPath)}\`: exact canonical payload text that must be signed

## Reviewer Action

1. Verify the completed packet you reviewed is:
   - path: \`${projectRelative(inputPath)}\`
   - SHA-256: \`${sha256File(inputPath)}\`
2. Sign the exact bytes in \`${path.basename(payloadPath)}\` with the pre-vetted Ed25519 key:
   - authority record: \`${projectRelative(defaultReviewerAuthorityPath)}\`
   - signer key fingerprint SHA-256: \`${reviewerAuthority.trusted_key.signer_key_fingerprint_sha256}\`
3. Fill \`signature_evidence.public_key_pem\`, \`signature_evidence.signer_key_fingerprint_sha256\`, and \`signature_evidence.signature_base64\` in \`${path.basename(receiptPath)}\`.
4. Return only the signed \`${path.basename(receiptPath)}\`.

## Payload Hash

\`${payloadSha256}\`

The project import will verify the Ed25519 signature over this canonical payload
and reject hand-edited or noncanonical receipt evidence.
`;
}

function validateOutputPath(outputPath) {
  const relative = projectRelative(outputPath);
  const defaultRelative = projectRelative(defaultOutputPath);
  if (relative !== defaultRelative && !relative.startsWith(`${defaultRelative}/`)) {
    throw new Error(`--output must be ${defaultRelative} or a child path under it`);
  }
}

function tempOutputPath(outputPath) {
  return path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.tmp-${process.pid}-${Date.now()}`,
  );
}

function backupOutputPath(outputPath) {
  return path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.backup-${process.pid}-${Date.now()}`,
  );
}

function replaceOutputDirectory(stagingPath, outputPath) {
  const backupPath = backupOutputPath(outputPath);
  let movedExisting = false;
  let movedStaging = false;
  try {
    if (fs.existsSync(outputPath)) {
      fs.renameSync(outputPath, backupPath);
      movedExisting = true;
    }
    fs.renameSync(stagingPath, outputPath);
    movedStaging = true;
    if (movedExisting) fs.rmSync(backupPath, { recursive: true, force: true });
  } catch (error) {
    if (movedStaging) fs.rmSync(outputPath, { recursive: true, force: true });
    if (movedExisting && fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, outputPath);
    }
    throw error;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const inputPath = resolveProjectPath(args.input, "--input");
  const outputPath = resolveProjectPath(args.output, "--output");
  validateOutputPath(outputPath);
  if (projectRelative(inputPath) !== projectRelative(defaultReviewPacketPath)) {
    throw new Error(`--input must be the canonical returned packet path: ${projectRelative(defaultReviewPacketPath)}`);
  }
  if (!fs.existsSync(inputPath)) {
    throw new Error(`--input does not exist: ${projectRelative(inputPath)}`);
  }
  const reviewerAuthorityResult = validateVocabularyReviewerPreReviewAuthorityFile(defaultReviewerAuthorityPath);
  if (reviewerAuthorityResult.findings.length > 0) {
    throw new Error([
      "Unable to prepare signature request because the reviewer authority record is not ready.",
      ...reviewerAuthorityResult.findings,
    ].join("\n"));
  }

  const stagingPath = tempOutputPath(outputPath);
  const receiptPath = path.join(stagingPath, receiptFileName);
  const payloadPath = path.join(stagingPath, payloadFileName);
  const instructionsPath = path.join(stagingPath, instructionsFileName);
  const finalReceiptPath = path.join(outputPath, receiptFileName);
  const finalPayloadPath = path.join(outputPath, payloadFileName);
  const finalInstructionsPath = path.join(outputPath, instructionsFileName);
  let manifest;
  let payloadSha256;
  try {
    fs.rmSync(stagingPath, { recursive: true, force: true });
    fs.mkdirSync(stagingPath, { recursive: true });
    const receiptDraftCommand = runReceiptDraft(inputPath, receiptPath, finalReceiptPath);
    const receipt = readJson(receiptPath);
    const payload = canonicalVocabularyReviewerReceiptPayload(receipt);
    payloadSha256 = sha256Text(payload);
    if (payloadSha256 !== receipt.signature_evidence?.signed_payload_sha256) {
      throw new Error("computed payload SHA-256 does not match receipt.signature_evidence.signed_payload_sha256");
    }
    fs.writeFileSync(payloadPath, payload, "utf8");
    fs.writeFileSync(
      instructionsPath,
      instructions({
        inputPath,
        receiptPath: finalReceiptPath,
        payloadPath: finalPayloadPath,
        payloadSha256,
        reviewerAuthority: reviewerAuthorityResult.authority,
      }),
      "utf8",
    );

    manifest = {
      schema_version: "asl-pilot-vocabulary-review-signature-request/v1",
      status: "ready_for_external_signature",
      generated_at: new Date().toISOString(),
      source_packet: {
        path: projectRelative(inputPath),
        sha256: sha256File(inputPath),
      },
      unsigned_receipt: {
        path: projectRelative(finalReceiptPath),
        sha256: sha256File(receiptPath),
      },
      canonical_payload: {
        path: projectRelative(finalPayloadPath),
        sha256: sha256File(payloadPath),
        signed_payload_sha256: payloadSha256,
      },
      instructions: {
        path: projectRelative(finalInstructionsPath),
        sha256: sha256File(instructionsPath),
      },
      reviewer_authority: {
        path: projectRelative(defaultReviewerAuthorityPath),
        sha256: sha256File(defaultReviewerAuthorityPath),
        trusted_key_fingerprint_sha256:
          reviewerAuthorityResult.authority.trusted_key.signer_key_fingerprint_sha256,
      },
      final_staging_path: projectRelative(defaultReviewReceiptPath),
      draft_command: receiptDraftCommand,
    };
    writeJson(path.join(stagingPath, "MANIFEST.json"), manifest);
    replaceOutputDirectory(stagingPath, outputPath);
  } catch (error) {
    fs.rmSync(stagingPath, { recursive: true, force: true });
    throw error;
  }

  console.log(JSON.stringify({
    status: manifest.status,
    output: projectRelative(outputPath),
    source_packet: manifest.source_packet,
    unsigned_receipt: manifest.unsigned_receipt.path,
    canonical_payload: manifest.canonical_payload.path,
    signed_payload_sha256: payloadSha256,
    next_required_action: `Send ${projectRelative(outputPath)} to the reviewer for Ed25519 signing, then stage the returned signed receipt at ${projectRelative(defaultReviewReceiptPath)}.`,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary review signature request preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
