import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function hasAll(source, snippets) {
  return snippets.filter((snippet) => !source.includes(snippet));
}

const checks = [];
const blockers = [];

function check(id, label, missing) {
  const status = missing.length === 0 ? "passed" : "failed";
  checks.push({ id, label, status, missing });
  for (const item of missing) blockers.push(`${label}: missing ${item}`);
}

const progressRoute = read("web/src/app/api/progress/route.ts");
const serverStore = read("web/src/lib/server-store.ts");
const practiceApp = read("web/src/components/PracticeApp.tsx");

check(
  "progress_route",
  "Progress API returns the current user's progress contract",
  hasAll(progressRoute, [
    "getProgressForCurrentUser",
    "NextResponse.json(await getProgressForCurrentUser())",
  ]),
);

check(
  "progress_shape",
  "Server progress includes R33 attempted/pass/fail/count/mastery/recent fields",
  hasAll(serverStore, [
    "type ProgressItem",
    "vocabularyId: string",
    "attempts: number",
    "passes: number",
    "fails: number",
    'status: "not_started" | "in_progress" | "mastered"',
    "lastAttemptAt: string | null",
    "recentAttempts: StoredAttempt[]",
    "attempts.slice(0, 12)",
  ]),
);

check(
  "progress_derivation",
  "Server derives pass/fail counts and mastery from saved attempts",
  hasAll(serverStore, [
    "const itemAttempts = attempts.filter((attempt) => attempt.vocabularyId === item.id)",
    "const passes = itemAttempts.filter((attempt) => attempt.passed).length",
    "const fails = itemAttempts.length - passes",
    'status: passes >= 2 ? "mastered" : itemAttempts.length > 0 ? "in_progress" : "not_started"',
  ]),
);

check(
  "progress_ui",
  "Practice UI displays attempted/mastered counts, recent attempts, and per-item pass counts",
  hasAll(practiceApp, [
    "mastery.attempted",
    "mastery.mastered",
    "recentAttempts.length",
    "item.passes",
    "item.attempts",
    "No saved attempts yet.",
  ]),
);

const summary = {
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));
if (blockers.length > 0) {
  console.error("Progress contract audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exitCode = 1;
}
