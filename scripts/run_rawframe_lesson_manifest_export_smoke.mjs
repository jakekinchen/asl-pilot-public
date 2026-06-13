import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-lesson-first-party-manifest-export-smoke.json");
const retainedOutputDir = path.join(root, "output", "rawframe-lesson-manifest-export-smoke");
const smokeClipRoot = path.join(root, "data", "dataset", "clips");
const schemaVersion = "asl-pilot-rawframe-lesson-manifest-export-smoke/v1";
const smokeStartedAt = new Date().toISOString();

function parseArgs(argv) {
  const args = { output: defaultOutputPath, write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--output") {
      args.output = resolveProjectPath(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/run_rawframe_lesson_manifest_export_smoke.mjs
  node scripts/run_rawframe_lesson_manifest_export_smoke.mjs --write

Builds an isolated, tiny approved lesson packet fixture, proves the real lesson
collection readiness audit can go green for that fixture, then proves the real
lesson manifest exporter writes train, validation, test, and negative-challenge
manifests into output/. The report is smoke-only and is not final model or
dataset evidence.
`);
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256Text(value) {
  return sha256Buffer(value);
}

function sha256File(file) {
  return sha256Buffer(fs.readFileSync(file));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [process.execPath, ...args],
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function pythonExecutable() {
  const venvPython = path.join(root, ".venv", "bin", "python");
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function runPython(args) {
  const executable = pythonExecutable();
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONPATH: "scripts",
    },
  });
  return {
    command: [projectRelativeCommand(executable), ...args],
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function projectRelativeCommand(value) {
  if (!path.isAbsolute(value)) return value;
  return projectRelative(value);
}

function sanitizedDecodeDryRun(run) {
  let parsed = null;
  try {
    parsed = run.stdout ? JSON.parse(run.stdout) : null;
  } catch {
    parsed = null;
  }
  const manifests = Array.isArray(parsed?.manifests)
    ? parsed.manifests.map((manifest) => ({
      manifest: manifest.manifest,
      split: manifest.split,
      dry_run: manifest.dry_run,
      clips_decoded: manifest.clips_decoded,
      tensor_root: manifest.tensor_root,
    }))
    : [];
  return {
    command: run.command,
    exit_code: run.exit_code,
    stderr: run.stderr,
    stdout_parse_status: parsed ? "parsed" : "unavailable",
    stdout_sha256: sha256Text(run.stdout),
    status: parsed?.status ?? null,
    manifests,
    raw_rgb_component_inventory_empty: Array.isArray(parsed?.pretrained_components)
      ? parsed.pretrained_components.length === 0
      : null,
  };
}

function consentRecord(id, signerAlias) {
  return {
    id,
    signerAlias,
    operatorUserId: "smoke-operator",
    consentVersion: "asl-pilot-dataset-consent-v1",
    consentFormSha256: "smoke-only-consent-form",
    signedAt: smokeStartedAt,
    rawClipStorageLocation: "data/dataset/clips",
    rawClipAccess: "local_operator_only",
    retentionPeriod: "smoke_fixture_discardable",
    ageEligible: true,
    allowModelTraining: true,
    allowValidation: true,
    allowPilotUse: true,
    allowDerivedArtifactRetention: true,
    allowDeidentifiedMetadataRetention: true,
    retentionAcknowledged: true,
    withdrawalAcknowledged: true,
    allowRawClipRedistribution: false,
    createdAt: smokeStartedAt,
  };
}

function vocabularyCaptureEvidence() {
  return {
    schemaVersion: "asl-pilot-capture-conditions/v1",
    captureEnvironment: "controlled_vocabulary",
    operatorAttestation: true,
    operatorAttestedAt: smokeStartedAt,
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

function challengeCaptureEvidence(challengeType) {
  return {
    schemaVersion: "asl-pilot-capture-conditions/v1",
    captureEnvironment: "negative_challenge",
    operatorAttestation: true,
    operatorAttestedAt: smokeStartedAt,
    frontLightingConfirmed: false,
    upperTorsoAndHandsVisibleConfirmed: false,
    cameraDistanceWithinPilotRangeConfirmed: false,
    isolatedPromptSignConfirmed: false,
    challengeType,
    emptyCameraConfirmed: false,
    noHandsVisibleConfirmed: false,
    lowLightConfirmed: false,
    offCenterConfirmed: false,
    hardNegativeConditionConfirmed: true,
    expectedRejectOutcomeConfirmed: true,
  };
}

function colorForClip(id) {
  const digest = crypto.createHash("sha256").update(id).digest();
  const red = digest[0].toString(16).padStart(2, "0");
  const green = digest[1].toString(16).padStart(2, "0");
  const blue = digest[2].toString(16).padStart(2, "0");
  return `0x${red}${green}${blue}`;
}

function writeTinyWebm(file, id) {
  const ffmpeg = spawnSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=${colorForClip(id)}:s=96x96:r=12:d=1`,
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-pix_fmt",
    "yuv420p",
    "-y",
    file,
  ], {
    cwd: root,
    encoding: "utf8",
  });
  if (ffmpeg.status !== 0) {
    throw new Error(`Unable to generate smoke WebM ${projectRelative(file)}: ${ffmpeg.stderr.trim()}`);
  }
}

