import fs from "node:fs";
import path from "node:path";
import {
  fileAppearsToContainPrivateKey,
  firstSymlinkedProjectPathComponent,
  projectRelative,
  reviewerAuthorityEvidenceMaterialFindings,
  root,
  sha256File,
} from "./vocabulary_review_utils.mjs";

const evidenceRootRelative = "data/vocabulary-review/evidence";
const defaultOutputDir = path.join(root, evidenceRootRelative, "reviewer-authority");

const evidenceFlags = new Map([
  ["--credential-evidence-file", {
    key: "credential_evidence_files",
    purpose: "Reviewer ASL qualification or credential evidence",
    prefix: "credential",
  }],
  ["--key-binding-evidence-file", {
    key: "key_binding_evidence_files",
    purpose: "Evidence that the Ed25519 public key belongs to this reviewer",
    prefix: "key-binding",
  }],
  ["--trusted-by-evidence-file", {
    key: "trusted_by_evidence_files",
    purpose: "Operator attestation that reviewer identity and key binding were checked before review",
    prefix: "trusted-by",
  }],
]);

function parseArgs(argv) {
  const args = {
    output_dir: defaultOutputDir,
    force: false,
    credential_evidence_files: [],
    key_binding_evidence_files: [],
    trusted_by_evidence_files: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--force") {
      args.force = true;
      continue;
    }
    if (item === "--output-dir") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output-dir");
      args.output_dir = value;
      index += 1;
      continue;
    }
    const evidenceFlag = evidenceFlags.get(item);
    if (evidenceFlag) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[evidenceFlag.key].push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/stage_vocabulary_reviewer_authority_evidence.mjs \\
    --credential-evidence-file /path/to/reviewer-credential.pdf \\
    --key-binding-evidence-file /path/to/reviewer-key-binding.txt \\
    --trusted-by-evidence-file /path/to/operator-trust-attestation.txt \\
    [--output-dir data/vocabulary-review/evidence/reviewer-authority] \\
    [--force]

Copies real reviewer authority evidence files into the ignored project evidence
root used by prepare_vocabulary_reviewer_authority.mjs. It rejects symlinks,
symlinked output directories, directories, empty files, private keys, and output
directories outside data/vocabulary-review/evidence/.

