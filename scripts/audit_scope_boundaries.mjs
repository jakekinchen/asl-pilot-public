import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function listFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(relativePath));
    } else {
      files.push(relativePath.split(path.sep).join("/"));
    }
  }
  return files;
}

const uiSource = [
  "web/src/components/PracticeApp.tsx",
  "web/src/lib/vocabulary.ts",
  "web/src/app/page.tsx",
].map(read).join("\n");
const learnerChromeSource = [
  "web/src/components/PracticeApp.tsx",
  "web/src/app/page.tsx",
].map(read).join("\n");
const docsSource = [
  "README.md",
  "docs/strategy-confidence-audit.md",
  "docs/acceptance-checklist.md",
  "docs/source-materials/requirements-matrix.md",
].map(read).join("\n");

const checks = [];
const blockers = [];

function addCheck(id, label, status, evidence, blockerItems = []) {
  checks.push({ id, label, status, evidence, blockers: blockerItems });
  for (const blocker of blockerItems) blockers.push(`${id}: ${blocker}`);
}

const requiredDocSnippets = [
  "ASL 1",
  "beginner",
  "controlled production pilot",
  "Production-scale public deployment is out of scope",
  "isolated beginner",
  "not attempt full sentence recognition",
  "Teacher/admin accounts, rostering, and SSO are out of scope",
];
const missingDocSnippets = requiredDocSnippets.filter((snippet) => !docsSource.toLowerCase().includes(snippet.toLowerCase()));
addCheck(
  "documented_scope",
  "Docs preserve ASL 1 beginner pilot scope and non-goals",
  missingDocSnippets.length === 0 ? "passed" : "failed",
  "README, strategy audit, acceptance checklist, and requirements matrix",
  missingDocSnippets.map((snippet) => `missing required scope text: ${snippet}`),
);

const requiredUiSnippets = [
  "Beginner ASL practice",
  "ASL-only",
  "isolated beginner vocabulary",
  "ASL 1 items",
  "Validation status",
];
const missingUiSnippets = requiredUiSnippets.filter((snippet) => !uiSource.includes(snippet));
addCheck(
  "learner_fit_ui",
  "Learner-facing UI names beginner ASL-only isolated-vocabulary scope",
  missingUiSnippets.length === 0 ? "passed" : "failed",
  "web/src/components/PracticeApp.tsx",
  missingUiSnippets.map((snippet) => `missing learner-scope UI text: ${snippet}`),
);

const forbiddenUiPatterns = [
  /\bBritish Sign Language\b/i,
  /\bBSL\b/,
  /\btranslate|translation|translator\b/i,
  /\bsentence|conversation|conversational|phrase\b/i,
  /\bteacher|administrator|admin|roster|rostering|SSO|Clever|Google Classroom\b/i,
  /\bresearch-grade|classroom-assessment-grade|public product|production-scale public deployment|public launch\b/i,
];
const forbiddenMatches = forbiddenUiPatterns
  .map((pattern) => {
    const match = learnerChromeSource.match(pattern);
    return match ? match[0] : null;
  })
  .filter(Boolean);
addCheck(
  "forbidden_ui_claims",
  "Learner-facing UI does not expose out-of-scope product claims or features",
  forbiddenMatches.length === 0 ? "passed" : "failed",
  "PracticeApp shell and app page, excluding vocabulary labels/categories",
  forbiddenMatches.map((match) => `forbidden UI term found: ${match}`),
);

const allowedAppFiles = new Set([
  "web/src/app/api/attempts/route.ts",
  "web/src/app/api/auth/login/route.ts",
  "web/src/app/api/auth/logout/route.ts",
  "web/src/app/api/auth/register/route.ts",
  "web/src/app/api/dataset/clips/route.ts",
  "web/src/app/api/dataset/coverage/route.ts",
  "web/src/app/api/dataset/plan/route.ts",
  "web/src/app/api/health/route.ts",
  "web/src/app/api/me/route.ts",
  "web/src/app/api/ort/[file]/route.ts",
  "web/src/app/api/progress/route.ts",
  "web/src/app/api/review/asl-citizen-primarymath-roi/contact-sheet/[label]/route.ts",
  "web/src/app/api/review/asl-citizen-primarymath-roi/route.ts",
  "web/src/app/auth/callback/route.ts",
  "web/src/app/error.tsx",
  "web/src/app/favicon.ico",
  "web/src/app/globals.css",
  "web/src/app/layout.tsx",
  "web/src/app/loading.tsx",
  "web/src/app/not-found.tsx",
  "web/src/app/page.tsx",
  "web/src/app/review/asl-citizen-primarymath-roi/page.tsx",
  "web/src/app/smoke/browser-onnx/layout.tsx",
  "web/src/app/smoke/browser-onnx/page.tsx",
  "web/src/app/validation/page.tsx",
]);
const appFiles = listFiles("web/src/app");
const unexpectedAppFiles = appFiles.filter((file) => !allowedAppFiles.has(file));
const forbiddenRoutePatterns = [
  /\badmin\b/i,
  /\bteacher\b/i,
  /\broster\b/i,
  /\bsso\b/i,
  /\bclassroom\b/i,
  /\btranslate|translation|translator\b/i,
  /\bconversation|sentence|phrase\b/i,
  /\bserver[-_/]?inference\b/i,
];
const forbiddenRouteMatches = appFiles
  .map((file) => forbiddenRoutePatterns.some((pattern) => pattern.test(file)) ? file : null)
  .filter(Boolean);
addCheck(
  "route_capability_inventory",
  "App routes stay inside the approved learner, auth, progress, ORT, smoke, and explicit dataset-collection surfaces",
  unexpectedAppFiles.length === 0 && forbiddenRouteMatches.length === 0 ? "passed" : "failed",
  "web/src/app route inventory",
  [
    ...unexpectedAppFiles.map((file) => `unexpected route/source file: ${file}`),
    ...forbiddenRouteMatches.map((file) => `out-of-scope route path: ${file}`),
  ],
);

console.log(JSON.stringify({
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers,
}, null, 2));

if (blockers.length > 0) {
  console.error("Scope boundary audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exitCode = 1;
}