function writeSmokeClip(id) {
  const filename = `rawframe-lesson-export-smoke-${id}.webm`;
  const absolutePath = path.join(smokeClipRoot, filename);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.rmSync(absolutePath, { force: true });
  writeTinyWebm(absolutePath, id);
  return {
    relativeVideoPath: path.posix.join("dataset", "clips", filename),
    absolutePath,
    sha256: sha256File(absolutePath),
    sizeBytes: fs.statSync(absolutePath).size,
  };
}

function vocabularyClip(row, index, consentId) {
  const clip = writeSmokeClip(row.assignment_key.replaceAll(":", "-"));
  return {
    id: `smoke-vocab-${index}`,
    userId: "smoke-user",
    consentRecordId: consentId,
    signerAlias: row.signer_alias,
    vocabularyId: row.label_id,
    planAssignmentKey: row.assignment_key,
    collectionPlanPath: "output/rawframe-lesson-manifest-export-smoke/collection-plan-smoke.json",
    collectionPlanSha256: sha256Text("rawframe lesson manifest smoke collection plan"),
    collectionPlanGeneratedAt: smokeStartedAt,
    collectionPlanReviewGateStatus: "source_curated",
    planAssignmentSnapshot: {
      kind: "vocabulary",
      vocabularyId: row.label_id,
      signerAlias: row.signer_alias,
      split: row.split,
      smokeOnly: true,
    },
    relativeVideoPath: clip.relativeVideoPath,
    sha256: clip.sha256,
    mimeType: "video/webm",
    sizeBytes: clip.sizeBytes,
    durationMs: 1000,
    mediaStreamTrackSettings: {
      width: 640,
      height: 480,
      frameRate: 30,
      smokeOnly: true,
    },
    captureConditionEvidence: vocabularyCaptureEvidence(),
    labelReviewStatus: "approved",
    labelReviewer: "smoke-fixture",
    labelReviewedAt: smokeStartedAt,
    labelRejectionReason: null,
    labelReviewNotes: "Smoke-only approval for exporter positive-path proof.",
    createdAt: smokeStartedAt,
  };
}

function challengeClip(row, consentId) {
  const clip = writeSmokeClip(row.assignment_key.replaceAll(":", "-"));
  return {
    id: "smoke-challenge-1",
    userId: "smoke-user",
    consentRecordId: consentId,
    signerAlias: row.signer_alias,
    challengeType: row.challenge_type,
    planAssignmentKey: row.assignment_key,
    collectionPlanPath: "output/rawframe-lesson-manifest-export-smoke/collection-plan-smoke.json",
    collectionPlanSha256: sha256Text("rawframe lesson manifest smoke collection plan"),
    collectionPlanGeneratedAt: smokeStartedAt,
    collectionPlanReviewGateStatus: "source_curated",
    planAssignmentSnapshot: {
      kind: "negative_challenge",
      challengeType: row.challenge_type,
      signerAlias: row.signer_alias,
      split: row.split,
      smokeOnly: true,
    },
    relativeVideoPath: clip.relativeVideoPath,
    sha256: clip.sha256,
    mimeType: "video/webm",
    sizeBytes: clip.sizeBytes,
    durationMs: 1000,
    mediaStreamTrackSettings: {
      width: 640,
      height: 480,
      frameRate: 30,
      smokeOnly: true,
    },
    captureConditionEvidence: challengeCaptureEvidence(row.challenge_type),
    challengeReviewStatus: "approved",
    challengeReviewer: "smoke-fixture",
    challengeReviewedAt: smokeStartedAt,
    challengeRejectionReason: null,
    challengeReviewNotes: "Smoke-only approval for exporter positive-path proof.",
    createdAt: smokeStartedAt,
  };
}

