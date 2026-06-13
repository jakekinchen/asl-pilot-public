import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireSnippet(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  const status = missing.length === 0 ? "passed" : "failed";
  checks.push({ id, label, path: relativePath, status, missing });
  for (const snippet of missing) {
    findings.push(`${id}: ${relativePath} is missing ${JSON.stringify(snippet)}`);
  }
}

requireSnippet(
  "server_model_policy",
  "Attempt storage derives active model status from the shipped model card",
  "web/src/lib/server-store.ts",
  [
    "MODEL_CARD_PATH",
    "readPracticeModelPolicy",
    'status: "not_trained"',
    "modelPolicy.status === \"trained\"",
  ],
);

requireSnippet(
  "server_pass_normalization",
  "Attempt passes require trained active model, matching model id, matching predicted label, and threshold confidence",
  "web/src/lib/server-store.ts",
  [
    "clientMatchesActiveModel",
    "Boolean(input.passed)",
    "predictedId === expectedItem.id",
    "confidence >= modelPolicy.threshold",
  ],
);

requireSnippet(
  "not_trained_fail_closed",
  "Not-trained model cards cannot create saved passes or mastery",
  "web/src/lib/server-store.ts",
  [
    "server fail-closed because active model card is not_trained",
    "Automatic sign checking is not ready for this pilot yet. Your attempt was saved as practice history only.",
  ],
);

requireSnippet(
  "route_rejects_raw_media",
  "Attempt route still rejects raw media payloads before saving metadata",
  "web/src/app/api/attempts/route.ts",
  ["findBannedCameraPayloadKey", "Practice attempts may not upload raw camera data"],
);

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};

console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Attempt integrity audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
