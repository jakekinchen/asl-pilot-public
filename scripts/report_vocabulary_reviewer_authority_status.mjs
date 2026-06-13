import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewerAuthorityPath,
  projectRelative,
  resolveProjectPath,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
} from "./vocabulary_review_utils.mjs";

const defaultEvidenceRootRelative = "data/vocabulary-review/evidence";
const defaultRequestBundleRelative = "output/review-handoff/reviewer-authority-request";

function parseArgs(argv) {
  const args = {
    authority: projectRelative(defaultReviewerAuthorityPath),
    evidence_root: defaultEvidenceRootRelative,
    limit: 10,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--authority" || item === "--evidence-root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    if (item === "--limit") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --limit");
      const limit = Number.parseInt(value, 10);
      if (!Number.isInteger(limit) || limit < 1) throw new Error("--limit must be a positive integer");
      args.limit = limit;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/report_vocabulary_reviewer_authority_status.mjs \\
    [--authority data/vocabulary-review/asl-pilot-reviewer-authority.json] \\
    [--evidence-root data/vocabulary-review/evidence] \\
    [--limit 10]

Prints a read-only status report for the pre-review reviewer authority gate.
This never creates reviewer authority evidence, never edits the canonical
authority record, and never marks the vocabulary review bundle send-ready.
`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args],
    exit_code: result.status,
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function resolveEvidenceRoot(value) {
  const evidenceRoot = resolveProjectPath(value, "--evidence-root");
  const canonicalRoot = path.join(root, defaultEvidenceRootRelative);
  if (evidenceRoot !== canonicalRoot && !evidenceRoot.startsWith(`${canonicalRoot}${path.sep}`)) {
    throw new Error(`--evidence-root must be ${defaultEvidenceRootRelative} or a child path under it`);
  }
  return evidenceRoot;
}

function walkEvidenceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  let entries = [];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    const stats = safeLstat(fullPath);
    if (!stats) return [];
    if (stats.isDirectory() && !stats.isSymbolicLink()) return walkEvidenceFiles(fullPath);
    return [fullPath];
  }).sort((left, right) => projectRelative(left).localeCompare(projectRelative(right)));
}

function safeLstat(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function hashPinnedFileSummary(file) {
  try {
    return {
      path: projectRelative(file),
      sha256: sha256File(file),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function gitCheckIgnored(relativePath) {
  const result = spawnSync("git", ["check-ignore", "--quiet", "--", relativePath], {
    cwd: root,
    encoding: "utf8",
  });
  return result.status === 0;
}

function evidenceRootSummary(evidenceRoot, limit) {
  const exists = fs.existsSync(evidenceRoot);
  const files = walkEvidenceFiles(evidenceRoot);
  const fileStats = files
    .map((file) => ({ file, stats: safeLstat(file) }))
    .filter((record) => record.stats);
  const symlinks = fileStats.filter(({ stats }) => stats.isSymbolicLink()).map(({ file }) => file);
  const regularFiles = fileStats
    .filter(({ stats }) => stats.isFile() && !stats.isSymbolicLink());
  return {
    path: projectRelative(evidenceRoot),
    exists,
    git_ignored: gitCheckIgnored(projectRelative(evidenceRoot)),
    file_count: fileStats.length,
    regular_file_count: regularFiles.length,
    symlink_count: symlinks.length,
    total_bytes: regularFiles.reduce((total, { stats }) => total + stats.size, 0),
    first_files: regularFiles
      .slice(0, limit)
      .map(({ file }) => hashPinnedFileSummary(file))
      .filter(Boolean),
    first_symlinks: symlinks.slice(0, limit).map((file) => projectRelative(file)),
    note: "Files under this ignored root are not reviewer authority evidence until the canonical authority record hash-pins them.",
  };
}

function authorityReferenceSummary(reference) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) return null;
  return {
    summary_present: typeof reference.summary === "string" && reference.summary.trim().length > 0,
    file_count: Array.isArray(reference.files) ? reference.files.length : 0,
    files: Array.isArray(reference.files)
      ? reference.files.map((file) => ({
        path: file?.path ?? null,
        sha256: file?.sha256 ?? null,
        purpose: file?.purpose ?? null,
      }))
      : [],
  };
}

function runAuthorityRequestAudit() {
  const audit = run("node", ["scripts/audit_vocabulary_reviewer_authority_request.mjs"]);
  return {
    command: audit.command,
    ok: audit.ok,
    exit_code: audit.exit_code,
    summary: parseJson(audit.stdout),
    first_messages: [audit.stderr, audit.stdout].filter(Boolean).join("\n").split(/\n+/).slice(0, 8),
  };
}

function runDraftBundleAudit() {
  const audit = run("node", ["scripts/audit_vocabulary_review_bundle.mjs", "--allow-draft"]);
  return {
    command: audit.command,
    ok: audit.ok,
    exit_code: audit.exit_code,
    summary: parseJson(audit.stdout),
    first_messages: [audit.stderr, audit.stdout].filter(Boolean).join("\n").split(/\n+/).slice(0, 8),
  };
}

function nextCommand({ authorityRelativePath, canonical, authorityExists, valid, authorityRequestOk, draftBundleOk }) {
  if (!authorityRequestOk) {
    return "node scripts/prepare_vocabulary_reviewer_authority_request.mjs && node scripts/audit_vocabulary_reviewer_authority_request.mjs";
  }
  if (!authorityExists) {
    return "Use output/review-handoff/reviewer-authority-request/AUTHORITY_INTAKE.md and docs/review/vocabulary-reviewer-authority-intake.template.json to collect real reviewer/key evidence, then run node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help.";
  }
  if (!valid) {
    return `Fix ${authorityRelativePath} with real non-placeholder reviewer identity, Ed25519 public key, copied evidence files, and operator trust-attestation evidence; rerun this report before sending the review bundle.`;
  }
  if (!canonical) {
    return `The candidate authority validates; stage it canonically at ${projectRelative(defaultReviewerAuthorityPath)} before preparing the send-ready review bundle.`;
  }
  if (!draftBundleOk) {
    return "node scripts/prepare_vocabulary_review_bundle.mjs && node scripts/audit_vocabulary_review_bundle.mjs";
  }
  return "node scripts/prepare_vocabulary_review_bundle.mjs && node scripts/audit_vocabulary_review_bundle.mjs";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const authorityPath = resolveProjectPath(args.authority, "--authority");
  const authorityRelativePath = projectRelative(authorityPath);
  const canonical = authorityPath === defaultReviewerAuthorityPath;
  const authorityExists = fs.existsSync(authorityPath);
  const validation = validateVocabularyReviewerPreReviewAuthorityFile(authorityPath);
  const valid = validation.findings.length === 0;
  const authority = validation.authority;
  const evidenceRoot = resolveEvidenceRoot(args.evidence_root);
  const authorityRequestAudit = runAuthorityRequestAudit();
  const draftBundleAudit = runDraftBundleAudit();
  const status = valid && canonical ? "ready_for_review_bundle" : "blocked";

  console.log(JSON.stringify({
    schema_version: "asl-pilot-reviewer-authority-status/v1",
    status,
    checked_at: new Date().toISOString(),
    authority: {
      path: authorityRelativePath,
      canonical,
      exists: authorityExists,
      sha256: authorityExists ? sha256File(authorityPath) : null,
      valid_for_pre_review: valid,
      first_findings: validation.findings.slice(0, args.limit),
      reviewer: authority?.reviewer
        ? {
          name: authority.reviewer.name ?? null,
          role: authority.reviewer.role ?? null,
          qualification: authority.reviewer.qualification ?? null,
          is_project_operator: authority.reviewer.is_project_operator ?? null,
        }
        : null,
      trusted_key: authority?.trusted_key
        ? {
          algorithm: authority.trusted_key.algorithm ?? null,
          signer_key_fingerprint_sha256: authority.trusted_key.signer_key_fingerprint_sha256 ?? null,
        }
        : null,
      credential_evidence: authorityReferenceSummary(authority?.credential_evidence),
      key_binding_evidence: authorityReferenceSummary(authority?.key_binding_evidence),
      trusted_by_evidence: authorityReferenceSummary(authority?.trusted_by?.evidence),
    },
    evidence_root: evidenceRootSummary(evidenceRoot, args.limit),
    reviewer_authority_request_bundle: {
      path: defaultRequestBundleRelative,
      audit_ok: authorityRequestAudit.ok,
      manifest_status: authorityRequestAudit.summary?.manifest_status ?? null,
      first_messages: authorityRequestAudit.ok ? [] : authorityRequestAudit.first_messages,
    },
    vocabulary_review_bundle_draft_check: {
      audit_ok: draftBundleAudit.ok,
      manifest_status: draftBundleAudit.summary?.manifest_status ?? null,
      send_ready: draftBundleAudit.summary?.send_ready ?? null,
      allow_draft: draftBundleAudit.summary?.allow_draft ?? null,
      first_messages: draftBundleAudit.ok ? [] : draftBundleAudit.first_messages,
    },
    boundaries: {
      request_bundle_is_evidence: false,
      evidence_root_files_are_authority_without_hash_pinning: false,
      symlink_evidence_files_allowed: false,
      private_keys_allowed_in_repo: false,
    },
    next_command: nextCommand({
      authorityRelativePath,
      canonical,
      authorityExists,
      valid,
      authorityRequestOk: authorityRequestAudit.ok,
      draftBundleOk: draftBundleAudit.ok,
    }),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary reviewer authority status report failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