function buildPacket() {
  const labels = [
    { label_id: "hello", display_text: "Hello", lesson_role: "target", confusion_evidence: null },
  ];
  const queue = [
    {
      assignment_key: "smoke:vocabulary:train",
      lesson_queue_index: 1,
      lesson_role: "target",
      assignment_type: "vocabulary_capture",
      split: "train",
      signer_alias: "smoke-signer-train",
      label_id: "hello",
      challenge_type: null,
    },
    {
      assignment_key: "smoke:vocabulary:validation",
      lesson_queue_index: 2,
      lesson_role: "target",
      assignment_type: "vocabulary_capture",
      split: "validation",
      signer_alias: "smoke-signer-validation",
      label_id: "hello",
      challenge_type: null,
    },
    {
      assignment_key: "smoke:vocabulary:test",
      lesson_queue_index: 3,
      lesson_role: "target",
      assignment_type: "vocabulary_capture",
      split: "test",
      signer_alias: "smoke-signer-test",
      label_id: "hello",
      challenge_type: null,
    },
    {
      assignment_key: "smoke:challenge:idle_hands",
      lesson_queue_index: 4,
      lesson_role: "current_app_hard_negative",
      assignment_type: "negative_challenge_capture",
      split: "negative_challenge",
      signer_alias: "smoke-signer-negative",
      label_id: null,
      challenge_type: "idle_hands",
    },
  ];
  return {
    schema_version: "asl-pilot-rawframe-lesson-collection-packet/v1",
    status: "lesson_collection_packet_ready_not_training_data",
    generated_at: smokeStartedAt,
    generated_by: {
      tool: "node",
      command: [process.execPath, "scripts/run_rawframe_lesson_manifest_export_smoke.mjs"],
      script: fileReference(path.join(root, "scripts", "run_rawframe_lesson_manifest_export_smoke.mjs")),
    },
    final_model_evidence: false,
    smoke_only: true,
    decision_boundary: {
      changes_store: false,
      changes_final_manifests: false,
      approves_source: false,
      final_model_evidence: false,
      fixture_only: true,
    },
    inputs: {
      lesson_milestone: {
        path: "output/rawframe-lesson-manifest-export-smoke/smoke-lesson-milestone.json",
        sha256: null,
      },
    },
    blockers: [],
    packet_summary: {
      lesson_label_count: labels.length,
      target_label_count: labels.length,
      near_confusable_label_count: 0,
      queue_assignment_count: queue.length,
      vocabulary_assignment_count: 3,
      negative_challenge_assignment_count: 1,
      assignment_counts_by_role: {
        target: 3,
        current_app_hard_negative: 1,
      },
      assignment_counts_by_split: {
        train: 1,
        validation: 1,
        test: 1,
        negative_challenge: 1,
      },
      negative_challenge_assignment_counts_by_type: {
        idle_hands: 1,
      },
      hard_negative_taxonomy_count: 1,
      hard_negative_taxonomy_not_current_app_assignment_count: 0,
    },
    labels,
    queue,
    hard_negative_coverage: [
      {
        challenge_type: "idle_hands",
        status: "current_app_assignment_type",
        assignment_count: 1,
      },
    ],
  };
}

