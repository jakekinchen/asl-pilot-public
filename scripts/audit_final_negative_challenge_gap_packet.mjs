import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "validation", "final-negative-challenge-gap-packet.json");
const defaultManifestPath = path.join(root, "data", "manifests", "negative-challenge.json");
const defaultCollectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultOutputPath = path.join(root, "docs", "validation", "final-negative-challenge-gap-packet-audit.json");
const schemaVersion = "asl-pilot-final-negative-challenge-gap-packet-audit/v1";
const packetSchemaVersion = "asl-pilot-final-negative-challenge-gap-packet/v1";
const minClipsPerRequiredType = 5;

function parseArgs(argv) {
  const args = {
    packet: defaultPacketPath,
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
    } else if (item === "--packet") {
      args.packet = resolveProjectPath(readValue(argv, ++index, item), item);
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
  node scripts/audit_final_negative_challenge_gap_packet.mjs [--write]

Audits docs/validation/final-negative-challenge-gap-packet.json against the
current final negative-challenge manifest and collection plan. Passing means the
packet is accurate non-final capture guidance, not final model evidence.
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

function stableJson(value) {
  return JSON.stringify(canonical(value));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonical(nested)]),
  );
}

function expectedMissing(manifest, collectionPlan) {
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
  return { currentCountsByType, collectionCountsByType, requiredTypes, requiredCountsByType, missingCountsByType };
}

function addFinding(findings, code, detail) {
  findings.push({ code, detail });
}

