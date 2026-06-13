import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sha256Bytes } from "./signed_receipt_utils.mjs";
import {
  defaultReviewerAuthorityPath,
  fileAppearsToContainPrivateKey,
  firstSymlinkedProjectPathComponent,
  projectRelative,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
  writeJson,
} from "./vocabulary_review_utils.mjs";

const defaultOutputPath = path.join(root, "output", "review-handoff", "vocabulary-reviewer-authority-candidate.json");

function parseArgs(argv) {
  const args = {
    output: defaultOutputPath,
    write: false,
    trusted_at: new Date().toISOString(),
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
    if (
      item === "--public-key" ||
      item === "--output" ||
      item === "--trusted-at" ||
      item === "--reviewer-name" ||
      item === "--reviewer-role" ||
      item === "--reviewer-qualification" ||
      item === "--reviewer-affiliation-or-context" ||
      item === "--reviewer-contact-or-signed-evidence" ||
      item === "--credential-evidence" ||
      item === "--key-binding-evidence" ||
      item === "--trusted-by-evidence" ||
      item === "--trusted-by-name" ||
      item === "--trusted-by-role" ||
      item === "--trusted-by-contact-or-signed-evidence"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    if (
      item === "--credential-evidence-file" ||
      item === "--key-binding-evidence-file" ||
      item === "--trusted-by-evidence-file"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      const key = {
        "--credential-evidence-file": "credential_evidence_files",
        "--key-binding-evidence-file": "key_binding_evidence_files",
        "--trusted-by-evidence-file": "trusted_by_evidence_files",
      }[item];
      args[key].push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/prepare_vocabulary_reviewer_authority.mjs \\
    --public-key /path/to/reviewer-ed25519-public-key.pem \\
    --reviewer-name "Reviewer Name" \\
    --reviewer-role "Qualified ASL instructor" \\
    --reviewer-qualification "Actual ASL qualification" \\
    --reviewer-affiliation-or-context "School, program, or independent context" \\
    --reviewer-contact-or-signed-evidence "contact or credential reference" \\
    --credential-evidence "credential evidence summary" \\
    --credential-evidence-file data/vocabulary-review/evidence/reviewer-credential.txt \\
    --key-binding-evidence "key-binding evidence summary" \\
    --key-binding-evidence-file data/vocabulary-review/evidence/reviewer-key-binding.txt \\
    --trusted-by-evidence "operator trust attestation summary" \\
    --trusted-by-evidence-file data/vocabulary-review/evidence/operator-trust-attestation.txt \\
    --trusted-by-name "Operator Name" \\
    --trusted-by-role "Operator role" \\
    --trusted-by-contact-or-signed-evidence "operator contact or signature reference" \\
    [--trusted-at 2026-05-20T00:00:00.000Z] \\
    [--output output/review-handoff/vocabulary-reviewer-authority-candidate.json | --canonical] \\
    [--write]

Builds and validates a pre-review trusted reviewer key authority record. Without
--write, it prints the candidate JSON and validation result. Use --canonical
only after the real reviewer identity, credential evidence, and key-binding
evidence are ready to stage at data/vocabulary-review/asl-pilot-reviewer-authority.json.
The quoted command values above are examples only; copied example text is
rejected by validation.
Evidence files must be copied into the project first, preferably under ignored
data/vocabulary-review/evidence/, so the authority record can hash-pin them.
`);
}

function requireString(args, key) {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`--${key.replaceAll("_", "-")} is required`);
  }
  return value.trim();
}

function resolveInputPath(value, flag) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!fs.existsSync(resolved)) {
    throw new Error(`${flag} does not exist: ${value}`);
  }
  return resolved;
}

function resolveProjectEvidencePath(value, flag) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${flag} must be a project-local evidence file: ${value}`);
  }
  const relative = projectRelative(resolved);
  if (!relative.startsWith("data/vocabulary-review/evidence/")) {
    throw new Error(`${flag} must be under data/vocabulary-review/evidence/: ${value}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`${flag} does not exist: ${value}`);
  }
  const linkStats = fs.lstatSync(resolved);
  if (linkStats.isSymbolicLink()) {
    throw new Error(`${flag} must be a copied evidence file, not a symbolic link: ${value}`);
  }
  const symlinkedAncestor = firstSymlinkedProjectPathComponent(resolved, { includeTarget: false });
  if (symlinkedAncestor) {
    throw new Error(`${flag} must not include a symbolic link path component: ${projectRelative(symlinkedAncestor)}`);
  }
  if (!linkStats.isFile()) {
    throw new Error(`${flag} must be a file: ${value}`);
  }
  if (linkStats.size === 0) {
    throw new Error(`${flag} must not be an empty evidence file: ${value}`);
  }
  if (fileAppearsToContainPrivateKey(resolved)) {
    throw new Error(`${flag} must not contain private key material: ${value}`);
  }
  return resolved;
}

function evidenceFileReferences(values, flag, purpose) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${flag} is required at least once`);
  }
  return values.map((value) => {
    const evidencePath = resolveProjectEvidencePath(value, flag);
    return {
      path: projectRelative(evidencePath),
      sha256: sha256File(evidencePath),
      purpose,
    };
  });
}

function trustedKeyFromArgs(args) {
  if (typeof args.public_key !== "string") {
    throw new Error("--public-key is required");
  }
  const inputPath = resolveInputPath(args.public_key, "--public-key");
  if (fileAppearsToContainPrivateKey(inputPath)) {
    throw new Error("--public-key must be a public key file, not private key material");
  }
  const key = crypto.createPublicKey(fs.readFileSync(inputPath));
  if (key.asymmetricKeyType !== "ed25519") {
    throw new Error("--public-key must resolve to an Ed25519 public key");
  }
  return {
    algorithm: "ed25519",
    public_key_pem: key.export({ type: "spki", format: "pem" }),
    signer_key_fingerprint_sha256: sha256Bytes(key.export({ type: "spki", format: "der" })),
  };
}

function buildAuthority(args) {
  return {
    schema_version: "asl-pilot-reviewer-authority/v1",
    status: "trusted_reviewer_key",
    trusted_at: args.trusted_at,
    pre_review_key_binding_confirmed: true,
    reviewer: {
      name: requireString(args, "reviewer_name"),
      role: requireString(args, "reviewer_role"),
      qualification: requireString(args, "reviewer_qualification"),
      affiliation_or_context: requireString(args, "reviewer_affiliation_or_context"),
      contact_or_signed_evidence: requireString(args, "reviewer_contact_or_signed_evidence"),
      is_project_operator: false,
    },
    trusted_key: trustedKeyFromArgs(args),
    credential_evidence: {
      summary: requireString(args, "credential_evidence"),
      files: evidenceFileReferences(
        args.credential_evidence_files,
        "--credential-evidence-file",
        "Reviewer ASL qualification or credential evidence",
      ),
    },
    key_binding_evidence: {
      summary: requireString(args, "key_binding_evidence"),
      files: evidenceFileReferences(
        args.key_binding_evidence_files,
        "--key-binding-evidence-file",
        "Evidence that the Ed25519 public key belongs to this reviewer",
      ),
    },
    trusted_by: {
      name: requireString(args, "trusted_by_name"),
      role: requireString(args, "trusted_by_role"),
      contact_or_signed_evidence: requireString(args, "trusted_by_contact_or_signed_evidence"),
      evidence: {
        summary: requireString(args, "trusted_by_evidence"),
        files: evidenceFileReferences(
          args.trusted_by_evidence_files,
          "--trusted-by-evidence-file",
          "Operator attestation that reviewer identity and key binding were checked before review",
        ),
      },
    },
  };
}

function validateAuthorityObject(authority) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-reviewer-authority-"));
  const tempPath = path.join(tempDir, "authority.json");
  try {
    writeJson(tempPath, authority);
    return validateVocabularyReviewerPreReviewAuthorityFile(tempPath);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeAuthorityJsonAtomic(outputPath, authority) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${Date.now()}.tmp`,
  );
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(authority, null, 2)}\n`, "utf8");
    fs.renameSync(tempPath, outputPath);
  } catch (error) {
    fs.rmSync(tempPath, { force: true });
    throw error;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const authority = buildAuthority(args);
  const validation = validateAuthorityObject(authority);
  const valid = validation.findings.length === 0;
  const outputPath = path.isAbsolute(args.output) ? args.output : path.resolve(root, args.output);
  if (args.write && valid) {
    writeAuthorityJsonAtomic(outputPath, authority);
  }
  console.log(JSON.stringify({
    status: valid ? "ready_for_pre_review" : "blocked",
    write: args.write && valid,
    requested_write: args.write,
    output: args.write && valid ? projectRelative(outputPath) : null,
    canonical_output: outputPath === defaultReviewerAuthorityPath,
    reviewer: authority.reviewer,
    trusted_key: {
      algorithm: authority.trusted_key.algorithm,
      signer_key_fingerprint_sha256: authority.trusted_key.signer_key_fingerprint_sha256,
    },
    validation: {
      valid,
      findings: validation.findings,
    },
    authority: args.write ? undefined : authority,
  }, null, 2));
  return valid ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Reviewer authority preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
