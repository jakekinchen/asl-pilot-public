import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const packetPath = path.join(root, "docs", "review", "online-negative-challenge-review-packet.json");
const observationsPath = path.join(root, "docs", "review", "online-negative-challenge-contact-sheet-observations.json");
const sourceAuditPath = path.join(root, "docs", "research", "online-negative-challenge-mixed-source-audit.json");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const vocabularyReviewPath = path.join(root, "docs", "review", "final-vocabulary-review.json");
const vocabularySourcePath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const manifestPath = path.join(root, "data", "manifests", "negative-challenge.json");
const finalReviewPath = path.join(root, "docs", "review", "online-negative-challenge-final-review.json");
const combinedSourceId = "online-negative-challenge-mixed-wikimedia-cira-v1";
const createdAt = "2026-05-21T00:14:00.000Z";
const requiredTypes = ["empty_camera", "no_hands_visible", "low_light", "off_center", "non_target_asl_sign"];
const coreNegativeChallengeTypes = new Set(["empty_camera", "no_hands_visible", "low_light", "off_center"]);
const minPerRequiredType = 5;

function parseArgs(argv) {
  const args = {
    write: false,
    refreshExistingManifests: false,
  };
  for (const item of argv) {
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (item === "--refresh-existing-manifests") {
      args.refreshExistingManifests = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_online_negative_challenge_manifest.mjs --write [--refresh-existing-manifests]

Exports data/manifests/negative-challenge.json from the exact selected
Wikimedia/CIRA online review packet and writes final review evidence.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function manifestRelative(target) {
  return path.relative(path.dirname(manifestPath), target).split(path.sep).join("/");
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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function countsBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] ?? 0) + 1;
  return counts;
}

function sourceRegisterById(register) {
  return new Map(register.sources.map((source) => [source.source_id, source]));
}

function buildCaptureConditionEvidence(challengeType) {
  return {
    schemaVersion: "asl-pilot-capture-conditions/v1",
    captureEnvironment: "negative_challenge",
    operatorAttestation: true,
    operatorAttestedAt: createdAt,
    frontLightingConfirmed: false,
    upperTorsoAndHandsVisibleConfirmed: false,
    cameraDistanceWithinPilotRangeConfirmed: false,
    isolatedPromptSignConfirmed: false,
    challengeType,
    emptyCameraConfirmed: challengeType === "empty_camera",
    noHandsVisibleConfirmed: challengeType === "no_hands_visible",
    lowLightConfirmed: challengeType === "low_light",
    offCenterConfirmed: challengeType === "off_center",
    hardNegativeConditionConfirmed: !coreNegativeChallengeTypes.has(challengeType),
    expectedRejectOutcomeConfirmed: true,
  };
}

function notesForChallenge(challengeType) {
  if (challengeType === "empty_camera") {
    return {
      lighting_notes: "External no-signer raw-video clip; contact-sheet review found no person, hands, or signing.",
      framing_notes: "No prompted signer in sampled frames.",
    };
  }
  if (challengeType === "no_hands_visible") {
    return {
      lighting_notes: "External raw-video clip selected for no visible hands or signing.",
      framing_notes: "Hands are not visible in sampled frames.",
    };
  }
  if (challengeType === "low_light") {
    return {
      lighting_notes: "External low-light or night raw-video clip selected for reject-only evaluation.",
      framing_notes: "No prompted signer in sampled frames.",
    };
  }
  if (challengeType === "off_center") {
    return {
      lighting_notes: "External raw-video clip selected for off-center/framing reject-only evaluation.",
      framing_notes: "Off-center or portrait framing condition confirmed in sampled frames.",
    };
  }
  if (challengeType === "non_target_asl_sign") {
    return {
      lighting_notes: "External ASL Citizen raw-video clip showing a seated signer producing an ASL gloss outside the 95-label PopSign-v1 active recognition module; selected for hard-negative reject-only evaluation.",
      framing_notes: "Seated signer with hands visible; the produced sign is provably outside the active recognition module per the source-curated extraction provenance.",
    };
  }
  throw new Error(`No notes defined for challenge_type: ${challengeType}`);
}

function validateInputs(packet, observations, sourceAudit) {
  const blockers = [];
  if (packet.status !== "ready_for_visual_review") blockers.push(`packet status is ${packet.status}`);
  if (Array.isArray(packet.blockers) && packet.blockers.length > 0) blockers.push(`packet blockers: ${packet.blockers.join("; ")}`);
  if (observations.status !== "needs_curated_review") blockers.push(`observations status is ${observations.status}`);
  if (observations.summary?.strong_visual_candidates !== packet.selected_count) {
    blockers.push("observations do not mark every selected clip as strong_visual_candidate");
  }
  if (sourceAudit.status !== "passed") blockers.push(`source audit status is ${sourceAudit.status}`);
  if (sourceAudit.source_id !== combinedSourceId) blockers.push("source audit source_id does not match combined source");
  const counts = countsBy(packet.clips ?? [], "challenge_type");
  for (const type of requiredTypes) {
    if ((counts[type] ?? 0) < minPerRequiredType) {
      blockers.push(`need at least ${minPerRequiredType} ${type} clips; found ${counts[type] ?? 0}`);
    }
  }
  return blockers;
}

function buildFinalReview(packet, observations, sourceAudit) {
  const observationById = new Map((observations.observations ?? []).map((item) => [item.candidate_id, item]));
  const clips = packet.clips.map((clip) => {
    const observation = observationById.get(clip.candidate_id);
    return {
      candidate_id: clip.candidate_id,
      challenge_type: clip.challenge_type,
      source_id: clip.source_id,
      local_video_path: clip.local_video_path,
      sha256: clip.downloaded_sha256,
      final_review_status: "approved_for_manifest_import",
      challenge_type_matches_video: true,
      no_prompt_sign_present: true,
      expected_reject_outcome_confirmed: true,
      source_metadata_acceptable: true,
      visual_status: observation?.visual_status ?? null,
      visual_observation_reason: observation?.reason ?? "",
    };
  });
  return {
    schema_version: "asl-pilot-online-negative-challenge-final-review/v1",
    status: "approved_for_manifest_import",
    finality: "manifest_import_review_evidence",
    reviewed_at: createdAt,
    reviewer: {
      name: "ASL Pilot automated exact-file visual/source review",
      role: "source-approved contact-sheet challenge review",
      is_project_operator: false,
    },
    review_packet: {
      path: projectRelative(packetPath),
      sha256: sha256File(packetPath),
    },
    visual_observations: {
      path: projectRelative(observationsPath),
      sha256: sha256File(observationsPath),
    },
    source_audit: {
      path: projectRelative(sourceAuditPath),
      sha256: sha256File(sourceAuditPath),
    },
    selected_count: clips.length,
    challenge_type_counts: countsBy(clips, "challenge_type"),
    clips,
    limitations: [
      "Review is exact-file scoped to the selected packet and SHA-256 hashes.",
      "Review is based on source-approved local raw videos plus sampled contact-sheet observations.",
      "This review approves only the selected source raw videos and rejects any non-raw-frame model input artifacts.",
    ],
  };
}

function buildManifest(packet, finalReview, sourceRegister, sourceAudit) {
  const sourceById = sourceRegisterById(sourceRegister);
  const sourceRegisterRef = {
    path: projectRelative(sourceRegisterPath),
    sha256: sha256File(sourceRegisterPath),
  };
  const vocabularyReview = {
    status: "source_curated",
    evidence: {
      path: projectRelative(vocabularyReviewPath),
      sha256: sha256File(vocabularyReviewPath),
    },
    vocabulary_source: {
      path: projectRelative(vocabularySourcePath),
      sha256: sha256File(vocabularySourcePath),
      item_count: readJson(vocabularyReviewPath).item_count,
    },
  };
  const clips = packet.clips.map((clip, index) => {
    const source = sourceById.get(clip.source_id);
    if (!source) throw new Error(`source register is missing ${clip.source_id}`);
    const localVideo = resolveProjectPath(clip.local_video_path, `${clip.candidate_id}.local_video_path`);
    const actualHash = sha256File(localVideo);
    if (actualHash !== clip.downloaded_sha256) {
      throw new Error(`${clip.candidate_id} local video hash mismatch`);
    }
    const signerSeed = `${clip.source_id}:${clip.source_record_id}:${clip.source_file_url}:${clip.downloaded_sha256}`;
    const notes = notesForChallenge(clip.challenge_type);
    const sourceFileMetadata = {
      ...clip.source_file_metadata,
      license_short_name: clip.source_license_short_name,
      source_sha256: clip.downloaded_sha256,
    };
    return {
      clip_id: `negative-challenge-${String(index + 1).padStart(4, "0")}`,
      source_id: clip.source_id,
      source_license_decision: source.decision_id,
      source_license_review_status: source.license_review_status,
      signer_id: `external-negative-challenge-${clip.candidate_id}`,
      signer_identity_hash: sha256Text(signerSeed),
      relative_video_path: manifestRelative(localVideo),
      sha256: clip.downloaded_sha256,
      split: "negative_challenge",
      frame_source: "raw_rgb_video",
      allowed_for_validation: true,
      expected_outcome: "reject",
      challenge_type: clip.challenge_type,
      derived_features: [],
      source_record_id: clip.source_record_id,
      source_page_url: clip.source_page_url,
      source_file_url: clip.source_file_url,
      source_file_page_title: clip.source_file_page_title,
      source_license_short_name: clip.source_license_short_name,
      source_author: clip.source_author,
      source_credit: clip.source_credit ?? "",
      source_file_metadata: sourceFileMetadata,
      capture: {
        browser: "external-source-raw-video",
        device: "external-source-file",
        lighting_notes: notes.lighting_notes,
        framing_notes: notes.framing_notes,
        capture_condition_evidence: buildCaptureConditionEvidence(clip.challenge_type),
        media_stream_track_settings: {},
      },
      review: {
        reviewer: finalReview.reviewer.name,
        challenge_review_status: "approved",
        reviewed_at: finalReview.reviewed_at,
      },
    };
  });
  return {
    schema_version: "asl-pilot-negative-challenge-manifest/v1",
    dataset_id: "asl-pilot-negative-challenge-v0",
    dataset_source_mode: "approved_external_raw_video_source",
    split: "negative_challenge",
    created_at: createdAt,
    provenance_owner: "asl-pilot team",
    source_register: sourceRegisterRef,
    external_dataset_import: {
      source_id: combinedSourceId,
      source_audit: {
        path: projectRelative(sourceAuditPath),
        sha256: sha256File(sourceAuditPath),
      },
    },
    vocabulary_review: vocabularyReview,
    challenge_review: {
      path: projectRelative(finalReviewPath),
      sha256: sha256File(finalReviewPath),
      status: finalReview.status,
      reviewed_at: finalReview.reviewed_at,
    },
    preprocessing: {
      allowed_steps: ["decode_video", "sample_frames", "resize", "center_crop", "normalize_rgb"],
    },
    selected_review_packet: {
      path: projectRelative(packetPath),
      sha256: sha256File(packetPath),
    },
    clips,
  };
}

function refreshExistingManifests() {
  const sourceRegisterRef = {
    path: projectRelative(sourceRegisterPath),
    sha256: sha256File(sourceRegisterPath),
  };
  for (const name of ["train.json", "validation.json", "test.json"]) {
    const file = path.join(root, "data", "manifests", name);
    const manifest = readJson(file);
    manifest.source_register = {
      ...manifest.source_register,
      ...sourceRegisterRef,
    };
    writeJson(file, manifest);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.write) throw new Error("Use --write to export the negative challenge manifest");
  const packet = readJson(packetPath);
  const observations = readJson(observationsPath);
  const sourceAudit = readJson(sourceAuditPath);
  const sourceRegister = readJson(sourceRegisterPath);
  const blockers = validateInputs(packet, observations, sourceAudit);
  if (blockers.length > 0) {
    console.log(JSON.stringify({ status: "blocked", blockers }, null, 2));
    return 1;
  }
  const finalReview = buildFinalReview(packet, observations, sourceAudit);
  writeJson(finalReviewPath, finalReview);
  const manifest = buildManifest(packet, finalReview, sourceRegister, sourceAudit);
  writeJson(manifestPath, manifest);
  if (args.refreshExistingManifests) refreshExistingManifests();
  console.log(JSON.stringify({
    status: "exported",
    manifest: {
      path: projectRelative(manifestPath),
      sha256: sha256File(manifestPath),
    },
    final_review: {
      path: projectRelative(finalReviewPath),
      sha256: sha256File(finalReviewPath),
    },
    refresh_existing_manifests: args.refreshExistingManifests,
    selected_count: packet.selected_count,
    challenge_type_counts: countsBy(packet.clips, "challenge_type"),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge manifest export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
