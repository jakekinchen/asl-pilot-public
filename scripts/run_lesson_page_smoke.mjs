import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "lesson-page-smoke.json");
const requireFromWeb = createRequire(path.join(root, "web", "package.json"));
const { chromium } = requireFromWeb("playwright");

const bannedClaimPatterns = [
  /\btracking active\b/i,
  /\byou passed\b/i,
  /\bcorrect!?$/i,
  /\bcorrect sign\b/i,
  /\bmatched the sign\b/i,
];

const rawPayloadKeys = new Set([
  "frame",
  "frames",
  "image",
  "images",
  "video",
  "blob",
  "base64",
  "dataurl",
  "data_url",
  "media",
  "file",
  "recording",
  "clip",
]);

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
  node scripts/run_lesson_page_smoke.mjs [--write] [--output docs/validation/lesson-page-smoke.json] [--keep-temp]

Starts an isolated production Next.js server, registers a local smoke user,
drives /lesson?vocabulary=please with fake camera media, and records fail-closed
lesson/avatar evidence.
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
  await page.getByLabel("Name").fill("Lesson Smoke");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("lesson-smoke-password");
  await page.getByRole("button", { name: "Open studio" }).click();
  await page.getByRole("button", { name: "Start camera" }).waitFor({ timeout: 10_000 });
}

async function textIsVisible(page, text) {
  const locator = page.getByText(text).first();
  await locator.waitFor({ timeout: 10_000 });
  return locator.isVisible();
}

function collectRawPayloadKeys(value, prefix = "$") {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRawPayloadKeys(item, `${prefix}[${index}]`));
  }
  const findings = [];
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[-_]/g, "");
    if (rawPayloadKeys.has(normalized)) findings.push(`${prefix}.${key}`);
    if (typeof nested === "string" && nested.startsWith("data:")) {
      findings.push(`${prefix}.${key}`);
    }
    findings.push(...collectRawPayloadKeys(nested, `${prefix}.${key}`));
  }
  return findings;
}

async function robotPixelProof(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="robot-viewport"] canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { canvas_present: false, width: 0, height: 0, non_blank_pixels: 0 };
    }
    const probe = document.createElement("canvas");
    probe.width = 64;
    probe.height = 64;
    const context = probe.getContext("2d");
    if (!context) return { canvas_present: true, width: canvas.width, height: canvas.height, non_blank_pixels: 0 };
    context.drawImage(canvas, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    let nonBlankPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] ?? 0;
      const luma = (pixels[index] ?? 0) + (pixels[index + 1] ?? 0) + (pixels[index + 2] ?? 0);
      if (alpha > 0 && luma > 20) nonBlankPixels += 1;
    }
    return {
      canvas_present: true,
      width: canvas.width,
      height: canvas.height,
      non_blank_pixels: nonBlankPixels,
    };
  });
}

