import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "validation", "rawframe-lesson-collection-packet.json");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const defaultOutputPath = path.join(root, "docs", "validation", "rawframe-lesson-collection-readiness.json");
const schemaVersion = "asl-pilot-rawframe-lesson-collection-readiness/v1";
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
    store: defaultStorePath,
    output: defaultOutputPath,
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
    } else if (item === "--store") {
      args.store = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/audit_rawframe_lesson_collection_readiness.mjs
  node scripts/audit_rawframe_lesson_collection_readiness.mjs --write

Audits current first-party store coverage against the raw-frame 25-sign lesson
collection packet. The audit is fail-closed: it reports exact missing
assignment keys and does not create clips, approve clips, export manifests, or
serve as model evidence.
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
      users: [],
      sessions: [],
      attempts: [],
      datasetSigners: [],
      consentRecords: [],
      datasetClips: [],
      datasetChallengeClips: [],
    };
  }
  const raw = readJson(file);
  return {
    exists: true,
    users: Array.isArray(raw.users) ? raw.users : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    attempts: Array.isArray(raw.attempts) ? raw.attempts : [],
    datasetSigners: Array.isArray(raw.datasetSigners) ? raw.datasetSigners : [],
    consentRecords: Array.isArray(raw.consentRecords) ? raw.consentRecords : [],
    datasetClips: Array.isArray(raw.datasetClips) ? raw.datasetClips : [],
    datasetChallengeClips: Array.isArray(raw.datasetChallengeClips) ? raw.datasetChallengeClips : [],
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

function validatePacket(packet) {
  const blockers = [];
  if (packet.schema_version !== "asl-pilot-rawframe-lesson-collection-packet/v1") {
    blockers.push("lesson collection packet schema_version is invalid");
  }
  if (packet.status !== "lesson_collection_packet_ready_not_training_data") {
    blockers.push(`lesson collection packet status must be lesson_collection_packet_ready_not_training_data; found ${packet.status ?? "missing"}`);
  }
  if (!Array.isArray(packet.queue) || packet.queue.length === 0) {
    blockers.push("lesson collection packet must include a non-empty queue");
  }
  if (!packet.packet_summary || typeof packet.packet_summary !== "object") {
    blockers.push("lesson collection packet must include packet_summary");
  }
  return blockers;
}

function consentById(store) {
  return new Map(store.consentRecords.map((record) => [record.id, record]));
}

function consentIsValid(consent) {
  return Boolean(consent) && requiredConsentFields.every((field) => consent[field] === true);
}

function summarizeExpected(queue) {
  const byRole = {};
  const bySplit = {};
  const byChallengeType = {};
  const byLabel = {};
  for (const row of queue) {
    byRole[row.lesson_role] = (byRole[row.lesson_role] ?? 0) + 1;
    bySplit[row.split] = (bySplit[row.split] ?? 0) + 1;
    if (row.challenge_type) byChallengeType[row.challenge_type] = (byChallengeType[row.challenge_type] ?? 0) + 1;
    if (row.label_id) byLabel[row.label_id] = (byLabel[row.label_id] ?? 0) + 1;
  }
  return {
    total: queue.length,
    by_role: byRole,
    by_split: bySplit,
    by_challenge_type: byChallengeType,
    label_count: Object.keys(byLabel).length,
  };
}

function emptyObservedSummary() {
  return {
    consented_assignment_count: 0,
    approved_assignment_count: 0,
    consented_by_role: {},
    approved_by_role: {},
    consented_by_split: {},
    approved_by_split: {},
    consented_by_challenge_type: {},
    approved_by_challenge_type: {},
    pending_review_assignment_count: 0,
    rejected_assignment_count: 0,
    unexpected_assignment_count: 0,
  };
}

function increment(object, key) {
  object[key] = (object[key] ?? 0) + 1;
}

function buildObservedSummary(packet, store) {
  const queueByKey = new Map(packet.queue.map((row) => [row.assignment_key, row]));
  const consent = consentById(store);
  const summary = emptyObservedSummary();
  const consentedKeys = new Set();
  const approvedKeys = new Set();
  const unexpectedKeys = new Set();

  for (const clip of store.datasetClips) {
    const row = queueByKey.get(clip.planAssignmentKey);
    if (!row) {
      unexpectedKeys.add(clip.planAssignmentKey ?? "(missing)");
      continue;
    }
    if (row.assignment_type !== "vocabulary_capture") {
      unexpectedKeys.add(clip.planAssignmentKey ?? "(missing)");
      continue;
    }
    const hasConsent = consentIsValid(consent.get(clip.consentRecordId));
    const approved = clip.labelReviewStatus === "approved";
    if (clip.labelReviewStatus === "rejected") summary.rejected_assignment_count += 1;
    if (clip.labelReviewStatus !== "approved" && clip.labelReviewStatus !== "rejected") {
      summary.pending_review_assignment_count += 1;
    }
    if (hasConsent) {
      consentedKeys.add(row.assignment_key);
      increment(summary.consented_by_role, row.lesson_role);
      increment(summary.consented_by_split, row.split);
    }
    if (hasConsent && approved) {
      approvedKeys.add(row.assignment_key);
      increment(summary.approved_by_role, row.lesson_role);
      increment(summary.approved_by_split, row.split);
    }
  }

  for (const clip of store.datasetChallengeClips) {
    const row = queueByKey.get(clip.planAssignmentKey);
    if (!row) {
      unexpectedKeys.add(clip.planAssignmentKey ?? "(missing)");
      continue;
    }
    if (row.assignment_type !== "negative_challenge_capture") {
      unexpectedKeys.add(clip.planAssignmentKey ?? "(missing)");
      continue;
    }
    const hasConsent = consentIsValid(consent.get(clip.consentRecordId));
    const approved = clip.challengeReviewStatus === "approved";
    if (clip.challengeReviewStatus === "rejected") summary.rejected_assignment_count += 1;
    if (clip.challengeReviewStatus !== "approved" && clip.challengeReviewStatus !== "rejected") {
      summary.pending_review_assignment_count += 1;
    }
    if (hasConsent) {
      consentedKeys.add(row.assignment_key);
      increment(summary.consented_by_role, row.lesson_role);
      increment(summary.consented_by_split, row.split);
      increment(summary.consented_by_challenge_type, row.challenge_type);
    }
    if (hasConsent && approved) {
      approvedKeys.add(row.assignment_key);
      increment(summary.approved_by_role, row.lesson_role);
      increment(summary.approved_by_split, row.split);
      increment(summary.approved_by_challenge_type, row.challenge_type);
    }
  }

  summary.consented_assignment_count = consentedKeys.size;
  summary.approved_assignment_count = approvedKeys.size;
  summary.unexpected_assignment_count = unexpectedKeys.size;
  return {
    summary,
    consentedKeys,
    approvedKeys,
    unexpectedKeys,
  };
}

function missingRows(packet, observedKeys) {
  return packet.queue
    .filter((row) => !observedKeys.has(row.assignment_key))
    .map((row) => ({
      assignment_key: row.assignment_key,
      lesson_queue_index: row.lesson_queue_index,
      lesson_role: row.lesson_role,
      assignment_type: row.assignment_type,
      split: row.split,
      signer_alias: row.signer_alias,
      label_id: row.label_id ?? null,
      challenge_type: row.challenge_type ?? null,
    }));
}

function buildReadiness(args) {
  const packet = readJson(args.packet);
  const packetBlockers = validatePacket(packet);
  const store = readStore(args.store);
  const blockers = [...packetBlockers];
  if (!store.exists) {
    blockers.push("data/asl-pilot-store.json is absent; no first-party browser-domain lesson clips have been collected");
  }
  const expected = summarizeExpected(Array.isArray(packet.queue) ? packet.queue : []);
  const observed = buildObservedSummary(packet, store);
  const missingConsented = missingRows(packet, observed.consentedKeys);
  const missingApproved = missingRows(packet, observed.approvedKeys);
  if (missingApproved.length > 0) {
    blockers.push(`${missingApproved.length} lesson packet assignment(s) still need approved first-party clips before lesson manifest export`);
  }
  const taxonomyGapCount = packet.packet_summary?.hard_negative_taxonomy_not_current_app_assignment_count ?? 0;
  if (taxonomyGapCount > 0) {
    blockers.push(`${taxonomyGapCount} hard-negative taxonomy item(s) are not current app assignment types`);
  }
  const status = blockers.length === 0
    ? "ready_for_lesson_manifest_export"
    : store.exists
      ? "blocked_incomplete_lesson_collection"
      : "blocked_missing_first_party_store";
  return {
    schema_version: schemaVersion,
    status,
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "audit_rawframe_lesson_collection_readiness.mjs")),
    },
    final_model_evidence: false,
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      final_model_evidence: false,
      readiness_audit_only: true,
    },
    inputs: {
      lesson_collection_packet: fileReference(args.packet),
      store: fileReference(args.store),
    },
    blockers,
    expected_assignments: expected,
    observed_assignments: observed.summary,
    missing_consent_assignment_count: missingConsented.length,
    missing_approved_assignment_count: missingApproved.length,
    missing_consent_assignments: missingConsented,
    missing_approved_assignments: missingApproved,
    unexpected_assignment_keys: [...observed.unexpectedKeys].sort(),
    hard_negative_taxonomy_gap: {
      taxonomy_count: packet.packet_summary?.hard_negative_taxonomy_count ?? null,
      not_current_app_assignment_count: taxonomyGapCount,
      rows: Array.isArray(packet.hard_negative_coverage)
        ? packet.hard_negative_coverage.filter((row) => row.status === "taxonomy_only_not_current_app_assignment")
        : [],
    },
    required_next_commands: [
      "node scripts/audit_clip_review.mjs",
      "node scripts/audit_challenge_review.mjs",
      "node scripts/audit_dataset_collection_readiness.mjs",
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const readiness = buildReadiness(args);
  if (args.write) writeJson(args.output, readiness);
  console.log(JSON.stringify({
    status: readiness.status,
    wrote: args.write,
    output: projectRelative(args.output),
    store_exists: readiness.inputs.store.exists,
    expected_assignments: readiness.expected_assignments.total,
    observed_approved_assignments: readiness.observed_assignments.approved_assignment_count,
    missing_approved_assignment_count: readiness.missing_approved_assignment_count,
    blockers: readiness.blockers,
  }, null, 2));
  return readiness.status === "ready_for_lesson_manifest_export" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Raw-frame lesson collection readiness audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
