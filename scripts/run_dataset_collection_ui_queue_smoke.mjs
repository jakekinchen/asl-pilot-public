import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "validation", "dataset-collection-ui-queue-smoke.json");
const retainedOutputDir = path.join(root, "output", "dataset-collection-ui-queue-smoke");
const liveOutputDir = path.join(root, "output", "dataset-collection-ui-queue-smoke-live");
const activeQueuePath = path.join(root, "data", "dataset", "canonical-verifier-010-collection-queue.json");
const webRequire = createRequire(path.join(root, "web", "package.json"));
const { chromium } = webRequire("playwright");

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
  node scripts/run_dataset_collection_ui_queue_smoke.mjs [--write] [--output docs/validation/dataset-collection-ui-queue-smoke.json]

Starts the built Next.js app in explicit dataset-collection mode and verifies
the authenticated operator UI auto-loads the active canonical queue's first
assignment. This does not start a camera, save clips, review clips, export
manifests, train weights, or promote a browser model.
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

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function referenceForFile(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function createTempPaths(outputDir) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  return {
    storePath: path.join(outputDir, "store.json"),
    clipRoot: path.join(outputDir, "clips"),
    screenshotPath: path.join(outputDir, "canonical-queue-ui.png"),
  };
}

function check(condition, blockers, message) {
  if (!condition) blockers.push(message);
}