async function runSmoke(appUrl) {
  const checks = [];
  const attemptPayloads = [];
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });

  try {
    const context = await browser.newContext({ baseURL: appUrl });
    await context.grantPermissions(["camera"], { origin: appUrl });
    const page = await context.newPage();
    page.on("request", (request) => {
      const requestUrl = new URL(request.url());
      if (request.method() !== "POST" || requestUrl.pathname !== "/api/attempts") return;
      const postData = request.postData();
      if (!postData) return;
      try {
        attemptPayloads.push(JSON.parse(postData));
      } catch {
        attemptPayloads.push({ parse_error: true, raw_length: postData.length });
      }
    });

    await page.goto("/lesson?vocabulary=please", { waitUntil: "networkidle" });
    const unauthenticatedLessonGate = await Promise.all([
      textIsVisible(page, "Sign in to use the lesson studio"),
      page.getByRole("link", { name: "Practice workspace" }).isVisible(),
      page.getByRole("button", { name: "Start camera" }).count(),
      page.getByRole("button", { name: "Save practice sample" }).count(),
    ]);
    addCheck(
      checks,
      "unauthenticated_lesson_gate",
      "Unauthenticated lesson route stays account-gated before camera controls",
      unauthenticatedLessonGate[0] === true
        && unauthenticatedLessonGate[1] === true
        && unauthenticatedLessonGate[2] === 0
        && unauthenticatedLessonGate[3] === 0,
      {
        sign_in_copy_visible: unauthenticatedLessonGate[0],
        practice_workspace_link_visible: unauthenticatedLessonGate[1],
        start_camera_button_count: unauthenticatedLessonGate[2],
        save_sample_button_count: unauthenticatedLessonGate[3],
      },
      "unauthenticated /lesson must not expose camera or sample controls",
    );

    const email = `lesson-smoke-${Date.now()}-${crypto.randomUUID()}@example.test`;
    await registerPracticeUser(page, email);
    const practiceLessonLinkVisible = await page.getByRole("link", { name: "Lesson" }).isVisible();
    addCheck(
      checks,
      "practice_links_to_lesson",
      "Practice workspace links to the lesson studio",
      practiceLessonLinkVisible,
      {
        lesson_link_visible: practiceLessonLinkVisible,
      },
      "practice workspace must expose a route to /lesson",
    );

    await page.goto("/lesson?vocabulary=please", { waitUntil: "networkidle" });

    const uiVisible = await Promise.all([
      textIsVisible(page, "Sign PLEASE."),
      textIsVisible(page, "Model inactive. This lesson is learn-only."),
      textIsVisible(page, "Detector feed unavailable."),
      textIsVisible(page, "Learn-only"),
      page.getByRole("button", { name: "Start camera" }).isVisible(),
      page.getByRole("button", { name: "Replay timing scaffold" }).isVisible(),
    ]);
    addCheck(
      checks,
      "authenticated_lesson_ui",
      "Authenticated lesson page shows Tier 0 prompt, inactive gates, camera controls, and avatar controls",
      uiVisible.every(Boolean),
      {
        prompt_visible: uiVisible[0],
        model_inactive_visible: uiVisible[1],
        detector_inactive_visible: uiVisible[2],
        learn_only_visible: uiVisible[3],
        start_camera_visible: uiVisible[4],
        timing_scaffold_visible: uiVisible[5],
      },
      "lesson UI must expose prompt, inactive gates, camera controls, and avatar controls",
    );

    const studyFlowInitialVisible = await Promise.all([
      page.getByTestId("lesson-study-flow").isVisible(),
      page.getByRole("button", { name: "Study" }).isVisible(),
      page.getByRole("button", { name: "Preview" }).isVisible(),
      page.getByRole("button", { name: "Sample" }).isVisible(),
      textIsVisible(page, "Read the prompt"),
      textIsVisible(page, "Use the coaching hint to plan the movement before using the camera."),
    ]);
    await page.getByRole("button", { name: "Preview" }).click();
    await page.getByText("Frame locally").waitFor({ timeout: 10_000 });
    const previewCopyVisible = await page
      .getByText("Start the camera when ready; framing feedback stays in this browser.")
      .isVisible();
    await page.getByRole("button", { name: "Sample" }).click();
    await page.getByText("Save history only").waitFor({ timeout: 10_000 });
    const sampleCopyVisible = await page
      .getByText("Save one metadata-only sample when useful. No automatic grade is produced.")
      .isVisible();
    addCheck(
      checks,
      "lesson_prompt_study_flow",
      "Lesson prompt study flow exposes Study, Preview, and Sample guidance without recognition claims",
      studyFlowInitialVisible.every(Boolean) && previewCopyVisible && sampleCopyVisible,
      {
        study_flow_visible: studyFlowInitialVisible[0],
        study_button_visible: studyFlowInitialVisible[1],
        preview_button_visible: studyFlowInitialVisible[2],
        sample_button_visible: studyFlowInitialVisible[3],
        study_title_visible: studyFlowInitialVisible[4],
        study_copy_visible: studyFlowInitialVisible[5],
        preview_copy_visible: previewCopyVisible,
        sample_copy_visible: sampleCopyVisible,
      },
      "lesson prompt study flow must expose all three fail-closed study steps",
    );

    await page.locator('[data-testid="robot-viewport"][data-avatar-ready="true"]').waitFor({ timeout: 15_000 });
    const robotProof = await robotPixelProof(page);
    addCheck(
      checks,
      "robot_three_canvas",
      "Robot viewport renders a nonblank Three.js canvas with stable avatar attributes",
      robotProof.canvas_present && robotProof.non_blank_pixels > 20,
      robotProof,
      "robot viewport must render a nonblank canvas",
    );

    const pageText = await page.locator("body").innerText();
    const bannedClaims = bannedClaimPatterns
      .filter((pattern) => pattern.test(pageText))
      .map((pattern) => pattern.source);
    addCheck(
      checks,
      "fail_closed_claims_absent",
      "Not-trained lesson page does not render unsupported tracking or recognition claims",
      bannedClaims.length === 0,
      { banned_claim_patterns_seen: bannedClaims },
      "lesson page rendered an unsupported recognition or tracking claim",
    );

    await page.getByRole("button", { name: "Start camera" }).click();
    await page.getByText("Camera ready. Sampling stays local in this browser.").first().waitFor({ timeout: 15_000 });
    await page.getByRole("button", { name: "Save practice sample" }).click();
    await page.getByText("Practice sample saved").first().waitFor({ timeout: 20_000 });
    const latestPayload = attemptPayloads.at(-1) ?? null;
    const rawKeys = collectRawPayloadKeys(latestPayload);
    addCheck(
      checks,
      "camera_local_sample",
      "Lesson camera saves only fail-closed metadata and no raw media payload",
      Boolean(latestPayload)
        && rawKeys.length === 0
        && latestPayload.passed === false
        && latestPayload.modelStatus === "not_trained"
        && latestPayload.confidence === 0
        && Number.isInteger(latestPayload.frameCount)
        && latestPayload.frameCount > 0,
      {
        payload_present: Boolean(latestPayload),
        payload_keys: latestPayload ? Object.keys(latestPayload).sort() : [],
        raw_payload_keys: rawKeys,
        passed: latestPayload?.passed,
        model_status: latestPayload?.modelStatus,
        confidence: latestPayload?.confidence,
        frame_count: latestPayload?.frameCount,
      },
      "lesson sample payload must contain metadata only and remain fail-closed",
    );

    await page.getByRole("button", { name: "Replay timing scaffold" }).click();
    await page.locator('[data-testid="robot-viewport"][data-avatar-mode="demo"]').waitFor({ timeout: 5_000 });
    addCheck(
      checks,
      "avatar_demo_mode",
      "Robot exposes timing scaffold mode without detector tracking",
      true,
      {
        data_avatar_mode: "demo",
      },
    );

    await context.close();
  } finally {
    await browser.close();
  }

  const blockers = checks.flatMap((check) => check.blockers ?? []);
  const sourceFiles = [
    "web/src/app/lesson/page.tsx",
    "web/src/components/CameraViewport.tsx",
    "web/src/components/LessonApp.tsx",
    "web/src/components/RobotMannequin3D.tsx",
    "web/src/lib/avatar-motion.ts",
    "web/src/lib/detector0-types.ts",
    "web/src/lib/detector0-engine.ts",
    "web/src/lib/model-bundle.ts",
    "web/src/lib/use-camera-capture.ts",
    "web/public/model/detector0-card.json",
    "web/public/model/browser-model-bundle.json",
  ].map((relativePath) => ({
    path: relativePath,
    sha256: sha256File(path.join(root, relativePath)),
  }));

  return {
    schema_version: "asl-pilot-lesson-page-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    tested_at: new Date().toISOString(),
    app_url: appUrl,
    browser: {
      automation: "playwright",
      browser_name: "chromium",
      fake_media: true,
    },
    checks,
    source_files: sourceFiles,
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-pilot-lesson-smoke-"));
  const storePath = path.join(tempDir, "store.json");
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the lesson page smoke");
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
      schema_version: "asl-pilot-lesson-page-smoke/v1",
      status: "failed",
      tested_at: new Date().toISOString(),
      app_url: appUrl,
      browser: {
        automation: "playwright",
        browser_name: "chromium",
        fake_media: true,
      },
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
    console.error(`Lesson page smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
