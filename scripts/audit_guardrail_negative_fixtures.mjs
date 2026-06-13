import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalSignedConsentReceiptPayload,
} from "./signed_receipt_utils.mjs";
import {
  buildPostCollectionReviewReceipt,
  canonicalPostCollectionReviewReceiptPayload,
} from "./clip_review_utils.mjs";
import {
  canonicalVocabularyReviewerReceiptPayload,
  readJson,
  validateVocabularyReviewerAuthorityFile,
  validateVocabularyReviewerPreReviewAuthorityFile,
  vocabularyReviewGate,
} from "./vocabulary_review_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const fixtureRoot = path.join(root, "output", "guardrail-negative-fixtures");
const vocabularyReviewEvidenceFixtureRoot = path.join(
  root,
  "data",
  "vocabulary-review",
  "evidence",
  "guardrail-negative-fixtures",
);
const fixtureAslReviewerRole = "Certified ASL instructor for fixture adult education program";
const fixtureAslReviewerQualification = "Certified ASL instructor credential documented for fixture ASL pedagogy review";

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function fixtureProjectPath(relativePath) {
  return projectRelative(path.join(fixtureRoot, relativePath));
}

function writeJson(relativePath, data) {
  const file = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return projectRelative(file);
}

function writeText(relativePath, text) {
  const file = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  return projectRelative(file);
}

function writeProjectJson(relativePath, data) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return projectRelative(file);
}

function writeProjectBytes(relativePath, bytes) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  return projectRelative(file);
}

function writeSymlink(relativePath, targetRelativePath) {
  const file = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.symlinkSync(path.join(root, targetRelativePath), file);
  return projectRelative(file);
}

function writeSymlinkDirectory(relativePath, targetRelativePath) {
  const file = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.symlinkSync(path.join(root, targetRelativePath), file, "dir");
  return projectRelative(file);
}

