import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const defaultAppUrl = "http://127.0.0.1:3025";
const defaultOutputPath = path.join(root, "docs", "validation", "final-browser-onnx-smoke.json");
const modelCardPath = path.join(root, "web", "public", "model", "model-card.json");
const webPackageJsonPath = path.join(root, "web", "package.json");
const exportReportPath = path.join(
  root,
  "web",
  "public",
  "model",
  "asl-pilot-rawframe-v0-export-provenance.json",
);
const ortDistPath = path.join(root, "web", "node_modules", "onnxruntime-web", "dist");
const ortWasmPrefix = "/api/ort/";
const finalBrowserSmokeRoute = "/smoke/browser-onnx?mode=final";

function parseArgs(argv) {
  const args = { appUrl: defaultAppUrl, write: false, writeOnPassOnly: false, headed: false };
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
    if (item === "--write-on-pass-only") {
      args.writeOnPassOnly = true;
      continue;
    }
    if (item === "--headed") {
      args.headed = true;
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
  node scripts/run_final_browser_onnx_smoke.mjs [--app-url http://127.0.0.1:3025] [--output docs/validation/final-browser-onnx-smoke.json] [--write] [--write-on-pass-only] [--headed]

Runs the exact trained model-card ONNX artifact through the app's browser client
model path in a real Chromium browser with onnxruntime-web WASM, records logits
shape and latency, and optionally writes the final browser ONNX smoke report.
Requires the local app to be running and the Playwright package to be installed
for this repo, for example:

  npm --prefix web install --save-dev playwright
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function validateReference(reference, context, blockers) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    blockers.push(`${context} must be an object`);
    return null;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    blockers.push(`${context}.path must be a non-empty string`);
    return null;
  }
  if (typeof reference.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
    blockers.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return null;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  if (!fs.existsSync(file)) {
    blockers.push(`${context}.path does not exist: ${reference.path}`);
    return null;
  }
  const actual = sha256File(file);
  if (reference.sha256 !== actual) {
    blockers.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
  return file;
}

function browserUrlForPublicPath(projectPath) {
  const publicPrefix = "web/public";
  if (!projectPath.startsWith(publicPrefix)) {
    throw new Error(`browser artifact must be under ${publicPrefix}: ${projectPath}`);
  }
  return projectPath.slice(publicPrefix.length);
}

function finalSmokeUrl(appUrl) {
  return new URL(finalBrowserSmokeRoute, new URL(appUrl).origin).href;
}

function packageVersion() {
  const packageJson = readJson(path.join(root, "web", "node_modules", "onnxruntime-web", "package.json"));
  return packageJson.version;
}

function finalPreflightCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    command: [command, ...args].join(" "),
    output: (result.stderr || result.stdout || "").trim(),
  };
}

function parseJsonText(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function preflight(appUrl) {
  const blockers = [];
  let servingPreflight = null;
  const packageJson = fs.existsSync(webPackageJsonPath) ? readJson(webPackageJsonPath) : null;
  const declaredPlaywright = packageJson?.devDependencies?.playwright
    ?? packageJson?.dependencies?.playwright
    ?? null;
  const modelCardExists = fs.existsSync(modelCardPath);
  const exportReportExists = fs.existsSync(exportReportPath);
  const modelCard = modelCardExists ? readJson(modelCardPath) : null;
  const exportReport = exportReportExists ? readJson(exportReportPath) : null;
  if (!modelCardExists) blockers.push("web/public/model/model-card.json is missing");
  if (!exportReportExists) blockers.push("web/public/model/asl-pilot-rawframe-v0-export-provenance.json is missing");
  if (!declaredPlaywright) {
    blockers.push("web/package.json must declare playwright for final browser ONNX smoke generation");
  }
  if (!fs.existsSync(path.join(root, "web", "node_modules", "playwright", "package.json"))) {
    blockers.push("web/node_modules/playwright is missing; run `npm --prefix web install` before final browser ONNX smoke generation");
  }
  for (const check of [
    finalPreflightCommand("node", ["scripts/audit_model_artifacts.mjs", "--require-trained"]),
    finalPreflightCommand("node", ["scripts/promote_trained_model_card.mjs", "--dry-run"]),
  ]) {
    if (!check.ok) {
      blockers.push(`${check.command} must pass before final browser ONNX smoke generation: ${check.output}`);
    }
  }
  if (modelCard && modelCard.status !== "trained") {
    blockers.push(`model-card status must be trained; found ${modelCard.status}`);
  }
  if (modelCard?.status === "trained") {
    if (!Number.isInteger(modelCard.model?.frame_count) || modelCard.model.frame_count <= 0) {
      blockers.push("trained model-card model.frame_count must be a positive integer");
    }
    if (!Number.isInteger(modelCard.model?.image_size) || modelCard.model.image_size <= 0) {
      blockers.push("trained model-card model.image_size must be a positive integer");
    }
    if (typeof modelCard.model?.input_name !== "string" || modelCard.model.input_name.trim().length === 0) {
      blockers.push("trained model-card model.input_name must be a non-empty string");
    }
    if (typeof modelCard.model?.output_name !== "string" || modelCard.model.output_name.trim().length === 0) {
      blockers.push("trained model-card model.output_name must be a non-empty string");
    }
    const labelCount = Object.keys(modelCard.model?.label_to_index ?? {}).length;
    if (labelCount < 75 || labelCount > 100) {
      blockers.push(`trained model-card label_to_index must contain 75-100 labels; found ${labelCount}`);
    }
  }
  if (exportReport && exportReport.status !== "exported") {
    blockers.push(`ONNX export provenance status must be exported; found ${exportReport.status}`);
  }
  if (exportReport && exportReport.finality !== "candidate_final_artifact") {
    blockers.push(`ONNX export provenance finality must be candidate_final_artifact; found ${exportReport.finality}`);
  }
  let parityFixtureFile = null;
  let parityFixture = null;
  if (exportReport) {
    if (!exportReport.browser_parity_fixture) {
      blockers.push("ONNX export provenance must include browser_parity_fixture");
    } else {
      parityFixtureFile = validateReference(
        exportReport.browser_parity_fixture,
        "ONNX export provenance browser_parity_fixture",
        blockers,
      );
      if (parityFixtureFile) parityFixture = readJson(parityFixtureFile);
    }
  }
  if (modelCard?.browser_artifact?.path && exportReport?.browser_artifact?.path) {
    if (modelCard.browser_artifact.path !== exportReport.browser_artifact.path) {
      blockers.push("model-card and ONNX export provenance browser_artifact.path must match");
    }
    if (modelCard.browser_artifact.sha256 !== exportReport.browser_artifact.sha256) {
      blockers.push("model-card and ONNX export provenance browser_artifact.sha256 must match");
    }
  }
  const artifactFile = modelCard?.browser_artifact
    ? validateReference(modelCard.browser_artifact, "model-card.browser_artifact", blockers)
    : null;
  if (!artifactFile && modelCard?.status === "trained") {
    blockers.push("trained model-card must include a hash-pinned browser_artifact");
  }
  if (!fs.existsSync(ortDistPath)) {
    blockers.push(`onnxruntime-web dist directory is missing: ${projectRelative(ortDistPath)}`);
  }
  if (blockers.length === 0) {
    servingPreflight = finalPreflightCommand("node", [
      "scripts/audit_final_browser_serving_preflight.mjs",
      "--app-url",
      appUrl,
    ]);
    if (!servingPreflight.ok) {
      blockers.push(`final browser serving preflight must pass before browser ONNX evidence: ${servingPreflight.output}`);
    }
  }
  return {
    blockers,
    modelCard,
    exportReport,
    artifactFile,
    parityFixture,
    parityFixtureFile,
    servingPreflight,
  };
}

async function loadPlaywright() {
  try {
    const requireFromWeb = createRequire(webPackageJsonPath);
    return requireFromWeb("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is required for final browser ONNX smoke generation. "
      + "Install it with `npm --prefix web install --save-dev playwright`, then rerun this command.",
      { cause: error },
    );
  }
}

async function runBrowserSmoke({ appUrl, headed, modelCard, parityFixture, parityFixtureSha256 }) {
  const { chromium } = await loadPlaywright();
  const unexpectedExternalRequests = [];
  const appOrigin = new URL(appUrl).origin;
  const smokeUrl = finalSmokeUrl(appUrl);
  const browserArtifactUrl = browserUrlForPublicPath(modelCard.browser_artifact.path);
  const browserArtifactHref = new URL(browserArtifactUrl, appOrigin).href;
  const responseRecordPromises = [];
  const responseRecordFailures = [];
  const finalOnnxRequests = [];
  const ortWasmRequests = [];

  const browser = await chromium.launch({ headless: !headed });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(
      ({ fixture, sha256 }) => {
        Object.defineProperty(window, "__ASL_FINAL_PARITY_FIXTURE__", {
          configurable: false,
          value: fixture,
        });
        Object.defineProperty(window, "__ASL_FINAL_PARITY_FIXTURE_SHA256__", {
          configurable: false,
          value: sha256,
        });
      },
      { fixture: parityFixture, sha256: parityFixtureSha256 },
    );
    page.on("request", (request) => {
      const url = request.url();
      if (url.startsWith("data:") || url.startsWith("blob:")) return;
      if (url.startsWith(`${appOrigin}${ortWasmPrefix}`)) return;
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
      const promise = (async () => {
        const url = response.url();
        const request = response.request();
        const parsed = new URL(url);
        const isFinalOnnx = url === browserArtifactHref;
        const isOrtWasm = url.startsWith(`${appOrigin}${ortWasmPrefix}`) && parsed.pathname.endsWith(".wasm");
        if (!isFinalOnnx && !isOrtWasm) return;
        const body = await response.body();
        const entry = {
          method: request.method(),
          url,
          resource_type: request.resourceType(),
          status: response.status(),
          ok: response.ok(),
          content_type: response.headers()["content-type"] ?? "",
          bytes: body.byteLength,
          sha256: sha256Buffer(body),
          same_origin: parsed.origin === appOrigin,
        };
        if (isFinalOnnx) finalOnnxRequests.push(entry);
        if (isOrtWasm) ortWasmRequests.push(entry);
      })().catch((error) => {
        responseRecordFailures.push(error instanceof Error ? error.message : String(error));
      });
      responseRecordPromises.push(promise);
    });
    await page.goto(smokeUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="browser-onnx-smoke-result"]');
      if (!element?.textContent) return false;
      try {
        const state = JSON.parse(element.textContent);
        return state.status && state.status !== "running";
      } catch {
        return false;
      }
    }, { timeout: 60_000 });
    const routeStateText = await page.locator('[data-testid="browser-onnx-smoke-result"]').textContent();
    const routeState = JSON.parse(routeStateText ?? "{}");
    if (routeState.status !== "passed") {
      throw new Error(`Final app browser ONNX smoke route failed: ${routeState.error ?? "unknown route error"}`);
    }
    const diagnostics = routeState.diagnostics;
    if (!diagnostics || diagnostics.ran_browser_inference !== true) {
      throw new Error("Final app browser ONNX smoke route did not return browser inference diagnostics");
    }
    if (diagnostics.client_model_path !== "web/src/lib/client-model.ts") {
      throw new Error("Final app browser ONNX smoke route did not prove the client-model.ts path");
    }
    if (diagnostics.app_route !== finalBrowserSmokeRoute) {
      throw new Error(`Final app browser ONNX smoke route marker must be ${finalBrowserSmokeRoute}`);
    }
    if (diagnostics.app_wasm_route !== ortWasmPrefix) {
      throw new Error(`Final app browser ONNX smoke route must use ${ortWasmPrefix}`);
    }
    if (diagnostics.parity?.status !== "passed") {
      throw new Error("Final app browser ONNX smoke route did not prove PyTorch/browser parity");
    }
    if (diagnostics.parity.fixture_sha256 !== parityFixtureSha256) {
      throw new Error("Final app browser ONNX smoke parity fixture hash did not match the export provenance fixture");
    }
    const evidenceDir = path.join(root, "output", "final-browser-evidence");
    fs.mkdirSync(evidenceDir, { recursive: true });
    const screenshotPath = path.join(evidenceDir, "final-browser-onnx-smoke.png");
    const networkPath = path.join(evidenceDir, "final-browser-onnx-smoke-network-log.json");
    await Promise.all(responseRecordPromises);
    if (responseRecordFailures.length > 0) {
      throw new Error(`Unable to record final browser network evidence: ${responseRecordFailures.join("; ")}`);
    }
    const matchedArtifactFetch = finalOnnxRequests.find((entry) => entry.sha256 === modelCard.browser_artifact.sha256);
    if (!matchedArtifactFetch) {
      throw new Error("Browser network evidence did not include the final ONNX artifact hash from the model card");
    }
    if (ortWasmRequests.length === 0) {
      throw new Error(`Browser network evidence did not include any ${ortWasmPrefix} WASM fetches`);
    }
    const inference = {
      ...diagnostics,
      browser_fetched_artifact_sha256: matchedArtifactFetch.sha256,
    };
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(networkPath, `${JSON.stringify({
      schema_version: "asl-pilot-final-browser-onnx-smoke-network-log/v2",
      app_url: smokeUrl,
      app_origin: appOrigin,
      browser: browser.version(),
      final_onnx_requests: finalOnnxRequests,
      ort_wasm_requests: ortWasmRequests,
      unexpected_external_requests: unexpectedExternalRequests,
      checked_at: new Date().toISOString(),
    }, null, 2)}\n`, "utf8");
    return {
      inference,
      smokeUrl,
      browserVersion: browser.version(),
      unexpectedExternalRequests,
      finalOnnxRequests,
      ortWasmRequests,
      evidenceFiles: [
        {
          type: "screenshot",
          path: projectRelative(screenshotPath),
          sha256: sha256File(screenshotPath),
          purpose: "Rendered app page during final browser ONNX runtime smoke",
        },
        {
          type: "network_log",
          path: projectRelative(networkPath),
          sha256: sha256File(networkPath),
          purpose: "Observed browser requests during final browser ONNX runtime smoke",
        },
      ],
    };
  } finally {
    await browser.close();
  }
}