function buildStore(packet) {
  const consentRecords = packet.queue.map((row) => consentRecord(`smoke-consent-${row.lesson_queue_index}`, row.signer_alias));
  const consentIdBySigner = new Map(consentRecords.map((record) => [record.signerAlias, record.id]));
  const vocabularyRows = packet.queue.filter((row) => row.assignment_type === "vocabulary_capture");
  const challengeRows = packet.queue.filter((row) => row.assignment_type === "negative_challenge_capture");
  return {
    users: [],
    sessions: [],
    attempts: [],
    datasetSigners: [...new Set(packet.queue.map((row) => row.signer_alias))].map((signerAlias) => ({
      signerAlias,
      userId: "smoke-user",
      operatorUserId: "smoke-operator",
      createdAt: smokeStartedAt,
      updatedAt: smokeStartedAt,
    })),
    consentRecords,
    datasetClips: vocabularyRows.map((row, index) => vocabularyClip(row, index + 1, consentIdBySigner.get(row.signer_alias))),
    datasetChallengeClips: challengeRows.map((row) => challengeClip(row, consentIdBySigner.get(row.signer_alias))),
  };
}

function assertManifestCounts(manifestExport) {
  const expected = {
    train: 1,
    validation: 1,
    test: 1,
    negative_challenge: 1,
  };
  const counts = manifestExport?.counts ?? {};
  const failures = [];
  for (const [key, value] of Object.entries(expected)) {
    if (counts[key] !== value) failures.push(`${key} manifest count was ${counts[key] ?? "missing"}; expected ${value}`);
  }
  return failures;
}

function downstreamValidationScript(fixtures) {
  return `
from pathlib import Path
from decode_raw_videos import validate_negative_challenge_manifest_for_decode
from train_rawframe_model import validate_manifest

train = validate_manifest(Path("${projectRelative(path.join(fixtures.manifestDir, "train.json"))}"), "train", True, True)
validation = validate_manifest(Path("${projectRelative(path.join(fixtures.manifestDir, "validation.json"))}"), "validation", True, True)
test = validate_manifest(Path("${projectRelative(path.join(fixtures.manifestDir, "test.json"))}"), "test", True, True)
negative = validate_negative_challenge_manifest_for_decode(
    Path("${projectRelative(path.join(fixtures.manifestDir, "negative-challenge.json"))}"),
    True,
)
print({
    "status": "passed",
    "train_clip_count": train["clip_count"],
    "validation_clip_count": validation["clip_count"],
    "test_clip_count": test["clip_count"],
    "negative_challenge_clip_count": negative["clip_count"],
})
`;
}

function decodeDryRunArgs(fixtures) {
  return [
    "scripts/decode_raw_videos.py",
    "--manifest",
    projectRelative(path.join(fixtures.manifestDir, "train.json")),
    "--manifest",
    projectRelative(path.join(fixtures.manifestDir, "validation.json")),
    "--manifest",
    projectRelative(path.join(fixtures.manifestDir, "test.json")),
    "--manifest",
    projectRelative(path.join(fixtures.manifestDir, "negative-challenge.json")),
    "--dry-run",
    "--allow-small-label-set",
  ];
}

function buildFixtures() {
  fs.rmSync(retainedOutputDir, { recursive: true, force: true });
  fs.mkdirSync(retainedOutputDir, { recursive: true });
  const packetPath = path.join(retainedOutputDir, "packet.json");
  const storePath = path.join(retainedOutputDir, "store.json");
  const readinessPath = path.join(retainedOutputDir, "readiness.json");
  const exporterSummaryPath = path.join(retainedOutputDir, "manifest-export.json");
  const manifestDir = path.join(retainedOutputDir, "manifests");
  const packet = buildPacket();
  const store = buildStore(packet);
  writeJson(packetPath, packet);
  writeJson(storePath, store);
  return {
    packetPath,
    storePath,
    readinessPath,
    exporterSummaryPath,
    manifestDir,
    fixtureClipFiles: [...store.datasetClips, ...store.datasetChallengeClips]
      .map((clip) => path.join(root, "data", clip.relativeVideoPath)),
  };
}

