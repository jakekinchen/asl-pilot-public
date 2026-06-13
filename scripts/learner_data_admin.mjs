import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const defaultAuditLogPath = path.join(root, "data", "privacy-audit-log.jsonl");
const defaultExportRoot = path.join(root, "data", "learner-exports");

function usage() {
  console.log(`Usage:
  node scripts/learner_data_admin.mjs export --email learner@example.com [--output data/learner-exports/file.json]
  node scripts/learner_data_admin.mjs delete --email learner@example.com --confirm-delete [--dry-run]

Options:
  --store <path>          Override the local JSON store path.
  --audit-log <path>      Override the privacy audit log path.
  --output <path>         Export output path for export action.
  --email <email>         Learner account email.
  --confirm-delete        Required for delete action unless --dry-run is used.
  --dry-run               Print what would be deleted without changing files.
  --help                  Show this help.
`);
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      result._.push(item);
      continue;
    }
    const key = item.slice(2);
    if (["confirm-delete", "dry-run", "help"].includes(key)) {
      result[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    result[key] = value;
    index += 1;
  }
  return result;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function emptyStore() {
  return {
    users: [],
    sessions: [],
    attempts: [],
    datasetSigners: [],
    consentRecords: [],
    datasetClips: [],
    datasetChallengeClips: [],
  };
}

function readStore(storePath) {
  if (!fs.existsSync(storePath)) return emptyStore();
  const data = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return {
    users: Array.isArray(data.users) ? data.users : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    attempts: Array.isArray(data.attempts) ? data.attempts : [],
    datasetSigners: Array.isArray(data.datasetSigners) ? data.datasetSigners : [],
    consentRecords: Array.isArray(data.consentRecords) ? data.consentRecords : [],
    datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
    datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
  };
}

function writeStore(storePath, store) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function findLearner(store, email) {
  return store.users.find((user) => normalizeEmail(user.email) === email) ?? null;
}

function learnerExport(store, user) {
  const attempts = store.attempts.filter((attempt) => attempt.userId === user.id);
  const datasetSigners = store.datasetSigners.filter((signer) => signer.userId === user.id);
  const consentRecords = store.consentRecords.filter((record) => record.userId === user.id);
  const datasetClips = store.datasetClips.filter((clip) => clip.userId === user.id);
  const datasetChallengeClips = store.datasetChallengeClips.filter((clip) => clip.userId === user.id);
  const sessions = store.sessions.filter((session) => session.userId === user.id);
  return {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    sessions: {
      count: sessions.length,
      createdAt: sessions.map((session) => session.createdAt).sort(),
    },
    attempts,
    datasetSigners,
    consentRecords,
    datasetClips,
    datasetChallengeClips,
  };
}

function safeExportPath(email) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const safeEmail = email.replace(/[^a-z0-9._-]/gi, "_");
  return path.join(defaultExportRoot, `${safeEmail}-${stamp}.json`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function appendAudit(auditLogPath, record) {
  fs.mkdirSync(path.dirname(auditLogPath), { recursive: true });
  fs.appendFileSync(auditLogPath, `${JSON.stringify(record)}\n`, "utf8");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function clipPath(relativeVideoPath) {
  return path.resolve(root, "data", relativeVideoPath);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const action = args._[0];
  if (!["export", "delete"].includes(action)) {
    usage();
    return 2;
  }
  const email = normalizeEmail(args.email);
  if (!email) throw new Error("--email is required");

  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const auditLogPath = args["audit-log"]
    ? resolveProjectPath(args["audit-log"], "--audit-log")
    : defaultAuditLogPath;
  const store = readStore(storePath);
  const user = findLearner(store, email);
  if (!user) {
    const result = { status: "not_found", action, email, store: path.relative(root, storePath) };
    console.log(JSON.stringify(result, null, 2));
    return 1;
  }

  if (action === "export") {
    const outputPath = args.output
      ? resolveProjectPath(args.output, "--output")
      : safeExportPath(email);
    const payload = learnerExport(store, user);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    const audit = {
      action,
      email,
      userId: user.id,
      createdAt: new Date().toISOString(),
      output: path.relative(root, outputPath),
      outputSha256: sha256File(outputPath),
      counts: {
        attempts: payload.attempts.length,
        datasetSigners: payload.datasetSigners.length,
        consentRecords: payload.consentRecords.length,
        datasetClips: payload.datasetClips.length,
        datasetChallengeClips: payload.datasetChallengeClips.length,
      },
    };
    appendAudit(auditLogPath, audit);
    console.log(JSON.stringify({ status: "exported", ...audit }, null, 2));
    return 0;
  }

  const exportPayload = learnerExport(store, user);
  const deletedClipPaths = [
    ...exportPayload.datasetClips,
    ...exportPayload.datasetChallengeClips,
  ].map((clip) => clipPath(clip.relativeVideoPath));
  const result = {
    status: args["dry-run"] ? "dry_run" : "deleted",
    action,
    email,
    userId: user.id,
    createdAt: new Date().toISOString(),
    counts: {
      users: 1,
      sessions: exportPayload.sessions.count,
      attempts: exportPayload.attempts.length,
      datasetSigners: exportPayload.datasetSigners.length,
      consentRecords: exportPayload.consentRecords.length,
      datasetClips: exportPayload.datasetClips.length,
      datasetChallengeClips: exportPayload.datasetChallengeClips.length,
      clipFiles: deletedClipPaths.length,
    },
    clipFiles: deletedClipPaths.map((file) => path.relative(root, file)),
  };

  if (!args["dry-run"] && !args["confirm-delete"]) {
    throw new Error("delete requires --confirm-delete. Use --dry-run to preview without changes.");
  }

  if (!args["dry-run"]) {
    const nextStore = {
      users: store.users.filter((candidate) => candidate.id !== user.id),
      sessions: store.sessions.filter((session) => session.userId !== user.id),
      attempts: store.attempts.filter((attempt) => attempt.userId !== user.id),
      datasetSigners: store.datasetSigners.filter((signer) => signer.userId !== user.id),
      consentRecords: store.consentRecords.filter((record) => record.userId !== user.id),
      datasetClips: store.datasetClips.filter((clip) => clip.userId !== user.id),
      datasetChallengeClips: store.datasetChallengeClips.filter((clip) => clip.userId !== user.id),
    };
    writeStore(storePath, nextStore);
    for (const file of deletedClipPaths) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    appendAudit(auditLogPath, result);
  }

  console.log(JSON.stringify(result, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Learner data admin failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
