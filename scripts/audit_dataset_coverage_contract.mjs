import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const findings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireSnippets(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  const status = missing.length === 0 ? "passed" : "failed";
  checks.push({ id, label, path: relativePath, status, missing });
  for (const snippet of missing) {
    findings.push(`${id}: ${relativePath} is missing ${JSON.stringify(snippet)}`);
  }
}

function forbidSnippets(id, label, relativePath, snippets) {
  const source = read(relativePath);
  const present = snippets.filter((snippet) => source.includes(snippet));
  const status = present.length === 0 ? "passed" : "failed";
  checks.push({ id, label, path: relativePath, status, present });
  for (const snippet of present) {
    findings.push(`${id}: ${relativePath} still contains forbidden ${JSON.stringify(snippet)}`);
  }
}

requireSnippets(
  "coverage_separates_collection_from_export",
  "Coverage API separates consented clips from reviewed exportable clips",
  "web/src/lib/server-store.ts",
  [
    "consentedClips",
    "exportableClips",
    "labelReviewStatus === \"approved\"",
    "challengeReviewStatus === \"approved\"",
    "reviewContract",
  ],
);

requireSnippets(
  "coverage_ui_names_reviewed_state",
  "Collection UI names reviewed/exportable coverage instead of calling unreviewed clips usable",
  "web/src/components/DatasetCollectionPanel.tsx",
  [
    "reviewed clips",
    "reviewed signers",
    "reviewed labels",
    "consented clip(s)",
  ],
);

forbidSnippets(
  "coverage_ui_no_usable_label",
  "Collection UI does not label unreviewed collection as usable coverage",
  "web/src/components/DatasetCollectionPanel.tsx",
  ["usable clips", "usableChallengeClips", "usableClips"],
);

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
};

console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Dataset coverage contract audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
