import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  compactClipNormRawFrameArchitecture,
  factorizedRawFrameArchitecture,
  finalRawFrameArchitecture,
  finalRawFrameArchitectures,
  localMlEnvironmentPath,
  motionTemporalRawFrameArchitecture,
  sourceRegisterPath,
  validateFinalValidationEvidence,
  validateLocalMlHardwareResources,
  validateLocalMlPackageProvenance,
  validateLocalMlStorageHeadroom,
} from "./final_evidence_contract.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultCalibratedProvenance = path.join(root, "artifacts", "rawframe-model", "calibrated-provenance.json");
const defaultExportProvenance = path.join(root, "web", "public", "model", "asl-pilot-rawframe-v0-export-provenance.json");
const defaultBrowserArtifact = path.join(root, "web", "public", "model", "asl-pilot-rawframe-v0.onnx");
const defaultModelCard = path.join(root, "web", "public", "model", "model-card.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const collectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const consentVersion = "asl-pilot-dataset-consent-v1";
const acceptedVocabularyGateStatuses = new Set(["reviewed", "source_curated"]);
const targetNegativeChallengeFalsePassRate = 0.05;
const requiredNegativeChallengeTypes = [
  "idle_hands",
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "hands_cropped_out",
  "waving",
  "thumbs_up",
  "counting",
  "fingerspelling_like_motion",
  "wrong_location",
  "wrong_palm_orientation",
  "partial_sign",
  "non_target_asl_sign",
  "casual_non_asl_gesture",
  "mouth_touch",
  "hand_clap",
];
const localMlEnvironmentSchemaVersion = "asl-pilot-local-ml-environment/v1";
const architectureFamilies = new Map([
  [finalRawFrameArchitecture, "raw_frame_compact_3d_cnn"],
  [compactClipNormRawFrameArchitecture, "raw_frame_compact_3d_cnn_clip_norm"],
  [factorizedRawFrameArchitecture, "raw_frame_factorized_3d_cnn"],
  [motionTemporalRawFrameArchitecture, "raw_frame_motion_2d_temporal_cnn"],
  ["small_2d_cnn_frame_encoder_with_temporal_mean_pooling", "raw_frame_cnn_temporal_pool"],
]);
const firstPartyDatasetSourceMode = "first_party_consent_capture";
const externalDatasetSourceMode = "approved_external_raw_video_source";
const allowedDatasetSourceModes = new Set([firstPartyDatasetSourceMode, externalDatasetSourceMode]);

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
    if (item === "--controlled-pilot") {
      args.controlledPilot = true;
      continue;
    }
    if ([
      "--validation-report",
      "--calibrated-provenance",
      "--onnx-export-provenance",
      "--output",
      "--dry-run-output",
    ].includes(item)) {
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
  node scripts/promote_trained_model_card.mjs \\
    --validation-report artifacts/rawframe-model/validation-report.json \\
    --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json \\
    --onnx-export-provenance web/public/model/asl-pilot-rawframe-v0-export-provenance.json \\
    [--output web/public/model/model-card.json] [--dry-run] [--controlled-pilot] [--dry-run-output output/promoted-model-card.json]

Builds a trained model-card only from final validation and ONNX export evidence.
Smoke artifacts are rejected. With --controlled-pilot, the script accepts the
controlled production pilot evidence mode instead of the research-grade final
status. With --dry-run-output, the generated card is written to an alternate
path for audit comparison without touching the active model card.
`);
}

function resolveProjectPath(value, context, mustExist = true) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  if (mustExist && !fs.existsSync(resolved)) {
    throw new Error(`${context} does not exist: ${relative(resolved)}`);
  }
  return resolved;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function displayPath(file) {
  return file.startsWith(`${root}${path.sep}`) ? relative(file) : file;
}

function resolveDryRunOutputPath(value) {
  if (path.isAbsolute(value)) return path.resolve(value);
  return resolveProjectPath(value, "--dry-run-output", false);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function architectureFamily(architecture) {
  return architectureFamilies.get(architecture) ?? null;
}

function verifyReference(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    findings.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (typeof reference.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
    findings.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  let file;
  try {
    file = resolveProjectPath(reference.path, `${context}.path`);
  } catch (error) {
    findings.push(error instanceof Error ? error.message : String(error));
    return null;
  }
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    findings.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function validateRandomInitializationEvidence(evidence, context, findings) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    findings.push(`${context} must include random_initialization_evidence`);
    return;
  }
  if (!Number.isInteger(evidence.seed)) {
    findings.push(`${context}.seed must be an integer`);
  }
  for (const key of ["initial_model_state_digest", "final_model_state_digest"]) {
    const digest = evidence[key];
    if (!digest || typeof digest !== "object" || Array.isArray(digest)) {
      findings.push(`${context}.${key} must be an object`);
      continue;
    }
    if (digest.algorithm !== "canonical_state_dict_sha256_v1") {
      findings.push(`${context}.${key}.algorithm must be canonical_state_dict_sha256_v1`);
    }
    if (typeof digest.parameter_count !== "number" || digest.parameter_count <= 0) {
      findings.push(`${context}.${key}.parameter_count must be positive`);
    }
    if (typeof digest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(digest.sha256)) {
      findings.push(`${context}.${key}.sha256 must be a lowercase SHA-256 digest`);
    }
  }
}

function validateLabelMap(labelToIndex, findings) {
  if (!labelToIndex || typeof labelToIndex !== "object" || Array.isArray(labelToIndex)) {
    findings.push("export provenance model.label_to_index must be an object");
    return;
  }
  const entries = Object.entries(labelToIndex);
  if (entries.length < 75 || entries.length > 100) {
    findings.push(`label_to_index must contain 75-100 labels; found ${entries.length}`);
  }
  const indexes = entries.map(([, value]) => value);
  if (!indexes.every((value) => Number.isInteger(value) && value >= 0)) {
    findings.push("label_to_index values must be non-negative integers");
    return;
  }
  const unique = new Set(indexes);
  if (unique.size !== indexes.length) {
    findings.push("label_to_index values must be unique");
    return;
  }
  for (let index = 0; index < indexes.length; index += 1) {
    if (!unique.has(index)) {
      findings.push("label_to_index values must be dense from zero");
      return;
    }
  }
}

function currentVocabularyHash() {
  return sha256Text(fs.readFileSync(vocabularyPath, "utf8"));
}

function vocabularyCount() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/\n\s*\["[^"]+",/g)].length;
}

function validateVocabularyReview(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include vocabulary_review evidence`);
    return null;
  }
  if (!acceptedVocabularyGateStatuses.has(reference.status)) {
    findings.push(`${context}.status must be reviewed or source_curated`);
  }
  const evidenceFile = verifyReference(reference.evidence, `${context}.evidence`, findings);
  if (!reference.vocabulary_source || typeof reference.vocabulary_source !== "object") {
    findings.push(`${context}.vocabulary_source must be an object`);
    return null;
  }
  verifyReference(
    {
      path: reference.vocabulary_source.path,
      sha256: reference.vocabulary_source.sha256,
    },
    `${context}.vocabulary_source`,
    findings,
  );
  if (reference.vocabulary_source.path !== relative(vocabularyPath)) {
    findings.push(`${context}.vocabulary_source.path must be ${relative(vocabularyPath)}`);
  }
  if (reference.vocabulary_source.sha256 !== currentVocabularyHash()) {
    findings.push(`${context}.vocabulary_source.sha256 must match the current vocabulary source`);
  }
  if (reference.vocabulary_source.item_count !== vocabularyCount()) {
    findings.push(`${context}.vocabulary_source.item_count must match the current vocabulary count`);
  }
  if (evidenceFile) {
    const evidence = readJson(evidenceFile);
    if (evidence.schema_version !== "asl-pilot-vocabulary-review-evidence/v1") {
      findings.push(`${context}.evidence schema_version is invalid`);
    }
    if (!acceptedVocabularyGateStatuses.has(evidence.status)) {
      findings.push(`${context}.evidence status must be reviewed or source_curated`);
    }
    if (evidence.vocabulary_source?.sha256 !== reference.vocabulary_source.sha256) {
      findings.push(`${context}.evidence vocabulary_source.sha256 must match vocabulary_review`);
    }
    if (evidence.item_count !== reference.vocabulary_source.item_count) {
      findings.push(`${context}.evidence item_count must match vocabulary_review`);
    }
  }
  return reference;
}

