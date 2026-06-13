import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");

const paths = {
  supportedLabelRegistry: "docs/validation/supported-label-registry.json",
  modelCard: "web/public/model/model-card.json",
  vocabulary: "web/src/lib/vocabulary.ts",
  appValidationPage: "web/src/app/validation/page.tsx",
  docsMatrix: "docs/validation/final-claim-matrix.json",
  publicMatrix: "web/public/model/claim-matrix.json",
  noPretrainedLaneAudit: "docs/validation/no-pretrained-lane-audit.json",
  m3diPostScaffoldDecision:
    "docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json",
  m3djNonRecognitionMvpPlan:
    "docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json",
  observer459RedirectLog: "docs/session-logs/459-observer-redirect-fail-closed-non-recognition-mvp.md",
  m3ahCudaRecognizer: "docs/validation/return-to-form-overnight-tier0-cuda-recognizer-v1.json",
  m3ahDataVocabularyDecision: "docs/validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json",
  m3aqReducedModuleSmoke:
    "docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json",
  m3arOvernightRecoveryDecision: "docs/validation/return-to-form-overnight-recovery-decision-v1.json",
};

const matrixSchemaVersion = "asl-pilot-final-claim-matrix/v1";
const matrixStatus = "no_active_claim_rawframe_not_trained";

