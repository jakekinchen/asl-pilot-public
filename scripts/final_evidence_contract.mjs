import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

export const validationReportSchemaVersion = "asl-pilot-validation-report/v1";
export const calibratedProvenanceSchemaVersion = "asl-pilot-calibrated-provenance/v1";
export const evaluationScriptPath = "scripts/evaluate_rawframe_model.py";
export const finalValidationReportPath = "artifacts/rawframe-model/validation-report.json";
export const finalCalibratedProvenancePath = "artifacts/rawframe-model/calibrated-provenance.json";
export const finalCheckpointPath = "artifacts/rawframe-model/model_state.pt";
export const finalTrainingProvenancePath = "artifacts/rawframe-model/training-provenance.json";
export const finalNegativeChallengePath = "data/manifests/negative-challenge.json";
export const targetNegativeChallengeFalsePassRate = 0.05;
export const sourceRegisterPath = "docs/model/dataset-source-register.json";
export const localMlEnvironmentPath = "docs/validation/local-ml-environment.json";
export const finalRawFrameArchitecture = "compact_3d_cnn_spatiotemporal";
export const compactClipNormRawFrameArchitecture = "compact_3d_cnn_spatiotemporal_clip_norm";
export const factorizedRawFrameArchitecture = "factorized_3d_cnn_spatiotemporal";
export const motionTemporalRawFrameArchitecture = "motion_2d_temporal_cnn";
export const finalRawFrameArchitectures = [
  finalRawFrameArchitecture,
  compactClipNormRawFrameArchitecture,
  factorizedRawFrameArchitecture,
  motionTemporalRawFrameArchitecture,
];
export const minimumLocalMlStorageAvailableGiB = 40;
export const recommendedLocalMlStorageAvailableGiB = 100;
export const minimumLocalMlMemoryGiB = 32;
export const minimumLocalMlLogicalCpuCores = 8;
export const minimumLocalMlAppleGpuCores = 16;

const finalManifestPaths = {
  train: "data/manifests/train.json",
  validation: "data/manifests/validation.json",
  test: "data/manifests/test.json",
};
const firstPartyDatasetSourceMode = "first_party_consent_capture";
const externalDatasetSourceMode = "approved_external_raw_video_source";
const allowedDatasetSourceModes = new Set([firstPartyDatasetSourceMode, externalDatasetSourceMode]);

const requiredEnvironmentPaths = ["requirements.txt", "web/package.json", "web/package-lock.json", localMlEnvironmentPath];
const localMlEnvironmentSchemaVersion = "asl-pilot-local-ml-environment/v1";
const requiredPythonPackageProvenance = {
  torch: {
    version: "2.12.0",
    license: "BSD-3-Clause",
    sourceUrl: "https://github.com/pytorch/pytorch",
  },
  onnx: {
    version: "1.21.0",
    license: "Apache-2.0",
    sourceUrl: "https://github.com/onnx/onnx",
  },
  onnxscript: {
    version: "0.7.0",
    license: "MIT",
    sourceUrl: "https://github.com/microsoft/onnxscript",
  },
};

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context, findings, mustExist = true) {
  if (typeof value !== "string" || value.trim().length === 0) {
    findings.push(`${context} must be a non-empty project path`);
    return null;
  }
  const resolved = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    findings.push(`${context} escapes project root: ${value}`);
    return null;
  }
  if (mustExist && !fs.existsSync(resolved)) {
    findings.push(`${context} does not exist: ${relative(resolved)}`);
    return null;
  }
  return resolved;
}

