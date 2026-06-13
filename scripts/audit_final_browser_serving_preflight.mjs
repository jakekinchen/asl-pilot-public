import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const defaultAppUrl = "http://127.0.0.1:3025";
const modelCardPath = path.join(root, "web", "public", "model", "model-card.json");
const buildIdPath = path.join(root, "web", ".next", "BUILD_ID");

function parseArgs(argv) {
  const args = { appUrl: defaultAppUrl };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--app-url") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.appUrl = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_final_browser_serving_preflight.mjs [--app-url http://127.0.0.1:3025]

Verifies that the final browser evidence target is a normal-practice app root
serving the current trained model-card bytes with dataset collection disabled.
Run this after the production web build is started with:

  ASL_PILOT_STORE_PATH=data/asl-pilot-store.json \\
  ENABLE_DATASET_COLLECTION=false \\
  NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false \\
  npm --prefix web run start -- --hostname 127.0.0.1 --port 3025
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function appUrlBlockers(appUrl) {
  const blockers = [];
  try {
    const parsed = new URL(appUrl);
    const localhost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !localhost) {
      blockers.push("app_url must use HTTPS or localhost/loopback for camera-capable browser evidence");
    }
    if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
      blockers.push("app_url must be the normal practice app root (/), with no alternate route, query, or hash");
    }
  } catch {
    blockers.push("app_url must be a valid URL");
  }
  return blockers;
}

async function requestText(appUrl, route) {
  const url = new URL(route, appUrl);
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return {
      ok: true,
      url: url.href,
      status: response.status,
      content_type: response.headers.get("content-type") ?? "",
      text,
      text_sha256: sha256Text(text),
      json,
    };
  } catch (error) {
    return {
      ok: false,
      url: url.href,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function addResponseBlockers(response, route, blockers) {
  if (!response.ok) {
    blockers.push(`GET ${route} failed: ${response.error}`);
    return false;
  }
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const blockers = [...appUrlBlockers(args.appUrl)];
  const checks = [];
  const localModelCard = fs.existsSync(modelCardPath) ? readJson(modelCardPath) : null;
  const localModelCardSha256 = fs.existsSync(modelCardPath) ? sha256File(modelCardPath) : null;
  const buildId = fs.existsSync(buildIdPath) ? fs.readFileSync(buildIdPath, "utf8").trim() : null;

  if (!buildId) {
    blockers.push("web/.next/BUILD_ID is missing; run `npm --prefix web run build` before final browser evidence");
  }
  if (!localModelCard) {
    blockers.push("web/public/model/model-card.json is missing");
  } else if (localModelCard.status !== "trained") {
    blockers.push(`local model-card status must be trained; found ${localModelCard.status}`);
  }

  if (blockers.length === 0) {
    const rootResponse = await requestText(args.appUrl, "/");
    checks.push({
      id: "practice_root",
      url: rootResponse.url,
      status: rootResponse.status ?? null,
      ok: rootResponse.ok && rootResponse.status === 200,
    });
    if (addResponseBlockers(rootResponse, "/", blockers) && rootResponse.status !== 200) {
      blockers.push(`GET / must return 200 from the normal practice app; got ${rootResponse.status}`);
    }

    const modelCardResponse = await requestText(args.appUrl, "/model/model-card.json");
    checks.push({
      id: "served_model_card",
      url: modelCardResponse.url,
      status: modelCardResponse.status ?? null,
      expected_sha256: localModelCardSha256,
      actual_sha256: modelCardResponse.text_sha256 ?? null,
      ok: modelCardResponse.ok
        && modelCardResponse.status === 200
        && modelCardResponse.text_sha256 === localModelCardSha256,
    });
    if (addResponseBlockers(modelCardResponse, "/model/model-card.json", blockers)) {
      if (modelCardResponse.status !== 200) {
        blockers.push(`GET /model/model-card.json must return 200; got ${modelCardResponse.status}`);
      }
      if (modelCardResponse.text_sha256 !== localModelCardSha256) {
        blockers.push("served /model/model-card.json SHA-256 must match web/public/model/model-card.json");
      }
      if (modelCardResponse.json?.status !== "trained") {
        blockers.push(`served model-card status must be trained; found ${modelCardResponse.json?.status ?? "missing"}`);
      }
    }

    const planResponse = await requestText(args.appUrl, "/api/dataset/plan");
    const planDisabled = planResponse.ok
      && planResponse.status === 403
      && typeof planResponse.json?.error === "string"
      && planResponse.json.error.includes("Dataset collection is disabled by default");
    checks.push({
      id: "dataset_plan_disabled",
      url: planResponse.url,
      status: planResponse.status ?? null,
      ok: planDisabled,
    });
    if (addResponseBlockers(planResponse, "/api/dataset/plan", blockers) && !planDisabled) {
      blockers.push("GET /api/dataset/plan must return the disabled-by-default 403 response for final normal-practice browser evidence");
    }
  }

  const report = {
    schema_version: "asl-pilot-final-browser-serving-preflight/v1",
    status: blockers.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    app_url: args.appUrl,
    build_id: buildId,
    model_card: {
      path: projectRelative(modelCardPath),
      sha256: localModelCardSha256,
      status: localModelCard?.status ?? null,
    },
    checks,
    blockers,
  };

  console.log(JSON.stringify(report, null, 2));
  return blockers.length === 0 ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Final browser serving preflight failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
