import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "practice-camera-behavior-smoke.json");
const requireFromWeb = createRequire(path.join(root, "web", "package.json"));
const { chromium } = requireFromWeb("playwright");

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
  node scripts/run_practice_camera_behavior_smoke.mjs [--write] [--output docs/validation/practice-camera-behavior-smoke.json] [--keep-temp]

Starts an isolated Next.js server, drives the real practice UI in Playwright,
and verifies the beginner practice screen behavior for camera success, denied
permission, missing camera, unsupported camera API, result/hint/retry controls,
next prompt, and saved progress.
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

function addCheck(checks, id, label, passed, evidence, blocker) {
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    evidence,
    blockers: passed ? [] : [blocker ?? `${label} failed`],
  });
}

async function registerPracticeUser(page, email) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Camera Behavior Smoke");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("camera-behavior-password");
  await page.getByRole("button", { name: "Open studio" }).click();
  await page.getByRole("button", { name: "Start camera" }).waitFor({ timeout: 10_000 });
}

async function createContext(browser, appUrl, initScript = null) {
  const context = await browser.newContext({ baseURL: appUrl });
  if (initScript) await context.addInitScript(initScript);
  return context;
}

async function exerciseErrorScenario(browser, appUrl, { id, label, initScript, expectedText, email }) {
  const context = await createContext(browser, appUrl, initScript);
  const page = await context.newPage();
  try {
    await registerPracticeUser(page, email);
    await page.getByRole("button", { name: "Start camera" }).click();
    await page.getByText(expectedText).first().waitFor({ timeout: 10_000 });
    return {
      id,
      label,
      passed: true,
      evidence: {
        expected_text_visible: expectedText,
      },
    };
  } finally {
    await context.close();
  }
}

async function textIsVisible(page, text) {
  const locator = page.getByText(text).first();
  await locator.waitFor({ timeout: 10_000 });
  return locator.isVisible();
}

