import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "validation", "rawframe-lesson-collection-packet.json");
const defaultReadinessPath = path.join(root, "docs", "validation", "rawframe-lesson-collection-readiness.json");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const defaultOutputDir = path.join(root, "data", "manifests", "lesson", "rawframe-milestone");
const defaultSummaryOutputPath = path.join(root, "docs", "validation", "rawframe-lesson-first-party-manifest-export.json");
const schemaVersion = "asl-pilot-rawframe-lesson-first-party-manifest-export/v1";
const firstPartySourceId = "first-party-browser-consent-capture";
const requiredConsentFields = [
  "ageEligible",
  "allowModelTraining",
  "allowValidation",
  "allowPilotUse",
  "allowDerivedArtifactRetention",
  "allowDeidentifiedMetadataRetention",
  "retentionAcknowledged",
  "withdrawalAcknowledged",
];

function parseArgs(argv) {
  const args = {
    packet: defaultPacketPath,
    readiness: defaultReadinessPath,
    store: defaultStorePath,
    outputDir: defaultOutputDir,
    summaryOutput: defaultSummaryOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--packet") {
      args.packet = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--readiness") {
      args.readiness = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--store") {
      args.store = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--output-dir") {
      args.outputDir = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--summary-output") {
      args.summaryOutput = resolveProjectPath(readValue(argv, ++index, item), item);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_rawframe_lesson_first_party_manifests.mjs
  node scripts/export_rawframe_lesson_first_party_manifests.mjs --write

Exports lesson-scoped first-party raw-frame manifests only after
docs/validation/rawframe-lesson-collection-readiness.json reports
ready_for_lesson_manifest_export. Until then it writes a blocked summary and
does not create manifest files.
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

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing JSON file: ${projectRelative(file)}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readStore(file) {
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      datasetClips: [],
      datasetChallengeClips: [],
      consentRecords: [],
      datasetSigners: [],
    };
  }
  const data = readJson(file);
  return {
    exists: true,
    datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
    datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
    consentRecords: Array.isArray(data.consentRecords) ? data.consentRecords : [],
    datasetSigners: Array.isArray(data.datasetSigners) ? data.datasetSigners : [],
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function validateInputs(packet, readiness, store) {
  const blockers = [];
  if (packet.schema_version !== "asl-pilot-rawframe-lesson-collection-packet/v1") {
    blockers.push("lesson collection packet schema_version is invalid");
  }
  if (packet.status !== "lesson_collection_packet_ready_not_training_data") {
    blockers.push(`lesson collection packet status is not ready for capture: ${packet.status ?? "missing"}`);
  }
  if (!Array.isArray(packet.queue) || packet.queue.length === 0) {
    blockers.push("lesson collection packet queue is missing");
  }
  if (readiness.schema_version !== "asl-pilot-rawframe-lesson-collection-readiness/v1") {
    blockers.push("lesson collection readiness schema_version is invalid");
  }
  if (readiness.status !== "ready_for_lesson_manifest_export") {
    blockers.push(`lesson collection readiness is not export-ready: ${readiness.status ?? "missing"}`);
    for (const blocker of readiness.blockers ?? []) blockers.push(blocker);
  }
  if (!store.exists) {
    blockers.push("data/asl-pilot-store.json is absent; no first-party lesson manifests can be exported");
  }
  return [...new Set(blockers)];
}

function approvedClipByAssignment(store) {
  const vocabulary = new Map();
  for (const clip of store.datasetClips) {
    if (clip.labelReviewStatus === "approved") vocabulary.set(clip.planAssignmentKey, clip);
  }
  const challenge = new Map();
  for (const clip of store.datasetChallengeClips) {
    if (clip.challengeReviewStatus === "approved") challenge.set(clip.planAssignmentKey, clip);
  }
  return { vocabulary, challenge };
}

function consentById(store) {
  return new Map(store.consentRecords.map((record) => [record.id, record]));
}

function consentIsValid(consent) {
  return Boolean(consent) && requiredConsentFields.every((field) => consent[field] === true);
}

function validateMediaReference(clip, assignmentKey) {
  const blockers = [];
  if (typeof clip.relativeVideoPath !== "string" || !clip.relativeVideoPath) {
    blockers.push(`approved clip for ${assignmentKey} is missing relativeVideoPath`);
    return blockers;
  }
  const absolutePath = path.resolve(root, "data", clip.relativeVideoPath);
  const dataRoot = path.join(root, "data");
  if (absolutePath !== dataRoot && !absolutePath.startsWith(`${dataRoot}${path.sep}`)) {
    blockers.push(`approved clip for ${assignmentKey} has relativeVideoPath outside data/: ${clip.relativeVideoPath}`);
    return blockers;
  }
  if (!fs.existsSync(absolutePath)) {
    blockers.push(`approved clip media file is missing for ${assignmentKey}: data/${clip.relativeVideoPath}`);
    return blockers;
  }
  if (!clip.sha256) {
    blockers.push(`approved clip for ${assignmentKey} is missing sha256`);
    return blockers;
  }
  const actualSha256 = sha256File(absolutePath);
  if (actualSha256 !== clip.sha256) {
    blockers.push(`approved clip media sha256 mismatch for ${assignmentKey}: expected ${clip.sha256}, found ${actualSha256}`);
  }
  return blockers;
}

function validateApprovedClipIntegrity(clip, row, store, kind) {
  const blockers = [];
  const consent = consentById(store).get(clip.consentRecordId);
  if (!consentIsValid(consent)) {
    blockers.push(`approved ${kind} clip lacks valid consent for ${row.assignment_key}`);
  } else if (consent.signerAlias !== row.signer_alias) {
    blockers.push(`approved ${kind} clip consent signer does not match lesson row ${row.assignment_key}`);
  }
  blockers.push(...validateMediaReference(clip, row.assignment_key));
  if (kind === "challenge" && clip.captureConditionEvidence?.hardNegativeConditionConfirmed !== true) {
    blockers.push(`approved challenge clip does not confirm hard-negative condition for ${row.assignment_key}`);
  }
  return blockers;
}

function validateApprovedRows(packet, store) {
  const blockers = [];
  const approved = approvedClipByAssignment(store);
  for (const row of packet.queue ?? []) {
    if (row.assignment_type === "vocabulary_capture") {
      const clip = approved.vocabulary.get(row.assignment_key);
      if (!clip) {
        blockers.push(`missing approved vocabulary clip for ${row.assignment_key}`);
        continue;
      }
      if (clip.vocabularyId !== row.label_id || clip.signerAlias !== row.signer_alias) {
        blockers.push(`approved vocabulary clip does not match lesson row ${row.assignment_key}`);
      }
      blockers.push(...validateApprovedClipIntegrity(clip, row, store, "vocabulary"));
    } else if (row.assignment_type === "negative_challenge_capture") {
      const clip = approved.challenge.get(row.assignment_key);
      if (!clip) {
        blockers.push(`missing approved challenge clip for ${row.assignment_key}`);
        continue;
      }
      if (clip.challengeType !== row.challenge_type || clip.signerAlias !== row.signer_alias) {
        blockers.push(`approved challenge clip does not match lesson row ${row.assignment_key}`);
      }
      blockers.push(...validateApprovedClipIntegrity(clip, row, store, "challenge"));
    } else {
      blockers.push(`unknown lesson packet assignment_type for ${row.assignment_key}: ${row.assignment_type}`);
    }
  }
  return blockers;
}

function labelsFor(packet) {
  return (packet.labels ?? []).map((label) => ({
    label_id: label.label_id,
    display_text: label.display_text,
    lesson_role: label.lesson_role,
  }));
}

function manifestOutputFiles(outputDir) {
  return {
    train: path.join(outputDir, "train.json"),
    validation: path.join(outputDir, "validation.json"),
    test: path.join(outputDir, "test.json"),
    negativeChallenge: path.join(outputDir, "negative-challenge.json"),
  };
}

function relativeFromManifest(manifestPath, projectRelativeTarget) {
  return path.posix.relative(
    path.posix.dirname(projectRelative(manifestPath)),
    projectRelativeTarget,
  );
}

function sharedClipFields(clip, manifestPath, row, packet, kind) {
  return {
    clip_id: clip.id,
    source_id: firstPartySourceId,
    consent_record_id: clip.consentRecordId,
    signer_id: clip.signerAlias,
    collection_plan_assignment: {
      assignment_key: clip.planAssignmentKey,
      collection_plan_sha256: clip.collectionPlanSha256,
      assignment: clip.planAssignmentSnapshot,
    },
    lesson_packet_assignment: {
      lesson_queue_index: row.lesson_queue_index,
      assignment_key: row.assignment_key,
      lesson_role: row.lesson_role,
    },
    relative_video_path: relativeFromManifest(manifestPath, path.posix.join("data", clip.relativeVideoPath)),
    sha256: clip.sha256,
    split: row.split,
    frame_source: "raw_rgb_video",
    derived_features: [],
    capture: {
      browser: "browser-camera",
      device: "local computer camera",
      capture_condition_evidence: clip.captureConditionEvidence,
      media_stream_track_settings: clip.mediaStreamTrackSettings ?? {},
    },
    review: kind === "challenge"
      ? {
        reviewer: clip.challengeReviewer,
        challenge_review_status: clip.challengeReviewStatus,
        reviewed_at: clip.challengeReviewedAt,
      }
      : {
        label_reviewer: clip.labelReviewer,
        label_review_status: clip.labelReviewStatus,
        reviewed_at: clip.labelReviewedAt,
      },
    lesson_collection_packet: packet.inputs?.lesson_milestone ?? null,
  };
}

function rawFrameManifest(split, rows, clipsByKey, packet, packetReference, manifestPath) {
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-first-party-lesson-milestone-v0",
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party lesson collection",
    lesson_collection_packet: {
      path: packet.inputs?.lesson_milestone?.path ?? null,
      sha256: packet.inputs?.lesson_milestone?.sha256 ?? null,
      collection_packet_path: packetReference.path,
      collection_packet_sha256: packetReference.sha256,
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    labels: labelsFor(packet),
    clips: rows.map((row) => {
      const clip = clipsByKey.get(row.assignment_key);
      return {
        ...sharedClipFields(clip, manifestPath, row, packet, "vocabulary"),
        label_id: clip.vocabularyId,
        allowed_for_model_training: true,
        allowed_for_validation: split !== "train",
      };
    }),
  };
}

function negativeChallengeManifest(rows, clipsByKey, packet, packetReference, manifestPath) {
  return {
    schema_version: "asl-pilot-negative-challenge-manifest/v1",
    dataset_id: "asl-pilot-first-party-lesson-negative-challenge-v0",
    split: "negative_challenge",
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party lesson collection",
    lesson_collection_packet: {
      path: packet.inputs?.lesson_milestone?.path ?? null,
      sha256: packet.inputs?.lesson_milestone?.sha256 ?? null,
      collection_packet_path: packetReference.path,
      collection_packet_sha256: packetReference.sha256,
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    clips: rows.map((row) => {
      const clip = clipsByKey.get(row.assignment_key);
      return {
        ...sharedClipFields(clip, manifestPath, row, packet, "challenge"),
        allowed_for_validation: true,
        expected_outcome: "reject",
        challenge_type: clip.challengeType,
      };
    }),
  };
}

function exportManifests(args, packet, store) {
  const outputs = manifestOutputFiles(args.outputDir);
  const packetReference = fileReference(args.packet);
  const approved = approvedClipByAssignment(store);
  const vocabularyRows = packet.queue.filter((row) => row.assignment_type === "vocabulary_capture");
  const challengeRows = packet.queue.filter((row) => row.assignment_type === "negative_challenge_capture");
  const rowsBySplit = {
    train: vocabularyRows.filter((row) => row.split === "train"),
    validation: vocabularyRows.filter((row) => row.split === "validation"),
    test: vocabularyRows.filter((row) => row.split === "test"),
  };
  const manifests = {
    train: rawFrameManifest("train", rowsBySplit.train, approved.vocabulary, packet, packetReference, outputs.train),
    validation: rawFrameManifest("validation", rowsBySplit.validation, approved.vocabulary, packet, packetReference, outputs.validation),
    test: rawFrameManifest("test", rowsBySplit.test, approved.vocabulary, packet, packetReference, outputs.test),
    negativeChallenge: negativeChallengeManifest(challengeRows, approved.challenge, packet, packetReference, outputs.negativeChallenge),
  };
  fs.mkdirSync(args.outputDir, { recursive: true });
  writeJson(outputs.train, manifests.train);
  writeJson(outputs.validation, manifests.validation);
  writeJson(outputs.test, manifests.test);
  writeJson(outputs.negativeChallenge, manifests.negativeChallenge);
  return {
    output_dir: projectRelative(args.outputDir),
    files: Object.values(outputs).map((file) => fileReference(file)),
    counts: {
      train: manifests.train.clips.length,
      validation: manifests.validation.clips.length,
      test: manifests.test.clips.length,
      negative_challenge: manifests.negativeChallenge.clips.length,
    },
  };
}

function buildSummary(args) {
  const packet = readJson(args.packet);
  const readiness = readJson(args.readiness);
  const store = readStore(args.store);
  const blockers = validateInputs(packet, readiness, store);
  if (blockers.length === 0) blockers.push(...validateApprovedRows(packet, store));
  const status = blockers.length > 0
    ? "blocked_lesson_collection_not_export_ready"
    : "lesson_first_party_manifests_export_ready";
  let manifestExport = null;
  if (args.write && status === "lesson_first_party_manifests_export_ready") {
    manifestExport = exportManifests(args, packet, store);
  }
  return {
    schema_version: schemaVersion,
    status,
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_rawframe_lesson_first_party_manifests.mjs")),
    },
    final_model_evidence: false,
    decision_boundary: {
      changes_store: false,
      approves_source: false,
      final_model_evidence: false,
      writes_manifests_only_when_readiness_is_green: true,
    },
    inputs: {
      lesson_collection_packet: fileReference(args.packet),
      lesson_collection_readiness: fileReference(args.readiness),
      store: fileReference(args.store),
    },
    blockers,
    required_ready_status: "ready_for_lesson_manifest_export",
    expected_assignments: readiness.expected_assignments ?? packet.packet_summary ?? null,
    observed_assignments: readiness.observed_assignments ?? null,
    output_dir: projectRelative(args.outputDir),
    manifest_export: manifestExport,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const summary = buildSummary(args);
  if (args.write) writeJson(args.summaryOutput, summary);
  console.log(JSON.stringify({
    status: summary.status,
    wrote: args.write,
    summary_output: projectRelative(args.summaryOutput),
    output_dir: summary.output_dir,
    blockers: summary.blockers,
    manifest_export: summary.manifest_export,
  }, null, 2));
  return summary.status === "lesson_first_party_manifests_export_ready" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame lesson first-party manifest export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