function runSmoke() {
  const fixtures = buildFixtures();
  const readinessRun = runNode([
    "scripts/audit_rawframe_lesson_collection_readiness.mjs",
    "--packet",
    projectRelative(fixtures.packetPath),
    "--store",
    projectRelative(fixtures.storePath),
    "--output",
    projectRelative(fixtures.readinessPath),
    "--write",
  ]);
  const exportRun = runNode([
    "scripts/export_rawframe_lesson_first_party_manifests.mjs",
    "--packet",
    projectRelative(fixtures.packetPath),
    "--readiness",
    projectRelative(fixtures.readinessPath),
    "--store",
    projectRelative(fixtures.storePath),
    "--output-dir",
    projectRelative(fixtures.manifestDir),
    "--summary-output",
    projectRelative(fixtures.exporterSummaryPath),
    "--write",
  ]);
  const readiness = fs.existsSync(fixtures.readinessPath) ? readJson(fixtures.readinessPath) : null;
  const exporterSummary = fs.existsSync(fixtures.exporterSummaryPath) ? readJson(fixtures.exporterSummaryPath) : null;
  const downstreamValidationRun = runPython(["-c", downstreamValidationScript(fixtures)]);
  const decodeDryRun = runPython(decodeDryRunArgs(fixtures));
  const manifestCountFailures = assertManifestCounts(exporterSummary?.manifest_export);
  const manifestFiles = fs.existsSync(fixtures.manifestDir)
    ? fs.readdirSync(fixtures.manifestDir)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => fileReference(path.join(fixtures.manifestDir, name)))
    : [];
  const failures = [
    ...(readinessRun.exit_code === 0 ? [] : [`readiness audit exited ${readinessRun.exit_code}`]),
    ...(exportRun.exit_code === 0 ? [] : [`manifest export exited ${exportRun.exit_code}`]),
    ...(readiness?.status === "ready_for_lesson_manifest_export" ? [] : [`readiness status was ${readiness?.status ?? "missing"}`]),
    ...(exporterSummary?.status === "lesson_first_party_manifests_export_ready" ? [] : [`export status was ${exporterSummary?.status ?? "missing"}`]),
    ...(downstreamValidationRun.exit_code === 0 ? [] : [`downstream manifest validation exited ${downstreamValidationRun.exit_code}`]),
    ...(decodeDryRun.exit_code === 0 ? [] : [`decode dry-run exited ${decodeDryRun.exit_code}`]),
    ...manifestCountFailures,
  ];
  return {
    schema_version: schemaVersion,
    status: failures.length === 0 ? "passed" : "failed",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "run_rawframe_lesson_manifest_export_smoke.mjs")),
    },
    final_model_evidence: false,
    smoke_only: true,
    decision_boundary: {
      changes_real_store: false,
      changes_final_manifests: false,
      approves_source: false,
      final_model_evidence: false,
      proves_positive_exporter_path_with_fixture_only: true,
    },
    retained_outputs: {
      directory: projectRelative(retainedOutputDir),
      packet: fileReference(fixtures.packetPath),
      store: fileReference(fixtures.storePath),
      readiness: fileReference(fixtures.readinessPath),
      exporter_summary: fileReference(fixtures.exporterSummaryPath),
      manifest_dir: projectRelative(fixtures.manifestDir),
      manifest_files: manifestFiles,
      fixture_clip_files: fixtures.fixtureClipFiles.map((file) => fileReference(file)),
    },
    commands: {
      readiness: readinessRun,
      export: exportRun,
      downstream_manifest_validation: downstreamValidationRun,
      decode_dry_run: sanitizedDecodeDryRun(decodeDryRun),
    },
    readiness: readiness ? {
      status: readiness.status,
      expected_assignments: readiness.expected_assignments,
      observed_assignments: readiness.observed_assignments,
      blockers: readiness.blockers,
    } : null,
    manifest_export: exporterSummary?.manifest_export ?? null,
    failures,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = runSmoke();
  if (args.write) writeJson(args.output, report);
  console.log(JSON.stringify({
    status: report.status,
    wrote: args.write,
    output: projectRelative(args.output),
    retained_output_dir: report.retained_outputs.directory,
    manifest_counts: report.manifest_export?.counts ?? null,
    failures: report.failures,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame lesson manifest export smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