function writeVocabularyReviewEvidenceText(relativePath, text) {
  const file = path.join(vocabularyReviewEvidenceFixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  return projectRelative(file);
}

function writeVocabularyReviewEvidenceBytes(relativePath, bytes) {
  const file = path.join(vocabularyReviewEvidenceFixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  return projectRelative(file);
}

function writeVocabularyReviewEvidenceSymlink(relativePath, targetRelativePath) {
  const file = path.join(vocabularyReviewEvidenceFixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.symlinkSync(path.join(root, targetRelativePath), file);
  return projectRelative(file);
}

function writeVocabularyReviewEvidenceSymlinkDirectory(relativePath, targetRelativePath) {
  const file = path.join(vocabularyReviewEvidenceFixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.symlinkSync(path.join(root, targetRelativePath), file, "dir");
  return projectRelative(file);
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function evidenceDigest(evidenceFiles) {
  const payload = evidenceFiles
    .map((item) => ({ path: item.path, sha256: item.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function snapshotProjectFiles(relativePaths) {
  return relativePaths.map((relativePath) => {
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) {
      return {
        path: file,
        existed: false,
        content: null,
        mode: null,
      };
    }
    const stats = fs.statSync(file);
    return {
      path: file,
      existed: true,
      content: fs.readFileSync(file),
      mode: stats.mode,
    };
  });
}

function restoreProjectFiles(snapshot) {
  for (const record of snapshot) {
    if (record.existed) {
      fs.mkdirSync(path.dirname(record.path), { recursive: true });
      fs.writeFileSync(record.path, record.content);
      if (record.mode !== null) fs.chmodSync(record.path, record.mode);
    } else if (fs.existsSync(record.path)) {
      fs.rmSync(record.path, { recursive: true, force: true });
    }
  }
}

function stableJson(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalSignedReceiptPayload(receipt) {
  const reviewedEvidenceFiles = Array.isArray(receipt.reviewed_evidence_files)
    ? receipt.reviewed_evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  return stableJson({
    schema_version: receipt.schema_version,
    status: receipt.status,
    attestation_id: receipt.attestation_id,
    attestation_snapshot: normalizedAttestationSnapshot(receipt.attestation_snapshot),
    evidence_digest: receipt.evidence_digest,
    signed_at: receipt.signed_at,
    signed_by: receipt.signed_by,
    reviewed_evidence_files: reviewedEvidenceFiles,
  });
}

function normalizedAttestationSnapshot(attestation) {
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) return null;
  const evidenceFiles = Array.isArray(attestation.evidence_files)
    ? attestation.evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
        purpose: item?.purpose,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  const attestedBy = attestation.attested_by && typeof attestation.attested_by === "object" && !Array.isArray(attestation.attested_by)
    ? {
        name: attestation.attested_by.name,
        role: attestation.attested_by.role,
        affiliation_or_context: attestation.attested_by.affiliation_or_context,
        credential_or_authority: attestation.attested_by.credential_or_authority,
        contact_or_signed_evidence: attestation.attested_by.contact_or_signed_evidence,
        is_project_operator: attestation.attested_by.is_project_operator,
      }
    : null;
  return {
    id: attestation.id,
    statement: attestation.statement,
    attested_at: attestation.attested_at,
    attested_by: attestedBy,
    evidence_digest: attestation.evidence_digest,
    evidence_files: evidenceFiles,
  };
}

function signReceipt(receipt) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const payload = canonicalSignedReceiptPayload(receipt);
  return {
    ...receipt,
    signature_evidence: {
      algorithm: "ed25519",
      public_key_pem: publicKeyPem,
      signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
      signed_payload_sha256: sha256Text(payload),
      signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
    },
  };
}

function signConsentReceipt(receipt) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const payload = canonicalSignedConsentReceiptPayload(receipt);
  return {
    ...receipt,
    signature_evidence: {
      algorithm: "ed25519",
      public_key_pem: publicKeyPem,
      signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
      signed_payload_sha256: sha256Text(payload),
      signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
    },
  };
}

function signVocabularyReviewerReceipt(receipt) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const signedReceipt = JSON.parse(JSON.stringify(receipt));
  const payload = canonicalVocabularyReviewerReceiptPayload(signedReceipt);
  return {
    ...signedReceipt,
    signature_evidence: {
      algorithm: "ed25519",
      public_key_pem: publicKeyPem,
      signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
      signed_payload_sha256: sha256Text(payload),
      signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
    },
  };
}

function signPostCollectionReviewReceipt(receipt, privateKey, publicKey) {
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const signedReceipt = JSON.parse(JSON.stringify(receipt));
  const payload = canonicalPostCollectionReviewReceiptPayload(signedReceipt);
  return {
    ...signedReceipt,
    signature_evidence: {
      algorithm: "ed25519",
      public_key_pem: publicKeyPem,
      signer_key_fingerprint_sha256: sha256Bytes(publicKey.export({ type: "spki", format: "der" })),
      signed_payload_sha256: sha256Text(payload),
      signature_base64: crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
    },
  };
}

function vocabularyIds() {
  return vocabularyItems().map((item) => item.id);
}

function vocabularyItems() {
  const source = fs.readFileSync(path.join(root, "web", "src", "lib", "vocabulary.ts"), "utf8");
  return [...source.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],/gm)]
    .map((match) => ({
      id: match[1],
      label: match[2],
      category: match[3],
      prompt: match[4],
      coachingHint: match[5],
      hintKind: match[6],
      reviewStatus: "reviewed",
      approved: true,
    }));
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status,
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function pythonCommand() {
  const venvPython = path.join(root, ".venv", "bin", "python");
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function runSignedConsentReceiptProbe(fixturePath) {
  const signerIdentityHash = "a".repeat(64);
  const snippet = `
import sys
sys.path.insert(0, "scripts")
from train_rawframe_model import ManifestError, validate_signed_consent_evidence
clip = {
    "signer_id": "signer-001",
    "signed_consent_evidence": {
        "path": ${JSON.stringify(fixturePath)},
        "sha256": ${JSON.stringify(sha256File(fixturePath))},
        "purpose": "Fixture signed consent receipt"
    },
}
try:
    validate_signed_consent_evidence(clip, "fixture clip", ${JSON.stringify(signerIdentityHash)}, "consent-001")
except ManifestError as error:
    print(str(error))
    sys.exit(1)
sys.exit(0)
`;
  const result = run(pythonCommand(), ["-c", snippet]);
  return {
    ...result,
    command: `${pythonCommand()} -c <signed-consent-receipt-probe>`,
  };
}

function runDatasetCollectionReadinessProbe(storePath) {
  return run("node", [
    "scripts/audit_dataset_collection_readiness.mjs",
    "--store",
    storePath,
  ]);
}

function runLocalMlEnvironmentReceiptAudit(fixturePath) {
  return run(pythonCommand(), [
    "scripts/audit_local_ml_environment.py",
    "--report",
    fixturePath,
  ]);
}

function runNvidiaAccessReceiptTemplateProbe() {
  return run("node", [
    "scripts/audit_nvidia_asl_access_metadata.mjs",
    "--access-receipt",
    "docs/research/nvidia-asl-access-receipt.template.json",
  ]);
}

function runVocabularyReviewerAuthorityProbe(packetPath, receiptPath, authorityPath) {
  const packet = readJson(path.join(root, packetPath));
  const receipt = readJson(path.join(root, receiptPath));
  const result = validateVocabularyReviewerAuthorityFile(path.join(root, authorityPath), packet, receipt);
  const ok = result.findings.length === 0;
  return {
    command: `validateVocabularyReviewerAuthorityFile(${authorityPath})`,
    status: ok ? 0 : 1,
    ok,
    stdout: JSON.stringify({
      status: ok ? "passed" : "failed",
      authority: authorityPath,
      findings: result.findings,
    }, null, 2),
    stderr: "",
  };
}

function runPreReviewVocabularyReviewerAuthorityProbe(authorityPath) {
  const result = validateVocabularyReviewerPreReviewAuthorityFile(path.join(root, authorityPath));
  const ok = result.findings.length === 0;
  return {
    command: `validateVocabularyReviewerPreReviewAuthorityFile(${authorityPath})`,
    status: ok ? 0 : 1,
    ok,
    stdout: JSON.stringify({
      status: ok ? "passed" : "failed",
      authority: authorityPath,
      findings: result.findings,
    }, null, 2),
    stderr: "",
  };
}

function runMissingPreReviewVocabularyReviewerAuthorityProbe() {
  const target = path.join(
    root,
    "output",
    "review-handoff",
    "vocabulary-review-bundle",
    "guardrail-missing-pre-review-authority",
  );
  fs.rmSync(target, { recursive: true, force: true });
  try {
    const prepare = run("node", [
      "scripts/prepare_vocabulary_review_bundle.mjs",
      "--output",
      projectRelative(target),
    ]);
    const manifestPath = path.join(target, "MANIFEST.json");
    const requestPath = path.join(target, "REVIEW_REQUEST.md");
    const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
    const request = fs.existsSync(requestPath) ? fs.readFileSync(requestPath, "utf8") : "";
    const requestWarned = (
      request.includes("DRAFT ONLY: DO NOT SEND") &&
      request.includes("send_ready: false") &&
      (
        request.includes("do_not_send_reason: Missing valid pre-review trusted reviewer authority record") ||
        request.includes("do_not_send_reason: Final vocabulary review evidence already exists")
      ) &&
      request.includes("without `--allow-draft` before sending")
    );
    const audit = run("node", [
      "scripts/audit_vocabulary_review_bundle.mjs",
      "--bundle",
      projectRelative(target),
    ]);
    const draftClosed = (
      prepare.ok &&
      (
        manifest?.status === "draft_missing_reviewer_authority" ||
        manifest?.status === "already_reviewed"
      ) &&
      manifest?.send_ready === false &&
      typeof manifest?.do_not_send_reason === "string" &&
      (
        manifest.do_not_send_reason.includes("Missing valid pre-review trusted reviewer authority record") ||
        manifest.do_not_send_reason.includes("Final vocabulary review evidence already exists")
      ) &&
      requestWarned &&
      (
        (
          manifest?.reviewer_authority?.valid_for_pre_review === false &&
          manifest?.reviewer_authority?.exists === false &&
          !audit.ok &&
          `${audit.stdout}\n${audit.stderr}`.includes("draft_missing_reviewer_authority")
        ) ||
        (
          manifest?.status === "already_reviewed" &&
          audit.ok &&
          `${audit.stdout}\n${audit.stderr}`.includes("already_reviewed")
        )
      )
    );
    return {
      command: "prepare_vocabulary_review_bundle + audit_vocabulary_review_bundle <missing-pre-review-authority-probe>",
      status: draftClosed ? 0 : 1,
      ok: draftClosed,
      stdout: [
        prepare.stdout,
        JSON.stringify({
          manifest_status: manifest?.status ?? null,
          manifest_send_ready: manifest?.send_ready ?? null,
          do_not_send_reason: manifest?.do_not_send_reason ?? null,
          valid_for_pre_review: manifest?.reviewer_authority?.valid_for_pre_review ?? null,
          reviewer_authority_exists: manifest?.reviewer_authority?.exists ?? null,
          request_warned: requestWarned,
          default_audit_failed: !audit.ok,
        }),
        audit.stdout,
      ].filter(Boolean).join("\n"),
      stderr: [prepare.stderr, audit.stderr].filter(Boolean).join("\n"),
    };
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function parseJsonResult(result) {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function fixtureCollectionPlan(options = {}) {
  const label = vocabularyItems()[0];
  const currentGate = vocabularyReviewGate();
  const reviewGate = options.draft
    ? {
        ...currentGate,
        status: "draft_pre_review",
        blockers: ["guardrail fixture draft collection plan"],
      }
    : currentGate;
  return {
    schema_version: "asl-pilot-dataset-collection-plan/v1",
    generated_at: "2026-05-20T00:00:00.000Z",
    review_gate: reviewGate,
    targets: {
      vocabulary_labels: vocabularyIds().length,
      clips_per_label_per_split: 5,
      signers: 20,
      negative_challenge_clips_per_type: 5,
    },
    planned_signers: {
      train: ["signer-001"],
      validation: [],
      test: [],
    },
    planned_negative_challenge_signers: ["signer-002"],
    planned_signer_counts: {
      train: 1,
      validation: 0,
      test: 0,
      negative_challenge: 1,
    },
    assignment_count: 1,
    negative_challenge_assignment_count: 1,
    warnings: [],
    assignments: [
      {
        split: "train",
        signer_alias: "signer-001",
        label_id: label.id,
        display_text: label.label,
        capture_count_for_label_split: 1,
      },
    ],
    negative_challenge_assignments: [
      {
        split: "negative_challenge",
        signer_alias: "signer-002",
        challenge_type: "empty_camera",
        expected_outcome: "reject",
        capture_count_for_type: 1,
      },
    ],
  };
}

function withFixtureCollectionPlan(callback, options = {}) {
  const snapshot = snapshotProjectFiles([
    "data/dataset/collection-plan.json",
    "data/dataset/rawframe-remediation-collection-queue.json",
  ]);
  writeProjectJson("data/dataset/collection-plan.json", fixtureCollectionPlan(options));
  fs.rmSync(path.join(root, "data", "dataset", "rawframe-remediation-collection-queue.json"), {
    force: true,
  });
  try {
    return callback();
  } finally {
    restoreProjectFiles(snapshot);
  }
}

function runReturnedReviewWrapperArgvProbe() {
  const result = run("node", [
    "scripts/process_returned_vocabulary_review.mjs",
    "--input",
    "data/vocabulary-review/asl-pilot-vocabulary-review.json",
  ]);
  const parsed = parseJsonResult(result);
  const stepArgv = parsed?.steps?.[0]?.command_argv;
  const ok = (
    result.ok === false &&
    Array.isArray(stepArgv) &&
    stepArgv[0] === "node" &&
    stepArgv[1] === "scripts/import_vocabulary_review.mjs" &&
    stepArgv.includes("--dry-run")
  );
  return {
    command: `${result.command} <command-argv-probe>`,
    status: ok ? 0 : 1,
    ok,
    stdout: JSON.stringify({
      wrapper_status: parsed?.status ?? null,
      step_id: parsed?.steps?.[0]?.id ?? null,
      command_argv: stepArgv ?? null,
    }),
    stderr: result.stderr,
  };
}

function runCollectedEvidenceWrapperArgvProbe() {
  const result = run("node", ["scripts/process_collected_dataset_evidence.mjs"]);
  const parsed = parseJsonResult(result);
  const nextArgv = parsed?.next_command_argv;
  const ok = (
    result.ok === false &&
    parsed?.status === "blocked" &&
    Array.isArray(nextArgv) &&
    nextArgv[0] === "node" &&
    nextArgv[1] === "scripts/process_collected_dataset_evidence.mjs" &&
    nextArgv.includes("--clip-review") &&
    nextArgv.includes("--challenge-review") &&
    nextArgv.includes("--signer-identity")
  );
  return {
    command: `${result.command} <next-command-argv-probe>`,
    status: ok ? 0 : 1,
    ok,
    stdout: JSON.stringify({
      wrapper_status: parsed?.status ?? null,
      next_command_argv: nextArgv ?? null,
    }),
    stderr: result.stderr,
  };
}

function runFinalTrainingCanonicalPathProbe(extraArgs = []) {
  return run(pythonCommand(), [
    "scripts/train_rawframe_model.py",
    "--train-manifest",
    "data/manifests/train.json",
    "--validation-manifest",
    "data/manifests/validation.json",
    "--test-manifest",
    "data/manifests/test.json",
    "--output-dir",
    "artifacts/rawframe-model",
    "--check-files",
    "--dry-run",
    ...extraArgs,
  ]);
}

function runDraftCollectionSessionBundleProbe() {
  const target = path.join(
    root,
    "output",
    "collection-handoff",
    "collection-session-bundle",
    "guardrail-draft-not-for-capture",
  );
  fs.rmSync(target, { recursive: true, force: true });
  try {
    const prepare = withFixtureCollectionPlan(() => run("node", [
      "scripts/prepare_collection_session_bundle.mjs",
      "--allow-draft",
      "--output",
      projectRelative(target),
    ]), { draft: true });
    const manifestPath = path.join(target, "MANIFEST.json");
    const readmePath = path.join(target, "OPERATOR_README.md");
    const signerSheetPath = path.join(target, "signer-sheets", "signer-001.md");
    const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
    const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
    const signerSheet = fs.existsSync(signerSheetPath) ? fs.readFileSync(signerSheetPath, "utf8") : "";
    const draftWarning = (
      readme.includes("DRAFT ONLY: DO NOT CAPTURE") &&
      readme.includes("capture_ready: false") &&
      readme.includes("do_not_capture_reason: Collection plan review_gate.status is draft_pre_review") &&
      signerSheet.includes("DRAFT ONLY: DO NOT CAPTURE") &&
      signerSheet.includes("capture_ready: false")
    );
    const vocabularyAssignments = fs.existsSync(path.join(target, "vocabulary-assignments.csv"))
      ? fs.readFileSync(path.join(target, "vocabulary-assignments.csv"), "utf8")
      : "";
    const csvWarned = (
      vocabularyAssignments.startsWith("bundle_status,capture_ready,do_not_capture_reason,") &&
      vocabularyAssignments.includes("draft_not_for_capture,false,") &&
      vocabularyAssignments.includes("review_gate.status is draft_pre_review")
    );
    const freshnessAudit = withFixtureCollectionPlan(() => run("node", [
      "scripts/audit_collection_session_bundle.mjs",
      "--bundle",
      projectRelative(target),
    ]), { draft: true });
    const readyAudit = withFixtureCollectionPlan(() => run("node", [
      "scripts/audit_collection_session_bundle.mjs",
      "--bundle",
      projectRelative(target),
      "--require-ready",
    ]), { draft: true });
    const ok = (
      prepare.ok &&
      manifest?.status === "draft_not_for_capture" &&
      manifest?.capture_ready === false &&
      typeof manifest?.do_not_capture_reason === "string" &&
      manifest.do_not_capture_reason.includes("review_gate.status is draft_pre_review") &&
      manifest?.generated_by?.script?.path === "scripts/prepare_collection_session_bundle.mjs" &&
      draftWarning &&
      csvWarned &&
      freshnessAudit.ok &&
      !readyAudit.ok &&
      `${readyAudit.stdout}\n${readyAudit.stderr}`.includes("capture_ready must be true")
    );
    return {
      command: "prepare_collection_session_bundle --allow-draft + audit_collection_session_bundle <draft-not-for-capture-probe>",
      status: ok ? 0 : 1,
      ok,
      stdout: [
        prepare.stdout,
        JSON.stringify({
          manifest_status: manifest?.status ?? null,
          capture_ready: manifest?.capture_ready ?? null,
          do_not_capture_reason: manifest?.do_not_capture_reason ?? null,
          draft_warning: draftWarning,
          csv_warned: csvWarned,
          freshness_audit_passed: freshnessAudit.ok,
          require_ready_failed: !readyAudit.ok,
        }),
        freshnessAudit.stdout,
        readyAudit.stdout,
      ].filter(Boolean).join("\n"),
      stderr: [prepare.stderr, freshnessAudit.stderr, readyAudit.stderr].filter(Boolean).join("\n"),
    };
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function runStaleCollectionSessionBundleGeneratorProbe() {
  const target = path.join(
    root,
    "output",
    "collection-handoff",
    "collection-session-bundle",
    "guardrail-stale-generator",
  );
  fs.rmSync(target, { recursive: true, force: true });
  try {
    const prepare = withFixtureCollectionPlan(() => run("node", [
      "scripts/prepare_collection_session_bundle.mjs",
      "--allow-draft",
      "--output",
      projectRelative(target),
    ]));
    const manifestPath = path.join(target, "MANIFEST.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = readJson(manifestPath);
      manifest.generated_by = {
        ...(manifest.generated_by ?? {}),
        script: {
          path: "scripts/prepare_collection_session_bundle.mjs",
          sha256: "0".repeat(64),
        },
      };
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    }
    const audit = withFixtureCollectionPlan(() => run("node", [
      "scripts/audit_collection_session_bundle.mjs",
      "--bundle",
      projectRelative(target),
    ]));
    const ok = prepare.ok && !audit.ok && `${audit.stdout}\n${audit.stderr}`.includes("generated_by.script.sha256");
    return {
      command: "prepare_collection_session_bundle + stale generated_by mutation + audit_collection_session_bundle <stale-generator-probe>",
      status: ok ? 0 : 1,
      ok,
      stdout: [prepare.stdout, audit.stdout].filter(Boolean).join("\n"),
      stderr: [prepare.stderr, audit.stderr].filter(Boolean).join("\n"),
    };
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function fixtureSplitForSigner(signerAlias) {
  const digest = crypto.createHash("sha256").update(String(signerAlias)).digest();
  const bucket = digest[0] % 5;
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function runCollectedEvidenceApplyRollbackProbe() {
  const canonicalPaths = [
    "data/asl-pilot-store.json",
    "data/dataset/collection-plan.json",
    "data/clip-review/asl-pilot-clip-review.json",
    "data/clip-review/asl-pilot-clip-reviewer-receipt.json",
    "data/clip-review/asl-pilot-clip-reviewer-authority.json",
    "data/clip-review/asl-pilot-negative-challenge-review.json",
    "data/clip-review/asl-pilot-negative-challenge-reviewer-receipt.json",
    "data/clip-review/asl-pilot-negative-challenge-reviewer-authority.json",
    "data/signer-identity/signer-identity-evidence.json",
    "data/signer-identity/signer-001-signed-consent.json",
    "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-credential.txt",
    "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-key-binding.txt",
    "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-trusted-by.txt",
    "docs/review/final-clip-review.json",
    "docs/review/final-negative-challenge-review.json",
    "data/manifests/train.json",
    "data/manifests/validation.json",
    "data/manifests/test.json",
    "data/manifests/negative-challenge.json",
    "docs/validation/final-manifest-audit.json",
    "data/guardrail-negative-fixtures/transaction-rollback-vocab.webm",
    "data/guardrail-negative-fixtures/transaction-rollback-challenge.webm",
  ];
  const snapshot = snapshotProjectFiles(canonicalPaths);
  try {
    const checkedAt = "2026-05-20T00:00:00.000Z";
    const signerAlias = "signer-001";
    const signerIdentityHash = "a".repeat(64);
    const label = vocabularyItems()[0];
    const signerSplit = fixtureSplitForSigner(signerAlias);
    const collectionPlan = {
      schema_version: "asl-pilot-dataset-collection-plan/v1",
      status: "ready_for_collection",
      review_gate: {
        status: "reviewed",
        reviewed_at: checkedAt,
      },
      assignments: [
        {
          split: signerSplit,
          signer_alias: signerAlias,
          label_id: label.id,
          display_text: label.label,
          capture_count_for_label_split: 1,
        },
      ],
      negative_challenge_assignments: [
        {
          signer_alias: signerAlias,
          challenge_type: "empty_camera",
          capture_count_for_type: 1,
        },
      ],
    };
    writeProjectJson("data/dataset/collection-plan.json", collectionPlan);
    const collectionPlanSha256 = sha256File("data/dataset/collection-plan.json");
    const vocabVideoPath = writeProjectBytes(
      "data/guardrail-negative-fixtures/transaction-rollback-vocab.webm",
      Buffer.alloc(2048, 7),
    );
    const challengeVideoPath = writeProjectBytes(
      "data/guardrail-negative-fixtures/transaction-rollback-challenge.webm",
      Buffer.alloc(2048, 8),
    );
    const vocabCaptureCondition = {
      schemaVersion: "asl-pilot-capture-conditions/v1",
      captureEnvironment: "controlled_vocabulary",
      operatorAttestation: true,
      operatorAttestedAt: checkedAt,
      frontLightingConfirmed: true,
      upperTorsoAndHandsVisibleConfirmed: true,
      cameraDistanceWithinPilotRangeConfirmed: true,
      isolatedPromptSignConfirmed: true,
      emptyCameraConfirmed: false,
      noHandsVisibleConfirmed: false,
      lowLightConfirmed: false,
      offCenterConfirmed: false,
      expectedRejectOutcomeConfirmed: false,
      challengeType: null,
    };
    const challengeCaptureCondition = {
      schemaVersion: "asl-pilot-capture-conditions/v1",
      captureEnvironment: "negative_challenge",
      operatorAttestation: true,
      operatorAttestedAt: checkedAt,
      frontLightingConfirmed: false,
      upperTorsoAndHandsVisibleConfirmed: false,
      cameraDistanceWithinPilotRangeConfirmed: false,
      isolatedPromptSignConfirmed: false,
      emptyCameraConfirmed: true,
      noHandsVisibleConfirmed: false,
      lowLightConfirmed: false,
      offCenterConfirmed: false,
      expectedRejectOutcomeConfirmed: true,
      challengeType: "empty_camera",
    };
    const vocabAssignmentSnapshot = {
      assignment_key: "vocabulary:0",
      split: signerSplit,
      signer_alias: signerAlias,
      label_id: label.id,
      display_text: label.label,
      capture_count_for_label_split: 1,
    };
    const challengeAssignmentSnapshot = {
      assignment_key: "negative_challenge:0",
      split: "negative_challenge",
      signer_alias: signerAlias,
      challenge_type: "empty_camera",
      expected_outcome: "reject",
      capture_count_for_type: 1,
    };
    const signedConsentReceipt = writeProjectJson("data/signer-identity/signer-001-signed-consent.json", signConsentReceipt({
      schema_version: "asl-pilot-signed-consent-identity-receipt/v1",
      status: "signed",
      signer_alias: signerAlias,
      signer_identity_hash: signerIdentityHash,
      consent_record_ids: ["consent-001"],
      consent_form: {
        path: "docs/privacy/dataset-consent-form.md",
        sha256: sha256File("docs/privacy/dataset-consent-form.md"),
        consent_version: "asl-pilot-dataset-consent-v1",
      },
      confirmed_consent_flags: {
        age_eligible: true,
        allow_model_training: true,
        allow_validation: true,
        allow_pilot_use: true,
        allow_derived_artifact_retention: true,
        allow_deidentified_metadata_retention: true,
        retention_acknowledged: true,
        withdrawal_acknowledged: true,
        raw_clip_redistribution_without_separate_permission: false,
      },
      signed_at: checkedAt,
      signed_by: {
        name: "Signer One",
        role: "Signer",
        affiliation_or_context: "Fixture signer",
        contact_or_signature_reference: "fixture-signer-signature",
        is_project_operator: false,
      },
    }));
    const signedConsentEvidence = {
      path: signedConsentReceipt,
      sha256: sha256File(signedConsentReceipt),
      purpose: "Signed consent and identity verification receipt for signer-001",
    };
    const store = {
      users: [],
      sessions: [],
      attempts: [],
      datasetSigners: [
        {
          signerAlias,
          split: signerSplit,
          identityAttestation: "pending_identity_verification",
          consentVersion: "asl-pilot-dataset-consent-v1",
          consentFormSha256: sha256File("docs/privacy/dataset-consent-form.md"),
        },
      ],
      consentRecords: [
        {
          id: "consent-001",
          userId: "user-001",
          signerAlias,
          consentVersion: "asl-pilot-dataset-consent-v1",
          consentFormSha256: sha256File("docs/privacy/dataset-consent-form.md"),
          ageEligible: true,
          allowModelTraining: true,
          allowValidation: true,
          allowPilotUse: true,
          allowDerivedArtifactRetention: true,
          allowDeidentifiedMetadataRetention: true,
          retentionAcknowledged: true,
          withdrawalAcknowledged: true,
          allowRawClipRedistribution: false,
          signedAt: checkedAt,
          operatorUserId: "operator-001",
          rawClipStorageLocation: "fixture local store",
          rawClipAccess: "fixture operator only",
          retentionPeriod: "pilot fixture retention",
        },
      ],
      datasetClips: [
        {
          id: "clip-001",
          userId: "user-001",
          signerAlias,
          consentRecordId: "consent-001",
          vocabularyId: label.id,
          labelReviewStatus: "needs_deaf_educator_review",
          mimeType: "video/webm",
          durationMs: 1000,
          sizeBytes: 2048,
          sha256: sha256File(vocabVideoPath),
          mediaStreamTrackSettings: { width: 640, height: 480, frameRate: 30 },
          relativeVideoPath: "guardrail-negative-fixtures/transaction-rollback-vocab.webm",
          planAssignmentKey: "vocabulary:0",
          collectionPlanPath: "data/dataset/collection-plan.json",
          collectionPlanSha256,
          planAssignmentSnapshot: vocabAssignmentSnapshot,
          captureConditionEvidence: vocabCaptureCondition,
        },
      ],
      datasetChallengeClips: [
        {
          id: "challenge-001",
          userId: "user-001",
          signerAlias,
          consentRecordId: "consent-001",
          challengeType: "empty_camera",
          challengeReviewStatus: "needs_review",
          mimeType: "video/webm",
          durationMs: 1000,
          sizeBytes: 2048,
          sha256: sha256File(challengeVideoPath),
          mediaStreamTrackSettings: { width: 640, height: 480, frameRate: 30 },
          relativeVideoPath: "guardrail-negative-fixtures/transaction-rollback-challenge.webm",
          planAssignmentKey: "negative_challenge:0",
          collectionPlanPath: "data/dataset/collection-plan.json",
          collectionPlanSha256,
          planAssignmentSnapshot: challengeAssignmentSnapshot,
          captureConditionEvidence: challengeCaptureCondition,
        },
      ],
    };
    writeProjectJson("data/asl-pilot-store.json", store);
    const storeSha256BeforeApply = sha256File("data/asl-pilot-store.json");
    const reviewer = {
      name: "Fixture Reviewer",
      role: fixtureAslReviewerRole,
      qualification: fixtureAslReviewerQualification,
      affiliation_or_context: "Fixture independent review",
      contact_or_signed_evidence: "fixture-reviewer-signature",
      is_project_operator: false,
      reviewed_at: checkedAt,
    };
    writeProjectJson("data/clip-review/asl-pilot-clip-review.json", {
      schema_version: "asl-pilot-clip-review/v1",
      status: "reviewed",
      store: {
        path: "data/asl-pilot-store.json",
        sha256: storeSha256BeforeApply,
      },
      reviewer,
      clip_count: 1,
      clips: [
        {
          clip_id: "clip-001",
          signer_alias: signerAlias,
          vocabulary_id: label.id,
          current_review_status: "needs_deaf_educator_review",
          corrected_vocabulary_id: label.id,
          approved: true,
          rejection_reason: "",
          notes: "Fixture approved.",
          collection_plan: {
            path: "data/dataset/collection-plan.json",
            sha256: collectionPlanSha256,
            assignment_key: "vocabulary:0",
            assignment: vocabAssignmentSnapshot,
          },
          capture_condition: vocabCaptureCondition,
          relative_video_path: "guardrail-negative-fixtures/transaction-rollback-vocab.webm",
          video: {
            path: vocabVideoPath,
            exists: true,
            sha256: sha256File(vocabVideoPath),
          },
        },
      ],
    });
    writeProjectJson("data/clip-review/asl-pilot-negative-challenge-review.json", {
      schema_version: "asl-pilot-negative-challenge-review/v1",
      status: "reviewed",
      store: {
        path: "data/asl-pilot-store.json",
        sha256: storeSha256BeforeApply,
      },
      reviewer,
      clip_count: 1,
      clips: [
        {
          clip_id: "challenge-001",
          signer_alias: signerAlias,
          challenge_type: "empty_camera",
          expected_outcome: "reject",
          current_review_status: "needs_review",
          approved: true,
          rejection_reason: "",
          notes: "Fixture approved.",
          collection_plan: {
            path: "data/dataset/collection-plan.json",
            sha256: collectionPlanSha256,
            assignment_key: "negative_challenge:0",
            assignment: challengeAssignmentSnapshot,
          },
          capture_condition: challengeCaptureCondition,
          relative_video_path: "guardrail-negative-fixtures/transaction-rollback-challenge.webm",
          video: {
            path: challengeVideoPath,
            exists: true,
            sha256: sha256File(challengeVideoPath),
          },
        },
      ],
    });
    const {
      privateKey: postCollectionReviewerPrivateKey,
      publicKey: postCollectionReviewerPublicKey,
    } = crypto.generateKeyPairSync("ed25519");
    const reviewerPublicKeyPem = postCollectionReviewerPublicKey.export({ type: "spki", format: "pem" });
    const reviewerKeyFingerprint = sha256Bytes(postCollectionReviewerPublicKey.export({ type: "spki", format: "der" }));
    const authorityReviewer = {
      name: reviewer.name,
      role: reviewer.role,
      qualification: reviewer.qualification,
      affiliation_or_context: reviewer.affiliation_or_context,
      contact_or_signed_evidence: reviewer.contact_or_signed_evidence,
      is_project_operator: reviewer.is_project_operator,
    };
    const credentialEvidencePath = writeProjectJson(
      "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-credential.txt",
      { fixture: "post-collection reviewer credential evidence" },
    );
    const keyBindingEvidencePath = writeProjectJson(
      "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-key-binding.txt",
      { fixture: "post-collection reviewer key binding evidence" },
    );
    const trustedByEvidencePath = writeProjectJson(
      "data/vocabulary-review/evidence/guardrail-negative-fixtures/post-collection-reviewer-trusted-by.txt",
      { fixture: "post-collection trusted-by evidence" },
    );
    const reviewerAuthority = {
      schema_version: "asl-pilot-reviewer-authority/v1",
      status: "trusted_reviewer_key",
      trusted_at: "2025-12-31T00:00:00.000Z",
      pre_review_key_binding_confirmed: true,
      reviewer: authorityReviewer,
      trusted_key: {
        algorithm: "ed25519",
        public_key_pem: reviewerPublicKeyPem,
        signer_key_fingerprint_sha256: reviewerKeyFingerprint,
      },
      credential_evidence: {
        summary: "Fixture ASL instructor credential evidence for post-collection review",
        files: [
          {
            path: credentialEvidencePath,
            sha256: sha256File(credentialEvidencePath),
            purpose: "Reviewer ASL qualification evidence",
          },
        ],
      },
      key_binding_evidence: {
        summary: "Fixture reviewer key binding evidence for post-collection review",
        files: [
          {
            path: keyBindingEvidencePath,
            sha256: sha256File(keyBindingEvidencePath),
            purpose: "Evidence that the Ed25519 public key belongs to the reviewer",
          },
        ],
      },
      trusted_by: {
        name: "Fixture Trust Operator",
        role: "Fixture operator verifier",
        contact_or_signed_evidence: "fixture-trust-operator-signature",
        evidence: {
          summary: "Fixture operator attestation that reviewer identity and key binding were checked before review",
          files: [
            {
              path: trustedByEvidencePath,
              sha256: sha256File(trustedByEvidencePath),
              purpose: "Operator trust attestation evidence",
            },
          ],
        },
      },
    };
    writeProjectJson("data/clip-review/asl-pilot-clip-reviewer-authority.json", reviewerAuthority);
    writeProjectJson("data/clip-review/asl-pilot-negative-challenge-reviewer-authority.json", reviewerAuthority);
    const clipPacketPath = path.join(root, "data/clip-review/asl-pilot-clip-review.json");
    const challengePacketPath = path.join(root, "data/clip-review/asl-pilot-negative-challenge-review.json");
    writeProjectJson(
      "data/clip-review/asl-pilot-clip-reviewer-receipt.json",
      signPostCollectionReviewReceipt(
        buildPostCollectionReviewReceipt(readJson(clipPacketPath), clipPacketPath, "clip"),
        postCollectionReviewerPrivateKey,
        postCollectionReviewerPublicKey,
      ),
    );
    writeProjectJson(
      "data/clip-review/asl-pilot-negative-challenge-reviewer-receipt.json",
      signPostCollectionReviewReceipt(
        buildPostCollectionReviewReceipt(readJson(challengePacketPath), challengePacketPath, "challenge"),
        postCollectionReviewerPrivateKey,
        postCollectionReviewerPublicKey,
      ),
    );
    writeProjectJson("data/signer-identity/signer-identity-evidence.json", {
      schema_version: "asl-pilot-signer-identity-evidence/v1",
      status: "verified",
      verified_at: checkedAt,
      verified_by: {
        name: "Fixture Verifier",
        role: "Identity verifier",
        affiliation_or_context: "Fixture verification",
        contact_or_signed_evidence: "fixture-verifier-signature",
        is_project_operator: false,
      },
      signers: [
        {
          signer_alias: signerAlias,
          signer_identity_hash: signerIdentityHash,
          consent_record_ids: ["consent-001"],
          signed_consent_evidence: signedConsentEvidence,
          verified_at: checkedAt,
        },
      ],
    });
    writeProjectJson("docs/review/final-clip-review.json", {
      schema_version: "guardrail-sentinel/v1",
      restored: true,
      marker: "clip-review-before-wrapper-apply",
    });
    writeProjectJson("docs/review/final-negative-challenge-review.json", {
      schema_version: "guardrail-sentinel/v1",
      restored: true,
      marker: "challenge-review-before-wrapper-apply",
    });

    const result = run("node", ["scripts/process_collected_dataset_evidence.mjs", "--apply"]);
    const parsed = parseJsonResult(result);
    const stepIds = Array.isArray(parsed?.steps) ? parsed.steps.map((step) => step.id) : [];
    const rollbackStep = Array.isArray(parsed?.steps)
      ? parsed.steps.find((step) => step.id === "post_collection_apply_transaction_rollback")
      : null;
    const failedAfterMutation = (
      stepIds.includes("review_packets_transaction_apply") &&
      stepIds.includes("signer_identity_apply") &&
      stepIds.includes("dataset_collection_readiness")
    );
    const storeRolledBack = sha256File("data/asl-pilot-store.json") === storeSha256BeforeApply;
    const clipEvidenceRolledBack = readJson(path.join(root, "docs/review/final-clip-review.json"))?.marker === "clip-review-before-wrapper-apply";
    const challengeEvidenceRolledBack = readJson(path.join(root, "docs/review/final-negative-challenge-review.json"))?.marker === "challenge-review-before-wrapper-apply";
    const ok = (
      !result.ok &&
      parsed?.status === "blocked" &&
      rollbackStep?.parsed_status === "restored" &&
      failedAfterMutation &&
      storeRolledBack &&
      clipEvidenceRolledBack &&
      challengeEvidenceRolledBack
    );
    return {
      command: `${result.command} <transaction-rollback-probe>`,
      status: ok ? 0 : 1,
      ok,
      stdout: JSON.stringify({
        wrapper_status: parsed?.status ?? null,
        blocker: parsed?.blocker ?? null,
        rollback_status: rollbackStep?.parsed_status ?? null,
        failed_after_mutation: failedAfterMutation,
        store_rolled_back: storeRolledBack,
        clip_evidence_rolled_back: clipEvidenceRolledBack,
        challenge_evidence_rolled_back: challengeEvidenceRolledBack,
      }),
      stderr: result.stderr,
    };
  } finally {
    restoreProjectFiles(snapshot);
  }
}

function runReviewerAuthorityRequestOutputRefusalProbe() {
  return run("node", [
    "scripts/prepare_vocabulary_reviewer_authority_request.mjs",
    "--output",
    ".",
  ]);
}

function runReviewerAuthorityStatusDanglingSymlinkProbe() {
  const probeDir = path.join(root, "data", "vocabulary-review", "evidence", "guardrail-negative-fixtures", "status-dangling");
  const linkPath = path.join(probeDir, "dangling-reviewer-evidence.txt");
  fs.rmSync(probeDir, { recursive: true, force: true });
  try {
    fs.mkdirSync(probeDir, { recursive: true });
    fs.symlinkSync(
      path.join(root, "output", "guardrail-negative-fixtures", "missing-reviewer-evidence.txt"),
      linkPath,
    );
    const result = run("node", ["scripts/report_vocabulary_reviewer_authority_status.mjs", "--limit", "20"]);
    const parsed = parseJsonResult(result);
    const symlinkPath = projectRelative(linkPath);
    const ok = Boolean(
      result.ok &&
      parsed?.status === "blocked" &&
      parsed?.evidence_root?.symlink_count >= 1 &&
      Array.isArray(parsed?.evidence_root?.first_symlinks) &&
      parsed.evidence_root.first_symlinks.includes(symlinkPath),
    );
    return {
      ...result,
      command: `${result.command} <dangling-symlink-evidence-root-probe>`,
      status: ok ? 0 : 1,
      ok,
      stdout: [
        result.stdout,
        JSON.stringify({
          blocked_status: parsed?.status ?? null,
          symlink_count: parsed?.evidence_root?.symlink_count ?? null,
          first_symlinks: parsed?.evidence_root?.first_symlinks ?? null,
        }),
      ].filter(Boolean).join("\n"),
    };
  } finally {
    fs.rmSync(probeDir, { recursive: true, force: true });
  }
}

function runStageReviewerAuthorityEvidenceProbe(fixtures, extraArgs = []) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.goodVocabularyReviewerCredentialEvidence,
    "--key-binding-evidence-file",
    fixtures.goodVocabularyReviewerKeyBindingEvidence,
    "--trusted-by-evidence-file",
    fixtures.goodVocabularyReviewerTrustedByEvidence,
    "--output-dir",
    "data/vocabulary-review/evidence/guardrail-negative-fixtures/staged-authority-evidence",
    ...extraArgs,
  ]);
}

function runStageReviewerAuthorityEvidenceSymlinkProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.badVocabularyReviewerSymlinkEvidence,
  ]);
}

function runStageReviewerAuthorityEvidencePrivateKeyProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.goodVocabularyReviewerPrivateKey,
  ]);
}

function runStageReviewerAuthorityEvidenceDerPrivateKeyProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.badVocabularyReviewerDerPrivateKeyEvidence,
  ]);
}

function runStageReviewerAuthorityEvidenceEmptyFileProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.badVocabularyReviewerEmptyEvidence,
  ]);
}

