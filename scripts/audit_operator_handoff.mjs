import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const handoffPath = path.join(root, "docs", "review", "operator-handoff.md");

const expectedArtifacts = [
  "docs/review/final-vocabulary-review.json",
  "docs/review/vocabulary-review-workbook.md",
  "data/dataset/collection-plan.json",
  "docs/validation/practice-progress-smoke.json",
  "docs/validation/practice-camera-behavior-smoke.json",
  "docs/validation/browser-onnx-wiring-smoke.json",
  "docs/validation/dataset-collection-runtime-smoke.json",
  "docs/validation/post-collection-evidence-status.json",
  "docs/privacy/final-privacy-smoke.json",
];

const requiredSnippets = [
  "Source-Curated Operator Handoff",
  "Vocabulary evidence status: `source_curated`",
  "External ASL review claimed: `false`",
  "Collection plan status: `source_curated`",
  "Collection session bundle: `capture_ready`",
  "Post-collection status: `blocked_missing_collection_store`",
  "ENABLE_DATASET_COLLECTION=true",
  "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true",
  "node scripts/promote_source_curated_vocabulary.mjs --write",
  "node scripts/audit_vocabulary_review.mjs",
  "node scripts/audit_hint_pedagogy_review.mjs",
  "node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json",
  "node scripts/prepare_collection_session_bundle.mjs",
  "node scripts/audit_collection_session_bundle.mjs --require-ready",
  "node scripts/export_clip_review_packet.mjs",
  "node scripts/export_challenge_review_packet.mjs",
  "node scripts/report_post_collection_evidence_status.mjs --write",
  "node scripts/audit_post_collection_evidence_status.mjs",
  "node scripts/process_collected_dataset_evidence.mjs",
  "node scripts/process_collected_dataset_evidence.mjs --apply",
  "node scripts/audit_final_rawframe_pipeline_preflight.mjs",
  "node scripts/audit_completion_readiness.mjs --read-only --summary-only",
  'status: "qa_completed"',
  'evidence_mode: "source_curated_operator_qa"',
  "external_review.claimed: false",
  "Optional stronger external review remains available",
  "not required for source-aligned completion",
  "Current blockers remain real-world evidence",
  "no pretrained models, pretrained checkpoints, landmarks, MediaPipe",
];

const forbiddenSnippets = [
  {
    snippet: "Next safe command: `Use output/review-handoff/reviewer-authority-request",
    reason: "Reviewer authority is no longer the next source-aligned blocker.",
  },
  {
    snippet: "Do not send `output/review-handoff/vocabulary-review-bundle/` until",
    reason: "Optional external review bundle delivery is not the source-aligned handoff gate.",
  },
  {
    snippet: "Final external attestations are required",
    reason: "Final external attestations are not required for source-aligned pilot completion.",
  },
  {
    snippet: "ASL/Deaf educator review",
    reason: "External ASL review must not be described as a required source-aligned completion step.",
  },
];

const requiredCommandFiles = [
  "scripts/promote_source_curated_vocabulary.mjs",
  "scripts/audit_vocabulary_review.mjs",
  "scripts/audit_hint_pedagogy_review.mjs",
  "scripts/plan_dataset_collection.mjs",
  "scripts/prepare_collection_session_bundle.mjs",
  "scripts/audit_collection_session_bundle.mjs",
  "scripts/export_clip_review_packet.mjs",
  "scripts/export_challenge_review_packet.mjs",
  "scripts/report_post_collection_evidence_status.mjs",
  "scripts/audit_post_collection_evidence_status.mjs",
  "scripts/process_collected_dataset_evidence.mjs",
  "scripts/audit_final_rawframe_pipeline_preflight.mjs",
  "scripts/audit_completion_readiness.mjs",
];

const findings = [];
const checks = [];

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function sha256(relativePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(projectPath(relativePath)))
    .digest("hex");
}

function pass(id, label, evidence) {
  checks.push({ id, label, status: "passed", evidence, blockers: [] });
}

