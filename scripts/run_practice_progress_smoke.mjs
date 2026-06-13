import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "practice-progress-smoke.json");

function parseArgs(argv) {
  const args = {
    write: false,
    output: defaultOutputPath,
    keepTemp: false,
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
    if (item === "--keep-temp") {
      args.keepTemp = true;
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
  node scripts/run_practice_progress_smoke.mjs [--write] [--output docs/validation/practice-progress-smoke.json] [--keep-temp]

Starts an isolated Next.js server with a temporary store, then proves the
runtime account/practice/progress path: register, logout, login, reject a raw
camera payload, save a not_trained practice attempt, and verify persisted
progress/recent history.

The runner uses the production server from the current .next build so it can run
alongside an existing next dev session. Run npm --prefix web run build first
when using this script outside the completion-readiness audit.
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
    if (child.exitCode !== null) {
      throw new Error(`Next server exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(appUrl, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Retry until the dev server is reachable.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

function setCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
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

function assert(condition, message, blockers) {
  if (!condition) blockers.push(message);
}

function addCheck(checks, id, label, passed, evidence, blocker) {
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    evidence,
    blockers: passed ? [] : [blocker ?? `${label} failed`],
  });
}

async function runSmoke(appUrl) {
  const blockers = [];
  const checks = [];
  let cookie = "";
  const email = `practice-smoke-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = "practice-smoke-password";
  const accountEmailHash = crypto.createHash("sha256").update(email).digest("hex");
  const vocabularyId = "hello";

  const modelCard = await requestJson(appUrl, "GET", "/model/model-card.json", undefined, cookie);
  const modelCardPassed =
    modelCard.status === 200 &&
    modelCard.data?.model_id === "asl-pilot-rawframe-v0" &&
    modelCard.data?.status === "not_trained";
  addCheck(
    checks,
    "model_card_not_trained",
    "Runtime model-card is the fail-closed not_trained card",
    modelCardPassed,
    {
      status: modelCard.status,
      model_id: modelCard.data?.model_id ?? null,
      model_status: modelCard.data?.status ?? null,
    },
    "GET /model/model-card.json must return the active not_trained model card",
  );
  assert(modelCardPassed, "runtime model-card must be not_trained", blockers);

  const unauthenticatedProgress = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const unauthenticatedProgressPassed = unauthenticatedProgress.status === 401;
  addCheck(
    checks,
    "unauthenticated_progress_requires_login",
    "Progress API rejects unauthenticated requests",
    unauthenticatedProgressPassed,
    { status: unauthenticatedProgress.status },
    "GET /api/progress must require login",
  );
  assert(unauthenticatedProgressPassed, "GET /api/progress must require login", blockers);

  const register = await requestJson(appUrl, "POST", "/api/auth/register", {
    email,
    name: "Practice Smoke",
    password,
  }, cookie);
  cookie = register.cookie;
  const registerPassed = register.status === 200 && Boolean(cookie) && register.data?.user?.email === email;
  addCheck(
    checks,
    "register_creates_session",
    "Registration creates an account session",
    registerPassed,
    {
      status: register.status,
      account_email_sha256: accountEmailHash,
      has_cookie: Boolean(cookie),
      returned_email_matches: register.data?.user?.email === email,
    },
    "POST /api/auth/register must create an account and set a session cookie",
  );
  assert(registerPassed, "POST /api/auth/register must create an account and set a session cookie", blockers);

  const me = await requestJson(appUrl, "GET", "/api/me", undefined, cookie);
  const mePassed =
    me.status === 200 &&
    me.data?.user?.email === email &&
    typeof me.data?.user?.id === "string";
  addCheck(
    checks,
    "me_returns_registered_user",
    "Authenticated /api/me returns the registered user",
    mePassed,
    {
      status: me.status,
      account_email_sha256: accountEmailHash,
      returned_email_matches: me.data?.user?.email === email,
      has_user_id: typeof me.data?.user?.id === "string",
    },
    "GET /api/me must return the registered user for the session cookie",
  );
  assert(mePassed, "GET /api/me must return the registered user", blockers);

  const initialProgress = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const initialHello = initialProgress.data?.progress?.find((item) => item.vocabularyId === vocabularyId);
  const initialProgressPassed =
    initialProgress.status === 200 &&
    Array.isArray(initialProgress.data?.progress) &&
    initialProgress.data.progress.length >= 75 &&
    initialHello?.attempts === 0 &&
    initialHello?.passes === 0 &&
    initialHello?.fails === 0 &&
    initialHello?.status === "not_started";
  addCheck(
    checks,
    "initial_progress_empty",
    "New account starts with empty progress for the smoke vocabulary",
    initialProgressPassed,
    {
      status: initialProgress.status,
      progress_count: initialProgress.data?.progress?.length ?? null,
      vocabulary_id: vocabularyId,
      progress_item: initialHello ?? null,
    },
    "new account must start with zero attempts, passes, and fails for the smoke vocabulary",
  );
  assert(initialProgressPassed, "new account must start with empty progress for the smoke vocabulary", blockers);

  const rawPayloadAttempt = await requestJson(appUrl, "POST", "/api/attempts", {
    vocabularyId,
    passed: false,
    confidence: 0,
    predictedId: null,
    modelId: "privacy-smoke",
    modelStatus: "not_trained",
    hint: "privacy smoke",
    reason: "privacy smoke",
    frame: "data:image/png;base64,practice-progress-smoke",
  }, cookie);
  const rawPayloadRejected =
    rawPayloadAttempt.status === 400 &&
    /raw camera data/i.test(String(rawPayloadAttempt.data?.error ?? ""));
  addCheck(
    checks,
    "raw_payload_rejected",
    "Practice attempt route rejects raw camera payloads",
    rawPayloadRejected,
    {
      status: rawPayloadAttempt.status,
      error_mentions_raw_camera: /raw camera data/i.test(String(rawPayloadAttempt.data?.error ?? "")),
    },
    "POST /api/attempts must reject raw camera payloads before saving practice",
  );
  assert(rawPayloadRejected, "POST /api/attempts must reject raw camera payloads", blockers);

  const progressAfterRawRejection = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const rawRejectedHello = progressAfterRawRejection.data?.progress?.find((item) => item.vocabularyId === vocabularyId);
  const rawRejectionNoSavePassed =
    progressAfterRawRejection.status === 200 &&
    rawRejectedHello?.attempts === 0 &&
    rawRejectedHello?.passes === 0 &&
    rawRejectedHello?.fails === 0 &&
    Array.isArray(progressAfterRawRejection.data?.recentAttempts) &&
    progressAfterRawRejection.data.recentAttempts.length === 0;
  addCheck(
    checks,
    "raw_payload_rejection_does_not_save",
    "Rejected raw camera payload does not create progress",
    rawRejectionNoSavePassed,
    {
      status: progressAfterRawRejection.status,
      progress_item: rawRejectedHello ?? null,
      recent_attempts_count: progressAfterRawRejection.data?.recentAttempts?.length ?? null,
    },
    "raw camera payload rejection must not save an attempt or update progress",
  );
  assert(rawRejectionNoSavePassed, "raw payload rejection must not save progress", blockers);

  const attempt = await requestJson(appUrl, "POST", "/api/attempts", {
    vocabularyId,
    passed: true,
    confidence: 1,
    predictedId: vocabularyId,
    modelId: "client-claimed-model",
    modelStatus: "trained",
    hint: "client claimed pass",
    reason: "client claimed pass",
  }, cookie);
  const metadataAttemptPassed =
    attempt.status === 200 &&
    attempt.data?.attempt?.vocabularyId === vocabularyId &&
    attempt.data?.attempt?.passed === false &&
    attempt.data?.attempt?.modelId === "asl-pilot-rawframe-v0" &&
    attempt.data?.attempt?.modelStatus === "not_trained" &&
    /not_trained/i.test(String(attempt.data?.attempt?.reason ?? ""));
  addCheck(
    checks,
    "metadata_attempt_fail_closed",
    "Metadata-only spoofed pass is saved as fail-closed practice history",
    metadataAttemptPassed,
    {
      status: attempt.status,
      saved_attempt: attempt.data?.attempt ?? null,
    },
    "not_trained model policy must prevent a client-claimed pass and save active model-card metadata",
  );
  assert(metadataAttemptPassed, "not_trained model policy must prevent a client-claimed pass", blockers);
  const savedAttemptId = attempt.data?.attempt?.id;

  const progressAfterAttempt = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const progressedHello = progressAfterAttempt.data?.progress?.find((item) => item.vocabularyId === vocabularyId);
  const progressAfterAttemptPassed =
    progressAfterAttempt.status === 200 &&
    progressedHello?.attempts === 1 &&
    progressedHello?.fails === 1 &&
    progressedHello?.passes === 0 &&
    progressedHello?.status === "in_progress" &&
    progressAfterAttempt.data?.recentAttempts?.length === 1 &&
    progressAfterAttempt.data?.recentAttempts?.[0]?.id === savedAttemptId &&
    progressAfterAttempt.data?.recentAttempts?.[0]?.vocabularyId === vocabularyId &&
    progressAfterAttempt.data?.recentAttempts?.[0]?.passed === false;
  addCheck(
    checks,
    "progress_updates_after_attempt",
    "Saved attempt updates progress and recent history",
    progressAfterAttemptPassed,
    {
      status: progressAfterAttempt.status,
      saved_attempt_id: savedAttemptId ?? null,
      progress_item: progressedHello ?? null,
      recent_attempt: progressAfterAttempt.data?.recentAttempts?.[0] ?? null,
    },
    "progress must count the saved not_trained attempt as one fail with in_progress status",
  );
  assert(progressAfterAttemptPassed, "progress must update after the saved attempt", blockers);

  const logout = await requestJson(appUrl, "POST", "/api/auth/logout", {}, cookie);
  cookie = logout.cookie;
  const progressAfterLogout = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const logoutPassed = logout.status === 200 && progressAfterLogout.status === 401;
  addCheck(
    checks,
    "logout_blocks_progress",
    "Logout removes progress access for the session",
    logoutPassed,
    {
      logout_status: logout.status,
      progress_status_after_logout: progressAfterLogout.status,
      has_cookie_after_logout: Boolean(cookie),
    },
    "POST /api/auth/logout must succeed and subsequent progress requests must be unauthorized",
  );
  assert(logoutPassed, "logout must remove progress access", blockers);

  const login = await requestJson(appUrl, "POST", "/api/auth/login", { email, password }, cookie);
  cookie = login.cookie;

  const persistedProgress = await requestJson(appUrl, "GET", "/api/progress", undefined, cookie);
  const persistedHello = persistedProgress.data?.progress?.find((item) => item.vocabularyId === vocabularyId);
  const loginRestoresProgressPassed =
    login.status === 200 &&
    Boolean(cookie) &&
    persistedProgress.status === 200 &&
    persistedHello?.attempts === 1 &&
    persistedHello?.fails === 1 &&
    persistedHello?.passes === 0 &&
    persistedProgress.data?.recentAttempts?.[0]?.id === savedAttemptId &&
    persistedProgress.data?.recentAttempts?.[0]?.vocabularyId === vocabularyId &&
    persistedProgress.data?.recentAttempts?.[0]?.passed === false;
  addCheck(
    checks,
    "login_restores_persisted_progress",
    "Login restores the persisted learner progress record",
    loginRestoresProgressPassed,
    {
      login_status: login.status,
      has_cookie_after_login: Boolean(cookie),
      saved_attempt_id: savedAttemptId ?? null,
      progress_status_after_login: persistedProgress.status,
      progress_item: persistedHello ?? null,
      recent_attempt: persistedProgress.data?.recentAttempts?.[0] ?? null,
    },
    "progress and recent attempt history must persist across logout/login",
  );
  assert(loginRestoresProgressPassed, "progress must persist across logout/login", blockers);

  const datasetClipRoute = await requestJson(appUrl, "POST", "/api/dataset/clips", {}, cookie);
  const datasetCoverageRoute = await requestJson(appUrl, "GET", "/api/dataset/coverage", undefined, cookie);
  const datasetDisabledPassed = datasetClipRoute.status === 403 && datasetCoverageRoute.status === 403;
  addCheck(
    checks,
    "dataset_collection_default_disabled",
    "Dataset collection routes remain disabled in normal practice env",
    datasetDisabledPassed,
    {
      dataset_clip_post_status: datasetClipRoute.status,
      dataset_coverage_get_status: datasetCoverageRoute.status,
    },
    "dataset collection routes must return 403 unless explicit collection env vars are enabled",
  );
  assert(datasetDisabledPassed, "dataset collection routes must be disabled by default", blockers);

  return {
    schema_version: "asl-pilot-practice-progress-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    tested_at: new Date().toISOString(),
    app_url: appUrl,
    account_email_sha256: accountEmailHash,
    checks,
    source_files: [
      "web/src/lib/server-store.ts",
      "web/src/app/api/auth/register/route.ts",
      "web/src/app/api/auth/login/route.ts",
      "web/src/app/api/auth/logout/route.ts",
      "web/src/app/api/me/route.ts",
      "web/src/app/api/attempts/route.ts",
      "web/src/app/api/progress/route.ts",
      "web/src/app/api/dataset/clips/route.ts",
      "web/src/app/api/dataset/coverage/route.ts",
      "web/src/components/PracticeApp.tsx",
      "web/public/model/model-card.json",
    ].map((relativePath) => ({
      path: relativePath,
      sha256: sha256File(path.join(root, relativePath)),
    })),
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveProjectPath(args.output, "--output");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-practice-smoke-"));
  const storePath = path.join(tempDir, "store.json");
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the practice progress smoke");
  }
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(root, "web"),
    env: {
      ...process.env,
      ASL_PILOT_AUTH_PROVIDER: "local",
      ASL_PILOT_STORE_PATH: storePath,
      ENABLE_DATASET_COLLECTION: "false",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let storeExistedAfterSmoke = false;
  let tempRemovedAfterRun = false;
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  let report;
  try {
    await waitForApp(appUrl, child);
    report = await runSmoke(appUrl);
  } catch (error) {
    report = {
      schema_version: "asl-pilot-practice-progress-smoke/v1",
      status: "failed",
      tested_at: new Date().toISOString(),
      app_url: appUrl,
      checks: [],
      source_files: [],
      blockers: [error instanceof Error ? error.message : String(error)],
    };
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(resolve, 2_000);
    });
    storeExistedAfterSmoke = fs.existsSync(storePath);
    if (!args.keepTemp) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempRemovedAfterRun = !fs.existsSync(tempDir);
    }
  }

  const flattenedCheckBlockers = Array.isArray(report.checks)
    ? report.checks.flatMap((check) => check.blockers ?? [])
    : [];
  report.blockers = [
    ...(Array.isArray(report.blockers) ? report.blockers : []),
    ...flattenedCheckBlockers,
  ];
  report.commands = [
    "node scripts/run_practice_progress_smoke.mjs --write",
    `ASL_PILOT_AUTH_PROVIDER=local ASL_PILOT_STORE_PATH=${storePath} ENABLE_DATASET_COLLECTION=false NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false npm --prefix web run start -- --hostname 127.0.0.1 --port ${port}`,
    `GET ${appUrl}`,
    `GET ${new URL("/model/model-card.json", appUrl).toString()}`,
    `POST ${new URL("/api/auth/register", appUrl).toString()}`,
    `GET ${new URL("/api/me", appUrl).toString()}`,
    `GET ${new URL("/api/progress", appUrl).toString()}`,
    `POST ${new URL("/api/attempts", appUrl).toString()} with raw frame payload`,
    `POST ${new URL("/api/attempts", appUrl).toString()} with metadata-only spoofed pass`,
    `POST ${new URL("/api/auth/logout", appUrl).toString()}`,
    `POST ${new URL("/api/auth/login", appUrl).toString()}`,
    `POST ${new URL("/api/attempts", appUrl).toString()} with packaged Stage A smoke pass metadata`,
    `POST ${new URL("/api/dataset/clips", appUrl).toString()}`,
    `GET ${new URL("/api/dataset/coverage", appUrl).toString()}`,
  ];
  report.server = {
    mode: "next_start",
    build_id_sha256: sha256File(buildIdPath),
    command: `ASL_PILOT_AUTH_PROVIDER=local ASL_PILOT_STORE_PATH=${storePath} ENABLE_DATASET_COLLECTION=false NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false npm --prefix web run start -- --hostname 127.0.0.1 --port ${port}`,
    isolated_store: {
      env_var: "ASL_PILOT_STORE_PATH",
      path: storePath,
      existed_after_smoke: storeExistedAfterSmoke,
      removed_after_run: args.keepTemp ? false : tempRemovedAfterRun,
    },
    stdout_tail: stdout.trim().split(/\r?\n/).slice(-20),
    stderr_tail: stderr.trim().split(/\r?\n/).slice(-20),
  };
  report.evidence_notes = "Runtime smoke uses an isolated temporary store and proves account creation/login, progress persistence, unsupported-label fail-closed not_trained attempts, packaged Stage A smoke-pass persistence, and live raw-camera-payload rejection.";

  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(outputPath) : null,
    app_url: appUrl,
    blockers: report.blockers,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Practice progress smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
