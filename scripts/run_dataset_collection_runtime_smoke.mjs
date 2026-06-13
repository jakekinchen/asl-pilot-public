import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "dataset-collection-runtime-smoke.json");
const retainedOutputDir = path.join(root, "output", "dataset-collection-runtime-smoke");
const liveOutputDir = path.join(root, "output", "dataset-collection-runtime-smoke-live");
const vocabularySourcePath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const consentVersion = "asl-pilot-dataset-consent-v1";
const captureConditionSchemaVersion = "asl-pilot-capture-conditions/v1";
const requiredChallengeTypes = [
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

function parseArgs(argv) {
  const args = { write: false };
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
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/run_dataset_collection_runtime_smoke.mjs [--write] [--output docs/validation/dataset-collection-runtime-smoke.json]

Starts the built Next.js app in explicit dataset-collection mode with isolated
temporary store, reviewed-vocabulary, collection-plan, and clip-root fixtures.
It proves the real collection APIs can load a reviewed plan, save one consented
vocabulary clip and one negative-challenge clip, reject duplicate plan
assignments, and report consented-but-not-reviewed coverage. The report is
smoke-only and is not final dataset evidence.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function referenceForFile(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Unable to allocate a local port"));
      });
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApp(appUrl, child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (child.exitCode !== null) throw new Error(`Next server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(appUrl, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Retry until the production server is reachable.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

function setCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const value = response.headers.get("set-cookie");
  return value ? [value] : [];
}

function mergeCookies(currentCookie, response) {
  const cookies = new Map(
    currentCookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        return separator === -1 ? [item, ""] : [item.slice(0, separator), item.slice(separator + 1)];
      }),
  );
  for (const raw of setCookieHeader(response)) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (!value) cookies.delete(name);
    else cookies.set(name, value);
  }
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function requestJson(appUrl, method, route, body, cookie = "") {
  const response = await fetch(new URL(route, appUrl), {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw_text: text };
  }
  return {
    status: response.status,
    ok: response.ok,
    data,
    cookie: mergeCookies(cookie, response),
  };
}

async function requestForm(appUrl, route, formData, cookie = "") {
  const response = await fetch(new URL(route, appUrl), {
    method: "POST",
    headers: cookie ? { cookie } : undefined,
    body: formData,
    cache: "no-store",
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw_text: text };
  }
  return {
    status: response.status,
    ok: response.ok,
    data,
    cookie: mergeCookies(cookie, response),
  };
}

function vocabularyItems() {
  const source = fs.readFileSync(vocabularySourcePath, "utf8");
  return [...source.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    id: match[1],
    label: match[2],
  }));
}

function signerBucket(signerAlias) {
  const digest = crypto.createHash("sha256").update(String(signerAlias)).digest();
  return digest[0] % 5;
}

function splitForSigner(signerAlias) {
  const bucket = signerBucket(signerAlias);
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function signerForSplit(targetSplit, prefix) {
  for (let index = 1; index < 500; index += 1) {
    const alias = `${prefix}-${String(index).padStart(3, "0")}`;
    if (splitForSigner(alias) === targetSplit) return alias;
  }
  throw new Error(`Unable to find ${targetSplit} signer alias for smoke fixture`);
}

function buildFixtures(outputDir) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const storePath = path.join(outputDir, "store.json");
  const clipRoot = path.join(outputDir, "clips");
  const fixtureSourcePath = path.join(outputDir, "source-curated-vocabulary-source.ts");
  const reviewEvidencePath = path.join(outputDir, "final-vocabulary-review.json");
  const planPath = path.join(outputDir, "collection-plan.json");
  const source = fs.readFileSync(vocabularySourcePath, "utf8").replaceAll("needs_deaf_educator_review", "source_curated");
  fs.writeFileSync(fixtureSourcePath, source, "utf8");
  const labels = vocabularyItems();
  const approvedItemIds = labels.map((item) => item.id);
  const vocabularySourceSha256 = sha256Text(source);
  const importedAt = new Date().toISOString();
  const reviewEvidence = {
    schema_version: "asl-pilot-vocabulary-review-evidence/v1",
    status: "source_curated",
    imported_at: importedAt,
    evidence_mode: "smoke",
    finality: "smoke_only",
    vocabulary_source: {
      path: projectRelative(fixtureSourcePath),
      sha256: vocabularySourceSha256,
      item_count: labels.length,
    },
    reviewer: {
      name: "Dataset Collection Runtime Smoke",
      role: "Smoke fixture reviewer",
      qualification: "Non-final fixture for runtime collection smoke only",
      affiliation_or_context: "local runtime smoke",
      contact_or_signed_evidence: "not-final-evidence",
      is_project_operator: false,
      reviewed_at: importedAt,
    },
    item_count: labels.length,
    approved_item_ids: approvedItemIds,
  };
  writeJson(reviewEvidencePath, reviewEvidence);

  const vocabularySignerAlias = signerForSplit("train", "smoke-vocab-signer");
  const challengeSignerAlias = signerForSplit("validation", "smoke-challenge-signer");
  const plan = {
    schema_version: "asl-pilot-dataset-collection-plan/v1",
    generated_at: importedAt,
    evidence_mode: "smoke",
    finality: "smoke_only",
    review_gate: {
      status: "source_curated",
      vocabulary_source: reviewEvidence.vocabulary_source,
      evidence: {
        path: projectRelative(reviewEvidencePath),
        exists: true,
        sha256: sha256File(reviewEvidencePath),
      },
      vocabulary_review: referenceForFile(reviewEvidencePath),
    },
    targets: {
      vocabulary_labels: labels.length,
      target_signers: 20,
      signers_by_split: {
        train: 12,
        validation: 4,
        test: 4,
      },
      clips_per_label_per_split: 5,
      negative_challenge: {
        required_types: requiredChallengeTypes,
        clips_per_type: 5,
        signer_count: 5,
        signer_disjoint_from_vocabulary: true,
      },
    },
    planned_signer_counts: {
      train: 1,
      validation: 1,
      test: 0,
    },
    assignment_count: 1,
    negative_challenge_assignment_count: 1,
    warnings: [],
    assignments: [
      {
        split: splitForSigner(vocabularySignerAlias),
        signer_alias: vocabularySignerAlias,
        label_id: "hello",
        display_text: "Hello",
        capture_count_for_label_split: 1,
      },
    ],
    negative_challenge_assignments: [
      {
        split: "negative_challenge",
        signer_alias: challengeSignerAlias,
        challenge_type: "idle_hands",
        expected_outcome: "reject",
        capture_count_for_type: 1,
      },
    ],
  };
  writeJson(planPath, plan);
  return {
    storePath,
    clipRoot,
    fixtureSourcePath,
    reviewEvidencePath,
    planPath,
    plan,
  };
}

function allConsentFields() {
  return {
    ageEligible: "true",
    allowModelTraining: "true",
    allowValidation: "true",
    allowPilotUse: "true",
    allowDerivedArtifactRetention: "true",
    allowDeidentifiedMetadataRetention: "true",
    retentionAcknowledged: "true",
    withdrawalAcknowledged: "true",
  };
}

function captureConditionPayload(kind, challengeType = "empty_camera") {
  if (kind === "negative_challenge") {
    return {
      schemaVersion: captureConditionSchemaVersion,
      captureEnvironment: "negative_challenge",
      operatorAttestation: true,
      operatorAttestedAt: new Date().toISOString(),
      frontLightingConfirmed: false,
      upperTorsoAndHandsVisibleConfirmed: false,
      cameraDistanceWithinPilotRangeConfirmed: false,
      isolatedPromptSignConfirmed: false,
      challengeType,
      emptyCameraConfirmed: challengeType === "empty_camera",
      noHandsVisibleConfirmed: challengeType === "no_hands_visible",
      lowLightConfirmed: challengeType === "low_light",
      offCenterConfirmed: challengeType === "off_center",
      hardNegativeConditionConfirmed: !["empty_camera", "no_hands_visible", "low_light", "off_center"].includes(challengeType),
      expectedRejectOutcomeConfirmed: true,
    };
  }
  return {
    schemaVersion: captureConditionSchemaVersion,
    captureEnvironment: "controlled_vocabulary",
    operatorAttestation: true,
    operatorAttestedAt: new Date().toISOString(),
    frontLightingConfirmed: true,
    upperTorsoAndHandsVisibleConfirmed: true,
    cameraDistanceWithinPilotRangeConfirmed: true,
    isolatedPromptSignConfirmed: true,
    challengeType: null,
    emptyCameraConfirmed: false,
    noHandsVisibleConfirmed: false,
    lowLightConfirmed: false,
    offCenterConfirmed: false,
    hardNegativeConditionConfirmed: false,
    expectedRejectOutcomeConfirmed: false,
  };
}

function collectionForm(fields) {
  const form = new FormData();
  const clipBytes = Buffer.alloc(2048, fields.clipKind === "negative_challenge" ? 2 : 1);
  clipBytes.write(`dataset-collection-runtime-smoke:${fields.clipKind}:${Date.now()}`);
  form.set("clip", new Blob([clipBytes], { type: "video/webm" }), `${fields.clipKind}.webm`);
  form.set("clipKind", fields.clipKind);
  form.set("planAssignmentKey", fields.planAssignmentKey);
  form.set("signerAlias", fields.signerAlias);
  form.set("durationMs", "3200");
  form.set("mediaStreamTrackSettings", JSON.stringify({
    width: 640,
    height: 480,
    frameRate: 30,
    facingMode: "user",
  }));
  form.set("captureConditionEvidence", JSON.stringify(fields.captureConditionEvidence));
  if (fields.clipKind === "negative_challenge") form.set("challengeType", fields.challengeType);
  else form.set("vocabularyId", fields.vocabularyId);
  for (const [key, value] of Object.entries(allConsentFields())) form.set(key, value);
  return form;
}

function check(condition, blockers, message) {
  if (!condition) blockers.push(message);
}

async function runSmoke(appUrl, fixtures) {
  const blockers = [];
  const email = `collection-smoke-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = "collection-smoke-password";
  let cookie = "";

  const register = await requestJson(appUrl, "POST", "/api/auth/register", {
    email,
    name: "Collection Smoke",
    password,
  }, cookie);
  cookie = register.cookie;
  check(register.status === 200 && Boolean(cookie), blockers, "registration must create a collection-mode session");

  const planResponse = await requestJson(appUrl, "GET", "/api/dataset/plan", undefined, cookie);
  const plan = planResponse.data?.plan;
  const vocabularyAssignment = plan?.assignments?.[0] ?? null;
  const challengeAssignment = plan?.negative_challenge_assignments?.[0] ?? null;
  const coverageRoute = `/api/dataset/coverage?vocabularyId=hello&signerAlias=${encodeURIComponent(
    vocabularyAssignment?.signer_alias ?? "",
  )}`;
  check(planResponse.status === 200, blockers, "GET /api/dataset/plan must return the accepted smoke plan");
  check(plan?.review_gate?.status === "source_curated", blockers, "collection plan review_gate.status must be source_curated");

  const initialCoverage = await requestJson(appUrl, "GET", coverageRoute, undefined, cookie);
  check(initialCoverage.status === 200, blockers, "GET /api/dataset/coverage must succeed before collection");
  check(initialCoverage.data?.coverage?.consentedClips === 0, blockers, "initial coverage must start with zero consented clips");
  check(initialCoverage.data?.coverage?.signerSplit === "train", blockers, "initial coverage must resolve the selected signer to the train split");

  const vocabularyForm = collectionForm({
    clipKind: "vocabulary",
    planAssignmentKey: "vocabulary:0",
    signerAlias: vocabularyAssignment?.signer_alias ?? "",
    vocabularyId: "hello",
    captureConditionEvidence: captureConditionPayload("vocabulary"),
  });
  const vocabularyClip = await requestForm(appUrl, "/api/dataset/clips", vocabularyForm, cookie);
  check(vocabularyClip.status === 200, blockers, "vocabulary clip upload must succeed through /api/dataset/clips");
  check(vocabularyClip.data?.clip?.labelReviewStatus === "needs_qa", blockers, "vocabulary clip must remain pending clip QA");

  const duplicateVocabularyClip = await requestForm(appUrl, "/api/dataset/clips", vocabularyForm, cookie);
  check(duplicateVocabularyClip.status === 400, blockers, "duplicate vocabulary plan assignment must be rejected");
  check(
    /already has a pending or approved clip/i.test(String(duplicateVocabularyClip.data?.error ?? "")),
    blockers,
    "duplicate vocabulary rejection must explain the pending/approved assignment guard",
  );

  const challengeForm = collectionForm({
    clipKind: "negative_challenge",
    planAssignmentKey: "negative_challenge:0",
    signerAlias: challengeAssignment?.signer_alias ?? "",
    challengeType: "idle_hands",
    captureConditionEvidence: captureConditionPayload("negative_challenge", "idle_hands"),
  });
  const challengeClip = await requestForm(appUrl, "/api/dataset/clips", challengeForm, cookie);
  check(challengeClip.status === 200, blockers, "negative challenge clip upload must succeed through /api/dataset/clips");
  check(challengeClip.data?.clip?.challengeReviewStatus === "needs_review", blockers, "challenge clip must remain pending challenge review");

  const duplicateChallengeClip = await requestForm(appUrl, "/api/dataset/clips", challengeForm, cookie);
  check(duplicateChallengeClip.status === 400, blockers, "duplicate challenge plan assignment must be rejected");
  check(
    /already has a pending or approved clip/i.test(String(duplicateChallengeClip.data?.error ?? "")),
    blockers,
    "duplicate challenge rejection must explain the pending/approved assignment guard",
  );

  const finalCoverage = await requestJson(appUrl, "GET", coverageRoute, undefined, cookie);
  const coverage = finalCoverage.data?.coverage;
  check(finalCoverage.status === 200, blockers, "GET /api/dataset/coverage must succeed after collection");
  check(coverage?.consentedClips === 1, blockers, "coverage must count one consented vocabulary clip");
  check(coverage?.exportableClips === 0, blockers, "coverage must not treat pending vocabulary clips as exportable");
  check(coverage?.reviewPendingClips === 1, blockers, "coverage must count one pending vocabulary review clip");
  check(coverage?.consentedChallengeClips === 1, blockers, "coverage must count one consented challenge clip");
  check(coverage?.exportableChallengeClips === 0, blockers, "coverage must not treat pending challenge clips as exportable");
  check(coverage?.reviewPendingChallengeClips === 1, blockers, "coverage must count one pending challenge review clip");
  check(coverage?.signerSplit === "train", blockers, "coverage must keep the selected signer in the train split");
  check(coverage?.selectedLabelCoverage?.train === 1, blockers, "selected label coverage must count the train clip");
  check(coverage?.selectedLabelExportableCoverage?.train === 0, blockers, "selected label exportable coverage must remain zero");
  check(coverage?.consentedChallengeCountsByType?.idle_hands === 1, blockers, "coverage must count one idle-hands challenge clip");
  check(coverage?.exportableChallengeCountsByType?.idle_hands === 0, blockers, "idle-hands challenge clip must remain non-exportable");
  check(
    Array.isArray(coverage?.blockedPlanAssignmentKeys) &&
      coverage.blockedPlanAssignmentKeys.includes("vocabulary:0") &&
      coverage.blockedPlanAssignmentKeys.includes("negative_challenge:0"),
    blockers,
    "coverage must expose pending/approved collection-plan assignments as blocked",
  );

  const clipsResponse = await requestJson(appUrl, "GET", "/api/dataset/clips", undefined, cookie);
  check(clipsResponse.status === 200, blockers, "GET /api/dataset/clips must return saved collection rows");
  check(clipsResponse.data?.clips?.length === 1, blockers, "GET /api/dataset/clips must return one vocabulary clip");
  check(clipsResponse.data?.challengeClips?.length === 1, blockers, "GET /api/dataset/clips must return one challenge clip");

  const store = fs.existsSync(fixtures.storePath) ? readJson(fixtures.storePath) : null;
  const savedVideoPaths = [
    ...(store?.datasetClips ?? []),
    ...(store?.datasetChallengeClips ?? []),
  ].map((clip) => path.join(fixtures.clipRoot, path.basename(clip.relativeVideoPath ?? "")));
  check(savedVideoPaths.length === 2, blockers, "store must contain two saved smoke clip rows");
  for (const file of savedVideoPaths) {
    check(fs.existsSync(file), blockers, `saved smoke clip file must exist: ${file}`);
  }

  return {
    status: blockers.length === 0 ? "passed" : "failed",
    blockers,
    checks: {
      register_status: register.status,
      plan_status: planResponse.status,
      initial_coverage_status: initialCoverage.status,
      vocabulary_clip_status: vocabularyClip.status,
      duplicate_vocabulary_clip_status: duplicateVocabularyClip.status,
      challenge_clip_status: challengeClip.status,
      duplicate_challenge_clip_status: duplicateChallengeClip.status,
      final_coverage_status: finalCoverage.status,
      clips_status: clipsResponse.status,
    },
    coverage,
    saved_clip_files: savedVideoPaths.map((file) => ({
      path: projectRelative(file),
      exists: fs.existsSync(file),
      sha256: fs.existsSync(file) ? sha256File(file) : null,
    })),
    response_bodies: {
      register: register.data,
      plan: planResponse.data,
      initial_coverage: initialCoverage.data,
      vocabulary_clip: vocabularyClip.data,
      duplicate_vocabulary_clip: duplicateVocabularyClip.data,
      challenge_clip: challengeClip.data,
      duplicate_challenge_clip: duplicateChallengeClip.data,
      final_coverage: finalCoverage.data,
      clips: clipsResponse.data,
    },
    returned_rows: {
      vocabulary_clip: vocabularyClip.data?.clip ?? null,
      challenge_clip: challengeClip.data?.clip ?? null,
    },
  };
}

function buildReport({ appUrl, outputPath, smoke, fixtures, server }) {
  return {
    schema_version: "asl-pilot-dataset-collection-runtime-smoke/v1",
    status: smoke.status,
    evidence_mode: "smoke",
    finality: "smoke_only",
    tested_at: new Date().toISOString(),
    runner: {
      tool: "node-fetch",
      app_url: appUrl,
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_dataset_collection_runtime_smoke.mjs"),
    },
    fixtures: {
      store: referenceForFile(fixtures.storePath),
      reviewed_vocabulary_source: referenceForFile(fixtures.fixtureSourcePath),
      vocabulary_review_evidence: referenceForFile(fixtures.reviewEvidencePath),
      collection_plan: referenceForFile(fixtures.planPath),
      clip_root: projectRelative(fixtures.clipRoot),
    },
    runtime_env: {
      ENABLE_DATASET_COLLECTION: "true",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "true",
      ASL_PILOT_STORE_PATH: projectRelative(fixtures.storePath),
      ASL_PILOT_DATASET_CLIP_ROOT: projectRelative(fixtures.clipRoot),
      ASL_PILOT_COLLECTION_PLAN_PATH: projectRelative(fixtures.planPath),
      ASL_PILOT_VOCABULARY_SOURCE_PATH: projectRelative(fixtures.fixtureSourcePath),
      ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH: projectRelative(fixtures.reviewEvidencePath),
      ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES: "true",
      ASL_PILOT_AUTH_PROVIDER: "local",
    },
    collection: {
      ran_collection_mode: true,
      reviewed_plan_loaded: smoke.checks.plan_status === 200,
      saved_vocabulary_clip: smoke.checks.vocabulary_clip_status === 200,
      rejected_duplicate_vocabulary_assignment: smoke.checks.duplicate_vocabulary_clip_status === 400,
      saved_negative_challenge_clip: smoke.checks.challenge_clip_status === 200,
      rejected_duplicate_challenge_assignment: smoke.checks.duplicate_challenge_clip_status === 400,
      coverage_separates_pending_from_exportable: smoke.coverage?.consentedClips === 1
        && smoke.coverage?.exportableClips === 0
        && smoke.coverage?.reviewPendingClips === 1
        && smoke.coverage?.consentedChallengeClips === 1
        && smoke.coverage?.exportableChallengeClips === 0
        && smoke.coverage?.reviewPendingChallengeClips === 1,
      checks: smoke.checks,
      coverage: smoke.coverage,
      saved_clip_files: smoke.saved_clip_files,
      response_bodies: smoke.response_bodies ?? null,
      returned_rows: smoke.returned_rows,
    },
    final_evidence_exclusion: {
      excluded_from_completion: true,
      reason: "This smoke uses temporary reviewed-vocabulary and collection-plan fixtures. It proves runtime wiring only and is not real signer/reviewer dataset evidence.",
    },
    evidence: {
      source_files: [
        "scripts/run_dataset_collection_runtime_smoke.mjs",
        "scripts/audit_dataset_collection_runtime_smoke.mjs",
        "web/src/lib/server-store.ts",
        "web/src/app/api/dataset/plan/route.ts",
        "web/src/app/api/dataset/clips/route.ts",
        "web/src/app/api/dataset/coverage/route.ts",
        "web/src/components/DatasetCollectionPanel.tsx",
        "docs/privacy/dataset-consent-form.md",
      ].map(fileReference),
    },
    server,
    output: outputPath ? projectRelative(outputPath) : null,
    blockers: smoke.blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output ? resolveProjectPath(args.output, "--output") : defaultOutputPath;
  const outputDir = args.write ? retainedOutputDir : liveOutputDir;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the dataset collection runtime smoke");
  }
  const fixtures = buildFixtures(outputDir);
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(root, "web"),
    env: {
      ...process.env,
      ASL_PILOT_STORE_PATH: fixtures.storePath,
      ASL_PILOT_DATASET_CLIP_ROOT: fixtures.clipRoot,
      ASL_PILOT_COLLECTION_PLAN_PATH: fixtures.planPath,
      ASL_PILOT_VOCABULARY_SOURCE_PATH: fixtures.fixtureSourcePath,
      ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH: fixtures.reviewEvidencePath,
      ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES: "true",
      ASL_PILOT_AUTH_PROVIDER: "local",
      ENABLE_DATASET_COLLECTION: "true",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  let smoke;
  try {
    await waitForApp(appUrl, child);
    smoke = await runSmoke(appUrl, fixtures);
  } catch (error) {
    smoke = {
      status: "failed",
      blockers: [error instanceof Error ? error.message : String(error)],
      checks: {},
      coverage: null,
      saved_clip_files: [],
      returned_rows: {},
    };
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(resolve, 2_000);
    });
  }

  const server = {
    mode: "next_start",
    build_id_sha256: sha256File(buildIdPath),
    stdout_tail: stdout.trim().split(/\r?\n/).slice(-20),
    stderr_tail: stderr.trim().split(/\r?\n/).slice(-20),
  };
  const report = buildReport({ appUrl, outputPath: args.write ? outputPath : null, smoke, fixtures, server });
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(outputPath) : null,
    app_url: appUrl,
    blockers: report.blockers,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Dataset collection runtime smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
