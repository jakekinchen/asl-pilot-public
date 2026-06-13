import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "validation", "canonical-verifier-collection-packet.json");
const defaultOutputPath = path.join(root, "data", "dataset", "canonical-verifier-010-collection-queue.json");
const schemaVersion = "asl-pilot-rawframe-remediation-collection-queue/v1";

function parseArgs(argv) {
  const args = {
    packet: defaultPacketPath,
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
  node scripts/export_canonical_verifier_collection_queue.mjs
  node scripts/export_canonical_verifier_collection_queue.mjs --write

Exports the canonical verifier collection packet as a collection-plan ordering
queue that the dataset collection UI can load directly. This is an operator aid
only and does not create clips, approve reviews, export manifests, train
weights, or promote browser behavior.
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
    sha256: sha256File(file),
  };
}

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing JSON file: ${projectRelative(file)}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function vocabularyRows(packet) {
  return (packet.vocabulary_queue ?? []).map((row) => ({
    assignment_type: "vocabulary_capture",
    assignment_key: row.assignment_key,
    priority_bucket: "canonical_verifier_vocabulary",
    priority_score: Math.max(0, 1000 - Number(row.canonical_queue_index ?? row.canonical_rank ?? 0)),
    label_id: row.label_id,
    display_text: row.display_text,
    split: row.split,
    signer_alias: row.signer_alias,
    capture_count_for_label_split: row.capture_count,
    signals: ["canonical_verifier_selected_label", `canonical_rank_${row.canonical_rank}`],
    observed_recall: null,
    operator_action: row.operator_action ?? "record_first_party_raw_video_clip",
  }));
}

function hardNegativeRows(packet) {
  return (packet.hard_negative_queue ?? []).map((row) => ({
    assignment_type: "negative_challenge_capture",
    assignment_key: row.assignment_key,
    priority_bucket: "canonical_verifier_hard_negative",
    priority_score: Math.max(0, 500 - Number(row.hard_negative_queue_index ?? 0)),
    challenge_type: row.challenge_type,
    expected_outcome: row.expected_outcome,
    split: row.split,
    signer_alias: row.signer_alias,
    capture_count_for_type: row.capture_count,
    operator_action: row.operator_action ?? "record_first_party_reject_only_clip",
  }));
}

function summarize(rows) {
  const labels = new Set();
  const assignmentCountsBySplit = {};
  const assignmentCountsByBucket = {};
  for (const row of rows) {
    assignmentCountsBySplit[row.split] = (assignmentCountsBySplit[row.split] ?? 0) + 1;
    assignmentCountsByBucket[row.priority_bucket] = (assignmentCountsByBucket[row.priority_bucket] ?? 0) + 1;
    if (row.label_id) labels.add(row.label_id);
  }
  return {
    assignment_count: rows.length,
    vocabulary_assignment_count: rows.filter((row) => row.assignment_type === "vocabulary_capture").length,
    negative_challenge_assignment_count: rows.filter((row) => row.assignment_type === "negative_challenge_capture").length,
    label_count: labels.size,
    priority_label_count: labels.size,
    assignment_counts_by_split: assignmentCountsBySplit,
    assignment_counts_by_bucket: assignmentCountsByBucket,
  };
}

function buildQueue(args) {
  const packet = readJson(args.packet);
  if (packet.schema_version !== "asl-pilot-canonical-verifier-collection-packet/v1") {
    throw new Error("canonical collection packet schema_version is invalid");
  }
  if (packet.status !== "canonical_collection_packet_ready_not_training_data") {
    throw new Error(`canonical collection packet is not ready: ${packet.status ?? "missing"}`);
  }
  const rows = [...vocabularyRows(packet), ...hardNegativeRows(packet)]
    .map((row, index) => ({ queue_index: index + 1, ...row }));
  return {
    schema_version: schemaVersion,
    status: "queue_ready_not_training_data",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "export_canonical_verifier_collection_queue.mjs")),
    },
    inputs: {
      canonical_collection_packet: fileReference(args.packet),
      collection_plan: packet.inputs.collection_plan,
    },
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      final_model_evidence: false,
      capture_aid_only: true,
    },
    queue_summary: summarize(rows),
    queue: rows,
    blockers: [],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const queue = buildQueue(args);
  if (args.write) writeJson(args.output, queue);
  console.log(JSON.stringify({
    status: queue.status,
    wrote: args.write,
    output: projectRelative(args.output),
    assignment_count: queue.queue_summary.assignment_count,
    vocabulary_assignment_count: queue.queue_summary.vocabulary_assignment_count,
    negative_challenge_assignment_count: queue.queue_summary.negative_challenge_assignment_count,
    blockers: queue.blockers,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Canonical verifier collection queue export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