function validateConsentForm(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include consent_form evidence`);
    return null;
  }
  verifyReference(reference, context, findings);
  if (reference.path !== relative(consentFormPath)) {
    findings.push(`${context}.path must be ${relative(consentFormPath)}`);
  }
  if (reference.sha256 !== sha256File(consentFormPath)) {
    findings.push(`${context}.sha256 must match the current consent form`);
  }
  if (reference.consent_version !== consentVersion) {
    findings.push(`${context}.consent_version must be ${consentVersion}`);
  }
  return reference;
}

function validateCollectionPlan(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include collection_plan evidence`);
    return null;
  }
  verifyReference(reference, context, findings);
  if (reference.path !== relative(collectionPlanPath)) {
    findings.push(`${context}.path must be ${relative(collectionPlanPath)}`);
  }
  if (fs.existsSync(collectionPlanPath) && reference.sha256 !== sha256File(collectionPlanPath)) {
    findings.push(`${context}.sha256 must match the current collection plan`);
  }
  if (!acceptedVocabularyGateStatuses.has(reference.review_gate_status)) {
    findings.push(`${context}.review_gate_status must be reviewed or source_curated`);
  }
  for (const key of ["assignment_count", "negative_challenge_assignment_count"]) {
    if (!Number.isInteger(reference[key]) || reference[key] < 0) {
      findings.push(`${context}.${key} must be a non-negative integer`);
    }
  }
  return reference;
}

