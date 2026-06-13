import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "controlled-pilot-remediation-queue-api-smoke.json");
const liveOutputDir = path.join(root, "output", "controlled-pilot-remediation-queue-api-smoke-live");
const retainedOutputDir = path.join(root, "output", "controlled-pilot-remediation-queue-api-smoke");
const collectionPlanPath = path.join(root, "data", "dataset", "collection-plan.json");
const activeQueuePath = path.join(
  root,
  "data",
  "dataset",
  "canonical-verifier-010-collection-queue.json",
);

function parseArgs(argv) {
  const args = { write: false };
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
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/run_controlled_pilot_queue_api_smoke.mjs [--write] [--output docs/validation/controlled-pilot-remediation-queue-api-smoke.json]

Starts the built Next.js app in explicit dataset-collection mode with the real
default collection plan and active canonical verifier collection queue. It
creates only a temporary operator account under output/ and verifies
/api/dataset/plan returns the active queue that starts with the generated
Tier-1 hand-only assignment.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Unable to allocate a local port"));
      });
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApp(appUrl, child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (child.exitCode !== null) throw new Error(`Next server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(appUrl, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Retry until the production server is reachable.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

function setCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const value = response.headers.get("set-cookie");
  return value ? [value] : [];
}

function mergeCookies(currentCookie, response) {
  const cookies = new Map(
    currentCookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        return separator === -1 ? [item, ""] : [item.slice(0, separator), item.slice(separator + 1)];
      }),
  );
  for (const raw of setCookieHeader(response)) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (!value) cookies.delete(name);
    else cookies.set(name, value);
  }
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function requestJson(appUrl, method, route, body, cookie = "") {
  const response = await fetch(new URL(route, appUrl), {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw_text: text };
  }
  return {
    status: response.status,
    ok: response.ok,
    data,
    cookie: mergeCookies(cookie, response),
  };
}

function check(condition, blockers, message) {
  if (!condition) blockers.push(message);
}

function createTempPaths(outputDir) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  return {
    storePath: path.join(outputDir, "store.json"),
    clipRoot: path.join(outputDir, "clips"),
  };
}

async function runSmoke(appUrl) {
  const blockers = [];
  const expectedQueue = readJson(activeQueuePath);
  const expectedPlan = readJson(collectionPlanPath);
  const expectedFirst = expectedQueue.queue?.[0] ?? null;
  let cookie = "";

  const register = await requestJson(appUrl, "POST", "/api/auth/register", {
    email: `queue-api-smoke-${Date.now()}-${crypto.randomUUID()}@example.test`,
    name: "Queue API Smoke",
    password: "queue-api-smoke-password",
  }, cookie);
  cookie = register.cookie;
  check(register.status === 200 && Boolean(cookie), blockers, "registration must create an operator session");

  const planResponse = await requestJson(appUrl, "GET", "/api/dataset/plan", undefined, cookie);
  const plan = planResponse.data?.plan;
  const remediationQueue = planResponse.data?.remediationQueue;
  const firstReturned = remediationQueue?.queue?.[0] ?? null;
  const [firstKind, firstIndexText] = String(firstReturned?.assignment_key ?? "").split(":");
  const firstIndex = Number(firstIndexText);
  const firstPlanAssignment =
    firstKind === "vocabulary" && Number.isInteger(firstIndex)
      ? plan?.assignments?.[firstIndex]
      : null;

  check(planResponse.status === 200, blockers, "GET /api/dataset/plan must succeed for an authenticated operator");
  check(plan?.review_gate?.status === "source_curated", blockers, "real collection plan must use the source_curated review gate");
  check(plan?.assignments?.length === expectedPlan.assignments?.length, blockers, "API plan must expose the real default vocabulary assignments");
  check(
    plan?.negative_challenge_assignments?.length === expectedPlan.negative_challenge_assignments?.length,
    blockers,
    "API plan must expose the real default negative-challenge assignments",
  );
  check(remediationQueue?.status === "queue_ready_not_training_data", blockers, "remediation queue must be ready but non-final");
  check(
    remediationQueue?.queue_summary?.assignment_count === expectedQueue.queue_summary?.assignment_count,
    blockers,
    "remediation queue assignment count must match the active canonical queue",
  );
  check(
    remediationQueue?.queue_summary?.priority_label_count === expectedQueue.queue_summary?.priority_label_count,
    blockers,
    "remediation queue priority label count must match the active canonical queue",
  );
  check(
    firstReturned?.assignment_key === expectedFirst?.assignment_key &&
      firstReturned?.priority_bucket === expectedFirst?.priority_bucket &&
      firstReturned?.label_id === expectedFirst?.label_id,
    blockers,
    "first returned queue row must come from the active canonical queue",
  );
  check(
    firstReturned?.assignment_key === expectedFirst?.assignment_key &&
      firstReturned?.label_id === expectedFirst?.label_id &&
      firstReturned?.priority_bucket === "canonical_verifier_vocabulary",
    blockers,
    "canonical queue must start with the generated Tier-1 hand-only assignment",
  );
  check(
    firstPlanAssignment?.label_id === firstReturned?.label_id &&
      firstPlanAssignment?.signer_alias === firstReturned?.signer_alias &&
      firstPlanAssignment?.split === firstReturned?.split,
    blockers,
    "first queue row must reference a matching real collection-plan assignment",
  );

  return {
    status: blockers.length === 0 ? "passed" : "failed",
    blockers,
    checks: {
      register_status: register.status,
      plan_status: planResponse.status,
      plan_assignment_count: plan?.assignments?.length ?? null,
      plan_negative_challenge_assignment_count: plan?.negative_challenge_assignments?.length ?? null,
      queue_status: remediationQueue?.status ?? null,
      queue_assignment_count: remediationQueue?.queue_summary?.assignment_count ?? null,
      queue_priority_label_count: remediationQueue?.queue_summary?.priority_label_count ?? null,
      first_queue_assignment_key: firstReturned?.assignment_key ?? null,
      first_queue_label_id: firstReturned?.label_id ?? null,
      first_queue_priority_bucket: firstReturned?.priority_bucket ?? null,
      first_queue_matches_plan: firstPlanAssignment?.label_id === firstReturned?.label_id,
    },
    first_queue_row: firstReturned,
    first_plan_assignment: firstPlanAssignment,
  };
}

function buildReport({ appUrl, outputPath, paths, smoke, server }) {
  return {
    schema_version: "asl-pilot-controlled-pilot-remediation-queue-api-smoke/v1",
    status: smoke.status,
    evidence_mode: "operator_api_smoke",
    finality: "queue_ready_not_training_data",
    tested_at: new Date().toISOString(),
    runner: {
      tool: "node-fetch",
      app_url: appUrl,
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_controlled_pilot_queue_api_smoke.mjs"),
    },
    inputs: {
      collection_plan: fileReference("data/dataset/collection-plan.json"),
      active_collection_queue: fileReference("data/dataset/canonical-verifier-010-collection-queue.json"),
      model_card: fileReference("web/public/model/model-card.json"),
    },
    runtime_env: {
      ENABLE_DATASET_COLLECTION: "true",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "true",
      ASL_PILOT_STORE_PATH: projectRelative(paths.storePath),
      ASL_PILOT_DATASET_CLIP_ROOT: projectRelative(paths.clipRoot),
      ASL_PILOT_COLLECTION_PLAN_PATH: "unset: default real collection plan",
      ASL_PILOT_REMEDIATION_QUEUE_PATH: "unset: default active canonical queue candidate",
      ASL_PILOT_AUTH_PROVIDER: "local",
    },
    collection_api: {
      authenticated_plan_request: smoke.checks.plan_status === 200,
      loaded_real_collection_plan: smoke.checks.plan_assignment_count === readJson(collectionPlanPath).assignments?.length &&
        smoke.checks.plan_negative_challenge_assignment_count === readJson(collectionPlanPath).negative_challenge_assignments?.length,
      loaded_active_collection_queue: smoke.checks.first_queue_assignment_key === readJson(activeQueuePath).queue?.[0]?.assignment_key &&
        smoke.checks.first_queue_label_id === readJson(activeQueuePath).queue?.[0]?.label_id &&
        smoke.checks.queue_priority_label_count === 10,
      loaded_focused_remediation_queue: false,
      first_queue_row_matches_plan: smoke.checks.first_queue_matches_plan === true,
      checks: smoke.checks,
      first_queue_row: smoke.first_queue_row,
      first_plan_assignment: smoke.first_plan_assignment,
    },
    final_evidence_exclusion: {
      excluded_from_model_completion: true,
      reason: "This smoke verifies operator collection routing only. It does not collect clips, approve sources, export manifests, train weights, or promote a browser model.",
    },
    evidence: {
      source_files: [
        "scripts/run_controlled_pilot_queue_api_smoke.mjs",
        "web/src/app/api/dataset/plan/route.ts",
        "web/src/components/DatasetCollectionPanel.tsx",
        "scripts/audit_collection_plan_contract.mjs",
      ].map(fileReference),
    },
    server,
    output: outputPath ? projectRelative(outputPath) : null,
    blockers: smoke.blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output ? resolveProjectPath(args.output, "--output") : defaultOutputPath;
  const outputDir = args.write ? retainedOutputDir : liveOutputDir;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the queue API smoke");
  }
  const paths = createTempPaths(outputDir);
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(root, "web"),
    env: {
      ...process.env,
      ASL_PILOT_STORE_PATH: paths.storePath,
      ASL_PILOT_DATASET_CLIP_ROOT: paths.clipRoot,
      ASL_PILOT_AUTH_PROVIDER: "local",
      ENABLE_DATASET_COLLECTION: "true",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  let smoke;
  try {
    await waitForApp(appUrl, child);
    smoke = await runSmoke(appUrl);
  } catch (error) {
    smoke = {
      status: "failed",
      blockers: [error instanceof Error ? error.message : String(error)],
      checks: {},
      first_queue_row: null,
      first_plan_assignment: null,
    };
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(resolve, 2_000);
    });
  }

  const server = {
    mode: "next_start",
    build_id_sha256: sha256File(buildIdPath),
    stdout_tail: stdout.trim().split(/\r?\n/).slice(-20),
    stderr_tail: stderr.trim().split(/\r?\n/).slice(-20),
  };
  const report = buildReport({ appUrl, outputPath: args.write ? outputPath : null, paths, smoke, server });
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(outputPath) : null,
    app_url: appUrl,
    blockers: report.blockers,
    first_queue_assignment_key: report.collection_api.checks.first_queue_assignment_key,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Controlled-pilot queue API smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
