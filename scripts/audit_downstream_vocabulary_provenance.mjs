import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pass(id, label, evidence) {
  checks.push({ id, label, status: "passed", evidence, blockers: [] });
}

function fail(id, label, blocker) {
  findings.push(`${id}: ${blocker}`);
  checks.push({ id, label, status: "failed", evidence: null, blockers: [blocker] });
}

function requireSnippets(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  if (missing.length === 0) {
    pass(id, label, relativePath);
  } else {
    fail(id, label, `${relativePath} is missing ${missing.map((item) => JSON.stringify(item)).join(", ")}`);
  }
}

requireSnippets(
  "manifest_export_binds_review",
  "Manifest export requires and embeds accepted vocabulary evidence",
  "scripts/export_dataset_manifests.mjs",
  [
    "vocabularyReviewGate",
    "Vocabulary evidence gate must pass before manifest export",
    "vocabulary_review: vocabularyReview",
  ],
);

requireSnippets(
  "decode_validates_review",
  "Tensor decode validates negative challenge source and vocabulary review evidence",
  "scripts/decode_raw_videos.py",
  [
    "validate_vocabulary_review",
    "validate_negative_challenge_manifest_for_decode",
    "source_license_decision does not match source register",
  ],
);

requireSnippets(
  "training_validates_review",
  "Training validation verifies vocabulary review evidence and carries it into provenance",
  "scripts/train_rawframe_model.py",
  [
    "EXPECTED_VOCABULARY_REVIEW_SCHEMA",
    "def validate_vocabulary_review",
    "approved_ids != ordered_label_ids",
    "\"vocabulary_review\": vocabulary_review",
    "\"vocabulary_review\": item.get(\"vocabulary_review\")",
  ],
);

requireSnippets(
  "evaluation_validates_review",
  "Evaluation binds current manifests and calibrated provenance to reviewed vocabulary evidence",
  "scripts/evaluate_rawframe_model.py",
  [
    "validate_vocabulary_review",
    "\"vocabulary_review\",",
    "current manifest {split} is missing vocabulary_review evidence",
    "\"vocabulary_review\": item.get(\"vocabulary_review\")",
    "\"vocabulary_review\": challenge_manifest.get(\"vocabulary_review\")",
  ],
);

requireSnippets(
  "onnx_export_validates_review",
  "ONNX export rejects final artifacts lacking vocabulary review evidence",
  "scripts/export_onnx_model.py",
  [
    "one or more manifests lack vocabulary_review evidence",
    "manifest vocabulary_review evidence does not match across splits",
    "\"vocabulary_review\": (",
  ],
);

requireSnippets(
  "model_card_requires_review",
  "Model-card promotion requires matching vocabulary review evidence",
  "scripts/promote_trained_model_card.mjs",
  [
    "function validateVocabularyReview",
    "vocabulary_review evidence must match across validation, calibration, and ONNX export provenance",
    "vocabulary_review: vocabularyReview",
    "vocabulary_review_evidence",
  ],
);

requireSnippets(
  "model_artifact_audit_requires_review",
  "Trained model artifact audit verifies model-card vocabulary review evidence",
  "scripts/audit_model_artifacts.mjs",
  [
    "function verifyVocabularyReview",
    "model-card.vocabulary_review",
    "vocabulary_review evidence must match across model card, validation report, and training provenance",
  ],
);

const ACTIVE_VOCABULARY_CLAIM_PATH = "docs/model/active-vocabulary-claim.json";
const ACTIVE_VOCABULARY_CLAIM_SCHEMA_VERSION = "asl-pilot-active-vocabulary-claim/v1";
const ACTIVE_SIGN_MODULES_EXAMPLE_PATH = "configs/active-sign-modules.example.json";
const ACTIVE_SIGN_MODULES_SCHEMA_VERSION = "asl-pilot-active-sign-modules/v1";