function validateSourceRegister(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include source_register evidence`);
    return null;
  }
  const file = verifyReference(reference, context, findings);
  if (!file) return null;
  if (reference.path !== sourceRegisterPath) {
    findings.push(`${context}.path must be ${sourceRegisterPath}`);
  }
  if (reference.sha256 !== sha256File(file)) {
    findings.push(`${context}.sha256 must match the current source register`);
  }
  try {
    const data = readJson(file);
    if (data.schema_version !== "asl-pilot-dataset-source-register/v1") {
      findings.push(`${context} schema_version is invalid`);
    }
    if (data.review_method?.default_public_dataset_policy !== "blocked_without_external_rights_review") {
      findings.push(`${context} must declare blocked_without_external_rights_review`);
    }
  } catch (error) {
    findings.push(`${context} must be valid JSON: ${error.message}`);
  }
  return reference;
}

function datasetSourceMode(record) {
  return record?.dataset_source_mode ?? firstPartyDatasetSourceMode;
}

function validateExternalDatasetImport(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include external_dataset_import evidence`);
    return null;
  }
  if (typeof reference.source_id !== "string" || reference.source_id.trim().length === 0) {
    findings.push(`${context}.source_id must be a non-empty string`);
  }
  const sourceAuditFile = verifyReference(reference.source_audit, `${context}.source_audit`, findings);
  if (sourceAuditFile) {
    try {
      const audit = readJson(sourceAuditFile);
      if (audit.source_id !== reference.source_id) {
        findings.push(`${context}.source_audit source_id must match ${context}.source_id`);
      }
      if (!["passed", "accepted", "approved"].includes(audit.status)) {
        findings.push(`${context}.source_audit status must be passed, accepted, or approved`);
      }
    } catch (error) {
      findings.push(`${context}.source_audit must be valid JSON: ${error.message}`);
    }
  }
  return reference;
}

function validateManifestDatasetSource(manifest, context, findings, references) {
  const mode = datasetSourceMode(manifest);
  if (!allowedDatasetSourceModes.has(mode)) {
    findings.push(`${context}.dataset_source_mode must be one of ${[...allowedDatasetSourceModes].join(", ")}`);
    return;
  }
  if (mode === externalDatasetSourceMode) {
    validateExternalDatasetImport(manifest.external_dataset_import, `${context}.external_dataset_import`, findings);
    return;
  }
  const collectionPlan = validateCollectionPlan(
    manifest.collection_plan,
    `${context}.collection_plan`,
    findings,
  );
  if (collectionPlan) references.collectionPlanReferences.push(collectionPlan);
  const consentForm = validateConsentForm(
    manifest.consent_form,
    `${context}.consent_form`,
    findings,
  );
  if (consentForm) references.consentFormReferences.push(consentForm);
}

