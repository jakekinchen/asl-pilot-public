import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "controlled-pilot-source-remediation-status.json");
const paths = {
  readiness: "docs/validation/controlled-pilot-readiness.json",
  canonicalCollectionQueue: "data/dataset/canonical-verifier-010-collection-queue.json",
  focusedQueue: "data/dataset/controlled-pilot-label-ladder-010-factorized-remediation-collection-queue.json",
  queueApiSmoke: "docs/validation/controlled-pilot-remediation-queue-api-smoke.json",
  collectionUiQueueSmoke: "docs/validation/dataset-collection-ui-queue-smoke.json",
  collectionSessionBundle: "output/collection-handoff/collection-session-bundle/MANIFEST.json",
  firstPartyStorePreflight: "docs/validation/first-party-store-preflight.json",
  lessonReadiness: "docs/validation/rawframe-lesson-collection-readiness.json",
  firstPartyStore: "data/asl-pilot-store.json",
  sourceRegister: "docs/model/dataset-source-register.json",
  academicImportPlan: "docs/research/noncommercial-academic-dataset-import-plan.json",
  wlaslAcademicRawUrlProbe: "docs/research/wlasl-academic-raw-url-probe.json",
  wlaslAcademicSelectedClipImport: "docs/research/wlasl-academic-selected-raw-clip-import.json",
  wlaslAcademicSelectedManifests: "docs/validation/wlasl-academic-selected-manifests.json",
  aslCitizenSelectedClipImport: "docs/research/asl-citizen-selected-raw-clip-import.json",
  aslCitizenSelectedManifests: "docs/validation/asl-citizen-selected-manifests.json",
  wlaslAcademicDiagnosticTraining: "artifacts/rawframe-model-diagnostics/wlasl-academic-selected-smoke/training-provenance.json",
  wlaslAcademicDiagnosticValidation: "artifacts/rawframe-model-diagnostics/wlasl-academic-selected-smoke/validation-report.json",
  nvidiaMetadataAudit: "docs/research/nvidia-asl-metadata-audit.json",
  nvidiaPublicS3AccessAudit: "docs/research/nvidia-asl-public-s3-access-audit.json",
  modelCard: "web/public/model/model-card.json",
  validationReport: "artifacts/rawframe-model/controlled-pilot-validation-report.json",
  mixedClipHeldoutTraining: "artifacts/rawframe-model-clip-heldout/training-provenance.json",
  mixedClipHeldoutValidation: "artifacts/rawframe-model-clip-heldout/validation-report.json",
  promptVerifierSubset: "docs/validation/prompt-verifier-subset-manifests.json",
  promptVerifierReport:
    "artifacts/rawframe-model-diagnostics/template-verifier-prompt-high-coverage-025-f16-k1-relaxed/validation-report.json",
  promptClassifierVerifierReport:
    "artifacts/rawframe-model-diagnostics/prompt-classifier-verifier-high-coverage-025-motion-e35/validation-report.json",
  promptClassifierVerifierAslCitizenReport:
    "artifacts/rawframe-model-diagnostics/prompt-classifier-verifier-high-coverage-025-asl-citizen-motion-e20/validation-report.json",
  promptClassifierVerifierAslCitizenRejectReport:
    "artifacts/rawframe-model-diagnostics/prompt-classifier-verifier-high-coverage-025-asl-citizen-reject-motion-e20/validation-report.json",
  promptClassifierVerifierAslCitizenRejectOodReport:
    "artifacts/rawframe-model-diagnostics/prompt-classifier-verifier-high-coverage-025-asl-citizen-reject-ood120-motion-e20/validation-report.json",
  promptClassifierVerifierAslCitizenRejectOodTwoStageReport:
    "artifacts/rawframe-model-diagnostics/prompt-classifier-verifier-high-coverage-025-asl-citizen-reject-ood120-twostage-motion-e20/validation-report.json",
  canonicalVerifierManifests: "docs/validation/canonical-verifier-manifests.json",
  canonicalVerifierHelperFeatures: "docs/validation/canonical-verifier-helper-features.json",
  canonicalVerifierHelperTemplateReport:
    "artifacts/rawframe-model-diagnostics/canonical-verifier-010/helper-template-verifier-report.json",
  canonicalVerifierLstmReport:
    "artifacts/rawframe-model-diagnostics/canonical-verifier-010/helper-lstm-verifier-report.json",
  canonicalVerifierCollectionPacket: "docs/validation/canonical-verifier-collection-packet.json",
  canonicalVerifierCollectionReadiness: "docs/validation/canonical-verifier-collection-readiness.json",
  canonicalVerifierFirstPartyManifestExport: "docs/validation/canonical-verifier-first-party-manifest-export.json",
};