function normalizeProjectPath(value, context, findings) {
  const resolved = resolveProjectPath(value, context, findings, false);
  return resolved ? relative(resolved) : null;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function finalRawFrameArchitectureList() {
  return finalRawFrameArchitectures.join(", ");
}

export function isFinalRawFrameArchitecture(value) {
  return finalRawFrameArchitectures.includes(value);
}

function verifyFileReference(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    findings.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (!isSha256(reference.sha256)) {
    findings.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`, findings);
  if (!file) return null;
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    findings.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function requireReferencePath(reference, expectedPath, context, findings) {
  const file = verifyFileReference(reference, context, findings);
  if (!file) return;
  const actualPath = relative(file);
  if (actualPath !== expectedPath) {
    findings.push(`${context}.path must be ${expectedPath}; found ${actualPath}`);
  }
}

function validateSourceRegisterReference(reference, context, findings) {
  const file = verifyFileReference(reference, context, findings);
  if (!file) return null;
  const actualPath = relative(file);
  if (actualPath !== sourceRegisterPath) {
    findings.push(`${context}.path must be ${sourceRegisterPath}; found ${actualPath}`);
    return null;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    findings.push(`${context} is not valid JSON: ${error.message}`);
    return null;
  }
  if (data.schema_version !== "asl-pilot-dataset-source-register/v1") {
    findings.push(`${context} schema_version must be asl-pilot-dataset-source-register/v1`);
  }
  if (data.review_method?.default_public_dataset_policy !== "blocked_without_external_rights_review") {
    findings.push(`${context} must declare blocked_without_external_rights_review`);
  }
  return {
    path: actualPath,
    sha256: reference.sha256,
  };
}

function datasetSourceMode(record) {
  return record?.dataset_source_mode ?? firstPartyDatasetSourceMode;
}

function validateExternalDatasetImportReference(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object for approved external dataset manifests`);
    return null;
  }
  if (typeof reference.source_id !== "string" || reference.source_id.trim().length === 0) {
    findings.push(`${context}.source_id must be a non-empty string`);
  }
  const sourceAuditFile = verifyFileReference(reference.source_audit, `${context}.source_audit`, findings);
  if (sourceAuditFile) {
    try {
      const audit = JSON.parse(fs.readFileSync(sourceAuditFile, "utf8"));
      if (audit.source_id !== reference.source_id) {
        findings.push(`${context}.source_audit source_id must match ${context}.source_id`);
      }
      if (!["passed", "accepted", "approved"].includes(audit.status)) {
        findings.push(`${context}.source_audit status must be passed, accepted, or approved`);
      }
    } catch (error) {
      findings.push(`${context}.source_audit is not valid JSON: ${error.message}`);
    }
  }
  return reference;
}

function validateManifestDatasetSource(record, context, findings) {
  const mode = datasetSourceMode(record);
  if (!allowedDatasetSourceModes.has(mode)) {
    findings.push(`${context}.dataset_source_mode must be one of ${[...allowedDatasetSourceModes].join(", ")}`);
    return;
  }
  if (mode === externalDatasetSourceMode) {
    validateExternalDatasetImportReference(record.external_dataset_import, `${context}.external_dataset_import`, findings);
    return;
  }
  if (!record.collection_plan || typeof record.collection_plan !== "object") {
    findings.push(`${context} must include collection_plan evidence`);
  }
  if (!record.consent_form || typeof record.consent_form !== "object") {
    findings.push(`${context} must include consent_form evidence`);
  }
}

export function validateLocalMlPackageProvenance(data, context, findings) {
  const pythonPackages = data.python_packages;
  if (!pythonPackages || typeof pythonPackages !== "object" || Array.isArray(pythonPackages)) {
    findings.push(`${context}.python_packages must be an object with package provenance`);
  } else {
    for (const [name, expected] of Object.entries(requiredPythonPackageProvenance)) {
      const record = pythonPackages[name];
      const packageContext = `${context}.python_packages.${name}`;
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        findings.push(`${packageContext} must be present`);
        continue;
      }
      if (record.expected !== expected.version || record.installed !== expected.version || record.matches_expected !== true) {
        findings.push(`${packageContext} must prove installed version ${expected.version}`);
      }
      if (record.metadata_available !== true) {
        findings.push(`${packageContext} must include installed package metadata`);
      }
      if (
        record.expected_license !== expected.license ||
        record.license_matches_expected !== true ||
        record.metadata?.license !== expected.license
      ) {
        findings.push(`${packageContext} must prove ${expected.license} package license`);
      }
      if (
        record.expected_source_url !== expected.sourceUrl ||
        record.source_url_matches_expected !== true ||
        record.metadata?.source_url !== expected.sourceUrl
      ) {
        findings.push(`${packageContext} must prove source URL ${expected.sourceUrl}`);
      }
    }
  }
  if (
    data.browser_runtime?.package !== "onnxruntime-web" ||
    data.browser_runtime?.expected_license !== "MIT" ||
    data.browser_runtime?.license !== "MIT" ||
    data.browser_runtime?.license_matches_expected !== true
  ) {
    findings.push(`${context}.browser_runtime must prove onnxruntime-web MIT license`);
  }
  if (
    typeof data.browser_runtime?.source_tarball_url !== "string" ||
    !data.browser_runtime.source_tarball_url.includes("onnxruntime-web-1.26.0.tgz") ||
    typeof data.browser_runtime?.package_integrity !== "string" ||
    !data.browser_runtime.package_integrity.startsWith("sha512-")
  ) {
    findings.push(`${context}.browser_runtime must prove onnxruntime-web source tarball URL and integrity`);
  }
}