This helper does not create reviewer authority evidence by itself. The copied
files become authority evidence only when a valid
data/vocabulary-review/asl-pilot-reviewer-authority.json hash-pins them.
`);
}

function resolveInputPath(value, flag) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) {
    throw new Error(`${flag} does not exist: ${value}`);
  }
  const stats = fs.lstatSync(resolved);
  if (stats.isSymbolicLink()) {
    throw new Error(`${flag} must be a real copied evidence file, not a symbolic link: ${value}`);
  }
  if (!stats.isFile()) {
    throw new Error(`${flag} must be a file: ${value}`);
  }
  if (stats.size === 0) {
    throw new Error(`${flag} must not be an empty evidence file: ${value}`);
  }
  return resolved;
}

function resolveOutputDir(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  const evidenceRoot = path.join(root, evidenceRootRelative);
  if (resolved !== evidenceRoot && !resolved.startsWith(`${evidenceRoot}${path.sep}`)) {
    throw new Error(`--output-dir must be ${evidenceRootRelative} or a child path under it`);
  }
  const symlinkedComponent = firstSymlinkedProjectPathComponent(resolved);
  if (symlinkedComponent) {
    throw new Error(`--output-dir must not include a symbolic link path component: ${projectRelative(symlinkedComponent)}`);
  }
  return resolved;
}

function safeBasename(file) {
  const parsed = path.parse(file);
  const name = parsed.name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "evidence";
  const extension = parsed.ext.replace(/[^A-Za-z0-9._-]+/g, "");
  return `${name}${extension}`;
}

function stageFile({ sourcePath, outputDir, prefix, purpose, force }) {
  if (fileAppearsToContainPrivateKey(sourcePath)) {
    throw new Error(`${path.basename(sourcePath)} appears to contain a private key; do not store private keys in reviewer authority evidence`);
  }
  const materialFindings = reviewerAuthorityEvidenceMaterialFindings(sourcePath, path.basename(sourcePath));
  if (materialFindings.length > 0) {
    throw new Error(materialFindings.join("; "));
  }
  const basename = `${prefix}-${safeBasename(sourcePath)}`;
  const destination = path.join(outputDir, basename);
  const sourceHash = sha256File(sourcePath);
  if (sourcePath === destination) {
    return {
      path: projectRelative(destination),
      sha256: sourceHash,
      purpose,
      staged: false,
      reason: "already_in_output_path",
    };
  }
  if (fs.existsSync(destination)) {
    const destinationStats = fs.lstatSync(destination);
    if (destinationStats.isSymbolicLink()) {
      throw new Error(`Refusing to overwrite symlink destination: ${projectRelative(destination)}`);
    }
    if (!destinationStats.isFile()) {
      throw new Error(`Refusing to overwrite non-file destination: ${projectRelative(destination)}`);
    }
    const destinationHash = sha256File(destination);
    if (destinationHash !== sourceHash && !force) {
      throw new Error(`Destination exists with different content; pass --force to replace: ${projectRelative(destination)}`);
    }
    if (destinationHash === sourceHash) {
      return {
        path: projectRelative(destination),
        sha256: destinationHash,
        purpose,
        staged: false,
        reason: "already_staged_same_hash",
      };
    }
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const prior = fs.existsSync(destination)
    ? {
        exists: true,
        bytes: fs.readFileSync(destination),
        mode: fs.statSync(destination).mode,
      }
    : { exists: false };
  fs.copyFileSync(sourcePath, destination);
  return {
    path: projectRelative(destination),
    sha256: sha256File(destination),
    purpose,
    staged: true,
    reason: "copied",
    rollback: {
      path: destination,
      prior,
    },
  };
}

function rollbackStageWrites(records) {
  for (const record of records.toReversed()) {
    if (!record?.rollback) continue;
    const { path: destination, prior } = record.rollback;
    if (prior.exists) {
      fs.writeFileSync(destination, prior.bytes);
      fs.chmodSync(destination, prior.mode);
    } else {
      fs.rmSync(destination, { force: true });
    }
  }
}

function evidenceInputs(args) {
  return [
    ...args.credential_evidence_files.map((value) => ({
      flag: "--credential-evidence-file",
      value,
      ...evidenceFlags.get("--credential-evidence-file"),
    })),
    ...args.key_binding_evidence_files.map((value) => ({
      flag: "--key-binding-evidence-file",
      value,
      ...evidenceFlags.get("--key-binding-evidence-file"),
    })),
    ...args.trusted_by_evidence_files.map((value) => ({
      flag: "--trusted-by-evidence-file",
      value,
      ...evidenceFlags.get("--trusted-by-evidence-file"),
    })),
  ];
}

function groupedFlags(records) {
  return {
    credential_evidence_files: records
      .filter((record) => record.key === "credential_evidence_files")
      .map((record) => record.path),
    key_binding_evidence_files: records
      .filter((record) => record.key === "key_binding_evidence_files")
      .map((record) => record.path),
    trusted_by_evidence_files: records
      .filter((record) => record.key === "trusted_by_evidence_files")
      .map((record) => record.path),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const inputs = evidenceInputs(args);
  if (inputs.length === 0) {
    throw new Error("At least one reviewer authority evidence file is required");
  }
  const outputDir = resolveOutputDir(args.output_dir);
  const stagedFiles = [];
  try {
    for (const input of inputs) {
      stagedFiles.push({
        key: input.key,
        ...stageFile({
          sourcePath: resolveInputPath(input.value, input.flag),
          outputDir,
          prefix: input.prefix,
          purpose: input.purpose,
          force: args.force,
        }),
      });
    }
  } catch (error) {
    rollbackStageWrites(stagedFiles);
    throw error;
  }
  const flags = groupedFlags(stagedFiles);
  console.log(JSON.stringify({
    schema_version: "asl-pilot-reviewer-authority-evidence-staging/v1",
    status: "staged",
    output_dir: projectRelative(outputDir),
    staged_files: stagedFiles.map(({ key, rollback, ...record }) => record),
    prepare_vocabulary_reviewer_authority_flags: {
      credential_evidence_file: flags.credential_evidence_files,
      key_binding_evidence_file: flags.key_binding_evidence_files,
      trusted_by_evidence_file: flags.trusted_by_evidence_files,
    },
    boundaries: {
      creates_reviewer_authority: false,
      private_keys_allowed: false,
      symlinks_allowed: false,
    },
    next_command: "node scripts/prepare_vocabulary_reviewer_authority.mjs --help",
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Reviewer authority evidence staging failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
