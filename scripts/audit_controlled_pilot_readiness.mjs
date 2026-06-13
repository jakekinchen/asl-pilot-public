import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "controlled-pilot-readiness.json");
const requirementMatrixPath = path.join(root, "docs", "source-materials", "requirements-matrix.md");
const pdfTextPath = path.join(root, "docs", "source-materials", "pdf-extracted-text.md");
const modelCardPath = path.join(root, "web", "public", "model", "model-card.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const validationReportPath = path.join(root, "docs", "validation", "validation-report.md");
const rawframeValidationReportPath = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const controlledPilotValidationReportPath = path.join(root, "artifacts", "rawframe-model", "controlled-pilot-validation-report.json");
const controlledClipHeldoutValidationReportPath = path.join(root, "artifacts", "rawframe-model-clip-heldout", "validation-report.json");
const controlledClipHeldoutManifestSummaryPath = path.join(root, "docs", "validation", "controlled-pilot-clip-heldout-manifests.json");
const controlledPilotThresholdDiagnosticPath = path.join(root, "docs", "validation", "controlled-pilot-per-label-threshold-diagnostic.json");
const controlledPilotModelStrategyTriagePath = path.join(root, "docs", "validation", "controlled-pilot-model-strategy-triage.json");
const exportProvenancePath = path.join(root, "web", "public", "model", "asl-pilot-rawframe-v0-export-provenance.json");

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
      args.output = resolveProjectPath(value, "--output");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_controlled_pilot_readiness.mjs [--write]

Audits readiness against the Superbuilders controlled production pilot scope.
This is not the research-grade 70-percent signer-disjoint completion audit.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args],
    status_code: result.status,
    status: result.status === 0 ? "passed" : "failed",
    stdout: result.stdout.trim().slice(0, 4000),
    stderr: result.stderr.trim().slice(0, 4000),
  };
}

function addCheck(checks, id, label, status, evidence, blockers = [], requirement_ids = []) {
  checks.push({
    id,
    label,
    status,
    requirement_ids,
    evidence,
    blockers,
  });
}

function countVocabularyItems(text) {
  const seedBlock = text.match(/const VOCABULARY_SEEDS: VocabularySeed\[\] = \[([\s\S]*?)\];/);
  if (!seedBlock) return { count: 0, ids: [], duplicate_ids: [] };
  const ids = [...seedBlock[1].matchAll(/^\s*\["([^"]+)"/gm)].map((match) => match[1]);
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }
  return { count: ids.length, ids, duplicate_ids: duplicates };
}

function modelLabelCount(card) {
  return Object.keys(card?.model?.label_to_index ?? {}).length;
}

function validationMetricSummary(report) {
  if (!report || typeof report !== "object") return null;
  return {
    status: report.status ?? null,
    evidence_mode: report.evidence_mode ?? null,
    validation_top1_accuracy: report.validation?.top1_accuracy ?? null,
    validation_macro_f1: report.validation?.macro_f1 ?? null,
    test_top1_accuracy: report.test?.top1_accuracy ?? null,
    test_macro_f1: report.test?.macro_f1 ?? null,
    negative_challenge_false_pass_rate: report.negative_challenge?.metrics?.false_pass_rate ?? null,
    pass_status: report.pass_status ?? null,
  };
}