export function validateLocalMlStorageHeadroom(data, context, findings) {
  const storage = data.storage;
  if (!storage || typeof storage !== "object" || Array.isArray(storage)) {
    findings.push(`${context}.storage must include local artifact headroom evidence`);
    return;
  }
  if (storage.path !== ".") {
    findings.push(`${context}.storage.path must be .`);
  }
  if (typeof storage.purpose !== "string" || !storage.purpose.includes("headroom")) {
    findings.push(`${context}.storage.purpose must describe artifact headroom`);
  }
  if (storage.minimum_available_gib !== minimumLocalMlStorageAvailableGiB) {
    findings.push(`${context}.storage.minimum_available_gib must be ${minimumLocalMlStorageAvailableGiB}`);
  }
  if (storage.recommended_available_gib !== recommendedLocalMlStorageAvailableGiB) {
    findings.push(`${context}.storage.recommended_available_gib must be ${recommendedLocalMlStorageAvailableGiB}`);
  }
  if (storage.minimum_passed !== true) {
    findings.push(`${context}.storage.minimum_passed must be true`);
  }
  if (typeof storage.available_gib !== "number" || storage.available_gib < minimumLocalMlStorageAvailableGiB) {
    findings.push(`${context}.storage.available_gib must be at least ${minimumLocalMlStorageAvailableGiB}`);
  }
}

export function validateLocalMlHardwareResources(data, context, findings) {
  const resources = data.hardware_resources;
  if (!resources || typeof resources !== "object" || Array.isArray(resources)) {
    findings.push(`${context}.hardware_resources must include sanitized local hardware evidence`);
    return;
  }
  if (typeof resources.purpose !== "string" || !resources.purpose.includes("MPS")) {
    findings.push(`${context}.hardware_resources.purpose must describe MPS use`);
  }
  if (resources.apple_silicon !== true) {
    findings.push(`${context}.hardware_resources.apple_silicon must be true`);
  }
  if (resources.minimums_passed !== true) {
    findings.push(`${context}.hardware_resources.minimums_passed must be true`);
  }
  if (resources.minimum_memory_gib !== minimumLocalMlMemoryGiB) {
    findings.push(`${context}.hardware_resources.minimum_memory_gib must be ${minimumLocalMlMemoryGiB}`);
  }
  if (resources.minimum_logical_cpu_cores !== minimumLocalMlLogicalCpuCores) {
    findings.push(`${context}.hardware_resources.minimum_logical_cpu_cores must be ${minimumLocalMlLogicalCpuCores}`);
  }
  if (resources.minimum_apple_gpu_cores !== minimumLocalMlAppleGpuCores) {
    findings.push(`${context}.hardware_resources.minimum_apple_gpu_cores must be ${minimumLocalMlAppleGpuCores}`);
  }
  if (typeof resources.chip !== "string" || !resources.chip.includes("Apple")) {
    findings.push(`${context}.hardware_resources.chip must identify an Apple Silicon chip`);
  }
  if (
    typeof resources.cpu_logical_cores !== "number" ||
    resources.cpu_logical_cores < minimumLocalMlLogicalCpuCores
  ) {
    findings.push(`${context}.hardware_resources.cpu_logical_cores must be at least ${minimumLocalMlLogicalCpuCores}`);
  }
  if (typeof resources.memory_gib !== "number" || resources.memory_gib < minimumLocalMlMemoryGiB) {
    findings.push(`${context}.hardware_resources.memory_gib must be at least ${minimumLocalMlMemoryGiB}`);
  }
  if (
    typeof resources.gpu?.core_count !== "number" ||
    resources.gpu.core_count < minimumLocalMlAppleGpuCores
  ) {
    findings.push(`${context}.hardware_resources.gpu.core_count must be at least ${minimumLocalMlAppleGpuCores}`);
  }
  if (typeof resources.gpu?.metal_support !== "string" || !resources.gpu.metal_support.includes("Metal")) {
    findings.push(`${context}.hardware_resources.gpu.metal_support must prove Metal support`);
  }
  if (resources.system_profiler?.sanitized !== true) {
    findings.push(`${context}.hardware_resources.system_profiler.sanitized must be true`);
  }
}

