import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "validation-page-smoke.json");
const requireFromWeb = createRequire(path.join(root, "web", "package.json"));
const { chromium } = requireFromWeb("playwright");

const evidencePaths = [
  "docs/validation/return-to-form-product-fallback-scope-design-v1.json",
  "docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json",
  "docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json",
  "docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json",
  "web/public/model/claim-matrix.json",
  "web/public/model/model-card.json",
  "web/public/model/browser-model-bundle.json",
];

const sourceFiles = [
  "web/src/app/validation/page.tsx",
  "web/src/app/globals.css",
  "web/public/model/claim-matrix.json",
  "web/public/model/model-card.json",
  "web/public/model/browser-model-bundle.json",
  "web/public/model/detector0-card.json",
];

const bannedClaimPatterns = [
  /\byou passed\b/i,
  /\bcorrect sign\b/i,
  /\bmatched the sign\b/i,
  /\btracking active\b/i,
  /\brecognition active\b/i,
  /\bfinal readiness achieved\b/i,
  /\bready for final validation\b/i,
];

function parseArgs(argv) {
  const args = {
    write: false,
    output: defaultOutputPath,
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
  node scripts/run_validation_page_smoke.mjs [--write] [--output docs/validation/validation-page-smoke.json]

Starts an isolated production Next.js server, opens /validation, and records
fail-closed evidence-link visibility without camera, training, or promotion.
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

async function textIsVisible(page, text) {
  const locator = page.getByText(text).first();
  await locator.waitFor({ timeout: 10_000 });
  return locator.isVisible();
}

async function runSmoke(appUrl) {
  const checks = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ baseURL: appUrl });
    const page = await context.newPage();
    await page.goto("/validation", { waitUntil: "networkidle" });

    const pageText = await page.locator("body").innerText();
    const titleVisible = await page.getByRole("heading", { name: "ASL Pilot Validation" }).isVisible();
    const matrixStatusVisible = await textIsVisible(page, "no_active_claim_rawframe_not_trained");
    const browserModelVisible = await textIsVisible(page, "not_trained");
    const cvSupportedVisible = await textIsVisible(page, "CV-supported labels");
    const learnOnlyVisible = await textIsVisible(page, "Learn-only prompts");
    addCheck(
      checks,
      "validation_route_renders",
      "/validation renders the fail-closed matrix summary",
      titleVisible && matrixStatusVisible && browserModelVisible && cvSupportedVisible && learnOnlyVisible,
      {
        title_visible: titleVisible,
        matrix_status_visible: matrixStatusVisible,
        browser_model_not_trained_visible: browserModelVisible,
        cv_supported_labels_visible: cvSupportedVisible,
        learn_only_prompts_visible: learnOnlyVisible,
      },
    );

    const evidencePanel = page.getByTestId("validation-evidence-links");
    const evidencePanelVisible = await evidencePanel.isVisible();
    const visibleEvidencePaths = [];
    for (const evidencePath of evidencePaths) {
      if (pageText.includes(evidencePath)) visibleEvidencePaths.push(evidencePath);
    }
    addCheck(
      checks,
      "evidence_links_visible",
      "M3BE/M3BF/M3BG/M3BH and runtime claim references are visible",
      evidencePanelVisible && visibleEvidencePaths.length === evidencePaths.length,
      {
        evidence_panel_visible: evidencePanelVisible,
        expected_paths: evidencePaths,
        visible_paths: visibleEvidencePaths,
      },
    );

    const publicHrefs = await evidencePanel.locator("a").evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean),
    );
    const publicLinkResults = [];
    for (const href of publicHrefs) {
      const response = await context.request.get(href);
      publicLinkResults.push({
        href,
        status: response.status(),
        ok: response.ok(),
      });
    }
    addCheck(
      checks,
      "public_runtime_links_fetchable",
      "Public runtime JSON links return successfully",
      publicLinkResults.length === 3 && publicLinkResults.every((result) => result.ok),
      { public_link_results: publicLinkResults },
    );

    const noPromotionCopyVisible = await textIsVisible(
      page,
      "without changing the browser model, final gates, or validation claims",
    );
    const noActiveClaimVisible = pageText.includes("There is no active CV claim.");
    addCheck(
      checks,
      "fail_closed_claims_visible",
      "Validation copy states fail-closed and no-promotion boundaries",
      noPromotionCopyVisible && noActiveClaimVisible,
      {
        no_promotion_copy_visible: noPromotionCopyVisible,
        no_active_cv_claim_visible: noActiveClaimVisible,
      },
    );

    const cameraSurfaceCounts = await page.evaluate(() => ({
      video: document.querySelectorAll("video").length,
      canvas: document.querySelectorAll("canvas").length,
      file_inputs: document.querySelectorAll('input[type="file"]').length,
      start_camera_buttons: Array.from(document.querySelectorAll("button")).filter((button) =>
        button.textContent?.toLowerCase().includes("start camera"),
      ).length,
      save_sample_buttons: Array.from(document.querySelectorAll("button")).filter((button) =>
        button.textContent?.toLowerCase().includes("save"),
      ).length,
    }));
    addCheck(
      checks,
      "no_camera_or_sample_controls",
      "Validation route does not expose camera, canvas, file, or sample controls",
      Object.values(cameraSurfaceCounts).every((count) => count === 0),
      cameraSurfaceCounts,
    );

    const bannedClaimsSeen = bannedClaimPatterns
      .filter((pattern) => pattern.test(pageText))
      .map((pattern) => pattern.source);
    addCheck(
      checks,
      "no_promotion_claims_absent",
      "Validation route does not render positive recognition or final-readiness claims",
      bannedClaimsSeen.length === 0,
      { banned_claim_patterns_seen: bannedClaimsSeen },
    );
  } finally {
    await browser.close();
  }

  return checks;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const outputPath = resolveProjectPath(args.output, "--output");
  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const child = spawn(
    "npm",
    ["--prefix", "web", "run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const serverOutput = [];
  child.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  child.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  let checks = [];
  let runError = null;
  try {
    await waitForApp(`${appUrl}/validation`, child);
    checks = await runSmoke(appUrl);
  } catch (error) {
    runError = error instanceof Error ? error.message : String(error);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }

  const blockers = checks.flatMap((check) => check.blockers ?? []);
  if (runError) blockers.push(runError);
  const report = {
    schema_version: "asl-pilot-validation-page-smoke/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    generated_at: new Date().toISOString(),
    app_url: appUrl,
    browser: {
      automation: "playwright",
      browser_name: "chromium",
      fake_media: false,
    },
    server: {
      mode: "next_start",
      output_tail: serverOutput.join("").split("\n").slice(-12),
    },
    checks,
    blockers,
    source_files: sourceFiles.map((source) => {
      const file = path.join(root, source);
      return {
        path: projectRelative(file),
        sha256: sha256File(file),
      };
    }),
  };

  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        output: args.write ? projectRelative(outputPath) : null,
        app_url: appUrl,
        checks: report.checks.map((check) => ({ id: check.id, status: check.status })),
        blockers: report.blockers,
      },
      null,
      2,
    ),
  );

  if (blockers.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