function buildReport() {
  const checks = [];
  const vocabularyText = readText(vocabularyPath);
  const vocabulary = countVocabularyItems(vocabularyText);
  const modelCard = fs.existsSync(modelCardPath) ? readJson(modelCardPath) : null;
  const validationReportText = fs.existsSync(validationReportPath) ? readText(validationReportPath) : "";
  const rawframeValidationReport = fs.existsSync(rawframeValidationReportPath)
    ? readJson(rawframeValidationReportPath)
    : null;
  const controlledPilotValidationReport = fs.existsSync(controlledPilotValidationReportPath)
    ? readJson(controlledPilotValidationReportPath)
    : null;
  const controlledClipHeldoutValidationReport = fs.existsSync(controlledClipHeldoutValidationReportPath)
    ? readJson(controlledClipHeldoutValidationReportPath)
    : null;
  const controlledClipHeldoutManifestSummary = fs.existsSync(controlledClipHeldoutManifestSummaryPath)
    ? readJson(controlledClipHeldoutManifestSummaryPath)
    : null;
  const controlledPilotThresholdDiagnostic = fs.existsSync(controlledPilotThresholdDiagnosticPath)
    ? readJson(controlledPilotThresholdDiagnosticPath)
    : null;
  const controlledPilotModelStrategyTriage = fs.existsSync(controlledPilotModelStrategyTriagePath)
    ? readJson(controlledPilotModelStrategyTriagePath)
    : null;
  const exportProvenance = fs.existsSync(exportProvenancePath) ? readJson(exportProvenancePath) : null;
  const practiceCameraSmoke = fs.existsSync(path.join(root, "docs", "validation", "practice-camera-behavior-smoke.json"))
    ? readJson(path.join(root, "docs", "validation", "practice-camera-behavior-smoke.json"))
    : null;
  const practiceProgressSmoke = fs.existsSync(path.join(root, "docs", "validation", "practice-progress-smoke.json"))
    ? readJson(path.join(root, "docs", "validation", "practice-progress-smoke.json"))
    : null;
  const finalPrivacySmoke = fs.existsSync(path.join(root, "docs", "privacy", "final-privacy-smoke.json"))
    ? readJson(path.join(root, "docs", "privacy", "final-privacy-smoke.json"))
    : null;
  const noPretrainedDeps = run("node", ["scripts/audit_no_pretrained_deps.mjs"]);
  const noPretrainedArtifactJson = run("node", ["scripts/audit_no_pretrained_artifact_json.mjs"]);
  const modelArtifactAudit = run("node", ["scripts/audit_model_artifacts.mjs"]);
  const practiceAppPath = path.join(root, "web", "src", "components", "PracticeApp.tsx");
  const practiceAppText = readText(practiceAppPath);
  const requiredPracticeStrings = [
    "Create account",
    "Start camera",
    "Submit attempt",
    "Next prompt",
    "Try again",
    "Progress",
  ];
  const authAndPracticeRoutePaths = [
    "web/src/app/api/auth/register/route.ts",
    "web/src/app/api/auth/login/route.ts",
    "web/src/app/api/auth/logout/route.ts",
    "web/src/app/api/attempts/route.ts",
    "web/src/app/api/progress/route.ts",
  ];
  const missingPracticeStrings = requiredPracticeStrings.filter((snippet) => !practiceAppText.includes(snippet));
  const missingPracticeRoutes = authAndPracticeRoutePaths.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));

  addCheck(
    checks,
    "vocabulary_75_100",
    "75-100 beginner ASL vocabulary prompts are available",
    vocabulary.count >= 75 && vocabulary.count <= 100 && vocabulary.duplicate_ids.length === 0 ? "passed" : "failed",
    {
      vocabulary_path: fileReference(vocabularyPath),
      vocabulary_count: vocabulary.count,
      duplicate_ids: vocabulary.duplicate_ids,
      review_status: vocabularyText.includes('reviewStatus: "source_curated"') ? "source_curated" : "unknown",
    },
    [
      vocabulary.count < 75 || vocabulary.count > 100
        ? `vocabulary count must be 75-100; found ${vocabulary.count}`
        : null,
      vocabulary.duplicate_ids.length > 0 ? `duplicate vocabulary ids: ${vocabulary.duplicate_ids.join(", ")}` : null,
    ].filter(Boolean),
    ["R9", "R10", "D1"],
  );

  addCheck(
    checks,
    "practice_product_flow",
    "Practice UI exposes login, prompt, camera, pass/fail, hints, retry/next, and progress",
    missingPracticeStrings.length === 0 && missingPracticeRoutes.length === 0 ? "passed" : "failed",
    {
      practice_app: fileReference(practiceAppPath),
      api_routes: authAndPracticeRoutePaths.map((relativePath) => fileReference(path.join(root, relativePath))),
      required_strings: requiredPracticeStrings,
      missing_strings: missingPracticeStrings,
      missing_routes: missingPracticeRoutes,
    },
    [
      missingPracticeStrings.length > 0 ? `missing practice UI strings: ${missingPracticeStrings.join(", ")}` : null,
      missingPracticeRoutes.length > 0 ? `missing API routes: ${missingPracticeRoutes.join(", ")}` : null,
    ].filter(Boolean),
    ["R1", "R3", "R6", "R12", "R13", "R28", "R30", "R32", "R33", "R36", "R37", "D1", "D5", "D6"],
  );

  addCheck(
    checks,
    "camera_behavior_runtime",
    "Runtime camera behavior covers success and browser error states",
    practiceCameraSmoke?.status === "passed" ? "passed" : "failed",
    {
      report: fileReference(path.join(root, "docs", "validation", "practice-camera-behavior-smoke.json")),
      status: practiceCameraSmoke?.status ?? null,
      check_count: Array.isArray(practiceCameraSmoke?.checks) ? practiceCameraSmoke.checks.length : null,
    },
    practiceCameraSmoke?.status === "passed" ? [] : ["practice camera behavior smoke must pass"],
    ["R13", "R14", "D6"],
  );

  addCheck(
    checks,
    "account_progress_runtime",
    "Runtime account and saved progress smoke passes",
    practiceProgressSmoke?.status === "passed" ? "passed" : "failed",
    {
      report: fileReference(path.join(root, "docs", "validation", "practice-progress-smoke.json")),
      status: practiceProgressSmoke?.status ?? null,
      check_count: Array.isArray(practiceProgressSmoke?.checks) ? practiceProgressSmoke.checks.length : null,
    },
    practiceProgressSmoke?.status === "passed" ? [] : ["practice progress runtime smoke must pass"],
    ["R30", "R32", "R33", "D5"],
  );

  addCheck(
    checks,
    "privacy_runtime",
    "Normal practice keeps raw camera payloads local and disables dataset collection by default",
    finalPrivacySmoke?.status === "passed" ? "passed" : "failed",
    {
      report: fileReference(path.join(root, "docs", "privacy", "final-privacy-smoke.json")),
      status: finalPrivacySmoke?.status ?? null,
      normal_practice_findings: finalPrivacySmoke?.normal_practice_findings ?? null,
      live_http: finalPrivacySmoke?.evidence?.live_http ?? null,
    },
    finalPrivacySmoke?.status === "passed" ? [] : ["final privacy smoke must pass"],
    ["R16", "R34", "R35", "D7"],
  );

  addCheck(
    checks,
    "no_pretrained_static",
    "No-pretrained dependency and artifact JSON audits pass",
    noPretrainedDeps.status === "passed" && noPretrainedArtifactJson.status === "passed" ? "passed" : "failed",
    {
      dependency_audit: noPretrainedDeps,
      artifact_json_audit: noPretrainedArtifactJson,
    },
    [
      noPretrainedDeps.status !== "passed" ? "no-pretrained dependency audit failed" : null,
      noPretrainedArtifactJson.status !== "passed" ? "no-pretrained artifact JSON audit failed" : null,
    ].filter(Boolean),
    ["R18", "R20", "R21", "R22", "R23", "D3"],
  );

  const trainedBrowserModelReady =
    modelCard?.status === "trained" &&
    modelLabelCount(modelCard) >= 75 &&
    modelLabelCount(modelCard) <= 100 &&
    modelCard?.browser_artifact?.path === "web/public/model/asl-pilot-rawframe-v0.onnx" &&
    typeof modelCard?.browser_artifact?.sha256 === "string" &&
    exportProvenance?.finality !== "smoke_only";
  addCheck(
    checks,
    "trained_browser_model",
    "A trained-from-scratch browser-local pass/fail model is promoted for 75-100 signs",
    trainedBrowserModelReady ? "passed" : "failed",
    {
      model_card: fileReference(modelCardPath),
      model_card_status: modelCard?.status ?? null,
      model_label_count: modelLabelCount(modelCard),
      browser_artifact: modelCard?.browser_artifact ?? null,
      model_artifact_audit: modelArtifactAudit,
      export_provenance: {
        file: fileReference(exportProvenancePath),
        finality: exportProvenance?.finality ?? null,
        evidence_mode: exportProvenance?.evidence_mode ?? null,
      },
    },
    [
      modelCard?.status !== "trained" ? `model-card status is ${modelCard?.status ?? "missing"}` : null,
      modelLabelCount(modelCard) < 75 || modelLabelCount(modelCard) > 100
        ? `model label count must be 75-100; found ${modelLabelCount(modelCard)}`
        : null,
      !modelCard?.browser_artifact ? "model-card browser_artifact is missing" : null,
      exportProvenance?.finality === "smoke_only" ? "current browser export provenance is smoke_only" : null,
    ].filter(Boolean),
    ["R15", "R18", "R19", "R20", "R23", "R26", "R27", "D2"],
  );

  const controlledValidationReady =
    controlledPilotValidationReport?.status === "controlled_pilot_validation_passed";
  const controlledClipHeldoutReady =
    controlledClipHeldoutValidationReport?.status === "controlled_clip_heldout_validation_passed" &&
    controlledClipHeldoutValidationReport?.controlled_clip_heldout_evidence === true;
  const finalValidationReady =
    rawframeValidationReport?.status === "candidate_final_validation_passed";
  const thresholdDiagnosticReady =
    typeof controlledPilotThresholdDiagnostic?.status === "string" &&
    controlledPilotThresholdDiagnostic.status.startsWith("per_label_thresholds_selected_from_");
  const validationReady =
    (controlledValidationReady || controlledClipHeldoutReady || finalValidationReady) &&
    thresholdDiagnosticReady &&
    !/Validation is not complete/i.test(validationReportText) &&
    /controlled/i.test(validationReportText) &&
    /known limitations/i.test(validationReportText);
  addCheck(
    checks,
    "controlled_validation_report",
    "Validation report documents controlled conditions, metrics, thresholds, limitations, and passing model evidence",
    validationReady ? "passed" : "failed",
    {
      validation_report_doc: fileReference(validationReportPath),
      rawframe_validation_report: fileReference(rawframeValidationReportPath),
      controlled_pilot_validation_report: fileReference(controlledPilotValidationReportPath),
      controlled_clip_heldout_manifest_summary: fileReference(controlledClipHeldoutManifestSummaryPath),
      controlled_clip_heldout_validation_report: fileReference(controlledClipHeldoutValidationReportPath),
      controlled_pilot_threshold_diagnostic: fileReference(controlledPilotThresholdDiagnosticPath),
      controlled_pilot_model_strategy_triage: {
        path: projectRelative(controlledPilotModelStrategyTriagePath),
        exists: fs.existsSync(controlledPilotModelStrategyTriagePath),
        status: controlledPilotModelStrategyTriage?.status ?? null,
      },
      metric_summary: validationMetricSummary(rawframeValidationReport),
      controlled_pilot_metric_summary: validationMetricSummary(controlledPilotValidationReport),
      controlled_clip_heldout_metric_summary: validationMetricSummary(controlledClipHeldoutValidationReport),
      model_strategy_triage_summary: controlledPilotModelStrategyTriage?.summary ?? null,
      controlled_clip_heldout_split_policy: controlledClipHeldoutManifestSummary?.split_policy ?? null,
      controlled_clip_heldout_signer_overlap: controlledClipHeldoutManifestSummary?.signer_overlap ?? null,
      threshold_diagnostic_summary: controlledPilotThresholdDiagnostic?.summary ?? null,
      contains_controlled_conditions: /Controlled Pilot Conditions/i.test(validationReportText),
      contains_incomplete_language: /Validation is not complete/i.test(validationReportText),
    },
    [
      !controlledValidationReady && !controlledClipHeldoutReady && !finalValidationReady
        ? `controlled-pilot validation status is ${controlledPilotValidationReport?.status ?? "missing"}; controlled clip-heldout status is ${controlledClipHeldoutValidationReport?.status ?? "missing"}`
        : null,
      !thresholdDiagnosticReady
        ? `per-label threshold diagnostic status is ${controlledPilotThresholdDiagnostic?.status ?? "missing"}`
        : null,
      /Validation is not complete/i.test(validationReportText)
        ? "validation report still says validation is not complete"
        : null,
    ].filter(Boolean),
    ["R19", "R24", "R25", "R27", "R38", "D3", "D4"],
  );

  const failedChecks = checks.filter((check) => check.status === "failed");
  const report = {
    schema_version: "asl-pilot-controlled-pilot-readiness/v1",
    status: failedChecks.length === 0 ? "passed_controlled_pilot_ready" : "incomplete_controlled_pilot",
    generated_at: new Date().toISOString(),
    source_of_truth: {
      pdf: fileReference(path.join(root, "superbuilders-partner-project-asl-learning-with-computer-vision.pdf")),
      extracted_text: fileReference(pdfTextPath),
      requirements_matrix: fileReference(requirementMatrixPath),
      goal_prompt: {
        path: "docs/model/goal.md",
        hash_pinned: false,
        reason: "The goal prompt is an append-only progress ledger and changes after this audit writes evidence.",
      },
    },
    summary: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: failedChecks.length,
      blocker_count: failedChecks.reduce((sum, check) => sum + check.blockers.length, 0),
    },
    controlled_pilot_blockers: failedChecks.map((check) => ({
      id: check.id,
      label: check.label,
      requirement_ids: check.requirement_ids,
      blockers: check.blockers,
    })),
    checks,
    next_required_steps: [
      "Promote or train a compliant from-scratch browser-local pass/fail model for the 75-100 sign vocabulary.",
      "Produce controlled-pilot validation evidence with thresholds, metrics, known limitations, and no-pretrained provenance.",
      "Promote web/public/model/model-card.json only when the trained browser artifact and validation evidence are current.",
      "Regenerate the human validation report from controlled-pilot evidence and remove stale research-grade-only blocker language.",
    ],
  };
  return report;
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
    fs.writeFileSync(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(args.output) : null,
    passed: report.summary.passed,
    failed: report.summary.failed,
    blocker_count: report.summary.blocker_count,
    blockers: report.controlled_pilot_blockers,
  }, null, 2));
  return report.status === "passed_controlled_pilot_ready" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Controlled pilot readiness audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
