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
  "manifest_export_binds_consent_and_collection_plan",
  "Manifest export embeds current consent-form, collection-plan, and capture-condition evidence",
  "scripts/export_dataset_manifests.mjs",
  [
    "function consentFormReference()",
    "function loadCollectionPlanReference()",
    "path: projectRelative(consentFormPath)",
    "sha256: CONSENT_FORM_SHA256",
    "consent_form: consentFormReference()",
    "collection_plan: collectionPlan",
    "collection_plan_assignment: collectionPlanAssignmentFor(clip)",
    "capture_condition_evidence: captureConditionFor(clip)",
  ],
);

requireSnippets(
  "training_enforces_final_coverage_consent_and_collection_plan",
  "Training validator enforces final coverage, consent, and collection-plan binding",
  "scripts/train_rawframe_model.py",
  [
    "ALLOWED_NEGATIVE_CHALLENGE_TYPES",
    "EXTENDED_HARD_NEGATIVE_TYPES",
    "\"idle_hands\"",
    "\"casual_non_asl_gesture\"",
    "MIN_CLIPS_PER_LABEL_PER_SPLIT = 5",
    "MIN_LESSON_MILESTONE_LABELS = 25",
    "MAX_LESSON_MILESTONE_LABELS = 40",
    "\"--lesson-milestone\"",
    "return \"lesson_milestone\"",
    "def validate_consent_form",
    "def validate_collection_plan",
    "def validate_collection_plan_assignment",
    "def validate_capture_condition_evidence",
    "def validate_training_invocation",
    "FINAL_TEST_MANIFEST_RELATIVE = \"data/manifests/test.json\"",
    "FINAL_TEST_MANIFEST_REQUIRED_MESSAGE = \"final training requires --test-manifest data/manifests/test.json\"",
    "require_final_invocation_path(",
    "FINAL_TEST_MANIFEST_REQUIRED_MESSAGE",
    "final training requires --check-files",
    "smoke training runs must not write to the final artifact directory",
    "consent_form = validate_consent_form(data, path, allow_small_label_set)",
    "collection_plan = validate_collection_plan(data, path, allow_small_label_set)",
    "validate_capture_condition_evidence(clip, context, \"vocabulary\")",
    "required_clip_count = 1 if allow_small_label_set else MIN_CLIPS_PER_LABEL_PER_SPLIT",
    "\"min_clips_per_label_per_split\": required_clip_count",
    "\"consent_form\": consent_form",
    "\"collection_plan\": collection_plan",
  ],
);

requireSnippets(
  "decode_validates_consent_and_collection_plan",
  "Tensor decode validates negative challenge consent and collection-plan binding",
  "scripts/decode_raw_videos.py",
  [
    "ALLOWED_NEGATIVE_CHALLENGE_TYPES",
    "\"--lesson-milestone\"",
    "allow_lesson_label_set=args.lesson_milestone",
    "validate_consent_form",
    "validate_collection_plan",
    "validate_collection_plan_assignment",
    "validate_capture_condition_evidence",
    "validate_consent_form(data, manifest_path, allow_small_label_set)",
    "collection_plan = validate_collection_plan(data, manifest_path, allow_small_label_set)",
  ],
);

requireSnippets(
  "evaluation_binds_consent_collection_plan_and_coverage",
  "Evaluation binds calibrated provenance to consent, collection-plan, and coverage summaries",
  "scripts/evaluate_rawframe_model.py",
  [
    "ALLOWED_NEGATIVE_CHALLENGE_TYPES",
    "\"--lesson-milestone\"",
    "return \"lesson_milestone\"",
    "validate_manifest(manifest_path, expected_split, True, False, True)",
    "\"idle_hands\"",
    "\"casual_non_asl_gesture\"",
    "\"consent_form\",",
    "\"min_clips_per_label_per_split\",",
    "current manifest {split} is missing consent_form evidence",
    "validate_collection_plan_assignment(",
    "validate_capture_condition_evidence(clip, context, \"negative_challenge\")",
    "\"consent_form\": item.get(\"consent_form\")",
    "\"collection_plan\": item.get(\"collection_plan\")",
    "\"consent_form\": challenge_manifest.get(\"consent_form\")",
    "\"collection_plan\": challenge_manifest.get(\"collection_plan\")",
  ],
);