function parseArgs(argv) {
  const args = { write: false, output: defaultOutputPath };
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
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.output = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_controlled_pilot_source_remediation_status.mjs [--write] [--output docs/validation/controlled-pilot-source-remediation-status.json]

Summarizes whether controlled-pilot source remediation can proceed from current
evidence. This does not collect clips, approve sources, import media, train
weights, or promote a model.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function readJson(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sourceById(register, sourceId) {
  return (register?.sources ?? []).find((source) => source?.source_id === sourceId) ?? null;
}

function buildStatus() {
  const readiness = readJson(paths.readiness);
  const canonicalCollectionQueue = readJson(paths.canonicalCollectionQueue);
  const focusedQueue = readJson(paths.focusedQueue);
  const queueApiSmoke = readJson(paths.queueApiSmoke);
  const collectionUiQueueSmoke = readJson(paths.collectionUiQueueSmoke);
  const collectionSessionBundle = readJson(paths.collectionSessionBundle);
  const firstPartyStorePreflight = readJson(paths.firstPartyStorePreflight);
  const lessonReadiness = readJson(paths.lessonReadiness);
  const sourceRegister = readJson(paths.sourceRegister);
  const academicImportPlan = readJson(paths.academicImportPlan);
  const wlaslAcademicRawUrlProbe = readJson(paths.wlaslAcademicRawUrlProbe);
  const wlaslAcademicSelectedClipImport = readJson(paths.wlaslAcademicSelectedClipImport);
  const wlaslAcademicSelectedManifests = readJson(paths.wlaslAcademicSelectedManifests);
  const aslCitizenSelectedClipImport = readJson(paths.aslCitizenSelectedClipImport);
  const aslCitizenSelectedManifests = readJson(paths.aslCitizenSelectedManifests);
  const wlaslAcademicDiagnosticTraining = readJson(paths.wlaslAcademicDiagnosticTraining);
  const wlaslAcademicDiagnosticValidation = readJson(paths.wlaslAcademicDiagnosticValidation);
  const nvidiaMetadataAudit = readJson(paths.nvidiaMetadataAudit);
  const nvidiaPublicS3AccessAudit = readJson(paths.nvidiaPublicS3AccessAudit);
  const modelCard = readJson(paths.modelCard);
  const validationReport = readJson(paths.validationReport);
  const mixedClipHeldoutTraining = readJson(paths.mixedClipHeldoutTraining);
  const mixedClipHeldoutValidation = readJson(paths.mixedClipHeldoutValidation);
  const promptVerifierSubset = readJson(paths.promptVerifierSubset);
  const promptVerifierReport = readJson(paths.promptVerifierReport);
  const promptClassifierVerifierReport = readJson(paths.promptClassifierVerifierReport);
  const promptClassifierVerifierAslCitizenReport = readJson(paths.promptClassifierVerifierAslCitizenReport);
  const promptClassifierVerifierAslCitizenRejectReport = readJson(paths.promptClassifierVerifierAslCitizenRejectReport);
  const promptClassifierVerifierAslCitizenRejectOodReport =
    readJson(paths.promptClassifierVerifierAslCitizenRejectOodReport);
  const promptClassifierVerifierAslCitizenRejectOodTwoStageReport =
    readJson(paths.promptClassifierVerifierAslCitizenRejectOodTwoStageReport);
  const canonicalVerifierManifests = readJson(paths.canonicalVerifierManifests);
  const canonicalVerifierHelperFeatures = readJson(paths.canonicalVerifierHelperFeatures);
  const canonicalVerifierHelperTemplateReport = readJson(paths.canonicalVerifierHelperTemplateReport);
  const canonicalVerifierLstmReport = readJson(paths.canonicalVerifierLstmReport);
  const canonicalVerifierCollectionPacket = readJson(paths.canonicalVerifierCollectionPacket);
  const canonicalVerifierCollectionReadiness = readJson(paths.canonicalVerifierCollectionReadiness);
  const canonicalVerifierFirstPartyManifestExport = readJson(paths.canonicalVerifierFirstPartyManifestExport);

  const firstPartySource = sourceById(sourceRegister, "first-party-browser-consent-capture");
  const aslCitizenAcademicSource = sourceById(sourceRegister, "asl-citizen-school-assignment-raw-videos");
  const wlaslAcademicSource = sourceById(sourceRegister, "wlasl-school-assignment-raw-videos");
  const nvidiaSource = sourceById(sourceRegister, "nvidia-asl-dataset");
  const popsignSource = sourceById(sourceRegister, "popsign-v1-original-videos");
  const firstPartyStore = fileReference(paths.firstPartyStore);
  const activeCollectionQueue = canonicalCollectionQueue ?? focusedQueue;
  const activeCollectionQueuePath = canonicalCollectionQueue ? paths.canonicalCollectionQueue : paths.focusedQueue;
  const focusedQueueFirstRow = activeCollectionQueue?.queue?.[0] ?? null;
  const queueApi = queueApiSmoke?.collection_api ?? {};
  const lessonBlockers = Array.isArray(lessonReadiness?.blockers) ? lessonReadiness.blockers : [];

  const firstParty = {
    source_register_status: firstPartySource?.license_review_status ?? null,
    store_exists: firstPartyStore.exists,
    collection_queue_ready: activeCollectionQueue?.status === "queue_ready_not_training_data",
    collection_queue_assignment_count: activeCollectionQueue?.queue_summary?.assignment_count ?? null,
    collection_queue_priority_label_count: activeCollectionQueue?.queue_summary?.priority_label_count ?? null,
    collection_queue_path: activeCollectionQueuePath,
    operator_api_smoke_passed: queueApiSmoke?.status === "passed" &&
      (queueApi.loaded_active_collection_queue === true || queueApi.loaded_focused_remediation_queue === true) &&
      queueApi.first_queue_row_matches_plan === true,
    operator_ui_smoke_passed: collectionUiQueueSmoke?.status === "passed" &&
      collectionUiQueueSmoke?.collection_ui?.auto_loaded_first_canonical_assignment === true &&
      collectionUiQueueSmoke?.collection_ui?.record_button_disabled_without_camera_and_consent === true,
    operator_ui_active_queue_only: collectionUiQueueSmoke?.status === "passed" &&
      collectionUiQueueSmoke?.collection_ui?.select_option_count ===
        (activeCollectionQueue?.queue_summary?.assignment_count ?? null) &&
      collectionUiQueueSmoke?.collection_ui?.select_has_non_queued_option === false,
    collection_session_bundle_ready: collectionSessionBundle?.status === "ready_for_capture" &&
      collectionSessionBundle?.capture_ready === true,
    collection_session_bundle_queue_path: collectionSessionBundle?.remediation_queue?.path ?? null,
    collection_session_bundle_queue_sha256: collectionSessionBundle?.remediation_queue?.sha256 ?? null,
    store_preflight_status: firstPartyStorePreflight?.status ?? null,
    store_preflight_non_mutating: firstPartyStorePreflight?.decision_boundary?.creates_collection_store === false &&
      firstPartyStorePreflight?.decision_boundary?.creates_or_modifies_clips === false &&
      firstPartyStorePreflight?.decision_boundary?.trains_or_promotes_model === false,
    store_runtime_can_initialize_empty_schema:
      firstPartyStorePreflight?.runtime_contract?.server_runtime_initializes_empty_store_on_missing_file === true,
    store_is_gitignored: firstPartyStorePreflight?.runtime_contract?.canonical_store_is_gitignored === true,
    first_queue_assignment_key: focusedQueueFirstRow?.assignment_key ?? null,
    first_queue_label_id: focusedQueueFirstRow?.label_id ?? null,
    lesson_collection_status: lessonReadiness?.status ?? null,
    approved_assignment_count: lessonReadiness?.coverage?.approved_assignment_count ?? null,
    blocker_count: lessonBlockers.length + (firstPartyStore.exists ? 0 : 1),
  };

  const nvidia = {
    source_register_status: nvidiaSource?.license_review_status ?? "not_registered",
    metadata_audit_status: nvidiaMetadataAudit?.status ?? null,
    access_receipt_exists: nvidiaMetadataAudit?.inputs?.access_receipt?.exists === true,
    metadata_dir_exists: nvidiaMetadataAudit?.inputs?.metadata_dir?.exists === true,
    metadata_file_count: nvidiaMetadataAudit?.file_inventory?.file_count ?? null,
    asl_pilot_overlap_count: nvidiaMetadataAudit?.metadata_summary?.asl_pilot_overlap_count ?? null,
    public_s3_access_status: nvidiaPublicS3AccessAudit?.status ?? null,
    public_s3_local_dataset_file_count: nvidiaPublicS3AccessAudit?.local_dataset_target?.file_count ?? null,
    public_s3_observed_bucket_region: nvidiaPublicS3AccessAudit?.s3_access_evidence?.observed_bucket_region_from_s3 ?? null,
    public_s3_registry_region: nvidiaPublicS3AccessAudit?.registry_evidence?.registry_region ?? null,
    blocker_count: Array.isArray(nvidiaMetadataAudit?.blockers) ? nvidiaMetadataAudit.blockers.length : null,
  };

  const academic = {
    assignment_scope_mode: academicImportPlan?.assignment_scope?.mode ?? null,
    import_plan_status: academicImportPlan?.status ?? null,
    import_plan_blocker_count: Array.isArray(academicImportPlan?.blockers) ? academicImportPlan.blockers.length : null,
    asl_citizen_source_register_status: aslCitizenAcademicSource?.license_review_status ?? null,
    asl_citizen_allowed_for_training: aslCitizenAcademicSource?.allowed_for_model_training === true,
    asl_citizen_local_status: academicImportPlan?.local_dataset_state?.asl_citizen?.status ?? null,
    wlasl_source_register_status: wlaslAcademicSource?.license_review_status ?? null,
    wlasl_allowed_for_training: wlaslAcademicSource?.allowed_for_model_training === true,
    wlasl_metadata_status: academicImportPlan?.local_dataset_state?.wlasl?.status ?? null,
    wlasl_exact_overlap_label_count: academicImportPlan?.local_dataset_state?.wlasl?.exact_overlap_label_count ?? null,
    wlasl_probe_status: wlaslAcademicRawUrlProbe?.status ?? null,
    wlasl_probe_usable_candidate_count: wlaslAcademicRawUrlProbe?.summary?.usable_candidate_count ?? null,
    wlasl_probe_labels_with_usable_candidate_count:
      wlaslAcademicRawUrlProbe?.summary?.labels_with_usable_candidate_count ?? null,
    wlasl_selected_clip_import_status: wlaslAcademicSelectedClipImport?.status ?? null,
    wlasl_selected_clip_count: wlaslAcademicSelectedClipImport?.summary?.imported_clip_count ?? null,
    wlasl_selected_label_count: wlaslAcademicSelectedClipImport?.summary?.label_count ?? null,
    wlasl_selected_total_bytes: wlaslAcademicSelectedClipImport?.summary?.total_bytes ?? null,
    wlasl_diagnostic_manifest_status: wlaslAcademicSelectedManifests?.status ?? null,
    wlasl_diagnostic_manifest_label_count:
      wlaslAcademicSelectedManifests?.split_policy?.selected_label_count ?? null,
    wlasl_diagnostic_train_clip_count:
      wlaslAcademicSelectedManifests?.output_manifests?.train?.clip_count ?? null,
    wlasl_diagnostic_validation_clip_count:
      wlaslAcademicSelectedManifests?.output_manifests?.validation?.clip_count ?? null,
    wlasl_diagnostic_test_clip_count:
      wlaslAcademicSelectedManifests?.output_manifests?.test?.clip_count ?? null,
    wlasl_diagnostic_training_status: wlaslAcademicDiagnosticTraining?.training_status ?? null,
    wlasl_diagnostic_validation_status: wlaslAcademicDiagnosticValidation?.status ?? null,
    wlasl_diagnostic_test_top1: wlaslAcademicDiagnosticValidation?.test?.top1_accuracy ?? null,
    wlasl_diagnostic_passes_targets: wlaslAcademicDiagnosticValidation?.passes_targets ?? null,
    asl_citizen_selected_clip_import_status: aslCitizenSelectedClipImport?.status ?? null,
    asl_citizen_selected_clip_count: aslCitizenSelectedClipImport?.selected_clip_count ?? null,
    asl_citizen_selected_label_count: aslCitizenSelectedClipImport?.label_count ?? null,
    asl_citizen_selected_total_bytes: aslCitizenSelectedClipImport?.selected_total_bytes ?? null,
    asl_citizen_diagnostic_manifest_status: aslCitizenSelectedManifests?.status ?? null,
    asl_citizen_diagnostic_train_clip_count:
      aslCitizenSelectedManifests?.output_manifests?.train?.clip_count ?? null,
    asl_citizen_diagnostic_validation_clip_count:
      aslCitizenSelectedManifests?.output_manifests?.validation?.clip_count ?? null,
    asl_citizen_diagnostic_test_clip_count:
      aslCitizenSelectedManifests?.output_manifests?.test?.clip_count ?? null,
  };

  const model = {
    model_card_status: modelCard?.status ?? null,
    validation_status: validationReport?.status ?? null,
    mixed_clip_heldout_training_status: mixedClipHeldoutTraining?.training_status ?? null,
    mixed_clip_heldout_validation_status: mixedClipHeldoutValidation?.status ?? null,
    mixed_clip_heldout_test_top1: mixedClipHeldoutValidation?.test?.top1_accuracy ?? null,
    mixed_clip_heldout_test_macro_f1: mixedClipHeldoutValidation?.test?.macro_f1 ?? null,
    mixed_clip_heldout_test_false_pass_rate:
      mixedClipHeldoutValidation?.test?.threshold_metrics?.false_pass_rate ?? null,
    mixed_clip_heldout_negative_challenge_false_pass_rate:
      mixedClipHeldoutValidation?.negative_challenge?.metrics?.false_pass_rate ?? null,
    emergency_prompt_verifier_subset_status: promptVerifierSubset?.status ?? null,
    emergency_prompt_verifier_label_count: promptVerifierSubset?.selection?.label_count ?? null,
    emergency_prompt_verifier_split_policy: promptVerifierSubset?.selection?.split_policy?.type ?? null,
    emergency_prompt_verifier_status: promptVerifierReport?.status ?? null,
    emergency_prompt_verifier_test_top1: promptVerifierReport?.test?.top1_accuracy ?? null,
    emergency_prompt_verifier_test_macro_f1: promptVerifierReport?.test?.macro_f1 ?? null,
    emergency_prompt_verifier_test_true_accept_rate:
      promptVerifierReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_verifier_test_wrong_prompt_false_pass_rate:
      promptVerifierReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_verifier_negative_challenge_false_pass_rate:
      promptVerifierReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_status: promptClassifierVerifierReport?.status ?? null,
    emergency_prompt_classifier_verifier_test_top1:
      promptClassifierVerifierReport?.test?.top1_accuracy ?? null,
    emergency_prompt_classifier_verifier_test_macro_f1:
      promptClassifierVerifierReport?.test?.macro_f1 ?? null,
    emergency_prompt_classifier_verifier_test_true_accept_rate:
      promptClassifierVerifierReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_classifier_verifier_test_wrong_prompt_false_pass_rate:
      promptClassifierVerifierReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_negative_challenge_false_pass_rate:
      promptClassifierVerifierReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_status:
      promptClassifierVerifierAslCitizenReport?.status ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_test_top1:
      promptClassifierVerifierAslCitizenReport?.test?.top1_accuracy ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_test_macro_f1:
      promptClassifierVerifierAslCitizenReport?.test?.macro_f1 ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_test_true_accept_rate:
      promptClassifierVerifierAslCitizenReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_test_wrong_prompt_false_pass_rate:
      promptClassifierVerifierAslCitizenReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_negative_challenge_false_pass_rate:
      promptClassifierVerifierAslCitizenReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_status:
      promptClassifierVerifierAslCitizenRejectReport?.status ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_test_top1:
      promptClassifierVerifierAslCitizenRejectReport?.test?.top1_accuracy ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_test_macro_f1:
      promptClassifierVerifierAslCitizenRejectReport?.test?.macro_f1 ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_test_true_accept_rate:
      promptClassifierVerifierAslCitizenRejectReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_test_wrong_prompt_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_negative_challenge_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_status:
      promptClassifierVerifierAslCitizenRejectOodReport?.status ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_test_top1:
      promptClassifierVerifierAslCitizenRejectOodReport?.test?.top1_accuracy ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_test_macro_f1:
      promptClassifierVerifierAslCitizenRejectOodReport?.test?.macro_f1 ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_test_true_accept_rate:
      promptClassifierVerifierAslCitizenRejectOodReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_test_wrong_prompt_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_negative_challenge_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_hard_negative_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodReport?.hard_negative_reject_eval?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_status:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.status ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_gate_enabled:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.second_stage_reject_gate?.enabled === true,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_max_reject_probability:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.second_stage_reject_gate?.max_reject_probability ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_test_top1:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.test?.top1_accuracy ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_test_macro_f1:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.test?.macro_f1 ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_test_true_accept_rate:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.test?.threshold_metrics?.true_accept_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_test_wrong_prompt_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.test?.threshold_metrics?.wrong_prompt_false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_negative_challenge_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.negative_challenge?.false_pass_rate ?? null,
    emergency_prompt_classifier_verifier_asl_citizen_reject_ood_two_stage_hard_negative_false_pass_rate:
      promptClassifierVerifierAslCitizenRejectOodTwoStageReport?.hard_negative_reject_eval?.false_pass_rate ?? null,
    canonical_verifier_manifest_status: canonicalVerifierManifests?.status ?? null,
    canonical_verifier_selected_label_count:
      canonicalVerifierManifests?.selection?.selected_label_count ?? null,
    canonical_verifier_selected_label_ids:
      (canonicalVerifierManifests?.selection?.selected_labels ?? []).map((label) => label.label_id),
    canonical_verifier_template_clip_count:
      canonicalVerifierManifests?.output_manifests?.templates?.clip_count ?? null,
    canonical_verifier_calibration_clip_count:
      canonicalVerifierManifests?.output_manifests?.calibration?.clip_count ?? null,
    canonical_verifier_test_clip_count:
      canonicalVerifierManifests?.output_manifests?.test?.clip_count ?? null,
    canonical_verifier_wrong_prompt_calibration_pair_count:
      canonicalVerifierManifests?.wrong_prompt_pairs?.calibration?.pair_count ?? null,
    canonical_verifier_wrong_prompt_test_pair_count:
      canonicalVerifierManifests?.wrong_prompt_pairs?.test?.pair_count ?? null,
    canonical_verifier_hard_negative_calibration_clip_count:
      canonicalVerifierManifests?.output_manifests?.hardNegativeCalibration?.clip_count ?? null,
    canonical_verifier_hard_negative_test_clip_count:
      canonicalVerifierManifests?.output_manifests?.hardNegativeTest?.clip_count ?? null,
    canonical_verifier_core_negative_clip_count:
      canonicalVerifierManifests?.output_manifests?.coreNegative?.clip_count ?? null,
    canonical_verifier_helper_feature_status:
      canonicalVerifierManifests?.helper_feature_boundary?.helper_feature_status ?? null,
    canonical_verifier_helper_features_status:
      canonicalVerifierHelperFeatures?.status ?? null,
    canonical_verifier_helper_features_record_count:
      canonicalVerifierHelperFeatures?.features?.feature_record_count ?? null,
    canonical_verifier_helper_features_pretrained_components:
      canonicalVerifierHelperFeatures?.helper_boundary?.pretrained_components ?? null,
    canonical_verifier_helper_features_landmark_components:
      canonicalVerifierHelperFeatures?.helper_boundary?.landmark_components ?? null,
    canonical_verifier_decision_model_status:
      canonicalVerifierHelperFeatures?.helper_boundary?.official_decision_model ??
      canonicalVerifierManifests?.helper_feature_boundary?.official_decision_model_status ??
      null,
    canonical_verifier_helper_template_status:
      canonicalVerifierHelperTemplateReport?.status ?? null,
    canonical_verifier_helper_template_balanced_accuracy:
      canonicalVerifierHelperTemplateReport?.test?.balanced_accuracy ?? null,
    canonical_verifier_helper_template_true_accept_rate:
      canonicalVerifierHelperTemplateReport?.test?.positive?.true_accept_rate ?? null,
    canonical_verifier_helper_template_wrong_prompt_false_pass_rate:
      canonicalVerifierHelperTemplateReport?.test?.wrong_prompt?.false_pass_rate ?? null,
    canonical_verifier_helper_template_hard_negative_false_pass_rate:
      canonicalVerifierHelperTemplateReport?.test?.hard_negative?.false_pass_rate ?? null,
    canonical_verifier_helper_template_core_negative_false_pass_rate:
      canonicalVerifierHelperTemplateReport?.core_negative_challenge?.false_pass_rate ?? null,
    canonical_verifier_lstm_status:
      canonicalVerifierLstmReport?.status ?? null,
    canonical_verifier_lstm_balanced_accuracy:
      canonicalVerifierLstmReport?.test?.balanced_accuracy ?? null,
    canonical_verifier_lstm_true_accept_rate:
      canonicalVerifierLstmReport?.test?.positive?.true_accept_rate ?? null,
    canonical_verifier_lstm_wrong_prompt_false_pass_rate:
      canonicalVerifierLstmReport?.test?.wrong_prompt?.false_pass_rate ?? null,
    canonical_verifier_lstm_hard_negative_false_pass_rate:
      canonicalVerifierLstmReport?.test?.hard_negative?.false_pass_rate ?? null,
    canonical_verifier_lstm_core_negative_false_pass_rate:
      canonicalVerifierLstmReport?.core_negative_challenge?.false_pass_rate ?? null,
    canonical_verifier_lstm_pretrained_components:
      canonicalVerifierLstmReport?.method?.pretrained_components ?? null,
    canonical_verifier_lstm_landmark_components:
      canonicalVerifierLstmReport?.method?.landmark_components ?? null,
    canonical_verifier_collection_packet_status:
      canonicalVerifierCollectionPacket?.status ?? null,
    canonical_verifier_collection_packet_selected_label_count:
      canonicalVerifierCollectionPacket?.packet_summary?.selected_label_count ?? null,
    canonical_verifier_collection_packet_vocabulary_assignment_count:
      canonicalVerifierCollectionPacket?.packet_summary?.vocabulary_assignment_count ?? null,
    canonical_verifier_collection_packet_hard_negative_assignment_count:
      canonicalVerifierCollectionPacket?.packet_summary?.hard_negative_assignment_count ?? null,
    canonical_verifier_collection_packet_preferred_hard_negative_gap_count:
      canonicalVerifierCollectionPacket?.packet_summary?.preferred_hard_negative_gap_count ?? null,
    canonical_verifier_collection_packet_output:
      canonicalVerifierCollectionPacket?.bundle?.output ?? null,
    canonical_verifier_collection_readiness_status:
      canonicalVerifierCollectionReadiness?.status ?? null,
    canonical_verifier_collection_readiness_vocabulary_required:
      canonicalVerifierCollectionReadiness?.coverage?.vocabulary?.required_assignment_count ?? null,
    canonical_verifier_collection_readiness_vocabulary_approved:
      canonicalVerifierCollectionReadiness?.coverage?.vocabulary?.approved_assignment_count ?? null,
    canonical_verifier_collection_readiness_hard_negative_required:
      canonicalVerifierCollectionReadiness?.coverage?.hard_negative?.required_assignment_count ?? null,
    canonical_verifier_collection_readiness_hard_negative_approved:
      canonicalVerifierCollectionReadiness?.coverage?.hard_negative?.approved_assignment_count ?? null,
    canonical_verifier_collection_readiness_blocker_count:
      canonicalVerifierCollectionReadiness?.blocker_count ?? null,
    canonical_verifier_first_party_manifest_export_status:
      canonicalVerifierFirstPartyManifestExport?.status ?? null,
    canonical_verifier_first_party_manifest_export_output_dir:
      canonicalVerifierFirstPartyManifestExport?.output_dir ?? null,
    canonical_verifier_first_party_manifest_export_manifest_count:
      canonicalVerifierFirstPartyManifestExport?.manifest_export?.files?.length ?? null,
    readiness_status: readiness?.status ?? null,
    readiness_failed_checks: (readiness?.checks ?? [])
      .filter((check) => check?.status === "failed")
      .map((check) => check.id),
  };

  const academicSourceReady = academic.import_plan_status === "ready_for_raw_clip_selection" &&
    academic.asl_citizen_allowed_for_training &&
    academic.wlasl_allowed_for_training &&
    academic.wlasl_metadata_status === "metadata_loaded";
  const academicWlaslProbeReady = wlaslAcademicRawUrlProbe?.status === "available_raw_url_candidates_found" &&
    (academic.wlasl_probe_usable_candidate_count ?? 0) > 0;
  const academicSelectedClipImportReady =
    wlaslAcademicSelectedClipImport?.status === "selected_raw_clips_imported" &&
    (academic.wlasl_selected_clip_count ?? 0) > 0;
  const academicDiagnosticSmokeReady =
    wlaslAcademicSelectedManifests?.status === "written" &&
    wlaslAcademicDiagnosticTraining?.training_status === "completed" &&
    wlaslAcademicDiagnosticValidation?.status === "smoke_only";
  // First-party queue readiness is retained as planning evidence, but the active
  // 2026-05-25 user correction excludes browser-capture collection as the route.
  const firstPartyRouteSelected = false;
  const blockers = [];
  if (firstPartyRouteSelected && !academicSourceReady) {
    if (!firstParty.store_exists) blockers.push("First-party collection store is absent: data/asl-pilot-store.json");
    if (firstParty.operator_api_smoke_passed !== true) {
      blockers.push("Active canonical/focused collection queue is not proven through the authenticated default collection API");
    }
    if (firstParty.operator_ui_smoke_passed !== true) {
      blockers.push("Active canonical/focused collection queue is not proven through the authenticated operator UI");
    }
    if (firstParty.operator_ui_active_queue_only !== true) {
      blockers.push("Authenticated operator UI is not proven to hide non-queued full-plan assignments by default");
    }
    if (firstParty.collection_session_bundle_ready !== true) {
      blockers.push("Collection session bundle is not ready for capture");
    }
    if (firstParty.collection_session_bundle_queue_path !== activeCollectionQueuePath) {
      blockers.push("Collection session bundle does not reference the active canonical/focused collection queue");
    }
    if (firstParty.store_preflight_non_mutating !== true) {
      blockers.push("First-party store preflight is missing or not proven non-mutating");
    }
    if (firstParty.store_runtime_can_initialize_empty_schema !== true) {
      blockers.push("First-party store preflight does not prove empty-schema initialization is available");
    }
    if (firstParty.store_is_gitignored !== true) {
      blockers.push("First-party store preflight does not prove the canonical store path is gitignored");
    }
    if (firstParty.approved_assignment_count !== null && firstParty.approved_assignment_count <= 0) {
      blockers.push("No approved first-party lesson assignments are ready for manifest export");
    }
  }
  if (!academicSourceReady) {
    blockers.push("Academic ASL Citizen/WLASL source path is not ready for raw clip selection");
  }
  if (academicSourceReady && !academicWlaslProbeReady) {
    blockers.push("WLASL exact-overlap raw URL probe has not found usable candidates yet");
  }
  if (academicWlaslProbeReady && !academicSelectedClipImportReady) {
    blockers.push("Selected WLASL raw clips have not been imported into the ignored external-data path");
  }
  if (model.model_card_status !== "trained") blockers.push("Browser model card is not trained");
  if (model.validation_status !== "controlled_pilot_validation_passed") {
    blockers.push("Controlled-pilot validation has not passed");
  }

  const firstPartyPlanningReady = firstParty.source_register_status === "approved_after_clip_level_consent" &&
    firstParty.collection_queue_ready &&
    firstParty.operator_api_smoke_passed &&
    firstParty.operator_ui_smoke_passed &&
    firstParty.operator_ui_active_queue_only &&
    firstParty.collection_session_bundle_ready &&
    firstParty.collection_session_bundle_queue_path === activeCollectionQueuePath &&
    firstParty.store_preflight_non_mutating &&
    firstParty.store_runtime_can_initialize_empty_schema &&
    firstParty.store_is_gitignored;
  const firstPartyCaptureReady = firstPartyRouteSelected && firstPartyPlanningReady;
  const nvidiaMetadataReviewReady = nvidia.metadata_audit_status === "metadata_review_ready_not_approved" &&
    nvidia.source_register_status !== "approved_raw_video_training_scope";
  const academicClipImportReady = academicSourceReady && academicWlaslProbeReady;
  const academicSelectedClipsReady = academicClipImportReady && academicSelectedClipImportReady;

  return {
    schema_version: "asl-pilot-controlled-pilot-source-remediation-status/v1",
    status: blockers.length === 0 ? "ready_for_controlled_pilot_retraining" : "blocked_waiting_for_training_or_validation",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference("scripts/audit_controlled_pilot_source_remediation_status.mjs"),
    },
    decision_boundary: {
      changes_training_data: false,
      changes_manifests: false,
      changes_model_card: false,
      approves_external_sources: false,
      imports_external_media: false,
    },
    inputs: Object.fromEntries(Object.entries(paths).map(([key, relativePath]) => [key, fileReference(relativePath)])),
    source_paths: {
      first_party_browser_collection: firstParty,
      noncommercial_academic_sources: academic,
      nvidia_asl_1000: nvidia,
      popsign_v1_current_baseline: {
        source_register_status: popsignSource?.license_review_status ?? null,
        decision_id: popsignSource?.decision_id ?? null,
        limitation: "current approved baseline exists but the retained controlled-pilot model still fails validation",
      },
    },
    model_status: model,
    next_actions: {
      first_party_route_selected: firstPartyRouteSelected,
      first_party_planning_ready: firstPartyPlanningReady,
      first_party_capture_ready: firstPartyCaptureReady,
      nvidia_metadata_review_ready: nvidiaMetadataReviewReady,
      academic_clip_import_ready: academicClipImportReady,
      academic_selected_clips_ready: academicSelectedClipsReady,
      academic_diagnostic_smoke_ready: academicDiagnosticSmokeReady,
      canonical_collection_packet_ready:
        model.canonical_verifier_collection_packet_status === "canonical_collection_packet_ready_not_training_data",
      canonical_collection_readiness_ready:
        model.canonical_verifier_collection_readiness_status === "ready_for_canonical_verifier_manifest_export",
      canonical_first_party_manifests_export_ready:
        model.canonical_verifier_first_party_manifest_export_status === "canonical_first_party_manifests_export_ready",
      recommended_next_action: firstPartyRouteSelected &&
            model.canonical_verifier_lstm_status === "diagnostic_failed" &&
            model.canonical_verifier_collection_readiness_status === "ready_for_canonical_verifier_manifest_export"
        ? "export_first_party_canonical_verifier_manifests_then_validate"
        : firstPartyRouteSelected &&
            model.canonical_verifier_lstm_status === "diagnostic_failed" &&
            model.canonical_verifier_collection_packet_status === "canonical_collection_packet_ready_not_training_data"
        ? "collect_first_party_canonical_verifier_clips_from_packet"
        : model.mixed_clip_heldout_validation_status === "controlled_clip_heldout_validation_failed"
          ? "scale_approved_raw_video_data_or_change_compliant_model_strategy_before_next_controlled_training"
        : academicDiagnosticSmokeReady
          ? "scale_academic_source_bound_data_or_merge_with_popsign_then_train_controlled_pilot_model"
        : academicSelectedClipsReady
          ? "export_academic_source_bound_manifests_then_train_and_validate"
        : academicClipImportReady
          ? "import_selected_academic_raw_clips_with_source_bound_manifests"
        : firstPartyCaptureReady
          ? "collect_and_review_first_party_clips_from_focused_queue"
          : "probe_wlasl_exact_overlap_raw_urls_then_import_selected_academic_raw_clips",
      after_new_approved_evidence: [
        "rerun_manifest_export",
        "retrain_from_approved_raw_video_only",
        "rerun_controlled_pilot_validation",
        "export_and_promote_only_if_validation_passes",
      ],
    },
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const status = buildStatus();
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: status.status,
    output: args.write ? projectRelative(args.output) : null,
    first_party_capture_ready: status.next_actions.first_party_capture_ready,
    nvidia_metadata_review_ready: status.next_actions.nvidia_metadata_review_ready,
    academic_clip_import_ready: status.next_actions.academic_clip_import_ready,
    academic_selected_clips_ready: status.next_actions.academic_selected_clips_ready,
    academic_diagnostic_smoke_ready: status.next_actions.academic_diagnostic_smoke_ready,
    recommended_next_action: status.next_actions.recommended_next_action,
    blocker_count: status.blockers.length,
    blockers: status.blockers,
  }, null, 2));
  return status.status === "ready_for_controlled_pilot_retraining" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Controlled-pilot source remediation status failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