function validateLocalMlEnvironmentReference(reference, context, findings) {
  const file = verifyFileReference(reference, context, findings);
  if (!file) return;
  const actualPath = relative(file);
  if (actualPath !== localMlEnvironmentPath) {
    findings.push(`${context}.path must be ${localMlEnvironmentPath}; found ${actualPath}`);
    return;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    findings.push(`${context} is not valid JSON: ${error.message}`);
    return;
  }
  if (data.schema_version !== localMlEnvironmentSchemaVersion) {
    findings.push(`${context} schema_version must be ${localMlEnvironmentSchemaVersion}`);
  }
  if (data.status !== "passed") {
    findings.push(`${context} status must be passed`);
  }
  if (!Array.isArray(data.blockers) || data.blockers.length !== 0) {
    findings.push(`${context} blockers must be an empty array`);
  }
  requireReferencePath(
    data.audit_script,
    "scripts/audit_local_ml_environment.py",
    `${context}.audit_script`,
    findings,
  );
  const projectFiles = Array.isArray(data.project_files) ? data.project_files : [];
  const byPath = new Map(projectFiles.map((item) => [item?.path, item]));
  for (const requiredPath of ["requirements.txt", "web/package.json", "web/package-lock.json"]) {
    requireReferencePath(
      byPath.get(requiredPath),
      requiredPath,
      `${context}.project_files.${requiredPath}`,
      findings,
    );
  }
  if (data.torch?.mps_built !== true || data.torch?.mps_available !== true) {
    findings.push(`${context} must prove PyTorch MPS is built and available`);
  }
  if (data.torch?.mps_tensor_smoke?.status !== "passed" || data.torch?.mps_tensor_smoke?.device !== "mps:0") {
    findings.push(`${context} must prove a PyTorch tensor allocation and computation on MPS`);
  }
  if (typeof data.torch?.config_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(data.torch.config_sha256)) {
    findings.push(`${context} must hash the PyTorch build configuration`);
  }
  if (data.ffmpeg?.available !== true) {
    findings.push(`${context} must prove FFmpeg is available`);
  }
  if (typeof data.ffmpeg?.binary?.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(data.ffmpeg.binary.sha256)) {
    findings.push(`${context} must hash-pin the FFmpeg binary`);
  }
  if (typeof data.python?.executable_file?.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(data.python.executable_file.sha256)) {
    findings.push(`${context} must hash-pin the Python executable`);
  }
  if (data.python?.pip_freeze?.returncode !== 0 || typeof data.python?.pip_freeze?.stdout_sha256 !== "string") {
    findings.push(`${context} must include a successful pip freeze hash`);
  }
  if (data.node?.node?.available !== true || typeof data.node?.node?.binary?.sha256 !== "string") {
    findings.push(`${context} must hash-pin the Node.js binary`);
  }
  if (data.node?.npm?.available !== true || typeof data.node?.npm?.binary?.sha256 !== "string") {
    findings.push(`${context} must hash-pin the npm entrypoint`);
  }
  if (!data.browser_runtime?.declared || !data.browser_runtime?.installed) {
    findings.push(`${context} must prove onnxruntime-web is declared and installed`);
  }
  validateLocalMlStorageHeadroom(data, context, findings);
  validateLocalMlHardwareResources(data, context, findings);
  validateLocalMlPackageProvenance(data, context, findings);
}

function validateCommand(command, context, findings) {
  if (!Array.isArray(command) || command.length === 0) {
    findings.push(`${context} must be a non-empty command array`);
    return false;
  }
  for (const [index, value] of command.entries()) {
    if (typeof value !== "string" || value.trim().length === 0) {
      findings.push(`${context}[${index}] must be a non-empty string`);
    }
  }
  return true;
}

function commandOptionValue(command, option, context, findings) {
  const indexes = command
    .map((value, index) => (value === option ? index : -1))
    .filter((index) => index !== -1);
  if (indexes.length === 0) {
    findings.push(`${context} must include ${option}`);
    return null;
  }
  if (indexes.length > 1) {
    findings.push(`${context} must include ${option} exactly once`);
  }
  const [index] = indexes;
  const value = command[index + 1];
  if (typeof value !== "string" || value.trim().length === 0 || value.startsWith("--")) {
    findings.push(`${context} must include a value after ${option}`);
    return null;
  }
  return value;
}