function fail(id, label, blocker) {
  checks.push({ id, label, status: "failed", evidence: null, blockers: [blocker] });
  findings.push(`${id}: ${blocker}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    status: result.status,
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

function syntaxCheck(relativePath) {
  const check = run("node", ["--check", relativePath]);
  return {
    command: ["node", "--check", relativePath],
    status: check.ok ? "passed" : "failed",
    stderr: check.stderr,
    stdout: check.stdout,
  };
}

function artifactRows(handoff) {
  const rows = new Map();
  const rowPattern = /^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*`([a-f0-9]{64})`\s*\|/gm;
  for (const match of handoff.matchAll(rowPattern)) {
    rows.set(match[2], {
      label: match[1].trim(),
      hash: match[3],
    });
  }
  return rows;
}

if (!fs.existsSync(handoffPath)) {
  fail("handoff_exists", "Source-curated operator handoff document exists", "docs/review/operator-handoff.md is missing");
}

const handoff = fs.existsSync(handoffPath) ? fs.readFileSync(handoffPath, "utf8") : "";
if (handoff) {
  pass("handoff_exists", "Source-curated operator handoff document exists", "docs/review/operator-handoff.md");
}

const rows = artifactRows(handoff);
const artifactResults = [];
for (const artifactPath of expectedArtifacts) {
  const row = rows.get(artifactPath);
  if (!fs.existsSync(projectPath(artifactPath))) {
    artifactResults.push({ path: artifactPath, status: "missing_file" });
    continue;
  }
  if (!row) {
    artifactResults.push({ path: artifactPath, status: "missing_handoff_row" });
    continue;
  }
  const actualHash = sha256(artifactPath);
  artifactResults.push({
    path: artifactPath,
    status: actualHash === row.hash ? "passed" : "hash_mismatch",
    actual_hash: actualHash,
    handoff_hash: row.hash,
  });
}

const failedArtifacts = artifactResults.filter((item) => item.status !== "passed");
if (failedArtifacts.length === 0) {
  pass("handoff_artifact_hashes", "Handoff artifact hashes match current files", artifactResults);
} else {
  fail(
    "handoff_artifact_hashes",
    "Handoff artifact hashes match current files",
    JSON.stringify(failedArtifacts),
  );
}

const missingSnippets = requiredSnippets.filter((snippet) => !handoff.includes(snippet));
if (missingSnippets.length === 0) {
  pass("handoff_operator_steps", "Handoff keeps source-curated collection and completion steps explicit", requiredSnippets);
} else {
  fail(
    "handoff_operator_steps",
    "Handoff keeps source-curated collection and completion steps explicit",
    `Missing snippets: ${missingSnippets.join(", ")}`,
  );
}

const presentForbiddenSnippets = forbiddenSnippets.filter((item) => handoff.includes(item.snippet));
if (presentForbiddenSnippets.length === 0) {
  pass("handoff_no_required_external_review", "Handoff does not require optional external review artifacts", forbiddenSnippets);
} else {
  fail(
    "handoff_no_required_external_review",
    "Handoff does not require optional external review artifacts",
    presentForbiddenSnippets.map((item) => `${item.snippet}: ${item.reason}`).join("; "),
  );
}

const commandFileResults = requiredCommandFiles.map((relativePath) => {
  const exists = fs.existsSync(projectPath(relativePath));
  const syntax = exists ? syntaxCheck(relativePath) : null;
  return {
    path: relativePath,
    exists,
    syntax_status: syntax?.status ?? "missing",
    syntax_command: syntax?.command ?? null,
    syntax_stderr: syntax?.stderr || null,
    syntax_stdout: syntax?.stdout || null,
  };
});
const failedCommandFiles = commandFileResults.filter((item) => !item.exists || item.syntax_status === "failed");
if (failedCommandFiles.length === 0) {
  pass("handoff_command_files", "Handoff referenced command files exist and parse", commandFileResults);
} else {
  fail(
    "handoff_command_files",
    "Handoff referenced command files exist and parse",
    JSON.stringify(failedCommandFiles),
  );
}

const vocabularyAudit = run("node", ["scripts/audit_vocabulary_review.mjs"]);
const hintAudit = run("node", ["scripts/audit_hint_pedagogy_review.mjs"]);
const collectionBundleAudit = run("node", ["scripts/audit_collection_session_bundle.mjs", "--require-ready"]);
const postCollectionStatus = run("node", ["scripts/report_post_collection_evidence_status.mjs"]);

const postCollectionJson = postCollectionStatus.ok ? parseJson(postCollectionStatus.stdout) : null;
if (vocabularyAudit.ok && hintAudit.ok && collectionBundleAudit.ok && postCollectionStatus.ok && postCollectionJson) {
  pass("handoff_current_gate_status", "Current source-curated handoff gates match audit output", {
    vocabulary: ["node", "scripts/audit_vocabulary_review.mjs"],
    hints: ["node", "scripts/audit_hint_pedagogy_review.mjs"],
    collection_bundle: ["node", "scripts/audit_collection_session_bundle.mjs", "--require-ready"],
    post_collection_status: postCollectionJson.status,
  });
} else {
  fail(
    "handoff_current_gate_status",
    "Current source-curated handoff gates match audit output",
    [
      !vocabularyAudit.ok ? `Vocabulary audit failed:\n${vocabularyAudit.stderr || vocabularyAudit.stdout}` : null,
      !hintAudit.ok ? `Hint audit failed:\n${hintAudit.stderr || hintAudit.stdout}` : null,
      !collectionBundleAudit.ok ? `Collection bundle audit failed:\n${collectionBundleAudit.stderr || collectionBundleAudit.stdout}` : null,
      !postCollectionStatus.ok || !postCollectionJson
        ? `Post-collection status failed:\n${postCollectionStatus.stderr || postCollectionStatus.stdout}`
        : null,
    ].filter(Boolean).join("\n"),
  );
}

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Operator handoff audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