function audit(args) {
  const packet = readJson(args.packet);
  const manifest = readJson(args.manifest);
  const collectionPlan = readJson(args.collectionPlan);
  const findings = [];

  if (packet.schema_version !== packetSchemaVersion) {
    addFinding(findings, "packet_schema_version", packet.schema_version ?? null);
  }
  if (packet.status !== "blocked_final_negative_challenge_collection_gap" && packet.status !== "final_negative_challenge_coverage_ready") {
    addFinding(findings, "packet_status", packet.status ?? null);
  }
  if (manifest.schema_version !== "asl-pilot-negative-challenge-manifest/v1") {
    addFinding(findings, "manifest_schema_version", manifest.schema_version ?? null);
  }
  if (collectionPlan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    addFinding(findings, "collection_plan_schema_version", collectionPlan.schema_version ?? null);
  }

  const expectedInputs = {
    negative_challenge_manifest: fileReference(args.manifest),
    collection_plan: fileReference(args.collectionPlan),
  };
  if (stableJson(packet.inputs?.negative_challenge_manifest ?? null) !== stableJson(expectedInputs.negative_challenge_manifest)) {
    addFinding(findings, "manifest_input_reference", {
      expected: expectedInputs.negative_challenge_manifest,
      actual: packet.inputs?.negative_challenge_manifest ?? null,
    });
  }
  if (stableJson(packet.inputs?.collection_plan ?? null) !== stableJson(expectedInputs.collection_plan)) {
    addFinding(findings, "collection_plan_input_reference", {
      expected: expectedInputs.collection_plan,
      actual: packet.inputs?.collection_plan ?? null,
    });
  }

  for (const [key, value] of Object.entries(packet.decision_boundary ?? {})) {
    if (value !== false) addFinding(findings, "decision_boundary_non_false", { key, value });
  }
  for (const key of ["changes_store", "changes_manifests", "approves_source", "approves_clip_review", "final_model_evidence"]) {
    if (packet.decision_boundary?.[key] !== false) {
      addFinding(findings, "decision_boundary_missing_or_true", { key, actual: packet.decision_boundary?.[key] ?? null });
    }
  }

  const expected = expectedMissing(manifest, collectionPlan);
  if (stableJson(packet.current_manifest?.counts_by_type ?? null) !== stableJson(expected.currentCountsByType)) {
    addFinding(findings, "current_counts_by_type", {
      expected: expected.currentCountsByType,
      actual: packet.current_manifest?.counts_by_type ?? null,
    });
  }
  if (stableJson(packet.required_counts_by_type ?? null) !== stableJson(expected.requiredCountsByType)) {
    addFinding(findings, "required_counts_by_type", {
      expected: expected.requiredCountsByType,
      actual: packet.required_counts_by_type ?? null,
    });
  }
  if (stableJson(packet.missing_counts_by_type ?? null) !== stableJson(expected.missingCountsByType)) {
    addFinding(findings, "missing_counts_by_type", {
      expected: expected.missingCountsByType,
      actual: packet.missing_counts_by_type ?? null,
    });
  }

  const expectedMissingClipCount = Object.values(expected.missingCountsByType).reduce((sum, count) => sum + count, 0);
  if (packet.missing_clip_count !== expectedMissingClipCount) {
    addFinding(findings, "missing_clip_count", {
      expected: expectedMissingClipCount,
      actual: packet.missing_clip_count ?? null,
    });
  }
  if (packet.missing_type_count !== Object.keys(expected.missingCountsByType).length) {
    addFinding(findings, "missing_type_count", {
      expected: Object.keys(expected.missingCountsByType).length,
      actual: packet.missing_type_count ?? null,
    });
  }

  const selectedAssignments = Array.isArray(packet.selected_assignments) ? packet.selected_assignments : [];
  const selectedCountsByType = countByType(selectedAssignments);
  if (stableJson(packet.selected_assignment_counts_by_type ?? null) !== stableJson(selectedCountsByType)) {
    addFinding(findings, "selected_assignment_counts_by_type", {
      expected: selectedCountsByType,
      actual: packet.selected_assignment_counts_by_type ?? null,
    });
  }
  if (packet.selected_assignment_count !== selectedAssignments.length) {
    addFinding(findings, "selected_assignment_count", {
      expected: selectedAssignments.length,
      actual: packet.selected_assignment_count ?? null,
    });
  }
  for (const [type, missingCount] of Object.entries(expected.missingCountsByType)) {
    if ((selectedCountsByType[type] ?? 0) < missingCount) {
      addFinding(findings, "selected_assignment_underfill", {
        challenge_type: type,
        expected: missingCount,
        actual: selectedCountsByType[type] ?? 0,
      });
    }
  }

  const assignmentKeys = new Set();
  for (const [index, row] of selectedAssignments.entries()) {
    const context = `selected_assignments[${index}]`;
    if (!/^negative_challenge:\d+$/.test(String(row.assignment_key ?? ""))) {
      addFinding(findings, "assignment_key", { context, assignment_key: row.assignment_key ?? null });
    }
    if (assignmentKeys.has(row.assignment_key)) {
      addFinding(findings, "duplicate_assignment_key", row.assignment_key);
    }
    assignmentKeys.add(row.assignment_key);
    if ((expected.missingCountsByType[row.challenge_type] ?? 0) <= 0) {
      addFinding(findings, "selected_assignment_not_missing_type", {
        context,
        challenge_type: row.challenge_type ?? null,
      });
    }
    if (row.expected_outcome !== "reject") {
      addFinding(findings, "expected_outcome", { context, expected_outcome: row.expected_outcome ?? null });
    }
    if (row.operator_action !== "record_first_party_reject_only_clip") {
      addFinding(findings, "operator_action", { context, operator_action: row.operator_action ?? null });
    }
  }

  const storePath = collectionPlan.store?.path ? path.join(root, collectionPlan.store.path) : path.join(root, "data", "asl-pilot-store.json");
  const storeExists = fs.existsSync(storePath);
  if (packet.collection_store?.exists !== storeExists) {
    addFinding(findings, "collection_store_exists", {
      expected: storeExists,
      actual: packet.collection_store?.exists ?? null,
    });
  }
  if (!storeExists && !(packet.blockers ?? []).some((item) => String(item).includes("data/asl-pilot-store.json is absent"))) {
    addFinding(findings, "missing_store_blocker", packet.blockers ?? []);
  }

  return {
    schema_version: schemaVersion,
    status: findings.length === 0 ? "passed_nonfinal_gap_packet_audit" : "failed",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "audit_final_negative_challenge_gap_packet.mjs")),
    },
    inputs: {
      packet: fileReference(args.packet),
      negative_challenge_manifest: expectedInputs.negative_challenge_manifest,
      collection_plan: expectedInputs.collection_plan,
    },
    decision_boundary: {
      changes_store: false,
      changes_manifests: false,
      approves_source: false,
      approves_clip_review: false,
      final_model_evidence: false,
    },
    expected_missing_counts_by_type: expected.missingCountsByType,
    expected_missing_clip_count: expectedMissingClipCount,
    selected_assignment_counts_by_type: selectedCountsByType,
    selected_assignment_count: selectedAssignments.length,
    collection_store: {
      path: projectRelative(storePath),
      exists: storeExists,
      counted_negative_challenge_clips: collectionPlan.store?.counted_negative_challenge_clips ?? null,
    },
    blockers: packet.blockers ?? [],
    findings,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = audit(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    wrote: args.write,
    output: projectRelative(args.output),
    expected_missing_clip_count: report.expected_missing_clip_count,
    selected_assignment_count: report.selected_assignment_count,
    findings: report.findings,
  }, null, 2));
  return report.status === "passed_nonfinal_gap_packet_audit" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final negative challenge gap packet audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
