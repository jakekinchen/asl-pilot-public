import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "controlled-pilot-model-strategy-triage.json");

const modelReportPaths = [
  {
    id: "final_signer_disjoint_motion",
    label: "Final signer-disjoint motion CNN",
    path: "artifacts/rawframe-model/validation-report.json",
    evidenceClass: "trained_model",
  },
  {
    id: "controlled_signer_disjoint_motion",
    label: "Controlled-pilot signer-disjoint motion CNN",
    path: "artifacts/rawframe-model/controlled-pilot-validation-report.json",
    evidenceClass: "trained_model",
  },
  {
    id: "controlled_clip_heldout_factorized",
    label: "Controlled clip-heldout factorized 3D CNN",
    path: "artifacts/rawframe-model-clip-heldout/validation-report.json",
    evidenceClass: "trained_model_clip_heldout",
  },
  {
    id: "template_95_f16_k3",
    label: "95-label raw-frame template verifier, feature 16 k=3",
    path: "artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-20260521T190000Z/validation-report.json",
    evidenceClass: "diagnostic_template",
  },
  {
    id: "template_95_f16_k3_relaxed",
    label: "95-label raw-frame template verifier, feature 16 k=3 relaxed",
    path: "artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-f16-k3-relaxed-20260521T190000Z/validation-report.json",
    evidenceClass: "diagnostic_template",
  },
  {
    id: "template_95_f24_k1",
    label: "95-label raw-frame template verifier, feature 24 k=1",
    path: "artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-f24-k1-20260521T190000Z/validation-report.json",
    evidenceClass: "diagnostic_template",
  },
  {
    id: "template_ladder_005",
    label: "5-label raw-frame template verifier",
    path: "artifacts/rawframe-model-diagnostics/template-verifier-controlled-ladder-005-20260521T190000Z/validation-report.json",
    evidenceClass: "reduced_label_diagnostic",
  },
  {
    id: "template_ladder_010",
    label: "10-label raw-frame template verifier",
    path: "artifacts/rawframe-model-diagnostics/template-verifier-controlled-ladder-010-20260521T190000Z/validation-report.json",
    evidenceClass: "reduced_label_diagnostic",
  },
];

const hybridDiagnosticPaths = [
  {
    id: "hybrid_cnn_template_strict",
    label: "Hybrid CNN/template prompt verifier, strict precision",
    path: "docs/validation/hybrid-cnn-template-verifier-diagnostic.json",
  },
  {
    id: "hybrid_cnn_template_relaxed",
    label: "Hybrid CNN/template prompt verifier, relaxed precision",
    path: "docs/validation/hybrid-cnn-template-verifier-relaxed-diagnostic.json",
  },
];

const scoreDiagnosticPaths = [
  {
    id: "browser_quality_gate",
    label: "Browser raw-frame quality gate diagnostic",
    path: "docs/validation/controlled-pilot-browser-quality-gate-diagnostic.json",
  },
  {
    id: "reject_score_grid",
    label: "Confidence/margin/entropy reject-score grid diagnostic",
    path: "docs/validation/controlled-pilot-reject-score-grid-diagnostic.json",
  },
];

