import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultManifestPath = path.join(root, "data", "manifests", "negative-challenge.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultOutputPath = path.join(root, "docs", "validation", "final-negative-challenge-gap-packet.json");
const schemaVersion = "asl-pilot-final-negative-challenge-gap-packet/v1";
const minClipsPerRequiredType = 5;

function parseArgs(argv) {
  const args = {
    manifest: defaultManifestPath,
    collectionPlan: defaultCollectionPlanPath,
    output: defaultOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--manifest") {
      args.manifest = resolveProjectPath(readValue(argv, ++index, item), item);
    } else if (item === "--collection-plan") {
      args.collectionPlan = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/export_final_negative_challenge_gap_packet.mjs [--write]

Builds a non-final operator packet for the hard-negative categories still
missing from data/manifests/negative-challenge.json. It reads the current final
negative-challenge manifest and current first-party collection plan, then emits
the exact negative_challenge assignments needed to satisfy the strict per-type
coverage gate. It does not create clips, approve sources, or change manifests.
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

function fileReference(file) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
  };
}

function countByType(rows, key = "challenge_type") {
  const counts = {};
  for (const row of rows ?? []) {
    const type = row?.[key];
    if (typeof type === "string" && type.trim()) {
      counts[type] = (counts[type] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function collectionAssignmentKey(index) {
  return `negative_challenge:${index}`;
}

function selectedAssignments(collectionPlan, missingCountsByType) {
  const selected = [];
  const usedByType = {};
  for (const [index, assignment] of (collectionPlan.negative_challenge_assignments ?? []).entries()) {
    const type = assignment.challenge_type;
    const deficit = missingCountsByType[type] ?? 0;
    if (deficit <= 0) continue;
    const used = usedByType[type] ?? 0;
    if (used >= deficit) continue;
    usedByType[type] = used + 1;
    selected.push({
      assignment_key: collectionAssignmentKey(index),
      split: assignment.split,
      signer_alias: assignment.signer_alias,
      challenge_type: assignment.challenge_type,
      expected_outcome: assignment.expected_outcome,
      capture_count_for_type: assignment.capture_count_for_type,
      operator_action: "record_first_party_reject_only_clip",
      required_review_before_manifest: [
        "consent record exists",
        "raw browser video path and sha256 are retained",
        "challenge type is visually confirmed",
        "expected reject outcome is operator-confirmed",
        "clip is approved by negative-challenge review",
      ],
    });
  }
  return selected;
}

function buildPacket(args) {
  const manifest = readJson(args.manifest);
  const collectionPlan = readJson(args.collectionPlan);
  if (manifest.schema_version !== "asl-pilot-negative-challenge-manifest/v1") {
    throw new Error("negative challenge manifest schema_version is invalid");
  }
  if (collectionPlan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    throw new Error("collection plan schema_version is invalid");
  }

  const currentCountsByType = countByType(manifest.clips ?? []);
  const collectionCountsByType = countByType(collectionPlan.negative_challenge_assignments ?? []);
  const requiredTypes = Object.keys(collectionCountsByType).sort();
  const requiredCountsByType = Object.fromEntries(
    requiredTypes.map((type) => [type, Math.max(minClipsPerRequiredType, collectionCountsByType[type] ?? 0)]),
  );
  const missingCountsByType = Object.fromEntries(
    requiredTypes
      .map((type) => [type, Math.max(0, requiredCountsByType[type] - (currentCountsByType[type] ?? 0))])
      .filter(([, count]) => count > 0),
  );
  const missingAssignmentRows = selectedAssignments(collectionPlan, missingCountsByType);
  const missingAssignmentCountsByType = countByType(missingAssignmentRows);
  const blockers = [];
  for (const [type, missingCount] of Object.entries(missingCountsByType)) {
    if ((missingAssignmentCountsByType[type] ?? 0) < missingCount) {
      blockers.push(`collection plan lacks enough assignments for ${type}; need ${missingCount}, found ${missingAssignmentCountsByType[type] ?? 0}`);
    }
  }
  if (collectionPlan.store?.exists !== true) {
    blockers.push("data/asl-pilot-store.json is absent; the gap packet is capture guidance only");
  }

  return {
    schema_version: schemaVersion,
    status: Object.keys(missingCountsByType).length === 0
      ? "final_negative_challenge_coverage_ready"
      : "blocked_final_negative_challenge_collection_gap",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_final_negative_challenge_gap_packet.mjs")),
    },
    inputs: {
      negative_challenge_manifest: fileReference(args.manifest),
      collection_plan: fileReference(args.collectionPlan),
    },
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      approves_clip_review: false,
      final_model_evidence: false,
    },
    coverage_target: {
      min_clips_per_required_type: minClipsPerRequiredType,
      required_type_count: requiredTypes.length,
      required_types: requiredTypes,
    },
    current_manifest: {
      clip_count: Array.isArray(manifest.clips) ? manifest.clips.length : 0,
      counts_by_type: currentCountsByType,
      tensor_references_present: (manifest.clips ?? []).filter((clip) => (
        typeof clip?.relative_frame_tensor_path === "string" &&
        typeof clip?.frame_tensor_sha256 === "string" &&
        typeof clip?.frame_tensor_provenance === "object"
      )).length,
    },
    required_counts_by_type: requiredCountsByType,
    missing_counts_by_type: missingCountsByType,
    missing_type_count: Object.keys(missingCountsByType).length,
    missing_clip_count: Object.values(missingCountsByType).reduce((sum, count) => sum + count, 0),
    selected_assignment_count: missingAssignmentRows.length,
    selected_assignment_counts_by_type: missingAssignmentCountsByType,
    selected_assignments: missingAssignmentRows,
    collection_store: {
      path: collectionPlan.store?.path ?? "data/asl-pilot-store.json",
      exists: collectionPlan.store?.exists === true,
      counted_negative_challenge_clips: collectionPlan.store?.counted_negative_challenge_clips ?? null,
    },
    blockers,
    required_next_commands: [
      "node scripts/process_collected_dataset_evidence.mjs --apply",
      "node scripts/export_dataset_manifests.mjs --write",
      "PYTHONPATH=scripts ./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/negative-challenge.json",
      "python3 scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json",
      "node scripts/audit_completion_readiness.mjs --summary-only",
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const packet = buildPacket(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: packet.status,
    wrote: args.write,
    output: projectRelative(args.output),
    missing_type_count: packet.missing_type_count,
    missing_clip_count: packet.missing_clip_count,
    selected_assignment_count: packet.selected_assignment_count,
    blockers: packet.blockers,
  }, null, 2));
  return packet.status === "final_negative_challenge_coverage_ready" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final negative challenge gap packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