function validateEvaluationCommand(command, context, findings) {
  if (!validateCommand(command, context, findings)) return;
  if (command.includes("--allow-smoke-eval")) {
    findings.push(`${context} must not include --allow-smoke-eval for final validation evidence`);
  }
  const hasScript = command.some((value) => {
    const normalized = normalizeProjectPath(value, `${context} script`, []);
    return normalized === evaluationScriptPath || value.endsWith(evaluationScriptPath);
  });
  if (!hasScript) {
    findings.push(`${context} must invoke ${evaluationScriptPath}`);
  }
  for (const [option, expectedPath] of Object.entries({
    "--checkpoint": finalCheckpointPath,
    "--training-provenance": finalTrainingProvenancePath,
    "--train-manifest": finalManifestPaths.train,
    "--validation-manifest": finalManifestPaths.validation,
    "--test-manifest": finalManifestPaths.test,
    "--challenge-manifest": finalNegativeChallengePath,
    "--output-report": finalValidationReportPath,
    "--calibrated-provenance": finalCalibratedProvenancePath,
  })) {
    const value = commandOptionValue(command, option, context, findings);
    if (!value) continue;
    const actualPath = normalizeProjectPath(value, `${context} ${option}`, findings);
    if (actualPath !== expectedPath) {
      findings.push(`${context} ${option} must be ${expectedPath}; found ${actualPath ?? value}`);
    }
  }
}

function validateEnvironmentFiles(files, context, findings) {
  if (!Array.isArray(files) || files.length === 0) {
    findings.push(`${context} must be a non-empty array`);
    return;
  }
  const seen = new Set();
  let localMlReference = null;
  for (const [index, reference] of files.entries()) {
    const file = verifyFileReference(reference, `${context}[${index}]`, findings);
    if (file) {
      const relativePath = relative(file);
      seen.add(relativePath);
      if (relativePath === localMlEnvironmentPath) localMlReference = reference;
    }
  }
  for (const requiredPath of requiredEnvironmentPaths) {
    if (!seen.has(requiredPath)) findings.push(`${context} must include ${requiredPath}`);
  }
  if (localMlReference) {
    validateLocalMlEnvironmentReference(localMlReference, `${context}.${localMlEnvironmentPath}`, findings);
  }
}

function sameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function compareManifestSummary(left, right, context, findings) {
  if (!left || !right) {
    findings.push(`${context} must be present in validation report and calibrated provenance`);
    return;
  }
  for (const key of [
    "path",
    "split",
    "dataset_id",
    "label_count",
    "clip_count",
    "min_clips_per_label_per_split",
    "sha256",
  ]) {
    if (left[key] !== right[key]) {
      findings.push(`${context}.${key} must match between validation report and calibrated provenance`);
    }
  }
  for (const key of [
    "source_register",
    "dataset_source_mode",
    "external_dataset_import",
    "collection_plan",
    "consent_form",
    "vocabulary_review",
  ]) {
    if (!sameJson(left[key], right[key])) {
      findings.push(`${context}.${key} must match between validation report and calibrated provenance`);
    }
  }
}

function validateGeneratedBy(record, expectedMode, context, findings) {
  const generatedBy = record.generated_by;
  if (!generatedBy || typeof generatedBy !== "object" || Array.isArray(generatedBy)) {
    findings.push(`${context}.generated_by must be an object`);
    return;
  }
  if (generatedBy.tool !== evaluationScriptPath) {
    findings.push(`${context}.generated_by.tool must be ${evaluationScriptPath}`);
  }
  if (generatedBy.allow_smoke_eval !== false) {
    findings.push(`${context}.generated_by.allow_smoke_eval must be false for final evidence`);
  }
  if (generatedBy.evidence_mode !== expectedMode) {
    findings.push(`${context}.generated_by.evidence_mode must be ${expectedMode}`);
  }
  requireReferencePath(generatedBy.script, evaluationScriptPath, `${context}.generated_by.script`, findings);
  validateEvaluationCommand(generatedBy.command, `${context}.generated_by.command`, findings);
  validateEnvironmentFiles(generatedBy.environment_files, `${context}.generated_by.environment_files`, findings);
  validateLocalMlEnvironmentReference(
    generatedBy.local_ml_environment,
    `${context}.generated_by.local_ml_environment`,
    findings,
  );
}