async function runSmoke(appUrl) {
  const checks = [];
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const accountPrefix = `camera-smoke-${Date.now()}-${crypto.randomUUID()}`;

  try {
    const successContext = await createContext(browser, appUrl);
    await successContext.grantPermissions(["camera"], { origin: appUrl });
    const page = await successContext.newPage();
    await registerPracticeUser(page, `${accountPrefix}-success@example.test`);

    const uiVisible = await Promise.all([
      textIsVisible(page, "Sign HELLO."),
      textIsVisible(page, "Camera has not started."),
      page.getByRole("button", { name: "Start camera" }).isVisible(),
      page.getByRole("button", { name: "Next prompt" }).isVisible(),
      textIsVisible(page, "History"),
      textIsVisible(page, "No saved attempts yet — start the camera to add practice history."),
    ]);
    addCheck(
      checks,
      "authenticated_practice_ui",
      "Authenticated practice UI shows prompt, camera state, controls, and empty progress",
      uiVisible.every(Boolean),
      {
        prompt_visible: uiVisible[0],
        camera_idle_visible: uiVisible[1],
        start_camera_visible: uiVisible[2],
        next_prompt_visible: uiVisible[3],
        history_visible: uiVisible[4],
        empty_history_visible: uiVisible[5],
      },
      "practice UI must expose prompt, camera state, controls, and history after login",
    );

    await page.getByRole("button", { name: "Start camera" }).click();
    await page.getByText("Camera ready. Frames are sampled locally in this browser.").first().waitFor({ timeout: 15_000 });
    const savePracticeAction = page.getByRole("button", { name: "Save practice" });
    await savePracticeAction.waitFor({ timeout: 10_000 });
    const savePracticeActionVisible = await savePracticeAction.isVisible();
    const submitAttemptActionVisible = await page.getByRole("button", { name: "Submit attempt" }).isVisible();
    const checkAttemptActionVisible = await page.getByRole("button", { name: "Check attempt" }).isVisible();
    await savePracticeAction.click();
    await page.getByText("Saved to your practice history.").first().waitFor({ timeout: 20_000 });
    const resultVisible = await page.getByText("Practice saved").isVisible();
    const failClosedHintVisible = await page.getByText(/Automatic sign checking is not ready/i).isVisible();
    const historyUpdated = await page.getByText("1 saved").isVisible();
    addCheck(
      checks,
      "camera_success_attempt_result_and_progress",
      "Fake camera success path samples local frames, saves a fail-closed result, hint, and history",
      resultVisible && failClosedHintVisible && historyUpdated,
      {
        camera_ready_text_visible: true,
        save_practice_action_visible: savePracticeActionVisible,
        submit_attempt_action_visible: submitAttemptActionVisible,
        check_attempt_action_visible: checkAttemptActionVisible,
        result_visible: resultVisible,
        fail_closed_hint_visible: failClosedHintVisible,
        history_updated_visible: historyUpdated,
      },
      "camera success path must expose Save practice, save an attempt, show result/hint, and refresh history",
    );

    const initialPromptText = (await page.locator(".prompt-box h1").textContent())?.trim() ?? "";
    await page.getByRole("button", { name: "Next prompt" }).click();
    await page.waitForFunction((initial) => {
      const next = document.querySelector(".prompt-box h1")?.textContent?.trim() ?? "";
      return next.length > 0 && next !== initial;
    }, initialPromptText, { timeout: 10_000 });
    const nextPromptText = (await page.locator(".prompt-box h1").textContent())?.trim() ?? "";
    addCheck(
      checks,
      "next_prompt_action",
      "Next prompt action advances the learner to another ASL prompt",
      nextPromptText.startsWith("Sign ") && nextPromptText !== initialPromptText,
      {
        previous_prompt_text: initialPromptText,
        next_prompt_text_visible: nextPromptText,
        prompt_changed: nextPromptText !== initialPromptText,
      },
      "next prompt action must advance to the next vocabulary prompt",
    );
    await successContext.close();

    const scenarios = [
      {
        id: "camera_denied",
        label: "Camera permission denial shows beginner-readable recovery copy",
        expectedText: "Camera permission was denied. Enable camera access to use the practice screen.",
        initScript: () => {
          Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: {
              getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")),
            },
          });
        },
      },
      {
        id: "camera_missing",
        label: "Missing camera device shows beginner-readable unavailable-copy",
        expectedText: "No camera was found on this device.",
        initScript: () => {
          Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: {
              getUserMedia: () => Promise.reject(new DOMException("missing", "NotFoundError")),
            },
          });
        },
      },
      {
        id: "camera_unsupported",
        label: "Unsupported browser camera API shows unsupported-copy without requesting media",
        expectedText: "This browser does not expose camera access for the practice screen.",
        initScript: () => {
          Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: undefined,
          });
        },
      },
      {
        id: "camera_generic_error",
        label: "Unexpected camera startup failure shows beginner-readable fallback copy",
        expectedText: "Camera could not start under the current browser/device settings.",
        initScript: () => {
          Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: {
              getUserMedia: () => Promise.reject(new DOMException("aborted", "AbortError")),
            },
          });
        },
      },
    ];

    for (const scenario of scenarios) {
      try {
        const result = await exerciseErrorScenario(browser, appUrl, {
          ...scenario,
          email: `${accountPrefix}-${scenario.id}@example.test`,
        });
        addCheck(checks, result.id, result.label, result.passed, result.evidence);
      } catch (error) {
        addCheck(
          checks,
          scenario.id,
          scenario.label,
          false,
          { expected_text: scenario.expectedText },
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  } finally {
    await browser.close();
  }

  const blockers = checks.flatMap((check) => check.blockers ?? []);
  return {
    schema_version: "asl-pilot-practice-camera-behavior-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    tested_at: new Date().toISOString(),
    app_url: appUrl,
    browser: {
      automation: "playwright",
      browser_name: "chromium",
      fake_media_device: true,
      permission_error_modes: ["NotAllowedError", "NotFoundError", "unsupported mediaDevices"],
    },
    checks,
    source_files: [
      "scripts/run_practice_camera_behavior_smoke.mjs",
      "scripts/audit_practice_camera_behavior_smoke.mjs",
      "web/src/components/PracticeApp.tsx",
      "web/src/lib/client-model.ts",
      "web/src/lib/server-store.ts",
      "web/src/lib/vocabulary.ts",
      "web/public/model/model-card.json",
      "docs/model/active-vocabulary-claim.json",
    ].map((relativePath) => ({
      path: relativePath,
      sha256: sha256File(path.join(root, relativePath)),
    })),
    commands: [
      "node scripts/run_practice_camera_behavior_smoke.mjs --write",
      `GET ${appUrl}`,
      "Playwright Chromium with --use-fake-device-for-media-stream and --use-fake-ui-for-media-stream",
    ],
    blockers,
    evidence_notes: "Runtime smoke uses the real practice UI with an isolated temporary store. Fake media is used only to prove browser UI behavior; it is not model-training or ASL-recognition evidence.",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveProjectPath(args.output, "--output");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-camera-smoke-"));
  const storePath = path.join(tempDir, "store.json");
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the practice camera behavior smoke");
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
      schema_version: "asl-pilot-practice-camera-behavior-smoke/v1",
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
    console.error(`Practice camera behavior smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