function parseArgs(argv) {
  const args = {
    write: false,
    docsMatrix: path.join(root, paths.docsMatrix),
    publicMatrix: path.join(root, paths.publicMatrix),
  };
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
    if (item === "--docs-matrix") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.docsMatrix = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    if (item === "--public-matrix") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.publicMatrix = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_final_claim_matrix.mjs [--write]

Builds and audits the reviewer-facing final claim matrix used by the /validation
route. After round-001 task-026 (Stage A / MediaPipe vestige removal), there is
no active CV claim. In the current Mission 3DK status-refresh lane, M3DI parked
recognition after the post-scaffold failure evidence and M3DJ redirected to a
fail-closed non-recognition learning MVP. The browser model remains not_trained,
and the product surface remains learn-only until a future human-approved
model/data scope changes that state.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
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
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function vocabularyCount() {
  const source = fs.readFileSync(path.join(root, paths.vocabulary), "utf8");
  return [...source.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",/gm)].length;
}

function buildMatrix() {
  const modelCard = readJson(paths.modelCard);
  const registry = readJson(paths.supportedLabelRegistry);
  const m3ahCudaRecognizer = readJson(paths.m3ahCudaRecognizer);
  const m3ahDataDecision = readJson(paths.m3ahDataVocabularyDecision);
  const m3aqReducedModuleSmoke = readJson(paths.m3aqReducedModuleSmoke);
  const m3arOvernightDecision = readJson(paths.m3arOvernightRecoveryDecision);
  const m3diPostScaffoldDecision = readJson(paths.m3diPostScaffoldDecision);
  const m3djNonRecognitionMvpPlan = readJson(paths.m3djNonRecognitionMvpPlan);
  const learnOnlyCount = vocabularyCount();
  const cudaValidation = m3ahCudaRecognizer.evaluation_run?.validation ?? {};
  const cudaTest = m3ahCudaRecognizer.evaluation_run?.test ?? {};
  const cudaPassStatus = m3ahCudaRecognizer.evaluation_run?.pass_status ?? {};
  const cudaThreshold = cudaTest.threshold_metrics_at_selected_threshold ?? {};
  const m3aqTrain = m3aqReducedModuleSmoke.training_result ?? {};
  const m3aqEval = m3aqReducedModuleSmoke.evaluation_result ?? {};
  const tier0Labels = m3ahDataDecision.current_tier0_vocabulary?.labels ?? [];
  const tier0Summary = tier0Labels.length > 0 ? tier0Labels.join(", ") : "none";
  const m3diSelectedAction =
    m3diPostScaffoldDecision.decision?.selected_next_action
    ?? m3diPostScaffoldDecision.exactly_one_next_action
    ?? null;
  const m3djSelectedAction =
    m3djNonRecognitionMvpPlan.decision?.selected_next_action
    ?? m3djNonRecognitionMvpPlan.exactly_one_next_action
    ?? null;
  const m3djBrevStatus = m3djNonRecognitionMvpPlan.brev_cost_control_status ?? {};

  return {
    schema_version: matrixSchemaVersion,
    status: matrixStatus,
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference("scripts/audit_final_claim_matrix.mjs"),
      command: process.argv,
    },
    reviewer_surface: {
      route: "/validation",
      route_source: paths.appValidationPage,
      public_matrix: paths.publicMatrix,
      docs_matrix: paths.docsMatrix,
      model_card: paths.modelCard,
    },
    active_cv_claim: null,
    label_support: {
      registry_path: paths.supportedLabelRegistry,
      status: registry.status,
      cv_supported_labels: registry.cv_supported_labels ?? [],
      cv_supported_count: (registry.cv_supported_labels ?? []).length,
      learn_only_count: learnOnlyCount,
      failed_cv_labels: registry.failed_cv_labels ?? [],
    },
    not_validated_lanes: [
      {
        lane: "browser_raw_rgb_webcam_recognition",
        status: modelCard.status,
        boundary: "No first-party browser-webcam/raw-RGB model has been trained, validated, exported, or promoted.",
      },
      {
        lane: "product_domain_or_commercial_recognition",
        status: "not_validated",
        boundary: "No active CV claim has been promoted; product-domain recognition remains a non-claim.",
      },
      {
        lane: "first_party_collection_model",
        status: "not_validated",
        boundary: "First-party consent capture is the planned data source for rawframe training; collection is scaffolded but disabled by default.",
      },
      {
        lane: "broader_prompt_catalog_cv_support",
        status: "learn_only",
        boundary: "All prompt-catalog labels are learn-only until the rawframe lane is trained and a model card is promoted.",
      },
    ],
    source_artifacts: {
      supported_label_registry: fileReference(paths.supportedLabelRegistry),
      model_card: fileReference(paths.modelCard),
      validation_route_source: fileReference(paths.appValidationPage),
      no_pretrained_lane_audit: fileReference(paths.noPretrainedLaneAudit),
      m3di_post_scaffold_decision: fileReference(paths.m3diPostScaffoldDecision),
      m3dj_non_recognition_mvp_plan: fileReference(paths.m3djNonRecognitionMvpPlan),
      observer_459_redirect_log: fileReference(paths.observer459RedirectLog),
      m3ah_cuda_recognizer: fileReference(paths.m3ahCudaRecognizer),
      m3ah_data_vocabulary_decision: fileReference(paths.m3ahDataVocabularyDecision),
      m3aq_reduced_module_smoke: fileReference(paths.m3aqReducedModuleSmoke),
      m3ar_overnight_recovery_decision: fileReference(paths.m3arOvernightRecoveryDecision),
    },
    recent_ml_evidence: {
      mission: "M3DI/M3DJ fail-closed non-recognition redirect",
      status: "status_refreshed_no_active_browser_cv_claim",
      post_scaffold_strategy_downscope_decision: {
        path: paths.m3diPostScaffoldDecision,
        status: m3diPostScaffoldDecision.status ?? null,
        selected_next_action: m3diSelectedAction,
        recognition_track_parked:
          m3diPostScaffoldDecision.stop_or_parking_conditions?.recognition_track_parked_by_selected_decision === true,
        browser_fail_closed_confirmation:
          m3diPostScaffoldDecision.browser_fail_closed_confirmation?.recognition_activation_or_claim_change === false,
      },
      non_recognition_mvp_redirect: {
        path: paths.m3djNonRecognitionMvpPlan,
        status: m3djNonRecognitionMvpPlan.status ?? null,
        selected_next_action: m3djSelectedAction,
        allowed_product_claims:
          (m3djNonRecognitionMvpPlan.allowed_product_claims ?? []).map((claim) => claim.claim ?? claim),
        forbidden_claim_scope:
          "live recognition, automatic grading, trained labels, detector/avatar authority, final readiness, and ASL correctness evaluation remain unsupported",
        browser_recognition_enabled:
          m3djNonRecognitionMvpPlan.claim_and_status_surfaces?.browser_fail_closed_confirmation?.browser_model_bundle
            ?.recognition_enabled === true,
        active_labels:
          m3djNonRecognitionMvpPlan.claim_and_status_surfaces?.browser_fail_closed_confirmation
            ?.active_vocabulary_claim?.activeLabels ?? [],
      },
      brev_cost_control: {
        source: paths.observer459RedirectLog,
        worker_name: m3djBrevStatus.worker_name ?? "asl-pilot-rawframe-001",
        worker_id: m3djBrevStatus.worker_id ?? "2hl1hytty",
        stop_verification: m3djBrevStatus.stop_verification ?? "failed",
        post_stop_status: m3djBrevStatus.status_after_stop_attempts?.status ?? "RUNNING",
        post_stop_shell_status: m3djBrevStatus.status_after_stop_attempts?.shell_status ?? "READY",
        post_stop_health_status: m3djBrevStatus.status_after_stop_attempts?.health_status ?? "HEALTHY",
        m3dk_brev_commands_run: false,
      },
      retained_prior_failed_promotion_evidence: {
        overnight_recovery_decision: {
          path: paths.m3arOvernightRecoveryDecision,
          status: m3arOvernightDecision.status ?? null,
          selected_route: m3arOvernightDecision.selected_route ?? null,
          next_action: m3arOvernightDecision.next_action ?? null,
          paid_compute_launched: m3arOvernightDecision.boundaries_observed?.brev_paid_compute === true,
          browser_trained_activation:
            m3arOvernightDecision.boundaries_observed?.browser_trained_activation === true,
        },
        m3aq_reduced_module_smoke: {
          path: paths.m3aqReducedModuleSmoke,
          train_accuracy_epoch_3: m3aqTrain.history?.at(-1)?.train_accuracy ?? null,
          selected_validation_accuracy: m3aqTrain.selected_checkpoint?.selected_validation_accuracy ?? null,
          validation_top1: m3aqEval.validation_top1_accuracy ?? null,
          validation_macro_f1: m3aqEval.validation_macro_f1 ?? null,
          test_top1: m3aqEval.test_top1_accuracy ?? null,
          test_macro_f1: m3aqEval.test_macro_f1 ?? null,
          test_false_pass_rate_at_threshold: m3aqEval.test_false_pass_rate ?? null,
          negative_challenge_evaluated: m3aqEval.negative_challenge_false_pass_rate !== null,
          promotion_justified: m3aqEval.passes_final_targets === true,
          finality: m3aqEval.finality ?? null,
        },
        cuda_recognizer: {
          path: paths.m3ahCudaRecognizer,
          train_accuracy_epoch_8: m3ahCudaRecognizer.training_run?.history?.at(-1)?.train_accuracy ?? null,
          best_validation_accuracy: m3ahCudaRecognizer.training_run?.selected_checkpoint?.selected_validation_accuracy ?? null,
          validation_top1: cudaValidation.top1_accuracy ?? null,
          validation_macro_f1: cudaValidation.macro_f1 ?? null,
          test_top1: cudaTest.top1_accuracy ?? null,
          test_macro_f1: cudaTest.macro_f1 ?? null,
          test_false_pass_rate_at_threshold: cudaThreshold.false_pass_rate ?? null,
          negative_challenge_evaluated: m3ahCudaRecognizer.evaluation_run?.negative_challenge_evaluated === true,
          promotion_justified: m3ahCudaRecognizer.interpretation?.promotion_justified === true,
          pass_status: {
            top1_accuracy: cudaPassStatus.top1_accuracy === true,
            macro_f1: cudaPassStatus.macro_f1 === true,
            false_pass_rate: cudaPassStatus.false_pass_rate === true,
            negative_challenge_false_pass_rate: cudaPassStatus.negative_challenge_false_pass_rate === true,
          },
        },
        data_vocabulary_decision: {
          path: paths.m3ahDataVocabularyDecision,
          selected_option: m3ahDataDecision.decision?.selected_option ?? null,
          next_action: m3ahDataDecision.decision?.next_action ?? null,
          requires_human_decision: m3ahDataDecision.decision?.requires_human_decision === true,
          tier0_vocabulary_role: m3ahDataDecision.current_tier0_vocabulary?.current_role ?? null,
          tier0_promotion_role: m3ahDataDecision.current_tier0_vocabulary?.promotion_role ?? null,
          tier0_labels: tier0Labels,
        },
      },
    },
    progress_ledger: {
      label: "Mission 3DK",
      current_state: `Mission 3DK refreshed the reviewer claim matrix after M3DI selected ${m3diSelectedAction ?? "redirect_to_fail_closed_non_recognition_learning_mvp"} and M3DJ selected ${m3djSelectedAction ?? "continue_fail_closed_product_status_refresh"}. The product lane is a fail-closed non-recognition learning MVP: browser model status remains not_trained, active CV claim remains empty, and practice/lesson attempts remain learn-only history unless a future human-approved model/data scope changes that state.`,
      completed: [
        "M3DI parked the recognizer lane after the post-scaffold route collapsed before the classifier and selected redirect_to_fail_closed_non_recognition_learning_mvp.",
        "M3DJ confirmed /, /lesson, and /validation can support a non-recognition learning MVP with vocabulary practice, guided lessons, local camera self-view, manual review, progress history, and human review handoff.",
        "This matrix refresh represents observer 459 Brev stop-verification evidence: stop commands returned, but repeated status checks still reported the A100 worker RUNNING, READY, and HEALTHY.",
        `Prior unpromoted ML evidence remains retained for context: M3AQ validation top-1 ${m3aqEval.validation_top1_accuracy ?? "n/a"}, test top-1 ${m3aqEval.test_top1_accuracy ?? "n/a"}; M3AH validation top-1 ${cudaValidation.top1_accuracy ?? "n/a"}, test top-1 ${cudaTest.top1_accuracy ?? "n/a"}; neither justified promotion.`,
        "Browser model card, active vocabulary claim, browser bundle, and claim matrix status remain fail-closed.",
      ],
      remaining: [
        "Refresh /, /lesson, and /validation smoke/audit receipts against the current status surfaces.",
        "Resolve the Brev stop-verification blocker through human/provider cost-control action if the worker still reports running.",
        "Require a new bounded prompt and explicit human scope before training, source approval, export, browser activation, model-card promotion, or final-gate work resumes.",
      ],
      blockers: [
        "No trained recognizer or promoted Detector 0 artifact exists; this product remains learn-only.",
        "Observer 459 Brev stop-verification failed: stop commands returned, but the A100 worker still reported RUNNING, READY, and HEALTHY.",
        "web/public/model/model-card.json provenance_note still mentions an older forward path, but M3DK forbids hand-editing that model-card file; its fail-closed status remains truthful.",
        "Existing browser smoke receipts predate this status refresh and should be refreshed next.",
      ],
      next_step: "continue_fail_closed_product_smoke_refresh; do not restart training, Brev, source approval, export, browser activation, model-card promotion, or final-gate work without explicit human scope.",
    },
    provenance_note: "M3DI and M3DJ redirect ASL Pilot to a fail-closed non-recognition learning MVP while recognition remains parked. This matrix is a status surface only: browser raw-RGB recognition is not_trained, active_cv_claim is null, activeLabels remain empty, and observer 459's Brev stop-verification blocker remains a human/provider cost-control issue.",
  };
}

function matrixCore(matrix) {
  return {
    schema_version: matrix.schema_version,
    status: matrix.status,
    route: matrix.reviewer_surface?.route,
    active_cv_claim: matrix.active_cv_claim,
    cv_supported_count: matrix.label_support?.cv_supported_count,
    learn_only_count: matrix.label_support?.learn_only_count,
    browser_lane_status: matrix.not_validated_lanes?.find((lane) => lane.lane === "browser_raw_rgb_webcam_recognition")?.status,
    progress_label: matrix.progress_ledger?.label,
    progress_next_step: matrix.progress_ledger?.next_step,
    recent_ml_evidence_mission: matrix.recent_ml_evidence?.mission,
    provenance_note: matrix.provenance_note,
  };
}

function auditMatrix(matrix, docsMatrixPath, publicMatrixPath) {
  const blockers = [];

  if (matrix.schema_version !== matrixSchemaVersion) {
    blockers.push(`Claim matrix schema_version must be ${matrixSchemaVersion}.`);
  }
  if (matrix.status !== matrixStatus) {
    blockers.push(`Claim matrix status must be ${matrixStatus} until a trained rawframe model card is promoted.`);
  }
  if (matrix.reviewer_surface?.route !== "/validation") {
    blockers.push("Reviewer surface route must be /validation.");
  }
  if (!fs.existsSync(path.join(root, paths.appValidationPage))) {
    blockers.push("Validation route source is missing.");
  }
  if (matrix.active_cv_claim !== null) {
    blockers.push("active_cv_claim must be null until a trained rawframe model card is promoted; no Stage A / academic-benchmark claim is permitted.");
  }
  if (Object.prototype.hasOwnProperty.call(matrix, "primary_relaxed_stage_a_lane")) {
    blockers.push("primary_relaxed_stage_a_lane must not appear in the final claim matrix after the Stage A vestige removal.");
  }
  if (Object.prototype.hasOwnProperty.call(matrix, "metric_frontier")) {
    blockers.push("metric_frontier must not appear in the final claim matrix after the primarymath-keypoint research lane was removed.");
  }
  if (Object.prototype.hasOwnProperty.call(matrix, "failed_expansions")) {
    blockers.push("failed_expansions must not appear in the final claim matrix after the primarymath-keypoint research lane was removed.");
  }

  const browserLane = matrix.not_validated_lanes?.find((lane) => lane.lane === "browser_raw_rgb_webcam_recognition");
  if (browserLane?.status !== "not_trained") {
    blockers.push("Browser raw RGB/webcam lane must remain not_trained.");
  }
  const progressLedgerText = JSON.stringify(matrix.progress_ledger ?? {});
  if (!progressLedgerText.includes("Mission 3DK")) {
    blockers.push("progress_ledger must describe the current Mission 3DK fail-closed product status refresh.");
  }
  if (!progressLedgerText.includes("M3DI") || !progressLedgerText.includes("M3DJ")) {
    blockers.push("progress_ledger must bind the current status to the M3DI/M3DJ non-recognition redirect.");
  }
  if (!progressLedgerText.includes("stop-verification")) {
    blockers.push("progress_ledger must include the observer 459 Brev stop-verification blocker.");
  }
  if (
    progressLedgerText.includes("Finish the Mission 3AR overnight recovery decision receipt") ||
    progressLedgerText.includes("Write the overnight recovery decision receipt") ||
    progressLedgerText.includes("Classify the current Brev auth/cost-control state") ||
    progressLedgerText.includes("continue_product_first_fail_closed_demo_polish_no_spend") ||
    progressLedgerText.includes("Brev CLI is currently blocked on NVIDIA login/2FA")
  ) {
    blockers.push("progress_ledger must not render stale M3AR product-polish or Brev login/2FA wording.");
  }
  if (progressLedgerText.includes("Mission 3AR") || progressLedgerText.includes("Mission 3AG")) {
    blockers.push("progress_ledger must not remain on stale Mission 3AR or Mission 3AG wording.");
  }
  if (matrix.recent_ml_evidence?.mission !== "M3DI/M3DJ fail-closed non-recognition redirect") {
    blockers.push("recent_ml_evidence must bind the claim matrix to the M3DI/M3DJ non-recognition redirect.");
  }
  if (matrix.recent_ml_evidence?.post_scaffold_strategy_downscope_decision?.selected_next_action !== "redirect_to_fail_closed_non_recognition_learning_mvp") {
    blockers.push("recent_ml_evidence.post_scaffold_strategy_downscope_decision.selected_next_action must match the M3DI redirect.");
  }
  if (matrix.recent_ml_evidence?.non_recognition_mvp_redirect?.selected_next_action !== "continue_fail_closed_product_status_refresh") {
    blockers.push("recent_ml_evidence.non_recognition_mvp_redirect.selected_next_action must match the M3DJ status-refresh selection.");
  }
  if (matrix.recent_ml_evidence?.brev_cost_control?.stop_verification !== "failed") {
    blockers.push("recent_ml_evidence.brev_cost_control.stop_verification must record the observer 459 failed stop verification.");
  }
  if (matrix.recent_ml_evidence?.brev_cost_control?.m3dk_brev_commands_run !== false) {
    blockers.push("recent_ml_evidence.brev_cost_control.m3dk_brev_commands_run must be false.");
  }
  const retainedMl = matrix.recent_ml_evidence?.retained_prior_failed_promotion_evidence ?? {};
  if (retainedMl.m3aq_reduced_module_smoke?.promotion_justified !== false) {
    blockers.push("retained prior M3AQ promotion_justified must be false.");
  }
  if (retainedMl.m3aq_reduced_module_smoke?.negative_challenge_evaluated !== false) {
    blockers.push("retained prior M3AQ negative_challenge_evaluated must be false.");
  }
  if (retainedMl.cuda_recognizer?.promotion_justified !== false) {
    blockers.push("retained prior CUDA recognizer promotion_justified must be false.");
  }
  if (retainedMl.cuda_recognizer?.negative_challenge_evaluated !== false) {
    blockers.push("retained prior CUDA recognizer negative_challenge_evaluated must be false.");
  }
  if (retainedMl.data_vocabulary_decision?.selected_option !== "stop_with_reduced_claim") {
    blockers.push("retained prior data_vocabulary_decision.selected_option must be stop_with_reduced_claim.");
  }
  if (/task-026|Round-001|Brev training/.test(progressLedgerText)) {
    blockers.push("progress_ledger must not render stale task-026 or Brev-training next-step wording during Mission 3DK.");
  }

  const noPretrainedReceipt = matrix.source_artifacts?.no_pretrained_lane_audit;
  if (!noPretrainedReceipt || noPretrainedReceipt.exists !== true) {
    blockers.push(`no_pretrained_lane_audit receipt is missing at ${paths.noPretrainedLaneAudit}; run scripts/build_no_pretrained_lane_audit.mjs --write.`);
  } else if (!noPretrainedReceipt.sha256 || !/^[a-f0-9]{64}$/.test(noPretrainedReceipt.sha256)) {
    blockers.push("no_pretrained_lane_audit receipt SHA-256 must be a lowercase 64-char hex digest.");
  }

  const m3arDecisionReceipt = matrix.source_artifacts?.m3ar_overnight_recovery_decision;
  if (!m3arDecisionReceipt || m3arDecisionReceipt.exists !== true) {
    blockers.push(`m3ar_overnight_recovery_decision receipt is missing at ${paths.m3arOvernightRecoveryDecision}.`);
  } else if (!m3arDecisionReceipt.sha256 || !/^[a-f0-9]{64}$/.test(m3arDecisionReceipt.sha256)) {
    blockers.push("m3ar_overnight_recovery_decision receipt SHA-256 must be a lowercase 64-char hex digest.");
  }

  const labelSupport = matrix.label_support;
  if (!labelSupport) {
    blockers.push("label_support block is missing from the final claim matrix.");
  } else {
    if (!Array.isArray(labelSupport.cv_supported_labels) || labelSupport.cv_supported_labels.length > 0) {
      blockers.push("label_support.cv_supported_labels must be an empty array until a trained model card is promoted.");
    }
    if (labelSupport.cv_supported_count !== 0) {
      blockers.push("label_support.cv_supported_count must be 0 until a trained model card is promoted.");
    }
    if (labelSupport.learn_only_count < 1) {
      blockers.push("label_support.learn_only_count must reflect the current vocabulary size.");
    }
  }

  if (!fs.existsSync(docsMatrixPath)) {
    blockers.push(`Docs matrix missing: ${projectRelative(docsMatrixPath)}`);
  }
  if (!fs.existsSync(publicMatrixPath)) {
    blockers.push(`Public matrix missing: ${projectRelative(publicMatrixPath)}`);
  }
  if (fs.existsSync(docsMatrixPath) && fs.existsSync(publicMatrixPath)) {
    const expectedCore = matrixCore(matrix);
    const docsCore = matrixCore(JSON.parse(fs.readFileSync(docsMatrixPath, "utf8")));
    const publicCore = matrixCore(JSON.parse(fs.readFileSync(publicMatrixPath, "utf8")));
    if (JSON.stringify(docsCore) !== JSON.stringify(expectedCore)) {
      blockers.push("Docs claim matrix generated status fields do not match the current generator output.");
    }
    if (JSON.stringify(publicCore) !== JSON.stringify(expectedCore)) {
      blockers.push("Public claim matrix generated status fields do not match the current generator output.");
    }
    if (JSON.stringify(docsCore) !== JSON.stringify(publicCore)) {
      blockers.push("Docs and public claim matrix core fields do not match.");
    }
  }

  return blockers;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const matrix = buildMatrix();
  if (args.write) {
    writeJson(args.docsMatrix, matrix);
    writeJson(args.publicMatrix, matrix);
  }

  const blockers = auditMatrix(matrix, args.docsMatrix, args.publicMatrix);
  console.log(JSON.stringify({
    status: blockers.length === 0 ? "passed" : "failed",
    docs_matrix: projectRelative(args.docsMatrix),
    public_matrix: projectRelative(args.publicMatrix),
    matrix_status: matrix.status,
    active_cv_claim: matrix.active_cv_claim,
    cv_supported_count: matrix.label_support.cv_supported_count,
    learn_only_count: matrix.label_support.learn_only_count,
    reviewer_route: matrix.reviewer_surface.route,
    blockers,
  }, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final claim matrix audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
