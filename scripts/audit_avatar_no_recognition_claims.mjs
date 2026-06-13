import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const files = [
  "web/src/components/CameraViewport.tsx",
  "web/src/components/LessonApp.tsx",
  "web/src/components/RobotMannequin3D.tsx",
  "web/src/lib/avatar-motion.ts",
  "web/src/lib/detector0-engine.ts",
  "web/src/lib/detector0-types.ts",
  "web/src/lib/use-camera-capture.ts",
];
const bannedPatterns = [
  { pattern: /\btracking active\b/i, reason: "claims live tracking" },
  { pattern: /\byou passed\b/i, reason: "claims the learner passed" },
  { pattern: /\bcorrect sign\b/i, reason: "claims sign correctness" },
  { pattern: /\bmatched the sign\b/i, reason: "claims sign match" },
  { pattern: /\bavatar.*pass(?:ed)?\b/i, reason: "makes avatar a pass/fail lane" },
];

const findings = [];
const checks = [];

for (const relativePath of files) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const matches = [];
  for (const { pattern, reason } of bannedPatterns) {
    if (pattern.test(source)) matches.push({ pattern: pattern.source, reason });
  }
  if (source.includes("pass-fail-decision") || source.includes("PassFailDecisionOutput")) {
    matches.push({
      pattern: "pass-fail-decision",
      reason: "imports pass/fail authority into lesson avatar path",
    });
  }
  if (relativePath.includes("avatar-motion") && !source.includes("recognitionAuthority: false")) {
    matches.push({
      pattern: "recognitionAuthority: false",
      reason: "avatar driver state must explicitly deny recognition authority",
    });
  }
  checks.push({
    id: relativePath,
    status: matches.length === 0 ? "passed" : "failed",
    matches,
  });
  for (const match of matches) {
    findings.push(`${relativePath}: ${match.reason} (${match.pattern})`);
  }
}

const summary = {
  status: findings.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers: findings,
};
console.log(JSON.stringify(summary, null, 2));

if (findings.length > 0) {
  console.error("Avatar recognition-claim audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
