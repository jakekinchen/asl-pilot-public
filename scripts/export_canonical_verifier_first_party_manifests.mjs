import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "validation", "canonical-verifier-collection-packet.json");
const defaultReadinessPath = path.join(root, "docs", "validation", "canonical-verifier-collection-readiness.json");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const defaultOutputDir = path.join(root, "data", "manifests", "diagnostics", "canonical-verifier-010", "first-party");
const defaultSummaryOutputPath = path.join(root, "docs", "validation", "canonical-verifier-first-party-manifest-export.json");
const schemaVersion = "asl-pilot-canonical-verifier-first-party-manifest-export/v1";
const firstPartySourceId = "first-party-browser-consent-capture";

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
  node scripts/export_canonical_verifier_first_party_manifests.mjs
  node scripts/export_canonical_verifier_first_party_manifests.mjs --write

Exports focused first-party canonical-verifier manifests only after
docs/validation/canonical-verifier-collection-readiness.json reports
ready_for_canonical_verifier_manifest_export. Until then it writes a blocked
summary and does not create manifest files.
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

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing JSON file: ${projectRelative(file)}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readStore(file) {
  if (!fs.existsSync(file)) {
    return { exists: false, datasetClips: [], datasetChallengeClips: [] };
  }
  const data = readJson(file);
  return {
    exists: true,
    datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
    datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function relativeFromManifest(manifestPath, projectRelativeTarget) {
  return path.posix.relative(
    path.posix.dirname(projectRelative(manifestPath)),
    projectRelativeTarget,
  );
}

function manifestOutputFiles(outputDir) {
  return {
    train: path.join(outputDir, "train.json"),
    validation: path.join(outputDir, "validation.json"),
    test: path.join(outputDir, "test.json"),
    hardNegative: path.join(outputDir, "hard-negative.json"),
  };
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

function validateInputs(packet, readiness, store) {
  const blockers = [];
  if (packet.schema_version !== "asl-pilot-canonical-verifier-collection-packet/v1") {
    blockers.push("canonical collection packet schema_version is invalid");
  }
  if (readiness.schema_version !== "asl-pilot-canonical-verifier-collection-readiness/v1") {
    blockers.push("canonical collection readiness schema_version is invalid");
  }
  if (readiness.status !== "ready_for_canonical_verifier_manifest_export") {
    blockers.push(`canonical collection readiness is not export-ready: ${readiness.status ?? "missing"}`);
    for (const blocker of readiness.blocker_samples ?? []) blockers.push(blocker);
  }
  if (!store.exists) {
    blockers.push("data/asl-pilot-store.json is absent; no first-party canonical manifests can be exported");
  }
  return [...new Set(blockers)];
}

function sharedClipFields(clip, manifestPath, row, packet, packetReference, kind) {
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
    canonical_collection_packet_assignment: {
      assignment_key: row.assignment_key,
      assignment_type: row.assignment_type,
      canonical_rank: row.canonical_rank ?? null,
      queue_index: row.canonical_queue_index ?? row.hard_negative_queue_index ?? null,
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
    review: kind === "hard_negative"
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
    canonical_collection_packet: {
      path: packetReference.path,
      sha256: packetReference.sha256,
    },
  };
}

function rawFrameManifest(split, rows, clipsByKey, packet, packetReference, manifestPath) {
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-first-party-canonical-verifier-010-v0",
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party canonical verifier collection",
    canonical_verifier_collection_packet: {
      path: packetReference.path,
      sha256: packetReference.sha256,
      selected_labels: packet.selected_labels?.map((label) => label.label_id) ?? [],
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    labels: packet.selected_labels ?? [],
    clips: rows.map((row) => {
      const clip = clipsByKey.get(row.assignment_key);
      return {
        ...sharedClipFields(clip, manifestPath, row, packet, packetReference, "vocabulary"),
        label_id: clip.vocabularyId,
        allowed_for_model_training: split === "train",
        allowed_for_validation: split !== "train",
      };
    }),
  };
}

function hardNegativeManifest(rows, clipsByKey, packet, packetReference, manifestPath) {
  return {
    schema_version: "asl-pilot-negative-challenge-manifest/v1",
    dataset_id: "asl-pilot-first-party-canonical-verifier-010-hard-negative-v0",
    split: "negative_challenge",
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot local first-party canonical verifier collection",
    canonical_verifier_collection_packet: {
      path: packetReference.path,
      sha256: packetReference.sha256,
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    clips: rows.map((row) => {
      const clip = clipsByKey.get(row.assignment_key);
      return {
        ...sharedClipFields(clip, manifestPath, row, packet, packetReference, "hard_negative"),
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
  const rowsBySplit = {
    train: packet.vocabulary_queue.filter((row) => row.split === "train"),
    validation: packet.vocabulary_queue.filter((row) => row.split === "validation"),
    test: packet.vocabulary_queue.filter((row) => row.split === "test"),
  };
  const manifests = {
    train: rawFrameManifest("train", rowsBySplit.train, approved.vocabulary, packet, packetReference, outputs.train),
    validation: rawFrameManifest("validation", rowsBySplit.validation, approved.vocabulary, packet, packetReference, outputs.validation),
    test: rawFrameManifest("test", rowsBySplit.test, approved.vocabulary, packet, packetReference, outputs.test),
    hardNegative: hardNegativeManifest(packet.hard_negative_queue, approved.challenge, packet, packetReference, outputs.hardNegative),
  };
  fs.mkdirSync(args.outputDir, { recursive: true });
  writeJson(outputs.train, manifests.train);
  writeJson(outputs.validation, manifests.validation);
  writeJson(outputs.test, manifests.test);
  writeJson(outputs.hardNegative, manifests.hardNegative);
  return {
    output_dir: projectRelative(args.outputDir),
    files: Object.values(outputs).map((file) => fileReference(file)),
    counts: {
      train: manifests.train.clips.length,
      validation: manifests.validation.clips.length,
      test: manifests.test.clips.length,
      hard_negative: manifests.hardNegative.clips.length,
    },
  };
}

function buildSummary(args) {
  const packet = readJson(args.packet);
  const readiness = readJson(args.readiness);
  const store = readStore(args.store);
  const blockers = validateInputs(packet, readiness, store);
  const status = blockers.length > 0
    ? "blocked_canonical_collection_not_export_ready"
    : "canonical_first_party_manifests_export_ready";
  let manifestExport = null;
  if (args.write && status === "canonical_first_party_manifests_export_ready") {
    manifestExport = exportManifests(args, packet, store);
  }
  return {
    schema_version: schemaVersion,
    status,
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_canonical_verifier_first_party_manifests.mjs")),
    },
    final_model_evidence: false,
    decision_boundary: {
      changes_store: false,
      approves_source: false,
      final_model_evidence: false,
      writes_manifests_only_when_readiness_is_green: true,
      diagnostics_path_only: true,
    },
    inputs: {
      canonical_collection_packet: fileReference(args.packet),
      canonical_collection_readiness: fileReference(args.readiness),
      store: fileReference(args.store),
    },
    blockers,
    required_ready_status: "ready_for_canonical_verifier_manifest_export",
    expected_assignments: readiness.requirements ?? packet.packet_summary ?? null,
    observed_assignments: readiness.coverage ?? null,
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
    blocker_count: summary.blockers.length,
    blocker_samples: summary.blockers.slice(0, 10),
    manifest_export: summary.manifest_export,
  }, null, 2));
  return summary.status === "canonical_first_party_manifests_export_ready" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Canonical verifier first-party manifest export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