function runStageReviewerAuthorityEvidenceRequestMaterialProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.badVocabularyReviewerRequestMaterialSource,
  ]);
}

function runStageReviewerAuthorityEvidenceOutputRefusalProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.goodVocabularyReviewerCredentialEvidence,
    "--output-dir",
    "output",
  ]);
}

function runStageReviewerAuthorityEvidenceOutputSymlinkProbe(fixtures) {
  return run("node", [
    "scripts/stage_vocabulary_reviewer_authority_evidence.mjs",
    "--credential-evidence-file",
    fixtures.goodVocabularyReviewerCredentialEvidence,
    "--output-dir",
    fixtures.badVocabularyReviewerSymlinkOutputDir,
  ]);
}

function runVocabularyReviewBundleOutputRefusalProbe() {
  return run("node", [
    "scripts/prepare_vocabulary_review_bundle.mjs",
    "--output",
    ".",
  ]);
}

function runCollectionSessionBundleOutputRefusalProbe() {
  return run("node", [
    "scripts/prepare_collection_session_bundle.mjs",
    "--allow-draft",
    "--output",
    ".",
  ]);
}

function runSignatureRequestPreservesExistingOutputProbe() {
  const target = path.join(
    root,
    "output",
    "review-handoff",
    "vocabulary-review-signature-request",
    "guardrail-preserve-existing-output",
  );
  const sentinelPath = path.join(target, "SENTINEL.txt");
  const sentinel = `existing-signature-request-output-${Date.now()}`;
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(sentinelPath, sentinel, "utf8");
  try {
    const result = run("node", [
      "scripts/prepare_vocabulary_review_signature_request.mjs",
      "--output",
      projectRelative(target),
    ]);
    const preserved = fs.existsSync(sentinelPath) && fs.readFileSync(sentinelPath, "utf8") === sentinel;
    return {
      command: `${result.command} <preserve-existing-output-probe>`,
      status: result.status === 0 || !preserved ? 1 : 0,
      ok: result.status !== 0 && preserved,
      stdout: [
        result.stdout,
        JSON.stringify({ failed_as_expected: result.status !== 0, preserved }),
      ].filter(Boolean).join("\n"),
      stderr: result.stderr,
    };
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function runInvalidReviewerAuthorityWritePreservesExistingOutputProbe(fixtures) {
  const target = path.join(fixtureRoot, "preserved-reviewer-authority.json");
  const sentinel = `${JSON.stringify({
    schema_version: "guardrail-sentinel/v1",
    preserved: true,
    marker: `existing-reviewer-authority-output-${Date.now()}`,
  }, null, 2)}\n`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, sentinel, "utf8");
  const result = run("node", [
    "scripts/prepare_vocabulary_reviewer_authority.mjs",
    "--public-key",
    fixtures.goodVocabularyReviewerPublicKey,
    "--trusted-at",
    "2025-12-31T00:00:00.000Z",
    "--reviewer-name",
    "Reviewer Name",
    "--reviewer-role",
    "Qualified ASL instructor",
    "--reviewer-qualification",
    "Actual ASL qualification",
    "--reviewer-affiliation-or-context",
    "School, program, or independent context",
    "--reviewer-contact-or-signed-evidence",
    "contact or credential reference",
    "--credential-evidence",
    "Fixture ASL instructor credential evidence",
    "--credential-evidence-file",
    fixtures.goodVocabularyReviewerCredentialEvidence,
    "--key-binding-evidence",
    "Fixture reviewer key binding evidence",
    "--key-binding-evidence-file",
    fixtures.goodVocabularyReviewerKeyBindingEvidence,
    "--trusted-by-evidence",
    "Fixture operator attestation that reviewer identity and key binding were checked before review",
    "--trusted-by-evidence-file",
    fixtures.goodVocabularyReviewerTrustedByEvidence,
    "--trusted-by-name",
    "Operator Name",
    "--trusted-by-role",
    "Operator role",
    "--trusted-by-contact-or-signed-evidence",
    "operator contact or signature reference",
    "--output",
    projectRelative(target),
    "--write",
  ]);
  const preserved = fs.existsSync(target) && fs.readFileSync(target, "utf8") === sentinel;
  return {
    command: `${result.command} <invalid-write-preserve-existing-output-probe>`,
    status: result.status === 0 || !preserved ? 1 : 0,
    ok: result.status !== 0 && preserved,
    stdout: [
      result.stdout,
      JSON.stringify({ failed_as_expected: result.status !== 0, preserved }),
    ].filter(Boolean).join("\n"),
    stderr: result.stderr,
  };
}

function reviewerAuthorityPreparationArgs(fixtures, overrides = {}) {
  return [
    "--public-key",
    overrides.publicKey ?? fixtures.goodVocabularyReviewerPublicKey,
    "--trusted-at",
    "2025-12-31T00:00:00.000Z",
    "--reviewer-name",
    overrides.reviewerName ?? "Fixture Reviewer",
    "--reviewer-role",
    overrides.reviewerRole ?? fixtureAslReviewerRole,
    "--reviewer-qualification",
    overrides.reviewerQualification ?? fixtureAslReviewerQualification,
    "--reviewer-affiliation-or-context",
    overrides.reviewerAffiliationOrContext ?? "Fixture",
    "--reviewer-contact-or-signed-evidence",
    overrides.reviewerContactOrSignedEvidence ?? "fixture@example.test",
    "--credential-evidence",
    overrides.credentialEvidence ?? "Fixture ASL instructor credential evidence",
    "--credential-evidence-file",
    overrides.credentialEvidenceFile ?? fixtures.goodVocabularyReviewerCredentialEvidence,
    "--key-binding-evidence",
    overrides.keyBindingEvidence ?? "Fixture reviewer key binding evidence",
    "--key-binding-evidence-file",
    overrides.keyBindingEvidenceFile ?? fixtures.goodVocabularyReviewerKeyBindingEvidence,
    "--trusted-by-evidence",
    overrides.trustedByEvidence ?? "Fixture operator attestation that reviewer identity and key binding were checked before review",
    "--trusted-by-evidence-file",
    overrides.trustedByEvidenceFile ?? fixtures.goodVocabularyReviewerTrustedByEvidence,
    "--trusted-by-name",
    overrides.trustedByName ?? "Fixture Operator",
    "--trusted-by-role",
    overrides.trustedByRole ?? "ASL Pilot operator",
    "--trusted-by-contact-or-signed-evidence",
    overrides.trustedByContactOrSignedEvidence ?? "fixture-operator@example.test",
  ];
}

function runPrepareReviewerAuthorityPublicKeyPrivateKeyProbe(fixtures) {
  return run("node", [
    "scripts/prepare_vocabulary_reviewer_authority.mjs",
    ...reviewerAuthorityPreparationArgs(fixtures, {
      publicKey: fixtures.goodVocabularyReviewerPrivateKey,
    }),
  ]);
}

function runComputePublicKeyPrivateKeyProbe(fixtures) {
  return run("node", [
    "scripts/compute_ed25519_public_key_fingerprint.mjs",
    "--public-key",
    fixtures.goodVocabularyReviewerPrivateKey,
  ]);
}

function runPrepareReviewerAuthorityDuplicateEvidenceProbe(fixtures) {
  return run("node", [
    "scripts/prepare_vocabulary_reviewer_authority.mjs",
    ...reviewerAuthorityPreparationArgs(fixtures, {
      keyBindingEvidenceFile: fixtures.goodVocabularyReviewerCredentialEvidence,
      trustedByEvidenceFile: fixtures.goodVocabularyReviewerCredentialEvidence,
    }),
  ]);
}

function runPrepareReviewerAuthorityFromIntakeProbe(fixtures, intake = fixtures.goodVocabularyReviewerAuthorityIntake) {
  return run("node", [
    "scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs",
    "--input",
    intake,
    "--staged-output-dir",
    "data/vocabulary-review/evidence/guardrail-negative-fixtures/intake-staged-authority",
    "--force",
  ]);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return [fullPath];
  });
}

function runPrepareReviewerAuthorityFromIntakeRollbackProbe(fixtures) {
  const stagedOutputDir = path.join(
    root,
    "data",
    "vocabulary-review",
    "evidence",
    "guardrail-negative-fixtures",
    "intake-rollback-authority",
  );
  fs.rmSync(stagedOutputDir, { recursive: true, force: true });
  const result = run("node", [
    "scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs",
    "--input",
    fixtures.badPlaceholderVocabularyReviewerAuthorityIntake,
    "--staged-output-dir",
    projectRelative(stagedOutputDir),
    "--force",
  ]);
  const stagedFileCount = listFiles(stagedOutputDir).length;
  return {
    ...result,
    command: `${result.command} <rollback-after-validation-failure-probe>`,
    status: result.status === 0 || stagedFileCount !== 0 ? 1 : 0,
    ok: result.status !== 0 && stagedFileCount === 0,
    stdout: [
      result.stdout,
      JSON.stringify({
        failed_as_expected: result.status !== 0,
        staged_file_count: stagedFileCount,
      }),
    ].filter(Boolean).join("\n"),
  };
}

function includesAny(output, snippets) {
  const text = `${output.stdout}\n${output.stderr}`.toLowerCase();
  return snippets.some((snippet) => text.includes(snippet.toLowerCase()));
}

function assertCase(checks, id, label, result, expectation) {
  const passed =
    expectation.ok === result.ok &&
    (!expectation.includes || includesAny(result, expectation.includes));
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    command: result.command,
    exit_status: result.status,
    expected_ok: expectation.ok,
    blockers: passed
      ? []
      : [
          `expected ok=${expectation.ok} and output containing ${(expectation.includes ?? []).join(" or ") || "(no snippet requirement)"}`,
        ],
  });
}

function baseSourceRegister(extraSources = []) {
  const checkedAt = "2026-05-20T00:00:00.000Z";
  const sourceEvidence = (summary) => [
    {
      evidence_type: "fixture",
      url: "https://example.test/fixture",
      checked_at: checkedAt,
      summary,
      supports_decision: true,
    },
  ];
  return {
    schema_version: "asl-pilot-dataset-source-register/v1",
    updated_at: checkedAt,
    review_method: {
      reviewed_at: checkedAt,
      review_scope: "fixture",
      default_public_dataset_policy: "blocked_without_external_rights_review",
      only_builtin_allowed_source_id: "first-party-browser-consent-capture",
    },
    sources: [
      {
        source_id: "first-party-browser-consent-capture",
        display_name: "First-party consented browser recordings",
        source_kind: "first_party_collection",
        allowed_for_model_training: true,
        allowed_for_validation: true,
        allowed_for_pilot_submission: true,
        license_review_status: "approved_after_clip_level_consent",
        decision_id: "first_party_consent_required_v1",
        required_evidence: [
          "dataset signer registry record",
          "clip-level consent record",
          "dataset consent form version and hash",
          "raw clip SHA-256 hash",
          "clip-level ASL label review approval",
        ],
        source_evidence: [
          {
            evidence_type: "first_party_consent_contract",
            path: "docs/privacy/dataset-consent-form.md",
            sha256: "c1832291070b351fd3bbedf3ee1e099ce55f027b659823b8eefff23cc51e1995",
            checked_at: checkedAt,
            summary: "fixture",
            supports_decision: true,
          },
        ],
        restrictions: ["fixture"],
      },
      {
        source_id: "asl-citizen",
        display_name: "ASL Citizen",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: false,
        allowed_for_validation: false,
        allowed_for_pilot_submission: false,
        license_review_status: "blocked_noncommercial_research_only",
        decision_id: "blocked_asl_citizen_2026_05_19",
        primary_source_url: "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/",
        review_required_before_allowing: true,
        source_evidence: sourceEvidence("fixture"),
        restrictions: ["fixture"],
      },
      {
        source_id: "wlasl",
        display_name: "WLASL",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: false,
        allowed_for_validation: false,
        allowed_for_pilot_submission: false,
        license_review_status: "blocked_academic_computational_only",
        decision_id: "blocked_wlasl_2026_05_19",
        primary_source_url: "https://github.com/dxli94/WLASL",
        review_required_before_allowing: true,
        source_evidence: sourceEvidence("fixture"),
        restrictions: ["fixture"],
      },
      {
        source_id: "asl-lex",
        display_name: "ASL-LEX",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: false,
        allowed_for_validation: false,
        allowed_for_pilot_submission: false,
        license_review_status: "blocked_video_permission_required",
        decision_id: "blocked_asl_lex_2026_05_19",
        primary_source_url: "https://asl-lex.org/download.html",
        review_required_before_allowing: true,
        source_evidence: sourceEvidence("fixture"),
        restrictions: ["fixture"],
      },
      {
        source_id: "kaggle-or-static-asl",
        display_name: "Kaggle or static ASL datasets",
        source_kind: "external_dataset_family",
        allowed_for_model_training: false,
        allowed_for_validation: false,
        allowed_for_pilot_submission: false,
        license_review_status: "blocked_until_dataset_specific_review",
        decision_id: "blocked_kaggle_static_default_2026_05_19",
        review_required_before_allowing: true,
        source_evidence: sourceEvidence("fixture"),
        restrictions: ["fixture"],
      },
      ...extraSources,
    ],
  };
}