async function runSmoke(appUrl, paths) {
  const blockers = [];
  const expectedQueue = readJson(activeQueuePath);
  const expectedFirst = expectedQueue.queue?.[0] ?? {};
  const expectedFirstLabel = expectedFirst.display_text ?? expectedFirst.label_id ?? "";
  const expectedPrompt = expectedFirstLabel ? `Sign ${String(expectedFirstLabel).toUpperCase()}.` : "";
  const recordButtonName = new RegExp(`Record ${escapeRegExp(expectedFirstLabel)}`, "i");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const email = `ui-queue-smoke-${Date.now()}-${crypto.randomUUID()}@example.test`;
  try {
    await page.goto(appUrl, { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Name" }).fill("Queue UI Smoke");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill("ui-queue-smoke-password");
    await page.getByRole("button", { name: /Open studio/ }).click();

    await page.getByRole("combobox", { name: "Collection assignment" }).waitFor({ timeout: 10_000 });
    await page.waitForFunction(() => {
      const input = document.querySelector('input[placeholder="signer-001"]');
      return input instanceof HTMLInputElement && input.value === "signer-001";
    }, null, { timeout: 10_000 });
    await page.getByText("Queue #1").waitFor({ timeout: 10_000 });
    await page.getByText("canonical_verifier_vocabulary").waitFor({ timeout: 10_000 });
    await page.getByText("10 labels").waitFor({ timeout: 10_000 });
    await page.getByText("235/235 queued").waitFor({ timeout: 10_000 });
    const planPicker = page.locator(".plan-picker");
    await planPicker.scrollIntoViewIfNeeded();

    const selectedOptionText = await page.locator('select[aria-label="Collection assignment"] option:checked').textContent();
    const signerAlias = await page.getByRole("textbox", { name: "Signer alias" }).inputValue();
    const bodyText = await page.locator("body").innerText();
    const recordButtonText = await page.getByRole("button", { name: recordButtonName }).textContent().catch(() => null);
    const recordButtonDisabled = await page.getByRole("button", { name: recordButtonName }).isDisabled().catch(() => false);
    const selectOptionSummary = await page.locator('select[aria-label="Collection assignment"]').evaluate((select) => {
      if (!(select instanceof HTMLSelectElement)) {
        return { count: 0, first: null, last: null, hasNonQueuedOption: true };
      }
      const options = [...select.options].map((option) => option.textContent ?? "");
      return {
        count: options.length,
        first: options[0] ?? null,
        last: options.at(-1) ?? null,
        hasNonQueuedOption: options.some((option) => !option.startsWith("#")),
      };
    });
    const showsQueueNumber = await page.getByText("Queue #1").isVisible();
    const showsCanonicalBucket = await page.getByText("canonical_verifier_vocabulary").isVisible();
    const showsPriorityLabelCount = await page.getByText("10 labels").isVisible();
    const showsCanonicalQueueAssignmentCount = await page.getByText("235/235 queued").isVisible();
    await planPicker.screenshot({ path: paths.screenshotPath });

    check(showsCanonicalQueueAssignmentCount, blockers, "operator UI must show the 235-assignment active canonical queue count");
    check(showsQueueNumber, blockers, "operator UI must show Queue #1 for the selected assignment");
    check(showsCanonicalBucket, blockers, "operator UI must show the canonical verifier priority bucket");
    check(showsPriorityLabelCount, blockers, "operator UI must show the 10-label priority queue summary");
    check(selectOptionSummary.count === 235, blockers, "collection assignment dropdown must default to the 235 active canonical queue rows");
    check(selectOptionSummary.hasNonQueuedOption === false, blockers, "collection assignment dropdown must hide non-queued full-plan assignments by default");
    check(
      selectedOptionText?.startsWith(`#1 · ${expectedFirst.assignment_key} · ${titleCase(expectedFirst.split)} · ${expectedFirst.signer_alias} · ${expectedFirstLabel}`) === true,
      blockers,
      "selected collection assignment must be the active Tier-1 queue row",
    );
    check(signerAlias === expectedFirst.signer_alias, blockers, "first canonical queue assignment must auto-load the expected signer");
    check(bodyText.includes(expectedPrompt), blockers, "practice prompt must auto-load the first active queue label");
    check(recordButtonText?.includes(`Record ${expectedFirstLabel}`) === true, blockers, "record button must target the first active queue label after auto-load");
    check(recordButtonDisabled === true, blockers, "record button must stay disabled without camera and consent");

    return {
      status: blockers.length === 0 ? "passed" : "failed",
      blockers,
      checks: {
        selected_option_text: selectedOptionText,
        select_option_count: selectOptionSummary.count,
        select_first_option_text: selectOptionSummary.first,
        select_last_option_text: selectOptionSummary.last,
        select_has_non_queued_option: selectOptionSummary.hasNonQueuedOption,
        signer_alias: signerAlias,
        shows_canonical_queue_assignment_count: showsCanonicalQueueAssignmentCount,
        shows_queue_number: showsQueueNumber,
        shows_canonical_bucket: showsCanonicalBucket,
        shows_priority_label_count: showsPriorityLabelCount,
        prompt_loaded_first_queue_label: bodyText.includes(expectedPrompt),
        record_button_text: recordButtonText,
        record_button_disabled: recordButtonDisabled,
        expected_first_queue_assignment_key: expectedFirst.assignment_key ?? null,
        expected_first_queue_label_id: expectedFirst.label_id ?? null,
        expected_first_queue_display_text: expectedFirstLabel,
      },
      screenshot: referenceForFile(paths.screenshotPath),
    };
  } finally {
    await browser.close();
  }
}

function titleCase(value) {
  const text = String(value ?? "");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function buildReport({ appUrl, outputPath, paths, smoke, server }) {
  return {
    schema_version: "asl-pilot-dataset-collection-ui-queue-smoke/v1",
    status: smoke.status,
    evidence_mode: "operator_ui_smoke",
    finality: "queue_ready_not_training_data",
    tested_at: new Date().toISOString(),
    runner: {
      tool: "playwright",
      app_url: appUrl,
      command: [process.execPath, ...process.argv],
      script: fileReference("scripts/run_dataset_collection_ui_queue_smoke.mjs"),
    },
    inputs: {
      collection_plan: fileReference("data/dataset/collection-plan.json"),
      active_collection_queue: fileReference("data/dataset/canonical-verifier-010-collection-queue.json"),
      model_card: fileReference("web/public/model/model-card.json"),
    },
    runtime_env: {
      ENABLE_DATASET_COLLECTION: "true",
      NEXT_PUBLIC_ENABLE_DATASET_COLLECTION: "true",
      ASL_PILOT_AUTH_PROVIDER: "local",
      ASL_PILOT_STORE_PATH: projectRelative(paths.storePath),
      ASL_PILOT_DATASET_CLIP_ROOT: projectRelative(paths.clipRoot),
      ASL_PILOT_COLLECTION_PLAN_PATH: "unset: default real collection plan",
      ASL_PILOT_REMEDIATION_QUEUE_PATH: "unset: default active canonical queue candidate",
    },
    collection_ui: {
      authenticated_operator_session: smoke.checks.signer_alias !== null,
      auto_loaded_first_canonical_assignment: smoke.checks.selected_option_text?.startsWith(`#1 · ${smoke.checks.expected_first_queue_assignment_key}`) === true &&
        smoke.checks.signer_alias !== null &&
        smoke.checks.prompt_loaded_first_queue_label === true,
      selected_option_text: smoke.checks.selected_option_text,
      select_option_count: smoke.checks.select_option_count,
      select_has_non_queued_option: smoke.checks.select_has_non_queued_option,
      shows_canonical_queue_assignment_count: smoke.checks.shows_canonical_queue_assignment_count,
      shows_queue_number: smoke.checks.shows_queue_number,
      shows_canonical_bucket: smoke.checks.shows_canonical_bucket,
      shows_priority_label_count: smoke.checks.shows_priority_label_count,
      record_button_text: smoke.checks.record_button_text,
      record_button_disabled_without_camera_and_consent: smoke.checks.record_button_disabled,
      screenshot: smoke.screenshot,
    },
    final_evidence_exclusion: {
      excluded_from_model_completion: true,
      reason: "This smoke verifies operator UI routing only. It does not start a camera, collect clips, approve evidence, export manifests, train weights, or promote a model.",
    },
    evidence: {
      source_files: [
        "scripts/run_dataset_collection_ui_queue_smoke.mjs",
        "web/src/components/DatasetCollectionPanel.tsx",
        "web/src/app/api/dataset/plan/route.ts",
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
    throw new Error("Missing web/.next/BUILD_ID; run npm --prefix web run build before the dataset collection UI queue smoke");
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
    smoke = await runSmoke(appUrl, paths);
  } catch (error) {
    smoke = {
      status: "failed",
      blockers: [error instanceof Error ? error.message : String(error)],
      checks: {},
      screenshot: referenceForFile(paths.screenshotPath),
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
  if (args.write) writeJson(outputPath, report);
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(outputPath) : null,
    app_url: appUrl,
    blockers: report.blockers,
    selected_option_text: report.collection_ui.selected_option_text,
  }, null, 2));
  return report.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Dataset collection UI queue smoke failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
