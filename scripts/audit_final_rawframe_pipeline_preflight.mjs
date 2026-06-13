import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const appUrl = "http://127.0.0.1:3025";

const finalManifests = [
  "data/manifests/train.json",
  "data/manifests/validation.json",
  "data/manifests/test.json",
  "data/manifests/negative-challenge.json",
];
const finalVocabularyReviewPath = "docs/review/final-vocabulary-review.json";
const collectionPlanPath = "data/dataset/collection-plan.json";
const collectionBundleManifestPath = "output/collection-handoff/collection-session-bundle/MANIFEST.json";
const collectionStorePath = "data/asl-pilot-store.json";
const clipReviewPacketPath = "data/clip-review/asl-pilot-clip-review.json";
const challengeReviewPacketPath = "data/clip-review/asl-pilot-negative-challenge-review.json";
const signerIdentityPacketPath = "data/signer-identity/signer-identity-evidence.json";
const negativeChallengeManifestPath = finalManifests[3];
const finalModelDir = "artifacts/rawframe-model";
const finalCheckpointPath = `${finalModelDir}/model_state.pt`;
const finalTrainingProvenancePath = `${finalModelDir}/training-provenance.json`;
const finalValidationReportPath = `${finalModelDir}/validation-report.json`;
const finalCalibratedProvenancePath = `${finalModelDir}/calibrated-provenance.json`;
const finalValidationReportMarkdownPath = "docs/validation/validation-report.md";
const finalOnnxPath = "web/public/model/asl-pilot-rawframe-v0.onnx";
const finalOnnxExportProvenancePath = "web/public/model/asl-pilot-rawframe-v0-export-provenance.json";
const finalModelCardPath = "web/public/model/model-card.json";
const finalBrowserOnnxSmokePath = "docs/validation/final-browser-onnx-smoke.json";
const finalBrowserCompatibilityPath = "docs/validation/final-browser-compatibility.json";
const finalBrowserCompatibilityObservationsPath = "docs/validation/final-browser-compatibility.observations.json";
const localMlEnvironmentPath = "docs/validation/local-ml-environment.json";
const finalManifestAuditPath = "docs/validation/final-manifest-audit.json";
const approvedExternalDatasetSourceMode = "approved_external_raw_video_source";

function usage() {
  console.log(`Usage:
  node scripts/audit_final_rawframe_pipeline_preflight.mjs [--skip-completion-readiness] [--skip-decode-replay]

Reports the canonical read-only final raw-frame pipeline state. It exits nonzero
until every final artifact and retained evidence file exists, is non-smoke, and
matches the project's canonical paths.

--skip-completion-readiness is diagnostic only. It can help the top-level
completion-readiness audit avoid recursion, but its output is not final
acceptance evidence by itself.

--skip-decode-replay is diagnostic only. It skips the expensive full FFmpeg
decode provenance replay used by final acceptance. Static tensor/provenance
fields are still checked, but a diagnostic run with this flag is never final
acceptance evidence.
`);
}