function validateLocalMlEnvironment(reference, context, findings) {
  const file = verifyReference(reference, context, findings);
  if (!file) return;
  if (relative(file) !== localMlEnvironmentPath) {
    findings.push(`${context}.path must be ${localMlEnvironmentPath}`);
    return;
  }
  let data;
  try {
    data = readJson(file);
  } catch (error) {
    findings.push(`${context} must be valid JSON: ${error.message}`);
    return;
  }
  if (data.schema_version !== localMlEnvironmentSchemaVersion) {
    findings.push(`${context}.schema_version must be ${localMlEnvironmentSchemaVersion}`);
  }
  if (data.status !== "passed") {
    findings.push(`${context}.status must be passed`);
  }
  if (!Array.isArray(data.blockers) || data.blockers.length !== 0) {
    findings.push(`${context}.blockers must be empty`);
  }
  verifyReference(data.audit_script, `${context}.audit_script`, findings);
  const projectFiles = new Map((data.project_files ?? []).map((item) => [item?.path, item]));
  for (const requiredPath of ["requirements.txt", "web/package.json", "web/package-lock.json"]) {
    const projectFile = projectFiles.get(requiredPath);
    const resolved = verifyReference(projectFile, `${context}.project_files.${requiredPath}`, findings);
    if (resolved && relative(resolved) !== requiredPath) {
      findings.push(`${context}.project_files.${requiredPath}.path must be ${requiredPath}`);
    }
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

function validateCommand(record, key, context, findings) {
  const command = record?.[key];
  if (!Array.isArray(command) || command.length === 0) {
    findings.push(`${context}.${key} must be a non-empty command array`);
    return;
  }
  for (const [index, value] of command.entries()) {
    if (typeof value !== "string" || value.trim().length === 0) {
      findings.push(`${context}.${key}[${index}] must be a non-empty string`);
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
    const file = verifyReference(reference, `${context}[${index}]`, findings);
    if (file) {
      const relativePath = relative(file);
      seen.add(relativePath);
      if (relativePath === localMlEnvironmentPath) localMlReference = reference;
    }
  }
  for (const requiredPath of ["requirements.txt", "web/package.json", "web/package-lock.json", localMlEnvironmentPath]) {
    if (!seen.has(requiredPath)) findings.push(`${context} must include ${requiredPath}`);
  }
  if (localMlReference) validateLocalMlEnvironment(localMlReference, `${context}.${localMlEnvironmentPath}`, findings);
}

function compareManifestSummary(left, right, context, findings) {
  if (!left || !right) {
    findings.push(`${context} must be present in validation report and calibrated provenance`);
    return;
  }
  for (const key of ["path", "split", "dataset_id", "label_count", "clip_count", "sha256"]) {
    if (left[key] !== right[key]) {
      findings.push(`${context}.${key} must match between validation report and calibrated provenance`);
    }
  }
  if (JSON.stringify(left.source_register ?? null) !== JSON.stringify(right.source_register ?? null)) {
    findings.push(`${context}.source_register must match between validation report and calibrated provenance`);
  }
  if (JSON.stringify(left.dataset_source_mode ?? firstPartyDatasetSourceMode) !== JSON.stringify(right.dataset_source_mode ?? firstPartyDatasetSourceMode)) {
    findings.push(`${context}.dataset_source_mode must match between validation report and calibrated provenance`);
  }
  if (JSON.stringify(left.external_dataset_import ?? null) !== JSON.stringify(right.external_dataset_import ?? null)) {
    findings.push(`${context}.external_dataset_import must match between validation report and calibrated provenance`);
  }
  if (JSON.stringify(left.collection_plan ?? null) !== JSON.stringify(right.collection_plan ?? null)) {
    findings.push(`${context}.collection_plan must match between validation report and calibrated provenance`);
  }
  if (JSON.stringify(left.consent_form ?? null) !== JSON.stringify(right.consent_form ?? null)) {
    findings.push(`${context}.consent_form must match between validation report and calibrated provenance`);
  }
  if (JSON.stringify(left.vocabulary_review ?? null) !== JSON.stringify(right.vocabulary_review ?? null)) {
    findings.push(`${context}.vocabulary_review must match between validation report and calibrated provenance`);
  }
}

function containsSmokeText(value) {
  return JSON.stringify(value).toLowerCase().match(/\b(smoke|synthetic|not-asl)\b/) !== null;
}

function validateInputs(validation, calibrated, exportReport, paths, findings, options = {}) {
  const expectedEvidenceMode = options.controlledPilot ? "controlled_pilot" : "final";
  const expectedValidationStatus = options.controlledPilot
    ? "controlled_pilot_validation_passed"
    : "candidate_final_validation_passed";
  const requiredChallengeTypes = options.controlledPilot
    ? ["empty_camera", "no_hands_visible", "low_light", "off_center"]
    : requiredNegativeChallengeTypes;
  findings.push(...validateFinalValidationEvidence({
    validation,
    calibrated,
    validationPath: paths.validationPath,
    calibratedPath: paths.calibratedPath,
    evidenceMode: expectedEvidenceMode,
  }));
  const vocabularyReviewReferences = [];
  const consentFormReferences = [];
  const collectionPlanReferences = [];
  const sourceRegisterReferences = [];
  if (validation.status !== expectedValidationStatus) {
    findings.push(`validation report status must be ${expectedValidationStatus}; found ${validation.status}`);
  }
  if (containsSmokeText(validation.smoke_reasons ?? [])) {
    findings.push("validation report contains smoke/synthetic reasons");
  }
  if (!validation.pass_status || !Object.values(validation.pass_status).every((value) => value === true)) {
    findings.push("validation report pass_status must all be true");
  }
  validateCommand(validation, "evaluation_command", "validation report", findings);
  verifyReference(validation.evaluation_script, "validation report evaluation_script", findings);
  validateEnvironmentFiles(validation.environment_files, "validation report environment_files", findings);
  validateLocalMlEnvironment(validation.local_ml_environment, "validation report local_ml_environment", findings);
  if (validation.pass_status?.negative_challenge_false_pass_rate !== true) {
    findings.push("validation report pass_status.negative_challenge_false_pass_rate must be true");
  }
  const manifestSplits = new Set((validation.manifests ?? []).map((item) => item.split));
  if (manifestSplits.size !== 3 || !["train", "validation", "test"].every((split) => manifestSplits.has(split))) {
    findings.push("validation report must include train, validation, and test manifest summaries");
  }
  const validationManifestsBySplit = new Map();
  for (const manifest of validation.manifests ?? []) {
    verifyReference(
      {
        path: manifest.path,
        sha256: manifest.sha256,
      },
      `validation manifest ${manifest.split}`,
      findings,
    );
    validationManifestsBySplit.set(manifest.split, manifest);
    if (manifest.label_count < 75 || manifest.label_count > 100) {
      findings.push(`validation manifest ${manifest.split} must have 75-100 labels; found ${manifest.label_count}`);
    }
    const sourceRegister = validateSourceRegister(
      manifest.source_register,
      `validation manifest ${manifest.split}.source_register`,
      findings,
    );
    if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
    validateManifestDatasetSource(manifest, `validation manifest ${manifest.split}`, findings, {
      consentFormReferences,
      collectionPlanReferences,
    });
    const vocabularyReview = validateVocabularyReview(
      manifest.vocabulary_review,
      `validation manifest ${manifest.split}.vocabulary_review`,
      findings,
    );
    if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
    if (containsSmokeText(manifest.dataset_id ?? "")) {
      findings.push(`validation manifest ${manifest.split} uses smoke/synthetic dataset_id`);
    }
  }
  const negativeChallenge = validation.negative_challenge;
  if (!negativeChallenge || typeof negativeChallenge !== "object") {
    findings.push("validation report must include negative_challenge evidence");
  } else {
    verifyReference(negativeChallenge.manifest, "validation.negative_challenge.manifest", findings);
    const sourceRegister = validateSourceRegister(
      negativeChallenge.manifest?.source_register,
      "validation.negative_challenge.manifest.source_register",
      findings,
    );
    if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
    const vocabularyReview = validateVocabularyReview(
      negativeChallenge.manifest?.vocabulary_review,
      "validation.negative_challenge.manifest.vocabulary_review",
      findings,
    );
    if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
    validateManifestDatasetSource(negativeChallenge.manifest, "validation.negative_challenge.manifest", findings, {
      consentFormReferences,
      collectionPlanReferences,
    });
    const falsePassRate = negativeChallenge.metrics?.false_pass_rate;
    if (typeof falsePassRate !== "number" || falsePassRate >= targetNegativeChallengeFalsePassRate) {
      findings.push(`validation negative_challenge false_pass_rate must be below ${targetNegativeChallengeFalsePassRate}`);
    }
    const byType = negativeChallenge.metrics?.by_type;
    for (const requiredType of requiredChallengeTypes) {
      if (!byType?.[requiredType]) {
        findings.push(`validation negative_challenge must include type ${requiredType}`);
      } else if (byType[requiredType].examples < 5) {
        findings.push(`validation negative_challenge type ${requiredType} must include at least 5 examples`);
      }
    }
  }

  if (calibrated.initialization !== "random") {
    findings.push("calibrated provenance initialization must be random");
  }
  if (calibrated.framework?.device !== "mps") {
    findings.push("calibrated provenance framework.device must be mps for final local-GPU evidence");
  }
  if (validation.model?.runtime_device !== "mps") {
    findings.push("validation report model.runtime_device must be mps for final local-GPU evidence");
  }
  if (!finalRawFrameArchitectures.includes(calibrated.architecture)) {
    findings.push(`calibrated provenance architecture must be one of: ${finalRawFrameArchitectures.join(", ")}`);
  }
  if (!finalRawFrameArchitectures.includes(validation.model?.architecture)) {
    findings.push(`validation report model.architecture must be one of: ${finalRawFrameArchitectures.join(", ")}`);
  }
  if (!finalRawFrameArchitectures.includes(exportReport.model?.architecture)) {
    findings.push(`ONNX export provenance model.architecture must be one of: ${finalRawFrameArchitectures.join(", ")}`);
  }
  if (validation.model?.architecture !== calibrated.architecture) {
    findings.push("validation report model.architecture must match calibrated provenance architecture");
  }
  if (exportReport.model?.architecture !== calibrated.architecture) {
    findings.push("ONNX export provenance model.architecture must match calibrated provenance architecture");
  }
  validateRandomInitializationEvidence(
    calibrated.random_initialization_evidence,
    "calibrated provenance random_initialization_evidence",
    findings,
  );
  validateCommand(calibrated, "training_command", "calibrated provenance", findings);
  verifyReference(calibrated.training_script, "calibrated provenance training_script", findings);
  validateEnvironmentFiles(calibrated.environment_files, "calibrated provenance environment_files", findings);
  validateLocalMlEnvironment(calibrated.local_ml_environment, "calibrated provenance local_ml_environment", findings);
  validateCommand(calibrated, "evaluation_command", "calibrated provenance", findings);
  verifyReference(calibrated.evaluation_script, "calibrated provenance evaluation_script", findings);
  validateEnvironmentFiles(
    calibrated.evaluation_environment_files,
    "calibrated provenance evaluation_environment_files",
    findings,
  );
  validateLocalMlEnvironment(
    calibrated.evaluation_local_ml_environment,
    "calibrated provenance evaluation_local_ml_environment",
    findings,
  );
  if (!Array.isArray(calibrated.pretrained_components) || calibrated.pretrained_components.length !== 0) {
    findings.push("calibrated provenance pretrained_components must be an empty array");
  }
  if (calibrated.threshold_policy?.type !== "fail_closed") {
    findings.push("calibrated provenance threshold_policy.type must be fail_closed");
  }
  const threshold = calibrated.threshold_policy?.selected_threshold;
  if (typeof threshold !== "number" || threshold <= 0 || threshold >= 1) {
    findings.push("calibrated provenance selected_threshold must be between 0 and 1");
  }
  if (calibrated.validation_report?.path !== relative(resolveProjectPath(validation.__path, "validation report"))) {
    findings.push("calibrated provenance validation_report.path must match validation report");
  }
  if (calibrated.validation_report?.sha256 !== sha256File(resolveProjectPath(validation.__path, "validation report"))) {
    findings.push("calibrated provenance validation_report.sha256 must match validation report");
  }
  if (!calibrated.negative_challenge || typeof calibrated.negative_challenge !== "object") {
    findings.push("calibrated provenance must include negative_challenge evidence");
  } else if (negativeChallenge && typeof negativeChallenge === "object") {
    verifyReference(calibrated.negative_challenge.manifest, "calibrated provenance negative_challenge.manifest", findings);
    if (calibrated.negative_challenge.manifest?.path !== negativeChallenge.manifest?.path) {
      findings.push("calibrated provenance negative_challenge.manifest.path must match validation report");
    }
    if (calibrated.negative_challenge.manifest?.sha256 !== negativeChallenge.manifest?.sha256) {
      findings.push("calibrated provenance negative_challenge.manifest.sha256 must match validation report");
    }
    if (calibrated.negative_challenge.false_pass_rate !== negativeChallenge.metrics?.false_pass_rate) {
      findings.push("calibrated provenance negative_challenge.false_pass_rate must match validation report");
    }
  }

  if (exportReport.status !== "exported") {
    findings.push(`ONNX export provenance status must be exported; found ${exportReport.status}`);
  }
  if (exportReport.schema_version !== "asl-pilot-onnx-export-provenance/v1") {
    findings.push("ONNX export provenance schema_version must be asl-pilot-onnx-export-provenance/v1");
  }
  if (exportReport.evidence_mode !== expectedEvidenceMode) {
    findings.push(`ONNX export provenance evidence_mode must be ${expectedEvidenceMode}`);
  }
  if (exportReport.generated_by?.tool !== "scripts/export_onnx_model.py") {
    findings.push("ONNX export provenance generated_by.tool must be scripts/export_onnx_model.py");
  }
  if (exportReport.generated_by?.allow_smoke_export !== false) {
    findings.push("ONNX export provenance generated_by.allow_smoke_export must be false");
  }
  if (exportReport.finality !== "candidate_final_artifact") {
    findings.push(`ONNX export provenance finality must be candidate_final_artifact; found ${exportReport.finality}`);
  }
  if (exportReport.export_format !== "onnx") {
    findings.push("ONNX export provenance export_format must be onnx");
  }
  validateCommand(exportReport, "export_command", "ONNX export provenance", findings);
  verifyReference(exportReport.export_script, "ONNX export provenance export_script", findings);
  validateEnvironmentFiles(exportReport.environment_files, "ONNX export provenance environment_files", findings);
  validateLocalMlEnvironment(exportReport.local_ml_environment, "ONNX export provenance local_ml_environment", findings);
  if (containsSmokeText(exportReport)) {
    findings.push("ONNX export provenance contains smoke/synthetic markers");
  }
  if (exportReport.training_provenance?.path !== relative(resolveProjectPath(calibrated.__path, "calibrated provenance"))) {
    findings.push("ONNX export provenance training_provenance.path must match calibrated provenance");
  }
  if (exportReport.training_provenance?.sha256 !== sha256File(resolveProjectPath(calibrated.__path, "calibrated provenance"))) {
    findings.push("ONNX export provenance training_provenance.sha256 must match calibrated provenance");
  }
  validateRandomInitializationEvidence(
    exportReport.random_initialization_evidence,
    "ONNX export provenance random_initialization_evidence",
    findings,
  );
  if (
    stableJson(exportReport.random_initialization_evidence ?? null) !==
    stableJson(calibrated.random_initialization_evidence ?? null)
  ) {
    findings.push("ONNX export provenance random_initialization_evidence must match calibrated provenance");
  }
  if (!exportReport.negative_challenge || typeof exportReport.negative_challenge !== "object") {
    findings.push("ONNX export provenance must include negative_challenge evidence");
  } else if (calibrated.negative_challenge && typeof calibrated.negative_challenge === "object") {
    if (exportReport.negative_challenge.manifest?.path !== calibrated.negative_challenge.manifest?.path) {
      findings.push("ONNX export negative_challenge.manifest.path must match calibrated provenance");
    }
    if (exportReport.negative_challenge.manifest?.sha256 !== calibrated.negative_challenge.manifest?.sha256) {
      findings.push("ONNX export negative_challenge.manifest.sha256 must match calibrated provenance");
    }
    if (exportReport.negative_challenge.manifest?.dataset_source_mode !== calibrated.negative_challenge.manifest?.dataset_source_mode) {
      findings.push("ONNX export negative_challenge.manifest.dataset_source_mode must match calibrated provenance");
    }
    if (stableJson(exportReport.negative_challenge.manifest?.external_dataset_import ?? null) !== stableJson(calibrated.negative_challenge.manifest?.external_dataset_import ?? null)) {
      findings.push("ONNX export negative_challenge.manifest.external_dataset_import must match calibrated provenance");
    }
  }
  for (const manifest of calibrated.manifests ?? []) {
    verifyReference(
      {
        path: manifest.path,
        sha256: manifest.sha256,
      },
      `calibrated provenance manifest ${manifest.split}`,
      findings,
    );
    compareManifestSummary(
      validationManifestsBySplit.get(manifest.split),
      manifest,
      `manifest ${manifest.split}`,
      findings,
    );
    const sourceRegister = validateSourceRegister(
      manifest.source_register,
      `calibrated provenance manifest ${manifest.split}.source_register`,
      findings,
    );
    if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
    validateManifestDatasetSource(manifest, `calibrated provenance manifest ${manifest.split}`, findings, {
      consentFormReferences,
      collectionPlanReferences,
    });
    const vocabularyReview = validateVocabularyReview(
      manifest.vocabulary_review,
      `calibrated provenance manifest ${manifest.split}.vocabulary_review`,
      findings,
    );
    if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
  }
  if (calibrated.negative_challenge?.manifest) {
    const sourceRegister = validateSourceRegister(
      calibrated.negative_challenge.manifest.source_register,
      "calibrated provenance negative_challenge.manifest.source_register",
      findings,
    );
    if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
    validateManifestDatasetSource(
      calibrated.negative_challenge.manifest,
      "calibrated provenance negative_challenge.manifest",
      findings,
      {
        consentFormReferences,
        collectionPlanReferences,
      },
    );
    const vocabularyReview = validateVocabularyReview(
      calibrated.negative_challenge.manifest.vocabulary_review,
      "calibrated provenance negative_challenge.manifest.vocabulary_review",
      findings,
    );
    if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
  }
  validateManifestDatasetSource(exportReport, "ONNX export", findings, {
    consentFormReferences,
    collectionPlanReferences,
  });
  const exportVocabularyReview = validateVocabularyReview(
    exportReport.vocabulary_review,
    "ONNX export vocabulary_review",
    findings,
  );
  if (exportVocabularyReview) vocabularyReviewReferences.push(exportVocabularyReview);
  const exportSourceRegister = validateSourceRegister(
    exportReport.source_register,
    "ONNX export source_register",
    findings,
  );
  if (exportSourceRegister) sourceRegisterReferences.push(exportSourceRegister);
  const canonicalSourceRegister = sourceRegisterReferences[0]
    ? JSON.stringify(sourceRegisterReferences[0])
    : null;
  for (const reference of sourceRegisterReferences.slice(1)) {
    if (JSON.stringify(reference) !== canonicalSourceRegister) {
      findings.push("source_register evidence must match across validation, calibration, and ONNX export provenance");
      break;
    }
  }
  const canonicalVocabularyReview = vocabularyReviewReferences[0]
    ? JSON.stringify(vocabularyReviewReferences[0])
    : null;
  for (const reference of vocabularyReviewReferences.slice(1)) {
    if (JSON.stringify(reference) !== canonicalVocabularyReview) {
      findings.push("vocabulary_review evidence must match across validation, calibration, and ONNX export provenance");
      break;
    }
  }
  const canonicalConsentForm = consentFormReferences[0]
    ? JSON.stringify(consentFormReferences[0])
    : null;
  for (const reference of consentFormReferences.slice(1)) {
    if (JSON.stringify(reference) !== canonicalConsentForm) {
      findings.push("consent_form evidence must match across validation, calibration, and ONNX export provenance");
      break;
    }
  }
  const canonicalCollectionPlan = collectionPlanReferences[0]
    ? JSON.stringify(collectionPlanReferences[0])
    : null;
  for (const reference of collectionPlanReferences.slice(1)) {
    if (JSON.stringify(reference) !== canonicalCollectionPlan) {
      findings.push("collection_plan evidence must match across validation, calibration, and ONNX export provenance");
      break;
    }
  }
  if (exportReport.checkpoint?.path !== validation.model?.checkpoint?.path) {
    findings.push("ONNX export checkpoint path must match validation checkpoint path");
  }
  if (exportReport.checkpoint?.sha256 !== validation.model?.checkpoint?.sha256) {
    findings.push("ONNX export checkpoint hash must match validation checkpoint hash");
  }
  if (!String(exportReport.browser_artifact?.path ?? "").startsWith("web/public/")) {
    findings.push("browser artifact must be under web/public");
  }
  if (exportReport.browser_artifact?.path !== relative(defaultBrowserArtifact)) {
    findings.push(`browser artifact path must be ${relative(defaultBrowserArtifact)}`);
  }
  if (!String(exportReport.browser_artifact?.path ?? "").endsWith(".onnx")) {
    findings.push("browser artifact path must end with .onnx");
  }
  validateLabelMap(exportReport.model?.label_to_index, findings);
  if (exportReport.model?.label_count !== Object.keys(exportReport.model?.label_to_index ?? {}).length) {
    findings.push("ONNX export model.label_count must match label_to_index size");
  }
  if (validation.model?.label_count !== exportReport.model?.label_count) {
    findings.push("validation label count must match ONNX export label count");
  }
  if (vocabularyCount() !== exportReport.model?.label_count) {
    findings.push("current vocabulary count must match ONNX export label count");
  }
}

function buildModelCard(validation, calibrated, exportReport, paths) {
  const vocabularySource = fs.readFileSync(vocabularyPath, "utf8");
  const falsePassRate = validation.test?.threshold_metrics?.false_pass_rate;
  const modelArchitecture = exportReport.model?.architecture;
  const vocabularyReview = calibrated.manifests?.find((item) => item.split === "train")?.vocabulary_review
    ?? validation.manifests?.[0]?.vocabulary_review
    ?? exportReport.vocabulary_review
    ?? null;
  const consentForm = calibrated.manifests?.find((item) => item.split === "train")?.consent_form
    ?? validation.manifests?.[0]?.consent_form
    ?? exportReport.consent_form
    ?? null;
  const collectionPlan = calibrated.manifests?.find((item) => item.split === "train")?.collection_plan
    ?? validation.manifests?.[0]?.collection_plan
    ?? exportReport.collection_plan
    ?? null;
  const sourceRegister = calibrated.manifests?.find((item) => item.split === "train")?.source_register
    ?? validation.manifests?.[0]?.source_register
    ?? exportReport.source_register
    ?? null;
  const datasetSource = calibrated.manifests?.find((item) => item.split === "train")
    ?? validation.manifests?.[0]
    ?? exportReport
    ?? null;
  return {
    model_id: calibrated.model_id ?? "asl-pilot-rawframe-v0",
    status: "trained",
    vocabulary_count: exportReport.model.label_count,
    vocabulary_hash: sha256Text(vocabularySource),
    vocabulary_review: vocabularyReview,
    source_register: sourceRegister,
    dataset_source_mode: datasetSourceMode(datasetSource),
    external_dataset_import: datasetSource?.external_dataset_import ?? null,
    consent_form: consentForm,
    collection_plan: collectionPlan,
    architecture: {
      family: architectureFamily(modelArchitecture),
      summary: modelArchitecture,
      pretrained_components: [],
    },
    initialization: calibrated.initialization,
    random_initialization_evidence: calibrated.random_initialization_evidence,
    training_data_manifest: calibrated.manifests?.find((item) => item.split === "train") ?? null,
    validation_data_manifest: calibrated.manifests?.find((item) => item.split === "validation") ?? null,
    test_data_manifest: calibrated.manifests?.find((item) => item.split === "test") ?? null,
    training_framework: calibrated.framework ?? null,
    random_seed: calibrated.seed ?? null,
    export_format: "onnx",
    browser_artifact: exportReport.browser_artifact,
    model: {
      frame_count: exportReport.model.frame_count,
      image_size: exportReport.model.image_size,
      input_name: exportReport.model.input_name,
      output_name: exportReport.model.output_name,
      label_to_index: exportReport.model.label_to_index,
    },
    onnx_export_provenance: {
      path: relative(paths.exportReportPath),
      sha256: sha256File(paths.exportReportPath),
    },
    training_provenance: {
      path: relative(paths.calibratedPath),
      sha256: sha256File(paths.calibratedPath),
    },
    confidence_thresholds: {
      default: calibrated.threshold_policy.selected_threshold,
      policy: "fail_closed",
      source: calibrated.threshold_policy.source,
    },
    validation: {
      signer_disjoint: true,
      report_path: relative(paths.validationPath),
      report_sha256: sha256File(paths.validationPath),
      negative_challenge: validation.negative_challenge,
    },
    metrics: {
      top1_accuracy: validation.test.top1_accuracy,
      macro_f1: validation.test.macro_f1,
      false_pass_rate: falsePassRate,
      negative_challenge_false_pass_rate: validation.negative_challenge.metrics.false_pass_rate,
    },
    artifact_hashes: {
      model_weights: exportReport.checkpoint.sha256,
      browser_export: exportReport.browser_artifact.sha256,
      validation_report: sha256File(paths.validationPath),
      onnx_export_provenance: sha256File(paths.exportReportPath),
      calibrated_provenance: sha256File(paths.calibratedPath),
      negative_challenge_manifest: validation.negative_challenge.manifest.sha256,
      vocabulary_review_evidence: vocabularyReview?.evidence?.sha256 ?? null,
      consent_form: consentForm?.sha256 ?? null,
    },
    provenance_bindings: {
      training_command: calibrated.training_command,
      training_script: calibrated.training_script,
      training_environment_files: calibrated.environment_files,
      training_local_ml_environment: calibrated.local_ml_environment,
      evaluation_command: validation.evaluation_command,
      evaluation_script: validation.evaluation_script,
      evaluation_environment_files: validation.environment_files,
      evaluation_local_ml_environment: validation.local_ml_environment,
      export_command: exportReport.export_command,
      export_script: exportReport.export_script,
      export_environment_files: exportReport.environment_files,
      export_local_ml_environment: exportReport.local_ml_environment,
    },
    known_limitations: validation.known_limitations ?? [],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const validationPath = args["validation-report"]
    ? resolveProjectPath(args["validation-report"], "--validation-report")
    : defaultValidationReport;
  const calibratedPath = args["calibrated-provenance"]
    ? resolveProjectPath(args["calibrated-provenance"], "--calibrated-provenance")
    : defaultCalibratedProvenance;
  const exportReportPath = args["onnx-export-provenance"]
    ? resolveProjectPath(args["onnx-export-provenance"], "--onnx-export-provenance")
    : defaultExportProvenance;
  const outputPath = args.output
    ? resolveProjectPath(args.output, "--output", false)
    : defaultModelCard;
  const dryRunOutputPath = args["dry-run-output"]
    ? resolveDryRunOutputPath(args["dry-run-output"])
    : null;

  const findings = [];
  if (!args.dryRun && outputPath === defaultModelCard && exportReportPath !== defaultExportProvenance) {
    findings.push(`active model-card promotion must use ${relative(defaultExportProvenance)}`);
  }
  for (const [file, context] of [
    [validationPath, "validation report"],
    [calibratedPath, "calibrated provenance"],
    [exportReportPath, "ONNX export provenance"],
  ]) {
    if (!fs.existsSync(file)) findings.push(`${context} does not exist: ${relative(file)}`);
  }
  if (findings.length > 0) throw new Error(findings.join("; "));

  const validation = { ...readJson(validationPath), __path: relative(validationPath) };
  const calibrated = { ...readJson(calibratedPath), __path: relative(calibratedPath) };
  const exportReport = readJson(exportReportPath);

  verifyReference(validation.model?.checkpoint, "validation.model.checkpoint", findings);
  verifyReference(validation.model?.training_provenance, "validation.model.training_provenance", findings);
  verifyReference(exportReport.checkpoint, "export.checkpoint", findings);
  verifyReference(exportReport.training_provenance, "export.training_provenance", findings);
  verifyReference(exportReport.browser_artifact, "export.browser_artifact", findings);

  validateInputs(validation, calibrated, exportReport, { validationPath, calibratedPath }, findings, {
    controlledPilot: Boolean(args.controlledPilot),
  });
  if (findings.length > 0) throw new Error(findings.join("; "));

  const modelCard = buildModelCard(validation, calibrated, exportReport, {
    validationPath,
    calibratedPath,
    exportReportPath,
  });
  if (args.dryRun && dryRunOutputPath) {
    writeJson(dryRunOutputPath, modelCard);
  } else if (!args.dryRun) {
    writeJson(outputPath, modelCard);
  }
  console.log(
    JSON.stringify(
      {
        status: args.dryRun ? "dry_run_valid" : "promoted",
        output: relative(outputPath),
        dry_run_output: dryRunOutputPath ? displayPath(dryRunOutputPath) : null,
        model_id: modelCard.model_id,
        label_count: modelCard.vocabulary_count,
        threshold: modelCard.confidence_thresholds.default,
      },
      null,
      2,
    ),
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Model-card promotion failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
