import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "browser-onnx-wiring-smoke.json");
const webPackageJsonPath = path.join(root, "web", "package.json");
const smokePublicModelPath = "web/public/model/browser-onnx-wiring-smoke/model-card.json";
const smokePublicArtifactPath =
  "web/public/model/browser-onnx-wiring-smoke/asl-pilot-browser-onnx-wiring-smoke.onnx";
let smokeOutputDir = path.join(root, "output", "browser-onnx-wiring-smoke");
let smokeModelCardPath = path.join(smokeOutputDir, "model-card.json");
let smokeArtifactPath = path.join(smokeOutputDir, "asl-pilot-browser-onnx-wiring-smoke.onnx");

function parseArgs(argv) {
  const args = { write: false, headed: false, keepServer: false };
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
    if (item === "--headed") {
      args.headed = true;
      continue;
    }
    if (item === "--keep-server") {
      args.keepServer = true;
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
  node scripts/run_browser_onnx_wiring_smoke.mjs [--write] [--output docs/validation/browser-onnx-wiring-smoke.json] [--headed]

Builds a deterministic two-label smoke-only ONNX artifact, starts the built
Next.js app, intercepts only the smoke model-card/artifact URLs, and drives the
hidden browser smoke page that calls the real client evaluateLocalAttempt()
path. The retained report is smoke-only evidence and must not be used as final
trained model evidence.
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

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function referenceForFile(file) {
  return {
    path: projectRelative(file),
    sha256: sha256File(file),
  };
}

function packageVersion() {
  return readJson(path.join(root, "web", "node_modules", "onnxruntime-web", "package.json")).version;
}

function pythonCommand() {
  const venvPython = path.join(root, ".venv", "bin", "python");
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function generateSmokeOnnx() {
  fs.mkdirSync(smokeOutputDir, { recursive: true });
  const script = `
import sys
import onnx
from onnx import TensorProto, helper

output_path = sys.argv[1]
clips = helper.make_tensor_value_info("clips", TensorProto.FLOAT, [1, 3, 3, 16, 16])
logits = helper.make_tensor_value_info("logits", TensorProto.FLOAT, [1, 2])
nodes = [
    helper.make_node("ReduceMean", ["clips"], ["mean"], axes=[1, 2, 3, 4], keepdims=0),
    helper.make_node("Unsqueeze", ["mean"], ["mean_2d"], axes=[1]),
    helper.make_node("Neg", ["mean_2d"], ["negative_mean"]),
    helper.make_node("Concat", ["mean_2d", "negative_mean"], ["logits"], axis=1),
]
graph = helper.make_graph(nodes, "asl_pilot_browser_onnx_wiring_smoke", [clips], [logits])
model = helper.make_model(
    graph,
    producer_name="asl-pilot-browser-onnx-wiring-smoke",
    opset_imports=[helper.make_operatorsetid("", 11)],
)
model.ir_version = 7
onnx.checker.check_model(model)
onnx.save(model, output_path)
`;
  const result = spawnSync(pythonCommand(), ["-c", script, smokeArtifactPath], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `Unable to generate smoke ONNX artifact: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}

function buildSmokeModelCard() {
  generateSmokeOnnx();
  const card = {
    model_id: "asl-pilot-browser-onnx-wiring-smoke-v0",
    status: "trained",
    export_format: "onnx",
    evidence_mode: "smoke",
    finality: "smoke_only",
    browser_artifact: {
      path: smokePublicArtifactPath,
      sha256: sha256File(smokeArtifactPath),
    },
    model: {
      frame_count: 3,
      image_size: 16,
      input_name: "clips",
      output_name: "logits",
      label_to_index: {
        hello: 0,
        goodbye: 1,
      },
    },
    confidence_thresholds: {
      default: 0.5,
    },
    provenance_note:
      "Smoke-only deterministic ONNX fixture generated by scripts/run_browser_onnx_wiring_smoke.mjs. It is not trained ASL evidence and must not be promoted.",
  };
  writeJson(smokeModelCardPath, card);
  return card;
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
      // Retry until Next has finished booting.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

async function loadPlaywright() {
  try {
    const requireFromWeb = createRequire(webPackageJsonPath);
    return requireFromWeb("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is required for browser ONNX wiring smoke generation. "
        + "Install it with `npm --prefix web install --save-dev playwright`, then rerun this command.",
      { cause: error },
    );
  }
}

async function runBrowserSmoke({ appUrl, headed, modelCard }) {
  const { chromium } = await loadPlaywright();
  const appOrigin = new URL(appUrl).origin;
  const networkEvents = [];
  const unexpectedExternalRequests = [];
  let fetchedSmokeModelCard = false;
  let fetchedSmokeBrowserArtifact = false;
  let fetchedOrtWasmRoute = false;

  const browser = await chromium.launch({ headless: !headed });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("request", (request) => {
      const url = request.url();
      if (url.endsWith("/model/browser-onnx-wiring-smoke/model-card.json")) fetchedSmokeModelCard = true;
      if (url.endsWith("/model/browser-onnx-wiring-smoke/asl-pilot-browser-onnx-wiring-smoke.onnx")) {
        fetchedSmokeBrowserArtifact = true;
      }
      if (url.includes("/api/ort/") && url.endsWith(".wasm")) fetchedOrtWasmRoute = true;
      if (url.startsWith("data:") || url.startsWith("blob:")) return;
      let origin = "";
      try {
        origin = new URL(url).origin;
      } catch {
        origin = "invalid";
      }
      if (origin !== appOrigin) {
        unexpectedExternalRequests.push({
          method: request.method(),
          url,
          resource_type: request.resourceType(),
        });
      }
    });
    page.on("response", (response) => {
      const url = response.url();
      if (!url.startsWith(appOrigin)) return;
      networkEvents.push({
        url_path: new URL(url).pathname,
        status: response.status(),
        content_type: response.headers()["content-type"] ?? null,
      });
    });
    await page.route(`${appOrigin}/model/browser-onnx-wiring-smoke/model-card.json`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: `${JSON.stringify(modelCard, null, 2)}\n`,
      });
    });
    await page.route(
      `${appOrigin}/model/browser-onnx-wiring-smoke/asl-pilot-browser-onnx-wiring-smoke.onnx`,
      async (route) => {
        await route.fulfill({
          status: 200,
          path: smokeArtifactPath,
          contentType: "application/octet-stream",
        });
      },
    );

    const smokeUrl = `${appUrl}/smoke/browser-onnx`;
    await page.goto(smokeUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="browser-onnx-smoke-result"]');
      if (!element?.textContent) return false;
      try {
        return JSON.parse(element.textContent).status !== "running";
      } catch {
        return false;
      }
    }, { timeout: 30_000 });
    const smokeState = await page.locator('[data-testid="browser-onnx-smoke-result"]').textContent();
    const parsedSmokeState = smokeState ? JSON.parse(smokeState) : null;

    const screenshotPath = path.join(smokeOutputDir, "browser-onnx-wiring-smoke.png");
    const networkPath = path.join(smokeOutputDir, "browser-onnx-wiring-smoke-network-log.json");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    writeJson(networkPath, {
      schema_version: "asl-pilot-browser-onnx-wiring-smoke-network-log/v1",
      app_url: smokeUrl,
      browser: browser.version(),
      fetched_smoke_model_card: fetchedSmokeModelCard,
      fetched_smoke_browser_artifact: fetchedSmokeBrowserArtifact,
      fetched_ort_wasm_route: fetchedOrtWasmRoute,
      unexpected_external_requests: unexpectedExternalRequests,
      network_events: networkEvents,
      checked_at: new Date().toISOString(),
    });

    return {
      browserVersion: browser.version(),
      smokeUrl,
      smokeState: parsedSmokeState,
      unexpectedExternalRequests,
      fetchedSmokeModelCard,
      fetchedSmokeBrowserArtifact,
      fetchedOrtWasmRoute,
      evidenceFiles: [
        {
          type: "screenshot",
          path: projectRelative(screenshotPath),
          sha256: sha256File(screenshotPath),
          purpose: "Rendered hidden app smoke page after client-model browser ONNX inference",
        },
        {
          type: "network_log",
          path: projectRelative(networkPath),
          sha256: sha256File(networkPath),
          purpose: "Observed smoke model-card, ONNX artifact, and app-served ORT WASM requests",
        },
      ],
    };
  } finally {
    await browser.close();
  }
}

function buildReport({ appUrl, outputPath, browserResult, blockers }) {
  const smokeState = browserResult?.smokeState ?? null;
  return {
    schema_version: "asl-pilot-browser-onnx-wiring-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    evidence_mode: "smoke",
    finality: "smoke_only",
    tested_at: new Date().toISOString(),
    runner: {
      tool: "playwright",
      browser: browserResult?.browserVersion ?? "not-run",
      app_url: browserResult?.smokeUrl ?? `${appUrl}/smoke/browser-onnx`,
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_browser_onnx_wiring_smoke.mjs"),
    },
    smoke_model_card: referenceForFile(smokeModelCardPath),
    smoke_browser_artifact: referenceForFile(smokeArtifactPath),
    runtime: {
      package: "onnxruntime-web",
      version: packageVersion(),
      execution_provider: "wasm",
      app_wasm_route: "/api/ort/",
    },
    inference: {
      ran_browser_inference: smokeState?.status === "passed",
      expected_id: "hello",
      predicted_id: smokeState?.result?.predictedId ?? null,
      confidence: smokeState?.result?.confidence ?? null,
      model_status: smokeState?.result?.modelStatus ?? null,
      model_id: smokeState?.result?.modelId ?? null,
      input_shape: [1, 3, 3, 16, 16],
      logits_shape: [1, 2],
      client_validated_logits_against_label_count: smokeState?.status === "passed",
      result: smokeState?.result ?? null,
      frame_count: smokeState?.frame_count ?? null,
      image_size: smokeState?.image_size ?? null,
      page_status: smokeState?.status ?? "not-run",
      page_error: smokeState?.error ?? null,
    },
    network: {
      fetched_smoke_model_card: browserResult?.fetchedSmokeModelCard ?? false,
      fetched_smoke_browser_artifact: browserResult?.fetchedSmokeBrowserArtifact ?? false,
      fetched_ort_wasm_route: browserResult?.fetchedOrtWasmRoute ?? false,
      unexpected_external_requests: browserResult?.unexpectedExternalRequests ?? [],
    },
    evidence: {
      browser_files: browserResult?.evidenceFiles ?? [],
      source_files: [
        "scripts/run_browser_onnx_wiring_smoke.mjs",
        "scripts/audit_browser_onnx_wiring_smoke.mjs",
        "web/src/app/smoke/browser-onnx/page.tsx",
        "web/src/app/api/ort/[file]/route.ts",
        "web/src/lib/client-model.ts",
        "web/package-lock.json",
      ].map(fileReference),
    },
    final_evidence_exclusion: {
      excluded_from_completion: true,
      final_browser_smoke_report: "docs/validation/final-browser-onnx-smoke.json",
      reason: "This smoke uses a deterministic two-label fixture and is not trained ASL evidence.",
    },
    output: outputPath ? projectRelative(outputPath) : null,
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output ? resolveProjectPath(args.output, "--output") : defaultOutputPath;
  const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the browser ONNX wiring smoke");
  }
  if (!args.write) {
    smokeOutputDir = path.join(root, "output", "browser-onnx-wiring-smoke-live");
    smokeModelCardPath = path.join(smokeOutputDir, "model-card.json");
    smokeArtifactPath = path.join(smokeOutputDir, "asl-pilot-browser-onnx-wiring-smoke.onnx");
  }

  const modelCard = buildSmokeModelCard();
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(root, "web"),
    env: {
      ...process.env,
      ENABLE_DATASET_COLLECTION: "false",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "false",
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

  const blockers = [];
  let browserResult = null;
  try {
    await waitForApp(appUrl, child);
    browserResult = await runBrowserSmoke({ appUrl, headed: args.headed, modelCard });
    if (browserResult.smokeState?.status !== "passed") {
      blockers.push(`hidden browser ONNX smoke page status was ${browserResult.smokeState?.status ?? "missing"}`);
    }
    if (browserResult.smokeState?.result?.passed !== true) {
      blockers.push("evaluateLocalAttempt did not return a passed smoke result");
    }
    if (browserResult.smokeState?.result?.predictedId !== "hello") {
      blockers.push("smoke ONNX prediction did not select hello");
    }
    if (!browserResult.fetchedSmokeModelCard) blockers.push("browser did not fetch the smoke model card URL");
    if (!browserResult.fetchedSmokeBrowserArtifact) blockers.push("browser did not fetch the smoke ONNX artifact URL");
    if (!browserResult.fetchedOrtWasmRoute) blockers.push("browser did not fetch ONNX Runtime WASM from /api/ort/");
    if (browserResult.unexpectedExternalRequests.length > 0) {
      blockers.push("unexpected external browser requests were observed");
    }
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
  } finally {
    if (!args.keepServer) {
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        child.once("exit", resolve);
        setTimeout(resolve, 2_000);
      });
    }
  }

  const report = buildReport({ appUrl, outputPath: args.write ? outputPath : null, browserResult, blockers });
  report.server = {
    mode: "next_start",
    build_id_sha256: sha256File(buildIdPath),
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
    app_url: report.runner.app_url,
    blockers,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Browser ONNX wiring smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
