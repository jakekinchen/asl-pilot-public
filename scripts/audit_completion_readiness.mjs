import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];
const consentFormRelativePath = "docs/privacy/dataset-consent-form.md";
const collectionPlanRelativePath = "data/dataset/collection-plan.json";
const consentVersion = "asl-pilot-dataset-consent-v1";
const minClipsPerLabelPerSplit = 5;
const captureConditionSchemaVersion = "asl-pilot-capture-conditions/v1";
const acceptedVocabularyGateStatuses = new Set(["reviewed", "source_curated"]);
const firstPartyDatasetSourceMode = "first_party_consent_capture";
const externalDatasetSourceMode = "approved_external_raw_video_source";
const allowedDatasetSourceModes = new Set([firstPartyDatasetSourceMode, externalDatasetSourceMode]);

function parseArgs(argv) {
  const args = { readOnly: false, summaryOnly: false };
  for (const item of argv) {
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--read-only" || item === "--no-write-smokes") {
      args.readOnly = true;
      continue;
    }
    if (item === "--summary-only" || item === "--blockers-only") {
      args.summaryOnly = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_completion_readiness.mjs [--read-only] [--summary-only]

Audits end-to-end completion readiness. Default mode refreshes retained
write-on-pass-only browser evidence when all final prerequisites are available.
With --read-only, it skips every evidence-generating runner and only verifies
already retained evidence. With --summary-only, it prints compact failing-check
and next-stage guidance instead of the full evidence payload.
`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}
const readOnlyTrackedFileSnapshot = args.readOnly ? trackedFileSnapshot() : null;

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(relativePath, `${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(projectPath(relativePath))).digest("hex");
}

function trackedFileSnapshot() {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return {
      ok: false,
      error: result.stderr.trim() || result.stdout.trim() || "git ls-files failed",
      files: {},
    };
  }
  const files = {};
  for (const relativePath of result.stdout.split("\0").filter(Boolean)) {
    const file = projectPath(relativePath);
    files[relativePath] = fs.existsSync(file)
      ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
      : null;
  }
  return { ok: true, error: null, files };
}

function trackedSnapshotMutationBlockers(before, after) {
  if (!before?.ok) return [`could not snapshot tracked files before read-only audit: ${before?.error ?? "unknown error"}`];
  if (!after?.ok) return [`could not snapshot tracked files after read-only audit: ${after?.error ?? "unknown error"}`];
  const blockers = [];
  const keys = new Set([...Object.keys(before.files), ...Object.keys(after.files)]);
  for (const relativePath of [...keys].sort()) {
    if (before.files[relativePath] !== after.files[relativePath]) {
      blockers.push(`${relativePath} changed during read-only completion audit`);
    }
  }
  return blockers;
}

