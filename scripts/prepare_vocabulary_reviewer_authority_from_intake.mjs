import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewerAuthorityPath,
  projectRelative,
  readJson,
  root,
} from "./vocabulary_review_utils.mjs";

const defaultInputPath = path.join(root, "data", "vocabulary-review", "evidence", "reviewer-authority-intake.json");
const defaultOutputPath = path.join(root, "output", "review-handoff", "vocabulary-reviewer-authority-candidate.json");
const defaultStagedOutputDir = "data/vocabulary-review/evidence/reviewer-authority";

const requiredVerificationFlags = [
  "reviewer_not_project_operator",
  "ed25519_public_key_fingerprint_checked",
  "credential_supports_asl_pedagogy_review",
  "key_binding_checked_before_review",
  "trusted_by_is_distinct_from_reviewer",
  "evidence_files_are_real_and_non_empty",
  "no_private_keys_included",
];

function parseArgs(argv) {
  const args = {
    input: defaultInputPath,
    output: defaultOutputPath,
    staged_output_dir: defaultStagedOutputDir,
    write: false,
    force: false,
  };
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
    if (item === "--dry-run") {
      args.write = false;
      continue;
    }
    if (item === "--canonical") {
      args.output = defaultReviewerAuthorityPath;
      continue;
    }
    if (item === "--force") {
      args.force = true;
      continue;
    }
    if (item === "--input" || item === "--output" || item === "--staged-output-dir") {
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
  node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs \\
    --input data/vocabulary-review/evidence/reviewer-authority-intake.json \\
    [--staged-output-dir data/vocabulary-review/evidence/reviewer-authority] \\
    [--output output/review-handoff/vocabulary-reviewer-authority-candidate.json | --canonical] \\
    [--force] \\
    [--write]

Reads a completed machine-readable reviewer authority intake, verifies the
operator confirmation flags, stages the referenced real evidence files into the
ignored vocabulary-review evidence root, then delegates to
prepare_vocabulary_reviewer_authority.mjs for final authority validation.

The intake file must be filled from real reviewer identity, ASL qualification,
Ed25519 public-key, key-binding, and operator trust-attestation evidence. This
helper does not create or infer reviewer evidence. Without --write it prints the
validated candidate authority; with --canonical --write it writes
data/vocabulary-review/asl-pilot-reviewer-authority.json only if the existing
authority validator passes.
`);
}

function resolveReadablePath(value, context) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${context} must be a non-empty path`);
  }
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) throw new Error(`${context} does not exist: ${value}`);
  const stats = fs.lstatSync(resolved);
  if (!stats.isFile()) throw new Error(`${context} must be a file: ${value}`);
  return resolved;
}

function resolveOutputPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`--output escapes project root: ${value}`);
  }
  return resolved;
}

function resolveStagedOutputDir(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  const evidenceRoot = path.join(root, "data", "vocabulary-review", "evidence");
  if (resolved !== evidenceRoot && !resolved.startsWith(`${evidenceRoot}${path.sep}`)) {
    throw new Error("--staged-output-dir must be data/vocabulary-review/evidence or a child path under it");
  }
  return resolved;
}

function snapshotDirectory(directory) {
  const tempRoot = fs.mkdtempSync(path.join(root, "output", ".reviewer-authority-intake-snapshot-"));
  const snapshotPath = path.join(tempRoot, "snapshot");
  const existed = fs.existsSync(directory);
  if (existed) {
    fs.cpSync(directory, snapshotPath, {
      recursive: true,
      verbatimSymlinks: true,
    });
  }
  return { directory, tempRoot, snapshotPath, existed };
}

function restoreDirectorySnapshot(snapshot) {
  fs.rmSync(snapshot.directory, { recursive: true, force: true });
  if (snapshot.existed) {
    fs.mkdirSync(path.dirname(snapshot.directory), { recursive: true });
    fs.cpSync(snapshot.snapshotPath, snapshot.directory, {
      recursive: true,
      verbatimSymlinks: true,
    });
  }
}

function discardDirectorySnapshot(snapshot) {
  fs.rmSync(snapshot.tempRoot, { recursive: true, force: true });
}

function requireObject(value, context) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }
  return value;
}

function rejectUnexpectedFields(record, allowedFields, context) {
  for (const field of Object.keys(record)) {
    if (!allowedFields.includes(field)) {
      throw new Error(`${context} contains unexpected field: ${field}`);
    }
  }
}