const supportPaths = {
  readiness: "docs/validation/controlled-pilot-readiness.json",
  sourceRemediationStatus: "docs/validation/controlled-pilot-source-remediation-status.json",
  modelCard: "web/public/model/model-card.json",
  clipHeldoutManifestSummary: "docs/validation/controlled-pilot-clip-heldout-manifests.json",
  firstPartyStore: "data/asl-pilot-store.json",
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
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
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
  node scripts/audit_controlled_pilot_model_strategy.mjs [--write] [--output docs/validation/controlled-pilot-model-strategy-triage.json]

Summarizes retained controlled-pilot model, verifier, and threshold diagnostics
to decide whether another model-only tuning lane remains. This audit is
read-only: it does not train, import clips, approve sources, or promote a model.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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

function passValues(passStatus) {
  if (!passStatus || typeof passStatus !== "object") return [];
  return Object.values(passStatus).filter((value) => typeof value === "boolean");
}

function allPass(passStatus) {
  const values = passValues(passStatus);
  return values.length > 0 && values.every(Boolean);
}

function metricNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function modelMetrics(report) {
  if (!report) return null;
  return {
    validation_top1_accuracy: metricNumber(report.validation?.top1_accuracy),
    validation_macro_f1: metricNumber(report.validation?.macro_f1),
    test_top1_accuracy: metricNumber(report.test?.top1_accuracy),
    test_macro_f1: metricNumber(report.test?.macro_f1),
    test_false_pass_rate: metricNumber(report.test?.threshold_metrics?.false_pass_rate),
    negative_challenge_false_pass_rate: metricNumber(report.negative_challenge?.metrics?.false_pass_rate),
  };
}

function templateMetrics(report) {
  if (!report) return null;
  return {
    validation_top1_accuracy: metricNumber(report.validation?.top1_accuracy),
    validation_macro_f1: metricNumber(report.validation?.macro_f1),
    validation_true_accept_rate: metricNumber(report.validation?.threshold_metrics?.true_accept_rate),
    validation_wrong_prompt_false_pass_rate: metricNumber(
      report.validation?.threshold_metrics?.wrong_prompt_false_pass_rate,
    ),
    test_top1_accuracy: metricNumber(report.test?.top1_accuracy),
    test_macro_f1: metricNumber(report.test?.macro_f1),
    test_true_accept_rate: metricNumber(report.test?.threshold_metrics?.true_accept_rate),
    test_wrong_prompt_false_pass_rate: metricNumber(report.test?.threshold_metrics?.wrong_prompt_false_pass_rate),
    negative_challenge_false_pass_rate: metricNumber(report.negative_challenge?.false_pass_rate),
  };
}

function hybridMetrics(report) {
  if (!report) return null;
  return {
    validation_top1_accuracy: metricNumber(report.validation?.classification?.top1_accuracy),
    validation_true_accept_rate: metricNumber(report.validation?.prompt_acceptance?.true_accept_rate),
    validation_wrong_prompt_false_pass_rate: metricNumber(
      report.validation?.prompt_acceptance?.wrong_prompt_false_pass_rate,
    ),
    validation_accepted_precision: metricNumber(report.validation?.prompt_acceptance?.accepted_precision),
    test_top1_accuracy: metricNumber(report.test?.classification?.top1_accuracy),
    test_true_accept_rate: metricNumber(report.test?.prompt_acceptance?.true_accept_rate),
    test_wrong_prompt_false_pass_rate: metricNumber(report.test?.prompt_acceptance?.wrong_prompt_false_pass_rate),
    test_accepted_precision: metricNumber(report.test?.prompt_acceptance?.accepted_precision),
    negative_challenge_false_pass_rate: metricNumber(report.negative_challenge?.false_pass_rate),
  };
}

function qualityGateMetrics(report) {
  if (!report) return null;
  return {
    validation_accepted_coverage: metricNumber(report.validation?.accepted_coverage_after_quality_gate),
    validation_accepted_precision: metricNumber(report.validation?.accepted_precision_after_quality_gate),
    test_accepted_coverage: metricNumber(report.test?.accepted_coverage_after_quality_gate),
    test_accepted_precision: metricNumber(report.test?.accepted_precision_after_quality_gate),
    negative_challenge_false_pass_rate: metricNumber(report.negative_challenge?.false_pass_rate_after_quality_gate),
  };
}

function rejectGridMetrics(report) {
  if (!report) return null;
  const selected = report.validation_selected_gate ?? report.selected_gate ?? {};
  const oracle = report.negative_challenge_oracle_gate ?? report.oracle_gate ?? {};
  return {
    validation_accepted_precision: metricNumber(selected.validation?.accepted_precision),
    validation_false_pass_rate: metricNumber(selected.validation?.false_pass_rate),
    test_accepted_precision: metricNumber(selected.test?.accepted_precision),
    test_false_pass_rate: metricNumber(selected.test?.false_pass_rate),
    negative_challenge_false_pass_rate: metricNumber(selected.negative_challenge?.false_pass_rate),
    oracle_validation_accept_count: metricNumber(oracle.validation?.accepted_count),
    oracle_test_accept_count: metricNumber(oracle.test?.accepted_count),
    oracle_negative_challenge_false_pass_rate: metricNumber(oracle.negative_challenge?.false_pass_rate),
  };
}

function summarizeModelCandidate(candidate) {
  const report = readJson(candidate.path);
  const metrics = candidate.evidenceClass.includes("template") || candidate.evidenceClass === "reduced_label_diagnostic"
    ? templateMetrics(report)
    : modelMetrics(report);
  return {
    id: candidate.id,
    label: candidate.label,
    evidence_class: candidate.evidenceClass,
    report: fileReference(candidate.path),
    status: report?.status ?? "missing",
    finality: report?.finality ?? null,
    evidence_mode: report?.evidence_mode ?? null,
    architecture: report?.model?.architecture ?? null,
    label_count: report?.model?.label_count ?? report?.labels?.length ?? null,
    method: report?.method?.name ?? null,
    split_policy: candidate.id === "controlled_clip_heldout_factorized"
      ? "clip_heldout_not_signer_disjoint"
      : null,
    metrics,
    pass_status: report?.pass_status ?? null,
    promotable: allPass(report?.pass_status) && !String(report?.finality ?? "").includes("diagnostic"),
  };
}

function summarizeHybridDiagnostic(candidate) {
  const report = readJson(candidate.path);
  return {
    id: candidate.id,
    label: candidate.label,
    evidence_class: "diagnostic_hybrid_prompt_gate",
    report: fileReference(candidate.path),
    status: report?.status ?? "missing",
    finality: report?.finality ?? null,
    method: report?.method?.name ?? null,
    metrics: hybridMetrics(report),
    pass_status: report?.pass_status ?? null,
    promotable: false,
    blockers: report?.blockers ?? [],
  };
}

function summarizeScoreDiagnostic(candidate) {
  const report = readJson(candidate.path);
  const metrics = candidate.id === "browser_quality_gate" ? qualityGateMetrics(report) : rejectGridMetrics(report);
  return {
    id: candidate.id,
    label: candidate.label,
    evidence_class: "diagnostic_threshold_or_quality_gate",
    report: fileReference(candidate.path),
    status: report?.status ?? "missing",
    finality: report?.finality ?? null,
    metrics,
    promotable: false,
  };
}

function maxMetric(candidates, metricName) {
  let best = null;
  for (const candidate of candidates) {
    const value = candidate.metrics?.[metricName];
    if (!Number.isFinite(value)) continue;
    if (!best || value > best.value) best = { candidate_id: candidate.id, value };
  }
  return best;
}

function buildReport() {
  const modelCandidates = modelReportPaths.map(summarizeModelCandidate);
  const hybridDiagnostics = hybridDiagnosticPaths.map(summarizeHybridDiagnostic);
  const scoreDiagnostics = scoreDiagnosticPaths.map(summarizeScoreDiagnostic);
  const allCandidates = [...modelCandidates, ...hybridDiagnostics, ...scoreDiagnostics];
  const readiness = readJson(supportPaths.readiness);
  const sourceStatus = readJson(supportPaths.sourceRemediationStatus);
  const modelCard = readJson(supportPaths.modelCard);
  const clipHeldoutSummary = readJson(supportPaths.clipHeldoutManifestSummary);
  const promotableCandidates = allCandidates.filter((candidate) => candidate.promotable);
  const passingControlledCandidate = allCandidates.find((candidate) =>
    String(candidate.status).includes("validation_passed") || String(candidate.status).includes("diagnostic_passed"),
  );
  const bestFullTop1 = maxMetric(
    modelCandidates.filter((candidate) => candidate.evidence_class !== "reduced_label_diagnostic"),
    "test_top1_accuracy",
  );
  const bestReducedTop1 = maxMetric(
    modelCandidates.filter((candidate) => candidate.evidence_class === "reduced_label_diagnostic"),
    "test_top1_accuracy",
  );
  const bestPromptAccept = maxMetric([...modelCandidates, ...hybridDiagnostics], "test_true_accept_rate");
  const sourceRecommendedNextAction = sourceStatus?.next_actions?.recommended_next_action ?? null;
  const sourceRecommendedNextActionIsFirstParty =
    typeof sourceRecommendedNextAction === "string" && sourceRecommendedNextAction.includes("first_party");
  const firstPartyRouteSelected = sourceStatus?.next_actions?.first_party_route_selected === true;
  const firstPartyPlanningReady = sourceStatus?.next_actions?.first_party_planning_ready === true ||
    sourceStatus?.next_actions?.first_party_capture_ready === true;
  const firstPartyReady = firstPartyRouteSelected && sourceStatus?.next_actions?.first_party_capture_ready === true;
  const firstPartyStoreExists = fs.existsSync(path.join(root, supportPaths.firstPartyStore));
  const recommendedNextAction = sourceRecommendedNextAction && !sourceRecommendedNextActionIsFirstParty
    ? sourceRecommendedNextAction
    : "select_non_first_party_online_source_or_reduced_scope_before_more_training";

  const blockers = [];
  if (promotableCandidates.length === 0) {
    blockers.push("No retained trained, template, hybrid, or threshold diagnostic candidate is promotable.");
  }
  if (bestFullTop1 && bestFullTop1.value < 0.1) {
    blockers.push(`Best retained 75-95 label test top-1 is ${bestFullTop1.value}, far below the 0.7 target.`);
  }
  if (bestPromptAccept && bestPromptAccept.value < 0.1) {
    blockers.push(`Best retained prompt true-accept rate is ${bestPromptAccept.value}, below a usable controlled pilot.`);
  }
  if (modelCard?.status !== "trained") {
    blockers.push(`Browser model card remains ${modelCard?.status ?? "missing"}.`);
  }
  if (firstPartyRouteSelected && !firstPartyStoreExists) {
    blockers.push("First-party collection store is absent, so no approved first-party clips can be exported.");
  }
  if (sourceStatus?.source_paths?.nvidia_asl_1000?.source_register_status !== "approved_raw_video_training_scope") {
    blockers.push("NVIDIA ASL is not source-register approved for raw-video training.");
  }

  return {
    schema_version: "asl-pilot-controlled-pilot-model-strategy-triage/v1",
    status: blockers.length === 0
      ? "model_strategy_ready_for_promotion"
      : "blocked_model_only_lanes_exhausted_waiting_for_approved_source_evidence",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference("scripts/audit_controlled_pilot_model_strategy.mjs"),
    },
    decision_boundary: {
      trains_model: false,
      evaluates_checkpoint: false,
      imports_media: false,
      modifies_manifests: false,
      creates_first_party_store: false,
      promotes_browser_model: false,
    },
    inputs: {
      ...Object.fromEntries(Object.entries(supportPaths).map(([key, relativePath]) => [key, fileReference(relativePath)])),
      model_reports: modelReportPaths.map((candidate) => fileReference(candidate.path)),
      hybrid_diagnostics: hybridDiagnosticPaths.map((candidate) => fileReference(candidate.path)),
      score_diagnostics: scoreDiagnosticPaths.map((candidate) => fileReference(candidate.path)),
    },
    summary: {
      retained_candidate_count: allCandidates.length,
      promotable_candidate_count: promotableCandidates.length,
      passing_controlled_candidate_id: passingControlledCandidate?.id ?? null,
      best_75_95_label_test_top1: bestFullTop1,
      best_reduced_label_test_top1: bestReducedTop1,
      best_prompt_true_accept_rate: bestPromptAccept,
      readiness_status: readiness?.status ?? null,
      readiness_failed_checks: (readiness?.checks ?? [])
        .filter((check) => check?.status === "failed")
        .map((check) => check.id),
      source_remediation_status: sourceStatus?.status ?? null,
      first_party_route_selected: firstPartyRouteSelected,
      first_party_planning_ready: firstPartyPlanningReady,
      first_party_capture_ready: firstPartyReady,
      first_party_store_exists: firstPartyStoreExists,
      nvidia_source_register_status: sourceStatus?.source_paths?.nvidia_asl_1000?.source_register_status ?? null,
      clip_heldout_split_policy: clipHeldoutSummary?.split_policy?.type ?? null,
    },
    candidates: allCandidates,
    blockers,
    conclusion: {
      model_only_lane: "exhausted_for_current_approved_popsign_evidence",
      reason:
        "Retained trained candidates miss accuracy and/or negative-challenge gates; template and hybrid verifier diagnostics improve rejection but do not produce enough true accepts; score/quality gates cannot rescue the current checkpoint without collapsing useful coverage.",
      recommended_next_action: recommendedNextAction,
      after_new_approved_evidence: [
        "export refreshed manifests from approved raw-video-only sources",
        "train a new from-scratch controlled-pilot candidate",
        "rerun strict controlled-pilot validation",
        "promote browser model only if validation passes",
      ],
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = buildReport();
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, stableJson(report), "utf8");
  }
  console.log(stableJson({
    status: report.status,
    output: args.write ? projectRelative(args.output) : null,
    retained_candidate_count: report.summary.retained_candidate_count,
    promotable_candidate_count: report.summary.promotable_candidate_count,
    best_75_95_label_test_top1: report.summary.best_75_95_label_test_top1,
    best_prompt_true_accept_rate: report.summary.best_prompt_true_accept_rate,
    recommended_next_action: report.conclusion.recommended_next_action,
    blocker_count: report.blockers.length,
  }));
  return report.status === "model_strategy_ready_for_promotion" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Controlled pilot model strategy audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
