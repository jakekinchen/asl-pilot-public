import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const defaultOutputPath = path.join(root, "docs", "validation", "first-party-store-preflight.json");
const expectedStoreArrays = [
  "users",
  "sessions",
  "attempts",
  "datasetSigners",
  "consentRecords",
  "datasetClips",
  "datasetChallengeClips",
];

function parseArgs(argv) {
  const args = {
    store: defaultStorePath,
    output: defaultOutputPath,
    write: false,
  };
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
    if (item === "--store" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--store") args.store = resolveProjectPath(value, item);
      if (item === "--output") args.output = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_first_party_store_preflight.mjs [--write]

Reports whether the canonical first-party collection store path is ready for
explicit-consent browser capture. This script does not create data/asl-pilot-
store.json, collect clips, approve clips, export manifests, train weights, or
promote a model.
`);
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
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readStore(file) {
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      store: Object.fromEntries(expectedStoreArrays.map((key) => [key, []])),
      parse_error: null,
    };
  }
  try {
    const data = readJson(file);
    return {
      exists: true,
      store: Object.fromEntries(expectedStoreArrays.map((key) => [key, Array.isArray(data[key]) ? data[key] : []])),
      parse_error: null,
    };
  } catch (error) {
    return {
      exists: true,
      store: Object.fromEntries(expectedStoreArrays.map((key) => [key, []])),
      parse_error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sourceContains(file, patterns) {
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, "utf8");
  return patterns.every((pattern) => text.includes(pattern));
}

function gitignoreContains(relativePath) {
  const gitignore = path.join(root, ".gitignore");
  if (!fs.existsSync(gitignore)) return false;
  return fs.readFileSync(gitignore, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === relativePath);
}

function countApprovedClips(store) {
  const vocabulary = store.datasetClips.filter((clip) => clip?.labelReviewStatus === "approved").length;
  const negativeChallenge = store.datasetChallengeClips
    .filter((clip) => clip?.challengeReviewStatus === "approved")
    .length;
  return {
    vocabulary,
    negative_challenge: negativeChallenge,
    total: vocabulary + negativeChallenge,
  };
}

function buildReport(args) {
  const storePath = args.store;
  const serverStorePath = path.join(root, "web", "src", "lib", "server-store.ts");
  const gitignorePath = path.join(root, ".gitignore");
  const store = readStore(storePath);
  const canonicalStorePath = projectRelative(storePath) === "data/asl-pilot-store.json";
  const ignoredCanonicalStore = gitignoreContains("data/asl-pilot-store.json");
  const serverRuntimeInitializesEmptyStore = sourceContains(serverStorePath, [
    "const EMPTY_STORE",
    "await writeStore(EMPTY_STORE)",
    "data\", \"asl-pilot-store.json",
  ]);
  const counts = Object.fromEntries(expectedStoreArrays.map((key) => [key, store.store[key].length]));
  const approved = countApprovedClips(store.store);
  const hasCollectionEvidence = counts.datasetClips > 0 || counts.datasetChallengeClips > 0;
  const blockers = [];

  if (!canonicalStorePath) blockers.push("Store path is not the canonical data/asl-pilot-store.json path");
  if (!ignoredCanonicalStore) blockers.push("Canonical collection store is not listed in .gitignore");
  if (!serverRuntimeInitializesEmptyStore) {
    blockers.push("server-store.ts no longer proves empty-store initialization on missing file");
  }
  if (store.parse_error) blockers.push(`Collection store JSON could not be parsed: ${store.parse_error}`);
  if (!store.exists) {
    blockers.push("data/asl-pilot-store.json is absent; no first-party collection records exist yet");
  } else if (!hasCollectionEvidence) {
    blockers.push("data/asl-pilot-store.json exists but contains no first-party vocabulary or negative-challenge clips");
  } else if (approved.total === 0) {
    blockers.push("Collection store contains clips, but none are approved for manifest export");
  }

  const status = blockers.length === 0
    ? "collection_store_has_approved_clip_evidence"
    : store.exists
      ? "blocked_empty_or_unapproved_collection_store"
      : "store_absent_runtime_can_initialize_empty_schema";

  return {
    schema_version: "asl-pilot-first-party-store-preflight/v1",
    status,
    generated_at: new Date().toISOString(),
    decision_boundary: {
      creates_collection_store: false,
      creates_users_or_sessions: false,
      creates_or_modifies_clips: false,
      approves_clips: false,
      exports_manifests: false,
      trains_or_promotes_model: false,
    },
    runner: {
      command: [process.execPath, ...process.argv.slice(1)],
      script: fileReference(path.join(root, "scripts", "audit_first_party_store_preflight.mjs")),
    },
    inputs: {
      store: fileReference(storePath),
      gitignore: fileReference(gitignorePath),
      server_store: fileReference(serverStorePath),
    },
    runtime_contract: {
      canonical_store_path: "data/asl-pilot-store.json",
      canonical_store_path_checked: projectRelative(storePath),
      canonical_store_is_gitignored: ignoredCanonicalStore,
      server_runtime_initializes_empty_store_on_missing_file: serverRuntimeInitializesEmptyStore,
      empty_store_top_level_arrays: expectedStoreArrays,
    },
    collection_store_summary: {
      exists: store.exists,
      parse_error: store.parse_error,
      counts,
      approved_clip_counts: approved,
      has_any_clip_records: hasCollectionEvidence,
      has_approved_clip_evidence: approved.total > 0,
    },
    next_actions: [
      "Run the browser collection session against the focused remediation queue with explicit consent.",
      "Do not treat an absent or empty data/asl-pilot-store.json as training evidence.",
      "After real clips exist, rerun dataset, lesson, source-remediation, and post-collection readiness audits.",
    ],
    blockers,
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const report = buildReport(args);
  if (args.write) writeJson(args.output, report);
  console.log(JSON.stringify(report, null, 2));
  return report.status === "collection_store_has_approved_clip_evidence" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