function readJsonFile(relativePath, id, label) {
  let text;
  try {
    text = read(relativePath);
  } catch (error) {
    fail(id, label, `${relativePath} could not be read: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(id, label, `${relativePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

(function checkActiveVocabularyClaim() {
  const id = "active_vocabulary_claim_present";
  const label = "Active-vocabulary-claim file pins the rawframe lane's promoted labels";
  const data = readJsonFile(ACTIVE_VOCABULARY_CLAIM_PATH, id, label);
  if (data === null) return;
  const blockers = [];
  if (data.$schema_version !== ACTIVE_VOCABULARY_CLAIM_SCHEMA_VERSION) {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} $schema_version must be ${ACTIVE_VOCABULARY_CLAIM_SCHEMA_VERSION}`);
  }
  if (data.lane !== "rawframe") {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} lane must be 'rawframe' (post Stage A vestige removal)`);
  }
  const validModelVersionPrefix = data.modelVersion === "rawframe-not-trained" ||
    (typeof data.modelVersion === "string" && data.modelVersion.startsWith("rawframe-v"));
  if (!validModelVersionPrefix) {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} modelVersion must be 'rawframe-not-trained' or a 'rawframe-vN' promoted version`);
  }
  if (!Array.isArray(data.activeLabels)) {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} activeLabels must be an array`);
  }
  if (!Array.isArray(data.evidenceArtifacts)) {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} evidenceArtifacts must be an array`);
  }
  if (data.modelVersion === "rawframe-not-trained") {
    if (Array.isArray(data.activeLabels) && data.activeLabels.length !== 0) {
      blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} activeLabels must be empty while modelVersion is 'rawframe-not-trained'`);
    }
    if (Array.isArray(data.evidenceArtifacts) && data.evidenceArtifacts.length !== 0) {
      blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} evidenceArtifacts must be empty while modelVersion is 'rawframe-not-trained'`);
    }
  }
  if (typeof data.claim_disclaimer !== "string" || data.claim_disclaimer.trim().length < 40) {
    blockers.push(`${ACTIVE_VOCABULARY_CLAIM_PATH} claim_disclaimer must be a >= 40-char string`);
  }
  if (blockers.length === 0) pass(id, label, ACTIVE_VOCABULARY_CLAIM_PATH);
  else fail(id, label, blockers.join("; "));
})();

(function checkActiveSignModulesExample() {
  const id = "active_sign_modules_example_present";
  const label = "Active-sign-modules example references the rawframe lane with no vestige labels";
  const data = readJsonFile(ACTIVE_SIGN_MODULES_EXAMPLE_PATH, id, label);
  if (data === null) return;
  const claim = readJsonFile(ACTIVE_VOCABULARY_CLAIM_PATH, `${id}_claim_link`, `${label} (cross-check)`);
  const blockers = [];
  if (data.$schema_version !== ACTIVE_SIGN_MODULES_SCHEMA_VERSION) {
    blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} $schema_version must be ${ACTIVE_SIGN_MODULES_SCHEMA_VERSION}`);
  }
  if (data.lane !== "rawframe") {
    blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} lane must be 'rawframe'`);
  }
  if (claim && typeof claim.modelVersion === "string" && data.modelVersion !== claim.modelVersion) {
    blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} modelVersion '${data.modelVersion}' must match active-vocabulary-claim modelVersion '${claim.modelVersion}'`);
  }
  if (!Array.isArray(data.modules)) {
    blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} modules must be an array`);
  } else {
    for (const [index, module] of data.modules.entries()) {
      const context = `modules[${index}]`;
      if (module?.status !== "candidate") {
        blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} ${context}.status must be 'candidate' until a real promoted module exists`);
      }
      if (!Array.isArray(module?.labels) || module.labels.length === 0) {
        blockers.push(`${ACTIVE_SIGN_MODULES_EXAMPLE_PATH} ${context}.labels must be a non-empty array`);
      }
    }
  }
  if (blockers.length === 0) pass(id, label, ACTIVE_SIGN_MODULES_EXAMPLE_PATH);
  else fail(id, label, blockers.join("; "));
})();

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Downstream vocabulary provenance audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