function stableJson(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hasVocabularyCaptureCondition(clip) {
  const evidence = clip.capture?.capture_condition_evidence;
  return Boolean(
    evidence &&
    typeof evidence === "object" &&
    evidence.schemaVersion === captureConditionSchemaVersion &&
    evidence.captureEnvironment === "controlled_vocabulary" &&
    evidence.operatorAttestation === true &&
    typeof evidence.operatorAttestedAt === "string" &&
    !Number.isNaN(Date.parse(evidence.operatorAttestedAt)) &&
    evidence.frontLightingConfirmed === true &&
    evidence.upperTorsoAndHandsVisibleConfirmed === true &&
    evidence.cameraDistanceWithinPilotRangeConfirmed === true &&
    evidence.isolatedPromptSignConfirmed === true &&
    evidence.challengeType === null &&
    evidence.emptyCameraConfirmed === false &&
    evidence.noHandsVisibleConfirmed === false &&
    evidence.lowLightConfirmed === false &&
    evidence.offCenterConfirmed === false &&
    evidence.hardNegativeConditionConfirmed !== true &&
    evidence.expectedRejectOutcomeConfirmed === false
  );
}

const extendedHardNegativeTypes = [
  "idle_hands",
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

function hasChallengeCaptureCondition(clip) {
  const evidence = clip.capture?.capture_condition_evidence;
  const fieldByType = {
    empty_camera: "emptyCameraConfirmed",
    no_hands_visible: "noHandsVisibleConfirmed",
    low_light: "lowLightConfirmed",
    off_center: "offCenterConfirmed",
  };
  const field = fieldByType[clip.challenge_type];
  const isExtendedHardNegative = extendedHardNegativeTypes.includes(clip.challenge_type);
  if (!field && !isExtendedHardNegative) return false;
  return Boolean(
    evidence &&
    typeof evidence === "object" &&
    evidence.schemaVersion === captureConditionSchemaVersion &&
    evidence.captureEnvironment === "negative_challenge" &&
    evidence.operatorAttestation === true &&
    typeof evidence.operatorAttestedAt === "string" &&
    !Number.isNaN(Date.parse(evidence.operatorAttestedAt)) &&
    evidence.challengeType === clip.challenge_type &&
    evidence.expectedRejectOutcomeConfirmed === true &&
    evidence.frontLightingConfirmed === false &&
    evidence.upperTorsoAndHandsVisibleConfirmed === false &&
    evidence.cameraDistanceWithinPilotRangeConfirmed === false &&
    evidence.isolatedPromptSignConfirmed === false &&
    (field
      ? evidence.hardNegativeConditionConfirmed !== true &&
        Object.entries(fieldByType).every(([type, key]) => evidence[key] === (type === clip.challenge_type))
      : evidence.hardNegativeConditionConfirmed === true &&
        Object.values(fieldByType).every((key) => evidence[key] === false))
  );
}

function addCheck(id, label, status, evidence, blockers = []) {
  checks.push({ id, label, status, evidence, blockers });
  for (const blocker of blockers) findings.push(`${id}: ${blocker}`);
}

function pass(id, label, evidence) {
  addCheck(id, label, "passed", evidence);
}

function partial(id, label, evidence, blockers) {
  addCheck(id, label, "partial", evidence, blockers);
}

function fail(id, labelOrBlocker, blocker) {
  if (blocker === undefined) {
    addCheck(id, id, "failed", null, [labelOrBlocker]);
  } else {
    addCheck(id, labelOrBlocker, "failed", null, [blocker]);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function runInTemporaryWorktree(command, args) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-read-only-"));
  const worktree = path.join(tempRoot, "repo");
  const ignoredReadOnlyInputs = [
    "data/dataset/collection-plan.json",
    "data/vocabulary-review/asl-pilot-vocabulary-review.json",
    "docs/research/nvidia-asl-access-receipt.template.json",
    "scripts/audit_nvidia_asl_access_metadata.mjs",
  ];
  let worktreeAdded = false;
  try {
    const add = spawnSync("git", ["worktree", "add", "--detach", "--quiet", worktree, "HEAD"], {
      cwd: root,
      encoding: "utf8",
    });
    if (add.status !== 0) {
      return {
        ok: false,
        status: add.status,
        stdout: add.stdout.trim(),
        stderr: add.stderr.trim() || "git worktree add failed",
      };
    }
    worktreeAdded = true;

    const diff = spawnSync("git", ["diff", "--binary", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    if (diff.status !== 0) {
      return {
        ok: false,
        status: diff.status,
        stdout: diff.stdout.trim(),
        stderr: diff.stderr.trim() || "git diff failed",
      };
    }
    if (diff.stdout.trim().length > 0) {
      const apply = spawnSync("git", ["apply", "--whitespace=nowarn"], {
        cwd: worktree,
        encoding: "utf8",
        input: diff.stdout,
        maxBuffer: 50 * 1024 * 1024,
      });
      if (apply.status !== 0) {
        return {
          ok: false,
          status: apply.status,
          stdout: apply.stdout.trim(),
          stderr: apply.stderr.trim() || "git apply failed in temporary worktree",
        };
      }
    }

    for (const relativePath of ignoredReadOnlyInputs) {
      const source = projectPath(relativePath);
      if (!fs.existsSync(source)) continue;
      const destination = path.join(worktree, relativePath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }

    const result = spawnSync(command, args, {
      cwd: worktree,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    return {
      ok: result.status === 0,
      status: result.status,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } finally {
    if (worktreeAdded) {
      spawnSync("git", ["worktree", "remove", "--force", worktree], {
        cwd: root,
        encoding: "utf8",
      });
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function finalRawframePipelinePreflightEvidence(result) {
  const parsed = parseJson(result.stdout);
  if (!parsed || typeof parsed !== "object") {
    return result.stderr || result.stdout || "final raw-frame pipeline preflight did not return JSON";
  }
  const nextStage = parsed.next_stage;
  const nextStageSummary = nextStage && typeof nextStage === "object"
    ? {
        id: nextStage.id,
        status: nextStage.status,
        next_command: nextStage.next_command,
        blockers: Array.isArray(nextStage.blockers) ? nextStage.blockers : [],
      }
    : null;
  return JSON.stringify({
    status: parsed.status,
    checked_at: parsed.checked_at,
    next_stage: nextStageSummary,
  }, null, 2);
}

function finalRawframePipelineNextStage(result) {
  const parsed = parseJson(result.stdout);
  const nextStage = parsed && typeof parsed === "object" ? parsed.next_stage : null;
  if (!nextStage || typeof nextStage !== "object") return null;
  return {
    id: nextStage.id ?? null,
    status: nextStage.status ?? null,
    next_command: nextStage.next_command ?? null,
    blockers: Array.isArray(nextStage.blockers) ? nextStage.blockers : [],
  };
}

function lessonEvidenceAuditSummary(result) {
  const parsed = parseJson(result.stdout);
  if (!parsed || typeof parsed !== "object") {
    return result.stderr || result.stdout || "lesson evidence audit did not return JSON";
  }
  return JSON.stringify({
    status: parsed.status,
    final_model_evidence: parsed.final_model_evidence,
    lesson_milestone_evidence_gate: parsed.lesson_milestone_evidence_gate,
    lesson_label_counts: parsed.lesson_label_counts,
    observed_statuses: parsed.observed_statuses,
    blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
    required_next_commands: Array.isArray(parsed.required_next_commands)
      ? parsed.required_next_commands
      : [],
  }, null, 2);
}

function compactText(value, maxLength = 700) {
  const text = String(value ?? "").replace(/\s*\n\s*/g, " / ");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function compactCheck(check) {
  return {
    id: check.id,
    label: check.label,
    status: check.status,
    blockers: (check.blockers ?? []).map((blocker) => compactText(blocker)),
  };
}

function scriptFiles(extension) {
  return fs.readdirSync(projectPath("scripts"))
    .filter((file) => file.endsWith(extension))
    .sort()
    .map((file) => `scripts/${file}`);
}

function parseRequirementIds() {
  if (!exists("docs/source-materials/requirements-matrix.md")) return new Set();
  const text = readText("docs/source-materials/requirements-matrix.md");
  return new Set([...text.matchAll(/\|\s*((?:R|D)\d+)\s*\|/g)].map((match) => match[1]));
}

const requiredRequirementGateMinimums = {
  R1: ["app", "web_build"],
  R2: ["vocabulary", "hint_pedagogy_review"],
  R3: ["progress_contract", "practice_progress_runtime"],
  R4: ["practice_camera_behavior_smoke", "practice_progress_runtime"],
  R5: ["scope_boundaries", "final_documentation_content"],
  R6: ["practice_screen_contract", "practice_progress_runtime", "practice_camera_behavior_smoke"],
  R7: ["scope_boundaries", "vocabulary"],
  R8: ["vocabulary", "vocabulary_source_curation"],
  R9: ["vocabulary", "vocabulary_source_curation"],
  R10: ["vocabulary", "trained_model"],
  R11: ["vocabulary", "vocabulary_source_curation", "trained_model"],
  R12: ["app", "web_build", "browser_compatibility_static"],
  R13: ["practice_screen_contract", "browser_compatibility_static", "practice_camera_behavior_smoke"],
  R14: ["browser_compatibility_static", "practice_camera_behavior_smoke", "final_browser_compatibility"],
  R15: ["browser_onnx_wiring_smoke", "final_browser_onnx_smoke"],
  R16: ["privacy_static", "final_privacy_smoke"],
  R17: ["browser_onnx_wiring_smoke", "final_browser_onnx_smoke"],
  R18: ["source_register", "dataset_collection_readiness"],
  R19: ["local_ml_environment", "strict_final_manifest_audit", "trained_model"],
  R20: ["model_artifact_static", "model_card_promotion_reproducible", "trained_model"],
  R21: ["no_pretrained_static", "no_pretrained_artifact_json", "trained_model"],
  R22: ["no_pretrained_static", "no_pretrained_artifact_json", "trained_model"],
  R23: ["local_ml_environment", "no_pretrained_static", "trained_model"],
  R24: ["dataset_manifests", "strict_final_manifest_audit", "trained_model", "validation_report_doc"],
  R25: ["scope_boundaries", "final_documentation_content"],
  R26: ["final_browser_onnx_smoke"],
  R27: ["final_browser_onnx_smoke"],
  R28: ["practice_screen_contract", "hint_pedagogy_review"],
  R29: ["hint_pedagogy_review", "vocabulary"],
  R30: ["practice_progress_runtime", "progress_contract"],
  R31: ["scope_boundaries"],
  R32: ["progress_contract", "practice_progress_runtime"],
  R33: ["progress_contract", "practice_progress_runtime"],
  R34: ["privacy_static", "final_privacy_smoke"],
  R35: ["source_register", "dataset_collection_readiness"],
  R36: ["learner_safe_copy", "practice_screen_contract", "practice_camera_behavior_smoke"],
  R37: ["practice_screen_contract", "practice_camera_behavior_smoke"],
  R38: ["final_docs", "final_documentation_content", "no_pretrained_artifact_json"],
  R39: ["scope_boundaries", "final_documentation_content"],
  R40: [
    "practice_progress_runtime",
    "practice_camera_behavior_smoke",
    "scope_boundaries",
    "hint_pedagogy_review",
    "final_privacy_smoke",
    "final_documentation_content",
  ],
  D1: ["app", "web_build", "final_docs"],
  D2: ["trained_model", "model_card_promotion_reproducible", "final_browser_onnx_smoke"],
  D3: ["source_register", "no_pretrained_static", "no_pretrained_artifact_json", "trained_model"],
  D4: ["validation_report_doc", "trained_model"],
  D5: ["practice_progress_runtime", "progress_contract"],
  D6: ["practice_screen_contract", "practice_camera_behavior_smoke", "final_browser_onnx_smoke", "practice_progress_runtime"],
  D7: ["privacy_static", "final_privacy_smoke", "final_docs"],
};

function validateRequirementGateMap(expectedIds) {
  const mapPath = "docs/source-materials/requirement-gate-map.json";
  const blockers = [];
  if (!exists(mapPath)) {
    return { path: mapPath, blockers: [`Missing ${mapPath}`] };
  }
  let gateMap;
  try {
    gateMap = JSON.parse(readText(mapPath));
  } catch (error) {
    return {
      path: mapPath,
      blockers: [`${mapPath} is not valid JSON: ${error.message}`],
    };
  }
  if (gateMap.schema_version !== "asl-pilot-requirement-gate-map/v1") {
    blockers.push("schema_version must be asl-pilot-requirement-gate-map/v1");
  }
  if (gateMap.source_matrix?.path !== "docs/source-materials/requirements-matrix.md") {
    blockers.push("source_matrix.path must be docs/source-materials/requirements-matrix.md");
  }
  if (
    gateMap.source_matrix?.sha256 !== (
      exists("docs/source-materials/requirements-matrix.md")
        ? sha256File("docs/source-materials/requirements-matrix.md")
        : null
    )
  ) {
    blockers.push("source_matrix.sha256 must match the current requirements matrix");
  }
  const entries = gateMap.requirements && typeof gateMap.requirements === "object" && !Array.isArray(gateMap.requirements)
    ? gateMap.requirements
    : {};
  const actualIds = Object.keys(entries);
  const missingIds = expectedIds.filter((id) => !Object.hasOwn(entries, id));
  const unexpectedIds = actualIds.filter((id) => !expectedIds.includes(id));
  if (missingIds.length > 0) blockers.push(`Gate map missing requirement IDs: ${missingIds.join(", ")}`);
  if (unexpectedIds.length > 0) blockers.push(`Gate map contains unexpected IDs: ${unexpectedIds.join(", ")}`);
  const knownGateIds = new Set(checks.map((check) => check.id));
  for (const id of expectedIds) {
    const entry = entries[id];
    const gates = Array.isArray(entry?.gate_ids) ? entry.gate_ids : [];
    const waivers = Array.isArray(entry?.explicit_waivers) ? entry.explicit_waivers : [];
    if (gates.length === 0 && waivers.length === 0) {
      blockers.push(`${id} must map to at least one completion gate or explicit waiver`);
    }
    for (const requiredGateId of requiredRequirementGateMinimums[id] ?? []) {
      if (!gates.includes(requiredGateId)) {
        blockers.push(`${id} must map to hard completion gate ${requiredGateId}`);
      }
    }
    for (const gateId of gates) {
      if (typeof gateId !== "string" || gateId.trim().length === 0) {
        blockers.push(`${id} has a blank gate_id`);
      } else if (!knownGateIds.has(gateId)) {
        blockers.push(`${id} references unknown completion gate: ${gateId}`);
      }
    }
    for (const waiver of waivers) {
      if (
        !waiver ||
        typeof waiver !== "object" ||
        typeof waiver.reason !== "string" ||
        waiver.reason.trim().length < 20
      ) {
        blockers.push(`${id} explicit waivers must include a specific reason`);
      }
    }
  }
  return {
    path: mapPath,
    sha256: sha256File(mapPath),
    requirement_count: actualIds.length,
    blockers,
  };
}

function vocabularyEvidence() {
  if (!exists("web/src/lib/vocabulary.ts")) {
    return { count: 0, needsReview: true };
  }
  const source = readText("web/src/lib/vocabulary.ts");
  const count = [...source.matchAll(/\n\s*\["[^"]+",/g)].length;
  const needsReview = source.includes("needs_deaf_educator_review");
  return { count, needsReview };
}

function learnerCopyEvidence() {
  const sources = [
    exists("web/src/components/PracticeApp.tsx") ? readText("web/src/components/PracticeApp.tsx") : "",
    exists("web/src/lib/client-model.ts") ? readText("web/src/lib/client-model.ts") : "",
  ].join("\n");
  const unsafeSnippets = [
    "Fail closed",
    "Confidence</dt>",
    "trained artifact detected",
    "validation gates",
    "No trained model artifact yet",
    "from-scratch recognition model",
    "Browser ONNX inference failed closed",
  ];
  const found = unsafeSnippets.filter((snippet) => sources.toLowerCase().includes(snippet.toLowerCase()));
  return { found };
}

function manifestEvidence() {
  const paths = ["data/manifests/train.json", "data/manifests/validation.json", "data/manifests/test.json"];
  const manifests = paths.map((relativePath) => ({
    path: relativePath,
    data: exists(relativePath) ? readJson(relativePath) : null,
  }));
  const missing = manifests.filter((item) => !item.data).map((item) => item.path);
  if (missing.length > 0) return { ready: false, missing, manifests };
  const synthetic = manifests.some((item) => {
    const datasetId = String(item.data?.dataset_id ?? "").toLowerCase();
    return datasetId.includes("synthetic") || datasetId.includes("smoke") || datasetId.includes("not-asl");
  });
  const labelCounts = manifests.map((item) => item.data?.labels?.length ?? 0);
  const clipCounts = manifests.map((item) => item.data?.clips?.length ?? 0);
  const labelCountReady = labelCounts.every((count) => count >= 75 && count <= 100);
  const clipCoverageReady = manifests.every((item) => {
    const labels = new Set((item.data?.labels ?? []).map((label) => label.label_id));
    const counts = new Map([...labels].map((labelId) => [labelId, 0]));
    for (const clip of item.data?.clips ?? []) {
      if (counts.has(clip.label_id)) counts.set(clip.label_id, counts.get(clip.label_id) + 1);
    }
    return labels.size > 0 && [...counts.values()].every((count) => count >= minClipsPerLabelPerSplit);
  });
  const hasVocabularyReview = manifests.every(
    (item) => item.data?.vocabulary_review && typeof item.data.vocabulary_review === "object",
  );
  const datasetSourceModes = manifests.map((item) => item.data?.dataset_source_mode ?? firstPartyDatasetSourceMode);
  const datasetSourceModesValid = datasetSourceModes.every((mode) => allowedDatasetSourceModes.has(mode));
  const externalManifests = manifests.filter((item) => (item.data?.dataset_source_mode ?? firstPartyDatasetSourceMode) === externalDatasetSourceMode);
  const firstPartyManifests = manifests.filter((item) => (item.data?.dataset_source_mode ?? firstPartyDatasetSourceMode) === firstPartyDatasetSourceMode);
  const hasExternalDatasetImport = externalManifests.every((item) => (
    item.data?.external_dataset_import
    && typeof item.data.external_dataset_import === "object"
    && typeof item.data.external_dataset_import.source_id === "string"
    && item.data.external_dataset_import.source_audit
    && typeof item.data.external_dataset_import.source_audit === "object"
  ));
  const currentConsentHash = exists(consentFormRelativePath) ? sha256File(consentFormRelativePath) : null;
  const hasConsentForm = firstPartyManifests.every((item) => {
    const consentForm = item.data?.consent_form;
    return consentForm
      && typeof consentForm === "object"
      && consentForm.path === consentFormRelativePath
      && consentForm.sha256 === currentConsentHash
      && consentForm.consent_version === consentVersion;
  });
  const currentCollectionPlanHash = exists(collectionPlanRelativePath) ? sha256File(collectionPlanRelativePath) : null;
  const hasCollectionPlan = firstPartyManifests.every((item) => {
    const collectionPlan = item.data?.collection_plan;
    return collectionPlan
      && typeof collectionPlan === "object"
      && collectionPlan.path === collectionPlanRelativePath
      && collectionPlan.sha256 === currentCollectionPlanHash
      && acceptedVocabularyGateStatuses.has(collectionPlan.review_gate_status);
  });
  const clipsHaveCollectionPlanAssignments = firstPartyManifests.every((item) => (
    (item.data?.clips ?? []).every((clip) => (
      clip.collection_plan_assignment
      && typeof clip.collection_plan_assignment === "object"
      && typeof clip.collection_plan_assignment.assignment_key === "string"
      && clip.collection_plan_assignment.assignment_key.startsWith("vocabulary:")
      && clip.collection_plan_assignment.collection_plan_sha256 === item.data?.collection_plan?.sha256
      && clip.collection_plan_assignment.assignment
      && typeof clip.collection_plan_assignment.assignment === "object"
    ))
  ));
  const clipsHaveCaptureConditionEvidence = firstPartyManifests.every((item) => (
    (item.data?.clips ?? []).every((clip) => hasVocabularyCaptureCondition(clip))
  ));
  const signersBySplit = manifests.map((item) => ({
    split: item.data?.split,
    signers: new Set((item.data?.clips ?? []).map((clip) => clip.signer_identity_hash ?? clip.signer_id)),
  }));
  const hasSignerIdentityHashes = manifests.every((item) => (
    (item.data?.clips ?? []).every((clip) => typeof clip.signer_identity_hash === "string" && /^[a-f0-9]{64}$/.test(clip.signer_identity_hash))
  ));
  let signerDisjoint = true;
  for (let leftIndex = 0; leftIndex < signersBySplit.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < signersBySplit.length; rightIndex += 1) {
      const left = signersBySplit[leftIndex].signers;
      const right = signersBySplit[rightIndex].signers;
      if ([...left].some((signerId) => right.has(signerId))) signerDisjoint = false;
    }
  }
  return {
    ready: !synthetic && labelCountReady && clipCoverageReady && signerDisjoint && hasSignerIdentityHashes && hasVocabularyReview && datasetSourceModesValid && hasExternalDatasetImport && hasConsentForm && hasCollectionPlan && clipsHaveCollectionPlanAssignments && clipsHaveCaptureConditionEvidence,
    synthetic,
    datasetSourceModes,
    datasetSourceModesValid,
    externalManifestCount: externalManifests.length,
    labelCounts,
    clipCounts,
    labelCountReady,
    clipCoverageReady,
    signerDisjoint,
    hasSignerIdentityHashes,
    hasVocabularyReview,
    hasExternalDatasetImport,
    hasConsentForm,
    hasCollectionPlan,
    clipsHaveCollectionPlanAssignments,
    clipsHaveCaptureConditionEvidence,
    manifests,
  };
}

function negativeChallengeManifestEvidence() {
  const relativePath = "data/manifests/negative-challenge.json";
  if (!exists(relativePath)) return { ready: false, missing: relativePath };
  const data = readJson(relativePath);
  if (!data) return { ready: false, invalid: true };
  const clips = Array.isArray(data.clips) ? data.clips : [];
  const requiredTypes = [
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
  const countsByType = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const clip of clips) {
    if (requiredTypes.includes(clip.challenge_type)) countsByType[clip.challenge_type] += 1;
  }
  const underfilledTypes = requiredTypes.filter((type) => countsByType[type] < 5);
  const hasSignerIdentityHashes = clips.every((clip) => typeof clip.signer_identity_hash === "string" && /^[a-f0-9]{64}$/.test(clip.signer_identity_hash));
  const datasetSourceMode = data.dataset_source_mode ?? firstPartyDatasetSourceMode;
  const datasetSourceModeValid = allowedDatasetSourceModes.has(datasetSourceMode);
  const externalDatasetImportPresent = data.external_dataset_import
    && typeof data.external_dataset_import === "object"
    && typeof data.external_dataset_import.source_id === "string"
    && data.external_dataset_import.source_audit
    && typeof data.external_dataset_import.source_audit === "object";
  const currentConsentHash = exists(consentFormRelativePath) ? sha256File(consentFormRelativePath) : null;
  const hasConsentForm = datasetSourceMode === firstPartyDatasetSourceMode ? data.consent_form
    && typeof data.consent_form === "object"
    && data.consent_form.path === consentFormRelativePath
    && data.consent_form.sha256 === currentConsentHash
    && data.consent_form.consent_version === consentVersion : true;
  const currentCollectionPlanHash = exists(collectionPlanRelativePath) ? sha256File(collectionPlanRelativePath) : null;
  const hasCollectionPlan = datasetSourceMode === firstPartyDatasetSourceMode ? data.collection_plan
    && typeof data.collection_plan === "object"
    && data.collection_plan.path === collectionPlanRelativePath
    && data.collection_plan.sha256 === currentCollectionPlanHash
    && acceptedVocabularyGateStatuses.has(data.collection_plan.review_gate_status) : true;
  const clipsHaveCollectionPlanAssignments = datasetSourceMode === firstPartyDatasetSourceMode ? clips.every((clip) => (
    clip.collection_plan_assignment
    && typeof clip.collection_plan_assignment === "object"
    && typeof clip.collection_plan_assignment.assignment_key === "string"
    && clip.collection_plan_assignment.assignment_key.startsWith("negative_challenge:")
    && clip.collection_plan_assignment.collection_plan_sha256 === data.collection_plan?.sha256
    && clip.collection_plan_assignment.assignment
    && typeof clip.collection_plan_assignment.assignment === "object"
  )) : true;
  const clipsHaveCaptureConditionEvidence = clips.every((clip) => hasChallengeCaptureCondition(clip));
  return {
    ready:
      data.schema_version === "asl-pilot-negative-challenge-manifest/v1" &&
      data.split === "negative_challenge" &&
      underfilledTypes.length === 0 &&
      data.source_register &&
      typeof data.source_register === "object" &&
      datasetSourceModeValid &&
      (datasetSourceMode !== externalDatasetSourceMode || externalDatasetImportPresent) &&
      hasConsentForm &&
      hasSignerIdentityHashes &&
      hasCollectionPlan &&
      clipsHaveCollectionPlanAssignments &&
      clipsHaveCaptureConditionEvidence &&
      data.vocabulary_review &&
      typeof data.vocabulary_review === "object",
    schemaVersion: data.schema_version,
    split: data.split,
    clipCount: clips.length,
    datasetSourceMode,
    datasetSourceModeValid,
    countsByType,
    underfilledTypes,
    hasSourceRegister: Boolean(data.source_register && typeof data.source_register === "object"),
    hasExternalDatasetImport: Boolean(externalDatasetImportPresent),
    hasConsentForm: Boolean(hasConsentForm),
    hasCollectionPlan: Boolean(hasCollectionPlan),
    clipsHaveCollectionPlanAssignments,
    clipsHaveCaptureConditionEvidence,
    hasSignerIdentityHashes,
    hasVocabularyReview: Boolean(data.vocabulary_review && typeof data.vocabulary_review === "object"),
  };
}

function modelEvidence() {
  if (!exists("web/public/model/model-card.json")) return { status: "missing" };
  const card = readJson("web/public/model/model-card.json");
  if (!card) return { status: "invalid" };
  const validationReportPath = card.validation?.report_path;
  const validationReport = validationReportPath && exists(validationReportPath)
    ? readJson(validationReportPath)
    : null;
  const datasetSourceMode = card.dataset_source_mode ?? firstPartyDatasetSourceMode;
  const consentFormCurrent = card.consent_form?.path === consentFormRelativePath
    && card.consent_form?.sha256 === (exists(consentFormRelativePath) ? sha256File(consentFormRelativePath) : null)
    && card.consent_form?.consent_version === consentVersion;
  const externalDatasetImportPresent = card.external_dataset_import
    && typeof card.external_dataset_import === "object"
    && typeof card.external_dataset_import.source_id === "string"
    && card.external_dataset_import.source_audit
    && typeof card.external_dataset_import.source_audit === "object";
  return {
    status: card.status,
    modelId: card.model_id,
    labelCount: Object.keys(card.model?.label_to_index ?? {}).length,
    threshold: card.confidence_thresholds?.default,
    validationReportPath,
    validationReportStatus: validationReport?.status,
    validationSignerDisjoint: card.validation?.signer_disjoint,
    negativeChallengeFalsePassRate: validationReport?.negative_challenge?.metrics?.false_pass_rate,
    negativeChallengePassStatus: validationReport?.pass_status?.negative_challenge_false_pass_rate,
    negativeChallengeManifestPath: validationReport?.negative_challenge?.manifest?.path,
    vocabularyReviewStatus: card.vocabulary_review?.status,
    datasetSourceMode,
    consentFormCurrent,
    externalDatasetImportPresent: Boolean(externalDatasetImportPresent),
    datasetSourceReady: datasetSourceMode === externalDatasetSourceMode
      ? Boolean(externalDatasetImportPresent)
      : consentFormCurrent,
  };
}

function privacySmokeAppUrl() {
  if (!exists("docs/privacy/final-privacy-smoke.json")) return "http://127.0.0.1:3025";
  const report = readJson("docs/privacy/final-privacy-smoke.json");
  return typeof report?.app_url === "string" && report.app_url.trim().length > 0
    ? report.app_url
    : "http://127.0.0.1:3025";
}

function finalBrowserOnnxAppUrl() {
  if (!exists("docs/validation/final-browser-onnx-smoke.json")) return privacySmokeAppUrl();
  const report = readJson("docs/validation/final-browser-onnx-smoke.json");
  if (typeof report?.runner?.app_url === "string" && report.runner.app_url.trim().length > 0) {
    try {
      return new URL(report.runner.app_url).origin;
    } catch {
      return privacySmokeAppUrl();
    }
  }
  return privacySmokeAppUrl();
}

const requirementIds = parseRequirementIds();
const expectedIds = [
  ...Array.from({ length: 40 }, (_, index) => `R${index + 1}`),
  ...Array.from({ length: 7 }, (_, index) => `D${index + 1}`),
];
const missingRequirementIds = expectedIds.filter((id) => !requirementIds.has(id));
const pdfExtractionAudit = run("./.venv/bin/python", ["scripts/audit_pdf_extraction.py"]);
if (missingRequirementIds.length === 0 && pdfExtractionAudit.ok) {
  pass("matrix", "PDF requirements are enumerated and source-bound", pdfExtractionAudit.stdout);
} else {
  fail(
    "matrix",
    "PDF requirements are enumerated and source-bound",
    [
      missingRequirementIds.length > 0 ? `Missing requirement IDs: ${missingRequirementIds.join(", ")}` : null,
      pdfExtractionAudit.ok ? null : `PDF extraction audit failed:\n${pdfExtractionAudit.stdout}\n${pdfExtractionAudit.stderr}`.trim(),
    ].filter(Boolean).join("\n"),
  );
}

if (exists("web/src/components/PracticeApp.tsx") && exists("web/src/app/page.tsx")) {
  pass("app", "Browser app scaffold exists", "web/src/components/PracticeApp.tsx and web/src/app/page.tsx");
} else {
  fail("app", "Browser app scaffold exists", "Missing PracticeApp or app page");
}

const nodeSyntaxFailures = scriptFiles(".mjs")
  .map((file) => ({ file, result: run("node", ["--check", file]) }))
  .filter((item) => !item.result.ok);
if (nodeSyntaxFailures.length === 0) {
  pass("node_script_syntax", "Node scripts parse successfully", "node --check scripts/*.mjs");
} else {
  fail(
    "node_script_syntax",
    "Node scripts parse successfully",
    nodeSyntaxFailures.map((item) => `${item.file}: ${item.result.stderr || item.result.stdout}`).join("\n"),
  );
}

const pythonSyntax = run("./.venv/bin/python", [
  "-c",
  [
    "import pathlib, sys",
    "for path in sys.argv[1:]:",
    "    compile(pathlib.Path(path).read_text(encoding='utf8'), path, 'exec')",
  ].join("\n"),
  ...scriptFiles(".py"),
]);
if (pythonSyntax.ok) {
  pass("python_script_syntax", "Python scripts compile successfully", "Python compile() syntax check over scripts/*.py");
} else {
  fail("python_script_syntax", "Python scripts compile successfully", pythonSyntax.stderr || pythonSyntax.stdout);
}

const webLint = run("npm", ["--prefix", "web", "run", "lint"]);
if (webLint.ok) {
  pass("web_lint", "Web app lint passes", webLint.stdout);
} else {
  fail("web_lint", "Web app lint passes", webLint.stderr || webLint.stdout);
}

const webBuild = run("npm", ["--prefix", "web", "run", "build"]);
if (webBuild.ok) {
  pass("web_build", "Web app production build passes", webBuild.stdout);
} else {
  fail("web_build", "Web app production build passes", webBuild.stderr || webBuild.stdout);
}

const learnerCopy = learnerCopyEvidence();
if (learnerCopy.found.length === 0) {
  pass("learner_safe_copy", "Visible learner copy avoids model/debug jargon", "No blocked beginner-unsafe copy snippets found");
} else {
  fail(
    "learner_safe_copy",
    "Visible learner copy avoids model/debug jargon",
    `Blocked snippets remain: ${learnerCopy.found.join(", ")}`,
  );
}

const scopeBoundaryAudit = run("node", ["scripts/audit_scope_boundaries.mjs"]);
if (scopeBoundaryAudit.ok) {
  pass("scope_boundaries", "Target learner fit and pilot non-goals are gated", scopeBoundaryAudit.stdout);
} else {
  fail("scope_boundaries", "Target learner fit and pilot non-goals are gated", scopeBoundaryAudit.stdout || scopeBoundaryAudit.stderr);
}

const progressContractAudit = run("node", ["scripts/audit_progress_contract.mjs"]);
if (progressContractAudit.ok) {
  pass("progress_contract", "Saved progress covers attempted vocabulary, pass/fail counts, mastery, and recent history", progressContractAudit.stdout);
} else {
  fail("progress_contract", "Saved progress covers attempted vocabulary, pass/fail counts, mastery, and recent history", progressContractAudit.stdout || progressContractAudit.stderr);
}

const practiceScreenContractAudit = run("node", ["scripts/audit_practice_screen_contract.mjs"]);
if (practiceScreenContractAudit.ok) {
  pass("practice_screen_contract", "Practice screen exposes prompt, camera, attempt state, result, hint, retry, and next action", practiceScreenContractAudit.stdout);
} else {
  fail("practice_screen_contract", "Practice screen exposes prompt, camera, attempt state, result, hint, retry, and next action", practiceScreenContractAudit.stdout || practiceScreenContractAudit.stderr);
}

const practiceProgressSmokeRunner = run("node", ["scripts/run_practice_progress_smoke.mjs"]);
const practiceProgressSmokeAudit = run("node", ["scripts/audit_practice_progress_smoke.mjs"]);
if (practiceProgressSmokeRunner.ok && practiceProgressSmokeAudit.ok) {
  pass(
    "practice_progress_runtime",
    "Runtime account, practice, fail-closed attempt, and progress persistence smoke passes",
    `${practiceProgressSmokeRunner.stdout}\n${practiceProgressSmokeAudit.stdout}`,
  );
} else {
  fail(
    "practice_progress_runtime",
    "Runtime account, practice, fail-closed attempt, and progress persistence smoke passes",
    [
      !practiceProgressSmokeRunner.ok ? practiceProgressSmokeRunner.stderr || practiceProgressSmokeRunner.stdout : null,
      !practiceProgressSmokeAudit.ok ? practiceProgressSmokeAudit.stderr || practiceProgressSmokeAudit.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const practiceCameraBehaviorRunner = args.readOnly
  ? {
      ok: true,
      status: 0,
      stdout: "read-only mode: skipped scripts/run_practice_camera_behavior_smoke.mjs --write",
      stderr: "",
    }
  : run("node", ["scripts/run_practice_camera_behavior_smoke.mjs", "--write"]);
const practiceCameraBehaviorAudit = run("node", ["scripts/audit_practice_camera_behavior_smoke.mjs"]);
if (practiceCameraBehaviorRunner.ok && practiceCameraBehaviorAudit.ok) {
  pass(
    "practice_camera_behavior_smoke",
    "Runtime practice UI camera behavior covers success, denied, missing, unsupported, generic error, result, next prompt, and progress",
    `${practiceCameraBehaviorRunner.stdout}\n${practiceCameraBehaviorAudit.stdout}`,
  );
} else {
  fail(
    "practice_camera_behavior_smoke",
    "Runtime practice UI camera behavior covers success, denied, missing, unsupported, generic error, result, next prompt, and progress",
    [
      !practiceCameraBehaviorRunner.ok ? practiceCameraBehaviorRunner.stderr || practiceCameraBehaviorRunner.stdout : null,
      !practiceCameraBehaviorAudit.ok ? practiceCameraBehaviorAudit.stderr || practiceCameraBehaviorAudit.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const vocabulary = vocabularyEvidence();
const vocabularyReview = run("node", ["scripts/audit_vocabulary_review.mjs"]);
const hintPedagogyReview = run("node", ["scripts/audit_hint_pedagogy_review.mjs"]);
if (vocabulary.count >= 75 && vocabulary.count <= 100 && !vocabulary.needsReview && vocabularyReview.ok) {
  pass("vocabulary", "Source-curated 75-100 ASL 1 vocabulary items", vocabularyReview.stdout);
} else {
  partial(
    "vocabulary",
    "Source-curated 75-100 ASL 1 vocabulary items",
    `${vocabulary.count} items found in web/src/lib/vocabulary.ts`,
    [
      vocabulary.count < 75 || vocabulary.count > 100
        ? `Vocabulary count must be 75-100; found ${vocabulary.count}`
        : null,
      vocabulary.needsReview
        ? "Vocabulary still contains needs_deaf_educator_review markers"
        : null,
      !vocabularyReview.ok
        ? `Vocabulary review audit has not passed: ${vocabularyReview.stderr || vocabularyReview.stdout}`
        : null,
    ].filter(Boolean),
  );
}
if (vocabularyReview.ok) {
  pass(
    "vocabulary_source_curation",
    "Canonical vocabulary evidence is source-curated or externally reviewed",
    vocabularyReview.stdout,
  );
} else {
  fail(
    "vocabulary_source_curation",
    "Canonical vocabulary evidence is source-curated or externally reviewed",
    vocabularyReview.stderr || vocabularyReview.stdout,
  );
}
if (hintPedagogyReview.ok) {
  pass(
    "hint_pedagogy_review",
    "Targeted hints are source-curated or externally reviewed without diagnostic overclaiming",
    hintPedagogyReview.stdout,
  );
} else {
  fail(
    "hint_pedagogy_review",
    "Targeted hints are source-curated or externally reviewed without diagnostic overclaiming",
    hintPedagogyReview.stderr || hintPedagogyReview.stdout,
  );
}

const noPretrained = run("node", ["scripts/audit_no_pretrained_deps.mjs"]);
if (noPretrained.ok) {
  pass("no_pretrained_static", "Static no-pretrained dependency/source audit passes", noPretrained.stdout);
} else {
  fail("no_pretrained_static", "Static no-pretrained dependency/source audit passes", noPretrained.stderr || noPretrained.stdout);
}

const noPretrainedArtifactJson = run("node", ["scripts/audit_no_pretrained_artifact_json.mjs"]);
if (noPretrainedArtifactJson.ok) {
  pass(
    "no_pretrained_artifact_json",
    "Retained JSON artifacts do not contain pretrained, landmark, embedding, or feature evidence",
    noPretrainedArtifactJson.stdout,
  );
} else {
  fail(
    "no_pretrained_artifact_json",
    "Retained JSON artifacts do not contain pretrained, landmark, embedding, or feature evidence",
    noPretrainedArtifactJson.stderr || noPretrainedArtifactJson.stdout,
  );
}

const guardrailNegativeFixtures = args.readOnly
  ? runInTemporaryWorktree("node", ["scripts/audit_guardrail_negative_fixtures.mjs"])
  : run("node", ["scripts/audit_guardrail_negative_fixtures.mjs"]);
if (guardrailNegativeFixtures.ok) {
  pass(
    "guardrail_negative_fixtures",
    "No-pretrained/source-register guardrails reject known bad fixtures",
    guardrailNegativeFixtures.stdout,
  );
} else {
  fail(
    "guardrail_negative_fixtures",
    "No-pretrained/source-register guardrails reject known bad fixtures",
    guardrailNegativeFixtures.stderr || guardrailNegativeFixtures.stdout,
  );
}

const sourceRegister = run("node", ["scripts/audit_source_register.mjs"]);
if (sourceRegister.ok) {
  pass("source_register", "Machine-readable source/license decisions are valid", "docs/model/dataset-source-register.json");
} else {
  fail("source_register", "Machine-readable source/license decisions are valid", sourceRegister.stderr || sourceRegister.stdout);
}

const datasetSourceResearch = run("node", ["scripts/audit_dataset_source_research.mjs"]);
if (datasetSourceResearch.ok) {
  pass(
    "dataset_source_research",
    "Public ASL dataset source-rights decisions have retained research receipts",
    datasetSourceResearch.stdout,
  );
} else {
  fail(
    "dataset_source_research",
    "Public ASL dataset source-rights decisions have retained research receipts",
    datasetSourceResearch.stderr || datasetSourceResearch.stdout,
  );
}

const noRawUpload = run("node", ["scripts/audit_no_raw_video_upload.mjs"]);
if (noRawUpload.ok) {
  pass("privacy_static", "Normal practice code has no raw camera upload payloads", noRawUpload.stdout);
} else {
  fail("privacy_static", "Normal practice code has no raw camera upload payloads", noRawUpload.stderr || noRawUpload.stdout);
}

const attemptIntegrity = run("node", ["scripts/audit_attempt_integrity.mjs"]);
if (attemptIntegrity.ok) {
  pass("attempt_integrity_static", "Practice progress cannot be credited from spoofed untrained attempts", attemptIntegrity.stdout);
} else {
  fail(
    "attempt_integrity_static",
    "Practice progress cannot be credited from spoofed untrained attempts",
    attemptIntegrity.stderr || attemptIntegrity.stdout,
  );
}

const finalPrivacySmoke = run("node", ["scripts/audit_final_privacy_smoke.mjs"]);
const livePrivacySmoke = run("node", [
  "scripts/run_final_privacy_smoke.mjs",
  "--app-url",
  privacySmokeAppUrl(),
]);
if (finalPrivacySmoke.ok && livePrivacySmoke.ok) {
  pass(
    "final_privacy_smoke",
    "Final static/live HTTP privacy smoke evidence is current and reproducible",
    `${finalPrivacySmoke.stdout}\n${livePrivacySmoke.stdout}`,
  );
} else {
  fail(
    "final_privacy_smoke",
    "Final static/live HTTP privacy smoke evidence is current and reproducible",
    [
      !finalPrivacySmoke.ok ? finalPrivacySmoke.stderr || finalPrivacySmoke.stdout : null,
      !livePrivacySmoke.ok ? livePrivacySmoke.stderr || livePrivacySmoke.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

if (
  exists("scripts/learner_data_admin.mjs")
  && readText("docs/privacy/video-handling.md").includes("learner_data_admin.mjs")
  && readText(".gitignore").includes("data/privacy-audit-log.jsonl")
) {
  pass("privacy_admin", "Learner export/delete operator process exists", "scripts/learner_data_admin.mjs and docs/privacy/video-handling.md");
} else {
  fail(
    "privacy_admin",
    "Learner export/delete operator process exists",
    "Missing learner data admin script, privacy doc instructions, or ignored privacy audit log path",
  );
}

const browserCompatibility = run("node", ["scripts/audit_browser_compatibility.mjs"]);
if (browserCompatibility.ok) {
  pass("browser_compatibility_static", "Browser compatibility static gate passes", "Camera error handling, WASM inference, collection gating, and matrix doc are present");
} else {
  fail("browser_compatibility_static", "Browser compatibility static gate passes", browserCompatibility.stderr || browserCompatibility.stdout);
}

const browserOnnxWiringRunner = args.readOnly
  ? {
      ok: true,
      status: 0,
      stdout: "read-only mode: skipped scripts/run_browser_onnx_wiring_smoke.mjs",
      stderr: "",
    }
  : run("node", ["scripts/run_browser_onnx_wiring_smoke.mjs"]);
const browserOnnxWiringSmoke = run("node", ["scripts/audit_browser_onnx_wiring_smoke.mjs"]);
if (browserOnnxWiringRunner.ok && browserOnnxWiringSmoke.ok) {
  pass(
    "browser_onnx_wiring_smoke",
    "Smoke-only app client ONNX wiring proof is current and retained",
    `${browserOnnxWiringRunner.stdout}\n${browserOnnxWiringSmoke.stdout}`,
  );
} else {
  fail(
    "browser_onnx_wiring_smoke",
    "Smoke-only app client ONNX wiring proof is current and retained",
    [
      !browserOnnxWiringRunner.ok ? browserOnnxWiringRunner.stderr || browserOnnxWiringRunner.stdout : null,
      !browserOnnxWiringSmoke.ok ? browserOnnxWiringSmoke.stderr || browserOnnxWiringSmoke.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const finalBrowserOnnxRunner = args.readOnly
  ? {
      ok: true,
      status: 0,
      stdout: "read-only mode: skipped scripts/run_final_browser_onnx_smoke.mjs --write --write-on-pass-only",
      stderr: "",
    }
  : run("node", [
      "scripts/run_final_browser_onnx_smoke.mjs",
      "--app-url",
      finalBrowserOnnxAppUrl(),
      "--write",
      "--write-on-pass-only",
    ]);
const finalBrowserOnnxSmoke = run("node", ["scripts/audit_final_browser_onnx_smoke.mjs"]);
if (finalBrowserOnnxRunner.ok && finalBrowserOnnxSmoke.ok) {
  pass(
    "final_browser_onnx_smoke",
    "Final browser ONNX runtime smoke evidence is current and retained",
    `${finalBrowserOnnxRunner.stdout}\n${finalBrowserOnnxSmoke.stdout}`,
  );
} else {
  fail(
    "final_browser_onnx_smoke",
    "Final browser ONNX runtime smoke evidence is current and retained",
    [
      !finalBrowserOnnxRunner.ok ? finalBrowserOnnxRunner.stderr || finalBrowserOnnxRunner.stdout : null,
      !finalBrowserOnnxSmoke.ok ? finalBrowserOnnxSmoke.stderr || finalBrowserOnnxSmoke.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const finalBrowserCompatibilityRunner = args.readOnly
  ? {
      ok: true,
      status: 0,
      stdout: "read-only mode: skipped scripts/run_final_browser_compatibility.mjs --write --write-on-pass-only",
      stderr: "",
    }
  : run("node", [
      "scripts/run_final_browser_compatibility.mjs",
      "--app-url",
      finalBrowserOnnxAppUrl(),
      "--observations",
      "docs/validation/final-browser-compatibility.observations.json",
      "--output",
      "docs/validation/final-browser-compatibility.json",
      "--write",
      "--write-on-pass-only",
    ]);
const finalBrowserCompatibility = run("node", ["scripts/audit_final_browser_compatibility.mjs"]);
if (finalBrowserCompatibilityRunner.ok && finalBrowserCompatibility.ok) {
  pass(
    "final_browser_compatibility",
    "Final cross-browser compatibility evidence is current and retained",
    `${finalBrowserCompatibilityRunner.stdout}\n${finalBrowserCompatibility.stdout}`,
  );
} else {
  fail(
    "final_browser_compatibility",
    "Final cross-browser compatibility evidence is current and retained",
    [
      !finalBrowserCompatibilityRunner.ok ? finalBrowserCompatibilityRunner.stderr || finalBrowserCompatibilityRunner.stdout : null,
      !finalBrowserCompatibility.ok ? finalBrowserCompatibility.stderr || finalBrowserCompatibility.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const localMlEnvironment = run("./.venv/bin/python", [
  "scripts/audit_local_ml_environment.py",
  "--report",
  "docs/validation/local-ml-environment.json",
]);
if (localMlEnvironment.ok) {
  pass(
    "local_ml_environment",
    "Local open-source ML/GPU environment is ready for decode/train/export",
    localMlEnvironment.stdout,
  );
} else {
  fail(
    "local_ml_environment",
    "Local open-source ML/GPU environment is ready for decode/train/export",
    localMlEnvironment.stderr || localMlEnvironment.stdout,
  );
}

const datasetCoverageContract = run("node", ["scripts/audit_dataset_coverage_contract.mjs"]);
if (datasetCoverageContract.ok) {
  pass(
    "dataset_coverage_contract",
    "Dataset coverage UI separates consented collection from reviewed exportable clips",
    datasetCoverageContract.stdout,
  );
} else {
  fail(
    "dataset_coverage_contract",
    "Dataset coverage UI separates consented collection from reviewed exportable clips",
    datasetCoverageContract.stderr || datasetCoverageContract.stdout,
  );
}

const collectionPlanContract = run("node", ["scripts/audit_collection_plan_contract.mjs"]);
if (collectionPlanContract.ok) {
  pass(
    "collection_plan_contract",
    "Dataset collection UI can load and apply the generated collection plan",
    collectionPlanContract.stdout,
  );
} else {
  fail(
    "collection_plan_contract",
    "Dataset collection UI can load and apply the generated collection plan",
    collectionPlanContract.stderr || collectionPlanContract.stdout,
  );
}

const reviewedVocabularyCollectionGate = run("node", ["scripts/audit_reviewed_vocabulary_collection_gate.mjs"]);
if (reviewedVocabularyCollectionGate.ok) {
  pass(
    "reviewed_vocabulary_collection_gate",
    "Dataset collection cannot use unreviewed vocabulary",
    reviewedVocabularyCollectionGate.stdout,
  );
} else {
  fail(
    "reviewed_vocabulary_collection_gate",
    "Dataset collection cannot use unreviewed vocabulary",
    reviewedVocabularyCollectionGate.stderr || reviewedVocabularyCollectionGate.stdout,
  );
}

const datasetCollectionRuntimeRunner = args.readOnly
  ? {
      ok: true,
      status: 0,
      stdout: "read-only mode: skipped scripts/run_dataset_collection_runtime_smoke.mjs",
      stderr: "",
    }
  : run("node", ["scripts/run_dataset_collection_runtime_smoke.mjs"]);
const datasetCollectionRuntimeSmoke = run("node", ["scripts/audit_dataset_collection_runtime_smoke.mjs"]);
if (datasetCollectionRuntimeRunner.ok && datasetCollectionRuntimeSmoke.ok) {
  pass(
    "dataset_collection_runtime_smoke",
    "Smoke-only explicit collection runtime proof is current and retained",
    `${datasetCollectionRuntimeRunner.stdout}\n${datasetCollectionRuntimeSmoke.stdout}`,
  );
} else {
  fail(
    "dataset_collection_runtime_smoke",
    "Smoke-only explicit collection runtime proof is current and retained",
    [
      !datasetCollectionRuntimeRunner.ok ? datasetCollectionRuntimeRunner.stderr || datasetCollectionRuntimeRunner.stdout : null,
      !datasetCollectionRuntimeSmoke.ok ? datasetCollectionRuntimeSmoke.stderr || datasetCollectionRuntimeSmoke.stdout : null,
    ].filter(Boolean).join("\n"),
  );
}

const postCollectionEvidenceStatusReport = run("node", ["scripts/report_post_collection_evidence_status.mjs"]);
const postCollectionEvidenceStatusAudit = run("node", ["scripts/audit_post_collection_evidence_status.mjs"]);
if (postCollectionEvidenceStatusReport.ok && postCollectionEvidenceStatusAudit.ok) {
  pass(
    "post_collection_evidence_status",
    "Post-collection packet/operator status is current and explicitly non-final",
    `${postCollectionEvidenceStatusReport.stdout}\n${postCollectionEvidenceStatusAudit.stdout}`,
  );
} else {
  fail(
    "post_collection_evidence_status",
    "Post-collection packet/operator status is current and explicitly non-final",
    [
      !postCollectionEvidenceStatusReport.ok
        ? postCollectionEvidenceStatusReport.stderr || postCollectionEvidenceStatusReport.stdout
        : null,
      !postCollectionEvidenceStatusAudit.ok
        ? postCollectionEvidenceStatusAudit.stderr || postCollectionEvidenceStatusAudit.stdout
        : null,
    ].filter(Boolean).join("\n"),
  );
}

const downstreamVocabularyProvenance = run("node", ["scripts/audit_downstream_vocabulary_provenance.mjs"]);
if (downstreamVocabularyProvenance.ok) {
  pass(
    "downstream_vocabulary_provenance",
    "Reviewed vocabulary evidence is bound through manifests, training, evaluation, export, and model-card promotion",
    downstreamVocabularyProvenance.stdout,
  );
} else {
  fail(
    "downstream_vocabulary_provenance",
    "Reviewed vocabulary evidence is bound through manifests, training, evaluation, export, and model-card promotion",
    downstreamVocabularyProvenance.stderr || downstreamVocabularyProvenance.stdout,
  );
}

const downstreamManifestContract = run("node", ["scripts/audit_downstream_manifest_contract.mjs"]);
if (downstreamManifestContract.ok) {
  pass(
    "downstream_manifest_contract",
    "Final manifests require five approved clips per label and source-rights provenance through export",
    downstreamManifestContract.stdout,
  );
} else {
  fail(
    "downstream_manifest_contract",
    "Final manifests require five approved clips per label and source-rights provenance through export",
    downstreamManifestContract.stderr || downstreamManifestContract.stdout,
  );
}

const collectionPlanFreshness = run("node", ["scripts/audit_collection_plan_freshness.mjs"]);
if (collectionPlanFreshness.ok) {
  pass(
    "collection_plan_freshness",
    "Generated collection plan matches the current vocabulary/store state",
    collectionPlanFreshness.stdout,
  );
} else {
  fail(
    "collection_plan_freshness",
    "Generated collection plan matches the current vocabulary/store state",
    collectionPlanFreshness.stderr || collectionPlanFreshness.stdout,
  );
}

const manifests = manifestEvidence();
const negativeChallengeManifest = negativeChallengeManifestEvidence();
const strictManifestAudit = run("./.venv/bin/python", ["scripts/audit_final_manifests.py"]);
const activeApprovedExternalManifestRoute =
  manifests.ready === true &&
  negativeChallengeManifest.ready === true &&
  strictManifestAudit.ok &&
  Array.isArray(manifests.datasetSourceModes) &&
  manifests.datasetSourceModes.length === 3 &&
  manifests.datasetSourceModes.every((mode) => mode === externalDatasetSourceMode) &&
  negativeChallengeManifest.datasetSourceMode === externalDatasetSourceMode;
const activeApprovedExternalManifestRouteEvidence = {
  train_validation_test_modes: manifests.datasetSourceModes,
  negative_challenge_mode: negativeChallengeManifest.datasetSourceMode,
  external_train_validation_test_manifests: manifests.externalManifestCount,
  strict_final_manifest_audit: strictManifestAudit.ok ? "passed" : "failed",
};

const datasetCollection = activeApprovedExternalManifestRoute
  ? null
  : run("node", ["scripts/audit_dataset_collection_readiness.mjs"]);
if (activeApprovedExternalManifestRoute) {
  pass(
    "dataset_collection_readiness",
    "First-party dataset collection is not required for the approved external-manifest route",
    JSON.stringify(activeApprovedExternalManifestRouteEvidence),
  );
} else if (datasetCollection.ok) {
  pass("dataset_collection_readiness", "First-party dataset collection is ready for manifest export", "Consented clips cover labels, signers, splits, files, hashes, and sanitized metadata");
} else {
  fail(
    "dataset_collection_readiness",
    "First-party dataset collection is ready for manifest export",
    datasetCollection.stderr || datasetCollection.stdout,
  );
}

const collectionPlanner = run("node", [
  "scripts/plan_dataset_collection.mjs",
  "--allow-draft-unreviewed-vocabulary",
  "--summary-only",
]);
if (collectionPlanner.ok) {
  pass(
    "dataset_collection_planner",
    "Operator collection plan can be generated",
    "scripts/plan_dataset_collection.mjs produced signer-disjoint vocabulary and negative challenge capture plans with review-gate status",
  );
} else {
  fail(
    "dataset_collection_planner",
    "Operator collection plan can be generated",
    collectionPlanner.stderr || collectionPlanner.stdout,
  );
}

const clipReview = activeApprovedExternalManifestRoute ? null : run("node", ["scripts/audit_clip_review.mjs"]);
if (activeApprovedExternalManifestRoute) {
  pass(
    "clip_review",
    "First-party clip review is not required for approved external train/validation/test manifests",
    JSON.stringify(activeApprovedExternalManifestRouteEvidence),
  );
} else if (clipReview.ok) {
  pass("clip_review", "Collected clips have resolved ASL label review", clipReview.stdout);
} else {
  fail(
    "clip_review",
    "Collected clips have resolved ASL label review",
    clipReview.stderr || clipReview.stdout,
  );
}

const challengeReview = activeApprovedExternalManifestRoute ? null : run("node", ["scripts/audit_challenge_review.mjs"]);
if (activeApprovedExternalManifestRoute) {
  pass(
    "negative_challenge_review",
    "First-party negative challenge review is not required for the approved external challenge manifest",
    JSON.stringify(activeApprovedExternalManifestRouteEvidence),
  );
} else if (challengeReview.ok) {
  pass("negative_challenge_review", "Negative challenge clips have resolved review", challengeReview.stdout);
} else {
  fail(
    "negative_challenge_review",
    "Negative challenge clips have resolved review",
    challengeReview.stderr || challengeReview.stdout,
  );
}

const modelArtifactAudit = run("node", ["scripts/audit_model_artifacts.mjs"]);
if (modelArtifactAudit.ok) {
  pass("model_artifact_static", "Model-card artifact audit passes for current status", modelArtifactAudit.stdout);
} else {
  fail("model_artifact_static", "Model-card artifact audit passes for current status", modelArtifactAudit.stderr || modelArtifactAudit.stdout);
}

const validationReportDoc = run("node", ["scripts/audit_validation_report_doc.mjs"]);
if (validationReportDoc.ok) {
  pass(
    "validation_report_doc",
    "Human-readable validation report is bound to final validation evidence",
    validationReportDoc.stdout,
  );
} else {
  fail(
    "validation_report_doc",
    "Human-readable validation report is bound to final validation evidence",
    validationReportDoc.stderr || validationReportDoc.stdout,
  );
}

const finalDocumentationContent = run("node", ["scripts/audit_final_documentation_content.mjs"]);
if (finalDocumentationContent.ok) {
  pass(
    "final_documentation_content",
    "Final documentation content is promoted from scaffold language",
    finalDocumentationContent.stdout,
  );
} else {
  fail(
    "final_documentation_content",
    "Final documentation content is promoted from scaffold language",
    finalDocumentationContent.stderr || finalDocumentationContent.stdout,
  );
}

const promotedModelCardPath = "output/completion-readiness/promoted-model-card.json";
const promotedModelCardTempDir = args.readOnly
  ? fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-completion-readiness-readonly-"))
  : null;
const promotedModelCardOutputPath = promotedModelCardTempDir
  ? path.join(promotedModelCardTempDir, "promoted-model-card.json")
  : projectPath(promotedModelCardPath);
const modelCardPromotionDryRun = run("node", [
  "scripts/promote_trained_model_card.mjs",
  "--dry-run",
  "--dry-run-output",
  promotedModelCardTempDir ? promotedModelCardOutputPath : path.relative(root, promotedModelCardOutputPath),
]);
const promotedModelCardMatches =
  modelCardPromotionDryRun.ok &&
  fs.existsSync(promotedModelCardOutputPath) &&
  exists("web/public/model/model-card.json") &&
  stableJson(JSON.parse(fs.readFileSync(promotedModelCardOutputPath, "utf8"))) === stableJson(readJson("web/public/model/model-card.json"));
if (promotedModelCardTempDir) fs.rmSync(promotedModelCardTempDir, { recursive: true, force: true });
if (modelCardPromotionDryRun.ok && promotedModelCardMatches) {
  pass(
    "model_card_promotion_reproducible",
    "Active trained model card is reproducible from final validation and export evidence",
    modelCardPromotionDryRun.stdout,
  );
} else {
  fail(
    "model_card_promotion_reproducible",
    "Active trained model card is reproducible from final validation and export evidence",
    [
      !modelCardPromotionDryRun.ok
        ? `promote_trained_model_card.mjs --dry-run failed: ${modelCardPromotionDryRun.stderr || modelCardPromotionDryRun.stdout}`
        : null,
      modelCardPromotionDryRun.ok && !promotedModelCardMatches
        ? "dry-run generated model card must canonical-match web/public/model/model-card.json"
        : null,
    ].filter(Boolean).join("; "),
  );
}

if (exists("scripts/promote_trained_model_card.mjs")) {
  pass("model_card_promotion_static", "Trained model-card promotion workflow exists", "scripts/promote_trained_model_card.mjs");
} else {
  fail(
    "model_card_promotion_static",
    "Trained model-card promotion workflow exists",
    "Missing scripts/promote_trained_model_card.mjs",
  );
}

if (strictManifestAudit.ok) {
  pass(
    "strict_final_manifest_audit",
    "Final manifests pass training/evaluation validators",
    strictManifestAudit.stdout,
  );
} else {
  fail(
    "strict_final_manifest_audit",
    "Final manifests pass training/evaluation validators",
    strictManifestAudit.stderr || strictManifestAudit.stdout,
  );
}

if (manifests.ready && strictManifestAudit.ok) {
  pass("dataset_manifests", "Final train/validation/test manifests are ready", JSON.stringify({
    labelCounts: manifests.labelCounts,
    clipCounts: manifests.clipCounts,
      signerDisjoint: manifests.signerDisjoint,
      signerIdentityHashes: manifests.hasSignerIdentityHashes,
      captureConditionEvidence: manifests.clipsHaveCaptureConditionEvidence,
  }));
} else {
  const blockers = [];
  if (manifests.missing?.length) blockers.push(`Missing manifests: ${manifests.missing.join(", ")}`);
  if (manifests.synthetic) blockers.push("Manifest dataset_id indicates synthetic/smoke/non-ASL data");
  if (manifests.labelCountReady === false) blockers.push(`Every split must have 75-100 labels; found ${manifests.labelCounts.join(", ")}`);
  if (manifests.clipCoverageReady === false) blockers.push(`Every label must have at least ${minClipsPerLabelPerSplit} clips in every split`);
  if (manifests.signerDisjoint === false) blockers.push("Train/validation/test splits are not signer-disjoint");
  if (manifests.datasetSourceModesValid === false) blockers.push("Train/validation/test manifests must use a supported dataset_source_mode");
  if (manifests.hasExternalDatasetImport === false) blockers.push("External train/validation/test manifests must include external_dataset_import evidence");
	  if (manifests.hasSignerIdentityHashes === false) blockers.push("Train/validation/test manifests must include signer_identity_hash for every clip");
	  if (manifests.hasConsentForm === false) blockers.push("First-party train/validation/test manifests must include current consent_form evidence");
	  if (manifests.hasVocabularyReview === false) blockers.push("Train/validation/test manifests must include vocabulary_review evidence");
	  if (manifests.hasCollectionPlan === false) blockers.push("First-party train/validation/test manifests must include current reviewed collection_plan evidence");
	  if (manifests.clipsHaveCollectionPlanAssignments === false) blockers.push("First-party train/validation/test clips must include collection_plan_assignment evidence");
	  if (manifests.clipsHaveCaptureConditionEvidence === false) blockers.push("First-party train/validation/test clips must include controlled capture-condition evidence");
	  if (!strictManifestAudit.ok) blockers.push("Strict final manifest audit must pass");
  fail("dataset_manifests", "Final train/validation/test manifests are ready", blockers.join("; "));
}

if (negativeChallengeManifest.ready && strictManifestAudit.ok) {
  pass("negative_challenge_manifest", "Final negative challenge manifest is ready", JSON.stringify(negativeChallengeManifest));
} else {
  fail(
    "negative_challenge_manifest",
    "Final negative challenge manifest is ready",
    [
      negativeChallengeManifest.missing ? `Missing manifest: ${negativeChallengeManifest.missing}` : null,
      negativeChallengeManifest.invalid ? "Negative challenge manifest is invalid JSON" : null,
      negativeChallengeManifest.schemaVersion && negativeChallengeManifest.schemaVersion !== "asl-pilot-negative-challenge-manifest/v1"
        ? `Negative challenge schema_version is ${negativeChallengeManifest.schemaVersion}`
        : null,
      negativeChallengeManifest.split && negativeChallengeManifest.split !== "negative_challenge"
        ? `Negative challenge split is ${negativeChallengeManifest.split}`
        : null,
      negativeChallengeManifest.hasSourceRegister === false ? "Negative challenge manifest must include source_register evidence" : null,
      negativeChallengeManifest.datasetSourceModeValid === false ? "Negative challenge manifest must use a supported dataset_source_mode" : null,
      negativeChallengeManifest.datasetSourceMode === externalDatasetSourceMode && negativeChallengeManifest.hasExternalDatasetImport === false
        ? "External negative challenge manifest must include external_dataset_import evidence"
        : null,
      negativeChallengeManifest.hasConsentForm === false ? "First-party negative challenge manifest must include current consent_form evidence" : null,
	      negativeChallengeManifest.hasSignerIdentityHashes === false ? "Negative challenge manifest must include signer_identity_hash for every clip" : null,
	      negativeChallengeManifest.hasVocabularyReview === false ? "Negative challenge manifest must include vocabulary_review evidence" : null,
	      negativeChallengeManifest.hasCollectionPlan === false ? "First-party negative challenge manifest must include current reviewed collection_plan evidence" : null,
	      negativeChallengeManifest.clipsHaveCollectionPlanAssignments === false ? "First-party negative challenge clips must include collection_plan_assignment evidence" : null,
	      negativeChallengeManifest.clipsHaveCaptureConditionEvidence === false ? "Negative challenge clips must include challenge capture-condition evidence" : null,
	      negativeChallengeManifest.underfilledTypes?.length
        ? `Negative challenge underfilled types: ${negativeChallengeManifest.underfilledTypes.join(", ")}`
        : null,
      !strictManifestAudit.ok ? "Strict final manifest audit must pass" : null,
    ].filter(Boolean).join("; "),
  );
}

const model = modelEvidence();
if (
  model.status === "trained"
  && model.labelCount >= 75
  && model.labelCount <= 100
  && typeof model.threshold === "number"
  && model.threshold > 0
  && model.threshold < 1
  && model.validationSignerDisjoint === true
  && model.validationReportStatus === "candidate_final_validation_passed"
  && model.negativeChallengePassStatus === true
  && typeof model.negativeChallengeFalsePassRate === "number"
  && model.negativeChallengeFalsePassRate < 0.05
  && typeof model.negativeChallengeManifestPath === "string"
  && acceptedVocabularyGateStatuses.has(model.vocabularyReviewStatus)
  && model.datasetSourceReady === true
  && modelCardPromotionDryRun.ok
  && promotedModelCardMatches
  && finalBrowserOnnxSmoke.ok
) {
  pass("trained_model", "Final trained model and validation evidence are present", JSON.stringify(model));
} else {
  fail(
    "trained_model",
    "Final trained model and validation evidence are present",
    [
      model.status !== "trained" ? `model-card status is ${model.status}` : null,
      model.status === "trained" && (model.labelCount < 75 || model.labelCount > 100)
        ? `trained label count must be 75-100; found ${model.labelCount}`
        : null,
      model.status === "trained" && !(typeof model.threshold === "number" && model.threshold > 0 && model.threshold < 1)
        ? "trained model must have a positive calibrated threshold below 1"
        : null,
      model.status === "trained" && model.validationSignerDisjoint !== true
        ? "model-card validation.signer_disjoint must be true"
        : null,
      model.status === "trained" && model.validationReportStatus !== "candidate_final_validation_passed"
        ? `validation report status must be candidate_final_validation_passed; found ${model.validationReportStatus ?? "missing"}`
        : null,
      model.status === "trained" && model.negativeChallengePassStatus !== true
        ? "validation report must pass the negative challenge false-pass gate"
        : null,
      model.status === "trained" && !(typeof model.negativeChallengeFalsePassRate === "number" && model.negativeChallengeFalsePassRate < 0.05)
        ? `negative challenge false-pass rate must be below 0.05; found ${model.negativeChallengeFalsePassRate ?? "missing"}`
        : null,
      model.status === "trained" && typeof model.negativeChallengeManifestPath !== "string"
        ? "validation report must include a negative challenge manifest path"
        : null,
      model.status === "trained" && !acceptedVocabularyGateStatuses.has(model.vocabularyReviewStatus)
        ? "trained model card must include reviewed or source_curated vocabulary_review evidence"
        : null,
      model.status === "trained" && model.datasetSourceReady !== true
        ? "trained model card must include current source evidence for its dataset_source_mode"
        : null,
      model.status === "trained" && !modelCardPromotionDryRun.ok
        ? "promote_trained_model_card.mjs --dry-run must pass for the active trained model card"
        : null,
      model.status === "trained" && modelCardPromotionDryRun.ok && !promotedModelCardMatches
        ? "active trained model card must canonical-match the promotion dry-run output"
        : null,
      model.status === "trained" && !finalBrowserOnnxSmoke.ok
        ? "final browser ONNX smoke audit must pass"
        : null,
    ].filter(Boolean).join("; "),
  );
}

const lessonEvidenceAudit = run("node", ["scripts/audit_rawframe_lesson_evidence.mjs"]);
if (lessonEvidenceAudit.ok) {
  pass(
    "lesson_milestone_evidence",
    "25-sign lesson milestone has strict retained evidence and passing metrics",
    lessonEvidenceAudit.stdout,
  );
} else {
  fail(
    "lesson_milestone_evidence",
    "25-sign lesson milestone has strict retained evidence and passing metrics",
    lessonEvidenceAuditSummary(lessonEvidenceAudit),
  );
}

const finalDocs = [
  "README.md",
  "docs/model/dataset-and-training-plan.md",
  "docs/model/dataset-source-register.json",
  "docs/validation/validation-report.md",
  "docs/validation/browser-compatibility-matrix.md",
  "docs/validation/local-ml-environment.json",
  "docs/review/vocabulary-review-protocol.md",
  "docs/review/vocabulary-reviewer-authority.template.json",
  "docs/review/clip-review-protocol.md",
  "docs/review/challenge-review-protocol.md",
  "docs/review/operator-handoff.md",
  "docs/review/signer-identity-evidence.template.json",
  "docs/review/signed-consent-identity-receipt.template.json",
  "docs/privacy/dataset-consent-form.md",
  "docs/privacy/final-privacy-smoke.template.json",
  "docs/privacy/video-handling.md",
  "docs/model/final-provenance-audit.md",
  "docs/model/negative-challenge-manifest-schema.md",
  "docs/validation/final-browser-onnx-smoke.template.json",
  "docs/validation/final-browser-compatibility.template.json",
  "docs/validation/final-browser-compatibility.observations.template.json",
  "docs/validation/final-browser-compatibility-command-log.template.json",
  "docs/validation/final-browser-compatibility-network-log.template.json",
  "docs/validation/final-browser-compatibility-signed-review.template.json",
  "docs/source-materials/requirement-gate-map.json",
  "docs/strategy-confidence-audit.md",
];
const missingDocs = finalDocs.filter((relativePath) => !exists(relativePath));
if (missingDocs.length === 0) {
  pass("final_docs", "Required final documentation shells exist", finalDocs.join(", "));
} else {
  fail("final_docs", "Required final documentation shells exist", `Missing docs: ${missingDocs.join(", ")}`);
}

const finalRawframePipelinePreflightArgs = [
  "scripts/audit_final_rawframe_pipeline_preflight.mjs",
  "--skip-completion-readiness",
  ...(args.summaryOnly ? ["--skip-decode-replay"] : []),
];
const finalRawframePipelinePreflight = run("node", finalRawframePipelinePreflightArgs);
const finalRawframePipelinePreflightJson = parseJson(finalRawframePipelinePreflight.stdout);
const finalRawframePipelineDiagnosticPassed =
  finalRawframePipelinePreflight.status === 3 &&
  finalRawframePipelinePreflightJson?.status === "diagnostic_passed_not_final" &&
  finalRawframePipelinePreflightJson?.final_acceptance_eligible === false &&
  finalRawframePipelinePreflightJson?.skip_completion_readiness === true &&
  finalRawframePipelinePreflightJson?.skip_decode_replay !== true &&
  Array.isArray(finalRawframePipelinePreflightJson?.blockers) &&
  finalRawframePipelinePreflightJson.blockers.length === 0;
if (finalRawframePipelinePreflight.ok || finalRawframePipelineDiagnosticPassed) {
  pass(
    "final_rawframe_pipeline_preflight",
    "Final raw-frame pipeline preflight passes without smoke or noncanonical evidence",
    finalRawframePipelinePreflight.stdout,
  );
} else {
  fail(
    "final_rawframe_pipeline_preflight",
    "Final raw-frame pipeline preflight passes without smoke or noncanonical evidence",
    finalRawframePipelinePreflightEvidence(finalRawframePipelinePreflight),
  );
}

const requirementGateMap = validateRequirementGateMap(expectedIds);
if (requirementGateMap.blockers.length === 0) {
  pass(
    "requirement_gate_map",
    "Every PDF requirement maps to completion gates or explicit waivers",
    JSON.stringify(requirementGateMap),
  );
} else {
  fail(
    "requirement_gate_map",
    "Every PDF requirement maps to completion gates or explicit waivers",
    requirementGateMap.blockers.join("; "),
  );
}

if (args.readOnly) {
  const readOnlyAfterSnapshot = trackedFileSnapshot();
  const blockers = trackedSnapshotMutationBlockers(readOnlyTrackedFileSnapshot, readOnlyAfterSnapshot);
  if (blockers.length === 0) {
    pass(
      "read_only_no_tracked_mutation",
      "Read-only completion audit did not mutate tracked project files",
      JSON.stringify({
        tracked_file_count: Object.keys(readOnlyAfterSnapshot.files).length,
      }),
    );
  } else {
    fail(
      "read_only_no_tracked_mutation",
      "Read-only completion audit did not mutate tracked project files",
      blockers.join("; "),
    );
  }
}

const summary = {
  mode: args.readOnly ? "read_only" : "refresh_write_on_pass",
  status: findings.length === 0 ? "complete" : "incomplete",
  checked_at: new Date().toISOString(),
  passed: checks.filter((check) => check.status === "passed").length,
  partial: checks.filter((check) => check.status === "partial").length,
  failed: checks.filter((check) => check.status === "failed").length,
  blocker_count: findings.length,
};

const output = args.summaryOnly
  ? {
      ...summary,
      final_rawframe_next_stage: finalRawframePipelineNextStage(finalRawframePipelinePreflight),
      blocking_checks: checks
        .filter((check) => check.status !== "passed")
        .map(compactCheck),
    }
  : {
      ...summary,
      checks,
    };

console.log(JSON.stringify(output, null, 2));

if (findings.length > 0) {
  console.error("Completion readiness audit failed:");
  const stderrFindings = args.summaryOnly
    ? output.blocking_checks.flatMap((check) => (
        check.blockers.length > 0
          ? check.blockers.map((blocker) => `${check.id}: ${blocker}`)
          : [`${check.id}: ${check.status}`]
      ))
    : findings;
  for (const finding of stderrFindings) console.error(`- ${finding}`);
  process.exit(1);
}