requireSnippets(
  "onnx_export_revalidates_manifests",
  "ONNX export re-runs strict manifest validators instead of trusting summaries",
  "scripts/export_onnx_model.py",
  [
    "def validate_strict_manifest_files",
    "validate_manifest(manifest_path, split, True, False)",
    "validate_negative_challenge_manifest(",
    "one or more first-party manifests lack consent_form evidence",
    "one or more first-party manifests lack collection_plan evidence",
    "one or more external manifests lack external_dataset_import evidence",
    "\"dataset_source_mode\": (",
    "\"external_dataset_import\": (",
    "\"consent_form\": (",
    "\"collection_plan\": (",
  ],
);

requireSnippets(
  "promotion_requires_source_rights_contract",
  "Model-card promotion requires matching source-rights evidence",
  "scripts/promote_trained_model_card.mjs",
  [
    "requiredNegativeChallengeTypes",
    "\"idle_hands\"",
    "\"casual_non_asl_gesture\"",
    "function validateConsentForm",
    "function validateCollectionPlan",
    "function validateExternalDatasetImport",
    "function validateManifestDatasetSource",
    "consent_form evidence must match across validation, calibration, and ONNX export provenance",
    "collection_plan evidence must match across validation, calibration, and ONNX export provenance",
    "dataset_source_mode: datasetSourceMode(datasetSource)",
    "external_dataset_import: datasetSource?.external_dataset_import ?? null",
    "consent_form: consentForm",
    "collection_plan: collectionPlan",
  ],
);

requireSnippets(
  "model_artifact_audit_requires_source_rights_contract",
  "Trained model artifact audit verifies source-rights evidence",
  "scripts/audit_model_artifacts.mjs",
  [
    "requiredNegativeChallengeTypes",
    "\"idle_hands\"",
    "\"casual_non_asl_gesture\"",
    "function verifyConsentForm",
    "function verifyCollectionPlan",
    "function verifyExternalDatasetImport",
    "function verifyManifestDatasetSource",
    "${context}.external_dataset_import",
    "consent_form evidence must match across model card, validation report, and training provenance",
    "collection_plan evidence must match across model card, validation report, and training provenance",
  ],
);

requireSnippets(
  "completion_readiness_requires_contract",
  "Completion readiness requires strict coverage plus source-rights evidence",
  "scripts/audit_completion_readiness.mjs",
  [
    "const minClipsPerLabelPerSplit = 5",
    "External train/validation/test manifests must include external_dataset_import evidence",
    "First-party train/validation/test manifests must include current consent_form evidence",
    "First-party train/validation/test manifests must include current reviewed collection_plan evidence",
    "First-party train/validation/test clips must include collection_plan_assignment evidence",
    "First-party train/validation/test clips must include controlled capture-condition evidence",
    "Negative challenge clips must include challenge capture-condition evidence",
    "scripts/audit_rawframe_lesson_evidence.mjs",
    "lesson_milestone_evidence",
    "25-sign lesson milestone has strict retained evidence and passing metrics",
    "Every label must have at least ${minClipsPerLabelPerSplit} clips in every split",
    "trained model card must include current source evidence for its dataset_source_mode",
  ],
);

requireSnippets(
  "final_negative_challenge_gap_packet_is_nonfinal",
  "Final negative-challenge gap packet remains non-final capture guidance",
  "scripts/export_final_negative_challenge_gap_packet.mjs",
  [
    "blocked_final_negative_challenge_collection_gap",
    "data/asl-pilot-store.json is absent; the gap packet is capture guidance only",
    "changes_store: false",
    "changes_manifests: false",
    "approves_source: false",
    "approves_clip_review: false",
    "final_model_evidence: false",
    "missing_counts_by_type",
    "selected_assignments",
    "record_first_party_reject_only_clip",
  ],
);

requireSnippets(
  "final_negative_challenge_gap_packet_audit_recomputes_gap",
  "Final negative-challenge gap packet audit recomputes the current manifest gap",
  "scripts/audit_final_negative_challenge_gap_packet.mjs",
  [
    "passed_nonfinal_gap_packet_audit",
    "expectedMissing(manifest, collectionPlan)",
    "missing_counts_by_type",
    "selected_assignment_underfill",
    "decision_boundary_non_false",
    "final_model_evidence",
    "data/asl-pilot-store.json is absent",
  ],
);

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Downstream final manifest contract audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