export function validateFinalValidationEvidence({
  validation,
  calibrated,
  validationPath,
  calibratedPath,
  requireCanonicalPaths = true,
  evidenceMode = "final",
} = {}) {
  const findings = [];
  if (!validation || typeof validation !== "object" || Array.isArray(validation)) {
    findings.push("validation report must be an object");
    return findings;
  }
  if (!calibrated || typeof calibrated !== "object" || Array.isArray(calibrated)) {
    findings.push("calibrated provenance must be an object");
    return findings;
  }

  const validationFile = resolveProjectPath(validationPath, "validation report path", findings);
  const calibratedFile = resolveProjectPath(calibratedPath, "calibrated provenance path", findings);
  if (!validationFile || !calibratedFile) return findings;
  const validationRelativePath = relative(validationFile);
  const calibratedRelativePath = relative(calibratedFile);
  const expectedEvidenceMode = evidenceMode === "controlled_pilot" ? "controlled_pilot" : "final";
  const expectedValidationStatus = evidenceMode === "controlled_pilot"
    ? "controlled_pilot_validation_passed"
    : "candidate_final_validation_passed";
  const expectedEvidenceFlag = evidenceMode === "controlled_pilot"
    ? "controlled_pilot_evidence"
    : "final_model_evidence";

  if (requireCanonicalPaths) {
    if (validationRelativePath !== finalValidationReportPath) {
      findings.push(`validation report path must be ${finalValidationReportPath}; found ${validationRelativePath}`);
    }
    if (calibratedRelativePath !== finalCalibratedProvenancePath) {
      findings.push(`calibrated provenance path must be ${finalCalibratedProvenancePath}; found ${calibratedRelativePath}`);
    }
  }

  if (validation.schema_version !== validationReportSchemaVersion) {
    findings.push(`validation report schema_version must be ${validationReportSchemaVersion}`);
  }
  if (calibrated.schema_version !== calibratedProvenanceSchemaVersion) {
    findings.push(`calibrated provenance schema_version must be ${calibratedProvenanceSchemaVersion}`);
  }
  if (validation.evidence_mode !== expectedEvidenceMode) {
    findings.push(`validation report evidence_mode must be ${expectedEvidenceMode}`);
  }
  if (calibrated.evidence_mode !== expectedEvidenceMode) {
    findings.push(`calibrated provenance evidence_mode must be ${expectedEvidenceMode}`);
  }
  if (calibrated.calibration_status !== expectedValidationStatus) {
    findings.push(`calibrated provenance calibration_status must be ${expectedValidationStatus}`);
  }
  if (validation[expectedEvidenceFlag] !== true) {
    findings.push(`validation report ${expectedEvidenceFlag} must be true`);
  }
  if (calibrated[expectedEvidenceFlag] !== true) {
    findings.push(`calibrated provenance ${expectedEvidenceFlag} must be true`);
  }
  if (!isIsoDate(validation.created_at)) {
    findings.push("validation report created_at must be an ISO-compatible timestamp");
  }

  validateGeneratedBy(validation, expectedEvidenceMode, "validation report", findings);
  validateGeneratedBy(calibrated, expectedEvidenceMode, "calibrated provenance", findings);
  validateEvaluationCommand(validation.evaluation_command, "validation report evaluation_command", findings);
  validateEvaluationCommand(calibrated.evaluation_command, "calibrated provenance evaluation_command", findings);
  requireReferencePath(validation.evaluation_script, evaluationScriptPath, "validation report evaluation_script", findings);
  requireReferencePath(calibrated.evaluation_script, evaluationScriptPath, "calibrated provenance evaluation_script", findings);
  validateEnvironmentFiles(validation.environment_files, "validation report environment_files", findings);
  validateEnvironmentFiles(calibrated.evaluation_environment_files, "calibrated provenance evaluation_environment_files", findings);
  validateLocalMlEnvironmentReference(validation.local_ml_environment, "validation report local_ml_environment", findings);
  validateLocalMlEnvironmentReference(calibrated.local_ml_environment, "calibrated provenance local_ml_environment", findings);
  validateLocalMlEnvironmentReference(
    calibrated.evaluation_local_ml_environment,
    "calibrated provenance evaluation_local_ml_environment",
    findings,
  );

  if (validation.status !== expectedValidationStatus) {
    findings.push(`validation report status must be ${expectedValidationStatus}; found ${validation.status}`);
  }
  if (Array.isArray(validation.smoke_reasons) && validation.smoke_reasons.length > 0) {
    findings.push("validation report smoke_reasons must be empty for final evidence");
  }
  if (!validation.pass_status || !Object.values(validation.pass_status).every((value) => value === true)) {
    findings.push("validation report pass_status must all be true");
  }

  requireReferencePath(validation.model?.checkpoint, finalCheckpointPath, "validation.model.checkpoint", findings);
  requireReferencePath(
    validation.model?.training_provenance,
    finalTrainingProvenancePath,
    "validation.model.training_provenance",
    findings,
  );
  requireReferencePath(
    calibrated.source_training_provenance,
    finalTrainingProvenancePath,
    "calibrated provenance source_training_provenance",
    findings,
  );
  if (validation.model?.runtime_device !== "mps") {
    findings.push("validation.model.runtime_device must be mps for final local-GPU evidence");
  }
  if (calibrated.framework?.device !== "mps") {
    findings.push("calibrated provenance framework.device must be mps for final local-GPU evidence");
  }
  if (!isFinalRawFrameArchitecture(validation.model?.architecture)) {
    findings.push(`validation.model.architecture must be one of: ${finalRawFrameArchitectureList()}`);
  }
  if (!isFinalRawFrameArchitecture(calibrated.architecture)) {
    findings.push(`calibrated provenance architecture must be one of: ${finalRawFrameArchitectureList()}`);
  }
  if (validation.model?.architecture !== calibrated.architecture) {
    findings.push("validation.model.architecture must match calibrated provenance architecture");
  }
  if (
    validation.model?.training_provenance?.sha256
    && calibrated.source_training_provenance?.sha256
    && validation.model.training_provenance.sha256 !== calibrated.source_training_provenance.sha256
  ) {
    findings.push("calibrated provenance source_training_provenance.sha256 must match validation.model.training_provenance.sha256");
  }

  if (calibrated.validation_report?.path !== validationRelativePath) {
    findings.push("calibrated provenance validation_report.path must match validation report path");
  }
  if (calibrated.validation_report?.sha256 !== sha256File(validationFile)) {
    findings.push("calibrated provenance validation_report.sha256 must match validation report JSON");
  }
  if (calibrated.threshold_policy?.type !== "fail_closed") {
    findings.push("calibrated provenance threshold_policy.type must be fail_closed");
  }
  const threshold = calibrated.threshold_policy?.selected_threshold;
  if (typeof threshold !== "number" || threshold <= 0 || threshold >= 1) {
    findings.push("calibrated provenance threshold_policy.selected_threshold must be a number between 0 and 1");
  }
  if (calibrated.threshold_policy?.source !== validationRelativePath) {
    findings.push("calibrated provenance threshold_policy.source must match validation report path");
  }
  if (calibrated.threshold_policy?.source_sha256 !== sha256File(validationFile)) {
    findings.push("calibrated provenance threshold_policy.source_sha256 must match validation report JSON");
  }
  if (
    typeof calibrated.threshold_policy?.negative_challenge_false_pass_rate === "number"
    && typeof validation.negative_challenge?.metrics?.false_pass_rate === "number"
    && calibrated.threshold_policy.negative_challenge_false_pass_rate !== validation.negative_challenge.metrics.false_pass_rate
  ) {
    findings.push("calibrated threshold_policy.negative_challenge_false_pass_rate must match validation report");
  }

  if (!Array.isArray(validation.manifests)) {
    findings.push("validation report manifests must be an array");
  } else {
    const bySplit = new Map();
    for (const manifest of validation.manifests) {
      if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        findings.push("validation report manifests must contain objects");
        continue;
      }
      bySplit.set(manifest.split, manifest);
      const expectedPath = finalManifestPaths[manifest.split];
      if (!expectedPath) {
        findings.push(`validation report contains unexpected manifest split: ${manifest.split}`);
        continue;
      }
      requireReferencePath({ path: manifest.path, sha256: manifest.sha256 }, expectedPath, `validation manifest ${manifest.split}`, findings);
      if (manifest.label_count < 75 || manifest.label_count > 100) {
        findings.push(`validation manifest ${manifest.split} must have 75-100 labels; found ${manifest.label_count}`);
      }
      validateSourceRegisterReference(
        manifest.source_register,
        `validation manifest ${manifest.split}.source_register`,
        findings,
      );
      validateManifestDatasetSource(manifest, `validation manifest ${manifest.split}`, findings);
      if (!manifest.vocabulary_review || typeof manifest.vocabulary_review !== "object") {
        findings.push(`validation manifest ${manifest.split} must include vocabulary_review evidence`);
      }
    }
    const requiredSplits = Object.keys(finalManifestPaths);
    for (const split of requiredSplits) {
      if (!bySplit.has(split)) findings.push(`validation report manifests must include ${split}`);
    }
    if (bySplit.size !== requiredSplits.length) {
      findings.push("validation report manifests must contain exactly train, validation, and test");
    }

    const calibratedBySplit = new Map(
      Array.isArray(calibrated.manifests)
        ? calibrated.manifests.filter((item) => item && typeof item === "object").map((item) => [item.split, item])
        : [],
    );
    if (!Array.isArray(calibrated.manifests)) {
      findings.push("calibrated provenance manifests must be an array");
    }
    for (const split of requiredSplits) {
      compareManifestSummary(bySplit.get(split), calibratedBySplit.get(split), `manifest ${split}`, findings);
    }
    if (calibratedBySplit.size !== requiredSplits.length) {
      findings.push("calibrated provenance manifests must contain exactly train, validation, and test");
    }
  }

  const challenge = validation.negative_challenge;
  if (!challenge || typeof challenge !== "object" || Array.isArray(challenge)) {
    findings.push("validation report must include negative_challenge evidence");
  } else {
    requireReferencePath(challenge.manifest, finalNegativeChallengePath, "validation negative_challenge.manifest", findings);
    const falsePassRate = challenge.metrics?.false_pass_rate;
    if (typeof falsePassRate !== "number" || falsePassRate >= targetNegativeChallengeFalsePassRate) {
      findings.push(`validation negative_challenge false_pass_rate must be below ${targetNegativeChallengeFalsePassRate}`);
    }
    for (const requiredType of ["empty_camera", "no_hands_visible", "low_light", "off_center"]) {
      const row = challenge.metrics?.by_type?.[requiredType];
      if (!row) {
        findings.push(`validation negative_challenge must include type ${requiredType}`);
      } else if (row.examples < 5) {
        findings.push(`validation negative_challenge type ${requiredType} must include at least 5 examples`);
      }
    }
    validateSourceRegisterReference(
      challenge.manifest?.source_register,
      "validation negative_challenge.manifest.source_register",
      findings,
    );
    validateManifestDatasetSource(challenge.manifest, "validation negative_challenge.manifest", findings);
    if (!challenge.manifest?.vocabulary_review || typeof challenge.manifest.vocabulary_review !== "object") {
      findings.push("validation negative_challenge.manifest must include vocabulary_review evidence");
    }
  }

  if (!calibrated.negative_challenge || typeof calibrated.negative_challenge !== "object") {
    findings.push("calibrated provenance must include negative_challenge evidence");
  } else if (challenge && typeof challenge === "object") {
    if (calibrated.negative_challenge.manifest?.path !== challenge.manifest?.path) {
      findings.push("calibrated provenance negative_challenge.manifest.path must match validation report");
    }
    if (calibrated.negative_challenge.manifest?.sha256 !== challenge.manifest?.sha256) {
      findings.push("calibrated provenance negative_challenge.manifest.sha256 must match validation report");
    }
    if (!sameJson(calibrated.negative_challenge.manifest?.source_register, challenge.manifest?.source_register)) {
      findings.push("calibrated provenance negative_challenge.manifest.source_register must match validation report");
    }
    if (!sameJson(calibrated.negative_challenge.manifest?.dataset_source_mode, challenge.manifest?.dataset_source_mode)) {
      findings.push("calibrated provenance negative_challenge.manifest.dataset_source_mode must match validation report");
    }
    if (!sameJson(calibrated.negative_challenge.manifest?.external_dataset_import, challenge.manifest?.external_dataset_import)) {
      findings.push("calibrated provenance negative_challenge.manifest.external_dataset_import must match validation report");
    }
    if (calibrated.negative_challenge.false_pass_rate !== challenge.metrics?.false_pass_rate) {
      findings.push("calibrated provenance negative_challenge.false_pass_rate must match validation report");
    }
  }

  return findings;
}