function requireString(value, context) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value.trim();
}

function requireTrue(value, context) {
  if (value !== true) throw new Error(`${context} must be true before authority preparation`);
}

function requireFileList(value, context) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context} must be a non-empty array of evidence file paths`);
  }
  return value.map((item, index) => {
    const file = requireString(item, `${context}[${index}]`);
    resolveReadablePath(file, `${context}[${index}]`);
    return file;
  });
}

function parseJsonOutput(result, context) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${context} did not print valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function runNode(args, context) {
  const result = spawnSync("node", args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error([
      `${context} failed`,
      result.stderr.trim(),
      result.stdout.trim(),
    ].filter(Boolean).join("\n"));
  }
  return result;
}

function intakeFromFile(inputPath) {
  const intake = readJson(inputPath);
  requireObject(intake, "intake");
  rejectUnexpectedFields(intake, [
    "schema_version",
    "trusted_at",
    "public_key_file",
    "reviewer",
    "credential_evidence",
    "key_binding_evidence",
    "trusted_by",
    "operator_verification",
  ], "intake");
  if (intake.schema_version !== "asl-pilot-reviewer-authority-intake/v1") {
    throw new Error("intake.schema_version must be asl-pilot-reviewer-authority-intake/v1");
  }

  const reviewer = requireObject(intake.reviewer, "intake.reviewer");
  const credentialEvidence = requireObject(intake.credential_evidence, "intake.credential_evidence");
  const keyBindingEvidence = requireObject(intake.key_binding_evidence, "intake.key_binding_evidence");
  const trustedBy = requireObject(intake.trusted_by, "intake.trusted_by");
  const trustedByEvidence = requireObject(trustedBy.evidence, "intake.trusted_by.evidence");
  const verification = requireObject(intake.operator_verification, "intake.operator_verification");
  rejectUnexpectedFields(reviewer, [
    "name",
    "role",
    "qualification",
    "affiliation_or_context",
    "contact_or_signed_evidence",
  ], "intake.reviewer");
  rejectUnexpectedFields(credentialEvidence, ["summary", "files"], "intake.credential_evidence");
  rejectUnexpectedFields(keyBindingEvidence, ["summary", "files"], "intake.key_binding_evidence");
  rejectUnexpectedFields(trustedBy, ["name", "role", "contact_or_signed_evidence", "evidence"], "intake.trusted_by");
  rejectUnexpectedFields(trustedByEvidence, ["summary", "files"], "intake.trusted_by.evidence");
  rejectUnexpectedFields(verification, requiredVerificationFlags, "intake.operator_verification");

  for (const flag of requiredVerificationFlags) {
    requireTrue(verification[flag], `intake.operator_verification.${flag}`);
  }

  return {
    trusted_at: requireString(intake.trusted_at, "intake.trusted_at"),
    public_key_file: requireString(intake.public_key_file, "intake.public_key_file"),
    reviewer: {
      name: requireString(reviewer.name, "intake.reviewer.name"),
      role: requireString(reviewer.role, "intake.reviewer.role"),
      qualification: requireString(reviewer.qualification, "intake.reviewer.qualification"),
      affiliation_or_context: requireString(reviewer.affiliation_or_context, "intake.reviewer.affiliation_or_context"),
      contact_or_signed_evidence: requireString(reviewer.contact_or_signed_evidence, "intake.reviewer.contact_or_signed_evidence"),
    },
    credential_evidence: {
      summary: requireString(credentialEvidence.summary, "intake.credential_evidence.summary"),
      files: requireFileList(credentialEvidence.files, "intake.credential_evidence.files"),
    },
    key_binding_evidence: {
      summary: requireString(keyBindingEvidence.summary, "intake.key_binding_evidence.summary"),
      files: requireFileList(keyBindingEvidence.files, "intake.key_binding_evidence.files"),
    },
    trusted_by: {
      name: requireString(trustedBy.name, "intake.trusted_by.name"),
      role: requireString(trustedBy.role, "intake.trusted_by.role"),
      contact_or_signed_evidence: requireString(trustedBy.contact_or_signed_evidence, "intake.trusted_by.contact_or_signed_evidence"),
      evidence: {
        summary: requireString(trustedByEvidence.summary, "intake.trusted_by.evidence.summary"),
        files: requireFileList(trustedByEvidence.files, "intake.trusted_by.evidence.files"),
      },
    },
  };
}

function stageEvidence(intake, args) {
  const stageArgs = [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--output-dir",
    args.staged_output_dir,
  ];
  for (const file of intake.credential_evidence.files) {
    stageArgs.push("--credential-evidence-file", file);
  }
  for (const file of intake.key_binding_evidence.files) {
    stageArgs.push("--key-binding-evidence-file", file);
  }
  for (const file of intake.trusted_by.evidence.files) {
    stageArgs.push("--trusted-by-evidence-file", file);
  }
  if (args.force) stageArgs.push("--force");
  const result = runNode(stageArgs, "Reviewer authority evidence staging");
  return parseJsonOutput(result, "Reviewer authority evidence staging");
}

function prepareAuthority(intake, args, staged) {
  const stagedFlags = staged.prepare_vocabulary_reviewer_authority_flags ?? {};
  const outputPath = resolveOutputPath(args.output);
  const prepareArgs = [
    "scripts/prepare_vocabulary_reviewer_authority.mjs",
    "--public-key",
    intake.public_key_file,
    "--trusted-at",
    intake.trusted_at,
    "--reviewer-name",
    intake.reviewer.name,
    "--reviewer-role",
    intake.reviewer.role,
    "--reviewer-qualification",
    intake.reviewer.qualification,
    "--reviewer-affiliation-or-context",
    intake.reviewer.affiliation_or_context,
    "--reviewer-contact-or-signed-evidence",
    intake.reviewer.contact_or_signed_evidence,
    "--credential-evidence",
    intake.credential_evidence.summary,
    "--key-binding-evidence",
    intake.key_binding_evidence.summary,
    "--trusted-by-evidence",
    intake.trusted_by.evidence.summary,
    "--trusted-by-name",
    intake.trusted_by.name,
    "--trusted-by-role",
    intake.trusted_by.role,
    "--trusted-by-contact-or-signed-evidence",
    intake.trusted_by.contact_or_signed_evidence,
  ];

  for (const file of stagedFlags.credential_evidence_file ?? []) {
    prepareArgs.push("--credential-evidence-file", file);
  }
  for (const file of stagedFlags.key_binding_evidence_file ?? []) {
    prepareArgs.push("--key-binding-evidence-file", file);
  }
  for (const file of stagedFlags.trusted_by_evidence_file ?? []) {
    prepareArgs.push("--trusted-by-evidence-file", file);
  }

  if (outputPath === defaultReviewerAuthorityPath) {
    prepareArgs.push("--canonical");
  } else {
    prepareArgs.push("--output", outputPath);
  }
  if (args.write) prepareArgs.push("--write");

  const result = runNode(prepareArgs, "Reviewer authority preparation");
  return {
    command: ["node", ...prepareArgs],
    summary: parseJsonOutput(result, "Reviewer authority preparation"),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const inputPath = resolveReadablePath(args.input, "--input");
  const intake = intakeFromFile(inputPath);
  const stagedOutputDir = resolveStagedOutputDir(args.staged_output_dir);
  const snapshot = snapshotDirectory(stagedOutputDir);
  let staged;
  let prepared;
  try {
    staged = stageEvidence(intake, args);
    prepared = prepareAuthority(intake, args, staged);
  } catch (error) {
    restoreDirectorySnapshot(snapshot);
    throw error;
  } finally {
    discardDirectorySnapshot(snapshot);
  }
  console.log(JSON.stringify({
    schema_version: "asl-pilot-reviewer-authority-intake-result/v1",
    status: prepared.summary.status,
    input: projectRelative(inputPath),
    staged_output_dir: staged.output_dir,
    staged_files: staged.staged_files,
    authority_output: prepared.summary.output,
    canonical_output: prepared.summary.canonical_output,
    requested_write: prepared.summary.requested_write,
    write: prepared.summary.write,
    reviewer: prepared.summary.reviewer,
    trusted_key: prepared.summary.trusted_key,
    validation: prepared.summary.validation,
    authority: args.write ? undefined : prepared.summary.authority,
    next_command: prepared.summary.validation?.valid
      ? "node scripts/report_vocabulary_reviewer_authority_status.mjs"
      : "Fix the completed intake/evidence files, then rerun this helper.",
  }, null, 2));
  return prepared.summary.validation?.valid ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Reviewer authority intake preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
