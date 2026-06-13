import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const thisFile = fileURLToPath(import.meta.url);
const defaultOutputPath = path.join(root, "docs", "validation", "practice-scope-copy-smoke.json");
const requireFromWeb = createRequire(path.join(root, "web", "package.json"));
const { chromium } = requireFromWeb("playwright");

function parseArgs(argv) {
  const args = {
    appUrl: null,
    keepTemp: false,
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
      args.output = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/run_practice_scope_copy_smoke.mjs [--app-url http://127.0.0.1:3025] [--write]

Starts an isolated app server unless --app-url is provided, drives the real
practice UI, and verifies that visible copy separates the broad prompt catalog
from the narrower model-card checker scope.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
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
      // Retry until the isolated server is reachable.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
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
  const checks = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: appUrl });
  const smokeEmail = `scope-copy-${Date.now()}-${crypto.randomUUID()}@example.test`;

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByText("prompt catalog", { exact: false }).first().waitFor({ timeout: 10_000 });
    const authText = await page.locator("body").innerText();
    const authLower = authText.toLowerCase();

    addCheck(
      checks,
      "auth_prompt_catalog_boundary",
      "Unauthenticated screen describes the broad prompt set as a catalog, not CV support",
      authLower.includes("prompt catalog") && !authLower.includes("curated prompts"),
      {
        has_prompt_catalog: authLower.includes("prompt catalog"),
        has_curated_prompts: authLower.includes("curated prompts"),
      },
      "auth screen must use prompt catalog copy and must not use the older curated prompts copy",
    );

    await page.getByLabel("Name").fill("Scope Copy Smoke");
    await page.getByLabel("Email").fill(smokeEmail);
    await page.getByLabel("Password").fill("camera-behavior-password");
    await page.getByRole("button", { name: "Open studio" }).click();
    await page.getByRole("button", { name: "Start camera" }).waitFor({ timeout: 10_000 });

    const practiceText = await page.locator("body").innerText();
    const practiceLower = practiceText.toLowerCase();
    addCheck(
      checks,
      "practice_prompt_catalog_boundary",
      "Authenticated practice screen keeps prompt catalog separate from checker support",
      practiceLower.includes("prompt catalog") &&
        practiceLower.includes("practice ledger") &&
        practiceText.includes("Automatic sign checking is not trained; attempts save as practice history only.") &&
        !practiceLower.includes("pilot checker is available for this vocabulary set"),
      {
        has_prompt_catalog: practiceLower.includes("prompt catalog"),
        has_practice_ledger: practiceLower.includes("practice ledger"),
        has_not_trained_copy: practiceText.includes("Automatic sign checking is not trained; attempts save as practice history only."),
        has_old_ready_overclaim: practiceLower.includes("pilot checker is available for this vocabulary set"),
      },
      "practice screen must disclose not-trained checker scope without the older full-vocabulary ready copy",
    );

    return {
      app_url: appUrl,
      smoke_user_email_domain: smokeEmail.split("@")[1],
      practice_excerpt: practiceText.split("\n").filter(Boolean).slice(0, 28),
      checks,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const outputPath = resolveProjectPath(args.output, "--output");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-scope-copy-smoke-"));
  const storePath = path.join(tempDir, "store.json");
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  let child = null;
  let stdout = "";
  let stderr = "";
  let appUrl = args.appUrl;
  let storeExistedAfterSmoke = false;
  let tempRemovedAfterRun = false;
  let result;

  try {
    if (!appUrl) {
      if (!fs.existsSync(buildIdPath)) {
        throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the practice scope copy smoke");
      }
      const port = await findFreePort();
      appUrl = `http://127.0.0.1:${port}`;
      child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
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
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      await waitForApp(appUrl, child);
    }
    result = await runSmoke(appUrl);
  } catch (error) {
    result = {
      app_url: appUrl,
      practice_excerpt: [],
      checks: [],
      blockers: [error instanceof Error ? error.message : String(error)],
    };
  } finally {
    if (child) {
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        child.once("exit", resolve);
        setTimeout(resolve, 2_000);
      });
    }
    storeExistedAfterSmoke = fs.existsSync(storePath);
    if (!args.keepTemp) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempRemovedAfterRun = !fs.existsSync(tempDir);
    }
  }

  const blockers = [
    ...(Array.isArray(result.blockers) ? result.blockers : []),
    ...result.checks.flatMap((check) => check.blockers),
  ];
  const report = {
    schema_version: "asl-pilot-practice-scope-copy-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/run_practice_scope_copy_smoke.mjs",
        sha256: sha256File(thisFile),
      },
      command: [
        "node",
        "scripts/run_practice_scope_copy_smoke.mjs",
        ...(args.appUrl ? ["--app-url", args.appUrl] : []),
        ...(args.write ? ["--write"] : []),
      ],
    },
    server: {
      mode: args.appUrl ? "external_app_url" : "next_start",
      app_url: appUrl,
      build_id_sha256: fs.existsSync(buildIdPath) ? sha256File(buildIdPath) : null,
      command: args.appUrl
        ? `external app URL supplied: ${args.appUrl}`
        : appUrl
          ? `ASL_PILOT_AUTH_PROVIDER=local ASL_PILOT_STORE_PATH=${storePath} ENABLE_DATASET_COLLECTION=false NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false npm --prefix web run start -- --hostname 127.0.0.1 --port ${new URL(appUrl).port}`
          : null,
      isolated_store: {
        env_var: args.appUrl ? null : "ASL_PILOT_STORE_PATH",
        path: args.appUrl ? null : storePath,
        existed_after_smoke: args.appUrl ? null : storeExistedAfterSmoke,
        removed_after_run: args.appUrl ? null : args.keepTemp ? false : tempRemovedAfterRun,
      },
      stdout_tail: stdout.trim().split(/\r?\n/).filter(Boolean).slice(-20),
      stderr_tail: stderr.trim().split(/\r?\n/).filter(Boolean).slice(-20),
    },
    boundary: {
      not_model_evidence: true,
      not_training_evidence: true,
      verifies_copy_only: true,
      canonical_store_mutated: args.appUrl ? "not_asserted_for_external_app_url" : false,
    },
    ...result,
    blockers,
  };

  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    status: report.status,
    output: projectRelative(outputPath),
    app_url: appUrl,
    blocker_count: blockers.length,
  }, null, 2));

  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Practice scope copy smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