function parseArgs(argv) {
  const args = { skipCompletionReadiness: false, skipDecodeReplay: false };
  for (const item of argv) {
    if (item === "--help") return { help: true };
    if (item === "--skip-completion-readiness") {
      args.skipCompletionReadiness = true;
      continue;
    }
    if (item === "--skip-decode-replay") {
      args.skipDecodeReplay = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(projectPath(relativePath))).digest("hex");
}

function fileReference(relativePath) {
  return {
    path: relativePath,
    exists: exists(relativePath),
    sha256: exists(relativePath) ? sha256File(relativePath) : null,
  };
}

function readJson(relativePath, blockers, context = relativePath) {
  if (!exists(relativePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      blockers.push(`${context} root must be a JSON object`);
      return null;
    }
    return data;
  } catch (error) {
    blockers.push(`${context} is not valid JSON: ${error.message}`);
    return null;
  }
}

function trimOutput(text, limit = 3000) {
  const trimmed = String(text ?? "").trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}\n...truncated...` : trimmed;
}

function runReadOnly(command, options = {}) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeoutMs ?? 0,
    killSignal: "SIGTERM",
  });
  const timedOut = result.error?.code === "ETIMEDOUT";
  return {
    command,
    status_code: result.status,
    signal: result.signal ?? null,
    status: result.status === 0 ? "passed" : timedOut ? "timed_out" : "failed",
    timeout_ms: options.timeoutMs ?? null,
    stdout: trimOutput(result.stdout, 5000),
    stderr: trimOutput(result.stderr, 3000),
    error: result.error?.message ?? null,
  };
}

function parseJsonOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function requireFiles(paths, blockers, label = "required file") {
  for (const relativePath of paths) {
    if (!exists(relativePath)) blockers.push(`${label} is missing: ${relativePath}`);
  }
}

function resolveManifestRelative(manifestPath, relativePath) {
  const resolved = path.resolve(path.dirname(projectPath(manifestPath)), relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function commandHasFlag(command, flag) {
  return Array.isArray(command) && command.includes(flag);
}

function commandHasOptionValue(command, option, expectedValue) {
  if (!Array.isArray(command)) return false;
  const index = command.indexOf(option);
  if (index === -1) return false;
  const actual = command[index + 1];
  if (typeof actual !== "string") return false;
  const actualPath = path.resolve(root, actual);
  const expectedPath = path.resolve(root, expectedValue);
  return actualPath === expectedPath;
}

function validateTensorFields(manifestPath, blockers) {
  const manifest = readJson(manifestPath, blockers);
  if (!manifest) return { total: 0, ready: 0 };
  const clips = Array.isArray(manifest.clips) ? manifest.clips : [];
  if (clips.length === 0) {
    blockers.push(`${manifestPath} clips must be a non-empty array`);
    return { total: 0, ready: 0 };
  }
  let ready = 0;
  const missing = [];
  const missingProvenance = [];
  const mismatched = [];
  for (const [index, clip] of clips.entries()) {
    const context = `${manifestPath}: clips[${index}]`;
    if (
      typeof clip?.relative_frame_tensor_path !== "string" ||
      !clip.relative_frame_tensor_path.trim() ||
      !isSha256(clip.frame_tensor_sha256)
    ) {
      missing.push(context);
      continue;
    }
    const tensorPath = resolveManifestRelative(manifestPath, clip.relative_frame_tensor_path);
    if (!tensorPath || !fs.existsSync(tensorPath)) {
      mismatched.push(`${context} tensor file is missing`);
      continue;
    }
    const actual = crypto.createHash("sha256").update(fs.readFileSync(tensorPath)).digest("hex");
    if (actual !== clip.frame_tensor_sha256) {
      mismatched.push(`${context} tensor SHA-256 mismatch`);
      continue;
    }
    const provenance = clip.frame_tensor_provenance;
    if (
      !provenance ||
      provenance.schema_version !== "asl-pilot-rawframe-decode-provenance/v1" ||
      typeof provenance.source_video?.sha256 !== "string" ||
      !isSha256(provenance.source_video.sha256) ||
      typeof provenance.ffmpeg?.sha256 !== "string" ||
      !isSha256(provenance.ffmpeg.sha256) ||
      typeof provenance.decoded_raw_rgb?.sha256 !== "string" ||
      !isSha256(provenance.decoded_raw_rgb.sha256) ||
      typeof provenance.tensor_digest?.sha256 !== "string" ||
      !isSha256(provenance.tensor_digest.sha256)
    ) {
      missingProvenance.push(context);
      continue;
    }
    ready += 1;
  }
  if (missing.length > 0) {
    blockers.push(
      `${manifestPath} has ${missing.length}/${clips.length} clip(s) without hash-pinned decoded raw-frame tensor fields`,
    );
  }
  if (missingProvenance.length > 0) {
    blockers.push(
      `${manifestPath} has ${missingProvenance.length}/${clips.length} clip(s) without replayable raw-frame decode provenance`,
    );
  }
  if (mismatched.length > 0) {
    blockers.push(`${manifestPath} has invalid decoded tensor references: ${mismatched.slice(0, 5).join("; ")}`);
  }
  return { total: clips.length, ready };
}

function validateTrainingProvenance(blockers) {
  const provenance = readJson(finalTrainingProvenancePath, blockers);
  if (!provenance) return;
  if (provenance.schema_version !== "asl-pilot-training-provenance/v1") {
    blockers.push(`${finalTrainingProvenancePath} schema_version must be asl-pilot-training-provenance/v1`);
  }
  if (provenance.evidence_mode !== "final") {
    blockers.push(`${finalTrainingProvenancePath} evidence_mode must be final`);
  }
  if (provenance.training_status !== "completed") {
    blockers.push(`${finalTrainingProvenancePath} training_status must be completed`);
  }
  if (provenance.initialization !== "random") {
    blockers.push(`${finalTrainingProvenancePath} initialization must be random`);
  }
  if (!Array.isArray(provenance.pretrained_components) || provenance.pretrained_components.length !== 0) {
    blockers.push(`${finalTrainingProvenancePath} pretrained_components must be an empty array`);
  }
  const command = provenance.training_command ?? provenance.generated_by?.command;
  if (!Array.isArray(command) || !command.some((item) => String(item).endsWith("scripts/train_rawframe_model.py"))) {
    blockers.push(`${finalTrainingProvenancePath} must record scripts/train_rawframe_model.py as the training command`);
  }
  if (commandHasFlag(command, "--allow-small-label-set")) {
    blockers.push(`${finalTrainingProvenancePath} final training command must not include --allow-small-label-set`);
  }
  if (commandHasFlag(command, "--max-train-batches") || commandHasFlag(command, "--max-validation-batches")) {
    blockers.push(`${finalTrainingProvenancePath} final training command must not cap train or validation batches`);
  }
  if (!commandHasFlag(command, "--check-files")) {
    blockers.push(`${finalTrainingProvenancePath} final training command must include --check-files`);
  }
  if (!commandHasOptionValue(command, "--output-dir", finalModelDir)) {
    blockers.push(`${finalTrainingProvenancePath} final training command must use --output-dir ${finalModelDir}`);
  }
  if (typeof provenance.model_artifact === "string") {
    const artifact = projectRelative(path.resolve(root, provenance.model_artifact));
    if (artifact !== finalCheckpointPath) {
      blockers.push(`${finalTrainingProvenancePath} model_artifact must be ${finalCheckpointPath}`);
    }
  }
}

function validateValidationEvidence(blockers) {
  const report = readJson(finalValidationReportPath, blockers);
  if (report) {
    if (report.schema_version !== "asl-pilot-validation-report/v1") {
      blockers.push(`${finalValidationReportPath} schema_version must be asl-pilot-validation-report/v1`);
    }
    if (report.evidence_mode !== "final") {
      blockers.push(`${finalValidationReportPath} evidence_mode must be final`);
    }
    if (report.status !== "candidate_final_validation_passed") {
      blockers.push(`${finalValidationReportPath} status must be candidate_final_validation_passed`);
    }
    if (commandHasFlag(report.evaluation_command, "--allow-smoke-eval")) {
      blockers.push(`${finalValidationReportPath} final evaluation command must not include --allow-smoke-eval`);
    }
    if (!commandHasOptionValue(report.evaluation_command, "--challenge-manifest", negativeChallengeManifestPath)) {
      blockers.push(`${finalValidationReportPath} final evaluation command must use ${negativeChallengeManifestPath}`);
    }
  }
  const calibrated = readJson(finalCalibratedProvenancePath, blockers);
  if (calibrated) {
    if (calibrated.schema_version !== "asl-pilot-calibrated-provenance/v1") {
      blockers.push(`${finalCalibratedProvenancePath} schema_version must be asl-pilot-calibrated-provenance/v1`);
    }
    if (calibrated.evidence_mode !== "final") {
      blockers.push(`${finalCalibratedProvenancePath} evidence_mode must be final`);
    }
    if (calibrated.calibration_status !== "candidate_final_validation_passed") {
      blockers.push(`${finalCalibratedProvenancePath} calibration_status must be candidate_final_validation_passed`);
    }
  }
}

function validateOnnxEvidence(blockers) {
  const exportProvenance = readJson(finalOnnxExportProvenancePath, blockers);
  if (!exportProvenance) return;
  if (exportProvenance.status !== "exported") {
    blockers.push(`${finalOnnxExportProvenancePath} status must be exported`);
  }
  if (exportProvenance.finality !== "candidate_final_artifact") {
    blockers.push(`${finalOnnxExportProvenancePath} finality must be candidate_final_artifact`);
  }
  if (commandHasFlag(exportProvenance.export_command, "--allow-smoke-export")) {
    blockers.push(`${finalOnnxExportProvenancePath} final export command must not include --allow-smoke-export`);
  }
  if (exportProvenance.training_provenance?.path !== finalCalibratedProvenancePath) {
    blockers.push(`${finalOnnxExportProvenancePath} training_provenance.path must be ${finalCalibratedProvenancePath}`);
  }
  if (exportProvenance.browser_artifact?.path !== finalOnnxPath) {
    blockers.push(`${finalOnnxExportProvenancePath} browser_artifact.path must be ${finalOnnxPath}`);
  }
  if (exists(finalOnnxPath) && exportProvenance.browser_artifact?.sha256 !== sha256File(finalOnnxPath)) {
    blockers.push(`${finalOnnxExportProvenancePath} browser_artifact.sha256 must match ${finalOnnxPath}`);
  }
}

function validateModelCard(blockers) {
  const modelCard = readJson(finalModelCardPath, blockers);
  if (!modelCard) return;
  if (modelCard.status !== "trained") {
    blockers.push(`${finalModelCardPath} status must be trained`);
  }
  if (modelCard.browser_artifact?.path !== finalOnnxPath) {
    blockers.push(`${finalModelCardPath} browser_artifact.path must be ${finalOnnxPath}`);
  }
  if (exists(finalOnnxPath) && modelCard.browser_artifact?.sha256 !== sha256File(finalOnnxPath)) {
    blockers.push(`${finalModelCardPath} browser_artifact.sha256 must match ${finalOnnxPath}`);
  }
}

function validateFinalManifestAuditReport(blockers) {
  const report = readJson(finalManifestAuditPath, blockers);
  if (!report) return;
  if (report.schema_version !== "asl-pilot-final-manifest-audit/v1") {
    blockers.push(`${finalManifestAuditPath} schema_version must be asl-pilot-final-manifest-audit/v1`);
  }
  if (report.status !== "passed") {
    blockers.push(`${finalManifestAuditPath} status must be passed`);
    if (Array.isArray(report.blockers)) {
      for (const blocker of report.blockers) {
        blockers.push(`${finalManifestAuditPath}: ${blocker}`);
      }
    }
    return;
  }
  const expectedSplits = new Map([
    ["train", finalManifests[0]],
    ["validation", finalManifests[1]],
    ["test", finalManifests[2]],
  ]);
  const records = Array.isArray(report.manifests) ? report.manifests : [];
  for (const [split, manifestPath] of expectedSplits.entries()) {
    const record = records.find((item) => item?.split === split);
    if (!record) {
      blockers.push(`${finalManifestAuditPath} manifests must include ${split}`);
      continue;
    }
    if (record.path !== manifestPath) {
      blockers.push(`${finalManifestAuditPath} ${split}.path must be ${manifestPath}`);
    }
    if (exists(manifestPath) && record.sha256 !== sha256File(manifestPath)) {
      blockers.push(`${finalManifestAuditPath} ${split}.sha256 must match ${manifestPath}`);
    }
  }
  const challenge = report.negative_challenge;
  if (!challenge || typeof challenge !== "object" || Array.isArray(challenge)) {
    blockers.push(`${finalManifestAuditPath} negative_challenge must be an object`);
  } else {
    if (challenge.path !== negativeChallengeManifestPath) {
      blockers.push(`${finalManifestAuditPath} negative_challenge.path must be ${negativeChallengeManifestPath}`);
    }
    if (exists(negativeChallengeManifestPath) && challenge.sha256 !== sha256File(negativeChallengeManifestPath)) {
      blockers.push(`${finalManifestAuditPath} negative_challenge.sha256 must match ${negativeChallengeManifestPath}`);
    }
  }
  if (report.signer_disjoint !== true) {
    blockers.push(`${finalManifestAuditPath} signer_disjoint must be true`);
  }
  if (report.label_sets_match !== true) {
    blockers.push(`${finalManifestAuditPath} label_sets_match must be true`);
  }
}

function finalManifestSourceRoute() {
  const blockers = [];
  const manifests = [];
  for (const manifestPath of finalManifests) {
    const manifest = readJson(manifestPath, blockers);
    manifests.push({
      path: manifestPath,
      exists: exists(manifestPath),
      split: manifest?.split ?? null,
      dataset_source_mode: manifest?.dataset_source_mode ?? null,
      external_dataset_import_source_id: manifest?.external_dataset_import?.source_id ?? null,
      has_external_dataset_import: Boolean(
        manifest?.external_dataset_import &&
        typeof manifest.external_dataset_import === "object" &&
        typeof manifest.external_dataset_import.source_id === "string" &&
        manifest.external_dataset_import.source_audit &&
        typeof manifest.external_dataset_import.source_audit === "object"
      ),
    });
  }
  const allFinalManifestsUseApprovedExternalSource =
    manifests.length === finalManifests.length &&
    manifests.every((item) => (
      item.exists &&
      item.dataset_source_mode === approvedExternalDatasetSourceMode &&
      item.has_external_dataset_import
    ));
  return {
    route: allFinalManifestsUseApprovedExternalSource
      ? approvedExternalDatasetSourceMode
      : "first_party_or_incomplete",
    all_final_manifests_use_approved_external_source: allFinalManifestsUseApprovedExternalSource,
    manifests,
    blockers,
  };
}

function stage(id, label, commands, requiredFiles, outputFiles, inspect) {
  const blockers = [];
  requireFiles(requiredFiles, blockers);
  const evidence = {
    required_files: requiredFiles.map(fileReference),
    output_files: outputFiles.map(fileReference),
  };
  inspect?.(blockers, evidence);
  const missingOutputs = outputFiles.filter((relativePath) => !exists(relativePath));
  const status = blockers.length > 0
    ? "blocked"
    : missingOutputs.length > 0
      ? "ready_to_run"
      : "passed";
  const nextCommandOverride = evidence.next_command_override;
  delete evidence.next_command_override;
  const nextCommand = status === "passed" ? null : nextCommandOverride ?? commands[0];
  return {
    id,
    label,
    status,
    commands,
    next_command: nextCommand,
    evidence,
    blockers: status === "ready_to_run"
      ? [`ready to run canonical command; missing output(s): ${missingOutputs.join(", ")}`]
      : blockers,
  };
}

function buildStages(options = {}) {
  const stages = [];
  const sourceRoute = finalManifestSourceRoute();
  stages.push(stage(
    "local_ml_environment",
    "Local open-source ML/GPU receipt is current for final decode/train/eval/export",
    [
      [
        "./.venv/bin/python",
        "scripts/audit_local_ml_environment.py",
        "--write-report",
        localMlEnvironmentPath,
        "--report",
        localMlEnvironmentPath,
      ],
      ["./.venv/bin/python", "scripts/audit_local_ml_environment.py", "--report", localMlEnvironmentPath],
    ],
    [],
    [localMlEnvironmentPath],
    (blockers, evidence) => {
      if (exists(localMlEnvironmentPath)) {
        const audit = runReadOnly([
          "./.venv/bin/python",
          "scripts/audit_local_ml_environment.py",
          "--report",
          localMlEnvironmentPath,
        ]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "local ML environment audit failed");
      }
    },
  ));

  stages.push(stage(
    "vocabulary_source_curation",
    "Canonical vocabulary evidence is source-curated for the source-aligned pilot",
    [
      ["node", "scripts/promote_source_curated_vocabulary.mjs", "--write"],
      ["node", "scripts/audit_vocabulary_review.mjs"],
      ["node", "scripts/audit_hint_pedagogy_review.mjs"],
    ],
    [],
    [finalVocabularyReviewPath],
    (blockers, evidence) => {
      if (exists(finalVocabularyReviewPath)) {
        const vocabularyAudit = runReadOnly(["node", "scripts/audit_vocabulary_review.mjs"]);
        const hintAudit = runReadOnly(["node", "scripts/audit_hint_pedagogy_review.mjs"]);
        evidence.vocabulary_audit = vocabularyAudit;
        evidence.hint_pedagogy_audit = hintAudit;
        if (vocabularyAudit.status !== "passed") blockers.push(vocabularyAudit.stderr || vocabularyAudit.stdout || "vocabulary evidence audit failed");
        if (hintAudit.status !== "passed") blockers.push(hintAudit.stderr || hintAudit.stdout || "hint pedagogy review audit failed");
      }
    },
  ));

  stages.push(stage(
    "collection_plan_bundle",
    "Accepted vocabulary evidence has produced a capture-ready collection plan and operator bundle",
    [
      ["node", "scripts/plan_dataset_collection.mjs", "--output", collectionPlanPath],
      ["node", "scripts/prepare_collection_session_bundle.mjs"],
      ["node", "scripts/audit_reviewed_vocabulary_collection_gate.mjs"],
      ["node", "scripts/audit_collection_plan_freshness.mjs"],
      ["node", "scripts/audit_collection_session_bundle.mjs", "--require-ready"],
    ],
    [finalVocabularyReviewPath],
    [collectionPlanPath, collectionBundleManifestPath],
    (blockers, evidence) => {
      if (exists(finalVocabularyReviewPath)) {
        const reviewedGate = runReadOnly(["node", "scripts/audit_reviewed_vocabulary_collection_gate.mjs"]);
        evidence.vocabulary_collection_gate = reviewedGate;
        if (reviewedGate.status !== "passed") blockers.push(reviewedGate.stderr || reviewedGate.stdout || "vocabulary collection gate failed");
        if (exists(collectionPlanPath)) {
          const freshness = runReadOnly(["node", "scripts/audit_collection_plan_freshness.mjs"]);
          evidence.collection_plan_freshness = freshness;
          if (freshness.status !== "passed") blockers.push(freshness.stderr || freshness.stdout || "collection plan freshness audit failed");
        }
        if (exists(collectionBundleManifestPath)) {
          const bundleAudit = runReadOnly(["node", "scripts/audit_collection_session_bundle.mjs", "--require-ready"]);
          evidence.collection_session_bundle_audit = bundleAudit;
          if (bundleAudit.status !== "passed") blockers.push(bundleAudit.stderr || bundleAudit.stdout || "collection session bundle audit failed");
        }
      }
    },
  ));

  if (sourceRoute.all_final_manifests_use_approved_external_source) {
    stages.push(stage(
      "collection_store_and_returned_packets",
      "First-party collection packet intake is not required for the approved external-manifest route",
      [],
      finalManifests,
      [],
      (blockers, evidence) => {
        evidence.source_route = sourceRoute;
        evidence.not_required_reason =
          "All active final manifests use approved_external_raw_video_source with external_dataset_import evidence; strict final manifest validation is the authoritative intake gate for this route.";
        for (const blocker of sourceRoute.blockers) blockers.push(blocker);
      },
    ));
  } else {
    stages.push(stage(
      "collection_store_and_returned_packets",
      "Real consented collection exists and source-curated QA packets are ready for intake",
      [
        [
          "sh",
          "-lc",
          `cd web && ENABLE_DATASET_COLLECTION=true NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true npm run dev -- --hostname 127.0.0.1 --port 3025`,
        ],
        ["node", "scripts/export_clip_review_packet.mjs"],
        ["node", "scripts/export_challenge_review_packet.mjs"],
        ["node", "scripts/report_post_collection_evidence_status.mjs", "--write"],
        ["node", "scripts/process_collected_dataset_evidence.mjs"],
      ],
      [collectionPlanPath, collectionBundleManifestPath],
      [collectionStorePath, clipReviewPacketPath, challengeReviewPacketPath, signerIdentityPacketPath],
      (blockers, evidence) => {
        evidence.source_route = sourceRoute;
        const statusReport = runReadOnly(["node", "scripts/report_post_collection_evidence_status.mjs"]);
        evidence.post_collection_status = statusReport;
        const parsed = parseJsonOutput(statusReport);
        evidence.post_collection_status_summary = parsed
          ? {
              status: parsed.status,
              dataset_clip_count: parsed.collection_store_summary?.dataset_clip_count ?? null,
              challenge_clip_count: parsed.collection_store_summary?.challenge_clip_count ?? null,
              signer_count: parsed.collection_store_summary?.signer_count ?? null,
              next_required_steps: parsed.next_required_steps ?? [],
            }
          : null;
        if (statusReport.status !== "passed") {
          blockers.push(statusReport.stderr || statusReport.stdout || "post-collection evidence status report failed");
        } else if (parsed?.status !== "dry_run_valid_awaiting_apply") {
          blockers.push(`post-collection evidence is not ready for final manifest intake: ${parsed?.status ?? "unknown status"}`);
        }
      },
    ));
  }

  stages.push(stage(
    "strict_final_manifests",
    "Final train/validation/test and negative-challenge manifests pass strict validation",
    [
      ["node", "scripts/process_collected_dataset_evidence.mjs", "--apply"],
      ["./.venv/bin/python", "scripts/audit_final_manifests.py", "--write-report", finalManifestAuditPath],
    ],
    finalManifests,
    [...finalManifests, finalManifestAuditPath],
    (blockers, evidence) => {
      if (finalManifests.every(exists)) {
        const audit = runReadOnly(["./.venv/bin/python", "scripts/audit_final_manifests.py"]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "strict final manifest audit failed");
        if (!exists(finalManifestAuditPath)) {
          evidence.next_command_override = ["./.venv/bin/python", "scripts/audit_final_manifests.py", "--write-report", finalManifestAuditPath];
        } else {
          validateFinalManifestAuditReport(blockers);
        }
      }
    },
  ));

  stages.push(stage(
    "decode_raw_frames",
    "Final manifests have replay-verified raw RGB tensor provenance",
    [
      [
        "./.venv/bin/python",
        "scripts/decode_raw_videos.py",
        "--manifest",
        "data/manifests/train.json",
        "--manifest",
        "data/manifests/validation.json",
        "--manifest",
        "data/manifests/test.json",
        "--manifest",
        "data/manifests/negative-challenge.json",
        "--tensor-root",
        "data/tensors",
      ],
    ],
    finalManifests,
    [],
    (blockers, evidence) => {
      evidence.tensor_fields = {};
      for (const manifestPath of finalManifests) {
        if (exists(manifestPath)) {
          evidence.tensor_fields[manifestPath] = validateTensorFields(manifestPath, blockers);
        }
      }
      if (options.skipDecodeReplay) {
        evidence.decode_provenance_replay = {
          status: "skipped",
          reason: "--skip-decode-replay was set for a diagnostic preflight; final acceptance must rerun without it",
        };
      } else if (finalManifests.every(exists)) {
        const verify = runReadOnly([
          "./.venv/bin/python",
          "scripts/decode_raw_videos.py",
          "--manifest",
          "data/manifests/train.json",
          "--manifest",
          "data/manifests/validation.json",
          "--manifest",
          "data/manifests/test.json",
          "--manifest",
          "data/manifests/negative-challenge.json",
          "--tensor-root",
          "data/tensors",
          "--verify-only",
        ], { timeoutMs: 45 * 60 * 1000 });
        evidence.decode_provenance_replay = verify;
        if (verify.status !== "passed") {
          blockers.push(verify.stderr || verify.stdout || "decoded raw-frame tensor provenance replay failed");
        }
      }
    },
  ));

  stages.push(stage(
    "train_rawframe_model",
    "From-scratch raw-frame model has final training provenance",
    [
      [
        "./.venv/bin/python",
        "scripts/train_rawframe_model.py",
        "--train-manifest",
        "data/manifests/train.json",
        "--validation-manifest",
        "data/manifests/validation.json",
        "--test-manifest",
        "data/manifests/test.json",
        "--output-dir",
        finalModelDir,
        "--model-id",
        "asl-pilot-rawframe-v0",
        "--check-files",
      ],
    ],
    finalManifests,
    [finalCheckpointPath, finalTrainingProvenancePath],
    validateTrainingProvenance,
  ));

  stages.push(stage(
    "evaluate_rawframe_model",
    "Signer-disjoint validation, test, and negative challenge evidence is calibrated",
    [
      [
        "./.venv/bin/python",
        "scripts/evaluate_rawframe_model.py",
        "--checkpoint",
        finalCheckpointPath,
        "--training-provenance",
        finalTrainingProvenancePath,
        "--train-manifest",
        "data/manifests/train.json",
        "--validation-manifest",
        "data/manifests/validation.json",
        "--test-manifest",
        "data/manifests/test.json",
        "--challenge-manifest",
        negativeChallengeManifestPath,
        "--output-report",
        finalValidationReportPath,
        "--calibrated-provenance",
        finalCalibratedProvenancePath,
      ],
    ],
    [finalCheckpointPath, finalTrainingProvenancePath, ...finalManifests],
    [finalValidationReportPath, finalCalibratedProvenancePath],
    validateValidationEvidence,
  ));

  stages.push(stage(
    "promote_validation_report_doc",
    "Human-readable validation report is promoted from final validation evidence",
    [
      [
        "node",
        "scripts/promote_validation_report_doc.mjs",
        "--dry-run",
        "--validation-report",
        finalValidationReportPath,
        "--calibrated-provenance",
        finalCalibratedProvenancePath,
        "--output",
        finalValidationReportMarkdownPath,
      ],
      [
        "node",
        "scripts/promote_validation_report_doc.mjs",
        "--validation-report",
        finalValidationReportPath,
        "--calibrated-provenance",
        finalCalibratedProvenancePath,
        "--output",
        finalValidationReportMarkdownPath,
      ],
      ["node", "scripts/audit_validation_report_doc.mjs"],
    ],
    [finalValidationReportPath, finalCalibratedProvenancePath],
    [finalValidationReportMarkdownPath],
    (blockers, evidence) => {
      if ([finalValidationReportPath, finalCalibratedProvenancePath].every(exists)) {
        const audit = runReadOnly(["node", "scripts/audit_validation_report_doc.mjs"]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "validation report doc audit failed");
      }
    },
  ));

  stages.push(stage(
    "export_onnx_model",
    "Final calibrated checkpoint is exported to the browser ONNX artifact",
    [
      [
        "./.venv/bin/python",
        "scripts/export_onnx_model.py",
        "--checkpoint",
        finalCheckpointPath,
        "--training-provenance",
        finalCalibratedProvenancePath,
        "--output",
        finalOnnxPath,
      ],
    ],
    [finalCheckpointPath, finalCalibratedProvenancePath],
    [finalOnnxPath, finalOnnxExportProvenancePath],
    validateOnnxEvidence,
  ));

  stages.push(stage(
    "promote_trained_model_card",
    "Active model card is reproducible from final validation and ONNX evidence",
    [
      ["node", "scripts/promote_trained_model_card.mjs", "--dry-run"],
      ["node", "scripts/promote_trained_model_card.mjs"],
    ],
    [finalValidationReportPath, finalCalibratedProvenancePath, finalOnnxExportProvenancePath],
    [finalModelCardPath],
    (blockers, evidence) => {
      if ([finalValidationReportPath, finalCalibratedProvenancePath, finalOnnxExportProvenancePath].every(exists)) {
        const dryRun = runReadOnly(["node", "scripts/promote_trained_model_card.mjs", "--dry-run"]);
        evidence.dry_run = dryRun;
        if (dryRun.status !== "passed") blockers.push(dryRun.stderr || dryRun.stdout || "model-card promotion dry run failed");
      }
      validateModelCard(blockers);
    },
  ));

  stages.push(stage(
    "final_browser_onnx_smoke",
    "The trained ONNX artifact runs through the app client in a real browser",
    [
      ["npm", "--prefix", "web", "run", "build"],
      [
        "env",
        "ASL_PILOT_STORE_PATH=data/asl-pilot-store.json",
        "ENABLE_DATASET_COLLECTION=false",
        "NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false",
        "npm",
        "--prefix",
        "web",
        "run",
        "start",
        "--",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3025",
      ],
      ["node", "scripts/audit_final_browser_serving_preflight.mjs", "--app-url", appUrl],
      [
        "node",
        "scripts/run_final_browser_onnx_smoke.mjs",
        "--app-url",
        appUrl,
        "--write",
        "--write-on-pass-only",
      ],
      ["node", "scripts/audit_final_browser_onnx_smoke.mjs"],
    ],
    [finalModelCardPath, finalOnnxExportProvenancePath, finalOnnxPath],
    [finalBrowserOnnxSmokePath],
    (blockers, evidence) => {
      if (exists(finalBrowserOnnxSmokePath)) {
        const audit = runReadOnly(["node", "scripts/audit_final_browser_onnx_smoke.mjs"]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "final browser ONNX smoke audit failed");
      }
    },
  ));

  stages.push(stage(
    "final_browser_compatibility",
    "Chrome/Edge/Safari/Firefox compatibility evidence is retained and signed where manual",
    [
      [
        "node",
        "scripts/run_final_browser_compatibility.mjs",
        "--app-url",
        appUrl,
        "--observations",
        finalBrowserCompatibilityObservationsPath,
        "--output",
        finalBrowserCompatibilityPath,
        "--write",
        "--write-on-pass-only",
      ],
      ["node", "scripts/audit_final_browser_compatibility.mjs"],
    ],
    [finalModelCardPath, finalBrowserOnnxSmokePath],
    [finalBrowserCompatibilityPath],
    (blockers, evidence) => {
      if (exists(finalBrowserCompatibilityPath)) {
        const audit = runReadOnly(["node", "scripts/audit_final_browser_compatibility.mjs"]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "final browser compatibility audit failed");
      }
    },
  ));

  if (!options.skipCompletionReadiness) {
    const previousIncomplete = stages.some((item) => item.status !== "passed");
    stages.push(stage(
      "completion_readiness",
      "End-to-end completion readiness audit passes from retained final evidence",
      [
        ["node", "scripts/audit_completion_readiness.mjs", "--read-only", "--summary-only"],
        ["node", "scripts/audit_completion_readiness.mjs", "--read-only"],
        ["node", "scripts/audit_completion_readiness.mjs"],
      ],
      [finalModelCardPath],
      [],
      (blockers, evidence) => {
        if (previousIncomplete) {
          blockers.push("earlier final raw-frame pipeline stages are incomplete; completion readiness is intentionally not run");
          return;
        }
        const audit = runReadOnly(["node", "scripts/audit_completion_readiness.mjs", "--read-only", "--summary-only"]);
        evidence.audit = audit;
        if (audit.status !== "passed") blockers.push(audit.stderr || audit.stdout || "completion readiness audit failed");
      },
    ));
  }
  return stages;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const stages = buildStages({
    skipCompletionReadiness: args.skipCompletionReadiness,
    skipDecodeReplay: args.skipDecodeReplay,
  });
  const nextStage = stages.find((item) => item.status !== "passed") ?? null;
  const blockers = stages.flatMap((item) => item.blockers.map((blocker) => `${item.id}: ${blocker}`));
  const diagnosticOnly = args.skipCompletionReadiness || args.skipDecodeReplay;
  const summary = {
    schema_version: "asl-pilot-final-rawframe-pipeline-preflight/v1",
    status: blockers.length > 0
      ? "blocked"
      : diagnosticOnly
        ? "diagnostic_passed_not_final"
        : "passed",
    checked_at: new Date().toISOString(),
    read_only: true,
    skip_completion_readiness: args.skipCompletionReadiness,
    skip_decode_replay: args.skipDecodeReplay,
    final_acceptance_eligible: blockers.length === 0 && !diagnosticOnly,
    diagnostic_only_reason: diagnosticOnly
      ? [
          args.skipCompletionReadiness
            ? "--skip-completion-readiness omits the top-level completion readiness stage"
            : null,
          args.skipDecodeReplay
            ? "--skip-decode-replay omits the full FFmpeg decode provenance replay"
            : null,
          "rerun without diagnostic skip flags before final acceptance",
        ].filter(Boolean).join("; ")
      : null,
    canonical_paths: {
      final_vocabulary_review: finalVocabularyReviewPath,
      collection_plan: collectionPlanPath,
      collection_bundle_manifest: collectionBundleManifestPath,
      collection_store: collectionStorePath,
      clip_review_packet: clipReviewPacketPath,
      challenge_review_packet: challengeReviewPacketPath,
      signer_identity_packet: signerIdentityPacketPath,
      manifests: finalManifests,
      final_manifest_audit: finalManifestAuditPath,
      model_dir: finalModelDir,
      checkpoint: finalCheckpointPath,
      training_provenance: finalTrainingProvenancePath,
      validation_report: finalValidationReportPath,
      calibrated_provenance: finalCalibratedProvenancePath,
      validation_report_markdown: finalValidationReportMarkdownPath,
      onnx: finalOnnxPath,
      onnx_export_provenance: finalOnnxExportProvenancePath,
      model_card: finalModelCardPath,
      final_browser_onnx_smoke: finalBrowserOnnxSmokePath,
      final_browser_compatibility: finalBrowserCompatibilityPath,
      local_ml_environment: localMlEnvironmentPath,
    },
    next_stage: nextStage
      ? {
          id: nextStage.id,
          status: nextStage.status,
          next_command: nextStage.next_command,
          blockers: nextStage.blockers,
        }
      : null,
    stages,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Final raw-frame pipeline preflight failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  if (diagnosticOnly) {
    console.error("Final raw-frame pipeline preflight was run with diagnostic skip flags; this result is not final acceptance evidence.");
    return 3;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