function buildReport({ appUrl, status, blockers, browserResult, modelCard, exportReport, outputPath, servingPreflight }) {
  const browserArtifact = modelCard?.browser_artifact ?? { path: null, sha256: null };
  return {
    schema_version: "asl-pilot-final-browser-onnx-smoke/v1",
    status,
    tested_at: new Date().toISOString(),
    runner: {
      tool: "playwright",
      browser: browserResult?.browserVersion ?? "not-run",
      app_url: browserResult?.smokeUrl ?? finalSmokeUrl(appUrl),
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_final_browser_onnx_smoke.mjs"),
    },
    serving_preflight: servingPreflight
      ? {
        command: servingPreflight.command,
        status: servingPreflight.ok ? "passed" : "failed",
        output_sha256: sha256Text(servingPreflight.output),
        report: parseJsonText(servingPreflight.output),
      }
      : null,
    model_card: fileReference("web/public/model/model-card.json"),
    onnx_export_provenance: fileReference("web/public/model/asl-pilot-rawframe-v0-export-provenance.json"),
    browser_parity_fixture: exportReport?.browser_parity_fixture ?? { path: null, sha256: null },
    browser_artifact: {
      path: browserArtifact.path,
      sha256: browserArtifact.sha256,
    },
    runtime: {
      package: "onnxruntime-web",
      version: fs.existsSync(path.join(root, "web", "node_modules", "onnxruntime-web", "package.json"))
        ? packageVersion()
        : null,
      execution_provider: "wasm",
    },
    inference: browserResult?.inference ?? {
      ran_browser_inference: false,
      client_model_path: "web/src/lib/client-model.ts",
      app_route: finalBrowserSmokeRoute,
      app_wasm_route: ortWasmPrefix,
      input_shape: null,
      logits_shape: null,
      latency_ms: null,
    },
    network: {
      unexpected_external_requests: browserResult?.unexpectedExternalRequests ?? [],
      final_onnx_request_count: browserResult?.finalOnnxRequests?.length ?? 0,
      ort_wasm_request_count: browserResult?.ortWasmRequests?.length ?? 0,
    },
    evidence: {
      browser_files: browserResult?.evidenceFiles ?? [],
      source_files: [
        "scripts/run_final_browser_onnx_smoke.mjs",
        "web/src/lib/client-model.ts",
        "web/src/app/smoke/browser-onnx/page.tsx",
        "web/src/app/api/ort/[file]/route.ts",
        "web/public/model/model-card.json",
        "web/public/model/asl-pilot-rawframe-v0-export-provenance.json",
        exportReport?.browser_parity_fixture?.path,
        "web/package-lock.json",
      ].filter(Boolean).map(fileReference),
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
  const preflightResult = preflight(args.appUrl);
  const blockers = [...preflightResult.blockers];
  let browserResult = null;
  if (blockers.length === 0) {
    try {
      browserResult = await runBrowserSmoke({
        appUrl: args.appUrl,
        headed: args.headed,
        modelCard: preflightResult.modelCard,
        parityFixture: preflightResult.parityFixture,
        parityFixtureSha256: preflightResult.exportReport.browser_parity_fixture.sha256,
      });
      if (browserResult.unexpectedExternalRequests.length > 0) {
        blockers.push("unexpected external browser requests were observed");
      }
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
  }
  const report = buildReport({
    appUrl: args.appUrl,
    status: blockers.length === 0 ? "passed" : "failed",
    blockers,
    browserResult,
    modelCard: preflightResult.modelCard,
    exportReport: preflightResult.exportReport,
    outputPath: args.write ? outputPath : null,
    servingPreflight: preflightResult.servingPreflight,
  });
  const shouldWrite = args.write && (!args.writeOnPassOnly || report.status === "passed");
  if (shouldWrite) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: shouldWrite ? projectRelative(outputPath) : null,
    app_url: report.runner.app_url,
    blockers,
  }, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Final browser ONNX smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
