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
  validateLocalMlHardwareResources,
  validateLocalMlPackageProvenance,
  validateLocalMlStorageHeadroom,
  validateFinalValidationEvidence,
} from "./final_evidence_contract.mjs";

const root = path.resolve(import.meta.dirname, "..");
const modelCardPath = path.join(root, "web", "public", "model", "model-card.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const collectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const findings = [];
const targetNegativeChallengeFalsePassRate = 0.05;
const consentVersion = "asl-pilot-dataset-consent-v1";
const acceptedVocabularyGateStatuses = new Set(["reviewed", "source_curated"]);
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
  const args = {
    requireTrained: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--require-trained") {
      args.requireTrained = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_model_artifacts.mjs
  node scripts/audit_model_artifacts.mjs --require-trained

Audits the active model card and its retained provenance. By default the
not_trained placeholder may pass as fail-closed scaffolding. With
--require-trained, the active model card must be the final trained artifact.
`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    findings.push(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function requireString(record, key, context) {
  const value = record?.[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    findings.push(`${context} must include non-empty string field: ${key}`);
    return "";
  }
  return value.trim();
}

function requireSha256(record, key, context) {
  const value = requireString(record, key, context).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(value)) {
    findings.push(`${context}.${key} must be a lowercase SHA-256 hex digest`);
  }
  return value;
}

function architectureFamily(architecture) {
  return architectureFamilies.get(architecture) ?? null;
}

function validateRandomInitializationEvidence(evidence, context) {
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

function resolveProjectPath(relativePath, context) {
  if (path.isAbsolute(relativePath)) {
    findings.push(`${context} must be relative to the project root, got: ${relativePath}`);
    return null;
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep)) {
    findings.push(`${context} escapes the project root: ${relativePath}`);
    return null;
  }
  if (!fs.existsSync(resolved)) {
    findings.push(`${context} does not exist: ${relativePath}`);
    return null;
  }
  return resolved;
}

function verifyFileReference(reference, context) {
  const relativePath = requireString(reference, "path", context);
  const expectedSha256 = requireSha256(reference, "sha256", context);
  const file = resolveProjectPath(relativePath, `${context}.path`);
  if (!file) return;
  const actualSha256 = sha256File(file);
  if (expectedSha256 && actualSha256 !== expectedSha256) {
    findings.push(
      `${context}.sha256 mismatch for ${relativePath}; expected ${expectedSha256}, got ${actualSha256}`,
    );
  }
  return file;
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function vocabularyCount() {
  const source = fs.readFileSync(vocabularyPath, "utf8");
  return [...source.matchAll(/\n\s*\["[^"]+",/g)].length;
}

function verifyVocabularyReview(reference, context) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  if (!acceptedVocabularyGateStatuses.has(reference.status)) {
    findings.push(`${context}.status must be reviewed or source_curated`);
  }
  verifyFileReference(reference.evidence, `${context}.evidence`);
  if (!reference.vocabulary_source || typeof reference.vocabulary_source !== "object") {
    findings.push(`${context}.vocabulary_source must be an object`);
    return reference;
  }
  verifyFileReference(
    {
      path: reference.vocabulary_source.path,
      sha256: reference.vocabulary_source.sha256,
    },
    `${context}.vocabulary_source`,
  );
  const vocabularySourceRelative = path.relative(root, vocabularyPath).split(path.sep).join("/");
  if (reference.vocabulary_source.path !== vocabularySourceRelative) {
    findings.push(`${context}.vocabulary_source.path must be ${vocabularySourceRelative}`);
  }
  const sourceHash = sha256Text(fs.readFileSync(vocabularyPath, "utf8"));
  if (reference.vocabulary_source.sha256 !== sourceHash) {
    findings.push(`${context}.vocabulary_source.sha256 must match the current vocabulary source`);
  }
  if (reference.vocabulary_source.item_count !== vocabularyCount()) {
    findings.push(`${context}.vocabulary_source.item_count must match current vocabulary count`);
  }
  const evidencePath = typeof reference.evidence?.path === "string"
    ? resolveProjectPath(reference.evidence.path, `${context}.evidence.path`)
    : null;
  if (evidencePath) {
    const evidence = readJson(evidencePath);
    if (evidence) {
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
  }
  return reference;
}

function verifyConsentForm(reference, context) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  verifyFileReference(reference, context);
  const expectedPath = path.relative(root, consentFormPath).split(path.sep).join("/");
  if (reference.path !== expectedPath) {
    findings.push(`${context}.path must be ${expectedPath}`);
  }
  if (reference.sha256 !== sha256File(consentFormPath)) {
    findings.push(`${context}.sha256 must match the current consent form`);
  }
  if (reference.consent_version !== consentVersion) {
    findings.push(`${context}.consent_version must be ${consentVersion}`);
  }
  return reference;
}

function verifyCollectionPlan(reference, context) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  verifyFileReference(reference, context);
  const expectedPath = path.relative(root, collectionPlanPath).split(path.sep).join("/");
  if (reference.path !== expectedPath) {
    findings.push(`${context}.path must be ${expectedPath}`);
  }
  if (fs.existsSync(collectionPlanPath) && reference.sha256 !== sha256File(collectionPlanPath)) {
    findings.push(`${context}.sha256 must match the current collection plan`);
  }
  if (!acceptedVocabularyGateStatuses.has(reference.review_gate_status)) {
    findings.push(`${context}.review_gate_status must be reviewed or source_curated`);
  }
  return reference;
}

function verifySourceRegister(reference, context) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  verifyFileReference(reference, context);
  if (reference.path !== sourceRegisterPath) {
    findings.push(`${context}.path must be ${sourceRegisterPath}`);
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (file) {
    if (reference.sha256 !== sha256File(file)) {
      findings.push(`${context}.sha256 must match the current source register`);
    }
    const data = readJson(file);
    if (data?.schema_version !== "asl-pilot-dataset-source-register/v1") {
      findings.push(`${context} schema_version is invalid`);
    }
    if (data?.review_method?.default_public_dataset_policy !== "blocked_without_external_rights_review") {
      findings.push(`${context} must declare blocked_without_external_rights_review`);
    }
  }
  return reference;
}

function datasetSourceMode(record) {
  return record?.dataset_source_mode ?? firstPartyDatasetSourceMode;
}

function verifyExternalDatasetImport(reference, context) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.source_id !== "string" || reference.source_id.trim().length === 0) {
    findings.push(`${context}.source_id must be a non-empty string`);
  }
  const sourceAuditFile = verifyFileReference(reference.source_audit, `${context}.source_audit`);
  if (sourceAuditFile) {
    const audit = readJson(sourceAuditFile);
    if (audit) {
      if (audit.source_id !== reference.source_id) {
        findings.push(`${context}.source_audit source_id must match ${context}.source_id`);
      }
      if (!["passed", "accepted", "approved"].includes(audit.status)) {
        findings.push(`${context}.source_audit status must be passed, accepted, or approved`);
      }
    }
  }
  return reference;
}

function verifyManifestDatasetSource(manifest, context, references) {
  const mode = datasetSourceMode(manifest);
  if (!allowedDatasetSourceModes.has(mode)) {
    findings.push(`${context}.dataset_source_mode must be one of ${[...allowedDatasetSourceModes].join(", ")}`);
    return;
  }
  if (mode === externalDatasetSourceMode) {
    verifyExternalDatasetImport(manifest.external_dataset_import, `${context}.external_dataset_import`);
    return;
  }
  const consentForm = verifyConsentForm(manifest.consent_form, `${context}.consent_form`);
  if (consentForm) references.consentFormReferences.push(consentForm);
  const collectionPlan = verifyCollectionPlan(manifest.collection_plan, `${context}.collection_plan`);
  if (collectionPlan) references.collectionPlanReferences.push(collectionPlan);
}

function validateCommand(record, key, context) {
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

function validateLocalMlEnvironment(reference, context) {
  const file = verifyFileReference(reference, context);
  if (!file) return;
  if (path.relative(root, file).split(path.sep).join("/") !== localMlEnvironmentPath) {
    findings.push(`${context}.path must be ${localMlEnvironmentPath}`);
    return;
  }
  const data = readJson(file);
  if (!data) return;
  if (data.schema_version !== localMlEnvironmentSchemaVersion) {
    findings.push(`${context}.schema_version must be ${localMlEnvironmentSchemaVersion}`);
  }
  if (data.status !== "passed") {
    findings.push(`${context}.status must be passed`);
  }
  if (!Array.isArray(data.blockers) || data.blockers.length !== 0) {
    findings.push(`${context}.blockers must be empty`);
  }
  const auditScript = verifyFileReference(data.audit_script, `${context}.audit_script`);
  if (auditScript && path.relative(root, auditScript).split(path.sep).join("/") !== "scripts/audit_local_ml_environment.py") {
    findings.push(`${context}.audit_script.path must be scripts/audit_local_ml_environment.py`);
  }
  const projectFiles = new Map((data.project_files ?? []).map((item) => [item?.path, item]));
  for (const requiredPath of ["requirements.txt", "web/package.json", "web/package-lock.json"]) {
    const fileReference = verifyFileReference(projectFiles.get(requiredPath), `${context}.project_files.${requiredPath}`);
    if (fileReference && path.relative(root, fileReference).split(path.sep).join("/") !== requiredPath) {
      findings.push(`${context}.project_files.${requiredPath}.path must be ${requiredPath}`);
    }
  }
  if (data.torch?.mps_built !== true || data.torch?.mps_available !== true) {
    findings.push(`${context} must prove PyTorch MPS is built and available`);
  }
  if (data.ffmpeg?.available !== true) {
    findings.push(`${context} must prove FFmpeg is available`);
  }
  if (!data.browser_runtime?.declared || !data.browser_runtime?.installed) {
    findings.push(`${context} must prove onnxruntime-web is declared and installed`);
  }
  validateLocalMlStorageHeadroom(data, context, findings);
  validateLocalMlHardwareResources(data, context, findings);
  validateLocalMlPackageProvenance(data, context, findings);
}

function validateEnvironmentFiles(files, context) {
  if (!Array.isArray(files) || files.length === 0) {
    findings.push(`${context} must be a non-empty array`);
    return;
  }
  const seen = new Set();
  let localMlReference = null;
  for (const [index, reference] of files.entries()) {
    const file = verifyFileReference(reference, `${context}[${index}]`);
    if (file) {
      const relativePath = path.relative(root, file).split(path.sep).join("/");
      seen.add(relativePath);
      if (relativePath === localMlEnvironmentPath) localMlReference = reference;
    }
  }
  for (const requiredPath of ["requirements.txt", "web/package.json", "web/package-lock.json", localMlEnvironmentPath]) {
    if (!seen.has(requiredPath)) findings.push(`${context} must include ${requiredPath}`);
  }
  if (localMlReference) validateLocalMlEnvironment(localMlReference, `${context}.${localMlEnvironmentPath}`);
}

function validateBindings(bindings) {
  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    findings.push("trained model-card provenance_bindings must be an object");
    return;
  }
  validateCommand(bindings, "training_command", "model-card.provenance_bindings");
  verifyFileReference(bindings.training_script, "model-card.provenance_bindings.training_script");
  validateEnvironmentFiles(
    bindings.training_environment_files,
    "model-card.provenance_bindings.training_environment_files",
  );
  validateLocalMlEnvironment(
    bindings.training_local_ml_environment,
    "model-card.provenance_bindings.training_local_ml_environment",
  );
  validateCommand(bindings, "evaluation_command", "model-card.provenance_bindings");
  verifyFileReference(bindings.evaluation_script, "model-card.provenance_bindings.evaluation_script");
  validateEnvironmentFiles(
    bindings.evaluation_environment_files,
    "model-card.provenance_bindings.evaluation_environment_files",
  );
  validateLocalMlEnvironment(
    bindings.evaluation_local_ml_environment,
    "model-card.provenance_bindings.evaluation_local_ml_environment",
  );
  validateCommand(bindings, "export_command", "model-card.provenance_bindings");
  verifyFileReference(bindings.export_script, "model-card.provenance_bindings.export_script");
  validateEnvironmentFiles(
    bindings.export_environment_files,
    "model-card.provenance_bindings.export_environment_files",
  );
  validateLocalMlEnvironment(
    bindings.export_local_ml_environment,
    "model-card.provenance_bindings.export_local_ml_environment",
  );
}

function requireNumber(record, key, context) {
  const value = record?.[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    findings.push(`${context} must include numeric field: ${key}`);
    return null;
  }
  return value;
}

function requirePositiveInteger(record, key, context) {
  const value = requireNumber(record, key, context);
  if (value !== null && (!Number.isInteger(value) || value <= 0)) {
    findings.push(`${context}.${key} must be a positive integer`);
  }
  return value;
}

function validateLabelMapping(modelCard) {
  const labelToIndex = modelCard.model?.label_to_index;
  if (!labelToIndex || typeof labelToIndex !== "object" || Array.isArray(labelToIndex)) {
    findings.push("trained model-card model.label_to_index must be a non-empty object");
    return;
  }
  const entries = Object.entries(labelToIndex);
  if (entries.length < 75 || entries.length > 100) {
    findings.push("trained model-card model.label_to_index must contain 75-100 labels");
  }
  const indexes = entries.map(([, value]) => value);
  if (!indexes.every((value) => Number.isInteger(value) && value >= 0)) {
    findings.push("trained model-card model.label_to_index values must be non-negative integers");
    return;
  }
  const unique = new Set(indexes);
  if (unique.size !== indexes.length) {
    findings.push("trained model-card model.label_to_index values must be unique");
    return;
  }
  for (let index = 0; index < indexes.length; index += 1) {
    if (!unique.has(index)) {
      findings.push("trained model-card model.label_to_index values must be dense from zero");
      return;
    }
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}

if (!fs.existsSync(modelCardPath)) {
  findings.push("web/public/model/model-card.json is missing");
} else {
  const modelCard = readJson(modelCardPath);
  if (modelCard) {
    if (modelCard.status !== "not_trained" && modelCard.status !== "trained") {
      findings.push("model-card status must be not_trained or trained");
    }
    if (args.requireTrained && modelCard.status !== "trained") {
      findings.push(`model-card status must be trained for final evidence; found ${modelCard.status ?? "missing"}`);
    }
    const pretrainedComponents = modelCard.architecture?.pretrained_components;
    if (Array.isArray(pretrainedComponents) && pretrainedComponents.length > 0) {
      findings.push("model-card architecture.pretrained_components must be empty");
    }

    if (modelCard.status === "trained") {
      const serialized = JSON.stringify(modelCard).toLowerCase();
      const modelCardArchitecture = modelCard.architecture?.summary;
      const expectedArchitectureFamily = architectureFamily(modelCardArchitecture);
      if (serialized.includes("placeholder") || serialized.includes("not_calibrated")) {
        findings.push("trained model-card still contains placeholder or not_calibrated language");
      }
      if (modelCard.export_format !== "onnx") {
        findings.push("trained model-card export_format must be onnx for browser inference");
      }
      if (!finalRawFrameArchitectures.includes(modelCardArchitecture)) {
        findings.push(`trained model-card architecture.summary must be one of: ${finalRawFrameArchitectures.join(", ")}`);
      }
      if (!expectedArchitectureFamily) {
        findings.push(`trained model-card architecture.summary is unsupported: ${modelCardArchitecture ?? "missing"}`);
      } else if (modelCard.architecture?.family !== expectedArchitectureFamily) {
        findings.push(
          `trained model-card architecture.family must be ${expectedArchitectureFamily} for ${modelCardArchitecture}`,
        );
      }
      validateRandomInitializationEvidence(
        modelCard.random_initialization_evidence,
        "model-card random_initialization_evidence",
      );
      verifyFileReference(modelCard.browser_artifact, "model-card.browser_artifact");
      if (
        typeof modelCard.browser_artifact?.path === "string" &&
        !modelCard.browser_artifact.path.endsWith(".onnx")
      ) {
        findings.push("trained browser artifact path must end with .onnx");
      }
      verifyFileReference(modelCard.training_provenance, "model-card.training_provenance");
      verifyFileReference(modelCard.onnx_export_provenance, "model-card.onnx_export_provenance");
      validateBindings(modelCard.provenance_bindings);
	      const vocabularyReviewReferences = [];
	      const consentFormReferences = [];
	      const collectionPlanReferences = [];
	      const sourceRegisterReferences = [];
	      const modelCardVocabularyReview = verifyVocabularyReview(modelCard.vocabulary_review, "model-card.vocabulary_review");
	      if (modelCardVocabularyReview) vocabularyReviewReferences.push(modelCardVocabularyReview);
	      const modelCardSourceRegister = verifySourceRegister(modelCard.source_register, "model-card.source_register");
	      if (modelCardSourceRegister) sourceRegisterReferences.push(modelCardSourceRegister);
	      verifyManifestDatasetSource(modelCard, "model-card", {
	        consentFormReferences,
	        collectionPlanReferences,
	      });
      requirePositiveInteger(modelCard.model, "frame_count", "model-card.model");
      requirePositiveInteger(modelCard.model, "image_size", "model-card.model");
      requireString(modelCard.model, "input_name", "model-card.model");
      requireString(modelCard.model, "output_name", "model-card.model");
      validateLabelMapping(modelCard);

      const threshold = modelCard.confidence_thresholds?.default;
      if (typeof threshold !== "number" || threshold <= 0 || threshold >= 1) {
        findings.push("trained model-card must include confidence_thresholds.default between 0 and 1");
      }
      if (modelCard.validation?.signer_disjoint !== true) {
        findings.push("trained model-card validation.signer_disjoint must be true");
      }
      requireString(modelCard.validation, "report_path", "model-card.validation");
      verifyFileReference(
        {
          path: modelCard.validation?.report_path,
          sha256: modelCard.validation?.report_sha256,
        },
        "model-card.validation.report",
      );
      const validationReportFile = typeof modelCard.validation?.report_path === "string"
        ? resolveProjectPath(modelCard.validation.report_path, "model-card.validation.report_path")
        : null;
      if (validationReportFile) {
        const validationReport = readJson(validationReportFile);
        if (validationReport) {
          const calibratedFile = typeof modelCard.training_provenance?.path === "string"
            ? resolveProjectPath(modelCard.training_provenance.path, "model-card.training_provenance.path")
            : null;
          const calibrated = calibratedFile ? readJson(calibratedFile) : null;
          if (calibrated) {
            findings.push(...validateFinalValidationEvidence({
              validation: validationReport,
              calibrated,
              validationPath: validationReportFile,
              calibratedPath: calibratedFile,
            }));
          }
          if (validationReport.status !== "candidate_final_validation_passed") {
            findings.push("validation report status must be candidate_final_validation_passed");
          }
          if (validationReport.model?.runtime_device !== "mps") {
            findings.push("validation report model.runtime_device must be mps for final local-GPU evidence");
          }
          if (validationReport.model?.architecture !== modelCardArchitecture) {
            findings.push("validation report model.architecture must match model-card architecture.summary");
          }
          validateCommand(validationReport, "evaluation_command", "validation report");
          verifyFileReference(validationReport.evaluation_script, "validation report evaluation_script");
          validateEnvironmentFiles(validationReport.environment_files, "validation report environment_files");
          validateLocalMlEnvironment(validationReport.local_ml_environment, "validation report local_ml_environment");
          if (validationReport.pass_status?.negative_challenge_false_pass_rate !== true) {
            findings.push("validation report pass_status.negative_challenge_false_pass_rate must be true");
          }
          for (const manifest of validationReport.manifests ?? []) {
	            const sourceRegister = verifySourceRegister(
	              manifest.source_register,
	              `validation report manifest ${manifest.split ?? "(unknown)"}.source_register`,
	            );
	            if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
	            verifyManifestDatasetSource(manifest, `validation report manifest ${manifest.split ?? "(unknown)"}`, {
	              consentFormReferences,
	              collectionPlanReferences,
	            });
	            const vocabularyReview = verifyVocabularyReview(
              manifest.vocabulary_review,
              `validation report manifest ${manifest.split ?? "(unknown)"}.vocabulary_review`,
            );
            if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
          }
          const challenge = validationReport.negative_challenge;
          if (!challenge || typeof challenge !== "object") {
            findings.push("validation report must include negative_challenge evidence");
          } else {
            verifyFileReference(challenge.manifest, "validation-report.negative_challenge.manifest");
            const sourceRegister = verifySourceRegister(
              challenge.manifest?.source_register,
              "validation-report.negative_challenge.manifest.source_register",
            );
            if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
            const vocabularyReview = verifyVocabularyReview(
              challenge.manifest?.vocabulary_review,
              "validation-report.negative_challenge.manifest.vocabulary_review",
            );
            if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
	            verifyManifestDatasetSource(challenge.manifest, "validation-report.negative_challenge.manifest", {
	              consentFormReferences,
	              collectionPlanReferences,
	            });
            const challengeFalsePassRate = challenge.metrics?.false_pass_rate;
            if (
              typeof challengeFalsePassRate !== "number" ||
              challengeFalsePassRate >= targetNegativeChallengeFalsePassRate
            ) {
              findings.push(
                `validation report negative_challenge.metrics.false_pass_rate must be below ${targetNegativeChallengeFalsePassRate}`,
              );
            }
            for (const requiredType of requiredNegativeChallengeTypes) {
              if (!challenge.metrics?.by_type?.[requiredType]) {
                findings.push(`validation report negative_challenge must include type ${requiredType}`);
              } else if (challenge.metrics.by_type[requiredType].examples < 5) {
                findings.push(`validation report negative_challenge type ${requiredType} must include at least 5 examples`);
              }
            }
          }
        }
      }

      const exportReportPath = modelCard.onnx_export_provenance?.path;
      if (typeof exportReportPath === "string") {
        const exportReportFile = resolveProjectPath(exportReportPath, "model-card.onnx_export_provenance.path");
        if (exportReportFile) {
          const exportReport = readJson(exportReportFile);
            if (exportReport) {
              if (exportReport.schema_version !== "asl-pilot-onnx-export-provenance/v1") {
                findings.push("ONNX export provenance schema_version must be asl-pilot-onnx-export-provenance/v1");
              }
              if (exportReport.evidence_mode !== "final") {
                findings.push("ONNX export provenance evidence_mode must be final");
              }
              if (exportReport.generated_by?.tool !== "scripts/export_onnx_model.py") {
                findings.push("ONNX export provenance generated_by.tool must be scripts/export_onnx_model.py");
              }
              if (exportReport.model?.architecture !== modelCardArchitecture) {
                findings.push("ONNX export provenance model.architecture must match model-card architecture.summary");
              }
              validateCommand(exportReport, "export_command", "ONNX export provenance");
              verifyFileReference(exportReport.export_script, "ONNX export provenance export_script");
              validateEnvironmentFiles(exportReport.environment_files, "ONNX export provenance environment_files");
              validateLocalMlEnvironment(exportReport.local_ml_environment, "ONNX export provenance local_ml_environment");
	              verifyManifestDatasetSource(exportReport, "ONNX export provenance", {
	                consentFormReferences,
	                collectionPlanReferences,
	              });
              const sourceRegister = verifySourceRegister(exportReport.source_register, "ONNX export provenance source_register");
              if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
              validateRandomInitializationEvidence(
                exportReport.random_initialization_evidence,
                "ONNX export provenance random_initialization_evidence",
              );
              if (exportReport.browser_artifact?.path !== modelCard.browser_artifact?.path) {
              findings.push("ONNX export provenance browser_artifact.path must match model-card browser_artifact.path");
            }
            if (exportReport.browser_artifact?.sha256 !== modelCard.browser_artifact?.sha256) {
              findings.push("ONNX export provenance browser_artifact.sha256 must match model-card browser_artifact.sha256");
            }
          }
        }
      }

      const top1Accuracy = requireNumber(modelCard.metrics, "top1_accuracy", "model-card.metrics");
      if (top1Accuracy !== null && top1Accuracy < 0.7) {
        findings.push("model-card.metrics.top1_accuracy must be at least 0.7");
      }
      const macroF1 = requireNumber(modelCard.metrics, "macro_f1", "model-card.metrics");
      if (macroF1 !== null && macroF1 < 0.65) {
        findings.push("model-card.metrics.macro_f1 must be at least 0.65");
      }
      const falsePassRate = requireNumber(modelCard.metrics, "false_pass_rate", "model-card.metrics");
      if (falsePassRate !== null && falsePassRate >= 0.1) {
        findings.push("model-card.metrics.false_pass_rate must be below 0.1");
      }
      const negativeChallengeFalsePassRate = requireNumber(
        modelCard.metrics,
        "negative_challenge_false_pass_rate",
        "model-card.metrics",
      );
      if (
        negativeChallengeFalsePassRate !== null &&
        negativeChallengeFalsePassRate >= targetNegativeChallengeFalsePassRate
      ) {
        findings.push(`model-card.metrics.negative_challenge_false_pass_rate must be below ${targetNegativeChallengeFalsePassRate}`);
      }
      if (!modelCard.validation?.negative_challenge || typeof modelCard.validation.negative_challenge !== "object") {
        findings.push("model-card.validation.negative_challenge must include final challenge evidence");
      }

      const provenancePath = modelCard.training_provenance?.path;
      if (typeof provenancePath === "string") {
        const provenanceFile = resolveProjectPath(provenancePath, "model-card.training_provenance.path");
        if (provenanceFile) {
          const provenance = readJson(provenanceFile);
          if (provenance) {
            if (provenance.initialization !== "random") {
              findings.push("training provenance initialization must be random");
            }
            validateRandomInitializationEvidence(
              provenance.random_initialization_evidence,
              "training provenance random_initialization_evidence",
            );
            if (provenance.schema_version !== "asl-pilot-calibrated-provenance/v1") {
              findings.push("training provenance schema_version must be asl-pilot-calibrated-provenance/v1 after calibration");
            }
            if (provenance.evidence_mode !== "final") {
              findings.push("training provenance evidence_mode must be final after calibration");
            }
            if (provenance.generated_by?.tool !== "scripts/evaluate_rawframe_model.py") {
              findings.push("training provenance generated_by.tool must be scripts/evaluate_rawframe_model.py after calibration");
            }
            if (provenance.framework?.device !== "mps") {
              findings.push("training provenance framework.device must be mps for final local-GPU evidence");
            }
            if (provenance.architecture !== modelCardArchitecture) {
              findings.push("training provenance architecture must match model-card architecture.summary");
            }
            validateCommand(provenance, "training_command", "training provenance");
            verifyFileReference(provenance.training_script, "training provenance training_script");
            validateEnvironmentFiles(provenance.environment_files, "training provenance environment_files");
            validateLocalMlEnvironment(provenance.local_ml_environment, "training provenance local_ml_environment");
            validateCommand(provenance, "evaluation_command", "training provenance");
            verifyFileReference(provenance.evaluation_script, "training provenance evaluation_script");
            validateEnvironmentFiles(
              provenance.evaluation_environment_files,
              "training provenance evaluation_environment_files",
            );
            validateLocalMlEnvironment(
              provenance.evaluation_local_ml_environment,
              "training provenance evaluation_local_ml_environment",
            );
            if (!Array.isArray(provenance.pretrained_components)) {
              findings.push("training provenance pretrained_components must be an array");
            } else if (provenance.pretrained_components.length > 0) {
              findings.push("training provenance pretrained_components must be empty");
            }
            if (provenance.threshold_policy === "not_calibrated") {
              findings.push("training provenance threshold_policy must be calibrated before final submission");
            }
            if (!provenance.negative_challenge || typeof provenance.negative_challenge !== "object") {
              findings.push("training provenance negative_challenge evidence is required");
            }
            const manifests = Array.isArray(provenance.manifests) ? provenance.manifests : [];
            if (manifests.length === 0) {
              findings.push("training provenance manifests must be a non-empty array");
            }
            for (const manifest of manifests) {
              const sourceRegister = verifySourceRegister(
                manifest.source_register,
                `training provenance manifest ${manifest.split ?? "(unknown)"}.source_register`,
              );
              if (sourceRegister) sourceRegisterReferences.push(sourceRegister);
	              verifyManifestDatasetSource(manifest, `training provenance manifest ${manifest.split ?? "(unknown)"}`, {
	                consentFormReferences,
	                collectionPlanReferences,
	              });
	              const vocabularyReview = verifyVocabularyReview(
                manifest.vocabulary_review,
                `training provenance manifest ${manifest.split ?? "(unknown)"}.vocabulary_review`,
              );
              if (vocabularyReview) vocabularyReviewReferences.push(vocabularyReview);
            }
            const challengeVocabularyReview = verifyVocabularyReview(
              provenance.negative_challenge?.manifest?.vocabulary_review,
              "training provenance negative_challenge.manifest.vocabulary_review",
            );
            if (challengeVocabularyReview) vocabularyReviewReferences.push(challengeVocabularyReview);
            const challengeSourceRegister = verifySourceRegister(
              provenance.negative_challenge?.manifest?.source_register,
              "training provenance negative_challenge.manifest.source_register",
            );
            if (challengeSourceRegister) sourceRegisterReferences.push(challengeSourceRegister);
	            verifyManifestDatasetSource(provenance.negative_challenge?.manifest, "training provenance negative_challenge.manifest", {
	              consentFormReferences,
	              collectionPlanReferences,
	            });
            const canonicalSourceRegister = sourceRegisterReferences[0]
              ? JSON.stringify(sourceRegisterReferences[0])
              : null;
            for (const reference of sourceRegisterReferences.slice(1)) {
              if (JSON.stringify(reference) !== canonicalSourceRegister) {
                findings.push("source_register evidence must match across model card, validation report, ONNX export, and training provenance");
                break;
              }
            }
            const canonicalVocabularyReview = vocabularyReviewReferences[0]
              ? JSON.stringify(vocabularyReviewReferences[0])
              : null;
            for (const reference of vocabularyReviewReferences.slice(1)) {
              if (JSON.stringify(reference) !== canonicalVocabularyReview) {
                findings.push("vocabulary_review evidence must match across model card, validation report, and training provenance");
                break;
              }
            }
            const canonicalConsentForm = consentFormReferences[0]
              ? JSON.stringify(consentFormReferences[0])
              : null;
	            for (const reference of consentFormReferences.slice(1)) {
	              if (JSON.stringify(reference) !== canonicalConsentForm) {
	                findings.push("consent_form evidence must match across model card, validation report, and training provenance");
	                break;
	              }
	            }
	            const canonicalCollectionPlan = collectionPlanReferences[0]
	              ? JSON.stringify(collectionPlanReferences[0])
	              : null;
	            for (const reference of collectionPlanReferences.slice(1)) {
	              if (JSON.stringify(reference) !== canonicalCollectionPlan) {
	                findings.push("collection_plan evidence must match across model card, validation report, and training provenance");
	                break;
	              }
	            }
          }
        }
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Model artifact audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Model artifact audit passed for the current model-card status.");
