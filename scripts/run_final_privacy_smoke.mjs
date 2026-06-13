import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "privacy", "final-privacy-smoke.json");
const defaultAppUrl = "http://127.0.0.1:3025";
const blockedScriptHosts = [
  "google-analytics.com",
  "googletagmanager.com",
  "segment.com",
  "fullstory.com",
  "hotjar.com",
  "mixpanel.com",
  "amplitude.com",
  "posthog.com",
  "sentry.io",
  "datadoghq",
  "logrocket",
];

function parseArgs(argv) {
  const args = { appUrl: defaultAppUrl, write: false, autoStartServer: true, keepTemp: false };
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
    if (item === "--no-auto-server") {
      args.autoStartServer = false;
      continue;
    }
    if (item === "--keep-temp") {
      args.keepTemp = true;
      continue;
    }
    if (item === "--app-url") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.appUrl = value;
      index += 1;
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
  node scripts/run_final_privacy_smoke.mjs [--app-url http://127.0.0.1:3025] [--output docs/privacy/final-privacy-smoke.json] [--write]

Runs static and live HTTP privacy checks for the normal practice surface. It
does not use the explicit dataset collection mode. Without --write it prints
the report only; with --write it writes the final privacy smoke JSON. If the
configured local app URL is not reachable, the runner starts an isolated
production Next.js server from the current build and stops it after the smoke.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context, mustStayInRoot = true) {
  const resolved = path.resolve(root, value);
  if (mustStayInRoot && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      text: await response.text(),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function canAutoStartUrl(appUrl) {
  try {
    const url = new URL(appUrl);
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.port
    );
  } catch {
    return false;
  }
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
      // Retry until the production server is reachable.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

async function startIsolatedServer(appUrl, keepTemp) {
  const url = new URL(appUrl);
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the final privacy smoke");
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-final-privacy-smoke-"));
  const storePath = path.join(tempDir, "store.json");
  const child = spawn("npm", ["run", "start", "--", "--hostname", url.hostname, "--port", url.port], {
    cwd: path.join(root, "web"),
    env: {
      ...process.env,
      ASL_PILOT_STORE_PATH: storePath,
      ENABLE_DATASET_COLLECTION: "false",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  const server = {
    mode: "next_start_auto",
    command: `ASL_PILOT_STORE_PATH=${storePath} ENABLE_DATASET_COLLECTION=false NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false npm --prefix web run start -- --hostname ${url.hostname} --port ${url.port}`,
    build_id_sha256: sha256File(buildIdPath),
    isolated_store: {
      env_var: "ASL_PILOT_STORE_PATH",
      path: storePath,
      existed_after_smoke: false,
      removed_after_run: false,
    },
    stdout_tail: [],
    stderr_tail: [],
  };

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const cleanup = async () => {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(resolve, 2_000);
    });
    server.isolated_store.existed_after_smoke = fs.existsSync(storePath);
    if (!keepTemp) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      server.isolated_store.removed_after_run = !fs.existsSync(tempDir);
    }
    server.stdout_tail = stdout.trim().split(/\r?\n/).filter(Boolean).slice(-20);
    server.stderr_tail = stderr.trim().split(/\r?\n/).filter(Boolean).slice(-20);
  };

  try {
    await waitForApp(appUrl, child);
  } catch (error) {
    await cleanup();
    throw error;
  }

  return {
    server,
    cleanup,
  };
}

function inspectHtml(html) {
  const lowered = html.toLowerCase();
  const blockedHosts = blockedScriptHosts.filter((host) => lowered.includes(host));
  const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
  return {
    blocked_analytics_or_replay_hosts: blockedHosts,
    script_srcs: scriptSrcs,
    analytics_or_session_replay_observed: blockedHosts.length > 0,
  };
}

async function liveChecks(appUrl) {
  const rootPage = await fetchText(appUrl);
  const attemptRawPayloadRoute = await fetchText(new URL("/api/attempts", appUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vocabularyId: "hello",
      passed: false,
      confidence: 0,
      predictedId: null,
      modelId: "privacy-smoke",
      modelStatus: "not_trained",
      hint: "privacy smoke",
      reason: "privacy smoke",
      frame: "data:image/png;base64,privacy-smoke-raw-frame",
    }),
  });
  const datasetClipRoute = await fetchText(new URL("/api/dataset/clips", appUrl), { method: "POST" });
  const datasetCoverageRoute = await fetchText(new URL("/api/dataset/coverage", appUrl));
  const rootInspection = inspectHtml(rootPage.text);
  return {
    app_reachable: rootPage.ok,
    root_page_status: rootPage.status,
    root_error: rootPage.error,
    root_content_type: rootPage.contentType,
    attempt_raw_payload_post_status: attemptRawPayloadRoute.status,
    attempt_raw_payload_error_mentions_raw_camera: /raw camera data/i.test(attemptRawPayloadRoute.text),
    normal_practice_raw_payload_rejected:
      attemptRawPayloadRoute.status === 400 &&
      /raw camera data/i.test(attemptRawPayloadRoute.text),
    dataset_clip_post_status: datasetClipRoute.status,
    dataset_coverage_get_status: datasetCoverageRoute.status,
    dataset_collection_default_disabled: datasetClipRoute.status === 403 && datasetCoverageRoute.status === 403,
    root_inspection: rootInspection,
  };
}

function buildFindings(staticAudit, live) {
  const findings = {
    raw_video_uploads_observed: false,
    raw_frame_uploads_observed: false,
    image_or_blob_payloads_observed: false,
    analytics_or_session_replay_observed: false,
  };
  if (!staticAudit.ok) {
    findings.raw_video_uploads_observed = true;
    findings.raw_frame_uploads_observed = true;
    findings.image_or_blob_payloads_observed = true;
  }
  if (live.root_inspection.analytics_or_session_replay_observed) {
    findings.analytics_or_session_replay_observed = true;
  }
  return findings;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output
    ? resolveProjectPath(args.output, "--output")
    : defaultOutputPath;
  const staticAudit = run("node", ["scripts/audit_no_raw_video_upload.mjs"]);
  let live = await liveChecks(args.appUrl);
  let server = {
    mode: "external",
    app_url_reachable_before_auto_start: live.app_reachable,
  };
  let autoServer = null;
  try {
    if (!live.app_reachable && args.autoStartServer && canAutoStartUrl(args.appUrl)) {
      autoServer = await startIsolatedServer(args.appUrl, args.keepTemp);
      server = {
        ...autoServer.server,
        app_url_reachable_before_auto_start: false,
      };
      live = await liveChecks(args.appUrl);
    }
  } finally {
    if (autoServer) await autoServer.cleanup();
  }
  const findings = buildFindings(staticAudit, live);
  const blockers = [];
  if (!staticAudit.ok) blockers.push(staticAudit.stderr || staticAudit.stdout || "static raw-upload audit failed");
  if (!live.app_reachable) {
    blockers.push(
      live.root_error
        ? `app URL is not reachable: ${args.appUrl} (${live.root_error})`
        : `app URL is not reachable: ${args.appUrl}`,
    );
  }
  if (!live.dataset_collection_default_disabled) {
    blockers.push("dataset collection endpoints must return 403 when collection env vars are not enabled");
  }
  if (!live.normal_practice_raw_payload_rejected) {
    blockers.push("normal practice attempt route must reject a live raw camera payload");
  }
  if (live.root_inspection.blocked_analytics_or_replay_hosts.length > 0) {
    blockers.push(`blocked analytics/session replay hosts found: ${live.root_inspection.blocked_analytics_or_replay_hosts.join(", ")}`);
  }
  if (Object.values(findings).some(Boolean)) {
    blockers.push("normal_practice_findings must all be false");
  }
  const report = {
    schema_version: "asl-pilot-final-privacy-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    tested_at: new Date().toISOString(),
    app_url: args.appUrl,
    normal_practice_findings: findings,
    commands: [
      staticAudit.command,
      `GET ${args.appUrl}`,
      `POST ${new URL("/api/attempts", args.appUrl).toString()} with raw frame payload`,
      `POST ${new URL("/api/dataset/clips", args.appUrl).toString()}`,
      `GET ${new URL("/api/dataset/coverage", args.appUrl).toString()}`,
    ],
    evidence: {
      static_audit: {
        ok: staticAudit.ok,
        stdout: staticAudit.stdout,
        stderr: staticAudit.stderr,
      },
      live_http: live,
      server,
      source_files: [
        "web/src/app/api/attempts/route.ts",
        "web/src/app/api/dataset/clips/route.ts",
        "web/src/app/api/dataset/coverage/route.ts",
        "web/src/components/PracticeApp.tsx",
      ].map((relativePath) => ({
        path: relativePath,
        sha256: sha256File(path.join(root, relativePath)),
      })),
    },
    evidence_notes: "Live HTTP check verifies the normal practice attempt route rejects raw camera payloads, verifies the default-disabled dataset collection routes, and scans rendered root HTML for common analytics/session-replay hosts. Static audit scans normal practice network/API code for raw media payloads.",
    blockers,
  };
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(
    JSON.stringify(
      {
        status: report.status,
        output: args.write ? projectRelative(outputPath) : null,
        app_url: report.app_url,
        blockers,
      },
      null,
      2,
    ),
  );
  return blockers.length === 0 ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Final privacy smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