function buildFixtures() {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.rmSync(vocabularyReviewEvidenceFixtureRoot, { recursive: true, force: true });
  fs.mkdirSync(fixtureRoot, { recursive: true });
  fs.mkdirSync(vocabularyReviewEvidenceFixtureRoot, { recursive: true });

  const goodArtifact = writeJson("good-artifact.json", {
    schema_version: "fixture-good/v1",
    architecture: {
      family: "raw_frame_cnn_temporal_pool",
      pretrained_components: [],
    },
    attestation:
      "The final browser model was not initialized from pretrained CV/sign-language weights or pretrained feature extractors.",
  });
  const badComponents = writeJson("bad-pretrained-components.json", {
    schema_version: "fixture-bad/v1",
    architecture: {
      pretrained_components: ["mediapipe-hands"],
    },
  });
  const badLoader = writeJson("bad-loader.json", {
    schema_version: "fixture-bad/v1",
    generated_by: {
      command: "python -c 'AutoModel.from_pretrained(\"example/model\")'",
    },
  });
  const badLandmarks = writeJson("bad-landmarks.json", {
    schema_version: "fixture-bad/v1",
    clips: [
      {
        clip_id: "fixture",
        pose_landmarks: "output/features/fixture.landmarks.json",
      },
    ],
  });
  const badPretrainedCheckpoint = writeJson("bad-pretrained-checkpoint.json", {
    schema_version: "fixture-bad/v1",
    training: {
      initialization_checkpoint: "artifacts/pretrained-i3d-checkpoint.pt",
    },
  });
  const signedConsentReceiptBase = {
    schema_version: "asl-pilot-signed-consent-identity-receipt/v1",
    status: "signed",
    signer_alias: "signer-001",
    signer_identity_hash: "a".repeat(64),
    consent_record_ids: ["consent-001"],
    consent_form: {
      path: "docs/privacy/dataset-consent-form.md",
      sha256: sha256File("docs/privacy/dataset-consent-form.md"),
      consent_version: "asl-pilot-dataset-consent-v1",
    },
    confirmed_consent_flags: {
      age_eligible: true,
      allow_model_training: true,
      allow_validation: true,
      allow_pilot_use: true,
      allow_derived_artifact_retention: true,
      allow_deidentified_metadata_retention: true,
      retention_acknowledged: true,
      withdrawal_acknowledged: true,
      raw_clip_redistribution_without_separate_permission: false,
    },
    signed_at: "2026-05-20T00:00:00.000Z",
    signed_by: {
      name: "Signer One",
      role: "Signer",
      affiliation_or_context: "Fixture signer",
      contact_or_signature_reference: "fixture-signer-signature",
      is_project_operator: false,
    },
  };
  const goodSignedConsentReceipt = writeJson(
    "good-signed-consent-receipt.json",
    signConsentReceipt(signedConsentReceiptBase),
  );
  const symlinkSignedConsentReceipt = writeSymlink(
    "symlink-signed-consent-receipt.json",
    goodSignedConsentReceipt,
  );
  const symlinkConsentReceiptTargetDir = path.join(fixtureRoot, "symlink-signed-consent-target");
  fs.mkdirSync(symlinkConsentReceiptTargetDir, { recursive: true });
  fs.writeFileSync(
    path.join(symlinkConsentReceiptTargetDir, "receipt.json"),
    `${JSON.stringify(signConsentReceipt(signedConsentReceiptBase), null, 2)}\n`,
    "utf8",
  );
  const symlinkConsentReceiptDir = writeSymlinkDirectory(
    "symlink-signed-consent-dir",
    projectRelative(symlinkConsentReceiptTargetDir),
  );
  const ancestorSymlinkSignedConsentReceipt = projectRelative(path.join(
    root,
    symlinkConsentReceiptDir,
    "receipt.json",
  ));
  const badSignedConsentReceipt = writeJson(
    "bad-signed-consent-receipt.json",
    signedConsentReceiptBase,
  );
  const tamperedSignedConsentReceipt = signConsentReceipt(signedConsentReceiptBase);
  tamperedSignedConsentReceipt.signed_by.name = "Mallory Signer";
  const badTamperedSignedConsentReceipt = writeJson(
    "bad-tampered-signed-consent-receipt.json",
    tamperedSignedConsentReceipt,
  );
  const extraFieldSignedConsentReceipt = signConsentReceipt(signedConsentReceiptBase);
  extraFieldSignedConsentReceipt.operator_override = "fixture unsigned field";
  const badExtraFieldSignedConsentReceipt = writeJson(
    "bad-extra-field-signed-consent-receipt.json",
    extraFieldSignedConsentReceipt,
  );
  const signerIdentityUnsignedConsent = writeJson("bad-signer-identity-unsigned-consent.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2026-05-20T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: ["consent-001"],
        signed_consent_evidence: {
          path: badSignedConsentReceipt,
          sha256: sha256File(badSignedConsentReceipt),
          purpose: "Unsigned fixture consent receipt",
        },
        verified_at: "2026-05-20T00:00:00.000Z",
      },
    ],
  });
  const signerIdentitySymlinkConsent = writeJson("bad-signer-identity-symlink-consent.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2026-05-20T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: ["consent-001"],
        signed_consent_evidence: {
          path: symlinkSignedConsentReceipt,
          sha256: sha256File(symlinkSignedConsentReceipt),
          purpose: "Symlinked fixture consent receipt",
        },
        verified_at: "2026-05-20T00:00:00.000Z",
      },
    ],
  });
  const signerIdentityAncestorSymlinkConsent = writeJson("bad-signer-identity-ancestor-symlink-consent.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2026-05-20T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: ["consent-001"],
        signed_consent_evidence: {
          path: ancestorSymlinkSignedConsentReceipt,
          sha256: sha256File(ancestorSymlinkSignedConsentReceipt),
          purpose: "Fixture consent receipt under a symlinked directory",
        },
        verified_at: "2026-05-20T00:00:00.000Z",
      },
    ],
  });
  const signerIdentityFutureTimestamp = writeJson("bad-signer-identity-future-timestamp.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2099-01-01T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: ["consent-001"],
        signed_consent_evidence: {
          path: goodSignedConsentReceipt,
          sha256: sha256File(goodSignedConsentReceipt),
          purpose: "Future timestamp fixture consent receipt",
        },
        verified_at: "2099-01-01T00:00:00.000Z",
      },
    ],
  });
  const badCollectionReadinessAncestorSymlinkConsent = writeJson("bad-collection-readiness-ancestor-symlink-consent-store.json", {
    users: [],
    sessions: [],
    attempts: [],
    datasetSigners: [
      {
        signerAlias: "signer-001",
        signerIdentityHash: "a".repeat(64),
        split: "train",
        identityAttestation: "signed_identity_verified",
        consentVersion: "asl-pilot-dataset-consent-v1",
        consentFormSha256: sha256File("docs/privacy/dataset-consent-form.md"),
        signedConsentEvidence: {
          path: ancestorSymlinkSignedConsentReceipt,
          sha256: sha256File(ancestorSymlinkSignedConsentReceipt),
          purpose: "Fixture consent receipt under a symlinked directory",
        },
      },
    ],
    consentRecords: [
      {
        id: "consent-001",
        userId: "user-001",
        signerAlias: "signer-001",
        signerIdentityHash: "a".repeat(64),
        consentVersion: "asl-pilot-dataset-consent-v1",
        consentFormSha256: sha256File("docs/privacy/dataset-consent-form.md"),
        ageEligible: true,
        allowModelTraining: true,
        allowValidation: true,
        allowPilotUse: true,
        allowDerivedArtifactRetention: true,
        allowDeidentifiedMetadataRetention: true,
        retentionAcknowledged: true,
        withdrawalAcknowledged: true,
        allowRawClipRedistribution: false,
        signedAt: "2026-05-20T00:00:00.000Z",
        operatorUserId: "operator-001",
        rawClipStorageLocation: "fixture local store",
        rawClipAccess: "fixture operator only",
        retentionPeriod: "pilot fixture retention",
        signedConsentEvidence: {
          path: ancestorSymlinkSignedConsentReceipt,
          sha256: sha256File(ancestorSymlinkSignedConsentReceipt),
          purpose: "Fixture consent receipt under a symlinked directory",
        },
      },
    ],
    datasetClips: [
      {
        id: "clip-001",
        userId: "user-001",
        signerAlias: "signer-001",
        consentRecordId: "consent-001",
        vocabularyId: vocabularyIds()[0],
        labelReviewStatus: "approved",
        labelReviewer: "Fixture ASL reviewer",
        labelReviewedAt: "2026-05-20T00:00:00.000Z",
        mimeType: "video/webm",
        durationMs: 1000,
        sizeBytes: 2048,
        mediaStreamTrackSettings: { width: 640, height: 480 },
        relativeVideoPath: "output/guardrail-negative-fixtures/missing.webm",
      },
    ],
    datasetChallengeClips: [],
  });
  const { privateKey: consentHelperPrivateKey } = crypto.generateKeyPairSync("ed25519");
  const goodConsentHelperPrivateKey = writeText(
    "good-signed-consent-helper-private-key.pem",
    consentHelperPrivateKey.export({ type: "pkcs8", format: "pem" }),
  );
  const goodConsentHelperOutput = fixtureProjectPath("good-signed-consent-helper-output.json");
  const goodSignerIdentityForConsentHelper = writeJson("good-signer-identity-for-consent-helper.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2024-01-01T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: ["consent-001"],
        signed_consent_evidence: {
          path: goodConsentHelperOutput,
          sha256: "0".repeat(64),
          purpose: "Signed consent and identity verification receipt for signer-001",
        },
        verified_at: "2024-01-01T00:00:00.000Z",
      },
    ],
  });
  const badConsentHelperOutput = fixtureProjectPath("bad-signed-consent-helper-output.json");
  const incompleteSignerIdentityForConsentHelper = writeJson("incomplete-signer-identity-for-consent-helper.json", {
    schema_version: "asl-pilot-signer-identity-evidence/v1",
    status: "verified",
    verified_at: "2024-01-01T00:00:00.000Z",
    verified_by: {
      name: "Fixture Verifier",
      role: "Identity verifier",
      affiliation_or_context: "Fixture verification",
      contact_or_signed_evidence: "fixture-verifier-signature",
      is_project_operator: false,
    },
    signers: [
      {
        signer_alias: "signer-001",
        signer_identity_hash: "a".repeat(64),
        consent_record_ids: [],
        signed_consent_evidence: {
          path: badConsentHelperOutput,
          sha256: "0".repeat(64),
          purpose: "Incomplete fixture consent receipt",
        },
        verified_at: "2024-01-01T00:00:00.000Z",
      },
    ],
  });
  const badLocalMlEnvironment = writeJson("bad-local-ml-environment.json", {
    schema_version: "asl-pilot-local-ml-environment/v1",
    status: "failed",
    generated_at: "2026-05-20T00:00:00.000Z",
    audit_script: {
      path: "scripts/audit_local_ml_environment.py",
      sha256: sha256File("scripts/audit_local_ml_environment.py"),
    },
    project_files: [
      {
        path: "requirements.txt",
        sha256: sha256File("requirements.txt"),
      },
      {
        path: "web/package-lock.json",
        sha256: sha256File("web/package-lock.json"),
      },
    ],
    python: {
      executable: pythonCommand(),
      version: "0.0.0-fixture",
    },
    python_packages: {},
    torch: {
      torch_importable: true,
      mps_built: false,
      mps_available: false,
    },
    ffmpeg: {
      available: false,
      path: null,
      version: null,
    },
    browser_runtime: {
      declared: "^1.26.0",
      installed: "1.26.0",
      wasm_runtime_expected: true,
    },
    python_onnxruntime: {
      installed: null,
      required: false,
      reason: "Fixture",
    },
    blockers: ["fixture should not pass final local ML/GPU receipt validation"],
  });
  const externalAttestationEvidenceFiles = [
    {
      path: "docs/privacy/video-handling.md",
      sha256: sha256File("docs/privacy/video-handling.md"),
      purpose: "Final privacy handling documentation",
    },
    {
      path: "docs/privacy/final-privacy-smoke.json",
      sha256: sha256File("docs/privacy/final-privacy-smoke.json"),
      purpose: "Final static/live HTTP privacy smoke evidence",
    },
  ];
  const externalAttestationDigest = evidenceDigest(externalAttestationEvidenceFiles);
  const privacyAttestationStatement = "I reviewed the privacy documentation and final privacy smoke evidence for the pilot.";
  const privacyAttestedAt = "2026-05-20T00:00:00.000Z";
  const privacyAttestedBy = {
    name: "Alex Reviewer",
    role: "Privacy reviewer",
    affiliation_or_context: "Independent privacy review",
    credential_or_authority: "Privacy review authority",
    contact_or_signed_evidence: "fixture-reviewer-signature",
    is_project_operator: false,
  };
  const privacyAttestationSnapshot = normalizedAttestationSnapshot({
    id: "privacy_static_http_smoke",
    statement: privacyAttestationStatement,
    attested_at: privacyAttestedAt,
    attested_by: privacyAttestedBy,
    evidence_files: externalAttestationEvidenceFiles,
    evidence_digest: externalAttestationDigest,
  });
  const forgedSignedAttestationReceipt = writeJson("forged-signed-attestation-receipt-no-signature.json", {
    schema_version: "asl-pilot-signed-attestation-receipt/v1",
    status: "signed",
    attestation_id: "privacy_static_http_smoke",
    attestation_snapshot: privacyAttestationSnapshot,
    evidence_digest: externalAttestationDigest,
    signed_at: privacyAttestedAt,
    signed_by: {
      name: "Alex Reviewer",
      role: "Privacy reviewer",
      affiliation_or_context: "Independent privacy review",
      contact_or_signature_reference: "fixture-reviewer-signature",
      is_project_operator: false,
    },
    reviewed_evidence_files: externalAttestationEvidenceFiles.map((item) => ({
      path: item.path,
      sha256: item.sha256,
    })),
    signature_notes: "Fixture intentionally claims signed status without machine-verifiable signature_evidence.",
  });
  const forgedExternalAttestation = writeJson("forged-external-attestation-no-signature.json", {
    schema_version: "asl-pilot-external-attestations/v1",
    status: "verified",
    generated_at: "2026-05-20T00:00:00.000Z",
    attestations: [
      {
        id: "privacy_static_http_smoke",
        status: "attested",
        statement: privacyAttestationStatement,
        attested_at: privacyAttestedAt,
        attested_by: privacyAttestedBy,
        evidence_files: externalAttestationEvidenceFiles,
        evidence_digest: externalAttestationDigest,
        signed_evidence_files: [
          {
            path: forgedSignedAttestationReceipt,
            sha256: sha256File(forgedSignedAttestationReceipt),
            purpose: "Forged receipt that claims signed status without a verifiable signature",
            signed_at: "2026-05-20T00:00:00.000Z",
          },
        ],
      },
    ],
  });
  const badBrowserOnnxWiringSmokeReport = writeJson("bad-browser-onnx-wiring-final-claim.json", {
    schema_version: "asl-pilot-browser-onnx-wiring-smoke/v1",
    status: "passed",
    evidence_mode: "final",
    finality: "candidate_final_artifact",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      tool: "playwright",
      browser: "Chromium fixture",
      app_url: "http://127.0.0.1:3025/smoke/browser-onnx",
      command: ["node", "scripts/run_browser_onnx_wiring_smoke.mjs"],
      script: {
        path: "scripts/run_browser_onnx_wiring_smoke.mjs",
        sha256: sha256File("scripts/run_browser_onnx_wiring_smoke.mjs"),
      },
    },
    smoke_model_card: {
      path: goodArtifact,
      sha256: sha256File(goodArtifact),
    },
    smoke_browser_artifact: {
      path: goodArtifact,
      sha256: sha256File(goodArtifact),
    },
    runtime: {
      package: "onnxruntime-web",
      version: "1.26.0",
      execution_provider: "wasm",
      app_wasm_route: "/api/ort/",
    },
    inference: {
      ran_browser_inference: true,
      expected_id: "hello",
      predicted_id: "hello",
      confidence: 0.75,
      model_status: "trained",
      model_id: "asl-pilot-browser-onnx-wiring-smoke-v0",
      input_shape: [1, 3, 3, 16, 16],
      logits_shape: [1, 2],
      client_validated_logits_against_label_count: true,
      result: {
        passed: true,
        expectedId: "hello",
        predictedId: "hello",
        confidence: 0.75,
        modelStatus: "trained",
        modelId: "asl-pilot-browser-onnx-wiring-smoke-v0",
      },
    },
    network: {
      fetched_smoke_model_card: true,
      fetched_smoke_browser_artifact: true,
      fetched_ort_wasm_route: true,
      unexpected_external_requests: [],
    },
    evidence: {
      browser_files: [],
      source_files: [],
    },
    final_evidence_exclusion: {
      excluded_from_completion: false,
      final_browser_smoke_report: "docs/validation/final-browser-onnx-smoke.json",
    },
    blockers: [],
  });
  const badFinalBrowserOnnxDirectRunnerReport = writeJson("bad-final-browser-onnx-direct-runner.json", {
    schema_version: "asl-pilot-final-browser-onnx-smoke/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      tool: "playwright",
      browser: "Chromium fixture",
      app_url: "http://127.0.0.1:3025",
      command: ["node", "scripts/run_final_browser_onnx_smoke.mjs", "--write"],
      script: {
        path: "scripts/run_final_browser_onnx_smoke.mjs",
        sha256: sha256File("scripts/run_final_browser_onnx_smoke.mjs"),
      },
    },
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    onnx_export_provenance: {
      path: goodArtifact,
      sha256: sha256File(goodArtifact),
    },
    browser_artifact: {
      path: goodArtifact,
      sha256: sha256File(goodArtifact),
    },
    runtime: {
      package: "onnxruntime-web",
      version: "1.26.0",
      execution_provider: "wasm",
    },
    inference: {
      ran_browser_inference: true,
      client_model_path: "scripts/run_final_browser_onnx_smoke.mjs",
      app_route: "direct-page-evaluate",
      mode: "final_artifact",
      app_wasm_route: "/__asl-pilot-ort/",
      model_id: "asl-pilot-rawframe-v0",
      artifact_path: goodArtifact,
      input_shape: [1, 16, 3, 96, 96],
      logits_shape: [1, 83],
      latency_ms: 10,
      session_input_names: ["clips"],
      session_output_names: ["logits"],
      output_type: "float32",
      predicted_id: "hello",
      confidence: 0.9,
      frame_count: 16,
      image_size: 96,
      label_count: 83,
      browser_fetched_artifact_sha256: sha256File(goodArtifact),
    },
    network: {
      unexpected_external_requests: [],
      final_onnx_request_count: 1,
      ort_wasm_request_count: 1,
    },
    evidence: {
      browser_files: [],
      source_files: [
        {
          path: "scripts/run_final_browser_onnx_smoke.mjs",
          sha256: sha256File("scripts/run_final_browser_onnx_smoke.mjs"),
        },
        {
          path: "web/src/lib/client-model.ts",
          sha256: sha256File("web/src/lib/client-model.ts"),
        },
        {
          path: "web/src/app/api/ort/[file]/route.ts",
          sha256: sha256File("web/src/app/api/ort/[file]/route.ts"),
        },
      ],
    },
    blockers: [],
  });
  const unsignedBrowserReview = writeJson("bad-browser-compatibility-unsigned-review.json", {
    schema_version: "asl-pilot-browser-compatibility-signed-review/v1",
    browser_id: "safari_desktop",
    app_url: "http://127.0.0.1:3025",
    command: "manual Safari final compatibility review fixture",
    model_card_sha256: sha256File("web/public/model/model-card.json"),
    final_browser_onnx_smoke_sha256: "a".repeat(64),
    browser_artifact_path: "web/public/model/asl-pilot-rawframe-v0.onnx",
    browser_artifact_sha256: "b".repeat(64),
    reviewed_evidence_digest: evidenceDigest([]),
    reviewed_at: "2026-05-20T00:00:00.000Z",
    signed_at: "2026-05-20T00:00:00.000Z",
    review_status: "passed",
    verified_checks: {
      secure_origin: true,
      camera_access_checked: true,
      wasm_inference_checked: true,
      model_artifact_loaded: true,
      normal_practice_raw_media_uploads_observed: false,
    },
    reviewer: {
      name: "Safari Reviewer",
      role: "Browser compatibility reviewer",
      contact_or_signed_evidence: "fixture-reviewer-signature",
      is_project_operator: false,
    },
    signature: {
      method: "fixture textual approval",
      signature_reference: "fixture-reviewer-signature",
      signed_payload_sha256: "c".repeat(64),
    },
  });
  const badBrowserCompatibilityUnsignedReview = writeJson("bad-browser-compatibility-unsigned-review-report.json", {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      command: [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        "http://127.0.0.1:3025",
        "--observations",
        "output/guardrail-negative-fixtures/missing-browser-observations.json",
        "--output",
        "output/guardrail-negative-fixtures/bad-browser-compatibility-unsigned-review-report.json",
        "--write",
      ],
      script: {
        path: "scripts/run_final_browser_compatibility.mjs",
        sha256: sha256File("scripts/run_final_browser_compatibility.mjs"),
      },
    },
    output: "output/guardrail-negative-fixtures/bad-browser-compatibility-unsigned-review-report.json",
    app_url: "http://127.0.0.1:3025",
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    final_browser_onnx_smoke: {
      path: "docs/validation/final-browser-onnx-smoke.json",
      sha256: "a".repeat(64),
    },
    observations_source: {
      path: "output/guardrail-negative-fixtures/missing-browser-observations.json",
      sha256: "d".repeat(64),
    },
    browsers: [
      {
        browser_id: "safari_desktop",
        browser_name: "Safari",
        browser_version: "fixture",
        engine: "WebKit",
        status: "passed",
        tested_at: "2026-05-20T00:00:00.000Z",
        secure_origin: true,
        camera_access_checked: true,
        wasm_inference_checked: true,
        model_artifact_loaded: true,
        latency_ms: {
          warmup: 1,
          p50: 2,
          p95: 3,
          max: 4,
        },
        normal_practice_raw_media_uploads_observed: false,
        notes: "Fixture manual browser review with an unsigned JSON receipt.",
        command: "manual Safari final compatibility review fixture",
        verification_mode: "manual_signed_review",
        manual_reviewer: {
          name: "Safari Reviewer",
          role: "Browser compatibility reviewer",
          contact_or_signed_evidence: "fixture-reviewer-signature",
          is_project_operator: false,
        },
        operator_notes: "Fixture row intentionally lacks machine-verifiable browser review signature evidence.",
        evidence_files: [],
        signed_evidence_files: [
          {
            type: "signed_review",
            path: unsignedBrowserReview,
            sha256: sha256File(unsignedBrowserReview),
            purpose: "Unsigned manual browser compatibility review receipt",
          },
        ],
      },
    ],
    blockers: [],
  });
  const badBrowserCompatibilitySmokeRoute = writeJson("bad-browser-compatibility-smoke-route-report.json", {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      command: [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        "http://127.0.0.1:3025/smoke/browser-onnx?mode=final",
        "--observations",
        "output/guardrail-negative-fixtures/missing-browser-observations.json",
        "--output",
        "output/guardrail-negative-fixtures/bad-browser-compatibility-smoke-route-report.json",
        "--write",
      ],
      script: {
        path: "scripts/run_final_browser_compatibility.mjs",
        sha256: sha256File("scripts/run_final_browser_compatibility.mjs"),
      },
    },
    output: "output/guardrail-negative-fixtures/bad-browser-compatibility-smoke-route-report.json",
    app_url: "http://127.0.0.1:3025/smoke/browser-onnx?mode=final",
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    final_browser_onnx_smoke: {
      path: "docs/validation/final-browser-onnx-smoke.json",
      sha256: "a".repeat(64),
    },
    observations_source: {
      path: "output/guardrail-negative-fixtures/missing-browser-observations.json",
      sha256: "d".repeat(64),
    },
    browsers: [],
    blockers: [],
  });
  const badBrowserCompatibilityOtherRoute = writeJson("bad-browser-compatibility-other-route-report.json", {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      command: [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        "http://127.0.0.1:3025/practice?fixture=1",
        "--observations",
        "output/guardrail-negative-fixtures/missing-browser-observations.json",
        "--output",
        "output/guardrail-negative-fixtures/bad-browser-compatibility-other-route-report.json",
        "--write",
      ],
      script: {
        path: "scripts/run_final_browser_compatibility.mjs",
        sha256: sha256File("scripts/run_final_browser_compatibility.mjs"),
      },
    },
    output: "output/guardrail-negative-fixtures/bad-browser-compatibility-other-route-report.json",
    app_url: "http://127.0.0.1:3025/practice?fixture=1",
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    final_browser_onnx_smoke: {
      path: "docs/validation/final-browser-onnx-smoke.json",
      sha256: "a".repeat(64),
    },
    observations_source: {
      path: "output/guardrail-negative-fixtures/missing-browser-observations.json",
      sha256: "d".repeat(64),
    },
    browsers: [],
    blockers: [],
  });
  const badBrowserCompatibilityWrongIdentity = writeJson("bad-browser-compatibility-wrong-identity-report.json", {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      command: [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        "http://127.0.0.1:3025",
        "--observations",
        "output/guardrail-negative-fixtures/missing-browser-observations.json",
        "--output",
        "output/guardrail-negative-fixtures/bad-browser-compatibility-wrong-identity-report.json",
        "--write",
      ],
      script: {
        path: "scripts/run_final_browser_compatibility.mjs",
        sha256: sha256File("scripts/run_final_browser_compatibility.mjs"),
      },
    },
    output: "output/guardrail-negative-fixtures/bad-browser-compatibility-wrong-identity-report.json",
    app_url: "http://127.0.0.1:3025",
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    final_browser_onnx_smoke: {
      path: "docs/validation/final-browser-onnx-smoke.json",
      sha256: "a".repeat(64),
    },
    observations_source: {
      path: "output/guardrail-negative-fixtures/missing-browser-observations.json",
      sha256: "d".repeat(64),
    },
    browsers: [
      {
        browser_id: "edge_desktop",
        browser_name: "Chrome",
        browser_version: "120.0.0.0",
        engine: "Gecko",
        status: "passed",
        tested_at: "2026-05-20T00:00:00.000Z",
        secure_origin: true,
        camera_access_checked: true,
        wasm_inference_checked: true,
        model_artifact_loaded: true,
        latency_ms: {
          warmup: 1,
          p50: 2,
          p95: 3,
          max: 4,
        },
        normal_practice_raw_media_uploads_observed: false,
        notes: "Fixture row intentionally labels an Edge target as a different browser and engine.",
        command: "npm --prefix web exec playwright test --project=chromium",
        verification_mode: "automated_playwright",
        operator_notes: "Fixture row intentionally has a mismatched browser identity.",
        evidence_files: [],
      },
    ],
    blockers: [],
  });
  const weakNetworkLog = writeJson("bad-browser-compatibility-weak-network-log.json", {
    schema_version: "asl-pilot-browser-compatibility-network-log/v1",
    browser_id: "chrome_desktop",
    app_url: "http://127.0.0.1:3025",
    captured_at: "2026-05-20T00:00:00.000Z",
    model_card_sha256: sha256File("web/public/model/model-card.json"),
    final_browser_onnx_smoke_sha256: "a".repeat(64),
    browser_artifact_path: "web/public/model/asl-pilot-rawframe-v0.onnx",
    browser_artifact_sha256: "b".repeat(64),
    normal_practice_raw_media_uploads_observed: false,
    raw_media_upload_requests: [],
    unexpected_external_requests: [],
    requests_summary: [
      {
        method: "GET",
        url_path: "/model/asl-pilot-rawframe-v0.onnx",
        status: 200,
        response_sha256: "b".repeat(64),
      },
    ],
  });
  const badBrowserCompatibilityWeakNetwork = writeJson("bad-browser-compatibility-weak-network-report.json", {
    schema_version: "asl-pilot-final-browser-compatibility/v1",
    status: "passed",
    tested_at: "2026-05-20T00:00:00.000Z",
    runner: {
      command: [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        "http://127.0.0.1:3025",
        "--observations",
        "output/guardrail-negative-fixtures/missing-browser-observations.json",
        "--output",
        "output/guardrail-negative-fixtures/bad-browser-compatibility-weak-network-report.json",
        "--write",
      ],
      script: {
        path: "scripts/run_final_browser_compatibility.mjs",
        sha256: sha256File("scripts/run_final_browser_compatibility.mjs"),
      },
    },
    output: "output/guardrail-negative-fixtures/bad-browser-compatibility-weak-network-report.json",
    app_url: "http://127.0.0.1:3025",
    model_card: {
      path: "web/public/model/model-card.json",
      sha256: sha256File("web/public/model/model-card.json"),
    },
    final_browser_onnx_smoke: {
      path: "docs/validation/final-browser-onnx-smoke.json",
      sha256: "a".repeat(64),
    },
    observations_source: {
      path: "output/guardrail-negative-fixtures/missing-browser-observations.json",
      sha256: "d".repeat(64),
    },
    browsers: [
      {
        browser_id: "chrome_desktop",
        browser_name: "Chrome",
        browser_version: "120.0.0.0",
        engine: "Chromium",
        status: "passed",
        tested_at: "2026-05-20T00:00:00.000Z",
        secure_origin: true,
        camera_access_checked: true,
        wasm_inference_checked: true,
        model_artifact_loaded: true,
        latency_ms: {
          warmup: 1,
          p50: 2,
          p95: 3,
          max: 4,
        },
        normal_practice_raw_media_uploads_observed: false,
        notes: "Fixture network log intentionally omits the ORT WASM request.",
        command: "npm --prefix web exec playwright test --project=chromium",
        verification_mode: "automated_playwright",
        operator_notes: "Fixture row intentionally has insufficient network evidence.",
        evidence_files: [
          {
            type: "network_log",
            path: weakNetworkLog,
            sha256: sha256File(weakNetworkLog),
            purpose: "Weak network log without ORT WASM request",
          },
          {
            type: "command_log",
            path: "output/guardrail-negative-fixtures/missing-browser-command-log.json",
            sha256: "e".repeat(64),
            purpose: "Missing command log for fixture",
          },
        ],
      },
    ],
    blockers: [],
  });
  const signedReceiptBase = {
    schema_version: "asl-pilot-signed-attestation-receipt/v1",
    status: "signed",
    attestation_id: "privacy_static_http_smoke",
    attestation_snapshot: privacyAttestationSnapshot,
    evidence_digest: externalAttestationDigest,
    signed_at: privacyAttestedAt,
    signed_by: {
      name: "Alex Reviewer",
      role: "Privacy reviewer",
      affiliation_or_context: "Independent privacy review",
      contact_or_signature_reference: "fixture-reviewer-signature",
      is_project_operator: false,
    },
    reviewed_evidence_files: externalAttestationEvidenceFiles.map((item) => ({
      path: item.path,
      sha256: item.sha256,
    })),
  };
  const tamperedReceipt = signReceipt(signedReceiptBase);
  tamperedReceipt.signed_by.name = "Mallory Reviewer";
  const tamperedSignedAttestationReceipt = writeJson(
    "forged-signed-attestation-receipt-tampered-after-signature.json",
    tamperedReceipt,
  );
  const tamperedExternalAttestation = writeJson("forged-external-attestation-tampered-after-signature.json", {
    schema_version: "asl-pilot-external-attestations/v1",
    status: "verified",
    generated_at: "2026-05-20T00:00:00.000Z",
    attestations: [
      {
        id: "privacy_static_http_smoke",
        status: "attested",
        statement: privacyAttestationStatement,
        attested_at: privacyAttestedAt,
        attested_by: privacyAttestedBy,
        evidence_files: externalAttestationEvidenceFiles,
        evidence_digest: externalAttestationDigest,
        signed_evidence_files: [
          {
            path: tamperedSignedAttestationReceipt,
            sha256: sha256File(tamperedSignedAttestationReceipt),
            purpose: "Receipt whose payload was tampered after a valid Ed25519 signature was created",
            signed_at: "2026-05-20T00:00:00.000Z",
          },
        ],
      },
    ],
  });
  const staleSnapshotSignedAttestationReceipt = writeJson(
    "forged-signed-attestation-receipt-stale-snapshot.json",
    signReceipt(signedReceiptBase),
  );
  const staleSnapshotExternalAttestation = writeJson("forged-external-attestation-stale-snapshot.json", {
    schema_version: "asl-pilot-external-attestations/v1",
    status: "verified",
    generated_at: "2026-05-20T00:00:00.000Z",
    attestations: [
      {
        id: "privacy_static_http_smoke",
        status: "attested",
        statement: "This altered statement was changed after the receipt was signed.",
        attested_at: privacyAttestedAt,
        attested_by: privacyAttestedBy,
        evidence_files: externalAttestationEvidenceFiles,
        evidence_digest: externalAttestationDigest,
        signed_evidence_files: [
          {
            path: staleSnapshotSignedAttestationReceipt,
            sha256: sha256File(staleSnapshotSignedAttestationReceipt),
            purpose: "Receipt whose attestation statement no longer matches its signed snapshot",
            signed_at: privacyAttestedAt,
          },
        ],
      },
    ],
  });
  const handAuthoredVocabularyReview = writeJson("bad-hand-authored-vocabulary-review.json", {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "reviewed",
    imported_at: "2026-05-20T00:00:00.000Z",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: {
      name: "Fixture Reviewer",
      role: fixtureAslReviewerRole,
      qualification: fixtureAslReviewerQualification,
      affiliation_or_context: "Fixture",
      contact_or_signed_evidence: "fixture@example.test",
      is_project_operator: false,
      reviewed_at: "2026-05-20T00:00:00.000Z",
    },
    item_count: vocabularyIds().length,
    approved_item_ids: vocabularyIds(),
  });
  const stalePacketReviewer = {
    name: "Fixture Reviewer",
    role: fixtureAslReviewerRole,
    qualification: fixtureAslReviewerQualification,
    affiliation_or_context: "Fixture",
    contact_or_signed_evidence: "fixture@example.test",
    is_project_operator: false,
    reviewed_at: "2026-05-20T00:00:00.000Z",
  };
  const staleReturnedPacket = writeJson("bad-stale-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: "0".repeat(64),
    },
    reviewer: stalePacketReviewer,
    items: vocabularyItems(),
  });
  const stalePacketVocabularyReview = writeJson("bad-stale-vocabulary-review-evidence.json", {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "reviewed",
    imported_at: "2026-05-20T00:00:00.000Z",
    generated_by: {
      tool: "scripts/import_vocabulary_review.mjs",
      command: ["node", "scripts/import_vocabulary_review.mjs", "--input", staleReturnedPacket],
      script: {
        path: "scripts/import_vocabulary_review.mjs",
        sha256: sha256File("scripts/import_vocabulary_review.mjs"),
      },
    },
    source_packet: {
      path: staleReturnedPacket,
      sha256: sha256File(staleReturnedPacket),
    },
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: stalePacketReviewer,
    item_count: vocabularyIds().length,
    approved_item_ids: vocabularyIds(),
  });
  const genericReviewerReturnedPacket = writeJson("bad-generic-reviewer-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: {
      name: "Fixture Reviewer",
      role: "Deaf educator or qualified ASL instructor",
      qualification: "Deaf educator or qualified ASL instructor",
      affiliation_or_context: "Fixture",
      contact_or_signed_evidence: "fixture@example.test",
      is_project_operator: false,
      reviewed_at: "2026-05-20T00:00:00.000Z",
    },
    items: vocabularyItems().map((item) => ({
      ...item,
      hintReview: {
        beginnerAppropriate: true,
        aslAppropriate: true,
        relatesToHintKind: true,
        avoidsUnmeasuredAttemptDiagnosis: true,
      },
    })),
  });
  const exampleReviewerReturnedPacket = writeJson("bad-example-reviewer-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: {
      name: "Reviewer Name",
      role: "Qualified ASL instructor",
      qualification: "Actual ASL qualification",
      affiliation_or_context: "School, program, or independent context",
      contact_or_signed_evidence: "contact or credential reference",
      is_project_operator: false,
      reviewed_at: "2026-01-01T00:00:00.000Z",
    },
    items: vocabularyItems().map((item) => ({
      ...item,
      hintReview: {
        beginnerAppropriate: true,
        aslAppropriate: true,
        relatesToHintKind: true,
        avoidsUnmeasuredAttemptDiagnosis: true,
      },
    })),
  });
  const futureReviewerReturnedPacket = writeJson("bad-future-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    created_at: "2026-05-20T00:00:00.000Z",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: {
      name: "Fixture Reviewer",
      role: fixtureAslReviewerRole,
      qualification: fixtureAslReviewerQualification,
      affiliation_or_context: "Fixture",
      contact_or_signed_evidence: "fixture@example.test",
      is_project_operator: false,
      reviewed_at: "2099-01-01T00:00:00.000Z",
    },
    items: vocabularyItems().map((item) => ({
      ...item,
      hintReview: {
        beginnerAppropriate: true,
        aslAppropriate: true,
        relatesToHintKind: true,
        avoidsUnmeasuredAttemptDiagnosis: true,
      },
    })),
  });
  const unsignedReceiptReviewer = {
    name: "Fixture Reviewer",
    role: fixtureAslReviewerRole,
    qualification: fixtureAslReviewerQualification,
    affiliation_or_context: "Fixture",
    contact_or_signed_evidence: "fixture@example.test",
    is_project_operator: false,
    reviewed_at: "2026-05-20T00:00:00.000Z",
  };
  const unsignedReceiptReturnedPacket = writeJson("bad-unsigned-receipt-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    created_at: "2026-05-20T00:00:00.000Z",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: unsignedReceiptReviewer,
    items: vocabularyItems().map((item) => ({
      ...item,
      hintReview: {
        beginnerAppropriate: true,
        aslAppropriate: true,
        relatesToHintKind: true,
        avoidsUnmeasuredAttemptDiagnosis: true,
      },
    })),
  });
  const unsignedVocabularyReviewerReceipt = writeJson("bad-unsigned-vocabulary-reviewer-receipt.json", {
    schema_version: "asl-pilot-vocabulary-reviewer-receipt/v1",
    status: "signed",
    reviewer: unsignedReceiptReviewer,
    signed_at: unsignedReceiptReviewer.reviewed_at,
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    review_packet: {
      path: unsignedReceiptReturnedPacket,
      sha256: sha256File(unsignedReceiptReturnedPacket),
    },
    approved_item_ids: vocabularyIds(),
    hint_review_fields: [
      "beginnerAppropriate",
      "aslAppropriate",
      "relatesToHintKind",
      "avoidsUnmeasuredAttemptDiagnosis",
    ],
  });
  const goodReceiptReviewer = {
    name: "Fixture Reviewer",
    role: fixtureAslReviewerRole,
    qualification: fixtureAslReviewerQualification,
    affiliation_or_context: "Fixture",
    contact_or_signed_evidence: "fixture@example.test",
    is_project_operator: false,
    reviewed_at: "2026-01-01T00:00:00.000Z",
  };
  const goodVocabularyReviewerReturnedPacket = writeJson("good-vocabulary-review-packet.json", {
    schema_version: "asl-pilot-vocabulary-review/v1",
    status: "reviewed",
    created_at: "2026-01-01T00:00:00.000Z",
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    reviewer: goodReceiptReviewer,
    items: vocabularyItems().map((item) => ({
      ...item,
      hintReview: {
        beginnerAppropriate: true,
        aslAppropriate: true,
        relatesToHintKind: true,
        avoidsUnmeasuredAttemptDiagnosis: true,
      },
    })),
  });
  const {
    privateKey: vocabularyReviewerPrivateKey,
    publicKey: vocabularyReviewerPublicKey,
  } = crypto.generateKeyPairSync("ed25519");
  const goodVocabularyReviewerPrivateKey = writeText(
    "good-vocabulary-reviewer-ed25519-private-key.pem",
    vocabularyReviewerPrivateKey.export({ type: "pkcs8", format: "pem" }),
  );
  const goodVocabularyReviewerPublicKey = writeText(
    "good-vocabulary-reviewer-ed25519-public-key.pem",
    vocabularyReviewerPublicKey.export({ type: "spki", format: "pem" }),
  );
  const { publicKey: rsaPublicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const badRsaVocabularyReviewerPublicKey = writeText(
    "bad-vocabulary-reviewer-rsa-public-key.pem",
    rsaPublicKey.export({ type: "spki", format: "pem" }),
  );
  const goodVocabularyReviewerReceipt = projectRelative(path.join(
    fixtureRoot,
    "good-vocabulary-reviewer-receipt.json",
  ));
  const incompleteVocabularyReviewerReceipt = projectRelative(path.join(
    fixtureRoot,
    "blocked-incomplete-vocabulary-reviewer-receipt.json",
  ));
  const vocabularyReviewerReceiptBase = {
    schema_version: "asl-pilot-vocabulary-reviewer-receipt/v1",
    status: "signed",
    reviewer: goodReceiptReviewer,
    signed_at: goodReceiptReviewer.reviewed_at,
    vocabulary_source: {
      path: "web/src/lib/vocabulary.ts",
      sha256: sha256File("web/src/lib/vocabulary.ts"),
    },
    review_packet: {
      path: goodVocabularyReviewerReturnedPacket,
      sha256: sha256File(goodVocabularyReviewerReturnedPacket),
    },
    approved_item_ids: vocabularyIds(),
    hint_review_fields: [
      "beginnerAppropriate",
      "aslAppropriate",
      "relatesToHintKind",
      "avoidsUnmeasuredAttemptDiagnosis",
    ],
  };
  const signedGoodVocabularyReviewerReceipt = signVocabularyReviewerReceipt(vocabularyReviewerReceiptBase);
  const goodSignedVocabularyReviewerReceipt = writeJson(
    "good-signed-vocabulary-reviewer-receipt.json",
    signedGoodVocabularyReviewerReceipt,
  );
  const goodAuthorityReviewer = {
    name: goodReceiptReviewer.name,
    role: goodReceiptReviewer.role,
    qualification: goodReceiptReviewer.qualification,
    affiliation_or_context: goodReceiptReviewer.affiliation_or_context,
    contact_or_signed_evidence: goodReceiptReviewer.contact_or_signed_evidence,
    is_project_operator: goodReceiptReviewer.is_project_operator,
  };
  const goodVocabularyReviewerCredentialEvidence = writeVocabularyReviewEvidenceText(
    "good-vocabulary-reviewer-credential-evidence.txt",
    "Fixture reviewer ASL instructor credential evidence.\n",
  );
  const goodVocabularyReviewerKeyBindingEvidence = writeVocabularyReviewEvidenceText(
    "good-vocabulary-reviewer-key-binding-evidence.txt",
    "Fixture evidence binding the Ed25519 public key to Fixture Reviewer.\n",
  );
  const goodVocabularyReviewerTrustedByEvidence = writeVocabularyReviewEvidenceText(
    "good-vocabulary-reviewer-trusted-by-evidence.txt",
    "Fixture operator attestation that reviewer identity and key binding were checked before review.\n",
  );
  const badVocabularyReviewerPrivateKeyEvidence = writeVocabularyReviewEvidenceText(
    "bad-vocabulary-reviewer-private-key-evidence.pem",
    vocabularyReviewerPrivateKey.export({ type: "pkcs8", format: "pem" }),
  );
  const badVocabularyReviewerDerPrivateKeyEvidence = writeVocabularyReviewEvidenceBytes(
    "bad-vocabulary-reviewer-private-key-evidence.der",
    vocabularyReviewerPrivateKey.export({ type: "pkcs8", format: "der" }),
  );
  const badVocabularyReviewerOutsideEvidence = writeText(
    "bad-vocabulary-reviewer-outside-evidence.txt",
    "Fixture reviewer evidence intentionally outside data/vocabulary-review/evidence/.\n",
  );
  const badVocabularyReviewerSymlinkEvidence = writeVocabularyReviewEvidenceSymlink(
    "bad-vocabulary-reviewer-symlink-evidence.txt",
    badVocabularyReviewerOutsideEvidence,
  );
  const badVocabularyReviewerEmptyEvidence = writeVocabularyReviewEvidenceText(
    "bad-vocabulary-reviewer-empty-evidence.txt",
    "",
  );
  const badVocabularyReviewerRequestMaterialSource = writeText(
    "bad-vocabulary-reviewer-request-material.md",
    "# ASL Pilot Reviewer Authority Request\n\nRequest material only; not reviewer authority evidence.\n",
  );
  const badVocabularyReviewerRequestMaterialEvidence = writeVocabularyReviewEvidenceText(
    "bad-vocabulary-reviewer-request-material.md",
    "# ASL Pilot Reviewer Authority Request\n\nRequest material only; not reviewer authority evidence.\n",
  );
  const symlinkAuthorityEvidenceTargetDir = path.join(fixtureRoot, "symlinked-vocabulary-reviewer-evidence-target");
  fs.mkdirSync(symlinkAuthorityEvidenceTargetDir, { recursive: true });
  fs.writeFileSync(
    path.join(symlinkAuthorityEvidenceTargetDir, "credential.txt"),
    "Fixture credential evidence reachable only through a symlinked evidence directory.\n",
    "utf8",
  );
  const badVocabularyReviewerSymlinkEvidenceDir = writeVocabularyReviewEvidenceSymlinkDirectory(
    "symlinked-vocabulary-reviewer-evidence-dir",
    projectRelative(symlinkAuthorityEvidenceTargetDir),
  );
  const badVocabularyReviewerAncestorSymlinkEvidence = projectRelative(path.join(
    root,
    badVocabularyReviewerSymlinkEvidenceDir,
    "credential.txt",
  ));
  const symlinkAuthorityOutputTargetDir = path.join(fixtureRoot, "symlinked-vocabulary-reviewer-output-target");
  fs.mkdirSync(symlinkAuthorityOutputTargetDir, { recursive: true });
  const badVocabularyReviewerSymlinkOutputDir = writeVocabularyReviewEvidenceSymlinkDirectory(
    "symlinked-vocabulary-reviewer-output-dir",
    projectRelative(symlinkAuthorityOutputTargetDir),
  );
  const goodCredentialEvidence = {
    summary: "Fixture ASL instructor credential evidence",
    files: [
      {
        path: goodVocabularyReviewerCredentialEvidence,
        sha256: sha256File(goodVocabularyReviewerCredentialEvidence),
        purpose: "Reviewer ASL qualification or credential evidence",
      },
    ],
  };
  const goodKeyBindingEvidence = {
    summary: "Fixture reviewer key binding evidence",
    files: [
      {
        path: goodVocabularyReviewerKeyBindingEvidence,
        sha256: sha256File(goodVocabularyReviewerKeyBindingEvidence),
        purpose: "Evidence that the Ed25519 public key belongs to this reviewer",
      },
    ],
  };
  const goodTrustedByEvidence = {
    summary: "Fixture operator attestation that reviewer identity and key binding were checked before review",
    files: [
      {
        path: goodVocabularyReviewerTrustedByEvidence,
        sha256: sha256File(goodVocabularyReviewerTrustedByEvidence),
        purpose: "Operator attestation that reviewer identity and key binding were checked before review",
      },
    ],
  };
  const goodVocabularyReviewerAuthorityRecord = {
    schema_version: "asl-pilot-reviewer-authority/v1",
    status: "trusted_reviewer_key",
    trusted_at: "2025-12-31T00:00:00.000Z",
    pre_review_key_binding_confirmed: true,
    reviewer: goodAuthorityReviewer,
    trusted_key: {
      algorithm: "ed25519",
      public_key_pem: signedGoodVocabularyReviewerReceipt.signature_evidence.public_key_pem,
      signer_key_fingerprint_sha256:
        signedGoodVocabularyReviewerReceipt.signature_evidence.signer_key_fingerprint_sha256,
    },
    credential_evidence: goodCredentialEvidence,
    key_binding_evidence: goodKeyBindingEvidence,
    trusted_by: {
      name: "Fixture Operator",
      role: "ASL Pilot operator",
      contact_or_signed_evidence: "fixture-operator@example.test",
      evidence: goodTrustedByEvidence,
    },
  };
  const goodVocabularyReviewerAuthority = writeJson(
    "good-vocabulary-reviewer-authority.json",
    goodVocabularyReviewerAuthorityRecord,
  );
  const goodVocabularyReviewerAuthorityIntakeRecord = {
    schema_version: "asl-pilot-reviewer-authority-intake/v1",
    trusted_at: "2025-12-31T00:00:00.000Z",
    public_key_file: goodVocabularyReviewerPublicKey,
    reviewer: {
      name: "Fixture Reviewer",
      role: fixtureAslReviewerRole,
      qualification: fixtureAslReviewerQualification,
      affiliation_or_context: "Fixture",
      contact_or_signed_evidence: "fixture@example.test",
    },
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence",
      files: [goodVocabularyReviewerCredentialEvidence],
    },
    key_binding_evidence: {
      summary: "Fixture reviewer key binding evidence",
      files: [goodVocabularyReviewerKeyBindingEvidence],
    },
    trusted_by: {
      name: "Fixture Operator",
      role: "ASL Pilot operator",
      contact_or_signed_evidence: "fixture-operator@example.test",
      evidence: {
        summary: "Fixture operator attestation that reviewer identity and key binding were checked before review",
        files: [goodVocabularyReviewerTrustedByEvidence],
      },
    },
    operator_verification: {
      reviewer_not_project_operator: true,
      ed25519_public_key_fingerprint_checked: true,
      credential_supports_asl_pedagogy_review: true,
      key_binding_checked_before_review: true,
      trusted_by_is_distinct_from_reviewer: true,
      evidence_files_are_real_and_non_empty: true,
      no_private_keys_included: true,
    },
  };
  const goodVocabularyReviewerAuthorityIntake = writeJson(
    "good-vocabulary-reviewer-authority-intake.json",
    goodVocabularyReviewerAuthorityIntakeRecord,
  );
  const badUncheckedVocabularyReviewerAuthorityIntake = writeJson("bad-unchecked-vocabulary-reviewer-authority-intake.json", {
    ...goodVocabularyReviewerAuthorityIntakeRecord,
    operator_verification: {
      ...goodVocabularyReviewerAuthorityIntakeRecord.operator_verification,
      reviewer_not_project_operator: false,
    },
  });
  const badExtraFieldVocabularyReviewerAuthorityIntake = writeJson("bad-extra-field-vocabulary-reviewer-authority-intake.json", {
    ...goodVocabularyReviewerAuthorityIntakeRecord,
    reviewer: {
      ...goodVocabularyReviewerAuthorityIntakeRecord.reviewer,
      is_project_operator: true,
    },
  });
  const badPlaceholderVocabularyReviewerAuthorityIntake = writeJson(
    "bad-placeholder-vocabulary-reviewer-authority-intake.json",
    {
      ...goodVocabularyReviewerAuthorityIntakeRecord,
      reviewer: {
        ...goodVocabularyReviewerAuthorityIntakeRecord.reviewer,
        name: "Reviewer Name",
      },
    },
  );
  const badExtraFieldVocabularyReviewerAuthority = writeJson("bad-extra-field-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    unsigned_extra_claim: "This field is intentionally outside the trusted reviewer authority schema.",
  });
  const badSelfTrustedVocabularyReviewerAuthority = writeJson("bad-self-trusted-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    trusted_by: {
      name: goodAuthorityReviewer.name,
      role: "Self-attested reviewer identity",
      contact_or_signed_evidence: goodAuthorityReviewer.contact_or_signed_evidence,
      evidence: goodTrustedByEvidence,
    },
  });
  const badDuplicateEvidenceVocabularyReviewerAuthority = writeJson("bad-duplicate-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    key_binding_evidence: {
      summary: "Fixture key-binding evidence reusing the credential file",
      files: [
        {
          path: goodVocabularyReviewerCredentialEvidence,
          sha256: sha256File(goodVocabularyReviewerCredentialEvidence),
          purpose: "Evidence that the Ed25519 public key belongs to this reviewer",
        },
      ],
    },
    trusted_by: {
      ...goodVocabularyReviewerAuthorityRecord.trusted_by,
      evidence: {
        summary: "Fixture trusted-by evidence reusing the credential file",
        files: [
          {
            path: goodVocabularyReviewerCredentialEvidence,
            sha256: sha256File(goodVocabularyReviewerCredentialEvidence),
            purpose: "Operator attestation that reviewer identity and key binding were checked before review",
          },
        ],
      },
    },
  });
  const badFreeTextOnlyVocabularyReviewerAuthority = writeJson("bad-free-text-only-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: "Plausible but unpinned reviewer credential evidence",
    key_binding_evidence: "Plausible but unpinned key-binding evidence",
  });
  const badFreeTextTrustedByVocabularyReviewerAuthority = writeJson("bad-free-text-trusted-by-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    trusted_by: {
      name: "Fixture Operator",
      role: "ASL Pilot operator",
      contact_or_signed_evidence: "fixture-operator@example.test",
      evidence: "Plausible but unpinned operator trust attestation",
    },
  });
  const badOutsideEvidenceRootVocabularyReviewerAuthority = writeJson("bad-outside-evidence-root-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence outside the required authority evidence root",
      files: [
        {
          path: badVocabularyReviewerOutsideEvidence,
          sha256: sha256File(badVocabularyReviewerOutsideEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badTraversalEvidenceRootVocabularyReviewerAuthority = writeJson("bad-traversal-evidence-root-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that attempts to traverse out of the authority evidence root",
      files: [
        {
          path: "data/vocabulary-review/evidence/../asl-pilot-vocabulary-review.json",
          sha256: sha256File("data/vocabulary-review/asl-pilot-vocabulary-review.json"),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badSymlinkEvidenceVocabularyReviewerAuthority = writeJson("bad-symlink-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that is only a symlink under the authority evidence root",
      files: [
        {
          path: badVocabularyReviewerSymlinkEvidence,
          sha256: sha256File(badVocabularyReviewerSymlinkEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badAncestorSymlinkEvidenceVocabularyReviewerAuthority = writeJson("bad-ancestor-symlink-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that is under a symlinked evidence directory",
      files: [
        {
          path: badVocabularyReviewerAncestorSymlinkEvidence,
          sha256: sha256File(badVocabularyReviewerAncestorSymlinkEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badEmptyEvidenceVocabularyReviewerAuthority = writeJson("bad-empty-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that is only an empty copied file",
      files: [
        {
          path: badVocabularyReviewerEmptyEvidence,
          sha256: sha256File(badVocabularyReviewerEmptyEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badPrivateKeyEvidenceVocabularyReviewerAuthority = writeJson("bad-private-key-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that accidentally contains private key material",
      files: [
        {
          path: badVocabularyReviewerPrivateKeyEvidence,
          sha256: sha256File(badVocabularyReviewerPrivateKeyEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badDerPrivateKeyEvidenceVocabularyReviewerAuthority = writeJson("bad-der-private-key-evidence-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture ASL instructor credential evidence that accidentally contains DER private key material",
      files: [
        {
          path: badVocabularyReviewerDerPrivateKeyEvidence,
          sha256: sha256File(badVocabularyReviewerDerPrivateKeyEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const badRequestMaterialVocabularyReviewerAuthority = writeJson("bad-request-material-vocabulary-reviewer-authority.json", {
    ...goodVocabularyReviewerAuthorityRecord,
    credential_evidence: {
      summary: "Fixture request material copied into reviewer evidence with plausible text",
      files: [
        {
          path: badVocabularyReviewerRequestMaterialEvidence,
          sha256: sha256File(badVocabularyReviewerRequestMaterialEvidence),
          purpose: "Reviewer ASL qualification or credential evidence",
        },
      ],
    },
  });
  const { publicKey: mismatchedAuthorityPublicKey } = crypto.generateKeyPairSync("ed25519");
  const badMismatchedVocabularyReviewerAuthority = writeJson("bad-mismatched-vocabulary-reviewer-authority.json", {
    schema_version: "asl-pilot-reviewer-authority/v1",
    status: "trusted_reviewer_key",
    trusted_at: "2025-12-31T00:00:00.000Z",
    pre_review_key_binding_confirmed: true,
    reviewer: goodAuthorityReviewer,
    trusted_key: {
      algorithm: "ed25519",
      public_key_pem: mismatchedAuthorityPublicKey.export({ type: "spki", format: "pem" }),
      signer_key_fingerprint_sha256: sha256Bytes(
        mismatchedAuthorityPublicKey.export({ type: "spki", format: "der" }),
      ),
    },
    credential_evidence: goodCredentialEvidence,
    key_binding_evidence: goodKeyBindingEvidence,
    trusted_by: {
      name: "Fixture Operator",
      role: "ASL Pilot operator",
      contact_or_signed_evidence: "fixture-operator@example.test",
      evidence: goodTrustedByEvidence,
    },
  });
  const tamperedVocabularyReviewerReceipt = signVocabularyReviewerReceipt(vocabularyReviewerReceiptBase);
  tamperedVocabularyReviewerReceipt.reviewer.name = "Mallory Reviewer";
  const badTamperedVocabularyReviewerReceipt = writeJson(
    "bad-tampered-vocabulary-reviewer-receipt.json",
    tamperedVocabularyReviewerReceipt,
  );
  const badWrongPacketHashVocabularyReviewerReceipt = writeJson(
    "bad-wrong-packet-hash-vocabulary-reviewer-receipt.json",
    signVocabularyReviewerReceipt({
      ...vocabularyReviewerReceiptBase,
      review_packet: {
        path: goodVocabularyReviewerReturnedPacket,
        sha256: "0".repeat(64),
      },
    }),
  );
  const badMismatchedSignedAtVocabularyReviewerReceipt = writeJson(
    "bad-mismatched-signed-at-vocabulary-reviewer-receipt.json",
    signVocabularyReviewerReceipt({
      ...vocabularyReviewerReceiptBase,
      signed_at: "2026-01-02T00:00:00.000Z",
    }),
  );
  const badDuplicateIdsVocabularyReviewerReceipt = writeJson(
    "bad-duplicate-ids-vocabulary-reviewer-receipt.json",
    signVocabularyReviewerReceipt({
      ...vocabularyReviewerReceiptBase,
      approved_item_ids: [...vocabularyIds(), "hello"],
    }),
  );
  const badExtraFieldVocabularyReviewerReceipt = writeJson(
    "bad-extra-field-vocabulary-reviewer-receipt.json",
    signVocabularyReviewerReceipt({
      ...vocabularyReviewerReceiptBase,
      unsigned_extra_claim: "This field is intentionally outside the signed canonical payload.",
    }),
  );
  const badSourceRegister = writeJson("bad-public-source-register.json", baseSourceRegister([
      {
        source_id: "new-public-fixture",
        display_name: "New public fixture",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: true,
        allowed_for_validation: true,
        allowed_for_pilot_submission: true,
        license_review_status: "approved",
        decision_id: "unsafe_public_fixture",
        primary_source_url: "https://example.test/new-public-fixture",
        review_required_before_allowing: true,
        source_evidence: [
          {
            evidence_type: "fixture",
            url: "https://example.test/new-public-fixture",
            checked_at: "2026-05-20T00:00:00.000Z",
            summary: "fixture",
            supports_decision: true,
          },
        ],
        restrictions: ["fixture"],
      },
    ]));
  const badSourceKindRegister = writeJson("bad-source-kind-register.json", baseSourceRegister([
      {
        source_id: "open-dataset-fixture",
        display_name: "Open dataset fixture",
        source_kind: "open_dataset",
        allowed_for_model_training: true,
        allowed_for_validation: true,
        allowed_for_pilot_submission: false,
        license_review_status: "approved",
        decision_id: "unsafe_open_dataset_fixture",
        review_required_before_allowing: true,
        source_evidence: [
          {
            evidence_type: "fixture",
            url: "https://example.test/open-dataset-fixture",
            checked_at: "2026-05-20T00:00:00.000Z",
            summary: "fixture",
            supports_decision: true,
          },
        ],
        restrictions: ["fixture"],
      },
    ]));
  const duplicateSourceRegister = writeJson("duplicate-source-register.json", baseSourceRegister([
      {
        source_id: "asl-citizen",
        display_name: "Duplicate ASL Citizen",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: false,
        allowed_for_validation: false,
        allowed_for_pilot_submission: false,
        license_review_status: "blocked_duplicate",
        decision_id: "blocked_duplicate_fixture",
        primary_source_url: "https://example.test/duplicate",
        review_required_before_allowing: true,
        source_evidence: [
          {
            evidence_type: "fixture",
            url: "https://example.test/duplicate",
            checked_at: "2026-05-20T00:00:00.000Z",
            summary: "fixture",
            supports_decision: true,
          },
        ],
        restrictions: ["fixture"],
      },
    ]));
  const forgedEvidenceRegister = writeJson("forged-external-review-register.json", baseSourceRegister([
      {
        source_id: "reviewed-public-fixture",
        display_name: "Reviewed public fixture",
        source_kind: "public_reference_dataset",
        allowed_for_model_training: true,
        allowed_for_validation: true,
        allowed_for_pilot_submission: false,
        license_review_status: "approved_for_this_pilot",
        decision_id: "reviewed_public_fixture",
        primary_source_url: "https://example.test/reviewed-public-fixture",
        review_required_before_allowing: true,
        source_evidence: [
          {
            evidence_type: "fixture",
            url: "https://example.test/reviewed-public-fixture",
            checked_at: "2026-05-20T00:00:00.000Z",
            summary: "fixture",
            supports_decision: true,
          },
        ],
        external_rights_review: {
          status: "approved_for_this_pilot",
          reviewed_at: "2026-05-20T00:00:00.000Z",
          reviewer_name: "Fixture Reviewer",
          reviewer_role: "External rights reviewer",
          is_project_operator: false,
          allowed_use_summary: "fixture",
          decision_scope: {
            allowed_for_model_training: true,
            allowed_for_validation: true,
            allowed_for_pilot_submission: false,
          },
          review_receipt: {
            path: "output/guardrail-negative-fixtures/missing-review-receipt.json",
            sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          license_evidence_files: [
            {
              path: "output/guardrail-negative-fixtures/missing-license-evidence.md",
              sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            },
          ],
        },
        restrictions: ["fixture"],
      },
    ]));

  return {
    goodArtifact,
    badComponents,
    badLoader,
    badLandmarks,
    badPretrainedCheckpoint,
    goodSignedConsentReceipt,
    badSignedConsentReceipt,
    symlinkSignedConsentReceipt,
    ancestorSymlinkSignedConsentReceipt,
    badTamperedSignedConsentReceipt,
    badExtraFieldSignedConsentReceipt,
    signerIdentityUnsignedConsent,
    signerIdentitySymlinkConsent,
    signerIdentityAncestorSymlinkConsent,
    signerIdentityFutureTimestamp,
    badCollectionReadinessAncestorSymlinkConsent,
    goodConsentHelperPrivateKey,
    goodConsentHelperOutput,
    goodSignerIdentityForConsentHelper,
    badConsentHelperOutput,
    incompleteSignerIdentityForConsentHelper,
    badLocalMlEnvironment,
    badBrowserOnnxWiringSmokeReport,
    badFinalBrowserOnnxDirectRunnerReport,
    badBrowserCompatibilityUnsignedReview,
    badBrowserCompatibilitySmokeRoute,
    badBrowserCompatibilityOtherRoute,
    badBrowserCompatibilityWrongIdentity,
    badBrowserCompatibilityWeakNetwork,
    forgedExternalAttestation,
    tamperedExternalAttestation,
    staleSnapshotExternalAttestation,
    handAuthoredVocabularyReview,
    stalePacketVocabularyReview,
    genericReviewerReturnedPacket,
    exampleReviewerReturnedPacket,
    futureReviewerReturnedPacket,
    unsignedReceiptReturnedPacket,
    unsignedVocabularyReviewerReceipt,
    goodVocabularyReviewerReturnedPacket,
    goodVocabularyReviewerPrivateKey,
    goodVocabularyReviewerPublicKey,
    badRsaVocabularyReviewerPublicKey,
    goodVocabularyReviewerCredentialEvidence,
    goodVocabularyReviewerKeyBindingEvidence,
    goodVocabularyReviewerTrustedByEvidence,
    badVocabularyReviewerPrivateKeyEvidence,
    badVocabularyReviewerDerPrivateKeyEvidence,
    badVocabularyReviewerSymlinkEvidence,
    badVocabularyReviewerEmptyEvidence,
    badVocabularyReviewerRequestMaterialSource,
    badVocabularyReviewerSymlinkOutputDir,
    goodVocabularyReviewerReceipt,
    goodSignedVocabularyReviewerReceipt,
    goodVocabularyReviewerAuthority,
    goodVocabularyReviewerAuthorityIntake,
    badUncheckedVocabularyReviewerAuthorityIntake,
    badExtraFieldVocabularyReviewerAuthorityIntake,
    badPlaceholderVocabularyReviewerAuthorityIntake,
    badExtraFieldVocabularyReviewerAuthority,
    badSelfTrustedVocabularyReviewerAuthority,
    badDuplicateEvidenceVocabularyReviewerAuthority,
    badFreeTextOnlyVocabularyReviewerAuthority,
    badFreeTextTrustedByVocabularyReviewerAuthority,
    badOutsideEvidenceRootVocabularyReviewerAuthority,
    badTraversalEvidenceRootVocabularyReviewerAuthority,
    badSymlinkEvidenceVocabularyReviewerAuthority,
    badAncestorSymlinkEvidenceVocabularyReviewerAuthority,
    badEmptyEvidenceVocabularyReviewerAuthority,
    badPrivateKeyEvidenceVocabularyReviewerAuthority,
    badDerPrivateKeyEvidenceVocabularyReviewerAuthority,
    badRequestMaterialVocabularyReviewerAuthority,
    badMismatchedVocabularyReviewerAuthority,
    incompleteVocabularyReviewerReceipt,
    badTamperedVocabularyReviewerReceipt,
    badWrongPacketHashVocabularyReviewerReceipt,
    badMismatchedSignedAtVocabularyReviewerReceipt,
    badDuplicateIdsVocabularyReviewerReceipt,
    badExtraFieldVocabularyReviewerReceipt,
    badSourceRegister,
    badSourceKindRegister,
    duplicateSourceRegister,
    forgedEvidenceRegister,
  };
}

function main() {
  const fixtures = buildFixtures();
  const checks = [];

  assertCase(
    checks,
    "good_artifact_passes",
    "A not-pretrained attestation and empty pretrained_components array are allowed",
    run("node", ["scripts/audit_no_pretrained_artifact_json.mjs", "--path", fixtures.goodArtifact]),
    { ok: true },
  );
  assertCase(
    checks,
    "nonempty_pretrained_components_fails",
    "Nonempty pretrained_components is rejected",
    run("node", ["scripts/audit_no_pretrained_artifact_json.mjs", "--path", fixtures.badComponents]),
    { ok: false, includes: ["pretrained_components"] },
  );
  assertCase(
    checks,
    "from_pretrained_loader_fails",
    "from_pretrained loader text is rejected",
    run("node", ["scripts/audit_no_pretrained_artifact_json.mjs", "--path", fixtures.badLoader]),
    { ok: false, includes: ["from_pretrained"] },
  );
  assertCase(
    checks,
    "landmark_artifact_fails",
    "Landmark artifact keys are rejected",
    run("node", ["scripts/audit_no_pretrained_artifact_json.mjs", "--path", fixtures.badLandmarks]),
    { ok: false, includes: ["landmark"] },
  );
  assertCase(
    checks,
    "pretrained_checkpoint_path_fails",
    "Pretrained checkpoint paths are rejected",
    run("node", ["scripts/audit_no_pretrained_artifact_json.mjs", "--path", fixtures.badPretrainedCheckpoint]),
    { ok: false, includes: ["pretrained"] },
  );
  assertCase(
    checks,
    "signed_consent_receipt_passes",
    "Final manifest validators accept a consent receipt with valid Ed25519 signature evidence",
    runSignedConsentReceiptProbe(fixtures.goodSignedConsentReceipt),
    { ok: true },
  );
  assertCase(
    checks,
    "unsigned_consent_receipt_fails",
    "Final manifest validators must reject consent receipts without Ed25519 signature evidence",
    runSignedConsentReceiptProbe(fixtures.badSignedConsentReceipt),
    { ok: false, includes: ["signature_evidence"] },
  );
  assertCase(
    checks,
    "symlink_signed_consent_receipt_fails",
    "Final manifest validators must reject symlinked signed consent receipt evidence",
    runSignedConsentReceiptProbe(fixtures.symlinkSignedConsentReceipt),
    { ok: false, includes: ["symbolic link"] },
  );
  assertCase(
    checks,
    "ancestor_symlink_signed_consent_receipt_fails",
    "Final manifest validators must reject signed consent receipt evidence below symlinked directories",
    runSignedConsentReceiptProbe(fixtures.ancestorSymlinkSignedConsentReceipt),
    { ok: false, includes: ["symbolic link path component"] },
  );
  assertCase(
    checks,
    "tampered_signed_consent_receipt_fails",
    "Final manifest validators must reject consent receipts changed after signing",
    runSignedConsentReceiptProbe(fixtures.badTamperedSignedConsentReceipt),
    { ok: false, includes: ["signed_payload_sha256"] },
  );
  assertCase(
    checks,
    "extra_field_signed_consent_receipt_fails",
    "Final manifest validators must reject unsigned top-level consent receipt fields",
    runSignedConsentReceiptProbe(fixtures.badExtraFieldSignedConsentReceipt),
    { ok: false, includes: ["unexpected unsigned field"] },
  );
  assertCase(
    checks,
    "signer_identity_unsigned_consent_receipt_fails",
    "Signer identity import must reject unsigned consent receipts before final manifests exist",
    run("node", ["scripts/import_signer_identity_evidence.mjs", "--input", fixtures.signerIdentityUnsignedConsent]),
    { ok: false, includes: ["signature_evidence"] },
  );
  assertCase(
    checks,
    "signer_identity_symlink_consent_receipt_fails",
    "Signer identity import must reject symlinked signed consent receipt evidence",
    run("node", ["scripts/import_signer_identity_evidence.mjs", "--input", fixtures.signerIdentitySymlinkConsent]),
    { ok: false, includes: ["symbolic link"] },
  );
  assertCase(
    checks,
    "signer_identity_ancestor_symlink_consent_receipt_fails",
    "Signer identity import must reject signed consent receipt evidence below symlinked directories",
    run("node", ["scripts/import_signer_identity_evidence.mjs", "--input", fixtures.signerIdentityAncestorSymlinkConsent]),
    { ok: false, includes: ["symbolic link path component"] },
  );
  assertCase(
    checks,
    "signer_identity_future_timestamp_fails",
    "Signer identity import must reject future packet and signer verification timestamps",
    run("node", ["scripts/import_signer_identity_evidence.mjs", "--input", fixtures.signerIdentityFutureTimestamp]),
    { ok: false, includes: ["must not be in the future"] },
  );
  assertCase(
    checks,
    "dataset_collection_readiness_ancestor_symlink_consent_receipt_fails",
    "Dataset collection readiness must reject signed consent receipt evidence below symlinked directories before manifest export",
    runDatasetCollectionReadinessProbe(fixtures.badCollectionReadinessAncestorSymlinkConsent),
    { ok: false, includes: ["symbolic link path component"] },
  );
  assertCase(
    checks,
    "signed_consent_receipt_helper_signs_and_updates_packet",
    "Signed consent receipt helper signs, verifies, and hash-pins the receipt back into the private signer packet",
    run("node", [
      "scripts/draft_signed_consent_receipt.mjs",
      "--input",
      fixtures.goodSignerIdentityForConsentHelper,
      "--signer-alias",
      "signer-001",
      "--output",
      fixtures.goodConsentHelperOutput,
      "--signed-at",
      "2024-01-01T00:00:00.000Z",
      "--signed-by-name",
      "Signer One",
      "--signed-by-role",
      "Signer",
      "--affiliation-or-context",
      "Fixture signer",
      "--contact-or-signature-reference",
      "fixture-signer-signature",
      "--private-key",
      fixtures.goodConsentHelperPrivateKey,
      "--write",
      "--verify",
      "--update-packet",
    ]),
    { ok: true, includes: ["signed_verified", "updated_packet"] },
  );
  assertCase(
    checks,
    "signed_consent_receipt_helper_refuses_incomplete_packet",
    "Signed consent receipt helper refuses to sign incomplete signer identity packets",
    run("node", [
      "scripts/draft_signed_consent_receipt.mjs",
      "--input",
      fixtures.incompleteSignerIdentityForConsentHelper,
      "--signer-alias",
      "signer-001",
      "--output",
      fixtures.badConsentHelperOutput,
      "--signed-at",
      "2024-01-01T00:00:00.000Z",
      "--signed-by-name",
      "Signer One",
      "--signed-by-role",
      "Signer",
      "--affiliation-or-context",
      "Fixture signer",
      "--contact-or-signature-reference",
      "fixture-signer-signature",
      "--private-key",
      fixtures.goodConsentHelperPrivateKey,
      "--write",
      "--verify",
    ]),
    { ok: false, includes: ["Refusing to sign an incomplete signed consent receipt", "consent_record_ids"] },
  );
  assertCase(
    checks,
    "stale_local_ml_environment_receipt_fails",
    "Final ML/GPU evidence must reject stale or failed retained environment receipts",
    runLocalMlEnvironmentReceiptAudit(fixtures.badLocalMlEnvironment),
    { ok: false, includes: ["status must be passed", "hardware resource", "stale"] },
  );
  assertCase(
    checks,
    "nvidia_access_receipt_template_fails",
    "NVIDIA post-access metadata audit must reject the retained template as accepted access evidence",
    runNvidiaAccessReceiptTemplateProbe(),
    {
      ok: false,
      includes: [
        "status must be accepted_access_retained",
        "accepted_license_terms",
        "evidence_attachments",
      ],
    },
  );
  assertCase(
    checks,
    "browser_onnx_wiring_smoke_final_claim_fails",
    "Smoke-only browser ONNX wiring reports cannot claim final evidence",
    run("node", ["scripts/audit_browser_onnx_wiring_smoke.mjs", "--report", fixtures.badBrowserOnnxWiringSmokeReport]),
    { ok: false, includes: ["evidence_mode", "finality"] },
  );
  assertCase(
    checks,
    "final_browser_onnx_direct_runner_fails",
    "Final browser ONNX reports must prove the app client-model route, not direct runner-owned ORT inference",
    run("node", ["scripts/audit_final_browser_onnx_smoke.mjs", "--report", fixtures.badFinalBrowserOnnxDirectRunnerReport]),
    { ok: false, includes: ["inference.client_model_path", "inference.app_route", "inference.app_wasm_route"] },
  );
  assertCase(
    checks,
    "manual_browser_review_unsigned_receipt_fails",
    "Manual browser compatibility reviews must include machine-verifiable Ed25519 signature evidence",
    run("node", ["scripts/audit_final_browser_compatibility.mjs", "--report", fixtures.badBrowserCompatibilityUnsignedReview]),
    { ok: false, includes: ["signature_evidence"] },
  );
  assertCase(
    checks,
    "browser_compatibility_smoke_route_app_url_fails",
    "Final browser compatibility must target the real practice app root, not the hidden ONNX smoke route",
    run("node", ["scripts/audit_final_browser_compatibility.mjs", "--report", fixtures.badBrowserCompatibilitySmokeRoute]),
    { ok: false, includes: ["app_url must target the real practice app root"] },
  );
  assertCase(
    checks,
    "browser_compatibility_non_root_app_url_fails",
    "Final browser compatibility must target the root practice route, not another app route",
    run("node", ["scripts/audit_final_browser_compatibility.mjs", "--report", fixtures.badBrowserCompatibilityOtherRoute]),
    { ok: false, includes: ["with no alternate route, query, or hash"] },
  );
  assertCase(
    checks,
    "browser_compatibility_wrong_identity_fails",
    "Final browser compatibility rows must bind browser identity to the declared target",
    run("node", ["scripts/audit_final_browser_compatibility.mjs", "--report", fixtures.badBrowserCompatibilityWrongIdentity]),
    { ok: false, includes: ["browser_name must identify edge_desktop", "engine must match the expected engine"] },
  );
  assertCase(
    checks,
    "browser_compatibility_weak_network_log_fails",
    "Final browser compatibility network logs must include ORT WASM fetch evidence",
    run("node", ["scripts/audit_final_browser_compatibility.mjs", "--report", fixtures.badBrowserCompatibilityWeakNetwork]),
    { ok: false, includes: ["requests_summary must include at least one GET /api/ort/*.wasm response"] },
  );
  assertCase(
    checks,
    "forged_external_attestation_receipt_fails",
    "External attestation receipts must include machine-verifiable signature evidence",
    run("node", ["scripts/audit_external_attestations.mjs", "--allow-noncanonical", "--evidence", fixtures.forgedExternalAttestation]),
    { ok: false, includes: ["signature_evidence"] },
  );
  assertCase(
    checks,
    "tampered_external_attestation_receipt_fails",
    "External attestation signatures must fail if the receipt payload is changed after signing",
    run("node", ["scripts/audit_external_attestations.mjs", "--allow-noncanonical", "--evidence", fixtures.tamperedExternalAttestation]),
    { ok: false, includes: ["signed_payload_sha256", "signature verification failed"] },
  );
  assertCase(
    checks,
    "stale_external_attestation_snapshot_fails",
    "External attestation receipts must sign the current statement, attester, timestamp, and evidence snapshot",
    run("node", ["scripts/audit_external_attestations.mjs", "--allow-noncanonical", "--evidence", fixtures.staleSnapshotExternalAttestation]),
    { ok: false, includes: ["attestation_snapshot"] },
  );
  assertCase(
    checks,
    "hand_authored_vocabulary_review_fails",
    "Final vocabulary review evidence must include importer and source-packet receipts",
    run("node", ["scripts/audit_vocabulary_review.mjs", "--evidence", fixtures.handAuthoredVocabularyReview]),
    { ok: false, includes: ["generated_by", "source_packet"] },
  );
  assertCase(
    checks,
    "stale_vocabulary_review_packet_fails",
    "Returned vocabulary review packet must be bound to the current vocabulary source hash",
    run("node", ["scripts/audit_vocabulary_review.mjs", "--evidence", fixtures.stalePacketVocabularyReview]),
    { ok: false, includes: ["source_packet vocabulary_source.sha256"] },
  );
  assertCase(
    checks,
    "generic_vocabulary_reviewer_prompt_fails",
    "Vocabulary reviewer qualification must be an actual credential, not the generic prompt text",
    run("node", ["scripts/report_vocabulary_review_status.mjs", "--input", fixtures.genericReviewerReturnedPacket]),
    { ok: true, includes: ["generic prompt text"] },
  );
  assertCase(
    checks,
    "example_vocabulary_reviewer_prompt_fails",
    "Copied reviewer example text must surface as non-placeholder-string blockers in the read-only status report",
    run("node", ["scripts/report_vocabulary_review_status.mjs", "--input", fixtures.exampleReviewerReturnedPacket]),
    { ok: true, includes: ["reviewer.name must be a non-placeholder string", "reviewer.qualification must be a non-placeholder string"] },
  );
  assertCase(
    checks,
    "future_vocabulary_review_timestamp_fails",
    "Returned vocabulary review packets cannot use future reviewer timestamps",
    run("node", ["scripts/report_vocabulary_review_status.mjs", "--input", fixtures.futureReviewerReturnedPacket]),
    { ok: true, includes: ["reviewer.reviewed_at must not be in the future"] },
  );
  assertCase(
    checks,
    "unsigned_vocabulary_reviewer_receipt_fails",
    "Completed vocabulary review packets must include machine-verifiable Ed25519 reviewer receipt evidence",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.unsignedReceiptReturnedPacket,
      "--reviewer-receipt",
      fixtures.unsignedVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["signature_evidence"] },
  );
  assertCase(
    checks,
    "valid_vocabulary_reviewer_receipt_helper_passes",
    "Vocabulary reviewer receipt helper signs and verifies a completed returned packet",
    run("node", [
      "scripts/draft_vocabulary_reviewer_receipt.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--output",
      fixtures.goodVocabularyReviewerReceipt,
      "--private-key",
      fixtures.goodVocabularyReviewerPrivateKey,
      "--write",
      "--verify",
    ]),
    { ok: true, includes: ["signed_verified"] },
  );
  assertCase(
    checks,
    "valid_vocabulary_reviewer_authority_passes",
    "Reviewer authority must accept a trusted key record matching the signed reviewer receipt",
    runVocabularyReviewerAuthorityProbe(
      fixtures.goodVocabularyReviewerReturnedPacket,
      fixtures.goodSignedVocabularyReviewerReceipt,
      fixtures.goodVocabularyReviewerAuthority,
    ),
    { ok: true },
  );
  assertCase(
    checks,
    "ed25519_public_key_fingerprint_helper_passes",
    "Ed25519 public key helper computes the trusted-key fingerprint fields used by reviewer authority records",
    run("node", [
      "scripts/compute_ed25519_public_key_fingerprint.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--format",
      "trusted-key",
    ]),
    { ok: true, includes: ["signer_key_fingerprint_sha256", "ed25519"] },
  );
  assertCase(
    checks,
    "ed25519_public_key_fingerprint_helper_rejects_rsa",
    "Reviewer authority key fingerprint helper must reject non-Ed25519 public keys",
    run("node", [
      "scripts/compute_ed25519_public_key_fingerprint.mjs",
      "--public-key",
      fixtures.badRsaVocabularyReviewerPublicKey,
    ]),
    { ok: false, includes: ["Ed25519 public key"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_candidate_passes",
    "Reviewer authority preparation helper builds and validates a candidate from real identity and key evidence",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--trusted-at",
      "2025-12-31T00:00:00.000Z",
      "--reviewer-name",
      "Fixture Reviewer",
      "--reviewer-role",
      fixtureAslReviewerRole,
      "--reviewer-qualification",
      fixtureAslReviewerQualification,
      "--reviewer-affiliation-or-context",
      "Fixture",
      "--reviewer-contact-or-signed-evidence",
      "fixture@example.test",
      "--credential-evidence",
      "Fixture ASL instructor credential evidence",
      "--credential-evidence-file",
      fixtures.goodVocabularyReviewerCredentialEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Fixture Operator",
      "--trusted-by-role",
      "ASL Pilot operator",
      "--trusted-by-contact-or-signed-evidence",
      "fixture-operator@example.test",
    ]),
    { ok: true, includes: ["ready_for_pre_review"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_from_intake_passes",
    "Structured reviewer authority intake helper stages evidence and validates a candidate through the existing authority helper",
    runPrepareReviewerAuthorityFromIntakeProbe(fixtures),
    { ok: true, includes: ["asl-pilot-reviewer-authority-intake-result/v1", "ready_for_pre_review"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_from_intake_requires_operator_checks",
    "Structured reviewer authority intake helper must fail unless operator verification flags are explicitly true",
    runPrepareReviewerAuthorityFromIntakeProbe(fixtures, fixtures.badUncheckedVocabularyReviewerAuthorityIntake),
    { ok: false, includes: ["operator_verification.reviewer_not_project_operator", "must be true"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_from_intake_rejects_unexpected_fields",
    "Structured reviewer authority intake helper must reject ignored-looking extra fields",
    runPrepareReviewerAuthorityFromIntakeProbe(fixtures, fixtures.badExtraFieldVocabularyReviewerAuthorityIntake),
    { ok: false, includes: ["intake.reviewer contains unexpected field", "is_project_operator"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_from_intake_rolls_back_staged_evidence_on_validation_failure",
    "Structured reviewer authority intake helper must remove staged evidence when downstream authority validation fails",
    runPrepareReviewerAuthorityFromIntakeRollbackProbe(fixtures),
    { ok: true, includes: ["failed_as_expected", "\"staged_file_count\":0"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_rejects_private_key_input",
    "Reviewer authority preparation must not accept reviewer private keys on the operator-facing authority intake path",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--private-key",
      fixtures.goodVocabularyReviewerPrivateKey,
      "--reviewer-name",
      "Fixture Reviewer",
      "--reviewer-role",
      fixtureAslReviewerRole,
      "--reviewer-qualification",
      fixtureAslReviewerQualification,
      "--reviewer-affiliation-or-context",
      "Fixture",
      "--reviewer-contact-or-signed-evidence",
      "fixture@example.test",
      "--credential-evidence",
      "Fixture ASL instructor credential evidence",
      "--credential-evidence-file",
      fixtures.goodVocabularyReviewerCredentialEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Fixture Operator",
      "--trusted-by-role",
      "ASL Pilot operator",
      "--trusted-by-contact-or-signed-evidence",
      "fixture-operator@example.test",
    ]),
    { ok: false, includes: ["Unknown argument: --private-key"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_candidate_rejects_placeholder_evidence",
    "Reviewer authority preparation helper must reject placeholder credential evidence before canonical staging",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--trusted-at",
      "2025-12-31T00:00:00.000Z",
      "--reviewer-name",
      "Fixture Reviewer",
      "--reviewer-role",
      fixtureAslReviewerRole,
      "--reviewer-qualification",
      fixtureAslReviewerQualification,
      "--reviewer-affiliation-or-context",
      "Fixture",
      "--reviewer-contact-or-signed-evidence",
      "fixture@example.test",
      "--credential-evidence",
      "placeholder",
      "--credential-evidence-file",
      fixtures.goodVocabularyReviewerCredentialEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Fixture Operator",
      "--trusted-by-role",
      "ASL Pilot operator",
      "--trusted-by-contact-or-signed-evidence",
      "fixture-operator@example.test",
    ]),
    { ok: false, includes: ["credential_evidence"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_candidate_rejects_example_identity",
    "Reviewer authority preparation helper must reject generated example identity text before canonical staging",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--trusted-at",
      "2025-12-31T00:00:00.000Z",
      "--reviewer-name",
      "Reviewer Name",
      "--reviewer-role",
      "Qualified ASL instructor",
      "--reviewer-qualification",
      "Actual ASL qualification",
      "--reviewer-affiliation-or-context",
      "School, program, or independent context",
      "--reviewer-contact-or-signed-evidence",
      "contact or credential reference",
      "--credential-evidence",
      "Fixture ASL instructor credential evidence",
      "--credential-evidence-file",
      fixtures.goodVocabularyReviewerCredentialEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Operator Name",
      "--trusted-by-role",
      "Operator role",
      "--trusted-by-contact-or-signed-evidence",
      "operator contact or signature reference",
    ]),
    { ok: false, includes: ["reviewer.name", "reviewer.qualification", "trusted_by.name"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_candidate_rejects_private_key_evidence",
    "Reviewer authority preparation helper must reject evidence files containing private key material",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--trusted-at",
      "2025-12-31T00:00:00.000Z",
      "--reviewer-name",
      "Fixture Reviewer",
      "--reviewer-role",
      fixtureAslReviewerRole,
      "--reviewer-qualification",
      fixtureAslReviewerQualification,
      "--reviewer-affiliation-or-context",
      "Fixture",
      "--reviewer-contact-or-signed-evidence",
      "fixture@example.test",
      "--credential-evidence",
      "Fixture ASL instructor credential evidence",
      "--credential-evidence-file",
      fixtures.badVocabularyReviewerPrivateKeyEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Fixture Operator",
      "--trusted-by-role",
      "ASL Pilot operator",
      "--trusted-by-contact-or-signed-evidence",
      "fixture-operator@example.test",
    ]),
    { ok: false, includes: ["private key"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_candidate_rejects_empty_evidence",
    "Reviewer authority preparation helper must reject empty copied evidence files",
    run("node", [
      "scripts/prepare_vocabulary_reviewer_authority.mjs",
      "--public-key",
      fixtures.goodVocabularyReviewerPublicKey,
      "--trusted-at",
      "2025-12-31T00:00:00.000Z",
      "--reviewer-name",
      "Fixture Reviewer",
      "--reviewer-role",
      fixtureAslReviewerRole,
      "--reviewer-qualification",
      fixtureAslReviewerQualification,
      "--reviewer-affiliation-or-context",
      "Fixture",
      "--reviewer-contact-or-signed-evidence",
      "fixture@example.test",
      "--credential-evidence",
      "Fixture ASL instructor credential evidence",
      "--credential-evidence-file",
      fixtures.badVocabularyReviewerEmptyEvidence,
      "--key-binding-evidence",
      "Fixture reviewer key binding evidence",
      "--key-binding-evidence-file",
      fixtures.goodVocabularyReviewerKeyBindingEvidence,
      "--trusted-by-evidence",
      "Fixture operator attestation that reviewer identity and key binding were checked before review",
      "--trusted-by-evidence-file",
      fixtures.goodVocabularyReviewerTrustedByEvidence,
      "--trusted-by-name",
      "Fixture Operator",
      "--trusted-by-role",
      "ASL Pilot operator",
      "--trusted-by-contact-or-signed-evidence",
      "fixture-operator@example.test",
    ]),
    { ok: false, includes: ["empty evidence file"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_invalid_write_preserves_existing_output",
    "Reviewer authority preparation helper must not overwrite an existing output with invalid authority JSON",
    runInvalidReviewerAuthorityWritePreservesExistingOutputProbe(fixtures),
    { ok: true, includes: ["failed_as_expected", "\"preserved\":true"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_passes",
    "Reviewer authority evidence staging helper copies real evidence files into the ignored evidence root",
    runStageReviewerAuthorityEvidenceProbe(fixtures),
    {
      ok: true,
      includes: [
        "asl-pilot-reviewer-authority-evidence-staging/v1",
        "credential-good-vocabulary-reviewer-credential-evidence.txt",
        "creates_reviewer_authority\": false",
      ],
    },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_rejects_symlink",
    "Reviewer authority evidence staging helper must reject symlink source files",
    runStageReviewerAuthorityEvidenceSymlinkProbe(fixtures),
    { ok: false, includes: ["not a symbolic link"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_rejects_private_key",
    "Reviewer authority evidence staging helper must reject accidental private key material",
    runStageReviewerAuthorityEvidencePrivateKeyProbe(fixtures),
    { ok: false, includes: ["private key"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_rejects_der_private_key",
    "Reviewer authority evidence staging helper must reject standalone DER private key files",
    runStageReviewerAuthorityEvidenceDerPrivateKeyProbe(fixtures),
    { ok: false, includes: ["private key"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_rejects_empty_file",
    "Reviewer authority evidence staging helper must reject empty source files",
    runStageReviewerAuthorityEvidenceEmptyFileProbe(fixtures),
    { ok: false, includes: ["empty evidence file"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_rejects_request_material",
    "Reviewer authority evidence staging helper must reject generated request/template material before it is copied as evidence",
    runStageReviewerAuthorityEvidenceRequestMaterialProbe(fixtures),
    { ok: false, includes: ["request/template material"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_refuses_output_outside_root",
    "Reviewer authority evidence staging helper must refuse output outside the ignored evidence root",
    runStageReviewerAuthorityEvidenceOutputRefusalProbe(fixtures),
    { ok: false, includes: ["--output-dir must be data/vocabulary-review/evidence"] },
  );
  assertCase(
    checks,
    "stage_vocabulary_reviewer_authority_evidence_refuses_symlink_output_dir",
    "Reviewer authority evidence staging helper must refuse symlinked output directories under the ignored evidence root",
    runStageReviewerAuthorityEvidenceOutputSymlinkProbe(fixtures),
    { ok: false, includes: ["symbolic link path component"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_rejects_private_key_as_public_key",
    "Reviewer authority preparation must reject private key material passed through --public-key",
    runPrepareReviewerAuthorityPublicKeyPrivateKeyProbe(fixtures),
    { ok: false, includes: ["--public-key must be a public key file", "private key material"] },
  );
  assertCase(
    checks,
    "compute_ed25519_public_key_fingerprint_rejects_private_key_as_public_key",
    "Public-key fingerprint helper must reject private key material passed through --public-key",
    runComputePublicKeyPrivateKeyProbe(fixtures),
    { ok: false, includes: ["--public-key must be a public key file", "private key material"] },
  );
  assertCase(
    checks,
    "prepare_vocabulary_reviewer_authority_rejects_duplicate_evidence_files",
    "Reviewer authority preparation must reject one evidence file reused across credential/key/trust categories",
    runPrepareReviewerAuthorityDuplicateEvidenceProbe(fixtures),
    { ok: false, includes: ["evidence file path is reused", "evidence file sha256 is reused"] },
  );
  assertCase(
    checks,
    "pre_review_vocabulary_reviewer_authority_passes_shape_check",
    "Pre-review reviewer authority must accept a real reviewer identity, non-placeholder evidence, and Ed25519 trusted key",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.goodVocabularyReviewerAuthority),
    { ok: true },
  );
  assertCase(
    checks,
    "extra_field_vocabulary_reviewer_authority_fails",
    "Reviewer authority records cannot carry extra top-level fields outside the validated schema",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badExtraFieldVocabularyReviewerAuthority),
    { ok: false, includes: ["unexpected field"] },
  );
  assertCase(
    checks,
    "self_trusted_vocabulary_reviewer_authority_fails",
    "Reviewer authority records must not let the reviewer self-attest identity or key binding",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badSelfTrustedVocabularyReviewerAuthority),
    { ok: false, includes: ["trusted_by.name must identify a person distinct", "trusted_by.contact_or_signed_evidence must be distinct"] },
  );
  assertCase(
    checks,
    "duplicate_evidence_vocabulary_reviewer_authority_fails",
    "Reviewer authority records must not reuse one evidence file across credential, key-binding, and trust categories",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badDuplicateEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["evidence file path is reused", "evidence file sha256 is reused"] },
  );
  assertCase(
    checks,
    "free_text_only_vocabulary_reviewer_authority_fails",
    "Reviewer authority records must hash-pin credential and key-binding evidence files, not only plausible free text",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badFreeTextOnlyVocabularyReviewerAuthority),
    { ok: false, includes: ["hash-pinned evidence object"] },
  );
  assertCase(
    checks,
    "free_text_trusted_by_vocabulary_reviewer_authority_fails",
    "Reviewer authority trusted_by records must hash-pin operator trust-attestation evidence, not only plausible free text",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badFreeTextTrustedByVocabularyReviewerAuthority),
    { ok: false, includes: ["trusted_by.evidence"] },
  );
  assertCase(
    checks,
    "outside_root_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence files must live under the ignored vocabulary-review evidence root",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badOutsideEvidenceRootVocabularyReviewerAuthority),
    { ok: false, includes: ["must be under data/vocabulary-review/evidence/"] },
  );
  assertCase(
    checks,
    "traversal_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence path checks must use normalized project paths before accepting the evidence root",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badTraversalEvidenceRootVocabularyReviewerAuthority),
    { ok: false, includes: ["must be under data/vocabulary-review/evidence/"] },
  );
  assertCase(
    checks,
    "symlink_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence files must be copied files, not symlinks that can point outside the evidence root",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badSymlinkEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["must not be a symbolic link"] },
  );
  assertCase(
    checks,
    "ancestor_symlink_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence paths must not sit below symlinked evidence directories",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badAncestorSymlinkEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["symbolic link path component"] },
  );
  assertCase(
    checks,
    "empty_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence files must not be empty placeholders",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badEmptyEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["empty evidence file"] },
  );
  assertCase(
    checks,
    "private_key_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence files must not contain private key material",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badPrivateKeyEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["private key material"] },
  );
  assertCase(
    checks,
    "der_private_key_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority evidence files must not be standalone DER private keys",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badDerPrivateKeyEvidenceVocabularyReviewerAuthority),
    { ok: false, includes: ["private key material"] },
  );
  assertCase(
    checks,
    "request_material_vocabulary_reviewer_authority_evidence_fails",
    "Reviewer authority validation must reject copied reviewer request/template material even when it is hash-pinned",
    runPreReviewVocabularyReviewerAuthorityProbe(fixtures.badRequestMaterialVocabularyReviewerAuthority),
    { ok: false, includes: ["request/template material"] },
  );
  assertCase(
    checks,
    "missing_pre_review_vocabulary_reviewer_authority_fails_closed",
    "Vocabulary review bundle is not send-ready when source-curated evidence already exists or reviewer authority is missing",
    runMissingPreReviewVocabularyReviewerAuthorityProbe(),
    { ok: true, includes: ["already_reviewed", "draft_missing_reviewer_authority"] },
  );
  assertCase(
    checks,
    "draft_review_request_warns_not_send_ready",
    "Draft vocabulary review request must warn operators not to send before reviewer authority is valid",
    runMissingPreReviewVocabularyReviewerAuthorityProbe(),
    { ok: true, includes: ["request_warned\":true"] },
  );
  assertCase(
    checks,
    "reviewer_authority_request_refuses_project_root_output",
    "Reviewer authority request generation must refuse broad output paths before recursive cleanup",
    runReviewerAuthorityRequestOutputRefusalProbe(),
    { ok: false, includes: ["--output must be output/review-handoff/reviewer-authority-request"] },
  );
  assertCase(
    checks,
    "reviewer_authority_status_tolerates_dangling_evidence_symlink",
    "Reviewer authority status report must not crash on transient or dangling ignored evidence-root entries",
    runReviewerAuthorityStatusDanglingSymlinkProbe(),
    { ok: true, includes: ["\"blocked_status\":\"blocked\"", "dangling-reviewer-evidence.txt"] },
  );
  assertCase(
    checks,
    "vocabulary_review_bundle_refuses_project_root_output",
    "Vocabulary review bundle generation must refuse broad output paths before recursive cleanup",
    runVocabularyReviewBundleOutputRefusalProbe(),
    { ok: false, includes: ["--output must be output/review-handoff/vocabulary-review-bundle"] },
  );
  assertCase(
    checks,
    "collection_session_bundle_refuses_project_root_output",
    "Collection session bundle generation must refuse broad output paths before recursive cleanup",
    runCollectionSessionBundleOutputRefusalProbe(),
    { ok: false, includes: ["--output must be output/collection-handoff/collection-session-bundle"] },
  );
  assertCase(
    checks,
    "draft_collection_session_bundle_fails_capture_ready",
    "Draft collection session bundles must be explicitly not capture-ready in manifests, readmes, and signer sheets",
    runDraftCollectionSessionBundleProbe(),
    { ok: true, includes: ["draft_not_for_capture", "capture_ready\":false", "draft_warning\":true", "csv_warned\":true"] },
  );
  assertCase(
    checks,
    "collection_session_bundle_rejects_stale_generator",
    "Collection session bundle audit must reject manifests produced by older generator code",
    runStaleCollectionSessionBundleGeneratorProbe(),
    { ok: true, includes: ["generated_by.script.sha256"] },
  );
  assertCase(
    checks,
    "mismatched_vocabulary_reviewer_authority_fails",
    "Reviewer authority must reject a trusted key record that does not match the signed reviewer receipt",
    runVocabularyReviewerAuthorityProbe(
      fixtures.goodVocabularyReviewerReturnedPacket,
      fixtures.goodSignedVocabularyReviewerReceipt,
      fixtures.badMismatchedVocabularyReviewerAuthority,
    ),
    { ok: false, includes: ["must match reviewer receipt signer_key_fingerprint_sha256"] },
  );
  assertCase(
    checks,
    "status_report_accepts_candidate_vocabulary_reviewer_authority",
    "Vocabulary review status report can triage a noncanonical signed receipt and matching reviewer authority before staging",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.goodSignedVocabularyReviewerReceipt,
      "--reviewer-authority",
      fixtures.goodVocabularyReviewerAuthority,
    ]),
    {
      ok: true,
      includes: [
        "\"status\": \"candidate_ready_for_canonical_staging\"",
        "\"signature_verified\": true",
        "\"valid\": true",
        "Copy the validated returned packet",
      ],
    },
  );
  assertCase(
    checks,
    "status_report_rejects_mismatched_candidate_vocabulary_reviewer_authority",
    "Vocabulary review status report must reject a candidate reviewer authority that does not match the signed receipt",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.goodSignedVocabularyReviewerReceipt,
      "--reviewer-authority",
      fixtures.badMismatchedVocabularyReviewerAuthority,
    ]),
    { ok: true, includes: ["must match reviewer receipt signer_key_fingerprint_sha256"] },
  );
  assertCase(
    checks,
    "returned_review_help_separates_dry_run_receipt_from_apply",
    "Returned-review wrapper help must tell operators that --reviewer-receipt is dry-run only before canonical apply",
    run("node", ["scripts/process_returned_vocabulary_review.mjs", "--help"]),
    { ok: true, includes: ["--reviewer-receipt is for\nread-only dry-run triage only"] },
  );
  assertCase(
    checks,
    "returned_review_wrapper_retains_command_argv",
    "Returned-review wrapper must retain replayable argv for failed subprocess steps",
    runReturnedReviewWrapperArgvProbe(),
    { ok: true, includes: ["command_argv"] },
  );
  assertCase(
    checks,
    "collected_dataset_wrapper_retains_next_command_argv",
    "Post-collection wrapper must retain replayable argv for the next wrapper invocation",
    runCollectedEvidenceWrapperArgvProbe(),
    { ok: true, includes: ["next_command_argv"] },
  );
  assertCase(
    checks,
    "collected_dataset_apply_failure_rolls_back_mutations",
    "Post-collection wrapper --apply must roll back store and review evidence if a later gate fails",
    runCollectedEvidenceApplyRollbackProbe(),
    { ok: true, includes: ["rollback_status\":\"restored", "failed_after_mutation\":true", "store_rolled_back\":true"] },
  );
  assertCase(
    checks,
    "final_training_rejects_noncanonical_train_manifest",
    "Final training mode must require the canonical final train manifest path before loading manifests",
    runFinalTrainingCanonicalPathProbe(["--train-manifest", "output/guardrail-negative-fixtures/train.json"]),
    { ok: false, includes: ["final training requires --train-manifest data/manifests/train.json"] },
  );
  assertCase(
    checks,
    "final_training_rejects_noncanonical_output_dir",
    "Final training mode must require the canonical final artifact directory before loading manifests",
    runFinalTrainingCanonicalPathProbe(["--output-dir", "output/guardrail-negative-fixtures/rawframe-model"]),
    { ok: false, includes: ["final training requires --output-dir artifacts/rawframe-model"] },
  );
  assertCase(
    checks,
    "final_training_rejects_frame_mean_architecture",
    "Final training mode must reject the old frame-mean 2D baseline architecture",
    runFinalTrainingCanonicalPathProbe(["--architecture", "small_2d_cnn_frame_encoder_with_temporal_mean_pooling"]),
    { ok: false, includes: ["final training requires --architecture one of", "small_2d_cnn_frame_encoder_with_temporal_mean_pooling is smoke/wiring-only"] },
  );
  assertCase(
    checks,
    "incomplete_vocabulary_reviewer_receipt_helper_refuses_signing",
    "Vocabulary reviewer receipt helper refuses to sign the current incomplete packet",
    run("node", [
      "scripts/draft_vocabulary_reviewer_receipt.mjs",
      "--input",
      "data/vocabulary-review/asl-pilot-vocabulary-review.json",
      "--output",
      fixtures.incompleteVocabularyReviewerReceipt,
      "--private-key",
      fixtures.goodVocabularyReviewerPrivateKey,
      "--write",
    ]),
    { ok: false, includes: ["Refusing to sign an incomplete vocabulary review packet", "review packet status must be reviewed"] },
  );
  assertCase(
    checks,
    "signature_request_failure_preserves_existing_output",
    "Vocabulary signature-request generation must not delete previous output before proving the packet is signable",
    runSignatureRequestPreservesExistingOutputProbe(),
    { ok: true, includes: ["failed_as_expected", "\"preserved\":true"] },
  );
  assertCase(
    checks,
    "tampered_vocabulary_reviewer_receipt_fails",
    "Vocabulary reviewer receipt signatures fail if the reviewer payload changes after signing",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.badTamperedVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["signed_payload_sha256", "signature verification failed"] },
  );
  assertCase(
    checks,
    "wrong_packet_hash_vocabulary_reviewer_receipt_fails",
    "Vocabulary reviewer receipts must bind the exact returned packet hash",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.badWrongPacketHashVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["review_packet must match"] },
  );
  assertCase(
    checks,
    "mismatched_signed_at_vocabulary_reviewer_receipt_fails",
    "Vocabulary reviewer receipt signed_at must match reviewer.reviewed_at",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.badMismatchedSignedAtVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["signed_at must match reviewer.reviewed_at"] },
  );
  assertCase(
    checks,
    "duplicate_ids_vocabulary_reviewer_receipt_fails",
    "Vocabulary reviewer receipt approved IDs must exactly match packet item order",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.badDuplicateIdsVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["approved_item_ids must match"] },
  );
  assertCase(
    checks,
    "extra_unsigned_field_vocabulary_reviewer_receipt_fails",
    "Vocabulary reviewer receipts cannot carry extra top-level fields outside the signed payload",
    run("node", [
      "scripts/report_vocabulary_review_status.mjs",
      "--input",
      fixtures.goodVocabularyReviewerReturnedPacket,
      "--reviewer-receipt",
      fixtures.badExtraFieldVocabularyReviewerReceipt,
    ]),
    { ok: true, includes: ["unexpected unsigned field"] },
  );
  assertCase(
    checks,
    "public_source_allowed_without_review_fails",
    "Public reference datasets cannot be allowed without external-rights review evidence",
    run("node", ["scripts/audit_source_register.mjs", "--register", fixtures.badSourceRegister]),
    { ok: false, includes: ["external_rights_review"] },
  );
  assertCase(
    checks,
    "unknown_source_kind_fails",
    "Unknown source_kind aliases cannot bypass the non-first-party review gate",
    run("node", ["scripts/audit_source_register.mjs", "--register", fixtures.badSourceKindRegister]),
    { ok: false, includes: ["source_kind"] },
  );
  assertCase(
    checks,
    "duplicate_source_id_fails",
    "Duplicate source IDs are rejected",
    run("node", ["scripts/audit_source_register.mjs", "--register", fixtures.duplicateSourceRegister]),
    { ok: false, includes: ["duplicate source_id"] },
  );
  assertCase(
    checks,
    "forged_review_evidence_fails",
    "External-rights review evidence must point to real hash-matching files",
    run("node", ["scripts/audit_source_register.mjs", "--register", fixtures.forgedEvidenceRegister]),
    { ok: false, includes: ["does not exist", "review_receipt"] },
  );

  const failed = checks.filter((check) => check.status !== "passed");
  const summary = {
    status: failed.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    fixture_root: projectRelative(fixtureRoot),
    checks,
  };
  console.log(JSON.stringify(summary, null, 2));
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.rmSync(vocabularyReviewEvidenceFixtureRoot, { recursive: true, force: true });
  if (failed.length > 0) {
    console.error("Guardrail negative fixture audit failed:");
    for (const check of failed) console.error(`- ${check.id}: ${check.blockers.join("; ")}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
  fs.rmSync(vocabularyReviewEvidenceFixtureRoot, { recursive: true, force: true });
  console.error(`Guardrail negative fixture audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
